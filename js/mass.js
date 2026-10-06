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
//  FIRE used to SCOUR the floor nests, cocoons and toxin puddles a taken pylon
//  grew. Those were removed from the game, and with nothing left to burn FIRE
//  has no work-crew job: it fights.
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
// What a hauled lump pays, as a multiple of the predator's shardDrop.
//
// Was 0.35, and a kill's mass is the ONLY shard a predator gives — there is no
// separate drop, so 0.35 was the whole payout. Measured across the species
// table that made a lump worth 1 to 11 shards, and the enemies you actually
// meet first — ants and beetles — paid 1 to 5. A pylon costs 10. So an early
// player ran the two-job chain (an ELECTRIC worker to bleed the charge, a FLUX
// worker to haul it back, both taken off the line) for one or two shards.
//
// At 1.0 a lump is worth exactly what the predator was worth. The chain is the
// COST — two followers off the line for the length of a round trip — rather
// than a discount on top of it.
const MASS_VALUE_SCALE  = 1.0;
// One element per job. Anything else on worker duty has nothing to contribute,
// which is the trade-off for taking it off the line.
const MASS_NEUTRALISER  = 'electric';
const MASS_HAULER       = 'flux';     // flux already drags things — see the pylon effect
const PYLON_REPAIRER    = 'core';
// TOXIC TENDS THE CLONES. It picks one, walks with it, and mends it while it
// fights — a medic attached to the single most expensive unit you own. It does
// no damage at all; what it buys you is a clone that keeps standing.
//
// It used to be a repel cloud that shoved enemies around. Healing the thing you
// paid 25 shards and a DNA splice for is worth more than pushing a predator two
// tiles, and a clone has 3x health, so there is real value to top up.
const CLONE_MENDER      = 'toxic';
// ICE sets. An ice worker freezes where it stands into a solid block one tile
// wide that everything — enemy, ally and the player — is pushed out of. It is
// the only worker job that stops being a unit and becomes terrain.
const ICE_BLOCKER       = 'ice';

// A core worker rebuilds a broken pylon at this much progress per frame, so a
// full rebuild from nothing takes a few seconds of standing there.
const PYLON_REPAIR_RATE = 0.006;

// ── TOXIC / MEND tuning ──────────────────────────────────
// The mender stands AT its clone rather than at arm's length, because the point
// is to move with it — a medic that hangs back is one that is out of range the
// moment the clone steps forward.
const MEND_RANGE        = 1.6;   // how close it has to be to mend at all
const MEND_ESCORT       = 1.1;   // how close it tries to stay while escorting
const MEND_RATE         = 0.07;  // HP per frame → ~4.2/s, a shade over the
                                 // generator aura, which is a whole network
const MEND_COLOUR       = '#66ff66';

// ── ICE / BLOCK tuning ───────────────────────────────────
// "Just one block wide." A tile is 1.0 in world units, so a radius a shade
// over half a tile clears the tile itself and nothing more.
const ICE_BLOCK_R       = 0.62;
const ICE_BLOCK_PUSH    = 0.09;  // per frame for anything that wanders in
const ICE_FORM_FRAMES   = 45;    // the freeze-over animation
const ICE_COLOUR        = '#99ddff';
// The block's height on screen, as a multiple of TILE_H. One tile edge measures
// about 33.5px, so 1.15 makes the three cube edges match. Named because the
// DRAW needs it to draw the cube and the INPUT needs it to know where the cube
// is: the tap test used to probe 55px above the tile, where a virus sprite's
// body sits, which is 68px above the block — so tapping a block never selected
// it and the only way to open its menu was to tap the empty air above it.
const ICE_BLOCK_H_MULT  = 1.15;

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
    if (actor.element === CLONE_MENDER)     return _workMendClone(actor);
    if (actor.element === ICE_BLOCKER)      return _workIceBlock(actor);
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

// ── Tending the clones (TOXIC) ───────────────────────────
// A medic attached to the most expensive unit you own. It picks a clone, walks
// with it, and mends it while it fights.
//
// It replaced a repel cloud that shoved enemies around and did no damage. A
// clone costs shards AND a DNA splice and carries 3x the health of what it was
// cloned from, so there is both a reason to keep one alive and a lot of bar to
// top up; pushing a predator two tiles was worth less than either.

// The clone this worker should be with. A HURT one first — that is the whole
// job — and the nearest of those. With none hurt it still escorts the nearest
// live clone, because a medic that only turns up once you are bleeding is one
// that is always too late.
function _nearestCloneToTend(actor) {
    let hurt = null, hurtD = Infinity;
    let any  = null, anyD  = Infinity;
    for (const a of actors) {
        if (!a || a.dead || !a.isClone) continue;
        const d = Math.hypot(a.x - actor.x, a.y - actor.y);
        if (d > MASS_SEEK_RANGE) continue;
        if (d < anyD) { anyD = d; any = a; }
        if (a.health < (a.maxHealth || 0) && d < hurtD) { hurtD = d; hurt = a; }
    }
    return hurt || any;
}

