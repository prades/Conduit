// ROUND 2 · THE KIT (design/style-evolution/round2; Proposed, drafts for the owner, nothing in the game): colours, cameras, lights, post-processing passes,
// material changes, floor marks and the 2D drawing every direction shares. Loaded into the render page after three.js r128 and the forms' and props' model code.
// three r128 takes a colour as linear light, tone-maps into a post-processing target and leaves it linear: every colour here goes through lin(), and every chain ends in
// the sRGB pass (composer), so a colour is seen as it is written.

// ── colours and materials ──
const lin = hex => new T.Color(hex).convertSRGBToLinear();
function canvasTex(w, h, draw, o) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
  if (o && o.nearest) { t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false; } if (o && o.repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; } return t; }
function std(hex, o) { const m = new T.MeshStandardMaterial(Object.assign({ roughness: 0.6, metalness: 0.1 }, o)); m.color = lin(hex); if (o && o.emissive !== undefined) m.emissive = lin(o.emissive); return m; }
function glowMat(hex, k, o) { const m = new T.MeshBasicMaterial(Object.assign({ toneMapped: false }, o)); m.color = lin(hex); if (k != null && k !== 1) m.color.multiplyScalar(k); return m; }
const shownChain = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
// every mesh's material through fn (once per material); fn returns the material to use
function remat(root, fn) { const done = new Map(); root.traverse(o => { if (!o.isMesh && !o.isInstancedMesh) return; const one = m => { if (!done.has(m)) done.set(m, fn(m, o) || m); return done.get(m); }; o.material = Array.isArray(o.material) ? o.material.map(one) : one(o.material); }); }
const isGlow = m => m.isMeshBasicMaterial || (m.emissive && (m.emissive.r + m.emissive.g + m.emissive.b) * (m.emissiveIntensity === undefined ? 1 : m.emissiveIntensity) > 0.25);

// ── cameras and lights ──
function persp(W, H, fov, target, az, el, dist) {   // az: degrees round from +x towards +z (the game's camera looks from +x+y: 45); el: degrees up
  const c = new T.PerspectiveCamera(fov, W / H, Math.max(0.2, dist * 0.3), dist * 3 + 20), a = az * Math.PI / 180, e = el * Math.PI / 180;
  c.position.set(target[0] + Math.cos(a) * Math.cos(e) * dist, target[1] + Math.sin(e) * dist, target[2] + Math.sin(a) * Math.cos(e) * dist); c.lookAt(target[0], target[1], target[2]); c.updateProjectionMatrix(); c.updateMatrixWorld(); return c;
}
function ortho(W, H, span, target, az, el) {
  const c = new T.OrthographicCamera(-span / 2, span / 2, span / 2 * H / W, -span / 2 * H / W, 8, 90), a = az * Math.PI / 180, e = el * Math.PI / 180, d = 40;
  c.position.set(target[0] + Math.cos(a) * Math.cos(e) * d, target[1] + Math.sin(e) * d, target[2] + Math.sin(a) * Math.cos(e) * d); c.lookAt(target[0], target[1], target[2]); c.updateProjectionMatrix(); c.updateMatrixWorld(); return c;
}
function keyLight(scene, hex, intensity, from, target, size, soft) {
  const l = new T.DirectionalLight(lin(hex), intensity); l.position.set(target[0] + from[0], from[1], target[2] + from[2]); l.target.position.set(target[0], 0, target[2]);
  l.castShadow = true; l.shadow.mapSize.set(2048, 2048); const s = size || 9; Object.assign(l.shadow.camera, { left: -s, right: s, top: s, bottom: -s, near: 1, far: 60 }); l.shadow.bias = -0.0008; l.shadow.normalBias = 0.02; if (soft) l.shadow.radius = soft;
  scene.add(l); scene.add(l.target); return l;
}
function fillLight(scene, hex, intensity, pos) { const l = new T.DirectionalLight(lin(hex), intensity); l.position.set(pos[0], pos[1], pos[2]); scene.add(l); return l; }
function pointLight(scene, hex, intensity, pos, dist, decay) { const l = new T.PointLight(lin(hex), intensity, dist || 6, decay === undefined ? 2 : decay); l.position.set(pos[0], pos[1], pos[2]); scene.add(l); return l; }
// the forms' and props' metal wants something to reflect: the bakers' little studio (a dark box, three soft panels), as an environment map
function studioEnv(renderer, k) {
  const es = new T.Scene(), q = k || 1; es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(c).multiplyScalar(q), side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -Math.PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, Math.PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, Math.PI);
  return new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
}

