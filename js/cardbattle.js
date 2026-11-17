// ─────────────────────────────────────────────────────────
//  CARD BATTLES, step 1: how a battle starts and how it looks (docs/CARD-BATTLES.md)
// ─────────────────────────────────────────────────────────
// The owner, 2026-11-17: fights become turn-based card battles (CARD-BATTLES.md §2). This file is the FIRST PLAYABLE STEP (§2.24: "In the 3D game, behind a switch"): a battle STARTS and
// LOOKS like one; it has no cards and no turns yet (the fight inside it is still the real-time one, until step 2 and 3 replace it).
//
// THE SWITCH: ?cards with ?engine=3d (both in the address), and only while the 3D view is drawing the room (js/view3d.js view3dShowing). Off, nothing here does anything.
// A BATTLE STARTS (§2.5) when you choose an enemy (a tap on a creature: js/targeting.js targetPress asks cardBattleTap first) or when a creature hits you or your squad
// (js/helpers.js applyDamage tells cardBattleHit). It takes in that creature and the creatures right round it (CARD_BATTLE.group, at most CARD_BATTLE.most).
// A FAR ENEMY (§2.27: "the player should move towards it, and the game should black screen and teleport the player right in front of the creature in the new battle screen"): you walk
// towards it for CARD_BATTLE.walk frames, the screen goes black (CARD_BATTLE.blackIn), you and your squad are put in front of it (CARD_BATTLE.land tiles), and the black lifts (blackOut).
// A near one, or one that hit you, starts where you stand.
// IN A BATTLE (§2.6, §2.26): the 3D camera eases to the middle of the fight, lower (CARD_BATTLE.pitch), turned to the side (yaw) and nearer (zoom) (view3d/gameview.js reads
// cardBattleCam through the view's bridge, view3d/gamemap.js battleCam); the 2D drawn over the picture waits (as while the camera swings: js/view3d.js view3dWorldEnd), and the edges
// darken and blur (cardBattlePost, from the 3D picture). Creatures not in it walk past: they pick no prey among you and yours (js/predator.js predatorPreyOk), and your squad
// and your gun go only for the creatures in it (js/npc.js, js/targeting.js targetNearest).
// IT ENDS when every creature in it is down or gone, when your squad is all down (§2.23: the game's own fall as now), or with RUN (§2.12; step 1's stand-in button: the enemies'
// last hit, §2.16, comes with the turns). The camera eases back.
// Every number here is the agent's, provisional, for the owner to judge on the iPad (CARD-BATTLES.md §11.11).
const CARD_BATTLE = {
    on: typeof location !== "undefined" && /[?&]cards\b/.test(location.search || "") && typeof VIEW3D_ON !== "undefined" && VIEW3D_ON === true,
    force3d: false,             // (the tests: as if the 3D view were drawing the room)
    far: 6,                     // tiles: an enemy chosen farther than this is walked to, then the black (§2.27)
    group: 3.5,                 // tiles round the creature: the others in the battle with it
    most: 4,                    // creatures in one battle at most
    walk: 36,                   // frames walking towards a far enemy before the black (0.6 s)
    blackIn: 14, blackHold: 8, blackOut: 22,   // frames: the black coming, held (the move is made in it), going
    land: 2.2,                  // tiles in front of the creature where you land
    easeIn: 40, easeOut: 36,    // frames: the camera to the battle and back
    pitch: 17,                  // degrees down (the game's own camera is 30)
    yaw: 0.6,                   // radians turned to the side
    zoom: 1.55,                 // nearer than the game's own camera
    leave: 14,                  // tiles: you walking this far from the fight ends it
    calm: 240,                  // frames after a battle ends (RUN, or it is over) in which the creatures that were in it go for nobody and start nothing (4 s)
    clock: 0.5,                 // THE CLOCK AT HALF (§2.28; the owner, 2026-11-17: "time slows down to about half"): the world's countdowns in a battle run at this rate
};
const _cb = { phase: "off", foes: [], k: 0, t: 0, cx: 0, cy: 0, target: null, black: 0, ranAt: -1e9, calm: [], calmUntil: -1e9 };   // calm: the creatures of the battle just ended, quiet until calmUntil   // phase: off, walk, black, on, end

