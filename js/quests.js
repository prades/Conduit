// ─────────────────────────────────────────────────────────
//  THE QUESTS: the Sewer purification (docs/SEWER-QUEST.md)
// ─────────────────────────────────────────────────────────
// ASKED (the "Series 2, Sewers, bosses" brief): "Implement the documented sewer purification quest as an integrated progression sequence: discover an unexpected water-quality reading; collect samples (toxic ants and hidden
// locations); solve the sewer sample puzzle (Telegrab, or the launcher); return the materials to the Experiment Lab; purchase the purification module (800 shards); return to the sewer and install the module in the dam-like
// area; resolve the boss encounter [...] Represent each major progression step explicitly [...] Adapt these states to the existing quest system instead of creating a competing quest manager [...] The sewer boss must not
// have to die for the player to complete the purification objective."
// THE QUEST SYSTEM the game has is the tutorial director (js/tutorial.js): a list of steps, each done when its `done()` says so, shown one at a time on the objective plate. A quest here is the same shape (QUEST_STEPS: title,
// text, hint, done), with its own record of WHAT HAPPENED (the explicit states the brief asks for, each marked once and never unmarked: `_fp.quests[id]`, saved as `quests`), and the plate shows the quest's step when one
// is under way (facilityDrawObjective asks questObjective: after the tutorial, before the class's stage). The director's tick runs questTick (js/facilitytutorial.js). Nothing here is a second manager: the plate, the save,
// the stations (js/stations.js) and the pickups are the game's own.
//   THE STATES (QUEST_PURIFY, the record Q): discoveredAt (the reading at the outfall), puzzleAt + puzzleHow (the water sample obtained: js/puzzles.js says how), samplesAt (every sample in the pack), turnedInAt (the analysis
//     bench took them), moduleAt (the module bought), gateAt (the boss gate's seal broken), installedAt (the module mounted), purifiedAt (its cycle run: the water clean), bossStartedAt, bossResolvedAt + bossOutcome
//     ("calm" or "defeated": js/bosses.js), bossDefeated (whenever it died, outcome or not). Each is a play-clock time (techClock, saved) or 0; `cycleLeft` and `closeLeft` are frames still to run (saved as numbers, so a load
//     goes on where it was). A step is never skipped by a later one: buying the module does not install it, installing it does not purify the water, purifying it does not kill the boss.
//   THE SAMPLES: three TOXIC ANT SAMPLES, dropped by the toxic ants of the Sewers (js/facilityspawn.js FP_SPAWN_SEWERS; questDropFor from js/drops.js: one a kill, only while the bench still wants them), and the WATER SAMPLE
//     at the end of the collapsed tunnel (the puzzle: docs/SEWER-QUEST.md). The bench takes all four at once.
//   THE STATIONS (js/stations.js STATION_KINDS): the ANALYSIS BENCH (the cabinet at the Experiment Lab's west end, cabinet_1: ANALYSE, then BUY ◆800; not a bench beside the sequencer and the hood, whose plate would show the wrong station), the BOSS GATE's seal (with the module in the pack), the PURIFIER MOUNT (the cistern's console: a build of
//     QUEST_PURIFY.install frames that the player stays at; starting it wakes the boss; finishing it mounts the module and starts the cycle).
//   NON-LETHAL: the module's cycle completes whether the boss lives or not; when it does, a living boss is CALMED (js/bosses.js bossCalm: it keeps its lair, alive). Defeating it is the other resolution. The quest records both.
const QUEST_PURIFY = {
    id: "purify", title: "PURIFY THE SEWERS", col: "#8cff5a",
    samples: 3,          // toxic ant samples the bench wants, with one water sample
    modulePrice: 800,    // shards (the brief: "exchanges 800 shards for the module")
    install: 1200,       // frames the module takes to mount (20 s): the player stays at the mount; the boss is woken when it begins
    cycle: 1800,         // frames the module runs before the water is clean (30 s); then a living boss is calmed
    discoverNear: 6,     // tiles from the outfall where the water-quality reading is taken (the culvert's doorway is 4.7 tiles from it: the reading comes as you arrive)
    dropLife: 18000,     // frames a dropped ant sample lies on the floor (5 minutes of play)
    closing: 1500,       // frames the closing line stays on the plate (25 s)
    boss: "sewer_cistern", gate: "sewer_gate_boss", sample: "pk_sewer_sample", puzzle: "sewer_sample", room: "sewers", outfall: "sewer_outfall",
};
const QUEST_FRESH = { purify: () => ({ discoveredAt: 0, puzzleAt: 0, puzzleHow: "", samplesAt: 0, turnedInAt: 0, moduleAt: 0, gateAt: 0, installedAt: 0, purifiedAt: 0, bossStartedAt: 0, bossResolvedAt: 0, bossOutcome: "", bossDefeated: 0, cycleLeft: 0, closeLeft: 0, drops: 0 }) };

