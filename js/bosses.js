// ─────────────────────────────────────────────────────────
//  THE BOSS ENCOUNTERS: one table, one state machine; the Sewers' cistern (docs/SEWER-QUEST.md)
// ─────────────────────────────────────────────────────────
// ASKED: "Implement or extend a reusable boss encounter framework [...] Bosses should not be isolated scripts that duplicate their own quest handling, room transitions, and interaction logic [...] Nests and Sewers as
// distinct boss-domain environments [...] Do not arbitrarily assign bosses to domains or invent new domain relationships where the design archive has not settled them."
// AN ENCOUNTER is data (BOSS_ENCOUNTERS): its domain (a room), the creature (a species' boss class, js/species.js, at a level), its POST (`lair`: where it sleeps, sits and returns to), how far it chases (`leash`), the console it
// keeps (`mount`, `guard`), its ATTACKS, its WAVES and its FRANTIC rule, what wakes it and what calms it. The framework is the state machine below, the same for every row: IDLE (nothing there) → ARMED (bossArm: the boss
// is spawned asleep at its post; the Sewers' is armed when the purification's ambush brings her out, js/quests.js, since build 2026-11-09tt) → ACTIVE (bossWake: the module's install begins, or it is hit) → RESOLVED, by one of two OUTCOMES: "calm"
// (bossCalm: the purification completed with it alive: it settles at its post, hunts nothing, defends itself if attacked) or "defeated" (it died: the game's own kill, js/drops.js pays it). A boss that is left (the
// player goes further than its leash from its post) lets go; a rooted one sleeps again (ARMED), a frantic one only roams. A boss killed after it was calmed is recorded too (`defeated`), the outcome stays "calm":
// the three things the brief keeps apart are kept apart (the quest line's purification, the encounter's resolution, the boss's death). SAVED as `bosses` (the state and outcome of each; the creature itself is not: a
// load spawns an armed or calm boss again, asleep or calm, whole, at its post; a defeated one not; an encounter cut short by a load begins again).
// THE CREATURE is the game's own (spawnCreature, js/clone.js): it is drawn, hit, fed and killed like any creature of the arena; the framework adds bossId (whose it is), bossName (what its tag says), bossAsleep, bossCalm,
// bossRooted and bossFrantic (js/predator.js: a sleeping or calm boss hears no alarm and picks no prey; a rooted one faces its prey and takes no step; neither a rooted nor a frantic one ever goes for the Crystal).
// THE TOXIC QUEEN'S RULES (the archive, 2026-10-31: "Toxic Queen encounter flow", "phase transition — stop spawns at 50% HP", "periodic ant-wave size", "Clarifications — rooted behavior and target selection",
// "independent attack timers and sleep reset", "Installation pressure and predator rule"; every number the archive leaves open is PROVISIONAL here and marked so):
//   ROOTED   awake and above half her health she sits at her post beside the console and does not chase (the archive: "she does not chase the player"): she turns on whoever hits her or comes too close. The install HOLDS
//            while she is within `guard` tiles of the mount and not controlled (bossInstallBlocked ← js/quests.js questMountBlocked ← js/stations.js the mount's blockFn): she "only needs to be moved".
//   ATTACKS  three, with INDEPENDENT timers (`attacks`; "do not let one attack's cooldown unintentionally block another"): the BOMB, "a large, visually obvious toxic bomb/orb" lobbed every `bomb.every` frames (45 s) at
//            whoever she is fighting within `bomb.range`, after a `bomb.windup` telegraph (a ring on the floor where it will land, closing as it comes) and `bomb.flight` frames in the air; it lands where its target
//            stood when it left her: a player who stands still is caught (`bomb.radius`), one who moves is not. The SPIT (the archive's "proximity projectile"), only while the player is within `spit.trigger` tiles,
//            every `spit.cooldown` frames (10 s), smaller and quicker. The BITE, the creature's own two beats when something is in reach (js/predator.js _biteTick: "a distinct close-range attack"). A SLEEP (the
//            potion: js/combat.js applySleep → bossOnSleep) cancels her wind-up, drops what she has in the air and puts BOTH timers back to the full ("sleep resets this timer so she does not resume with a
//            nearly-ready shot"); a stun, freeze or glitch cancels the wind-up (bossControlled: nothing is thrown while she is held). Her ant-species special (MANDIBLE FRENZY, js/abilities.js) stays hers.
//   WAVES    while rooted and in combat she calls `waves.n` weak toxic nymphs every `waves.every` frames (30 s), the first `waves.first` after she wakes ("4 to 6 weak Toxic Ants per periodic wave; start at 4"): they come
//            up beside her and hunt you; a nymph's bite POISONS you for a moment (js/predator.js bite → js/combat.js playerPoison). They are brood: the purification thins them with the rest.
//   FRANTIC  at `frantic.at` of her health, ONCE: the wave timer stops and a wave that was due is cancelled ("no new periodic ant waves after this point"); she leaves her post and ROAMS the sewer (bossWanderTarget:
//            anywhere within `frantic.roam` tiles of her post, so the drone's passage stays out of her way) at `frantic.speed` times her pace, chasing whatever provokes her like any creature; let go beyond her leash
//            she only roams again, and she never sleeps again. The way in: lure her off the console, sleep her (about 5 s), install (about 10 s: js/quests.js QUEST_PURIFY.install) while your followers hold her.
//            A hit on you does not cancel the install (js/stations.js facilityRelayTick); walking away does.
//   RESOLVED as before: the water clean calms her, alive, at her post (bossCalm); killed, defeated. Either way Booster Pack 2 unlocks (bossAnyResolved, js/cards.js).
// THE ANT NEST'S QUEEN (docs/NEST.md, step B, build 2026-11-07mm; the owner, 2026-11-07: "a boss ant that's huge", "Mandible crush, Tremor stomp, Brood call", "Huge, medium fight"): THE ANT QUEEN, the row `nest`, a
// TEST boss (`test`): the Nest is where the player tries squads and moves on her. Every number of hers is PROVISIONAL (the agent's), the owner's to change.
//   HER       three times the Toxic Queen's size (`size`: her drawing; `bodyR`: her body's reach in tiles, so a follower strikes her edge, a shot hits her body and her own bite reaches from it); health for a fight of
//             one to two minutes with a good squad (`hpMul` on the ant species' boss block at her level). She walks after whoever she fights, slowly, in her own room.
//   SHE IS    THERE whenever you come down: a fresh queen, asleep at her post, each time you come into the Nest and she is not alive (killed, or never armed); she wakes when she is hit or one of yours comes near
//             her (`wakeNear` tiles from her body); held to the Nest: when you leave it she lets go, walks back to her post and sleeps again there, her wounds kept.
//   MOVES     three, with independent timers (`moves`): the MANDIBLE CRUSH, at whoever of yours is in reach of her jaws: a wedge on the floor in front of her for `crush.windup` frames while she stands rooted, then
//             her jaws close on everyone of yours in it (crushing damage; you: one of your hits); the TREMOR STOMP, when one of yours is within `stomp.trigger` tiles of her body: she rears up for `stomp.windup`
//             frames, a ring on the floor showing how far it reaches, then the ground shakes: everyone of yours within the ring is hurt (earthquake damage) and thrown back (you: one of your hits); the BROOD
//             CALL, every `brood.every` frames once she is awake: ants climb out of the Nest's brood holes (`brood.n`, never more than `brood.cap` of hers alive) and go for you.
//   NOTHING   she or her brood leave pays (no shards, DNA or XP: `noReward`, js/drops.js and js/levels.js), and beating her unlocks nothing (bossAnyResolved leaves a test boss out): a test ground.
const HP_MUL_NEST = 1.6;   // THE ANT QUEEN's health: 1.6 times the ant boss block at her level (1067 at level 10). PROVISIONAL, measured (docs/NEST.md): three evolved followers at level 15 dealt her 15 to 18 a second, her moves off
const BOSS_ENCOUNTERS = {
    sewer_cistern: { id: "sewer_cistern", domain: "sewers", room: "sewers", name: "THE TOXIC ANT QUEEN",
        species: "ant", cls: "boss", element: "toxic", level: 8,   // the owner, 2026-11-07: "Harder" (it was 6). PROVISIONAL before: the ant species' boss block (js/species.js: 500 health, power 60, mandible frenzy) at level 6; the archive leaves the boss's numbers open ("measure the live game first")
        lair: F => { const m = F.solids.find(q => q.id === "purifier_mount"); return m && m.bb ? [(m.bb[0] + m.bb[2]) / 2 + 1.6, (m.bb[1] + m.bb[3]) / 2] : null; },   // her POST: beside the console on the Nest's trash dam, east of it (the blockage: she sits on the work)
        mount: "st_purifier",     // the station she keeps (js/stations.js): the purification module's mount at the head of the sump
        guard: 2.5,               // PROVISIONAL: within this of the console, awake and not controlled, she holds the install (the archive's "a couple of tiles")
        leash: 15,                // tiles from her post: a player further off is let go (rooted: she sleeps again; frantic: she roams). PROVISIONAL: the whole Nest (its farthest floor, the causeway's end at the gate, is 13.5 tiles from her post since 2026-11-01: facilitySewerMeasures().farFromPost)
        attacks: {
            bomb: { every: 1800, windup: 60, flight: 60, radius: 1.6, range: 12, power: 1.5 },   // the owner, 2026-11-07: "Harder": every 30 s (the archive's 45 s before); PROVISIONAL: a second of wind-up, a second in the air, a 1.6-tile burst, 12 tiles of reach, 1.5 × her power on a follower (you: one hit)
            spit: { trigger: 3, cooldown: 360, windup: 30, flight: 30, radius: 1.0, power: 0.8 },   // the owner, 2026-11-07: "Harder": every 6 s (the archive's 10 s cooldown before), "only while the player is within its close-range trigger"; PROVISIONAL: 3 tiles, half a second each way, a tile's burst
        },
        waves: { n: 6, first: 1800, every: 1500, table: "queen", near: [1.5, 3.5] },   // the owner, 2026-11-07: "Harder": 6 every 25 s (the archive's 30 s and "start at 4" before); PROVISIONAL: the first wave 30 s after she wakes, within a few tiles of her. WHAT comes is her table's (js/population.js SPAWN_TABLES.queen: toxic nymphs of level 2 to 3)
        frantic: { at: 0.5, speed: 3, roam: 15 },   // the archive's 50%; PROVISIONAL: three times her pace (her own would never get her anywhere), roaming within 15 tiles of her post (the Nest's trash dam and causeway; Side Quest's platform is twice as far)
        quest: "purify", wakes: ["install", "hit"], calms: ["purified"],
        note: "The Sewers' boss, behind the boss gate: the user's toxic ant boss (2026-10-31), named after the archive's proposed progression (the Toxic Ant Queen of the Sewers, Stage 3); provisional. The purification module's install wakes her; clean water calms her." },
    nest: { id: "nest", domain: "nest_area", room: "nest_area", name: "THE ANT QUEEN", species: "ant", cls: "boss", element: null, level: 10, test: true,
        lair: F => { const N = F.byId.get("nest_area"); return N ? [(N.bb[0] + N.bb[2]) / 2, N.bb[1] + (N.bb[3] - N.bb[1]) * 0.62] : null; },   // her POST: the middle of the cavern, a little south (the tunnel mouth is in its north wall)
        size: 3, bodyR: 1.2, hpMul: HP_MUL_NEST, wakeNear: 2.5,
        mount: null, guard: 0, leash: 0, attacks: null, waves: null, frantic: null,
        moves: {
            crush: { every: 360, windup: 54, reach: 2.0, arc: 1.0, power: 0.4 },       // every 6 s at most, 0.9 s of wind-up, 2 tiles past her body, a wedge 115 degrees wide, 0.4 × her power (32 at level 10: about half a level-15 brawler's health)
            stomp: { every: 720, windup: 72, trigger: 3.0, radius: 3.6, power: 0.25, push: 0.35 },   // every 12 s at most, 1.2 s of wind-up, when one of yours is within 3 tiles of her body; 3.6 tiles past it, 0.25 × her power (20 at level 10); thrown back
            brood: { first: 900, every: 1500, n: 3, cap: 6, classes: { scout: 3, striker: 1 }, below: [5, 3] },   // 15 s after she wakes, then every 25 s: 3 ants, scouts and the odd striker (never more than 6 of hers alive), 5 to 3 levels under hers
        },
        quest: null, wakes: ["hit", "near"], calms: [],
        note: "THE ANT QUEEN of the Ant Nest (docs/NEST.md): the archive's proposed first nest boss (Stage 1 of the faction progression), built as the Nest's test boss (the owner, 2026-11-07). Every number is provisional." },
};
const BOSS_HOME = 1.2;   // tiles from its post: home (a rooted boss sleeps again there)
const BOSS_COL = "#8cff5a";   // the toxic green of her bombs and her brood's call
let bossShots = [];           // what a boss has in the air: { kind, by, x0, y0, x1, y1, t0, until, radius, dmg }

