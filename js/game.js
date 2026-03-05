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
    ctx.save();
    if (shake>0) { ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake); shake*=0.9; }

    // ── CAMERA FOLLOW ──
    player.x+=(player.targetX-player.x)*cfg.playerSpeed;
    player.y+=(player.targetY-player.y)*cfg.playerSpeed;
    player.visualX+=(player.x-player.visualX)*0.15;
    player.visualY+=(player.y-player.visualY)*0.15;

    // ── UPDATE HAZARDS ──
    updateHazards();

    // ── UPDATE ACTORS ──
    actors.forEach(a=>updateNPC(a));

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
                // Start or tick respawn timer
                if (!zoneRespawnTimers[z]) zoneRespawnTimers[z] = 0;
                if (zoneRespawnTimers[z] > 0) {
                    zoneRespawnTimers[z]--;
                } else {
                    spawnPredatorForZone(z);
                    zoneRespawnTimers[z] = 180; // 3 sec respawn delay
                }
            }
        }
    }

    // ── WAVE FUNCTION PYLONS — connect same-element pylons within 5 tiles, apply zone effects ──
    const WAVE_CONNECT_RANGE = 5.0;
    const wavePylons = world.filter(t=>t.pillar&&!t.destroyed&&t.waveMode&&t.attackModeElement);

    // Draw connections and apply effects between pairs
    const processed = new Set();
    wavePylons.forEach(pa=>{
        wavePylons.forEach(pb=>{
            if (pa===pb) return;
            const key = [pa,pb].map(p=>p.x+","+p.y).sort().join("|");
            if (processed.has(key)) return;
            if (pa.attackModeElement !== pb.attackModeElement) return;
            const dist = Math.hypot(pa.x-pb.x, pa.y-pb.y);
            if (dist > WAVE_CONNECT_RANGE) return;
            processed.add(key);

            const el = pa.attackModeElement;
            const col = pa.attackModeColor || "#0f8";
            const midX = (pa.x+pb.x)*0.5, midY = (pa.y+pb.y)*0.5;

            // Spawn periodic zone effect particles
            if (frame % 20 === 0) {
                const t = Math.random();
                const ex = pa.x + (pb.x-pa.x)*t, ey = pa.y + (pb.y-pa.y)*t;
                elementEffects.push({type:"impact",x:ex,y:ey,color:col,radius:0.3,life:25,element:el});
            }

            // Apply zone effects to actors in the connection corridor (within 1.5 tiles of line)
            actors.forEach(a=>{
                if (!a||a.dead) return;
                // Distance from point to line segment pa→pb
                const lx=pb.x-pa.x, ly=pb.y-pa.y, len2=lx*lx+ly*ly;
                let t2 = len2>0 ? ((a.x-pa.x)*lx+(a.y-pa.y)*ly)/len2 : 0;
                t2=Math.max(0,Math.min(1,t2));
                const cx2=pa.x+t2*lx, cy2=pa.y+t2*ly;
                const lineDist = Math.hypot(a.x-cx2, a.y-cy2);
                if (lineDist > 1.5) return;

                const isEnemy = (a.team==="red"||(a instanceof Predator&&a.team!=="green"&&!a.isClone));
                const isFriend = (a.team==="green"||a.isClone||a.isFollower);

                switch(el) {
                    case "fire":
                        if (isEnemy && frame%30===0) applyDamage(a, 2, null, "fire");
                        break;
                    case "ice":
                        if (isEnemy) { a.slowed=40; a.slowFactor=0.35; }
                        break;
                    case "electric":
                        if (isFriend && frame%10===0) {
                            a.currentResonance = Math.min(100,(a.currentResonance||0)+2);
                        }
                        break;
                    case "core":
                        if (isFriend && frame%60===0) {
                            a.shielded=true;
                            a.shieldAmount=Math.min(20,(a.shieldAmount||0)+3);
                        }
                        break;
                    case "flux":
                        if (isEnemy) {
                            // Pull toward midpoint of connection
                            const dx=midX-a.x, dy=midY-a.y, d=Math.hypot(dx,dy)||1;
                            a.x+=dx/d*0.04; a.y+=dy/d*0.04;
                        }
                        break;
                    case "toxic":
                        if (isEnemy && frame%40===0) {
                            applyDamage(a, 1.5, null, "toxic");
                            if (Math.random()<0.3) { a.defenseShredded=90; a.defenseShredFactor=0.6; }
                        }
                        break;
                }
            });
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
            if (isFriend && frame%60===0) {
                a.shielded=true;
                a.shieldAmount=Math.min(30,(a.shieldAmount||0)+5);
            }
        });
    }

    // ── ATTACK MODE PYLON — fire missiles at nearby enemies ──
    world.forEach(t=>{
        if (!t.pillar||t.destroyed||!t.attackMode) return;
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
            respawnQueue.push({ element:a.element, combatTrait:a.combatTrait, naturalTrait:a.naturalTrait, perk:a.perk, personality:a.personality, timer:180, isClone:a.isClone||false, speciesName:a.speciesName, className:a.className });
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
    followers=followers.filter(a=>!a.dead&&a.team==="green");
    rebuildFollowerTable();

    // ── PENDING PILLAR DESTRUCTION ──
    pendingPillarDestruction.forEach(p=>{
        if(p.destroyed)return; p.destroyed=true;
        for(let i=0;i<6;i++) shards.push({x:p.x,y:p.y,z:1+Math.random(),vz:-0.05-Math.random()*0.05,color:p.pillarCol});
    });
    pendingPillarDestruction.length=0;
    world.forEach(obj=>{ if(obj.pendingDestroy){pendingPillarDestruction.push(obj);obj.pendingDestroy=false;} });

    // ── UPGRADED PYLON PULSE ──
    world.forEach(t=>{
        if(!t.pillar||!t.upgraded||t.destroyed)return;
        t.pulseTimer++;
        if(t.pulseTimer>120){ t.pulseTimer=0; actors.forEach(a=>{ if(a.team==="green"){const dx=a.x-t.x,dy=a.y-t.y,dist=Math.sqrt(dx*dx+dy*dy); if(dist<3.5) a.health=Math.min(a.maxHealth,a.health+2);} }); }
    });

    // ── PILLAR HEALING ──
    actors.forEach(actor=>{
        world.forEach(t=>{
            if(!t.pillar||t.destroyed)return;
            if((actor.team==="green"&&t.pillarCol!=="#0f8")||(actor.team==="red"&&t.pillarCol!=="#f22"))return;
            const dx=t.x-actor.x,dy=t.y-actor.y,dist=Math.sqrt(dx*dx+dy*dy);
            if(dist<1.2) actor.health=Math.min(actor.maxHealth,actor.health+0.05);
        });
    });

    // ── CONTESTED SIPHON CONVERSION ──
    if(latchedPillar&&latchedPillar.pillarTeam==="red"&&latchedPillar.converting) {
        actors.forEach(a=>{ if(a.team!=="red")return; const dx=a.x-latchedPillar.x,dy=a.y-latchedPillar.y; if(Math.sqrt(dx*dx+dy*dy)<1.2) convertNPC(a,"green"); });
    }

    updateShards();
    updateStatusEffects();
    updateElementEffects();
    updateFloatingTexts();

    // ── SIPHON SYSTEM ──
    if (!latchedPillar) {
        let best=null,bd=Infinity;
        world.forEach(obj=>{ if(!obj.pillar||obj.destroyed)return; const dx=obj.x-player.x,dy=obj.y-player.y,d=Math.sqrt(dx*dx+dy*dy); if(d<1.6&&d<bd){bd=d;best=obj;} });
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

    // ── FIRE WALL LIFETIME ──
    world=world.filter(obj=>{ if(obj.type==="fireWall"){obj.life--;return obj.life>0;} return true; });

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
    let drawList=world.filter(t=>Math.abs(t.x-player.visualX)<RENDER_DIST);
    drawList.push({type:'player',x:player.visualX,y:player.visualY});
    shards.forEach(s=>drawList.push({type:'shard',x:s.x,y:s.y,shard:s}));
    actors.forEach(a=>drawList.push({type:'npc',x:a.x,y:a.y,actor:a}));
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
        else if (obj.type==='crystal') {
            // Crystal glow pulse
            const pulse=0.7+0.3*Math.sin(frame*0.05);
            const hpR=crystal.health/crystal.maxHealth;
            const crystalCol=hpR>0.5?"#44f":hpR>0.2?"#f80":"#f22";
            ctx.shadowColor=crystalCol; ctx.shadowBlur=20*pulse;
            ctx.fillStyle=crystalCol;
            ctx.beginPath(); ctx.arc(px,py-60,28,0,Math.PI*2); ctx.fill();
            ctx.fillStyle="#aaf";
            ctx.beginPath(); ctx.arc(px,py-60,16,0,Math.PI*2); ctx.fill();
            ctx.shadowBlur=0;
            drawHealthBar(px-25,py-90,50,7,crystal.health,crystal.maxHealth);
            // Low health warning flash
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
            ctx.fillStyle=`rgb(${15*amb},${(20*amb)+(120*glo)},${(30*amb)+(60*glo)})`;
            ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+TILE_W,py+TILE_H); ctx.lineTo(px,py+TILE_W); ctx.lineTo(px-TILE_W,py+TILE_H); ctx.fill();

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

            // Wave function pylon connection lines
            if (obj.pillar&&!obj.destroyed&&obj.waveMode&&obj.attackModeElement) {
                const wavePylonsLocal = world.filter(t=>t.pillar&&!t.destroyed&&t.waveMode&&t.attackModeElement);
                const WCR = 5.0;
                const col2 = obj.attackModeColor||"#0f8";
                wavePylonsLocal.forEach(pb=>{
                    if (pb===obj||pb.attackModeElement!==obj.attackModeElement) return;
                    if (Math.hypot(obj.x-pb.x,obj.y-pb.y)>WCR) return;
                    // Only draw once per pair
                    if (pb.x+pb.y*1000 < obj.x+obj.y*1000) return;
                    const pbpx=(pb.x-player.visualX-(pb.y-player.visualY))*TILE_W+canvas.width/2;
                    const pbpy=(pb.x-player.visualX+(pb.y-player.visualY))*TILE_H+canvas.height/2;
                    const pulse2=0.4+0.4*Math.sin(frame*0.1);
                    ctx.save(); ctx.globalAlpha=0.5+pulse2*0.3;
                    ctx.strokeStyle=col2; ctx.lineWidth=2+pulse2*2; ctx.setLineDash([6,4]);
                    ctx.beginPath(); ctx.moveTo(px,py-60); ctx.lineTo(pbpx,pbpy-60); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.restore();
                });
            }

            // Pillar
            if (obj.pillar&&!obj.destroyed&&typeof obj.health==="number"&&obj.health>0) {
                if(obj.converting){ctx.fillStyle="#ff0";}
                drawHealthBar(px-14,py-95,28,4,obj.health,obj.maxHealth);
                if (obj.waveMode) {
                    // ── WAVE FUNCTION MODE — glowing resonance tower ──
                    const wcol = obj.attackModeColor||"#0f8";
                    const wpulse = 0.5+0.5*Math.sin(frame*0.08+(obj.pulseTimer||0)*0.05);
                    obj.pulseTimer=(obj.pulseTimer||0)+1;
                    // Soft glow ring
                    ctx.save(); ctx.globalAlpha=0.12+wpulse*0.1; ctx.fillStyle=wcol;
                    ctx.beginPath(); ctx.arc(px,py-60,28+wpulse*6,0,Math.PI*2); ctx.fill(); ctx.restore();
                    // Slender column
                    ctx.fillStyle="#0a0a1a";
                    ctx.fillRect(px-10,py-110,20,140);
                    // Glowing orb at top
                    ctx.save(); ctx.shadowColor=wcol; ctx.shadowBlur=14+wpulse*10;
                    ctx.fillStyle=wcol; ctx.globalAlpha=0.7+wpulse*0.3;
                    ctx.beginPath(); ctx.arc(px,py-110,9,0,Math.PI*2); ctx.fill();
                    ctx.restore();
                    // Element label
                    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
                    ctx.fillStyle=wcol; ctx.font="9px monospace"; ctx.textAlign="center";
                    ctx.fillText((obj.attackModeElement||"").toUpperCase(),px,py-122);
                    ctx.restore();
                } else if (obj.attackMode) {
                    // ── ATTACK MODE — angular armed pylon ──
                    const acol = obj.attackModeColor || "#0f8";
                    const pulse = 0.5+0.5*Math.sin((frame+(obj.pulseTimer||0))*0.12);
                    obj.pulseTimer = (obj.pulseTimer||0)+1;
                    // Glowing range ring
                    ctx.save(); ctx.globalAlpha=0.08+pulse*0.08; ctx.strokeStyle=acol; ctx.lineWidth=2;
                    ctx.beginPath(); ctx.arc(px,py-40,obj.attackRange*TILE_W*0.5,0,Math.PI*2); ctx.stroke(); ctx.restore();
                    // Body — dark armored column
                    ctx.fillStyle="#111";
                    ctx.fillRect(px-16,py-95,32,125);
                    // Armor panels
                    ctx.fillStyle="#222";
                    ctx.fillRect(px-18,py-95,4,125);
                    ctx.fillRect(px+14,py-95,4,125);
                    // Glowing barrel nub at top
                    ctx.save(); ctx.shadowColor=acol; ctx.shadowBlur=8+pulse*6;
                    ctx.fillStyle=acol;
                    ctx.beginPath(); ctx.arc(px,py-95,7,0,Math.PI*2); ctx.fill();
                    ctx.restore();
                    // Element color stripe
                    ctx.fillStyle=acol; ctx.globalAlpha=0.4;
                    ctx.fillRect(px-3,py-90,6,80);
                    ctx.globalAlpha=1;
                } else if(obj.upgraded){
                    ctx.save(); ctx.globalAlpha=0.2; ctx.fillStyle="#0f8";
                    ctx.beginPath(); ctx.arc(px,py-85,20,0,Math.PI*2); ctx.fill(); ctx.restore();
                    ctx.fillStyle="#055"; ctx.fillRect(px-18,py-100,36,130);
                    ctx.fillStyle="#0f8"; ctx.beginPath(); ctx.arc(px,py-100,6,0,Math.PI*2); ctx.fill();
                } else {
                    const dist2=Math.sqrt((obj.x-player.visualX)**2+(obj.y-player.visualY)**2);
                    const amb2=Math.max(0.1,0.8-dist2/RENDER_DIST), glo2=Math.max(0,1.0-dist2/5);
                    ctx.fillStyle=`rgb(${25*amb2},${(35*amb2)+(120*glo2)},${60*amb2})`;
                    ctx.fillRect(px-14,py-85,28,115);
                    ctx.fillStyle=obj.pillarCol;
                    ctx.beginPath(); ctx.arc(px,py-85,4,0,7); ctx.fill();
                }
            }
        }
        else {
            // wall lighting based on distance
const dist = Math.sqrt(
    (obj.x - player.visualX) ** 2 +
    (obj.y - player.visualY) ** 2
);

const amb = Math.max(0.1, 0.8 - dist / RENDER_DIST);
const glo = Math.max(0, 1.0 - dist / 5);

// check wall type
const isFront = obj.type === TILE.WALL_FRONT;

// choose wall direction
let bx;
let dir;

if (isFront) {
    bx = px + TILE_W / 2;
    dir = -1;
} else {
    bx = px - TILE_W / 2;
    dir = 1;
}

// wall color
const r = (isFront ? 10 : 15) * amb;
const g = ((isFront ? 15 : 20) * amb) + (160 * glo);
const b = ((isFront ? 20 : 40) * amb) + (40 * glo);

ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

// draw wall shape
ctx.beginPath();
ctx.moveTo(bx, py + TILE_H);
ctx.lineTo(bx + (34 * dir), py + 15);
ctx.lineTo(bx + (34 * dir), py + 15 - obj.h);
ctx.lineTo(bx, py - obj.h);
ctx.fill();
        }
    });

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

    // ── SMOKE ──
    smoke.forEach((sm,i)=>{
        sm.x+=sm.vx; sm.y+=sm.vy; sm.life-=0.025; sm.size+=0.25;
        if(sm.life<=0){smoke.splice(i,1);return;}
        ctx.save(); ctx.globalAlpha=sm.life; ctx.fillStyle=cfg.smokeColor;
        ctx.beginPath(); ctx.ellipse(sm.x,sm.y,sm.size,sm.size*0.5,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
    });

    // ── PROJECTILES ──
    projectiles.forEach((p,i)=>{
        p.x+=p.vx; p.y+=p.vy;
        const sx=(p.x-player.visualX-(p.y-player.visualY))*TILE_W+canvas.width/2;
        const sy=(p.x-player.visualX+(p.y-player.visualY))*TILE_H+canvas.height/2;
        ctx.fillStyle="#fff"; ctx.beginPath(); ctx.arc(sx,sy-40,5,0,7); ctx.fill();
        let t=getTile(Math.round(p.x),Math.round(p.y));
        if(t&&t.pillar&&!t.destroyed){
            if(!t.upgraded&&t.health<=0) t.destroyed=true;
            for(let k=0;k<6;k++) shards.push({x:t.x,y:t.y,z:1+Math.random(),vz:-0.05-Math.random()*0.05,color:t.pillarCol});
            projectiles.splice(i,1); shake=8;
            for(let j=0;j<6;j++) fragments.push({x:sx,y:sy-40,vx:(Math.random()-0.5)*10,vy:-Math.random()*10,life:1,col:t.pillarCol});
        }
        if(p.life--<0) projectiles.splice(i,1);
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
                // Respawn as regular follower
                const def         = NPC_TYPES["virus"];
                const personality = entry.personality || PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)];
                const stats       = applyPersonality(personality);
                const role        = assignRole(stats);
                const npc = {
                    type:"virus", element:entry.element, x:crystal.x, y:crystal.y, team:"green",
                    health: stats.hp, maxHealth: stats.hp,
                    moveSpeed: def.moveSpeed + (stats.speed - 10) * 0.001,
                    power: stats.attack,
                    stats, personality, role,
                    currentResonance: 0,
                    currentWill: stats.will,
                    walkCycle:0, moveCooldown:0, stance:"follow", isFollower:true, isHealing:false,
                    hitFlash:0, dead:false,
                    combatTrait:entry.combatTrait, naturalTrait:entry.naturalTrait, perk:entry.perk
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
            if (a.team==="red" || (a instanceof Predator && a.team!=="green" && !a.isClone)) {
                const dx=(p.x-a.x)*TILE_W, dy=(p.y-a.y)*TILE_H;
                if (Math.hypot(dx,dy) < 30) {
                    applyDamage(a, p.damage, p.source);
                    if (p.onHit) p.onHit(a);
                    hit = true;
                }
            }
        });
        return !hit && p.life > 0;
    });

    ctx.restore();

    // ── OVERLAYS ──
    drawElementEffects();
    drawFloatingTexts();
    drawCloneMenu();
    drawRadialMenu();
    drawFollowerElementUI();
    updatePreview();

    requestAnimationFrame(render);
}
