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
                if (isHostileTarget(a)) {
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
            // Fire orbit visual — 3 fireballs orbit the follower
            actor.fireOrbitTimer = 50;
            return { hit: hits > 0 };
        },
        special(actor, target) {
            // FIRE BOMBS (js/firebombs.js, docs/FIRE-BOMBS.md): the special was a meteor on the target; it is now a pair of bouncing bombs lobbed at it. Each lands, bounces, splashes the hostile it lands on
            // and sets the ground burning for 10 to 15 seconds.
            if (!target) return { hit: false };
            if (typeof throwFireBombsAt === "function") { throwFireBombsAt(actor, target, 2, 0.16, (actor.stats?.specialAttack||10) * 0.7); return { hit: true }; }
            return { hit: false };
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
                    if (isHostileTarget(a) && !chainTargets.includes(a)) {
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
                if (isHostileTarget(a)) {
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
                if (isHostileTarget(a)) {
                    const dx=a.x-actor.x, dy=a.y-actor.y;
                    if (dx*dx+dy*dy <= 6.25) { // 2.5²=6.25, no sqrt needed
                        applyElementalDamage(a, (actor.stats?.specialAttack||10)*0.6, actor, "ice");
                        // Slow and freeze blocked by shields
                        if (!(a.shielded && a.shieldAmount > 0)) applySlow(a, 180, 0.4);
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
                if (isHostileTarget(a)) {
                    const dx=target.x-a.x, dy=target.y-a.y, d2=dx*dx+dy*dy;
                    if (d2 < 9 && d2 > 0.0001) { // 3²=9, avoid sqrt until we need direction
                        const dist=Math.sqrt(d2);
                        // Velocity-based pull so the motion animates over several frames
                        // (not on what is too heavy to drag — vortexPullImmune).
                        if (!(typeof vortexPullImmune === "function" && vortexPullImmune(a))) {
                            a.kbVX = (dx/dist) * 0.12;
                            a.kbVY = (dy/dist) * 0.12;
                        }
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
                floatingTexts.push({ world:true, x:target.x, y:target.y, text:"BASH!", color:"#00ffcc", life:30, vy:-0.06 });
                spawnElementEffect({ type:"ring", x:target.x, y:target.y, color:"#00ccaa", radius:0.8, life:18, element:"core" });
            }
            return { hit: true };
        }
        // (no special: RADIANT PULSE shielded the followers round it, and the followers' shield is gone; js/combat.js gives core its physical every time)
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
            // Smoke bomb — arc projectile that lands and weakens + debuffs enemies
            const lx = target.x, ly = target.y;
            const dist = Math.hypot(lx - actor.x, ly - actor.y);
            const totalFrames = Math.max(18, Math.round(dist * 7));
            const vx = (lx - actor.x) / totalFrames;
            const vy = (ly - actor.y) / totalFrames;
            const dmg = (actor.stats?.specialAttack||10) * 0.12;
            const caster = actor;
            spawnElementEffect({ type:"smoke", x:actor.x, y:actor.y, color:"#66ff66", radius:0.5, life:20, element:"toxic" });
            followerProjectiles.push({
                x: actor.x, y: actor.y,
                vx, vy,
                life: totalFrames,
                element: "toxic",
                radius: 5,
                damage: 0,
                source: actor,
                isBomb: true,
                noHitDetect: true,
                arcData: { totalFrames, peakHeight: 60 },
                onLand() {
                    // Spawn lingering cloud (less damage, shorter duration than before)
                    spawnElementEffect({ type:"toxicCloud", x:lx, y:ly, color:"#66ff66", radius:1.8, life:240, element:"toxic", tickDamage: dmg * 0.3 });
                    spawnElementEffect({ type:"impact", x:lx, y:ly, color:"#88ff44", radius:2.0, life:30, element:"toxic" });
                    const r2 = 2.25; // 1.5 tile radius
                    actors.forEach(a => {
                        if (isHostileTarget(a)) {
                            const ddx=a.x-lx, ddy=a.y-ly;
                            if (ddx*ddx+ddy*ddy <= r2) {
                                applyDamage(a, dmg, caster, "toxic");
                                a.toxicWeakened = 240; // 4s: reduces attack power
                                a.smokeDebuff = Math.max(a.smokeDebuff||0, 180); // 3s: reduces accuracy
                                const _tpx=(a.x-player.visualX-(a.y-player.visualY))*TILE_W+canvas.width/2;
                                const _tpy=(a.x-player.visualX+(a.y-player.visualY))*TILE_H+canvas.height/2;
                                floatingTexts.push({x:_tpx,y:_tpy-35,text:"WEAKENED",color:"#88ff44",life:55,vy:-0.65});
                            }
                        }
                    });
                }
            });
            return { hit: true };
        }
    }
};

// ─────────────────────────────────────────────────────────
//  FOLLOWER ULTIMATE ABILITIES
//  Triggered by double-tap when ultimateCharge === 100
// ─────────────────────────────────────────────────────────
// Each one works on what is within ULT_REACH tiles of the follower that fires it (the facility is rooms and halls: there is no zone to fill).
const ULT_REACH = 12;                   // tiles
const SMOKE_SCREEN_REACH = ULT_REACH;   // how far the toxic smoke creeps out (js/game.js draws it tile by tile)
function ultNear(from, a) { return !!a && Math.hypot(a.x - from.x, a.y - from.y) <= ULT_REACH; }
// the hostile with the most health within reach of `from` (the eruption's target)
function ultBiggestFoe(from) {
    let target = null, bestHP = -1;
    actors.forEach(a => { if (isHostileTarget(a) && ultNear(from, a) && a.health > bestHP) { bestHP = a.health; target = a; } });
    return target;
}
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
            const target = ultBiggestFoe(actor);
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
    // Instantly destroys every enemy shield within reach and
    // surges the followers there with resonance and speed.
    electric: {
        name: "EMP",
        execute(actor) {
            if (actor.dead) return;
            actor.ultimateCharge = 0;
            shake = Math.max(shake, 8);
            const _px=(actor.x-player.visualX-(actor.y-player.visualY))*TILE_W+canvas.width/2;
            const _py=(actor.x-player.visualX+(actor.y-player.visualY))*TILE_H+canvas.height/2;
            floatingTexts.push({x:_px,y:_py-80,text:"⚡ EMP",color:"#ffffaa",life:90,vy:-0.9});
            // Strip shields + mark every enemy in reach for the EMP glow highlight
            actors.forEach(a => {
                if (!isHostileTarget(a) || !ultNear(actor, a)) return;
                if (a.shielded) {
                    a.shielded=false; a.shieldAmount=0; a._shieldMax=0;
                    spawnElementEffect({type:"impact",x:a.x,y:a.y,color:"#ffee33",radius:1.2,life:25,element:"electric"});
                }
                a.empGlow = 80; // electric highlight for screen-dark effect
            });
            // Activate screen-darkening EMP flash
            activeEmpEffect = { timer: FX_EMP_FRAMES, maxTimer: FX_EMP_FRAMES };
            // Buff the followers in reach: +30 resonance + 1.5× speed for 5 seconds
            followers.forEach(f => {
                if (f.dead || !ultNear(actor, f)) return;
                f.currentResonance = Math.min(100, (f.currentResonance||0)+30);
                if (!f._empBoostTimer || f._empBoostTimer<=0) {
                    f._empBaseSpeed = f.moveSpeed;
                    f.moveSpeed = f._empBaseSpeed * 1.5;
                    // tickSlowSpeed pins moveSpeed back to baseMoveSpeed every
                    // frame, which undid this boost within a frame — so the
                    // base is raised with it and put back when it ends.
                    if (f.baseMoveSpeed === undefined) f.baseMoveSpeed = f._empBaseSpeed;
                    if (f.baseMoveSpeed !== undefined) { f._empBaseBase = f.baseMoveSpeed; f.baseMoveSpeed = f.baseMoveSpeed * 1.5; }
                }
                f._empBoostTimer = 300;
                spawnElementEffect({type:"impact",x:f.x,y:f.y,color:"#ffee33",radius:0.8,life:20,element:"electric"});
            });
            spawnElementEffect({type:"ring",x:actor.x,y:actor.y,color:"#ffee33",radius:8.0,life:55,element:"electric"});
        }
    },

    // ── ICE: Blizzard ─────────────────────────────────────
    // A blizzard field ULT_REACH tiles round the follower — enemies in it have
    // a high chance to freeze every 30 frames for the field's duration.
    ice: {
        name: "Blizzard",
        execute(actor) {
            if (actor.dead) return;
            actor.ultimateCharge = 0;
            shake = Math.max(shake, 6);
            const _px=(actor.x-player.visualX-(actor.y-player.visualY))*TILE_W+canvas.width/2;
            const _py=(actor.x-player.visualX+(actor.y-player.visualY))*TILE_H+canvas.height/2;
            floatingTexts.push({x:_px,y:_py-80,text:"❄ BLIZZARD",color:"#aaddff",life:90,vy:-0.9});
            spawnElementEffect({type:"blizzardField",x:actor.x,y:actor.y,radius:ULT_REACH,color:"#99ddff",life:360,maxLife:360,element:"ice"});
            spawnElementEffect({type:"ring",x:actor.x,y:actor.y,color:"#99ddff",radius:8.0,life:60,element:"ice"});
        }
    },

    // ── FLUX: Disorient ───────────────────────────────────
    // Every creature within reach turns on its own kind — they attack
    // each other for 4 seconds with half attack power.
    flux: {
        name: "Disorient",
        execute(actor) {
            if (actor.dead) return;
            actor.ultimateCharge = 0;
            shake = Math.max(shake, 10);
            const _px=(actor.x-player.visualX-(actor.y-player.visualY))*TILE_W+canvas.width/2;
            const _py=(actor.x-player.visualX+(actor.y-player.visualY))*TILE_H+canvas.height/2;
            floatingTexts.push({x:_px,y:_py-80,text:"⟳ DISORIENT",color:"#cc66ff",life:90,vy:-0.9});
            actors.forEach(a => {
                if (!(a instanceof Predator)||a.team==="green"||a.isClone||a.dead||!ultNear(actor, a)) return;
                a.disorientFF = 240;          // friendly-fire mode for 4 s
                a.disorientPowerFactor = 0.5; // attacks at half power
                a.disoriented = 240;
                spawnElementEffect({type:"impact",x:a.x,y:a.y,color:"#cc66ff",radius:0.8,life:25,element:"flux"});
            });
            spawnElementEffect({type:"singularity",x:actor.x,y:actor.y,color:"#9933ff",radius:5.0,life:60,element:"flux"});
        }
    },

    // (CORE has no ultimate: SHIELD GRANT put a shield on every follower, and the followers' shield is gone; js/draw.js shows no bar for it)

    // ── TOXIC: Smoke Screen ───────────────────────────────
    // A thick smoke cloud creeps out SMOKE_SCREEN_REACH tiles round the
    // follower — every enemy within reach has its attack accuracy halved for 8 seconds.
    toxic: {
        name: "Smoke Screen",
        execute(actor) {
            if (actor.dead) return;
            actor.ultimateCharge = 0;
            shake = Math.max(shake, 5);
            const _px=(actor.x-player.visualX-(actor.y-player.visualY))*TILE_W+canvas.width/2;
            const _py=(actor.x-player.visualX+(actor.y-player.visualY))*TILE_H+canvas.height/2;
            floatingTexts.push({x:_px,y:_py-80,text:"◎ SMOKE SCREEN",color:"#aabb99",life:90,vy:-0.9});
            actors.forEach(a => { if (isHostileTarget(a) && ultNear(actor, a)) a.smokeDebuff = 480; });
            spawnElementEffect({type:"smokeScreen",x:actor.x,y:actor.y,radius:SMOKE_SCREEN_REACH,color:"#aabb88",life:480,maxLife:480,element:"toxic"});
        }
    }

}; // end FOLLOWER_ULTIMATES

// ─────────────────────────────────────────────────────────
//  ELEMENT EFFECTS POOL (visual + lingering)
// ─────────────────────────────────────────────────────────
let elementEffects = [];

let DEBUG_PREDATOR = false;   // (js/draw.js: a creature's facing and reach drawn over it)

function spawnElementEffect(effect) {
    elementEffects.push({ ...effect, currentRadius: 0 });
}

// ── THE EFFECT BUDGET (Conduit effects plan, rule 5) ─────
// Clouds of the same kind within a tile merge (the newer refreshes the older);
// two blizzards within reach of each other merge; and never more than FX_MAX
// alive — the oldest short-lived ones go first, the long area effects are kept.
const FX_MAX = 80;
const FX_CLOUD_MAX = 12;
const FX_LONG = { blizzardField: 1, smokeScreen: 1, flameCrater: 1 };
function fxTidy() {
    if (!elementEffects.length) return;
    const keep = [], clouds = [], blizzards = [];
    for (let i = elementEffects.length - 1; i >= 0; i--) {   // newest first
        const e = elementEffects[i];
        if (e.type === "toxicCloud" || e.type === "smoke") {
            const twin = clouds.find(c => c.type === e.type && Math.abs(c.x - e.x) < 1 && Math.abs(c.y - e.y) < 1);
            if (twin) { twin.life = Math.max(twin.life, e.life); continue; }
            if (clouds.length >= FX_CLOUD_MAX) continue;
            clouds.push(e);
        }
        if (e.type === "blizzardField") {
            const twin = blizzards.find(b => Math.hypot(b.x - e.x, b.y - e.y) < (e.radius || ULT_REACH));
            if (twin) { twin.life = Math.max(twin.life, e.life); continue; }
            blizzards.push(e);
        }
        keep.push(e);
    }
    keep.reverse();
    if (keep.length > FX_MAX) {
        let drop = keep.length - FX_MAX;
        for (let i = 0; i < keep.length && drop > 0; i++) if (!FX_LONG[keep[i].type]) { keep[i] = null; drop--; }
    }
    elementEffects.length = 0;
    for (const e of keep) if (e) elementEffects.push(e);
}

function updateElementEffects() {

    // ── VOLCANIC ERUPTION TICK ──────────────────────────────
    if (activeFireEruption) {
        const afe = activeFireEruption;
        afe.frames++;
        // During charge phase track live target so position locks at eruption start
        if (afe.frames < 50) {
            if (!afe.target || afe.target.dead) afe.target = ultBiggestFoe(afe.caster);
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
                if(isHostileTarget(a)){
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
            spawnElementEffect({type:"flameCrater",   x:tx,y:ty, radius:3.0, color:"#ff4400", life:FX_CRATER_FRAMES, maxLife:FX_CRATER_FRAMES, element:"fire", tickDamage:dmg*0.06});
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
                if (isHostileTarget(a)) {
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
                if(isHostileTarget(a)){
                    const dx=a.x-e.x,dy=a.y-e.y;
                    if(dx*dx+dy*dy<=_er2) applyDamage(a,e.tickDamage||3,null,"fire");
                }
            });
        }

        // Blizzard field — 60 % freeze chance every 30 frames for every enemy in it
        if (e.type === "blizzardField" && e.life % 30 === 0) {
            const r = e.radius || ULT_REACH;
            actors.forEach(a=>{
                if(isHostileTarget(a)&&!a.frozen){
                    if(Math.hypot(a.x-e.x,a.y-e.y)<=r && Math.random()<0.60){
                        a.frozen=true; a.frozenEscapeChance=0.006; // ~2.8 s average
                        spawnElementEffect({type:"impact",x:a.x,y:a.y,color:"#99ddff",radius:0.5,life:15,element:"ice"});
                    }
                }
            });
        }

        return e.life > 0;
    });
    fxTidy();

    // Tick EMP screen-darkening flash
    if (activeEmpEffect) {
        activeEmpEffect.timer--;
        if (activeEmpEffect.timer <= 0) activeEmpEffect = null;
    }
}

