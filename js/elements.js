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
                    if (dx*dx+dy*dy <= 2.25) { // 1.5²=2.25, no sqrt needed
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
            // Fire bonus damage to nearby live nest pods (2× multiplier)
            world.forEach(t => {
                if (!t.nest || t.nestHealth <= 0) return;
                const _ntdx=t.x-actor.x, _ntdy=t.y-actor.y;
                if (_ntdx*_ntdx+_ntdy*_ntdy <= 6.25) { // 2.5²=6.25
                    const nestDmg = (actor.stats?.attack||10) * 0.8;
                    t.nestHealth = Math.max(0, t.nestHealth - nestDmg);
                    floatingTexts.push({x:t.x,y:t.y-0.5,text:"FIRE! -"+Math.round(nestDmg),color:"#ff3300",life:30,vy:-0.06});
                }
            });
            // Fire orbit visual — 3 fireballs orbit the follower
            actor.fireOrbitTimer = 50;
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
                    if (dx*dx+dy*dy <= 4.0) { // 2.0²=4.0, no sqrt needed
                        const dmg = (actor.stats?.specialAttack||10) * 0.9;
                        applyElementalDamage(a, dmg, actor, "fire");
                        if (Math.random() < ELEMENT_PROC_CHANCE.fire) {
                            a.burning = 180;
                            a.burnDamage = dmg * 0.1;
                        }
                    }
                }
            });
            // Meteor bonus damage to nest pods within blast radius (2× multiplier)
            world.forEach(t => {
                if (!t.nest || t.nestHealth <= 0) return;
                const _ntdx=t.x-target.x, _ntdy=t.y-target.y;
                if (_ntdx*_ntdx+_ntdy*_ntdy <= 9.0) { // 3.0²=9.0
                    const nestDmg = (actor.stats?.specialAttack||10) * 1.8;
                    t.nestHealth = Math.max(0, t.nestHealth - nestDmg);
                    floatingTexts.push({x:t.x,y:t.y-0.5,text:"METEOR! -"+Math.round(nestDmg),color:"#ff3300",life:45,vy:-0.08});
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
                // Find next nearest unchained enemy (squared distance — no sqrt)
                let next = null, bd2 = 9; // 3²=9
                actors.forEach(a => {
                    if ((a.team==="red"||(a instanceof Predator)) && !a.dead && !chainTargets.includes(a)) {
                        const dx=a.x-current.x, dy=a.y-current.y, d2=dx*dx+dy*dy;
                        if (d2 < bd2) { bd2=d2; next=a; }
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
            // Electric surround visual — sparks ring + arc lightning to chain targets
            actor.sparkSurround = 22;
            actor._electricChainTargets = chainTargets.slice();
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
                    if (dx*dx+dy*dy <= 9.0) { // 3.0²=9.0, no sqrt needed
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
            // Icicle visual — giant icicles project toward target
            actor.icicleAttack = { tx: target.x, ty: target.y, timer: 28 };
            return { hit: true };
        },
        special(actor, target) {
            // Ice burst — radius slow
            spawnElementEffect({ type:"ring", x:actor.x, y:actor.y, color:"#99ddff", radius:2.5, life:50, element:"ice" });
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator && a.team!=="green" && !a.isClone)) && !a.dead) {
                    const dx=a.x-actor.x, dy=a.y-actor.y;
                    if (dx*dx+dy*dy <= 6.25) { // 2.5²=6.25, no sqrt needed
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
            // Flux aura visual — opaque element-color aura around follower
            actor.fluxAura = 50;
            return { hit: true };
        },
        special(actor, target) {
            if (!target) return { hit: false };
            // Singularity — pull enemies in then release
            spawnElementEffect({ type:"singularity", x:target.x, y:target.y, color:"#9933ff", radius:2.5, life:60, element:"flux" });
            // Pull phase — move enemies toward point
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator && a.team!=="green" && !a.isClone)) && !a.dead) {
                    const dx=target.x-a.x, dy=target.y-a.y, d2=dx*dx+dy*dy;
                    if (d2 < 9 && d2 > 0.0001) { // 3²=9, avoid sqrt until we need direction
                        const dist=Math.sqrt(d2);
                        // Velocity-based pull so the motion animates over several frames
                        a.kbVX = (dx/dist) * 0.12;
                        a.kbVY = (dy/dist) * 0.12;
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
            // Core pulse visual — pulsating rings emanate from follower
            actor.corePulse = 55;
            // Knockback proc — velocity-based so the push animates over ~10 frames
            if (Math.random() < ELEMENT_PROC_CHANCE.core) {
                const dx=target.x-actor.x, dy=target.y-actor.y;
                const dist=Math.sqrt(dx*dx+dy*dy)||1;
                target.kbVX = (dx/dist) * 0.22;
                target.kbVY = (dy/dist) * 0.22;
                floatingTexts.push({ x:target.x, y:target.y-1, text:"BASH!", color:"#00ffcc", life:30, vy:-0.06 });
                spawnElementEffect({ type:"ring", x:target.x, y:target.y, color:"#00ccaa", radius:0.8, life:18, element:"core" });
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
                if (dx*dx+dy*dy <= 9.0) { // 3.0²=9.0, no sqrt needed
                    a.shielded = true;
                    a.shieldAmount = (actor.stats?.specialAttack||10) * 1.5;
                }
            });
            // Also damage nearby enemies
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator && a.team!=="green" && !a.isClone)) && !a.dead) {
                    const dx=a.x-actor.x, dy=a.y-actor.y;
                    if (dx*dx+dy*dy <= 9.0) { // 3.0²=9.0, no sqrt needed
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
//  FOLLOWER ULTIMATE ABILITIES
//  Triggered by double-tap when ultimateCharge === 100
// ─────────────────────────────────────────────────────────
// activeFireEruption: { caster, target, tx, ty, frames, maxFrames, crackDirs[] }
let activeFireEruption = null;

const FOLLOWER_ULTIMATES = {

    // ── FIRE: Volcanic Eruption ───────────────────────────
    // 3-phase 3D eruption — ground cracks and glows (charge),
    // an isometric fire column erupts and rises (eruption),
    // a crown burst explodes at the apex (crown), then
    // the ground detonates with a massive shockwave + crater.
    fire: {
        name: "Volcanic Eruption",
        execute(actor) {
            if (actor.dead || activeFireEruption) return;
            const actorZone = getZoneIndex(Math.floor(actor.x));
            let target = null, bestHP = -1;
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator&&a.team!=="green"&&!a.isClone))&&!a.dead) {
                    if (getZoneIndex(Math.floor(a.x))===actorZone && a.health>bestHP) { bestHP=a.health; target=a; }
                }
            });
            if (!target) return;
            actor.ultimateCharge = 0;
            shake = Math.max(shake, 3);
            // Pre-compute deterministic crack directions from target position
            const seed = (Math.floor(target.x)*7 + Math.floor(target.y)*13) | 0;
            const crackDirs = [];
            for (let _i = 0; _i < 7; _i++) {
                const base  = (_i / 7) * Math.PI * 2;
                const jit   = (((seed * (_i+1) * 0x9e37) & 0xffff) / 0xffff) * 0.45 - 0.22;
                crackDirs.push({ a: base + jit });
            }
            activeFireEruption = {
                caster: actor, target,
                tx: target.x, ty: target.y,
                frames: 0, maxFrames: 138,
                crackDirs
            };
            const _px=(actor.x-player.visualX-(actor.y-player.visualY))*TILE_W+canvas.width/2;
            const _py=(actor.x-player.visualX+(actor.y-player.visualY))*TILE_H+canvas.height/2;
            floatingTexts.push({x:_px,y:_py-80,text:"VOLCANIC ERUPTION",color:"#ff4400",life:138,vy:-0.45});
        }
    },

    // ── ELECTRIC: EMP ─────────────────────────────────────
    // Instantly destroys all enemy shields in the zone and
    // surges nearby followers with resonance and speed.
    electric: {
        name: "EMP",
        execute(actor) {
            if (actor.dead) return;
            actor.ultimateCharge = 0;
            shake = Math.max(shake, 8);
            const actorZone = getZoneIndex(Math.floor(actor.x));
            const _px=(actor.x-player.visualX-(actor.y-player.visualY))*TILE_W+canvas.width/2;
            const _py=(actor.x-player.visualX+(actor.y-player.visualY))*TILE_H+canvas.height/2;
            floatingTexts.push({x:_px,y:_py-80,text:"⚡ EMP",color:"#ffffaa",life:90,vy:-0.9});
            // Strip all enemy shields in zone
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator&&a.team!=="green"&&!a.isClone))&&!a.dead) {
                    if (getZoneIndex(Math.floor(a.x))===actorZone && a.shielded) {
                        a.shielded=false; a.shieldAmount=0; a._shieldMax=0;
                        spawnElementEffect({type:"impact",x:a.x,y:a.y,color:"#ffee33",radius:1.2,life:25,element:"electric"});
                    }
                }
            });
            // Buff followers in zone: +30 resonance + 1.5× speed for 5 seconds
            followers.forEach(f => {
                if (f.dead || getZoneIndex(Math.floor(f.x))!==actorZone) return;
                f.currentResonance = Math.min(100, (f.currentResonance||0)+30);
                if (!f._empBoostTimer || f._empBoostTimer<=0) {
                    f._empBaseSpeed = f.moveSpeed;
                    f.moveSpeed = f._empBaseSpeed * 1.5;
                }
                f._empBoostTimer = 300;
                spawnElementEffect({type:"impact",x:f.x,y:f.y,color:"#ffee33",radius:0.8,life:20,element:"electric"});
            });
            spawnElementEffect({type:"ring",x:actor.x,y:actor.y,color:"#ffee33",radius:8.0,life:55,element:"electric"});
        }
    },

    // ── ICE: Blizzard ─────────────────────────────────────
    // Zone-wide blizzard field — enemies have a high chance to
    // freeze every 30 frames for the field's duration.
    ice: {
        name: "Blizzard",
        execute(actor) {
            if (actor.dead) return;
            actor.ultimateCharge = 0;
            shake = Math.max(shake, 6);
            const actorZone = getZoneIndex(Math.floor(actor.x));
            const _px=(actor.x-player.visualX-(actor.y-player.visualY))*TILE_W+canvas.width/2;
            const _py=(actor.x-player.visualX+(actor.y-player.visualY))*TILE_H+canvas.height/2;
            floatingTexts.push({x:_px,y:_py-80,text:"❄ BLIZZARD",color:"#aaddff",life:90,vy:-0.9});
            spawnElementEffect({type:"blizzardField",x:actor.x,y:actor.y,zone:actorZone,color:"#99ddff",life:360,maxLife:360,element:"ice"});
            spawnElementEffect({type:"ring",x:actor.x,y:actor.y,color:"#99ddff",radius:8.0,life:60,element:"ice"});
        }
    },

    // ── FLUX: Disorient ───────────────────────────────────
    // All predators in the zone turn on each other — they attack
    // allied predators for 4 seconds with half attack power.
    flux: {
        name: "Disorient",
        execute(actor) {
            if (actor.dead) return;
            actor.ultimateCharge = 0;
            shake = Math.max(shake, 10);
            const actorZone = getZoneIndex(Math.floor(actor.x));
            const _px=(actor.x-player.visualX-(actor.y-player.visualY))*TILE_W+canvas.width/2;
            const _py=(actor.x-player.visualX+(actor.y-player.visualY))*TILE_H+canvas.height/2;
            floatingTexts.push({x:_px,y:_py-80,text:"⟳ DISORIENT",color:"#cc66ff",life:90,vy:-0.9});
            actors.forEach(a => {
                if (!(a instanceof Predator)||a.team==="green"||a.isClone||a.dead) return;
                if (getZoneIndex(Math.floor(a.x))===actorZone) {
                    a.disorientFF = 240;          // friendly-fire mode for 4 s
                    a.disorientPowerFactor = 0.5; // attacks at half power
                    a.disoriented = 240;
                    spawnElementEffect({type:"impact",x:a.x,y:a.y,color:"#cc66ff",radius:0.8,life:25,element:"flux"});
                }
            });
            spawnElementEffect({type:"singularity",x:actor.x,y:actor.y,color:"#9933ff",radius:5.0,life:60,element:"flux"});
        }
    },

    // ── CORE: Shield Grant ────────────────────────────────
    // All followers receive a 10 HP shield that blocks 100% damage.
    // A nearby core wave-pylon can slowly recharge it as long as it
    // hasn't been fully broken.
    core: {
        name: "Shield Grant",
        execute(actor) {
            if (actor.dead) return;
            actor.ultimateCharge = 0;
            shake = Math.max(shake, 8);
            const _px=(actor.x-player.visualX-(actor.y-player.visualY))*TILE_W+canvas.width/2;
            const _py=(actor.x-player.visualX+(actor.y-player.visualY))*TILE_H+canvas.height/2;
            floatingTexts.push({x:_px,y:_py-80,text:"⬡ SHIELD GRANT",color:"#00ffcc",life:90,vy:-0.9});
            spawnElementEffect({type:"ring",x:actor.x,y:actor.y,color:"#00ccaa",radius:6.0,life:60,element:"core"});
            followers.forEach(f => {
                if (f.dead) return;
                f.shielded     = true;
                f.shieldAmount = 10;
                f._shieldMax   = 10;
                spawnElementEffect({type:"impact",x:f.x,y:f.y,color:"#00ffcc",radius:1.0,life:30,element:"core"});
            });
        }
    },

    // ── TOXIC: Smoke Screen ───────────────────────────────
    // A thick smoke cloud fills the entire zone — all enemies
    // within it have their attack accuracy halved for 8 seconds.
    toxic: {
        name: "Smoke Screen",
        execute(actor) {
            if (actor.dead) return;
            actor.ultimateCharge = 0;
            shake = Math.max(shake, 5);
            const actorZone = getZoneIndex(Math.floor(actor.x));
            const _px=(actor.x-player.visualX-(actor.y-player.visualY))*TILE_W+canvas.width/2;
            const _py=(actor.x-player.visualX+(actor.y-player.visualY))*TILE_H+canvas.height/2;
            floatingTexts.push({x:_px,y:_py-80,text:"◎ SMOKE SCREEN",color:"#aabb99",life:90,vy:-0.9});
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator&&a.team!=="green"&&!a.isClone))&&!a.dead) {
                    if (getZoneIndex(Math.floor(a.x))===actorZone) a.smokeDebuff = 480;
                }
            });
            spawnElementEffect({type:"smokeScreen",x:actor.x,y:actor.y,zone:actorZone,color:"#aabb88",life:480,maxLife:480,element:"toxic"});
        }
    }

}; // end FOLLOWER_ULTIMATES

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
    for (let z = 1; z < zoneCount; z++) {
        const count = Math.random() < 0.5 ? 1 : 0;
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
                // Two cables emerge from wall crevasses — wall_back tiles are at wy=-2
                const cx1 = hx;
                const cx2 = hx + 2 + Math.floor(Math.random() * 2); // 2-3 tiles along wall
                hazard.cx1  = cx1;
                hazard.cx2  = cx2;
                hazard.wy   = -2;                            // wall_back row
                hazard.hA   = 0.55 + Math.random() * 0.20;  // 55–75% up wall (mid-to-3/4)
                hazard.hB   = 0.15 + Math.random() * 0.12;  // 15–27% up wall (nearly on floor)
                hazard.gapWX = (cx1 + cx2) / 2;
                hazard.gapWY = -1.1 + Math.random() * 0.4;  // arc gap on floor just in front of wall
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
                    const _zdx=a.x-gx, _zdy=a.y-gy;
                    if (_zdx*_zdx+_zdy*_zdy < 1.21) { // 1.1²=1.21
                        applyDamage(a, 5, null, "electric");
                        a.hitStun = Math.max(a.hitStun||0, 20);
                        floatingTexts.push({x:a.x,y:a.y,text:"ZAP",color:"#88aaff",life:25,vy:-0.04});
                    }
                });
                const _pzdx=player.x-gx, _pzdy=player.y-gy;
                if (_pzdx*_pzdx+_pzdy*_pzdy < 1.21) { // 1.1²=1.21
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
            const GAP  = 28;  // half-gap at arc point, px
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

            // Floor landing points — where each cable touches down.
            // Floor tiles start at wy=-1 (immediately in front of wall_back at wy=-2).
            const sFlA = toScreen(h.cx1, -1.0);
            const floorA = { px: sFlA.px, py: sFlA.py + TILE_H * 0.55 };

            const sFlB = toScreen(h.cx2, -1.4);
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

    // ── VOLCANIC ERUPTION TICK ──────────────────────────────
    if (activeFireEruption) {
        const afe = activeFireEruption;
        afe.frames++;
        // During charge phase track live target so position locks at eruption start
        if (afe.frames < 50) {
            if (!afe.target || afe.target.dead) {
                const actorZone = getZoneIndex(Math.floor(afe.caster.x));
                let best=null, bestHP=-1;
                actors.forEach(a=>{
                    if((a.team==="red"||(a instanceof Predator&&a.team!=="green"&&!a.isClone))&&!a.dead)
                        if(getZoneIndex(Math.floor(a.x))===actorZone&&a.health>bestHP){bestHP=a.health;best=a;}
                });
                afe.target = best;
            }
            if (afe.target && !afe.target.dead) { afe.tx=afe.target.x; afe.ty=afe.target.y; }
        }
        // Progressive rumble as column rises
        if (afe.frames >= 44 && afe.frames < 56) shake = Math.max(shake, 4 + (afe.frames-44));
        if (afe.frames >= 56 && afe.frames < 110) shake = Math.max(shake, 2);
        // Detonate on final frame
        if (afe.frames >= afe.maxFrames) {
            const {caster, target, tx, ty} = afe;
            activeFireEruption = null;
            const dmg = (caster.stats?.specialAttack||10) * 3.5;
            shake = Math.max(shake, 24);
            actors.forEach(a=>{
                if((a.team==="red"||(a instanceof Predator&&a.team!=="green"&&!a.isClone))&&!a.dead){
                    const d=Math.hypot(a.x-tx, a.y-ty);
                    if(d<=5.5){
                        applyElementalDamage(a, dmg*(1-d*0.1), caster, "fire");
                        a.burning=400; a.burnDamage=dmg*0.04;
                    }
                }
            });
            // 3D ground shockwave rings
            spawnElementEffect({type:"fireShockwave", x:tx,y:ty, life:38, maxLife:38, radius:6.5, element:"fire"});
            spawnElementEffect({type:"fireShockwave", x:tx,y:ty, life:55, maxLife:55, radius:10.0, element:"fire"});
            spawnElementEffect({type:"flameCrater",   x:tx,y:ty, radius:3.0, color:"#ff4400", life:660, maxLife:660, element:"fire", tickDamage:dmg*0.06});
            const _tpx=(tx-player.visualX-(ty-player.visualY))*TILE_W+canvas.width/2;
            const _tpy=(tx-player.visualX+(ty-player.visualY))*TILE_H+canvas.height/2;
            floatingTexts.push({x:_tpx,y:_tpy-60,text:"ERUPTION!",color:"#ff2200",life:65,vy:-0.9});
        }
    }

    elementEffects = elementEffects.filter(e => {
        e.life--;

        // Toxic cloud deals tick damage
        if (e.type === "toxicCloud" && e.life % 20 === 0) {
            const _er2 = e.radius * e.radius;
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator && a.team!=="green" && !a.isClone)) && !a.dead) {
                    const dx=a.x-e.x, dy=a.y-e.y;
                    if (dx*dx+dy*dy <= _er2) {
                        applyDamage(a, e.tickDamage || 1, null);
                    }
                }
            });
        }

        // Flame crater — fire DoT to enemies standing inside
        if (e.type === "flameCrater" && e.life % 30 === 0) {
            const _er2 = e.radius * e.radius;
            actors.forEach(a=>{
                if((a.team==="red"||(a instanceof Predator&&a.team!=="green"&&!a.isClone))&&!a.dead){
                    const dx=a.x-e.x,dy=a.y-e.y;
                    if(dx*dx+dy*dy<=_er2) applyDamage(a,e.tickDamage||3,null,"fire");
                }
            });
        }

        // Blizzard field — 60 % freeze chance every 30 frames for all enemies in zone
        if (e.type === "blizzardField" && e.life % 30 === 0) {
            actors.forEach(a=>{
                if((a.team==="red"||(a instanceof Predator&&a.team!=="green"&&!a.isClone))&&!a.dead&&!a.frozen){
                    if(getZoneIndex(Math.floor(a.x))===e.zone && Math.random()<0.60){
                        a.frozen=true; a.frozenEscapeChance=0.006; // ~2.8 s average
                        spawnElementEffect({type:"impact",x:a.x,y:a.y,color:"#99ddff",radius:0.5,life:15,element:"ice"});
                    }
                }
            });
        }

        return e.life > 0;
    });
}

