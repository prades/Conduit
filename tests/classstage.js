// EACH CLASS'S OWN STAGE AFTER THE TUTORIAL, AND ITS LOOP PLAYED THROUGH (docs/TUTORIAL.md, "The class stages"; js/tutorial.js TUT_CLASS_STAGES, and the class code that reports what the player did).
// ASKED (the brief, step 9): "Integrate each class into its tutorial progression and test the full loops." "Each class should have its own tutorial stage after the initial tutorial."
//   THE STAGES      the class's gear first (its station's perk, as before), then its loop: the Gunslinger's cameras, a flare and a hunt; the Technomancer's relay, punches and arcs; the Mutator's clone, an upgrade, the lash and a serum
//   THE FULL LOOPS  each stage played through with the game's own functions (the stations, the relay repair, the weapons, the Clone Bay, the serum hood), from the class picker to the closing line
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
        // a floor tile r0..r1 from a, in sight of it
        globalThis.__spotFrom = (a, r0, r1) => { for (const [k, c] of _fp.cellsP) { const d = Math.hypot(c[0] - a.x, c[1] - a.y); if (d >= r0 && d <= r1 && facilityLosFrom(c[0], c[1], a.x, a.y)) return c; } return null; };
        // stand beside the training creature (held still) and hold the dial on it
        globalThis.__strike = (n, gap) => { const s = tutClassStray(); s.update = () => {}; player.x = player.targetX = player.visualX = s.x - 1.0; player.y = player.targetY = player.visualY = s.y; player.fpPath = null; playerAttackMode = true; playerLockTarget = s;
            gunHold = { x: 0, y: 0, pending: true, released: false, until: 0, button: true }; __frames(n * gap + 6); gunHold = null; __frames(gap); return s; };
        globalThis.__plate = () => { const said = []; const k = uiTextFit; uiTextFit = function (t) { said.push(String(t)); return k.apply(this, arguments); }; try { facilityDrawObjective(); } finally { uiTextFit = k; } return said[0] || ''; };`);

    group('THE STAGES: after the tutorial, once a class is chosen, the class\'s own objectives (its gear first, then its loop)');
    check('every class has a stage; its first step is its gear (TUT_CLASS_STEP, as before); every step says what to do and how; the Gunslinger\'s has 4 steps, the Technomancer\'s 4, the Mutator\'s 5', () => {
        const r = J(`(function(){ const o = {}; for (const c of CLASS_ORDER) { const st = TUT_CLASS_STAGES[c]; playerClassKey = c; o[c] = { n: st.length, first: st[0] === TUT_CLASS_STEP, ids: st.map(s => s.id).join(), words: st.every(s => s.title && s.text().length > 20 && s.hint().length > 20 && typeof s.done === 'function') }; } playerClassKey = null; return o; })()`);
        same(Object.keys(r).join(), 'gunslinger,technomancer,mutator', 'the stages'); for (const c of Object.keys(r)) { same(r[c].first, true, c + ': the gear first'); same(r[c].words, true, c + ': a step without its words'); }
        same(r.gunslinger.ids, 'perk,cctv,flare,hunt', 'the Gunslinger\'s'); same(r.technomancer.ids, 'perk,relay,punch,arc', 'the Technomancer\'s'); same(r.mutator.ids, 'perk,clone,upgrade,lash,serum', 'the Mutator\'s');
    });
    check('every step after the gear fits the plate: its words and its hint wrap to three lines or fewer at the narrowest plate (the corner\'s, 304 px: 34 characters a line)', () => {
        const r = J(`(function(){ const out = []; for (const c of CLASS_ORDER) { playerClassKey = c; for (const st of TUT_CLASS_STAGES[c].slice(1)) { const t = uiWrap(st.text(), 34).length, h = uiWrap(st.hint(), 34).length; if (t > 3 || h > 3) out.push(c + ':' + st.id + ' ' + t + '/' + h); } } playerClassKey = null; return out; })()`);
        same(r.join(', '), '', 'too long for the plate (lines of words / hint)');
    });
    check('nothing is counted before the stage: not during the tutorial, not before a class is chosen; the stage begins when the class is chosen (its kills and relays count from there)', () => {
        const r = J(`(function(){ const S = _fp.tut.script, keep = [S.step, S.doneAt]; const o = {}; __clear(); invReset(); playerClassKey = null; S.tally = {}; S.step = 2; tutTally('arc'); o.during = tutCount('arc');
            S.step = TUT_STEPS.length; tutTally('arc'); o.noClass = tutCount('arc'); S.ck0 = undefined; S.doneAt = 1; __frames(2); o.noStage = S.ck0 === undefined;
            const S2 = __stage('gunslinger'); o.begun = [S2.ck0 === lifetimeKills, S2.cr0, S2.cstep]; tutTally('arc'); o.counted = tutCount('arc'); return o; })()`);
        same(r.during, 0, 'counted during the tutorial'); same(r.noClass, 0, 'counted with no class'); same(r.noStage, true, 'the stage began with no class'); same(r.begun.join(), 'true,0,0', 'the stage\'s start'); same(r.counted, 1, 'counted in the stage');
    });
    check('the plate counts the steps in the class\'s colour: "GUNSLINGER · 1/4 · GET YOUR GEAR", then the next; the closing line once they are done', () => {
        const r = J(`(function(){ __stage('gunslinger'); const o = { first: __plate() }; classGrant('machinegun'); __frames(2); o.second = __plate(); o.step = _fp.tut.script.cstep; o.said = floatingTexts.some(t => /GET YOUR GEAR — DONE/.test(t.text)); return o; })()`);
        same(r.first, 'GUNSLINGER  ·  1/4  ·  GET YOUR GEAR', 'the first'); same(r.second, 'GUNSLINGER  ·  2/4  ·  SWEEP THE CAMERAS', 'the second'); same(r.step, 1, 'the step'); same(r.said, true, 'the step done is not said');
    });

    group('THE FULL LOOPS: each class\'s stage played through with the game\'s own functions');
    check('THE GUNSLINGER: the machine gun from the Armory\'s locker; a CCTV sweep at the Security Room\'s console; a flare from the pack; three creatures defeated; then the closing line', () => {
        const r = J(`(function(){ const S = __stage('gunslinger'), o = { steps: [] }; const step = () => o.steps.push(S.cstep);
            __at(__st('weapon_locker')); const L = stationUse(__st('weapon_locker')); __frames(2); o.gun = [L.ok, playerWeapon]; step();
            __at(__st('cctv')); const C = stationUse(__st('cctv')); __frames(2); o.cctv = [C.ok, _fp.cctvUntil > frame]; step();
            const F = invUse('flare'); __frames(2); o.flare = [!!(F && F.ok !== false), _fp.tut.sources.some(s => s.what === 'flare')]; step();
            for (let i = 0; i < 3; i++) { const e = spawnCreature({ species: 'ant', className: 'scout', level: 3, x: player.x + 2 + i, y: player.y, state: 'wander' }); applyDamage(e, 1e6, { x: player.x, y: player.y, team: 'green' }); __frames(2); step(); }
            o.plate = __plate(); o.key = S.objKey; o.closing = floatingTexts.some(t => /GUNSLINGER STAGE COMPLETE/.test(t.text)); return o; })()`);
        same(r.gun.join(), 'true,machinegun', 'the locker'); same(r.cctv.join(), 'true,true', 'the console'); same(r.flare.join(), 'true,true', 'the flare');
        same(r.steps.join(), '1,2,3,3,3,4', 'the steps after each'); ok(/RANK/.test(r.plate), 'the closing plate: ' + r.plate); same(r.closing, true, 'no closing line');
    });
    check('THE TECHNOMANCER: the spider mech built at the mech bay; a broken relay repaired with one cell (it starts by itself); three punches at the training creature (charges stored); two arcs from out of reach; then the closing line, and the creature goes', () => {
        const r = J(`(function(){ const S = __stage('technomancer'), o = { steps: [] }; const step = () => o.steps.push(S.cstep);
            invAdd('mech_leg', 4); invAdd('mech_core', 1); const B = __st('mech_bay'); __at(B); const b = stationUse(B); __frames(STATION_KINDS.mech_bay.build + 5); o.mech = [b.ok, classHas('mech')]; step();
            const R = _fp.stations.find(s => s.kind === 'relay' && !relayOnline(s.relay)); invAdd('power_cell', 1); __at(R); __frames(CLASS_RULES.relay.skillFrames + 10); o.relay = [relayOnline(R.relay), tutClassRelays()]; step();
            __frames(2); const s = tutClassStray(); o.stray = !!s && Math.hypot(s.x - player.x, s.y - player.y) <= TUT_STRAY.near[1] + 1.5; o.strayHp = s ? s.maxHealth : 0;
            __strike(3, WEAPONS.gauntlet.windup + weaponCooldown('gauntlet')); o.punch = [tutCount('gauntlet'), technoCharge]; step();
            const a = tutClassStray(); const c = __spotFrom(a, 3.2, 5.5); player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1]; player.fpPath = null;
            const k0 = lifetimeKills, sh0 = shardCount; o.arcs = [firePlayerShot(a)]; __frames(TECHNO.arc.cooldown + 1); o.arcs.push(firePlayerShot(a)); __frames(2); step();
            o.count = tutCount('arc'); o.gone = !tutClassStray() && a.dead; o.paid = [lifetimeKills - k0, shardCount - sh0]; o.plate = __plate(); o.closing = floatingTexts.some(t => /TECHNOMANCER STAGE COMPLETE/.test(t.text)); return o; })()`);
        same(r.mech.join(), 'true,true', 'the mech'); same(r.relay.join(), 'true,1', 'the relay'); same(r.stray, true, 'no training creature near the player'); same(r.strayHp, 400, 'its health');
        ok(r.punch[0] >= 3 && r.punch[1] >= 2, 'punches and charges: ' + r.punch); same(r.arcs.join(), 'true,true', 'the arcs'); same(r.count, 2, 'arcs counted');
        same(r.steps.join(), '1,2,3,4', 'the steps after each'); same(r.gone, true, 'the training creature stayed'); same(r.paid.join(), '0,0', 'its going paid a kill'); ok(/RANK/.test(r.plate), 'the closing plate: ' + r.plate); same(r.closing, true, 'no closing line');
    });
    check('THE MUTATOR: the lab coat from the walk through the lab; a clone grown at the Clone Bay; an upgrade bought for it; three lashes at the training creature beside it; a serum collected at the hood and splashed; then the closing line', () => {
        const r = J(`(function(){ const S = __stage('mutator'), o = { steps: [] }; const step = () => o.steps.push(S.cstep);
            for (const room of GEAR.trail) { const c = facilitySpotIn(room, player.x, player.y, 0, 999); player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1]; __frames(3); } o.coat = classHas('labcoat'); step();
            dnaApply({ ant_scout: 12 }); shardCount = 999; executeClone(getCloneOptions().find(x => x.key === 'ant_scout')); __frames(2); const cl = mutatorClone(); o.clone = !!cl; step();
            const u = cloneUpgradeBuy('armor'); __frames(2); o.up = [u.ok, cloneUpRank(cl, 'armor')]; step();
            __frames(2); cl.x = tutClassStray().x - 1.2; cl.y = tutClassStray().y + 0.6; __strike(3, MUTATOR.lash.windup + weaponCooldown('lash')); o.lash = tutCount('lash'); step();
            serumLab.stock = 1; const H = __st('serum_hood'); __at(H); const h = stationUse(H); const sp = invUse('healing_serum'); __frames(2); o.serum = [h.ok, !!(sp && sp.ok !== false), serumZones.length]; step();
            o.plate = __plate(); o.closing = floatingTexts.some(t => /MUTATOR STAGE COMPLETE/.test(t.text)); o.stray = !!tutClassStray(); cl.dead = true; cl.dismissed = true; __frames(1); return o; })()`);
        same(r.coat, true, 'the coat'); same(r.clone, true, 'the clone'); same(r.up.join(), 'true,1', 'the upgrade'); ok(r.lash >= 3, 'lashes: ' + r.lash); same(r.serum.join(), 'true,true,1', 'the serum');
        same(r.steps.join(), '1,2,3,4,5', 'the steps after each'); ok(/RANK/.test(r.plate), 'the closing plate: ' + r.plate); same(r.closing, true, 'no closing line'); same(r.stray, false, 'the training creature stayed');
    });

    group('THE TRAINING CREATURE, THE COUNTS, THE SAVE');
    check('the training creature comes only for a step that wants it, near the player; one that dies is replaced (TUT_STRAY.respawns a step) and a killed one pays as any kill; it is gone when the step is', () => {
        const r = J(`(function(){ const S = __stage('technomancer'); classGrant('mech'); const R = _fp.stations.find(s => s.kind === 'relay'); _fp.relays[R.relay].online = true; __frames(2); const o = { none: null };
            S.cstep = 1; S.cr0 = 99; __frames(2); o.none = !!tutClassStray(); S.cr0 = 0; __frames(3); const a = tutClassStray(); o.at = S.cstep; o.one = !!a;
            const k0 = lifetimeKills, n0 = S.cstrays; applyDamage(a, 1e6, { x: player.x, y: player.y, team: 'green' }); __frames(3); o.paid = lifetimeKills - k0; const b = tutClassStray(); o.again = !!b && b !== a; o.count = S.cstrays - n0;
            S.cstrays = TUT_STRAY.respawns; applyDamage(b, 1e6, { x: player.x, y: player.y, team: 'green' }); __frames(3); o.capped = !!tutClassStray(); return o; })()`);
        same(r.none, false, 'a creature for a step that does not want one'); same(r.at, 2, 'the step'); same(r.one, true, 'no creature for the punch'); same(r.paid, 1, 'a killed one is a kill'); same(r.again, true, 'not replaced');
        same(r.count, 1, 'the replacement was not counted'); same(r.capped, false, 'replaced past the cap');
    });
    check('what is counted: a strike that lands (a miss is not), an arc thrown, a clone grown, an upgrade bought, a serum splashed, a flare lit', () => {
        const r = J(`(function(){ __stage('mutator'); const e = spawnCreature({ species: 'ant', className: 'scout', level: 3, x: player.x + 1, y: player.y, state: 'wander' }); e.update = () => {}; e.health = e.maxHealth = 1e6; playerAttackMode = true;
            firePlayerShot(e); __frames(MUTATOR.lash.windup + 2); const o = { hit: tutCount('lash') }; player.attackCooldown = 0; firePlayerShot(e); render(); e.x += 4; __frames(MUTATOR.lash.windup + 2); o.miss = tutCount('lash'); e.dead = true; __frames(1); return o; })()`);
        same(r.hit, 1, 'a strike that landed'); same(r.miss, 1, 'a miss was counted');
        for (const [f, k] of [['js/mutator.js', 'tutTally(w ? w.id : "lash")'], ['js/mutator.js', 'tutTally("clone")'], ['js/mutator.js', 'tutTally("upgrade")'], ['js/technomancer.js', 'tutTally("arc")'], ['js/serum.js', 'tutTally("serum")'], ['js/facilitytutorial.js', 'tutTally("flare")']]) ok(rd(f).includes(k), f + ' does not count ' + k);
    });
    check('the save keeps the stage: the step it is on, what it has counted and where its counts began; a reload puts the player back there', () => {
        const r = J(`(function(){ const S = __stage('technomancer'); classGrant('mech'); __frames(2); S.cr0 = -1; __frames(2); tutTally('gauntlet', 2); const d = JSON.parse(JSON.stringify(facilitySaveCollect()));
            const o = { saved: [d.script.cstep, d.script.tally.gauntlet, Number.isFinite(d.script.ck0), d.script.cr0] }; S.cstep = 0; S.tally = {}; S.ck0 = undefined; S.cr0 = undefined;
            facilitySaveApply(d); o.back = [_fp.tut.script.cstep, tutCount('gauntlet'), _fp.tut.script.cr0, playerClassKey]; __frames(2); o.plate = __plate(); return o; })()`);
        same(r.saved.join(), '2,2,true,-1', 'saved'); same(r.back.join(), '2,2,-1,technomancer', 'restored'); same(r.plate, 'TECHNOMANCER  ·  3/4  ·  CHARGE YOUR GAUNTLET', 'the plate after the reload');
    });
    check('the director runs the stage (js/tutorial.js), and the class code reports to it; the game index says the stage follows the tutorial', () => {
        const t = rd('js/tutorial.js'); ok(/if \(S\.doneAt && playerClassKey\) tutClassTick\(\);/.test(t), 'the director does not run the stage');
        ok(/class's own stage|CLASS'S OWN STAGE|its own stage/i.test(rd('game.html')), 'the index does not mention the class stage');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
