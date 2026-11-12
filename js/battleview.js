// ─────────────────────────────────────────────────────────
//  THE BATTLE VIEW (docs/BATTLE-LOOK.md; the owner, 2026-11-11: "more like a JRPG")
// ─────────────────────────────────────────────────────────
// When a creature engages you or your squad, the camera eases in (BATTLE_VIEW.zoom) and the edges soften: on HIGH a blur kept towards the edges and a darkening, on GRAPHICS: LOW the darkening
// alone. It eases back out BATTLE_VIEW.hold frames after the last creature that engaged. While it is on:
//   THE ZOOM       a copy of the finished world picture (the world pass and its overlays), scaled about the centre, made just before the floating words (js/game.js render: battleViewPost).
//                  So nothing that draws the world changes. What is drawn after it and sits on the world goes through bvZoomPt (the floating words: js/drops.js floatingTextScreen; the
//                  lock-on and the dial's brackets: js/gunfire.js _gunScreen; a follower's pick point: js/input.js followerPickPoint); a tap on the world comes back through bvUnzoom
//                  (the pickers that work out the world from the screen: js/input.js, js/techabilities.js, js/fluxmove.js, js/mutator.js, js/stations.js, js/specimen.js).
//                  The HUD the world pass draws (the network panel) is held back and drawn after the copy, so it stays where it is.
//   THE FLOOR      drawn first (the tiles on your floor's level), then what is written on it, then all that stands on it (js/game.js drawDepthOf: battleFloorFirst). Written on it:
//                  each fighter's tile lit (green yours, red theirs); a creature's health on the floor before it, its level and its element's tag by the bar (your followers' health is
//                  on the roster: no bar on the floor for them); WEAK! along the tile, shaking, where a weakness was hit; STUNNED along the tile by one stunned, while it lasts.
//   THE WORDS      RESIST floats off small and pale, like nothing (js/drops.js); WEAK and STUNNED are on the floor instead of in the air; no names over the units, no small bars
//                  (js/draw.js asks battleHidesUnitHud).
//   THE OBJECTS    one standing in front of a fighter (nearer the camera, its picture over the fighter's) fades to a ghost (BATTLE_VIEW.ghost, over BATTLE_VIEW.fade), the whole object at once
//                  however many tiles it covers, with a bright outline round its tiles and the floor under them; it still counts (cover, sight, walking, FLUX MOVE), as always (js/facilityplay.js
//                  drawFacilityItem asks battleFadeProp). A wall piece does the same, piece by piece (battleFadeWall). Build 2026-11-11l had every big object and every wall go faint in a fight;
//                  playtesting, the owner: "if I'm in combat and I'm in front of an object and everything that's happening is also in front of that object, it shouldn't be transparent" (build
//                  2026-11-11r): an object or a wall fades only while it stands in front of someone in the fight, big or small.
//   THE NUMBERS    (build 2026-11-11i) a hit's number, bigger and in its damage type's face (BV_FACES), is knocked off whoever was hit the way the blow went; a creature's glides back into its floor
//                  bar where the health is cut and lies flat there, and the bar drops only as it lands; a bonus in the hit lands second, +N in gold. A follower's just goes, and its card on the
//                  roster answers: it lights and shakes, its health moves, and the −N, a heal's +N and WEAK! fly out of its side (js/helpers.js applyDamage tags the number: battleNumberTag).
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
    // the numbers (frames, px): the knock; a creature's back in its bar's cut by `glide`, gone `gone` after; a follower's gone `fade` after the knock; how far the knock sends it; its size against
    // today's; a bar's shake on a landing; a follower's card lit and shaking; a word beside the roster; WEAK! that long after the number; the other words' size in a fight
    num: { knock: 8, glide: 20, gone: 8, fade: 6, push: 38, scale: 1.8, shake: 6, card: 16, pop: 44, weakAfter: 20, word: 1.35 },
};
const _bv = { k: 0, z: 1, engagedAt: -1e9, checkAt: -1e9 };   // the view's state: how far in, the zoom, when a creature last engaged, when it last looked (a step with no picture keeps it as a drawn one does)
// What only the drawing keeps (a step with no picture fills none of it: tests/ghost.js IGNORE): its canvases, this frame's fighters, the elements' symbols, the object being drawn and the ghost's guard,
// your floor's level this frame; and, kept beside them rather than written on them, each object's picture as last drawn and how far it has faded, each floating word's first life, each floor tile's level.
// The numbers: what each hit's number is (whom it hit, its face, the blow's way, its bonus: set as the hit lands, read only by the drawing), when each part of it landed, the pieces knocked off
// the bars, the words beside the roster, when each unit was last hit, the words of this frame, the outlined texts made once. An object's fade is by the object (its id), not by the tile.
const _bvDraw = { cvs: {}, fighters: null, fightersAt: -1, glyphs: {}, item: null, ghosting: false, lv: 0, lvAt: -1, rects: new WeakMap(), life0: new WeakMap(), tileLv: new WeakMap(),
    fade: new Map(), wfade: new Map(), wallHide: new Set(), hideIds: new Set(), hideAt: -1, floorKey: new Map(), hits: new WeakMap(), land: new WeakMap(), popped: new WeakSet(), chunks: [], pops: [], unitHit: new WeakMap(), words: [], txt: new Map() };
