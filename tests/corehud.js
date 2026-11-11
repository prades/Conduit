// THE CORE (js/corehud.js, js/coreframes.js, img/hud/core_<look>.png; build 2026-11-11t): your cube, tucked into the bottom-right corner on a tablet or a desktop (the corners layout).
// The owner, 2026-11-11: "Find a way to combine these 3 elements into a player model 3d emotive/reactive interactive for showing player damage/ shard count / player class interact
// abilities", "Make it tucked down at the bottom, right", and of the drafts (design/ui-mocks/core): "I like the drafts you created for the HUD player. Information interactive menu."
// It holds the three bars, the shards and ARMY SURGE (the top left's), GUARD and STUN (the round buttons by the dial) and the PACK (its lid); its screen is a face that reacts.
// The logic runs in the sandbox, the real page in the real browser (no Chromium: it says so and passes).
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
const pngSize = f => { const b = fs.readFileSync(path.join(ROOT, f)); return b.slice(1, 4).toString() === 'PNG' ? [b.readUInt32BE(16), b.readUInt32BE(20)] : null; };

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
// The real page, in the facility: THE CORE in its corner, the old parts hidden, the dock and the dial clear of it, the cube drawn, and its buttons doing what the old ones did.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); };
  var R = function(s){ var e = $(s); if (!e) return null; var b = e.getBoundingClientRect(), cs = getComputedStyle(e); return { l: Math.round(b.left), t: Math.round(b.top), r: Math.round(b.right), b: Math.round(b.bottom), shown: cs.display !== 'none' && b.width > 0 }; };
  var click = function(s){ var e = $(s); if (e) e.dispatchEvent(new MouseEvent('click', { bubbles: true })); return !!e; };
  var steps = function(n){ for (var i = 0; i < n; i++) _simStep(true); };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    facilityBlackoutSet(false); gameState.running = true; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; if (typeof dialogueClear === 'function') dialogueClear(); crystalMenuOpen = false;
    playerInv = { repair_kit: 2, ammo_pack: 1 }; shardCount = 1234; playerUltimate = 0; steps(60); await wait(400); steps(6);
    out.on = typeof coreOn === 'function' && coreOn(); out.body = document.body.className.indexOf('core-on') >= 0;
    out.core = R('#coreHud'); out.old = { shards: R('#shards'), ui: R('#ui'), ult: R('#ultWrap'), pack: R('#btnPack') }; out.dock = R('#topToggles'); out.mix = R('#mixTool'); out.vw = innerWidth; out.vh = innerHeight;
    var cv = $('#coreHud .core-cv'), g = cv && cv.getContext('2d'), d = g ? g.getImageData(0, 0, cv.width, cv.height).data : [], n = 0; for (var i = 3; i < d.length; i += 4 * 7) if (d[i] > 20) n++; out.drawn = n;
    out.words = { count: ($('#coreHud .core-count b') || {}).textContent, pack: ($('#coreHud .core-pack b') || {}).textContent, surge: ($('#coreHud .core-surge') || {}).textContent, cells: Array.prototype.map.call(document.querySelectorAll('#coreHud .core-cells i'), function(c){ return c.className; }).join() };
    out.tapGuard = [click('#coreHud .core-hg'), playerGuardOn]; click('#coreHud .core-hg'); out.tapGuard.push(playerGuardOn);
    out.tapStun = [click('#coreHud .core-hs'), playerDiveArmed]; if (typeof playerDiveCancel === 'function') playerDiveCancel(); playerDiveArmed = false;
    var sOn = siphonEnabled; click('#coreHud .core-siphon'); out.tapSiphon = [sOn, siphonEnabled]; if (siphonEnabled !== sOn) toggleSiphon();
    playerUltimate = PLAYER_ULT_MAX; steps(3); out.readyWord = ($('#coreHud .core-surge') || {}).textContent; click('#coreHud .core-hf'); out.surged = armySurgeTimer > 0; steps(3); out.surgeWord = ($('#coreHud .core-surge') || {}).textContent;
    click('#coreHud .core-pack'); out.packAtOnce = !!invPanelOpen; steps(14); out.packAfter = !!invPanelOpen; out.coreUnderPack = R('#coreHud').shown; if (invPanelOpen) invClose(); steps(2);
    var A = _tgAnchor(); out.dial = { y: A.y, R: A.R, corner: !!A.corner, coreTop: typeof coreTop === 'function' ? coreTop() : null };
  } catch (e) { out.err = String(e && e.stack || e).slice(0, 400); }
  var pre = document.createElement('pre'); pre.id = '__ch'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });<\/script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ch-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=20000', '--dump-dom', 'file://' + file + '?dev'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__ch">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; facilityPlayStart(); facilityBlackoutSet(false); innerWidth = 1180; innerHeight = 820;');
    // a step of THE CORE (the frame counts on): n times
    run('globalThis.__tick = n => { for (let i = 0; i < n; i++) { frame++; coreTick(); } };');

    group('THE PARTS');
    check('game.html loads its frames, then THE CORE (js/coreframes.js before js/corehud.js), after the round buttons\' file and before the dial\'s and the game\'s', () => {
        const order = scriptOrder(), at = f => order.indexOf(f);
        ok(at('js/coreframes.js') > 0 && at('js/coreframes.js') < at('js/corehud.js'), 'the frames come after THE CORE, or are not loaded');
        ok(at('js/playercombat.js') < at('js/corehud.js') && at('js/corehud.js') < at('js/targeting.js') && at('js/corehud.js') < at('js/game.js'), 'its place in the order');
    });
    check('its frames: the plain cube and each class\'s gear (the machine gun, the laser rifle, the mech, the coat), three each (shut, peeking, open), each a sheet on disk of three cells, with the points it draws to', () => {
        same(J('Object.keys(CORE_FRAMES.variants)').join(), 'plain,machinegun,laser,mech,labcoat', 'the looks'); same(J('CORE_FRAMES.frames').join(), 'shut,peek,open', 'the frames'); same(J('CORE_FRAMES.box').join(), '340,270', 'its box');
        for (const [id, v] of Object.entries(J('CORE_FRAMES.variants'))) {
            same(v.sheet, 'img/hud/core_' + id + '.png', id + ': its sheet'); const sz = pngSize(v.sheet); ok(sz, id + ': no PNG'); same(sz.join(), (v.cw * 3) + ',' + v.ch, id + ': the sheet is not three cells of its size');
            same(v.frames.length, 3, id + ': frames'); for (const k of ['face', 'centre', 'lid', 'vent', 'guardSock', 'stunSock', 'guard', 'stun', 'guardUp', 'arcC']) ok(v.frames[0][k], id + ': no ' + k);
            same(v.frames[0].face.length, 3, id + ': the screen\'s corners');
        }
        ok(J('Object.keys(IMG_MAP).filter(k => /^img\\/hud\\/core_/.test(k)).length') === 5, 'the sheets are not in js/imgmap.js (run node tools/images.js)');
        ok(/GENERATED by design\/hud\/bake-core\.js/.test(rd('js/coreframes.js')), 'js/coreframes.js does not say what made it');
    });
    check('it is on in the corners layout only (a tablet or a desktop in the facility), and then the old parts are hidden (game.html body.core-on), the dock stands beside it, it hides with the panels', () => {
        same(J('[coreOn(), (innerWidth = 600, coreOn()), (innerWidth = 1180, coreOn())]').join(), 'true,false,true', 'on at 1180, off at 600');
        const H = rd('game.html');
        ok(/body\.core-on #shards, body\.core-on #ui, body\.core-on #ultWrap, body\.core-on #btnPack \{ display: none !important; \}/.test(H), 'the old parts are not hidden');
        ok(/body\.placing #coreHud, body\.ccOpen #coreHud, body\.panel-open #coreHud \{ display: none !important; \}/.test(H), 'it does not hide with the panels and the roster');
        ok(/body\.core-on #topToggles \{ left: 14px; right: 352px;/.test(H), 'the dock is not beside it');
    });

    group('HOW IT REACTS (the agent\'s faces and times, provisional)');
    check('quiet as it comes on: the shards a save brings, a new game\'s bars, are not a reaction', () => {
        run('coreTick(); innerWidth = 600; frame++; coreTick(); innerWidth = 1180; health = PLAYER_HITS; shardCount = 100; frame++; coreTick(); shardCount = 5000; __tick(5);');
        same(J('[_core.react, _core.plusN]').join(), ',0', 'a reaction while it came on');
        run('__tick(60);');
    });
    check('a bar lost: HIT (it jolts, > < on a red flash), the bar marked lost; the last bar: angry red eyes and a cracked screen; a bar back: A BAR BACK (^ ^); a knockout: it topples, X eyes, then REBOOT, and the bars coming back is not A BAR BACK', () => {
        run('health = 2; __tick(1);'); same(J('[_core.react, _core.lost, _corePick(_coreS, frame).eye, _core.els.cells.map(c => c.className).join()]').join('|'), 'hit|3|squeeze|g,y, lost'.replace('g,y', 'y,y'), 'a bar lost');
        run('__tick(45); health = 1; __tick(45);'); same(J('[_corePick(_coreS, frame).eye, _corePick(_coreS, frame).crack, _core.els.cells.map(c => c.className).join()]').join('|'), 'angry|true|r,,', 'the last bar');
        run('health = 2; __tick(1);'); same(J('[_core.react, _core.gain, _corePick(_coreS, frame).eye]').join(), 'heal,2,happy', 'a bar back');
        run('__tick(80); coreKnocked(); health = PLAYER_HITS; __tick(1);'); same(J('[_core.react, _corePick(_coreS, frame).eye, !!_corePick(_coreS, frame).text]').join(), 'ko,x,false', 'knocked out');
        run('__tick(Math.ceil(CORE_HUD.ko * 0.6));'); same(J('[_core.react, _corePick(_coreS, frame).text]').join(), 'ko,REBOOT', 'rebooting'); run('__tick(CORE_HUD.ko);'); same(J('_core.react'), null, 'it does not come back');
    });
    check('shards in: SHARDS IN (^ ^, they fly into its lid, which peeks), the count with commas and +n; ARMY SURGE: gold diamonds when full, gold stars while it surges; STUN armed: lightning eyes; GUARD: a set look; the pack open: it looks up', () => {
        run('shardCount = 5859; __tick(CORE_HUD.shards + 2); shardCount += 40; __tick(1);'); same(J('[_core.react, _core.plusN, _core.els.num.textContent, _core.els.plus.textContent, _corePick(_coreS, frame).eye]').join('|'), 'shards|40|5,899|+40|happy', 'shards in');
        run('__tick(80); playerUltimate = PLAYER_ULT_MAX; __tick(1);'); same(J('[_corePick(_coreS, frame).eye, _core.els.surge.textContent, _core.root.className]').join('|'), 'diamond|TAP \u2014 ARMY SURGE|ready', 'surge ready');
        run('playerUltimate = 0; armySurgeTimer = 600; __tick(1);'); same(J('[_corePick(_coreS, frame).eye, _core.els.surge.textContent]').join('|'), 'star|SURGE 10 S', 'surging');
        run('armySurgeTimer = 0; playerDiveArmed = true; __tick(1);'); same(J('[_corePick(_coreS, frame).eye, _core.els.ls.textContent]').join('|'), 'bolt|PICK A TARGET', 'stun armed');
        run('playerDiveArmed = false; _pcDiveReady = frame + 120; __tick(1);'); same(J('[_coreS.rest > 0, _core.els.ls.textContent]').join('|'), 'true|2 S', 'stun resting');
        run('_pcDiveReady = 0; playerGuardOn = true; __tick(1);'); same(J('[_corePick(_coreS, frame).eye, _core.els.lg.textContent]').join('|'), 'set|GUARD ON', 'guard');
        run('playerGuardOn = false; invPanelOpen = true; __tick(1);'); same(J('_corePick(_coreS, frame).eye'), 'up', 'pack open'); run('invPanelOpen = false; __tick(1);');
    });
    check('its words: ULTIMATE n%, SIPHON OFF · n%, NO SQUAD IN RANGE · n%, TAP — ARMY SURGE, SURGE n S; the bars green, yellow, red as the old bar; PACK n is the kinds carried', () => {
        run('playerUltimate = PLAYER_ULT_MAX * 0.62; siphonEnabled = true; _siphonInRange = 2; __tick(1);'); same(J('_core.els.surge.textContent'), 'ULTIMATE 62%', 'filling');
        run('_siphonInRange = 0; __tick(1);'); same(J('_core.els.surge.textContent'), 'NO SQUAD IN RANGE \u00b7 62%', 'stalled');
        run('siphonEnabled = false; __tick(1);'); same(J('_core.els.surge.textContent'), 'SIPHON OFF \u00b7 62%', 'siphon off'); run('siphonEnabled = true; _siphonInRange = 2;');
        run('health = 3; __tick(90);'); same(J('_core.els.cells.map(c => c.className).join()'), 'g,g,g', 'three bars');
        run('playerInv = { repair_kit: 2, ammo_pack: 1, power_cell: 0 }; __tick(1);'); same(J('_core.els.packN.textContent'), '2', 'the kinds carried');
    });
    check('a tap on its lid (or its tag) flips the lid open and opens the pack a moment later (CORE_HUD.lidOpen frames: the open lid is seen before the pack covers the screen); a tap on its face when the surge is not full only makes it smile', () => {
        run('globalThis.__inv = 0; globalThis.__keepInv = invToggle; invToggle = () => { __inv++; }; _corePackTap(); __tick(1);');
        same(J('[__inv, _core.react]').join(), '0,lid', 'the pack opened at once, or the lid did not open');
        run('__tick(CORE_HUD.lidOpen);'); same(J('__inv'), 1, 'the pack did not open'); run('invToggle = __keepInv;');
        run('_coreReact("boop"); __tick(1);'); same(J('_corePick(_coreS, frame).eye'), 'happy', 'a tap on its face');
    });
    check('its look follows the class\'s gear (js/playergear.js playerGear: the mech, the coat, the gun in hand), else the plain cube; its trim takes the class\'s colour', () => {
        run('globalThis.__keepGear = playerGear; playerGear = () => "mech"; playerClassKey = "technomancer"; __tick(1);'); same(J('[_core.look, _core.art.sheet, _core.txt.col]').join(), 'mech,img/hud/core_mech.png,#31e8ff', 'the mech');
        run('playerGear = () => "nonsense"; playerClassKey = null; __tick(1);'); same(J('[_core.look, _core.txt.col]').join(), 'plain,#19e6c1', 'none'); run('playerGear = __keepGear;');
    });
    check('the dial stands above it (js/targeting.js _tgAnchor asks coreTop), and the round buttons are not drawn with it on (js/playercombat.js)', () => {
        const r = J('(function(){ const k = _core.topY; _core.topY = 500; const A = _tgAnchor(); _core.topY = k; return [A.corner, A.y + A.R <= 490]; })()'); same(r.join(), 'true,true', 'the dial is not above it');
        ok(/if \(typeof coreOn === "function" && coreOn\(\)\) return;/.test(rd('js/playercombat.js')), 'the round buttons are drawn under it');
        ok(/if \(typeof coreKnocked === "function"\) coreKnocked\(\);/.test(rd('js/game.js')) && /if \(typeof coreTick === "function"\) coreTick\(\);/.test(rd('js/game.js')), 'the game does not tick it or tell it of a knockout');
    });

    group('IN THE REAL PAGE (a real browser, at an iPad\'s sizes)');
    const bin = findChromium();
    if (!bin) { console.log('  (no Chromium here: the real page is not measured)'); }
    else for (const [w, h] of [[1180, 820], [1024, 768], [820, 1180]]) {
        const t = measure(w, h);
        await check(`${w}x${h}: THE CORE in the bottom-right corner, the old parts hidden, the dock and the squad's corner clear of it, the cube drawn, its words`, () => {
            ok(t && !t.err, 'the probe: ' + (t && t.err)); same(t.on, true, 'not on'); same(t.body, true, 'body.core-on'); ok(t.core && t.core.shown, 'not shown');
            ok(t.vw - t.core.r <= 8 && t.vh - t.core.b <= 8, 'not in the corner: ' + JSON.stringify(t.core));
            for (const k of ['shards', 'ui', 'ult', 'pack']) same(t.old[k] && t.old[k].shown, false, 'the old ' + k + ' is shown');
            ok(t.dock.r <= t.core.l, 'the dock runs under it: ' + JSON.stringify([t.dock, t.core])); ok(!(t.dock.l < t.mix.r && t.dock.t < t.mix.b - 1), 'the dock runs under the squad\'s corner: ' + JSON.stringify([t.dock, t.mix]));
            ok(t.drawn > 400, 'the cube is not drawn (' + t.drawn + ' pixels)');
            same(t.words.count, '1,234', 'the shards'); same(t.words.pack, '2', 'PACK n'); ok(/^ULTIMATE \d+%$/.test(t.words.surge), 'the surge: ' + t.words.surge); same(t.words.cells, 'g,g,g', 'the bars');
        });
        await check(`${w}x${h}: its buttons: GUARD up and down, STUN armed, the siphon off, ARMY SURGE when full (TAP — ARMY SURGE, then SURGE n S), the PACK a moment after its lid opens (and THE CORE hides under it); the dial above it`, () => {
            ok(t && !t.err, 'the probe');
            same(t.tapGuard.join(), 'true,true,false', 'GUARD'); same(t.tapStun.join(), 'true,true', 'STUN'); same(t.tapSiphon[0] !== t.tapSiphon[1], true, 'the siphon');
            same(t.readyWord, 'TAP — ARMY SURGE', 'full'); same(t.surged, true, 'the surge did not fire'); ok(/^SURGE \d+ S$/.test(t.surgeWord), 'surging: ' + t.surgeWord);
            same(t.packAtOnce, false, 'the pack opened before its lid'); same(t.packAfter, true, 'the pack did not open'); same(t.coreUnderPack, false, 'THE CORE shows over the pack');
            ok(t.dial.corner && t.dial.coreTop !== null && t.dial.y + t.dial.R <= t.dial.coreTop, 'the dial is not above it: ' + JSON.stringify(t.dial));
        });
    }

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
