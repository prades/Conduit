// ─────────────────────────────────────────────────────────
//  HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────
function getZoneIndex(x) { return Math.floor(x / ZONE_LENGTH); }
const getTile = (gx, gy) => world.find(t => t.x === gx && t.y === gy);



function applyDamage(target, amount, source=null, element=null, isReflected=false) {
    if (!target || target.dead) return;
    // Ghostphage ghost — immune to hazards; instantly killed by any direct attack
    if (target.ghostphageLife) {
        if (activeCrystalBuild==="ghostphage_ii") {
            // Upgraded: immune to hazards AND slow; direct attacks deal half damage
            if (!source || !source.team) return; // immune to hazards
            target.health -= amount * 0.5;
            if (target.health <= 0) { target.health=0; target.dead=true; }
            return;
        }
        if (source && source.team) { target.health=0; target.dead=true; }
        return; // hazard (null source) — immune
    }
    if (target.spawnProtection && target.spawnProtection > 0) return;
    // Command Node — 10% ATK bonus for followers dealing damage
    if (source && source.isFollower && source.team === "green") amount *= getFollowerAttackMult();
    // Predator Mark — enemies take +20% damage from all sources
    if (activeCrystalBuild === "predator_mark" && source &&
        (target.team === "red" || (target instanceof Predator && target.team !== "green")))
        amount *= 1.2;
    // Provoke predators hit during day
    if (target instanceof Predator && target.team !== "green" && gameState.phase === "day") {
        target.provoked = true; target.state = "hunt";
    }
    if (target.frozen) return;
    if (target.invulnerable && target.invulnerable > 0) return;
    if (target.smokeForm > 0 && Math.random() < (target.smokeEvasion||0.75)) return;
    // Spectral Veil — followers have 15% dodge chance; dodge grants resonance
    if (activeCrystalBuild === "spectral_veil" && target.isFollower && target.team === "green" && source && source.team !== "green") {
        if (Math.random() < 0.15) {
            target.currentResonance = Math.min((target.currentResonance||0) + 5, 100);
            if (typeof target.hitFlash !== "undefined") target.hitFlash = 3;
            return;
        }
    }
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
            const _killUltGain = activeCrystalBuild==="crystal_mind" ? 40 : 20;
            source.ultimateCharge = Math.min(100, source.ultimateCharge + _killUltGain);
        }
    }
    // ── ULTIMATE CHARGE GAIN ──────────────────────────────
    if (source && source.isFollower && source.team === "green" && !target.dead) {
        if (typeof source.ultimateCharge !== "number") source.ultimateCharge = 0;
        const _hitUltGain = activeCrystalBuild==="crystal_mind" ? 6 : 3;
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
        if (!isHostile) return;
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
        health: stats.hp + (followerPermHPBonus||0),
        maxHealth: stats.hp + (followerPermHPBonus||0),
        moveSpeed: def.moveSpeed + (stats.speed - 10) * 0.001,
        power: stats.attack + (followerPermPowerBonus||0),
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
//  ELITE FOLLOWER SPAWN  (armament shop)
// ─────────────────────────────────────────────────────────
function spawnEliteFollowerAtCrystal(element, powerMult, hpMult) {
    if (!element) {
        const pool = [...unlockedElements];
        element = pool[Math.floor(Math.random() * pool.length)] || "fire";
    }
    const def         = NPC_TYPES["virus"];
    const personality = PERSONALITY_KEYS[Math.floor(Math.random() * PERSONALITY_KEYS.length)];
    const base        = applyPersonality(personality);
    const boostedHP   = Math.round(base.hp     * hpMult)    + (followerPermHPBonus||0);
    const boostedATK  = Math.round(base.attack * powerMult) + (followerPermPowerBonus||0);
    const boostedSPD  = base.speed * 1.15;
    const stats       = { ...base, hp: boostedHP, attack: boostedATK, speed: Math.round(boostedSPD) };
    const role        = assignRole(stats);
    const npc = {
        type:"virus", element,
        x: crystal.x + (Math.random() - 0.5),
        y: crystal.y + (Math.random() - 0.5),
        team:"green",
        health: boostedHP, maxHealth: boostedHP,
        moveSpeed: def.moveSpeed + (stats.speed - 10) * 0.001,
        power: boostedATK,
        stats, personality, role,
        currentResonance: 0,
        currentWill: base.will,
        ultimateCharge: 0,
        walkCycle: 0, moveCooldown: 0,
        stance:"follow", isFollower:true, isElite:true, isHealing:false,
        hitFlash: 0, dead: false,
        combatTrait:  Object.keys(COMBAT_TRAITS)[Math.floor(Math.random() * 2)],
        naturalTrait: Object.keys(NATURAL_TRAITS)[Math.floor(Math.random() * 2)],
        perk:         Object.keys(PERKS)[Math.floor(Math.random() * 2)]
    };
    actors.push(npc);
    followers.push(npc);
    followerByElement[element] = followerByElement[element] || [];
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
        if (a.dead) return;
        const epx=(a.x-player.visualX-(a.y-player.visualY))*TILE_W+canvas.width/2;
        const epy=(a.x-player.visualX+(a.y-player.visualY))*TILE_H+canvas.height/2;
        if (Math.hypot(epx-cx,epy-cy)<r) enclosed.push(a);
    });
    return enclosed;
}

function issueAttackOnEnemies(enemies) {
    const pool = getCommandPool().filter(a => !a.job);
    enemies.forEach((enemy, i) => {
        pool.slice(i*4, i*4+4).forEach(a => { a.job = { type:"attack", target:enemy }; });
    });
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
        if (a.dead) continue;
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
