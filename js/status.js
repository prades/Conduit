// ─────────────────────────────────────────────────────────
//  WHAT A UNIT IS DOING — the status over its head and in the roster
// ─────────────────────────────────────────────────────────
// REPORTED: "Make it say what the followers are doing, above their head and in the roster."
// unitStatus(a) reads the unit's own state (its stance, job, duty, orders, what it is fighting) and answers { text, col } in the order the game itself obeys it:
// on its way home, a hack or siphon order, a job in hand (hold, attack, build, reclaim, capture, upgrade), healing, working (by element: haul, neutralise, re-arm, tend, ice block;
// a clone's own job), an enemy in reach (fighting), a post held, then following. drawUnitTag (js/levels.js) draws it as a chip over the unit's name plate; the roster cards show it.
const STATUS_COL = { follow: "#19e6c1", hold: "#8fe3ff", fight: "#ff4a1c", work: "#ffe733", heal: "#7dff9a", away: "#8aa0c8", order: "#ff9a3c" };
const STATUS_JOBS = {
    move: ["HOLDING", "hold"], attack: ["ATTACKING", "fight"], build_pylon: ["BUILDING", "work"], reconstruct: ["RECLAIMING", "work"], capture_node: ["CAPTURING", "order"],
    merge_pylon: ["UPGRADING", "work"], elementJob: ["ELEMENT JOB", "work"],
};
const STATUS_WORK = { electric: "NEUTRALISING", flux: "HAULING", core: "RE-ARMING", toxic: "TENDING", ice: "ICE BLOCK" };
function _st(text, k) { return { text, col: STATUS_COL[k] || "#19e6c1" }; }
function unitStatus(a) {
    if (!a || a.dead || a.team !== "green" || !(a.isFollower || a.isClone)) return null;
    if (a.returningToCrystal) return _st("RETURNING", "away");
    if (a.hackOrder) return _st("HACKING", "order");
    if (a.siphonOrder) return _st("SIPHONING", "order");
    if (a.job && STATUS_JOBS[a.job.type]) { const j = STATUS_JOBS[a.job.type]; return _st(j[0], j[1]); }
    if (a.isHealing) return _st("HEALING", "heal");
    if (a.duty === "worker") {
        if (a.isClone) { const j = typeof cloneJob === "function" ? cloneJob(a) : null; return _st(j ? String(j.label).toUpperCase() : "WORKING", "work"); }
        return _st(a.crewZone !== undefined ? "CREW · ZONE " + a.crewZone : STATUS_WORK[a.element] || "WORKING", "work");
    }
    const foe = a._nearestEnemy || a._guardEnemy;
    if (foe && !foe.dead && Math.hypot(foe.x - a.x, foe.y - a.y) < 9) return _st("FIGHTING", "fight");
    if (a.stance === "hold") return _st("HOLDING", "hold");
    if (!a.isClone && a.role === "camper") return _st("ON POST", "hold");
    return _st("FOLLOWING", "follow");
}
