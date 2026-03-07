// ─────────────────────────────────────────────────────────
//  ELEMENT EFFECTIVENESS
// ─────────────────────────────────────────────────────────
// Triangle 1 — Volatile:  Fire > Flux > Toxic > Fire
// Triangle 2 — Arcane:    Electric > Core > Ice > Electric
const ELEMENT_STRONG_AGAINST = {
    fire:"flux", flux:"toxic", toxic:"fire",
    electric:"core", core:"ice", ice:"electric"
};
const ELEMENT_WEAK_TO = {
    fire:"toxic", flux:"fire", toxic:"flux",
    electric:"ice", core:"electric", ice:"core"
};

function getElementMultiplier(attackerElement, defenderElement) {
    if (!attackerElement || !defenderElement) return 1;
    // Ice is fully ineffective against core — zero damage
    if (attackerElement === "ice" && defenderElement === "core") return 0;
    if (ELEMENT_STRONG_AGAINST[attackerElement] === defenderElement) return 1.3;
    if (ELEMENT_WEAK_TO[attackerElement]         === defenderElement) return 0.7;
    return 1;
}

// ─────────────────────────────────────────────────────────
//  ELEMENT PROC RATES
// ─────────────────────────────────────────────────────────
const ELEMENT_PROC_CHANCE = {
    fire:     0.30,
    electric: 0.40,
    ice:      0.08,   // rare but powerful
    flux:     0.15,
    core:     0.30,
    toxic:    0.50    // high but softer effect
};

// ─────────────────────────────────────────────────────────
//  ELEMENT ATTACK DEFINITIONS
// ─────────────────────────────────────────────────────────
// Each element: physical(actor, target) and special(actor, target)
// Both return a visual effect descriptor for rendering
// Will cost: physical = 1, special = 4

const WILL_COST_PHYSICAL = 1;
const WILL_COST_SPECIAL  = 4;
const WILL_REGEN_RATE    = 0.005; // per frame passive (~0.3/sec; meaningful cost)

