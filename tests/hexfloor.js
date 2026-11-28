// THE HEXAGON GROUND FLOOR while it is built (docs/FACILITY.md, "The hexagon ground floor"; the owner, 2026-11-28: "Save and create"): js/hexfloormap.js is made by tools/hexfloor.js from
// design/maps/hex-ground-floor/rooms.json and is up to date; with ?hexfloor its eight rooms are in the map, valid, joined to one another and, by stairs, to the Experiment Lab and the Observation Deck;
// without it nothing of them is in the map (the game players get is as it was).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function game(search) {
    const sb = makeBrowserSandbox({}); sb.location = Object.assign({}, sb.location, { search });
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    return code => vm.runInContext(code, context);
}
const ROOMS = ['crystal_chamber', 'front_lobby', 'show_room', 'hx_stairs_up', 'lab_hallway', 'hx_observation_way', 'hx_stairs_hallway', 'lounge'];
const GONE = ['teleport_room_1', 'security_room', 'lab_passage', 'teleport_stair_room', 'teleport_room_2'];

group('the made file');
check('js/hexfloormap.js is what tools/hexfloor.js makes from rooms.json (run the tool after changing the rooms)', () => {
    const before = rd('js/hexfloormap.js'); execFileSync('node', [path.join(ROOT, 'tools/hexfloor.js')], { stdio: 'ignore' }); const after = rd('js/hexfloormap.js');
    if (before !== after) { fs.writeFileSync(path.join(ROOT, 'js/hexfloormap.js'), before); throw new Error('stale'); }
});
check('the game page loads it before the map', () => { const o = scriptOrder(); ok(o.indexOf('js/hexfloormap.js') >= 0 && o.indexOf('js/hexfloormap.js') < o.indexOf('js/facilitymap.js'), 'order'); });

group('without ?hexfloor');
const off = game('');
check('none of its rooms, doorways or stairs are in the map', () => {
    same(off('FACILITY_MAP.rooms.filter(r => r.id.slice(0, 3) === "hx_" || r.hex_floor).length'), 0, 'rooms');
    same(off('FACILITY_MAP.portals.filter(p => /hx/.test(p.id)).length + FACILITY_MAP.openings.filter(o => /hx_/.test(o.id)).length'), 0, 'ways');
});

