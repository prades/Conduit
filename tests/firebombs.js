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
            check('a tap elsewhere, or on a turret of another element, does nothing', () => { same(r.tapElsewhere, false, 'elsewhere'); same(r.iceTurret, false, 'an ice turret'); });
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
