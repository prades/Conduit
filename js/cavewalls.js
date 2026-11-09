// THE CAVE'S ROCK WALLS, MODELLED (the owner, 2026-11-09: RuneScape's 3D-model walls and their lighting as the reference; the look approved on its preview, in the cave's brown: "Brown, build the full
// wall set"). Every rock wall piece of the facility (the arena, the Cold Storage's ice cave, the Nest's cavern) has a strip of a modelled rock wall baked from its own shape by design/cave/bake_walls.js
// (js/caveatlas.js says where each strip is). A piece draws its strip in its own place in the draw list, so units sort against the rock as before; a dim room darkens it as it darkens the props (its
// silhouette under it, js/propsprites.js). docs/ART-PROCESS.md: the drawn rock stays until the owner approves the modelled one in the game, so it shows only on the preview (?walls=3d) until then.
const CAVE_WALLS = { approved: false };
let _caveWallsPrev = null;
function caveWallsPreview() { try { return typeof location !== "undefined" && /[?&]walls=3d\b/.test(location.search || ""); } catch (e) { return false; } }
function caveWallsOn() { if (CAVE_WALLS.approved) return true; if (_caveWallsPrev === null) _caveWallsPrev = caveWallsPreview(); return _caveWallsPrev; }
// a piece's key: its two ends (the bake and the game key the strips the same way)
function caveWallKey(it) { return it.a[0].toFixed(3) + "," + it.a[1].toFixed(3) + "," + it.b[0].toFixed(3) + "," + it.b[1].toFixed(3); }
// the walls' signature (every rock piece's ends, side and skyline): the bake writes the one it was made from; a test checks the game's walls still match it
function caveWallsSig() {
    if (typeof _fp === "undefined" || !_fp || !_fp.items) return null;
    let h = 2166136261; const parts = [];
    for (const it of _fp.items) { if (it.fp !== "wall" || it.kind !== "rock") continue; const H = FP_WALL_H + Math.max(0, (it.base2 || it.base || 0) - (it.base || 0)); parts.push(caveWallKey(it) + ":" + (it.back ? 1 : 0) + ":" + _fpRockHeights(it, H).map(v => Math.round(v)).join("/")); }
    const s = parts.join("|"); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16);
}
const _caveImgs = {};
function _caveImg(room) {
    const R = typeof CAVE_ATLAS !== "undefined" && CAVE_ATLAS.rooms[room]; if (!R) return null;
    const e = _caveImgs[room]; if (e !== undefined) return e && e.complete && e.naturalWidth ? e : null;
    if (typeof document === "undefined" || !document.createElement) return (_caveImgs[room] = null);
    const im = document.createElement("img"); im.decoding = "async";
    im.src = R.sheet + (typeof BUILD_VERSION !== "undefined" ? "?v=" + BUILD_VERSION : "");
    _caveImgs[room] = im; return null;
}
// a strip in a dim room: its silhouette in the props' dark with the lit strip over it at the room's light level (composed once per level, a twelfth at a time; nearly dark: the silhouette alone)
const _caveDim = new Map();
function _caveDimmed(key, img, e, bucket) {
    let st = _caveDim.get(key); if (!st) { if (_caveDim.size > 1500) _caveDim.clear(); st = {}; _caveDim.set(key, st); }
    if (st[bucket] !== undefined) return st[bucket];
    let c = null;
    try { c = document.createElement("canvas"); c.width = e[3]; c.height = e[4]; const g = c.getContext("2d");
        g.drawImage(img, e[1], e[2], e[3], e[4], 0, 0, e[3], e[4]); g.globalCompositeOperation = "source-atop"; g.globalAlpha = 1 - bucket / PS_DIM_STEPS; g.fillStyle = PS.dark; g.fillRect(0, 0, e[3], e[4]); }
    catch (err) { c = null; }
    return (st[bucket] = c);
}
// draw a rock wall piece's modelled strip; false when it has none (or its sheet has not arrived): the drawn rock is drawn instead
function caveWallDraw(it) {
    if (!caveWallsOn() || typeof CAVE_ATLAS === "undefined") return false;
    const key = caveWallKey(it), e = CAVE_ATLAS.pieces[key]; if (!e) return false;
    if (!e[3]) return true;   // (nothing of the rock shows in this piece's columns)
    const img = _caveImg(e[0]); if (!img) return false;
    const p = _fpP(it.a[0], it.a[1], 0), x = Math.round(p[0] + e[5]), y = Math.round(p[1] + e[6]);   // (on whole pixels: a strip drawn between pixels blurs its edges into a seam; a run's strips share one offset, so they stay flush)
    const k = ctx._k === undefined ? 1 : ctx._k, bucket = k < 0.1 ? 0 : Math.min(PS_DIM_STEPS, Math.round(k * PS_DIM_STEPS));
    if (bucket >= PS_DIM_STEPS) { const cell = typeof spriteCell === "function" ? spriteCell(img, e[1], e[2], e[3], e[4]) : null;   // (its own small canvas, cut once: a strip drawn straight out of the big sheet cost about a third of a ms, js/draw.js)
        if (cell) ctx.drawImage(cell, x, y); else ctx.drawImage(img, e[1], e[2], e[3], e[4], x, y, e[3], e[4]); }
    else { const d = _caveDimmed(key, img, e, bucket); if (d) ctx.drawImage(d, x, y); else ctx.drawImage(img, e[1], e[2], e[3], e[4], x, y, e[3], e[4]); }
    return true;
}
// a piece's strip as a box on the screen from the piece's ground anchor (screen of (it.x, it.y, 0)), for the walls' off-screen cull (js/facilitydecor.js _fpWallBounds); null when it has none
function caveWallBox(it) {
    if (!caveWallsOn() || typeof CAVE_ATLAS === "undefined") return null;
    const e = CAVE_ATLAS.pieces[caveWallKey(it)]; if (!e || !e[3]) return null;
    const ox = (it.a[0] - it.x - (it.a[1] - it.y)) * TILE_W, oy = (it.a[0] - it.x + it.a[1] - it.y) * TILE_H;
    return [Math.floor(ox + e[5]), Math.floor(oy + e[6]), Math.ceil(ox + e[5] + e[3]), Math.ceil(oy + e[6] + e[4])];
}
