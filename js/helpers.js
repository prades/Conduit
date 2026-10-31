const getTile = (gx, gy) => worldTileMap.get(`${gx},${gy}`);

// Every path that can hurt the player goes through here.
//
// The respawn grace used to be checked in exactly two places — predator melee
// and the ability-radius helper — so abdomen shots, vent blasts, acid pools
// and toxic zones all hit straight through it. One funnel means the window
// actually covers what it claims to.
// Returns whether the damage landed, for callers that want to skip their own
// screen shake or hit effect.
// Whether a PREDATOR may damage the player. One place, consulted by the three
// paths that could: the melee swipe, the ability radius helper, and the abdomen
// projectile. Hazards do not go through this — they are not predators.
function predatorMayHurtPlayer() {
    return PREDATORS_ATTACK_PLAYER;
}

// An un-recruited recruit is a BYSTANDER. It is walking to the Crystal to join
// you and nothing on either side should shoot at it on the way.
//
// This mattered most on the green side, which is the surprising part: a recruit
// is on team "red" until it arrives, and your CLONES scan and strike team
// "red". So your own converted predators were cutting down the reinforcements
// as they came in — and since a clone looks exactly like a predator, it read as
// the enemy doing it. The player's own gesture commands could target them too.
// What a unit on YOUR side may attack.
//
// This expression was written out twenty times across the codebase — fourteen
// in js/elements.js alone, plus game.js and traps.js — in four slightly
// different forms:
//
//   a.team==="red" || (a instanceof Predator && a.team!=="green" && !a.isClone)
//   a.team==="red" || (a instanceof Predator)                    <- elements.js chain
//   a.team==="red" || (a instanceof Predator && !a.isClone)      <- the traps
//
// Every one of them counted a NEUTRAL RECRUIT as hostile, because a recruit is
// on team "red" until it reaches the Crystal. That is what killed
// reinforcements on the way in: not the predators, but your own followers'
// element attacks sweeping the area around whatever they were aiming at.
//
// Unifying them also closes the second form, which counted a green CLONE of
// yours as a target — chain lightning could jump to your own clone.
// WHOSE SIDE is this on — nothing about whether it can be attacked. A corpse
// still belongs to the side it fought for, and the two places that COUNT kills
// are asking exactly that about something that is already dead.
//
// Splitting this out is not tidiness. Folding twenty-five hostility expressions
// into isHostileTarget swept up two that were not asking about targeting at
// all, and because that function begins `if (a.dead) return false`, the
// surviving conditions read `a.dead && isHostileTarget(a)` — which is
// `a.dead && !a.dead`, and never true: the kill counter became dead code while
// the drops still paid out, which is why it went unnoticed. (lifetimeKills is
// counted in the death sweep now, js/game.js, beside what the kill leaves.)
// `!a.isClone` is redundant and kept deliberately: it only bites on a RED
// clone, and the red branch above has already returned by then, so no state the
// game can reach reaches it. It mirrors isHostileTarget rather than quietly
// diverging from it.
function isEnemyUnit(a) {
    if (!a) return false;
    if (isNeutralBystander(a)) return false;
    if (a.team === "red") return true;
    return typeof Predator !== "undefined" && (a instanceof Predator)
           && a.team !== "green" && !a.isClone;
}

// MAY I SHOOT THIS — the question every weapon asks, which additionally
// requires the thing to be alive.
function isHostileTarget(a) {
    if (!a || a.dead) return false;
    if (a.untargetable) return false;   // underground (the Brood Tyrant's burrow)
    return isEnemyUnit(a);
}