const ELEMENT_ATTACKS = {

    // ── FIRE ─────────────────────────────────────────────
    fire: {
        physical(actor, target) {
            // Ring of fire around the follower
            spawnElementEffect({
                type: "ring",
                x: actor.x, y: actor.y,
                color: "#ff3300",
                radius: 1.5,
                life: 30,
                element: "fire"
            });
            // Hits all enemies within ring radius
            let hits = 0;
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator && a.team!=="green" && !a.isClone)) && !a.dead) {
                    const dx=a.x-actor.x, dy=a.y-actor.y;
                    if (Math.sqrt(dx*dx+dy*dy) <= 1.5) {
                        const dmg = (actor.stats?.attack||10) * 0.4;
                        applyElementalDamage(a, dmg, actor, "fire");
                        hits++;
                        // Burn proc
                        if (Math.random() < ELEMENT_PROC_CHANCE.fire) {
                            a.burning = 120; // frames
                            a.burnDamage = dmg * 0.08;
                        }
                    }
                }
            });
            return { hit: hits > 0 };
        },
        special(actor, target) {
            // Meteor — AOE at target position
            if (!target) return { hit: false };
            spawnElementEffect({
                type: "meteor",
                x: target.x, y: target.y,
                color: "#ff3300",
                radius: 2.0,
                life: 45,
                element: "fire"
            });
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator && a.team!=="green" && !a.isClone)) && !a.dead) {
                    const dx=a.x-target.x, dy=a.y-target.y;
                    if (Math.sqrt(dx*dx+dy*dy) <= 2.0) {
                        const dmg = (actor.stats?.specialAttack||10) * 0.9;
                        applyElementalDamage(a, dmg, actor, "fire");
                        if (Math.random() < ELEMENT_PROC_CHANCE.fire) {
                            a.burning = 180;
                            a.burnDamage = dmg * 0.1;
                        }
                    }
                }
            });
            return { hit: true };
        }
    },

    // ── ELECTRIC ─────────────────────────────────────────
    electric: {
        physical(actor, target) {
            if (!target) return { hit: false };
            // Chain lightning — jumps up to 3 targets
            const chainTargets = [];
            let current = target;
            for (let c = 0; c < 3; c++) {
                if (!current) break;
                chainTargets.push(current);
                const dmg = (actor.stats?.attack||10) * 0.35 * (1 - c*0.2);
                applyElementalDamage(current, dmg, actor, "electric");
                if (Math.random() < ELEMENT_PROC_CHANCE.electric) {
                    current.chainArcFlash = 12;
                }
                // Find next nearest unchained enemy
                let next = null, bd = Infinity;
                actors.forEach(a => {
                    if ((a.team==="red"||(a instanceof Predator)) && !a.dead && !chainTargets.includes(a)) {
                        const dx=a.x-current.x, dy=a.y-current.y, d=Math.sqrt(dx*dx+dy*dy);
                        if (d < 3 && d < bd) { bd=d; next=a; }
                    }
                });
                current = next;
            }
            spawnElementEffect({
                type: "chain",
                x: actor.x, y: actor.y,
                targets: chainTargets,
                color: "#ffee33",
                life: 15,
                element: "electric"
            });
            return { hit: true };
        },
        special(actor, target) {
            // Static field — AOE pulse hits all nearby enemies
            spawnElementEffect({
                type: "ring",
                x: actor.x, y: actor.y,
                color: "#ffee33",
                radius: 3.0,
                life: 40,
                element: "electric"
            });
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator && a.team!=="green" && !a.isClone)) && !a.dead) {
                    const dx=a.x-actor.x, dy=a.y-actor.y;
                    if (Math.sqrt(dx*dx+dy*dy) <= 3.0) {
                        applyElementalDamage(a, (actor.stats?.specialAttack||10)*0.7, actor, "electric");
                        if (Math.random() < ELEMENT_PROC_CHANCE.electric) {
                            a.chainArcFlash = 20;
                        }
                    }
                }
            });
            return { hit: true };
        }
    },

    // ── ICE ───────────────────────────────────────────────
    ice: {
        physical(actor, target) {
            if (!target) return { hit: false };
            // Frost lance — single target, high accuracy
            const hitChance = Math.min(0.98, 0.6 + (actor.stats?.accuracy||10) / 50);
            if (Math.random() > hitChance) return { hit: false };
            applyElementalDamage(target, (actor.stats?.attack||10)*0.55, actor, "ice");
            spawnElementEffect({ type:"impact", x:target.x, y:target.y, color:"#99ddff", radius:0.6, life:20, element:"ice" });
            // Hard freeze proc — blocked by shields
            if (Math.random() < ELEMENT_PROC_CHANCE.ice && !(target.shielded && target.shieldAmount > 0)) {
                target.frozen = true;
                target.frozenEscapeChance = 0.01;
            }
            return { hit: true };
        },
        special(actor, target) {
            // Ice burst — radius slow
            spawnElementEffect({ type:"ring", x:actor.x, y:actor.y, color:"#99ddff", radius:2.5, life:50, element:"ice" });
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator && a.team!=="green" && !a.isClone)) && !a.dead) {
                    const dx=a.x-actor.x, dy=a.y-actor.y;
                    if (Math.sqrt(dx*dx+dy*dy) <= 2.5) {
                        applyElementalDamage(a, (actor.stats?.specialAttack||10)*0.6, actor, "ice");
                        // Slow and freeze blocked by shields
                        if (!(a.shielded && a.shieldAmount > 0)) { a.slowed = 180; a.slowFactor = 0.4; }
                    }
                }
            });
            return { hit: true };
        }
    },

    // ── FLUX ──────────────────────────────────────────────
    flux: {
        physical(actor, target) {
            if (!target) return { hit: false };
            // Disorient always lands even through shields
            if (Math.random() < ELEMENT_PROC_CHANCE.flux) target.disoriented = 120;
            applyElementalDamage(target, (actor.stats?.attack||10)*0.6, actor, "flux");
            spawnElementEffect({ type:"impact", x:target.x, y:target.y, color:"#9933ff", radius:0.8, life:25, element:"flux" });
            return { hit: true };
        },
        special(actor, target) {
            if (!target) return { hit: false };
            // Singularity — pull enemies in then release
            spawnElementEffect({ type:"singularity", x:target.x, y:target.y, color:"#9933ff", radius:2.5, life:60, element:"flux" });
            // Pull phase — move enemies toward point
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator && a.team!=="green" && !a.isClone)) && !a.dead) {
                    const dx=target.x-a.x, dy=target.y-a.y, dist=Math.sqrt(dx*dx+dy*dy);
                    if (dist < 3 && dist > 0.01) {
                        a.x += (dx/dist) * 0.8;
                        a.y += (dy/dist) * 0.8;
                        // Pull and disorient pierce shields
                        if (Math.random() < ELEMENT_PROC_CHANCE.flux) a.disoriented = 90;
                        applyElementalDamage(a, (actor.stats?.specialAttack||10)*0.5, actor, "flux");
                    }
                }
            });
            return { hit: true };
        }
    },

    // ── CORE ──────────────────────────────────────────────
    core: {
        physical(actor, target) {
            if (!target) return { hit: false };
            // Shield bash — knockback + self defense boost
            applyElementalDamage(target, (actor.stats?.attack||10)*0.45, actor, "core");
            spawnElementEffect({ type:"impact", x:target.x, y:target.y, color:"#00ccaa", radius:0.7, life:20, element:"core" });
            // Self defense boost
            actor.defenseBoost = 90;
            // Knockback proc
            if (Math.random() < ELEMENT_PROC_CHANCE.core) {
                const dx=target.x-actor.x, dy=target.y-actor.y;
                const dist=Math.sqrt(dx*dx+dy*dy)||1;
                target.x += (dx/dist) * 1.5;
                target.y += (dy/dist) * 1.5;
            }
            return { hit: true };
        },
        special(actor, target) {
            // Radiant pulse — shields allies + brief invulnerability to self
            spawnElementEffect({ type:"ring", x:actor.x, y:actor.y, color:"#00ccaa", radius:3.0, life:50, element:"core" });
            actor.invulnerable = 60;
            // Shield nearby allies
            followers.forEach(a => {
                if (a === actor || a.dead) return;
                const dx=a.x-actor.x, dy=a.y-actor.y;
                if (Math.sqrt(dx*dx+dy*dy) <= 3.0) {
                    a.shielded = true;
                    a.shieldAmount = (actor.stats?.specialAttack||10) * 1.5;
                }
            });
            // Also damage nearby enemies
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator && a.team!=="green" && !a.isClone)) && !a.dead) {
                    const dx=a.x-actor.x, dy=a.y-actor.y;
                    if (Math.sqrt(dx*dx+dy*dy) <= 3.0) {
                        applyElementalDamage(a, (actor.stats?.specialAttack||10)*0.4, actor, "core");
                    }
                }
            });
            return { hit: true };
        }
    },

    // ── TOXIC ─────────────────────────────────────────────
    toxic: {
        physical(actor, target) {
            if (!target) return { hit: false };
            // Smoke form — self evasion buff + attack
            actor.smokeForm = 45;  // frames in smoke
            actor.smokeEvasion = 0.75; // 75% chance to dodge incoming hits
            applyElementalDamage(target, (actor.stats?.attack||10)*0.4, actor, "toxic");
            spawnElementEffect({ type:"smoke", x:actor.x, y:actor.y, color:"#66ff66", radius:0.8, life:45, element:"toxic" });
            // Defense shred proc
            if (Math.random() < ELEMENT_PROC_CHANCE.toxic) {
                target.defenseShredded = 120;
                target.defenseShredFactor = 0.5;
            }
            return { hit: true };
        },
        special(actor, target) {
            if (!target) return { hit: false };
            // Toxic cloud — lingering ground damage
            spawnElementEffect({
                type: "toxicCloud",
                x: target.x, y: target.y,
                color: "#66ff66",
                radius: 1.8,
                life: 300,  // long lasting
                element: "toxic",
                tickDamage: (actor.stats?.specialAttack||10) * 0.08
            });
            return { hit: true };
        }
    }
};