function _questFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _questNow() { return typeof techClock === "number" ? techClock : _questFrame(); }   // the play clock (saved; nothing passes while the game is closed)
function questState(id) {
    if (typeof _fp === "undefined" || !_fp) return QUEST_FRESH[id] ? QUEST_FRESH[id]() : {};
    if (!_fp.quests) _fp.quests = {};
    if (!_fp.quests[id] && QUEST_FRESH[id]) _fp.quests[id] = QUEST_FRESH[id]();
    return _fp.quests[id];
}
function questReset() { if (typeof _fp !== "undefined" && _fp) _fp.quests = {}; }
// mark a state once (idempotent: a second call changes nothing and says so); the time is the play clock's, never 0
function questMark(Q, key, say, col) {
    if (!Q || Q[key]) return false;
    Q[key] = Math.max(1, _questNow());
    if (say) questSay(say, col);
    return true;
}
function questSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 150, text, color: col || QUEST_PURIFY.col, life: 300, vy: -0.04, size: 14 }); }
function _questInv(id) { return typeof invCount === "function" ? invCount(id) : 0; }
function questSamplesHeld() { return { ant: _questInv("toxic_sample"), water: _questInv("sewer_sample") }; }
function questSamplesReady(Q) { const h = questSamplesHeld(); return !!Q.turnedInAt || (h.ant >= QUEST_PURIFY.samples && h.water >= 1); }
function questActive(id) { const Q = questState(id); return !!Q.discoveredAt && !(Q.purifiedAt && !Q.closeLeft); }   // under way: discovered, and not yet closed
function questDone(id) { const Q = questState(id); return !!Q.purifiedAt; }

// THE STEPS, in the tutorial director's shape: the plate shows the first that is not done. (The discovery is not a step: before it the quest is not on the plate at all; it begins at the outfall.)
const QUEST_STEPS = {
    purify: [
        { id: "samples", title: "COLLECT THE SAMPLES",
          text: Q => { const h = questSamplesHeld(), P = QUEST_PURIFY; return "ANT SAMPLES " + Math.min(P.samples, h.ant) + "/" + P.samples + " (THE TOXIC ANTS OF THE SEWERS DROP THEM) · WATER SAMPLE " + Math.min(1, h.water) + "/1 (THE COLLAPSED TUNNEL OFF THE NORTH LEDGE)."; },
          hint: Q => "THE TUNNEL IS CHOKED. A FLUX TECHNICIAN'S TELEGRAB PULLS THE VIAL OUT OVER THE RUBBLE, OR THE ELECTRIC TECHNICIAN SETS A LAUNCHER UP AT THE TUNNEL AND SENDS A FIRE TECHNICIAN IN TO DRILL IT OPEN.", done: Q => questSamplesReady(Q) },
        { id: "turnin", title: "TAKE THE SAMPLES TO THE LAB", text: Q => "THE ANALYSIS BENCH: THE CABINET AT THE WEST END OF THE EXPERIMENT LAB. STAND AT IT AND PRESS E (OR TAP IT).", hint: Q => "IT TAKES THE THREE ANT SAMPLES AND THE WATER SAMPLE TOGETHER.", done: Q => !!Q.turnedInAt },
        { id: "module", title: "BUY THE PURIFICATION MODULE", text: Q => "AT THE ANALYSIS BENCH: ◆" + QUEST_PURIFY.modulePrice + ". YOU HAVE ◆" + (typeof shardCount === "number" ? shardCount : 0) + ".", hint: Q => "KILLS PAY SHARDS. THE MODULE GOES IN YOUR PACK.", done: Q => !!Q.moduleAt },
        { id: "install", title: "INSTALL THE MODULE IN THE CISTERN",
          text: Q => Q.gateAt ? "MOUNT THE MODULE ON THE CONSOLE AT THE HEAD OF THE SUMP AND STAY AT IT: " + Math.round(QUEST_PURIFY.install / 60) + " SECONDS." : "TAKE IT DOWN TO THE SEWERS: THE BOSS GATE AT THE EAST END OF THE SOUTH LEDGE. ITS SEAL BREAKS FOR THE MODULE.",
          hint: Q => "THE ANT BOSS SLEEPS BY THE SUMP. THE INSTALL WAKES IT: HOLD IT OFF WITH YOUR SQUAD (A SHIELD, A FROST PATCH, POSTS), OR KILL IT. STEP AWAY AND THE INSTALL STOPS; THE MODULE IS NOT LOST.", done: Q => !!Q.installedAt },
        { id: "purify", title: "THE WATER CLEARS", text: Q => "THE MODULE IS RUNNING: " + Math.ceil((Q.cycleLeft || 0) / 60) + " S. THE RIVER CLEARS AS IT GOES.", hint: Q => "THE BOSS NEED NOT DIE: CLEAN WATER CALMS IT, AND IT KEEPS ITS LAIR.", done: Q => !!Q.purifiedAt },
    ],
};
function questStepIndex(id) { const Q = questState(id), S = QUEST_STEPS[id] || []; for (let i = 0; i < S.length; i++) if (!S[i].done(Q)) return i; return S.length; }
// what the plate shows for the quest under way: { key, title, body, hint, col }, or null (js/tutorial.js facilityDrawObjective)
function questObjective() {
    for (const id of Object.keys(QUEST_STEPS)) {
        if (!questActive(id)) continue;
        const Q = questState(id), S = QUEST_STEPS[id], i = questStepIndex(id), P = QUEST_PURIFY;
        if (i < S.length) { const st = S[i]; return { key: id + ":" + st.id, title: P.title + "  ·  " + (i + 1) + "/" + S.length + "  ·  " + st.title, body: st.text(Q), hint: st.hint(Q), col: P.col }; }
        const boss = Q.bossOutcome === "defeated" ? "THE ANT BOSS IS DEAD." : Q.bossOutcome === "calm" ? "THE ANT BOSS SLEEPS BY THE SUMP, ALIVE AND CALM." : "";
        return { key: id + ":done", title: P.title + "  ·  DONE", body: "THE RUNOFF RUNS CLEAN: THE SEWERS ARE PURIFIED. " + boss, hint: "", col: "#9dffb6" };
    }
    return null;
}

