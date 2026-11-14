// THE FORMATION (js/formation.js, js/npc.js followPlayer and the Mage's branch; build 2026-11-10b).
// The owner, 2026-11-10: "a formation function ... put the brawlers in front of the player and whatever they're looking at, ... the mage behind the player where there's some distance, ... the
// technician constantly patrolling the area around the player"; "Always while following", "Fight from their places", "Locked enemy, else your way".
//   THE PLACES     walking one way: a Brawler ends ahead of you, a Mage behind you, a Technician on its round; two Brawlers side by side; the Technician keeps going round
//   AHEAD          an enemy you have locked is ahead (the Brawler between you and it); with none, the way you last walked, kept while you stand
//   THE FIGHT      a Mage with its place shoots from behind you at an enemy ahead, and does not walk up to it; one beyond its reach it leaves to the Brawlers
//   WALLS          a place in a wall, or out of your sight, comes in toward you
//   WHO            a posted follower, one on HOLD or a job, a clone and one going home take no place
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
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    // A seeded Math.random: a follower's personality (its pace) is rolled at random, and a check should not pass or fail by its roll
    run(`Math.random = (function(){ let s = 20261110; return function(){ s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();`);
    run(`gameState.running = true; facilityBlackoutSet(false); unlockedElements = new Set(ELEMENTS.map(e => e.id)); TUT.followerLevel = 0; for (const s of hazardSolids()) facilitySolidSet(s.id, true);
        // the arena's most open patch (the cell with the most floor round it): the player stands there
        (function(){ const cells = partyRoomCells('arena'), set = new Set(cells.map(c => c[0] + ',' + c[1])); let best = null, bn = -1;
            for (const [x, y] of cells) { let n = 0; for (let dx = -6; dx <= 6; dx++) for (let dy = -6; dy <= 6; dy++) if (set.has((x + dx) + ',' + (y + dy))) n++; if (n > bn) { bn = n; best = [x, y]; } }
            globalThis.__C = [best[0] + 0.5, best[1] + 0.5]; })();
        globalThis.__put = (x, y) => { player.x = player.visualX = player.targetX = x; player.y = player.visualY = player.targetY = y; player.fpPath = null; };
        // a squad of the roles given, following, beside the player; no creatures
        globalThis.__squad = (roles) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isFollower && !a.isClone); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); followerProjectiles.length = 0;
            if (typeof targetDrop === 'function') targetDrop(); __put(__C[0], __C[1]); _fmFace.x = 1; _fmFace.y = 0; _fmFace.px = null; _fmFace.at = -1;
            const out = roles.map((role, i) => { spawnFollowerAtCrystal(['fire', 'ice', 'core'][i % 3]); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.isFollower = true; f.role = role; f.stance = 'follow'; f.post = null; f.job = null; f.x = player.x - 0.5 + 0.4 * i; f.y = player.y + 0.6; f.spawnProtection = 1e9; f.health = f.maxHealth = 1e4; f.naturalTrait = null; f.preferGroup = false; f.wanderRadius = 0; return f; });   // (no natural trait: its nudge is checked on its own below)
            return out; };
        globalThis.__tick = (n) => { for (let i = 0; i < n; i++) { frame++; for (const f of followers.slice()) if (!f.dead) updateNPC(f); } };
        // the player walks (dx, dy) a tile at a time, at its pace, the squad stepping with it
        globalThis.__walk = (dx, dy, n) => { const L = Math.hypot(dx, dy); for (let i = 0; i < n; i++) { const tx = player.x + dx / L * 0.05, ty = player.y + dy / L * 0.05; if (facilityFloorAt(tx, ty)) __put(tx, ty); __tick(1); } };
        globalThis.__foe = (x, y, calm) => { const S = SPECIES.ant, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.health = p.maxHealth = 1e6; p.update = () => {};
            if (calm) { p.state = 'wander'; p.provoked = false; } else { p.provoked = true; p.state = 'hunt'; } actors.push(p); return p; };
        globalThis.__rel = (f) => { const F = formationFront(); const ox = f.x - player.x, oy = f.y - player.y; return { ahead: ox * F.x + oy * F.y, across: -ox * F.y + oy * F.x, dist: Math.hypot(ox, oy) }; };`);

    group('THE PLACES (walking east, then standing)');
    check('a Brawler ends ahead of you, a Mage behind you at a distance, a Technician on its round about you', () => {
        const r = J(`(function(){ const [b, m, t] = __squad(['brawler', 'sniper', 'camper']); __walk(1, 0, 80); __tick(300); const o = { b: __rel(b), m: __rel(m), t: __rel(t), front: [formationFront().x, formationFront().y] };
            for (const k of ['b', 'm', 't']) for (const q of ['ahead', 'across', 'dist']) o[k][q] = Math.round(o[k][q] * 100) / 100; return o; })()`);
        ok(r.front[0] > 0.99, 'ahead is not the way you walked: ' + r.front);
        ok(r.b.ahead > 1.2 && Math.abs(r.b.across) < 0.6, 'the Brawler is not ahead of you: ' + JSON.stringify(r.b));
        ok(r.m.ahead < -2.3 && Math.abs(r.m.across) < 0.6, 'the Mage is not behind you at a distance: ' + JSON.stringify(r.m));
        ok(Math.abs(r.t.dist - J('FORMATION.ring')) < 0.6, 'the Technician is not on its round: ' + JSON.stringify(r.t));
    });
    check('the Technician keeps going round you, on its round, at its own pace', () => {
        const r = J(`(function(){ const [t] = __squad(['camper']); __tick(240); const a0 = Math.atan2(t.y - player.y, t.x - player.x), d0 = Math.hypot(t.x - player.x, t.y - player.y); __tick(240);
            const a1 = Math.atan2(t.y - player.y, t.x - player.x), d1 = Math.hypot(t.x - player.x, t.y - player.y); let da = Math.abs(a1 - a0); if (da > Math.PI) da = 2 * Math.PI - da; return { da, d0, d1 }; })()`);
        ok(r.da > 0.9, 'it did not go round: ' + r.da.toFixed(2) + ' rad in 4 s'); ok(Math.abs(r.d1 - J('FORMATION.ring')) < 0.6, 'it left the round: ' + r.d1.toFixed(2));
    });
    check('two Brawlers stand side by side across the front; two Technicians both keep to the round, going round opposite ways', () => {
        const r = J(`(function(){ const [b1, b2] = __squad(['brawler', 'brawler']); __walk(1, 0, 60); __tick(300); const o = { b1: __rel(b1), b2: __rel(b2) };
            const [t1, t2] = __squad(['camper', 'camper']); __tick(240); const ang = t => Math.atan2(t.y - player.y, t.x - player.x), a1 = ang(t1), a2 = ang(t2); __tick(60);
            const turn = (a, b) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
            o.w = [turn(a1, ang(t1)), turn(a2, ang(t2))]; o.d = [Math.hypot(t1.x - player.x, t1.y - player.y), Math.hypot(t2.x - player.x, t2.y - player.y)]; return o; })()`);
        ok(r.b1.ahead > 1.2 && r.b2.ahead > 1.2, 'a Brawler is not ahead: ' + JSON.stringify(r)); ok(Math.abs(r.b1.across - r.b2.across) > 0.8, 'the Brawlers stand on top of each other: ' + JSON.stringify(r));
        ok(r.w[0] * r.w[1] < 0, 'the Technicians go round the same way: ' + r.w.map(v => v.toFixed(2))); ok(r.d.every(d => Math.abs(d - J('FORMATION.ring')) < 0.6), 'a Technician left the round: ' + r.d.map(v => v.toFixed(2)));
    });
    check('no trait moves a place (the traits are gone: build 2026-11-14f, the owner: "Remove all four"): a follower still carrying LONE WOLF or EMPATHETIC stands where a plain one does', () => {
        const at = (trait) => J(`(function(){ const [b] = __squad(['brawler']); b.naturalTrait = ${JSON.stringify(trait)}; __walk(1, 0, 40); __tick(400); return __rel(b); })()`);
        const plain = at(null), lone = at('lone_wolf'), emp = at('empathetic');
        ok(Math.abs(lone.ahead - plain.ahead) < 0.15 && Math.abs(lone.across - plain.across) < 0.15, 'a lone wolf is still farther out: ' + lone.ahead.toFixed(2) + ' vs ' + plain.ahead.toFixed(2));
        ok(Math.abs(emp.ahead - plain.ahead) < 0.15, 'an empathetic one is still nearer: ' + emp.ahead.toFixed(2) + ' vs ' + plain.ahead.toFixed(2));
    });

    group('AHEAD');
    check('an enemy you have locked is ahead: the Brawler stands between you and it, the Mage behind you, away from it', () => {
        const r = J(`(function(){ const [b, m] = __squad(['brawler', 'sniper']); __walk(1, 0, 40); const e = __foe(player.x, player.y - 9, true); targetSet(e, true); __tick(300);
            const o = { lock: targetCurrent() === e, front: [formationFront().x, formationFront().y], b: [b.x - player.x, b.y - player.y], m: [m.x - player.x, m.y - player.y] }; targetDrop(); e.dead = true; return o; })()`);
        same(r.lock, true, 'the enemy is not locked'); ok(r.front[1] < -0.99, 'ahead is not toward the locked enemy: ' + r.front);
        ok(r.b[1] < -1.2, 'the Brawler is not between you and the enemy: ' + r.b); ok(r.m[1] > 2.3, 'the Mage is not behind you: ' + r.m);
    });
    check('with nothing locked, ahead stays the way you last walked while you stand', () => {
        const r = J(`(function(){ __squad(['brawler']); __walk(0, 1, 40); __tick(200); return [formationFront().x, formationFront().y]; })()`);
        ok(r[1] > 0.99, 'ahead changed while you stood: ' + r);
    });

    group('THE FIGHT (from their places)');
    check('a Mage with its place shoots from behind you at an enemy ahead of you, and does not walk up to it', () => {
        const r = J(`(function(){ const [m] = __squad(['sniper']); __walk(1, 0, 40); __tick(300); const e = __foe(player.x + 3, player.y, false); let shots = 0, minAhead = 9;
            for (let i = 0; i < 400; i++) { __tick(1); shots = Math.max(shots, followerProjectiles.filter(p => p.source === m).length); minAhead = Math.min(minAhead, -__rel(m).ahead); }
            const o = { hurt: e.health < e.maxHealth || shots > 0, behind: __rel(m).ahead, d: Math.hypot(e.x - m.x, e.y - m.y) }; e.dead = true; return o; })()`);
        same(r.hurt, true, 'the Mage did not shoot'); ok(r.behind < -1.5, 'the Mage left its place behind you: ' + r.behind.toFixed(2)); ok(r.d > 4.5, 'the Mage walked up to the enemy: ' + r.d.toFixed(2));
    });
    check('an enemy beyond the Mage\'s reach it leaves to the Brawlers: it keeps its place', () => {
        const r = J(`(function(){ const [m] = __squad(['sniper']); __walk(1, 0, 40); __tick(300); const x0 = __rel(m).ahead, e = __foe(player.x + 7, player.y, false); __tick(200);
            const o = { x0, x1: __rel(m).ahead, d: Math.hypot(e.x - m.x, e.y - m.y), range: FORMATION.mageRange }; e.dead = true; return o; })()`);
        ok(r.d > r.range, 'the enemy is in reach (the scene is wrong): ' + r.d.toFixed(2)); ok(Math.abs(r.x1 - r.x0) < 0.6, 'the Mage left its place: ' + r.x0.toFixed(2) + ' → ' + r.x1.toFixed(2));
    });
    check('a Brawler meets an enemy that comes, and goes back to its place ahead of you when it is gone', () => {
        const r = J(`(function(){ const [b] = __squad(['brawler']); __walk(1, 0, 40); __tick(300); const e = __foe(player.x + 4, player.y + 1.5, false); __tick(200); const near = Math.hypot(e.x - b.x, e.y - b.y);
            e.dead = true; e.health = 0; actors = actors.filter(a => a !== e); __tick(400); return { near, back: __rel(b) }; })()`);
        ok(r.near < 2, 'the Brawler did not meet the enemy: ' + r.near.toFixed(2)); ok(r.back.ahead > 1.2 && Math.abs(r.back.across) < 0.6, 'it did not go back to its place: ' + JSON.stringify(r.back));
    });
    check('in reach of an enemy a Brawler stands and strikes: it does not go round it (the owner, 2026-11-11: circling is "very hectic for reading a battlefield"; build 2026-11-11k)', () => {
        const r = J(`(function(){ const [b] = __squad(['brawler']); __walk(1, 0, 40); __tick(300); const e = __foe(player.x + 4, player.y + 1.5, false); __tick(200);
            const d0 = Math.hypot(e.x - b.x, e.y - b.y); let moved = 0, last = [b.x, b.y], hits = 0; const keep = followerAttack; followerAttack = function (a, t) { if (a === b && t === e) hits++; return keep.apply(this, arguments); };
            try { for (let i = 0; i < 180; i++) { __tick(1); moved += Math.hypot(b.x - last[0], b.y - last[1]); last = [b.x, b.y]; } } finally { followerAttack = keep; }
            const o = { d0: +d0.toFixed(3), moved: +moved.toFixed(3), hits, d1: +Math.hypot(e.x - b.x, e.y - b.y).toFixed(3) }; e.dead = true; e.health = 0; actors = actors.filter(a => a !== e); return o; })()`);
        ok(r.d0 <= 1.4 + 1e-6, 'the Brawler did not reach the enemy: ' + JSON.stringify(r)); ok(r.moved < 0.05, 'the Brawler went ' + r.moved + ' tiles in 3 s in reach of the enemy (round it): ' + JSON.stringify(r)); ok(r.hits > 0, 'it did not strike: ' + JSON.stringify(r));
    });

    group('WALLS');
    check('a place in a wall or out of your sight comes in toward you: every place is on floor you can see', () => {
        const r = J(`(function(){ __squad(['brawler', 'sniper', 'camper']); const F = _fp.F; let bad = [], tried = 0, home = 0;
            // stand beside walls: the arena's floor cells next to a wall, ahead set toward the wall
            const cells = partyRoomCells('arena').filter(([x, y]) => facilityFloorAt(x + 0.5, y + 0.5) && (!facilityFloorAt(x + 1.5, y + 0.5) || !facilityFloorAt(x + 0.5, y + 1.5))).slice(0, 40);
            for (const [x, y] of cells) { __put(x + 0.5, y + 0.5); _fmFace.x = facilityFloorAt(x + 1.5, y + 0.5) ? 0 : 1; _fmFace.y = _fmFace.x ? 0 : 1; _fmFace.at = frame + 1; frame++; _fmFace.at = frame; _fmFace.px = player.x; _fmFace.py = player.y;
                for (const f of followers) { f._fmAt = -1e9; const s = formationSpot(f); tried++; if (s && s[0] === player.x && s[1] === player.y) { home++; continue; } if (!s || !facilityFloorAt(s[0], s[1]) || !facilityLosFrom(player.x, player.y, s[0], s[1])) bad.push(f.role + '@' + x + ',' + y); } }   /* (nowhere else: where you stand) */
            return { tried, home, bad: bad.slice(0, 5), n: bad.length }; })()`);
        ok(r.tried >= 30, 'too few places tried: ' + r.tried); same(r.n, 0, 'a place in a wall or out of sight: ' + r.bad.join(' ')); ok(r.home <= r.tried / 10, 'too many places fell back to where you stand: ' + r.home + ' of ' + r.tried);
    });

    group('WHO TAKES A PLACE');
    check('only a follower following you: a posted one, one on HOLD or on a job, a clone and one going home to the Crystal take none', () => {
        const r = J(`(function(){ const [f] = __squad(['brawler']); const o = { following: !!formationSpot(f) }; const keep = { post: f.post, stance: f.stance, job: f.job, isClone: f.isClone, home: f.returningToCrystal };
            f.post = 'arena'; f._fmAt = -1e9; o.post = formationSpot(f); f.post = keep.post;
            f.stance = 'hold'; f._fmAt = -1e9; o.hold = formationSpot(f); f.stance = keep.stance;
            f.job = { type: 'move', target: { x: 1, y: 1 } }; f._fmAt = -1e9; o.job = formationSpot(f); f.job = keep.job;
            f.isClone = true; f._fmAt = -1e9; o.clone = formationSpot(f); f.isClone = keep.isClone;
            f.returningToCrystal = true; f._fmAt = -1e9; o.home = formationSpot(f); f.returningToCrystal = keep.home; return o; })()`);
        same(r.following, true, 'a follower following you has no place'); for (const k of ['post', 'hold', 'job', 'clone', 'home']) same(r[k], null, k + ' has a place');
    });
    check('the module is loaded with the page, after the followers\' own (js/npc.js), and its numbers are named in one place', () => {
        const H = rd('game.html'); ok(/js\/npc\.js[^\n]*\n<script src="js\/formation\.js/.test(H), 'js/formation.js is not loaded after js/npc.js');
        const F = J('FORMATION'); for (const k of ['front', 'back', 'ring', 'spread', 'lead', 'mageRange', 'stop', 'loneWolf', 'empathetic']) ok(typeof F[k] === 'number' && F[k] > 0, k + ' is missing');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
