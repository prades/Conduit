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
    pitch: 50,                  // degrees down (the game's own camera is 30): nearly top down, the tiles nearly square to lay the cards on (the owner, 2026-11-17: "still top down so I can lay the cards down on the almost completed tiles")
    yaw: 0.6,                   // radians turned to the side
    zoom: 1.55,                 // nearer than the game's own camera
    leave: 14,                  // tiles: you walking this far from the fight ends it
    calm: 240,                  // frames after a battle ends (RUN, or it is over) in which the creatures that were in it go for nobody and start nothing (4 s)
    turnSec: 2,                 // seconds of today's wait times a turn (§2.21, the owner's: "2 seconds = 1 turn"); a part of a turn counts as a whole one (the agent's, open: §11.6)
    every: 15,                  // frames between two refreshes of the battle screen (4 a second)
    lineGap: 2,                 // tiles from the middle of the line to the first of each side (lined up: the agent's)
    slide: 0.09,                // tiles a frame, easing to a square
    skew: 15,                   // degrees the camera turns off straight across the line, towards your side (yours nearer, lower on the screen by their cards), for an isometric feel (the owner, 2026-11-17: "Needs an isometric feel, make the camera rotate slightly too")
    fit: 0.88, zoomMin: 0.8,
    raise: 0.75,                // lined up: the camera's aim moved to put the fight above the cards (1: by half the band), a little less so the far side clears the panels at the top    // lined up: the line takes at most this much of the screen's width; the camera never further out than this
    killText: { size: 30, life: 110 },   // a kill's +N XP rising from where the creature fell: its size (screen points) and how long it lasts (frames)
    hpBar: { w: 84, h: 11, depth: 5, slant: 6, out: 34, up: 50, run: 10, font: 13 },
    num: { pop: 32, glide: 28, rise: 34, chip: 26 },   // frames: a hit's number popping at the creature, flying into its bar, rising off one of yours; the piece lost flashing   // screen points: an enemy's health callout (the bar's width, height, underside, slant; how far out and up from the creature; the line's run under it; its numbers)
    byClass: true,              // the charge and the cooldown by class (the owner, 2026-11-18); off, every attack at once and every second attack cooling (the tests of other things turn it off)
    tileCard: 56,
    dragUp: 14,                 // screen points between a dragged card's foot and the finger               // screen points: a dragged card's width without the 3D view to measure a tile by
    // STEP 3, THE TURNS (the agent's, provisional): how long each turn's real-time window may run
    actMax: 300,                // frames: a follower doing its card (5 s); it ends sooner once its blow has landed
    foeMax: 210,                // frames: an enemy's turn (3.5 s); it ends sooner once its blow has landed
    beat: 24,                   // frames after a blow lands before the next turn (0.4 s)
    ultHold: 90,                // frames: an Ultimate's turn (1.5 s), at least; longer while it still moves or its field's first turn's worth runs (js/cardults.js)
    fieldMax: 140,              // frames: the longest the enemies wait, as their turn begins, for the Ultimates' fields to run their turn's worth (2 s of it: §2.64)
    heldWait: 45,               // frames your squad waits, said in the banner, when every enemy left is held inside one of yours
    pick: 70, pickH: 30,        // the drag: an enemy is under the finger within this many screen points of where the 3D view draws it, at this height (px of the world) over its feet
    clock: 0.5,                 // THE CLOCK AT HALF (§2.30; the owner, 2026-11-17: "time slows down to about half"): the world's countdowns in a battle run at this rate
    // MOVE NOW, ATTACK LATER (§2.39; the agent's, provisional): the tiles a turn's walk may take by the walker's own pace (its base speed, tiles a frame: at least the first number, that many)
    tiles: [[0.026, 3], [0.016, 2], [0, 1]],   // (your followers 0.023 to 0.028: 2 or 3; an ant scout 0.022 and a striker 0.018: 2; a tank 0.012 and the Ant Queen 0.008: 1; a nymph 0.030: 3)
    stepPace: 0.06,             // tiles a frame along the walk (3.6 a second)
    stepBeat: 12,               // frames after a walk before the next turn (0.2 s)
    tether: 0.8,                // tiles: on its attack's turn one may step this far off its square on its own legs (a leap, a dash or a charge carries it further: its new square)
    upFront: 2,                 // THE OPENING STANCE (§2.53): squares ahead of the line a TANK or a RECKLESS follower starts (the owner: "upfront maybe two spaces")
    shoot: { shots: [4, 5] },   // THE GUNSLINGER'S SHOOT (§2.66; the owner, 2026-11-20: "it does four to five shots"): the rounds of one burst, the one number or the other, an even chance
    smash: { damage: 36, lunge: 0.5 },   // THE GUNSLINGER'S SMASH (§2.69; the owner, 2026-11-20: "a close up smash with the gun", "About a burst (36)"): its damage; how far (tiles) the cube lunges at its enemy as the blow lands, eased back to its square (the agent's, a look only)
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
function cardBattleShown() { return cardBattleActive() && _cb.phase !== "walk" && _cb.phase !== "black"; }   // is the battle screen up (body.cb-on)?
function cardBattleHas(a) { return _cb.phase !== 'off' && _cb.foes.indexOf(a) >= 0; }   // (from the walk on: one you are walking to is shown, even in another room)
function cardBattleIn(a) { return cardBattleActive() && _cb.foes.indexOf(a) >= 0; }
function _cbFoeIn(a) { return _cbFoeOk(a) || (typeof cardUltHeldFoe === "function" && cardUltHeldFoe(a)); }   // (still in the battle: one that can be struck, or one held inside one of yours for now, js/cardults.js)
function _cbFoeOk(a) { return !!a && !a.dead && !a.isClone && a.team !== "green" && !a.untargetable && !(a.health <= 0) && (typeof Predator === "undefined" || a instanceof Predator); }
// THE BATTLE'S OWN SIDE: you, your squad's members and the Mutator's clone. Followers holding a room (HOLD) are not in it: the rest of the world goes on in real time while you battle, and they
// hold the fort (§2.28, the owner: "Both at once")
function _cbMine(a) { if (!a) return false; if (typeof player !== "undefined" && a === player) return true; if (typeof partyIsMember === "function" && partyIsMember(a)) return true; const c = typeof partyClone === "function" ? partyClone() : null; return !!c && a === c; }
function _cbSquadNow() { const m = typeof partyMembers === "function" ? partyMembers().filter(f => f && !f.dead) : []; const c = typeof partyClone === "function" ? partyClone() : null; if (c && !c.dead) m.push(c); return m; }
// THE BATTLE'S SQUAD (the owner, 2026-11-17: "when all my creatures are destroyed, the battle concludes"): the members it began with. One that goes down is out of it until it ends (§2.22), even
// if the game brings it back meanwhile (in the Crystal Chamber the fallen rejoin the squad at once: js/party.js partyFallenTick); none left standing, the battle is over (§2.23).
function _cbAlive(f) { return !!f && !f.dead && f.health > 0 && !_cb.out.has(f); }
function _cbSquad() { return _cb.phase !== "off" && _cb.squad ? _cb.squad.filter(_cbAlive) : _cbSquadNow(); }
// the creatures in a battle with `foe`: it, and the others round it, nearest first
function _cbGroup(foe) {
    const out = [foe], R = CARD_BATTLE.group, near = [], room = typeof facilityRoomIdAt === "function" ? facilityRoomIdAt(foe.x, foe.y) : null;
    for (const a of (typeof actors !== "undefined" ? actors : [])) { if (a === foe || !_cbFoeOk(a)) continue; if (room && facilityRoomIdAt(a.x, a.y) !== room) continue; const d = Math.hypot(a.x - foe.x, a.y - foe.y); if (d <= R) near.push([d, a]); }
    near.sort((p, q) => p[0] - q[0]); for (const [, a] of near) { if (out.length >= CARD_BATTLE.most) break; out.push(a); }
    return out;
}
function _cbCentre() {
    if (_cb.lay) { _cb.cx = _cb.lay.mx; _cb.cy = _cb.lay.my; return; }   // (lined up: the camera on the middle of the line)
    const live = _cb.foes.filter(_cbFoeOk); let sx = 0, sy = 0; for (const a of live) { sx += a.x; sy += a.y; }
    if (!live.length || typeof player === "undefined") return;
    const ex = sx / live.length, ey = sy / live.length; _cb.cx = (ex + player.x) / 2; _cb.cy = (ey + player.y) / 2;
}
// those not in the battle stop going for you and yours; those in it are set on (a creature in a battle fights it)
function _cbSettle() {
    for (const a of (typeof actors !== "undefined" ? actors : [])) {
        if (!a || a.dead || !(typeof Predator === "undefined" || a instanceof Predator) || a.team === "green") continue;
        if (_cb.foes.indexOf(a) >= 0) { a.provoked = true; if (a.state === "wander") a.state = "hunt"; continue; }
        const t = a.currentTarget; if (t && _cbMine(t)) { a.currentTarget = null; a.biteTarget = null; }   // (one going for a follower holding a room keeps at it: §2.28)
    }
    for (const f of _cbSquad()) { f._nearestEnemy = null; f._enemyCacheFrame = 0; }
}
function _cbBegin(foe, far) {
    _cb.squad = _cbSquadNow(); _cb.out = new Set(); _cb.slots = new Map(); _cb.lay = null; _cb.snap = false; _cb.grudge = new Map(); _cb.pushQ = [];
    _cb.foes = _cbGroup(foe); _cb.target = foe; _cb.t = _cbF(); _cb.startHit = false; _cbCentre(); _cbSettle();
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
    if (cardBattleActive() && _cb.turn && target && source) {   // (a battle on: a blow landed by the one whose turn it is ends its turn, _cbTurnTick)
        const T = _cb.turn, src = typeof predatorSource === "function" ? predatorSource(source) : source, f0 = _cbF();
        if (T.who === "act" && src === T.f && _cb.foes.indexOf(target) >= 0 && !T.hit) T.hit = f0;
        else if (T.who === "foe" && src === T.a && (_cbMine(target) || !!target.isDecoy) && !T.hit) T.hit = f0;   // (a ROTTEN DECOY it was drawn to too, §2.48)
        return false;
    }
    // EITHER A BATTLE OR NONE (§2.35, the owner: "no intermediary fighting with my squad. It's either battle or no battle"): the blow that starts a battle does not land (true: the caller,
    // js/helpers.js applyDamage and hurtPlayer, lets it fall), nor does the rest of that same blow this frame (a slam's other victims)
    if (!cardBattleOn() || !target || !source) return false;
    const src = typeof predatorSource === "function" ? predatorSource(source) : source;
    const ours = _cbMine(target);   // (you or your squad: a follower holding a room fights its own fight, §2.28)
    if (cardBattleActive()) return !!(ours && _cb.startHit && src === _cb.target && _cb.t === _cbF());
    if (!ours || !_cbFoeOk(src)) return false;
    if (_cbF() < _cb.calmUntil && _cb.calm.indexOf(src) >= 0) return false;   // (the battle just ended: its creatures' last blows start nothing)
    _cbBegin(src, false); _cb.startHit = true;
    return true;
}
// is `a` (a creature) shut out of going for you and yours? (js/predator.js predatorPreyOk): in a battle, every creature not in it
function cardBattleBars(p, a) { if (a !== undefined && !_cbMine(a)) return false; return (cardBattleActive() && _cb.foes.indexOf(p) < 0) || (_cbF() < _cb.calmUntil && _cb.calm.indexOf(p) >= 0); }   // (`a`, its prey: only you and your squad are kept out of reach; followers holding rooms stay in the world's real-time fights, §2.28)
// may your squad or your gun go for this creature? (js/npc.js, js/targeting.js): in a battle, only those in it
function cardBattleMayTarget(a, who) { if (who !== undefined && who !== null && !_cbMine(who)) return true; if (!cardBattleActive()) return !cardBattleOn();   /* (out of a battle your squad and your gun go for nothing: §2.35) */ if (_cb.foes.indexOf(a) < 0) return false;
    const T = _cb.turn; if (!T) return true; return T.who === "act" && who === T.f && T.kind !== "ult" && (a === T.target || T.kind !== "basic"); }   /* (an Ultimate's turn is its Ultimate alone: no everyday hit goes with it, §2.64) */   // (the turns: only the one doing its card, at its target; the gun holds its fire, §2.10)   // (`who`, the one choosing: a follower holding a room goes for what is in its room, battle or not, §2.28)
