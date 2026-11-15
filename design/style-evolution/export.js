// THE SCENE'S MAP, FROM THE GAME ITSELF: the Sewers around Side Quest's gate (the north bank, the river, both ledges, the west bridge, the subway passage).
// node design/style-evolution/export.js <out.json>   (the game's own map: floor tiles, walls and which side the camera sees, the river, bridges, gates, lamps, props)
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2] || path.join(__dirname, 'sewers.json');
const W = [-42, 102.5, -16, 121];   // the window, in tiles (x0, y0, x1, y1)
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1180, height: 820 } });
  const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.goto('file://' + path.resolve(__dirname, '../../game.html') + '?dev'); await p.waitForTimeout(3500);
  const data = await p.evaluate((W) => {
    facilityPlayStart();
    const F = _fp.F, inW = (x, y, m) => x >= W[0] - (m || 0) && x <= W[2] + (m || 0) && y >= W[1] - (m || 0) && y <= W[3] + (m || 0);
    const cells = []; for (let x = Math.ceil(W[0]); x <= W[2]; x++) for (let y = Math.ceil(W[1]); y <= W[3]; y++) { const r = facilityRoomAt(x, y, F); if (r && r.id === 'sewers') cells.push([x, y]); }
    const walls = F.walls.filter(w => w.room === 'sewers' && (inW(w.a[0], w.a[1], 1) || inW(w.b[0], w.b[1], 1))).map(w => ({ a: w.a, b: w.b, out: _fpWallOut(w, w.a, w.b, F), kind: w.kind }));
    const solids = F.solids.filter(s => s.room === 'sewers' && s.bb && inW((s.bb[0] + s.bb[2]) / 2, (s.bb[1] + s.bb[3]) / 2, 2)).map(s => ({ id: s.id, kind: s.kind, bb: s.bb, shape: s.shape || 'poly', at: s.at || null, r: s.r || null }));
    const decor = (F.decor || []).filter(d => d.room === 'sewers' && ((d.rect && inW((d.rect[0] + d.rect[2]) / 2, (d.rect[1] + d.rect[3]) / 2, 2)) || (d.a && inW(d.a[0], d.a[1], 1)) || (d.at && inW(d.at[0], d.at[1], 1)))).map(d => ({ id: d.id, kind: d.kind, rect: d.rect || null, a: d.a || null, b: d.b || null, at: d.at || null }));
    const lamps = (_fp.items || []).filter(i => i.fp === 'sewer' && i.what === 'lamp' && inW(i.x, i.y, 1)).map(i => [i.x, i.y]);
    const mouths = typeof _fpSewerMouths === 'function' ? _fpSewerMouths(F, 'sewers').map(m => [m.x0, m.x1, m.y, m.top]) : [];
    return { window: W, cells, walls, solids, decor, lamps, mouths, wallH: FP_WALL_H, gateH: FP_SEWER.gateH, tile: [TILE_W, TILE_H] };
  }, W);
  fs.writeFileSync(OUT, JSON.stringify(data));
  const kinds = k => [...new Set(data[k].map(o => o.kind))].join(', ');
  console.log(`cells ${data.cells.length}, walls ${data.walls.length}, solids ${data.solids.length} (${kinds('solids')}), decor ${data.decor.length} (${kinds('decor')}), lamps ${data.lamps.length}, mouths ${data.mouths.length}`);
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await b.close();
})();
