// THE FORMS' EFFECT PIECES, modelled in 3D and baked like the forms (docs/EFFECTS.md: the owner chose "Modelled 3D pieces", 2026-11-09).
// The models reuse the forms' own model code (design/evolutions/forms*.js) so a piece is made of what its form is made of: the Quillstone's quill
// is one of the red shards on its back (forms15.js _quillShard, _redShardMat). The lights, the environment and the camera are the forms' baker's
// (design/evolutions/bake.js): the game's 2:1 iso camera, a warm key light from above right, a blue rim light.
//   node design/effects/bake_fx.js <three-dir> preview quill <out.png>   one piece, large, with its form beside it for scale (for the owner's yes: docs/ART-PROCESS.md)
//   node design/effects/bake_fx.js <three-dir> sheet quill img/fx          the game's sheet: one column per direction it flies (yaws, round the floor, the first along the game's +x),
//                                                                          one row per tilt (pitches, nose down to nose up); writes <piece>.png there and design/effects/out/<piece>.json
// The sheet is at the forms' own pixels a unit (144 px over 3.4 units, design/evolutions/bake.js), so the game draws it at their scale (EVO_SCALE).
// <three-dir>: an unpacked three@0.128.0 npm package (its package/build/three.min.js).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const THREE_DIR = process.argv[2], MODE = process.argv[3], PIECE = process.argv[4], OUT = process.argv[5];
const EVO = path.join(__dirname, '..', 'evolutions');
const files = ['forms-core.js'].concat(fs.readdirSync(EVO).filter(f => /^forms\d+\.js$/.test(f)).sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5))));
const src = files.map(f => fs.readFileSync(path.join(EVO, f), 'utf8')).join('\n');

