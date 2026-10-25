// THE ATTRACT SCREEN (js/attract.js): the facility as the website's background. game.html?attract is the facility with nobody playing it: dim, quiet, evolved followers now and again walking the halls.
// Checked here: the flag and what it switches off (storage, save, tutorial, creatures, interface), the light, the searchers' routes, and the page that frames it (index.html), on the real page.
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

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
// The real page, opened as ?attract with the visitor's own saves in storage. The page's own loop does not run under the test browser's virtual time, so the frames are stepped by hand.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(function(){
  var out = {};
  try {
    out.mode = facilityMode(); out.loaded = facilitySaveLoad();
    facilityPlayStart();   // (the page's own timer may have done it already: it does nothing twice)
    gameState.running = true;
    out.rootClass = document.documentElement.classList.contains('attract'); out.bodyClass = document.body.classList.contains('attract');
    out.on = facilityPlay; out.at = !!_at; out.followers0 = followers.length; out.blackout = facilityBlackout(); out.dark = _fpDarkAmt(); out.gfx = gfxLow; out.zoom = viewZoom; out.hides = placingHidesUi();
    out.chip = !!document.getElementById('facilityPlayChip'); out.saveReady = _fp.saveReady; out.creatures = actors.filter(function(a){ return a.team === 'red'; }).length;
    out.cells = _at.cells.length; out.rooms = _at.byRoom.size; out.spots = _at.spots.length; out.forms = _at.forms.length;
    // the sheets: as if they had all arrived (they come over the network, one at a time, on the real page)
    for (var i = 0; i < _at.forms.length; i++) { var c = document.createElement('canvas'); c.width = c.height = 4; c.complete = true; c.naturalWidth = 144; _at.forms[i]._img = c; }
    _at.next = frame;
    var seenForms = {}, maxCrowd = 0, modes = {}, minDist = 1e9, maxDist = 0, camStart = [_at.cam.x, _at.cam.y], camMoved = 0, lightMin = 1, lightMax = 0, texts = 0, badLevel = 0, notEvolved = 0, inWall = 0, hostile = 0;
    for (var s = 0; s < 9000; s++) {
      _simStep(false);
      if (s % 20 !== 0) continue;
      maxCrowd = Math.max(maxCrowd, _at.crowd.length); texts = Math.max(texts, floatingTexts.length);
      for (var w of _at.crowd) {
        seenForms[w.form] = 1; modes[w.mode] = (modes[w.mode] || 0) + 1; if (w.f.level !== 10) badLevel++; if (!w.f.evolved) notEvolved++;
        if (!facilityWalkable(w.f.x, w.f.y, _fp.F)) inWall++;
        var d = Math.hypot(w.f.x - _at.cam.x, w.f.y - _at.cam.y); minDist = Math.min(minDist, d); maxDist = Math.max(maxDist, d);
      }
      camMoved = Math.max(camMoved, Math.hypot(_at.cam.x - camStart[0], _at.cam.y - camStart[1]));
      for (var r of _fp.F.rooms) { var v = _fpRoomLight(r.id); lightMin = Math.min(lightMin, v); lightMax = Math.max(lightMax, v); }
      hostile = Math.max(hostile, actors.filter(function(a){ return a.team === 'red'; }).length);
    }
    out.frames = frame; out.spawned = _at.spawned; out.searched = _at.searched; out.gone = _at.gone; out.maxCrowd = maxCrowd; out.forms2 = Object.keys(seenForms); out.modes = modes;
    out.followers1 = followers.length; out.actors1 = actors.length; out.camMoved = camMoved; out.lightMin = lightMin; out.lightMax = lightMax; out.texts = texts; out.badLevel = badLevel; out.notEvolved = notEvolved; out.inWall = inWall; out.hostile = hostile;
    out.minDist = minDist; out.maxDist = maxDist; out.playerOnCam = Math.hypot(player.x - _at.cam.x, player.y - _at.cam.y);
    out.fpSave = localStorage.getItem('conduit_fp_save'); out.modeKept = localStorage.getItem('conduit_mode'); out.classicKept = localStorage.getItem('tubecrawler_probe');
    localStorage.setItem('conduit_fp_save', 'changed'); out.writeBlocked = localStorage.getItem('conduit_fp_save') === 'visitor-save';
    out.keys = Object.keys(localStorage).filter(function(k){ return !/^(conduit_fp_save|conduit_mode|tubecrawler_probe)$/.test(k); });
  } catch (e) { out.error = String(e && e.stack || e).slice(0, 600); }
  var pre = document.createElement('pre'); pre.id = '__at'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2500); });</script></body>`;
function measure() {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'at-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/"><script>try { localStorage.setItem("conduit_fp_save", "visitor-save"); localStorage.setItem("conduit_mode", "classic"); localStorage.setItem("tubecrawler_probe", "visitor"); } catch (e) {}</script>').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1300,800', '--virtual-time-budget=60000', '--dump-dom', 'file://' + file + '?attract'], { encoding: 'utf8', timeout: 150000, maxBuffer: 1 << 28 }); } catch (e) { dom = (e.stdout && e.stdout.toString()) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__at">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));

    group('THE FLAG: ?attract, and nothing else, switches it on');
    check('attractOn follows the address, and the page opens the facility whatever game it last had, with no saved game', () => {
        run("window.location.search = ''"); same(run('attractOn()'), false, 'off by default');
        run("window.location.search = '?classic'"); same(run('attractOn()'), false, 'off for ?classic'); same(run('facilityMode()'), 'classic', 'classic still opens classic');
        run("window.location.search = '?attract'"); same(run('attractOn()'), true, 'on for ?attract'); same(run('facilityMode()'), 'facility', 'the facility');
        run("localStorage.setItem('conduit_mode', 'classic'); localStorage.setItem('conduit_fp_save', JSON.stringify({ v: FS.version, followers: [] }))");
        same(run('facilityMode()'), 'facility', 'a visitor who last played the classic game still sees the facility'); same(run('facilitySaveLoad()'), null, 'a visitor\'s saved game is not loaded');
        run("window.location.search = '?attract&classic'"); same(run('attractOn()'), true, 'on beside other flags');
        run("window.location.search = '?attractive'"); same(run('attractOn()'), false, 'a word that only begins with it is not it');
        run("window.location.search = ''"); same(run('facilityMode()'), 'classic', 'off again: the saved choice rules again'); same(run('facilitySaveLoad() !== null'), true, 'and the saved game loads again');
        run("localStorage.removeItem('conduit_mode'); localStorage.removeItem('conduit_fp_save')");
    });
    check('in ?attract the canvas interface is hidden, the build zoom is left alone, no chip is added, and the dark is the background\'s own', () => {
        run("window.location.search = '?attract'");
        same(run('placingHidesUi()'), true, 'no interface'); same(run('facilityBlackout()'), false, 'no blackout'); same(run('_fpDarkAmt()'), J('ATTRACT.dark'), 'its dark');
        run('viewZoom = 1.3; placingTick();'); same(run('viewZoom'), 1.3, 'placingTick leaves the zoom');
        run("window.location.search = ''");
        same(run('placingHidesUi()'), false, 'off: the interface is back'); same(run('_fpDarkAmt()'), 0.82, 'off: the ordinary dark'); run('viewZoom = 1;');
    });
    check('the frame pace: a frame is drawn at most every 30 ms when it is on, and always when it is off', () => {
        run("window.location.search = '?attract'; _atDrawAt = 0;");
        same(run('attractSkip(1000)'), false, 'the first is drawn'); same(run('attractSkip(1016)'), true, '16 ms later is skipped'); same(run('attractSkip(1029)'), true, '29 ms later is skipped'); same(run('attractSkip(1033)'), false, '33 ms is drawn');
        run("window.location.search = ''"); same(run('attractSkip(1034)'), false, 'off: never skipped');
    });

    group('THE HOOKS: each is guarded, and the page is built for it');
    check('every hook is behind attractOn, and the script is loaded before the save it overrides', () => {
        ok(/attractOn\(\)\) return "facility"/.test(rd('js/facilitysave.js')) && /attractOn\(\)\) return null/.test(rd('js/facilitysave.js')), 'the mode and the save');
        ok(/attractOn\(\)\) \{ attractTick\(\); return; \}/.test(rd('js/facilitytutorial.js')), 'the tick'); ok(/attractOn\(\)\) return;\s*\/\/ \(nothing is written over the picture\)/.test(rd('js/facilitytutorial.js')), 'the overlay');
        ok(/away \? attractRoomLight\(k, here\)/.test(rd('js/facilitystyle.js')) && /if \(away\) attractPools\(pools\)/.test(rd('js/facilitystyle.js')), 'the light');
        ok(/if \(!\(typeof attractOn === "function" && attractOn\(\)\)\) drawPlayer\(\{x:px,y:py\}\)/.test(rd('js/game.js')), 'the hidden player'); ok(/attractSkip\(now\)\) return;/.test(rd('js/game.js')), 'the pace'); ok(/maxPredators && !\(typeof attractOn === "function" && attractOn\(\)\)\) \{/.test(rd('js/game.js')), 'no zone creature');
        ok(/if \(away\) attractStart\(F\)/.test(rd('js/facilityplay.js')) && /_fp\.saveReady = !away/.test(rd('js/facilityplay.js')), 'the start and the save');
        ok(/const _bare = typeof attractOn === "function" && attractOn\(\)/.test(rd('js/draw.js')), 'no bar or name over a searcher');
        const order = require('./domstub.js').scriptOrder(); ok(order.indexOf('js/attract.js') > 0 && order.indexOf('js/attract.js') < order.indexOf('js/facilitysave.js'), 'attract.js comes before facilitysave.js');
    });
    check('game.html shows nothing but the picture in ?attract, from the first paint', () => {
        const h = rd('game.html'); ok(/<script>if \(\/\[\?&\]attract\\b\/\.test\(location\.search\)\) document\.documentElement\.className \+= " attract";<\/script>/.test(h.slice(0, h.indexOf('<style>'))), 'the class is set in the head, before any style');
        ok(/html\.attract body \{ visibility: hidden; \}/.test(h) && /html\.attract #cavernCanvas \{ visibility: visible; \}/.test(h), 'the rules: hide everything, show the canvas');
    });
    check('index.html frames it behind the page: no Three.js, an iframe that takes no clicks, loaded after the page, never for reduced motion or a data saver, faded in when told it is showing', () => {
        const h = rd('index.html');
        ok(!/three/i.test(h.replace(/Three\.js<\/strong>/, '')) && !/importmap/.test(h), 'the Stonehenge scene is gone'); ok(/game\.html\?attract/.test(h), 'the frame is game.html?attract');
        ok(/#bg \{[^}]*pointer-events: none/.test(h), 'no clicks'); ok(/aria-hidden/.test(h) && /inert = true/.test(h), 'hidden from assistive technology and the keyboard');
        ok(/prefers-reduced-motion: reduce/.test(h) && /saveData/.test(h), 'asks the visitor\'s settings'); ok(/addEventListener\('load'/.test(h) && /requestIdleCallback/.test(h), 'after the page has loaded');
        ok(/attract-ready/.test(h) && /e\.source === frame\.contentWindow/.test(h), 'only its own frame can say it is showing'); ok(/#bg\.ready iframe \{ opacity/.test(h), 'faded in');
        ok(/class="project-card featured" href="game\.html"/.test(h), 'the Conduit card still opens the game itself');
    });

    group('THE REAL PAGE: ?attract, stepped by hand for a hundred and fifty seconds of game');
    const r = measure();
    if (r === null) console.log('  (skipped: no Chromium found)');
    else {
        check('the page ran', () => { ok(r, 'the page did not report'); ok(!r.error, 'the page threw: ' + r.error); });
        if (r && !r.error) {
            check('it starts the facility whatever game the visitor last had, with the page\'s classes, no blackout, no squad, no creatures, no chip, LOW graphics, no interface', () => {
                same(r.mode, 'facility', 'the mode'); same(r.loaded, null, 'no saved game'); same(r.rootClass, true, 'the page class'); same(r.bodyClass, true, 'the body class'); same(r.on, true, 'the facility is on'); same(r.at, true, 'the background started');
                same(r.followers0, 0, 'nobody in the squad'); same(r.blackout, false, 'no blackout'); same(r.dark, 0.94, 'its dark'); same(r.gfx, true, 'LOW graphics'); ok(r.zoom >= 1 && r.zoom <= 1.6, 'a zoom of ' + r.zoom);
                same(r.hides, true, 'no interface'); same(r.chip, false, 'no chip'); same(r.saveReady, false, 'nothing is saved'); same(r.creatures, 0, 'no creature'); same(r.hostile, 0, 'none came'); same(r.texts, 0, 'no message over the picture');
            });
            check('it keeps NOTHING: the visitor\'s own saves and choice are as they were, and no key was written', () => {
                same(r.fpSave, 'visitor-save', 'the facility save'); same(r.modeKept, 'classic', 'the choice of game'); same(r.classicKept, 'visitor', 'the classic game\'s keys'); same(r.writeBlocked, true, 'a write is refused'); same(r.keys.length, 0, 'keys written: ' + r.keys.join());
            });
            check('there is somewhere to search: rooms, floor and props, and eleven forms to search it', () => { ok(r.rooms >= 8, r.rooms + ' rooms'); ok(r.cells >= 800, r.cells + ' cells'); ok(r.spots >= 100, r.spots + ' spots beside props'); same(r.forms, 11, 'the evolved forms (an ice mage has none yet)'); });
            check('searchers came, one after another, from out of sight and went (never more than the cap at once, never none left over), each an evolved follower of level 10, on the floor', () => {
                ok(r.frames > 8000, r.frames + ' frames'); ok(r.spawned >= 3, 'only ' + r.spawned + ' came'); ok(r.gone >= r.spawned - 2, r.gone + ' went of ' + r.spawned); ok(r.maxCrowd >= 1 && r.maxCrowd <= 2, 'at most ' + r.maxCrowd + ' at once');
                ok(r.followers1 <= 2, r.followers1 + ' followers left'); ok(r.actors1 <= 3, r.actors1 + ' actors left'); same(r.badLevel, 0, 'a searcher not at level 10'); same(r.notEvolved, 0, 'a searcher that was not evolved'); same(r.inWall, 0, 'a searcher in a wall');
                ok(r.forms2.length >= 2, 'only ' + r.forms2.join() + ' came');
            });
            check('they search: they stop in rooms (a stop in each), and walk between them', () => { ok(r.searched >= 5, r.searched + ' stops'); ok((r.modes.go || 0) > 0 && (r.modes.search || 0) > 0, JSON.stringify(r.modes)); ok((r.modes.leave || 0) > 0, 'one left: ' + JSON.stringify(r.modes)); });
            check('the camera goes round the halls on its own and follows them; the hidden player is the camera', () => { ok(r.camMoved > 6, 'the camera moved ' + r.camMoved.toFixed(1)); ok(r.minDist < 6, 'a searcher came within ' + r.minDist.toFixed(1) + ' of the camera'); ok(r.playerOnCam < 0.01, 'the player is where the camera is'); });
            check('it is dark: no room is ever lit to more than the camera\'s level, and most are near the least', () => { ok(r.lightMax <= 0.2, 'the brightest room ' + r.lightMax.toFixed(2)); ok(r.lightMin < 0.06, 'the dimmest ' + r.lightMin.toFixed(3)); });
        }
    }
    console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