group('with ?hexfloor');
const on = game('?hexfloor');
check('its eight rooms are in the map in place of today\'s ground floor (five under today\'s ids), on the ground floor; the rooms it has no place for are gone; the Experiment Lab is reached by its stairs alone', () => {
    same(on('JSON.stringify(FACILITY_MAP.rooms.filter(r => r.hex_floor).map(r => r.id).sort())'), JSON.stringify(ROOMS.slice().sort()), 'rooms');
    ok(on('FACILITY_MAP.rooms.filter(r => r.hex_floor).every(r => r.level === 0 && !FACILITY_MAP.interiors.some(i => i.id === r.id))'), 'level 0 and in place');
    same(on(`FACILITY_MAP.rooms.filter(r => ${JSON.stringify(GONE)}.includes(r.id)).length`), 0, 'today\'s rooms with no place');
    ok(on('FACILITY_MAP.interiors.some(i => i.id === "experiment_lab")'), 'the lab its own part of the map');
    ok(off('FACILITY_MAP.rooms.some(r => r.id === "teleport_room_1") && !FACILITY_MAP.interiors.some(i => i.id === "experiment_lab")'), 'without the switch today\'s map');
});
check('the hallway\'s door and steps down into the arena are kept, the Crystal stands in its chamber', () => {
    ok(on('FACILITY_MAP.connections.some(c => c.id === "conn_arena_hallway") && FACILITY_MAP.ramps.some(r => r.id === "r_arena_steps")'), 'the arena door and steps');
    ok(on('(() => { const r = FACILITY_MAP.rooms.find(q => q.id === "crystal_chamber"), o = r.objects.find(x => x.id === "crystal"); return !!o && facilityPointInPoly(o.at[0], o.at[1], r.polygon); })()'), 'the Crystal');
});
check('every wall runs flat, at 60°, upright or at 120° (the owner\'s rule for this floor; the lines between rooms with no wall are not walls)', () => {
    const bad = on(`JSON.stringify(FACILITY_MAP.rooms.filter(r => r.hex_floor).flatMap(r => r.polygon.map((p, i) => { const q = r.polygon[(i + 1) % r.polygon.length], a = ((Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI) % 180 + 180) % 180; return [r.id, i, a, r.edge_kinds[i]]; })).filter(e => e[3] === "wall" && ![0, 60, 90, 120, 180].some(t => Math.abs(e[2] - t) < 1)))`);
    same(bad, '[]', 'slanted edges off the four directions');
});
check('the map with it is valid (no errors)', () => {
    const e = on('JSON.stringify(facilityValidate(facilityBuild({ snap: true })).errors)'); same(e, '[]', 'errors');
});
check("every room is joined to the Main Hallway, the floor to the arena by the hallway's door as today, to the Experiment Lab and the Observation Deck by its stairs, and on to the Cold Storage", () => {
    const r = JSON.parse(on(`(() => { const F = facilityBuild({ snap: true }), nb = new Map(); for (const c of F.connections) { for (const a of c.rooms) { if (!nb.has(a)) nb.set(a, new Set()); for (const b of c.rooms) if (b !== a) nb.get(a).add(b); } }
        const seen = new Set(['lab_hallway']), q = ['lab_hallway']; while (q.length) { const a = q.shift(); for (const b of nb.get(a) || []) if (!seen.has(b)) { seen.add(b); q.push(b); } }
        return JSON.stringify({ all: ${JSON.stringify(ROOMS)}.filter(id => !seen.has(id)), lab: seen.has('experiment_lab'), deck: seen.has('observation_deck'), arena: seen.has('arena'), cold: seen.has('cold_storage') }); })()`));
    same(JSON.stringify(r.all), '[]', 'rooms not reached'); ok(r.lab, 'the Experiment Lab'); ok(r.deck, 'the Observation Deck'); ok(r.arena, 'the arena'); ok(r.cold, 'the Cold Storage');
});
check('its stairs come in pairs that lead to each other, each on floor', () => {
    const r = JSON.parse(on(`(() => { const F = facilityBuild({ snap: true }), P = F.portals.filter(p => /hx/.test(p.id)); return JSON.stringify(P.map(p => ({ id: p.id, back: (F.portals.find(q => q.id === p.to) || {}).to === p.id,
        on: facilityWalkable((p.rect[0] + p.rect[2]) / 2, (p.rect[1] + p.rect[3]) / 2, F) && facilityWalkable(p.arrive[0], p.arrive[1], F) }))); })()`));
    same(r.length, 4, 'stair ends'); for (const p of r) { ok(p.back, p.id + ' leads back'); ok(p.on, p.id + ' on floor'); }
});
check('nothing of the map is left out: the electrical domain is reached by its door by the junction', () => { same(on('JSON.stringify(FACILITY_MAP._hexCut || [])'), '[]', 'left out'); });
check('its furnishing is in (approved 2026-11-28): every piece a kind with a sheet; the junction, mech bay, charger and tuning bench back with their stations; the electrical domain\'s door by the junction, shut until it is repaired', () => {
    const r = JSON.parse(on(`(() => { const F = facilityBuild({ snap: true }), fur = HEX_FLOOR_MAP.props.map(p => p.id), S = F.solids.filter(s => fur.includes(s.id));
        return JSON.stringify({ n: fur.length, built: S.length, nosheet: S.filter(s => !PS_FAMILY[s.kind]).map(s => s.kind), st: ['st_junction', 'st_mech_bay', 'st_charger', 'st_tune_bench'].filter(id => !F.stations.some(x => x.id === id)),
            door: (F.portals.find(p => p.id === 'portal_lobby_elec') || {}).needs || null, domain: !!F.byId.get('elec_servers') && !(FACILITY_MAP._hexCut || []).length }); })()`));
    ok(r.n >= 80, 'pieces: ' + r.n); same(r.built, r.n, 'pieces in the built map'); same(r.nosheet.join(), '', 'kinds with no sheet'); same(r.st.join(), '', 'stations missing'); same(r.door, 'junction', 'the domain\'s door'); ok(r.domain, 'the domain');
});
check('the furniture walls nothing off: from the Main Hallway\'s middle a walk reaches nearly every floor tile of the floor\'s rooms (no piece seals a corner or a way)', () => {
    const r = JSON.parse(on(`(() => { const F = facilityBuild({ snap: true }), ids = ${JSON.stringify(ROOMS)}, cells = new Set(), K = (x, y) => x + ',' + y;
        for (const R of F.rooms) if (ids.includes(R.id)) { const b = R.poly.reduce((a, p) => [Math.min(a[0], p[0]), Math.min(a[1], p[1]), Math.max(a[2], p[0]), Math.max(a[3], p[1])], [1e9, 1e9, -1e9, -1e9]);
            for (let x = Math.floor(b[0]); x <= Math.ceil(b[2]); x++) for (let y = Math.floor(b[1]); y <= Math.ceil(b[3]); y++) if (facilityPointInPoly(x, y, R.poly) && facilityWalkable(x, y, F)) cells.add(K(x, y)); }
        const H = F.byId.get('lab_hallway'), c = H.poly.reduce((a, p) => [a[0] + p[0] / H.poly.length, a[1] + p[1] / H.poly.length], [0, 0]); let st = null, bd = 1e9; for (const k of cells) { const [x, y] = k.split(',').map(Number), d = Math.hypot(x - c[0], y - c[1]); if (d < bd) { bd = d; st = k; } }
        const seen = new Set([st]), q = [st]; while (q.length) { const [x, y] = q.shift().split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = K(x + dx, y + dy); if (cells.has(k) && !seen.has(k)) { seen.add(k); q.push(k); } } }
        return JSON.stringify({ all: cells.size, reached: seen.size }); })()`));
    ok(r.reached >= r.all * 0.97, 'reached ' + r.reached + ' of ' + r.all);
});
check('hexFloorStart is there', () => { ok(on('typeof hexFloorStart') === 'function', 'hexFloorStart'); });

console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
