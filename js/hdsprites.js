// ─────────────────────────────────────────────────────────
//  THE PLAYER AND THE FOLLOWER EGG, IN 3D (img/hd/, baked from design/evolutions/forms29.js)
// ─────────────────────────────────────────────────────────
// The player (the black cube with the green visor) and the follower egg (before it evolves) were drawn flat, with canvas paths, while the evolved crew are baked 3D
// sprites. These two now are too: the same sheets (8 facings x 16 frames: 8 idle, 8 walk, 144 px cells, seen from the game's iso angle, drawn by js/evolution.js's rules).
//   THE PLAYER   the same cube, modelled (img/hd/player.png, and player_angry.png with red eyes). It turns to the way it moves, walks while it moves, and the smoke still
//                comes out of its vent.
//   THE EGG      "the shell": a faceted egg with glowing cracks on three pins, one sheet per element (img/hd/egg_<element>.png).
// Until a sheet has arrived (or if it never does) the old flat drawing is used, so nothing is ever missing.
const HD_CELL = 144, HD_ANCHOR = [72, 114.18], HD_PX_PER_UNIT = 144 / 3.4;
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
    return { x: (wx - wz) * k, y: (wx + wz) * 0.5 * k - 1.72 * HD_PX_PER_UNIT * 0.866 * s };
}
// Draws the player; false if the sheet is not there yet (the caller draws the flat one).
function drawHdPlayer(p) {
    const img = _hdImg(player.angryTimer > 0 ? "player_angry" : "player"); if (!img) return false;
    const st = hdPlayerState(), s = HD_PLAYER_SCALE;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(p.x, p.y + 1, 34 * s, 14 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.drawImage(img, hdCol(st.walking, st.f0) * HD_CELL, st.row * HD_CELL, HD_CELL, HD_CELL, p.x - HD_ANCHOR[0] * s, p.y + 2 - HD_ANCHOR[1] * s, HD_CELL * s, HD_CELL * s);
    ctx.restore();
    if (frame % cfg.exhaustFrequency === 0) { const vo = hdVentOffset(st.row, s); smoke.push({ x: p.x + vo.x, y: p.y + vo.y, vx: 0.2 + Math.random() * 0.4, vy: -0.15 - Math.random() * 0.2, life: 1, size: 4 + Math.random() * 6 }); }
    return true;
}

// ── THE EGG ────────────────────────────────────────────────
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
    g.save();
    g.fillStyle = "rgba(0,0,0,0.35)"; g.beginPath(); g.ellipse(px, py + 1, 15, 6, 0, 0, Math.PI * 2); g.fill();
    g.drawImage(img, col * HD_CELL, row * HD_CELL, HD_CELL, HD_CELL, px - HD_ANCHOR[0] * s, py + 2 - HD_ANCHOR[1] * s, HD_CELL * s, HD_CELL * s);
    // the crystal's glow, as for the evolved forms, and white for a moment when it is hit
    const def = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === f.element) : null, cy = py + 2 - (HD_ANCHOR[1] - HD_EGG_CORE_Y) * s;
    g.globalCompositeOperation = "lighter";
    const gr = g.createRadialGradient(px, cy, 0, px, cy, 14);
    gr.addColorStop(0, def ? def.color : "#fff"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.globalAlpha = 0.4 + 0.15 * Math.sin(f0 * 0.12); g.fillStyle = gr; g.beginPath(); g.arc(px, cy, 14, 0, Math.PI * 2); g.fill();
    if (flash) { g.globalAlpha = 0.5; g.drawImage(img, col * HD_CELL, row * HD_CELL, HD_CELL, HD_CELL, px - HD_ANCHOR[0] * s, py + 2 - HD_ANCHOR[1] * s, HD_CELL * s, HD_CELL * s); }
    g.restore();
    return true;
}