function _cbF() { return typeof frame !== "undefined" ? frame : 0; }
function _cbSmooth(k) { return k * k * (3 - 2 * k); }
// is the switch on, with the 3D view drawing the room?
function cardBattleOn() { return CARD_BATTLE.on && (CARD_BATTLE.force3d || (typeof view3dShowing === "function" && view3dShowing())) && !(typeof attractOn === "function" && attractOn()); }
function cardBattleActive() { return _cb.phase !== "off" && _cb.phase !== "end"; }
function cardBattlePhase() { return _cb.phase; }
function cardBattleFoes() { return _cb.foes.slice(); }
function cardBattleBlack() { return _cb.black; }   // the black's strength, 0 to 1
function cardBattleIn(a) { return cardBattleActive() && _cb.foes.indexOf(a) >= 0; }
function _cbFoeOk(a) { return !!a && !a.dead && !a.isClone && a.team !== "green" && !a.untargetable && !(a.health <= 0) && (typeof Predator === "undefined" || a instanceof Predator); }
function _cbSquad() { const m = typeof partyMembers === "function" ? partyMembers().filter(f => f && !f.dead) : []; const c = typeof partyClone === "function" ? partyClone() : null; if (c && !c.dead) m.push(c); return m; }
// the creatures in a battle with `foe`: it, and the others round it, nearest first
function _cbGroup(foe) {
    const out = [foe], R = CARD_BATTLE.group, near = [];
    for (const a of (typeof actors !== "undefined" ? actors : [])) { if (a === foe || !_cbFoeOk(a)) continue; const d = Math.hypot(a.x - foe.x, a.y - foe.y); if (d <= R) near.push([d, a]); }
    near.sort((p, q) => p[0] - q[0]); for (const [, a] of near) { if (out.length >= CARD_BATTLE.most) break; out.push(a); }
    return out;
}
function _cbCentre() {
    const live = _cb.foes.filter(_cbFoeOk); let sx = 0, sy = 0; for (const a of live) { sx += a.x; sy += a.y; }
    if (!live.length || typeof player === "undefined") return;
    const ex = sx / live.length, ey = sy / live.length; _cb.cx = (ex + player.x) / 2; _cb.cy = (ey + player.y) / 2;
}
// those not in the battle stop going for you and yours; those in it are set on (a creature in a battle fights it)
function _cbSettle() {
    for (const a of (typeof actors !== "undefined" ? actors : [])) {
        if (!a || a.dead || !(typeof Predator === "undefined" || a instanceof Predator) || a.team === "green") continue;
        if (_cb.foes.indexOf(a) >= 0) { a.provoked = true; if (a.state === "wander") a.state = "hunt"; continue; }
        const t = a.currentTarget; if (t && (t === player || t.team === "green")) { a.currentTarget = null; a.biteTarget = null; }
    }
    for (const f of _cbSquad()) { f._nearestEnemy = null; f._enemyCacheFrame = 0; }
}
function _cbBegin(foe, far) {
    _cb.foes = _cbGroup(foe); _cb.target = foe; _cb.t = _cbF(); _cbCentre(); _cbSettle();
    if (typeof battleViewDrop === "function") battleViewDrop();
    if (far) { _cb.phase = "walk"; if (typeof facilityWalkTo === "function") facilityWalkTo(foe.x, foe.y); }
    else _cb.phase = "on";
    _cbButtons();
    return true;
}
// A TAP ON A CREATURE (js/targeting.js targetPress): out of a battle, it starts one with that creature. True when the tap was taken.
function cardBattleTap(ex, ey) {
    if (!cardBattleOn() || cardBattleActive() || typeof findEnemyAtScreen !== "function") return false;
    const foe = findEnemyAtScreen(ex, ey); if (!_cbFoeOk(foe)) return false;
    return cardBattleChoose(foe);
}
function cardBattleChoose(foe) {
    if (!cardBattleOn() || cardBattleActive() || !_cbFoeOk(foe) || typeof player === "undefined") return false;
    return _cbBegin(foe, Math.hypot(foe.x - player.x, foe.y - player.y) > CARD_BATTLE.far);
}
// A HIT ON YOU OR YOURS (js/helpers.js applyDamage): out of a battle, the creature that struck starts one where you stand.
function cardBattleHit(target, source) {
    if (!cardBattleOn() || cardBattleActive() || !target || !source) return;
    const src = typeof predatorSource === "function" ? predatorSource(source) : source;
    const ours = (typeof player !== "undefined" && target === player) || target.team === "green" || target.isFollower === true;
    if (!ours || !_cbFoeOk(src)) return;
    if (_cbF() < _cb.calmUntil && _cb.calm.indexOf(src) >= 0) return;   // (the battle just ended: its creatures' last blows start nothing)
    _cbBegin(src, false);
}
// is `a` (a creature) shut out of going for you and yours? (js/predator.js predatorPreyOk): in a battle, every creature not in it
function cardBattleBars(p) { return (cardBattleActive() && _cb.foes.indexOf(p) < 0) || (_cbF() < _cb.calmUntil && _cb.calm.indexOf(p) >= 0); }
// may your squad or your gun go for this creature? (js/npc.js, js/targeting.js): in a battle, only those in it
function cardBattleMayTarget(a) { return !cardBattleActive() || _cb.foes.indexOf(a) >= 0; }
// THE CLOCK AT HALF (§2.28; the owner, 2026-11-17: "the game clock slows down so that you ... don't automatically lose if you're stalling in a fight, but it still is risky stalling in a fight
// because things are still happening behind you, like the crystal being destroyed in half speed"; of three offered, "Clock only"): while a battle is on, every countdown of the world runs at
// CARD_BATTLE.clock (the raids' clock, the spawns', the Crystal's idle refill, a turret's shots, a creature's rest between its bites), and everyone still walks and moves at full speed.
// `a`, a creature: one in the battle, or your squad's clone, keeps its own pace (the fight in the battle is unchanged). 1 out of a battle.
function cardBattleClock(a) {
    if (!cardBattleActive()) return 1;
    if (a && (_cb.foes.indexOf(a) >= 0 || (a.isClone && typeof partyClone === "function" && partyClone() === a))) return 1;
    return CARD_BATTLE.clock;
}
// a creature's rest between bites at the clock's pace, so that its bites come at the clock's rate while its rear-back and lunge stay at full speed (js/predator.js _biteTick)
function cardBattleRest(a) {
    const r = cardBattleClock(a); if (r >= 1) return 1;
    const c = typeof COMBAT !== "undefined" ? COMBAT.bite.cooldown : 45, w = typeof COMBAT !== "undefined" ? COMBAT.bite.windup : 18;
    return c / ((c + w) / r - w);   // (a bite every (c + w) / r frames: the rest counts down this much a frame)
}