// THE PIECES. Each builds a T.Group at the origin, pointing along +x (the way it flies), and says which form it belongs to (for the lights' colour, and the preview).
const PIECES = {
  // QUILL BURST and QUILLSTORM (the QUILLSTONE): one of the big red shards on its back, five-sided and faceted, glowing from within (the same material, glow 0.5),
  // as long as the biggest of them in the game sprite (0.65 x its scale 1.5, about 25 px on screen).
  quill: { form: 361, color: '#ff3300', len: 0.95, fat: 0.2, sides: 5, seed: 5, roll: 0.75, cell: 56, yaws: 32, pitches: [-0.3, 0, 0.3] },   // (approved as a model 2026-11-09: "Yes, build it")
  // ICICLE VOLLEY (the RIMESTAR): one of the frost shards its cast throws (forms32.js: an eight-faced crystal drawn out long), made big: a slender six-sided spike of pale blue ice,
  // long-pointed in front and a short faceted point behind, a little uneven, as long as the quill
  icicle: { form: 861, color: '#7fd6ff', len: 0.95, r: 0.085, sides: 6, back: 0.15, seed: 3, roll: 0.5, cell: 56, yaws: 32, pitches: [-0.3, 0, 0.3] },   // (a draft, for the owner's yes)
  // ROTTEN DECOY and TOXIC PUDDLE (the ROTSHARD; the owner's pick, 2026-11-09: "Rotshard's black spike"): a spike of its old black shell (forms5.js shellShard: "a broken piece of the old black
  // shell: jagged, glassy-black", the shell's black, M.black), standing in the floor: five-sided, each ring pulled in and out so its edges are broken, a little lean, a chip broken off at its foot.
  // UPRIGHT: it stands on the floor (its foot at the origin, pointing up +y); the game turns it (yaws) and lets it rise out of the floor. The green haze stays drawn in code.
  // PINK THICKET's big seed (the THORNWHIP, No. 921; the owner's pick of three drafts, 2026-11-09: a bud of its leaves, a burr of its black thorns, or its pink crystal as a seed: this one, circled):
  // its pink crystal (the Rotshard's eaten crystal, as on the Thornwhip's back: forms39.js; forms5.js corroded), uneaten, cut as a seed: six-sided, pointed at both ends, coloured facet by facet as its own
  // (forms32.js _gemCol32). Just the crystal (the owner, 2026-11-09: "Just a crystal": the short stalk of its black vine it had at its back is gone). No glow. About 20 px long in the game; it flies as the quill does, point first.
  bigseed: { form: 921, color: '#ff7ab8', len: 0.72, r: 0.17, roll: 0.35, cell: 56, yaws: 32, pitches: [-0.3, 0, 0.3] },   // (approved in the game 2026-11-09: "Approve it for everyone"; then "Just a crystal")
  // ROTTEN DECOY (the ROTSHARD; the owner, 2026-11-09: "Make the decoy a black Rotshard"): its design's "black crystal copy", the Rotshard's own model (No. 101: the eaten crystal leaning in its pool,
  // the old shell shard) in its old shell's glassy black, its pool tar-black, no light of its own and no glow (the owner: "I don't like the green aura"); the shell shard's hairline crack keeps its green.
  // A COPY: its columns are frames of its idle loop (the Rotshard's own, 2 pi / 1.6 s), facing the camera; drawn at the forms' scale.
  rotdecoy: { form: 101, color: '#14c040', copy: true, upright: true, h: 2.0, cell: 144, yaws: 12, pitches: [0], loop: 2 * Math.PI / 1.6,
    cap: ['ROTTEN DECOY (right) beside the Rotshard (left), at one scale', '(the Rotshard\'s own model, all black; no glow)'] },   // (approved in the game 2026-11-09: "Approve the black decoy")
  // PROXY SWARM (the GOO PROXY, No. 853, the frog; the owner's pick for the next piece, 2026-11-09: "Goo Proxy's goo copies"): its three copies as the Goo Proxy's own model made of goo: all of it
  // in the violet goo of its head, the ring and its spikes too, its diamond eyes kept (the owner's pick of three looks, 2026-11-09: "A · all its violet goo"; black goo and melting into a puddle were
  // the others). No glow under it and no light of its own (the owner, of the Rotshard's spike: "I don't like the green aura"). A COPY, as ROTTEN DECOY's: its columns are frames of its idle loop
  // (the frog's own, 2 pi / 1.6 s), drawn at the forms' scale. pv: the preview's views (the copy alone; beside the Goo Proxy): its spikes reach far.
  goocopy: { form: 853, color: '#9933ff', copy: true, skin: 'goo', upright: true, h: 1.2, cell: 144, yaws: 12, pitches: [0], loop: 2 * Math.PI / 1.6,
    pv: { big: [4.4, 1.936, 0.2], gap: 1.35, side: [5.4, 2.7, 0.55] }, cap: ['PROXY SWARM\'s copy (right) beside the Goo Proxy (left), at one scale', '(all of it in its violet goo, its diamond eyes kept; no glow)'] },   // (the owner's pick of three looks; approved in the game 2026-11-09: "Approve it for everyone")
  // SHARD VORTEX (the RIFT MIMIC, No. 114; the agent's pick for the next piece, the owner having said "You pick", 2026-11-09): "its four shards spin out into a swirl": its own shard, one of the solid
  // black triangular blades standing round its blob (forms6.js blade, _bladeMat: black, catching the light along its edges), as big as the biggest of them (0.8 tall, x its scale 1.3); the model approved
  // ("Yes, build it"). TUMBLING (the owner, 2026-11-09, after an approval given by accident: "the shards are supposed to go sideways and sort of whirl about ... all in different orientations, but they're
  // spinning around like a hurricane"): its middle at the origin, it tumbles end over end: its rows are the axes it tumbles about (three, so the four are never alike), its columns the steps of a turn.
  vortexshard: { form: 114, color: '#9933ff', bw: 0.336, bh: 0.8, bd: 0.1, S: 1.3, cell: 72, yaws: 16, pitches: [0, 1, 2], tumble: { axes: [[0.35, 1, 0.4], [1, 0.25, -0.5], [-0.45, 0.55, 1]] },
    cap: ['SHARD VORTEX\'s shards tumbling (top), and four whirling beside the Rift Mimic (bottom), at one scale', '(its own black blades, each about its own axis; the swirl stays drawn in code)'] },
  // THE VOIDSTAR's SLAP (its everyday shot; the owner, 2026-11-12: "the void star slaps the enemy with telepathic tentacles", "short, stubby tentacles that are detached from the follower, and they appear on the targeted creature",
  // "Ghostly violet energy", "Two alternate", then "Make it look 3d rendered"): ONE short, stubby tentacle of ghostly violet gel, thick to a blunt round tip, a brighter core inside it and a few small suckers on its underside, swinging
  // from overhead across (clockwise) and slapping down. ANIMATED: its columns are the frames of the swing (yaws = the frames), one row; its root is the origin, at the middle of its cell. The game draws it mirrored for the second slap.
  slap: { form: 861, color: '#9933ff', anim: true, cell: 96, yaws: 12, pitches: [0], h: 0.8 },
  // BLADE ROLL's BALL (the Hammer Slug's extra attack; the owner, 2026-11-13: "he rolls up into a ball and rolls through at like a slower pace"; its first look, a flat teal disc, "need[s] better designs"):
  // the Hammer Slug ROLLED UP: a ball of its own blue-to-teal scales with the dark spikes of its back standing out all round its rim, a pale cutting edge between them, rolling to the screen's right.
  // ANIMATED: its 12 columns are one spike's worth of its turn (40 degrees: nine spikes), so the game loops them as it rolls; its foot is the origin, at the middle of its cell. Drawn mirrored to roll left.
  slugball: { form: 469, color: '#00ccaa', anim: true, cell: 128, yaws: 12, pitches: [0], h: 1.1 },
  // TOXIC STOMP's SPLASH (the Seeper's extra attack; the owner: "a stomp ... make sure he splashes some of this Caldera"; its first look, flat green blobs, "need[s] better designs"): goo thrown up out of the
  // Seeper's caldera as its foot comes down: a fat gout straight up and fourteen glossy blobs arcing out all round, landing 0.8 to 1.5 tiles off and spreading into splats that sink away. ANIMATED: 12
  // columns, the throw to the last of the splats; the Seeper's foot (the floor under its middle) is the origin, at the middle of its cell.
  goosplash: { form: 936, color: '#33dd55', anim: true, cell: 256, yaws: 12, pitches: [0], h: 1.2 },
  rotspike: { form: 101, color: '#14c040', h: 1.15, r: 0.17, sides: 5, seed: 4, lean: 0.09, upright: true, cell: 72, yaws: 8, pitches: [0] },   // (the model approved 2026-11-09: "Yes, build it"; its green underlight taken out at the owner's word, "I don't like the green aura")
};

