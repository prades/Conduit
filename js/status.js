// ─────────────────────────────────────────────────────────
//  WHAT A UNIT IS DOING — the status over its head and in the roster
// ─────────────────────────────────────────────────────────
// REPORTED: "Make it say what the followers are doing, above their head and in the roster."
// unitStatus(a) reads the unit's own state (its stance, job, orders, what it is fighting) and answers { text, col } in the order the game itself obeys it:
// on its way home, a job in hand (hold, attack), healing, an attack order (the enemy card's), an enemy in reach (fighting), a post held, holding, then following.
// drawUnitTag (js/levels.js) draws it as a chip over the unit's name plate; the roster cards show it.
const STATUS_COL = { follow: "#19e6c1", hold: "#8fe3ff", fight: "#ff4a1c", heal: "#7dff9a", away: "#8aa0c8" };
const STATUS_JOBS = { move: ["HOLDING", "hold"], attack: ["ATTACKING", "fight"] };
function _st(text, k) { return { text, col: STATUS_COL[k] || "#19e6c1" }; }
function unitStatus(a) {
    const st = _unitStatus(a);
    if (st && a && a.post && typeof partyRoomName === "function") st.room = partyRoomName(a.post).toUpperCase();   // the room it holds (js/party.js): the roster card says it
    return st;
}
function _unitStatus(a) {
    if (!a || a.dead || a.team !== "green" || !(a.isFollower || a.isClone)) return null;
    if (a.returningToCrystal) return _st("RETURNING", "away");
    if (a.job && STATUS_JOBS[a.job.type]) { const j = STATUS_JOBS[a.job.type]; return _st(j[0], j[1]); }
    if (a.isHealing) return _st("HEALING", "heal");
    if (a.attackOrder && a.attackOrder.target && !a.attackOrder.target.dead && (a.stance || "follow") === "follow" && (typeof frame === "undefined" || frame <= a.attackOrder.until)) return _st("ATTACKING", "fight");   // sent at one creature from the enemy card (js/mixtool.js)
    const foe = a._nearestEnemy || a._guardEnemy;
    if (foe && !foe.dead && Math.hypot(foe.x - a.x, foe.y - a.y) < 9) return _st("FIGHTING", "fight");
    if (a.post) return _st("HOLDING", "hold");
    if (a.stance === "hold") return _st("HOLDING", "hold");
    return _st("FOLLOWING", "follow");
}
