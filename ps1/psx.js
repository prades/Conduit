// ═══════════════════════════════════════════════════════════════
//  PlayStation (R3000A) emulator core
//
//  The PS1 is a far more tractable target than the N64: a 32-bit MIPS I
//  CPU with no 64-bit instructions, and a fixed-function GPU with a small
//  documented command set — nothing to reverse-engineer per game. That
//  makes it possible to go past a CPU interpreter and actually rasterise.
//
//  Implemented: full MIPS I integer set with R3000A load-delay semantics,
//  COP0 and exceptions, the memory map, DMA (OTC + GPU linked-list and
//  block), and a GPU covering the common GP0 primitives into a real 1 MB
//  VRAM that is drawn to a canvas.
//
//  Not implemented: the GTE (COP2 arithmetic), SPU, CD-ROM, MDEC, timers,
//  controllers. Those are stubbed and counted rather than faked, so the
//  debugger can tell you exactly what a program tried to use.
// ═══════════════════════════════════════════════════════════════
const PSX = (function () {
  'use strict';

  // ── memory ───────────────────────────────────────────────────
  const RAM_SIZE = 2 * 1024 * 1024;
  const ram      = new Uint8Array(RAM_SIZE);
  const scratch  = new Uint8Array(1024);
  let   bios     = null;                      // Uint8Array, 512 KB

  const VRAM_W = 1024, VRAM_H = 512;
  const vram = new Uint16Array(VRAM_W * VRAM_H);

  // ── CPU state ────────────────────────────────────────────────
  // R3000A has a visible load delay slot: the instruction *after* a load
  // still sees the old register value. Two register files plus a pending
  // load slot reproduce that exactly.
  let regs    = new Int32Array(32);
  let outRegs = new Int32Array(32);
  let loadIdx = 0, loadVal = 0;

  let pc = 0, nextPC = 0, currentPC = 0;
  let branchTaken = false, inDelaySlot = false;
  let hi = 0, lo = 0;
  const cop0 = new Int32Array(32);
  const gte  = new Int32Array(64);            // register moves only

  let cycles = 0, halted = false, haltMsg = '';
  const unimplemented = Object.create(null);  // opcode name -> count

  const REGNAME = ['zero','at','v0','v1','a0','a1','a2','a3','t0','t1','t2','t3',
    't4','t5','t6','t7','s0','s1','s2','s3','s4','s5','s6','s7','t8','t9',
    'k0','k1','gp','sp','fp','ra'];
  const COP0NAME = {3:'BPC',5:'BDA',6:'JUMPDEST',7:'DCIC',8:'BadVaddr',9:'BDAM',
    11:'BPCM',12:'SR',13:'CAUSE',14:'EPC',15:'PRID'};

  function note(what) { unimplemented[what] = (unimplemented[what] || 0) + 1; }

  // ── GPU ──────────────────────────────────────────────────────
  const gpu = {
    stat: 0x14802000,
    cmd: [], need: 0, handler: null,
    // draw state
    offX: 0, offY: 0,
    clipX0: 0, clipY0: 0, clipX1: 1023, clipY1: 511,
    // display state
    dispX: 0, dispY: 0, dispW: 320, dispH: 240, dispEnabled: true,
    // CPU -> VRAM transfer
    xfer: null,
    prims: 0,
  };

  const clamp = (v, lo_, hi_) => v < lo_ ? lo_ : v > hi_ ? hi_ : v;

  function vramSet(x, y, c) {
    if (x < gpu.clipX0 || x > gpu.clipX1 || y < gpu.clipY0 || y > gpu.clipY1) return;
    if (x < 0 || x >= VRAM_W || y < 0 || y >= VRAM_H) return;
    vram[y * VRAM_W + x] = c;
  }
  const rgb24to15 = (r, g, b) => ((b >> 3) << 10) | ((g >> 3) << 5) | (r >> 3);

  function fillRect(x, y, w, h, colour) {
    x &= 0x3F0; y &= 0x1FF;
    w = ((w & 0x7FF) + 15) & ~15; h &= 0x1FF;
    const c = rgb24to15(colour & 0xFF, (colour >> 8) & 0xFF, (colour >> 16) & 0xFF);
    for (let j = 0; j < h; j++) {
      const yy = (y + j) & 0x1FF;
      for (let i = 0; i < w; i++) vram[yy * VRAM_W + ((x + i) & 0x3FF)] = c;
    }
    gpu.prims++;
  }

  // Flat / Gouraud triangle by half-space test. Enough for the 2D work the
  // BIOS and most menus do; textures are approximated by their base colour.
  function triangle(v) {                       // v = [{x,y,c}, ...] ×3
    const minX = clamp(Math.min(v[0].x, v[1].x, v[2].x), gpu.clipX0, gpu.clipX1);
    const maxX = clamp(Math.max(v[0].x, v[1].x, v[2].x), gpu.clipX0, gpu.clipX1);
    const minY = clamp(Math.min(v[0].y, v[1].y, v[2].y), gpu.clipY0, gpu.clipY1);
    const maxY = clamp(Math.max(v[0].y, v[1].y, v[2].y), gpu.clipY0, gpu.clipY1);
    const area = (v[1].x - v[0].x) * (v[2].y - v[0].y) - (v[2].x - v[0].x) * (v[1].y - v[0].y);
    if (area === 0) return;
    const s = area < 0 ? -1 : 1;
    const A = Math.abs(area);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const w0 = ((v[2].x - v[1].x) * (y - v[1].y) - (v[2].y - v[1].y) * (x - v[1].x)) * s;
        const w1 = ((v[0].x - v[2].x) * (y - v[2].y) - (v[0].y - v[2].y) * (x - v[2].x)) * s;
        const w2 = ((v[1].x - v[0].x) * (y - v[0].y) - (v[1].y - v[0].y) * (x - v[0].x)) * s;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue;
        const r = (w0 * (v[0].c & 0xFF)         + w1 * (v[1].c & 0xFF)         + w2 * (v[2].c & 0xFF))         / A;
        const g = (w0 * ((v[0].c >> 8) & 0xFF)  + w1 * ((v[1].c >> 8) & 0xFF)  + w2 * ((v[2].c >> 8) & 0xFF))  / A;
        const b = (w0 * ((v[0].c >> 16) & 0xFF) + w1 * ((v[1].c >> 16) & 0xFF) + w2 * ((v[2].c >> 16) & 0xFF)) / A;
        vramSet(x, y, rgb24to15(r | 0, g | 0, b | 0));
      }
    }
    gpu.prims++;
  }

  function solidRect(x, y, w, h, colour) {
    const c = rgb24to15(colour & 0xFF, (colour >> 8) & 0xFF, (colour >> 16) & 0xFF);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) vramSet(x + i, y + j, c);
    gpu.prims++;
  }

  const sx = w => { const v = w & 0x7FF; return (v << 21 >> 21) + gpu.offX; };
  const sy = w => { const v = (w >> 16) & 0x7FF; return (v << 21 >> 21) + gpu.offY; };

  function gp0(word) {
    // mid-transfer words go straight into VRAM
    if (gpu.xfer) {
      for (let half = 0; half < 2; half++) {
        const c = (word >>> (half * 16)) & 0xFFFF;
        const t = gpu.xfer;
        vram[((t.y + t.cy) & 0x1FF) * VRAM_W + ((t.x + t.cx) & 0x3FF)] = c;
        if (++t.cx >= t.w) { t.cx = 0; if (++t.cy >= t.h) { gpu.xfer = null; break; } }
      }
      return;
    }

    if (gpu.need === 0) {
      gpu.cmd = [word];
      const op = word >>> 24;
      if (op === 0x00 || op === 0x01 || op === 0x03) return;            // nop / cache
      if (op === 0x02) { gpu.need = 2; gpu.handler = 'fill'; return; }
      if (op >= 0x20 && op <= 0x3F) {                                    // polygons
        const gouraud = (op & 0x10) !== 0, quad = (op & 0x08) !== 0, tex = (op & 0x04) !== 0;
        const verts = quad ? 4 : 3;
        gpu.need = verts * (1 + (tex ? 1 : 0) + (gouraud ? 1 : 0)) - (gouraud ? 1 : 0);
        gpu.handler = 'poly'; gpu.meta = { gouraud, quad, tex, verts };
        return;
      }
      if (op >= 0x40 && op <= 0x5F) { gpu.need = 2; gpu.handler = 'line'; return; }
      if (op >= 0x60 && op <= 0x7F) {                                    // rectangles
        const tex = (op & 0x04) !== 0, size = (op >> 3) & 3;
        gpu.need = 1 + (tex ? 1 : 0) + (size === 0 ? 1 : 0);
        gpu.handler = 'rect'; gpu.meta = { tex, size };
        return;
      }
      if (op === 0xA0) { gpu.need = 2; gpu.handler = 'toVram'; return; }
      if (op === 0xC0) { gpu.need = 2; gpu.handler = 'fromVram'; return; }
      if (op >= 0xE1 && op <= 0xE6) { applyDrawSetting(word); return; }
      note('GP0 ' + op.toString(16));
      return;
    }

    gpu.cmd.push(word);
    if (--gpu.need > 0) return;
    runGp0();
  }

  function applyDrawSetting(w) {
    const op = w >>> 24;
    if (op === 0xE3) { gpu.clipX0 = w & 0x3FF;        gpu.clipY0 = (w >> 10) & 0x1FF; }
    if (op === 0xE4) { gpu.clipX1 = w & 0x3FF;        gpu.clipY1 = (w >> 10) & 0x1FF; }
    if (op === 0xE5) { gpu.offX = (w & 0x7FF) << 21 >> 21; gpu.offY = ((w >> 11) & 0x7FF) << 21 >> 21; }
  }

  function runGp0() {
    const c = gpu.cmd, op = c[0] >>> 24;
    switch (gpu.handler) {
      case 'fill':
        fillRect(c[1] & 0xFFFF, (c[1] >>> 16) & 0x1FF, c[2] & 0xFFFF, (c[2] >>> 16) & 0x1FF, c[0] & 0xFFFFFF);
        break;
      case 'poly': {
        const m = gpu.meta, verts = [];
        let i = 1, colour = c[0] & 0xFFFFFF;
        for (let n = 0; n < m.verts; n++) {
          if (m.gouraud && n > 0) colour = c[i++] & 0xFFFFFF;
          const p = c[i++];
          if (m.tex) i++;                       // texture coords: not sampled
          verts.push({ x: sx(p), y: sy(p), c: colour });
        }
        triangle([verts[0], verts[1], verts[2]]);
        if (m.quad) triangle([verts[1], verts[2], verts[3]]);
        break;
      }
      case 'rect': {
        const m = gpu.meta;
        let i = 1;
        const p = c[i++];
        if (m.tex) i++;
        let w = 1, h = 1;
        if (m.size === 0) { const s = c[i++]; w = s & 0xFFFF; h = (s >>> 16) & 0xFFFF; }
        else if (m.size === 1) { w = h = 1; }
        else if (m.size === 2) { w = h = 8; }
        else { w = h = 16; }
        solidRect(sx(p), sy(p), w, h, c[0] & 0xFFFFFF);
        break;
      }
      case 'toVram': {
        const w = ((c[2] & 0xFFFF) - 1 & 0x3FF) + 1;
        const h = (((c[2] >>> 16) & 0x1FF) - 1 & 0x1FF) + 1;
        gpu.xfer = { x: c[1] & 0x3FF, y: (c[1] >>> 16) & 0x1FF, w, h, cx: 0, cy: 0 };
        break;
      }
      case 'fromVram': break;                   // reads are not wired up
      case 'line': break;                       // rarely load-bearing for 2D
      default: note('GP0 handler ' + op.toString(16));
    }
    gpu.handler = null; gpu.need = 0;
  }

  function gp1(word) {
    const op = word >>> 24, p = word & 0xFFFFFF;
    switch (op) {
      case 0x00: gpu.cmd = []; gpu.need = 0; gpu.xfer = null;
                 gpu.offX = gpu.offY = 0; gpu.clipX0 = gpu.clipY0 = 0;
                 gpu.clipX1 = 1023; gpu.clipY1 = 511; break;
      case 0x01: gpu.cmd = []; gpu.need = 0; break;
      case 0x03: gpu.dispEnabled = (p & 1) === 0; break;
      case 0x05: gpu.dispX = p & 0x3FF; gpu.dispY = (p >> 10) & 0x1FF; break;
      case 0x08: {
        gpu.dispW = [256, 320, 512, 640][p & 3];
        if (p & 0x40) gpu.dispW = 368;
        gpu.dispH = (p & 4) ? 480 : 240;
        break;
      }
      default: break;                           // ack / dma dir / ranges: no-ops here
    }
  }

  // ── address translation + bus ────────────────────────────────
  // KUSEG, KSEG0 and KSEG1 all reach the same physical memory; masking the
  // top three bits is the whole of it on this machine.
  const REGION_MASK = [0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF,
                       0x7FFFFFFF, 0x1FFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF];
  const phys = a => (a & REGION_MASK[(a >>> 29) & 7]) >>> 0;

  const dma = new Int32Array(0x20);

  function read32(addr) {
    const a = phys(addr);
    if (a < RAM_SIZE) return (ram[a] | (ram[a+1] << 8) | (ram[a+2] << 16) | (ram[a+3] << 24)) >>> 0;
    if (a >= 0x1FC00000 && a < 0x1FC80000) {
      if (!bios) return 0;
      const o = a - 0x1FC00000;
      return (bios[o] | (bios[o+1] << 8) | (bios[o+2] << 16) | (bios[o+3] << 24)) >>> 0;
    }
    if (a >= 0x1F800000 && a < 0x1F800400) {
      const o = a - 0x1F800000;
      return (scratch[o] | (scratch[o+1] << 8) | (scratch[o+2] << 16) | (scratch[o+3] << 24)) >>> 0;
    }
    if (a === 0x1F801810) return 0;                       // GPUREAD
    if (a === 0x1F801814) return gpu.stat >>> 0;          // GPUSTAT
    if (a >= 0x1F801080 && a < 0x1F801100) return dma[(a - 0x1F801080) >> 2] >>> 0;
    if (a >= 0x1F801000 && a < 0x1F803000) { note('IO read ' + a.toString(16)); return 0; }
    if (a >= 0x1F000000 && a < 0x1F800000) return 0xFFFFFFFF;
    note('read32 ' + a.toString(16));
    return 0;
  }

  function write32(addr, v) {
    const a = phys(addr);
    v = v >>> 0;
    if (cop0[12] & 0x10000) return;                        // cache isolated
    if (a < RAM_SIZE) {
      ram[a] = v; ram[a+1] = v >>> 8; ram[a+2] = v >>> 16; ram[a+3] = v >>> 24;
      return;
    }
    if (a >= 0x1F800000 && a < 0x1F800400) {
      const o = a - 0x1F800000;
      scratch[o] = v; scratch[o+1] = v >>> 8; scratch[o+2] = v >>> 16; scratch[o+3] = v >>> 24;
      return;
    }
    if (a === 0x1F801810) { gp0(v); return; }
    if (a === 0x1F801814) { gp1(v); return; }
    if (a >= 0x1F801080 && a < 0x1F801100) { dmaWrite(a, v); return; }
    if (a >= 0x1F801000 && a < 0x1F803000) { note('IO write ' + a.toString(16)); return; }
    note('write32 ' + a.toString(16));
  }

  function read8(addr) {
    const a = phys(addr);
    if (a < RAM_SIZE) return ram[a];
    if (a >= 0x1FC00000 && a < 0x1FC80000) return bios ? bios[a - 0x1FC00000] : 0;
    if (a >= 0x1F800000 && a < 0x1F800400) return scratch[a - 0x1F800000];
    if (a >= 0x1F000000 && a < 0x1F800000) return 0xFF;
    note('read8 ' + a.toString(16));
    return 0;
  }
  function read16(addr) { return (read8(addr) | (read8(addr + 1) << 8)) & 0xFFFF; }

  function write8(addr, v) {
    const a = phys(addr);
    if (cop0[12] & 0x10000) return;
    if (a < RAM_SIZE) { ram[a] = v & 0xFF; return; }
    if (a >= 0x1F800000 && a < 0x1F800400) { scratch[a - 0x1F800000] = v & 0xFF; return; }
    if (a >= 0x1F801000 && a < 0x1F803000) { note('IO write8 ' + a.toString(16)); return; }
    note('write8 ' + a.toString(16));
  }
  function write16(addr, v) {
    const a = phys(addr);
    if (cop0[12] & 0x10000) return;
    if (a < RAM_SIZE) { ram[a] = v & 0xFF; ram[a+1] = (v >>> 8) & 0xFF; return; }
    if (a >= 0x1F800000 && a < 0x1F800400) {
      const o = a - 0x1F800000; scratch[o] = v & 0xFF; scratch[o+1] = (v >>> 8) & 0xFF; return;
    }
    if (a >= 0x1F801000 && a < 0x1F803000) { note('IO write16 ' + a.toString(16)); return; }
    note('write16 ' + a.toString(16));
  }

  // ── DMA ──────────────────────────────────────────────────────
  // Channel 6 builds the ordering table; channel 2 walks it and feeds GP0.
  // Between them they carry essentially all 2D drawing.
  function dmaWrite(a, v) {
    const i = (a - 0x1F801080) >> 2;
    dma[i] = v | 0;
    const ch = (a - 0x1F801080) >> 4;
    const reg = ((a - 0x1F801080) >> 2) & 3;
    if (ch < 7 && reg === 2 && (v & 0x01000000)) runDma(ch);
  }

  function runDma(ch) {
    const base = ch * 4;
    const madr = dma[base] >>> 0;
    const bcr  = dma[base + 1] >>> 0;
    const chcr = dma[base + 2] >>> 0;
    const sync = (chcr >>> 9) & 3;

    if (ch === 6) {                                        // OTC: backward link list
      let count = bcr & 0xFFFF; if (count === 0) count = 0x10000;
      let addr = madr & 0x1FFFFC;
      for (let n = 0; n < count; n++) {
        const next = (n === count - 1) ? 0xFFFFFF : ((addr - 4) & 0x1FFFFC);
        ram[addr] = next; ram[addr+1] = next >>> 8; ram[addr+2] = next >>> 16; ram[addr+3] = next >>> 24;
        addr = (addr - 4) & 0x1FFFFC;
      }
    } else if (ch === 2) {
      if (sync === 2) {                                    // linked list -> GP0
        let addr = madr & 0x1FFFFC, guard = 0;
        while (guard++ < 200000) {
          const header = read32(addr);
          let words = header >>> 24;
          while (words-- > 0) { addr = (addr + 4) & 0x1FFFFC; gp0(read32(addr)); }
          const next = header & 0xFFFFFF;
          if (next & 0x800000) break;
          addr = next & 0x1FFFFC;
        }
      } else {                                             // block transfer
        const bs = bcr & 0xFFFF, blocks = sync === 1 ? (bcr >>> 16) : 1;
        let addr = madr & 0x1FFFFC;
        let words = (bs === 0 ? 0x10000 : bs) * (blocks === 0 ? 1 : blocks);
        while (words-- > 0) { gp0(read32(addr)); addr = (addr + 4) & 0x1FFFFC; }
      }
    } else {
      note('DMA ch' + ch);
    }
    dma[base + 2] = chcr & ~0x01000000;                    // clear the trigger
  }

  // ── exceptions ───────────────────────────────────────────────
  function exception(cause) {
    const handler = (cop0[12] & 0x400000) ? 0xBFC00180 : 0x80000080;
    const mode = cop0[12] & 0x3F;
    cop0[12] = (cop0[12] & ~0x3F) | ((mode << 2) & 0x3F);
    cop0[13] = cause << 2;
    cop0[14] = inDelaySlot ? (currentPC - 4) | 0 : currentPC;
    if (inDelaySlot) cop0[13] |= 0x80000000;
    pc = handler | 0; nextPC = (pc + 4) | 0;
  }

  // ── disassembler ─────────────────────────────────────────────
  const SPECIAL = {0:'SLL',2:'SRL',3:'SRA',4:'SLLV',6:'SRLV',7:'SRAV',8:'JR',9:'JALR',
    12:'SYSCALL',13:'BREAK',16:'MFHI',17:'MTHI',18:'MFLO',19:'MTLO',24:'MULT',25:'MULTU',
    26:'DIV',27:'DIVU',32:'ADD',33:'ADDU',34:'SUB',35:'SUBU',36:'AND',37:'OR',38:'XOR',
    39:'NOR',42:'SLT',43:'SLTU'};
  const OPS = {2:'J',3:'JAL',4:'BEQ',5:'BNE',6:'BLEZ',7:'BGTZ',8:'ADDI',9:'ADDIU',
    10:'SLTI',11:'SLTIU',12:'ANDI',13:'ORI',14:'XORI',15:'LUI',32:'LB',33:'LH',34:'LWL',
    35:'LW',36:'LBU',37:'LHU',38:'LWR',40:'SB',41:'SH',42:'SWL',43:'SW',46:'SWR',
    48:'LWC0',49:'LWC1',50:'LWC2',56:'SWC0',57:'SWC1',58:'SWC2'};
  const R = i => '$' + REGNAME[i];
  const s16 = w => (w & 0x8000) ? (w & 0xFFFF) - 0x10000 : (w & 0xFFFF);
  const sh = n => (n < 0 ? '-0x' : '0x') + Math.abs(n).toString(16).toUpperCase();
  const hex8 = n => (n >>> 0).toString(16).toUpperCase().padStart(8, '0');

  function disasm(insn, addr) {
    insn = insn >>> 0;
    if (insn === 0) return ['NOP', ''];
    const op = insn >>> 26, rs = (insn >>> 21) & 31, rt = (insn >>> 16) & 31;
    const rd = (insn >>> 11) & 31, sa = (insn >>> 6) & 31, fn = insn & 63;
    const imm = insn & 0xFFFF, si = s16(insn);
    const br = (addr + 4 + si * 4) >>> 0;
    const jt = (((addr + 4) & 0xF0000000) | ((insn & 0x3FFFFFF) << 2)) >>> 0;

    if (op === 0) {
      const m = SPECIAL[fn]; if (!m) return ['???', '.word 0x' + hex8(insn)];
      if (fn === 0 || fn === 2 || fn === 3) return [m, `${R(rd)}, ${R(rt)}, ${sa}`];
      if (fn === 4 || fn === 6 || fn === 7) return [m, `${R(rd)}, ${R(rt)}, ${R(rs)}`];
      if (fn === 8) return [m, R(rs)];
      if (fn === 9) return [m, rd === 31 ? R(rs) : `${R(rd)}, ${R(rs)}`];
      if (fn === 12 || fn === 13) return [m, ''];
      if (fn === 16 || fn === 18) return [m, R(rd)];
      if (fn === 17 || fn === 19) return [m, R(rs)];
      if (fn >= 24 && fn <= 27) return [m, `${R(rs)}, ${R(rt)}`];
      return [m, `${R(rd)}, ${R(rs)}, ${R(rt)}`];
    }
    if (op === 1) {
      const m = { 0:'BLTZ', 1:'BGEZ', 16:'BLTZAL', 17:'BGEZAL' }[rt] || 'BCONDZ';
      return [m, `${R(rs)}, 0x${hex8(br)}`];
    }
    if (op === 16 || op === 18) {
      const c = op - 16;
      if (rs === 0)  return [`MFC${c}`, `${R(rt)}, ${c === 0 ? (COP0NAME[rd] || '$' + rd) : '$' + rd}`];
      if (rs === 2)  return [`CFC${c}`, `${R(rt)}, $${rd}`];
      if (rs === 4)  return [`MTC${c}`, `${R(rt)}, ${c === 0 ? (COP0NAME[rd] || '$' + rd) : '$' + rd}`];
      if (rs === 6)  return [`CTC${c}`, `${R(rt)}, $${rd}`];
      if (op === 16 && (insn & 0x3F) === 16) return ['RFE', ''];
      return [`COP${c}`, '0x' + (insn & 0x1FFFFFF).toString(16).toUpperCase()];
    }
    const m = OPS[op]; if (!m) return ['???', '.word 0x' + hex8(insn)];
    if (op === 2 || op === 3) return [m, '0x' + hex8(jt)];
    if (op === 4 || op === 5) return [m, `${R(rs)}, ${R(rt)}, 0x${hex8(br)}`];
    if (op === 6 || op === 7) return [m, `${R(rs)}, 0x${hex8(br)}`];
    if (op === 15) return [m, `${R(rt)}, 0x${imm.toString(16).toUpperCase()}`];
    if (op >= 32) return [m, `${R(rt)}, ${sh(si)}(${R(rs)})`];
    return [m, `${R(rt)}, ${R(rs)}, ${sh(si)}`];
  }

  // ── interpreter ──────────────────────────────────────────────
  const setReg = (i, v) => { outRegs[i] = v | 0; outRegs[0] = 0; };
  const delayedLoad = (i, v) => { loadIdx = i; loadVal = v | 0; };

  function step() {
    if (halted || (!bios && !loaded)) return false;

    const insn = read32(pc) >>> 0;
    currentPC = pc;
    if (currentPC & 3) { exception(4); return true; }        // address error on fetch
    pc = nextPC;
    nextPC = (nextPC + 4) | 0;

    // The load issued one instruction ago is committed into outRegs, so it
    // only becomes visible to the *next* instruction — this is the R3000A
    // load delay slot. Writing it into regs here would expose it a cycle early.
    outRegs[loadIdx] = loadVal; outRegs[0] = 0;
    loadIdx = 0; loadVal = 0;

    inDelaySlot = branchTaken;
    branchTaken = false;

    const op = insn >>> 26, rs = (insn >>> 21) & 31, rt = (insn >>> 16) & 31;
    const rd = (insn >>> 11) & 31, sa = (insn >>> 6) & 31, fn = insn & 63;
    const imm = insn & 0xFFFF, si = s16(insn);
    const S = regs[rs], T = regs[rt];
    const branch = () => { nextPC = (currentPC + 4 + si * 4) | 0; branchTaken = true; };

    switch (op) {
      case 0: switch (fn) {
        case 0:  setReg(rd, T << sa); break;
        case 2:  setReg(rd, T >>> sa); break;
        case 3:  setReg(rd, T >> sa); break;
        case 4:  setReg(rd, T << (S & 31)); break;
        case 6:  setReg(rd, T >>> (S & 31)); break;
        case 7:  setReg(rd, T >> (S & 31)); break;
        case 8:  nextPC = S | 0; branchTaken = true; break;
        case 9:  setReg(rd, (currentPC + 8) | 0); nextPC = S | 0; branchTaken = true; break;
        case 12: exception(8); return true;                   // SYSCALL
        case 13: exception(9); return true;                   // BREAK
        case 16: setReg(rd, hi); break;
        case 17: hi = S; break;
        case 18: setReg(rd, lo); break;
        case 19: lo = S; break;
        case 24: { const p = BigInt(S) * BigInt(T);           // MULT (64-bit product)
                   lo = Number(BigInt.asIntN(32, p)); hi = Number(BigInt.asIntN(32, p >> 32n)); break; }
        case 25: { const p = BigInt(S >>> 0) * BigInt(T >>> 0);
                   lo = Number(BigInt.asIntN(32, p)); hi = Number(BigInt.asIntN(32, p >> 32n)); break; }
        case 26:                                              // DIV, with the hardware's edge cases
          if (T === 0) { hi = S; lo = S >= 0 ? -1 : 1; }
          else if (S === -0x80000000 && T === -1) { hi = 0; lo = -0x80000000; }
          else { lo = (S / T) | 0; hi = (S % T) | 0; }
          break;
        case 27:
          if ((T >>> 0) === 0) { hi = S; lo = -1; }
          else { lo = ((S >>> 0) / (T >>> 0)) | 0; hi = ((S >>> 0) % (T >>> 0)) | 0; }
          break;
        case 32: { const r = S + T;                            // ADD traps on overflow
                   if (((S ^ r) & (T ^ r)) < 0) { exception(12); return true; }
                   setReg(rd, r); break; }
        case 33: setReg(rd, (S + T) | 0); break;
        case 34: { const r = S - T;
                   if (((S ^ T) & (S ^ r)) < 0) { exception(12); return true; }
                   setReg(rd, r); break; }
        case 35: setReg(rd, (S - T) | 0); break;
        case 36: setReg(rd, S & T); break;
        case 37: setReg(rd, S | T); break;
        case 38: setReg(rd, S ^ T); break;
        case 39: setReg(rd, ~(S | T)); break;
        case 42: setReg(rd, S < T ? 1 : 0); break;
        case 43: setReg(rd, (S >>> 0) < (T >>> 0) ? 1 : 0); break;
        default: halt('unimplemented SPECIAL ' + fn + ' at 0x' + hex8(currentPC)); return false;
      } break;

      case 1: {
        const link = (rt & 0x1E) === 0x10, ge = (rt & 1) === 1;
        const take = ge ? S >= 0 : S < 0;
        if (link) setReg(31, (currentPC + 8) | 0);
        if (take) branch();
        break;
      }
      case 2: nextPC = (((currentPC + 4) & 0xF0000000) | ((insn & 0x3FFFFFF) << 2)) | 0; branchTaken = true; break;
      case 3: setReg(31, (currentPC + 8) | 0);
              nextPC = (((currentPC + 4) & 0xF0000000) | ((insn & 0x3FFFFFF) << 2)) | 0; branchTaken = true; break;
      case 4: if (S === T) branch(); break;
      case 5: if (S !== T) branch(); break;
      case 6: if (S <= 0) branch(); break;
      case 7: if (S > 0)  branch(); break;

      case 8: { const r = S + si;                              // ADDI traps on overflow
                if (((S ^ r) & (si ^ r)) < 0) { exception(12); return true; }
                setReg(rt, r); break; }
      case 9:  setReg(rt, (S + si) | 0); break;
      case 10: setReg(rt, S < si ? 1 : 0); break;
      case 11: setReg(rt, (S >>> 0) < (si >>> 0) ? 1 : 0); break;
      case 12: setReg(rt, S & imm); break;
      case 13: setReg(rt, S | imm); break;
      case 14: setReg(rt, S ^ imm); break;
      case 15: setReg(rt, imm << 16); break;

      case 32: delayedLoad(rt, (read8 (S + si) << 24) >> 24); break;
      case 33: delayedLoad(rt, (read16(S + si) << 16) >> 16); break;
      case 35: { const a = (S + si) | 0;
                 if (a & 3) { exception(4); return true; }
                 delayedLoad(rt, read32(a) | 0); break; }
      case 36: delayedLoad(rt, read8 (S + si)); break;
      case 37: delayedLoad(rt, read16(S + si)); break;
      case 34: {                                               // LWL / LWR merge with
        const a = (S + si) | 0;                                // the pending load target
        const cur = (loadIdx === rt) ? loadVal : regs[rt];
        const w = read32(a & ~3), sft = (a & 3) * 8;
        delayedLoad(rt, ((cur & (0x00FFFFFF >>> sft)) | (w << (24 - sft))) | 0);
        break;
      }
      case 38: {
        const a = (S + si) | 0;
        const cur = (loadIdx === rt) ? loadVal : regs[rt];
        const w = read32(a & ~3), sft = (a & 3) * 8;
        delayedLoad(rt, ((cur & (0xFFFFFF00 << (24 - sft))) | (w >>> sft)) | 0);
        break;
      }
      case 40: write8 (S + si, T); break;
      case 41: write16(S + si, T); break;
      case 43: { const a = (S + si) | 0;
                 if (a & 3) { exception(4); return true; }
                 write32(a, T); break; }
      case 42: { const a = (S + si) | 0, sft = (a & 3) * 8;
                 const w = read32(a & ~3);
                 write32(a & ~3, ((w & (0xFFFFFF00 << sft)) | (T >>> (24 - sft))) | 0); break; }
      case 46: { const a = (S + si) | 0, sft = (a & 3) * 8;
                 const w = read32(a & ~3);
                 write32(a & ~3, ((w & (0x00FFFFFF >>> (24 - sft))) | (T << sft)) | 0); break; }

      case 16:                                                 // COP0
        if (rs === 0) delayedLoad(rt, cop0[rd]);
        else if (rs === 4) cop0[rd] = T;
        else if ((insn & 0x3F) === 16) {                        // RFE
          const m = cop0[12] & 0x3F;
          cop0[12] = (cop0[12] & ~0xF) | (m >>> 2);
        } else note('COP0 rs=' + rs);
        break;
      case 18:                                                 // COP2 (GTE)
        if (rs === 0) delayedLoad(rt, gte[rd]);
        else if (rs === 2) delayedLoad(rt, gte[rd + 32]);
        else if (rs === 4) gte[rd] = T;
        else if (rs === 6) gte[rd + 32] = T;
        else note('GTE op 0x' + (insn & 0x1FFFFFF).toString(16));
        break;
      case 50: delayedLoad(0, 0); note('LWC2'); break;
      case 58: note('SWC2'); break;
      case 17: case 49: case 57: exception(11); return true;    // no COP1 on this machine

      default:
        halt('unimplemented opcode ' + op + ' (0x' + hex8(insn) + ') at 0x' + hex8(currentPC));
        return false;
    }

    regs.set(outRegs);
    regs[0] = 0; outRegs[0] = 0;
    cycles++;
    return true;
  }

  function halt(msg) { halted = true; haltMsg = msg; }

  // ── loading ──────────────────────────────────────────────────
  let loaded = false;

  function reset() {
    regs = new Int32Array(32); outRegs = new Int32Array(32);
    loadIdx = 0; loadVal = 0;
    hi = lo = 0; cycles = 0; halted = false; haltMsg = '';
    branchTaken = inDelaySlot = false;
    cop0.fill(0); cop0[15] = 0x00000002;                       // PRID
    gte.fill(0);
    for (const k in unimplemented) delete unimplemented[k];
    pc = 0xBFC00000 | 0; nextPC = (pc + 4) | 0;
  }

  function loadBIOS(bytes) {
    bios = bytes.length >= 0x80000 ? bytes.subarray(0, 0x80000) : bytes;
    loaded = true;
    reset();
  }

  // PS-EXE: 2 KB header, then the image. Simple enough that homebrew can be
  // run directly, without a disc or a BIOS.
  function loadEXE(bytes) {
    const tag = String.fromCharCode.apply(null, bytes.subarray(0, 8));
    if (tag !== 'PS-X EXE') return { ok: false, why: 'Not a PS-EXE (magic was "' + tag + '")' };
    const rd32 = o => (bytes[o] | (bytes[o+1] << 8) | (bytes[o+2] << 16) | (bytes[o+3] << 24)) >>> 0;
    const entry = rd32(0x10), gp = rd32(0x14);
    const dest  = rd32(0x18), size = rd32(0x1C);
    const spBase = rd32(0x30), spOff = rd32(0x34);

    reset();
    ram.fill(0);
    const target = phys(dest);
    for (let i = 0; i < size && 0x800 + i < bytes.length && target + i < RAM_SIZE; i++) {
      ram[target + i] = bytes[0x800 + i];
    }
    pc = entry | 0; nextPC = (pc + 4) | 0;
    regs[28] = gp | 0;
    if (spBase !== 0) { regs[29] = regs[30] = (spBase + spOff) | 0; }
    else { regs[29] = regs[30] = 0x801FFF00 | 0; }
    outRegs.set(regs);
    loaded = true;
    return { ok: true, entry, dest, size, gp, sp: regs[29] >>> 0 };
  }

  // ── display ──────────────────────────────────────────────────
  function drawTo(ctx, canvas) {
    const w = gpu.dispW, h = gpu.dispH;
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const img = ctx.createImageData(w, h);
    const d = img.data;
    for (let y = 0; y < h; y++) {
      const src = ((gpu.dispY + y) & 0x1FF) * VRAM_W;
      for (let x = 0; x < w; x++) {
        const c = vram[src + ((gpu.dispX + x) & 0x3FF)];
        const o = (y * w + x) * 4;
        d[o]     = (c & 0x1F) << 3;
        d[o + 1] = ((c >> 5) & 0x1F) << 3;
        d[o + 2] = ((c >> 10) & 0x1F) << 3;
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  return {
    reset, step, disasm, loadBIOS, loadEXE, drawTo,
    read8, read16, read32, write32,
    get pc()      { return pc >>> 0; },
    get regs()    { return regs; },
    get hi()      { return hi; },
    get lo()      { return lo; },
    get cop0()    { return cop0; },
    get cycles()  { return cycles; },
    get halted()  { return halted; },
    get haltMsg() { return haltMsg; },
    get hasBIOS() { return !!bios; },
    get ready()   { return loaded; },
    get prims()   { return gpu.prims; },
    get gpu()     { return gpu; },
    get vram()    { return vram; },
    get unimplemented() { return unimplemented; },
    REGNAME, COP0NAME,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = PSX;
