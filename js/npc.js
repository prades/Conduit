// ─────────────────────────────────────────────────────────
//  NPC UPDATE
// ─────────────────────────────────────────────────────────
// One step toward (dx, dy) at the unit's speed, WALKING: the legs are drawn
// from walkCycle and it faces the way it goes. These moves (home to the
// Crystal, out to a POSITION, a room's round) return before the shared
// walk-cycle block below, and changed x and y and nothing else — the unit
// glided on still legs.
function _walkStep(actor, dx, dy, dist, pace) {   // pace: a share of its speed (a posted follower's round is a stroll), 1 when not given
    { const w = facilitySteer(actor, actor.x + dx, actor.y + dy), sx = w[0] - actor.x, sy = w[1] - actor.y, sd = Math.hypot(sx, sy); if (sd > 1e-6) { dx = sx; dy = sy; dist = sd; } }   // round the facility's walls
    const k = pace || 1;
    actor.x += (dx / dist) * actor.moveSpeed * k; actor.y += (dy / dist) * actor.moveSpeed * k;
    actor.walkCycle = (actor.walkCycle || 0) + actor.moveSpeed * 40 * k;
    actor.dirX = dx / dist; actor.dirY = dy / dist;
    actor.lastX = actor.x; actor.lastY = actor.y;
}

// A step toward (tx, ty) at the unit's speed (times speedMult), round the facility's walls; returns how far away it still was.
function _moveToward(actor, tx, ty, speedMult) {
    { const w = facilitySteer(actor, tx, ty); tx = w[0]; ty = w[1]; }   // round the facility's walls (js/facilityplay.js)
    const dx = tx - actor.x, dy = ty - actor.y;
    const d  = Math.hypot(dx, dy);
    if (d < 1e-6) return 0;
    const sp = (actor.moveSpeed || 0.02) * (speedMult || 1);
    actor.x += (dx / d) * sp;
    actor.y += (dy / d) * sp;
    actor.walkCycle = (actor.walkCycle || 0) + sp * 40;
    return d;
}

