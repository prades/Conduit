// ─────────────────────────────────────────────────────────
//  THE PLAYER AND THE FOLLOWER EGG, IN 3D (img/hd/, baked from design/evolutions/forms29.js)
// ─────────────────────────────────────────────────────────
// The player (the black cube with the green visor) and the follower egg (before it evolves) were drawn flat, with canvas paths, while the evolved crew are baked 3D
// sprites. These two now are too: the same sheets (8 facings x 16 frames: 8 idle, 8 walk, 144 px cells, seen from the game's iso angle, drawn by js/evolution.js's rules).
//   THE PLAYER   the same cube, modelled (img/hd/player.png, and player_angry.png with red eyes). It turns to the way it moves, walks while it moves, and the smoke still
//                comes out of its vent.
//   THE EGG      "the shell": a faceted egg with glowing cracks on three pins, one sheet per element (img/hd/egg_<element>.png).
// Until a sheet has arrived (or if it never does) the old flat drawing is used, so nothing is ever missing.
// The sheets are CROPPED to the part of a cell the figure ever covers (img/hd: tools in design/evolutions/bake.js baked 144 px cells, mostly empty): a cell is HD_BOX[family].cw x .ch, cut from
// the original cell at (ox, oy). Decoded they were ten times the memory; this is a fifth to a quarter of it.
const HD_CELL = 144, HD_ANCHOR = [72, 114.18], HD_PX_PER_UNIT = 144 / 3.4;
const HD_BOX = { player: { ox: 26, oy: 1, cw: 92, ch: 105 }, egg: { ox: 43, oy: 43, cw: 58, ch: 85 } };
// Draw one frame (col, row) of a sheet with the figure's anchor at (ax, ay) on screen, at scale s.
function _hdBlit(g, img, box, col, row, ax, ay, s) {
    g.drawImage(img, col * box.cw, row * box.ch, box.cw, box.ch, ax - (HD_ANCHOR[0] - box.ox) * s, ay - (HD_ANCHOR[1] - box.oy) * s, box.cw * s, box.ch * s);
}
const HD_PLAYER_SCALE = 0.82, HD_EGG_SCALE = 1.0;
const HD_ELEMENTS = ["fire", "electric", "ice", "flux", "core", "toxic"];
const HD_EGG_CORE_Y = 73;          // where the crystal sits in an egg cell (the glow goes there)
const _hdImgs = {};

function _hdImg(key) {
    if (_hdImgs[key] !== undefined) { const e = _hdImgs[key]; return e && e.complete && e.naturalWidth ? e : null; }
    _hdImgs[key] = null;
    if (typeof document === "undefined" || !document.createElement) return null;
    const im = document.createElement("img");
    im.onload = () => { _hdImgs[key] = im; };
    im.src = "img/hd/" + key + ".png" + (typeof BUILD_VERSION !== "undefined" ? "?v=" + BUILD_VERSION : "");
    _hdImgs[key] = im;
    return null;
}
// The row of a sheet for a facing (dirX, dirY in grid steps): row 1 looks at the camera.
function hdRow(dx, dy) {
    const a = Math.atan2(dy, dx);
    return ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
}
// The column: a breath while it stands (every 7 frames), a step every 4 frames while it moves.
function hdCol(walking, f0) { return walking ? 8 + (Math.floor(f0 / 4) % 8) : Math.floor(f0 / 7) % 8; }

