// THE SEWERS (js/facilitymap.js the room `sewers`; js/facilitysewers.js its drawing; docs/FACILITY.md, "The Sewers").
// ASKED: "make it look like the little liquid holding tanks have some sort of runoff into the sewers [...] make the sewers another location as well, that have a deep sort of river that cuts across two
// narrow paths, with room to have more areas later and a boss fight, and make it also have cut off entrances with gated areas." Chosen with the user: in the arena, the subtle little overflow grates where
// the tanks' pipes go into the floor (no words on the floor) and the arched SEWER culvert in the back rock as the way down; below, layout A (a narrow ledge each side of the deep river); empty for now.
//   THE ARENA      the culvert's alcove in the north rock behind the north tank (a portal), the two overflow grates at the tanks' pipes
//   THE SEWERS     an interior under the arena, out of sight of every room, powered with the arena; two ledges (the north two tiles deep, the south three since 2026-11-01), the deep river between (nothing walks
//                  in it), a bridge, a broken one and the service bridge by the Nest, two side passages, Side Quest's platform and the Nest shut behind gates, a collapsed tunnel and a sealed hatch, the outfall
//                  where the runoff pours in; THE NEST: the reservoir and the moat round its trash dam, the big barred arch, the brood holes, the eggs, the waterfall over its spill lip
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
    check('layout A, opened up (2026-11-01: "Widen the left-side sewer areas. Open up the river-side sections"): one long tunnel, the north ledge five tiles deep and the south ledge three, each side of a river three tiles across (the owner, 2026-11-07: "make the sewer river 3 tiles wide"; it was six, the north ledge two); the river is DEEP (nothing walks in it anywhere), the bridge crosses it (two tiles wide, the river\'s lengths end either side of it), the broken bridge does not', () => {
        const r = J(`(function(){ const F = _fp.F, W = __SW, b = W.band, walk = c => facilityWalkable(c[0], c[1], F), decks = F.decor.filter(d => d.kind === 'bridge_deck').map(d => d.rect), riverCells = []; for (let x = Math.ceil(b[0]); x <= b[2]; x++) for (let y = Math.ceil(b[1]); y < b[3]; y++) { if (decks.some(dk => x > dk[0] && x < dk[2])) continue; riverCells.push(walk([x, y])); }
            const riv = F.solids.filter(s => s.kind === 'river').map(s => [Math.min(...s.poly.map(q => q[0])), Math.max(...s.poly.map(q => q[0]))]).sort((a, c) => a[0] - c[0]), mx = (W.broken[0] + W.broken[2]) / 2;
            return { width: b[3] - b[1], len: b[2] - b[0], north: [0, 1, 2].every(k => walk([W.north[0], W.north[1] - k])), northW: facilityWalkable(W.north[0], W.north[1] - 3, F), south: [0, 1, 2, 3, 4].every(k => walk([W.south[0], W.south[1] + k])), southW: facilityWalkable(W.south[0], W.south[1] + 5, F),
                river: riverCells.some(v => v), n: riverCells.length, bridge: walk(W.bridge), gap: [riv[0][1], riv[1][0]], deck: [W.deck[0], W.deck[2]], cross: facilityCanStep(mx, b[1] - 0.6, mx, b[3] + 0.6, F), brokenWalk: walk([Math.round(mx), Math.round((W.broken[1] + W.broken[3]) / 2)]) }; })()`);
        same(r.width, 3, 'the river\'s width'); ok(r.len >= 36, 'the tunnel is only ' + r.len + ' tiles long'); same(r.north, true, 'the north ledge is not three tiles deep'); same(r.northW, false, 'the north ledge is more than three tiles deep'); same(r.south, true, 'the south ledge is not five tiles deep (the owner, 2026-11-07: "make that side of the bank bigger")'); same(r.southW, false, 'the south ledge is more than five tiles deep');
        same(r.river, false, 'a tile of the river is walkable'); ok(r.n > 75, 'river cells ' + r.n); same(r.bridge, true, 'the bridge is not floor'); same(JSON.stringify(r.gap), JSON.stringify(r.deck), 'the river\'s two lengths do not end at the bridge\'s sides'); ok(r.deck[1] - r.deck[0] === 2, 'the bridge is not two tiles wide');
        same(r.cross, false, 'the broken bridge can be crossed'); same(r.brokenWalk, false, 'the broken bridge is floor');
    });
    check('the cut-off ways: a side passage off the north ledge, Side Quest\'s platform off it (his gate), a side passage off the south ledge and the Nest, each shut by a gate on the line of its mouth (the boss\'s gate across the south ledge\'s way in); behind each there is floor, but from the culvert nothing behind a gate is reached, and with the gates taken away all of it is', () => {
        const r = J(`(function(){ const F = _fp.F, W = __SW, P = facilityPortal('portal_sewers_arena'), key = c => c[0] + ',' + c[1], fl = facilityFlood(P.ax, P.ay, F), reach = new Set(fl.map(c => key([Math.round(c[0]), Math.round(c[1])])));
            const keep = F.solids; F.solids = F.solids.filter(s => !/gate$/.test(s.kind) && s.id !== 'sewer_gate_boss'); F._ix = null; const fl2 = facilityFlood(P.ax, P.ay, F), reach2 = new Set(fl2.map(c => key([Math.round(c[0]), Math.round(c[1])]))); F.solids = keep; F._ix = null;
            return { gates: W.gates.map(g => [g.id, g.kind, facilityWalkable(g.behind[0], g.behind[1], F), reach.has(key(g.behind)), reach2.has(key(g.behind))]), cistern: [facilityWalkable(W.cistern[0], W.cistern[1], F), reach.has(key(W.cistern)), reach2.has(key(W.cistern))],
                     ledges: [reach.has(key(W.north)), reach.has(key(W.south)), reach.has(key(W.bridge))], n: reach.size, n2: reach2.size }; })()`);
        same(r.gates.map(g => g[1]).sort().join(), 'gate,gate,gate', 'the gates (the boss gate is rubble since build 2026-11-06l: tests/sewerquest.js)'); for (const g of r.gates) same(g.slice(2).join(), 'true,false,true', g[0] + ': floor behind, not reached, reached without the gate');
        same(r.cistern.join(), 'true,false,true', 'the cistern'); same(r.ledges.join(), 'true,true,true', 'the ledges and the bridge are not reached from the culvert'); ok(r.n2 > r.n + 60, 'the gates shut little: ' + r.n + ' / ' + r.n2);
    });
    check('the dressing: the outfall where the runoff pours into the river\'s head (the west wall), the culvert back up at the west end of the north ledge, the bridge\'s grating and the broken bridge, the collapsed tunnel and the sealed hatch on the north wall, the sump in the cistern; lights, pipes, damp', () => {
        const M = J('FACILITY_MAP'), d = id => M.decor.find(x => x.id === id), S = M.rooms.find(r => r.id === 'sewers'), minX = Math.min(...S.polygon.map(q => q[0]));
        ok(d('sewer_culvert_up').kind === 'portal_door' && d('sewer_culvert_up').culvert && d('sewer_culvert_up').a[0] === minX, 'the culvert up is not at the west end');
        ok(d('sewer_outfall').kind === 'outfall' && d('sewer_outfall').a[0] === minX + 20, 'the outfall is not on the river\'s west wall'); same(d('sewer_bridge').kind, 'bridge_deck', 'the bridge'); same(d('sewer_bridge_broken').kind, 'bridge_broken', 'the broken bridge');
        ok(!d('sewer_collapse'), 'the collapsed tunnel is no longer a wall decoration: it is a broken-off floor behind a choke of rubble (tests/sewerquest.js)'); ok(M.props.some(p => p.id === 'sewer_choke' && p.kind === 'rubble') && M.rubble.some(r => r.id === 'rubble_sewer_choke' && r.solid === 'sewer_choke' && !r.inside), 'the choke (drilled from the ledge, not from inside)');
        same(d('sewer_hatch').kind, 'sealed_hatch', 'the sealed hatch'); ok(['nest_reservoir', 'nest_moat'].every(id => M.props.some(p => p.id === id && p.kind === 'pool' && p.shape === 'poly')) && !M.props.some(p => p.id === 'sewer_sump'), 'the Nest\'s reservoir and moat (the round sump is gone)'); ok(M.props.some(p => p.id === 'purifier_mount' && p.kind === 'console'), 'the purifier mount');
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
    // REPORTED: "When I enter the sewers with a full squad, the game puts my followers inside of that little gated off section and they get stuck there forever." The first barred stub off the north ledge is two
    // tiles from the culvert's arrival tile, and the spot a carried follower was put on was any floor of the room within two tiles: 80 of 300 landed behind the gate (js/facilityportals.js _pSpot).
    check('nobody is put behind a gate: 300 followers carried down the culvert all land on the arrival tile\'s own stretch of floor (none in the first stub behind sewer_gate_n1, which is floor of the room two tiles away), and not all on the one tile', () => {
        const r = J(`(function(){ const dest = facilityPortal('portal_sewers_arena'), from = facilityPortal('portal_arena_sewers'), cm = _fpComps(), ac = cm.get(dest.ax + ',' + dest.ay), o = { on: 0, off: 0, tiles: new Set(), stub: 0 };
            const g = _fp.F.solids.find(s => s.id === 'sewer_gate_n1'); o.gateShut = !!(g && !g.open); const inStub = (x, y) => g && x > g.bb[0] && x < g.bb[2] && y < g.bb[1] && y > g.bb[1] - 4;
            for (let i = 0; i < 300; i++) { const a = { x: 0, y: 0 }; facilityPortalSend(a, from, 1 + (i % 3)); const c = _fpNearestCell(a.x, a.y); if (cm.get(c[0] + ',' + c[1]) === ac) o.on++; else o.off++; o.tiles.add(c.join()); if (inStub(a.x, a.y)) o.stub++; }
            o.tiles = o.tiles.size; o.near = (function(){ let n = 0; for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) { const k = (dest.ax + dx) + ',' + (dest.ay + dy); if (_fp.cellsP.has(k) && cm.get(k) !== ac) n++; } return n; })(); return o; })()`);
        same(r.gateShut, true, 'the first gate is shut'); ok(r.near >= 2, 'the stub\'s floor is not within two tiles of the arrival any more (the map moved?): ' + r.near); same(r.off, 0, 'put on another stretch'); same(r.stub, 0, 'put behind the gate'); same(r.on, 300, 'on the ledge'); ok(r.tiles >= 3, 'spread over the tiles: ' + r.tiles);
    });
    check('one already behind the gate (a saved game from before) is put beside the player by the second scan in a row that finds it on a pocket (a few cells, no doorway out, no landing); one on the catwalks (a launcher lands there: it walks to its drop), in the air, or on a big stretch cut off for the moment is left where it is', () => {
        const r = J(`(function(){ const dest = facilityPortal('portal_sewers_arena'), cm = _fpComps(), o = {}; const keep = followers.map(f => [f, f.x, f.y, f.stance, f.post, f.job, f._fpPortalAt]);
            player.x = player.targetX = player.visualX = dest.ax; player.y = player.targetY = player.visualY = dest.ay; const pc = cm.get(dest.ax + ',' + dest.ay);
            const g = _fp.F.solids.find(s => s.id === 'sewer_gate_n1'); const sx = Math.round((g.bb[0] + g.bb[2]) / 2 - 0.5), sy = Math.round(g.bb[1]) - 1; o.stubCell = [sx, sy, _fp.cellsP.has(sx + ',' + sy), cm.get(sx + ',' + sy) !== pc];
            const f = followers[0]; f.x = sx; f.y = sy; f.stance = 'follow'; f.post = null; f.job = null; f.returningToCrystal = false; f._fpPortalAt = 0; f._fpSealed = 0; f._flight = null; f._launchLoad = null; f._dropSite = null; frame += 200;
            _pFollowScan(); o.first = [Math.round(f.x) === sx && Math.round(f.y) === sy, f._fpSealed, f._fpPortalGoal || null];
            _pFollowScan(); const c = _fpNearestCell(f.x, f.y); o.second = [cm.get(c[0] + ',' + c[1]) === pc, Math.hypot(f.x - player.x, f.y - player.y) <= 3.2, f._fpSealed, f._fpPath];
            // the catwalks: a follower on a launcher's landing stretch stays (the player in the arena)
            const site = (_fp.F.launchSites || []).find(s => s.id === 'site_arena_catwalk'); const h = followers[1] || f; const hk = [h.x, h.y];
            if (site) { const ar = facilityPortal('portal_arena_sewers'); player.x = player.visualX = ar.ax; player.y = player.visualY = ar.ay + 3; h.x = site.land[0]; h.y = site.land[1]; h.stance = 'follow'; h.post = null; h.job = null; h.returningToCrystal = false; h._fpPortalAt = 0; h._fpSealed = 0; h._flight = null; h._launchLoad = null; h._dropSite = null;
                _pFollowScan(); _pFollowScan(); _pFollowScan(); o.catwalk = [h.x === site.land[0] && h.y === site.land[1], cm.get(site.land[0] + ',' + site.land[1]) !== cm.get(_fpNearestCell(player.x, player.y).join()), h._fpSealed || 0]; }
            // in the air (a launched follower, mid flight) in the stub: left alone
            f.x = sx; f.y = sy; f._flight = { x0: sx, y0: sy }; f._fpSealed = 0; _pFollowScan(); _pFollowScan(); _pFollowScan(); o.air = [Math.round(f.x) === sx && Math.round(f.y) === sy, f._fpSealed || 0]; f._flight = null;
            // a big stretch with no doorway to the player's (the cistern behind its shut boss gate: some sixty cells) is no pocket: a follower there waits
            const pm = _fp.stations.find(s => s.id === 'st_purifier'); const ck = pm && _fpNearestCell(pm.x - 3, pm.y); o.cistern = [!!ck, ck && _fp.compSize.get(cm.get(ck.join())), ck && cm.get(ck.join()) !== pc];
            if (ck) { player.x = player.visualX = dest.ax; player.y = player.visualY = dest.ay; f.x = ck[0]; f.y = ck[1]; f._fpSealed = 0; _pFollowScan(); _pFollowScan(); _pFollowScan(); o.big = [Math.round(f.x) === ck[0] && Math.round(f.y) === ck[1], f._fpSealed || 0]; }
            o.stubSize = _fp.compSize.get(cm.get(sx + ',' + sy));
            keep.forEach(([u, x, y, st, po, jb, pa]) => { u.x = x; u.y = y; u.stance = st; u.post = po; u.job = jb; u._fpPortalAt = pa; u._fpSealed = 0; u._fpPath = null; }); player.x = player.targetX = player.visualX = crystal.x + 2; player.y = player.targetY = player.visualY = crystal.y + 1; return o; })()`);
        ok(r.stubCell[2] && r.stubCell[3], 'the stub cell is not floor on its own stretch: ' + JSON.stringify(r.stubCell)); same(r.first.join(), 'true,1,', 'the first scan counts, moves nothing, finds no doorway'); same(r.second.slice(0, 3).join(), 'true,true,0', 'the second puts it beside the player, on the player\'s stretch'); same(r.second[3], null, 'its route was let go');
        if (r.catwalk) same(r.catwalk.join(), 'true,true,0', 'the catwalk follower was moved'); same(r.air.join(), 'true,0', 'one in the air was moved');
        ok(r.stubSize > 0 && r.stubSize <= J('FP_PORTAL.pocket'), 'the stub is a pocket of ' + r.stubSize + ' cells'); ok(r.cistern[0] && r.cistern[1] > J('FP_PORTAL.pocket') && r.cistern[2], 'the cistern is not a big stretch of its own: ' + JSON.stringify(r.cistern)); same((r.big || []).join(), 'true,0', 'a follower on the big cut-off stretch was moved');
    });

    group('THE DRAWING');
    check('the items: the water once (a long item, drawn before everything else in the room, its band the river\'s and its pools the Nest\'s reservoir and moat), both bridges\' rails a tile at a time on both sides, the broken bridge\'s two stumps, the four gates (the boss\'s marked), each overflow grate in every tile it covers with its sight glass and its mist; the water and gates are no furniture (no prop pieces, no sprite)', () => {
        const r = J(`(function(){ const it = _fp.items.filter(i => i.fp === 'sewer'), by = w => it.filter(i => i.what === w), W = by('water')[0], deck = _fp.F.decor.find(d => d.id === 'sewer_bridge').rect, deck2 = _fp.F.decor.find(d => d.id === 'sewer_bridge_east').rect;
            return { water: by('water').length, span: !!(W && W.span), depth: W && W.depth, low: W && W.depth < Math.min(..._fp.items.filter(i => i.room === 'sewers' && i !== W && i.depth !== undefined).map(i => i.depth)), band: W && W.band, pools: W && W.pools.length, polys: W && W.polys.map(p => p.id).sort().join(), room: W && W.room,
                rails: by('rail').length, railSides: [...new Set(by('rail').map(i => i.side))].sort().join(), railLen: (deck[3] - deck[1]) + (deck2[3] - deck2[1]), stumps: by('stump').length, gates: by('gate').length, boss: by('gate').filter(i => i.boss).length,
                grates: by('grate').length, glass: by('glass').length, mist: by('mist').length, props: _fp.items.filter(i => i.fp === 'prop' && FP_SELF_SOLIDS.has(i.kind)).length, self: [...FP_SELF_SOLIDS].sort().join() }; })()`);
        same(r.water, 1, 'water items'); same(r.span, true, 'the water is not a long item'); same(r.low, true, 'the water is not drawn first in its room'); same(r.room, 'sewers', 'its room'); same(r.band && r.band[3] - r.band[1], 3, 'the band'); same(r.pools, 0, 'a round pool (the old sump)'); same(r.polys, 'nest_moat,nest_reservoir', 'the Nest\'s water');
        same(r.rails, r.railLen * 2, 'rail pieces'); same(r.railSides, '-1,1', 'both sides'); same(r.stumps, 2, 'stumps'); same(r.gates, 3, 'gates'); same(r.boss, 0, 'a boss gate (rubble now)'); ok(r.grates >= 2, 'grate pieces ' + r.grates); same(r.glass, 2, 'sight glasses'); same(r.mist, 2, 'mists');
        same(r.props, 0, 'water or gates drawn as furniture'); same(r.self, 'boss_gate,gate,pool,river,rubble', 'the kinds that draw themselves (rubble: a choke, drawn by the rubble it is the solid of: tests/sewerquest.js)');
    });
    check('the bridge\'s tiles are a grating with nothing under it (the game\'s tile is not drawn there, and its floor has no base, only bars), and the ledges have a lit lip where they drop into the water', () => {
        const r = J(`(function(){ const d = _fp.F.decor.find(x => x.id === 'sewer_bridge').rect, tiles = world.filter(t => t.x > d[0] && t.x < d[2] && t.y > d[1] && t.y < d[3]), ops = tiles.map(t => _fp.floorOps.get(t.x + ',' + t.y) || []);
            const W = __SW, lip = (_fp.floorOps.get(W.north[0] + ',' + W.north[1]) || []).some(o => o.t === 'L' && o.p && o.p[1] === 0.5 && o.p[3] === 0.5 && /205,212,220/.test(o.c)), lipS = (_fp.floorOps.get(W.south[0] + ',' + W.south[1]) || []).some(o => o.t === 'L' && o.p && o.p[1] === -0.5 && o.p[3] === -0.5 && /205,212,220/.test(o.c));
            return { n: tiles.length, deck: tiles.every(t => t.deck), base: ops.some(o => o.some(q => q.t === 'D')), bars: ops.every(o => o.filter(q => q.t === 'L').length >= 10), lip, lipS, others: world.filter(t => t.deck).length }; })()`);
        same(r.n, 6, 'bridge tiles'); same(r.deck, true, 'a bridge tile has the game\'s tile under it'); same(r.base, false, 'a bridge tile has a floor base'); same(r.bars, true, 'a bridge tile has no bars'); same(r.others, 12, 'tiles marked as grating (the two bridges, six each)');
        same(r.lip, true, 'no lip on the north ledge\'s edge'); same(r.lipS, true, 'no lip on the south ledge\'s edge');
        ok(/if \(obj\.deck\) \{[^}]*\}\s*else if \(_spr\)/.test(rd('js/game.js')), 'the game still draws its tile under the grating');
    });
    check('everything draws: the water, rails, stumps, gates, grates, sight glasses and mists, the culvert on both sides, the outfall, the choked tunnel and the sealed hatch, lit and through the dark room\'s dimmed pen, with no sheet; the long water item is on screen from anywhere along it and off it from the arena', () => {
        const r = J(`(function(){ let err = null, n = 0; const its = _fp.items.filter(i => i.fp === 'sewer' || (i.fp === 'wdecor' && (i.culvert || (i.room === 'sewers' && ['outfall', 'rubble', 'sealed_hatch'].includes(i.kind)))));
            try { for (const it of its) { drawFacilityItem(it); n++; } facilityPower('sewers', false); for (const it of its) drawFacilityItem(it); facilityPower('sewers', true); } catch (e) { err = e.message + ' @ ' + n; }
            const W = _fp.items.find(i => i.what === 'water'), at = (x, y) => { player.visualX = x; player.visualY = y; return _fpSpanVisible(W); }, keep = [player.visualX, player.visualY], b = W.band;
            const vis = [at(b[0] + 1, (b[1] + b[3]) / 2), at((b[0] + b[2]) / 2, (b[1] + b[3]) / 2), at(b[2] - 1, (b[1] + b[3]) / 2), at(crystal.x, crystal.y)]; player.visualX = keep[0]; player.visualY = keep[1];
            return { err, n, culverts: its.filter(i => i.culvert).map(i => i.room).sort().join(), kinds: [...new Set(its.filter(i => i.fp === 'wdecor').map(i => i.kind))].sort().join(), vis: vis.join() }; })()`);
        same(r.err, null, 'drawing threw'); ok(r.n >= 30, 'items drawn ' + r.n); same(r.culverts, 'arena,sewers,sewers,sewers', 'the culverts (the arena\'s, the Sewers\' way up, and the drain pipe\'s two ends, 2026-11-07)'); same(r.kinds, 'outfall,portal_door,rubble,sealed_hatch', 'the wall pieces (the choke of rubble is drawn as the arena\'s rubble is)'); same(r.vis, 'true,true,true,false', 'the water on screen along it, and off it from the crystal');
    });

    group('THE NEST AND THE OPENED-UP SEWERS (2026-11-01: the Toxic Ant Queen\'s colony on its trash dam; the waterfall and the big barred arch from the user\'s sketch; the service bridge; Side Quest\'s platform)');
    check('the Nest is a named area of the Sewers\' east end: the zone tag reads The Nest inside it and Sewers outside; it is js/population.js NESTS.sewer_nest\'s, behind the boss gate', () => {
        const r = J(`(function(){ const F = _fp.F, A = F.decor.find(d => d.kind === 'area' && d.room === 'sewers'), g = F.solids.find(s => s.id === 'sewer_gate_boss'), keep = [player.visualX, player.visualY, _fp.zoneRoom];
            const tag = (x, y) => { player.visualX = x; player.visualY = y; return facilityZoneName(); }, inN = tag((A.rect[0] + A.rect[2]) / 2, (A.rect[1] + A.rect[3]) / 2), out = tag(g.bb[0] - 4, (g.bb[1] + g.bb[3]) / 2);
            player.visualX = keep[0]; player.visualY = keep[1]; _fp.zoneRoom = keep[2]; return { label: A && A.label, nest: A && A.nest, inN, out, westOfGate: Math.abs(A.rect[0] - (g.bb[0] + g.bb[2]) / 2) < 0.6, def: NESTS[A.nest] && NESTS[A.nest].zone }; })()`);
        same(r.label, 'The Nest', 'the area\'s label'); same(r.nest, 'sewer_nest', 'its Nest'); same(r.inN, 'The Nest', 'the tag inside'); same(r.out, 'Sewers', 'the tag outside'); same(r.westOfGate, true, 'the area does not begin at the boss gate');
    });
    check('THE TRASH DAM: a wide flat platform over the water (at least 120 cells, one stretch with the causeway from the gate), the console and the queen\'s post on it at its north-west, the reservoir west of it and the moat round its south and east (water: nothing walks in it), and nothing of it reached before the gate opens', () => {
        const r = J(`(function(){ const F = _fp.F, cm = _fpComps(), A = F.decor.find(d => d.kind === 'area' && d.room === 'sewers'), L = bossLair(BOSS_ENCOUNTERS.sewer_cistern), m = _fp.stations.find(s => s.id === 'st_purifier'), Lc = _fpNearestCell(L[0], L[1]), comp = cm.get(Lc[0] + ',' + Lc[1]);
            const cells = [..._fp.cellsP.values()].filter(c => c[0] >= A.rect[0] && c[0] <= A.rect[2] && c[1] >= A.rect[1] && c[1] <= A.rect[3]), dam = cells.filter(c => cm.get(c[0] + ',' + c[1]) === comp);
            const res = F.solids.find(s => s.id === 'nest_reservoir'), moat = F.solids.find(s => s.id === 'nest_moat'), wet = s => { let n = 0, dry = 0; for (let x = Math.ceil(s.bb[0]); x <= s.bb[2]; x++) for (let y = Math.ceil(s.bb[1]); y <= s.bb[3]; y++) if (facilityPointInPoly(x, y, s.poly)) { n++; if (facilityWalkable(x, y, F)) dry++; } return [n, dry]; };
            const P = facilityPortal('portal_sewers_arena'), here = cm.get(P.ax + ',' + P.ay);
            return { n: dam.length, all: dam.length === cells.length, lair: facilityWalkable(L[0], L[1], F), nw: L[0] < (A.rect[0] + A.rect[2]) / 2 && L[1] < (A.rect[1] + A.rect[3]) / 2, mount: [m.x < L[0], Math.hypot(m.x - L[0], m.y - L[1]) < 2],
                res: wet(res), moat: wet(moat), resWest: res.bb[2] <= Math.min(...dam.filter(c => c[1] < res.bb[3] - 0.5).map(c => c[0])) + 0.01,   /* (beside it: the causeway runs south of it) */ moatS: moat.bb[3] > Math.max(...dam.map(c => c[1])), moatE: moat.bb[2] > Math.max(...dam.map(c => c[0])), apart: comp !== here }; })()`);
        ok(r.n >= 120, 'the dam is ' + r.n + ' cells'); same(r.all, true, 'a stretch of the Nest is cut off from the dam'); same(r.lair, true, 'her post is not on the floor'); same(r.nw, true, 'her post is not at the dam\'s north-west'); same(r.mount.join(), 'true,true', 'the console is not just west of her post');
        ok(r.res[0] > 30 && r.res[1] === 0, 'the reservoir: ' + r.res); ok(r.moat[0] > 30 && r.moat[1] === 0, 'the moat: ' + r.moat); same(r.resWest, true, 'the reservoir is not west of the dam'); same(r.moatS && r.moatE, true, 'the moat is not round the dam\'s south and east'); same(r.apart, true, 'the dam is reached with the boss gate shut');
    });
    check('THE WATERFALL and THE BIG BARRED ARCH (the user\'s sketch): the Nest\'s east and south edges are a low SPILL lip (kind spill: the moat is seen over it, and nothing walks past it), the waterfall a tile at a time along the east one; the arch on the north wall over the reservoir, its top past the wall\'s, the stream coming out under its bars', () => {
        const r = J(`(function(){ const F = _fp.F, sp = F.walls.filter(w => w.room === 'sewers' && w.kind === 'spill'), falls = _fp.items.filter(i => i.fp === 'sewer' && i.what === 'falls'), A = F.decor.find(d => d.kind === 'sewer_arch'), res = F.solids.find(s => s.id === 'nest_reservoir'), xs = sp.map(w => [w.a[0], w.b[0]]).flat();
            const east = sp.filter(w => Math.abs(w.a[0] - w.b[0]) < 1e-6), south = sp.filter(w => Math.abs(w.a[1] - w.b[1]) < 1e-6), ex = east.length ? east[0].a[0] : null;
            return { spill: sp.length, east: east.length, south: south.length, falls: falls.length, onLip: falls.every(f => Math.abs(f.a[0] - ex) < 0.01), span: falls.length && Math.abs(Math.max(...falls.map(f => f.b[1])) - Math.min(...falls.map(f => f.a[1]))),
                block: !facilityCanStep(ex - 0.6, (east[0].a[1] + east[0].b[1]) / 2, ex + 0.6, (east[0].a[1] + east[0].b[1]) / 2, F), arch: !!A && FAC_WALL_DECOR.has('sewer_arch') && A.a[1] === A.b[1] && Math.abs(A.a[1] - res.bb[1]) < 0.01 && A.a[0] >= res.bb[0] - 0.01 && A.b[0] <= res.bb[2] + 0.01 }; })()`);
        ok(r.east >= 1 && r.south >= 1, 'the spill lips: ' + r.east + ' east, ' + r.south + ' south'); ok(r.falls >= 10, 'the waterfall is ' + r.falls + ' tiles'); same(r.onLip, true, 'the waterfall is not on the east lip'); ok(r.span >= 10, 'the waterfall spans ' + r.span + ' tiles');
        same(r.block, true, 'something walks past the spill lip'); same(r.arch, true, 'the arch is not on the north wall over the reservoir');
        const src = rd('js/facilitysewers.js'); ok(/sewer_arch: \(it, f\) => \{[\s\S]*?H = FP_WALL_H \+ 46/.test(src), 'the arch does not rise past the wall'); ok(/the stream: out under the bars/.test(src), 'no stream out of the arch');
        ok(/if \(it\.kind === "spill" && typeof _fpDrawSpillLip === "function"\) return _fpDrawSpillLip\(it\);/.test(rd('js/facilityplay.js')), 'a spill edge is drawn as a full wall');
    });
    check('THE COLONY: brood holes (two in the north ledge\'s wall, two in the Nest\'s) are where the brood comes up when one will do; eggs and junk lie on floor; the dam\'s rim runs along every edge it drops into the water; the eggs, holes and resin glow while the Nest is infested and go dark once it is cleared', () => {
        const r = J(`(function(){ const F = _fp.F, holes = F.decor.filter(d => d.kind === 'brood_hole' && d.room === 'sewers'), A = F.decor.find(d => d.kind === 'area' && d.room === 'sewers'), inN = d => d.a[0] >= A.rect[0] - 0.01, from = _fsFromCells(FP_SPAWN_SEWERS), it = w => _fp.items.filter(i => i.fp === 'sewer' && i.what === w);
            const tones = {}; const S = bossState('sewer_cistern'), Q = questState('purify'), keep = [S.state, S.outcome, Q.purifiedAt]; const t = (st, oc, p) => { S.state = st; S.outcome = oc; Q.purifiedAt = p; _fpNestToneF = -1; return _fpNestTone(frame).g; };
            tones.infested = t('armed', null, 0); tones.stirred = t('active', null, 0); tones.calmed = t('resolved', 'calm', 5); tones.cleared = t('resolved', 'defeated', 5); S.state = keep[0]; S.outcome = keep[1]; Q.purifiedAt = keep[2]; _fpNestToneF = -1;
            return { holes: holes.length, nest: holes.filter(inN).length, from: from.length, eggs: it('egg').length, eggsOk: it('egg').every(e => facilityWalkable(e.x, e.y, F)), junk: it('junk').length, rim: it('rim').length, faces: it('rim').filter(i => i.face).length, tones }; })()`);
        same(r.holes, 4, 'brood holes'); same(r.nest, 2, 'brood holes in the Nest'); same(r.from, 4, 'a hole the brood cannot come up at'); ok(r.eggs >= 12 && r.eggsOk, 'eggs: ' + r.eggs); ok(r.junk >= 8, 'junk: ' + r.junk); ok(r.rim >= 40 && r.faces >= 20, 'the rim: ' + r.rim + ' pieces, ' + r.faces + ' with a face');
        ok(r.tones.stirred >= r.tones.infested && r.tones.infested > r.tones.calmed && r.tones.calmed > r.tones.cleared && r.tones.cleared === 0, 'the glow by state: ' + JSON.stringify(r.tones));
    });
    check('everything of the Nest draws in each of its four states, lit and dark, with no sheet: the eggs, junk, rim, waterfall and pools, the arch, the brood holes, the resin and the spill lips', () => {
        const r = J(`(function(){ let err = null, n = 0; const its = _fp.items.filter(i => (i.fp === 'sewer' && ['egg', 'junk', 'rim', 'falls', 'water'].includes(i.what)) || (i.fp === 'wdecor' && ['sewer_arch', 'brood_hole', 'resin'].includes(i.kind)) || (i.fp === 'wall' && i.kind === 'spill'));
            const S = bossState('sewer_cistern'), Q = questState('purify'), keep = [S.state, S.outcome, Q.purifiedAt];
            try { for (const [st, oc, p] of [['armed', null, 0], ['active', null, 0], ['resolved', 'calm', 5], ['resolved', 'defeated', 5]]) { S.state = st; S.outcome = oc; Q.purifiedAt = p; _fpNestToneF = -1; for (const it of its) { drawFacilityItem(it); n++; } }
                  facilityPower('sewers', false); for (const it of its) drawFacilityItem(it); facilityPower('sewers', true); } catch (e) { err = e.message + ' @ ' + n; }
            S.state = keep[0]; S.outcome = keep[1]; Q.purifiedAt = keep[2]; _fpNestToneF = -1; return { err, n, kinds: [...new Set(its.map(i => i.what || i.kind))].sort().join() }; })()`);
        same(r.err, null, 'drawing threw'); same(r.kinds, 'brood_hole,egg,falls,junk,resin,rim,sewer_arch,spill,water', 'the kinds drawn'); ok(r.n > 100, 'drawn ' + r.n);
    });
    check('THE LOOP (2026-11-01: "Improve room connectivity and navigation"): the service bridge crosses from the north ledge\'s east end to the south ledge just short of the Nest\'s gate: from the collapsed tunnel\'s mouth the way to the gate goes over it, and the way back round by the first bridge is far longer; from the culvert either bridge will do', () => {
        const r = J(`(function(){ const F = _fp.F, d = F.decor.find(x => x.id === 'sewer_bridge_east').rect, d1 = F.decor.find(x => x.id === 'sewer_bridge').rect, g = F.solids.find(s => s.id === 'sewer_gate_boss'), P = facilityPortal('portal_sewers_arena');
            const len = (p, x, y) => { let n = 0; for (const q of p) { n += Math.hypot(q[0] - x, q[1] - y); x = q[0]; y = q[1]; } return n; }, near = (p, x0, y0, q) => { let x = x0, y = y0; for (const w of p) { if (_facSegPointDist([x, y], w, q[0], q[1]) < 1.2) return true; x = w[0]; y = w[1]; } return false; };
            const front = _fpNearestCell(g.bb[0] - 1.2, (g.bb[1] + g.bb[3]) / 2), mid = [(d[0] + d[2]) / 2, (d[1] + d[3]) / 2], cross = facilityCanStep(mid[0], d[1] - 0.6, mid[0], d[3] + 0.6, F);
            const T = F.rubble.find(x => x.id === 'rubble_sewer_choke'), o = _fpNearestCell(T.work[0], T.work[1]), s1 = _fpNearestCell((d1[0] + d1[2]) / 2, d1[3] + 0.6), n1 = _fpNearestCell((d1[0] + d1[2]) / 2, d1[1] - 0.6);
            const p = facilityPath(o[0], o[1], front[0], front[1]), a = facilityPath(o[0], o[1], n1[0], n1[1]), a2 = facilityPath(n1[0], n1[1], s1[0], s1[1]), b = facilityPath(s1[0], s1[1], front[0], front[1]), c = facilityPath(P.ax, P.ay, front[0], front[1]);
            return { cross, by: !!p && !!c, over: !!p && near(p, o[0], o[1], mid), len: p ? len(p, o[0], o[1]) : 0, other: !!(a && a2 && b), len2: a && a2 && b ? len(a, o[0], o[1]) + len(a2, n1[0], n1[1]) + len(b, s1[0], s1[1]) : 0, nearGate: Math.abs(d[2] - g.bb[0]) <= 2.2 }; })()`);
        same(r.cross, true, 'the service bridge does not cross'); same(r.nearGate, true, 'the service bridge is not by the gate'); same(r.by, true, 'no way to the gate'); same(r.over, true, 'the way to the gate does not go over the service bridge'); same(r.other, true, 'no way round by the first bridge'); ok(r.len2 > r.len * 2.5, 'the ways from the tunnel\'s site: over the service bridge ' + r.len.toFixed(1) + ', round by the first ' + r.len2.toFixed(1));
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
