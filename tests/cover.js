// COVER, WALLS AND SIGHT: the next development phase's Milestone Two (build 2026-11-06h; docs/FLUX-MOVEMENT.md §13, docs/COMBAT.md "Walls, cover and sight", docs/NEXT-PHASE-ROADMAP.md)
// ASKED (the owner, 2026-11-06, docs/DECISION-LOG.md): cover "Stops shots"; what gives it: "Barriers", "Crates and stacks", "Barrels", "Desks and consoles" (the desks, the consoles, the lab benches);
// "Walls stop shots"; "See over low ones"; "Shoot over own cover" (within about a tile of the shooter); stepping over cover: "Not yet"; tall objects: "Yes, they stop shots".
// The code: js/facility.js (FAC_COVER, FAC_LOW: the traits; facilitySees: sight; facilityShotStop, facilityShotReach: a shot's step and a beam's reach), js/facilityplay.js (the same in play), js/game.js (a shot in
// flight stops there, with a spark), js/weapons.js (the laser's beam); and the shooters, each firing only at what it can see or with a clear shot: js/npc.js (a Mage), js/evolution.js (QUILL BURST, HEXFIRE),
// js/predator.js (a creature's rear shot), js/stations.js (a turret). Build 2026-11-06i: the moves that strike at once need sight too (the owner: "Need sight"; js/evolution.js _evoFoesSeen, fieldBite,
// staticVortexTick; js/cards.js _equipFoesNear), and SONIC ROLL dashes only along floor it could walk. What is a reading (which kinds are low, glass, the spark, lobs and the attacks that strike at once, the shooters, the 1.0 tile, the middle
// heights, a tall object nobody's own cover): docs/OPEN-QUESTIONS.md §1x.
// The rules on the Flux test room's objects (?fluxlab: crates, a barrel, barriers, a generator, consoles, a desk: the roadmap's "Object that provides cover") and on the main map's walls, glass, doorways and low
// objects; the shots fired the game's own way and moved by its own loop (render); the real page at ?fluxlab on a tablet (no Chromium: it says so and passes).
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
// THE REAL PAGE at game.html?fluxlab: an ant behind the test room's desk; the player's round from three tiles off (stopped at the desk, a spark drawn), from right behind the desk (it hits); the laser from three
// tiles off (its beam stops at the desk); the frames drawn with the spark and the beam in them, and no errors.
const SCRIPT = `<script>window.__errs = []; window.addEventListener('error', function(e){ window.__errs.push(String(e.message)); });
window.addEventListener('load', function(){ setTimeout(function(){
  var out = {}, step = function(n){ for (var i = 0; i < n; i++) render(); };
  try {
    gameState.running = true; if (typeof dialogueClear === 'function') dialogueClear(); step(2);
    var F = _fp.F, T = function(p){ return fluxLabTile(F, p); }, put = function(p){ var t = T(p); player.x = player.targetX = player.visualX = t[0]; player.y = player.targetY = player.visualY = t[1]; player.fpPath = null; };
    actors = actors.filter(function(a){ return !(a instanceof Predator); }); followers.forEach(function(f){ f.stance = 'hold'; var t = T([1, 11]); f.x = t[0]; f.y = t[1]; });
    var at = T([11, 8]), ant = spawnCreature({ species: 'ant', className: 'scout', x: at[0], y: at[1], level: 3, state: 'wander' }); ant.x = at[0]; ant.y = at[1]; ant.update = function(){}; ant.health = ant.maxHealth = 5000;
    var edge = T([11, 5.5])[1], spark = function(){ return elementEffects.filter(function(e){ return e.type === 'impact' && Math.abs(e.y - edge) < 0.4; }).length; };
    playerAmmo = 20; player.attackCooldown = 0; put([11, 3]); step(1); firePlayerShot(ant); var drawn = 0; for (var i = 0; i < 60 && followerProjectiles.length; i++) { step(1); if (spark()) drawn++; }
    out.far = { hp: ant.health, spark: drawn > 0, left: followerProjectiles.length };
    elementEffects.length = 0; put([11, 5]); step(1); player.attackCooldown = 0; firePlayerShot(ant); for (var j = 0; j < 60 && followerProjectiles.length; j++) step(1);
    out.near = { hp: ant.health };
    ant.health = 5000; weaponOwned.laser = true; playerWeapon = 'laser'; laserCharge = 12; player.attackCooldown = 0; put([11, 3]); step(1); out.laserFired = fireLaserShot(ant); var b = _fp.beams[_fp.beams.length - 1]; step(3);
    out.laser = { hp: ant.health, end: b ? Math.abs(b.y1 - edge) : null, spark: spark() > 0 };
  } catch (err) { out.err = String(err && err.stack || err); }
  out.errs = window.__errs.slice(0, 3);
  var pre = document.createElement('pre'); pre.id = '__cv'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cv-')), file = path.join(dir, 'game.html'), prof = path.join(dir, 'profile');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--window-size=' + w + ',' + h, '--virtual-time-budget=30000', '--dump-dom', 'file://' + file + '?fluxlab'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 180000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__cv">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

async function boot(search) {
    const sb = makeBrowserSandbox({}); sb.location.search = search || '';
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860; innerWidth = 1100;
        if (typeof dialogueClear === 'function') dialogueClear(); classPickerOpen = false;
        globalThis.__T = p => fluxLabTile(_fp.F, p);
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__wild = () => { actors = actors.filter(a => !(a instanceof Predator)); followerProjectiles = []; elementEffects.length = 0; _ucolsFrame = -1; };
        globalThis.__ant = (x, y, sp, cls) => { const e = spawnCreature({ species: sp || 'ant', className: cls || 'scout', x, y, level: 3, state: 'wander' }); e.x = x; e.y = y; e.update = () => {}; e.health = e.maxHealth = 5000; e.spawnProtection = 0; _ucolsFrame = -1; return e; };
        globalThis.__bench = () => { const t = __T([1, 11]); followers.forEach(f => { f.stance = 'hold'; f.post = null; f.x = t[0]; f.y = t[1]; }); };   // (the squad out of the way, holding: it neither moves nor fights)
        // a shot's path, a step of a shot's speed at a time, fired at (ox, oy) (its start, unless given): what stops it ('wall', the solid's id, or 'through') and where
        globalThis.__line = (x0, y0, x1, y1, ox, oy) => { if (ox === undefined) { ox = x0; oy = y0; } const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.18));
            for (let i = 0; i < n; i++) { const s = facilityShotStop(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, x0 + (x1 - x0) * (i + 1) / n, y0 + (y1 - y0) * (i + 1) / n, ox, oy, _fp.F); if (s) return s.wall ? 'wall' : s.solid.id; }
            return 'through'; };
        globalThis.__L = (a, b, o) => { const p = __T(a), q = __T(b), r = o ? __T(o) : p; return __line(p[0], p[1], q[0], q[1], r[0], r[1]); };
        globalThis.__fly = (n) => { for (let i = 0; i < (n || 120) && followerProjectiles.length; i++) render(); return followerProjectiles.length; };
        globalThis.__sparks = () => elementEffects.filter(e => e.type === 'impact');
        // the two ends of a short line straight across a wall piece's middle, each a tile's floor a body can stand on, with nothing else on the line (k: how far out each end is)
        // (tried at points along the piece, its middle first: furniture stands against many walls)
        globalThis.__across = (w, ks) => { const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]), nx = -(w.b[1] - w.a[1]) / L, ny = (w.b[0] - w.a[0]) / L;
            for (const t of [0.5, 0.35, 0.65, 0.2, 0.8, 0.1, 0.9]) for (const k of ks) { const m = [w.a[0] + (w.b[0] - w.a[0]) * t, w.a[1] + (w.b[1] - w.a[1]) * t], p = [m[0] - nx * k, m[1] - ny * k], q = [m[0] + nx * k, m[1] + ny * k];
                if (!facilityWalkable(p[0], p[1], _fp.F) || !facilityWalkable(q[0], q[1], _fp.F)) continue; let clear = true;
                for (let i = 0; i <= 40 && clear; i++) if (facilitySolidAt(p[0] + (q[0] - p[0]) * i / 40, p[1] + (q[1] - p[1]) * i / 40, _fp.F)) clear = false;
                if (clear) return { p, q, m }; }
            return null; };`);
    return { run, J };
}