// ── THE PLAYER ─────────────────────────────────────────────
// What it is doing this frame, remembered on the player: its facing row and whether it moved since the last frame.
function hdPlayerState() {
    const f0 = typeof frame !== "undefined" ? frame : 0, p = player;
    const x = p.visualX === undefined ? p.x : p.visualX, y = p.visualY === undefined ? p.y : p.visualY;
    if (p._hdAt !== undefined && p._hdAt !== f0) {
        const dx = x - p._hdX, dy = y - p._hdY;
        if (Math.abs(dx) + Math.abs(dy) > 0.004) { p._hdRow = hdRow(dx, dy); p._hdMoveAt = f0; }
    }
    p._hdX = x; p._hdY = y; p._hdAt = f0;
    if (p._hdRow === undefined) p._hdRow = 1;
    return { row: p._hdRow, walking: p._hdMoveAt !== undefined && f0 - p._hdMoveAt < 6, f0 };
}
// Where the vent's smoke leaves the cube, in screen pixels from the player's feet: the vent is on its right flank, a little forward, up the side.
function hdVentOffset(row, s) {
    const phi = row * Math.PI / 4, lx = 0.8, lz = 0.16, wx = lx * Math.cos(phi) + lz * Math.sin(phi), wz = -lx * Math.sin(phi) + lz * Math.cos(phi);
    const k = HD_PX_PER_UNIT * Math.SQRT1_2 * s;
    return { x: (wx - wz) * k, y: (wx + wz) * 0.5 * k - 1.95 * HD_PX_PER_UNIT * 0.866 * s };
}
// Draws the player; false if the sheet is not there yet (the caller draws the flat one).
function drawHdPlayer(p) {
    const img = _hdImg(player.angryTimer > 0 ? "player_angry" : "player"); if (!img) return false;
    const st = hdPlayerState(), s = HD_PLAYER_SCALE;
    ctx.save();
    // the shadow on the floor, well under it: that gap is what makes it float
    ctx.fillStyle = "rgba(0,0,0,0.26)"; ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, 26 * s, 10 * s, 0, 0, Math.PI * 2); ctx.fill();
    _hdBlit(ctx, img, HD_BOX.player, hdCol(st.walking, st.f0), st.row, p.x, p.y + 2, s);
    ctx.restore();
    if (frame % cfg.exhaustFrequency === 0) { const vo = hdVentOffset(st.row, s); smoke.push({ x: p.x + vo.x, y: p.y + vo.y, vx: 0.2 + Math.random() * 0.4, vy: -0.15 - Math.random() * 0.2, life: 1, size: 4 + Math.random() * 6 }); }
    return true;
}

// ── THE EGG ────────────────────────────────────────────────
// The two things an egg is drawn with besides its sheet, as small cached stamps (a gradient built per egg per frame was most of the cost): the soft floor shadow, and the crystal's glow in
// the element's colour (plain blending: switching to additive for every egg broke the batching of the canvas).
let _hdShadow = null; const _hdGlow = {};
function _hdStamp(w, h, draw) {
    if (typeof document === "undefined" || !document.createElement) return null;
    const c = document.createElement("canvas"); if (!c || !c.getContext) return null;
    c.width = w; c.height = h; const g = c.getContext("2d"); if (!g || typeof g.createRadialGradient !== "function") return null;
    draw(g, w, h); return c;
}
function _hdShadowStamp() {
    if (_hdShadow === null) _hdShadow = _hdStamp(40, 18, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(0,0,0,0.42)"); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.save(); g.translate(0, h / 2); g.scale(1, h / w); g.translate(0, -w / 2); g.fillRect(0, 0, w, w); g.restore(); }) || false;
    return _hdShadow || null;
}
function _hdGlowStamp(el, col) {
    if (_hdGlow[el] === undefined) _hdGlow[el] = _hdStamp(32, 32, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); gr.addColorStop(0, col); gr.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); }) || false;
    return _hdGlow[el] || null;
}
// A follower that has not evolved (and is not a clone): its row from the way it faces, walking while its walk cycle moves.
function drawHdEgg(f, px, py, g, flash) {
    if (!f || !f.isFollower || f.isClone || f.evolved || HD_ELEMENTS.indexOf(f.element) < 0) return false;
    const img = _hdImg("egg_" + f.element); if (!img) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0, wc = f.walkCycle || 0;
    if (f._hdWc !== undefined && Math.abs(wc - f._hdWc) > 1e-4) f._hdMoveAt = f0;
    f._hdWc = wc;
    const walking = f._hdMoveAt !== undefined && f0 - f._hdMoveAt < 6, s = HD_EGG_SCALE;
    // it faces the way it last went (dirX, dirY); one that has not moved yet faces the camera
    const row = f.dirX || f.dirY ? hdRow(f.dirX || 0, f.dirY || 0) : 1;
    const col = hdCol(walking, f0 + ((f.x || 0) * 13 | 0));   // eggs do not all breathe together
    const sh = _hdShadowStamp(); if (sh) g.drawImage(sh, px - 20, py - 8, 40, 18);
    _hdBlit(g, img, HD_BOX.egg, col, row, px, py + 2, s);
    // the crystal's glow, and white for a moment when it is hit
    const def = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === f.element) : null, gl = def ? _hdGlowStamp(f.element, def.color) : null;
    if (gl) { const cy = py + 2 - (HD_ANCHOR[1] - HD_EGG_CORE_Y) * s, a0 = g.globalAlpha; g.globalAlpha = a0 * (0.4 + 0.15 * Math.sin(f0 * 0.12)); g.drawImage(gl, px - 14, cy - 14, 28, 28); g.globalAlpha = a0; }
    if (flash) { const a0 = g.globalAlpha; g.globalAlpha = a0 * 0.5; _hdBlit(g, img, HD_BOX.egg, col, row, px, py + 2, s); g.globalAlpha = a0; }
    return true;
}