// ── UNITS BY COLUMN ───────────────────────────────────────
// REPORTED: "the game runs pretty slow still." Everything with a reach looped over
// every unit every frame. Units are bucketed by column (floor(x)) once per frame
// and a reach looks only at the columns it can touch.
//
// unitsNear(x, r) is a SUPERSET of the live units within r of x (one spare
// column either side covers anything that moved this frame), so every caller
// still does its own exact distance test. Rebuilt when the frame or the
// number of actors changes.
let _ucols = new Map(), _ucolsFrame = -1, _ucolsLen = -1;
function _unitColumns() {
    const f = typeof frame !== "undefined" ? frame : 0;
    if (_ucolsFrame === f && _ucolsLen === actors.length) return _ucols;
    _ucols = new Map(); _ucolsFrame = f; _ucolsLen = actors.length;
    for (let i = 0; i < actors.length; i++) {
        const a = actors[i];
        if (!a || a.dead) continue;
        const k = Math.floor(a.x);
        const l = _ucols.get(k);
        if (l) l.push(a); else _ucols.set(k, [a]);
    }
    return _ucols;
}
function unitsNear(x, r) {
    const cols = _unitColumns(), out = [];
    const c0 = Math.floor(x - r) - 1, c1 = Math.floor(x + r) + 1;
    for (let c = c0; c <= c1; c++) {
        const l = cols.get(c);
        if (l) for (let i = 0; i < l.length; i++) if (!l[i].dead) out.push(l[i]);
    }
    return out;
}

// A nymph: the smallest class, the one that comes in swarms.
function isNymph(p) { return !!p && p.className === "nymph"; }

// TOO HEAVY TO DRAG. "The vortex's seem too strong … make beetles immune" —
// and "boss level predators" too. Nothing PULLS these (a flux follower's
// singularity). They still take the damage and the slow; they just cannot be
// dragged in and held.
function vortexPullImmune(a) {
    return !!a && (a.speciesName === "beetle" || !!a.isBoss);
}

function isNeutralBystander(a) {
    return !!(a && a.isNeutralRecruit && a.team === "red");
}

// One hit, whatever its size: the player has PLAYER_HITS of them (js/config.js),
// and the knockdown in game.js puts them back at the Crystal when they run out.
// A hit from something (a predator's bite) knocks you a step away from it.
function hurtPlayer(amount, shakeAmt, source) {
    if (!(amount > 0)) return false;
    if (player.invuln > 0) return false;
    health = Math.max(0, health - 1);
    player.invuln = PLAYER_HIT_GRACE;
    if (source && Number.isFinite(source.x) && Number.isFinite(source.y) && typeof PLAYER_KNOCKBACK !== "undefined") {
        let kx = player.x - source.x, ky = player.y - source.y;
        const kl = Math.hypot(kx, ky);
        if (kl < 1e-3) { kx = -1; ky = 0; } else { kx /= kl; ky /= kl; }
        // Both where you are and where you were walking: the camera slides you back (and the walls hold you: js/facilityplay.js).
        const _kx = player.x, _ky = player.y; player.x += kx * PLAYER_KNOCKBACK; player.y += ky * PLAYER_KNOCKBACK; facilityConstrain(player, _kx, _ky); player.targetX = player.x; player.targetY = player.y; player.fpPath = null;
    }
    shake = Math.max(shake, shakeAmt || 4);
    if (health > 0 && typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") {
        // Over your head (the camera keeps you at the centre; 2 px off it so it
        // is not queued as a centre-screen banner, js/drops.js isBanner).
        floatingTexts.push({ x: canvas.width / 2 + 2, y: canvas.height / 2 - 70, text: "HIT \u00b7 " + health + " LEFT", color: health > 1 ? "#ffcc33" : "#ff4455", life: 60, vy: -0.05, size: 11 });
    }
    return true;
}



