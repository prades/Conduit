// THE FORMS' SHEETS, CROPPED (the owner, 2026-11-09: "Crop the form sheets"; the optimization audit's 4). Each form's sheet (img/evo/<id>.png, and its ground pool's, <id>_g.png) is baked as a full grid
// (design/evolutions/bake.js: 8 facings x 16 frames, or 24 with SUNDEW's CONSUME block, of 144 to 256 px cells), mostly empty: unpacked, the 21 forms' were 267 MB. This crops every cell to its picture
// (with a 2 px clear border, so a cell drawn scaled is the same at its edges) and packs the cells in rows no wider than 4096 px (SUNDEW's was 4608, over what some older iPads take in one piece).
//   node design/evolutions/crop_sheets.js            (after a bake: a full sheet is cropped; one already cropped is left as it is)
// It writes the cropped sheets over the full ones and js/evopack.js (where each cell is in its sheet, and where in its full cell it goes). Before it writes a sheet it puts every cell back together
// from the cropped one and compares it with the full one, pixel for pixel; one pixel different and it stops. js/evolution.js evoCellRect draws a cell from either kind of sheet.
const fs = require('fs'), vm = require('vm'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.join(__dirname, '..', '..');
const { scriptOrder, makeBrowserSandbox } = require(path.join(ROOT, 'tests', 'domstub.js'));
const ROWS = 8, MARGIN = 2, MAXW = 4096, ALIGN = 3;   // (ALIGN: EVO_SCALE is 96/144, 2/3: a crop's edge on a multiple of 3 px is a whole pixel on the screen)
process.on('unhandledRejection', () => {});

(async () => {
  const sb = makeBrowserSandbox({}), ctx = vm.createContext(sb);
  for (const rel of scriptOrder()) { try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); } catch (e) {} }
  for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
  // every sheet a form draws from: its body and its ground pool's, with its cell size (from the game's own table)
  const sheets = JSON.parse(vm.runInContext(`JSON.stringify((function(){ const out = {}; for (const id in EVOLUTIONS) { const d = EVOLUTIONS[id]; if (d.sheet) out[d.sheet] = { cell: d.cell, of: id }; if (d.ground) out[d.ground] = { cell: d.cell, of: id + ' (its ground)' }; if (d.storm && d.storm.sheet) out[d.storm.sheet] = { cell: d.storm.cell, of: id + ' (its storm)' }; if (d.swirl && d.swirl.sheet) out[d.swirl.sheet] = { cell: d.swirl.cell, of: id + ' (its swirl)' }; } return out; })())`, ctx));
  const old = JSON.parse(vm.runInContext('JSON.stringify(typeof EVO_PACK !== "undefined" ? EVO_PACK : {})', ctx));
  const page = `<!doctype html><html><body><script>
window.__pack = async function (src, C, M, MAXW, ROWS, A) {
  const im = new Image(); await new Promise((r, e) => { im.onload = r; im.onerror = e; im.src = src; });
  const W = im.width, H = im.height; if (H !== ROWS * C || W % C) return { W, H, full: false };
  const cols = W / C, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const px = g.getImageData(0, 0, W, H).data;
  // each cell's picture: the box of its visible pixels, grown by the clear border (inside its cell)
  const boxes = [];
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < cols; col++) { let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < C; y++) { const o = ((row * C + y) * W + col * C) * 4; for (let x = 0; x < C; x++) if (px[o + x * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    if (x1 < 0) { boxes.push([0, 0, 0, 0]); continue; }
    x0 = Math.max(0, x0 - M); y0 = Math.max(0, y0 - M); x1 = Math.min(C - 1, x1 + M); y1 = Math.min(C - 1, y1 + M);
    x0 -= x0 % A; y0 -= y0 % A; x1 = Math.min(C - 1, x1 + (A - 1 - x1 % A)); y1 = Math.min(C - 1, y1 + (A - 1 - y1 % A));   // (its edges on whole multiples of A: a form is drawn at 2/3 its size, so a cell cut there lands on whole pixels, as the full cell did, and is drawn the same to the pixel)
    boxes.push([x0, y0, x1 - x0 + 1, y1 - y0 + 1]); }
  // packed on shelves no wider than MAXW, the tallest first (so a shelf wastes little under its shorter cells), a clear pixel between cells; each cell's place kept in reading order (facing by facing, frame by frame)
  const cells = new Array(boxes.length * 6).fill(0), order = boxes.map((q, i) => i).filter(i => boxes[i][2]).sort((i, j) => boxes[j][3] - boxes[i][3] || boxes[j][2] - boxes[i][2] || i - j);
  let x = 0, y = 0, shelf = 0, w = 0;
  for (const i of order) { const [ox, oy, bw, bh] = boxes[i];
    if (x + bw > MAXW) { x = 0; y += shelf + 1; shelf = 0; }
    cells.splice(i * 6, 6, x, y, bw, bh, ox, oy); x += bw + 1; shelf = Math.max(shelf, bh); w = Math.max(w, x - 1); }
  const h = y + shelf, out = document.createElement('canvas'); out.width = Math.max(1, w); out.height = Math.max(1, h); const og = out.getContext('2d');
  for (let i = 0; i < boxes.length; i++) { const k = i * 6; if (!cells[k + 2]) continue; const col = i % cols, row = Math.floor(i / cols); og.drawImage(c, col * C + cells[k + 4], row * C + cells[k + 5], cells[k + 2], cells[k + 3], cells[k], cells[k + 1], cells[k + 2], cells[k + 3]); }
  const png = out.toDataURL('image/png');
  // put every cell back together from the cropped sheet as written, and compare it with the full one
  const back = new Image(); await new Promise(r => { back.onload = r; back.src = png; });
  const rc = document.createElement('canvas'); rc.width = W; rc.height = H; const rg = rc.getContext('2d');
  for (let i = 0; i < boxes.length; i++) { const k = i * 6; if (!cells[k + 2]) continue; const col = i % cols, row = Math.floor(i / cols); rg.drawImage(back, cells[k], cells[k + 1], cells[k + 2], cells[k + 3], col * C + cells[k + 4], row * C + cells[k + 5], cells[k + 2], cells[k + 3]); }
  const rp = rg.getImageData(0, 0, W, H).data; let diff = 0; for (let j = 0; j < rp.length; j++) if (rp[j] !== px[j]) { diff++; if (diff > 0) break; }
  return { W, H, full: true, cols, w: out.width, h: out.height, cells, png, diff };
};
</script></body></html>`;
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const p = await b.newPage();
  await p.route('http://pack.local/', r => r.fulfill({ contentType: 'text/html', body: page })); await p.goto('http://pack.local/');
  const pack = {}; let cropped = 0, kept = 0, before = 0, after = 0;
  for (const [rel, info] of Object.entries(sheets).sort()) {
    const file = path.join(ROOT, rel); if (!fs.existsSync(file)) { console.error('missing: ' + rel); process.exit(1); }
    const buf = fs.readFileSync(file), W0 = buf.readUInt32BE(16), H0 = buf.readUInt32BE(20), o = old[rel];
    if (o && o.w === W0 && o.h === H0) { pack[rel] = o; kept++; before += o.cols * info.cell * ROWS * info.cell; after += o.w * o.h; continue; }   // (cropped already: the size js/evopack.js gives it)
    const r = await p.evaluate(([src, C, M, MAXW, ROWS, A]) => window.__pack(src, C, M, MAXW, ROWS, A), ['data:image/png;base64,' + buf.toString('base64'), info.cell, MARGIN, MAXW, ROWS, ALIGN]);
    if (!r.full) { console.error(rel + ' (' + info.of + '): ' + r.W + ' x ' + r.H + ' is neither a full sheet of ' + info.cell + ' px cells nor the cropped one js/evopack.js knows'); process.exit(1); }
    if (r.diff) { console.error(rel + ': the cropped sheet does not give back the full one: stopped, nothing written for it'); process.exit(1); }
    if (r.w * r.h > 0.95 * r.W * r.H) { kept++; before += r.W * r.H; after += r.W * r.H; console.log(rel + ': ' + r.W + ' x ' + r.H + ' left whole (cropped it would be ' + Math.round(100 * r.w * r.h / (r.W * r.H)) + '%)'); continue; }   // (its pictures fill their cells: drawn from the full grid, as before)
    fs.writeFileSync(file, Buffer.from(r.png.split(',')[1], 'base64'));
    pack[rel] = { w: r.w, h: r.h, cell: info.cell, cols: r.cols, rows: ROWS, cells: r.cells };
    cropped++; before += r.W * r.H; after += r.w * r.h;
    console.log(rel + ': ' + r.W + ' x ' + r.H + ' -> ' + r.w + ' x ' + r.h + ' (' + Math.round(100 * r.w * r.h / (r.W * r.H)) + '%)');
  }
  await b.close();
  const js = '// THE FORMS\' SHEETS, CROPPED: written by design/evolutions/crop_sheets.js (do not edit by hand; run it again after a bake).\n' +
    '// A sheet\'s path -> its size as cropped (w x h), its cells (cell px, cols x rows as baked) and, for each cell in reading order (facing by facing, frame by frame), six numbers:\n' +
    '// where it is in the cropped sheet (x, y, w, h) and where its top-left goes in its full cell (ox, oy). w 0: an empty cell. js/evolution.js evoCellRect reads it.\n' +
    'const EVO_PACK = ' + JSON.stringify(pack) + ';\n';
  fs.writeFileSync(path.join(ROOT, 'js', 'evopack.js'), js);
  console.log(cropped + ' cropped, ' + kept + ' left as they were; unpacked ' + (before * 4 / 1048576).toFixed(0) + ' MB -> ' + (after * 4 / 1048576).toFixed(0) + ' MB; wrote js/evopack.js');
})().catch(e => { console.error('the crop failed: ' + (e && e.message || e)); process.exit(1); });
