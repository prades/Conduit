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

// (no working in the facility: a clone there has no job; ASKED: "we're also going to remove working. There is no more working.")
function cloneJob(c) { if (typeof partyOn === "function" && partyOn()) return null; return (c && c.isClone && CLONE_JOBS[c.speciesName]) || null; }
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

// Put a clone on a duty outright ("worker" or anything else for the line),
// quietly — the HUD's clone rows order a whole species at once and say it once.
// False when it cannot (no job for its species yet).
function setCloneDuty(c, duty) {
    if (!c || !c.isClone || c.dead) return false;
    if (duty === "worker") {
        if (!canCloneWork(c)) return false;
        if (c.duty !== "worker") { c.duty = "worker"; c.cloneWork = {}; }
        return true;
    }
    if (c.duty === "worker") { c.duty = null; c.cloneWork = null; }
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
    if (typeof partyOn === "function" && partyOn()) return "FIGHTER";
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
//   3. a WRECKED pylon — ants are the ONLY rebuilders. It stands again as an
//      offline FRAME (rebuildPylonFrame, js/mass.js) that a core worker
//      re-arms into the machine it was.
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
    note: "Speeds up pylons under construction, repairs damaged pylons and generators, and is the only one that rebuilds wrecked ones (as offline frames a core worker re-arms).",
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
            if (t.reconstructProgress >= 1 && typeof isWallUnitTile === "function" && isWallUnitTile(t)) {
                // A wall cell comes back live: it was never a machine with a mode to re-arm (js/wallunit.js).
                wallCellRestore(t);
                if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: t.x, y: t.y - 1, text: "POWER CELL REBUILT", color: col, life: 70, vy: -0.06 });
            } else if (t.reconstructProgress >= 1 && typeof rebuildPylonFrame === "function") {
                // The FRAME stands again — offline until a core worker re-arms
                // it (js/mass.js). Ants are the only rebuilders.
                rebuildPylonFrame(t);
                if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: t.x, y: t.y - 1, text: "FRAME REBUILT \u2014 NEEDS CORE", color: col, life: 70, vy: -0.06 });
                if (typeof _cacheAge !== "undefined") _cacheAge = -999;
            }
        }
        return true;
    },
};