function _bossFrame() { return typeof frame !== "undefined" ? frame : 0; }
function bossEnc(id) { return BOSS_ENCOUNTERS[id] || null; }
function bossState(id) {
    if (typeof _fp === "undefined" || !_fp) return null;
    if (!_fp.bosses) _fp.bosses = {};
    if (!_fp.bosses[id]) _fp.bosses[id] = { state: "idle", outcome: null, started: 0, defeated: 0, unit: null, frantic: false, cast: null, waveAt: null, bombAt: null, spitAt: null, waves: 0 };
    return _fp.bosses[id];
}
function bossReset() { if (typeof _fp !== "undefined" && _fp) _fp.bosses = {}; bossShots = []; }
function bossUnit(id) { const S = bossState(id); return S && S.unit && !S.unit.dead ? S.unit : null; }
function bossSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 130, text, color: col || "#ff6a4a", life: 240, vy: -0.05, size: 15 }); }
function _bossName(E) { return E && E.name || "THE BOSS"; }
// a spot of the map an encounter names (its post), on floor a body can stand on
function _bossSpot(fn) {
    if (!fn || typeof _fp === "undefined" || !_fp || !_fp.F) return null;
    let p = fn(_fp.F); if (!p) return null;
    if (typeof facilityStandOk === "function" && !facilityStandOk(p[0], p[1]) && typeof _fpNearestCell === "function") { const c = _fpNearestCell(p[0], p[1]); if (c) p = [c[0], c[1]]; }
    return p;
}
function bossLair(E) { return E ? _bossSpot(E.lair) : null; }
// the station a boss keeps (its mount), as the stations list has it: { x, y, bb } or null
function bossMount(E) { return E && E.mount && typeof _fp !== "undefined" && _fp && _fp.stations ? _fp.stations.find(s => s.id === E.mount) || null : null; }
// has any encounter been resolved, calm or defeated? (js/cards.js: Booster Pack 2 unlocks after the first boss; the user: a spared boss counts, 2026-10-31)
function bossAnyResolved() { const B = typeof _fp !== "undefined" && _fp && _fp.bosses || {}; return Object.keys(B).some(id => B[id].state === "resolved" && !(BOSS_ENCOUNTERS[id] && BOSS_ENCOUNTERS[id].test)); }   // (a test boss, the Ant Nest's queen, counts for nothing)
// the creature, at its post: asleep (ARMED) or calm (RESOLVED calm); null when the encounter has no boss or the world cannot hold it
function _bossSpawn(E, how) {
    if (!E || !E.species || typeof spawnCreature !== "function") return null;
    const at = bossLair(E); if (!at) return null;
    const S0 = bossState(E.id), lvl = (S0 && S0.level) || E.level || 1;   // (a level set for this encounter: the Nest's console, step C)
    let b = null; try { b = spawnCreature({ species: E.species, className: E.cls || "boss", x: at[0], y: at[1], level: lvl, state: "wander" }); } catch (e) { b = null; }
    if (!b) return null;
    if (E.size && b.dimensions) { b.dimensions.width *= E.size; b.dimensions.height *= E.size; }   // HUGE: drawn at `size` times (js/bugs3d.js scales by her width)
    if (E.bodyR) { b.bodyR = E.bodyR; b.biteReach = ((typeof COMBAT !== "undefined" && COMBAT.bite && COMBAT.bite.reach) || 1) + E.bodyR; }   // her body's reach: a follower strikes her edge, a shot her body, her bite reaches from it (js/npc.js, js/game.js)
    if (E.hpMul && E.hpMul !== 1) { b.maxHealth = Math.round(b.maxHealth * E.hpMul); b.health = b.maxHealth; }
    if (E.test) b.noReward = true;   // a test boss pays nothing (js/drops.js, js/levels.js)
    if (E.moves) { b.noBite = true; b.abilityDef = null; }   // her moves are all she has: no plain bite (the crush is her bite: js/predator.js), no species special
    b.fpCreature = true; b.homeRoom = E.room; b.bossId = E.id; b.bossName = E.name || null; b.element = E.element || null; b.spawnProtection = 0; b.provoked = false; b.currentTarget = null;
    b._bossPace = b.baseMoveSpeed || b.moveSpeed || 0.008;   // (her true pace: frantic she runs faster than it, and _bossLetGo gives it back)
    b.bossAsleep = how !== "calm"; b.bossCalm = how === "calm"; b.bossRooted = false; b.bossFrantic = false; b.wanderTarget = { x: at[0], y: at[1], rest: 1e9 }; b.wanderTimer = 1e9;
    return b;
}
// ARM: the boss is spawned asleep at its post (the gate's seal broken, js/quests.js); once
function bossArm(id) {
    const E = bossEnc(id), S = bossState(id); if (!E || !S || !E.species) return false;
    if (S.state !== "idle") return false;
    const b = _bossSpawn(E, "asleep"); if (!b) return false;
    S.unit = b; S.state = "armed"; S.frantic = false; S.cast = null; S.waveAt = null; S.bombAt = null; S.spitAt = null; S.waves = 0; S.crushAt = null; S.stompAt = null; S.broodAt = null; return true;
}
// WAKE: it fights (the install begins, or it is hit); rooted at its post, its timers started; the quest line is told the encounter has started
function bossWake(id, why) {
    const E = bossEnc(id), S = bossState(id), b = bossUnit(id); if (!E || !S || !b || S.state === "resolved") return false;
    if (S.state === "active" && !b.bossAsleep) return false;
    const f = _bossFrame();
    S.state = "active"; S.started = S.started || Math.max(1, f); b.bossAsleep = false; b.bossCalm = false;
    if (!S.frantic) { b.bossRooted = !!E.frantic; if (E.waves) S.waveAt = f + E.waves.first; }
    if (E.attacks) { S.bombAt = f + E.attacks.bomb.every; S.spitAt = f; } S.cast = null;
    _bossHunt(b);
    bossSay("⚠ " + _bossName(E) + (why === "ambush" ? " COMES OUT" : " WAKES" + (why === "install" ? " — SHE SITS AT THE CONSOLE" : "")), "#ff6a4a");   // (ambush: the purification's, js/quests.js)
    if (typeof questBossStarted === "function") questBossStarted(id);
    return true;
}
// after the player: provoked, the player its prey when it may be
function _bossHunt(b) {
    b.provoked = true; b.lastAttacker = typeof player !== "undefined" ? player : null;
    if (typeof player !== "undefined" && typeof predatorPreyOk === "function" && predatorPreyOk(b, player)) { b.currentTarget = player; b._prey = player; }
    b.state = "hunt"; b.wanderTimer = 0;
}
// its pace now: its own, or `frantic.speed` times it while frantic (js/predator.js walks a wanderer and a hunter by moveSpeed, and a chaser by baseMoveSpeed: both are set)
function _bossRun(E, S, b) { const base = b._bossPace || b.baseMoveSpeed || 0.008, k = S && S.frantic && E && E.frantic ? E.frantic.speed : 1; b.moveSpeed = b.baseMoveSpeed = base * (k || 1); }
// out of its fight and on its way somewhere (`at`, or wherever its wander takes it): the prey let go, the bite's root lifted (js/predator.js parks moveSpeed at 0 while it attacks and gives it back when it calms by itself; a boss we move by hand needs it back too)
function _bossLetGo(E, S, b, at) {
    b.provoked = false; b.currentTarget = null; b._prey = null; b.attackWindup = 0; b.biteTarget = null; b.attackAnim = 0;
    _bossRun(E, S, b);
    b.state = "wander"; b.wanderTarget = at ? { x: at[0], y: at[1], rest: 1e9 } : null; b.wanderTimer = at ? 1e9 : 0;
}
// what it has in the air falls short (a sleep, a calm, a death)
function _bossDropShots(b) {
    if (!bossShots.length) return 0; let n = 0;
    bossShots = bossShots.filter(s => { if (s.by !== b) return true; n++; if (typeof elementEffects !== "undefined") { const t = Math.max(0, Math.min(1, (_bossFrame() - s.t0) / (s.until - s.t0))); elementEffects.push({ type: "impact", x: s.x0 + (s.x1 - s.x0) * t, y: s.y0 + (s.y1 - s.y0) * t, color: BOSS_COL, radius: 0.4, life: 12 }); } return false; });
    return n;
}
// CALM: the clean water settles it: it goes to its post, hunts nothing, keeps its post alive (the non-lethal resolution); nothing when it is dead already
function bossCalm(id) {
    const E = bossEnc(id), S = bossState(id); if (!E || !S) return false;
    const b = bossUnit(id);
    if (!b) { if (S.state !== "resolved" && S.state !== "idle") { S.state = "resolved"; S.outcome = S.outcome || "defeated"; } return false; }
    if (S.state === "resolved" && S.outcome) return false;
    b.bossCalm = true; b.bossAsleep = false; b.bossRooted = false; b.bossFrantic = false; S.frantic = false; S.cast = null; S.waveAt = null; _bossDropShots(b);
    _bossLetGo(E, S, b, bossLair(E));
    S.state = "resolved"; S.outcome = "calm";
    bossSay("◈ " + _bossName(E) + " SETTLES BY THE CONSOLE — SHE IS CALM", "#9dffb6");
    if (typeof questBossResolved === "function") questBossResolved(id, "calm");
    return true;
}
// is the boss held still by a control effect (a stun, a freeze, a glitch, a sleep: js/combat.js)? Then it keeps nothing and throws nothing: the window to install
function bossControlled(b) { return !!b && !b.dead && (b.stunned > 0 || b.frozen === true || b.glitched > 0 || b.asleep > 0); }
// is the boss frantic (at or under its frantic share of health, once)?
function bossIsFrantic(id) { const S = bossState(id); return !!(S && S.frantic); }
// why the install at the mount cannot go on this frame, or null when it can (js/quests.js questMountBlocked ← js/stations.js the mount's blockFn): the boss awake, uncontrolled, within its guard of the console
function bossInstallBlocked(id) {
    const E = bossEnc(id), S = bossState(id), b = bossUnit(id); if (!E || !S || !b || !(E.guard > 0)) return null;
    if (S.state !== "active" || b.bossAsleep || b.bossCalm) return null;
    if (bossControlled(b)) return null;
    const m = bossMount(E); if (!m) return null;
    if (Math.hypot(b.x - m.x, b.y - m.y) > E.guard) return null;
    const name = _bossName(E);
    return S.frantic ? name + " IS AT THE CONSOLE · LURE HER OFF, OR SLEEP, STUN, FREEZE OR GLITCH HER" : name + " SITS AT THE CONSOLE · SLEEP, STUN, FREEZE OR GLITCH HER, OR DRIVE HER TO HALF HER HEALTH";
}
// A SLEEP on a boss (js/combat.js applySleep): its wind-up is cancelled, what it has in the air falls short, and both its projectile timers go back to the full (the archive: "sleep resets both projectile timers")
function bossOnSleep(b) {
    const E = b && b.bossId ? bossEnc(b.bossId) : null, S = b && b.bossId ? bossState(b.bossId) : null; if (!E || !S) return false;
    S.cast = null; _bossDropShots(b);
    if (E.attacks) { const f = _bossFrame(); S.bombAt = f + E.attacks.bomb.every; S.spitAt = f + E.attacks.spit.cooldown; }
    return true;
}
// whom a boss throws at: what it is fighting, or whoever last hit it, or you; within `range`, in its room, and something it may hurt. A shot is a lob: it needs no line along the floor (the console between her post and the
// player's side of it is a low prop, and the floor's line of sight, _fpLos, stops at anything that is not floor), only the same room
function _bossRangedTarget(b, range) {
    const E = bossEnc(b.bossId), cands = [b.currentTarget, b.lastAttacker, typeof player !== "undefined" ? player : null];
    for (const t of cands) {
        if (!t || t.dead || !Number.isFinite(t.x)) continue;
        if (typeof predatorPreyOk === "function" && !predatorPreyOk(b, t)) continue;
        if (Math.hypot(t.x - b.x, t.y - b.y) > range) continue;
        if (E && typeof partyRoomAt === "function" && partyRoomAt(t.x, t.y) !== E.room) continue;
        return t;
    }
    return null;
}
// THE ATTACKS, each frame it is active: a wind-up under way is turned with its target and let go at its end; else the bomb when its timer is up and there is someone to throw at; else the spit while you are close and its cooldown is over
function _bossAttacksTick(E, S, b) {
    const A = E.attacks; if (!A) return;
    const f = _bossFrame();
    if (bossControlled(b)) { S.cast = null; return; }   // (held: nothing is wound up or thrown; a sleep has reset the timers too, bossOnSleep)
    if (S.cast) {
        const c = S.cast, t = c.target;
        if (t && !t.dead && Number.isFinite(t.x)) { c.aim = [t.x, t.y]; if (typeof faceToward === "function") faceToward(b, t.x, t.y, 0.3); }
        if (f >= c.until) { _bossLaunch(E, S, b, c); S.cast = null; }
        return;
    }
    if (S.bombAt === null || S.bombAt === undefined) S.bombAt = f + A.bomb.every;
    if (S.spitAt === null || S.spitAt === undefined) S.spitAt = f;
    if (f >= S.bombAt) {
        const t = _bossRangedTarget(b, A.bomb.range);
        if (t) { S.cast = { kind: "bomb", t0: f, until: f + A.bomb.windup, target: t, aim: [t.x, t.y] }; S.bombAt = f + A.bomb.every; bossSay("⚠ " + _bossName(E) + " WINDS UP A TOXIC BOMB — MOVE", BOSS_COL); if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: b.x, y: b.y, color: BOSS_COL, radius: 0.8, life: 18 }); return; }
    }
    if (f >= S.spitAt && typeof player !== "undefined" && Math.hypot(player.x - b.x, player.y - b.y) <= A.spit.trigger && (typeof predatorPreyOk !== "function" || predatorPreyOk(b, player)) && (typeof partyRoomAt !== "function" || partyRoomAt(player.x, player.y) === E.room)) {
        S.cast = { kind: "spit", t0: f, until: f + A.spit.windup, target: player, aim: [player.x, player.y] }; S.spitAt = f + A.spit.cooldown;
        if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: b.x, y: b.y, text: "SPIT!", color: BOSS_COL, life: 36, vy: -0.05, size: 11 });
    }
}
// a shot leaves her: it lands where its target stood at this moment, `flight` frames on
function _bossLaunch(E, S, b, c) {
    const A = E.attacks[c.kind], f = _bossFrame();
    bossShots.push({ kind: c.kind, by: b, x0: b.x, y0: b.y, x1: c.aim[0], y1: c.aim[1], t0: f, until: f + A.flight, radius: A.radius, dmg: (b.power || 60) * A.power });
}
// the shots in the air: landed, each bursts on whoever of yours is within its radius (you: one of your hits, and a step away from it; a follower or clone: toxic damage)
function _bossShotsTick() {
    if (!bossShots.length) return;
    const f = _bossFrame();
    for (const s of bossShots) if (f >= s.until) _bossImpact(s);
    bossShots = bossShots.filter(s => f < s.until);
}
function _bossImpact(s) {
    const x = s.x1, y = s.y1, R = s.radius;
    if (typeof actors !== "undefined") for (const a of actors) { if (!a || a.dead || a.team !== "green" || !(a.isFollower || a.isClone) || a.untargetable) continue; if (Math.hypot(a.x - x, a.y - y) > R) continue; if (typeof applyDamage === "function") applyDamage(a, s.dmg, s.by, "toxic", false, false, s.kind === "spit" ? DMG_HIT_ENEMY.projectile : DMG_HIT_ENEMY.earthquake); }
    if (typeof player !== "undefined" && Math.hypot(player.x - x, player.y - y) <= R && typeof hurtPlayer === "function" && (typeof predatorMayHurtPlayer !== "function" || predatorMayHurtPlayer())) { if (hurtPlayer(1, 7, { x, y })) { if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: player.x, y: player.y, text: "TOXIC BURST", color: BOSS_COL, life: 40, vy: -0.05, size: 12 }); } }
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x, y, color: BOSS_COL, radius: Math.max(0.6, R * 0.6), life: 22, element: "toxic" });
    if (typeof shake !== "undefined" && s.kind === "bomb") shake = Math.max(shake || 0, 5);
}
// THE WAVES, while rooted and in combat: `waves.n` nymphs of its species and element come up beside it and go for you
function _bossWavesTick(E, S, b) {
    const W = E.waves; if (!W || S.frantic) return;
    const f = _bossFrame();
    if (S.waveAt === null || S.waveAt === undefined) S.waveAt = f + W.first;
    if (f < S.waveAt) return;
    S.waveAt = f + W.every; _bossWave(E, S, b);
}
function _bossWave(E, S, b) {
    const W = E.waves; if (!W || typeof facilitySpawnCreature !== "function" || typeof partyRoomCells !== "function") return 0;
    const P = W.table ? { room: E.room, table: W.table, minFromPlayer: 0, spacing: 0.6, wander: [3, 9] } : { room: E.room, species: [E.species], classes: W.classes, levels: W.levels, element: E.element, brood: true, minFromPlayer: 0, spacing: 0.6, wander: [3, 9] };   // (what comes: the encounter's table, js/population.js; a row with none says it itself)
    const cm = typeof _fpComps === "function" ? _fpComps() : null, here = cm && typeof _fpNearestCell === "function" && typeof player !== "undefined" ? (typeof _fpNearestCellOpen === "function" ? _fpNearestCellOpen : _fpNearestCell)(player.visualX, player.visualY) : null, hc = here ? cm.get(here[0] + "," + here[1]) : undefined;
    const spots = partyRoomCells(E.room).filter(c => { const d = Math.hypot(c[0] - b.x, c[1] - b.y); return d >= W.near[0] && d <= W.near[1] && (hc === undefined || cm.get(c[0] + "," + c[1]) === hc); });
    let n = 0;
    for (let i = 0; i < W.n && spots.length; i++) {
        const c = spots[Math.floor(Math.random() * spots.length)];
        let p = null; try { p = facilitySpawnCreature(W.table ? null : E.species, [c[0], c[1]], P); } catch (e) { p = null; }
        if (!p) continue;
        p.bossWave = E.id; p.provoked = true; p.lastAttacker = typeof player !== "undefined" ? player : null; p.spawnProtection = 0;
        if (typeof player !== "undefined" && typeof predatorPreyOk === "function" && predatorPreyOk(p, player)) { p.currentTarget = player; p._prey = player; p.state = "attack"; }
        n++;
    }
    if (n) { S.waves++; bossSay("⚠ " + _bossName(E) + " CALLS HER BROOD — " + n + " TOXIC NYMPHS", BOSS_COL); }
    return n;
}
// FRANTIC, once: the waves stop (a wave that was due is cancelled), she leaves the post and roams at her frantic pace
function _bossFrantic(E, S, b) {
    S.frantic = true; S.waveAt = null; b.bossRooted = false; b.bossFrantic = true;
    _bossRun(E, S, b); if (b.state === "wander") b.wanderTimer = 0;   // (her next wander is a roam, not her post)
    bossSay("⚠ " + _bossName(E) + " IS FRANTIC — SHE LEAVES THE CONSOLE AND ROAMS THE SEWER", "#ffb347");
}
// each frame (js/facilitytutorial.js): a death, a hit on a sleeper, the frantic turn, the attacks, the waves, the leash, going home; then the shots in the air
function bossTick() {
    if (typeof _fp === "undefined" || !_fp || typeof player === "undefined") { _bossShotsTick(); return; }
    _bossTestEntry();
    if (!_fp.bosses) { _bossShotsTick(); return; }
    for (const id of Object.keys(_fp.bosses)) {
        const E = bossEnc(id), S = _fp.bosses[id], b = S.unit; if (!E || !b) continue;
        if (b.dead) {   // DEFEATED: the game's own kill paid it (js/drops.js); recorded whatever the state was
            S.unit = null; S.defeated = S.defeated || Math.max(1, _bossFrame()); S.cast = null; S.waveAt = null; _bossDropShots(b);
            if (S.state !== "resolved") { S.state = "resolved"; S.outcome = "defeated"; bossSay("◈ " + _bossName(E) + " IS DEFEATED", "#9dffb6"); }
            if (typeof questBossResolved === "function") questBossResolved(id, "defeated");
            continue;
        }
        if (E.moves) { _bossNestTick(E, S, b); continue; }   // THE ANT QUEEN's rules (below)
        const at = bossLair(E) || [b.x, b.y], dp = Math.hypot(player.x - at[0], player.y - at[1]), home = Math.hypot(b.x - at[0], b.y - at[1]) <= BOSS_HOME;
        if (S.state === "armed" && b.bossAsleep && b.provoked) { bossWake(id, "hit"); continue; }   // a sleeper hit wakes
        if (S.state === "active") {
            if (E.frantic && !S.frantic && b.health <= b.maxHealth * E.frantic.at) _bossFrantic(E, S, b);
            _bossAttacksTick(E, S, b); _bossWavesTick(E, S, b);
            if (S.frantic) { if (dp > E.leash && b.provoked) _bossLetGo(E, S, b, null); }   // let go: she roams (bossWanderTarget); she does not sleep again
            else {
                if (dp <= E.leash) { if (!b.provoked) _bossHunt(b); }   // the pressure: while you are in her domain she is after you (rooted: she turns on you, and throws)
                else if (b.provoked || !home) _bossLetGo(E, S, b, at);   // let go: she walks back to her post
                if (dp > E.leash && home && !b.provoked) { b.bossAsleep = true; b.bossRooted = false; S.state = "armed"; S.cast = null; S.waveAt = null; bossSay(_bossName(E) + " SLEEPS AGAIN", "#8aa0c8"); }
            }
        }
        if (b.bossCalm && !b.provoked && !home && b.state === "wander" && !(b.wanderTarget && b.wanderTarget.rest === 1e9)) _bossLetGo(E, S, b, at);   // a calm boss keeps to its post (its fight over, it walks back)
    }
    _bossShotsTick();
}
// ── THE ANT QUEEN (the `test` rows with `moves`: the Ant Nest's) ──
// a fresh queen each time you come down into her room and she is not alive (killed, or never armed): asleep at her post, whole, at the encounter's level
function _bossTestEntry() {
    for (const id of Object.keys(BOSS_ENCOUNTERS)) {
        const E = BOSS_ENCOUNTERS[id]; if (!E.test) continue;
        const inside = typeof partyRoomAt === "function" && partyRoomAt(player.x, player.y) === E.room;
        const S = inside || (_fp.bosses && _fp.bosses[id]) ? bossState(id) : null; if (!S) continue;
        if (inside && !S.inRoom && !bossUnit(id)) { S.state = "idle"; S.outcome = null; S.unit = null; S.cast = null; bossArm(id); }
        S.inRoom = inside;
    }
}
// the nearest of yours (you, a follower, a clone) within `r` tiles of her middle, in her room, that she may hurt; with `all`, every one of them
function _bossYoursNear(b, r, all) {
    const E = bossEnc(b.bossId), out = [], cand = [typeof player !== "undefined" ? player : null].concat(typeof actors !== "undefined" ? actors.filter(a => a && !a.dead && a.team === "green" && (a.isFollower || a.isClone) && !a.untargetable) : []);
    let best = null, bd = 1e9;
    for (const t of cand) {
        if (!t || !Number.isFinite(t.x)) continue;
        const d = Math.hypot(t.x - b.x, t.y - b.y); if (d > r) continue;
        if (E && typeof partyRoomAt === "function" && partyRoomAt(t.x, t.y) !== E.room) continue;
        if (t === player ? (typeof predatorMayHurtPlayer === "function" && !predatorMayHurtPlayer()) : (typeof predatorPreyOk === "function" && !predatorPreyOk(b, t))) continue;
        out.push(t); if (d < bd) { bd = d; best = t; }
    }
    return all ? out : best;
}
// held still while she winds up (the creature's walk reads both paces: js/predator.js); _bossRun gives them back
function _bossHold(b) { b.moveSpeed = 0; b.baseMoveSpeed = 0; }
function _bossNestTick(E, S, b) {
    const at = bossLair(E) || [b.x, b.y], home = Math.hypot(b.x - at[0], b.y - at[1]) <= BOSS_HOME, inside = typeof partyRoomAt !== "function" || partyRoomAt(player.x, player.y) === E.room;
    if (S.state === "armed" && b.bossAsleep) {
        if (b.provoked) { bossWake(E.id, "hit"); return; }
        if (inside && _bossYoursNear(b, (E.wakeNear || 2) + (E.bodyR || 0))) { bossWake(E.id, "near"); }
        return;
    }
    if (S.state !== "active") return;
    if (!inside) {   // you left her room: she lets go, walks back to her post and sleeps again there (her wounds kept)
        if (S.cast) { S.cast = null; _bossRun(E, S, b); }
        if (b.provoked) _bossLetGo(E, S, b, at);
        else if (home) { b.bossAsleep = true; S.state = "armed"; S.crushAt = S.stompAt = S.broodAt = null; bossSay(_bossName(E) + " SLEEPS AGAIN", "#8aa0c8"); }
        else if (b.state !== "wander" || !b.wanderTarget) _bossLetGo(E, S, b, at);
        return;
    }
    if (!b.provoked) _bossHunt(b);
    _bossMovesTick(E, S, b);
}
// HER MOVES each frame she is awake: a wind-up under way holds her and goes off at its end; else the brood when it is due, the stomp when one of yours is close and it is ready, the crush when one is in reach of her jaws
function _bossMovesTick(E, S, b) {
    const M = E.moves, f = _bossFrame(), R = E.bodyR || 0;
    if (bossControlled(b)) { if (S.cast) { S.cast = null; _bossRun(E, S, b); } return; }   // (held by a stun, a freeze, a glitch or a sleep: the wind-up is lost)
    if (S.cast) {
        _bossHold(b);
        if (f >= S.cast.until) { const c = S.cast; S.cast = null; _bossRun(E, S, b); if (c.kind === "crush") _bossCrush(E, b, c); else _bossStomp(E, b); }
        return;
    }
    if (S.crushAt === null || S.crushAt === undefined) S.crushAt = f + 60;
    if (S.stompAt === null || S.stompAt === undefined) S.stompAt = f + Math.round(M.stomp.every / 2);
    if (S.broodAt === null || S.broodAt === undefined) S.broodAt = f + M.brood.first;
    if (f >= S.broodAt) { S.broodAt = f + M.brood.every; _bossBrood(E, b); }
    if (f >= S.stompAt && _bossYoursNear(b, M.stomp.trigger + R)) {
        S.cast = { kind: "stomp", t0: f, until: f + M.stomp.windup }; S.stompAt = f + M.stomp.every; _bossHold(b);
        bossSay("⚠ " + _bossName(E) + " REARS UP — TREMOR STOMP · GET CLEAR", "#ffb347"); return;
    }
    const t = f >= S.crushAt ? _bossYoursNear(b, M.crush.reach + R) : null;
    if (t) {
        S.cast = { kind: "crush", t0: f, until: f + M.crush.windup, dir: Math.atan2(t.y - b.y, t.x - b.x), x: b.x, y: b.y }; S.crushAt = f + M.crush.every; _bossHold(b);
        if (typeof faceToward === "function") faceToward(b, t.x, t.y, 1);
        if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: b.x, y: b.y, text: "MANDIBLE CRUSH!", color: "#ff6a4a", life: 50, vy: -0.05, size: 13 });
    }
}
// is (x, y) in the wedge in front of her (from her middle at `c`, along `dir`, `arc` radians either side, out to `r` tiles)?
function _bossInWedge(c, x, y, r, arc) { const dx = x - c.x, dy = y - c.y, d = Math.hypot(dx, dy); if (d > r) return false; if (d < 0.6) return true; let a = Math.atan2(dy, dx) - c.dir; while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return Math.abs(a) <= arc; }
function _bossCrush(E, b, c) {
    const M = E.moves.crush, r = M.reach + (E.bodyR || 0), dmg = (b.power || 60) * M.power;
    for (const t of _bossYoursNear(b, r + 0.5, true)) {
        if (!_bossInWedge(c, t.x, t.y, r, M.arc)) continue;
        if (t === player) { if (typeof hurtPlayer === "function" && hurtPlayer(1, 8, { x: b.x, y: b.y }) && typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: player.x, y: player.y, text: "CRUSHED", color: "#ff6a4a", life: 40, vy: -0.05, size: 12 }); }
        else if (typeof applyDamage === "function") applyDamage(t, dmg, b, null, false, false, typeof DMG_HIT_ENEMY !== "undefined" ? DMG_HIT_ENEMY.crushing : null);
    }
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: c.x + Math.cos(c.dir) * r * 0.6, y: c.y + Math.sin(c.dir) * r * 0.6, color: "#ff8a5a", radius: 1.1, life: 18 });
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 4);
}
function _bossStomp(E, b) {
    const M = E.moves.stomp, r = M.radius + (E.bodyR || 0), dmg = (b.power || 60) * M.power;
    for (const t of _bossYoursNear(b, r, true)) {
        if (t === player) { if (typeof hurtPlayer === "function" && hurtPlayer(1, 10, { x: b.x, y: b.y }) && typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: player.x, y: player.y, text: "TREMOR", color: "#ffb347", life: 40, vy: -0.05, size: 12 }); continue; }
        if (typeof applyDamage === "function") applyDamage(t, dmg, b, null, false, false, typeof DMG_HIT_ENEMY !== "undefined" ? DMG_HIT_ENEMY.earthquake : null);
        if (typeof applyKnockback === "function") applyKnockback(t, b, M.push);
    }
    if (typeof elementEffects !== "undefined") { elementEffects.push({ type: "ring", x: b.x, y: b.y, radius: r, color: "#ffb347", life: 26 }); elementEffects.push({ type: "impact", x: b.x, y: b.y, color: "#c9a060", radius: 1.6, life: 22 }); }
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 9);
}
// THE BROOD CALL: ants climb out of the Nest's brood holes (a floor cell in front of each hole), as many as she may have alive, and go for you
function _bossBrood(E, b) {
    const M = E.moves.brood; if (typeof facilitySpawnCreature !== "function" || typeof facilityCreatures !== "function" || !_fp || !_fp.F) return 0;
    const mine = facilityCreatures(E.room).filter(a => a.bossWave === E.id).length, n = Math.min(M.n, M.cap - mine); if (n <= 0) return 0;
    const holes = _fp.F.decor.filter(d => d.room === E.room && d.kind === "brood_hole" && d.a && d.b), spots = [];
    for (const h of holes) {
        const mx = (h.a[0] + h.b[0]) / 2, my = (h.a[1] + h.b[1]) / 2, L = Math.hypot(h.b[0] - h.a[0], h.b[1] - h.a[1]) || 1; let nx = (h.b[1] - h.a[1]) / L, ny = -(h.b[0] - h.a[0]) / L; if (nx + ny < 0) { nx = -nx; ny = -ny; }   // (into the room: the side of the wall the camera sees)
        const c = typeof _fpNearestCell === "function" ? _fpNearestCell(mx + nx * 0.9, my + ny * 0.9) : null; if (c && partyRoomAt(c[0], c[1]) === E.room) spots.push(c);
    }
    if (!spots.length) return 0;
    const L0 = b.level || E.level || 1, P = { room: E.room, species: [E.species], classes: M.classes, levels: [Math.max(1, L0 - M.below[0]), Math.max(1, L0 - M.below[1])], element: null, minFromPlayer: 0, spacing: 0.6, wander: [3, 9] };
    let k = 0;
    for (let i = 0; i < n; i++) {
        const c = spots[(i + Math.floor(Math.random() * spots.length)) % spots.length];
        let p = null; try { p = facilitySpawnCreature(E.species, [c[0], c[1]], P); } catch (e) { p = null; }
        if (!p) continue;
        p.bossWave = E.id; p.noReward = !!E.test; p.provoked = true; p.lastAttacker = player; p.spawnProtection = 0;
        if (typeof predatorPreyOk === "function" && predatorPreyOk(p, player)) { p.currentTarget = player; p._prey = player; p.state = "attack"; }
        k++;
    }
    if (k) bossSay("⚠ " + _bossName(E) + " CALLS HER BROOD — " + k + " ANTS FROM THE BROOD HOLES", "#ffb347");
    return k;
}
// where a boss wanders (js/facilityspawn.js facilityWanderTarget asks): its post, and nowhere else, while it sleeps, is calm or is rooted; a roam within `frantic.roam` of its post while frantic
function bossWanderTarget(a) {
    if (!a || !a.bossId) return null;
    const E = bossEnc(a.bossId), S = bossState(a.bossId), at = bossLair(E);
    if (a.bossAsleep || a.bossCalm || a.bossRooted) return at ? { x: at[0], y: at[1], rest: 1e9 } : null;
    if (S && S.frantic && E && E.frantic && at && typeof partyRoomCells === "function") {
        const cells = partyRoomCells(E.room);
        for (let i = 0; i < 40 && cells.length; i++) {
            const c = cells[Math.floor(Math.random() * cells.length)], d = Math.hypot(c[0] - a.x, c[1] - a.y);
            if (d < 3 || d > 9 || Math.hypot(c[0] - at[0], c[1] - at[1]) > E.frantic.roam) continue;
            if (typeof _fpLos === "function" && !_fpLos(a.x, a.y, c[0], c[1])) continue;
            return { x: c[0], y: c[1] };
        }
        return { x: at[0], y: at[1] };
    }
    return null;
}
// is this creature a boss nobody should start on by itself? (js/helpers.js isHostileTarget: your followers and your gun's auto-lock leave a sleeping or calm boss alone; a tap on it, or an order, still fights it)
function bossPassive(a) { return !!(a && a.bossId && (a.bossAsleep || a.bossCalm) && !a.provoked); }
// ── over the scene (js/game.js, after the serum's overlay): a wind-up's ring where the shot will land and the word over her; each shot in the air with its shadow and its landing ring ──
function _bossScr(x, y, z) { return [(x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H - (z || 0) - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0)]; }
function _bossRing(x, y, r, k, col) {
    const [cx, cy] = _bossScr(x, y, 0), R = r * TILE_W * Math.SQRT2;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, TILE_H / TILE_W);
    ctx.globalAlpha = 0.35 + 0.45 * k; ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.1 + 0.28 * k; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, R * Math.max(0.05, k), 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}
