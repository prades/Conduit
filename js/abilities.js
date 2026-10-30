// ─────────────────────────────────────────────────────────
//  INSECT ABILITIES — charge-up specials, and the SCOUT leap
//
//  Every ability follows the same four-phase cycle so the player can read and
//  counter it:
//
//     charging → ready → winding (telegraph) → active
//
//  Charge only builds while an insect is actually engaged, so ambient
//  wanderers never leap or slam at nothing. The windup is deliberately visible
//  (name plate + flaring charge ring) — that telegraph is the counterplay.
//
//  Abilities are resolved by class first, then species:
//     scout → LEAP
//     striker / tank / boss → the species signature special
//     nymph, worker → none (they stay chaff)
// ─────────────────────────────────────────────────────────

const ABILITY_DEFS = {
    // ── Class abilities ──
    LEAP: {
        name: 'LEAP', color: '#ffdd44',
        chargeRate: 0.55, windup: 20, duration: 26,   // duration = frames in flight
        distance: 2.8, peakLift: 30,
        // The leap is an ESCAPE, not an attack: it only fires once the insect is
        // below this fraction of its health, it jumps AWAY from the nearest foe,
        // and landing hurts nobody.
        escapeBelow: 0.4,
    },

    // ── Species signature specials ──
    MANDIBLE_FRENZY: {
        name: 'MANDIBLE FRENZY', color: '#aa55ff',
        chargeRate: 0.40, windup: 24, duration: 72,
        interval: 12, dmg: 0.55, radius: 1.6,
    },
    CARAPACE_SLAM: {
        name: 'CARAPACE SLAM', color: '#cc44ff',
        chargeRate: 0.32, windup: 30, duration: 22,   // duration = dash frames
        distance: 2.6, dmg: 1.5, radius: 1.2, knockback: 0.55,
    },
    VENOM_LANCE: {
        name: 'VENOM LANCE', color: '#8844ff',
        chargeRate: 0.34, windup: 28, duration: 120,
        dmg: 1.6, radius: 2.2, poisonEvery: 24, poisonDmg: 0.18, shred: 0.45,
    },
    WEB_SNARE: {
        name: 'WEB SNARE', color: '#cceeaa',
        chargeRate: 0.30, windup: 26, duration: 1,
        radius: 2.6, slowFrames: 300, slowFactor: 0.18,
    },
    BLADE_FLURRY: {
        name: 'BLADE FLURRY', color: '#44dd55',
        chargeRate: 0.38, windup: 22, duration: 40,
        interval: 13, dmg: 1.0, radius: 1.8,
    },
    BLINDING_DUST: {
        name: 'BLINDING DUST', color: '#dd8822',
        chargeRate: 0.30, windup: 26, duration: 150,
        radius: 3.0, slowFrames: 180, slowFactor: 0.45,
        shred: 0.55, dotEvery: 30, dotDmg: 0.12,
    },
};

const SPECIES_ABILITY = {
    ant:      'MANDIBLE_FRENZY',
    beetle:   'CARAPACE_SLAM',
    scorpion: 'VENOM_LANCE',
    spider:   'WEB_SNARE',
    mantis:   'BLADE_FLURRY',
    moth:     'BLINDING_DUST',
};

function resolveAbilityKey(speciesName, className) {
    if (className === 'worker' || className === 'nymph') return null;
    if (className === 'scout') return 'LEAP';
    return SPECIES_ABILITY[speciesName] || null;
}

// ── Slow plumbing ────────────────────────────────────────
// slowFactor was written in eight places across the codebase and read in none:
// nothing ever scaled movement by it, so every slow in the game — web shots,
// blinding dust, the ice moves — was purely cosmetic. Rather than edit ~35
// movement sites, the factor is applied to moveSpeed once per frame in
// updateStatusEffects, mirroring the existing _empBaseSpeed pattern.
// Last writer wins on the factor, longest duration wins on the timer. Keeping
// "strongest wins" instead would be worse: a slow that is refreshed every few
// frames would latch a one-off 0% freeze for as long as it kept topping the
// timer up.
function applySlow(actor, frames, factor) {
    if (!actor || actor.dead) return;
    actor.slowFactor = Math.max(0, factor);
    actor.slowed     = Math.max(actor.slowed || 0, frames);
}

