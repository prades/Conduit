// ─────────────────────────────────────────────────────────
//  THE FORMATION — the squad's places round you while it follows you
// ─────────────────────────────────────────────────────────
// The owner, 2026-11-10: "make it to where it feels more structured with the fights ... a formation function, and it will basically put the brawlers in front of the player and whatever
// they're looking at, and it will put the mage behind the player where there's some distance, and it will put the technician constantly patrolling the area around the player". Of the
// agent's questions: "Always while following", "Fight from their places", "Locked enemy, else your way".
//   BRAWLERS     ahead of you, FORMATION.front tiles, side by side across the front (FORMATION.spread apart); they go out to meet what comes and come back to it (js/npc.js)
//   MAGES        behind you, FORMATION.back tiles, side by side; they shoot from there at an enemy within FORMATION.mageRange and move only to see one (js/npc.js)
//   TECHNICIANS  beside you, FORMATION.side tiles out across the way ahead, the first on your right, a second on your left, more a little farther out (FORMATION.spread); they hit what
//                comes within their reach and go back to their place (the owner, 2026-11-27: "The technicians are still in this thing where they rotate around the player. You don't need to do
//                that. You can just have them sit to the side of the player and protect them." Till then they circled you, FORMATION.ring tiles out: superseded)
// "Ahead" is toward the enemy you have locked (js/targeting.js targetCurrent), else the way you last walked (kept while you stand). A place in a wall, or out of your sight, is pulled in
// toward you. Only a follower that is following you takes a place: HOLD, a posted room, an order, a clone and the way home to the Crystal are as they were. The numbers are the agent's,
// provisional (docs/OPEN-QUESTIONS.md).
// The natural traits (js/traits.js) nudge a place rather than undo it (every follower has one of the two): a LONE WOLF stands FORMATION.loneWolf tiles farther out than its place, an EMPATHETIC one
// FORMATION.empathetic of the way nearer you, the squad's middle (js/npc.js followPlayer; away from the formation, 4 tiles out and a 60% lean to its allies, as before).
const FORMATION = { front: 1.8, back: 3, side: 1.6, spread: 1.2, mageRange: 8, stop: 0.35, every: 6, loneWolf: 1.2, empathetic: 0.25 };
const _fmFace = { x: 1, y: 0, px: null, py: null, at: -1 };
const _fmGroups = { at: -1, brawler: [], sniper: [], camper: [] };