// ── post-processing ──
const VS = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
function shader(def, uniforms) { const p = new T.ShaderPass(def); for (const k in uniforms) p.uniforms[k].value = uniforms[k]; return p; }
function bloom(W, H, s, r, t) { return new T.UnrealBloomPass(new T.Vector2(W, H), s, r, t); }
const SRGB = { uniforms: { tDiffuse: { value: null } }, vertexShader: VS, fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
  vec3 srgb(vec3 c) { return mix(c * 12.92, pow(c, vec3(1.0 / 2.4)) * 1.055 - 0.055, step(vec3(0.0031308), c)); }
  void main() { gl_FragColor = vec4(srgb(clamp(texture2D(tDiffuse, vUv).rgb, 0.0, 1.0)), 1.0); }` };
// passes: before the sRGB pass (in linear light); o.after: after it (on the picture as it is seen: pixels, halftone dots, paper)
function composer(renderer, scene, cam, W, H, passes, o) {
  const rt = new T.WebGLRenderTarget(W, H, { minFilter: T.LinearFilter, magFilter: T.LinearFilter, format: T.RGBAFormat }); rt.depthTexture = new T.DepthTexture(W, H); rt.depthTexture.type = T.UnsignedIntType;   // (a target's own depth is 16 bits: a screen flickers against its bezel)
  const c = new T.EffectComposer(renderer, rt); c.setSize(W, H); c.addPass(new T.RenderPass(scene, cam)); for (const p of passes || []) c.addPass(p);
  c.addPass(new T.ShaderPass(SRGB)); for (const p of (o && o.after) || []) c.addPass(p); c.addPass(new T.ShaderPass(T.CopyShader)); return () => c.render();
}
// INK: one bold line round every solid's silhouette, in one colour, of one width on the screen (the game's rule: docs/STYLE-CRYSTAL-LAB.md). The scene is drawn once more with
// every solid in a flat colour of its own (a solid: whatever stands under a group marked userData.inkGroup, else each mesh; a mesh with userData.inkIds has one a material),
// and a line goes wherever that colour changes or the depth breaks (a part in front of another part of the same solid). `crease` > 0 also draws where the surface turns sharply.
// Parts marked userData.noInk, sprites, lines and points are left out of it.
class InkPass extends T.Pass {
 constructor(scene, cam, W, H, o) {
  super(); o = o || {}; this.scene = scene; this.cam = cam; this.crease = o.crease || 0;
  const rt = () => { const r = new T.WebGLRenderTarget(W, H, { minFilter: T.NearestFilter, magFilter: T.NearestFilter }); r.depthTexture = new T.DepthTexture(W, H); r.depthTexture.type = T.UnsignedIntType; return r; };
  this.rtId = rt(); this.rtN = this.crease ? rt() : null; this.normalMat = new T.MeshNormalMaterial(); this.idMats = new Map(); this.count = 0;
  this.mat = new T.ShaderMaterial({ uniforms: { tDiffuse: { value: null }, tId: { value: this.rtId.texture }, tNormal: { value: this.rtN ? this.rtN.texture : this.rtId.texture }, tDepth: { value: this.rtId.depthTexture }, res: { value: new T.Vector2(W, H) }, ink: { value: lin(o.ink || '#16303a') },
    thick: { value: o.thick || 1.6 }, near: { value: cam.near }, far: { value: cam.far }, isOrtho: { value: cam.isOrthographicCamera ? 1 : 0 }, dK: { value: o.depth || 0.014 }, nK: { value: o.normal || 1.0 }, strength: { value: o.strength === undefined ? 1 : o.strength }, crease: { value: this.crease } },
    vertexShader: VS, fragmentShader: `uniform sampler2D tDiffuse, tId, tNormal, tDepth; uniform vec2 res; uniform vec3 ink; uniform float thick, near, far, isOrtho, dK, nK, strength, crease; varying vec2 vUv;
    float lin(vec2 uv) { float z = texture2D(tDepth, uv).x; return isOrtho > 0.5 ? near + z * (far - near) : (2.0 * near * far) / (far + near - (z * 2.0 - 1.0) * (far - near)); }
    void main() { vec2 e = thick / res; vec3 c = texture2D(tDiffuse, vUv).rgb; vec2 uA = vUv + e, uB = vUv - e, uC = vUv + e * vec2(1.0, -1.0), uD = vUv - e * vec2(1.0, -1.0);
      float dA = lin(uA), dB = lin(uB), dC = lin(uC), dD = lin(uD), dd = (abs(dA - dB) + abs(dC - dD)) / min(min(dA, dB), min(dC, dD));
      float idd = length(texture2D(tId, uA).rgb - texture2D(tId, uB).rgb) + length(texture2D(tId, uC).rgb - texture2D(tId, uD).rgb);
      float k = max(step(0.004, idd), smoothstep(dK, dK * 2.2, dd));
      if (crease > 0.0) { float nn = length(texture2D(tNormal, uA).xyz - texture2D(tNormal, uB).xyz) + length(texture2D(tNormal, uC).xyz - texture2D(tNormal, uD).xyz); k = max(k, crease * smoothstep(nK, nK * 1.5, nn)); }
      gl_FragColor = vec4(mix(c, ink, k * strength), 1.0); }` });
  this.fsQuad = new T.FullScreenQuad(this.mat);
 }
 idMat(id) { let m = this.idMats.get(id); if (!m) { m = new T.MeshBasicMaterial({ toneMapped: false, fog: false }); m.color.setRGB(((id * 67 + 13) % 251) / 251, ((id * 131 + 7) % 241) / 241, ((id * 29 + 101) % 239) / 239); this.idMats.set(id, m); } return m; }
 render(renderer, writeBuffer, readBuffer) {
    const sc = this.scene, oldB = sc.background, oldF = sc.fog, hidden = [], swapped = [], oc = renderer.getClearColor(new T.Color()), oa = renderer.getClearAlpha(), tm = renderer.toneMapping;
    sc.traverse(o => { if (o.visible && (o.isSprite || o.isLine || o.isPoints || o.userData.noInk || (o.isMesh && [].concat(o.material).some(m => (m.userData && m.userData.noInk) || (m.transparent && m.opacity < 0.3))))) { o.visible = false; hidden.push(o); } });   // (a faint see-through part, a pool of light or a pane, carries no line)
    sc.background = null; sc.fog = null; renderer.toneMapping = T.NoToneMapping;
    if (this.rtN) { sc.overrideMaterial = this.normalMat; renderer.setRenderTarget(this.rtN); renderer.setClearColor(0x8080ff, 1); renderer.clear(); renderer.render(sc, this.cam); sc.overrideMaterial = null; }
    sc.traverse(o => { if (!o.isMesh) return; let root = null; for (let q = o; q; q = q.parent) if (q.userData.inkGroup) root = q; const holder = root || o; if (holder.userData._inkId === undefined) holder.userData._inkId = ++this.count * 3;
      swapped.push([o, o.material, o.instanceColor]); if (o.isInstancedMesh) o.instanceColor = null; const id = holder.userData._inkId; /* (a tile's own tint is not a solid's edge) */ o.material = Array.isArray(o.material) ? o.material.map((m, i) => this.idMat(id + (o.userData.inkIds ? o.userData.inkIds[i] : 0))) : this.idMat(id + (o.userData.inkId || 0)); });
    renderer.setRenderTarget(this.rtId); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(sc, this.cam);
    for (const [o, m, ic] of swapped) { o.material = m; if (o.isInstancedMesh) o.instanceColor = ic; } for (const o of hidden) o.visible = true; sc.background = oldB; sc.fog = oldF; renderer.setClearColor(oc, oa); renderer.toneMapping = tm;
    this.mat.uniforms.tDiffuse.value = readBuffer.texture; renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.fsQuad.render(renderer);
 }
}
// a soft glow in the air (the game's own soft glows): an additive sprite
function glowSprite(at, r, hex, op) { const tex = glowSprite.tex || (glowSprite.tex = canvasTex(128, 128, (g, w, h) => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }));
  const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, color: lin(hex), transparent: true, opacity: op === undefined ? 0.6 : op, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })); sp.scale.set(r * 2, r * 2, 1); sp.position.set(at[0], at[1], at[2]); return sp; }
// BIG PIXELS: the picture in cells of n pixels, each colour rounded to a few levels with an ordered dither (after the sRGB pass)
const PIXELS = { uniforms: { tDiffuse: { value: null }, res: { value: new T.Vector2(1, 1) }, cell: { value: 4 }, levels: { value: 24 }, dither: { value: 1 } }, vertexShader: VS, fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; uniform float cell, levels, dither; varying vec2 vUv;
  float bayer(vec2 p) { vec2 q = mod(floor(p), 4.0); float i = q.x + q.y * 4.0; float v = 0.0;
    if (i < 0.5) v = 0.0; else if (i < 1.5) v = 8.0; else if (i < 2.5) v = 2.0; else if (i < 3.5) v = 10.0; else if (i < 4.5) v = 12.0; else if (i < 5.5) v = 4.0; else if (i < 6.5) v = 14.0; else if (i < 7.5) v = 6.0;
    else if (i < 8.5) v = 3.0; else if (i < 9.5) v = 11.0; else if (i < 10.5) v = 1.0; else if (i < 11.5) v = 9.0; else if (i < 12.5) v = 15.0; else if (i < 13.5) v = 7.0; else if (i < 14.5) v = 13.0; else v = 5.0; return v / 16.0 - 0.47; }
  void main() { vec2 p = floor(vUv * res / cell); vec3 c = texture2D(tDiffuse, (p + 0.5) * cell / res).rgb; c += dither * bayer(p) / levels; gl_FragColor = vec4(floor(c * levels + 0.5) / levels, 1.0); }` };