// ─────────────────────────────────────────────────────────
//  ELEMENT EFFECTS POOL (visual + lingering)
// ─────────────────────────────────────────────────────────
let elementEffects = [];

// ─────────────────────────────────────────────────────────
//  ENVIRONMENTAL HAZARDS
// ─────────────────────────────────────────────────────────
let DEBUG_PREDATOR = false;
let environmentalHazards = []; // { type, x, y, state, timer, alpha, dir, ventDir }
const HAZARD_TYPES = ["acid", "cable"]; // "vent" moved to wall tiles (wall_back fire blasts)
const HAZARD_FADE_FRAMES = 45; // 0.75s fade-in before activating

function spawnHazardsForDay() {
    environmentalHazards = [];
    // Each zone has a ~50% chance of one hazard; zone 0 always gets one so player sees them
    const zoneCount = Math.min(activeDayZones, 5);
    for (let z = 0; z < zoneCount; z++) {
        const count = z === 0 ? 1 : (Math.random() < 0.5 ? 1 : 0);
        for (let i = 0; i < count; i++) {
            const type = HAZARD_TYPES[Math.floor(Math.random() * HAZARD_TYPES.length)];
            const hx = z * ZONE_LENGTH + 2 + Math.floor(Math.random() * (ZONE_LENGTH - 4));
            const hy = 1 + Math.floor(Math.random() * 3);
            const hazard = {
                type, x:hx, y:hy,
                alpha: 0,
                active: false,
                timer: 0
            };
            if (type === "acid") {
                hazard.tiles = [[hx,hy],[hx+1,hy],[hx,hy+1]].slice(0, 2+Math.floor(Math.random()*2));
            }
            if (type === "cable") {
                // Two cables emerge from wall crevasses (wy=0) at different heights,
                // droop to the floor and meet at an arc gap a few tiles in
                const cx1 = hx;
                const cx2 = hx + 2 + Math.floor(Math.random() * 2); // 2-3 tiles along wall
                hazard.cx1  = cx1;
                hazard.cx2  = cx2;
                hazard.wy   = 0;
                hazard.hA   = 0.55 + Math.random() * 0.20; // 55–75% up wall (mid-to-3/4)
                hazard.hB   = 0.15 + Math.random() * 0.12; // 15–27% up wall (nearly on floor)
                hazard.gapWX = (cx1 + cx2) / 2;
                hazard.gapWY = 1.1 + Math.random() * 0.4;  // arc gap on floor, near wall
                hazard.arcState = "off";
                hazard.arcTimer = 0;
                hazard.ON_DUR  = 40;
                hazard.OFF_DUR = 90 + Math.floor(Math.random()*90);
            }
            environmentalHazards.push(hazard);
        }
    }
    // Start fully visible — no fade delay on spawn
    environmentalHazards.forEach(h => { h.alpha = 1; h.active = true; });
}

