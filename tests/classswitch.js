// SWITCHING CLASS, AND THE CONFIRMATION (js/classes.js; docs/PLAYER-CLASSES.md, "Switching class").
// ASKED: "Make it to where whenever you're selecting a class, make it to where there's a confirmation." "Also make a way for the player to be able to switch classes whenever they want to. But their
// progression in it will be that the current progression of that class, and the progression saves throughout until the crystal is destroyed." Chosen with the user: the switch is in the pack; the Mutator's
// clone waits for it.
//   THE CONFIRMATION   a card's SELECT asks first (BECOME A ...? / SWITCH TO ...?), CONFIRM or BACK; the first choice cannot be closed, a switch can
//   SWITCHING          the pack's SWITCH CLASS; each class keeps its perks (and rank), its stage, the weapon it last held, its kit and cases given once; the Mutator's clone waits
//   SAVED              the save keeps every class's progress; a new game (the Crystal destroyed) starts them all afresh
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
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; crystal.health = crystal.maxHealth = 1e7;
        if (typeof facilitySpawnTick === 'function') facilitySpawnTick = () => {};   // (no arena spawner)
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };
        // a fresh run with the tutorial over (no class yet)
        globalThis.__fresh = () => { facilityTutorialStart(_fp.F); facilityTutorialClass(); actors = actors.filter(a => !(a instanceof Predator) && !a.isClone); respawnQueue.length = 0; floatingTexts.length = 0; mutatorReset(); dnaApply({});
            const S = _fp.tut.script; S.step = TUT_STEPS.length; S.doneAt = 1; S.said = { complete: true }; classPickerOpen = false; classConfirm = null;
            player.x = player.targetX = player.visualX = crystal.x - 2; player.y = player.targetY = player.visualY = crystal.y + 5; player.fpPath = null; return S; };
        globalThis.__tap = r => _handleClassPickerTap(r.x + r.w / 2, r.y + r.h / 2);
        globalThis.__card = id => _cpLayout().cards.find(c => c.id === id);`);

    group('THE CONFIRMATION');
    check('the first choice asks first: a tap on a card puts up BECOME A ...? and chooses nothing, BACK (or a tap off the box) puts it away, CONFIRM chooses; the first choice cannot be closed (no CLOSE, a tap outside does nothing); it draws in both states, and Escape is wired', () => {
        const r = J(`(function(){ canvas.width = 1280; canvas.height = 860; __fresh(); classPickerOpenNow(); const o = {};
            o.close = _cpLayout().close; __tap(__card('technomancer')); o.asked = [classConfirm, playerClassKey, classPickerOpen];
            let err = null; try { drawClassPicker(); } catch (e) { err = e.message; } o.drawAsk = err;
            __tap(_cpLayout().confirm.no); o.back = [classConfirm, playerClassKey, classPickerOpen];
            __tap(__card('technomancer')); _handleClassPickerTap(2, 2); o.offBox = [classConfirm, classPickerOpen];
            _handleClassPickerTap(2, 2); o.outside = [classPickerOpen, playerClassKey]; o.closeFn = classPickerClose(); o.stillOpen = classPickerOpen;
            __tap(__card('technomancer')); __tap(_cpLayout().confirm.yes); o.chosen = [playerClassKey, classPickerOpen, classConfirm, invCount('power_cell')];
            try { classPickerOpenNow(); drawClassPicker(); classPickerOpen = false; } catch (e) { err = e.message; } o.drawAfter = err; return o; })()`);
        same(r.close, null, 'the first choice has a CLOSE'); same(r.asked.join(), 'technomancer,,true', 'the card chose at once, or did not ask'); same(r.drawAsk, null, 'the confirmation threw');
        same(r.back.join(), ',,true', 'BACK'); same(r.offBox.join(), ',true', 'a tap off the box did not put it away'); same(r.outside.join(), 'true,', 'a tap outside the first choice closed it'); same(r.closeFn, false, 'the first choice could be closed'); same(r.stillOpen, true, 'still open');
        same(r.chosen.join(), 'technomancer,false,,1', 'CONFIRM: the class, the picker shut, the kit'); same(r.drawAfter, null, 'the picker threw');
        const c = rd('js/classes.js'); ok(/addEventListener\("keydown", e => \{ if \(!e \|\| e\.key !== "Escape" \|\| !classPickerOpen\) return; if \(classConfirm\) classConfirm = null; else classPickerClose\(\); \}\)/.test(c), 'Escape is not wired to the picker');
        ok(/!\(typeof classPickerOpen !== "undefined" && classPickerOpen\)\) invClose/.test(rd('js/inventory.js')), 'the pack takes Escape from the picker over it');
    });

    group('SWITCHING');
    check('the pack has SWITCH CLASS once there is a class (not before): in the title row when it is wide, on a phone in a row of its own under the title, clear of CLOSE and the tabs; it opens the picker to switch: the class you are is CURRENT with no SELECT, another asks first (SWITCH TO ...?), CLOSE or a tap outside calls it off', () => {
        const r = J(`(function(){ const o = {}, hit = (a, b) => !!a && !!b && a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
            __fresh(); canvas.width = 1280; canvas.height = 860; invOpen(); o.none = _ivLayout().swap; invClose();
            classChoose('gunslinger', true);
            for (const [W, H] of [[1280, 860], [390, 844]]) { canvas.width = W; canvas.height = H; invOpen(); const L = _ivLayout(); o['s' + W] = [!!L.swap, hit(L.swap, L.close), L.tabs.some(t => hit(t, L.swap)), L.swap ? L.swap.y < L.tabs[0].y : null, L.swap && L.swap.x + L.swap.w <= L.px + L.pw && L.swap.x >= L.px].join(); let e = null; try { drawInvPanel(); } catch (x) { e = x.message; } o['d' + W] = e; invClose(); }
            canvas.width = 1280; canvas.height = 860; invOpen(); const L = _ivLayout(); _handleInvPanelTap(L.swap.x + 5, L.swap.y + 5); o.open = [classPickerOpen, classPickerMode, invPanelOpen, !!_cpLayout().close];
            __tap(__card('gunslinger')); o.current = classConfirm; __tap(__card('mutator')); o.ask = classConfirm; let e = null; try { drawClassPicker(); } catch (x) { e = x.message; } o.draw = e;
            __tap(_cpLayout().confirm.no); __tap(_cpLayout().close); o.closed = [classPickerOpen, playerClassKey]; classSwitchOpen(); _handleClassPickerTap(2, 2); o.outside = [classPickerOpen, playerClassKey];
            classSwitchOpen(); __tap(__card('mutator')); __tap(_cpLayout().confirm.yes); o.switched = [playerClassKey, classPickerOpen, invPanelOpen]; invClose(); return o; })()`);
        same(r.none, null, 'SWITCH CLASS before there is a class'); same(r.s1280, 'true,false,false,true,true', 'wide: there, clear of CLOSE and the tabs, inside the pack'); same(r.s390, 'true,false,false,true,true', 'phone: there, clear of CLOSE and the tabs, inside the pack');
        same(r.d1280, null, 'the wide pack threw'); same(r.d390, null, 'the phone pack threw'); same(r.open.join(), 'true,switch,true,true', 'the button did not open the switch (over the pack, with a CLOSE)');
        same(r.current, null, 'the class you are asked to be switched to'); same(r.ask, 'mutator', 'another class did not ask'); same(r.draw, null, 'the switch picker threw');
        same(r.closed.join(), 'false,gunslinger', 'CLOSE'); same(r.outside.join(), 'false,gunslinger', 'a tap outside'); same(r.switched.join(), 'mutator,false,true', 'CONFIRM switched (the pack still open under it)');
    });
    check('each class keeps its own perks: they count only for the class you are (the machine gun is not a Technomancer\'s, the mech\'s speed is not a Gunslinger\'s) but stay earned (the mech bay stays built); each class has its own rank, and switching back finds them as they were', () => {
        const r = J(`(function(){ __fresh(); const o = {}; classChoose('gunslinger', true); classGrant('machinegun'); o.g = [classRank(), classHas('machinegun'), weaponHas('machinegun')];
            classChoose('technomancer', true); o.t = [classRank(), classHas('machinegun'), classOwns('machinegun'), weaponHas('machinegun'), classRankOf('gunslinger')]; classGrant('mech'); o.speed = [classStat('playerSpeed', 1), classHas('mech')];
            classChoose('gunslinger', true); o.back = [classRank(), classHas('machinegun'), weaponHas('machinegun'), classStat('playerSpeed', 1), classHas('mech'), classOwns('mech'), classRankOf('technomancer')];
            o.grantOther = classGrant('tuned'); o.list = classPerkList().map(p => p.id).join(); return o; })()`);
        same(r.g.join(), '2,true,true', 'the Gunslinger with its machine gun'); same(r.t.join(), '1,false,true,false,2', 'as a Technomancer: not its own, still earned, the Gunslinger still rank 2');
        same(r.speed.join(), '1.4,true', 'the mech for the Technomancer'); same(r.back.join(), '2,true,true,1,false,true,2', 'back to the Gunslinger: its own again, the mech not its');
        same(r.grantOther, false, 'a perk of another class was granted'); same(r.list, 'machinegun', 'the pack lists the class\'s own perks');
        ok(/classOwns\("mech"\)/.test(rd('js/facilitystyleall.js')), 'the mech bay does not stay built for another class');
    });
    check('the start kit comes once for each class, and each class\'s supply cases arrive the first time it is chosen, not again', () => {
        const r = J(`(function(){ __fresh(); const o = {}, cases = id => _fp.items.filter(i => i.fp === 'pickup' && i.cls === id).length;
            classChoose('gunslinger', true); o.g1 = [invCount('flare'), cases('gunslinger')]; classChoose('mutator', true); o.m1 = [invCount('mutagen_sample'), cases('mutator')];
            classChoose('gunslinger', true); classChoose('mutator', true); classChoose('gunslinger', true); o.again = [invCount('flare'), invCount('mutagen_sample'), cases('gunslinger'), cases('mutator')]; return o; })()`);
        ok(r.g1[0] === 1 && r.g1[1] > 0, 'the Gunslinger\'s kit and cases: ' + r.g1); ok(r.m1[0] === 1 && r.m1[1] > 0, 'the Mutator\'s kit and cases: ' + r.m1);
        same(r.again.join(), [1, 1, r.g1[1], r.m1[1]].join(), 'switching back and forth gave the kit or the cases again');
    });
    check('the weapon in hand is the class\'s: its own the first time (the lash, the gauntlet), the one it last held when you come back (the machine gun), the service gun when it has none; another class\'s own is never left in hand', () => {
        const r = J(`(function(){ __fresh(); const o = {}; classChoose('gunslinger', true); o.g1 = playerWeapon; classGrant('machinegun'); weaponEquip('machinegun');
            classChoose('mutator', true); o.m = playerWeapon; classChoose('technomancer', true); o.t = playerWeapon; classChoose('gunslinger', true); o.g2 = playerWeapon; classChoose('mutator', true); o.m2 = playerWeapon; return o; })()`);
        same([r.g1, r.m, r.t, r.g2, r.m2].join(), 'service,lash,gauntlet,machinegun,lash', 'the weapons in hand');
    });
    check('each class\'s stage is its own: the one you leave is put away as far as it got (its step, what it counted, and only the kills made while you were it), the one you come back to carries on; the picker shows each one\'s rank and objectives', () => {
        const r = J(`(function(){ const S = __fresh(), o = {}; classChoose('gunslinger', true); __frames(2); classGrant('machinegun'); tutTally('flare'); lifetimeKills += 2; __frames(2); o.g = [S.cstep, tutClassKills(), tutCount('flare')];
            classChoose('technomancer', true); __frames(2); o.t = [S.cstep, tutCount('flare')]; lifetimeKills += 5; __frames(2); o.tk = tutClassKills();
            classChoose('gunslinger', true); __frames(2); o.back = [tutClassKills(), tutCount('flare'), tutClassProgress('gunslinger').join('/'), tutClassProgress('technomancer').join('/'), tutClassProgress('mutator').join('/')];
            o.said = Object.keys(S.said).filter(k => /^c:/.test(k)).sort().join(); return o; })()`);
        ok(r.g[0] >= 1 && r.g[1] === 2 && r.g[2] === 1, 'the Gunslinger\'s stage: ' + r.g); same(r.t.join(), '0,0', 'the Technomancer\'s stage began afresh'); same(r.tk, 5, 'the Technomancer\'s kills');
        same(r.back[0], 2, 'the Gunslinger\'s kills counted the Technomancer\'s too'); same(r.back[1], 1, 'its tally'); same(r.back[2], '1/4', 'the Gunslinger\'s objectives (in order: its gear is done; the cameras are next, the flare already lit counts when they are)'); same(r.back[3], '0/4', 'the Technomancer\'s'); same(r.back[4], '0/5', 'the Mutator\'s (never been: five steps)');
        ok(/c:gunslinger:perk/.test(r.said), 'each class says its own steps: ' + r.said);
    });
    check('the Mutator\'s clone waits for it: switching away takes it out of the fight with no body and nothing recovered; switching back puts it beside you with its kind, level, upgrades and hurt (not healed)', () => {
        const r = J(`(function(){ __fresh(); const o = {}; classChoose('mutator', true); const c = makeClone('ant', 'scout', player.x + 1, player.y, 'wander', { level: 3, xp: 0 }); mutatorCloneMade(c, { needed: 4 }); c.upgrades = { armor: 1 }; cloneApplyUpgrades(c); c.health = Math.round(c.maxHealth * 0.5);
            const dna0 = dnaTotal(), bodies0 = cloneBodies.length; classChoose('technomancer', true); __frames(3);
            o.away = [!!mutatorClone(), actors.filter(a => a.isClone && !a.dead).length, cloneBodies.length - bodies0, dnaTotal() - dna0, !!classWaitingClone];
            classChoose('mutator', true); __frames(2); const k = mutatorClone(); o.back = k ? [k.speciesName, k.level, JSON.stringify(k.upgrades), Math.round(k.health / k.maxHealth * 100), Math.round(Math.hypot(k.x - player.x, k.y - player.y) * 10) / 10 < 2, !!classWaitingClone] : null; return o; })()`);
        same(r.away.join(), 'false,0,0,0,true', 'away: gone, no body, nothing recovered, waiting'); ok(r.back, 'the clone did not come back');
        same(r.back.join(), 'ant,3,{"armor":1},50,true,false', 'back: its kind, level, upgrades, hurt, beside you');
    });

    group('SAVED UNTIL THE CRYSTAL FALLS');
    check('the save keeps every class\'s progress (the classes you have been, each one\'s stage, the weapon each last held, the clone waiting) and a reload puts it back; a game saved before classes switched comes back with its one class; a new game (the Crystal destroyed) begins every class afresh', () => {
        const r = J(`(function(){ __fresh(); const o = {}; classChoose('gunslinger', true); classGrant('machinegun'); weaponEquip('machinegun'); tutTally('flare'); lifetimeKills += 1; __frames(2);
            classChoose('mutator', true); const c = makeClone('ant', 'scout', player.x + 1, player.y, 'wander', { level: 2, xp: 0 }); mutatorCloneMade(c, { needed: 2 }); classChoose('technomancer', true); __frames(2);
            const d = JSON.parse(JSON.stringify(facilitySaveCollect())); o.saved = [d.cls, d.classes.seen.join(), d.classes.weapon.gunslinger, !!d.classes.clone, Object.keys(d.script.cstages).sort().join()];
            __fresh(); o.wiped = [classSeen.size, classPerks.size, !!classWaitingClone, playerClassKey];
            facilitySaveApply(d); o.back = [playerClassKey, Array.from(classSeen).sort().join(), classWeapon.gunslinger, !!classWaitingClone, classRankOf('gunslinger')];
            classChoose('gunslinger', true); __frames(2); o.again = [playerWeapon, tutCount('flare'), invCount('flare')]; classChoose('mutator', true); o.clone = !!mutatorClone();
            const old = JSON.parse(JSON.stringify(d)); delete old.classes; old.script.cstages = undefined; old.cls = 'technomancer'; __fresh(); facilitySaveApply(old); o.old = [playerClassKey, Array.from(classSeen).join(), !!classWaitingClone];
            o.newGame = /facilitySaveClear\\(\\)/.test(String(facilityNewGame)) && /facilityNewGame/.test(String(showGameOver)); return o; })()`);
        same(r.saved.join(), 'technomancer,gunslinger,mutator,technomancer,machinegun,true,gunslinger,mutator', 'saved');
        same(r.wiped.join(), '0,0,false,', 'a fresh run kept something'); same(r.back.join(), 'technomancer,gunslinger,mutator,technomancer,machinegun,true,2', 'restored');
        same(r.again.join(), 'machinegun,1,1', 'back to the Gunslinger after the reload: its weapon, its count, no second kit'); same(r.clone, true, 'the clone came back after the reload');
        same(r.old.join(), 'technomancer,technomancer,false', 'an old save'); same(r.newGame, true, 'the Crystal destroyed is NEW GAME, which throws the save away');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
