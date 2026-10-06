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
//  PYLON NETWORK LINKING
// ─────────────────────────────────────────────────────────
// Builds a spanning forest per element using union-find: pylons can have
// multiple connections (chains are fine) but a link is skipped when the two
// pylons are already reachable through the graph, which prevents
// cross-connecting meshes and redundant triangle shortcuts.
//
// Reach is getPylonRange() tiles centre to centre — 3 by default, so a pylon on
// tile 1 links to one on tile 4 with two empty tiles between them.
//
// Extracted from the render loop's cache block so it can be tested directly.
// Applies every linked pylon pair's zone effect to the actors inside it.
// Lifted out of update() so the tests can drive it directly — the
// stuck-predator behaviour lives in here and is otherwise unreachable.
function applyPylonZoneEffects(wavePylons) {
    _wPylonPairs.forEach(pair=>{
        const {pa, pb, el, col, midX, midY} = pair;
        // A link runs while either end is awake; both on standby, it rests.
        if (pa.waveAwake === false && pb.waveAwake === false) return;

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

                const isEnemy = isHostileTarget(a);
                const isFriend = (a.team==="green"||a.isClone||a.isFollower);

                switch(el) {
                    case "fire": {
                        if (isEnemy) {
                            const dmg  = Math.round((_nTier >= 3 ? 24 : _nTier >= 2 ? 15 : 9) * _seasonBonus);
                            const intv = _nTier >= 3 ? 12 : _nTier >= 2 ? 18 : 24;
                            if (frame % intv === 0) {
                                applyDamage(a, dmg, null, "fire");
                                // Tier 3: ignite — spread fire to enemies within 1.5 tiles
                                if (_nTier >= 3 && Math.random() < 0.5) {
                                    const _ax=a.x, _ay=a.y;
                                    actors.forEach(other => {
                                        if (other===a||other.dead||other.team!=="red") return;
                                        const _odx=other.x-_ax, _ody=other.y-_ay;
                                        if (Math.abs(_odx)>1.5||Math.abs(_ody)>1.5) return;
                                        if (_odx*_odx+_ody*_ody < 2.25) applyDamage(other, 6, null, "fire"); // 1.5²=2.25
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
                                applySlow(a, 60, 0.05);
                                if (frame % 60 === 0) applyDamage(a, Math.round(6 * _seasonBonus), null, "ice");
                            } else if (_nTier >= 2) {
                                // A target already frozen solid is left frozen: this used
                                // to overwrite the freeze with the 12% slow on the very
                                // next pass, three frames later.
                                if (!(a.slowed > 0 && a.slowFactor === 0)) applySlow(a, 50, 0.12);
                                // Random chance to freeze solid for 60 frames
                                if (Math.random() < 0.03) applySlow(a, 90, 0.0);
                            } else {
                                applySlow(a, 40, 0.25);
                            }
                        }
                        break;
                    }
                    case "electric": {
                        // HASTE: your side runs faster through an electric zone, so
                        // it is the lane to send followers back to the fight, or
                        // out for shards. Renewed on every pass (every 3 frames)
                        // and dropping off a moment after they leave. An enemy's
                        // slow on the same follower wins, so ice still bites.
                        if (isFriend && !(a.slowed > 0 && (a.slowFactor ?? 1) < 1)) {
                            applySlow(a, ELECTRIC_HASTE_FRAMES, ELECTRIC_HASTE[Math.min(3, _nTier)] || ELECTRIC_HASTE[1]);
                        }
                        if (isFriend && frame % 10 === 0) {
                            const gain = Math.round((_nTier >= 3 ? 10 : _nTier >= 2 ? 6 : 3) * _seasonBonus);
                            a.currentResonance = Math.min(100, (a.currentResonance||0) + gain);
                            // Tier 2+: also accelerate ultimate charge for all network allies
                            if (_nTier >= 2 && typeof a.ultimateCharge === "number") {
                                a.ultimateCharge = Math.min(100, a.ultimateCharge + (_nTier >= 3 ? 3 : 2));
                            }
                        }
                        break;
                    }
                    case "core": {
                        const coreIntv = _nTier >= 3 ? 20 : _nTier >= 2 ? 30 : 45;
                        if (isFriend && frame % coreIntv === 0) {
                            const shGain = Math.round((_nTier >= 3 ? 12 : _nTier >= 2 ? 8 : 5) * _seasonBonus);
                            const shCap  = _nTier >= 3 ? 75 : _nTier >= 2 ? 50 : 30;
                            a.shielded = true;
                            a.shieldAmount = Math.min(shCap, (a.shieldAmount||0) + shGain);
                            a._shieldMax = shCap;
                            // Tier 3: auto-repair broken shields (restore up to cap over time)
                            if (_nTier >= 3 && a.shieldAmount > 0 && a.shieldAmount < shCap) {
                                a.shieldAmount = Math.min(shCap, a.shieldAmount + 3);
                            }
                        }
                        break;
                    }
                    case "flux": {
                        // A predator that has committed to smashing a pylon is no
                        // longer dragged. The pull is stronger than it can walk,
                        // so without this it can never reach the thing it is
                        // trying to break and just orbits the midpoint forever.
                        if (isEnemy && !a.pylonAggro) {
                            const pullSpd = (_nTier >= 3 ? 0.28 : _nTier >= 2 ? 0.21 : 0.14) * _seasonBonus;
                            const dx=midX-a.x, dy=midY-a.y, d=Math.hypot(dx,dy)||1;
                            a.x+=dx/d*pullSpd; a.y+=dy/d*pullSpd;
                            // Tier 3: vortex — pulled enemies take continuous damage
                            if (_nTier >= 3 && frame % 20 === 0) applyDamage(a, Math.round(5*_seasonBonus), null, "flux");
                            // Tier 2+: chain — pulled actors drag nearby enemies along
                            if (_nTier >= 2 && frame % 20 === 0) {
                                const _ax=a.x, _ay=a.y;
                                actors.forEach(other => {
                                    if (other===a||other.dead||(other.team!=="red"&&!(other instanceof Predator&&other.team!=="green"&&!other.isClone))) return;
                                    const _odx=other.x-_ax, _ody=other.y-_ay;
                                    if (Math.abs(_odx)>1.2||Math.abs(_ody)>1.2) return;
                                    const od2 = _odx*_odx+_ody*_ody;
                                    if (od2 < 1.44 && od2 > 0.0001) { other.x+=dx/d*0.08; other.y+=dy/d*0.08; } // 1.2²=1.44
                                });
                            }
                        }
                        break;
                    }
                    case "toxic": {
                        const toxIntv = _nTier >= 3 ? 15 : _nTier >= 2 ? 22 : 30;
                        if (isEnemy && frame % toxIntv === 0) {
                            const tdmg = Math.round((_nTier >= 3 ? 18 : _nTier >= 2 ? 12 : 8) * _seasonBonus);
                            applyDamage(a, tdmg, null, "toxic");
                            const shredChance  = _nTier >= 3 ? 0.8 : _nTier >= 2 ? 0.65 : 0.45;
                            const shredFactor  = _nTier >= 3 ? 0.3 : _nTier >= 2 ? 0.4 : 0.5;
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
                // Predator pylon aggro — how long this predator has been cooked
                // by a pylon zone before it turns on the pylon itself.
                //
                // This block only runs every third frame (see the guard above),
                // so the old threshold of 300 meant 900 real frames — fifteen
                // seconds of standing in a zone before a predator would even
                // consider fighting back. Inside a FLUX zone that is a death
                // sentence with no way out: the pull is several times stronger
                // than a predator's own walk speed, so it cannot leave, and it
                // would not fight either. Hence a far lower threshold, and flux
                // counting for more because it is the one that actually traps.
                //
                // Guard with _lastExposureFrame so multi-pair actors only count once per frame.
                if (isEnemy && a instanceof Predator) {
                    if (a._lastExposureFrame !== frame) {
                        a._lastExposureFrame = frame;
                        a.pylonExposureFrames = (a.pylonExposureFrames||0) + (el === "flux" ? PYLON_AGGRO_TRAP_RATE : 1);
                        if (a.pylonExposureFrames > PYLON_AGGRO_EXPOSURE && !a.pylonAggro) {
                            let nearestPylon=null, bestPD=Infinity;
                            wavePylons.forEach(wp=>{ const d=Math.hypot(wp.x-a.x,wp.y-a.y); if(d<bestPD){bestPD=d;nearestPylon=wp;} });
                            if (nearestPylon) {
                                a.pylonAggro = nearestPylon;
                                floatingTexts.push({ x:a.x, y:a.y-1.2, text:"BREAKING OUT",
                                                     color:"#ff8800", life:50, vy:-0.07 });
                            }
                        }
                    }
                } else if (!isEnemy) {
                    // Cool down exposure when no longer in zone
                    if (a.pylonExposureFrames) a.pylonExposureFrames = Math.max(0, a.pylonExposureFrames - 2);
                }
            });
    });
}

// Generator links are not elemental pairs: a generator reaches every friendly
// pylon in range regardless of element, and there is no spanning-forest rule
// because it is mending them, not forming a network that could mesh.
// The mend links, drawn as steel filaments running generator → pylon. World
// space, so they sit with the world rather than up with the interface.
// ── THE POWER CHAIN ──────────────────────────────────────
// nest → generator → pylon, drawn as wire with charge running along it.
//
// REPORTED: "I can't read it. Make it more visually obvious when the power's
// being drawn, with the little pulses in the wiring."
//
// It was a 1.4px grey dashed line at 18-40% alpha with one 2px dot on it, and
// it was the same line whether the pylon was pulling hard or doing nothing at
// all. There was no way to look at a base and see what was costing you.
//
// Now the wire's brightness and the number of charges on it follow the actual
// draw, and the charges run in the direction the power goes:
//
//   WAVE MODE   never stops drawing, so its line is always full and busy.
//   ATTACK MODE spikes on each round and fades, so a turret with nothing to
//               shoot at goes quiet — you can see it costing you nothing.
//   DARK        no charges at all, and the wire drops to a dim hint so the
//               layout is still legible.
const POWER_WIRE_COLOUR = "#8fd6ff";
const POWER_WIRE_DEAD   = "rgba(120,140,160,0.18)";
const POWER_BEADS       = 4;      // charges in flight per wire at full draw
const POWER_BEAD_SPEED  = 0.011;  // of the wire's length, per frame

// ── CABLES ARE PIPES ON THE FLOOR ────────────────────────
// "All the cables that run in the game should run along the ground, and connect
// like pipes that bend at 90 degree angles."
//
// Every cable is routed on the tile grid: from the source tile it runs along the
// corridor (world x) to the target's column, turns a right angle, and runs
// across (world y) to the target. It sits on the floor at tile centres, not in
// the air between the structures' bodies. Projected, the two legs follow the
// two iso axes, so the bend reads as a pipe elbow laid on the grid. One rule,
// cablePath(), so every cable in the game routes the same way and two cables
// between the same pair of things lie exactly on top of each other.
const CABLE_CASING  = "#0b1118";   // the pipe's dark sleeve
const CABLE_WIDTH   = 6;           // sleeve width, px
function cablePath(from, to) {
    const ax = Math.round(from.x), ay = Math.round(from.y);
    const bx = Math.round(to.x),   by = Math.round(to.y);
    const pts = [{ x: ax, y: ay }];
    if (ax !== bx && ay !== by) pts.push({ x: bx, y: ay });   // the elbow
    pts.push({ x: bx, y: by });
    return pts;
}
// HOW THEY ARE DRAWN. A cable cannot be an overlay: drawn after the world it
// paints over every unit and pylon standing on its path, which is the opposite
// of lying on the floor. So each frame the cables are LAID first — broken into
// one piece per tile they cross — and every floor tile draws its own pieces in
// the depth-sorted pass, under whatever stands on it or in front of it. A
// piece runs from the tile's centre to the middle of each edge it connects
// through, so a straight run is two half-pieces meeting at the edge, and the
// elbow is the one tile whose two halves turn.
const _cableTiles = new Map();
function _cableCell(x, y) {
    const k = x + "," + y;
    let c = _cableTiles.get(k);
    if (!c) { c = { pieces: [], beads: [] }; _cableTiles.set(k, c); }
    return c;
}
// The tiles a cable crosses, in order, from its first end to its last.
function cableTiles(from, to) {
    const pts = cablePath(from, to), tiles = [{ x: pts[0].x, y: pts[0].y }];
    for (let i = 1; i < pts.length; i++) {
        let { x, y } = tiles[tiles.length - 1];
        const sx = Math.sign(pts[i].x - x), sy = Math.sign(pts[i].y - y);
        // Capped: a route is never longer than the map is wide, and a bad
        // input must not be able to spin the frame forever.
        for (let guard = 0; (x !== pts[i].x || y !== pts[i].y) && guard < 512; guard++) {
            x += sx; y += sy; tiles.push({ x, y });
        }
    }
    return tiles;
}
// Lay one cable. style: { core, width, dash, glow, beads: [{t, r, alpha, colour}] }
// where each bead's t is 0..1 along the cable from `from` to `to`.
function layCable(from, to, style) {
    const tiles = cableTiles(from, to);
    const last = tiles.length - 1;
    for (let i = 0; i <= last; i++) {
        const dirs = [];
        if (i > 0)    dirs.push([tiles[i - 1].x - tiles[i].x, tiles[i - 1].y - tiles[i].y]);
        if (i < last) dirs.push([tiles[i + 1].x - tiles[i].x, tiles[i + 1].y - tiles[i].y]);
        const elbow = dirs.length === 2 && (dirs[0][0] + dirs[1][0] !== 0 || dirs[0][1] + dirs[1][1] !== 0);
        _cableCell(tiles[i].x, tiles[i].y).pieces.push({ dirs, end: i === 0 || i === last, elbow, style });
    }
    // The charges are placed in world space along the tile run and drawn by the
    // tile they are over, so they go under a unit standing on the pipe too.
    for (const b of (style.beads || [])) {
        const f = b.t * last, i = Math.min(last, Math.floor(f)), k = f - i;
        const n = tiles[Math.min(last, i + 1)];
        const wx = tiles[i].x + (n.x - tiles[i].x) * k, wy = tiles[i].y + (n.y - tiles[i].y) * k;
        _cableCell(Math.round(wx), Math.round(wy)).beads.push(Object.assign({ wx, wy }, b));
    }
    return tiles;
}
// Called by every floor tile in the sorted pass.
function drawCablesOnTile(tile, px, py) {
    if (_cableTiles.size === 0) return;
    const c = _cableTiles.get(Math.round(tile.x) + "," + Math.round(tile.y));
    if (!c) return;
    const cx = px, cy = py + TILE_H;
    // One world step along +x is (TILE_W, TILE_H) on screen, along +y it is
    // (-TILE_W, TILE_H); a half step reaches the middle of that edge.
    const addPiece = pc => {
        if (pc.dirs.length === 0) { ctx.moveTo(cx, cy); ctx.lineTo(cx, cy); return; }
        const [dx0, dy0] = pc.dirs[0];
        ctx.moveTo(cx + (dx0 - dy0) * TILE_W / 2, cy + (dx0 + dy0) * TILE_H / 2); ctx.lineTo(cx, cy);
        if (pc.dirs[1]) { const [dx1, dy1] = pc.dirs[1]; ctx.lineTo(cx + (dx1 - dy1) * TILE_W / 2, cy + (dx1 + dy1) * TILE_H / 2); }
    };
    // PERFORMANCE: no shadowBlur anywhere here (it is the slowest thing a
    // canvas does, and this runs for every cable tile, every frame), and the
    // strokes are BATCHED — one path per style instead of one per piece. In a
    // dense base many cables share a tile (a generator's runs overlap), so the
    // same piece was being stroked again and again.
    // DEDUPE: in a dense base many cables run along the same tiles (a
    // generator's runs to ten pylons share their first leg), and every one of
    // them was stroked on top of the others. One piece per distinct shape, in
    // the strongest style among those sharing it (live beats dead, then the
    // wider core). Measured as the biggest single cost in a 66-pylon base.
    const uniq = new Map();
    for (const pc of c.pieces) {
        const d = pc.dirs, k = d.length ? (d[0][0] + "," + d[0][1] + (d[1] ? ";" + d[1][0] + "," + d[1][1] : "")) : "o";
        const cur = uniq.get(k);
        const score = (pc.style.glow ? 100 : 0) + (pc.style.dash ? 0 : 10) + pc.style.width;
        if (!cur || score > cur.score) uniq.set(k, { pc, score });
    }
    ctx.save();
    // Flat ends and mitred joins: round caps cost an arc per segment, and the
    // pieces meet edge to edge anyway.
    ctx.lineCap = "butt"; ctx.lineJoin = "miter";
    // Sleeves: one path, one stroke.
    ctx.strokeStyle = CABLE_CASING; ctx.lineWidth = CABLE_WIDTH; ctx.globalAlpha = 0.85;
    ctx.beginPath(); for (const { pc } of uniq.values()) addPiece(pc); ctx.stroke();
    // Cores: grouped by style.
    const groups = new Map();
    for (const { pc } of uniq.values()) {
        const st = pc.style, k = st.core + "|" + st.width + "|" + (st.dash ? st.dash.join(",") : "");
        let g = groups.get(k); if (!g) { g = { st, list: [] }; groups.set(k, g); } g.list.push(pc);
    }
    for (const { st, list } of groups.values()) {
        ctx.beginPath(); for (const pc of list) addPiece(pc);
        // A live cable is a touch wider instead of carrying a glow.
        ctx.globalAlpha = 1; ctx.strokeStyle = st.core; ctx.lineWidth = st.width + (st.glow ? 1 : 0);
        if (st.dash) ctx.setLineDash(st.dash);
        ctx.stroke();
        if (st.dash) ctx.setLineDash([]);
    }
    // An elbow collar where it turns, a coupling where it plugs in — once per tile.
    let end = false, elbow = false, rim = null;
    for (const pc of c.pieces) { if (pc.end) end = true; if (pc.elbow) elbow = true; if ((pc.end || pc.elbow) && !rim) rim = pc.style.core; }
    if (end || elbow) {
        ctx.globalAlpha = 1; ctx.fillStyle = CABLE_CASING;
        ctx.beginPath(); ctx.ellipse(cx, cy, end ? 6 : 5, end ? 3 : 2.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = rim; ctx.lineWidth = 1; ctx.stroke();
    }
    // Charges: a faint halo and a bright core, no blur.
    for (const b of c.beads) {
        const bx = (b.wx - player.visualX - (b.wy - player.visualY)) * TILE_W + canvas.width / 2;
        const by = (b.wx - player.visualX + (b.wy - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H;
        ctx.fillStyle = b.colour;
        ctx.globalAlpha = b.alpha * 0.3; ctx.beginPath(); ctx.arc(bx, by, b.r * 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = b.alpha; ctx.beginPath(); ctx.arc(bx, by, b.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}
// A world point on the floor, in screen space (tile centre, ground level).
function cableScreen(o) {
    return [(o.x - player.visualX - (o.y - player.visualY)) * TILE_W + canvas.width  / 2,
            (o.x - player.visualX + (o.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H];
}

// One power cable with its charges. `from` and `to` are WORLD points (the
// structures themselves); `flow` is 0..1 — how hard this leg is being pulled —
// and `phase` offsets the charges so two cables from the same relay do not
// pulse in lockstep. The charges run from `from` to `to`, the way power goes.
// The core is the readout: dim and dashed when nothing is moving, solid and
// bright when it is, and a busier cable carries more charges.
function _drawPowerWire(from, to, flow, phase, colour) {
    const lit = flow > 0.02;
    const beads = [];
    if (lit) {
        const n = Math.max(1, Math.round(POWER_BEADS * flow));
        for (let i = 0; i < n; i++) {
            const t = (((frame || 0) * POWER_BEAD_SPEED) + phase + i / n) % 1;
            // Brightest in the middle of its run so each charge reads as
            // travelling rather than as a row of fixed dots.
            const fade = Math.sin(t * Math.PI);
            beads.push({ t, r: 2.2 + flow * 1.4, alpha: (0.45 + flow * 0.55) * (0.35 + fade * 0.65), colour });
        }
    }
    return layCable(from, to, lit
        ? { core: colour, width: 2 + flow * 0.8, glow: 6 * flow, beads }
        : { core: POWER_WIRE_DEAD, width: 1.4, dash: [4, 7] });
}

// The generator's mending lines: thin steel cables on the floor, routed like
// every other cable. Where the same generator already runs a POWER cable to a
// pylon it would lie on exactly the same path, so that one is left to carry it.
function layMendingCables() {
    if (typeof _genLinks === "undefined" || _genLinks.length === 0) return;
    const pulse = 0.5 + 0.5 * Math.sin((frame || 0) * 0.06);
    for (const { gen, pylon } of _genLinks) {
        if (gen.destroyed || pylon.destroyed) continue;
        if (needsPower(pylon) && pylon.powerGen === gen) continue;
        const t = (((frame || 0) * 0.014) + (pylon.x * 0.13 + pylon.y * 0.29)) % 1;
        layCable(gen, pylon, { core: `rgba(205,214,224,${0.35 + pulse * 0.3})`, width: 1.4, dash: [5, 6],
                               beads: [{ t, r: 2, alpha: 0.5 + pulse * 0.3, colour: "#e6f0fa" }] });
    }
}

// Every cable in the game, laid fresh each frame before the world is drawn.
function layAllCables() {
    _cableTiles.clear();
    drawPowerChain();
    layMendingCables();
    // The ties between nest grids: a gold cable between the two relays that
    // join them (buildNestGrids in power.js).
    if (typeof _gridLinks !== "undefined")
        for (const { a, b } of _gridLinks) layCable(a, b, { core: CONNECTOR_COLOR, width: 2, glow: 3 });
}

// The whole chain, every frame. Each pylon that is drawing gets a cable from
// the relay feeding it; each relay gets one from its nest. A relay you have
// LINKED to a nest keeps that cable even while nothing pulls on it (it is the
// link, and it used to be a separate beam in the air); an unlinked relay only
// shows its supply cable while something is drawing.
// ── NEAREST PYLON PER TILE (for the floor's circuit traces) ──
// Built when the pylon cache is rebuilt (every 60 frames, or at once when
// something forces it), so the floor pass can look a tile's distance up
// instead of searching every pylon for every tile, every frame.
const PCB_TRACE_REACH = 4.0;
let _pylonNear = new Map();
function _pnKey(x, y) { return Math.round(x) * 32 + (Math.round(y) + 16); }
function rebuildPylonNear() {
    _pylonNear = new Map();
    const R = Math.ceil(PCB_TRACE_REACH);
    for (const p of _pillarCache) {
        const px = Math.round(p.x), py = Math.round(p.y);
        for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) {
            const d = Math.hypot(p.x - (px + dx), p.y - (py + dy));
            if (d >= PCB_TRACE_REACH) continue;
            const k = _pnKey(px + dx, py + dy), cur = _pylonNear.get(k);
            if (cur === undefined || d < cur) _pylonNear.set(k, d);
        }
    }
}
function pylonNearDist(x, y) {
    const d = _pylonNear.get(_pnKey(x, y));
    return d === undefined ? Infinity : d;
}

function drawPowerChain() {
    if (typeof _pillarCache === "undefined" || _pillarCache.length === 0) return;
    // Relay → nest is drawn once per relay, at the heaviest flow any of its
    // pylons is pulling: that leg carries all of them.
    const genFlow = new Map();

    for (const t of _pillarCache) {
        if (!needsPower(t) || !t.powerGen) continue;
        const gen = t.powerGen;
        const flow = powerFlowOf(t);
        genFlow.set(gen, Math.max(genFlow.get(gen) || 0, flow));
        _drawPowerWire(gen, t, flow, (t.x * 0.17 + t.y * 0.31) % 1, POWER_WIRE_COLOUR);
    }
    for (const r of _pillarCache) {
        if (!genFlow.has(r) && isRelayPylon(r) && r.nestConnection && nestIsPowerSource(r.nestConnection))
            genFlow.set(r, 0);
    }

    for (const [gen, flow] of genFlow) {
        // A pylon passing power down the chain has no nest leg of its own.
        if (!isRelayPylon(gen)) continue;
        // The ONE source rule, not a second copy of it: this used to fall back to
        // the home portal for every generator, so the wire ran from the Crystal
        // across the whole map to ones it was not feeding at all.
        const nest = relaySource(gen);
        if (!nest) continue;
        // Nest → relay, so the charges run the same way the power does and the
        // whole chain reads in one direction. A linked nest's cable is blue,
        // the colour of a nest you control.
        _drawPowerWire(nest, gen, flow, (gen.x * 0.23) % 1,
                       gen.nestConnection === nest ? NEST_COLOUR_CONTROLLED : POWER_WIRE_COLOUR);
    }
}

function drawGeneratorLinks() {
    if (_genLinks.length === 0) return;
    const toScreen = o => [
        (o.x - player.visualX - (o.y - player.visualY)) * TILE_W + canvas.width  / 2,
        (o.x - player.visualX + (o.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H,
    ];
    const pulse = 0.5 + 0.5 * Math.sin(frame * 0.06);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // A pylon linked to two generators used to get its aura ring drawn twice
    // (and its heal flash faded twice as fast). Once per pylon.
    const seen = new Set();
    for (const { gen, pylon } of _genLinks) {
        if (gen.destroyed || pylon.destroyed) continue;
        if (seen.has(pylon)) continue;
        seen.add(pylon);
        const [gx, gy] = toScreen(gen);
        const [px, py] = toScreen(pylon);
        // Both ends off screen means the whole filament is too.
        if (Math.max(gx, px) < -60 || Math.min(gx, px) > canvas.width  + 60) continue;
        if (Math.max(gy, py) < -60 || Math.min(gy, py) > canvas.height + 60) continue;

        // THE HEALING AURA's reach, on the floor, so the player can see where
        // to stand. Drawn from the same numbers the tick heals by, and it
        // widens visibly as the network tier climbs.
        if (pylon.pillarTeam === "green" && !pylon.destroyed && pylon.health > 0) {
            const tier  = Math.max(1, pylonNetworkTier(pylon));
            const reach = GEN_AURA_RADIUS + GEN_AURA_PER_TIER * (tier - 1);
            const col   = (ELEMENTS.find(e => e.id === pylon.attackModeElement) || {}).color || "#9fe8c0";
            const breathe = 0.5 + 0.5 * Math.sin(frame * 0.05 + pylon.x);
            ctx.globalAlpha = 0.10 + 0.07 * breathe + 0.03 * tier;
            ctx.strokeStyle = col;
            ctx.lineWidth = 1 + tier * 0.4;
            ctx.beginPath();
            ctx.ellipse(px, py + TILE_H, reach * TILE_W, reach * TILE_H, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        // A brief bloom on the pylon the frame it actually gained health.
        if (pylon._genHealFlash > 0) {
            pylon._genHealFlash--;
            ctx.strokeStyle = `rgba(190,255,220,${pylon._genHealFlash / 12 * 0.55})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(px, py, TILE_W * 0.5, TILE_H * 0.5, 0, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    ctx.restore();
}

function rebuildGeneratorLinks() {
    _genLinks = [];
    if (_genPylons.length === 0) return;
    const r = getPylonRange(), r2 = r * r;
    for (const gen of _genPylons) {
        if (gen.circuitOn === false) continue;   // switched off: it mends nothing either
        for (const t of _pillarCache) {
            if (t === gen) continue;
            if (t.pillarTeam !== "green") continue;   // allies only
            const dx = t.x - gen.x, dy = t.y - gen.y;
            if (dx*dx + dy*dy > r2) continue;
            _genLinks.push({ gen, pylon: t });
        }
    }
}

// Mend the pylons standing in a generator's reach. Broken pylons are not
// touched — wreckage is a CORE worker's job, and letting a generator quietly
// rebuild it would make that crew pointless.
function generatorHealTick() {
    if (frame % GENERATOR_HEAL_INTERVAL !== 0 || _genLinks.length === 0) return;
    for (const { gen, pylon } of _genLinks) {
        if (gen.destroyed || gen.health <= 0) continue;
        if (pylon.destroyed) continue;
        const cap = pylon.maxHealth || 0;
        if (pylon.health >= cap) continue;
        pylon.health = Math.min(cap, pylon.health + GENERATOR_HEAL_AMOUNT);
        pylon._genHealFlash = 12;
    }
}

// THE CLONE RESPAWN TICKER.
//
// A clone takes CLONE_RESPAWN_FRAMES to come back — half a minute, against a
// follower's three seconds — and without this the player has no way to know
// whether one is coming or whether it is gone for good. Drawn over the Crystal,
// which is where it will reappear.
function drawCloneRespawnTicker(cx, topY) {
    if (typeof respawnQueue === "undefined") return;
    const waiting = respawnQueue.filter(e => e && e.isClone);
    if (waiting.length === 0) return;
    // Soonest first, so the top line is the one about to land.
    waiting.sort((a, b) => a.timer - b.timer);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    const rowH = 13;
    let y = topY - (waiting.length - 1) * rowH;
    for (const e of waiting) {
        const secs  = Math.max(0, Math.ceil(e.timer / 60));
        const total = e.totalTimer || CLONE_RESPAWN_FRAMES;
        const done  = Math.max(0, Math.min(1, 1 - e.timer / total));
        const name  = ((e.speciesName || "clone") + " " + (e.className || "")).toUpperCase().trim();

        // A bar that fills as it comes back, so the wait is legible at a glance
        // and the number is the detail rather than the whole message.
        const bw = 56, bh = 3;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(cx - bw / 2 - 1, y - 9, bw + 2, bh + 2);
        ctx.fillStyle = "#22ff88";
        ctx.fillRect(cx - bw / 2, y - 8, bw * done, bh);

        ctx.font = "bold 8px monospace";
        ctx.fillStyle = "#22ff88";
        ctx.fillText(name + "  " + secs + "s", cx, y);
        y += rowH;
    }
    ctx.restore();
}

// THE HACK ZONE — the patch of floor that hacks a nest, painted on the floor.
//
// It used to be a line of text on the wall: "[ HOLD to HACK NEST ]". That was
// wrong twice over. There is no hold — the hack is proximity, you walk in and
// wait — and it named no place, so the player had to find the spot by trial.
// The tiles say where; the word HACKING over the bar says what.
//
// Tiles are chosen with the SAME predicate the hack tick uses, so the lit floor
// cannot promise a tile that would not actually work.
function drawNestHackZone(nest) {
    if (!nestIsHackable(nest)) return;
    const c = nestHackCentre(nest);
    // Only when the player is near enough for it to be about them.
    const pdx = player.x - c.x, pdy = player.y - c.y;
    if (pdx * pdx + pdy * pdy > NEST_HACK_SHOW * NEST_HACK_SHOW) return;

    const standing = canHackNestFrom(nest, player.x, player.y);
    const pulse = 0.5 + 0.5 * Math.sin(frame * (standing ? 0.18 : 0.06));
    const R = Math.ceil(NEST_HACK_RANGE);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (let ty = c.y - R; ty <= c.y + R; ty++) {
        for (let tx = c.x - R; tx <= c.x + R; tx++) {
            if (!canHackNestFrom(nest, tx, ty)) continue;
            const t = typeof getTile === "function" ? getTile(tx, ty) : null;
            if (!t || t.type !== "floor") continue;
            const px = (tx - player.visualX - (ty - player.visualY)) * TILE_W + canvas.width / 2;
            const py = (tx - player.visualX + (ty - player.visualY)) * TILE_H + canvas.height / 2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + TILE_W, py + TILE_H);
            ctx.lineTo(px, py + TILE_W);
            ctx.lineTo(px - TILE_W, py + TILE_H);
            ctx.closePath();
            // Brighter while the player is actually standing in it, so the
            // floor confirms the hack has started before the bar has moved.
            ctx.fillStyle = standing
                ? `rgba(0,255,136,${0.16 + pulse * 0.16})`
                : `rgba(0,255,136,${0.06 + pulse * 0.05})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(0,255,136,${standing ? 0.55 + pulse * 0.35 : 0.28 + pulse * 0.15})`;
            ctx.lineWidth = standing ? 2 : 1;
            ctx.stroke();
        }
    }
    ctx.restore();
}

// WAKING. A support or disruption pylon is on STANDBY until a unit it works on
// — one of yours for SUPPORT, an enemy for DISRUPTION — is within
// WAVE_WAKE_RADIUS; then it blinks awake (_wakeFrame) and stays up until
// WAVE_WAKE_LINGER frames after the last one left. waveAwake is what the zone
// effects, the haste ring and the power draw all ask.
function waveWakeTick() {
    const r2 = WAVE_WAKE_RADIUS * WAVE_WAKE_RADIUS;
    for (const t of _pillarCache) {
        if (!t.waveMode || isRelayPylon(t)) continue;
        // Awake is about who is near, not about power: an awake pylon on a flat
        // pool still has to try to pay, which is what trips it (waveDrainTick).
        if (t.pillarTeam !== "green") { t.waveAwake = false; continue; }
        if (frame % 6 === 0 || t.waveAwake === undefined) {
            const support = waveRole(t.attackModeElement) === "support";
            let seen = false;
            if (support) {
                const pdx = player.x - t.x, pdy = player.y - t.y;
                seen = pdx * pdx + pdy * pdy <= r2;
            }
            for (let i = 0; !seen && i < actors.length; i++) {
                const a = actors[i];
                if (!a || a.dead) continue;
                const mine = support ? ((a.team === "green" || a.isClone || a.isFollower) && !a.isNeutralRecruit)
                                     : isHostileTarget(a);
                if (!mine) continue;
                const dx = a.x - t.x, dy = a.y - t.y;
                if (dx * dx + dy * dy <= r2) seen = true;
            }
            if (seen) {
                if (!t.waveAwake) t._wakeFrame = frame;
                t._awakeUntil = frame + WAVE_WAKE_LINGER;
            }
        }
        t.waveAwake = frame < (t._awakeUntil === undefined ? -1 : t._awakeUntil);
    }
}

// ELECTRIC HASTE AROUND EACH AWAKE ELECTRIC SUPPORT PYLON. The link strips
// between them haste too (applyPylonZoneEffects); this is the ring around each
// pylon itself, so standing next to one is enough. Renewed every 3 frames and
// lingering ELECTRIC_HASTE_FRAMES. An enemy's slow on the same unit still wins.
function electricHasteTick() {
    if (frame % 3 !== 0) return;
    const tier = Math.min(3, networkStrength.electric || 0);
    if (tier < 1) return;
    const src = [];
    for (const p of _wPylons) if (p.attackModeElement === "electric" && p.waveAwake !== false) src.push(p);
    if (!src.length) return;
    const mult = ELECTRIC_HASTE[tier], r2 = ELECTRIC_HASTE_RADIUS * ELECTRIC_HASTE_RADIUS;
    for (const a of actors) {
        if (!a || a.dead || !(a.team === "green" || a.isClone || a.isFollower)) continue;
        if (a.slowed > 0 && (a.slowFactor ?? 1) < 1) continue;
        for (const p of src) {
            const dx = a.x - p.x, dy = a.y - p.y;
            if (dx * dx + dy * dy <= r2) { applySlow(a, ELECTRIC_HASTE_FRAMES, mult); break; }
        }
    }
}

// One turret round: the pylon's power, the turret multiplier, its network
// tier, and a bite out of the target's max HP so it counts against big ones.
function turretRoundDamage(t, target) {
    const tier = pylonNetworkTier(t);
    const base = (t.attackPower || 12) * TURRET_DAMAGE_MULT * (1 + TURRET_TIER_BONUS * tier);
    return base + TURRET_MAXHP_SHARE * ((target && target.maxHealth) || 0);
}

// A pylon's network tier — 0 when it carries no element or stands alone.
// One place, because the aura, the HUD and the zone effects all ask it.
function pylonNetworkTier(pylon) {
    if (!pylon) return 0;
    const el = pylon.attackModeElement;
    if (!el) return 0;
    return networkStrength[el] || 0;
}

// THE AURA. Every pylon linked to a generator mends the squad standing around
// it, at a rate and a reach multiplied by that pylon's network tier.
//
// Generator-linked only: this is what the generator is FOR, and it gives the
// placement rule (within GENERATOR_NEST_RANGE of a nest) something to buy
// beyond keeping the linked pylons repaired.
function generatorAuraTick() {
    if (frame % GEN_AURA_INTERVAL !== 0 || _genLinks.length === 0) return;
    for (const { gen, pylon } of _genLinks) {
        if (gen.destroyed || gen.health <= 0) continue;
        if (pylon.destroyed || pylon.health <= 0) continue;
        if (pylon.pillarTeam !== "green") continue;
        // Floor of 1: a linked pylon always mends something, and the tier is
        // the multiplier on top rather than a gate in front.
        const tier = Math.max(1, pylonNetworkTier(pylon));
        const heal = GEN_AURA_HEAL * tier;
        const reach = GEN_AURA_RADIUS + GEN_AURA_PER_TIER * (tier - 1);
        const r2 = reach * reach;
        for (const a of actors) {
            if (a.dead || a.team !== "green") continue;
            if (!(a.health < a.maxHealth)) continue;
            const dx = a.x - pylon.x, dy = a.y - pylon.y;
            if (dx * dx + dy * dy > r2) continue;
            a.health = Math.min(a.maxHealth, a.health + heal);
            a._auraFlash = 10;
        }
        // The player is not in actors[], and is the one most likely to be
        // standing on a pylon when things have gone wrong.
        const pdx = player.x - pylon.x, pdy = player.y - pylon.y;
        if (pdx * pdx + pdy * pdy <= r2 && health < 100) {
            health = Math.min(100, health + heal);
        }
        pylon._auraPulse = (pylon._auraPulse || 0) + 1;
    }
}

function rebuildPylonPairs() {
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
}

// ─────────────────────────────────────────────────────────
//  DRAW DEPTH
// ─────────────────────────────────────────────────────────
// One place decides what draws in front of what. See the note at the sort for
// why a wall nest is not simply x+y.
const NEST_DRAW_BIAS = 1.01;   // just past the last wall tile of its own face
function drawDepthOf(o) {
    const d = o.x + o.y;
    return (o.nest && !o._infestNest) ? d + NEST_DRAW_BIAS : d;
}

// ─────────────────────────────────────────────────────────
//  DRAW CULLING
// ─────────────────────────────────────────────────────────
// Whether anything anchored at this world position can touch the screen.
//
// The draw list used to be `world.filter(t => Math.abs(t.x - player.visualX) <
// RENDER_DIST)` — column distance, not screen position. But the isometric
// projection is horizontal in (x - y): a tile twenty columns away at the same y
// lands 1200px right of centre. Measured on a 900x700 view that filter selected
// 304 tiles of which 150 were on screen, so half of every frame's tile work and
// the canvas calls that go with it were spent outside the viewport. Actors were
// not culled at all, and one actor costs around 200 canvas operations.
//
// The margins are asymmetric because sprites are drawn UPWARD from their tile
// anchor. Something below the bottom edge can still poke into view, so that
// side is generous; a tile above the top edge only ever shows its floor
// diamond, so that side can be tight. Getting these wrong shows up as objects
// popping in and out at the edges, which is why they are named constants with a
// test rather than numbers inline.
const DRAW_CULL_SIDE   = TILE_W * 2.5;   // 150px — wider than any sprite
const DRAW_CULL_TOP    = TILE_H * 5;     // 150px — floor diamonds only
const DRAW_CULL_BOTTOM = TILE_H * 7;     // 210px — the tallest sprite, and then some
// Tiles indexed by column, built straight off `world` as it grows. Derived
// rather than maintained: anything pushed into world by anybody is picked up on
// the next call, so the index cannot drift out of step with the list.
//
// A restart replaces `world` with a fresh array, which the identity check
// catches — keying on length alone would miss a new array of the same size.
let _colIndex = new Map(), _colIndexedLen = 0, _colIndexWorld = null;
let _lastDrawScan = 0;   // candidates examined by the last visibleTilesForDraw()
function tileColumns() {
    if (_colIndexWorld !== world) {
        _colIndex = new Map(); _colIndexedLen = 0; _colIndexWorld = world;
    }
    for (let i = _colIndexedLen; i < world.length; i++) {
        const t = world[i];
        let col = _colIndex.get(t.x);
        if (col === undefined) { col = []; _colIndex.set(t.x, col); }
        col.push(t);
    }
    _colIndexedLen = world.length;
    return _colIndex;
}

// Only the columns that could possibly be on screen.
//
// The draw list was `world.filter(visibleForDraw)` — every tile in the world,
// every frame. `world` is appended to as the player walks, so that scan grows
// without bound while the number of visible tiles does not: measured at 1256
// tiles scanned to find 158, and twice the scan for the same picture after
// walking twice as far.
//
// A cache keyed on the camera was tried first and was worthless: the camera
// moves further in one frame than any lag small enough to be safe, so it
// rebuilt every frame and hit 0% of the time.
//
// The cull is a screen-space box, so it bounds both isometric axes — (dx-dy)
// from the horizontal test and (dx+dy) from the vertical one. Half their sum
// bounds dx, which is the column. For a 900x700 view that is 28 columns rather
// than the whole map, and the resulting set is IDENTICAL to the old filter
// because every candidate still goes through visibleForDraw.
function visibleTilesForDraw() {
    const cols = tileColumns();
    const halfW = canvas.width / 2, halfH = canvas.height / 2;
    const aMin = (-DRAW_CULL_SIDE - halfW) / TILE_W;                    // min (dx-dy)
    const aMax = (canvas.width + DRAW_CULL_SIDE - halfW) / TILE_W;      // max (dx-dy)
    const bMin = (-DRAW_CULL_TOP - halfH) / TILE_H;                     // min (dx+dy)
    const bMax = (canvas.height + DRAW_CULL_BOTTOM - halfH) / TILE_H;   // max (dx+dy)
    const xMin = Math.floor(player.visualX + (aMin + bMin) / 2);
    const xMax = Math.ceil (player.visualX + (aMax + bMax) / 2);
    const out = [];
    let scanned = 0;
    for (let x = xMin; x <= xMax; x++) {
        const col = cols.get(x);
        if (col === undefined) continue;
        scanned += col.length;
        for (let i = 0; i < col.length; i++) {
            const t = col[i];
            if (visibleForDraw(t.x, t.y)) out.push(t);
        }
    }
    // How many candidates that took. The whole point of the index is that this
    // stays flat as `world` grows, and it is the only way to tell a working
    // index from one whose window has quietly widened to the whole map —
    // a too-wide window still produces the correct set, just slowly.
    _lastDrawScan = scanned;
    return out;
}

function visibleForDraw(x, y) {
    const dx = x - player.visualX, dy = y - player.visualY;
    const px = (dx - dy) * TILE_W + canvas.width / 2;
    if (px < -DRAW_CULL_SIDE || px > canvas.width + DRAW_CULL_SIDE) return false;
    const py = (dx + dy) * TILE_H + canvas.height / 2;
    return py >= -DRAW_CULL_TOP && py <= canvas.height + DRAW_CULL_BOTTOM;
}

// ─────────────────────────────────────────────────────────
//  MAIN RENDER / GAME LOOP
// ─────────────────────────────────────────────────────────
function render() {
    requestAnimationFrame(render); // schedule next frame first so the loop never stops
    if (!gameState.running) { return; } // skip all logic while paused (buy screen, game over)

    frame++;

    // ── LONG HOLD DETECT ──
    if (isPressing&&!longHoldFired&&!touchMoved) {
        if (performance.now()-pressStartTime>LONG_HOLD_MS) {
            longHoldFired=true; handleLongHold(pressX,pressY);
        }
    }

    // ── TUTORIAL TICK ──
    if (typeof tutorialMode !== 'undefined' && tutorialMode) tutorialTick();
    if (typeof ringHintTick === 'function') ringHintTick();

    // Health no longer decays naturally — use health pads to restore HP
    const hpPct=health/100;
    // ── HUD updates — only write DOM when values actually change (avoids layout thrashing) ──
    const _hpInt = Math.round(health);
    if (_hpInt !== _lastHpInt) {
        _lastHpInt = _hpInt;
        hpBar.style.width = health + "%";
        hpBar.style.background = hpPct > 0.6 ? "#0f8" : hpPct > 0.3 ? "#ff0" : "#f22";
    }

    // ── PLAYER ULTIMATE ──
    tickArmySurge();
    siphonTick();
    const _ultInt = armySurgeTimer > 0
        ? Math.ceil(armySurgeTimer / 60)          // counting the surge down
        : Math.round(playerUltimate);              // filling
    const _ultState = armySurgeTimer > 0 ? "surging"
                    : playerUltimateReady() ? "ready"
                    : (siphonEnabled && _siphonInRange === 0) ? "stalled" : "";
    // The in-range count is part of the change key, not just the label: a bar
    // stalled at the same percentage would otherwise keep its old caption when
    // the player walks away from the squad, which is the one moment the caption
    // matters.
    if (_ultInt !== _lastUltInt || _ultState !== _lastUltState) {
        _lastUltInt = _ultInt; _lastUltState = _ultState;
        if (armySurgeTimer > 0) {
            ultBar.style.width = (armySurgeTimer / ARMY_SURGE_FRAMES * 100) + "%";
            ultLabel.textContent = "SURGE " + _ultInt + "s";
        } else {
            ultBar.style.width = (playerUltimate / PLAYER_ULT_MAX * 100) + "%";
            ultLabel.textContent =
                  playerUltimateReady()            ? "TAP \u2014 ARMY SURGE"
                : !siphonEnabled                   ? "SIPHON OFF \u00b7 " + _ultInt + "%"
                // The range gate has to announce itself, or a bar that has
                // stopped filling because the squad is elsewhere reads as broken.
                : _siphonInRange === 0             ? "NO SQUAD IN RANGE \u00b7 " + _ultInt + "%"
                                                   : "ULTIMATE " + _ultInt + "%";
        }
        ultWrap.classList.toggle("ready",   _ultState === "ready");
        ultWrap.classList.toggle("surging", _ultState === "surging");
    }
    // The switch is its own cache: it changes on a tap, not with the bar.
    if (siphonEnabled !== _lastSiphonOn) {
        _lastSiphonOn = siphonEnabled;
        siphonBtn.classList.toggle("off", !siphonEnabled);
        _lastUltInt = -1;            // force the label to catch up
    }

    // ── PLAYER KNOCKDOWN ──
    // No stun. Being dropped to zero puts you back at the Crystal, but control
    // is never taken away — three seconds of standing frozen while the night
    // carried on was punishment on top of punishment. A short damage-immune
    // window takes its place, purely so a predator parked by the Crystal
    // cannot chain-kill you on arrival.
    if (player.invuln > 0) player.invuln--;
    if (health <= 0) {
        health = 40;          // partial restore on respawn
        player.x = crystal.x + 2; player.y = crystal.y;
        player.targetX = player.x; player.targetY = player.y;
        player.visualX  = player.x; player.visualY  = player.y;
        player.invuln = PLAYER_RESPAWN_GRACE;
        floatingTexts.push({x:canvas.width/2, y:canvas.height/2-60, text:"◈ REGROUPED", color:"#ffaa33", life:100, vy:-0.25, size:14});
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
    // Slow recovery while no alarm is up (see CRYSTAL_REGEN).
    if (!alertActive && crystal.health < crystal.maxHealth) crystal.health = Math.min(crystal.maxHealth, crystal.health + CRYSTAL_REGEN);

    // ── WORLD GEN ──
    if (player.x>lastGenX-10) generateSegment(lastGenX+1);

    // ── WORLD CACHE — rebuild pylon/nest subsets every 60 frames ──────────
    if (frame - _cacheAge >= 60) {
        _cacheAge    = frame;
        _pillarCache = world.filter(t => t.pillar && !t.destroyed && t.health > 0);
        rebuildPylonNear();
        // Generators are excluded from _wPylons on purpose: the elemental
        // network tiers and integrity are computed from that list, and a
        // neutral pylon has no element to contribute to either.
        _genPylons   = _pillarCache.filter(t => t.isGenerator);
        _conPylons   = _pillarCache.filter(t => t.isConnector);
        // Who is actually switched on. Must come after _genPylons and _nestCache
        // — the grid is worked out from the generators that carry it and the
        // nests that feed it — and BEFORE the two ability lists, which only
        // carry pylons the grid can keep running.
        _nestCache   = world.filter(t => t.nest);
        recomputePower();
        _wPylons     = _pillarCache.filter(t => t.waveMode && t.attackModeElement && !isRelayPylon(t) && t.powered && t.pillarTeam === "green");
        _aPylons     = _pillarCache.filter(t => t.attackMode && !isRelayPylon(t) && t.powered && t.pillarTeam === "green");
        _uPylons     = _pillarCache.filter(t => t.upgraded);
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
        // Every lit pylon of the element counts, turret or wave. REPORTED: "I
        // laid down a bunch of electric pylons and it never got to level 3" —
        // they were turrets, and only wave pylons used to count.
        const _netPylons = _wPylons.concat(_aPylons);
        ELEMENTS.forEach(elDef => {
            const el = elDef.id;
            const elPylons = _netPylons.filter(p => p.attackModeElement === el);
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
            if (newTier < prevTier) {
                // Going DOWN was silent, which is exactly what a failing wave
                // network does as it sheds pylons. Say what was lost.
                floatingTexts.push({ x:canvas.width/2, y:canvas.height/2-80,
                    text: newTier > 0 ? `\u25c8 ${elDef.label} NETWORK DOWN TO ${["", "I", "II", "III"][newTier]}`
                                      : `\u25c8 ${elDef.label} NETWORK LOST`,
                    color:"#ff7755", life:150, vy:-0.2, size:13 });
            }
            _prevNetworkTiers[el] = newTier;
            networkStrength[el]   = newTier;
            // Integrity builds while connected, decays when no pylons active
            if (newTier > 0) networkIntegrity[el] = Math.min(100, (networkIntegrity[el]||0) + newTier * 0.5);
            else             networkIntegrity[el] = Math.max(0,   (networkIntegrity[el]||0) - 2);
        });

        // ── PRE-COMPUTE PYLON PAIRS & SEASONED BONUSES (avoids rebuilding every frame) ──
        rebuildPylonPairs();
        rebuildGeneratorLinks();

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
                // A panel in a zone you have already taken is neutralised with
                // it: there is nobody left in there to raise, so a decoy cannot
                // trip the alarm, and the wall still has shards in it but fewer
                // than one you have not cleared.
                const _neutral = zoneIsNeutralised(zoneOfTile(t));
                if (t.isDecoy && !_neutral) {
                    triggerAlarm(t.alarmType, t.x, t.y);
                } else {
                    const _pay = _neutral
                        ? Math.max(1, Math.round(t.shardReward * PANEL_NEUTRAL_SHARD_MULT))
                        : t.shardReward;
                    shardCount += _pay;
                    saveShards();
                    shardUI.textContent = "Shards: " + shardCount;
                    // Ammo used to come from the shop, which is gone. A hacked
                    // panel is the right source: it is an in-world act, panels
                    // reset every wave, and it keeps the weapon fed by going
                    // out into the tunnel rather than by spending.
                    const _ammoGain = Math.min(PANEL_AMMO_REWARD, PLAYER_AMMO_MAX - playerAmmo);
                    if (_ammoGain > 0) { playerAmmo += _ammoGain; saveAmmo(); }
                    floatingTexts.push({ x:canvas.width/2, y:canvas.height/2-60,
                        text:"+"+_pay+" SHARDS" + (_ammoGain > 0 ? "  +"+_ammoGain+" AMMO" : "")
                             + (_neutral ? " (Panel \u00b7 zone taken)" : " (Panel)"),
                        color:_neutral ? NEST_COLOUR_CONTROLLED : "#ff8800", life:120, vy:-0.2 });
                }
            }
        } else {
            if (t.siphonProgress) t.siphonProgress = 0;
        }
    }

    // ── NEST HACK SIPHON ──
    // Player stands near a live nest to hack it — triggers a zone alarm for that nest's zone.
    // Cannot hack during an active alarm (one wave at a time).
    // NEST_HACK_FRAMES and the range are named in js/config.js now: the bar
    // below divided by a literal 180 while this loop counted to its own local
    // copy, and the range was a bare 2.25 in both places.
    if (!alertActive) {
        for (const nest of _nestCache) {
            if (!nestIsHackable(nest)) { nest.nestHackProgress = 0; continue; }
            const playerNearNest = inNestHackRange(nest, player.x, player.y);
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

    // ── AUTOSAVE ──
    // Pylons were only written at wave transitions, so anything built or
    // upgraded mid-day was lost on a refresh. Every 5s is cheap next to the
    // rest of the frame and keeps a reload close to where the player was.
    if (frame % 300 === 0) { saveSession(); savePylons(); saveNests(); }

    // ── CLEAR SCREEN ──
    ctx.fillStyle="#000"; ctx.fillRect(0,0,canvas.width,canvas.height);
    // ── CIRCUIT BOARD BACKGROUND ──
    drawCircuitLayer();
    ctx.save();
    if (shake>0) { ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake); shake*=0.9; }

    // ── CAMERA FOLLOW ──
    player.x+=(player.targetX-player.x)*cfg.playerSpeed;
    player.y+=(player.targetY-player.y)*cfg.playerSpeed;
    player.y = Math.max(PLAYER_Y_MIN, Math.min(FLOOR_Y_MAX, player.y));
    player.visualX+=(player.x-player.visualX)*0.15;
    player.visualY+=(player.y-player.visualY)*0.15;

    // ── CHARGED MASS ──
    updateChargedMass();

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
            // A frozen block is terrain, not a unit in the crowd: it neither
            // gives ground to a follower nor jostles one. iceBlockTick below
            // is what clears the space around it, in both directions.
            if (_a.iceBlock || _b.iceBlock) continue;
            const _dx = _b.x - _a.x, _dy = _b.y - _a.y;
            const _d2 = _dx*_dx + _dy*_dy;
            if (_d2 >= 0.3025 || _d2 < 0.000001) continue; // 0.55² = 0.3025
            const _d = Math.sqrt(_d2);
            const _p = (1/_d) * (0.55 - _d) * 0.5;
            _a.x -= _dx*_p; _a.y -= _dy*_p;
            _b.x += _dx*_p; _b.y += _dy*_p;
            // Jostling is still bounded by the floor. This pass runs AFTER the
            // per-actor clamp in updateNPC, so without this a crowd pressed up
            // against the back row pushed itself straight through the wall —
            // one follower stayed put, a squad did not.
            clampToFloor(_a); clampToFloor(_b);
        }
    }

    // ── ICE BLOCKS ──
    // After every other thing that moves, so a block has the last word on its
    // own tile. Running it before the separation pass above would let a
    // follower shove its way back in for a frame at a time.
    iceBlockTick();

    // ── RED HEALTH DECAY ──
    // Skips a neutral recruit. The decay is meant to bleed enemies that have
    // wandered off; a recruit is on team red only for bookkeeping until it
    // reaches the Crystal, and at 0.01 a frame a long walk in cost it 36 HP —
    // enough to kill a weak one on the way to a body it never got to use.
    actors.forEach(a=>{ if(a.team==="red" && !isNeutralBystander(a)){a.health-=0.01; if(a.health<=0){a.health=0;a.dead=true;}} });

    // ── PREDATOR SPAWNING — always present (graze by default, hunt when alarm is active) ──
    if (gameState.phase === "day" || gameState.phase === "night") {
        // Zone cap scales with night number: natural species fill zones 1-6, then
        // synthetic deep-zone constructs (XV-09 … QX-z1) fill zones 7-12.
        // Cap at 12 to populate infinite zones without unbounded actor counts.
        const hostileZoneCount = Math.min(gameState.nightNumber, 12);
        // A GLOBAL ceiling on top of the per-zone ones.
        //
        // The per-zone caps bound where predators are, not how many exist. A
        // facility alarm makes EVERY zone an alarm zone, each allowing 2+z, so
        // at wave 9 the zones alone allow 3+4+...+11 = 63 alive at once, and
        // more at wave 12.
        //
        // That is the term the frame time scales on. Measured at wave 9 with
        // the alarm up, holding everything else fixed: 61 predators cost
        // 7.02 ms of JS a frame, 29 cost 4.27 and 9 cost 3.33 — a flat
        // ~0.07 ms each on top of a ~3 ms floor. Nothing else in the frame
        // grows like that.
        // Counted by livePredatorCount(), not here: a second copy of the rule
        // is how the cocoon hatch ended up past the ceiling the spawner
        // respected, and how "your clones do not count" would drift out of one
        // of the two.
        let _livePredators = livePredatorCount();
        for (let z = 1; z <= hostileZoneCount; z++) {
            if (_livePredators >= MAX_LIVE_PREDATORS) break;
            // A zone stops producing only when EVERY mouth it has is shut —
            // its wall nest dead and its vortex sealed. It used to stop on the
            // nest alone, which would have made the vortex decorative.
            const mouths = zoneSpawnPoints(z);
            if (mouths && mouths.length === 0) continue;
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
                    // Recounted, not incremented: a zone-3 nymph arrives with
                    // its pack (maybeSwarm), so one spawn can be three.
                    _livePredators = livePredatorCount();
                    // Alarm zone: stagger spawns scaled by wave number (higher wave = faster spawns); wanderer zones: slow respawn
                    const _spawnDelay = isAlarmZone ? Math.max(15, 90 - (gameState.nightNumber - 1) * 5) : 240;
                    zoneRespawnTimers[z] = _spawnDelay;
                }
            }
        }
    }

    // ── WAVE FUNCTION PYLONS — link same-element pylons within getPylonRange()
    //    tiles of each other (3 by default, 5 with Signal Relay), apply zone effects ──
    // _wPylonPairs is pre-computed every 60 frames in the cache section above
    // Only the AWAKE ones act: a pylon on standby has nothing to work on.
    waveWakeTick();
    const wavePylons = _wPylons.filter(p => p.waveAwake !== false);

    // Apply effects for each pre-computed connected pair
    applyPylonZoneEffects(wavePylons);
    electricHasteTick();

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
            const isEnemy=isHostileTarget(a);
            if (!isEnemy) return;
            const dx=a.x-pv.x, dy=a.y-pv.y, d=Math.hypot(dx,dy);
            if (d>3||d<0.01) return;
            a.x-=dx/d*0.05; a.y-=dy/d*0.05;
            // Also track exposure
            a.pylonExposureFrames=(a.pylonExposureFrames||0)+1;
            if (a.pylonExposureFrames>PYLON_AGGRO_EXPOSURE&&!a.pylonAggro) a.pylonAggro=pv;
        });
    });

    // ── ATTACK MODE PYLON — fire missiles at nearby enemies ──
    _aPylons.forEach(t=>{
        // The timer waits at full while nothing is in range, so the first
        // round goes the moment something steps in rather than up to a full
        // interval later.
        t.attackFireTimer = Math.min(TURRET_FIRE_FRAMES, (t.attackFireTimer||0) + 1);
        if (t.attackFireTimer < TURRET_FIRE_FRAMES) return;
        // Find nearest enemy within range — squared distance avoids sqrt for non-targets
        let nearest=null, bd2=t.attackRange*t.attackRange;
        actors.forEach(a=>{
            if (isHostileTarget(a)) {
                const dx=a.x-t.x, dy=a.y-t.y, d2=dx*dx+dy*dy;
                if (d2<bd2) { bd2=d2; nearest=a; }
            }
        });
        if (!nearest) return;
        t.attackFireTimer = 0;
        // A turret that is shooting a predator is a pylon that is attacking it,
        // so that predator turns on it. Nothing else sends one after a pylon.
        if (nearest instanceof Predator && !nearest.pylonAggro) nearest.pylonAggro = t;
        // THE ROUND IS PAID FOR BEFORE IT LEAVES. A turret with nothing in
        // range has cost nothing up to here, which is the point — attack mode
        // is the cheap one precisely because it only spends when it fights.
        // An unaffordable shot is not fired at all rather than fired weak.
        if (!payForShot(t)) {
            t.powered = false;
            // Say so, once in a while: a turret that quietly stops firing reads
            // as a bug rather than as an empty battery.
            if (frame - (t._noPowerMsg || -9999) > 300) {
                t._noPowerMsg = frame;
                floatingTexts.push({ x: t.x, y: t.y - 1, text: "TURRET OUT OF POWER", color: "#ff7755", life: 90, vy: -0.07 });
            }
            return;
        }
        nearest._shotByPylon = true;   // the tutorial's "kill with your pylons" step reads this
        t._lastShotFrame = frame;      // the turret's muzzle flash and beam read these
        t._shotAt = { x: nearest.x, y: nearest.y };
        const _dmg = turretRoundDamage(t, nearest);
        // A HIT, not a bolt. The old round flew at 0.18 tiles a frame toward
        // where the target had been; this lands the frame it is paid for and
        // the beam in drawPylonTurret shows it.
        applyDamage(nearest, _dmg, {x:t.x, y:t.y, team:"green", element:t.attackModeElement||"core"}, t.attackModeElement||null);
        elementEffects.push({type:"impact",x:nearest.x,y:nearest.y,color:t.attackModeColor||"#0f8",radius:0.45,life:14,element:t.attackModeElement});
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
            // The two last-life saves (ghostphage, warden_pact) were crystal
            // builds and nothing can set one any more, so running out of HP
            // stat is simply permanent.
            if (newHp<=0) return; // permanent death — don't queue
            // A clone takes far longer to come back than a follower: it is
            // worth three times as much in a fight and cost shards and DNA, so
            // losing one has to be felt. The Crystal shows the countdown.
            const _respawnFrames = a.isClone ? CLONE_RESPAWN_FRAMES : 180;
            respawnQueue.push({ element:a.element, combatTrait:a.combatTrait, naturalTrait:a.naturalTrait, perk:a.perk, personality:a.personality, timer:_respawnFrames, totalTimer:_respawnFrames, isClone:a.isClone||false, speciesName:a.speciesName, className:a.className, hpStat:Math.max(1,newHp) });
        }
        // Progression counts EVERY enemy killed, wanderers included — it is a
        // record of what you have fought, not of wave quotas. The wave counter
        // below still ignores wanderers.
        // isEnemyUnit, NOT isHostileTarget: the latter refuses anything dead,
        // so `a.dead && isHostileTarget(a)` was never true and neither counter
        // ever ran. What is being asked here is whose side the corpse was on.
        if (a.dead && isEnemyUnit(a) && !a.progressCounted) {
            a.progressCounted = true;
            noteKillForProgression();
        }
        // track kills for wave clear — count dead enemies not clones, wanderers don't count
        if (a.dead && isEnemyUnit(a) && !a.killCounted && !a.isWanderer) {
            a.killCounted = true;
            nightKillCount++;
            // Was a seventh hand-written copy of the banner, in a format none of
            // the other six used ("Zone 2" where the rest say "TAKING ZONE 2").
            updateKillProgressUI();
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
    // Last look at the dead before they are swept — the tutorial's kill step
    // cannot poll for a corpse, because tutorialTick() ran earlier this frame
    // and the sweep below happens before it runs again.
    if (typeof tutorialMode !== "undefined" && tutorialMode) {
        actors.forEach(a=>{ if(a.dead) tutorialNoteKill(a); });
    }
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

    // ── INFESTATION — a conversion nobody is working on recovers ──
    decayConversions();
    // ── THE GRUB — one lives in zone 4 while that zone is hostile ──
    if (typeof broodSpawnTick === "function") broodSpawnTick();

    // ── GENERATOR PYLONS — mend the friendly pylons in reach ──
    generatorHealTick();
    generatorAuraTick();

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
    // THE BATTERIES. Regen first, then wave mode's constant draw — so a pool
    // that is exactly keeping up reads as steady rather than flickering.
    nestEnergyTick();
    waveDrainTick();
    powerFlowTick();

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

    // Culled in SCREEN space by visibleForDraw — see its comment for why the
    // old column-distance filter kept half the frame's work off screen. The
    // player and the crystal are never culled: the player IS the camera, and
    // the crystal is a fixed landmark other code expects in the list.
    let drawList=visibleTilesForDraw();
    drawList.push({type:'player',x:player.visualX,y:player.visualY});
    shards.forEach(s=>{ if(visibleForDraw(s.x,s.y)) drawList.push({type:'shard',x:s.x,y:s.y,shard:s}); });
    chargedMass.forEach(m=>{ if(visibleForDraw(m.x,m.y)) drawList.push({type:'mass',x:m.x,y:m.y,mass:m}); });
    actors.forEach(a=>{ if(visibleForDraw(a.x,a.y)) drawList.push({type:'npc',x:a.x,y:a.y,actor:a}); });
    groundItems.forEach(g=>{ if(visibleForDraw(g.x,g.y)) drawList.push({type:'groundItem',x:g.x,y:g.y,item:g}); });
    drawList.push({type:'crystal',x:crystal.x,y:crystal.y});
    // Depth is x+y: a bigger sum draws lower and in front.
    //
    // A WALL NEST is the exception. Its vortex is painted across a four-tile
    // wall face running from (x-1,-2) to (x+2,-2), but the tile it hangs on
    // sorts at x-1 — while the deepest wall tile of its own face sorts at
    // (x+2)+(-2) = x. So the last two wall tiles of the face were drawn AFTER
    // the nest and painted over its right-hand side: the nest looked half sunk
    // into the wall. Biasing it past them is enough, and is much narrower than
    // drawing nests last would be — drawn last, a nest would paint over
    // anything standing in front of the wall.
    //
    // Nothing in the tunnel is lost to the bias: the vortex sits high on the
    // wall face, well above the y=-1 floor row, so the handful of tiles that
    // now sort before it do not share pixels with it.
    drawList.sort((a,b)=>drawDepthOf(a)-drawDepthOf(b));

    // The cables are laid before anything is drawn, and each floor tile draws
    // its own pieces, so they lie on the ground under everything standing there.
    layAllCables();

    // ── DRAW EACH OBJECT ──
    drawList.forEach(obj=>{
        const px=(obj.x-player.visualX-(obj.y-player.visualY))*TILE_W+canvas.width/2;
        const py=(obj.x-player.visualX+(obj.y-player.visualY))*TILE_H+canvas.height/2;

        if (obj.type==='player') {
            drawPlayer({x:px,y:py});
        }
        else if (obj.type==='npc') {
            drawNPC(obj.actor,px,py);
            if (obj.actor.nestMass) drawPredatorNestMass(obj.actor, px, py + TILE_H);
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
            // ── FLOATING GEM ──
            // A faceted octahedron hovering over its own light pool, turning
            // slowly. Colour tracks health: cyan-blue while healthy, amber when
            // hurt, red when critical, with the spin and flicker getting more
            // agitated as it fails.
            const hpR   = Math.max(0, Math.min(1, crystal.health / crystal.maxHealth));
            const hurt  = 1 - hpR;
            const bob   = Math.sin(frame * 0.028) * 6;
            const rot   = frame * (0.010 + hurt * 0.012);
            const pulse = 0.72 + 0.28 * Math.sin(frame * 0.06);
            // A failing crystal stutters; a healthy one burns steady.
            const flick = hpR < 0.5
                ? (Math.sin(frame * 0.37) > 0.72 ? 0.45 + 0.55 * Math.abs(Math.sin(frame * 2.1)) : 1)
                : 1;

            const rgb  = hpR > 0.5 ? [ 90, 200, 255]
                       : hpR > 0.2 ? [255, 168,  60]
                                   : [255,  70,  70];
            const deep = hpR > 0.5 ? [ 20,  70, 160]
                       : hpR > 0.2 ? [150,  70,   0]
                                   : [130,  16,  16];
            const rs = (v, m) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${v * m})`;

            const cx  = px;
            const gy  = py - 52 + bob;              // gem centre
            const rx  = 27, ry = 13.5;               // equator radii (2:1 iso)
            const topY = 42, botY = 32;              // apex heights

            ctx.save();

            // ── Light pool on the floor, so it reads as hovering ──
            const poolY = py + TILE_H * 0.4;
            const poolR = 46 + pulse * 6;
            const pool  = ctx.createRadialGradient(cx, poolY, 2, cx, poolY, poolR);
            pool.addColorStop(0,   rs(0.30 * flick, 1));
            pool.addColorStop(0.45,rs(0.10 * flick, 1));
            pool.addColorStop(1,   rs(0, 1));
            ctx.save();
            ctx.translate(cx, poolY); ctx.scale(1, 0.4); ctx.translate(-cx, -poolY);
            ctx.fillStyle = pool;
            ctx.beginPath(); ctx.arc(cx, poolY, poolR, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // ── Outer halo ──
            const halo = ctx.createRadialGradient(cx, gy, 4, cx, gy, 62);
            halo.addColorStop(0, rs(0.26 * pulse * flick, 1));
            halo.addColorStop(1, rs(0, 1));
            ctx.fillStyle = halo;
            ctx.beginPath(); ctx.arc(cx, gy, 62, 0, Math.PI * 2); ctx.fill();

            // ── The gem itself: four equator points, an apex above and below ──
            const eq = [];
            for (let k = 0; k < 4; k++) {
                const a = rot + k * Math.PI / 2;
                eq.push({ x: cx + Math.cos(a) * rx, y: gy + Math.sin(a) * ry, a });
            }
            const apexT = { x: cx, y: gy - topY };
            const apexB = { x: cx, y: gy + botY };

            // Each face is one equator edge plus an apex. Sorting by the edge's
            // screen depth draws the far side first, so the near facets sit on top.
            const faces = [];
            for (let k = 0; k < 4; k++) {
                const p1 = eq[k], p2 = eq[(k + 1) % 4];
                const mid = (p1.y + p2.y) * 0.5;
                const lit = 0.5 + 0.5 * Math.cos((p1.a + p2.a) * 0.5 - Math.PI * 0.75);
                faces.push({ pts: [p1, p2, apexT], depth: mid, lit, up: true });
                faces.push({ pts: [p1, p2, apexB], depth: mid, lit: lit * 0.55, up: false });
            }
            faces.sort((a, b) => a.depth - b.depth);

            for (const f of faces) {
                const base = f.up ? 0.30 : 0.16;
                const v    = (base + f.lit * 0.62) * flick;
                ctx.beginPath();
                ctx.moveTo(f.pts[0].x, f.pts[0].y);
                ctx.lineTo(f.pts[1].x, f.pts[1].y);
                ctx.lineTo(f.pts[2].x, f.pts[2].y);
                ctx.closePath();
                ctx.fillStyle = `rgba(${(deep[0] + (rgb[0] - deep[0]) * v) | 0},` +
                                `${(deep[1] + (rgb[1] - deep[1]) * v) | 0},` +
                                `${(deep[2] + (rgb[2] - deep[2]) * v) | 0},0.93)`;
                ctx.fill();
                ctx.strokeStyle = rs(0.42 + f.lit * 0.52, flick);
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }

            // ── Inner core, seen through the facets ──
            ctx.globalCompositeOperation = 'lighter';
            const core = ctx.createRadialGradient(cx, gy, 0, cx, gy, 22);
            core.addColorStop(0, `rgba(255,255,255,${0.55 * pulse * flick})`);
            core.addColorStop(0.4, rs(0.30 * pulse * flick, 1));
            core.addColorStop(1, rs(0, 1));
            ctx.fillStyle = core;
            ctx.beginPath(); ctx.arc(cx, gy, 22, 0, Math.PI * 2); ctx.fill();
            ctx.globalCompositeOperation = 'source-over';

            // ── Motes orbiting the gem ──
            for (let m = 0; m < 5; m++) {
                const ma = frame * 0.02 + m * (Math.PI * 2 / 5);
                const mr = 30 + Math.sin(frame * 0.05 + m) * 5;
                const mx = cx + Math.cos(ma) * mr;
                const my = gy + Math.sin(ma) * mr * 0.42 + Math.sin(frame * 0.04 + m * 2) * 4;
                ctx.fillStyle = rs(0.30 + 0.35 * Math.sin(frame * 0.09 + m), flick);
                ctx.beginPath(); ctx.arc(mx, my, 1.7, 0, Math.PI * 2); ctx.fill();
            }

            // ── Fracture lines once it is badly hurt ──
            if (hpR < 0.55) {
                const ca = Math.min(1, (0.55 - hpR) * 2.2);
                ctx.strokeStyle = `rgba(255,${(90 * (1 - ca)) | 0},60,${ca * 0.8})`;
                ctx.lineWidth = 1.2;
                for (let c = 0; c < 3; c++) {
                    const a0 = rot * 0.4 + c * 2.1;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(a0) * 4, gy + Math.sin(a0) * 2);
                    ctx.lineTo(cx + Math.cos(a0) * rx * 0.8, gy + Math.sin(a0) * ry * 0.8 - 6);
                    ctx.lineTo(cx + Math.cos(a0 + 0.5) * rx * 0.6, gy + Math.sin(a0) * ry - topY * 0.35);
                    ctx.stroke();
                }
            }

            ctx.restore();

            drawHealthBar(px - 25, py - 118 + bob, 50, 7, crystal.health, crystal.maxHealth);
            drawCloneRespawnTicker(px, py - 130 + bob);
            if (hpR < 0.3 && frame % 30 < 15) {
                ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.fillStyle = "rgba(255,0,0,0.08)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            }
        }
        else if (obj.type==='mass') {
            drawChargedMass(obj.mass, px, py);
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
            if (obj.x < 0) { drawCampFloor(obj, px, py, amb); drawCablesOnTile(obj, px, py); return; }
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
                const REACH = PCB_TRACE_REACH;
                // Looked up, not searched: this used to loop over EVERY pylon
                // for EVERY visible floor tile, every frame — measured as the
                // single biggest cost in a dense base (66 pylons, ~10,000
                // distance checks a frame). The nearest-pylon distance per tile
                // is now built once per world-cache rebuild (rebuildPylonNear).
                const nearDist = pylonNearDist(obj.x, obj.y);
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

            // Cables run along the floor, under pylons and units (layAllCables).
            drawCablesOnTile(obj, px, py);

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

            // ── CAPTURABLE NODES (the signal tower) ──
            // wall_panel is drawn on the wall face in the wall_back pass — skip it here.
            if (obj.nodeType && obj.nodeType !== 'wall_panel') drawCapturableNode(obj, px, py);

            // ── A ZONE YOU HAVE TAKEN ──
            // Its nest is out: grey and still while it is merely neutral, blue
            // once you link it to a generator pylon. Never green — green is
            // home, and a zone you hold is not home.
            if (obj.nest && obj.nestHealth <= 0 && !obj._infestNest) {
                const _held = !!obj.connectedPylon;
                const sW1x=px, sW1y=py-60, numT=4, WH=110;
                const wfBL={x:sW1x-TILE_W,y:sW1y+TILE_H};
                const wfBR={x:sW1x+(numT-1)*TILE_W,y:sW1y+(numT+1)*TILE_H};
                const wfTR={x:wfBR.x,y:wfBR.y-WH};
                const wfTL={x:wfBL.x,y:wfBL.y-WH};
                // The SAME swirl, at the SAME size, as a live nest — only the
                // colour and the motion differ. It used to paint the whole
                // four-tile wall face a near-opaque brown first and then put a
                // half-size circle inside it, which read as a slab bolted to
                // the wall rather than as the portal it is, and gave no clue
                // where the thing you connect to actually was.
                //
                // The face geometry above is still worked out: the label and
                // the beam to the generator hang off its top edge.
                ctx.save();
                drawNestHackZone(obj);
                // A controlled nest turns, slowly, and is lit: it is yours and
                // it is running. A neutral one is dead still.
                // A neutral ring is DIM, not invisible. At no glow and half
                // alpha it vanished into the wall, and the player still has to
                // be able to find the thing they are meant to walk up to and
                // connect. It stays well under the live nest's glow of 10+ and
                // does not turn, so it still reads as switched off.
                drawNestWallVortex(px, py, Math.min(WH*0.42,46),
                    _held ? NEST_COLOUR_CONTROLLED : NEST_COLOUR_NEUTRAL,
                    _held ? (frame||0)*0.012 : 0,
                    _held ? 7 : 3,
                    _held ? 0.85 : 0.72);
                ctx.setTransform(1,0,0,1,0,0);
                const _bCx=(wfTL.x+wfTR.x)/2;
                ctx.fillStyle=_held ? NEST_COLOUR_CONTROLLED : NEST_COLOUR_NEUTRAL_DIM;
                ctx.font="bold 9px monospace"; ctx.textAlign="center";
                // Above the gauge, which takes the first 20px over the wall.
                ctx.fillText((_held?"◈ CONTROLLED":"◇ NEUTRAL") + (obj.powerOff ? " · OFF" : ""),_bCx,wfTL.y-30);
                // ── THE LIFE LEVEL ──
                // What the pylons are drawing out of it, drawn on the nest
                // itself as a percentage over a bar that empties. A battery the
                // player cannot see the level of is a number they have to infer
                // from their turrets going quiet. See drawNestGauge.
                drawNestGauge(obj, _bCx, wfTL.y, _held ? NEST_COLOUR_CONTROLLED : NEST_COLOUR_NEUTRAL_DIM);
                ctx.restore();

                // The link to its relay is a cable on the floor now, drawn with
                // the rest of the power chain (drawPowerChain) rather than as a
                // beam in the air from the face of the nest.
            }

            // ── SPAWN NEST — honeycomb hex holes filling 4-tile wall face ──
            // Only for the generated zone nests, which sit at y=-1 against the
            // wall. A nest GROWN by an infestation stands on open floor, and
            // this projection would paint its honeycomb onto a wall that is not
            // there — which is the flat rug that kept showing up. Those are
            // drawn as domes instead.
            // Zone 0's is the HOME PORTAL, not a hive — drawn green on its own
            // wall face and skipping every honeycomb below.
            if (isHomePortal(obj)) {
                drawHomePortal(px, py);
            }
            else if (obj.nest && obj.nestHealth > 0 && !obj._infestNest) {
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

                // The same vortex as the floor node, but standing IN THE WALL
                // FACE rather than lying flat. That plane is a shear — one tile
                // along the wall moves (TILE_W, TILE_H) on screen while up the
                // wall is straight up, and those two are not perpendicular — so
                // it is applied as a matrix rather than as a squashed ellipse.
                //
                // It replaces a honeycomb of ~88 hexes, which was around 800
                // canvas operations a frame for one nest.
                drawNestWallVortex(px, py,
                    Math.min(WH * 0.42, 46) * (0.55 + hr * 0.45),
                    hr > 0.35 ? NEST_COLOUR_HOSTILE : NEST_COLOUR_HOSTILE_HURT,
                    obj.nestPulse * 0.03, 10 + pulse * 6, 0.65 + hr * 0.35);

                // Health bar centred on the top edge of the face
                const barCx = (wfTL.x + wfTR.x) / 2;
                drawHealthBar(barCx - 40, wfTL.y - 10, 80, 5, obj.nestHealth, obj.nestMaxHealth);
                // What the predators have carried in, toward the next hatch.
                if (obj.massStock > 0) {
                    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
                    ctx.fillStyle = "#ff9966"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
                    // Low on the wall face, under the vortex, where it stays on screen
                    // when the camera is down on the floor (the health bar at the top
                    // of the face does not).
                    ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(barCx - 44, wfTL.y + WH - 22, 88, 13);
                    ctx.fillStyle = "#ff9966";
                    ctx.fillText("\u25c6 " + Math.floor(obj.massStock) + "/" + NEST_SPAWN_COST + " TO HATCH", barCx, wfTL.y + WH - 12);
                    ctx.restore();
                }

                // Hack progress — the word only, over the bar. The floor
                // beneath says WHERE, so the label does not have to.
                const _hackProg = obj.nestHackProgress || 0;
                if (_hackProg > 0) {
                    const _hp = _hackProg / NEST_HACK_FRAMES;
                    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
                    ctx.fillStyle = "rgba(0,0,0,0.55)";
                    ctx.fillRect(barCx - 40, wfTL.y - 22, 80, 7);
                    ctx.fillStyle = `rgba(0,255,136,${0.7 + 0.3 * Math.sin(frame * 0.3)})`;
                    ctx.fillRect(barCx - 40, wfTL.y - 22, 80 * _hp, 7);
                    ctx.strokeStyle = "#0f8"; ctx.lineWidth = 1;
                    ctx.strokeRect(barCx - 40, wfTL.y - 22, 80, 7);
                    ctx.font = "9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "#0f8";
                    ctx.fillText("HACKING", barCx, wfTL.y - 26);
                    ctx.restore();
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
                    
                    ctx.beginPath(); ctx.arc(px,py-60,r,0,Math.PI*2); ctx.fill();
                    ctx.shadowBlur=0;
                    for (let s=0;s<5;s++) {
                        const phase=frame*0.07+s*(Math.PI*2/5);
                        const sr=14+Math.sin(phase)*5;
                        ctx.globalAlpha=0.45+pulse2*0.2; ctx.fillStyle="#8800ff";
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


            // ── CONNECTOR: circuit state + reach ──
            if (isConnectorPylon(obj) && obj.pillarTeam === "green") {
                const _on = obj.circuitOn !== false;
                ctx.save(); ctx.setTransform(1,0,0,1,0,0);
                // The reach, as the ground ellipse a circle of CONNECTOR_RANGE
                // tiles makes under the projection. Faint when closed.
                const _cx = (obj.x - player.visualX - (obj.y - player.visualY)) * TILE_W + canvas.width/2;
                const _cy = (obj.x - player.visualX + (obj.y - player.visualY)) * TILE_H + canvas.height/2 + TILE_H;
                // REPORTED: "I don't know what the giant circles are that encompass
                // more than half of the zones." This was it — the connector's
                // 14-tile reach, drawn all the time. Now it shows only while you
                // have that connector selected (its ring or its INFO panel open).
                const _sel = (typeof commandMode !== "undefined" && commandMode && commandTarget === obj) ||
                             (typeof infoPanelOpen !== "undefined" && infoPanelOpen && typeof infoPanelTarget !== "undefined" && infoPanelTarget === obj);
                if (_sel) {
                    ctx.strokeStyle = CONNECTOR_COLOR; ctx.globalAlpha = _on ? 0.35 : 0.12; ctx.lineWidth = 1.5;
                    ctx.setLineDash([6,8]);
                    ctx.beginPath();
                    for (let i = 0; i <= 48; i++) {
                        const a = i / 48 * Math.PI * 2, dx = Math.cos(a) * CONNECTOR_RANGE, dy = Math.sin(a) * CONNECTOR_RANGE;
                        const sx = _cx + (dx - dy) * TILE_W, sy = _cy + (dx + dy) * TILE_H;
                        i ? ctx.lineTo(sx, sy) : ctx.moveTo(sx, sy);
                    }
                    ctx.stroke(); ctx.setLineDash([]);
                }
                ctx.globalAlpha = 1;
                cachedText(_on ? "\u25cf CIRCUIT ON" : "\u25cb CIRCUIT OFF", "bold 9px monospace", _on ? CONNECTOR_COLOR : "#f88", _cx, _cy - 78);
                ctx.restore();
            }

            // ── GENERATOR: on/off state ──
            if (isGeneratorPylon(obj) && obj.pillarTeam === "green") {
                const _gon = obj.circuitOn !== false;
                const _gx = (obj.x - player.visualX - (obj.y - player.visualY)) * TILE_W + canvas.width/2;
                const _gy = (obj.x - player.visualX + (obj.y - player.visualY)) * TILE_H + canvas.height/2 + TILE_H;
                ctx.save(); ctx.setTransform(1,0,0,1,0,0);
                cachedText(_gon ? "\u25cf GENERATOR ON" : "\u25cb GENERATOR OFF", "bold 9px monospace", _gon ? "#8fd6ff" : "#f88", _gx, _gy - 78);
                ctx.restore();
            }

            // ── NETWORK NODE TILE HIGHLIGHT ──
            if (obj.pillar&&!obj.destroyed&&obj.pillarTeam==="green"&&obj.health>0&&obj.attackModeElement) {
                const _gelDef = PYLON_PICKER_TYPES.find(e=>e.id===obj.attackModeElement);
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
                // Glow as a wide faint stroke under a thin bright one: a
                // shadowBlur here ran under every pylon tile, every frame.
                ctx.lineWidth = 7; ctx.globalAlpha = (0.3 + _gpulse * 0.4) * 0.25; ctx.stroke();
                ctx.lineWidth = 2; ctx.globalAlpha = 0.3 + _gpulse * 0.4;
                ctx.stroke();
                ctx.restore();
            }

            // ── BROKEN PYLON ──
            // A pylon that loses its health keeps its tile, its element and its
            // mode — nothing used to draw it, so it simply vanished and looked
            // gone for good. It is wreckage now, and a CORE worker can put it
            // back up exactly as it was.
            if (obj.pillar && obj.destroyed) {
                const _bb = py + TILE_H;
                const _bcol = obj.pillarTeam === "green" ? "#0a6" : "#722";
                ctx.save();
                // Scorch on the tile
                ctx.globalAlpha = 0.5 * amb;
                ctx.fillStyle = "rgba(10,8,6,0.9)";
                ctx.beginPath();
                ctx.ellipse(px, _bb - 2, 20, 9, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                // Snapped stump plus two fallen shards, angled off the base
                ctx.strokeStyle = _bcol; ctx.lineWidth = 3; ctx.lineCap = "round";
                ctx.beginPath();
                ctx.moveTo(px - 4, _bb - 2); ctx.lineTo(px - 2, _bb - 16); ctx.lineTo(px + 3, _bb - 11);
                ctx.stroke();
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.moveTo(px + 6, _bb - 3);  ctx.lineTo(px + 15, _bb - 9);  ctx.stroke();
                ctx.beginPath(); ctx.moveTo(px - 12, _bb - 1); ctx.lineTo(px - 19, _bb - 7); ctx.stroke();
                // Rebuild progress, so a repair in flight is visible
                const _rp = obj.reconstructProgress || 0;
                if (_rp > 0) {
                    ctx.strokeStyle = "#00ccaa"; ctx.lineWidth = 2.4;
                    ctx.beginPath();
                    ctx.arc(px, _bb - 12, 16, -Math.PI / 2, -Math.PI / 2 + _rp * Math.PI * 2);
                    ctx.stroke();
                }
                // Label only for the player's own wreckage — theirs to fix
                if (obj.pillarTeam === "green") {
                    ctx.fillStyle = `rgba(0,204,170,${0.55 + 0.35 * Math.sin(frame * 0.08)})`;
                    ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.fillText("BROKEN", px, _bb - 30);
                }
                ctx.restore();
            }

            // Pillar — one design, drawn for every pylon and upgrade
            if (obj.pillar&&!obj.destroyed&&typeof obj.health==="number"&&obj.health>0) {
                if(obj.converting){ctx.fillStyle="#ff0";}
                const _base=py+TILE_H; // anchor to tile center, not north vertex
                drawHealthBar(px-10,_base-75,20,4,obj.health,obj.maxHealth);
                const _pulse=0.5+0.5*Math.sin(frame*0.08+(obj.x*0.97+obj.y*1.31));
                // A pylon with no power is DARK, and the colour is the whole
                // readout: the element it is set to is still there, it just is
                // not doing anything. Drawing it lit would say the grid was
                // fine while the turret quietly refused to fire.
                const _dark = obj.powered === false;
                const _acol = _dark ? POWER_DEAD_COLOUR : (obj.attackModeColor||"#0f8");
                const _isActive=!!(obj.attackMode||obj.waveMode);
                const _wTier=obj.waveMode?(networkStrength[obj.attackModeElement]||0):0;
                const _tierMult=1+_wTier*0.4;

                // STANDBY: a support/disruption pylon with nothing to work on
                // rests unlit; it blinks for WAVE_WAKE_BLINK frames on waking.
                const _asleep = obj.waveMode && !_dark && obj.waveAwake === false;
                const _sinceWake = obj._wakeFrame === undefined ? Infinity : frame - obj._wakeFrame;
                // ── WAVE MODE — background glow ring ──
                if (obj.waveMode && !_dark && !_asleep) {
                    const _wGlowR=(20+_pulse*5)*Math.min(1.5,_tierMult);
                    const _wGlowA=Math.min(0.5,(0.12+_pulse*0.1)*_tierMult);
                    ctx.save(); ctx.globalAlpha=_wGlowA; ctx.fillStyle=_acol;
                    ctx.beginPath(); ctx.arc(px,_base-36,_wGlowR,0,Math.PI*2); ctx.fill();
                    ctx.restore();
                    if (_wTier>=2) {
                        ctx.save(); ctx.globalAlpha=(0.07+_pulse*0.07)*_tierMult;
                        ctx.strokeStyle=_acol; ctx.lineWidth=3;
                        ctx.beginPath(); ctx.arc(px,_base-36,_wGlowR+10+_pulse*6,0,Math.PI*2); ctx.stroke();
                        ctx.restore();
                    }
                }
                // ── ATTACK MODE — range ring ──
                // No range ring while dark: the ring says "this is covered",
                // and an unpowered turret covers nothing.
                if (obj.attackMode && !_dark) {
                    ctx.save(); ctx.globalAlpha=0.08+_pulse*0.08; ctx.strokeStyle=_acol; ctx.lineWidth=2;
                    ctx.beginPath(); ctx.arc(px,_base-20,obj.attackRange*TILE_W*0.5,0,Math.PI*2); ctx.stroke();
                    ctx.restore();
                }

                // ── BODY STRUCTURE — one design for every pylon ──
                // An isometric fortress tower, three visible faces per block.
                // There used to be a switch over six random bodies here; this
                // was the only one that read well at this scale, so it is now
                // the whole set and every upgrade wears it.
                // A WAVE pylon is the striped Barcode Tablet instead (design 8,
                // drawWaveMonolith in draw.js); everything else is the tower.
                const _isWaveMono = obj.waveMode && !isRelayPylon(obj);
                if (_isWaveMono) {
                    drawWaveMonolith(px, _base, _acol, _dark, _wTier, _asleep);
                    if (!_dark && !_asleep && _sinceWake < WAVE_WAKE_BLINK) drawWaveWakeBlink(px, _base, _acol, _sinceWake);
                }
                else {
                    const sFront=_isActive?SENTINEL_FRONT_ACTIVE:obj.upgraded?SENTINEL_FRONT_UPGRADED:SENTINEL_FRONT_DORMANT;
                    const sRight=_isActive?SENTINEL_RIGHT_ACTIVE:obj.upgraded?SENTINEL_RIGHT_UPGRADED:SENTINEL_RIGHT_DORMANT;
                    const sTop=_isActive?SENTINEL_TOP_ACTIVE:obj.upgraded?SENTINEL_TOP_UPGRADED:SENTINEL_TOP_DORMANT;
                    // Stamped from a pre-rendered sprite (drawSentinelTower in draw.js).
                    drawSentinelTower(px, _base, sFront, sRight, sTop, _isActive, SENTINEL_SLIT);
                }

                // ── TOP EFFECTS: glows, orbs, labels ──
                // One body, so one orb height — it sits just above the merlons.
                const _orbY = _base-54;

                if (_isActive) {
                    // Glowing orb at structure top — not on a wave monolith, whose
                    // stripes are its light.
                    if (!_isWaveMono) {
                    const _orbR=obj.waveMode?6+_wTier:5;
                    ctx.save(); ctx.fillStyle=_acol;
                    // halo instead of a blur
                    ctx.globalAlpha=0.18+_pulse*0.12; ctx.beginPath(); ctx.arc(px,_orbY,_orbR*2.2,0,Math.PI*2); ctx.fill();
                    ctx.globalAlpha=0.7+_pulse*0.3;
                    ctx.beginPath(); ctx.arc(px,_orbY,_orbR,0,Math.PI*2); ctx.fill();
                    ctx.restore();
                    }
                    // A pylon in turret mode wears a self-aiming gun that tracks
                    // and locks onto whatever it is about to shoot.
                    if (obj.attackMode && !isRelayPylon(obj)) drawPylonTurret(obj, px, _orbY, _acol, _dark);
                    // Element + tier label
                    const PYLON_FX_TIER={fire:["fire wall","heavy burn","ignite spread"],ice:["ice field","chill zone","deep freeze"],electric:["arc chain","arc boost","max arc"],core:["shield barrier","fast shields","regen shields"],flux:["gravity well","chain pull","vortex"],toxic:["corrodes enemies","shred+plague","plague cloud"]};
                    const PYLON_FX2={fire:"fire wall",ice:"ice field",electric:"arc chain",core:"shield barrier",flux:"gravity well",toxic:"corrodes enemies"};
                    const el0=obj.attackModeElement||"";
                    const _wTierBadge=obj.waveMode&&_wTier>0?[" T-I"," T-II"," T-III"][_wTier-1]:"";
                    const _tierDesc=obj.waveMode?(_wTier>0?(PYLON_FX_TIER[el0]?.[_wTier-1]||""):(PYLON_FX_TIER[el0]?.[0]||"")):(PYLON_FX2[el0]||"");
                    // A wave pylon is named by its ROLE — SUPPORT or DISRUPTION —
                    // with the element and what it does underneath, or STANDBY.
                    const _title = obj.waveMode && !isRelayPylon(obj) ? waveRoleLabel(el0)+_wTierBadge : el0.toUpperCase()+_wTierBadge;
                    const _sub = obj.waveMode && !isRelayPylon(obj)
                        ? el0 + " \u00b7 " + (_asleep ? "standby" : _tierDesc) : _tierDesc;
                    // Stamped from a cache (cachedText in draw.js), not re-rendered.
                    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
                    if (_asleep) ctx.globalAlpha=0.6;
                    cachedText(_title, "bold 9px monospace", _acol, px, _orbY-12);
                    ctx.globalAlpha=_asleep?0.45:0.7;
                    cachedText(_sub, "7px monospace", _acol, px, _orbY-3);
                    ctx.restore();
                    // Seasoned gold bands at base
                    if ((obj.seasoned||0)>0) {
                        const sLevel=Math.min(3,obj.seasoned);
                        ctx.save(); ctx.strokeStyle="#ffd700"; ctx.lineWidth=1+sLevel*0.5;
                        ctx.globalAlpha=0.55+_pulse*0.25; 
                        for (let _si=0;_si<sLevel;_si++) { ctx.beginPath(); ctx.rect(px-8-_si,_base-12-_si*4,16+_si*2,2); ctx.stroke(); }
                        ctx.restore();
                    }
                } else if (obj.upgraded) {
                    // Dormant upgraded state — style-specific cyan aura
                    ctx.save(); ctx.globalAlpha=0.2+_pulse*0.12; ctx.fillStyle="#0ff";
                    ctx.beginPath(); ctx.arc(px,_orbY,10,0,Math.PI*2); ctx.fill();
                    ctx.globalAlpha=0.8; ctx.beginPath(); ctx.arc(px,_orbY,3,0,Math.PI*2); ctx.fill();
                    ctx.restore();
                    // Upgraded detail — the battlements light up.
                    ctx.save(); ctx.strokeStyle=SENTINEL_ACCENT; ctx.lineWidth=1;
                    ctx.globalAlpha=0.5+_pulse*0.3;
                    ctx.strokeRect(px-7,_base-52,4,4); ctx.strokeRect(px+3,_base-52,4,4);
                    ctx.restore();
                } else {
                    // Base state — team color orb indicator
                    const dist2=Math.sqrt((obj.x-player.visualX)**2+(obj.y-player.visualY)**2);
                    const amb2=Math.max(0.1,0.8-dist2/RENDER_DIST);
                    ctx.fillStyle=obj.pillarCol;
                    ctx.globalAlpha=0.25*amb2+0.1; ctx.beginPath(); ctx.arc(px,_orbY,6,0,Math.PI*2); ctx.fill();
                    ctx.globalAlpha=1; ctx.beginPath(); ctx.arc(px,_orbY,3,0,Math.PI*2); ctx.fill();
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
                        // Trimmed to match the sentinel pylons: steel plate,
                        // a lit bevel rather than a flat green rim, and the
                        // same near-black slit the towers use for their
                        // arrow loops.
                        const activated = _panel.panelActivated;
                        const _blink    = Math.sin(frame * 0.12 + xi * 1.7);
                        const rimCol    = activated ? SENTINEL_ACCENT_DIM : SENTINEL_ACCENT;
                        const screenCol = activated ? SENTINEL_SLIT : '#0a141e';
                        const ledCol    = activated ? SENTINEL_ACCENT_DIM
                                                    : (_blink > 0.6 ? '#bfe4ff' : SENTINEL_ACCENT);
                        // Wall-space origin (same as circuit section)
                        const WX = px - TILE_W, WY = py + TILE_H;
                        // Panel center in wall-space: x=30 (center), y=WH*0.52 (mid-height)
                        const pcx = 30, pcy = WH * 0.52, pw = 24, ph = 36;

                        ctx.save();
                        ctx.transform(1, 0.5, 0, -1, WX, WY);
                        ctx.globalAlpha = 0.92 * amb;
                        ctx.shadowColor = activated ? 'transparent' : SENTINEL_ACCENT;
                        ctx.shadowBlur  = activated ? 0 : 6 + _blink * 5;

                        const pL = pcx - pw/2, pT = pcy - ph/2;
                        // Plate — sentinel's front face, dimmer when spent
                        ctx.fillStyle = activated ? SENTINEL_FRONT_DORMANT : SENTINEL_FRONT_ACTIVE;
                        ctx.fillRect(pL, pT, pw, ph);
                        // Bevel: a lit top edge and a shadowed bottom, the way
                        // the tower reads a top face against a right face.
                        ctx.fillStyle = activated ? SENTINEL_TOP_DORMANT : SENTINEL_TOP_ACTIVE;
                        ctx.fillRect(pL, pT + ph - 2, pw, 2);          // wall-space y is inverted
                        ctx.fillStyle = SENTINEL_RIGHT_ACTIVE;
                        ctx.fillRect(pL, pT, pw, 1.5);
                        // Frame
                        ctx.strokeStyle = rimCol; ctx.lineWidth = 1;
                        ctx.strokeRect(pL, pT, pw, ph);
                        // Stepped crown — the tower's two merlons, in miniature
                        ctx.fillStyle = activated ? SENTINEL_TOP_DORMANT : SENTINEL_TOP_ACTIVE;
                        ctx.fillRect(pL + 3,      pT + ph, 4, 2.5);
                        ctx.fillRect(pL + pw - 7, pT + ph, 4, 2.5);
                        // Corner rivets
                        ctx.fillStyle = rimCol; ctx.globalAlpha = 0.55 * amb;
                        for (const [rx, ry] of [[pL+2.5,pT+2.5],[pL+pw-2.5,pT+2.5],
                                                [pL+2.5,pT+ph-2.5],[pL+pw-2.5,pT+ph-2.5]]) {
                            ctx.beginPath(); ctx.arc(rx, ry, 0.8, 0, Math.PI*2); ctx.fill();
                        }
                        ctx.globalAlpha = 0.92 * amb;
                        // Wall-space y points UP, so small y draws low on screen:
                        // the readout sits at pT+3 (low) and the slit above it.
                        // Getting this backwards reads as a keyhole, not a panel.
                        // Readout recess — the arrow-slit black
                        ctx.fillStyle = screenCol;
                        ctx.fillRect(pL + 2, pT + 3, pw - 4, 13);

                        if (!activated) {
                            // Scrolling scan line, inside the recess
                            const lineY = pT + 3 + ((frame * 0.6 + xi * 5) % 13);
                            ctx.globalAlpha = 0.4;
                            ctx.fillStyle = SENTINEL_ACCENT;
                            ctx.fillRect(pL + 2, lineY, pw - 4, 1);
                            ctx.globalAlpha = 0.92 * amb;
                            // Vertical loop above the readout, mirroring the
                            // tower's arrow slit.
                            ctx.fillStyle = SENTINEL_SLIT;
                            ctx.fillRect(pcx - 1.5, pT + 19, 3, ph - 26);
                            ctx.fillRect(pcx - 4,   pT + 25, 8, 3);
                            // LED beside the readout
                            ctx.fillStyle = ledCol;
                            ctx.shadowColor = ledCol; ctx.shadowBlur = 4;
                            ctx.beginPath(); ctx.arc(pL + pw - 4, pT + 9, 2, 0, Math.PI*2); ctx.fill();
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
                                hurtPlayer(10, 6);
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
    // Deliberately empty. The objective, the alarm and the kill tally used to be
    // painted here at a hardcoded screen x=230,y=58 — which is inside the HUD
    // banner's box on anything narrower than a desktop, so the two sentences
    // overprinted each other and neither could be read. The banner (#waveInfo)
    // is laid out by the browser, says all three things, and flashes via its
    // "alarm" class, so there is nothing left for the canvas to say.

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
                // makeClone, so a respawned clone is the same thing the
                // summon built. This block used to construct its own and left
                // off the power multiplier entirely — one death and a clone
                // was an ordinary predator for the rest of the game.
                const clone = makeClone(entry.speciesName, entry.className, crystal.x, crystal.y);
                if (!clone) { respawnQueue.splice(i,1); continue; }
            } else {
                // Respawn as regular follower — apply HP stat degradation
                const def         = NPC_TYPES["virus"];
                const personality = entry.personality || PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)];
                const stats       = applyPersonality(personality);
                if (entry.hpStat!==undefined) stats.hp = entry.hpStat;
                const role        = assignRole(stats);
                const hp          = entry.ghostphageLife ? 1 : stats.hp;
                // The element comes from the Crystal, not from the corpse. A
                // follower respawns AT the crystal, so it is re-modulated on the
                // way out — which is what makes the modulation chip a live dial
                // rather than something that only affects brand-new recruits.
                // A boss modulator still overrides it.
                const rPool = activeCrystalModulation
                    ? activeCrystalModulation.pair
                    : recruitElementPool();
                const rElement = rPool[Math.floor(Math.random()*rPool.length)] || entry.element || "fire";
                const npc = {
                    type:"virus", element:rElement, x:crystal.x, y:crystal.y, team:"green",
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
                if(!followerByElement[rElement]) followerByElement[rElement]=[];
                followerByElement[rElement].push(npc);
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
                    : isHostileTarget(a);
                if (isTarget) {
                    const dx=(p.x-a.x)*TILE_W, dy=(p.y-a.y)*TILE_H;
                    if (Math.hypot(dx,dy) < 30) {
                        applyDamage(a, p.damage, p.source);
                        if (p.onHit) p.onHit(a);
                        hit = true;
                    }
                }
            });
            // Predator abdomen shots can also hit the player directly — gated,
            // because predators do not attack the player. Ungated it also ate
            // the shot, so this is the difference between being hit and the
            // round passing you by.
            if (!hit && p.targetsGreen && predatorMayHurtPlayer()) {
                const dx=(p.x-player.x)*TILE_W, dy=(p.y-player.y)*TILE_H;
                if (Math.hypot(dx,dy) < 30) {
                    // Immunity stops the damage but still eats the shot, so a
                    // projectile does not pass through and hit twice.
                    hurtPlayer(p.damage, 5);
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
    drawSiphonWisps();
    // The hold line is world geometry, so it draws with the world rather than
    // up with the interface.
    drawHoldLine();
    // The power chain over the mending filament: the mending line is incidental,
    // the power is the thing the player is managing.
    drawGeneratorLinks();
    if (typeof drawGrubCorpses === "function") drawGrubCorpses();
    drawConversionBars();
    drawTutorialHighlight();
    drawFloatingTexts();
    drawCrystalButton();
    // The clone bay first, then its button over it, so the button that
    // opened the bay (and closes it) is never dimmed by the bay's backdrop.
    drawCloneMenu();
    drawClonesBlob();
    drawRadialMenu();
    drawCrystalPanel();
    drawGestureFeedback();
    drawFollowerElementUI();
    drawElementPicker();
    drawPylonConfirm();
    drawInfoPanel();
    drawShopButton();
    drawCampButton();
    drawAmmoChip();
    drawSettingsButton();
    drawFollowerDutyMenu();
    drawSettingsPanel();
    drawCampMenu();
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
    const pw = powerStatus();
    // The grid line shows from the first pylon, before any network has formed —
    // it is the thing the player is now budgeting, so it cannot wait for a
    // resonance tier to appear first.
    if (activeEls.length === 0 && pw.drawing === 0) return;

    ctx.save(); ctx.setTransform(1,0,0,1,0,0);

    const ROW_H   = 24;
    const PAD     = 8;
    const W       = 148;
    const HEADER  = 16;
    const POWER_H = 26;
    const H       = HEADER + POWER_H + activeEls.length * ROW_H + PAD;
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

    // ── POWER — what is left in the batteries being drawn on ──
    // The total across the pools, because that is the thing that runs out.
    // Red the moment a pylon has gone dark, which is the only state the player
    // has to act on.
    const _pTot = pw.pools.reduce((a, p) => a + p.energy, 0);
    const _pCap = pw.pools.reduce((a, p) => a + p.max, 0);
    const _pOk = pw.dark === 0;
    ctx.fillStyle = _pOk ? "#8fd" : "#ff5522";
    ctx.font = "bold 10px monospace"; ctx.textAlign = "left";
    ctx.fillText("\u26a1 " + _pTot + " / " + _pCap, X + PAD, Y + 26);
    ctx.font = "8px monospace"; ctx.textAlign = "right";
    ctx.fillStyle = _pOk ? "#3a4555" : "#ff5522";
    ctx.fillText(_pOk ? (pw.drawing + " DRAWING") : (pw.dark + " UNPOWERED"),
                 X + W - PAD, Y + 26);
    ctx.strokeStyle = "rgba(0,255,136,0.12)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(X + PAD, Y + 32); ctx.lineTo(X + W - PAD, Y + 32); ctx.stroke();

    // Tier label lookup
    const TIER_LABEL  = ["", "I", "II", "III"];
    const TIER_COLOR  = ["", "#888888", "#aaddff", "#ffd700"];

    // Per-element rows
    activeEls.forEach((elDef, i) => {
        const el        = elDef.id;
        const tier      = networkStrength[el] || 0;
        const integrity = networkIntegrity[el] || 0;
        const ry        = Y + HEADER + POWER_H + i * ROW_H;

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

