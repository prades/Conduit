// ─────────────────────────────────────────────────────────
//  MAIN RENDER / GAME LOOP
// ─────────────────────────────────────────────────────────
function render() {
    if (!gameState.running) { return; } // loop stopped — restartGame() will restart it

    frame++;

    // ── LONG HOLD DETECT ──
    if (isPressing&&!longHoldFired&&!touchMoved) {
        if (performance.now()-pressStartTime>LONG_HOLD_MS) {
            longHoldFired=true; handleLongHold(pressX,pressY);
        }
    }

    // ── PLAYER HEALTH DECAY ──
    health=Math.max(0,health-cfg.healthDecay);
    const hpPct=health/100;
    hpBar.style.width=health+"%";
    hpBar.style.background=hpPct>0.6?"#0f8":hpPct>0.3?"#ff0":"#f22";
    shardUI.textContent="Shards: "+shardCount;
    // Zone indicator
    const _zoneEl = document.getElementById("zoneInfo");
    if (_zoneEl) {
        const _pz = getZoneIndex(Math.floor(player.x));
        _zoneEl.textContent = _pz === 0 ? "Zone: Home" : "Zone: " + _pz;
    }


    // ── CRYSTAL DEATH CHECK ──
    if (crystal.health<=0) { showGameOver(); return; }

    // ── WORLD GEN ──
    if (player.x>lastGenX-10) generateSegment(lastGenX+1);

    // ── WORLD CACHE — rebuild pylon/nest subsets every 60 frames ──────────
    if (frame - _cacheAge >= 60) {
        _cacheAge    = frame;
        _pillarCache = world.filter(t => t.pillar && !t.destroyed && t.health > 0);
        _wPylons     = _pillarCache.filter(t => t.waveMode && t.attackModeElement);
        _aPylons     = _pillarCache.filter(t => t.attackMode);
        _uPylons     = _pillarCache.filter(t => t.upgraded);
        _nestCache   = world.filter(t => t.nest);

        // ── NETWORK RESONANCE — compute largest connected pylon group per element ──
        ELEMENTS.forEach(elDef => {
            const el = elDef.id;
            const elPylons = _wPylons.filter(p => p.attackModeElement === el);
            let maxGroupSize = 0;
            const visited = new Set();
            elPylons.forEach(start => {
                if (visited.has(start)) return;
                let groupSize = 0;
                const q = [start];
                while (q.length) {
                    const cur = q.pop();
                    if (visited.has(cur)) continue;
                    visited.add(cur); groupSize++;
                    elPylons.forEach(other => {
                        if (!visited.has(other) && Math.hypot(cur.x-other.x, cur.y-other.y) <= 5.0)
                            q.push(other);
                    });
                }
                maxGroupSize = Math.max(maxGroupSize, groupSize);
            });
            const newTier = maxGroupSize >= 6 ? 3 : maxGroupSize >= 4 ? 2 : maxGroupSize >= 2 ? 1 : 0;
            const prevTier = _prevNetworkTiers[el] || 0;
            if (newTier > prevTier && newTier > 0) {
                const tierLabel = ["", "I", "II", "III"][newTier];
                floatingTexts.push({ x:canvas.width/2, y:canvas.height/2-80,
                    text:`◈ ${elDef.label} NETWORK ${tierLabel}`, color:elDef.color, life:240, vy:-0.22, size:14 });
                // Pulse burst from each pylon of this element
                elPylons.forEach(p => {
                    for (let _i=0;_i<6;_i++) elementEffects.push({type:"impact",x:p.x,y:p.y,color:elDef.color,radius:0.6,life:40,element:el});
                });
            }
            _prevNetworkTiers[el] = newTier;
            networkStrength[el]   = newTier;
            // Integrity builds while connected, decays when no pylons active
            if (newTier > 0) networkIntegrity[el] = Math.min(100, (networkIntegrity[el]||0) + newTier * 0.5);
            else             networkIntegrity[el] = Math.max(0,   (networkIntegrity[el]||0) - 2);
        });

        // ── PRE-COMPUTE PYLON PAIRS & SEASONED BONUSES (avoids rebuilding every frame) ──
        _wPylonPairs = [];
        for (let _pi = 0; _pi < _wPylons.length; _pi++) {
            const pa = _wPylons[_pi];
            for (let _pj = _pi + 1; _pj < _wPylons.length; _pj++) {
                const pb = _wPylons[_pj];
                if (pa.attackModeElement !== pb.attackModeElement) continue;
                if ((pa.x-pb.x)*(pa.x-pb.x)+(pa.y-pb.y)*(pa.y-pb.y) > 25.0) continue; // 5.0²
                _wPylonPairs.push({ pa, pb,
                    el: pa.attackModeElement,
                    col: pa.attackModeColor || "#0f8",
                    midX: (pa.x+pb.x)*0.5, midY: (pa.y+pb.y)*0.5 });
            }
        }
        // O(1) partner lookup used by solo-flux ring and future checks
        _pylonsWithPartner = new Set();
        _wPylonPairs.forEach(({pa, pb}) => { _pylonsWithPartner.add(pa); _pylonsWithPartner.add(pb); });

        ELEMENTS.forEach(elDef => {
            const el = elDef.id;
            _seasonBonusCache[el] = _wPylons.some(p => p.attackModeElement === el && p.seasoned > 0) ? 1.25 : 1.0;
        });
    }


    // ── DAY→NIGHT transition ──
    if (gameState.phase==="day") {
        dayTimer++;
        // All hostile zones must be cleared AND minimum day time elapsed
        let redsInAnyZone = 0;
        actors.forEach(a => {
            if (a.team==="red" && !a.isNeutralRecruit) {
                const z = getZoneIndex(Math.floor(a.x));
                if (z >= 1 && z < activeDayZones) redsInAnyZone++;
            }
        });
        // Show countdown when zones are clear but timer not done
        if (redsInAnyZone === 0 && dayTimer < DAY_MIN_FRAMES) {
            const secsLeft = Math.ceil((DAY_MIN_FRAMES - dayTimer) / 60);
            waveUI.textContent = "Night approaches in " + secsLeft + "s…";
        }
        if (redsInAnyZone === 0 && dayTimer >= DAY_MIN_FRAMES) startNight();
    }

    // ── EXPLORED ZONES ──
    exploredZones.add(getZoneIndex(Math.floor(player.x)));

    // ── CLEAR SCREEN ──
    ctx.fillStyle="#000"; ctx.fillRect(0,0,canvas.width,canvas.height);
    // ── CIRCUIT BOARD BACKGROUND ──
    drawCircuitLayer();
    ctx.save();
    if (shake>0) { ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake); shake*=0.9; }

    // ── CAMERA FOLLOW ──
    player.x+=(player.targetX-player.x)*cfg.playerSpeed;
    player.y+=(player.targetY-player.y)*cfg.playerSpeed;
    player.y = Math.max(-0.5, Math.min(4, player.y));
    player.visualX+=(player.x-player.visualX)*0.15;
    player.visualY+=(player.y-player.visualY)*0.15;

    // ── UPDATE HAZARDS ──
    updateHazards();

    // ── UPDATE ACTORS ──
    actors.forEach(a=>updateNPC(a));

    // ── FOLLOWER SEPARATION — push overlapping followers apart ──
    const _fl = actors.filter(a => !a.dead && a.isFollower);
    for (let _i = 0; _i < _fl.length; _i++) {
        for (let _j = _i+1; _j < _fl.length; _j++) {
            const _a = _fl[_i], _b = _fl[_j];
            const _dx = _b.x - _a.x, _dy = _b.y - _a.y;
            const _d = Math.sqrt(_dx*_dx + _dy*_dy);
            if (_d < 0.55 && _d > 0.001) {
                const _p = (_d > 0 ? 1/_d : 0) * (0.55 - _d) * 0.5;
                _a.x -= _dx*_p; _a.y -= _dy*_p;
                _b.x += _dx*_p; _b.y += _dy*_p;
            }
        }
    }

    // ── RED HEALTH DECAY ──
    actors.forEach(a=>{ if(a.team==="red"){a.health-=0.01; if(a.health<=0){a.health=0;a.dead=true;}} });

    // ── PREDATOR SPAWNING (night) — 1 per hostile zone ──
    if (gameState.phase==="night") {
        // Hostile zones = zones 1 through activeDayZones-1 (zone 0 is home)
        // Cap at 5 hostile zones
        const hostileZoneCount = Math.min(gameState.nightNumber, 5);
        for (let z = 1; z <= hostileZoneCount; z++) {
            const existing = zonePredators[z];
            if (!existing || existing.dead) {
                // Don't spawn if the zone's nest has been destroyed
                const nest = _nestCache.find(t => t.nestZone === z);
                if (nest && nest.nestHealth <= 0) continue;

                if (!zoneRespawnTimers[z]) zoneRespawnTimers[z] = 0;
                if (zoneRespawnTimers[z] > 0) {
                    zoneRespawnTimers[z]--;
                } else {
                    spawnPredatorForZone(z);
                    zoneRespawnTimers[z] = 180;
                }
            }
        }
    }

    // ── WAVE FUNCTION PYLONS — connect same-element pylons within 5 tiles, apply zone effects ──
    // _wPylonPairs is pre-computed every 60 frames in the cache section above
    const wavePylons = _wPylons;

    // Apply effects for each pre-computed connected pair
    _wPylonPairs.forEach(pair=>{
        const {pa, pb, el, col, midX, midY} = pair;

            // Spawn periodic zone effect particles
            if (frame % 20 === 0) {
                const t = Math.random();
                const ex = pa.x + (pb.x-pa.x)*t, ey = pa.y + (pb.y-pa.y)*t;
                elementEffects.push({type:"impact",x:ex,y:ey,color:col,radius:0.3,life:25,element:el});
            }

            // Apply zone effects every 2 frames — visual / cooldown guards inside handle timing
            if (frame % 2 !== 0) return;

            // Compute per-element constants once per pair (not once per actor)
            const _nTier = networkStrength[el] || 1;
            const _seasonBonus = _seasonBonusCache[el] || 1.0;

            const lx=pb.x-pa.x, ly=pb.y-pa.y, len2=lx*lx+ly*ly;
            actors.forEach(a=>{
                if (!a||a.dead) return;
                // Distance from point to line segment pa→pb
                let t2 = len2>0 ? ((a.x-pa.x)*lx+(a.y-pa.y)*ly)/len2 : 0;
                t2=Math.max(0,Math.min(1,t2));
                const cx2=pa.x+t2*lx, cy2=pa.y+t2*ly;
                const lineDist = Math.hypot(a.x-cx2, a.y-cy2);
                if (lineDist > 1.5) return;

                const isEnemy = (a.team==="red"||(a instanceof Predator&&a.team!=="green"&&!a.isClone));
                const isFriend = (a.team==="green"||a.isClone||a.isFollower);

                switch(el) {
                    case "fire": {
                        if (isEnemy) {
                            const dmg  = Math.round((_nTier >= 3 ? 15 : _nTier >= 2 ? 10 : 6) * _seasonBonus);
                            const intv = _nTier >= 3 ? 18 : _nTier >= 2 ? 24 : 30;
                            if (frame % intv === 0) {
                                applyDamage(a, dmg, null, "fire");
                                // Tier 3: ignite — spread fire to enemies within 1.5 tiles
                                if (_nTier >= 3 && Math.random() < 0.35) {
                                    actors.forEach(other => {
                                        if (other===a||other.dead||other.team!=="red") return;
                                        if (Math.hypot(other.x-a.x,other.y-a.y) < 1.5) applyDamage(other, 4, null, "fire");
                                    });
                                }
                            }
                        }
                        break;
                    }
                    case "ice": {
                        if (isEnemy) {
                            if (_nTier >= 3) {
                                // Deep freeze — near-zero speed, periodic ice damage
                                a.slowed = 60; a.slowFactor = 0.08;
                                if (frame % 60 === 0) applyDamage(a, Math.round(4 * _seasonBonus), null, "ice");
                            } else if (_nTier >= 2) {
                                a.slowed = 50; a.slowFactor = 0.20;
                                // Random chance to freeze solid for 60 frames
                                if (Math.random() < 0.015) { a.slowed = 90; a.slowFactor = 0.0; }
                            } else {
                                a.slowed = 40; a.slowFactor = 0.35;
                            }
                        }
                        break;
                    }
                    case "electric": {
                        if (isFriend && frame % 10 === 0) {
                            const gain = Math.round((_nTier >= 3 ? 6 : _nTier >= 2 ? 4 : 2) * _seasonBonus);
                            a.currentResonance = Math.min(100, (a.currentResonance||0) + gain);
                            // Tier 2+: also accelerate ultimate charge for all network allies
                            if (_nTier >= 2 && typeof a.ultimateCharge === "number") {
                                a.ultimateCharge = Math.min(100, a.ultimateCharge + (_nTier >= 3 ? 2 : 1));
                            }
                        }
                        break;
                    }
                    case "core": {
                        const coreIntv = _nTier >= 3 ? 30 : _nTier >= 2 ? 40 : 60;
                        if (isFriend && frame % coreIntv === 0) {
                            const shGain = Math.round((_nTier >= 3 ? 8 : _nTier >= 2 ? 5 : 3) * _seasonBonus);
                            const shCap  = _nTier >= 3 ? 50 : _nTier >= 2 ? 35 : 20;
                            a.shielded = true;
                            a.shieldAmount = Math.min(shCap, (a.shieldAmount||0) + shGain);
                            a._shieldMax = shCap;
                            // Tier 3: auto-repair broken shields (restore up to cap over time)
                            if (_nTier >= 3 && a.shieldAmount > 0 && a.shieldAmount < shCap) {
                                a.shieldAmount = Math.min(shCap, a.shieldAmount + 2);
                            }
                        }
                        break;
                    }
                    case "flux": {
                        if (isEnemy) {
                            const pullSpd = (_nTier >= 3 ? 0.20 : _nTier >= 2 ? 0.15 : 0.10) * _seasonBonus;
                            const dx=midX-a.x, dy=midY-a.y, d=Math.hypot(dx,dy)||1;
                            a.x+=dx/d*pullSpd; a.y+=dy/d*pullSpd;
                            // Tier 3: vortex — pulled enemies take continuous damage
                            if (_nTier >= 3 && frame % 30 === 0) applyDamage(a, Math.round(3*_seasonBonus), null, "flux");
                            // Tier 2+: chain — pulled actors drag nearby enemies along
                            if (_nTier >= 2 && frame % 20 === 0) {
                                actors.forEach(other => {
                                    if (other===a||other.dead||(other.team!=="red"&&!(other instanceof Predator&&other.team!=="green"&&!other.isClone))) return;
                                    const od = Math.hypot(other.x-a.x, other.y-a.y);
                                    if (od < 1.2 && od > 0.01) { other.x+=dx/d*0.05; other.y+=dy/d*0.05; }
                                });
                            }
                        }
                        break;
                    }
                    case "toxic": {
                        const toxIntv = _nTier >= 3 ? 20 : _nTier >= 2 ? 28 : 40;
                        if (isEnemy && frame % toxIntv === 0) {
                            const tdmg = Math.round((_nTier >= 3 ? 12 : _nTier >= 2 ? 8 : 5) * _seasonBonus);
                            applyDamage(a, tdmg, null, "toxic");
                            const shredChance  = _nTier >= 3 ? 0.6 : _nTier >= 2 ? 0.5 : 0.3;
                            const shredFactor  = _nTier >= 3 ? 0.35 : _nTier >= 2 ? 0.5 : 0.6;
                            if (Math.random() < shredChance) { a.defenseShredded = 90; a.defenseShredFactor = shredFactor; }
                            // Tier 3: cloud spreads poison debuff to nearby enemies
                            if (_nTier >= 3) {
                                actors.forEach(other => {
                                    if (other===a||other.dead||(other.team!=="red"&&!(other instanceof Predator&&other.team!=="green"&&!other.isClone))) return;
                                    if (Math.hypot(other.x-a.x, other.y-a.y) < 1.5) {
                                        other.defenseShredded = 60; other.defenseShredFactor = 0.55;
                                    }
                                });
                            }
                        }
                        break;
                    }
                }
                // Predator pylon aggro — track how long a predator has been cooked by pylons
                if (isEnemy && a instanceof Predator) {
                    a.pylonExposureFrames = (a.pylonExposureFrames||0) + 1;
                    if (a.pylonExposureFrames > 300 && !a.pylonAggro) {
                        let nearestPylon=null, bestPD=Infinity;
                        wavePylons.forEach(wp=>{ const d=Math.hypot(wp.x-a.x,wp.y-a.y); if(d<bestPD){bestPD=d;nearestPylon=wp;} });
                        if (nearestPylon) a.pylonAggro = nearestPylon;
                    }
                } else if (!isEnemy) {
                    // Cool down exposure when no longer in zone
                    if (a.pylonExposureFrames) a.pylonExposureFrames = Math.max(0, a.pylonExposureFrames - 2);
                }
            });
    });

    // Core triangle/square zone — needs 3+ pylons to form enclosed zone
    const corePylons = wavePylons.filter(p=>p.attackModeElement==="core");
    if (corePylons.length >= 3) {
        // Find centroid
        const cx = corePylons.reduce((s,p)=>s+p.x,0)/corePylons.length;
        const cy = corePylons.reduce((s,p)=>s+p.y,0)/corePylons.length;
        const radius = corePylons.reduce((s,p)=>s+Math.hypot(p.x-cx,p.y-cy),0)/corePylons.length;
        actors.forEach(a=>{
            if (!a||a.dead) return;
            if (Math.hypot(a.x-cx,a.y-cy) > radius*1.2) return;
            const isFriend = (a.team==="green"||a.isClone||a.isFollower);
            // Only recharge a shield that exists and hasn't been fully broken
            if (isFriend && frame%60===0 && a.shielded && a.shieldAmount > 0) {
                const cap = a._shieldMax || 30;
                a.shieldAmount = Math.min(cap, a.shieldAmount + 3);
            }
        });
    }

    // ── FLUX SOLO — pulls enemies toward itself with no partner required ──
    const WAVE_CONNECT_RANGE = 5.0;
    wavePylons.forEach(pv=>{
        if (pv.attackModeElement!=="flux") return;
        const hasPartner = wavePylons.some(q=>q!==pv&&q.attackModeElement==="flux"&&Math.hypot(pv.x-q.x,pv.y-q.y)<=WAVE_CONNECT_RANGE);
        if (hasPartner) return;
        actors.forEach(a=>{
            if (!a||a.dead) return;
            const isEnemy=(a.team==="red"||(a instanceof Predator&&a.team!=="green"&&!a.isClone));
            if (!isEnemy) return;
            const dx=a.x-pv.x, dy=a.y-pv.y, d=Math.hypot(dx,dy);
            if (d>3||d<0.01) return;
            a.x-=dx/d*0.05; a.y-=dy/d*0.05;
            // Also track exposure
            a.pylonExposureFrames=(a.pylonExposureFrames||0)+1;
            if (a.pylonExposureFrames>300&&!a.pylonAggro) a.pylonAggro=pv;
        });
    });

    // ── ATTACK MODE PYLON — fire missiles at nearby enemies ──
    _aPylons.forEach(t=>{
        t.attackFireTimer = (t.attackFireTimer||0) + 1;
        if (t.attackFireTimer < 90) return; // fire every 1.5s
        t.attackFireTimer = 0;
        // Find nearest enemy within range
        let nearest=null, bd=t.attackRange;
        actors.forEach(a=>{
            if ((a.team==="red"||(a instanceof Predator&&a.team!=="green"))&&!a.dead) {
                const dx=a.x-t.x, dy=a.y-t.y, d=Math.sqrt(dx*dx+dy*dy);
                if (d<bd) { bd=d; nearest=a; }
            }
        });
        if (!nearest) return;
        // Spawn missile projectile
        const col = t.attackModeColor || "#0f8";
        spawnFollowerProjectile(
            {x:t.x, y:t.y-1, element:t.attackModeElement||"core", stats:{specialAttack:t.attackPower||12}},
            nearest,
            col,
            t.attackPower||12,
            8,
            null
        );
        // Muzzle flash
        elementEffects.push({type:"impact",x:t.x,y:t.y-1,color:col,radius:0.4,life:12,element:t.attackModeElement});
    });

    // ── COMPLETE RECONSTRUCTION ──
    world.forEach(t=>{
        if (t.reconstructing&&t.reconstructProgress>=1) {
            t.reconstructing=false; t.reconstructProgress=0; t.upgraded=true; t.pulseTimer=0;
            t.pillarTeam="green"; t.pillarCol="#0f8"; t.health=t.maxHealth;
            if(t.workers) t.workers.forEach(a=>{ if(a.job&&a.job.type==="reconstruct") a.job=null; });
            t.workers=[];
        }
    });

    // ── REMOVE DEAD NPCs, respawn ──
    actors.forEach(a=>{
        if (a.dead&&a.team==="green"&&!a.queuedForRespawn&&!a.sacrificed) {
            a.queuedForRespawn=true;
            const oldHp = a.stats?.hp||1;
            const newHp = oldHp - 1;
            const isGhostSave = (newHp<=0) && activeCrystalBuild==="ghostphage" && !a.ghostphageLife;
            if (newHp<=0 && !isGhostSave) return; // permanent death — don't queue
            respawnQueue.push({ element:a.element, combatTrait:a.combatTrait, naturalTrait:a.naturalTrait, perk:a.perk, personality:a.personality, timer:180, isClone:a.isClone||false, speciesName:a.speciesName, className:a.className, hpStat:Math.max(1,newHp), ghostphageLife:isGhostSave });
        }
        // track kills for wave clear — count dead enemies not clones
        if (a.dead && (a.team==="red" || (a instanceof Predator && a.team!=="green" && !a.isClone)) && !a.killCounted) {
            a.killCounted = true;
            nightKillCount++;
            waveUI.textContent = "Night "+gameState.nightNumber+" — Kill "+nightKillCount+"/"+nightEnemiesTarget;
        }
    });

    // Single pass — handle ALL dead predators exactly once
    actors.forEach(a => {
        if (a instanceof Predator && a.dead && !a.deathProcessed && a.team !== "green") {
            a.deathProcessed = true;
            onPredatorDeath(a);
            // Clear from zone slot so it can respawn
            if (a.homeZone !== undefined && zonePredators[a.homeZone] === a) {
                zonePredators[a.homeZone] = null;
                zoneRespawnTimers[a.homeZone] = 180;
            }
            // Legacy activePredator cleanup
            if (a === activePredator) {
                activePredator = null;
                predatorRespawnTimer = 120;
            }
        }
    });
    actors=actors.filter(a=>!a.dead);
    const _prevFL=followers.length;
    followers=followers.filter(a=>!a.dead&&a.team==="green");
    if (followers.length!==_prevFL) rebuildFollowerTable();

    // ── PENDING PILLAR DESTRUCTION ──
    pendingPillarDestruction.forEach(p=>{
        if(p.destroyed)return; p.destroyed=true;
        for(let i=0;i<6;i++) shards.push({x:p.x,y:p.y,z:1+Math.random(),vz:-0.05-Math.random()*0.05,color:p.pillarCol});
        // Clear any nest link pointing to this pylon
        world.forEach(obj=>{ if(obj.connectedPylon===p){ obj.connectedPylon=null; } });
        if(p.nestConnection){ p.nestConnection.connectedPylon=null; p.nestConnection=null; }
    });
    pendingPillarDestruction.length=0;
    world.forEach(obj=>{ if(obj.pendingDestroy){pendingPillarDestruction.push(obj);obj.pendingDestroy=false;} });

    // ── UPGRADED PYLON PULSE ──
    _uPylons.forEach(t=>{
        t.pulseTimer++;
        if(t.pulseTimer>120){ t.pulseTimer=0; actors.forEach(a=>{ if(a.team==="green"){const dx=a.x-t.x,dy=a.y-t.y,dist=Math.sqrt(dx*dx+dy*dy); if(dist<3.5) a.health=Math.min(a.maxHealth,a.health+2);} }); }
    });

    // ── PILLAR HEALING (every 3 frames; heal 0.15 to match original 0.05/frame) ──
    if (frame % 3 === 0) {
        actors.forEach(actor=>{
            _pillarCache.forEach(t=>{
                if((actor.team==="green"&&t.pillarTeam!=="green")||(actor.team==="red"&&t.pillarTeam!=="red")) return;
                const dx=t.x-actor.x, dy=t.y-actor.y;
                if(dx*dx+dy*dy < 1.44) actor.health=Math.min(actor.maxHealth, actor.health+0.15);
            });
        });
    }

    // ── CONTESTED SIPHON CONVERSION ──
    if(latchedPillar&&latchedPillar.pillarTeam==="red"&&latchedPillar.converting) {
        actors.forEach(a=>{ if(a.team!=="red"||a instanceof Predator)return; const dx=a.x-latchedPillar.x,dy=a.y-latchedPillar.y; if(Math.sqrt(dx*dx+dy*dy)<1.2) convertNPC(a,"green"); });
    }

    updateShards();
    updateStatusEffects();
    updateElementEffects();
    updateFloatingTexts();

    // ── SIPHON SYSTEM ──
    if (!latchedPillar) {
        let best=null,bd=Infinity;
        _pillarCache.forEach(obj=>{ const dx=obj.x-player.x,dy=obj.y-player.y,d=Math.sqrt(dx*dx+dy*dy); if(d<1.6&&d<bd){bd=d;best=obj;} });
        latchedPillar=best;
    }
    if (latchedPillar) {
        const pillar=latchedPillar;
        const dx=pillar.x-player.x,dy=pillar.y-player.y,dist=Math.sqrt(dx*dx+dy*dy);
        if(dist>1.8){pillar.converting=false;latchedPillar=null;}
        else {
            if(pillar.pillarTeam==="green"){
                health=Math.min(100,health+0.18);
                if(!pillar.upgraded) pillar.health-=0.015;
                if(pillar.health<=0&&!pillar.destroyed){if(!pillar.upgraded)pillar.pendingDestroy=true;latchedPillar=null;}
            }
            if(pillar.pillarTeam==="red"){
                pillar.converting=true; pillar.health-=0.15;
                if(pillar.health<=0){pillar.pillarTeam="green";pillar.pillarCol="#0f8";pillar.health=pillar.maxHealth;pillar.converting=false;latchedPillar=null;}
            }
        }
    }

    // ── CRYSTAL ULTIMATE CHARGE RESTORE ──────────────────────────────────
    // Runs every 60 frames. Rate scales with max pylon zone depth and nest pod links.
    if (frame % 60 === 0 && followers.length > 0) {
        // Base charge per tick at crystal proximity
        const crystalDist = Math.hypot(player.x - crystal.x, player.y - crystal.y);
        const nearCrystal = crystalDist < 3.0;

        // Find deepest zone index of any living green pylon
        const greenPylons = world.filter(t => t.pillar && !t.destroyed && t.pillarTeam === "green" && t.health > 0);
        let maxPylonZone = 0;
        greenPylons.forEach(t => { const z = getZoneIndex(t.x); if (z > maxPylonZone) maxPylonZone = z; });

        // Bonus charge if any green pylon is connected to a destroyed nest pod
        const brokenNests = world.filter(t => t.nest && t.nestHealth <= 0);
        let nestBonus = 0;
        brokenNests.forEach(nest => {
            greenPylons.forEach(p => {
                if (Math.hypot(p.x - nest.x, p.y - nest.y) < 5.0) nestBonus = Math.max(nestBonus, 3);
            });
        });

        // Base rate: 1/tick always (very slow), +1 per zone depth, +nestBonus, doubled near crystal
        const baseRate = 1 + maxPylonZone + nestBonus;
        const chargeGain = nearCrystal ? baseRate * 2 : baseRate;

        followers.forEach(f => {
            if (f.dead) return;
            if (typeof f.ultimateCharge !== "number") f.ultimateCharge = 0;
            f.ultimateCharge = Math.min(100, f.ultimateCharge + chargeGain);
        });
    }

    // ── FIRE WALL LIFETIME ──
    world=world.filter(obj=>{ if(obj.type==="fireWall"){obj.life--;return obj.life>0;} return true; });

    // ── GROUND ITEM PICKUP ──
    groundItems=groundItems.filter(item=>{
        if (Math.abs(player.x-item.x)<0.9 && Math.abs(player.y-item.y)<0.9) {
            if (item.type==="crystalModulator") {
                ownedModulators.push({ element: item.element, pair: item.pair || MODULATOR_PAIRS[item.element] || [item.element] });
                const el=ELEMENTS.find(e=>e.id===item.element);
                floatingTexts.push({ x:canvas.width/2, y:canvas.height/2-60,
                    text:`◈ ${(el?.label||item.element).toUpperCase()} MODULATOR ACQUIRED`,
                    color:"#aaddff", life:180, vy:-0.25 });
            }
            return false; // remove
        }
        return true;
    });

    // ── TANK SHIELD PULSE — tanks pulse 1 shield to nearby allies every 3s ──
    // ── BOSS SHIELD AURA — bosses continuously shield all nearby allies ──
    actors.forEach(actor => {
        if (actor.dead || actor.team === "green" || actor.isClone) return;
        const isTank = actor.className === "tank";
        const isBoss = actor.isBoss;
        if (!isTank && !isBoss) return;

        // Tank: pulse shield every 180 frames to 1 nearby ally
        if (isTank) {
            if (!actor.shieldPulseTimer) actor.shieldPulseTimer = 0;
            actor.shieldPulseTimer++;
            if (actor.shieldPulseTimer >= 180) {
                actor.shieldPulseTimer = 0;
                // Find nearest ally (red team, not self)
                let nearest = null, bd = Infinity;
                actors.forEach(a => {
                    if (a === actor || a.dead || a.team !== "red") return;
                    const d = Math.hypot(a.x - actor.x, a.y - actor.y);
                    if (d < 4 && d < bd) { bd = d; nearest = a; }
                });
                if (nearest) {
                    nearest.shielded = true;
                    nearest.shieldAmount = (nearest.shieldAmount||0) + 1;
                }
            }
        }

        // Boss: continuously shield all nearby allies
        if (isBoss) {
            if (!actor.shieldAuraPulse) actor.shieldAuraPulse = 0;
            actor.shieldAuraPulse++;
            if (actor.shieldAuraPulse >= 60) { // every 1s
                actor.shieldAuraPulse = 0;
                actors.forEach(a => {
                    if (a === actor || a.dead || a.team !== "red") return;
                    const d = Math.hypot(a.x - actor.x, a.y - actor.y);
                    if (d < (actor.shieldAuraRadius || 5)) {
                        a.shielded = true;
                        a.shieldAmount = Math.min((a.shieldAmount||0) + 3, 15);
                    }
                });
            }
        }
    });

    // ── WAVE CLEAR CHECK ──
    checkWaveClear();

    // ── BUILD DRAW LIST ──
    // Pre-build acid tile lookup so acid pools sort with the depth pass (behind pylons)
    const acidTiles = new Map(); // "x,y" → {h, bubble seed}
    environmentalHazards.forEach(h => {
        if (h.type === 'acid') h.tiles.forEach(([tx,ty]) => acidTiles.set(`${tx},${ty}`, h));
    });

    let drawList=world.filter(t=>Math.abs(t.x-player.visualX)<RENDER_DIST);
    drawList.push({type:'player',x:player.visualX,y:player.visualY});
    shards.forEach(s=>drawList.push({type:'shard',x:s.x,y:s.y,shard:s}));
    actors.forEach(a=>drawList.push({type:'npc',x:a.x,y:a.y,actor:a}));
    groundItems.forEach(g=>drawList.push({type:'groundItem',x:g.x,y:g.y,item:g}));
    drawList.push({type:'crystal',x:crystal.x,y:crystal.y});
    drawList.sort((a,b)=>(a.x+a.y)-(b.x+b.y));

    // ── DRAW EACH OBJECT ──
    drawList.forEach(obj=>{
        const px=(obj.x-player.visualX-(obj.y-player.visualY))*TILE_W+canvas.width/2;
        const py=(obj.x-player.visualX+(obj.y-player.visualY))*TILE_H+canvas.height/2;

        if (obj.type==='player') {
            drawPlayer({x:px,y:py});
        }
        else if (obj.type==='npc') {
            drawNPC(obj.actor,px,py);
        }
        else if (obj.type==='groundItem') {
            const gi=obj.item;
            const el=ELEMENTS.find(e=>e.id===gi.element);
            const col=el?el.color:"#aaddff";
            const bob=Math.sin(frame*0.06+gi.x*1.3)*4;
            ctx.save();
            ctx.globalAlpha=0.85+0.15*Math.sin(frame*0.08);
            ctx.shadowColor=col; ctx.shadowBlur=14;
            ctx.fillStyle=col;
            ctx.beginPath();
            ctx.moveTo(px,       py-18+bob);
            ctx.lineTo(px+9,     py-10+bob);
            ctx.lineTo(px,       py-2+bob);
            ctx.lineTo(px-9,     py-10+bob);
            ctx.closePath(); ctx.fill();
            ctx.fillStyle="#fff"; ctx.globalAlpha=0.35;
            ctx.beginPath();
            ctx.moveTo(px,     py-18+bob);
            ctx.lineTo(px+4,   py-12+bob);
            ctx.lineTo(px,     py-10+bob);
            ctx.closePath(); ctx.fill();
            ctx.shadowBlur=0; ctx.restore();
            ctx.fillStyle=col; ctx.font="8px monospace"; ctx.textAlign="center";
            ctx.fillText("◈ MOD", px, py-24+bob);
        }
        else if (obj.type==='crystal') {
            const hpR   = crystal.health / crystal.maxHealth;
            const pulse  = 0.7 + 0.3 * Math.sin(frame * 0.05);
            const crystalCol = hpR > 0.5 ? "#44f" : hpR > 0.2 ? "#f80" : "#f22";
            const baseRGB    = hpR > 0.5 ? [60,80,255] : hpR > 0.2 ? [255,130,0] : [255,40,40];

            // ── 3-D rotating diamond (square bipyramid / octahedron) ─────────
            const rot   = frame * 0.022;                     // spin angle
            const bob   = Math.sin(frame * 0.04) * 4;       // gentle hover
            const scale = 30;
            const cx    = px, cy = py - 66 + bob;

            //   Vertices: top, 4 equatorial, bottom
            //   Diamond proportions: crown taller than pavilion
            const V = [
                [ 0,  1.15,  0 ],   // 0 top
                [ 1,  0.08,  0 ],   // 1 eq +x
                [ 0,  0.08,  1 ],   // 2 eq +z
                [-1,  0.08,  0 ],   // 3 eq -x
                [ 0,  0.08, -1 ],   // 4 eq -z
                [ 0, -0.85,  0 ],   // 5 bottom
            ];
            // 8 triangular faces (CCW winding when viewed from outside)
            const FACES = [
                [0,2,1],[0,3,2],[0,4,3],[0,1,4],  // upper crown
                [5,1,2],[5,2,3],[5,3,4],[5,4,1],  // lower pavilion
            ];

            const cosR = Math.cos(rot), sinR = Math.sin(rot);
            // Rotate around Y axis, then apply a slight forward tilt
            const tiltC = Math.cos(0.38), tiltS = Math.sin(0.38);
            const rv = V.map(([x,y,z]) => {
                const rx = x*cosR + z*sinR, ry = y, rz = -x*sinR + z*cosR;
                // tilt so we see both crown and pavilion
                const ty = ry*tiltC - rz*tiltS, tz = ry*tiltS + rz*tiltC;
                return [rx, ty, tz];
            });

            // Orthographic projection to screen
            const sc = rv.map(([x,y,z]) => [cx + x*scale, cy - y*scale, z]);

            // Light direction (upper-left-front), normalised
            const LD = [0.45, 0.75, 0.55];
            const ll  = Math.hypot(...LD); const lx=LD[0]/ll, ly=LD[1]/ll, lz=LD[2]/ll;

            // Sort faces back→front (painter's algorithm)
            const sorted = FACES.map(f => {
                const zAvg = (rv[f[0]][2] + rv[f[1]][2] + rv[f[2]][2]) / 3;
                return { f, zAvg };
            }).sort((a,b) => a.zAvg - b.zAvg);

            ctx.save();

            // Outer glow halo — radial gradient, no shadowBlur
            const haloBase = hpR > 0.5 ? "rgba(68,68,255," : hpR > 0.2 ? "rgba(255,136,0," : "rgba(255,34,34,";
            const haloGrd = ctx.createRadialGradient(cx, cy, 8, cx, cy, 52);
            haloGrd.addColorStop(0, haloBase + "0.35)");
            haloGrd.addColorStop(1, haloBase + "0)");
            ctx.globalAlpha = pulse;
            ctx.fillStyle   = haloGrd;
            ctx.beginPath(); ctx.arc(cx, cy, 52, 0, Math.PI*2); ctx.fill();
            ctx.globalAlpha = 1;

            sorted.forEach(({ f }) => {
                const [i0,i1,i2] = f;
                const [r0,r1,r2] = [rv[i0],rv[i1],rv[i2]];

                // Face normal (cross product)
                const ax=r1[0]-r0[0], ay=r1[1]-r0[1], az=r1[2]-r0[2];
                const bx=r2[0]-r0[0], by=r2[1]-r0[1], bz=r2[2]-r0[2];
                const nx=ay*bz-az*by, ny=az*bx-ax*bz, nz=ax*by-ay*bx;
                const nl=Math.hypot(nx,ny,nz)||1;

                if (nz/nl < 0) return;  // back-face cull (viewer at +z)

                const diff = Math.max(0, (nx/nl)*lx + (ny/nl)*ly + (nz/nl)*lz);
                const spec = Math.pow(diff, 18) * 0.7;         // specular glint
                const amb  = 0.18;
                const bright = amb + (1-amb)*diff;

                const [p0,p1,p2] = [sc[i0],sc[i1],sc[i2]];
                ctx.beginPath();
                ctx.moveTo(p0[0],p0[1]); ctx.lineTo(p1[0],p1[1]); ctx.lineTo(p2[0],p2[1]);
                ctx.closePath();

                const r = Math.min(255, (baseRGB[0]*bright + 255*spec) | 0);
                const g = Math.min(255, (baseRGB[1]*bright + 255*spec) | 0);
                const b = Math.min(255, (baseRGB[2]*bright + 255*spec) | 0);
                ctx.fillStyle = `rgb(${r},${g},${b})`;
                ctx.fill();

                // Facet edge
                ctx.strokeStyle = `rgba(160,200,255,${0.25 + bright*0.45})`;
                ctx.lineWidth   = 0.8;
                ctx.stroke();
            });

            ctx.restore();
            // ─────────────────────────────────────────────────────────────────

            drawHealthBar(px-25, py-96+bob, 50, 7, crystal.health, crystal.maxHealth);
            if (hpR<0.3&&frame%30<15) {
                ctx.save(); ctx.setTransform(1,0,0,1,0,0);
                ctx.fillStyle="rgba(255,0,0,0.08)"; ctx.fillRect(0,0,canvas.width,canvas.height);
                ctx.restore();
            }
        }
        else if (obj.type==='shard') {
            ctx.fillStyle=obj.shard.color;
            ctx.beginPath(); ctx.arc(px,py-20-obj.shard.z*20,3,0,Math.PI*2); ctx.fill();
        }
        else if (obj.type==='fireWall') {   // FIX: fire walls now render
            ctx.fillStyle="rgba(255,100,0,0.6)";
            ctx.beginPath(); ctx.arc(px,py-30,14,0,Math.PI*2); ctx.fill();
            ctx.fillStyle="rgba(255,220,0,0.3)";
            ctx.beginPath(); ctx.arc(px,py-30,8,0,Math.PI*2); ctx.fill();
        }
        else if (obj.type==='floor') {
            const dist=Math.sqrt((obj.x-player.visualX)**2+(obj.y-player.visualY)**2);
            const amb=Math.max(0.1,0.8-dist/RENDER_DIST), glo=Math.max(0,1.0-dist/5);
            const isNight = gameState.phase === "night";
            // Day: Dexter's Lab steel-blue/teal panels. Night: Dark steel with warm red-orange ambience.
            let tR, tG, tB;
            if (isNight) {
                tR = (22*amb + 38*glo)|0;
                tG = (14*amb + 10*glo)|0;
                tB = (16*amb +  6*glo)|0;
            } else {
                tR = (16*amb +  8*glo)|0;
                tG = (26*amb + 20*glo)|0;
                tB = (42*amb + 52*glo)|0;
            }
            ctx.fillStyle=`rgb(${tR},${tG},${tB})`;
            ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+TILE_W,py+TILE_H); ctx.lineTo(px,py+TILE_W); ctx.lineTo(px-TILE_W,py+TILE_H); ctx.closePath(); ctx.fill();
            // ── Steel panel bevel — highlight top two edges, shadow bottom two ──
            // Top-left edge highlight
            ctx.strokeStyle = isNight ? `rgba(80,45,30,${0.5*amb})` : `rgba(80,130,180,${0.55*amb})`;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(px,py+1); ctx.lineTo(px-TILE_W+1,py+TILE_H); ctx.stroke();
            // Top-right edge highlight
            ctx.beginPath(); ctx.moveTo(px,py+1); ctx.lineTo(px+TILE_W-1,py+TILE_H); ctx.stroke();
            // Bottom-left edge shadow
            ctx.strokeStyle = `rgba(0,0,0,${0.35*amb})`;
            ctx.beginPath(); ctx.moveTo(px-TILE_W+1,py+TILE_H); ctx.lineTo(px,py+TILE_W-1); ctx.stroke();
            // Bottom-right edge shadow
            ctx.beginPath(); ctx.moveTo(px+TILE_W-1,py+TILE_H); ctx.lineTo(px,py+TILE_W-1); ctx.stroke();

            // ── NETWORK FLOOR INTERCONNECT — PCB traces that appear when player extends the network ──
            // Tiles within range of any live pylon reveal circuit trace lines on the floor
            if (_pillarCache.length > 0) {
                let nearDist = Infinity;
                for (const _p of _pillarCache) {
                    const _d = Math.hypot(_p.x - obj.x, _p.y - obj.y);
                    if (_d < nearDist) nearDist = _d;
                }
                const REACH = 4.0;
                if (nearDist < REACH) {
                    const fade = Math.pow(1 - nearDist / REACH, 1.4);
                    // Tile world coords and screen center
                    const txi = Math.round(obj.x), tyi = Math.round(obj.y);
                    const cx = px, cy = py + TILE_H; // screen center of tile
                    ctx.save();
                    ctx.lineWidth = 0.85;
                    // NW→SE trace segment (follows world x-axis): from (-30,-15) to (+30,+15) rel to center
                    ctx.globalAlpha = 0.16 * amb * fade;
                    ctx.strokeStyle = isNight ? "#cc6633" : "#00bb88";
                    ctx.beginPath();
                    ctx.moveTo(cx - 30, cy - 15);
                    ctx.lineTo(cx + 30, cy + 15);
                    ctx.stroke();
                    // NE→SW trace segment (follows world y-axis): from (+30,-15) to (-30,+15) rel to center
                    ctx.globalAlpha = 0.13 * amb * fade;
                    ctx.strokeStyle = isNight ? "#aa4422" : "#0099cc";
                    ctx.beginPath();
                    ctx.moveTo(cx + 30, cy - 15);
                    ctx.lineTo(cx - 30, cy + 15);
                    ctx.stroke();
                    ctx.restore();
                }
            }

            // Acid pool — drawn here so it sits on the floor but under pylons
            const acidH = acidTiles.get(`${Math.round(obj.x)},${Math.round(obj.y)}`);
            if (acidH) {
                const bubble = 0.5 + 0.5 * Math.sin(frame * 0.12 + obj.x + obj.y);
                const seed   = obj.x * 13.7 + obj.y * 7.3;
                ctx.save();
                ctx.globalAlpha = (0.72 + bubble * 0.18) * (acidH.alpha ?? 1);
                ctx.fillStyle = "#00ff44";
                // Irregular organic puddle — sin-wave distorted oval
                const cx = px, cy = py + TILE_H;
                const N  = 24;
                ctx.beginPath();
                for (let i = 0; i <= N; i++) {
                    const t     = (i / N) * Math.PI * 2;
                    const noise = 1 + 0.18 * Math.sin(t * 3 + seed)
                                    + 0.10 * Math.sin(t * 5 + seed * 1.7)
                                    + 0.05 * Math.sin(t * 7 + seed * 0.9);
                    const x = cx + TILE_W * 0.6 * noise * Math.cos(t);
                    const y = cy + TILE_H * 0.65 * noise * Math.sin(t);
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                }
                ctx.closePath();
                ctx.fill();
                // Inner ripple highlight
                ctx.globalAlpha *= 0.45;
                ctx.fillStyle = "#aaffcc";
                ctx.beginPath();
                for (let i = 0; i <= N; i++) {
                    const t     = (i / N) * Math.PI * 2;
                    const noise = 1 + 0.12 * Math.sin(t * 3 + seed + frame * 0.015);
                    ctx.lineTo(cx + TILE_W * 0.3 * noise * Math.cos(t),
                               cy + TILE_H * 0.32 * noise * Math.sin(t));
                }
                ctx.closePath();
                ctx.fill();
                // Bubbles — drawn per-tile, rise then pop
                if (acidH.bubbles) {
                    acidH.bubbles.forEach(b => {
                        if (b.tx !== Math.round(obj.x) || b.ty !== Math.round(obj.y)) return;
                        const t   = b.life / b.maxLife; // 1→0 as life runs down
                        const bpx = cx + b.ox * TILE_W * 0.38;
                        const bpy = cy + b.oy * TILE_H * 0.38;
                        const riseY = (1 - t) * 14; // rises 14px over lifetime
                        ctx.save();
                        if (t > 0.18) {
                            // Rising bubble — small outlined circle
                            const r = 1.5 + (1 - t) * 2.5;
                            ctx.globalAlpha = Math.min(1, t * 4) * (acidH.alpha ?? 1);
                            ctx.strokeStyle = "#99ffbb";
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.arc(bpx, bpy - riseY, r, 0, Math.PI * 2);
                            ctx.stroke();
                            // tiny specular glint
                            ctx.globalAlpha *= 0.6;
                            ctx.fillStyle = "#ccffdd";
                            ctx.beginPath();
                            ctx.arc(bpx - r * 0.3, bpy - riseY - r * 0.3, r * 0.28, 0, Math.PI * 2);
                            ctx.fill();
                        } else {
                            // Popping — expanding ring that fades
                            const popT = t / 0.18; // 1→0 during pop
                            const r    = 2 + (1 - popT) * 10;
                            ctx.globalAlpha = popT * 0.75 * (acidH.alpha ?? 1);
                            ctx.strokeStyle = "#ccffdd";
                            ctx.lineWidth = 1.2;
                            ctx.beginPath();
                            ctx.arc(bpx, bpy - 14, r, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                        ctx.restore();
                    });
                }
                ctx.restore();
            }

            // ── BROKEN NEST POD — charred gray husk with teal accent ──
            if (obj.nest && obj.nestHealth <= 0) {
                const sW1x=px, sW1y=py-60, numT=4, WH=110;
                const wfBL={x:sW1x-TILE_W,y:sW1y+TILE_H};
                const wfBR={x:sW1x+(numT-1)*TILE_W,y:sW1y+(numT+1)*TILE_H};
                const wfTR={x:wfBR.x,y:wfBR.y-WH};
                const wfTL={x:wfBL.x,y:wfBL.y-WH};
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(wfBL.x,wfBL.y); ctx.lineTo(wfBR.x,wfBR.y);
                ctx.lineTo(wfTR.x,wfTR.y); ctx.lineTo(wfTL.x,wfTL.y);
                ctx.closePath();
                // Charred dark fill
                ctx.fillStyle="rgba(18,10,8,0.92)"; ctx.fill();
                // Cracked hex outlines — gray/teal
                ctx.strokeStyle=obj.connectedPylon?"rgba(0,255,200,0.45)":"rgba(55,45,40,0.7)";
                ctx.lineWidth=1; ctx.clip();
                const hexR=12, hexWd=hexR*Math.sqrt(3), hexRH=hexR*1.5;
                const gridLeft=wfTL.x-hexWd, gridTop=wfTL.y-hexR;
                const nRows=Math.ceil((WH+hexR*4)/hexRH)+1;
                const nCols=Math.ceil((wfBR.x-wfBL.x+hexWd*2)/hexWd)+1;
                const hexCos=[], hexSin=[];
                for(let vi=0;vi<6;vi++){const a=Math.PI/6+vi*Math.PI/3;hexCos.push(Math.cos(a));hexSin.push(Math.sin(a));}
                for(let row=0;row<nRows;row++) for(let col=0;col<nCols;col++){
                    const hcx=gridLeft+col*hexWd+(row%2===0?0:hexWd*0.5), hcy=gridTop+hexR+row*hexRH;
                    ctx.beginPath();
                    ctx.moveTo(hcx+hexR*hexCos[0],hcy+hexR*hexSin[0]);
                    for(let vi=1;vi<6;vi++) ctx.lineTo(hcx+hexR*hexCos[vi],hcy+hexR*hexSin[vi]);
                    ctx.closePath(); ctx.stroke();
                }
                // "BROKEN" label
                ctx.setTransform(1,0,0,1,0,0);
                const _bCx=(wfTL.x+wfTR.x)/2;
                ctx.fillStyle=obj.connectedPylon?"#00ffcc":"#664433";
                ctx.font="bold 9px monospace"; ctx.textAlign="center";
                ctx.fillText(obj.connectedPylon?"◈ NEST LINKED":"✕ NEST BROKEN",_bCx,wfTL.y-12);
                ctx.restore();

                // ── PERMANENT ENERGY LINK to connected pylon ──
                if (obj.connectedPylon) {
                    const _cp=obj.connectedPylon;
                    const _cpx=(_cp.x-player.visualX-(_cp.y-player.visualY))*TILE_W+canvas.width/2;
                    const _cpy=(_cp.x-player.visualX+(_cp.y-player.visualY))*TILE_H+canvas.height/2;
                    // Nest anchor — center-top of broken nest face
                    const _nSx=(wfTL.x+wfTR.x)/2, _nSy=wfTL.y+30;
                    const _pulse=0.5+0.5*Math.sin((frame||0)*0.07);
                    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
                    // Beam
                    ctx.strokeStyle=`rgba(0,255,200,${0.3+_pulse*0.4})`;
                    ctx.lineWidth=1.5+_pulse; ctx.shadowColor="#00ffcc"; ctx.shadowBlur=8+_pulse*8;
                    ctx.setLineDash([8,5]);
                    ctx.beginPath(); ctx.moveTo(_nSx,_nSy); ctx.lineTo(_cpx,_cpy-60); ctx.stroke();
                    ctx.setLineDash([]);
                    // Travelling energy nodes
                    for(let _i=0;_i<4;_i++){
                        const _t=((frame||0)*0.018+_i*0.25)%1;
                        const _ex=_nSx+(_cpx-_nSx)*_t, _ey=_nSy+(_cpy-60-_nSy)*_t;
                        ctx.fillStyle="#00ffcc"; ctx.globalAlpha=0.65+_pulse*0.35;
                        ctx.shadowBlur=5;
                        ctx.beginPath(); ctx.arc(_ex,_ey,2.5,0,Math.PI*2); ctx.fill();
                    }
                    ctx.restore();
                }
            }

            // ── SPAWN NEST — honeycomb hex holes filling 4-tile wall face ──
            if (obj.nest && obj.nestHealth > 0) {
                obj.nestPulse = (obj.nestPulse || 0) + 1;
                const hr    = obj.nestHealth / obj.nestMaxHealth;
                const pulse = 0.5 + 0.5 * Math.sin(obj.nestPulse * 0.06);
                const WH    = 110;

                // Wall face: 4 tiles from (obj.x-1, -2) to (obj.x+2, -2).
                // sW1 = toScreen(obj.x-1, -2) relative to nest tile (px, py) at (obj.x, -1):
                //   Δwx=−1, Δwy=−1 → Δspx=(−1−(−1))×60=0, Δspy=(−1+(−1))×30=−60
                const sW1x = px,  sW1y = py - 60;
                const numT = 4;
                const wfBL = { x: sW1x - TILE_W,           y: sW1y + TILE_H          };
                const wfBR = { x: sW1x + (numT-1)*TILE_W,  y: sW1y + (numT+1)*TILE_H };
                const wfTR = { x: wfBR.x,                   y: wfBR.y - WH            };
                const wfTL = { x: wfBL.x,                   y: wfBL.y - WH            };

                ctx.save();
                // Clip to parallelogram so hexes only appear on the wall face
                ctx.beginPath();
                ctx.moveTo(wfBL.x, wfBL.y); ctx.lineTo(wfBR.x, wfBR.y);
                ctx.lineTo(wfTR.x, wfTR.y); ctx.lineTo(wfTL.x, wfTL.y);
                ctx.closePath();
                ctx.clip();

                // Honeycomb hex grid (pointy-top)
                const hexR  = 12;
                const hexWd = hexR * Math.sqrt(3);
                const hexRH = hexR * 1.5;
                const gridLeft = wfTL.x - hexWd;
                const gridTop  = wfTL.y - hexR;
                const nRows = Math.ceil((WH + hexR * 4) / hexRH) + 1;
                const nCols = Math.ceil((wfBR.x - wfBL.x + hexWd * 2) / hexWd) + 1;

                const rc = (190 * hr) | 0;
                const gc = (75  * hr) | 0;

                // Pre-compute hex vertex offsets once — avoids 900+ trig calls/frame
                const hexCos = [], hexSin = [];
                for (let vi = 0; vi < 6; vi++) {
                    const ang = Math.PI/6 + vi * Math.PI/3;
                    hexCos.push(Math.cos(ang)); hexSin.push(Math.sin(ang));
                }

                // Flat colours computed once outside the loop (no per-cell gradient)
                const fillCol   = `rgba(${rc*0.22|0},${gc*0.18|0},0,0.93)`;
                const strokeCol = `rgba(${Math.min(255,(rc*1.5)|0)},${(gc*1.4)|0},0,0.75)`;
                ctx.lineWidth = 1.5;

                for (let row = 0; row < nRows; row++) {
                    for (let col = 0; col < nCols; col++) {
                        const hcx = gridLeft + col * hexWd + (row % 2 === 0 ? 0 : hexWd * 0.5);
                        const hcy = gridTop + hexR + row * hexRH;

                        ctx.beginPath();
                        ctx.moveTo(hcx + hexR * hexCos[0], hcy + hexR * hexSin[0]);
                        for (let vi = 1; vi < 6; vi++) ctx.lineTo(hcx + hexR * hexCos[vi], hcy + hexR * hexSin[vi]);
                        ctx.closePath();
                        ctx.fillStyle   = fillCol;
                        ctx.fill();
                        ctx.strokeStyle = strokeCol;
                        ctx.stroke();
                    }
                }

                // Depth overlay — single linear gradient over whole face (no per-cell cost)
                const depthGrd = ctx.createLinearGradient(wfTL.x, wfTL.y, wfBL.x, wfBL.y);
                depthGrd.addColorStop(0, 'rgba(0,0,0,0.55)');
                depthGrd.addColorStop(0.45, 'rgba(0,0,0,0.05)');
                depthGrd.addColorStop(1, 'rgba(0,0,0,0.38)');
                ctx.fillStyle = depthGrd;
                ctx.beginPath();
                ctx.moveTo(wfBL.x, wfBL.y); ctx.lineTo(wfBR.x, wfBR.y);
                ctx.lineTo(wfTR.x, wfTR.y); ctx.lineTo(wfTL.x, wfTL.y);
                ctx.closePath();
                ctx.fill();

                // Pulsing amber bloom — radial gradient, NO shadowBlur
                const bloomA = (0.10 + pulse * 0.14) * hr;
                const bloomX = (wfBL.x + wfBR.x) * 0.5, bloomY = (wfTL.y + wfBL.y) * 0.5;
                const bloomGrd = ctx.createRadialGradient(bloomX, bloomY, 0, bloomX, bloomY, 150);
                bloomGrd.addColorStop(0, `rgba(255,110,0,${bloomA})`);
                bloomGrd.addColorStop(1, 'rgba(255,60,0,0)');
                ctx.fillStyle = bloomGrd;
                ctx.beginPath();
                ctx.moveTo(wfBL.x, wfBL.y); ctx.lineTo(wfBR.x, wfBR.y);
                ctx.lineTo(wfTR.x, wfTR.y); ctx.lineTo(wfTL.x, wfTL.y);
                ctx.closePath();
                ctx.fill();
                ctx.restore();

                // Health bar centred on the top edge of the face
                const barCx = (wfTL.x + wfTR.x) / 2;
                drawHealthBar(barCx - 40, wfTL.y - 10, 80, 5, obj.nestHealth, obj.nestMaxHealth);
            }

            // Command tile highlight
            if (commandMode&&commandTarget===obj) {
                ctx.save();
                ctx.strokeStyle="rgba(0,255,136,0.9)"; ctx.lineWidth=3;
                ctx.beginPath();
						ctx.moveTo(px,py); 							ctx.lineTo(px+TILE_W,py+TILE_H); 							 ctx.lineTo(px,py+TILE_W); 							  ctx.lineTo(px-TILE_W,py+TILE_H); 								ctx.closePath();
								 ctx.stroke();
                			ctx.strokeStyle="rgba(0,255,136,0.25)"; 							ctx.lineWidth=8;
						ctx.stroke();
                ctx.restore();
            }

            // Solo flux pylon — inward-pulling glow ring (only when unpaired)
            // Connection rendering moved to post-draw _wPylonPairs pass (eliminates O(N²) scan)
            if (obj.pillar&&!obj.destroyed&&obj.waveMode&&obj.attackModeElement==="flux") {
                if (!_pylonsWithPartner.has(obj)) {
                    const pulse2=0.4+0.4*Math.sin(frame*0.1);
                    const r=22+pulse2*8;
                    ctx.save();
                    ctx.globalAlpha=0.12+pulse2*0.08; ctx.fillStyle="#6600cc";
                    ctx.shadowColor="#4400aa"; ctx.shadowBlur=18;
                    ctx.beginPath(); ctx.arc(px,py-60,r,0,Math.PI*2); ctx.fill();
                    ctx.shadowBlur=0;
                    for (let s=0;s<5;s++) {
                        const phase=frame*0.07+s*(Math.PI*2/5);
                        const sr=14+Math.sin(phase)*5;
                        ctx.globalAlpha=0.45+pulse2*0.2; ctx.fillStyle="#8800ff"; ctx.shadowBlur=5;
                        ctx.beginPath(); ctx.arc(px+Math.cos(phase)*sr,py-60+Math.sin(phase)*sr*0.5,2,0,Math.PI*2); ctx.fill();
                    }
                    ctx.shadowBlur=0;
                    ctx.restore();
                }
            }

            // Pylon under construction (build mode)
            if (obj.pillar&&obj.constructing&&obj.constructProgress<1) {
                const prog=obj.constructProgress||0;
                const baseY=py+TILE_H; // anchor to tile diamond center, not north vertex
                const scaffH=75*prog;
                ctx.save();
                // Scaffold outline — grows upward as progress increases
                ctx.globalAlpha=0.55; ctx.strokeStyle="#0f8"; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
                ctx.strokeRect(px-6,baseY-scaffH,12,scaffH);
                ctx.setLineDash([]);
                // Progress fill
                ctx.globalAlpha=0.22; ctx.fillStyle="#0f8";
                ctx.fillRect(px-6,baseY-scaffH,12,scaffH);
                ctx.globalAlpha=1;
                // Progress bar
                drawHealthBar(px-14,baseY-scaffH-10,28,5,prog,1);
                // Timer label
                const secsLeft=Math.ceil((1-prog)*30);
                ctx.fillStyle="#0f8"; ctx.font="9px monospace"; ctx.textAlign="center"; ctx.setTransform(1,0,0,1,0,0);
                ctx.fillText(secsLeft+"s",px,baseY-scaffH-14);
                ctx.restore();
            }

            // ── PYLON SELECT HIGHLIGHT (nest connect mode) ──
            if (nestConnectMode && obj.pillar&&!obj.destroyed&&obj.pillarTeam==="green"&&obj.health>0&&(obj.attackMode||obj.waveMode)) {
                const _blink=Math.floor((frame||0)/10)%2===0;
                ctx.save();
                ctx.beginPath();
                ctx.moveTo(px,py); ctx.lineTo(px+TILE_W,py+TILE_H);
                ctx.lineTo(px,py+TILE_W); ctx.lineTo(px-TILE_W,py+TILE_H);
                ctx.closePath();
                ctx.globalAlpha=_blink?0.92:0.28;
                ctx.strokeStyle="#00ffcc"; ctx.lineWidth=3;
                ctx.shadowColor="#00ffcc"; ctx.shadowBlur=_blink?20:6;
                ctx.stroke();
                ctx.globalAlpha=_blink?0.14:0.04;
                ctx.fillStyle="#00ffcc"; ctx.fill();
                // "LINK" label — above tile top corner
                ctx.globalAlpha=_blink?1:0.4;
                ctx.fillStyle="#00ffcc"; ctx.font="bold 9px monospace"; ctx.textAlign="center";
                ctx.shadowBlur=0; ctx.setTransform(1,0,0,1,0,0);
                ctx.fillText("LINK",px,py-8);
                ctx.restore();
            }

            // ── NETWORK NODE TILE HIGHLIGHT ──
            if (obj.pillar&&!obj.destroyed&&obj.pillarTeam==="green"&&obj.health>0&&obj.attackModeElement) {
                const _gelDef = ELEMENTS.find(e=>e.id===obj.attackModeElement);
                const _gCol = _gelDef ? _gelDef.color : "#0f8";
                const _gpulse = 0.5+0.5*Math.sin((frame||0)*0.07+obj.x*0.8+obj.y*0.5);
                ctx.save();
                // Tile diamond outline
                ctx.beginPath();
                ctx.moveTo(px,          py);
                ctx.lineTo(px + TILE_W, py + TILE_H);
                ctx.lineTo(px,          py + TILE_W);
                ctx.lineTo(px - TILE_W, py + TILE_H);
                ctx.closePath();
                // Subtle fill
                ctx.globalAlpha = 0.05 + _gpulse * 0.07;
                ctx.fillStyle = _gCol;
                ctx.fill();
                // Accentuated border
                ctx.globalAlpha = 0.3 + _gpulse * 0.4;
                ctx.strokeStyle = _gCol;
                ctx.lineWidth = 2;
                ctx.shadowColor = _gCol;
                ctx.shadowBlur = 8 + _gpulse * 6;
                ctx.stroke();
                ctx.restore();
            }

            // Pillar
            if (obj.pillar&&!obj.destroyed&&typeof obj.health==="number"&&obj.health>0) {
                if(obj.converting){ctx.fillStyle="#ff0";}
                drawHealthBar(px-10,py-80,20,4,obj.health,obj.maxHealth);
                if (obj.waveMode) {
                    // ── WAVE FUNCTION MODE — glowing resonance tower ──
                    const wcol = obj.attackModeColor||"#0f8";
                    const wpulse = 0.5+0.5*Math.sin(frame*0.08+(obj.pulseTimer||0)*0.05);
                    obj.pulseTimer=(obj.pulseTimer||0)+1;
                    // Network tier boosts visual intensity
                    const _wTier = networkStrength[obj.attackModeElement] || 0;
                    const _tierMult = 1 + _wTier * 0.4; // 1.0 / 1.4 / 1.8 / 2.2
                    const _wGlowR = (28 + wpulse*6) * Math.min(1.5, _tierMult);
                    const _wGlowA = Math.min(0.55, (0.12 + wpulse*0.1) * _tierMult);
                    // Soft glow ring — scales with tier
                    ctx.save(); ctx.globalAlpha=_wGlowA; ctx.fillStyle=wcol;
                    ctx.shadowColor=wcol; ctx.shadowBlur=_wTier > 1 ? 18*_tierMult : 0;
                    ctx.beginPath(); ctx.arc(px,py-45,_wGlowR,0,Math.PI*2); ctx.fill();
                    ctx.shadowBlur=0; ctx.restore();
                    // Tier 2+: secondary outer ring pulses in sync
                    if (_wTier >= 2) {
                        ctx.save(); ctx.globalAlpha=(0.07+wpulse*0.07)*_tierMult;
                        ctx.strokeStyle=wcol; ctx.lineWidth=2; ctx.shadowColor=wcol; ctx.shadowBlur=10;
                        ctx.beginPath(); ctx.arc(px,py-45,_wGlowR+12+wpulse*8,0,Math.PI*2); ctx.stroke();
                        ctx.shadowBlur=0; ctx.restore();
                    }
                    // Slender column — smaller and thinner
                    ctx.fillStyle="#0a0a1a";
                    ctx.fillRect(px-5,py-75,10,105);
                    // Seasoned gold band around column base
                    if ((obj.seasoned||0) > 0) {
                        const sLevel = Math.min(3, obj.seasoned);
                        ctx.save();
                        ctx.strokeStyle="#ffd700"; ctx.lineWidth=1+sLevel*0.5;
                        ctx.globalAlpha=0.55+wpulse*0.25;
                        ctx.shadowColor="#ffd700"; ctx.shadowBlur=4+sLevel*3;
                        for (let _si=0;_si<sLevel;_si++) {
                            ctx.beginPath(); ctx.rect(px-5-_si,py-20-_si*5,10+_si*2,2); ctx.stroke();
                        }
                        ctx.shadowBlur=0; ctx.restore();
                    }
                    // Glowing orb at top — size + blur scale with tier
                    const _orbR = 6 + _wTier*1;
                    const _orbBlur = (10+wpulse*8) * Math.min(2, _tierMult);
                    ctx.save(); ctx.shadowColor=wcol; ctx.shadowBlur=_orbBlur;
                    ctx.fillStyle=wcol; ctx.globalAlpha=0.7+wpulse*0.3;
                    ctx.beginPath(); ctx.arc(px,py-75,_orbR,0,Math.PI*2); ctx.fill();
                    ctx.restore();
                    // Element label + effect description (tier-aware)
                    const PYLON_FX_TIER = {
                        fire:     ["fire wall","heavy burn","ignite spread"],
                        ice:      ["ice field","chill zone","deep freeze"],
                        electric: ["arc chain","arc boost","max arc"],
                        core:     ["shield barrier","fast shields","regen shields"],
                        flux:     ["gravity well","chain pull","vortex"],
                        toxic:    ["corrodes enemies","shred+plague","plague cloud"]
                    };
                    const el0=obj.attackModeElement||"";
                    const _tierDesc = _wTier > 0 ? (PYLON_FX_TIER[el0]?.[_wTier-1] || "") : (PYLON_FX_TIER[el0]?.[0] || "");
                    const _tierBadge = _wTier > 0 ? [" T-I"," T-II"," T-III"][_wTier-1] : "";
                    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
                    ctx.fillStyle=wcol; ctx.font="bold 9px monospace"; ctx.textAlign="center";
                    ctx.fillText(el0.toUpperCase()+_tierBadge,px,py-88);
                    ctx.font="7px monospace"; ctx.globalAlpha=0.7;
                    ctx.fillText(_tierDesc,px,py-78);
                    ctx.restore();
                } else if (obj.attackMode) {
                    // ── ATTACK MODE — angular armed pylon ──
                    const acol = obj.attackModeColor || "#0f8";
                    const pulse = 0.5+0.5*Math.sin((frame+(obj.pulseTimer||0))*0.12);
                    obj.pulseTimer = (obj.pulseTimer||0)+1;
                    // Glowing range ring
                    ctx.save(); ctx.globalAlpha=0.08+pulse*0.08; ctx.strokeStyle=acol; ctx.lineWidth=2;
                    ctx.beginPath(); ctx.arc(px,py-40,obj.attackRange*TILE_W*0.5,0,Math.PI*2); ctx.stroke(); ctx.restore();
                    // Body — dark armored column (slimmer)
                    ctx.fillStyle="#111";
                    ctx.fillRect(px-7,py-75,14,105);
                    // Armor panels
                    ctx.fillStyle="#222";
                    ctx.fillRect(px-9,py-75,3,105);
                    ctx.fillRect(px+6,py-75,3,105);
                    // Glowing barrel nub at top
                    ctx.save(); ctx.shadowColor=acol; ctx.shadowBlur=8+pulse*6;
                    ctx.fillStyle=acol;
                    ctx.beginPath(); ctx.arc(px,py-75,5,0,Math.PI*2); ctx.fill();
                    ctx.restore();
                    // Element color stripe
                    ctx.fillStyle=acol; ctx.globalAlpha=0.4;
                    ctx.fillRect(px-2,py-70,4,60);
                    ctx.globalAlpha=1;
                    // Element + effect label
                    if (obj.attackModeElement) {
                        const PYLON_FX2={fire:"fire wall",ice:"ice field",electric:"arc chain",core:"shield barrier",flux:"gravity well",toxic:"corrodes enemies"};
                        ctx.save(); ctx.setTransform(1,0,0,1,0,0);
                        ctx.fillStyle=acol; ctx.font="bold 9px monospace"; ctx.textAlign="center";
                        ctx.fillText(obj.attackModeElement.toUpperCase(),px,py-88);
                        ctx.font="7px monospace"; ctx.globalAlpha=0.7;
                        ctx.fillText(PYLON_FX2[obj.attackModeElement]||"",px,py-78);
                        ctx.restore();
                    }
                } else if(obj.upgraded){
                    ctx.save(); ctx.globalAlpha=0.2; ctx.fillStyle="#0f8";
                    ctx.beginPath(); ctx.arc(px,py-65,12,0,Math.PI*2); ctx.fill(); ctx.restore();
                    ctx.fillStyle="#0d1220"; ctx.fillRect(px-8,py-75,16,105);
                    ctx.fillStyle="#0f8"; ctx.beginPath(); ctx.arc(px,py-75,4,0,Math.PI*2); ctx.fill();
                } else {
                    const dist2=Math.sqrt((obj.x-player.visualX)**2+(obj.y-player.visualY)**2);
                    const amb2=Math.max(0.1,0.8-dist2/RENDER_DIST);
                    // Body — dark map-matching stone (no green tint), slimmer
                    ctx.fillStyle=`rgb(${Math.floor(14*amb2)},${Math.floor(18*amb2)},${Math.floor(30*amb2)})`;
                    ctx.fillRect(px-6,py-65,12,95);
                    // Light orb — stays team color (green friendly, red hostile)
                    ctx.fillStyle=obj.pillarCol;
                    ctx.shadowColor=obj.pillarCol; ctx.shadowBlur=8;
                    ctx.beginPath(); ctx.arc(px,py-65,3,0,7); ctx.fill();
                    ctx.shadowBlur=0;
                }
            }
        }
        else {
            // WALLS — isometric faces aligned to tile grid
            // TILE_W=60, TILE_H=30. Diamond vertices: N=(px,py) E=(px+60,py+30) S=(px,py+60) W=(px-60,py+30)
            const dist = Math.sqrt((obj.x-player.visualX)**2 + (obj.y-player.visualY)**2);
            const amb  = Math.max(0.1, 0.8 - dist/RENDER_DIST);
            const glo  = Math.max(0, 1.0 - dist/5);
            const WH   = 110; // wall height in pixels

            if (obj.type === 'wall_back') {
                // Top face
                ctx.fillStyle = `rgb(${14*amb+(6*glo)},${18*amb+(16*glo)},${28*amb+(38*glo)})`;
                ctx.beginPath();
                ctx.moveTo(px,          py - WH);
                ctx.lineTo(px + TILE_W, py + TILE_H - WH);
                ctx.lineTo(px,          py + 2*TILE_H - WH);
                ctx.lineTo(px - TILE_W, py + TILE_H - WH);
                ctx.fill();
                // South face — from W→S base up by WH
                ctx.fillStyle = `rgb(${9*amb+(4*glo)},${12*amb+(12*glo)},${19*amb+(30*glo)})`;
                ctx.beginPath();
                ctx.moveTo(px - TILE_W, py + TILE_H);
                ctx.lineTo(px,          py + 2*TILE_H);
                ctx.lineTo(px,          py + 2*TILE_H - WH);
                ctx.lineTo(px - TILE_W, py + TILE_H - WH);
                ctx.fill();

                // ── WALL ATMOSPHERE DECORATIONS ─────────────────────────────
                const xi = Math.abs(Math.floor(obj.x));

                // 1. Conduit pipe along wall base (every tile)
                ctx.save();
                ctx.globalAlpha=0.45*amb; ctx.strokeStyle="#0a1a14"; ctx.lineWidth=3;
                ctx.beginPath(); ctx.moveTo(px-TILE_W,py+TILE_H-3); ctx.lineTo(px,py+2*TILE_H-3); ctx.stroke();
                ctx.strokeStyle="#1a3a28"; ctx.lineWidth=1; ctx.globalAlpha=0.25*amb;
                ctx.stroke(); ctx.restore();

                // 3. Server rack panels — every 9 tiles (offset from vents)
                const isRackX=(xi%9===4);

                // 1b. Circuit board traces — horizontal PCB interconnects across wall south face
                // Traces cluster in tight bundles every ~8 tiles; sparse bus-only elsewhere.
                // Skip on rack panel tiles to avoid traces bleeding through semi-transparent panel.
                if (!isRackX) {
                    // South face parallelogram: W=(px-TILE_W, py+TILE_H), S=(px, py+2*TILE_H)
                    const wx = px - TILE_W, wy = py + TILE_H;
                    const sx = px,          sy = py + 2 * TILE_H;
                    const trH = [WH * 0.20, WH * 0.45, WH * 0.70];
                    ctx.save();

                    // Determine cluster membership — clusters every 8 tiles, span 3 tiles wide
                    const CPER = 8;
                    const posInC = ((xi % CPER) + CPER) % CPER; // 0..7
                    // Cluster centre at posInC === 1, spans posInC 0,1,2
                    const distC = Math.min(posInC, Math.abs(posInC - 1), Math.abs(posInC - 2));
                    const inCluster = posInC <= 2;
                    const isCenter  = posInC === 1;
                    // Vary cluster position across world so they don't line up perfectly
                    const clusterIdx = Math.floor(xi / CPER);
                    const centerShift = Math.sin(clusterIdx * 17.31 + 2.9) * 0.15; // ±0.15 t-shift

                    // Main horizontal bus traces (always present)
                    trH.forEach(h => {
                        ctx.globalAlpha = (inCluster ? 0.30 : 0.14) * amb;
                        ctx.strokeStyle = "#00bb88";
                        ctx.lineWidth   = inCluster ? 1.1 : 0.7;
                        ctx.beginPath();
                        ctx.moveTo(wx, wy - h);
                        ctx.lineTo(sx, sy - h);
                        ctx.stroke();
                    });
                    ctx.lineWidth = 0.8;

                    if (inCluster) {
                        // ── CLUSTER ZONE: tight bundle of vertical jogs ──
                        // All jogs packed into a narrow band around the cluster centre fraction.
                        const baseFrac = 0.50 + centerShift + (posInC - 1) * 0.08;
                        const numJogs  = isCenter ? 9 : 5;
                        const spread   = 0.16; // total horizontal spread of the bundle (in t-space)

                        for (let j = 0; j < numJogs; j++) {
                            const seed = clusterIdx * 97 + j * 13.7 + posInC * 3.1;
                            // Evenly space jogs within the spread, with tiny seeded dither
                            const tOff = (j / (numJogs - 1) - 0.5) * spread
                                       + Math.sin(seed * 5.3) * (spread / numJogs) * 0.4;
                            const t  = baseFrac + tOff;
                            const jx = wx + t * (sx - wx);
                            const jy = wy + t * (sy - wy);

                            // Each jog connects two of the three bus traces
                            const top = (j % 3 === 2) ? 0 : (j % 2 === 0 ? 0 : 1);
                            const bot = (j % 3 === 2) ? 2 : (j % 2 === 0 ? 1 : 2);
                            const jogColors = ["#00ffaa", "#0099dd", "#00ccbb"];
                            ctx.globalAlpha = (0.20 + Math.abs(Math.sin(seed)) * 0.14) * amb;
                            ctx.strokeStyle = jogColors[j % 3];
                            ctx.beginPath();
                            ctx.moveTo(jx, jy - trH[top]);
                            ctx.lineTo(jx, jy - trH[bot]);
                            ctx.stroke();

                            // Via pads at jog endpoints
                            ctx.globalAlpha = 0.35 * amb;
                            ctx.fillStyle   = j % 2 === 0 ? "#00cc88" : "#0099cc";
                            ctx.beginPath(); ctx.arc(jx, jy - trH[top], 1.5, 0, Math.PI * 2); ctx.fill();
                            ctx.beginPath(); ctx.arc(jx, jy - trH[bot], 1.5, 0, Math.PI * 2); ctx.fill();
                            // Middle via for full-span jogs
                            if (top === 0 && bot === 2) {
                                ctx.globalAlpha = 0.28 * amb;
                                ctx.beginPath(); ctx.arc(jx, jy - trH[1], 1.2, 0, Math.PI * 2); ctx.fill();
                            }
                        }

                        // Short horizontal stub fanning out from centre cluster
                        if (isCenter) {
                            const bx  = wx + baseFrac * (sx - wx);
                            const by  = wy + baseFrac * (sy - wy);
                            const bx2 = wx + (baseFrac + 0.22) * (sx - wx);
                            const by2 = wy + (baseFrac + 0.22) * (sy - wy);
                            ctx.globalAlpha = 0.18 * amb;
                            ctx.strokeStyle = "#00eeaa";
                            ctx.lineWidth   = 0.7;
                            ctx.beginPath();
                            ctx.moveTo(bx, by - trH[1]);
                            ctx.lineTo(bx2, by2 - trH[1]);
                            ctx.stroke();
                        }
                    } else {
                        // ── SPARSE ZONE: at most one isolated jog ──
                        const sA = Math.sin(xi * 41.73 + 3.17);
                        if (sA > 0.42) { // higher threshold → fewer jogs between clusters
                            const t  = 0.20 + Math.abs(Math.sin(xi * 19.3 + 1.1)) * 0.60;
                            const jx = wx + t * (sx - wx);
                            const jy = wy + t * (sy - wy);
                            ctx.globalAlpha = 0.09 * amb;
                            ctx.strokeStyle = "#00ffaa";
                            ctx.beginPath();
                            ctx.moveTo(jx, jy - trH[0]);
                            ctx.lineTo(jx, jy - trH[1]);
                            ctx.stroke();
                            ctx.globalAlpha = 0.16 * amb;
                            ctx.fillStyle   = "#00cc88";
                            ctx.beginPath(); ctx.arc(jx, jy - trH[1], 1.0, 0, Math.PI * 2); ctx.fill();
                        }
                    }

                    // Top face chip traces — clipped diagonal lines across diamond
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(px, py - WH);
                    ctx.lineTo(px + TILE_W, py + TILE_H - WH);
                    ctx.lineTo(px, py + 2 * TILE_H - WH);
                    ctx.lineTo(px - TILE_W, py + TILE_H - WH);
                    ctx.closePath(); ctx.clip();
                    ctx.globalAlpha = 0.13 * amb;
                    ctx.strokeStyle = "#00aacc";
                    ctx.lineWidth   = 0.7;
                    for (let tr = 1; tr <= 2; tr++) {
                        const f  = tr / 3;
                        const ly = (py - WH) + f * 2 * TILE_H;
                        ctx.beginPath();
                        ctx.moveTo(px - TILE_W * 2, ly);
                        ctx.lineTo(px + TILE_W * 2, ly);
                        ctx.stroke();
                    }
                    ctx.restore();
                    ctx.restore();
                }

                // 2. Crevasses — jagged fracture on wall face
                if (Math.sin(xi*43.7+11.3)>0.62) {
                    const seed2=xi*17.3;
                    let crx=px-38+(Math.sin(seed2)*12|0), cry=py+TILE_H-WH*0.85;
                    const crLen=5+(Math.abs(Math.sin(seed2*2.7))*4|0);
                    ctx.save();
                    ctx.globalAlpha=0.38*amb; ctx.strokeStyle="#000508"; ctx.lineWidth=1.5;
                    ctx.beginPath(); ctx.moveTo(crx,cry);
                    for (let s=0;s<crLen;s++) {
                        crx+=(Math.sin(seed2+s*7.1)*5)|0;
                        cry+=7+(Math.abs(Math.sin(seed2+s*3.3))*5|0);
                        ctx.lineTo(crx,cry);
                    }
                    ctx.stroke();
                    ctx.strokeStyle="#1a4030"; ctx.lineWidth=0.5; ctx.globalAlpha=0.12*amb;
                    ctx.stroke();
                    ctx.restore();
                }

                // Drawn with isometric shear (transform b=0.5) so they lie on the south wall face.
                if (isRackX) {
                    // South face center: x = px-TILE_W/2, y = py+TILE_H/2-WH*0.5 (mid-wall)
                    const rcx = px - TILE_W*0.5;
                    const rcy = py + TILE_H*0.5 - WH*0.42;
                    const rw=20, rh=42;
                    ctx.save();
                    // Isometric shear to sit on wall face (slope = TILE_H/TILE_W = 0.5)
                    ctx.transform(1, 0.5, 0, 1, rcx, rcy);
                    ctx.globalAlpha=0.75*amb; ctx.fillStyle="#0a0d10";
                    ctx.fillRect(-rw/2,-rh/2,rw,rh);
                    ctx.strokeStyle=`rgba(0,180,100,${0.45*amb})`; ctx.lineWidth=1;
                    ctx.strokeRect(-rw/2,-rh/2,rw,rh);
                    ctx.fillStyle=`rgba(0,40,20,${0.8*amb})`;
                    for (let row=0;row<4;row++) ctx.fillRect(-rw/2+2,-rh/2+5+row*8,rw-4,3);
                    // status LEDs
                    const ledCols=["#00ff88","#ffaa00","#ff3333"];
                    ledCols.forEach((lc,i)=>{
                        const blink=(i===1)?(Math.sin(frame*0.04+xi)>0?1:0.2):1;
                        ctx.globalAlpha=0.9*amb*blink;
                        ctx.fillStyle=lc; ctx.shadowColor=lc; ctx.shadowBlur=4;
                        ctx.beginPath(); ctx.arc(-6+i*6, rh/2-6, 1.5, 0, Math.PI*2); ctx.fill();
                    });
                    ctx.shadowBlur=0; ctx.restore();
                }

                // 4. LED indicator strips — every 5 tiles (not on racks)
                // Apply isometric shear so the 4 lights lie on the south wall face.
                if (xi%5===2 && !isRackX) {
                    const lcx = px - TILE_W * 0.5;
                    const lcy = py + TILE_H * 0.5 - WH * 0.28;
                    ctx.save();
                    ctx.transform(1, 0.5, 0, 1, lcx, lcy);
                    for (let i=0;i<4;i++) {
                        const on=Math.sin(frame*0.08+xi*3.1+i*1.7)>0.2;
                        ctx.globalAlpha=(on?0.85:0.15)*amb;
                        ctx.fillStyle=on?"#00ffaa":"#003322";
                        ctx.shadowColor="#00ff88"; ctx.shadowBlur=on?5:0;
                        ctx.beginPath(); ctx.arc(-6+i*4, 0, 1.8, 0, Math.PI*2); ctx.fill();
                    }
                    ctx.shadowBlur=0; ctx.restore();
                }

                // 5. Condensation drips — every 6th tile
                if (xi%6===1) {
                    if (!obj.drip) obj.drip={y:py+TILE_H-WH*0.7,speed:0.4+Math.sin(xi*5.3)*0.15};
                    obj.drip.y+=obj.drip.speed;
                    if (obj.drip.y>py+TILE_H*1.5) obj.drip.y=py+TILE_H-WH*0.7;
                    ctx.save();
                    ctx.globalAlpha=0.28*amb; ctx.fillStyle="#003322";
                    ctx.beginPath(); ctx.ellipse(px-33,obj.drip.y,1.2,2.2,0,0,Math.PI*2); ctx.fill();
                    ctx.restore();
                }

                // Exhaust vent — gap-sequence placement: gaps of 7–18 tiles, avg ~12
                // isVentX walks the deterministic chain from x=0, O(|x|/7) iterations
                const isVentX = (target) => {
                    let pos = 0;
                    while (pos <= target) {
                        if (pos === target) return true;
                        const gap = 7 + ((Math.abs(Math.sin(pos * 127.1 + 7.3)) * 10000 | 0) % 12);
                        pos += gap;
                    }
                    return false;
                };
                if (xi >= ZONE_LENGTH && isVentX(xi)) {
                    const flen = Math.hypot(TILE_W, TILE_H);
                    const fdx = TILE_W / flen, fdy = TILE_H / flen;
                    const vw = 9, vh = 10;
                    const vcx = px - 30;
                    const vcy = py + 45 - WH * 0.62;

                    // ── VENT STATE MACHINE (stored on tile object, lazy init) ──
                    if (!obj.ventState) {
                        obj.ventState   = 'idle';
                        obj.ventTimer   = 0;
                        obj.ventIdleDur = 200 + ((Math.abs(Math.sin(xi * 37.1)) * 10000 | 0) % 220);
                    }
                    obj.ventTimer++;
                    if (obj.ventState === 'idle' && obj.ventTimer >= obj.ventIdleDur) {
                        obj.ventState = 'shimmer'; obj.ventTimer = 0;
                    } else if (obj.ventState === 'shimmer' && obj.ventTimer >= 50) {
                        obj.ventState = 'blast'; obj.ventTimer = 0;
                        // Fire hits 3 tiles into the corridor (+y from wall at y=-2)
                        for (let step = 1; step <= 3; step++) {
                            const bwx = obj.x, bwy = obj.y + step;
                            actors.forEach(a => {
                                if (!a.dead && Math.abs(a.x-bwx)<1.0 && Math.abs(a.y-bwy)<1.0) {
                                    applyDamage(a, 8, null, "fire");
                                    floatingTexts.push({x:a.x,y:a.y,text:"BLAST",color:"#ff6600",life:35,vy:-0.05});
                                }
                            });
                            if (Math.abs(player.x-bwx)<1.0 && Math.abs(player.y-bwy)<1.0) {
                                health = Math.max(0, health-10); shake = Math.max(shake, 6);
                            }
                        }
                    } else if (obj.ventState === 'blast' && obj.ventTimer >= 30) {
                        obj.ventState = 'idle'; obj.ventTimer = 0;
                        obj.ventIdleDur = 200 + ((Math.abs(Math.sin(xi * 53.7 + frame)) * 10000 | 0) % 220);
                    }

                    // ── DRAW VENT OPENING ──
                    const glowCol = obj.ventState === 'idle'    ? "rgba(0,200,110,0.45)"
                                  : obj.ventState === 'shimmer' ? `rgba(255,140,0,${0.4 + obj.ventTimer/50*0.5})`
                                  :                               "rgba(255,60,0,0.9)";
                    // Shimmer — orange heat glow building up
                    if (obj.ventState === 'shimmer') {
                        const t = obj.ventTimer / 50;
                        ctx.save();
                        ctx.globalAlpha = t * 0.55;
                        ctx.shadowColor = "#ff4400"; ctx.shadowBlur = 14;
                        ctx.fillStyle = "#ff6600";
                        ctx.beginPath();
                        ctx.moveTo(vcx - fdx*vw*1.5, vcy - fdy*vw*1.5);
                        ctx.lineTo(vcx + fdx*vw*1.5, vcy + fdy*vw*1.5);
                        ctx.lineTo(vcx + fdx*vw*1.5, vcy + fdy*vw*1.5 - vh*1.6);
                        ctx.lineTo(vcx - fdx*vw*1.5, vcy - fdy*vw*1.5 - vh*1.6);
                        ctx.fill(); ctx.restore();
                    }
                    // Dark opening
                    ctx.fillStyle = obj.ventState === 'idle' ? "#010e08" : "#1a0400";
                    ctx.beginPath();
                    ctx.moveTo(vcx - fdx*vw, vcy - fdy*vw);
                    ctx.lineTo(vcx + fdx*vw, vcy + fdy*vw);
                    ctx.lineTo(vcx + fdx*vw, vcy + fdy*vw - vh);
                    ctx.lineTo(vcx - fdx*vw, vcy - fdy*vw - vh);
                    ctx.fill();
                    ctx.strokeStyle = glowCol; ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(vcx - fdx*vw, vcy - fdy*vw);
                    ctx.lineTo(vcx + fdx*vw, vcy + fdy*vw);
                    ctx.lineTo(vcx + fdx*vw, vcy + fdy*vw - vh);
                    ctx.lineTo(vcx - fdx*vw, vcy - fdy*vw - vh);
                    ctx.closePath(); ctx.stroke();

                    // Blast fire plume along the 3 corridor tiles
                    if (obj.ventState === 'blast') {
                        const fade = 1 - obj.ventTimer / 30;
                        for (let step = 1; step <= 3; step++) {
                            const bpx2 = px - step * TILE_W;
                            const bpy2 = py + step * TILE_H;
                            ctx.save();
                            ctx.globalAlpha = fade * Math.max(0, 1 - step * 0.25);
                            ctx.shadowColor = "#ff4400"; ctx.shadowBlur = 22;
                            ctx.fillStyle = `rgb(255,${(110 - step*25 + Math.random()*40)|0},0)`;
                            ctx.beginPath();
                            ctx.arc(bpx2, bpy2 - 18, 20 - step * 3, 0, Math.PI * 2);
                            ctx.fill(); ctx.restore();
                        }
                    }

                    // Idle smoke
                    if (obj.ventState === 'idle' && frame % 28 === Math.abs(xi * 13) % 28) {
                        smoke.push({
                            wx: obj.x, wy: obj.y,
                            ox: -30 + (Math.random()-0.5)*3,
                            oy: 45 - WH*0.62 - vh,
                            vox: (Math.random()-0.5)*0.3,
                            voy: -0.5 - Math.random()*0.3,
                            life: 0.75, size: 3 + Math.random()*4
                        });
                    }
                }
            }
            // wall_front not rendered — it hides the action
        }
    });

    // ── PYLON NETWORK CONNECTION RENDERING ──
    // Single O(P) pass over pre-computed pairs — replaces the previous O(N²) per-pylon scan.
    if (_wPylonPairs.length > 0) {
        const _ncPulse = 0.4 + 0.4 * Math.sin(frame * 0.1);
        _wPylonPairs.forEach(({pa, pb, el, col}) => {
            const px   = (pa.x - player.visualX - (pa.y - player.visualY)) * TILE_W + canvas.width/2;
            const py   = (pa.x - player.visualX + (pa.y - player.visualY)) * TILE_H + canvas.height/2;
            const pbpx = (pb.x - player.visualX - (pb.y - player.visualY)) * TILE_W + canvas.width/2;
            const pbpy = (pb.x - player.visualX + (pb.y - player.visualY)) * TILE_H + canvas.height/2;
            const y1 = py - 60, y2 = pbpy - 60;
            const _connTier  = networkStrength[el] || 0;
            const _connBoost = 1 + _connTier * 0.35;
            ctx.save();

            // ── PHYSICAL CABLE LAYER ──
            {
                const cDist = Math.hypot(pbpx - px, pbpy - py);
                const sag   = Math.min(55, cDist * 0.22);
                const midX  = (px + pbpx) / 2, midY = (py + pbpy) / 2 + sag;
                ctx.shadowBlur = 0;
                const bundles = [{ox:-3,oy:-2,w:2.5,alpha:0.85},{ox:0,oy:2,w:3.0,alpha:0.90},{ox:4,oy:-1,w:2.0,alpha:0.75}];
                bundles.forEach(b => {
                    const sx = px+b.ox, sy = py+b.oy, ex = pbpx+b.ox, ey = pbpy+b.oy;
                    const cmy = midY + b.oy;
                    ctx.globalAlpha = b.alpha * 0.9;
                    ctx.strokeStyle = "#111418"; ctx.lineWidth = b.w + 1.5;
                    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.bezierCurveTo(midX+b.ox,cmy,midX+b.ox,cmy,ex,ey); ctx.stroke();
                    ctx.strokeStyle = col; ctx.lineWidth = 0.8; ctx.globalAlpha = 0.18;
                    ctx.beginPath(); ctx.moveTo(sx,sy); ctx.bezierCurveTo(midX+b.ox,cmy,midX+b.ox,cmy,ex,ey); ctx.stroke();
                });
                ctx.globalAlpha = 1;
            }

            if (el === "fire") {
                ctx.globalAlpha = Math.min(0.85, (0.15 + _ncPulse*0.08) * _connBoost);
                ctx.strokeStyle = "#ff3300"; ctx.lineWidth = 10 + _connTier*3;
                ctx.shadowColor = "#ff2200"; ctx.shadowBlur = 16 + _connTier*8;
                ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(pbpx,pbpy); ctx.stroke();
                ctx.shadowBlur = 0;
                const segs = 14 + _connTier*4;
                // Hoist constant shadow state outside flame loop
                ctx.shadowColor = "#ff4400"; ctx.shadowBlur = 8 + _connTier*4;
                for (let s = 0; s <= segs; s++) {
                    const t = s/segs;
                    const fx = px+(pbpx-px)*t, fy = py+(pbpy-py)*t;
                    const flk = Math.sin(frame*0.18+s*1.5)*0.5+0.5;
                    const h = (12+flk*18)*(1+_connTier*0.4);
                    ctx.globalAlpha = Math.min(0.85,(0.3+flk*0.25)*(0.45+_ncPulse*0.25)*_connBoost);
                    ctx.fillStyle = s%2===0?"#ff6600":"#ff3300";
                    ctx.beginPath(); ctx.moveTo(fx-3,fy); ctx.quadraticCurveTo(fx+2,fy-h*0.55,fx,fy-h); ctx.quadraticCurveTo(fx-2,fy-h*0.55,fx+3,fy); ctx.fill();
                }
                ctx.shadowBlur = 0;

            } else if (el === "ice") {
                ctx.globalAlpha = Math.min(0.85,(0.18+_ncPulse*0.12)*_connBoost);
                ctx.strokeStyle = "#aaddff"; ctx.lineWidth = 12+_connTier*4;
                ctx.shadowColor = "#88ccff"; ctx.shadowBlur = 14+_connTier*6;
                ctx.beginPath(); ctx.moveTo(px,y1); ctx.lineTo(pbpx,y2); ctx.stroke();
                // Hoist crystal shadow state outside crystal loop
                ctx.shadowColor = "#88ccff"; ctx.shadowBlur = 5+_connTier*3;
                ctx.strokeStyle = "#cceeFF"; ctx.lineWidth = 1+_connTier*0.3;
                ctx.globalAlpha = Math.min(0.9,(0.55+_ncPulse*0.3)*_connBoost);
                const crysts = 9+_connTier*3;
                for (let s = 1; s < crysts; s++) {
                    const t = s/crysts;
                    const cx2 = px+(pbpx-px)*t, cy2 = y1+(y2-y1)*t;
                    const sz = (4+Math.sin(frame*0.05+s*1.2)*1.5)*(1+_connTier*0.25);
                    ctx.beginPath();
                    ctx.moveTo(cx2-sz,cy2); ctx.lineTo(cx2+sz,cy2);
                    ctx.moveTo(cx2,cy2-sz); ctx.lineTo(cx2,cy2+sz);
                    ctx.moveTo(cx2-sz*0.7,cy2-sz*0.7); ctx.lineTo(cx2+sz*0.7,cy2+sz*0.7);
                    ctx.moveTo(cx2+sz*0.7,cy2-sz*0.7); ctx.lineTo(cx2-sz*0.7,cy2+sz*0.7);
                    ctx.stroke();
                }
                ctx.shadowBlur = 0;

            } else if (el === "electric") {
                const _arcCount = 1 + _connTier;
                ctx.shadowColor = "#88aaff"; ctx.shadowBlur = 16+_connTier*8;
                ctx.strokeStyle = `rgba(180,210,255,${Math.min(1,0.7+_ncPulse*0.3)})`;
                ctx.lineWidth = 1.5+_connTier*0.8; ctx.lineCap = "round";
                for (let _ai = 0; _ai < _arcCount; _ai++) {
                    ctx.beginPath(); ctx.moveTo(px,y1);
                    for (let s = 1; s < 10; s++) {
                        const t = s/10;
                        ctx.lineTo(px+(pbpx-px)*t+(Math.random()-0.5)*(14+_ai*5), y1+(y2-y1)*t+(Math.random()-0.5)*(10+_ai*3));
                    }
                    ctx.lineTo(pbpx,y2); ctx.stroke();
                }
                ctx.shadowBlur = 6; ctx.strokeStyle = `rgba(200,220,255,${0.3+_ncPulse*0.2})`; ctx.lineWidth = 1;
                ctx.beginPath(); ctx.moveTo(px,y1);
                for (let s = 1; s < 10; s++) {
                    const t = s/10;
                    ctx.lineTo(px+(pbpx-px)*t+(Math.random()-0.5)*18, y1+(y2-y1)*t+(Math.random()-0.5)*12);
                }
                ctx.lineTo(pbpx,y2); ctx.stroke();
                ctx.shadowBlur = 0;

            } else if (el === "flux") {
                const midx = (px+pbpx)/2, midy = (y1+y2)/2;
                ctx.globalAlpha = Math.min(0.85,(0.28+_ncPulse*0.18)*_connBoost);
                ctx.strokeStyle = "#6600cc"; ctx.lineWidth = (4+_ncPulse*2)*(1+_connTier*0.3);
                ctx.shadowColor = "#4400aa"; ctx.shadowBlur = 12+_connTier*6;
                ctx.beginPath(); ctx.moveTo(px,y1); ctx.lineTo(pbpx,y2); ctx.stroke();
                const _fluxParts = 7 + _connTier*3;
                ctx.fillStyle = "#9922ff"; ctx.shadowBlur = 7+_connTier*3;
                for (let s = 0; s < _fluxParts; s++) {
                    const phase = frame*0.07+s*(Math.PI*2/_fluxParts);
                    const r = (10+Math.sin(phase*2)*4)*(1+_connTier*0.2);
                    ctx.globalAlpha = Math.min(0.9,(0.55+_ncPulse*0.3)*_connBoost);
                    ctx.beginPath(); ctx.arc(midx+Math.cos(phase)*r, midy+Math.sin(phase)*r*0.5, 2.5+_connTier*0.5, 0, Math.PI*2); ctx.fill();
                }
                ctx.shadowBlur = 0;

            } else if (el === "toxic") {
                ctx.globalAlpha = Math.min(0.85,(0.2+_ncPulse*0.12)*_connBoost);
                ctx.strokeStyle = "#44cc44"; ctx.lineWidth = 14+_connTier*4;
                ctx.shadowColor = "#22aa22"; ctx.shadowBlur = 10+_connTier*5;
                ctx.beginPath(); ctx.moveTo(px,y1); ctx.lineTo(pbpx,y2); ctx.stroke();
                ctx.shadowBlur = 0;
                const blobs = 8+_connTier*3;
                for (let s = 0; s < blobs; s++) {
                    const t = (s+Math.sin(frame*0.04+s)*0.3)/blobs;
                    const bx = px+(pbpx-px)*t, by = y1+(y2-y1)*t;
                    const br = (4+Math.sin(frame*0.08+s*0.9)*2)*(1+_connTier*0.3);
                    ctx.globalAlpha = Math.min(0.85,(0.3+_ncPulse*0.2)*_connBoost);
                    const grad = ctx.createRadialGradient(bx,by,0,bx,by,br*3);
                    grad.addColorStop(0,"rgba(80,200,80,0.5)"); grad.addColorStop(1,"rgba(40,120,40,0)");
                    ctx.fillStyle = grad;
                    ctx.beginPath(); ctx.arc(bx,by,br*3,0,Math.PI*2); ctx.fill();
                }

            } else if (el === "core") {
                ctx.globalAlpha = Math.min(0.85,(0.25+_ncPulse*0.15)*_connBoost);
                ctx.strokeStyle = "#00ccaa"; ctx.lineWidth = 10+_connTier*3;
                ctx.shadowColor = "#00aa88"; ctx.shadowBlur = 14+_connTier*6;
                ctx.beginPath(); ctx.moveTo(px,y1); ctx.lineTo(pbpx,y2); ctx.stroke();
                ctx.shadowBlur = 0;
                const ripples = 5+_connTier*2;
                for (let s = 1; s <= ripples; s++) {
                    const t = ((s/ripples)+frame*0.01)%1;
                    const rx = px+(pbpx-px)*t, ry = y1+(y2-y1)*t;
                    ctx.globalAlpha = Math.min(0.9,(1-t)*0.5*_ncPulse*_connBoost);
                    ctx.strokeStyle = "#00ffcc"; ctx.lineWidth = 1.5+_connTier*0.5;
                    ctx.shadowColor = "#00ccaa"; ctx.shadowBlur = 6+_connTier*3;
                    ctx.beginPath(); ctx.arc(rx,ry,(5+t*12)*(1+_connTier*0.15),0,Math.PI*2); ctx.stroke();
                }
                ctx.shadowBlur = 0;

            } else {
                ctx.globalAlpha = 0.5+_ncPulse*0.3;
                ctx.strokeStyle = col; ctx.lineWidth = 2+_ncPulse*2; ctx.setLineDash([6,4]);
                ctx.beginPath(); ctx.moveTo(px,y1); ctx.lineTo(pbpx,y2); ctx.stroke();
                ctx.setLineDash([]);
            }

            ctx.restore();
        });
    }

    // ── ENVIRONMENTAL HAZARDS ──
    if (environmentalHazards.length === 0 && gameState.running) spawnHazardsForDay();
    drawHazards();

    // ── HUD TEXT ──
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle="#fff"; ctx.font="13px monospace";
    ctx.fillText("Phase: "+gameState.phase, 230, 58);
    ctx.fillText("Reds: "+redsRemainingInExploredZones(), 230, 74);
    if (gameState.phase==="night") {
        ctx.fillStyle="#f22";
        ctx.fillText("Predators left: "+nightPredatorsRemaining, 230, 90);
    }
    ctx.restore();

    // ── NETWORK STATUS HUD ──
    drawNetworkStatusHUD();

    // ── SMOKE ──
    // Smoke is stored as world anchor (wx,wy) + screen offset (ox,oy) so particles
    // stay fixed to their vent position regardless of camera movement.
    smoke.forEach((sm,i)=>{
        sm.ox+=sm.vox; sm.oy+=sm.voy; sm.life-=0.025; sm.size+=0.25;
        if(sm.life<=0){smoke.splice(i,1);return;}
        const bpx=(sm.wx-player.visualX-(sm.wy-player.visualY))*TILE_W+canvas.width/2;
        const bpy=(sm.wx-player.visualX+(sm.wy-player.visualY))*TILE_H+canvas.height/2;
        ctx.save(); ctx.globalAlpha=sm.life; ctx.fillStyle=cfg.smokeColor;
        ctx.beginPath(); ctx.ellipse(bpx+sm.ox,bpy+sm.oy,sm.size,sm.size*0.5,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
    });

    // ── FRAGMENTS ──
    fragments.forEach((f,i)=>{
        f.x+=f.vx; f.y+=f.vy; f.vy+=0.5; f.life-=0.02;
        ctx.fillStyle=f.col; ctx.globalAlpha=f.life; ctx.fillRect(f.x,f.y,6,6);
        if(f.life<=0) fragments.splice(i,1);
    });
    ctx.globalAlpha=1;

    // ── RESPAWN QUEUE ──
    for(let i=respawnQueue.length-1;i>=0;i--) {
        const entry=respawnQueue[i]; entry.timer--;
        if(entry.timer<=0){
            if (entry.isClone && entry.speciesName) {
                // Respawn as clone
                const speciesDef = SPECIES[entry.speciesName];
                const classDef   = speciesDef[entry.className];
                const def = {
                    width:     classDef.width,
                    height:    classDef.height,
                    moveSpeed: classDef.moveSpeed,
                    health:    classDef.health,
                    power:     classDef.power,
                    color:     speciesDef.color
                };
                const clone = new Predator(entry.className, def, crystal.x, crystal.y);
                clone.state       = "wander";
                clone.wanderTimer = 0;
                clone.team        = "green";
                clone.isClone     = true;
                clone.speciesName = entry.speciesName;
                clone.className   = entry.className;
                applySpeciesBody(clone, entry.speciesName);
                actors.push(clone);
            } else {
                // Respawn as regular follower — apply HP stat degradation
                const def         = NPC_TYPES["virus"];
                const personality = entry.personality || PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)];
                const stats       = applyPersonality(personality);
                if (entry.hpStat!==undefined) stats.hp = entry.hpStat;
                const role        = assignRole(stats);
                const hp          = entry.ghostphageLife ? 1 : stats.hp;
                const npc = {
                    type:"virus", element:entry.element, x:crystal.x, y:crystal.y, team:"green",
                    health: hp, maxHealth: hp,
                    moveSpeed: def.moveSpeed + (stats.speed - 10) * 0.001,
                    power: stats.attack,
                    stats, personality, role,
                    currentResonance: 0,
                    currentWill: stats.will,
                    walkCycle:0, moveCooldown:0, stance:"follow", isFollower:true, isHealing:false,
                    hitFlash:0, dead:false, attackAnim:0, state:"idle",
                    combatTrait:entry.combatTrait, naturalTrait:entry.naturalTrait, perk:entry.perk,
                    ghostphageLife: entry.ghostphageLife||false
                };
                actors.push(npc); followers.push(npc);
                if(!followerByElement[entry.element]) followerByElement[entry.element]=[];
                followerByElement[entry.element].push(npc);
            }
            respawnQueue.splice(i,1);
        }
    }

    // ── FOLLOWER PROJECTILES ──
    followerProjectiles = followerProjectiles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life--;
        // Screen coords
        const sx=(p.x-player.visualX-(p.y-player.visualY))*TILE_W+canvas.width/2;
        const sy=(p.x-player.visualX+(p.y-player.visualY))*TILE_H+canvas.height/2 - 40;
        // Draw
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(sx, sy, p.radius||4, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
        // Hit detection
        let hit = false;
        actors.forEach(a => {
            if (hit || a.dead) return;
            const isTarget = p.targetsGreen
                ? a.team === "green"
                : (a.team==="red" || (a instanceof Predator && a.team!=="green" && !a.isClone));
            if (isTarget) {
                const dx=(p.x-a.x)*TILE_W, dy=(p.y-a.y)*TILE_H;
                if (Math.hypot(dx,dy) < 30) {
                    applyDamage(a, p.damage, p.source);
                    if (p.onHit) p.onHit(a);
                    hit = true;
                }
            }
        });
        // Predator abdomen shots can also hit the player directly
        if (!hit && p.targetsGreen) {
            const dx=(p.x-player.x)*TILE_W, dy=(p.y-player.y)*TILE_H;
            if (Math.hypot(dx,dy) < 30) {
                health = Math.max(0, health - p.damage);
                shake  = Math.max(shake, 5);
                if (p.onHit) p.onHit(null);
                hit = true;
            }
        }
        return !hit && p.life > 0;
    });

    ctx.restore();

    // ── OVERLAYS ──
    drawElementEffects();
    drawFloatingTexts();
    drawCrystalButton();
    drawClonesBlob();
    drawCloneMenu();
    drawRadialMenu();
    drawCrystalPanel();
    drawHoldLine();
    drawGestureFeedback();
    drawFollowerElementUI();
    drawElementPicker();
    drawInfoPanel();
    updatePreview();

    requestAnimationFrame(render);
}

