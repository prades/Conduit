// THE TEN DIRECTIONS (design/style-evolution; Proposed, for the owner to choose from, nothing in the game). Each: a palette (materials for the scene's parts),
// lights, a camera, post-processing, what it does to the cast, and the combat overlay that shows its way of making a fight slow and readable.
// Every colour, size and word here is the agent's, for a picture; none is a decision.
const STYLES = {};
function style(id, def) { STYLES[id] = def; }

// ── shared pieces ──
function tex(w, h, draw, o) { return canvasTex(w, h, draw, o); }
const PLATE = (base, light) => tex(256, 256, (g, w, h) => {   // the checker plate the Sewers have now, two plates a tile
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let y = 6; y < h; y += 16) for (let x = (y / 16 % 2) * 8 + 4; x < w; x += 16) { g.save(); g.translate(x, y); g.rotate(((x + y) / 16) % 2 ? 0.6 : -0.6); g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(-5, -1.5, 10, 3); g.fillStyle = light; g.fillRect(-5, -2.5, 10, 1); g.restore(); }
  g.strokeStyle = 'rgba(0,0,0,0.75)'; g.lineWidth = 4; g.strokeRect(2, 2, w - 4, h / 2 - 4); g.strokeRect(2, h / 2 + 2, w - 4, h / 2 - 4);
  g.fillStyle = 'rgba(200,210,220,0.6)'; for (const [x, y] of [[10, 10], [w - 10, 10], [10, h / 2 - 10], [w - 10, h / 2 - 10], [10, h / 2 + 10], [w - 10, h / 2 + 10], [10, h - 10], [w - 10, h - 10]]) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
});
const PANEL = (face, wain, strip) => tex(128, 212, (g, w, h) => {   // a wall's face, a tile wide: dark wainscot, a panel, a reveal, a light strip low down, a conduit under the cap
  g.fillStyle = face; g.fillRect(0, 0, w, h); g.fillStyle = wain; g.fillRect(0, h - 40, w, 40);
  g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(0, 0, 3, h); g.fillRect(w - 2, 0, 2, h); g.fillRect(0, 74, w, 3); g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(3, 0, 2, h); g.fillRect(0, 77, w, 2);
  g.fillStyle = '#20282a'; g.fillRect(0, 0, w, 16); g.fillStyle = '#3e4a48'; g.fillRect(0, 20, w, 9); g.fillStyle = '#6f817c'; g.fillRect(0, 21, w, 2);
  if (strip) { g.fillStyle = strip; g.globalAlpha = 0.35; g.fillRect(0, h - 48, w, 10); g.globalAlpha = 1; g.fillRect(0, h - 45, w, 3); }
});
const STRIPES = (a, b) => tex(256, 32, (g, w, h) => { g.fillStyle = b; g.fillRect(0, 0, w, h); g.fillStyle = a; for (let x = -32; x < w + 32; x += 32) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, h); g.lineTo(x + 32, 0); g.lineTo(x + 16, 0); g.closePath(); g.fill(); } }, { repeat: true });
const RIPPLE = () => { const t = tex(256, 256, (g, w, h) => { g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { const x = (i * 97) % w, y = (i * 53 + (i * i) % 37) % h, r = 6 + (i % 7) * 3; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(' + (100 + (i % 5) * 12) + ',' + (100 + (i % 3) * 20) + ',255,0.5)'); gr.addColorStop(1, 'rgba(128,128,255,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); } }, { repeat: true }); t.encoding = T.LinearEncoding; t.repeat.set(8, 2); return t; };
function linearPalette(P) {   // (three r128 takes a colour as linear light and brightens it on the way out: for the flat looks, each colour as written)
  const seen = new Set(); for (const k in P) for (const m of [].concat(P[k])) if (m && m.isMaterial && !seen.has(m)) { seen.add(m); if (m.color) m.color.convertSRGBToLinear(); if (m.emissive) m.emissive.convertSRGBToLinear(); }
  return P;
}
function boxMats(side, top) { return [side, side, top, top, side, side]; }
function std(color, o) { return new T.MeshStandardMaterial(Object.assign({ color, roughness: 0.6, metalness: 0.2 }, o)); }
function basePalette() {
  const kerbTex = STRIPES('#e0b31f', '#151515'); kerbTex.repeat.set(40, 1);
  return {
    floor: std(0xffffff, { map: PLATE('#3f474c', 'rgba(200,215,225,0.25)'), roughness: 0.5, metalness: 0.55 }),
    wallMats: boxMats(std(0xffffff, { map: PANEL('#2e3735', '#161c1b', '#46d62e'), roughness: 0.7, metalness: 0.25 }), std(0x0b0d0e, { roughness: 0.9 })),
    cutMats: boxMats(std(0x14191a, { roughness: 0.9 }), std(0x0b0d0e, { roughness: 0.9 })),
    bed: std(0x07140b), water: std(0x16521f, { emissive: 0x12561c, emissiveIntensity: 0.5, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.95, normalMap: RIPPLE(), normalScale: new T.Vector2(0.35, 0.35) }),
    bank: std(0x262d2b, { roughness: 0.85 }), kerb: std(0xffffff, { map: kerbTex, roughness: 0.6 }),
    grating: std(0x30383c, { roughness: 0.4, metalness: 0.8 }), rail: std(0xc8902e, { roughness: 0.4, metalness: 0.6 }),
    bar: std(0x56636f, { roughness: 0.35, metalness: 0.8 }), gateRail: std(0x6f7d8a, { roughness: 0.35, metalness: 0.8 }), lock: std(0xc8962e, { metalness: 0.9, roughness: 0.3 }),
    rock: std(0x6b5644, { roughness: 0.95, flatShading: true }), machine: std(0x3a4448, { metalness: 0.6, roughness: 0.45 }), pipe: std(0x3e4a48, { metalness: 0.7, roughness: 0.35 }),
    hole: new T.MeshBasicMaterial({ color: 0x020302 }), egg: std(0xd9ffcf, { emissive: 0x5cff5c, emissiveIntensity: 0.35, roughness: 0.3, transparent: true, opacity: 0.9 }),
    puddle: std(0x0b1210, { roughness: 0.05, metalness: 0.5, transparent: true, opacity: 0.8 }),
    lampOn: new T.MeshBasicMaterial({ color: 0xd8f6ff, toneMapped: false }), lampLight: { color: 0xbfefff, intensity: 1.4, distance: 5 },
  };
}
// ── floor marks, in the scene (under the characters, so a mark never tints anyone standing on it) ──
const decalMat = (col, op) => new T.MeshBasicMaterial({ color: col, transparent: true, opacity: op === undefined ? 0.8 : op, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, side: T.DoubleSide });
function decalRing(scene, at, r, w, col, op, from, to) { const a0 = (from || 0) * Math.PI * 2, a1 = ((to === undefined ? 1 : to) - (from || 0)) * Math.PI * 2, m = new T.Mesh(new T.RingGeometry(r - w / 2, r + w / 2, 64, 1, -a0 - a1 + Math.PI / 2, a1), decalMat(col, op)); m.rotation.x = -Math.PI / 2; m.position.set(at[0], 0.015, at[1]); scene.add(m); return m; }
function decalDisc(scene, at, r, col, op) { const m = new T.Mesh(new T.CircleGeometry(r, 48), decalMat(col, op)); m.rotation.x = -Math.PI / 2; m.position.set(at[0], 0.012, at[1]); scene.add(m); return m; }
function decalPoly(scene, pts, col, op) { const sh = new T.Shape(pts.map(p => new T.Vector2(p[0], -p[1]))), m = new T.Mesh(new T.ShapeGeometry(sh), decalMat(col, op)); m.rotation.x = -Math.PI / 2; m.position.y = 0.013; scene.add(m); return m; }
function decalLine(scene, pts, w, col, op) { for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), nx = -dy / L * w / 2, ny = dx / L * w / 2; decalPoly(scene, [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], col, op); } }
function persp(W, H, fov, target, az, el, dist) {   // az: degrees round from +x towards +z (the game's camera looks from +x+y: 45); el: degrees up
  const c = new T.PerspectiveCamera(fov, W / H, 0.1, 200), a = az * Math.PI / 180, e = el * Math.PI / 180;
  c.position.set(target[0] + Math.cos(a) * Math.cos(e) * dist, target[1] + Math.sin(e) * dist, target[2] + Math.sin(a) * Math.cos(e) * dist); c.lookAt(target[0], target[1], target[2]); c.updateProjectionMatrix(); c.updateMatrixWorld(); return c;
}
function ortho(W, H, span, target, az, el) {
  const c = new T.OrthographicCamera(-span / 2, span / 2, span / 2 * H / W, -span / 2 * H / W, 0.1, 200), a = az * Math.PI / 180, e = el * Math.PI / 180, d = 40;
  c.position.set(target[0] + Math.cos(a) * Math.cos(e) * d, target[1] + Math.sin(e) * d, target[2] + Math.sin(a) * Math.cos(e) * d); c.lookAt(target[0], target[1], target[2]); c.updateProjectionMatrix(); c.updateMatrixWorld(); return c;
}
function keyLight(scene, color, intensity, from, target, size) {
  const l = new T.DirectionalLight(color, intensity); l.position.set(target[0] + from[0], from[1], target[2] + from[2]); l.target.position.set(target[0], 0, target[2]);
  l.castShadow = true; l.shadow.mapSize.set(2048, 2048); const s = size || 9; Object.assign(l.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 60 }); l.shadow.bias = -0.0008; l.shadow.normalBias = 0.02;
  scene.add(l); scene.add(l.target); return l;
}
function riverGlow(scene, color, intensity) { for (const x of [-37, -33, -29, -25, -21]) { const l = new T.PointLight(color, intensity, 4.5, 2); l.position.set(x, 0.1, 112); scene.add(l); } }
const SRGB = { uniforms: { tDiffuse: { value: null }, lift: { value: 1 } }, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform float lift; varying vec2 vUv;
  vec3 srgb(vec3 c) { return mix(c * 12.92, pow(c, vec3(1.0 / 2.4)) * 1.055 - 0.055, step(vec3(0.0031308), c)); }
  void main() { vec3 c = clamp(texture2D(tDiffuse, vUv).rgb, 0.0, 1.0); gl_FragColor = vec4(mix(c, srgb(c), lift), 1.0); }` };
function composer(renderer, scene, cam, W, H, passes, o) {   // (r128 tone-maps into the composer's target but leaves its colours linear: o.srgb, 0 to 1, lifts them that far towards sRGB)
  const c = new T.EffectComposer(renderer); c.setSize(W, H); c.addPass(new T.RenderPass(scene, cam)); if (o && o.srgb) c.addPass(shader(SRGB, { lift: o.srgb }));
  for (const p of passes) c.addPass(p); c.addPass(new T.ShaderPass(T.CopyShader));   // (a plain copy last: r128's bloom, when it is the last pass, writes out through a material that tone-maps a second time)
  return () => c.render();
}
function shader(def, uniforms) { const p = new T.ShaderPass(def); for (const k in uniforms) p.uniforms[k].value = uniforms[k]; return p; }
function bloom(W, H, s, r, t) { return new T.UnrealBloomPass(new T.Vector2(W, H), s, r, t); }
const TARGET = [-29.6, 0.25, 110.0];

// ── overlay helpers (2D, over the picture) ──
const F = { title: '"BV Titan", "DejaVu Sans", sans-serif', bang: '"BV Bangers", "DejaVu Sans", sans-serif', cond: 'italic 900 1px "BV Barlow", "DejaVu Sans", sans-serif', chakra: '"BV Chakra", "DejaVu Sans", sans-serif', pixel: '"BV Pixel", monospace', cinzel: '"BV Cinzel", serif', ui: '"DejaVu Sans", sans-serif' };
function font(kind, px) { return kind === 'cond' ? 'italic 900 ' + px + 'px "BV Barlow", "DejaVu Sans", sans-serif' : (kind === 'ui' ? 'bold ' : '') + px + 'px ' + F[kind]; }
function rrect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function text(g, s, x, y, o) { g.save(); g.font = o.font; g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'alphabetic'; if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.sw || 6; g.strokeStyle = o.stroke; g.strokeText(s, x, y); } g.fillStyle = o.fill || '#fff'; g.fillText(s, x, y); g.restore(); }
function pill(g, x, y, w, h, fill, stroke) { rrect(g, x, y, w, h, h / 2); g.fillStyle = fill; g.fill(); if (stroke) { g.lineWidth = 2; g.strokeStyle = stroke; g.stroke(); } }
function bar(g, x, y, w, h, frac, col, back) { g.fillStyle = back || 'rgba(0,0,0,0.65)'; rrect(g, x - 1, y - 1, w + 2, h + 2, 2); g.fill(); g.fillStyle = col; rrect(g, x, y, Math.max(2, w * frac), h, 2); g.fill(); }
function head(P, at, h) { return P.project(at[0], h, at[1]); }
function bigNumber(g, s, x, y, px, fill, stroke) { text(g, s, x, y, { font: font('title', px), fill, stroke: stroke || '#000', sw: px * 0.22, align: 'center' }); }
function caption(g, P, n, title, look, fight, top) {   // the direction's name and its two ideas, bottom left (or top left)
  const x = 28, y = top ? 74 : P.H - 132; g.save(); g.fillStyle = 'rgba(6,9,14,0.82)'; rrect(g, x - 12, y - 46, 760, 160, 14); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 2; g.stroke();
  text(g, n + '  ' + title, x, y, { font: font('title', 38), fill: '#fff' });
  text(g, 'LOOK  ' + look, x, y + 40, { font: font('ui', 21), fill: '#cfe3ff' }); text(g, 'FIGHT  ' + fight, x, y + 72, { font: font('ui', 21), fill: '#ffd98a' }); g.restore();
}

// ═════════ 1. DIORAMA ═════════ real 3D, soft shadows and warm practical light, a tilt-shift blur that makes the facility a model on a table;
// the fight in SLOW TIME: when a creature engages the clock runs at 40% and every attack shows its wind-up ring filling before it lands
style('diorama', {
  exposure: 1.15,
  palette: basePalette,
  env(scene) { scene.background = new T.Color(0x05070a); scene.fog = new T.Fog(0x05070a, 18, 34); },
  lights(scene, P) {
    scene.add(new T.HemisphereLight(0x9fb4c8, 0x101410, 0.55));
    keyLight(scene, 0xffe6c8, 1.5, [-6, 14, -3], TARGET, 10);
    const fill = new T.DirectionalLight(0x9fc4ff, 0.55); fill.position.set(TARGET[0] + 8, 9, TARGET[2] + 10); scene.add(fill);   // (from the camera's side: the wall faces)
    riverGlow(scene, 0x5cff5c, 0.55);
  },
  camera: (W, H) => persp(W, H, 26, [-29.4, 0.3, 109.6], 55, 41, 17.5),
  decals(scene) { const rings = [[CAST.ram.at, 0.78, 0x3dffd9], [CAST.skink.at, 0.35, 0xffe033], [CAST.egg.at, 0.55, 0xff7a3d], [CAST.player.at, 0.2, 0x19e6c1], [FOES[0].at, 0.9, 0xff3b3b], [FOES[1].at, 0.6, 0xff3b3b], [FOES[2].at, 0.25, 0xff3b3b]];
    for (const [at, f, c] of rings) { decalRing(scene, at, 0.5, 0.11, 0x000000, 0.55); decalRing(scene, at, 0.5, 0.07, c, 0.95, 0, f); } },
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [
    bloom(W, H, 0.55, 0.5, 0.82),
    shader(T.HorizontalTiltShiftShader, { h: 2.6 / W, r: 0.5 }), shader(T.VerticalTiltShiftShader, { v: 2.6 / H, r: 0.5 }),
    shader(T.VignetteShader, { offset: 1.05, darkness: 1.15 }),
  ]),
  overlay(g, P) {
    // SLOW TIME: the chip (each unit's wind-up ring is on the floor, in the scene: decals)
    pill(g, 28, 26, 330, 58, 'rgba(10,18,28,0.85)', 'rgba(120,200,255,0.6)'); text(g, '⏳  SLOW TIME  ×0.4', 52, 66, { font: font('title', 28), fill: '#bfe8ff' });
    text(g, 'the fight runs at 40% while a creature is on you', 30, 112, { font: font('ui', 18), fill: 'rgba(220,235,255,0.8)', stroke: 'rgba(0,0,0,0.6)', sw: 4 });
    const a = P.FOES[0], ha = head(P, a.at, 1.05); pill(g, ha[0] - 10, ha[1] - 34, 190, 40, 'rgba(120,0,0,0.88)', '#ff6b6b'); text(g, 'BITE IN 0.6 s', ha[0] + 85, ha[1] - 7, { font: font('title', 21), fill: '#fff', align: 'center' });
    const s = P.project(P.fx.sparkAt.x, P.fx.sparkAt.y + 0.75, P.fx.sparkAt.z); bigNumber(g, '42', s[0] - 70, s[1] - 20, 64, '#7dfff0');
    caption(g, P, '1', 'DIORAMA', 'real 3D, soft shadows, tilt-shift: a model on a table', 'SLOW TIME: 40% speed in a fight, wind-up rings before every blow');
  },
});

// ── what a style can do to the cast ──
function eachMesh(o, f) { o.traverse(m => { if (m.isMesh && m.visible) f(m); }); }
function shownChain(o) { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; }
function remat(o, make) {   // every visible mesh's material remade from its colour and glow (glass and pure light kept as they are)
  eachMesh(o, m => { const ms = [].concat(m.material).map(x => (x.isMeshBasicMaterial || x.transparent && x.opacity < 0.5) ? x : make(x)); m.material = Array.isArray(m.material) ? ms : ms[0]; });
}
const glowOf = x => x.emissive && x.emissiveIntensity > 0.2 && (x.emissive.r + x.emissive.g + x.emissive.b) > 0.3;
function blobShadow(scene, at, r, a) { const m = new T.Mesh(new T.CircleGeometry(r, 24), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: a || 0.45, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(at[0], 0.012, at[1]); m.scale.set(1, 0.75, 1); scene.add(m); return m; }
function allUnits() { return Object.keys(CAST).map(k => ({ key: k, at: CAST[k].at })).concat(FOES.map(f => ({ key: 'ant_' + f.id, at: f.at }))); }
// a character alone, rendered small from the camera's own angle, stood in its place as a billboard of hard pixels (with a dark pixel outline)
function pixelSprites(cast, scene, cam, P, px) {
  const r = P.renderer, rt = new T.WebGLRenderTarget(px, px), buf = new Uint8Array(px * px * 4), dir = new T.Vector3(); cam.getWorldDirection(dir); rt.texture.encoding = T.sRGBEncoding;
  const tm = r.toneMapping; r.toneMapping = T.NoToneMapping;
  for (const u of allUnits()) {
    const o = cast.parts[u.key], parent = o.parent, box = new T.Box3().setFromObject(o), c = box.getCenter(new T.Vector3()), half = Math.max(0.45, box.getSize(new T.Vector3()).length() * 0.55);
    const sc = new T.Scene(); sc.environment = scene.environment; sc.add(new T.HemisphereLight(0xdfe8ff, 0x202020, 1.1)); const k = new T.DirectionalLight(0xffffff, 1.6); k.position.set(-3, 6, -2); sc.add(k); sc.add(o);
    const oc = new T.OrthographicCamera(-half, half, half, -half, 0.01, 100); oc.position.copy(c).addScaledVector(dir, -20); oc.lookAt(c); oc.updateMatrixWorld();
    r.setRenderTarget(rt); r.setClearColor(0x000000, 0); r.clear(); r.render(sc, oc); r.readRenderTargetPixels(rt, 0, 0, px, px, buf); r.setRenderTarget(null);
    const cv = document.createElement('canvas'); cv.width = cv.height = px; const g = cv.getContext('2d'), im = g.createImageData(px, px), A = (x, y) => x >= 0 && y >= 0 && x < px && y < px ? buf[((px - 1 - y) * px + x) * 4 + 3] : 0;
    for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) { const s = ((px - 1 - y) * px + x) * 4, d = (y * px + x) * 4;
      if (buf[s + 3] > 90) { for (let q = 0; q < 3; q++) im.data[d + q] = Math.min(255, Math.round(buf[s + q] / 32) * 32 + 12); im.data[d + 3] = 255; }
      else if (A(x - 1, y) > 90 || A(x + 1, y) > 90 || A(x, y - 1) > 90 || A(x, y + 1) > 90) { im.data[d] = 8; im.data[d + 1] = 10; im.data[d + 2] = 16; im.data[d + 3] = 255; } }
    g.putImageData(im, 0, 0); const t = new T.CanvasTexture(cv); t.magFilter = t.minFilter = T.NearestFilter; t.encoding = T.sRGBEncoding;
    const sp = new T.Sprite(new T.SpriteMaterial({ map: t, transparent: true, alphaTest: 0.5 })); sp.scale.set(half * 2, half * 2, 1); sp.position.copy(c); parent.add(sp); blobShadow(scene, u.at, 0.32, 0.5);
  }
  r.toneMapping = tm;
}
// a character as voxels: points sampled over its surfaces, snapped to a grid, a cube for each cell, in the colour of what it sampled
function voxelize(o, step, parent) {
  const cells = new Map(), p = new T.Vector3(); o.updateMatrixWorld(true);
  o.traverse(m => {
    if (!m.isMesh || !shownChain(m)) return; const x = [].concat(m.material)[0]; if (x.transparent && x.opacity < 0.3) return;
    const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry, tmp = new T.Mesh(geo, x), bb = new T.Box3().setFromObject(m), n = Math.min(5000, Math.max(120, Math.round(bb.getSize(new T.Vector3()).lengthSq() / (step * step) * 6)));
    let s; try { s = new T.MeshSurfaceSampler(tmp).build(); } catch (e) { return; }
    const col = (glowOf(x) ? x.emissive : (x.color || new T.Color(0x888888))).clone();
    for (let i = 0; i < n; i++) { s.sample(p); p.applyMatrix4(m.matrixWorld); const k = Math.round(p.x / step) + ',' + Math.round(p.y / step) + ',' + Math.round(p.z / step); if (!cells.has(k)) cells.set(k, col); }
  });
  const im = new T.InstancedMesh(new T.BoxGeometry(step, step, step), new T.MeshStandardMaterial({ roughness: 0.75, metalness: 0.05 }), cells.size), m4 = new T.Matrix4(); let i = 0;
  for (const [k, c] of cells) { const [a, b, d] = k.split(',').map(Number); m4.makeTranslation(a * step, b * step, d * step); im.setMatrixAt(i, m4); im.setColorAt(i, c); i++; }
  im.castShadow = true; im.receiveShadow = true; parent.add(im); o.visible = false; return im;
}
const GRAD3 = () => { const d = new Uint8Array([70, 70, 70, 255, 160, 160, 160, 255, 255, 255, 255, 255]), t = new T.DataTexture(d, 3, 1, T.RGBAFormat); t.minFilter = t.magFilter = T.NearestFilter; t.needsUpdate = true; return t; };
function toonMats(o, grad) { remat(o, x => new T.MeshToonMaterial({ color: x.color ? x.color.clone() : new T.Color(0xaaaaaa), emissive: x.emissive ? x.emissive.clone() : new T.Color(0), emissiveIntensity: glowOf(x) ? x.emissiveIntensity : 0, gradientMap: grad })); }
function flatMats(o, light) { remat(o, x => { const c = x.color ? x.color.clone() : new T.Color(0xaaaaaa); if (light) c.lerp(new T.Color(0xffffff), light); return new T.MeshLambertMaterial({ color: c, emissive: glowOf(x) ? x.emissive.clone() : new T.Color(0), flatShading: true }); }); }
function clayMats(o) { remat(o, x => { const c = x.color ? x.color.clone() : new T.Color(0xaaaaaa); const hsl = {}; c.getHSL(hsl); c.setHSL(hsl.h, Math.min(1, hsl.s * 1.15), Math.max(0.22, hsl.l)); return new T.MeshStandardMaterial({ color: c, roughness: 0.82, metalness: 0.02, emissive: glowOf(x) ? x.emissive.clone() : new T.Color(0), emissiveIntensity: glowOf(x) ? 0.8 : 0 }); }); }
function holoMats(o, col, op) { remat(o, x => new T.MeshBasicMaterial({ color: col, wireframe: true, transparent: true, opacity: op || 0.55, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })); }
function iso(W, H, span, target, el) { return ortho(W, H, span, target || TARGET, 45, el || 33); }
function teamColour(key) { return key.startsWith('ant') ? '#ff4b4b' : ({ player: '#19e6c1', ram: '#00ccaa', skink: '#ffe033', egg: '#ff7a3d' })[key]; }

// ═════════ 2. PIXEL SQUAD IN A 3D WORLD ═════════ the world in lit 3D with depth of field and bloom, the creatures as crisp pixel sprites standing in it;
// the fight as a TURN QUEUE (active time): every unit's gauge fills, and when it is full that unit acts, one at a time, the others holding still
style('pixel', {
  exposure: 1.1,
  palette: () => { const P = basePalette(); P.water.emissiveIntensity = 0.75; return P; },
  env(scene) { scene.background = new T.Color(0x06080c); scene.fog = new T.Fog(0x06080c, 14, 30); },
  lights(scene) { scene.add(new T.HemisphereLight(0xb0c4ff, 0x10140f, 0.6)); keyLight(scene, 0xffd9a8, 1.4, [-7, 12, -2], TARGET, 10); const f = new T.DirectionalLight(0x88aaff, 0.5); f.position.set(TARGET[0] + 8, 8, TARGET[2] + 9); scene.add(f); riverGlow(scene, 0x5cff5c, 0.8); },
  camera: (W, H) => persp(W, H, 24, [-29.3, 0.35, 109.6], 50, 34, 18),
  late(cast, scene, cam, P) { pixelSprites(cast, scene, cam, P, 40); },
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [
    new T.BokehPass(scene, cam, { focus: 18.0, aperture: 0.00045, maxblur: 0.012, width: W, height: H }), bloom(W, H, 0.7, 0.55, 0.78), shader(T.VignetteShader, { offset: 1.0, darkness: 1.2 }),
  ]),
  overlay(g, P) {
    // the queue along the top: who acts now and who next
    const order = [['ELECTRO SKINK', '#ffe033', 'NOW'], ['TOXIC SOLDIER', '#ff4b4b', ''], ['JELLY RAM', '#00ccaa', ''], ['TOXIC WORKER', '#ff4b4b', ''], ['FIRE EGG', '#ff7a3d', ''], ['YOU', '#19e6c1', '']];
    const x0 = 430, y0 = 22; g.fillStyle = 'rgba(8,10,16,0.85)'; rrect(g, x0 - 16, y0 - 6, 760, 92, 14); g.fill();
    text(g, 'TURN QUEUE', x0 - 4, y0 + 18, { font: font('pixel', 18), fill: '#9fb4d8' });
    order.forEach((o, i) => { const x = x0 + i * 122, y = y0 + 28, big = i === 0; g.fillStyle = big ? o[1] : 'rgba(255,255,255,0.08)'; rrect(g, x, y, 112, 48, 8); g.fill(); g.lineWidth = 3; g.strokeStyle = o[1]; g.stroke();
      text(g, o[0], x + 56, y + 21, { font: font('pixel', o[0].length > 10 ? 13 : 16), fill: big ? '#111' : '#fff', align: 'center' }); text(g, big ? '▶ ACTING' : (i + 1) + '', x + 56, y + 41, { font: font('pixel', 14), fill: big ? '#111' : 'rgba(255,255,255,0.7)', align: 'center' }); });
    // each unit's gauge under it, pixel style
    const gauges = { player: 0.35, ram: 0.8, skink: 1, egg: 0.5, ant_a: 0.92, ant_b: 0.6, ant_c: 0.2 };
    for (const u of allUnits()) { const p = P.project(u.at[0], 0, u.at[1]); bar(g, p[0] - 34, p[1] + 16, 68, 8, gauges[u.key], u.key.startsWith('ant') ? '#ff4b4b' : '#5cf0ff'); }
    const s = head(P, P.CAST.skink.at, 1.1); pill(g, s[0] - 120, s[1] - 70, 240, 44, 'rgba(255,224,51,0.95)', '#111'); text(g, 'SPARK BOLT ▶ WORKER', s[0], s[1] - 40, { font: font('pixel', 19), fill: '#111', align: 'center' });
    text(g, 'everyone else holds still until the bolt lands', P.W - 30, 140, { font: font('ui', 18), fill: 'rgba(230,240,255,0.85)', align: 'right', stroke: 'rgba(0,0,0,0.6)', sw: 4 });
    caption(g, P, '2', 'PIXEL SQUAD, 3D WORLD', 'pixel-sprite creatures in a lit 3D world, depth of field', 'TURN QUEUE: gauges fill, one unit acts at a time');
  },
});

// ═════════ 3. INK TOON ═════════ cel-shaded 3D with thick ink outlines and flat bright colours (the game's own bold-outline look, in real 3D);
// the fight with TELEGRAPHS: a creature's attack marks the floor first, a red shape that fills up, and you have a beat to get out of it
style('toon', {
  exposure: 1.0, studio: false, toneMapping: T.NoToneMapping,
  palette: () => { const G = GRAD3(), tm = (c, o) => new T.MeshToonMaterial(Object.assign({ color: c, gradientMap: G }, o)), P = basePalette();
    const kerb = STRIPES('#ffd21f', '#111111'); kerb.repeat.set(40, 1);
    return linearPalette(Object.assign(P, { G, floor: tm(0x4a6370, { map: tex(64, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.strokeStyle = '#a9bcc6'; g.lineWidth = 3; g.strokeRect(1, 1, w - 2, h - 2); g.strokeRect(1, 1, w - 2, h / 2 - 1); }) }),
      wallMats: boxMats(tm(0xffffff, { map: tex(64, 106, (g, w, h) => { g.fillStyle = '#4a5f6b'; g.fillRect(0, 0, w, h); g.fillStyle = '#2b3942'; g.fillRect(0, h - 22, w, 22); g.fillStyle = '#7cff4f'; g.fillRect(0, h - 26, w, 4); g.fillStyle = '#1d262c'; g.fillRect(0, 0, w, 8); g.fillStyle = '#33444f'; g.fillRect(0, 0, 3, h); }) }), tm(0x1b2228)),
      cutMats: boxMats(tm(0x253039), tm(0x1b2228)), water: tm(0x47e04a, { emissive: 0x1d7a1f, emissiveIntensity: 0.6 }), bed: tm(0x0c2a0e), bank: tm(0x2b3942),
      kerb: tm(0xffffff, { map: kerb }), grating: tm(0x56636f), rail: tm(0xffa62b), bar: tm(0x9fb2c4), gateRail: tm(0xb6c8d8), lock: tm(0xffc42b), rock: tm(0xa77b52, { flatShading: true }),
      machine: tm(0x5a6c78), pipe: tm(0x6b7f8c), puddle: tm(0x2b3942), egg: tm(0xd9ffcf, { emissive: 0x5cff5c, emissiveIntensity: 0.3 }), lampLight: { color: 0xdff6ff, intensity: 0.9, distance: 4 } })); },
  env(scene) { scene.background = new T.Color(0x14232c); },
  cast(cast, scene, P) { for (const k in cast.parts) toonMats(cast.parts[k], P.G); },
  lights(scene) { scene.add(new T.HemisphereLight(0xffffff, 0x445566, 0.55)); keyLight(scene, 0xffffff, 0.85, [-5, 12, 4], TARGET, 10); },
  camera: (W, H) => iso(W, H, 14.5, [-29.4, 0.3, 109.7], 33),
  decals(scene) { const A = FOES[0].at, R = CAST.ram.at, ang = Math.atan2(R[1] - A[1], R[0] - A[0]), cone = (len, wid) => { const pts = [A]; for (let i = 0; i <= 16; i++) { const t = ang - wid + 2 * wid * i / 16; pts.push([A[0] + Math.cos(t) * len, A[1] + Math.sin(t) * len]); } return pts; };
    decalPoly(scene, cone(1.9, 0.6), 0xff2828, 0.28); decalPoly(scene, cone(1.18, 0.6), 0xff2828, 0.5); const edge = cone(1.9, 0.6); decalLine(scene, edge.concat([A]), 0.05, 0xff3c3c, 1);
    const E = CAST.egg.at; decalDisc(scene, E, 0.78, 0xff2828, 0.22); decalDisc(scene, E, 0.4, 0xff2828, 0.45); for (let i = 0; i < 12; i++) decalRing(scene, E, 0.78, 0.05, 0xff4646, 1, i / 12, i / 12 + 0.05); },
  compose(renderer, scene, cam) { const e = new T.OutlineEffect(renderer, { defaultThickness: 0.0065, defaultColor: [0.02, 0.03, 0.05] }); return () => e.render(scene, cam); },
  overlay(g, P) {
    const A = P.FOES[0].at, R = P.CAST.ram.at, ang = Math.atan2(R[1] - A[1], R[0] - A[0]), E = P.CAST.egg.at;
    const pa = P.project(A[0] + Math.cos(ang) * 1.2, 0.05, A[1] + Math.sin(ang) * 1.2); bigNumber(g, '2', pa[0], pa[1] + 14, 46, '#ffefef', '#7a0000');
    const pe = P.project(E[0], 0.05, E[1] + 0.9); bigNumber(g, '1', pe[0], pe[1] + 18, 46, '#ffefef', '#7a0000');
    const hr = head(P, R, 1.25); pill(g, hr[0] - 80, hr[1] - 36, 160, 40, '#ffd21f', '#111'); text(g, 'STEP OUT!', hr[0], hr[1] - 8, { font: font('bang', 30), fill: '#111', align: 'center' });
    pill(g, 28, 26, 400, 56, 'rgba(20,10,10,0.85)', '#ff5050'); text(g, '⚠ RED ON THE FLOOR = INCOMING', 46, 64, { font: font('bang', 30), fill: '#ffdede' });
    caption(g, P, '3', 'INK TOON', 'cel-shaded 3D, thick ink outlines, flat bright colour', 'TELEGRAPHS: attacks paint the floor and count down first');
  },
});

// ═════════ 4. LOW-POLY TACTICS ═════════ crisp flat-shaded low-poly 3D, a light clean palette, the tile grid shown on the floor;
// the fight TURN BY TURN ON THE GRID: your unit's moves in blue, its reach in red, action points to spend, then the creatures move
style('lowpoly', {
  exposure: 1.0, studio: false, toneMapping: T.NoToneMapping,
  palette: () => { const P = basePalette(), L = (c, o) => new T.MeshLambertMaterial(Object.assign({ color: c, flatShading: true }, o));
    return linearPalette(Object.assign(P, { floor: L(0xffffff, { map: tex(32, 32, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(40,60,80,0.35)'; g.lineWidth = 2; g.strokeRect(0, 0, w, h); }) }),
      floorTint: (c, col) => { const v = ((c[0] * 7 + c[1] * 13) % 5) / 60; col.setRGB(0.46 + v, 0.53 + v, 0.6 + v).convertSRGBToLinear(); },
      wallMats: boxMats(L(0x7b8a99), L(0x3d4752)), cutMats: boxMats(L(0x56626e), L(0x3d4752)), water: L(0x22b39c, { emissive: 0x0b3a33 }), bed: L(0x0f3c38), bank: L(0x6d7b88),
      kerb: L(0xffcf3a), grating: L(0x7d8a96), rail: L(0xff9f43), bar: L(0x5d6d7e), gateRail: L(0x5d6d7e), lock: L(0xffb400), rock: L(0xc29a6b), machine: L(0x7f8fa0), pipe: L(0x6f8191), puddle: L(0x4e6070), egg: L(0xe6ffd8), lampLight: null })); },
  env(scene) { scene.background = new T.Color(0x1b2733); },
  cast(cast) { for (const k in cast.parts) flatMats(cast.parts[k], k.startsWith('ant') ? 0.12 : 0.05); },
  lights(scene) { scene.add(new T.HemisphereLight(0xffffff, 0x4a5868, 0.6)); keyLight(scene, 0xfff4e0, 0.75, [-6, 14, -4], TARGET, 11); },
  camera: (W, H) => iso(W, H, 15, [-29.2, 0.2, 109.9], 40),
  decals(scene) { const S = CAST.skink.at, tile = (x, y, col, op) => { decalPoly(scene, [[x - 0.46, y - 0.46], [x + 0.46, y - 0.46], [x + 0.46, y + 0.46], [x - 0.46, y + 0.46]], col, op); decalLine(scene, [[x - 0.46, y - 0.46], [x + 0.46, y - 0.46], [x + 0.46, y + 0.46], [x - 0.46, y + 0.46], [x - 0.46, y - 0.46]], 0.035, col, 1); };
    const occupied = new Set(allUnits().map(u => Math.round(u.at[0]) + ',' + Math.round(u.at[1])));
    for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) { const x = Math.round(S[0]) + dx, y = Math.round(S[1]) + dy; if (Math.abs(dx) + Math.abs(dy) > 3 || y > 110 || y < 108 || occupied.has(x + ',' + y)) continue; tile(x, y, 0x3c96ff, 0.4); }
    for (const f of FOES) tile(Math.round(f.at[0]), Math.round(f.at[1]), 0xff3c3c, 0.42);
    decalLine(scene, [S, [-29, 109], [-28, 109]], 0.07, 0x7cc4ff, 0.95); },
  overlay(g, P) {
    pill(g, 28, 26, 470, 60, 'rgba(18,40,70,0.92)', '#7cc4ff'); text(g, 'YOUR TURN · ELECTRO SKINK', 50, 66, { font: font('chakra', 28), fill: '#e6f3ff' });
    text(g, 'AP', 520, 66, { font: font('chakra', 26), fill: '#9fd0ff' }); for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(570 + i * 34, 57, 12, 0, 7); g.fillStyle = i < 3 ? '#5cf0ff' : 'rgba(255,255,255,0.15)'; g.fill(); }
    for (const [f, s] of [[P.FOES[0], 'BITE 18'], [P.FOES[1], 'SPIT 9'], [P.FOES[2], 'MOVE']]) { const h = head(P, f.at, 1.0); pill(g, h[0] - 62, h[1] - 40, 124, 34, 'rgba(70,10,10,0.9)', '#ff6b6b'); text(g, s, h[0], h[1] - 15, { font: font('chakra', 20), fill: '#ffd0d0', align: 'center' }); }
    caption(g, P, '4', 'LOW-POLY TACTICS', 'flat-shaded low-poly 3D, clean colours, the grid on the floor', 'TURN-BASED ON THE GRID: move, reach, action points');
  },
});

// ═════════ 5. VOXEL LAB ═════════ the facility and every creature built of little cubes, soft light, chunky and clear at a glance;
// the fight with PAUSE AND PLAN: real time, but a tap pauses everything; you draw each member's order, then let it run
style('voxel', {
  exposure: 1.1,
  palette: () => { const P = basePalette(), V = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.85, metalness: 0.05 }, o)), vox = (a, b) => tex(16, 16, (g, w, h) => { for (let y = 0; y < h; y += 4) for (let x = 0; x < w; x += 4) { g.fillStyle = ((x + y * 3) / 4) % 3 === 0 ? b : a; g.fillRect(x, y, 4, 4); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(x, y + 3, 4, 1); g.fillRect(x + 3, y, 1, 4); } }, { nearest: true });
    return Object.assign(P, { floor: V(0xffffff, { map: vox('#59636b', '#4f585f') }), wallMats: boxMats(V(0xffffff, { map: tex(16, 27, (g, w, h) => { for (let y = 0; y < h; y += 3) for (let x = 0; x < w; x += 4) { g.fillStyle = (x + y) % 7 === 0 ? '#3d4a50' : '#45535a'; g.fillRect(x, y, 4, 3); } g.fillStyle = '#62ff46'; g.fillRect(0, h - 6, w, 2); g.fillStyle = '#25302f'; g.fillRect(0, h - 4, w, 4); }, { nearest: true }) }), V(0x22292c)),
      cutMats: boxMats(V(0x2a3235), V(0x22292c)), water: V(0x2a9e4a, { emissive: 0x0f5a22, emissiveIntensity: 0.5, map: vox('#7be89a', '#5fd17f') }), kerb: V(0xffffff, { map: tex(16, 4, (g) => { for (let x = 0; x < 16; x += 4) { g.fillStyle = (x / 4) % 2 ? '#111' : '#f0c020'; g.fillRect(x, 0, 4, 4); } }, { nearest: true, repeat: true }) }),
      rock: V(0x8a6a4c, { flatShading: true }), lampLight: { color: 0xcff4ff, intensity: 1.0, distance: 4.5 } }); },
  env(scene) { scene.background = new T.Color(0x0d1216); },   // (no fog: the square-on camera stands 40 away)
  cast(cast, scene) { for (const k in cast.parts) voxelize(cast.parts[k], 0.065, cast.g); },
  fx(fx) { fx.g.traverse(o => { if (o.isMesh && o.geometry.type === 'TubeGeometry') o.visible = false; }); const b = fx.parts.boltAt; for (let i = 0; i < 9; i++) { const c = new T.Mesh(new T.BoxGeometry(0.09, 0.09, 0.09), new T.MeshBasicMaterial({ color: 0xfff27a, toneMapped: false })); c.position.set(b.x - 0.32 * i, b.y + Math.sin(i * 1.7) * 0.06, b.z + (i % 2 ? 0.05 : -0.05)); fx.g.add(c); } },
  lights(scene) { scene.add(new T.HemisphereLight(0xcfe0ff, 0x1a1f1a, 0.5)); keyLight(scene, 0xfff0d8, 1.1, [-7, 13, -3], TARGET, 10); const f = new T.DirectionalLight(0x9fc4ff, 0.5); f.position.set(TARGET[0] + 8, 9, TARGET[2] + 10); scene.add(f); riverGlow(scene, 0x5cff5c, 0.6); },
  camera: (W, H) => iso(W, H, 13.5, [-29.4, 0.3, 109.6], 34),
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [bloom(W, H, 0.45, 0.4, 0.85)]),
  overlay(g, P) {
    g.fillStyle = 'rgba(10,20,40,0.28)'; g.fillRect(0, 0, P.W, P.H);
    const arrow = (a, b, col, n) => { const p = P.project(a[0], 0.06, a[1]), q = P.project(b[0], 0.06, b[1]); g.save(); g.strokeStyle = col; g.lineWidth = 7; g.setLineDash([16, 10]); g.lineCap = 'round'; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.setLineDash([]);
      const an = Math.atan2(q[1] - p[1], q[0] - p[0]); g.fillStyle = col; g.beginPath(); g.moveTo(q[0] + Math.cos(an) * 14, q[1] + Math.sin(an) * 14); g.lineTo(q[0] + Math.cos(an + 2.5) * 22, q[1] + Math.sin(an + 2.5) * 22); g.lineTo(q[0] + Math.cos(an - 2.5) * 22, q[1] + Math.sin(an - 2.5) * 22); g.closePath(); g.fill();
      g.beginPath(); g.arc(p[0], p[1] - 70, 20, 0, 7); g.fillStyle = col; g.fill(); text(g, n, p[0], p[1] - 61, { font: font('chakra', 24), fill: '#111', align: 'center' }); g.restore(); };
    arrow(P.CAST.ram.at, P.FOES[0].at, '#3dffd9', '1'); arrow(P.CAST.skink.at, P.FOES[1].at, '#ffe033', '2'); arrow(P.CAST.egg.at, [-30.5, 108.3], '#ff9a5a', '3'); arrow(P.CAST.player.at, [-29.6, 108.2], '#19e6c1', '4');
    pill(g, P.W / 2 - 210, 24, 420, 66, 'rgba(8,14,24,0.92)', '#8fd3ff'); text(g, '❚❚  PAUSED · PLAN', P.W / 2, 70, { font: font('chakra', 36), fill: '#dff3ff', align: 'center' });
    pill(g, P.W - 260, P.H - 120, 220, 70, '#3dffd9', '#0b1a1a'); text(g, 'GO  ▶', P.W - 150, P.H - 73, { font: font('chakra', 34), fill: '#062020', align: 'center' });
    text(g, 'orders drawn, time stopped: tap GO and watch them carry out', P.W - 30, 140, { font: font('ui', 18), fill: 'rgba(230,240,255,0.9)', align: 'right', stroke: 'rgba(0,0,0,0.6)', sw: 4 });
    caption(g, P, '5', 'VOXEL LAB', 'everything built of small cubes, soft light, chunky and clear', 'PAUSE AND PLAN: stop time, draw orders, let it run');
  },
});

// ═════════ 6. HOLO-TACTICAL ═════════ the facility as a dark holographic plan in glowing lines, the squad in cyan light, the creatures in red;
// the fight with INTENT AND THREAT: every creature shows what it will do next, to whom and for how much, and every line of attack is drawn
style('holo', {
  exposure: 1.0, studio: false, shadows: false,
  palette: () => { const P = basePalette(), line = new T.LineBasicMaterial({ color: 0x3fd8ff, transparent: true, opacity: 0.55 }), B = (c, o) => new T.MeshBasicMaterial(Object.assign({ color: c }, o));
    return Object.assign(P, { line, floor: B(0xffffff, { map: tex(64, 64, (g, w, h) => { g.fillStyle = '#04121c'; g.fillRect(0, 0, w, h); g.strokeStyle = 'rgba(60,200,255,0.45)'; g.lineWidth = 2; g.strokeRect(1, 1, w - 2, h - 2); g.fillStyle = 'rgba(60,200,255,0.5)'; g.fillRect(w / 2 - 1, h / 2 - 1, 2, 2); }) }),
      wallMats: boxMats(B(0x0b2a3b, { transparent: true, opacity: 0.55 }), B(0x0e3c52, { transparent: true, opacity: 0.8 })), cutMats: boxMats(B(0x082232), B(0x0b2f42)),
      water: B(0x07303a, { transparent: true, opacity: 0.9 }), bed: B(0x020a0e), bank: B(0x0b2a3b), kerb: B(0x1a6b80), grating: B(0x1d5b70), rail: B(0x3fd8ff), bar: B(0x3fd8ff), gateRail: B(0x3fd8ff), lock: B(0x3fd8ff), rock: B(0x154a5c, { wireframe: true }), machine: B(0x0f4157), pipe: B(0x13506a), puddle: B(0x05202c), egg: B(0xff5a5a), hole: B(0x000000), lampOn: B(0x9fe8ff), lampLight: null }); },
  env(scene) { scene.background = new T.Color(0x01070c); scene.fog = new T.Fog(0x01070c, 38, 58); },   // (the square-on camera stands 40 away)
  world(P) { const g = buildWorld(P); const tall = solidCells.filter(c => north(c[1])), edges = [];
    for (const c of tall) for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) { if (room.has((c[0] + dx) + ',' + (c[1] + dy)) || inBand(c[0] + dx, c[1] + dy)) { const x = c[0] + dx * 0.5, y = c[1] + dy * 0.5, ox = dy ? 0.5 : 0, oy = dx ? 0.5 : 0; for (const h of [0, WALL_H]) edges.push(x - ox, h, y - oy, x + ox, h, y + oy); edges.push(x - ox, 0, y - oy, x - ox, WALL_H, y - oy); } }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(edges, 3)); g.add(new T.LineSegments(geo, new T.LineBasicMaterial({ color: 0x5fe4ff, transparent: true, opacity: 0.9 }))); return g; },
  cast(cast) { for (const k in cast.parts) { holoMats(cast.parts[k], k.startsWith('ant') ? 0xff2a2a : 0x39f3ff, k.startsWith('ant') ? 0.2 : 0.55); const fill = cast.parts[k].clone(); remat(fill, () => new T.MeshBasicMaterial({ color: k.startsWith('ant') ? 0x5a0808 : 0x063c48, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false })); cast.g.add(fill); } },
  lights() {},
  camera: (W, H) => iso(W, H, 14, [-29.4, 0.3, 109.6], 36),
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [bloom(W, H, 0.85, 0.5, 0.2)]),
  overlay(g, P) {
    const tgt = { a: P.CAST.ram, b: P.CAST.egg, c: P.CAST.player }, what = { a: ['BITE', '18', 'in 0.6 s'], b: ['SPIT', '9', 'in 1.1 s'], c: ['CHARGE', '12', 'in 2.4 s'] };
    for (const f of P.FOES) { const t = tgt[f.id], p = P.project(f.at[0], 0.45, f.at[1]), q = P.project(t.at[0], 0.45, t.at[1]); g.save(); g.strokeStyle = 'rgba(255,70,70,0.95)'; g.lineWidth = 4; g.setLineDash([10, 8]); g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo((p[0] + q[0]) / 2, Math.min(p[1], q[1]) - 60, q[0], q[1]); g.stroke(); g.restore();
      const h = head(P, f.at, 1.05), w = what[f.id]; g.fillStyle = 'rgba(40,0,0,0.88)'; rrect(g, h[0] - 74, h[1] - 72, 148, 62, 8); g.fill(); g.strokeStyle = '#ff5050'; g.lineWidth = 2; g.stroke();
      text(g, w[0] + ' ' + w[1], h[0], h[1] - 44, { font: font('chakra', 24), fill: '#ffb0b0', align: 'center' }); text(g, '→ ' + t.name + '  ' + w[2], h[0], h[1] - 20, { font: font('ui', 13), fill: '#ff8080', align: 'center' }); }
    const mine = [[P.CAST.ram, P.FOES[0]], [P.CAST.skink, P.FOES[1]]];
    for (const [a, b] of mine) { const p = P.project(a.at[0], 0.45, a.at[1]), q = P.project(b.at[0], 0.45, b.at[1]); g.save(); g.strokeStyle = 'rgba(60,240,255,0.95)'; g.lineWidth = 3; g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); g.stroke(); g.restore(); }
    g.fillStyle = 'rgba(2,14,22,0.9)'; rrect(g, P.W - 400, 26, 372, 250, 12); g.fill(); g.strokeStyle = '#3fd8ff'; g.lineWidth = 2; g.stroke();
    text(g, 'NEXT 3 SECONDS', P.W - 380, 62, { font: font('chakra', 24), fill: '#9fefff' });
    [['0.6 s', 'SOLDIER bites RAM', '−18', '#ff8080'], ['0.9 s', 'SKINK bolt hits WORKER', '−26', '#9fefff'], ['1.1 s', 'WORKER spits at EGG', '−9', '#ff8080'], ['1.4 s', 'RAM rams SOLDIER', '−42', '#9fefff'], ['2.4 s', 'WORKER charges YOU', '−12', '#ff8080']].forEach((r, i) => { const y = 100 + i * 34; text(g, r[0], P.W - 380, y, { font: font('ui', 16), fill: 'rgba(200,230,255,0.7)' }); text(g, r[1], P.W - 315, y, { font: font('ui', 16), fill: r[3] }); text(g, r[2], P.W - 46, y, { font: font('ui', 17), fill: r[3], align: 'right' }); });
    caption(g, P, '6', 'HOLO-TACTICAL', 'the facility as a glowing hologram, squad cyan, creatures red', 'INTENT AND THREAT: every creature shows its next move');
  },
});

// ═════════ 7. BATTLE STAGE ═════════ explore as now; when a fight starts the camera drops to a close, low 3D battle view across the bank, lit like a stage;
// the fight by COMMAND MENU: choose each member's move (attack, skill, Ultimate, item, guard) and the round plays out in order
style('stage', {
  exposure: 1.15,
  palette: () => { const P = basePalette(); P.lampLight = { color: 0xbfefff, intensity: 1.2, distance: 5 }; return P; },
  env(scene) { scene.background = new T.Color(0x05070b); scene.fog = new T.Fog(0x05070b, 9, 20); },
  lights(scene) { scene.add(new T.HemisphereLight(0x9fb4c8, 0x101410, 0.45)); keyLight(scene, 0xffe0c0, 1.6, [-4, 9, 6], [-29.2, 0, 109.4], 7);
    const rimA = new T.SpotLight(0x39f3ff, 4, 9, 0.6, 0.6, 1.5); rimA.position.set(-33.5, 3.5, 107.6); rimA.target.position.set(-30.5, 0.4, 109.6); scene.add(rimA); scene.add(rimA.target);
    const rimB = new T.SpotLight(0xff4040, 4, 9, 0.6, 0.6, 1.5); rimB.position.set(-24, 3.5, 107.4); rimB.target.position.set(-26.5, 0.4, 109.2); scene.add(rimB); scene.add(rimB.target); riverGlow(scene, 0x5cff5c, 0.9); },
  camera: (W, H) => persp(W, H, 36, [-29.6, 0.55, 109.3], 96, 14, 10.2),
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [new T.BokehPass(scene, cam, { focus: 10.2, aperture: 0.0008, maxblur: 0.01, width: W, height: H }), bloom(W, H, 0.6, 0.5, 0.8), shader(T.VignetteShader, { offset: 1.0, darkness: 1.3 })]),
  overlay(g, P) {
    g.fillStyle = '#000'; g.fillRect(0, 0, P.W, 56); g.fillRect(0, P.H - 56, P.W, 56);
    const menu = [['FIGHT', ''], ['SPARK BOLT', '2 ⚡'], ['LIGHTNING CIRCUIT', 'ULT'], ['ITEM', ''], ['GUARD', '']], mx = 60, my = P.H - 330;
    g.fillStyle = 'rgba(10,14,30,0.92)'; rrect(g, mx - 20, my - 60, 420, 330, 16); g.fill(); g.strokeStyle = '#ffe033'; g.lineWidth = 3; g.stroke();
    text(g, 'ELECTRO SKINK', mx, my - 18, { font: font('title', 30), fill: '#ffe033' });
    menu.forEach((m, i) => { const y = my + 24 + i * 50, on = i === 1; if (on) { g.fillStyle = 'rgba(255,224,51,0.25)'; rrect(g, mx - 8, y - 32, 392, 44, 10); g.fill(); text(g, '▶', mx - 2, y, { font: font('title', 26), fill: '#ffe033' }); } text(g, m[0], mx + 32, y, { font: font('title', 26), fill: on ? '#fff' : '#c9d3ea' }); if (m[1]) text(g, m[1], mx + 372, y, { font: font('title', 22), fill: m[1] === 'ULT' ? '#ff6bd6' : '#ffe033', align: 'right' }); });
    const party = [['YOU', 0.82, '#19e6c1'], ['JELLY RAM', 0.64, '#00ccaa'], ['ELECTRO SKINK', 0.9, '#ffe033'], ['FIRE EGG', 0.48, '#ff7a3d']], px = P.W - 520, py = P.H - 330;
    g.fillStyle = 'rgba(10,14,30,0.92)'; rrect(g, px - 20, py - 40, 500, 290, 16); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 2; g.stroke();
    party.forEach((m, i) => { const y = py + i * 60; text(g, m[0], px, y + 12, { font: font('title', 22), fill: m[2] }); bar(g, px + 220, y - 6, 230, 16, m[1], m[1] < 0.5 ? '#ffb02e' : '#4cff7a'); text(g, Math.round(m[1] * 120) + ' / 120', px + 450, y + 34, { font: font('ui', 15), fill: '#aab6d0', align: 'right' }); });
    const t = head(P, P.FOES[1].at, 1.05); g.fillStyle = '#ffe033'; g.beginPath(); g.moveTo(t[0], t[1]); g.lineTo(t[0] - 22, t[1] - 34); g.lineTo(t[0] + 22, t[1] - 34); g.closePath(); g.fill(); g.lineWidth = 3; g.strokeStyle = '#111'; g.stroke();
    const order = ['SKINK', 'SOLDIER', 'RAM', 'WORKER', 'EGG', 'YOU']; order.forEach((o, i) => { const x = P.W - 700 + i * 112; pill(g, x, 72, 104, 36, i ? 'rgba(20,24,40,0.85)' : '#ffe033', i === 1 || i === 3 ? '#ff6b6b' : '#7cc4ff'); text(g, o, x + 52, 97, { font: font('ui', 16), fill: i ? '#dfe6f5' : '#111', align: 'center' }); });
    caption(g, P, '7', 'BATTLE STAGE', 'a close, low 3D battle camera when a fight starts, stage lighting', 'COMMAND MENU: choose every move, the round plays in order', true);
  },
});

// ═════════ 8. NOIR LIGHT ═════════ a dark facility lit only by its lamps, the squad's own lights and the glowing river; beams in the haze, creatures in the shadows;
// the fight with SPOTLIGHT AND HIT-STOP: whoever acts is lit and everyone else dims, and every blow freezes for a beat with its number big on the screen
style('noir', {
  exposure: 1.25,
  palette: () => { const P = basePalette(); P.lampLight = { color: 0xffd9a0, intensity: 3.0, distance: 6 }; P.water.emissiveIntensity = 0.55; return P; },
  env(scene) { scene.background = new T.Color(0x010203); scene.fog = new T.FogExp2(0x020406, 0.04); },
  decals(scene) { decalRing(scene, CAST.ram.at, 0.62, 0.08, 0xa0fff0, 0.95); decalRing(scene, CAST.ram.at, 0.78, 0.04, 0xa0fff0, 0.45); },
  lights(scene) { scene.add(new T.HemisphereLight(0x223040, 0x000000, 0.12));
    const sp = new T.SpotLight(0xe8f4ff, 16, 14, 0.45, 0.45, 1.0); sp.position.set(-30.9, 1.15, 109.35); sp.target.position.set(-27.0, 0, 108.8); sp.castShadow = true; sp.shadow.mapSize.set(2048, 2048); scene.add(sp); scene.add(sp.target);
    const beam = new T.Mesh(new T.ConeGeometry(1.7, 4.2, 32, 1, true), new T.MeshBasicMaterial({ color: 0xcfe8ff, transparent: true, opacity: 0.09, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide })); beam.position.set(-28.9, 0.6, 109.05); beam.rotation.z = Math.PI / 2 + 0.12; beam.rotation.y = -0.1; scene.add(beam);
    const red = new T.PointLight(0xff2a2a, 2.2, 6, 2); red.position.set(-25.5, 1.4, 107.7); scene.add(red); riverGlow(scene, 0x5cff5c, 1.0); },
  camera: (W, H) => persp(W, H, 28, [-29.3, 0.35, 109.5], 58, 36, 15.5),
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [bloom(W, H, 0.9, 0.6, 0.6), new T.FilmPass(0.35, 0.0, 0, false), shader(T.VignetteShader, { offset: 1.15, darkness: 1.6 })]),
  overlay(g, P) {
    const c = P.project(P.fx.sparkAt.x, P.fx.sparkAt.y, P.fx.sparkAt.z), gr = g.createRadialGradient(c[0], c[1], 120, c[0], c[1], 760); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.42)'); g.fillStyle = gr; g.fillRect(0, 0, P.W, P.H);
    g.save(); g.strokeStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, r0 = 120 + (i % 3) * 14, r1 = 190 + (i % 4) * 30; g.lineWidth = 2 + (i % 3); g.beginPath(); g.moveTo(c[0] + Math.cos(a) * r0, c[1] + Math.sin(a) * r0); g.lineTo(c[0] + Math.cos(a) * r1, c[1] + Math.sin(a) * r1); g.stroke(); } g.restore();
    bigNumber(g, '42', c[0] + 10, c[1] - 120, 120, '#ffffff', '#00b8a0');
    pill(g, 28, 26, 330, 56, 'rgba(255,255,255,0.92)', '#000'); text(g, 'HIT-STOP · 0.25 s', 50, 64, { font: font('cond', 34), fill: '#000' });
    text(g, 'JELLY RAM RAMS THE SOLDIER', P.W - 30, 70, { font: font('cond', 44), fill: '#e8fffb', align: 'right', stroke: 'rgba(0,0,0,0.8)', sw: 8 });
    caption(g, P, '8', 'NOIR LIGHT', 'a dark 3D facility lit by lamps, beams and the river', 'SPOTLIGHT AND HIT-STOP: one action lit, each blow freezes');
  },
});

// ═════════ 9. TABLETOP ═════════ painted miniatures on round bases on a game board of the map, a warm lamp over the table, shallow focus;
// the fight by CARDS: each round you play cards from a hand (the game's own energy and combat cards) to act, in the order of an initiative track
style('table', {
  exposure: 1.1,
  palette: () => { const P = basePalette(), S = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.8, metalness: 0.02 }, o));
    return Object.assign(P, { floor: S(0xffffff, { map: tex(64, 64, (g, w, h) => { g.fillStyle = '#8a9198'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(0, h - 4, w, 4); g.fillRect(w - 4, 0, 4, h); g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(40,40,40,0.15)'; g.fillRect((i * 37) % w, (i * 23) % h, 3, 2); } }) }),
      floorTint: (c, col) => { const v = ((c[0] * 5 + c[1] * 11) % 7) / 50; col.setRGB(0.85 + v, 0.85 + v, 0.82 + v); },
      board: [-36.5, 104.5, -21.5, 116.5], wallMats: boxMats(S(0x6c7176), S(0x4a5a3c)), cutMats: boxMats(S(0x5a5f63), S(0x4a5a3c)), water: S(0x1f8a3a, { roughness: 0.05, metalness: 0.3, emissive: 0x0d4a1c, emissiveIntensity: 0.5 }), bank: S(0x5a5f63), rock: S(0x9a7a5a, { flatShading: true }), lampLight: { color: 0xffe2b0, intensity: 0.8, distance: 3 } }); },
  env(scene) { scene.background = new T.Color(0x140c06);
    const wood = new T.Mesh(new T.PlaneGeometry(80, 60), new T.MeshStandardMaterial({ map: tex(512, 512, (g, w, h) => { g.fillStyle = '#5a3a1e'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 2) { g.fillStyle = 'rgba(' + (30 + (y * 7) % 40) + ',' + (15 + (y * 3) % 20) + ',5,0.25)'; g.fillRect(0, y, w, 1 + (y % 5 === 0)); } }, { repeat: true }), roughness: 0.6 }));
    wood.material.map.repeat.set(4, 3); wood.rotation.x = -Math.PI / 2; wood.position.set(-29, -0.32, 112); wood.receiveShadow = true; scene.add(wood); },
  world(P) { const g = buildWorld(P); g.traverse(o => { if (o.isInstancedMesh && o === SC.floor) { const m4 = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), p = new T.Vector3(); for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m4); m4.decompose(p, q, s); s.set(0.93, 0.2, 0.93); p.y = -0.1; m4.compose(p, q, s); o.setMatrixAt(i, m4); } } }); return g; },
  cast(cast) { for (const u of allUnits()) { const o = cast.parts[u.key]; clayMats(o); const base = new T.Group(), disc = new T.Mesh(new T.CylinderGeometry(0.4, 0.43, 0.07, 40), new T.MeshStandardMaterial({ color: 0x15171a, roughness: 0.5 })), rim = new T.Mesh(new T.TorusGeometry(0.415, 0.022, 8, 48), new T.MeshStandardMaterial({ color: teamColour(u.key), emissive: teamColour(u.key), emissiveIntensity: 0.25, roughness: 0.4 }));
    disc.position.y = 0.035; rim.rotation.x = Math.PI / 2; rim.position.y = 0.06; disc.castShadow = true; disc.receiveShadow = true; base.add(disc); base.add(rim); base.position.set(u.at[0], 0, u.at[1]); cast.g.add(base); o.position.y += 0.07; } },
  lights(scene) { scene.add(new T.HemisphereLight(0xffe8cc, 0x2a1a0a, 0.5)); const lamp = new T.SpotLight(0xffe2b8, 2.6, 40, 0.65, 0.5, 1.0); lamp.position.set(-31, 13, 106); lamp.target.position.set(-29.3, 0, 109.8); lamp.castShadow = true; lamp.shadow.mapSize.set(2048, 2048); scene.add(lamp); scene.add(lamp.target); },
  camera: (W, H) => persp(W, H, 30, [-29.2, 0.2, 110.4], 62, 47, 17),
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [new T.BokehPass(scene, cam, { focus: 16.8, aperture: 0.0016, maxblur: 0.014, width: W, height: H }), shader(T.VignetteShader, { offset: 1.0, darkness: 1.1 })]),
  overlay(g, P) {
    const cards = [['SPARK BOLT', '2', '#ffe033', 'Deal 26 to one'], ['RAM', '3', '#00ccaa', 'Charge, knock back'], ['GUARD', '1', '#9fb4d8', 'Take hits for an ally'], ['MEND', '2', '#7cff8a', 'Heal 20'], ['LIGHTNING CIRCUIT', '★', '#ff6bd6', 'Ultimate']];
    cards.forEach((c, i) => { const n = cards.length, a = (i - (n - 1) / 2) * 0.12, cx = P.W * 0.7 + (i - (n - 1) / 2) * 150, cy = P.H - 30 + Math.abs(i - (n - 1) / 2) * 16 - (i === 0 ? 46 : 0);
      g.save(); g.translate(cx, cy); g.rotate(a); g.fillStyle = '#f4ecdc'; rrect(g, -78, -230, 156, 228, 12); g.fill(); g.lineWidth = i === 0 ? 6 : 3; g.strokeStyle = i === 0 ? '#ffe033' : '#3a2c1c'; g.stroke();
      g.fillStyle = c[2]; rrect(g, -66, -218, 132, 92, 8); g.fill(); text(g, c[1], -56, -186, { font: font('title', 28), fill: '#111' });
      text(g, c[0], 0, -100, { font: font('title', c[0].length > 12 ? 13 : 18), fill: '#2a1e10', align: 'center' }); text(g, c[3], 0, -72, { font: font('ui', 12), fill: '#5a4630', align: 'center' }); g.restore(); });
    const track = [['SKINK', '#ffe033'], ['SOLDIER', '#ff4b4b'], ['RAM', '#00ccaa'], ['WORKER', '#ff4b4b'], ['EGG', '#ff7a3d'], ['YOU', '#19e6c1']];
    g.save(); g.translate(0, 230); g.fillStyle = 'rgba(30,20,10,0.88)'; rrect(g, 24, 24, 150, 440, 14); g.fill(); text(g, 'ROUND 2', 99, 58, { font: font('title', 22), fill: '#f4ecdc', align: 'center' });
    track.forEach((t, i) => { const y = 100 + i * 60; g.beginPath(); g.arc(70, y, 22, 0, 7); g.fillStyle = t[1]; g.fill(); g.lineWidth = i ? 2 : 5; g.strokeStyle = i ? '#000' : '#fff'; g.stroke(); text(g, t[0], 102, y + 6, { font: font('ui', 15), fill: '#f4ecdc' }); }); g.restore();
    text(g, 'ENERGY ⚡⚡⚡○', P.W - 30, 64, { font: font('title', 30), fill: '#ffe9a8', align: 'right', stroke: 'rgba(0,0,0,0.6)', sw: 6 });
    caption(g, P, '9', 'TABLETOP', 'painted miniatures on bases, the map as a game board', 'CARDS: play cards from a hand to act, in initiative order', true);
  },
});

// ═════════ 10. PAINTED ═════════ the 3D scene put through an oil-paint filter, warm and soft, an illustrated storybook;
// the fight HEAVY AND DELIBERATE: still real time, but every unit acts at most once every two seconds with a big readable wind-up, one shot in the air each
const KUWAHARA = { uniforms: { tDiffuse: { value: null }, res: { value: new T.Vector2(1, 1) }, radius: { value: 4 } }, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; uniform int radius; varying vec2 vUv;
  void main() { vec3 m[4]; vec3 s[4]; for (int k = 0; k < 4; k++) { m[k] = vec3(0.0); s[k] = vec3(0.0); }
    const int R = 6; float n = float((R + 1) * (R + 1));
    for (int j = -R; j <= 0; j++) for (int i = -R; i <= 0; i++) { vec3 c = texture2D(tDiffuse, vUv + vec2(i, j) / res).rgb; m[0] += c; s[0] += c * c; }
    for (int j = -R; j <= 0; j++) for (int i = 0; i <= R; i++) { vec3 c = texture2D(tDiffuse, vUv + vec2(i, j) / res).rgb; m[1] += c; s[1] += c * c; }
    for (int j = 0; j <= R; j++) for (int i = 0; i <= R; i++) { vec3 c = texture2D(tDiffuse, vUv + vec2(i, j) / res).rgb; m[2] += c; s[2] += c * c; }
    for (int j = 0; j <= R; j++) for (int i = -R; i <= 0; i++) { vec3 c = texture2D(tDiffuse, vUv + vec2(i, j) / res).rgb; m[3] += c; s[3] += c * c; }
    float best = 1e9; vec3 col = vec3(0.0);
    for (int k = 0; k < 4; k++) { vec3 mu = m[k] / n; vec3 v = abs(s[k] / n - mu * mu); float sv = v.r + v.g + v.b; if (sv < best) { best = sv; col = mu; } }
    gl_FragColor = vec4(col, 1.0); }` };
