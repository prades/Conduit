// REVIEW PICTURES of the sewer dungeon's draft props and key items (design/sewer-props/models.js; docs/SEWER-PROPS.md), for the owner's eye. Nothing in the game reads them.
//   node design/sewer-props/review.js <three-dir> <out-dir> [id,id,...]          one sheet a draft: <out-dir>/<id>.png
//   node design/sewer-props/review.js <three-dir> <out-dir> <id> --spin [n]      a key item's turn as n frames (36): <out-dir>/<id>_spin_00.png ... (to make a moving picture of)
//   node design/sewer-props/review.js <three-dir> <out-dir> <id,id,...> --sheet <name> [title]      several drafts on one sheet, a cell each (and one a state): <out-dir>/<name>.png
// <three-dir>: an unpacked three@0.128.0 (its package/build/three.min.js), as for design/props/bake_props.js; the game's own copy will do: mkdir -p T/package/build && cp vendor/three.min.js T/package/build/
// The models are lit and seen as the game's props are baked (design/props/bake_props.js: its lights, its 2:1 iso camera, its scale: a tile step is 60 x 30 px, a unit of height 73.5 px).
// A KEY ITEM is shown as the owner asked of key items (docs/SEWER-PROPS.md §3): floating over a pool of light, its own axis at a slant, turning about it: large, then eight steps of the turn, then at the
// game's size beside the player's cube. A PROP is shown in each of its states, large, then at the game's size and three times it, on floor tiles, beside the cube.
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'), path = require('path');
const [THREE_DIR, OUTDIR, IDS, MODE, NARG, TITLE] = process.argv.slice(2);
if (!THREE_DIR || !OUTDIR) { console.error('usage: node design/sewer-props/review.js <three-dir> <out-dir> [id,id,...] [--spin [n]]'); process.exit(1); }
const ROOT = path.join(__dirname, '..', '..'), rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PX = 60 / Math.sin(Math.PI / 4), UH = PX * Math.cos(Math.asin(0.5));
const SLANT = 0.26, FLOAT = 0.2;   // a key item's slant (radians: about 15 degrees) and how far off the floor it floats (tiles). Both the agent's, provisional (the owner: "a little bit of a slant")

