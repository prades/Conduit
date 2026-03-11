// ─────────────────────────────────────────────────────────
//  NPC UPDATE
// ─────────────────────────────────────────────────────────
function updateRTSNPC(actor) {
    if (actor.spawnProtection===undefined) actor.spawnProtection=0;
    if (actor.dead) return;
    if (actor.spawnProtection>0) { actor.spawnProtection--; }
    if (actor.hitFlash>0) actor.hitFlash--;

    if (actor.combatTrait) { const t=COMBAT_TRAITS[actor.combatTrait]; if(t&&t.onUpdate) t.onUpdate(actor); }
    if (actor.naturalTrait){ const t=NATURAL_TRAITS[actor.naturalTrait]; if(t&&t.onUpdate) t.onUpdate(actor); }

    // return to crystal
    if (!actor.dead&&actor.team==="green"&&actor.returningToCrystal) {
        const dx=crystal.x-actor.x, dy=crystal.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist>0.6) { actor.x+=(dx/dist)*actor.moveSpeed; actor.y+=(dy/dist)*actor.moveSpeed; }
        else {
            actor.returningToCrystal = false;
            actor.isFollower = true;
            // Assign identity at crystal if not yet assigned
            if (!actor.personality) {
                actor.personality = PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)];
                actor.stats       = applyPersonality(actor.personality);
                actor.role        = assignRole(actor.stats);
                actor.currentWill = actor.stats.will;
                actor.health      = actor.stats.hp;
                actor.maxHealth   = actor.stats.hp;
                actor.power       = actor.stats.attack;
                actor.moveSpeed   = NPC_TYPES["virus"].moveSpeed + (actor.stats.speed-10)*0.001;
            }
            // Always reassign element at crystal — world-spawn element is stale/irrelevant
            if (activeCrystalModulation) {
                actor.element = activeCrystalModulation.pair[Math.floor(Math.random()*activeCrystalModulation.pair.length)];
            } else {
                const pool = [...unlockedElements];
                actor.element = pool[Math.floor(Math.random()*pool.length)] || "fire";
            }
            if (!actor.combatTrait)  actor.combatTrait  = Object.keys(COMBAT_TRAITS)[Math.floor(Math.random()*2)];
            if (!actor.naturalTrait) actor.naturalTrait = Object.keys(NATURAL_TRAITS)[Math.floor(Math.random()*2)];
            if (!actor.perk)         actor.perk         = Object.keys(PERKS)[Math.floor(Math.random()*2)];
            // Flash element color on arrival
            actor.convertFlash = 30;
            actor.isNeutralRecruit = false;
            followers.push(actor);
            if (!followerByElement[actor.element]) followerByElement[actor.element]=[];
            followerByElement[actor.element].push(actor);
        }
        return;
    }

    // red healing
    if (actor.team==="red"&&actor.health<actor.maxHealth*0.5) {
        const pillar=findNearestFriendlyPillar(actor);
        if (pillar) {
            const dx=pillar.x-actor.x, dy=pillar.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
            if (dist>0.2) { actor.x+=(dx/dist)*actor.moveSpeed; actor.y+=(dy/dist)*actor.moveSpeed; }
            return;
        }
    }

    if (actor.disrupted>0) { actor.disrupted--; return; }
    if (actor.frenzied>0) {
        actor.frenzied--;
        let nearest=null, bd=Infinity;
        actors.forEach(other => {
            if (other===actor) return;
            const dx=other.x-actor.x, dy=other.y-actor.y, d=dx*dx+dy*dy;
            if (d<bd) { bd=d; nearest=other; }
        });
        if (nearest) {
            actor.x+=(nearest.x-actor.x)*actor.moveSpeed;
            actor.y+=(nearest.y-actor.y)*actor.moveSpeed;
        }
        return;
    }

    // element job
    if (actor.job&&actor.job.type==="elementJob") {
        const t=actor.job.target;
        actor.x+=(t.x-actor.x)*actor.moveSpeed; actor.y+=(t.y-actor.y)*actor.moveSpeed;
        const dx=actor.x-t.x, dy=actor.y-t.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<0.6) {
            if (!actor.job.executed) { performElementJob(actor,t); actor.job.executed=true; actor.job.timer=45; }
            actor.job.timer--;
            if (actor.job.timer<=0) actor.job=null;
        }
        return;
    }

    // merge into pylon — walk over, disappear, pylon activates attack mode
    if (actor.job&&actor.job.type==="merge_pylon") {
        const p=actor.job.target;
        if (!p||p.destroyed||!p.pendingUpgrade) { actor.job=null; return; }
        const dx=p.x-actor.x, dy=p.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist>0.5) {
            // Walk toward pylon
            actor.x+=dx*actor.moveSpeed*2; actor.y+=dy*actor.moveSpeed*2;
            actor.walkCycle+=actor.moveSpeed*40;
        } else {
            // Arrived — merge: absorb follower into pylon
            p.attackMode = true;
            p.attackModeElement = actor.element || "core";
            p.attackModeColor = actor.color || "#0f8";
            p.attackFireTimer = 0;
            p.attackRange = 2.5;
            p.attackPower = (actor.stats?.specialAttack||10) * 1.2;
            p.pendingUpgrade = false;
            p.upgradeFollower = null;
            p.pulseTimer = 0;
            // Visual merge flash
            for(let i=0;i<8;i++) shards.push({x:p.x,y:p.y,z:1+Math.random(),vz:-0.08-Math.random()*0.06,color:p.attackModeColor});
            // Remove follower
            actor.dead = true;
            actor.sacrificed = true;
            actor.job = null;
            // Remove from followers array
            const fi = followers.indexOf(actor);
            if (fi >= 0) followers.splice(fi, 1);
        }
        return;
    }

    // build new pylon (build mode)
    if (actor.job&&actor.job.type==="build_pylon") {
        const p=actor.job.target;
        if (!p||p.dead) { actor.job=null; return; }
        const dx=p.x-actor.x, dy=p.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist>0.5) {
            actor.x+=dx*actor.moveSpeed*2; actor.y+=dy*actor.moveSpeed*2;
            actor.walkCycle+=actor.moveSpeed*40;
        } else {
            p.constructProgress=(p.constructProgress||0)+1/actor.job.buildTime;
            if (p.constructProgress>=1) {
                p.constructing=false; p.constructProgress=1;
                p.health=p.maxHealth;
                actor.job=null;
            }
        }
        return;
    }

    // reconstruct
    if (actor.job&&actor.job.type==="reconstruct") {
        const p=actor.job.target;
        if (!p||p.destroyed||!p.reconstructing) { actor.job=null; return; }
        actor.x+=(p.x-actor.x)*actor.moveSpeed; actor.y+=(p.y-actor.y)*actor.moveSpeed;
        const dx=actor.x-p.x, dy=actor.y-p.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<0.8) p.reconstructProgress+=0.01;
        return;
    }

    // move / hold
    if (actor.job&&actor.job.type==="move") {
        if (actor.health<actor.maxHealth*0.5) { actor.job=null; }
        else {
            const t=actor.job.target;
            if (!t) { actor.job=null; return; }
            const dx=t.x-actor.x, dy=t.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
            if (dist>0.6) { actor.x+=(dx/dist)*actor.moveSpeed; actor.y+=(dy/dist)*actor.moveSpeed; }
            return;
        }
    }

    // destroy nest job — walk to live nest pod and bash it
    if (actor.job&&actor.job.type==="destroy_nest") {
        const nest=actor.job.target;
        if (!nest||nest.nestHealth<=0) { actor.job=null; return; }
        const dx=nest.x-actor.x, dy=(nest.y+0.5)-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist>1.0) {
            actor.x+=(dx/dist)*actor.moveSpeed;
            actor.y+=(dy/dist)*actor.moveSpeed;
        } else {
            if (!actor.attackCooldown) actor.attackCooldown=0;
            actor.attackCooldown--;
            if (actor.attackCooldown<=0) {
                const dmg=(actor.power||5)*0.5;
                nest.nestHealth=Math.max(0,nest.nestHealth-dmg);
                floatingTexts.push({x:nest.x,y:nest.y-0.5,text:"-"+Math.round(dmg),color:"#ff4400",life:25,vy:-0.05});
                actor.attackCooldown=45;
                if (nest.nestHealth<=0) {
                    floatingTexts.push({x:nest.x,y:nest.y-1,text:"NEST DESTROYED!",color:"#ff0000",life:60,vy:-0.1});
                    actor.job=null;
                }
            }
        }
        return;
    }

    // attack job
    if (actor.job&&actor.job.type==="attack") {
        const enemy=actor.job.target;
        if (!enemy||enemy.dead) { actor.job=null; actor.firstStrikeUsed=false; return; }
        const dx=enemy.x-actor.x, dy=enemy.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist>0.8) { actor.x+=dx*actor.moveSpeed; actor.y+=dy*actor.moveSpeed; }
        else {
            let dmg=actor.power*0.3;
            if (actor.damageMultiplier) dmg*=actor.damageMultiplier;
            applyDamage(enemy,dmg,actor);
            if (actor.perk) { const pk=PERKS[actor.perk]; if(pk&&pk.onDealDamage) pk.onDealDamage(actor,dmg); }
            if (enemy.health<=0) { enemy.dead=true; actor.job=null; actor.firstStrikeUsed=false; }
        }
        return;
    }

    // healing
    if (!actor.isHealing&&actor.health<actor.maxHealth*0.5) actor.isHealing=true;
    if ( actor.isHealing&&actor.health>=actor.maxHealth*0.95) actor.isHealing=false;
    if (actor.isHealing) {
        const pillar=findNearestFriendlyPillar(actor);
        if (pillar) {
            const dx=pillar.x-actor.x, dy=pillar.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
            if (dist>0.6) { actor.x+=(dx/dist)*actor.moveSpeed; actor.y+=(dy/dist)*actor.moveSpeed; }
            return;
        }
    }

    // ── WALK CYCLE + DIRECTION (before role returns) ──
    const dxM=actor.x-(actor.lastX??actor.x), dyM=actor.y-(actor.lastY??actor.y);
    if (Math.abs(dxM)>0.001||Math.abs(dyM)>0.001) {
        actor.walkCycle+=0.25;
        const dlen=Math.hypot(dxM,dyM);
        actor.dirX=dxM/dlen; actor.dirY=dyM/dlen;
    }
    actor.lastX=actor.x; actor.lastY=actor.y;

    // ── ROLE-DRIVEN MOVEMENT ──────────────────────────────
    if (actor.team==="green" && (actor.stance||"follow")==="follow") {

        // Acid avoidance — applied before role movement so it always wins
        for (const h of environmentalHazards) {
            if (h.type !== "acid" || !h.active) continue;
            for (const [tx, ty] of (h.tiles || [])) {
                const adx = actor.x - tx, ady = actor.y - ty;
                if (Math.abs(adx) < 1.0 && Math.abs(ady) < 1.0) {
                    const alen = Math.hypot(adx, ady) || 1;
                    actor.x += (adx / alen) * actor.moveSpeed * 5;
                    actor.y += (ady / alen) * actor.moveSpeed * 5;
                }
            }
        }

        const role = actor.role || "brawler";

        // Find nearest enemy — cache result for 8 frames to avoid per-frame full scan
        if (!actor._enemyCacheFrame || frame - actor._enemyCacheFrame >= 8 ||
            actor._nearestEnemy?.dead) {
            actor._nearestEnemy = null;
            let nearestEnemyDist = Infinity;
            actors.forEach(a => {
                if (a instanceof Predator && a.team !== "green" && !a.isClone && !a.dead) {
                    const dx=a.x-actor.x, dy=a.y-actor.y, d=Math.sqrt(dx*dx+dy*dy);
                    if (d < nearestEnemyDist) { nearestEnemyDist=d; actor._nearestEnemy=a; }
                }
            });
            actor._enemyCacheFrame = frame;
        }
        const nearestEnemy = actor._nearestEnemy;
        const nearestEnemyDist = nearestEnemy
            ? Math.hypot(nearestEnemy.x - actor.x, nearestEnemy.y - actor.y) : Infinity;

        // ── BRAWLER: chase nearest enemy aggressively, circle when in range ──
        if (role === "brawler") {
            if (nearestEnemy && nearestEnemyDist < 6) {
                const dx=nearestEnemy.x-actor.x, dy=nearestEnemy.y-actor.y;
                const dist=Math.sqrt(dx*dx+dy*dy);
                if (dist > 1.4) {
                    // Approach
                    actor.x+=(dx/dist)*actor.moveSpeed;
                    actor.y+=(dy/dist)*actor.moveSpeed;
                } else {
                    // In strike range — orbit the target while attacking
                    if (!actor.orbitDir) actor.orbitDir = Math.random() < 0.5 ? 1 : -1;
                    const tangX = (-dy/dist) * actor.orbitDir;
                    const tangY = ( dx/dist) * actor.orbitDir;
                    actor.x += tangX * actor.moveSpeed * 0.8;
                    actor.y += tangY * actor.moveSpeed * 0.8;
                    followerAttack(actor, nearestEnemy);
                }
            } else {
                // No nearby enemy — follow player
                const dx=player.x-actor.x, dy=player.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
                if (dist>FOLLOW_STOP) { actor.x+=(dx/dist)*actor.moveSpeed; actor.y+=(dy/dist)*actor.moveSpeed; }
            }
            return;
        }

        // ── SNIPER: maintain preferred distance, fire ranged projectiles ──
        if (role === "sniper") {
            const SNIPER_PREFERRED = 4.0;
            const SNIPER_MIN       = 2.5;

            if (nearestEnemy && nearestEnemyDist < 10) {
                const dx=nearestEnemy.x-actor.x, dy=nearestEnemy.y-actor.y;
                const dist=Math.sqrt(dx*dx+dy*dy);

                if (dist < SNIPER_MIN) {
                    actor.x-=(dx/dist)*actor.moveSpeed*1.2;
                    actor.y-=(dy/dist)*actor.moveSpeed*1.2;
                } else if (dist > SNIPER_PREFERRED) {
                    actor.x+=(dx/dist)*actor.moveSpeed*0.6;
                    actor.y+=(dy/dist)*actor.moveSpeed*0.6;
                } else {
                    // In sweet spot — fire ranged projectile
                    if (!actor.attackCooldown) actor.attackCooldown = 0;
                    if (actor.attackCooldown <= 0) {
                        const elDef = ELEMENTS.find(e=>e.id===actor.element);
                        const col   = elDef ? elDef.color : "#fff";
                        const dmg   = (actor.stats?.specialAttack||10) * 0.5;
                        spawnFollowerProjectile(actor, nearestEnemy, col, dmg, 5, null);
                        actor.attackCooldown = 55;
                        if (actor.currentWill !== undefined) actor.currentWill = Math.max(0, actor.currentWill - WILL_COST_SPECIAL);
                    } else {
                        actor.attackCooldown--;
                    }
                }
            } else {
                const dx=player.x-actor.x, dy=player.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
                if (dist > FOLLOW_STOP + 1.5) { actor.x+=(dx/dist)*actor.moveSpeed; actor.y+=(dy/dist)*actor.moveSpeed; }
            }
            return;
        }

        // ── CAMPER: anchor to nearest friendly pylon or crystal, engage short range only ──
        if (role === "camper") {
            const CAMPER_ENGAGE_RADIUS = 2.5;

            // Find anchor point — nearest friendly pylon or crystal
            const pillar = findNearestFriendlyPillar(actor);
            const anchorX = pillar ? pillar.x : crystal.x;
            const anchorY = pillar ? pillar.y : crystal.y;

            const dxA=anchorX-actor.x, dyA=anchorY-actor.y;
            const distAnchor=Math.sqrt(dxA*dxA+dyA*dyA);

            if (nearestEnemy && nearestEnemyDist < CAMPER_ENGAGE_RADIUS) {
                // Enemy close enough — engage
                const dx=nearestEnemy.x-actor.x, dy=nearestEnemy.y-actor.y;
                const dist=Math.sqrt(dx*dx+dy*dy);
                if (dist > 0.8) {
                    actor.x+=(dx/dist)*actor.moveSpeed*0.8;
                    actor.y+=(dy/dist)*actor.moveSpeed*0.8;
                } else {
                    followerAttack(actor, nearestEnemy);
                }
            } else if (distAnchor > 1.0) {
                // Return to anchor
                actor.x+=(dxA/distAnchor)*actor.moveSpeed;
                actor.y+=(dyA/distAnchor)*actor.moveSpeed;
            }
            return;
        }

        // Fallback — plain follow
        const dx=player.x-actor.x, dy=player.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist>FOLLOW_STOP) { actor.x+=(dx/dist)*actor.moveSpeed; actor.y+=(dy/dist)*actor.moveSpeed; }
        return;
    }

    // idle wander
    if (actor.moveCooldown>0) { actor.moveCooldown--; return; }
    const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
    const d=dirs[Math.floor(Math.random()*dirs.length)];
    actor.x+=(actor.x+d.x-actor.x)*actor.moveSpeed;
    actor.y+=(actor.y+d.y-actor.y)*actor.moveSpeed;
    actor.moveCooldown=60;
}

function updateNPC(actor) {
    if (actor instanceof Predator && actor.team !== "green") {
        actor.update();
    } else {
        const _prevX = actor.x, _prevY = actor.y;
        updateRTSNPC(actor);
        // Clamp all NPC actors to floor bounds regardless of role
        actor.y = Math.max(-0.5, Math.min(4, actor.y));
        // Tick walk cycle for clones based on actual movement
        if (actor.isClone) {
            const _moved = Math.hypot(actor.x - _prevX, actor.y - _prevY);
            if (_moved > 0.001) actor.walkCycle = (actor.walkCycle||0) + actor.moveSpeed * 40;
        }
    }
}