// EITHER A BATTLE OR NONE (§2.35; the owner, 2026-11-17: "it gets really confusing when I am close to an enemy, because my followers will start attacking the creature, or there'll be some
// sort of combat that's not based in the combat or card-based turn system. So make it to where there's no intermediary fighting with my squad. It's either battle or no battle"): with the
// switch on and no battle, you and your squad fight nothing. Your squad picks no target (cardBattleMayTarget) and fires no second attack (js/evolution.js) or Ultimate (js/elements.js), the
// Mutator's clone no special (js/abilities.js), your gun holds its fire (js/input.js, js/targeting.js); a creature's blow on you or them starts the battle and does not land (cardBattleHit), and
// the enemy card's ATTACK starts one (js/mixtool.js). A follower holding a room is not your squad: it fights in real time (§2.28). `a`: one of yours (none: you, your gun)
function cardBattleNoFight(a) { return cardBattleOn() && !cardBattleActive() && (a === undefined || a === null || _cbMine(a)); }
// THE CLOCK AT HALF (§2.30, on §2.28's world that goes on while you battle; the owner, 2026-11-17: "the game clock slows down so that you ... don't automatically lose if you're stalling in a fight, but it still is risky stalling in a fight
// because things are still happening behind you, like the crystal being destroyed in half speed"; of three offered, "Clock only"): while a battle is on, every countdown of the world runs at
// CARD_BATTLE.clock (the raids' clock, the spawns', the Crystal's idle refill, a turret's shots, a creature's rest between its bites), and everyone still walks and moves at full speed.
// `a`, a creature: one in the battle, or your squad's own (the Mutator's clone), keeps its own pace (the fight in the battle is unchanged). 1 out of a battle.
function cardBattleClock(a) {
    if (!cardBattleActive()) return 1;
    if (a && (_cb.foes.indexOf(a) >= 0 || _cbMine(a))) return 1;
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
        _cbKillText();   // (a creature of the battle down: its +N XP rises from it)
        const live = _cb.foes.some(_cbFoeIn);   // (one held inside one of yours is still in it: §2.64)
        if (cardBattleActive()) {
            const squad = _cbSquad(), away = typeof player !== "undefined" && Math.hypot(player.x - _cb.cx, player.y - _cb.cy) > CARD_BATTLE.leave;
            if (!live || !cardBattleOn() || (typeof player !== "undefined" && (player.dead || player.health <= 0)) || (_cb.phase === "on" && (!squad.length || away))) cardBattleEnd();
        }
        if (_cb.phase === "walk" && el >= CARD_BATTLE.walk) { _cb.phase = "black"; _cb.t = f; }
        else if (_cb.phase === "black") {
            if (el === CARD_BATTLE.blackIn) { if (!_cb.snap) { _cbLand(); _cbLayout(); } _cbSnap(); }   // (a far one: you land, and in the same black everyone is on its square in its room)
            if (el >= CARD_BATTLE.blackIn + CARD_BATTLE.blackHold) { _cb.phase = "on"; _cb.t = f; }
        }
        if (_cb.phase === "on" && f % 10 === 0) { _cbKeepAtIt(); _cbCentre(); }
        if (_cb.phase === "on") _cbTurnTick();
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
// THE CREATURES IN A BATTLE KEEP AT IT (the owner, 2026-11-17: a battle on, "the creature was not attacking. It was drifting away [...] Might have been because [...] the follower had died. But in that
// instance, the creature should keep attacking. But whatever happens, it shouldn't continue to keep the camera locked onto him."): the game's own rule calms a creature whose prey is gone (js/predator.js);
// in a battle each one stays provoked and, its prey gone, goes for the nearest of yours still up (you or a member of the squad). One that is far from you all the same (further than `leave`) is let go:
// out of the battle, calmed as at its end, and the camera no longer takes it in; the last one let go ends the battle.
function _cbKeepAtIt() {
    if (typeof player === "undefined") return;
    const ours = _cbSquad(); ours.push(player);
    for (const a of _cb.foes.slice()) {
        if (!_cbFoeOk(a)) continue;
        if (Math.hypot(a.x - player.x, a.y - player.y) > CARD_BATTLE.leave) {
            _cb.foes.splice(_cb.foes.indexOf(a), 1); a.provoked = false; a.state = "wander"; a.currentTarget = null; a.biteTarget = null; a._prey = null;
            if (_cb.calm.indexOf(a) < 0) _cb.calm.push(a); _cb.calmUntil = Math.max(_cb.calmUntil, _cbF() + CARD_BATTLE.calm); continue;
        }
        a.provoked = true; if (a.state === "wander") a.state = "hunt";
        const ct = a.currentTarget, ok = t => t && !t.dead && !(t.health <= 0) && (typeof predatorPreyOk !== "function" || predatorPreyOk(a, t));
        if (ok(ct)) continue;
        let best = null, bd = Infinity; for (const t of ours) { if (!ok(t)) continue; const d = Math.hypot(t.x - a.x, t.y - a.y); if (d < bd) { bd = d; best = t; } }
        if (best) { a.currentTarget = best; a._prey = best; a.biteTarget = null; a.attackWindup = 0; if (a.state === "wander") a.state = "hunt"; }
    }
    if (!_cb.foes.some(_cbFoeIn)) cardBattleEnd();
}
// THE TEAM'S EXPERIENCE (the owner, 2026-11-18: "pop up for team kill experience"; then, of a panel with a CONTINUE button: "No, passive text but large text emerges from the kill"): each creature of a
// battle that goes down, a large gold +N XP rises from where it fell and fades: what the kill paid your team (the game's own sum, js/levels.js killXp). Nothing to tap, nothing held up. The last one's
// rises as the battle's camera eases back (drawn by the battle while its camera is up, js/cardbattle.js cardBattleNumbers; by the game after, js/drops.js).
function _cbKillText() {
    if (typeof floatingTexts === "undefined" || typeof killXp !== "function") return;
    for (const a of _cb.foes) { if (!a || !a.dead || a._cbXpSaid) continue; a._cbXpSaid = true; if (a.noReward) continue;
        const n = killXp(a); if (n > 0) floatingTexts.push({ world: true, x: a.x, y: a.y, text: "+" + n + " XP", color: "#ffe733", size: CARD_BATTLE.killText.size, life: CARD_BATTLE.killText.life, vy: -0.02, _cbBig: true }); }
}
function cardBattleEnd() { if (_cb.phase === "off" || _cb.phase === "end") return false;
    _cbKillText();   // (the last kill's experience, as the battle ends)
    if (typeof cardShapeStays === "function") cardShapeStays("end");   // (the areas that stay close, and the draws and bracing end: §2.48)
    if (typeof cardUltEnd === "function") cardUltEnd();   // (and what the Ultimates left: §2.64)
    _cbActEnd(); _cb.turn = null; _cb.grudge = new Map(); _cb.cd.clear(); _cb.round = 0; if (_cb.acted) _cb.acted.clear(); if (_cb.charge) _cb.charge.clear(); _cb.slots = new Map(); _cb.lay = null; _cb.pushQ = [];
    _cb.calm = _cb.foes.concat(_cbF() < _cb.calmUntil ? _cb.calm.filter(a => _cb.foes.indexOf(a) < 0) : []); _cb.calmUntil = _cbF() + CARD_BATTLE.calm;   // (with those let go during it: _cbKeepAtIt)
    for (const a of _cb.calm) if (a && !a.dead) { a.provoked = false; if (a.state !== "wander") a.state = "wander"; a.currentTarget = null; a.biteTarget = null; } if (_cb.phase === "walk" && typeof player !== "undefined") { player.fpPath = null; player.targetX = player.x; player.targetY = player.y; } _cb.phase = "end"; _cb.t = _cbF(); _cbButtons(); return true; }
// RUN (§2.12, §2.16): on your turn it uses the turn: each enemy gets its last hit (fastest first), then you are out. Before the turns begin (the walk, the black), it ends the battle as it is.
function cardBattleRun() {
    const T = _cb.turn;
    if (cardBattleActive() && T) { if (T.who !== "you") return false; _cb.ranAt = _cbF(); _cbFoesTurn(true); return true; }
    _cb.ranAt = _cbF(); return cardBattleEnd();
}
// ── STEP 3: THE TURNS (§2.2, §2.4, §2.10, §2.11, §2.12, §2.15, §2.16, §2.17, §2.19, §2.20, §2.21, §2.22, §2.25) ──
// A battle on runs in turns. YOUR TURN: everyone in the battle holds still (the world outside it goes on, §2.28) until you play a card (drag it onto an enemy, cardBattlePlay). THE CARD: that
// follower alone moves, for a real-time window, and does that attack on that enemy, its own attack as the game has it (its basic hits, its second attack set as its mode for the turn, or its
// Ultimate fired): the damage, effects and pictures are the game's own. The window ends once its blow has landed (`beat` later), or after `actMax`. THEN THE ENEMIES: each one still up, fastest first
// (its speed), alone moves for a window and goes for one of yours (its prey, else the nearest), until its blow lands or `foeMax`. Then your turn again: each second attack played counts down a turn
// (its RECHARGE, from its wait time). RUN uses your turn: the enemies get their last hit, then you are out. The cube commands only (§2.10): your gun holds its fire in a battle.
// _cb.turn: null out of the turns; { who: "you" }; { who: "act", f, kind, id, target, t0, hit, fired, saved }; { who: "foe", a, t0, hit, queue, run }. _cb.cd: follower → { move id: turns to go }.
_cb.turn = null; _cb.cd = new Map(); _cb.round = 0; _cb.squad = null; _cb.out = new Set(); _cb.slots = new Map(); _cb.lay = null; _cb.grudge = new Map();   // (grudge: each creature's tally of who has hurt it, §2.46)
// ── LINED UP ON SQUARES, SIDE ON (the owner, 2026-11-17: "the camera should rotate [...] to a place where there's a clear divide, where it looks like everything takes place on a horizontal plane.
// Things aren't stacked on top of each other. Also, the creatures need to line up on squares"): when the turns begin, the fight is laid out along one of the floor's two directions (the one nearest
// from you to the enemies that has room): your squad on one side of the middle, the enemies on the other, each on its own tile, one tile further out than the one before and a step to the side
// (so no two stand in the same column of the picture), you behind your squad; everyone eases to its square and faces the other side, and goes back to it after its turn. The camera turns to look
// across the line (cardBattleCam `dir`), so your side is on one half of the screen and theirs on the other. Numbers the agent's. ──
function _cbLayout() {
    const foes = _cb.foes.filter(_cbFoeOk), squad = _cbFrontFirst(_cbSquad()); _cb.slots = new Map(); _cb.lay = null;
    if (!foes.length || typeof player === "undefined" || typeof _fpNearestCellOpen !== "function") return;
    let fx = 0, fy = 0; for (const a of foes) { fx += a.x; fy += a.y; } fx /= foes.length; fy /= foes.length;
    const room = typeof facilityRoomIdAt === "function" ? facilityRoomIdAt(fx, fy) : null, wx = fx - player.x, wy = fy - player.y, L = Math.hypot(wx, wy) || 1;
    // ONE ROOM (the owner, 2026-11-17: "if a battle would take place near the doorway, make the battle happen in one room rather than take place in separate rooms"): the battle's room is its
    // enemies' (the battle takes in only the creatures of that room, _cbGroup); the middle of the line and every square are in it, and any of yours outside it is brought in (cardBattleTick, the black)
    let mc = _fpNearestCellOpen((fx + player.x) / 2, (fy + player.y) / 2);
    if (room && (!mc || facilityRoomIdAt(mc[0], mc[1]) !== room) && typeof partyRoomCells === "function") { let bd = Infinity; for (const c of partyRoomCells(room)) { const d = Math.hypot(c[0] - (fx + player.x) / 2, c[1] - (fy + player.y) / 2); if (d < bd) { bd = d; mc = c; } } }   // (a room's cells are its walkable tiles: js/party.js partyRoomCells)
    if (!mc) return;
    const cx = mc[0], cy = mc[1];   // (the middle on a tile, so every square is a tile's middle)
    let best = null;
    for (const gap of [CARD_BATTLE.lineGap, 1]) {   // (a room too narrow for the line: the two sides closer to the middle)
    if (best && best.cost < 99) break;
    for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const vx = -uy, vy = ux, want = [], used = new Set(), cols = new Set(), out = [];
        const fwd = squad.filter(_cbUpFront), rest = squad.filter(f => !_cbUpFront(f)), side = i => i === 1 ? 1 : i === 2 ? -1 : i === 3 ? 2 : i === 4 ? -2 : 0;
        fwd.forEach((f, i) => want.push([f, -1, Math.max(0, gap - CARD_BATTLE.upFront), side(i), true]));   // (THE OPENING STANCE, §2.53: up front, side by side in their row)
        rest.forEach((f, i) => want.push([f, -1, gap + i, side(i)]));
        want.push([player, -1, gap + rest.length, 0]);
        foes.forEach((a, i) => want.push([a, 1, gap + i, i === 1 ? -1 : i === 2 ? 1 : 0]));
        let cost = 0;
        for (const [a, side, du0, dv0, row] of want) {
            let got = null;
            for (let t = 0; t < 5 && !got; t++) for (const dv of [dv0, dv0 + 1, dv0 - 1, dv0 + 2, dv0 - 2]) {   // (a square in a column of its own: outwards, then to the sides; those up front share their row)
                const du = side * (du0 + t), ix = cx + ux * du + vx * dv, iy = cy + uy * du + vy * dv, c = _fpNearestCellOpen(ix, iy);
                if (!c || Math.hypot(c[0] - ix, c[1] - iy) > 0.35 || used.has(c[0] + "," + c[1]) || (cols.has(du) && !(row && t === 0))) continue;
                if (room && typeof facilityRoomIdAt === "function" && facilityRoomIdAt(c[0], c[1]) !== room) continue;
                got = [c, du, t + Math.abs(dv - dv0)]; break;
            }
            if (!got) { cost += 99; continue; }
            used.add(got[0][0] + "," + got[0][1]); cols.add(got[1]); cost += got[2]; out.push([a, got[0][0], got[0][1]]);
        }
        cost += (1 - (ux * wx + uy * wy) / L) * 2;   // (the way you face the enemies, other things equal)
        if (!best || cost < best.cost) best = { cost, ux, uy, out, gap };
    }
    }
    if (!best) return;
    for (const [a, x, y] of best.out) _cb.slots.set(a, { x, y });
    // the room too small for the whole line: the rest on the nearest free tiles of the room (one each)
    if (room && typeof partyRoomCells === "function") {
        const all = squad.concat([player], foes), taken = new Set(best.out.map(o => o[1] + "," + o[2])), free = partyRoomCells(room).filter(c => !taken.has(c[0] + "," + c[1]));
        for (const a of all) { if (_cb.slots.has(a)) continue; let bi = -1, bd = Infinity; free.forEach((c, i) => { const d = Math.hypot(c[0] - cx, c[1] - cy); if (d < bd) { bd = d; bi = i; } }); if (bi < 0) break; const c = free.splice(bi, 1)[0]; _cb.slots.set(a, { x: c[0], y: c[1] }); }
    }
    const gap = best.gap; _cb.lay = { room, ux: best.ux, uy: best.uy, mx: cx, my: cy, sx: cx - best.ux * gap, sy: cy - best.uy * gap, ex: cx + best.ux * gap, ey: cy + best.uy * gap, dir: undefined };
    // the camera's zoom: near, but never so near that the line runs off the screen (its span in tiles and a tile on each end, in `fit` of the screen's width)
    { let lo = Infinity, hi = -Infinity; for (const [, x, y] of best.out) { const u = (x - cx) * best.ux + (y - cy) * best.uy; lo = Math.min(lo, u); hi = Math.max(hi, u); }
      const tpx = (typeof TILE_W !== "undefined" ? TILE_W : 64) * Math.SQRT2, W = typeof canvas !== "undefined" && canvas.width ? canvas.width : 1180;
      _cb.lay.zoom = Math.max(CARD_BATTLE.zoomMin, Math.min(CARD_BATTLE.zoom, CARD_BATTLE.fit * W / ((hi - lo + 2) * tpx))); }
    // the camera's side of the line: the one with less in the way (a server rack, a wall) between it and the fighters; even, the nearer turn (view3d/gameview.js)
    if (typeof facilitySolidAt === "function" && typeof _fp !== "undefined" && _fp && _fp.F) {
        const F = _fp.F, score = sgn => { const px = -best.uy * sgn, py = best.ux * sgn; let n = 0; for (const [, x, y] of best.out) for (let t = 1; t <= 4; t++) { const qx = x + px * t, qy = y + py * t; if (facilitySolidAt(qx, qy, F) || (typeof facilityRoomAt === "function" && !facilityRoomAt(qx, qy, F))) n += 5 - t; } return n; };
        const a = score(1), b = score(-1); if (a !== b) { const sg = a < b ? 1 : -1; _cb.lay.dir = Math.atan2(best.ux * sg, -best.uy * sg); }
    }
    _cbCentre();
}
// THE FRONT LINE (§2.40) lined up: your squad in the formation's order (js/formation.js, the owner, 2026-11-10: "put the brawlers in front of the player ... put the mage behind"): Brawlers
// (and hybrids, and the Mutator's clone) on the front squares, then technicians, then Mages; the squad's own order within each; you behind them all, as before (§2.31). A TANK SITS OUT FRONT
// (§2.47; the owner, 2026-11-17, asked whether a TANK should stand at the front of the line: "Sit out front"): a follower whose play style is TANK takes the front squares, before the Brawlers
// THE OPENING STANCE (§2.53; the owner, 2026-11-18: "The different play styles should reflect the opening stance as well as the other factors ... where they start each fight ... the tank and the
// aggressive play style should be upfront maybe two spaces"): a TANK or a RECKLESS follower (_cbUpFront) starts up front, CARD_BATTLE.upFront squares ahead of the line (the row they share,
// a TANK first); BALANCED (and a clone, which has no play style) in its role's place; a CAUTIOUS one at the back of the squad, before you.
const _CB_RANK = { brawler: 0, camper: 1, sniper: 2 };
function _cbUpFront(f) { return !!f && !f.isClone && (f.playStyle === "tank" || f.playStyle === "aggressive"); }
function _cbFrontFirst(list) {
    const group = f => _cbUpFront(f) ? 0 : f && !f.isClone && f.playStyle === "defensive" ? 2 : 1;
    const rank = f => group(f) * 10 + (_cbTank(f) ? -1 : _CB_RANK[typeof formationRole === "function" ? formationRole(f) : f && (f.role === "sniper" || f.role === "camper") ? f.role : "brawler"]);
    return list.map((f, i) => [f, i]).sort((p, q) => rank(p[0]) - rank(q[0]) || p[1] - q[1]).map(p => p[0]);
}
// is any of yours (you, a member) outside the battle's room?
function _cbOutside() {
    const L = _cb.lay; if (!L || !L.room || typeof facilityRoomIdAt !== "function") return false;
    for (const a of _cb.slots.keys()) if (a && (a === player || _cbMine(a)) && facilityRoomIdAt(a.x, a.y) !== L.room) return true;
    return false;
}
// in the black: everyone on its square at once (no one walks through a wall to get there)
function _cbSnap() {
    _cb.snap = false;
    for (const [a, s] of _cb.slots) { if (!a || a.dead) continue; a.x = s.x; a.y = s.y; if (Number.isFinite(a.visualX)) { a.visualX = s.x; a.visualY = s.y; } if (a === player) { player.targetX = s.x; player.targetY = s.y; player.fpPath = null; } else a._fpPath = null; }
}
// each frame of the turns: everyone not in its own turn eases to its square and faces the other side
function _cbSlide() {
    const T = _cb.turn, L = _cb.lay; if (!L) return;
    const sp = CARD_BATTLE.slide;
    for (const [a, s] of _cb.slots) {
        if (!a || a.dead || (T && ((T.who === "act" && a === T.f) || (T.who === "foe" && a === T.a)))) continue;
        const dx = s.x - a.x, dy = s.y - a.y, d = Math.hypot(dx, dy);
        if (d > 1e-3) { const k = Math.min(1, sp / d); a.x += dx * k; a.y += dy * k; }
        if (a === player) { player.targetX = s.x; player.targetY = s.y; player.fpPath = null; if (Number.isFinite(player.visualX)) { player.visualX = player.x; player.visualY = player.y; } continue; }
        if (Number.isFinite(a.visualX)) { a.visualX = a.x; a.visualY = a.y; }
        const mine = _cb.foes.indexOf(a) < 0, ox = mine ? L.ex : L.sx, oy = mine ? L.ey : L.sy;
        if (d < 0.6 && typeof faceToward === "function") faceToward(a, ox, oy, 0.3);
    }
}
// ── MOVE NOW, ATTACK LATER (§2.39; the owner, 2026-11-17: "sometimes when I'm near objects, attacks won't go through. Like the followers will try to reposition and it'll get canceled and they'll lose
// their attack ... let's make it to where followers can move and change their position in the battle of both enemy and ally, but it takes a move to reposition to attack the target, and it's based on
// their speed, how many tiles they can move, up to 3 if their speed is really high"; of what was offered: "Move now, attack later", "Automatic", "Brawlers adjacent"). A card dropped on an enemy the
// follower cannot hit from its square is not played: its turn is a WALK, up to its tiles (_cbTiles, by its own pace) over the floor's squares towards one it can hit from, and the card stays ready.
// An enemy on its turn does the same: one of yours it can hit from its square it attacks (its special ready and in its reach counts), else it walks. Where one stops is its square from then on.
// WHO HITS FROM WHERE (_cbReach): a Brawler, a technician, a clone and every creature's bite only from a square next to the target (the 8 round it; a huge body from its edge); a Mage's shot from any
// square it sees the target from (in a battle a shot passes over low objects, §2.38, so only a wall or a tall object is in the way); a second attack within its own reach (js/moves.js moveReach); a
// card attack within the card's. On its attack's turn one keeps to its square (_cbTether) unless the attack carries it (a leap, a dash: its new square, _cbResquare). The Ultimate is fired from
// where it stands, and RUN's last hits are as before (§2.16).
function _cbTiles(u) {   // (its lasting pace: its base speed and its form's own, js/abilities.js tickSlowSpeed; slowed, the slow's share of it, §2.52; not a haste of the moment)
    const fd = u && u.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[u.evolved] : null, slow = u && u.slowed > 0 && u.slowFactor >= 0 && u.slowFactor < 1 ? u.slowFactor : 1;
    const fast = Math.max(u && u._voltUntil > _cbF() && u._voltMove > 1 ? u._voltMove : 1, typeof cardUltPace === "function" ? cardUltPace(u) : 1);   // (a pace lent for turns: DRIFT SLASH's, an ICE RINK under it, §2.64)
    const mine = !!u && typeof player !== "undefined" && u === player && typeof FP_PLAYER_SPEED === "number" ? FP_PLAYER_SPEED * (typeof classStat === "function" ? classStat("playerSpeed", 1) : 1) : 0;   // (the cube's own pace, js/facilityplay.js: it walks the squares as a follower does, by its pace, §2.69)
    const s = mine > 0 ? mine : u ? (u.baseMoveSpeed || u.moveSpeed || 0) * (u.paceMult > 0 ? u.paceMult : 1) * (fd && fd.pace > 0 ? fd.pace : 1) * slow * fast : 0; if (!(s > 0)) return 0;
    for (const [at, n] of CARD_BATTLE.tiles) if (s >= at) return n;
    return 1;
}
function _cbSq(a) { const s = _cb.slots.get(a); return s ? [s.x, s.y] : [a.x, a.y]; }
function _cbReach(u, t, kind, id) {
    const edge = Math.max(1.5, ((t && t.bodyR) || 0) + 0.3);   // (next to it: the 8 squares round its own, 1 or 1.41 tiles off; a huge body, from its edge)
    if (kind === "smash") return edge;   // (the Gunslinger's SMASH, §2.69: close up, the squares next to it)
    if (kind === "move" && id && typeof moveReach === "function") return moveReach(id);
    if (u.isClone || _cb.foes.indexOf(u) >= 0) return Math.max(edge, u.biteReach || (typeof COMBAT !== "undefined" ? COMBAT.bite.reach : 1.5));   // (a bite: a boss's reaches from her body)
    const sp = typeof equipSpecial === "function" ? equipSpecial(u) : null; if (sp && sp.attack && sp.attack.reach > 0) return sp.attack.reach;   // (a card attack set: js/cards.js cardAttackTry)
    return u.role === "sniper" ? Infinity : edge;
}
function _cbHitsFrom(x, y, u, t, kind, id) {
    const q = _cbSq(t); if (Math.hypot(q[0] - x, q[1] - y) > _cbReach(u, t, kind, id) + 0.05) return false;
    return typeof facilitySeesFrom !== "function" || facilitySeesFrom(x, y, q[0], q[1]);
}
function _cbCanHit(u, t, kind, id) { if (!u || !t) return false; const s = _cbSq(u); return _cbHitsFrom(s[0], s[1], u, t, kind, id); }
// THE FLOOR for `u`, in the battle's room: the squares' keys, which are taken (anyone's square, a ROTTEN DECOY's too), its own square, and a step to any of the 8 round (no wall, no corner cut,
// js/facilityplay.js _fpEdgeOk; in the room; never onto a taken square). Null without the facility's floor.
// ROUND EVERYONE, NEVER THROUGH (the owner, 2026-11-18: "Whenever creatures have to pass through other creatures for their attack, the game freezes up. Make sure that they avoid interactions with
// their teammates to avoid this conflict"): a walk once went through its own side's squares, and there the squad's spacing (js/game.js FOLLOWER_SEP) held it 0.75 tiles short of the square, so the
// walk never got there and the battle stood still until its time ran out (600 frames). Every taken square stands in the way now, its own side's as the other's (and one the battle walks is not
// jostled: cardBattleWalking).
function _cbGrid(u) {
    if (typeof _fp === "undefined" || !_fp || !_fp.cellsP || typeof _fpEdgeOk !== "function") return null;
    const L = _cb.lay, K = (x, y) => Math.round(x) + "," + Math.round(y), cells = L && L.room && typeof partyRoomCells === "function" ? partyRoomCells(L.room) : null, room = cells ? new Set(cells.map(c => K(c[0], c[1]))) : null;
    const taken = new Set();
    for (const [a, s] of _cb.slots) { if (!a || a === u || a.dead || (!(a.health > 0) && !(typeof player !== "undefined" && a === player)) || _cb.out.has(a)) continue; taken.add(K(s.x, s.y)); }   // (the cube has no health of a fighter's kind, its bars are the game's: its square is taken all the same, now that it walks among them, §2.69)
    if (typeof rotDecoys !== "undefined") for (const d of rotDecoys) if (d && !d.dead && d !== u) taken.add(K(d.x, d.y));
    if (typeof cardUltWalls === "function") for (const c of cardUltWalls()) taken.add(K(c[0], c[1]));   // (REEF PILLAR's spikes: js/cardults.js)
    const s0 = _cbSq(u), c0 = [Math.round(s0[0]), Math.round(s0[1])], k0 = c0[0] + "," + c0[1];
    const open = (x, y, nx, ny) => { const nk = nx + "," + ny; return !taken.has(nk) && (!room || room.has(nk)) && _fpEdgeOk(x, y, nx, ny); };
    return { K, cells, taken, s0, c0, k0, open };
}
// is the battle walking `a` now (its turn's walk, not yet there)? (js/game.js: the squad's spacing leaves it and the ones it passes alone)
function cardBattleWalking(a) { const T = _cb.turn; return !!T && !!a && _cb.phase === "on" && !!T.walk && !T.arrived && ((T.who === "act" && T.f === a) || (T.who === "foe" && T.a === a)); }
// THE WALK: the squares `u` can reach this turn (its tiles over _cbGrid's floor: round every taken square, never through one; stopping on a free one), and of them the nearest it can hit `t`
// from; none, the one nearest by the floor to such a square (or, there being none, nearer `t`). Its squares after its own, or null when it can get no nearer.
// the squares `u` can walk to this turn (its tiles over _cbGrid's floor, breadth first: the fewest steps first) and the way to each; null without the floor or a pace
function _cbReachable(u) {
    const n = _cbTiles(u), G = n ? _cbGrid(u) : null; if (!G) return null;
    const { taken, k0, open } = G, at = new Map([[k0, G.c0]]), steps = new Map([[k0, 0]]), prev = new Map(), order = [k0];
    for (let i = 0; i < order.length; i++) { const k = order[i], [x, y] = at.get(k), st = steps.get(k); if (st >= n) continue;
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy, nk = nx + "," + ny; if (steps.has(nk) || !open(x, y, nx, ny)) continue; steps.set(nk, st + 1); prev.set(nk, k); at.set(nk, [nx, ny]); order.push(nk); } }
    return { G, n, at, steps, prev, order, ends: order.filter(k => k !== k0 && !taken.has(k)) };   // (ends: the free squares it can stop on)
}
function _cbPathTo(R, k) { const path = []; for (let q = k; q && q !== R.G.k0; q = R.prev.get(q)) path.unshift(R.at.get(q)); return path.length ? path : null; }
function _cbWalkPath(u, t, kind, id) {
    const R = t ? _cbReachable(u) : null; if (!R) return null;
    const { G, at, prev, ends } = R, { K, cells, taken, s0, k0, open } = G;
    let best = _cbPickSquare(u, ends.filter(k => { const c = at.get(k); return _cbHitsFrom(c[0], c[1], u, t, kind, id); }), at, t);
    if (!best && cells) {   // none in reach this turn: towards the nearest square it could hit from, by the floor the same way
        const qt = _cbSq(t), R = _cbReach(u, t, kind, id), far = new Map(), q = [];
        for (const c of cells) { const k = K(c[0], c[1]); if ((taken.has(k) && k !== k0) || (R !== Infinity && Math.hypot(c[0] - qt[0], c[1] - qt[1]) > R + 0.05) || !_cbHitsFrom(c[0], c[1], u, t, kind, id)) continue; if (!far.has(k)) { far.set(k, 0); q.push([Math.round(c[0]), Math.round(c[1])]); } }
        for (let i = 0; i < q.length; i++) { const [x, y] = q[i], d = far.get(x + "," + y); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy, nk = nx + "," + ny; if (far.has(nk) || !open(x, y, nx, ny)) continue; far.set(nk, d + 1); q.push([nx, ny]); } }
        let bd = far.has(k0) ? far.get(k0) : Infinity; for (const k of ends) { const d = far.has(k) ? far.get(k) : Infinity; if (d < bd) { bd = d; best = k; } }
    }
    if (!best) { const qt = _cbSq(t); let be = Math.hypot(s0[0] - qt[0], s0[1] - qt[1]) - 0.5; for (const k of ends) { const c = at.get(k), e = Math.hypot(c[0] - qt[0], c[1] - qt[1]); if (e < be) { be = e; best = k; } } }   // (no square to hit it from at all: nearer it)
    if (!best) return null;
    return _cbPathTo(R, best);
}
// THE MOVE CARD (§2.56; the owner, 2026-11-18: "should have a move option, and you select a tile that you want to move to ... but you drag it just like every other card"): the free squares `f` can
// walk to this turn (its tiles by its pace, round everyone: §2.39, §2.49), and the way to one of them (null: out of its reach, taken or not floor)
function cardBattleWalkSquares(f) { const R = _cbReachable(f); return R ? R.ends.map(k => R.at.get(k)) : []; }
function _cbStepPath(f, x, y) { const R = _cbReachable(f), k = Math.round(x) + "," + Math.round(y); return R && R.ends.indexOf(k) >= 0 ? _cbPathTo(R, k) : null; }
// THE FRONT LINE (§2.40; the owner, 2026-11-17: "make it to where the predators typically attack who's in front of them, unless they have some sort of ranged attack or pounce attack that allows
// them to move ... a few spaces over for their attack ... I guess certain types can do those range attacks, and we'll keep it that way. But I want to make it to where we can have tanks in the game.
// We can have characters absorb damage in front lines"): of yours (`list`), the one a creature reaches first over the floor (every taken square stands in its way, its own side's too), so the
// one in front of it; of those, the nearest, and the one straight ahead of it first. One it can bite from its square is reached at once. A special that reaches from where it stands (the
// striker's LEAP STRIKE, its own pick) is its own (_cbSpecialNow). Null when the list is empty.
const _CB_TIE = 1e-6;   // (two distances this close are a tie)
// the floor's steps from `a`'s square to every square it can walk to (_cbGrid: never through a taken square); null without the floor
function _cbDistFrom(a) {
    const G = _cbGrid(a); if (!G) return null;
    const dist = new Map([[G.k0, 0]]), q = [G.c0];
    for (let i = 0; i < q.length; i++) { const [x, y] = q[i], d = dist.get(x + "," + y); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy, nk = nx + "," + ny; if (dist.has(nk) || !G.open(x, y, nx, ny)) continue; dist.set(nk, d + 1); q.push([nx, ny]); } }
    return { G, dist };
}
// its steps to the nearest free square it could bite `t` from (0: from its own square); Infinity when it can reach none (D: _cbDistFrom(a))
function _cbStepsTo(a, t, D) {
    if (_cbCanHit(a, t, "basic")) return 0;
    if (!D) return Infinity;
    const st = _cbSq(t), w = Math.ceil(_cbReach(a, t, "basic")); let d = Infinity;
    for (let gx = Math.round(st[0]) - w; gx <= Math.round(st[0]) + w; gx++) for (let gy = Math.round(st[1]) - w; gy <= Math.round(st[1]) + w; gy++) {
        const k = gx + "," + gy, s = D.dist.get(k); if (s === undefined || s >= d || (D.G.taken.has(k) && k !== D.G.k0) || !_cbHitsFrom(gx, gy, a, t, "basic")) continue; d = s; }
    return d;
}
function _cbFront(a, list) {
    if (!list.length) return null;
    const D = _cbDistFrom(a); if (!D) return _cbNearest(a, list);
    const L = _cb.lay, fx = L ? -L.ux : 0, fy = L ? -L.uy : 0, sa = D.G.s0;   // (ahead of it: towards your side of the line)
    let best = null, bd = Infinity, be = Infinity, bh = -Infinity;
    for (const t of list) {
        const st = _cbSq(t), d = _cbStepsTo(a, t, D);   // (the nearest by the floor of the free squares it could bite it from)
        const e = Math.hypot(st[0] - sa[0], st[1] - sa[1]), h = (st[0] - sa[0]) * fx + (st[1] - sa[1]) * fy;
        if (d < bd || (d === bd && (e < be - _CB_TIE || (Math.abs(e - be) <= _CB_TIE && h > bh)))) { best = t; bd = d; be = e; bh = h; }
    }
    return best;
}
// TANKS AND THE ENEMIES' FOCUS (§2.46; the owner, 2026-11-17: "I don't think the tank role should have automatic taunting. I think that the tank role would be best if it just did enough damage to
// outclass the brawler when it comes to one-on-one combat. That way, if the enemies are focused on who's doing the highest damage, then they will always choose the tank"; "each creature
// independently checks their own health for Who Is done the most damage to them, and therefore, when the technician hits for a above average normal, hit the brawler would do less damage via AOE
// to all the targets, therefore keeping the focus on the tank"; "Card battles only"). It replaces §2.44's draw (a TANK no longer taunts).
//   THE FOCUS: each creature in a battle keeps its own tally of the damage each of yours has dealt it (cardBattleHurt, from js/helpers.js applyDamage); on its turn it goes for the one that has
//   hurt it most (_cbGrudge), if it can reach it (a way over the floor, your squad standing in the way); the next most, else; none, whoever is in front (§2.40). Its special keeps its own pick.
//   THE TANK: a follower whose PLAY STYLE is TANK (js/commandcenter.js) no longer draws them; no play style changes damage (the owner: "Don't change the damage numbers on any of the roles"). A
//   technician's one hit on a creature can top that creature's tally where a Brawler's blows spread over many: that is the player's to play. RUN's last hits pick as before.
function _cbTank(f) { return !!f && !f.isClone && f.playStyle === "tank"; }
// DRAWN (§2.48: the owner kept SWEET SCENT's, SHELL GUARD's and ROTTEN DECOY's draws as their cards' own): a creature a card of yours drew (`_scentBy`, for the draw's time in turns, §2.52) goes
// for the one that drew it, if it can reach it; one within a ROTTEN DECOY's draw (js/evolution.js decoyLure) goes for the decoy. Null when neither.
// STATUSES IN TURNS (§2.52; the owner, 2026-11-18: "find every instance of when a status is inflicted or poison or something that relays the game clock, and make sure that when you're in a battle
// with somebody ... when you do a damage that has some sort of splash or whatever, it's calculated within the parameters of the battle and not outside of it"; asked how a status shorter than a
// turn counts: "At least one turn"). While a battle's turns run, its fighters' statuses do not run down in real time (cardBattleStatusHeld: js/combat.js updateStatusEffects, js/predator.js's
// blind; the ones kept as an end time held level, _cbHoldUntil); the battle counts them, a turn (2 s of their time, §2.21) at a time, with their damage over time (_cbStatusTurn): when your round is
// over, your side's statuses that hamper its own turn (and their damage over time) and the creatures' that change what is done to them; when the enemies' turn is over, theirs that hamper them and
// yours that change what is done to you. So each lasts its time in turns, a part of a turn a whole one, and at least the next turn of the one it was put on.
function cardBattleStatusHeld(a) { return !!a && !a.dead && _cb.phase === "on" && !!_cb.turn && (_cb.foes.indexOf(a) >= 0 || _cbMine(a)); }
const _CB_UNTIL = { act: ["_scentUntil", "_voltUntil", "poisonUntil"], take: ["_venomUntil", "_guardUntil"] };   // (the statuses kept as an end time: a draw, VOLTAGE FIELD, your poison; VENOM BITE's mark, SHELL GUARD)
function _cbFighters() { const out = new Set(_cb.foes.filter(a => a && !a.dead)); for (const f of _cbSquad()) out.add(f); if (typeof player !== "undefined" && player && !player.dead) out.add(player); return [...out]; }
function _cbHoldUntil() { const f0 = _cbF(); for (const a of _cbFighters()) for (const k of _CB_UNTIL.act.concat(_CB_UNTIL.take)) if (a[k] > f0) a[k]++; }
function _cbStatusTurn(ended) {
    const N = Math.round(CARD_BATTLE.turnSec * 60), f0 = _cbF(), foes = _cb.foes.filter(a => a && !a.dead), mine = _cbFighters().filter(a => foes.indexOf(a) < 0);
    const run = (list, part) => { for (const a of list) {
        if (typeof statusTimersStep === "function") for (let i = 0; i < N && !a.dead; i++) statusTimersStep(a, part);
        if (part === "act" && a.blinded > 0) a.blinded = Math.max(0, a.blinded - N);
        for (const k of _CB_UNTIL[part]) if (a[k] > f0) a[k] = Math.max(f0, a[k] - N);
    } };
    if (ended === "you") { run(mine, "act"); run(foes, "take"); } else { run(foes, "act"); run(mine, "take"); }
    if (ended === "you" && typeof cardShapeBuds === "function") cardShapeBuds(N);   // (SEEDFALL's buds: a turn of their beats, your side's healing over time)
}
// WITHIN THE BATTLE (§2.52): may what `src` makes (its blow, its splash, its field, its shot; or a creature's special or shot) touch `a`? Yours in a battle touch only its creatures (on a card's turn
// only that card's shape's); its creatures touch only you, your squad and a ROTTEN DECOY. Anything else, as ever (the world goes on, §2.28).
function cardBattleTouches(src, a) {
    if (_cb.phase !== "on" || !src || !a) return true;
    const who = typeof predatorSource === "function" ? predatorSource(src) : src;
    if (_cbMine(who)) { if (_cb.foes.indexOf(a) < 0) return false; const T = _cb.turn; return !(T && T.who === "act" && T.shape && T.f === who && !T.shape.maskSet.has(a)); }
    if (_cb.foes.indexOf(who) >= 0) return _cbMine(a) || !!a.isDecoy;
    return !(_cb.foes.indexOf(a) >= 0 || _cbMine(a));   // (the world's, a sentry's shot: none on a fighter of the battle; outside it, as ever)
}
// js/helpers.js applyDamage: a blow of yours (or of a shot or a field of yours) on a creature outside the battle, while one is on, does not land (§2.52: an Ultimate's splash reached them)
function cardBattleOutside(t, src) {
    if (_cb.phase !== "on" || !t || !src || _cb.foes.indexOf(t) >= 0 || !(typeof isEnemyUnit === "function" ? isEnemyUnit(t) : t.team === "red")) return false;
    const s = src.by && !src.isFollower ? src.by : src; return _cbMine(typeof predatorSource === "function" ? predatorSource(s) : s);
}
// js/combat.js and js/abilities.js, the statuses' own functions: on a card's turn, none on a creature of the battle off its shape (whatever puts it there: only that follower is acting)
function cardBattleStatusOk(t) { const T = _cb.turn; return !(t && T && _cb.phase === "on" && T.who === "act" && T.shape && _cb.foes.indexOf(t) >= 0 && !T.shape.maskSet.has(t)); }
// its turn lost to a status (the banner says so; it holds still a moment, then the next)
function _cbLose(T, word) { T.lost = _cbF(); T.lostWord = word; T.t0 = T.lost; T.hit = 0; _cbRefresh(); }
function _cbLure(a, live) {
    const by = a && a._scentBy;
    if (by && a._scentUntil > _cbF() && live.indexOf(by) >= 0 && _cbStepsTo(a, by, _cbDistFrom(a)) < Infinity) return by;
    const d = typeof decoyLure === "function" ? decoyLure(a) : null, L = _cb.lay;
    return d && !d.dead && (!L || !L.room || typeof facilityRoomIdAt !== "function" || facilityRoomIdAt(d.x, d.y) === L.room) ? d : null;
}
// a blow landed on `target` by `source`, `dmg` of its health (js/helpers.js applyDamage, after every cut): in a battle, a creature of it hurt by one of yours remembers how much
function cardBattleHurt(target, source, dmg) {
    if (!cardBattleActive() || !(dmg > 0) || _cb.foes.indexOf(target) < 0) return;
    const src = typeof predatorSource === "function" ? predatorSource(source) : source; if (!_cbMine(src)) return;
    let m = _cb.grudge.get(target); if (!m) { m = new Map(); _cb.grudge.set(target, m); } m.set(src, (m.get(src) || 0) + dmg);
}
// the one of yours (`live`) that has hurt `a` most and that it can reach, or null (none has, or it can reach none of them)
function _cbGrudge(a, live) {
    const m = _cb.grudge.get(a); if (!m || !_cb.lay) return null;
    const hurt = live.filter(t => (m.get(t) || 0) > 0).sort((p, q) => m.get(q) - m.get(p)); if (!hurt.length) return null;
    const D = _cbDistFrom(a); for (const t of hurt) if (_cbStepsTo(a, t, D) < Infinity) return t;
    return null;
}
// THE PLAY STYLES' SQUARE (§2.45; the owner, 2026-11-17: "there needs to be another one where it prefers to keep distance and one where it just tries to get maximum output, not giving
// Who or what touches it"; of what was offered, "Shoots from far" and "Into the crowd"; "none of them do anything with damage"; named "CAUTIOUS / RECKLESS"): of the squares a follower of yours
// can hit `t` from this turn (`keys`, the fewest steps first), the one it walks to: CAUTIOUS (play style "defensive") the farthest from `t`; RECKLESS ("aggressive") the one next to the most
// enemies; a tie, or any other style (BALANCED, TANK), the fewest steps. Null when there are none.
function _cbPickSquare(u, keys, at, t) {
    if (!keys.length) return null;
    const ps = _cb.foes.indexOf(u) < 0 ? u.playStyle : null; if (ps !== "defensive" && ps !== "aggressive") return keys[0];
    const q = _cbSq(t); let best = keys[0], bv = -Infinity;
    for (const k of keys) { const c = at.get(k), v = ps === "defensive" ? Math.hypot(c[0] - q[0], c[1] - q[1]) : _cbFoesNextTo(c); if (v > bv + _CB_TIE) { bv = v; best = k; } }
    return best;
}
// the enemies of the battle on the 8 squares round a square (a RECKLESS one's crowd)
function _cbFoesNextTo(c) { let n = 0; for (const a of _cb.foes) { if (!_cbFoeOk(a)) continue; const s = _cbSq(a); if (Math.max(Math.abs(Math.round(s[0]) - c[0]), Math.abs(Math.round(s[1]) - c[1])) === 1) n++; } return n; }
// a frame of a walk: along its squares at CARD_BATTLE.stepPace, its legs going; at the last, that is its square. True when its turn is over (there and the beat after it, or it went down).
function _cbWalkTick(T, u) {
    const f0 = _cbF(), me = !!u && typeof player !== "undefined" && u === player; if (!u || u.dead || (!me && !(u.health > 0))) return true;   // (me: the cube's walk, §2.69)
    if (T.arrived) return f0 - T.arrived >= CARD_BATTLE.stepBeat;
    const c = T.walk[T.wi]; if (!c || f0 - T.t0 > 600) { T.arrived = f0; return false; }
    const dx = c[0] - u.x, dy = c[1] - u.y, d = Math.hypot(dx, dy), sp = CARD_BATTLE.stepPace;
    if (d <= sp) { u.x = c[0]; u.y = c[1]; if (typeof cardUltStepOn === "function") cardUltStepOn(T, u, c); if (++T.wi >= T.walk.length) { T.arrived = f0; _cb.slots.set(u, { x: c[0], y: c[1] }); } }   // (cardUltStepOn: across a strand of CONTAMINATION NETWORK, js/cardults.js)
    else { u.x += dx / d * sp; u.y += dy / d * sp; u.dirX = dx / d; u.dirY = dy / d; }
    u.walkCycle = (u.walkCycle || 0) + sp * 40; u._fpPath = null; if (me) { u.fpPath = null; u.targetX = u.x; u.targetY = u.y; } if (Number.isFinite(u.visualX)) { u.visualX = u.x; u.visualY = u.y; }
    return false;
}
// a frame of an attack's turn: one that walks off its square on its own legs (no faster than its pace) is kept within `tether` of it; one carried (a leap, a dash, a charge, a roll: faster than it
// walks) goes, and where it is carried to is held instead
function _cbTether(T, u) {
    if (!u || u.dead) return;
    if (!T.anc) { const s = _cbSq(u); T.anc = [s[0], s[1]]; T.px = u.x; T.py = u.y; return; }
    if (Math.hypot(u.x - T.px, u.y - T.py) > (u.baseMoveSpeed || u.moveSpeed || 0.02) * 2.5 + 0.01) T.anc = [u.x, u.y];
    else { const dx = u.x - T.anc[0], dy = u.y - T.anc[1], d = Math.hypot(dx, dy), R = CARD_BATTLE.tether; if (d > R) { const m = Math.min(d - R, CARD_BATTLE.slide); u.x -= dx / d * m; u.y -= dy / d * m; if (Number.isFinite(u.visualX)) { u.visualX = u.x; u.visualY = u.y; } } }   // (eased back, as to a square: one still on its way to it is not jerked)
    T.px = u.x; T.py = u.y;
}
// after its attack: one carried a tile or more off its square (the owner, of the striker's leap: "They jump and create new positioning") takes the free square of the room nearest where it stands
function _cbResquare(u) {
    const s = u && _cb.slots.get(u), L = _cb.lay; if (!s || u.dead || Math.hypot(u.x - s.x, u.y - s.y) < 1 || !L || !L.room || typeof partyRoomCells !== "function") return;
    const taken = new Set(); for (const [a, q] of _cb.slots) if (a && a !== u && !a.dead && !_cb.out.has(a)) taken.add(Math.round(q.x) + "," + Math.round(q.y));
    let best = null, bd = 1.5; for (const c of partyRoomCells(L.room)) { if (taken.has(c[0] + "," + c[1])) continue; const d = Math.hypot(c[0] - u.x, c[1] - u.y); if (d < bd) { bd = d; best = c; } }
    if (best) _cb.slots.set(u, { x: best[0], y: best[1] });
}
// PUSHES AND PULLS ON THE SQUARES (§2.63; the owner, 2026-11-18, of three offered: "Its own distance"): in a battle a push or a pull moves a fighter by its own tiles as squares, a part of a
// tile counting whole (BASH's 1 tile: 1 square; STAKE RING's 1.5: 2; GRAVITY SLAM's 0.5: 1), square by square along its line as a walk steps (not through a wall, not across a corner, not
// out of the battle's room); it stops at a taken square, and where it stops is its square. A pull (`to`: the point it is drawn to) goes no further than that point's square. A boss or a huge
// body, more than a square, is not moved (the agent's reading, §11.28). The game's own knock asks here first (js/combat.js applyKnockback, and the moves that shove by hand): true, the battle
// moves it and there is no knock of the game's own, which the battle would only ease back. Those of one frame move together, a square at a time each (_cbPushes, each frame of the turns), so
// one in front of another is not stopped by the square the other is leaving.
function cardBattlePush(t, dx, dy, tiles, to) {
    if (_cb.phase !== "on" || !t || t.dead || !_cb.slots || !_cb.slots.has(t) || _cb.out.has(t) || !(tiles > 0)) return false;
    if (!t.isBoss && !(t.bodyR > 0) && (to || dx || dy)) (_cb.pushQ || (_cb.pushQ = [])).push({ t, dx, dy, n: Math.max(1, Math.ceil(tiles - 1e-6)), to: to ? [Math.round(to[0]), Math.round(to[1])] : null, k: 0 });
    t.kbVX = 0; t.kbVY = 0; return true;
}
function cardBattlePull(t, x, y, tiles) { return cardBattlePush(t, 0, 0, tiles, [x, y]); }
function _cbPushes() {
    const Q = _cb.pushQ; if (!Q || !Q.length) return; _cb.pushQ = [];
    for (const q of Q) {   // (each one's line, from its square)
        const s = _cb.slots.get(q.t); if (!s) { q.n = 0; continue; } q.x0 = Math.round(s.x); q.y0 = Math.round(s.y); q.x = q.x0; q.y = q.y0;
        if (q.to) { q.dx = q.to[0] - q.x0; q.dy = q.to[1] - q.y0; q.n = Math.min(q.n, Math.max(Math.abs(q.dx), Math.abs(q.dy))); }
        const L = Math.max(Math.abs(q.dx), Math.abs(q.dy)); if (!(L > 0)) { q.n = 0; continue; } q.sx = q.dx / L; q.sy = q.dy / L;
    }
    for (let moved = true, pass = 0; moved && pass < 16; pass++) {
        moved = false;
        for (const q of Q) {
            const t = q.t; if (q.k >= q.n || !t || t.dead || _cb.out.has(t)) continue;
            const G = _cbGrid(t); if (!G) continue;
            const nx = Math.round(q.x0 + q.sx * (q.k + 1)), ny = Math.round(q.y0 + q.sy * (q.k + 1)); if (!G.open(q.x, q.y, nx, ny)) continue;
            q.x = nx; q.y = ny; q.k++; moved = true; _cb.slots.set(t, { x: nx, y: ny });
            const T = _cb.turn; if (T && (T.f === t || T.a === t) && T.anc) T.anc = [nx, ny];   // (in its own turn, a biter thrown off a jelly shield: held by its new square from now)
        }
    }
}
// a creature's special, ready, that would go off from where it stands (the striker's LEAP STRIKE at range; not a call for backup or an escape leap, which hit nobody): its turn is that, not a walk
function _cbSpecialNow(a) {
    if (!a || a.abilityPhase !== "ready" || !a.abilityDef || a.abilityKey === "BACKUP_CALL" || a.abilityKey === "LEAP") return false;
    try { return typeof _abShouldFire === "function" && !!_abShouldFire(a, a.abilityDef); } catch (e) { return false; }
}
// is `a` doing its card on its turn, from its square? (js/npc.js: a Mage then shoots from there, near or far, and never backs off or walks in)
function cardBattleStands(a) { const T = _cb.turn; return !!T && !!a && _cb.phase === "on" && !!_cb.lay && T.who === "act" && T.f === a && !T.walk; }
// OVER LOW OBJECTS (§2.38; the owner, 2026-11-17: "considering that objects do have some sort of relationship to the battles, let's make it to where ranged attacks can go over objects if, you know,
// they don't exceed a certain height"; of two offered, "Card battles only"): a shot fired in the battle's room while its turns are on passes over every LOW object (waist high or less: js/facility.js
// FAC_LOW, a crate, a barrel, a desk, a barrier, a pump), cover too; a wall or a tall object (a crate stack, a console, a generator) still stops it. Out of a battle, and outside its room, the
// game's own cover rule (docs/COMBAT.md §8). `ox, oy`: where the shot was fired (js/facility.js facilityShotStop).
function cardBattleOverLow(ox, oy) {
    if (_cb.phase !== "on" || !_cb.turn || !_cb.lay || !_cb.lay.room || typeof facilityRoomIdAt !== "function") return false;
    return facilityRoomIdAt(ox, oy) === _cb.lay.room;
}
// A RETICLE ON EVERY ENEMY (§2.37; the owner, 2026-11-17: "The red blinking square like reticule thing is not locked on to anything. So we need to fix that to where it shows each enemy with one of
// those"): while a battle is on, the gun's corners (js/gunfire.js drawLockReticle: red, turning in and out) go round each of its enemies, where the 3D view draws it (the battle's camera is lower
// and turned: the 2D's own reckoning had put the gun's one set off its creature). The gun's own, and its locking-on corners (js/targeting.js), are not drawn while the battle or its camera is up.
const _CB_CORNERS = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
function cardBattleAiming() { return cardBattleActive() || _cb.k > 0.0001; }
function cardBattleReticles() {
    if (!cardBattleAiming()) return false;
    if (typeof ctx === "undefined" || typeof canvas === "undefined" || !cardBattleActive() || _cb.phase === "black") return true;
    const V = typeof VIEW3D !== "undefined" && VIEW3D.showing && VIEW3D.view && typeof VIEW3D.view.screenNow === "function" ? VIEW3D.view : null, pulse = 3 * Math.sin(_cbF() * 0.15);
    if (V && typeof cardUltDraw === "function") cardUltDraw(V);   // (the squares of an Ultimate's field while it lasts, faint: §2.65)
    if (V && typeof cardShapeDraw === "function") cardShapeDraw(V);
    if (V) _cbFoeTileDraw(V);   // (the enemy a dragged card is over: its square lit)   // (a card being dragged: its squares lit on the floor, under the reticles, §2.48)
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.strokeStyle = "#ff4a3a"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.globalAlpha = 0.9;
    for (const a of _cb.foes) {
        if (!_cbFoeOk(a)) continue;
        let x, y, r = 26;
        if (V) { if (typeof V.has === "function" && !V.has(a)) continue;
            const top = typeof V.top === "function" ? V.top(a) : 22, p = V.screenNow(a.x, a.y, 0), q = V.screenNow(a.x, a.y, top), e = V.screenNow(a.x + 1, a.y, 0); x = (p[0] + q[0]) / 2; y = (p[1] + q[1]) / 2;
            r = Math.max(22, Math.min(80, 0.8 * top * Math.hypot(e[0] - p[0], e[1] - p[1]) / ((typeof TILE_W !== "undefined" ? TILE_W : 64) * Math.SQRT2) + 8)); }   // (round its body as the picture draws it, a tank's as a scout's: its width, px of the game's drawing, at the floor's scale there; the agent's)
        else if (typeof _gunScreen === "function") { const p = _gunScreen(a); x = p.x; y = p.y; }
        else continue;
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
        const R = r + pulse, k = Math.max(8, R * 0.35);
        for (const [sx, sy] of _CB_CORNERS) { ctx.beginPath(); ctx.moveTo(x + sx * R, y + sy * (R - k)); ctx.lineTo(x + sx * R, y + sy * R); ctx.lineTo(x + sx * (R - k), y + sy * R); ctx.stroke(); }
        if (V) _cbGroundBar(V, a);
    }
    ctx.restore(); return true;
}
// ITS HEALTH, A CALLOUT (the owner, 2026-11-18: first "the health bars are visible somehow on the ground near each enemy", then "a more 3D looking health bar that kind of like has a line drawn
// from the creature into a 2D health bar that floats atop to the side"): over each enemy of the battle, up and to its side (the side away from the middle of the screen, so they spread out), a
// raised bar (a slanted face with a darker underside and a light top edge: red its health left, from the left, dark what it has lost, its numbers over it); a line from a dot on the creature rises
// to it and runs along under it. It goes where the creature goes. Sizes the agent's (CARD_BATTLE.hpBar, screen points).
function _cbBarGeom(V, a) {
    const B = CARD_BATTLE.hpBar, r = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null, k = r && r.width ? canvas.width / r.width : 1;
    const top = typeof V.top === "function" ? V.top(a) : 22, p = V.screenNow(a.x, a.y, top * 0.55); if (!Number.isFinite(p[0]) || !Number.isFinite(p[1])) return null;
    const side = p[0] < canvas.width / 2 ? -1 : 1, w = B.w * k, h = B.h * k, ex = p[0] + side * B.out * k, ey = p[1] - B.up * k;
    return { B, k, p, side, w, h, d: B.depth * k, sk: B.slant * k, ex, ey, x0: side > 0 ? ex : ex - w, y0: ey - h };
}
// the health a creature's bar shows: what its numbers have brought it to as they land (eased), not yet what the blow did; the piece just lost flashes pale
function _cbShown(a) {
    const S = _cbHp.get(a), hp = Math.max(0, a.health); if (!S) return { v: hp, chip: 0 };
    if (!_cbNums.size || ![..._cbNums.values()].some(n => n.unit === a && !n.landed)) S.want = hp;   // (nothing on its way: the bar goes to the health it has)
    S.v += (Math.min(S.want, S.v) - S.v) * 0.25; if (Math.abs(S.v - S.want) < 0.05) S.v = S.want; if (S.chipT > 0) S.chipT--;
    if (S.v <= hp + 0.05 && S.chipT <= 0 && S.want <= hp) _cbHp.delete(a);
    return { v: S.v, chip: S.chipT > 0 ? S.chipFrom : 0 };
}
function _cbGroundBar(V, a) {
    const G = _cbBarGeom(V, a); if (!G) return;
    const { B, k, p, side, w, h, d, sk, ex, ey, x0, y0 } = G, mx = a.maxHealth || 1, sh = _cbShown(a), k1 = Math.max(0, Math.min(1, sh.v / mx)), kc = Math.max(k1, Math.min(1, sh.chip / mx));
    const face = (x, y, ww, hh) => { ctx.beginPath(); ctx.moveTo(x + sk, y); ctx.lineTo(x + ww + sk, y); ctx.lineTo(x + ww, y + hh); ctx.lineTo(x, y + hh); ctx.closePath(); };
    ctx.save(); ctx.globalAlpha = 0.95;
    // the line: a dot on the creature, up at a slant, then along under the bar
    const line = () => { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(ex - side * B.run * k, ey); ctx.lineTo(ex + side * w * 0.6, ey); ctx.stroke(); };
    ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(5,8,16,0.85)"; ctx.lineWidth = 4 * k; line(); ctx.strokeStyle = "#ff8a6a"; ctx.lineWidth = 1.8 * k; line();   // (a dark edge under a bright core: seen on a light floor and a dark one)
    ctx.beginPath(); ctx.arc(p[0], p[1], 3.5 * k, 0, Math.PI * 2); ctx.fillStyle = "rgba(5,8,16,0.85)"; ctx.fill(); ctx.beginPath(); ctx.arc(p[0], p[1], 2.2 * k, 0, Math.PI * 2); ctx.fillStyle = "#ffd2c8"; ctx.fill();
    // the bar: its underside (depth), its face, the piece just lost (pale), its health, its top edge
    face(x0, y0 + d, w, h); ctx.fillStyle = "#3a0d08"; ctx.fill();
    face(x0, y0, w, h); ctx.fillStyle = "#0b1020"; ctx.fill();
    if (kc > k1) { face(x0, y0, w * kc, h); ctx.fillStyle = "#ffe6dc"; ctx.fill(); }
    if (k1 > 0) { face(x0, y0, w * k1, h); const g = ctx.createLinearGradient(0, y0, 0, y0 + h); g.addColorStop(0, "#ff8a5a"); g.addColorStop(0.45, "#ff4a1c"); g.addColorStop(1, "#b8260c"); ctx.fillStyle = g; ctx.fill(); }
    face(x0, y0, w, h); ctx.strokeStyle = "rgba(255,235,228,0.9)"; ctx.lineWidth = 1.2 * k; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0 + sk + 1.5 * k, y0 + 1.5 * k); ctx.lineTo(x0 + sk + w * Math.max(k1, 0.02) - 1.5 * k, y0 + 1.5 * k); ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 1 * k; ctx.stroke();
    // its numbers, over the bar (the health shown)
    ctx.font = "italic 900 " + Math.round(B.font * k) + "px system-ui, sans-serif"; ctx.textAlign = side > 0 ? "left" : "right"; ctx.textBaseline = "bottom";
    const tx = side > 0 ? x0 + sk : x0 + w + sk, ty = y0 - 2 * k, txt = Math.max(0, Math.round(sh.v)) + "/" + Math.round(a.maxHealth || 0);
    ctx.lineWidth = 3 * k; ctx.strokeStyle = "rgba(5,8,16,0.9)"; ctx.strokeText(txt, tx, ty); ctx.fillStyle = "#fff"; ctx.fillText(txt, tx, ty);
    ctx.restore();
}
// THE NUMBERS (the owner, 2026-11-18: "bring back all of the numbers that have the animation after they hit and then they affect the health bar"): in a battle the game's own words and numbers wait
// (the 2D's reckoning is not the battle's camera: js/drops.js); here they are drawn where the 3D view draws the fight. A hit's number pops at the creature (rising, swelling then settling: `pop`
// frames); on an enemy it then flies into its bar, to where the bar will be cut (`glide`); as it lands the bar is cut (the piece lost flashes pale) and the number is gone. On one of yours it rises
// and fades. Other words (MISS, DEFEATED, a status) rise from the creature. Timings the agent's, after the battle view's (js/battleview.js BATTLE_VIEW.num).
const _cbNums = new Map(), _cbHp = new Map();   // (a number → its flight; a creature → the health its bar shows while numbers are on their way)
function cardBattleNumberTag(t, unit, dmg) {
    if (!t || !unit || !cardBattleAiming() || !(dmg > 0)) return;
    const foe = _cb.foes.indexOf(unit) >= 0; if (!foe && !_cbMine(unit)) return;
    const N = CARD_BATTLE.num; t.life = Math.max(t.life || 0, N.pop + (foe ? N.glide + 2 : N.rise));
    _cbNums.set(t, { unit, val: dmg, t0: _cbF(), foe, landed: false, x: unit.x, y: unit.y, jit: (Math.random() - 0.5) * 18 });
    if (foe) { let S = _cbHp.get(unit); if (!S) { S = { v: Math.max(0, unit.health) + dmg, want: Math.max(0, unit.health) + dmg, chipT: 0, chipFrom: 0 }; _cbHp.set(unit, S); } }
}
function cardBattleNumbers() {
    if (!cardBattleAiming()) { if (_cbNums.size) _cbNums.clear(); if (_cbHp.size) _cbHp.clear(); return false; }
    if (typeof ctx === "undefined" || typeof floatingTexts === "undefined") return true;
    const V = typeof VIEW3D !== "undefined" && VIEW3D.showing && VIEW3D.view && typeof VIEW3D.view.screenNow === "function" ? VIEW3D.view : null, N = CARD_BATTLE.num, f0 = _cbF();
    const r = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null, k = r && r.width ? canvas.width / r.width : 1;
    for (const t of _cbNums.keys()) if (floatingTexts.indexOf(t) < 0) { const n = _cbNums.get(t); if (n.foe && !n.landed) _cbNumLand(n); _cbNums.delete(t); }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
    for (const t of floatingTexts) {
        if (t._waiting) continue;
        const n = _cbNums.get(t);
        if (!t.world) { ctx.globalAlpha = Math.min(1, t.life / 30); ctx.font = t.size ? "bold " + t.size + "px monospace" : "bold 13px monospace"; ctx.fillStyle = "#000"; ctx.fillText(t.text, t.x + 1, t.y + 1); ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y); continue; }
        if (!V) continue;
        const u = n ? n.unit : null, top = u && typeof V.top === "function" ? V.top(u) : 22, ux = u ? u.x : t.x, uy = u ? u.y : t.y, base = V.screenNow(ux, uy, top * 0.8);
        if (!Number.isFinite(base[0]) || !Number.isFinite(base[1])) continue;
        if (!n) {   // a word: it rises from where it was said and fades
            const age = (t._cbAge = (t._cbAge || 0) + 1); ctx.globalAlpha = Math.min(1, t.life / 30);
            if (t._cbBig) { const sw = age < 8 ? 0.5 + age * 0.09 : age < 14 ? 1.22 - (age - 8) * 0.037 : 1; _cbText(t.text, base[0], base[1] - 20 * k - age * 0.45 * k, t.size * k * sw, t.color, k); continue; }   /* (a kill's experience: large, swelling as it comes out of the fallen one) */
            _cbText(t.text, base[0], base[1] - 34 * k - age * 0.6 * k, (t.size || 12) * k, t.color || "#fff", k); continue;   // (above where a number pops, so the two do not overlap)
        }
        const age = f0 - n.t0, sw = age < 6 ? 0.6 + age * 0.17 : age < 10 ? 1.62 - (age - 6) * 0.155 : 1;   // (swells, then settles)
        const px = base[0] + n.jit * k, py = base[1] - 6 * k - Math.min(age, N.pop) * 0.5 * k, size = (n.foe ? 20 : 17) * k * sw, col = n.foe ? "#fff1c8" : "#ff6a5a";
        if (!n.foe) { ctx.globalAlpha = Math.max(0, Math.min(1, (N.pop + N.rise - age) / 12)); _cbText("-" + Math.round(n.val), px, py - Math.max(0, age - N.pop) * 0.4 * k, size, col, k); continue; }
        if (age < N.pop) { ctx.globalAlpha = 1; _cbText(Math.round(n.val), px, py, size, col, k); continue; }
        // into the bar: to where it will be cut
        const G = _cbBarGeom(V, u); if (!G) { if (!n.landed) _cbNumLand(n); continue; }
        const S = _cbHp.get(u), cutAt = Math.max(0, Math.min(1, ((S ? S.want : u.health) - n.val) / (u.maxHealth || 1))), tx = G.x0 + G.sk * 0.5 + G.w * cutAt, ty = G.y0 + G.h / 2;
        const e = Math.min(1, (age - N.pop) / N.glide), ee = e * e * (3 - 2 * e);
        if (e >= 1) { if (!n.landed) _cbNumLand(n); continue; }
        ctx.globalAlpha = 1 - e * 0.3; _cbText(Math.round(n.val), px + (tx - px) * ee, py + (ty - py) * ee - Math.sin(e * Math.PI) * 26 * k, size * (1 - 0.45 * ee), col, k);
    }
    ctx.restore(); return true;
}
function _cbNumLand(n) {   // a number arrives: its creature's bar is cut by it, the piece lost flashing pale
    n.landed = true; const S = _cbHp.get(n.unit); if (!S) return;
    S.chipFrom = Math.max(S.chipFrom && S.chipT > 0 ? S.chipFrom : 0, S.v); S.chipT = CARD_BATTLE.num.chip; S.want = Math.max(Math.max(0, n.unit.health), S.want - n.val);
}
function _cbText(txt, x, y, size, col, k) { ctx.font = "italic 900 " + Math.round(size) + "px system-ui, sans-serif"; ctx.lineWidth = 4 * k; ctx.strokeStyle = "rgba(5,8,16,0.9)"; ctx.strokeText(String(txt), x, y); ctx.fillStyle = col; ctx.fillText(String(txt), x, y); }
function cardBattleTurn() { return _cb.turn ? _cb.turn.who : null; }
function cardBattleTurnInfo() { const T = _cb.turn; return T ? { who: T.who, actor: T.who === "act" ? T.f : T.who === "foe" ? T.a : null, kind: T.kind || null, id: T.id || null, target: T.target || null, run: !!T.run, walk: T.walk ? T.walk.length : 0 } : null; }   // (walk: the tiles of a walk, §2.39; 0 for an attack)
// does this one hold still now? (js/npc.js updateNPC, js/evolution.js: everyone in the battle but the one whose turn it is; and that one too while it walks: the battle walks it, §2.39)
function cardBattleHolds(a) {
    const T = _cb.turn; if (!T || _cb.phase !== "on" || !a) return false;
    if ((T.who === "act" && a === T.f) || (T.who === "foe" && a === T.a)) return !!T.walk || !!T.lost || (T.who === "act" && T.kind === "ult" && !!T.shape && !a._fault);   // (and one that lost its turn to a status, §2.52; and one in its Ultimate's turn, which is its Ultimate alone: no step or hit of its own, §2.64; FAULTLINE's run is its own)
    if (_cb.foes.indexOf(a) >= 0) return true;
    return a !== (typeof player !== "undefined" ? player : null) && _cbMine(a);
}
function _cbCdLeft(f, id) { const m = _cb.cd.get(f); return m && m[id] > 0 ? m[id] : 0; }
function _cbNearest(from, list) { let best = null, bd = Infinity; for (const t of list) { const d = Math.hypot(t.x - from.x, t.y - from.y); if (d < bd) { bd = d; best = t; } } return best; }
// EACH FOLLOWER ITS CARD (the owner, 2026-11-17: "the battle turns should allow each of my followers to attack. It's only allowing one per turn, and the enemy gets two"; superseding §2.2's one card a
// turn): your turn is a round in which each member of the squad still up plays one card (or walks, §2.39), in the order you choose; then the enemies, each its turn; then the next round. _cb.acted: the
// members that have had theirs this round. A recharge counts rounds.
_cb.acted = new Set();
// ONE AT A TIME (the owner, 2026-11-17: "instead of having a menu where it shows all the followers and all of their attacks, it's going to go through them one by one, and it's going to show all of their
// attacks as a pop-up [...] whenever you select the attack, it rotates or does some sort of like switch in to the next follower"; asked, "Play right away" and no going back, the card dragged onto an
// enemy, the pop-up at the bottom centre): your round goes through your squad in its order, the first still up that has not had its card; the pop-up shows that one's cards; a card played, it plays
// out at once, and the pop-up switches in the next.
function _cbCurrent() { if (!_cb.turn) return null; for (const f of _cbSquad()) if (!_cb.acted.has(f)) return f; return _cbYouTurn() ? player : null; }   // (your followers in the squad's order, then the Gunslinger: §2.66)
function _cbAfterAct(f0) {
    if (!_cb.foes.some(_cbFoeIn)) { _cb.turn = { who: "you", t0: f0 }; return; }
    if (_cbSquad().some(f => !_cb.acted.has(f)) || _cbYouTurn()) { _cb.turn = { who: "you", t0: f0 }; _cbRefresh(); return; }   // (another of yours still to act, or the Gunslinger: §2.66)
    _cbFoesTurn(false);
}
// THE GUNSLINGER'S TURN (§2.66; the owner, 2026-11-20: "the gunslinger gets a turn in the battle phases. So every rotation he gets a turn, and he has one attack so far, which is shoot, I guess, and it
// does four to five shots. [...] And shows the ammo [...] the bottom. [...] it has no wind up or anything"): superseding §2.10 (the cube commands only) for a Gunslinger with the machine gun in hand
// (the only weapon there is: js/weapons.js). Each round, after your followers have had theirs, the cube has its own turn: the pop-up shows its card, SHOOT, with the ammunition on its foot.
// Dragged onto an enemy, a burst of 4 or 5 rounds goes off at once (no charge, no cooldown), at the gun's own rate, each round the gun's own (its damage, a role's element and kit, a round spent);
// fewer when the rounds run out or the enemy falls. With no round left it has no turn. THE AGENT'S, PROVISIONAL: its place (after the followers); the rounds are the gun's own (so a wall or cover
// between stops them: a drop on an enemy with no clear shot says so and plays nothing); and HOLD FIRE, a second card (a tap or a drag), passes its turn and keeps the rounds.
// SMASH (§2.69; the owner, 2026-11-20, of its melee: "It's used as a close up smash with the gun"; asked: "Card battles only", "It walks up, like followers", "About a burst (36)", "Free, every
// round"): its second attack card. On an enemy next to it (the 8 squares round its own, in sight) the blow lands at once for CARD_BATTLE.smash.damage, Crushing (js/damage.js DMG_HIT_SMASH: the
// agent's reading of a smash), with no round spent, no charge and no cooldown. On one out of reach its turn is a walk towards it, by its own pace on the squares as a follower's (MOVE NOW, ATTACK
// LATER, §2.39: the card stays ready), and where it stops is its square: the cube is in the line then, and its enemies come for it as for anyone in front (§2.40). So the cube always has a turn.
function _cbYouIn() { return typeof player !== "undefined" && !!player && !player.dead && typeof weaponInHand === "function" && weaponInHand(); }
function _cbYouTurn() { return _cbYouIn() && !_cb.youActed && _cb.foes.some(_cbFoeOk); }   // (with no round left it still has SMASH: §2.69)
function cardBattleShooting() { return !!_cb.shooting; }   // (js/input.js firePlayerShot: the gun holds its fire in a battle but for its own burst)
function _cbYouCards() {
    const S = CARD_BATTLE.shoot, ammo = typeof playerAmmo === "number" ? Math.max(0, playerAmmo) : 0, dmg = typeof weaponDamage === "function" ? weaponDamage() : 0, col = typeof classColour === "function" && typeof playerClassKey !== "undefined" ? classColour(playerClassKey) : "#ffb347";
    const out = [{ kind: "shoot", tag: "ATTACK", name: "SHOOT", fx: S.shots[0] + " to " + S.shots[1] + " rounds at one enemy, at once: " + dmg + " a round.", ready: ammo > 0, ammo, col },
        { kind: "smash", tag: "ATTACK", name: "SMASH", fx: "A blow with the gun on an enemy next to you: " + CARD_BATTLE.smash.damage + ", no ammo. Too far, you walk up.", ready: true, col },
        { kind: "pass", tag: "HOLD", name: "HOLD FIRE", fx: "Keep your rounds: your turn passes.", ready: true, col }];
    if (_cb.turn && (_cb.turn.who === "you" || _cb.turn.who === "act") && _cb.youActed) for (const c of out) { c.ready = false; c.done = true; }   // (it has had its turn this round)
    return out;
}
function _cbYouPlay(kind, target) {
    if (!_cbYouTurn() || _cbCurrent() !== player) return false;
    const say = w => { _cb.say = { text: "YOU · " + w, until: _cbF() + 120 }; _cbRefresh(); return false; };
    if (kind === "pass") { _cb.youActed = true; _cbAfterAct(_cbF()); _cbRefresh(); return true; }
    if (kind !== "shoot" && kind !== "smash") return false;
    const live = _cb.foes.filter(_cbFoeOk); if (!live.length) return false;
    if (live.indexOf(target) < 0) target = _cbNearest(player, live);
    if (kind === "smash") {   // (close up: next to it, the blow at once; else its turn is the walk towards it, the card still ready: §2.39, as a follower's)
        const walk = _cb.lay && !_cbCanHit(player, target, "smash") ? _cbWalkPath(player, target, "smash", null) : null;
        if (_cb.lay && !walk && !_cbCanHit(player, target, "smash")) return say("NO WAY THROUGH");
        _cb.turn = { who: "act", f: player, kind: "smash", id: null, target, t0: _cbF(), hit: 0, fired: false, saved: null, walk, wi: 0, arrived: 0, last: _cbF() };
        _cb.youActed = true; _cbRefresh(); return true;
    }
    if (!(playerAmmo > 0)) return say("NO AMMO");
    if (typeof facilityShotClear === "function" && !facilityShotClear(player.x, player.y, target.x, target.y)) return say("NO CLEAR SHOT");   // (the rounds are the gun's own: a wall or cover between stops them, docs/COMBAT.md §8)
    const S = CARD_BATTLE.shoot, n = S.shots[0] + Math.floor(Math.random() * (S.shots[1] - S.shots[0] + 1));
    _cb.turn = { who: "act", f: player, kind: "shoot", id: null, target, t0: _cbF(), hit: 0, fired: false, saved: null, shots: n, shot: 0, last: _cbF() };
    _cb.youActed = true; player.attackCooldown = 0; _cbRefresh(); return true;
}
// its burst, each frame of its turn: a round as often as the gun fires, at its enemy while it stands, till the burst is spent or the rounds are; then, the last round landed and a beat on, the next turn
function _cbShootTick(T, f0) {
    const C = CARD_BATTLE, t = T.target, more = T.shot < T.shots && _cbFoeOk(t) && playerAmmo > 0;
    if (more && (player.attackCooldown || 0) <= 0) {
        let ok = false; _cb.shooting = true; try { ok = typeof firePlayerShot === "function" && firePlayerShot(t) === true; } finally { _cb.shooting = false; }
        if (ok) { T.shot++; T.fired = true; T.last = f0; } else T.shots = T.shot;   // (a round that would not go off ends the burst)
        return;
    }
    if (more && f0 - T.t0 < C.actMax) return;   // (the gun cycles)
    const flying = typeof followerProjectiles !== "undefined" && followerProjectiles.some(p => p && p.source && p.source.isPlayer);
    if ((!flying && f0 - T.last >= C.beat) || f0 - T.t0 >= C.actMax || !_cb.foes.some(_cbFoeIn)) _cbAfterAct(f0);
}
// its SMASH, each frame of its turn: the walk when it is out of reach (then the next turn); else the blow at once, the cube lunging at its enemy and eased back to its square, and a beat on the next turn
function _cbSmashTick(T, f0) {
    const C = CARD_BATTLE, t = T.target, live = _cb.foes.some(_cbFoeIn);
    if (T.walk) { if (_cbWalkTick(T, player) || !live) _cbAfterAct(f0); return; }
    if (!T.fired) {
        T.fired = true; T.last = f0; if (!_cbFoeOk(t)) return;
        const dx = t.x - player.x, dy = t.y - player.y, d = Math.hypot(dx, dy) || 1, src = { x: player.x, y: player.y, team: "green", element: null, isPlayer: true };
        if (typeof applyDamage === "function") applyDamage(t, C.smash.damage, src, null, false, false, typeof DMG_HIT_SMASH !== "undefined" ? DMG_HIT_SMASH : null);
        player.x += dx / d * C.smash.lunge; player.y += dy / d * C.smash.lunge; if (Number.isFinite(player.visualX)) { player.visualX = player.x; player.visualY = player.y; }   // (the lunge: _cbSlide eases it back to its square)
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: t.x, y: t.y, color: "#ffd9a0", radius: 0.7, life: 16 });
        if (typeof shake !== "undefined") shake = Math.max(shake, 4);
        return;
    }
    if (f0 - T.last >= C.beat || !live) _cbAfterAct(f0);
}
function _cbYourTurn() {
    _cb.acted.clear(); _cb.youActed = false;
    for (const [f, c] of _cb.charge) { if (!_cbAlive(f)) { _cb.charge.delete(f); continue; } c.left--; if (c.left > 0) _cb.acted.add(f); }   // (still charging: its turn passes; charged: it fires at its turn)
    _cb.round++;
    if (_cb.round > 1) for (const m of _cb.cd.values()) for (const id in m) if (m[id] > 0) m[id]--;
    if (_cb.round > 1) _cbStatusTurn("foes");   // (the enemies' turn over: a turn on the statuses, §2.52)
    if (_cb.round > 1 && typeof cardUltTurnEnd === "function") cardUltTurnEnd();   // (and on what an Ultimate holds, shields or walls: §2.64)
    for (const f of _cbSquad()) if (f && f._consume) _cb.acted.add(f);   // (the Sundew holds still while it digests, §2.64: it plays no card)
    if (typeof cardShapeStays === "function") cardShapeStays("you");   // (an area whose turns are over closes; last round's draws and bracing end: §2.48)
    _cb.turn = { who: "you", t0: _cbF() };
}
// PLAY A CARD (the drag, §2.17; the tests call it too): `f` a member of the squad still up, `kind` "basic", "move" (with its `id`) or "ult", `target` the enemy it was dropped on (another
// place: the nearest enemy to it; the agent's, for a move with no single target, §11.4). False when it cannot be played now.
// CHARGE AND COOL DOWN, BY CLASS (the owner, 2026-11-18: "you can't use some attacks until you wait a turn charge up [...] the [Mage's] normal [attack] and the secondary [attack]. The ultimate don't
// have a cast; the brawler they can attack immediately but they have a cool down, and a technician, they have a wind up and a cool down"; asked: "Charges now, fires next turn", "Both charge up", "From
// each move's wait time"): a MAGE's basic attack and second attack CHARGE: played on an enemy, it charges (its turn is over) and the attack fires on its own at its turn when the charge is done (using that
// turn); no cooldown. A BRAWLER's attacks fire at once; its second attack then COOLS DOWN (its RECHARGE). A TECHNICIAN's second attack charges, fires, then cools down; its basic fires at once. An
// ULTIMATE fires at once. The lengths: a move's wait time at 2 s a turn (a part counts whole, at least 1); a Mage's basic, 1 turn.
_cb.charge = new Map();   // follower → { kind, id, target, aim, left: turns still to charge }
function _cbChargeTurns(f, kind, id) {
    if (!f || kind === "ult" || !CARD_BATTLE.byClass) return 0;
    const m = kind === "move" && typeof MOVES !== "undefined" ? MOVES[id] : null, t = m ? _cbTurns(m.windup) : 1;
    const role = _cbRole(f);
    if (role === "sniper") return t;               // (a Mage: both its cards)
    if (role === "camper") return kind === "move" ? t : 0;   // (a Technician: its second attack)
    return 0;                                         // (a Brawler: at once)
}
function _cbCools(f, kind) { return kind === "move" && !!f && (!CARD_BATTLE.byClass || _cbRole(f) !== "sniper"); }
function _cbRole(f) { const d = f && f.evolved && typeof evolvedDef === "function" ? evolvedDef(f) : null; return (d && d.role) || (f && f.role); }   // (its form's class: an evolved one's is fixed by its form)   // (a Brawler's and a Technician's second attack cool down; a Mage's does not)
function cardBattlePlay(f, kind, id, target, fire) {
    const T0 = _cb.turn, dropped = target; if (!cardBattleActive() || !T0 || T0.who !== "you") return false;
    if (typeof player !== "undefined" && f === player) return _cbYouPlay(kind, target);   // (THE GUNSLINGER'S TURN, §2.66: SHOOT or HOLD FIRE)
    if (!f || f.dead || !(f.health > 0) || _cbSquad().indexOf(f) < 0 || _cb.acted.has(f) || f !== _cbCurrent()) return false;   // (one card each a round, each in its turn: the squad's order)
    const live = _cb.foes.filter(_cbFoeOk); if (!live.length) return false;
    // THE SHAPE'S AIM (§2.48, js/cardshapes.js): let go on an enemy (`target`), on a floor square ({ x, y, tile: true }) or anywhere, as its shape takes it. A blast or the decoy let go on an
    // enemy takes that enemy's square; let go nowhere, a card takes the nearest enemy (or its square), as before (§11.4)
    const def = typeof cardShapeDef === "function" ? cardShapeDef(f, kind, id) : null, aimK = def ? cardShapeAim(def) : "foe";   // (an Ultimate's shape too: js/cardults.js §2.64)
    let aim = null;
    if (aimK === "tile" && target && target.tile && Number.isFinite(target.x) && Number.isFinite(target.y)) aim = { x: Math.round(target.x), y: Math.round(target.y), tile: true };
    if (live.indexOf(target) < 0) target = _cbNearest(f, live);
    if (aimK === "tile" && !aim) { const q = _cbSq(target); aim = { x: Math.round(q[0]), y: Math.round(q[1]), tile: true }; }
    if (aimK === "foe") aim = target;
    const card = cardBattleCards(f).find(c => c.kind === kind && (kind !== "move" || c.id === id));
    if (!card || (!card.ready && !fire)) return false;
    const aimSq = t => t && t.tile && Number.isFinite(t.x) && Number.isFinite(t.y) ? [Math.round(t.x), Math.round(t.y)] : null;
    const say = w => { _cb.say = { text: (typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "IT") + " · " + w, until: _cbF() + 120 }; _cbRefresh(); return false; };   // (said in the banner for 2 s: words over the world wait while the battle's camera is up, js/drops.js)
    // THE MOVE CARD (§2.56): let go on a free square in its reach, its turn is the walk there (round everyone); anywhere else, nothing is played
    if (kind === "walk") {
        const t = aimSq(dropped), walk = t && _cb.lay ? _cbStepPath(f, t[0], t[1]) : null, G = t && !walk ? _cbGrid(f) : null;
        if (!walk) return say(!t ? "DROP IT ON A SQUARE" : G && (G.taken.has(t[0] + "," + t[1]) || G.k0 === t[0] + "," + t[1]) ? "THAT SQUARE IS TAKEN" : "OUT OF ITS REACH");
        _cb.turn = { who: "act", f, kind, id: null, target: null, t0: _cbF(), hit: 0, fired: false, saved: null, walk, wi: 0, arrived: 0 }; _cb.acted.add(f);
        _cbRefresh(); return true;
    }
    // MOVE NOW, ATTACK LATER (§2.39): it cannot hit that enemy (or reach and see that square) from its square: its turn is a walk towards one it can (the card stays ready); no way nearer, nothing is
    // played. A card played anywhere needs no walk.
    const reachT = aimK === "tile" ? aim : target;
    if (kind !== "ult" && _cb.lay && aimK !== "any" && !_cbCanHit(f, reachT, kind, id)) {
        const walk = _cbWalkPath(f, reachT, kind, id);
        if (!walk) return say("NO WAY THROUGH");
        _cb.turn = { who: "act", f, kind, id: kind === "move" ? id : null, target, t0: _cbF(), hit: 0, fired: false, saved: null, walk, wi: 0, arrived: 0 }; _cb.acted.add(f);
        _cbRefresh(); return true;
    }
    const S = def && _cb.lay && typeof cardShapeFor === "function" ? cardShapeFor(f, kind, id, aimK === "any" ? null : aim) : null;
    if (S && !S.ok) return say(S.why);   // (nothing in its shape to strike: not played, its card still ready)
    const ct = fire ? 0 : _cbChargeTurns(f, kind, id);
    if (ct > 0) {   // (it charges: its turn is over; the attack fires on its own when the charge is done)
        _cb.charge.set(f, { kind, id: kind === "move" ? id : null, target, aim: aimK === "tile" ? aim : aimK === "any" ? null : target, left: ct });
        _cb.acted.add(f); if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: f.x, y: f.y, text: "CHARGING", color: "#ffe733", size: 12, life: 50, vy: -0.03 });
        _cbAfterAct(_cbF()); _cbRefresh(); return true;
    }
    const T = { who: "act", f, kind, id: kind === "move" ? id : null, target, t0: _cbF(), hit: 0, fired: false, saved: { alt: f.alt || null, both: !!f.altBoth }, shape: S };
    if (kind === "move") {
        f.alt = id; f.altBoth = false; f._altWind = 0; f._altLive = null; f._altReadyAt = 0; f._altRest = false; f._altTurn = false;
        if (_cbCools(f, kind)) { let m = _cb.cd.get(f); if (!m) { m = {}; _cb.cd.set(f, m); } m[id] = (card.recharge || 1) + 1; }   // (RECHARGE n TURNS: it sits out your next n turns; the count drops at the start of each of yours, so it shows n on the next)
    } else { f.alt = null; f.altBoth = false; f._altWind = 0; }
    f._nearestEnemy = S && S.main ? S.main : target; f._enemyCacheFrame = 0;
    _cb.turn = T; _cb.acted.add(f);
    if (kind === "ult") {
        const FT = typeof floatingTexts !== "undefined" ? floatingTexts : null, n0 = FT ? FT.length : 0;
        T.fired = S && typeof cardUltFire === "function" ? cardUltFire(f, S, T) : typeof followerUltFire === "function" ? followerUltFire(f) : false;   // (on its shape, its lasting part on the battle's clock: js/cardults.js)
        if (!T.fired) {   // (an Ultimate that does not go off is not played, §2.58: FAULTLINE's opens the drawing of its path, which a turn does not wait for; CONTAMINATION NETWORK needs 2 toxic pods. The drawing called off, its turn and its card still its own)
            const aimed = typeof techAim !== "undefined" && techAim && techAim.f === f; if (aimed && typeof techAimCancel === "function") techAimCancel(true);
            const why = FT ? FT.splice(n0).map(t => t && t.text).filter(Boolean).pop() : null;   // (its own words, NEEDS 2 TOXIC PODS, in the banner: over the world they would wait till the battle is over)
            _cb.turn = T0; _cb.acted.delete(f); f.alt = T.saved.alt; f.altBoth = T.saved.both;
            return say(aimed ? "ITS PATH IS DRAWN: NOT IN A BATTLE YET" : (S && S.why) || why || "IT CANNOT GO OFF HERE");
        }
    }
    if (kind === "move" && S && typeof cardShapeFire === "function") {   // (its move at once, on its shape: §2.48)
        const p0 = [f.x, f.y]; T.fired = cardShapeFire(f, id, S); if (!T.fired) T.failed = true;
        else if (Math.hypot(f.x - p0[0], f.y - p0[1]) > 0.5) { T.anc = [f.x, f.y]; T.px = f.x; T.py = f.y; }   // (carried as it went off, a dash: held where it was carried, not eased back to its square, _cbTether; its square after, _cbResquare: §2.57)
    }
    _cbRefresh(); return true;
}
function _cbActEnd() {
    const T = _cb.turn; if (!T || T.who !== "act") return;
    const f = T.f; if (f && T.saved) { f.alt = T.saved.alt; f.altBoth = T.saved.both; f._altWind = 0; f._altTurn = false; }
}
function _cbFoesTurn(run) {
    const queue = _cb.foes.filter(_cbFoeOk).sort((p, q) => (q.baseMoveSpeed || q.moveSpeed || 0) - (p.baseMoveSpeed || p.moveSpeed || 0));   // fastest first (§2.20)
    _cb.turn = { who: "foe", a: null, t0: _cbF(), hit: 0, queue, run: !!run };
    if (!run) _cbStatusTurn("you");   // (your round over: a turn on the statuses, §2.52)
    if (!run && typeof cardShapeStays === "function") cardShapeStays("foes");   // (each area that stays bites what stands in it, the card's turn over: §2.48)
    if (!run && typeof cardUltWindow === "function" && cardUltWindow()) { _cb.turn.field = _cbF(); _cbRefresh(); return; }   // (an Ultimate's field runs its next turn's worth first, the enemies waiting: §2.64)
    _cbNextFoe();
}
function _cbNextFoe() {
    const T = _cb.turn; if (!T || T.who !== "foe") return;
    const ours = _cbSquad(); if (typeof player !== "undefined" && player && !player.dead) ours.push(player);
    const ok = t => t && !t.dead && !(t.health <= 0) && (typeof predatorPreyOk !== "function" || predatorPreyOk(T.a, t));
    while (T.queue.length) {
        const a = T.queue.shift(); if (!_cbFoeOk(a)) continue;
        T.a = a; const live = ours.filter(ok), lure = !T.run ? _cbLure(a, live) : null, gr = !T.run && !lure ? _cbGrudge(a, live) : null;   // (DRAWN, §2.48: to the card that drew it; else THE FOCUS, §2.46: whoever has hurt it most)
        const prey = lure || gr || (!T.run && _cb.lay ? _cbFront(a, live) : ok(a.currentTarget) && ours.indexOf(a.currentTarget) >= 0 ? a.currentTarget : _cbNearest(a, live));   // (none: THE FRONT LINE, §2.40, the one in front of it; RUN's last hits as before, §2.16)
        if (!prey) continue;
        T.walk = null; T.wi = 0; T.arrived = 0; T.sp = false; T.spOn = false; T.spEnd = 0; T.anc = null; T.lost = 0;
        // HELD BY A STATUS (§2.52): stunned, asleep or frozen, it loses its turn (RUN's last hit too); glitched, it may walk but neither bite nor start its special
        const held = a.frozen ? "FROZEN" : a.asleep > 0 ? "ASLEEP" : a.stunned > 0 ? "STUNNED" : null, glitch = a.glitched > 0;
        if (held) { _cbLose(T, held); return; }
        // MOVE NOW, ATTACK LATER (§2.39): it bites the one in front if it can from its square, or its special goes off from there; else its turn is a walk towards that one
        if (!T.run && _cb.lay && !_cbCanHit(a, prey, "basic")) {
            if (!glitch && _cbSpecialNow(a)) T.sp = true;
            else { const walk = _cbWalkPath(a, prey, "basic"); if (!walk) { if (glitch) { _cbLose(T, "GLITCHED"); return; } continue; } T.walk = walk; }
        } else if (glitch) { _cbLose(T, "GLITCHED"); return; }
        a.currentTarget = prey; a._prey = prey; a.provoked = true; if (a.state === "wander") a.state = "hunt";
        T.t0 = _cbF(); T.hit = 0; _cbRefresh(); return;
    }
    T.a = null;
    if (T.run) { cardBattleEnd(); return; }
    _cbYourTurn(); _cbRefresh();
}
function _cbChargeFire() {   // the follower whose turn it is has its charge done: its attack fires on its own
    const T = _cb.turn; if (!T || T.who !== "you") return false; const f = _cbCurrent(), c = f && _cb.charge.get(f); if (!c || c.left > 0) return false;
    _cb.charge.delete(f); const live = _cb.foes.filter(_cbFoeOk), aim = c.aim && c.aim.tile ? c.aim : (live.indexOf(c.target) >= 0 ? c.target : null);
    if (cardBattlePlay(f, c.kind, c.id, aim, true)) return true;
    _cb.acted.add(f); _cbAfterAct(_cbF()); return true;   // (it could not fire after all: its turn passes)
}
function _cbTurnTick() {
    if (_cb.phase !== "on") return;
    const T = _cb.turn, f0 = _cbF(), C = CARD_BATTLE;
    for (const f of (_cb.squad || [])) if (f && (f.dead || !(f.health > 0))) _cb.out.add(f);   // (down once: out of this battle)
    if (!T) {
        if (!_cb.lay) { _cbLayout(); if (_cbOutside()) { _cb.phase = "black"; _cb.t = f0; _cb.snap = true; return; } }   // (one of yours in another room: the black, and all on their squares in it)
        _cbYourTurn(); _cbRefresh(); return;
    }
    _cbPushes();   // (the pushes and pulls of this frame, on the squares: §2.63)
    _cbSlide();
    _cbHoldUntil();   // (the statuses kept as an end time do not run out in real time: §2.52)
    if (T.who === "you" && _cbChargeFire()) return;   // (a charged attack fires at its follower's turn)
    if (T.who === "you" && !_cb.foes.some(_cbFoeOk) && _cb.foes.some(_cbFoeIn)) {   // (every enemy left is held inside one of yours, ABSOLUTE ZERO, CONSUME: nothing to strike; your squad waits a moment, said in the banner, and the round passes)
        if (!T.heldAt) { T.heldAt = f0; _cb.say = { text: "THEY ARE HELD · YOUR SQUAD WAITS", until: f0 + C.heldWait }; _cbRefresh(); } else if (f0 - T.heldAt >= C.heldWait) _cbFoesTurn(false);
        return;
    }
    if (T.who === "you" && !_cbCurrent() && _cb.foes.some(_cbFoeOk)) { _cbFoesTurn(false); return; }   // (none of yours left to play this round, all charging: the enemies' turn; it waited for ever, §2.55)
    if (T.who === "act" && T.kind === "shoot") { _cbShootTick(T, f0); return; }   // (the Gunslinger's burst, §2.66: the cube is on no walk and under no tether)
    if (T.who === "act" && T.kind === "smash") { _cbSmashTick(T, f0); return; }   // (its SMASH, §2.69: the blow, or the walk towards it)
    if (T.who === "act") {
        const f = T.f, el = f0 - T.t0, live = _cb.foes.some(_cbFoeIn);   // (held inside one of yours, they are still in it: an Ultimate that swallows them all has its turn out, §2.64)
        if (T.walk) { if (_cbWalkTick(T, f) || !live) _cbAfterAct(f0); return; }   // (its walk, §2.39: then the enemies, as after a card)
        if (_cb.lay && !(T.kind === "ult" && T.shape && T.shape.def.kind === "cone")) _cbTether(T, f);   // (WAVE MAKER moves up behind its waves at a walk: not held to its square, its new one after, §2.64)
        if (T.kind === "move" && f._altLive) T.fired = true;
        const landed = T.hit && f0 - T.hit >= C.beat;
        const done = T.kind === "ult" ? (typeof cardUltDone === "function" ? cardUltDone(T, el) : el >= C.ultHold) : T.kind === "basic" ? landed : (T.fired && !f._altLive && el >= C.beat) || (landed && !f._altLive) || (T.failed && el >= C.beat);   // (failed: its move found nothing after all)
        if (done || el >= C.actMax || f.dead || !(f.health > 0) || !live) { _cbActEnd(); _cbResquare(f); _cbAfterAct(f0); }
    } else if (T.who === "foe") {
        const a = T.a;
        if (T.field) { if (f0 - T.field >= C.fieldMax || !(typeof cardUltLive === "function" && cardUltLive())) { T.field = 0; _cbNextFoe(); } return; }   // (THE FIELDS' TURN'S WORTH first, as the enemies' turn begins: §2.64)
        if (T.lost) { if (f0 - T.lost >= C.beat * 2) _cbNextFoe(); return; }   // (its turn lost to a status: the banner says so a moment, §2.52)
        if (T.walk) { if (_cbWalkTick(T, a)) _cbNextFoe(); return; }
        if (a && !T.run && _cb.lay) _cbTether(T, a);
        if (T.sp && a) { const busy = a.abilityPhase === "winding" || a.abilityPhase === "active"; if (busy) T.spOn = true; else if (!T.spEnd && (T.spOn || f0 - T.t0 > 30)) T.spEnd = f0; }   // (a turn for its special: over once it has gone off and missed)
        if (!a || !_cbFoeOk(a) || (T.hit && f0 - T.hit >= C.beat) || f0 - T.t0 >= C.foeMax || (T.spEnd && !T.hit && f0 - T.spEnd >= C.beat)) { if (a && !T.run) _cbResquare(a); _cbNextFoe(); }
    }
}
function _cbRefresh() { if (_cbEls) _cbEls.at = -1e9; }
// the camera's direction lined up: across the line, from the side chosen (L.dir) or the nearer turn, turned `skew` towards your side (the side the line's -u points to)
function _cbCamDir(L) {
    const base = L.dir !== undefined ? L.dir : Math.atan2(L.ux, -L.uy), k = CARD_BATTLE.skew * Math.PI / 180;
    for (const d of [base + k, base - k]) if (Math.cos(d) * -L.ux + Math.sin(d) * -L.uy > 0) return d;
    return base;
}
// everyone in the battle (its creatures still up, your squad still up, you): the 3D view keeps them in sight (view3d/gameview.js seeThrough)
function cardBattleFighters() { if (_cb.phase === "off") return []; const out = _cb.foes.filter(_cbFoeOk).concat(_cbSquad()); if (typeof player !== "undefined" && player) out.push(player); return out; }
// THE CAMERA, for the 3D view (view3d/gameview.js): null out of a battle; else how far in (k, eased), where it looks, how low, how turned, how near
function cardBattleCam() {
    if (_cb.k <= 0.0001) return null;
    const L = _cb.lay;   // (lined up: it looks across the line, from one side or the other, whichever is the nearer turn: view3d/gameview.js)
    let x = _cb.cx, y = _cb.cy;
    if (L) {   // (the fight in the middle of the screen above the cards: the camera's aim moved towards it by half the band's height, on the floor)
        const dir = _cbCamDir(L), z = L.zoom || CARD_BATTLE.zoom;
        const band = _cbEls && _cbEls.band && _cbEls.band.getBoundingClientRect ? _cbEls.band.getBoundingClientRect().height : 250, r = typeof canvas !== "undefined" && canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
        const px = band / 2 * (r && r.width ? canvas.width / r.width : 1), t = px / ((typeof TILE_W !== "undefined" ? TILE_W : 60) * Math.SQRT2 * z * Math.sin(CARD_BATTLE.pitch * Math.PI / 180));
        if (Number.isFinite(t)) { x += Math.cos(dir) * t * CARD_BATTLE.raise; y += Math.sin(dir) * t * CARD_BATTLE.raise; }
    }
    return { k: _cbSmooth(_cb.k), x, y, pitch: CARD_BATTLE.pitch * Math.PI / 180, yaw: CARD_BATTLE.yaw, zoom: L && L.zoom ? L.zoom : CARD_BATTLE.zoom, dir: L ? _cbCamDir(L) : undefined, side: !!L && L.dir !== undefined };
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
    // THE BATTLE SCREEN (step 2, build 2026-11-17l; §2.9 SQUAD ROWS): the enemy list at the top right (their names and health; not their next moves, §2.15) with RUN under it, and the band along
    // the bottom, a column for each member of the squad (cardBattleScreen fills them)
    const scr = document.createElement("div"); scr.id = "cbScreen"; scr.setAttribute("aria-label", "Battle");
    scr.innerHTML = '<div class="cb-turn"></div><div class="cb-foes"><h4>ENEMIES</h4><div class="cb-foelist"></div></div><div class="cb-band"><div class="cb-row"></div></div>';
    const run = document.createElement("button"); run.id = "cbRun"; run.type = "button"; run.textContent = "RUN"; run.setAttribute("aria-label", "Run from the battle");
    run.addEventListener("click", ev => { ev.preventDefault(); ev.stopPropagation(); cardBattleRun(); });
    scr.querySelector(".cb-foes").appendChild(run);
    document.body.appendChild(black); document.body.appendChild(scr); _cbEls = { black, run, scr, foes: scr.querySelector(".cb-foelist"), row: scr.querySelector(".cb-row"), turn: scr.querySelector(".cb-turn"), band: scr.querySelector(".cb-band"), sig: "", at: -1e9 };
    // STEP 3, THE DRAG (§2.17): a ready card, on your turn, is pressed, dragged out of the band and let go over an enemy; let go over the band, it goes back
    const row = _cbEls.row; if (row && row.addEventListener) row.addEventListener("pointerdown", _cbDragStart);   // (the move and the let-go are the page's while a drag is on: the band's cards are rebuilt as health changes, so the pressed one may be gone)
    return _cbEls;
}
function _cbButtons() { _cbMake(); _cbDom(); }
function _cbDom() {
    const E = _cbEls || (_cb.phase !== "off" ? _cbMake() : null); if (!E) return; const o = _cb.black.toFixed(3); if (E.black.style.opacity !== o) E.black.style.opacity = o;
    const on = cardBattleShown(), body = typeof document !== "undefined" && document.body;
    if (body && body.classList && body.classList.contains("cb-on") !== on) body.classList.toggle("cb-on", on);   // (game.html: the battle screen shown, the rest of the HUD out of the way)
    if (on && _cbF() - E.at >= CARD_BATTLE.every) { E.at = _cbF(); cardBattleScreen(); }
}
// ── THE BATTLE SCREEN'S CARDS (§2.9, §2.18, §2.19, §2.21, §2.22, §2.25): each member's own BASIC ATTACK (always ready), each second attack it may use (ready, or the turns until it is; its
// recharge from its wait time, CARD_BATTLE.turnSec a turn), and its Ultimate (by its meter, §2.11). Their names and effect lines are the game's own (js/moves.js MOVES, js/unitinfo.js
// MOVE_INFO, SHOT_INFO, the Ultimate's note): nothing is written for the cards. Step 2 shows them; playing them (dragging one onto an enemy, §2.17) and the turns are step 3. ──
function _cbTurns(sec) { return Math.max(1, Math.ceil((sec || 0) / CARD_BATTLE.turnSec - 1e-9)); }
function _cbRow(rows, key) { const r = (rows || []).find(x => x[0] === key); return r ? String(r[1]) : ""; }
function _cbInfoRows(table, name) { try { const fn = table && table[name]; return typeof fn === "function" ? fn() : null; } catch (e) { return null; } }
// THE ATTACK CARDS' PICTURES (ATTACK-CARD-ART.md; the owner, 2026-11-17: "begin incorporating the cards that have been created for the attacks", asked, "Pictures where they exist"; 2026-11-18,
// of the twenty approved ones that had stayed on the art's branch, "What happened to my attack cards?", and, asked whether to bring them in: "Yes"): every evolved form's approved picture, by the
// form and the move it shows (img/cards/attack/<form>_<move>.png, each the approved draft as it is: ATTACK-CARD-ART.md §4). A form's other second attack keeps its plain face (no picture drawn).
// The Hammer Slug's shows no attack of its own (the Technicians' style: rearing in its ring of crystals): on SHELL GUARD, its stance, the agent's reading. CHOMP's is round 3, his redesigned model.
const CARD_BATTLE_ART = {};
for (const k of ["embercowl:hexfire", "maw:chomp", "hammerslug:shell_guard", "thunderhead:static_vortex", "quillstone:ember_slash", "hammerslug:blade_roll", "coralcrab:stake_ring", "voidstar:maelstrom", "seeper:toxic_stomp",
    "igloo:skate_charge", "rimestar:icicle_volley", "electroskink:zigzag_dash", "thermite:magma_vent", "mimic:rift_impale", "hornshell:echo_pulse", "staticorb:static_rush", "gooproxy:phase_swap",
    "shrub:briar_sweep", "sundew:sweet_scent", "rotshard:rotten_decoy", "jellyram:wobble_slam", "blightspider:venom_bite", "hovershell:shock_zap"]) CARD_BATTLE_ART[k] = "img/cards/attack/" + k.replace(":", "_") + ".png";