// THE ANT QUEEN's wind-ups on the floor: the crush's wedge in front of her filling as it comes, the stomp's ring out to its reach closing in; the word over her
function _bossDrawMove(E, b, c, f) {
    const k = Math.max(0, Math.min(1, (f - c.t0) / Math.max(1, c.until - c.t0))), R = E.bodyR || 0;
    if (c.kind === "crush") {
        const M = E.moves.crush, r = M.reach + R, pts = [_bossScr(c.x, c.y, 0)];
        for (let i = 0; i <= 12; i++) { const a = c.dir - M.arc + 2 * M.arc * i / 12; pts.push(_bossScr(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r, 0)); }
        ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
        ctx.globalAlpha = 0.12 + 0.3 * k; ctx.fillStyle = "#ff5a3a"; ctx.fill(); ctx.globalAlpha = 0.45 + 0.45 * k; ctx.strokeStyle = "#ff8a5a"; ctx.lineWidth = 2.5; ctx.stroke(); ctx.globalAlpha = 1;
    } else { const M = E.moves.stomp; _bossRing(b.x, b.y, M.radius + R, k, "#ffb347"); }
    const [sx, sy] = _bossScr(b.x, b.y, 0); if (typeof cachedText === "function") cachedText(c.kind === "crush" ? "MANDIBLE CRUSH" : "TREMOR STOMP", "bold 13px monospace", c.kind === "crush" ? "#ff8a5a" : "#ffb347", sx, sy - 210);
}
function bossDrawOverlay() {
    if (typeof ctx === "undefined" || typeof canvas === "undefined" || !canvas || typeof player === "undefined" || typeof _fp === "undefined" || !_fp) return;
    const B = _fp.bosses || {}, f = _bossFrame(); let any = bossShots.length > 0;
    for (const id of Object.keys(B)) if (B[id].cast && B[id].unit && !B[id].unit.dead) any = true;
    if (!any) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const id of Object.keys(B)) {
        const S = B[id], E = bossEnc(id), b = S.unit, c = S.cast; if (!c || !b || b.dead || !E) continue;
        if (E.moves) { _bossDrawMove(E, b, c, f); continue; }
        if (!E.attacks) continue;
        const A = E.attacks[c.kind], k = Math.max(0, Math.min(1, (f - c.t0) / Math.max(1, c.until - c.t0)));
        _bossRing(c.aim[0], c.aim[1], A.radius, k, BOSS_COL);
        const [sx, sy] = _bossScr(b.x, b.y, 0); if (typeof cachedText === "function") cachedText(c.kind === "bomb" ? "TOXIC BOMB" : "SPIT", "bold 12px monospace", BOSS_COL, sx, sy - 162);
    }
    for (const s of bossShots) {
        const t = Math.max(0, Math.min(1, (f - s.t0) / Math.max(1, s.until - s.t0))), x = s.x0 + (s.x1 - s.x0) * t, y = s.y0 + (s.y1 - s.y0) * t, peak = s.kind === "bomb" ? 120 : 44, z = 34 * (1 - t) + peak * 4 * t * (1 - t), r = s.kind === "bomb" ? 9 : 5;
        _bossRing(s.x1, s.y1, s.radius, 1, BOSS_COL);
        const [gx, gy] = _bossScr(x, y, 0), [bx, by] = _bossScr(x, y, z);
        ctx.globalAlpha = 0.3; ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(gx, gy, r * 1.4, r * 0.6, 0, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.25; ctx.fillStyle = BOSS_COL; ctx.beginPath(); ctx.arc(bx, by, r * 1.9, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.95; ctx.fillStyle = "#5ad13a"; ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#e8ffd0"; ctx.beginPath(); ctx.arc(bx - r * 0.3, by - r * 0.3, r * 0.4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}
// ── the save (js/facilitysave.js) ──
function bossSnapshot() { const out = {}, B = typeof _fp !== "undefined" && _fp && _fp.bosses || {}; for (const id of Object.keys(B)) out[id] = { state: B[id].state, outcome: B[id].outcome, started: B[id].started, defeated: B[id].defeated }; return out; }
function bossApply(d) {
    if (typeof _fp === "undefined" || !_fp) return false; _fp.bosses = {}; bossShots = [];
    if (!d || typeof d !== "object") return false;
    for (const id of Object.keys(d)) {
        const E = bossEnc(id), s = d[id]; if (!E || !s || typeof s !== "object") continue;
        const S = bossState(id); S.started = Number.isFinite(s.started) ? s.started : 0; S.defeated = Number.isFinite(s.defeated) ? s.defeated : 0; S.outcome = s.outcome === "calm" || s.outcome === "defeated" ? s.outcome : null;
        const st = ["idle", "armed", "active", "resolved"].includes(s.state) ? s.state : "idle";
        if (st === "armed" || st === "active") { S.state = "idle"; bossArm(id); }   // (an interrupted encounter begins again at its post: asleep, whole, its frantic turn forgotten with its wounds)
        else if (st === "resolved" && S.outcome === "calm" && !S.defeated) { const b = _bossSpawn(E, "calm"); S.unit = b; S.state = "resolved"; }
        else S.state = st;
    }
    return true;
}