function _bvF() { return typeof frame !== "undefined" ? frame : 0; }
function _bvSmooth(k) { return k * k * (3 - 2 * k); }
function battleViewOn() { return _bv.k > 0.001; }
function battleViewK() { return _bv.k; }
function battleViewZoom() { return _bv.z; }
// a knockout (js/game.js; the queen's, js/quests.js questQueenTakesYou): the view eases out now, not 3 s on
function battleViewDrop() { _bv.engagedAt = -1e9; }
function battleViewReset() { _bv.k = 0; _bv.z = 1; _bv.engagedAt = -1e9; _bv.checkAt = -1e9; _bvDraw.fade = new Map(); _bvDraw.wfade = new Map(); _bvDraw.wallHide = new Set(); _bvDraw.floorKey = new Map(); _bvDraw.chunks = []; _bvDraw.pops = []; }
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
// is the HUD the world pass draws (the network panel) held back for after the copy?
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
// an object (all the tiles of one solid: js/facilityplay.js _fpPropItems gives each its id)
function _bvObj(it) { return it.id !== undefined && it.id !== null ? it.id : it; }
// js/propsprites.js facilitySpriteDraw: is this tile drawing its object's whole picture (the ghost of a big object, once a frame)?
function battleDrawsWhole(it) { return !!it && _bvDraw.wholeFor === it; }
// how far an object has faded (0 itself, 1 its ghost): it fades while any of its tiles hides a fighter (battleViewDecals finds them, each frame), and comes back after, BATTLE_VIEW.fade frames each way
function battleFadeOf(it) { const e = _bvDraw.fade.get(_bvObj(it)); return e ? e.f : 0; }
// js/facilityplay.js drawFacilityItem, for an object: true when it was drawn here, fading or a ghost (its floor and outline are drawn with the floor: battleViewDecals)
function battleFadeProp(it) {
    if (_bvDraw.ghosting) return false;
    const key = _bvObj(it), f0 = _bvF(), hide = _bvDraw.hideAt === f0 && _bvDraw.hideIds.has(key); let e = _bvDraw.fade.get(key);
    if (!e) { if (!hide) return false; e = { f: 0, at: -1 }; _bvDraw.fade.set(key, e); }
    if (e.at !== f0) { e.at = f0; e.f = Math.max(0, Math.min(1, e.f + (hide ? 1 : -1) / BATTLE_VIEW.fade)); }   // (once a frame for the whole object, however many tiles it has)
    if (e.f < 1e-6) { _bvDraw.fade.delete(key); return false; }   // (back: itself again)
    const a = 1 - (1 - BATTLE_VIEW.ghost) * e.f * _bv.k;
    // a picture of many tiles is drawn whole, once a frame, by the first of its tiles drawn (the one farthest back): each tile's column of it overlapping the next would stack the ghost back up
    const S = it.id !== undefined && typeof _psSolid === "function" ? _psSolid(it.id) : null, fam = S && S.multi && typeof PS_FAMILY !== "undefined" ? PS_FAMILY[it.kind] : null, whole = !!fam && typeof _psImg === "function" && !!_psImg(fam);
    if (whole) { if (e.wholeAt === f0) return true; e.wholeAt = f0; }
    _bvDraw.ghosting = true; _bvDraw.wholeFor = whole ? it : null; const g0 = ctx.globalAlpha; ctx.globalAlpha = g0 * a;
    try { if (typeof drawFacilityItem === "function") drawFacilityItem(it); } finally { ctx.globalAlpha = g0; _bvDraw.ghosting = false; _bvDraw.wholeFor = null; }
    return true;
}
// js/facilityplay.js drawFacilityItem, for a wall and what belongs to it (the rock, glass, railings, door frames, the corner posts, what hangs on a wall): faint while that piece stands in
// front of someone in the fight (battleViewDecals finds them, each frame), coming and going over BATTLE_VIEW.fade frames as an object does; it still stops shots and the way, as always
const BV_WALLISH = new Set(["wall", "rockbend", "door", "pillar", "fixture", "wdecor"]);
function battleFadeWall(it) {
    if (_bvDraw.ghosting || !it || !BV_WALLISH.has(it.fp) || !(_bv.k > 0.001)) return false;
    const f0 = _bvF(), hide = _bvDraw.hideAt === f0 && _bvDraw.wallHide.has(it); let e = _bvDraw.wfade.get(it);
    if (!e) { if (!hide) return false; e = { f: 0, at: -1 }; _bvDraw.wfade.set(it, e); }
    if (e.at !== f0) { e.at = f0; e.f = Math.max(0, Math.min(1, e.f + (hide ? 1 : -1) / BATTLE_VIEW.fade)); }
    if (e.f < 1e-6) { _bvDraw.wfade.delete(it); return false; }   // (back: itself again)
    _bvDraw.ghosting = true; const g0 = ctx.globalAlpha; ctx.globalAlpha = g0 * (1 - (1 - BATTLE_VIEW.ghost) * e.f * _bv.k);
    try { if (typeof drawFacilityItem === "function") drawFacilityItem(it); } finally { ctx.globalAlpha = g0; _bvDraw.ghosting = false; }
    return true;
}
// a wall piece's place on the screen (the world pass's coordinates, as _bvUnitBox): from its foot to its top, along it (its ends a and b, a corner's s0 and s1, or its own tile)
function _bvWallRect(it) {
    const H = (typeof FP_WALL_H === "number" ? FP_WALL_H : 122) + Math.max(0, (it.base2 || it.base || 0) - (it.base || 0)), E = it.a && it.b ? [it.a, it.b] : it.s0 && it.s1 ? [it.s0, it.s1] : [[it.x - 0.5, it.y], [it.x, it.y - 0.5]];
    const b0 = _fpBase; _fpBase = facilityLiftPx(it.x, it.y); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    try { for (const p of E) for (const z of [0, H]) { const q = _fpP(p[0], p[1], z); if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; } } finally { _fpBase = b0; }
    return [x0, y0, x1, y1];
}
// does a wall piece stand in front of someone in the fight (nearer the camera, over them on the screen)?
function _bvWallHides(it) {
    const d = it.x + it.y; let r = null;
    const over = (x, y) => { if (d <= x + y + 0.3) return false; if (!r) r = _bvWallRect(it); const b = _bvUnitBox(x, y); return r[0] < b[2] && r[2] > b[0] && r[1] < b[3] && r[3] > b[1]; };
    if (typeof player !== "undefined" && player && over(player.visualX, player.visualY)) return true;
    for (const F of _bvFighters()) if (over(F.a.x, F.a.y)) return true;
    return false;
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
    const L = BATTLE_VIEW.bar.len, T = BATTLE_VIEW.bar.thick, f = Math.max(0, Math.min(1, battleBarHealth(a) / (a.maxHealth || 1))), f0 = _bvF(), at = _bvDraw.unitHit.get(a), k = at === undefined ? 1e9 : f0 - at, S = BATTLE_VIEW.num.shake;
    _bvOnFloor(bx, by, () => {
        if (k >= 0 && k < S) ctx.translate(Math.sin(k * 2.6) * 1.2 * (1 - k / S), 0);   // a number landing shakes it, a little (the owner: less jumping)
        ctx.fillStyle = "rgba(5,7,14,0.8)"; ctx.fillRect(-L / 2 - 2, -T / 2 - 2, L + 4, T + 4); ctx.fillStyle = "#e8443a"; ctx.fillRect(-L / 2, -T / 2, L * f, T);
        ctx.fillStyle = "rgba(255,255,255,0.25)"; ctx.fillRect(-L / 2, -T / 2, L * f, 3); ctx.strokeStyle = "rgba(230,240,255,0.7)"; ctx.lineWidth = 1.2; ctx.strokeRect(-L / 2 - 2, -T / 2 - 2, L + 4, T + 4);
        for (const c of _bvDraw.chunks) { if (c.a !== a) continue; const j = f0 - c.at; if (j < 0 || j > 18) continue;   // the piece a number knocked off: white for a moment, then falling away
            ctx.save(); ctx.globalAlpha *= 1 - j / 18; ctx.translate(-L / 2 + L * c.f1, j * 1.1); ctx.rotate(j * 0.035); ctx.fillStyle = j < 3 ? "#ffffff" : "#e8443a"; ctx.fillRect(0, -T / 2, L * (c.f0 - c.f1), T); ctx.restore(); }
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
    // the objects that hide a fighter this frame (any tile of one does: the whole object fades), then each fading object's floor (the map draws none under an object) and its outline
    const f0 = _bvF(), hide = _bvDraw.hideIds, cells = new Map(); hide.clear(); _bvDraw.hideAt = f0;
    for (let i = 0, n = drawList.length; i < n; i++) { const it = drawList[i]; if (it && it.fp === "prop" && battleHides(it)) hide.add(_bvObj(it)); }   // (big or small: only one that stands in front of someone in the fight, build 2026-11-11r)
    const wh = _bvDraw.wallHide; wh.clear(); for (let i = 0, n = drawList.length; i < n; i++) { const it = drawList[i]; if (it && BV_WALLISH.has(it.fp) && _bvWallHides(it)) wh.add(it); }   // (the wall pieces in front of someone)
    for (let i = 0, n = drawList.length; i < n; i++) {
        const it = drawList[i]; if (!it || it.fp !== "prop") continue; const key = _bvObj(it); if (!hide.has(key) && !_bvDraw.fade.has(key)) continue;
        let set = cells.get(key); if (!set) { set = new Set(); cells.set(key, set); } set.add(it.x + "," + it.y);
        drawList.push({ type: "fp", fp: "bvdecal", x: it.x, y: it.y, depth: BV_STAMP0 + it.x + it.y, draw: () => _bvStamp(it, key, set) });
    }
    if (_bvDraw.chunks.length) _bvDraw.chunks = _bvDraw.chunks.filter(c => f0 - c.at <= 18);
    for (const F of _bvFighters()) {
        // (the Electro Skink swirling round an enemy is not at its own feet: its tile is lit where its vortex is, round the enemy's, a little wider so both show: js/evolution.js skinkSwirlSpot)
        const a = F.a, sw = F.mine && typeof skinkSwirlSpot === "function" ? skinkSwirlSpot(a) : null, ax = sw ? sw.x : a.x, ay = sw ? sw.y : a.y, tx = ax - 0.5, ty = ay - 0.5, col = F.mine ? "#4dff9a" : "#ff5a4a";   // its feet are at the floor's (x - 0.5, y - 0.5)
        drawList.push({ type: "fp", fp: "bvdecal", x: tx, y: ty, depth: BV_DECAL0 + tx + ty, draw: () => {   // its tile, lit
            _fpBase = facilityLiftPx(ax, ay); const q = sw ? 0.52 : 0.42, d = [_fpP(tx - q, ty - q, 0), _fpP(tx + q, ty - q, 0), _fpP(tx + q, ty + q, 0), _fpP(tx - q, ty + q, 0)];
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
// a fading object's tile: its floor (the nearest floor's, in the room's light), and the outline round the object (only the edges that are not between two of its own tiles)
function _bvStamp(it, key, set) {
    _fpBase = it.base || 0; const x = it.x, y = it.y, c = _fpP(x, y, 0), k = _bvFloorKey(x, y);
    if (k && typeof _fpDrawOps === "function") { _fpDrawOps(_fp.floorOps.get(k), c[0], c[1], k); if (typeof _fpTileLight === "function" && typeof _fpDarkTileOver === "function") _fpDarkTileOver(c[0], c[1], _fpTileLight(x, y, it.room)); }
    const e = _bvDraw.fade.get(key), a = _bv.k * (e ? e.f : 0); if (a <= 0.001) return;   // (as far as it has faded)
    const P = [_fpP(x - 0.5, y - 0.5, 0), _fpP(x + 0.5, y - 0.5, 0), _fpP(x + 0.5, y + 0.5, 0), _fpP(x - 0.5, y + 0.5, 0)], side = [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]];
    ctx.save(); ctx.globalAlpha *= a; _fpQuad(P, "rgba(200,220,255,0.10)", null); ctx.beginPath();
    for (let i = 0; i < 4; i++) if (!set.has(side[i][0] + "," + side[i][1])) { const p = P[i], q = P[(i + 1) % 4]; ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
    ctx.lineWidth = 2.2; ctx.strokeStyle = "rgba(215,235,255,0.9)"; ctx.stroke(); ctx.restore();
}
// the floor to lay under an object's tile: the nearest tile that has one (a big object's inner tiles have no neighbour with a floor), found once
function _bvFloorKey(x, y) {
    const id = x + "," + y; if (_bvDraw.floorKey.has(id)) return _bvDraw.floorKey.get(id);
    const ops = _fp.floorOps; let found = null;
    if (ops) for (let r = 1; r <= 6 && !found; r++) for (let dx = -r; dx <= r && !found; dx++) for (let dy = -r; dy <= r; dy++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const k = (x + dx) + "," + (y + dy); if (ops.get(k)) { found = k; break; } }
    _bvDraw.floorKey.set(id, found); return found;
}
// how long a floating word has been up (its life when first seen here, kept beside it)
function _bvAge(t) { let l0 = _bvDraw.life0.get(t); if (l0 === undefined) { l0 = t.life; _bvDraw.life0.set(t, l0); } return l0 - t.life; }
// js/draw.js: no names and no small bars over the units while the view is on (their health is on the floor and on the roster)
function battleHidesUnitHud(a) { return battleViewOn() && _bv.k > 0.5; }
// js/drops.js drawFloatingTexts: a word the view handles itself. "floor" (WEAK, STUNNED: on the floor instead), "resist" (small and pale, off like nothing), "number" (a hit's: its flight,
// battleDrawNumber), "word" (any other on the world: in the status face, kept apart: battleWordQueue), or null (as it always was)
function battleWordRole(t) {
    if (!battleViewOn() || !t || !t.world) return null;
    if (/WEAK/.test(t.text) || t.text === "STUNNED") return "floor";
    if (/RESIST/.test(t.text)) return "resist";
    const h = _bvDraw.hits.get(t); if (h && !h.word && /^\u2212?\d+$/.test(String(t.text))) return "number";
    return "word";
}
function battleDrawResist(t, tx, ty) {
    const age = _bvAge(t);
    ctx.save(); ctx.globalAlpha = Math.max(0, 1 - age / 26) * 0.85; ctx.font = "bold 11px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(5,6,12,0.8)";
    const x = tx + age * 0.7, y = ty - age * 1.6; ctx.strokeText("resist", x, y); ctx.fillStyle = "#aab6c8"; ctx.fillText("resist", x, y); ctx.restore();
}
// ── THE NUMBERS (build 2026-11-11i; docs/BATTLE-LOOK.md §2, 11) ──
// column C (the owner's): one face for each damage type, and one for statuses (fonts/battle, declared in game.html)
const BV_FACES = { slashing: ["normal", "400", "BV Bangers"], piercing: ["italic", "900", "BV Barlow"], projectile: ["italic", "700", "BV Chakra"], crushing: ["normal", "400", "BV Titan"],
    earthquake: ["normal", "400", "BV Dirt"], elemental: ["normal", "900", "BV Cinzel"], status: ["normal", "700", "BV Pixelify"] };
function battleFace(kind, px) { const F = BV_FACES[kind] || BV_FACES.status; return F[0] + " " + F[1] + " " + px + 'px "' + F[2] + '", "Arial Black", Impact, sans-serif'; }
function _bvMine(u) { return !!u && (u.isFollower === true || (!!u.isClone && u.team === "green")); }
function _bvFoe(u) { return !!u && !u.isClone && !u.isFollower && u.team !== "green" && (typeof Predator === "undefined" || u instanceof Predator); }
// a hit's damage type: its own, else a follower's form's for that attack (js/damage.js dmgFormType); none (a burn's or a poison's tick, a pool, a card's echo): the status face
function _bvKindOf(hit, source) {
    let k = hit && hit.type ? hit.type : null;
    if (!k && hit && hit.which && source && source.isFollower && !source.isClone && typeof dmgFormType === "function") k = dmgFormType(source, hit.which);
    return k && BV_FACES[k] ? k : "status";
}
// js/helpers.js applyDamage, once a hit's number is up: whom it hit, its face, the way the blow went (from the attacker through the target, on the screen), and the bonus in it (`share`: the
// part with no bonus, js/damage.js dmgBaseShare). A hit between yours and a creature near you, in sight, brings the view on at once, so its number already flies.
function battleNumberTag(t, target, source, hit, share) {
    if (!t || !target) return;
    let dx = 0.8, dy = -0.6;   // (no attacker: up and away)
    if (source && source !== target && Number.isFinite(source.x) && Number.isFinite(source.y)) { const wx = target.x - source.x, wy = target.y - source.y, sx = (wx - wy) * TILE_W, sy = (wx + wy) * TILE_H, L = Math.hypot(sx, sy); if (L > 1e-3) { dx = sx / L; dy = sy / L; } }
    const all = Math.abs(parseInt(String(t.text).replace("−", ""), 10)) || 0, b0 = share < 1 && all >= 2 ? Math.max(1, Math.round(all * share)) : all;
    _bvDraw.hits.set(t, { unit: target, kind: _bvKindOf(hit, source), dir: [dx, dy], all, bonus: all - b0 });
    if (!battleViewOn() && _bvHitEngages(target, source)) { _bv.engagedAt = _bvF(); battleViewTick(); }
    if (all - b0 > 0 && !_bvMine(target) && battleViewOn()) t.life = Math.max(t.life, 2 * BATTLE_VIEW.num.glide + BATTLE_VIEW.num.gone + 2);   // (its bonus lands second: up long enough)
    _bvDraw.life0.set(t, t.life);
}
function _bvHitEngages(target, source) {
    if (typeof facilityPlay === "undefined" || !facilityPlay || typeof player === "undefined" || !player) return false;
    const foe = _bvFoe(target) ? target : _bvFoe(source) ? source : null, ours = foe === target ? source : target;
    if (!foe || !_bvGreen(ours) || foe.asleep > 0) return false;
    const dx = foe.x - player.x, dy = foe.y - player.y; if (dx * dx + dy * dy > BATTLE_VIEW.reach * BATTLE_VIEW.reach) return false;
    return !(typeof facilitySeesFrom === "function" && !facilitySeesFrom(player.x, player.y, foe.x, foe.y));
}
// js/damage.js _dmgWords, js/combat.js healUnit: a word or a heal over one of your followers flies out of its card too
function battleWordTag(t, unit) { if (t && unit && _bvMine(unit)) { _bvDraw.hits.set(t, { unit, word: true }); _bvDraw.life0.set(t, t.life); } }
// a unit's health as the view shows it: its health, and every number on its way to it not yet landed (its floor bar; its card on the roster). Asked for a number's part (`t0`, `part`): what
// the bar shows once that part has landed
function battleBarHealth(a, t0, part) {
    let hp = a.health || 0; if (!battleViewOn() || typeof floatingTexts === "undefined") return Math.max(0, hp);
    for (const t of floatingTexts) {
        const h = _bvDraw.hits.get(t); if (!h || h.word || h.unit !== a) continue; const L = _bvDraw.land.get(t);
        if (t !== t0 && !(L && L.main)) hp += h.all - h.bonus;
        if (h.bonus > 0 && !(L && L.bonus) && !(t === t0 && part === "bonus")) hp += h.bonus;
    }
    return Math.max(0, Math.min(a.maxHealth || hp, hp));
}
// a point of the world (x, y, up px over its floor) where the zoomed picture shows it
function _bvScr(x, y, up) { return bvZoomPt((x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0) - (up || 0)); }
function _bvEaseIO(u) { return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }
function _bvEaseOut(u) { return 1 - Math.pow(1 - u, 3); }
// js/drops.js drawFloatingTexts: a hit's number on its way, its main part and then its bonus
function battleDrawNumber(t) {
    const h = _bvDraw.hits.get(t); if (!h || h.word) return;
    const N = BATTLE_VIEW.num, a = h.unit, mine = _bvMine(a), age = _bvAge(t);
    _bvNumPart(t, h, a, mine, age, "main");
    if (h.bonus > 0) _bvNumPart(t, h, a, mine, age - (mine ? N.knock + 1 : N.glide + 1), "bonus");
}
function _bvNumPart(t, h, a, mine, age, part) {
    const N = BATTLE_VIEW.num, z = _bv.z, bonus = part === "bonus";
    if (age < 0 || age >= (mine ? N.knock + N.fade : N.glide + N.gone)) return;
    const L = BATTLE_VIEW.bar.len, mx = a.maxHealth || 1, d = h.dir, val = bonus ? h.bonus : h.all - h.bonus, hp = battleBarHealth(a, t, part);
    const B0 = _bvScr(a.x - 0.05, a.y - 0.05, 0), xc = -L / 2 + L * Math.max(0, Math.min(1, hp / mx)), T0 = [B0[0] + xc * z, B0[1] - 0.5 * xc * z];   // a creature's: where its bar is cut once it lands
    const S0 = bonus && !mine ? [T0[0] - 8 * z, T0[1] - 6 * z] : _bvScr(a.x - 0.5, a.y - 0.5, 34), K0 = [S0[0] + d[0] * N.push * z, S0[1] + d[1] * N.push * z - 8 * z];   // where it starts; where the knock sends it
    let x, y, fit = 0, sc = 1, alpha = 1;
    if (bonus && !mine) {   // a creature's bonus: along its bar to its own cut
        if (age < N.glide) { const u = age / N.glide, e = _bvEaseIO(u); x = S0[0] + (T0[0] - S0[0]) * e; y = S0[1] + (T0[1] - S0[1]) * e; fit = Math.max(0, (u - 0.55) / 0.45); sc = 1 - 0.15 * fit; }
        else { x = T0[0]; y = T0[1]; fit = 1; sc = 0.85; alpha = Math.max(0, 1 - (age - N.glide) / N.gone); }
    } else if (age < N.knock) { const u = _bvEaseOut(age / N.knock); x = S0[0] + (K0[0] - S0[0]) * u; y = S0[1] + (K0[1] - S0[1]) * u; sc = 0.7 + 0.3 * u; }   // knocked off
    else if (mine) { x = K0[0]; y = K0[1]; alpha = Math.max(0, 1 - (age - N.knock) / N.fade); }   // a follower's: it just goes
    else if (age < N.glide) { const u = (age - N.knock) / (N.glide - N.knock), e = _bvEaseIO(u); x = K0[0] + (T0[0] - K0[0]) * e; y = K0[1] + (T0[1] - K0[1]) * e; fit = Math.max(0, (u - 0.5) / 0.5); sc = 1 - 0.15 * fit; }   // back to its bar, fitting in
    else { x = T0[0]; y = T0[1]; fit = 1; sc = 0.85; alpha = Math.max(0, 1 - (age - N.glide) / N.gone); }   // lying flat in the cut, then gone
    if (age >= (mine ? N.knock : N.glide)) _bvLand(t, h, a, mine, part, val, hp);
    const px = Math.round((t.size || 13) * N.scale), text = (mine ? "−" : bonus ? "+" : "") + val;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.scale(sc * z, sc * z); ctx.transform(1, -0.5 * fit, fit, 1 - 0.5 * fit, 0, 0);
    _bvText(text, battleFace(h.kind, px), bonus ? "#ffcf3a" : t.color, px, "center"); ctx.restore();
}
// a part landing: the bar drops (the piece it knocked off falls) and shakes; on one of yours, its card answers and the −N flies out of it
function _bvLand(t, h, a, mine, part, val, hp) {
    let L = _bvDraw.land.get(t); if (!L) { L = { main: 0, bonus: 0 }; _bvDraw.land.set(t, L); }
    if (L[part]) return;
    const f = _bvF() || 1; L[part] = f; _bvDraw.unitHit.set(a, f);
    if (mine) _bvPop(a, "−" + val, part === "bonus" ? "#ffcf3a" : t.color, h.kind, false, f);
    else { const mx = a.maxHealth || 1, f1 = Math.max(0, Math.min(1, hp / mx)); _bvDraw.chunks.push({ a, f0: Math.min(1, f1 + val / mx), f1, at: f }); if (_bvDraw.chunks.length > 40) _bvDraw.chunks.shift(); }
}
// a text with its dark outline, as a picture made once (outlining every number in a big fight each frame cost too much: js/draw.js cachedText); drawn plainly until its face has loaded
function _bvText(text, font, color, px, align) {
    const key = font + "|" + color + "|" + text, C = _bvDraw.txt, lw = Math.max(3, px / 6); let e = C.get(key);
    if (!e && (typeof document === "undefined" || !document.fonts || !document.fonts.check || document.fonts.check(font))) {
        const cv = typeof document !== "undefined" && document.createElement ? document.createElement("canvas") : null, g = cv && cv.getContext ? cv.getContext("2d") : null;
        if (g && typeof g.measureText === "function") {
            g.font = font; const w = Math.ceil(((g.measureText(text) || {}).width || text.length * px * 0.6) + lw * 2 + 4), hh = Math.ceil(px * 1.5 + lw * 2);
            cv.width = w * 2; cv.height = hh * 2; g.scale(2, 2); g.font = font; g.textAlign = "center"; g.textBaseline = "middle"; g.lineJoin = "round"; g.lineWidth = lw; g.strokeStyle = "rgba(5,6,12,0.95)";
            g.strokeText(text, w / 2, hh / 2); g.fillStyle = color; g.fillText(text, w / 2, hh / 2);
            if (C.size > 400) C.clear(); e = { cv, w, h: hh }; C.set(key, e);
        }
    }
    if (e) { ctx.drawImage(e.cv, align === "left" ? -lw - 2 : -e.w / 2, -e.h / 2, e.w, e.h); return; }
    ctx.font = font; ctx.textAlign = align; ctx.textBaseline = "middle"; ctx.lineJoin = "round"; ctx.lineWidth = lw; ctx.strokeStyle = "rgba(5,6,12,0.95)"; ctx.strokeText(text, 0, 0); ctx.fillStyle = color; ctx.fillText(text, 0, 0);
}
// ── THE OTHER WORDS ON THE WORLD, in a fight: in the status face, a little bigger, and kept apart (the newest moves up a line until it is clear) ──
function battleWordQueue(t) { _bvDraw.words.push(t); }
function battleDrawWords() {
    const W = _bvDraw.words; if (!W.length) return; const items = [], placed = [];
    for (const t of W) { const p = floatingTextScreen(t), age = _bvAge(t), pop = age < 8 ? 1 + 0.45 * (1 - age / 8) : 1, px = Math.round((t.size || 13) * BATTLE_VIEW.num.word * pop); ctx.font = battleFace("status", px); items.push({ t, x: p[0], y: p[1], px, w: (ctx.measureText(String(t.text)) || {}).width || 0, age }); }
    W.length = 0; items.sort((a, b) => b.age - a.age);   // (the oldest keeps its place)
    for (const it of items) {
        for (let k = 0; k < 6; k++) { if (!placed.some(q => Math.abs(q.x - it.x) < (q.w + it.w) / 2 + 4 && Math.abs(q.y - it.y) < (q.px + it.px) / 2 * 0.95)) break; it.y -= Math.round(it.px * 0.9); }
        placed.push(it); ctx.save(); ctx.globalAlpha = Math.min(1, it.t.life / 30); ctx.translate(it.x, it.y); _bvText(String(it.t.text), battleFace("status", it.px), it.t.color || "#ffffff", it.px, "center"); ctx.restore();
    }
}
// ── THE ROSTER: a follower's card answers what happens to it ──
function _bvPop(f, text, color, kind, word, at) { _bvDraw.pops.push({ f, text, color, kind, word, at }); if (_bvDraw.pops.length > 24) _bvDraw.pops.shift(); }
// js/drops.js drawFloatingTexts, for every word: a word or a heal over one of your followers flies out of its card too (once; WEAK! after its number)
function battleRosterNote(t) {
    if (!battleViewOn() || !t || !t.world) return; const h = _bvDraw.hits.get(t); if (!h || !h.word || _bvDraw.popped.has(t)) return;
    _bvDraw.popped.add(t); const weak = /WEAK/.test(t.text), resist = /RESIST/.test(t.text);
    _bvPop(h.unit, weak ? "WEAK!" : resist ? "resist" : String(t.text), weak ? "#ff4d3a" : resist ? "#aab6c8" : t.color, "status", weak || resist, _bvF() + (weak ? BATTLE_VIEW.num.weakAfter : 0));
}
// the words beside the roster: out of the card's right side, a little way out, then gone; several at once stack upward
function battleDrawRoster() {
    const f = _bvF(), N = BATTLE_VIEW.num; if (!_bvDraw.pops.length) return;
    _bvDraw.pops = _bvDraw.pops.filter(p => f - p.at < N.pop);
    const E = typeof _sbEls !== "undefined" ? _sbEls : null; if (!E || !E.slots || !canvas.getBoundingClientRect) return;
    const cr = canvas.getBoundingClientRect(), kx = cr.width ? canvas.width / cr.width : 1, ky = cr.height ? canvas.height / cr.height : 1, used = new Map();
    for (const p of _bvDraw.pops) {
        const age = f - p.at; if (age < 0) continue; const el = E.slots.find(e => e._unit === p.f); if (!el || !el.getBoundingClientRect) continue;
        const r = el.getBoundingClientRect(), n = used.get(el) || 0; used.set(el, n + 1);
        const x0 = (r.right - cr.left) * kx + 10, y0 = (r.top - cr.top + r.height * 0.45) * ky - n * 18, e = _bvEaseOut(Math.min(1, age / 14)), px = p.word ? 15 : 24, sc = age < 5 ? 0.6 + 0.08 * age : 1;
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = age < 26 ? 1 : Math.max(0, 1 - (age - 26) / 18); ctx.translate(x0 + 34 * e, y0 - 10 * e); ctx.scale(sc, sc);
        _bvText(p.text, battleFace(p.word ? "status" : p.kind, px), p.color, px, "left"); ctx.restore();
    }
}
// each frame, after the numbers (js/drops.js drawFloatingTexts), so a card answers on the frame its number lands: a card whose follower was just hit lights in its element's colour (the class
// sb-hit, game.html) and shakes; its health moves as the hits land (js/party.js partySlotHealth)
function battleCardsTick() {
    const E = typeof _sbEls !== "undefined" ? _sbEls : null; if (!E || !E.slots) return; const f = _bvF(), S = BATTLE_VIEW.num.card, on = battleViewOn();
    for (const el of E.slots) {
        if (!el || !el.style) continue; const u = el._unit, at = u ? _bvDraw.unitHit.get(u) : undefined, k = at === undefined ? 1e9 : f - at;
        if (u && on && k >= 0 && k < S) { const d = 1 - k / S; el.style.transform = "translateX(" + (Math.sin(k * 2.7) * 6 * d).toFixed(1) + "px)"; el.style.filter = "brightness(" + (1 + 0.6 * d).toFixed(2) + ")"; if (!el._bvFx && el.classList) el.classList.add("sb-hit"); el._bvFx = true; }
        else if (el._bvFx) { el.style.transform = ""; el.style.filter = ""; if (el.classList) el.classList.remove("sb-hit"); el._bvFx = false; }
        if (u && (on || el._bvHp) && typeof partySlotHealth === "function") { partySlotHealth(el, u); el._bvHp = on; }   // (and once more as the view goes out: its true health)
    }
}
// the faces load as soon as the page can (game.html declares them: fonts/battle)
try { if (typeof document !== "undefined" && document.fonts && document.fonts.load) for (const k in BV_FACES) document.fonts.load(battleFace(k, 20)).catch(() => {}); } catch (err) { /* no fonts API: the fallback faces */ }