function updateRTSNPC(actor) {
    if (actor.spawnProtection===undefined) actor.spawnProtection=0;
    if (actor.dead) return;
    if (actor.spawnProtection>0) { actor.spawnProtection--; }
    if (actor.hitFlash>0) actor.hitFlash--;
    if (actor.isClone && typeof cloneTick === "function" && cloneTick(actor)) return;   // a clone's special and its abdomen shot (js/clone.js): a special that is winding up or under way has the step
    if (actor.isFollower && actor.state === "attack") {
        actor.attackAnim = (actor.attackAnim||0) + 0.18;
        if (actor.attackAnim >= Math.PI) { actor.attackAnim = 0; actor.state = "idle"; }
    }

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

    // A HOLD is a standing move order (stance "hold" + job "move"). When the job is dropped (it was hurt below half and went to heal, its target tile went, a new order
    // replaced it) the stance used to stay "hold" with nothing to hold: the unit stood there for good, ignoring COME and the player. No post, no hold.
    if (actor.team==="green" && actor.stance==="hold" && !actor.job && !actor.post) actor.stance="follow";   // (a post, js/party.js, is a hold with no job: it holds a room)

    // return to crystal
    if (!actor.dead&&actor.team==="green"&&actor.returningToCrystal) {
        const dx=crystal.x-actor.x, dy=crystal.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
        // REPORTED: "the recruits walk back to the crystal, not float back.
        // Their legs need to move." (_walkStep)
        if (dist>0.6) _walkStep(actor, dx, dy, dist);
        else {
            actor.returningToCrystal = false;
            actor.isFollower = true;
            // Assign identity at crystal if not yet assigned
            if (!actor.personality) {
                actor.personality = personalityForType(actor.wantType);   // (a re-roll asks for a type: js/helpers.js startFollowerReroll; a find is a draw)
                actor.wantType    = null;
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
            // Its LEVEL (js/levels.js recruitLevel): a little behind the arena's creatures.
            if (!Number.isFinite(actor.level) && typeof initFollowerLevel === "function") initFollowerLevel(actor, { level: recruitLevel() });
            // A follower that is made again keeps its element (js/helpers.js startFollowerReroll); one that is found or recruited takes an even draw of the six (its element in the world is stale and irrelevant).
            if (actor.keepElement) { actor.element = actor.keepElement; actor.keepElement = null; }
            else { const pool = [...unlockedElements]; actor.element = pool[Math.floor(Math.random()*pool.length)] || "fire"; }
            if (!actor.combatTrait)  actor.combatTrait  = Object.keys(COMBAT_TRAITS)[Math.floor(Math.random()*2)];
            if (!actor.naturalTrait) actor.naturalTrait = Object.keys(NATURAL_TRAITS)[Math.floor(Math.random()*2)];
            if (!actor.perk)         actor.perk         = Object.keys(PERKS)[Math.floor(Math.random()*2)];
            // Flash element color on arrival
            actor.convertFlash = 30;
            actor.isNeutralRecruit = false;
            followers.push(actor);
            if (!followerByElement[actor.element]) followerByElement[actor.element]=[];
            followerByElement[actor.element].push(actor);
            if (typeof partyAdmit === "function") partyAdmit(actor);   // (js/party.js)
        }
        return;
    }

    // A TECHNICIAN'S ABILITY directs this walk (js/techabilities.js): to the Kinetic Launcher (or the technician) that throws it, to a site its launcher is being set up at, to a broken section it drops through, to its spot behind its Photonic
    // Shield, to the rubble or the enemy its Thermite Drill is at, to where its Blight Spider leaves a pool
    if (typeof techStepWants === "function" && techStepWants(actor) && techStepOverride(actor)) return;

    // move / hold — guard position, attack nearby enemies
    if (actor.job&&actor.job.type==="move") {
        if (actor.health<actor.maxHealth*0.5) { actor.job=null; }
        else {
            const t=actor.job.target;
            if (!t) { actor.job=null; return; }
            // Refresh nearby-enemy cache every 10 frames
            if (!actor._guardCacheFrame || frame-actor._guardCacheFrame>=10 || actor._guardEnemy?.dead) {
                // Only real enemies (isHostileTarget): a neutral recruit wandering
                // by is "not green" too, and a follower on a move order locked
                // onto one it could never hurt and stood there for good.
                actor._guardEnemy=null; let bd2=20.25; // 4.5²
                actors.forEach(a=>{ if(isHostileTarget(a)){const dx=a.x-actor.x,dy=a.y-actor.y,d2=dx*dx+dy*dy;if(d2<bd2){bd2=d2;actor._guardEnemy=a;}} });
                actor._guardCacheFrame=frame;
            }
            const enemy=actor._guardEnemy&&!actor._guardEnemy.dead?actor._guardEnemy:null;
            if (enemy && actor.isClone && typeof cloneFight === "function") { cloneFight(actor, enemy); return; }   // a clone bites as its species does (js/clone.js)
            if (actor.isClone && typeof cloneCalm === "function") cloneCalm(actor);
            if (enemy) {
                // Engage enemy — move toward it and attack
                const ed=Math.hypot(enemy.x-actor.x,enemy.y-actor.y);
                if (ed>0.8) { actor.x+=(enemy.x-actor.x)/ed*actor.moveSpeed; actor.y+=(enemy.y-actor.y)/ed*actor.moveSpeed; }
                followerAttack(actor,enemy);
            } else {
                // No threat — hold position
                const dx=t.x-actor.x, dy=t.y-actor.y, dist=Math.sqrt(dx*dx+dy*dy);
                if (dist>0.6) _walkStep(actor, dx, dy, dist);
            }
            return;
        }
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

    // healing (the state the roster shows; it mends as it follows)
    if (!actor.isHealing&&actor.health<actor.maxHealth*0.5) actor.isHealing=true;
    if ( actor.isHealing&&actor.health>=actor.maxHealth*0.95) actor.isHealing=false;

    // ── WALK CYCLE + DIRECTION (before role returns) ──
    const dxM=actor.x-(actor.lastX??actor.x), dyM=actor.y-(actor.lastY??actor.y);
    if (Math.abs(dxM)>0.001||Math.abs(dyM)>0.001) {
        actor.walkCycle+=0.25;
        const dlen=Math.hypot(dxM,dyM);
        actor.dirX=dxM/dlen; actor.dirY=dyM/dlen;
    }
    actor.lastX=actor.x; actor.lastY=actor.y;

    // ── ROLE-DRIVEN MOVEMENT ──────────────────────────────
    if (actor.team==="green" && ((actor.stance||"follow")==="follow" || actor.post)) {

        // A HYBRID moves like a brawler (it had no branch at all, so the strongest
        // recruits fell through to a passive follow); followerAttack still reads
        // actor.role, which is what lets it reach for specials more freely.
        const role = (actor.role === "hybrid" ? "brawler" : actor.role) || "brawler";

        // Find nearest enemy — cache result for 8 frames to avoid per-frame full scan.
        // Followers ignore wandering (un-provoked) predators; only engage hostile ones.
        // AN ATTACK ORDER (the enemy card, js/mixtool.js): a unit sent at one creature goes for THAT one, whatever is nearer and whether it is calm or not, and chases it however far it is (up to the leash).
        const _ord = attackOrderTarget(actor);
        if (_ord) { actor._nearestEnemy = _ord; actor._enemyCacheFrame = frame; }
        else if (!actor._enemyCacheFrame || frame - actor._enemyCacheFrame >= 8 ||
            actor._nearestEnemy?.dead) {
            actor._nearestEnemy = null;
            let nearestEnemyDist = Infinity;
            const _inReach = [];
            // THE BATTLE CONTROLS (js/mixtool.js): a unit told to RETREAT sees no enemy until its time is up, and with a FOCUS set it goes for that class of enemy first.
            const _retreating = actor.retreatUntil > frame, _focus = typeof battleFocus !== "undefined" ? battleFocus : null;
            let _focusBest = null, _focusD = Infinity;
            const _room = actor.post || null;   // a POSTED follower (js/party.js) fights what is in its room, and nothing outside it
            if (!_retreating) actors.forEach(a => {
                if (a instanceof Predator && a.team !== "green" && !a.isClone && !a.dead && !a.untargetable) {
                    // Skip predators that are wandering and haven't been provoked
                    if (a.state === "wander" && !a.provoked) return;
                    if (_room && partyRoomAt(a.x, a.y) !== _room) return;
                    const dx=a.x-actor.x, dy=a.y-actor.y, d=Math.sqrt(dx*dx+dy*dy);
                    if (d < nearestEnemyDist) { nearestEnemyDist=d; actor._nearestEnemy=a; }
                    if (d < 6) _inReach.push(a);
                    if (_focus && a.className === _focus && d < _focusD) { _focusD = d; _focusBest = a; }
                }
            });
            // OPPORTUNISTIC picks the weakest enemy in reach instead of the nearest.
            const _ct = actor.combatTrait && COMBAT_TRAITS[actor.combatTrait];
            if (_ct && _ct.onTargetSelect && _inReach.length) {
                actor._nearestEnemy = _ct.onTargetSelect(actor, _inReach) || actor._nearestEnemy;
            }
            // the FOCUS wins over a trait's pick (OPPORTUNISTIC chose the weakest in reach, which was whichever class it happened to be)
            if (_focusBest && _focusD < BATTLE_FOCUS_REACH) actor._nearestEnemy = _focusBest;
            actor._enemyCacheFrame = frame;
        }
        const nearestEnemy = actor._nearestEnemy;
        const nearestEnemyDist = nearestEnemy
            ? Math.hypot(nearestEnemy.x - actor.x, nearestEnemy.y - actor.y) : Infinity;
        const _reach = _ord ? 1e3 : (typeof playReach === "function" ? playReach(actor) : 1);   // PLAY STYLE scales how far a unit goes after an enemy (js/commandcenter.js); one sent at a creature goes the whole way

        // ── BRAWLER: chase nearest enemy aggressively, circle when in range ──
        if (role === "brawler") {
            if (actor.isClone && typeof cloneFight === "function") {   // a clone: its species' bite, in two beats (js/clone.js), else it walks with you
                if (nearestEnemy && nearestEnemyDist < 6 * _reach) cloneFight(actor, nearestEnemy);
                else { if (typeof cloneCalm === "function") cloneCalm(actor); followPlayer(actor); }
                return;
            }
            if (nearestEnemy && nearestEnemyDist < 6 * _reach) {
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
                // No nearby enemy — follow player (a posted follower walks its room's round instead: js/party.js)
                if (actor.post) partyPatrol(actor); else followPlayer(actor);
            }
            return;
        }

        // ── SNIPER: maintain preferred distance, fire ranged projectiles ──
        if (role === "sniper") {
            const SNIPER_PREFERRED = 4.0;
            const SNIPER_MIN       = 2.5;

            if (nearestEnemy && nearestEnemyDist < 10 * _reach) {
                const dx=nearestEnemy.x-actor.x, dy=nearestEnemy.y-actor.y;
                // Floored for the same reason as the brawler's orbit: the
                // back-off below runs for every dist under SNIPER_MIN, zero
                // included.
                const dist=Math.max(NPC_MIN_DIST, Math.sqrt(dx*dx+dy*dy));

                if (dist < SNIPER_MIN) {
                    actor.x-=(dx/dist)*actor.moveSpeed*1.2;
                    actor.y-=(dy/dist)*actor.moveSpeed*1.2;
                } else if (dist > SNIPER_PREFERRED) {
                    const _sp = _ord && dist > SNIPER_PREFERRED + 2 ? 1 : 0.6;   // (a creature it was sent at, far off: at its full pace)
                    actor.x+=(dx/dist)*actor.moveSpeed*_sp;
                    actor.y+=(dy/dist)*actor.moveSpeed*_sp;
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
                if (actor.post) partyPatrol(actor);   // (posted: its room's round, js/party.js)
                else followPlayer(actor);   // the route round the walls, not a straight line (js/facilityplay.js)
            }
            return;
        }

        // ── CAMPER (the technician): follows the squad like the others and engages at short range only ──
        if (role === "camper") {
            const CAMPER_ENGAGE_RADIUS = 4;
            if (nearestEnemy && nearestEnemyDist < CAMPER_ENGAGE_RADIUS * _reach) {
                // Enemy close enough — engage
                const dx=nearestEnemy.x-actor.x, dy=nearestEnemy.y-actor.y;
                const dist=Math.sqrt(dx*dx+dy*dy);
                if (dist > 0.8) {
                    actor.x+=(dx/dist)*actor.moveSpeed*0.8;
                    actor.y+=(dy/dist)*actor.moveSpeed*0.8;
                } else {
                    followerAttack(actor, nearestEnemy);
                }
            } else {
                if (actor.post) partyPatrol(actor); else followPlayer(actor);
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

// The creature a unit was sent at (the enemy card, js/mixtool.js), or null; the order ends here when it is dead, its time is up, it is too far from the player or the unit was told to RETREAT.
function attackOrderTarget(actor) {
    const o = actor.attackOrder; if (!o) return null;
    const t = o.target;
    if (!t || t.dead || t.team === "green" || t.untargetable || frame > o.until || actor.retreatUntil > frame || Math.hypot(t.x - player.x, t.y - player.y) > BATTLE_ATTACK_LEASH) { actor.attackOrder = null; return null; }
    return t;
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
        // Leaning toward the group must not pick a spot behind a wall (inside the lab, say), so a lean only counts where you can see it from where you stand, and only once it is near you.
        if (!facilityLosFrom(player.x, player.y, tx, ty) || Math.hypot(player.x - actor.x, player.y - actor.y) > 8) { tx = player.x; ty = player.y; }   // (and a lean only counts when it is already close: a far group otherwise sits together and never comes to you)
    }
    // A follower on another stretch of floor than you (you are in an interior) walks to the doorway that comes out beside you and goes through it (js/facilityportals.js)
    if (actor._fpPortalGoal && typeof facilityPortalGoal === "function") { const g = facilityPortalGoal(actor); if (g) { tx = g.x; ty = g.y; stop = 0.04; } }
    // A wall between you and a follower means it is NOT near you however close it measures, so it keeps walking the route until it can see you.
    { const w = facilitySteer(actor, tx, ty), d0 = Math.hypot(tx - actor.x, ty - actor.y), seen = !actor._fpPath; if (!seen) { tx = w[0]; ty = w[1]; stop = 0.04; } else if (d0 > stop) { tx = w[0]; ty = w[1]; } }
    const dx = tx - actor.x, dy = ty - actor.y, dist = Math.hypot(dx, dy);
    if (dist > stop) { actor.x += (dx / dist) * actor.moveSpeed; actor.y += (dy / dist) * actor.moveSpeed; }
}

function updateNPC(actor) {
    if (actor._flight && typeof techFlightStep === "function" && techFlightStep(actor)) return;   // thrown by a Kinetic Launcher: in the air, nothing else moves it and no wall stops it (js/techabilities.js)
    const _fpx = actor.x, _fpy = actor.y;   // for the facility's walls (js/facilityplay.js)
    if (actor instanceof Predator && actor.team !== "green") {
        actor.update();
    } else {
        const _prevX = actor.x, _prevY = actor.y;
        updateRTSNPC(actor);
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
        // Tick walk cycle for clones based on actual movement
        if (actor.isClone) {
            const _moved = Math.hypot(actor.x - _prevX, actor.y - _prevY);
            if (_moved > 0.001) actor.walkCycle = (actor.walkCycle||0) + actor.moveSpeed * 40;
        }
    }
    { const _ix = actor.x, _iy = actor.y; facilityReroute(actor, _fpx, _fpy); facilityCatchUp(actor, _fpx, _fpy); facilityConstrain(actor, _fpx, _fpy); _fpUnstick(actor, _fpx, _fpy, Math.hypot(_ix - _fpx, _iy - _fpy)); if (actor._fpPortalGoal && typeof facilityPortalActorTick === "function") facilityPortalActorTick(actor); }   // route round the facility's walls (js/facilityplay.js); through a doorway it was walking to (js/facilityportals.js)
    if (typeof techShieldKeep === "function") techShieldKeep(actor, _fpx, _fpy);   // an enemy does not cross a Photonic Shield (js/techabilities.js)
}
