// ─────────────────────────────────────────────────────────
//  HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────
function getZoneIndex(x) { return Math.floor(x / ZONE_LENGTH); }
const getTile = (gx, gy) => world.find(t => t.x === gx && t.y === gy);



function applyDamage(target, amount, source=null, element=null) {
    if (!target || target.dead) return;
    if (target.spawnProtection && target.spawnProtection > 0) return;
    // Clones cannot damage red predators
    if (source && source.isClone && target instanceof Predator && target.team !== "green") return;
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
                target.shielded = false; target.shieldAmount = 0;
                amount = overflow;
            } else { if (target.hitFlash !== undefined) target.hitFlash = 6; return; }
        } else if (element === 'flux') {
            // flux: damage blocked, status effects applied by caller land anyway
            return;
        } else {
            target.shieldAmount -= amount;
            if (target.shieldAmount <= 0) { target.shielded = false; target.shieldAmount = 0; }
            return;
        }
    }
    if (target.defenseShredded > 0) amount *= 1 / (target.defenseShredFactor||0.5);
    let dmg = amount;
    if (target.perk) {
        const pk = PERKS[target.perk];
        if (pk && pk.modifyIncomingDamage) dmg = pk.modifyIncomingDamage(target, dmg, source);
    }
    target.health -= dmg;
    if (source) target.lastAttacker = source;
    if (typeof target.hitFlash !== "undefined") target.hitFlash = 6;
    if (typeof target.hitStun  !== "undefined") target.hitStun  = 6;
    if (typeof target.onHit    === "function")  target.onHit(source);
    if (target.health <= 0) { target.health = 0; target.dead = true; }
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
            if (Math.sqrt(dx*dx+dy*dy)<1.5) a.disrupted=30;
        }
    });
}

function frenzyEnemiesAt(x, y) {
    actors.forEach(a => {
        const dx=a.x-x, dy=a.y-y;
        if (Math.sqrt(dx*dx+dy*dy)<1.5) a.frenzied=120;
    });
}

function findNearestFriendlyPillar(actor) {
    let best=null, bestDist=Infinity;
    world.forEach(t => {
        if (!t.pillar||t.destroyed) return;
        if ((actor.team==="green"&&t.pillarCol!=="#0f8")||(actor.team==="red"&&t.pillarCol!=="#f22")) return;
        const dx=t.x-actor.x, dy=t.y-actor.y, d=Math.sqrt(dx*dx+dy*dy);
        if (d<bestDist) { bestDist=d; best=t; }
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
        if (a.team==="red"&&exploredZones.has(getZoneIndex(Math.floor(a.x)))) count++;
    });
    return count;
}

function getEnemyAtTile(tile) {
    if (!tile) return null;
    let best=null, bestDist=Infinity;
    actors.forEach(a => {
        const isHostile = (a instanceof Predator)||(a.team==="red");
        if (!isHostile) return;
        const dx=a.x-tile.x, dy=a.y-tile.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<1.5&&dist<bestDist) { bestDist=dist; best=a; }
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
    const def         = NPC_TYPES["virus"];
    const personality = PERSONALITY_KEYS[Math.floor(Math.random() * PERSONALITY_KEYS.length)];
    const stats       = applyPersonality(personality);
    const role        = assignRole(stats);
    const npc = {
        type:"virus", element, x:crystal.x, y:crystal.y,
        team:"green",
        health: stats.hp, maxHealth: stats.hp,
        moveSpeed: def.moveSpeed + (stats.speed - 10) * 0.001,
        power: stats.attack,
        stats, personality, role,
        currentResonance: 0,
        currentWill: stats.will,
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
