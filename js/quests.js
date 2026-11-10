// ─────────────────────────────────────────────────────────
//  THE QUESTS: the Sewer purification (docs/SEWER-QUEST.md)
// ─────────────────────────────────────────────────────────
// ASKED (the "Series 2, Sewers, bosses" brief): "Implement the documented sewer purification quest as an integrated progression sequence: discover an unexpected water-quality reading; collect samples (toxic ants and hidden
// locations); solve the sewer sample puzzle (Telegrab, or the launcher); return the materials to the Experiment Lab; purchase the purification module (800 shards; 300 now, QUEST_PURIFY.modulePrice); return to the sewer and install the module in the dam-like
// area; resolve the boss encounter [...] Represent each major progression step explicitly [...] Adapt these states to the existing quest system instead of creating a competing quest manager [...] The sewer boss must not
// have to die for the player to complete the purification objective."
// THE QUEST SYSTEM the game has is the tutorial director (js/tutorial.js): a list of steps, each done when its `done()` says so, shown one at a time on the objective plate. A quest here is the same shape (QUEST_STEPS: title,
// text, hint, done), with its own record of WHAT HAPPENED (the explicit states the brief asks for, each marked once and never unmarked: `_fp.quests[id]`, saved as `quests`), and the plate shows the quest's step when one
// is under way (facilityDrawObjective asks questObjective: after the tutorial, before the class's stage). The director's tick runs questTick (js/facilitytutorial.js). Nothing here is a second manager: the plate, the save,
// the stations (js/stations.js) and the pickups are the game's own.
//   THE STATES (QUEST_PURIFY, the record Q): discoveredAt (the reading at the outfall), puzzleAt + puzzleHow (the water sample obtained: js/puzzles.js says how), samplesAt (every sample in the pack), turnedInAt (the analysis
//     bench took them), moduleAt (the module bought), gateAt (the boss gate's seal broken), installedAt (the module mounted), purifiedAt (its cycle run: the water clean), trioAt + trioKills + trioDeadAt (the
//     install's three: come, killed, all dead), queenOutAt (the queen came out and took you out), bossStartedAt, bossResolvedAt + bossOutcome ("calm" or "defeated": js/bosses.js), bossDefeated (whenever it died, outcome or not). Each is a play-clock time (techClock, saved) or 0; `cycleLeft` and `closeLeft` are frames still to run (saved as numbers, so a load
//     goes on where it was). A step is never skipped by a later one: buying the module does not install it, installing it does not purify the water, purifying it does not kill the boss.
//   THE SAMPLES: three TOXIC ANT SAMPLES, dropped by the toxic ants of the Sewers (js/facilityspawn.js FP_SPAWN_SEWERS; questDropFor from js/drops.js: one a kill, only while the bench still wants them), and the WATER SAMPLE
//     on the sample bank across the river (the puzzle: docs/SEWER-QUEST.md). The bench takes all four at once.
//   THE STATIONS (js/stations.js STATION_KINDS): the ANALYSIS BENCH (the cabinet at the Experiment Lab's west end, cabinet_1: ANALYSE, then BUY ◆300; not a bench beside the sequencer and the hood, whose plate would show the wrong station), the BOSS GATE's seal (with the module in the pack), the PURIFIER MOUNT (the cistern's console: a build of
//     QUEST_PURIFY.install frames that the player stays at; starting it wakes the boss, once she is there; finishing it mounts the module and starts the cycle).
//   NON-LETHAL: the module's cycle completes whether the boss lives or not; when it does, a living boss is CALMED (js/bosses.js bossCalm: it keeps its lair, alive). Defeating it is the other resolution. The quest records both.
//   THE AMBUSH (since build 2026-11-09tt, the owner's: QUEST_PURIFY.trio): the queen is not there at first; halfway through the first install three toxic ants come, the install holds until they are dead, then the
//     queen comes out and takes you out (back to the Crystal, your squad with you), and the install starts again with her at her post, as below.
//   THE INSTALL UNDER PRESSURE (the archive's design, 2026-10-31, as its latest notes have it): the woken queen SITS ROOTED at her post beside the console: the install's progress holds while she is within her guard of
//     the mount and not controlled (questMountBlocked ← js/bosses.js bossInstallBlocked); she throws toxic bombs and calls her brood; at half her health she goes FRANTIC and roams, and the way in is to lure her off,
//     SLEEP her (Side Quest's potion, js/potion.js, js/sidequest.js) and work while your followers hold her. A hit on you never cancels the install (js/stations.js); walking away does. The install is about 10 s
//     (`install`), the archive's number. After the purification the brood thins to a few stragglers (js/facilityspawn.js facilityBroodThin: the major infestation clears, as the archive asks).
//   SIDE QUEST (js/sidequest.js) is OPTIONAL and no step of the quest line: since build 2026-11-09tt he appears BY THE CRYSTAL once the queen has taken you out (`queenOutAt`), and later keeps to the Sewers'
//     maintenance platform off the north ledge (until then: the samples turned in AND about 10 toxic ants killed, the archive's "around 10"; `antKills` is still counted from the brood's deaths); the plate's
//     install hint mentions him once he is there, and where.
//   THE TERM is QUEST LINE for the whole sequence (the archive, 2026-10-31); a step of it is a step or an objective.
const QUEST_PURIFY = {
    id: "purify", title: "PURIFY THE SEWERS", col: "#8cff5a",
    samples: 3,          // toxic ant samples the bench wants, with one water sample
    modulePrice: 300,    // shards (the brief: "exchanges 800 shards for the module"; 300 since build 2026-11-01a, the owner's word: "make the purify the sewers purification module require only 300 shards")
    install: 600,        // frames the module takes to mount (the archive's "about 10 seconds"; js/stations.js purifier_mount.build is the same number): the player stays at the mount; the queen is woken when it begins
    cycle: 1800,         // frames the module runs before the water is clean (30 s); then a living boss is calmed
    discoverNear: 6,     // tiles from the outfall where the water-quality reading is taken (the culvert's doorway is 4.7 tiles from it: the reading comes as you arrive)
    // THE AMBUSH (the owner, 2026-11-09; it supersedes the queen asleep at her post from the start, `queenNear`): halfway through the install (`at` frames into it) THE THREE come at once, an ant TANK, STRIKER and
    // WORKER, toxic, at the queen's level, "a bit bigger and tougher" (size and health × 1.5: the agent's reading, provisional), up out of the ground within `near` tiles of the console, and go for you; their bites
    // poison your followers (js/combat.js FOLLOWER_POISON); the install holds until all three are dead. Then THE QUEEN comes out (`ambush` frames to see her, provisional) and takes you out: you and your squad
    // are sent back to the Crystal (questQueenTakesYou), and there SIDE QUEST is waiting (js/sidequest.js). The rest is as it was: she sleeps at her post, the install wakes her, and so on.
    trio: { at: 300, classes: ["tank", "striker", "worker"], level: 8, size: 1.5, hp: 1.5, near: [1.5, 4] },
    ambush: 90,
    dropLife: 18000,     // frames a dropped ant sample lies on the floor (5 minutes of play)
    closing: 1500,       // frames the closing line stays on the plate (25 s)
    boss: "sewer_cistern", gate: "sewer_gate_boss", sample: "pk_sewer_sample", puzzle: "sewer_sample", room: "sewers", outfall: "sewer_outfall",
};
const QUEST_FRESH = { purify: () => ({ discoveredAt: 0, puzzleAt: 0, puzzleHow: "", samplesAt: 0, turnedInAt: 0, moduleAt: 0, gateAt: 0, installedAt: 0, purifiedAt: 0, bossStartedAt: 0, bossResolvedAt: 0, bossOutcome: "", bossDefeated: 0, cycleLeft: 0, closeLeft: 0, drops: 0, antKills: 0, nestSeenAt: 0, trioAt: 0, trioKills: 0, trioDeadAt: 0, queenOutAt: 0 }) };   // (nestSeenAt: the first time you stood in the Nest, js/population.js; trioAt, trioKills, trioDeadAt, queenOutAt: the ambush, QUEST_PURIFY.trio)

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
function questSay(text, col) { if (typeof dialogueSay === "function") dialogueSay("player", text); }   // your note of a turn of the quest line, in the dialogue box (js/dialogue.js; col was the floating text's colour)
function _questInv(id) { return typeof invCount === "function" ? invCount(id) : 0; }
function questSamplesHeld() { return { ant: _questInv("toxic_sample"), water: _questInv("sewer_sample") }; }
function questSamplesReady(Q) { const h = questSamplesHeld(); return !!Q.turnedInAt || (h.ant >= QUEST_PURIFY.samples && h.water >= 1); }
function questActive(id) { const Q = questState(id); return !!Q.discoveredAt && !(Q.purifiedAt && !Q.closeLeft); }   // under way: discovered, and not yet closed
function questDone(id) { const Q = questState(id); return !!Q.purifiedAt; }