const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__fx = async function (mode, piece, P) {
  ${src}
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.setClearColor(0x000000, 0);
  // the forms' baker's environment ("the shop's lights", for reflections)
  const es = new T.Scene(); es.background = new T.Color(0x020203);
  es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  EL = { color: P.color }; setElementColour(P.color);
  const lit = scene => { scene.environment = env; scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.45));
    const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
    const rim = new T.DirectionalLight(0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
    const back = new T.DirectionalLight(0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back);
    if (P.mist) { const m = new T.DirectionalLight(new T.Color(P.mist).convertSRGBToLinear(), P.mistI || 1.2); m.position.set(1.5, -0.35, 2.2); scene.add(m);   // (the glowing mist it stands in, lighting it from low in front: a standing piece's own, drawn in code round it in the game)
      const m2 = new T.DirectionalLight(new T.Color(P.mist).convertSRGBToLinear(), (P.mistI || 1.2) * 0.6); m2.position.set(-2.2, -0.2, 1.4); scene.add(m2); } };
  // the game's 2:1 iso camera (as design/evolutions/bake.js), looking at (0, lookY, 0), the view w x h world units across
  const camFor = (w, h, lookY) => { const c = new T.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100), D = 10, el = Math.asin(0.5);
    c.position.set(D * Math.cos(el) * Math.SQRT1_2, lookY + D * Math.sin(el), D * Math.cos(el) * Math.SQRT1_2); c.lookAt(0, lookY, 0); c.updateMatrixWorld(); c.updateProjectionMatrix(); return c; };
  const build = () => { const g = new T.Group();
    if (piece === 'quill') { const sh = _quillShard(P.len, P.len * P.fat, P.sides, _redShardMat(0.5), P.seed); sh.rotation.z = -PI / 2; sh.position.x = -P.len / 2; const r = new T.Group(); r.add(sh); r.rotation.x = P.roll || 0; g.add(r); }   // (rolled about its length so a ridge, not a flat face, meets the light)
    if (piece === 'icicle') {   // pale ice: glossy, flat-shaded facets, a cold glow from within (the Rimestar's light blue)
      const ice = new T.MeshStandardMaterial({ color: new T.Color(0x7cc8f2).convertSRGBToLinear(), emissive: new T.Color(0x1f6fc4).multiplyScalar(0.45), roughness: 0.3, metalness: 0.05, flatShading: true }); ice.envMapIntensity = 0.55;
      const front = P.len - P.back, mk = (h, tip, sd) => { const geo = new T.ConeGeometry(P.r, h, P.sides, 1), q = geo.attributes.position;
        for (let v = 0; v < q.count; v++) { const x = q.getX(v), y = q.getY(v), z = q.getZ(v), n = _hz(Math.round(x * 400) + sd, Math.round(y * 400), Math.round(z * 400)); q.setXYZ(v, x * (0.8 + 0.4 * n), y, z * (0.8 + 0.4 * (1 - n))); }
        geo.translate(0, h / 2, 0); geo.computeVertexNormals(); const m = new T.Mesh(geo, ice); if (!tip) m.rotation.z = PI; return m; };
      const spike = new T.Group(); spike.add(mk(front, true, P.seed)); spike.add(mk(P.back, false, P.seed + 7));   // (both cones from the widest point: the long one forward, the short one back)
      spike.rotation.z = -PI / 2; spike.position.x = (P.back - front) / 2; const r = new T.Group(); r.add(spike); r.rotation.x = P.roll || 0; g.add(r); }
    if (piece === 'bigseed') {   // the crystal along +y, its back point at 0 and its front point at len; then turned to point along +x, its middle at the origin
      const cg = corroded(0.34, 1.5, 0.55, 0, M.crystal, 0.5).geometry.clone(), sv = P.len / 2.435;   // (corroded's crystal runs from -1.135, its back point 0.7 x 0.55 long, to 1.3, its front point 0.55 long)
      cg.scale(P.r / 0.34, sv, P.r / 0.34); cg.translate(0, 1.135 * sv, 0);
      const base = new T.Color(P.color).convertSRGBToLinear(), gem = _gemCol32(cg, base), sd = new T.Group(); sd.add(gem);
      sd.rotation.z = -PI / 2; sd.position.x = -P.len / 2;
      const r = new T.Group(); r.add(sd); r.rotation.x = P.roll || 0; g.add(r);
      // ITS FACETS LIT FROM ONE WAY IN THE WORLD: _gemCol32's light (fixed to the crystal) where it was in the draft as the owner saw it (flying to the screen's right, its nose a little up), so the crystal is
      // lit alike whichever way it flies; at that angle its colours are the draft's own
      const Ld = new T.Vector3(-0.4, 0.7, 0.6).normalize().applyQuaternion(new T.Quaternion().setFromEuler(new T.Euler(0, 0, -PI / 2))).applyQuaternion(new T.Quaternion().setFromEuler(new T.Euler(P.roll || 0, 0, 0)))
        .applyQuaternion(new T.Quaternion().setFromEuler(new T.Euler(0, PI / 4, 0.12, 'YZX')));
      const pos = gem.geometry.attributes.position, col = gem.geometry.attributes.color, a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3();
      g.userData.relight = () => { g.updateMatrixWorld(true); const W = gem.matrixWorld;
        for (let i = 0; i < pos.count; i += 3) { a.fromBufferAttribute(pos, i).applyMatrix4(W); b.fromBufferAttribute(pos, i + 1).applyMatrix4(W); c.fromBufferAttribute(pos, i + 2).applyMatrix4(W);
          n.crossVectors(b.sub(a), c.sub(a)).normalize(); const k = 0.5 + 0.5 * n.dot(Ld), w = 0.45 * k * k * k, f = 0.35 + 0.65 * k;   // (_gemCol32's own shading, no glow)
          for (let j = 0; j < 3; j++) col.setXYZ(i + j, base.r * f + w, base.g * f + w, base.b * f + w); }
        col.needsUpdate = true; };
    }
    if (P.copy && !P.skin) {   // the form's own model, every surface of it black: glassy for the crystal and the shell, tar for the pool; its glows, washes and light off; its hairline crack (M.glow) kept
      const glass = new T.MeshPhysicalMaterial({ color: 0x060607, metalness: 0.35, roughness: 0.32, clearcoat: 1.0, clearcoatRoughness: 0.06, flatShading: true }); glass.envMapIntensity = 1.7;
      const tar = new T.MeshPhysicalMaterial({ color: 0x030303, metalness: 0.05, roughness: 0.75, clearcoat: 0.25, clearcoatRoughness: 0.35 }); tar.envMapIntensity = 0.35;   // (matte: a black pool, not a mirror)
      const B = FORMS2[P.form].build(); B.update(0, 0); B.g.rotation.y = PI / 4;
      B.g.traverse(o => { if (o.isSprite || o.isLight) { o.visible = false; if (o.isLight) o.intensity = 0; return; } if (!o.isMesh) return; const m = o.material;
        if (m === M.glow) return; if (m.transparent || m.blending === T.AdditiveBlending) { o.visible = false; return; } o.material = (m === M.slurry || m === M.rotDk) ? tar : glass; });
      g.add(B.g); g.userData.B = B;
    }
    if (P.copy && P.skin) {   // a copy MADE OF GOO (PROXY SWARM's): its own model, its glow on the floor and its light off; its diamond eyes (lit facet by facet, vertex-coloured) kept
      const gc = new T.Color(P.color).convertSRGBToLinear().multiply(new T.Color(0x8cffff));   // (the frog's own goo colour, forms31.js _gooFrog: its element's violet, leaning blue)
      const goo = new T.MeshStandardMaterial({ color: gc.clone().multiplyScalar(0.44), emissive: gc.clone().multiplyScalar(0.336), roughness: 0.1, metalness: 0 }); goo.envMapIntensity = 0.55;   // (its head's goo, solid)
      const B = FORMS2[P.form].build(); B.update(0, 0); B.g.rotation.y = PI / 4;
      B.g.traverse(o => { if (o.isSprite || o.isLight) { o.visible = false; if (o.isLight) o.intensity = 0; return; } if (!o.isMesh) return; const m = o.material;
        if (m.blending === T.AdditiveBlending) { o.visible = false; return; }   // (its glow on the floor)
        if (m.vertexColors) return;   // (its diamond eyes)
        if (m.transparent) return;   // (its goo: its head, its eyeballs, its drips, as they are)
        if (m.isMeshBasicMaterial && m.color.r + m.color.g + m.color.b < 0.1) return;   // (its mouth and its pupils)
        o.material = goo; });   // (the ring, its spikes and the lines of light along them: goo)
      g.add(B.g); g.userData.B = B;
    }
    if (piece === 'vortexshard') {   // the Mimic's own blade, its middle (its triangle's centroid) at the origin, laid on its side; userData.tumbler turns it about an axis through its middle
      const sh = blade(P.bw, P.bh, P.bd); sh.scale.setScalar(P.S); sh.position.set(-0.04 * P.bw * P.S, -P.bh * P.S / 3, 0);
      const side = new T.Group(); side.add(sh); side.rotation.z = PI / 2; const tum = new T.Group(); tum.add(side); g.add(tum); g.userData.tumbler = tum; }
    if (piece === 'slap') {   // a tapered tube of violet gel along a chain of five joints that swings, SHARP: thin and pointed at its tip, which curls like a hook (the owner: "Sharper tentacle"), ridged along its length; a brighter core inside it; small suckers
      const gel = new T.MeshStandardMaterial({ color: new T.Color(0x8a3df0).convertSRGBToLinear(), emissive: new T.Color(0x5a1fc8).multiplyScalar(0.5), transparent: true, opacity: 0.93, roughness: 0.2, metalness: 0 }); gel.envMapIntensity = 0.75;
      const core = new T.MeshBasicMaterial({ color: new T.Color(0xcfa8ff).convertSRGBToLinear(), transparent: true, opacity: 0.75, toneMapped: false });
      const suck = new T.MeshStandardMaterial({ color: new T.Color(0xe6d0ff).convertSRGBToLinear(), emissive: new T.Color(0x9a55f0).multiplyScalar(0.35), roughness: 0.3, metalness: 0 });
      const N = 24, tt = _taperTube(gel, N, 12), tc = _taperTube(core, N, 6), grp = new T.Group(); grp.rotation.y = PI / 4;   // (turned to face the camera, as the forms)
      grp.add(tt.mesh); grp.add(tc.mesh); const sk = []; for (let i = 0; i < 3; i++) { const s = new T.Mesh(new T.SphereGeometry(1, 8, 6), suck); grp.add(s); sk.push(s); } g.add(grp);
      const pts = Array.from({ length: N }, () => new T.Vector3()), rad = new Array(N), rc = new Array(N), Ln = 0.95, SEG = 5, jp = [new T.Vector3()];
      g.userData.pose = u => {
        const e = 1 - Math.pow(1 - u, 2), a0 = 2.35 - 3.0 * e, speed = Math.min(1.6, Math.abs(2 * (1 - u))), len = Ln * (0.6 + 0.4 * Math.min(1, u * 5));   // (clockwise from up and back to down and forward; it grows as it appears)
        jp.length = 1; let ang = 0; for (let i = 1; i <= SEG; i++) { const f = i / SEG; ang = a0 + 0.3 * speed * Math.pow(f, 1.3) * (1 + i * 0.2) - 0.1 * f * (1 - u) + 0.8 * Math.pow(f, 3.2) + 0.32 * Math.sin(f * 6.2 - u * 7) * f; jp.push(jp[i - 1].clone().add(new T.Vector3(Math.cos(ang), Math.sin(ang), 0).multiplyScalar(len / SEG))); }   // (the last joints hook round: the sharp curl at its tip)
        const curve = new T.CatmullRomCurve3(jp);
        for (let i = 0; i < N; i++) { const t = i / (N - 1), p = curve.getPoint(t); pts[i].copy(p); rad[i] = Math.max(0.003, 0.15 * Math.pow(1 - t, 0.95) * (1 + 0.09 * Math.sin(t * 30)) * Math.min(1, 0.4 + t / 0.07 * 0.6) + 0.004); rc[i] = rad[i] * 0.4; }   // (a point, not a round end; faint ridges along it)
        tt.set(pts, rad); tc.set(pts, rc);
        sk.forEach((s, i) => { const t = 0.22 + i * 0.17, p = curve.getPoint(t), tg = curve.getTangent(t), nx = -tg.y, ny = tg.x, r = 0.15 * Math.pow(1 - t, 0.95); s.position.set(p.x + nx * r * 0.95, p.y + ny * r * 0.95, 0.04); s.scale.setScalar(0.024); }); };
      g.userData.pose(0);
    }
    if (piece === 'slugball') {
      const R = 0.5, geo = new T.SphereGeometry(R, 18, 12); geo.rotateX(PI / 2);   // (its poles along z, the axle it rolls about: its 18 slices repeat every 20 degrees, so a 40 degree turn loops)
      const ng = geo.toNonIndexed(), q = ng.attributes.position, cols = new Float32Array(q.count * 3), c0 = new T.Color(0x1a2f9c).convertSRGBToLinear(), c1 = new T.Color(0x1fc7c9).convertSRGBToLinear(), c2 = new T.Color(0x0e1a5e).convertSRGBToLinear(), cc = new T.Color();
      for (let i = 0; i < q.count; i += 3) { const zx = (q.getZ(i) + q.getZ(i + 1) + q.getZ(i + 2)) / 3 / R, th = Math.atan2(q.getY(i) + q.getY(i + 1) + q.getY(i + 2), q.getX(i) + q.getX(i + 1) + q.getX(i + 2)), row = Math.round((Math.acos(Math.max(-1, Math.min(1, zx))) / PI) * 12), sl = Math.round((th + PI) / (2 * PI) * 18);
        const k = 1 - Math.abs(zx); cc.copy(c0).lerp(c1, k * k); if ((row + sl) % 2 === 0) cc.lerp(c2, 0.35);   // (teal along its rim, navy toward its sides; every other scale darker)
        for (let j = 0; j < 3; j++) { cols[(i + j) * 3] = cc.r; cols[(i + j) * 3 + 1] = cc.g; cols[(i + j) * 3 + 2] = cc.b; } }
      ng.setAttribute('color', new T.BufferAttribute(cols, 3)); ng.computeVertexNormals();
      const scale = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0.25, flatShading: true }); scale.envMapIntensity = 0.9;
      const spikeM = new T.MeshStandardMaterial({ color: new T.Color(0x2a2f3d).convertSRGBToLinear(), roughness: 0.4, metalness: 0.45, flatShading: true }); spikeM.envMapIntensity = 1.1;
      const edgeM = new T.MeshStandardMaterial({ color: new T.Color(0xbdf6ff).convertSRGBToLinear(), emissive: new T.Color(0x39d6e6).multiplyScalar(0.55), roughness: 0.2, metalness: 0.3 });
      const ball = new T.Group(); ball.add(new T.Mesh(ng, scale));
      const rim = new T.Mesh(new T.TorusGeometry(R * 1.01, 0.03, 6, 36), edgeM); ball.add(rim);   // (its cutting edge, round its rim)
      for (let i = 0; i < 9; i++) { const a2 = i * 2 * PI / 9, sp = new T.Mesh(new T.ConeGeometry(0.1, 0.4, 4, 1), spikeM); sp.position.set(Math.cos(a2) * (R + 0.15), Math.sin(a2) * (R + 0.15), 0); sp.rotation.z = a2 - PI / 2; sp.scale.z = 0.5; ball.add(sp); }   // (its back's spikes: flat blades, standing out of its rim)
      for (const sd of [-1, 1]) for (let i = 0; i < 9; i++) { const a2 = (i + 0.5) * 2 * PI / 9, sp = new T.Mesh(new T.ConeGeometry(0.055, 0.2, 4, 1), spikeM); sp.position.set(Math.cos(a2) * R * 0.9, Math.sin(a2) * R * 0.9, sd * R * 0.5); sp.rotation.z = a2 - PI / 2; sp.rotation.x = sd * 0.5; ball.add(sp); }   // (smaller ones either side)
      const up = new T.Group(); up.position.y = R + 0.15; up.add(ball); const face = new T.Group(); face.rotation.y = PI / 4; face.add(up); g.add(face);   // (its axle toward the camera: it rolls across the screen)
      g.userData.pose = u => { ball.rotation.z = -u * (P.yaws - 1) / P.yaws * (2 * PI / 9); };
      g.userData.pose(0);
    }
    if (piece === 'goosplash') {
      const goo = new T.MeshStandardMaterial({ color: new T.Color(0x16a82e).convertSRGBToLinear(), emissive: new T.Color(0x0c5f18).multiplyScalar(0.18), roughness: 0.18, metalness: 0, transparent: true, opacity: 1 }); goo.envMapIntensity = 0.45;
      const pale = new T.MeshStandardMaterial({ color: new T.Color(0x4fd23f).convertSRGBToLinear(), emissive: new T.Color(0x1f8f22).multiplyScalar(0.2), roughness: 0.15, metalness: 0, transparent: true, opacity: 1 }); pale.envMapIntensity = 0.5;
      const TOP = 0.78, drops = [];   // (the caldera's mouth, above the Seeper's foot)
      for (let i = 0; i < 14; i++) { const a2 = i * 2 * PI / 14 + (i % 2) * 0.17, Rr = 0.8 + 0.7 * ((i * 5) % 7) / 6, hh = 0.55 + 0.5 * ((i * 3) % 5) / 4, sz = 0.12 + 0.07 * ((i * 4) % 3) / 2;
        const m = new T.Mesh(new T.SphereGeometry(1, 12, 8), i % 4 === 0 ? pale : goo); g.add(m); drops.push({ m, a: a2, R: Rr, h: hh, sz, lag: ((i * 7) % 4) * 0.03 }); }
      const gout = new T.Mesh(new T.SphereGeometry(1, 14, 10), goo); g.add(gout);
      const crown = []; for (let i = 0; i < 8; i++) { const m = new T.Mesh(new T.SphereGeometry(1, 8, 6), pale); g.add(m); crown.push({ m, a: i * 2 * PI / 8 + 0.3 }); }
      g.userData.pose = u => {
        const fade = u > 0.82 ? Math.max(0, 1 - (u - 0.82) / 0.18) : 1; goo.opacity = fade; pale.opacity = fade;
        { const k = Math.min(1, u / 0.34), up2 = Math.sin(PI * k); gout.visible = u < 0.36; gout.position.set(0, TOP + 0.42 * up2, 0); gout.scale.set(0.24 * (1 - 0.5 * k) + 0.03, 0.2 + 0.42 * up2, 0.24 * (1 - 0.5 * k) + 0.03); }   // (the gout straight up out of its mouth, and back)
        crown.forEach(Cn => { const k = Math.min(1, u / 0.3), r = 0.18 + 0.3 * k; Cn.m.visible = u < 0.32; Cn.m.position.set(Math.cos(Cn.a) * r, TOP + 0.3 * Math.sin(PI * k), Math.sin(Cn.a) * r); Cn.m.scale.setScalar(0.07 * (1 - 0.6 * k)); });
        drops.forEach(D => { const t = Math.max(0, Math.min(1, (u - D.lag) / 0.52)), x = Math.cos(D.a) * D.R * t, z = Math.sin(D.a) * D.R * t;
          if (t < 1) { const y = TOP * (1 - t) + 4 * D.h * t * (1 - t) + 0.03; D.m.position.set(x, y, z); const st = 1 + 0.5 * Math.abs(1 - 2 * t); D.m.scale.set(D.sz / Math.sqrt(st), D.sz * st, D.sz / Math.sqrt(st)); }   // (stretched as it flies fast, round at the top of its arc)
          else { const sp = Math.min(1, (u - D.lag - 0.52) / 0.2), w = D.sz * (1.3 + 1.7 * sp); D.m.position.set(Math.cos(D.a) * D.R, 0.02, Math.sin(D.a) * D.R); D.m.scale.set(w, D.sz * (0.45 - 0.3 * sp), w); } });   // (landed: a splat, spreading)
      };
      g.userData.pose(0);
    }
    if (piece === 'rotspike') {   // the old shell's glassy black (forms-core.js M.black), flat-shaded so each broken face catches the light
      const black = new T.MeshPhysicalMaterial({ color: 0x060607, metalness: 0.35, roughness: 0.32, clearcoat: 1.0, clearcoatRoughness: 0.06, flatShading: true }); black.envMapIntensity = 1.7;   // (glassy: a clear coat over the black)
      const N = P.sides, mk = (r, h, sd, segs, amt) => { const geo = new T.ConeGeometry(r, h, N, segs), q = geo.attributes.position;
        for (let v = 0; v < q.count; v++) { const x = q.getX(v), y = q.getY(v), z = q.getZ(v); if (Math.hypot(x, z) < 1e-4) continue;
          const n = _hz(Math.round(x * 400) + sd, Math.round(y * 400), Math.round(z * 400)), n2 = _hz(Math.round(z * 400), Math.round(x * 400) + sd, Math.round(y * 400)), k = 1 - amt + 2 * amt * n;   // (rounded, so the seam's twin vertices move alike)
          q.setXYZ(v, x * k + (n2 - 0.5) * r * 0.3, y + (n - 0.5) * h * 0.05, z * (2 - k) * 0.9 + (n - 0.5) * r * 0.25); }
        geo.translate(0, h / 2, 0); geo.computeVertexNormals(); return new T.Mesh(geo, black); };
      const s1 = mk(P.r, P.h, P.seed, 4, 0.4); s1.rotation.z = -P.lean; s1.rotation.x = P.lean * 0.5; g.add(s1);
      // THE HAIRLINE of its crystal's green light in a crack (as on the shell shard on the Rotshard, forms5.js shellShard): along one ridge, from its foot to past halfway up
      { const q = s1.geometry.attributes.position, col = 1, at = row => new T.Vector3(q.getX(row * (N + 1) + col), q.getY(row * (N + 1) + col), q.getZ(row * (N + 1) + col));
        for (const [r0, r1] of [[4, 3], [3, 2]]) {   // along the ridge, a row at a time (the ridge bends where its row was pulled out)
          const A = at(r0), B = at(r1), mid = A.clone().add(B).multiplyScalar(0.5), out = new T.Vector3(mid.x, 0, mid.z).normalize().multiplyScalar(0.008);
          const cr = new T.Mesh(new T.CylinderGeometry(0.0065, 0.009, A.distanceTo(B) * 1.04, 5), M.glow); cr.position.copy(mid).add(out); cr.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize()); s1.add(cr); } }
      const c1 = mk(P.r * 0.5, P.h * 0.34, P.seed + 11, 2, 0.35); c1.position.set(P.r * 0.8, 0, P.r * 0.3); c1.rotation.set(0.3, 0.6, -0.6); g.add(c1);   // chips broken off at its foot
      const c2 = mk(P.r * 0.38, P.h * 0.22, P.seed + 23, 1, 0.3); c2.position.set(-P.r * 0.7, 0, -P.r * 0.5); c2.rotation.set(-0.35, 2.1, 0.5); g.add(c2);
    }
    return g; };
  // the way it flies, in the world: the game's x is the world's +x, the game's y the world's +z
  const aim = (g, yaw, pitch) => { g.rotation.set(0, 0, 0); g.rotation.order = 'YZX'; g.rotation.y = -yaw; g.rotation.z = pitch; if (g.userData.relight) g.userData.relight(); };   // (a piece lit from the world's way: lit again)
  if (mode === 'preview' && P.copy) {   // a copy of a form: alone, large; then beside the form itself, at one scale
    const shot = (scene, cam, W, H) => { renderer.setSize(W, H, false); renderer.render(scene, cam); const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(renderer.domElement, 0, 0); return c; };
    const V = P.pv || { big: [6.2, 2.728, 1.0], gap: 1.2, side: [5.2, 2.6, 0.75] };   // (ROTTEN DECOY's views unless the piece gives its own)
    const s1 = new T.Scene(); lit(s1); const q1 = build(); s1.add(q1);
    const big = shot(s1, camFor(V.big[0], V.big[1], V.big[2]), 1600, 704);
    const box = new T.Box3().setFromObject(q1);   // (how tall it stands: its top, for the game's record)
    const s2 = new T.Scene(); lit(s2); EL = { color: P.color }; setElementColour(P.color); const B = FORMS2[P.form].build(); B.update(0, 0); B.g.rotation.y = PI / 4; B.g.position.set(-V.gap * Math.SQRT1_2, 0, V.gap * Math.SQRT1_2); s2.add(B.g);
    const q2 = build(); q2.position.set(V.gap * Math.SQRT1_2, 0, -V.gap * Math.SQRT1_2); s2.add(q2);
    const side = shot(s2, camFor(V.side[0], V.side[1], V.side[2]), 800, 400);
    return { big: big.toDataURL('image/png'), side: side.toDataURL('image/png'), top: box.max.y };
  }
  if (mode === 'preview' && P.tumble) {   // a tumbling piece: six turns of it large in a row; then four whirling beside its form, at their own heights and distances, each its own way
    const shot = (scene, cam, W, H) => { renderer.setSize(W, H, false); renderer.render(scene, cam); const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(renderer.domElement, 0, 0); return c; };
    const turn = (q, j, a) => q.userData.tumbler.quaternion.setFromAxisAngle(new T.Vector3(...P.tumble.axes[j % P.tumble.axes.length]).normalize(), a);
    const s1 = new T.Scene(); lit(s1);
    for (let i = 0; i < 6; i++) { const q = build(); turn(q, i, 0.6 + i * 1.1); const x = (i - 2.5) * 1.05; q.position.set(x * Math.SQRT1_2, 0, -x * Math.SQRT1_2); s1.add(q); }
    const big = shot(s1, camFor(7.0, 3.08, 0), 1600, 704);
    const s2 = new T.Scene(); lit(s2); const B = FORMS2[P.form].build(); B.update(0, 0); s2.add(B.g); B.g.rotation.y = PI / 4; B.g.position.set(-1.0 * Math.SQRT1_2, 0, 1.0 * Math.SQRT1_2);
    [[0.5, 0.75, 0.0], [0.9, 0.35, 2.2], [0.35, 1.05, 4.1], [1.15, 0.6, 5.3]].forEach(([r, up, a], i) => { const q = build(); turn(q, i, 1.3 + i * 2.2); q.position.set(1.35 * Math.SQRT1_2 + Math.cos(a) * r, up, -1.35 * Math.SQRT1_2 + Math.sin(a) * r); s2.add(q); });
    const side = shot(s2, camFor(5.2, 2.6, 0.75), 800, 400);
    return { big: big.toDataURL('image/png'), side: side.toDataURL('image/png') };
  }
  if (mode === 'preview' && P.upright) {   // a standing piece: alone, large; then beside its form, as its effect sets it out (ROTTEN DECOY's four, at its heights)
    const shot = (scene, cam, W, H) => { renderer.setSize(W, H, false); renderer.render(scene, cam); const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(renderer.domElement, 0, 0); return c; };
    const s1 = new T.Scene(); lit(s1); const q1 = build(); q1.rotation.y = P.bigYaw !== undefined ? P.bigYaw : -0.45; s1.add(q1);   // (the spike's crack, a blade's face, toward the camera)
    const big = shot(s1, P.bigView ? camFor(P.bigView[0], P.bigView[1], P.bigView[2]) : camFor(P.h * 2.4, P.h * 1.056, P.h * 0.5), 1600, 704);
    const s2 = new T.Scene(); lit(s2); const B = FORMS2[P.form].build(); B.update(0, 0); s2.add(B.g); B.g.rotation.y = PI / 4; B.g.position.set(-1.0 * Math.SQRT1_2, 0, 1.0 * Math.SQRT1_2);
    if (P.ring) { const cx = 1.35 * Math.SQRT1_2, cz = -1.35 * Math.SQRT1_2;   // (as its effect sets them out: in a ring round a spot beside the form, floating a little, each turned its own way)
      for (let i = 0; i < P.ring.n; i++) { const a = i * 2 * PI / P.ring.n + 0.4, q = build(); q.rotation.y = a * 1.7; q.position.set(cx + Math.cos(a) * P.ring.r, P.ring.lift, cz + Math.sin(a) * P.ring.r); s2.add(q); } }
    else { const mist = new T.Mesh(new T.CircleGeometry(0.9, 40), M.floorGlow); mist.rotation.x = -PI / 2; mist.position.set(1.3 * Math.SQRT1_2, 0.01, -1.3 * Math.SQRT1_2); s2.add(mist); }   // (the mist the game draws round it, here only to show it in place)
    if (!P.ring) [[-0.22, 0.68, 0.3], [0, 1, 1.4], [0.24, 0.77, 2.6], [-0.06, 0.5, 4.1]].forEach(([dx, k, yaw], i) => { const q = build(); q.scale.setScalar(k * 1.3); q.rotation.y = yaw; q.position.set((1.3 + dx) * Math.SQRT1_2 + (i % 2 ? 0.12 : -0.1), 0, -(1.3 - dx) * Math.SQRT1_2 + (i > 1 ? 0.18 : -0.12)); s2.add(q); });
    const side = shot(s2, camFor(5.2, 2.6, 0.75), 800, 400);
    return { big: big.toDataURL('image/png'), side: side.toDataURL('image/png') };
  }
  if (mode === 'preview') {
    const shot = (scene, cam, W, H) => { renderer.setSize(W, H, false); renderer.render(scene, cam); const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(renderer.domElement, 0, 0); return c; };
    // 1. the piece alone, large: flying to the screen's right (the game's +x, -y), its nose a little up
    const s1 = new T.Scene(); lit(s1); const q1 = build(); aim(q1, -PI / 4, 0.12); s1.add(q1);
    const big = shot(s1, camFor(P.len * 1.4, P.len * 0.616, 0), 1600, 704);
    // 2. the same, beside its form, at one scale (the form idle, facing the camera; the piece at mid height, as in flight)
    const s2 = new T.Scene(); lit(s2); const B = FORMS2[P.form].build(); B.update(0, 0); s2.add(B.g); B.g.rotation.y = PI / 4;
    const q2 = build(); aim(q2, -PI / 4, 0.12); q2.position.set(1.75 * Math.SQRT1_2, 0.55, -1.75 * Math.SQRT1_2); s2.add(q2); B.g.position.set(-0.75 * Math.SQRT1_2, 0, 0.75 * Math.SQRT1_2);
    const side = shot(s2, camFor(5.2, 2.6, 0.75), 800, 400);
    return { big: big.toDataURL('image/png'), side: side.toDataURL('image/png') };
  }
  if (mode === 'sheet') {
    const C = P.cell, PXU = 144 / 3.4, Wv = C / PXU;   // (the forms' pixels a unit)
    renderer.setSize(C, C, false);
    const scene = new T.Scene(); lit(scene); const q = build(); scene.add(q); const cam = camFor(Wv, Wv, P.upright ? P.h * 0.42 : 0);   // (a standing piece: the view raised to its middle)
    const sheet = document.createElement('canvas'); sheet.width = C * P.yaws; sheet.height = C * P.pitches.length; const sg = sheet.getContext('2d');
    const probe = document.createElement('canvas'); probe.width = C; probe.height = C; const pg = probe.getContext('2d'); const edges = [];
    for (let j = 0; j < P.pitches.length; j++) for (let k = 0; k < P.yaws; k++) {
      if (P.copy) { const B = q.userData.B; B.update(k / P.yaws * P.loop, 0); B.g.traverse(o => { if (o.isSprite || o.isLight) o.visible = false; if (o.isMesh && o.material && o.material.blending === T.AdditiveBlending) o.visible = false; }); }   // (a copy: frame k of its idle loop)
      else if (P.tumble) q.userData.tumbler.quaternion.setFromAxisAngle(new T.Vector3(...P.tumble.axes[j]).normalize(), k * 2 * PI / P.yaws);   // (a tumbling piece: row j its axis, column k the step of its turn)
      else if (P.anim) q.userData.pose(k / (P.yaws - 1));   // (an animated piece: column k the frame of its swing)
      else aim(q, k * 2 * PI / P.yaws, P.pitches[j]);
      renderer.render(scene, cam); sg.drawImage(renderer.domElement, k * C, j * C, C, C);
      pg.clearRect(0, 0, C, C); pg.drawImage(renderer.domElement, 0, 0, C, C); const d = pg.getImageData(0, 0, C, C).data; let edge = false;
      for (let i = 0; i < C && !edge; i++) for (const [x, y] of [[i, 0], [i, C - 1], [0, i], [C - 1, i]]) if (d[(y * C + x) * 4 + 3] > 8) { edge = true; break; }
      if (edge) edges.push(k + ',' + j);
    }
    const g0 = new T.Vector3(0, 0, 0).project(cam), t0 = new T.Vector3(0, P.h || 0, 0).project(cam);   // (its foot, the origin; a standing piece's tip, straight above it)
    return { png: sheet.toDataURL('image/png'), meta: { piece, cell: C, yaws: P.yaws, pitches: P.pitches, anchor: { x: (g0.x * 0.5 + 0.5) * C, y: (1 - (g0.y * 0.5 + 0.5)) * C }, unitsPerCell: Wv, len: P.len,
      tipY: P.upright ? (1 - (t0.y * 0.5 + 0.5)) * C : undefined, upright: !!P.upright }, edges };
  }
  return { err: 'mode ' + mode };
};
</script></body></html>`;

(async () => {
  if (!PIECES[PIECE]) { console.error('no piece ' + PIECE + ' (' + Object.keys(PIECES).join(', ') + ')'); process.exit(1); }
  const OLD_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';   // (as the forms' baker)
  const b = await chromium.launch(Object.assign(fs.existsSync(OLD_CHROME) ? { executablePath: OLD_CHROME } : {}, { args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] }));
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://fx.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://fx.local/');
  const res = await p.evaluate(([m, k, P]) => window.__fx(m, k, P), [MODE, PIECE, PIECES[PIECE]]);
  if (errs.length || res.err) { console.error(errs.join('\n') || res.err); process.exit(1); }
  if (MODE === 'preview') {
    // one picture: the piece large on top, the piece beside its form below (on the arena's dark floor colour, so the glow reads as it will)
    const q = await b.newPage(); await q.setViewportSize({ width: 1600, height: 1160 });
    await q.setContent(`<body style="margin:0;background:#15181d;font:600 22px sans-serif;color:#9aa6b2"><img src="${res.big}" style="display:block"><div style="display:flex;align-items:center;gap:24px;padding:8px 24px"><img src="${res.side}"><div>${PIECES[PIECE].cap ? PIECES[PIECE].cap[0] : PIECES[PIECE].upright ? 'ROTTEN DECOY\'s four ' + PIECE + 's beside the Rotshard, at one scale' : 'the ' + PIECE + ' beside its form, at one scale'}<br><span style="font-weight:400;font-size:18px">${PIECES[PIECE].cap ? PIECES[PIECE].cap[1] : PIECES[PIECE].upright ? '(in the game the tallest is about 44 px; the green mist stays drawn in code)' : '(in the game it is about ' + Math.round(PIECES[PIECE].len * 96 / 3.4) + ' px long)'}</span></div></div></body>`);
    await q.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1600, height: 1120 } });
    console.log('wrote ' + OUT + (res.top !== undefined ? '  (its top: ' + res.top.toFixed(3) + ' units up)' : ''));
  }
  if (MODE === 'sheet') {
    fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, PIECE + '.png'), Buffer.from(res.png.split(',')[1], 'base64'));
    const od = path.join(__dirname, 'out'); fs.mkdirSync(od, { recursive: true }); fs.writeFileSync(path.join(od, PIECE + '.json'), JSON.stringify(res.meta, null, 1) + '\n');
    console.log('wrote ' + path.join(OUT, PIECE + '.png') + ' (' + res.meta.cell * res.meta.yaws + ' x ' + res.meta.cell * res.meta.pitches.length + ') and ' + path.join(od, PIECE + '.json') + (res.edges.length ? '  EDGE! cells touching their edge: ' + res.edges.join(' ') : ''));
  }
  await b.close();
})();
