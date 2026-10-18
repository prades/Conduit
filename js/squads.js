// ─────────────────────────────────────────────────────────
//  ROSTER SQUADS — up to three followers you group in the Command Center (docs/PLAYER-CLASSES.md, 4.3)
// ─────────────────────────────────────────────────────────
// A squad is a small named group you set up in the roster: SQUAD A, B, C... (a letter and a colour), up to SQUAD_MAX (3) followers in it, a follower in at most one. It is NOT the zone
// worker crew (js/zones.js: ants and core workers sent to build a zone): this is for fighters, and it is what a tier 2 piece of gear will reach (the carrier and its squad-mates).
// There is no separate store: the squad is `f.squadId` on each follower, saved with the follower, so a reload keeps it and a dead member simply leaves it (it is not in followers any more).
//   MAKE SQUAD      the roster's selection (1 to 3 followers) becomes a new squad in the first free letter.
//   ADD / LEAVE     put the selection into a squad that has room / take it out of its squad.
//   SELECT          selecting a squad selects its members, so HOLD, COME, MOVE and JOB (and the mini dial's SEL) work on it.
const SQUAD_MAX = 3;
const SQUADS = [
    { id: "A", col: "#19e6c1" }, { id: "B", col: "#ffe733" }, { id: "C", col: "#ff8ad8" },
    { id: "D", col: "#8fe3ff" }, { id: "E", col: "#a6ff4d" }, { id: "F", col: "#ff9f40" },
];
function squadDef(id) { return SQUADS.find(s => s.id === id) || null; }
function squadColour(id) { const s = squadDef(id); return s ? s.col : "#19e6c1"; }
// Only a live follower of yours can be in one (not a clone, an enemy or a worker's egg-less stand-in).
function _squadEligible(a) { return !!a && !a.dead && a.isFollower === true && !a.isClone && a.team === "green"; }
function squadOf(a) { return a && a.squadId && squadDef(a.squadId) ? a.squadId : null; }
function squadMembers(id) {
    return (typeof followers !== "undefined" ? followers : []).filter(a => _squadEligible(a) && a.squadId === id);
}
// The squads that exist (have at least one live member), in letter order.
function squadsLive() {
    return SQUADS.map(s => ({ id: s.id, col: s.col, members: squadMembers(s.id) })).filter(s => s.members.length);
}
function squadFreeId() { const s = SQUADS.find(d => !squadMembers(d.id).length); return s ? s.id : null; }
// Who a piece of squad-wide gear reaches: the unit and its squad-mates, or just the unit when it is in no squad.
function squadReach(a) {
    const id = squadOf(a); if (!id) return a ? [a] : [];
    const m = squadMembers(id); return m.indexOf(a) < 0 ? m.concat([a]) : m;
}
function _squadSay(text, col) {
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: col || "#19e6c1", life: 100, vy: -0.25, size: 12 });
}
// Put these units in squad `id`. Refused (nobody moves) if the squad would pass SQUAD_MAX. Returns how many joined, or -1 when refused.
function squadAssign(id, units) {
    if (!squadDef(id)) return -1;
    const list = (units || []).filter(_squadEligible);
    if (!list.length) return 0;
    const incoming = list.filter(a => a.squadId !== id).length, have = squadMembers(id).length;
    if (have + incoming > SQUAD_MAX) { _squadSay("SQUAD " + id + " HOLDS " + SQUAD_MAX, "#ff8a6a"); return -1; }
    for (const a of list) a.squadId = id;
    return incoming;
}
// The selection becomes a new squad: 1 to SQUAD_MAX followers, in the first free letter. Returns the letter, or null.
function squadMake(units) {
    const list = (units || []).filter(_squadEligible);
    if (!list.length) { _squadSay("SELECT FOLLOWERS FIRST", "#ff8a6a"); return null; }
    if (list.length > SQUAD_MAX) { _squadSay("A SQUAD IS UP TO " + SQUAD_MAX + ": SELECT FEWER", "#ff8a6a"); return null; }
    const id = squadFreeId(); if (!id) { _squadSay("ALL " + SQUADS.length + " SQUADS ARE IN USE", "#ff8a6a"); return null; }
    for (const a of list) a.squadId = id;
    _squadSay("SQUAD " + id + " · " + list.length + " FOLLOWER" + (list.length === 1 ? "" : "S"), squadColour(id));
    return id;
}
function squadLeave(units) { let n = 0; for (const a of units || []) if (a && a.squadId) { a.squadId = undefined; n++; } return n; }
function squadDisband(id) { let n = 0; for (const a of squadMembers(id)) { a.squadId = undefined; n++; } return n; }
// Selecting a squad selects its members (the roster's selection is what orders in the world go to).
function squadSelect(id) { const m = squadMembers(id); if (typeof ccSetSelection === "function") ccSetSelection(m); return m.length; }
