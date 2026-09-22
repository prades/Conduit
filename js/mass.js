// ─────────────────────────────────────────────────────────
//  CHARGED MASS — predator drops as a logistics problem
//
//  A dead predator leaves a lump of live, electrically charged mass. It is not
//  a pickup: walking over it does nothing, and it sits there crackling until
//  two different jobs get done to it.
//
//     1. NEUTRALISE — an ELECTRIC follower on worker duty bleeds the charge off
//     2. HAUL       — a FLUX follower on worker duty drags the inert lump back
//                     to the Crystal, where it becomes shards
//
//  CORE workers do the other job on this page: a pylon that loses its health is
//  not gone, it is BROKEN, and a core worker rebuilds it in place.
//
//  FIRE workers SCOUR: they burn back the growth an infestation leaves behind —
//  toxin patches, grown nests, cocoons. The job itself lives in js/infest.js
//  next to the things it burns; only the duty dispatch is here.
//
//  So kills stop being free income. Followers split into FIGHTERS, who behave
//  as they always have, and WORKERS, who ignore combat to run one job each. A
//  player who fields no workers watches the battlefield fill with charge they
//  cannot spend, their pylons stay in pieces, and the infestation keeps the
//  ground it has taken.
// ─────────────────────────────────────────────────────────

let chargedMass = [];

const MASS_STATE = { CHARGED: 'charged', NEUTRAL: 'neutral', CARRIED: 'carried' };

// How long an electric worker has to stand on a lump to bleed it, in frames.
const MASS_NEUTRALISE_FRAMES = 110;
// How close a worker must be to act on one.
const MASS_WORK_RANGE   = 0.85;
// How far a worker will travel to find a job.
const MASS_SEEK_RANGE   = 26;
// Shards are worth a fraction of what the predator would have dropped whole —
// the chain is the cost of collecting them.
const MASS_VALUE_SCALE  = 0.35;
// One element per job. Anything else on worker duty has nothing to contribute,
// which is the trade-off for taking it off the line.
const MASS_NEUTRALISER  = 'electric';
const MASS_HAULER       = 'flux';     // flux already drags things — see the pylon effect
const PYLON_REPAIRER    = 'core';
// The fourth worker element is SCOUR_ELEMENT in js/infest.js, which the page
// loads after this file — so it is read at call time rather than copied here.
// A second literal 'fire' in this file is exactly how the two drift apart.

// A core worker rebuilds a broken pylon at this much progress per frame, so a
// full rebuild from nothing takes a few seconds of standing there.
const PYLON_REPAIR_RATE = 0.006;

function spawnChargedMass(x, y, value) {
    const v = Math.max(1, Math.round(value));
    chargedMass.push({
        x, y, value: v,
        state: MASS_STATE.CHARGED,
        progress: 0,          // neutralisation progress, 0..1
        carrier: null,
        bob: Math.random() * Math.PI * 2,
        spin: Math.random() * Math.PI * 2,
    });
    return chargedMass[chargedMass.length - 1];
}

// The nearest lump in a given state. Carried lumps are never a valid target.
function nearestChargedMass(x, y, state, maxDist) {
    let best = null, bestD = maxDist === undefined ? MASS_SEEK_RANGE : maxDist;
    for (const m of chargedMass) {
        if (m.state !== state) continue;
        if (m.carrier) continue;
        const d = Math.hypot(m.x - x, m.y - y);
        if (d < bestD) { bestD = d; best = m; }
    }
    return best;
}

function massCounts() {
    let charged = 0, neutral = 0, carried = 0, value = 0;
    for (const m of chargedMass) {
        if (m.state === MASS_STATE.CHARGED) charged++;
        else if (m.state === MASS_STATE.NEUTRAL) neutral++;
        else carried++;
        value += m.value;
    }
    return { charged, neutral, carried, value, total: chargedMass.length };
}