function updateHazards() {
    environmentalHazards.forEach(h => {
        // Fade in
        if (h.alpha < 1) {
            h.alpha = Math.min(1, h.alpha + 1/HAZARD_FADE_FRAMES);
            if (h.alpha >= 1) h.active = true;
            return; // not active yet
        }

        if (h.type === "acid") {
            // Spawn bubbles — staggered by hazard position so pools don't sync
            if (!h.bubbles) h.bubbles = [];
            if (frame % 18 === Math.abs(Math.floor(h.x * 3 + h.y * 7)) % 18) {
                const tile = h.tiles[Math.floor(Math.random() * h.tiles.length)];
                const maxLife = 55 + Math.floor(Math.random() * 35);
                h.bubbles.push({
                    tx: tile[0], ty: tile[1],
                    ox: (Math.random() - 0.5) * 1.0,
                    oy: (Math.random() - 0.5) * 0.7,
                    life: maxLife, maxLife
                });
            }
            h.bubbles.forEach(b => b.life--);
            h.bubbles = h.bubbles.filter(b => b.life > 0);

            // Continuous damage every 45 frames to anyone on acid tiles
            if (frame % 45 === 0) {
                h.tiles.forEach(([tx,ty]) => {
                    actors.forEach(a => {
                        if (!a.dead && Math.abs(a.x-tx)<0.8 && Math.abs(a.y-ty)<0.8) {
                            applyDamage(a, 3, null, "toxic");
                            floatingTexts.push({x:a.x,y:a.y,text:"ACID",color:"#44ff44",life:30,vy:-0.04});
                        }
                    });
                    // Damage player
                    if (Math.abs(player.x-tx)<0.8 && Math.abs(player.y-ty)<0.8 && frame%45===0) {
                        health = Math.max(0, health-4);
                    }
                });
            }
        }

        if (h.type === "cable") {
            h.arcTimer++;
            if (h.arcState === "off" && h.arcTimer >= h.OFF_DUR) {
                h.arcState = "on"; h.arcTimer = 0;
            } else if (h.arcState === "on" && h.arcTimer >= h.ON_DUR) {
                h.arcState = "off"; h.arcTimer = 0;
                h.OFF_DUR = 90 + Math.floor(Math.random()*90); // randomize next gap
            }
            // Damage while arc is on — check proximity to the floor gap
            if (h.arcState === "on" && frame % 15 === 0) {
                const gx = h.gapWX, gy = h.gapWY;
                actors.forEach(a => {
                    if (a.dead) return;
                    if (Math.hypot(a.x - gx, a.y - gy) < 1.1) {
                        applyDamage(a, 5, null, "electric");
                        a.hitStun = Math.max(a.hitStun||0, 20);
                        floatingTexts.push({x:a.x,y:a.y,text:"ZAP",color:"#88aaff",life:25,vy:-0.04});
                    }
                });
                if (Math.hypot(player.x - gx, player.y - gy) < 1.1) {
                    health = Math.max(0, health - 6); shake = Math.max(shake, 4);
                }
            }
        }
    });
}