// ── SPIDER: WEB LAYER ─────────────────────────────────────
// Asked: "Spider — web layer. Spins webs on the floor in a lane that slow and
// hold predators."
//
// POSITION it where you want the lane held, then TO WORK: it anchors there and
// spins a web on each floor tile around that spot, out to SPIDER_WEB_REACH
// tiles, up to SPIDER_WEB_MAX of them, SPIDER_SPIN_FRAMES each. A predator on
// a web is slowed to SPIDER_WEB_SLOW; the first time each one steps into a
// web it is HELD fast for SPIDER_WEB_HOLD frames, and that wears the web — it
// breaks after SPIDER_WEB_HP catches and the spider spins it again. With all
// its webs up the spider fights like any clone. Webs are drawn on the floor,
// under everything standing on them (drawWebOnTile, from the floor pass).
const SPIDER_WEB_MAX     = 6;
const SPIDER_WEB_REACH   = 2.5;   // tiles from its anchor
const SPIDER_SPIN_FRAMES = 60;    // one web a second
const SPIDER_WEB_SLOW    = 0.3;   // speed on a web
const SPIDER_WEB_HOLD    = 60;    // frames held on first contact
const SPIDER_WEB_HP      = 3;     // catches before it breaks
const _webs = new Map();          // "x,y" → { x, y, hp, owner }
function _webKey(x, y) { return x + "," + y; }
function webAt(x, y) { return _webs.get(_webKey(Math.floor(x), Math.floor(y))) || null; }
function _spiderNextSpot(anchor) {
    let best = null, bd = Infinity;
    const R = Math.ceil(SPIDER_WEB_REACH);
    for (let x = anchor.x - R; x <= anchor.x + R; x++) for (let y = anchor.y - R; y <= anchor.y + R; y++) {
        if (y < FLOOR_Y_MIN || y > FLOOR_Y_MAX) continue;
        const d = Math.hypot(x - anchor.x, y - anchor.y);
        if (d > SPIDER_WEB_REACH || _webs.has(_webKey(x, y))) continue;
        const t = typeof getTile === "function" ? getTile(x, y) : null;
        if (!t || t.type !== "floor" || t.nest || t.pillar || t.nodeType) continue;
        if (d < bd) { bd = d; best = { x, y }; }
    }
    return best;
}
CLONE_JOBS.spider = {
    label: "WEB",
    note: "Holds a lane: spins up to " + SPIDER_WEB_MAX + " webs on the floor around where you put it. Predators on a web are slowed, held fast the first time, and wear it out.",
    tick(c) {
        const w = c.cloneWork;
        if (!w.anchor) w.anchor = { x: Math.floor(c.x), y: Math.floor(c.y) };
        let mine = 0;
        for (const k of _webs.values()) if (k.owner === c) mine++;
        if (mine >= SPIDER_WEB_MAX) { w.spot = null; w.spin = 0; return false; }   // all up: it fights
        if (!w.spot || _webs.has(_webKey(w.spot.x, w.spot.y))) { w.spot = _spiderNextSpot(w.anchor); w.spin = 0; }
        if (!w.spot) return false;
        const sx = w.spot.x + 0.5, sy = w.spot.y + 0.5;
        if (Math.hypot(sx - c.x, sy - c.y) > 0.35) { _beetleStep(c, sx, sy); return true; }
        c.state = "idle";
        w.spin = (w.spin || 0) + 1;
        if (w.spin >= SPIDER_SPIN_FRAMES) {
            _webs.set(_webKey(w.spot.x, w.spot.y), { x: w.spot.x, y: w.spot.y, hp: SPIDER_WEB_HP, owner: c });
            if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: sx, y: sy, color: "#e8eef6", radius: 0.5, life: 18 });
            w.spot = null; w.spin = 0;
        }
        return true;
    },
};
// Once a frame (game.js): predators on webs, and webs whose spider is gone.
function webTick() {
    if (!_webs.size) return;
    const f = typeof frame !== "undefined" ? frame : 0;
    for (const [k, web] of _webs) {
        // A spider that has died or left the field takes its webs with it.
        if (f % 60 === 0 && (!web.owner || web.owner.dead || !actors.includes(web.owner))) { _webs.delete(k); continue; }
        const near = typeof unitsNear === "function" ? unitsNear(web.x + 0.5, 1) : actors;
        for (const a of near) {
            if (!isHostileTarget(a) || Math.floor(a.x) !== web.x || Math.floor(a.y) !== web.y) continue;
            if (typeof applySlow === "function") applySlow(a, 20, SPIDER_WEB_SLOW);
            if (a._webHeld !== web) {
                a._webHeld = web;
                if (typeof applySlow === "function") applySlow(a, SPIDER_WEB_HOLD, 0);
                web.hp--;
                if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: web.x, y: web.y - 1, text: "WEBBED", color: "#e8eef6", life: 40, vy: -0.06 });
                if (web.hp <= 0) { _webs.delete(k); break; }
            }
        }
    }
}
// The web on this floor tile, if any: drawn from a sprite per wear level.
const _webSprites = new Map();
function _webSprite(hp) {
    let cv = _webSprites.get(hp);
    if (cv !== undefined) return cv;
    cv = null;
    try {
        if (typeof document !== "undefined" && document.createElement) {
            const el = document.createElement("canvas"); el.width = TILE_W * 2; el.height = TILE_H * 2;
            const g = el.getContext && el.getContext("2d");
            if (g && typeof g.stroke === "function") {
                const cx = TILE_W, cy = TILE_H, a = 0.35 + 0.2 * hp;
                g.strokeStyle = "rgba(232,238,246," + a + ")"; g.lineWidth = 1;
                g.save(); g.translate(cx, cy); g.scale(1, 0.5);
                const R = TILE_W * 0.62, spokes = 8;
                g.beginPath();
                for (let i = 0; i < spokes; i++) { const t = i * Math.PI * 2 / spokes; g.moveTo(0, 0); g.lineTo(Math.cos(t) * R, Math.sin(t) * R); }
                for (let ring = 1; ring <= 4; ring++) {
                    const r = R * ring / 4.4;
                    for (let i = 0; i <= spokes; i++) {
                        const t = i * Math.PI * 2 / spokes, rr = r * (i % 2 ? 0.9 : 1);
                        if (i === 0) g.moveTo(Math.cos(t) * rr, Math.sin(t) * rr); else g.lineTo(Math.cos(t) * rr, Math.sin(t) * rr);
                    }
                }
                g.stroke(); g.restore();
                cv = el;
            }
        }
    } catch (e) { cv = null; }
    _webSprites.set(hp, cv);
    return cv;
}
function drawWebOnTile(obj, px, py) {
    if (!_webs.size) return;
    const web = _webs.get(_webKey(Math.round(obj.x), Math.round(obj.y)));
    if (!web) return;
    const spr = _webSprite(Math.max(1, web.hp));
    if (spr) ctx.drawImage(spr, px - TILE_W, py);
}
