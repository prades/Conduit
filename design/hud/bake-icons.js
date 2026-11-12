// THE HUD'S TWO ICONS (build 2026-11-12i; the owner, 2026-11-12: "put the settings up top next to the quest as just an icon, and make it look more like a 3D cog", "Put the map button at the top right and
// make it transparent with a map icon"; of the first, flat ones: "Those icons look awful"): a gunmetal cog with a bevelled edge and a teal-lit hub, and a folded paper map with a pin, rendered in 3-D
// (three.js, as THE CORE's cube is: design/hud/bake-core.js) at an angle, on a clear ground.
// node design/hud/bake-icons.js [--three=<three.min.js>]   writes img/hud/icon_cog.png and img/hud/icon_map.png (then tools/images.js, which the stamp runs, gives them their addresses)
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const fs = require('fs'), path = require('path');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const ROOT = path.resolve(__dirname, '../..'), THREE_JS = arg('three', '/tmp/threepkg/package/build/three.min.js'), OUT = path.resolve(arg('img', ROOT + '/img/hud'));
const SIZE = 192;   // (pixels: shown at 48 CSS pixels, twice that on an iPad's screen, so it is drawn at four times its size and scaled down)
const page = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:transparent}</style></head><body><canvas id="cv"></canvas>
<script src="/three.min.js"></script><script>
const S = ${SIZE};
function renderer(exp) { const r = new THREE.WebGLRenderer({ canvas: document.getElementById('cv'), antialias: true, alpha: true, preserveDrawingBuffer: true }); r.setPixelRatio(1); r.setSize(S, S); r.setClearColor(0x000000, 0); r.outputEncoding = THREE.sRGBEncoding; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = exp || 1; return r; }
// a room to reflect: bright above, teal and blue at the sides, dark below (metal looks like metal only with something to mirror)
function envMap(r) {
  const env = new THREE.Scene(), box = (c, x, y, z, w, h, d) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c, side: THREE.BackSide })); m.position.set(x, y, z); env.add(m); };
  box(0x0b1220, 0, 0, 0, 20, 20, 20);
  const panel = (c, x, y, z, w, h, ry, rx) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.y = ry || 0; m.rotation.x = rx || 0; env.add(m); };
  panel(0xffffff, 0, 9.5, 0, 14, 14, 0, Math.PI / 2); panel(0x9fe8ff, -9.5, 2, 0, 10, 6, Math.PI / 2); panel(0x19e6c1, 9.5, 0, -2, 8, 5, -Math.PI / 2); panel(0x6a86ff, 0, 1, -9.5, 10, 4, 0); panel(0xfff2d0, 3, 4, 9.5, 6, 4, Math.PI);
  const pm = new THREE.PMREMGenerator(r); const t = pm.fromScene(env, 0.04).texture; pm.dispose(); return t;
}
function lights(scene, rimCol, k) {
  k = k || 1; scene.add(new THREE.HemisphereLight(0xdff6ff, 0x0a0f1c, 0.4 * k));
  const key = new THREE.DirectionalLight(0xffffff, 1.6 * k); key.position.set(-3, 5, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(rimCol, 3.2); rim.position.set(5, 2, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x7fb0ff, 0.6); fill.position.set(4, -3, 5); scene.add(fill);
}
function shot(r, scene, cam) { r.render(scene, cam); return document.getElementById('cv').toDataURL('image/png'); }

// THE COG: twelve teeth, bevelled, gunmetal; a teal ring of light round its hub, the hub dark and recessed
function cog() {
  const r = renderer(1.0), scene = new THREE.Scene(), env = envMap(r); lights(scene, 0x19e6c1, 0.9);
  const teeth = 10, rOut = 1.0, rIn = 0.8, rHole = 0.36, step = Math.PI * 2 / teeth, s = new THREE.Shape();
  for (let i = 0; i < teeth; i++) {
    const a = i * step, pts = [[a - step * 0.5, rIn], [a - step * 0.24, rIn], [a - step * 0.15, rOut], [a + step * 0.15, rOut], [a + step * 0.24, rIn]];
    pts.forEach(([ang, rr], k) => { const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr; if (i === 0 && k === 0) s.moveTo(x, y); else s.lineTo(x, y); });
  }
  s.closePath(); const hole = new THREE.Path(); hole.absarc(0, 0, rHole, 0, Math.PI * 2, true); s.holes.push(hole);
  const metal = new THREE.MeshStandardMaterial({ color: 0x5d6d7c, metalness: 0.92, roughness: 0.3, envMap: env, envMapIntensity: 1.05 });   // (dark gunmetal, as THE CORE's cube)
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.06, bevelSegments: 4, curveSegments: 40 }); geo.center();
  const g = new THREE.Group(); g.add(new THREE.Mesh(geo, metal));
  // a raised ring round the hole, and the hub sunk in it with its teal light
  const ring = new THREE.Mesh(new THREE.TorusGeometry(rHole + 0.1, 0.07, 18, 64), new THREE.MeshStandardMaterial({ color: 0xc9d6e2, metalness: 1, roughness: 0.18, envMap: env, envMapIntensity: 1.6 })); ring.position.z = 0.2; g.add(ring);
  const glow = new THREE.Mesh(new THREE.TorusGeometry(rHole - 0.03, 0.055, 14, 64), new THREE.MeshStandardMaterial({ color: 0x0a2a26, emissive: 0x19e6c1, emissiveIntensity: 3.2 })); glow.position.z = 0.16; g.add(glow);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(rHole - 0.06, rHole - 0.06, 0.2, 40), new THREE.MeshStandardMaterial({ color: 0x141c26, metalness: 0.7, roughness: 0.5, envMap: env })); hub.rotation.x = Math.PI / 2; g.add(hub);
  g.rotation.set(-0.62, 0.48, 0.12); scene.add(g);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 0, 5.1); cam.lookAt(0, 0, 0);
  return shot(r, scene, cam);
}

