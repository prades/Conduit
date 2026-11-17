// THE ATTACK CARDS' PICTURES (docs/ATTACK-CARD-ART.md; the owner's brief, 2026-11-17). One card's art, 450 x 630 (the card's .cd-art, 225 x 315, at 2x).
// A Mage card (the elemental style): the follower's OWN 3-D model (design/evolutions/forms*.js), posed mid-cast, under a tilted perspective camera (a Dutch angle),
// its body charged with its element, its element's world far behind it (js/energygem.js, the energy cards' worlds), and its element in the very front of the card as the focus.
//   node design/cards/attack/bake_attack.js <three-dir> <sample> <out.png> [--model]
//     <three-dir>: an unpacked three@0.128.0 npm package (its package/build/three.min.js)
//     <sample>:    a key of SAMPLES below
//     --model:     the 3-D render alone on grey (to look at the pose and the camera)
// Its glows are gradients and blur: a picture baked once, not an effect drawn every frame (docs/EFFECTS.md's flat-colour rule is for those).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const THREE_DIR = process.argv[2], SAMPLE = process.argv[3], OUT = process.argv[4], MODEL_ONLY = process.argv.includes('--model');
const ROOT = path.join(__dirname, '..', '..', '..'), EVO = path.join(ROOT, 'design', 'evolutions');
const files = ['forms-core.js'].concat(fs.readdirSync(EVO).filter(f => /^forms\d+\.js$/.test(f)).sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5))));
const formsSrc = files.map(f => fs.readFileSync(path.join(EVO, f), 'utf8')).join('\n');
const worldSrc = fs.readFileSync(path.join(ROOT, 'js', 'energygem.js'), 'utf8');

// THE SAMPLES. Each is a style sample of an existing attack (no card's name, stats or effect: those are not drawn here).
const SAMPLES = {
  // THE EMBER HOOD (fire Mage, evolved form 'embercowl', design No. 938: design/evolutions/bake.js JOBS) casting HEXFIRE: its "lighting up" (the sheet's second extra block,
  // columns 24-31: its hood swells, glows hot, its diamond and gems blaze; the owner, 2026-11-12: "he lights up and then a crater erupts lava"). The pose: the block's full
  // swell (sw 1.2) with its heat held at 0.35 (at the block's full heat, 1, the hood's faces glow one flat orange and its shape is lost at a card's size).
  // The front of the card is the crater erupting under the camera (the enemy's place): a lava jet, blobs and sparks near the lens, flames at its edge.
  embercowl_hexfire: {
    form: 938, color: '#ff3300', rim: '#ff6a3a', world: 'fire', seed: 938,
    pose: { t: 0.55, act: 0, v: { sw: 1.2, ball: 0, heat: 0.35 } },
    yaw: 0.3,                   // the model turned so its open front (+z), the diamond in its hollow, faces the camera
    cam: { pos: [2.2, 0.8, 9.0], look: [-0.3, 0.72, 0], fov: 33, roll: -0.27 },   // low, looking up at it a little; roll: the Dutch angle (radians; negative tilts the horizon up to the right)
  },
};