// HALFTONE: a comic's screen tone: greys become black, dots or white; colour is kept, flat, only where the mask says so (the spot colours). After the sRGB pass.
const HALFTONE = { uniforms: { tDiffuse: { value: null }, tMask: { value: null }, res: { value: new T.Vector2(1, 1) }, size: { value: 7 }, paper: { value: new T.Color(0xf6f1e4) }, inkc: { value: new T.Color(0x14161c) } }, vertexShader: VS, fragmentShader: `uniform sampler2D tDiffuse, tMask; uniform vec2 res; uniform float size; uniform vec3 paper, inkc; varying vec2 vUv;
  void main() { vec3 c = texture2D(tDiffuse, vUv).rgb, mk = texture2D(tMask, vUv).rgb; float lum = dot(c, vec3(0.299, 0.587, 0.114)), spot = step(0.12, max(mk.r, max(mk.g, mk.b)));
    vec2 q = vUv * res; q = vec2(q.x * 0.7071 - q.y * 0.7071, q.x * 0.7071 + q.y * 0.7071) / size; float r = length(fract(q) - 0.5);
    float tone = smoothstep(0.2, 0.82, lum), dotR = sqrt(1.0 - tone) * 0.72, d = 1.0 - smoothstep(dotR - 0.07, dotR + 0.07, r);
    vec3 bw = mix(paper, inkc, lum < 0.14 ? 1.0 : d);
    float mx = max(c.r, max(c.g, c.b)); vec3 flatc = mix(c, c * 0.7, (1.0 - smoothstep(0.3, 0.55, lum)) * (1.0 - smoothstep(0.26, 0.36, r)) * step(0.1, mx));
    gl_FragColor = vec4(mix(bw, flatc, spot), 1.0); }` };