// THE MOVE IN THE BLACK: you in front of the creature, your squad round you
function _cbLand() {
    const foe = _cb.target && _cbFoeOk(_cb.target) ? _cb.target : _cb.foes.find(_cbFoeOk); if (!foe || typeof player === "undefined") return;
    let ux = player.x - foe.x, uy = player.y - foe.y; const L = Math.hypot(ux, uy) || 1; ux /= L; uy /= L;   // (from the creature towards where you were)
    const put = (a, x, y) => { const c = typeof _fpNearestCellOpen === "function" ? _fpNearestCellOpen(x, y) : [x, y]; const px = c ? c[0] : x, py = c ? c[1] : y;
        a.x = a.targetX = px; a.y = a.targetY = py; if ("visualX" in a || a === player) { a.visualX = px; a.visualY = py; } a.fpPath = null; a._fpPath = null; if (a.job && a.job.type === "move") a.job = null; };
    // where you land: CARD_BATTLE.land tiles in front of it on your side, or the nearest turn of that round it that is open floor in its room and in sight of it
    const room = typeof facilityRoomAt === "function" && typeof _fp !== "undefined" && _fp && _fp.F ? facilityRoomAt(foe.x, foe.y, _fp.F) : null;
    let lx = foe.x + ux * CARD_BATTLE.land, ly = foe.y + uy * CARD_BATTLE.land;
    search: for (const r of [CARD_BATTLE.land, CARD_BATTLE.land + 0.8, CARD_BATTLE.land - 0.6, 3.4]) for (const t of [0, 0.5, -0.5, 1, -1, 1.6, -1.6, 2.4, -2.4, Math.PI]) {
        const vx = ux * Math.cos(t) - uy * Math.sin(t), vy = ux * Math.sin(t) + uy * Math.cos(t), c = typeof _fpNearestCellOpen === "function" ? _fpNearestCellOpen(foe.x + vx * r, foe.y + vy * r) : null; if (!c) continue;
        if (room && typeof facilityRoomAt === "function") { const cr = facilityRoomAt(c[0], c[1], _fp.F); if (!cr || cr.id !== room.id) continue; }
        if (typeof facilitySeesFrom === "function" && !facilitySeesFrom(c[0], c[1], foe.x, foe.y)) continue;
        if (Math.hypot(c[0] - foe.x, c[1] - foe.y) < 1.2) continue;
        lx = c[0]; ly = c[1]; ux = vx; uy = vy; break search;
    }
    put(player, lx, ly); player._tapRun = null;
    const px = -uy, py = ux, sq = _cbSquad(), spots = [[1.1, 0.5], [-1.1, 0.5], [0, 1.2], [1.6, 1.3]];   // (beside you and a little behind: across, back)
    sq.forEach((f, i) => { const s = spots[i % spots.length]; put(f, lx + px * s[0] + ux * s[1], ly + py * s[0] + uy * s[1]); });
    _cbCentre();
}
// THE STEP (js/game.js render, beside the battle view's)
function cardBattleTick() {
    const f = _cbF(), el = f - _cb.t;
    if (_cb.phase !== "off") {
        const live = _cb.foes.filter(_cbFoeOk);
        if (cardBattleActive()) {
            const squad = _cbSquad(), away = typeof player !== "undefined" && Math.hypot(player.x - _cb.cx, player.y - _cb.cy) > CARD_BATTLE.leave;
            if (!live.length || !cardBattleOn() || (typeof player !== "undefined" && (player.dead || player.health <= 0)) || (_cb.phase === "on" && (!squad.length || away))) cardBattleEnd();
        }
        if (_cb.phase === "walk" && el >= CARD_BATTLE.walk) { _cb.phase = "black"; _cb.t = f; }
        else if (_cb.phase === "black") {
            if (el === CARD_BATTLE.blackIn) _cbLand();
            if (el >= CARD_BATTLE.blackIn + CARD_BATTLE.blackHold) { _cb.phase = "on"; _cb.t = f; }
        }
        if (_cb.phase === "on" && f % 10 === 0) _cbCentre();
    }
    // the black: in during "black" (then held), out after it
    if (_cb.phase === "black") _cb.black = Math.min(1, (f - _cb.t) / CARD_BATTLE.blackIn);
    else _cb.black = Math.max(0, _cb.black - 1 / CARD_BATTLE.blackOut);
    // the camera: in once the battle is on (after the black, where there is one), out after it
    const want = _cb.phase === "on" ? 1 : 0;
    if (want > _cb.k) _cb.k = Math.min(1, _cb.k + 1 / CARD_BATTLE.easeIn); else if (want < _cb.k) _cb.k = Math.max(0, _cb.k - 1 / CARD_BATTLE.easeOut);
    if (_cb.phase === "end" && _cb.k <= 0) { _cb.phase = "off"; _cb.foes = []; _cb.target = null; }
    _cbDom();
}
function cardBattleEnd() { if (_cb.phase === "off" || _cb.phase === "end") return false;
    _cb.calm = _cb.foes.slice(); _cb.calmUntil = _cbF() + CARD_BATTLE.calm;
    for (const a of _cb.calm) if (a && !a.dead) { a.provoked = false; if (a.state !== "wander") a.state = "wander"; a.currentTarget = null; a.biteTarget = null; } if (_cb.phase === "walk" && typeof player !== "undefined") { player.fpPath = null; player.targetX = player.x; player.targetY = player.y; } _cb.phase = "end"; _cb.t = _cbF(); _cbButtons(); return true; }