function applyDamage(target, amount, source=null, element=null, isReflected=false, fixed=false) {   // fixed: a set amount (a Kinetic Launcher's thrown follower, js/techabilities.js): no defense, bond or perk changes it; the cap still holds
    if (!target || target.dead) return;
    // A recruit walking to the Crystal takes NOTHING, from anyone or anything.
    //
    // isHostileTarget above stops everything that deliberately picks a target,
    // and measuring the predator specials proved that holds: all seven
    // offensive abilities land in full on a follower standing beside a recruit
    // and do not scratch the recruit. What was left were the two paths that
    // never picked a target at all — the red health-decay pass (removed since),
    // which bled anything on team red, and the cocoon toxin, which named recruits
    // outright. A recruit could arrive dead without a single predator having
    // chosen to hurt it, which is what "attacked before they get an element"
    // actually was. Both are gated at their own site as well, so nothing
    // spends effects or floating text on a hit that lands nowhere; this is the
    // chokepoint that catches the path nobody has thought of yet.
    if (isNeutralBystander(target)) return;
    // Ghostphage ghost — immune to hazards; instantly killed by any direct attack
    if (target.ghostphageLife) {
        if (source && source.team) { target.health=0; target.dead=true; }
        return; // hazard (null source) — immune
    }
    if (target.spawnProtection && target.spawnProtection > 0) return;
    // BERSERKER: the trait sets damageMultiplier (1.5 under 30% health). It used
    // to be read in one job branch only, so it did nothing in ordinary combat.
    if (source && source.team === "green" && source.damageMultiplier > 1) amount *= source.damageMultiplier;
    // BONDS (js/bonds.js): a fighting pair hits harder together, a bereaved
    // partner rages, a duo ultimate leaves both hitting harder for a while.
    // Both sides of the hit count as being in combat, which is what builds one.
    if (typeof noteCombat === "function") { noteCombat(source); noteCombat(target); }
    if (typeof bondAttackMult === "function") amount *= bondAttackMult(source);
    // EQUIP CARDS (js/cards.js): the share of every hit a follower deals that its cards add (the Core cards' DAMAGE DEALT); a set amount is left as it is
    if (!fixed && source && source.isFollower && source.team === "green" && source.cards && typeof equipMult === "function") amount *= equipMult(source, "damage");
    // ARMY SURGE. Applied here rather than at each attack because the twelve
    // damage expressions in js/elements.js all funnel through this one
    // function — patching them individually would have missed one.
    // Followers and clones both count; the player's own shots do not, because
    // this is what the player spends rather than something they gain.
    if (armySurgeTimer > 0 && source && source.team === "green" &&
        (source.isFollower || source.isClone)) {
        amount *= ARMY_SURGE_POWER;
    }
    // A creature that is hit hunts whoever hit it
    if (target instanceof Predator && target.team !== "green") {
        target.provoked = true; target.state = "hunt";
    }
    // THE ELEMENT WHEEL: every hit whose element is known (the hit's own, or its attacker's) against any target with an element (js/elements.js getElementMultiplier).
    { const _el = element || (source && source.element); if (_el && target.element) amount *= getElementMultiplier(_el, target.element); }
    if (target.untargetable) return;   // underground: nothing reaches it
    if (target.frozen) return;
    if (target.invulnerable && target.invulnerable > 0) return;
    if (target.smokeForm > 0 && Math.random() < (target.smokeEvasion||0.75)) return;
    if (target.shielded && target.shieldAmount > 0) {
        if (element === 'toxic') {
            // toxic: bypasses shield, hits HP directly
        } else if (element === 'electric') {
            // electric: 2x shield damage, overflow bleeds to HP
            target.shieldAmount -= amount * 2;
            if (target.shieldAmount <= 0) {
                const overflow = Math.abs(target.shieldAmount);
                target.shielded = false; target.shieldAmount = 0; target._shieldMax = 0;
                amount = overflow;
            } else { if (target.hitFlash !== undefined) target.hitFlash = 6; return; }
        } else if (element === 'flux') {
            // flux: damage blocked, status effects applied by caller land anyway
            return;
        } else {
            target.shieldAmount -= amount;
            if (target.shieldAmount <= 0) { target.shielded = false; target.shieldAmount = 0; target._shieldMax = 0; }
            return;
        }
    }
    if (target.defenseShredded > 0 && !fixed) amount *= 1 / (target.defenseShredFactor||0.5);
    // DEFENSE, for every unit (js/levels.js defenseMult): its DEF against the
    // attacker's level. It was followers only, as 10 / (10 + DEF × 0.6) — the
    // same numbers at level 5.
    if (fixed) { /* a set amount: no defense */ }
    else if (typeof defenseMult === "function") amount *= defenseMult(target, source);
    else if (target.isFollower && target.stats && target.stats.defense) amount *= 10 / (10 + target.stats.defense * 0.6);
    if (!fixed && target && target.isFollower && target.team === "green" && typeof bondDefenseMult === "function") amount *= bondDefenseMult(target);   // a partner close by
    // THE CAP (docs/COMBAT.md COMBAT.hitCap): no single hit takes more than this share of one of your units' max health, so every one of them survives at least three hits of anything.
    const _mine = target.team === "green" && (target.isFollower || target.isClone);
    if (_mine && typeof COMBAT !== "undefined") amount = Math.min(amount, (target.maxHealth || 20) * COMBAT.hitCap);
    let dmg = amount;
    if (target.perk && !fixed) {
        const pk = PERKS[target.perk];
        if (pk && pk.modifyIncomingDamage) dmg = pk.modifyIncomingDamage(target, dmg, source);
    }
    const _before = target.health;
    target.health -= dmg;
    if (typeof noteHit === "function") noteHit(target, _before);   // the bar's pale segment shows the hit's size (js/combat.js)
    if (source) target.lastAttacker = typeof predatorSource === "function" ? predatorSource(source) : source;   // (the player's hit: the player itself, js/predator.js, so a creature turns on the player)
    if (typeof target.hitFlash !== "undefined") target.hitFlash = 6;
    if (typeof target.hitStun  !== "undefined") target.hitStun  = 6;
    // ── DAMAGE TICKER ───────────────────────────────────────── an enemy's hit in its element's colour; one of yours, red with a minus (COMBAT.numbers.ally). Anchored to the unit (a world text, js/drops.js).
    const _foe = target.team === "red" || (target instanceof Predator && target.team !== "green" && !target.isClone);
    if (source && !isReflected && dmg >= 1 && (_foe || (typeof COMBAT !== "undefined" && COMBAT.numbers.ally))) {
        const _dcol = !_foe ? "#ff7a7a"
                    : element === "fire"     ? "#ff8844"
                    : element === "electric" ? "#ffff55"
                    : element === "ice"      ? "#aaeeff"
                    : element === "flux"     ? "#dd88ff"
                    : element === "core"     ? "#44ffcc"
                    : element === "toxic"    ? "#88ff44"
                    : "#ffcc88";
        floatingTexts.push({ world: true, x: target.x + (Math.random() - 0.5) * 0.3, y: target.y + (Math.random() - 0.5) * 0.3, text: (_foe ? "" : "\u2212") + Math.round(dmg), color: _dcol, size: _foe ? 14 : 13, life: 36, vy: -0.03 - Math.random() * 0.012 });
    }
    if (typeof target.onHit    === "function")  target.onHit(source);
    // ── BEETLE REFLECT — returns the same damage to attacker, no amplification ──
    if (target.reflectDamage && source && !source.dead && !isReflected) {
        applyDamage(source, dmg, target, null, true);
        floatingTexts.push({ world: true, x:target.x, y:target.y, text:"REFLECT", color:"#cc88ff", life:35, vy:-0.05 });
    }
    // EQUIP CARDS (js/cards.js): an effect on the hit, from a follower of yours that landed it (not a reflected hit, not a set amount: a burn's or a cloud's own tick has no attacker, so no card answers it)
    if (source && source.isFollower && source.team === "green" && source.cards && !isReflected && !fixed && dmg > 0 && typeof equipOnHit === "function") equipOnHit(source, target, Math.min(dmg, _before));
    if (target.health <= 0) {
        target.health = 0; target.dead = true;
        // DEFEATED, over it (docs/COMBAT.md): in its side's colour
        if (typeof COMBAT !== "undefined" && COMBAT.defeatText > 0 && typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: target.x, y: target.y, text: "DEFEATED", color: target.team === "green" || target.isClone ? "#19e6c1" : "#ff8a6a", size: 11, life: COMBAT.defeatText, vy: -0.015 });
        // ── ULTIMATE KILL BONUS ───────────────────────────────
        if (source && source.isFollower && source.team === "green") {
            if (typeof source.ultimateCharge !== "number") source.ultimateCharge = 0;
            const _killUltGain = 20;
            source.ultimateCharge = Math.min(100, source.ultimateCharge + _killUltGain);
        }
    }
    // ── ULTIMATE CHARGE GAIN ──────────────────────────────
    if (source && source.isFollower && source.team === "green" && !target.dead) {
        if (typeof source.ultimateCharge !== "number") source.ultimateCharge = 0;
        const _hitUltGain = 3;
        source.ultimateCharge = Math.min(100, source.ultimateCharge + _hitUltGain);
    }
}

