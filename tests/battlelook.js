// THE BATTLE LOOK (docs/BATTLE-LOOK.md), build 2026-11-11h: the battle view (js/battleview.js).
// The owner, 2026-11-11: "Can we make it where the combat is more like a JRPG ... it like zooms in and kind of blurs out the edges a little bit": real-time stays; the view comes on "when a creature
// engages"; 1.25x "as drafted" (HIGH: the edges blurred and darkened; LOW: darkened only); "the objects become invisible in that battle phase" (only those hiding a fighter; they still count; more visible
// than a faint outline); the floor's writing ("the weak should be written on the ground and like shake", STUNNED on the floor, "the resist should float off like it's nothing"); "the character names
// are not visible", a level and the element's tag by the bar instead; the followers' health on the roster, not the floor.
//   WHEN        a creature near you, in sight, going for you or yours, hit by you or yours in the last 2 s, or the one your squad is ordered at; not a sleeper, a clone, one of yours, one too far or
//               out of sight. The view eases in (0.4 s), holds 3 s after the last, eases out (0.6 s); the dialogue box and ?attract keep it out; a new game puts it out
//   THE ZOOM    a copy of the world picture scaled about the middle (its source rectangle); HIGH blurs and darkens the edges, LOW darkens only; the network panel and the Nest's meter wait for after it
//   TAPS        what is drawn after the copy and every tap on the world go through the zoom: a creature where it shows, a follower's pick point, the lock-on, a floating word, a tile, the Crystal, each picker
//   THE FLOOR   drawn first on your level only; written on it: each fighter's tile lit, a creature's bar with its level and its element's tag (none for your followers), STUNNED while it lasts, WEAK! shaking
//   THE WORDS   no names or small bars over the units; WEAK and STUNNED not in the air; RESIST small, pale, drifting off
//   OBJECTS     one in front of a fighter is a ghost, its floor and outline drawn on the floor; one behind or beside it is not; it still stops shots; a big object fades whole (build 2026-11-11i),
//               its outline round it, its inner tiles on the nearest floor; each tile's own column of the picture is what is noted
//   THE NUMBERS (build 2026-11-11i) the faces; the bonus in a hit (js/damage.js dmgBaseShare); a number's tag; a creature's flight (knocked off, back into its bar's cut, lying flat) and its bar
//               dropping only as each part lands; a follower's (knocked off and gone) and its card (the −N out of it, lit and shaking, its health moving then); heals and WEAK! out of the card;
//               the other words in the status face, kept apart
//   FONTS       the seven faces declared in game.html (column C), each file and its licence present; the floor's face Titan One
//   THE REAL PAGE  game.html in Chromium: the copy puts a point where bvZoomPt says, the edges darker than the middle (LOW, HIGH: blurred too); a fight in the arena, the view on, drawn with no errors
const fs = require('fs'), vm = require('vm'), path = require('path'), os = require('os');
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
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
// THE REAL PAGE: the copy on a plain grey picture with a white dot (LOW, then HIGH): where the dot lands, the middle, a corner; then a fight in the arena drawn by the game's own loop
const SCRIPT = `<script>window.__errs = []; window.addEventListener('error', function(e){ window.__errs.push(String(e.message)); });
window.addEventListener('load', function(){ setTimeout(function(){
  var out = {}, step = function(n){ for (var i = 0; i < n; i++) render(); };
  try {
    facilityPlayStart(); facilityBlackoutSet(false); gameState.running = true; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; if (typeof dialogueClear === 'function') dialogueClear(); step(2);
    var W = canvas.width, H = canvas.height, lum = function(x, y){ var d = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data; return Math.round((d[0] + d[1] + d[2]) / 3); };
    var keepHud = drawFacilityNetworkHUD, keepNest = nestMeterDraw; drawFacilityNetworkHUD = function(){}; nestMeterDraw = function(){};
    var plain = function(){ ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#ffffff'; ctx.fillRect(W / 2 + 200 - 4, H / 2 - 120 - 4, 8, 8); };
    _bv.k = 1; _bv.z = BATTLE_VIEW.zoom; var q = bvZoomPt(W / 2 + 200, H / 2 - 120);
    gfxLow = true; plain(); battleViewPost(); out.low = { dot: lum(q[0], q[1]), was: lum(W / 2 + 200 + 7, H / 2 - 120 - 7), mid: lum(W / 2 + 40, H / 2 + 40), corner: lum(6, H - 6), blur: !!_bvDraw.cvs.edge };
    gfxLow = false; plain(); battleViewPost(); out.high = { dot: lum(q[0], q[1]), mid: lum(W / 2 + 40, H / 2 + 40), corner: lum(6, H - 6), blur: !!_bvDraw.cvs.edge };
    drawFacilityNetworkHUD = keepHud; nestMeterDraw = keepNest; battleViewReset(); out.size = [W, H];
    var A = _fp.F.byId.get('arena').bb, cx = (A[0] + A[2]) / 2, cy = (A[1] + A[3]) / 2; player.x = player.targetX = player.visualX = cx; player.y = player.targetY = player.visualY = cy; player.fpPath = null;
    actors = actors.filter(function(a){ return !(a instanceof Predator); });
    var ant = spawnCreature({ species: 'ant', className: 'worker', x: cx + 3, y: cy, level: 4 }); ant.x = cx + 3; ant.y = cy; ant.update = function(){}; ant.health = ant.maxHealth = 5000; ant.spawnProtection = 0; ant.currentTarget = player;
    step(BATTLE_VIEW.easeIn + 4); out.on = battleViewOn(); out.z = battleViewZoom();
    applyStun(ant, 200); floatingTexts.push({ world: true, x: ant.x, y: ant.y, text: 'SLASHING WEAK!', color: '#ffcc00', size: 11, life: 40, vy: -0.015 }); floatingTexts.push({ world: true, x: ant.x, y: ant.y, text: 'FIRE RESIST', color: '#88aaff', size: 11, life: 40, vy: -0.015 });
    step(12); out.still = battleViewOn(); out.fighters = _bvFighters().length;
    out.faces = Object.keys(BV_FACES).filter(function(k){ return !document.fonts.check(battleFace(k, 20)); });
    var foeHit = floatingTexts.length; applyDamage(ant, 20, player, null, false, false, { type: 'crushing', player: true }); var nt = floatingTexts[floatingTexts.length - 1];
    step(BATTLE_VIEW.num.glide + 2); var ln = _bvDraw.land.get(nt); out.landed = !!(ln && ln.main); out.numErrs = window.__errs.length;
    // THE TRUCK, FLAT (build 2026-11-11l): beside it in a fight, its picture as drawn with the big objects flat and as drawn with them not (the same frame's zoom): the flat one is mostly floor
    var T = _fp.F.solids.find(function(s){ return s.kind === 'semi_truck'; }); player.x = player.targetX = player.visualX = T.bb[2] + 3; player.y = player.targetY = player.visualY = (T.bb[1] + T.bb[3]) / 2; player.fpPath = null;
    ant.x = player.x + 2; ant.y = player.y; ant.currentTarget = player; step(BATTLE_VIEW.easeIn + BATTLE_VIEW.fade + 6);
    var tc = _bvScr(T.bb[0] + 1.5, (T.bb[1] + T.bb[3]) / 2, 40), lumBox = function(){ var d = ctx.getImageData(Math.round(tc[0]) - 40, Math.round(tc[1]) - 40, 80, 80).data, s2 = 0; for (var i = 0; i < d.length; i += 4) s2 += (d[i] + d[i + 1] + d[i + 2]) / 3; return Math.round(s2 / (d.length / 4)); };
    out.truckFlat = lumBox(); var keepTiles = BATTLE_VIEW.flat.tiles; BATTLE_VIEW.flat.tiles = 1e9; _bvDraw.big = null; step(BATTLE_VIEW.fade + 4); out.truckSolid = lumBox(); BATTLE_VIEW.flat.tiles = keepTiles; _bvDraw.big = null; out.truckOn = battleViewOn();
  } catch (err) { out.err = String(err && err.stack || err); }
  out.errs = window.__errs.slice(0, 3);
  var pre = document.createElement('pre'); pre.id = '__bv'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function realPage() {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bv-')), file = path.join(dir, 'game.html'), prof = path.join(dir, 'profile');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--user-data-dir=' + prof, '--window-size=1280,860', '--virtual-time-budget=30000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 180000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__bv">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`facilityBlackoutSet(false); gameState.running = true; canvas.width = 1280; canvas.height = 860; innerWidth = 1100; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; if (typeof dialogueClear === 'function') dialogueClear();
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__calm = () => { actors = actors.filter(a => !(a instanceof Predator)); };
        const A = _fp.F.byId.get('arena').bb; globalThis.__mid = () => __put((A[0] + A[2]) / 2, (A[1] + A[3]) / 2);
        globalThis.__foe = (dx, dy) => { const p = spawnCreature({ species: 'ant', className: 'worker', x: player.x + dx, y: player.y + dy, level: 2 }); p.x = player.x + dx; p.y = player.y + dy; p.update = () => {}; p.health = p.maxHealth = 5000; p.spawnProtection = 0; p.currentTarget = null; p.lastAttacker = null; p.biteTarget = null; p.asleep = 0; p.stunned = 0; return p; };
        globalThis.__mate = (dx, dy) => { spawnFollowerAtCrystal('fire', 'brawler'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.x = player.x + dx; f.y = player.y + dy; return f; };
        globalThis.__tick = n => { for (let i = 0; i < n; i++) { frame++; battleViewTick(); } };
        globalThis.__on = () => { _bv.k = 1; _bv.z = BATTLE_VIEW.zoom; _bvDraw.fightersAt = -1; };
        globalThis.__off = () => { battleViewReset(); _bvDraw.fightersAt = -1; };
        __mid(); __calm();`);

    group('WHEN: a creature engages you or your squad');
    check('the numbers: 1.25x (the owner\'s, as drafted), in over 0.4 s, out over 0.6 s, 3 s after the last, a creature within 7 tiles, a hit "lately" 2 s, a look every 6 frames', () => {
        same(J('[BATTLE_VIEW.zoom, BATTLE_VIEW.easeIn, BATTLE_VIEW.easeOut, BATTLE_VIEW.hold, BATTLE_VIEW.reach, BATTLE_VIEW.hit, BATTLE_VIEW.every]').join(), '1.25,24,36,180,7,120,6', 'BATTLE_VIEW');
    });
    check('a creature near you, in sight, engages when it goes for you or one of yours, when you or yours hit it in the last 2 s, or when your squad is ordered at it; not otherwise', () => {
        const r = J(`(function(){ __calm(); __mid(); const o = {}, foe = __foe(3, 0), mate = { isFollower: true, team: 'green' };
            o.idle = battleEngaged(); foe.currentTarget = player; o.you = battleEngaged(); foe.currentTarget = mate; o.mate = battleEngaged(); foe.currentTarget = null;
            foe.biteTarget = mate; o.bite = battleEngaged(); foe.biteTarget = null;
            foe.lastAttacker = player; foe._lagAt = frame; o.hit = battleEngaged(); foe._lagAt = frame - BATTLE_VIEW.hit - 1; o.oldHit = battleEngaged();
            foe.lastAttacker = foe; foe._lagAt = frame; o.notYours = battleEngaged(); foe.lastAttacker = null;
            const f = { isFollower: true, team: 'green', dead: false, attackOrder: { target: foe } }; followers.push(f); o.ordered = battleEngaged(); followers.splice(followers.indexOf(f), 1);
            __calm(); return o; })()`);
        same(JSON.stringify(r), JSON.stringify({ idle: false, you: true, mate: true, bite: true, hit: true, oldHit: false, notYours: false, ordered: true }), 'engaged (minding its business; going for you; for one of yours; biting one of yours; hit by you now; 2 s ago; hit by another creature; your squad ordered at it)');
    });
    check('not one too far (over 7 tiles), out of sight, asleep, a clone, one of yours or dead', () => {
        const r = J(`(function(){ __calm(); __mid(); const o = {}, foe = __foe(3, 0), t0 = foe.team; foe.currentTarget = player;
            foe.x = player.x + BATTLE_VIEW.reach + 0.5; o.far = battleEngaged(); foe.x = player.x + BATTLE_VIEW.reach - 0.5; o.edge = battleEngaged(); foe.x = player.x + 3;
            const keep = facilitySeesFrom; facilitySeesFrom = () => false; try { o.unseen = battleEngaged(); } finally { facilitySeesFrom = keep; }
            foe.asleep = 200; o.asleep = battleEngaged(); foe.asleep = 0; foe.isClone = true; o.clone = battleEngaged(); foe.isClone = false;
            foe.team = 'green'; o.green = battleEngaged(); foe.team = t0; foe.dead = true; o.dead = battleEngaged(); foe.dead = false; o.back = battleEngaged(); __calm(); return o; })()`);
        same(JSON.stringify(r), JSON.stringify({ far: false, edge: true, unseen: false, asleep: false, clone: false, green: false, dead: false, back: true }), 'engaged');
    });
    check('it eases in over 0.4 s to 1.25x (smoothly: halfway in, an eighth of a zoom), stays 3 s after the last creature engaging, then eases out over 0.6 s', () => {
        const r = J(`(function(){ __calm(); __mid(); __off(); const o = {}, foe = __foe(3, 0); foe.currentTarget = player;
            __tick(BATTLE_VIEW.easeIn / 2); o.half = [+battleViewK().toFixed(4), +battleViewZoom().toFixed(4)]; __tick(BATTLE_VIEW.easeIn / 2); o.full = [battleViewK(), battleViewZoom()];
            foe.currentTarget = null; let n = 0; while (battleViewK() === 1 && n < 2000) { __tick(1); n++; } o.held = n;
            let m = 1; while (battleViewK() > 0 && m < 2000) { __tick(1); m++; } o.out = m; o.end = [battleViewOn(), battleViewZoom()]; __calm(); return o; })()`);
        same(r.half.join(), '0.5,1.125', 'halfway in (k, zoom)'); same(r.full.join(), '1,1.25', 'all the way in');
        ok(r.held >= 180 - 6 && r.held <= 180 + 2, 'held ' + r.held + ' frames after the last creature engaging (3 s)');
        ok(Math.abs(r.out - 36) <= 1, 'out over ' + r.out + ' frames'); same(r.end.join(), 'false,1', 'out at the end');
    });
    check('a knockout (three hits, or the queen\'s) eases it out at once, not 3 s on', () => {
        const r = J(`(function(){ __calm(); __mid(); __off(); const o = {}, foe = __foe(3, 0); foe.currentTarget = player; __tick(BATTLE_VIEW.easeIn + 2); o.on = battleViewK();
            battleViewDrop(); foe.currentTarget = null; __tick(1); o.next = battleViewK() < 1; __tick(BATTLE_VIEW.easeOut); o.out = battleViewK(); __calm(); __off(); return o; })()`);
        same(JSON.stringify(r), JSON.stringify({ on: 1, next: true, out: 0 }), 'out (in, the next frame, after 0.6 s)');
        ok(/playerCombatReset\(\);[^\n]*\n\s*if \(typeof battleViewDrop === "function"\) battleViewDrop\(\);/.test(rd('js/game.js')), 'the knockout does not ask');
        ok(/function questQueenTakesYou\(\) \{[\s\S]*?battleViewDrop\(\);[\s\S]*?\n\}/.test(rd('js/quests.js')), 'the queen\'s does not ask');
    });
    check('the dialogue box and ?attract keep it out (it eases out while they are up); a new game puts it out at once', () => {
        const r = J(`(function(){ __calm(); __mid(); __off(); const o = {}, foe = __foe(3, 0); foe.currentTarget = player; __tick(BATTLE_VIEW.easeIn + 2); o.on = battleViewK();
            const keepD = dialogueCurrent; dialogueCurrent = () => ({ who: 'test' }); try { __tick(BATTLE_VIEW.easeOut + 2); o.dialogue = battleViewK(); } finally { dialogueCurrent = keepD; }
            __tick(BATTLE_VIEW.easeIn + 2); o.back = battleViewK();
            const keepA = attractOn; attractOn = () => true; try { o.attractEngaged = battleEngaged(); __tick(BATTLE_VIEW.easeOut + 2); o.attract = battleViewK(); } finally { attractOn = keepA; }
            __tick(BATTLE_VIEW.easeIn + 2); battleViewReset(); o.reset = [battleViewK(), battleViewZoom()]; o.newGame = /battleViewReset\\(\\)/.test(facilityResetState.toString()); __calm(); __off(); return o; })()`);
        same(JSON.stringify(r), JSON.stringify({ on: 1, dialogue: 0, back: 1, attractEngaged: false, attract: 0, reset: [0, 1], newGame: true }), 'in and out');
    });

    group('THE ZOOM: the finished world picture, copied and scaled about the middle');
    check('a point and its place under the zoom: about the middle, 1.25x as far out; and back again; with no zoom, no change', () => {
        const r = J(`(function(){ __on(); const a = bvZoomPt(640, 430), b = bvZoomPt(740, 330), c = bvUnzoom(b[0], b[1]), d = bvUnzoom(765, 305); __off(); return [a, b, c, d, bvZoomPt(740, 330), bvUnzoom(740, 330)]; })()`);
        same(JSON.stringify(r), JSON.stringify([[640, 430], [765, 305], [740, 330], [740, 330], [740, 330], [740, 330]]), 'the points (the middle; out; back; back from the screen; no zoom both ways)');
    });
    check('the copy: the picture\'s middle 1/1.25 drawn over the whole screen; on HIGH a blurred copy kept towards the edges, then the darkening; on LOW the darkening alone; then the network panel and the Nest\'s meter; out of the view nothing', () => {
        const r = J(`(function(){ const o = {}, log = [], keepH = drawFacilityNetworkHUD, keepN = nestMeterDraw, keepD = ctx.drawImage, keepLow = gfxLow;
            drawFacilityNetworkHUD = () => log.push('net'); nestMeterDraw = () => log.push('nest');
            ctx.drawImage = function (...a) { const im = a[0], name = im === canvas ? 'canvas' : (Object.keys(_bvDraw.cvs).find(k => _bvDraw.cvs[k].c === im) || '?'); log.push(name + (a.length === 9 ? ':' + a.slice(1).map(v => Math.round(v)).join(',') : '')); };
            try { __on(); gfxLow = false; battleViewPost(); o.high = log.splice(0); gfxLow = true; battleViewPost(); o.low = log.splice(0); __off(); battleViewPost(); o.off = log.splice(0); }
            finally { drawFacilityNetworkHUD = keepH; nestMeterDraw = keepN; ctx.drawImage = keepD; gfxLow = keepLow; }
            return o; })()`);
        same(r.high.join(' '), 'copy:128,86,1024,688,0,0,1280,860 edge dark net nest', 'HIGH');
        same(r.low.join(' '), 'copy:128,86,1024,688,0,0,1280,860 darkLow net nest', 'LOW');
        same(r.off.join(' '), '', 'out of the view');
    });
    check('the world pass holds back the network panel and the Nest\'s meter while the view is on, so a frame in a fight draws the panel once, after the copy; the copy is made just before the floating words', () => {
        const G = rd('js/game.js');
        ok(/if \(!\(typeof battleViewDefers === "function" && battleViewDefers\(\)\)\) drawFacilityNetworkHUD\(\);/.test(G), 'the network panel is not held back');
        ok(/if \(typeof nestMeterDraw === "function" && !\(typeof battleViewDefers === "function" && battleViewDefers\(\)\)\) nestMeterDraw\(\);/.test(G), 'the Nest\'s meter is not held back');
        ok(/if \(typeof battleViewPost === "function"\) battleViewPost\(\);[^\n]*\n\s*drawFloatingTexts\(\);/.test(G), 'the copy is not made just before the floating words');
        ok(/facilityPlayerStep\(\);\n\s*if \(typeof battleViewTick === "function"\) battleViewTick\(\);/.test(G), 'the view is not stepped each frame');
        const r = J(`(function(){ __calm(); __mid(); __off(); const foe = __foe(3, 0); foe.currentTarget = player; for (let i = 0; i < BATTLE_VIEW.easeIn + 2; i++) render();
            const log = [], keepH = drawFacilityNetworkHUD, keepD = ctx.drawImage; drawFacilityNetworkHUD = () => log.push('net'); ctx.drawImage = function (im) { if (_bvDraw.cvs.copy && im === _bvDraw.cvs.copy.c) log.push('copy'); };
            try { render(); } finally { drawFacilityNetworkHUD = keepH; ctx.drawImage = keepD; } const on = battleViewOn(); __calm(); __off(); return { log, on }; })()`);
        same(r.on, true, 'the view is not on in the fight'); same(r.log.join(' '), 'copy net', 'the frame');
    });

    group('TAPS: a tap lands on what is under the finger');
    check('a tap where a creature shows under the zoom picks it (not where it was before the zoom); the lock-on, a follower\'s pick point and a floating word are drawn where the zoom puts them', () => {
        const r = J(`(function(){ __calm(); __mid(); const o = {}, foe = __foe(4, -2);
            const apx = (foe.x - player.visualX - (foe.y - player.visualY)) * TILE_W + canvas.width / 2, apy = (foe.x - player.visualX + (foe.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H - facilityLiftRel(foe.x, foe.y) - 55;
            __off(); o.plain = findEnemyAtScreen(apx, apy) === foe; const g0 = _gunScreen(foe);
            __on(); const q = bvZoomPt(apx, apy); o.zoomed = findEnemyAtScreen(q[0], q[1]) === foe; o.before = findEnemyAtScreen(apx, apy) === foe; o.gap = Math.round(Math.hypot(q[0] - apx, q[1] - apy));
            const g1 = _gunScreen(foe), gz = bvZoomPt(g0.x, g0.y); o.lock = [Math.round(g1.x - gz[0]), Math.round(g1.y - gz[1])];
            const f = { x: player.x + 2, y: player.y + 1, isClone: false }; __off(); const f0 = followerPickPoint(f); __on(); const f1 = followerPickPoint(f), fz = bvZoomPt(f0.x, f0.y); o.follower = [Math.round(f1.x - fz[0]), Math.round(f1.y - fz[1])];
            const t = { world: true, x: player.x + 1, y: player.y + 3 }; __off(); const t0 = floatingTextScreen(t); __on(); const t1 = floatingTextScreen(t), tz = bvZoomPt(t0[0], t0[1]); o.word = [Math.round(t1[0] - tz[0]), Math.round(t1[1] - tz[1])];
            __off(); __calm(); return o; })()`);
        same(r.plain, true, 'no view: a tap on it'); same(r.zoomed, true, 'in the view: a tap where it shows'); ok(r.gap > J('PICK_RADIUS'), 'the test\'s creature is too near the middle: ' + r.gap); same(r.before, false, 'in the view, a tap where it was before the zoom');
        same(r.lock.join(), '0,0', 'the lock-on (and the dial\'s brackets)'); same(r.follower.join(), '0,0', 'a follower\'s pick point'); same(r.word.join(), '0,0', 'a floating word');
    });
    check('a tap on the floor under the zoom means the tile under the finger (a technician\'s aim, a walk, a hold), and on the Crystal the Crystal', () => {
        const r = J(`(function(){ __mid(); const o = {}, sx = 640 + 3 * TILE_W, sy = 430 - 2 * TILE_H; __off(); const w0 = techScreenToWorld(sx, sy); __on(); const q = bvZoomPt(sx, sy), w1 = techScreenToWorld(q[0], q[1]);
            o.aim = [+(w1.x - w0.x).toFixed(3), +(w1.y - w0.y).toFixed(3)];
            const C = { x: crystal.x, y: crystal.y }; __put(C.x + 4, C.y - 4); const cpx = (crystal.x - player.visualX - (crystal.y - player.visualY)) * TILE_W + canvas.width / 2, cpy = (crystal.x - player.visualX + (crystal.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H;
            const cq = bvZoomPt(cpx, cpy); o.crystal = [isTapNearCrystal(cq[0], cq[1]), Math.hypot(cq[0] - cpx, cq[1] - cpy) > 60 ? isTapNearCrystal(cpx, cpy) : 'near'];
            __off(); __mid(); return o; })()`);
        same(r.aim.join(), '0,0', 'the tile under a tap where it shows'); same(r.crystal[0], true, 'a tap where the Crystal shows'); same(r.crystal[1], false, 'a tap where the Crystal was before the zoom');
        const I = rd('js/input.js');
        same((I.match(/const \[_ux, _uy\] = typeof bvUnzoom === "function" \? bvUnzoom\((ex, ey|pressX, pressY)\) : \[(ex, ey|pressX, pressY)\];/g) || []).length, 3, 'the three tile picks in js/input.js (a tap, a hold, a press)');
    });
    check('every picker that works out the world from a tap takes the tap back through the zoom first, once (FLUX MOVE\'s tile through the technicians\' own)', () => {
        for (const [f, fn] of [['js/techabilities.js', 'techScreenToWorld'], ['js/techabilities.js', 'techRubbleAtScreen'], ['js/techabilities.js', 'techSiteTap'], ['js/fluxmove.js', 'fluxPropAtScreen'], ['js/mutator.js', 'cloneBodyAtScreen'], ['js/stations.js', 'facilityStationTap'], ['js/specimen.js', 'specimenTap']])
            ok(new RegExp('function ' + fn + '\\(ex, ey\\) \\{\\n\\s*if \\(typeof bvUnzoom === "function"\\) \\[ex, ey\\] = bvUnzoom\\(ex, ey\\);').test(rd(f)), fn + ' (' + f + ') does not take the tap back through the zoom');
        ok(/function fluxTileAtScreen\(ex, ey\) \{ if \(typeof techScreenToWorld !== "function"\) return null; const p = techScreenToWorld\(ex, ey\);/.test(rd('js/fluxmove.js')), 'FLUX MOVE\'s tile');
        ok(!/bvUnzoom/.test(rd('js/fluxmove.js').match(/function fluxTileAtScreen[^\n]*/)[0]), 'FLUX MOVE\'s tile goes through the zoom twice');
        const r = J(`(function(){ __on(); const a = [fluxTileAtScreen(700, 300), (function(){ const p = techScreenToWorld(700, 300); return [Math.round(p.x), Math.round(p.y)]; })()]; __off(); return a; })()`);
        same(r[0].join(), r[1].join(), 'FLUX MOVE\'s tile and the technicians\' under the zoom');
    });

    group('THE FLOOR: drawn first, then what is written on it, then all that stands on it');
    check('in a fight the floor\'s tiles on your level sort before everything; not out of a fight, and not a floor on another level (a deck over a floor stays as it was)', () => {
        const r = J(`(function(){ __mid(); const lv = facilityHeightAt(player.x, player.y, _fp.F), mine = world.find(t => Math.abs(t.x - player.x) < 3 && Math.abs(t.y - player.y) < 3 && Math.abs(facilityHeightAt(t.x, t.y, _fp.F) - lv) < 0.01),
                other = world.find(t => Math.abs(facilityHeightAt(t.x, t.y, _fp.F) - lv) > 0.5);
            __off(); const a = [drawDepthOf(mine), drawDepthOf(other)]; __on(); frame++; const b = [drawDepthOf(mine), drawDepthOf(other)]; __off();
            return { a, b, mine: mine.x + mine.y, other: other.x + other.y, F0: BV_FLOOR0 }; })()`);
        same(r.a.join(), [r.mine, r.other].join(), 'out of a fight'); same(r.b.join(), [r.mine + r.F0, r.other].join(), 'in a fight (your level first; another level as it was)');
    });
    check('written on the floor in a fight: each fighter\'s tile lit (green yours, red theirs); before a creature its bar, its level (LV) and its element\'s tag; no bar for a follower; STUNNED by a stunned one; WEAK! where a weakness was hit, shaking; all over the floor and under all that stands', () => {
        const r = J(`(function(){ __calm(); __mid(); __on(); frame++; const o = {}, foe = __foe(2, 1), mate = __mate(-1, 1); foe.element = 'fire'; foe.level = 7; foe.stunned = 40;
            const fireCol = ELEMENTS.find(e => e.id === 'fire').color, list = [], weak = { world: true, x: foe.x, y: foe.y, text: 'SLASHING WEAK!', life: 40 }, keepT = floatingTexts; floatingTexts = [weak];
            try { battleViewDecals(list); } finally { floatingTexts = keepT; }
            const rec = { texts: [], strokes: [], rects: [] }, keep = { fillText: ctx.fillText, stroke: ctx.stroke, strokeRect: ctx.strokeRect };
            ctx.fillText = (t, x, y) => rec.texts.push(String(t) + '@' + Math.round(x * 10) / 10); ctx.stroke = () => rec.strokes.push(ctx.strokeStyle); ctx.strokeRect = () => rec.rects.push(ctx.strokeStyle);
            const drawn = []; try { for (const it of list) { rec.texts = []; rec.strokes = []; rec.rects = []; drawFacilityItem(it); drawn.push({ depth: it.depth, texts: rec.texts.map(s => s.split('@')[0]), strokes: rec.strokes.slice(), rects: rec.rects.slice() }); }
                const w = list.find((it, i) => drawn[i].texts.indexOf('WEAK!') >= 0); rec.texts = []; frame += 1; w.draw(); const x1 = rec.texts[0]; frame += 1; w.draw(); const x2 = rec.texts[1]; o.shake = !!x1 && !!x2 && x1 !== x2;
            } finally { Object.assign(ctx, keep); }
            o.kinds = list.map(it => it.fp).join(); o.lit = drawn.filter(d => d.strokes.indexOf('#4dff9a') >= 0).length + ',' + drawn.filter(d => d.strokes.indexOf('#ff5a4a') >= 0).length;
            o.bars = drawn.filter(d => d.texts.some(t => /^LV/.test(t))).map(d => d.texts.join('|') + ':' + (d.rects.indexOf(fireCol) >= 0)); o.words = drawn.map(d => d.texts.filter(t => t === 'STUNNED' || t === 'WEAK!').join()).filter(Boolean).sort();
            o.depths = drawn.every(d => d.depth > BV_FLOOR0 + 1e4 && d.depth < -1e4);
            foe.stunned = 0; _bvDraw.fightersAt = -1; frame++; const l2 = []; floatingTexts = []; try { battleViewDecals(l2); } finally { floatingTexts = keepT; } o.after = l2.length;
            followers.splice(followers.indexOf(mate), 1); actors = actors.filter(a => a !== mate); __calm(); __off(); return o; })()`);
        same(r.kinds.split(',').every(k => k === 'bvdecal'), true, 'what was written: ' + r.kinds); same(r.lit, '1,1', 'lit tiles (yours, theirs)');
        same(JSON.stringify(r.bars), JSON.stringify(['LV7:true']), 'the bars by the level they carry and their element\'s tag (one, the creature\'s)');
        same(r.words.join(' '), 'STUNNED WEAK!', 'the floor\'s words'); same(r.shake, true, 'WEAK! stands still'); same(r.depths, true, 'not between the floor and what stands on it');
        same(r.after, 3, 'with the stun over and no weakness hit: two lit tiles and the bar');
    });

    group('THE WORDS: no names over the units; WEAK and STUNNED on the floor; RESIST off like nothing');
    check('no names and no small bars over the units from halfway into the view (js/draw.js asks, for a creature and a follower)', () => {
        const D = rd('js/draw.js');
        same((D.match(/const _bvHud = typeof battleHidesUnitHud === "function" && battleHidesUnitHud\(actor\);/g) || []).length, 2, 'the two unit drawers do not ask');
        ok(/if \(!_bvHud\) drawHealthBar\(/.test(D) && /if \(!_bare && !_bvHud\) drawHealthBar\(/.test(D), 'the small bars are drawn');
        ok(/if \(!_bvHud && typeof drawUnitTag === "function"/.test(D) && /if \(!_bare && !_bvHud && typeof drawUnitTag === "function"\)/.test(D), 'the names are drawn');
        const r = J(`(function(){ __calm(); __mid(); const foe = __foe(2, 0), seen = [], keepB = drawHealthBar, keepT = drawUnitTag; drawHealthBar = () => seen.push('bar'); drawUnitTag = () => seen.push('tag');
            const o = {}; try { __off(); _drawPredatorBars(foe, 600, 400, ctx); o.off = seen.splice(0).join(); _bv.k = 0.4; _drawPredatorBars(foe, 600, 400, ctx); o.little = seen.splice(0).join(); __on(); _drawPredatorBars(foe, 600, 400, ctx); o.on = seen.splice(0).join(); }
            finally { drawHealthBar = keepB; drawUnitTag = keepT; } __calm(); __off(); return o; })()`);
        same(JSON.stringify(r), JSON.stringify({ off: 'bar,tag', little: 'bar,tag', on: '' }), 'over a creature (out, a little in, in)');
    });
    check('WEAK (any part\'s) and STUNNED are not drawn in the air in a fight; RESIST is drawn small (11 px) and pale, drifting off and fading; the other words on the world are the view\'s too; out of a fight all as they were', () => {
        const r = J(`(function(){ __mid(); const o = {}, W = { world: true, x: player.x + 1, y: player.y, text: 'SLASHING WEAK!', life: 40 }, E = { world: true, x: player.x + 1, y: player.y, text: 'FIRE WEAK!', life: 40 }, S = { world: true, x: player.x, y: player.y, text: 'STUNNED', life: 60 }, R = { world: true, x: player.x, y: player.y, text: 'FIRE RESIST', life: 40 }, N = { world: true, x: player.x, y: player.y, text: '12', life: 30 }, B = { x: 600, y: 300, text: 'SLASHING WEAK!', life: 40 };
            __on(); o.roles = [W, E, S, R, N, B].map(battleWordRole); __off(); o.off = [W, S, R].map(battleWordRole);
            __on(); const where = [], said = [], keepS = floatingTextScreen, keepF = ctx.fillText, keepT = floatingTexts; floatingTextScreen = t => { where.push(t.text); return keepS(t); }; ctx.fillText = (t, x, y) => said.push(t + '@' + ctx.font + '@' + Math.round(x) + ',' + Math.round(y) + '@' + ctx.fillStyle);
            try { floatingTexts = [W, E, S, R, N]; drawFloatingTexts(); } finally { floatingTexts = keepT; floatingTextScreen = keepS; ctx.fillText = keepF; }
            o.placed = where; o.resist = said.filter(s => /^resist@/.test(s)); const p = keepS(R); _bvDraw.life0.delete(R); R.life = 40; said.length = 0; ctx.fillText = (t, x, y) => said.push([Math.round(x - p[0]), Math.round(y - p[1]), +ctx.globalAlpha.toFixed(2)]);
            try { battleDrawResist(R, p[0], p[1]); R.life = 30; battleDrawResist(R, p[0], p[1]); R.life = 14; battleDrawResist(R, p[0], p[1]); } finally { ctx.fillText = keepF; } o.drift = said; __off(); return o; })()`);
        same(r.roles.join(), 'floor,floor,floor,resist,word,', 'in a fight (a physical weakness, an element\'s, STUNNED, RESIST, a number that is no hit\'s, a banner)');
        same(r.off.join(), ',,', 'out of a fight'); same(r.placed.join(), 'FIRE RESIST,12', 'the words drawn in the air'); ok(r.resist.length === 1 && /@bold 11px /.test(r.resist[0]) && /@#aab6c8$/.test(r.resist[0]), 'RESIST: ' + r.resist);
        same(JSON.stringify(r.drift), JSON.stringify([[0, 0, 0.85], [7, -16, 0.52], [18, -42, 0]]), 'RESIST drifting off and fading (where, how strong)');
    });

    group('OBJECTS: one in front of a fighter fades to a ghost, and still counts');
    check('in a fight an object in front of a fighter (nearer the camera, its picture over the fighter\'s) fades to a ghost over 0.2 s and comes back the same way once it hides nobody; one behind it or beside it, or out of a fight, is itself', () => {
        const r = J(`(function(){ __calm(); __mid(); const o = {}, P = _fp.items.find(i => i.fp === 'prop' && i.room === 'arena' && Math.hypot(i.x - player.x, i.y - player.y) < 12 && !_bvBig(i)) || _fp.items.find(i => i.fp === 'prop' && i.room === 'arena' && !_bvBig(i));   // (a small one: a big one stays flat all fight)
            __put(P.x - 4, P.y + 4); const foe = __foe(0, 0); foe.x = P.x - 1; foe.y = P.y - 1; const R = _bvDraw.rects, note = r => R.set(P, { at: frame, r }); __on(); frame++;
            const over = _bvUnitBox(foe.x, foe.y); note(over.slice()); o.front = battleHides(P);
            foe.x = P.x + 1; foe.y = P.y + 1; _bvDraw.fightersAt = -1; o.behind = battleHides(P); foe.x = P.x - 1; foe.y = P.y - 1; _bvDraw.fightersAt = -1;
            note([over[2] + 60, over[1], over[2] + 120, over[3]]); o.beside = battleHides(P); note(over.slice());
            const keep = _fpDrawProp, alphas = []; _fpDrawProp = () => alphas.push(+ctx.globalAlpha.toFixed(3)); ctx.globalAlpha = 1;
            try { for (let i = 0; i < BATTLE_VIEW.fade; i++) { frame++; note(over.slice()); battleViewDecals([P]); drawFacilityItem(P); } o.fadeIn = alphas.splice(0);
                foe.x = P.x + 1; foe.y = P.y + 1; for (let i = 0; i <= BATTLE_VIEW.fade; i++) { frame++; battleViewDecals([P]); drawFacilityItem(P); } o.fadeOut = alphas.splice(0);
                __off(); frame++; drawFacilityItem(P); o.plain = alphas.splice(0); } finally { _fpDrawProp = keep; R.delete(P); _bvDraw.fade.delete(_bvObj(P)); }
            o.kind = P.kind; __calm(); __mid(); return o; })()`);
        same([r.front, r.behind, r.beside].join(), 'true,false,false', 'what hides a fighter (' + r.kind + ': in front over it, behind it, in front beside it)');
        const G = J('BATTLE_VIEW.ghost'), N = J('BATTLE_VIEW.fade'), down = a => a.every((v, i) => !i || v < a[i - 1]), up = a => a.every((v, i) => !i || v > a[i - 1]);
        same(N, 12, 'the fade (frames)'); ok(r.fadeIn.length === N && r.fadeIn[0] > 0.9 && down(r.fadeIn), 'fading out frame by frame: ' + r.fadeIn); same(r.fadeIn[N - 1], G, 'its ghost after 0.2 s');
        ok(r.fadeOut.length === N + 1 && up(r.fadeOut.slice(0, N)) && r.fadeOut[N - 1] === 1 && r.fadeOut[N] === 1, 'coming back frame by frame once it hides nobody, itself after 0.2 s: ' + r.fadeOut); same(r.plain.join(), '1', 'out of a fight');
    });
    check('a faded object\'s floor is drawn (the map has none under it: a next tile\'s) with the bright outline of its tile, on the floor before all that stands; and it still stops a shot', () => {
        const r = J(`(function(){ __calm(); __mid(); const o = {};
            let P = null, line = null; for (const it of _fp.items) { if (it.fp !== 'prop' || it.room !== 'arena') continue; const s = facilityShotStop(it.x - 2, it.y, it.x + 2, it.y, it.x - 2, it.y, _fp.F); if (s && s.solid) { P = it; line = [it.x - 2, it.y, it.x + 2, it.y]; break; } }
            if (!P) return { none: true };
            __put(P.x - 4, P.y + 4); const foe = __foe(0, 0); foe.x = P.x - 1; foe.y = P.y - 1; __on(); frame++; _bvDraw.rects.set(P, { at: frame, r: _bvUnitBox(foe.x, foe.y) });
            const stop = () => { const s = facilityShotStop(line[0], line[1], line[2], line[3], line[0], line[1], _fp.F); return s ? (s.wall ? 'wall' : s.solid.id) : 'through'; };
            const list = [P]; battleViewDecals(list); const stamp = list.find(it => it.fp === 'bvdecal' && Math.abs(it.depth - (BV_STAMP0 + P.x + P.y)) < 1e-6); _bvDraw.fade.set(_bvObj(P), { f: 1, at: frame });
            const used = [], strokes = [], keepO = _fpDrawOps, keepS = ctx.stroke; _fpDrawOps = (ops, cx, cy, key) => used.push(key); ctx.stroke = () => strokes.push(ctx.strokeStyle);
            try { if (stamp) stamp.draw(); } finally { _fpDrawOps = keepO; ctx.stroke = keepS; }
            o.stamp = !!stamp; o.floor = used.length === 1 && used[0] !== P.x + ',' + P.y; o.outline = strokes.indexOf('rgba(215,235,255,0.9)') >= 0; o.stops = [stop()]; __off(); o.stops.push(stop());
            o.hides = battleHides(P); _bvDraw.rects.delete(P); _bvDraw.fade.delete(_bvObj(P)); __calm(); __mid(); return o; })()`);
        ok(!r.none, 'no object in the arena stops a shot (the test needs one)');
        same(r.stamp, true, 'no floor for it'); same(r.floor, true, 'its floor is not a next tile\'s'); same(r.outline, true, 'no outline of its tile');
        same(r.stops[0], r.stops[1], 'a shot through it in the fight'); ok(r.stops[0] !== 'through', 'the shot went through'); same(r.hides, false, 'faded out of a fight');
    });

    check('a big object fades whole (build 2026-11-11i): one of its tiles hiding a fighter fades every tile of it, stepped once a frame; its outline goes round it, not between its tiles; an inner tile has the nearest floor under it', () => {
        const r = J(`(function(){ __calm(); __mid(); const o = {}, S = _fp.items.filter(i => i.fp === 'prop' && i.kind === 'semi_truck'), id = S.length && S[0].id; o.n = S.length; o.oneId = S.every(i => i.id === id);
            if (!S.length) return o; const xs = S.map(i => i.x), ys = S.map(i => i.y), x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
            __put(x1 + 3, y0 + 1); const foe = __foe(0, 0); foe.x = x1 - 0.5; foe.y = y0 - 1.5; __on(); frame++;   // (behind its front tile, near you)
            const front = S.find(i => i.x === x1 && i.y === y0), box = _bvUnitBox(foe.x, foe.y); for (const i of S) _bvDraw.rects.set(i, { at: frame, r: i === front ? box.slice() : [-9e3, -9e3, -8.9e3, -8.9e3] });
            const list = S.slice(); battleViewDecals(list); o.hides = _bvDraw.hideIds.has(id);
            const keep = _fpDrawProp, alphas = []; _fpDrawProp = () => alphas.push(+ctx.globalAlpha.toFixed(3)); ctx.globalAlpha = 1;
            try { for (const i of S) drawFacilityItem(i); } finally { _fpDrawProp = keep; } o.alphas = [...new Set(alphas)]; o.drawn = alphas.length; o.fade = +battleFadeOf(front).toFixed(4);
            const stamps = list.filter(i => i.fp === 'bvdecal' && i.depth < BV_DECAL0); let edges = 0; const keepM = ctx.moveTo, keepO = _fpDrawOps, keys = []; ctx.moveTo = () => edges++; _fpDrawOps = (ops, cx, cy, k) => keys.push(k);
            try { for (const st of stamps) st.draw(); } finally { ctx.moveTo = keepM; _fpDrawOps = keepO; }
            const set = new Set(S.map(i => i.x + ',' + i.y)); o.perimeter = S.reduce((n, i) => n + [[i.x, i.y - 1], [i.x + 1, i.y], [i.x, i.y + 1], [i.x - 1, i.y]].filter(q => !set.has(q[0] + ',' + q[1])).length, 0);
            o.edges = edges - stamps.length; o.stamps = stamps.length; o.floors = keys.length; o.ownFloor = keys.some(k => set.has(k));
            const inner = S.find(i => i.x > x0 && i.x < x1 && i.y > y0 && i.y < y1), k = inner ? _bvFloorKey(inner.x, inner.y) : null, kx = k ? k.split(',').map(Number) : null;
            o.inner = !!k && !set.has(k) && Math.max(Math.abs(kx[0] - inner.x), Math.abs(kx[1] - inner.y)) <= 6;
            for (const i of S) _bvDraw.rects.delete(i); _bvDraw.fade.delete(id); __calm(); __off(); __mid(); return o; })()`);
        ok(r.n > 4 && r.oneId, 'the semi truck is not one object of many tiles: ' + JSON.stringify(r)); same(r.hides, true, 'one tile over a fighter does not count');
        same(r.drawn, r.n, 'not every tile was drawn once'); same(r.alphas.length, 1, 'its tiles at different strengths: ' + r.alphas); ok(r.alphas[0] < 1, 'not fading');
        same(r.fade, +(1 / J('BATTLE_VIEW.fade')).toFixed(4), 'the fade stepped more than once in a frame'); same(r.stamps, r.n, 'a tile without its floor'); same(r.floors, r.n, 'a tile without a floor');
        same(r.ownFloor, false, 'a floor taken from under the object itself'); same(r.edges, r.perimeter, 'the outline is not round it (edges drawn, the edges round it)'); same(r.inner, true, 'an inner tile has no floor near');
    });
    check('what is noted of an object\'s picture as it is drawn (js/propsprites.js _psBlit): the whole sprite for a one-tile object, its own column for a tile of a big one; nothing out of the view', () => {
        const r = J(`(function(){ const keep = { i: _psImg, c: _psCell, s: _psSlice }, o = {}; _psImg = () => ({}); _psCell = () => ({ x: 0, y: 0, w: 100, h: 200, ax: 50, ay: 180 }); _psSlice = () => ({ cv: { width: 30, height: 150 }, dx: -15, dy: -140 });
            const A = { fp: 'prop', x: 30, y: 45 }, B = { fp: 'prop', x: 31, y: 45 };
            try { __on(); frame++; battleViewDrawing(A); const a = _psBlit('f', 'n', 30, 45); battleViewDrawing(B); _psBlit('f', 'n', 30, 45, [31, 45]); const g = _fpP(31, 45, 0);
                o.whole = _bvDraw.rects.get(A).r.map(Math.round).join() === [a[0], a[1], a[0] + 100, a[1] + 200].map(Math.round).join(); o.column = _bvDraw.rects.get(B).r.map(Math.round).join() === [g[0] - 15, g[1] - 140, g[0] + 15, g[1] + 10].map(Math.round).join();
                __off(); const C = { fp: 'prop', x: 32, y: 45 }; battleViewDrawing(C); _psBlit('f', 'n', 32, 45); o.off = _bvDraw.rects.has(C); }
            finally { _psImg = keep.i; _psCell = keep.c; _psSlice = keep.s; battleViewDrawing(null); __off(); } return o; })()`);
        same(JSON.stringify(r), JSON.stringify({ whole: true, column: true, off: false }), 'what was noted (a one-tile object\'s whole sprite; a big one\'s tile, its column; out of the view)');
    });

    group('THE NUMBERS (build 2026-11-11i): bigger, in their face, knocked off the way the blow went, back into the bar');
    check('one face for each damage type and one for statuses (column C); a hit\'s type is its own, else a follower\'s form\'s for that attack; a hit with none takes the status face', () => {
        const r = J(`(function(){ const f = __mate(0, 0), o = { faces: Object.keys(BV_FACES).map(k => k + '=' + battleFace(k, 25).split(',')[0]), kinds: [_bvKindOf({ type: 'piercing' }, null), _bvKindOf(null, null), _bvKindOf({ type: 'no such' }, null), _bvKindOf({ which: 'main' }, f) === (BV_FACES[dmgFormType(f, 'main')] ? dmgFormType(f, 'main') : 'status')] };
            followers.splice(followers.indexOf(f), 1); actors = actors.filter(a => a !== f); return o; })()`);
        same(r.faces.join(' | '), 'slashing=normal 400 25px "BV Bangers" | piercing=italic 900 25px "BV Barlow" | projectile=italic 700 25px "BV Chakra" | crushing=normal 400 25px "BV Titan" | earthquake=normal 400 25px "BV Dirt" | elemental=normal 900 25px "BV Cinzel" | status=normal 700 25px "BV Pixelify"', 'the faces');
        same(r.kinds.join(), 'piercing,status,status,true', 'a hit\'s face (its type; none; an unknown one; a follower\'s form\'s)');
    });
    check('the bonus in a hit (js/damage.js dmgBaseShare): a weakness\'s extra is the bonus, landing second; a resistance stays in the first part; a plain hit has none', () => {
        const r = J(`(function(){ __calm(); __mid(); const foe = __foe(2, 0), row = dmgRow(foe), kinds = ['slashing', 'piercing', 'projectile', 'crushing', 'earthquake', 'elemental'], o = {};
            for (const k of kinds) { dmgApply(foe, 10, player, null, { type: k, player: true }); o[k] = [+dmgRowMult(row, k).toFixed(3), +dmgBaseShare.toFixed(4)]; } __calm(); return o; })()`);
        let weak = 0, plain = 0, resist = 0;
        for (const [k, [m, sh]] of Object.entries(r)) { if (m > 1) { weak++; ok(Math.abs(sh - 1 / m) < 1e-3, k + ': the bonus share ' + sh + ' for ×' + m); } else { same(sh, 1, k + ' (×' + m + ') has a bonus'); if (m < 1) resist++; else plain++; } }
        ok(weak >= 1 && resist + plain >= 1, 'the test\'s creature has no weakness or no plain or resisted type: ' + JSON.stringify(r));
    });
    check('a hit\'s number knows whom it hit, its face, the way the blow went (the attacker through the target, on the screen) and the bonus in it; a hit on a creature near you brings the view on at once; a bonus keeps the number up long enough', () => {
        const r = J(`(function(){ __calm(); __mid(); __off(); const foe = __foe(2, 0); foe.health = foe.maxHealth = 900; const k = ['crushing', 'earthquake', 'slashing', 'piercing', 'projectile'].find(t => dmgRowMult(dmgRow(foe), t) > 1) || 'crushing';
            applyDamage(foe, 30, player, null, false, false, { type: k, player: true }); const t = floatingTexts[floatingTexts.length - 1], h = _bvDraw.hits.get(t), m = dmgRowMult(dmgRow(foe), k), all = Math.round(30 * m);
            const o = { on: battleViewOn(), unit: h && h.unit === foe, kind: h && h.kind === k, dir: h && h.dir.map(v => +v.toFixed(3)), all: h && h.all === all, bonus: h && h.bonus === all - Math.max(1, Math.round(all / m)), life: t.life, life0: _bvDraw.life0.get(t) };
            const sx = (2 - 0) * TILE_W, sy = (2 + 0) * TILE_H, L = Math.hypot(sx, sy); o.want = [+(sx / L).toFixed(3), +(sy / L).toFixed(3)]; __calm(); __off(); return o; })()`);
        same(r.on, true, 'the view is not on at once'); same(r.unit && r.kind && r.all && r.bonus, true, 'the tag: ' + JSON.stringify(r)); same(r.dir.join(), r.want.join(), 'the way the blow went');
        same(r.life, 2 * 20 + 8 + 2, 'a number with a bonus is not up long enough for the bonus'); same(r.life0, r.life, 'its first life is not kept');
    });
    check('a creature\'s number: knocked off along the blow, back into its bar where the health is cut by frame 20, lying flat there; the bar drops only as it lands, the piece breaking off; then the bonus slides to its own cut and lands second', () => {
        const r = J(`(function(){ __calm(); __mid(); __off(); const foe = __foe(2, 0); foe.health = foe.maxHealth = 900; const k = ['crushing', 'earthquake', 'slashing', 'piercing', 'projectile'].find(t => dmgRowMult(dmgRow(foe), t) > 1) || 'crushing';
            applyDamage(foe, 30, player, null, false, false, { type: k, player: true }); const t = floatingTexts[floatingTexts.length - 1], h = _bvDraw.hits.get(t), N = BATTLE_VIEW.num, z = () => _bv.z, o = { at: [], bar: {} };
            const keepT = ctx.translate, keepTr = ctx.transform; let cap = [], fits = []; ctx.translate = (x, y) => cap.push([x, y]); ctx.transform = (a, b, c, d) => fits.push(+c.toFixed(3));
            try { for (let age = 0; age <= 2 * N.glide + N.gone + 1; age++) {
                    if (age === 0 || age === N.knock || age === N.glide) { const S0 = _bvScr(foe.x - 0.5, foe.y - 0.5, 34), K0 = [S0[0] + h.dir[0] * N.push * z(), S0[1] + h.dir[1] * N.push * z() - 8 * z()], hp = battleBarHealth(foe, t, 'main'), B0 = _bvScr(foe.x - 0.05, foe.y - 0.05, 0), xc = -30 + 60 * hp / foe.maxHealth; o.at.push({ age, want: age === 0 ? S0 : age === N.knock ? K0 : [B0[0] + xc * z(), B0[1] - 0.5 * xc * z()] }); }
                    cap = []; fits = []; battleDrawNumber(t); const last = o.at[o.at.length - 1]; if (last && last.age === age) { last.got = cap[0]; last.fit = fits[0]; }
                    if (age === N.knock + 2) o.bar.flying = battleBarHealth(foe); if (age === N.glide) o.bar.main = battleBarHealth(foe); if (age === 2 * N.glide + 2) o.bar.both = battleBarHealth(foe);
                    if (age === N.glide) o.chunk = _bvDraw.chunks.filter(c => c.a === foe).map(c => +((c.f0 - c.f1) * foe.maxHealth).toFixed(2));
                    t.life--; frame++; } }
            finally { ctx.translate = keepT; ctx.transform = keepTr; }
            o.d = o.at.map(p => p.got ? +Math.hypot(p.got[0] - p.want[0], p.got[1] - p.want[1]).toFixed(2) : -1); o.fit = o.at.map(p => p.fit); o.health = foe.health; o.main = h.all - h.bonus; o.bonus = h.bonus; o.landed = _bvDraw.land.get(t); __calm(); __off(); return o; })()`);
        ok(r.d.every(v => v >= 0 && v < 0.6), 'where it is (at 0, at the knock\'s end, at frame 20: px off): ' + r.d); same(r.fit.join(), '0,0,1', 'lying flat only once in its bar');
        same(r.bar.flying, r.health + r.main + r.bonus, 'the bar dropped before the number landed'); same(r.bar.main, r.health + r.bonus, 'the bar as the first part lands'); same(r.bar.both, r.health, 'the bar once the bonus lands');
        same(JSON.stringify(r.chunk), JSON.stringify([r.main]), 'the piece knocked off as it lands'); ok(r.bonus >= 1 && r.landed && r.landed.main && r.landed.bonus && r.landed.bonus > r.landed.main, 'the bonus did not land second: ' + JSON.stringify(r.landed));
    });
    check('a follower\'s number: knocked off and gone (no bar on the floor); as it lands its card answers: the −N flies out of the card\'s side, the card lights and shakes, and its health moves then and not before', () => {
        const r = J(`(function(){ __calm(); __mid(); __off(); const o = {}, foe = __foe(2, 0), mate = __mate(-1, 0); mate.health = mate.maxHealth = 400; mate.spawnProtection = 0;
            const parts = { '.sb-hp u': { style: {}, className: '' }, '.sb-hpn': { textContent: '' } }, cls = new Set(), slot = { _unit: mate, style: {}, classList: { add: c => cls.add(c), remove: c => cls.delete(c) }, querySelector: q => parts[q], getBoundingClientRect: () => ({ left: 0, top: 100, right: 200, bottom: 150, width: 200, height: 50 }) }, keepE = _sbEls;
            _sbEls = { root: {}, slots: [slot] }; const N = BATTLE_VIEW.num;
            try { applyDamage(mate, 12, foe, null, false, false, { type: 'slashing' }); const t = floatingTexts[floatingTexts.length - 1], h = _bvDraw.hits.get(t); o.text = t.text; o.on = battleViewOn(); o.mine = h && h.unit === mate;
                const hp0 = mate.health, cards = [];
                for (let age = 0; age <= N.knock + N.card + 2; age++) { battleDrawNumber(t); battleCardsTick(); cards.push([age, parts['.sb-hpn'].textContent, !!slot.style.transform, cls.has('sb-hit')]); t.life--; frame++; }
                o.before = cards[N.knock - 1]; o.landed = cards[N.knock]; o.after = cards[N.knock + N.card + 2]; o.hp0 = hp0; o.pop = _bvDraw.pops.filter(p => p.f === mate).map(p => p.text + '@' + p.kind);
                o.gone = (function(){ const keepF = ctx.fillText, keepD = ctx.drawImage; let n = 0; ctx.fillText = () => n++; ctx.drawImage = () => n++; try { battleDrawNumber(t); } finally { ctx.fillText = keepF; ctx.drawImage = keepD; } return n === 0; })();
            } finally { _sbEls = keepE; followers.splice(followers.indexOf(mate), 1); actors = actors.filter(a => a !== mate); __calm(); __off(); }
            return o; })()`);
        ok(/^\u2212\d+$/.test(r.text) && r.on && r.mine, 'the number: ' + JSON.stringify(r)); const dmg = +r.text.slice(1), max = 400;
        ok(/battleDrawWords\(\); battleDrawRoster\(\); battleCardsTick\(\);/.test(rd('js/drops.js')), 'the cards are not answered after the numbers (a frame late)'); ok(/\.sb-slot\.sb-hit \{ box-shadow: inset/.test(rd('game.html')) && /body\.corners #squadBar \.sb-slot\.sb-hit::before \{ box-shadow: inset/.test(rd('game.html')), 'the card\'s light (game.html)');
        same(JSON.stringify(r.before), JSON.stringify([J('BATTLE_VIEW.num.knock') - 1, Math.round(r.hp0 + dmg) + '/' + max, false, false]), 'the card before it lands (its health as before; not lit)');
        same(JSON.stringify(r.landed), JSON.stringify([J('BATTLE_VIEW.num.knock'), Math.round(r.hp0) + '/' + max, true, true]), 'the card as it lands (its health moved; lit and shaking)');
        same(r.after[2], false, 'the card still shaking after the shake'); same(JSON.stringify(r.pop), JSON.stringify([r.text + '@slashing']), 'the −N out of the card, in its face'); same(r.gone, true, 'the number still drawn after it has gone');
    });
    check('a heal and WEAK! over one of your followers fly out of its card too, once each, WEAK! after its number; not over a creature', () => {
        const r = J(`(function(){ __calm(); __mid(); __on(); const foe = __foe(2, 0), mate = __mate(-1, 0); mate.maxHealth = 400; mate.health = 300; const f0 = frame; _bvDraw.pops = [];
            healUnit(mate, 5, null); const heal = floatingTexts[floatingTexts.length - 1]; mate._dmgWordAt = undefined; _dmgWords(mate, 'slashing', 1.5, null, 1); const weak = floatingTexts[floatingTexts.length - 1];
            foe._dmgWordAt = undefined; _dmgWords(foe, 'slashing', 1.5, null, 1); const theirs = floatingTexts[floatingTexts.length - 1];
            for (const t of [heal, weak, theirs, heal, weak]) battleRosterNote(t);
            const o = { texts: [heal.text, weak.text], pops: _bvDraw.pops.map(p => p.text + '@' + (p.at - f0) + (p.f === mate ? '' : ':not mine')) };
            followers.splice(followers.indexOf(mate), 1); actors = actors.filter(a => a !== mate); _bvDraw.pops = []; __calm(); __off(); return o; })()`);
        same(JSON.stringify(r.pops), JSON.stringify([r.texts[0] + '@0', 'WEAK!@' + J('BATTLE_VIEW.num.weakAfter')]), 'what flew out of the card (and when)');
    });
    check('the other words on the world in a fight: in the status face, a little bigger, and two at one place kept apart (the newer moves up a line)', () => {
        const r = J(`(function(){ __mid(); __on(); const a = { world: true, x: player.x + 1, y: player.y, text: 'DODGED', color: '#fff', size: 13, life: 30 }, b = { world: true, x: player.x + 1, y: player.y, text: 'DODGED', color: '#fff', size: 13, life: 40 };
            _bvDraw.life0.set(a, 40); _bvDraw.life0.set(b, 40); const keepT = ctx.translate, keepF = ctx.font; const at = []; ctx.translate = (x, y) => at.push(Math.round(y));
            const faces = []; const keepX = _bvText; _bvText = (text, font) => { faces.push(font); };
            try { battleWordQueue(a); battleWordQueue(b); battleDrawWords(); } finally { ctx.translate = keepT; _bvText = keepX; } __off(); return { at, faces, left: _bvDraw.words.length }; })()`);
        ok(r.at.length === 2 && r.at[1] < r.at[0] - 8, 'not kept apart (the older\'s place, the newer\'s): ' + r.at); same(r.faces[0].split(',')[0], 'normal 700 18px "BV Pixelify"', 'the status face, 1.35 times as big (13 px: 18)');
        ok(/^normal 700 2\dpx "BV Pixelify"/.test(r.faces[1]), 'the newest word does not pop in bigger: ' + r.faces[1]); same(r.left, 0, 'words left over');
    });

    group('FLAT IN A FIGHT (build 2026-11-11l): the big objects and the walls, as solid ground with a little of them still showing');
    check('in a fight a big object (4 tiles or more: the truck, the liquid reserves) goes flat whether it hides anyone or not; a small one only when it hides a fighter', () => {
        const r = J(`(function(){ __calm(); __mid(); __on(); frame++; const truck = _fp.items.filter(i => i.fp === 'prop' && i.kind === 'semi_truck'), tanks = _fp.items.filter(i => i.fp === 'prop' && i.kind === 'liquid_reserve' && !i.spriteOnly),
                small = _fp.items.find(i => i.fp === 'prop' && i.kind === 'barrel'); for (const i of [...truck, ...tanks, small]) _bvDraw.rects.set(i, { at: frame, r: [-9e3, -9e3, -8.9e3, -8.9e3] });
            battleViewDecals([...truck, ...tanks, small]); const o = { flat: [...new Set([...truck, ...tanks].map(i => i.id))].map(id => _bvDraw.hideIds.has(id)), small: _bvDraw.hideIds.has(small.id), tiles: BATTLE_VIEW.flat.tiles, kinds: [truck.length, tanks.length] };
            __off(); frame++; o.off = [...new Set(truck.map(i => i.id))].map(id => { battleViewDecals(truck.slice()); return battleViewOn() && _bvDraw.hideIds.has(id); });
            for (const i of [...truck, ...tanks, small]) _bvDraw.rects.delete(i); _bvDraw.fade = new Map(); return o; })()`);
        ok(r.kinds[0] > 4 && r.kinds[1] > 4, 'no truck or tanks in the arena: ' + r.kinds); same(r.tiles, 4, 'the tiles that make an object big'); same(r.flat.join(), 'true,true,true', 'the truck and both tanks (not hiding anyone)'); same(r.small, false, 'a barrel that hides nobody'); same(r.off.join(), 'false', 'out of a fight');
    });
    check('a big object\'s ghost is its whole picture, drawn once a frame by its farthest tile, unclipped, at the ghost\'s strength (each tile\'s column of it overlapping the next stacked it back up to nearly solid); out of a fight, tile by tile as ever', () => {
        const r = J(`(function(){ __calm(); __mid(); const truck = _fp.items.filter(i => i.fp === 'prop' && i.kind === 'semi_truck').sort((a, b) => a.x + a.y - b.x - b.y), id = truck[0].id, keep = { i: _psImg, c: _psCell, s: _psSlice, b: _psBlit }, calls = [];
            _psImg = () => ({}); _psCell = () => ({ x: 0, y: 0, w: 100, h: 200, ax: 50, ay: 180 }); _psSlice = () => ({ cv: { width: 30, height: 150 }, dx: -15, dy: -140 });
            _psBlit = function (fam, name, x, y, clip) { calls.push([fam, clip ? 'clip' : 'whole', +ctx.globalAlpha.toFixed(2)]); return [0, 0, { w: 100, h: 200, ax: 50, ay: 180 }]; };
            const o = {}; ctx.globalAlpha = 1;
            try { __on(); frame++; _bvDraw.fade.set(id, { f: 1, at: frame }); battleViewDecals(truck.slice()); for (const it of truck) drawFacilityItem(it); o.on = calls.splice(0);
                frame++; battleViewDecals(truck.slice()); for (const it of truck) drawFacilityItem(it); o.next = calls.splice(0).length;
                __off(); _bvDraw.fade = new Map(); frame++; for (const it of truck) drawFacilityItem(it); o.off = calls.splice(0); }
            finally { _psImg = keep.i; _psCell = keep.c; _psSlice = keep.s; _psBlit = keep.b; _bvDraw.fade = new Map(); __off(); }
            o.n = truck.length; o.offClip = o.off.every(c => c[1] === 'clip' && c[2] === 1); o.off = o.off.length; return o; })()`);
        same(JSON.stringify(r.on), JSON.stringify([['truck', 'whole', J('BATTLE_VIEW.ghost')]]), 'in a fight (its pictures drawn: family, clipped or whole, how strong)'); same(r.next, 1, 'drawn more than once in the next frame');
        same(r.off, r.n, 'out of a fight, one column a tile'); same(r.offClip, true, 'out of a fight, its columns at full strength');
    });
    check('in a fight every wall is faint (the ghost\'s strength), as are its door frames, and what hangs on it; out of a fight as ever; a wall still stops a shot', () => {
        const r = J(`(function(){ __calm(); __mid(); const W = _fp.items.find(i => i.fp === 'wall' && i.kind !== 'rock' && i.kind !== 'open'), R = _fp.items.find(i => i.fp === 'wall' && i.kind === 'rock'), D = _fp.items.find(i => i.fp === 'door'), seen = [];
            const keep = { w: _fpDrawWall, d: _fpDrawDoor }; _fpDrawWall = it => seen.push(it.kind + '@' + (+ctx.globalAlpha.toFixed(2))); _fpDrawDoor = it => seen.push('door@' + (+ctx.globalAlpha.toFixed(2)));
            const o = {}; ctx.globalAlpha = 1;
            try { __on(); for (const it of [W, R, D]) drawFacilityItem(it); o.on = seen.splice(0); __off(); for (const it of [W, R, D]) drawFacilityItem(it); o.off = seen.splice(0); } finally { _fpDrawWall = keep.w; _fpDrawDoor = keep.d; }
            const a = W.a, b = W.b, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, nx = b[1] - a[1], ny = a[0] - b[0], L = Math.hypot(nx, ny) || 1, line = [mx - nx / L, my - ny / L, mx + nx / L, my + ny / L];
            const shot = () => { const s = facilityShotStop(line[0], line[1], line[2], line[3], line[0], line[1], _fp.F); return s ? (s.wall ? 'wall' : 'solid') : 'through'; };
            __on(); o.stopOn = shot(); __off(); o.stopOff = shot(); o.kinds = [W.kind, R.kind]; return o; })()`);
        const G = J('BATTLE_VIEW.ghost');
        same(r.on.join(), [r.kinds[0] + '@' + G, 'rock@' + G, 'door@' + G].join(), 'in a fight (a wall, a rock wall, a door)'); same(r.off.join(), [r.kinds[0] + '@1', 'rock@1', 'door@1'].join(), 'out of a fight');
        same(r.stopOn, r.stopOff, 'a shot across a wall, in a fight and out'); same(r.stopOn, 'wall', 'a shot across a wall goes through');
    });

    group('FONTS: column C, shipped with the game');
    check('game.html declares the seven faces, each from its file in fonts/battle with its SIL Open Font License; the floor writes in Titan One (with a stand-in until it loads); js/battleview.js asks for it', () => {
        const G = rd('game.html'), want = [['BV Titan', 'titan-one'], ['BV Bangers', 'bangers'], ['BV Barlow', 'barlow-condensed-black-italic'], ['BV Chakra', 'chakra-petch-bold-italic'], ['BV Dirt', 'rubik-dirt'], ['BV Cinzel', 'cinzel-decorative-black'], ['BV Pixelify', 'pixelify-sans-bold', 'woff']];
        for (const [face, file, fmt = 'woff2'] of want) {
            ok(new RegExp('@font-face \\{ font-family: "' + face + '"; src: url\\("fonts/battle/' + file + '\\.' + fmt + '"\\) format\\("' + fmt + '"\\);[^}]*font-display: swap; \\}').test(G), face + ' is not declared');
            const p = path.join(ROOT, 'fonts/battle', file + '.' + fmt); ok(fs.existsSync(p) && fs.readFileSync(p).slice(0, 4).toString('latin1') === (fmt === 'woff2' ? 'wOF2' : 'wOFF'), file + '.' + fmt + ' is missing or not a ' + fmt.toUpperCase());
            const L = path.join(ROOT, 'fonts/battle/licenses', file + '-OFL.txt'); ok(fs.existsSync(L) && /SIL OPEN FONT LICENSE/i.test(fs.readFileSync(L, 'utf8')), file + '\'s licence is missing');
        }
        same(J('BV_FLOOR_FACE'), '"BV Titan", "Arial Black", Impact, sans-serif', 'the floor\'s face'); ok(/for \(const k in BV_FACES\) document\.fonts\.load\(battleFace\(k, 20\)\)/.test(rd('js/battleview.js')), 'the faces are not asked for');
        same(J('Object.values(BV_FACES).map(f => f[2]).sort()').join(), want.map(w => w[0]).sort().join(), 'the faces the numbers use are not the seven declared');
        ok(/<script src="js\/playercombat\.js\?v=[^"]+"><\/script>\n<script src="js\/battleview\.js\?v=[^"]+"><\/script>/.test(G), 'js/battleview.js is not loaded after js/playercombat.js');
        ok(/"js\/battleview\.js": "BATTLE_VIEW"/.test(G), 'the boot check does not look for it');
    });

    group('THE REAL PAGE (game.html in Chromium)');
    const real = realPage();
    if (real === null) console.log('  (no Chromium on this machine: the real page is not checked)');
    else check('the copy puts a point where bvZoomPt says; the edges darker than the middle (LOW: darkened only; HIGH: blurred and darkened); a fight in the arena turns the view on and is drawn with no errors; the seven faces load; a hit\'s number lands on its bar; the truck beside a fight is see-through', () => {
        ok(real, 'the page did not report'); ok(!real.err, 'it threw: ' + real.err); same((real.errs || []).length, 0, 'errors on the page: ' + JSON.stringify(real.errs));
        ok(real.low.dot > 230 && real.high.dot > 230, 'the dot is not where bvZoomPt puts it: ' + JSON.stringify([real.low.dot, real.high.dot]));
        ok(Math.abs(real.low.was - 128) < 12, 'the picture was not zoomed (the dot still where it was): ' + real.low.was);
        ok(Math.abs(real.low.mid - 128) < 6 && Math.abs(real.high.mid - 128) < 6, 'the middle changed: ' + JSON.stringify([real.low.mid, real.high.mid]));
        ok(real.low.corner < real.low.mid - 40 && real.high.corner < real.high.mid - 30, 'the corners are not darker: ' + JSON.stringify([real.low.corner, real.high.corner]));
        same(real.low.blur, false, 'LOW made the blur'); same(real.high.blur, true, 'HIGH made no blur');
        same(real.on, true, 'the view is not on in the fight'); same(real.z, 1.25, 'the zoom'); same(real.still, true, 'the view went out'); ok(real.fighters >= 1, 'no fighter');
        same((real.faces || ['?']).join(), '', 'faces that did not load'); same(real.landed, true, 'a hit\'s number did not land on its bar');
        same(real.truckOn, true, 'the view went out beside the truck'); ok(real.truckFlat <= real.truckSolid * 0.85, 'the truck is not see-through in a fight (its middle\'s brightness, flat and not): ' + JSON.stringify([real.truckFlat, real.truckSolid]));
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
