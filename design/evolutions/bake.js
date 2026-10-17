// Bakes evolved-follower sprite sheets from the 3D design models.
// node design/evolutions/bake.js <three-dir> img/evo
// <three-dir>: an unpacked three@0.128.0 npm package (its package/build/three.min.js).
// forms-core.js is the model code from designs.html (the design sheet).
// Each sheet: 8 rows (facings, game angle k*45°: +x, +x+y, +y, ...), 16
// columns (8 idle frames, then 8 action frames). Orthographic camera at the
// game's 2:1 iso angle; world +x (game x) projects down-right, +z (game y)
// down-left. Writes <id>.png and <id>.json (cell size and the ground anchor).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const THREE_DIR = process.argv[2], OUT = process.argv[3];
const core = fs.readFileSync(path.join(__dirname, 'forms-core.js'), 'utf8');
// forms2.js (helpers + Nos. 33-52), forms3.js (sentinels, robots, drones, Nos. 53-72) and forms4.js (ancient relics, Nos. 73-92), forms5.js (the corroded crystal, Nos. 93-103), forms6.js (the flux brawler, Nos. 104-115), forms7.js (the core mage, Nos. 116-125), forms8.js (the toxic brawler, Nos. 126-141), forms9.js (the core worker, Nos. 142-144), forms10.js (the ice maw, Nos. 145-157), forms11-13.js (the ammonite in its jar, Nos. 158-222), forms14.js (cloaks and pyramids, Nos. 223-331), forms15.js (the rock porcupine, Nos. 332-361) register FORMS2[no].
const f2src = fs.readFileSync(path.join(__dirname, 'forms2.js'), 'utf8'), f3src = fs.readFileSync(path.join(__dirname, 'forms3.js'), 'utf8'), f4src = fs.readFileSync(path.join(__dirname, 'forms4.js'), 'utf8'), f5src = fs.readFileSync(path.join(__dirname, 'forms5.js'), 'utf8'), f6src = fs.readFileSync(path.join(__dirname, 'forms6.js'), 'utf8'), f7src = fs.readFileSync(path.join(__dirname, 'forms7.js'), 'utf8'), f8src = fs.readFileSync(path.join(__dirname, 'forms8.js'), 'utf8'), f9src = fs.readFileSync(path.join(__dirname, 'forms9.js'), 'utf8'), f10src = fs.readFileSync(path.join(__dirname, 'forms10.js'), 'utf8'), f11src = fs.readFileSync(path.join(__dirname, 'forms11.js'), 'utf8'), f12src = fs.readFileSync(path.join(__dirname, 'forms12.js'), 'utf8'), f13src = fs.readFileSync(path.join(__dirname, 'forms13.js'), 'utf8'), f14src = fs.readFileSync(path.join(__dirname, 'forms14.js'), 'utf8'), f15src = fs.readFileSync(path.join(__dirname, 'forms15.js'), 'utf8'), f16src = fs.readFileSync(path.join(__dirname, 'forms16.js'), 'utf8'), f17src = fs.readFileSync(path.join(__dirname, 'forms17.js'), 'utf8'), f18src = fs.readFileSync(path.join(__dirname, 'forms18.js'), 'utf8'), f19src = fs.readFileSync(path.join(__dirname, 'forms19.js'), 'utf8'), f20src = fs.readFileSync(path.join(__dirname, 'forms20.js'), 'utf8'), f21src = fs.readFileSync(path.join(__dirname, 'forms21.js'), 'utf8'), f22src = fs.readFileSync(path.join(__dirname, 'forms22.js'), 'utf8'), f23src = fs.readFileSync(path.join(__dirname, 'forms23.js'), 'utf8'), f24src = fs.readFileSync(path.join(__dirname, 'forms24.js'), 'utf8'), f25src = fs.readFileSync(path.join(__dirname, 'forms25.js'), 'utf8'), f26src = fs.readFileSync(path.join(__dirname, 'forms26.js'), 'utf8');
const JOBS = [
  // No. 640 (the game sprite of 637), the flux ("void") mage: the dark spined starfish carrying an orb of violet fluid with a diamond in it; the diamond turns and bubbles rise. Its action frames flare the orb, up and back.
  { id: 'voidstar', form: 640, color: '#9933ff', idleAct: 0, action: [0, 1.0], pulse: true, keepSprites: true, glowNormal: true },
  // The electric and fire designs swapped. The ring drone (No. 90, the old fire mage) now stands in for the electric brawler, in electric yellow: a placeholder.
  { id: 'voltring', form: 90, color: '#ffee33', idleAct: 0.1, action: [0.6, 1.0] },
  // The hooded pyramid with the hovering gems (No. 391, the old electric brawler) is now the fire mage, in fire red.
  { id: 'embercowl', form: 391, color: '#ff3300', idleAct: 0, action: [0, 1.0], pulse: true, rim: '#ff6a3a' },   // (warm rim light: the hood reads as ember-black, not navy)
  // No. 579 (the game sprite of 578), the toxic brawler: a black faceted shell with a cone on its back on four splayed pins, one oozing eye, small leaks high on its flanks; the puddle it walks through is its ground sheet. Its action frames burst goo from the crater, up and back.
  { id: 'seeper', form: 579, color: '#33dd55', idleAct: 0, action: [0, 1.0], pulse: true },
  // No. 543 (the game sprite of 541), the electric mage: a smooth cloud of dark gas over a flickering glow, a crown of black spikes, four glowing spikes circling its base, gas fins that ripple.
  // One turn of the beat: the cloud swings rather than turns, and the four identical glowing spikes advance a quarter-turn a loop, so it closes; its action frames spark arcs between the crown spikes.
  { id: 'thunderhead', form: 543, color: '#ffee33', idleAct: 0, action: [0, 1.0], pulse: true, keepSprites: true, glowNormal: true },
  { id: 'reaver', form: 'reaver', color: '#ffee33', idleAct: 0.3, action: [0.8, 1.0] },
  { id: 'bloom',  form: 'bunker', color: '#ff3300', idleAct: 0.2, action: [0.5, 1.0] },
  // The serpent's loop is one beat of 2.2 rad/s (period 2*PI/2.2); its action rears the head.
  { id: 'serpent', form: 's15', color: '#9933ff', idleAct: 0, action: [0.6, 1.0], period: 2 * Math.PI / 2.2 },
  // Design Nos. 57, 58, 68, 71 and 90 (numeric form = FORMS2[no]).
  { id: 'warden', form: 57, color: '#00ccaa', idleAct: 0.2, action: [0.62, 1.0] },
  // No. 701 (the game sprite of 689), the flux ("void") worker: a tall black saucer on jagged-forearm bug legs, violet rim lights chasing round it; its action frames (hauling) speed the lights and crouch it, up and back.
  { id: 'hauler', form: 701, color: '#9933ff', idleAct: 0, action: [0, 1.0], pulse: true },
  { id: 'manta',  form: 68, color: '#ffee33', idleAct: 0.2, action: [0.55, 1.0] },
  { id: 'pod',    form: 71, color: '#ffee33', idleAct: 0.2, action: [0.55, 1.0] },
  { id: 'halo',   form: 90, color: '#ff3300', idleAct: 0.1, action: [0.6, 1.0] },
  // No. 101, the toxic sniper: the pool's shift loops over the idle period; its action is the recoil of a shot.
  // No. 469 (the game sprite of 467), the core brawler: a hammerheaded slug with a uniform hexagon tile cover either side of a spiked spine; its action frames lunge and flare the tiles, up and back.
  { id: 'hammerslug', form: 469, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true },
  // No. 391 (the game sprite of 388), the electric brawler: the hood with black hex crystals that breathe, three hovering gems in a triangle before the diamond; it bounces.
  // No. 361, the fire brawler: a pitch-black cut gem with red shards, the two front spikes black; its action frames hunch it and bristle the quills, up and back.
  { id: 'quillstone', form: 361, color: '#ff3300', idleAct: 0, action: [0, 1.0], pulse: true },
  // No. 314 (a game-ready No. 312), the electric brawler: a black hollow pyramid hood drooping over the top half of an octahedron diamond; its action frames bow the hood and flare the diamond.
  { id: 'prism', form: 391, color: '#ffe033', idleAct: 0, action: [0, 1.0], pulse: true },
  // No. 220, the core mage: a black shell-jar dragged on its side by fat irregular tentacles, a shard horn at its mouth; the horn drops to aim in its action frames.
  { id: 'hornshell', form: 220, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true },
  // No. 156, the ice brawler: a dome with a cave mouth; the rubble is its ground layer; its action frames are the bite (the fangs swing down), up and back.
  { id: 'maw', form: 156, color: '#7fd6ff', idleAct: 0, action: [0, 1.0], pulse: true },
  // No. 144, the core worker: a black jar with a thick glowing worm; its action frames push the worm out further (held while it works).
  { id: 'vessel', form: 144, color: '#00ccaa', idleAct: 0, action: [0.7, 1.0] },
  // No. 140, the toxic brawler: a matte black turtle-volcano; its action frames are the eruption (it hunkers, the goo bursts up), up and back down.
  { id: 'caldera', form: 140, color: '#33dd55', idleAct: 0, action: [0, 1.0], pulse: true },
  // No. 120, the core mage (the role id is 'sniper'): its action frames are a pulse: the flower tilts forward and the petals fan open towards what it faces, then it settles.
  { id: 'petal', form: 120, color: '#00ccaa', idleAct: 0, action: [0, 1.0], pulse: true },
  // No. 114, the flux brawler: a Ditto-style blob with big black shards; its action frames are the slam (it flattens and spreads).
  { id: 'mimic', form: 114, color: '#9933ff', idleAct: 0, action: [0.55, 1.0] },
  { id: 'rotshard', form: 101, color: '#14c040', idleAct: 0, action: [0.5, 1.0] },
].filter(j => !process.argv[4] || process.argv[4].split(',').includes(j.id));
const CELL = 144, HALF = 1.7, LOOK_Y = 1.15;