// ── Per-frame bookkeeping ────────────────────────────────
function updateChargedMass() {
    for (let i = chargedMass.length - 1; i >= 0; i--) {
        const m = chargedMass[i];
        m.bob  += 0.05;
        m.spin += m.state === MASS_STATE.CHARGED ? 0.06 : 0.02;

        // A carried lump rides its carrier, and is dropped if that carrier dies.
        if (m.state === MASS_STATE.CARRIED) {
            const c = m.carrier;
            if (!c || c.dead) {
                m.state = MASS_STATE.NEUTRAL;
                m.carrier = null;
                continue;
            }
            m.x = c.x; m.y = c.y;
            // Delivered.
            if (typeof crystal !== 'undefined' && Math.hypot(c.x - crystal.x, c.y - crystal.y) < 1.4) {
                shardCount += m.value;
                if (typeof saveShards === 'function') saveShards();
                floatingTexts.push({
                    x: canvas.width / 2, y: canvas.height / 2 - 70,
                    text: '+' + m.value + ' SHARDS DELIVERED', color: '#ffdd44', life: 110, vy: -0.3, size: 13,
                });
                if (typeof elementEffects !== 'undefined') {
                    for (let k = 0; k < 5; k++) {
                        elementEffects.push({ type: 'impact', x: crystal.x, y: crystal.y,
                                              color: '#ffdd44', radius: 0.7, life: 30 });
                    }
                }
                c.carryingMass = null;
                chargedMass.splice(i, 1);
            }
        }
    }
}

// ── Worker duty ──────────────────────────────────────────
// Returns true when the worker has taken over this frame, so the normal
// follower AI is skipped.
function followerWorkTick(actor) {
    if (!actor || actor.dead || actor.duty !== 'worker') return false;
    // A worker with an explicit TASK still finishes it first — building,
    // reconstructing, capturing, attacking, an element job. Every one of those
    // clears itself when it is done.
    //
    // A "move" order is the exception, and it is why this used to be `if
    // (actor.job) return false`. It is not a task, it is a standing post: it
    // never completes, clearing only if the unit drops below half health or the
    // target tile vanishes. So positioning a follower and then putting it on
    // the crew benched it permanently — the work tick deferred forever to an
    // order that would never finish. A worker with a post still holds it when
    // there is no chore in reach, because this returns false and the move
    // handler runs; it just no longer means "never work again".
    if (actor.job && actor.job.type !== 'move') return false;

    if (actor.element === MASS_NEUTRALISER) return _workNeutralise(actor);
    if (actor.element === MASS_HAULER)      return _workHaul(actor);
    if (actor.element === PYLON_REPAIRER)   return _workRepair(actor);
    if (typeof SCOUR_ELEMENT !== 'undefined' && actor.element === SCOUR_ELEMENT)
        return _workScour(actor);
    return false;   // any other element has no job to do here
}

function _moveToward(actor, tx, ty, speedMult) {
    const dx = tx - actor.x, dy = ty - actor.y;
    const d  = Math.hypot(dx, dy);
    if (d < 1e-6) return 0;
    const sp = (actor.moveSpeed || 0.02) * (speedMult || 1);
    actor.x += (dx / d) * sp;
    actor.y += (dy / d) * sp;
    actor.walkCycle = (actor.walkCycle || 0) + sp * 40;
    return d;
}

function _workNeutralise(actor) {
    const m = actor._massTarget && actor._massTarget.state === MASS_STATE.CHARGED && !actor._massTarget.carrier
        ? actor._massTarget
        : (actor._massTarget = nearestChargedMass(actor.x, actor.y, MASS_STATE.CHARGED));
    if (!m) return false;

    const d = Math.hypot(m.x - actor.x, m.y - actor.y);
    if (d > MASS_WORK_RANGE) { _moveToward(actor, m.x, m.y, 1.1); return true; }

    // In range — bleed the charge off.
    m.progress += 1 / MASS_NEUTRALISE_FRAMES;
    actor.state = 'idle';
    if (typeof elementEffects !== 'undefined' && (frame || 0) % 8 === 0) {
        elementEffects.push({ type: 'impact', x: m.x, y: m.y, color: '#ffee33', radius: 0.35, life: 16 });
    }
    if (m.progress >= 1) {
        m.progress = 1;
        m.state = MASS_STATE.NEUTRAL;
        actor._massTarget = null;
        floatingTexts.push({ x: m.x, y: m.y - 1, text: 'NEUTRALISED', color: '#ffee33', life: 50, vy: -0.06 });
    }
    return true;
}