function applyElementalDamage(target, amount, source, element) {
    if (!target || target.dead) return;
    const mult = getElementMultiplier(element, target.element);
    if (mult > 1) floatingTexts.push({world:true,x:target.x,y:target.y,text:'WEAK!',color:'#ffcc00',life:40,vy:-0.04});
    else if (mult < 1) floatingTexts.push({world:true,x:target.x,y:target.y,text:'RESIST',color:'#88aaff',life:40,vy:-0.04});
    // The multiplier itself is applied inside applyDamage; this only says WEAK / RESIST.
    applyDamage(target, amount, source, element);
}

// ──────────────────────────────────────────────────────
//  THE PLAYER'S ULTIMATE — one bar, spent on the whole army
// ──────────────────────────────────────────────────────
function armySurgeActive() { return armySurgeTimer > 0; }
function playerUltimateReady() { return playerUltimate >= PLAYER_ULT_MAX; }

// Everything the army is made of: your followers and your clones. The player is
// not in actors[] and is deliberately not included — the surge is what the bar
// buys for the squad, not a personal buff.
function armyUnits() {
    return actors.filter(a => !a.dead && a.team === "green" && (a.isFollower || a.isClone));
}

function chargePlayerUltimate(amount) {
    if (!(amount > 0)) return false;
    // No charging while it is running. Otherwise a surge that wins a fight
    // pays for the next one, and the bar never reads as a cost.
    if (armySurgeTimer > 0) return false;
    if (playerUltimate >= PLAYER_ULT_MAX) return false;
    const was = playerUltimate;
    playerUltimate = Math.min(PLAYER_ULT_MAX, playerUltimate + amount);
    if (was < PLAYER_ULT_MAX && playerUltimate >= PLAYER_ULT_MAX) {
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 110,
            text: "ULTIMATE READY \u2014 TAP THE BAR", color: "#ffdd44",
            life: 220, vy: -0.16, size: 15 });
    }
    return true;
}