function _cbArt(f, id) { const p = f && id ? CARD_BATTLE_ART[f.evolved + ":" + id] : null; return p ? (typeof imgSrc === "function" ? imgSrc(p) : p) : null; }
function cardBattleCards(f) {
    if (typeof player !== "undefined" && f === player) return _cbYouCards();   // (the Gunslinger's own: SHOOT and HOLD FIRE, §2.66)
    const out = [], d = typeof evolvedDef === "function" ? evolvedDef(f) : null, col = _cbCol(f);
    { const named = d && (d.shot || d.hit) ? (d.shot || d.hit) : null, rows = named && typeof SHOT_INFO !== "undefined" ? _cbInfoRows(SHOT_INFO, named) : null;
      out.push({ kind: "basic", tag: "BASIC ATTACK", name: named || "BASIC ATTACK", fx: _cbRow(rows, "EFFECT") || "Its everyday hit.", ready: true, turns: 0, col }); }
    const md = typeof followerMoveDef === "function" ? followerMoveDef(f) : null, ids = md && typeof evoMoveIds === "function" ? evoMoveIds(md).filter(id => typeof evoMoveAllowed !== "function" || evoMoveAllowed(f, md, id)) : [];
    const f0 = _cbF(), cools = typeof altCools === "function" && altCools(f);
    for (const id of ids) {
        const m = typeof MOVES !== "undefined" ? MOVES[id] : null; if (!m) continue;
        const rows = typeof MOVE_INFO !== "undefined" ? _cbInfoRows(MOVE_INFO, m.name) : null, rech = _cbTurns(m.manual && typeof CAP_MAX !== "undefined" ? m.windup * CAP_MAX : m.windup);   // (CAPACITOR DISCHARGE: a full release in a battle, js/cardshapes.js; its wait, a full charge's time)
        if (_cb.turn) { const t = _cbCdLeft(f, id); out.push({ kind: "move", id, tag: "ATTACK", name: m.name, fx: _cbRow(rows, "EFFECT"), ready: t <= 0, turns: t, recharge: rech, col }); continue; }   // (the turns: its RECHARGE counted in turns)
        const left = cools ? Math.max(0, ((f._altReadyAt || 0) - f0) / 60) : 0;
        out.push({ kind: "move", id, tag: "ATTACK", name: m.name, fx: _cbRow(rows, "EFFECT"), ready: left <= 0, turns: left > 0 ? _cbTurns(left) : 0, recharge: rech, col });
    }
    const u = typeof followerUltimate === "function" ? followerUltimate(f) : null;
    if (u) { const pct = Math.max(0, Math.min(100, Math.round(f.ultimateCharge || 0)));
        let fx = ""; try { const I = typeof unitInfo === "function" ? unitInfo(f) : null, a = I && (I.attacks || []).find(x => x && typeof x.h === "string" && x.h.indexOf("ULTIMATE") === 0); fx = a && a.note ? a.note : ""; } catch (e) {}
        out.push({ kind: "ult", tag: "ULTIMATE", name: String(u.name || "").toUpperCase(), fx, ready: pct >= 100, charge: pct, col }); }
    for (const c of out) if (c.kind === "move") { const a = _cbArt(f, c.id); if (a) c.art = a; }
    for (const c of out) { c.chargeT = _cbChargeTurns(f, c.kind, c.id); if (c.kind === "move" && !_cbCools(f, "move")) c.recharge = 0; }   // (by class: a Mage's charge, a Brawler's cooldown, a Technician's both)
    for (const c of out) { const say = typeof cardShapeSays === "function" ? cardShapeSays(f, c.kind, c.id) : null; if (say) c.fx = say; else if (c.kind === "ult") c.fx = String(c.fx || "").replace(/\s*When it is fully charged[^]*$/, ""); }   // (A CARD'S WORDS IN A BATTLE, §2.58: its squares and its effects in turns, js/cardshapes.js; an Ultimate's without the real time's tap)
    { const n = _cbTiles(f); out.push({ kind: "walk", tag: "MOVE", name: "MOVE", fx: "Drop it on a square: it walks there, up to " + n + (n === 1 ? " square" : " squares") + ", round everyone.", ready: n > 0, tiles: n, col }); }   // (THE MOVE CARD, §2.56: always ready while it has a pace)
    if (_cb.turn && (_cb.turn.who === "you" || _cb.turn.who === "act") && _cb.acted && _cb.acted.has(f)) for (const c of out) { c.ready = false; c.done = true; }   // (it has had its card this round)
    return out;
}
function _cbCol(f) { const e = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(x => x.id === f.element) : null; return f.isClone && typeof PARTY_CLONE_COL !== "undefined" ? PARTY_CLONE_COL : e ? e.color : "#19e6c1"; }
const _cbEsc = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function _cbCardHTML(c) {
    const st = c.done ? "DONE" : c.kind === "shoot" ? (c.ready ? "AMMO " + c.ammo : "NO AMMO") : c.kind === "ult" ? (c.ready ? "READY" : c.charge + "%") : c.ready ? "READY" : c.kind === "walk" ? "NO PACE" : c.turns + (c.turns === 1 ? " TURN" : " TURNS");   // (SHOOT shows the ammunition on its foot: §2.66, the owner: "shows the ammo [...] the bottom")
    const tn = n => n + (n === 1 ? " TURN" : " TURNS"), rc = [c.chargeT > 0 ? "CHARGE " + tn(c.chargeT) : "", c.kind === "move" && c.recharge > 0 ? "RECHARGE " + tn(c.recharge) : ""].filter(Boolean).join(" · ");
    const meta = c.kind === "ult" ? '<i class="cb-meter"><u style="width:' + c.charge + '%"></u></i>' : c.kind === "walk" ? '<i class="cb-rc">UP TO ' + c.tiles + (c.tiles === 1 ? " SQUARE" : " SQUARES") + '</i>' : rc ? '<i class="cb-rc">' + rc + '</i>' : "";
    return '<div class="cb-card cb-' + c.kind + (c.ready ? " ready" : " wait") + (c.done ? " done" : "") + (c.art ? " art" : "") + '" data-kind="' + c.kind + '" data-id="' + _cbEsc(c.id || "") + '" style="--k:' + (c.kind === "ult" ? "#ffcc44" : c.col) + '">' + (c.art ? '<i class="cb-art" style="background-image:url(\'' + _cbEsc(c.art) + '\')"></i>' : "") + '<i class="cb-tag">' + _cbEsc(c.tag) + '</i><b class="cb-nm">' + _cbEsc(c.name) + '</b><span class="cb-fx">' + _cbEsc(c.fx) + '</span>' + meta + '<span class="cb-st">' + _cbEsc(st) + '</span></div>';
}
// fills the screen: the enemy list and the band's columns, rebuilt when what they show has changed (a signature), the portraits drawn once a column
function cardBattleScreen() {
    const E = _cbEls; if (!E || !E.scr) return;
    const foes = _cb.foes.filter(a => a && !a.dead && a.health > 0), all = _cb.squad ? _cb.squad.slice() : _cbSquadNow(), cur = _cbCurrent(), T0 = _cb.turn, you = _cbYouIn() ? player : null;
    if (you) all.push(you);   // (the Gunslinger has its turn after them, §2.66: its chip last, its cards in the pop-up at its turn)
    // (one at a time: the pop-up holds the follower whose turn it is; out of your turn it is away, still holding the last one, so it does not flicker)
    if (cur) E.popF = cur; const shown = E.popF && all.indexOf(E.popF) >= 0 ? E.popF : (all.find(_cbAlive) || null), squad = shown ? [shown] : [];
    const chips = '<div class="cb-chips">' + all.map(f => f === you ? '<i class="cb-chip ' + (_cb.youActed && T0 ? "done" : f === shown ? "now" : "next") + '">YOU</i>' : '<i class="cb-chip ' + (!_cbAlive(f) ? "down" : _cb.charge.has(f) ? "charge" : _cb.acted.has(f) && T0 ? "done" : f === shown ? "now" : "next") + '">' + _cbEsc(typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "") + '</i>').join("") + '</div>';
    const fh = foes.map(a => { const k = Math.max(0, Math.min(1, a.health / (a.maxHealth || 1))); return '<div class="cb-foe"><b>' + _cbEsc(typeof targetName === "function" ? targetName(a) : "ENEMY") + '</b><span class="cb-hp">' + Math.max(0, Math.round(a.health)) + "/" + Math.round(a.maxHealth || 0) + '</span><i class="cb-bar"><u style="width:' + Math.round(k * 100) + '%"></u></i></div>'; }).join("");
    if (E.foes._h !== fh) { E.foes._h = fh; E.foes.innerHTML = fh; }
    const cols = squad.map(f => { if (f === you) {   // (the cube's own column: its bars as its health, its gun and its level, its two cards)
            const mx = typeof PLAYER_HITS === "number" ? PLAYER_HITS : 3, hp = Math.max(0, Math.min(mx, typeof health === "number" ? health : mx)), W = typeof weaponDef === "function" ? weaponDef() : null, col = typeof classColour === "function" ? classColour(playerClassKey) : "#ffb347";
            return { f, you: true, key: "you|" + (W ? W.id : ""), html: '<div class="cb-head"><canvas class="cb-pt" width="52" height="52"></canvas><div class="cb-hw"><b class="cb-name">YOU</b><i class="cb-sub">' + _cbEsc((typeof className === "function" ? className(playerClassKey) : "GUNSLINGER") + (W ? " · " + W.name + " LV " + (typeof weaponLevelOf === "function" ? weaponLevelOf(W.id) : 1) : "")) + '</i><i class="cb-hbar"><u style="width:' + Math.round(hp / mx * 100) + '%"></u></i></div><span class="cb-hpn">' + hp + "/" + mx + '</span></div><div class="cb-cards">' + cardBattleCards(f).map(_cbCardHTML).join("") + '</div>', col, down: false }; }
        const down = !_cbAlive(f), hp = Math.max(0, Math.round(f.health || 0)), mx = Math.round(f.maxHealth || 0), k = mx ? Math.max(0, Math.min(1, hp / mx)) : 0;
        const nm = typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER", cards = down ? [] : cardBattleCards(f);
        return { f, key: (f.uid || nm) + "|" + f.evolved + "|" + f.element, html: '<div class="cb-head"><canvas class="cb-pt" width="52" height="52"></canvas><div class="cb-hw"><b class="cb-name">' + _cbEsc(nm) + '</b><i class="cb-sub">LV ' + (f.level || 1) + (_cbTank(f) ? " · TANK" : "") + (down ? " · DOWN" : "") + '</i><i class="cb-hbar"><u style="width:' + Math.round(k * 100) + '%"></u></i></div><span class="cb-hpn">' + hp + "/" + mx + '</span></div><div class="cb-cards">' + cards.map(_cbCardHTML).join("") + '</div>', col: _cbCol(f), down }; });
    { const T = _cb.turn, nm = a => a ? (a === player ? "YOU" : typeof unitTypeLabel === "function" && _cbMine(a) ? unitTypeLabel(a) : typeof targetName === "function" ? targetName(a) : "") : "";
      const mv = T && T.lost ? " · " + T.lostWord : T && T.walk ? " · MOVES " + T.walk.length + (T.walk.length === 1 ? " TILE" : " TILES") : "";   // (a walk instead of its card or its bite: §2.39; a turn lost to a status: §2.52)
      const txt = !T ? "" : T.who === "you" ? (_cb.say && _cbF() < _cb.say.until ? _cb.say.text : "YOUR TURN · " + (() => { const n = _cbSquad().filter(f => !_cb.acted.has(f)).length + (_cbYouTurn() ? 1 : 0); return n > 1 ? n + " TO PLAY" : "DRAG A CARD ONTO THE FIGHT"; })()) : T.who === "act" ? nm(T.f) + (mv || " · " + (T.kind === "shoot" ? "SHOOT" : T.kind === "smash" ? "SMASH" : T.kind === "ult" ? "ULTIMATE" : T.kind === "move" && typeof MOVES !== "undefined" && MOVES[T.id] ? MOVES[T.id].name : "BASIC ATTACK")) : T.run ? "RUNNING · " + nm(T.a) + "'S LAST HIT" : T.field && typeof cardUltBanner === "function" ? cardUltBanner() : "ENEMY TURN · " + nm(T.a) + mv;
      if (E.turn && E.turn._t !== txt) { E.turn._t = txt; E.turn.textContent = txt; if (E.turn.classList) E.turn.classList.toggle("yours", !!T && T.who === "you"); }
      if (E.scr.classList) E.scr.classList.toggle("yours", !!T && T.who === "you");
      if (E.run) E.run.disabled = !!T && T.who !== "you"; }
    for (const c of cols) c.html = chips + c.html;
    { const away = !(T0 && T0.who === "you" && cur), key = shown ? (shown === you ? "you" : shown.uid || "") + "|" + (_cb.round || 0) + "|" + _cb.acted.size : "";
      if (E.band && E.band.classList) { E.band.classList.add("cb-pop"); E.band.classList.toggle("away", away);
        if (!away && E.popKey !== key) { E.popKey = key; E.band.classList.remove("swap"); void E.band.offsetWidth; E.band.classList.add("swap"); } } }   // (a new follower's turn: it switches in)
    const sig = cols.map(c => c.key + c.html).join("§");
    if (E.sig === sig) return; E.sig = sig;
    const old = Array.from(E.row.children || []);
    cols.forEach((c, i) => {
        let el = old[i]; if (!el) { el = document.createElement("div"); el.className = "cb-col"; E.row.appendChild(el); }
        const keep = el._key === c.key ? el.querySelector(".cb-pt") : null;
        el.innerHTML = c.html; el._key = c.key; el._f = c.f; if (el.style && typeof el.style.setProperty === "function") el.style.setProperty("--c", c.col); if (el.classList) el.classList.toggle("down", c.down);
        const cv = el.querySelector(".cb-pt"); if (keep && cv && keep.width) { cv.getContext && cv.getContext("2d") && cv.getContext("2d").drawImage(keep, 0, 0); } else if (cv && c.you) { try { _cbYouThumb(cv, c.col); } catch (e) {} } else if (cv && typeof _ccThumb === "function") { try { _ccThumb(cv, c.f); } catch (e) {} }
    });
    for (let i = cols.length; i < old.length; i++) old[i].remove();
}
let _cbDrag = null;
function _cbDragStart(ev) {
    const card = ev.target && ev.target.closest ? ev.target.closest(".cb-card") : null, col = card && card.closest(".cb-col"), f = col && col._f, T = _cb.turn;
    if (!card || !f || !T || T.who !== "you" || !card.classList.contains("ready")) return;
    ev.preventDefault(); ev.stopPropagation(); _cbDragCancel();
    // (the owner, 2026-11-17: "the cards that get dragged need to get smaller and tile sized": picked up, it shrinks to a floor tile as the picture shows one, under the finger)
    const r = card.getBoundingClientRect(), g = card.cloneNode(true), t = _cbTilePx(), w = t, h = Math.round(t * 1.3); g.classList.add("cb-ghost");
    g.style.cssText = "position:fixed;left:" + r.left + "px;top:" + r.top + "px;width:" + r.width + "px;height:" + r.height + "px;z-index:70;pointer-events:none;--k:" + (card.style.getPropertyValue ? card.style.getPropertyValue("--k") : "");
    const shrink = () => { const D = _cbDrag; if (!D || D.g !== g) return; g.style.left = (ev.clientX - w / 2) + "px"; g.style.top = (ev.clientY - h - CARD_BATTLE.dragUp) + "px"; g.style.width = w + "px"; g.style.height = h + "px"; };
    if (typeof requestAnimationFrame === "function") requestAnimationFrame(shrink); else setTimeout(shrink, 0);   // (it is seen shrinking from the card to a tile)
    (_cbEls.scr || document.body).appendChild(g); card.classList.add("lifted");   // (in the battle screen, so it keeps the card's look)
    _cbDrag = { f, kind: card.dataset.kind, id: card.dataset.id || null, g, card, dx: w / 2, dy: h / 2, up: h / 2 + CARD_BATTLE.dragUp, foe: null, aim: null, col: (card.style.getPropertyValue ? card.style.getPropertyValue("--k") : "") || "#19e6c1" };
    _cbDrag.pid = ev.pointerId;
    if (typeof window !== "undefined" && window.addEventListener) { window.addEventListener("pointermove", _cbDragMove, true); window.addEventListener("pointerup", _cbDragEnd, true); window.addEventListener("pointercancel", _cbDragCancel, true); }
}
// the enemy of the battle under a point of the screen: where the 3D view draws it (its battle camera is lower and turned, so the 2D's own reckoning would miss), else the 2D's (findEnemyAtScreen)
// a floor tile's width on the page, as the 3D view draws one at the middle of the fight (screen points; 56 without the view)
function _cbTilePx() {
    const V = typeof VIEW3D !== "undefined" && VIEW3D.showing && VIEW3D.view && typeof VIEW3D.view.screenOf === "function" ? VIEW3D.view : null;
    if (!V || typeof canvas === "undefined" || !canvas.getBoundingClientRect) return CARD_BATTLE.tileCard;
    try { const r = canvas.getBoundingClientRect(), k = r.width / (canvas.width || 1), a = V.screenOf(_cb.cx, _cb.cy, 0), b = V.screenOf(_cb.cx + 1, _cb.cy, 0), c = V.screenOf(_cb.cx, _cb.cy + 1, 0);
        const px = Math.max(Math.hypot(b[0] - a[0], b[1] - a[1]), Math.hypot(c[0] - a[0], c[1] - a[1])) * k; return Number.isFinite(px) ? Math.max(44, Math.min(72, Math.round(px * 0.8))) : CARD_BATTLE.tileCard; } catch (e) { return CARD_BATTLE.tileCard; }
}
function _cbDragFoe(ev) {
    if (typeof toCanvas !== "function") return null;
    const p = toCanvas(ev.clientX, ev.clientY), V = typeof VIEW3D !== "undefined" && VIEW3D.showing && VIEW3D.view && typeof VIEW3D.view.screenOf === "function" ? VIEW3D.view : null;
    if (V) {
        const r = typeof canvas !== "undefined" && canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null, k = r && r.width ? canvas.width / r.width : 1, R = CARD_BATTLE.pick * k;
        let best = null, bd = Infinity;
        for (const a of _cb.foes) { if (!_cbFoeOk(a)) continue; let q; try { q = V.screenOf(a.x, a.y, CARD_BATTLE.pickH); } catch (e) { continue; } const d = Math.hypot(q[0] - p[0], q[1] - p[1]) - (a.bodyR || 0) * 40 * k; if (d < R && d < bd) { bd = d; best = a; } }
        return best;
    }
    if (typeof findEnemyAtScreen !== "function") return null;
    const a = findEnemyAtScreen(p[0], p[1]); return a && _cb.foes.indexOf(a) >= 0 && _cbFoeOk(a) ? a : null;
}
function _cbOverBand(ev) { const b = _cbEls && _cbEls.band && _cbEls.band.getBoundingClientRect ? _cbEls.band.getBoundingClientRect() : null; return !!b && ev.clientY >= b.top; }
// what a card dragged to this point of the screen is let go on (§2.48, js/cardshapes.js): an enemy under it; for a blast or the decoy, that enemy's square or the floor square under it; for a ring
// or a move needing no target, anywhere (true); over the band, nothing
// THE ENEMY'S SQUARE LIT (the owner, 2026-11-18: "whenever you are dragging a tile or a card to an enemy, it lights up the tile that the enemy is on"): while a card is dragged over an enemy of the
// battle (over its body as the 3D view draws it, or over the floor square it stands on), that square glows on the floor, pulsing, with a bright rim, under the enemy and its corners.
function _cbFoeOnTileAt(ev) {
    const V = typeof VIEW3D !== "undefined" && VIEW3D.showing && VIEW3D.view ? VIEW3D.view : null;
    if (!V || typeof toCanvas !== "function" || typeof cardShapeTileAt !== "function") return null;
    const p = toCanvas(ev.clientX, ev.clientY), t = cardShapeTileAt(p[0], p[1], V); if (!t) return null;
    for (const a of _cb.foes) { if (!_cbFoeOk(a)) continue; const q = _cbSq(a); if (Math.round(q[0]) === t.x && Math.round(q[1]) === t.y) return a; }
    return null;
}
function _cbFoeTileDraw(V) {
    const D = typeof _cbDrag !== "undefined" ? _cbDrag : null, a = D && D.foe; if (!a || !_cbFoeOk(a) || typeof V.screenNow !== "function" || typeof ctx === "undefined") return;
    const q = _cbSq(a), x = Math.round(q[0]), y = Math.round(q[1]), h = 0.48, P = [[x - h, y - h], [x + h, y - h], [x + h, y + h], [x - h, y + h]].map(c => V.screenNow(c[0], c[1], 0));
    if (!P.every(c => Number.isFinite(c[0]) && Number.isFinite(c[1]))) return;
    const path = () => { ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.closePath(); }, pulse = 0.5 + 0.5 * Math.sin(_cbF() * 0.2);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineJoin = "round";
    path(); ctx.globalAlpha = 0.38 + 0.22 * pulse; ctx.fillStyle = "#ffe733"; ctx.fill();
    path(); ctx.globalAlpha = 1; ctx.strokeStyle = "rgba(5,8,16,0.8)"; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = "#fff6b0"; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
}
function _cbDragAim(D, ev) {
    if (_cbOverBand(ev)) { D.foe = null; return null; }   // (back over the cards: nothing aimed, no square lit)
    const foe = _cbDragFoe(ev) || _cbFoeOnTileAt(ev), def = D.kind !== "walk" && typeof cardShapeDef === "function" ? cardShapeDef(D.f, D.kind, D.id) : null, k = D.kind === "walk" ? "tile" : def ? cardShapeAim(def) : "foe";
    D.foe = D.kind === "walk" || D.kind === "pass" ? null : foe;   // (a MOVE card aims at no enemy: its square is taken, shown red, not lit gold: §2.56; HOLD FIRE at none, §2.66)
    if (D.kind === "pass") return true;
    if (k === "foe") return foe;
    if (k === "any") return true;
    if (foe) { const q = _cbSq(foe); return { x: Math.round(q[0]), y: Math.round(q[1]), tile: true }; }
    const V = typeof VIEW3D !== "undefined" && VIEW3D.showing && VIEW3D.view ? VIEW3D.view : null;
    if (!V || typeof toCanvas !== "function" || typeof cardShapeTileAt !== "function") return null;
    const p = toCanvas(ev.clientX, ev.clientY); return cardShapeTileAt(p[0], p[1], V);
}
function _cbDragMove(ev) {
    const D = _cbDrag; if (!D || (D.pid !== undefined && ev.pointerId !== D.pid)) return; ev.preventDefault(); ev.stopPropagation();
    D.g.style.left = (ev.clientX - D.dx) + "px"; D.g.style.top = (ev.clientY - D.dy - (D.up || 0)) + "px";   /* (it rides just above the finger: the enemy and its lit square under the finger stay in sight) */ D.g.style.width = (D.dx * 2) + "px"; D.g.style.height = (D.dy * 2) + "px";
    D.aim = _cbDragAim(D, ev); D.g.classList.toggle("on", !!D.aim);   // (its squares are lit while it is over the fight: js/cardshapes.js cardShapeDraw)
}
function _cbDragEnd(ev) {
    const D = _cbDrag; if (!D || (D.pid !== undefined && ev.pointerId !== D.pid)) return; ev.preventDefault(); ev.stopPropagation();
    const aim = _cbDragAim(D, ev), off = !_cbOverBand(ev);
    _cbDragCancel();
    if (off || D.kind === "pass") cardBattlePlay(D.f, D.kind, D.id, aim === true ? null : aim);   // (let go over the fight: on what is under it, else the nearest enemy to the follower: §11.4; HOLD FIRE, §2.66, is played by a tap too)
}
function _cbDragCancel() { const D = _cbDrag; if (!D) return; _cbDrag = null;
    if (typeof window !== "undefined" && window.removeEventListener) { window.removeEventListener("pointermove", _cbDragMove, true); window.removeEventListener("pointerup", _cbDragEnd, true); window.removeEventListener("pointercancel", _cbDragCancel, true); } if (D.g && D.g.remove) D.g.remove(); if (D.card && D.card.classList) D.card.classList.remove("lifted"); }