function _workHaul(actor) {
    // Already carrying — take it home.
    if (actor.carryingMass) {
        const m = actor.carryingMass;
        if (m.state !== MASS_STATE.CARRIED || m.carrier !== actor) { actor.carryingMass = null; return false; }
        if (typeof crystal !== 'undefined') { _moveToward(actor, crystal.x, crystal.y, 1.05); return true; }
        return false;
    }

    const m = actor._massTarget && actor._massTarget.state === MASS_STATE.NEUTRAL && !actor._massTarget.carrier
        ? actor._massTarget
        : (actor._massTarget = nearestChargedMass(actor.x, actor.y, MASS_STATE.NEUTRAL));
    if (!m) return false;

    const d = Math.hypot(m.x - actor.x, m.y - actor.y);
    if (d > MASS_WORK_RANGE) { _moveToward(actor, m.x, m.y, 1.1); return true; }

    m.state   = MASS_STATE.CARRIED;
    m.carrier = actor;
    actor.carryingMass = m;
    actor._massTarget  = null;
    floatingTexts.push({ x: m.x, y: m.y - 1, text: 'HAULING', color: '#00ccaa', life: 45, vy: -0.06 });
    return true;
}

// ── Pylon repair (CORE) ──────────────────────────────────
// A pylon that loses its health is flagged destroyed but keeps its tile, its
// element and its mode. Nothing used to draw it, so it looked gone; it is now
// drawn as wreckage and a core worker can put it back up exactly as it was.
function isBrokenPylon(t) {
    return !!(t && t.pillar && t.destroyed);
}

function nearestBrokenPylon(x, y, team, maxDist) {
    if (typeof world === 'undefined') return null;
    let best = null, bestD = maxDist === undefined ? MASS_SEEK_RANGE : maxDist;
    for (const t of world) {
        if (!isBrokenPylon(t)) continue;
        if (team && t.pillarTeam !== team) continue;
        const d = Math.hypot(t.x - x, t.y - y);
        if (d < bestD) { bestD = d; best = t; }
    }
    return best;
}

// Put a broken pylon back up, keeping whatever it was before it fell.
function restoreBrokenPylon(t) {
    if (!isBrokenPylon(t)) return false;
    t.destroyed = false;
    t.reconstructing = false;
    t.reconstructProgress = 0;
    t.pendingDestroy = false;
    t.health = Math.max(1, Math.round((t.maxHealth || 20) * 0.6));
    return true;
}

function _workRepair(actor) {
    const t = actor._pylonTarget && isBrokenPylon(actor._pylonTarget)
        ? actor._pylonTarget
        : (actor._pylonTarget = nearestBrokenPylon(actor.x, actor.y, 'green'));
    if (!t) return false;

    const d = Math.hypot(t.x - actor.x, t.y - actor.y);
    if (d > MASS_WORK_RANGE) { _moveToward(actor, t.x, t.y, 1.1); return true; }

    t.reconstructing = true;
    t.reconstructProgress = Math.min(1, (t.reconstructProgress || 0) + PYLON_REPAIR_RATE);
    actor.state = 'idle';
    if (typeof elementEffects !== 'undefined' && (frame || 0) % 10 === 0) {
        elementEffects.push({ type: 'impact', x: t.x, y: t.y, color: '#00ccaa', radius: 0.4, life: 18 });
    }
    if (t.reconstructProgress >= 1) {
        restoreBrokenPylon(t);
        actor._pylonTarget = null;
        floatingTexts.push({ x: t.x, y: t.y - 1, text: 'PYLON REBUILT', color: '#00ccaa', life: 60, vy: -0.06 });
        if (typeof _cacheAge !== 'undefined') _cacheAge = -999;   // let the caches see it again
    }
    return true;
}