// Called for every actor from updateStatusEffects.
function tickSlowSpeed(actor) {
    // Capture a clean base the first time we see this actor moving. Guarded
    // against attack state, which parks moveSpeed at 0. A slow or haste already on it does not block the capture: moveSpeed is
    // only ever scaled HERE, from the base, so before there is a base it is
    // still the unscaled speed. Requiring "not slowed" meant a follower that
    // first moved while hasted never got a base, and so never went any faster.
    if (actor.baseMoveSpeed === undefined) {
        if (actor.state !== 'attack' && actor.moveSpeed > 0) actor.baseMoveSpeed = actor.moveSpeed;
        else return;
    }
    if (actor.state === 'attack') return;   // deliberately parked at 0
    if (actor.slowed > 0) {
        actor.moveSpeed = actor.baseMoveSpeed * Math.max(0, actor.slowFactor ?? 1);
    } else if (actor.slowFactor !== 1 || actor.moveSpeed !== actor.baseMoveSpeed) {
        actor.slowFactor = 1;
        actor.moveSpeed  = actor.baseMoveSpeed;
    }
}

// ── FACING ───────────────────────────────────────────────
// A predator must look at what it is hitting. The melee attack state returns
// before predator.js's HEAD CONTROL block ever runs, so without this a predator
// swings and casts facing whatever direction it last happened to walk.
//
// Lives in this module because both the attack state and every ability need it,
// and this is the file the ability tests load.
//
// The body turns smoothly so it reads as the creature rotating in place; the
// head tracks at double that rate so the face locks on first.
function _faceHead(pred, angle, rate) {
    let diff = angle - (pred.headAngle || 0);
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    pred.headAngle = (pred.headAngle || 0) + diff * rate;
}

