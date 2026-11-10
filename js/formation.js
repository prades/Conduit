// ─────────────────────────────────────────────────────────
//  THE FORMATION — the squad's places round you while it follows you
// ─────────────────────────────────────────────────────────
// The owner, 2026-11-10: "make it to where it feels more structured with the fights ... a formation function, and it will basically put the brawlers in front of the player and whatever
// they're looking at, and it will put the mage behind the player where there's some distance, and it will put the technician constantly patrolling the area around the player". Of the
// agent's questions: "Always while following", "Fight from their places", "Locked enemy, else your way".
//   BRAWLERS     ahead of you, FORMATION.front tiles, side by side across the front (FORMATION.spread apart); they go out to meet what comes and come back to it (js/npc.js)
//   MAGES        behind you, FORMATION.back tiles, side by side; they shoot from there at an enemy within FORMATION.mageRange and move only to see one (js/npc.js)
//   TECHNICIANS  circling you, FORMATION.ring tiles out, at their own pace (each makes for a point FORMATION.lead round the ring from where it is; a second one goes the other way round);
//                they hit what comes within their reach and go back to the round
// "Ahead" is toward the enemy you have locked (js/targeting.js targetCurrent), else the way you last walked (kept while you stand). A place in a wall, or out of your sight, is pulled in
// toward you. Only a follower that is following you takes a place: HOLD, a posted room, an order, a clone and the way home to the Crystal are as they were. The numbers are the agent's,
// provisional (docs/OPEN-QUESTIONS.md).
// The natural traits (js/traits.js) nudge a place rather than undo it (every follower has one of the two): a LONE WOLF stands FORMATION.loneWolf tiles farther out than its place, an EMPATHETIC one
// FORMATION.empathetic of the way nearer you, the squad's middle (js/npc.js followPlayer; away from the formation, 4 tiles out and a 60% lean to its allies, as before).
const FORMATION = { front: 1.8, back: 3, ring: 2.5, spread: 1.2, lead: 0.6, mageRange: 8, stop: 0.35, every: 6, loneWolf: 1.2, empathetic: 0.25 };
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
    if (role === "camper") { const a = Math.atan2(f.y - py, f.x - px) + (i % 2 ? -1 : 1) * FORMATION.lead; ox = Math.cos(a) * FORMATION.ring; oy = Math.sin(a) * FORMATION.ring; }   // the round: a point a little way on from where it is, so it walks it at its own pace
    else { const d = role === "sniper" ? -FORMATION.back : FORMATION.front, k = (i - (n - 1) / 2) * FORMATION.spread; ox = F.x * d - F.y * k; oy = F.y * d + F.x * k; }   // ahead or behind, side by side across the way ahead
    f._fmSpot = _fmPlace(px, py, ox, oy); f._fmAt = f0;
    return f._fmSpot;
}
// the place: as far out as it can be on floor you can walk to straight, coming in toward you; failing that, turned to a diagonal, then to a side (a wall ahead: beside you); failing all, where you stand
const _fmTurns = [0, 0.785, -0.785, 1.571, -1.571];
function _fmPlace(px, py, ox, oy) {
    for (const s of [1, 0.75, 0.5, 0.25]) { const x = px + ox * s, y = py + oy * s; if (_fmOk(px, py, x, y)) return [x, y]; }
    for (let k = 1; k < _fmTurns.length; k++) { const c = Math.cos(_fmTurns[k]), sn = Math.sin(_fmTurns[k]), rx = ox * c - oy * sn, ry = ox * sn + oy * c;
        for (const s of [1, 0.6]) { const x = px + rx * s, y = py + ry * s; if (_fmOk(px, py, x, y)) return [x, y]; } }
    return [px, py];
}