// THE STEPS, in the tutorial director's shape: the plate shows the first that is not done. (The discovery is not a step: before it the quest is not on the plate at all; it begins at the outfall.)
const QUEST_STEPS = {
    purify: [
        { id: "samples", title: "COLLECT THE SAMPLES",
          text: Q => { const h = questSamplesHeld(), P = QUEST_PURIFY; return "ANT SAMPLES " + Math.min(P.samples, h.ant) + "/" + P.samples + " (THE TOXIC ANTS OF THE SEWERS DROP THEM) · WATER SAMPLE " + Math.min(1, h.water) + "/1 (THE BANK ACROSS THE RIVER, AT ITS WEST END)."; },
          hint: Q => "THE BANK IS CUT OFF: AN ICE TECHNICIAN FREEZES A BRIDGE OVER THE RIVER, A FIRE TECHNICIAN DRILLS ITS ROCK FALL FROM THE SOUTH LEDGE, OR AN ELECTRIC TECHNICIAN'S LAUNCHER THROWS YOU OVER (TAP ITS TAG TWICE; THE DRAIN PIPE BRINGS YOU BACK).", done: Q => questSamplesReady(Q) },
        { id: "turnin", title: "TAKE THE SAMPLES TO THE LAB", text: Q => "THE ANALYSIS BENCH: THE CABINET AT THE WEST END OF THE EXPERIMENT LAB. STAND AT IT AND PRESS E (OR TAP IT).", hint: Q => "IT TAKES THE THREE ANT SAMPLES AND THE WATER SAMPLE TOGETHER.", done: Q => !!Q.turnedInAt },
        { id: "module", title: "BUY THE PURIFICATION MODULE", text: Q => "AT THE ANALYSIS BENCH: ◆" + QUEST_PURIFY.modulePrice + ". YOU HAVE ◆" + (typeof shardCount === "number" ? shardCount : 0) + ".", hint: Q => "KILLS PAY SHARDS. THE MODULE GOES IN YOUR PACK.", done: Q => !!Q.moduleAt },
        { id: "install", title: "INSTALL THE MODULE IN THE NEST",
          text: Q => "MOUNT THE MODULE ON THE CONSOLE ON THE TRASH DAM, BELOW THE BIG BARRED ARCH, AND STAY AT IT: " + Math.round(QUEST_PURIFY.install / 60) + " SECONDS." + (Q.gateAt ? "" : " THE WAY ONTO THE DAM: DRILL THROUGH THE RUBBLE AT THE EAST END OF THE SOUTH LEDGE (A FIRE TECHNICIAN), OR FREEZE A BRIDGE ACROSS THE WATER (AN ICE TECHNICIAN)."),
          hint: Q => !Q.queenOutAt ? "STAY AT THE CONSOLE UNTIL THE MODULE IS IN: WALKING AWAY STOPS IT, AND IT STARTS AGAIN." + (Q.trioAt && !Q.trioDeadAt ? " THREE TOXIC ANTS HAVE COME FOR YOU: THE INSTALL HOLDS UNTIL ALL THREE ARE DEAD. THEIR BITES POISON YOUR FOLLOWERS." : "")   // (before the ambush: the three, then the queen; after it, her as she was)
              : _questBossName() + " SLEEPS BESIDE THE CONSOLE. THE INSTALL WAKES HER: SHE SITS ROOTED THERE, THROWS TOXIC BOMBS AND CALLS HER BROOD, AND THE INSTALL HOLDS WHILE SHE IS AT THE CONSOLE. ASLEEP, STUNNED, FROZEN OR GLITCHED SHE LETS GO OF IT; AT HALF HER HEALTH SHE GOES FRANTIC AND ROAMS: LURE HER OFF AND WORK. HER BITES DO NOT STOP THE INSTALL; WALKING AWAY DOES. OR KILL HER." + (typeof sqWhereSaid === "function" && sqWhereSaid() ? " SIDE QUEST, " + sqWhereSaid() + ", SELLS A SLEEPING POTION." : ""), done: Q => !!Q.installedAt },   // (his name, not "THE DRONE": the owner, 2026-11-02, "Say SIDE QUEST", once he was drawn as the void walker)
        { id: "purify", title: "THE WATER CLEARS", text: Q => "THE MODULE IS RUNNING: " + Math.ceil((Q.cycleLeft || 0) / 60) + " S. THE RIVER CLEARS AS IT GOES.", hint: Q => "THE QUEEN NEED NOT DIE: CLEAN WATER CALMS HER, AND SHE KEEPS HER POST.", done: Q => !!Q.purifiedAt },
    ],
};
function _questBossName() { const E = typeof bossEnc === "function" ? bossEnc(QUEST_PURIFY.boss) : null; return E && E.name || "THE BOSS"; }
// a toxic ant of the Sewers' brood has died (js/drops.js onPredatorDeath): counted toward Side Quest's appearance (js/sidequest.js sqUnlocked); never the queen, never a thinned straggler (those die without a death)
function questAntKilled(p) {
    if (!p || !p.sewerBrood || p.bossId || p.team === "green" || p.isClone) return false;
    const Q = questState("purify"); Q.antKills = (Q.antKills || 0) + 1; return true;
}
function questStepIndex(id) { const Q = questState(id), S = QUEST_STEPS[id] || []; for (let i = 0; i < S.length; i++) if (!S[i].done(Q)) return i; return S.length; }
// what the plate shows for the quest under way: { key, title, body, hint, col }, or null (js/tutorial.js facilityDrawObjective)
function questObjective() {
    for (const id of Object.keys(QUEST_STEPS)) {
        if (!questActive(id)) continue;
        const Q = questState(id), S = QUEST_STEPS[id], i = questStepIndex(id), P = QUEST_PURIFY;
        if (i < S.length) { const st = S[i]; return { key: id + ":" + st.id, title: P.title + "  ·  " + (i + 1) + "/" + S.length + "  ·  " + st.title, body: st.text(Q), hint: st.hint(Q), col: P.col }; }
        const boss = Q.bossOutcome === "defeated" ? _questBossName() + " IS DEAD." : Q.bossOutcome === "calm" ? _questBossName() + " SITS BY THE CONSOLE, ALIVE AND CALM." : "";
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
    // THE QUEEN IS NOT THERE until the ambush (the owner, 2026-11-09: "the queen does not appear until the player halfway installs the purification module", then "the queen comes out after you defeat them"):
    // a queen asleep at her post from before (a game saved under the old rule, she was there once you came within 10 tiles) goes, quietly; the ambush brings her out (below)
    if (!Q.trioDeadAt && !Q.bossStartedAt && typeof bossState === "function") { const S = bossState(P.boss); if (S && S.state === "armed") _questQueenAway(S); }
    if (Q.trioDeadAt && !Q.queenOutAt) _questAmbushTick(Q, P);   // the queen comes out and takes you out
    if (!Q.gateAt && typeof facilitySolidIsOpen === "function" && facilitySolidIsOpen(P.gate)) questMark(Q, "gateAt", "◈ THE RUBBLE IS DRILLED THROUGH — THE WAY ONTO THE DAM IS OPEN");   // (the way in: js/facilitymap.js rubble_sewer_gate)
    if (Q.discoveredAt && !Q.samplesAt && questSamplesReady(Q)) questMark(Q, "samplesAt", "◈ EVERY SAMPLE IS IN YOUR PACK — THE ANALYSIS BENCH IN THE EXPERIMENT LAB WANTS THEM");
    if (!Q.nestSeenAt && typeof facilityAreaAt === "function") { const a = facilityAreaAt(player.x, player.y, P.room); if (a && a.nest) questMark(Q, "nestSeenAt", "◈ THE NEST: THE QUEEN'S COLONY, BUILT ON A DAM OF TRASH ACROSS THE WATER. HER EGGS ARE EVERYWHERE — THE BROOD COMES FROM HERE", "#8cff5a"); }   // (your note, once, the first time you stand in it: js/population.js NESTS)
    if (Q.installedAt && !Q.purifiedAt) {   // THE CYCLE: the module runs, the water clears, then the boss is calmed if it lives
        Q.cycleLeft = Math.max(0, (Q.cycleLeft || 0) - 1);
        if (!Q.cycleLeft) { questMark(Q, "purifiedAt", "◈ THE RUNOFF RUNS CLEAN — THE SEWERS ARE PURIFIED", "#9dffb6"); Q.closeLeft = P.closing; if (typeof bossCalm === "function") bossCalm(P.boss); if (typeof facilityBroodThin === "function") facilityBroodThin(); if (typeof facilityBroodCleanse === "function") facilityBroodCleanse(); }   // (the major infestation clears, and what is left is toxic no more: js/facilityspawn.js)
    }
    if (Q.purifiedAt && Q.closeLeft > 0) Q.closeLeft--;
    // the step that is up is noted once, by you (its words, then its hint: the dialogue box; js/tutorial.js tutSaidOnce keeps the record in the save)
    if (Q.discoveredAt && !Q.purifiedAt && typeof dialogueSay === "function" && typeof tutSaidOnce === "function") { const i = questStepIndex("purify"), st = QUEST_STEPS.purify[i]; if (st && tutSaidOnce("quest:purify:" + st.id)) dialogueSay("player", [st.title + ". " + st.text(Q), st.hint(Q)], { key: "quest:purify:" + st.id }); }
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
// the bench, in the quest line's order: ANALYSE, then BUY the module; after that, with Side Quest's potion in the pack, it COPIES the potion (the archive's reverse-engineering, js/potion.js: ◆100, a quarter of the effect)
function _questBenchCopies() { const Q = questState("purify"); return !!Q.moduleAt && typeof potionCopyWanted === "function" && potionCopyWanted(); }
function questBenchVerb() { const Q = questState("purify"); return !Q.turnedInAt ? "ANALYSE THE SAMPLES" : !Q.moduleAt ? "BUY THE PURIFICATION MODULE ◆" + QUEST_PURIFY.modulePrice : _questBenchCopies() ? potionCopyVerb() : "NOTHING MORE TO ANALYSE"; }
function questBenchCan() {
    const Q = questState("purify"), P = QUEST_PURIFY;
    if (!Q.turnedInAt) {
        if (!Q.discoveredAt) return { ok: false, why: "NOTHING TO ANALYSE YET" };
        const h = questSamplesHeld(); if (h.ant < P.samples || h.water < 1) return { ok: false, why: "IT WANTS " + P.samples + " ANT SAMPLES AND THE WATER SAMPLE · " + Math.min(P.samples, h.ant) + "/" + P.samples + " AND " + Math.min(1, h.water) + "/1" };
        return { ok: true };
    }
    if (!Q.moduleAt) { const have = typeof shardCount === "number" ? shardCount : 0; if (have < P.modulePrice) return { ok: false, why: "NEED ◆" + (P.modulePrice - have) + " MORE FOR THE MODULE" }; if (typeof invRoom === "function" && invRoom("purification_module") < 1) return { ok: false, why: "YOUR PACK ALREADY HOLDS A MODULE" }; return { ok: true }; }
    if (_questBenchCopies()) return potionCopyCan();
    return { ok: false, why: "THE MODULE IS BOUGHT · INSTALL IT IN THE SEWERS' CISTERN", done: true };
}
function questBenchUse() {
    const Q = questState("purify"), P = QUEST_PURIFY, can = questBenchCan(); if (!can.ok) return can;
    if (!Q.turnedInAt) {
        if (!invRemove("toxic_sample", P.samples) || !invRemove("sewer_sample", 1)) return { ok: false, why: "THE SAMPLES ARE NOT ALL HERE" };
        questMark(Q, "turnedInAt");
        return { ok: true, msg: "SAMPLES ANALYSED — THE RUNOFF IS TOXIC. THE BENCH CAN BUILD A PURIFICATION MODULE: ◆" + P.modulePrice };
    }
    if (!Q.moduleAt) { shardCount -= P.modulePrice; invAdd("purification_module", 1); questMark(Q, "moduleAt"); return { ok: true, msg: "PURIFICATION MODULE — IN YOUR PACK. MOUNT IT ON THE CONSOLE IN THE NEST, AT THE SEWERS' EAST END: THE BOSS GATE OPENS FOR IT" }; }
    return potionCopyUse();
}
// THE WAY ONTO THE DAM (build 2026-11-06l; the owner, 2026-11-06: "I never wanted a gate. I wanted rubble", "Rubble, drilled"): rubble a fire technician drills through (js/facilitymap.js rubble_sewer_gate,
// js/techabilities.js), or an ice bridge across the water. `gateAt` marks the rubble drilled (questTick); the Queen is not there until the install's ambush (QUEST_PURIFY.trio; until build
// 2026-11-09tt she was, asleep, once the player came within 10 tiles of her post).
function questMountVerb() { const Q = questState("purify"); return Q.installedAt ? (Q.purifiedAt ? "THE WATER RUNS CLEAN" : "THE MODULE IS RUNNING") : "INSTALL THE PURIFICATION MODULE"; }
function questMountCan() {
    const Q = questState("purify");
    if (Q.installedAt) return { ok: false, why: Q.purifiedAt ? "PURIFIED · NOTHING MORE TO DO HERE" : "THE MODULE IS RUNNING · " + Math.ceil((Q.cycleLeft || 0) / 60) + " S", done: true };
    if (typeof invHas === "function" && !invHas("purification_module")) return { ok: false, why: "IT TAKES THE PURIFICATION MODULE (THE ANALYSIS BENCH, EXPERIMENT LAB)" };
    return { ok: true };
}
function questMountStart() { if (typeof bossWake === "function") bossWake(QUEST_PURIFY.boss, "install"); }   // the install begins: the queen, if she is there (after the ambush), is woken (the pressure)
// why the install cannot go on this frame (js/stations.js facilityRelayTick, the mount's blockFn; it holds while one is said): halfway in, the three until they are dead, and the queen as she comes out (the
// ambush, QUEST_PURIFY.trio); then the queen at the console (js/bosses.js bossInstallBlocked); null when it can
function questMountBlocked() {
    const Q = questState("purify"), P = QUEST_PURIFY, c = typeof _fp !== "undefined" && _fp ? _fp.channel : null;
    if (Q.trioDeadAt && !Q.queenOutAt) return "⚠ " + _questBossName() + " COMES OUT";
    if (!Q.trioDeadAt && c && c.kind === "purifier_mount" && (c._trio || _questFrame() - c.t0 >= P.trio.at)) {   // (c._trio: reached; the hold keeps the progress a frame short of it between frames)
        if (!c._trio) { c._trio = true; const alive = questTrioAlive(); if (alive.length) alive.forEach(_questTrioGo); else questTrioSpawn(); }   // (once an install: those left from a try before are called back to you)
        const n = questTrioAlive().length; if (!n) { questMark(Q, "trioDeadAt"); return "⚠ " + _questBossName() + " COMES OUT"; }   // (none there, and none could come: the install is never stuck on them)
        return "THREE TOXIC ANTS · KILL ALL THREE AND THE INSTALL GOES ON · " + n + " LEFT";
    }
    return typeof bossInstallBlocked === "function" ? bossInstallBlocked(P.boss) : null;
}
// ── THE AMBUSH (QUEST_PURIFY.trio; the owner, 2026-11-09) ──
function questTrioAlive() { return typeof facilityCreatures === "function" ? facilityCreatures(QUEST_PURIFY.room).filter(a => a.questTrio && !a.dead) : []; }
// THE THREE come up out of the ground near the console, on your stretch of floor, and go for you (as the queen's waves did: js/bosses.js _bossWave); a fresh three each time none of them is alive (a game
// loaded in the middle of the fight has none: they come again), their kills counted again
function questTrioSpawn() {
    const Q = questState("purify"), P = QUEST_PURIFY, T = P.trio, E = typeof bossEnc === "function" ? bossEnc(P.boss) : null, m = typeof bossMount === "function" ? bossMount(E) : null;
    if (!m || typeof facilitySpawnCreature !== "function" || typeof partyRoomCells !== "function") return 0;
    const cm = typeof _fpComps === "function" ? _fpComps() : null, here = cm && typeof _fpNearestCell === "function" ? (typeof _fpNearestCellOpen === "function" ? _fpNearestCellOpen : _fpNearestCell)(player.visualX, player.visualY) : null, hc = here ? cm.get(here[0] + "," + here[1]) : undefined;
    let spots = partyRoomCells(P.room).filter(c => { const d = Math.hypot(c[0] - m.x, c[1] - m.y), dp = Math.hypot(c[0] - player.x, c[1] - player.y); return d >= T.near[0] && d <= T.near[1] && dp >= 1.2 && (hc === undefined || cm.get(c[0] + "," + c[1]) === hc); });
    let n = 0; Q.trioKills = 0;
    for (const cls of T.classes) {
        if (!spots.length) break;
        const c = spots.splice(Math.floor(Math.random() * spots.length), 1)[0];
        let p = null; try { p = facilitySpawnCreature("ant", [c[0], c[1]], { room: P.room, species: ["ant"], classes: { [cls]: 1 }, levels: [T.level, T.level], element: "toxic" }); } catch (e) { p = null; }
        if (!p) continue;
        if (p.dimensions) { p.dimensions.width *= T.size; p.dimensions.height *= T.size; }   // a bit bigger (js/bugs3d.js scales by its width)
        p.maxHealth = Math.round(p.maxHealth * T.hp); p.health = p.maxHealth;                 // and tougher
        p.questTrio = true; p.poisonsFollowers = true; p.spawnProtection = 0; _questTrioGo(p);
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: p.x, y: p.y, color: "#8cff5a", radius: 0.9, life: 24, element: "toxic" });
        spots = spots.filter(q => Math.hypot(q[0] - c[0], q[1] - c[1]) >= 1.5); n++;
    }
    if (n) { questMark(Q, "trioAt"); if (typeof bossSay === "function") bossSay("⚠ THREE TOXIC ANTS COME UP OUT OF THE DAM — A TANK, A STRIKER AND A WORKER", "#8cff5a"); }
    return n;
}
// one of the three goes for you
function _questTrioGo(p) { p.provoked = true; p.lastAttacker = player; if (typeof predatorPreyOk === "function" && predatorPreyOk(p, player)) { p.currentTarget = player; p._prey = player; p.state = "attack"; } }
// one of the three has died (js/drops.js onPredatorDeath): the third, and the queen comes out
function questTrioKilled(p) {
    if (!p || !p.questTrio) return false;
    const Q = questState("purify"); Q.trioKills = (Q.trioKills || 0) + 1;
    if (Q.trioKills >= QUEST_PURIFY.trio.classes.length && !questTrioAlive().filter(a => a !== p).length) questMark(Q, "trioDeadAt");
    return true;
}
// a queen at her post before the ambush (a game saved under the old rule) goes, without a death: her encounter forgets her first, or it would record her as defeated
function _questQueenAway(S) { const b = S.unit; S.unit = null; S.state = "idle"; S.started = 0; if (b) { b.dead = true; b.deathProcessed = true; b.progressCounted = true; b.bossId = null; } }
// THE QUEEN COMES OUT (once you are in the Nest: a game loaded with the three dead and no ambush yet waits for you there): she is put at her post awake, you are safe for the moment she takes, and then she
// takes you out (questQueenTakesYou). Away from you, at the Crystal, she goes back to sleep at her post by herself (js/bosses.js bossTick: past her leash).
function _questAmbushTick(Q, P) {
    const A = _fp._questAmbush || (_fp._questAmbush = { t0: 0 }), f = _questFrame();
    if (!A.t0) {
        const E = typeof bossEnc === "function" ? bossEnc(P.boss) : null, at = E && typeof bossLair === "function" ? bossLair(E) : null;
        if (!at || typeof partyRoomAt !== "function" || partyRoomAt(player.x, player.y) !== P.room || Math.hypot(at[0] - player.x, at[1] - player.y) > (E.leash || 15)) return;
        const S = bossState(P.boss); if (S && S.state === "idle" && typeof bossArm === "function") bossArm(P.boss);
        if (!(typeof bossUnit === "function" && bossUnit(P.boss))) return;   // (the world cannot hold her yet)
        if (typeof bossWake === "function") bossWake(P.boss, "ambush");
        A.t0 = f; player.invuln = Math.max(player.invuln || 0, P.ambush + 30);   // (nothing takes you out before she does)
        if (typeof shake !== "undefined") shake = Math.max(shake || 0, 10);
        return;
    }
    if (f - A.t0 >= P.ambush) { questQueenTakesYou(); questMark(Q, "queenOutAt"); _fp._questAmbush = null; }
}
// SHE TAKES YOU OUT (the owner, 2026-11-09: "she destroys you and sends you back to the crystal"; your squad "Comes back with you"): you are back at the Crystal as a knock-back puts you there (js/game.js), with
// all your hits, but nothing is paid from the Crystal for it (a story's turn, not a fall); the followers of your squad come with you (those holding rooms stay where they are); the install stops (it starts again)
function questQueenTakesYou() {
    if (typeof player === "undefined" || typeof crystal === "undefined" || !crystal) return false;
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: player.x, y: player.y, color: "#8cff5a", radius: 2.2, life: 30, element: "toxic" });
    if (typeof _fp !== "undefined" && _fp && _fp.channel) _fp.channel = null;
    health = typeof PLAYER_HITS !== "undefined" ? PLAYER_HITS : 3;
    player.x = player.targetX = player.visualX = crystal.x + 2; player.y = player.targetY = player.visualY = crystal.y; player.fpPath = null;
    player.invuln = typeof PLAYER_RESPAWN_GRACE !== "undefined" ? PLAYER_RESPAWN_GRACE : 90;
    const squad = typeof partyMembers === "function" ? partyMembers() : followers.filter(f => !f.dead && !f.post);
    for (const f of squad) { if (!f || f.dead) continue; f.x = player.x + (Math.random() - 0.5) * 1.6; f.y = player.y + 0.6 + Math.random() * 1.2; f.currentTarget = null; f._prey = null; f.returningToCrystal = false; }
    { const pc = typeof mutatorClone === "function" ? mutatorClone() : null; if (pc && !pc.dead) { pc.x = player.x - 1; pc.y = player.y + 1; } }   // (the Mutator's clone is one of the squad)
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 60, text: "◈ " + _questBossName() + " TAKES YOU DOWN — BACK AT THE CRYSTAL", color: "#8cff5a", life: 160, vy: -0.2, size: 14 });
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 12);
    return true;
}
function questMountUse() {   // the install is complete (js/stations.js buildComplete took the module): the cycle begins
    const Q = questState("purify"), P = QUEST_PURIFY; if (Q.installedAt) return { ok: false, why: "IT IS INSTALLED" };
    Q.cycleLeft = P.cycle; questMark(Q, "installedAt");
    return { ok: true, msg: "THE MODULE IS MOUNTED AND RUNNING — THE WATER CLEARS IN " + Math.round(P.cycle / 60) + " S" };
}

