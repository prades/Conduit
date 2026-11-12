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
                        applyElementalDamage(a, dmg, actor, "fire", DMG_HIT_MAIN);
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
            if (typeof throwFireBombsAt === "function") { throwFireBombsAt(actor, target, 2, 0.16, (actor.stats?.specialAttack||10) * 0.7, DMG_HIT_SPECIAL); return { hit: true }; }
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
                applyElementalDamage(current, dmg, actor, "electric", DMG_HIT_MAIN);
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
                        applyElementalDamage(a, (actor.stats?.specialAttack||10)*0.7, actor, "electric", DMG_HIT_SPECIAL);
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
            applyElementalDamage(target, (actor.stats?.attack||10)*0.55, actor, "ice", DMG_HIT_MAIN);
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
                        applyElementalDamage(a, (actor.stats?.specialAttack||10)*0.6, actor, "ice", DMG_HIT_SPECIAL);
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
            applyElementalDamage(target, (actor.stats?.attack||10)*0.6, actor, "flux", DMG_HIT_MAIN);
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
                        applyElementalDamage(a, (actor.stats?.specialAttack||10)*0.5, actor, "flux", DMG_HIT_SPECIAL);
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
            applyElementalDamage(target, (actor.stats?.attack||10)*0.45, actor, "core", DMG_HIT_MAIN);
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
            applyElementalDamage(target, (actor.stats?.attack||10)*0.4, actor, "toxic", DMG_HIT_MAIN);
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
                                applyDamage(a, dmg, caster, "toxic", false, false, DMG_HIT_SPECIAL);
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
    },

    // ── BLOOM (build 2026-11-09b; the owner, 2026-11-09: "Full-strength hit") ─────
    // Its evolved Brawler's and Technician's everyday hit (SUNDEW's NECTAR STING, STONEPETAL's crushing head): `mult` × its attack on the one it hits, core's single-target number, no effect of
    // its own (a BLOOM hit MENDs: elementMend, called by applyDamage). It was the plain hit (a quarter of its attack) while BLOOM had no move. The number the agent's, provisional.
    blossom: {
        mult: 0.45,
        physical(actor, target) {
            if (!target) return { hit: false };
            applyElementalDamage(target, (actor.stats?.attack||10) * ELEMENT_ATTACKS.blossom.mult, actor, "blossom", DMG_HIT_MAIN);
            spawnElementEffect({ type:"impact", x:target.x, y:target.y, color:"#ff7ab8", radius:0.6, life:18, element:"blossom" });
            return { hit: true };
        }
        // (no special: an element's special is no longer fired by a follower, js/combat.js)
    }
};

// ─────────────────────────────────────────────────────────
//  FOLLOWER ULTIMATE ABILITIES
//  Triggered by double-tap when ultimateCharge === 100
// ─────────────────────────────────────────────────────────
// AN ULTIMATE IS AN EVOLVED FORM'S OWN (build 2026-11-09b; the owner, 2026-11-09: "an ultimate is an evolved followers thing, and there are not ultimate that can be used across all classes in one
// element"; "followers who are unevolved do not have an ultimate and remove all data of elemental ultimate that aren't specific to a certain follower"). The element-wide Ultimates (electric's EMP,
// ice's BLIZZARD, flux's DISORIENT, toxic's SMOKE SCREEN) are gone, with what only they used; fire's VOLCANIC ERUPTION was the Ember Hood's own and stays as that (FORM_ULTIMATES.embercowl). An
// unevolved follower has none; an evolved form without its own is flagged (followerUltPending, below): none yet, "NOT DESIGNED YET" on its INFO card (the owner: "Nothing yet").
// An Ultimate works on what is within ULT_REACH tiles of the follower that fires it (the facility is rooms and halls: there is no zone to fill).
const ULT_REACH = 12;                   // tiles
function ultNear(from, a) { return !!a && Math.hypot(a.x - from.x, a.y - from.y) <= ULT_REACH; }
// the hostile with the most health within reach of `from` (the eruption's target)
function ultBiggestFoe(from) {
    let target = null, bestHP = -1;
    actors.forEach(a => { if (isHostileTarget(a) && ultNear(from, a) && a.health > bestHP) { bestHP = a.health; target = a; } });
    return target;
}
// activeFireEruption: { caster, target, tx, ty, frames, maxFrames, crackDirs[] }
let activeFireEruption = null;

// ── THE EMBER HOOD'S VOLCANIC ERUPTION (FORM_ULTIMATES.embercowl; it was fire's element Ultimate until build 2026-11-09b) ──
// 3-phase 3D eruption — ground cracks and glows (charge), an isometric fire column erupts and rises (eruption), a crown burst explodes at the apex (crown), then the ground detonates with a massive
// shockwave + crater.
const ULT_VOLCANIC_ERUPTION = {
    desc: "A column of fire on the biggest enemy in reach, then a burning crater",
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
};

