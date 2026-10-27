// THE INFO PANEL (js/infodex.js): the long-press ring's INFO, an index of everything in the facility with a description of each, in the layout style.
// ASKED: "make the info tab work again with the new menu. Make it an actual index of everything and give it a description. And get rid of the long hold press options that don't make sense, like switch."
// The panel opens on the READOUT of what was pressed (a follower, a clone or a creature: its live numbers, then a way into its entry), its INDEX has four tabs (ALLIES, ENEMIES, ELEMENTS, RULES), and
// every entry's numbers are read off the game's own constants. The ring offers only what means something: POSITION and INFO on the ground, ROSTER CARD (and RE-ROLL) on a follower, ATTACK and INFO
// on a creature. (The strip game's pages — pylons, power, nests, the work crew, the pylon codex — and its ring options went with it.)
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
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
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    ok(run('facilityPlay === true'), 'fixture: the page did not boot the facility');
    run(`gameState.running = true; facilityBlackoutSet(false); canvas.width = 390; canvas.height = 760;`);
    ok(run('followers.length') >= 1, 'fixture: the facility started with no followers');
    const open = (sub) => { run('globalThis.__sub = ' + (sub || 'null')); run(`openInfoPanel(null, __sub)`); };
    const openIndex = () => run('openInfoPanel(null, null); _ipGo("codex")');
    const tap = (x, y) => run(`_handleInfoPanelTap(${x}, ${y})`);
    const mid = r => [Math.round(r.x + r.w / 2), Math.round(r.y + r.h / 2)];
    const ENEMY = '{ x: 5, y: 2, health: 40, maxHealth: 60, dead: false, power: 18, moveSpeed: 0.02, speciesName: "ant", className: "scout", element: "fire", level: 3 }';

    group('THE INDEX: everything, each with a description');
    check('every entry has a name, a category, a one-line summary and a description; ids are unique', () => {
        const E = J('infoEntries()'), cats = J('INFO_CATS.map(c => c.id)');
        ok(E.length >= 15, 'only ' + E.length + ' entries');
        same(new Set(E.map(e => e.id)).size, E.length, 'duplicate ids');
        for (const e of E) { ok(e.name && e.sub && e.text.length && e.text.every(t => t.length > 20), e.id + ' is thin'); ok(cats.includes(e.cat), e.id + ' has category ' + e.cat); }
    });
    check('four tabs — ALLIES, ENEMIES, ELEMENTS, RULES — and every one has something in it; the elements tab lists the wheel and the six', () => {
        same(J('INFO_CATS.map(c => c.id)').join(), 'allies,foes,elements,rules', 'the tabs');
        const E = J('infoEntries()');
        for (const c of ['allies', 'foes', 'elements', 'rules']) ok(E.some(e => e.cat === c), c + ' is empty');
        openIndex(); run(`_infoCat = 'elements'`);
        let navs = 0; for (let n = 0; n < 8; n++) { run(`_infoPageNo = ${n}`); const L = J('_ipLayout()'); if (n >= L.pages) break; navs += L.placed.filter(p => p.it.k === 'nav').length; }   // (the list may run to a second page on a phone)
        same(navs, 7, 'the wheel and the six elements');
        for (const id of J('ELEMENTS.map(e => e.id)')) ok(E.some(e => e.id === 'el_' + id && e.cat === 'elements'), 'no entry for ' + id);
        run('closeInfoPanel(); _infoPageNo = 0');
    });
    check('the numbers in the descriptions are the game\'s own constants', () => {
        const rows = id => J(`infoEntry('${id}').rows`).map(r => r.join(' '));
        ok(rows('recruit').some(r => r.includes(run('RECRUIT_COST') + ' ◆')), 'the recruit price');
        ok(rows('squad').some(r => r.includes(run('PARTY.max') + ' at once')), 'the squad\'s size');
        ok(rows('evolution').some(r => r.includes('level ' + run('EVOLVE_LEVEL'))), 'the evolution level');
        ok(rows('clones').some(r => r === 'AT ONCE ' + run('cloneCap()')), 'the clone cap (the rule\'s: CLASS_RULES.clone)'); ok(rows('clones').some(r => r === 'WHO MUTATOR'), 'who grows them');
        ok(rows('gun').some(r => r.includes('within ' + run('TARGET.range') + ' tiles')), 'the gun\'s reach');
        ok(rows('alarm').some(r => r.includes(run('ALERT_DURATION / 60') + ' s')), 'how long an alarm lasts');
        ok(rows('relays').some(r => r === 'RELAYS ' + run('_fp.F.relays.length')), 'the relay count');
        ok(rows('crystal').some(r => r.includes(run('crystal.maxHealth') + ' HP')), 'the Crystal\'s health');
    });
    check('the element entries say what each beats and is beaten by, as the game plays it', () => {
        for (const id of J('ELEMENTS.map(e => e.id)')) {
            const rows = J(`infoEntry('el_${id}').rows`), beats = rows.find(r => r[0] === 'BEATS'), weak = rows.find(r => r[0] === 'WEAK TO');
            ok(beats && weak, id + ' has no matchups');
            ok(run(`getElementMultiplier(${JSON.stringify(id)}, ${JSON.stringify(beats[1].toLowerCase())})`) > 1, id + ' does not beat ' + beats[1]);
            ok(run(`getElementMultiplier(${JSON.stringify(weak[1].toLowerCase())}, ${JSON.stringify(id)})`) > 1, weak[1] + ' does not beat ' + id);
        }
    });
    check('nothing of the strip game is described: no pylons, zones, waves, nests or work crew in any entry', () => {
        const all = J('infoEntries()').map(e => e.name + ' ' + e.sub + ' ' + e.text.join(' ') + ' ' + e.rows.map(r => r.join(' ')).join(' ')).join(' ');
        for (const w of [/\bpylons?\b/i, /\bzones?\b/i, /\bwaves?\b/i, /\bnests?\b/i, /work crew/i, /BUILD (A|THE) (GENERATOR|CONNECTOR)/i]) ok(!w.test(all), 'an entry still mentions ' + w);
        same(run('typeof openPylonCodex'), 'undefined', 'the pylon codex is back');
    });

    group('THE PANEL: tabs, entries, back, close');
    check('the index opens on four tabs; a tab changes the list; an entry opens its page; BACK returns to the index', () => {
        openIndex();
        let L = J('_ipLayout()'); same(L.tabs.length, 4, 'tabs'); same(L.title, 'INDEX', 'title');
        const rules = L.tabs.find(t => t.id === 'rules'); tap(...mid(rules));
        same(run('_infoCat'), 'rules', 'tab');
        L = J('_ipLayout()'); const nav = L.placed.find(p => p.it.k === 'nav'); ok(nav && nav.it.page === 'e:crystal', 'first rules entry is ' + (nav && nav.it.page));
        tap(L.ix + 20, nav.y + 20);
        same(run('infoPanelPage'), 'e:crystal', 'page'); L = J('_ipLayout()');
        same(L.title, 'RULES', 'title is the category'); ok(L.placed.some(p => p.it.k === 'head' && p.it.t === 'THE CRYSTAL'), 'no name');
        const back = L.buttons.find(b => b.id === 'back'); tap(...mid(back)); same(run('infoPanelPage'), 'codex', 'back to the index');
        const close = J('_ipLayout()').buttons.find(b => b.id === 'close'); tap(...mid(close)); same(run('infoPanelOpen'), false, 'closed');
    });
    check('tapping outside the panel closes it', () => { openIndex(); tap(1, 1); same(run('infoPanelOpen'), false, 'closed'); });
    check('opened on nothing there is no readout to go back to, so the index has no BACK button', () => {
        openIndex(); ok(!J('_ipLayout()').buttons.some(b => b.id === 'back'), 'a back button with nowhere to go'); run('closeInfoPanel()');
    });
    check('a panel opened on the ground reads NOTHING HERE and its INDEX button turns to the index', () => {
        open('null'); let L = J('_ipLayout()'); same(L.title, 'NOTHING HERE', 'title'); ok(L.placed.some(p => p.it.k === 'text' && /open the INDEX/.test(p.it.t)), 'no hint');
        const idx = L.buttons.find(b => b.id === 'back'); ok(idx && /INDEX/.test(idx.label), 'no INDEX button: ' + JSON.stringify(L.buttons.map(b => b.label)));
        tap(...mid(idx)); same(run('infoPanelPage'), 'codex', 'the index'); run('closeInfoPanel()');
    });

    group('THE READOUT: what you pressed, then a way into its entry');
    check('a follower: its live numbers (level, element, personality, HP, stats, traits), ABOUT its kind and its element', () => {
        open('{ follower: followers[0] }');
        const L = J('_ipLayout()'); same(L.title, run('unitTypeLabel(followers[0])'), 'title');
        const keys = L.placed.filter(p => p.it.k === 'pair').map(p => p.it.a); for (const k of ['LEVEL', 'ELEMENT', 'PERSONALITY', 'HP', 'SPEED', 'ATK / DEF', 'COMBAT', 'NATURAL', 'PERK']) ok(keys.includes(k), k + ' missing');
        const navs = L.placed.filter(p => p.it.k === 'nav').map(p => p.it.page); ok(navs.includes('e:squad') && navs.includes('e:el_' + run('followers[0].element')), JSON.stringify(navs));
        same(run('infoEntryForSubject({ follower: followers[0] })'), 'squad', 'the entry of its kind');
        const about = L.placed.find(p => p.it.page === 'e:squad'); tap(L.ix + 20, about.y + 20); same(run('infoPanelPage'), 'e:squad', 'opened the entry');
        tap(...mid(J('_ipLayout()').buttons.find(b => b.id === 'back'))); same(run('infoPanelPage'), 'codex', 'back goes to the index');
        tap(...mid(J('_ipLayout()').buttons.find(b => b.id === 'back'))); same(run('infoPanelPage'), null, 'and back again to the readout');
        run('closeInfoPanel()');
    });
    check('a follower holding a room says which (HOLDS)', () => {
        run(`globalThis.__h = followers[0]; partyPost(__h, partyRoomOf(__h), true);`);
        open('{ follower: __h }'); const L = J('_ipLayout()'); const holds = L.placed.find(p => p.it.k === 'pair' && p.it.a === 'HOLDS'); ok(holds, 'no HOLDS row');
        same(holds.it.b, run('partyRoomName(__h.post).toUpperCase()'), 'the room'); run('closeInfoPanel(); partyCall(__h, true);');
    });
    check('a clone: its numbers, and ABOUT the clones', () => {
        run(`globalThis.__c = makeClone('ant', 'scout', crystal.x, crystal.y);`); ok(run('!!__c && __c.isClone'), 'no clone was made');
        open('{ follower: __c }'); const L = J('_ipLayout()'); ok(/ANT CLONE/.test(L.title), 'title ' + L.title);
        ok(L.placed.some(p => p.it.page === 'e:clones'), 'no way into the clones'); same(run('infoEntryForSubject({ follower: __c })'), 'clones', 'the entry');
        run('closeInfoPanel(); __c.dead = true; actors.splice(actors.indexOf(__c), 1);');
    });
    check('a creature: its level, element, HP, power and speed, ABOUT the creatures and its element', () => {
        open('{ enemy: ' + ENEMY + ' }');
        const L = J('_ipLayout()'); ok(/ANT SCOUT/.test(L.title), 'enemy title ' + L.title);
        ok(L.placed.some(p => p.it.k === 'pair' && p.it.a === 'HP' && p.it.b === '40 / 60'), 'enemy HP'); ok(L.placed.some(p => p.it.k === 'pair' && p.it.a === 'LEVEL' && p.it.b === '3'), 'enemy level');
        ok(L.placed.some(p => p.it.page === 'e:species'), 'no way into the creatures'); ok(L.placed.some(p => p.it.page === 'e:el_fire'), 'no way into its element');
        same(run('infoEntryForSubject({ enemy: __sub.enemy })'), 'species', 'the entry'); run('closeInfoPanel()');
    });
    check('INFO in the ring hands the panel the follower or creature that was pressed', () => {
        run(`commandMode = true; commandTarget = null; commandFollowerTarget = null; commandEnemyTarget = ${ENEMY}; selectedRadialAction = 'info'; executeCommand();`);
        ok(run('infoPanelOpen') && run('infoPanelSubject.enemy.speciesName') === 'ant', 'the enemy never reached the panel');
        run('closeInfoPanel()'); same(run('infoPanelSubject'), null, 'closing forgets the subject'); run('commandEnemyTarget = null');
        run(`commandMode = true; commandTarget = null; commandFollowerTarget = followers[0]; commandEnemyTarget = null; selectedRadialAction = 'info'; executeCommand();`);
        ok(run('infoPanelOpen') && run('infoPanelSubject.follower === followers[0]'), 'the follower never reached the panel'); run('closeInfoPanel(); commandFollowerTarget = null;');
    });

    group('IT FITS: every page inside the panel, long ones in pages');
    for (const [w, h] of [[390, 700], [900, 700], [360, 480]]) {
        check(`at ${w}x${h} every page keeps its rows and buttons inside the panel`, () => {
            run(`canvas.width = ${w}; canvas.height = ${h}`);
            const pages = ['codex', ...J('infoEntries().map(e => "e:" + e.id)')];
            for (const p of pages) {
                run(`openInfoPanel(null, null); _ipGo(${JSON.stringify(p)});`);
                for (let n = 0; n < 8; n++) {
                    run(`_infoPageNo = ${n}`);
                    const L2 = J('_ipLayout()'); if (n >= L2.pages) break;
                    ok(L2.px >= 0 && L2.px + L2.pw <= w, p + ' wider than the screen');
                    for (const q of L2.placed) ok(q.y >= L2.py + 50 && q.y + q.h <= L2.py + L2.ph - 60, `${p} p${n}: a row at ${q.y}+${q.h} outside ${L2.py}..${L2.py + L2.ph}`);
                    for (const b of L2.buttons) ok(b.x >= L2.px && b.x + b.w <= L2.px + L2.pw && b.y + b.h <= L2.py + L2.ph, p + ' button outside');
                    // the paragraphs are wrapped to the panel's width (an entry's one-line SUB under its name is not wrapped: it is fitted, below)
                    for (const q of L2.placed) if (q.it.k === 'text' && !(n === 0 && q === L2.placed[1] && p !== 'codex')) ok(q.it.t.length <= L2.chars + 1, `${p}: a line of ${q.it.t.length} chars over ${L2.chars}`);
                }
            }
            run('closeInfoPanel(); _infoPageNo = 0');
        });
    }
    check('an entry\'s one-line SUB is drawn fitted to the panel\'s width (uiCaptionFit), never clipped, however narrow the phone', () => {
        const src = rd('js/infodex.js');
        ok(/\{ k: "text", t: e\.sub\.toUpperCase\(\), c: "#7f93bd" \}/.test(src), 'the sub is not the second item of an entry page');
        ok(/else if \(it\.k === "text"\) uiCaptionFit\(it\.t, L\.ix, cy, it\.c \|\| "#c8d4f0", "left", 14, L\.iw\);/.test(src), 'a text line is not fitted to the panel');
    });
    check('a page that is too tall is split, and the middle button turns the pages round', () => {
        run('canvas.width = 360; canvas.height = 480; openInfoPanel(null, null); _ipGo("e:species")');
        let L = J('_ipLayout()'); ok(L.pages > 1, 'one page of ' + L.placed.length + ' rows'); const pg = L.buttons.find(b => b.id === 'page'); ok(pg, 'no page button');
        tap(...mid(pg)); same(J('_ipLayout()').page, 1, 'page 2'); for (let i = 1; i < L.pages; i++) tap(...mid(J('_ipLayout()').buttons.find(b => b.id === 'page'))); same(J('_ipLayout()').page, 0, 'wraps to page 1');
        run('closeInfoPanel(); canvas.width = 390; canvas.height = 760');
    });
    check('it draws without throwing (the readout, the index, an entry), in the layout style', () => {
        run('openInfoPanel(null, { follower: followers[0] }); drawInfoPanel(); _ipGo("codex"); drawInfoPanel(); _ipGo("e:relays"); drawInfoPanel(); _ipGo(null); closeInfoPanel();');
        ok(/function drawInfoPanel/.test(rd('js/infodex.js')), 'no info panel');
        ok(!/font = "\d+px monospace"/.test(rd('js/infodex.js')), 'small monospace type');
    });

    group('THE RING: only options that mean something');
    const ringPick = (dx, dy) => { run(`commandMode = true; commandX = 200; commandY = 300; dragDX = ${dx}; dragDY = ${dy}; drawRadialMenu();`); const a = run('selectedRadialAction'); run('commandMode = false'); return a; };
    check('no SWITCH, no generator or pylon options: the catch-alls are gone from the ring, the tap path and the commands', () => {
        const src = rd('js/draw.js') + rd('js/input.js') + rd('js/commands.js');
        ok(!/switch_context|convert_pylon|"mk2"|"demolish"|"reconstruct"/.test(src), 'a strip-game option is still wired up');
        ok(!/"SWITCH"|TURN O(N|FF)|(OPEN|CLOSE) CIRCUIT|"RECLAIM"|"DESTROY"/.test(rd('js/draw.js')), 'a strip-game label is still drawn');
    });
    check('on the ground: POSITION below, INFO on the right, nothing above or on the left', () => {
        run(`commandTarget = { x: 1, y: 1 }; commandFollowerTarget = null; commandEnemyTarget = null;`);
        same(ringPick(0, 60), 'position', 'down'); same(ringPick(60, 0), 'info', 'right'); same(ringPick(0, -60), null, 'up'); same(ringPick(-60, 0), null, 'left');
        run('commandTarget = null');
    });
    check('the same by a release-tap (the tap path mirrors the drawn ring)', () => {
        const I = rd('js/input.js');
        ok(/relAngle >  Math\.PI\/4 && relAngle <  3\*Math\.PI\/4\) selectedRadialAction = "position";\s*\n\s*else if \(relAngle > -Math\.PI\/4 && relAngle <  Math\.PI\/4\) selectedRadialAction = "info";\s*\n\s*else\s+selectedRadialAction = null;/.test(I), 'the ground\'s tap path is not POSITION / INFO / nothing');
        ok(/if \(relAngle > -Math\.PI\/4 && relAngle < Math\.PI\/4\) selectedRadialAction = "roster_card";\s*\n\s*else if \(Math\.abs\(relAngle\) > Math\.PI\*3\/4 && canRerollFollower\(_f\)\) selectedRadialAction = "reroll_follower";/.test(I), 'the follower\'s tap path is not ROSTER CARD / RE-ROLL');
    });
    check('your follower or clone: ROSTER CARD on the right, which opens the roster on its card; RE-ROLL on the left for a follower, nothing there for a clone', () => {
        run(`ccOpen = function () { globalThis.__ccOpened = (globalThis.__ccOpened || 0) + 1; }; ccClose = function () {}; globalThis.__c = makeClone('ant', 'scout', crystal.x, crystal.y);`);
        for (const key of ['followers[0]', '__c']) {
            run(`commandTarget = null; commandEnemyTarget = null; commandFollowerTarget = ${key}; __ccOpened = 0; ccClearSelection();`);
            same(ringPick(60, 0), 'roster_card', 'right on ' + key); same(ringPick(0, 60), null, 'down on ' + key); same(ringPick(0, -60), null, 'up on ' + key);
            same(ringPick(-60, 0), key === '__c' ? null : 'reroll_follower', 'left on ' + key);
            run(`commandMode = true; selectedRadialAction = 'roster_card'; executeCommand();`);
            same(run('__ccOpened'), 1, 'the roster did not open for ' + key); same(run('ccSelectionList().length'), 1, 'not picked'); same(run(`ccSelectionList()[0] === ${key}`), true, 'wrong unit picked');
            same(run(`ccFocusUnit() === ${key}`), true, 'the carousel is not on its card');
            run('ccClose(); ccClearSelection();');
        }
        ok(!/"INFO"/.test(rd('js/draw.js').split('// ── YOUR FOLLOWER OR CLONE')[1].split('// ── THE GROUND')[0]), 'a follower ring still has INFO');
        run('__c.dead = true; actors.splice(actors.indexOf(__c), 1); commandFollowerTarget = null;');
    });
    check('a creature: ATTACK (or STOW) above and INFO on the right, nothing below or on the left', () => {
        run(`commandFollowerTarget = null; commandTarget = null; commandEnemyTarget = ${ENEMY}; playerAttackMode = false;`);
        same(ringPick(0, -60), 'attack_mode', 'up'); same(ringPick(60, 0), 'info', 'right'); same(ringPick(0, 60), null, 'down'); same(ringPick(-60, 0), null, 'left');
        run('playerAttackMode = true'); same(ringPick(0, -60), 'stow_weapon', 'up, with the gun out'); run('playerAttackMode = false; commandEnemyTarget = null');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
