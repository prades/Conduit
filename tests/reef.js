// REEF, BLOOM's Technician ability (the coral crab's), and REEF PILLAR, its Ultimate (js/techabilities.js, js/elements.js FORM_ULTIMATES.coralcrab; docs/CONVERSION.md §2, docs/TECHNICIANS.md).
// ASKED: "Coral crab into the game next". The owner's rules (2026-11-02, 2026-11-08): REEF fires little shards and rock and crystal grow where they land; in a fight an outcrop for 20 seconds that enemies cannot pass
// and that mends allies beside it; outside one a climb onto any high ground over floor (no marked sites: "like how the ice bridges can freeze any part of water"), for "Player and followers", "Both ways",
// standing "Until the next one", stopped by glass ("No, the glass stops it"), not from an ice bridge ("No"); its fight numbers "You pick, provisional". REEF PILLAR (the owner's design): "A giant spike
// erupts from the ground between the target and the technician", "Blocks and heals only".
// The logic runs in the sandbox, stepping the frames the game would (the player's step too: the climbs carry you).
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
const near = (a, b, tol, m) => { if (!(Math.abs(a - b) <= tol)) throw new Error(`${m}: expected ${b} ± ${tol}, got ${a}`); };

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860; innerWidth = 1100;');
    // an open spot in the arena (floor and sight all round), the catwalks' west edge, a squad (the first a BLOOM technician), a creature that does only what the test says
    run(`globalThis.__open = (() => { const need = [[7.5, 0], [-4, 0], [0, 3], [0, -3], [4, 3], [4, -3], [6, 2.5], [-1, 2], [-1, -2], [-4, 3]], cs = partyRoomCells('arena');
            const good = cs.filter(c => need.every(d => facilityLosFrom(c[0], c[1], c[0] + d[0], c[1] + d[1]) && facilitySeesFrom(c[0], c[1], c[0] + d[0], c[1] + d[1]))); return good[Math.floor(good.length / 2)] || cs[Math.floor(cs.length / 2)]; })();
        globalThis.__edgeX = Math.min(..._fp.F.byId.get('catwalks').poly.map(p => p[0]));   // (the catwalks' west edge, in tiles, as the game has it: snapped)
        globalThis.__calm = () => { actors = actors.filter(a => !a.isFollower); };   // (the squad out of the world's steps: nothing of yours fights the test's creatures; they are still followers, and REEF still mends them)
        globalThis.__fresh = (els, at) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); floatingTexts.length = 0; techReset(); followerProjectiles = [];
            const o = at || __open; player.x = player.targetX = player.visualX = o[0] - 1; player.y = player.targetY = player.visualY = o[1]; player.fpPath = null; player._flight = null; player._climbGo = null; player._climbHold = false; player.invuln = 0; health = PLAYER_HITS;
            els.forEach((el, i) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.health = f.maxHealth = 400; f.currentWill = 1e5; f.x = o[0] + (i ? 0.3 * i : 0); f.y = o[1] + (i ? 0.6 : 0); f.role = i === 0 ? 'camper' : 'brawler'; });
            partyTick(); techAbilityTick(); followers[0]._abReadyAt = frame; return followers.slice(); };
        globalThis.__step = (n, also) => { for (let i = 0; i < n; i++) { frame++; techAbilityTick(); facilityPlayerStep(); for (const a of actors.slice()) if (!a.dead && (a.isFollower || (also && also.includes(a)))) updateNPC(a); } };
        globalThis.__foe = (x, y) => { const e = spawnCreature({ species: 'ant', className: 'tank' }); e.x = x; e.y = y; e.update = () => {}; e.health = e.maxHealth = 5000; e.provoked = true; e.spawnProtection = 0; return e; };
        globalThis.__walker = (e, tx, ty, sp) => { e.update = function () { const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy); if (d > 0.05) { this.x += dx / d * (sp || 0.05); this.y += dy / d * (sp || 0.05); } }; return e; };
        globalThis.__room = (x, y) => (facilityRoomAt(x, y, _fp.F) || {}).id || null;
        globalThis.__heals = [];
        { const h0 = healUnit; healUnit = function (t, a, src) { if (src && src.evolved === 'coralcrab' || (src && src.element === 'blossom' && src.role === 'camper')) __heals.push({ t: t.uid, a }); return h0(t, a, src); }; }`);

    group('THE CORAL CRAB HAS REEF');
    check('a BLOOM technician (egg or evolved: the coral crab) has REEF: its chip ◆ REEF, a spot to tap, its prompt; the seventh ability', () => {
        const r = J(`(function(){ const fs = __fresh(['blossom', 'fire']), t = fs[0], o = {}; o.id = (techAbilityOf(t) || {}).id; t.evolved = 'coralcrab'; energyFill(t); o.evolved = (techAbilityOf(t) || {}).id;
            o.chip = techChipState(t).text; techChipTap(t); o.need = techAimNeed(); o.prompt = techAimPrompt(); techAimCancel(true); o.keys = Object.keys(TECH_ABILITIES).length; o.ult = (followerUltimate(t) || {}).name; return o; })()`);
        same(r.id, 'reef', 'the egg\'s ability'); same(r.evolved, 'reef', 'the coral crab\'s'); same(r.chip, '◆ REEF', 'the chip'); same(r.need, 'spot', 'the pick');
        same(r.prompt, 'REEF · TAP THE FLOOR FOR AN OUTCROP, OR HIGH GROUND TO CLIMB, WHERE IT CAN SEE', 'the prompt'); same(r.keys, 7, 'the abilities'); same(r.ult, 'Reef Pillar', 'its Ultimate');
    });

    group('THE OUTCROP (in a fight)');
    check('a tap on floor it can see: its shards fly, then an outcrop of rock and crystal grows there for 20 s; the wait is 60 s; floor it cannot see, or no floor, is refused and the aim stays up', () => {
        const r = J(`(function(){ const fs = __fresh(['blossom', 'fire']), t = fs[0], o = {}, f0 = frame;
            o.wall = techAbilityUse(t, { spot: { x: t.x - 40, y: t.y } }); o.nan = techAbilityUse(t, { spot: { x: NaN, y: 1 } });
            const r = techAbilityUse(t, { spot: { x: t.x + 2.2, y: t.y - 1.8 } }); o.ok = r.ok; o.wait = techReadyIn(t); o.chip = techChipState(t).text;
            const O = techReefs[0]; o.at = [O.x, O.y]; o.grows = O.t0 - f0; o.lasts = O.until - O.t0; o.on0 = !!techOnReef({ x: O.x, y: O.y }); __step(TECH_AB.reef.shards); o.on1 = !!techOnReef({ x: O.x, y: O.y });
            __step(1199); o.at1199 = techReefs.length; __step(1); o.at1200 = techReefs.length; o.again = techAbilityUse(t, { spot: { x: t.x + 1, y: t.y } }).why; return o; })()`);
        ok(!r.wall.ok && r.wall.again, 'a spot far through the wall: ' + JSON.stringify(r.wall)); same(r.nan.why, 'TAP THE FLOOR', 'no spot');
        same(r.ok, true, 'refused'); same(r.wait, 3600, 'the wait'); same(r.chip, '◆ 60 S', 'the chip after');
        same(r.grows, 16, 'the shards\' flight (frames)'); same(r.lasts, 1200, 'its life from when it grows'); same(r.on0, false, 'it stood before its shards landed'); same(r.on1, true, 'it did not grow');
        same(r.at1199, 1, 'gone early'); same(r.at1200, 0, 'still there after 20 s'); ok(/READY IN/.test(r.again), 'used again inside its wait: ' + r.again);
    });
    check('an enemy walking at it is held at its edge (and slides round it); one standing where it grows is put out beside it; your followers and you walk over it; it hurts no one', () => {
        const r = J(`(function(){ const fs = __fresh(['blossom', 'fire']), t = fs[0], o = {};
            const e0 = __foe(t.x + 2, t.y); techAbilityUse(t, { spot: { x: t.x + 2, y: t.y } }); __calm(); const O = techReefs[0], need = O.parts[0].r + TECH_AB.reef.body; __step(TECH_AB.reef.shards + 1, [e0]); o.out = Math.hypot(e0.x - O.x, e0.y - O.y) >= need - 1e-6;
            const e = __foe(O.x - 3, O.y); __walker(e, O.x + 3, O.y, 0.05); let minD = 9; for (let i = 0; i < 100; i++) { __step(1, [e]); minD = Math.min(minD, Math.hypot(e.x - O.x, e.y - O.y)); } o.minD = minD; o.need = need;
            const e2 = __foe(O.x - 3, O.y + 0.6); __walker(e2, O.x + 3, O.y + 0.6, 0.05); __step(240, [e2]); o.round = e2.x > O.x + 1;
            o.hp = [e0.health, e.health, e2.health]; o.pressed = !!O.pressedAt;
            const g = fs[1]; g.x = O.x - 2; g.y = O.y; const px = g.x, py = g.y; g.x = O.x; g.y = O.y; techShieldKeep(g, px, py); o.friend = Math.hypot(g.x - O.x, g.y - O.y) < 0.01;
            return o; })()`);
        same(r.out, true, 'the enemy it grew on was left inside it'); near(r.minD, r.need, 0.02, 'how near its middle a walking enemy came'); same(r.round, true, 'an enemy off its middle did not get round it');
        same(r.hp.join(), '5000,5000,5000', 'it hurt an enemy'); same(r.pressed, true, 'it never showed an enemy pressing on it'); same(r.friend, true, 'a follower was held out of it');
    });
    check('a shot that crosses it stops there, whichever side fired it, as at a crate (the owner: "Stop shots too", then "Stops everyone\'s"); one fired from right behind it passes over it; one beside it flies on; the laser\'s reach and a turret\'s aim stop at it; lobs fly over (the cover check)', () => {
        const r = J(`(function(){ const fs = __fresh(['blossom']), t = fs[0], o = {}; techAbilityUse(t, { spot: { x: t.x + 2, y: t.y } }); const O = techReefs[0]; __step(TECH_AB.reef.shards);
            const R = O.parts[0].r, from = O.x - 4;
            o.far = techReefShotStop(from, O.y, from + 6, O.y, from, O.y); o.farAt = o.far && +(o.far.x - O.x).toFixed(3);
            o.behind = techReefShotStop(O.x - R - 0.5, O.y, O.x + 2, O.y, O.x - R - 0.5, O.y);
            o.beside = techReefShotStop(from, O.y + 1.4, from + 6, O.y + 1.4, from, O.y + 1.4);
            o.reach = +techReefShotReach(from, O.y, from + 6, O.y).toFixed(3); o.clear = facilityShotClear(from, O.y, from + 6, O.y); o.clearBeside = facilityShotClear(from, O.y + 1.4, from + 6, O.y + 1.4);
            o.enemyShield = techShieldStopsShot({ x: O.x, y: O.y, vx: 0.3, vy: 0, targetsGreen: true });
            techReefs.length = 0; o.gone = techReefShotStop(from, O.y, from + 6, O.y, from, O.y); return o; })()`);
        ok(r.far, 'a shot from 4 tiles off went through it'); same(r.farAt, -0.8, 'where it stopped (its edge, on the side it came from)');
        same(r.behind, null, 'a shot fired from right behind it was stopped'); same(r.beside, null, 'a shot 1.4 tiles off its middle');
        same(r.reach, 3.2, 'the laser\'s reach (to its edge)'); same(r.clear, false, 'a turret\'s aim through it'); same(r.clearBeside, true, 'a turret\'s aim beside it'); same(r.enemyShield, false, 'the Photonic Shield\'s check (shields only now)'); same(r.gone, null, 'with no outcrop');
        const G = rd('js/game.js'); ok(/facilityShotStopAt\(p\.x - p\.vx, p\.y - p\.vy, p\.x, p\.y, p\.ox, p\.oy\) \|\| \(typeof techReefShotStop === "function" \? techReefShotStop\(/.test(G), 'the shots\' step asks it with the cover check');
        ok(/!p\.arcData && !p\.noHitDetect && typeof facilityShotStopAt/.test(G), 'lobs skip the cover check'); ok(/techReefShotReach\(player\.x, player\.y/.test(rd('js/weapons.js')), 'the laser');
    });
    check('your followers beside it are mended 1% of their health every half second (within 1.5 tiles of its edge, in sight); one further off is not', () => {
        const r = J(`(function(){ const fs = __fresh(['blossom', 'fire', 'ice']), t = fs[0], o = {};
            techAbilityUse(t, { spot: { x: t.x + 2, y: t.y } }); const O = techReefs[0];
            const a = fs[1], b = fs[2]; for (const f of [a, b]) { f.stance = 'hold'; f.job = { type: 'move', target: { x: f.x, y: f.y } }; f.health = 100; }
            a.x = O.x; a.y = O.y + O.parts[0].r + 1.2; b.x = O.x - 4.5; b.y = O.y; a.job.target = { x: a.x, y: a.y }; b.job.target = { x: b.x, y: b.y };
            __step(TECH_AB.reef.shards); __heals.length = 0; const h0 = [a.health, b.health]; __step(90); o.a = a.health - h0[0]; o.b = b.health - h0[1]; o.heals = __heals.length; o.max = a.maxHealth; return o; })()`);
        ok(r.heals >= 3 && r.heals <= 4, 'beats in 1.5 s: ' + r.heals); near(r.a, r.heals * 0.01 * r.max, 0.01, 'the mend beside it'); same(r.b, 0, 'a follower 4.5 tiles off was mended');
    });

    group('THE CLIMBS (getting around: any high ground over floor)');
    check('from the arena, a tap on the catwalks: a climb on their west edge, its foot out on the arena floor where the camera sees it, its top on the catwalks; the wait is 60 s', () => {
        const r = J(`(function(){ const at = [Math.floor(__edgeX) - 4, 51], fs = __fresh(['blossom', 'fire'], at), t = fs[0], o = {}; t.x = at[0]; t.y = at[1];
            const res = techAbilityUse(t, { spot: { x: __edgeX + 2.5, y: 51 } }); o.ok = res.ok; o.why = res.why; const C = techClimbs[0] || {};
            o.foot = C.foot; o.top = C.top; o.footRoom = C.foot && __room(C.foot[0], C.foot[1]); o.topRoom = C.top && __room(C.top[0], C.top[1]); o.edge = C.edge; o.wait = techReadyIn(t);
            o.apart = C.foot && _pComp(C.foot[0], C.foot[1]) !== _pComp(C.top[0], C.top[1]); o.edgeX = __edgeX; return o; })()`);
        same(r.ok, true, 'refused: ' + r.why); same(r.footRoom, 'arena', 'its foot'); same(r.topRoom, 'catwalks', 'its top'); same(r.apart, true, 'the two floors one stretch');
        near(r.edge[0], r.edgeX, 0.01, 'on the catwalks\' edge'); same(r.foot[0], Math.round(r.edgeX - 0.5) - 3, 'its foot 3 tiles out from the arena\'s last floor'); same(r.top[0], Math.round(r.edgeX + 0.5), 'its top on the catwalks\' first tile'); same(r.wait, 3600, 'the wait');
    });
    check('the map has high ground over floor in one place today, the catwalks\' west edge over the arena (about 18 tiles); the walled-in edges by Teleport Room 2 are not climbs (no open face)', () => {
        const r = J(`(function(){ const F = _fp.F, hits = {}; let n = 0;
            for (const w of F.walls) { const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy); if (L < 0.2 || w.window) continue; const nx = -dy / L, ny = dx / L;
                for (let t = 0.25; t < L; t += 0.5) { const qx = w.a[0] + dx / L * t, qy = w.a[1] + dy / L * t, side = [];
                    for (const s of [-1, 1]) { let P = null; for (let k = 0.3; k <= 2.5; k += 0.25) { const x = qx + nx * s * k, y = qy + ny * s * k; if (facilityStandOk(x, y)) { P = [x, y]; break; } } side.push(P); }
                    if (!side[0] || !side[1]) continue; const ca = _pComp(side[0][0], side[0][1]), cb = _pComp(side[1][0], side[1][1]); if (ca === cb) continue;
                    const e = _techReefEdgeAt(w, qx, qy, ca, cb); if (!e) continue; n++; const k = __room(e.foot[0], e.foot[1]) + '>' + __room(e.top[0], e.top[1]); hits[k] = (hits[k] || 0) + 1; } }
            return { hits, n }; })()`);
        same(Object.keys(r.hits).join(), 'arena>catwalks', 'where it can climb: ' + JSON.stringify(r.hits)); ok(r.n >= 60 && r.n <= 80, 'samples along the edge (half a tile apart, both rooms\' pieces): ' + r.n);
    });
    check('glass stops it ("No, the glass stops it"), a plain wall too, and an ice bridge is not floor to climb from ("No"); out of its sight it is refused', () => {
        const r = J(`(function(){ const at = [Math.floor(__edgeX) - 4, 51], fs = __fresh(['blossom'], at), t = fs[0], o = {}; t.x = at[0]; t.y = at[1]; const F = _fp.F, spot = { x: __edgeX + 2.5, y: 51 };
            const faces = F.walls.filter(w => w.kind === 'railing_wall'); faces.forEach(w => { w.window = 'test_glass'; }); o.glass = techReefClimbPlan(t, spot).why; faces.forEach(w => { w.window = undefined; });
            faces.forEach(w => { w._k = w.kind; w.kind = 'wall'; }); o.wall = techReefClimbPlan(t, spot).why; faces.forEach(w => { w.kind = w._k; delete w._k; });
            facilityIceSet([[at[0] - 1, 44, Math.round(__edgeX) + 0.5, 58]]); o.ice = techReefClimbPlan(t, spot).why; facilityIceSet([]);
            o.back = techReefClimbPlan(t, spot).ok; t.x = at[0] - 30; t.y = at[1]; o.far = techAbilityUse(t, spot).why; return o; })()`);
        same(r.glass, 'NO HIGH GROUND TO CLIMB THERE', 'through glass'); same(r.wall, 'NO HIGH GROUND TO CLIMB THERE', 'up a plain wall'); same(r.ice, 'NO HIGH GROUND TO CLIMB THERE', 'from an ice bridge');
        same(r.back, true, 'the climb after the test'); ok(/CANNOT SEE|NO HIGH GROUND|TAP THE FLOOR/.test(r.far), 'from out of sight: ' + r.far);
    });
    check('one each, "Until the next one": a coral crab\'s next climb takes the place of its last; another crab\'s stands beside it; an outcrop leaves the climb standing', () => {
        const r = J(`(function(){ const at = [Math.floor(__edgeX) - 4, 51], fs = __fresh(['blossom', 'blossom'], at), t = fs[0], u = fs[1], o = {}; t.x = at[0]; t.y = at[1]; u.x = at[0]; u.y = at[1] + 2; u.role = 'camper'; partyTick(); techAbilityTick();
            techAbilityUse(t, { spot: { x: __edgeX + 2.5, y: 49 } }); const first = techClimbs[0].top.slice(); t._abReadyAt = frame; techAbilityUse(t, { spot: { x: __edgeX + 2.5, y: 54 } }); o.n1 = techClimbs.length; o.moved = techClimbs[0].top[1] !== first[1];
            u._abReadyAt = frame; const ru = techAbilityUse(u, { spot: { x: __edgeX + 2.5, y: 51 } }); o.u = ru.ok || ru.why; o.n2 = techClimbs.length;
            t._abReadyAt = frame; techAbilityUse(t, { spot: { x: t.x - 2, y: t.y } }); o.n3 = techClimbs.length; o.reefs = techReefs.length; return o; })()`);
        same(r.n1, 1, 'climbs after its second'); same(r.moved, true, 'its second did not take the first\'s place'); same(r.u, true, 'the other crab\'s'); same(r.n2, 2, 'climbs of two crabs'); same(r.n3, 2, 'climbs after an outcrop'); same(r.reefs, 1, 'the outcrop');
    });
    check('you: a walk that ends on its foot takes you up onto the catwalks; set down there you are not taken back until you step off; a walk back onto its top takes you down ("Both ways"); a walk past its foot does not', () => {
        const r = J(`(function(){ const at = [Math.floor(__edgeX) - 4, 51], fs = __fresh(['blossom'], at), t = fs[0], o = {}; t.x = at[0]; t.y = at[1]; t.stance = 'hold'; t.job = { type: 'move', target: { x: t.x, y: t.y } };
            techAbilityUse(t, { spot: { x: __edgeX + 2.5, y: 51 } }); __step(TECH_AB.reef.shards + 1); const C = techClimbs[0];
            player.x = player.targetX = C.foot[0] - 1; player.y = player.targetY = C.foot[1] - 3; o.walk0 = facilityWalkTo(C.foot[0] - 1, C.foot[1] + 3); let flew = false; for (let i = 0; i < 400 && player.fpPath && player.fpPath.length; i++) { __step(1); if (player._flight) flew = true; } o.past = flew;
            o.walk = facilityWalkTo(C.foot[0], C.foot[1]); for (let i = 0; i < 400 && !player._flight; i++) __step(1); o.flying = !!player._flight; o.kind = player._flight && player._flight.kind;
            for (let i = 0; i < 100 && player._flight; i++) __step(1); o.up = __room(player.x, player.y); o.hold = !!player._climbHold; __step(60); o.stay = __room(player.x, player.y);
            facilityWalkTo(C.top[0] + 2, C.top[1]); for (let i = 0; i < 200 && player.fpPath && player.fpPath.length; i++) __step(1); __step(2); o.released = !player._climbHold;
            facilityWalkTo(C.top[0], C.top[1]); for (let i = 0; i < 300 && !player._flight; i++) __step(1); for (let i = 0; i < 100 && player._flight; i++) __step(1); o.down = __room(player.x, player.y); o.at = [player.x, player.y]; o.foot = C.foot; return o; })()`);
        same(r.past, false, 'a walk past its foot took you over'); same(r.walk, true, 'no walk to its foot'); same(r.flying, true, 'not taken over'); same(r.kind, 'climb', 'the flight');
        same(r.up, 'catwalks', 'where you came down'); same(r.hold, true, 'set down without the hold'); same(r.stay, 'catwalks', 'taken straight back'); same(r.released, true, 'still held off its top');
        same(r.down, 'arena', 'down again'); same(r.at.join(), r.foot.join(), 'set down on its foot');
    });
    check('up on the catwalks by the climb, their ledge takes you down too (a walk onto it), not the moment the climb sets you down beside it', () => {
        const r = J(`(function(){ const at = [Math.floor(__edgeX) - 4, 51], fs = __fresh(['blossom'], at), t = fs[0], o = {}, L = _fp.F.ledges.find(l => l.id === 'ledge_catwalks'); t.x = at[0]; t.y = at[1]; t.stance = 'hold'; t.job = { type: 'move', target: { x: t.x, y: t.y } };
            techAbilityUse(t, { spot: { x: L.at[0] + 1, y: L.at[1] } }); __step(TECH_AB.reef.shards + 1); const C = techClimbs[0]; o.top = C.top; o.ledge = L.at;
            facilityWalkTo(C.foot[0], C.foot[1]); for (let i = 0; i < 400 && !player._flight; i++) __step(1); for (let i = 0; i < 100 && player._flight; i++) __step(1); o.up = __room(player.x, player.y); o.nearLedge = Math.hypot(player.x - L.at[0], player.y - L.at[1]);
            __step(20); o.stayed = __room(player.x, player.y);
            facilityWalkTo(L.at[0] + 1, L.at[1] - 2); for (let i = 0; i < 300 && player.fpPath && player.fpPath.length; i++) __step(1); __step(2);
            facilityWalkTo(L.at[0], L.at[1]); let kind = null; for (let i = 0; i < 300 && !player._flight; i++) __step(1); kind = player._flight && player._flight.kind; for (let i = 0; i < 100 && player._flight; i++) __step(1);
            o.kind = kind; o.down = __room(player.x, player.y); return o; })()`);
        same(r.up, 'catwalks', 'up the climb'); ok(r.nearLedge <= 0.5, 'the climb\'s top is not on the ledge here (' + r.nearLedge + '): the test needs it there'); same(r.stayed, 'catwalks', 'the ledge took you down the moment the climb set you on it');
        same(r.kind, 'drop', 'the ledge\'s jump'); same(r.down, 'arena', 'where the ledge took you');
    });
    check('its tag: a tap on it walks you to its end and takes you over (techClimbGo); a walk elsewhere calls it off', () => {
        const r = J(`(function(){ const at = [Math.floor(__edgeX) - 4, 51], fs = __fresh(['blossom'], at), t = fs[0], o = {}; t.x = at[0]; t.y = at[1]; t.stance = 'hold'; t.job = { type: 'move', target: { x: t.x, y: t.y } };
            techAbilityUse(t, { spot: { x: __edgeX + 2.5, y: 51 } }); __step(TECH_AB.reef.shards + 1); const C = techClimbs[0];
            player.x = player.targetX = C.foot[0] - 2; player.y = player.targetY = C.foot[1] + 1; o.go = techClimbGo(C).ok; o.asked = player._climbGo === C.id; facilityWalkTo(C.foot[0] - 3, C.foot[1] + 2); o.off = player._climbGo === null;
            o.go2 = techClimbGo(C).ok; for (let i = 0; i < 400 && !player._flight; i++) __step(1); for (let i = 0; i < 100 && player._flight; i++) __step(1); o.up = __room(player.x, player.y); return o; })()`);
        same(r.go, true, 'the tag refused'); same(r.asked, true, 'not asked'); same(r.off, true, 'a walk elsewhere kept it'); same(r.go2, true, 'the tag refused again'); same(r.up, 'catwalks', 'where the tag took you');
    });
    check('your followers: on the other floor from you, they walk to the climb and go over it to you, up and back down; creatures never do', () => {
        const r = J(`(function(){ const at = [Math.floor(__edgeX) - 4, 51], fs = __fresh(['blossom', 'fire'], at), t = fs[0], g = fs[1], o = {}; t.x = at[0]; t.y = at[1]; g.x = at[0] - 1; g.y = at[1] + 1;
            techAbilityUse(t, { spot: { x: __edgeX + 2.5, y: 51 } }); __step(TECH_AB.reef.shards + 1); const C = techClimbs[0];
            const e = __foe(C.foot[0], C.foot[1]); __step(30, [e]); o.foe = !!e._flight; e.dead = true; actors = actors.filter(a => a !== e);
            player.x = player.targetX = player.visualX = C.top[0] + 1; player.y = player.targetY = player.visualY = C.top[1]; player.fpPath = null; player._climbHold = true;
            for (let i = 0; i < 1500 && !fs.every(f => __room(f.x, f.y) === 'catwalks' && !f._flight); i++) __step(1); o.up = fs.map(f => __room(f.x, f.y));
            player.x = player.targetX = player.visualX = C.foot[0] - 1; player.y = player.targetY = player.visualY = C.foot[1] + 1; player._climbHold = true;
            for (let i = 0; i < 1500 && !fs.every(f => __room(f.x, f.y) === 'arena' && !f._flight); i++) __step(1); o.down = fs.map(f => __room(f.x, f.y)); return o; })()`);
        same(r.foe, false, 'a creature went over it'); same(r.up.join(), 'catwalks,catwalks', 'the followers up after you'); same(r.down.join(), 'arena,arena', 'the followers down after you');
    });
    check('the climbs are saved (as the ice bridges are): its ends and its crab; a load keeps the good ones (one each), and a game saved before has none', () => {
        const r = J(`(function(){ const at = [Math.floor(__edgeX) - 4, 51], fs = __fresh(['blossom'], at), t = fs[0], o = {}; t.x = at[0]; t.y = at[1];
            techAbilityUse(t, { spot: { x: __edgeX + 2.5, y: 51 } }); const snap = techClimbsSnapshot(); o.snap = snap.length && snap[0].by === t.uid;
            techClimbsApply(JSON.parse(JSON.stringify(snap.concat([{ foot: [1, 'x'], top: [2, 2] }, null, { foot: [-500, -500], top: [-501, -501] }, snap[0]])))); o.loaded = techClimbs.length; o.by = techClimbs[0] && techClimbs[0].by === t;
            o.same = techClimbs[0] && techClimbs[0].foot.join() === snap[0].foot.join() && techClimbs[0].top.join() === snap[0].top.join(); o.ready = !!_techClimbEnd(techClimbs[0], player.x, player.y);
            techClimbsApply(undefined); o.none = techClimbs.length; techClimbsApply(snap); techReset(); o.reset = techClimbs.length + techReefs.length; return o; })()`);
        same(r.snap, true, 'the snapshot'); same(r.loaded, 1, 'climbs loaded (the bad ones dropped, one each)'); same(r.by, true, 'its crab'); same(r.same, true, 'its ends'); same(r.ready, true, 'usable after a load');
        same(r.none, 0, 'a game saved before'); same(r.reset, 0, 'a new game kept them');
        const S = rd('js/facilitysave.js'); ok(/climbs: typeof techClimbsSnapshot === "function" \? techClimbsSnapshot\(\) : \[\]/.test(S) && /techClimbsApply\(d\.climbs\)/.test(S), 'the save\'s wiring');
        ok(S.indexOf('techClimbsApply(d.climbs)') > S.indexOf('techBridgesApply(d.bridges)'), 'the climbs before the bridges');
    });

    group('REEF PILLAR (its Ultimate)');
    check('charged, at the nearest enemy it sees: a giant spike on the line between them, in front of the enemy, a lesser one either side across the line; nothing in reach keeps the charge', () => {
        const r = J(`(function(){ const fs = __fresh(['blossom']), t = fs[0], o = {}; t.evolved = 'coralcrab'; energyFill(t); t.ultimateCharge = 100;
            o.none = followerUltFire(t); o.kept = t.ultimateCharge;
            const e = __foe(t.x + 5, t.y), f2 = __foe(t.x + 6.5, t.y + 1); o.fired = followerUltFire(t); o.spent = t.ultimateCharge; const O = techReefs[0] || {};
            o.pillar = O.pillar; o.parts = (O.parts || []).map(q => [q.x - t.x, q.y - t.y, q.r]); o.life = O.until - O.t0; return o; })()`);
        same(r.none, false, 'fired at nothing'); same(r.kept, 100, 'the charge spent on nothing'); same(r.fired, true, 'did not fire'); same(r.spent, 0, 'the charge'); same(r.pillar, true, 'a pillar');
        same(r.parts.length, 3, 'its spikes'); near(r.parts[0][0], 5 - 1.2, 0.01, 'the giant spike in front of the enemy'); near(r.parts[0][1], 0, 0.01, 'on the line'); same(r.parts[0][2], 0.9, 'its body');
        near(Math.abs(r.parts[1][1]), 1.1, 0.01, 'a lesser one across the line'); near(r.parts[1][1], -r.parts[2][1], 0.01, 'one either side'); same(r.life, 600, 'its life (provisional)');
    });
    check('it blocks the enemy\'s way, mends your followers near it 2% every half second, and hurts no one', () => {
        const r = J(`(function(){ const fs = __fresh(['blossom', 'fire']), t = fs[0], g = fs[1], o = {}; t.evolved = 'coralcrab'; energyFill(t); t.ultimateCharge = 100; g.stance = 'hold';
            const e = __foe(t.x + 5, t.y); followerUltFire(t); __calm(); const O = techReefs[0], C = O.parts[0]; __step(TECH_AB.reef.shards + 1, [e]);
            g.x = C.x - 1.8; g.y = C.y + 0.4; g.job = { type: 'move', target: { x: g.x, y: g.y } }; g.health = 100; __heals.length = 0;
            __walker(e, t.x - 2, t.y, 0.05); let minX = 99; for (let i = 0; i < 150; i++) { __step(1, [e]); minX = Math.min(minX, e.x - t.x); }
            o.blocked = minX > C.x - t.x; o.hp = e.health; o.heal = g.health - 100; o.beats = __heals.length; o.max = g.maxHealth; return o; })()`);
        same(r.blocked, true, 'the enemy walked through it'); same(r.hp, 5000, 'it hurt the enemy'); ok(r.beats >= 4, 'beats: ' + r.beats); near(r.heal, r.beats * 0.02 * r.max, 0.01, 'the mend');
    });

    group('ITS INFO');
    check('the INFO card: REEF, what it does, its numbers, its climb', () => {
        const r = J(`(function(){ const at = [Math.floor(__edgeX) - 4, 51], fs = __fresh(['blossom'], at), t = fs[0]; t.x = at[0]; t.y = at[1]; const a = techAbilityInfo(t); techAbilityUse(t, { spot: { x: __edgeX + 2.5, y: 51 } }); const b = techAbilityInfo(t); return { h: a.h, rows: a.rows.map(r => r[0]).join(), climb0: a.rows.find(r => r[0] === 'CLIMB')[1], climb1: b.rows.find(r => r[0] === 'CLIMB')[1] }; })()`);
        same(r.h, 'ABILITY · REEF', 'its heading'); same(r.rows, 'OUTCROP,MENDS,CLIMB,COOLDOWN,FIRST WAIT,READY', 'its rows'); same(r.climb0, 'none standing', 'before'); same(r.climb1, 'up to the CATWALKS', 'after');
    });

    console.log(failures ? `\n${failures} FAILED` : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