// THE MAP: a sheet folded in four, standing a little back, a red pin in it; the paper the HUD's teal and blue
function map() {
  const r = renderer(0.92), scene = new THREE.Scene(), env = envMap(r); lights(scene, 0x9fe8ff, 0.75);
  const W = 512, H = 400, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  g.fillStyle = '#c3ddd4'; g.fillRect(0, 0, W, H);                                                   // the paper
  g.fillStyle = '#4f9fd6'; g.beginPath(); g.moveTo(0, 250); g.bezierCurveTo(120, 210, 170, 330, 300, 300); g.bezierCurveTo(400, 275, 450, 360, 512, 340); g.lineTo(512, 400); g.lineTo(0, 400); g.fill();   // water
  g.fillStyle = '#2fae8a'; g.beginPath(); g.ellipse(120, 110, 95, 62, -0.3, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(390, 150, 85, 70, 0.4, 0, Math.PI * 2); g.fill();   // land
  g.strokeStyle = 'rgba(20,50,70,0.45)'; g.lineWidth = 3; for (let x = 0; x <= W; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y <= H; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.strokeStyle = '#b81d12'; g.lineWidth = 12; g.setLineDash([20, 14]); g.lineCap = 'round'; g.beginPath(); g.moveTo(40, 330); g.bezierCurveTo(140, 250, 220, 300, 270, 200); g.bezierCurveTo(310, 130, 350, 160, 372, 150); g.stroke(); g.setLineDash([]);
  const tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding; tex.anisotropy = 4;
  const n = 4, pw = 0.62, ph = 1.6, th = 0.38, grp = new THREE.Group(); let x = 0;
  for (let i = 0; i < n; i++) {
    const geo = new THREE.PlaneGeometry(pw, ph, 1, 1), uv = geo.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setX(k, (i + uv.getX(k)) / n); uv.needsUpdate = true;
    const shade = i % 2 ? 0.62 : 1, mat = new THREE.MeshStandardMaterial({ map: tex, color: new THREE.Color(shade, shade, shade), roughness: 0.62, metalness: 0, side: THREE.DoubleSide, envMap: env, envMapIntensity: 0.4 });
    const m = new THREE.Mesh(geo, mat), a = i % 2 ? -th : th, dx = Math.cos(th) * pw;
    m.rotation.y = a; m.position.set(x + dx / 2, 0, i % 2 ? 0 : Math.sin(th) * pw / 2 * -1 + Math.sin(th) * pw / 2); x += dx; grp.add(m);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0x14303c })); edge.rotation.copy(m.rotation); edge.position.copy(m.position); grp.add(edge);
  }
  grp.children.forEach(o => { o.position.x -= x / 2; });
  // the pin: a red head on a silver needle, standing in the third panel
  const pin = new THREE.Group(), head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 32, 24), new THREE.MeshStandardMaterial({ color: 0xd8150a, roughness: 0.3, metalness: 0.05, envMap: env, envMapIntensity: 0.6, emissive: 0x2a0300 }));
  const needle = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.42, 16), new THREE.MeshStandardMaterial({ color: 0xdfe8f0, metalness: 1, roughness: 0.2, envMap: env }));
  needle.rotation.x = Math.PI; needle.position.y = -0.27; pin.add(head); pin.add(needle); pin.position.set(0.24, 0.32, 0.26); pin.rotation.z = -0.18; grp.add(pin);
  grp.rotation.set(-0.34, -0.22, 0.04); scene.add(grp);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50); cam.position.set(0, 0.05, 5.0); cam.lookAt(0, 0, 0);
  return shot(r, scene, cam);
}
window.__bake = () => ({ cog: cog(), map: map() });
</script></body></html>`;
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: SIZE + 20, height: SIZE + 20 } }), errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('http://icons.local/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(THREE_JS, 'utf8') }));
  await p.route('http://icons.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://icons.local/'); await p.waitForTimeout(200);
  const r = await p.evaluate(() => window.__bake());
  if (errs.length) throw new Error(errs.join('; '));
  fs.mkdirSync(OUT, { recursive: true });
  for (const k of ['cog', 'map']) { fs.writeFileSync(path.join(OUT, 'icon_' + k + '.png'), Buffer.from(r[k].split(',')[1], 'base64')); console.log('wrote img/hud/icon_' + k + '.png'); }
  await b.close();
})();
