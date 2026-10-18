// ─────────────────────────────────────────────────────────
//  THE LAB WALL — bulky equipment standing out of the back wall (docs/WALL-GRID.md, "the look")
// ─────────────────────────────────────────────────────────
// ASKED: "restyle the paneling on the side: a dark laboratory, evil", then: "3D-ish, with thick computer screens, generators, servers, test chambers, bulky control panels that come off the wall", and picked option 5,
// AMBER OLD-TECH: beige-black chunky cabinets, amber monochrome screens, big dials, a forgotten lab.
//
// Every wall tile of the back wall (row -2) carries a piece of equipment that stands out of it into the lane by LAB_DEPTH of a tile: servers, CRT screens (single and stacked), consoles with a raised monitor, pipe runs and,
// on a pair of tiles, a generator, a test chamber with something in it or a wide console. Which piece stands where is a fixed function of the tile's x (labModuleAt), so a wall never changes. A zone's POWER UNIT
// (js/wallunit.js) is ONE bulky battery bank across two wall slots (usually its third and fourth tile): two shelves of three glass tubes, one tube a cell (filling in the element's colour, an empty bay, a wreck) and three tier lamps on top. The other
// four tiles of its six are ordinary wall equipment: the cells are logical, the machine is what you see and tap. Nothing stands where a nest's vortex is painted or where a wall panel can be hacked.
//
// Each piece is a SPRITE drawn once (labSprite) and stamped, in the depth-sorted pass (js/game.js: a 'labmod' item sorts just in front of its own wall tile), so units walk in front of it and the frame pays one drawImage a tile.
const LAB = { steel: "#4a4538", steel2: "#2c2920", screen: "#ffb43a", screen2: "#ffe07a", accent: "#ff5a2a", lamp: "#ffd870", glass: "#d0c070", core: "#ffa030", hazard: "#9a8a20" };
const LAB_DEPTH = 0.38;          // how far (tiles) the equipment stands out of the wall
const LAB_W = 112, LAB_H = 184, LAB_OX = 34, LAB_OY = 140;   // a one-tile sprite; the origin is where the wall's foot meets the floor
const LAB_FILL_STEPS = 10;       // a capacitor's charge is drawn in tenths

// ── which piece stands on which tile ──
function _labHash(n) { n = (n + 0x9e3779b9) | 0; n ^= n >>> 16; n = Math.imul(n, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); n ^= n >>> 16; return n >>> 0; }
// A tile that keeps its own wall: a nest's vortex, a hackable panel, the camp behind the Crystal.
function labTileFree(x) {
    if (x < 0) return false;
    if (typeof _wallPanelMap !== "undefined" && _wallPanelMap && _wallPanelMap.get(x)) return false;
    const nests = typeof _nestCache !== "undefined" && _nestCache.length ? _nestCache : [];
    for (const n of nests) if (n.y === -1 && Math.abs(x - n.x) <= 1) return false;
    return true;
}
function _labIsUnit(x) { return typeof isWallUnitTile === "function" && isWallUnitTile({ type: "wall_back", x, y: -2 }); }
// The two tiles the power unit's machine stands on (usually its third and fourth tile; js/wallunit.js wallUnitMachineOffset): 1 for the first, 2 for the second, 0 for any other.
function _labMachine(x) { if (!_labIsUnit(x)) return 0; const i = x % ZONE_LENGTH - WALL_UNIT_OFFSET, o = wallUnitMachineOffset(Math.floor(x / ZONE_LENGTH)); return i === o ? 1 : i === o + 1 ? 2 : 0; }
// The big piece (a generator, a test chamber, a wide console) that stands on the pair of tiles starting at the even tile xe, or null.
function _labBigAt(xe) {
    if (xe % 2 !== 0 || !labTileFree(xe) || !labTileFree(xe + 1) || _labMachine(xe) || _labMachine(xe + 1)) return null;
    const h = _labHash(xe / 2 + 11) % 6;
    return h === 0 ? "generator" : h === 1 ? "chamber" : h === 2 ? "console2" : null;
}
const _LAB_SMALL = ["server", "crt", "bank", "server2", "pipes", "console", "crt2", null];
// { kind, span } for the piece that STARTS on wall tile x ("covered" tiles and free-wall tiles give null).
function labModuleAt(x) {
    if (!labTileFree(x)) return null;
    const mc = _labMachine(x); if (mc) return mc === 1 ? { kind: "unit", span: 2 } : null;
    const xe = x - (((x % 2) + 2) % 2), big = _labBigAt(xe);
    if (big) return x === xe ? { kind: big, span: 2 } : null;
    const k = _LAB_SMALL[_labHash(x) % _LAB_SMALL.length];
    return k ? { kind: k, span: 1 } : null;
}