// ── each frame (js/facilitytutorial.js facilityTutorialTick): the discovery, the samples, the cycle ──
function questTick() {
    if (typeof _fp === "undefined" || !_fp || !_fp.F || typeof player === "undefined") return;
    const Q = questState("purify"), P = QUEST_PURIFY;
    if (!Q.discoveredAt) {   // THE READING: near the outfall, in the Sewers
        const room = typeof partyRoomAt === "function" ? partyRoomAt(player.x, player.y) : null;
        if (room === P.room) { const o = _questOutfall(); if (o && Math.hypot(o[0] - player.x, o[1] - player.y) <= P.discoverNear) questMark(Q, "discoveredAt", "◈ WATER-QUALITY READING: TOXIC. THE RUNOFF IS CONTAMINATED — SAMPLES WILL SAY HOW", "#ffb347"); }
    }
    if (!Q.puzzleAt && typeof puzzleState === "function") { const ps = puzzleState(P.puzzle); if (ps && ps.solved) { Q.puzzleHow = ps.how || ""; questMark(Q, "puzzleAt"); } }   // (the puzzle says how the vial was got)
    if (Q.discoveredAt && !Q.samplesAt && questSamplesReady(Q)) questMark(Q, "samplesAt", "◈ EVERY SAMPLE IS IN YOUR PACK — THE ANALYSIS BENCH IN THE EXPERIMENT LAB WANTS THEM");
    if (Q.installedAt && !Q.purifiedAt) {   // THE CYCLE: the module runs, the water clears, then the boss is calmed if it lives
        Q.cycleLeft = Math.max(0, (Q.cycleLeft || 0) - 1);
        if (!Q.cycleLeft) { questMark(Q, "purifiedAt", "◈ THE RUNOFF RUNS CLEAN — THE SEWERS ARE PURIFIED", "#9dffb6"); Q.closeLeft = P.closing; if (typeof bossCalm === "function") bossCalm(P.boss); }
    }
    if (Q.purifiedAt && Q.closeLeft > 0) Q.closeLeft--;
}
function _questOutfall() {
    if (_fp._questOutfall !== undefined) return _fp._questOutfall;
    const d = (_fp.F.decor || []).find(q => q.id === QUEST_PURIFY.outfall);
    return (_fp._questOutfall = d && d.a && d.b ? [(d.a[0] + d.b[0]) / 2, (d.a[1] + d.b[1]) / 2] : null);
}
// how clean the river is (0: the violet runoff, 1: clean): the module's cycle, for the water's colour (js/facilitysewers.js)
function questWaterClean() { const Q = typeof _fp !== "undefined" && _fp && _fp.quests && _fp.quests.purify; if (!Q) return 0; if (Q.purifiedAt) return 1; if (!Q.installedAt) return 0; return Math.max(0, Math.min(1, 1 - (Q.cycleLeft || 0) / QUEST_PURIFY.cycle)); }