// the cube's picture in its column's head: its monitor face in its class's colour (a small glyph: the 3D cube itself stands in the fight)
function _cbYouThumb(cv, col) {
    const g = cv.getContext && cv.getContext("2d"); if (!g) return; const w = cv.width, h = cv.height; g.clearRect(0, 0, w, h);
    g.fillStyle = "#0b1226"; g.strokeStyle = col || "#ffb347"; g.lineWidth = 3; g.beginPath(); if (g.roundRect) g.roundRect(w * 0.14, h * 0.16, w * 0.72, h * 0.6, 6); else g.rect(w * 0.14, h * 0.16, w * 0.72, h * 0.6); g.fill(); g.stroke();
    g.fillStyle = "#3dffb0"; g.fillRect(w * 0.28, h * 0.42, w * 0.16, h * 0.07); g.fillRect(w * 0.56, h * 0.42, w * 0.16, h * 0.07);   // (its two eyes)
    g.fillStyle = col || "#ffb347"; g.fillRect(w * 0.4, h * 0.78, w * 0.2, h * 0.08);   // (its neck)
}
function cardBattleReset() { _cb.youActed = false; _cb.shooting = false; _cb.snap = false; if (typeof cardShapeStays === "function") cardShapeStays("end"); if (typeof cardUltEnd === "function") cardUltEnd(); _cbActEnd(); _cb.turn = null; _cb.pushQ = []; _cb.grudge = new Map(); _cb.cd.clear(); _cb.round = 0; if (_cb.acted) _cb.acted.clear(); if (_cb.charge) _cb.charge.clear(); _cb.slots = new Map(); _cb.lay = null; _cb.squad = null; _cb.out = new Set(); _cb.phase = "off"; _cb.foes = []; _cb.k = 0; _cb.black = 0; _cb.target = null; _cbDom(); }
