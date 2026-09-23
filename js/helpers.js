// ─────────────────────────────────────────────────────────
//  HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────
function getZoneIndex(x) { return Math.floor(x / ZONE_LENGTH); }
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
//   a.team==="red" || (a instanceof Predator && !a.isClone)      <- traps.js
//
// Every one of them counted a NEUTRAL RECRUIT as hostile, because a recruit is
// on team "red" until it reaches the Crystal. That is what killed
// reinforcements on the way in: not the predators, but your own followers'
// element attacks sweeping the area around whatever they were aiming at.
//
// Unifying them also closes the second form, which counted a green CLONE of
// yours as a target — chain lightning could jump to your own clone.
function isHostileTarget(a) {
    if (!a || a.dead) return false;
    if (isNeutralBystander(a)) return false;
    if (a.team === "red") return true;
    return typeof Predator !== "undefined" && (a instanceof Predator)
           && a.team !== "green" && !a.isClone;
}

function isNeutralBystander(a) {
    return !!(a && a.isNeutralRecruit && a.team === "red");
}

function hurtPlayer(amount, shakeAmt) {
    if (!(amount > 0)) return false;
    if (player.invuln > 0) return false;
    health = Math.max(0, health - amount);
    if (shakeAmt) shake = Math.max(shake, shakeAmt);
    return true;
}



