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

// ── BEETLE: HAULER ────────────────────────────────────────
// Asked: "Beetle — hauler. Beetles already haul mass for their nests as
// enemies. As a clone: carries neutralised mass to the Crystal, more per trip
// than a flux worker."
//
// It gathers neutralised lumps (the purple ones the electric workers leave) —
// up to BEETLE_HAUL_LOAD at once where a flux worker takes one — then walks
// them to the nearest drop point (the Crystal, or a nest you hold) and pays
// them all in. The delivery is the flux worker's own (updateChargedMass, in
// js/mass.js): each lump it carries is paid when it reaches a drop point, and
// dropped where it fell if the beetle is killed. With nothing to haul it
// fights like any clone.
const BEETLE_HAUL_LOAD  = 3;     // lumps per trip (a flux worker: 1)
const BEETLE_HAUL_SEEK  = 12;    // tiles: how far it looks for the next lump
const BEETLE_HAUL_SPEED = 1.0;   // × its own speed while working
function _beetleStep(c, tx, ty) {
    const dx = tx - c.x, dy = ty - c.y, d = Math.hypot(dx, dy);
    if (d > 1e-6) { c.dirX = dx / d; c.dirY = dy / d; }
    _moveToward(c, tx, ty, BEETLE_HAUL_SPEED);
    c.state = "wander";
}
CLONE_JOBS.beetle = {
    label: "HAUL",
    note: "Gathers up to " + BEETLE_HAUL_LOAD + " neutralised lumps at a time and carries them to the Crystal or a nest you hold.",
    tick(c) {
        if (typeof chargedMass === "undefined" || typeof MASS_STATE === "undefined") return false;
        const w = c.cloneWork;
        // What it is carrying: lumps whose carrier is still this beetle (a
        // delivered lump has left chargedMass; a dropped one has no carrier).
        w.load = (w.load || []).filter(m => m.carrier === c && m.state === MASS_STATE.CARRIED && chargedMass.includes(m));
        w.load.forEach((m, i) => { m.stack = i; });
        // Room for more, and one in reach: go and get it.
        if (w.load.length < BEETLE_HAUL_LOAD) {
            let m = w.target;
            if (!m || m.state !== MASS_STATE.NEUTRAL || m.carrier || !chargedMass.includes(m))
                m = w.target = nearestChargedMass(c.x, c.y, MASS_STATE.NEUTRAL, BEETLE_HAUL_SEEK);
            if (m) {
                if (Math.hypot(m.x - c.x, m.y - c.y) > MASS_WORK_RANGE) { _beetleStep(c, m.x, m.y); return true; }
                m.state = MASS_STATE.CARRIED; m.carrier = c; m.stack = w.load.length;
                w.load.push(m); w.target = null;
                if (typeof floatingTexts !== "undefined")
                    floatingTexts.push({ x: m.x, y: m.y - 1, text: "HAULING " + w.load.length + "/" + BEETLE_HAUL_LOAD,
                                         color: typeof _massHaulColour === "function" ? _massHaulColour() : "#9933ff", life: 45, vy: -0.06 });
                return true;
            }
        }
        // Full, or nothing more to pick up: take the load home.
        if (w.load.length) {
            const d = nearestMassDrop(c.x, c.y);
            if (d) { _beetleStep(c, d.x, d.y); return true; }
        }
        return false;   // no work: it fights like any clone
    },
};

// The index's list of clone jobs (SQUAD → In detail — clones), from the table.
function renderCloneJobsIndex() {
    if (typeof document === "undefined" || !document.getElementById) return;
    const host = document.getElementById("cmCloneJobs");
    if (!host) return;
    const rows = Object.keys(CLONE_JOBS).map(sp =>
        '<div class="cm-build-row"><span class="cm-build-label">' + sp.toUpperCase() + ' \u00b7 ' + CLONE_JOBS[sp].label + '</span>' + CLONE_JOBS[sp].note + '</div>');
    host.innerHTML = (rows.length ? rows.join("") : "") +
        '<div class="ctrl-row cm-dim">Long-press a clone: <strong>TO WORK</strong> puts it on its species&rsquo; job, <strong>TO LINE</strong> brings it back. A species with no job yet says <strong>NO JOB YET</strong>.</div>';
}
try { renderCloneJobsIndex(); } catch (e) { /* no DOM (tests) */ }