function drawElementEffects() {

    // ── EMP: a short dim, and a crackling ring on each predator it hit ──
    // (Conduit effects plan: 0.35 for half a second, no blur.)
    if (activeEmpEffect && activeEmpEffect.timer > 0) {
        const t = activeEmpEffect.timer / activeEmpEffect.maxTimer;
        ctx.save(); ctx.setTransform(1,0,0,1,0,0);
        ctx.fillStyle = `rgba(0,0,14,${FX_EMP_DIM * t})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }
    actors.forEach(a => {
        if (!a.empGlow || a.empGlow <= 0 || a.dead) return;
        const epx = (a.x - player.visualX - (a.y - player.visualY)) * TILE_W + canvas.width  / 2;
        const epy = (a.x - player.visualX + (a.y - player.visualY)) * TILE_H + canvas.height / 2;
        ctx.save(); ctx.setTransform(1,0,0,1,0,0);
        ctx.globalAlpha = Math.min(1, a.empGlow / 30) * 0.85;
        ctx.strokeStyle = "#ffee33"; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i <= 12; i++) {
            const an = i / 12 * Math.PI * 2, r = 15 + ((i + (frame >> 2)) % 3) * 2;
            ctx.lineTo(epx + Math.cos(an) * r, epy - 12 + Math.sin(an) * r * 0.6);
        }
        ctx.stroke();
        ctx.restore();
    });

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
            // Edges only, at the moment it erupts, for half a second
            // (Conduit effects plan) — it used to wash the whole screen red.
            const since = frames - eruptStart;
            if (since >= 0 && since < 30) {
                const vigA = FX_VIGNETTE * (1 - since / 30);
                ctx.save(); ctx.setTransform(1,0,0,1,0,0);
                const W = canvas.width, H = canvas.height;
                const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
                g.addColorStop(0, "rgba(120,10,0,0)"); g.addColorStop(1, `rgba(120,10,0,${vigA})`);
                ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
                ctx.restore();
            }
        }

        ctx.save();
        ctx.shadowBlur =0;

        // ── GROUND GLOW (iso ellipse, ground plane) ──────────
        {
            const glowProg = frames < chargeEnd ? frames / chargeEnd : 1;
            const gR = (0.4 + glowProg * 1.1) * TILE_W;   // bounded to the crater
            const gA = glowProg * 0.35;
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
            ctx.lineWidth = 1.8; ctx.shadowBlur = 0;
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
            ctx.shadowBlur =0;
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
                    ctx.shadowBlur  = 0;
                    ctx.beginPath();
                    ctx.ellipse(tpx, sliceY, rw, rh, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.shadowBlur =0;

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
                        ctx.shadowColor = "#ffcc44"; ctx.shadowBlur = 0;
                        ctx.beginPath();
                        ctx.ellipse(tpx, rY, rW2, rH2, 0, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.shadowBlur =0;
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
                    ctx.shadowColor = "#ffdd00"; ctx.shadowBlur = 0;
                    ctx.beginPath();
                    ctx.ellipse(tpx, tpy - colH, crownRW, crownRW * 0.38, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.shadowBlur =0;
                    // Crown spike rays
                    const NUM_RAYS = 8;
                    ctx.lineWidth = 2;
                    for (let ri = 0; ri < NUM_RAYS; ri++) {
                        const rayA  = (ri / NUM_RAYS) * Math.PI * 2 + frame * 0.06;
                        const rayR0 = crownRW * 0.55;
                        const rayR1 = crownRW * (1.0 + Math.sin(frame * 0.18 + ri) * 0.25);
                        ctx.globalAlpha = crownFade * (0.4 + Math.sin(frame * 0.2 + ri * 1.3) * 0.3);
                        ctx.strokeStyle = `hsl(${40 + ri * 5},100%,75%)`;
                        ctx.shadowColor = "#ffcc00"; ctx.shadowBlur = 0;
                        ctx.beginPath();
                        ctx.moveTo(tpx + Math.cos(rayA) * rayR0,
                                   tpy - colH + Math.sin(rayA) * rayR0 * 0.38);
                        ctx.lineTo(tpx + Math.cos(rayA) * rayR1,
                                   tpy - colH + Math.sin(rayA) * rayR1 * 0.38);
                        ctx.stroke();
                    }
                    ctx.shadowBlur =0;
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
                    ctx.shadowColor = "#ff5500"; ctx.shadowBlur = 0;
                    ctx.beginPath();
                    ctx.arc(epx2, epy2 - eScrZ, eSize, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.shadowBlur =0;
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
            // A ring is a floor ellipse stroke growing to the effect's reach.
            // No fill: the fill colour was built as "rgba(ff3300" — invalid —
            // so every ring drew a hidden black disc. (Conduit effects plan.)
            case "ring":
            case "singularity": {
                const progress = 1 - (e.life / (e.type==="singularity"?60:40));
                const r = Math.max(1, e.radius * progress * TILE_W * 0.5);
                ctx.strokeStyle = e.color;
                ctx.lineWidth = 2;
                ctx.globalAlpha = alpha * (1 - progress * 0.6);
                ctx.beginPath();
                ctx.ellipse(px, py + TILE_H * 0.6, r, r * 0.5, 0, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }
            // A hit: a thin ring growing 4 → ~16 px and three sparks, 0.2 s.
            case "impact": {
                if (e._l0 === undefined) e._l0 = Math.max(1, e.life);
                const k = 1 - e.life / e._l0;
                const rMax = Math.max(10, Math.min(22, (e.radius || 0.3) * TILE_W * 0.5));
                const r = 4 + (rMax - 4) * k;
                ctx.globalAlpha = 1 - k;
                ctx.strokeStyle = e.color || "#fff"; ctx.lineWidth = 1.5;
                ctx.beginPath(); ctx.arc(px, py - 30, r, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = "#ffffff";
                const seed = (e.x * 7.1 + e.y * 3.3) % 6.28;
                for (let si = 0; si < 3; si++) {
                    const a = seed + si * 2.1;
                    ctx.beginPath();
                    ctx.moveTo(px + Math.cos(a) * r * 0.8, py - 30 + Math.sin(a) * r * 0.8);
                    ctx.lineTo(px + Math.cos(a) * (r + 5), py - 30 + Math.sin(a) * (r + 5));
                    ctx.stroke();
                }
                break;
            }
            // Three small puffs drifting up — hollow, a faint fill.
            case "smoke":
            case "toxicCloud": {
                if (e._l0 === undefined) e._l0 = Math.max(1, e.life);
                const base = Math.max(8, Math.min(16, (e.radius || 0.4) * TILE_W * 0.3));
                for (let pi = 0; pi < 3; pi++) {
                    const u = ((frame * 0.006) + pi / 3 + (e.x % 1)) % 1;
                    const r = base + 6 * u, x = px - 14 + pi * 14, y = py - 18 - u * 18;
                    ctx.globalAlpha = alpha * (1 - u);
                    ctx.fillStyle = e.color + "2e";        // ≈ 0.18
                    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = e.color + "66";      // ≈ 0.4
                    ctx.lineWidth = 1; ctx.stroke();
                }
                break;
            }
            // ── NEW EFFECT TYPES ──────────────────────────────────
            // A 90 px crater on the floor with glowing cracks (0.35).
            case "flameCrater": {
                const fadeIn  = Math.min(1, (e.maxLife - e.life) / 30);
                const fadeOut = Math.min(1, e.life / 30);
                const factor  = Math.min(fadeIn, fadeOut);
                const cy = py + TILE_H * 0.6;
                ctx.globalAlpha = factor * FX_CRATER_ALPHA;
                ctx.fillStyle = "#3c0e06";
                ctx.beginPath(); ctx.ellipse(px, cy, 45, 22, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = factor * (0.6 + 0.3 * Math.sin(frame * 0.08 + e.x));
                ctx.strokeStyle = "#ff7828"; ctx.lineWidth = 1.2;
                ctx.beginPath();
                for (const [a, l] of [[0.3, 30], [1.6, 26], [2.9, 32], [4.2, 24], [5.3, 28]]) {
                    ctx.moveTo(px, cy); ctx.lineTo(px + Math.cos(a) * l, cy + Math.sin(a) * l * 0.5);
                }
                ctx.stroke();
                break;
            }
            // Snow falling INSIDE its field, and a light frost over that disc of
            // floor. It used to tint the whole screen, and every copy added
            // another layer. (Conduit effects plan.)
            case "blizzardField": {
                const fadeIn  = Math.min(1, (e.maxLife - e.life) / 60);
                const fadeOut = Math.min(1, e.life / 60);
                const factor  = Math.min(fadeIn, fadeOut), R = e.radius || ULT_REACH;
                const W = canvas.width / 2, H = canvas.height / 2;
                const scr = (x, y) => [(x - player.visualX - (y - player.visualY)) * TILE_W + W,
                                       (x - player.visualX + (y - player.visualY)) * TILE_H + H + TILE_H];
                ctx.setTransform(1,0,0,1,0,0);
                const c0 = scr(e.x, e.y);   // a disc R tiles across on the floor is an ellipse on screen (a circle's corners land R√2 out along each screen axis)
                ctx.globalAlpha = factor * FX_FROST_ALPHA;
                ctx.fillStyle = "#aadcff";
                ctx.beginPath(); ctx.ellipse(c0[0], c0[1], R * 1.4142 * TILE_W, R * 1.4142 * TILE_H, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#e6f5ff";
                for (let si = 0; si < 60; si++) {
                    const rx = ((Math.sin(si * 127.1) * 43758.5) % 1 + 1) % 1, ry = ((Math.sin(si * 311.7) * 9631.3) % 1 + 1) % 1;
                    const an = rx * Math.PI * 2, rr = Math.sqrt(ry) * R;   // a flake somewhere in the disc
                    const [sx, sy] = scr(e.x + Math.cos(an) * rr, e.y + Math.sin(an) * rr);
                    const fall = ((frame * (0.6 + rx * 0.5) + ry * 120) % 120) - 100;
                    ctx.globalAlpha = factor * (0.4 + rx * 0.4);
                    ctx.fillRect(sx + Math.sin(frame * 0.03 + si) * 3, sy + fall, 1.5, 1.5);
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
                    ctx.globalAlpha = (1 - prog) * 0.55;
                    ctx.beginPath();
                    ctx.ellipse(px, py + TILE_H * 0.6, r, r * 0.5, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
            }
            // A ring stroke on the floor, growing and fading — no wash.
            case "fireShockwave": {
                const prog  = 1 - e.life / e.maxLife;
                const rw    = prog * e.radius * TILE_W * 0.5;
                ctx.strokeStyle = `hsl(${18 + prog*20},100%,55%)`;
                ctx.lineWidth   = 2;
                ctx.globalAlpha = (1 - prog) * 0.7;
                ctx.beginPath();
                ctx.ellipse(px, py + TILE_H * 0.6, rw, rw * 0.5, 0, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }
        }

        ctx.restore();
    });
}
