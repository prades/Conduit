// THE LIVE 3D TEST ROOM (lab3d/; tools/lab3d.js; docs/STYLE-EVOLUTION.md §8). The owner, 2026-11-16, of the look they picked (round 2's CRYSTAL LAB 3D): "Live 3D test room":
// the Crystal Chamber running in real 3D in that look, on a separate page with a frame-rate readout, to try on both iPads. Then, having seen it run, all three of what was
// offered next: "Walk the lab floor", "A fight at the new pace", "A battle camera". Then, having tried those, two things to change (2026-11-16): its models were "squashed"
// at a battle's end (the agent's own way of showing one of yours at no health), and the camera went by itself to "action that happens across the map": "Just make it to
// where it's always near the player, and the player can change the angle of it".
//   THE PAGE      lab3d/ holds its page, its bundle, three.js r128 and three's licence; the page and the bundle belong together (the fingerprint); the tool can make them again
//   APART         it is a test page: the game, the players' page, the website and the game's scripts do not load it or link to it
//   IT RUNS       in a real browser (software WebGL): it starts with no error, frames are drawn, the picture is not blank, time moves, and it draws far fewer meshes than it built
//   OLD iPADS     the same with WebGL 1 (an iPad before iPadOS 15)
//   THE SWITCHES  the ink line and the shadows off: the room's second and third drawings are gone; SHARP: more pixels on a sharper screen
//   A FINGER      one finger turns the room (kept on the side the walls sink on), two fingers come nearer, a tap on the floor walks the cube there
//   THE FLOOR     the lab's eight rooms; the walls in front of the room you are in are down; the cube walks from room to room and the squad follows; the camera follows
//   THE FIGHT     waves of ants; every blow is marked on the floor for its whole wind-up before it lands; PACE is the speed of the fight's clock, and only while a fight is on
//   THE CAMERA    always on the cube, a little above the middle of the picture: in a fight, walking, wherever; nothing moves it but a finger and the CAMERA button (NEAR, FAR)
//   NO HEALTH     one of yours at no health is never flattened: a follower shrinks away and is back by the Crystal three seconds later, whole; the cube is set back there at once
//   A VISITOR     the page as a visitor opens it (no ?test) starts its own frames
// It is a SNAPSHOT of the models at the build it names: this suite does not fail when a model changes after it (node tools/lab3d.js brings it up to date).
// What no test here can say: how fast it is on an iPad, or whether a pace reads well. That is what the page is for.
const fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
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
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}

