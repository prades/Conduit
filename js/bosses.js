// ─────────────────────────────────────────────────────────
//  THE BOSS ENCOUNTERS: one table, one state machine; the Sewers' cistern (docs/SEWER-QUEST.md)
// ─────────────────────────────────────────────────────────
// ASKED: "Implement or extend a reusable boss encounter framework [...] Bosses should not be isolated scripts that duplicate their own quest handling, room transitions, and interaction logic [...] Nests and Sewers as
// distinct boss-domain environments [...] Do not arbitrarily assign bosses to domains or invent new domain relationships where the design archive has not settled them."
// AN ENCOUNTER is data (BOSS_ENCOUNTERS): its domain (a room), the creature (a species' boss class, js/species.js, at a level), where its lair is, how far it chases (`leash`), what wakes it and what calms it. The
// framework is the state machine below, the same for every entry: IDLE (nothing there) → ARMED (bossArm: the boss is spawned asleep in its lair; the Sewers' is armed when the boss gate's seal is broken, js/quests.js)
// → ACTIVE (bossWake: the module's install begins, or it is hit; it hunts whoever is in its domain) → RESOLVED, by one of two OUTCOMES: "calm" (bossCalm: the purification completed with it alive: it settles in its lair,
// hunts nothing, defends itself if attacked) or "defeated" (it died: the game's own kill, js/drops.js pays it). A boss that is left (the player goes further than its leash from its lair) lets go, walks home and
// sleeps again (ARMED): retreat is recovery. A boss killed after it was calmed is recorded too (`defeated`), the outcome stays "calm": the three things the brief keeps apart are kept apart (the quest's purification,
// the encounter's resolution, the boss's death). SAVED as `bosses` (the state and outcome of each; the creature itself is not: a load spawns an armed or calm boss again, asleep or calm, at full health; a defeated one not).
// THE CREATURE is the game's own (spawnCreature, js/clone.js): it is drawn, hit, fed and killed like any creature of the arena; three flags on it are all the framework adds: bossId (whose it is), bossAsleep and
// bossCalm (js/predator.js predatorAlarm: a sleeping or calm boss hears no alarm and picks no prey; a hit still provokes it, and when it loses its prey it is calm again).
// THE NESTS: the second domain the design names. Its entry below has no boss assigned: the archive's assignment could not be read this session, and the nest area has no way in yet (js/facilitymap.js `candidates`). It is
// in the table so that a nest encounter is a row of data when it is settled, not a new system. Nothing arms it.
const BOSS_ENCOUNTERS = {
    sewer_cistern: { id: "sewer_cistern", domain: "sewers", room: "sewers", name: "THE ANT BOSS",
        species: "ant", cls: "boss", element: "toxic", level: 6,   // PROVISIONAL: the ant species' boss block (js/species.js: 500 health, power 60, aura) at level 6; the archive's numbers, when readable, replace these
        lair: F => { const s = F.solids.find(q => q.id === "sewer_sump"); return s ? [s.at[0] + 5, s.at[1] - 4] : null; },   // east of the sump, at the cistern's back (the cistern: x 1060 to 1280, the sump at 1170, 960)
        leash: 9,                 // tiles from its lair: a player further off is let go, and it walks home and sleeps again
        quest: "purify",
        wakes: ["install", "hit"], calms: ["purified"],
        note: "The Sewers' boss, behind the boss gate (the user: a toxic ant boss, 2026-10-31). The purification module's install wakes it; clean water calms it." },
    nest: { id: "nest", domain: "nest_area", room: "nest_area", name: null, species: null, cls: null, element: null, level: 0, lair: null, leash: 0, quest: null, wakes: [], calms: [],
        note: "NOT ASSIGNED: the Nest domain's boss and its encounter are not settled in a document readable this session, and the nest area has no entrance yet. A row of data when they are." },
};
const BOSS_HOME = 1.2;   // tiles from its lair: home (it sleeps again there)

