// node tools/hexfloor.js: makes js/hexfloormap.js, THE HEXAGON GROUND FLOOR while it is built (docs/FACILITY.md, "The hexagon ground floor"), from its rooms
// (design/maps/hex-ground-floor/rooms.json, made by rooms.py from the approved draft 5, in tiles). With ?hexfloor in the address the game has this floor IN PLACE OF today's ground floor
// (js/facilitymap.js hexFloorApply): where today's is, its south wall on the arena's north side as today's hallway's, so the hallway's door and steps down into the arena and the arena's Cold
// Storage door stay where they are (the owner, 2026-11-28: "It's nothing more than what it is today ... the cold storage door is exactly where it is today almost"). Without it nothing changes.
// Stage 1: the rooms, the ways between them, the stairs down to the Experiment Lab (now reached only by them) and up to the Observation Deck. No props yet; the stairs up in area 5 lead nowhere yet.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const R = JSON.parse(fs.readFileSync(path.join(ROOT, 'design/maps/hex-ground-floor/rooms.json'), 'utf8'));
const PX = 20, BOTTOM = Math.max(...R.rooms.flatMap(r => r.polygon.map(p => p[1])));
const PLACE = [0, 760 - BOTTOM * PX];   // (sketch px: its south wall on y = 760, the arena's north side, as today's hallway's; x as drawn, so its south wall runs over the arena's door and the notch by the stairs up over the Cold Storage's)
const px = p => [Math.round((p[0] * PX + PLACE[0]) * 100) / 100, Math.round((p[1] * PX + PLACE[1]) * 100) / 100];
const rooms = R.rooms.map(r => ({ id: r.id, label: r.label, level: 0, status: 'placed', wall_material: 'solid', hex_floor: true, polygon: r.polygon.map(px), edge_kinds: r.edge_kinds }));
// the Crystal: in the middle of its chamber (provisional: where its props go is the owner's next step)
const ch = rooms.find(r => r.id === 'crystal_chamber'); { let a = 0, cx = 0, cy = 0; const P = ch.polygon; for (let i = 0; i < P.length; i++) { const p = P[i], q = P[(i + 1) % P.length], c = p[0] * q[1] - q[0] * p[1]; a += c; cx += (p[0] + q[0]) * c; cy += (p[1] + q[1]) * c; }
  ch.objects = [{ id: 'crystal', type: 'objective', at: [Math.round(cx / (3 * a)), Math.round(cy / (3 * a))], radius: 40, status: 'placed' }]; }