// ── a kill in the Sewers (js/drops.js onPredatorDeath): a toxic ant of the brood drops an ANT SAMPLE while the bench still wants them (what is held and what lies on the floor count) ──
function questDropFor(p) {
    if (typeof _fp === "undefined" || !_fp || !_fp.items || !p || !p.sewerBrood || p.team === "green" || p.isClone || typeof _fpPickupItem !== "function") return null;
    const Q = questState("purify"), P = QUEST_PURIFY; if (Q.turnedInAt) return null;
    const pending = _fp.items.filter(i => i.fp === "pickup" && i.questSample && !i.taken).length;
    if (_questInv("toxic_sample") + pending >= P.samples) return null;
    const room = typeof facilityRoomAt === "function" ? facilityRoomAt(p.x, p.y, _fp.F) : null; if (!room) return null;
    const f = _questFrame(), it = _fpPickupItem({ id: "drop_sample_" + (++Q.drops), room: room.id, at: [p.x, p.y], items: [["toxic_sample", 1]] });
    it.temp = true; it.expires = f + P.dropLife; it.arrive = f; it.questSample = true; _fp.items.push(it);
    return it;
}

// ── the stations (js/stations.js STATION_KINDS asks these) ──
function questBenchVerb() { const Q = questState("purify"); return !Q.turnedInAt ? "ANALYSE THE SAMPLES" : !Q.moduleAt ? "BUY THE PURIFICATION MODULE ◆" + QUEST_PURIFY.modulePrice : "NOTHING MORE TO ANALYSE"; }
function questBenchCan() {
    const Q = questState("purify"), P = QUEST_PURIFY;
    if (!Q.turnedInAt) {
        if (!Q.discoveredAt) return { ok: false, why: "NOTHING TO ANALYSE YET" };
        const h = questSamplesHeld(); if (h.ant < P.samples || h.water < 1) return { ok: false, why: "IT WANTS " + P.samples + " ANT SAMPLES AND THE WATER SAMPLE · " + Math.min(P.samples, h.ant) + "/" + P.samples + " AND " + Math.min(1, h.water) + "/1" };
        return { ok: true };
    }
    if (!Q.moduleAt) { const have = typeof shardCount === "number" ? shardCount : 0; if (have < P.modulePrice) return { ok: false, why: "NEED ◆" + (P.modulePrice - have) + " MORE FOR THE MODULE" }; if (typeof invRoom === "function" && invRoom("purification_module") < 1) return { ok: false, why: "YOUR PACK ALREADY HOLDS A MODULE" }; return { ok: true }; }
    return { ok: false, why: "THE MODULE IS BOUGHT · INSTALL IT IN THE SEWERS' CISTERN", done: true };
}
function questBenchUse() {
    const Q = questState("purify"), P = QUEST_PURIFY, can = questBenchCan(); if (!can.ok) return can;
    if (!Q.turnedInAt) {
        if (!invRemove("toxic_sample", P.samples) || !invRemove("sewer_sample", 1)) return { ok: false, why: "THE SAMPLES ARE NOT ALL HERE" };
        questMark(Q, "turnedInAt");
        return { ok: true, msg: "SAMPLES ANALYSED — THE RUNOFF IS TOXIC. THE BENCH CAN BUILD A PURIFICATION MODULE: ◆" + P.modulePrice };
    }
    shardCount -= P.modulePrice; invAdd("purification_module", 1); questMark(Q, "moduleAt");
    return { ok: true, msg: "PURIFICATION MODULE — IN YOUR PACK. MOUNT IT ON THE CISTERN'S CONSOLE IN THE SEWERS: THE BOSS GATE OPENS FOR IT" };
}
function questGateCan() {
    const Q = questState("purify");
    if (Q.gateAt) return { ok: false, why: "THE GATE IS OPEN", done: true };
    if (typeof invHas === "function" && !invHas("purification_module")) return { ok: false, why: "SEALED · THE PURIFICATION MODULE OPENS IT (THE ANALYSIS BENCH, EXPERIMENT LAB)" };
    return { ok: true };
}
function questGateUse() {
    const Q = questState("purify"), P = QUEST_PURIFY, can = questGateCan(); if (!can.ok) return can;
    if (typeof facilitySolidOpen === "function") facilitySolidOpen(P.gate);
    questMark(Q, "gateAt"); if (typeof shake !== "undefined") shake = Math.max(shake || 0, 6);
    if (typeof bossArm === "function") bossArm(P.boss);
    return { ok: true, msg: "THE SEAL IS BROKEN — THE BOSS GATE GRINDS OPEN. SOMETHING SLEEPS BY THE SUMP" };
}
function questMountVerb() { const Q = questState("purify"); return Q.installedAt ? (Q.purifiedAt ? "THE WATER RUNS CLEAN" : "THE MODULE IS RUNNING") : "INSTALL THE PURIFICATION MODULE"; }
function questMountCan() {
    const Q = questState("purify");
    if (Q.installedAt) return { ok: false, why: Q.purifiedAt ? "PURIFIED · NOTHING MORE TO DO HERE" : "THE MODULE IS RUNNING · " + Math.ceil((Q.cycleLeft || 0) / 60) + " S", done: true };
    if (typeof invHas === "function" && !invHas("purification_module")) return { ok: false, why: "IT TAKES THE PURIFICATION MODULE (THE ANALYSIS BENCH, EXPERIMENT LAB)" };
    return { ok: true };
}
function questMountStart() { if (typeof bossWake === "function") bossWake(QUEST_PURIFY.boss, "install"); }   // the install begins: the boss is woken (the pressure)
function questMountUse() {   // the install is complete (js/stations.js buildComplete took the module): the cycle begins
    const Q = questState("purify"), P = QUEST_PURIFY; if (Q.installedAt) return { ok: false, why: "IT IS INSTALLED" };
    Q.cycleLeft = P.cycle; questMark(Q, "installedAt");
    return { ok: true, msg: "THE MODULE IS MOUNTED AND RUNNING — THE WATER CLEARS IN " + Math.round(P.cycle / 60) + " S" };
}