// Spends the bar. Returns true only if it actually fired, so the caller can
// tell a real discharge from a tap on an unfilled bar.
function fireArmySurge() {
    if (armySurgeTimer > 0) {
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 90,
            text: "SURGE ALREADY RUNNING", color: "#ffdd44", life: 80, vy: -0.2, size: 12 });
        return false;
    }
    if (!playerUltimateReady()) {
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 90,
            text: "ULTIMATE " + Math.floor(playerUltimate) + "%", color: "#f88",
            life: 90, vy: -0.2, size: 12 });
        return false;
    }
    playerUltimate = 0;
    armySurgeTimer = ARMY_SURGE_FRAMES;

    const units = armyUnits();
    for (const a of units) {
        if (typeof healUnit === "function") healUnit(a, a.maxHealth - a.health); else a.health = a.maxHealth;
        // WILL is what gates a follower's real attacks — on empty they fall
        // back to a quarter-strength poke, so refilling it is most of the
        // "powered up".
        if (a.stats && typeof a.currentWill === "number") a.currentWill = a.stats.will;
        // And their own ultimates come online, which is the existing
        // double-tap system rather than a new one.
        if (typeof a.ultimateCharge === "number") a.ultimateCharge = 100;
        if (typeof elementEffects !== "undefined") {
            elementEffects.push({ type: "impact", x: a.x, y: a.y,
                                  color: "#ffdd44", radius: 0.9, life: 26 });
        }
    }
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 100,
        text: "ARMY SURGE \u2014 " + units.length + (units.length === 1 ? " UNIT" : " UNITS"),
        color: "#ffdd44", life: 200, vy: -0.2, size: 17 });
    if (typeof shake !== "undefined") shake = Math.max(shake, 7);
    return true;
}