function applyDamage(target, amount, source=null, element=null, isReflected=false) {
    if (!target || target.dead) return;
    // A recruit walking to the Crystal takes NOTHING, from anyone or anything.
    //
    // isHostileTarget above stops everything that deliberately picks a target,
    // and measuring the predator specials proved that holds: all seven
    // offensive abilities land in full on a follower standing beside a recruit
    // and do not scratch the recruit. What was left were the two paths that
    // never picked a target at all — the red health-decay pass, which bleeds
    // anything on team red, and the cocoon toxin, which named recruits
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
    // Command Node — 10% ATK bonus for followers dealing damage
    if (source && source.isFollower && source.team === "green") amount *= getFollowerAttackMult();
    // ARMY SURGE. Applied here rather than at each attack because the twelve
    // damage expressions in js/elements.js all funnel through this one
    // function — patching them individually would have missed one.
    // Followers and clones both count; the player's own shots do not, because
    // this is what the player spends rather than something they gain.
    if (armySurgeTimer > 0 && source && source.team === "green" &&
        (source.isFollower || source.isClone)) {
        amount *= ARMY_SURGE_POWER;
    }
    // Provoke predators hit during day
    if (target instanceof Predator && target.team !== "green" && gameState.phase === "day") {
        target.provoked = true; target.state = "hunt";
    }
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
    if (target.defenseShredded > 0) amount *= 1 / (target.defenseShredFactor||0.5);
    // Command Node — 10% incoming damage reduction for followers
    if (target && target.isFollower && target.team === "green") {
        amount *= getFollowerDefMult();
        // Defense stat mitigation — higher DEF = more damage absorbed
        if (target.stats && target.stats.defense) {
            amount *= 10 / (10 + target.stats.defense * 0.6);
        }
        // Hard cap: no single hit can remove more than 45% of max HP
        amount = Math.min(amount, (target.maxHealth || 20) * 0.45);
    }
    let dmg = amount;
    if (target.perk) {
        const pk = PERKS[target.perk];
        if (pk && pk.modifyIncomingDamage) dmg = pk.modifyIncomingDamage(target, dmg, source);
    }
    target.health -= dmg;
    if (source) target.lastAttacker = source;
    if (typeof target.hitFlash !== "undefined") target.hitFlash = 6;
    if (typeof target.hitStun  !== "undefined") target.hitStun  = 6;
    // ── DAMAGE TICKER ─────────────────────────────────────────
    if (source && !isReflected && dmg >= 1 &&
        (target.team === "red" || (target instanceof Predator && target.team !== "green" && !target.isClone))) {
        const _dtpx = (target.x - player.visualX - (target.y - player.visualY)) * TILE_W + canvas.width  / 2;
        const _dtpy = (target.x - player.visualX + (target.y - player.visualY)) * TILE_H + canvas.height / 2;
        const _dcol = element === "fire"     ? "#ff8844"
                    : element === "electric" ? "#ffff55"
                    : element === "ice"      ? "#aaeeff"
                    : element === "flux"     ? "#dd88ff"
                    : element === "core"     ? "#44ffcc"
                    : element === "toxic"    ? "#88ff44"
                    : "#ffcc88";
        floatingTexts.push({
            x: _dtpx + (Math.random() - 0.5) * 24,
            y: _dtpy - 28 + (Math.random() - 0.5) * 12,
            text: Math.round(dmg).toString(),
            color: _dcol,
            size: 14,
            life: 36,
            vy: -0.88 - Math.random() * 0.38
        });
    }
    if (typeof target.onHit    === "function")  target.onHit(source);
    // ── BEETLE REFLECT — returns the same damage to attacker, no amplification ──
    if (target.reflectDamage && source && !source.dead && !isReflected) {
        applyDamage(source, dmg, target, null, true);
        floatingTexts.push({ x:target.x, y:target.y-1, text:"REFLECT", color:"#cc88ff", life:35, vy:-0.05 });
    }
    if (target.health <= 0) {
        target.health = 0; target.dead = true;
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
    if (mult > 1) floatingTexts.push({x:target.x,y:target.y-1,text:'WEAK!',color:'#ffcc00',life:40,vy:-0.04});
    else if (mult < 1) floatingTexts.push({x:target.x,y:target.y-1,text:'RESIST',color:'#88aaff',life:40,vy:-0.04});
    applyDamage(target, amount * mult, source, element);
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
        a.health = a.maxHealth;
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
    if (typeof saveSession === "function") saveSession();
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

function spawnFireWall(x, y) {
    world.push({ type:"fireWall", x, y, life:180 });
}

function disruptEnemiesAt(x, y) {
    actors.forEach(a => {
        if (a.team==="red") {
            const dx=a.x-x, dy=a.y-y;
            if (dx*dx+dy*dy < 2.25) a.disrupted=30; // 1.5² = 2.25
        }
    });
}

function frenzyEnemiesAt(x, y) {
    actors.forEach(a => {
        const dx=a.x-x, dy=a.y-y;
        if (dx*dx+dy*dy < 2.25) a.frenzied=120; // 1.5² = 2.25
    });
}

function findNearestFriendlyPillar(actor) {
    let best=null, bestDist2=Infinity;
    _pillarCache.forEach(t => {
        if ((actor.team==="green"&&t.pillarTeam!=="green")||(actor.team==="red"&&t.pillarTeam!=="red")) return;
        const dx=t.x-actor.x, dy=t.y-actor.y, d2=dx*dx+dy*dy;
        if (d2<bestDist2) { bestDist2=d2; best=t; }
    });
    return best;
}

function convertNPC(actor, newTeam) {
    actor.team = newTeam;
    actor.stance = "follow";
    actor.convertFlash = 10;
    actor.returningToCrystal = true;
    actor.isFollower = false;
    dayStats.redConverted++;
}



function redsRemainingInExploredZones() {
    let count=0;
    actors.forEach(a => {
        if (!a.dead&&a.team==="red"&&exploredZones.has(getZoneIndex(Math.floor(a.x)))) count++;
    });
    return count;
}

function getEnemyAtTile(tile) {
    if (!tile) return null;
    let best=null, bestDist2=Infinity;
    actors.forEach(a => {
        const isHostile = (a instanceof Predator)||(a.team==="red");
        if (!isHostile || isNeutralBystander(a)) return;
        const dx=a.x-tile.x, dy=a.y-tile.y, d2=dx*dx+dy*dy;
        if (d2<2.25&&d2<bestDist2) { bestDist2=d2; best=a; } // 1.5² = 2.25
    });
    return best;
}

function detectCircleGesture() {
    if (gesturePoints.length<20) return false;
    let totalAngle=0;
    for (let i=2;i<gesturePoints.length;i++) {
        const p0=gesturePoints[i-2], p1=gesturePoints[i-1], p2=gesturePoints[i];
        let diff = Math.atan2(p2.y-p1.y,p2.x-p1.x) - Math.atan2(p1.y-p0.y,p1.x-p0.x);
        if (diff>Math.PI) diff-=Math.PI*2;
        if (diff<-Math.PI) diff+=Math.PI*2;
        totalAngle+=diff;
    }
    return Math.abs(totalAngle)>Math.PI*1.5;
}

function recallFollowers() {
    followers.forEach(a => { a.job=null; a.stance="follow"; });
}

function spawnFollowerAtCrystal(element) {
    if (!element) {
        if (activeCrystalModulation) {
            const pair = activeCrystalModulation.pair;
            element = pair[Math.floor(Math.random()*pair.length)];
        } else {
            const pool = [...unlockedElements];
            element = pool[Math.floor(Math.random()*pool.length)] || "fire";
        }
    }
    const def         = NPC_TYPES["virus"];
    const personality = PERSONALITY_KEYS[Math.floor(Math.random() * PERSONALITY_KEYS.length)];
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
    actors.push(npc);
    followers.push(npc);
    followerByElement[element] = followerByElement[element]||[];
    followerByElement[element].push(npc);
}

// ─────────────────────────────────────────────────────────
//  SQUAD COMMAND POOL
// ─────────────────────────────────────────────────────────
function getCommandPool() {
    if (uiTab === "clones") return actors.filter(a => a.isClone && !a.dead);
    if (squadMode === "all") return followers.filter(a => !a.dead);
    if (selectedRole)        return followers.filter(a => !a.dead && a.role === selectedRole);
    return (followerByElement[player.selectedElement] || []).filter(a => !a.dead);
}

// ─────────────────────────────────────────────────────────
//  GESTURE HELPERS
// ─────────────────────────────────────────────────────────
function detectVerticalLineGesture() {
    if (gesturePoints.length < 12) return false;
    let xMin=Infinity, xMax=-Infinity, yMin=Infinity, yMax=-Infinity;
    for (let i=0; i<gesturePoints.length; i++) {
        const p = gesturePoints[i];
        if (p.x < xMin) xMin = p.x; if (p.x > xMax) xMax = p.x;
        if (p.y < yMin) yMin = p.y; if (p.y > yMax) yMax = p.y;
    }
    const xRange = xMax - xMin, yRange = yMax - yMin;
    return yRange > 60 && xRange < yRange * 0.32;
}

function applyHoldLine() {
    const avgX = gesturePoints.reduce((s,p) => s+p.x, 0) / gesturePoints.length;
    holdLineX = Math.round((avgX - canvas.width/2) / TILE_W + player.visualX);
    getCommandPool().forEach(f => {
        if (f.dead) return;
        const ty = Math.round(f.y);
        const t = getTile(holdLineX, ty) || getTile(holdLineX, Math.round(player.y));
        if (t && !t.type.includes("wall")) { f.job = { type:"move", target:t }; f.stance = "hold"; }
    });
}

function detectEnemiesInCircle() {
    if (gesturePoints.length < 15) return [];
    let xMin=Infinity, xMax=-Infinity, yMin=Infinity, yMax=-Infinity;
    for (let i=0; i<gesturePoints.length; i++) {
        const p = gesturePoints[i];
        if (p.x < xMin) xMin = p.x; if (p.x > xMax) xMax = p.x;
        if (p.y < yMin) yMin = p.y; if (p.y > yMax) yMax = p.y;
    }
    const cx = (xMin+xMax)/2, cy = (yMin+yMax)/2;
    const r  = (xMax-xMin+yMax-yMin)/4+30;
    const enclosed = [];
    actors.forEach(a => {
        if (!(a instanceof Predator) && a.team!=="red") return;
        if (a.dead || isNeutralBystander(a)) return;
        const epx=(a.x-player.visualX-(a.y-player.visualY))*TILE_W+canvas.width/2;
        const epy=(a.x-player.visualX+(a.y-player.visualY))*TILE_H+canvas.height/2;
        if (Math.hypot(epx-cx,epy-cy)<r) enclosed.push(a);
    });
    return enclosed;
}

function issueAttackOnEnemies(enemies) {
    const pool = getCommandPool().filter(a => !a.job);
    const ordered = [];
    enemies.forEach((enemy, i) => {
        pool.slice(i*4, i*4+4).forEach(a => { a.job = { type:"attack", target:enemy }; ordered.push(a); });
    });
    // The tutorial's squad lesson watches who actually took the order — an
    // order nobody answered is the SEL/ALL distinction doing its job, not a
    // completed lesson.
    if (typeof tutorialNoteAttackOrder === "function") tutorialNoteAttackOrder(ordered);
    return ordered;
}

function detectFollowerToEnemyGesture(sx, sy, ex, ey) {
    // Gesture must travel significant distance
    if (Math.hypot(ex-sx, ey-sy) < 60) return null;
    let srcFollower = null;
    for (const f of followers) {
        if (f.dead) continue;
        const fpx=(f.x-player.visualX-(f.y-player.visualY))*TILE_W+canvas.width/2;
        const fpy=(f.x-player.visualX+(f.y-player.visualY))*TILE_H+canvas.height/2;
        if (Math.hypot(sx-fpx,sy-fpy)<48) { srcFollower=f; break; }
    }
    if (!srcFollower) return null;
    let tgtEnemy = null;
    for (const a of actors) {
        if (!(a instanceof Predator) && a.team!=="red") continue;
        if (a.dead || isNeutralBystander(a)) continue;
        const epx=(a.x-player.visualX-(a.y-player.visualY))*TILE_W+canvas.width/2;
        const epy=(a.x-player.visualX+(a.y-player.visualY))*TILE_H+canvas.height/2;
        if (Math.hypot(ex-epx,ey-epy)<52) { tgtEnemy=a; break; }
    }
    if (!tgtEnemy) return null;
    return { follower:srcFollower, enemy:tgtEnemy };
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
