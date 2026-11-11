// ─────────────────────────────────────────────────────────
//  THE BATTLE VIEW (docs/BATTLE-LOOK.md; the owner, 2026-11-11: "more like a JRPG")
// ─────────────────────────────────────────────────────────
// When a creature engages you or your squad, the camera eases in (BATTLE_VIEW.zoom) and the edges soften: on HIGH a blur kept towards the edges and a darkening, on GRAPHICS: LOW the darkening
// alone. It eases back out BATTLE_VIEW.hold frames after the last creature that engaged. While it is on:
//   THE ZOOM       a copy of the finished world picture (the world pass and its overlays), scaled about the centre, made just before the floating words (js/game.js render: battleViewPost).
//                  So nothing that draws the world changes. What is drawn after it and sits on the world goes through bvZoomPt (the floating words: js/drops.js floatingTextScreen; the
//                  lock-on and the dial's brackets: js/gunfire.js _gunScreen; a follower's pick point: js/input.js followerPickPoint); a tap on the world comes back through bvUnzoom
//                  (the pickers that work out the world from the screen: js/input.js, js/techabilities.js, js/fluxmove.js, js/mutator.js, js/stations.js, js/specimen.js).
//                  The HUD the world pass draws (the network panel, the Ant Nest's meter) is held back and drawn after the copy, so it stays where it is.
//   THE FLOOR      drawn first (the tiles on your floor's level), then what is written on it, then all that stands on it (js/game.js drawDepthOf: battleFloorFirst). Written on it:
//                  each fighter's tile lit (green yours, red theirs); a creature's health on the floor before it, its level and its element's tag by the bar (your followers' health is
//                  on the roster: no bar on the floor for them); WEAK! along the tile, shaking, where a weakness was hit; STUNNED along the tile by one stunned, while it lasts.
//   THE WORDS      RESIST floats off small and pale, like nothing (js/drops.js); WEAK and STUNNED are on the floor instead of in the air; no names over the units, no small bars
//                  (js/draw.js asks battleHidesUnitHud).
//   THE OBJECTS    one standing in front of a fighter (nearer the camera, its picture over the fighter's) fades to a ghost (BATTLE_VIEW.ghost, over BATTLE_VIEW.fade) with a bright outline of its tile and the floor
//                  under it; it still counts (cover, sight, walking, FLUX MOVE), as always (js/facilityplay.js drawFacilityItem asks battleFadeProp).
// Every number here is the agent's, provisional, but the zoom (the owner approved it as drafted).
const BATTLE_VIEW = {
    zoom: 1.25,                 // the owner: "Yes, as drafted"
    easeIn: 24, easeOut: 36,    // frames: 0.4 s in, 0.6 s out
    reach: 7,                   // tiles: a creature this near you, in sight, going for you or yours, or hit by you or yours lately (BATTLE_VIEW.hit)
    hit: 120,                   // frames: "lately" (2 s; js/combat.js noteHit stamps each hit's frame)
    hold: 180,                  // frames the view stays after the last such creature (3 s)
    every: 6,                   // frames between the checks for one
    blur: { inner: 0.30, outer: 0.62 },   // the blur kept towards the edges (HIGH): from this share of the height out
    dark: { inner: 0.34, outer: 0.74, high: 0.5, low: 0.62 },   // the darkening towards the edges
    ghost: 0.3,                 // a faded object's ghost (the owner had 25% and 45% to pick from; open)
    fade: 12,                   // frames an object takes to fade to its ghost, and to come back (0.2 s)
    bar: { len: 60, thick: 8 }, // a creature's bar on the floor (px along it, across it)
};
const _bv = { k: 0, z: 1, engagedAt: -1e9, checkAt: -1e9 };   // the view's state: how far in, the zoom, when a creature last engaged, when it last looked (a step with no picture keeps it as a drawn one does)
// What only the drawing keeps (a step with no picture fills none of it: tests/ghost.js IGNORE): its canvases, this frame's fighters, the elements' symbols, the object being drawn and the ghost's guard,
// your floor's level this frame; and, kept beside them rather than written on them, each object's picture as last drawn and how far it has faded, each floating word's first life, each floor tile's level.
const _bvDraw = { cvs: {}, fighters: null, fightersAt: -1, glyphs: {}, item: null, ghosting: false, lv: 0, lvAt: -1, rects: new WeakMap(), life0: new WeakMap(), tileLv: new WeakMap(), fade: new WeakMap() };
function _bvF() { return typeof frame !== "undefined" ? frame : 0; }
function _bvSmooth(k) { return k * k * (3 - 2 * k); }
function battleViewOn() { return _bv.k > 0.001; }
function battleViewK() { return _bv.k; }
function battleViewZoom() { return _bv.z; }
// a knockout (js/game.js; the queen's, js/quests.js questQueenTakesYou): the view eases out now, not 3 s on
function battleViewDrop() { _bv.engagedAt = -1e9; }
function battleViewReset() { _bv.k = 0; _bv.z = 1; _bv.engagedAt = -1e9; _bv.checkAt = -1e9; _bvDraw.fade = new WeakMap(); }
// a point drawn before the copy, where the copy puts it on the screen; and back
function bvZoomPt(x, y) { const z = _bv.z; if (z === 1 || typeof canvas === "undefined") return [x, y]; const cx = canvas.width / 2, cy = canvas.height / 2; return [cx + (x - cx) * z, cy + (y - cy) * z]; }
function bvUnzoom(x, y) { const z = _bv.z; if (z === 1 || typeof canvas === "undefined") return [x, y]; const cx = canvas.width / 2, cy = canvas.height / 2; return [cx + (x - cx) / z, cy + (y - cy) / z]; }

