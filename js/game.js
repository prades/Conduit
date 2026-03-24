// ─────────────────────────────────────────────────────────
//  FOLLOWER PROJECTILE RENDERING (element-specific visuals)
// ─────────────────────────────────────────────────────────
function _drawFollowerProjectile(ctx, p, sx, sy) {
    const r = p.radius || 4;
    const el = p.element;
    const f  = p.frame || 0;

    // Apply parabolic arc height for bomb-style projectiles
    if (p.arcData && p.arcData.screenOffset) {
        sy -= p.arcData.screenOffset;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (el === 'fire') {
        // Fireball — flickering orange/red core with white-hot centre
        const flicker = 1 + Math.sin(f * 0.45) * 0.14;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.6 * flicker);
        grad.addColorStop(0,   '#ffffff');
        grad.addColorStop(0.18,'#ffee44');
        grad.addColorStop(0.45,'#ff6600');
        grad.addColorStop(0.75,'#cc2200');
        grad.addColorStop(1,   'rgba(160,0,0,0)');
        ctx.shadowColor = '#ff5500';
        ctx.shadowBlur  = 20;
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2.6 * flicker, 0, Math.PI * 2);
        ctx.fill();
        // bright inner core
        ctx.shadowBlur  = 6;
        ctx.fillStyle   = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, r * 0.55, 0, Math.PI * 2);
        ctx.fill();

    } else if (el === 'electric') {
        // Electric orb — yellow-green with radiating arc spikes
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.2);
        grad.addColorStop(0,   '#ffffff');
        grad.addColorStop(0.25,'#eeff44');
        grad.addColorStop(0.65,'#aacc00');
        grad.addColorStop(1,   'rgba(100,200,0,0)');
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur  = 16;
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2.2, 0, Math.PI * 2);
        ctx.fill();
        // arc spikes
        ctx.shadowBlur  = 8;
        ctx.strokeStyle = 'rgba(255,255,180,0.9)';
        ctx.lineWidth   = 1.5;
        for (let i = 0; i < 5; i++) {
            const ang = f * 0.18 + i * (Math.PI * 2 / 5);
            const len = r * (1.8 + Math.sin(f * 0.35 + i * 1.3) * 0.6);
            ctx.beginPath();
            ctx.moveTo(sx + Math.cos(ang) * r * 0.6, sy + Math.sin(ang) * r * 0.6);
            ctx.lineTo(sx + Math.cos(ang) * len * 2,  sy + Math.sin(ang) * len * 2);
            ctx.stroke();
        }

    } else if (el === 'ice') {
        // Ice crystal — six-pointed frost shard
        ctx.shadowColor = '#aaeeff';
        ctx.shadowBlur  = 14;
        ctx.fillStyle   = 'rgba(180,230,255,0.85)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1;
        const spikes = 6;
        for (let i = 0; i < spikes; i++) {
            const ang  = (i / spikes) * Math.PI * 2 + f * 0.025;
            const tip  = r * 2.4;
            const base = r * 0.75;
            const bAng = Math.PI / spikes;
            ctx.beginPath();
            ctx.moveTo(sx + Math.cos(ang) * tip,            sy + Math.sin(ang) * tip);
            ctx.lineTo(sx + Math.cos(ang + bAng) * base,    sy + Math.sin(ang + bAng) * base);
            ctx.lineTo(sx + Math.cos(ang - bAng) * base,    sy + Math.sin(ang - bAng) * base);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        // core
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 1.1);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#99ddff');
        grad.addColorStop(1,   '#2288bb');
        ctx.shadowBlur  = 8;
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 1.1, 0, Math.PI * 2);
        ctx.fill();

    } else if (el === 'flux') {
        // Black hole — void centre, bright purple event horizon, rotating distortion arcs
        const grad = ctx.createRadialGradient(sx, sy, r * 0.4, sx, sy, r * 3.2);
        grad.addColorStop(0,   '#000000');
        grad.addColorStop(0.35,'#330066');
        grad.addColorStop(0.6, '#7722cc');
        grad.addColorStop(0.85,'#9933ff');
        grad.addColorStop(1,   'rgba(80,0,180,0)');
        ctx.shadowColor = '#aa44ff';
        ctx.shadowBlur  = 22;
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        // event horizon ring
        ctx.shadowBlur  = 10;
        ctx.strokeStyle = '#dd88ff';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 1.7, 0, Math.PI * 2);
        ctx.stroke();
        // rotating distortion arcs
        for (let i = 0; i < 3; i++) {
            const ang = f * 0.09 + i * (Math.PI * 2 / 3);
            ctx.strokeStyle = `rgba(200,100,255,${0.35 + i * 0.12})`;
            ctx.lineWidth   = 1;
            ctx.shadowBlur  = 4;
            ctx.beginPath();
            ctx.arc(sx, sy, r * (2.1 + i * 0.35), ang, ang + Math.PI * 1.1);
            ctx.stroke();
        }
        // pure black void centre
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = '#000000';
        ctx.beginPath();
        ctx.arc(sx, sy, r * 0.75, 0, Math.PI * 2);
        ctx.fill();

    } else if (el === 'core') {
        // Energy orb — teal with rotating hexagon shield ring
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.2);
        grad.addColorStop(0,   '#ffffff');
        grad.addColorStop(0.28,'#44ffdd');
        grad.addColorStop(0.65,'#00aaaa');
        grad.addColorStop(1,   'rgba(0,140,120,0)');
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur  = 18;
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2.2, 0, Math.PI * 2);
        ctx.fill();
        // rotating hexagon ring
        ctx.shadowBlur  = 6;
        ctx.strokeStyle = 'rgba(180,255,240,0.9)';
        ctx.lineWidth   = 1.5;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(f * 0.06);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2;
            i === 0
                ? ctx.moveTo(Math.cos(ang) * r * 1.9, Math.sin(ang) * r * 1.9)
                : ctx.lineTo(Math.cos(ang) * r * 1.9, Math.sin(ang) * r * 1.9);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

    } else if (el === 'toxic') {
        if (p.isBomb) {
            // Smoke grenade — dark canister tumbling through the air with a smoke trail
            ctx.shadowColor = '#55ff22';
            ctx.shadowBlur  = 10;
            // Canister body (rotates as it flies)
            const angle = f * 0.22;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(angle);
            ctx.fillStyle = '#2a5c18';
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 1.1, r * 1.7, 0, 0, Math.PI * 2);
            ctx.fill();
            // Dark band across middle
            ctx.fillStyle = '#1a3c0e';
            ctx.fillRect(-r * 1.1, -r * 0.28, r * 2.2, r * 0.56);
            ctx.restore();
            // Fuse spark
            ctx.fillStyle = '#ffee44';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur  = 8;
            ctx.beginPath();
            ctx.arc(sx, sy - r * 1.6, r * 0.45, 0, Math.PI * 2);
            ctx.fill();
            // Smoke trail puffs behind it
            ctx.shadowBlur = 0;
            for (let i = 0; i < 3; i++) {
                const pT  = ((f + i * 9) % 27) / 27;
                const pSx = sx + Math.sin(f * 0.2 + i * 1.2) * 5;
                const pSy = sy + pT * 22;
                ctx.globalAlpha = (1 - pT) * 0.38;
                ctx.fillStyle   = '#99cc77';
                ctx.beginPath();
                ctx.arc(pSx, pSy, r * (0.5 + pT * 0.9), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        } else {
        // Toxic bubble — wobbly translucent green sphere with highlight
        const wobble = 1 + Math.sin(f * 0.28) * 0.11;
        const grad = ctx.createRadialGradient(
            sx - r * 0.3, sy - r * 0.3, 0,
            sx, sy, r * 2.3 * wobble
        );
        grad.addColorStop(0,    '#ddffdd');
        grad.addColorStop(0.28, '#66ff44');
        grad.addColorStop(0.6,  '#22aa00');
        grad.addColorStop(0.85, '#115500');
        grad.addColorStop(1,    'rgba(0,50,0,0)');
        ctx.shadowColor = '#44ff00';
        ctx.shadowBlur  = 15;
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2.3 * wobble, 0, Math.PI * 2);
        ctx.fill();
        // specular highlight
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = 'rgba(200,255,200,0.35)';
        ctx.beginPath();
        ctx.arc(sx - r * 0.55, sy - r * 0.55, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        }

    } else {
        // Fallback — plain glowing circle (predator shots, unknown element)
        ctx.fillStyle  = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 10;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.shadowBlur = 0;
    ctx.restore();
}

// ─────────────────────────────────────────────────────────
//  MAIN RENDER / GAME LOOP
// ─────────────────────────────────────────────────────────
function render() {
    requestAnimationFrame(render); // schedule next frame first so the loop never stops
    if (!gameState.running) { return; } // skip all logic while paused (buy screen, game over)

    frame++;

    // ── BASTION FORM — crystal passive regen every ~10 sec (600 frames) ──
    if (activeCrystalBuild==="bastion_form" && frame % 600 === 0 && crystal && crystal.health > 0 && crystal.health < crystal.maxHealth) {
        crystal.health = Math.min(crystal.maxHealth, crystal.health + 3);
    }

    // ── LONG HOLD DETECT ──
    if (isPressing&&!longHoldFired&&!touchMoved) {
        if (performance.now()-pressStartTime>LONG_HOLD_MS) {
            longHoldFired=true; handleLongHold(pressX,pressY);
        }
    }

    // Health no longer decays naturally — use health pads to restore HP
    const hpPct=health/100;
    // ── HUD updates — only write DOM when values actually change (avoids layout thrashing) ──
    const _hpInt = Math.round(health);
    if (_hpInt !== _lastHpInt) {
        _lastHpInt = _hpInt;
        hpBar.style.width = health + "%";
        hpBar.style.background = hpPct > 0.6 ? "#0f8" : hpPct > 0.3 ? "#ff0" : "#f22";
    }

    // ── PLAYER STUN / DEATH ──
    if (player.stunned > 0) {
        player.stunned--;
    } else if (health <= 0) {
        player.stunned = 180; // 3 second stun
        health = 40;          // partial restore on respawn
        player.x = crystal.x + 2; player.y = crystal.y;
        player.targetX = player.x; player.targetY = player.y;
        player.visualX  = player.x; player.visualY  = player.y;
        floatingTexts.push({x:canvas.width/2, y:canvas.height/2-60, text:"◈ STUNNED!", color:"#ff4444", life:120, vy:-0.25, size:14});
        shake = Math.max(shake, 8);
    }

    // ── PLAYER ATTACK COOLDOWN ──
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (shardCount !== _lastShardCount) {
        _lastShardCount = shardCount;
        shardUI.textContent = "Shards: " + shardCount;
    }
    // Zone indicator — cached element, update only on zone change
    const _pz = getZoneIndex(Math.floor(player.x));
    if (_pz !== _lastZoneIndex) {
        _lastZoneIndex = _pz;
        if (!_zoneEl) _zoneEl = document.getElementById("zoneInfo");
        if (_zoneEl) _zoneEl.textContent = _pz === 0 ? "Zone: Home" : "Zone: " + _pz;
    }
    // Health pad HUD — show pad count and total charges
    {
        const _padKey = healthPads.length + ":" + healthPads.reduce((s,p)=>s+p.charges,0);
        if (_padKey !== _lastPadHudKey) {
            _lastPadHudKey = _padKey;
            if (!_padHudEl) _padHudEl = document.getElementById("padHud");
            if (_padHudEl) {
                if (healthPads.length > 0) {
                    const tc = healthPads.reduce((s,p)=>s+p.charges,0);
                    _padHudEl.textContent = `PAD: ${healthPads.length} (${tc}c)`;
                    _padHudEl.style.display = "block";
                } else {
                    _padHudEl.style.display = "none";
                }
            }
        }
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
        // ── WALL PANEL MAP — for wall-face panel rendering ──
        _wallPanelMap = new Map();
        _wallPanelCache = [];
        _capturableNodeCache = [];
        world.forEach(t => {
            if (t.nodeType === 'wall_panel') {
                _wallPanelMap.set(Math.round(t.x), t);
                if (!t.panelActivated) _wallPanelCache.push(t);
            }
            if (t.capturable) _capturableNodeCache.push(t);
        });

        // ── TERRITORY — recalculate every 60 frames ──
        updateTerritory();

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
                        if (!visited.has(other) && Math.hypot(cur.x-other.x, cur.y-other.y) <= getPylonRange())
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
        // Build a spanning forest per element using union-find: pylons can have
        // multiple connections (chains are fine) but a connection is skipped when
        // the two pylons are already reachable through the graph, preventing
        // cross-connecting meshes and redundant triangle shortcuts.
        _wPylonPairs = [];
        const _ufParent = new Map();
        const _ufFind = p => { let r = p; while (_ufParent.get(r) !== r) r = _ufParent.get(r); while (_ufParent.get(p) !== r) { const n = _ufParent.get(p); _ufParent.set(p, r); p = n; } return r; };
        const _ufUnion = (a, b) => { _ufParent.set(_ufFind(a), _ufFind(b)); };
        _wPylons.forEach(p => _ufParent.set(p, p));

        // Collect all candidate pairs sorted closest-first so natural neighbours
        // are preferred over long-range shortcuts.
        const _pr = getPylonRange(), _pr2 = _pr * _pr;
        const _candidates = [];
        for (let _pi = 0; _pi < _wPylons.length; _pi++) {
            const pa = _wPylons[_pi];
            for (let _pj = _pi + 1; _pj < _wPylons.length; _pj++) {
                const pb = _wPylons[_pj];
                if (pa.attackModeElement !== pb.attackModeElement) continue;
                const dx = pa.x-pb.x, dy = pa.y-pb.y, d2 = dx*dx+dy*dy;
                if (d2 > _pr2) continue;
                _candidates.push({ pa, pb, d2 });
            }
        }
        _candidates.sort((a, b) => a.d2 - b.d2);

        for (const { pa, pb } of _candidates) {
            // Skip if already connected through the graph (would create a cycle/mesh)
            if (_ufFind(pa) === _ufFind(pb)) continue;
            _ufUnion(pa, pb);
            const _plx = pb.x-pa.x, _ply = pb.y-pa.y;
            _wPylonPairs.push({ pa, pb,
                el: pa.attackModeElement,
                col: pa.attackModeColor || "#0f8",
                midX: (pa.x+pb.x)*0.5, midY: (pa.y+pb.y)*0.5,
                lx: _plx, ly: _ply, len2: _plx*_plx+_ply*_ply,
                bMinX: Math.min(pa.x,pb.x)-1.5, bMaxX: Math.max(pa.x,pb.x)+1.5,
                bMinY: Math.min(pa.y,pb.y)-1.5, bMaxY: Math.max(pa.y,pb.y)+1.5 });
        }
        // O(1) partner lookup used by solo-flux ring and future checks
        _pylonsWithPartner = new Set();
        _wPylonPairs.forEach(({pa, pb}) => { _pylonsWithPartner.add(pa); _pylonsWithPartner.add(pb); });

        ELEMENTS.forEach(elDef => {
            const el = elDef.id;
            _seasonBonusCache[el] = _wPylons.some(p => p.attackModeElement === el && p.seasoned > 0) ? 1.25 : 1.0;
        });
    }


    // ── INTRUDER ALERT TIMER ──
    // Alarm persists until the kill quota is met; only then do predators stand down.
    if (alertActive) {
        alertTimer--;
        if (alertTimer <= 0) {
            if (nightKillCount >= nightEnemiesTarget) {
                clearAlarm();
            } else {
                alertTimer = ALERT_DURATION; // reload — keep alarm blaring until quota met
            }
        }
    }

    // ── WALL PANEL SIPHON ──
    // Player must stay near a panel for a few seconds to siphon shards from it.
    // Only one panel can be siphoned at a time — if the player is close to
    // multiple panels, only the first (closest) one progresses; others reset.
    // Uses _wallPanelCache to avoid scanning the entire world array every frame.
    const SIPHON_FRAMES = 150; // ~2.5 seconds at 60fps
    let _siphonActive = false; // tracks whether a panel is already being siphoned this frame
    for (let _wpi = _wallPanelCache.length - 1; _wpi >= 0; _wpi--) {
        const t = _wallPanelCache[_wpi];
        if (t.panelActivated) { _wallPanelCache.splice(_wpi, 1); continue; }
        const _pdx=player.x-t.x, _pdy=player.y-t.y;
        const playerClose = _pdx*_pdx+_pdy*_pdy < 2.25; // 1.5² — player standing at y=1 in front of y=0 panel
        if (playerClose && !_siphonActive) {
            _siphonActive = true;
            t.siphonProgress = (t.siphonProgress || 0) + 1;
            if (t.siphonProgress >= SIPHON_FRAMES) {
                t.panelActivated = true;
                _wallPanelCache.splice(_wpi, 1);
                if (t.isDecoy) {
                    triggerAlarm(t.alarmType, t.x, t.y);
                } else {
                    shardCount += t.shardReward;
                    saveShards();
                    shardUI.textContent = "Shards: " + shardCount;
                    floatingTexts.push({ x:canvas.width/2, y:canvas.height/2-60,
                        text:"+"+t.shardReward+" SHARDS (Panel)", color:"#ff8800", life:120, vy:-0.2 });
                }
            }
        } else {
            if (t.siphonProgress) t.siphonProgress = 0;
        }
    }

    // ── NEST HACK SIPHON ──
    // Player stands near a live nest to hack it — triggers a zone alarm for that nest's zone.
    // Cannot hack during an active alarm (one wave at a time).
    const NEST_HACK_FRAMES = 180; // ~3 seconds at 60fps
    if (!alertActive) {
        for (const nest of _nestCache) {
            if (nest.nestZone === 0) { nest.nestHackProgress = 0; continue; } // zone 0 is safe — no alarms
            if (nest.nestHealth <= 0) { nest.nestHackProgress = 0; continue; }
            const _nhdx = player.x - nest.x, _nhdy = player.y - (nest.y + 1);
            const playerNearNest = _nhdx*_nhdx + _nhdy*_nhdy < 2.25; // 1.5 tiles
            if (playerNearNest && !_siphonActive) {
                _siphonActive = true; // block panel siphons while hacking a nest
                nest.nestHackProgress = (nest.nestHackProgress || 0) + 1;
                if (nest.nestHackProgress >= NEST_HACK_FRAMES) {
                    nest.nestHackProgress = 0;
                    triggerAlarm("zone", nest.x, nest.y);
                }
            } else {
                nest.nestHackProgress = 0;
            }
        }
    } else {
        // Clear any in-progress hack when alarm fires
        for (const nest of _nestCache) nest.nestHackProgress = 0;
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
    // Uses `followers` (already filtered live followers) instead of actors.filter every frame.
    // Squared-distance early exit avoids sqrt for non-overlapping pairs (the common case).
    const _fl = followers; // followers[] is already dead-filtered each frame
    for (let _i = 0; _i < _fl.length; _i++) {
        for (let _j = _i+1; _j < _fl.length; _j++) {
            const _a = _fl[_i], _b = _fl[_j];
            const _dx = _b.x - _a.x, _dy = _b.y - _a.y;
            const _d2 = _dx*_dx + _dy*_dy;
            if (_d2 >= 0.3025 || _d2 < 0.000001) continue; // 0.55² = 0.3025
            const _d = Math.sqrt(_d2);
            const _p = (1/_d) * (0.55 - _d) * 0.5;
            _a.x -= _dx*_p; _a.y -= _dy*_p;
            _b.x += _dx*_p; _b.y += _dy*_p;
        }
    }

    // ── RED HEALTH DECAY ──
    actors.forEach(a=>{ if(a.team==="red"){a.health-=0.01; if(a.health<=0){a.health=0;a.dead=true;}} });

    // ── PREDATOR SPAWNING — always present (graze by default, hunt when alarm is active) ──
    if (gameState.phase === "day" || gameState.phase === "night") {
        // Zone cap scales with night number: natural species fill zones 1-6, then
        // synthetic deep-zone constructs (XV-09 … QX-z1) fill zones 7-12.
        // Cap at 12 to populate infinite zones without unbounded actor counts.
        const hostileZoneCount = Math.min(gameState.nightNumber, 12);
        for (let z = 1; z <= hostileZoneCount; z++) {
            const nest = _nestCache.find(t => t.nestZone === z);
            if (nest && nest.nestHealth <= 0) continue;
            if (!zonePredators[z]) zonePredators[z] = [];
            const alivePredators = zonePredators[z].filter(p => !p.dead);
            zonePredators[z] = alivePredators;
            const isAlarmZone = alertActive && (alertType === "facility" || z === alertZone);
            // Higher zones (above alarm zone) keep exactly 1 wanderer — they are never hunters
            const isHigherZone = alertActive && alertZone !== null && z > alertZone;
            // During alarm: spawn up to (zone depth + 2) predators in the alarm zone;
            // higher zones maintain 1 wanderer; non-alarm day keeps 1 wanderer per zone.
            const maxPredators = isAlarmZone ? (2 + z) : 1;
            if (alivePredators.length < maxPredators) {
                if (!zoneRespawnTimers[z]) zoneRespawnTimers[z] = 0;
                if (zoneRespawnTimers[z] > 0) {
                    zoneRespawnTimers[z]--;
                } else {
                    spawnPredatorForZone(z);
                    // Alarm zone: stagger spawns scaled by wave number (higher wave = faster spawns); wanderer zones: slow respawn
                    const _spawnDelay = isAlarmZone ? Math.max(15, 90 - (gameState.nightNumber - 1) * 5) : 240;
                    zoneRespawnTimers[z] = _spawnDelay;
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

            // Apply zone effects every 3 frames — visual / cooldown guards inside handle timing
            if (frame % 3 !== 0) return;

            // Compute per-element constants once per pair (not once per actor)
            const _nTier = networkStrength[el] || 1;
            const _seasonBonus = _seasonBonusCache[el] || 1.0;

            const {lx, ly, len2, bMinX, bMaxX, bMinY, bMaxY} = pair;
            actors.forEach(a=>{
                if (!a||a.dead) return;
                // Bounding box early-exit (avoids sqrt for distant actors)
                if (a.x < bMinX || a.x > bMaxX || a.y < bMinY || a.y > bMaxY) return;
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
                                    const _ax=a.x, _ay=a.y;
                                    actors.forEach(other => {
                                        if (other===a||other.dead||other.team!=="red") return;
                                        const _odx=other.x-_ax, _ody=other.y-_ay;
                                        if (Math.abs(_odx)>1.5||Math.abs(_ody)>1.5) return;
                                        if (_odx*_odx+_ody*_ody < 2.25) applyDamage(other, 4, null, "fire"); // 1.5²=2.25
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
                                const _ax=a.x, _ay=a.y;
                                actors.forEach(other => {
                                    if (other===a||other.dead||(other.team!=="red"&&!(other instanceof Predator&&other.team!=="green"&&!other.isClone))) return;
                                    const _odx=other.x-_ax, _ody=other.y-_ay;
                                    if (Math.abs(_odx)>1.2||Math.abs(_ody)>1.2) return;
                                    const od2 = _odx*_odx+_ody*_ody;
                                    if (od2 < 1.44 && od2 > 0.0001) { other.x+=dx/d*0.05; other.y+=dy/d*0.05; } // 1.2²=1.44
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
                                const _ax=a.x, _ay=a.y;
                                actors.forEach(other => {
                                    if (other===a||other.dead||(other.team!=="red"&&!(other instanceof Predator&&other.team!=="green"&&!other.isClone))) return;
                                    const _odx=other.x-_ax, _ody=other.y-_ay;
                                    if (Math.abs(_odx)>1.5||Math.abs(_ody)>1.5) return;
                                    if (_odx*_odx+_ody*_ody < 2.25) { // 1.5²=2.25
                                        other.defenseShredded = 60; other.defenseShredFactor = 0.55;
                                    }
                                });
                            }
                        }
                        break;
                    }
                }
                // Predator pylon aggro — track how long a predator has been cooked by pylons.
                // Guard with _lastExposureFrame so multi-pair actors only count once per frame.
                if (isEnemy && a instanceof Predator) {
                    if (a._lastExposureFrame !== frame) {
                        a._lastExposureFrame = frame;
                        a.pylonExposureFrames = (a.pylonExposureFrames||0) + 1;
                        if (a.pylonExposureFrames > 300 && !a.pylonAggro) {
                            let nearestPylon=null, bestPD=Infinity;
                            wavePylons.forEach(wp=>{ const d=Math.hypot(wp.x-a.x,wp.y-a.y); if(d<bestPD){bestPD=d;nearestPylon=wp;} });
                            if (nearestPylon) a.pylonAggro = nearestPylon;
                        }
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
    // _pylonsWithPartner was pre-computed in the 60-frame cache block — O(1) lookup.
    wavePylons.forEach(pv=>{
        if (pv.attackModeElement!=="flux") return;
        if (_pylonsWithPartner.has(pv)) return; // already handled by pair logic
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
        if (t.attackFireTimer < 90 - (pylonFireRateBonus||0)) return; // fire every 1.5s (reduced by Overclock)
        t.attackFireTimer = 0;
        // Find nearest enemy within range — squared distance avoids sqrt for non-targets
        let nearest=null, bd2=t.attackRange*t.attackRange;
        actors.forEach(a=>{
            if ((a.team==="red"||(a instanceof Predator&&a.team!=="green"))&&!a.dead) {
                const dx=a.x-t.x, dy=a.y-t.y, d2=dx*dx+dy*dy;
                if (d2<bd2) { bd2=d2; nearest=a; }
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
            const isGhostSave = (newHp<=0) && (activeCrystalBuild==="ghostphage"||activeCrystalBuild==="ghostphage_ii") && !a.ghostphageLife;
            const isWardenSave = (newHp<=0) && activeCrystalBuild==="warden_pact";
            if (newHp<=0 && !isGhostSave && !isWardenSave) return; // permanent death — don't queue
            const respawnTimer = isWardenSave ? 480 : 180; // warden pact: longer 8s delay
            respawnQueue.push({ element:a.element, combatTrait:a.combatTrait, naturalTrait:a.naturalTrait, perk:a.perk, personality:a.personality, timer:respawnTimer, isClone:a.isClone||false, speciesName:a.speciesName, className:a.className, hpStat:Math.max(1,newHp), ghostphageLife:isGhostSave });
        }
        // track kills for wave clear — count dead enemies not clones, wanderers don't count
        if (a.dead && (a.team==="red" || (a instanceof Predator && a.team!=="green" && !a.isClone)) && !a.killCounted && !a.isWanderer) {
            a.killCounted = true;
            nightKillCount++;
            const _kz = alertSource ? getZoneIndex(Math.floor(alertSource.x)) : 1;
            waveUI.textContent = "⚠ Zone "+_kz+" — Kill "+nightKillCount+"/"+nightEnemiesTarget;
            // Shard Harvest — +1 shard per kill
            if (activeCrystalBuild==="shard_harvest") { shardCount++; saveShards(); shardUI.textContent="Shards: "+shardCount; }
            // Void Rift — +50% shard yield in cleared zones (approximated as +1 extra per kill in alert zone)
            if (activeCrystalBuild==="void_rift" && _kz > 0 && gameState.highestZoneCleared >= _kz) { shardCount++; saveShards(); shardUI.textContent="Shards: "+shardCount; }
        }
    });

    // Single pass — handle ALL dead predators exactly once
    actors.forEach(a => {
        if (a instanceof Predator && a.dead && !a.deathProcessed && a.team !== "green") {
            a.deathProcessed = true;
            onPredatorDeath(a);
            // Remove from zone array so slot opens for respawn
            if (a.homeZone !== undefined && zonePredators[a.homeZone]) {
                zonePredators[a.homeZone] = zonePredators[a.homeZone].filter(p => p !== a);
                // Only reset timer when the last predator in that zone dies
                if (zonePredators[a.homeZone].length === 0) {
                    zoneRespawnTimers[a.homeZone] = 180;
                }
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
        if(t.pulseTimer>120){ t.pulseTimer=0; actors.forEach(a=>{ if(a.team==="green"){const dx=a.x-t.x,dy=a.y-t.y; if(Math.abs(dx)>3.5||Math.abs(dy)>3.5) return; if(dx*dx+dy*dy<12.25) a.health=Math.min(a.maxHealth,a.health+2);} }); }
    });

    // ── PILLAR HEALING (every 3 frames; heal 0.15 to match original 0.05/frame) ──
    if (frame % 3 === 0) {
        actors.forEach(actor=>{
            _pillarCache.forEach(t=>{
                // Cheap bbox reject before team check and sqrt
                if(Math.abs(t.x-actor.x)>1.2||Math.abs(t.y-actor.y)>1.2) return;
                if((actor.team==="green"&&t.pillarTeam!=="green")||(actor.team==="red"&&t.pillarTeam!=="red")) return;
                const dx=t.x-actor.x, dy=t.y-actor.y;
                if(dx*dx+dy*dy < 1.44) actor.health=Math.min(actor.maxHealth, actor.health+0.15);
            });
        });
    }

    // ── PROXIMITY CONVERSION — virus NPCs join team when player walks close ──
    actors.forEach(a => {
        if (a.dead || !a.isNeutralRecruit || a.team !== "red" || a instanceof Predator) return;
        if (a.spawnProtection > 0) return;
        if (Math.hypot(player.x - a.x, player.y - a.y) < 1.5) convertNPC(a, "green");
    });

    updateShards();
    updateCaptureProgress();
    if (frame % 6 === 0) applySignalTowerBuff();
    updateStatusEffects();
    updateElementEffects();
    updateFloatingTexts();
    updateTraps();

    // ── CRYSTAL ULTIMATE CHARGE RESTORE ──────────────────────────────────
    // Runs every 60 frames. Rate scales with max pylon zone depth and nest pod links.
    if (frame % 60 === 0 && followers.length > 0) {
        // Base charge per tick at crystal proximity
        const crystalDist = Math.hypot(player.x - crystal.x, player.y - crystal.y);
        const nearCrystal = crystalDist < 3.0;

        // Find deepest zone index of any living green pylon — reuse _pillarCache (already filtered)
        const greenPylons = _pillarCache.filter(t => t.pillarTeam === "green");
        let maxPylonZone = 0;
        greenPylons.forEach(t => { const z = getZoneIndex(t.x); if (z > maxPylonZone) maxPylonZone = z; });

        // Bonus charge if any green pylon is connected to a destroyed nest pod
        const brokenNests = _nestCache.filter(t => t.nestHealth <= 0);
        let nestBonus = 0;
        if (brokenNests.length > 0) {
            brokenNests.forEach(nest => {
                greenPylons.forEach(p => {
                    const dx=p.x-nest.x, dy=p.y-nest.y;
                    if (dx*dx+dy*dy < 25) nestBonus = Math.max(nestBonus, 3); // 5²=25
                });
            });
        }

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
    // Pre-build smoke zone lookup for 3D per-tile creeping smoke
    const smokeTileZones = new Map(); // zone → smokeEffect obj
    elementEffects.forEach(e => { if (e.type === "smokeScreen") smokeTileZones.set(e.zone, e); });

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
            const hpR  = crystal.health / crystal.maxHealth;
            const pulse = 0.7 + 0.3 * Math.sin(frame * 0.05);
            // Flicker worsens with damage
            const jFlicker = hpR < 0.5
                ? ((Math.sin(frame * 0.35) > 0.72) ? 0.3 + 0.7 * Math.abs(Math.sin(frame * 2.3)) : 1.0)
                : 1.0;
            // HP colour state: healthy=cyan-blue, damaged=orange, critical=red
            const coreRGB = hpR > 0.5 ? [20,160,255] : hpR > 0.2 ? [255,130,0] : [255,40,40];
            const coreHex = hpR > 0.5 ? '#14a0ff'    : hpR > 0.2 ? '#ff8200'   : '#ff2828';

            const bob = Math.sin(frame * 0.04) * 3;
            // Isometric box: base-center at (bcx, bcy), hw=half-width, h=height, t=iso-tilt
            const bcx = px, bcy = py - 28 + bob;
            const hw = 24, h = 40, t = hw * 0.5;

            // Face point arrays for clipping / drawing
            const rfPts = [[bcx,bcy],[bcx+hw,bcy-t],[bcx+hw,bcy-t-h],[bcx,bcy-h]];
            const lfPts = [[bcx,bcy],[bcx-hw,bcy-t],[bcx-hw,bcy-t-h],[bcx,bcy-h]];
            const tpPts = [[bcx,bcy-h],[bcx+hw,bcy-h-t],[bcx,bcy-h-hw],[bcx-hw,bcy-h-t]];
            const _facePath = pts => {
                ctx.beginPath(); ctx.moveTo(pts[0][0],pts[0][1]);
                for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0],pts[i][1]);
                ctx.closePath();
            };

            ctx.save();

            // ── Outer glow halo ──
            const haloBase = hpR>0.5 ? 'rgba(18,70,200,' : hpR>0.2 ? 'rgba(200,90,0,' : 'rgba(200,18,18,';
            const haloGrd  = ctx.createRadialGradient(bcx, bcy-h*0.5, 5, bcx, bcy-h*0.5, 52);
            haloGrd.addColorStop(0, haloBase+'0.25)'); haloGrd.addColorStop(1, haloBase+'0)');
            ctx.save(); ctx.globalAlpha = pulse * jFlicker;
            ctx.fillStyle = haloGrd;
            ctx.beginPath(); ctx.arc(bcx, bcy-h*0.5, 52, 0, Math.PI*2); ctx.fill();
            ctx.restore();

            // ── Right face — dark gunmetal ──
            _facePath(rfPts); ctx.fillStyle='rgb(26,28,33)'; ctx.fill();
            ctx.strokeStyle='rgba(58,62,72,0.7)'; ctx.lineWidth=0.8; ctx.stroke();

            // ── Warning stripes on right face ──
            ctx.save(); _facePath(rfPts); ctx.clip(); ctx.lineWidth=4.5;
            for (let i=-5;i<=10;i++) {
                ctx.strokeStyle = (i%2===0) ? 'rgba(180,136,0,0.28)' : 'rgba(8,8,8,0.24)';
                ctx.beginPath(); ctx.moveTo(bcx+i*6-5, bcy+5); ctx.lineTo(bcx+hw+i*6+5, bcy-t-h-5); ctx.stroke();
            }
            ctx.restore();

            // ── Left face — slightly lighter gunmetal ──
            _facePath(lfPts); ctx.fillStyle='rgb(34,36,42)'; ctx.fill();
            ctx.strokeStyle='rgba(58,62,72,0.7)'; ctx.lineWidth=0.8; ctx.stroke();

            // ── Top face ──
            _facePath(tpPts); ctx.fillStyle='rgb(42,44,51)'; ctx.fill();
            ctx.strokeStyle='rgba(68,72,84,0.8)'; ctx.lineWidth=0.8; ctx.stroke();

            // ── Top glow overlay ──
            ctx.save(); _facePath(tpPts); ctx.clip();
            ctx.fillStyle=`rgba(${(coreRGB[0]*0.12*pulse*jFlicker)|0},${(coreRGB[1]*0.12*pulse*jFlicker)|0},${(coreRGB[2]*0.12*pulse*jFlicker)|0},0.45)`;
            ctx.fill(); ctx.restore();

            // ── Rivets — right face ──
            [[bcx+hw*0.22,bcy-t*0.22-5],[bcx+hw*0.22,bcy-t*0.22-h+6],
             [bcx+hw*0.78,bcy-t*0.78-5],[bcx+hw*0.78,bcy-t*0.78-h+6]].forEach(([rx,ry]) => {
                ctx.fillStyle='rgba(78,73,58,0.95)';
                ctx.beginPath(); ctx.arc(rx,ry,1.9,0,Math.PI*2); ctx.fill();
                ctx.strokeStyle='rgba(52,48,36,0.8)'; ctx.lineWidth=0.5;
                ctx.beginPath(); ctx.moveTo(rx-1.4,ry); ctx.lineTo(rx+1.4,ry); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(rx,ry-1.4); ctx.lineTo(rx,ry+1.4); ctx.stroke();
            });
            // ── Rivets — left face ──
            [[bcx-hw*0.22,bcy-t*0.22-5],[bcx-hw*0.22,bcy-t*0.22-h+6],
             [bcx-hw*0.78,bcy-t*0.78-5],[bcx-hw*0.78,bcy-t*0.78-h+6]].forEach(([rx,ry]) => {
                ctx.fillStyle='rgba(68,64,51,0.95)';
                ctx.beginPath(); ctx.arc(rx,ry,1.9,0,Math.PI*2); ctx.fill();
                ctx.strokeStyle='rgba(44,40,30,0.8)'; ctx.lineWidth=0.5;
                ctx.beginPath(); ctx.moveTo(rx-1.4,ry); ctx.lineTo(rx+1.4,ry); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(rx,ry-1.4); ctx.lineTo(rx,ry+1.4); ctx.stroke();
            });

            // ── Energy core window (right face, center) ──
            const winX = bcx+hw*0.42, winY = bcy-t*0.42-h*0.52;
            ctx.fillStyle='rgba(4,4,7,0.97)'; ctx.strokeStyle='rgba(52,56,66,0.9)'; ctx.lineWidth=0.9;
            ctx.fillRect(winX-7,winY-9,14,18); ctx.strokeRect(winX-7,winY-9,14,18);
            // Glowing inner orb
            ctx.shadowColor=coreHex; ctx.shadowBlur=(9+5*pulse)*jFlicker;
            ctx.fillStyle=`rgba(${(coreRGB[0]*pulse*jFlicker)|0},${(coreRGB[1]*pulse*jFlicker)|0},${(coreRGB[2]*pulse*jFlicker)|0},0.92)`;
            ctx.beginPath(); ctx.arc(winX,winY,4.5+pulse*1.1,0,Math.PI*2); ctx.fill();
            ctx.shadowBlur=0;
            // Glare strip on window
            ctx.fillStyle='rgba(255,255,255,0.07)'; ctx.fillRect(winX-6,winY-8,7,7);

            // ── Vent slots on right face top ──
            [bcy-t*0.04-h+8, bcy-t*0.04-h+13].forEach(vy => {
                ctx.fillStyle='rgba(0,0,0,0.84)'; ctx.strokeStyle='rgba(55,58,66,0.5)'; ctx.lineWidth=0.5;
                ctx.fillRect(bcx+2,vy,15,2); ctx.strokeRect(bcx+2,vy,15,2);
            });

            // ── Conduit pipe + coil rings on top-right ──
            const coilX=bcx+hw*0.55, coilBaseY=bcy-t*0.55-h;
            ctx.strokeStyle='rgba(72,68,52,0.95)'; ctx.lineWidth=2.8;
            ctx.beginPath(); ctx.moveTo(coilX,coilBaseY); ctx.lineTo(coilX,coilBaseY-22); ctx.stroke();
            for (let i=0;i<5;i++) {
                const ky=coilBaseY-3-i*4;
                ctx.strokeStyle=`rgba(${(88+i*9)|0},${(83+i*7)|0},${(60+i*4)|0},0.82)`;
                ctx.lineWidth=1.3; ctx.beginPath(); ctx.ellipse(coilX,ky,5.2,2.1,0,0,Math.PI*2); ctx.stroke();
            }
            ctx.fillStyle='rgba(48,45,36,0.97)'; ctx.strokeStyle='rgba(80,75,58,0.85)'; ctx.lineWidth=0.8;
            ctx.beginPath(); ctx.ellipse(coilX,coilBaseY-22,5.2,2.2,0,0,Math.PI*2); ctx.fill(); ctx.stroke();
            // Vent tip glow
            ctx.shadowColor=coreHex; ctx.shadowBlur=5*pulse*jFlicker;
            ctx.fillStyle=`rgba(${(coreRGB[0]*0.55*pulse)|0},${(coreRGB[1]*0.55*pulse)|0},${(coreRGB[2]*0.55*pulse)|0},0.65)`;
            ctx.beginPath(); ctx.ellipse(coilX,coilBaseY-22,2.5,1.1,0,0,Math.PI*2); ctx.fill();
            ctx.shadowBlur=0;

            // ── Status lights on left face ──
            const l1On=Math.sin(frame*0.09)>0, l2On=Math.sin(frame*0.16+2.3)>0.28;
            const l3On=hpR<0.5&&Math.sin(frame*0.23+0.9)>0;
            const llx=bcx-hw*0.55;
            ctx.shadowColor=l1On?'#ffaa00':'transparent'; ctx.shadowBlur=l1On?6:0;
            ctx.fillStyle=l1On?`rgba(255,${(148*pulse)|0},0,0.95)`:'rgba(46,24,0,0.8)';
            ctx.beginPath(); ctx.arc(llx,bcy-t*0.55-h*0.28,2.3,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;

            ctx.shadowColor=l2On?'#00ccff':'transparent'; ctx.shadowBlur=l2On?5:0;
            ctx.fillStyle=l2On?`rgba(0,${(190*pulse)|0},${(255*pulse)|0},0.95)`:'rgba(0,26,36,0.8)';
            ctx.beginPath(); ctx.arc(llx,bcy-t*0.55-h*0.54,2.3,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;

            if (hpR<0.5) {
                ctx.shadowColor=l3On?'#ff2200':'transparent'; ctx.shadowBlur=l3On?7:0;
                ctx.fillStyle=l3On?`rgba(255,${(28*pulse)|0},${(12*pulse)|0},0.95)`:'rgba(44,6,4,0.8)';
                ctx.beginPath(); ctx.arc(llx,bcy-t*0.55-h*0.76,2.3,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0;
            }

            // ── Dangling wires off left-top corner ──
            const wbx=bcx-hw*0.68, wby=bcy-t*0.68-h;
            [['rgba(0,185,255,0.58)',0,0],['rgba(255,112,0,0.52)',1.5,2.5]].forEach(([wc,ox,dx]) => {
                ctx.strokeStyle=wc; ctx.lineWidth=0.95;
                ctx.beginPath(); ctx.moveTo(wbx+ox,wby);
                ctx.bezierCurveTo(wbx+dx-5,wby+10,wbx+dx-9,wby+21,wbx+dx-7,wby+33); ctx.stroke();
            });

            // ── Damage cracks ──
            if (hpR<0.5) {
                const ca=Math.min(1,(0.5-hpR)*2.2);
                ctx.strokeStyle=`rgba(255,${(65*ca)|0},0,${ca*0.65})`; ctx.lineWidth=0.85;
                ctx.beginPath();
                ctx.moveTo(bcx+hw*0.3,bcy-t*0.3-8); ctx.lineTo(bcx+hw*0.17,bcy-t*0.17-24);
                ctx.lineTo(bcx+hw*0.26,bcy-t*0.26-34); ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(bcx+hw*0.17,bcy-t*0.17-24); ctx.lineTo(bcx+hw*0.06,bcy-t*0.06-29); ctx.stroke();
            }

            // ── "CORE UNIT" stencil label on left face ──
            ctx.font='bold 7px monospace'; ctx.textAlign='center';
            ctx.fillStyle=`rgba(148,124,40,${0.6*pulse})`;
            ctx.fillText('CORE', bcx-hw*0.38, bcy-t*0.38-h*0.52);
            ctx.fillStyle=`rgba(100,85,28,${0.4*pulse})`;
            ctx.font='6px monospace';
            ctx.fillText('UNIT-01', bcx-hw*0.38, bcy-t*0.38-h*0.52+8);

            ctx.restore();

            drawHealthBar(px-25, py-118+bob, 50, 7, crystal.health, crystal.maxHealth);
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
            // Home camp area — circuit board PCB style (x < 0 is behind the Crystal)
            if (obj.x < 0) { drawCampFloor(obj, px, py, amb); return; }
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
            // ── TERRITORY TINT — color overlay for player/enemy/contested zones ──
            if (obj.territory) {
                ctx.save();
                if (obj.territory === 'player')    ctx.fillStyle = 'rgba(0,120,255,0.15)';
                else if (obj.territory === 'enemy') ctx.fillStyle = 'rgba(255,40,40,0.12)';
                else                               ctx.fillStyle = 'rgba(200,200,0,0.1)';
                ctx.beginPath();
                ctx.moveTo(px,py); ctx.lineTo(px+TILE_W,py+TILE_H);
                ctx.lineTo(px,py+TILE_W); ctx.lineTo(px-TILE_W,py+TILE_H);
                ctx.closePath(); ctx.fill();
                ctx.restore();
            }

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

            // ── 3D SMOKE TILES — toxic ultimate: creeping raised slabs + single wisp ──
            if (smokeTileZones.size > 0) {
                const tileZone = getZoneIndex(Math.round(obj.x));
                const sE = smokeTileZones.get(tileZone);
                if (sE) {
                    const elapsed        = sE.maxLife - sE.life;
                    const distFromCaster = Math.hypot(obj.x - sE.x, obj.y - sE.y);
                    const spreadRadius   = elapsed / 5; // ~1 tile per 5 frames
                    if (distFromCaster < spreadRadius) {
                        const arrivalT = Math.min(1, (spreadRadius - distFromCaster) / 4);
                        const fadeOut  = Math.min(1, sE.life / 90);
                        const factor   = arrivalT * fadeOut;
                        const sh       = Math.round(10 * factor); // max raised height in px
                        const seed     = obj.x * 17.3 + obj.y * 11.7;
                        ctx.save();

                        // Left face — shadow side (NW wall) — pale violet mist
                        ctx.beginPath();
                        ctx.moveTo(px,          py          - sh);
                        ctx.lineTo(px - TILE_W, py + TILE_H - sh);
                        ctx.lineTo(px - TILE_W, py + TILE_H);
                        ctx.lineTo(px,          py);
                        ctx.closePath();
                        ctx.fillStyle = `rgba(55, 45, 90, ${0.32 * factor})`;
                        ctx.fill();

                        // Right face — lit side (NE wall) — soft blue-lavender
                        ctx.beginPath();
                        ctx.moveTo(px,          py          - sh);
                        ctx.lineTo(px + TILE_W, py + TILE_H - sh);
                        ctx.lineTo(px + TILE_W, py + TILE_H);
                        ctx.lineTo(px,          py);
                        ctx.closePath();
                        ctx.fillStyle = `rgba(100, 85, 160, ${0.25 * factor})`;
                        ctx.fill();

                        // Top face — ghostly silver-lavender diamond
                        ctx.beginPath();
                        ctx.moveTo(px,          py          - sh);
                        ctx.lineTo(px + TILE_W, py + TILE_H - sh);
                        ctx.lineTo(px,          py + TILE_W - sh);
                        ctx.lineTo(px - TILE_W, py + TILE_H - sh);
                        ctx.closePath();
                        ctx.fillStyle = `rgba(190, 175, 230, ${0.18 * factor})`;
                        ctx.fill();

                        // Single rising wisp — cheap flat fill, no gradient
                        const cycle  = ((frame * 0.8 + seed * 3) % 60) / 60;
                        const wOx    = Math.sin(seed + frame * 0.011) * TILE_W * 0.3;
                        const wR     = 11 * Math.min(1, factor * 2);
                        const wAlpha = 0.22 * factor * (1 - cycle * 0.7);
                        ctx.globalAlpha = wAlpha;
                        ctx.fillStyle   = "rgba(200, 185, 240, 1)";
                        ctx.beginPath();
                        ctx.arc(px + wOx, py + TILE_H - sh - 4 - cycle * 30, wR, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.restore();
                    }
                }
            }

            // ── CAPTURABLE NODES (capacitor / signal tower) ──
            // wall_panel is drawn on the wall face in the wall_back pass — skip it here.
            if (obj.nodeType && obj.nodeType !== 'wall_panel') drawCapturableNode(obj, px, py);

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

                // Hack progress bar — shown when player is hacking this nest
                const _hackProg = obj.nestHackProgress || 0;
                if (_hackProg > 0) {
                    const _hp = _hackProg / 180;
                    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
                    ctx.fillStyle = "rgba(0,0,0,0.55)";
                    ctx.fillRect(barCx - 40, wfTL.y - 22, 80, 7);
                    ctx.fillStyle = `rgba(0,255,136,${0.7 + 0.3 * Math.sin(frame * 0.3)})`;
                    ctx.fillRect(barCx - 40, wfTL.y - 22, 80 * _hp, 7);
                    ctx.strokeStyle = "#0f8"; ctx.lineWidth = 1;
                    ctx.strokeRect(barCx - 40, wfTL.y - 22, 80, 7);
                    ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#0f8";
                    ctx.fillText("HACKING NEST...", barCx, wfTL.y - 26);
                    ctx.restore();
                } else if (!alertActive) {
                    // Hint label when player is not currently hacking
                    const _dxH = player.x - obj.x, _dyH = player.y - (obj.y + 1);
                    if (_dxH*_dxH + _dyH*_dyH < 9) { // within 3 tiles — show hint
                        ctx.save(); ctx.setTransform(1,0,0,1,0,0);
                        ctx.font = "9px monospace"; ctx.textAlign = "center";
                        ctx.fillStyle = "rgba(0,255,136,0.7)";
                        ctx.fillText("[ HOLD to HACK NEST ]", barCx, wfTL.y - 26);
                        ctx.restore();
                    }
                }
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

            // Pillar — 6 unique style-based designs
            if (obj.pillar&&!obj.destroyed&&typeof obj.health==="number"&&obj.health>0) {
                if(obj.converting){ctx.fillStyle="#ff0";}
                const _base=py+TILE_H; // anchor to tile center, not north vertex
                drawHealthBar(px-10,_base-75,20,4,obj.health,obj.maxHealth);
                const _style=obj.pylonStyle||"sentinel";
                const _pulse=0.5+0.5*Math.sin(frame*0.08+(obj.x*0.97+obj.y*1.31));
                const _acol=obj.attackModeColor||"#0f8";
                const _isActive=!!(obj.attackMode||obj.waveMode);
                const _wTier=obj.waveMode?(networkStrength[obj.attackModeElement]||0):0;
                const _tierMult=1+_wTier*0.4;

                // ── WAVE MODE — background glow ring ──
                if (obj.waveMode) {
                    const _wGlowR=(20+_pulse*5)*Math.min(1.5,_tierMult);
                    const _wGlowA=Math.min(0.5,(0.12+_pulse*0.1)*_tierMult);
                    ctx.save(); ctx.globalAlpha=_wGlowA; ctx.fillStyle=_acol;
                    ctx.shadowColor=_acol; ctx.shadowBlur=_wTier>1?16*_tierMult:0;
                    ctx.beginPath(); ctx.arc(px,_base-36,_wGlowR,0,Math.PI*2); ctx.fill();
                    ctx.shadowBlur=0; ctx.restore();
                    if (_wTier>=2) {
                        ctx.save(); ctx.globalAlpha=(0.07+_pulse*0.07)*_tierMult;
                        ctx.strokeStyle=_acol; ctx.lineWidth=2; ctx.shadowColor=_acol; ctx.shadowBlur=8;
                        ctx.beginPath(); ctx.arc(px,_base-36,_wGlowR+10+_pulse*6,0,Math.PI*2); ctx.stroke();
                        ctx.shadowBlur=0; ctx.restore();
                    }
                }
                // ── ATTACK MODE — range ring ──
                if (obj.attackMode) {
                    ctx.save(); ctx.globalAlpha=0.08+_pulse*0.08; ctx.strokeStyle=_acol; ctx.lineWidth=2;
                    ctx.beginPath(); ctx.arc(px,_base-20,obj.attackRange*TILE_W*0.5,0,Math.PI*2); ctx.stroke();
                    ctx.restore();
                }

                // ── STYLE-SPECIFIC BODY STRUCTURE ──
                ctx.save();
                switch(_style) {
                    case "sentinel": {
                        // Isometric fortress tower — 3 visible faces per block
                        const sD=6; // iso depth
                        const sFront=_isActive?"#1a2030":obj.upgraded?"#0d1825":"#252830";
                        const sRight=_isActive?"#0d1520":obj.upgraded?"#081018":"#181b20";
                        const sTop=_isActive?"#2a3545":obj.upgraded?"#1a2535":"#343840";
                        // Main tower right face
                        ctx.fillStyle=sRight; ctx.beginPath();
                        ctx.moveTo(px+8,_base); ctx.lineTo(px+8+sD,_base+sD/2);
                        ctx.lineTo(px+8+sD,_base-35+sD/2); ctx.lineTo(px+8,_base-35); ctx.closePath(); ctx.fill();
                        // Main tower front face
                        ctx.fillStyle=sFront; ctx.fillRect(px-8,_base-35,16,35);
                        // Main tower top face
                        ctx.fillStyle=sTop; ctx.beginPath();
                        ctx.moveTo(px-8,_base-35); ctx.lineTo(px+8,_base-35);
                        ctx.lineTo(px+8+sD,_base-35+sD/2); ctx.lineTo(px-8+sD,_base-35+sD/2); ctx.closePath(); ctx.fill();
                        // Upper parapet right face
                        ctx.fillStyle=sRight; ctx.beginPath();
                        ctx.moveTo(px+6,_base-35); ctx.lineTo(px+6+sD,_base-35+sD/2);
                        ctx.lineTo(px+6+sD,_base-48+sD/2); ctx.lineTo(px+6,_base-48); ctx.closePath(); ctx.fill();
                        // Upper parapet front face
                        ctx.fillStyle=sFront; ctx.fillRect(px-6,_base-48,12,13);
                        // Upper parapet top face
                        ctx.fillStyle=sTop; ctx.beginPath();
                        ctx.moveTo(px-6,_base-48); ctx.lineTo(px+6,_base-48);
                        ctx.lineTo(px+6+sD,_base-48+sD/2); ctx.lineTo(px-6+sD,_base-48+sD/2); ctx.closePath(); ctx.fill();
                        // Battlements (2 merlons)
                        const _merls=[{x:px-3.5,w:3.5},{x:px+3.5,w:3.5}];
                        for (const m of _merls) {
                            ctx.fillStyle=sRight; ctx.beginPath();
                            ctx.moveTo(m.x+m.w,_base-48); ctx.lineTo(m.x+m.w+sD*0.5,_base-48+sD*0.25);
                            ctx.lineTo(m.x+m.w+sD*0.5,_base-52+sD*0.25); ctx.lineTo(m.x+m.w,_base-52); ctx.closePath(); ctx.fill();
                            ctx.fillStyle=_isActive?"#2a3040":"#303540";
                            ctx.fillRect(m.x-m.w,_base-52,m.w*2,4);
                            ctx.fillStyle=sTop; ctx.beginPath();
                            ctx.moveTo(m.x-m.w,_base-52); ctx.lineTo(m.x+m.w,_base-52);
                            ctx.lineTo(m.x+m.w+sD*0.5,_base-52+sD*0.25); ctx.lineTo(m.x-m.w+sD*0.5,_base-52+sD*0.25); ctx.closePath(); ctx.fill();
                        }
                        // Arrow slit
                        ctx.fillStyle="#050508"; ctx.fillRect(px-1.5,_base-43,3,10); ctx.fillRect(px-4,_base-40,8,3);
                        break;
                    }
                    case "spire": {
                        // Faceted crystal with 3 colour planes
                        const spD=5;
                        const spFront=_isActive?"#1a1040":obj.upgraded?"#130d30":"#1e1a38";
                        const spRight=_isActive?"#0e0820":obj.upgraded?"#0a0618":"#120c22";
                        const spLeft=_isActive?"#2a1860":obj.upgraded?"#1f1248":"#251e4a";
                        // Right dark facet (back-most, draw first)
                        ctx.fillStyle=spRight;
                        ctx.beginPath(); ctx.moveTo(px,_base-55); ctx.lineTo(px+spD,_base-55+spD/2);
                        ctx.lineTo(px+9+spD,_base-25+spD/2); ctx.lineTo(px+4+spD,_base+spD/2);
                        ctx.lineTo(px+4,_base); ctx.lineTo(px+9,_base-25); ctx.closePath(); ctx.fill();
                        // Lower right body
                        ctx.fillStyle=spRight; ctx.beginPath();
                        ctx.moveTo(px+4,_base); ctx.lineTo(px+4+spD,_base+spD/2);
                        ctx.lineTo(px-4+spD,_base+spD/2); ctx.lineTo(px-4,_base); ctx.closePath(); ctx.fill();
                        // Main front face
                        ctx.fillStyle=spFront; ctx.beginPath();
                        ctx.moveTo(px,_base-55); ctx.lineTo(px+9,_base-25); ctx.lineTo(px+4,_base); ctx.lineTo(px-4,_base); ctx.lineTo(px-9,_base-25);
                        ctx.closePath(); ctx.fill();
                        // Left lighter facet
                        ctx.fillStyle=spLeft; ctx.globalAlpha=0.65; ctx.beginPath();
                        ctx.moveTo(px,_base-55); ctx.lineTo(px-9,_base-25); ctx.lineTo(px-4,_base-15); ctx.lineTo(px,_base-15);
                        ctx.closePath(); ctx.fill(); ctx.globalAlpha=1;
                        // Ridge highlights
                        ctx.strokeStyle=_isActive?"#8866ee":"#5a4a88"; ctx.lineWidth=1.5; ctx.globalAlpha=0.7;
                        ctx.beginPath(); ctx.moveTo(px,_base-55); ctx.lineTo(px-9,_base-25); ctx.stroke();
                        ctx.strokeStyle=_isActive?"#6644cc":"#3a3060"; ctx.lineWidth=1; ctx.globalAlpha=0.5;
                        ctx.beginPath(); ctx.moveTo(px,_base-55); ctx.lineTo(px+9,_base-25); ctx.stroke();
                        ctx.globalAlpha=1;
                        // Interior shimmer band
                        ctx.globalAlpha=0.1+_pulse*0.15; ctx.fillStyle=_isActive?"#aa88ff":"#6655aa";
                        ctx.beginPath(); ctx.moveTo(px-3,_base-48); ctx.lineTo(px+4,_base-38); ctx.lineTo(px+1,_base-30); ctx.lineTo(px-4,_base-40); ctx.closePath(); ctx.fill();
                        ctx.globalAlpha=1;
                        break;
                    }
                    case "monolith": {
                        // Thick ancient stone slab — isometric block with rune faces
                        const mD=8;
                        const mFront=_isActive?"#0a1a10":obj.upgraded?"#081510":"#111a12";
                        const mRight=_isActive?"#051008":obj.upgraded?"#030a06":"#090e09";
                        const mTop=_isActive?"#142a1a":obj.upgraded?"#101f14":"#182418";
                        const mw=11,mh=40;
                        // Right face
                        ctx.fillStyle=mRight; ctx.beginPath();
                        ctx.moveTo(px+mw,_base); ctx.lineTo(px+mw+mD,_base+mD/2);
                        ctx.lineTo(px+mw+mD,_base-mh+mD/2); ctx.lineTo(px+mw,_base-mh); ctx.closePath(); ctx.fill();
                        // Front face
                        ctx.fillStyle=mFront; ctx.fillRect(px-mw,_base-mh,mw*2,mh);
                        // Top face
                        ctx.fillStyle=mTop; ctx.beginPath();
                        ctx.moveTo(px-mw,_base-mh); ctx.lineTo(px+mw,_base-mh);
                        ctx.lineTo(px+mw+mD,_base-mh+mD/2); ctx.lineTo(px-mw+mD,_base-mh+mD/2); ctx.closePath(); ctx.fill();
                        // Front face rune engravings
                        ctx.strokeStyle=_isActive?"#2a5535":"#1a2a1a"; ctx.lineWidth=1;
                        ctx.beginPath(); ctx.moveTo(px-7,_base-30); ctx.lineTo(px+7,_base-30); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(px,_base-38); ctx.lineTo(px,_base-14); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(px-5,_base-22); ctx.lineTo(px+5,_base-22); ctx.stroke();
                        // Side face rune on right
                        ctx.strokeStyle=_isActive?"#1a3520":"#111a11"; ctx.lineWidth=0.8; ctx.globalAlpha=0.55;
                        ctx.beginPath(); ctx.moveTo(px+mw+2,_base-28); ctx.lineTo(px+mw+mD-2,_base-28+mD*0.3); ctx.stroke();
                        ctx.globalAlpha=1;
                        break;
                    }
                    case "antenna": {
                        // Broadcasting mast — thin isometric column, tiered crossbars, dome cap
                        const aD=4;
                        const aFront=_isActive?"#202535":obj.upgraded?"#181e2e":"#252a38";
                        const aRight=_isActive?"#101520":obj.upgraded?"#0c1018":"#151820";
                        const aTop=_isActive?"#2e3548":obj.upgraded?"#232a3e":"#303548";
                        // Mast right face
                        ctx.fillStyle=aRight; ctx.beginPath();
                        ctx.moveTo(px+2,_base); ctx.lineTo(px+2+aD,_base+aD/2);
                        ctx.lineTo(px+2+aD,_base-55+aD/2); ctx.lineTo(px+2,_base-55); ctx.closePath(); ctx.fill();
                        // Mast front face
                        ctx.fillStyle=aFront; ctx.fillRect(px-2,_base-55,4,55);
                        // Dome cap right
                        ctx.fillStyle=aRight; ctx.beginPath(); ctx.ellipse(px+aD/2,_base-55+aD/4,4,2,0,0,Math.PI*2); ctx.fill();
                        // Dome cap front
                        ctx.fillStyle=aFront; ctx.beginPath(); ctx.arc(px,_base-55,4,Math.PI,0); ctx.fill();
                        // Three crossbars (bottom to top) each with 3 faces
                        const _cbars=[{y:_base-16,hw:5},{y:_base-30,hw:7},{y:_base-44,hw:9}];
                        for (const cb of _cbars) {
                            ctx.fillStyle=aRight; ctx.beginPath();
                            ctx.moveTo(px+cb.hw,cb.y); ctx.lineTo(px+cb.hw+aD*0.7,cb.y+aD*0.35);
                            ctx.lineTo(px+cb.hw+aD*0.7,cb.y-2+aD*0.35); ctx.lineTo(px+cb.hw,cb.y-2); ctx.closePath(); ctx.fill();
                            ctx.fillStyle=aFront; ctx.fillRect(px-cb.hw,cb.y-2,cb.hw*2,2);
                            ctx.fillStyle=aTop; ctx.beginPath();
                            ctx.moveTo(px-cb.hw,cb.y-2); ctx.lineTo(px+cb.hw,cb.y-2);
                            ctx.lineTo(px+cb.hw+aD*0.7,cb.y-2+aD*0.35); ctx.lineTo(px-cb.hw+aD*0.7,cb.y-2+aD*0.35); ctx.closePath(); ctx.fill();
                        }
                        break;
                    }
                    case "shrine": {
                        // Stepped isometric pyramid with faceted floating gem
                        const shD=6;
                        const shFront=_isActive?"#1a1020":obj.upgraded?"#130c1a":"#1e1428";
                        const shRight=_isActive?"#0e0814":obj.upgraded?"#0a060e":"#130d1a";
                        const shTop=_isActive?"#261828":obj.upgraded?"#1c1222":"#2a1e34";
                        const _gemFloat=_pulse*3;
                        // Step 1 (base, wide)
                        ctx.fillStyle=shRight; ctx.beginPath();
                        ctx.moveTo(px+10,_base); ctx.lineTo(px+10+shD,_base+shD/2);
                        ctx.lineTo(px+10+shD,_base-18+shD/2); ctx.lineTo(px+10,_base-18); ctx.closePath(); ctx.fill();
                        ctx.fillStyle=shFront; ctx.fillRect(px-10,_base-18,20,18);
                        ctx.fillStyle=shTop; ctx.beginPath();
                        ctx.moveTo(px-10,_base-18); ctx.lineTo(px+10,_base-18);
                        ctx.lineTo(px+10+shD,_base-18+shD/2); ctx.lineTo(px-10+shD,_base-18+shD/2); ctx.closePath(); ctx.fill();
                        // Step 2 (mid, narrow)
                        ctx.fillStyle=shRight; ctx.beginPath();
                        ctx.moveTo(px+7,_base-18); ctx.lineTo(px+7+shD,_base-18+shD/2);
                        ctx.lineTo(px+7+shD,_base-26+shD/2); ctx.lineTo(px+7,_base-26); ctx.closePath(); ctx.fill();
                        ctx.fillStyle=shFront; ctx.fillRect(px-7,_base-26,14,8);
                        ctx.fillStyle=shTop; ctx.beginPath();
                        ctx.moveTo(px-7,_base-26); ctx.lineTo(px+7,_base-26);
                        ctx.lineTo(px+7+shD,_base-26+shD/2); ctx.lineTo(px-7+shD,_base-26+shD/2); ctx.closePath(); ctx.fill();
                        // Floating gem — faceted octahedron projection
                        const gy=_base-36-_gemFloat;
                        const gr=6;
                        const gFront=_isActive?"#2a183a":obj.upgraded?"#1e1028":"#281835";
                        const gRight=_isActive?"#180c20":obj.upgraded?"#100818":"#180e28";
                        const gLeft=_isActive?"#3a2050":obj.upgraded?"#2a1838":"#382248";
                        // Right facet
                        ctx.fillStyle=gRight; ctx.beginPath();
                        ctx.moveTo(px,gy-gr); ctx.lineTo(px+gr,gy); ctx.lineTo(px+gr+2,gy+1); ctx.lineTo(px+2,gy-gr+1); ctx.closePath(); ctx.fill();
                        // Front face
                        ctx.fillStyle=gFront; ctx.beginPath();
                        ctx.moveTo(px,gy-gr); ctx.lineTo(px+gr,gy); ctx.lineTo(px,gy+gr); ctx.lineTo(px-gr,gy); ctx.closePath(); ctx.fill();
                        // Left highlight facet
                        ctx.fillStyle=gLeft; ctx.globalAlpha=0.65; ctx.beginPath();
                        ctx.moveTo(px,gy-gr); ctx.lineTo(px-gr,gy); ctx.lineTo(px-gr/2,gy-gr*0.25); ctx.lineTo(px-gr*0.25,gy-gr*0.7); ctx.closePath(); ctx.fill();
                        ctx.globalAlpha=1;
                        break;
                    }
                    case "conduit": {
                        // Industrial pipe cluster — ellipse caps + iso side faces
                        const cD=5;
                        const cFront=_isActive?"#101820":obj.upgraded?"#0c1418":"#151e24";
                        const cRight=_isActive?"#080e14":obj.upgraded?"#060a0e":"#0c1318";
                        const cTop=_isActive?"#1c2a38":obj.upgraded?"#162030":"#202d38";
                        const cJoint=_isActive?"#1a2830":"#202830";
                        // Helper: draw one isometric pipe
                        const _drawPipe=(cx,pw,ph)=>{
                            ctx.fillStyle=cRight; ctx.beginPath();
                            ctx.moveTo(cx+pw,_base); ctx.lineTo(cx+pw+cD,_base+cD/2);
                            ctx.lineTo(cx+pw+cD,_base-ph+cD/2); ctx.lineTo(cx+pw,_base-ph); ctx.closePath(); ctx.fill();
                            ctx.fillStyle=cFront; ctx.fillRect(cx-pw,_base-ph,pw*2,ph);
                            ctx.fillStyle=cTop; ctx.beginPath(); ctx.ellipse(cx+cD/2,_base-ph+cD/4,pw,pw*0.55,0,0,Math.PI*2); ctx.fill();
                            // Front lip ellipse cap
                            ctx.fillStyle=cFront; ctx.beginPath(); ctx.ellipse(cx,_base-ph,pw,pw*0.45,0,0,Math.PI*2); ctx.fill();
                        };
                        _drawPipe(px-6,3,45);  // tall left pipe
                        _drawPipe(px+6,3,35);  // medium right pipe
                        _drawPipe(px,2.5,25);  // short centre pipe
                        // Horizontal connector band
                        ctx.fillStyle=cRight; ctx.beginPath();
                        ctx.moveTo(px+9,_base-22); ctx.lineTo(px+9+cD*0.6,_base-22+cD*0.3);
                        ctx.lineTo(px+9+cD*0.6,_base-19+cD*0.3); ctx.lineTo(px+9,_base-19); ctx.closePath(); ctx.fill();
                        ctx.fillStyle=cJoint; ctx.fillRect(px-9,_base-22,18,3);
                        ctx.fillStyle=cTop; ctx.beginPath();
                        ctx.moveTo(px-9,_base-22); ctx.lineTo(px+9,_base-22);
                        ctx.lineTo(px+9+cD*0.6,_base-22+cD*0.3); ctx.lineTo(px-9+cD*0.6,_base-22+cD*0.3); ctx.closePath(); ctx.fill();
                        break;
                    }
                }
                ctx.restore();

                // ── TOP EFFECTS: glows, orbs, labels ──
                // Orb position varies by style
                let _orbY;
                if (_style==="sentinel") _orbY=_base-54;
                else if (_style==="spire") _orbY=_base-57;
                else if (_style==="monolith") _orbY=_base-42;
                else if (_style==="antenna") _orbY=_base-57;
                else if (_style==="shrine") _orbY=_base-42-_pulse*3;
                else _orbY=_base-47; // conduit

                if (_isActive) {
                    // Glowing orb at structure top
                    const _orbR=obj.waveMode?6+_wTier:5;
                    ctx.save(); ctx.shadowColor=_acol; ctx.shadowBlur=(obj.waveMode?14:8)+_pulse*6;
                    ctx.fillStyle=_acol; ctx.globalAlpha=0.7+_pulse*0.3;
                    ctx.beginPath(); ctx.arc(px,_orbY,_orbR,0,Math.PI*2); ctx.fill();
                    ctx.restore();
                    // Element + tier label
                    const PYLON_FX_TIER={fire:["fire wall","heavy burn","ignite spread"],ice:["ice field","chill zone","deep freeze"],electric:["arc chain","arc boost","max arc"],core:["shield barrier","fast shields","regen shields"],flux:["gravity well","chain pull","vortex"],toxic:["corrodes enemies","shred+plague","plague cloud"]};
                    const PYLON_FX2={fire:"fire wall",ice:"ice field",electric:"arc chain",core:"shield barrier",flux:"gravity well",toxic:"corrodes enemies"};
                    const el0=obj.attackModeElement||"";
                    const _wTierBadge=obj.waveMode&&_wTier>0?[" T-I"," T-II"," T-III"][_wTier-1]:"";
                    const _tierDesc=obj.waveMode?(_wTier>0?(PYLON_FX_TIER[el0]?.[_wTier-1]||""):(PYLON_FX_TIER[el0]?.[0]||"")):(PYLON_FX2[el0]||"");
                    ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle=_acol; ctx.font="bold 9px monospace"; ctx.textAlign="center";
                    ctx.fillText(el0.toUpperCase()+_wTierBadge,px,_orbY-12);
                    ctx.font="7px monospace"; ctx.globalAlpha=0.7;
                    ctx.fillText(_tierDesc,px,_orbY-3);
                    ctx.restore();
                    // Seasoned gold bands at base
                    if ((obj.seasoned||0)>0) {
                        const sLevel=Math.min(3,obj.seasoned);
                        ctx.save(); ctx.strokeStyle="#ffd700"; ctx.lineWidth=1+sLevel*0.5;
                        ctx.globalAlpha=0.55+_pulse*0.25; ctx.shadowColor="#ffd700"; ctx.shadowBlur=4+sLevel*3;
                        for (let _si=0;_si<sLevel;_si++) { ctx.beginPath(); ctx.rect(px-8-_si,_base-12-_si*4,16+_si*2,2); ctx.stroke(); }
                        ctx.shadowBlur=0; ctx.restore();
                    }
                } else if (obj.upgraded) {
                    // Dormant upgraded state — style-specific cyan aura
                    ctx.save(); ctx.globalAlpha=0.2+_pulse*0.12; ctx.fillStyle="#0ff";
                    ctx.shadowColor="#0ff"; ctx.shadowBlur=14;
                    ctx.beginPath(); ctx.arc(px,_orbY,10,0,Math.PI*2); ctx.fill();
                    ctx.globalAlpha=0.8; ctx.beginPath(); ctx.arc(px,_orbY,3,0,Math.PI*2); ctx.fill();
                    ctx.restore();
                    // Style-specific upgraded detail
                    if (_style==="monolith") {
                        // Glowing runes
                        ctx.save(); ctx.strokeStyle="#0ff"; ctx.lineWidth=1;
                        ctx.globalAlpha=0.4+_pulse*0.3; ctx.shadowColor="#0ff"; ctx.shadowBlur=5;
                        ctx.beginPath(); ctx.moveTo(px-7,_base-30); ctx.lineTo(px+7,_base-30); ctx.stroke();
                        ctx.beginPath(); ctx.moveTo(px,_base-38); ctx.lineTo(px,_base-14); ctx.stroke();
                        ctx.restore();
                    } else if (_style==="spire") {
                        // Inner crystal glow
                        ctx.save(); ctx.globalAlpha=0.15+_pulse*0.1; ctx.fillStyle="#88aaff";
                        ctx.shadowColor="#88aaff"; ctx.shadowBlur=8;
                        ctx.beginPath(); ctx.moveTo(px,_base-55); ctx.lineTo(px+9,_base-25); ctx.lineTo(px-9,_base-25); ctx.closePath(); ctx.fill();
                        ctx.restore();
                    } else if (_style==="shrine") {
                        // Orbiting spark around gem
                        const _angle=frame*0.05;
                        ctx.save(); ctx.globalAlpha=0.7; ctx.fillStyle="#0ff";
                        ctx.shadowColor="#0ff"; ctx.shadowBlur=6;
                        ctx.beginPath(); ctx.arc(px+Math.cos(_angle)*9,_orbY+Math.sin(_angle)*5,2,0,Math.PI*2); ctx.fill();
                        ctx.restore();
                    } else if (_style==="conduit") {
                        // Energy flowing through left pipe
                        ctx.save(); ctx.strokeStyle="#0ff"; ctx.lineWidth=2;
                        ctx.globalAlpha=0.3+_pulse*0.3; ctx.shadowColor="#0ff"; ctx.shadowBlur=4;
                        ctx.beginPath(); ctx.moveTo(px-6,_base-40); ctx.lineTo(px-6,_base-5); ctx.stroke();
                        ctx.restore();
                    } else if (_style==="sentinel") {
                        // Battlements light up
                        ctx.save(); ctx.strokeStyle="#0ff"; ctx.lineWidth=1;
                        ctx.globalAlpha=0.5+_pulse*0.3; ctx.shadowColor="#0ff"; ctx.shadowBlur=5;
                        ctx.strokeRect(px-7,_base-52,4,4); ctx.strokeRect(px+3,_base-52,4,4);
                        ctx.restore();
                    } else if (_style==="antenna") {
                        // Dish emits spinning energy ring
                        ctx.save(); ctx.strokeStyle="#0ff"; ctx.lineWidth=1.5;
                        ctx.globalAlpha=0.3+_pulse*0.3; ctx.shadowColor="#0ff"; ctx.shadowBlur=6;
                        ctx.beginPath(); ctx.arc(px,_base-55,8+_pulse*4,0,Math.PI*2); ctx.stroke();
                        ctx.restore();
                    }
                } else {
                    // Base state — team color orb indicator
                    const dist2=Math.sqrt((obj.x-player.visualX)**2+(obj.y-player.visualY)**2);
                    const amb2=Math.max(0.1,0.8-dist2/RENDER_DIST);
                    ctx.fillStyle=obj.pillarCol;
                    ctx.shadowColor=obj.pillarCol; ctx.shadowBlur=8*amb2;
                    ctx.beginPath(); ctx.arc(px,_orbY,3,0,Math.PI*2); ctx.fill();
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

                // 1b. Wall circuit interconnect — background-style PCB traces on the south wall face.
                // Uses isometric shear so traces lie naturally on the wall plane.
                // Skip on rack tiles to avoid bleed through the semi-transparent panel.
                if (!isRackX) {
                    // W corner of south face — origin of the wall-space coordinate system.
                    // Wall-space: x ∈ [0..TILE_W], y ∈ [0..WH] (y=0 at base, y=WH at top).
                    // Transform: screen_x = x + WX,  screen_y = 0.5*x − y + WY
                    const WX = px - TILE_W, WY = py + TILE_H;
                    // Seeded deterministic RNG per tile — same pattern every frame, different per column.
                    const rng = _mkCircuitRng(((Math.abs(Math.floor(obj.x)) * 0xDEAD + 0xBEEF) >>> 0));
                    const WPAL = ['#0f8','#0df','#0fa','#3fc','#0cf','#2fd','#1ee'];

                    ctx.save();
                    ctx.transform(1, 0.5, 0, -1, WX, WY); // isometric shear onto wall face
                    ctx.lineCap = 'square'; ctx.lineJoin = 'miter';

                    // ── Main horizontal bus lines — fixed heights, continuous across tiles ──
                    const busY = [WH*0.18, WH*0.40, WH*0.65, WH*0.86];
                    const busC = ['#0f8', '#0df', '#0fa', '#2fd'];
                    for (let bi = 0; bi < busY.length; bi++) {
                        ctx.globalAlpha = 0.20 * amb;
                        ctx.strokeStyle = busC[bi];
                        ctx.lineWidth   = 1.1;
                        ctx.beginPath();
                        ctx.moveTo(-2, busY[bi]);   // extend 2px past tile edge for seamless joins
                        ctx.lineTo(62, busY[bi]);
                        ctx.stroke();
                    }

                    // ── Tile-local jog / zigzag traces (seeded, deterministic) ──
                    const numJogs = 1 + (rng() * 3 | 0);
                    for (let j = 0; j < numJogs; j++) {
                        const jx  = 6 + rng() * 48;
                        const bi0 = rng() * busY.length | 0;
                        const bi1 = ((bi0 + 1 + (rng() * (busY.length - 1) | 0)) % busY.length);
                        const y0  = busY[bi0], y1 = busY[bi1];
                        const col = WPAL[rng() * WPAL.length | 0];
                        const hasZig = rng() > 0.45;
                        ctx.globalAlpha = (0.14 + rng() * 0.13) * amb;
                        ctx.strokeStyle = col; ctx.lineWidth = 0.9;
                        ctx.beginPath(); ctx.moveTo(jx, y0);
                        if (hasZig) {
                            const midY = y0 + (y1 - y0) * (0.35 + rng() * 0.30);
                            const xOff = (rng() - 0.5) * 18;
                            ctx.lineTo(jx, midY); ctx.lineTo(jx + xOff, midY); ctx.lineTo(jx + xOff, y1);
                        } else { ctx.lineTo(jx, y1); }
                        ctx.stroke();
                        // Via pads at endpoints
                        ctx.globalAlpha = 0.36 * amb; ctx.fillStyle = col;
                        ctx.beginPath(); ctx.arc(jx, y0, 2.2, 0, Math.PI*2); ctx.fill();
                        ctx.beginPath(); ctx.arc(hasZig ? jx+(rng()-0.5)*18 : jx, y1, 2.2, 0, Math.PI*2); ctx.fill();
                        ctx.globalAlpha = 0.18 * amb; ctx.lineWidth = 0.5;
                        ctx.beginPath(); ctx.arc(jx, y0, 4.2, 0, Math.PI*2); ctx.stroke();
                    }

                    // ── Cluster / radial node — one every ~7 tiles ──
                    const rng2 = _mkCircuitRng(((Math.abs(Math.floor(obj.x)) * 0xF00BA5 + 0x1EAF) >>> 0));
                    if ((Math.abs(Math.floor(obj.x)) % 7) < 1 || rng2() > 0.82) {
                        const cx2 = 14 + rng2() * 32, cy2 = 32 + rng2() * 52;
                        const rad = 7 + rng2() * 10, col2 = WPAL[rng2() * WPAL.length | 0];
                        const arms = 4 + (rng2() * 4 | 0);
                        ctx.strokeStyle = col2; ctx.fillStyle = col2;
                        for (let a = 0; a < arms; a++) {
                            const ang = (a / arms) * Math.PI * 2 + rng2() * 0.5;
                            const nx = cx2 + Math.cos(ang) * rad * (0.5 + rng2() * 0.5);
                            const ny = cy2 + Math.sin(ang) * rad * (0.5 + rng2() * 0.5);
                            ctx.lineWidth = 0.8; ctx.globalAlpha = 0.16 * amb;
                            ctx.beginPath(); ctx.moveTo(cx2, cy2); ctx.lineTo(nx, cy2); ctx.lineTo(nx, ny); ctx.stroke();
                            ctx.globalAlpha = 0.20 * amb;
                            ctx.beginPath(); ctx.arc(nx, ny, 1.4, 0, Math.PI*2); ctx.fill();
                        }
                        ctx.globalAlpha = 0.26 * amb;
                        ctx.beginPath(); ctx.arc(cx2, cy2, 2.8, 0, Math.PI*2); ctx.fill();
                        ctx.lineWidth = 0.5; ctx.globalAlpha = 0.16 * amb;
                        ctx.beginPath(); ctx.arc(cx2, cy2, 5.0, 0, Math.PI*2); ctx.stroke();
                    }

                    // ── Pulsing tracers — bright packets flowing along bus lines ──
                    // Each of 4 tracers has a unique speed; global frame gives cross-tile continuity.
                    for (let ti = 0; ti < 4; ti++) {
                        const speed    = 0.45 + ti * 0.30;
                        const tGlobalX = (frame * speed + ti * 1317.5) % (300 * 60); // wrap at 300 tiles wide
                        const tLocalX  = tGlobalX - Math.abs(Math.floor(obj.x)) * 60;
                        if (tLocalX > -18 && tLocalX < 78) {
                            const bi  = ti % busY.length;
                            const col = busC[bi];
                            const fade = Math.max(0, 1 - Math.abs(tLocalX - 30) / 48);
                            ctx.globalAlpha = 0.72 * amb * fade;
                            ctx.shadowColor = col; ctx.shadowBlur = 7;
                            ctx.strokeStyle = col; ctx.lineWidth = 2.0;
                            ctx.beginPath();
                            ctx.moveTo(tLocalX - 10, busY[bi]);
                            ctx.lineTo(tLocalX + 3,  busY[bi]);
                            ctx.stroke();
                            ctx.shadowBlur = 0;
                        }
                    }

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

                // ── SHARD PANEL — mounted on south wall face, covers interconnect partially ──
                if (!isRackX && _wallPanelMap) {
                    const _panel = _wallPanelMap.get(Math.round(obj.x));
                    if (_panel) {
                        const activated = _panel.panelActivated;
                        const _blink    = Math.sin(frame * 0.12 + xi * 1.7);
                        const rimCol    = activated ? '#334' : '#0f8';
                        const screenCol = activated ? '#111' : '#001a0a';
                        const ledCol    = activated ? '#444' : (_blink > 0.6 ? '#00ff88' : '#00cc66');
                        // Wall-space origin (same as circuit section)
                        const WX = px - TILE_W, WY = py + TILE_H;
                        // Panel center in wall-space: x=30 (center), y=WH*0.52 (mid-height)
                        const pcx = 30, pcy = WH * 0.52, pw = 24, ph = 36;

                        ctx.save();
                        ctx.transform(1, 0.5, 0, -1, WX, WY);
                        ctx.globalAlpha = 0.92 * amb;
                        ctx.shadowColor = activated ? 'transparent' : '#00ff88';
                        ctx.shadowBlur  = activated ? 0 : 6 + _blink * 5;

                        // Body
                        ctx.fillStyle = activated ? '#181f1a' : '#0a1a10';
                        ctx.fillRect(pcx - pw/2, pcy - ph/2, pw, ph);
                        // Rim
                        ctx.strokeStyle = rimCol; ctx.lineWidth = 1;
                        ctx.strokeRect(pcx - pw/2, pcy - ph/2, pw, ph);
                        // Screen area
                        ctx.fillStyle = screenCol;
                        ctx.fillRect(pcx - pw/2 + 2, pcy - ph/2 + 3, pw - 4, 13);

                        if (!activated) {
                            // Scrolling scan line
                            const lineY = pcy - ph/2 + 3 + ((frame * 0.6 + xi * 5) % 13);
                            ctx.globalAlpha = 0.35;
                            ctx.fillStyle = '#00ff88';
                            ctx.fillRect(pcx - pw/2 + 2, lineY, pw - 4, 1);
                            ctx.globalAlpha = 0.92 * amb;
                            // LED
                            ctx.fillStyle = ledCol;
                            ctx.shadowColor = ledCol; ctx.shadowBlur = 4;
                            ctx.beginPath(); ctx.arc(pcx + pw/2 - 4, pcy - ph/2 + 5, 2, 0, Math.PI*2); ctx.fill();
                            ctx.shadowBlur = 0;
                        }
                        ctx.restore();

                        // Siphon progress wire + label — only shown while player is actively siphoning
                        const siphonProg0 = _panel.siphonProgress || 0;
                        const pDist = Math.hypot(player.x - _panel.x, player.y - _panel.y);
                        if (!activated) {
                            // Compute screen-space center of panel from wall-space (pcx, pcy)
                            const spx = pcx + WX;
                            const spy = 0.5 * pcx - pcy + WY;
                            // Panel bottom-center in screen space (bottom edge of panel body)
                            const wbotY = pcy + ph / 2;
                            const wireSx = spx;
                            const wireSy = 0.5 * pcx - wbotY + WY;

                            // Only draw the cable/animation when siphon is actively in progress
                            if (siphonProg0 > 0 && pDist < 2.5) {
                                const _wPulse = 0.4 + 0.4 * Math.sin(frame * 0.14);
                                // Stub endpoint: short droop below panel bottom
                                const stubEndX = wireSx + 5;
                                const stubEndY = wireSy + 20;

                                ctx.save();
                                ctx.setTransform(1, 0, 0, 1, 0, 0);
                                ctx.lineCap = 'round'; ctx.lineJoin = 'round';

                                // Extend wire all the way to the player (always screen-center)
                                const plx = canvas.width / 2;
                                const ply = canvas.height / 2 - 18;
                                const cDist = Math.hypot(plx - stubEndX, ply - stubEndY);
                                const sag   = Math.min(38, cDist * 0.16);
                                const midX  = (stubEndX + plx) / 2;
                                const midY  = (stubEndY + ply) / 2 + sag;

                                // Two cable bundles for physical thickness
                                const bundles = [
                                    {ox: -2, oy: -1, w: 2.8, alpha: 0.88},
                                    {ox:  2, oy:  1, w: 1.8, alpha: 0.70}
                                ];
                                bundles.forEach(b => {
                                    const sx = stubEndX + b.ox, sy = stubEndY + b.oy;
                                    const ex = plx + b.ox,      ey = ply + b.oy;
                                    const cmy = midY + b.oy;
                                    // Dark cable core
                                    ctx.strokeStyle = '#0d1410'; ctx.lineWidth = b.w + 1.4;
                                    ctx.globalAlpha = b.alpha; ctx.shadowBlur = 0;
                                    ctx.beginPath();
                                    ctx.moveTo(sx, sy);
                                    ctx.bezierCurveTo(midX + b.ox, cmy, midX + b.ox, cmy, ex, ey);
                                    ctx.stroke();
                                    // Coloured glow sheath
                                    ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 0.85;
                                    ctx.globalAlpha = 0.20 + _wPulse * 0.18;
                                    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 5;
                                    ctx.beginPath();
                                    ctx.moveTo(sx, sy);
                                    ctx.bezierCurveTo(midX + b.ox, cmy, midX + b.ox, cmy, ex, ey);
                                    ctx.stroke();
                                });

                                // Animated energy packets travelling from panel → player
                                for (let _i = 0; _i < 5; _i++) {
                                    const _t  = ((frame * 0.022 + _i * 0.2) % 1);
                                    const _t1 = 1 - _t, _t2 = _t;
                                    // Cubic bezier interpolation along the main cable path
                                    const _bx = _t1*_t1*_t1*stubEndX + 3*_t1*_t1*_t2*midX + 3*_t1*_t2*_t2*midX + _t2*_t2*_t2*plx;
                                    const _by = _t1*_t1*_t1*stubEndY + 3*_t1*_t1*_t2*midY + 3*_t1*_t2*_t2*midY + _t2*_t2*_t2*ply;
                                    ctx.fillStyle = '#00ff88';
                                    ctx.globalAlpha = 0.65 + _wPulse * 0.35;
                                    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 8;
                                    ctx.beginPath(); ctx.arc(_bx, _by, 2.2, 0, Math.PI * 2); ctx.fill();
                                }
                                // Socket ring at player end
                                ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 1.2;
                                ctx.globalAlpha = 0.55 + _wPulse * 0.35;
                                ctx.shadowBlur = 6;
                                ctx.beginPath(); ctx.arc(plx, ply, 5, 0, Math.PI * 2); ctx.stroke();

                                ctx.shadowBlur = 0;
                                ctx.restore();

                                const hint = 0.4 + 0.4 * Math.sin(frame * 0.2);
                                const barW = 28, barH = 3;
                                const fill = Math.min(1, siphonProg0 / 150) * barW;
                                ctx.save();
                                ctx.globalAlpha = hint;
                                ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 1.5;
                                ctx.beginPath(); ctx.ellipse(spx, spy, 16, 7, 0, 0, Math.PI * 2); ctx.stroke();
                                ctx.setTransform(1, 0, 0, 1, 0, 0);
                                ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
                                ctx.fillStyle = '#00ff88'; ctx.globalAlpha = hint;
                                ctx.fillStyle = '#111'; ctx.globalAlpha = 0.8;
                                ctx.fillRect(spx - barW / 2, spy - 26, barW, barH);
                                ctx.fillStyle = '#00ff88'; ctx.globalAlpha = hint;
                                ctx.fillRect(spx - barW / 2, spy - 26, fill, barH);
                                ctx.fillStyle = '#00ff88';
                                ctx.fillText('SIPHON', spx, spy - 30);
                                ctx.restore();
                            }
                        }
                    }
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
    if (alertActive) {
        // Flashing alert banner
        const _af = 0.6 + 0.4 * Math.sin(frame * 0.3);
        ctx.globalAlpha = _af;
        ctx.fillStyle = "#ff2200";
        ctx.font = "bold 13px monospace";
        const _label = alertType === "proximity" ? "PROXIMITY ALARM" :
                       alertType === "zone"      ? "ZONE ALARM"      : "FACILITY BREACH";
        ctx.fillText("⚠ " + _label, 230, 58);
        ctx.globalAlpha = 1;
        ctx.fillStyle = "#f84";
        ctx.font = "13px monospace";
        ctx.fillText("Kill "+nightKillCount+"/"+nightEnemiesTarget, 230, 74);
    } else {
        ctx.fillStyle = "#0f8";
        ctx.fillText("Best Zone: "+gameState.highestZoneCleared, 230, 58);
    }
    ctx.restore();

    // ── NETWORK STATUS HUD ──
    drawNetworkStatusHUD();

    // ── SMOKE ──
    // Smoke is stored as world anchor (wx,wy) + screen offset (ox,oy) so particles
    // stay fixed to their vent position regardless of camera movement.
    // Iterate backwards so splice doesn't skip elements.
    for (let i=smoke.length-1; i>=0; i--) {
        const sm=smoke[i];
        sm.ox+=sm.vox; sm.oy+=sm.voy; sm.life-=0.025; sm.size+=0.25;
        if(sm.life<=0){smoke.splice(i,1);continue;}
        const bpx=(sm.wx-player.visualX-(sm.wy-player.visualY))*TILE_W+canvas.width/2;
        const bpy=(sm.wx-player.visualX+(sm.wy-player.visualY))*TILE_H+canvas.height/2;
        ctx.save(); ctx.globalAlpha=sm.life; ctx.fillStyle=cfg.smokeColor;
        ctx.beginPath(); ctx.ellipse(bpx+sm.ox,bpy+sm.oy,sm.size,sm.size*0.5,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }

    // ── FRAGMENTS ──
    // Iterate backwards so splice doesn't skip elements.
    for (let i=fragments.length-1; i>=0; i--) {
        const f=fragments[i];
        f.x+=f.vx; f.y+=f.vy; f.vy+=0.5; f.life-=0.02;
        ctx.fillStyle=f.col; ctx.globalAlpha=f.life; ctx.fillRect(f.x,f.y,6,6);
        if(f.life<=0) fragments.splice(i,1);
    }
    ctx.globalAlpha=1;

    // ── RESPAWN QUEUE ──
    for(let i=respawnQueue.length-1;i>=0;i--) {
        const entry=respawnQueue[i]; entry.timer--;
        if(entry.timer<=0){
            if (entry.isClone && entry.speciesName) {
                // Respawn as clone
                const speciesDef = SPECIES[entry.speciesName];
                if (!speciesDef) { respawnQueue.splice(i,1); continue; }
                const classDef   = speciesDef[entry.className];
                if (!classDef) { respawnQueue.splice(i,1); continue; }
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
                const hp          = entry.ghostphageLife ? 1
                                  : activeCrystalBuild==="echo_shell" ? Math.max(1, Math.ceil(stats.hp * 0.5))
                                  : stats.hp;
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
        p.frame = (p.frame || 0) + 1;
        // Arc height for parabolic bombs (screen-space offset only)
        if (p.arcData) {
            const arcT = Math.max(0, 1 - p.life / p.arcData.totalFrames);
            p.arcData.screenOffset = p.arcData.peakHeight * Math.sin(arcT * Math.PI);
        }
        // Screen coords
        const sx=(p.x-player.visualX-(p.y-player.visualY))*TILE_W+canvas.width/2;
        const sy=(p.x-player.visualX+(p.y-player.visualY))*TILE_H+canvas.height/2 - 40;
        // Draw element-specific projectile
        _drawFollowerProjectile(ctx, p, sx, sy);
        // Landing callback for arc bombs when they expire
        if (p.life <= 0 && p.onLand) p.onLand();
        // Hit detection (skipped for bombs that trigger onLand instead)
        let hit = false;
        if (!p.noHitDetect) {
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
        }
        return !hit && p.life > 0;
    });

    ctx.restore();

    // ── OVERLAYS ──
    drawElementEffects();
    drawFloatingTexts();
    // ── PLAYER STUN FLASH — red vignette while stunned ──
    if (player.stunned > 0) {
        const stunAlpha = Math.min(0.35, (player.stunned / 180) * 0.35) * (0.5 + 0.5 * Math.sin(frame * 0.25));
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = `rgba(220,30,30,${stunAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#ff4444";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText("◈ STUNNED", canvas.width/2, canvas.height/2 - 40);
        ctx.restore();
    }
    drawCrystalButton();
    drawClonesBlob();
    drawCloneMenu();
    drawRadialMenu();
    drawCrystalPanel();
    drawHoldLine();
    drawGestureFeedback();
    drawFollowerElementUI();
    drawElementPicker();
    drawPylonConfirm();
    drawInfoPanel();
    drawTraps();
    drawShopButton();
    drawCampButton();
    drawSettingsButton();
    drawSettingsPanel();
    drawCampMenu();
    drawTrapPicker();
    updatePreview();
}

// ─────────────────────────────────────────────────────────
//  TERRITORY / CAPTURE SYSTEM
// ─────────────────────────────────────────────────────────

// Recalculates tile.territory for all floor tiles.
// Player territory = within 3 tiles of green pylon OR captured node.
// Enemy territory  = within 4 tiles of active nest OR uncaptured signal tower.
// Contested        = overlap of both.
function updateTerritory() {
    // Reset
    world.forEach(t => { if (t.type === 'floor') t.territory = null; });

    const greenPylons = _pillarCache.filter(t => t.pillarTeam === 'green');
    const activeNests = _nestCache.filter(t => t.nestHealth > 0);

    world.forEach(t => {
        if (t.type !== 'floor') return;
        let isPlayer = false, isEnemy = false;

        // Player territory: green pylon within 3 tiles
        for (const p of greenPylons) {
            if (Math.hypot(p.x - t.x, p.y - t.y) <= 3) { isPlayer = true; break; }
        }
        // Player territory: captured node within 3 tiles
        if (!isPlayer) {
            for (const n of capturedNodes) {
                if (Math.hypot(n.x - t.x, n.y - t.y) <= 3) { isPlayer = true; break; }
            }
        }

        // Enemy territory: active nest within 4 tiles
        for (const n of activeNests) {
            if (Math.hypot(n.x - t.x, n.y - t.y) <= 4) { isEnemy = true; break; }
        }
        // Enemy territory: uncaptured signal tower within 4 tiles
        if (!isEnemy) {
            for (const st of signalTowers) {
                if (!st.captured && Math.hypot(st.x - t.x, st.y - t.y) <= 4) { isEnemy = true; break; }
            }
        }

        if (isPlayer && isEnemy)  t.territory = 'contested';
        else if (isPlayer)         t.territory = 'player';
        else if (isEnemy)          t.territory = 'enemy';
        else                       t.territory = null;
    });
}

// Increments capture progress when followers stand on a capturable tile.
// Progress halts while an enemy is adjacent (within 1.5 tiles).
function updateCaptureProgress() {
    _capturableNodeCache.forEach(t => {
        if (t.captured) {
            // Reverse capture: predators near a player-controlled node reclaim it
            let nearPredCount = 0;
            actors.forEach(a => {
                if (!a.dead && a instanceof Predator && a.team !== 'green' && !a.isClone &&
                    Math.hypot(a.x - t.x, a.y - t.y) < 1.2) nearPredCount++;
            });
            if (nearPredCount > 0) {
                t.captureProgress = Math.max(0, t.captureProgress - 0.5 * nearPredCount);
                if (t.captureProgress <= 0) {
                    t.captured = false;
                    const idx = capturedNodes.findIndex(n => n.x === t.x && n.y === t.y);
                    if (idx >= 0) capturedNodes.splice(idx, 1);
                    floatingTexts.push({
                        x: canvas.width / 2, y: canvas.height / 2 - 80,
                        text: t.nodeType === 'signal_tower' ? '◈ TOWER RECLAIMED' : '◈ NODE RECLAIMED',
                        color: '#ff4422', life: 200, vy: -0.3
                    });
                }
            }
            return;
        }

        // Gather followers assigned to capture this node
        const onTile = followers.filter(f =>
            !f.dead && f.job && f.job.type === 'capture_node' && f.job.target === t &&
            Math.hypot(f.x - t.x, f.y - t.y) < 1.2
        );
        t.capturingFollowers = onTile;

        // Halt if an enemy is within 1.5 tiles
        const interrupted = actors.some(a =>
            !a.dead &&
            (a.team === 'red' || (a instanceof Predator && a.team !== 'green' && !a.isClone)) &&
            Math.hypot(a.x - t.x, a.y - t.y) < 1.5
        );

        if (onTile.length > 0 && !interrupted) {
            t.captureProgress = Math.min(100, t.captureProgress + 0.4 * onTile.length);
        }

        if (t.captureProgress >= 100 && !t.captured) {
            t.captured = true;
            t.captureProgress = 100;
            capturedNodes.push({ type: t.nodeType, x: t.x, y: t.y });
            // Clear capture jobs
            followers.forEach(f => { if (f.job && f.job.type === 'capture_node' && f.job.target === t) f.job = null; });
            floatingTexts.push({
                x: canvas.width / 2, y: canvas.height / 2 - 80,
                text: t.nodeType === 'signal_tower' ? '◈ TOWER HACKED' : '◈ NODE CAPTURED',
                color: '#00ccff', life: 200, vy: -0.3
            });
        }
    });
}

// Grants +25% ATK to enemy predators within 4 tiles of an uncaptured signal tower.
// Resets the boost each frame before re-applying so it doesn't stack.
function applySignalTowerBuff() {
    // First: restore base power for all predators previously buffed
    actors.forEach(a => {
        if (a instanceof Predator && !a.dead && a.team !== 'green' && a._signalBuffed) {
            a.power = a._baseSignalPower || a.power;
            a._signalBuffed = false;
        }
    });
    // Then: apply buff for predators in range of uncaptured towers
    signalTowers.forEach(st => {
        if (st.captured) return;
        actors.forEach(a => {
            if (!(a instanceof Predator) || a.dead || a.team === 'green' || a.isClone) return;
            if (Math.hypot(a.x - st.x, a.y - st.y) <= 4 && !a._signalBuffed) {
                a._baseSignalPower = a.power;
                a.power = a.power * 1.25;
                a._signalBuffed = true;
            }
        });
    });
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