// ── ANT: BUILDER ──────────────────────────────────────────
// Asked: "Ant — builder. Repairs damaged pylons and speeds up pylon
// construction nearby."
//
// The first of these within ANT_BUILD_SEEK tiles, in this order:
//   1. a pylon of yours UNDER CONSTRUCTION — it adds ANT_BUILD_RATE to the
//      build each frame (a lone follower takes 30 s; with an ant it is a few);
//      the follower who started it still finishes it and sets its element;
//   2. a DAMAGED pylon or shield generator of yours — ANT_REPAIR_HP a frame
//      back, to full;
//   3. a WRECKED pylon — rebuilt as a core worker would, ANT_REBUILD_MULT x
//      faster (restoreBrokenPylon, js/mass.js).
// With none of those it fights like any clone. It looks again every
// ANT_RESEEK frames, or when the job in hand is done.
const ANT_BUILD_SEEK   = 12;      // tiles
const ANT_BUILD_RATE   = 1 / 240; // construction progress a frame (~4 s alone)
const ANT_REPAIR_HP    = 0.25;    // health a frame (15 a second)
const ANT_REBUILD_MULT = 2;       // x a core worker's rebuild
const ANT_RESEEK       = 30;      // frames between looks for new work
function _antTask(c) {
    const r2 = ANT_BUILD_SEEK * ANT_BUILD_SEEK;
    let best = null, bestScore = Infinity;
    const consider = (t, kind, rank) => {
        const dx = t.x - c.x, dy = t.y - c.y, d2 = dx * dx + dy * dy;
        if (d2 > r2) return;
        const score = rank * 1e4 + d2;
        if (score < bestScore) { bestScore = score; best = { t, kind }; }
    };
    for (const t of world) {
        if (!t.pillar || t.pillarTeam !== "green") continue;
        if (t.constructing && (t.constructProgress || 0) < 1) consider(t, "build", 0);
        else if (t.destroyed) consider(t, "rebuild", 2);
        else if (t.health > 0 && t.health < t.maxHealth) consider(t, "repair", 1);
    }
    return best;
}
function _antTaskLive(task) {
    const t = task && task.t;
    if (!t || !t.pillar || t.pillarTeam !== "green") return false;
    if (task.kind === "build")   return !!t.constructing && (t.constructProgress || 0) < 1;
    if (task.kind === "repair")  return !t.destroyed && t.health > 0 && t.health < t.maxHealth;
    if (task.kind === "rebuild") return !!t.destroyed;
    return false;
}
CLONE_JOBS.ant = {
    label: "BUILD",
    note: "Speeds up pylons under construction, repairs damaged pylons and generators, and rebuilds wrecked ones.",
    tick(c) {
        if (typeof world === "undefined") return false;
        const w = c.cloneWork, f = typeof frame !== "undefined" ? frame : 0;
        // The job in hand, until it is done; then (and every ANT_RESEEK frames
        // while idle) look for the next.
        if (!_antTaskLive(w.task)) {
            if (w.task) w.lookedAt = -Infinity;   // just finished one: look again now
            w.task = null;
            if (f - (w.lookedAt === undefined ? -Infinity : w.lookedAt) >= ANT_RESEEK) { w.task = _antTask(c); w.lookedAt = f; }
        }
        const task = w.task;
        if (!task) return false;   // nothing to build or mend: it fights
        const t = task.t;
        const reach = typeof MASS_WORK_RANGE !== "undefined" ? MASS_WORK_RANGE : 0.9;
        if (Math.hypot(t.x - c.x, t.y - c.y) > reach) { _beetleStep(c, t.x, t.y); return true; }
        c.state = "idle";
        const col = "#aa55ff";
        if (task.kind === "build") {
            t.constructProgress = Math.min(1, (t.constructProgress || 0) + ANT_BUILD_RATE);
            if (f % 12 === 0 && typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: t.x, y: t.y, color: col, radius: 0.4, life: 16 });
        } else if (task.kind === "repair") {
            t.health = Math.min(t.maxHealth, t.health + ANT_REPAIR_HP);
            if (f % 12 === 0 && typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: t.x, y: t.y, color: "#7dffb5", radius: 0.35, life: 14 });
            if (t.health >= t.maxHealth) { if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: t.x, y: t.y - 1, text: "REPAIRED", color: "#7dffb5", life: 50, vy: -0.06 }); }
        } else if (task.kind === "rebuild") {
            t.reconstructing = true;
            t.reconstructProgress = Math.min(1, (t.reconstructProgress || 0) + (typeof PYLON_REPAIR_RATE !== "undefined" ? PYLON_REPAIR_RATE : 0.006) * ANT_REBUILD_MULT);
            if (f % 10 === 0 && typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: t.x, y: t.y, color: col, radius: 0.4, life: 18 });
            if (t.reconstructProgress >= 1 && typeof restoreBrokenPylon === "function") {
                restoreBrokenPylon(t);
                if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: t.x, y: t.y - 1, text: "PYLON REBUILT", color: col, life: 60, vy: -0.06 });
                if (typeof _cacheAge !== "undefined") _cacheAge = -999;
            }
        }
        return true;
    },
};
