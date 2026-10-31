// THE SEWERS (js/facilitymap.js the room `sewers`; js/facilitysewers.js its drawing; docs/FACILITY.md, "The Sewers").
// ASKED: "make it look like the little liquid holding tanks have some sort of runoff into the sewers [...] make the sewers another location as well, that have a deep sort of river that cuts across two
// narrow paths, with room to have more areas later and a boss fight, and make it also have cut off entrances with gated areas." Chosen with the user: in the arena, the subtle little overflow grates where
// the tanks' pipes go into the floor (no words on the floor) and the arched SEWER culvert in the back rock as the way down; below, layout A (a narrow ledge each side of the deep river); empty for now.
//   THE ARENA      the culvert's alcove in the north rock behind the north tank (a portal), the two overflow grates at the tanks' pipes
//   THE SEWERS     an interior under the arena, out of sight of every room, powered with the arena; two ledges, the deep river between (nothing walks in it), a bridge and a broken one, three side passages and
//                  the cistern shut behind gates, a collapsed tunnel and a sealed hatch, the outfall where the runoff pours in
//   THE TRIP       through the culvert and back
//   THE DRAWING    the water first of everything in the room, the bridge's grating with nothing under it, the gates, the culvert, the grates; nothing throws
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
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; crystal.health = crystal.maxHealth = 1e7; canvas.width = 1280; canvas.height = 860;
        if (typeof facilitySpawnTick === 'function') facilitySpawnTick = () => {};   // (no arena spawner)
        actors = actors.filter(a => !(a instanceof Predator));
        // the sewers' places on the built grid: a cell of each ledge, the bridge, the river, each gated passage, the cistern
        globalThis.__SW = (function () { const F = _fp.F, S = F.byId.get('sewers'), sol = F.solids.filter(s => s.room === 'sewers'), riv = sol.filter(s => s.kind === 'river'), xs = riv.flatMap(s => s.poly.map(q => q[0])), ys = riv.flatMap(s => s.poly.map(q => q[1]));
            const band = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)], deck = F.decor.find(d => d.id === 'sewer_bridge').rect, broken = F.decor.find(d => d.id === 'sewer_bridge_broken').rect, gates = sol.filter(s => /gate$/.test(s.kind));
            const mid = r => [(r[0] + r[2]) / 2, (r[1] + r[3]) / 2], cell = (x, y) => [Math.round(x), Math.round(y)], gateBox = g => { const xs = g.poly.map(q => q[0]), ys = g.poly.map(q => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; };
            const behind = g => { const b = gateBox(g), m = mid(b), alongX = b[2] - b[0] > b[3] - b[1]; if (!alongX) return cell(m[0] + 1, m[1]); return facilityRoomAt(m[0], m[1] - 1.5, F) && m[1] - 1.5 > S.bb[1] && !(m[1] - 1.5 > band[1] && m[1] - 1.5 < band[3]) && F.byId.get('sewers') ? (facilityWalkable(Math.round(m[0]), Math.round(m[1] - 1.5), F) && m[1] < band[1] ? cell(m[0], m[1] - 1.5) : cell(m[0], m[1] + 1.5)) : cell(m[0], m[1] + 1.5); };
            return { band, deck, broken, north: [Math.round(band[0] + 6), Math.round(band[1] - 0.5)], south: [Math.round(band[0] + 6), Math.round(band[3] + 0.5)], river: cell(band[0] + 6, (band[1] + band[3]) / 2), bridge: cell(mid(deck)[0], mid(deck)[1]),
                     gates: gates.map(g => ({ id: g.id, kind: g.kind, box: gateBox(g), behind: behind(g) })), cistern: cell(S.bb[2] - 2, S.bb[1] + 2) }; })();`);

    group('THE ARENA: THE WAY DOWN AND THE RUNOFF');
    check('the culvert: an alcove three tiles wide and one deep in the arena\'s north rock behind the north tank (rock all round it), a portal down to the Sewers, the culvert drawn at its back; the decor that hung on that stretch of rock moved along it and still validates', () => {
        const M = J('FACILITY_MAP'), A = M.rooms.find(r => r.id === 'arena'), d = M.decor.find(x => x.id === 'arena_sewer_door'), x0 = d.a[0], x1 = d.b[0], y0 = d.a[1], y1 = y0 + 20, i = A.polygon.findIndex(q => q[0] === x0 && q[1] === y1);   // (the data as the building pass left it: the arena is a tile further south)
        ok(d && d.kind === 'portal_door' && d.culvert && d.room === 'arena' && d.a[1] === d.b[1] && x1 - x0 === 60, 'the culvert is not drawn on a three-tile back wall');
        same(JSON.stringify(A.polygon.slice(i, i + 4)), JSON.stringify([[x0, y1], [x0, y0], [x1, y0], [x1, y1]]), 'the alcove'); same(A.edge_kinds.slice(i - 1, i + 4).join(), 'rock,rock,rock,rock,rock', 'rock round it'); same(A.edge_kinds.length, A.polygon.length, 'the edge kinds do not match the outline');
        const p = M.portals.find(x => x.id === 'portal_arena_sewers'); same(JSON.stringify([p.room, p.to, p.kind, p.label, p.rect]), JSON.stringify(['arena', 'portal_sewers_arena', 'door', 'SEWERS', [x0, y0, x1, y1]]), 'the portal: the whole alcove');
        const r = J(`(function(){ const F = _fp.F, t = F.solids.find(s => s.id === 'arena_structure_01'), p = F.portals.find(q => q.id === 'portal_arena_sewers'), m = [(p.rect[0] + p.rect[2]) / 2, (p.rect[1] + p.rect[3]) / 2];
            return { behind: m[1] < t.at[1] - t.r && Math.abs(m[0] - t.at[0]) < t.r + 1, gap: (t.at[1] - t.r) - p.rect[3], walk: facilityWalkable(Math.round(m[0]), Math.round(p.rect[3] + 1), F), errors: facilityValidate(F).errors.length, dressing: facilityValidateDressing(F).length }; })()`);
        same(r.behind, true, 'the culvert is not behind the north tank'); ok(r.gap >= 2, 'too little room between the tank and the culvert: ' + r.gap); same(r.walk, true, 'no floor in front of the alcove'); same(r.errors, 0, 'the map does not validate'); same(r.dressing, 0, 'the dressing does not validate');
    });
    check('the runoff: a small overflow grate at the foot of each tank\'s pipe, where it goes into the floor (the north tank\'s manifold, the south tank\'s small line), its sight glass on the pipe; no words painted on the floor', () => {
        const M = J('FACILITY_MAP'), g = M.decor.filter(d => d.kind === 'overflow_grate'); same(g.length, 2, 'grates'); ok(g.every(d => d.room === 'arena' && d.pipe && d.glass && d.glass.length === 3 && d.glass[0] < d.glass[1]), 'a grate has no pipe or sight glass');
        ok(!M.decor.some(d => d.room === 'arena' && /SEWER|OVERFLOW/.test(d.text || '')), 'words on the floor');
        const r = J(`(function(){ const F = _fp.F, T = ['arena_structure_01', 'arena_structure_02'].map(id => F.solids.find(s => s.id === id)); return F.decor.filter(d => d.kind === 'overflow_grate').map(d => { const t = T.map(t => [t, Math.hypot(d.pipe[0] - t.at[0], d.pipe[1] - t.at[1])]).sort((a, b) => a[1] - b[1])[0]; return [t[0].id, +(t[1] - t[0].r).toFixed(2), +Math.hypot(d.at[0] - d.pipe[0], d.at[1] - d.pipe[1]).toFixed(2), facilityRoomAt(d.at[0], d.at[1], F).id]; }); })()`);
        same(r.map(x => x[0]).sort().join(), 'arena_structure_01,arena_structure_02', 'one at each tank'); ok(r.every(x => Math.abs(x[1]) < 0.2), 'a pipe is not at its tank\'s rim: ' + JSON.stringify(r)); ok(r.every(x => x[2] > 0.2 && x[2] < 0.8 && x[3] === 'arena'), 'a grate is not just out from its pipe: ' + JSON.stringify(r));
    });

    group('THE SEWERS: THE PLACE');
    check('an INTERIOR under the arena at the arena\'s level, powered with the arena (the Armory Relay), joined to it by the culvert (a pair of portals and a connection), and no door onto any other room; out of sight of every other room', () => {
        const M = J('FACILITY_MAP'), S = M.rooms.find(r => r.id === 'sewers'); ok(S && S.label === 'Sewers' && S.level === -1 && S.interior === true, 'the room');
        ok(M.interiors.some(i => i.id === 'sewers' && i.under === 'arena'), 'not an interior under the arena'); ok(M.relays.find(r => r.id === 'relay_armory').powers.includes('sewers'), 'the Armory Relay does not power it');
        same(JSON.stringify(M.portals.filter(p => /sewers/.test(p.id)).map(p => [p.id, p.room, p.to, p.kind]).sort()), JSON.stringify([['portal_arena_sewers', 'arena', 'portal_sewers_arena', 'door'], ['portal_sewers_arena', 'sewers', 'portal_arena_sewers', 'door']]), 'the portals');
        same(M.openings.filter(o => (o.rooms || []).includes('sewers')).length, 0, 'a door onto another room'); same(M.connections.filter(c => c.rooms.includes('sewers')).map(c => c.id + ':' + c.portal).join(), 'conn_arena_sewers:portal_arena_sewers', 'its connection');
        const r = J(`(function(){ const F = _fp.F, pb = q => { let a = 1e9, b = -1e9, s = 1e9, t = -1e9; for (const [x, y] of q.poly) { a = Math.min(a, x - y); b = Math.max(b, x - y); s = Math.min(s, x + y); t = Math.max(t, x + y); } return [a, b, s, t]; }, A = pb(F.byId.get('sewers'));
            let gap = 1e9, near = ''; for (const q of F.rooms) { if (q.id === 'sewers') continue; const B = pb(q), g = Math.max(Math.max(0, B[0] - A[1], A[0] - B[1]) * 60, Math.max(0, B[2] - A[3], A[2] - B[3]) * 30); if (g < gap) { gap = g; near = q.id; } }
            return { gap, near, reach: facilityReachable('arena', 'sewers', F, false), name: facilityRoomName('sewers'), styled: facilityStyleRoom('sewers'), style: _fpRoomStyle('sewers') }; })()`);
        ok(r.gap > 900, 'only ' + Math.round(r.gap) + ' px of screen from ' + r.near); same(r.reach, true, 'not reachable from the arena'); same(r.name, 'Sewers', 'the zone tag');
        same(r.styled, true, 'not styled'); ok(r.style.dark && r.style.damp && r.style.wallLit && r.style.wallDark && r.style.cap, 'its damp, dark look');
    });
    check('layout A: one long tunnel, a narrow ledge two tiles deep each side of a river six tiles across; the river is DEEP (nothing walks in it anywhere), the bridge crosses it (two tiles wide, the river\'s two lengths end either side of it), the broken bridge does not', () => {
        const r = J(`(function(){ const F = _fp.F, W = __SW, b = W.band, walk = c => facilityWalkable(c[0], c[1], F), riverCells = []; for (let x = Math.ceil(b[0]); x <= b[2]; x++) for (let y = Math.ceil(b[1]); y < b[3]; y++) { const dk = W.deck; if (x > dk[0] && x < dk[2]) continue; riverCells.push(walk([x, y])); }
            const riv = F.solids.filter(s => s.kind === 'river').map(s => [Math.min(...s.poly.map(q => q[0])), Math.max(...s.poly.map(q => q[0]))]).sort((a, c) => a[0] - c[0]), mx = (W.broken[0] + W.broken[2]) / 2;
            return { width: b[3] - b[1], len: b[2] - b[0], north: walk(W.north) && walk([W.north[0], W.north[1] - 1]), northW: facilityWalkable(W.north[0], W.north[1] - 2, F), south: walk(W.south) && walk([W.south[0], W.south[1] + 1]), southW: facilityWalkable(W.south[0], W.south[1] + 2, F),
                river: riverCells.some(v => v), n: riverCells.length, bridge: walk(W.bridge), gap: [riv[0][1], riv[1][0]], deck: [W.deck[0], W.deck[2]], cross: facilityCanStep(mx, b[1] - 0.6, mx, b[3] + 0.6, F), brokenWalk: walk([Math.round(mx), Math.round((W.broken[1] + W.broken[3]) / 2)]) }; })()`);
        same(r.width, 6, 'the river\'s width'); ok(r.len >= 36, 'the tunnel is only ' + r.len + ' tiles long'); same(r.north, true, 'the north ledge'); same(r.northW, false, 'the north ledge is more than two tiles deep'); same(r.south, true, 'the south ledge'); same(r.southW, false, 'the south ledge is more than two tiles deep');
        same(r.river, false, 'a tile of the river is walkable'); ok(r.n > 150, 'river cells ' + r.n); same(r.bridge, true, 'the bridge is not floor'); same(JSON.stringify(r.gap), JSON.stringify(r.deck), 'the river\'s two lengths do not end at the bridge\'s sides'); ok(r.deck[1] - r.deck[0] === 2, 'the bridge is not two tiles wide');
        same(r.cross, false, 'the broken bridge can be crossed'); same(r.brokenWalk, false, 'the broken bridge is floor');
    });
    check('the cut-off ways: three side passages (two off the north ledge, one off the south) and the cistern, each shut by a gate on the line of its mouth (the boss\'s gate across the south ledge\'s way in); behind each there is floor, but from the culvert nothing behind a gate is reached, and with the gates taken away all of it is', () => {
        const r = J(`(function(){ const F = _fp.F, W = __SW, P = facilityPortal('portal_sewers_arena'), key = c => c[0] + ',' + c[1], fl = facilityFlood(P.ax, P.ay, F), reach = new Set(fl.map(c => key([Math.round(c[0]), Math.round(c[1])])));
            const keep = F.solids; F.solids = F.solids.filter(s => !/gate$/.test(s.kind)); F._ix = null; const fl2 = facilityFlood(P.ax, P.ay, F), reach2 = new Set(fl2.map(c => key([Math.round(c[0]), Math.round(c[1])]))); F.solids = keep; F._ix = null;
            return { gates: W.gates.map(g => [g.id, g.kind, facilityWalkable(g.behind[0], g.behind[1], F), reach.has(key(g.behind)), reach2.has(key(g.behind))]), cistern: [facilityWalkable(W.cistern[0], W.cistern[1], F), reach.has(key(W.cistern)), reach2.has(key(W.cistern))],
                     ledges: [reach.has(key(W.north)), reach.has(key(W.south)), reach.has(key(W.bridge))], n: reach.size, n2: reach2.size }; })()`);
        same(r.gates.map(g => g[1]).sort().join(), 'boss_gate,gate,gate,gate', 'the gates'); for (const g of r.gates) same(g.slice(2).join(), 'true,false,true', g[0] + ': floor behind, not reached, reached without the gate');
        same(r.cistern.join(), 'true,false,true', 'the cistern'); same(r.ledges.join(), 'true,true,true', 'the ledges and the bridge are not reached from the culvert'); ok(r.n2 > r.n + 60, 'the gates shut little: ' + r.n + ' / ' + r.n2);
    });
    check('the dressing: the outfall where the runoff pours into the river\'s head (the west wall), the culvert back up at the west end of the north ledge, the bridge\'s grating and the broken bridge, the collapsed tunnel and the sealed hatch on the north wall, the sump in the cistern; lights, pipes, damp', () => {
        const M = J('FACILITY_MAP'), d = id => M.decor.find(x => x.id === id), S = M.rooms.find(r => r.id === 'sewers'), minX = Math.min(...S.polygon.map(q => q[0]));
        ok(d('sewer_culvert_up').kind === 'portal_door' && d('sewer_culvert_up').culvert && d('sewer_culvert_up').a[0] === minX, 'the culvert up is not at the west end');
        ok(d('sewer_outfall').kind === 'outfall' && d('sewer_outfall').a[0] === minX + 20, 'the outfall is not on the river\'s west wall'); same(d('sewer_bridge').kind, 'bridge_deck', 'the bridge'); same(d('sewer_bridge_broken').kind, 'bridge_broken', 'the broken bridge');
        ok(!d('sewer_collapse'), 'the collapsed tunnel is no longer a wall decoration: it is a pocket of floor behind a choke of rubble (tests/sewerquest.js)'); ok(M.props.some(p => p.id === 'sewer_choke' && p.kind === 'rubble') && M.rubble.some(r => r.id === 'rubble_sewer_choke' && r.solid === 'sewer_choke' && r.inside), 'the choke');
        same(d('sewer_hatch').kind, 'sealed_hatch', 'the sealed hatch'); ok(M.props.some(p => p.id === 'sewer_sump' && p.kind === 'pool' && p.shape === 'circle'), 'no sump'); ok(M.props.some(p => p.id === 'purifier_mount' && p.kind === 'console'), 'the purifier mount');
        const mine = M.decor.filter(x => x.room === 'sewers'); ok(mine.filter(x => x.kind === 'light').length >= 3 && mine.some(x => x.kind === 'pipe') && mine.some(x => x.kind === 'wall_light') && mine.some(x => x.kind === 'moss'), 'lights, pipes, damp');
        same(J(`facilityValidateDressing(_fp.F).length`), 0, 'the dressing does not validate');
    });

    group('THE TRIP');
    check('into the culvert behind the north tank and out at the west end of the north ledge (the zone tag reads Sewers), the followers with you; back up through the culvert at the end of the ledge to the front of the arena\'s alcove', () => {
        const r = J(`(function(){ const o = {}, P = id => facilityPortal(id), tag = () => (facilityRoomAt(player.x, player.y, _fp.F) || {}).id; frame = 9000; const keep = followers.map(f => [f, f.x, f.y, f._fpPortalGoal]);
            const go = (from, to) => { const a = P(from), b = P(to); frame = Math.max(frame, _fp.portalCool) + 1; player.x = player.targetX = player.visualX = a.ax; player.y = player.targetY = player.visualY = a.ay; player.fpPath = null;
                if (from === 'portal_arena_sewers') followers.forEach((f, i) => { f.x = a.ax + 1 + (i % 2); f.y = a.ay + 1 + i * 0.3; f.post = null; f.job = null; f.stance = 'follow'; f.returningToCrystal = false; f._fpPath = null; });
                const walk = facilityWalkTo(a.x, a.y), ph = [];
                for (let i = 0; i < 300; i++) { frame++; facilityPlayerStep(); facilityPortalTick(); if (!ph.length || ph[ph.length - 1] !== _fp.portal.phase) ph.push(_fp.portal.phase); if (_fp.portal.phase === 'idle' && tag() === b.room && ph.length > 1) break; }
                return [walk, ph.join('>'), tag(), player.x === b.ax && player.y === b.ay, facilityZoneName()].join(); };
            o.down = go('portal_arena_sewers', 'portal_sewers_arena'); o.came = followers.filter(f => !f.dead && (facilityRoomAt(f.x, f.y, _fp.F) || {}).id === 'sewers').length; o.of = followers.filter(f => !f.dead).length;
            o.up = go('portal_sewers_arena', 'portal_arena_sewers');
            keep.forEach(([f, x, y, g]) => { f.x = x; f.y = y; f._fpPortalGoal = g; f._fpPath = null; }); player.x = player.targetX = player.visualX = crystal.x + 2; player.y = player.targetY = player.visualY = crystal.y + 1; _fp.portalCool = 0; return o; })()`);
        same(r.down, 'true,idle>out>hold>in>idle,sewers,true,Sewers', 'down through the culvert'); ok(r.of > 0 && r.came === r.of, 'the followers did not come: ' + r.came + ' of ' + r.of);
        same(r.up.split(',').slice(0, 4).join(), 'true,idle>out>hold>in>idle,arena,true', 'back up to the arena');
    });

    group('THE DRAWING');
    check('the items: the water once (a long item, drawn before everything else in the room, its band the river\'s and its pool the sump), the bridge\'s rails a tile at a time on both sides, the broken bridge\'s two stumps, the four gates (the boss\'s marked), each overflow grate in every tile it covers with its sight glass and its mist; the water and gates are no furniture (no prop pieces, no sprite)', () => {
        const r = J(`(function(){ const it = _fp.items.filter(i => i.fp === 'sewer'), by = w => it.filter(i => i.what === w), W = by('water')[0], deck = _fp.F.decor.find(d => d.id === 'sewer_bridge').rect;
            return { water: by('water').length, span: !!(W && W.span), depth: W && W.depth, low: W && W.depth < Math.min(..._fp.items.filter(i => i.room === 'sewers' && i !== W && i.depth !== undefined).map(i => i.depth)), band: W && W.band, pools: W && W.pools.length, room: W && W.room,
                rails: by('rail').length, railSides: [...new Set(by('rail').map(i => i.side))].sort().join(), railLen: deck[3] - deck[1], stumps: by('stump').length, gates: by('gate').length, boss: by('gate').filter(i => i.boss).length,
                grates: by('grate').length, glass: by('glass').length, mist: by('mist').length, props: _fp.items.filter(i => i.fp === 'prop' && FP_SELF_SOLIDS.has(i.kind)).length, self: [...FP_SELF_SOLIDS].sort().join() }; })()`);
        same(r.water, 1, 'water items'); same(r.span, true, 'the water is not a long item'); same(r.low, true, 'the water is not drawn first in its room'); same(r.room, 'sewers', 'its room'); same(r.band && r.band[3] - r.band[1], 6, 'the band'); same(r.pools, 1, 'the sump');
        same(r.rails, r.railLen * 2, 'rail pieces'); same(r.railSides, '-1,1', 'both sides'); same(r.stumps, 2, 'stumps'); same(r.gates, 4, 'gates'); same(r.boss, 1, 'the boss gate'); ok(r.grates >= 2, 'grate pieces ' + r.grates); same(r.glass, 2, 'sight glasses'); same(r.mist, 2, 'mists');
        same(r.props, 0, 'water or gates drawn as furniture'); same(r.self, 'boss_gate,gate,pool,river,rubble', 'the kinds that draw themselves (rubble: a choke, drawn by the rubble it is the solid of: tests/sewerquest.js)');
    });
    check('the bridge\'s tiles are a grating with nothing under it (the game\'s tile is not drawn there, and its floor has no base, only bars), and the ledges have a lit lip where they drop into the water', () => {
        const r = J(`(function(){ const d = _fp.F.decor.find(x => x.id === 'sewer_bridge').rect, tiles = world.filter(t => t.x > d[0] && t.x < d[2] && t.y > d[1] && t.y < d[3]), ops = tiles.map(t => _fp.floorOps.get(t.x + ',' + t.y) || []);
            const W = __SW, lip = (_fp.floorOps.get(W.north[0] + ',' + W.north[1]) || []).some(o => o.t === 'L' && o.p && o.p[1] === 0.5 && o.p[3] === 0.5 && /205,212,220/.test(o.c)), lipS = (_fp.floorOps.get(W.south[0] + ',' + W.south[1]) || []).some(o => o.t === 'L' && o.p && o.p[1] === -0.5 && o.p[3] === -0.5 && /205,212,220/.test(o.c));
            return { n: tiles.length, deck: tiles.every(t => t.deck), base: ops.some(o => o.some(q => q.t === 'D')), bars: ops.every(o => o.filter(q => q.t === 'L').length >= 10), lip, lipS, others: world.filter(t => t.deck).length }; })()`);
        same(r.n, 12, 'bridge tiles'); same(r.deck, true, 'a bridge tile has the game\'s tile under it'); same(r.base, false, 'a bridge tile has a floor base'); same(r.bars, true, 'a bridge tile has no bars'); same(r.others, 12, 'other tiles marked as grating');
        same(r.lip, true, 'no lip on the north ledge\'s edge'); same(r.lipS, true, 'no lip on the south ledge\'s edge');
        ok(/if \(obj\.deck\) \{[^}]*\}\s*else if \(_spr\)/.test(rd('js/game.js')), 'the game still draws its tile under the grating');
    });
    check('everything draws: the water, rails, stumps, gates, grates, sight glasses and mists, the culvert on both sides, the outfall, the choked tunnel and the sealed hatch, lit and through the dark room\'s dimmed pen, with no sheet; the long water item is on screen from anywhere along it and off it from the arena', () => {
        const r = J(`(function(){ let err = null, n = 0; const its = _fp.items.filter(i => i.fp === 'sewer' || (i.fp === 'wdecor' && (i.culvert || (i.room === 'sewers' && ['outfall', 'rubble', 'sealed_hatch'].includes(i.kind)))));
            try { for (const it of its) { drawFacilityItem(it); n++; } facilityPower('sewers', false); for (const it of its) drawFacilityItem(it); facilityPower('sewers', true); } catch (e) { err = e.message + ' @ ' + n; }
            const W = _fp.items.find(i => i.what === 'water'), at = (x, y) => { player.visualX = x; player.visualY = y; return _fpSpanVisible(W); }, keep = [player.visualX, player.visualY], b = W.band;
            const vis = [at(b[0] + 1, (b[1] + b[3]) / 2), at((b[0] + b[2]) / 2, (b[1] + b[3]) / 2), at(b[2] - 1, (b[1] + b[3]) / 2), at(crystal.x, crystal.y)]; player.visualX = keep[0]; player.visualY = keep[1];
            return { err, n, culverts: its.filter(i => i.culvert).map(i => i.room).sort().join(), kinds: [...new Set(its.filter(i => i.fp === 'wdecor').map(i => i.kind))].sort().join(), vis: vis.join() }; })()`);
        same(r.err, null, 'drawing threw'); ok(r.n >= 30, 'items drawn ' + r.n); same(r.culverts, 'arena,sewers', 'the culverts'); same(r.kinds, 'outfall,portal_door,rubble,sealed_hatch', 'the wall pieces (the choke of rubble is drawn as the arena\'s rubble is)'); same(r.vis, 'true,true,true,false', 'the water on screen along it, and off it from the crystal');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
