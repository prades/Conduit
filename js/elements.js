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
let activeMeteorCast = null; // { caster, target, frames, maxFrames }

const FOLLOWER_ULTIMATES = {

    // ── FIRE: Meteor Burst ────────────────────────────────
    // 2-second cast — map darkens, reticle locks the strongest enemy,
    // then a meteor strikes for massive damage and leaves a flaming crater.
    fire: {
        name: "Meteor Burst",
        execute(actor) {
            if (actor.dead || activeMeteorCast) return;
            const actorZone = getZoneIndex(Math.floor(actor.x));
            let target = null, bestHP = -1;
            actors.forEach(a => {
                if ((a.team==="red"||(a instanceof Predator&&a.team!=="green"&&!a.isClone))&&!a.dead) {
                    if (getZoneIndex(Math.floor(a.x))===actorZone && a.health>bestHP) { bestHP=a.health; target=a; }
                }
            });
            if (!target) return; // no enemies — don't consume charge
            actor.ultimateCharge = 0;
            shake = Math.max(shake, 4);
            activeMeteorCast = { caster:actor, target, frames:0, maxFrames:120 };
            const _px=(actor.x-player.visualX-(actor.y-player.visualY))*TILE_W+canvas.width/2;
            const _py=(actor.x-player.visualX+(actor.y-player.visualY))*TILE_H+canvas.height/2;
            floatingTexts.push({x:_px,y:_py-80,text:"☄ METEOR BURST",color:"#ff6600",life:120,vy:-0.5});
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

    // ── METEOR BURST CAST TICK ──────────────────────────────
    if (activeMeteorCast) {
        activeMeteorCast.frames++;
        // Re-acquire target if original died during the 2 s cast
        if (!activeMeteorCast.target || activeMeteorCast.target.dead) {
            const actorZone = getZoneIndex(Math.floor(activeMeteorCast.caster.x));
            let best=null, bestHP=-1;
            actors.forEach(a=>{
                if((a.team==="red"||(a instanceof Predator&&a.team!=="green"&&!a.isClone))&&!a.dead){
                    if(getZoneIndex(Math.floor(a.x))===actorZone&&a.health>bestHP){bestHP=a.health;best=a;}
                }
            });
            activeMeteorCast.target = best;
        }
        if (activeMeteorCast.frames >= activeMeteorCast.maxFrames) {
            const {caster, target} = activeMeteorCast;
            activeMeteorCast = null;
            if (target && !target.dead) {
                const tx=target.x, ty=target.y;
                const dmg = (caster.stats?.specialAttack||10) * 3.0;
                shake = Math.max(shake, 18);
                actors.forEach(a=>{
                    if((a.team==="red"||(a instanceof Predator&&a.team!=="green"&&!a.isClone))&&!a.dead){
                        const d=Math.hypot(a.x-tx, a.y-ty);
                        if(d<=5.0){
                            applyElementalDamage(a, dmg*(1-d*0.12), caster, "fire");
                            a.burning=360; a.burnDamage=dmg*0.04;
                        }
                    }
                });
                spawnElementEffect({type:"meteor",   x:tx,y:ty,color:"#ffaa00",radius:5.0,life:45,element:"fire"});
                spawnElementEffect({type:"ring",     x:tx,y:ty,color:"#ff3300",radius:6.0,life:70,element:"fire"});
                spawnElementEffect({type:"flameCrater",x:tx,y:ty,radius:2.5,color:"#ff4400",life:600,maxLife:600,element:"fire",tickDamage:dmg*0.08});
                const _tpx=(tx-player.visualX-(ty-player.visualY))*TILE_W+canvas.width/2;
                const _tpy=(tx-player.visualX+(ty-player.visualY))*TILE_H+canvas.height/2;
                floatingTexts.push({x:_tpx,y:_tpy-60,text:"IMPACT!",color:"#ff2200",life:60,vy:-0.8});
            }
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

    // ── METEOR BURST CAST SHADOW + RETICLE ──────────────────
    if (activeMeteorCast) {
        const castPct = activeMeteorCast.frames / activeMeteorCast.maxFrames;
        ctx.save();
        ctx.setTransform(1,0,0,1,0,0);
        ctx.fillStyle = `rgba(20,5,0,${castPct * 0.55})`;
        ctx.fillRect(0,0,canvas.width,canvas.height);
        if (activeMeteorCast.target && !activeMeteorCast.target.dead) {
            const t = activeMeteorCast.target;
            const tpx=(t.x-player.visualX-(t.y-player.visualY))*TILE_W+canvas.width/2;
            const tpy=(t.x-player.visualX+(t.y-player.visualY))*TILE_H+canvas.height/2;
            const blink = Math.floor(activeMeteorCast.frames/8)%2===0;
            ctx.strokeStyle = blink ? "#ff6600" : "#ff2200";
            ctx.lineWidth = 2 + castPct * 3;
            ctx.globalAlpha = 0.45 + 0.55*castPct;
            ctx.shadowColor="#ff4400"; ctx.shadowBlur=14;
            // Expanding reticle ring
            ctx.beginPath();
            ctx.arc(tpx, tpy-30, 32 + castPct*20, 0, Math.PI*2);
            ctx.stroke();
            // Crosshairs
            const ch = 50 + castPct*20;
            ctx.beginPath();
            ctx.moveTo(tpx-ch, tpy-30); ctx.lineTo(tpx+ch, tpy-30);
            ctx.moveTo(tpx,    tpy-30-ch); ctx.lineTo(tpx, tpy-30+ch);
            ctx.stroke();
            // Impact radius preview
            ctx.globalAlpha = 0.07 * castPct;
            ctx.fillStyle = "#ff2200";
            ctx.beginPath();
            ctx.arc(tpx, tpy-30, 5.0*TILE_W*0.5, 0, Math.PI*2);
            ctx.fill();
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
                // Full-screen grey-green fog — fades in and out
                const fadeIn  = Math.min(1, (e.maxLife - e.life) / 90);
                const fadeOut = Math.min(1, e.life / 90);
                const factor  = Math.min(fadeIn, fadeOut);
                const drift   = Math.sin(frame*0.015 + e.zone*0.4) * 0.03;
                ctx.setTransform(1,0,0,1,0,0);
                ctx.globalAlpha = (factor + drift) * 0.36;
                ctx.fillStyle = "#5a6950";
                ctx.fillRect(0,0,canvas.width,canvas.height);
                break;
            }
        }

        ctx.restore();
    });
}