const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
${worldSrc}
window.__card = async function (P, W, H, modelOnly) {
  ${formsSrc}
  {   // (a block of its own: the forms' code above declares names of its own, mask among them)
  const SS = 2;   // rendered at twice the size and drawn down, for clean edges
  let seed = P.seed || 1; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };   // (a fixed seed: the same picture on every bake)
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w || W; c.height = h || H; return c; };
  // ---------- THE 3-D SCENE: the follower's own model and the floor it hovers over, under a perspective camera ----------
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.setSize(W * SS, H * SS, false); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  // the forms' baker's environment (design/evolutions/bake.js: "the shop's lights", for reflections), with the lava's warm light under it
  const es = new T.Scene(); es.background = new T.Color(0x020203);
  es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  soft(14, 6, 0, -6, 3, 0x8a2a08, 0, PI / 2);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  EL = { color: P.color }; setElementColour(P.color); M.crystal.color.multiplyScalar(0.5); M.crystal.emissive.multiplyScalar(0.8);   // (as the forms' baker sets a numbered form's crystal)
  const scene = new T.Scene(); scene.environment = env;
  scene.add(new T.HemisphereLight(0x8a6a60, 0x1a0602, 0.35));
  const key = new T.DirectionalLight(0xffe6d0, 0.8); key.position.set(3, 6, 4); scene.add(key);
  const rim = new T.DirectionalLight(new T.Color(P.rim), 2.2); rim.position.set(-5, 1.6, -1); scene.add(rim);
  const back = new T.DirectionalLight(new T.Color(P.rim), 1.2); back.position.set(3, 1, -5); scene.add(back);
  const lava = new T.PointLight(0xff5a14, 12, 10, 2); lava.position.set(-2.4, 0.4, 3.2); scene.add(lava);   // the eruption in front of it, lighting it from below
  const B = FORMS2[P.form].build(); scene.add(B.g); B.g.rotation.y = P.yaw;
  // (its glow sprites are kept: the diamond's blaze is the model's own; the game's sheets leave them to the game, design/evolutions/bake.js)
  B.update(P.pose.t, P.pose.act, P.pose.v);
  // THE FLOOR: dark lava crust split by glowing cracks, far into the haze (so the tilted horizon is a real one), and the hot glow under the follower
  const ft = cv(1024, 1024), fg = ft.getContext('2d'), fe = cv(1024, 1024), fge = fe.getContext('2d');
  fg.fillStyle = '#1a0805'; fg.fillRect(0, 0, 1024, 1024); fge.fillStyle = '#000'; fge.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 400; k++) { const x = R() * 1024, y = R() * 1024, r = 10 + R() * 40; fg.fillStyle = 'rgba(' + (R() < 0.5 ? '40,16,10' : '10,4,3') + ',' + (0.3 + R() * 0.4) + ')'; fg.beginPath(); fg.arc(x, y, r, 0, 2 * PI); fg.fill(); }
  const crack = (g, pts, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
  for (let k = 0; k < 34; k++) { let x = R() * 1024, y = R() * 1024, a = R() * 2 * PI; const pts = [[x, y]]; for (let j = 0; j < 9; j++) { a += (R() - 0.5) * 1.3; x += Math.cos(a) * 34; y += Math.sin(a) * 34; pts.push([x, y]); }
    const w = 2 + R() * 5; crack(fg, pts, w + 4, '#080202'); crack(fge, pts, w + 10, 'rgba(255,60,10,0.25)'); crack(fge, pts, w, '#ff6a1a'); crack(fge, pts, w * 0.4, '#ffd27a'); }
  const tx = t => { const x = new T.CanvasTexture(t); x.encoding = T.sRGBEncoding; x.wrapS = x.wrapT = T.RepeatWrapping; x.repeat.set(6, 6); x.anisotropy = 8; return x; };
  const floor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshStandardMaterial({ map: tx(ft), emissiveMap: tx(fe), emissive: new T.Color(0xffffff), emissiveIntensity: 1.3, roughness: 0.85, metalness: 0.1 }));
  floor.rotation.x = -PI / 2; scene.add(floor);
  const pool = cv(256, 256), pg = pool.getContext('2d'); const pgr = pg.createRadialGradient(128, 128, 0, 128, 128, 128); pgr.addColorStop(0, 'rgba(255,120,40,0.9)'); pgr.addColorStop(0.4, 'rgba(255,60,10,0.4)'); pgr.addColorStop(1, 'rgba(255,40,0,0)'); pg.fillStyle = pgr; pg.fillRect(0, 0, 256, 256);
  const glowUnder = new T.Mesh(new T.PlaneGeometry(4.2, 4.2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(pool), transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
  glowUnder.rotation.x = -PI / 2; glowUnder.position.y = 0.02; scene.add(glowUnder);
  const HAZE = '#3c0b05'; scene.fog = new T.Fog(new T.Color(HAZE), 5, 26);
  const cam = new T.PerspectiveCamera(P.cam.fov, W / H, 0.05, 80);
  cam.position.set(...P.cam.pos); cam.lookAt(new T.Vector3(...P.cam.look)); cam.rotateZ(P.cam.roll); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const grab = () => { renderer.render(scene, cam); const c = cv(); const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(renderer.domElement, 0, 0, W, H); return c; };
  B.g.visible = false; const floorCv = grab();
  B.g.visible = true; floor.visible = glowUnder.visible = false; const model = grab();
  // where things land on the picture: the heart (its diamond), its foot, the horizon (eye-level points far off, projected)
  const pr = v => { const p = new T.Vector3(...v).project(cam); return [(p.x * 0.5 + 0.5) * W, (1 - (p.y * 0.5 + 0.5)) * H]; };
  const heart = pr([0, B.core, 0]), foot = pr([0, 0, 0]);
  const fw = new T.Vector3(); cam.getWorldDirection(fw); fw.y = 0; fw.normalize(); const sideV = new T.Vector3(-fw.z, 0, fw.x), cp = cam.position;
  const far = s => pr([cp.x + (fw.x + sideV.x * s) * 500, cp.y, cp.z + (fw.z + sideV.z * s) * 500]);
  const hA = far(-0.6), hB = far(0.6), slope = Math.atan2(hB[1] - hA[1], hB[0] - hA[0]);
  const hzAt = x => hA[1] + (x - hA[0]) * Math.tan(slope);   // the horizon's height at x
  const up = [Math.sin(slope), -Math.cos(slope)];   // the world's up, on the picture (square to the horizon)
  const info = { heart: heart.map(Math.round), foot: foot.map(Math.round), horizonDeg: +(slope * 180 / PI).toFixed(1), horizonMid: Math.round(hzAt(W / 2)) };
  if (modelOnly) { const c = cv(), g = c.getContext('2d'); g.fillStyle = '#5a5f68'; g.fillRect(0, 0, W, H); g.drawImage(floorCv, 0, 0); g.drawImage(model, 0, 0); return { png: c.toDataURL('image/png'), info }; }

  // ---------- THE PICTURE, back to front ----------
  const out = cv(), g = out.getContext('2d');
  const rad = (x, y, r, stops) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const blob = (G, x, y, r, stops) => { const gr = G.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); G.fillStyle = gr; G.beginPath(); G.arc(x, y, r, 0, 2 * PI); G.fill(); };
  // 1. FAR: its element's world (the fire energy card's lava cave: js/energygem.js, painted with that card's own seed), tilted with the horizon, its floor line on the horizon, softened
  const ws = cv(450, 630), wm = cv(450, 630); { let s = 7; for (const ch of 'world' + P.world) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; const RW = () => (s = (s * 16807) % 2147483647) / 2147483647;
    _EW_PAINT[P.world](ws.getContext('2d'), wm.getContext('2d'), wm.getContext('2d'), 450, 630, RW); }
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.filter = 'blur(2.5px)'; const k = 1.55; g.drawImage(ws, -225 * k, -630 * 0.74 * k, 450 * k, 630 * k); g.filter = 'none';
  g.globalAlpha = 0.6; g.drawImage(wm, -225 * k, -630 * 0.74 * k, 450 * k, 630 * k); g.restore(); g.globalAlpha = 1;
  // the haze along the horizon (the floor's fog, into the cave), and the glow of the lava beyond it
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); let lg = g.createLinearGradient(0, -160, 0, 40); lg.addColorStop(0, 'rgba(60,11,5,0)'); lg.addColorStop(0.75, 'rgba(90,20,6,0.85)'); lg.addColorStop(1, HAZE);
  g.fillStyle = lg; g.fillRect(-W, -160, 2 * W, 200); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(0, 0, W * 0.9, [[0, 'rgba(255,90,20,0.35)'], [1, 'rgba(255,60,10,0)']]); g.scale(1, 0.25); g.fillRect(-W, -W, 2 * W, 2 * W); g.restore();
  // 2. THE FLOOR (3-D), the far lava's glow along the horizon (so the tilt reads), and a heat glow round the follower
  g.drawImage(floorCv, 0, 0);
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.globalCompositeOperation = 'lighter';
  for (const [h, a] of [[34, 0.16], [12, 0.3], [3, 0.7]]) { const lb = g.createLinearGradient(0, -h, 0, h); lb.addColorStop(0, 'rgba(255,90,20,0)'); lb.addColorStop(0.5, 'rgba(255,' + (h < 5 ? 190 : 110) + ',' + (h < 5 ? 90 : 30) + ',' + a + ')'); lb.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = lb; g.fillRect(-W, -h, 2 * W, 2 * h); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(heart[0], heart[1], 230, [[0, 'rgba(255,110,30,0.55)'], [0.45, 'rgba(255,60,10,0.22)'], [1, 'rgba(255,40,0,0)']]); g.fillRect(0, 0, W, H); g.restore();
  // 3. THE FOLLOWER, CHARGED: its own silhouette glowing round it (wide and tight), flames licking up off its edges, its own render, its hollow and diamond blazing, embers rising off it
  const mask = (blur, col) => { const c = cv(), m = c.getContext('2d'); m.filter = 'blur(' + blur + 'px)'; m.drawImage(model, 0, 0); m.filter = 'none'; m.globalCompositeOperation = 'source-in'; m.fillStyle = col; m.fillRect(0, 0, W, H); return c; };
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.9; g.drawImage(mask(22, '#ff3a08'), 0, 0); g.globalAlpha = 0.8; g.drawImage(mask(7, '#ff8a2a'), 0, 0); g.restore();
  // the flames off its edges: tongues rooted on the top of its silhouette, leaning up the world's up
  const md = model.getContext('2d').getImageData(0, 0, W, H).data, A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : md[(Math.floor(y) * W + Math.floor(x)) * 4 + 3];
  const edges = []; for (let x = 2; x < W - 2; x += 3) { for (let y = 0; y < H; y++) if (A(x, y) > 128) { edges.push([x, y]); break; } }
  const tongue = (G, x, y, len, wid, ang, bend, cols, alpha) => {   // a flame: a teardrop from its root (x, y) along ang, bending at its tip
    G.save(); G.translate(x, y); G.rotate(ang); G.globalAlpha = alpha;
    const gr = G.createLinearGradient(0, 0, 0, -len); cols.forEach(([o, c]) => gr.addColorStop(o, c)); G.fillStyle = gr;
    G.beginPath(); G.moveTo(-wid, 0); G.bezierCurveTo(-wid * 1.1, -len * 0.35, bend * 0.5 - wid * 0.4, -len * 0.7, bend, -len);
    G.bezierCurveTo(bend * 0.5 + wid * 0.4, -len * 0.7, wid * 1.1, -len * 0.35, wid, 0); G.quadraticCurveTo(0, wid * 0.8, -wid, 0); G.fill(); G.restore(); };
  const FIRE = [[0, 'rgba(255,240,190,1)'], [0.25, 'rgba(255,170,50,0.95)'], [0.6, 'rgba(255,70,10,0.7)'], [1, 'rgba(200,20,0,0)']];
  const upAng = Math.atan2(up[0], -up[1]);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 70; k++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; tongue(g, e[0], e[1] + 4, 14 + R() * 30, 3 + R() * 5, upAng + (R() - 0.5) * 0.5, (R() - 0.5) * 14, FIRE, 0.35 + R() * 0.4); }
  g.restore();
  g.drawImage(model, 0, 0);
  g.save(); g.globalCompositeOperation = 'lighter'; blob(g, heart[0], heart[1], 70, [[0, 'rgba(255,230,160,0.55)'], [0.35, 'rgba(255,120,30,0.3)'], [1, 'rgba(255,60,10,0)']]); blob(g, heart[0], heart[1], 26, [[0, 'rgba(255,250,225,0.8)'], [1, 'rgba(255,200,120,0)']]);   // (the diamond blazing)

  for (let k = 0; k < 40; k++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; const d = 10 + R() * 90, x = e[0] + up[0] * d + (R() - 0.5) * 30, y = e[1] + up[1] * d + (R() - 0.5) * 10; blob(g, x, y, 1.5 + R() * 3, [[0, 'rgba(255,230,160,1)'], [0.4, 'rgba(255,120,30,0.8)'], [1, 'rgba(255,60,10,0)']]); }
  g.restore();
  // 4. NEAR: the crater erupting under the camera (HEXFIRE's crater opens where its enemy stands: here, at the lens). A fountain of lava bursts up the left, its spray arcing over
  //    toward the lens, sparks flying out of it; the crater's broken lip across the foot; flames at the very front, out of focus.
  const perp = [-up[1], up[0]];   // (across the world's up, on the picture: to the right)
  const at = (o, a, b) => [o[0] + up[0] * a + perp[0] * b, o[1] + up[1] * a + perp[1] * b];   // a point a along the world's up and b across from o
  const F0 = [W * 0.3, H * 0.84], FL = 470;   // the fountain's foot (behind the lip) and its height
  const fc = t => { const c = at(F0, FL * t, -18 * t * t + 10 * Math.sin(t * 7)); return c; };   // its middle line, leaning a little left as it rises
  const fw2 = t => 20 + 30 * t + 30 * Math.pow(t, 4);   // its half width: flaring at its top
  const lavaGrad = (G, x0, y0, x1, y1) => { const gr = G.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(150,20,0,0)'); gr.addColorStop(0.18, 'rgba(210,40,4,0.9)'); gr.addColorStop(0.38, '#ff7a14'); gr.addColorStop(0.5, '#ffe6a0'); gr.addColorStop(0.62, '#ff9a24'); gr.addColorStop(0.82, 'rgba(210,40,4,0.9)'); gr.addColorStop(1, 'rgba(150,20,0,0)'); return gr; };
  const drop = (G, x, y, ang, r, stretch) => { G.save(); G.translate(x, y); G.rotate(ang);
    const gr = G.createLinearGradient(-r * stretch, 0, r, 0); gr.addColorStop(0, 'rgba(200,30,0,0)'); gr.addColorStop(0.55, 'rgba(255,110,20,0.9)'); gr.addColorStop(0.85, '#ffd27a'); gr.addColorStop(1, '#fff4d0'); G.fillStyle = gr;
    G.beginPath(); G.moveTo(-r * stretch, 0); G.quadraticCurveTo(-r * 0.2, -r, r * 0.6, -r * 0.92); G.arc(r * 0.4, 0, r * 0.95, -PI / 2, PI / 2); G.quadraticCurveTo(-r * 0.2, r, -r * stretch, 0); G.fill();
    G.fillStyle = 'rgba(255,255,240,0.9)'; G.beginPath(); G.arc(r * 0.6, -r * 0.35, r * 0.22, 0, 2 * PI); G.fill(); G.restore(); };
  const fount = cv(), fo = fount.getContext('2d');
  // the plume: flames stacked up its middle line, rooted all the way up it and leaning with it (stacked light: white-hot where they crowd, at its heart and its foot)
  fo.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 230; k++) { const t = Math.pow(R(), 1.25) * 0.9, c = fc(t), w = fw2(t), p0 = at(c, 0, (R() - 0.5) * 1.5 * w), L = (50 + R() * 110) * (0.7 + 0.6 * t), wd = (8 + R() * 16) * (0.8 + 0.8 * t);
    tongue(fo, p0[0], p0[1], L, wd, upAng + (R() - 0.5) * 0.35, (R() - 0.5) * 30, FIRE, 0.11 + R() * 0.17); }
  fo.globalCompositeOperation = 'source-over';
  // the burst at its top and the drops flung out of it: arcs up and over, each drop stretched along its flight with a hot head and a glint
  const top = fc(0.86); const drops = [];
  for (let k = 0; k < 46; k++) { const a = Math.atan2(up[1], up[0]) + (R() - 0.35) * 2.4, sp = 40 + R() * 300, x = top[0] + Math.cos(a) * sp * (0.4 + R() * 0.6) + (R() - 0.5) * 30, y = top[1] + Math.sin(a) * sp * 0.5 + sp * sp * 0.0011 * R();
    const r = 2.5 + Math.pow(R(), 2) * 9; drops.push([x, y, a + 0.3 * R(), r, 2.5 + R() * 4]); }
  drops.forEach(d => drop(fo, ...d));
  for (let k = 0; k < 18; k++) { const a = Math.atan2(up[1], up[0]) + (R() - 0.5) * 1.2, d = R() * 50, p0 = [top[0] + Math.cos(a) * d, top[1] + Math.sin(a) * d]; blob(fo, p0[0], p0[1], 16 + R() * 22, [[0, 'rgba(255,240,190,0.95)'], [0.4, 'rgba(255,150,40,0.8)'], [1, 'rgba(220,40,4,0)']]); }   // (the burst's crown)
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(16px)'; g.drawImage(fount, 0, 0); g.filter = 'blur(5px)'; g.globalAlpha = 0.7; g.drawImage(fount, 0, 0); g.restore();   // (its heat: a wide glow and a near one)
  g.save(); g.filter = 'blur(0.6px)'; g.drawImage(fount, 0, 0); g.restore();
  // sparks: thin bright streaks thrown out of it, up and to the right, some across the follower
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let k = 0; k < 110; k++) { const t0 = 0.15 + R() * 0.75, s0 = fc(t0), a = Math.atan2(up[1], up[0]) + 0.25 + R() * 1.25, d = 20 + Math.pow(R(), 0.7) * 420, L = 6 + R() * 30;
    const x = s0[0] + Math.cos(a) * d, y = s0[1] + Math.sin(a) * d, ex = x - Math.cos(a) * L, ey = y - Math.sin(a) * L, lgS = g.createLinearGradient(x, y, ex, ey);
    lgS.addColorStop(0, 'rgba(255,248,215,1)'); lgS.addColorStop(0.3, 'rgba(255,170,50,0.85)'); lgS.addColorStop(1, 'rgba(255,60,10,0)'); g.strokeStyle = lgS; g.lineWidth = 0.8 + R() * 1.8; g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.stroke(); }
  g.restore();
  // the crater's lip: broken dark rock across the foot, tilted with the horizon, its edge glowing where the lava lights it, so the fountain bursts from behind it
  const lip = []; { let x = -20; while (x < W + 30) { const base = hzAt(x) + 170 + 26 * Math.sin(x * 0.011 + 1), y = base + (R() - 0.5) * 22 - (R() < 0.25 ? 18 * R() : 0); lip.push([x, y]); x += 8 + R() * 22; } }
  g.save(); g.beginPath(); g.moveTo(-20, H + 20); lip.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(W + 30, H + 20); g.closePath();
  const lyl = Math.min(...lip.map(q => q[1])); let lr = g.createLinearGradient(0, lyl, 0, H); lr.addColorStop(0, '#3a1208'); lr.addColorStop(0.18, '#160604'); lr.addColorStop(1, '#060202'); g.fillStyle = lr; g.fill();
  g.clip(); for (let k = 0; k < 40; k++) { const q = lip[Math.floor(R() * lip.length)], x = q[0], y = q[1] + 10 + R() * 120; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1 + R() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 60, y + 20 + R() * 50); g.stroke(); }   // (its cracks and facets)
  g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(F0[0], F0[1], 260, [[0, 'rgba(255,90,20,0.5)'], [1, 'rgba(255,60,10,0)']]); g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
  const lipPath = () => { g.beginPath(); lip.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
  g.restore();
  // its top face lit by the lava: a band under the edge, brightest near the fountain, and the edge itself catching the light there
  g.save(); g.beginPath(); g.moveTo(-20, H + 20); lip.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(W + 30, H + 20); g.closePath(); g.clip();
  for (let i = 1; i < lip.length; i++) { const [x0, y0] = lip[i - 1], [x1, y1] = lip[i], dF = Math.hypot((x0 + x1) / 2 - F0[0], (y0 + y1) / 2 - F0[1]), k = Math.max(0.12, 1 - dF / 300);
    const th = 8 + 10 * R(); g.fillStyle = 'rgba(' + Math.round(120 + 110 * k) + ',' + Math.round(30 + 40 * k) + ',8,' + (0.25 + 0.5 * k) + ')'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x1 - 2, y1 + th); g.lineTo(x0 + 2, y0 + th * (0.6 + 0.4 * R())); g.closePath(); g.fill(); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
  for (let i = 1; i < lip.length; i++) { const [x0, y0] = lip[i - 1], [x1, y1] = lip[i], dF = Math.hypot((x0 + x1) / 2 - F0[0], (y0 + y1) / 2 - F0[1]), k = Math.max(0, 1 - dF / 260);
    if (k <= 0) continue; g.strokeStyle = 'rgba(255,170,70,' + (0.7 * k) + ')'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  g.restore();
  // flames at the lens: big soft tongues rising off the lip at the front left and right, out of focus (the nearest plane)
  const near = cv(), ng = near.getContext('2d'); ng.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 34; k++) { const x = -30 + Math.pow(R(), 1.4) * W * 0.5, y = H + 10 - R() * 60; tongue(ng, x, y, 80 + R() * 190 * (1 - x / W), 12 + R() * 22, upAng + (R() - 0.5) * 0.45, (R() - 0.5) * 50, FIRE, 0.22 + R() * 0.3); }
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(2.5px)'; g.drawImage(near, 0, 0); g.filter = 'none'; g.restore();
  // drops right at the lens: big, soft, flying past the top corners
  { const lens = cv(), lg2 = lens.getContext('2d'); [[W * 0.78, H * 0.1, 0.5, 15], [W * 0.95, H * 0.24, 0.9, 11], [W * 0.06, H * 0.05, -2.2, 13], [W * 0.62, H * 0.03, 0.2, 8]].forEach(([x, y, a, r]) => drop(lg2, x, y, a, r, 5));
    g.save(); g.filter = 'blur(5px)'; g.globalCompositeOperation = 'lighter'; g.drawImage(lens, 0, 0); g.filter = 'blur(2px)'; g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.8; g.drawImage(lens, 0, 0); g.restore(); }
  // bokeh: a few soft embers right at the lens
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 8; k++) { const x = R() * W, y = R() * H * 0.55, r = 10 + R() * 24; blob(g, x, y, r, [[0, 'rgba(255,170,70,0.18)'], [0.75, 'rgba(255,110,30,0.13)'], [1, 'rgba(255,80,20,0)']]); }
  g.restore();
  // 5. THE GRADE: a vignette, darker at the foot (the name plate reads over it)
  g.save(); g.fillStyle = rad(W * 0.55, H * 0.4, H * 0.75, [[0.5, 'rgba(0,0,0,0)'], [1, 'rgba(10,2,1,0.6)']]); g.fillRect(0, 0, W, H); g.restore();
  return { png: out.toDataURL('image/png'), info };
  }
};
</script></body></html>`;

(async () => {
  const P = SAMPLES[SAMPLE] && JSON.parse(JSON.stringify(SAMPLES[SAMPLE]));
  if (P && process.env.CARD_TRY) { const o = JSON.parse(process.env.CARD_TRY); for (const k in o) P[k] = (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) ? Object.assign(P[k] || {}, o[k]) : o[k]; }   // (CARD_TRY: a JSON of settings to try in place of the sample's, for looking; never the baked card's)
  if (!THREE_DIR || !P || !OUT) { console.error('usage: node design/cards/attack/bake_attack.js <three-dir> <' + Object.keys(SAMPLES).join('|') + '> <out.png> [--model]'); process.exit(1); }
  const W = 450, H = 630;
  if (process.env.CARD_PAGE) fs.writeFileSync(process.env.CARD_PAGE, page);   // (CARD_PAGE: write the page out, to look for a slip in it)
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://card.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://card.local/');
  const res = await p.evaluate(([P, W, H, m]) => window.__card(P, W, H, m), [P, W, H, MODEL_ONLY]);
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, Buffer.from(res.png.split(',')[1], 'base64'));
  console.log('wrote ' + OUT + ' (' + W + ' x ' + H + ', ' + fs.statSync(OUT).size + ' bytes)  ' + JSON.stringify(res.info));
  await b.close();
})();