const page = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__review = async function (PX, UH, SLANT, FLOAT, ids, spin, sheetName, sheetTitle) {
  ${rd('design/evolutions/forms-core.js')}
  ${rd('design/evolutions/forms2.js')}
  ${rd('design/evolutions/forms29.js')}
  const px = h => h / UH;
  ${rd('design/props/models/_style.js')}
  ${rd('design/sewer-props/models.js')}
  // one renderer, the baker's light
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.setClearColor(0x000000, 0);
  const es = new T.Scene(); es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  const elev = Math.asin(0.5), DD = 40, cam = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
  cam.position.set(DD * Math.cos(elev) * Math.SQRT1_2, DD * Math.sin(elev), DD * Math.cos(elev) * Math.SQRT1_2); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
  const radial = (stops) => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'), r = x.createRadialGradient(64, 64, 2, 64, 64, 64); stops.forEach(([o, col]) => r.addColorStop(o, col)); x.fillStyle = r; x.fillRect(0, 0, 128, 128); return new T.CanvasTexture(c); };
  const ground = (w, d, t, add) => { const m = new T.Mesh(new T.PlaneGeometry(w, d), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false, blending: add ? T.AdditiveBlending : T.NormalBlending })); m.rotation.x = -PI / 2; m.userData.noFrame = true; return m; };
  const shadowT = radial([[0, 'rgba(0,0,0,0.55)'], [1, 'rgba(0,0,0,0)']]), poolT = radial([[0, 'rgba(255,214,130,0.55)'], [0.45, 'rgba(255,190,90,0.16)'], [1, 'rgba(255,190,90,0)']]);
  // a key item as it is shown: floating, its axis at a slant (leaning across the screen), turned by a about that axis; a pool of light and a shadow under it
  const present = (model, a) => { const g = G(), fl = G(), lean = G(), turn = G(); turn.rotation.y = a; turn.add(model); lean.quaternion.setFromAxisAngle(new T.Vector3(1, 0, 1).normalize(), -SLANT); lean.add(turn); fl.position.y = FLOAT; fl.add(lean); g.add(fl);
    const p = ground(0.62, 0.62, poolT, true); p.position.y = 0.001; g.add(p); const s = ground(0.2, 0.2, shadowT); s.position.y = 0.002; g.add(s); return g; };
  const withShadow = (model, w, d) => { const g = G(); g.add(model); const s = ground(w * 1.25, d * 1.25, shadowT); s.position.y = 0.001; g.add(s); return g; };
  // one view of obj: { fit: px } frames it to fit; { k, ox, oy } draws it at k times the game's size with the world's origin at (ox, oy)
  const shoot = (obj, W, H, o) => {
    renderer.setSize(W, H, false); const scene = new T.Scene(); scene.environment = env; scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.5));
    const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key); const rim = new T.DirectionalLight(0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
    const back = new T.DirectionalLight(0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back); scene.add(obj); obj.updateMatrixWorld(true);
    if (o.fit) { let a0 = 1e9, a1 = -1e9, b0 = 1e9, b1 = -1e9; const v = new T.Vector3();
      obj.traverse(m => { if (!m.isMesh || !m.geometry || !m.geometry.attributes.position || m.userData.noFrame) return; const p = m.geometry.attributes.position;
        for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).applyMatrix4(cam.matrixWorldInverse); a0 = Math.min(a0, v.x); a1 = Math.max(a1, v.x); b0 = Math.min(b0, v.y); b1 = Math.max(b1, v.y); } });
      const k = Math.max(a1 - a0, b1 - b0) / o.fit, mx = (a0 + a1) / 2, my = (b0 + b1) / 2 - (o.down || 0) * k; cam.left = mx - W / 2 * k; cam.right = mx + W / 2 * k; cam.top = my + H / 2 * k; cam.bottom = my - H / 2 * k;
    } else { const s = PX * o.k; cam.left = -o.ox / s; cam.right = (W - o.ox) / s; cam.top = o.oy / s; cam.bottom = -(H - o.oy) / s; }
    cam.updateProjectionMatrix(); renderer.render(scene, cam);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(renderer.domElement, 0, 0); scene.remove(obj); return cv;
  };
  // the 2D parts of a sheet
  const backdrop = (g, x, y, w, h) => { const r = g.createRadialGradient(x + w / 2, y + h * 0.45, 10, x + w / 2, y + h / 2, w * 0.75); r.addColorStop(0, '#1d2a44'); r.addColorStop(1, '#070b16'); g.fillStyle = r; g.fillRect(x, y, w, h); };
  const floor = (g, ax, ay, s, n) => { for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) { const x = ax + (i - j) * 30 * s, y = ay + (i + j) * 15 * s; g.fillStyle = (i + j) % 2 ? '#1b2533' : '#202c3c'; g.beginPath(); g.moveTo(x, y - 15 * s); g.lineTo(x + 30 * s, y); g.lineTo(x, y + 15 * s); g.lineTo(x - 30 * s, y); g.closePath(); g.fill(); } };
  const cube = (g, ax, ay, s) => { const w = 17 * s, d = 8.5 * s, h = 70 * s; g.save(); g.globalAlpha = 0.5; g.fillStyle = '#5b6f8c'; g.beginPath(); g.moveTo(ax - w, ay); g.lineTo(ax, ay + d); g.lineTo(ax, ay + d - h); g.lineTo(ax - w, ay - h); g.closePath(); g.fill();
    g.fillStyle = '#3f5270'; g.beginPath(); g.moveTo(ax + w, ay); g.lineTo(ax, ay + d); g.lineTo(ax, ay + d - h); g.lineTo(ax + w, ay - h); g.closePath(); g.fill(); g.fillStyle = '#7d92b0'; g.beginPath(); g.moveTo(ax - w, ay - h); g.lineTo(ax, ay - d - h); g.lineTo(ax + w, ay - h); g.lineTo(ax, ay + d - h); g.closePath(); g.fill(); g.restore(); };
  const label = (g, t, x, y, size, col, align) => { g.fillStyle = col || '#ffffff'; g.font = (size >= 18 ? 'bold ' : '') + size + 'px DejaVu Sans, sans-serif'; g.textAlign = align || 'left'; g.textBaseline = 'alphabetic'; g.fillText(t, x, y); };
  const out = {};
  if (sheetName) {   // SEVERAL ON ONE SHEET: a cell a draft (and one a state): large, and at the game's size beside the player's cube. Key items are all at one scale, so their sizes compare
    const cells = []; for (const id of ids || Object.keys(SEWER_DRAFTS)) { const d = SEWER_DRAFTS[id]; if (!d) throw new Error('no draft called ' + id); for (const st of d.states || [null]) cells.push([d, st]); }
    const COLS = Math.min(3, cells.length), CW = 480, CH = 580, W = 60 + COLS * CW, H = 100 + Math.ceil(cells.length / COLS) * CH + 20, sheet = document.createElement('canvas'); sheet.width = W; sheet.height = H; const g = sheet.getContext('2d');
    g.fillStyle = '#0b0f16'; g.fillRect(0, 0, W, H); label(g, sheetTitle || sheetName, 30, 44, 28); label(g, 'DRAFTS, not in the game   ·   each: large, then at the game\\'s size (a tile is 60 px wide) beside the player\\'s cube', 30, 72, 16, '#8fa6bd');
    cells.forEach(([d, st], i) => { const x = 30 + (i % COLS) * CW, y = 96 + Math.floor(i / COLS) * CH, w = CW - 10;
      backdrop(g, x, y, w, 360); g.fillStyle = '#0e141e'; g.fillRect(x, y + 366, w, 200);
      if (d.keyItem) g.drawImage(shoot(present(d.build(st), 0.5), w, 360, { k: 5.2, ox: w / 2 - 20, oy: 322 }), x, y);
      else g.drawImage(shoot(withShadow(d.build(st), d.foot[0], d.foot[1]), w, 360, { fit: 286, down: -12 }), x, y);
      label(g, d.no + ' · ' + d.title + (st ? ' · ' + st.toUpperCase() : ''), x + 14, y + 28, 18, '#ffffff'); if (/APPROVED/.test(d.sub)) label(g, 'APPROVED', x + w - 14, y + 28, 15, '#43e0a8', 'right');
      g.save(); g.beginPath(); g.rect(x, y + 366, w, 200); g.clip(); const fx = x + w / 2 + 40, fy = y + 366 + 168; floor(g, fx, fy, 1, 3); cube(g, fx - 120, fy + 2, 1);
      g.drawImage(shoot(d.keyItem ? present(d.build(st), 0.5) : withShadow(d.build(st), d.foot[0], d.foot[1]), 260, 220, { k: 1, ox: 130, oy: 170 }), fx - 130, fy - 170); g.restore(); });
    out[sheetName] = sheet.toDataURL('image/png'); renderer.dispose(); return out;
  }
  for (const id of ids || Object.keys(SEWER_DRAFTS)) {
    const d = SEWER_DRAFTS[id]; if (!d) throw new Error('no draft called ' + id);
    if (spin) { out[id] = []; for (let i = 0; i < spin; i++) { const cv = document.createElement('canvas'); cv.width = cv.height = 420; const g = cv.getContext('2d'); backdrop(g, 0, 0, 420, 420); g.drawImage(shoot(present(d.build(), i * TAU / spin), 420, 420, { k: 7.4, ox: 196, oy: 352 }), 0, 0); out[id].push(cv.toDataURL('image/png')); } continue; }
    const W = 1500, H = d.keyItem ? 886 : 1090, sheet = document.createElement('canvas'); sheet.width = W; sheet.height = H; const g = sheet.getContext('2d'); g.fillStyle = '#0b0f16'; g.fillRect(0, 0, W, H);
    label(g, d.no + ' · ' + d.title, 30, 44, 28); label(g, d.sub + '   ·   DRAFT, not in the game', 30, 72, 16, '#8fa6bd');
    if (d.keyItem) {
      backdrop(g, 30, 96, 760, 760); g.drawImage(shoot(present(d.build(), 0.5), 760, 760, { fit: 450, down: 105 }), 30, 96); label(g, 'AS IT IS FOUND: floating, at a slant, turning', 46, 126, 16, '#c9d6e6');
      label(g, 'THE TURN (eight steps of it)', 820, 116, 16, '#c9d6e6');
      for (let i = 0; i < 8; i++) { const x = 820 + (i % 4) * 165, y = 128 + Math.floor(i / 4) * 200; backdrop(g, x, y, 158, 192); g.drawImage(shoot(present(d.build(), i * TAU / 8), 158, 192, { k: 2.7, ox: 79, oy: 150 }), x, y); }
      label(g, 'AT THE GAME\\'S SIZE (a tile is 60 px wide), beside the player\\'s cube', 820, 560, 16, '#c9d6e6');
      g.save(); g.beginPath(); g.rect(820, 572, 650, 284); g.clip(); g.fillStyle = '#0e141e'; g.fillRect(820, 572, 650, 284); floor(g, 980, 760, 1, 3); cube(g, 920, 752, 1); g.drawImage(shoot(present(d.build(), 0.5), 200, 200, { k: 1, ox: 100, oy: 150 }), 980 - 100 + 60, 760 - 150 + 0);
      floor(g, 1300, 770, 2, 1); g.drawImage(shoot(present(d.build(), 0.5), 300, 300, { k: 2, ox: 150, oy: 230 }), 1300 - 150, 770 - 230); g.restore(); label(g, 'game size', 1040, 846, 13, '#8fa6bd', 'center'); label(g, 'twice game size', 1300, 846, 13, '#8fa6bd', 'center');
    } else {
      const sts = d.states || [null], cw = 1440 / sts.length;
      sts.forEach((s, i) => { const x = 30 + i * cw; backdrop(g, x, 96, cw - 10, 600); g.drawImage(shoot(withShadow(d.build(s), d.foot[0], d.foot[1]), cw - 10, 600, { fit: 470, down: 10 }), x, 96); label(g, s ? s.toUpperCase() : 'AS BUILT', x + 16, 126, 18, '#c9d6e6'); });
      label(g, 'ON FLOOR TILES: three times the game\\'s size, then at the game\\'s size (a tile is 60 px wide), beside the player\\'s cube', 30, 730, 16, '#c9d6e6');
      g.save(); g.beginPath(); g.rect(30, 742, 1440, 320); g.clip(); g.fillStyle = '#0e141e'; g.fillRect(30, 742, 1440, 320);
      sts.forEach((s, i) => { const bx = 230 + i * 470; floor(g, bx, 960, 3, 1); g.drawImage(shoot(withShadow(d.build(s), d.foot[0], d.foot[1]), 460, 420, { k: 3, ox: 230, oy: 330 }), bx - 230, 960 - 330); });
      const sx = 230 + sts.length * 470 - 120; floor(g, sx + 60, 960, 1, 3); cube(g, sx - 30, 975, 1); sts.forEach((s, i) => g.drawImage(shoot(withShadow(d.build(s), d.foot[0], d.foot[1]), 200, 200, { k: 1, ox: 100, oy: 150 }), sx + 30 + i * 120 - 100, 960 - 150 + i * 0)); g.restore();
    }
    out[id] = sheet.toDataURL('image/png');
  }
  renderer.dispose(); return out;
};
</script></body></html>`;

(async () => {
  const OLD_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const b = await chromium.launch({ ...(fs.existsSync(OLD_CHROME) ? { executablePath: OLD_CHROME } : {}), args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.setDefaultTimeout(180000);
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://review.local/', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: page }));
  await p.goto('http://review.local/');
  const ids = IDS && IDS !== 'all' ? IDS.split(',') : null, spin = MODE === '--spin' ? (parseInt(NARG, 10) || 36) : 0, sheetName = MODE === '--sheet' ? (NARG || 'sheet') : null;
  let res; try { res = await p.evaluate(([a, c, s, f, i, n, sn, st]) => window.__review(a, c, s, f, i, n, sn, st), [PX, UH, SLANT, FLOAT, ids, spin, sheetName, TITLE || null]); }
  catch (e) { console.log('ERRORS', errs.slice(0, 5), e.message); await b.close(); process.exit(1); }
  fs.mkdirSync(OUTDIR, { recursive: true });
  for (const [id, r] of Object.entries(res)) {
    if (Array.isArray(r)) { r.forEach((u, i) => fs.writeFileSync(path.join(OUTDIR, id + '_spin_' + String(i).padStart(2, '0') + '.png'), Buffer.from(u.split(',')[1], 'base64'))); console.log(id, r.length, 'frames'); }
    else { const f = path.join(OUTDIR, id + '.png'); fs.writeFileSync(f, Buffer.from(r.split(',')[1], 'base64')); console.log(f); }
  }
  if (errs.length) console.log('PAGE ERRORS', errs.slice(0, 5));
  await b.close();
})();