function _bossFrame() { return typeof frame !== "undefined" ? frame : 0; }
function bossEnc(id) { return BOSS_ENCOUNTERS[id] || null; }
function bossState(id) {
    if (typeof _fp === "undefined" || !_fp) return null;
    if (!_fp.bosses) _fp.bosses = {};
    if (!_fp.bosses[id]) _fp.bosses[id] = { state: "idle", outcome: null, started: 0, defeated: 0, unit: null };
    return _fp.bosses[id];
}
function bossReset() { if (typeof _fp !== "undefined" && _fp) _fp.bosses = {}; }
function bossUnit(id) { const S = bossState(id); return S && S.unit && !S.unit.dead ? S.unit : null; }
function bossSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 130, text, color: col || "#ff6a4a", life: 240, vy: -0.05, size: 15 }); }
function bossLair(E) {
    if (!E || !E.lair || typeof _fp === "undefined" || !_fp || !_fp.F) return null;
    let p = E.lair(_fp.F); if (!p) return null;
    if (typeof facilityStandOk === "function" && !facilityStandOk(p[0], p[1]) && typeof _fpNearestCell === "function") { const c = _fpNearestCell(p[0], p[1]); if (c) p = [c[0], c[1]]; }
    return p;
}
// the creature, in its lair: asleep (ARMED) or calm (RESOLVED calm); null when the encounter has no boss or the world cannot hold it
function _bossSpawn(E, how) {
    if (!E || !E.species || typeof spawnCreature !== "function") return null;
    const at = bossLair(E); if (!at) return null;
    let b = null; try { b = spawnCreature({ species: E.species, className: E.cls || "boss", x: at[0], y: at[1], level: E.level || 1, state: "wander" }); } catch (e) { b = null; }
    if (!b) return null;
    b.fpCreature = true; b.homeRoom = E.room; b.bossId = E.id; b.element = E.element || null; b.spawnProtection = 0; b.provoked = false; b.currentTarget = null;
    b.bossAsleep = how !== "calm"; b.bossCalm = how === "calm"; b.wanderTarget = { x: at[0], y: at[1], rest: 1e9 }; b.wanderTimer = 1e9;
    return b;
}
// ARM: the boss is spawned asleep in its lair (the gate's seal broken, js/quests.js); once
function bossArm(id) {
    const E = bossEnc(id), S = bossState(id); if (!E || !S || !E.species) return false;
    if (S.state !== "idle") return false;
    const b = _bossSpawn(E, "asleep"); if (!b) return false;
    S.unit = b; S.state = "armed"; return true;
}
// WAKE: it hunts (the install begins, or it is hit); the quest is told the encounter has started
function bossWake(id, why) {
    const E = bossEnc(id), S = bossState(id), b = bossUnit(id); if (!E || !S || !b || S.state === "resolved") return false;
    if (S.state === "active" && !b.bossAsleep) return false;
    S.state = "active"; S.started = S.started || Math.max(1, _bossFrame()); b.bossAsleep = false; b.bossCalm = false; b.provoked = true; b.lastAttacker = typeof player !== "undefined" ? player : null;
    if (typeof player !== "undefined" && typeof predatorPreyOk === "function" && predatorPreyOk(b, player)) { b.currentTarget = player; b._prey = player; }
    b.state = "hunt"; b.wanderTimer = 0;
    bossSay("⚠ " + (E.name || "THE BOSS") + " WAKES" + (why === "install" ? " — HOLD THE MOUNT" : ""), "#ff6a4a");
    if (typeof questBossStarted === "function") questBossStarted(id);
    return true;
}
// out of its fight and on its way home: the prey let go, the bite's root lifted (js/predator.js parks moveSpeed at 0 while it attacks and gives it back when it calms by itself; a boss we calm by hand needs it back too)
function _bossLetGo(b, at) {
    b.provoked = false; b.currentTarget = null; b._prey = null; b.attackWindup = 0; b.biteTarget = null; b.attackAnim = 0;
    b.moveSpeed = b.baseMoveSpeed || (b.def && b.def.moveSpeed) || b.moveSpeed || 0.008;
    b.state = "wander"; b.wanderTarget = at ? { x: at[0], y: at[1], rest: 1e9 } : null; b.wanderTimer = at ? 1e9 : 0;
}
// CALM: the clean water settles it: it goes home, hunts nothing, keeps its lair alive (the non-lethal resolution); nothing when it is dead already
function bossCalm(id) {
    const E = bossEnc(id), S = bossState(id); if (!E || !S) return false;
    const b = bossUnit(id);
    if (!b) { if (S.state !== "resolved" && S.state !== "idle") { S.state = "resolved"; S.outcome = S.outcome || "defeated"; } return false; }
    if (S.state === "resolved" && S.outcome) return false;
    b.bossCalm = true; b.bossAsleep = false; _bossLetGo(b, bossLair(E));
    S.state = "resolved"; S.outcome = "calm";
    bossSay("◈ " + (E.name || "THE BOSS") + " SETTLES BY THE SUMP — IT IS CALM", "#9dffb6");
    if (typeof questBossResolved === "function") questBossResolved(id, "calm");
    return true;
}
// each frame (js/facilitytutorial.js): a death, a hit on a sleeper, the leash, going home
function bossTick() {
    if (typeof _fp === "undefined" || !_fp || !_fp.bosses || typeof player === "undefined") return;
    for (const id of Object.keys(_fp.bosses)) {
        const E = bossEnc(id), S = _fp.bosses[id], b = S.unit; if (!E || !b) continue;
        if (b.dead) {   // DEFEATED: the game's own kill paid it (js/drops.js); recorded whatever the state was
            S.unit = null; S.defeated = S.defeated || Math.max(1, _bossFrame());
            if (S.state !== "resolved") { S.state = "resolved"; S.outcome = "defeated"; bossSay("◈ " + (E.name || "THE BOSS") + " IS DEFEATED", "#9dffb6"); }
            if (typeof questBossResolved === "function") questBossResolved(id, "defeated");
            continue;
        }
        const at = bossLair(E) || [b.x, b.y], dp = Math.hypot(player.x - at[0], player.y - at[1]), home = Math.hypot(b.x - at[0], b.y - at[1]) <= BOSS_HOME;
        if (S.state === "armed" && b.bossAsleep && b.provoked) { bossWake(id, "hit"); continue; }   // a sleeper hit wakes
        if (S.state === "active") {
            if (dp <= E.leash) { if (!b.provoked) { b.provoked = true; if (typeof predatorPreyOk === "function" && predatorPreyOk(b, player) && !b.currentTarget) { b.currentTarget = player; b._prey = player; } } }   // the pressure: while you are in its domain it comes for you
            else if (b.provoked || !home) _bossLetGo(b, at);   // let go: it walks home
            if (dp > E.leash && home && !b.provoked) { b.bossAsleep = true; S.state = "armed"; bossSay((E.name || "THE BOSS") + " SLEEPS AGAIN", "#8aa0c8"); }
        }
        if (b.bossCalm && !b.provoked && !home && b.state === "wander" && !(b.wanderTarget && b.wanderTarget.rest === 1e9)) _bossLetGo(b, at);   // a calm boss keeps to its lair (its fight over, it walks back)
    }
}
// where a boss wanders (js/facilityspawn.js facilityWanderTarget asks): its lair, and nowhere else, while it sleeps or is calm
function bossWanderTarget(a) {
    if (!a || !a.bossId || !(a.bossAsleep || a.bossCalm)) return null;
    const at = bossLair(bossEnc(a.bossId)); return at ? { x: at[0], y: at[1], rest: 1e9 } : null;
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
        if (st === "armed" || st === "active") { S.state = "idle"; bossArm(id); }   // (an interrupted encounter begins again from its lair: asleep, whole)
        else if (st === "resolved" && S.outcome === "calm" && !S.defeated) { const b = _bossSpawn(E, "calm"); S.unit = b; S.state = "resolved"; }
        else S.state = st;
    }
    return true;
}