// One frame of mending. Returns how much health went in, so a caller can tell
// "standing by a healthy clone" from "actually working".
function mendStep(actor, clone) {
    if (!clone || clone.dead) return 0;
    const cap = clone.maxHealth || 0;
    if (!(clone.health < cap)) return 0;
    const before = clone.health;
    clone.health = Math.min(cap, clone.health + MEND_RATE);
    return clone.health - before;
}

function _workMendClone(actor) {
    let clone = actor._mendTarget;
    if (!clone || clone.dead || !clone.isClone
        || Math.hypot(clone.x - actor.x, clone.y - actor.y) > MASS_SEEK_RANGE) {
        clone = actor._mendTarget = _nearestCloneToTend(actor);
    }
    if (!clone) return false;   // no clone to tend — fall through to holding station

    // It keeps STATION on the clone rather than closing to contact once and
    // stopping. The clone moves; a mender that parked where the clone used to
    // be would spend the fight out of range of the thing it is assigned to.
    const d = Math.hypot(clone.x - actor.x, clone.y - actor.y);
    if (d > MEND_ESCORT) _moveToward(actor, clone.x, clone.y, 1.1);
    else                 actor.state = 'idle';

    if (d <= MEND_RANGE) {
        const healed = mendStep(actor, clone);
        if (healed > 0 && typeof elementEffects !== 'undefined' && (frame || 0) % 8 === 0) {
            elementEffects.push({ type: 'impact', x: clone.x, y: clone.y,
                                  color: MEND_COLOUR, radius: 0.45, life: 16 });
        }
    }
    return true;
}

// ── Setting (ICE) ────────────────────────────────────────
// The one job that turns a follower into terrain. It freezes where it stands,
// snapped to the tile, and everything is pushed clear — allies included,
// because a block that your own squad can stand inside is cover, not a wall.
function freezeIntoBlock(actor) {
    if (!actor || actor.iceBlock) return false;
    actor.iceBlock   = true;
    // Snapped, so the block lines up with the floor instead of straddling two
    // tiles. y is clamped to the walkable rows.
    actor.iceBlockX  = Math.round(actor.x);
    actor.iceBlockY  = Math.max(0, Math.min(3, Math.round(actor.y)));
    actor.x = actor.iceBlockX; actor.y = actor.iceBlockY;
    actor.iceFormFrames = ICE_FORM_FRAMES;
    // Remembered rather than assumed: a follower's speed varies by stats, and
    // thawing has to give back what this one actually had.
    if (actor._preIceSpeed === undefined) actor._preIceSpeed = actor.moveSpeed;
    actor.moveSpeed = 0;
    actor.job = null;
    actor.state = 'idle';
    // Clear the tile in one step. Anything still inside a solid block after it
    // forms would be stuck in it, shoved a fraction of a tile per frame while
    // the block holds it in place.
    iceBlockShove(actor, true);
    if (typeof floatingTexts !== 'undefined') {
        floatingTexts.push({ x: actor.x, y: actor.y - 1, text: 'FROZEN SOLID',
                             color: ICE_COLOUR, life: 80, vy: -0.14 });
    }
    return true;
}

function thawIceBlock(actor) {
    if (!actor || !actor.iceBlock) return false;
    actor.iceBlock = false;
    actor.iceFormFrames = 0;
    actor.moveSpeed = actor._preIceSpeed !== undefined ? actor._preIceSpeed : actor.moveSpeed;
    actor._preIceSpeed = undefined;
    actor.stance = 'follow';
    if (typeof floatingTexts !== 'undefined') {
        floatingTexts.push({ x: actor.x, y: actor.y - 1, text: 'THAWED',
                             color: ICE_COLOUR, life: 70, vy: -0.14 });
    }
    return true;
}

// Push one thing clear of a block. `hard` covers the whole remaining gap in a
// single step, which is what formation needs.
function _iceShoveOut(a, block, hard) {
    const dx = a.x - block.x, dy = a.y - block.y;
    const d2 = dx * dx + dy * dy;
    if (d2 >= ICE_BLOCK_R * ICE_BLOCK_R) return false;
    const d = Math.sqrt(d2);
    let ux, uy;
    if (d < 0.001) { ux = 1; uy = 0; }   // standing exactly on it
    else           { ux = dx / d; uy = dy / d; }
    const gap  = ICE_BLOCK_R - d;
    const step = hard ? gap : Math.min(gap, ICE_BLOCK_PUSH);
    a.x += ux * step;
    a.y  = Math.max(0, Math.min(3, a.y + uy * step));
    return true;
}

function iceBlockShove(block, hard) {
    if (!block || !block.iceBlock) return 0;
    let moved = 0;
    for (const a of actors) {
        if (a === block || a.dead) continue;
        if (a.iceBlock) continue;    // two blocks never shove each other
        if (_iceShoveOut(a, block, hard)) moved++;
    }
    // The player too. Their position is lerped toward a target every frame, so
    // moving only the position would be undone on the next one — the target has
    // to come with it or they walk straight through.
    if (typeof player !== 'undefined' && player && _iceShoveOut(player, block, hard)) {
        player.targetX = player.x;
        player.targetY = player.y;
        moved++;
    }
    return moved;
}