// ── The siphon ─────────────────────────────────────────
// One wisp per follower per SIPHON_INTERVAL, and the charge lands when the wisp
// does. Emission is staggered by a per-follower timer seeded at random, so a
// squad does not pulse in unison — ten followers firing on the same frame reads
// as a strobe rather than a trickle.
// Near enough to draw from. Squared, so there is no square root on a path that
// runs for every unit every frame. One predicate, used by both the tick and
// siphonableUnits(), so the rule cannot be stated twice and drift.
function inSiphonRange(a) {
    const dx = a.x - player.x, dy = a.y - player.y;
    return dx * dx + dy * dy <= SIPHON_RANGE * SIPHON_RANGE;
}

// The units the siphon can actually reach. Distinct from armyUnits(), which is
// the WHOLE army and is what a surge lifts — the surge is not range-gated.
function siphonableUnits() {
    return armyUnits().filter(inSiphonRange);
}

function siphonTick() {
    // Written as one pass with no intermediate arrays and no square root: it
    // runs for every unit on every frame.
    //
    // Nothing is drawn from the squad mid-surge — the bar is spent, and a surge
    // paying for the next one would stop the bar reading as a cost — nor once
    // the bar is full, nor with the switch off. But the in-range count is
    // tallied regardless, because the HUD needs it to explain a stalled bar.
    const canDraw = siphonEnabled && armySurgeTimer <= 0 && playerUltimate < PLAYER_ULT_MAX;
    let inRange = 0;
    for (const a of actors) {
        if (a.dead || a.team !== "green") continue;
        if (!(a.isFollower || a.isClone)) continue;
        if (!inSiphonRange(a)) continue;
        inRange++;
        if (!canDraw) continue;
        if (a._siphonTimer === undefined) {
            // Random phase, so the first wave of wisps is spread out too.
            a._siphonTimer = Math.floor(Math.random() * SIPHON_INTERVAL);
        }
        // Out-of-range units never reach here, so their timer does not tick
        // down while they are away: nothing accrues in absentia.
        if (--a._siphonTimer > 0) continue;
        a._siphonTimer = SIPHON_INTERVAL;
        siphonWisps.push({ ax: a.x, ay: a.y, t: 0, seed: (Math.random() * 1e6) | 0 });
    }
    _siphonInRange = inRange;
    // Wisps already in flight always land — they were paid for.
    _advanceSiphonWisps();
}

// Wisps travel toward wherever the player IS, not where they were when it left,
// so the trickle follows you rather than aiming at a stale point.
function _advanceSiphonWisps() {
    for (let i = siphonWisps.length - 1; i >= 0; i--) {
        const w = siphonWisps[i];
        w.t += 1 / SIPHON_TRAVEL;
        if (w.t < 1) continue;
        siphonWisps.splice(i, 1);
        chargePlayerUltimate(SIPHON_PER_WISP);
    }
}

// The switch. Wisps already in flight are left alone; they have been paid for
// and dropping them mid-air would look like a glitch.
function toggleSiphon() {
    siphonEnabled = !siphonEnabled;
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
        text: siphonEnabled ? "SIPHON ON" : "SIPHON OFF",
        color: siphonEnabled ? SIPHON_COLOUR : "#8899aa", life: 100, vy: -0.25, size: 12 });
    return siphonEnabled;
}