function drawHazards() {
    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);

    const toScreen = (wx, wy) => ({
        px: (wx - player.visualX - (wy - player.visualY)) * TILE_W + canvas.width/2,
        py: (wx - player.visualX + (wy - player.visualY)) * TILE_H + canvas.height/2
    });

    // Acid pools drawn inside depth-sorted tile loop in game.js (behind pylons).
    // Wall vents drawn + updated in game.js wall_back section (state lives on tile objects).
    environmentalHazards.forEach(h => {
        if (h.type === "cable") {
            const WH   = 110; // wall face height in px (matches game.js wall_back)
            const GAP  = 12;  // half-gap at arc point, px
            const live = h.arcState === "on";

            // ── Screen positions ──────────────────────────────────────────────────
            // Wall tile bases for each crevasse (world wy=0)
            const sW1 = toScreen(h.cx1, h.wy);
            const sW2 = toScreen(h.cx2, h.wy);

            // Crevasse attachment points on the wall face south side.
            // Wall face right edge bottom = (sW.px, sW.py + 2*TILE_H).
            // At height fraction h.hA from the bottom: y = sW.py + 2*TILE_H - hA*WH.
            // Use mid-wall x (px - TILE_W/2) so cable appears to emerge from the crack.
            const attachA = {
                px: sW1.px - TILE_W * 0.5,
                py: sW1.py + 2 * TILE_H - h.hA * WH
            };
            const attachB = {
                px: sW2.px - TILE_W * 0.5,
                py: sW2.py + 2 * TILE_H - h.hB * WH
            };

            // Floor landing points — where each cable touches down
            const sFlA = toScreen(h.cx1, 1.1);
            const floorA = { px: sFlA.px, py: sFlA.py + TILE_H * 0.55 };

            const sFlB = toScreen(h.cx2, 0.75);
            const floorB = { px: sFlB.px, py: sFlB.py + TILE_H * 0.55 };

            // Arc gap on the floor between the two cable ends
            const sGap   = toScreen(h.gapWX, h.gapWY);
            const gapFlr = { px: sGap.px, py: sGap.py + TILE_H * 0.55 };

            // Gap direction: from cable-A floor end toward cable-B floor end
            const gdx = floorB.px - floorA.px, gdy = floorB.py - floorA.py;
            const glen = Math.hypot(gdx, gdy) || 1;
            const gnx = gdx / glen, gny = gdy / glen;
            const perpX = -gny, perpY = gnx;

            const cut1 = { px: gapFlr.px - gnx * GAP, py: gapFlr.py - gny * GAP };
            const cut2 = { px: gapFlr.px + gnx * GAP, py: gapFlr.py + gny * GAP };

            // ── Draw helper ───────────────────────────────────────────────────────
            // Draws the path fn twice: thick dark jacket + thin sheen
            const drawCable = (pathFn) => {
                ctx.lineCap = "round"; ctx.lineJoin = "round";
                ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 5;
                pathFn(); ctx.stroke();
                ctx.strokeStyle = "#555"; ctx.lineWidth = 1.5;
                pathFn(); ctx.stroke();
            };

            ctx.save();

            // ── Cable A: crevasse (mid-high) → catenary droop → floor → slack → cut1 ──
            {
                // Catenary: cubic bezier. CP1 pulled straight down (gravity), CP2 levels off
                const sagA  = Math.max(attachA.py, floorA.py) + 28;
                const cp1Ax = attachA.px, cp1Ay = sagA;
                const cp2Ax = floorA.px  + 12,  cp2Ay = floorA.py + 4;
                // Floor slack: quadratic bezier with slight downward belly
                const slkAx = (floorA.px + cut1.px) / 2;
                const slkAy = (floorA.py + cut1.py) / 2 + 9;
                drawCable(() => {
                    ctx.beginPath();
                    ctx.moveTo(attachA.px, attachA.py);
                    ctx.bezierCurveTo(cp1Ax, cp1Ay, cp2Ax, cp2Ay, floorA.px, floorA.py);
                    ctx.quadraticCurveTo(slkAx, slkAy, cut1.px, cut1.py);
                });
            }

            // ── Cable B: crevasse (low) → short droop → floor → slack → cut2 ──
            {
                const sagB  = Math.max(attachB.py, floorB.py) + 14;
                const cp1Bx = attachB.px, cp1By = sagB;
                const cp2Bx = floorB.px  + 6,  cp2By = floorB.py + 2;
                const slkBx = (floorB.px + cut2.px) / 2;
                const slkBy = (floorB.py + cut2.py) / 2 + 6;
                drawCable(() => {
                    ctx.beginPath();
                    ctx.moveTo(attachB.px, attachB.py);
                    ctx.bezierCurveTo(cp1Bx, cp1By, cp2Bx, cp2By, floorB.px, floorB.py);
                    ctx.quadraticCurveTo(slkBx, slkBy, cut2.px, cut2.py);
                });
            }

            // ── Frayed cut ends ───────────────────────────────────────────────────
            const drawCutEnd = (ex, ey, dirX, dirY) => {
                for (let i = 0; i < 4; i++) {
                    const spread = (i / 3 - 0.5) * 10;
                    const wobble = Math.sin(frame * 0.1 + i * 1.9) * (live ? 2 : 0.5);
                    ctx.strokeStyle = live ? "#ffdd88" : "#888";
                    ctx.lineWidth   = 1;
                    ctx.shadowColor = live ? "#ffaa00" : "none";
                    ctx.shadowBlur  = live ? 6 : 0;
                    ctx.beginPath();
                    ctx.moveTo(ex, ey);
                    ctx.lineTo(
                        ex + dirX * 7 + perpX * spread + wobble,
                        ey + dirY * 7 + perpY * spread + wobble
                    );
                    ctx.stroke();
                }
            };
            ctx.shadowBlur = 0;
            drawCutEnd(cut1.px, cut1.py,  gnx,  gny);
            drawCutEnd(cut2.px, cut2.py, -gnx, -gny);

            // ── Electric arc across the gap when live ─────────────────────────────
            if (live) {
                for (let arc = 0; arc < 3; arc++) {
                    ctx.save();
                    ctx.shadowColor = "#88bbff";
                    ctx.shadowBlur  = arc === 0 ? 18 : 8;
                    ctx.strokeStyle = arc === 0
                        ? `rgba(200,220,255,${0.85 + Math.random() * 0.15})`
                        : `rgba(160,200,255,${0.3  + Math.random() * 0.3})`;
                    ctx.lineWidth = arc === 0 ? 2.5 : 1;
                    ctx.lineCap   = "round";
                    ctx.beginPath();
                    ctx.moveTo(cut1.px, cut1.py);
                    for (let s = 1; s < 5; s++) {
                        const t = s / 5;
                        ctx.lineTo(
                            cut1.px + (cut2.px - cut1.px) * t + (Math.random() - 0.5) * 14,
                            cut1.py + (cut2.py - cut1.py) * t + (Math.random() - 0.5) * 10
                        );
                    }
                    ctx.lineTo(cut2.px, cut2.py);
                    ctx.stroke();
                    ctx.restore();
                }
                [cut1, cut2].forEach(pt => {
                    const grad = ctx.createRadialGradient(pt.px, pt.py, 0, pt.px, pt.py, 10);
                    grad.addColorStop(0, "rgba(180,210,255,0.8)");
                    grad.addColorStop(1, "rgba(80,130,255,0)");
                    ctx.fillStyle = grad;
                    ctx.beginPath(); ctx.arc(pt.px, pt.py, 10, 0, Math.PI * 2); ctx.fill();
                });
            }

            ctx.restore();
        }
    });

    ctx.restore();
}

