// ROUND 2 (design/style-evolution/round2; Proposed, drafts for the owner, nothing in the game). THE MAP, FROM THE GAME ITSELF:
// the Crystal Chamber in full (its floor, walls, doors, wall fittings, floor marks, and every prop with the model variant the game picks for it),
// and the whole facility's plan (every room's outline, level and name, every wall, door and prop's footprint) for the war table.
//   node design/style-evolution/round2/export.js <out.json>
//   node design/style-evolution/round2/export.js <out.json> --lab   and THE LAB FLOOR for the live test page (design/style-evolution/live, tools/lab3d.js --export): the eight rooms of
//                                                                   the lab's ground floor, each in full as the chamber is, and the openings between them (`lab`)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2] || path.join(__dirname, 'chamber.json');
const LAB = process.argv.includes('--lab') ? ['crystal_chamber', 'teleport_room_1', 'front_lobby', 'security_room', 'show_room', 'lab_hallway', 'lounge', 'lab_passage'] : null;   // (view3d/gamemap.js VIEW3D_LAB)
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1180, height: 820 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + path.resolve(__dirname, '../../../game.html') + '?dev'); await p.waitForTimeout(3500);
  // the rooms' records are made by the game's 3D view's own code (view3d/gamemap.js), run here in the running game: the test page's snapshot and the game's view read one map
  const data = await p.evaluate(([src, LAB]) => {
    facilityPlayStart();
    (0, eval)(src);
    const F = _fp.F, out = view3dMap(F, LAB);
    out.facility = { rooms: F.rooms.map(r => ({ id: r.id, label: r.label || r.id, level: r.level || 0, poly: r.poly, bb: r.bb })),
      walls: F.walls.map(w => ({ a: w.a, b: w.b, kind: w.kind, room: w.room })), doors: (F.openings || []).map(o => ({ a: o.a, b: o.b, rooms: o.rooms })),
      solids: F.solids.map(s => ({ kind: s.kind, room: s.room, bb: s.bb || null, at: s.at || null, r: s.r || null })), relays: Object.values(F.relays || {}).map(r => ({ id: r.id, room: r.room })),
      conns: (F.connections || []).map(c => { const o = (F.openings || []).find(q => q.id === c.opening); return { rooms: c.rooms, at: o ? [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2] : null, ramp: !!c.ramp, portal: !!c.portal }; }) };
    return out;
  }, [fs.readFileSync(path.join(__dirname, '../../../view3d/gamemap.js'), 'utf8'), LAB]);
  fs.writeFileSync(OUT, JSON.stringify(data));
  const c = data.chamber;
  if (data.lab) console.log('lab floor: ' + data.lab.rooms.map(r => (r.label || r.id) + ' ' + r.cells.length + ' tiles, ' + r.walls.length + ' walls, ' + r.solids.length + ' props, ' + r.decor.length + ' marks').join('; ') + '; ' + data.lab.openings.length + ' openings');
  console.log(`chamber: ${c.cells.length} tiles, ${c.walls.length} walls, ${c.doors.length} doors, ${c.solids.length} props (${c.solids.map(s => s.kind + '→' + s.fam + '/' + s.variant).join(', ')}), ${c.decor.length} marks`);
  console.log(`facility: ${data.facility.rooms.length} rooms, ${data.facility.walls.length} walls, ${data.facility.solids.length} props; ant ${data.antColour}; tank ${JSON.stringify(data.tank)}`);
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await b.close();
})();