// the ways between rooms: where an open edge of one room runs along an open edge of another, the stretch they share is a plain gap (no door frame)
const openings = [], connections = [], seen = new Set();
const edges = r => r.polygon.map((a, i) => ({ a, b: r.polygon[(i + 1) % r.polygon.length], k: r.edge_kinds[i] })).filter(e => e.k === 'open');
for (let i = 0; i < R.rooms.length; i++) for (let j = i + 1; j < R.rooms.length; j++) for (const e of edges(R.rooms[i])) for (const f of edges(R.rooms[j])) {
  const d = [e.b[0] - e.a[0], e.b[1] - e.a[1]], L = Math.hypot(d[0], d[1]), u = [d[0] / L, d[1] / L];
  const off = p => Math.abs((p[0] - e.a[0]) * u[1] - (p[1] - e.a[1]) * u[0]), t = p => (p[0] - e.a[0]) * u[0] + (p[1] - e.a[1]) * u[1];
  if (off(f.a) > 1e-3 || off(f.b) > 1e-3) continue;   // (not on one line)
  const t0 = Math.max(0, Math.min(t(f.a), t(f.b))), t1 = Math.min(L, Math.max(t(f.a), t(f.b))); if (t1 - t0 < 1) continue;   // (less than a tile shared)
  const A = [e.a[0] + u[0] * t0, e.a[1] + u[1] * t0], B = [e.a[0] + u[0] * t1, e.a[1] + u[1] * t1], ids = [R.rooms[i].id, R.rooms[j].id];
  let id = 'open_hx_' + ids.join('__'); while (seen.has(id)) id += '_'; seen.add(id);
  openings.push({ id, a: px(A), b: px(B), rooms: ids, door: null, open: true, position_status: 'placed' });
  connections.push({ id: 'conn' + id.slice(4), rooms: ids, opening: id });
}
// the stairs: down from the stairs hallway (8) to the Experiment Lab, a stairwell in each floor; up from the far end of the way to the Observation Deck (7) to the deck (provisional spots)
const portals = [
  { id: 'portal_hx_lab', room: 'hx_stairs_hallway', rect: px([6.5, 18]).concat(px([10, 20])), arrive: px([8, 22.5]), to: 'portal_lab_hx', label: 'EXPERIMENT LAB', kind: 'stairs_down', well: true,
    note: 'The stairs down to the Experiment Lab, in the stairs hallway (area 8 of the owner\'s map).' },
  { id: 'portal_lab_hx', room: 'experiment_lab', rect: [130, 700, 170, 740], arrive: [150, 680], to: 'portal_hx_lab', label: 'GROUND FLOOR', kind: 'stairs_up', well: true,
    note: 'The stairs up to the ground floor, in the Experiment Lab\'s south-east corner (while the hexagon floor is built: ?hexfloor).' },
  { id: 'portal_hx_deck', room: 'hx_observation_way', rect: px([3.5, 31.4]).concat(px([7, 32.6])), arrive: px([5.2, 29.4]), to: 'portal_deck_hx', label: 'OBSERVATION DECK', kind: 'stairs_up', well: true,
    note: 'The way up to the Observation Deck, at the far end of area 7 of the owner\'s map.' },
  { id: 'portal_deck_hx', room: 'observation_deck', rect: [230, 790, 270, 820], arrive: [250, 845], to: 'portal_hx_deck', label: 'GROUND FLOOR', kind: 'stairs_down', well: true,
    note: 'The way back down to the ground floor, at the north of the Observation Deck (while the hexagon floor is built: ?hexfloor).' },
];
connections.push({ id: 'conn_hx_lab', rooms: ['hx_stairs_hallway', 'experiment_lab'], portal: 'portal_hx_lab' }, { id: 'conn_hx_deck', rooms: ['hx_observation_way', 'observation_deck'], portal: 'portal_hx_deck' });
// what goes: today's ground-floor rooms the floor has no place for (Teleport Room 1 and the Security Room, removed by the owner; the narrow passage; Teleport Room 2 and its stair room, replaced by
// the stairs up in area 5); and everything in today's rooms the floor takes the ids of (their props, lights, doors), but what `keep` names: the hallway's door and steps down into the arena
const removes = ['teleport_room_1', 'security_room', 'lab_passage', 'teleport_stair_room', 'teleport_room_2'];
const replaces = rooms.filter(r => r.id.slice(0, 3) !== 'hx_').map(r => r.id);
const keep = ['door_arena_hallway', 'conn_arena_hallway', 'r_arena_steps'];
// the Experiment Lab is in the floor's way (drawn where areas 7 and 8 are): it goes to a part of the map of its own, reached by its stairs (192 tiles west: nothing else is out there)
const interiors = [{ id: 'experiment_lab', under: 'hx_stairs_hallway', offset: [-3840, 0] }];
// THE FURNISHING (approved 2026-11-28; design/maps/hex-ground-floor/furnishing.py writes furnishing.json in the game's own frame): its pieces, the stations of today's pieces it brings back
// (the junction, the mech bay, the charger, the tuning bench, by today's ids), the electrical domain's door beside the junction (and with it the domain), and the Crystal on its hex
const FUR = JSON.parse(fs.readFileSync(path.join(ROOT, 'design/maps/hex-ground-floor/furnishing.json'), 'utf8'));
const props = FUR.props.map(p => { const o = Object.assign({}, p); delete o.corner; return o; }), stations = FUR.stations;
portals.push(...FUR.portals); connections.push(...FUR.connections);
if (FUR.crystal) ch.objects[0].at = FUR.crystal.map(v => Math.round(v));
const out = { place: PLACE, rooms, interiors, openings, connections, portals, props, stations, removes, replaces, keep };
const J = o => JSON.stringify(o);
const text = '// GENERATED by tools/hexfloor.js from design/maps/hex-ground-floor/rooms.json (docs/FACILITY.md, "The hexagon ground floor"). Do not edit: change the rooms and run the tool.\n' +
  'const HEX_FLOOR_MAP = {\n' + Object.keys(out).map(k => '    ' + k + ': ' + (Array.isArray(out[k]) && typeof out[k][0] === 'object' ? '[\n' + out[k].map(x => '        ' + J(x)).join(',\n') + '\n    ]' : J(out[k]))).join(',\n') + '\n};\n';
fs.writeFileSync(path.join(ROOT, 'js/hexfloormap.js'), text);
console.log('js/hexfloormap.js: ' + rooms.length + ' rooms (' + replaces.length + ' in place of today\'s), ' + openings.length + ' ways between them, ' + portals.length + ' stairs ends; placed at ' + PLACE.join(', '));