function drawElementEffects() {

    // ── VOLCANIC ERUPTION — 3D DRAW ─────────────────────────
    if (activeFireEruption) {
        const afe = activeFireEruption;
        const { frames, maxFrames, tx, ty } = afe;
        // World → screen for target
        const tpx = (tx - player.visualX - (ty - player.visualY)) * TILE_W + canvas.width  / 2;
        const tpy = (tx - player.visualX + (ty - player.visualY)) * TILE_H + canvas.height / 2;

        // ── PHASE CONSTANTS ──────────────────────────────────
        const chargeEnd  = 50;   // 0–50  : ground charge
        const eruptStart = 50;   // 50–108: column rises
        const eruptEnd   = 108;
        const crownStart = 108;  // 108–130: crown / max height
        const collapseStart = 120; // column starts collapsing

        // ── FULL-SCREEN VIGNETTE ─────────────────────────────
        {
            const vigA = frames < chargeEnd
                ? (frames / chargeEnd) * 0.42
                : 0.42 - ((frames - chargeEnd) / (maxFrames - chargeEnd)) * 0.42;
            ctx.save(); ctx.setTransform(1,0,0,1,0,0);
            ctx.fillStyle = `rgba(55,4,0,${vigA})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
        }

        ctx.save();
        ctx.shadowBlur = 0;

        // ── GROUND GLOW (iso ellipse, ground plane) ──────────
        {
            const glowProg = frames < chargeEnd ? frames / chargeEnd : 1;
            const gR = (0.6 + glowProg * 2.8) * TILE_W;
            const gA = glowProg * 0.8;
            const gGrad = ctx.createRadialGradient(tpx, tpy, 0, tpx, tpy, gR);
            gGrad.addColorStop(0,   `rgba(255,170,20,${gA})`);
            gGrad.addColorStop(0.45,`rgba(220,50,0,${gA*0.5})`);
            gGrad.addColorStop(1,   `rgba(100,8,0,0)`);
            ctx.fillStyle = gGrad;
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.ellipse(tpx, tpy, gR, gR * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // ── GROUND CRACKS (iso floor lines) ─────────────────
        if (frames < eruptEnd && afe.crackDirs) {
            const crackProg = Math.min(1, frames / 44);
            const fadeOut   = frames > 80 ? Math.max(0, 1 - (frames - 80) / 28) : 1;
            const maxCrackR = 4.2 * TILE_W;
            ctx.lineWidth = 1.8; ctx.shadowBlur = 5;
            afe.crackDirs.forEach(c => {
                // World-space direction → iso screen offset
                const cDX = (Math.cos(c.a) - Math.sin(c.a)) * TILE_W;
                const cDY = (Math.cos(c.a) + Math.sin(c.a)) * TILE_H;
                const len  = crackProg * maxCrackR;
                ctx.globalAlpha  = crackProg * fadeOut * 0.75;
                ctx.strokeStyle  = "#ff5500";
                ctx.shadowColor  = "#ff2200";
                ctx.beginPath();
                ctx.moveTo(tpx, tpy);
                ctx.lineTo(tpx + cDX * len / maxCrackR, tpy + cDY * len / maxCrackR);
                ctx.stroke();
                // Side branch at 60 % of crack length
                if (crackProg > 0.45) {
                    const bProg = (crackProg - 0.45) / 0.55;
                    ctx.globalAlpha = bProg * fadeOut * 0.42;
                    const bScale = 0.42;
                    const bOX = (cDX * 0.7 + cDY * 0.35) * bScale;
                    const bOY = (cDY * 0.7 - cDX * 0.35) * bScale;
                    ctx.beginPath();
                    ctx.moveTo(tpx + cDX * 0.60, tpy + cDY * 0.60);
                    ctx.lineTo(tpx + cDX * 0.60 + bOX * len / maxCrackR,
                               tpy + cDY * 0.60 + bOY * len / maxCrackR);
                    ctx.stroke();
                }
            });
            ctx.shadowBlur = 0;
        }

        // ── FIRE COLUMN (isometric 3D slices) ────────────────
        if (frames >= eruptStart - 5) {
            const maxColH = 210; // screen pixels tall
            const baseRW  = 1.6 * TILE_W * 0.5; // base ellipse semi-width
            const growT   = Math.min(1, (frames - (eruptStart-5)) / 62);
            const shrinkT = frames > collapseStart
                ? Math.max(0, 1 - (frames - collapseStart) / 18)
                : 1;
            const colH    = maxColH * growT * shrinkT;

            if (colH > 3) {
                const NUM_SLICES = 22;
                // Draw top-to-bottom so lower slices paint over upper (painter's algo → 3D look)
                for (let s = 0; s <= NUM_SLICES; s++) {
                    const t      = s / NUM_SLICES;      // 0 = top, 1 = base
                    const sliceY = tpy - (1 - t) * colH;
                    const taper  = 0.10 + t * 0.90;
                    const rw     = baseRW * taper;
                    const rh     = rw * 0.45;            // iso floor compression
                    // Heat map: yellow-white at top → orange → deep red at base
                    const hue   = Math.round(12 + (1 - t) * 44);  // 12 deep-orange → 56 yellow
                    const light = Math.round(42 + (1 - t) * 44);  // 42% base → 86% top
                    const flk   = Math.sin(frame * 0.28 + t * 4.2 + s * 0.7) * 3;
                    ctx.globalAlpha = 0.60 + (1 - t) * 0.36;
                    ctx.fillStyle   = `hsl(${hue + flk},100%,${light}%)`;
                    ctx.shadowColor = `hsl(${hue + flk},100%,${light + 10}%)`;
                    ctx.shadowBlur  = 6 + (1 - t) * 14;
                    ctx.beginPath();
                    ctx.ellipse(tpx, sliceY, rw, rh, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.shadowBlur = 0;

                // Bright vertical core — tapered trapezoid
                const coreGrad = ctx.createLinearGradient(tpx, tpy, tpx, tpy - colH);
                coreGrad.addColorStop(0,    "rgba(160,20,0,0.85)");
                coreGrad.addColorStop(0.30, "rgba(255,90,0,0.70)");
                coreGrad.addColorStop(0.65, "rgba(255,190,60,0.75)");
                coreGrad.addColorStop(1,    "rgba(255,255,200,0.92)");
                const cW = baseRW * 0.22;
                ctx.globalAlpha = 0.65;
                ctx.fillStyle   = coreGrad;
                ctx.beginPath();
                ctx.moveTo(tpx - cW,        tpy);
                ctx.lineTo(tpx + cW,        tpy);
                ctx.lineTo(tpx + cW * 0.06, tpy - colH);
                ctx.lineTo(tpx - cW * 0.06, tpy - colH);
                ctx.closePath();
                ctx.fill();

                // Animated heat rings spiraling up the column
                const NUM_RINGS = 5;
                for (let r = 0; r < NUM_RINGS; r++) {
                    const rPhase = ((frame * 0.11 + r * (1 / NUM_RINGS)) % 1.0);
                    const rH     = rPhase * colH;
                    const rY     = tpy - rH;
                    const rTaper = 0.10 + (1 - rPhase) * 0.90;
                    const rW2    = baseRW * rTaper * 1.06;
                    const rH2    = rW2 * 0.48;
                    const rAlpha = Math.sin(rPhase * Math.PI) * 0.7; // fade at top/bottom
                    if (rAlpha > 0.05) {
                        ctx.globalAlpha = rAlpha;
                        ctx.strokeStyle = `hsl(${50 - rPhase * 20},100%,80%)`;
                        ctx.lineWidth   = 2.5 - rPhase * 1.5;
                        ctx.shadowColor = "#ffcc44"; ctx.shadowBlur = 10;
                        ctx.beginPath();
                        ctx.ellipse(tpx, rY, rW2, rH2, 0, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.shadowBlur = 0;
                    }
                }

                // Crown burst at column apex (visible when column is >70% grown)
                if (growT > 0.68) {
                    const crownFade = Math.min(1, (growT - 0.68) / 0.32) * shrinkT;
                    const crownPulse = 0.78 + 0.22 * Math.sin(frame * 0.22);
                    const crownRW    = baseRW * (2.0 + growT * 0.6) * crownPulse;
                    const crownGrad  = ctx.createRadialGradient(
                        tpx, tpy - colH, 0,
                        tpx, tpy - colH, crownRW);
                    crownGrad.addColorStop(0,    "rgba(255,255,220,0.95)");
                    crownGrad.addColorStop(0.35, "rgba(255,160,10,0.70)");
                    crownGrad.addColorStop(1,    "rgba(255,40,0,0)");
                    ctx.globalAlpha = crownFade;
                    ctx.fillStyle   = crownGrad;
                    ctx.shadowColor = "#ffdd00"; ctx.shadowBlur = 35;
                    ctx.beginPath();
                    ctx.ellipse(tpx, tpy - colH, crownRW, crownRW * 0.38, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                    // Crown spike rays
                    const NUM_RAYS = 8;
                    ctx.lineWidth = 2;
                    for (let ri = 0; ri < NUM_RAYS; ri++) {
                        const rayA  = (ri / NUM_RAYS) * Math.PI * 2 + frame * 0.06;
                        const rayR0 = crownRW * 0.55;
                        const rayR1 = crownRW * (1.0 + Math.sin(frame * 0.18 + ri) * 0.25);
                        ctx.globalAlpha = crownFade * (0.4 + Math.sin(frame * 0.2 + ri * 1.3) * 0.3);
                        ctx.strokeStyle = `hsl(${40 + ri * 5},100%,75%)`;
                        ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 8;
                        ctx.beginPath();
                        ctx.moveTo(tpx + Math.cos(rayA) * rayR0,
                                   tpy - colH + Math.sin(rayA) * rayR0 * 0.38);
                        ctx.lineTo(tpx + Math.cos(rayA) * rayR1,
                                   tpy - colH + Math.sin(rayA) * rayR1 * 0.38);
                        ctx.stroke();
                    }
                    ctx.shadowBlur = 0;
                }
            }

            // Procedural ember particles (screen-space, computed from frame seed)
            if (colH > 20) {
                const EMBERS = 14;
                for (let ei = 0; ei < EMBERS; ei++) {
                    const seed2 = ei * 0x9e37;
                    const worldA = (ei / EMBERS) * Math.PI * 2 + frame * 0.045;
                    const spd    = 0.9 + ((seed2 >> 3) & 7) * 0.22;
                    const cyLen  = 28 + (seed2 & 15);
                    const cyT    = ((frame + (seed2 & 31)) % cyLen) / cyLen;  // 0→1
                    const ewx    = tx + Math.cos(worldA) * spd * cyT * 3.8;
                    const ewy    = ty + Math.sin(worldA) * spd * cyT * 3.8;
                    const eScrZ  = Math.sin(cyT * Math.PI) * (50 + spd * 70);  // screen-px height
                    const epx2   = (ewx - player.visualX - (ewy - player.visualY)) * TILE_W + canvas.width  / 2;
                    const epy2   = (ewx - player.visualX + (ewy - player.visualY)) * TILE_H + canvas.height / 2;
                    const eSize  = 1.8 + ((seed2 >> 9) & 3) * 0.6;
                    const eBr    = 60 + ((seed2 >> 13) & 3) * 9;
                    ctx.globalAlpha = (1 - cyT) * 0.88 * growT;
                    ctx.fillStyle   = `hsl(${18 + cyT * 32},100%,${eBr}%)`;
                    ctx.shadowColor = "#ff5500"; ctx.shadowBlur = 7;
                    ctx.beginPath();
                    ctx.arc(epx2, epy2 - eScrZ, eSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.shadowBlur = 0;
            }
        }

        ctx.restore();
    }

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
            // ── NEW EFFECT TYPES ──────────────────────────────────
            case "flameCrater": {
                // Glowing, flickering fire hole on the floor
                const fadeIn  = Math.min(1, (e.maxLife - e.life) / 30);
                const fadeOut = Math.min(1, e.life / 30);
                const factor  = Math.min(fadeIn, fadeOut);
                const flicker = 0.55 + 0.45*Math.sin(frame*0.28 + e.x*1.7);
                const r = e.radius * TILE_W;
                ctx.shadowColor="#ff4400"; ctx.shadowBlur=18;
                const grad = ctx.createRadialGradient(px,py-15,0,px,py-15,r);
                grad.addColorStop(0,"#ff660099");
                grad.addColorStop(0.45,"#cc220066");
                grad.addColorStop(1,"#88110000");
                ctx.fillStyle = grad;
                ctx.globalAlpha = factor * 0.65 * flicker;
                ctx.beginPath();
                ctx.arc(px, py-15, r, 0, Math.PI*2);
                ctx.fill();
                ctx.strokeStyle="#ff4400"; ctx.lineWidth=2;
                ctx.globalAlpha = factor * 0.45 * flicker;
                ctx.stroke();
                break;
            }
            case "blizzardField": {
                // Full-screen ice tint with swirling sparkles
                const fadeIn  = Math.min(1, (e.maxLife - e.life) / 60);
                const fadeOut = Math.min(1, e.life / 60);
                const factor  = Math.min(fadeIn, fadeOut);
                ctx.setTransform(1,0,0,1,0,0);
                ctx.globalAlpha = factor * 0.22;
                ctx.fillStyle = "#8cc8ff";
                ctx.fillRect(0,0,canvas.width,canvas.height);
                // Sparkles
                ctx.globalAlpha = factor * 0.55;
                ctx.fillStyle = "#ddeeff";
                for (let i=0;i<4;i++) {
                    const sx=Math.abs(Math.sin(frame*0.07+i*2.1+e.life*0.01))*canvas.width;
                    const sy=Math.abs(Math.cos(frame*0.09+i*1.7+e.life*0.013))*canvas.height;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 1+Math.abs(Math.sin(frame*0.15+i))*2, 0, Math.PI*2);
                    ctx.fill();
                }
                break;
            }
            case "smokeScreen": {
                // 3D visuals handled per-tile in the depth-sorted draw pass (game.js).
                // Only render an initial cast pulse ring here.
                const fadeIn = Math.min(1, (e.maxLife - e.life) / 30);
                if (fadeIn < 0.3) {
                    const prog = 1 - fadeIn / 0.3;
                    const r = prog * 4.0 * TILE_W;
                    ctx.strokeStyle = "#8aaa66";
                    ctx.lineWidth = 2;
                    ctx.shadowColor = "#8aaa66"; ctx.shadowBlur = 8;
                    ctx.globalAlpha = (1 - prog) * 0.55;
                    ctx.beginPath();
                    ctx.arc(px, py - 15, r, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
            }
            case "fireShockwave": {
                // Expanding isometric ground-plane ellipse — sits flat on the floor
                const prog  = 1 - e.life / e.maxLife;       // 0 → 1 as ring expands
                const rw    = prog * e.radius * TILE_W;
                const rh    = rw * 0.5;                      // iso floor compression
                const sAlpha = (1 - prog) * 0.85;
                // Outer stroke ring
                ctx.strokeStyle = `hsl(${18 + prog*20},100%,55%)`;
                ctx.lineWidth   = 3.5 - prog * 2.5;
                ctx.shadowColor = "#ff4400"; ctx.shadowBlur = 16;
                ctx.globalAlpha = sAlpha;
                ctx.beginPath();
                ctx.ellipse(px, py - 10, rw, rh, 0, 0, Math.PI * 2);
                ctx.stroke();
                // Radial fill gradient (lava-glow wash)
                const sfGrad = ctx.createRadialGradient(px, py - 10, 0, px, py - 10, rw);
                sfGrad.addColorStop(0,   `rgba(255,180,10,${sAlpha * 0.40})`);
                sfGrad.addColorStop(0.55,`rgba(220,50,0,${sAlpha * 0.18})`);
                sfGrad.addColorStop(1,   "rgba(160,15,0,0)");
                ctx.fillStyle   = sfGrad;
                ctx.globalAlpha = 0.8;
                ctx.beginPath();
                ctx.ellipse(px, py - 10, rw, rh, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
                break;
            }
        }

        ctx.restore();
    });
}