// the scene drawn flat, each mesh in the colour matOf gives it (null: left out): for a mask
function flatRender(renderer, scene, cam, rt, colourOf) {
  const cache = flatRender.cache || (flatRender.cache = new Map()), mat = hex => { let m = cache.get(hex); if (!m) { m = new T.MeshBasicMaterial({ color: hex, toneMapped: false, fog: false }); cache.set(hex, m); } return m; };
  const swapped = [], hidden = [], bg = scene.background, fog = scene.fog, tm = renderer.toneMapping, oc = renderer.getClearColor(new T.Color()), oa = renderer.getClearAlpha();
  scene.traverse(o => { if (!o.visible) return; if (o.isLine || o.isPoints) { o.visible = false; hidden.push(o); return; } if (!o.isMesh) return; const c = colourOf(o); if (c === null) { o.visible = false; hidden.push(o); return; } swapped.push([o, o.material, o.instanceColor]); if (o.isInstancedMesh) o.instanceColor = null; o.material = Array.isArray(o.material) ? o.material.map(() => mat(c)) : mat(c); });
  scene.background = null; scene.fog = null; renderer.toneMapping = T.NoToneMapping; renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, cam);
  for (const [o, m, ic] of swapped) { o.material = m; if (o.isInstancedMesh) o.instanceColor = ic; } for (const o of hidden) o.visible = true; scene.background = bg; scene.fog = fog; renderer.toneMapping = tm; renderer.setClearColor(oc, oa);
}
// a pass that only draws a mask for a later pass: white where a mesh stands under a group marked userData.spot (sprites keep their own colour), black elsewhere
class SpotMaskPass extends T.Pass {
  constructor(scene, cam, W, H) { super(); this.scene = scene; this.cam = cam; this.needsSwap = false; this.rt = new T.WebGLRenderTarget(W, H, { minFilter: T.LinearFilter, magFilter: T.LinearFilter }); this.rt.depthTexture = new T.DepthTexture(W, H); this.rt.depthTexture.type = T.UnsignedIntType; }
  render(renderer) { flatRender(renderer, this.scene, this.cam, this.rt, o => { for (let q = o; q; q = q.parent) if (q.userData.spot) return 0xffffff; return 0x000000; }); }
}
// PAPER: fibres and a soft mottle over the picture (after the sRGB pass)
const PAPER = { uniforms: { tDiffuse: { value: null }, res: { value: new T.Vector2(1, 1) }, amount: { value: 1 }, tint: { value: new T.Color(0xfff6e6) } }, vertexShader: VS, fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 res; uniform float amount; uniform vec3 tint; varying vec2 vUv;
  float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1.0, 0.0)), f.x), mix(h(i + vec2(0.0, 1.0)), h(i + vec2(1.0, 1.0)), f.x), f.y); }
  void main() { vec2 q = vUv * res; vec3 c = texture2D(tDiffuse, vUv).rgb; float fib = n(q * vec2(0.9, 0.12)) * 0.5 + n(q * vec2(0.1, 1.1)) * 0.5, mot = n(q / 46.0), grain = h(floor(q / 1.5));
    c *= tint; c *= 1.0 - amount * (0.07 * (fib - 0.5) + 0.06 * (mot - 0.5) + 0.035 * (grain - 0.5)) * 2.0; gl_FragColor = vec4(c, 1.0); }` };
const VIGNETTE = { uniforms: { tDiffuse: { value: null }, amount: { value: 0.35 }, colour: { value: new T.Color(0x000000) } }, vertexShader: VS, fragmentShader: `uniform sampler2D tDiffuse; uniform float amount; uniform vec3 colour; varying vec2 vUv;
  void main() { vec3 c = texture2D(tDiffuse, vUv).rgb; vec2 d = vUv - 0.5; float v = smoothstep(0.35, 0.95, length(d * vec2(1.0, 0.85)) * 1.45); gl_FragColor = vec4(mix(c, colour, v * amount), 1.0); }` };

// ── what a look does to the models' materials ──
const GRAD = (steps) => { const n = steps.length, c = document.createElement('canvas'); c.width = n; c.height = 1; const g = c.getContext('2d'); steps.forEach((v, i) => { const q = Math.round(v * 255); g.fillStyle = `rgb(${q},${q},${q})`; g.fillRect(i, 0, 1, 1); }); const t = new T.CanvasTexture(c); t.minFilter = t.magFilter = T.NearestFilter; t.generateMipmaps = false; return t; };
// cel shading: every lit material becomes a toon one with the same colour (its picture kept), in `grad`'s steps; glows stay as they are
function toonify(root, grad, o) { o = o || {}; remat(root, m => { if (m.isMeshBasicMaterial || m.isMeshToonMaterial || m.isShaderMaterial) return m;
  const t = new T.MeshToonMaterial({ gradientMap: grad, map: m.map || null, emissiveMap: m.emissiveMap || null, transparent: m.transparent, opacity: m.opacity, side: m.side, depthWrite: m.depthWrite, vertexColors: m.vertexColors }); t.color.copy(m.color || new T.Color(1, 1, 1)); if (o.sat) { const h = {}; t.color.getHSL(h); t.color.setHSL(h.h, Math.min(1, h.s * o.sat), h.l); }
  if (m.emissive) { t.emissive.copy(m.emissive); t.emissiveIntensity = m.emissiveIntensity === undefined ? 1 : m.emissiveIntensity; } t.userData = m.userData; return t; }); }
// flat facets: one colour a face (the look of cut stone or folded paper)
function facet(root, o) { o = o || {}; remat(root, m => { if (m.isMeshBasicMaterial || m.isShaderMaterial) return m;
  const t = new (o.lambert ? T.MeshLambertMaterial : T.MeshStandardMaterial)(o.lambert ? {} : { roughness: o.rough === undefined ? 0.85 : o.rough, metalness: o.metal || 0 }); t.flatShading = true; t.vertexColors = m.vertexColors; t.emissiveMap = m.emissiveMap || null; t.map = o.keepMap === false ? null : (m.map || null); t.transparent = m.transparent; t.opacity = m.opacity; t.side = m.side; t.depthWrite = m.depthWrite;
  t.color.copy(m.color || new T.Color(1, 1, 1)); if (o.tone) o.tone(t.color, m); if (m.emissive) { t.emissive.copy(m.emissive); t.emissiveIntensity = m.emissiveIntensity === undefined ? 1 : m.emissiveIntensity; } t.userData = m.userData; return t; }); }
// a hologram: every surface as faint light with its edges drawn
function holo(root, hex, o) { o = o || {}; const fill = new T.MeshBasicMaterial({ color: lin(hex), transparent: true, opacity: o.fill === undefined ? 0.1 : o.fill, depthWrite: false, toneMapped: false, blending: T.AdditiveBlending, side: T.DoubleSide }), line = new T.LineBasicMaterial({ color: lin(hex), transparent: true, opacity: o.line === undefined ? 0.8 : o.line, toneMapped: false, blending: T.AdditiveBlending, depthWrite: false });
  const meshes = []; root.traverse(q => { if (q.isMesh && !q.isInstancedMesh && shownChain(q)) meshes.push(q); });
  for (const q of meshes) { const glow = isGlow([].concat(q.material)[0]); q.material = glow ? new T.MeshBasicMaterial({ color: lin(hex), toneMapped: false }) : fill; if (!glow && q.geometry && q.geometry.attributes.position.count < 4000) { const e = new T.LineSegments(new T.EdgesGeometry(q.geometry, o.angle || 28), line); q.add(e); } q.castShadow = false; q.receiveShadow = false; } }
// a unit as a crisp pixel sprite standing in the scene: it is drawn alone at a few pixels a tile, and that small picture stands where it stood
function pixelSprite(obj, scene, renderer, cam, o) {
  o = o || {}; const px = o.px || 40, box = new T.Box3().setFromObject(obj), c = box.getCenter(new T.Vector3()), s = box.getSize(new T.Vector3()), R = Math.max(s.x, s.z) * 0.75 + 0.2, Hh = s.y + 0.3;
  const dir = new T.Vector3().subVectors(cam.position, c); dir.y = 0; dir.normalize(); const right = new T.Vector3(dir.z, 0, -dir.x);
  const elev = Math.asin(Math.min(0.95, Math.max(0.05, (cam.position.y - c.y) / cam.position.distanceTo(c)))), w = Math.ceil(R * 2 * px), h = Math.ceil((Hh * Math.cos(elev) + R * 2 * Math.sin(elev)) * px);
  const oc = new T.OrthographicCamera(-R, R, h / px / 2, -h / px / 2, 0.1, 80); oc.position.copy(c).addScaledVector(dir, 20 * Math.cos(elev)); oc.position.y = c.y + 20 * Math.sin(elev); oc.lookAt(c); oc.updateMatrixWorld();
  const rt = new T.WebGLRenderTarget(w, h, { magFilter: T.NearestFilter, minFilter: T.NearestFilter }), hid = []; scene.traverse(q => { if (q !== scene && q.parent === scene && q !== obj && !q.isLight && q.visible && !obj.getObjectById(q.id)) { let inside = false; obj.traverseAncestors(a => { if (a === q) inside = true; }); if (!inside) { q.visible = false; hid.push(q); } } });
  const sibs = []; if (obj.parent && obj.parent !== scene) for (const q of obj.parent.children) if (q !== obj && q.visible) { q.visible = false; sibs.push(q); }
  const bg = scene.background, fog = scene.fog; scene.background = null; scene.fog = null; renderer.setRenderTarget(rt); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(scene, oc); renderer.setRenderTarget(null); scene.background = bg; scene.fog = fog;
  for (const q of hid) q.visible = true; for (const q of sibs) q.visible = true;
  const buf = new Uint8Array(w * h * 4); renderer.readRenderTargetPixels(rt, 0, 0, w, h, buf); const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'), im = g.createImageData(w, h), lv = o.levels || 6;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, j = ((h - 1 - y) * w + x) * 4, a = buf[i + 3] > 110 ? 255 : 0; for (let k = 0; k < 3; k++) { const v = Math.pow(buf[i + k] / 255, 1 / 2.2); im.data[j + k] = Math.round(Math.round(v * lv) / lv * 255); } im.data[j + 3] = a; }
  if (o.outline) { const src = new Uint8ClampedArray(im.data), at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!at(x, y) && (at(x + 1, y) || at(x - 1, y) || at(x, y + 1) || at(x, y - 1))) { const j = (y * w + x) * 4; im.data[j] = o.outline[0]; im.data[j + 1] = o.outline[1]; im.data[j + 2] = o.outline[2]; im.data[j + 3] = 255; } }
  g.putImageData(im, 0, 0); const tex = new T.CanvasTexture(cv); tex.magFilter = T.NearestFilter; tex.minFilter = T.NearestFilter; tex.generateMipmaps = false; tex.encoding = T.sRGBEncoding;
  const quad = new T.Mesh(new T.PlaneGeometry(w / px, h / px), new T.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, toneMapped: false, side: T.DoubleSide })); quad.position.copy(c); quad.quaternion.copy(oc.quaternion); quad.userData.noInk = true;
  obj.visible = false; scene.add(quad); return quad;
}

// ── floor marks, in the scene (under the characters, so a mark never tints anyone standing on it) ──
const decalMat = (hex, op, o) => new T.MeshBasicMaterial(Object.assign({ color: lin(hex), transparent: true, opacity: op === undefined ? 0.8 : op, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2, side: T.DoubleSide }, o));
function decalRing(par, at, r, w, hex, op, from, to, y) { const a0 = (from || 0) * Math.PI * 2, a1 = ((to === undefined ? 1 : to) - (from || 0)) * Math.PI * 2, m = new T.Mesh(new T.RingGeometry(r - w / 2, r + w / 2, 72, 1, -a0 - a1 + Math.PI / 2, a1), decalMat(hex, op)); m.rotation.x = -Math.PI / 2; m.position.set(at[0], y || 0.016, at[1]); m.userData.noInk = true; par.add(m); return m; }
function decalDisc(par, at, r, hex, op, y) { const m = new T.Mesh(new T.CircleGeometry(r, 56), decalMat(hex, op)); m.rotation.x = -Math.PI / 2; m.position.set(at[0], y || 0.013, at[1]); m.userData.noInk = true; par.add(m); return m; }
function decalPoly(par, pts, hex, op, y) { const sh = new T.Shape(pts.map(p => new T.Vector2(p[0], -p[1]))), m = new T.Mesh(new T.ShapeGeometry(sh), decalMat(hex, op)); m.rotation.x = -Math.PI / 2; m.position.y = y || 0.014; m.userData.noInk = true; par.add(m); return m; }
function decalLine(par, pts, w, hex, op, y) { for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L * w / 2, ny = dx / L * w / 2; decalPoly(par, [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], hex, op, y); } }
function decalDashes(par, pts, w, hex, op, dash, gap, y) { let carry = 0, on = true; for (let i = 0; i + 1 < pts.length; i++) { const a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let t = 0; while (t < L) { const left = (on ? dash : gap) - carry, step = Math.min(left, L - t); if (on) decalLine(par, [[a[0] + (b[0] - a[0]) * t / L, a[1] + (b[1] - a[1]) * t / L], [a[0] + (b[0] - a[0]) * (t + step) / L, a[1] + (b[1] - a[1]) * (t + step) / L]], w, hex, op, y); t += step; carry += step; if (carry >= (on ? dash : gap) - 1e-6) { carry = 0; on = !on; } } } }
function decalArrow(par, a, b, w, hex, op, y) { const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, h = w * 2.6, e = [b[0] - ux * h, b[1] - uy * h]; decalLine(par, [a, e], w, hex, op, y); decalPoly(par, [[b[0], b[1]], [e[0] - uy * h * 0.6, e[1] + ux * h * 0.6], [e[0] + uy * h * 0.6, e[1] - ux * h * 0.6]], hex, op, y); }
const tileRect = (x, y, k) => { const q = (k === undefined ? 0.46 : k); return [[x - q, y - q], [x + q, y - q], [x + q, y + q], [x - q, y + q]]; };

// ── 2D drawing, over the picture ──
const FACE = { title: '"BV Titan", "DejaVu Sans", sans-serif', bang: '"BV Bangers", "DejaVu Sans", sans-serif', chakra: '"BV Chakra", "DejaVu Sans", sans-serif', pixel: '"BV Pixel", monospace', cinzel: '"BV Cinzel", serif', ui: '"DejaVu Sans", sans-serif' };
function font(kind, px) { return kind === 'cond' ? 'italic 900 ' + px + 'px "BV Barlow", "DejaVu Sans", sans-serif' : (kind === 'ui' ? 'bold ' : '') + px + 'px ' + FACE[kind]; }
function rrect(g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function text(g, s, x, y, o) { g.save(); g.font = o.font; g.textAlign = o.align || 'left'; g.textBaseline = o.base || 'alphabetic'; if (o.shadow) { g.shadowColor = o.shadow; g.shadowBlur = o.blur || 8; } if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.sw || 6; g.strokeStyle = o.stroke; g.strokeText(s, x, y); } g.fillStyle = o.fill || '#fff'; g.fillText(s, x, y); g.restore(); }
function textW(g, s, f) { g.save(); g.font = f; const w = g.measureText(s).width; g.restore(); return w; }
function panel(g, x, y, w, h, o) { o = o || {}; g.save(); if (o.shadow !== false) { g.shadowColor = 'rgba(0,0,0,0.45)'; g.shadowBlur = 18; g.shadowOffsetY = 4; } rrect(g, x, y, w, h, o.r === undefined ? 14 : o.r); g.fillStyle = o.fill || 'rgba(10,22,30,0.86)'; g.fill(); g.restore(); if (o.stroke) { rrect(g, x, y, w, h, o.r === undefined ? 14 : o.r); g.lineWidth = o.lw || 2; g.strokeStyle = o.stroke; g.stroke(); } }
function pill(g, x, y, w, h, fill, stroke, lw) { rrect(g, x, y, w, h, h / 2); g.fillStyle = fill; g.fill(); if (stroke) { g.lineWidth = lw || 2; g.strokeStyle = stroke; g.stroke(); } }
function chip(g, s, x, y, o) { o = o || {}; const f = o.font || font('chakra', o.px || 22), w = textW(g, s, f) + (o.pad || 28), h = o.h || (o.px || 22) + 18, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x; pill(g, x0, y, w, h, o.fill || 'rgba(10,22,30,0.88)', o.stroke, o.lw); text(g, s, x0 + w / 2, y + h / 2 + 1, { font: f, fill: o.color || '#eaffff', align: 'center', base: 'middle' }); return [x0, y, w, h]; }
function bar(g, x, y, w, h, frac, col, o) { o = o || {}; rrect(g, x - 2, y - 2, w + 4, h + 4, (h + 4) / 2); g.fillStyle = o.back || 'rgba(0,0,0,0.7)'; g.fill(); if (o.ghost) { rrect(g, x, y, Math.max(h, w * o.ghost), h, h / 2); g.fillStyle = o.ghostCol || 'rgba(255,255,255,0.75)'; g.fill(); } rrect(g, x, y, Math.max(h, w * frac), h, h / 2); g.fillStyle = col; g.fill(); }
function bigNumber(g, s, x, y, px, fill, stroke, kind, rot) { g.save(); g.translate(x, y); if (rot) g.rotate(rot); text(g, s, 0, 0, { font: font(kind || 'title', px), fill, stroke: stroke || '#000', sw: px * 0.2, align: 'center' }); g.restore(); }
function leader(g, a, b, col, w, dash) { g.save(); g.strokeStyle = col; g.lineWidth = w || 3; g.lineCap = 'round'; if (dash) g.setLineDash(dash); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.restore(); }
function badge(g, img, x, y, r, ring, o) { o = o || {}; g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = o.back || '#0d1a22'; g.fill(); if (img) { g.save(); g.beginPath(); g.arc(x, y, r - 1, 0, 7); g.clip(); g.drawImage(img, x - r, y - r, r * 2, r * 2); g.restore(); } if (o.dim) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = 'rgba(6,12,18,' + o.dim + ')'; g.fill(); } g.lineWidth = o.lw || Math.max(3, r * 0.14); g.strokeStyle = ring; g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke(); g.restore(); }
function squareBadge(g, img, x, y, s, ring, o) { o = o || {}; g.save(); rrect(g, x, y, s, s, o.r === undefined ? s * 0.16 : o.r); g.fillStyle = o.back || '#0d1a22'; g.fill(); if (img) { g.save(); rrect(g, x, y, s, s, o.r === undefined ? s * 0.16 : o.r); g.clip(); g.drawImage(img, x, y, s, s); g.restore(); } rrect(g, x, y, s, s, o.r === undefined ? s * 0.16 : o.r); g.lineWidth = o.lw || 3; g.strokeStyle = ring; g.stroke(); g.restore(); }

// A FLOOR THAT REFLECTS: the scene drawn once more from under the floor (three's Reflector) and laid over the floor as added light, a little blurred. `poly`: the floor's outline in the game's (x, y)
function mirrorFloor(poly, o) { o = o || {}; const sh = new T.Shape(poly.map(p => new T.Vector2(p[0], -p[1])));
  const m = new T.Reflector(new T.ShapeGeometry(sh), { textureWidth: o.size || 1536, textureHeight: o.size || 1536, clipBias: 0.003, color: lin(o.tint || '#ffffff'), shader: { uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, strength: { value: o.strength === undefined ? 0.5 : o.strength }, blur: { value: o.blur === undefined ? 0.004 : o.blur } },
    vertexShader: 'uniform mat4 textureMatrix; varying vec4 vUv; void main() { vUv = textureMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; uniform float strength, blur; varying vec4 vUv;
      vec3 tap(vec2 o) { return pow(texture2DProj(tDiffuse, vUv + vec4(o * vUv.w, 0.0, 0.0)).rgb, vec3(2.2)); }
      void main() { vec3 c = tap(vec2(0.0)) * 0.3 + (tap(vec2(blur, 0.0)) + tap(vec2(-blur, 0.0)) + tap(vec2(0.0, blur)) + tap(vec2(0.0, -blur))) * 0.12 + (tap(vec2(blur, blur) * 1.6) + tap(vec2(-blur, blur) * 1.6) + tap(vec2(blur, -blur) * 1.6) + tap(vec2(-blur, -blur) * 1.6)) * 0.055; gl_FragColor = vec4(c * color * strength, 1.0); }` } });
  m.rotation.x = -Math.PI / 2; m.position.y = o.y || 0.004; m.material.transparent = true; m.material.blending = T.AdditiveBlending; m.material.depthWrite = false; m.userData.noInk = true; return m; }
// a shaft of light standing in the air: bright at its foot, gone at its top
function lightShaft(at, r0, r1, h, hex, op) { const tex = lightShaft.tex || (lightShaft.tex = canvasTex(8, 128, (g, w, hh) => { const gr = g.createLinearGradient(0, hh, 0, 0); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.5)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, w, hh); }));
  const m = new T.Mesh(new T.CylinderGeometry(r1, r0, h, 40, 1, true), new T.MeshBasicMaterial({ map: tex, color: lin(hex), transparent: true, opacity: op === undefined ? 0.3 : op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false, fog: false })); m.position.set(at[0], at[1] + h / 2, at[2]); m.userData.noInk = true; return m; }