function spawnElementEffect(effect) {
    elementEffects.push({ ...effect, currentRadius: 0 });
}

function updateElementEffects() {
    elementEffects = elementEffects.filter(e => {
        e.life--;

        // Toxic cloud deals tick damage
        if (e.type === "toxicCloud" && e.life % 20 === 0) {
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator && a.team!=="green" && !a.isClone)) && !a.dead) {
                    const dx=a.x-e.x, dy=a.y-e.y;
                    if (Math.sqrt(dx*dx+dy*dy) <= e.radius) {
                        applyDamage(a, e.tickDamage || 1, null);
                    }
                }
            });
        }

        return e.life > 0;
    });
}

function drawElementEffects() {
    elementEffects.forEach(e => {
        const px = (e.x - player.visualX - (e.y - player.visualY)) * TILE_W + canvas.width/2;
        const py = (e.x - player.visualX + (e.y - player.visualY)) * TILE_H + canvas.height/2;
        const alpha = Math.min(1, e.life / 20);

        ctx.save();
        ctx.globalAlpha = alpha;

        switch(e.type) {
            case "ring":
            case "singularity": {
                const progress = 1 - (e.life / (e.type==="singularity"?60:40));
                const r = Math.max(1, e.radius * progress * TILE_W);
                ctx.strokeStyle = e.color;
                ctx.lineWidth = e.type==="singularity" ? 4 : 2;
                ctx.shadowColor = e.color;
                ctx.shadowBlur = 12;
                ctx.beginPath();
                ctx.arc(px, py - 30, r, 0, Math.PI*2);
                ctx.stroke();
                // Inner glow
                ctx.fillStyle = e.color.replace(")", ",0.08)").replace("rgb","rgba").replace("#", "rgba(").replace("rgba(", "rgba(");
                ctx.globalAlpha = alpha * 0.15;
                ctx.beginPath();
                ctx.arc(px, py - 30, r, 0, Math.PI*2);
                ctx.fill();
                break;
            }
            case "impact": {
                const r = Math.max(1, e.radius * TILE_W * (1 - e.life/20));
                ctx.fillStyle = e.color;
                ctx.shadowColor = e.color;
                ctx.shadowBlur = 16;
                ctx.beginPath();
                ctx.arc(px, py - 30, r, 0, Math.PI*2);
                ctx.fill();
                break;
            }
            case "meteor": {
                const r = Math.max(1, e.radius * TILE_W * 0.6);
                ctx.fillStyle = e.color;
                ctx.shadowColor = e.color;
                ctx.shadowBlur = 24;
                ctx.beginPath();
                ctx.arc(px, py - 30, r, 0, Math.PI*2);
                ctx.fill();
                // Crater rings
                ctx.strokeStyle = e.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = alpha * 0.4;
                ctx.beginPath();
                ctx.arc(px, py - 30, r * 1.4, 0, Math.PI*2);
                ctx.stroke();
                break;
            }
            case "smoke":
            case "toxicCloud": {
                const r = e.radius * TILE_W;
                const grad = ctx.createRadialGradient(px, py-30, 0, px, py-30, r);
                grad.addColorStop(0, e.color + "88");
                grad.addColorStop(1, e.color + "00");
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(px, py-30, r, 0, Math.PI*2);
                ctx.fill();
                break;
            }
        }

        ctx.restore();
    });
}
