// ═══════════════════════════════════════════════════════════════
//  Sample extraction from ROM images
//
//  Console music is not stored as audio — it is sequence data driving a
//  sound chip, plus a bank of instrument samples. Those samples *are* real
//  audio, and on the SNES they use BRR (Bit Rate Reduction), a simple and
//  well-documented ADPCM variant that can be decoded exactly.
//
//  BRR block layout, 9 bytes each:
//    byte 0   ssss ffle   s = shift/range, f = filter, l = loop, e = end
//    byte 1-8 sixteen signed 4-bit nibbles
//
//  Each nibble is shifted, then a 2-tap predictor filter is applied using
//  the previous two output samples. A run of blocks ends when a header has
//  its end flag set.
// ═══════════════════════════════════════════════════════════════
const BRR = (function () {
  'use strict';

  const clamp16 = v => v < -32768 ? -32768 : v > 32767 ? 32767 : v;

  // Decode one 9-byte block. `prev` carries the two previous output samples
  // across blocks, which the filters depend on.
  function decodeBlock(data, off, prev, out, outPos) {
    const header = data[off];
    const shift  = header >> 4;
    const filter = (header >> 2) & 3;
    let p1 = prev[0], p2 = prev[1];

    for (let i = 0; i < 16; i++) {
      const byte = data[off + 1 + (i >> 1)];
      let nib = (i & 1) ? (byte & 0x0F) : (byte >> 4);
      if (nib > 7) nib -= 16;                       // signed 4-bit

      // shift 13-15 are invalid on hardware and collapse to the sign
      let s = shift <= 12 ? (nib << shift) >> 1 : (nib < 0 ? -2048 : 0);

      switch (filter) {
        case 1: s += p1 + ((-p1) >> 4); break;
        case 2: s += (p1 << 1) + ((-((p1 << 1) + p1)) >> 5) - p2 + (p2 >> 4); break;
        case 3: s += (p1 << 1) + ((-(p1 * 13)) >> 6) - p2 + ((p2 * 3) >> 4); break;
      }
      s = clamp16(s);
      out[outPos + i] = s;
      p2 = p1; p1 = s;
    }
    prev[0] = p1; prev[1] = p2;
    return { end: (header & 1) !== 0, loop: (header & 2) !== 0 };
  }

  // Decode a run of blocks starting at `off`, stopping at the end flag.
  function decodeRun(data, off, maxBlocks) {
    maxBlocks = maxBlocks || 4096;
    const out = new Int16Array(maxBlocks * 16);
    const prev = [0, 0];
    let blocks = 0, looped = false;
    while (blocks < maxBlocks && off + 9 <= data.length) {
      const r = decodeBlock(data, off, prev, out, blocks * 16);
      off += 9; blocks++;
      if (r.loop) looped = true;
      if (r.end) break;
    }
    return { samples: out.subarray(0, blocks * 16), blocks, looped };
  }

  // A run is plausible when every header has a valid shift, it terminates
  // with an end flag, and it is long enough to be a real instrument rather
  // than a coincidence. Short runs are where the false positives live.
  function runLength(data, off, minBlocks, maxBlocks) {
    let blocks = 0;
    while (blocks < maxBlocks) {
      const p = off + blocks * 9;
      if (p + 9 > data.length) return 0;
      const header = data[p];
      if ((header >> 4) > 12) return 0;             // invalid shift
      blocks++;
      if (header & 1) return blocks >= minBlocks ? blocks : 0;
    }
    return 0;
  }

  function scan(data, opts) {
    opts = opts || {};
    const minBlocks = opts.minBlocks || 12;         // >= 192 samples
    const maxBlocks = opts.maxBlocks || 2048;
    const limit     = opts.limit     || 400;
    const found = [];

    for (let off = 0; off + 9 <= data.length && found.length < limit; ) {
      const blocks = runLength(data, off, minBlocks, maxBlocks);
      if (blocks) {
        found.push({ offset: off, blocks, samples: blocks * 16 });
        off += blocks * 9;                          // do not re-detect inside a run
      } else {
        off++;
      }
    }
    return found;
  }

  // Raw PCM, for consoles that stream unencoded samples to a DAC. No format
  // to key off, so this is a manual window rather than a detector.
  function decodePCM(data, off, length, signed, bits) {
    const n = Math.min(length, data.length - off);
    if (n <= 0) return new Int16Array(0);
    if (bits === 16) {
      const out = new Int16Array(n >> 1);
      for (let i = 0; i < out.length; i++) {
        const v = data[off + i*2] | (data[off + i*2 + 1] << 8);
        out[i] = signed ? (v << 16 >> 16) : (v - 32768);
      }
      return out;
    }
    const out = new Int16Array(n);
    for (let i = 0; i < n; i++) {
      const b = data[off + i];
      out[i] = signed ? ((b << 24 >> 24) << 8) : ((b - 128) << 8);
    }
    return out;
  }

  const toFloat = int16 => {
    const f = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) f[i] = int16[i] / 32768;
    return f;
  };

  return { decodeBlock, decodeRun, runLength, scan, decodePCM, toFloat };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = BRR;