// Every block, once a frame: pinned in place and holding its tile clear.
// Called from the update loop after actor movement and after the follower
// separation pass, so the block has the last word on where things are.
function iceBlockTick() {
    if (typeof followers === 'undefined') return 0;
    let n = 0;
    for (const b of followers) {
        if (!b || b.dead || !b.iceBlock) continue;
        b.x = b.iceBlockX; b.y = b.iceBlockY;   // pinned, whatever pushed it
        if (b.iceFormFrames > 0) b.iceFormFrames--;
        iceBlockShove(b, false);
        n++;
    }
    return n;
}

function _workIceBlock(actor) {
    if (!actor.iceBlock) freezeIntoBlock(actor);
    // A block does nothing else, ever — it does not walk, fight or seek. The
    // per-frame pinning and shoving is iceBlockTick's job so that it still runs
    // on a frame where the work tick is skipped.
    actor.state = 'idle';
    actor.x = actor.iceBlockX;
    actor.y = actor.iceBlockY;
    return true;
}

// ── Duty assignment ──────────────────────────────────────
// Only these have a job, so putting anything else on the crew would silently do
// nothing — say so rather than accepting it.
function workerElements() {
    return [MASS_NEUTRALISER, MASS_HAULER, PYLON_REPAIRER, CLONE_MENDER, ICE_BLOCKER];
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
    if (element === CLONE_MENDER)     return 'TEND CLONE';
    if (element === ICE_BLOCKER)      return 'SET BLOCK';
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

// `quiet` suppresses the per-follower announcement. A GROUP order sets a dozen
// at once, and a dozen identical "ASSIGNED TO WORK CREW" lines stacked on top
// of each other is noise — the caller says it once for the whole group instead.
function setFollowerDuty(actor, duty, quiet) {
    if (!actor) return false;
    if (duty === 'worker' && !canWorkMass(actor)) {
        if (!quiet) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
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
        actor._mendTarget  = null;
        // And a block melts. Coming off the crew IS the thaw — the long hold
        // that offers it is the same menu that assigns duty, so there is one
        // instruction rather than two that could disagree about whether a
        // follower is still terrain.
        thawIceBlock(actor);
    }
    if (!quiet) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
        text: duty === 'worker' ? 'ASSIGNED TO WORK CREW' : 'BACK ON THE LINE',
        color: duty === 'worker' ? '#00ccaa' : '#0f8', life: 100, vy: -0.25, size: 12 });
    return true;
}

// RE-ROLL: send a follower back to the crystal to be made again. Clones and
// ghost-phages are summoned, not recruited, so they have nothing to re-roll.
function canRerollFollower(actor) {
    return !!actor && !actor.dead && actor.team === 'green' && actor.isFollower
        && !actor.isClone && !actor.ghostphageLife && !actor.returningToCrystal;
}

// The follower leaves every list and walks home as a fresh recruit; the arrival
// block in updateNPC (npc.js) already rolls identity for an actor with no
// personality, so clearing the identity fields is all it takes to re-roll
// element, stats, role and traits there. Anything in hand is put down first.
function startFollowerReroll(actor) {
    if (!canRerollFollower(actor)) return false;
    setFollowerDuty(actor, 'fighter', true);   // drops mass, thaws a block, frees the post
    actor.job = null;
    actor.stance = 'follow';
    const fi = followers.indexOf(actor);
    if (fi >= 0) followers.splice(fi, 1);
    const list = followerByElement[actor.element];
    if (list) { const li = list.indexOf(actor); if (li >= 0) list.splice(li, 1); }
    actor.isFollower = false;
    actor.returningToCrystal = true;
    actor.personality = null;
    actor.combatTrait = null;
    actor.naturalTrait = null;
    actor.perk = null;
    actor.convertFlash = 20;
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
        text: 'RE-ROLLING AT THE CRYSTAL', color: '#0df', life: 100, vy: -0.25, size: 12 });
    return true;
}

function toggleFollowerDuty(actor) {
    return setFollowerDuty(actor, actor && actor.duty === 'worker' ? 'fighter' : 'worker');
}

// Put every carried lump back on the floor where its carrier is standing.
//
// A change of scene rebuilds followers[] from the save, so a carrier that was
// mid-haul stops existing. The lump it held would keep state CARRIED and a
// reference to a follower nobody can see — permanently uncollectable, because
// _workHaul only picks up a lump that is NEUTRAL and has no carrier.
//
// The same rule the save already used: a carried lump becomes an ordinary one
// lying where the carrier was.
function dropCarriedMass() {
    let dropped = 0;
    for (const m of chargedMass) {
        if (m.state !== MASS_STATE.CARRIED && !m.carrier) continue;
        if (m.carrier) m.carrier.carryingMass = null;
        m.carrier = null;
        m.state   = MASS_STATE.NEUTRAL;
        dropped++;
    }
    return dropped;
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