const PAPER = { uniforms: { tDiffuse: { value: null }, res: { value: new T.Vector2(1, 1) } }, vertexShader: KUWAHARA.vertexShader,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; varying vec2 vUv; float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() { vec3 c = texture2D(tDiffuse, vUv).rgb; vec2 q = vUv * res; float g = h(floor(q / 2.0)) * 0.06 - 0.03, weave = sin(q.x * 1.4) * sin(q.y * 1.4) * 0.03; c = mix(c, c * vec3(1.08, 1.0, 0.86), 0.8); gl_FragColor = vec4(c + g + weave, 1.0); }` };
style('painted', {
  exposure: 1.3,
  palette: () => { const P = basePalette(); P.water.color.set(0x1b6a2c); P.water.emissive.set(0x125a22); P.water.emissiveIntensity = 0.4; return P; },
  env(scene) { scene.background = new T.Color(0x10140f); scene.fog = new T.Fog(0x161a12, 14, 30); },
  lights(scene) { scene.add(new T.HemisphereLight(0xffe2c0, 0x1a2418, 0.55)); keyLight(scene, 0xffcf8a, 1.4, [-6, 13, -2], TARGET, 10); const f = new T.DirectionalLight(0xa0c0ff, 0.4); f.position.set(TARGET[0] + 8, 9, TARGET[2] + 10); scene.add(f); riverGlow(scene, 0x7cff6c, 0.3); },
  camera: (W, H) => persp(W, H, 27, [-29.4, 0.3, 109.6], 50, 38, 16.5),
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [shader(KUWAHARA, { res: new T.Vector2(W, H) }), shader(PAPER, { res: new T.Vector2(W, H) }), bloom(W, H, 0.35, 0.5, 0.85)]),
  overlay(g, P) {
    const a = P.project(P.CAST.ram.at[0], 0.6, P.CAST.ram.at[1]), b = P.project(P.FOES[0].at[0], 0.5, P.FOES[0].at[1]);
    g.save(); g.lineCap = 'round'; for (let i = 0; i < 6; i++) { g.strokeStyle = 'rgba(160,255,240,' + (0.15 + i * 0.12) + ')'; g.lineWidth = 26 - i * 4; g.beginPath(); g.moveTo(a[0] - 40, a[1] - 60); g.quadraticCurveTo((a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 150, b[0] + 10, b[1] - 20); g.stroke(); } g.restore();
    bigNumber(g, '42', b[0] + 60, b[1] - 90, 96, '#fff6dc', '#2a6b60');
    const s = head(P, P.FOES[1].at, 1.0); pill(g, s[0] - 110, s[1] - 50, 220, 40, 'rgba(60,20,10,0.85)', '#ffb08a'); text(g, 'winding up… 1.6 s', s[0], s[1] - 22, { font: font('ui', 19), fill: '#ffd8c0', align: 'center' });
    pill(g, 28, 26, 520, 56, 'rgba(30,24,16,0.85)', '#e8c890'); text(g, 'EACH MEMBER ACTS ONCE EVERY 2 s', 50, 64, { font: font('cinzel', 24), fill: '#f7e6c4' });
    g.fillStyle = 'rgba(30,22,14,0.86)'; rrect(g, P.W - 660, P.H - 112, 630, 82, 12); g.fill(); g.strokeStyle = '#e8c890'; g.lineWidth = 2; g.stroke();
    text(g, 'JELLY RAM rams the SOLDIER — 42', P.W - 640, P.H - 76, { font: font('ui', 21), fill: '#f7e6c4' }); text(g, 'the SOLDIER reels; the WORKER is winding up a spit', P.W - 640, P.H - 46, { font: font('ui', 18), fill: '#d9c39a' });
    caption(g, P, '10', 'PAINTED', 'the 3D scene as an oil painting, warm and soft', 'HEAVY AND DELIBERATE: real time, one big readable action at a time');
  },
});