// ── EACH FOLLOWER'S OWN ULTIMATE (Milestone Three; the owner, 2026-11-06: "Own Ultimates"; docs/NEXT-PHASE-ROADMAP.md §12.3) ──
// Each evolved form fires its own; a form with none is flagged and fires nothing (build 2026-11-09b: the element Ultimates it once borrowed are gone). The meter, its charge and the double-tap are
// unchanged. An Ultimate that finds nothing to do keeps its charge.
const ULT_OVERDRIVE = { reach: 6, radius: 2, mult: 2, knock: 1 };                         // the Static Orb's: "Smaller rush" (tiles, tiles, × power split crush/electric, tiles of knockback)
const ULT_ZERO = { reach: 3, max: 3, frames: 360 };                                       // the Frost Maw's: "6 s, no damage" (tiles, enemies, frames)
const ULT_UNDERTOW = { radius: 3, mult: 1.5, thrown: 2.5, weak: 240, weakFactor: 0.7 };   // the Seeper's: "Strong" (tiles, × power, tiles thrown, frames of poison: hits 30% weaker)
const ULT_NETWORK = { frames: 600, tick: 30, mult: 0.5, poison: 180, touch: 0.5 };         // the Blight Spider's: "10 s" (frames, frames between bites, × power, frames of poison, tiles from a strand)
// How SHARD VORTEX's four shards whirl when they are the Rift Mimic's modelled blades (js/fx3d.js vortexshard; the owner: "spinning around like a hurricane"; the agent's numbers, provisional): each one's
// distance from the middle (× the drawn ring's), its speed round (radians a frame; the nearer, the faster), where it starts, its height (px), how fast it tumbles (steps of its 16 a frame) and about which axis (its sheet's row)
const SHARD_WHIRL = [{ r: 0.35, w: 0.19, a0: 0.0, h: 30, tw: 0.62, row: 0 }, { r: 0.62, w: 0.14, a0: 2.2, h: 14, tw: 0.47, row: 1 }, { r: 0.86, w: 0.105, a0: 4.0, h: 38, tw: 0.55, row: 2 }, { r: 0.5, w: 0.16, a0: 5.3, h: 22, tw: 0.7, row: 1 }];
const ULT_VORTEX = { radius: 3, frames: 480, tick: 30, mult: 0.4, heal: 0.25, pull: 0.06 };   // the Rift Mimic's SHARD VORTEX: "8 s" (tiles, frames, frames between bites, × power a bite, share of the damage healed, pull a frame)
const ULT_JELLY = { soak: 0.4, frames: 600, knock: 1 };                                     // the Jelly Ram's shields: "Squad only" (share of the wearer's max health, frames, tiles of knockback)
const ULT_QUILLSTORM = { count: 16, mult: 1, reach: 6 };                                     // the Quillstone's QUILLSTORM: "16 quills" (quills all round it, × power each, fire, tiles)
const ULT_STORM = { radius: 4, frames: 360, tick: 30, mult: 0.8 };                            // the Thunderhead's THUNDERSTORM (tiles round it, frames, frames between bolts, × power a bolt, electric)
const ULT_HORIZON = { reach: 6, radius: 4, frames: 300, tick: 30, mult: 0.3, pull: 0.08 };    // the Void Star's EVENT HORIZON (tiles away it may open, tiles it drags from, frames, frames between crushes, × power, pull a frame)
const ULT_WHITEOUT = { radius: 4, frames: 360, tick: 30, mult: 0.3, slow: 0.5 };            // the Rime Star's WHITEOUT (tiles round it, frames, frames between bites, × power, the share of speed kept)
const ULT_SLAM = { radius: 3.5, mult: 2, knock: 2, stun: 90 };                              // the Hammer Slug's SHOCKWAVE SLAM (the owner's pick, 2026-11-07): reach (tiles), × power (core), thrown (tiles), stun (frames; not a boss)
const ULT_RINK = { radius: 4, frames: 360, tick: 30, mult: 0.25, slow: 0.4, fast: 1.3 };     // the Igloo Skater's ICE RINK: reach, 6 s, a bite every 0.5 s of 0.25 × power (ice), enemies kept to 40% speed, the squad on it 30% faster
const ULT_PROXY = { count: 3, frames: 360, reach: 6, burst: 1.5, mult: 1.5, hp: 0.5 };       // the Goo Proxy's PROXY SWARM: copies, 6 s, the lure's reach (tiles), the burst's reach, × power (flux), each copy's HP (× its maximum)
const ULT_PUDDLE = { from: 0.5, radius: 2, grow: 120, frames: 300, tick: 30, mult: 0.5, poison: 120 };   // the Rotshard's: "Short and tight" (tiles at first and at full size, frames to grow, frames, frames between shards, × power a shard, frames of poison)
const ULT_WAVE = { reach: 6, waves: 3, every: 45, len: 4, cos: 0.64, mult: 0.8, knock: 1.5, step: 1.5 };   // the Hornshell's WAVE MAKER (the owner's design, 2026-11-07; these numbers are the agent's, provisional): aim reach (tiles), waves, frames between, a wave's reach (tiles), its width (cos of its half angle, ±50°), × power (core), tiles thrown, tiles it moves up between waves
// SUNDEW's CONSUME (build 2026-11-08k; docs/CONVERSION.md §2, the owner's rules): it swallows one enemy, anything but a boss, holds it 5 s out of the fight (`frames`), digesting it every second
// (`tick`), and spits it out if it lives; while it holds one it takes 75% less damage (`guard`). The agent's numbers, PROVISIONAL (the owner's are open): its reach (tiles: its mouth
// lunging), the digestion's bite (× its power a second) and its type (Elemental, BLOOM's: each bite MENDs, as every BLOOM hit).
const ULT_CONSUME = { reach: 2, frames: 300, tick: 60, mult: 0.5, guard: 0.75 };
// THORNWHIP's PINK THICKET (build 2026-11-08l; the owner's design, 2026-11-08: a big seed slung at an enemy grows into patchy pink-leaved
// bushes; the enemies there are bound and damaged; the damage becomes a healing aura for the area, "Shared out": the followers there, the most hurt first). The agent's numbers,
// PROVISIONAL: its reach (tiles), the thicket's radius (tiles) and life (frames), a beat every `tick` frames of `mult` × its power on every enemy in it (Elemental, BLOOM's), each held
// in place till the next beat.
const ULT_THICKET = { reach: 7, radius: 2, frames: 300, tick: 30, mult: 0.3 };
const ULT_CIRCUIT = { reach: 6, radius: 2.5, loop: 30, frames: 300, tick: 30, mult: 0.4, stun: 30 };   // the Electro Skink's LIGHTNING CIRCUIT (build 2026-11-09c; provisional): reach (tiles), the ring's radius (tiles), the loop's points (a frame each), 5 s, a beat every 0.5 s, × power a beat (electric), the stun for crossing (frames)
const ULT_DRIFT = { reach: 6, loop: 36, width: 1.6, beyond: 1.5, cut: 1.8, mult: 1.5, glitch: 30, fast: 1.3, frames: 360 };   // the Hover Shell's DRIFT SLASH (the owner's design, 2026-11-07; the oval: "a circular sort of slash, like a sword [...] he goes in and turns around like an oval shape"; the name and numbers are the agent's, provisional): reach (tiles), frames round the oval, its half width (tiles), how far past the enemies it swings (tiles), the blade's reach (tiles), × power a slash (half slashing, half electric), frames of interrupt, the squad's speed, its frames
const DMG_HIT_ULT_CRUSH = Object.freeze({ which: "special", stat: "sp", type: "crushing" });
const DMG_HIT_ULT_SLASH = Object.freeze({ which: "special", stat: "sp", type: "slashing" });
const KNOCK_PER_TILE = 0.28;   // (a push decays ×0.72 a frame, js/combat.js: a push of 0.28 carries a tile)
// A cluster of three black crystal spikes in green haze at a screen point (the Rotshard's: its puddle's shards and CRYSTAL SPIKE TRIO): h the tallest spike's height, w the spacing, a its opacity
// (h: its full height; rise 0..1, how far it has come up; seed: a number of the world, never of the screen, so each spike keeps the way it is turned)
function _fxRotSpikes(sx, sy, h, w, a, rise, seed) {
    if (rise === undefined) rise = 1;
    if (_fxRotSpikes3d(sx, sy, [[-w, 0.75], [w, 0.75], [0, 1]], h, a, rise, seed)) return;   // THE MODELLED SPIKE (docs/EFFECTS.md; js/fx3d.js rotspike): no green haze round it (the owner: "I don't like the green aura")
    ctx.globalAlpha = 0.35 * a; ctx.fillStyle = "#7dff4a"; ctx.beginPath(); ctx.ellipse(sx, sy - h * rise * 0.35, w * 2, h * rise * 0.5, 0, 0, Math.PI * 2); ctx.fill();   // the haze
    h *= rise;
    for (let i = -1; i <= 1; i++) { const hx = sx + i * w, hh = h * (i ? 0.75 : 1), hw = w * 0.5; ctx.globalAlpha = a; ctx.fillStyle = "#14161a"; ctx.beginPath(); ctx.moveTo(hx - hw, sy); ctx.lineTo(hx, sy - hh); ctx.lineTo(hx + hw, sy); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#7dff4a"; ctx.lineWidth = 1; ctx.stroke(); }
}
// THE ROTSHARD'S BLACK SPIKE, MODELLED (docs/EFFECTS.md; js/fx3d.js, the piece rotspike): spikes stood at (sx + ox, sy), each k of the height h, rising out of the floor, each turned its own way by the seed;
// a soft dark foot under each. False when the piece is not shown (not approved and no ?fx=3d) or its sheet has not arrived: the caller draws the old spikes.
function _fxRotSpikes3d(sx, sy, list, h, a, rise, seed) {
    if (typeof fx3dOn !== "function" || !fx3dOn("rotspike") || !fx3dReady("rotspike")) return false;
    const s0 = Math.floor(Math.abs(seed || 0) * 7919) % 8;   // (an entry: [x offset, its share of h, y offset (px, + toward the camera)], drawn back to front)
    ctx.globalAlpha = 0.35 * a * Math.min(1, rise * 1.5); ctx.fillStyle = "#020302";
    for (const [ox, k, oy] of list) { const r = h * k * 0.26; ctx.beginPath(); ctx.ellipse(sx + ox, sy + (oy || 0), r, r * 0.45, 0, 0, Math.PI * 2); ctx.fill(); }   // (each one's foot on the floor)
    ctx.globalAlpha = Math.min(1, a * 1.6); list.forEach(([ox, k, oy], i) => fx3dDrawUpright(ctx, "rotspike", sx + ox, sy + (oy || 0), s0 + i * 3, h * k, rise));   // (solid for most of a fade: a dark picture fading early is lost in the haze, where the drawn ones kept their bright edge)
    return true;
}
// TOXIC PUDDLE'S BLACK SPIKES AMONG EVERYTHING ELSE (js/game.js sorts them by depth with the units, as STAKE RING's are: js/techabilities.js): with the modelled spike on (js/fx3d.js rotspike), three burst
// up round each bitten enemy's feet, two just behind it (its body covers them) and one in front, 26 px, up in 3 frames, held, then sinking back into the floor over the last 6. Drawn over the units, as before,
// they stuck out of the bugs' backs (the owner, 2026-11-09, of the 16 px ones: "The little spikes look off to me").
const ROT_SPIKE_AROUND = [[-0.28, 0.05, 0.75], [0.05, -0.28, 0.8], [0.2, 0.22, 1]], ROT_SPIKE_H = 26;   // (world offsets round its feet and each one's share of the height; the agent's, provisional)
function rotSpikeDrawItems(list) {
    if (typeof fx3dOn !== "function" || !fx3dOn("rotspike") || !fx3dReady("rotspike") || typeof elementEffects === "undefined") return;
    for (const e of elementEffects) {
        if (e.type !== "toxicpuddle" || !e.shards || !e.shards.length) continue;
        const since = (e.maxLife - e.life) - e.shardAt; if (!(since >= 0 && since < 18)) continue;
        const k = Math.min(1, (e.maxLife - e.life) / 10, e.life / 20), rise = since < 3 ? since / 3 : since > 12 ? Math.max(0, (18 - since) / 6) : 1;
        for (const s of e.shards) { const c0 = Math.floor(Math.abs(s[0] * 3.1 + s[1] * 1.7) * 7919) % 8;
            ROT_SPIKE_AROUND.forEach(([dx, dy, kh], i) => list.push({ type: "rotspike", x: s[0] + dx, y: s[1] + dy, h: ROT_SPIKE_H * kh, rise, a: k, col: c0 + i * 3 })); }
    }
}
function rotSpikeDrawItem(o, px, py) {
    const sy = py + TILE_H;   // (on the floor where the puddle's own effects are)
    ctx.save(); ctx.globalAlpha = 0.35 * o.a * Math.min(1, o.rise * 1.5); ctx.fillStyle = "#020302"; ctx.beginPath(); ctx.ellipse(px, sy, o.h * 0.26, o.h * 0.117, 0, 0, Math.PI * 2); ctx.fill();   // its foot
    ctx.globalAlpha = Math.min(1, o.a * 1.6); fx3dDrawUpright(ctx, "rotspike", px, sy, o.col, o.h, o.rise); ctx.restore();
}
// One of WAVE MAKER's waves (FORM_ULTIMATES.hornshell), from where the Hornshell stands now: every enemy ahead of it (±50°) within ULT_WAVE.len that it can see is hurt (core) and thrown back
function _ultWave(e) {
    const W = ULT_WAVE, o = e.on;
    e.fired++; e.rings.push({ x: o.x, y: o.y, at: e.maxLife - e.life });
    for (const a of _evoFoesSeen(o.x, o.y, W.len)) {
        const ax = a.x - o.x, ay = a.y - o.y, d = Math.hypot(ax, ay) || 1;
        if ((ax * e.dx + ay * e.dy) / d < W.cos || (typeof facilityLosFrom === "function" && !facilityLosFrom(o.x, o.y, a.x, a.y))) continue;
        applyDamage(a, (o.power || 10) * W.mult, o, "core", false, false, DMG_HIT_SPECIAL);
        if (typeof applyKnockback === "function") applyKnockback(a, o, W.knock * KNOCK_PER_TILE);
    }
}
// DRIFT SLASH's next leg (FORM_ULTIMATES.hovershell): to the next enemy of its route still standing and in sight (stopping short of it), else home to its post
// DRIFT SLASH's oval (FORM_ULTIMATES.hovershell): from its post out round the enemy it aims at and back, ULT_DRIFT.loop points. The oval's near end is the post, its far end ULT_DRIFT.beyond tiles past
// the enemy, ULT_DRIFT.width tiles either side of the line; where a wall is in the way it is drawn narrower and shorter, and if even that is blocked it goes straight out and back (to an enemy it can see).
function _ultDriftPath(o, cx, cy) {
    const D = ULT_DRIFT, hx = o.x, hy = o.y, dx = cx - hx, dy = cy - hy, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, vx = -uy, vy = ux;
    const oval = (a, b) => { const mx = hx + ux * a, my = hy + uy * a, pts = []; for (let n = 1; n <= D.loop; n++) { const t = Math.PI + n / D.loop * Math.PI * 2, ex = Math.cos(t) * a, ey = Math.sin(t) * b; pts.push([mx + ux * ex + vx * ey, my + uy * ex + vy * ey]); } return pts; };
    for (const k of [1, 0.7, 0.45]) { const pts = oval((L + D.beyond * k) / 2, D.width * k); if (typeof facilityStandOk !== "function" || pts.every(p => facilityStandOk(p[0], p[1]))) return pts; }
    return oval(Math.max(0.3, L - 0.6) / 2, 0.01);
}
function _ultDriftSlash(o, a) {
    if (!a || a.dead) return;
    const p = (o.power || 10) * ULT_DRIFT.mult / 2;
    applyDamage(a, p, o, null, false, false, DMG_HIT_ULT_SLASH); applyDamage(a, p, o, "electric", false, false, DMG_HIT_SPECIAL);
    spawnElementEffect({ type: "impact", x: a.x, y: a.y, color: "#fff27a", radius: 0.9, life: 16, element: "electric" });
}
function _ultSay(a, text, color) { if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: a.x, y: a.y, text, color, life: 60, vy: -0.06, size: 13 }); }
const FORM_ULTIMATES = {
    embercowl: ULT_VOLCANIC_ERUPTION,   // VOLCANIC ERUPTION: the Ember Hood's own (roadmap §12.3)
    // OVERDRIVE: an overload, then a rush to the biggest group of enemies it can see and walk straight to (up to ULT_OVERDRIVE.reach tiles); everything within ULT_OVERDRIVE.radius of where it
    // lands takes ULT_OVERDRIVE.mult × its power, half crushing and half electric, and is knocked back.
    staticorb: { name: "Overdrive", desc: "An overload, then a rush to the biggest group of enemies it can see: crushing and electric damage, and a knockback", execute(actor) {
        const O = ULT_OVERDRIVE, foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, O.reach) : [];
        let best = null, bestN = 0;
        for (const a of foes) { if (typeof facilityLosFrom === "function" && !facilityLosFrom(actor.x, actor.y, a.x, a.y)) continue; const n = foes.filter(b => Math.hypot(b.x - a.x, b.y - a.y) <= O.radius).length; if (n > bestN) { bestN = n; best = a; } }
        if (!best) return;
        actor.ultimateCharge = 0;
        const dx = best.x - actor.x, dy = best.y - actor.y, L = Math.hypot(dx, dy) || 1, s = Math.max(0, L - 0.8);
        actor.x += dx / L * s; actor.y += dy / L * s; actor._fpPath = null; actor.dirX = dx / L; actor.dirY = dy / L;
        for (const a of _evoFoesSeen(actor.x, actor.y, O.radius)) {
            const p = (actor.power || 10) * O.mult / 2;
            applyDamage(a, p, actor, null, false, false, DMG_HIT_ULT_CRUSH); applyDamage(a, p, actor, "electric", false, false, DMG_HIT_SPECIAL);
            if (typeof applyKnockback === "function") applyKnockback(a, actor, O.knock * KNOCK_PER_TILE);
        }
        spawnElementEffect({ type: "ring", x: actor.x, y: actor.y, radius: O.radius, color: "#fff27a", life: 30, element: "electric" });
        spawnElementEffect({ type: "impact", x: actor.x, y: actor.y, color: "#fff27a", radius: 1.2, life: 20, element: "electric" });
        _ultSay(actor, "OVERDRIVE", "#fff27a");
    } },
    // ABSOLUTE ZERO: it swallows up to ULT_ZERO.max enemies within ULT_ZERO.reach (not a boss), frozen inside it for ULT_ZERO.frames, no damage; then lets them go round it, unfrozen. (It grows
    // larger in the design: not drawn yet.)
    maw: { name: "Absolute Zero", desc: "Swallows up to three enemies near it and holds them frozen inside it, then lets them go", execute(actor) {
        const Z = ULT_ZERO, foes = (typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, Z.reach) : []).filter(a => !a.bossName && !a.bossId && !a._swallowedBy)
            .sort((a, b) => Math.hypot(a.x - actor.x, a.y - actor.y) - Math.hypot(b.x - actor.x, b.y - actor.y)).slice(0, Z.max);
        if (!foes.length) return;
        actor.ultimateCharge = 0;
        for (const a of foes) { a._swallowedBy = actor; a.untargetable = true; a.stunned = Math.max(a.stunned || 0, Z.frames); a.x = actor.x; a.y = actor.y; }
        spawnElementEffect({ type: "abszero", x: actor.x, y: actor.y, by: actor, held: foes, radius: 1.2, life: Z.frames, maxLife: Z.frames, element: "ice" });
        _ultSay(actor, "ABSOLUTE ZERO", "#bfefff");
    } },
    // CONSUME (SUNDEW's: "911, and make CONSUME his Ultimate"): the nearest enemy it can see within ULT_CONSUME.reach, not a boss nor one already held, swallowed whole: out of the fight
    // (untargetable, not drawn, still) inside it for ULT_CONSUME.frames, bitten every ULT_CONSUME.tick frames; SUNDEW stands still with its petals shut (js/npc.js) and takes
    // ULT_CONSUME.guard less damage (js/helpers.js applyDamage); then it is spat out in front of it, if it lives. Nothing to swallow: the charge is kept.
    // PINK THICKET (THORNWHIP's: the owner's design and name, 2026-11-08): a big seed slung at the nearest enemy it can see within ULT_THICKET.reach grows, where it lands, into a
    // thicket of patchy pink-leaved bushes ULT_THICKET.radius tiles round for ULT_THICKET.frames: at once and every ULT_THICKET.tick frames, every enemy in it is held in place and
    // bitten; the damage those bites deal is shared out as healing among your followers in it, the most hurt first. Nothing in reach: the charge is kept.
    shrub: { name: "Pink Thicket", desc: "Slings a big seed at an enemy: it grows into a thicket of pink-leaved bushes that holds the enemies in it in place and bites them; the damage it deals heals your followers in it, the most hurt first", execute(actor) {
        const T = ULT_THICKET, foes = (typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, T.reach) : []).sort((a, b) => Math.hypot(a.x - actor.x, a.y - actor.y) - Math.hypot(b.x - actor.x, b.y - actor.y));
        if (!foes.length || typeof spawnFollowerProjectile !== "function") return;
        const t = foes[0], dx = t.x - actor.x, dy = t.y - actor.y, L = Math.hypot(dx, dy) || 1;
        let landed = false; const land = (x, y) => { if (landed) return; landed = true; thicketGrow(actor, x, y); };   // (once: a seed can touch an enemy the frame it runs out)
        const p = spawnFollowerProjectile(actor, t, "#ff7ab8", 0, 9, a => land(a.x, a.y), DMG_HIT_SPECIAL, { range: L, kind: "bigseed" });   // (a big BLOOM seed: js/game.js draws it)
        if (!p) return;
        p.onLand = () => land(p.x, p.y);
        actor.ultimateCharge = 0; actor.dirX = dx / L; actor.dirY = dy / L;
        _ultSay(actor, "PINK THICKET", "#ff9ccc");
    } },
    sundew: { name: "Consume", desc: "Swallows an enemy whole (not a boss) and digests it for 5 seconds, a bite every second; while it holds one it takes 75% less damage; then spits it out if it lives", execute(actor) {
        const C = ULT_CONSUME, foes = (typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, C.reach) : []).filter(a => !a.bossName && !a.bossId && !a.isBoss && !a._swallowedBy)
            .sort((a, b) => Math.hypot(a.x - actor.x, a.y - actor.y) - Math.hypot(b.x - actor.x, b.y - actor.y));
        if (!foes.length || actor._consume) return;
        const prey = foes[0], f0 = typeof frame !== "undefined" ? frame : 0, dx = prey.x - actor.x, dy = prey.y - actor.y, L = Math.hypot(dx, dy) || 1;
        actor.ultimateCharge = 0; actor.dirX = dx / L; actor.dirY = dy / L;
        prey._swallowedBy = actor; prey.untargetable = true; prey.stunned = Math.max(prey.stunned || 0, C.frames); prey.x = actor.x; prey.y = actor.y;
        actor._consume = { t0: f0, prey };
        spawnElementEffect({ type: "consume", x: actor.x, y: actor.y, by: actor, held: [prey], life: C.frames, maxLife: C.frames, element: "blossom" });
        _ultSay(actor, "CONSUME", "#ff9ccc");
    } },
    // REEF PILLAR (the coral crab's: the owner's design and name, 2026-11-08: "A giant spike erupts from the ground between the target and the technician the crystal heels solely"; asked,
    // "Blocks and heals only"): the nearest enemy it can see within TECH_AB.pillar.reach is its target; a giant crystal spike erupts on the line between them, a lesser one either side of it,
    // standing like a wall in the enemy's way (js/techabilities.js techReefPillar: REEF's own rock and crystal): enemies cannot pass it, your followers near it are mended, and it hurts no one.
    // Nothing in reach, or no floor for it: the charge is kept. Its numbers are the agent's, provisional (TECH_AB.pillar).
    coralcrab: { name: "Reef Pillar", desc: "A giant crystal spike erupts between it and an enemy, a lesser one either side: a wall in the enemy's way that mends your followers near it. It hurts no one", execute(actor) {
        const P = typeof TECH_AB !== "undefined" ? TECH_AB.pillar : null;
        if (!P || typeof techReefPillar !== "function" || typeof _evoFoesSeen !== "function") return;
        const foes = _evoFoesSeen(actor.x, actor.y, P.reach).sort((a, b) => Math.hypot(a.x - actor.x, a.y - actor.y) - Math.hypot(b.x - actor.x, b.y - actor.y));
        if (!foes.length) return;
        const t = foes[0]; if (!techReefPillar(actor, t)) return;
        const dx = t.x - actor.x, dy = t.y - actor.y, L = Math.hypot(dx, dy) || 1;
        actor.ultimateCharge = 0; actor.dirX = dx / L; actor.dirY = dy / L;
        _ultSay(actor, "REEF PILLAR", "#ff9ccc");
    } },
    // TOXIC UNDERTOW: one toxic surge ULT_UNDERTOW.radius tiles round: ULT_UNDERTOW.mult × its power, each enemy thrown outward (its way turned by up to 40°, so they scatter), and poisoned
    // (the game's poison: its hits weaker) for ULT_UNDERTOW.weak frames. No pool is left.
    seeper: { name: "Toxic Undertow", desc: "One toxic surge that throws the enemies round it outward and poisons them", execute(actor) {
        const U = ULT_UNDERTOW, foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, U.radius) : [];
        if (!foes.length) return;
        actor.ultimateCharge = 0;
        foes.forEach((a, i) => {
            applyDamage(a, (actor.power || 10) * U.mult, actor, "toxic", false, false, DMG_HIT_SPECIAL);
            const ang = Math.atan2(a.y - actor.y, a.x - actor.x) + (((i * 2.399) % 1.4) - 0.7);
            if (typeof applyKnockback === "function") applyKnockback(a, { x: a.x - Math.cos(ang), y: a.y - Math.sin(ang) }, U.thrown * KNOCK_PER_TILE);
            if (typeof applyWeaken === "function") applyWeaken(a, U.weak, U.weakFactor);
        });
        spawnElementEffect({ type: "ring", x: actor.x, y: actor.y, radius: U.radius, color: "#7dff4a", life: 34, element: "toxic" });
        spawnElementEffect({ type: "impact", x: actor.x, y: actor.y, color: "#7dff4a", radius: 2, life: 24, element: "toxic" });
        _ultSay(actor, "TOXIC UNDERTOW", "#99ff88");
    } },
    // CONTAMINATION NETWORK: its toxic pods (js/techabilities.js; at least two) link with toxic strands for ULT_NETWORK.frames: an enemy within ULT_NETWORK.touch of a strand takes
    // ULT_NETWORK.mult × its power every ULT_NETWORK.tick frames and is poisoned. The pods stay.
    // SHARD VORTEX (Rift Mimic): its four shards spin out into a swirl ULT_VORTEX.radius tiles round where it stands, for ULT_VORTEX.frames: the swirl pulls the enemies in it to its middle and
    // the shards bite them (crushing) every ULT_VORTEX.tick frames; the Mimic heals ULT_VORTEX.heal of what they take, and can move on while they spin.
    mimic: { name: "Shard Vortex", desc: "Its shards spin out into a swirl that pulls enemies in and grinds them, healing it", execute(actor) {
        const V = ULT_VORTEX, foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, V.radius) : [];
        if (!foes.length) return;
        actor.ultimateCharge = 0;
        spawnElementEffect({ type: "shardvortex", x: actor.x, y: actor.y, by: actor, radius: V.radius, bite: (actor.power || 10) * V.mult, life: V.frames, maxLife: V.frames, element: null });
        _ultSay(actor, "SHARD VORTEX", "#c9a6ff");
    } },
    // THE JELLY RAM'S SHIELDS (its own; the name is open): a jelly shield on itself and on the other two followers of the squad, wherever they are ("Squad only": not the player). Each takes the
    // hits first, up to ULT_JELLY.soak of its wearer's max health, for ULT_JELLY.frames, and knocks the attacker back (jellyShieldTake, js/helpers.js applyDamage).
    jellyram: { name: "Jelly Shields", desc: "Jelly shields on itself and the two other squad followers: they take the hits and knock attackers back", execute(actor) {
        const others = (typeof partyMembers === "function" ? partyMembers() : []).filter(f => f !== actor && !f.dead).slice(0, 2), wear = [actor].concat(others), f0 = typeof frame !== "undefined" ? frame : 0;
        actor.ultimateCharge = 0;
        for (const w of wear) { w.jellyShield = { hp: (w.maxHealth || 20) * ULT_JELLY.soak, until: f0 + ULT_JELLY.frames, by: actor }; spawnElementEffect({ type: "jellyshield", x: w.x, y: w.y, on: w, life: ULT_JELLY.frames, maxLife: ULT_JELLY.frames, element: null }); }
        _ultSay(actor, "JELLY SHIELDS", "#9ff0ff");
    } },
    // FAULTLINE (Thermite Burrower; the owner, 2026-11-06: "Make it the Ultimate"): the drawn path of js/techabilities.js, opened by the Ultimate instead of a chip; the charge is spent when it goes under
    thermite: { name: "Faultline", desc: "Draw a path on the floor: it dives and runs under it, and molten spikes erupt along it", execute(actor) { if (typeof techChip2Tap === "function") techChip2Tap(actor); } },
    // THE ROTSHARD'S PUDDLE (its own; the name is open): a toxic puddle spreads under the biggest group of enemies it can see within its CORRODE SHOT's reach, growing from ULT_PUDDLE.from to
    // ULT_PUDDLE.radius tiles over ULT_PUDDLE.grow frames; for ULT_PUDDLE.frames, every ULT_PUDDLE.tick frames a small crystal shard erupts under each enemy in it (seen from its middle):
    // ULT_PUDDLE.mult × its power, toxic, and poisoned ULT_PUDDLE.poison frames.
    rotshard: { name: "Toxic Puddle", desc: "A toxic puddle spreads under a group of enemies; small crystal shards erupt from it under them, hurting and poisoning", execute(actor) {
        const P = ULT_PUDDLE, foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, typeof ROT_RANGE !== "undefined" ? ROT_RANGE : 7) : [];
        let best = null, bestN = 0;
        for (const a of foes) { const n = foes.filter(b => Math.hypot(b.x - a.x, b.y - a.y) <= P.radius).length; if (n > bestN) { bestN = n; best = a; } }
        if (!best) return;
        actor.ultimateCharge = 0;
        spawnElementEffect({ type: "toxicpuddle", x: best.x, y: best.y, by: actor, radius: P.from, bite: (actor.power || 10) * P.mult, shards: [], shardAt: -99, life: P.frames, maxLife: P.frames, element: "toxic" });
        _ultSay(actor, "TOXIC PUDDLE", "#99ff88");
    } },
    // QUILLSTORM (the Quillstone; the owner, 2026-11-07: "QUILLSTORM, 16 quills", the old archive's radial burst): ULT_QUILLSTORM.count burning quills all round it at once, each ULT_QUILLSTORM.mult × its power
    // (fire) to the first enemy it meets, out to ULT_QUILLSTORM.reach tiles (QUILL BURST's quill: js/evolution.js)
    quillstone: { name: "Quillstorm", desc: "A burst of burning quills all round it: each hits the first enemy in its way", execute(actor) {
        const Q = ULT_QUILLSTORM, foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, Q.reach) : [];
        if (!foes.length || typeof spawnFollowerProjectile !== "function") return;
        actor.ultimateCharge = 0;
        const dmg = (actor.power || 10) * Q.mult, sp = typeof QUILL_SPEED !== "undefined" ? QUILL_SPEED : 0.3;
        for (let i = 0; i < Q.count; i++) { const a = i / Q.count * Math.PI * 2; spawnFollowerProjectile(actor, { x: actor.x + Math.cos(a) * Q.reach, y: actor.y + Math.sin(a) * Q.reach }, "#ff7a2e", dmg, 4, null, DMG_HIT_SPECIAL, { speed: sp, range: Q.reach, kind: "quill" }); }
        spawnElementEffect({ type: "ring", x: actor.x, y: actor.y, radius: 1.2, color: "#ff8a3a", life: 24, element: "fire" });
        _ultSay(actor, "QUILLSTORM", "#ff8844");
    } },
    // THUNDERSTORM (the Thunderhead; the owner chose this proposal, 2026-11-07): a storm cloud ULT_STORM.radius tiles round it, moving with it, for ULT_STORM.frames; every ULT_STORM.tick frames a bolt strikes a
    // random enemy under it that can be seen from its middle: ULT_STORM.mult × its power (electric)
    thunderhead: { name: "Thunderstorm", desc: "A storm cloud round it: bolts strike random enemies under it", execute(actor) {
        const S = ULT_STORM, foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, S.radius) : [];
        if (!foes.length) return;
        actor.ultimateCharge = 0;
        spawnElementEffect({ type: "thunderstorm", x: actor.x, y: actor.y, on: actor, radius: S.radius, bite: (actor.power || 10) * S.mult, bolt: null, boltAt: -99, life: S.frames, maxLife: S.frames, element: "electric" });
        _ultSay(actor, "THUNDERSTORM", "#fff27a");
    } },
    // EVENT HORIZON (the Void Star; the owner chose this proposal, 2026-11-07): a black hole opens on the biggest group it can see within ULT_HORIZON.reach tiles, for ULT_HORIZON.frames; it drags every enemy
    // within ULT_HORIZON.radius tiles to its middle and crushes them for ULT_HORIZON.mult × its power every ULT_HORIZON.tick frames
    voidstar: { name: "Event Horizon", desc: "A black hole on a group of enemies: it drags them in and crushes them", execute(actor) {
        const H = ULT_HORIZON, foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, H.reach) : [];
        let best = null, bestN = 0;
        for (const a of foes) { const n = foes.filter(b => Math.hypot(b.x - a.x, b.y - a.y) <= H.radius).length; if (n > bestN) { bestN = n; best = a; } }
        if (!best) return;
        actor.ultimateCharge = 0;
        spawnElementEffect({ type: "eventhorizon", x: best.x, y: best.y, by: actor, radius: H.radius, bite: (actor.power || 10) * H.mult, life: H.frames, maxLife: H.frames, element: null });
        _ultSay(actor, "EVENT HORIZON", "#c9a6ff");
    } },
    // WHITEOUT (the Rime Star; the owner chose this proposal, 2026-11-07): a snowstorm ULT_WHITEOUT.radius tiles round it, moving with it, for ULT_WHITEOUT.frames: enemies in it are slowed to
    // ULT_WHITEOUT.slow of their speed and take ULT_WHITEOUT.mult × its power (ice) every ULT_WHITEOUT.tick frames
    rimestar: { name: "Whiteout", desc: "A snowstorm round it: enemies in it are slowed and chilled", execute(actor) {
        const W = ULT_WHITEOUT, foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, W.radius) : [];
        if (!foes.length) return;
        actor.ultimateCharge = 0;
        spawnElementEffect({ type: "whiteout", x: actor.x, y: actor.y, on: actor, radius: W.radius, bite: (actor.power || 10) * W.mult, life: W.frames, maxLife: W.frames, element: "ice" });
        _ultSay(actor, "WHITEOUT", "#bfefff");
    } },
    blightspider: { name: "Contamination Network", desc: "Its toxic pods link with toxic strands: enemies crossing them are hurt and poisoned", execute(actor) {
        const N = ULT_NETWORK, pods = (typeof techPools !== "undefined" ? techPools : []).filter(P => P.by === (actor.uid || null) && (typeof techPoolFade !== "function" || techPoolFade(P) > 0)).slice(-3);
        if (pods.length < 2) { _ultSay(actor, "NEEDS 2 TOXIC PODS", "#ff8a6a"); return; }
        actor.ultimateCharge = 0;
        const pts = pods.map(P => [P.x, P.y]), segs = []; for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) segs.push([pts[i], pts[j]]);
        const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length, cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
        spawnElementEffect({ type: "toxicnet", x: cx, y: cy, segs, by: actor, bite: (actor.power || 10) * N.mult, life: N.frames, maxLife: N.frames, element: "toxic" });
        _ultSay(actor, "CONTAMINATION NETWORK", "#99ff88");
    } },
    // SHOCKWAVE SLAM (the Hammer Slug; the owner chose this proposal, 2026-11-07): it rears up and slams down: every enemy within ULT_SLAM.radius tiles takes ULT_SLAM.mult × its power (core),
    // is thrown ULT_SLAM.knock tiles outward and stunned ULT_SLAM.stun frames (a boss is not stunned).
    hammerslug: { name: "Shockwave Slam", desc: "Slams down: a core shockwave round it that hurts, throws and stuns the enemies in it", execute(actor) {
        const S = ULT_SLAM, foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, S.radius) : [];
        if (!foes.length) return;
        actor.ultimateCharge = 0;
        for (const a of foes) {
            applyDamage(a, (actor.power || 10) * S.mult, actor, "core", false, false, DMG_HIT_SPECIAL);
            if (typeof applyKnockback === "function") applyKnockback(a, actor, S.knock * KNOCK_PER_TILE);
            if (!a.bossId && !a.bossName) a.stunned = Math.max(a.stunned || 0, S.stun);
        }
        spawnElementEffect({ type: "ring", x: actor.x, y: actor.y, radius: S.radius, color: "#33e6c4", life: 30, element: "core" });
        spawnElementEffect({ type: "impact", x: actor.x, y: actor.y, color: "#9ffff0", radius: 1.6, life: 22, element: "core" });
        if (typeof shake !== "undefined") shake = Math.max(shake || 0, 8);
        _ultSay(actor, "SHOCKWAVE SLAM", "#9ffff0");
    } },
    // ICE RINK (the Igloo Skater; the owner chose this proposal, 2026-11-07): it freezes the floor ULT_RINK.radius tiles round where it stands, for ULT_RINK.frames: enemies on it are kept to
    // ULT_RINK.slow of their speed and take ULT_RINK.mult × its power (ice) every ULT_RINK.tick frames; the squad's followers on it move ULT_RINK.fast × as fast. The rink stays where it was made.
    igloo: { name: "Ice Rink", desc: "Freezes the floor round it: enemies on it are slowed and chilled, the squad on it skates faster", execute(actor) {
        const R = ULT_RINK, foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, R.radius) : [];
        if (!foes.length) return;
        actor.ultimateCharge = 0;
        spawnElementEffect({ type: "icerink", x: actor.x, y: actor.y, by: actor, radius: R.radius, bite: (actor.power || 10) * R.mult, life: R.frames, maxLife: R.frames, element: "ice" });
        _ultSay(actor, "ICE RINK", "#bfefff");
    } },
    // PROXY SWARM (the Goo Proxy; the owner chose this proposal, 2026-11-07): ULT_PROXY.count goo copies of it pop out round it for ULT_PROXY.frames; every enemy within ULT_PROXY.reach
    // goes for the nearest (the ROTTEN DECOY's lure, js/evolution.js decoyLure; a boss does not); each bursts when broken or at the end, ULT_PROXY.mult × its power (flux) within ULT_PROXY.burst.
    gooproxy: { name: "Proxy Swarm", desc: "Three goo copies of it lure the enemies near it, then burst", execute(actor) {
        const X = ULT_PROXY, foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, X.reach) : [];
        if (!foes.length || typeof rotDecoys === "undefined") return;
        actor.ultimateCharge = 0;
        const f0 = typeof frame !== "undefined" ? frame : 0, hp = Math.max(1, (actor.maxHealth || 20) * X.hp);
        for (let k = 0; k < X.count; k++) {
            const an = k * Math.PI * 2 / X.count + 0.5; let x = actor.x + Math.cos(an) * 1.2, y = actor.y + Math.sin(an) * 1.2;
            if (typeof facilityStandOk === "function" && !facilityStandOk(x, y)) { x = actor.x; y = actor.y; }
            const d = { isDecoy: true, goo: true, team: "green", x, y, health: hp, maxHealth: hp, by: actor, until: f0 + X.frames, dead: false, name: "GOO PROXY", bite: (actor.power || 10) * X.mult };
            rotDecoys.push(d);
            spawnElementEffect({ type: "gooproxy", x, y, on: d, life: X.frames, maxLife: X.frames, element: "flux" });
        }
        _ultSay(actor, "PROXY SWARM", "#d9b0ff");
    } },
    // WAVE MAKER (the Hornshell; the owner's design, 2026-11-07: "3 waves that knock the enemy's back. The mage gains ground as he uses it as not to waste the pulses"): aimed at the nearest enemy
    // it can see within ULT_WAVE.reach, ULT_WAVE.waves waves roll out of its horn ULT_WAVE.every frames apart (_ultWave); between waves it moves ULT_WAVE.step tiles after them, onto floor only.
    hornshell: { name: "Wave Maker", desc: "Three waves out of its horn that hurt and throw the enemies back; it moves up after them between waves", execute(actor) {
        const W = ULT_WAVE, foes = (typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, W.reach) : []).filter(a => typeof facilityLosFrom !== "function" || facilityLosFrom(actor.x, actor.y, a.x, a.y));
        if (!foes.length) return;
        let t = foes[0], d0 = Infinity; for (const a of foes) { const d = Math.hypot(a.x - actor.x, a.y - actor.y); if (d < d0) { d0 = d; t = a; } }
        actor.ultimateCharge = 0;
        const L = d0 || 1, life = (W.waves - 1) * W.every + 24, e = { type: "wavemaker", x: actor.x, y: actor.y, on: actor, dx: (t.x - actor.x) / L, dy: (t.y - actor.y) / L, fired: 0, rings: [], life, maxLife: life, element: "core" };
        actor.dirX = e.dx; actor.dirY = e.dy; actor._fpPath = null;
        _ultWave(e); spawnElementEffect(e);
        _ultSay(actor, "WAVE MAKER", "#9ffff0");
    } },
    // DRIFT SLASH (the Hover Shell; the owner's design, 2026-11-07: "Hover shell drifts in and slashes enemies and returns to his post squad members get increased speed and enemies are interrupted",
    // then "a circular sort of slash, like a sword, like he goes in and turns around like an oval shape"; the name is the agent's): every enemy it can see within ULT_DRIFT.reach is interrupted (the GLITCH: its
    // wind-up fails for ULT_DRIFT.glitch frames); it swings out round the biggest group it can see in an oval and back to its post (_ultDriftPath, ULT_DRIFT.loop frames), slashing every enemy within
    // ULT_DRIFT.cut of it once (ULT_DRIFT.mult × its power, half slashing, half electric). The squad moves ULT_DRIFT.fast × as fast for ULT_DRIFT.frames. Its KINETIC LAUNCHER is untouched.
    hovershell: { name: "Drift Slash", desc: "Interrupts the enemies near it, swings round them in an oval slashing each, and returns to its post; the squad moves faster", execute(actor) {
        const D = ULT_DRIFT, foes = (typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, D.reach) : []).filter(a => typeof facilityLosFrom !== "function" || facilityLosFrom(actor.x, actor.y, a.x, a.y));
        if (!foes.length) return;
        actor.ultimateCharge = 0;
        const f0 = typeof frame !== "undefined" ? frame : 0;
        for (const a of foes) if (typeof applyGlitch === "function") applyGlitch(a, D.glitch);
        for (const f of (typeof partyMembers === "function" ? partyMembers() : []).concat([actor])) { if (f && !f.dead && !(f._voltUntil > f0 && (f._voltMove || 1) >= D.fast)) { f._voltUntil = f0 + D.frames; f._voltMove = D.fast; f._voltAtk = 1; } }   // (a voltage field as fast or faster is left as it is)
        let best = foes[0], bn = -1, bd = Infinity;   // the biggest group (most enemies within 2 tiles), the nearer on a tie
        for (const a of foes) { const n = foes.filter(b => Math.hypot(b.x - a.x, b.y - a.y) <= 2).length, d = Math.hypot(a.x - actor.x, a.y - actor.y); if (n > bn || (n === bn && d < bd)) { bn = n; bd = d; best = a; } }
        const path = _ultDriftPath(actor, best.x, best.y), life = path.length + 30;
        spawnElementEffect({ type: "hoverdrift", x: actor.x, y: actor.y, on: actor, home: [actor.x, actor.y], path, i: 0, hit: [], life, maxLife: life, element: "electric" });
        _ultSay(actor, "DRIFT SLASH", "#fff27a");
    } },
    // LIGHTNING CIRCUIT (the Electro Skink's own, build 2026-11-09c; the owner, 2026-11-09, picked it of the agent's drafts: "It races a loop round the biggest group of enemies it can see, leaving a ring of
    // lightning on the floor: for 5 s every enemy inside is shocked every half second, and one crossing the ring is stunned a moment"): the biggest group it can see within ULT_CIRCUIT.reach (DRIFT SLASH's
    // pick); it races round it at ULT_CIRCUIT.radius (a point of the loop a frame, only where it can stand: "skinkloop"), then the ring ("circuit") lies there for ULT_CIRCUIT.frames: every ULT_CIRCUIT.tick
    // frames each enemy inside that its middle can see takes ULT_CIRCUIT.mult × its power (electric), and one that has crossed the ring since the last beat is stunned ULT_CIRCUIT.stun frames (not a boss).
    // Nothing in reach: the charge is kept. The numbers the agent's, PROVISIONAL.
    electroskink: { name: "Lightning Circuit", desc: "It races a loop round the biggest group of enemies it can see, leaving a ring of lightning: for 5 s the enemies inside are shocked every half second, and one crossing the ring is stunned a moment", execute(actor) {
        const C = ULT_CIRCUIT, foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(actor.x, actor.y, C.reach) : [];
        if (!foes.length) return;
        actor.ultimateCharge = 0;
        let best = foes[0], bn = -1, bd = Infinity;   // the biggest group (most enemies within 2 tiles), the nearer on a tie
        for (const a of foes) { const n = foes.filter(b => Math.hypot(b.x - a.x, b.y - a.y) <= 2).length, d = Math.hypot(a.x - actor.x, a.y - actor.y); if (n > bn || (n === bn && d < bd)) { bn = n; bd = d; best = a; } }
        const cx = best.x, cy = best.y, a0 = Math.atan2(actor.y - cy, actor.x - cx), path = [];
        for (let n = 0; n <= C.loop; n++) { const t = a0 + n / C.loop * Math.PI * 2, px = cx + Math.cos(t) * C.radius, py = cy + Math.sin(t) * C.radius; if (typeof facilityStandOk !== "function" || facilityStandOk(px, py)) path.push([px, py]); }
        spawnElementEffect({ type: "skinkloop", x: actor.x, y: actor.y, on: actor, path, i: 0, cx, cy, life: path.length + 2, maxLife: path.length + 2, element: "electric" });
        _ultSay(actor, "LIGHTNING CIRCUIT", "#fff27a");
    } },
};
// The Ultimate a follower fires: its form's own (null: an unevolved follower, a form without its own)
// BLOOM's MEND (docs/CONVERSION.md §2, "Its status, MEND"; build 2026-11-08i): every hit a BLOOM follower lands heals the most hurt of your followers within 4 tiles by 2% of that one's maximum
// health (js/helpers.js applyDamage calls it). "The most hurt": the lowest share of its health left; the BLOOM follower itself counts, being one of yours (the agent's reading of the approved
// words, confirmed by the owner 2026-11-08: "Your calls were correct"). A follower at full health is passed over; none hurt nearby, no heal.
const ELEMENT_MEND = { radius: 4, share: 0.02 };
// BLOOM's Pack 1 picks (build 2026-11-09a): SAP VEIN and NECTAR HEART make each MEND of the one wearing them heal more, and DEWBURST gives each its chance to heal three times as much, with a burst of pink
// dew (their numbers: bloomMendMult). `opts`: { any } a MEND from one that is not BLOOM (EVERBLOOM CROWN's extra, HERBALIST's clone), { mult } a MEND made bigger (DEWBURST set by ATTUNED CORE).
// The player's own strikes in a BLOOM role's element (a punch, an arc, a lash: their source is BLOOM and yours) MEND nothing by themselves: what a role mends is what its kit says (the roles' own code).
function elementMend(src, opts) {
    const any = !!(opts && opts.any);
    if (!src || src.dead || (!any && (src.element !== "blossom" || src.isPlayer)) || src.team !== "green" || typeof followers === "undefined") return 0;
    let best = null, low = 1;
    for (const a of followers) {
        if (!a || a.dead || a.team !== "green" || !(a.maxHealth > 0) || !(a.health < a.maxHealth)) continue;
        if (Math.hypot(a.x - src.x, a.y - src.y) > ELEMENT_MEND.radius) continue;
        const k = a.health / a.maxHealth; if (k < low) { low = k; best = a; }
    }
    if (!best || typeof healUnit !== "function") return 0;
    let mult = (opts && opts.mult > 0) ? opts.mult : 1, dew = mult > 1;
    if (!any && typeof bloomMendMult === "function") { const m = bloomMendMult(src); mult *= m.k; dew = dew || m.dew; }
    if (dew && typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: best.x, y: best.y, color: "#ffd3e8", radius: 0.8, life: 18 });   // (DEWBURST: a burst of pink dew)
    return healUnit(best, best.maxHealth * ELEMENT_MEND.share * mult, src);
}
// A follower's Ultimate: its evolved form's own, or null (an unevolved follower has none; nor has a flagged form: build 2026-11-09b)
function followerUltimate(a) { return a && a.evolved && FORM_ULTIMATES[a.evolved] && (typeof energyUltOpen !== "function" || energyUltOpen(a)) ? FORM_ULTIMATES[a.evolved] : null; }   // (its ENERGY, js/energy.js: a follower's Ultimate is locked until its slots hold two of its own element)
function followerUltLocked(a) { return !!(a && a.evolved && FORM_ULTIMATES[a.evolved] && typeof energyUltOpen === "function" && !energyUltOpen(a)); }   // (it has one, locked: its INFO says what opens it)
// FLAGGED (build 2026-11-09b; the owner: "flag every single creature that's evolved and does not have an ultimate"): an evolved form with no Ultimate of its own yet. It has none until its own is designed:
// no meter on its card, nothing fired, "NOT DESIGNED YET" on its INFO card (js/unitinfo.js). Since build 2026-11-09c no current form is (the Electro Skink has LIGHTNING CIRCUIT), and the retired forms kept
// for old saves never get one ("No, leave them"): they have no Ultimate and are not flagged.
function followerUltPending(a) { return !!(a && a.evolved && !FORM_ULTIMATES[a.evolved] && !(typeof EVOLUTIONS !== "undefined" && EVOLUTIONS[a.evolved] && EVOLUTIONS[a.evolved].legacy)); }   // (a retired form kept for old saves is not pending: it never gets one, the owner: "No, leave them", build 2026-11-09c)
// does its meter fill? only with an Ultimate to fire (an unevolved follower's and a flagged form's stays where it is: build 2026-11-09b)
function followerUltCharges(a) { return !!followerUltimate(a); }
function formUltPending(id) { return !!id && typeof EVOLUTIONS !== "undefined" && !!EVOLUTIONS[id] && !EVOLUTIONS[id].legacy && !FORM_ULTIMATES[id]; }
// FIRE A FOLLOWER'S ULTIMATE NOW (build 2026-11-07ss; the owner: "access to use them"): its squad card's ULTIMATE (js/party.js) and a double-tap on it (js/input.js) both come here. True when one went off
// (its charge spent); an Ultimate that found nothing to act on (no enemy for an eruption) keeps its charge. (A bonded pair's DUO is gone since build 2026-11-09b: a bond is for breeding: js/bonds.js.)
function followerUltFire(f) {
    if (!f || f.dead || !(f.ultimateCharge >= 100)) return false;
    const u = followerUltimate(f); if (!u) return false;
    u.execute(f);
    return !(f.ultimateCharge >= 100);
}
// A hit on a follower wearing a jelly shield (js/helpers.js applyDamage): the shield takes it first, up to what it has left, and knocks the attacker back. Returns what is left of the hit.
function jellyShieldTake(t, dmg, source) {
    const S = t.jellyShield, f0 = typeof frame !== "undefined" ? frame : 0;
    if (!S || f0 >= S.until || !(S.hp > 0)) { t.jellyShield = null; return dmg; }
    const take = Math.min(S.hp, dmg); S.hp -= take; if (S.hp <= 0) t.jellyShield = null;
    const src = source && typeof predatorSource === "function" ? predatorSource(source) : source;
    if (src && src !== t && src.team !== t.team && Number.isFinite(src.x) && typeof applyKnockback === "function") applyKnockback(src, t, ULT_JELLY.knock * KNOCK_PER_TILE);
    return dmg - take;
}
function _ultSegDist(p, a, b) { const dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy || 1; let t = ((p.x - a[0]) * dx + (p.y - a[1]) * dy) / L2; t = Math.max(0, Math.min(1, t)); return Math.hypot(p.x - (a[0] + dx * t), p.y - (a[1] + dy * t)); }

