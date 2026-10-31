// ─────────────────────────────────────────────────────────
//  THE BOSS ENCOUNTERS: one table, one state machine; the Sewers' cistern (docs/SEWER-QUEST.md)
// ─────────────────────────────────────────────────────────
// ASKED: "Implement or extend a reusable boss encounter framework [...] Bosses should not be isolated scripts that duplicate their own quest handling, room transitions, and interaction logic [...] Nests and Sewers as
// distinct boss-domain environments [...] Do not arbitrarily assign bosses to domains or invent new domain relationships where the design archive has not settled them."
// AN ENCOUNTER is data (BOSS_ENCOUNTERS): its domain (a room), the creature (a species' boss class, js/species.js, at a level), where its lair is, how far it chases (`leash`), what wakes it and what calms it, and its
// DISTRESS (the archive's non-lethal design, 2026-10-31: at about half its health the boss leaves the post it guards and a follower's control effect opens the window to install). The framework is the state
// machine below, the same for every entry: IDLE (nothing there) → ARMED (bossArm: the boss is spawned asleep in its lair; the Sewers' is armed when the boss gate's seal is broken, js/quests.js) → ACTIVE
// (bossWake: the module's install begins, or it is hit; it hunts whoever is in its domain) → RESOLVED, by one of two OUTCOMES: "calm" (bossCalm: the purification completed with it alive: it settles in its lair,
// hunts nothing, defends itself if attacked) or "defeated" (it died: the game's own kill, js/drops.js pays it). A boss that is left (the player goes further than its leash from its lair) lets go, walks home and
// sleeps again (ARMED): retreat is recovery. A boss killed after it was calmed is recorded too (`defeated`), the outcome stays "calm": the three things the brief keeps apart are kept apart (the quest's purification,
// the encounter's resolution, the boss's death). SAVED as `bosses` (the state and outcome of each; the creature itself is not: a load spawns an armed or calm boss again, asleep or calm, at full health; a defeated one not).
// THE CREATURE is the game's own (spawnCreature, js/clone.js): it is drawn, hit, fed and killed like any creature of the arena; the framework adds bossId (whose it is), bossName (what its tag says), bossAsleep and
// bossCalm (js/predator.js predatorAlarm: a sleeping or calm boss hears no alarm and picks no prey; a hit still provokes it, and when it loses its prey it is calm again).
// THE INSTALL UNDER PRESSURE (the archive, "Design update — Non-lethal boss resolution through distress behavior and follower interrupts", 2026-10-31; its numbers are open there, so the ones below are PROVISIONAL):
//   while the boss is awake and within `distress.guard` tiles of the mount it GUARDS the console: the install's progress holds (js/stations.js facilityRelayTick asks bossInstallBlocked through the mount's blockFn)
//   unless the boss is CONTROLLED (bossControlled: stunned, frozen or glitched: a Frost Maw's or Manta's stun, an ice burst, a Static Lock). At `distress.at` of its health it is IN DISTRESS: it leaves the console for
//   its retreat spot (its lair, unless the row names another) for `distress.retreat` frames, then RUSHES the console again for `distress.rush` frames, and so on, at `distress.speed` times its pace (a slow boss
//   would never get clear of the console and back): the windows to install are its retreats and the control effects your squad lands on it. Killing it opens the console for good; the water, once clean, calms
//   it (bossCalm) wherever it is.
// THE NESTS: the second domain the design names. Its row carries THE ANT QUEEN, the archive's proposed first nest boss ("Enemy Faction & Biome Escalation", Stage 1; the user: apply it, provisional, 2026-10-31), with no
// lair: the nest area has no way in yet (js/facilitymap.js `candidates`), so nothing arms it. A nest encounter is a row of data when the nest is built, not a new system.
const BOSS_ENCOUNTERS = {
    sewer_cistern: { id: "sewer_cistern", domain: "sewers", room: "sewers", name: "THE TOXIC ANT QUEEN",
        species: "ant", cls: "boss", element: "toxic", level: 6,   // PROVISIONAL: the ant species' boss block (js/species.js: 500 health, power 60, mandible frenzy) at level 6; the archive leaves the boss's numbers open ("measure the live game first")
        lair: F => { const s = F.solids.find(q => q.id === "sewer_sump"); return s ? [s.at[0] + 5, s.at[1] - 4] : null; },      // east of the sump, at the cistern's back (the cistern: x 1060 to 1280, the sump at 1170, 960)
        retreat: null,            // where it goes in distress: null is its lair (east of the sump, 4 tiles off the console: beyond its guard, and back in a few seconds of its distressed pace)
        mount: "st_purifier",     // the station it guards (js/stations.js): the purification module's mount at the head of the sump
        leash: 9,                 // tiles from its lair: a player further off is let go, and it walks home and sleeps again
        distress: { at: 0.5, guard: 3, retreat: 360, rush: 480, speed: 3 },   // PROVISIONAL: distress at half its health (the archive's proposal); it guards within 3 tiles of the console; 6 s backing off, then 8 s rushing back, at three times its pace (about 5 s of open console a cycle, more with a stun)
        quest: "purify",
        wakes: ["install", "hit"], calms: ["purified"],
        note: "The Sewers' boss, behind the boss gate: the user's toxic ant boss (2026-10-31), named after the archive's proposed progression (the Toxic Ant Queen of the Sewers, Stage 3); provisional. The purification module's install wakes it; clean water calms it." },
    nest: { id: "nest", domain: "nest_area", room: "nest_area", name: "THE ANT QUEEN", species: "ant", cls: "boss", element: null, level: 0, lair: null, retreat: null, mount: null, leash: 0, distress: null, quest: null, wakes: [], calms: [],   // (level 0, no lair: a row, not a boss yet)
        note: "PLANNED, NOT ARMED: the archive's proposed first nest boss (Stage 1 of the faction progression: break into the nest and defeat the Ant Queen), applied here as provisional (the user, 2026-10-31). No lair: the nest area has no entrance yet, so nothing spawns it; its level, numbers and encounter are not designed." },
};
const BOSS_HOME = 1.2;   // tiles from its lair: home (it sleeps again there)

