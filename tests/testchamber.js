// THE TEST CHAMBER (?testchamber): js/facilitymap.js TEST_CHAMBER_MAP (the room), js/facilitygrow.js (put in the map only with the flag), js/testchamber.js (the mode and its panel),
// view3d/gamemap.js (the 3D view builds the room); docs/TEST-CHAMBER.md
// ASKED (the owner, 2026-11-23): "Can we create a test chamber where I can create any type of squad and create any type of enemy and level, and a room that has 3D and card battles, and
// maybe all sorts of energy cards unlocked".
// Without the flag nothing of the game changes. With it: the room is in the map and the game starts in it, the tutorial over; nothing is read from or written to storage; any squad is made
// by the game's own maker, levelling, forms and energy slots; any enemy by the facility's own spawner from its species' own class, at the level asked; every element's energy cards are in
// stock. In a real browser (no Chromium: it says so and passes): the 3D view shows the room, the panel makes a squad and enemies, and choosing one starts a card battle.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

async function boot(search, store) {
    const sb = makeBrowserSandbox(store || {}); sb.location.search = search || '';
    const context = vm.createContext(sb);
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    // (a spy on the start's cards screen and on every write to storage, put up before the page's start-up runs: js/init.js starts the facility)
    const SPY = `globalThis.__opened = []; { const e = equipRunStart; equipRunStart = function () { __opened.push('run start'); return e.apply(this, arguments); }; }
         globalThis.__writes = []; { const L = localStorage, set = L.setItem, rm = L.removeItem; L.setItem = function (k, v) { __writes.push('set ' + k); return set.call(L, k, v); }; L.removeItem = function (k) { __writes.push('remove ' + k); return rm.call(L, k); }; }`;
    for (const rel of scriptOrder()) { if (rel === 'js/init.js') run(SPY); try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); canvas.width = 1280; canvas.height = 860; innerWidth = 1100;');
    run(`globalThis.__room = (x, y) => { const r = facilityRoomAt(x, y, _fp.F); return r ? r.id : null; };
         globalThis.__sq = () => partyMembers().map(f => [f.evolved || 'unevolved', f.element, f.role, f.level, (f.energy || []).map(x => x || '').join('|')].join(':')).join(' ');`);
    return { run, J, store: sb.localStorage };
}
function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
// the game's page in a real browser (software WebGL), as tests/engineplan.js runs it; its result is a hidden block (a page that leaves none is run once more)
function realPage(query, post) { const r = onePage(query, post); return r && r.none ? onePage(query, post) : r; }
function onePage(query, post) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tc-')), file = path.join(dir, 'game.html'), prof = path.join(dir, 'profile');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => '<script>' + post + '</script></body>')); let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--window-size=1180,820', '--virtual-time-budget=60000', '--dump-dom', 'file://' + file + '?' + query], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 480000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__tc"[^>]*>([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : { none: true };
}