// ── Scouring the infestation (FIRE) ──────────────────────
// The chore list, the ranking and the burning all live in js/infest.js, with the
// growth they act on. This is only the walk-there-and-work loop, shaped like the
// three above it.
function _workScour(actor) {
    if (typeof nearestScourChore !== 'function') return false;

    let chore = actor._scourTarget;
    if (!scourChoreStillGood(chore)) {
        chore = actor._scourTarget = nearestScourChore(actor.x, actor.y);
    }
    if (!chore) return false;

    const d = Math.hypot(chore.x - actor.x, chore.y - actor.y);
    if (d > MASS_WORK_RANGE) { _moveToward(actor, chore.x, chore.y, 1.05); return true; }

    actor.state = 'idle';
    const finished = scourStep(chore);
    if (typeof elementEffects !== 'undefined' && (frame || 0) % 7 === 0) {
        elementEffects.push({ type: 'impact', x: chore.x, y: chore.y,
                              color: SCOUR_COLOUR, radius: 0.38, life: 16 });
    }
    if (finished) actor._scourTarget = null;
    return true;
}

// ── Duty assignment ──────────────────────────────────────
// Only these have a job, so putting anything else on the crew would silently do
// nothing — say so rather than accepting it.
function workerElements() {
    const list = [MASS_NEUTRALISER, MASS_HAULER, PYLON_REPAIRER];
    if (typeof SCOUR_ELEMENT === 'string') list.push(SCOUR_ELEMENT);
    return list;
}

function canWorkMass(actor) {
    return !!actor && workerElements().indexOf(actor.element) >= 0;
}

// "ELECTRIC, FLUX, CORE AND FIRE". Read off the list rather than written out,
// because a hardcoded sentence is how the refusal ends up naming three elements
// after a fourth has been added.
function workerElementsLabel() {
    const names = workerElements().map(e => e.toUpperCase());
    if (names.length <= 1) return names[0] || '';
    return names.slice(0, -1).join(', ') + ' AND ' + names[names.length - 1];
}

// What a given worker would actually do, for the UI to label.
function workerJobLabel(element) {
    if (element === MASS_NEUTRALISER) return 'NEUTRALISE';
    if (element === MASS_HAULER)      return 'HAUL';
    if (element === PYLON_REPAIRER)   return 'REPAIR';
    if (typeof SCOUR_ELEMENT !== 'undefined' && element === SCOUR_ELEMENT) return 'SCOUR';
    return null;
}

// Changing duty is a NEW instruction, so it releases a standing position order
// and puts the unit back to following. Without the stance reset it would skip
// the whole follow block in updateRTSNPC — which is gated on stance being
// "follow" — and fall through to idle wandering.
//
// Transient tasks are left alone: they finish on their own, and cancelling a
// build mid-way would leave a pylon constructing with no builder.
function releaseStandingPost(actor) {
    if (!actor) return false;
    if (actor.job && actor.job.type === 'move') actor.job = null;
    if (actor.stance === 'hold') actor.stance = 'follow';
    return true;
}

function setFollowerDuty(actor, duty) {
    if (!actor) return false;
    if (duty === 'worker' && !canWorkMass(actor)) {
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
            text: 'ONLY ' + workerElementsLabel() + ' CAN WORK', color: '#f88', life: 110, vy: -0.25, size: 12 });
        return false;
    }
    actor.duty = duty;
    releaseStandingPost(actor);
    if (duty !== 'worker') {
        // Drop anything in hand when pulled back to the line.
        if (actor.carryingMass) {
            actor.carryingMass.state   = MASS_STATE.NEUTRAL;
            actor.carryingMass.carrier = null;
            actor.carryingMass = null;
        }
        actor._massTarget  = null;
        actor._pylonTarget = null;
        actor._scourTarget = null;
    }
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
        text: duty === 'worker' ? 'ASSIGNED TO WORK CREW' : 'BACK ON THE LINE',
        color: duty === 'worker' ? '#00ccaa' : '#0f8', life: 100, vy: -0.25, size: 12 });
    return true;
}