function _bossFrame() { return typeof frame !== "undefined" ? frame : 0; }
function bossEnc(id) { return BOSS_ENCOUNTERS[id] || null; }
function bossState(id) {
    if (typeof _fp === "undefined" || !_fp) return null;
    if (!_fp.bosses) _fp.bosses = {};
    if (!_fp.bosses[id]) _fp.bosses[id] = { state: "idle", outcome: null, started: 0, defeated: 0, unit: null, distress: false, phase: null, phaseAt: 0 };
    return _fp.bosses[id];
}
function bossReset() { if (typeof _fp !== "undefined" && _fp) _fp.bosses = {}; }
function bossUnit(id) { const S = bossState(id); return S && S.unit && !S.unit.dead ? S.unit : null; }
function bossSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 130, text, color: col || "#ff6a4a", life: 240, vy: -0.05, size: 15 }); }
// a spot of the map an encounter names (its lair, its retreat), on floor a body can stand on
function _bossSpot(fn) {
    if (!fn || typeof _fp === "undefined" || !_fp || !_fp.F) return null;
    let p = fn(_fp.F); if (!p) return null;
    if (typeof facilityStandOk === "function" && !facilityStandOk(p[0], p[1]) && typeof _fpNearestCell === "function") { const c = _fpNearestCell(p[0], p[1]); if (c) p = [c[0], c[1]]; }
    return p;
}
function bossLair(E) { return E ? _bossSpot(E.lair) : null; }
function bossRetreat(E) { return E ? _bossSpot(E.retreat) || bossLair(E) : null; }
// the station a boss guards (its mount), as the stations list has it: { x, y, bb } or null
function bossMount(E) { return E && E.mount && typeof _fp !== "undefined" && _fp && _fp.stations ? _fp.stations.find(s => s.id === E.mount) || null : null; }
// has any encounter been resolved, calm or defeated? (js/cards.js: Booster Pack 2 unlocks after the first boss; the user: a spared boss counts, 2026-10-31)
function bossAnyResolved() { const B = typeof _fp !== "undefined" && _fp && _fp.bosses || {}; return Object.keys(B).some(id => B[id].state === "resolved"); }
// the creature, in its lair: asleep (ARMED) or calm (RESOLVED calm); null when the encounter has no boss or the world cannot hold it
function _bossSpawn(E, how) {
    if (!E || !E.species || typeof spawnCreature !== "function") return null;
    const at = bossLair(E); if (!at) return null;
    let b = null; try { b = spawnCreature({ species: E.species, className: E.cls || "boss", x: at[0], y: at[1], level: E.level || 1, state: "wander" }); } catch (e) { b = null; }
    if (!b) return null;
    b.fpCreature = true; b.homeRoom = E.room; b.bossId = E.id; b.bossName = E.name || null; b.element = E.element || null; b.spawnProtection = 0; b.provoked = false; b.currentTarget = null;
    b._bossPace = b.baseMoveSpeed || b.moveSpeed || 0.008;   // (its true pace: the distress runs faster than it, and _bossLetGo gives it back)
    b.bossAsleep = how !== "calm"; b.bossCalm = how === "calm"; b.wanderTarget = { x: at[0], y: at[1], rest: 1e9 }; b.wanderTimer = 1e9;
    return b;
}
// ARM: the boss is spawned asleep in its lair (the gate's seal broken, js/quests.js); once
function bossArm(id) {
    const E = bossEnc(id), S = bossState(id); if (!E || !S || !E.species) return false;
    if (S.state !== "idle") return false;
    const b = _bossSpawn(E, "asleep"); if (!b) return false;
    S.unit = b; S.state = "armed"; S.distress = false; S.phase = null; return true;
}
// WAKE: it hunts (the install begins, or it is hit); the quest is told the encounter has started
function bossWake(id, why) {
    const E = bossEnc(id), S = bossState(id), b = bossUnit(id); if (!E || !S || !b || S.state === "resolved") return false;
    if (S.state === "active" && !b.bossAsleep) return false;
    S.state = "active"; S.started = S.started || Math.max(1, _bossFrame()); b.bossAsleep = false; b.bossCalm = false;
    _bossHunt(b);
    bossSay("⚠ " + (E.name || "THE BOSS") + " WAKES" + (why === "install" ? " — IT GUARDS THE CONSOLE" : ""), "#ff6a4a");
    if (typeof questBossStarted === "function") questBossStarted(id);
    return true;
}
// after the player: provoked, the player its prey when it may be
function _bossHunt(b) {
    b.provoked = true; b.lastAttacker = typeof player !== "undefined" ? player : null;
    if (typeof player !== "undefined" && typeof predatorPreyOk === "function" && predatorPreyOk(b, player)) { b.currentTarget = player; b._prey = player; }
    b.state = "hunt"; b.wanderTimer = 0;
}
// out of its fight and on its way somewhere: the prey let go, the bite's root lifted (js/predator.js parks moveSpeed at 0 while it attacks and gives it back when it calms by itself; a boss we move by hand needs it back too)
function _bossLetGo(b, at) {
    b.provoked = false; b.currentTarget = null; b._prey = null; b.attackWindup = 0; b.biteTarget = null; b.attackAnim = 0; b.bossRetreating = false;
    b.moveSpeed = b.baseMoveSpeed = b._bossPace || b.baseMoveSpeed || (b.def && b.def.moveSpeed) || b.moveSpeed || 0.008;
    b.state = "wander"; b.wanderTarget = at ? { x: at[0], y: at[1], rest: 1e9 } : null; b.wanderTimer = at ? 1e9 : 0;
}
// its pace in distress: `mult` times its own (js/predator.js walks a wanderer and a hunter by moveSpeed, and a chaser by baseMoveSpeed: both are set)
function _bossRun(b, mult) { const base = b._bossPace || b.baseMoveSpeed || 0.008; b.moveSpeed = b.baseMoveSpeed = base * (mult || 1); }
// CALM: the clean water settles it: it goes home, hunts nothing, keeps its lair alive (the non-lethal resolution); nothing when it is dead already
function bossCalm(id) {
    const E = bossEnc(id), S = bossState(id); if (!E || !S) return false;
    const b = bossUnit(id);
    if (!b) { if (S.state !== "resolved" && S.state !== "idle") { S.state = "resolved"; S.outcome = S.outcome || "defeated"; } return false; }
    if (S.state === "resolved" && S.outcome) return false;
    b.bossCalm = true; b.bossAsleep = false; _bossLetGo(b, bossLair(E)); S.distress = false; S.phase = null;
    S.state = "resolved"; S.outcome = "calm";
    bossSay("◈ " + (E.name || "THE BOSS") + " SETTLES BY THE SUMP — IT IS CALM", "#9dffb6");
    if (typeof questBossResolved === "function") questBossResolved(id, "calm");
    return true;
}
// (bossRetreating: set by the distress cycle's retreat, cleared by its rush and by _bossLetGo: js/predator.js lets such a boss pass the player by)
// is the boss held still by a control effect (a stun, a freeze, a glitch: js/combat.js)? Then it guards nothing: the window to install
function bossControlled(b) { return !!b && !b.dead && (b.stunned > 0 || b.frozen === true || b.glitched > 0); }
// is the boss in distress (at or under its distress share of health)?
function bossInDistress(id) { const S = bossState(id); return !!(S && S.distress); }
// why the install at the mount cannot go on this frame, or null when it can (js/quests.js questMountBlocked ← js/stations.js the mount's blockFn): the boss awake, uncontrolled, within its guard of the console
function bossInstallBlocked(id) {
    const E = bossEnc(id), S = bossState(id), b = bossUnit(id); if (!E || !S || !b || !E.distress) return null;
    if (S.state !== "active" || b.bossAsleep || b.bossCalm) return null;
    if (bossControlled(b)) return null;
    const m = bossMount(E); if (!m) return null;
    if (Math.hypot(b.x - m.x, b.y - m.y) > E.distress.guard) return null;
    const name = E.name || "THE BOSS";
    return S.distress ? name + " IS AT THE CONSOLE · STUN, FREEZE OR GLITCH IT, OR WAIT FOR IT TO BACK OFF" : name + " GUARDS THE CONSOLE · DRIVE IT TO HALF ITS HEALTH, OR STUN, FREEZE OR GLITCH IT";
}
// the distress cycle (ACTIVE, in distress): a retreat to the far side, then a rush back at whoever is at the console, and again
function _bossDistressTick(E, S, b, dp) {
    const D = E.distress, f = _bossFrame();
    const back = () => { _bossLetGo(b, bossRetreat(E)); _bossRun(b, D.speed); b.bossRetreating = true; };   // (retreating: it picks no prey and the player beside it does not turn it, js/predator.js)
    if (!S.phase) { S.phase = "retreat"; S.phaseAt = f; back(); return; }
    if (S.phase === "retreat") {
        if (b.provoked && !bossControlled(b)) back();   // (a hit while it backs off does not turn it: it keeps going)
        if (f - S.phaseAt >= D.retreat && dp <= E.leash) { S.phase = "rush"; S.phaseAt = f; b.bossRetreating = false; _bossHunt(b); _bossRun(b, D.speed); bossSay("⚠ " + (E.name || "THE BOSS") + " RUSHES THE CONSOLE", "#ff6a4a"); }
    } else if (S.phase === "rush") {
        if (!b.provoked && !bossControlled(b)) { _bossHunt(b); _bossRun(b, D.speed); }   // (it lost its prey: it keeps coming)
        if (f - S.phaseAt >= D.rush || dp > E.leash) { S.phase = "retreat"; S.phaseAt = f; back(); }
    }
}
// each frame (js/facilitytutorial.js): a death, a hit on a sleeper, the distress, the leash, going home
function bossTick() {
    if (typeof _fp === "undefined" || !_fp || !_fp.bosses || typeof player === "undefined") return;
    for (const id of Object.keys(_fp.bosses)) {
        const E = bossEnc(id), S = _fp.bosses[id], b = S.unit; if (!E || !b) continue;
        if (b.dead) {   // DEFEATED: the game's own kill paid it (js/drops.js); recorded whatever the state was
            S.unit = null; S.defeated = S.defeated || Math.max(1, _bossFrame()); S.distress = false; S.phase = null;
            if (S.state !== "resolved") { S.state = "resolved"; S.outcome = "defeated"; bossSay("◈ " + (E.name || "THE BOSS") + " IS DEFEATED", "#9dffb6"); }
            if (typeof questBossResolved === "function") questBossResolved(id, "defeated");
            continue;
        }
        const at = bossLair(E) || [b.x, b.y], dp = Math.hypot(player.x - at[0], player.y - at[1]), home = Math.hypot(b.x - at[0], b.y - at[1]) <= BOSS_HOME;
        if (S.state === "armed" && b.bossAsleep && b.provoked) { bossWake(id, "hit"); continue; }   // a sleeper hit wakes
        if (S.state === "active") {
            if (E.distress && !S.distress && b.health <= b.maxHealth * E.distress.at) { S.distress = true; S.phase = null; bossSay("⚠ " + (E.name || "THE BOSS") + " IS IN DISTRESS — IT LEAVES THE CONSOLE", "#ffb347"); }
            if (S.distress) { _bossDistressTick(E, S, b, dp); continue; }   // (in distress it neither chases by the leash nor sleeps again: its cycle holds until it is calmed or killed)
            if (dp <= E.leash) { if (!b.provoked) _bossHunt(b); }   // the pressure: while you are in its domain it comes for you
            else if (b.provoked || !home) _bossLetGo(b, at);   // let go: it walks home
            if (dp > E.leash && home && !b.provoked) { b.bossAsleep = true; S.state = "armed"; bossSay((E.name || "THE BOSS") + " SLEEPS AGAIN", "#8aa0c8"); }
        }
        if (b.bossCalm && !b.provoked && !home && b.state === "wander" && !(b.wanderTarget && b.wanderTarget.rest === 1e9)) _bossLetGo(b, at);   // a calm boss keeps to its lair (its fight over, it walks back)
    }
}
// where a boss wanders (js/facilityspawn.js facilityWanderTarget asks): its lair, and nowhere else, while it sleeps or is calm; its retreat spot while it backs off in distress
function bossWanderTarget(a) {
    if (!a || !a.bossId) return null;
    const E = bossEnc(a.bossId), S = bossState(a.bossId);
    if (a.bossAsleep || a.bossCalm) { const at = bossLair(E); return at ? { x: at[0], y: at[1], rest: 1e9 } : null; }
    if (S && S.distress && S.phase === "retreat") { const at = bossRetreat(E); return at ? { x: at[0], y: at[1], rest: 1e9 } : null; }
    return null;
}
// is this creature a boss nobody should start on by itself? (js/helpers.js isHostileTarget: your followers and your gun's auto-lock leave a sleeping or calm boss alone; a tap on it, or an order, still fights it)
function bossPassive(a) { return !!(a && a.bossId && (a.bossAsleep || a.bossCalm) && !a.provoked); }
// ── the save (js/facilitysave.js) ──
function bossSnapshot() { const out = {}, B = typeof _fp !== "undefined" && _fp && _fp.bosses || {}; for (const id of Object.keys(B)) out[id] = { state: B[id].state, outcome: B[id].outcome, started: B[id].started, defeated: B[id].defeated }; return out; }
function bossApply(d) {
    if (typeof _fp === "undefined" || !_fp) return false; _fp.bosses = {};
    if (!d || typeof d !== "object") return false;
    for (const id of Object.keys(d)) {
        const E = bossEnc(id), s = d[id]; if (!E || !s || typeof s !== "object") continue;
        const S = bossState(id); S.started = Number.isFinite(s.started) ? s.started : 0; S.defeated = Number.isFinite(s.defeated) ? s.defeated : 0; S.outcome = s.outcome === "calm" || s.outcome === "defeated" ? s.outcome : null;
        const st = ["idle", "armed", "active", "resolved"].includes(s.state) ? s.state : "idle";
        if (st === "armed" || st === "active") { S.state = "idle"; bossArm(id); }   // (an interrupted encounter begins again from its lair: asleep, whole, its distress forgotten with its wounds)
        else if (st === "resolved" && S.outcome === "calm" && !S.defeated) { const b = _bossSpawn(E, "calm"); S.unit = b; S.state = "resolved"; }
        else S.state = st;
    }
    return true;
}
