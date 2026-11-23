// WHO LIVES WHERE (js/population.js ENEMY_RACES, SPAWN_TABLES, spawnStage, spawnWhat, NESTS, nestState; the spawners that ask it: js/facilityspawn.js FP_SPAWN, FP_SPAWN_SEWERS, js/bosses.js an encounter's waves).
// ASKED (2026-11-01): "The initial arena population should be entirely composed of the Ant race [...] Do not introduce unrelated enemy races into the initial arena population [...] The subsequent sewer spawn system
// should also initially be populated by the Ant race [...] Connect sewer infestation and spawning to the Nest and Queen Ant systems [...] Ensure purification and boss resolution do not accidentally break spawn-state
// management [...] Avoid hardcoding duplicate spawning logic for the arena and sewer [...] keep spawn tables and encounter-specific rules separate [...] Make future expansion to additional races possible without
// rewriting the system." And: "Connect Queen Ant progression to the Nest's infestation state"; "Only one queen in sewers for now".
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
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; crystal.health = crystal.maxHealth = 1e7; canvas.width = 1280; canvas.height = 860; health = 1e6;
        _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; classPickerOpen = false; playerClassKey = 'gunslinger';
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__wild = () => { actors = actors.filter(a => !a.fpCreature && !a.bossId); };
        globalThis.__fresh = () => { const F = _fp.F; actors = actors.filter(a => !(a instanceof Predator)); facilityTutorialStart(F); _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; _fp.quests = {}; _fp.bosses = {}; _fp.broodAt = undefined; bossShots = []; };
        globalThis.__sewers = () => { const p = _fp.portals.find(q => q.room === 'sewers'); __put(p.ax, p.ay); };`);

    group('THE TABLES (js/population.js)');
    check('one race per kind of creature, each of a species the game has; the ants are the Nest\'s (the Toxic Ant Queen\'s colony in the Sewers), the roly-polies the electrical domain\'s (build 2026-11-13aa), the other five on no table', () => {
        const r = J(`(function(){ const R = ENEMY_RACES; return { ids: Object.keys(R).join(), known: Object.values(R).every(x => x.species.every(s => !!SPECIES[s])), ant: R.ant.nest, nest: NESTS[R.ant.nest] && [NESTS[R.ant.nest].room, NESTS[R.ant.nest].queen, NESTS[R.ant.nest].label],
            others: Object.keys(R).filter(k => k !== 'ant' && k !== 'rolypoly').filter(k => Object.values(SPAWN_TABLES).some(T => T.some(s => s.races.includes(k)))).length, rp: Object.keys(SPAWN_TABLES).filter(t => SPAWN_TABLES[t].some(s => s.races.includes('rolypoly'))).join(), species: Object.keys(SPECIES).filter(s => !speciesRace(s) && !(SPECIES[s].boss && Object.keys(SPECIES[s]).every(k => k === 'boss' || !SPECIES[s][k] || !SPECIES[s][k].width))).join() }; })()`);
        same(r.ids, 'ant,beetle,spider,scorpion,mantis,moth,rolypoly', 'the races'); same(r.rp, 'electrical', 'the roly-polies\' table'); same(r.known, true, 'a race of a species the game does not have'); same(r.ant, 'sewer_nest', 'the ants\' Nest');
        same(r.nest.join(), 'sewers,sewer_cistern,THE NEST', 'the Nest: in the Sewers, the Toxic Ant Queen\'s'); same(r.others, 0, 'another race on a table'); same(r.species, '', 'a species of no race (a boss and nothing else, the diving beetle larva, is its encounter\'s: js/bosses.js)');
    });
    check('the arena\'s table: ants only, WEAK FIRST (the owner, 2026-11-23): four stages by how far the game has got, workers / + scouts (the Crystal\'s defence won) / + strikers (the tutorial over) / + tanks (a class\'s first stage done), each kind at the weight it has in the full mix (scout 3, worker 3, striker 2, tank 1), level 2 to 4 throughout; the spawner reads the stage in force (FP_SPAWN.species, .classes, .levels)', () => {
        const r = J(`(function(){ __fresh(); const S = _fp.tut.script, AI = TUT_STEPS.findIndex(s => s.id === 'assault'), keepClass = playerClassKey, o = {};
            const at = () => { const st = spawnStage('arena'); return [spawnProgress(), st.id, JSON.stringify(FP_SPAWN.classes), FP_SPAWN.levels.join(), FP_SPAWN.classes === st.classes && FP_SPAWN.levels === st.levels, FP_SPAWN.species.join(), spawnWhat(FP_SPAWN).element].join(' '); };
            const picks = () => { const seen = {}; for (let i = 0; i < 400; i++) seen[_fsPickClass('ant')] = 1; return Object.keys(seen).sort().join(); };
            S.cstages = {}; S.cstep = 0; playerClassKey = null;
            S.step = 0; o.p0 = at(); o.k0 = picks(); S.step = AI; o.pa = at();                       // the beginning; the assault's own step is still the beginning
            S.step = AI + 1; o.p1 = at(); o.k1 = picks();                                              // the Crystal's defence won
            S.step = TUT_STEPS.length; o.p2 = at(); o.k2 = picks();                                    // the tutorial over, no class yet
            playerClassKey = 'gunslinger'; S.cstep = 1; o.p2c = at();                                  // a class chosen, its stage under way
            S.cstep = TUT_CLASS_STAGES.gunslinger.length; o.p3 = at(); o.k3 = picks();                 // its stage done
            questState('purify').purifiedAt = 5; o.p4 = at(); o.k4 = picks(); o.cap4 = FP_SPAWN.cap; questState('purify').purifiedAt = 0; o.cap3 = FP_SPAWN.cap;   // the Sewers purified: the tanks
            S.cstages = { gunslinger: { cstep: TUT_CLASS_STAGES.gunslinger.length } }; playerClassKey = 'mutator'; S.cstep = 0; o.kept = at();   // changed class: nothing is taken back
            _fp.tut.script = null; o.none = at(); _fp.tut.script = S;                                  // a game with no tutorial: as far as it goes
            o.counts = SPAWN_TABLES.arena.map(st => { const c = st.count || FP_SPAWN.full; return c.start + '/' + c.cap + '/' + c.every; }).join(' '); o.ids = SPAWN_TABLES.arena.map(st => st.id + ':' + (st.until || '') + ':' + st.races.join() + ':' + st.levels.join('-')).join(' '); o.table = FP_SPAWN.table;
            playerClassKey = keepClass; __fresh(); return o; })()`);
        same(r.ids, 'ants_first:defended:ant:2-4 ants_scouts:evolved:ant:2-4 ants_strikers:classed:ant:2-4 ants_classed:tanks:ant:2-4 ants::ant:2-4', 'the stages, their events, races and levels (build 2026-11-17cy: a fifth, tanks wait for the purification)'); same(r.counts, '2/3/2400 2/4/1800 3/5/1500 3/6/1500 4/7/1200', 'how many the arena holds at each stage: its start, its cap, the frames between two'); same(r.table, 'arena', 'the table');
        same(r.p0, '0 ants_first {"worker":3} 2,4 true ant ', 'the beginning'); same(r.pa, r.p0, 'the assault\'s own step is not still the beginning'); same(r.k0, 'worker', 'what comes at the beginning');
        same(r.p1, '1 ants_scouts {"scout":3,"worker":3} 2,4 true ant ', 'the Crystal\'s defence won'); same(r.k1, 'scout,worker', 'what comes then');
        same(r.p2, '2 ants_strikers {"scout":3,"worker":3,"striker":2} 2,4 true ant ', 'the tutorial over'); same(r.k2, 'scout,striker,worker', 'what comes then'); same(r.p2c, r.p2, 'a class\'s stage under way is not its stage done');
        same(r.p3, '3 ants_classed {"scout":3,"worker":3,"striker":2} 2,4 true ant ', 'a class\'s first stage done: still no tanks'); same(r.k3, 'scout,striker,worker', 'what comes then'); same(r.p4, '3 ants {"scout":3,"worker":3,"striker":2,"tank":1} 2,4 true ant ', 'the Sewers purified: the full mix, the one the arena always had'); same(r.k4, 'scout,striker,tank,worker', 'what comes then'); same(r.cap3 + ',' + r.cap4, '6,7', 'the cap before and after');
        same(r.kept, r.p3, 'changing class took a milestone back'); same(r.none, r.p4, 'a game with no tutorial is not as far as it goes');
    });
    check('the Sewers\' table: the Nest\'s toxic ants in all four classes, the strong place (the owner, 2026-11-23: "Yes, add strikers and tanks"; they were workers and scouts; the mix the arena\'s full one, the agent\'s, provisional) (level 3 to 5), its brood; the queen\'s: her toxic nymphs (level 2 to 3), brood too; the encounter keeps only its own rules (how many, when, where)', () => {
        const r = J(`(function(){ const s = spawnWhat(FP_SPAWN_SEWERS), q = spawnWhat(BOSS_ENCOUNTERS.sewer_cistern.waves), W = BOSS_ENCOUNTERS.sewer_cistern.waves; return { s: [s.species.join(), JSON.stringify(s.classes), s.levels.join(), s.element, s.brood], via: [FP_SPAWN_SEWERS.species.join(), FP_SPAWN_SEWERS.element, FP_SPAWN_SEWERS.brood],
            q: [q.species.join(), JSON.stringify(q.classes), q.levels.join(), q.element, q.brood], rules: Object.keys(W).sort().join() }; })()`);
        same(r.s.join(), 'ant,{"scout":3,"worker":3,"striker":2,"tank":1},3,5,toxic,true', 'the brood'); same(r.via.join(), 'ant,toxic,true', 'the brood as the spawner reads it');
        same(r.q.join(), 'ant,{"nymph":1},2,3,toxic,true', 'the queen\'s infantry'); same(r.rules, 'every,first,n,near,table', 'the waves\' own rules');
    });
    check('one spawner\'s code for all three: the arena\'s, the brood\'s and the queen\'s call each go through facilitySpawnCreature with what the table says (the source: no species list left in the spawners)', () => {
        const fs0 = rd('js/facilityspawn.js'), b = rd('js/bosses.js');
        ok(!/species: \[/.test(fs0.split('function _fsArenaCells')[0]), 'a species list in the spawners\' numbers');
        ok(/spawnWhat\(P\)/.test(fs0.split('function facilitySpawnCreature')[1].split('\n}')[0]), 'facilitySpawnCreature does not ask the table');
        ok(/table: W\.table/.test(b) && /facilitySpawnCreature\(W\.table \? null : E\.species/.test(b), 'the queen\'s waves do not go through the table');
    });

    group('A LATER STAGE, ANOTHER RACE (the architecture: "make future expansion to additional races possible without rewriting the system")');
    check('a stage waits for its event: with a stage that holds `until` the purification, it is in force until the water is clean, then the next one is (a line of data; restored after)', () => {
        const r = J(`(function(){ __fresh(); const T = SPAWN_TABLES.arena, keep = T.slice(), was = spawnStage('arena').id; T.unshift({ id: 'test_first', races: ['ant'], classes: { tank: 1 }, levels: [7, 7], until: 'purified' });
            const before = spawnStage('arena').id, cls = FP_SPAWN.classes.tank; questState('purify').purifiedAt = 5; const after = spawnStage('arena').id; questState('purify').purifiedAt = 0;
            const q = spawnStage('arena').id; T.length = 0; for (const s of keep) T.push(s); return { before, cls, after, q, was, back: spawnStage('arena').id }; })()`);
        same(r.before, 'test_first', 'the first stage before the purification'); same(r.cls, 1, 'the spawner reads the stage in force'); same(r.after, r.was, 'the next stage after it (the one that was in force)'); same(r.back, r.was, 'restored');
    });
    check('a second race is its name on a table: with the beetles added to the arena\'s, the spawner makes both, the kind there are fewer of first (restored after)', () => {
        const r = J(`(function(){ __fresh(); __wild(); __put(crystal.x + 2, crystal.y); const st = spawnStage('arena'); st.races.push('beetle'); const made = []; for (let i = 0; i < 6; i++) { const p = facilitySpawnCreature(); if (p) made.push(p.speciesName + ':' + p.race); }
            st.races.splice(st.races.indexOf('beetle'), 1); const kinds = [...new Set(made)].sort().join(); __wild(); return { n: made.length, kinds, ants: made.filter(m => m.startsWith('ant')).length, back: FP_SPAWN.species.join() }; })()`);
        same(r.n, 6, 'made'); same(r.kinds, 'ant:ant,beetle:beetle', 'the kinds'); same(r.ants, 3, 'the fewest first: three of each'); same(r.back, 'ant', 'restored');
    });

    group('THE NEST (js/population.js NESTS, nestState: read from the queen\'s encounter and the purification, no second state machine)');
    check('INFESTED with her gate shut and while she sleeps at her post, STIRRED once she is awake; CLEARED once she is dead, the water clean or not (the owner, 2026-11-01: killing her thins the brood too); CALMED with the water clean and her alive; CLEARED if she is killed after she was calmed', () => {
        const r = J(`(function(){ __fresh(); const S = bossState('sewer_cistern'), Q = questState('purify'), o = {};
            o.idle = nestState(); S.state = 'armed'; o.armed = nestState(); S.state = 'active'; o.active = nestState(); S.frantic = true; o.frantic = nestState(); S.frantic = false;
            S.state = 'resolved'; S.outcome = 'defeated'; o.deadFoul = nestState(); Q.purifiedAt = 9; o.deadClean = nestState();
            S.outcome = 'calm'; S.defeated = 0; o.calm = nestState(); S.defeated = 12; o.calmThenKilled = nestState();
            o.inf = [nestInfested(), NEST_STATES.join()]; Q.purifiedAt = 0; S.state = 'idle'; S.outcome = null; S.defeated = 0; o.back = [nestState(), nestInfested()]; return o; })()`);
        same([r.idle, r.armed, r.active, r.frantic].join(), 'infested,infested,stirred,stirred', 'before and during her encounter'); same(r.deadFoul, 'cleared', 'killed, the water still foul (her death thins the brood)');
        same(r.deadClean, 'cleared', 'killed, then the water clean'); same(r.calm, 'calmed', 'calmed alive'); same(r.calmThenKilled, 'cleared', 'killed after she was calmed'); same(r.inf.join(), 'false,infested,stirred,calmed,cleared', 'the states');
        same(r.back.join(), 'infested,true', 'restored');
    });
    check('the owner\'s answers of 2026-11-01: her death thins the brood though the water is still foul (a straggler at a time after it); the water clean makes the brood plain ants: those alive lose the element, the next come with none (SPAWN_TABLES.sewers\' second stage); the queen keeps hers', () => {
        const r = J(`(function(){ __fresh(); __wild(); __sewers(); const P = FP_SPAWN_SEWERS, Q = questState('purify'), S = bossState('sewer_cistern'), o = {};
            for (let i = 0; i < 6; i++) facilitySpawnCreature(null, null, P); const brood = () => facilityCreatures('sewers').filter(a => a.sewerBrood && !a.bossId);
            o.before = [brood().length, brood().every(a => a.element === 'toxic'), spawnWhat(P).stage];
            S.state = 'resolved'; S.outcome = 'defeated'; questBossResolved('sewer_cistern', 'defeated');
            o.killed = [brood().length <= P.after.cap, nestState(), nestInfested(), spawnWhat(P).element, spawnWhat(P).stage];
            Q.purifiedAt = 9; o.clean = [spawnWhat(P).element, spawnWhat(P).stage]; o.cleansed = facilityBroodCleanse(); o.left = brood().map(a => a.element);
            const q = facilitySpawnCreature(null, null, P); o.next = [q && q.element, q && q.sewerBrood];
            const qn = spawnCreature({ species: 'ant', className: 'boss', x: player.x + 3, y: player.y, level: 6, state: 'wander' }); qn.fpCreature = true; qn.homeRoom = 'sewers'; qn.bossId = 'sewer_cistern'; qn.sewerBrood = true; qn.element = 'toxic'; facilityBroodCleanse(); o.queen = qn.element; qn.dead = true; actors = actors.filter(a => a !== qn);
            __fresh(); __wild(); return o; })()`);
        same(r.before.join(), '6,true,brood', 'the brood before'); same(r.killed.join(), 'true,cleared,false,toxic,brood', 'her death, the water foul: the brood thinned, still toxic until the water is clean');
        same(r.clean.join(), ',brood_clean', 'the stage after the purification'); ok(r.cleansed >= 0 && r.left.every(e => e === null), 'the ants alive lost the element: ' + r.left.join()); same(r.next.join(), ',true', 'the next ant: no element, still the Nest\'s'); same(r.queen, 'toxic', 'the queen kept hers');
    });
    check('the Sewers\' brood follows the Nest: at its full numbers while the Nest is infested or stirred; a straggler at a time once it is calmed or cleared (the spawner asks nestInfested, not the quest)', () => {
        const r = J(`(function(){ __fresh(); __wild(); __sewers(); const P = FP_SPAWN_SEWERS, o = {}; _fp.broodAt = undefined; frame = 1000; facilityBroodTick(frame); o.first = facilityCreatures('sewers').length;
            for (let i = 0; i < 8; i++) { frame = _fp.broodAt; facilityBroodTick(frame); } o.full = facilityCreatures('sewers').length;
            __wild(); questState('purify').purifiedAt = 7; bossState('sewer_cistern').state = 'resolved'; bossState('sewer_cistern').outcome = 'calm'; o.nest = nestState(); _fp.broodAt = undefined; frame = 5000; facilityBroodTick(frame); o.calmFirst = facilityCreatures('sewers').length;
            for (let i = 0; i < 8; i++) { frame = _fp.broodAt; facilityBroodTick(frame); } o.calm = facilityCreatures('sewers').length; o.every = _fp.broodAt - frame;
            const src = ${JSON.stringify(rd('js/facilityspawn.js'))}.split('function facilityBroodTick')[1].split('\\n}')[0]; o.asks = /nestInfested\\(P\\.nest\\)/.test(src) && !/questDone/.test(src);
            __wild(); questState('purify').purifiedAt = 0; bossState('sewer_cistern').state = 'idle'; bossState('sewer_cistern').outcome = null; return o; })()`);
        same(r.first, 3, 'the first time in: FP_SPAWN_SEWERS.start'); same(r.full, 4, 'the full cap'); same(r.nest, 'calmed', 'the Nest calmed');
        same(r.calmFirst, 0, 'calmed: none at once'); same(r.calm, 1, 'calmed: a straggler at most'); same(r.every, 6000, 'calmed: one every 100 s'); same(r.asks, true, 'the brood asks the quest, not the Nest');
    });
    check('her infantry: a wave is the table\'s (six toxic nymphs of level 2 to 3, brood, beside her), while she is above half her health; none once she is frantic', () => {
        const r = J(`(function(){ __fresh(); __wild(); const E = BOSS_ENCOUNTERS.sewer_cistern, S = bossState('sewer_cistern'); bossArm('sewer_cistern'); const b = bossUnit('sewer_cistern'); __put(b.x - 4, b.y);
            bossWake('sewer_cistern', 'hit'); const n = _bossWave(E, S, b), w = facilityCreatures('sewers').filter(a => a.bossWave === 'sewer_cistern');
            const o = { n, kinds: [...new Set(w.map(a => [a.speciesName, a.className, a.element, a.sewerBrood, a.race].join(':')))].join('|'), lv: w.every(a => a.level >= 2 && a.level <= 3), near: w.every(a => Math.hypot(a.x - b.x, a.y - b.y) <= E.waves.near[1] + 0.01) };
            frame = S.waveAt; _bossWavesTick(E, S, b); o.timed = facilityCreatures('sewers').filter(a => a.bossWave === 'sewer_cistern').length;
            b.health = b.maxHealth * 0.4; S.frantic = false; _bossFrantic(E, S, b); const before = o.timed; frame += E.waves.every * 3; _bossWavesTick(E, S, b); o.frantic = facilityCreatures('sewers').filter(a => a.bossWave === 'sewer_cistern').length - before;
            __wild(); return o; })()`);
        same(r.n, 6, 'a wave');   // (six since build 2026-11-07dd, "Harder") same(r.kinds, 'ant:nymph:toxic:true:ant', 'what came'); same(r.lv, true, 'a level outside 2 to 3'); same(r.near, true, 'beside her');
        same(r.timed, 12, 'the next wave on its timer');   // (two waves of six since build 2026-11-07dd) same(r.frantic, 0, 'a wave once frantic');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
