// WHERE A TAP MAY SEND YOU, AND THE FIVE-TILE STEP (js/facilityplay.js facilityTapAllowed, facilityTapRefused, facilityUnderPressure, facilityCapPath, facilityTapCap, FP_MOVE; js/input.js handleInput;
// js/settings.js COMBAT STEP).
// ASKED (2026-11-01): "Fix the issue where clicking outside the player's current room causes the character to pathfind across the map. Prevent movement commands into rooms the player has not entered. Validate
// movement destinations against the player's current room. Clicking outside the valid movement area should be ignored. Prevent accidental long-distance pathfinding. Preserve legitimate movement through doorways
// and authorized room transitions." And a prototype: "Limit movement commands to approximately five spaces per movement interval [...] Do not make exploration unnecessarily frustrating."
// Real taps go through handleInput (screen to tile, as a finger's would); the walks the game makes for its own reasons (a station, a launcher's pad) call facilityWalkTo and are not limited.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
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
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860; playerAttackMode = false;');
    // fixtures: stand somewhere (the camera with you), a real tap on a tile (handleInput from the screen point a finger would press), the length of the route you were given, a creature that has turned on you
    run(`globalThis.__stand = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; player.lastHitAt = 0; };
        globalThis.__tap = (gx, gy) => { const a = gx - player.visualX, b = gy - player.visualY, ex = (a - b) * TILE_W + canvas.width / 2, ey = (a + b) * TILE_H + canvas.height / 2 + TILE_H; floatingTexts.length = 0; _fp.tapNoAt = 0; handleInput(ex, ey); };   // (each tap a fresh one: the ✕ is held back only within a flurry of taps)
        globalThis.__route = () => { const p = player.fpPath; if (!p || !p.length) return 0; let x = player.x, y = player.y, n = 0; for (const q of p) { n += Math.hypot(q[0] - x, q[1] - y); x = q[0]; y = q[1]; } return n; };
        globalThis.__cells = room => partyRoomCells(room);
        globalThis.__noFoes = () => { actors = actors.filter(a => !(a instanceof Predator) || a.isClone || a.team === 'green'); };
        globalThis.__foe = (x, y, hunting) => { const a = spawnCreature({ species: 'ant', className: 'scout' }); a.x = x; a.y = y; a.team = 'red'; a.dead = false; a.moveSpeed = 0; a.baseMoveSpeed = 0; a.health = a.maxHealth = 1e7; a.update = () => {};
            if (hunting) { a.provoked = true; a.state = 'attack'; a.currentTarget = player; } else { a.provoked = false; a.state = 'wander'; } return a; };
        globalThis.__room = (x, y) => facilityRoomIdAt(x, y);`);
    // the places: the hallway's two far ends (one room, a C round the lab), a cell of the Crystal Chamber, the doorway between them
    const P = J(`(function(){ const H = __cells('lab_hallway'), C = __cells('crystal_chamber'); const o = _fp.F.openings.find(q => q.rooms.indexOf('crystal_chamber') >= 0 && q.rooms.indexOf('lab_hallway') >= 0);
        const mid = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2];
        const near = (list, p, lo, hi) => list.filter(c => { const d = Math.hypot(c[0] - p[0], c[1] - p[1]); return d >= lo && d <= hi; });
        const hallDoor = near(H, mid, 1.2, 2.2)[0], chamberDoor = near(C, mid, 1.2, 2.2)[0], chamberFar = C.slice().sort((a, b) => Math.hypot(b[0] - mid[0], b[1] - mid[1]) - Math.hypot(a[0] - mid[0], a[1] - mid[1]))[0];
        const hallFar = H.slice().sort((a, b) => Math.hypot(b[0] - mid[0], b[1] - mid[1]) - Math.hypot(a[0] - mid[0], a[1] - mid[1]))[0];
        const lab = __cells('experiment_lab')[0];
        return { mid, hallDoor, chamberDoor, chamberFar, hallFar, lab, door: o.id }; })()`);

    group('THE ROOM YOU ARE IN');
    check('a tap in the room you are in walks you there (the far end of the hallway: one room, all the way round)', () => {
        const r = J(`(function(){ __noFoes(); __stand(${P.hallDoor[0]}, ${P.hallDoor[1]}); __tap(${P.hallFar[0]}, ${P.hallFar[1]}); return { path: !!(player.fpPath && player.fpPath.length), to: [player.targetX, player.targetY], room: __room(player.targetX, player.targetY), x: floatingTexts.some(t => t.text === '\\u2715') }; })()`);
        same(r.path, true, 'no route'); same(r.room, 'lab_hallway', 'the room of the destination'); same(r.to.join(), P.hallFar.join(), 'the destination'); same(r.x, false, 'a ✕ for a tap that was allowed');
    });
    check('a tap in a room you are not in (the Experiment Lab from the hallway, the far side of the Crystal Chamber from the hallway) is ignored: no route, nothing called off, a small ✕ where it landed', () => {
        const r = J(`(function(){ __noFoes(); __stand(${P.hallDoor[0]}, ${P.hallDoor[1]}); player.fpPath = null; player._launchLoad = { keep: 1 };
            __tap(${P.lab[0]}, ${P.lab[1]}); const lab = { path: !!(player.fpPath && player.fpPath.length), x: floatingTexts.some(t => t.text === '\\u2715'), load: !!player._launchLoad };
            __tap(${P.chamberFar[0]}, ${P.chamberFar[1]}); const far = { path: !!(player.fpPath && player.fpPath.length), x: floatingTexts.some(t => t.text === '\\u2715') }; player._launchLoad = null; return { lab, far }; })()`);
        same(r.lab.path, false, 'a route into the lab'); same(r.lab.x, true, 'no ✕ for the lab tap'); same(r.lab.load, true, 'a refused tap called off a walk to a launcher\'s pad');
        same(r.far.path, false, 'a route to the far side of the chamber'); same(r.far.x, true, 'no ✕ for the chamber tap');
    });
    check('a flurry of refused taps shows one ✕, not one for every tap; a moment later the next one shows again', () => {
        const r = J(`(function(){ floatingTexts.length = 0; _fp.tapNoAt = 0; const f0 = frame; facilityTapRefused(100, 100); facilityTapRefused(120, 100); facilityTapRefused(140, 100); const flurry = floatingTexts.filter(t => t.text === '\\u2715').length;
            frame += 9; facilityTapRefused(160, 100); const later = floatingTexts.filter(t => t.text === '\\u2715').length; frame = f0; floatingTexts.length = 0; _fp.tapNoAt = 0; return { flurry, later }; })()`);
        same(r.flurry, 1, 'the ✕s of a flurry'); same(r.later, 2, 'the ✕s after a moment');
    });
    check('through a doorway of the room you are in, a little way into the next: allowed from either side, and from the doorway itself', () => {
        const r = J(`(function(){ __noFoes(); const o = { };
            __stand(${P.hallDoor[0]}, ${P.hallDoor[1]}); __tap(${P.chamberDoor[0]}, ${P.chamberDoor[1]}); o.in = !!(player.fpPath && player.fpPath.length) && __room(player.targetX, player.targetY) === 'crystal_chamber';
            __stand(${P.chamberDoor[0]}, ${P.chamberDoor[1]}); __tap(${P.hallDoor[0]}, ${P.hallDoor[1]}); o.out = !!(player.fpPath && player.fpPath.length) && __room(player.targetX, player.targetY) === 'lab_hallway';
            const m = _fpNearestCell(${P.mid[0]}, ${P.mid[1]}); __stand(m[0], m[1]); __tap(${P.chamberDoor[0]}, ${P.chamberDoor[1]}); const a = !!(player.fpPath && player.fpPath.length); __stand(m[0], m[1]); __tap(${P.hallDoor[0]}, ${P.hallDoor[1]}); o.door = a && !!(player.fpPath && player.fpPath.length);
            return o; })()`);
        same(r.in, true, 'into the chamber from the hallway, by its door'); same(r.out, true, 'out to the hallway from the chamber, by its door'); same(r.door, true, 'either way from the doorway itself');
    });
    check('a portal\'s doorway lies in its own room: a tap on the Sewers\' culvert from the arena is a tap in the arena (and goes through)', () => {
        const r = J(`(function(){ __noFoes(); const p = _fp.portals.find(q => q.id === 'portal_arena_sewers'); const room = p.room; const cs = __cells(room).filter(c => { const d = Math.hypot(c[0] - p.x, c[1] - p.y); return d >= 3 && d <= 5; }); const s = cs[0]; __stand(s[0], s[1]);
            return { room, inRoom: __room(p.x, p.y), allowed: facilityTapAllowed(Math.round(p.x), Math.round(p.y)) }; })()`);
        same(r.inRoom, r.room, 'the portal is not in its own room'); same(r.allowed, true, 'a tap on the culvert was refused');
    });
    check('the walks the game makes for its own reasons are not limited: facilityWalkTo still finds a route into another room (a station, a launcher\'s pad, a body)', () => {
        const r = J(`(function(){ __noFoes(); __stand(${P.hallDoor[0]}, ${P.hallDoor[1]}); const ok = facilityWalkTo(${P.chamberFar[0]}, ${P.chamberFar[1]}); return { ok, room: __room(player.targetX, player.targetY), len: __route() }; })()`);
        same(r.ok, true, 'refused'); same(r.room, 'crystal_chamber', 'the destination'); ok(r.len > 5, 'the route is ' + r.len);
    });
    check('the source: handleInput asks facilityTapAllowed before the walk and facilityTapCap after it, the walk itself unchanged (the stun and lift tests read it)', () => {
        const src = rd('js/input.js'), h = src.split('const handleInput=')[1].split('function isTapNearCrystal')[0];
        const a = h.indexOf('facilityTapAllowed(gx, gy)'), w = h.indexOf('facilityWalkTo(gx, gy)'), c = h.indexOf('facilityTapCap()');
        ok(a > 0 && w > a && c > w, 'the order: allowed ' + a + ', walk ' + w + ', cap ' + c); ok(/typeof facilityTapAllowed === "function"/.test(h) && /typeof facilityTapCap === "function"/.test(h), 'unguarded (tests/weapon.js loads input.js alone)');
    });

    group('THE FIVE-TILE STEP (a prototype; the owner: "if there\'s no enemies nearby, there\'s no limit. But if they run into an enemy, they stop if they\'re on a run, and then they\'re limited to moving 5 spaces")');
    // fixtures: a point a few tiles ahead along the route you are on and in sight of you; your steps, n of them; a hallway cell in sight between lo and hi tiles off; a cell of another room within d tiles and out of sight
    run(`globalThis.__ahead = (k) => { const p = player.fpPath; let x = player.x, y = player.y, left = k, best = null; for (const q of p || []) { const d = Math.hypot(q[0] - x, q[1] - y); for (let t = 0.5; t <= d && left - t >= 0; t += 0.5) { const z = [x + (q[0] - x) * t / d, y + (q[1] - y) * t / d]; if (_fpLos(player.x, player.y, z[0], z[1])) best = z; } left -= d; if (left <= 0) break; x = q[0]; y = q[1]; } return best; };
        globalThis.__steps = (n) => { for (let i = 0; i < n && player.fpPath && player.fpPath.length; i++) { frame++; facilityPlayerStep(); } return !!(player.fpPath && player.fpPath.length); };
        globalThis.__seen = (lo, hi) => __cells('lab_hallway').find(c => { const d = Math.hypot(c[0] - player.x, c[1] - player.y); return d >= lo && d <= hi && _fpLos(player.x, player.y, c[0], c[1]); });
        globalThis.__unseen = (d) => [...__cells('experiment_lab'), ...__cells('crystal_chamber')].find(c => Math.hypot(c[0] - player.x, c[1] - player.y) <= d && !_fpLos(player.x, player.y, c[0], c[1]));`);
    check('NO ENEMY NEAR: a tap goes the whole way, and the run gets there (exploration is not limited)', () => {
        const r = J(`(function(){ __noFoes(); __foe(${P.chamberFar[0]}, ${P.chamberFar[1]}, false); __stand(${P.hallDoor[0]}, ${P.hallDoor[1]}); __tap(${P.hallFar[0]}, ${P.hallFar[1]}); const o = { len: __route(), pressure: facilityUnderPressure(), free: player._tapRun === player.fpPath };
            o.running = __steps(2000); o.there = Math.hypot(player.x - ${P.hallFar[0]}, player.y - ${P.hallFar[1]}) < 0.01; __noFoes(); return o; })()`);
        same(r.pressure, false, 'a creature in another room counts as near'); ok(r.len > 8, 'the route is cut: ' + r.len.toFixed(2)); same(r.free, true, 'not a free run'); same(r.running, false, 'still running'); same(r.there, true, 'the run did not get there');
    });
    check('AN ENEMY NEAR: any creature not of yours within FP_MOVE.near tiles and in sight (wandering or not), or one after you within FP_MOVE.chase; not one further off, out of sight behind a wall, a sleeping or calm boss, or one of yours', () => {
        const r = J(`(function(){ const o = {}; __noFoes(); __stand(${P.hallDoor[0]}, ${P.hallDoor[1]}); const at = (c, hunting, f) => { __noFoes(); if (!c) return 'no cell'; const a = __foe(c[0], c[1], hunting); if (f) f(a); const v = facilityUnderPressure(); __noFoes(); return v; };
            o.wanderNear = at(__seen(3, FP_MOVE.near - 0.5), false); o.wanderFar = at(__seen(FP_MOVE.near + 1, FP_MOVE.near + 3), false); o.huntFar = at(__seen(FP_MOVE.near + 1, FP_MOVE.chase - 0.5), true);
            o.huntBeyond = at([player.x + FP_MOVE.chase + 2, player.y], true); o.unseen = at(__unseen(FP_MOVE.near - 0.5), false);
            o.asleep = at(__seen(2, 4), true, a => { a.bossAsleep = true; }); o.calm = at(__seen(2, 4), true, a => { a.bossCalm = true; }); o.ours = at(__seen(2, 4), false, a => { a.team = 'green'; }); o.who = (() => { const c = __seen(2, 4), a = __foe(c[0], c[1], false), n = facilityEnemyNear() === a; __noFoes(); return n; })(); return o; })()`);
        same(r.wanderNear, true, 'a wandering creature near and in sight'); same(r.wanderFar, false, 'a wandering one further off than FP_MOVE.near'); same(r.huntFar, true, 'one after you within FP_MOVE.chase');
        same(r.huntBeyond, false, 'one after you beyond FP_MOVE.chase'); same(r.unseen, false, 'one behind a wall'); same(r.asleep, false, 'a sleeping boss'); same(r.calm, false, 'a calm boss'); same(r.ours, false, 'one of yours'); same(r.who, true, 'facilityEnemyNear names it');
    });
    check('WITH ONE NEAR a tap takes you five tiles along its route at most, ending on the floor; once none is near, a tap goes the whole way again', () => {
        const r = J(`(function(){ __noFoes(); __stand(${P.hallDoor[0]}, ${P.hallDoor[1]}); const c = __seen(2, 4); const a = __foe(c[0], c[1], false); __tap(${P.hallFar[0]}, ${P.hallFar[1]});
            const o = { pressure: facilityUnderPressure(), len: __route(), end: player.fpPath ? player.fpPath[player.fpPath.length - 1] : null, free: !!player._tapRun };
            o.walkable = !!o.end && facilityWalkable(o.end[0], o.end[1], _fp.F); __noFoes(); __tap(${P.hallFar[0]}, ${P.hallFar[1]}); o.after = __route(); __noFoes(); return o; })()`);
        same(r.pressure, true, 'a creature near is not pressure'); ok(r.len > 4.9 && r.len <= 5.01, 'the route is ' + r.len.toFixed(2) + ' tiles'); same(r.walkable, true, 'the step ends off the floor'); same(r.free, false, 'a capped step is a free run');
        ok(r.after > 8, 'none near, the route is still cut: ' + r.after.toFixed(2));
    });
    check('RUNNING INTO ONE: a free run stops where it is the moment an enemy is near, with a "!" over you, short of where it was going; the tap after it goes five tiles and is not stopped by the same enemy', () => {
        const r = J(`(function(){ __noFoes(); __stand(${P.hallDoor[0]}, ${P.hallDoor[1]}); __tap(${P.hallFar[0]}, ${P.hallFar[1]}); const o = { free: !!player._tapRun }; o.before = __steps(6);
            const q = __ahead(4.5); o.ahead = !!q; const a = __foe(q[0], q[1], false); floatingTexts.length = 0; const at = [player.x, player.y]; frame++; facilityPlayerStep();
            o.stopped = !(player.fpPath && player.fpPath.length); o.moved = Math.hypot(player.x - at[0], player.y - at[1]); o.cue = floatingTexts.some(t => t.text === '!'); o.short = Math.hypot(player.x - ${P.hallFar[0]}, player.y - ${P.hallFar[1]}) > 3; o.target = [player.targetX === player.x, player.targetY === player.y];
            __tap(${P.hallFar[0]}, ${P.hallFar[1]}); o.next = __route(); o.nextFree = !!player._tapRun; const end = player.fpPath[player.fpPath.length - 1]; o.rest = __steps(200); o.reached = Math.hypot(player.x - end[0], player.y - end[1]) < 0.01; __noFoes(); return o; })()`);
        same(r.free, true, 'the first tap was not a free run'); same(r.before, true, 'the run stopped with nothing near'); same(r.ahead, true, 'no spot ahead in sight'); same(r.stopped, true, 'the run did not stop'); ok(r.moved < 0.01, 'it took a step after the enemy came near: ' + r.moved);
        same(r.cue, true, 'no "!"'); same(r.short, true, 'it stopped at the end'); same(r.target.join(), 'true,true', 'its destination was not let go'); ok(r.next > 4.9 && r.next <= 5.01, 'the next tap goes ' + r.next.toFixed(2) + ' tiles');
        same(r.nextFree, false, 'the capped step is a free run'); same(r.rest, false, 'the capped step did not finish'); same(r.reached, true, 'the capped step was stopped');
    });
    check('a hit on you just now is pressure too (a run stops, a tap is capped); a hit long ago is not', () => {
        const r = J(`(function(){ __noFoes(); __stand(${P.hallDoor[0]}, ${P.hallDoor[1]}); player.lastHitAt = frame; const now = facilityUnderPressure(); player.lastHitAt = frame - FP_MOVE.hitWindow - 5; const later = facilityUnderPressure();
            __tap(${P.hallFar[0]}, ${P.hallFar[1]}); __steps(3); player.lastHitAt = frame; frame++; facilityPlayerStep(); const stopped = !(player.fpPath && player.fpPath.length); player.lastHitAt = 0; return { now, later, stopped }; })()`);
        same(r.now, true, 'a hit just now'); same(r.later, false, 'a hit long ago'); same(r.stopped, true, 'a hit did not stop a free run');
    });
    check('the walks the game makes for its own reasons (facilityWalkTo: a station, a launcher\'s pad, a body) are never cut and never stopped, an enemy near or not', () => {
        const r = J(`(function(){ __noFoes(); __stand(${P.hallDoor[0]}, ${P.hallDoor[1]}); const c = __seen(2, 4); __foe(c[0], c[1], true); facilityWalkTo(${P.hallFar[0]}, ${P.hallFar[1]}); const o = { len: __route(), free: !!player._tapRun };
            o.running = __steps(2000); o.there = Math.hypot(player.x - ${P.hallFar[0]}, player.y - ${P.hallFar[1]}) < 0.01;
            __noFoes(); __stand(${P.hallDoor[0]}, ${P.hallDoor[1]}); __tap(${P.hallFar[0]}, ${P.hallFar[1]}); facilityWalkTo(${P.chamberDoor[0]}, ${P.chamberDoor[1]}); o.taken = !!player._tapRun; __noFoes(); return o; })()`);
        ok(r.len > 8, 'a walk of the game\'s own was cut: ' + r.len.toFixed(2)); same(r.free, false, 'a walk of the game\'s own is a free run'); same(r.running, false, 'still walking'); same(r.there, true, 'a walk of the game\'s own was stopped'); same(r.taken, false, 'a walk of the game\'s own after a tap kept the tap\'s free run');
    });
    check('the Settings\' COMBAT STEP turns it all off (and on), kept per browser: off, a tap with an enemy near goes the whole way and a run is never stopped', () => {
        const r = J(`(function(){ __noFoes(); FP_MOVE.cap = true; const row = _spLayout().rows.find(q => q.id === 'step'); const label0 = row && row.label, sub = row && row.sub;
            facilityCombatStepToggle(); const saved = localStorage.getItem(FP_MOVE.key); __stand(${P.hallDoor[0]}, ${P.hallDoor[1]}); const c = __seen(2, 4); __foe(c[0], c[1], true); __tap(${P.hallFar[0]}, ${P.hallFar[1]}); const len = __route(); const running = __steps(2000);
            const label1 = _spLayout().rows.find(q => q.id === 'step').label; facilityCombatStepToggle(); __noFoes(); return { label0, sub, label1, saved, len, running, back: FP_MOVE.cap, saved2: localStorage.getItem(FP_MOVE.key) }; })()`);
        same(r.label0, 'COMBAT STEP: 5 TILES', 'the row'); ok(/enemy near stops a run/.test(r.sub || ''), 'the row\'s line: ' + r.sub); same(r.label1, 'COMBAT STEP: OFF', 'the row, off'); same(r.saved, 'off', 'kept');
        ok(r.len > 8, 'off, the route was cut: ' + r.len.toFixed(2)); same(r.running, false, 'off, the run was stopped'); same(r.back, true, 'on again'); same(r.saved2, 'on', 'kept on');
    });
    check('the source: each of the player\'s steps asks facilityRunCheck (after a launcher\'s flight, which nothing stops), and facilityWalkTo lets go of a tap\'s free run', () => {
        const fp = rd('js/facilityplay.js'), step = fp.split('function facilityPlayerStep()')[1].split('\n}')[0], walk = fp.split('function facilityWalkTo(')[1].split('\n}')[0];
        ok(step.indexOf('player._flight') < step.indexOf('facilityRunCheck()'), 'the run check before the flight'); ok(/player\._tapRun = null/.test(walk), 'facilityWalkTo keeps a tap\'s free run');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