// ─────────────────────────────────────────────────────────
//  ELEMENT EFFECTS POOL (visual + lingering)
// ─────────────────────────────────────────────────────────
let elementEffects = [];

let DEBUG_PREDATOR = false;   // (js/draw.js: a creature's facing and reach drawn over it)

function spawnElementEffect(effect) {
    elementEffects.push({ ...effect, currentRadius: 0 });
}
// An effect made during the effects' own update (updateElementEffects rebuilds the list with a filter: one pushed onto it then is lost): held here and added once the update is done (build 2026-11-09c,
// LIGHTNING CIRCUIT's ring and sparks)
let _fxLater = [];
function fxLater(effect) { _fxLater.push({ ...effect, currentRadius: 0 }); }

// ── THE EFFECT BUDGET (Conduit effects plan, rule 5) ─────
// Clouds of the same kind within a tile merge (the newer refreshes the older);
// and never more than FX_MAX alive — the oldest short-lived ones go first, the
// long area effects are kept.
const FX_MAX = 80;
const FX_CLOUD_MAX = 12;
const FX_LONG = { circuit: 1, flameCrater: 1, hexfire: 1, maelstrom: 1, staticVortex: 1, faultTrace: 1, seedfall: 1, thicket: 1 };   // (HEXFIRE's circle and STATIC VORTEX are play, not show; FAULTLINE's path is its telegraph: never dropped for the budget)
function fxTidy() {
    if (!elementEffects.length) return;
    const keep = [], clouds = [];
    for (let i = elementEffects.length - 1; i >= 0; i--) {   // newest first
        const e = elementEffects[i];
        if (e.type === "toxicCloud" || e.type === "smoke") {
            const twin = clouds.find(c => c.type === e.type && Math.abs(c.x - e.x) < 1 && Math.abs(c.y - e.y) < 1);
            if (twin) { twin.life = Math.max(twin.life, e.life); continue; }
            if (clouds.length >= FX_CLOUD_MAX) continue;
            clouds.push(e);
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
                        applyElementalDamage(a, dmg*(1-d*0.1), caster, "fire", DMG_HIT_SPECIAL);
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

        // HEXFIRE's circle and STATIC VORTEX (js/evolution.js; the follower combat redesign): stationary fields that hurt enemies only. The circle bites every HALO_TICK frames (it bit once as it
        // landed); the vortex pulls every frame and bites every VORTEX_TICK.
        if (e.type === "hexfire") { const age = e.maxLife - e.life; if (age > 0 && e.life > 0 && age % HALO_TICK === 0 && typeof fieldBite === "function") fieldBite(e, "fire"); }
        if (e.type === "mawchomp" && typeof mawChompTick === "function") mawChompTick(e);   // (the Frost Maw's CHOMP: js/evolution.js)
        if (e.type === "mimicshot" && typeof mimicShotTick === "function") mimicShotTick(e);   // (the Rift Mimic's everyday hit: js/evolution.js)
        if (e.type === "skinkswirl" && typeof skinkSwirlTick === "function") skinkSwirlTick(e);   // (the Electro Skink's everyday hit: js/evolution.js)
        if (e.type === "seedfall") { const age = e.maxLife - e.life; if (age > 0 && e.life > 0 && age % SEEDFALL_TICK === 0 && typeof seedfallBeat === "function") seedfallBeat(e); }   // (SEEDFALL: js/evolution.js)
        if (e.type === "magmavent") { const age = e.maxLife - e.life; if (age > 0 && e.life > 0 && age % MAGMA_TICK === 0 && typeof fieldBite === "function") { fieldBite(e, "fire"); e.burstAt = age; } }   // (a burst a second: js/evolution.js magmaVent)
        if (e.type === "staticVortex" && typeof staticVortexTick === "function") staticVortexTick(e);
        if (e.type === "maelstrom") { const age = e.maxLife - e.life; if (age > 0 && e.life > 0 && age % MAEL_TICK === 0 && typeof maelstromBeat === "function") maelstromBeat(e); }   // (the Voidstar's MAELSTROM: js/evolution.js)
        // the own Ultimates' fields (FORM_ULTIMATES above): ABSOLUTE ZERO holds what it swallowed inside the Frost Maw, then lets it go round it; CONTAMINATION NETWORK bites what touches a strand
        // CONSUME (FORM_ULTIMATES.sundew): SUNDEW holds its catch inside it, bites it every ULT_CONSUME.tick frames (the catch is untargetable: the bite lets itself through), and spits it out
        // in front of it when its time is up, or at once if SUNDEW falls; a catch that dies inside is gone
        if (e.type === "thicket") { const age = e.maxLife - e.life; if (age > 0 && e.life > 0 && age % ULT_THICKET.tick === 0 && typeof thicketBeat === "function") thicketBeat(e); }   // (PINK THICKET's beat)
        if (e.type === "consume") {
            const by = e.by, prey = e.held[0], age = e.maxLife - e.life, gone = !by || by.dead;
            if (by && !by.dead) { e.x = by.x; e.y = by.y; }
            if (prey && !prey.dead && !gone) {   // (its last bite lands as its time runs out: five in its 5 s)
                prey.x = e.x; prey.y = e.y; prey.stunned = Math.max(prey.stunned || 0, 2);
                if (age > 0 && age % ULT_CONSUME.tick === 0) { prey.untargetable = false; applyDamage(prey, (by.power || 10) * ULT_CONSUME.mult, by, "blossom", false, false, DMG_HIT_SPECIAL); if (!prey.dead) prey.untargetable = true; }
            }
            if (e.life <= 0 || gone || !prey || prey.dead) {
                if (prey && !prey.dead) {   // (spat out in front of it)
                    const fx = by ? (by.dirX || 0) : 0, fy = by ? (by.dirY || 1) : 1, Lf = Math.hypot(fx, fy) || 1, c = typeof _fpNearestCellOpen === "function" ? _fpNearestCellOpen(e.x + fx / Lf * 1.1, e.y + fy / Lf * 1.1) : null;
                    prey._swallowedBy = null; prey.untargetable = false; prey.stunned = 0; if (c) { prey.x = c[0]; prey.y = c[1]; } else { prey.x = e.x + fx / Lf * 1.1; prey.y = e.y + fy / Lf * 1.1; }
                } else if (prey) { prey._swallowedBy = null; }
                if (by && by._consume) by._consume = null;
                e.life = 0;
            }
        }
        if (e.type === "abszero") {
            const by = e.by, done = e.life <= 0 || !by || by.dead;
            if (by && !by.dead) { e.x = by.x; e.y = by.y; }
            e.held.forEach((a, i) => {
                if (!a || a.dead) return;
                if (!done) { a.x = e.x; a.y = e.y; a.stunned = Math.max(a.stunned || 0, 2); return; }
                const an = i / Math.max(1, e.held.length) * Math.PI * 2, c = typeof _fpNearestCellOpen === "function" ? _fpNearestCellOpen(e.x + Math.cos(an) * 1.2, e.y + Math.sin(an) * 1.2) : null;
                a._swallowedBy = null; a.untargetable = false; a.stunned = 0; if (c) { a.x = c[0]; a.y = c[1]; } else { a.x = e.x + Math.cos(an) * 1.2; a.y = e.y + Math.sin(an) * 1.2; }
            });
            if (done) e.life = 0;
        }
        if (e.type === "shardvortex") {
            const V = ULT_VORTEX, age = e.maxLife - e.life, bite = age > 0 && e.life > 0 && age % V.tick === 0;
            for (const a of actors) {
                if (!a || a.dead || !isHostileTarget(a)) continue;
                const dx = e.x - a.x, dy = e.y - a.y, d = Math.hypot(dx, dy); if (d > e.radius || (typeof _evoSees === "function" && !_evoSees(e.x, e.y, a))) continue;
                if (d > 0.3 && !(typeof vortexPullImmune === "function" && vortexPullImmune(a))) { const v = Math.min(V.pull, d - 0.3); if (Math.hypot(a.kbVX || 0, a.kbVY || 0) < v) { a.kbVX = dx / d * v; a.kbVY = dy / d * v; } }
                if (bite) { const h0 = a.health; applyDamage(a, e.bite, e.by || null, null, false, false, DMG_HIT_ULT_CRUSH); const by = e.by; if (by && !by.dead && h0 > a.health) by.health = Math.min(by.maxHealth || by.health, by.health + (h0 - a.health) * V.heal); }
            }
        }
        if (e.type === "toxicpuddle") {
            const P = ULT_PUDDLE, age = e.maxLife - e.life;
            e.radius = P.from + (P.radius - P.from) * Math.min(1, age / P.grow);
            if (age > 0 && e.life > 0 && age % P.tick === 0) {
                e.shards = []; e.shardAt = age;
                for (const a of actors) {
                    if (!a || a.dead || !isHostileTarget(a) || Math.hypot(a.x - e.x, a.y - e.y) > e.radius || (typeof _evoSees === "function" && !_evoSees(e.x, e.y, a))) continue;
                    applyDamage(a, e.bite, e.by || null, "toxic", false, false, DMG_HIT_SPECIAL); if (typeof applyWeaken === "function") applyWeaken(a, P.poison);
                    e.shards.push([a.x, a.y]);
                }
            }
        }
        if (e.type === "whiteout") {   // (the Rime Star's Ultimate: moves with it; slows and bites the enemies in it)
            const o = e.on; if (!o || o.dead) e.life = 0;
            else { e.x = o.x; e.y = o.y; const W = ULT_WHITEOUT, age = e.maxLife - e.life, bite = age > 0 && e.life > 0 && age % W.tick === 0;
                for (const a of actors) { if (!a || a.dead || !isHostileTarget(a) || Math.hypot(a.x - e.x, a.y - e.y) > e.radius) continue; if (typeof applySlow === "function") applySlow(a, 20, W.slow); if (bite) applyDamage(a, e.bite, o, "ice", false, false, DMG_HIT_SPECIAL); } }
        }
        if (e.type === "icerink") {   // (the Igloo Skater's Ultimate: stays put; slows and bites the enemies on it, speeds the squad on it)
            const R = ULT_RINK, age = e.maxLife - e.life, bite = age > 0 && e.life > 0 && age % R.tick === 0, f0 = typeof frame !== "undefined" ? frame : 0;
            for (const a of actors) {
                if (!a || a.dead || Math.hypot(a.x - e.x, a.y - e.y) > e.radius) continue;
                if (a.isFollower === true && a.team === "green") { if (!(a._voltUntil > f0 && (a._voltMove || 1) >= R.fast)) { a._voltUntil = f0 + 2; a._voltMove = R.fast; a._voltAtk = 1; } }   // (a voltage field as fast or faster is left as it is)
                else if (isHostileTarget(a)) { if (typeof applySlow === "function") applySlow(a, 20, R.slow); if (bite) applyDamage(a, e.bite, e.by, "ice", false, false, DMG_HIT_SPECIAL); }
            }
        }
        if (e.type === "wavemaker") {   // (the Hornshell's Ultimate: a wave every ULT_WAVE.every frames; between them it moves up after the enemies it threw, onto floor only)
            const W = ULT_WAVE, o = e.on; if (!o || o.dead) e.life = 0;
            else { const age = e.maxLife - e.life;
                if (e.fired < W.waves) {
                    if (age >= e.fired * W.every) _ultWave(e);
                    else { const nx = o.x + e.dx * W.step / W.every, ny = o.y + e.dy * W.step / W.every; if (typeof facilityStandOk !== "function" || facilityStandOk(nx, ny)) { o.x = nx; o.y = ny; o._fpPath = null; } }
                }
                e.x = o.x; e.y = o.y; }
        }
        if (e.type === "hoverdrift") {   // (the Hover Shell's Ultimate: a point of its oval a frame, a slash at every enemy within the blade's reach once, then home at its post)
            const o = e.on; if (!o || o.dead) e.life = 0;
            else if (e.i >= e.path.length) { o.x = e.home[0]; o.y = e.home[1]; o._fpPath = null; e.life = 0; }
            else {
                const p = e.path[e.i++], px0 = o.x, py0 = o.y; o.x = p[0]; o.y = p[1]; o._fpPath = null; o.dirX = o.x - px0; o.dirY = o.y - py0;
                for (const a of _evoFoesSeen(o.x, o.y, ULT_DRIFT.cut)) if (e.hit.indexOf(a) < 0) { e.hit.push(a); _ultDriftSlash(o, a); }
                e.x = o.x; e.y = o.y;
            }
        }
        if (e.type === "skinkloop") {   // (the Electro Skink's LIGHTNING CIRCUIT: a point of its loop a frame, a spark where it runs, then the ring where the group was)
            const o = e.on; if (!o || o.dead) e.life = 0;
            else if (e.i >= e.path.length) {
                o._fpPath = null; e.life = 0;
                fxLater({ type: "circuit", x: e.cx, y: e.cy, radius: ULT_CIRCUIT.radius, by: o, bite: (o.power || 10) * ULT_CIRCUIT.mult, inside: [], near: [], life: ULT_CIRCUIT.frames, maxLife: ULT_CIRCUIT.frames, element: "electric" });
            } else {
                const p = e.path[e.i++], px0 = o.x, py0 = o.y; o.x = p[0]; o.y = p[1]; o._fpPath = null; o.dirX = o.x - px0; o.dirY = o.y - py0; e.x = o.x; e.y = o.y;
                if (e.i % 3 === 0) fxLater({ type: "impact", x: o.x, y: o.y, color: "#fff27a", radius: 0.35, life: 12 });
            }
        }
        if (e.type === "circuit") {   // (LIGHTNING CIRCUIT's ring: a beat every ULT_CIRCUIT.tick frames: a shock for each enemy inside, a stun for one that has crossed the ring since the last beat)
            const C = ULT_CIRCUIT, age = e.maxLife - e.life;
            if (age > 0 && e.life > 0 && age % C.tick === 0) {
                const near = typeof _evoFoesSeen === "function" ? _evoFoesSeen(e.x, e.y, e.radius + 1.5) : [], inside = [];
                for (const a of near) {
                    const isIn = Math.hypot(a.x - e.x, a.y - e.y) <= e.radius;
                    if (isIn) { inside.push(a); applyDamage(a, e.bite, e.by || null, "electric", false, false, DMG_HIT_SPECIAL); }
                    if (e.near.indexOf(a) >= 0 && (e.inside.indexOf(a) >= 0) !== isIn && !a.dead && !(a.bossId || a.bossName || a.isBoss) && typeof applyStun === "function") { applyStun(a, C.stun); fxLater({ type: "impact", x: a.x, y: a.y, color: "#ffffaa", radius: 0.6, life: 16 }); }
                }
                e.inside = inside; e.near = near.filter(a => !a.dead);
            }
        }
        if (e.type === "thunderstorm") {   // (the Thunderhead's Ultimate: moves with it, a bolt each tick on a random enemy under it)
            const o = e.on; if (!o || o.dead) e.life = 0;
            else { e.x = o.x; e.y = o.y; const age = e.maxLife - e.life;
                if (age > 0 && e.life > 0 && age % ULT_STORM.tick === 0) { const foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(e.x, e.y, e.radius) : []; if (foes.length) { const t = foes[Math.floor(Math.random() * foes.length)]; applyDamage(t, e.bite, o, "electric", false, false, DMG_HIT_SPECIAL); e.bolt = [t.x, t.y]; e.boltAt = age; } } }
        }
        if (e.type === "eventhorizon") {   // (the Void Star's Ultimate: drags in, crushes)
            const H = ULT_HORIZON, age = e.maxLife - e.life, bite = age > 0 && e.life > 0 && age % H.tick === 0;
            for (const a of actors) {
                if (!a || a.dead || !isHostileTarget(a)) continue;
                const dx = e.x - a.x, dy = e.y - a.y, d = Math.hypot(dx, dy); if (d > e.radius || (typeof _evoSees === "function" && !_evoSees(e.x, e.y, a))) continue;
                if (d > 0.3 && !(typeof vortexPullImmune === "function" && vortexPullImmune(a))) { const v = Math.min(H.pull, d - 0.3); if (Math.hypot(a.kbVX || 0, a.kbVY || 0) < v) { a.kbVX = dx / d * v; a.kbVY = dy / d * v; } }
                if (bite) applyDamage(a, e.bite, e.by || null, null, false, false, DMG_HIT_ULT_CRUSH);
            }
        }
        if (e.type === "voltagefield") {   // (a card attack's field, cardAttackTry: it moves with its maker, marks the followers in it, bites the enemies in it)
            const o = e.on;
            if (!o || o.dead) e.life = 0;
            else {
                e.x = o.x; e.y = o.y;
                const age = e.maxLife - e.life, bite = age > 0 && e.life > 0 && age % e.every === 0, f0 = typeof frame !== "undefined" ? frame : 0;
                for (const a of actors) {
                    if (!a || a.dead || Math.hypot(a.x - e.x, a.y - e.y) > e.radius) continue;
                    if (a.isFollower === true && a.team === "green") { a._voltUntil = f0 + 2; a._voltMove = e.move; a._voltAtk = e.atk; }
                    else if (bite && isHostileTarget(a) && (typeof _evoSees !== "function" || _evoSees(e.x, e.y, a))) applyDamage(a, e.bite, o, "electric", false, false, DMG_HIT_SPECIAL);
                }
            }
        }
        if (e.type === "rotdecoy") { const d = e.on; if (!d || d.dead) e.life = 0; }
        if (e.type === "gooproxy") { const d = e.on; if (!d || d.dead) e.life = 0; }   // (a PROXY SWARM copy: drawn while it stands)   // (a ROTTEN DECOY: drawn while it stands)
        if (e.type === "wraithfire") { const w = e.on; if (!w || w.dead || !w._wraith) e.life = 0; else { e.x = w.x; e.y = w.y; } }
        if (e.type === "jellyshield") { const w = e.on; if (!w || w.dead || !w.jellyShield) e.life = 0; else { e.x = w.x; e.y = w.y; } }
        if (e.type === "toxicnet") {
            const age = e.maxLife - e.life;
            if (age > 0 && e.life > 0 && age % ULT_NETWORK.tick === 0) for (const a of actors) {
                if (!a || a.dead || !isHostileTarget(a)) continue;
                if (e.segs.some(s => _ultSegDist(a, s[0], s[1]) <= ULT_NETWORK.touch)) { applyDamage(a, e.bite, e.by || null, "toxic", false, false, DMG_HIT_SPECIAL); if (typeof applyWeaken === "function") applyWeaken(a, ULT_NETWORK.poison); }
            }
        }

        return e.life > 0;
    });
    if (_fxLater.length) { for (const e of _fxLater) elementEffects.push(e); _fxLater = []; }   // (made during the update: fxLater)
    fxTidy();
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
            // The Hornshell's ECHO PULSE (js/evolution.js echoPulse): a RING OF WATER rolling out from the jar to the pulse's reach: a low wave with a pale crest, a band of water on its front face, foam and a trailing ripple
            case "waterring": {
                const ep = Math.min(1, 1 - e.life / (e.maxLife || 34)), ee = 1 - (1 - ep) * (1 - ep), rx = Math.max(2, e.radius * ee * TILE_W * 0.5), ry = rx * 0.5, cy = py + TILE_H * 0.6, hh = 11 * (1 - ep) + 2, fa = alpha * (1 - ep * ep);
                ctx.save(); ctx.lineCap = "round";
                ctx.globalAlpha = fa * 0.4; ctx.fillStyle = "#2f8fe0"; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI); ctx.ellipse(px, cy - hh, rx, ry, 0, Math.PI, 0, true); ctx.closePath(); ctx.fill();   // (the wave's front face, between its foot and its crest)
                ctx.globalAlpha = fa * 0.5; ctx.strokeStyle = "#5fd0ff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();   // (its foot on the floor)
                ctx.globalAlpha = fa * 0.9; ctx.strokeStyle = "#eaffff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(px, cy - hh, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();   // (its crest)
                ctx.globalAlpha = fa * 0.45; ctx.strokeStyle = "#8fe0ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, cy, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2); ctx.stroke();   // (a ripple behind it)
                ctx.globalAlpha = fa; ctx.fillStyle = "#ffffff";
                for (let i = 0; i < 16; i++) { const an = i * Math.PI / 8 + ep * 0.7, fx = px + Math.cos(an) * rx, fy = cy - hh - (2 + 5 * Math.abs(Math.sin(i * 2.3 + ep * 6))) * (1 - ep) + Math.sin(an) * ry; ctx.beginPath(); ctx.arc(fx, fy, 1.6 + 0.8 * ((i * 7) % 3), 0, Math.PI * 2); ctx.fill(); }   // (foam and spray along the crest)
                ctx.restore(); break;
            }
            // The Voidstar's MAELSTROM (js/evolution.js maelstrom): a small swirl of purple crystals on the floor where it opened: a dark violet disc and ring, three spiral arms of crystals turning in it, and crystals
            // thrown out all round on arcs, a new one in a new direction every throw; it grows as it opens and fades as it ends. Flat shapes only (the effects plan, docs/EFFECTS.md).
            case "maelstrom": {
                const age = e.maxLife - e.life, grow = Math.min(1, age / 12), fade = Math.min(1, e.life / 24), R = e.radius * TILE_W * 0.5 * (0.4 + 0.6 * grow), cy = py + TILE_H * 0.6;
                ctx.save();
                ctx.globalAlpha = 0.45 * fade; ctx.fillStyle = '#1c0b3a'; ctx.beginPath(); ctx.ellipse(px, cy, R * 1.05, R * 0.53, 0, 0, Math.PI * 2); ctx.fill();   // (the floor under it)
                ctx.globalAlpha = 0.8 * fade; ctx.strokeStyle = '#7a3ee0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, cy, R, R * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.globalAlpha = 0.45 * fade; ctx.strokeStyle = '#b985ff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(px, cy, R * 0.6, R * 0.3, 0, 0, Math.PI * 2); ctx.stroke();
                const gem = (x, y, w, h, rot, fill, hi, a) => { const c = Math.cos(rot), sn = Math.sin(rot), P = [[0, -h], [w, 0], [0, h], [-w, 0]].map(q => [x + q[0] * c - q[1] * sn, y + q[0] * sn + q[1] * c]);
                    ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(P[i][0], P[i][1]); ctx.closePath(); ctx.fill();
                    ctx.fillStyle = hi; ctx.beginPath(); ctx.moveTo(P[0][0], P[0][1]); ctx.lineTo(P[1][0], P[1][1]); ctx.lineTo(x, y); ctx.closePath(); ctx.fill(); };   // (a crystal: a diamond and a lit facet)
                const COL = [['#5a25b0', '#8a45f0'], ['#8a45f0', '#c99bff'], ['#b985ff', '#f1e3ff']];
                for (let arm = 0; arm < 3; arm++) for (let j = 0; j < 6; j++) {   // (the arms turning in it)
                    const an = arm * Math.PI * 2 / 3 + j * 0.62 + age * 0.17, rd = R * (0.14 + 0.13 * j), C = COL[(arm + j) % 3];
                    gem(px + Math.cos(an) * rd, cy + Math.sin(an) * rd * 0.5 - 2 - j * 0.7, 2.2 + 0.35 * j, 3 + 0.45 * j, an + 1.2, C[0], C[1], 0.95 * fade); }
                const N = 12, P = 34;
                for (let i = 0; i < N; i++) {   // (crystals thrown out all round, each on an arc)
                    const ph = age + i * P / N, n = Math.floor(ph / P), u = (ph % P) / P, an = i * 2.4 + n * 1.3 + Math.sin(i * 3.1 + n) * 0.6, dist = R * (0.12 + 1.45 * u), h = Math.sin(Math.PI * u) * 30, C = COL[(i + n) % 3];
                    gem(px + Math.cos(an) * dist, cy + Math.sin(an) * dist * 0.5 - h - 3, 3.3 - 0.8 * u, 6.5 - 1.5 * u, an + u * 6, C[0], C[1], Math.max(0, 1 - u * u) * fade); }
                gem(px, cy - 4, 4, 8 + Math.sin(age * 0.3), age * 0.2, '#2a0f55', '#8a45f0', fade);   // (its middle)
                ctx.restore(); break;
            }
            case "mimicshot": { if (typeof mimicShotDraw === "function") mimicShotDraw(e, px, py, ctx); break; }   // (js/evolution.js)
            case "skinkswirl": { if (typeof skinkSwirlDraw === "function") skinkSwirlDraw(e, px, py, ctx); break; }   // (js/evolution.js)
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
            // HEXFIRE's circle (js/evolution.js hexfireCircle): a disc of floor HALO_RADIUS tiles round, burning, that never grows or moves: a glow, its edge, a hexagon of fire turning slowly in it,
            // flames standing on its edge. (A circle on the floor is an ellipse on screen, its radius √2 tiles across each screen axis.)
            // LIGHTNING CIRCUIT's ring (build 2026-11-09c; a plain look for now, to be designed "with 3-D flare"): a faint yellow disc on the floor and a crackling ring at its edge, its zig-zag redrawn every
            // few frames; brighter on a beat. (A circle on the floor is an ellipse on screen, its radius √2 tiles across each screen axis.)
            case "circuit": {
                const k = Math.min(1, (e.maxLife - e.life) / 10, e.life / 20), R = e.radius, rx = R * 1.4142 * TILE_W, ry = R * 1.4142 * TILE_H, cy = py + TILE_H;
                const beat = ((e.maxLife - e.life) % ULT_CIRCUIT.tick) < 6, seed = Math.floor(frame / 3);
                ctx.globalAlpha = (beat ? 0.2 : 0.1) * k; ctx.fillStyle = "#fff27a";
                ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
                for (const [w, col, al] of [[4, "#ffee33", 0.35], [1.6, "#ffffe6", 0.95]]) {
                    ctx.globalAlpha = al * k * (beat ? 1 : 0.75); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath();
                    for (let i = 0; i <= 36; i++) { const an = i / 36 * Math.PI * 2, j = i % 36 ? (((Math.sin((i + seed) * 12.9898) * 43758.5) % 1 + 1) % 1 - 0.5) * 0.18 : 0, hx = px + Math.cos(an) * rx * (1 + j), hy = cy + Math.sin(an) * ry * (1 + j); if (i) ctx.lineTo(hx, hy); else ctx.moveTo(hx, hy); }
                    ctx.stroke();
                }
                break;
            }
            // HEXFIRE's circle is a POOL OF LAVA on the floor (build 2026-11-12h): drawn tile by tile in the floor's pass (drawHexfireOnTile, below), so walls and units in front cover it
            case "hexfire": break;
            // SEEDFALL's circle and seeds lie on the floor: drawn tile by tile in the floor's pass (drawSeedfallOnTile, below), so walls and units in front cover them
            case "seedfall": break;
            case "thicket": break;   // (PINK THICKET's bushes and aura lie on the floor too: drawThicketOnTile)
            // CONTAMINATION NETWORK (FORM_ULTIMATES): glowing toxic strands between its pods, a pulse running along them
            case "toxicnet": {
                const k = Math.min(1, (e.maxLife - e.life) / 10, e.life / 20), cy0 = py + TILE_H, S = (x, y) => [px + ((x - e.x) - (y - e.y)) * TILE_W, cy0 + ((x - e.x) + (y - e.y)) * TILE_H];
                for (const s of e.segs) {
                    const a = S(s[0][0], s[0][1]), b = S(s[1][0], s[1][1]);
                    ctx.globalAlpha = 0.35 * k; ctx.strokeStyle = "#7dff4a"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
                    ctx.globalAlpha = 0.9 * k; ctx.strokeStyle = "#d6ff9a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
                    const t = (frame % 40) / 40; ctx.fillStyle = "#ffffff"; ctx.globalAlpha = k; ctx.beginPath(); ctx.arc(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 3, 0, Math.PI * 2); ctx.fill();
                }
                break;
            }
            // SHARD VORTEX (FORM_ULTIMATES): a violet swirl with four crystal shards spinning round its middle
            case "shardvortex": {
                const k = Math.min(1, (e.maxLife - e.life) / 10, e.life / 20), R = e.radius, rx = R * 1.4142 * TILE_W, ry = R * 1.4142 * TILE_H, cy = py + TILE_H, spin = frame * 0.14;
                ctx.globalAlpha = 0.14 * k; ctx.fillStyle = "#a070ff"; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.5 * k; ctx.strokeStyle = "#c9a6ff"; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(px, cy, rx * (0.4 + i * 0.25), ry * (0.4 + i * 0.25), 0, spin + i, spin + i + 2.4); ctx.stroke(); }
                // ITS OWN BLACK BLADES, WHIRLING LIKE A HURRICANE (js/fx3d.js vortexshard; the owner, 2026-11-09: "the shards are supposed to go sideways and sort of whirl about ... all in different orientations,
                // but they're spinning around like a hurricane"): the Rift Mimic's four shards fly round the middle each at its own distance, height and speed (SHARD_WHIRL), drifting in and out and up and down,
                // each tumbling about its own axis; each over its shadow on the floor, the farthest drawn first. Else the drawn pale diamonds.
                const V3 = typeof fx3dOn === "function" && fx3dOn("vortexshard") && fx3dReady("vortexshard") ? FX3D.pieces.vortexshard : null;
                if (V3) { const t = frame, list = SHARD_WHIRL.map((s, i) => { const an = s.a0 + t * s.w, rr = s.r + 0.1 * Math.sin(t * 0.045 + i * 1.7), up = s.h + 7 * Math.sin(t * 0.07 + i * 2.3);
                        return { sx: px + Math.cos(an) * rx * rr, fy: cy + Math.sin(an) * ry * rr, up, row: s.row, col: Math.floor(t * s.tw + i * 5) }; }).sort((a, b) => a.fy - b.fy);
                    for (const o of list) { ctx.globalAlpha = 0.28 * k; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(o.sx, o.fy, Math.max(3, 8 - o.up * 0.09), Math.max(1.2, 3 - o.up * 0.035), 0, 0, Math.PI * 2); ctx.fill();   // (its shadow)
                        ctx.globalAlpha = k; fx3dDrawCell(ctx, "vortexshard", o.sx, o.fy - o.up, o.col, o.row); } }
                else for (let i = 0; i < 4; i++) { const an = spin + i * Math.PI / 2, sx = px + Math.cos(an) * rx * 0.6, sy = cy + Math.sin(an) * ry * 0.6 - 10; ctx.globalAlpha = 0.95 * k; ctx.fillStyle = "#e6d6ff"; ctx.beginPath(); ctx.moveTo(sx, sy - 9); ctx.lineTo(sx + 5, sy); ctx.lineTo(sx, sy + 9); ctx.lineTo(sx - 5, sy); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "#7a4adf"; ctx.lineWidth = 1; ctx.stroke(); }
                break;
            }
            // THE ROTSHARD'S PUDDLE (FORM_ULTIMATES.rotshard): a green puddle growing on the floor, bubbles in it; each eruption throws up a cluster of three small black crystal shards in green haze under each enemy it bites
            case "toxicpuddle": {
                const k = Math.min(1, (e.maxLife - e.life) / 10, e.life / 20), R = e.radius, rx = R * 1.4142 * TILE_W, ry = R * 1.4142 * TILE_H, cy0 = py + TILE_H;
                // with the modelled black spikes (js/fx3d.js rotspike), no green disc or rim: only its spikes and its bubbles where it bites (the owner, 2026-11-09: "Remove [the] green space")
                if (!(typeof fx3dOn === "function" && fx3dOn("rotspike") && fx3dReady("rotspike"))) {
                    ctx.globalAlpha = 0.3 * k; ctx.fillStyle = "#3f9a1f"; ctx.beginPath(); ctx.ellipse(px, cy0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.globalAlpha = 0.6 * k; ctx.strokeStyle = "#7dff4a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(px, cy0, rx, ry, 0, 0, Math.PI * 2); ctx.stroke(); }
                ctx.fillStyle = "#b8ff8a"; for (let i = 0; i < 5; i++) { const an = i * 2.4 + e.x, t = (frame * 0.02 + i * 0.37) % 1; ctx.globalAlpha = (1 - t) * 0.7 * k; ctx.beginPath(); ctx.arc(px + Math.cos(an) * rx * 0.6, cy0 + Math.sin(an) * ry * 0.6, 1.5 + t * 2.5, 0, Math.PI * 2); ctx.fill(); }
                const since = (e.maxLife - e.life) - e.shardAt, b = Math.max(0, 1 - since / 18);
                // (with the modelled black spike its spikes stand among everything else instead: rotSpikeDrawItems, below; here, the drawn ones)
                if (b > 0 && !(typeof fx3dOn === "function" && fx3dOn("rotspike") && fx3dReady("rotspike"))) for (const s of e.shards) _fxRotSpikes(px + ((s[0] - e.x) - (s[1] - e.y)) * TILE_W, cy0 + ((s[0] - e.x) + (s[1] - e.y)) * TILE_H, 16, 6, b * k, Math.min(1, since / 4 + 0.3), s[0] * 3.1 + s[1] * 1.7);
                break;
            }
            // CRYSTAL SPIKE TRIO (a card attack: cardAttackTry): the same cluster, larger, under the enemy it struck: it rises fast and fades
            case "spiketrio": {
                const age = e.maxLife - e.life, k = Math.min(1, e.life / 14);
                _fxRotSpikes(px, py + TILE_H, 28, 9, k, Math.min(1, age / 5 + 0.2), e.x * 3.1 + e.y * 1.7);
                break;
            }
            // SEARED CHARGE (a card attack: cardAttackTry): a streak of fire from where the Quillstone set off to where it struck, and a burst there
            case "searedcharge": {
                const k = e.life / e.maxLife, cy0 = py + TILE_H, ax = px + ((e.x0 - e.x) - (e.y0 - e.y)) * TILE_W, ay = cy0 + ((e.x0 - e.x) + (e.y0 - e.y)) * TILE_H;
                ctx.lineCap = "round"; ctx.globalAlpha = 0.45 * k; ctx.strokeStyle = "#ff4a12"; ctx.lineWidth = 14; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(px, cy0); ctx.stroke();
                ctx.globalAlpha = 0.9 * k; ctx.strokeStyle = "#ffd27a"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(px, cy0); ctx.stroke(); ctx.lineCap = "butt";
                ctx.globalAlpha = k; ctx.fillStyle = "#ffb04a"; ctx.beginPath(); ctx.arc(px, cy0 - 10, 6 + 14 * (1 - k), 0, Math.PI * 2); ctx.fill();
                break;
            }
            // WHITEOUT (FORM_ULTIMATES.rimestar): a pale disc of blowing snow round the Rime Star, flakes streaking across it
            case "whiteout": {
                const k = Math.min(1, (e.maxLife - e.life) / 10, e.life / 20), R = e.radius, rx = R * 1.4142 * TILE_W, ry = R * 1.4142 * TILE_H, cy = py + TILE_H;
                ctx.globalAlpha = 0.22 * k; ctx.fillStyle = "#e6f6ff"; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#ffffff"; for (let i = 0; i < 24; i++) { const u = ((frame * 0.012 + i * 0.137) % 1) * 2 - 1, v = ((i * 0.381) % 1) * 2 - 1; if (u * u + v * v > 1) continue; ctx.globalAlpha = 0.7 * k; ctx.fillRect(px + u * rx, cy + v * ry - 10 - (i % 4) * 6, 3, 1.5); }
                break;
            }
            // ICE RINK (FORM_ULTIMATES.igloo): a pale blue sheet of ice on the floor, its rim frosted, light streaking across it, scratches where skates have been
            case "icerink": {
                const k = Math.min(1, (e.maxLife - e.life) / 10, e.life / 20), R = e.radius, rx = R * 1.4142 * TILE_W, ry = R * 1.4142 * TILE_H, cy = py + TILE_H;
                ctx.globalAlpha = 0.42 * k; ctx.fillStyle = "#a9dcff"; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.8 * k; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.globalAlpha = 0.45 * k; ctx.lineWidth = 1; for (let i = 0; i < 5; i++) { const a0 = i * 1.3 + e.x, r0 = 0.25 + (i % 3) * 0.2; ctx.beginPath(); ctx.ellipse(px, cy, rx * r0, ry * r0, 0, a0, a0 + 1.2); ctx.stroke(); }
                const sh = ((frame * 0.01) % 1) * 2 - 1; ctx.globalAlpha = 0.35 * k; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(px + sh * rx - 20, cy - ry * 0.6); ctx.lineTo(px + sh * rx + 20, cy + ry * 0.6); ctx.stroke();
                break;
            }
            // WAVE MAKER (FORM_ULTIMATES.hornshell): each wave a teal arc rolling out ahead of the Hornshell, white at its crest, fading as it goes
            case "wavemaker": {
                const W = ULT_WAVE, age = e.maxLife - e.life, an = Math.atan2(e.dy, e.dx);
                for (const r of e.rings) {
                    const t = (age - r.at) / 24; if (t < 0 || t > 1) continue;
                    const rad = 0.6 + t * (W.len - 0.6), ox = r.x - e.x, oy = r.y - e.y, pts = [];
                    for (let i = 0; i <= 12; i++) { const th = an - 0.87 + i * 0.145, wx = ox + Math.cos(th) * rad, wy = oy + Math.sin(th) * rad; pts.push([px + (wx - wy) * TILE_W, py + TILE_H + (wx + wy) * TILE_H]); }
                    for (const [w, c, al] of [[7, "#33e6c4", 0.55], [2.5, "#e9fffb", 0.95]]) { ctx.globalAlpha = al * (1 - t); ctx.strokeStyle = c; ctx.lineWidth = w; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); }
                }
                break;
            }
            // DRIFT SLASH (FORM_ULTIMATES.hovershell): a curved sword trail along the last stretch of its oval, thin and faint at its tail, bright at the Hover Shell
            case "hoverdrift": {
                if (!e.path || e.i < 2) break;
                const n0 = Math.max(0, e.i - 12), pts = e.path.slice(n0, e.i).map(q => { const fx = q[0] - e.x, fy = q[1] - e.y; return [px + (fx - fy) * TILE_W, py + TILE_H * 0.4 + (fx + fy) * TILE_H]; });
                for (let k = 1; k < pts.length; k++) { const t = k / (pts.length - 1 || 1);
                    for (const [w, c, al] of [[10 * t + 2, "#ffee33", 0.35 * t], [3 * t + 1, "#ffffff", 0.9 * t]]) { ctx.globalAlpha = al; ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(pts[k - 1][0], pts[k - 1][1]); ctx.lineTo(pts[k][0], pts[k][1]); ctx.stroke(); } }
                break;
            }
            // PROXY SWARM (FORM_ULTIMATES.gooproxy): a copy of the Goo Proxy, a violet goo blob with its two eyes (one far bigger, a thin diamond iris in each) and a wide smile, wobbling; its HP as a bar
            case "gooproxy": {
                const d = e.on, k = Math.min(1, (e.maxLife - e.life) / 8), cy = py + TILE_H * 0.5, wob = Math.sin(frame * 0.15 + e.x) * 1.5;
                // AS THE GOO PROXY IN GOO (js/fx3d.js goocopy; the owner's pick, 2026-11-09: "A · all its violet goo"): its own model, all of it in its violet goo, at the forms' scale, rising out of the floor as it
                // pops out and breathing with the frog's idle, each copy a little out of step (as the blob's wobble was); no glow under it. Else the drawn blob.
                const G3 = typeof fx3dOn === "function" && fx3dOn("goocopy") && fx3dReady("goocopy") ? FX3D.pieces.goocopy : null, H3 = G3 ? (G3.ay - G3.tipY) * (typeof EVO_SCALE === "number" ? EVO_SCALE : 96 / 144) : 0;
                if (G3) { const f3 = frame + Math.round(e.x * 23 + e.y * 11); ctx.globalAlpha = 1; fx3dDrawUpright(ctx, "goocopy", px, cy, Math.floor(((f3 % G3.loop) + G3.loop) % G3.loop / G3.loop * G3.yaws), H3, k); }
                else {
                ctx.globalAlpha = 0.25 * k; ctx.fillStyle = "#9a3ae0"; ctx.beginPath(); ctx.ellipse(px, cy, 18, 8, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.85 * k; ctx.fillStyle = "#b66cf5"; ctx.beginPath(); ctx.ellipse(px, cy - 12, 14 + wob, 13 - wob * 0.5, 0, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(px - 6, cy - 24, 7, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(px + 6, cy - 22, 4, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = "#3a0a5a"; for (const [ex, ey, r] of [[-6, -24, 6], [6, -22, 3.5]]) { ctx.beginPath(); ctx.moveTo(px + ex, cy + ey - r); ctx.lineTo(px + ex + r * 0.35, cy + ey); ctx.lineTo(px + ex, cy + ey + r); ctx.lineTo(px + ex - r * 0.35, cy + ey); ctx.closePath(); ctx.fill(); }
                ctx.strokeStyle = "#3a0a5a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(px, cy - 12, 7, 0.2, Math.PI - 0.2); ctx.stroke();
                }
                if (d && d.maxHealth > 0) { const fr = Math.max(0, d.health / d.maxHealth), by = G3 ? cy - H3 - 8 : cy - 40; ctx.globalAlpha = 0.9 * k; ctx.fillStyle = "#12081a"; ctx.fillRect(px - 14, by, 28, 3); ctx.fillStyle = "#d9b0ff"; ctx.fillRect(px - 14, by, 28 * fr, 3); }
                break;
            }
            // THUNDERSTORM (FORM_ULTIMATES.thunderhead): a dark storm cloud over the Thunderhead, its reach a faint ring, a jagged bolt down to the enemy it struck last
            case "thunderstorm": {
                const k = Math.min(1, (e.maxLife - e.life) / 10, e.life / 20), R = e.radius, rx = R * 1.4142 * TILE_W, ry = R * 1.4142 * TILE_H, cy = py + TILE_H, top = py - 70;
                ctx.globalAlpha = 0.1 * k; ctx.fillStyle = "#fff27a"; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.75 * k; ctx.fillStyle = "#1c1f2b"; for (let i = 0; i < 5; i++) { const ox = (i - 2) * 16 + Math.sin(frame * 0.03 + i) * 3; ctx.beginPath(); ctx.ellipse(px + ox, top + (i % 2) * 5, 22, 12, 0, 0, Math.PI * 2); ctx.fill(); }
                const since = (e.maxLife - e.life) - e.boltAt;
                if (e.bolt && since < 10) { const bx = px + ((e.bolt[0] - e.x) - (e.bolt[1] - e.y)) * TILE_W, by = cy + ((e.bolt[0] - e.x) + (e.bolt[1] - e.y)) * TILE_H - 10; ctx.globalAlpha = (1 - since / 10) * k; ctx.strokeStyle = "#fffbd0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, top + 8); for (let s = 1; s < 6; s++) { const u = s / 6; ctx.lineTo(px + (bx - px) * u + ((s * 37) % 11 - 5) * 2, top + 8 + (by - top - 8) * u); } ctx.lineTo(bx, by); ctx.stroke(); }
                break;
            }
            // EVENT HORIZON (FORM_ULTIMATES.voidstar): a black disc ringed in violet light, a swirl of light being drawn into it
            case "eventhorizon": {
                const k = Math.min(1, (e.maxLife - e.life) / 10, e.life / 20), R = e.radius, rx = R * 1.4142 * TILE_W, ry = R * 1.4142 * TILE_H, cy = py + TILE_H, spin = frame * 0.12;
                ctx.globalAlpha = 0.12 * k; ctx.fillStyle = "#7a4adf"; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.55 * k; ctx.strokeStyle = "#c9a6ff"; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(px, cy, rx * (0.3 + i * 0.25), ry * (0.3 + i * 0.25), 0, -spin + i, -spin + i + 2.2); ctx.stroke(); }
                ctx.globalAlpha = k; ctx.fillStyle = "#050308"; ctx.beginPath(); ctx.ellipse(px, cy - 6, 16, 10, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#e6d6ff"; ctx.lineWidth = 2; ctx.stroke();
                break;
            }
            // VOLTAGE FIELD (a card attack: cardAttackTry): a faint yellow disc round the Static Orb, its edge lit, sparks crackling across it
            case "voltagefield": {
                const k = Math.min(1, (e.maxLife - e.life) / 10, e.life / 20), R = e.radius, rx = R * 1.4142 * TILE_W, ry = R * 1.4142 * TILE_H, cy = py + TILE_H;
                ctx.globalAlpha = 0.12 * k; ctx.fillStyle = "#ffee33"; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.7 * k; ctx.strokeStyle = "#fff27a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) { const an = frame * 0.09 + i * 2.1, j = (frame * 7 + i * 13) % 5; ctx.beginPath(); ctx.moveTo(px + Math.cos(an) * rx * 0.3, cy + Math.sin(an) * ry * 0.3); ctx.lineTo(px + Math.cos(an + 0.3) * rx * 0.6 + j, cy + Math.sin(an + 0.3) * ry * 0.6 - j); ctx.lineTo(px + Math.cos(an) * rx * 0.95, cy + Math.sin(an) * ry * 0.95); ctx.stroke(); }
                break;
            }
            // ROTTEN DECOY (the Rotshard's move): a black crystal formation, the Rotshard's height, in a constant hazy green mist; its health as a thin bar
            case "rotdecoy": {
                const d = e.on, k = Math.min(1, (e.maxLife - e.life) / 8), cy = py + TILE_H * 0.5, sway = Math.sin(frame * 0.05) * 2;
                // AS A BLACK ROTSHARD (js/fx3d.js rotdecoy; the owner, 2026-11-09: "Make the decoy a black Rotshard"): the Rotshard's own model in black, at the forms' scale, rising out of the floor as it is set
                // and breathing with the Rotshard's idle; no glow round it (the owner: "I don't like the green aura"). Else the drawn spikes in their glow.
                const R3 = typeof fx3dOn === "function" && fx3dOn("rotdecoy") && fx3dReady("rotdecoy") ? FX3D.pieces.rotdecoy : null, H3 = R3 ? (R3.ay - R3.tipY) * (typeof EVO_SCALE === "number" ? EVO_SCALE : 96 / 144) : 0;
                if (!R3) { ctx.globalAlpha = 0.22 * k; ctx.fillStyle = "#7dff4a"; ctx.beginPath(); ctx.ellipse(px + sway, cy - 14, 30, 22, 0, 0, Math.PI * 2); ctx.fill(); }   // the mist
                if (!R3) { ctx.globalAlpha = 0.14 * k; ctx.fillStyle = "#7dff4a"; ctx.beginPath(); ctx.ellipse(px - sway, cy - 4, DECOY_MIST * 1.4142 * TILE_W, DECOY_MIST * 1.4142 * TILE_H, 0, 0, Math.PI * 2); ctx.fill(); }   // its poison's reach (the black Rotshard stands on the bare floor: the owner, 2026-11-09, "Remove [the] green space")
                if (R3) { ctx.globalAlpha = 1; fx3dDrawUpright(ctx, "rotdecoy", px, cy, Math.floor(((frame % R3.loop) + R3.loop) % R3.loop / R3.loop * R3.yaws), H3, k); }
                else { ctx.globalAlpha = k; for (const [ox, h, w] of [[-7, 30, 6], [0, 44, 8], [8, 34, 6], [-2, 22, 5]]) { ctx.fillStyle = "#121418"; ctx.beginPath(); ctx.moveTo(px + ox - w, cy); ctx.lineTo(px + ox, cy - h); ctx.lineTo(px + ox + w, cy); ctx.closePath(); ctx.fill(); ctx.strokeStyle = "rgba(125,255,74,0.6)"; ctx.lineWidth = 1; ctx.stroke(); } }
                if (d && d.maxHealth > 0) { const fr = Math.max(0, d.health / d.maxHealth), by = R3 ? cy - H3 - 8 : cy - 52; ctx.globalAlpha = 0.9 * k; ctx.fillStyle = "#0b0f0c"; ctx.fillRect(px - 14, by, 28, 3); ctx.fillStyle = "#7dff4a"; ctx.fillRect(px - 14, by, 28 * fr, 3); }
                break;
            }
            // ...broken: its black shards scattered on the floor, still in the green haze, fading
            case "rotshards": {
                const k = e.life / e.maxLife, cy = py + TILE_H * 0.5;
                ctx.globalAlpha = 0.2 * k; ctx.fillStyle = "#7dff4a"; ctx.beginPath(); ctx.ellipse(px, cy - 4, 26, 12, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = k; ctx.fillStyle = "#121418"; for (let i = 0; i < 6; i++) { const an = i * 1.05 + e.x, r = 8 + (i % 3) * 5, sx = px + Math.cos(an) * r, sy = cy + Math.sin(an) * r * 0.5; ctx.beginPath(); ctx.moveTo(sx - 3, sy); ctx.lineTo(sx, sy - 7); ctx.lineTo(sx + 3, sy); ctx.closePath(); ctx.fill(); }
                break;
            }
            // WRAITHFIRE (a card attack: cardAttackTry): the Ember Hood's ghost, a tall wavering flame of pale fire round it
            case "wraithfire": {
                const k = Math.min(1, (e.maxLife - e.life) / 8, e.life / 12), cy = py - 16, wob = Math.sin(frame * 0.25) * 3;
                ctx.globalAlpha = 0.28 * k; ctx.fillStyle = "#ff8a3a"; ctx.beginPath(); ctx.ellipse(px, cy, 22, 34, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.55 * k; ctx.fillStyle = "#ffe0b0"; ctx.beginPath(); ctx.moveTo(px - 14, cy + 22); ctx.quadraticCurveTo(px - 18 + wob, cy - 10, px + wob, cy - 44); ctx.quadraticCurveTo(px + 18 + wob, cy - 10, px + 14, cy + 22); ctx.closePath(); ctx.fill();
                break;
            }
            // A JELLY SHIELD (FORM_ULTIMATES.jellyram): a soft cyan dome over its wearer, wobbling, fainter as it is used up
            case "jellyshield": {
                const w = e.on, S = w && w.jellyShield, k = Math.min(1, (e.maxLife - e.life) / 8, e.life / 20), left = S ? Math.max(0.25, S.hp / ((w.maxHealth || 20) * ULT_JELLY.soak)) : 0, wob = 1 + 0.05 * Math.sin(frame * 0.2), cy = py - 18;
                ctx.globalAlpha = 0.22 * k * left; ctx.fillStyle = "#9ff0ff"; ctx.beginPath(); ctx.ellipse(px, cy, 24 * wob, 28 / wob, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.75 * k * left; ctx.strokeStyle = "#e6ffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, cy, 24 * wob, 28 / wob, 0, 0, Math.PI * 2); ctx.stroke();
                break;
            }
            // ABSOLUTE ZERO (FORM_ULTIMATES): the Frost Maw, swollen with what it swallowed: a frosted ring round it, crystals rising
            case "abszero": {
                const k = Math.min(1, (e.maxLife - e.life) / 10, e.life / 20), rx = 1.2 * 1.4142 * TILE_W, ry = 1.2 * 1.4142 * TILE_H, cy = py + TILE_H;
                ctx.globalAlpha = 0.28 * k; ctx.fillStyle = "#bfefff"; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = 0.8 * k; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.fillStyle = "#e6f8ff"; for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2 + frame * 0.02, h = 8 + 4 * Math.sin(frame * 0.2 + i); const fx = px + Math.cos(an) * rx * 0.8, fy = cy + Math.sin(an) * ry * 0.8; ctx.globalAlpha = 0.85 * k; ctx.beginPath(); ctx.moveTo(fx - 3, fy); ctx.lineTo(fx, fy - h); ctx.lineTo(fx + 3, fy); ctx.closePath(); ctx.fill(); }
                break;
            }
            // MAGMA VENT (js/evolution.js magmaVent): a dark cracked mouth in the floor glowing orange, its reach a faint ring; each burst throws a column of magma up and a flash of the ring
            case "magmavent": {
                const k = Math.min(1, (e.maxLife - e.life) / 10, e.life / 20), R = e.radius, rx = R * 1.4142 * TILE_W, ry = R * 1.4142 * TILE_H, cy = py + TILE_H, since = (e.maxLife - e.life) - (e.burstAt || 0), b = Math.max(0, 1 - since / 24);
                ctx.globalAlpha = (0.12 + 0.25 * b) * k; ctx.fillStyle = "#ff4a12"; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
                ctx.globalAlpha = (0.35 + 0.5 * b) * k; ctx.strokeStyle = "#ff8a3a"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(px, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
                ctx.globalAlpha = k; ctx.fillStyle = "#1a0d08"; ctx.beginPath(); ctx.ellipse(px, cy, 14, 7, 0, 0, Math.PI * 2); ctx.fill();   // the mouth
                ctx.fillStyle = "#ff7a1f"; ctx.beginPath(); ctx.ellipse(px, cy, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
                ctx.strokeStyle = "#ffb04a"; ctx.lineWidth = 1.5; for (let i = 0; i < 4; i++) { const an = i * 1.57 + e.x; ctx.beginPath(); ctx.moveTo(px + Math.cos(an) * 10, cy + Math.sin(an) * 5); ctx.lineTo(px + Math.cos(an) * 22, cy + Math.sin(an) * 11); ctx.stroke(); }   // cracks
                if (b > 0) { ctx.globalAlpha = b * k; const h = 46 * (1 - b * 0.4); const gr = ctx.createLinearGradient(px, cy, px, cy - h); gr.addColorStop(0, "#ffd27a"); gr.addColorStop(1, "rgba(255,90,20,0)"); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(px - 8, cy); ctx.lineTo(px, cy - h); ctx.lineTo(px + 8, cy); ctx.closePath(); ctx.fill(); }   // the burst
                break;
            }
            // STATIC VORTEX (js/evolution.js staticVortex): a stationary dark storm on the enemy, drawn from its baked sheet (js/evolution.js staticVortexDraw; the owner chose design C of six). Nothing flat on the floor.
            case "staticVortex": { if (typeof staticVortexDraw === "function") staticVortexDraw(e, px, py, ctx); break; }
            // FAULTLINE's path (js/techabilities.js techFaultlineAt): a molten line along the drawn path from the moment it is sent; the stretch the Burrower has passed burns white-hot, the rest pulses
            // ahead of it; it fades once the Burrower is up.
            case "faultTrace": {
                const P = e.pts, C = e.cum, W = canvas.width / 2, H = canvas.height / 2, k = e.done ? Math.max(0, e.life / Math.max(1, e.maxLife)) : 1;
                ctx.lineCap = "round"; ctx.lineJoin = "round";
                for (let pass = 0; pass < 2; pass++) {
                    ctx.globalAlpha = k * (pass ? 0.85 : 0.3 + 0.12 * Math.sin(frame * 0.25)); ctx.strokeStyle = pass ? "#ffb04a" : "#ff3a0a"; ctx.lineWidth = pass ? 2 : 8;
                    ctx.beginPath();
                    for (let i = 0; i < P.length; i++) { const tx = (P[i].x - player.visualX - (P[i].y - player.visualY)) * TILE_W + W, ty = (P[i].x - player.visualX + (P[i].y - player.visualY)) * TILE_H + H + TILE_H; if (i) ctx.lineTo(tx, ty); else ctx.moveTo(tx, ty); }
                    ctx.stroke();
                }
                if (e.reached > 0) {   // (the stretch it has passed)
                    ctx.globalAlpha = k; ctx.strokeStyle = "#fff4d0"; ctx.lineWidth = 1.5; ctx.beginPath();
                    for (let i = 0; i < P.length; i++) {
                        let qx = P[i].x, qy = P[i].y;
                        if (C[i] > e.reached) { const a = P[i - 1], sg = (C[i] - C[i - 1]) || 1e-9, t = (e.reached - C[i - 1]) / sg; qx = a.x + (P[i].x - a.x) * t; qy = a.y + (P[i].y - a.y) * t; }
                        const tx = (qx - player.visualX - (qy - player.visualY)) * TILE_W + W, ty = (qx - player.visualX + (qy - player.visualY)) * TILE_H + H + TILE_H;
                        if (i) ctx.lineTo(tx, ty); else ctx.moveTo(tx, ty);
                        if (C[i] > e.reached) break;
                    }
                    ctx.stroke();
                }
                break;
            }
            // FAULTLINE's spikes (js/techabilities.js), and BURROW STRIKE's eruption (js/combat.js): three molten spikes burst up out of the floor and sink again, a glow round their foot.
            case "faultSpike": {
                const age = e.maxLife - e.life, up = Math.min(1, age / 5), fall = Math.max(0, (age - 12) / 14), h = 26 * up * (1 - fall), cy = py + TILE_H;
                ctx.globalAlpha = 0.5 * (1 - fall); ctx.fillStyle = "#ff5a1f"; ctx.beginPath(); ctx.ellipse(px, cy, 16, 7, 0, 0, Math.PI * 2); ctx.fill();
                for (let i = -1; i <= 1; i++) {
                    const bx = px + i * 7, hh = h * (i ? 0.7 : 1);
                    ctx.globalAlpha = 1 - fall * 0.8; ctx.fillStyle = "#2a1208"; ctx.beginPath(); ctx.moveTo(bx - 4, cy); ctx.lineTo(bx + i * 2, cy - hh); ctx.lineTo(bx + 4, cy); ctx.closePath(); ctx.fill();
                    ctx.fillStyle = "#ff8a3a"; ctx.beginPath(); ctx.moveTo(bx - 1.5, cy); ctx.lineTo(bx + i * 2, cy - hh * 0.9); ctx.lineTo(bx + 1.5, cy); ctx.closePath(); ctx.fill();
                }
                break;
            }
            // CHAIN LIGHTNING's jumps (js/evolution.js chainLightning): a jagged bolt from the enemy the shot struck through each enemy it conducted to, flickering out.
            case "chainBolt": {
                const k = e.life / e.maxLife, W = canvas.width / 2, H = canvas.height / 2, P = e.pts;
                ctx.lineCap = "round"; ctx.lineJoin = "round";
                for (let pass = 0; pass < 2; pass++) {
                    ctx.globalAlpha = (pass ? 1 : 0.4) * k; ctx.strokeStyle = pass ? "#ffffff" : (e.color || "#ffee33"); ctx.lineWidth = pass ? 1.6 : 4;
                    ctx.beginPath();
                    for (let i = 0; i < P.length; i++) {
                        const bx = (P[i].x - player.visualX - (P[i].y - player.visualY)) * TILE_W + W, by = (P[i].x - player.visualX + (P[i].y - player.visualY)) * TILE_H + H + TILE_H - 26;
                        if (!i) { ctx.moveTo(bx, by); continue; }
                        const ax = (P[i - 1].x - player.visualX - (P[i - 1].y - player.visualY)) * TILE_W + W, ay = (P[i - 1].x - player.visualX + (P[i - 1].y - player.visualY)) * TILE_H + H + TILE_H - 26;
                        for (let s = 1; s < 5; s++) { const q = s / 5, jg = 7 * Math.sin(frame * 1.3 + i * 2.1 + s * 1.7); ctx.lineTo(ax + (bx - ax) * q + jg, ay + (by - ay) * q - jg * 0.6); }
                        ctx.lineTo(bx, by);
                    }
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

// ── SEEDFALL ON THE FLOOR (the THORNWHIP's alternate, build 2026-11-08j; js/evolution.js seedfall) ──
// The owner: "the alternate attack needs to be hidden behind walls". Its circle is painted onto the floor tile by tile, in the floor's own pass (js/game.js, as a Mage's aura ring and
// a serum's pool are), each tile clipped to itself: a wall or a unit in front of it covers it, and it never spills onto a wall. Only the tiles of its own room show it. Its seeds fall
// onto the tile each lands on, drawn with that tile, so a wall in front covers them too; a seed that would land off the floor is not drawn. Nine seeds, each falling over and over to
// its own spot, out of step; a little ring opens where each lands.
let _sfFrame = -1, _sfList = [];   // (drawing only: the SEEDFALLs to paint this frame and their rooms, found once a frame: tests/ghost.js allow-lists them)
function _sfRoomAt(x, y) { return typeof facilityRoomAt === "function" && typeof _fp !== "undefined" && _fp && _fp.F ? facilityRoomAt(x, y, _fp.F) : undefined; }
function _sfSeed(e, i, age, out) {   // where seed i lands (world, tiles) and how far through its fall it is (0..1)
    const an = i * 2.39996 + e.x * 1.7, d = Math.sqrt((i * 0.618 + Math.abs(e.y) * 0.37) % 1) * 0.9 * e.radius;
    out.x = e.x + Math.cos(an) * d; out.y = e.y + Math.sin(an) * d; out.ph = ((age + i * 13) % 40) / 40; return out;
}
function drawSeedfallOnTile(tx, ty, px, py) {
    if (typeof ctx === "undefined" || !ctx || typeof elementEffects === "undefined") return;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    if (_sfFrame !== f0) { _sfFrame = f0; _sfList = elementEffects.filter(e => e.type === "seedfall" && e.life > 0).map(e => ({ e, room: _sfRoomAt(e.x, e.y) })); }   // (once a frame)
    if (!_sfList.length) return;
    let room, roomKnown = false;
    for (const it of _sfList) {
        const e = it.e, R = e.radius; if (Math.abs(tx - e.x) > R + 0.75 || Math.abs(ty - e.y) > R + 0.75) continue;
        if (!roomKnown) { room = _sfRoomAt(tx, ty); roomKnown = true; }
        if (room !== it.room) continue;   // (a tile of another room shows none of it)
        const sd = { x: 0, y: 0, ph: 0 };
        const k = Math.min(1, (e.maxLife - e.life) / 10, e.life / 20), age = e.maxLife - e.life, rx = R * Math.SQRT2 * TILE_W, ry = R * Math.SQRT2 * TILE_H;
        const at = (x, y) => [px + ((x - tx) - (y - ty)) * TILE_W, py + TILE_H + ((x - tx) + (y - ty)) * TILE_H];   // (a ground point, from this tile)
        const [cx, cy] = at(e.x, e.y);
        ctx.save();
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TILE_W, py + TILE_H); ctx.lineTo(px, py + 2 * TILE_H); ctx.lineTo(px - TILE_W, py + TILE_H); ctx.closePath(); ctx.clip();
        ctx.globalAlpha = 0.3 * k; ctx.fillStyle = "#ff7ab8"; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();   // (on the light floor, a soft pink)
        ctx.globalAlpha = (0.7 + 0.25 * Math.sin(f0 * 0.2 + e.x)) * k; ctx.strokeStyle = "#ff5fa8"; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
        for (let i = 0; i < 9; i++) {   // (where a seed lands on this tile: a little ring, on the floor)
            const s = _sfSeed(e, i, age, sd); if (s.ph < 0.85 || Math.round(s.x) !== tx || Math.round(s.y) !== ty) continue;
            const [qx, qy] = at(s.x, s.y); ctx.globalAlpha = (1 - (s.ph - 0.85) / 0.15) * 0.8 * k; ctx.strokeStyle = "#ff7ab8"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(qx, qy, 5, 2.5, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
        ctx.save(); ctx.fillStyle = "#ffd6ea";
        for (let i = 0; i < 9; i++) {   // (a seed falling onto this tile: in the air, so not clipped to it; drawn with it, so what stands in front covers it)
            const s = _sfSeed(e, i, age, sd); if (s.ph >= 0.85 || Math.round(s.x) !== tx || Math.round(s.y) !== ty) continue;
            const [qx, qy] = at(s.x, s.y); ctx.globalAlpha = 0.9 * k; ctx.beginPath(); ctx.ellipse(qx, qy - (1 - s.ph / 0.85) * 46, 2.2, 3.2, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
    }
}

// ── CONSUME'S SUPPORT (SUNDEW, build 2026-11-08k) ──
// Which frame of its sheet's CONSUME block SUNDEW shows (js/evolution.js _evoFrame), its age in frames: its petals snapping shut and its stem withering (the block's first four, over
// half a second), then the bud throbbing (the last four, looped), then its petals opening (the first four backward, in the last half second). -1: it holds nothing.
function consumeFrame(f, f0) {
    const C = f && f._consume; if (!C) return -1;
    const a = f0 - C.t0, N = ULT_CONSUME.frames;
    if (a < 0 || a >= N) return -1;
    if (a < 30) return Math.min(3, Math.floor(a / 30 * 4));
    if (a >= N - 30) return Math.max(0, 3 - Math.floor((a - (N - 30)) / 30 * 4));
    return 4 + Math.floor((a - 30) / 14) % 4;
}
// While it holds a catch it takes ULT_CONSUME.guard less damage (js/helpers.js applyDamage)
function consumeGuard(t, amount) { return t && t._consume && t._consume.prey && !t._consume.prey.dead ? amount * (1 - ULT_CONSUME.guard) : amount; }
// While it holds a catch it stands still, its petals shut, and makes no other attack (js/npc.js _updateNPCStep). True while it holds one.
function consumeHoldStep(f) {
    const C = f && f._consume; if (!C) return false;
    if (!C.prey || C.prey.dead || !C.prey._swallowedBy) { f._consume = null; return false; }
    f.state = "idle"; f.attackAnim = 0; return true;
}

// ── PINK THICKET (THORNWHIP's Ultimate, build 2026-11-08l) ──
// Where its seed lands: the thicket, and its first beat at once
function thicketGrow(f, x, y) {
    if (typeof elementEffects === "undefined") return null;
    const T = ULT_THICKET, e = { type: "thicket", x, y, radius: T.radius, life: T.frames, maxLife: T.frames, by: f, element: "blossom", seed: Math.round(Math.abs(x * 7.31 + y * 3.17) * 100) % 997, healAt: null };
    elementEffects.push(e); thicketBeat(e);
    return e;
}
// A beat: every enemy in it that its middle can see is held in place till the next beat and bitten (Elemental, BLOOM's); what the bites take is shared out as healing
function thicketBeat(e) {
    if (typeof actors === "undefined" || typeof isHostileTarget !== "function") return 0;
    const T = ULT_THICKET, by = e.by, r2 = e.radius * e.radius; let dealt = 0;
    for (const a of actors) {
        if (!a || !isHostileTarget(a)) continue;
        const dx = a.x - e.x, dy = a.y - e.y; if (dx * dx + dy * dy > r2 || (typeof _evoSees === "function" && !_evoSees(e.x, e.y, a))) continue;
        if (typeof applySlow === "function") applySlow(a, T.tick + 2, 0);   // (bound: it cannot move till the next beat)
        const h0 = a.health; applyDamage(a, ((by && by.power) || 10) * T.mult, by || null, "blossom", false, false, DMG_HIT_SPECIAL);
        dealt += Math.max(0, h0 - Math.max(0, a.health));
    }
    if (dealt > 0) thicketHeal(e, dealt);
    return dealt;
}
// The healing aura (the owner: "Shared out"): `amount` (the damage just dealt) shared among your followers in it, the most hurt first, each up to its full health; what none can take is lost.
// Your followers, not the player (as SEEDFALL's and MEND's: the owner's answer for SEEDFALL, 2026-11-08). Returns what it healed.
function thicketHeal(e, amount) {
    if (typeof followers === "undefined" || typeof healUnit !== "function" || !(amount > 0)) return 0;
    const r2 = e.radius * e.radius, hurt = followers.filter(a => a && !a.dead && a.team === "green" && a.maxHealth > 0 && a.health < a.maxHealth && (a.x - e.x) * (a.x - e.x) + (a.y - e.y) * (a.y - e.y) <= r2)
        .sort((a, b) => a.health / a.maxHealth - b.health / b.maxHealth);
    let left = amount, healed = 0;
    for (const a of hurt) { if (left <= 1e-9) break; const got = healUnit(a, Math.min(left, a.maxHealth - a.health), e.by || null); left -= got; healed += got; }
    if (healed > 0) e.healAt = typeof frame !== "undefined" ? frame : 0;   // (the aura swells: drawThicketOnTile)
    return healed;
}
// ON THE FLOOR, as SEEDFALL is: patchy pink-leaved bushes over its circle and a soft pink aura that swells as it heals, drawn tile by tile in the floor's pass (js/game.js): walls and
// units in front cover them; only the tiles of its own room show them. (_thFrame, _thList: drawing only, tests/ghost.js allow-lists them.)
let _thFrame = -1, _thList = [];
function _thHash(x, y, s) { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); }
function _thBush(x, y, s, t) {   // a bush: a dark plum mound, pink pointed leaves fanned up out of it, swaying a little
    if (!(s > 0.02)) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.globalAlpha = 0.3; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(0, 0, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = "#3a1530"; ctx.beginPath(); ctx.ellipse(0, -5, 10, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    const sway = Math.sin(t * 0.05) * 0.08;
    for (let i = 0; i < 7; i++) {
        const a = -Math.PI / 2 + (i - 3) * 0.42 + sway, L = 12 + (i % 3) * 3, w = 3.2, bx = Math.cos(a) * 3, by = -5 + Math.sin(a) * 3, ex = Math.cos(a) * L, ey = -5 + Math.sin(a) * L * 0.9, nx = -Math.sin(a) * w, ny = Math.cos(a) * w;
        ctx.fillStyle = i % 2 ? "#ff7ab8" : "#e0559a"; ctx.beginPath(); ctx.moveTo(bx, by); ctx.quadraticCurveTo((bx + ex) / 2 + nx, (by + ey) / 2 + ny, ex, ey); ctx.quadraticCurveTo((bx + ex) / 2 - nx, (by + ey) / 2 - ny, bx, by); ctx.fill();
    }
    ctx.restore();
}
function drawThicketOnTile(tx, ty, px, py) {
    if (typeof ctx === "undefined" || !ctx || typeof elementEffects === "undefined") return;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    if (_thFrame !== f0) { _thFrame = f0; _thList = elementEffects.filter(e => e.type === "thicket" && e.life > 0).map(e => ({ e, room: _sfRoomAt(e.x, e.y) })); }   // (once a frame)
    if (!_thList.length) return;
    let room, roomKnown = false;
    for (const it of _thList) {
        const e = it.e, R = e.radius; if (Math.abs(tx - e.x) > R + 0.75 || Math.abs(ty - e.y) > R + 0.75) continue;
        if (!roomKnown) { room = _sfRoomAt(tx, ty); roomKnown = true; }
        if (room !== it.room) continue;   // (a tile of another room shows none of it)
        const age = e.maxLife - e.life, grow = Math.min(1, age / 24, e.life / 30), pulse = e.healAt != null ? Math.max(0, 1 - (f0 - e.healAt) / 20) : 0;
        const at = (x, y) => [px + ((x - tx) - (y - ty)) * TILE_W, py + TILE_H + ((x - tx) + (y - ty)) * TILE_H], [cx, cy] = at(e.x, e.y), rx = R * Math.SQRT2 * TILE_W, ry = R * Math.SQRT2 * TILE_H;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TILE_W, py + TILE_H); ctx.lineTo(px, py + 2 * TILE_H); ctx.lineTo(px - TILE_W, py + TILE_H); ctx.closePath(); ctx.clip();
        ctx.globalAlpha = (0.16 + 0.2 * pulse) * grow; ctx.fillStyle = "#ff7ab8"; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill();   // (the healing aura)
        ctx.globalAlpha = (0.5 + 0.3 * pulse) * grow; ctx.strokeStyle = "#ff5fa8"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
        const n = (() => { const h = _thHash(tx, ty, e.seed); return h < 0.3 ? 0 : h < 0.75 ? 1 : 2; })();   // (patchy: none, one or two bushes on a tile)
        for (let k = 0; k < n; k++) {
            const bx = tx + (_thHash(tx + k * 7, ty, e.seed + 1) - 0.5) * 0.8, by = ty + (_thHash(tx, ty + k * 5, e.seed + 2) - 0.5) * 0.8;
            if ((bx - e.x) * (bx - e.x) + (by - e.y) * (by - e.y) > R * R) continue;
            const [qx, qy] = at(bx, by); _thBush(qx, qy, (0.75 + 0.5 * _thHash(tx, ty, e.seed + 3 + k)) * grow, f0 + tx * 13 + ty * 7);
        }
    }
}

// ── HEXFIRE'S CRATER (build 2026-11-12h) ─────────────────────────────────────────────────────────────────────────────────────
// The owner, 2026-11-12: "no satanic pentagram stuff for just a giant pool of lava", the Hood "lights up and then a crater erupts lava"; "a more 3D looking effect, maybe bubbles, definitely more depth"; "more cracked and
// rigid"; of that (a smooth round crater with a lava pool, plates and bubbles): "It honestly looks like a bowl of soup or something. Like make it look like a fissure with volcanic activity."; of a pure fissure:
// "Make it still mostly a crater." So it is a CRATER that is not a bowl: a pit with a JAGGED, broken rim of rock (lit along its far edge, dark along its near one, a wall of rock under it, chunks of it flung round),
// the inner wall you look down into, and a floor of dark CRUST split by a glowing FISSURE of lava (wide in its middle, pinched at its ends) with short cracks off it; hairline cracks run out from the rim to the edge of
// the circle (so the reach reads) over scorched, heat-cracked ground; VENTS along the fissure spit jets of lava and sparks in turns and puff smoke and ash. The circle is as it was (js/evolution.js hexfireCircle:
// its radius, life, bite and sight). It opens over 14 frames (every vent going off) and dims to a dark red crust over its last 24. Flat colours only (no gradient, no shadowBlur: the effects plan); drawn on the
// floor tile by tile like SEEDFALL's circle, so walls and units in front cover it (the jets and smoke, in the air, with the tile that holds its middle).
let _hxFrame = -1, _hxList = [];
function _hxH(a, b) { const x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return x - Math.floor(x); }   // (a number from 0 to 1 from two: no random, the same each frame)
// its shape, made once for a crater, in the circle's own units (-1 to 1 across it): the rim, the fissure's two edges, the short cracks, the cracks out to the edge, the vents and the rock
function _hxShape(e) {
    const sd = Math.round(e.x * 10) * 7 + Math.round(e.y * 10), H = (a, b) => _hxH(sd + a, b), CR = 0.64, ang = H(1, 1) * 3.1416, ax = Math.cos(ang), ay = Math.sin(ang), px = -ay, py = ax, N = 9, L = 0.5, W = 0.2;
    const rim = []; for (let k = 0; k < 30; k++) { const a = k / 30 * 6.2832, j = 0.9 + 0.2 * H(k, 2) + (k % 5 === 0 ? 0.07 : 0) - (k % 7 === 3 ? 0.08 : 0); rim.push([Math.cos(a) * CR * j, Math.sin(a) * CR * j]); }   // (the broken rim: bites out of it and lumps on it)
    const main = [], left = [], right = [];
    for (let i = 0; i < N; i++) { const t = (i / (N - 1)) * 2 - 1, w = W * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 1.7)), 0.8) * (0.75 + 0.5 * H(i, 3)) + 0.012, j = 0.05 * (H(i, 4) - 0.5) * 2, bx = ax * t * L + px * j, by = ay * t * L + py * j;
        main.push([bx, by, w]); left.push([bx + px * (w / 2 + 0.025 * (H(i, 5) - 0.3)), by + py * (w / 2 + 0.025 * (H(i, 5) - 0.3))]); right.push([bx - px * (w / 2 + 0.025 * (H(i, 6) - 0.3)), by - py * (w / 2 + 0.025 * (H(i, 6) - 0.3))]); }
    const branches = [];
    for (let k = 0; k < 4; k++) { const at = main[2 + Math.floor(H(k, 7) * 5)], side = k % 2 ? 1 : -1, a2 = ang + side * (0.7 + 0.6 * H(k, 8)), len = 0.16 + 0.16 * H(k, 9), pts = [[at[0], at[1]]];
        for (let s = 1; s <= 3; s++) { const f = s / 3; pts.push([at[0] + Math.cos(a2) * len * f + (H(k * 5 + s, 10) - 0.5) * 0.05, at[1] + Math.sin(a2) * len * f + (H(k * 5 + s, 11) - 0.5) * 0.05]); }
        branches.push(pts); }
    const hair = [];   // (cracks out of the rim, to the edge of the circle)
    for (let k = 0; k < 8; k++) { const a2 = (k + 0.6 * H(k, 12)) / 8 * 6.2832, r0 = CR * (0.9 + 0.08 * H(k, 13)), len = 0.22 + 0.16 * H(k, 14) + (k % 3 === 0 ? 0.1 : 0), bend = 0.5 * (H(k, 15) - 0.5), pts = [];
        for (let s = 0; s <= 6; s++) { const f = s / 6, aa = a2 + bend * f * f, rr = r0 + len * f; pts.push([Math.cos(aa) * rr, Math.sin(aa) * rr]); }   // (a gentle curve, not a zigzag)
        hair.push(pts); }
    const vents = [0, 1, 2].map(k => { const m = main[2 + Math.floor((k + 0.3 + 0.4 * H(k, 16)) * 5 / 3)]; return { u: m[0], v: m[1], per: 44 + 16 * H(k, 17), ph: H(k, 18) * 40, big: 0.7 + 0.5 * H(k, 19) }; });
    const rocks = []; for (let k = 0; k < 14; k++) { const a = (k + H(k, 20)) / 14 * 6.2832, d = CR * (1.08 + 0.2 * H(k, 21)); rocks.push({ u: Math.cos(a) * d, v: Math.sin(a) * d, sz: 0.032 + 0.04 * H(k, 22), a: H(k, 23) * 6.28 }); }
    const scorch = []; for (let k = 0; k < 28; k++) scorch.push(0.9 + 0.12 * H(k, 24));
    const crustPatch = []; for (let k = 0; k < 7; k++) crustPatch.push({ a: H(k, 25) * 6.28, r: 0.15 + 0.4 * H(k, 26), s: 0.08 + 0.07 * H(k, 27) });
    return { rim, main, left, right, branches, hair, vents, rocks, scorch, crustPatch, CR };
}
function drawHexfireOnTile(tx, ty, px, py) {
    if (typeof ctx === "undefined" || !ctx || typeof elementEffects === "undefined") return;
    const f0 = typeof frame !== "undefined" ? frame : 0;
    if (_hxFrame !== f0) { _hxFrame = f0; _hxList = elementEffects.filter(e => e.type === "hexfire" && e.life > 0).map(e => ({ e, room: _sfRoomAt(e.x, e.y) })); }   // (once a frame)
    if (!_hxList.length) return;
    let room, roomKnown = false;
    for (const it of _hxList) {
        const e = it.e, R = e.radius; if (Math.abs(tx - e.x) > R + 0.75 || Math.abs(ty - e.y) > R + 0.75) continue;
        if (!roomKnown) { room = _sfRoomAt(tx, ty); roomKnown = true; }
        if (room !== it.room) continue;   // (a tile of another room shows none of it)
        const S = e._hx || (e._hx = _hxShape(e)), age = e.maxLife - e.life, open = Math.min(1, age / 14), eo = 1 - Math.pow(1 - open, 2), fade = Math.min(1, e.life / 24), cool = 1 - fade, heat = 1 - cool * 0.85;
        const rx = R * Math.SQRT2 * TILE_W, ry = R * Math.SQRT2 * TILE_H, at = (x, y) => [px + ((x - tx) - (y - ty)) * TILE_W, py + TILE_H + ((x - tx) + (y - ty)) * TILE_H];
        const [cx, cy] = at(e.x, e.y), P = (u, v, k) => [cx + u * (k == null ? eo : k) * rx, cy + v * (k == null ? eo : k) * ry], drop = ry * 0.1 * eo;   // (a point of it, grown out from the middle as it opens; drop: how far below the rim the floor lies)
        const poly = (pts, fill, a) => { ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill(); };
        const line = (pts, col, lw, a) => { ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); };
        const blob = (x, y, w, h, fill, a) => { ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, w), Math.max(0.01, h), 0, 0, Math.PI * 2); ctx.fill(); };
        const taper = (pts, w0, fill, a) => { const n = pts.length, L = [], Rr = []; for (let i = 0; i < n; i++) { const p0 = pts[Math.max(0, i - 1)], p1 = pts[Math.min(n - 1, i + 1)], dx = p1[0] - p0[0], dy = p1[1] - p0[1], d = Math.hypot(dx, dy) || 1, w = w0 * Math.pow(1 - i / (n - 1), 0.85) + 0.15; L.push([pts[i][0] - dy / d * w, pts[i][1] + dx / d * w]); Rr.push([pts[i][0] + dy / d * w, pts[i][1] - dx / d * w]); } poly(L.concat(Rr.reverse()), fill, a); };   // (a crack that narrows to a point along its length)
        const rimP = S.rim.map(q => P(q[0], q[1])), floorP = (k) => S.rim.map(q => [cx + q[0] * k * eo * rx, cy + q[1] * k * eo * ry + drop]);
        const widen = (k) => { const L2 = [], R2 = []; for (let i = 0; i < S.main.length; i++) { const m = S.main[i], l = S.left[i], r = S.right[i]; L2.push([P(m[0] + (l[0] - m[0]) * k, m[1] + (l[1] - m[1]) * k)][0]); R2.push(P(m[0] + (r[0] - m[0]) * k, m[1] + (r[1] - m[1]) * k)); } return L2.concat(R2.reverse()).map(q => [q[0], q[1] + drop]); };
        ctx.save();
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TILE_W, py + TILE_H); ctx.lineTo(px, py + 2 * TILE_H); ctx.lineTo(px - TILE_W, py + TILE_H); ctx.closePath(); ctx.clip();
        // the scorched, heat-cracked ground over the circle's reach, and the cracks out of the rim to its edge
        { const sc = S.scorch.map((k, i) => { const a = i / S.scorch.length * 6.2832; return [cx + Math.cos(a) * rx * k * (0.5 + 0.5 * eo), cy + Math.sin(a) * ry * k * (0.5 + 0.5 * eo)]; }); poly(sc, "#0f0806", 0.5 * fade); poly(sc.map(q => [cx + (q[0] - cx) * 0.8, cy + (q[1] - cy) * 0.8]), "#1b0e09", 0.32 * fade); }
        for (const h of S.hair) { const pts = h.map(q => P(q[0], q[1])); taper(pts, 3.4, "#120806", 0.85 * fade); taper(pts.slice(0, 5), 1.6, "#c8420e", 0.55 * fade * heat); taper(pts.slice(0, 3), 0.8, "#ff9a30", 0.55 * fade * heat); }   // (cracks out of the rim, tapered: wide and dark at the rim, narrowing to a point, glowing only near it)
        // THE CRATER: the wall of rock under its near edge, the broken rim, a bright edge along the far side, a dark edge along the near, the inner wall
        poly(rimP.map(q => [q[0], q[1] + 7 * eo]), "#150804", 0.95 * fade);
        poly(rimP, "#52291a", 0.97 * fade);
        for (let i = 0; i < rimP.length; i++) { const p0 = rimP[i], p1 = rimP[(i + 1) % rimP.length], far = (p0[1] + p1[1]) / 2 < cy; line([[p0[0], p0[1] + (far ? -1.2 : 0.6)], [p1[0], p1[1] + (far ? -1.2 : 0.6)]], far ? "#a8734b" : "#2a130b", far ? 2.2 : 2.6, (far ? 0.85 : 0.9) * fade); }
        poly(floorP(0.92), "#1b0a06", 0.97 * fade);                                       // (the inner wall: you look down into it)
        poly(floorP(0.84), "#2a110a", 0.95 * fade);                                       // (its lower part)
        // THE FLOOR OF THE CRATER: dark crust, a few paler slabs, a heat glow round the fissure, and the FISSURE of lava split across it
        poly(floorP(0.78), "#3b180d", 0.97 * fade);
        for (const c of S.crustPatch) { const q = [cx + Math.cos(c.a) * c.r * rx * eo, cy + Math.sin(c.a) * c.r * ry * eo + drop], s = c.s * rx * eo; poly([[q[0] - s, q[1]], [q[0] - s * 0.3, q[1] - s * 0.5], [q[0] + s, q[1] - s * 0.1], [q[0] + s * 0.6, q[1] + s * 0.45], [q[0] - s * 0.5, q[1] + s * 0.5]], "#4d2313", 0.8 * fade); }
        poly(widen(3.4), "#7a2a0c", 0.4 * fade * heat); poly(widen(2.3), "#b43a0d", 0.45 * fade * heat); poly(widen(1.7), "#e0500f", 0.55 * fade * heat);   // (the heat round the fissure)
        for (const b of S.branches) { const pts = b.map(q => P(q[0], q[1])).map(q => [q[0], q[1] + drop]); taper(pts, 4.2, "#150805", 0.92 * fade); taper(pts, 2.4, "#e2400b", 0.95 * fade * (0.5 + 0.5 * heat)); taper(pts, 1.1, "#ffc04a", 0.9 * fade * heat); }
        poly(widen(1.4), "#2e160d", 0.95 * fade);   // (the lip of the fissure itself: dark)
        const outline = S.left.map(q => P(q[0], q[1])).concat(S.right.map(q => P(q[0], q[1])).reverse()).map(q => [q[0], q[1] + drop]);
        poly(outline, "#b02f09", 0.97 * fade); poly(widen(0.78), "#ff5a10", 0.97 * fade * (0.55 + 0.45 * heat)); poly(widen(0.5), "#ff9a22", 0.95 * fade * heat);
        { const mid = S.main.map(m => P(m[0], m[1])).map(q => [q[0], q[1] + drop]); line(mid, "#ffd96a", 2.2, 0.9 * fade * heat * (0.8 + 0.2 * Math.sin(f0 * 0.3 + e.x))); line(mid, "#fff3bd", 1, 0.9 * fade * heat); }
        if (cool > 0) poly(outline, "#2a0f08", 0.55 * cool);   // (it crusts over to a dark red as it goes out)
        for (const r of S.rocks) { const q = P(r.u, r.v), s = r.sz * rx * (0.8 + 0.2 * eo);   // (broken rock flung round the rim, angular, lit on top)
            poly([[q[0] + Math.cos(r.a) * s, q[1] + Math.sin(r.a) * s * 0.55], [q[0] + Math.cos(r.a + 2.2) * s * 0.8, q[1] + Math.sin(r.a + 2.2) * s * 0.5], [q[0] + Math.cos(r.a + 4.1) * s, q[1] + Math.sin(r.a + 4.1) * s * 0.55]], "#2b150d", 0.95 * fade);
            line([[q[0] + Math.cos(r.a) * s, q[1] + Math.sin(r.a) * s * 0.55 - 0.8], [q[0] + Math.cos(r.a + 4.1) * s, q[1] + Math.sin(r.a + 4.1) * s * 0.55 - 0.8]], "#8e5c3c", 1, 0.7 * fade); }
        for (const v of S.vents) {   // (the vents: a bright mouth in the fissure)
            const q = P(v.u, v.v), on = open >= 1 ? ((f0 + v.ph) % v.per) / v.per : 0, glow = on < 0.45 ? 1 : 0.35;
            blob(q[0], q[1] + drop, rx * 0.1, ry * 0.1, "#ff7a14", 0.95 * fade * heat); blob(q[0], q[1] + drop, rx * 0.06 * (0.8 + 0.4 * glow), ry * 0.06 * (0.8 + 0.4 * glow), "#fff0b0", 0.95 * fade * heat);
        }
        ctx.restore();
        if (Math.round(e.x) === tx && Math.round(e.y) === ty) {   // IN THE AIR (with the tile that holds its middle, so what stands in front covers it): jets of lava, sparks, smoke and ash
            ctx.save();
            S.vents.forEach((v, i) => {
                const q = P(v.u, v.v), qy = q[1] + drop, t0 = age + v.ph, per = v.per, ph = (t0 % per) / per, burst = age < 22 ? 1 - age / 22 : 0, act = ph < 0.42 ? ph / 0.42 : -1;
                if (act >= 0 || burst > 0) {   // (a jet: shaded blobs thrown up and out in an arc, and sparks)
                    const u2 = act >= 0 ? act : 0.5, sz = v.big * (1 + burst * 0.8);
                    for (let k = 0; k < 6; k++) { const kk = (u2 + k * 0.16) % 1, hgt = Math.sin(Math.PI * kk) * (38 + 36 * sz) * (0.7 + 0.3 * _hxH(i * 9 + k, 31)), out = (kk - 0.5) * (8 + 18 * _hxH(i * 9 + k, 32)) * (k % 2 ? 1 : -1), r = (4 + 2.6 * _hxH(i * 9 + k, 33)) * (1 - kk * 0.3), a = 0.95 * fade * heat;
                        blob(q[0] + out, qy - hgt, r, r * 1.25, "#e2400b", a); blob(q[0] + out + r * 0.1, qy - hgt - r * 0.1, r * 0.7, r * 0.9, "#ff8a1a", a); blob(q[0] + out - r * 0.28, qy - hgt - r * 0.4, r * 0.28, r * 0.32, "#fff0b0", a); }
                    for (let k = 0; k < 5; k++) { const kk = (u2 * 1.3 + k * 0.2) % 1, hgt = Math.sin(Math.PI * kk) * (46 + 30 * sz), out = (_hxH(i * 11 + k, 34) - 0.5) * 30 * kk; blob(q[0] + out, qy - hgt, 1.2, 1.2, "#ffd96a", 0.9 * fade * (1 - kk)); }   // (sparks)
                }
                for (let k = 0; k < 3; k++) { const s = (((age * 0.55) + i * 17 + k * 17) % 52) / 52, sy = qy - 10 - s * 52, sx = q[0] + Math.sin(s * 5 + i + k) * 6 + (k - 1) * s * 7, r = 3.5 + 9 * s;   // (smoke and ash rising, spreading and thinning)
                    blob(sx, sy, r, r * 0.8, k === 1 ? "#6a625a" : "#585048", 0.4 * (1 - s) * fade * (open < 1 ? open : 1)); }
            });
            ctx.restore();
        }
    }
}