const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__bake = async function (jobs, CELL, HALF, LOOK_Y) {
  ${core}
  ${f2src}
  ${f3src}
  ${f4src}
  ${f5src}
  ${f6src}
  ${f7src}
  ${f8src}
  ${f9src}
  ${f10src}
  ${f11src}
  ${f12src}
  ${f13src}
  ${f14src}
  ${f15src}
  ${f16src}
  ${f17src}
  ${f18src}
  ${f19src}
  ${f20src}
  ${f21src}
  ${f22src}
  ${f23src}
  ${f24src}
  ${f25src}
  ${f26src}
  const out = {};
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.setSize(CELL * 2, CELL * 2, false);
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  // The shop's lights, for reflections.
  const es = new T.Scene(); es.background = new T.Color(0x020203);
  es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); };
  // No overhead light: seen from above at 30 degrees, every top face would mirror it white.
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  const sheetCv = document.createElement('canvas'); sheetCv.width = CELL * 16; sheetCv.height = CELL * 8; const sg = sheetCv.getContext('2d');
  // A form's pools of material are tagged userData.ground. They are baked to a sheet of their own (<id>_g.png), which the
  // game paints onto the floor tile by tile, under every unit; the other sheet has the body only.
  const sheetG = document.createElement('canvas'); sheetG.width = CELL * 16; sheetG.height = CELL * 8; const sgG = sheetG.getContext('2d');
  const isGround = o => { for (let q = o; q; q = q.parent) if (q.userData && q.userData.ground) return true; return false; };
  for (const job of jobs) {
    sg.clearRect(0, 0, sheetCv.width, sheetCv.height); sgG.clearRect(0, 0, sheetG.width, sheetG.height);
    EL = { color: job.color }; setElementColour(job.color); if (typeof job.form === 'number') { M.crystal.color.multiplyScalar(0.5); M.crystal.emissive.multiplyScalar(0.8); }
    const scene = new T.Scene(); scene.environment = env;
    scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.45));
    const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
    // Rim light from the side and low: from behind-above it sits exactly where an upward face mirrors
    // this fixed camera, and every top face blows out white.
    const rim = new T.DirectionalLight(job.rim ? new T.Color(job.rim) : 0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
    const back = new T.DirectionalLight(job.rim ? new T.Color(job.rim) : 0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back);
    const B = (typeof job.form === 'number' ? FORMS2 : FORMS)[job.form].build(); scene.add(B.g);
    // Glow sprites on a transparent sheet are left to the game (it draws its own glow at the reactor).
    B.g.traverse(o => { if ((o.isSprite && !job.keepSprites) || o.material === M.rotWash) o.visible = false; });
    // A form made of gas and light (job.glowNormal): the sheet is transparent, where additive light would vanish, so its glows are painted with ordinary blending.
    if (job.glowNormal) B.g.traverse(o => { const ms = o.material ? [].concat(o.material) : []; ms.forEach(m => { if (m.blending === T.AdditiveBlending) { m.blending = T.NormalBlending; if (!m.map && o.isMesh) m.map = glowTex; m.needsUpdate = true; } }); });   // (the pool's wide glow is for the mock sheets)
    const gMeshes = [], bMeshes = []; B.g.traverse(o => { if (o.isMesh && o.visible) (isGround(o) ? gMeshes : bMeshes).push(o); });
    const cam = new T.OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, 100);
    // 2:1 iso: on the (1, h, 1) diagonal, a ground step along x or z projects as (±1, 0.5) when sin(elevation) = 0.5.
    const D = 10;
    const elev = Math.asin(0.5);
    cam.position.set(D * Math.cos(elev) * Math.SQRT1_2, LOOK_Y + D * Math.sin(elev), D * Math.cos(elev) * Math.SQRT1_2);
    cam.lookAt(0, LOOK_Y, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    const g0 = new T.Vector3(0, 0, 0).project(cam);
    const anchor = { x: (g0.x * 0.5 + 0.5) * CELL, y: (1 - (g0.y * 0.5 + 0.5)) * CELL };
    const cp = new T.Vector3(0, B.core, 0).project(cam);
    const coreAt = { x: (cp.x * 0.5 + 0.5) * CELL, y: (1 - (cp.y * 0.5 + 0.5)) * CELL };
    const P = job.period || 2 * PI / 1.6;
    for (let k = 0; k < 8; k++) {
      const th = k * PI / 4, fx = Math.cos(th), fz = Math.sin(th);
      B.g.rotation.y = Math.atan2(fx, fz);
      for (let f = 0; f < 16; f++) {
        const idle = f < 8, i = f % 8;
        const t = idle ? i * P / 8 : 1.0 + i * 0.06;
        const act = idle ? job.idleAct : job.pulse ? Math.sin(PI * (i + 0.5) / 8) : job.action[0] + (job.action[1] - job.action[0]) * (i + 0.5) / 8;   // pulse: up and back down, so the move ends where it began
        B.update(t, act);
        if (!gMeshes.length) { renderer.render(scene, cam); sg.drawImage(renderer.domElement, f * CELL, k * CELL, CELL, CELL); }
        else {
          gMeshes.forEach(m => m.visible = false); renderer.render(scene, cam); sg.drawImage(renderer.domElement, f * CELL, k * CELL, CELL, CELL);   // the body
          bMeshes.forEach(m => m.visible = false); gMeshes.forEach(m => m.visible = true); renderer.render(scene, cam); sgG.drawImage(renderer.domElement, f * CELL, k * CELL, CELL, CELL);   // the ground
          bMeshes.forEach(m => m.visible = true);
        }
      }
    }
    out[job.id] = { png: sheetCv.toDataURL('image/png'), ground: gMeshes.length ? sheetG.toDataURL('image/png') : null, meta: { cell: CELL, rows: 8, cols: 16, idle: 8, action: 8, anchor, core: coreAt, unitsPerCell: HALF * 2 } };
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  }
  return out;
};
</script></body></html>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://bake.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://bake.local/');
  const res = await p.evaluate(([jobs, C, H, L]) => window.__bake(jobs, C, H, L), [JOBS, CELL, HALF, LOOK_Y]);
  fs.mkdirSync(OUT, { recursive: true });
  for (const [id, r] of Object.entries(res)) {
    fs.writeFileSync(path.join(OUT, id + '.png'), Buffer.from(r.png.split(',')[1], 'base64'));
    if (r.ground) fs.writeFileSync(path.join(OUT, id + '_g.png'), Buffer.from(r.ground.split(',')[1], 'base64'));
    fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify(r.meta));
    console.log(id, JSON.stringify(r.meta), fs.statSync(path.join(OUT, id + '.png')).size, 'bytes');
  }
  if (errs.length) console.log('ERRORS', errs.slice(0, 5));
  await b.close();
})();