// A wisp is a few pixels of jagged static, drawn along the line from the
// follower it left to the player. Deliberately small: the brief was "not crazy,
// just a little wisp", and at roughly eight canvas operations each with about
// three in flight at a time it costs nothing measurable.
function drawSiphonWisps() {
    if (siphonWisps.length === 0) return;
    const cx = canvas.width / 2, cy = canvas.height / 2;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.strokeStyle = SIPHON_COLOUR;
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    for (const w of siphonWisps) {
        // Ease toward the player so it accelerates in, like a discharge.
        const e = w.t * w.t;
        const wx = w.ax + (player.visualX - w.ax) * e;
        const wy = w.ay + (player.visualY - w.ay) * e;
        const dx = wx - player.visualX, dy = wy - player.visualY;
        const px = (dx - dy) * TILE_W + cx;
        const py = (dx + dy) * TILE_H + cy + TILE_H - 14 - 10 * (1 - w.t);
        // Brightest in the middle of the trip, so it does not pop in or out.
        ctx.globalAlpha = 0.30 + 0.45 * Math.sin(Math.PI * w.t);
        // Laid ALONG the direction of travel, with the jitter perpendicular to
        // it, so the wisp points where it is going. Drawn straight up it read as
        // a static fleck rather than something cycling in to the player.
        // The player is always at the centre of the screen, so that IS the target.
        const tx = cx, ty = cy + TILE_H - 14;
        let ux = tx - px, uy = ty - py;
        const ul = Math.hypot(ux, uy) || 1;
        ux /= ul; uy /= ul;
        const nx = -uy, ny = ux;             // perpendicular
        // Three short segments, jittered off the seed so no two look alike.
        let s = w.seed ^ ((frame * 2654435761) | 0);
        const rnd = () => { s = (s * 1103515245 + 12345) | 0; return ((s >>> 16) & 255) / 255 - 0.5; };
        ctx.beginPath();
        ctx.moveTo(px, py);
        for (let k = 1; k <= 3; k++) {
            const along = k * 4;
            const off   = rnd() * 6;
            ctx.lineTo(px + ux * along + nx * off, py + uy * along + ny * off);
        }
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
}

function tickArmySurge() {
    if (armySurgeTimer <= 0) return;
    armySurgeTimer--;
    if (armySurgeTimer === 0) {
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 90,
            text: "SURGE SPENT", color: "#8899aa", life: 120, vy: -0.16, size: 12 });
    }
}



// `type`: the role it is made as (FOLLOWER_TYPES, js/species.js); none is a draw, as a follower found in the world is.
function spawnFollowerAtCrystal(element, type) {
    if (!element) { const pool = [...unlockedElements]; element = pool[Math.floor(Math.random()*pool.length)] || "fire"; }
    const def         = NPC_TYPES["virus"];
    const personality = personalityForType(type);
    const stats       = applyPersonality(personality);
    const role        = assignRole(stats);
    const npc = {
        type:"virus", element, x:crystal.x, y:crystal.y,
        team:"green",
        health: stats.hp,
        maxHealth: stats.hp,
        moveSpeed: def.moveSpeed + (stats.speed - 10) * 0.001,
        power: stats.attack,
        stats, personality, role,
        currentResonance: 0,
        currentWill: stats.will,
        ultimateCharge: 0,
        walkCycle:0, moveCooldown:0,
        stance:"follow", isFollower:true, isHealing:false,
        hitFlash:0, dead:false,
        combatTrait:  Object.keys(COMBAT_TRAITS)[Math.floor(Math.random()*2)],
        naturalTrait: Object.keys(NATURAL_TRAITS)[Math.floor(Math.random()*2)],
        perk:         Object.keys(PERKS)[Math.floor(Math.random()*2)]
    };
    if (typeof followerUid === "function") followerUid(npc);
    // Its level: a little behind the arena's creatures (js/levels.js recruitLevel).
    if (typeof initFollowerLevel === "function") initFollowerLevel(npc, { level: recruitLevel() });
    actors.push(npc);
    followers.push(npc);
    followerByElement[element] = followerByElement[element]||[];
    followerByElement[element].push(npc);
    if (typeof partyAdmit === "function") partyAdmit(npc);   // the facility: the squad takes it if it has room, else it is posted where it is (js/party.js)
}