function toggleFollowerDuty(actor) {
    return setFollowerDuty(actor, actor && actor.duty === 'worker' ? 'fighter' : 'worker');
}

// ── Persistence ──────────────────────────────────────────
// Carrier references cannot survive JSON, so a carried lump is saved as an
// ordinary neutral one lying where the carrier was standing.
function serialiseChargedMass() {
    return chargedMass.map(m => ({
        x: m.x, y: m.y, v: m.value,
        s: m.state === MASS_STATE.CARRIED ? MASS_STATE.NEUTRAL : m.state,
        p: m.progress,
    }));
}

function restoreChargedMass(list) {
    // Emptied in place rather than reassigned: anything already holding a
    // reference to the array keeps pointing at the live one.
    chargedMass.length = 0;
    if (!Array.isArray(list)) return;
    for (const e of list) {
        if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) continue;
        const m = spawnChargedMass(e.x, e.y, e.v);
        m.state    = (e.s === MASS_STATE.NEUTRAL) ? MASS_STATE.NEUTRAL : MASS_STATE.CHARGED;
        m.progress = Number.isFinite(e.p) ? e.p : 0;
    }
}

// ── Drawing ──────────────────────────────────────────────
function drawChargedMass(m, px, py) {
    const charged = m.state === MASS_STATE.CHARGED;
    const lift    = Math.sin(m.bob) * 3;
    const cx = px, cy = py - 16 + lift;
    const col = charged ? '#ffee33' : '#00ccaa';

    ctx.save();

    // Ground glow
    const g = ctx.createRadialGradient(cx, py + 2, 1, cx, py + 2, 22);
    g.addColorStop(0, charged ? 'rgba(255,238,51,0.30)' : 'rgba(0,204,170,0.22)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.translate(cx, py + 2); ctx.scale(1, 0.4); ctx.translate(-cx, -(py + 2));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, py + 2, 22, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // The lump — a rough polygon so it reads as mass rather than a gem
    ctx.beginPath();
    const R = 9;
    for (let i = 0; i < 7; i++) {
        const a = m.spin + i * (Math.PI * 2 / 7);
        const r = R * (0.72 + 0.28 * Math.abs(Math.sin(i * 2.3 + m.spin * 0.5)));
        const vx = cx + Math.cos(a) * r, vy = cy + Math.sin(a) * r * 0.78;
        if (i === 0) ctx.moveTo(vx, vy); else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fillStyle = charged ? 'rgba(60,54,10,0.95)' : 'rgba(10,42,38,0.95)';
    ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 1.4;
    ctx.stroke();

    if (charged) {
        // Arcs crackling off it — the visual cue that it cannot be touched yet
        ctx.strokeStyle = 'rgba(255,238,51,0.85)';
        ctx.lineWidth = 1;
        for (let k = 0; k < 3; k++) {
            const a0 = m.spin * 2 + k * 2.1 + (frame || 0) * 0.15;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a0) * 4, cy + Math.sin(a0) * 3);
            ctx.lineTo(cx + Math.cos(a0 + 0.6) * 13, cy + Math.sin(a0 + 0.6) * 8);
            ctx.stroke();
        }
        // Neutralisation progress
        if (m.progress > 0) {
            ctx.strokeStyle = '#ffee33'; ctx.lineWidth = 2.4;
            ctx.beginPath();
            ctx.arc(cx, cy, 15, -Math.PI / 2, -Math.PI / 2 + m.progress * Math.PI * 2);
            ctx.stroke();
        }
    }

    // Worth, so the player can see whether the trip is earning anything
    ctx.fillStyle = col;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('◈ ' + m.value, cx, cy - 15);

    ctx.restore();
}