// ── the boss (js/bosses.js tells the quest) ──
function questBossStarted(id) { const Q = questState("purify"); if (id === QUEST_PURIFY.boss) questMark(Q, "bossStartedAt"); }
function questBossResolved(id, outcome) { const Q = questState("purify"); if (id !== QUEST_PURIFY.boss) return; if (outcome === "defeated") Q.bossDefeated = Math.max(1, _questNow()); if (!Q.bossResolvedAt) { Q.bossOutcome = outcome; questMark(Q, "bossResolvedAt"); } }

// ── the save (js/facilitysave.js): the records as they are; a load puts the world's part of them back (the gate open) ──
function questSnapshot() { const out = {}; const q = typeof _fp !== "undefined" && _fp && _fp.quests || {}; for (const id of Object.keys(q)) out[id] = Object.assign({}, q[id]); return out; }
function questApply(d) {
    if (typeof _fp === "undefined" || !_fp) return false; _fp.quests = {};
    if (!d || typeof d !== "object") return false;
    for (const id of Object.keys(QUEST_FRESH)) {
        const s = d[id]; if (!s || typeof s !== "object") continue;
        const Q = questState(id); for (const k of Object.keys(Q)) if (k in s) { const v = s[k]; if (typeof Q[k] === "number") { if (Number.isFinite(v)) Q[k] = Math.max(0, v); } else if (typeof Q[k] === "string" && typeof v === "string") Q[k] = v; }
        if (Q.installedAt && !Q.purifiedAt && !(Q.cycleLeft > 0)) Q.cycleLeft = 1;   // (a cycle that was saved as over but not marked: it finishes on the next tick)
        if (Q.purifiedAt && Q.closeLeft > QUEST_PURIFY.closing) Q.closeLeft = QUEST_PURIFY.closing;
    }
    const Q = questState("purify"); if (Q.gateAt && typeof facilitySolidOpen === "function") facilitySolidOpen(QUEST_PURIFY.gate);   // (the gate stays open)
    return true;
}
