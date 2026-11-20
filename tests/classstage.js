// EACH CLASS'S OWN STAGE AFTER THE TUTORIAL, AND ITS LOOP PLAYED THROUGH (docs/TUTORIAL.md, "The class stages"; js/tutorial.js TUT_CLASS_STAGES, and the class code that reports what the player did).
// ASKED (the brief, step 9): "Integrate each class into its tutorial progression and test the full loops." "Each class should have its own tutorial stage after the initial tutorial."
//   THE STAGES      the class's gear first (its station's perk, as before), then its loop: the Gunslinger's cameras, a flare and a hunt; the Technomancer's is its gear alone; the Mutator's clone, an upgrade and a serum
//                   (build 2026-11-17as: every personal weapon but the Gunslinger's machine gun went, and with them the Technomancer's punches and arcs and the Mutator's lash; no step has a training creature now)
//   THE FULL LOOPS  each stage played through with the game's own functions (the stations, the Clone Bay, the serum hood), from the class picker to the closing line
//   THE SAVE        the stage is kept by its step's number; a game saved before the steps went is read through the old lists (facilitySaveCStep, js/facilitysave.js)
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
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; crystal.health = crystal.maxHealth = 1e7; _fp.items = _fp.items.filter(i => !(i.fp === 'prop' && i.kind === 'sentry'));   // (no sentries; a Crystal that cannot fall)
        if (typeof facilitySpawnTick === 'function') facilitySpawnTick = () => {};   // (no arena spawner: the only creatures are the ones a check makes)
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isNeutralRecruit); for (const f of followers) { f.x = crystal.x - 30; f.y = crystal.y; f.stance = 'hold'; f.job = { type: 'move', target: { x: f.x, y: f.y } }; }
            respawnQueue.length = 0; floatingTexts.length = 0; followerProjectiles.length = 0; mutatorReset(); playerAttackMode = false; gunHold = null; playerLockTarget = null; player.attackCooldown = 0; health = PLAYER_HITS; player.invuln = 0; player.fpPath = null; };
        // the tutorial is over and the class is chosen (through the picker's own classChoose): the stage begins
        globalThis.__stage = cls => { __clear(); invReset(); playerClassKey = null; classPerks = new Set(); weaponReset(); technoReset(); serumReset(); dnaApply({}); for (const id of Object.keys(_fp.relays)) _fp.relays[id].online = false; _fp.channel = null;
            const S = _fp.tut.script; S.step = TUT_STEPS.length; S.doneAt = 1; S.said = { complete: true }; S.cstep = 0; S.tally = {}; S.ck0 = undefined; S.cr0 = undefined; S.cstrayFor = undefined; classPickerOpen = false;
            player.x = player.targetX = player.visualX = crystal.x - 2; player.y = player.targetY = player.visualY = crystal.y + 5; classChoose(cls, true); __frames(2); return S; };
        globalThis.__at = s => { player.x = player.targetX = player.visualX = s.bb[2] + 0.9; player.y = player.targetY = player.visualY = (s.bb[1] + s.bb[3]) / 2; player.fpPath = null; };
        globalThis.__st = kind => _fp.stations.find(s => s.kind === kind);
        globalThis.__plate = () => { facilityDrawObjective(); const c = objectiveCurrent(); return c ? c.title : ''; };   // (the objective's title: what the quest box shows at the top, js/questbox.js; the plate it was is hidden)
        globalThis.__saidLine = (re) => dialogueLines().some(l => re.test(l.text));   // (the Crystal's lines in the dialogue box, js/dialogue.js)`);

    group('THE STAGES: after the tutorial, once a class is chosen, the class\'s own objectives (its gear first, then its loop)');
    check('every class has a stage; its first step is its gear (TUT_CLASS_STEP, as before); every step says what to do and how; the Gunslinger\'s has 4 steps, the Technomancer\'s 1, its gear (its relay step went in build 2026-11-07qq: the junction turns every relay on; its punch and its arc with the gauntlet, build 2026-11-17as), the Mutator\'s 4 (its lash went in 2026-11-17as); no step asks for a training creature', () => {
        const r = J(`(function(){ const o = {}; for (const c of CLASS_ORDER) { const st = TUT_CLASS_STAGES[c]; playerClassKey = c; o[c] = { n: st.length, first: st[0] === TUT_CLASS_STEP, ids: st.map(s => s.id).join(), stray: st.filter(s => s.stray).map(s => s.id).join(), words: st.every(s => s.title && s.text().length > 20 && s.hint().length > 20 && typeof s.done === 'function') }; } playerClassKey = null; return o; })()`);
        same(Object.keys(r).join(), 'gunslinger,technomancer,mutator', 'the stages'); for (const c of Object.keys(r)) { same(r[c].first, true, c + ': the gear first'); same(r[c].words, true, c + ': a step without its words'); same(r[c].stray, '', c + ': a step that asks for a training creature'); }
        same(r.gunslinger.ids, 'perk,cctv,flare,hunt', 'the Gunslinger\'s'); same(r.technomancer.ids, 'perk', 'the Technomancer\'s'); same(r.mutator.ids, 'perk,clone,upgrade,serum', 'the Mutator\'s');
    });
    check('every step after the gear fits a page: its words and its hint wrap to three lines or fewer at 34 characters a line (the dialogue box on an iPad held upright, js/dialogue.js; the quest box is wider)', () => {
        const r = J(`(function(){ const out = []; for (const c of CLASS_ORDER) { playerClassKey = c; for (const st of TUT_CLASS_STAGES[c].slice(1)) { const t = uiWrap(st.text(), 34).length, h = uiWrap(st.hint(), 34).length; if (t > 3 || h > 3) out.push(c + ':' + st.id + ' ' + t + '/' + h); } } playerClassKey = null; return out; })()`);
        same(r.join(', '), '', 'too long for the plate (lines of words / hint)');
    });
    check('nothing is counted before the stage: not during the tutorial, not before a class is chosen; the stage begins when the class is chosen (its kills and relays count from there)', () => {
        const r = J(`(function(){ const S = _fp.tut.script, keep = [S.step, S.doneAt]; const o = {}; __clear(); invReset(); playerClassKey = null; S.tally = {}; S.step = 2; tutTally('flare'); o.during = tutCount('flare');
            S.step = TUT_STEPS.length; tutTally('flare'); o.noClass = tutCount('flare'); S.ck0 = undefined; S.doneAt = 1; __frames(2); o.noStage = S.ck0 === undefined;
            const S2 = __stage('gunslinger'); o.begun = [S2.ck0 === lifetimeKills, S2.cr0, S2.cstep]; tutTally('flare'); o.counted = tutCount('flare'); return o; })()`);
        same(r.during, 0, 'counted during the tutorial'); same(r.noClass, 0, 'counted with no class'); same(r.noStage, true, 'the stage began with no class'); same(r.begun.join(), 'true,0,0', 'the stage\'s start'); same(r.counted, 1, 'counted in the stage');
    });
    check('the objective counts the steps in the class\'s name: "GUNSLINGER · 1/4 · GET YOUR GEAR", then the next; the Crystal says a step done; the closing line once they are done', () => {
        const r = J(`(function(){ __stage('gunslinger'); const o = { first: __plate() }; classGrant('machinegun'); __frames(2); o.second = __plate(); o.step = _fp.tut.script.cstep; o.said = __saidLine(/GET YOUR GEAR — DONE/); return o; })()`);
        same(r.first, 'GUNSLINGER  ·  1/4  ·  GET YOUR GEAR', 'the first'); same(r.second, 'GUNSLINGER  ·  2/4  ·  SWEEP THE CAMERAS', 'the second'); same(r.step, 1, 'the step'); same(r.said, true, 'the step done is not said');
    });

    group('THE FULL LOOPS: each class\'s stage played through with the game\'s own functions');
    check('THE GUNSLINGER: the machine gun from the Armory\'s locker; a CCTV sweep at the Security Room\'s console; a flare from the pack; three creatures defeated; then the closing line', () => {
        const r = J(`(function(){ const S = __stage('gunslinger'), o = { steps: [] }; const step = () => o.steps.push(S.cstep);
            __at(__st('weapon_locker')); const L = stationUse(__st('weapon_locker')); __frames(2); o.gun = [L.ok, playerWeapon]; step();
            __at(__st('cctv')); const C = stationUse(__st('cctv')); __frames(2); o.cctv = [C.ok, _fp.cctvUntil > frame]; step();
            const F = invUse('flare'); __frames(2); o.flare = [!!(F && F.ok !== false), _fp.tut.sources.some(s => s.what === 'flare')]; step();
            for (let i = 0; i < 3; i++) { const e = spawnCreature({ species: 'ant', className: 'scout', level: 3, x: player.x + 2 + i, y: player.y, state: 'wander' }); applyDamage(e, 1e6, { x: player.x, y: player.y, team: 'green' }); __frames(2); step(); }
            o.plate = __plate(); o.key = S.objKey; o.closing = __saidLine(/GUNSLINGER STAGE COMPLETE/); return o; })()`);
        same(r.gun.join(), 'true,machinegun', 'the locker'); same(r.cctv.join(), 'true,true', 'the console'); same(r.flare.join(), 'true,true', 'the flare');
        same(r.steps.join(), '1,2,3,3,3,4', 'the steps after each'); ok(/RANK/.test(r.plate), 'the closing plate: ' + r.plate); same(r.closing, true, 'no closing line');
    });
    check('THE TECHNOMANCER: its stage is its gear (1/1 GET YOUR GEAR): the spider mech built at the mech bay, then the closing line; nothing is in its hand before or after, and no training creature comes', () => {
        const r = J(`(function(){ const S = __stage('technomancer'), o = { steps: [], strays: [] }; const step = () => { o.steps.push(S.cstep); o.strays.push(!!tutClassStray()); };
            o.first = __plate(); o.hand0 = playerWeapon; __frames(3); step();
            invAdd('mech_leg', 4); invAdd('mech_core', 1); const B = __st('mech_bay'); __at(B); const b = stationUse(B); __frames(STATION_KINDS.mech_bay.build + 5); o.mech = [b.ok, classHas('mech')]; step();
            __frames(3); step(); o.hand = [playerWeapon, weaponInHand(), weaponRows().length]; o.plate = __plate(); o.closing = __saidLine(/TECHNOMANCER STAGE COMPLETE/); o.said = __saidLine(/GET YOUR GEAR — DONE/); return o; })()`);
        same(r.first, 'TECHNOMANCER  ·  1/1  ·  GET YOUR GEAR', 'the stage\'s one step'); same(r.hand0, null, 'a weapon in a new Technomancer\'s hand'); same(r.mech.join(), 'true,true', 'the mech');
        same(r.steps.join(), '0,1,1', 'the steps: before the mech, after it, and after'); same(r.strays.join(), 'false,false,false', 'a training creature came'); same(r.hand.join(), ',false,0', 'a weapon in the Technomancer\'s hand, or one it could take');
        ok(/RANK/.test(r.plate), 'the closing plate: ' + r.plate); same(r.said, true, 'the step done is not said'); same(r.closing, true, 'no closing line');
    });
    check('THE MUTATOR: the lab coat from the walk through the lab; a clone grown at the Clone Bay; an upgrade bought for it; a serum collected at the hood and splashed; then the closing line; no training creature comes at any step', () => {
        const r = J(`(function(){ const S = __stage('mutator'), o = { steps: [], strays: [] }; const step = () => { o.steps.push(S.cstep); o.strays.push(!!tutClassStray()); };
            for (const room of GEAR.trail) { const c = facilitySpotIn(room, player.x, player.y, 0, 999); player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1]; __frames(3); } o.coat = classHas('labcoat'); step();
            dnaApply({ ant_scout: 12 }); shardCount = 999; executeClone(getCloneOptions().find(x => x.key === 'ant_scout')); __frames(2); const cl = mutatorClone(); o.clone = !!cl; step();
            const u = cloneUpgradeBuy('armor'); __frames(2); o.up = [u.ok, cloneUpRank(cl, 'armor')]; step(); o.next = __plate();
            serumLab.stock = 1; const H = __st('serum_hood'); __at(H); const h = stationUse(H); const sp = invUse('healing_serum'); __frames(2); o.serum = [h.ok, !!(sp && sp.ok !== false), serumZones.length]; step();
            o.plate = __plate(); o.closing = __saidLine(/MUTATOR STAGE COMPLETE/); o.hand = playerWeapon; cl.dead = true; cl.dismissed = true; __frames(1); return o; })()`);
        same(r.coat, true, 'the coat'); same(r.clone, true, 'the clone'); same(r.up.join(), 'true,1', 'the upgrade'); same(r.next, 'MUTATOR  ·  4/4  ·  SPLASH A SERUM', 'after the upgrade, the serum (no lash between them)'); same(r.serum.join(), 'true,true,1', 'the serum');
        same(r.steps.join(), '1,2,3,4', 'the steps after each'); ok(/RANK/.test(r.plate), 'the closing plate: ' + r.plate); same(r.closing, true, 'no closing line'); same(r.strays.join(), 'false,false,false,false', 'a training creature came'); same(r.hand, null, 'a weapon in the Mutator\'s hand');
    });

    group('THE TRAINING CREATURE, THE COUNTS, THE SAVE');
    check('the training creature (TUT_STRAY: kept as a rule, though no step asks for one since build 2026-11-17as, so a step that does is put on a stage for this check and taken off after) comes only for a step that wants it, near the player, with its own health; one that dies is replaced (TUT_STRAY.respawns a step) and a killed one pays as any kill; it is gone when the step is, and its going pays nothing', () => {
        const r = J(`(function(){ const st = TUT_CLASS_STAGES.technomancer, n0 = st.length;
            st.push({ id: 'drill', title: 'RUN THE DRILL', stray: true, text: () => 'A STEP THAT WANTS A TRAINING CREATURE.', hint: () => 'IT IS ON THE STAGE ONLY FOR THIS CHECK.', done: () => tutCount('drill') >= 1 });
            try { const S = __stage('technomancer'); __frames(2); const o = { none: null };
                o.none = !!tutClassStray(); classGrant('mech'); __frames(3); const a = tutClassStray(); o.at = S.cstep; o.one = !!a;   // (its gear first, which wants no creature; then the step that does)
                o.near = !!a && Math.hypot(a.x - player.x, a.y - player.y) <= TUT_STRAY.near[1] + 1.5; o.hp = a ? a.maxHealth : 0; o.said = __saidLine(/A BIG STRAY ANT WANDERS IN/);
                const k0 = lifetimeKills, c0 = S.cstrays; applyDamage(a, 1e6, { x: player.x, y: player.y, team: 'green' }); __frames(3); o.paid = lifetimeKills - k0; const b = tutClassStray(); o.again = !!b && b !== a; o.count = S.cstrays - c0;
                S.cstrays = TUT_STRAY.respawns; applyDamage(b, 1e6, { x: player.x, y: player.y, team: 'green' }); __frames(3); o.capped = !!tutClassStray();
                S.cstrays = 0; __frames(3); const c = tutClassStray(), k1 = lifetimeKills, sh1 = shardCount; tutTally('drill'); __frames(2); o.gone = [!!c, !tutClassStray(), !!c && c.dead, S.cstep, lifetimeKills - k1, shardCount - sh1]; return o; }
            finally { st.length = n0; __clear(); } })()`);
        same(r.none, false, 'a creature for a step that does not want one'); same(r.at, 1, 'the step'); same(r.one, true, 'no creature for the step that wants one'); same(r.near, true, 'not near the player'); same(r.hp, 400, 'its health'); same(r.said, true, 'the Crystal does not say it has come');
        same(r.paid, 1, 'a killed one is a kill'); same(r.again, true, 'not replaced'); same(r.count, 1, 'the replacement was not counted'); same(r.capped, false, 'replaced past the cap');
        same(r.gone.join(), 'true,true,true,2,0,0', 'the step done: one was there, it went, the stage moved on, and its going paid no kill and no shards');
        same(run('TUT_CLASS_STAGES.technomancer.map(s => s.id).join()'), 'perk', 'the step put on for the check was left on the stage');
    });
    check('what is counted: a flare lit, a clone grown, an upgrade bought, a serum splashed, each by the code that does it; no strike and no arc is (the lash and the gauntlet went in build 2026-11-17as), and a round from the machine gun counts nothing', () => {
        const r = J(`(function(){ const S = __stage('gunslinger'), o = {}; classGrant('machinegun'); weaponEquip('machinegun'); playerAmmo = PLAYER_AMMO_MAX; __frames(2);
            const e = spawnCreature({ species: 'ant', className: 'scout', level: 3, x: player.x + 2, y: player.y, state: 'wander' }); e.update = () => {}; e.health = e.maxHealth = 1e6; playerAttackMode = true;
            const t0 = JSON.stringify(S.tally), a0 = playerAmmo; o.shot = firePlayerShot(e); __frames(20); o.round = [a0 - playerAmmo, e.health < e.maxHealth, JSON.stringify(S.tally) === t0]; e.dead = true; __frames(1);
            invUse('flare'); o.flare = tutCount('flare');
            __stage('mutator'); dnaApply({ ant_scout: 12 }); shardCount = 999; executeClone(getCloneOptions().find(x => x.key === 'ant_scout')); o.clone = tutCount('clone'); const cl = mutatorClone();
            cloneUpgradeBuy('armor'); o.up = tutCount('upgrade'); invAdd('healing_serum', 1); invUse('healing_serum'); o.serum = tutCount('serum'); o.keys = Object.keys(S.tally).sort().join(); cl.dead = true; cl.dismissed = true; __frames(1); return o; })()`);
        same(r.shot, true, 'the round was not fired'); same(r.round.join(), '1,true,true', 'the round: one spent, it hit, and nothing was counted for it');
        same([r.flare, r.clone, r.up, r.serum].join(), '1,1,1,1', 'a flare, a clone, an upgrade, a serum'); same(r.keys, 'clone,serum,upgrade', 'what the Mutator\'s stage counted');
        for (const [f, k] of [['js/mutator.js', 'tutTally("clone")'], ['js/mutator.js', 'tutTally("upgrade")'], ['js/serum.js', 'tutTally("serum")'], ['js/facilitytutorial.js', 'tutTally("flare")']]) ok(rd(f).includes(k), f + ' does not count ' + k);
        for (const f of ['js/mutator.js', 'js/technomancer.js', 'js/weapons.js', 'js/input.js', 'js/gunfire.js']) ok(!/tutTally\((w \?|"(arc|lash|gauntlet|punch|strike)")/.test(rd(f)), f + ' still counts a strike or an arc');
    });
    check('the save keeps the stage: the step it is on, what it has counted and where its counts began; a reload puts the player back there', () => {
        const r = J(`(function(){ const S = __stage('mutator'); classGrant('labcoat'); __frames(2); S.cr0 = -1; __frames(2); tutTally('potion', 2); const d = JSON.parse(JSON.stringify(facilitySaveCollect()));
            const o = { saved: [d.script.cstep, d.script.tally.potion, Number.isFinite(d.script.ck0), d.script.cr0, d.script.cv] }; S.cstep = 0; S.tally = {}; S.ck0 = undefined; S.cr0 = undefined;
            facilitySaveApply(d); o.back = [_fp.tut.script.cstep, tutCount('potion'), _fp.tut.script.cr0, playerClassKey]; __frames(2); o.plate = __plate(); return o; })()`);
        same(r.saved.join(), '1,2,true,-1,2', 'saved (cv 2: the steps as they are now)'); same(r.back.join(), '1,2,-1,mutator', 'restored'); same(r.plate, 'MUTATOR  ·  2/4  ·  GROW YOUR CLONE', 'the plate after the reload');
    });
    check('a game saved before the steps went (no cv) is read through the old lists (facilitySaveCStep): a Technomancer past its gear has finished its stage (old 0,1,2,3 are 0,1,1,1); a Mutator at its lash or its serum is at the serum, one past it has finished (old 2,3,4,5 are 2,3,3,4); the Gunslinger\'s is as it was; the stages put away are read the same way; a save of now (cv 2) is read as it is', () => {
        const r = J(`(function(){ const o = {}, map = (c, ns, old) => ns.map(n => facilitySaveCStep(c, n, old)).join();
            o.t = map('technomancer', [0, 1, 2, 3], true); o.m = map('mutator', [0, 1, 2, 3, 4, 5], true); o.g = map('gunslinger', [0, 1, 2, 3, 4], true);
            o.now = [map('technomancer', [0, 1], false), map('mutator', [0, 1, 2, 3, 4], false), map('gunslinger', [0, 1, 2, 3, 4], false)].join(' ');
            o.odd = [facilitySaveCStep('mutator', -3, true), facilitySaveCStep('mutator', undefined, true), facilitySaveCStep('mutator', 99, true), facilitySaveCStep('technomancer', 99, true)].join();
            // through a save: a Mutator at its serum by the old count (step 4 of 5), a Technomancer put away at its arc (2 of 3) and a Gunslinger put away at its flare (2)
            const S = __stage('mutator'); classGrant('labcoat'); __frames(2); const d = JSON.parse(JSON.stringify(facilitySaveCollect())); d.script.cstages = { technomancer: { cstep: 2, tally: {}, kills: 0, relays: 0 }, gunslinger: { cstep: 2, tally: {}, kills: 0, relays: 0 } };
            const old = JSON.parse(JSON.stringify(d)); delete old.script.cv; old.script.cstep = 4; facilitySaveApply(old); const A = _fp.tut.script; o.old = [A.cstep, A.cstages.technomancer.cstep, A.cstages.gunslinger.cstep]; o.oldPlate = __plate(); o.oldT = tutClassProgress('technomancer').join('/');
            const lash = JSON.parse(JSON.stringify(old)); lash.script.cstep = 3; facilitySaveApply(lash); o.lash = _fp.tut.script.cstep;
            const now = JSON.parse(JSON.stringify(d)); now.script.cstep = 3; now.script.cstages.technomancer.cstep = 1; facilitySaveApply(now); const B = _fp.tut.script; o.cv = [now.script.cv, B.cstep, B.cstages.technomancer.cstep, B.cstages.gunslinger.cstep]; o.nowPlate = __plate(); return o; })()`);
        same(r.t, '0,1,1,1', 'the Technomancer\'s old steps'); same(r.m, '0,1,2,3,3,4', 'the Mutator\'s old steps'); same(r.g, '0,1,2,3,4', 'the Gunslinger\'s (its stage did not change)');
        same(r.now, '0,1 0,1,2,3,4 0,1,2,3,4', 'a save of now was read through the old lists'); same(r.odd, '0,0,4,1', 'a step that is no number, or past the end');
        same(r.old.join(), '3,1,2', 'the old save: the Mutator at its serum, the Technomancer finished, the Gunslinger where it was'); same(r.oldPlate, 'MUTATOR  ·  4/4  ·  SPLASH A SERUM', 'the plate from the old save'); same(r.oldT, '1/1', 'the Technomancer\'s objectives from the old save');
        same(r.lash, 3, 'an old save at the lash'); same(r.cv.join(), '2,3,1,2', 'a save of now'); same(r.nowPlate, 'MUTATOR  ·  4/4  ·  SPLASH A SERUM', 'the plate from the save of now');
    });
    check('the director runs the stage (js/tutorial.js), and the class code reports to it; the game index says the stage follows the tutorial', () => {
        const t = rd('js/tutorial.js'); ok(/if \(S\.doneAt && playerClassKey\) tutClassTick\(\);/.test(t), 'the director does not run the stage');
        ok(/class's own stage|CLASS'S OWN STAGE|its own stage/i.test(rd('game.html')), 'the index does not mention the class stage');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
