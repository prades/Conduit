// WHAT AN ADDRESS GETS: THE 3D VIEW AND CARD BATTLES ARE THE GAME (js/config.js enginePlan; js/view3d.js; js/cardbattle.js).
// ASKED (the owner, 2026-11-23): "I'd like to make the cards and the 3D the actual game now." Until then both sat behind switches (?engine=3d, and ?cards with it) and the plain address was
// the 2D game with its fights in real time.
// So: the plain address over the web (https) is the 3D view with card battles; ?engine=2d is the game as it was; what is spelled out in the address means what it meant; the website's
// background (?attract) and anything off the web (these tests, a file on disk) with no word in the address stay 2D. This suite holds:
//   the rule's answers for a table of addresses, and that the view and the card battles read them from the one place;
//   that the test cards (js/cards.js, ?cards) do not come with the players' game;
//   in a real browser, the players' game as it is spelled off the web (?engine=3d&battles=cards): it starts with no error, the view shows, a creature you choose starts a card battle, and
//   in a room the view has not built the fights are in real time; and ?engine=2d: nothing of the view is fetched and no battle starts.
const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..'), rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
// the game's page in a real browser (software WebGL), as tests/view3d.js runs it; its result is a hidden block
// (a page that leaves no result is run once more: under a full run's load the browser's clock can run out before the view is made, which is no fault of what is tested)
function realPage(query, post) { const r = onePage(query, post); return r && r.none ? onePage(query, post) : r; }
function onePage(query, post) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ep-')), file = path.join(dir, 'game.html'), prof = path.join(dir, 'profile');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => '<script>' + post + '</script></body>')); let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--window-size=1180,820', '--virtual-time-budget=60000', '--dump-dom', 'file://' + file + '?' + query], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 480000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__ep"[^>]*>([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : { none: true };
}