// ── WHEN: a creature engages you or your squad ──
function _bvGreen(u) { return !!u && (u === (typeof player !== "undefined" ? player : null) || u.team === "green" || u.isFollower === true); }
function battleEngaged() {
    if (typeof facilityPlay === "undefined" || !facilityPlay || typeof player === "undefined" || !player || typeof actors === "undefined") return false;
    if (typeof attractOn === "function" && attractOn()) return false;   // (the website's background has no player)
    const R = BATTLE_VIEW.reach, fol = typeof followers !== "undefined" ? followers : [], f = _bvF();
    for (const a of actors) {
        if (!a || a.dead || a.isClone || a.team === "green" || !(typeof Predator === "undefined" || a instanceof Predator)) continue;
        if (a.asleep > 0) continue;
        const dx = a.x - player.x, dy = a.y - player.y; if (dx * dx + dy * dy > R * R) continue;
        if (!(_bvGreen(a.currentTarget) || _bvGreen(a.biteTarget) || (_bvGreen(a.lastAttacker) && f - (a._lagAt === undefined ? -1e9 : a._lagAt) <= BATTLE_VIEW.hit) || fol.some(f => f && !f.dead && f.attackOrder && f.attackOrder.target === a))) continue;
        if (typeof facilitySeesFrom === "function" && !facilitySeesFrom(player.x, player.y, a.x, a.y)) continue;
        return true;
    }
    return false;
}
// each step (js/game.js render): the check every few frames, the ease in and out
function battleViewTick() {
    const f = _bvF();
    if (f - _bv.checkAt >= BATTLE_VIEW.every || f < _bv.checkAt) { _bv.checkAt = f; if (battleEngaged()) _bv.engagedAt = f; }
    let want = f - _bv.engagedAt <= BATTLE_VIEW.hold ? 1 : 0;
    if (typeof dialogueCurrent === "function" && dialogueCurrent()) want = 0;   // the dialogue box: out
    if (typeof attractOn === "function" && attractOn()) want = 0;
    if (want > _bv.k) _bv.k = Math.min(1, _bv.k + 1 / BATTLE_VIEW.easeIn + 1e-9); else if (want < _bv.k) _bv.k = Math.max(0, _bv.k - 1 / BATTLE_VIEW.easeOut - 1e-9);   // (the hair: exactly 1 and 0 at the ends)
    _bv.z = _bv.k > 0 ? 1 + (BATTLE_VIEW.zoom - 1) * _bvSmooth(_bv.k) : 1;
}
// is the HUD the world pass draws (the network panel, the Nest's meter) held back for after the copy?
function battleViewDefers() { return _bv.z > 1.0001; }

