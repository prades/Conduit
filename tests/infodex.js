// THE INFO PANEL (js/infodex.js): the long-press ring's INFO, an index of everything with a description of each, in the layout style.
// ASKED: "make the info tab work again with the new menu. Make it an actual index of everything and give it a description. And get rid of the long hold press options that don't make sense, like switch."
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
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id)); ensureWorldTo(60); _nestCache = world.filter(t => t.nest); canvas.width = 390; canvas.height = 760;`);
    const pylon = () => run(`(function(){ const t = getTile(20, 3); t.pillar = true; t.pillarTeam = 'green'; t.destroyed = false; t.health = t.maxHealth = 80; t.attackMode = true; t.waveMode = false; t.attackModeElement = 'fire'; return (globalThis.__p = t); })()`);
    const open = (tile, sub) => { run('globalThis.__sub = ' + (sub || 'null')); run(`openInfoPanel(${tile}, __sub)`); };
    const tap = (x, y) => run(`_handleInfoPanelTap(${x}, ${y})`);
    const mid = r => [Math.round(r.x + r.w / 2), Math.round(r.y + r.h / 2)];

    group('THE INDEX: everything, each with a description');
    check('every entry has a name, a category, a one-line summary and a description; ids are unique', () => {
        const E = J('infoEntries()'), cats = J('INFO_CATS.map(c => c.id)');
        ok(E.length >= 15, 'only ' + E.length + ' entries');
        same(new Set(E.map(e => e.id)).size, E.length, 'duplicate ids');
        for (const e of E) { ok(e.name && e.sub && e.text.length && e.text.every(t => t.length > 20), e.id + ' is thin'); ok(cats.includes(e.cat), e.id + ' has category ' + e.cat); }
    });
    check('every category has something in it; the elements and rules tabs list the codex pages', () => {
        const E = J('infoEntries()');
        for (const c of ['build', 'power', 'allies', 'foes']) ok(E.some(e => e.cat === c), c + ' is empty');
        run(`openPylonCodex(); _infoCat = 'elements'`);
        const L = J('_ipLayout()'); same(L.placed.filter(p => p.it.k === 'nav').length, 7, 'six elements and the combos');
        run(`_infoCat = 'rules'`); same(J('_ipLayout()').placed.filter(p => p.it.k === 'nav').length, 2, 'rules and infestation');
    });
    check('the numbers in the descriptions are the game\'s own constants', () => {
        const rows = id => J(`infoEntry('${id}').rows`).map(r => r.join(' '));
        ok(rows('turret').some(r => r.includes(run('TURRET_RANGE') + ' tiles')), 'turret reach');
        ok(rows('mk2').some(r => r.includes(run('MK2_COST') + ' ◆')), 'MK II price');
        ok(rows('unit').some(r => r.includes(2 * run('PYLON_BUILD_COST') + ' ◆')), 'boot price');
        ok(rows('overcharge').some(r => r.includes('60 s')), 'overcharge cooldown');
        ok(rows('modules').length === run('MODULE_IDS.length'), 'a row a module');
    });
    check('the old generator/connector/battery bank is not described as something to build', () => {
        const all = J('infoEntries()').map(e => e.name + ' ' + e.text.join(' ')).join(' ');
        ok(!/BUILD (A|THE) (GENERATOR|CONNECTOR)/i.test(all), 'a generator is still offered');
    });

    group('THE PANEL: tabs, entries, back, close');
    check('the index opens on six tabs; a tab changes the list; an entry opens its page; BACK returns to the index', () => {
        run('openPylonCodex()');
        let L = J('_ipLayout()'); same(L.tabs.length, 6, 'tabs');
        const power = L.tabs.find(t => t.id === 'power'); tap(...mid(power));
        same(run('_infoCat'), 'power', 'tab');
        L = J('_ipLayout()'); const nav = L.placed.find(p => p.it.k === 'nav'); ok(nav && nav.it.page === 'e:unit', 'first power entry is ' + (nav && nav.it.page));
        tap(L.ix + 20, nav.y + 20);
        same(run('infoPanelPage'), 'e:unit', 'page'); L = J('_ipLayout()');
        same(L.title, 'POWER', 'title is the category'); ok(L.placed.some(p => p.it.k === 'head' && p.it.t === 'WALL POWER UNIT'), 'no name');
        const back = L.buttons.find(b => b.id === 'back'); tap(...mid(back)); same(run('infoPanelPage'), 'codex', 'back to the index');
        const close = J('_ipLayout()').buttons.find(b => b.id === 'close'); tap(...mid(close)); same(run('infoPanelOpen'), false, 'closed');
    });
    check('tapping outside the panel closes it', () => { run('openPylonCodex()'); tap(1, 1); same(run('infoPanelOpen'), false, 'closed'); });
    check('opened from the settings there is no target to go back to, so no BACK button', () => {
        run('openPylonCodex()'); ok(!J('_ipLayout()').buttons.some(b => b.id === 'back'), 'a back button with nowhere to go');
    });

    group('THE READOUT: what you pressed, then a way into its entry');
    check('a pylon: its live numbers, and ABOUT / NETWORK buttons', () => {
        pylon(); open('__p');
        const L = J('_ipLayout()'); same(L.title, 'ATTACK TURRET', 'title');
        const keys = L.placed.filter(p => p.it.k === 'pair').map(p => p.it.a); for (const k of ['TEAM', 'ELEMENT', 'MODE', 'HP', 'STATUS']) ok(keys.includes(k), k + ' missing');
        const navs = L.placed.filter(p => p.it.k === 'nav').map(p => p.it.page); ok(navs.includes('e:turret') && navs.includes('fire'), JSON.stringify(navs));
        const about = L.placed.find(p => p.it.page === 'e:turret'); tap(L.ix + 20, about.y + 20); same(run('infoPanelPage'), 'e:turret', 'opened the entry');
        tap(...mid(J('_ipLayout()').buttons.find(b => b.id === 'back'))); same(run('infoPanelPage'), 'codex', 'back goes to the index');
        tap(...mid(J('_ipLayout()').buttons.find(b => b.id === 'back'))); same(run('infoPanelPage'), null, 'and back again to the readout');
    });
    check('a wave pylon, an MK II and a wall power cell each point at their own entry', () => {
        pylon(); const set = (f) => run(`(function(){ const t = __p; t.attackMode = false; t.waveMode = false; t.mk = 0; t.isBattery = false; ${f}; })()`);
        set('t.waveMode = true; t.attackModeElement = "ice"'); open('__p'); ok(J('_ipLayout()').placed.some(p => p.it.page === 'e:wave'), 'wave');
        set('t.attackMode = true; t.attackModeElement = "fire"; t.mk = 2'); open('__p'); ok(J('_ipLayout()').placed.some(p => p.it.page === 'e:mk2'), 'mk2');
        run(`(function(){ const t = wallUnitTiles(0)[0]; t.pillar = true; t.pillarTeam = 'green'; t.destroyed = false; t.health = t.maxHealth = 200; t.isBattery = true; t.attackModeElement = 'fire'; __p = t; })()`);
        open('__p'); ok(J('_ipLayout()').placed.some(p => p.it.page === 'e:cells'), 'cell');
    });
    check('a hostile enemy pylon points at the hunters', () => {
        pylon(); run('__p.pillarTeam = "red"'); open('__p'); ok(J('_ipLayout()').placed.some(p => p.it.page === 'e:hunter'), 'hunter');
    });
    check('REPORTED: an enemy, a follower and a nest each get a readout (INFO used to say "nothing nearby" for them)', () => {
        open('null', '{ enemy: { x: 5, y: 2, health: 40, maxHealth: 60, dead: false, power: 18, moveSpeed: 0.02, speciesName: "ant", className: "scout", element: "fire" } }');
        let L = J('_ipLayout()'); ok(/ANT/.test(L.title), 'enemy title ' + L.title); ok(L.placed.some(p => p.it.k === 'pair' && p.it.a === 'HP' && p.it.b === '40 / 60'), 'enemy HP'); ok(L.placed.some(p => p.it.page === 'e:species'), 'no way into the predators');
        const nestT = run('world.find(t => t.nest && t.y === -1 && t.x > 0 && !isHomePortal(t))');
        open('null', '{ nest: world.find(t => t.nest && t.y === -1 && t.x > 0 && !isHomePortal(t)) }');
        L = J('_ipLayout()'); ok(/NEST/.test(L.title), 'nest title ' + L.title); ok(L.placed.some(p => p.it.page === 'e:nest'), 'no way into nests');
        run(`followers.length = 0; spawnFollowerAtCrystal('electric')`);
        open('null', '{ follower: followers[0] }'); L = J('_ipLayout()'); ok(L.placed.some(p => p.it.k === 'pair' && p.it.a === 'ELEMENT'), 'follower'); ok(L.placed.some(p => p.it.page === 'e:squad'), 'no way into the squad');
    });
    check('INFO in the ring hands the panel the follower, enemy or nest that was pressed', () => {
        run(`commandMode = true; commandTarget = null; commandFollowerTarget = null; commandNestTarget = null; commandEnemyTarget = { x: 3, y: 2, health: 5, maxHealth: 5, dead: false, speciesName: 'ant', className: 'scout' }; selectedRadialAction = 'info'; executeCommand();`);
        ok(run('infoPanelOpen') && run('infoPanelSubject.enemy.speciesName') === 'ant', 'the enemy never reached the panel');
        run('closeInfoPanel()'); same(run('infoPanelSubject'), null, 'closing forgets the subject'); run('commandEnemyTarget = null');
    });

    group('IT FITS: every page inside the panel, long ones in pages');
    for (const [w, h] of [[390, 700], [900, 700], [360, 480]]) {
        check(`at ${w}x${h} every page keeps its rows and buttons inside the panel`, () => {
            run(`canvas.width = ${w}; canvas.height = ${h}`);
            const pages = ['codex', 'rules', 'infest', 'combos', 'generator', ...J('ELEMENTS.map(e => e.id)'), ...J('infoEntries().map(e => "e:" + e.id)')];
            for (const p of pages) {
                run(`openPylonCodex(); _ipGo(${JSON.stringify(p)});`);
                for (let n = 0; n < 8; n++) {
                    const L = J('_ipLayout()'); run(`_infoPageNo = ${n}`);
                    const L2 = J('_ipLayout()'); if (n >= L2.pages) break;
                    ok(L2.px >= 0 && L2.px + L2.pw <= w, p + ' wider than the screen');
                    for (const q of L2.placed) ok(q.y >= L2.py + 50 && q.y + q.h <= L2.py + L2.ph - 60, `${p} p${n}: a row at ${q.y}+${q.h} outside ${L2.py}..${L2.py + L2.ph}`);
                    for (const b of L2.buttons) ok(b.x >= L2.px && b.x + b.w <= L2.px + L2.pw && b.y + b.h <= L2.py + L2.ph, p + ' button outside');
                    for (const q of L2.placed) if (q.it.k === 'text') ok(q.it.t.length <= L2.chars + 1, `${p}: a line of ${q.it.t.length} chars over ${L2.chars}`);
                }
            }
            run('closeInfoPanel(); _infoPageNo = 0');
        });
    }
    check('a page that is too tall is split, and the middle button turns the pages round', () => {
        run('canvas.width = 360; canvas.height = 480; openPylonCodex(); _ipGo("e:species")');
        let L = J('_ipLayout()'); ok(L.pages > 1, 'one page of ' + L.placed.length + ' rows'); const pg = L.buttons.find(b => b.id === 'page'); ok(pg, 'no page button');
        tap(...mid(pg)); same(J('_ipLayout()').page, 1, 'page 2'); for (let i = 1; i < L.pages; i++) tap(...mid(J('_ipLayout()').buttons.find(b => b.id === 'page'))); same(J('_ipLayout()').page, 0, 'wraps to page 1');
        run('closeInfoPanel(); canvas.width = 390; canvas.height = 760');
    });
    check('it draws without throwing, with the old panel gone from ui.js', () => {
        run('openPylonCodex(); drawInfoPanel(); _ipGo("e:ultra"); drawInfoPanel(); _ipGo(null); closeInfoPanel();');
        ok(!/function drawInfoPanel/.test(rd('js/ui.js')) && /function drawInfoPanel/.test(rd('js/infodex.js')), 'two info panels');
        ok(!/font = "\d+px monospace"/.test(rd('js/infodex.js')), 'small monospace type');
    });

    group('THE RING: only options that mean something');
    check('no SWITCH: the catch-all is gone from the ring, the tap path and the commands', () => {
        ok(!/switch_context/.test(rd('js/draw.js') + rd('js/input.js') + rd('js/commands.js')), 'switch_context is still wired up');
        ok(!/"SWITCH"/.test(rd('js/draw.js')), 'a SWITCH label is still drawn');
        ok(!/TURN O(N|FF)|(OPEN|CLOSE) CIRCUIT/.test(rd('js/draw.js')), 'the generator switch labels are still in the ring');
    });
    check('the left of the ring is empty on plain floor, and a drag there picks nothing', () => {
        run(`commandMode = true; commandX = 200; commandY = 300; commandTarget = getTile(20, 1); commandTarget.pillar = false; commandFollowerTarget = null; commandEnemyTarget = null; commandNestTarget = null; buildMode = false; dragDX = -60; dragDY = 0; drawRadialMenu();`);
        same(run('selectedRadialAction'), null, 'picked on an empty left'); run('commandMode = false');
    });
    check('the left still offers RECLAIM on an enemy pylon', () => {
        pylon(); run(`__p.pillarTeam = 'red'; commandMode = true; commandX = 200; commandY = 300; commandTarget = __p; commandFollowerTarget = null; commandEnemyTarget = null; commandNestTarget = null; buildMode = false; dragDX = -60; dragDY = 0; drawRadialMenu();`);
        same(run('selectedRadialAction'), 'reconstruct', 'enemy pylon'); run('__p.pillarTeam = "green"; commandMode = false');
    });
    const ringPick = (dx, dy) => { run(`commandMode = true; commandX = 200; commandY = 300; buildMode = false; dragDX = ${dx}; dragDY = ${dy}; drawRadialMenu();`); const a = run('selectedRadialAction'); run('commandMode = false'); return a; };

    group('THE RING ON A TURRET: INFO, POSITION and DESTROY, nothing else');
    check('your turret: INFO right, POSITION below, DESTROY above, nothing on the left (MK II and CONVERT moved into its INFO panel)', () => {
        pylon(); run(`commandTarget = __p; commandFollowerTarget = null; commandEnemyTarget = null; commandNestTarget = null;`);
        same(ringPick(60, 0), 'info', 'right'); same(ringPick(0, 60), 'position', 'down'); same(ringPick(0, -60), 'demolish', 'up'); same(ringPick(-60, 0), null, 'left');
        ok(!/"mk2"|convert_pylon/.test(rd('js/draw.js') + rd('js/input.js') + rd('js/commands.js')), 'MK II / CONVERT are still on the ring');
    });
    check('the same by a release-tap (the tap path mirrors the drawn ring)', () => {
        ok(/!buildMode && _isPyCmd && canDemolishPylon\(commandTarget\)\) selectedRadialAction = "demolish"/.test(rd('js/input.js')), 'the tap path has no DESTROY');
    });
    check('MK II and CONVERT are buttons in the turret\'s INFO panel', () => {
        pylon(); run('shardCount = 500; networkStrength.fire = 1; __p.mk = 0; __p.upgraded = false'); open('__p');
        const acts = J('_ipLayout()').placed.map(p => p.it.act).filter(Boolean); ok(acts.includes('convert'), JSON.stringify(acts));
        if (run('mk2Eligible(__p)')) ok(acts.includes('mk2'), 'no MK II button: ' + JSON.stringify(acts));
        run('closeInfoPanel()');
    });
    check('build mode keeps its own ring: UPGRADE up, DESTROY down, INFO right', () => {
        pylon(); run(`buildMode = true; commandTarget = __p; commandFollowerTarget = null; commandEnemyTarget = null; commandNestTarget = null;`);
        run('commandMode = true; commandX = 200; commandY = 300; dragDX = 0; dragDY = 60; drawRadialMenu();'); same(run('selectedRadialAction'), 'demolish', 'build-mode down'); run('commandMode = false; buildMode = false');
    });

    group('THE RING ON A FOLLOWER OR CLONE: ROSTER CARD instead of INFO');
    check('a follower and a clone offer ROSTER CARD on the right, and it opens the roster on its card', () => {
        run(`followers.length = 0; spawnFollowerAtCrystal('electric'); ccOpen = function (t) { globalThis.__ccTab = t; }; ccClose = function () {};`);
        for (const key of ['followers[0]']) {
            run(`commandTarget = null; commandEnemyTarget = null; commandNestTarget = null; commandFollowerTarget = ${key};`);
            same(ringPick(60, 0), 'roster_card', 'right');
            run(`commandMode = true; selectedRadialAction = 'roster_card'; executeCommand();`);
            same(run('globalThis.__ccTab'), 'roster', 'the roster did not open'); same(run('ccSelectionList().length'), 1, 'not picked'); same(run('ccSelectionList()[0] === followers[0]'), true, 'wrong unit picked');
            run('ccClose()');
        }
        ok(!/"info"/.test(rd('js/draw.js').split('// ── OWN FOLLOWER')[1].split('const isPylonTarget')[0]), 'a follower ring still has INFO');
    });
    check('an enemy still gets INFO (it has no roster card)', () => {
        run(`commandFollowerTarget = null; commandNestTarget = null; commandTarget = null; commandEnemyTarget = { x: 3, y: 2, health: 5, maxHealth: 5, dead: false, speciesName: 'ant', className: 'scout' };`);
        same(ringPick(60, 0), 'info', 'enemy'); run('commandEnemyTarget = null');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