// ── the painter (everything below draws into a sprite) ──
let _lg = null, _lox = 0, _loy = 0, _lseed = 1;
function _lrnd() { _lseed = (_lseed * 16807) % 2147483647; return (_lseed - 1) / 2147483646; }
const _LX = (u, d) => _lox + (u - d) * 60, _LY = (u, d, z) => _loy + (u + d) * 30 - z;
function _lhex(c, f) { const n = parseInt(c.slice(1), 16); return "rgb(" + Math.min(255, (n >> 16 & 255) * f | 0) + "," + Math.min(255, (n >> 8 & 255) * f | 0) + "," + Math.min(255, (n & 255) * f | 0) + ")"; }
function _lpoly(pts, fill, stroke) { const g = _lg; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = 1; g.stroke(); } }
// a face towards the lane (u px along the wall, v px up) and the face on the wall's right-hand side
function _lfaceA(u0, d, w, h, z, fn) { const g = _lg; g.save(); g.transform(1, 0.5, 0, -1, _LX(u0, d), _LY(u0, d, z)); fn(w * 60, h); g.restore(); }
function _lfaceB(u1, d, h, z, fn) { const g = _lg; g.save(); g.transform(1, -0.5, 0, -1, _LX(u1, d), _LY(u1, d, z)); fn(d * 60, h); g.restore(); }
function _lbox(u0, w, d, h, o) {
    o = o || {}; const g = _lg, z = o.z || 0, u1 = u0 + w, base = o.col || LAB.steel;
    _lfaceB(u1, d, h, z, (W, H) => { g.fillStyle = _lhex(base, 0.55); g.fillRect(0, 0, W, H); if (o.B) o.B(W, H); g.strokeStyle = "rgba(0,0,0,.7)"; g.lineWidth = 1; g.strokeRect(0, 0, W, H); });
    _lfaceA(u0, d, w, h, z, (W, H) => { g.fillStyle = _lhex(base, 0.8); g.fillRect(0, 0, W, H); if (o.A) o.A(W, H); g.strokeStyle = "rgba(0,0,0,.8)"; g.lineWidth = 1; g.strokeRect(0, 0, W, H); });
    _lpoly([[_LX(u0, 0), _LY(u0, 0, z + h)], [_LX(u1, 0), _LY(u1, 0, z + h)], [_LX(u1, d), _LY(u1, d, z + h)], [_LX(u0, d), _LY(u0, d, z + h)]], _lhex(base, 1.05), "rgba(0,0,0,.8)");
}
function _lled(x, y, col, r) { const g = _lg; r = r || 1.5; g.fillStyle = col; g.globalAlpha = 0.3; g.beginPath(); g.arc(x, y, r * 2.4, 0, 7); g.fill(); g.globalAlpha = 1; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
function _lscreen(x, y, w, h, col, lines) {
    const g = _lg, gr = g.createLinearGradient(x, y, x, y + h); gr.addColorStop(0, _lhex(col, 0.55)); gr.addColorStop(1, _lhex(col, 0.15));
    g.fillStyle = "#020403"; g.fillRect(x - 3, y - 3, w + 6, h + 6); g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.fillStyle = "rgba(0,0,0,.28)"; for (let k = 0; k < h; k += 3) g.fillRect(x, y + k, w, 1);
    g.fillStyle = _lhex(col, 1.6); for (let k = 0; k < (lines || 4); k++) g.fillRect(x + 4, y + h - 8 - k * (h / (lines || 4)), w * (0.3 + _lrnd() * 0.5), 2);
    g.fillStyle = "rgba(255,255,255,.12)"; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w * 0.5, y + h); g.lineTo(x + w * 0.2, y); g.lineTo(x, y); g.fill();
}
function _lvents(x, y, w, h, n) { _lg.fillStyle = "rgba(0,0,0,.55)"; for (let k = 0; k < n; k++) _lg.fillRect(x, y + k * (h / n), w, h / n * 0.5); }
function _lbolts(W, H, m) { const g = _lg; g.fillStyle = "rgba(0,0,0,.5)"; for (const [a, b] of [[m, m], [W - m, m], [m, H - m], [W - m, H - m]]) { g.beginPath(); g.arc(a, b, 1.4, 0, 7); g.fill(); } }
const _LM = {
    crt(u0, o) {
        o = o || {}; const w = o.w || 0.84, h = o.h || 52, d = LAB_DEPTH, z = o.z || 0, g = _lg;
        _lbox(u0, w, d, h, { z, A(W, H) { g.fillStyle = _lhex(LAB.steel, 0.45); g.fillRect(6, 6, W - 12, H - 12); _lscreen(10, H * 0.28, W - 20, H * 0.62, o.col || LAB.screen, o.lines); for (let k = 0; k < 3; k++) _lled(W - 12 - k * 7, 9, k === 0 ? LAB.accent : "#222"); _lbolts(W, H, 4); }, B(W, H) { _lvents(6, 8, W - 12, H - 16, 5); } });
        _lbox(u0 + w * 0.15, w * 0.7, d * 0.7, 9, { z: z + h, col: LAB.steel2, A(W, H) { _lvents(5, 2, W - 10, H - 4, 3); } });
    },
    bank(u0) { _LM.crt(u0, { h: 40, col: LAB.screen }); _LM.crt(u0, { h: 40, z: 50, col: LAB.screen2 }); },
    server(u0, o) {
        o = o || {}; const w = 0.84, h = o.h || 102, d = LAB_DEPTH, g = _lg;
        _lbox(u0, w, d, h, { col: LAB.steel2, A(W, H) { _lbolts(W, H, 4); const rows = Math.floor((H - 18) / 11); for (let k = 0; k < rows; k++) { const y = 7 + k * 11; g.fillStyle = "#05080a"; g.fillRect(6, y, W - 12, 8); g.fillStyle = _lhex(LAB.steel, 0.6); g.fillRect(8, y + 1, W * 0.45, 6); _lled(W - 14, y + 4, (k * 7 + (o.s || 0)) % 5 === 0 ? LAB.accent : (k % 3 ? LAB.screen : "#432"), 1.3); _lled(W - 23, y + 4, k % 4 === 0 ? LAB.lamp : "#222", 1.1); } g.fillStyle = LAB.accent; g.fillRect(W - 9, H - 11, 5, 5); }, B(W, H) { _lvents(7, 9, W - 14, H - 22, 9); } });
    },
    server2(u0) { _LM.server(u0, { h: 82, s: 3 }); },
    crt2(u0) { _LM.crt(u0, { h: 64, w: 0.84, col: LAB.screen2, lines: 5 }); },
    console(u0) {
        const w = 0.84, h = 40, d = LAB_DEPTH + 0.04, g = _lg, z = h - 12;
        _lbox(u0, w, d, h - 12, { col: LAB.steel2, A(W, H) { _lbolts(W, H, 3); _lvents(6, 5, W - 12, H - 10, 3); } });
        _lpoly([[_LX(u0, 0), _LY(u0, 0, z + 4)], [_LX(u0 + w, 0), _LY(u0 + w, 0, z + 4)], [_LX(u0 + w, d), _LY(u0 + w, d, z - 2)], [_LX(u0, d), _LY(u0, d, z - 2)]], _lhex(LAB.steel, 0.9), "#000");
        for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { const uu = (k + 0.5) / 4, vv = (r + 0.7) / 3.6, px = _LX(u0 + w * uu, d * vv), py = _LY(u0 + w * uu, d * vv, z + 4 - 6 * vv); g.fillStyle = (k + r * 3) % 7 === 0 ? LAB.accent : (k % 3 ? "#0a0f12" : _lhex(LAB.steel2, 0.8)); g.fillRect(px - 3, py - 2, 6, 3.5); if ((k + r) % 5 === 0) _lled(px, py - 3, LAB.lamp, 1.1); }
        _lbox(u0 + w * 0.1, w * 0.5, 0.2, 30, { z: h - 12, col: LAB.steel, A(W, H) { _lscreen(6, 6, W - 12, H - 12, LAB.screen, 3); } });
    },
    pipes(u0) {
        const g = _lg;
        for (let k = 0; k < 3; k++) { const u = u0 + 0.2 + k * 0.28, d = 0.14, px = _LX(u, d), py0 = _LY(u, d, 0), H = 96;
            const gr = g.createLinearGradient(px - 7, 0, px + 7, 0); gr.addColorStop(0, _lhex(LAB.steel2, 0.5)); gr.addColorStop(0.4, _lhex(LAB.steel2, 1.3)); gr.addColorStop(1, _lhex(LAB.steel2, 0.4));
            g.fillStyle = gr; g.fillRect(px - 7, py0 - H, 14, H); for (const zz of [18, 52, 84]) { g.fillStyle = _lhex(LAB.steel, 0.7); g.fillRect(px - 9, _LY(u, d, zz) - 3, 18, 5); } _lled(px, py0 - H * 0.5, k % 2 ? LAB.lamp : LAB.accent, 1.8); }
    },
    generator(u0) {
        const w = 1.74, h = 66, d = LAB_DEPTH + 0.06, g = _lg;
        _lbox(u0, w, d, h, { col: LAB.steel, A(W, H) { _lbolts(W, H, 5);
            g.save(); g.beginPath(); g.rect(6, H - 18, W - 12, 12); g.clip(); g.fillStyle = "#16130a"; g.fillRect(6, H - 18, W - 12, 12); g.fillStyle = LAB.hazard; for (let k = -20; k < W; k += 14) { g.beginPath(); g.moveTo(k, H - 18); g.lineTo(k + 7, H - 18); g.lineTo(k + 17, H - 6); g.lineTo(k + 10, H - 6); g.fill(); } g.restore();
            g.fillStyle = "#030505"; g.fillRect(W * 0.1, H * 0.22, W * 0.4, H * 0.46); const gr = g.createLinearGradient(0, H * 0.68, 0, H * 0.22); gr.addColorStop(0, _lhex(LAB.core, 0.35)); gr.addColorStop(1, _lhex(LAB.core, 1.3)); g.fillStyle = gr; g.fillRect(W * 0.1 + 3, H * 0.22 + 3, W * 0.4 - 6, H * 0.46 - 6);
            g.strokeStyle = "rgba(0,0,0,.55)"; g.lineWidth = 2; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(W * 0.1 + 3, H * 0.22 + 3 + k * (H * 0.46 - 6) / 4); g.lineTo(W * 0.5 - 3, H * 0.22 + 3 + k * (H * 0.46 - 6) / 4); g.stroke(); }
            for (let k = 0; k < 3; k++) { const cx = W * 0.66 + k * 15, cy = H * 0.62; g.fillStyle = "#050808"; g.beginPath(); g.arc(cx, cy, 6, 0, 7); g.fill(); g.strokeStyle = LAB.accent; g.lineWidth = 1.4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(-0.8 + k) * 5, cy - Math.sin(-0.8 + k) * 5); g.stroke(); }
            _lvents(W * 0.6, H * 0.18, W * 0.3, H * 0.2, 4); }, B(W, H) { _lvents(8, 8, W - 16, H - 16, 7); } });
        for (let k = 0; k < 2; k++) { const u = u0 + w * (0.3 + 0.4 * k), px = _LX(u, d * 0.5), py = _LY(u, d * 0.5, h); g.fillStyle = _lhex(LAB.steel2, 0.9); g.fillRect(px - 10, py - 20, 20, 20); g.fillStyle = _lhex(LAB.steel2, 1.2); g.beginPath(); g.ellipse(px, py - 20, 10, 5, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(0,0,0,.5)"; for (let q = 1; q < 4; q++) { g.beginPath(); g.moveTo(px - 10, py - q * 5); g.lineTo(px + 10, py - q * 5); g.stroke(); } _lled(px, py - 20, LAB.lamp, 2); }
    },
    chamber(u0) {
        const w = 1.74, h = 100, d = LAB_DEPTH + 0.06, g = _lg;
        _lbox(u0, w, d, 12, { col: LAB.steel2 });
        const gh = h - 32, z = 12;
        _lfaceB(u0 + w, d, gh, z, (W, H) => { const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, _lhex(LAB.glass, 0.25)); gr.addColorStop(1, _lhex(LAB.glass, 0.1)); g.fillStyle = gr; g.fillRect(0, 0, W, H); g.strokeStyle = _lhex(LAB.glass, 0.7); g.strokeRect(0, 0, W, H); });
        _lfaceA(u0, d, w, gh, z, (W, H) => { g.fillStyle = "#02060a"; g.fillRect(0, 0, W, H); const gr = g.createLinearGradient(0, H, 0, 0); gr.addColorStop(0, _lhex(LAB.glass, 0.5)); gr.addColorStop(1, _lhex(LAB.glass, 0.12)); g.fillStyle = gr; g.fillRect(4, 4, W - 8, H - 8);
            g.fillStyle = "rgba(0,0,0,.75)"; g.beginPath(); g.ellipse(W * 0.5, H * 0.58, W * 0.14, H * 0.28, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(W * 0.5, H * 0.24, W * 0.07, H * 0.1, 0, 0, 7); g.fill(); g.lineWidth = 3; g.strokeStyle = "rgba(0,0,0,.75)"; g.beginPath(); g.moveTo(W * 0.38, H * 0.6); g.quadraticCurveTo(W * 0.2, H * 0.7, W * 0.24, H * 0.88); g.moveTo(W * 0.62, H * 0.6); g.quadraticCurveTo(W * 0.8, H * 0.7, W * 0.76, H * 0.88); g.stroke();
            _lled(W * 0.46, H * 0.22, LAB.lamp, 2); _lled(W * 0.54, H * 0.22, LAB.lamp, 2); for (let k = 0; k < 8; k++) _lled(8 + _lrnd() * (W - 16), 8 + _lrnd() * (H - 16), _lhex(LAB.glass, 1.5), 1);
            g.fillStyle = "rgba(255,255,255,.1)"; g.beginPath(); g.moveTo(6, 6); g.lineTo(W * 0.35, 6); g.lineTo(W * 0.15, H - 6); g.lineTo(6, H - 6); g.fill(); g.strokeStyle = LAB.steel2; g.lineWidth = 4; g.strokeRect(2, 2, W - 4, H - 4); g.beginPath(); g.moveTo(W / 2, 2); g.lineTo(W / 2, H - 2); g.stroke(); });
        _lbox(u0, w, d, 20, { z: h - 20, col: LAB.steel2, A(W, H) { _lled(10, H / 2, LAB.accent, 2); _lled(W - 10, H / 2, LAB.lamp, 2); _lvents(W * 0.3, 4, W * 0.4, H - 8, 3); } });
    },
    console2(u0) { _LM.console(u0); _LM.console(u0 + 0.9); },
};
// The power unit: a bank of two shelves of three glass tubes. `cells` is six states: 0 bay, -1 wreck, or the charge in tenths (1..10); `tier` (0..3) lights the lamps on top; `col` is the element's colour.
function _labUnit(cells, tier, col) {
    const g = _lg, u0 = 0.06, w = 1.88, d = LAB_DEPTH + 0.1, h = 106;
    _lbox(u0, w, d, h, { col: LAB.steel, A(W, H) {
        _lbolts(W, H, 4);
        // plinth, header with the tier lamps and a hazard stripe, side dials
        g.fillStyle = _lhex(LAB.steel2, 0.9); g.fillRect(4, 3, W - 8, 11);
        g.fillStyle = "#06080a"; g.fillRect(6, H - 17, W - 12, 12); for (let k = 0; k < 3; k++) _lled(14 + k * 12, H - 11, k < tier ? _lhex(col, 1.3) : "#2a2618", 2.4);
        g.save(); g.beginPath(); g.rect(W * 0.45, H - 17, W * 0.5, 12); g.clip(); g.fillStyle = "#16130a"; g.fillRect(W * 0.45, H - 17, W * 0.5, 12); g.fillStyle = LAB.hazard; for (let k = W * 0.45 - 10; k < W; k += 13) { g.beginPath(); g.moveTo(k, H - 17); g.lineTo(k + 6, H - 17); g.lineTo(k + 16, H - 5); g.lineTo(k + 10, H - 5); g.fill(); } g.restore();
        // the two shelves of tubes
        for (let sh = 0; sh < 2; sh++) {
            const sy = 17 + sh * 38; g.fillStyle = "#05080a"; g.fillRect(6, sy, W - 12, 34); g.strokeStyle = "rgba(0,0,0,.8)"; g.strokeRect(6, sy, W - 12, 34); g.fillStyle = _lhex(LAB.steel, 0.5); g.fillRect(6, sy + 34, W - 12, 3);
            for (let k = 0; k < 3; k++) {
                const c = cells[sh * 3 + k], tw = 26, tx = 11 + k * ((W - 22) / 3) + ((W - 22) / 3 - tw) / 2, ty = sy + 3, th = 28;
                g.fillStyle = "#020304"; g.fillRect(tx, ty, tw, th);
                if (c > 0) { const f = c / LAB_FILL_STEPS, gr = g.createLinearGradient(0, ty, 0, ty + th * f); gr.addColorStop(0, _lhex(col, 0.95)); gr.addColorStop(1, _lhex(col, 1.35)); g.fillStyle = gr; g.fillRect(tx + 2, ty + 1, tw - 4, th * f - 2); g.fillStyle = "rgba(0,0,0,.35)"; for (let q = 1; q < 4; q++) g.fillRect(tx + 2, ty + th * q / 4, tw - 4, 1); g.fillStyle = "rgba(255,255,255,.45)"; g.fillRect(tx + 4, ty + 2, 3, th * f - 5); }
                g.fillStyle = "rgba(150,200,230,.10)"; g.fillRect(tx, ty, tw, th); g.strokeStyle = _lhex(LAB.steel, 1.3); g.lineWidth = 2; g.strokeRect(tx, ty, tw, th);
                if (c === -1) { g.strokeStyle = "#d33"; g.lineWidth = 2; g.beginPath(); g.moveTo(tx + 3, ty + 3); g.lineTo(tx + tw - 3, ty + th - 3); g.moveTo(tx + tw - 3, ty + 3); g.lineTo(tx + 3, ty + th - 3); g.stroke(); g.strokeStyle = "#cde"; g.lineWidth = 1; g.beginPath(); g.moveTo(tx + tw * 0.6, ty); g.lineTo(tx + tw * 0.4, ty + th * 0.5); g.lineTo(tx + tw * 0.7, ty + th); g.stroke(); _lled(tx + 6, ty + th - 5, LAB.lamp, 1.2); _lled(tx + tw - 6, ty + th - 9, LAB.lamp, 1.2); }
                if (c === 0) { g.strokeStyle = "#5a5648"; g.lineWidth = 1.4; g.beginPath(); g.arc(tx + tw / 2, ty + th / 2, 6, -0.4, 3.5); g.moveTo(tx + tw / 2, ty + th / 2 - 9); g.lineTo(tx + tw / 2, ty + th / 2 - 2); g.stroke(); }
                _lled(tx + tw / 2, sy + 32, c > 0 ? _lhex(col, 1.4) : c === -1 ? "#f33" : "#3a3626", 1.3);
            }
        }
    }, B(W, H) { _lvents(8, 10, W - 16, H - 28, 9); } });
    // the coils on top
    for (let k = 0; k < 2; k++) { const u = u0 + w * (0.28 + 0.44 * k), px = _LX(u, d * 0.5), py = _LY(u, d * 0.5, h); g.fillStyle = _lhex(LAB.steel2, 0.9); g.fillRect(px - 10, py - 18, 20, 18); g.fillStyle = _lhex(LAB.steel2, 1.2); g.beginPath(); g.ellipse(px, py - 18, 10, 5, 0, 0, 7); g.fill(); g.strokeStyle = "rgba(0,0,0,.5)"; for (let q = 1; q < 4; q++) { g.beginPath(); g.moveTo(px - 10, py - q * 4.5); g.lineTo(px + 10, py - q * 4.5); g.stroke(); } _lled(px, py - 18, tier > k ? _lhex(col, 1.4) : LAB.lamp, 2); }
}
// ── the sprite cache ──
const _labSprites = new Map();
function labSprite(kind, state, tier, col) {
    const key = kind + "|" + (state || "") + "|" + (tier || 0) + "|" + (col || "");
    if (_labSprites.has(key)) return _labSprites.get(key);
    let cv = null;
    try {
        const big = kind === "generator" || kind === "chamber" || kind === "console2" || kind === "unit";
        cv = document.createElement("canvas"); cv.width = big ? LAB_W + 64 : LAB_W; cv.height = LAB_H;
        _lg = cv.getContext("2d"); _lox = LAB_OX; _loy = LAB_OY; _lseed = 17 + (key.length * 31 + kind.charCodeAt(0) * 7);
        if (kind === "unit") _labUnit(String(state).split(",").map(Number), tier || 0, col || "#ff4a1c"); else _LM[kind](0.07);
    } catch (e) { cv = null; }
    if (_labSprites.size >= 220) _labSprites.delete(_labSprites.keys().next().value);   // the unit's look changes with its charge: the old ones go
    _labSprites.set(key, cv);
    return cv;
}
// What a cell of the unit looks like now: { st: 'live' | 'bay' | 'wreck', fill 0..LAB_FILL_STEPS, col }.
function labCellLook(tile) {
    if (!tile || !tile.pillar || !tile.isBattery) return { st: "bay", fill: 0, col: "" };
    if (tile.destroyed || !(tile.health > 0)) return { st: "wreck", fill: 0, col: "" };
    const el = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === tile.attackModeElement) : null, cap = typeof BATTERY_CAPACITY !== "undefined" ? BATTERY_CAPACITY : 120;
    return { st: "live", fill: Math.max(0, Math.min(LAB_FILL_STEPS, Math.round(LAB_FILL_STEPS * (tile.charge || 0) / cap))), col: el ? el.color : "#ff4a1c" };
}
// The unit's six cells as the sprite's key: 0 bay, -1 wreck, 1..10 the charge in tenths (a live cell is never 0).
function labUnitState(zone) {
    const tiles = typeof wallUnitTiles === "function" ? wallUnitTiles(zone) : [], cells = [], looks = [];
    for (let i = 0; i < 6; i++) { const l = labCellLook(tiles[i]); looks.push(l); cells.push(l.st === "bay" ? 0 : l.st === "wreck" ? -1 : Math.max(1, l.fill)); }
    const live = looks.find(l => l.st === "live");
    return { cells, tier: typeof wallUnitTier === "function" ? wallUnitTier(zone) : 0, col: live ? live.col : (typeof wallUnitElement === "function" && wallUnitElement(zone) ? (ELEMENTS.find(e => e.id === wallUnitElement(zone)) || {}).color || "#ff4a1c" : "#ff4a1c") };
}
// Called by the depth-sorted pass for a 'labmod' item standing in front of wall tile `tile` (js/game.js).
function drawLabModule(tile, amb) {
    const m = labModuleAt(tile.x); if (!m) return;
    let spr;
    if (m.kind === "unit") { const u = labUnitState(Math.floor(tile.x / ZONE_LENGTH)); spr = labSprite("unit", u.cells.join(","), u.tier, u.col); } else spr = labSprite(m.kind);
    if (!spr) return;
    const ox = (tile.x - player.visualX - (-1 - player.visualY)) * TILE_W + canvas.width / 2, oy = (tile.x - player.visualX + (-1 - player.visualY)) * TILE_H + canvas.height / 2;
    ctx.save(); ctx.globalAlpha = Math.min(1, 0.32 + amb); ctx.drawImage(spr, ox - LAB_OX, oy - LAB_OY); ctx.restore();
}