// RE-ROLL: send a follower back to the Crystal to be made again (the roster's RE-ROLL, js/commandcenter.js; the long-press ring). It keeps what it IS, its type and its element ("they have their class already"); what is made
// again is its personality (within the type), its stats, its traits and its perk. A clone or a ghost-phage is summoned, not recruited, so it has nothing to re-roll.
function canRerollFollower(actor) {
    return !!actor && !actor.dead && actor.team === 'green' && actor.isFollower && !actor.isClone && !actor.ghostphageLife && !actor.returningToCrystal;
}
// The follower leaves every list and walks home as a fresh recruit: the arrival block in updateNPC (js/npc.js) rolls an identity for an actor with no personality, so clearing the identity fields is the whole re-roll.
function startFollowerReroll(actor, quiet) {
    if (!canRerollFollower(actor)) return false;
    if (typeof breakBond === "function") breakBond(actor);   // re-made: someone new, unbonded
    actor.job = null; actor.stance = 'follow'; actor.post = null; actor._patrol = null;   // (a room it held is let go)
    const fi = followers.indexOf(actor); if (fi >= 0) followers.splice(fi, 1);
    const list = followerByElement[actor.element]; if (list) { const li = list.indexOf(actor); if (li >= 0) list.splice(li, 1); }
    actor.isFollower = false; actor.returningToCrystal = true;
    actor.wantType = typeof FOLLOWER_TYPES !== "undefined" && FOLLOWER_TYPES[actor.role] ? actor.role : null;   // (the arrival block makes it that type, and keeps the element)
    actor.keepElement = actor.element;
    actor.personality = null; actor.combatTrait = null; actor.naturalTrait = null; actor.perk = null; actor.convertFlash = 20;
    if (typeof equipClear === "function") equipClear(actor);   // someone new: its equip card slots are empty (js/cards.js)
    if (!quiet) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: 'RE-ROLLING AT THE CRYSTAL', color: '#0df', life: 100, vy: -0.25, size: 12 });
    return true;
}

// ─────────────────────────────────────────────────────────
//  SQUAD COMMAND POOL
// ─────────────────────────────────────────────────────────
// `withHeld`: the facility's COME (js/mixtool.js mixToolComePool), the way back from HOLD, reaches the followers holding rooms as well as the squad.
function getCommandPool(withHeld) {
    // CARDS SELECTED in the Command Center (js/commandcenter.js): the selection IS the command pool while any of it is alive.
    if (typeof selectedUnits !== "undefined" && selectedUnits.size) { const sel = [...selectedUnits].filter(a => a && !a.dead && a.team === "green"); if (sel.length) return sel; }
    // The facility (js/party.js): the orders reach the SQUAD, not the followers holding rooms (select those in the roster to order them); COME reaches them too.
    const live = typeof partyOn === "function" && partyOn() && !withHeld ? (a => !a.dead && !a.post) : (a => !a.dead);
    // THE MUTATOR'S CLONE (js/mutator.js) takes the squad's orders with it: HOLD, COME, RETREAT, the enemy card's ATTACK (the brief: the clone must be protected "through positioning, tactical decisions").
    const primary = typeof actors !== "undefined" ? actors.filter(a => a && a.isClone && a.primary && a.team === "green" && live(a)) : [];
    if (squadMode === "all" || (typeof hudCorners === "function" && hudCorners())) return followers.filter(live).concat(primary);   // (the corners layout has no element picker: the orders reach the whole squad, or the cards that are picked, above)
    if (selectedRole)        return followers.filter(a => live(a) && a.role === selectedRole);
    return (followerByElement[player.selectedElement] || []).filter(live);
}

function rebuildFollowerTable() {
    ELEMENTS.forEach(el => {
        if (!followerByElement[el.id]) followerByElement[el.id]=[];
        followerByElement[el.id].length=0;
    });
    followers.forEach(a => {
        if (!a.element) return;
        if (!followerByElement[a.element]) followerByElement[a.element]=[];
        followerByElement[a.element].push(a);
    });
}