// RUN (§2.12; step 1's stand-in: a button. The enemies' last hit, §2.16, comes with the turns)
function cardBattleRun() { _cb.ranAt = _cbF(); return cardBattleEnd(); }
// THE CAMERA, for the 3D view (view3d/gameview.js): null out of a battle; else how far in (k, eased), where it looks, how low, how turned, how near
function cardBattleCam() {
    if (_cb.k <= 0.0001) return null;
    return { k: _cbSmooth(_cb.k), x: _cb.cx, y: _cb.cy, pitch: CARD_BATTLE.pitch * Math.PI / 180, yaw: CARD_BATTLE.yaw, zoom: CARD_BATTLE.zoom };
}
// THE EDGES (js/game.js render, after the battle view's): the 3D picture's edges blurred (HIGH) and darkened, at the battle's strength. Built as the battle view builds its own (js/battleview.js:
// a small copy scaled up, kept towards the edges by a ring), from the 3D view's canvas: drawn in the same frame the view drew it, so its picture is still there to copy.
function cardBattlePost() {
    if (_cb.k <= 0.001 || typeof ctx === "undefined" || typeof canvas === "undefined" || !canvas.width || typeof _bvCv !== "function" || typeof _bvRing !== "function") return;
    if (typeof _simGhost !== "undefined" && _simGhost) return;
    const W = canvas.width, H = canvas.height, e = _cbSmooth(_cb.k), W2 = Math.max(1, Math.ceil(W / 2)), H2 = Math.max(1, Math.ceil(H / 2));
    const src = typeof document !== "undefined" && document.getElementById ? document.getElementById("view3dCanvas") : null;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const low = typeof gfxLow !== "undefined" && gfxLow;
    if (!low && src && src.width) {
        const s1 = _bvCv("cbS1", Math.max(1, Math.ceil(W / 4)), Math.max(1, Math.ceil(H / 4))), s2 = _bvCv("cbS2", Math.max(1, Math.ceil(W / 14)), Math.max(1, Math.ceil(H / 14))), ed = _bvCv("cbEdge", W2, H2);
        const mask = _bvRing("cbMask", W2, H2, 0.28, 0.6, "rgba(0,0,0,0)", "rgba(0,0,0,1)");
        if (s1 && s2 && ed && mask) {
            s1.g.clearRect(0, 0, s1.w, s1.h); s1.g.drawImage(src, 0, 0, s1.w, s1.h); s2.g.clearRect(0, 0, s2.w, s2.h); s2.g.drawImage(s1.c, 0, 0, s2.w, s2.h);
            const g = ed.g; g.globalCompositeOperation = "source-over"; g.clearRect(0, 0, W2, H2); g.imageSmoothingEnabled = true;
            g.globalAlpha = e; g.drawImage(s2.c, 0, 0, W2, H2); g.globalAlpha = 1;
            g.globalCompositeOperation = "destination-in"; g.drawImage(mask.c, 0, 0); g.globalCompositeOperation = "source-over";
            ctx.drawImage(ed.c, 0, 0, W2, H2, 0, 0, W, H);
        }
    }
    const dark = _bvRing(low ? "cbDarkLow" : "cbDark", W, H, 0.32, 0.74, "rgba(4,6,12,0)", "rgba(4,6,12," + (low ? 0.62 : 0.5) + ")");
    if (dark) { ctx.globalAlpha = e; ctx.drawImage(dark.c, 0, 0); ctx.globalAlpha = 1; }
    ctx.restore();
}
// THE BLACK and RUN: page elements over the game, made once
let _cbEls = null;
function _cbMake() {
    if (_cbEls || typeof document === "undefined" || !document.createElement || !document.body) return _cbEls;
    const black = document.createElement("div"); black.id = "cbBlack"; black.style.cssText = "position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:60;";
    const run = document.createElement("button"); run.id = "cbRun"; run.type = "button"; run.textContent = "RUN"; run.setAttribute("aria-label", "Run from the battle");
    run.style.cssText = "position:fixed;right:calc(28px + env(safe-area-inset-right, 0px));top:calc(206px + env(safe-area-inset-top, 0px));transform:skewX(-9deg);z-index:61;display:none;min-width:150px;height:56px;padding:0 26px;border:2px solid #ff4a1c;background:linear-gradient(180deg,#3a1a1a,#12080a);color:#fff;font:italic 900 22px/1 'Arial Black',system-ui,sans-serif;letter-spacing:.06em;box-shadow:0 0 14px -2px #ff4a1c;cursor:pointer;touch-action:manipulation;";
    run.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); cardBattleRun(); });
    document.body.appendChild(black); document.body.appendChild(run); _cbEls = { black, run };
    return _cbEls;
}
function _cbButtons() { const E = _cbMake(); if (!E) return; E.run.style.display = cardBattleActive() && _cb.phase !== "walk" ? "block" : "none"; }
function _cbDom() { const E = _cbEls || (_cb.phase !== "off" ? _cbMake() : null); if (!E) return; const o = _cb.black.toFixed(3); if (E.black.style.opacity !== o) E.black.style.opacity = o; const show = cardBattleActive() && _cb.phase !== "walk" && _cb.phase !== "black" ? "block" : "none"; if (E.run.style.display !== show) E.run.style.display = show; }
function cardBattleReset() { _cb.phase = "off"; _cb.foes = []; _cb.k = 0; _cb.black = 0; _cb.target = null; _cbDom(); }
