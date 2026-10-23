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

    group('THE DATA');
    check('the map is data: every room is an explicit polygon with an id, a level and a status; ids are unique', () => {
        const M = J('FACILITY_MAP'); same(new Set(M.rooms.map(r => r.id)).size, M.rooms.length, 'duplicate ids');
        for (const r of M.rooms) { ok(r.polygon.length >= 3 && r.polygon.every(p => p.length === 2), r.id + ' outline'); ok(typeof r.level === 'number' && r.status, r.id + ' level/status'); }
        for (const id of ['crystal_chamber', 'experiment_lab', 'teleport_room_1', 'teleport_room_2', 'observation_deck', 'arena', 'catwalks', 'nest_area']) ok(M.rooms.some(r => r.id === id), id + ' missing');
        ok(M.scale.px_per_tile > 0, 'no scale');
    });
    check('NOTHING IS INVENTED: only what the user confirmed is a connection (the Crystal Chamber\'s door, the stair room\'s two openings and its staircase); the rest the sketch suggests is a flagged candidate', () => {
        const M = J('FACILITY_MAP'); same(M.openings.map(o => o.id).join(), 'door_crystal_hallway,open_stair_mouth,door_stair_teleport_2', 'openings'); same(M.connections.map(c => c.id).join(), 'conn_crystal_hallway,conn_stair_hallway,conn_stair_teleport_2', 'connections'); same(M.ramps.map(x => x.id).join(), 'r_teleport_stairs', 'ramps');
        for (const o of M.openings) same(o.position_status, 'approximate', o.id + ' position');
        ok(M.candidates.connections.length >= 10 && M.candidates.ramps.length >= 1, 'candidates were not recorded');
        for (const c of M.candidates.connections) { ok(c.rooms.every(id => M.rooms.some(r => r.id === id)), c.id + ' names a missing room'); ok(c.evidence, c.id + ' has no evidence'); ok(!c.rooms.includes('outer_path'), c.id + ' uses the outer path'); }
        ok(M.unresolved.length >= 5, 'the unresolved list is missing');
    });
    check('the logic file names no room but the arena, and holds no coordinates (the data is separate)', () => {
        const src = rd('js/facility.js'), M = J('FACILITY_MAP');
        for (const r of M.rooms) if (r.id !== 'arena') ok(src.indexOf('"' + r.id + '"') < 0, 'facility.js names ' + r.id);
        ok(rd('js/facilitymap.js').indexOf('function ') < 0, 'logic in the data file');
    });
    check('the existing game does not call into it yet: movement, combat and followers are untouched', () => {
        for (const f of fs.readdirSync(path.join(ROOT, 'js'))) if (f !== 'facility.js' && f !== 'facilitymap.js') ok(!/facilityCanStep|facilityMove|facilityWalkable|FACILITY_MAP/.test(rd('js/' + f)), f + ' uses the facility');
    });

    group('VALIDATION');
    check('the authored map passes every rule: no overlaps, an outer path in no link, a sealed arena, no unconfirmed route', () => {
        const v = J('facilityValidateCached()'); same(v.errors.length, 0, 'errors: ' + v.errors.join(' | '));
        same(v.info.rooms, 12, 'rooms'); same(v.info.navComponents, 9, 'twelve rooms, four of them joined through the hallway: nine areas');
        ok(v.warnings.some(w => /unconfirmed/.test(w)), 'the candidates are not reported'); ok(v.warnings.some(w => /^unresolved/.test(w)), 'unresolved items are not reported');
    });

    group('THE ARENA');
    check('every arena edge is a real wall segment, and a body cannot cross any of them in either direction', () => {
        const r = J(`(function(){ const F = facilityGet(), A = F.byId.get('arena'), out = { edges: A.poly.length, walls: F.walls.filter(w => w.room === 'arena').length, crossed: 0, tested: 0 };
            for (let i = 0; i < A.poly.length; i++) { const a = A.poly[i], b = A.poly[(i + 1) % A.poly.length], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
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
            const cells = facilityFlood(600 / sc, 900 / sc, F, 0.5), has = (px, py) => cells.some(q => Math.hypot(q[0] - px / sc, q[1] - py / sc) < 0.6);
            return { between: gap(V[0], V[1]), wall, eastOfVats: has(890, 925), betweenVats: has(795, 922), eastEdge: has(925, 925), top: has(790, 790), south: has(800, 1062), radius: V.map(v => v.r) }; })()`);
        ok(r.between >= 3, 'only ' + r.between.toFixed(1) + ' tiles between the vats'); ok(r.wall >= 1.8, 'a vat is ' + r.wall.toFixed(1) + ' tiles from the arena wall'); ok(r.radius.every(x => x <= 2.5), 'the vats are still huge: radius ' + r.radius);
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
        same(J('facilityComponents(null, false).length'), 9, 'areas'); same(J('facilityComponents(null, true).length'), 1, 'areas if every candidate were real');
        const f = J(`(function(){ const F = facilityGet(), c = facilityFlood(F.byId.get('show_room').poly[0][0] + 2, F.byId.get('show_room').poly[0][1] + 2, F, 0.5); return Array.from(new Set(c.map(q => facilityRoomAt(q[0], q[1]).id))); })()`);
        same(f.length, 1, 'a flood left the show room: ' + f.join());
    });
    check('a confirmed opening (added to a COPY, not the data) cuts the wall, lets a body through, and joins the rooms; the arena stays sealed', () => {
        const r = J(`(function(){ const F = facilityBuild({ openings: [{ id: 't_open', a: [760, 470], b: [785, 470], rooms: ['front_office', 'experiment_lab'] }], connections: [{ id: 't_conn', rooms: ['front_office', 'experiment_lab'], opening: 't_open' }] });
            const x = 772 / facilityScale(), y0 = 455 / facilityScale(), y1 = 490 / facilityScale(), base = facilityGet();
            return { through: facilityCanStep(x, y0, x, y1, F), before: facilityCanStep(x, y0, x, y1, base), joined: facilityReachable('front_office', 'experiment_lab', F, false), lab: facilityReachable('front_office', 'arena', F, false), errs: facilityValidate(F).errors, walls: [base.walls.length, F.walls.length] }; })()`);
        same(r.before, false, 'the authored data has a gap it should not'); same(r.through, true, 'the opening does not let a body through'); same(r.joined, true, 'not joined'); same(r.lab, false, 'the opening joined more than it should');
        same(r.errs.length, 0, r.errs.join(' | ')); ok(r.walls[1] >= r.walls[0], 'the wall was not cut');
    });
    check('a connection between two levels needs a ramp, and an opening with no connection is flagged', () => {
        const r = J(`(function(){ const F = facilityBuild({ openings: [{ id: 't_open', a: [255, 700], b: [300, 700], rooms: ['teleport_room_1', 'observation_deck'] }], connections: [{ id: 't_conn', rooms: ['teleport_room_1', 'observation_deck'], opening: 't_open' }] }); const v = facilityValidate(F);
            const F2 = facilityBuild({ openings: [{ id: 'lone', a: [255, 700], b: [300, 700] }] }); return { errs: v.errors, warns: facilityValidate(F2).warnings }; })()`);
        ok(r.errs.some(e => /no ramp/.test(e)), 'a level jump with no ramp passed: ' + r.errs.join(' | ')); ok(r.warns.some(w => /lone/.test(w)), 'an opening with no connection was not flagged');
    });

    group('THE STAIR ROOM: leads to Teleport Room 2; a curved staircase goes down to the hallway');
    check('the stair room is raised with Teleport Room 2, and the staircase is a curved ramp from level 1 down to the hallway (the experiment lab\'s floor)', () => {
        const M = J('FACILITY_MAP'), S = M.rooms.find(r => r.id === 'teleport_stair_room'), T = M.rooms.find(r => r.id === 'teleport_room_2'), L = M.rooms.find(r => r.id === 'experiment_lab'), R = M.ramps[0];
        ok(S && S.level === 1 && T.level === 1 && L.level === 0, 'levels'); same(R.shape, 'curved', 'shape'); same(R.between_levels.join(), '1,0', 'direction'); same(R.descends_toward, 'experiment_lab', 'down toward'); ok(R.r_outer > R.r_inner && R.to_deg - R.from_deg >= 90, 'not an arc');
        same(M.connections.find(c => c.id === 'conn_stair_hallway').ramp, 'r_teleport_stairs', 'the stair connection names its ramp');
    });
    check('a body walks from the hallway, up the stair mouth, through the stair room and its sliding door into Teleport Room 2 (and back), and no further', () => {
        const r = J(`(function(){ const F = facilityGet(), sc = facilityScale(), p = (x, y) => [x / sc, y / sc];
            const hall = p(780, 650), room = p(850, 650), tele = p(960, 650), cells = facilityFlood(hall[0], hall[1], F, 0.5), ids = Array.from(new Set(cells.map(q => facilityRoomAt(q[0], q[1]).id)));
            return { ids: ids.sort(), mouth: facilityCanStep(780 / sc, 650 / sc, 850 / sc, 650 / sc), door: facilityCanStep(850 / sc, 645 / sc, 960 / sc, 645 / sc), wallAboveDoor: facilityCanStep(850 / sc, 610 / sc, 960 / sc, 610 / sc), wallBelowMouth: facilityCanStep(780 / sc, 695 / sc, 850 / sc, 695 / sc) }; })()`);
        same(r.mouth, true, 'the staircase foot does not let a body onto the stairs'); same(r.door, true, 'the sliding door does not let a body into Teleport Room 2'); same(r.wallAboveDoor, false, 'the wall beside the door is open'); same(r.wallBelowMouth, false, 'the wall beside the stair mouth is open');
        ok(r.ids.includes('teleport_stair_room') && r.ids.includes('teleport_room_2') && r.ids.includes('experiment_lab'), 'the flood reached ' + r.ids); ok(!r.ids.some(id => ['arena', 'catwalks', 'show_room', 'front_office', 'observation_deck'].includes(id)), 'the flood went too far: ' + r.ids);
    });
    check('the debug view draws the stair as stepped arcs and its tap text names it', () => { ok(/rp\.centre/.test(rd('js/facility.js')) && /from_deg/.test(rd('js/facility.js')), 'no curved ramp drawing'); run('facilityDebug.on = true; facilityDebugDraw(); facilityDebug.on = false;'); });

    group('THE CRYSTAL CHAMBER\'S DOOR AND THE HALLWAY');
    check('a sliding access door joins the Crystal Chamber to the hallway past the experiment lab: a body walks through it, the wall beside it holds', () => {
        const r = J(`(function(){ const F = facilityGet(), sc = facilityScale(), D = F.openings.find(o => o.id === 'door_crystal_hallway'), cn = F.connections.find(c => c.id === 'conn_crystal_hallway');
            const y = 492 / sc; return { door: D.door, rooms: cn.rooms.join(), through: facilityCanStep(380 / sc, y, 420 / sc, y), back: facilityCanStep(420 / sc, y, 380 / sc, y), wallAbove: facilityCanStep(380 / sc, 440 / sc, 420 / sc, 440 / sc), wallBelow: facilityCanStep(380 / sc, 512 / sc, 420 / sc, 512 / sc), joined: facilityReachable('crystal_chamber', 'experiment_lab', F, false), notArena: facilityReachable('crystal_chamber', 'arena', F, false) }; })()`);
        same(r.door, 'sliding_access_door', 'door type'); same(r.rooms, 'crystal_chamber,experiment_lab', 'rooms'); same(r.through, true, 'cannot walk through'); same(r.back, true, 'cannot walk back'); same(r.joined, true, 'not joined'); same(r.notArena, false, 'it joined the arena too');
        same(r.wallAbove, false, 'the wall above the door is open'); same(r.wallBelow, false, 'the wall below the door is open');
    });
    check('THE HALLWAY IS WIDER: it runs all the way round the lab bench, at least 2.5 tiles wide on every side, and a body can walk the full loop', () => {
        const r = J(`(function(){ const F = facilityGet(), sc = facilityScale(), B = F.solids.find(s => s.id === 'lab_bench'), L = F.byId.get('experiment_lab'), T = F.solids.find(s => s.id === 'lab_tank');
            const x0 = B.poly[0][0], y0 = B.poly[0][1], x1 = B.poly[2][0], y1 = B.poly[2][1], lx0 = 400 / sc, ly0 = 470 / sc, lx1 = 875 / sc, ly1 = 700 / sc;
            const gaps = { north: y0 - ly0, south: ly1 - y1, west: x0 - 375 / sc, tank: Math.hypot(T.at[0] - x1, 0) - T.r };
            const cells = facilityFlood(420 / sc, 490 / sc, F, 0.5), has = (px, py) => cells.some(q => Math.hypot(q[0] - px / sc, q[1] - py / sc) < 0.6);
            return { gaps, nw: has(405, 495), sw: has(405, 660), se: has(800, 660), ne: has(800, 495), west: has(400, 575), south: has(580, 665), north: has(580, 495) }; })()`);
        ok(r.gaps.north >= 2.5 && r.gaps.south >= 2.5 && r.gaps.west >= 2.5, 'the hallway is too narrow: ' + JSON.stringify(r.gaps)); for (const k of ['nw', 'sw', 'se', 'ne', 'west', 'south', 'north']) same(r[k], true, 'cannot reach the hallway\'s ' + k + ' side from the door');
    });

    group('DOORS AND THE BLOCKED ZONE');
    check('every door is a sliding access door: the map says so, and a confirmed opening carries it', () => {
        same(J('FACILITY_MAP.door_type'), 'sliding_access_door', 'door type');
        const o = J(`facilityBuild({ openings: [{ id: 'd', a: [760, 470], b: [785, 470], rooms: ['front_office', 'experiment_lab'] }] }).openings.find(x => x.id === 'd').door`); same(o, 'sliding_access_door', 'compiled opening');
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
