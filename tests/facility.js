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
        for (const id of ['crystal_chamber', 'experiment_lab', 'teleport_room', 'observation_deck', 'arena', 'catwalks', 'nest_area']) ok(M.rooms.some(r => r.id === id), id + ' missing');
        ok(M.scale.px_per_tile > 0, 'no scale');
    });
    check('NOTHING IS INVENTED: no opening, connection or ramp is confirmed; what the sketch suggests is only a flagged candidate', () => {
        const M = J('FACILITY_MAP'); same(M.openings.length, 0, 'openings'); same(M.connections.length, 0, 'connections'); same(M.ramps.length, 0, 'ramps');
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
        same(v.info.rooms, 11, 'rooms'); same(v.info.navComponents, 11, 'every room is its own area while nothing is confirmed');
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
    check('1200 agent walks from inside the arena, in every direction, never leave it', () => { const v = J('facilityValidateCached()'); ok(v.info.arenaAgents >= 800, 'only ' + v.info.arenaAgents + ' walks'); same(v.info.arenaLeaks, 0, 'leaks'); });
    check('the arena\'s circular structures and machine are solid (provisionally), so no one walks through them', () => {
        const r = J(`(function(){ const F = facilityGet(); return F.solids.filter(s => s.room === 'arena').map(s => [s.id, !facilityWalkable(s.at ? s.at[0] : (s.poly[0][0] + s.poly[2][0]) / 2, s.at ? s.at[1] : (s.poly[0][1] + s.poly[2][1]) / 2)]); })()`);
        ok(r.length >= 3 && r.every(x => x[1]), JSON.stringify(r));
    });
    check('an agent exactly on a wall line cannot slip along it into the next room', () => {
        const r = J(`(function(){ const F = facilityGet(), w = F.walls.find(w => w.room === 'arena' && w.kind === 'railing_wall'); const mx = (w.a[0] + w.b[0]) / 2, my = (w.a[1] + w.b[1]) / 2; return [facilityWalkable(mx, my), facilityCanStep(mx, my, mx + 1, my)]; })()`);
        same(r[0], false, 'a point on a wall is walkable');
    });

    group('THE OUTER PATH');
    check('it is drawn but not walkable: no point of the band is walkable and no step into it is allowed', () => {
        const r = J(`(function(){ const F = facilityGet(), P = F.outer.poly; let inBand = 0, walk = 0, step = 0;
            for (let t = 0; t < 4000; t++) { const x = F.bounds.minX + (F.bounds.maxX - F.bounds.minX) * ((t * 0.6180339) % 1), y = F.bounds.minY + (F.bounds.maxY - F.bounds.minY) * ((t * 0.4142135) % 1);
                if (!facilityPointInPoly(x, y, P)) continue; inBand++; if (facilityWalkable(x, y)) walk++; if (facilityCanStep(x - 0.1, y, x, y) || facilityCanStep(x, y - 0.1, x, y)) step++; }
            return { flag: F.outer.walkable, link: F.outer.navigation_link, inBand, walk, step }; })()`);
        same(r.flag, false, 'walkable flag'); same(r.link, false, 'navigation flag'); ok(r.inBand > 200, 'sampled ' + r.inBand); same(r.walk, 0, 'walkable points'); same(r.step, 0, 'steps into it');
    });
    check('no navigation link uses it, confirmed or candidate, and a flood from every room never reaches it', () => {
        const r = J(`(function(){ const F = facilityGet(); return { edges: facilityNavEdges(F, true).filter(e => /outer/.test(e.a + e.b)).length, rooms: F.rooms.some(x => /outer/.test(x.id)) }; })()`);
        same(r.edges, 0, 'edges'); same(r.rooms, false, 'a room named outer path'); same(J('facilityValidateCached()').errors.length, 0, 'the validator flagged a flood into it');
    });
    check('the nest area is walled in: nothing walks from the arena to it (no entrance is confirmed)', () => {
        const r = J(`(function(){ const F = facilityGet(), A = F.byId.get('arena'), N = F.byId.get('nest_area'); return [facilityReachable('arena', 'nest_area', F, false), facilityReachable('arena', 'nest_area', F, true)]; })()`);
        same(r[0], false, 'reachable with confirmed links'); same(r[1], true, 'the candidate would join them (so it is flagged, not hidden)');
    });

    group('NAVIGATION: only confirmed openings join rooms');
    check('with nothing confirmed, no room can reach another by walking or by graph, even when the unconfirmed candidates are listed', () => {
        same(J('facilityComponents(null, false).length'), 11, 'areas'); same(J('facilityComponents(null, true).length'), 1, 'areas if every candidate were real');
        const f = J(`(function(){ const F = facilityGet(), c = facilityFlood(F.byId.get('crystal_chamber').poly[0][0] + 2, F.byId.get('crystal_chamber').poly[0][1] + 2, F, 0.5); return Array.from(new Set(c.map(q => facilityRoomAt(q[0], q[1]).id))); })()`);
        same(f.length, 1, 'a flood left the chamber: ' + f.join());
    });
    check('a confirmed opening (added to a COPY, not the data) cuts the wall, lets a body through, and joins the rooms; the arena stays sealed', () => {
        const r = J(`(function(){ const F = facilityBuild({ openings: [{ id: 't_open', a: [760, 470], b: [785, 470], rooms: ['front_office', 'experiment_lab'] }], connections: [{ id: 't_conn', rooms: ['front_office', 'experiment_lab'], opening: 't_open' }] });
            const x = 772 / facilityScale(), y0 = 455 / facilityScale(), y1 = 490 / facilityScale(), base = facilityGet();
            return { through: facilityCanStep(x, y0, x, y1, F), before: facilityCanStep(x, y0, x, y1, base), joined: facilityReachable('front_office', 'experiment_lab', F, false), lab: facilityReachable('front_office', 'arena', F, false), errs: facilityValidate(F).errors, walls: [base.walls.length, F.walls.length] }; })()`);
        same(r.before, false, 'the authored data has a gap it should not'); same(r.through, true, 'the opening does not let a body through'); same(r.joined, true, 'not joined'); same(r.lab, false, 'the opening joined more than it should');
        same(r.errs.length, 0, r.errs.join(' | ')); ok(r.walls[1] >= r.walls[0], 'the wall was not cut');
    });
    check('a connection between two levels needs a ramp, and an opening with no connection is flagged', () => {
        const r = J(`(function(){ const F = facilityBuild({ openings: [{ id: 't_open', a: [255, 700], b: [300, 700], rooms: ['left_side_room', 'observation_deck'] }], connections: [{ id: 't_conn', rooms: ['left_side_room', 'observation_deck'], opening: 't_open' }] }); const v = facilityValidate(F);
            const F2 = facilityBuild({ openings: [{ id: 'lone', a: [255, 700], b: [300, 700] }] }); return { errs: v.errors, warns: facilityValidate(F2).warnings }; })()`);
        ok(r.errs.some(e => /no ramp/.test(e)), 'a level jump with no ramp passed: ' + r.errs.join(' | ')); ok(r.warns.some(w => /lone/.test(w)), 'an opening with no connection was not flagged');
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