(async () => {
    const { run, J } = await boot('?fluxlab');
    run('__bench(); __wild();');

    group('WHAT EACH KIND OF OBJECT DOES (js/facility.js FAC_COVER, FAC_LOW)');
    check('COVER is the owner\'s four answers: barriers, crates and crate stacks, barrels, desks (the desk, the computer desks, the reception desk), consoles and lab benches; every solid of the map carries its kind\'s two traits (and its planning copy); the main map\'s 42 cover objects (34 seen over, the 3 crate stacks and 5 consoles too high), 17 low objects that give no cover, every other one tall', () => {
        const r = J(`(function(){ const F = _fp.F, P = _fp.P, o = {}, main = F.solids.filter(s => s.room !== 'flux_lab'), t = s => s.cover === FAC_COVER.has(s.kind) && s.low === FAC_LOW.has(s.kind);
            o.cover = [...FAC_COVER].sort().join(); o.every = F.solids.every(t) && P.solids.every(t);
            o.n = main.length; o.nCover = main.filter(s => s.cover).length; o.nSeen = main.filter(s => s.cover && s.low).length; o.nLow = main.filter(s => s.low && !s.cover).length; o.nTall = main.filter(s => !s.low && !s.cover).length;
            o.middle = [...new Set(main.filter(s => s.cover && !s.low).map(s => s.kind))].sort().join(); o.lowKinds = [...new Set(main.filter(s => s.low && !s.cover).map(s => s.kind))].sort().join();
            o.tallSome = ['generator', 'locker', 'vending', 'teleporter', 'rubble', 'server_rack', 'tank'].every(k => main.some(s => s.kind === k && !s.low && !s.cover)); return o; })()`);
        same(r.cover, 'barrel,barrier,computer_desk,console,crate,crate_stack,desk,lab_bench,pump,reception_desk,valve', 'what gives cover'); same(r.every, true, 'a solid without its kind\'s traits');
        same(r.n + ':' + r.nCover + ':' + r.nSeen + ':' + r.nLow + ':' + r.nTall, '172:49:41:16:107', 'the counts (solids : cover : cover seen over : low without cover : tall; the sample bank\'s rock fall, 2026-11-07, one more tall solid)');
        same(r.middle, 'console,crate_stack', 'cover too high to see over'); same(r.lowKinds, 'cart,couch,gate,pool,river,sentry,table', 'low objects that give no cover'); same(r.tallSome, true, 'a tall kind');
    });
    check('THE TEST ROOM HAS ITS OBJECT THAT GIVES COVER (the roadmap\'s room, docs/NEXT-PHASE-ROADMAP.md §3.5): its two crates, barrel and two barriers (that move) and its desk give cover and are seen over, its two consoles give cover and are not, its generator gives none and is tall', () => {
        const r = J(`_fp.F.solids.filter(s => s.room === 'flux_lab').map(s => s.id + ':' + (s.cover ? 'C' : '-') + (s.low ? 'L' : '-')).sort().join()`);
        same(r, 'lab_barrel_1:CL,lab_barrier_1:CL,lab_barrier_2:CL,lab_console_1:C-,lab_console_2:C-,lab_crate_1:CL,lab_crate_2:CL,lab_desk:CL,lab_generator:--', 'the room\'s objects');
    });

    group('SIGHT (js/facility.js facilitySees; in play js/facilityplay.js facilitySeesFrom)');
    check('seen over: a crate, the barrel, a barrier, the desk (low); not through: the generator (tall), a console (too high); a solid at either end does not hide itself (a turret, a pile being aimed at); WALKING IS ANOTHER QUESTION: the crate and the desk seen over are not walked through ("Not yet")', () => {
        const r = J(`(function(){ const F = _fp.F, S = (a, b) => { const p = __T(a), q = __T(b); return facilitySees(p[0], p[1], q[0], q[1], F); }, W = (a, b) => { const p = __T(a), q = __T(b); return facilityCanStep(p[0], p[1], q[0], q[1], F) || _fpLos(p[0], p[1], q[0], q[1]); };
            return [S([6, 1], [6, 3]), S([17, 3], [17, 5]), S([14, 3], [14, 5]), S([11, 5], [11, 7]), S([9, 1], [9, 3]), S([3, 5], [3, 7]), S([7, 5], [7, 7]), S([9, 2], [9, 5]), W([6, 1], [6, 3]), W([11, 5], [11, 7])].map(Number).join(''); })()`);
        same(r, '1111000100', 'crate, barrel, barrier, desk seen over; generator, consoles not; the generator from its own tile; the crate and desk walked through');
    });
    check('WALLS HIDE, DOORWAYS DO NOT (the main map): across every pane of glass (the Experiment Lab\'s, the Show Room\'s, the Observation Deck\'s over the arena) nothing is seen and a shot is stopped at the glass, as the walking test always had it; across every doorway between two rooms, sight and a shot pass', () => {
        const r = J(`(function(){ const F = _fp.F, o = { glass: [], doors: [] };
            for (const w of F.walls) { if (!w.window) continue; const a = __across(w, [0.6, 1, 1.5, 2, 2.5]); if (!a) { o.glass.push(w.window + ':no line'); continue; }
                o.glass.push(w.window + ':' + (facilitySees(a.p[0], a.p[1], a.q[0], a.q[1], F) ? 'SEEN' : '-') + ':' + __line(a.p[0], a.p[1], a.q[0], a.q[1])); }
            for (const d of F.openings) { const a = __across(d, [1, 1.5, 2]); if (!a) { o.doors.push(d.id + ':no line'); continue; }
                const r0 = facilityRoomAt(a.p[0], a.p[1], F), r1 = facilityRoomAt(a.q[0], a.q[1], F); o.doors.push(d.id + ':' + (r0 && r1 && r0 !== r1 ? '2' : '1') + ':' + (facilitySees(a.p[0], a.p[1], a.q[0], a.q[1], F) ? 'seen' : 'HIDDEN') + ':' + __line(a.p[0], a.p[1], a.q[0], a.q[1])); }
            return o; })()`);
        const tried = r.glass.filter(g => !/no line$/.test(g)); ok(tried.length >= 14, 'only ' + tried.length + ' of ' + r.glass.length + ' panes of glass tested: ' + r.glass.join(' | '));
        for (const g of tried) ok(/:-:wall$/.test(g), 'glass: ' + g);
        ok(['lab_window_north', 'show_window_west', 'deck_window_arena'].every(id => r.glass.some(g => g.startsWith(id + ':'))), 'a window not tested: ' + r.glass.join(' | '));
        ok(r.doors.length === 13, 'the doorways: ' + r.doors.join(' | ')); for (const d of r.doors) ok(/:2:seen:through$/.test(d), 'a doorway: ' + d);
    });
    check('IN PLAY: the auto-lock (js/targeting.js) takes a creature seen over the desk and not one behind the generator; the combat step\'s "enemy near" (js/facilityplay.js) the same', () => {
        const r = J(`(function(){ __wild(); const o = {}, T = __T; __put(...T([11, 4])); const a = __ant(...T([11, 8])); a.provoked = true; o.desk = targetNearest() === a; o.nearDesk = facilityEnemyNear() === a;
            __wild(); __put(...T([9, 4])); const b = __ant(...T([9, 0.6])); b.provoked = true; o.gen = targetNearest(); o.nearGen = facilityEnemyNear(); o.d = Math.hypot(b.x - player.x, b.y - player.y) < TARGET.range; __wild(); return o; })()`);
        same(r.desk && r.nearDesk, true, 'the creature over the desk is not locked or near'); same(r.gen, null, 'the creature behind the generator is locked'); same(r.nearGen, null, 'it is near'); same(r.d, true, 'fixture: it is out of range');
    });

    group('SHOTS THAT TRAVEL (js/game.js; js/facility.js facilityShotStop)');
    check('THE PLAYER\'S ROUND at an ant behind the desk, from three tiles off, stops at the desk: a small spark there, the ant unhurt, the round spent; from right behind the desk (half a tile: the player\'s own cover) it passes over and hits', () => {
        const r = J(`(function(){ __wild(); const o = {}, T = __T, a = __ant(...T([11, 8])), edge = T([11, 5.5])[1]; playerWeapon = 'service'; playerAmmo = 20; player.attackCooldown = 0; __put(...T([11, 3]));
            o.fired = firePlayerShot(a); o.ammo = playerAmmo; o.left = __fly(); o.hp = a.health; o.spark = __sparks().map(e => +Math.abs(e.y - edge).toFixed(2));
            elementEffects.length = 0; __put(...T([11, 5])); player.attackCooldown = 0; firePlayerShot(a); __fly(); o.near = a.health < 5000; o.nearSpark = __sparks().length; __wild(); return o; })()`);
        same(r.fired, true, 'the round was not fired'); same(r.ammo, 19, 'the round was not spent'); same(r.left, 0, 'the round is still flying'); same(r.hp, 5000, 'the ant was hurt through the desk');
        same(r.spark.length, 1, 'the sparks'); ok(r.spark[0] < 0.25, 'the spark is not at the desk\'s near edge: ' + r.spark[0]); same(r.near, true, 'the round from right behind the desk did not hit'); same(r.nearSpark, 0, 'a spark from right behind it');
    });
    check('A CREATURE\'S SHOT (either side\'s cover): at a follower behind the crate, from three tiles off, it stops at the crate and the follower is unhurt; from right behind the crate it passes over and hits', () => {
        const r = J(`(function(){ __wild(); const o = {}, T = __T, f = followers[0], h0 = f.health = f.maxHealth; const t = T([6, 0]); f.x = t[0]; f.y = t[1];
            const fire = from => { const s = T(from), p = spawnFollowerProjectile({ x: s[0], y: s[1], stats: { specialAttack: 30 } }, f, '#88ff44', 30, 4, null, DMG_HIT_ENEMY.projectile); p.targetsGreen = true; __fly(); };
            fire([6, 5]); o.far = f.health === h0; o.spark = __sparks().length; f.health = h0; elementEffects.length = 0; fire([6, 3]); o.near = f.health < h0; __bench(); __wild(); f.health = f.maxHealth; return o; })()`);
        same(r.far, true, 'the follower was hurt through the crate'); same(r.spark, 1, 'no spark at the crate'); same(r.near, true, 'the shot from right behind the crate did not hit');
    });
    check('A WALL STOPS A SHOT: the player\'s round at a creature on the far side of the Experiment Lab\'s glass stops at the glass (a spark on it, the creature unhurt); through a doorway it hits', () => {
        const r = J(`(function(){ __wild(); const o = {}, F = _fp.F, ws = F.walls.filter(w => /^lab_window/.test(w.window || '') && w.room === 'experiment_lab'); let a = null; for (const w of ws) { a = __across(w, [1.5, 2, 2.5, 3]); if (a) { o.pane = w.window; break; } }
            o.fixture = !!a; if (!a) return o; const ins = facilityRoomAt(a.p[0], a.p[1], F).id === 'experiment_lab', lab = ins ? a.p : a.q, hall = ins ? a.q : a.p; o.rooms = facilityRoomAt(hall[0], hall[1], F).id + '>' + facilityRoomAt(lab[0], lab[1], F).id;
            const foe = __ant(lab[0], lab[1]); __put(hall[0], hall[1]); playerAmmo = 20; player.attackCooldown = 0; firePlayerShot(foe); __fly(); o.hp = foe.health;
            o.spark = __sparks().map(e => +Math.hypot(e.x - a.m[0], e.y - a.m[1]).toFixed(2));
            __wild(); let d = null; for (const op of F.openings) { d = __across(op, [2, 1.5]); if (d) break; } o.door = !!d;
            const foe2 = __ant(d.q[0], d.q[1]); __put(d.p[0], d.p[1]); player.attackCooldown = 0; firePlayerShot(foe2); __fly(); o.door = foe2.health < 5000; __wild(); return o; })()`);
        same(r.fixture, true, 'fixture: no clear line across the lab\'s glass'); same(r.rooms, 'lab_hallway>experiment_lab', 'fixture: the two rooms (' + r.pane + ')'); same(r.hp, 5000, 'the creature was hurt through the glass'); same(r.spark.length, 1, 'the sparks'); ok(r.spark[0] < 0.3, 'the spark is not on the glass: ' + r.spark[0]);
        same(r.door, true, 'the round through a doorway did not hit');
    });
    check('A TALL OBJECT stops a shot and is nobody\'s own cover (the generator, even from right beside it); COVER TOO HIGH TO SEE OVER is still its owner\'s (a console: from right behind it a shot passes over, from three tiles off it stops); A LOW OBJECT THAT GIVES NO COVER is passed over (the lobby\'s table and couch, the armory\'s cart, a turret, the Sewers\' river and barred gates)', () => {
        const r = J(`(function(){ const o = {}, F = _fp.F; o.gen = __L([9, 3], [9, 0]); o.genFar = __L([9, 6], [9, 0]); o.conNear = __L([7, 5], [7, 9]); o.conFar = __L([7, 3], [7, 9]);
            o.low = []; for (const id of ['table_1', 'couch_1', 'armory_cart', 'sentry_hall', 'sewer_river_w', 'sewer_river_e', 'sewer_gate_s1']) { const s = F.solids.find(q => q.id === id); const c = [(s.bb[0] + s.bb[2]) / 2, (s.bb[1] + s.bb[3]) / 2], hs = [Math.max(s.bb[2] - s.bb[0], s.bb[3] - s.bb[1]) / 2 + 1.2, Math.min(s.bb[2] - s.bb[0], s.bb[3] - s.bb[1]) / 2 + 1.2]; let got = null;   // (across its long side, else its short one: the narrowed river, 2026-11-07)
                for (const h of hs) for (const [dx, dy] of [[1, 0], [0, 1], [0.7071, 0.7071], [0.7071, -0.7071]]) { for (const k of [1, 1.5, 2, 3]) { const p = [c[0] - dx * h * k, c[1] - dy * h * k], q = [c[0] + dx * h * k, c[1] + dy * h * k];
                    if (!facilityWalkable(p[0], p[1], F) || !facilityWalkable(q[0], q[1], F) || _facWallCrossed(p[0], p[1], q[0], q[1], F)) continue; let other = false, crosses = false;
                    for (let i = 0; i <= 40; i++) { const z = facilitySolidAt(p[0] + (q[0] - p[0]) * i / 40, p[1] + (q[1] - p[1]) * i / 40, F); if (z && z !== s) other = true; if (z === s) crosses = true; }
                    if (other || !crosses) continue; got = id + ':' + __line(p[0], p[1], q[0], q[1]) + ':' + (facilitySees(p[0], p[1], q[0], q[1], F) ? 'seen' : 'HIDDEN'); break; } if (got) break; }
                o.low.push(got || id + ':no line'); }
            return o; })()`);
        same(r.gen, 'lab_generator', 'the generator from right beside it'); same(r.genFar, 'lab_generator', 'the generator from three off'); same(r.conNear, 'through', 'a console from right behind it'); same(r.conFar, 'lab_console_2', 'a console from three off');
        same(r.low.join(), 'table_1:through:seen,couch_1:through:seen,armory_cart:through:seen,sentry_hall:through:seen,sewer_river_w:through:seen,sewer_river_e:through:seen,sewer_gate_s1:through:seen', 'the low objects');
    });
    check('WHAT IS THE SHOOTER\'S OWN: cover within one tile (FAC_SHOT.own) of where the shot was fired, to its nearest edge: the crate from 0.9 tiles is passed over, from 1.1 it stops the shot; the next cover on the line stops it (from right behind a console, a shot passes over the console and stops at the crate)', () => {
        const r = J(`[FAC_SHOT.own, __L([6, 3.4], [6, 0]), __L([6, 3.6], [6, 0]), __L([6, 5], [6, 9]), __L([6, 5], [6, 0])].join()`);
        same(r, '1,through,lab_crate_1,through,lab_crate_1', 'own cover');
    });
    check('A LOB flies over everything, as before (an arc: the toxic smoke bomb\'s kind): thrown over the crate it lands where it was thrown, with no spark', () => {
        const r = J(`(function(){ __wild(); const s = __T([6, 5]), e = __T([6, 0]), n = 30, o = {}; followerProjectiles.push({ x: s[0], y: s[1], vx: (e[0] - s[0]) / n, vy: (e[1] - s[1]) / n, life: n, element: 'toxic', radius: 5, damage: 0, isBomb: true, noHitDetect: true,
                arcData: { totalFrames: n, peakHeight: 60 }, onLand() { o.landed = +Math.hypot(this.x - e[0], this.y - e[1]).toFixed(2); } });
            __fly(60); o.sparks = __sparks().length; __wild(); return o; })()`);
        ok(r.landed !== undefined && r.landed < 0.3, 'the lob did not land where it was thrown: ' + r.landed); same(r.sparks, 0, 'a spark');
    });
    check('HEXFIRE (the Ember Hood\'s) at an ant behind the crate lands its burning circle on its own side of the crate, not on the ant; at an ant behind the generator (unseen) it is not fired; QUILL BURST the same', () => {
        const r = J(`(function(){ __wild(); const o = {}, T = __T, f = followers[0], put = p => { const t = T(p); f.x = t[0]; f.y = t[1]; }; f.power = 20; put([6, 5]); const a = __ant(...T([6, 0])); render();
            o.hex = hexfire(f); __fly(); const c = elementEffects.find(e => e.type === 'hexfire' && e.by === f); o.circle = c ? [+(c.y - T([6, 2.5])[1]).toFixed(2), +Math.hypot(c.x - a.x, c.y - a.y).toFixed(2)] : null;
            __wild(); put([9, 5]); __ant(...T([9, 0.6])); o.hexGen = hexfire(f); o.quillGen = quillBurst(f); o.flying = followerProjectiles.length;
            __wild(); put([9, 5]); __ant(...T([11, 3])); o.quillSeen = quillBurst(f); o.quills = followerProjectiles.length; __wild(); __bench(); return o; })()`);
        same(r.hex, true, 'HEXFIRE was not fired at the ant over the crate'); ok(r.circle && r.circle[0] > 0 && r.circle[1] > 2, 'the circle is not on the shooter\'s side of the crate: ' + JSON.stringify(r.circle));
        same(r.hexGen, false, 'HEXFIRE fired at an ant it cannot see'); same(r.quillGen, false, 'QUILL BURST fired at an ant it cannot see'); same(r.flying, 0, 'shots in the air');
        same(r.quillSeen, true, 'QUILL BURST not fired at an ant it sees'); same(r.quills, 5, 'the quills');
    });

    group('THE LASER (js/weapons.js fireLaserShot; js/facility.js facilityShotReach)');
    check('its beam stops at the desk: the ant behind it unhurt, a spark where it stopped, the beam drawn to there; from right behind the desk it passes over and hits; a creature in the line behind the one it hits is hit only up to where the beam stops', () => {
        const r = J(`(function(){ __wild(); const o = {}, T = __T, edge = T([11, 5.5])[1]; weaponOwned.laser = true; playerWeapon = 'laser'; laserCharge = 12; player.attackCooldown = 0; const a = __ant(...T([11, 8]));
            __put(...T([11, 3])); o.fired = fireLaserShot(a); o.hp = a.health; const b = _fp.beams[_fp.beams.length - 1]; o.end = +Math.abs(b.y1 - edge).toFixed(2); o.spark = __sparks().map(e => +Math.abs(e.y - edge).toFixed(2)); o.charge = laserCharge;
            elementEffects.length = 0; __put(...T([11, 5])); player.attackCooldown = 0; fireLaserShot(a); o.near = a.health < 5000; o.nearEnd = _fp.beams[_fp.beams.length - 1].y1 > a.y;
            __wild(); const front = __ant(...T([11, 4])), back = __ant(...T([11, 7])); __put(...T([11, 1])); player.attackCooldown = 0; fireLaserShot(front); o.front = front.health < 5000; o.back = back.health;
            __wild(); const f2 = __ant(...T([12, 4])), b2 = __ant(...T([12, 5])); __put(...T([12, 1])); player.attackCooldown = 0; fireLaserShot(f2); o.open = b2.health < 5000;
            playerWeapon = 'service'; __wild(); return o; })()`);
        same(r.fired, true, 'the laser did not fire'); same(r.hp, 5000, 'the ant was hurt through the desk'); ok(r.end < 0.3, 'the beam does not end at the desk: ' + r.end); same(r.spark.length, 1, 'the sparks'); ok(r.spark[0] < 0.3, 'the spark: ' + r.spark[0]);
        same(r.charge, 11, 'the charge'); same(r.near, true, 'the beam from right behind the desk did not hit'); same(r.nearEnd, true, 'the beam from right behind the desk stops short of the ant');
        same(r.front, true, 'the creature in front of the desk was not hit'); same(r.back, 5000, 'the creature behind the desk was hit through it'); same(r.open, true, 'fixture: with nothing in the way the one behind is not hit');
    });

    group('THE SHOOTERS FIRE AT WHAT THEY CAN SEE');
    check('A MAGE (js/npc.js): at an ant behind the generator in its sweet spot it does not fire; it walks round (the navigation layer, as to one too far off) and fires once it sees it, every shot at an ant it could see', () => {
        const r = J(`(function(){ __wild(); const o = {}, T = __T; spawnFollowerAtCrystal('fire', 'sniper'); const m = followers[followers.length - 1]; m.role = 'sniper'; m.stance = 'follow'; m.post = null; m.returningToCrystal = false; m.evolved = undefined;
            const s = T([9, 4]); m.x = s[0]; m.y = s[1]; m.attackCooldown = 0; __put(...T([12, 4])); const a = __ant(...T([9, 0.6])); a.provoked = true; a.state = 'hunt';
            const shots = [], spf = spawnFollowerProjectile; spawnFollowerProjectile = function (who, at) { if (who === m) shots.push([frame, facilitySees(who.x, who.y, at.x, at.y, _fp.F)]); return spf.apply(this, arguments); };
            const f0 = frame; render(); o.first = shots.length; o.moved = +Math.hypot(m.x - s[0], m.y - s[1]).toFixed(3);
            for (let i = 0; i < 900 && !shots.length; i++) render(); spawnFollowerProjectile = spf;
            o.shot = shots.length ? shots[0][0] - f0 : null; o.seen = shots.every(x => x[1]); o.d = +Math.hypot(a.x - s[0], a.y - s[1]).toFixed(2);
            followers.splice(followers.indexOf(m), 1); actors = actors.filter(x => x !== m); __wild(); __bench(); return o; })()`);
        ok(r.d > 2.5 && r.d < 4, 'fixture: the ant is not in the Mage\'s sweet spot: ' + r.d); same(r.first, 0, 'it fired at the ant behind the generator'); ok(r.moved > 0, 'it stood where it was');
        ok(r.shot !== null, 'it never fired (15 s)'); same(r.seen, true, 'it fired at an ant it could not see');
    });
    check('A CREATURE\'S REAR SHOT (js/predator.js, a scorpion\'s): at a follower behind the generator, its timer up, it does not fire (the timer stays up), nor at the one that last hit it there; at one it sees, it fires', () => {
        const r = J(`(function(){ __wild(); const o = {}, T = __T, f = followers[0], put = p => { const t = T(p); f.x = t[0]; f.y = t[1]; _ucolsFrame = -1; }; const c = __ant(...T([9, 4]), 'scorpion', 'striker'); c.dirX = 0; c.dirY = 1; c.provoked = true; c.state = 'hunt';
            o.has = !!c.abdomenAttack; put([9, 0.6]); c.abdomenTimer = c.abdomenCooldown; c._abdomenTick(); o.hidden = followerProjectiles.length; o.timer = c.abdomenTimer >= c.abdomenCooldown;
            c.lastAttacker = f; c._abdomenTick(); o.revenge = followerProjectiles.length; c.lastAttacker = null;
            put([11, 1]); c.abdomenTimer = c.abdomenCooldown; c._abdomenTick(); o.seen = followerProjectiles.length; o.green = !!(followerProjectiles[0] && followerProjectiles[0].targetsGreen); __wild(); __bench(); return o; })()`);
        same(r.has, true, 'fixture: a scorpion striker has no rear shot'); same(r.hidden, 0, 'it fired at a follower behind the generator'); same(r.timer, true, 'its timer was spent'); same(r.revenge, 0, 'it fired at its attacker behind the generator');
        same(r.seen, 1, 'it did not fire at the follower it sees'); same(r.green, true, 'the shot is not the creature\'s');
    });
    check('A TURRET (js/stations.js): at a creature through the Experiment Lab\'s glass, in the hallway turret\'s range, it does not fire and the Crystal pays nothing; at one with a clear shot it fires and the Crystal pays', () => {
        const r = J(`(function(){ __wild(); const o = {}, F = _fp.F, it = sentryItems().find(i => i.id === 'sentry_hall'); sentriesStart(); crystal.maxHealth = 300; crystal.health = 300; _crystalDrawnAt = -1e9;
            let lab = null, hall = null; for (const [k, c] of _fp.cellsP) { const d = Math.hypot(c[0] - it.x, c[1] - it.y); if (d < 2.5 || d > SENTRY_RANGE - 1) continue; const room = facilityRoomAt(c[0], c[1], F); if (!room) continue;
                if (!lab && room.id === 'experiment_lab' && !facilityShotClear(it.x, it.y, c[0], c[1]) && _facWallCrossed(it.x, it.y, c[0], c[1], F)) lab = c;
                if (!hall && room.id === 'lab_hallway' && facilityShotClear(it.x, it.y, c[0], c[1])) hall = c; }
            o.fixture = !!lab && !!hall; if (!o.fixture) return o; const a = __ant(lab[0], lab[1]); followerProjectiles = []; it.cd = 0; let h = crystal.health; facilitySentryTick(); o.lab = [followerProjectiles.length, crystal.health === h, it.cd];
            __wild(); __ant(hall[0], hall[1]); it.cd = 0; h = crystal.health; facilitySentryTick(); o.hall = [followerProjectiles.length, crystal.health < h]; __wild(); crystal.health = 300; return o; })()`);
        same(r.fixture, true, 'fixture: no place in the lab behind the glass, or none in the hallway in the clear, in the turret\'s range'); same(r.lab.join(), '0,true,0', 'at the creature behind the glass (shots, the Crystal unpaid, the turret\'s wait)');
        same(r.hall.join(), '1,true', 'at the creature in the clear (shots, the Crystal paid)');
    });

    group('THE MOVES THAT STRIKE AT ONCE NEED SIGHT (build 2026-11-06i; the owner, 2026-11-06: "Need sight": nothing strikes through a wall or a tall object)');
    // points on one line straight through a pane of the Experiment Lab's glass: the follower 2 tiles out in the hallway; enemy A 0.75 out and C 1.5 out (both in its sight); enemy B 0.75 in, behind the glass
    run(`globalThis.__glassLine = () => { const F = _fp.F; for (const w of F.walls.filter(w => /^lab_window/.test(w.window || '') && w.room === 'lab_hallway')) { const a = __across(w, [2]); if (!a) continue;
            const u = [(a.m[0] - a.p[0]) / 2, (a.m[1] - a.p[1]) / 2], hs = facilityRoomAt(a.p[0], a.p[1], F).id === 'lab_hallway' ? -1 : 1, at = d => [a.m[0] + u[0] * d * hs, a.m[1] + u[1] * d * hs];
            return { f: at(2), A: at(0.75), C: at(1.5), B: at(-0.75), pane: w.window }; } return null; };
        globalThis.__mover = () => { const f = followers[0]; f.power = 40; f.stance = 'hold'; return f; };
        globalThis.__at = (u, p) => { u.x = p[0]; u.y = p[1]; _ucolsFrame = -1; };`);
    check('across the Experiment Lab\'s glass, 1.5 tiles off, no move that strikes at once is used (ARC VOLLEY, SINGULARITY SHOT, STATIC VORTEX, CORRODE SHOT, CHOMP, SONIC ROLL, PETAL BLAZE, ERUPTION, GRAVITY SLAM): each holds, the creature unhurt; on the same side, at the same distance, each is used', () => {
        const r = J(`(function(){ __wild(); const g = __glassLine(), F = _fp.F, f = __mover(), o = { pane: g && g.pane, through: {}, open: {} }; if (!g) return o;
            o.rooms = [g.f, g.A, g.C, g.B].map(p => (facilityRoomAt(p[0], p[1], F) || {}).id + (facilityWalkable(p[0], p[1], F) ? '' : '!')).join();
            const moves = { 'ARC VOLLEY': arcVolley, 'SINGULARITY SHOT': singularityShot, 'STATIC VORTEX': staticVortex, 'CORRODE SHOT': corrodeShot, 'CHOMP': chomp, 'SONIC ROLL': staticRush, 'PETAL BLAZE': petalBlaze, 'ERUPTION': eruption, 'GRAVITY SLAM': gravitySlam };
            for (const k in moves) { __wild(); const b = __ant(...g.B); __at(f, g.A); frame++; const fired = moves[k](f); o.through[k] = (fired ? 'USED' : 'held') + (b.health < 5000 ? ' HURT' : '') + (elementEffects.some(e => e.type === 'staticVortex') ? ' STORM' : ''); }
            for (const k in moves) { __wild(); const a = __ant(...g.A); __at(f, g.C); frame++; o.open[k] = moves[k](f) ? 'used' : 'HELD'; }
            __wild(); __bench(); return o; })()`);
        ok(r.pane, 'fixture: no clear line through the lab\'s glass'); same(r.rooms, 'lab_hallway,lab_hallway,lab_hallway,experiment_lab', 'fixture: where the points are (' + r.pane + ')');
        same(Object.values(r.through).join(), Array(9).fill('held').join(), 'a move through the glass: ' + JSON.stringify(r.through));
        same(Object.values(r.open).join(), Array(9).fill('used').join(), 'a move on the same side: ' + JSON.stringify(r.open));
    });
    check('what a strike reaches beyond its target is only what can be seen from there: through the glass, ARC VOLLEY\'s and CHAIN LIGHTNING\'s jumps, SONIC ROLL\'s shocks, SINGULARITY SHOT\'s pull and slow, CORRODE SHOT\'s splash, CHOMP\'s slow, a burning circle\'s or a storm\'s bite, STATIC VORTEX\'s pull, and the equip cards\' NOVA, CLEAVE and CHAIN reach nobody, while those on the near side are reached', () => {
        const r = J(`(function(){ const g = __glassLine(), f = __mover(), o = {}; if (!g) return o;
            const set = withC => { __wild(); const A = __ant(...g.A), B = __ant(...g.B), C = withC ? __ant(...g.C) : null; __at(f, g.f); frame++; return { A, B, C }; }, hurt = u => u.health < 5000;
            let s = set(true); arcVolley(f); o.arc = [hurt(s.A), hurt(s.B)];
            s = set(true); chainLightning(f, s.A, 50); o.chain = [hurt(s.C), hurt(s.B)];
            s = set(true); staticRush(f); o.roll = [hurt(s.A), hurt(s.B)];
            s = set(false); const bx = s.B.x, by = s.B.y; singularityShot(f); o.pull = [!!s.A.slowed, !!s.B.slowed || s.B.x !== bx || s.B.y !== by];
            s = set(false); corrodeShot(f); o.splash = [!!s.A.defenseShredded, !!s.B.defenseShredded];
            s = set(false); chomp(f); o.slow = [!!s.A.slowed, !!s.B.slowed];
            s = set(false); fieldBite({ x: s.A.x, y: s.A.y, radius: 2, bite: 10, by: f }, 'fire'); o.field = [hurt(s.A), hurt(s.B)];
            s = set(true); staticVortexTick({ x: s.A.x, y: s.A.y, radius: VORTEX_RADIUS, life: 100, maxLife: 100, bite: 0, by: f }); o.vortex = [!!(s.C.kbVX || s.C.kbVY), !!(s.B.kbVX || s.B.kbVY)];
            s = set(true); o.echo = _equipFoesNear(s.A.x, s.A.y, 2, null).map(u => u === s.A ? 'A' : u === s.B ? 'B' : u === s.C ? 'C' : '?').sort().join('');
            __wild(); __bench(); return o; })()`);
        ok(r.arc, 'fixture: no line through the glass');
        for (const k of ['arc', 'chain', 'roll', 'pull', 'splash', 'slow', 'field', 'vortex']) same(r[k].join(), 'true,false', k + ' (the near side reached, the far side not)');
        same(r.echo, 'AC', 'the equip cards\' echoes (NOVA, CLEAVE, CHAIN) reach');
    });
    check('SONIC ROLL dashes only along floor it could walk: at a creature seen over the test room\'s crate it holds (the dash would pass over the crate: stepping over is "Not yet"), at one in the open it dashes', () => {
        const r = J(`(function(){ __wild(); const T = __T, f = __mover(), o = {}; __at(f, T([6, 4])); const a = __ant(...T([6, 0.6])); frame++;
            o.seen = facilitySees(f.x, f.y, a.x, a.y, _fp.F); o.over = staticRush(f); o.stayed = Math.hypot(f.x - T([6, 4])[0], f.y - T([6, 4])[1]) < 1e-9; o.hp = a.health;
            __wild(); __at(f, T([6, 4])); const b = __ant(...T([3.5, 4])); frame++; o.open = staticRush(f); o.openHit = b.health < 5000; __wild(); __bench(); return o; })()`);
        same(r.seen, true, 'fixture: the creature is not seen over the crate'); same(r.over, false, 'it dashed over the crate'); same(r.stayed, true, 'it moved'); same(r.hp, 5000, 'the creature was hit');
        same(r.open, true, 'it did not dash at the one in the open'); same(r.openHit, true, 'the one in the open was not hit');
    });
    check('a creature\'s special and your own jumps need sight too (the owner, 2026-11-06: "Both need sight"): across the lab\'s glass a special neither aims at nor reaches a follower, and ARC SLINGER\'s jump and the Technomancer\'s arc do not jump; on the same side they do', () => {
        const r = J(`(function(){ const g = __glassLine(), f = __mover(), o = {}; if (!g) return o;
            const special = p => { __wild(); const c = __ant(...g.A); __at(f, p); frame++; const area = []; _abForEachFoeInRadius(c, 3, a => area.push(a)); return (_abNearestFoe(c, 3) === f) + '/' + area.includes(f); };
            o.special = [special(g.B), special(g.C)];
            const slinger = p => { __wild(); const A = __ant(...g.A), X = __ant(...p); frame++; return !!playerRoundJump({ kit: { jump: { radius: 2.6, share: 0.6 } } }, A, player, 50, []) + '/' + (X.health < 5000); };
            o.slinger = [slinger(g.B), slinger(g.C)];
            const arc = p => { __wild(); const A = __ant(...g.A), X = __ant(...p); technoCharge = 1; frame++; technoArc(A); return X.health < 5000; };
            o.arc = [arc(g.B), arc(g.C)];
            __wild(); __bench(); return o; })()`);
        ok(r.special, 'fixture: no line through the glass');
        same(r.special.join(), 'false/false,true/true', 'a creature\'s special (aimed / in its area): behind the glass, then on the same side');
        same(r.slinger.join(), 'false/false,true/true', 'ARC SLINGER\'s jump (jumped / hurt)');
        same(r.arc.join(), 'false,true', 'the Technomancer\'s arc (the next creature hurt)');
    });

    group('FLUX MOVE MOVES COVER (js/fluxmove.js; js/facilityplay.js facilitySolidMove)');
    check('a crate moved two tiles gives cover where it now stands and none where it stood: a shot along its old line passes, one along its new line stops at it; it is seen over and not walked through in its new place, and the floor it left is walked again', () => {
        const r = J(`(function(){ __wild(); const o = {}, T = __T, F = _fp.F, s = fluxObject('lab_crate_1'); __put(...T([4, 9])); followers.forEach(f => { const t = T([2, 11]); f.x = t[0]; f.y = t[1]; });
            o.before = [__L([6, 5], [6, 0]), __L([8, 5], [8, 0])].join(); const q = T([8, 3]), m = fluxMoveTo(s, q[0], q[1], false); o.move = m.ok || m.why;
            o.after = [__L([6, 5], [6, 0]), __L([8, 5], [8, 0])].join(); o.traits = s.cover && s.low; const p = T([8, 5]), z = T([8, 1]), u = T([6, 1]), v = T([6, 3]);
            o.seen = facilitySees(p[0], p[1], z[0], z[1], F); o.walk = facilityCanStep(p[0], p[1], z[0], z[1], F); o.walkOld = facilityCanStep(u[0], u[1], v[0], v[1], F); __bench(); return o; })()`);
        same(r.before, 'lab_crate_1,through', 'before the move'); same(r.move, true, 'the crate did not move'); same(r.after, 'through,lab_crate_1', 'after the move (the old line, the new line)');
        same(r.traits, true, 'the crate lost its traits'); same(r.seen, true, 'not seen over in its new place'); same(r.walk, false, 'walked through in its new place'); same(r.walkOld, true, 'its old place not walked');
    });

    group('THE COST');
    check('a shot\'s step is cheap: 20,000 steps across the arena and the test room take less than a third of a second, and no more than five times the walking test\'s steps', () => {
        const r = J(`(function(){ const F = _fp.F, R = F.byId.get('arena'), bb = R.bb, pts = []; let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
            for (let i = 0; i < 20000; i++) { const x = bb[0] + rnd() * (bb[2] - bb[0]), y = bb[1] + rnd() * (bb[3] - bb[1]), a = rnd() * 6.283; pts.push([x, y, x + Math.cos(a) * 0.18, y + Math.sin(a) * 0.18]); }
            const t0 = Date.now(); let n = 0; for (const p of pts) if (facilityShotStop(p[0], p[1], p[2], p[3], p[0], p[1], F)) n++; const t1 = Date.now(); for (const p of pts) facilityCanStep(p[0], p[1], p[2], p[3], F); const t2 = Date.now();
            return { shot: t1 - t0, walk: t2 - t1, n }; })()`);
        ok(r.shot < 330, 'the shots\' steps took ' + r.shot + ' ms'); ok(r.shot <= Math.max(5 * r.walk, 40), 'a shot\'s step costs ' + r.shot + ' ms against the walking test\'s ' + r.walk + ' ms'); ok(r.n > 0, 'fixture: no step stopped');
    });

    group('THE REAL PAGE (?fluxlab)');
    {
        const m = measure(1180, 820);
        if (m === null) check('the real page on a tablet: no Chromium here (not run)', () => {});
        else check('on a tablet (1180 × 820): the player\'s round at an ant behind the test room\'s desk stops at the desk with its spark drawn, the ant unhurt; from right behind the desk it hits; the laser\'s beam stops at the desk; no errors', () => {
            ok(m, 'no result from the page'); same(m.err, undefined, 'the page threw: ' + m.err); same((m.errs || []).length, 0, 'errors: ' + (m.errs || []).join(' | '));
            same(m.far.hp, 5000, 'the ant was hurt through the desk'); same(m.far.spark, true, 'no spark at the desk'); same(m.far.left, 0, 'the round is still flying');
            ok(m.near.hp < 5000, 'the round from right behind the desk did not hit'); same(m.laserFired, true, 'the laser did not fire'); same(m.laser.hp, 5000, 'the laser hurt the ant through the desk');
            ok(m.laser.end !== null && m.laser.end < 0.3, 'the beam does not end at the desk: ' + m.laser.end); same(m.laser.spark, true, 'no spark where the beam stopped');
        });
    }

    console.log(failures ? '\n' + failures + ' failing' : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
