// ─────────────────────────────────────────────────────────
//  CHARGED MASS — predator drops as a logistics problem
//
//  A dead predator leaves a lump of live, electrically charged mass. It is not
//  a pickup: walking over it does nothing, and it sits there crackling until
//  two different jobs get done to it.
//
//     1. NEUTRALISE — an ELECTRIC follower on worker duty bleeds the charge off
//     2. HAUL       — a CORE follower on worker duty carries the inert lump
//                     back to the Crystal, where it becomes shards
//
//  So kills stop being free income. Followers split into FIGHTERS, who behave
//  as they always have, and WORKERS, who ignore combat to run the chain. A
//  player who fields no workers watches the battlefield fill with charge they
//  cannot spend.
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
// Only these two elements can do the work. Anything else on worker duty has
// nothing to contribute, which is the trade-off for taking it off the line.
const MASS_NEUTRALISER  = 'electric';
const MASS_HAULER       = 'core';

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
    // A worker with an explicit order from the player still obeys it.
    if (actor.job) return false;

    if (actor.element === MASS_NEUTRALISER) return _workNeutralise(actor);
    if (actor.element === MASS_HAULER)      return _workHaul(actor);
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

// ── Duty assignment ──────────────────────────────────────
// Only electric and core have work to do, so putting anything else on the
// crew would silently do nothing — say so rather than accepting it.
function canWorkMass(actor) {
    return !!actor && (actor.element === MASS_NEUTRALISER || actor.element === MASS_HAULER);
}

function setFollowerDuty(actor, duty) {
    if (!actor) return false;
    if (duty === 'worker' && !canWorkMass(actor)) {
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
            text: 'ONLY ELECTRIC AND CORE CAN WORK', color: '#f88', life: 110, vy: -0.25, size: 12 });
        return false;
    }
    actor.duty = duty;
    if (duty !== 'worker') {
        // Drop anything in hand when pulled back to the line.
        if (actor.carryingMass) {
            actor.carryingMass.state   = MASS_STATE.NEUTRAL;
            actor.carryingMass.carrier = null;
            actor.carryingMass = null;
        }
        actor._massTarget = null;
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