// ── THE COPY: the world zoomed; the edges; the held-back HUD ──
function _bvCv(key, w, h) {
    let o = _bvDraw.cvs[key];
    if (!o) { const c = typeof document !== "undefined" && document.createElement ? document.createElement("canvas") : null, g = c && c.getContext ? c.getContext("2d") : null; if (!g) return null; o = _bvDraw.cvs[key] = { c, g, w: 0, h: 0, made: "" }; }
    if (o.w !== w || o.h !== h) { o.c.width = w; o.c.height = h; o.w = w; o.h = h; o.made = ""; }
    return o;
}
// an ellipse of the screen's shape: inner share clear, outer share full (`col0` to `col1`), drawn once a size
function _bvRing(key, W, H, r0, r1, col0, col1) {
    const o = _bvCv(key, W, H); if (!o) return null; const tag = W + "x" + H + ":" + r0 + ":" + r1 + col1;
    if (o.made !== tag) { const g = o.g; g.clearRect(0, 0, W, H); g.save(); g.translate(W / 2, H / 2); g.scale(W / H, 1); const gr = g.createRadialGradient(0, 0, r0 * H, 0, 0, r1 * H); gr.addColorStop(0, col0); gr.addColorStop(1, col1); g.fillStyle = gr; g.fillRect(-H, -H, 2 * H, 2 * H); g.restore(); o.made = tag; }
    return o;
}
function battleViewPost() {
    if (!battleViewDefers() || typeof ctx === "undefined" || typeof canvas === "undefined" || !canvas.width) return;
    const W = canvas.width, H = canvas.height, z = _bv.z, e = _bvSmooth(_bv.k), cx = W / 2, cy = H / 2;
    const cp = _bvCv("copy", W, H); if (!cp) return;
    cp.g.clearRect(0, 0, W, H); cp.g.drawImage(canvas, 0, 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = true;
    ctx.drawImage(cp.c, cx - W / (2 * z), cy - H / (2 * z), W / z, H / z, 0, 0, W, H);   // the world picture, zoomed about the centre
    const low = typeof gfxLow !== "undefined" && gfxLow;
    if (!low) {   // HIGH: a small copy scaled back up (a blur: the game has no canvas filter on older iPads), kept only towards the edges
        const s1 = _bvCv("s1", Math.max(1, Math.ceil(W / 4)), Math.max(1, Math.ceil(H / 4))), s2 = _bvCv("s2", Math.max(1, Math.ceil(W / 14)), Math.max(1, Math.ceil(H / 14))), ed = _bvCv("edge", W, H), mask = _bvRing("blurMask", W, H, BATTLE_VIEW.blur.inner, BATTLE_VIEW.blur.outer, "rgba(0,0,0,0)", "rgba(0,0,0,1)");
        if (s1 && s2 && ed && mask) {
            s1.g.clearRect(0, 0, s1.w, s1.h); s1.g.drawImage(canvas, 0, 0, s1.w, s1.h); s2.g.clearRect(0, 0, s2.w, s2.h); s2.g.drawImage(s1.c, 0, 0, s2.w, s2.h);
            ed.g.globalCompositeOperation = "source-over"; ed.g.clearRect(0, 0, W, H); ed.g.imageSmoothingEnabled = true; ed.g.drawImage(s2.c, 0, 0, W, H);
            ed.g.globalCompositeOperation = "destination-in"; ed.g.drawImage(mask.c, 0, 0); ed.g.globalCompositeOperation = "source-over";
            ctx.globalAlpha = e; ctx.drawImage(ed.c, 0, 0); ctx.globalAlpha = 1;
        }
    }
    const dark = _bvRing(low ? "darkLow" : "dark", W, H, BATTLE_VIEW.dark.inner, BATTLE_VIEW.dark.outer, "rgba(4,6,12,0)", "rgba(4,6,12," + (low ? BATTLE_VIEW.dark.low : BATTLE_VIEW.dark.high) + ")");
    if (dark) { ctx.globalAlpha = e; ctx.drawImage(dark.c, 0, 0); ctx.globalAlpha = 1; }
    ctx.restore();
    if (typeof drawFacilityNetworkHUD === "function") drawFacilityNetworkHUD();   // held back from the world pass: unzoomed, where it always is
    if (typeof nestMeterDraw === "function") nestMeterDraw();
}

// ── THE FIGHTERS: you, your squad near you, the creatures near you ──
function _bvFighters() {
    const f = _bvF(); if (_bvDraw.fightersAt === f && _bvDraw.fighters) return _bvDraw.fighters;
    const out = []; _bvDraw.fightersAt = f; _bvDraw.fighters = out;
    if (typeof actors === "undefined" || typeof player === "undefined" || !player) return out;
    for (const a of actors) {
        if (!a || a.dead || !(a.health > 0) || a._swallowedBy) continue;
        const mine = a.isFollower === true || (a.isClone && a.team === "green"), theirs = !mine && a.team !== "green" && !a.isClone && (typeof Predator === "undefined" || a instanceof Predator);
        if (!mine && !theirs) continue;
        if (Math.hypot(a.x - player.x, a.y - player.y) > 9) continue;
        out.push({ a, mine });
    }
    return out;
}
// a unit's picture on the screen (the world pass's coordinates): its feet and a box over them
function _bvUnitBox(x, y) {
    const sx = (x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, sy = (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0);
    return [sx - 0.45 * TILE_W, sy - 1.6 * TILE_W, sx + 0.45 * TILE_W, sy + 8];
}

// ── THE OBJECTS IN FRONT OF A FIGHTER ──
// the picture an object was last drawn with (js/propsprites.js _psBlit tells, while drawFacilityItem draws it)
function _bvNoteRect(x, y, w, h) {
    const it = _bvDraw.item; if (!it) return; const f = _bvF(), e = _bvDraw.rects.get(it);
    if (!e || e.at !== f) _bvDraw.rects.set(it, { at: f, r: [x, y, x + w, y + h] }); else { const r = e.r; r[0] = Math.min(r[0], x); r[1] = Math.min(r[1], y); r[2] = Math.max(r[2], x + w); r[3] = Math.max(r[3], y + h); }
}
function battleHides(it) {
    if (!battleViewOn() || !it || it.fp !== "prop") return false;
    const e = _bvDraw.rects.get(it); let r = e && e.r;
    if (!r) { const b = _bvUnitBox(it.x + 0.5, it.y + 0.5); r = [b[0] - 10, b[1] + 20, b[2] + 10, b[3] + 20]; }   // (an object drawn without a sprite: about a unit's size on its tile)
    const d = it.x + it.y;
    if (typeof player !== "undefined" && player && d > player.visualX + player.visualY + 0.3) { const b = _bvUnitBox(player.visualX, player.visualY); if (r[0] < b[2] && r[2] > b[0] && r[1] < b[3] && r[3] > b[1]) return true; }
    for (const F of _bvFighters()) { const a = F.a; if (d <= a.x + a.y + 0.3) continue; const b = _bvUnitBox(a.x, a.y); if (r[0] < b[2] && r[2] > b[0] && r[1] < b[3] && r[3] > b[1]) return true; }
    return false;
}
// how far an object has faded (0 itself, 1 its ghost): it fades while it hides a fighter, and comes back after, BATTLE_VIEW.fade frames each way
function _bvFadeOf(it) { const a = _bvDraw.fade.get(it); return a === undefined ? 0 : a; }
// js/facilityplay.js drawFacilityItem, for an object: true when it was drawn here, fading or a ghost (its floor and outline are drawn with the floor: battleViewDecals)
function battleFadeProp(it) {
    if (_bvDraw.ghosting) return false;
    const hide = battleHides(it); let f = _bvDraw.fade.get(it);
    if (f === undefined && !hide) return false;
    f = Math.max(0, Math.min(1, (f || 0) + (hide ? 1 : -1) / BATTLE_VIEW.fade));
    if (f < 1e-6) { _bvDraw.fade.delete(it); return false; }   // (back: itself again)
    _bvDraw.fade.set(it, f);
    const a = 1 - (1 - BATTLE_VIEW.ghost) * f * _bv.k;
    _bvDraw.ghosting = true; const g0 = ctx.globalAlpha; ctx.globalAlpha = g0 * a;
    try { if (typeof drawFacilityItem === "function") drawFacilityItem(it); } finally { ctx.globalAlpha = g0; _bvDraw.ghosting = false; }
    return true;
}
function battleViewDrawing(it) { _bvDraw.item = it && it.fp === "prop" && _bv.k > 0.001 ? it : null; }   // (out of the view nothing is noted)

// ── THE FLOOR FIRST (js/game.js drawDepthOf): the tiles on your floor's level, while the view is on ──
function battleFloorFirst(o) {
    if (!battleViewOn() || typeof facilityHeightAt !== "function" || typeof _fp === "undefined" || !_fp || !_fp.F) return false;
    let lv = _bvDraw.tileLv.get(o); if (lv === undefined) { lv = facilityHeightAt(o.x, o.y, _fp.F); _bvDraw.tileLv.set(o, lv); }
    const f = _bvF(); if (_bvDraw.lvAt !== f) { _bvDraw.lvAt = f; _bvDraw.lv = facilityHeightAt(player.x, player.y, _fp.F); }
    return Math.abs(lv - _bvDraw.lv) < 0.01;
}
const BV_FLOOR0 = -1e6, BV_STAMP0 = -9e5, BV_DECAL0 = -5e5;

// ── WRITTEN ON THE FLOOR ──
// (x, y) in the facility's floor coordinates (js/facilityplay.js _fpP); local x runs up-right along the floor, local y towards the camera
function _bvOnFloor(x, y, fn) { _fpBase = facilityLiftPx(x, y); const o = _fpP(x, y, 0); ctx.save(); ctx.translate(o[0], o[1]); ctx.transform(1, -0.5, 1, 0.5, 0, 0); ctx.globalAlpha *= _bv.k; try { fn(); } finally { ctx.restore(); } }
const BV_FLOOR_FACE = '"BV Titan", "Arial Black", Impact, sans-serif';   // the floor's one face (Titan One: fonts/battle, docs/BATTLE-LOOK.md)
function _bvFloorWord(text, x, y, col, shake, alpha) {
    _bvOnFloor(x, y, () => {
        ctx.globalAlpha *= alpha; ctx.font = "19px " + BV_FLOOR_FACE; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
        const f = _bvF(), sx = shake ? Math.sin(f * 2.1) * shake : 0, sy = shake ? Math.cos(f * 2.9) * shake * 0.6 : 0;
        ctx.lineWidth = 5; ctx.strokeStyle = "rgba(5,6,12,0.85)"; ctx.strokeText(text, sx, sy); ctx.fillStyle = col; ctx.fillText(text, sx, sy);
    });
}
// an element's symbol (the energy cards' glyphs, js/energy.js ENERGY_GLYPHS), in its colour, made once
function _bvGlyph(id) {
    if (_bvDraw.glyphs[id] !== undefined) return _bvDraw.glyphs[id];
    _bvDraw.glyphs[id] = null;
    try {
        const svg = typeof ENERGY_GLYPHS !== "undefined" ? ENERGY_GLYPHS[id] : null, e = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(x => x.id === id) : null;
        if (!svg || !e || typeof Image === "undefined") return null;
        const im = new Image(); im.onload = () => { _bvDraw.glyphs[id] = im; };
        im.src = "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="' + e.color + '" color="' + e.color + '">' + svg + "</svg>");
    } catch (err) { /* no picture: the level alone */ }
    return null;
}
// a creature's bar on the floor before it, its level and its element's tag at the bar's left end
function _bvCreatureBar(a, bx, by) {
    const L = BATTLE_VIEW.bar.len, T = BATTLE_VIEW.bar.thick, f = Math.max(0, Math.min(1, (typeof battleBarHealth === "function" ? battleBarHealth(a) : a.health) / (a.maxHealth || 1)));
    _bvOnFloor(bx, by, () => {
        if (typeof battleBarFx === "function") battleBarFx(a, L, T);   // (the numbers' landings shake it and knock its piece off: build 2026-11-11i)
        ctx.fillStyle = "rgba(5,7,14,0.8)"; ctx.fillRect(-L / 2 - 2, -T / 2 - 2, L + 4, T + 4); ctx.fillStyle = "#e8443a"; ctx.fillRect(-L / 2, -T / 2, L * f, T);
        ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fillRect(-L / 2, -T / 2, L * f, 3); ctx.strokeStyle = "rgba(230,240,255,0.7)"; ctx.lineWidth = 1.2; ctx.strokeRect(-L / 2 - 2, -T / 2 - 2, L + 4, T + 4);
        const el = a.element && a.element !== "none" && typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === a.element) : null, lv = "LV" + (a.level || 1);
        let x = -L / 2 - 6; ctx.font = "12px " + BV_FLOOR_FACE; ctx.textAlign = "right"; ctx.textBaseline = "middle"; ctx.lineJoin = "round"; ctx.lineWidth = 3.5; ctx.strokeStyle = "rgba(5,6,12,0.9)";
        ctx.strokeText(lv, x, 0.5); ctx.fillStyle = "#eef3fa"; ctx.fillText(lv, x, 0.5);
        x -= ctx.measureText(lv).width + 5;
        const im = el && !el.none ? _bvGlyph(el.id) : null;
        if (el && !el.none) { const q = 15; ctx.fillStyle = "rgba(5,7,14,0.85)"; ctx.fillRect(x - q, -q / 2, q, q); ctx.strokeStyle = el.color; ctx.lineWidth = 1.3; ctx.strokeRect(x - q, -q / 2, q, q); if (im) ctx.drawImage(im, x - q + 2, -q / 2 + 2, q - 4, q - 4); }
    });
}
// js/facilityplay.js facilityDrawItems: what is written on the floor joins the draw list, over the floor and under all that stands on it
function battleViewDecals(drawList) {
    if (!battleViewOn() || typeof _fp === "undefined" || !_fp || typeof _fpP !== "function") return;
    // a faded object's floor (the map draws none under an object: the next tile's) and its outline
    for (let i = 0, n = drawList.length; i < n; i++) {
        const it = drawList[i]; if (!it || it.fp !== "prop" || !(_bvFadeOf(it) > 0 || battleHides(it))) continue;
        drawList.push({ type: "fp", fp: "bvdecal", x: it.x, y: it.y, depth: BV_STAMP0 + it.x + it.y, draw: () => {
            _fpBase = it.base || 0; const x = it.x, y = it.y, dia = [_fpP(x - 0.5, y - 0.5, 0), _fpP(x + 0.5, y - 0.5, 0), _fpP(x + 0.5, y + 0.5, 0), _fpP(x - 0.5, y + 0.5, 0)];
            const nk = [[x - 1, y], [x, y - 1], [x + 1, y], [x, y + 1]].map(([u, v]) => u + "," + v).find(k => _fp.floorOps && _fp.floorOps.get(k));
            if (nk && typeof _fpDrawOps === "function") { const c = _fpP(x, y, 0); _fpDrawOps(_fp.floorOps.get(nk), c[0], c[1], nk); if (typeof _fpTileLight === "function" && typeof _fpDarkTileOver === "function") _fpDarkTileOver(c[0], c[1], _fpTileLight(x, y, it.room)); }   // (in its room's light)
            ctx.save(); ctx.globalAlpha *= _bv.k * _bvFadeOf(it); _fpQuad(dia, "rgba(200,220,255,0.10)", "rgba(215,235,255,0.9)", 2.2); ctx.restore();   // (as far as it has faded)
        } });
    }
    for (const F of _bvFighters()) {
        const a = F.a, tx = a.x - 0.5, ty = a.y - 0.5, col = F.mine ? "#4dff9a" : "#ff5a4a";   // its feet are at the floor's (x - 0.5, y - 0.5)
        drawList.push({ type: "fp", fp: "bvdecal", x: tx, y: ty, depth: BV_DECAL0 + tx + ty, draw: () => {   // its tile, lit
            _fpBase = facilityLiftPx(a.x, a.y); const q = 0.42, d = [_fpP(tx - q, ty - q, 0), _fpP(tx + q, ty - q, 0), _fpP(tx + q, ty + q, 0), _fpP(tx - q, ty + q, 0)];
            ctx.save(); ctx.globalAlpha *= _bv.k; _fpQuad(d, F.mine ? "rgba(77,255,154,0.10)" : "rgba(255,90,74,0.12)", col, 1.6); ctx.restore();
        } });
        if (!F.mine) { const bx = a.x - 0.05, by = a.y - 0.05; drawList.push({ type: "fp", fp: "bvdecal", x: bx, y: by, depth: BV_DECAL0 + bx + by + 0.1, draw: () => _bvCreatureBar(a, bx, by) }); }   // its health on the floor
        if (a.stunned > 0) { const wx = a.x + 0.3, wy = a.y + 0.3; drawList.push({ type: "fp", fp: "bvdecal", x: wx, y: wy, depth: BV_DECAL0 + wx + wy + 0.2, draw: () => _bvFloorWord("STUNNED", wx, wy, "#ffe14d", 0, 1) }); }
    }
    if (typeof floatingTexts !== "undefined") for (const t of floatingTexts) if (t && t.world && /WEAK/.test(t.text)) {   // WEAK!: written on the ground where the weakness was hit, shaking
        const wx = t.x + 0.3, wy = t.y + 0.3, age = _bvAge(t);
        drawList.push({ type: "fp", fp: "bvdecal", x: wx, y: wy, depth: BV_DECAL0 + wx + wy + 0.3, draw: () => _bvFloorWord("WEAK!", wx, wy, "#ff4d3a", age < 30 ? 3 : 1.4, Math.min(1, t.life / 25)) });
    }
}
// how long a floating word has been up (its life when first seen here, kept beside it)
function _bvAge(t) { let l0 = _bvDraw.life0.get(t); if (l0 === undefined) { l0 = t.life; _bvDraw.life0.set(t, l0); } return l0 - t.life; }
// js/draw.js: no names and no small bars over the units while the view is on (their health is on the floor and on the roster)
function battleHidesUnitHud(a) { return battleViewOn() && _bv.k > 0.5; }
// js/drops.js drawFloatingTexts: a word the view handles itself. "floor" (WEAK, STUNNED: on the floor instead), "resist" (small and pale, off like nothing), or null
function battleWordRole(t) {
    if (!battleViewOn() || !t || !t.world) return null;
    if (/WEAK/.test(t.text) || t.text === "STUNNED") return "floor";
    if (/RESIST/.test(t.text)) return "resist";
    return null;
}
function battleDrawResist(t, tx, ty) {
    const age = _bvAge(t);
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - age / 26) * 0.85; ctx.font = "bold 11px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(5,6,12,0.8)";
    const x = tx + age * 0.7, y = ty - age * 1.6; ctx.strokeText("resist", x, y); ctx.fillStyle = "#aab6c8"; ctx.fillText("resist", x, y); ctx.restore();
}
// the faces load as soon as the page can: the floor's (Titan One) first (game.html declares them: fonts/battle)
try { if (typeof document !== "undefined" && document.fonts && document.fonts.load) document.fonts.load('19px "BV Titan"').catch(() => {}); } catch (err) { /* no fonts API: the fallback face */ }