// ── the boss (js/bosses.js tells the quest) ──
function questBossStarted(id) { const Q = questState("purify"); if (id === QUEST_PURIFY.boss) questMark(Q, "bossStartedAt"); }
function questBossResolved(id, outcome) {
    const Q = questState("purify"); if (id !== QUEST_PURIFY.boss) return;
    if (outcome === "defeated") { const first = !Q.bossDefeated; Q.bossDefeated = Math.max(1, _questNow()); if (first && !Q.purifiedAt && typeof facilityBroodThin === "function") facilityBroodThin(); }   // (her death thins the brood, the water clean or not: the owner, 2026-11-01)
    if (!Q.bossResolvedAt) { Q.bossOutcome = outcome; questMark(Q, "bossResolvedAt"); }
}

// ── the save (js/facilitysave.js): the records as they are; a load puts the world's part of them back (the gate open) ──
function questSnapshot() { const out = {}; const q = typeof _fp !== "undefined" && _fp && _fp.quests || {}; for (const id of Object.keys(q)) out[id] = Object.assign({}, q[id]); return out; }
function questApply(d) {
    if (typeof _fp === "undefined" || !_fp) return false; _fp.quests = {}; _fp._questAmbush = null;   // (the queen's moment is not saved: a game loaded in it has her come out again)
    if (!d || typeof d !== "object") return false;
    for (const id of Object.keys(QUEST_FRESH)) {
        const s = d[id]; if (!s || typeof s !== "object") continue;
        const Q = questState(id); for (const k of Object.keys(Q)) if (k in s) { const v = s[k]; if (typeof Q[k] === "number") { if (Number.isFinite(v)) Q[k] = Math.max(0, v); } else if (typeof Q[k] === "string" && typeof v === "string") Q[k] = v; }
        if (Q.installedAt && !Q.purifiedAt && !(Q.cycleLeft > 0)) Q.cycleLeft = 1;   // (a cycle that was saved as over but not marked: it finishes on the next tick)
        if (Q.purifiedAt && Q.closeLeft > QUEST_PURIFY.closing) Q.closeLeft = QUEST_PURIFY.closing;
        if (id === "purify" && Q.bossStartedAt && !("queenOutAt" in s)) { Q.trioAt = Q.trioAt || Q.bossStartedAt; Q.trioDeadAt = Q.trioDeadAt || Q.bossStartedAt; Q.queenOutAt = Q.bossStartedAt; }   // (a game from before the ambush, build 2026-11-09tt, whose encounter had begun: it goes on as it was)
    }
    const Q = questState("purify"); if (Q.gateAt && typeof facilitySolidOpen === "function") facilitySolidOpen(QUEST_PURIFY.gate);   // (the gate stays open)
    return true;
}