// Turning happens in ANGLE space, not by lerping the direction vector.
// Lerping cannot complete an exact 180° turn: the vector passes through (0,0)
// and renormalises straight back to where it started, so a predator with a
// follower directly behind it would spin its wheels forever without turning.
function _turnBody(pred, want, rate) {
    const cur = Math.atan2(pred.dirY, pred.dirX);
    let diff = want - cur;
    while (diff >  Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const na = cur + diff * rate;
    pred.dirX = Math.cos(na);
    pred.dirY = Math.sin(na);
}

// rate 1 snaps instantly; the default eases round over a few frames.
function faceToward(pred, tx, ty, rate) {
    const dx = tx - pred.x, dy = ty - pred.y;
    if (!(Math.hypot(dx, dy) > 1e-6)) return;
    const r = rate === undefined ? 0.25 : rate;
    const want = Math.atan2(dy, dx);
    _turnBody(pred, want, r);
    _faceHead(pred, want, Math.min(1, r * 2));
}

// Scorpions, spiders and moths shoot from the abdomen, so aiming at a target
// means turning the REAR toward it. The head still looks back over the shoulder.
function faceAbdomenToward(pred, tx, ty, rate) {
    const dx = tx - pred.x, dy = ty - pred.y;
    if (!(Math.hypot(dx, dy) > 1e-6)) return;
    const r = rate === undefined ? 0.2 : rate;
    const want = Math.atan2(dy, dx);
    _turnBody(pred, want + Math.PI, r);
    _faceHead(pred, want, r);
}

// ── Helpers ──────────────────────────────────────────────
function _abHostileTeam(pred) { return pred.isClone ? 'red' : 'green'; }
// a creature's special does not reach anything on the far side of a Photonic Shield (js/techabilities.js): it neither aims at it nor hits it
function _abWalled(pred, a) { return !pred.isClone && typeof techShieldBetween === "function" && !!techShieldBetween(pred.x, pred.y, a.x, a.y); }

function _abNearestFoe(pred, maxDist) {
    const team = _abHostileTeam(pred);
    let best = null, bestD = maxDist;
    for (const a of actors) {
        if (a === pred || a.dead || a.team !== team) continue;
        if (isNeutralBystander(a) || _abWalled(pred, a)) continue;
        const d = Math.hypot(a.x - pred.x, a.y - pred.y);
        if (d < bestD) { bestD = d; best = a; }
    }
    return best;
}

// A special's area: the foes inside it. NOT the player — a predator hurts the
// player only by biting them up close (PLAYER_BITE_RANGE, js/predator.js), never
// with a shot, a blast or a special.
function _abForEachFoeInRadius(pred, radius, fn) {
    const team = _abHostileTeam(pred);
    const r2 = radius * radius;
    for (const a of actors) {
        if (a === pred || a.dead || a.team !== team) continue;
        if (isNeutralBystander(a)) continue;
        const dx = a.x - pred.x, dy = a.y - pred.y;
        if (dx * dx + dy * dy <= r2 && !_abWalled(pred, a)) fn(a);
    }
}

function _abHurt(pred, victim, amount) {
    applyDamage(victim, amount, pred);
}

function _abBurst(pred, color, radius, life, count) {
    for (let i = 0; i < (count || 1); i++) {
        elementEffects.push({
            type: 'impact', color,
            x: pred.x + (Math.random() - 0.5) * radius,
            y: pred.y + (Math.random() - 0.5) * radius,
            radius: radius * 0.5, life: life || 26,
        });
    }
}

function _abSay(pred, text, color) {
    floatingTexts.push({ world: true, x: pred.x, y: pred.y, text, color, life: 42, vy: -0.06 });
}

// Where this ability is pointed. Recomputed each windup frame so the telegraph
// tracks a target that is still moving.
function _abAimPoint(pred, def) {
    const reach = pred.abilityKey === 'LEAP' ? 6
                : pred.abilityKey === 'CARAPACE_SLAM' ? 5
                : Math.max(2, def.radius || 2) + 1;
    const foe = _abNearestFoe(pred, reach);
    if (!foe) return null;
    // A leap is an escape, so the windup turns to face AWAY from the foe.
    if (pred.abilityKey === 'LEAP') return { x: 2 * pred.x - foe.x, y: 2 * pred.y - foe.y };
    return { x: foe.x, y: foe.y };
}

// ── Charge / phase machine ───────────────────────────────
function initAbility(pred) {
    const key = resolveAbilityKey(pred.speciesName, pred.className);
    pred.abilityKey   = key;
    pred.abilityDef   = key ? ABILITY_DEFS[key] : null;
    pred.abilityCharge = 0;
    pred.abilityPhase  = 'charging';   // charging | ready | winding | active
    pred.abilityTimer  = 0;
    pred.abilityHits   = 0;
    pred.leapLift      = 0;
}

// Charge builds only while the insect has a reason to. A grazing wanderer that
// has not been provoked stays idle, so the player is never ambushed by an
// ability from something that was not yet a threat.
function _abEngaged(pred) {
    if (pred.isClone) return true;
    if (pred.provoked) return true;
    if (typeof alertActive !== 'undefined' && alertActive) return true;
    return pred.state === 'hunt' || pred.state === 'attack';
}

// Is the ability worth firing right now?
function _abShouldFire(pred, def) {
    switch (pred.abilityKey) {
        case 'LEAP': {
            // Only to get away: low on health with something close enough to
            // be a threat. A healthy scout never leaps, at a foe or otherwise.
            if (!(pred.maxHealth > 0) || pred.health / pred.maxHealth >= def.escapeBelow) return false;
            const foe = _abNearestFoe(pred, 4.5);
            return !!foe;
        }
        case 'WEB_SNARE':
        case 'BLINDING_DUST':
            return !!_abNearestFoe(pred, def.radius);
        case 'CARAPACE_SLAM': {
            const foe = _abNearestFoe(pred, 5);
            return !!foe && Math.hypot(foe.x - pred.x, foe.y - pred.y) > 1.0;
        }
        default:
            return !!_abNearestFoe(pred, def.radius || 2);
    }
}

// Returns true when the ability has taken control of this frame — the caller
// must then skip its normal AI.
function abilityTick(pred) {
    if (pred.dead) return false;
    if (pred.abilityDef === undefined) initAbility(pred);
    const def = pred.abilityDef;
    if (!def) return false;

    // ── ACTIVE ──
    if (pred.abilityPhase === 'active') {
        pred.abilityTimer--;
        const took = _abRunActive(pred, def);
        if (pred.abilityTimer <= 0) {
            _abEndActive(pred, def);
            pred.abilityPhase  = 'charging';
            pred.abilityCharge = 0;
            pred.abilityHits   = 0;
        }
        return took;
    }

    // ── GLITCHED (an equip card's Static Lock, js/cards.js): a wind-up it is in fails, and it cannot start one, until the glitch is over ──
    if (pred.glitched > 0 && pred.abilityPhase === 'winding') { pred.abilityPhase = 'ready'; pred.abilityTimer = 0; return false; }

    // ── WINDING (telegraph) ──
    if (pred.abilityPhase === 'winding') {
        pred.abilityTimer--;
        // Rooted, but still turning: a windup aimed away from its target reads
        // as a bug rather than as a telegraph.
        const aim = _abAimPoint(pred, def) || pred.abilityAim;
        if (aim) { pred.abilityAim = aim; faceToward(pred, aim.x, aim.y, 0.3); }
        if (pred.abilityTimer <= 0) {
            pred.abilityPhase = 'active';
            pred.abilityTimer = Math.max(1, def.duration);
            pred.abilityHits  = 0;
            _abStartActive(pred, def);
        }
        // A winding insect is rooted — that is what makes the telegraph fair.
        return true;
    }

    // ── CHARGING / READY ──
    if (pred.abilityCharge < 100) {
        if (_abEngaged(pred)) pred.abilityCharge = Math.min(100, pred.abilityCharge + def.chargeRate);
        return false;
    }
    pred.abilityPhase = 'ready';
    if (!(pred.glitched > 0) && _abShouldFire(pred, def)) {
        pred.abilityPhase = 'winding';
        pred.abilityTimer = def.windup;
        _abSay(pred, def.name + '!', def.color);
        _abBurst(pred, def.color, 1.0, 22, 3);
    }
    return false;
}

function _abStartActive(pred, def) {
    switch (pred.abilityKey) {
        case 'LEAP': {
            const foe = _abNearestFoe(pred, 5.5);
            let ax, ay;
            if (foe) {
                // Directly away from the thing it is escaping.
                ax = pred.x - foe.x; ay = pred.y - foe.y;
            } else {
                ax = -pred.dirX; ay = -pred.dirY;
            }
            if (!(Math.hypot(ax, ay) > 1e-6)) { ax = 1; ay = 0; }
            const len = Math.hypot(ax, ay) || 1;
            const dist = pred.leapDistance || def.distance;   // (a clone's POUNCE upgrade makes its escape leap longer: js/mutator.js)
            pred.leapFromX = pred.x; pred.leapFromY = pred.y;
            // The landing has to be floor with a clear line to it (the facility's walls and props): a shorter leap when it is not, and none at all when there is nowhere to go.
            let k = 1;
            const _over = (x, y) => !pred.isClone && typeof techShieldBetween === "function" && !!techShieldBetween(pred.x, pred.y, x, y);   // (nor over a Photonic Shield: js/techabilities.js)
            if (typeof facilityLosFrom === "function") while (k > 0.19 && (!facilityLosFrom(pred.x, pred.y, pred.x + (ax / len) * dist * k, pred.y + (ay / len) * dist * k) || _over(pred.x + (ax / len) * dist * k, pred.y + (ay / len) * dist * k))) k -= 0.2;
            if (k <= 0.19) k = 0;
            pred.leapToX = pred.x + (ax / len) * dist * k;
            pred.leapToY = pred.y + (ay / len) * dist * k;
            pred.leapT = 0;
            // Snap to the jump vector at take-off and hold it through the arc,
            // so the scout lands facing where it went.
            faceToward(pred, pred.leapToX, pred.leapToY, 1);
            break;
        }
        case 'CARAPACE_SLAM': {
            const foe = _abNearestFoe(pred, 5);
            let ax = pred.dirX, ay = pred.dirY;
            if (foe) { ax = foe.x - pred.x; ay = foe.y - pred.y; }
            const len = Math.hypot(ax, ay) || 1;
            pred.slamDX = (ax / len) * (def.distance / def.duration);
            pred.slamDY = (ay / len) * (def.distance / def.duration);
            pred.slamHit = new Set();
            // Face down the charge line — a beetle slamming sideways looks wrong.
            faceToward(pred, pred.x + ax / len, pred.y + ay / len, 1);
            break;
        }
        case 'VENOM_LANCE': {
            const foe = _abNearestFoe(pred, def.radius);
            if (foe) {
                faceToward(pred, foe.x, foe.y, 1);
                applyDamage(foe, pred.power * def.dmg, pred);
                foe.defenseShredded   = Math.max(foe.defenseShredded || 0, def.duration);
                foe.defenseShredFactor = def.shred;
                _abBurst(pred, def.color, 1.2, 30, 4);
            }
            pred.venomTarget = foe || null;
            break;
        }
        case 'WEB_SNARE': {
            const webFoe = _abNearestFoe(pred, def.radius);
            if (webFoe) faceToward(pred, webFoe.x, webFoe.y, 1);
            _abForEachFoeInRadius(pred, def.radius, v => {
                if (v === null) return;    // the player is not slowed, only units
                applySlow(v, def.slowFrames, def.slowFactor);
                floatingTexts.push({ world: true, x: v.x, y: v.y, text: 'SNARED!', color: def.color, life: 34, vy: -0.05 });
            });
            _abBurst(pred, def.color, def.radius, 40, 7);
            break;
        }
        case 'BLINDING_DUST': {
            const dustFoe = _abNearestFoe(pred, def.radius);
            if (dustFoe) faceToward(pred, dustFoe.x, dustFoe.y, 1);
            _abForEachFoeInRadius(pred, def.radius, v => {
                if (v === null) return;
                applySlow(v, def.slowFrames, def.slowFactor);
                v.defenseShredded    = Math.max(v.defenseShredded || 0, def.slowFrames);
                v.defenseShredFactor = def.shred;
            });
            _abBurst(pred, def.color, def.radius, 46, 8);
            break;
        }
    }
}

function _abRunActive(pred, def) {
    switch (pred.abilityKey) {
        case 'LEAP': {
            pred.leapT = Math.min(1, pred.leapT + 1 / def.duration);
            const t = pred.leapT;
            pred.x = pred.leapFromX + (pred.leapToX - pred.leapFromX) * t;
            pred.y = pred.leapFromY + (pred.leapToY - pred.leapFromY) * t;
            // Parabolic arc in screen space — sin gives a clean take-off and landing.
            pred.leapLift = Math.sin(t * Math.PI) * def.peakLift;
            pred.walkCycle += 0.25;
            return true;
        }
        case 'CARAPACE_SLAM': {
            { const _px = pred.x, _py = pred.y; pred.x += pred.slamDX; pred.y += pred.slamDY; if (typeof facilityConstrain === "function") facilityConstrain(pred, _px, _py); }   // (the walls stop the charge)
            _abForEachFoeInRadius(pred, def.radius, v => {
                if (pred.slamHit.has(v)) return;   // one hit per victim per slam
                pred.slamHit.add(v);
                _abHurt(pred, v, pred.power * def.dmg);
                const dx = v.x - pred.x, dy = v.y - pred.y;
                const len = Math.hypot(dx, dy) || 1;
                v.kbVX = (dx / len) * def.knockback;
                v.kbVY = (dy / len) * def.knockback;
            });
            return true;
        }
        case 'MANDIBLE_FRENZY':
        case 'BLADE_FLURRY': {
            // Keep tracking between strikes — a multi-hit combo should follow a
            // victim that is backing away rather than flail at empty floor.
            const foe = _abNearestFoe(pred, def.radius + 1.5);
            if (foe) faceToward(pred, foe.x, foe.y, 0.35);
            if (pred.abilityTimer % def.interval === 0) {
                pred.attackAnim = 0.01;
                _abForEachFoeInRadius(pred, def.radius, v => _abHurt(pred, v, pred.power * def.dmg));
                _abBurst(pred, def.color, 0.9, 18, 1);
                pred.abilityHits++;
            }
            return false;   // keeps swinging but still tracks its target normally
        }
        case 'VENOM_LANCE': {
            const v = pred.venomTarget;
            if (v && !v.dead) faceToward(pred, v.x, v.y, 0.25);
            if (pred.abilityTimer % def.poisonEvery === 0) {
                if (v && !v.dead) applyDamage(v, pred.power * def.poisonDmg, pred, 'toxic');
            }
            return false;
        }
        case 'BLINDING_DUST': {
            if (pred.abilityTimer % def.dotEvery === 0) {
                _abForEachFoeInRadius(pred, def.radius, v => {
                    if (v !== null) applyDamage(v, pred.power * def.dotDmg, pred, 'toxic');
                });
            }
            return false;
        }
        default:
            return false;
    }
}

function _abEndActive(pred, def) {
    if (pred.abilityKey === 'LEAP') {
        pred.leapLift = 0;
        // No landing damage: it jumped to get away, not to hit anything.
        _abBurst(pred, def.color, 0.8, 14, 2);
    }
    if (pred.abilityKey === 'CARAPACE_SLAM') pred.slamHit = null;
}

// ─────────────────────────────────────────────────────────
//  CHARGE RING — drawn above the insect so the player can read the threat
// ─────────────────────────────────────────────────────────
function drawAbilityCharge(actor, px, py, drawCtx) {
    const def = actor.abilityDef;
    if (!def) return;
    const phase = actor.abilityPhase;
    if (phase === 'charging' && actor.abilityCharge < 4) return;

    const cy = py - 96;
    const r  = 7;
    const pct = Math.max(0, Math.min(1, actor.abilityCharge / 100));

    drawCtx.save();
    drawCtx.setTransform(1, 0, 0, 1, 0, 0);

    // Track
    drawCtx.strokeStyle = 'rgba(255,255,255,0.14)';
    drawCtx.lineWidth = 2;
    drawCtx.beginPath(); drawCtx.arc(px, cy, r, 0, Math.PI * 2); drawCtx.stroke();

    // Fill — sweeps clockwise from the top
    drawCtx.strokeStyle = def.color;
    drawCtx.lineWidth = 2.2;
    if (phase === 'winding') {
        // Telegraph: flare and pulse so the windup is unmistakable
        const f = 0.5 + 0.5 * Math.sin((frame || 0) * 0.55);
        drawCtx.globalAlpha = 0.55 + 0.45 * f;
        drawCtx.lineWidth = 2.6 + f * 2.2;
        drawCtx.beginPath(); drawCtx.arc(px, cy, r + f * 3, 0, Math.PI * 2); drawCtx.stroke();
    } else if (phase === 'active') {
        drawCtx.globalAlpha = 0.9;
        drawCtx.beginPath(); drawCtx.arc(px, cy, r, 0, Math.PI * 2); drawCtx.stroke();
        drawCtx.fillStyle = def.color;
        drawCtx.globalAlpha = 0.35;
        drawCtx.beginPath(); drawCtx.arc(px, cy, r - 2, 0, Math.PI * 2); drawCtx.fill();
    } else {
        drawCtx.globalAlpha = phase === 'ready' ? 1 : 0.8;
        drawCtx.beginPath();
        drawCtx.arc(px, cy, r, -Math.PI / 2, -Math.PI / 2 + pct * Math.PI * 2);
        drawCtx.stroke();
        if (phase === 'ready') {
            // Ready: a filled pip so a primed insect stands out at a glance
            drawCtx.fillStyle = def.color;
            drawCtx.beginPath(); drawCtx.arc(px, cy, 2.4, 0, Math.PI * 2); drawCtx.fill();
        }
    }
    drawCtx.restore();
}
