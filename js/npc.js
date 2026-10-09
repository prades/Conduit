// ─────────────────────────────────────────────────────────
//  NPC UPDATE
// ─────────────────────────────────────────────────────────
function updateRTSNPC(actor) {
    if (actor.spawnProtection===undefined) actor.spawnProtection=0;
    if (actor.dead) return;
    if (actor.spawnProtection>0) { actor.spawnProtection--; }
    if (actor.hitFlash>0) actor.hitFlash--;
    if (actor.isFollower && actor.state === "attack") {
        actor.attackAnim = (actor.attackAnim||0) + 0.18;
        if (actor.attackAnim >= Math.PI) { actor.attackAnim = 0; actor.state = "idle"; }
    }

    // ── WORK CREW ──
    // A follower on worker duty runs the charged-mass chain instead of fighting.
    // An explicit order from the player still wins — followerWorkTick defers
    // when actor.job is set.
    if (actor.isFollower && actor.duty === "worker" && followerWorkTick(actor)) return;

    if (actor.combatTrait) { const t=COMBAT_TRAITS[actor.combatTrait]; if(t&&t.onUpdate) t.onUpdate(actor); }
    if (actor.naturalTrait){ const t=NATURAL_TRAITS[actor.naturalTrait]; if(t&&t.onUpdate) t.onUpdate(actor); }

    // ── EMP SPEED BOOST TIMER ──
    if ((actor._empBoostTimer||0) > 0) {
        actor._empBoostTimer--;
        if (actor._empBoostTimer === 0 && actor._empBaseSpeed != null) {
            actor.moveSpeed = actor._empBaseSpeed;
            actor._empBaseSpeed = null;
            if (actor._empBaseBase !== undefined) { actor.baseMoveSpeed = actor._empBaseBase; actor._empBaseBase = undefined; }
        }
    }

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
                // The speed stat is the BASE: tickSlowSpeed pins moveSpeed to
                // baseMoveSpeed, which was captured while this was still a plain
                // virus, so the personality's speed did nothing.
                actor.baseMoveSpeed = actor.moveSpeed; actor.slowed = 0; actor.slowFactor = 1;
            }
            // Always reassign element at crystal — world-spawn element is stale/irrelevant
            // The modulation slider decides the pool. It used to draw a label
            // and a row of swatches and nothing read the result — recruits just
            // took a random unlocked element regardless of where the slider sat.
            // A boss modulator still overrides it.
            if (activeCrystalModulation) {
                actor.element = activeCrystalModulation.pair[Math.floor(Math.random()*activeCrystalModulation.pair.length)];
            } else {
                const pool = recruitElementPool();
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
            p.attackModeElement = p.chosenElement || actor.element || "core";
            const _chEl = PYLON_PICKER_TYPES.find(e=>e.id===p.attackModeElement);
            p.attackModeColor = p.chosenColor || (_chEl ? _chEl.color : actor.color) || "#0f8";
            // Neutral pylons carry no element, so the flag travels with the choice.
            p.isGenerator = (p.attackModeElement === GENERATOR_ID);
            if (p.isGenerator) { p.maxHealth = SHIELD_GEN_HP; p.health = p.maxHealth; }
            p.isConnector = (p.attackModeElement === CONNECTOR_ID);
            if (p.isConnector && p.circuitOn === undefined) p.circuitOn = true;
            if (!p.isGenerator && !p.isConnector && isWaveKind(p.chosenKind)) { p.waveMode = true; p.attackMode = false; }
            if (!p.isGenerator && !p.isConnector && p.chosenKind === "battery") { p.isBattery = true; p.attackMode = false; p.waveMode = false; }
            p.chosenElement = null; p.chosenColor = null; p.chosenKind = null;
            p.attackFireTimer = 0;
            p.attackRange = TURRET_RANGE;
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
        if (!p||p.dead||!p.constructing) { actor.job=null; return; }
        const dx=p.x-actor.x, dy=p.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist>0.5) {
            actor.x+=dx*actor.moveSpeed*2; actor.y+=dy*actor.moveSpeed*2;
            actor.walkCycle+=actor.moveSpeed*40;
        } else {
            p.constructProgress=(p.constructProgress||0)+1/actor.job.buildTime;
            if (p.constructProgress>=1) {
                p.constructing=false; p.constructProgress=1;
                p.health=p.maxHealth;
                // Activate the pylon with its chosen element now that construction is done
                if (p.chosenElement) {
                    p.attackMode=true; p.waveMode=false;
                    p.attackModeElement=p.chosenElement;
                    const _chEl=PYLON_PICKER_TYPES.find(e=>e.id===p.chosenElement);
                    p.attackModeColor=p.chosenColor||(_chEl?_chEl.color:"#0f8");
                    p.isGenerator=(p.chosenElement===GENERATOR_ID);
                    if (p.isGenerator) { p.maxHealth = SHIELD_GEN_HP; p.health = p.maxHealth; }
                    p.isConnector=(p.chosenElement===CONNECTOR_ID);
                    if (p.isConnector && p.circuitOn === undefined) p.circuitOn = true;
                    p.attackPower=TURRET_POWER; p.attackRange=TURRET_RANGE;
                    p.attackFireTimer=0; p.pulseTimer=0;
                    if (!p.isGenerator && !p.isConnector && isWaveKind(p.chosenKind)) { p.waveMode = true; p.attackMode = false; }
                    if (!p.isGenerator && !p.isConnector && p.chosenKind === "battery") { p.isBattery = true; p.attackMode = false; p.waveMode = false; }
                    p.chosenElement=null; p.chosenColor=null; p.chosenKind=null;
                }
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

    // move / hold — guard position, attack nearby enemies
    if (actor.job&&actor.job.type==="move") {
        if (actor.health<actor.maxHealth*0.5) { actor.job=null; }
        else {
            const t=actor.job.target;
            if (!t) { actor.job=null; return; }
            // A far order goes by nest when that is quicker (teleportRouteFor in
            // commands.js): worked out once, then walked to the entry nest.
            if (actor.job.route === undefined)
                actor.job.route = typeof teleportRouteFor === "function" ? teleportRouteFor(actor, t.x, t.y) : null;
            // Refresh nearby-enemy cache every 10 frames
            if (!actor._guardCacheFrame || frame-actor._guardCacheFrame>=10 || actor._guardEnemy?.dead) {
                // Only real enemies (isHostileTarget): a neutral recruit wandering
                // by is "not green" too, and a follower on a move order locked
                // onto one it could never hurt and stood there for good. A HACK
                // team (autoplay) only turns on what is right on top of it.
                actor._guardEnemy=null; let bd2=actor.hackOrder ? 2.25 : 20.25; // 1.5² / 4.5²
                actors.forEach(a=>{ if(isHostileTarget(a)){const dx=a.x-actor.x,dy=a.y-actor.y,d2=dx*dx+dy*dy;if(d2<bd2){bd2=d2;actor._guardEnemy=a;}} });
                actor._guardCacheFrame=frame;
            }
            const enemy=actor._guardEnemy&&!actor._guardEnemy.dead?actor._guardEnemy:null;
            if (enemy) {
                // Engage enemy — move toward it and attack
                const ed=Math.hypot(enemy.x-actor.x,enemy.y-actor.y);
                if (ed>0.8) { actor.x+=(enemy.x-actor.x)/ed*actor.moveSpeed; actor.y+=(enemy.y-actor.y)/ed*actor.moveSpeed; }
                followerAttack(actor,enemy);
            } else {
                // No threat — hold position (by way of the nests, if routed).
                const _r = actor.job.route;
                const g = _r ? teleportSpot(_r.enter) : t;
                const dx=g.x-actor.x, dy=g.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
                if (_r && dist < ROUTE_REACH) {
                    routeTeleport(actor, _r); actor.job.route = null;
                    // Recalled to you: through the nests, it follows again.
                    if (actor.job.follow) actor.job = null;
                }
                else if (dist>0.6) { actor.x+=(dx/dist)*actor.moveSpeed; actor.y+=(dy/dist)*actor.moveSpeed; }
            }
            return;
        }
    }

    // capture node job — walk to capturable tile and hold position to fill progress
    if (actor.job&&actor.job.type==="capture_node") {
        const node=actor.job.target;
        if (!node||node.captured) { actor.job=null; return; }
        const dx=node.x-actor.x, dy=node.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist>0.7) {
            actor.x+=(dx/dist)*actor.moveSpeed; actor.y+=(dy/dist)*actor.moveSpeed;
        }
        // Stay at node — job remains active until captured (updateCaptureProgress clears it)
        return;
    }

    // attack job
    if (actor.job&&actor.job.type==="attack") {
        const enemy=actor.job.target;
        if (!enemy||enemy.dead) { actor.job=null; actor.firstStrikeUsed=false; return; }
        const dx=enemy.x-actor.x, dy=enemy.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
        // At its ordinary speed. This moved dx*moveSpeed — a share of the
        // DISTANCE every frame, so a follower circled onto a bug across the map
        // started out at twenty times its pace and slowed as it closed in.
        // REPORTED: "they should not sprint from across the map ... they
        // should follow the regular rules of speed."
        if (dist>0.8) { actor.x+=dx/dist*actor.moveSpeed; actor.y+=dy/dist*actor.moveSpeed; }
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

        // A HYBRID moves like a brawler (it had no branch at all, so the strongest
        // recruits fell through to a passive follow); followerAttack still reads
        // actor.role, which is what lets it reach for specials more freely.
        const role = (actor.role === "hybrid" ? "brawler" : actor.role) || "brawler";

        // Find nearest enemy — cache result for 8 frames to avoid per-frame full scan.
        // Followers ignore wandering (un-provoked) predators; only engage hostile ones.
        if (!actor._enemyCacheFrame || frame - actor._enemyCacheFrame >= 8 ||
            actor._nearestEnemy?.dead) {
            actor._nearestEnemy = null;
            let nearestEnemyDist = Infinity;
            const _inReach = [];
            actors.forEach(a => {
                if (a instanceof Predator && a.team !== "green" && !a.isClone && !a.dead && !a.untargetable) {
                    // Skip predators that are wandering and haven't been provoked
                    if (a.state === "wander" && !a.provoked) return;
                    const dx=a.x-actor.x, dy=a.y-actor.y, d=Math.sqrt(dx*dx+dy*dy);
                    if (d < nearestEnemyDist) { nearestEnemyDist=d; actor._nearestEnemy=a; }
                    if (d < 6) _inReach.push(a);
                }
            });
            // OPPORTUNISTIC picks the weakest enemy in reach instead of the nearest.
            const _ct = actor.combatTrait && COMBAT_TRAITS[actor.combatTrait];
            if (_ct && _ct.onTargetSelect && _inReach.length) {
                actor._nearestEnemy = _ct.onTargetSelect(actor, _inReach) || actor._nearestEnemy;
            }
            actor._enemyCacheFrame = frame;
        }
        const nearestEnemy = actor._nearestEnemy;
        const nearestEnemyDist = nearestEnemy
            ? Math.hypot(nearestEnemy.x - actor.x, nearestEnemy.y - actor.y) : Infinity;

        // ── BRAWLER: chase nearest enemy aggressively, circle when in range ──
        if (role === "brawler") {
            if (nearestEnemy && nearestEnemyDist < 6) {
                const dx=nearestEnemy.x-actor.x, dy=nearestEnemy.y-actor.y;
                // Floored: standing exactly on the target makes dist 0, and the
                // orbit below divides by it. -dy/0 is NaN, and a NaN position
                // never recovers — see the net in updateNPC.
                const dist=Math.max(NPC_MIN_DIST, Math.sqrt(dx*dx+dy*dy));
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
                followPlayer(actor);
            }
            return;
        }

        // ── SNIPER: maintain preferred distance, fire ranged projectiles ──
        if (role === "sniper") {
            const SNIPER_PREFERRED = 4.0;
            const SNIPER_MIN       = 2.5;

            if (nearestEnemy && nearestEnemyDist < 10) {
                const dx=nearestEnemy.x-actor.x, dy=nearestEnemy.y-actor.y;
                // Floored for the same reason as the brawler's orbit: the
                // back-off below runs for every dist under SNIPER_MIN, zero
                // included.
                const dist=Math.max(NPC_MIN_DIST, Math.sqrt(dx*dx+dy*dy));

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
        followPlayer(actor);
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

// Following the player with the NATURAL traits applied:
//   LONE WOLF  keeps its distance (onIdle sets wanderRadius, read as the stop range)
//   EMPATHETIC leans toward its nearest allies — the point it walks to is half
//              60% of the way from the player to the centre of the allies around it
// Both used to be defined and never read, so the traits did nothing.
const EMPATHETIC_RANGE = 5;
function followPlayer(actor) {
    const nt = actor.naturalTrait && NATURAL_TRAITS[actor.naturalTrait];
    if (nt && nt.onIdle) nt.onIdle(actor);
    let tx = player.x, ty = player.y, stop = actor.wanderRadius || FOLLOW_STOP;
    if (actor.preferGroup) {
        let sx = 0, sy = 0, n = 0;
        for (const o of followers) {
            if (o === actor || o.dead || !o.isFollower) continue;
            if (Math.hypot(o.x - actor.x, o.y - actor.y) <= EMPATHETIC_RANGE) { sx += o.x; sy += o.y; n++; }
        }
        if (n > 0) { tx = tx * 0.4 + (sx / n) * 0.6; ty = ty * 0.4 + (sy / n) * 0.6; }
    }
    const dx = tx - actor.x, dy = ty - actor.y, dist = Math.hypot(dx, dy);
    if (dist > stop) { actor.x += (dx / dist) * actor.moveSpeed; actor.y += (dy / dist) * actor.moveSpeed; }
}

function updateNPC(actor) {
    if (actor instanceof Predator && actor.team !== "green") {
        actor.update();
    } else {
        const _prevX = actor.x, _prevY = actor.y;
        updateRTSNPC(actor);
        // Back on the floor. This used to pick its own lower bound: -0.5
        // normally, which is short of the y=-1 row the nests and wall panels
        // are on, and -1.5 when the job in hand pointed at that row — which is
        // half a tile INSIDE the back wall. One bound, and it is the real edge
        // of the floor, so a follower can reach a nest without walking through
        // the wall behind it.
        // THE NET. Every follower movement above divides by a distance, and
        // the guards are per-branch: a new one that forgets is a NaN that
        // sticks. Put the unit back where it was rather than let it keep a
        // coordinate that poisons every effect it spawns and every draw it is
        // part of (createRadialGradient throws on a non-finite value, which
        // takes the whole frame with it).
        if (!Number.isFinite(actor.x) || !Number.isFinite(actor.y)) {
            actor.x = Number.isFinite(_prevX) ? _prevX : (crystal ? crystal.x : 0);
            actor.y = Number.isFinite(_prevY) ? _prevY : (crystal ? crystal.y : 2);
        }
        clampToFloor(actor);
        // Tick walk cycle for clones based on actual movement
        if (actor.isClone) {
            const _moved = Math.hypot(actor.x - _prevX, actor.y - _prevY);
            if (_moved > 0.001) actor.walkCycle = (actor.walkCycle||0) + actor.moveSpeed * 40;
        }
    }
}
