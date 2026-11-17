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
//  but THE WILD ANTS have their own (the owner, 2026-11-17: "the different species of ants have different abilities"):
//     scout → CALL FOR BACKUP, striker → LEAP STRIKE (the leap is his alone), tank → GROUND SLAM; the boss keeps MANDIBLE FRENZY
//  (a clone of yours keeps its species' special and its scout's LEAP: js/mutator.js)
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

    // ── The wild ants' own (the owner, 2026-11-17: "the different species of ants have different abilities. The scout ant should be able to call for backup. Two other lower
    // level instances of its form ... the striker has an ability to where it can attack from several tiles away. And that's exclusive to him, so the others need to not have that
    // ability. And then the tank has an ability that has an AoE effect. And they all have normal attacks as well"; "They jump and create new positioning"). Of what was offered:
    // the scout calls once, when hurt; its backup pays nothing; the jump is the striker's, not the tank's ("Tank no jump, strikers only"), "Engineered to take out high impact mages";
    // the tank slams round itself. The numbers are the agent's, provisional (docs/COMBAT.md).
    BACKUP_CALL: {
        name: 'CALL FOR BACKUP', color: '#ffb347',
        chargeRate: 100, windup: 30, duration: 1,   // ready at once; 0.5 s calling (kill it first and nobody comes)
        below: 0.5,                                 // once, when it drops below half its health
        n: 2, levelDown: 1, near: [1.2, 2.8],       // two of its kind a level under it, 1.2 to 2.8 tiles from it on open floor in its room
    },
    LEAP_STRIKE: {
        name: 'LEAP STRIKE', color: '#ff6a4a',
        chargeRate: 0.40, windup: 24, duration: 22,  // ~4 s of a fight to charge; 0.4 s crouched, its landing marked on the floor; 0.37 s in the air
        min: 2.0, max: 4.0, peakLift: 34,            // at one of yours 2 to 4 tiles away, in its sight
        land: 0.75, hitR: 1.0, dmg: 1.0,             // lands 0.75 tiles short of it, and bites it if it is still within a tile (a bite's worth)
    },
    GROUND_SLAM: {
        name: 'GROUND SLAM', color: '#ffb347',
        chargeRate: 0.30, windup: 42, duration: 1,  // ~5.6 s of a fight to charge; 0.7 s reared up, the ring on the floor warning
        trigger: 1.3, radius: 1.6, dmg: 0.9,         // when one of yours is within 1.3 tiles; everyone of yours within 1.6 takes 0.9 of its bite
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

// the wild ants' own, by class (above); `clone`: one of yours keeps its species' special
const ANT_ABILITY = { scout: 'BACKUP_CALL', striker: 'LEAP_STRIKE', tank: 'GROUND_SLAM' };
function resolveAbilityKey(speciesName, className, clone) {
    if (className === 'worker' || className === 'nymph') return null;
    if (speciesName === 'rolypoly') return null;   // its one special is the CURL, every class's (js/rolypoly.js; docs/ELECTRIC-BREED.md): no LEAP for its scout
    if (speciesName === 'ant' && !clone && ANT_ABILITY[className]) return ANT_ABILITY[className];
    if (className === 'scout') return 'LEAP';
    return SPECIES_ABILITY[speciesName] || null;
}

// ── Slow plumbing ────────────────────────────────────────
// slowFactor was written in eight places across the codebase and read in none:
// nothing ever scaled movement by it, so every slow in the game — web shots,
// blinding dust, the ice moves — was purely cosmetic. Rather than edit ~35
// movement sites, the factor is applied to moveSpeed once per frame in
// updateStatusEffects (the pattern the electric EMP's speed boost used; that Ultimate is gone since build 2026-11-09b).
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
    const fd = actor.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[actor.evolved] : null;   // (a form's own pace: the ELECTRO SKINK is quick, js/evolution.js)
    const pace = (actor.paceMult > 0 ? actor.paceMult : 1) * (fd && fd.pace > 0 ? fd.pace : 1);   // a lasting pace of its own (the clone of a CORE SHAPER, a Player card: js/playercards.js); 1 for everyone else
    if (actor.slowed > 0) {
        actor.moveSpeed = actor.baseMoveSpeed * Math.max(0, actor.slowFactor ?? 1) * pace;
    } else if (actor.slowFactor !== 1 || actor.moveSpeed !== actor.baseMoveSpeed * pace) {
        actor.slowFactor = 1;
        actor.moveSpeed  = actor.baseMoveSpeed * pace;
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
// a creature's special does not reach anything on the far side of a Photonic Shield (js/techabilities.js), nor anything it cannot see (a wall or a tall object between; the owner, 2026-11-06:
// "Both need sight"; js/facilityplay.js facilitySeesFrom): it neither aims at it nor hits it
function _abWalled(pred, a) {
    if (!pred.isClone && typeof techShieldBetween === "function" && techShieldBetween(pred.x, pred.y, a.x, a.y)) return true;
    return typeof facilitySeesFrom === "function" && !facilitySeesFrom(pred.x, pred.y, a.x, a.y);
}

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
    const h0 = victim ? victim.health : 0;
    applyDamage(victim, amount, pred, null, false, false, dmgAbilityHit(pred));   // (the special's type: js/damage.js)
    if (pred && pred.poisonsFollowers && typeof poisonOnHit === "function") poisonOnHit(pred, victim, h0);   // (the purification's three toxic ants poison a follower: js/combat.js)
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
    if (pred.abilityKey === 'LEAP_STRIKE') { const t = pred.strikeTarget; return t && !t.dead ? { x: t.x, y: t.y } : null; }   // (crouched, it watches the one it will land on)
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
    const key = resolveAbilityKey(pred.speciesName, pred.className, !!pred.isClone);
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
        case 'BACKUP_CALL':   // once, below half its health; never one that is itself backup, nor a boss's brood (her waves are hers: js/bosses.js)
            return !pred.isClone && !pred.backup && !pred.calledBackup && !pred.bossWave && pred.maxHealth > 0 && pred.health / pred.maxHealth < def.below;
        case 'LEAP_STRIKE':
            pred.strikeTarget = _abStrikeTarget(pred, def);
            return !!pred.strikeTarget;
        case 'GROUND_SLAM':
            return !!_abNearestFoe(pred, def.trigger);
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

    // ── HOLDING STILL in a card battle (js/cardbattle.js cardBattleHolds: everyone in it but the one whose turn it is): it charges and starts nothing ──
    if (typeof cardBattleHolds === 'function' && cardBattleHolds(pred)) return false;
    if (pred.isClone && typeof cardBattleNoFight === 'function' && cardBattleNoFight(pred)) return false;   // (and your squad's clone out of a battle: §2.35, either a battle or none)

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
        case 'BACKUP_CALL':
            pred.calledBackup = true;
            _abBackup(pred, def);
            break;
        case 'LEAP_STRIKE': {
            const t = pred.strikeTarget && !pred.strikeTarget.dead ? pred.strikeTarget : null;
            pred.leapFromX = pred.x; pred.leapFromY = pred.y; pred.leapToX = pred.x; pred.leapToY = pred.y; pred.leapT = 0;
            const L = t ? _abStrikeLanding(pred, t, def) : null;   // (nowhere to land, or out of sight now: it stays where it is)
            if (L) { pred.leapToX = L[0]; pred.leapToY = L[1]; faceToward(pred, t.x, t.y, 1); }
            break;
        }
        case 'GROUND_SLAM':
            _abForEachFoeInRadius(pred, def.radius, v => _abHurt(pred, v, pred.power * def.dmg));
            elementEffects.push({ type: 'ring', x: pred.x, y: pred.y, radius: def.radius, color: def.color, life: 24 });
            _abBurst(pred, '#c9a060', 1.4, 22, 5);
            pred.attackAnim = 0.01;
            if (typeof shake !== 'undefined') shake = Math.max(shake || 0, 6);
            break;
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
                applyDamage(foe, pred.power * def.dmg, pred, null, false, false, DMG_HIT_ENEMY.piercing);   // (VENOM LANCE: Piercing)
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
        case 'LEAP':
        case 'LEAP_STRIKE': {
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
    if (pred.abilityKey === 'LEAP_STRIKE') {
        pred.leapLift = 0;
        const t = pred.strikeTarget; pred.strikeTarget = null;
        if (t && !t.dead && Math.hypot(t.x - pred.x, t.y - pred.y) <= def.hitR && !_abWalled(pred, t)) {   // (one that got clear in the air is missed)
            faceToward(pred, t.x, t.y, 1); _abHurt(pred, t, pred.power * def.dmg); pred.attackAnim = 0.01;
            if (!pred.isClone) { pred.currentTarget = t; pred._prey = t; pred.state = 'attack'; }   // (and it fights the one it landed on)
        }
        _abBurst(pred, def.color, 0.9, 16, 3);
    }
}

// THE STRIKER'S PICK (the owner, 2026-11-17, of the leap: "Engineered to take out high impact mages, I think of an algorithm that will target them for the predators"): of yours from
// `min` to `max` tiles off, in its sight and one it may go for, A MAGE FIRST (your followers that fire from a distance: role "sniper", js/commandcenter.js ATTACK_STYLES), and of those
// the one that hits hardest (its power); else the one it is already going for; else the hardest hitter in reach
function _abStrikeTarget(pred, def) {
    const team = _abHostileTeam(pred); let best = null, bs = -1;
    for (const a of actors) {
        if (a === pred || a.dead || a.team !== team || a.untargetable || isNeutralBystander(a)) continue;
        const d = Math.hypot(a.x - pred.x, a.y - pred.y); if (d < def.min || d > def.max || _abWalled(pred, a)) continue;
        if (!pred.isClone && typeof predatorPreyOk === 'function' && !predatorPreyOk(pred, a)) continue;   // (in a card battle: not your squad from outside it, js/cardbattle.js)
        const score = (a.role === 'sniper' && !a.isClone ? 1e6 : 0) + (a === pred.currentTarget ? 1e3 : 0) + Math.min(999, a.power || 0);
        if (score > bs) { bs = score; best = a; }
    }
    return best;
}
// where a leap strike lands: `land` tiles short of its target on the striker's side, on floor it can see and get to in a line (the facility's walls and props), not over a Photonic Shield
function _abStrikeLanding(pred, t, def) {
    const d = Math.hypot(t.x - pred.x, t.y - pred.y) || 1, x = t.x + (pred.x - t.x) / d * def.land, y = t.y + (pred.y - t.y) / d * def.land;
    if (typeof facilityLosFrom === 'function' && !facilityLosFrom(pred.x, pred.y, x, y)) return null;
    if (!pred.isClone && typeof techShieldBetween === 'function' && techShieldBetween(pred.x, pred.y, x, y)) return null;
    return [x, y];
}
// CALL FOR BACKUP: two of its kind a level under it come up beside it (open floor in its room, in its sight) and go for whoever it was fighting. They cannot call in their turn and pay
// nothing, no crystals, no DNA, no XP (the owner: "Nothing"; noReward, js/drops.js, js/levels.js). Its element and its brood's mark are theirs (a toxic ant's backup is toxic).
function _abBackup(pred, def) {
    const room = typeof partyRoomAt === 'function' ? partyRoomAt(pred.x, pred.y) : null, lv = Math.max(1, (pred.level || 1) - def.levelDown), spots = [], made = [];
    for (let k = 0; k < 24 && spots.length < def.n; k++) {
        const a = k * 2.39996 + (pred.x * 1.7 + pred.y * 0.9), r = def.near[0] + (def.near[1] - def.near[0]) * ((k * 0.618034) % 1);
        const c = typeof _fpNearestCellOpen === 'function' ? _fpNearestCellOpen(pred.x + Math.cos(a) * r, pred.y + Math.sin(a) * r) : [pred.x + Math.cos(a) * r, pred.y + Math.sin(a) * r];
        if (!c || (room && partyRoomAt(c[0], c[1]) !== room) || Math.hypot(c[0] - pred.x, c[1] - pred.y) < 0.8) continue;
        if (typeof facilitySeesFrom === 'function' && !facilitySeesFrom(pred.x, pred.y, c[0], c[1])) continue;
        if (spots.some(s => Math.hypot(s[0] - c[0], s[1] - c[1]) < 0.7)) continue;
        spots.push(c);
    }
    for (const s of spots) {
        let p = null;
        try {
            p = room && typeof facilitySpawnCreature === 'function'
                ? facilitySpawnCreature(pred.speciesName, s, { room, species: [pred.speciesName], classes: { [pred.className]: 1 }, levels: [lv, lv], element: pred.element || null, brood: !!pred.sewerBrood, minFromPlayer: 0, spacing: 0 })
                : spawnCreature({ species: pred.speciesName, className: pred.className, x: s[0], y: s[1], level: lv, state: 'wander' });
        } catch (e) { p = null; }
        if (!p) continue;
        p.backup = true; p.noReward = true; p.provoked = true; p.spawnProtection = 0; p.lastAttacker = pred.lastAttacker || null; if (pred.raid) p.raid = pred.raid;
        const t = pred.currentTarget && !pred.currentTarget.dead ? pred.currentTarget : null;
        if (t && (typeof predatorPreyOk !== 'function' || predatorPreyOk(p, t))) { p.currentTarget = t; p._prey = t; p.state = 'attack'; } else p.state = 'hunt';
        _abBurst(p, def.color, 0.8, 18, 2); made.push(p);
    }
    if (made.length) _abSay(pred, made.length === 1 ? 'ONE ANSWERS' : made.length + ' ANSWER', def.color);
    return made;
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
    if (phase === 'winding' && drawCtx === (typeof ctx !== 'undefined' ? ctx : null) && typeof _bossRing === 'function') {
        const k = Math.max(0, Math.min(1, 1 - actor.abilityTimer / Math.max(1, def.windup)));
        if (actor.abilityKey === 'GROUND_SLAM') _bossRing(actor.x, actor.y, def.radius, k, def.color);
        else if (actor.abilityKey === 'LEAP_STRIKE' && actor.strikeTarget && !actor.strikeTarget.dead) {
            const t = actor.strikeTarget, L = _abStrikeLanding(actor, t, def); if (L) _bossRing(L[0], L[1], 0.55, k, def.color);
        }
    }
}