group('THE PAGE (lab3d/, made by tools/lab3d.js)');
check('lab3d/ holds the page, the bundle, three.js r128 as published and three\'s licence', () => {
    for (const f of ['lab3d/index.html', 'lab3d/lab3d.js', 'lab3d/three.min.js', 'lab3d/three.LICENSE.txt']) ok(fs.existsSync(path.join(ROOT, f)), f + ' is missing');
    const three = rd('lab3d/three.min.js'); ok(/Three\.js Authors/.test(three.slice(0, 200)) && /SPDX-License-Identifier: MIT/.test(three.slice(0, 200)), 'three.min.js has lost its licence line'); ok(/REVISION\s*=\s*"128"|="128"/.test(three.slice(0, 4000)), 'three.min.js is not r128 (the bakers\' version, which still draws on WebGL 1)');
    ok(/MIT License/.test(rd('lab3d/three.LICENSE.txt')), 'the licence file is not the MIT licence');
});
check('the page and the bundle belong together: the page asks for the bundle by its fingerprint, both name one build, both say they are generated', () => {
    const js = rd('lab3d/lab3d.js'), page = rd('lab3d/index.html'), hash = crypto.createHash('sha1').update(js).digest('hex').slice(0, 10);
    ok(page.includes('<script src="lab3d.js?v=' + hash + '">'), 'the page does not ask for this bundle (its fingerprint is ' + hash + '): node tools/lab3d.js');
    const b1 = (js.match(/the game at build (\d{4}-\d\d-\d\d[a-z]+)/) || [])[1], b2 = (page.match(/made from the game at build (\d{4}-\d\d-\d\d[a-z]+)/) || [])[1]; ok(b1 && b1 === b2, 'the bundle says build ' + b1 + ', the page ' + b2);
    ok(/^\/\/ GENERATED by tools\/lab3d\.js/.test(js) && /GENERATED by tools\/lab3d\.js/.test(page), 'one of them does not say it is generated'); ok(!/\{\{/.test(page), 'the page has a blank left unfilled');
    ok(/window\.__lab3d = function \(map, opts\)/.test(js) && /window\.__lab3dMap = \{/.test(js), 'the bundle has no room to start or no map');
    ok(/design\/style-evolution\/round2\/styles\.js/.test(js) && /design\/style-evolution\/live\/viewer\.js/.test(js) && /design\/props\/models\/crystalpad\.js/.test(js) && /design\/evolutions\/forms-core\.js/.test(js), 'the bundle lacks the look, the viewer, the props or the forms');
    ok(/design\/style-evolution\/live\/floor\.js/.test(js) && /design\/style-evolution\/live\/walk\.js/.test(js) && /"lab":\{"rooms":\[/.test(js), 'the bundle lacks the lab floor, its ways or its map');
});
check('the bundle is one script a browser can read, and the tool can make it again from today\'s sources', () => {
    new Function('window', 'THREE', rd('lab3d/lab3d.js'));
    const b = require(path.join(ROOT, 'tools/lab3d.js')).build(); new Function('window', 'THREE', b.js); ok(b.files.length > 40 && b.page.includes(b.hash), 'the tool made something else'); ok(/BUILDING THE ROOM/.test(b.page) && /not the game/.test(b.page), 'the page does not say what it is');
});

group('APART FROM THE GAME');
check('the game, the players\' page, the website and every script of the game: none loads or links the test room, or three.js', () => {
    const files = ['game.html', 'play.html', 'index.html', 'dist/conduit.js'].concat(fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f));
    for (const f of files) { const s = rd(f); ok(!/lab3d/i.test(s), f + ' names lab3d'); ok(!/three\.min\.js/.test(s), f + ' names three.min.js'); }
});

// the page in a real browser: ?test=N draws N frames at once (a tenth of a second apart on a clock of their own: a headless browser's frame clock runs at no steady rate) and leaves
// what it measured in a hidden block; `extra` is a script added to the page (a finger)
function run(query, o) {
    const bin = findChromium(); if (!bin) return null; o = o || {};
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'l3-')), tmp = path.join(dir, 'index.html');
    fs.writeFileSync(tmp, rd('lab3d/index.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/lab3d/">').replace(/<\/body>/i, () => (o.extra ? '<script>' + o.extra + '</script>' : '') + '</body>'));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--allow-file-access-from-files', '--window-size=' + (o.size || '1180,820'), '--force-device-scale-factor=' + (o.scale || 1), '--virtual-time-budget=20000', '--dump-dom', 'file://' + tmp + '?' + query], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 170000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const un = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'), out = {};
    const m = dom.match(/<pre id="lab3d-test" style="display: none;">([\s\S]*?)<\/pre>/); if (m) Object.assign(out, JSON.parse(un(m[1])));
    const f = dom.match(/<pre id="lab3d-finger" style="display: none;">([\s\S]*?)<\/pre>/); if (f) out.finger = JSON.parse(un(f[1]));
    out.wait = (dom.match(/id="wait"[^>]*style="([^"]*)"/) || [])[1] || ''; out.dom = dom; return m ? out : (out.none = true, out);
}
group('IT RUNS, in a real browser (software WebGL: its speed here says nothing of an iPad)');
const A = run('test=8');
if (A === null) console.log('  (no Chromium here: skipped)');
else {
    check('it starts with no error, eight frames are drawn, and the BUILDING sign is gone', () => {
        ok(!A.none, 'the page left no result (it did not start, or never drew its frames)'); same((A.errors || []).join(' | '), '', 'errors'); same(A.stats.frames, 8, 'frames'); ok(/display:\s*none/.test(A.wait), 'the BUILDING sign is still up');
        same(Math.round(A.stats.fps), 10, 'the readout\'s rate for frames a tenth of a second apart'); ok(/10<small>fps<\/small>/.test(A.dom) && /draws · \d+k triangles/.test(A.dom) && /WebGL 2/.test(A.dom), 'the readout on the page does not show them');
    });
    check('the picture is not blank, and time moves (the fight\'s clock runs, the crystal turns, the camera sways)', () => {
        ok(A.stats.colours >= 20, 'only ' + A.stats.colours + ' colours in 96 samples of the picture'); const a = A.stats.first, b = A.stats.last; ok(a && b, 'no first and last');
        ok(b[0] > a[0] + 0.3 && b[0] < 0.81, 'the clock did not run as the frames did (six of a tenth of a second): ' + a[0] + ' → ' + b[0]); ok(b[1] > a[1], 'the crystal did not turn'); ok(Math.abs(b[2] - a[2]) > 1e-5, 'the camera did not sway');
    });
    check('it is cheap to draw: the still things merged (under a sixth of the meshes it built), every solid its own colour for the ink line, three drawings of the lab floor in under 600 draws', () => {
        const s = A.stats; ok(s.meshesBefore > 5000, 'it built only ' + s.meshesBefore + ' meshes: is the lab floor all there?'); ok(s.meshesAfter < s.meshesBefore / 6, s.meshesAfter + ' meshes left of ' + s.meshesBefore);
        ok(s.solids >= 150, 'only ' + s.solids + ' solids have a colour of their own'); ok(s.draws > 60 && s.draws < 600, s.draws + ' draws a frame'); ok(s.tris > 100000 && s.tris < 1000000, s.tris + ' triangles a frame');
        same(s.webgl, 2, 'WebGL here'); same(s.depth, true, 'the ink line\'s depth'); same(s.w + 'x' + s.h, '1180x820', 'the picture\'s size (SHARP 1.5 on a screen of 1)');
    });
    check('THE FLOOR: the lab\'s eight rooms are built; it opens in the Crystal Chamber with the walls in front of it down, the squad round the cube, the raid not yet come', () => {
        const s = A.stats, m = s.sim; same(s.rooms, 8, 'rooms'); ok(s.wallPieces >= 8, 'only ' + s.wallPieces + ' pieces of wall that sink'); same(m.room, 'crystal_chamber', 'the cube\'s room'); same(m.wallsDown.join(' '), 'crystal_chamber', 'the walls that are down');
        same(m.squad.map(u => u[0]).join(' '), 'player ram crab star', 'the squad'); same(m.crystal, 400, 'the Crystal'); ok(/CRYSTAL CHAMBER/.test(A.dom) && /THE CRYSTAL/.test(A.dom) && /CAMERA<b>FAR<\/b>/.test(A.dom) && /PACE<b>×0\.6<\/b>/.test(A.dom) && /RAIDS<b>ON<\/b>/.test(A.dom), 'the page does not show the room\'s name, the Crystal\'s meter or the three buttons');
    });
    const G = run('test=6&gl=1');
    check('OLD iPADS: with WebGL 1 it starts with no error, draws its frames, and the picture is not blank', () => {
        ok(!G.none, 'no result'); same((G.errors || []).join(' | '), '', 'errors'); same(G.stats.webgl, 1, 'WebGL'); same(G.stats.frames, 6, 'frames'); ok(G.stats.colours >= 20, 'only ' + G.stats.colours + ' colours'); ok(G.stats.draws < 600, G.stats.draws + ' draws');
    });
    const P = run('test=6&ink=0&shadows=0');
    check('THE SWITCHES: the ink line and the shadows off, no error, and the room\'s second and third drawings are gone (under three quarters of the draws, under half the triangles)', () => {
        ok(!P.none, 'no result'); same((P.errors || []).join(' | '), '', 'errors'); same(P.state.ink, false, 'ink'); same(P.state.shadows, false, 'shadows'); ok(P.stats.draws < A.stats.draws * 0.75, P.stats.draws + ' draws against ' + A.stats.draws); ok(P.stats.tris < A.stats.tris / 2, P.stats.tris + ' triangles against ' + A.stats.tris); ok(P.stats.colours >= 20, 'blank');
    });
    const H = run('test=4&sharp=2', { scale: 2, size: '1024,768' }), L = run('test=4&sharp=1', { scale: 2, size: '1024,768' });
    check('SHARP: on a screen of 2 pixels a point, SHARP 2 draws 2048 × 1536 and SHARP 1 draws 1024 × 768, both with no error', () => {
        ok(!H.none && !L.none, 'no result'); same((H.errors || []).concat(L.errors || []).join(' | '), '', 'errors'); same(H.stats.w + 'x' + H.stats.h, '2048x1536', 'SHARP 2'); same(L.stats.w + 'x' + L.stats.h, '1024x768', 'SHARP 1');
    });
    const FINGER = `(function () { var n = 0, t = setInterval(function () { var api = window.__lab3dApi; if (!api) { if (++n > 400) clearInterval(t); return; } clearInterval(t);
      var c = document.getElementById('room'), ev = function (type, id, x, y) { c.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, bubbles: true, cancelable: true, pointerType: 'touch', isPrimary: id === 1 })); }, o = api.orbit, out = { start: [o.az, o.el, o.dist] };
      ev('pointerdown', 1, 640, 470); ev('pointermove', 1, 643, 472); ev('pointerup', 1, 643, 472); out.tap = api.snapshot(); out.tapTurned = [o.az, o.el, o.dist];   // (a tap: down and up in one place)
      ev('pointerdown', 1, 600, 400); ev('pointermove', 1, 520, 440); ev('pointerup', 1, 520, 440); out.turned = [o.az, o.el, o.dist]; out.dragWalk = api.snapshot().walking && false;
      ev('pointerdown', 1, 600, 400); ev('pointermove', 1, -4000, 400); ev('pointerup', 1, -4000, 400); out.far = [o.az, o.el, o.dist];
      ev('pointerdown', 1, 500, 400); ev('pointerdown', 2, 700, 400); ev('pointermove', 1, 500, 400); ev('pointermove', 2, 900, 400); ev('pointerup', 1, 500, 400); ev('pointerup', 2, 900, 400); out.near = [o.az, o.el, o.dist];
      document.getElementById('b-ink').click(); out.ink = api.state.ink; document.getElementById('b-sharp').click(); out.sharp = api.state.sharp; out.label = document.getElementById('b-ink').textContent + ' | ' + document.getElementById('b-sharp').textContent;
      var pre = document.createElement('pre'); pre.id = 'lab3d-finger'; pre.style.display = 'none'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre); }, 20); })();`;
    const F = run('test=6', { extra: FINGER });
    check('A FINGER: a tap on the floor walks the cube there and turns nothing; one finger turns the room and tilts it, never past the side the walls sink on; two fingers apart come nearer; the buttons switch and say so', () => {
        ok(!F.none && F.finger, 'no result'); same((F.errors || []).join(' | '), '', 'errors'); const f = F.finger;
        same(f.tap.walking, true, 'a tap did not set the cube walking'); same(f.tapTurned.join(), f.start.join(), 'a tap turned the room');
        ok(f.turned[0] < f.start[0] && f.turned[1] > f.start[1], 'a drag left and down did not take the room left and tilt it: ' + f.start + ' → ' + f.turned); same(f.turned[2], f.start[2], 'one finger changed the distance');
        same(f.far[0], 8, 'a long drag went past the side the walls sink on'); ok(f.near[2] < f.far[2], 'two fingers apart did not come nearer: ' + f.far[2] + ' → ' + f.near[2]);
        same(f.ink, false, 'the INK LINE button'); same(f.sharp, 2, 'the SHARP button'); same(f.label, 'INK LINEOFF | SHARP2×', 'what the buttons say');
    });
    // one page, played through by a script: time is run on with nothing drawn (api.run), so minutes of the raid and the walk take a second or two here
    const PLAY = `(function () { var n = 0, t = setInterval(function () { var api = window.__lab3dApi; if (!api) { if (++n > 400) clearInterval(t); return; } clearInterval(t); var out = {}, S = function () { return api.snapshot(); }, txt = function (id) { return document.getElementById(id).textContent; };
      try {
      api.run(2.6); out.fight = S();                                           // the first wave is at the chamber's door: a fight is on
      for (var q = 0; q < 300; q++) { api.run(0.05); var w0 = S(); if (w0.ants.some(function (a) { return a[5] === 'wind'; })) { api.step(0); out.wind = S(); break; } }   // an ant's bite on its way: drawn, its shape is on the floor
      var rate = function (pace) { api.set('pace', pace); for (var i = 0; i < 480; i++) { api.run(0.25); var a = S(); if (a.fight && Math.abs(a.scale - pace) < 0.02) { api.run(0.5); var b = S(); if (b.fight) return (b.t - a.t) / 0.5; } } return -1; };   // the fight's clock against the wall's, once a fight is on at that pace
      out.rate1 = rate(1); out.rate04 = rate(0.4); api.set('pace', 0.6);
      for (var i = 0; i < 400 && S().log.held < 1; i++) api.run(0.5); out.held = S(); out.heldPage = txt('raid');   // a whole raid: three waves, held
      api.run(4); out.calm = S();                                               // after it: no fight, the clock at the wall's speed
      api.set('raid', false); api.run(1); out.off = S(); out.offPage = txt('raid') + ' | ' + txt('b-raid');   // RAIDS OFF: the ants gone, everyone whole
      api.strike('ram', 999); api.step(0.1); out.fell = S(); out.fellPage = txt('back'); api.run(1); api.step(0); out.away = S(); api.run(2.2); api.step(0.4); out.back = S(); out.backPage = txt('back');   // one of yours at no health: away, and back by the Crystal
      api.set('cam', 'near'); api.run(3); out.near = S(); out.nearPage = txt('b-cam'); api.set('cam', 'far'); api.run(3); out.far = S();   // the CAMERA button: two angles, both on the cube
      out.walk0 = S(); out.go1 = api.walkTo([24.2, 23.1]); api.run(1); out.mid = S(); api.run(9); out.hall = S(); out.hallPage = txt('where');   // out of the chamber's east door, into the hallway
      out.go2 = api.walkTo([30, 29.2]); api.run(9); out.lounge = S(); out.go3 = api.walkTo([52, 22]); api.run(14); out.ware = S(); out.go4 = api.walkTo([3, 3]); out.go5 = api.walkTo([12.5, 31]); api.run(30); out.tele = S();
      api.strike('player', 999); api.step(0); out.ko = S(); out.koPage = txt('back') + ' | ' + txt('where'); api.run(5); out.koLater = S();   // the cube at no health: set back by the Crystal
      } catch (e) { out.error = String((e && e.stack) || e); }
      var pre = document.createElement('pre'); pre.id = 'lab3d-finger'; pre.style.display = 'none'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre); }, 20); })();`;
    const W = run('test=2', { extra: PLAY }), w = W.finger || {};
    const near = (a, b, d) => Math.hypot(a[0] - b[0], a[1] - b[1]) <= d;
    check('THE FIGHT: the ants come in waves and the squad holds them; every blow was marked on the floor for its whole wind-up before it landed', () => {
        ok(!W.none && W.finger, 'no result'); same((W.errors || []).join(' | '), '', 'errors'); same(w.error || '', '', 'the script');
        const f = w.fight; same(f.fight, true, 'a fight on at 3 s'); same(f.raid + ' ' + f.wave, 'wave 1', 'the raid'); ok(f.ants.length >= 2 && f.ants.every(a => a[4] === 1), 'the first wave is not at the door: ' + JSON.stringify(f.ants));
        ok(w.wind, 'no ant ever began a bite'); const rings = (4 + w.wind.ants.length) * 72; ok(w.wind.marksNow >= rings + 20, 'an ant\'s bite is on its way and nothing but the rings is on the floor (' + w.wind.marksNow + ' triangles; the rings are ' + rings + ')');
        const h = w.held; same(h.log.held, 1, 'raids held'); same(h.log.waves, 3, 'waves'); same(h.log.antsDown, 12, 'ants down (3 + 4 + 5)'); same(h.ants.length, 0, 'ants left'); ok(h.crystal > 0 && h.log.fell === 0, 'the Crystal fell'); ok(/THE RAID IS HELD/.test(w.heldPage), 'the page does not say the raid is held: ' + w.heldPage);
        ok(h.log.blows >= 30 && h.log.hits >= 30, 'only ' + h.log.blows + ' blows and ' + h.log.hits + ' hits in a whole raid'); ok(h.log.marks >= h.log.blows, h.log.blows + ' blows but ' + h.log.marks + ' marks');
        ok(h.log.minLead >= 0.199, 'a blow landed ' + h.log.minLead + ' s after its mark began: the shortest wind-up is 0.2 s (the game\'s 12 frames)');
    });
    check('PACE: while a fight is on the fight\'s clock runs at the pace (×1: the wall\'s; ×0.4: two fifths of it); with no fight on it runs at the wall\'s', () => {
        ok(Math.abs(w.rate1 - 1) < 0.03, 'at ×1 the fight\'s clock ran at ' + w.rate1); ok(Math.abs(w.rate04 - 0.4) < 0.03, 'at ×0.4 the fight\'s clock ran at ' + w.rate04);
        same(w.calm.fight, false, 'a fight on after the raid was held'); ok(w.calm.scale > 0.97, 'with no fight on the clock ran at ' + w.calm.scale);
    });
    // every state the script stopped in, by name
    const states = Object.keys(w).filter(k => w[k] && w[k].squad).map(k => [k, w[k]]);
    check('THE CAMERA is always on the cube, a little above the middle of the picture: in a fight, at a raid\'s end, walking, in every room; a fight does not move it; CAMERA swings it NEAR and FAR again', () => {
        ok(states.length >= 14, 'only ' + states.length + ' states to look at');
        for (const [k, st] of states) { const c = st.cam.cube; ok(Math.abs(c[0] - 0.5) < 0.05 && c[1] > 0.3 && c[1] < 0.45, 'at "' + k + '" the cube is at ' + c + ' of the picture (across, down)'); }
        same(w.fight.fight, true, 'a fight on'); same(w.fight.cam.el + ' ' + w.fight.cam.dist, '33 23', 'the camera\'s angle and distance in a fight, untouched'); same(w.held.cam.el + ' ' + w.held.cam.dist, '33 23', 'and at the raid\'s end');
        ok(w.near.cam.el < 26 && w.near.cam.dist < 13.5, 'NEAR: ' + JSON.stringify(w.near.cam)); same(w.nearPage, 'CAMERANEAR', 'what the button says'); ok(w.far.cam.el > 32.5 && w.far.cam.dist > 22.5, 'FAR again: ' + JSON.stringify(w.far.cam));
    });
    check('RAIDS OFF: the ants are gone and everyone is whole again', () => {
        same(w.off.raid, 'off', 'the raid'); same(w.off.ants.length, 0, 'ants'); same(w.off.crystal, 400, 'the Crystal'); ok(w.off.squad.every(u => u[4] === 0), 'someone is still away'); same(w.offPage, 'RAIDS ARE OFF | RAIDSOFF', 'what the page says');
    });
    check('NO HEALTH: no one is ever flattened; a follower at no health shrinks away, the page says when it is back, and it is back by the Crystal three seconds later, whole (the game\'s own way)', () => {
        for (const [k, st] of states) for (const u of st.squad) ok(u[5] === 1 || u[5] === 0, 'at "' + k + '" the ' + u[0] + ' is ' + u[5] + ' as tall as it is wide of its own shape (1: its own shape; 0: not drawn)');
        const ram = st => st.squad.find(u => u[0] === 'ram');
        same(ram(w.fell)[3] + ' ' + ram(w.fell)[4], '0 1', 'the Jelly Ram\'s health, and away, after the blow'); same(w.fellPage, 'JELLY RAM · BACK IN 3', 'what the page says'); same(ram(w.away)[4] + ' ' + ram(w.away)[5], '1 0', 'a second later: away, and not drawn');
        same(ram(w.back)[3] + ' ' + ram(w.back)[4] + ' ' + ram(w.back)[5], '220 0 1', 'after three seconds: its health, away, its shape'); ok(near([ram(w.back)[1], ram(w.back)[2]], [13.6, 20.2], 0.7), 'it came back at ' + ram(w.back).slice(1, 3) + ', not by the Crystal'); same(w.backPage, '', 'the page\'s line once it is back');
    });
    check('NO HEALTH, the cube: it is set back by the Crystal at once, whole, and the camera is on it there (the game\'s knockout)', () => {
        same(w.tele.room, 'teleport_room_1', 'where it was'); same(w.ko.room, 'crystal_chamber', 'where it is'); ok(near(w.ko.player, [12.6, 18.2], 0.7), 'it is at ' + w.ko.player); same(w.ko.squad[0][3] + ' ' + w.ko.squad[0][4] + ' ' + w.ko.walking, '100 0 false', 'its health, away, walking');
        same(w.ko.log.knockouts, 1, 'knockouts'); same(w.koPage, 'YOU ARE BACK AT THE CRYSTAL | CRYSTAL CHAMBER', 'what the page says'); same(w.ko.wallsDown.join(' '), 'crystal_chamber', 'the walls that are down');
        ok(w.koLater.squad.every(u => near([u[1], u[2]], w.koLater.player, 4.2)), 'the squad did not come back to it: ' + JSON.stringify(w.koLater.squad));
    });
    check('WALK THE FLOOR: the cube walks out of the chamber into the hallway, on to the Lounge, the Warehouse and Teleport Room 1; the squad comes with it; a place off the floor is no place to walk to', () => {
        same([w.go1, w.go2, w.go3, w.go4, w.go5].join(), 'true,true,true,false,true', 'which walks were taken'); same(w.walk0.room, 'crystal_chamber', 'where it set out from'); same(w.mid.walking, true, 'walking a second after');
        const at = (st, room, p) => { same(st.room, room, 'the room'); same(st.walking, false, 'still walking in ' + room); ok(near(st.player, p, 0.6), 'the cube is at ' + st.player + ', not ' + p); ok(st.squad.every(u => near([u[1], u[2]], st.player, 4.2)), 'the squad is not with it in ' + room + ': ' + JSON.stringify(st.squad)); };
        at(w.hall, 'lab_hallway', [24.2, 23.1]); at(w.lounge, 'lounge', [30, 29.2]); at(w.ware, 'show_room', [52, 22]); at(w.tele, 'teleport_room_1', [12.5, 31]); same(w.hallPage, 'HALLWAY', 'the room\'s name on the page');
    });
    check('THE WALLS: only those in front of the room the cube is in are down, room by room, a fight on or not', () => {
        const down = st => st.wallsDown.slice().sort().join(' ');
        same(down(w.fight), 'crystal_chamber', 'in the chamber, a fight at its door'); same(down(w.walk0), 'crystal_chamber', 'in the chamber'); ok(w.hall.wallsDown.length >= 1 && w.hall.wallsDown.every(k => k.split('|').includes('lab_hallway')), 'in the hallway: ' + down(w.hall)); same(down(w.lounge), 'lounge', 'in the Lounge');
        ok(w.ware.wallsDown.length >= 1 && w.ware.wallsDown.every(k => k.split('|').includes('show_room')), 'in the Warehouse: ' + down(w.ware)); ok(w.tele.wallsDown.length >= 1 && w.tele.wallsDown.every(k => k.split('|').includes('teleport_room_1')), 'in Teleport Room 1: ' + down(w.tele));
    });
    // the page as a visitor opens it: no ?test, so it starts its own frames (the tests above step theirs by hand, and would not notice if it could not)
    const VISIT = `(function () { var n = 0, t = setInterval(function () { var api = window.__lab3dApi, bad = window.__lab3dErrors && window.__lab3dErrors.length; if (!api && !bad) { if (++n > 600) clearInterval(t); return; } clearInterval(t); var out = { errors: (window.__lab3dErrors || []).slice() };
      try { if (api) { out.has = ['start', 'stop', 'step', 'run', 'set', 'walkTo', 'snapshot'].filter(function (k) { return typeof api[k] === 'function'; }).join(' '); api.stop(); api.step(0.1); api.step(0.1); out.draws = api.stats.draws; out.room = api.snapshot().room; api.start(); out.restarted = true; }
        out.wait = document.getElementById('wait').style.display; } catch (e) { out.errors.push(String((e && e.message) || e)); }
      var pre = document.createElement('pre'); pre.id = 'lab3d-finger'; pre.style.display = 'none'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre); }, 20); })();`;
    const V = run('', { extra: VISIT }), v = V.finger;
    check('A VISITOR: opened with nothing in its address the page starts its own frames with no error, and can be stopped, stepped and started again', () => {
        ok(v, 'the page left nothing'); same(v.errors.join(' | '), '', 'errors'); same(v.has, 'start stop step run set walkTo snapshot', 'what it can do'); same(v.wait, 'none', 'the BUILDING sign'); ok(v.draws > 60, v.draws + ' draws in a frame stepped by hand'); same(v.room, 'crystal_chamber', 'the cube\'s room'); same(v.restarted, true, 'started again');
    });
}
console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
