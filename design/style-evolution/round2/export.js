// ROUND 2 (design/style-evolution/round2; Proposed, drafts for the owner, nothing in the game). THE MAP, FROM THE GAME ITSELF:
// the Crystal Chamber in full (its floor, walls, doors, wall fittings, floor marks, and every prop with the model variant the game picks for it),
// and the whole facility's plan (every room's outline, level and name, every wall, door and prop's footprint) for the war table.
//   node design/style-evolution/round2/export.js <out.json>
//   node design/style-evolution/round2/export.js <out.json> --lab   and THE LAB FLOOR for the live test page (design/style-evolution/live, tools/lab3d.js --export): the eight rooms of
//                                                                   the lab's ground floor, each in full as the chamber is, and the openings between them (`lab`)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2] || path.join(__dirname, 'chamber.json');
const LAB = process.argv.includes('--lab') ? ['crystal_chamber', 'teleport_room_1', 'front_lobby', 'security_room', 'show_room', 'lab_hallway', 'lounge', 'lab_passage'] : null;
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1180, height: 820 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + path.resolve(__dirname, '../../../game.html') + '?dev'); await p.waitForTimeout(3500);
  const data = await p.evaluate(LAB => {
    facilityPlayStart();
    const F = _fp.F;
    const solid = (s, lab) => {   // a prop, with the family and the variant of its model the game draws it from (js/propsprites.js)
      const circle = s.shape === 'circle', c = circle ? [s.at[0], s.at[1]] : [(s.bb[0] + s.bb[2]) / 2, (s.bb[1] + s.bb[3]) / 2];
      const fam = PS_FAMILY[s.kind] || null, seed = _psHash(String(s.id)), dims = circle ? 'r' + Math.round(s.r * 100) : Math.round(s.bb[2] - s.bb[0]) + 'x' + Math.round(s.bb[3] - s.bb[1]);
      let variant = null;
      if (s.kind === 'plant') variant = seed % 3 === 0 ? 'd' + (seed % 2) : 'p' + (seed % 4);
      else if (s.kind === 'sentry') variant = 'a00';
      else if (fam) variant = _psResolve(fam, s.kind, dims, s.kind === 'relay' || s.kind === 'charger' ? 'on' : null, seed);
      const o = { id: s.id, kind: s.kind, room: s.room, bb: s.bb, c, fam, variant, cover: !!s.cover, low: !!s.low }; if (lab && circle) o.r = s.r; return o;   // (the lab floor's: a round prop's radius, for where one can walk)
    };
    const strip = o => JSON.parse(JSON.stringify(o, (k, v) => k === 'raw' || k === 'note' ? undefined : v));
    const record = (R, lab) => {   // a room in full
      const room = F.rooms.find(r => r.id === R);
      const cells = []; for (let x = Math.floor(room.bb[0]); x <= Math.ceil(room.bb[2]); x++) for (let y = Math.floor(room.bb[1]); y <= Math.ceil(room.bb[3]); y++) { const r = facilityRoomAt(x, y, F); if (r && r.id === R) cells.push([x, y]); }
      const walls = F.walls.filter(w => w.room === R).map(w => { const o = { a: w.a, b: w.b, kind: w.kind, out: _fpWallOut(w, w.a, w.b, F) }; if (lab && w.window) { o.window = w.window; if (w.divider) o.divider = true; } return o; });   // (out: +1 a near wall, the room behind the face the camera sees; -1 a far wall; window: glass, or with divider a thin solid wall)
      const doors = (F.openings || []).filter(o => o.rooms && o.rooms.includes(R)).map(o => ({ id: o.id, a: o.a, b: o.b, to: o.rooms.find(x => x !== R), door: o.door }));
      const obj = (room.objects || []).find(o => o.type === 'objective');
      const rec = { id: R, poly: room.poly, bb: room.bb, cells, walls, doors, crystal: obj ? obj.at : null,
        fixtures: (F.fixtures || []).filter(f => f.room === R).map(strip), decor: (F.decor || []).filter(d => d.room === R).map(strip), floor: (F.floors || []).find(f => f.room === R) || null,
        solids: F.solids.filter(s => s.room === R).map(s => solid(s, lab)), style: typeof FP_ROOM_STYLE !== 'undefined' ? FP_ROOM_STYLE[R] : null };
      if (lab) rec.label = room.label || R; return rec;
    };
    const R = 'crystal_chamber', chamber = record(R, false);
    const lab = LAB ? { rooms: LAB.map(id => record(id, true)), openings: (F.openings || []).filter(o => o.rooms && o.rooms.some(x => LAB.includes(x))).map(o => ({ id: o.id, a: o.a, b: o.b, rooms: o.rooms, door: o.door || null, open: !!o.open })) } : null;
    const facility = { rooms: F.rooms.map(r => ({ id: r.id, label: r.label || r.id, level: r.level || 0, poly: r.poly, bb: r.bb })),
      walls: F.walls.map(w => ({ a: w.a, b: w.b, kind: w.kind, room: w.room })), doors: (F.openings || []).map(o => ({ a: o.a, b: o.b, rooms: o.rooms })),
      solids: F.solids.map(s => ({ kind: s.kind, room: s.room, bb: s.bb || null, at: s.at || null, r: s.r || null })), relays: Object.values(F.relays || {}).map(r => ({ id: r.id, room: r.room })),
      conns: (F.connections || []).map(c => { const o = (F.openings || []).find(q => q.id === c.opening); return { rooms: c.rooms, at: o ? [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2] : null, ramp: !!c.ramp, portal: !!c.portal }; }) };
    const out = { chamber, facility, wallH: FP_WALL_H, wallT: typeof FP_WALL_T !== 'undefined' ? FP_WALL_T : 1, pal: typeof FP_PAL !== 'undefined' ? FP_PAL : null, tile: [TILE_W, TILE_H], antColour: SPECIES.ant.color,
      tank: typeof FP_TANK !== 'undefined' ? FP_TANK : null };
    if (lab) out.lab = lab; return out;
  }, LAB);
  fs.writeFileSync(OUT, JSON.stringify(data));
  const c = data.chamber;
  if (data.lab) console.log('lab floor: ' + data.lab.rooms.map(r => (r.label || r.id) + ' ' + r.cells.length + ' tiles, ' + r.walls.length + ' walls, ' + r.solids.length + ' props, ' + r.decor.length + ' marks').join('; ') + '; ' + data.lab.openings.length + ' openings');
  console.log(`chamber: ${c.cells.length} tiles, ${c.walls.length} walls, ${c.doors.length} doors, ${c.solids.length} props (${c.solids.map(s => s.kind + '→' + s.fam + '/' + s.variant).join(', ')}), ${c.decor.length} marks`);
  console.log(`facility: ${data.facility.rooms.length} rooms, ${data.facility.walls.length} walls, ${data.facility.solids.length} props; ant ${data.antColour}; tank ${JSON.stringify(data.tank)}`);
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await b.close();
})();
