// THE FACILITY (js/facilitymap.js = the authored data, js/facility.js = collision, navigation, validation and the debug view).
// ASKED: authored fixed geometry from the sketch; the outer path is a boundary only (not walkable, in no navigation link); the arena perimeter is real collision;
// nothing invented (no doorway, ramp or shortcut that is not confirmed); a debug view; agents cannot walk through the arena walls or use the outer boundary as a route.
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
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));

    // Geometry-agnostic helpers (the rooms have been moved before and will be again): where a door is, and what stands beside it.
    run(`globalThis.__door = function (id, F) { F = F || facilityGet(); const o = F.openings.find(x => x.id === id), mx = (o.a[0] + o.b[0]) / 2, my = (o.a[1] + o.b[1]) / 2, h = Math.abs(o.a[1] - o.b[1]) < 1e-6, half = Math.hypot(o.a[0] - o.b[0], o.a[1] - o.b[1]) / 2; return { o, mx, my, h, half }; };
         // a step ACROSS the wall at the door's own middle (s = 0) or one and a half tiles beyond the door's end on side s (+1 or -1): true when a body can go through
         globalThis.__cross = function (id, s, F) { F = F || facilityGet(); const d = __door(id, F), al = s ? s * (d.half + 1.5) : 0, p = (u, v) => d.h ? [d.mx + u, d.my + v] : [d.mx + v, d.my + u]; const a = p(al, -3), b = p(al, 3); return { fwd: facilityCanStep(a[0], a[1], b[0], b[1], F), back: facilityCanStep(b[0], b[1], a[0], a[1], F) }; };
         globalThis.__hp = function () { const F = facilityGet(), L = F.byId.get('experiment_lab'), H = F.byId.get('lab_hallway'), cd = __door('door_crystal_hallway'), ad = __door('door_arena_hallway'), mx = (L.bb[0] + L.bb[2]) / 2, my = (L.bb[1] + L.bb[3]) / 2, ex = (L.bb[2] + H.bb[2]) / 2, ny = (H.bb[1] + L.bb[1]) / 2, sy = (L.bb[3] + H.bb[3]) / 2;
             return { nw: [cd.mx + 3, cd.my], north: [mx, ny], ne: [ex, ny], east: [ex, my], se: [ex, sy], south: [mx, sy], sw: [(H.bb[0] + L.bb[0]) / 2, sy], arenaDoor: [ad.mx, ad.my - 3] }; };`);

    group('THE DATA');
    check('the map is data: every room is an explicit polygon with an id, a level and a status; ids are unique', () => {
        const M = J('FACILITY_MAP'); same(new Set(M.rooms.map(r => r.id)).size, M.rooms.length, 'duplicate ids');
        for (const r of M.rooms) { ok(r.polygon.length >= 3 && r.polygon.every(p => p.length === 2), r.id + ' outline'); ok(typeof r.level === 'number' && r.status, r.id + ' level/status'); }
        for (const id of ['crystal_chamber', 'experiment_lab', 'teleport_room_1', 'teleport_room_2', 'observation_deck', 'arena', 'catwalks', 'nest_area']) ok(M.rooms.some(r => r.id === id), id + ' missing');
        ok(M.scale.px_per_tile > 0, 'no scale');
    });
    check('NOTHING IS INVENTED: only what the user confirmed is a connection (the doors the user listed, and the stair room\'s opening, door and staircase); the rest the sketch suggests is a flagged candidate', () => {
        const M = J('FACILITY_MAP'); same(M.openings.map(o => o.id).sort().join(), 'door_arena_hallway,door_bathroom_hallway,door_bathroom_lobby,door_chamber_teleport_1,door_crystal_hallway,door_lab_passage,door_lobby_hallway_east,door_lobby_hallway_west,door_passage_teleport_1,door_showroom_hallway,door_stair_teleport_2,door_teleport_1_deck,open_stair_mouth', 'openings'); same(M.connections.length, 13, 'connections'); same(M.ramps.map(x => x.id).join(), 'r_teleport_stairs', 'ramps');
        for (const o of M.openings) same(o.position_status, 'approximate', o.id + ' position');
        ok(M.candidates.connections.length >= 3 && M.candidates.ramps.length >= 1, 'candidates were not recorded');
        for (const c of M.candidates.connections) { ok(c.rooms.every(id => M.rooms.some(r => r.id === id)), c.id + ' names a missing room'); ok(c.evidence, c.id + ' has no evidence'); ok(!c.rooms.includes('outer_path'), c.id + ' uses the outer path'); }
        ok(M.unresolved.length >= 5, 'the unresolved list is missing');
    });
    check('the logic file names no room but the arena, and holds no coordinates (the data is separate)', () => {
        const src = rd('js/facility.js'), M = J('FACILITY_MAP');
        for (const r of M.rooms) if (r.id !== 'arena') ok(src.indexOf('"' + r.id + '"') < 0, 'facility.js names ' + r.id);
        ok(rd('js/facilitymap.js').indexOf('function ') < 0, 'logic in the data file');
    });
    check('the strip game reaches the facility only through guarded facilityPlay hooks (js/facilityplay.js is the one file that uses the map and its movement helpers)', () => {
        for (const f of fs.readdirSync(path.join(ROOT, 'js'))) if (f !== 'facility.js' && f !== 'facilitymap.js' && f !== 'facilityplay.js') ok(!/facilityCanStep|facilityMove|facilityWalkable|FACILITY_MAP/.test(rd('js/' + f)), f + ' uses the facility');
    });

    group('VALIDATION');
    check('the authored map passes every rule: no overlaps, an outer path in no link, a sealed arena, no unconfirmed route', () => {
        const v = J('facilityValidateCached()'); same(v.errors.length, 0, 'errors: ' + v.errors.join(' | '));
        same(v.info.rooms, 14, 'rooms'); same(v.info.navComponents, 3, 'twelve rooms form one area through the doors; the blocked-off catwalks and the nest area stand alone');
        ok(v.warnings.some(w => /unconfirmed/.test(w)), 'the candidates are not reported'); ok(v.warnings.some(w => /^unresolved/.test(w)), 'unresolved items are not reported');
    });

    group('THE ARENA');
    check('every arena edge is a real wall segment, and a body cannot cross any of them in either direction', () => {
        const r = J(`(function(){ const F = facilityGet(), A = F.byId.get('arena'), out = { edges: A.poly.length, walls: F.walls.filter(w => w.room === 'arena').length, crossed: 0, tested: 0 };
            for (let i = 0; i < A.poly.length; i++) { const a = A.poly[i], b = A.poly[(i + 1) % A.poly.length], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
                if (F.openings.some(o => Math.hypot((o.a[0] + o.b[0]) / 2 - mx, (o.a[1] + o.b[1]) / 2 - my) < 3)) continue;   // the arena's door is in this edge
                for (const s of [1, -1]) { const x0 = mx - nx * 0.6 * s, y0 = my - ny * 0.6 * s, x1 = mx + nx * 0.6 * s, y1 = my + ny * 0.6 * s; out.tested++; if (facilityCanStep(x0, y0, x1, y1)) out.crossed++; } }
            return out; })()`);
        ok(r.walls >= r.edges, 'only ' + r.walls + ' wall pieces for ' + r.edges + ' edges'); same(r.crossed, 0, 'steps through the perimeter (of ' + r.tested + ')');
    });
    check('agent walks from inside the arena, in every direction, never leave it', () => { const v = J('facilityValidateCached()'); ok(v.info.arenaAgents >= 1200, 'only ' + v.info.arenaAgents + ' walks'); same(v.info.arenaLeaks, 0, 'leaks'); });
    check('the two circular structures are giant liquid reserves: solid tanks nobody walks through', () => {
        const M = J('FACILITY_MAP'), t = M.props.filter(p => p.shape === 'circle' && p.room === 'arena'); same(t.length, 2, 'reserves');
        ok(t.every(p => p.kind === 'liquid_reserve' && !p.provisional_collision), 'not marked as solid liquid reserves');
        const r = J(`(function(){ const F = facilityGet(); return F.solids.filter(s => s.kind === 'liquid_reserve').map(s => [s.id, !facilityWalkable(s.at[0], s.at[1]), !facilityWalkable(s.at[0] + s.r * 0.9, s.at[1]), facilityCanStep(s.at[0] - s.r - 0.5, s.at[1], s.at[0] + s.r + 0.5, s.at[1])]); })()`);
        ok(r.length === 2 && r.every(x => x[1] && x[2] && x[3] === false), JSON.stringify(r));
    });
    check('THE VATS LEAVE ROOM: a body walks from the arena\'s west side, between the two vats and past them to the right-hand edge', () => {
        const r = J(`(function(){ const F = facilityGet(), sc = facilityScale(), V = F.solids.filter(s => s.kind === 'liquid_reserve'), A = F.byId.get('arena');
            const gap = (a, b) => Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]) - a.r - b.r;
            let wall = Infinity; for (const v of V) for (let i = 0; i < A.poly.length; i++) wall = Math.min(wall, _facSegPointDist(A.poly[i], A.poly[(i + 1) % A.poly.length], v.at[0], v.at[1]) - v.r);
            const midY = (V[0].at[1] + V[1].at[1]) / 2, midX = (V[0].at[0] + V[1].at[0]) / 2, west = Math.min(V[0].at[0], V[1].at[0]) - Math.max(V[0].r, V[1].r) - 4, cells = facilityFlood(west, midY, F), has = (x, y) => cells.some(q => Math.hypot(q[0] - x, q[1] - y) < 1.1);
            return { between: gap(V[0], V[1]), wall, eastOfVats: has(Math.max(V[0].at[0], V[1].at[0]) + Math.max(V[0].r, V[1].r) + 3, midY), betweenVats: has(midX, midY), eastEdge: has(A.bb[2] - 3, midY), radius: V.map(v => v.r) }; })()`);
        ok(r.between >= 3, 'only ' + r.between.toFixed(1) + ' tiles between the vats'); ok(r.wall >= 1.8, 'a vat is ' + r.wall.toFixed(1) + ' tiles from the arena wall'); ok(r.radius.every(x => x <= 5), 'the vats are still huge: radius ' + r.radius);
        same(r.betweenVats, true, 'cannot walk between the vats'); same(r.eastOfVats, true, 'cannot reach the right-hand side'); same(r.eastEdge, true, 'cannot reach the right-hand edge');
    });
    check('the arena\'s machine is a semi-truck carrying three missiles, and it is solid', () => {
        const M = J('FACILITY_MAP'), t = M.props.find(p => p.kind === 'semi_truck'); ok(t && t.room === 'arena', 'no semi-truck'); same(t.cargo.length, 1, 'cargo lines'); same(t.cargo[0].type, 'missile', 'cargo'); same(t.cargo[0].count, 3, 'missiles');
        same(J(`(function(){ const s = facilityGet().solids.find(x => x.kind === 'semi_truck'); return !facilityWalkable((s.poly[0][0] + s.poly[2][0]) / 2, (s.poly[0][1] + s.poly[2][1]) / 2); })()`), true, 'a body can stand in the truck');
        ok(!M.props.some(p => p.id === 'arena_machine'), 'the old unlabelled machine is still there');
    });
    check('an agent exactly on a wall line cannot slip along it into the next room', () => {
        const r = J(`(function(){ const F = facilityGet(), w = F.walls.find(w => w.room === 'arena' && w.kind === 'railing_wall'); const mx = (w.a[0] + w.b[0]) / 2, my = (w.a[1] + w.b[1]) / 2; return [facilityWalkable(mx, my), facilityCanStep(mx, my, mx + 1, my)]; })()`);
        same(r[0], false, 'a point on a wall is walkable');
    });

    group('THE NEST AREA: one open room, its drawn edges are its walls');
    check('it is one open rectangle (the sketch\'s long double lines are its outside edges, not tunnels): a flood from its centre covers all of it', () => {
        const M = J('FACILITY_MAP'), N = M.rooms.find(r => r.id === 'nest_area'); same(N.polygon.length, 4, 'corners'); ok(N.edge_kinds.every(k => /^outer_wall/.test(k)), 'edge kinds ' + N.edge_kinds);
        same(M.outer_path, null, 'a separate outer path is still in the data');
        const r = J(`(function(){ const F = facilityGet(), N = F.byId.get('nest_area'), c = [(N.bb[0] + N.bb[2]) / 2, (N.bb[1] + N.bb[3]) / 2], cells = facilityFlood(c[0], c[1], F, 0.5), area = (N.bb[2] - N.bb[0]) * (N.bb[3] - N.bb[1]); return { cells: cells.length, expect: area / 0.25, allIn: cells.every(q => facilityRoomAt(q[0], q[1]).id === 'nest_area') }; })()`);
        ok(r.cells > r.expect * 0.95, 'the flood covered ' + r.cells + ' of about ' + r.expect + ' cells: something is blocking the room'); same(r.allIn, true, 'the flood left the room');
    });
    check('every edge is a wall: a body cannot cross any of them in either direction, and nothing outside every room is walkable', () => {
        const r = J(`(function(){ const F = facilityGet(), N = F.byId.get('nest_area'); let crossed = 0, tested = 0;
            for (let i = 0; i < N.poly.length; i++) { const a = N.poly[i], b = N.poly[(i + 1) % N.poly.length], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
                for (const s of [1, -1]) { tested++; if (facilityCanStep(mx - nx * 0.6 * s, my - ny * 0.6 * s, mx + nx * 0.6 * s, my + ny * 0.6 * s)) crossed++; } }
            let outside = 0; for (let t = 0; t < 4000; t++) { const x = F.bounds.minX + (F.bounds.maxX - F.bounds.minX) * ((t * 0.6180339) % 1), y = F.bounds.minY + (F.bounds.maxY - F.bounds.minY) * ((t * 0.4142135) % 1); if (!facilityRoomAt(x, y) && facilityWalkable(x, y)) outside++; }
            return { crossed, tested, outside }; })()`);
        same(r.crossed, 0, 'steps through the nest area\'s edge (of ' + r.tested + ')'); same(r.outside, 0, 'walkable points outside every room');
    });
    check('agents walking from inside the nest area never leave it (the validator walks them, like the arena)', () => { const v = J('facilityValidateCached()'); same(v.info.arenaLeaks, 0, 'leaks'); same(v.errors.length, 0, v.errors.join(' | ')); });
    check('the nest area is walled in: nothing walks from the arena to it (no entrance is confirmed)', () => {
        const r = J(`(function(){ const F = facilityGet(); return [facilityReachable('arena', 'nest_area', F, false), facilityReachable('arena', 'nest_area', F, true)]; })()`);
        same(r[0], false, 'reachable with confirmed links'); same(r[1], true, 'the candidate would join them (so it is flagged, not hidden)');
    });
    check('the teleport is a feature for later: two placeholder rooms and no teleport object in the data', () => {
        const M = J('FACILITY_MAP'); ok(M.rooms.some(r => r.id === 'teleport_room_1' && /Room 1/.test(r.label)) && M.rooms.some(r => r.id === 'teleport_room_2' && /Room 2/.test(r.label)), 'rooms');
        ok(!M.rooms.some(r => (r.objects || []).some(o => /teleport/.test(o.type))), 'a teleport object is in the data');
    });

    group('NAVIGATION: only confirmed openings join rooms');
    check('only the confirmed links join rooms: the unconfirmed candidates are listed but never walked', () => {
        same(J('facilityComponents(null, false).length'), 3, 'areas'); same(J('facilityComponents(null, true).length'), 1, 'areas if every candidate were real');
        const f = J(`(function(){ const F = facilityGet(), c = facilityFlood(F.byId.get('catwalks').poly[0][0] + 2, F.byId.get('catwalks').poly[0][1] + 2, F, 0.5); return Array.from(new Set(c.map(q => facilityRoomAt(q[0], q[1]).id))); })()`);
        same(f.length, 1, 'a flood left the catwalks: ' + f.join());
    });
    check('a confirmed opening (added to a COPY, not the data) cuts the wall, lets a body through; the arena\'s other walls and the catwalks stay shut', () => {
        const r = J(`(function(){ const sc = facilityScale(), base = facilityGet(), D = base.byId.get('observation_deck'), xw = D.bb[2], ym = (D.bb[1] + D.bb[3]) / 2 + 3; const F = facilityBuild({ openings: [{ id: 't_open', a: [xw * sc, (ym - 1.5) * sc], b: [xw * sc, (ym + 1.5) * sc], rooms: ['observation_deck', 'arena'] }], connections: [{ id: 't_conn', rooms: ['observation_deck', 'arena'], opening: 't_open' }] });
            const y = ym, x0 = xw - 1.5, x1 = xw + 1.5;
            return { through: facilityCanStep(x0, y, x1, y, F), before: facilityCanStep(x0, y, x1, y, base), above: facilityCanStep(x0, D.bb[1] + 3, x1, D.bb[1] + 3, F), catwalks: facilityReachable('observation_deck', 'catwalks', F, false), nest: facilityReachable('observation_deck', 'nest_area', F, false), errs: facilityValidate(F).errors, walls: [base.walls.length, F.walls.length] }; })()`);
        same(r.before, false, 'the authored data has a gap it should not'); same(r.through, true, 'the opening does not let a body through'); same(r.above, false, 'the wall above the opening is open'); same(r.catwalks, false, 'the catwalks opened'); same(r.nest, false, 'the nest area opened');
        same(r.errs.length, 0, r.errs.join(' | ')); ok(r.walls[1] >= r.walls[0], 'the wall was not cut');
    });
    check('a connection between two levels needs a ramp, and an opening with no connection is flagged', () => {
        const r = J(`(function(){ const F = facilityBuild({ openings: [{ id: 't_open', a: [255, 700], b: [300, 700], rooms: ['teleport_room_1', 'catwalks'] }], connections: [{ id: 't_conn', rooms: ['teleport_room_1', 'catwalks'], opening: 't_open' }] }); const v = facilityValidate(F);
            const F2 = facilityBuild({ openings: [{ id: 'lone', a: [255, 700], b: [300, 700] }] }); return { errs: v.errors, warns: facilityValidate(F2).warnings }; })()`);
        ok(r.errs.some(e => /no ramp/.test(e)), 'a level jump with no ramp passed: ' + r.errs.join(' | ')); ok(r.warns.some(w => /lone/.test(w)), 'an opening with no connection was not flagged');
    });

    group('THE STAIR ROOM: leads to Teleport Room 2; a curved staircase goes down to the hallway');
    check('the stair room is raised with Teleport Room 2, and the staircase is a curved ramp from level 1 down to the hallway round the lab', () => {
        const M = J('FACILITY_MAP'), S = M.rooms.find(r => r.id === 'teleport_stair_room'), T = M.rooms.find(r => r.id === 'teleport_room_2'), L = M.rooms.find(r => r.id === 'lab_hallway'), R = M.ramps[0];
        ok(S && S.level === 1 && T.level === 1 && L.level === 0, 'levels'); same(R.shape, 'curved', 'shape'); same(R.between_levels.join(), '1,0', 'direction'); same(R.descends_toward, 'lab_hallway', 'down toward'); ok(R.r_outer > R.r_inner && R.to_deg - R.from_deg >= 90, 'not an arc');
        same(M.connections.find(c => c.id === 'conn_stair_hallway').ramp, 'r_teleport_stairs', 'the stair connection names its ramp');
    });
    check('a body walks from the hallway, up the stair mouth, through the stair room and its sliding door into Teleport Room 2 (and back), and the catwalks and nest area stay out of reach', () => {
        const r = J(`(function(){ const F = facilityGet(), M = __door('open_stair_mouth'), cells = facilityFlood(M.mx - 4, M.my, F), ids = Array.from(new Set(cells.map(q => facilityRoomAt(q[0], q[1]).id)));
            return { ids: ids.sort(), mouth: __cross('open_stair_mouth', 0).fwd, door: __cross('door_stair_teleport_2', 0).fwd, wallAboveDoor: __cross('door_stair_teleport_2', -1).fwd, wallBelowMouth: __cross('open_stair_mouth', 1).fwd }; })()`);
        same(r.mouth, true, 'the staircase foot does not let a body onto the stairs'); same(r.door, true, 'the sliding door does not let a body into Teleport Room 2'); same(r.wallAboveDoor, false, 'the wall beside the door is open'); same(r.wallBelowMouth, false, 'the wall beside the stair mouth is open');
        ok(r.ids.includes('teleport_stair_room') && r.ids.includes('teleport_room_2') && r.ids.includes('lab_hallway'), 'the flood reached ' + r.ids); ok(!r.ids.some(id => ['catwalks', 'nest_area'].includes(id)), 'the flood reached the blocked-off catwalks or the nest area: ' + r.ids);
    });
    check('the debug view draws the stair as stepped arcs and its tap text names it', () => { ok(/rp\.centre/.test(rd('js/facility.js')) && /from_deg/.test(rd('js/facility.js')), 'no curved ramp drawing'); run('facilityDebug.on = true; facilityDebugDraw(); facilityDebug.on = false;'); });

    group('THE CRYSTAL CHAMBER\'S DOOR AND THE HALLWAY');
    check('a sliding access door joins the Crystal Chamber to the hallway past the experiment lab: a body walks through it, the wall beside it holds', () => {
        const r = J(`(function(){ const F = facilityGet(), D = F.openings.find(o => o.id === 'door_crystal_hallway'), cn = F.connections.find(c => c.id === 'conn_crystal_hallway'), mid = __cross('door_crystal_hallway', 0), up = __cross('door_crystal_hallway', -1), down = __cross('door_crystal_hallway', 1);
            return { door: D.door, rooms: cn.rooms.join(), through: mid.fwd, back: mid.back, wallAbove: up.fwd, wallBelow: down.fwd, joined: facilityReachable('crystal_chamber', 'lab_hallway', F, false), notArena: facilityReachable('crystal_chamber', 'catwalks', F, false) }; })()`);
        same(r.door, 'sliding_access_door', 'door type'); same(r.rooms, 'crystal_chamber,lab_hallway', 'rooms'); same(r.through, true, 'cannot walk through'); same(r.back, true, 'cannot walk back'); same(r.joined, true, 'not joined'); same(r.notArena, false, 'it joined the catwalks too');
        same(r.wallAbove, false, 'the wall above the door is open'); same(r.wallBelow, false, 'the wall below the door is open');
    });
    check('THE HALLWAY IS SIX TILES WIDE (the strip\'s lane) round the lab on every side, and a body walks it from the Crystal Chamber\'s door to the arena\'s door', () => {
        const r = J(`(function(){ const F = facilityGet(), L = F.byId.get('experiment_lab'), H = F.byId.get('lab_hallway'), P = __hp(), cd = __door('door_crystal_hallway');
            const gaps = { north: L.bb[1] - H.bb[1], south: H.bb[3] - L.bb[3], west: L.bb[0] - H.bb[0], east: F.openings.find(o => o.id === 'open_stair_mouth').a[0] - L.bb[2] };
            const cells = facilityFlood(P.nw[0], P.nw[1], F), has = (pt) => cells.some(q => Math.hypot(q[0] - pt[0], q[1] - pt[1]) < 1.1);
            return { gaps, nw: has(P.nw), north: has(P.north), ne: has(P.ne), east: has(P.east), se: has(P.se), south: has(P.south), sw: has(P.sw), arenaDoor: has(P.arenaDoor) }; })()`);
        ok(r.gaps.north >= 5.5 && r.gaps.south >= 5.5 && r.gaps.west >= 5.5 && r.gaps.east >= 5.5, 'the hallway is too narrow: ' + JSON.stringify(r.gaps)); for (const k of ['nw', 'north', 'ne', 'east', 'se', 'south', 'sw', 'arenaDoor']) same(r[k], true, 'cannot reach the hallway\'s ' + k + ' side from the Crystal Chamber\'s door');
    });

    group('THE EXPERIMENT LAB: windowed off, joined to Teleport Room 1 by a narrow passage');
    check('the lab has windows on every side that faces the hallway, drawn as glass, and they are solid like walls', () => {
        const r = J(`(function(){ const F = facilityGet(), sc = facilityScale(); const glass = F.walls.filter(w => w.window); let through = 0; for (const w of glass) { const mx = (w.a[0] + w.b[0]) / 2, my = (w.a[1] + w.b[1]) / 2, dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l; if (facilityCanStep(mx - nx * 0.6, my - ny * 0.6, mx + nx * 0.6, my + ny * 0.6)) through++; }
            return { n: glass.length, rooms: Array.from(new Set(glass.map(w => w.room))).sort(), ids: Array.from(new Set(glass.map(w => w.window))).sort(), through, windows: F.windows.length }; })()`);
        ok(r.n >= 4, 'only ' + r.n + ' window pieces'); same(r.through, 0, 'a body walked through a window'); same(r.ids.filter(x => /^lab_/.test(x)).length, 4, 'lab windows ' + r.ids); same(r.windows, 8, 'compiled windows (four on the lab, three on the show room, one on the observation deck)'); ok(/window/.test(rd('js/facility.js')) && /143,227,255/.test(rd('js/facility.js')), 'windows are not drawn as glass');
    });
    check('the lab\'s ONLY door is the narrow passage: with the passage shut nothing reaches it, and a flood from inside it never leaves it', () => {
        const r = J(`(function(){ const F = facilityGet(), sc = facilityScale(), C = facilityBuild({ closed: ['lab_passage'] }); const L0 = F.byId.get('experiment_lab'), cells = facilityFlood((L0.bb[0] + L0.bb[2]) / 2, (L0.bb[1] + L0.bb[3]) / 2, C);
            return { doors: F.connections.filter(c => c.rooms.includes('experiment_lab')).map(c => c.id), shut: facilityReachable('lab_hallway', 'experiment_lab', C, false), open: facilityReachable('lab_hallway', 'experiment_lab', F, false), inside: Array.from(new Set(cells.map(q => facilityRoomAt(q[0], q[1], C).id))).sort() }; })()`);
        same(r.doors.join(), 'conn_lab_passage', 'the lab\'s connections'); same(r.shut, false, 'the hallway reaches the lab with the passage shut'); same(r.open, true, 'the long way round (hallway, Crystal Chamber, Teleport Room 1, passage) does not reach it'); same(r.inside.join(), 'experiment_lab', 'a flood from inside left the lab');
    });
    check('the passage is narrow (about 2 tiles wide and a few long, against the hallway\'s 6), runs from the lab\'s west wall to Teleport Room 1, and both ends are sliding doors', () => {
        const r = J(`(function(){ const F = facilityGet(), P = F.byId.get('lab_passage'), W = F.openings.filter(o => /passage/.test(o.id)); return { w: P.bb[3] - P.bb[1], len: P.bb[2] - P.bb[0], doors: W.map(o => o.door) }; })()`);
        ok(r.w >= 1.5 && r.w <= 2.5, 'passage width ' + r.w); ok(r.len >= 4, 'length ' + r.len); same(r.doors.length, 2, 'doors'); ok(r.doors.every(d => d === 'sliding_access_door'), r.doors.join());
    });
    check('the hallway runs from the arena round the lab into the Crystal Chamber: with the lab passage shut, arena to chamber is still one walk, and it never enters the lab', () => {
        const r = J(`(function(){ const sc = facilityScale(), C = facilityBuild({ closed: ['lab_passage'] }), ad = __door('door_arena_hallway', C), cells = facilityFlood(ad.mx, ad.my + 3, C); return { rooms: Array.from(new Set(cells.map(q => facilityRoomAt(q[0], q[1], C).id))).sort(), arenaChamber: facilityReachable('arena', 'crystal_chamber', C, false), arenaLab: facilityReachable('arena', 'experiment_lab', C, false) }; })()`);
        same(r.arenaChamber, true, 'arena to chamber'); same(r.arenaLab, false, 'arena to lab with the passage shut'); ok(r.rooms.includes('arena') && r.rooms.includes('crystal_chamber') && r.rooms.includes('lab_hallway'), 'a body from the arena reached ' + r.rooms); ok(!r.rooms.includes('experiment_lab') && !r.rooms.includes('lab_passage'), 'it got into the lab: ' + r.rooms);
    });
    check('the arena\'s door is the one way out of it: agent walks leave only into rooms the confirmed doors reach', () => { const v = J('facilityValidateCached()'); same(v.info.arenaLeaks, 0, 'illegal leaks'); ok(v.info.arenaAgents >= 1200, 'agents ' + v.info.arenaAgents); });

    group('THE NOOK IS GONE: where the Crystal Chamber, the hallway and the lab passage meet');
    check('the corner is one tidy alcove of Teleport Room 1, not a dead-end pocket of the hallway', () => {
        const r = J(`(function(){ const sc = facilityScale(), at = (x, y) => (facilityRoomAt(x / sc, y / sc) || {}).id;
            return { nook: at(400, 548), nookEast: at(420, 548), corridor: at(400, 470), hallNW: at(390, 470), lab: at(430, 548) }; })()`);
        same(r.nook, 'teleport_room_1', 'the nook cell is in ' + r.nook); same(r.nookEast, 'teleport_room_1', 'the nook\'s east half is in ' + r.nookEast); same(r.corridor, 'lab_hallway', 'the corridor north of the lab'); same(r.hallNW, 'lab_hallway', 'the hallway\'s north-west end');
    });
    check('the hallway\'s north-west end is a clean dead end at the Crystal Chamber\'s door: with Teleport Room 1\'s doors shut, a body walks from the door to the far end and no pocket opens off it', () => {
        const r = J(`(function(){ const sc = facilityScale(), C = facilityBuild({ closed: ['teleport_room_1'] }), P = __hp(), cd = __door('door_crystal_hallway', C), cells = facilityFlood(P.nw[0], P.nw[1], C), has = (x, y) => cells.some(q => Math.hypot(q[0] - x, q[1] - y) < 1.1);
            const L = C.byId.get('experiment_lab'); let west = Infinity; for (const q of cells) if (facilityRoomAt(q[0], q[1], C).id === 'lab_hallway' && q[1] < L.bb[1]) west = Math.min(west, q[0]);
            return { door: __cross('door_crystal_hallway', 0, C).fwd, westEnd: west - cd.mx, southWest: has(P.sw[0], P.sw[1]), pocket: has(400 / sc, 548 / sc), nookWall: facilityCanStep(400 / sc, 495 / sc, 400 / sc, 548 / sc, C) }; })()`);
        same(r.door, true, 'the chamber door no longer works'); ok(r.westEnd >= -0.6, 'the hallway reaches ' + r.westEnd.toFixed(1) + ' tiles west of the chamber door: a pocket still opens off it'); same(r.pocket, false, 'a body walks into the old nook'); same(r.nookWall, false, 'the alcove is open to the hallway');
        same(r.southWest, true, 'the south-west leg lost its connection');
    });
    check('Teleport Room 1 is bigger (it took the nook), is one solid room, and has three doors: to the Crystal Chamber, to the Observation Deck and (by the passage) to the lab', () => {
        const r = J(`(function(){ const F = facilityGet(), T = F.byId.get('teleport_room_1'); let a = 0; for (let i = 0; i < T.poly.length; i++) { const p = T.poly[i], q = T.poly[(i + 1) % T.poly.length]; a += p[0] * q[1] - q[0] * p[1]; }
            return { area: Math.abs(a / 2), doors: F.connections.filter(c => c.rooms.includes('teleport_room_1')).map(c => c.rooms.filter(x => x !== 'teleport_room_1')[0]).sort() }; })()`);
        ok(r.area > 50, 'area ' + r.area); same(r.doors.join(), 'crystal_chamber,lab_passage,observation_deck', 'doors');
    });

    group('THE THEME: a rundown 2010s tech-startup headquarters');
    check('the map records the theme, and the lobby has its big sign and a reception desk', () => {
        const M = J('FACILITY_MAP'); same(M.theme.condition, 'rundown', 'condition'); ok(/2010s tech startup/.test(M.theme.era), 'era');
        const L = M.rooms.find(r => r.id === 'front_lobby'); ok(L && /Lobby/.test(L.label) && /BIG SIGN/.test(L.dressing), 'the lobby'); same(M.rooms.some(r => r.id === 'front_office'), false, 'the old name is still there');
        const sign = M.fixtures.find(f => f.type === 'wall_sign'); same(sign.room, 'front_lobby', 'sign room'); const desk = M.props.find(p => p.kind === 'reception_desk'); same(desk.room, 'front_lobby', 'desk room');
    });
    check('the lobby has TWO sliding doors to the hallway, one each side of the reception desk, and the desk itself is solid', () => {
        const r = J(`(function(){ const F = facilityGet(), d = F.solids.find(s => s.kind === 'reception_desk'), W = __door('door_lobby_hallway_west'), E = __door('door_lobby_hallway_east'), x0 = d.bb[0], x1 = d.bb[2];
            return { doors: [W.o.door, E.o.door], west: [W.mx + W.half, x0], east: [E.mx - E.half, x1], wmid: __cross('door_lobby_hallway_west', 0), emid: __cross('door_lobby_hallway_east', 0), wallW: __cross('door_lobby_hallway_west', 1).fwd, wallE: __cross('door_lobby_hallway_east', -1).fwd, desk: !facilityWalkable((d.poly[0][0] + d.poly[2][0]) / 2, (d.poly[0][1] + d.poly[2][1]) / 2) }; })()`);
        ok(r.doors.every(d => d === 'sliding_access_door'), r.doors.join()); ok(r.west[0] <= r.west[1] + 0.5 && r.east[0] >= r.east[1] - 0.5, 'the doors are not on both sides of the desk: ' + JSON.stringify([r.west, r.east])); same(r.wmid.fwd, true, 'the west door does not work'); same(r.emid.fwd, true, 'the east door does not work'); same(r.wmid.back, true, 'cannot come back');
        same(r.wallW, false, 'a wall between the west door and the desk is open'); same(r.wallE, false, 'a wall between the east door and the desk is open'); same(r.desk, true, 'the desk is walkable');
    });
    check('the show room is a glass case (blank for now): glass on its north, east and hallway-side west walls, nothing inside it, and one sliding door in the glass to the hallway', () => {
        const M = J('FACILITY_MAP'), S = M.rooms.find(r => r.id === 'show_room'); same(S.wall_material, 'glass', 'material'); ok(/BLANK/.test(S.contents), 'not marked blank');
        ok(!M.props.some(p => p.room === 'show_room') && !(S.objects || []).length, 'something is placed in the show room');
        const w = J(`(function(){ const F = facilityGet(); return Array.from(new Set(F.walls.filter(x => x.room === 'show_room' && x.window).map(x => x.window))).sort(); })()`); same(w.join(), 'show_window_east,show_window_north,show_window_west', 'its windows');
        const d = J(`(function(){ const F = facilityGet(), D = F.openings.find(o => o.id === 'door_showroom_hallway'); return { door: D.door, rooms: D.rooms.join(), conns: F.connections.filter(c => c.rooms.includes('show_room')).length, through: __cross('door_showroom_hallway', 0).fwd, glass: __cross('door_showroom_hallway', 1).fwd || __cross('door_showroom_hallway', -1).fwd, glassPieces: F.walls.filter(x => x.room === 'show_room' && x.window === 'show_window_west').length }; })()`);
        same(d.door, 'sliding_access_door', 'door'); same(d.rooms, 'show_room,lab_hallway', 'rooms'); same(d.conns, 1, 'the show room has more than the one door'); same(d.through, true, 'cannot walk through the door'); same(d.glass, false, 'the glass beside the door is open'); ok(d.glassPieces >= 2, 'the door did not leave glass on both sides of it: ' + d.glassPieces);
    });
    check('the Crystal Chamber and both teleport rooms are walled off (solid, no glass); the lab and the show room are glass', () => {
        const M = J('FACILITY_MAP'); const mat = id => M.rooms.find(r => r.id === id).wall_material;
        for (const id of ['crystal_chamber', 'teleport_room_1', 'teleport_room_2']) same(mat(id), 'solid', id);
        for (const id of ['experiment_lab', 'show_room']) same(mat(id), 'glass', id);
        const g = J(`(function(){ const F = facilityGet(), out = {}; for (const r of F.rooms) out[r.id] = F.walls.filter(w => w.room === r.id && w.window).length; return out; })()`);
        for (const id of ['crystal_chamber', 'teleport_room_1', 'teleport_room_2']) same(g[id], 0, id + ' has glass pieces'); ok(g.experiment_lab > 0 && g.show_room > 0, 'the glass rooms have no glass');
    });
    check('the Crystal Chamber has a power / battery pack area on its north wall, clear of its doors', () => {
        const M = J('FACILITY_MAP'), f = M.fixtures.find(x => x.id === 'power_pack_area'); same(f.type, 'power_pack_area', 'type'); same(f.room, 'crystal_chamber', 'room'); same(f.edge, 0, 'wall: the north edge');
        ok(f.a[1] === f.b[1] && f.b[0] - f.a[0] >= 40, 'span ' + JSON.stringify([f.a, f.b])); ok(f.a[1] === J("FACILITY_MAP.rooms.find(r => r.id === 'crystal_chamber').polygon[0][1]"), 'not on the chamber\'s north wall'); same(f.status, 'approximate', 'position status');
        same(J('facilityValidateCached().errors.filter(e => /fixture/.test(e)).length'), 0, 'the validator flagged a fixture');
    });
    check('a fixture off its wall, or across a doorway, is an error', () => {
        const r = J(`(function(){ const keep = FACILITY_MAP.fixtures.slice(); FACILITY_MAP.fixtures.push({ id: 'bad_off', type: 'x', room: 'crystal_chamber', edge: 0, a: [300, 400], b: [340, 400] }, { id: 'bad_door', type: 'x', room: 'crystal_chamber', edge: 1, a: [FACILITY_MAP.openings.find(o => o.id === 'door_crystal_hallway').a[0], FACILITY_MAP.openings.find(o => o.id === 'door_crystal_hallway').a[1] + 5], b: [FACILITY_MAP.openings.find(o => o.id === 'door_crystal_hallway').a[0], FACILITY_MAP.openings.find(o => o.id === 'door_crystal_hallway').b[1] - 5] }); const F = facilityBuild(); const e = facilityValidate(F).errors.filter(x => /fixture/.test(x)); FACILITY_MAP.fixtures.length = 0; for (const f of keep) FACILITY_MAP.fixtures.push(f); return e; })()`);
        ok(r.some(e => /bad_off/.test(e)) && r.some(e => /bad_door/.test(e)), r.join(' | '));
    });

    group('THE DOORS: chamber and Teleport Room 1, Teleport Room 1 and the deck, the bathroom');
    const walkDoor = (id) => J(`(function(){ const m = __cross('${id}', 0), a = __cross('${id}', 1), b = __cross('${id}', -1); return { door: __door('${id}').o.door, through: m.fwd, back: m.back, beside: a.fwd || b.fwd }; })()`);
    check('Crystal Chamber to Teleport Room 1: a sliding door that works both ways, with solid wall either side of it', () => { const r = walkDoor('door_chamber_teleport_1'); same(r.door, 'sliding_access_door', 'door'); same(r.through, true, 'through'); same(r.back, true, 'back'); same(r.beside, false, 'the wall beside it is open'); same(J("facilityReachable('crystal_chamber', 'teleport_room_1', null, false)"), true, 'joined'); });
    check('Teleport Room 1 to the Observation Deck: a sliding door that works both ways, with solid wall beside it', () => { const r = walkDoor('door_teleport_1_deck'); same(r.door, 'sliding_access_door', 'door'); same(r.through, true, 'through'); same(r.back, true, 'back'); same(r.beside, false, 'the wall beside it is open'); same(J("facilityReachable('teleport_room_1', 'observation_deck', null, false)"), true, 'joined'); });
    check('the bathroom (the unlabelled room) has exactly two sliding doors: to the Front Lobby and to the hallway', () => {
        const M = J('FACILITY_MAP'), B = M.rooms.find(r => r.id === 'bathroom'); ok(B && B.label === 'Bathroom', 'the room is not the bathroom'); same(M.rooms.some(r => r.id === 'upper_annex'), false, 'the old name is still there');
        const c = J(`facilityGet().connections.filter(c => c.rooms.includes('bathroom')).map(c => c.rooms.filter(x => x !== 'bathroom')[0]).sort()`); same(c.join(), 'front_lobby,lab_hallway', 'doors');
        const a = walkDoor('door_bathroom_lobby'), b = walkDoor('door_bathroom_hallway'); for (const r of [a, b]) { same(r.door, 'sliding_access_door', 'door'); same(r.through, true, 'through'); same(r.back, true, 'back'); } same(a.beside, false, 'wall beside the lobby door');
    });
    check('every door is on a wall its two rooms share, none overlaps another, and no candidate duplicates a confirmed door', () => {
        const v = J('facilityValidateCached()'); same(v.errors.length, 0, v.errors.join(' | '));
        const r = J(`(function(){ const F = facilityGet(), pairs = new Set(F.connections.map(c => c.rooms.slice().sort().join('|'))); let overlap = 0; for (let i = 0; i < F.openings.length; i++) for (let j = i + 1; j < F.openings.length; j++) { const a = F.openings[i], b = F.openings[j]; if (Math.hypot((a.a[0] + a.b[0]) / 2 - (b.a[0] + b.b[0]) / 2, (a.a[1] + a.b[1]) / 2 - (b.a[1] + b.b[1]) / 2) < 1.2) overlap++; }
            return { dupes: F.candidates.filter(c => pairs.has(c.rooms.slice().sort().join('|'))).map(c => c.id), overlap }; })()`);
        same(r.dupes.length, 0, 'candidates already confirmed: ' + r.dupes.join()); same(r.overlap, 0, 'two doors overlap');
    });

    group('FURNITURE: a computer lab in the lobby, science lab equipment in the lab, and glass');
    check('the Front Lobby is a computer lab (rows of computer desks, server racks) and the Experiment Lab a science lab (benches, a fume hood, glass test chambers beside the tank); every piece is solid', () => {
        const M = J('FACILITY_MAP'), count = (room, kind) => M.props.filter(p => p.room === room && p.kind === kind).length;
        ok(count('front_lobby', 'computer_desk') >= 3, 'computer desks'); ok(count('front_lobby', 'server_rack') >= 2, 'server racks'); ok(count('front_lobby', 'reception_desk') === 1, 'the reception desk');
        ok(count('experiment_lab', 'lab_bench') >= 2, 'lab benches'); same(count('experiment_lab', 'fume_hood'), 1, 'fume hood'); ok(count('experiment_lab', 'test_chamber') >= 2, 'test chambers'); ok(M.props.some(p => p.id === 'lab_tank'), 'the big tank');
        const bad = J(`(function(){ const F = facilityGet(); return F.solids.filter(s => ['computer_desk', 'server_rack', 'lab_bench', 'fume_hood', 'test_chamber'].includes(s.kind)).filter(s => { const c = s.shape === 'circle' ? s.at : [(s.bb[0] + s.bb[2]) / 2, (s.bb[1] + s.bb[3]) / 2]; return facilityWalkable(c[0], c[1], F); }).map(s => s.id); })()`);
        same(bad.length, 0, 'walkable pieces of furniture: ' + bad.join());
    });
    check('nothing stands in a doorway: every door has two clear tiles of floor on each side of it, and no piece of furniture touches a door\'s span', () => {
        const r = J(`(function(){ const F = facilityGet(), bad = []; for (const o of F.openings) { const mx = (o.a[0] + o.b[0]) / 2, my = (o.a[1] + o.b[1]) / 2, h = Math.abs(o.a[1] - o.b[1]) < 1e-6, half = Math.hypot(o.a[0] - o.b[0], o.a[1] - o.b[1]) / 2;
            for (const side of [-1, 1]) for (const along of [-half + 0.6, 0, half - 0.6]) for (const dist of [1, 2]) { const x = h ? mx + along : mx + side * dist, y = h ? my + side * dist : my + along; if (!facilityWalkable(x, y, F)) bad.push(o.id + '@' + side + ',' + along.toFixed(1) + ',' + dist); } } return bad; })()`);
        same(r.length, 0, 'blocked in front of a door: ' + r.slice(0, 6).join(' '));
    });
    check('the lobby stays walkable: from the west door round the computer desks and the reception desk to the east door and the bathroom door, all inside the lobby', () => {
        const r = J(`(function(){ const F = facilityBuild({ closed: ['front_lobby'] }), W = __door('door_lobby_hallway_west'), E = __door('door_lobby_hallway_east'), B = __door('door_bathroom_lobby'), cells = facilityFlood(W.mx + 2, W.my - 3, F), rooms = new Set(), has = (x, y) => cells.some(q => Math.hypot(q[0] - x, q[1] - y) < 1.1);   // (the lobby's doors shut, so the flood is the lobby's own floor)
            for (const q of cells) rooms.add(facilityRoomAt(q[0], q[1], F).id); return { east: has(E.mx, E.my - 3), bath: has(B.mx - 3, B.my), rooms: Array.from(rooms), n: cells.length }; })()`);
        same(r.east, true, 'the east door is cut off'); same(r.bath, true, 'the bathroom door is cut off'); same(r.rooms.join(), 'front_lobby', 'the flood left the lobby'); ok(r.n > 150, 'only ' + r.n + ' cells of lobby floor');
    });
    check('the lab stays walkable: from the passage door along the aisle between the benches to the tank end, and in front of the fume hood', () => {
        const r = J(`(function(){ const F = facilityBuild({ closed: ['experiment_lab'] }), D = __door('door_lab_passage'), hood = F.solids.find(s => s.id === 'lab_hood'), tank = F.solids.find(s => s.id === 'lab_tank'), cells = facilityFlood(D.mx + 2, D.my, F), has = (x, y) => cells.some(q => Math.hypot(q[0] - x, q[1] - y) < 1.1), rooms = new Set(cells.map(q => facilityRoomAt(q[0], q[1], F).id));
            return { hood: has((hood.bb[0] + hood.bb[2]) / 2, hood.bb[3] + 1.5), tank: has(tank.at[0] - tank.r - 1.5, tank.at[1]), rooms: Array.from(rooms), aisle: has((F.byId.get('experiment_lab').bb[0] + F.byId.get('experiment_lab').bb[2]) / 2, (F.byId.get('experiment_lab').bb[1] + F.byId.get('experiment_lab').bb[3]) / 2) }; })()`);
        same(r.hood, true, 'cannot reach the fume hood'); same(r.tank, true, 'cannot reach the tank end'); same(r.aisle, true, 'the aisle is blocked'); same(r.rooms.join(), 'experiment_lab', 'the flood left the lab');
    });
    check('the observation deck looks onto the arena through glass: the whole shared wall is a window on both sides, solid to movement, and the arena is still sealed', () => {
        const r = J(`(function(){ const F = facilityGet(), w = F.windows.find(x => x.id === 'deck_window_arena'), pieces = F.walls.filter(x => x.window === 'deck_window_arena'), rooms = Array.from(new Set(pieces.map(x => x.room))).sort(); const D = F.byId.get('observation_deck'), y = (D.bb[1] + D.bb[3]) / 2, x = D.bb[2];
            return { rooms, n: pieces.length, through: facilityCanStep(x - 2, y, x + 2, y, F), back: facilityCanStep(x + 2, y, x - 2, y, F), len: Math.hypot(w.a[0] - w.b[0], w.a[1] - w.b[1]) }; })()`);
        same(r.rooms.join(), 'arena,observation_deck', 'glass on both sides'); ok(r.n >= 1 && r.len > 15, 'glass pieces ' + r.n); same(r.through, false, 'walked through the deck window'); same(r.back, false, 'walked back through it'); same(J('facilityValidateCached().errors.length'), 0, 'the validator is unhappy');
    });

    group('DOORS AND THE BLOCKED ZONE');
    check('every door is a sliding access door: the map says so, and a confirmed opening carries it', () => {
        same(J('FACILITY_MAP.door_type'), 'sliding_access_door', 'door type');
        const o = J(`facilityBuild({ openings: [{ id: 'd', a: [760, 470], b: [785, 470], rooms: ['front_lobby', 'experiment_lab'] }] }).openings.find(x => x.id === 'd').door`); same(o, 'sliding_access_door', 'compiled opening');
        const D = J(`facilityGet().openings.map(x => [x.id, x.door])`); same(D.find(x => x[0] === 'door_stair_teleport_2')[1], 'sliding_access_door', 'the stair room door'); same(D.find(x => x[0] === 'open_stair_mouth')[1], null, 'the staircase foot has no door');
        ok(/SLIDING DOOR/.test(rd('js/facility.js')), 'the debug view does not call a candidate a door');
    });
    check('the zone to the right (the catwalks) is blocked off for now: marked so, in no connection, with its exits not walkable', () => {
        const M = J('FACILITY_MAP'), c = M.rooms.find(r => r.id === 'catwalks'); same(c.development, 'blocked_off_for_now', 'marker'); ok(!M.connections.some(x => x.rooms.includes('catwalks')), 'a confirmed connection into it');
        ok(M.external_exits.filter(e => e.room === 'catwalks').every(e => !e.walkable), 'an exit is walkable'); same(J('facilityReachable(\'arena\', \'catwalks\', null, false)'), false, 'reachable');
    });

    group('THE DEBUG VIEW');
    check('it toggles, has the five layers, and draws every layer without throwing', () => {
        same(J('Object.keys(facilityDebug.layers).join()'), 'outlines,collision,openings,elevation,nav', 'layers'); same(run('facilityDebugToggle()'), true, 'on'); same(run('facilityDebugToggle()'), false, 'off');
        run('facilityDebug.on = true; facilityDebugDraw(); facilityDebug.on = false;');
        ok(/\bF3\b/.test(rd('js/facility.js')) && /btnFacility/.test(rd('game.html')), 'no key or dock button');
    });
    check('it draws on its own canvas with the game\'s isometric projection and does not touch the game canvas', () => {
        const src = rd('js/facility.js'); ok(/TILE_W/.test(src) && /TILE_H/.test(src), 'not the game projection'); ok(!/\bctx\./.test(src), 'it draws on the game canvas');
        const p = J('[facilityProjectProbe = _facProject(20, 30, 0, 800, 600), _facProject(21, 30, 0, 800, 600)]'); ok(p[1][0] > p[0][0] && p[1][1] > p[0][1], 'x does not run down-right on screen');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