// its place's kind: a hybrid stands with the brawlers, as it fights like one (js/npc.js)
function formationRole(f) { const r = f && f.role; return r === "sniper" || r === "camper" ? r : "brawler"; }
// whether it takes a place now: a follower following you, nothing else
function formationFollowing(f) {
    return !!f && !f.dead && f.isFollower === true && !f.isClone && f.team === "green" && !f.returningToCrystal && !f.post && !f.job && (f.stance || "follow") === "follow";
}
// the way ahead (a unit vector): toward the locked enemy, else the way you last walked
function formationFront() {
    const f0 = typeof frame !== "undefined" ? frame : 0;
    if (_fmFace.at === f0 || typeof player === "undefined" || !player) return _fmFace;
    _fmFace.at = f0;
    const t = typeof targetCurrent === "function" ? targetCurrent() : null;
    if (t) { const dx = t.x - player.x, dy = t.y - player.y, L = Math.hypot(dx, dy); if (L > 0.3) { _fmFace.x = dx / L; _fmFace.y = dy / L; } }
    else if (_fmFace.px !== null) { const dx = player.x - _fmFace.px, dy = player.y - _fmFace.py, L = Math.hypot(dx, dy); if (L > 0.004) { _fmFace.x = dx / L; _fmFace.y = dy / L; } }
    _fmFace.px = player.x; _fmFace.py = player.y;
    return _fmFace;
}
// who stands where this frame: each kind's followers, in the squad's own order (so each keeps its place)
function _fmGroupsNow() {
    const f0 = typeof frame !== "undefined" ? frame : 0;
    if (_fmGroups.at === f0) return _fmGroups;
    _fmGroups.at = f0; _fmGroups.brawler.length = 0; _fmGroups.sniper.length = 0; _fmGroups.camper.length = 0;
    for (const f of (typeof followers !== "undefined" ? followers : [])) if (formationFollowing(f)) _fmGroups[formationRole(f)].push(f);
    return _fmGroups;
}
function _fmOk(px, py, x, y) {
    return (typeof facilityFloorAt !== "function" || facilityFloorAt(x, y)) && (typeof facilityLosFrom !== "function" || facilityLosFrom(px, py, x, y));   // (floor there, and a straight walk to it from you)
}
// its place now ([x, y]), or null when it takes none. Worked out every FORMATION.every frames (a place must be on floor you can see: a sight line each), and between them kept.
function formationSpot(f) {
    if (typeof player === "undefined" || !player || !formationFollowing(f)) return null;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    if (f._fmSpot && f0 - f._fmAt < FORMATION.every && f0 >= f._fmAt) return f._fmSpot;
    const role = formationRole(f); let list = _fmGroupsNow()[role], i = list.indexOf(f);
    if (i < 0) { _fmGroups.at = -1; list = _fmGroupsNow()[role]; i = list.indexOf(f); if (i < 0) return null; }   // (one that began to follow this frame: the list again)
    const F = formationFront(), n = list.length, px = player.x, py = player.y;
    let ox, oy;
    if (role === "camper") { const s = i % 2 ? -1 : 1, d = FORMATION.side + Math.floor(i / 2) * FORMATION.spread; ox = -F.y * s * d; oy = F.x * s * d; }   // beside you: across the way ahead, right then left
    else { const d = role === "sniper" ? -FORMATION.back : FORMATION.front, k = (i - (n - 1) / 2) * FORMATION.spread; ox = F.x * d - F.y * k; oy = F.y * d + F.x * k; }   // ahead or behind, side by side across the way ahead
    f._fmSpot = _fmPlace(px, py, ox, oy); f._fmAt = f0;
    if (typeof hexWalkOn === "function" && hexWalkOn()) { const h = _fmHex(f, f._fmSpot, px, py); if (h) f._fmSpot = h; }   // (in the 3D game: a hex's middle, §2.85)
    return f._fmSpot;
}
// THE HEXES OUT OF A BATTLE (js/cardbattle.js hexWalkOn, cardHexStand; docs/CARD-BATTLES.md §2.85; the owner, 2026-11-28: "whenever the player clicks to a new location, it assumes the middle of one
// of the hex tiles. And so do the followers"): in the 3D game a place is the middle of one of the battle's hexes, the nearest to the place with its trait's nudge in it (js/npc.js followPlayer's,
// moved here), on floor you can see and walk to straight, and neither yours (where you stand, where you are going) nor another of your squad's (its _hexKey, while it follows you or holds where
// it was sent). Null: none near (the place as it was).
function hexTaken(f, key) {
    if (typeof player !== "undefined" && player) {
        if (Number.isFinite(player.x) && key === cardHexKey(player.x, player.y)) return true;
        if (Number.isFinite(player.targetX) && Number.isFinite(player.targetY) && key === cardHexKey(player.targetX, player.targetY)) return true;
    }
    for (const o of (typeof followers !== "undefined" ? followers : [])) {
        if (!o || o === f || o.dead) continue;
        if (o._hexKey === key && o._hexXY && Math.hypot(o.x - o._hexXY[0], o.y - o._hexXY[1]) < 2) return true;   // (its claim, while it is there or on its way: 2 tiles; one gone off to fight has let it go)
        if (cardHexKey(o.x, o.y) === key) { const m = cardHex(o.x, o.y); if (Math.hypot(m[0] - o.x, m[1] - o.y) < 0.05) return true; }   // (one standing on its middle)
    }
    return false;
}
function hexClaim(f, m) { f._hexKey = cardHexKey(m[0], m[1]); f._hexXY = [m[0], m[1]]; }
function _fmHex(f, s, px, py) {
    if (typeof cardHexStand !== "function" || !s) return null;
    let x = s[0], y = s[1]; const ox = x - px, oy = y - py, L = Math.hypot(ox, oy);
    if (f.wanderRadius && L > 1e-6) { const wx = x + ox / L * FORMATION.loneWolf, wy = y + oy / L * FORMATION.loneWolf; if (_fmOk(px, py, wx, wy)) { x = wx; y = wy; } }
    else if (f.preferGroup) { x = px + ox * (1 - FORMATION.empathetic); y = py + oy * (1 - FORMATION.empathetic); }
    const h = cardHexStand(x, y, 1.8, (k, m) => hexTaken(f, k) || !_fmOk(px, py, m[0], m[1])); if (!h) return null;
    const out = [h[0], h[1]]; out.hex = true; hexClaim(f, h); return out;
}
// SETTLING ONTO A HEX (the owner, 2026-11-28, asked whether followers fighting in real time and those patrolling a room they hold should stand on hexes too: "Yes"): in the 3D game a follower
// standing still where its own mind left it (striking or shooting at an enemy, resting at a stop of its room's round, idle) steps onto the middle of the nearest free hex within HEX_SETTLE.look
// tiles: never yours or another's, not where a creature stands, in a straight step, and when it is fighting, within its reach of its enemy (_hexReach, or no farther than it is), in its sight if it
// sees it now, so its own mind does not walk it back. Not one going to a place of its own this step (following you, holding where it was sent, to a healing spot, blocking: _hexOwn), one winding a shot or
// blocking (rooted), one in a card battle, a clone. The hex is chosen again every HEX_SETTLE.every frames (js/npc.js updateNPC calls this after each follower's step).
const HEX_SETTLE = { still: 0.002, look: 1.2, every: 15, body: 0.6, keepOff: 2.5, mageFar: 4, techReach: 1.4 };
// how near its enemy it must be to fight it, as js/npc.js has each role walk in: a Mage shoots from mageFar, a Technician strikes from techReach, a Brawler (and the rest) from 1.4; a huge body from its edge
function _hexReach(a, foe) { const edge = (foe && foe.bodyR || 0) + 0.2; return a.role === "sniper" ? HEX_SETTLE.mageFar : a.role === "camper" ? Math.max(HEX_SETTLE.techReach, edge) : Math.max(1.4, edge); }   // (techReach: in the 3D game a Technician strikes from this near, the hex next to its enemy, as a Brawler does: js/npc.js)   // (a Mage shoots from between keepOff and mageFar of its enemy, js/npc.js SNIPER_MIN and SNIPER_PREFERRED: a hex nearer it would back off from, one farther it would walk in from)
function hexSettle(a, x0, y0) {
    if (!a || a.dead || !a.isFollower || a.isClone || a.team !== "green" || typeof hexWalkOn !== "function" || !hexWalkOn() || typeof cardHexStand !== "function") return;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    if (a._hexOwn === f0 || a._flight || a._pinball || a._burrow || a._consume || a._fault || a._wraith || a._shotWind > 0 || (a._blockUntil || 0) > f0) { a._settle = null; return; }
    if (typeof cardBattleActive === "function" && cardBattleActive() && typeof partyIsMember === "function" && partyIsMember(a)) { a._settle = null; return; }   // (the battle places its own)
    if (Math.hypot(a.x - x0, a.y - y0) > HEX_SETTLE.still) { a._settle = null; return; }   // (its own step moved it)
    const m0 = cardHex(a.x, a.y); if (Math.hypot(m0[0] - a.x, m0[1] - a.y) < 1e-6) { a._hexHeld = f0; return; }   // (on a middle already: it holds it, and the squad's spacing moves the other one, js/game.js)
    let S = a._settle;
    if (!S || f0 - S.at >= HEX_SETTLE.every || f0 < S.at) {
        const foe = a._nearestEnemy && !a._nearestEnemy.dead ? a._nearestEnemy : null, fd = foe ? Math.hypot(foe.x - a.x, foe.y - a.y) : 0;
        const sees = foe && typeof facilitySeesFrom === "function" ? facilitySeesFrom(a.x, a.y, foe.x, foe.y) : false;
        const h = cardHexStand(a.x, a.y, HEX_SETTLE.look, (k, m) => {
            if (hexTaken(a, k)) return true;
            if (typeof facilityLosFrom === "function" && !facilityLosFrom(a.x, a.y, m[0], m[1])) return true;
            if (foe) { const dm = Math.hypot(foe.x - m[0], foe.y - m[1]);
                const mage = a.role === "sniper", far = Math.max(fd, _hexReach(a, foe) - 0.01);
                if (dm > far + 1e-6 || (mage && fd >= HEX_SETTLE.keepOff && dm < HEX_SETTLE.keepOff) || (sees && !facilitySeesFrom(m[0], m[1], foe.x, foe.y))) return true; }   // (within its reach, or no farther than it is; a Mage not nearer than it keeps off; in its sight)
            for (const o of (typeof actors !== "undefined" ? actors : [])) if (o && !o.dead && o.team !== "green" && Number.isFinite(o.x) && Math.hypot(o.x - m[0], o.y - m[1]) < Math.max(HEX_SETTLE.body, (o.bodyR || 0) + 0.3)) return true;
            return false;
        });
        S = a._settle = h ? { x: h[0], y: h[1], at: f0 } : { x: NaN, y: NaN, at: f0 }; if (h) hexClaim(a, h);
    }
    if (!Number.isFinite(S.x)) return;
    const dx = S.x - a.x, dy = S.y - a.y, d = Math.hypot(dx, dy), s = Math.min(a.moveSpeed || 0.02, d);
    if (d > 1e-9) { a.x += dx / d * s; a.y += dy / d * s; a._hexStep = f0; }   // (stepping onto its hex: the squad's spacing leaves it be this frame, js/game.js; the hexes are a tile apart)
}
// the place: as far out as it can be on floor you can walk to straight, coming in toward you; failing that, turned to a diagonal, then to a side (a wall ahead: beside you); failing all, where you stand
const _fmTurns = [0, 0.785, -0.785, 1.571, -1.571];
function _fmPlace(px, py, ox, oy) {
    for (const s of [1, 0.75, 0.5, 0.25]) { const x = px + ox * s, y = py + oy * s; if (_fmOk(px, py, x, y)) return [x, y]; }
    for (let k = 1; k < _fmTurns.length; k++) { const c = Math.cos(_fmTurns[k]), sn = Math.sin(_fmTurns[k]), rx = ox * c - oy * sn, ry = ox * sn + oy * c;
        for (const s of [1, 0.6]) { const x = px + rx * s, y = py + ry * s; if (_fmOk(px, py, x, y)) return [x, y]; } }
    return [px, py];
}
