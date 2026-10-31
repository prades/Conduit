// SIDE QUEST (js/sidequest.js; docs/SEWER-QUEST.md, "Side Quest and the Sleeping Potion")
// ASKED (the archive, 2026-10-31): a small flying drone, an outlander, "an optional side-quest giver, merchant, technician, and source of hints"; "a safe side passage or maintenance platform roughly halfway along the route";
// he appears "only after the required samples have been collected and returned to the Experiment Lab", with "approximately 10 Toxic Ants" killed ("not location alone"); the suggested opening; the promise as a moral
// choice that invalidates nothing; the user: his post-encounter line is "…" whether the queen is spared or killed.
//   WHEN           not before the lab turn-in, not before ten brood kills, not on location; both: he appears, the south ledge's side gate opens, he hovers at the passage's end with his station; the brood keeps off him
//   THE COUNT      a brood ant's death counts; the queen's and an arena creature's do not
//   THE CALL       the first time you come near, once
//   THE TALK       four lines a press, the archive's opening first; the choice of two buttons; I PROMISE or NO PROMISES recorded; his answer, then the hint; the quest line untouched by any of it; the shop after
//   AFTER          the queen's fate decided (calm, or defeated): "…", and the shop
//   THE SAVE       he comes back where he was, the gate open, the talk and the promise kept; the plate's install hint names him once he is there
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; crystal.health = crystal.maxHealth = 1e7; canvas.width = 1280; canvas.height = 860; innerWidth = 1100; health = 1e6;
        _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; classPickerOpen = false; playerClassKey = 'gunslinger';
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__clearSquad = () => { actors = actors.filter(a => !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); };
        globalThis.__tick = (n) => { for (let i = 0; i < n; i++) { frame++; if (player.invuln > 0) player.invuln--; techAbilityTick(); facilityTutorialTick(); for (const a of actors.slice()) if (!a.dead) updateNPC(a); updateStatusEffects(); actors = actors.filter(a => !a.dead || a.isFollower); } };
        globalThis.__kill = (a) => { a.health = 0; a.dead = true; a.deathProcessed = true; onPredatorDeath(a); actors = actors.filter(q => q !== a); };
        globalThis.__st = (id) => _fp.stations.find(s => s.id === id);
        globalThis.__near = (s) => { const g = _stApproach(s) || [s.x, s.y + 1.5]; __put(g[0], g[1]); return stationDist(s) <= STATION_RANGE; };
        globalThis.__Q = () => questState('purify'); globalThis.__S = () => sqState();
        globalThis.__sewers = () => { const p = _fp.portals.find(q => q.room === 'sewers'); __put(p.ax, p.ay); };
        globalThis.__gone = () => { _fp.items = _fp.items.filter(i => !(i.fp === 'sidequest' || (i.fp === 'station' && i.id === 'st_sidequest'))); _fp.stations = _fp.stations.filter(s => s.id !== 'st_sidequest'); _fp.sidequest = null; _fp._sqSpot = null; _fp.quests = {}; _fp.potion = null; invReset(); playerClassKey = 'gunslinger'; floatingTexts.length = 0; };   // (a test's reset: the game never takes him away)
        globalThis.__gate = () => _fp.F.solids.find(q => q.id === 'sewer_gate_s1');
        globalThis.__reload = (sv) => { const F = _fp.F; actors = actors.filter(a => !(a instanceof Predator)); facilityTutorialStart(F); invReset(); facilitySaveApply(sv); _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; };`);

    group('WHEN HE APPEARS (sqUnlocked, sqPlace, js/quests.js questAntKilled)');
    check('before: nobody, the side gate shut; the lab turn-in alone does not bring him, nor ten kills alone, nor standing in the Sewers; both together do: the gate opens, he hovers at the passage\'s end (floor of the Sewers, south of the gate\'s line, now walkable from the ledge), with his station on him; the brood keeps off him', () => {
        const r = J(`(function(){ const o = {}; __gone(); __clearSquad(); __sewers(); __tick(2); const g = __gate(); o.before = [sqPresent(), !!__st('st_sidequest'), facilitySolidIsOpen('sewer_gate_s1'), sqSpot(), sqUnlocked()];
            const Q = __Q(); Q.turnedInAt = 1; sqTick(); o.turnInOnly = [sqUnlocked(), sqPresent()]; Q.turnedInAt = 0; Q.antKills = QUEST_PURIFY.antTarget; sqTick(); o.killsOnly = [sqUnlocked(), sqPresent()];
            Q.turnedInAt = 1; __tick(2); const sp = sqSpot(), st = __st('st_sidequest'), it = _fp.items.find(i => i.fp === 'sidequest'), cx = (g.bb[0] + g.bb[2]) / 2, cy = (g.bb[1] + g.bb[3]) / 2;
            o.appeared = [sqUnlocked(), sqPresent(), facilitySolidIsOpen('sewer_gate_s1'), !!st, st && st.kind, !!it, partyRoomAt(sp[0], sp[1]), facilityStandOk(sp[0], sp[1]), sp[1] > cy, Math.hypot(sp[0] - cx, sp[1] - cy) <= 3.2, !!facilityPath(player.x, player.y, sp[0], sp[1]), floatingTexts.some(t => /SIDE PASSAGE/.test(t.text)), __S().appearedAt > 0];
            let near = 0; for (let i = 0; i < 150; i++) { const c = facilitySpawnSpot(FP_SPAWN_SEWERS); if (c && Math.hypot(c[0] - sp[0], c[1] - sp[1]) < 3) near++; } o.broodOff = near; return o; })()`);
        same(JSON.stringify(r.before), JSON.stringify([false, false, false, null, false]), 'before'); same(r.turnInOnly.join(), 'false,false', 'the turn-in alone'); same(r.killsOnly.join(), 'false,false', 'the kills alone');
        same(r.appeared.join('|'), 'true|true|true|true|sidequest|true|sewers|true|true|true|true|true|true', 'he did not appear as he should: ' + r.appeared.join('|')); same(r.broodOff, 0, 'the brood came up beside him');
    });
    check('the count: a brood ant\'s death counts toward him; the queen\'s does not, nor an arena creature\'s; the brood thinned quietly does not die (no count)', () => {
        const r = J(`(function(){ const o = {}; const Q = __Q(); Q.antKills = 0; __sewers(); const a = facilitySpawnCreature(null, null, FP_SPAWN_SEWERS); o.brood = !!a && a.sewerBrood; __kill(a); o.one = Q.antKills;
            const b = facilitySpawnCreature(null, null, FP_SPAWN_SEWERS); b.bossId = 'sewer_cistern'; __kill(b); o.queen = Q.antKills; const c = spawnCreature({ species: 'ant', className: 'scout', x: player.x + 2, y: player.y, level: 2, state: 'wander' }); c.fpCreature = true; c.homeRoom = 'arena'; __kill(c); o.arena = Q.antKills;
            for (let i = 0; i < 3; i++) facilitySpawnCreature(null, null, FP_SPAWN_SEWERS); Q.purifiedAt = 1; const gone = facilityBroodThin(); Q.purifiedAt = 0; o.thinned = [gone > 0, Q.antKills]; return o; })()`);
        same(r.brood, true, 'no brood ant'); same(r.one, 1, 'one kill'); same(r.queen, 1, 'the queen counted'); same(r.arena, 1, 'an arena creature counted'); same(r.thinned.join(), 'true,1', 'the thinning counted');
    });

    group('THE CALL, THE TALK, THE CHOICE, THE SHOP (sqTick, sqUse, sqChoose, js/stations.js STATION_KINDS.sidequest)');
    check('the first time you come within eight tiles he calls you over (once); at his station: TALK TO SIDE QUEST, the archive\'s opening word for word, NEXT, NEXT, then the ask and CHOOSE: the plate is dim and two buttons stand over it; NO PROMISES is recorded, he answers, and the plate sells the potion; nothing of the quest line changed', () => {
        const r = J(`(function(){ const o = {}; const sp = sqSpot(), st = __st('st_sidequest'), S = __S(), L = SIDEQUEST.lines; __put(sp[0], sp[1] - 6); o.farNoCall = [S.calledAt, sqSpeech()]; __put(sp[0], sp[1] - 4); __tick(2); o.call = [S.calledAt > 0, floatingTexts.some(t => t.text.indexOf(L.call) >= 0), sqSpeech() === L.call]; floatingTexts.length = 0; __tick(2); o.once = floatingTexts.some(t => t.text.indexOf(L.call) >= 0);
            const q0 = JSON.stringify(__Q()); o.near = __near(st); const V = () => STATION_KINDS.sidequest.verbFn(st), C = () => stationCan(st); o.v0 = [V(), C().ok];
            const steps = []; for (let i = 0; i < 4; i++) { const r = stationUse(st); steps.push([r.ok, !!r.quiet, S.talk, sqSpeech(), V()]); } o.steps = steps; o.choosing = [sqChoosing(), C().ok, C().why, stationUse(st).why];
            sqDrawOverlay(); o.buttons = _SQ_BTN.map(b => [b.yes, b.w > 100, b.h]); const B = _SQ_BTN[1]; o.tapMiss = sqTap(B.x - 300, B.y - 300); o.tap = sqTap(B.x + 5, B.y + 5); o.declined = [S.promised, S.promisedAt > 0, sqSpeech() === L.declined, V(), sqChoosing(), _SQ_BTN.length];
            __tick(SIDEQUEST.replyFrames + 2); o.hint = sqSpeech() === L.hint; o.quest = JSON.stringify(__Q()) === q0; shardCount = 1000; o.can = C().ok; const b1 = stationUse(st); o.shop = [b1.ok, invCount('sleeping_potion'), shardCount, potionEquipped(), V()]; o.again = stationUse(st).why; return o; })()`);
        same(r.farNoCall.join(), '0,', 'he called from far off'); same(r.call.join(), 'true,true,true', 'the call'); same(r.once, false, 'he called twice'); same(r.near, true, 'not at his station'); same(r.v0.join(), 'TALK TO SIDE QUEST,true', 'the first verb');
        const L = J('SIDEQUEST.lines'); same(JSON.stringify(r.steps), JSON.stringify([[true, true, 1, L.talk[0], 'NEXT'], [true, true, 2, L.talk[1], 'NEXT'], [true, true, 3, L.talk[2], 'NEXT'], [true, true, 4, L.talk[3], 'CHOOSE']]), 'the talk'); same(L.talk[0], "OH NO, IT'S CLOGGING EVERYTHING. LOOK, PLEASE, THERE HAS TO BE A WAY TO FIX THIS WITHOUT KILLING IT.", 'the archive\'s opening');
        same(r.choosing.join('|'), 'true|false|CHOOSE: I PROMISE, OR NO PROMISES|CHOOSE: I PROMISE, OR NO PROMISES', 'the choice'); same(JSON.stringify(r.buttons), JSON.stringify([[true, true, 44], [false, true, 44]]), 'the buttons'); same([r.tapMiss, r.tap].join(), 'false,true', 'the tap');
        same(r.declined.join('|'), '-1|true|true|BUY A SLEEPING POTION ◆100|false|0', 'NO PROMISES'); same(r.hint, true, 'the hint after his answer'); same(r.quest, true, 'the quest line changed'); same(r.can, true, 'the shop is shut'); same(r.shop.join('|'), 'true|1|900|sleeping_potion|BUY A SLEEPING POTION ◆100', 'the shop'); same(r.again, 'YOU HAVE ONE · THROW IT BEFORE YOU BUY ANOTHER', 'a second potion while holding one');
    });
    check('I PROMISE is the other answer (recorded 1, his thanks, then the hint); either way the shop; the promise changes nothing of the quest line and forbids nothing: killing the queen later is the quest line\'s business', () => {
        const r = J(`(function(){ const o = {}; const st = __st('st_sidequest'), S = __S(), L = SIDEQUEST.lines; S.talk = SIDEQUEST.lines.talk.length; S.promised = 0; S.replyUntil = 0; const q0 = JSON.stringify(__Q()); __near(st); sqDrawOverlay(); const A = _SQ_BTN[0]; o.tap = sqTap(A.x + 5, A.y + 5); o.promised = [S.promised, sqSpeech() === L.promised, STATION_KINDS.sidequest.verbFn(st)]; __tick(SIDEQUEST.replyFrames + 2); o.hint = sqSpeech() === L.hint; o.quest = JSON.stringify(__Q()) === q0;
            const Q = __Q(); Q.bossResolvedAt = 1; Q.bossOutcome = 'defeated'; Q.bossDefeated = 1; o.killedLater = [sqSpeech(), S.promised, sqChoosing(), STATION_KINDS.sidequest.verbFn(st)]; Q.bossOutcome = 'calm'; Q.bossDefeated = 0; o.spared = sqSpeech(); Q.bossResolvedAt = 0; Q.bossOutcome = ''; return o; })()`);
        same(r.tap, true, 'the tap'); same(r.promised.join('|'), '1|true|BUY A SLEEPING POTION ◆100', 'I PROMISE'); same(r.hint, true, 'the hint'); same(r.quest, true, 'the quest line changed');
        same(r.killedLater.join('|'), '…|1|false|BUY A SLEEPING POTION ◆100', 'after a kill: the placeholder, the promise kept as it was, the shop'); same(r.spared, '…', 'after a sparing: the placeholder');
    });
    check('met only after the queen\'s fate is decided: no talk, "…", and the shop; the plate\'s install hint names him once he is there', () => {
        const r = J(`(function(){ const o = {}; const st = __st('st_sidequest'), S = __S(); S.talk = 0; S.promised = 0; const Q = __Q(); Q.bossResolvedAt = 1; Q.bossOutcome = 'calm'; __near(st); shardCount = 100; invRemove('sleeping_potion', invCount('sleeping_potion')); o.after = [sqSpeech(), STATION_KINDS.sidequest.verbFn(st), stationCan(st).ok, sqChoosing()]; const b = stationUse(st); o.buys = [b.ok, invCount('sleeping_potion'), S.talk];
            Q.bossResolvedAt = 0; Q.bossOutcome = ''; Q.discoveredAt = 1; Q.samplesAt = 1; Q.turnedInAt = 1; Q.moduleAt = 1; const ob = questObjective(); o.plate = [ob.key, /THE DRONE IN THE SIDE PASSAGE OFF THE SOUTH LEDGE SELLS A SLEEPING POTION/.test(ob.hint)]; return o; })()`);
        same(r.after.join('|'), '…|BUY A SLEEPING POTION ◆100|true|false', 'after the encounter, unmet'); same(r.buys.join(), 'true,1,0', 'the shop without a talk'); same(r.plate.join(), 'purify:install,true', 'the plate\'s hint');
    });

    group('THE SAVE (js/facilitysave.js)');
    check('the record: that he appeared, the talk, the promise, the call; a load puts him back in his passage with the gate open and his station, the talk and the promise as they were; a save from before he appeared brings nobody', () => {
        const r = J(`(function(){ const o = {}; const S = __S(); S.talk = 4; S.promised = -1; const sv = facilitySaveCollect(); o.saved = sv.sidequest; const sp = sqSpot(); __reload(sv); const S2 = __S(), st = __st('st_sidequest'), sp2 = sqSpot();
            o.back = [sqPresent(), S2.appearedAt === sv.sidequest.at, S2.talk, S2.promised, S2.calledAt > 0, facilitySolidIsOpen('sewer_gate_s1'), !!st, sp2 && sp2[0] === sp[0] && sp2[1] === sp[1], _fp.items.filter(i => i.fp === 'sidequest').length, __Q().turnedInAt > 0, __Q().antKills];
            const sv2 = facilitySaveCollect(); sv2.sidequest = null; __reload(sv2); o.none = [sqPresent(), !!__st('st_sidequest'), _fp.items.filter(i => i.fp === 'sidequest').length]; return o; })()`);
        ok(r.saved && r.saved.at > 0 && r.saved.talk === 4 && r.saved.promised === -1 && r.saved.called > 0, 'the record: ' + JSON.stringify(r.saved)); same(r.back.join('|'), 'true|true|4|-1|true|true|true|true|1|true|1', 'the load'); same(r.none.join(), 'false,false,0', 'a save from before him');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
