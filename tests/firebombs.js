// FIRE BOMBS (js/firebombs.js, docs/FIRE-BOMBS.md): a bomb with a height that lands and bounces a few times, reflects off the lane's walls and a pylon, splashes the hostile where it lands and leaves the ground
// burning for 10 to 15 seconds, when everyone standing in it takes a little hit (the acid pools' rule); fire turrets throw them, down an aim you set with a tap, or at the nearest enemy on AUTO.
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
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  tutorialMode = false; gameState.running = true; _aPylons.length = 0; var t = { x: player.x + 2, y: player.y + 1, attackModeElement: 'fire', attackRange: 8 }; _aPylons.push(t);
  var s = _fireScr(t.x, t.y, 0.7); out.ring0 = !!$('#aimRing.open');
  out.tapOnTurret = fireAimTap(s[0], s[1]); out.ring = { open: !!$('#aimRing.open'), btns: $$('#aimRing .aim-b').length, auto: !!$('#aimRing .aim-auto.on') };
  $$('#aimRing .aim-b[data-aim="2"]')[0].dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(30); out.set = { aim: t.fireAim, open: !!$('#aimRing.open') };
  fireAimTap(s[0], s[1]); out.on = $('#aimRing .aim-b.on') ? $('#aimRing .aim-b.on').getAttribute('data-aim') : null;
  $('#aimRing .aim-auto').dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(30); out.auto = { aim: t.fireAim === undefined ? 'auto' : t.fireAim };
  out.tapElsewhere = fireAimTap(s[0] + 300, s[1] + 200);
  _aPylons[0].attackModeElement = 'ice'; out.iceTurret = fireAimTap(s[0], s[1]);
  // the move chooser on a fire form's INFO tab
  spawnFollowerAtCrystal('fire'); var f = followers[followers.length - 1]; f.returningToCrystal = false; f.evolved = 'embercowl'; f._moltAt = -1e9;
  unitInfoOpen(f); await wait(30);
  var chips = $$('#unitInfo .ui-choice'); out.info = { chips: chips.map(function(c){ return c.textContent; }).join(), on: $('#unitInfo .ui-choice.on') ? $('#unitInfo .ui-choice.on').textContent : null, sig: ($$('#unitInfo .ui-h').map(function(h){ return h.textContent; }).filter(function(t){ return /SIGNATURE/.test(t); })[0]) };
  chips[1].dispatchEvent(new MouseEvent('click', { bubbles: true })); await wait(50);
  out.info2 = { move: f.move, on: $('#unitInfo .ui-choice.on') ? $('#unitInfo .ui-choice.on').textContent : null, sig: ($$('#unitInfo .ui-h').map(function(h){ return h.textContent; }).filter(function(t){ return /SIGNATURE/.test(t); })[0]) };
  var pre = document.createElement('pre'); pre.id = '__fb'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 1500); });</script></body>`;
function measure() {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fb-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1100,720', '--virtual-time-budget=14000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__fb">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id)); zoneGenerated = () => true; ensureWorldTo(40);
        globalThis.__clear = () => { fireBombs.length = 0; fireTiles.clear(); actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; floatingTexts.length = 0; player.x = player.targetX = player.visualX = 3; player.y = player.targetY = player.visualY = 1; health = 100; player.invuln = 0; };
        globalThis.__land = (b, n) => { const out = []; let was = 0; for (let i = 0; i < (n || 600) && fireBombs.indexOf(b) >= 0; i++) { const z0 = b.z; frame++; fireBombsTick(); if (fireBombs.indexOf(b) >= 0 && b.z === 0) out.push([+b.x.toFixed(2), +b.y.toFixed(2)]); else if (fireBombs.indexOf(b) < 0) out.push('burst'); } return out; };`);
    run('__clear();');

    group('THE BOMB');
    check('it lands where it was thrown (the first landing is the distance asked for), under gravity, never below the floor', () => {
        run('__clear(); globalThis.__b = throwFireBomb(8, 1, 1, 0, 4, {});');
        let minZ = 9, firstLand = null; for (let i = 0; i < 200 && !firstLand; i++) { run('frame++; fireBombsTick();'); minZ = Math.min(minZ, run('__b.z')); if (run('__b.z') === 0) firstLand = run('__b.x'); }
        ok(firstLand !== null, 'it never landed'); ok(Math.abs(firstLand - 12) < 0.6, 'landed at x=' + firstLand + ', asked for 12'); ok(minZ >= 0, 'it went through the floor: ' + minZ);
    });
    check('it bounces FIRE_BOUNCES times (each lower and shorter than the last), then bursts and is gone', () => {
        run('__clear(); globalThis.__b = throwFireBomb(8, 1, 1, 0, 3, {});');
        let landings = 0, was = false, heights = [], peak = 0;
        for (let i = 0; i < 600 && run('fireBombs.indexOf(__b) >= 0'); i++) { run('frame++; fireBombsTick();'); const z = run('__b ? __b.z : 0'); peak = Math.max(peak, z); if (z === 0 && !was && run('fireBombs.indexOf(__b) >= 0')) { landings++; heights.push(peak); peak = 0; } was = z === 0; }
        same(run('fireBombs.indexOf(__b) >= 0'), false, 'still flying'); same(landings, run('FIRE_BOUNCES'), 'bounces'); ok(heights.every((h, i) => i === 0 || h < heights[i - 1]), 'each bounce is lower than the last: ' + heights);
    });
    check('it reflects off the lane\'s side walls (the sideways speed turns round) and off a pylon in its way', () => {
        run('__clear(); globalThis.__b = throwFireBomb(8, 3.5, 0.3, 1, 5, { bounces: 1 }); globalThis.__vy0 = __b.vy;');
        let flipped = false; for (let i = 0; i < 120; i++) { run('frame++; fireBombsTick();'); if (run('__b.vy') < 0) { flipped = true; break; } }
        ok(flipped, 'it went through the front wall'); ok(run('__b.y') <= run('FIRE_LANE_MAX') + 0.01, 'it is outside the lane: ' + run('__b.y'));
        run('__clear(); const t = getTile(10, 1); t.pillar = true; globalThis.__t = t; globalThis.__b = throwFireBomb(8, 1, 1, 0, 6, { bounces: 3 }); __b.z = 0.3; __b.vz = 0.01;');
        let bounced = false; for (let i = 0; i < 40; i++) { run('frame++; fireBombsTick();'); if (run('__b.vx') < 0) { bounced = true; break; } } run('__t.pillar = false;');
        ok(bounced, 'it went through the pylon');
    });
    check('a landing splashes the HOSTILE next to it (and sets it burning), and not your own', () => {
        run(`__clear(); const E = new Predator('scout', Object.assign({}, getClassDef(SPECIES[Object.keys(SPECIES)[0]], 'scout') || SPECIES[Object.keys(SPECIES)[0]].scout, { color: '#f00' }), 12, 1); E.team = 'red'; E.className = 'scout'; E.state = 'hunt'; E.provoked = true; E.health = E.maxHealth = 1000; actors.push(E); globalThis.__E = E;
            spawnFollowerAtCrystal('ice'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.x = 12.2; f.y = 1; f.health = f.maxHealth = 1000; globalThis.__F = f;
            globalThis.__b = throwFireBomb(8, 1, 1, 0, 4, { dmg: 40, bounces: 0 });`);
        for (let i = 0; i < 80 && run('fireBombs.indexOf(__b) >= 0'); i++) run('frame++; fireBombsTick();');
        ok(run('__E.health') < 1000, 'the enemy was not hurt'); ok(run('__E.burning') > 0, 'the enemy is not burning'); same(run('__F.health'), 1000, 'the bomb hurt your own follower');
    });

    group('THE BURNING GROUND');
    check('a burst lights the ground; it burns 10 to 15 seconds and then it is gone', () => {
        run('__clear(); globalThis.__b = throwFireBomb(8, 1, 1, 0, 3, { bounces: 0 });'); for (let i = 0; i < 80 && run('fireBombs.indexOf(__b) >= 0'); i++) run('frame++; fireBombsTick();');
        const n = run('fireTiles.size'); ok(n >= 1, 'nothing is burning'); const spans = J('[...fireTiles.values()].map(t => t.until - t.born)'); ok(spans.every(s => s >= 600 && s <= 900), 'burn time ' + spans);
        run('frame += 901; fireBombsTick();'); same(run('fireTiles.size'), 0, 'the fire did not go out');
    });
    check('everyone on the fire takes a little hit every half second: an enemy, your follower and you; someone off it does not', () => {
        run(`__clear(); const mk = (el, x) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.x = x; f.y = 1; f.health = f.maxHealth = 1000; return f; };
            globalThis.__on = mk('ice', 9); globalThis.__off = mk('core', 12); frame = 3000; igniteFireTile(9, 1, 5); player.x = player.targetX = player.visualX = 9; player.y = 1; player.invuln = 0; health = 100;`);
        run('fireBombsTick();'); ok(run('__on.health') < 1000, 'the follower on the fire was not hurt'); same(run('__off.health'), 1000, 'someone off the fire was hurt'); ok(run('health') < 100, 'you were not hurt by it');
        const h1 = run('__on.health'); run('frame = 3015; fireBombsTick();'); same(run('__on.health'), h1, 'it hit between the half-second ticks');
        run('frame = 3030; fireBombsTick();'); ok(run('__on.health') < h1, 'it did not hit again after half a second');
    });
    check('lighting a tile again refreshes it (no pile-up), a tile outside the lane or under a pylon does not burn, and the fire is capped', () => {
        run('__clear(); igniteFireTile(8, 1, 3); frame += 400; igniteFireTile(8, 1, 6);'); same(run('fireTiles.size'), 1, 'two fires on one tile'); same(run('fireTiles.get("8,1").dmg'), 6, 'the harder hit is kept');
        same(run('igniteFireTile(8, 9, 3)'), false, 'outside the lane'); same(run('igniteFireTile(8, -3, 3)'), false, 'behind the back wall');
        run('getTile(11, 1).pillar = true;'); same(run('igniteFireTile(11, 1, 3)'), false, 'under a pylon'); run('getTile(11, 1).pillar = false; __clear();');
        run('for (let i = 0; i < 400; i++) igniteFireTile(i % 40, i % 5 - 1, 3);'); ok(run('fireTiles.size') <= run('FIRE_BURN_CAP'), 'cap ' + run('fireTiles.size'));
    });

    group('THE FIRE TURRET');
    check('fire turrets throw a bomb and plain turrets still shoot a straight round (the turret loop)', () => {
        const src = rd('js/game.js'); ok(/_el === "fire" && typeof fireTurretThrow === "function"\) \{ fireTurretThrow\(t, nearest, _ox, _oy, _dmg, !!_U\); return; \}/.test(src), 'the turret loop does not throw bombs for fire');
        ok(src.indexOf('fireTurretThrow(t, nearest') < src.indexOf('turretShots.push({ x: _ox'), 'the bomb is after the straight round');
    });
    check('AUTO throws at the nearest enemy; an aim throws down that direction, at least 2.5 tiles and at most most of the range', () => {
        run('__clear(); globalThis.__T = { x: 8, y: 1, attackRange: 8, attackModeElement: "fire" }; globalThis.__tg = { x: 12, y: 1 };');
        run('fireBombs.length = 0; fireTurretThrow(__T, __tg, 8, 1, 20, false);'); const a = J('fireBombs[0]'); ok(a.vx > 0 && Math.abs(a.vy) < 1e-9, 'AUTO did not throw at the target: ' + JSON.stringify([a.vx, a.vy]));
        run('fireBombs.length = 0; __T.fireAim = 4; fireTurretThrow(__T, __tg, 8, 1, 20, false);'); const s = J('fireBombs[0]'); ok(s.vy !== 0 || s.vx !== 0, 'no throw'); const d = J('fireAimDir(4)');
        ok(Math.abs(d[0] * s.vy - d[1] * s.vx) < 1e-6 && d[0] * s.vx + d[1] * s.vy > 0, 'it did not throw down its aim (S): ' + JSON.stringify([d, s.vx, s.vy]));
        run('fireBombs.length = 0; __T.fireAim = 0; __tg.x = 8.4; fireTurretThrow(__T, __tg, 8, 1, 20, false);'); const sp = Math.hypot(J('fireBombs[0].vx'), J('fireBombs[0].vy')); ok(sp > 0.02, 'a near target must still throw 2.5 tiles: ' + sp);
    });
    check('the eight directions are eight directions (a turn of 45 degrees on the screen each, no two alike)', () => {
        const dirs = J('[0,1,2,3,4,5,6,7].map(fireAimDir)'); ok(dirs.every(d => Math.abs(Math.hypot(d[0], d[1]) - 1) < 1e-9), 'not unit vectors');
        const seen = new Set(dirs.map(d => d.map(v => v.toFixed(3)).join())); same(seen.size, 8, 'two directions alike'); const a = dirs[0], b = dirs[4]; ok(Math.abs(a[0] + b[0]) < 1e-9 && Math.abs(a[1] + b[1]) < 1e-9, 'N and S are not opposite');
    });
    check('the aim is saved with the pylon and restored', () => { ok(/fireAim: t\.fireAim === undefined \? null : t\.fireAim/.test(rd('js/save.js')), 'not saved'); ok(/saved\.fireAim !== undefined && saved\.fireAim !== null\) tile\.fireAim = saved\.fireAim/.test(rd('js/init.js')), 'not restored'); });
    check('burning ground is painted by each floor tile, and the bombs and aim arrows are drawn above the world', () => {
        const g = rd('js/game.js'); ok((g.match(/drawFireOnTile\(obj\.x, obj\.y, px, py\)/g) || []).length >= 2, 'floor tiles do not paint the fire'); ok(/drawFireBombs\(\); drawFireAims\(\)/.test(g), 'bombs not drawn'); ok(/fireBombsTick\(\)/.test(g), 'not ticked');
    });

    group('FIRE FOLLOWERS');
    check('a fire follower\'s SPECIAL is a pair of bouncing bombs at its target (it was a meteor), carrying the follower as their source and a bonus against nests', () => {
        run('__clear(); spawnFollowerAtCrystal("fire"); globalThis.__f = followers[followers.length - 1]; __f.returningToCrystal = false; __f.x = 8; __f.y = 1; globalThis.__tg = { x: 12, y: 1, dead: false };');
        same(J('ELEMENT_ATTACKS.fire.special(__f, __tg).hit'), true, 'hit'); same(run('fireBombs.length'), 2, 'bombs'); ok(run('fireBombs.every(b => b.src === __f && b.nestDmg > 0 && b.vx > 0)'), 'source / nests / direction');
        ok(!/type: "meteor"/.test(rd('js/elements.js').slice(rd('js/elements.js').indexOf('special(actor, target)'), rd('js/elements.js').indexOf('// ── ELECTRIC'))), 'the meteor is still there');
        same(J('ELEMENT_ATTACKS.fire.special(__f, null).hit'), false, 'no target');
    });
    check('a bomb that bursts by a live nest hurts it (the meteor\'s fire bonus on nests)', () => {
        run('__clear(); globalThis.__nest = world.find(t => t.nest) || (function(){ const t = getTile(14, 0); t.nest = true; t.nestHealth = 500; return t; })(); __nest.nestHealth = 500;');
        run('globalThis.__b = throwFireBomb(__nest.x - 3, __nest.y + 0.5, 1, 0, 3, { dmg: 20, bounces: 0, nestDmg: 40 });'); for (let i = 0; i < 80 && run('fireBombs.indexOf(__b) >= 0'); i++) run('frame++; fireBombsTick();');
        ok(run('__nest.nestHealth') < 500, 'the nest was not hurt: ' + run('__nest.nestHealth'));
    });
    check('FIRE BOMBS is a second move of the fire forms (their own move stays the default), three bombs fanned at the nearest foe in reach, then a cooldown', () => {
        for (const id of ['bloom', 'quillstone', 'halo', 'embercowl']) { const ids = J('evoMoveIds(EVOLUTIONS.' + id + ')'); same(ids.length, 2, id + ' moves'); same(ids[1], 'bomb_lob', id + ' second'); ok(ids[0] !== 'bomb_lob', id + ': the default is not the bombs'); }
        for (const id of ['maw', 'staticorb', 'seeper', 'voidstar']) ok(J('evoMoveIds(EVOLUTIONS.' + id + ')').indexOf('bomb_lob') < 0, id + ' got the fire move');
        run('__clear(); spawnFollowerAtCrystal("fire"); globalThis.__f = followers[followers.length - 1]; __f.evolved = "embercowl"; __f.x = 8; __f.y = 1; __f.power = 20;');
        same(run('MOVES.bomb_lob.fn(__f)'), false, 'with no foe'); same(run('fireBombs.length'), 0, 'bombs thrown at nothing');
        run(`globalThis.__E = new Predator('scout', Object.assign({}, getClassDef(SPECIES[Object.keys(SPECIES)[0]], 'scout') || SPECIES[Object.keys(SPECIES)[0]].scout, { color: '#f00' }), 12, 1); __E.team = 'red'; __E.className = 'scout'; __E.state = 'hunt'; __E.provoked = true; actors.push(__E);`);
        same(run('MOVES.bomb_lob.fn(__f)'), true, 'with a foe'); same(run('fireBombs.length'), 3, 'bombs'); same(run('__f._sigCd'), run('FIRE_BARRAGE_EVERY'), 'cooldown');
    });
    check('the chosen move is the one that fires, is kept with the follower through a respawn and a save, and is ignored once the form cannot use it', () => {
        run('__clear(); spawnFollowerAtCrystal("fire"); globalThis.__f = followers[followers.length - 1]; __f.evolved = "embercowl";'); same(run('evoMoveOf(__f).id'), 'hexfire', 'default');
        run('__f.move = "bomb_lob";'); same(run('evoMoveOf(__f).id'), 'bomb_lob', 'chosen'); run('__f.evolved = "maw";'); same(run('evoMoveOf(__f).id'), 'chomp', 'not for another form');
        const g = rd('js/game.js') + rd('js/waves.js'); ok(/move: a\.move \|\| undefined/.test(g) && /npc\.move = entry\.move/.test(g) && /npc\.move = entry\.move/.test(rd('js/waves.js')), 'move not saved');
    });
    check('the INFO tab lists the form\'s moves with the current one lit (the data)', () => {
        run('__clear(); spawnFollowerAtCrystal("fire"); globalThis.__f = followers[followers.length - 1]; __f.evolved = "quillstone";');
        const sec = J('followerInfo(__f).attacks.find(s => s.h === "MOVE").choices.map(c => [c.label, c.on])'); same(JSON.stringify(sec), JSON.stringify([['QUILL BURST', true], ['FIRE BOMBS', false]]), 'choices');
        run('__f.move = "bomb_lob";'); same(J('followerInfo(__f).attacks[1].h'), 'SIGNATURE \u00b7 FIRE BOMBS', 'the signature section follows the choice');
        run('__f.evolved = "maw"; delete __f.move;'); same(run('followerInfo(__f).attacks.some(s => s.h === "MOVE")'), false, 'a form with one move has no chooser');
    });

    group('A FIRE PYLON DESTROYED');
    check('THE ASK: a destroyed pylon of fire leaves a little fire (its tile and the four round it) that burns 2.5 to 4 seconds, and a pylon of another element leaves none', () => {
        run('__clear(); frame = 5000; globalThis.__p = { x: 9, y: 1, attackModeElement: "fire", pillar: true };  getTile(9, 1).pillar = true;');
        same(run('fireOnPylonDestroyed(__p)'), true, 'fire'); same(run('fireTiles.size'), 5, 'tiles'); const spans = J('[...fireTiles.values()].map(t => t.until - t.born)'); ok(spans.every(x => x >= 150 && x <= 240), 'burn time ' + spans);
        ok(run('fireTiles.has("9,1")'), 'its own tile is not burning'); run('getTile(9, 1).pillar = false;');
        run('__clear(); frame = 6000;'); same(run('fireOnPylonDestroyed({ x: 9, y: 1, attackModeElement: "ice" })'), false, 'ice'); same(run('fireTiles.size'), 0, 'ice left a fire'); same(run('fireOnPylonDestroyed(null)'), false, 'null');
    });
    check('it goes out in a few seconds, and everybody on it takes the little hit meanwhile: an enemy, your follower and you', () => {
        run(`__clear(); frame = 6000; spawnFollowerAtCrystal('ice'); globalThis.__f = followers[followers.length - 1]; __f.returningToCrystal = false; __f.x = 9; __f.y = 1; __f.health = __f.maxHealth = 1000;
            player.x = player.targetX = player.visualX = 10; player.y = 1; player.invuln = 0; health = 100; fireOnPylonDestroyed({ x: 9, y: 1, attackModeElement: 'fire' });`);
        run('frame = 6030; fireBombsTick();'); ok(run('__f.health') < 1000, 'the follower on the fire was not hurt'); ok(run('health') < 100, 'you were not hurt (you stood on a neighbouring tile of it)');
        run('frame = 6000 + 241 + 30; fireBombsTick();'); same(run('fireTiles.size'), 0, 'it has not gone out after four seconds');
    });
    check('the game lights it where a wreck is made (the pending destruction pass), only for fire', () => {
        const g = rd('js/game.js'); const i = g.indexOf('if(p.destroyed)return; p.destroyed=true;'); ok(i > 0 && /fireOnPylonDestroyed\(p\)/.test(g.slice(i, i + 260)), 'the hook is not where the wreck is made');
    });

    group('THE AIM RING (real browser)');
    const r = measure();
    if (r === null) console.log('  (no Chromium here: skipped)');
    else {
        check('the instrument ran', () => ok(r, 'the probe produced nothing'));
        if (r) {
            check('tapping a fire turret opens a ring of eight directions and AUTO (and the tap is spent); a pick sets the aim and closes it', () => {
                same(r.ring0, false, 'open before'); same(r.tapOnTurret, true, 'tap'); same(r.ring.open, true, 'open'); same(r.ring.btns, 9, 'buttons'); same(r.ring.auto, true, 'AUTO lit at the start');
                same(r.set.aim, 2, 'aim'); same(r.set.open, false, 'closed after the pick'); same(r.on, '2', 'the pick is lit when reopened'); same(r.auto.aim, 'auto', 'AUTO clears it');
            });
            check('on a fire form\'s INFO tab the moves are buttons: tap FIRE BOMBS and it is the move (and the page says so)', () => {
                same(r.info.chips, 'HEXFIRE,FIRE BOMBS', 'chips'); same(r.info.on, 'HEXFIRE', 'lit'); ok(/HEXFIRE/.test(r.info.sig), 'signature ' + r.info.sig); same(r.info2.move, 'bomb_lob', 'chosen'); same(r.info2.on, 'FIRE BOMBS', 'lit after'); ok(/FIRE BOMBS/.test(r.info2.sig), 'signature after ' + r.info2.sig);
            });
            check('a tap elsewhere, or on a turret of another element, does nothing', () => { same(r.tapElsewhere, false, 'elsewhere'); same(r.iceTurret, false, 'an ice turret'); });
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