group('THE RULE (js/config.js enginePlan)');
const cfg = rd('js/config.js'), plan = (() => { const i = cfg.indexOf('function enginePlan('), j = cfg.indexOf('const ENGINE_PLAN'); return i > 0 && j > i ? new Function(cfg.slice(i, j) + '; return enginePlan;')() : null; })();
const T = (p, s) => { const r = plan(p, s); return (r.view3d ? '3d' : '2d') + '+' + (r.cards ? 'cards' : 'live'); };
check('the plain address over the web is the 3D view with card battles (and with ?dev, ?sewerdungeon or any word that is not the engine\'s)', () => {
    ok(plan, 'js/config.js has no enginePlan');
    for (const s of ['', '?dev', '?sewerdungeon', '?anydevice', '?lit=0.6', '?dev&sewerdungeon']) same(T('https:', s), '3d+cards', 'https ' + (s || '(plain)'));
    same(plan('https:', '').plain, true, 'the plain address is not marked as the players\' game');
});
check('?engine=2d is the game as it was, whatever else is said: 2D, its fights in real time (card battles need the view)', () => {
    for (const s of ['?engine=2d', '?dev&engine=2d', '?engine=2d&cards', '?engine=2d&battles=cards', '?cards&engine=2d']) for (const p of ['https:', 'file:', 'http:']) same(T(p, s), '2d+live', p + ' ' + s);
});
check('what is spelled out means what it meant: ?engine=3d alone is the view with its fights in real time; with ?cards, or ?battles=cards, card battles; ?battles=live turns them off', () => {
    for (const p of ['https:', 'file:', 'http:', '']) { same(T(p, '?engine=3d'), '3d+live', p + ' ?engine=3d'); same(T(p, '?engine=3d&cards'), '3d+cards', p + ' ?engine=3d&cards'); same(T(p, '?dev&engine=3d&battles=cards'), '3d+cards', p + ' battles=cards'); same(T(p, '?engine=3d&cards&battles=live'), '3d+live', p + ' battles=live over ?cards'); }
    same(T('https:', '?battles=live'), '3d+live', 'https ?battles=live'); same(T('https:', '?cards'), '3d+cards', 'https ?cards');
});
check('the website\'s background (?attract) keeps the 2D picture, over the web too; off the web (a file on disk, a local server, a test\'s stand-in with no protocol) the plain address is 2D as before', () => {
    same(T('https:', '?attract'), '2d+live', 'https ?attract'); same(T('https:', '?attract&dev'), '2d+live', 'https ?attract&dev');
    for (const p of ['file:', 'http:', '', undefined]) for (const s of ['', '?dev', '?cards', '?cards=all', '?fluxlab', '?battles=cards']) same(T(p, s), '2d+live', String(p) + ' ' + (s || '(plain)'));
    ok(/engine=3d(?!\w)/.test('?engine=3d') && T('https:', '?engine=3dx') === '3d+cards', 'a word that is not the engine\'s is not read as one');
});
check('THE LOW CAMERA (the owner, 2026-11-23: "B"; docs/VIEW-3D.md §8) is the game\'s camera since 2026-11-17dt (the owner, 2026-11-27: "make the low cam version of the game the full game"): the plain address over the web has it, ?cam=low names it with the 3D view anywhere, ?cam=iso is the camera as it was; ?engine=2d never has it', () => {
    for (const p of ['https:', 'file:', 'http:']) { same(plan(p, '?engine=3d&cam=low').cam, 'low', p + ' ?engine=3d&cam=low'); same(plan(p, '?engine=3d').cam, null, p + ' ?engine=3d'); same(plan(p, '?engine=2d&cam=low').cam, null, p + ' ?engine=2d&cam=low'); }
    same(plan('https:', '?cam=low').cam, 'low', 'https ?cam=low'); same(plan('https:', '').cam, 'low', 'the plain address'); same(plan('https:', '?cam=iso').cam, null, 'https ?cam=iso, the way back'); same(plan('https:', '?engine=3d&cam=iso').cam, null, '?engine=3d&cam=iso'); same(plan('file:', '?cam=low').cam, null, 'a file with no view'); same(plan('file:', '?engine=3d&cam=lowest').cam, null, 'a word that is not the switch'); same(plan('https:', '?attract').cam, null, 'the website\'s background');
    ok(/cam: typeof ENGINE_PLAN !== "undefined" && ENGINE_PLAN && ENGINE_PLAN\.cam === "low"/.test(rd('js/view3d.js')), 'js/view3d.js does not read the rule');
});
check('one place decides: the view\'s switch and the card battles\' are the rule\'s two answers, read from the page\'s own address; "the web" is https, as the page\'s send-on to play.html has it', () => {
    ok(/const ENGINE_PLAN = enginePlan\(typeof location !== "undefined" && location \? location\.protocol : "", typeof location !== "undefined" && location \? location\.search : ""\);/.test(cfg), 'ENGINE_PLAN is not made from the address');
    ok(/const VIEW3D_ON = ENGINE_PLAN\.view3d;/.test(cfg), 'VIEW3D_ON is not the rule\'s');
    ok(/on: typeof ENGINE_PLAN !== "undefined" && ENGINE_PLAN\.cards === true,/.test(rd('js/cardbattle.js')), 'the card battles do not read the rule');
    ok(!/location\.search/.test(rd('js/cardbattle.js').split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n')), 'js/cardbattle.js reads the address itself');
    ok(/protocol === "https:"/.test(cfg) && /location\.protocol === "https:"/.test(rd('game.html')), 'the two do not mean the same by "the web"');
});
check('the test cards (js/cards.js) come only with ?cards, as before: the players\' game brings none', () => {
    ok(/return \/\[\?&\]cards=all\\b\/\.test\(s\) \? "all" : \/\[\?&\]cards\\b\/\.test\(s\) \? "on" : "";/.test(rd('js/cards.js')), 'js/cards.js reads another switch');
    ok(!/ENGINE_PLAN/.test(rd('js/cards.js')), 'js/cards.js reads the engine\'s rule');
});

// THE PLAYERS' GAME, as it is spelled off the web. The frames no check looks at are not drawn (tests/view3ddry.js).
const PAGE = `window.__errs = []; window.addEventListener('error', function (e) { window.__errs.push(String(e.message)); });
(function wait(n) {
  var has3d = typeof VIEW3D !== 'undefined' && VIEW3D.on;
  var ready = typeof STARTUP !== 'undefined' && (STARTUP.state === 'done' || STARTUP.state === 'failed') && (!has3d || VIEW3D.state === 'ready' || VIEW3D.state === 'failed');
  if (!ready && n < 1200) return setTimeout(function () { wait(n + 1); }, 100);
  var out = { start: typeof STARTUP !== 'undefined' ? STARTUP.state : 'none', plan: typeof ENGINE_PLAN !== 'undefined' ? ENGINE_PLAN : null, view: typeof VIEW3D !== 'undefined' ? VIEW3D.state : 'none', error: typeof VIEW3D !== 'undefined' ? VIEW3D.error : null };
  try { facilityBlackoutSet(false); gameState.running = true; if (_fp.tut && _fp.tut.script) { _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; } if (typeof dialogueClear === 'function') dialogueClear();
    var V = VIEW3D.view, step = function (k) { for (var i = 0; i < k; i++) { if (V && V.dry) V.dry(i < k - 1); render(); } };
    out.fetched = Array.prototype.some.call(document.scripts, function (s) { return /three\\.min\\.js|dist\\/view3d\\.js/.test(s.src || ''); }); out.canvas3d = !!document.getElementById('view3dCanvas');
    out.testCards = typeof equipDev !== 'undefined' ? equipDev : 'none'; out.switch = CARD_BATTLE.on;
    step(3); out.showing = view3dShowing(); out.on = cardBattleOn(); out.room = (facilityRoomAt(player.x, player.y, _fp.F) || {}).id || null;
    var a = spawnCreature({ species: 'ant', className: 'worker', x: player.x + 2, y: player.y, level: 2, state: 'wander' });
    out.chose = cardBattleChoose(a); step(2); out.battle = cardBattleActive(); out.foes = typeof cardBattleFoes === 'function' ? cardBattleFoes().length : -1;
    if (out.battle && typeof cardBattleEnd === 'function') { cardBattleEnd(); step(2); } a.dead = true; a.deathProcessed = true; out.over = !cardBattleActive();
    // the rooms the view has not built: there the frame is the 2D game's and the fights are in real time
    out.rooms = _fp.F.rooms.length; out.unbuilt = V ? _fp.F.rooms.filter(function (r) { return !V.covers(r.id); }).map(function (r) { return r.id; }) : null;
    if (V && out.unbuilt.length) { var r = _fp.F.rooms.filter(function (q) { return q.id === out.unbuilt[0]; })[0], cx = (r.bb[0] + r.bb[2]) / 2, cy = (r.bb[1] + r.bb[3]) / 2, c = null, best = 1e9;
      for (var kv of _fp.cellsP) { var q = kv[1], rr = facilityRoomAt(q[0], q[1], _fp.F); if (rr && rr.id === r.id) { var d = Math.hypot(q[0] - cx, q[1] - cy); if (d < best) { best = d; c = q; } } }
      if (c) { player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1]; player.fpPath = null; step(2);
        out.there = { room: (facilityRoomAt(player.x, player.y, _fp.F) || {}).id, showing: view3dShowing(), on: cardBattleOn() }; } }
  } catch (e) { out.threw = String(e && e.stack || e).slice(0, 600); }
  out.errs = window.__errs.slice(0, 6); var pre = document.createElement('pre'); pre.id = '__ep'; pre.style.display = 'none'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
})(0);`;
const P = realPage('dev&engine=3d&battles=cards', PAGE);

group('IN A REAL BROWSER: THE PLAYERS\' GAME (?engine=3d&battles=cards, as the plain address is over the web)');
check('it starts: no error, the start done, the view made and showing in the room you begin in, the card battles on; no test card with it', () => {
    if (P === null) { console.log('       (no Chromium here: not run)'); return; }
    ok(!P.none, 'the page left no result'); same(P.threw || '', '', 'it threw'); same((P.errs || []).join(), '', 'page errors'); same(P.start, 'done', 'the start'); same(P.view, 'ready', 'the view (' + P.error + ')');
    same(JSON.stringify([P.plan.view3d, P.plan.cards]), '[true,true]', 'the rule\'s answers'); same(P.fetched && P.canvas3d, true, 'the view was not fetched or has no canvas'); same(P.showing, true, 'the view is not showing in ' + P.room);
    same(P.switch, true, 'the card battles\' switch'); same(P.on, true, 'card battles are not on'); same(P.testCards, '', 'the test cards came with it');
});
check('a creature you choose starts a card battle, with it in it; ended, it is over', () => {
    if (!P || P.none || P.threw) { console.log('       (not run)'); return; }
    same(P.chose, true, 'choosing it started nothing'); same(P.battle, true, 'no battle is on'); ok(P.foes >= 1, 'no creature is in the battle: ' + P.foes); same(P.over, true, 'it did not end');
});
check('in a room the view has not built the frame is the 2D game\'s and the fights are in real time, as before (the rooms it has not built are listed here)', () => {
    if (!P || P.none || P.threw) { console.log('       (not run)'); return; }
    console.log('       (' + (P.rooms - P.unbuilt.length) + ' of ' + P.rooms + ' rooms built in 3D; not built: ' + (P.unbuilt.join(', ') || 'none') + ')');
    if (!P.unbuilt.length) return; ok(P.there, 'no floor found in ' + P.unbuilt[0]); same(P.there.room, P.unbuilt[0], 'the cube is not in it'); same(P.there.showing, false, 'the view shows there'); same(P.there.on, false, 'card battles are on there');
});

const Q = realPage('dev&engine=2d', PAGE);
group('IN A REAL BROWSER: ?engine=2d, THE GAME AS IT WAS');
check('nothing of the 3D view is fetched or made, the game starts, and a creature you choose starts no battle', () => {
    if (Q === null) { console.log('       (no Chromium here: not run)'); return; }
    ok(!Q.none, 'the page left no result'); same((Q.errs || []).join(), '', 'page errors'); same(Q.start, 'done', 'the start'); same(JSON.stringify([Q.plan.view3d, Q.plan.cards]), '[false,false]', 'the rule\'s answers');
    same(Q.view, 'off', 'the view'); same(Q.fetched || Q.canvas3d, false, 'something of the view is in the page'); same(Q.switch, false, 'the card battles\' switch'); same(!!Q.showing, false, 'the view shows'); same(!!Q.chose || !!Q.battle, false, 'a battle started');
});

console.log(failures ? `\n${failures} FAILING` : '\nall passing');
process.exit(failures ? 1 : 0);
