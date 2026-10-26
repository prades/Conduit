// FIRE BOMBS (js/firebombs.js, docs/FIRE-BOMBS.md): a bomb with a height that lands and bounces a few times, reflects off anything that is not floor (the facility's walls and props), splashes the hostile
// where it lands and leaves the ground burning for 10 to 15 seconds, when everyone standing in it takes a little hit; a fire follower's special throws a pair, and the evolved fire forms' FIRE BOMBS move
// a fan of three (js/moves.js). The bombs fly over open arena floor (__O: x 26..48 at y 49..52, js/facilitymap.js); the rock south of it is what they bounce off.
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
// The move chooser on a fire form's INFO tab, in the real page (js/unitinfo.js).
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  gameState.running = true;
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
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; facilityBlackoutSet(false); unlockedElements = new Set(ELEMENTS.map(e => e.id)); globalThis.__O = { x: 34, y: 50 };
        globalThis.__clear = () => { fireBombs.length = 0; fireTiles.clear(); actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; ELEMENTS.forEach(e => { followerByElement[e.id] = []; }); floatingTexts.length = 0;
            player.x = player.targetX = player.visualX = __O.x - 6; player.y = player.targetY = player.visualY = __O.y; player.fpPath = null; health = PLAYER_HITS; player.invuln = 0; };`);
    run('__clear();');

    group('THE BOMB');
    check('it lands where it was thrown (the first landing is the distance asked for), under gravity, never below the floor', () => {
        run('__clear(); globalThis.__b = throwFireBomb(__O.x - 4, __O.y, 1, 0, 4, {});');
        let minZ = 9, firstLand = null; for (let i = 0; i < 200 && firstLand === null; i++) { run('frame++; fireBombsTick();'); minZ = Math.min(minZ, run('__b.z')); if (run('__b.z') === 0) firstLand = run('__b.x - __O.x'); }
        ok(firstLand !== null, 'it never landed'); ok(Math.abs(firstLand) < 0.6, 'landed ' + firstLand.toFixed(2) + ' tiles from where it was asked to'); ok(minZ >= 0, 'it went through the floor: ' + minZ);
    });
    check('it bounces FIRE_BOUNCES times (each lower and shorter than the last), then bursts and is gone', () => {
        run('__clear(); globalThis.__b = throwFireBomb(__O.x - 4, __O.y, 1, 0, 3, {});');
        let landings = 0, was = false, heights = [], peak = 0;
        for (let i = 0; i < 600 && run('fireBombs.indexOf(__b) >= 0'); i++) { run('frame++; fireBombsTick();'); const z = run('__b ? __b.z : 0'); peak = Math.max(peak, z); if (z === 0 && !was && run('fireBombs.indexOf(__b) >= 0')) { landings++; heights.push(peak); peak = 0; } was = z === 0; }
        same(run('fireBombs.indexOf(__b) >= 0'), false, 'still flying'); same(landings, run('FIRE_BOUNCES'), 'bounces'); ok(heights.every((h, i) => i === 0 || h < heights[i - 1]), 'each bounce is lower than the last: ' + heights);
    });
    check('it reflects off anything that is not floor (the sideways speed turns round at the rock) and never leaves the floor', () => {
        // Thrown south from the open floor at a wall of rock (no floor tile past y 53): it comes back off it.
        run('__clear(); globalThis.__b = throwFireBomb(__O.x, __O.y, 0, 1, 6, { bounces: 1 }); globalThis.__vy0 = __b.vy; globalThis.__off = 0;');
        let flipped = false; for (let i = 0; i < 120 && run('fireBombs.indexOf(__b) >= 0'); i++) { run('frame++; fireBombsTick(); if (fireBombs.indexOf(__b) >= 0 && !getTile(Math.round(__b.x), Math.round(__b.y))) __off++;'); if (run('__b.vy') < 0) { flipped = true; break; } }
        ok(run('__vy0') > 0, 'fixture: thrown south'); ok(flipped, 'it went through the rock'); same(run('__off'), 0, 'it was over no floor for a step');
    });
    check('a landing splashes the HOSTILE next to it (and sets it burning), and not your own', () => {
        // (the ground it lights hits EVERYONE on it every half second, the next group: the burst, 31 frames after the throw, must not fall on one of those ticks)
        run(`__clear(); frame = 1; const E = spawnCreature({ species: Object.keys(SPECIES)[0], className: 'scout', x: __O.x + 4, y: __O.y, state: 'hunt' }); E.provoked = true; E.health = E.maxHealth = 1000; globalThis.__E = E;
            spawnFollowerAtCrystal('ice'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.x = __O.x + 4.2; f.y = __O.y; f.health = f.maxHealth = 1000; globalThis.__F = f;
            globalThis.__b = throwFireBomb(__O.x, __O.y, 1, 0, 4, { dmg: 40, bounces: 0 });`);
        for (let i = 0; i < 80 && run('fireBombs.indexOf(__b) >= 0'); i++) run('frame++; fireBombsTick();');
        ok(run('__E.health') < 1000, 'the enemy was not hurt'); ok(run('__E.burning') > 0, 'the enemy is not burning'); same(run('__F.health'), 1000, 'the bomb hurt your own follower');
    });

    group('THE BURNING GROUND');
    check('a burst lights the ground; it burns 10 to 15 seconds and then it is gone', () => {
        run('__clear(); globalThis.__b = throwFireBomb(__O.x - 2, __O.y, 1, 0, 3, { bounces: 0 });'); for (let i = 0; i < 80 && run('fireBombs.indexOf(__b) >= 0'); i++) run('frame++; fireBombsTick();');
        const n = run('fireTiles.size'); ok(n >= 1, 'nothing is burning'); const spans = J('[...fireTiles.values()].map(t => t.until - t.born)'); ok(spans.every(s => s >= 600 && s <= 900), 'burn time ' + spans);
        run('frame += 901; fireBombsTick();'); same(run('fireTiles.size'), 0, 'the fire did not go out');
    });
    check('everyone on the fire takes a little hit every half second: an enemy, your follower and you; someone off it does not', () => {
        run(`__clear(); const mk = (el, x) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.x = x; f.y = __O.y; f.health = f.maxHealth = 1000; return f; };
            globalThis.__on = mk('ice', __O.x); globalThis.__off = mk('core', __O.x + 3); frame = 3000; igniteFireTile(__O.x, __O.y, 5); player.x = player.targetX = player.visualX = __O.x; player.y = player.targetY = player.visualY = __O.y; player.invuln = 0; health = PLAYER_HITS;`);
        run('fireBombsTick();'); ok(run('__on.health') < 1000, 'the follower on the fire was not hurt'); same(run('__off.health'), 1000, 'someone off the fire was hurt'); ok(run('health') < run('PLAYER_HITS'), 'you were not hurt by it');
        const h1 = run('__on.health'); run('frame = 3015; fireBombsTick();'); same(run('__on.health'), h1, 'it hit between the half-second ticks');
        run('frame = 3030; fireBombsTick();'); ok(run('__on.health') < h1, 'it did not hit again after half a second');
    });
    check('lighting a tile again refreshes it (no pile-up), a tile with no floor under it (rock, a wall, off the map) does not burn, and the fire is capped', () => {
        run('__clear(); igniteFireTile(__O.x, __O.y, 3); frame += 400; igniteFireTile(__O.x, __O.y, 6);'); same(run('fireTiles.size'), 1, 'two fires on one tile'); same(run('fireTiles.get(__O.x + "," + __O.y).dmg'), 6, 'the harder hit is kept');
        same(run('getTile(__O.x, __O.y + 4) || null'), null, 'fixture: no floor four tiles south of the open floor');
        same(run('igniteFireTile(__O.x, __O.y + 4, 3)'), false, 'the rock'); same(run('igniteFireTile(0, 0, 3)'), false, 'off the map');
        run('__clear(); let n = 0; for (const c of _fp.cells.values()) { if (n++ >= 400) break; igniteFireTile(c[0], c[1], 3); }'); ok(run('fireTiles.size') <= run('FIRE_BURN_CAP'), 'cap ' + run('fireTiles.size'));
    });

    group('WIRED INTO THE FRAME');
    check('burning ground is painted by each floor tile, the bombs are ticked and drawn above the world', () => {
        const g = rd('js/game.js'); ok((g.match(/drawFireOnTile\(obj\.x, obj\.y, px, py\)/g) || []).length >= 1, 'floor tiles do not paint the fire'); ok(/drawFireBombs\(\)/.test(g), 'bombs not drawn'); ok(/fireBombsTick\(\)/.test(g), 'not ticked');
    });

    group('FIRE FOLLOWERS');
    check('a fire follower\'s SPECIAL is a pair of bouncing bombs at its target (it was a meteor), carrying the follower as their source', () => {
        run('__clear(); spawnFollowerAtCrystal("fire"); globalThis.__f = followers[followers.length - 1]; __f.returningToCrystal = false; __f.x = __O.x; __f.y = __O.y; globalThis.__tg = { x: __O.x + 4, y: __O.y, dead: false };');
        same(J('ELEMENT_ATTACKS.fire.special(__f, __tg).hit'), true, 'hit'); same(run('fireBombs.length'), 2, 'bombs'); ok(run('fireBombs.every(b => b.src === __f && b.vx > 0)'), 'source / direction');
        ok(!/type: "meteor"/.test(rd('js/elements.js').slice(rd('js/elements.js').indexOf('special(actor, target)'), rd('js/elements.js').indexOf('// ── ELECTRIC'))), 'the meteor is still there');
        same(J('ELEMENT_ATTACKS.fire.special(__f, null).hit'), false, 'no target');
    });
    check('FIRE BOMBS is a second move of the fire forms (their own move stays the default), three bombs fanned at the nearest foe in reach, then a cooldown', () => {
        for (const id of ['bloom', 'quillstone', 'halo', 'embercowl']) { const ids = J('evoMoveIds(EVOLUTIONS.' + id + ')'); same(ids.length, 2, id + ' moves'); same(ids[1], 'bomb_lob', id + ' second'); ok(ids[0] !== 'bomb_lob', id + ': the default is not the bombs'); }
        for (const id of ['maw', 'staticorb', 'seeper', 'voidstar']) ok(J('evoMoveIds(EVOLUTIONS.' + id + ')').indexOf('bomb_lob') < 0, id + ' got the fire move');
        run('__clear(); spawnFollowerAtCrystal("fire"); globalThis.__f = followers[followers.length - 1]; __f.evolved = "embercowl"; __f.x = __O.x; __f.y = __O.y; __f.power = 20;');
        same(run('MOVES.bomb_lob.fn(__f)'), false, 'with no foe'); same(run('fireBombs.length'), 0, 'bombs thrown at nothing');
        run(`globalThis.__E = spawnCreature({ species: Object.keys(SPECIES)[0], className: 'scout', x: __O.x + 4, y: __O.y, state: 'hunt' }); __E.provoked = true;`);
        same(run('MOVES.bomb_lob.fn(__f)'), true, 'with a foe'); same(run('fireBombs.length'), 3, 'bombs'); same(run('__f._sigCd'), run('FIRE_BARRAGE_EVERY'), 'cooldown');
    });
    check('the chosen move is the one that fires, is kept with the follower through a respawn and the facility\'s save, and is ignored once the form cannot use it', () => {
        run('__clear(); spawnFollowerAtCrystal("fire"); globalThis.__f = followers[followers.length - 1]; __f.evolved = "embercowl";'); same(run('evoMoveOf(__f).id'), 'hexfire', 'default');
        run('__f.move = "bomb_lob";'); same(run('evoMoveOf(__f).id'), 'bomb_lob', 'chosen'); run('__f.evolved = "maw";'); same(run('evoMoveOf(__f).id'), 'chomp', 'not for another form');
        const g = rd('js/game.js'), s = rd('js/facilitysave.js'); ok(/move: a\.move \|\| undefined/.test(g) && /npc\.move = entry\.move/.test(g), 'the respawn queue loses the move'); ok(/move: a\.move \|\| undefined/.test(s) && /npc\.move = entry\.move/.test(s), 'the save loses the move');
    });
    check('the INFO tab lists the form\'s moves with the current one lit (the data)', () => {
        run('__clear(); spawnFollowerAtCrystal("fire"); globalThis.__f = followers[followers.length - 1]; __f.evolved = "quillstone";');
        const sec = J('followerInfo(__f).attacks.find(s => s.h === "MOVE").choices.map(c => [c.label, c.on])'); same(JSON.stringify(sec), JSON.stringify([['QUILL BURST', true], ['FIRE BOMBS', false]]), 'choices');
        run('__f.move = "bomb_lob";'); same(J('followerInfo(__f).attacks[1].h'), 'SIGNATURE · FIRE BOMBS', 'the signature section follows the choice');
        run('__f.evolved = "maw"; delete __f.move;'); same(run('followerInfo(__f).attacks.some(s => s.h === "MOVE")'), false, 'a form with one move has no chooser');
    });

    group('THE MOVE CHOOSER (real browser)');
    const r = measure();
    if (r === null) console.log('  (no Chromium here: skipped)');
    else {
        check('the instrument ran', () => ok(r, 'the probe produced nothing'));
        if (r) {
            check('on a fire form\'s INFO tab the moves are buttons: tap FIRE BOMBS and it is the move (and the page says so)', () => {
                same(r.info.chips, 'HEXFIRE,FIRE BOMBS', 'chips'); same(r.info.on, 'HEXFIRE', 'lit'); ok(/HEXFIRE/.test(r.info.sig), 'signature ' + r.info.sig); same(r.info2.move, 'bomb_lob', 'chosen'); same(r.info2.on, 'FIRE BOMBS', 'lit after'); ok(/FIRE BOMBS/.test(r.info2.sig), 'signature after ' + r.info2.sig);
            });
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