(async () => {
    const OFF = await boot('', {}), BOTH = await boot('?fluxlab&testchamber', {});
    group('WITHOUT THE FLAG: THE GAME AS IT WAS');
    check('no test chamber in the map, no stairwell to it, its room without a name or a look; a new game starts as ever (the tutorial at its first step, the game saved as it goes, no energy card in stock); the mode\'s makers make nothing', () => {
        const r = OFF.J(`(function(){ const F = _fp.F; return { on: testChamberOn(), room: F.byId.has('test_chamber'), well: F.decor.some(d => d.id === 'crystal_chamber_stairwell'), portal: (F.portals || []).some(p => /chamber_crystal|crystal_chamber$/.test(p.id) && p.id !== 'portal_crystal_lab'),
            tag: FP_ROOM_TAG.test_chamber || null, style: FP_STYLE_ROOMS.has('test_chamber'), start: __room(player.x, player.y), step: _fp.tut.script.step, save: _fp.saveReady, stock: energyTotal(), cham: !!_fp.testChamber,
            made: [testChamberSquadSet([{ element: 'ice', role: 'brawler', evolved: true, level: 20 }]).length, testChamberEnemy({ species: 'ant', cls: 'tank', level: 9, n: 2 }).length, testChamberClear(), testChamberEnergy(), testChamberClass('mutator'), testChamberChip(), testChamberPanel(true)].join(),
            squad: partyMembers().length, cls: playerClassKey || null }; })()`);
        same(JSON.stringify([r.on, r.room, r.well, r.portal, r.tag, r.style]), '[false,false,false,false,null,false]', 'the mode, its room, its stairwell, its doorway, its name, its look');
        same(JSON.stringify([r.start, r.step, r.save, r.stock, r.cham]), '["crystal_chamber",0,true,0,false]', 'a new game: where it starts, the tutorial, the saving, the energy stock');
        same(r.made, '0,0,0,0,false,false,false', 'without the flag the makers made something'); same(r.squad + ',' + r.cls, '3,null', 'the squad and the class were changed');
    });
    check('with the Flux test room\'s flag too, the Flux test room is the one in the map (the two are drawn in the same place): one test room at a time', () => {
        const r = BOTH.J(`(function(){ const F = _fp.F; return [testChamberOn(), fluxLabOn(), F.byId.has('test_chamber'), F.byId.has('flux_lab'), __room(player.x, player.y)]; })()`);
        same(JSON.stringify(r), '[false,true,false,true,"flux_lab"]', 'the modes, the rooms, the start');
    });

    const SAVED = { conduit_fp_save: JSON.stringify({ v: 1, followers: [], script: { step: 3 }, pos: [1, 1] }) };
    const ON = await boot('?testchamber', Object.assign({}, SAVED));
    group('WITH THE FLAG: THE ROOM, THE START, NOTHING KEPT');
    check('the room is in the map: an open floor eighteen tiles by thirteen with a two-tile alcove, nothing standing on it, 61 px under the lab\'s ground floor as the arena is; joined to the Crystal Chamber by a stairwell in its floor and the alcove\'s stairs; named and styled', () => {
        const r = ON.J(`(function(){ const F = _fp.F; let n = 0, lo = 1e9, hi = -1e9; for (const kv of _fp.cellsP) { const c = kv[1]; if (__room(c[0], c[1]) === 'test_chamber') { n++; const h = facilityLiftPx(c[0], c[1]); lo = Math.min(lo, h); hi = Math.max(hi, h); } }
            const P = (F.portals || []).filter(p => p.id === 'portal_chamber_crystal' || p.id === 'portal_crystal_chamber');
            return { on: testChamberOn(), room: F.byId.has('test_chamber'), cells: n, lift: [Math.round(lo), Math.round(hi)].join(), arena: Math.round(facilityLiftPx(crystal.x, crystal.y)), solids: F.solids.filter(s => s.room === 'test_chamber').length, well: F.decor.some(d => d.id === 'crystal_chamber_stairwell'),
                portals: P.map(p => p.room).sort().join(), tag: FP_ROOM_TAG.test_chamber, style: FP_STYLE_ROOMS.has('test_chamber') && FP_ROOM_STYLE.test_chamber === FP_ROOM_STYLE.crystal_chamber, lab: F.byId.has('flux_lab') }; })()`);
        same(JSON.stringify([r.on, r.room, r.lab, r.cells, r.solids]), '[true,true,false,236,0]', 'the mode, the room, no Flux test room, its floor tiles, what stands on it');
        same(r.lift, '-61,-61', 'its floor\'s height'); same(r.portals, 'crystal_chamber,test_chamber', 'the two ends of the way in'); same(JSON.stringify([r.well, r.tag, r.style]), '[true,"Test Chamber",true]', 'the stairwell, the name, the look');
    });
    check('the game starts in it with the tutorial over and the power on, a squad of three (a new game\'s kind, at the tutorial\'s follower level, each with its card), every element\'s energy cards in stock, no enemy of its own, no cards screen', () => {
        const r = ON.J(`(function(){ return { start: __room(player.x, player.y), step: _fp.tut.script.step === TUT_STEPS.length && !!_fp.tut.script.doneAt, dark: typeof facilityBlackoutOn === 'function' ? facilityBlackoutOn() : false, sq: __sq(), lv: TUT.followerLevel, near: partyMembers().every(f => __room(f.x, f.y) === 'test_chamber'),
            stock: ELEMENTS.filter(e => energyElementOk(e.id)).map(e => energyCount(e.id)).join(), els: ELEMENTS.filter(e => energyElementOk(e.id)).length, foes: testChamberEnemies().length, inRoom: actors.filter(a => a.fpCreature && !a.dead && __room(a.x, a.y) === 'test_chamber').length, opened: __opened.join(), cls: playerClassKey || null, zone: _fp.zoneRoom }; })()`);
        same(JSON.stringify([r.start, r.step, r.dark, r.zone]), '["test_chamber",true,false,"test_chamber"]', 'the start, the tutorial, the power, the room it is in');
        same(r.sq, ['unevolved:electric:brawler:' + r.lv + ':electric', 'unevolved:core:sniper:' + r.lv + ':core', 'unevolved:fire:camper:' + r.lv + ':fire'].join(' '), 'the squad'); same(r.near, true, 'the squad is not in the room');
        same(r.stock, Array(r.els).fill(9).join(), 'the energy cards in stock'); ok(r.els >= 7, 'the elements: ' + r.els); same(JSON.stringify([r.foes, r.inRoom, r.opened, r.cls]), '[0,0,"",null]', 'enemies, creatures in the room, the cards screen, a class');
    });
    check('nothing is kept: a saved game in storage is not read (its tutorial step is not this game\'s), nothing is written to storage as the game runs or when it would save, and the stored save is exactly as it was', () => {
        const r = ON.J(`(function(){ for (let i = 0; i < 400; i++) { frame++; if (typeof facilitySaveTick === 'function') facilitySaveTick(); } if (typeof facilitySaveWrite === 'function') { try { facilitySaveWrite(); } catch (e) {} }
            return { ready: _fp.saveReady, load: facilitySaveLoad(), writes: __writes.join(' | ') }; })()`);
        same(JSON.stringify([r.ready, r.load, r.writes]), '[false,null,""]', 'the saving, a load, the writes'); same(ON.store.getItem('conduit_fp_save'), SAVED.conduit_fp_save, 'the stored save was changed');
    });

    group('ANY SQUAD');
    check('every element and role, evolved: the form the game gives that element and role, at the level asked, its energy slots holding as many of its own cards as asked (none: its second attack shut; three: its Ultimate open); 21 forms', () => {
        const r = ON.J(`(function(){ const out = [], els = ELEMENTS.filter(e => energyElementOk(e.id)).map(e => e.id); let n = 0;
            for (const el of els) for (const role of TEST_CHAMBER.roles) { const k = n % 4, lv = 3 + (n * 7) % 60; n++; const made = testChamberSquadSet([{ element: el, role, evolved: true, level: lv, cards: k }]), f = made[0], d = evolutionFor({ isFollower: true, element: el, role });
                out.push([!!f && made.length === 1 && partyMembers().length === 1 && partyMembers()[0] === f, f && d && f.evolved === d.id && EVOLUTIONS[f.evolved] === d && d.element === el && d.role === role, f && f.level === lv && f.xp === xpForLevel(lv), f && energyFilled(f) === k && energyOwn(f) === k && energySlots(f).length === ENERGY.evolvedSlots,
                    f && energyAltOpen(f) === (k >= ENERGY.altNeeds) && energyUltOpen(f) === (k >= ENERGY.ultNeeds), f && f.health === f.maxHealth && f.maxHealth > 0 && f.element === el && f.role === role].map(Boolean).join()); }
            return { n, bad: out.filter(x => x !== 'true,true,true,true,true,true'), forms: Object.keys(EVOLUTIONS).filter(k => !EVOLUTIONS[k].legacy && !EVOLUTIONS[k].aside).length }; })()`);
        same(r.n, 21, 'the elements times the roles'); same(r.bad.join(' ; '), '', 'a follower not as asked (made alone, its form, its level, its cards, what they open, its health and kind)'); ok(r.forms >= 21, 'the game\'s forms: ' + r.forms);
    });
    check('its numbers are the game\'s own: a Frost Maw made at level 20 has the health, attack and special attack the game\'s levelling gives that form at that level (js/levels.js), not the chamber\'s', () => {
        const r = ON.J(`(function(){ const f = testChamberSquadSet([{ element: 'ice', role: 'brawler', evolved: true, level: 20, cards: 3 }])[0], was = [f.maxHealth, f.stats.attack, f.stats.specialAttack, f.stats.defense].join();
            _applyFollowerLevel(f, true); return { was, now: [f.maxHealth, f.stats.attack, f.stats.specialAttack, f.stats.defense].join(), name: EVOLUTIONS[f.evolved].name, base: levelledStats(f.base, 20).hp, hp: f.stats.hp }; })()`);
        same(r.name, 'FROST MAW', 'the form'); same(r.was, r.now, 'the game\'s own levelling gives it other numbers'); ok(r.hp > r.base, 'an evolved form is not tougher than its base at that level: ' + r.hp + ' / ' + r.base);
    });
    check('three places, each as asked, in place of whoever was there (taken out of the game, not felled; no more than the squad holds): an evolved one, an unevolved one with its card (its element is the card\'s), one with no element; a place left at NOBODY is nobody; the tutorial\'s director lifts no level', () => {
        const r = ON.J(`(function(){ const before = followers.slice(), made = testChamberSquadSet([{ element: 'ice', role: 'brawler', evolved: true, level: 20, cards: 3 }, { element: 'fire', role: 'camper', evolved: false, level: 3 }, { element: 'none', role: 'sniper', evolved: true, level: 4 }, { element: 'toxic', role: 'sniper', evolved: true, level: 9 }]);
            for (let i = 0; i < 5; i++) { frame++; facilityDirectorTick(); }
            const o = { sq: __sq(), n: made.length, gone: before.every(f => followers.indexOf(f) < 0 && actors.indexOf(f) < 0 && f.dead), noFell: followers.every(f => !f.fell), max: PARTY.max, asked: TEST_CHAMBER.squad.length };
            o.two = testChamberSquadSet([{ element: '', role: 'brawler' }, { element: 'core', role: 'brawler', evolved: true, level: 12, cards: 2 }, { element: '', role: 'brawler' }]).length + ':' + __sq(); return o; })()`);
        same(r.sq, 'maw:ice:brawler:20:ice|ice|ice unevolved:fire:camper:3:fire unevolved:none:sniper:4:', 'the three (a fourth place is not the squad\'s; no element cannot be evolved; level 3 stays 3)'); same(JSON.stringify([r.n, r.gone, r.noFell, r.max, r.asked]), '[3,true,true,3,3]', 'how many, the old ones gone, nobody felled');
        same(r.two, '1:jellyram:core:brawler:12:core|core|', 'two places at NOBODY');
    });
    check('an unevolved follower with a card at the evolving level evolves by the game\'s own rule (js/evolution.js evoCheck), as the panel says; one with no card does not', () => {
        const r = ON.J(`(function(){ const m = testChamberSquadSet([{ element: 'electric', role: 'sniper', evolved: false, level: EVOLVE_LEVEL }, { element: 'none', role: 'sniper', evolved: false, level: EVOLVE_LEVEL + 5 }]);
            const o = { was: [m[0].evolved || null, m[1].evolved || null], did: [evoCheck(m[0]), evoCheck(m[1])], now: [m[0].evolved || null, m[1].evolved || null] }; testChamberSquadSet(TEST_CHAMBER.squad.slice()); return o; })()`);
        same(JSON.stringify([r.was, r.did, r.now]), '[[null,null],[true,false],["thunderhead",null]]', 'before, the rule, after');
    });

    group('ANY ENEMY AND LEVEL');
    check('each is the facility\'s own creature of the species and class asked, at the level asked, with the element asked or none, of the chamber (it wanders in it, calm); its health and bite are what the game makes that class at that level; put at the far end, not on anyone', () => {
        const r = ON.J(`(function(){ testChamberClear(); const made = testChamberEnemy({ species: 'ant', cls: 'tank', element: 'toxic', level: 9, n: 2 }).concat(testChamberEnemy({ species: 'ant', cls: 'worker', element: '', level: 3, n: 3 }));
            const ref = spawnCreature({ species: 'ant', className: 'tank', x: 1, y: 1, level: 9, state: 'wander' }), want = [ref.maxHealth, ref.power].join(); ref.dead = true; ref.deathProcessed = true; ref._xpGiven = true; actors = actors.filter(a => a !== ref);
            return { n: made.length, kinds: made.map(a => [a.speciesName, a.className, a.level, a.element || '-', a.homeRoom, a.state, a.fpCreature, a.team].join(':')).join(' '), room: made.every(a => __room(a.x, a.y) === 'test_chamber'), tank: [made[0].maxHealth, made[0].power].join(), want,
                apart: made.every(a => made.every(b => a === b || Math.hypot(a.x - b.x, a.y - b.y) >= 1.19)) && made.every(a => Math.hypot(a.x - player.x, a.y - player.y) >= 3), alive: testChamberEnemies().length, race: made[0].race }; })()`);
        same(r.n, 5, 'how many were made'); same(r.kinds, ['ant:tank:9:toxic:test_chamber:wander:true:red', 'ant:tank:9:toxic:test_chamber:wander:true:red', 'ant:worker:3:-:test_chamber:wander:true:red', 'ant:worker:3:-:test_chamber:wander:true:red', 'ant:worker:3:-:test_chamber:wander:true:red'].join(' '), 'what they are');
        same(r.room, true, 'one is not in the chamber'); same(r.tank, r.want, 'a tank\'s health and bite at level 9 are not the game\'s own'); same(JSON.stringify([r.apart, r.alive, r.race]), '[true,5,"ant"]', 'apart from each other and from you; alive; their race');
    });
    check('every species the game has and every class of it can be made; a species or a class it does not have makes nothing; no more than six at a press and twelve alive; CLEAR takes them all out without a kill being counted or anything dropped', () => {
        const r = ON.J(`(function(){ testChamberClear(); const k0 = lifetimeKills, d0 = _fp.items.length, bad = [], kinds = []; let total = 0;
            for (const sp of testChamberSpecies()) for (const cls of testChamberClasses(sp)) { const m = testChamberEnemy({ species: sp, cls, level: 5, n: 1 }); total++; if (m.length !== 1 || m[0].speciesName !== sp || m[0].className !== cls || m[0].level !== 5) bad.push(sp + ':' + cls); testChamberClear(); }
            const o = { species: testChamberSpecies().join(), total, bad: bad.join(), none: [testChamberEnemy({ species: 'dragon', cls: 'tank', level: 5 }).length, testChamberEnemy({ species: 'ant', cls: 'queen', level: 5 }).length, testChamberEnemy(null).length, testChamberEnemy({ species: 'larva', cls: 'boss', level: 5 }).length].join(), ant: testChamberClasses('ant').join() };
            o.press = testChamberEnemy({ species: 'ant', cls: 'scout', level: 2, n: 50 }).length; o.more = testChamberEnemy({ species: 'ant', cls: 'scout', level: 2, n: 6 }).length; o.full = testChamberEnemy({ species: 'ant', cls: 'scout', level: 2, n: 6 }).length; o.alive = testChamberEnemies().length;
            o.cleared = testChamberClear(); o.left = testChamberEnemies().length + actors.filter(a => a.testChamberFoe).length; o.kills = lifetimeKills - k0; o.drops = _fp.items.length - d0; return o; })()`);
        same(r.species, 'ant,beetle,scorpion,spider,mantis,moth,rolypoly', 'the species (not the diving beetle larva: a boss and nothing else, its fight is its encounter\'s)'); same(r.ant, 'nymph,worker,scout,striker,tank,boss', 'an ant\'s classes'); ok(r.total >= 30, 'kinds tried: ' + r.total); same(r.bad, '', 'a kind that was not made as asked'); same(r.none, '0,0,0,0', 'what the game does not have, or a boss that is its own encounter');
        same(JSON.stringify([r.press, r.more, r.full, r.alive]), '[6,6,0,12]', 'at a press, another six, a third press on a full room, alive'); same(JSON.stringify([r.cleared, r.left, r.kills, r.drops]), '[12,0,0,0]', 'cleared, left, kills counted, things dropped');
    });

    group('ENERGY CARDS, AND YOUR CLASS');
    check('every element\'s cards are filled back up to nine (spent ones come back; more than nine are left alone); a card goes in a follower\'s slot from the stock by the game\'s own rule', () => {
        const r = ON.J(`(function(){ const els = ELEMENTS.filter(e => energyElementOk(e.id)).map(e => e.id); energyAdd('fire', -5); energyAdd('ice', 4); const mid = [energyCount('fire'), energyCount('ice')].join(), n = testChamberEnergy();
            const f = testChamberSquadSet([{ element: 'ice', role: 'brawler', evolved: true, level: 20, cards: 0 }])[0], put = energyPut(f, 0, 'toxic');
            const o = { mid, n, els: els.length, now: [energyCount('fire'), energyCount('ice')].join(), put, slot: energySlots(f)[0], toxic: energyCount('toxic'), alt: energyAltOpen(f) }; testChamberSquadSet(TEST_CHAMBER.squad.slice()); return o; })()`);
        same(r.mid, '4,13', 'spent and added'); same(r.n, r.els, 'the elements filled'); same(r.now, '9,13', 'filled to nine; more left alone'); same(JSON.stringify([r.put, r.slot, r.toxic, r.alt]), '[true,"toxic",8,true]', 'a card of another element put in a slot: taken from the stock, its second attack open');
    });
    check('your class is chosen by the game\'s own choosing (its kit with it), and the Crystal does not recite the class\'s tutorial lines here', () => {
        const r = ON.J(`(function(){ const said = () => Object.keys(_fp.tut.script.said).filter(k => /^cstep:mutator:/.test(k)).length; const ok = testChamberClass('mutator'), n = said(); let spoke = 0; const d = dialogueSay; dialogueSay = function () { spoke++; return d.apply(this, arguments); };
            for (let i = 0; i < 30; i++) { frame++; facilityDirectorTick(); } dialogueSay = d; return { ok, cls: playerClassKey, said: n, steps: TUT_CLASS_STAGES.mutator.length, spoke, bad: testChamberClass('wizard') }; })()`);
        same(JSON.stringify([r.ok, r.cls, r.bad]), '[true,"mutator",false]', 'the class'); same(r.said, r.steps, 'its stage\'s lines marked said'); same(r.spoke, 0, 'the Crystal spoke its class lines');
    });

    group('THE CODE');
    check('the hooks: the map only with the flag and not with the Flux test room\'s; no save read and nothing written to storage; the start; the 3D view builds the room; the page loads the script; nothing of it is in the players\' way without the flag', () => {
        const grow = rd('js/facilitygrow.js'), play = rd('js/facilityplay.js'), save = rd('js/facilitysave.js'), map = rd('view3d/gamemap.js'), page = rd('game.html'), tc = rd('js/testchamber.js');
        ok(/typeof TEST_CHAMBER_MAP !== "undefined" && !M\._fluxLab && [^\n]*\/\[\?&\]testchamber\\b\/\.test\(window\.location\.search \|\| ""\)/.test(grow), 'js/facilitygrow.js does not put the room in with the flag alone');
        ok(/if \(typeof testChamberOn === "function" && testChamberOn\(\)\) return null;/.test(save), 'js/facilitysave.js reads a save in the chamber'); ok(/!\(typeof testChamberOn === "function" && testChamberOn\(\)\); Storage\.prototype\.setItem/.test(play), 'js/facilityplay.js lets the chamber write to storage');
        ok(/const chamber = !away && !lab && typeof testChamberOn === "function" && testChamberOn\(\);/.test(play) && /_fp\.saveReady = !away && !lab && !chamber;/.test(play) && /if \(chamber && typeof testChamberStart === "function"\) testChamberStart\(F\);/.test(play), 'js/facilityplay.js: the start');
        ok(/\.filter\(r => r\.id === 'test_chamber'\)\.map\(r => r\.id\)\)/.test(map), 'view3d/gamemap.js does not build the room'); ok(/<script src="js\/testchamber\.js\?v=[0-9a-z-]+"><\/script>/.test(page) && /"js\/testchamber\.js": "TEST_CHAMBER"/.test(page), 'game.html does not load the script, or does not check it');
        ok(/function testChamberChip\(\) \{\n\s*if \(!testChamberOn\(\) \|\| _tcEls/.test(tc) && /function testChamberEnergy\(\) \{\n\s*if \(!testChamberOn\(\)/.test(tc) && /function testChamberEnemy\(spec\) \{\n[^\n]*if \(!testChamberOn\(\)/.test(tc) && /function testChamberSquadSet\(list\) \{\n\s*if \(!testChamberOn\(\)/.test(tc), 'a maker that works without the flag');
        ok(!/Math\.random|localStorage|sessionStorage/.test(tc.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n')), 'js/testchamber.js rolls dice or touches storage');
    });

    // THE REAL PAGE: the chamber in the 3D view with card battles, its panel worked as a finger would (its own controls set and pressed). The frames no check looks at are not drawn.
    const R = realPage('dev&testchamber&engine=3d&battles=cards', `window.__errs = []; window.addEventListener('error', function (e) { window.__errs.push(String(e.message)); });
(function wait(n) {
  var ready = typeof STARTUP !== 'undefined' && (STARTUP.state === 'done' || STARTUP.state === 'failed') && typeof VIEW3D !== 'undefined' && (VIEW3D.state === 'ready' || VIEW3D.state === 'failed');
  if (!ready && n < 1200) return setTimeout(function () { wait(n + 1); }, 100);
  var out = { start: typeof STARTUP !== 'undefined' ? STARTUP.state : 'none', view: VIEW3D.state, error: VIEW3D.error };
  try { gameState.running = true; if (typeof dialogueClear === 'function') dialogueClear();
    var V = VIEW3D.view, step = function (k) { for (var i = 0; i < k; i++) { if (V && V.dry) V.dry(i < k - 1); render(); } }, room = function (u) { var r = facilityRoomAt(u.x, u.y, _fp.F); return r ? r.id : null; };
    var Q = function (s) { return document.querySelector(s); }, QA = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); }, set = function (el, v) { if (el.type === 'checkbox') { if (el.checked !== v) el.click(); } else { el.value = String(v); el.dispatchEvent(new Event('change', { bubbles: true })); } };
    step(3); out.room = room(player); out.covers = V.covers('test_chamber'); out.showing = view3dShowing(); out.cards = cardBattleOn(); out.chip = !!Q('#testChamberChip'); out.chipShown = Q('#testChamberChip') ? getComputedStyle(Q('#testChamberChip')).display : null;
    Q('#testChamberChip').click(); out.open = Q('#testChamberPanel').classList.contains('open'); var rows = QA('#testChamberPanel [data-squad]'); out.rows = rows.length;
    var fill = function (row, o) { Object.keys(o).forEach(function (k) { set(row.querySelector('[data-k="' + k + '"]'), o[k]); }); };
    fill(rows[0], { element: 'ice', role: 'brawler', evolved: true, level: 20, cards: 3 }); fill(rows[1], { element: 'toxic', role: 'sniper', evolved: true, level: 15, cards: 1 }); fill(rows[2], { element: 'fire', role: 'camper', evolved: false, level: 5 });
    out.names = rows.map(function (r) { return r.querySelector('.tc-form').textContent; }).join(); Q('#testChamberPanel [data-act="squad"]').click();
    out.squad = partyMembers().map(function (f) { return [f.evolved || 'unevolved', f.element, f.role, f.level, (f.energy || []).map(function (x) { return x || ''; }).join('|')].join(':'); }).join(' ');
    Q('#testChamberPanel [data-class="gunslinger"]').click(); out.cls = playerClassKey; out.lit = QA('#testChamberPanel [data-class].on').map(function (b) { return b.dataset.class; }).join();
    var er = Q('#testChamberPanel [data-enemy]'); fill(er, { species: 'ant' }); out.classes = QA('#testChamberPanel [data-enemy] [data-k="cls"] option').map(function (o) { return o.value; }).join();
    fill(er, { cls: 'tank', element: 'toxic', level: 9, n: 2 }); Q('#testChamberPanel [data-act="enemy"]').click(); out.say = Q('#testChamberPanel [data-say="enemy"]').textContent;
    out.foes = testChamberEnemies().map(function (a) { return [a.speciesName, a.className, a.level, a.element || '-', room(a)].join(':'); }).join(' ');
    Q('#testChamberPanel [data-act="energy"]').click(); out.stock = ELEMENTS.filter(function (e) { return energyElementOk(e.id); }).map(function (e) { return energyCount(e.id); }).join();
    Q('#testChamberPanel [data-act="close"]').click(); out.closed = !Q('#testChamberPanel').classList.contains('open'); step(3);
    out.bodies = testChamberEnemies().every(function (a) { return V.has(a); }) && partyMembers().every(function (f) { return V.has(f); });
    out.chose = cardBattleChoose(testChamberEnemies()[0]); step(3); out.battle = cardBattleActive(); out.inBattle = cardBattleFoes().length;
    var n = 0; V.dry(true); while (n++ < 900 && !document.body.classList.contains('cb-on')) render(); V.dry(false); step(1); out.screen = document.body.classList.contains('cb-on'); out.hidden = getComputedStyle(Q('#testChamberChip')).display;   // (the battle's own screen up: the walk to it and its black are over)
    testChamberPanel(true); Q('#testChamberPanel [data-act="clear"]').click(); step(2); out.cleared = [testChamberEnemies().length, cardBattleActive()].join(); out.store = Object.keys(localStorage).length;
  } catch (e) { out.threw = String(e && e.stack || e).slice(0, 600); }
  out.errs = window.__errs.slice(0, 6); var pre = document.createElement('pre'); pre.id = '__tc'; pre.style.display = 'none'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
})(0);`);
    group('IN A REAL BROWSER: THE CHAMBER IN THE 3D VIEW WITH CARD BATTLES, ITS PANEL WORKED');
    check('it starts in the chamber with no error, the 3D view showing the room it built, card battles on, the TEST CHAMBER chip on the screen', () => {
        if (R === null) { console.log('       (no Chromium here: not run)'); return; }
        ok(!R.none, 'the page left no result'); same(R.threw || '', '', 'it threw'); same((R.errs || []).join(), '', 'page errors'); same(R.start + ',' + R.view, 'done,ready', 'the start and the view (' + R.error + ')');
        same(JSON.stringify([R.room, R.covers, R.showing, R.cards, R.chip, R.chipShown]), '["test_chamber",true,true,true,true,"block"]', 'the room, built, showing, card battles, the chip');
    });
    check('the panel: three places set to a Frost Maw 20, a Rotshard 15 with one card and an unevolved fire technician 5 name their forms, and MAKE THIS SQUAD makes them; a class is chosen and lit; an ant\'s classes are offered, and ADD ENEMIES makes two toxic tanks of level 9 in the room; the stock is nine of each; it closes', () => {
        if (!R || R.none || R.threw) { console.log('       (not run)'); return; }
        same(JSON.stringify([R.open, R.rows, R.names]), '[true,3,"FROST MAW,ROTSHARD,UNEVOLVED"]', 'open, its places, the forms named');
        same(R.squad, 'maw:ice:brawler:20:ice|ice|ice rotshard:toxic:sniper:15:toxic|| unevolved:fire:camper:5:fire', 'the squad made'); same(R.cls + ',' + R.lit, 'gunslinger,gunslinger', 'the class');
        same(R.classes, 'nymph,worker,scout,striker,tank,boss', 'an ant\'s classes'); same(R.foes, 'ant:tank:9:toxic:test_chamber ant:tank:9:toxic:test_chamber', 'the enemies made'); ok(/^2 ADDED · IN THE ROOM: 2 OF 12$/.test(R.say), 'what the panel says: ' + R.say);
        ok(/^9(,9){6,}$/.test(R.stock), 'the stock: ' + R.stock); same(R.closed, true, 'it did not close');
    });
    check('the 3D view draws the squad and the enemies made; an enemy chosen starts a card battle with both tanks in it, the chip out of its banner\'s way; CLEAR ENEMIES ends it and empties the room; nothing was written to storage', () => {
        if (!R || R.none || R.threw) { console.log('       (not run)'); return; }
        same(JSON.stringify([R.bodies, R.chose, R.battle, R.inBattle, R.screen, R.hidden]), '[true,true,true,2,true,"none"]', 'the bodies, the choosing, the battle, who is in it, its screen up, the chip'); same(R.cleared, '0,false', 'enemies left, a battle still on'); same(R.store, 0, 'keys in storage');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
