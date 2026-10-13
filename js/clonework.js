// ─────────────────────────────────────────────────────────
//  CLONE WORK  —  a duty for clones, one job per species
// ─────────────────────────────────────────────────────────
// REPORTED: "Make way for clone work abilities. We can plan them out one by
// one."
//
// The framework only. A clone, like a follower, is a FIGHTER by default; long-
// press it and the top of its ring reads TO WORK when its species has a job,
// TO LINE while it is working, and NO JOB YET until that species' job has been
// designed. A job is one entry in CLONE_JOBS, keyed by species:
//
//   CLONE_JOBS.ant = {
//       label: "…",            // the ring and the info line, e.g. "HAUL"
//       note:  "…",            // one plain sentence for the index
//       tick(clone) { … }      // once a frame while working; return true when
//                              // it moved or acted (the clone's own fighting
//                              // and wandering then skip that frame)
//   };
//
// Nothing else needs touching to add one: the ring, the save, the info line
// and the index read the table.
const CLONE_JOBS = {};

function cloneJob(c) { return (c && c.isClone && CLONE_JOBS[c.speciesName]) || null; }
// Can this clone be put to work at all?
function canCloneWork(c) { return !!(c && c.isClone && !c.dead && c.team === "green" && cloneJob(c)); }

// TO WORK ⇄ TO LINE. Says why when it cannot.
function toggleCloneDuty(c) {
    if (!c || !c.isClone || c.dead) return false;
    const say = (text, color) => { if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color, life: 100, vy: -0.25, size: 12 }); };
    if (c.duty === "worker") {
        c.duty = null; c.cloneWork = null;
        say((c.speciesName || "CLONE").toUpperCase() + " CLONE → TO THE LINE", "#0f8");
        return true;
    }
    const j = cloneJob(c);
    if (!j) { say("NO JOB YET FOR A " + (c.speciesName || "").toUpperCase() + " CLONE", "#8a8a95"); return false; }
    c.duty = "worker"; c.cloneWork = {};
    say((c.speciesName || "CLONE").toUpperCase() + " CLONE → " + j.label, "#00ccaa");
    return true;
}

// Once a frame from the clone's AI (npc.js updateRTSNPC). True when the job
// handled the frame. A clone on work duty whose species has no job (a save
// from a build that had one) goes back to the line.
function cloneWorkTick(c) {
    if (!c || c.duty !== "worker") return false;
    const j = cloneJob(c);
    if (!j) { c.duty = null; c.cloneWork = null; return false; }
    if (!c.cloneWork) c.cloneWork = {};
    return !!j.tick(c);
}

// What the ring and the info panel say about this clone's work.
function cloneDutyLabel(c) {
    const j = cloneJob(c);
    if (c && c.duty === "worker" && j) return "WORKER: " + j.label;
    return j ? "FIGHTER · JOB: " + j.label : "FIGHTER · NO JOB YET";
}