// ─────────────────────────────────────────────────────────
//  NETWORK STATUS HUD
//  Shows active element networks, their tier, and integrity
// ─────────────────────────────────────────────────────────
function drawNetworkStatusHUD() {
    const activeEls = ELEMENTS.filter(e => (networkStrength[e.id]||0) > 0);
    if (activeEls.length === 0) return;

    ctx.save(); ctx.setTransform(1,0,0,1,0,0);

    const ROW_H   = 24;
    const PAD     = 8;
    const W       = 148;
    const HEADER  = 16;
    const H       = HEADER + activeEls.length * ROW_H + PAD;
    const X       = canvas.width - W - 8;
    const Y       = 75;

    // Panel background
    ctx.fillStyle   = "rgba(0,0,8,0.72)";
    ctx.strokeStyle = "rgba(0,255,136,0.22)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(X, Y, W, H, 4);
    else               ctx.rect(X, Y, W, H);
    ctx.fill(); ctx.stroke();

    // Header
    ctx.fillStyle = "#0f8"; ctx.font = "bold 9px monospace"; ctx.textAlign = "left";
    ctx.fillText("◈ NETWORK RESONANCE", X + PAD, Y + 11);

    // Tier label lookup
    const TIER_LABEL  = ["", "I", "II", "III"];
    const TIER_COLOR  = ["", "#888888", "#aaddff", "#ffd700"];

    // Per-element rows
    activeEls.forEach((elDef, i) => {
        const el        = elDef.id;
        const tier      = networkStrength[el] || 0;
        const integrity = networkIntegrity[el] || 0;
        const ry        = Y + HEADER + i * ROW_H;

        // Element glow dot
        ctx.shadowColor = elDef.color; ctx.shadowBlur = 8;
        ctx.fillStyle   = elDef.color;
        ctx.beginPath(); ctx.arc(X + PAD + 4, ry + 8, 4, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur  = 0;

        // Element name
        ctx.fillStyle = elDef.color; ctx.font = "bold 9px monospace"; ctx.textAlign = "left";
        ctx.fillText(elDef.label, X + PAD + 14, ry + 12);

        // Effect description per tier
        const EFFECT_DESC = {
            fire:     ["","burn","heavy burn","ignite spread"],
            electric: ["","resonance+","res+ult boost","max resonance"],
            ice:      ["","slow","heavy slow","deep freeze"],
            flux:     ["","pull","chain pull","vortex dmg"],
            core:     ["","shield","fast shield","regen shield"],
            toxic:    ["","corrode","shred+","plague cloud"]
        };
        const desc = EFFECT_DESC[el]?.[tier] || "";
        ctx.fillStyle = "#888"; ctx.font = "7px monospace";
        ctx.fillText(desc, X + PAD + 14, ry + 21);

        // Tier badge
        ctx.fillStyle = TIER_COLOR[tier] || "#888"; ctx.font = "bold 10px monospace"; ctx.textAlign = "right";
        ctx.fillText("T" + TIER_LABEL[tier], X + W - PAD, ry + 12);

        // Seasoned indicator (star per level)
        const pylSeasoned = _wPylons.filter(p => p.attackModeElement===el && p.seasoned>0);
        if (pylSeasoned.length > 0) {
            const maxS = Math.max(...pylSeasoned.map(p=>p.seasoned||0));
            ctx.fillStyle = "#ffd700"; ctx.font = "8px monospace";
            ctx.fillText("★".repeat(Math.min(maxS,3)), X + W - PAD, ry + 22);
        }

        // Integrity bar (full row width)
        const bX = X + PAD, bY = ry + ROW_H - 5, bW = W - PAD*2, bH = 2;
        ctx.fillStyle = "rgba(255,255,255,0.08)"; ctx.fillRect(bX, bY, bW, bH);
        ctx.fillStyle = elDef.color; ctx.globalAlpha = 0.6;
        ctx.fillRect(bX, bY, bW * (integrity/100), bH);
        ctx.globalAlpha = 1;
    });

    // Hint when any tier < 3 (nudge player to extend)
    const maxTier = Math.max(0, ...activeEls.map(e => networkStrength[e.id]||0));
    if (maxTier < 3) {
        const needed = maxTier === 0 ? 2 : maxTier === 1 ? 4 : 6;
        ctx.fillStyle = "rgba(160,160,160,0.5)"; ctx.font = "7px monospace"; ctx.textAlign = "center";
        ctx.fillText(`Add pylons → Tier ${maxTier+1} (need ${needed})`, X + W/2, Y + H - 3);
    }

    ctx.restore();
}

