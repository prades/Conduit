// THE LIVE TEST ROOM (design/style-evolution/live; a test page, lab3d/, not the game). The owner, 2026-11-16, of round 2's direction 1 (CRYSTAL LAB 3D): which piece first?
// "Live 3D test room": the Crystal Chamber running in real 3D in that look, with a frame-rate readout, to try on both iPads. It answers whether real 3D runs well enough.
// This file is the last part of the bundle (tools/lab3d.js): the forms' and props' models, the round 2 kit, chamber and styles come before it, in one function, so the room
// and the look are the very code that drew picture 1 (STYLES.lab). What is added here: it is drawn every frame, cheaply:
//   ONE MESH A MATERIAL   everything that stands still (the props, the fittings, the doors, the pad, the floor's marks, each ant) is merged, so a frame is some 200 draws, not 1,100
//   THE INK LINE          each solid's own flat colour is carried in its vertices (`idc`), so the line's second drawing of the room is one cheap material, not a swap a mesh
//   THE LOOP              a loop of a few seconds so the frame rate is measured on a room that moves; it is for the test page, not a design of the fight
// In scope: T, map (export.js's JSON), opts = { canvas, gl1, test, onStats(stats), onReady(api) }, and everything the kit, the chamber and the styles declare.
const LIVE = (function () {
  const S = STYLES.lab, canvas = opts.canvas, state = { ink: opts.ink !== false, shadows: opts.shadows !== false, sharp: opts.sharp || 1.5 };
  const renderer = new (opts.gl1 ? T.WebGL1Renderer : T.WebGLRenderer)({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const gl2 = renderer.capabilities.isWebGL2, depthOK = gl2 || !!renderer.extensions.get('WEBGL_depth_texture');
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.NoToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap; renderer.shadowMap.autoUpdate = false; renderer.info.autoReset = false;

  // ── the room and the squad, as picture 1 has them ──
  const scene = new T.Scene(), P = S.palette(), units = RAID(), ctx = { renderer, P, S, units, scene, map, portraits: {} };
  S.env(scene, ctx);
  const world = buildChamber(P, S.room); ctx.world = world; scene.add(world.g);
  const cast = buildCast(P, units); ctx.cast = cast; scene.add(cast.g);
  S.world(world, scene, ctx); S.cast(cast, scene, ctx); S.lights(scene, ctx);
  let key = null; scene.traverse(o => { if (o.isDirectionalLight && o.castShadow) key = o; });
  const U = units, pa = world.parts;

  // ── the floor's marks: a ring under everyone; the soldier's bite as a shape that fills before it lands ──
  const marks = new T.Group(); scene.add(marks); teamRings(marks, ctx, { w: 0.045, op: 0.95 });
  const biteAng = angTo(U.soldier.at, U.ram.at), dyn = o => { o.userData.dynamic = true; return o; };
  const biteOut = dyn(new T.Group()); decalPoly(biteOut, wedge(U.soldier.at, biteAng, 2.15, 0.42), '#ff3b5c', 0.2); decalLine(biteOut, wedge(U.soldier.at, biteAng, 2.15, 0.42).concat([U.soldier.at]), 0.045, '#ff3b5c', 1); marks.add(biteOut);
  const biteIn = dyn(decalPoly(marks, wedge([0, 0], biteAng, 2.15, 0.42), '#ff3b5c', 0.42, 0.016)); biteIn.position.x = U.soldier.at[0]; biteIn.position.z = U.soldier.at[1];
  const lunge = dyn(new T.Group()); decalDashes(lunge, [along(U.striker.at, U.crab.at, 0.3), along(U.striker.at, U.crab.at, 0.72)], 0.07, '#ff3b5c', 0.95, 0.16, 0.1); decalArrow(lunge, along(U.striker.at, U.crab.at, 0.6), along(U.striker.at, U.crab.at, 0.78), 0.07, '#ff3b5c', 0.95); marks.add(lunge);

  // ── what is in the air (each shown only while it happens) ──
  const air = new T.Group(); air.userData.noInk = true; scene.add(air);
  const sp = pa.props.sentry_chamber_1, mz = (sp && sp.marks.muzzle) || [0, 0.72, 0], bA = [SENTRY[0] + mz[0], mz[1], SENTRY[1] + mz[2]], bB = [U.scout.at[0], 0.2, U.scout.at[1]];
  const beam = new T.Group(); beam.add(boltBetween(bA, bB, PAL.cyan, { jag: 0, r: 0.022, n: 2 })); beam.add(glowBall(bA, 0.1, PAL.cyan)); beam.add(burst(bB, PAL.cyan, 9, 0.3)); air.add(beam);
  const iA = new T.Vector3(U.star.at[0], 0.62 + (U.star.lift || 0), U.star.at[1]), iB = new T.Vector3(U.striker.at[0], 0.28, U.striker.at[1]), iDir = iB.clone().sub(iA).normalize();
  const iceMat = new T.MeshToonMaterial({ color: lin('#dff6ff'), emissive: lin('#7fd6ff'), emissiveIntensity: 0.8, gradientMap: ctx.grad }), icicles = [];
  for (let i = 0; i < 3; i++) { const c = new T.Mesh(new T.ConeGeometry(0.05, 0.36, 5), iceMat); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), iDir); c.castShadow = true; air.add(c); icicles.push(c); }
  const stakes = new T.Group(), stakeMat = new T.MeshToonMaterial({ color: lin('#ff9ccc'), emissive: lin('#ff5fa8'), emissiveIntensity: 0.5, gradientMap: ctx.grad });
  for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.4, h = 0.34 + (i % 3) * 0.1, c = new T.Mesh(new T.ConeGeometry(0.075, h, 5), stakeMat); c.position.set(Math.cos(a) * 0.82, h / 2, Math.sin(a) * 0.82); c.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22); c.castShadow = true; stakes.add(c); }
  stakes.position.set(U.striker.at[0], 0, U.striker.at[1]); stakes.userData.inkGroup = true; stakes.userData.dynamic = true; scene.add(stakes);
  const hitAt = [U.ram.at[0] + (U.soldier.at[0] - U.ram.at[0]) * 0.6, 0.5, U.ram.at[1] + (U.soldier.at[1] - U.ram.at[1]) * 0.6], hit = new T.Group(); hit.add(burst(hitAt, '#eaffff', 12, 0.42, { w: 0.016 })); hit.add(glowBall(hitAt, 0.12, '#2fe0c0', { op: 0.55 })); air.add(hit);

  // ── cheap to draw ──
  let idCount = 0;
  const idOf = h => (h.userData._ink === undefined ? (h.userData._ink = ++idCount * 3) : h.userData._ink), idCol = id => [((id * 67 + 13) % 251) / 251, ((id * 131 + 7) % 241) / 241, ((id * 29 + 101) % 239) / 239];
  const holderOf = o => { let root = null; for (let q = o; q; q = q.parent) if (q.userData.inkGroup) root = q; return root || o; };
  const noInk = o => { for (let q = o; q; q = q.parent) if (q.userData.noInk) return true; return [].concat(o.material).some(m => (m.userData && m.userData.noInk) || (m.transparent && m.opacity < 0.3)); };
  const sig = m => m.map || m.emissiveMap || m.alphaMap ? m.uuid : m.isMeshBasicMaterial ? ['b', m.color.getHex(), m.opacity, m.transparent, m.blending, m.depthWrite, m.side, m.polygonOffset].join(',')
    : m.isMeshToonMaterial ? ['t', m.color.getHex(), m.emissive.getHex(), m.emissiveIntensity, m.opacity, m.transparent, m.depthWrite, m.side, m.vertexColors, m.gradientMap ? m.gradientMap.uuid : 0].join(',') : m.uuid;   // (two plain materials of one colour are one material)
  // every still mesh under root as one mesh a material, in root's own space; each vertex carries its solid's colour for the ink line. Plain materials (no picture, not see-through,
  // not glowing of themselves) that differ only in colour become ONE material, the colour carried in the vertices
  const plain = m => !m.map && !m.emissiveMap && !m.alphaMap && !m.transparent && (m.isMeshBasicMaterial || (m.isMeshToonMaterial && (m.emissive.r + m.emissive.g + m.emissive.b) * m.emissiveIntensity < 0.004));
  function mergeStill(root) {
    root.updateMatrixWorld(true); const inv = new T.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map(), gone = [], v = new T.Vector3();
    root.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !shownChain(o)) return; for (let q = o; q && q !== root; q = q.parent) if (q.userData.dynamic) return; if (o.userData.dynamic) return;
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, mats = [].concat(o.material), pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv, col = geo.attributes.color;
      const groups = Array.isArray(o.material) && geo.groups.length ? geo.groups : [{ start: 0, count: pos.count, materialIndex: 0 }];
      const m4 = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld), n3 = new T.Matrix3().getNormalMatrix(m4), flip = m4.determinant() < 0, ni = noInk(o), id = ni ? 0 : idOf(holderOf(o));
      for (const gr of groups) { const mat = mats[gr.materialIndex] || mats[0], paint = plain(mat), k = (paint ? [mat.type, mat.side, mat.depthWrite, mat.toneMapped, mat.polygonOffset, mat.gradientMap ? mat.gradientMap.uuid : 0].join(',') : sig(mat)) + '|' + (ni ? 1 : 0) + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + (o.renderOrder || 0);
        let b = buckets.get(k); if (!b) { let m2 = mat; if (paint) { m2 = mat.clone(); m2.color.setRGB(1, 1, 1); m2.vertexColors = true; } b = { mat: m2, ni, cast: o.castShadow, recv: o.receiveShadow, order: o.renderOrder || 0, pos: [], nor: [], uv: [], col: [], idc: [], needUv: !!(mat.map || mat.emissiveMap), needCol: paint || !!mat.vertexColors }; buckets.set(k, b); }
        const tint = paint ? mat.color : null, own = mat.vertexColors ? col : null;
        const c = idCol(id + (o.userData.inkIds ? o.userData.inkIds[gr.materialIndex] || 0 : 0));
        const push = i => { v.fromBufferAttribute(pos, i).applyMatrix4(m4); b.pos.push(v.x, v.y, v.z); if (nor) { v.fromBufferAttribute(nor, i).applyMatrix3(n3).normalize(); b.nor.push(v.x, v.y, v.z); } else b.nor.push(0, 1, 0);
          if (b.needUv) b.uv.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0); if (b.needCol) b.col.push((own ? own.getX(i) : 1) * (tint ? tint.r : 1), (own ? own.getY(i) : 1) * (tint ? tint.g : 1), (own ? own.getZ(i) : 1) * (tint ? tint.b : 1)); b.idc.push(c[0], c[1], c[2]); };
        for (let i = gr.start; i + 2 < gr.start + gr.count; i += 3) { push(i); push(flip ? i + 2 : i + 1); push(flip ? i + 1 : i + 2); } }
      gone.push(o); });
    for (const o of gone) o.parent.remove(o);
    for (const b of buckets.values()) { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(b.pos, 3)); g.setAttribute('normal', new T.Float32BufferAttribute(b.nor, 3)); if (b.needUv) g.setAttribute('uv', new T.Float32BufferAttribute(b.uv, 2)); if (b.needCol) g.setAttribute('color', new T.Float32BufferAttribute(b.col, 3)); g.setAttribute('idc', new T.Float32BufferAttribute(b.idc, 3));
      const m = new T.Mesh(g, b.mat); m.castShadow = b.cast; m.receiveShadow = b.recv; m.renderOrder = b.order; if (b.ni) m.layers.set(2); root.add(m); }
    return buckets.size;
  }
  // what still moves (the squad's parts, the floor and the walls, the crystal): each vertex its solid's colour; what carries no line goes to layer 2, which the line's drawing leaves out
  function tagInk(root) { root.traverse(o => { if (o.isSprite || o.isLine || o.isPoints) { o.layers.set(2); return; } if (!o.isMesh || (o.geometry.attributes.idc && !o.geometry.userData.ink)) return; if (noInk(o)) { o.layers.set(2); return; }
    const id = idOf(holderOf(o)); let g = o.geometry; if (g.userData.ink !== undefined) { if (g.userData.ink === id) return; g = o.geometry = g.clone(); }
    const n = g.attributes.position.count, a = new Float32Array(n * 3), set = (i, c) => { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; }, base = idCol(id); for (let i = 0; i < n; i++) set(i, base);
    if (o.userData.inkIds && g.groups.length) for (const gr of g.groups) { const c = idCol(id + (o.userData.inkIds[gr.materialIndex] || 0)); for (let i = gr.start; i < gr.start + gr.count; i++) set(g.index ? g.index.getX(i) : i, c); }
    g.setAttribute('idc', new T.BufferAttribute(a, 3)); g.userData.ink = id; }); }
  // a form's parts that never move against their parent (found by posing it many ways and watching) are merged with that parent's other still parts
  function mergeRigid(holder) { const f = holder.userData.form; if (!f || !f.B.update) return; const nodes = [], first = new Map(); f.B.g.traverse(o => nodes.push(o));
    for (const t of [0, 0.37, 0.91, 1.7, 2.9, 4.3]) for (const act of [0, 0.25, 0.5, 0.75, 1]) { f.B.update(t, act); for (const o of f.hidden) o.visible = false;
      for (const o of nodes) { o.updateMatrix(); const e = o.matrix.elements, a = first.get(o); if (!a) { first.set(o, { e: e.slice(), v: o.visible }); continue; } if (a.v !== o.visible) o.userData.dynamic = true; else for (let i = 0; i < 16; i++) if (Math.abs(a.e[i] - e[i]) > 1e-5) { o.userData.dynamic = true; break; } } }
    f.B.update(0.6, 0); for (const o of f.hidden) o.visible = false;
    const roots = [holder].concat(nodes.filter(o => o.userData.dynamic && o.children.length)); for (const r of roots) mergeStill(r); }
  const before = (() => { let n = 0; scene.traverse(o => { if (o.isMesh && shownChain(o)) n++; }); return n; })();
  mergeStill(world.g); mergeStill(marks); mergeStill(biteOut); mergeStill(lunge); for (const k of ANTS) mergeStill(cast.parts[k]); for (const k of SQUAD) mergeRigid(cast.parts[k]);
  tagInk(scene);
  const after = (() => { let n = 0; scene.traverse(o => { if (o.isMesh && shownChain(o)) n++; }); return n; })();
  const count = root => { let n = 0; root.traverse(o => { if (o.isMesh) n++; }); return n; }, parts = { room: count(world.g), squad: SQUAD.map(k => k + ' ' + count(cast.parts[k])).join(', '), ants: ANTS.reduce((a, k) => a + count(cast.parts[k]), 0), marks: count(marks) };

  // ── the camera: the game's own angle; a finger turns it, two fingers come nearer ──
  const cam = new T.PerspectiveCamera(22, 1, 1, 100), orbit = { az: 45, el: 33, dist: 23, target: [13.25, 0.35, 20.3], touched: -1e9, sway: 1 }; cam.layers.enable(2);
  function place(t) { orbit.sway += ((t - orbit.touched > 6 ? 1 : 0) - orbit.sway) * 0.04; const az = (orbit.az + Math.sin(t * 0.22) * 7 * orbit.sway) * Math.PI / 180, e = orbit.el * Math.PI / 180, d = orbit.dist, g = orbit.target;   // (left alone, it sways a little)
    cam.position.set(g[0] + Math.cos(az) * Math.cos(e) * d, g[1] + Math.sin(e) * d, g[2] + Math.sin(az) * Math.cos(e) * d); cam.lookAt(g[0], g[1], g[2]); cam.near = Math.max(0.2, d * 0.3); cam.far = d * 3 + 20; cam.updateProjectionMatrix(); }
  const fingers = new Map(); let pinch = 0, clock = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  canvas.addEventListener('pointerdown', e => { try { canvas.setPointerCapture(e.pointerId); } catch (x) {} fingers.set(e.pointerId, [e.clientX, e.clientY]); pinch = 0; orbit.touched = clock; e.preventDefault(); });
  canvas.addEventListener('pointermove', e => { const p = fingers.get(e.pointerId); if (!p) return; const dx = e.clientX - p[0], dy = e.clientY - p[1]; p[0] = e.clientX; p[1] = e.clientY; orbit.touched = clock;
    if (fingers.size === 1) { orbit.az = clamp(orbit.az + dx * 0.25, 8, 82); orbit.el = clamp(orbit.el + dy * 0.2, 14, 72); }   // (the room goes with the finger; kept on the side of the walls that are cut down)
    else if (fingers.size === 2) { const q = [...fingers.values()], d = Math.hypot(q[0][0] - q[1][0], q[0][1] - q[1][1]); if (pinch) orbit.dist = clamp(orbit.dist * pinch / d, 9, 34); pinch = d; } });
  for (const n of ['pointerup', 'pointercancel', 'pointerleave']) canvas.addEventListener(n, e => { fingers.delete(e.pointerId); pinch = 0; });
  canvas.addEventListener('wheel', e => { orbit.dist = clamp(orbit.dist * Math.exp(e.deltaY * 0.001), 9, 34); orbit.touched = clock; e.preventDefault(); }, { passive: false });

  // ── the ink line: the room drawn a second time in its solids' flat colours, then one pass over the screen ──
  const target = () => { const r = new T.WebGLRenderTarget(4, 4, { minFilter: T.NearestFilter, magFilter: T.NearestFilter }); if (depthOK) { r.depthTexture = new T.DepthTexture(4, 4); r.depthTexture.type = T.UnsignedIntType; } return r; };
  const rtMain = target(), rtId = target(); rtMain.texture.minFilter = rtMain.texture.magFilter = T.LinearFilter;
  const idMat = new T.ShaderMaterial({ side: T.DoubleSide, vertexShader: 'attribute vec3 idc; varying vec3 vId;\n#include <common>\nvoid main() { vId = idc;\n#include <begin_vertex>\n#include <project_vertex>\n}', fragmentShader: 'varying vec3 vId; void main() { gl_FragColor = vec4(vId, 1.0); }' });
  const comp = new T.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { tMain: { value: rtMain.texture }, tId: { value: rtId.texture }, tDepth: { value: depthOK ? rtId.depthTexture : null }, res: { value: new T.Vector2(4, 4) }, ink: { value: lin('#16303a') }, thick: { value: 1.6 }, near: { value: 1 }, far: { value: 100 }, dK: { value: 0.02 }, useDepth: { value: depthOK ? 1 : 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tMain, tId, tDepth; uniform vec2 res; uniform vec3 ink; uniform float thick, near, far, dK, useDepth; varying vec2 vUv;
    float lin(vec2 uv) { float z = texture2D(tDepth, uv).x; return (2.0 * near * far) / (far + near - (z * 2.0 - 1.0) * (far - near)); }
    vec3 srgb(vec3 c) { return mix(c * 12.92, pow(c, vec3(1.0 / 2.4)) * 1.055 - 0.055, step(vec3(0.0031308), c)); }
    void main() { vec2 e = thick / res, uA = vUv + e, uB = vUv - e, uC = vUv + e * vec2(1.0, -1.0), uD = vUv - e * vec2(1.0, -1.0); vec3 c = texture2D(tMain, vUv).rgb;
      float k = step(0.004, length(texture2D(tId, uA).rgb - texture2D(tId, uB).rgb) + length(texture2D(tId, uC).rgb - texture2D(tId, uD).rgb));
      if (useDepth > 0.5) { float dA = lin(uA), dB = lin(uB), dC = lin(uC), dD = lin(uD); k = max(k, smoothstep(dK, dK * 2.2, (abs(dA - dB) + abs(dC - dD)) / min(min(dA, dB), min(dC, dD)))); }
      gl_FragColor = vec4(srgb(clamp(mix(c, ink, k), 0.0, 1.0)), 1.0); }` });
  const quadScene = new T.Scene(), quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new T.Mesh(new T.PlaneGeometry(2, 2), comp); quad.frustumCulled = false; quadScene.add(quad);
  let pxW = 4, pxH = 4, sized = '';
  function resize() { const w = canvas.clientWidth || 4, h = canvas.clientHeight || 4, pr = Math.min(state.sharp, Math.max(1, window.devicePixelRatio || 1)), k = w + 'x' + h + '@' + pr; if (k === sized) return; sized = k;
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false); pxW = Math.round(w * pr); pxH = Math.round(h * pr); rtMain.setSize(pxW, pxH); rtId.setSize(pxW, pxH); comp.uniforms.res.value.set(pxW, pxH); comp.uniforms.thick.value = Math.max(1, pxW / 940); cam.aspect = w / h; }

  // ── the loop: a few seconds of the raid, over and over (for the test: not a design of the fight) ──
  const CYCLE = 4.8, pulse = (p, t0, len) => { const u = (p - t0) / len; return u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI); }, gy0 = pa.gem.position.y, sDir = [Math.cos(biteAng), Math.sin(biteAng)], span = pa.tankSpan;
  const bub = pa.bubbles.map((b, i) => ({ b, y: b.position.y, v: 0.16 + (i % 5) * 0.05 }));
  function animate(t) { const p = t % CYCLE;
    for (const [k, act] of [['player', 0], ['ram', pulse(p, 2.0, 0.7)], ['crab', pulse(p, 3.3, 0.8)], ['star', Math.max(pulse(p, 0.3, 0.6), pulse(p, 2.8, 0.6))]]) { const f = cast.parts[k].userData.form; if (f && f.B.update) { f.B.update(t + k.length * 0.37, act); for (const o of f.hidden) o.visible = false; } }
    const w = clamp(p / 1.6, 0, 1), go = p < 1.78; biteOut.visible = go; biteIn.visible = go; biteIn.scale.set(w, w, 1);                               // the bite: the shape fills, then it lands
    const l = p < 1.6 ? 0 : p < 1.74 ? (p - 1.6) / 0.14 : p < 2.1 ? 1 - (p - 1.74) / 0.36 : 0; cast.parts.soldier.position.set(U.soldier.at[0] + sDir[0] * l * 0.3, 0, U.soldier.at[1] + sDir[1] * l * 0.3);
    hit.visible = p > 2.3 && p < 2.55; lunge.visible = p > 2.4;
    for (let i = 0; i < 3; i++) { const t0 = (p > 2.4 ? 2.95 : 0.45) + i * 0.07, u = (p - t0) / 0.5, c = icicles[i]; c.visible = u > 0 && u < 1; if (c.visible) { c.position.copy(iA).lerp(iB, u); c.position.y += Math.sin(u * Math.PI) * 0.1; c.position.x += (i - 1) * 0.1 * iDir.z; c.position.z -= (i - 1) * 0.1 * iDir.x; } }
    const s = p < 3.6 ? 0 : p < 3.8 ? (p - 3.6) / 0.2 : p < 4.5 ? 1 : p < 4.7 ? 1 - (p - 4.5) / 0.2 : 0; stakes.visible = s > 0; stakes.scale.set(1, Math.max(0.001, s), 1);
    beam.visible = (t % 1.2) < 0.2;
    pa.gem.rotation.y = t * 0.6; pa.gem.position.y = gy0 + Math.sin(t * 1.3) * 0.07; for (const q of bub) q.b.position.y = span[0] + ((q.y - span[0] + t * q.v) % (span[1] - span[0])); }

  const stats = { fps: 0, ms: 0, worst: 0, draws: 0, tris: 0, frames: 0, w: 0, h: 0, webgl: gl2 ? 2 : 1, depth: depthOK, meshesBefore: before, meshesAfter: after, solids: idCount, parts };
  let last = 0, acc = 0, n = 0, worst = 0, stopped = false, raf = 0;
  // one frame's drawing: with the ink line, the room twice (as it is; then in its solids' flat colours) and one pass over the screen; without it, the room once, straight to the screen
  function draw() { resize(); animate(clock); place(clock); renderer.info.reset(); if (key && key.castShadow !== state.shadows) key.castShadow = state.shadows; renderer.shadowMap.needsUpdate = state.shadows;
    if (state.ink) { cam.layers.enable(2); renderer.setRenderTarget(rtMain); renderer.render(scene, cam);
      const bg = scene.background; scene.background = null; scene.overrideMaterial = idMat; cam.layers.set(0); renderer.setRenderTarget(rtId); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, cam); scene.overrideMaterial = null; scene.background = bg; cam.layers.enable(2);
      comp.uniforms.near.value = cam.near; comp.uniforms.far.value = cam.far; renderer.setRenderTarget(null); renderer.render(quadScene, quadCam); }
    else { renderer.setRenderTarget(null); renderer.render(scene, cam); } }
  const tell = () => { stats.draws = renderer.info.render.calls; stats.tris = renderer.info.render.triangles; stats.w = pxW; stats.h = pxH; };
  function frame(now) { if (stopped) return; raf = requestAnimationFrame(frame); loop(now); }
  function loop(now) { if (!last) last = now; const dtMs = now - last; last = now; clock += Math.min(0.1, dtMs / 1000); draw();
    stats.frames++; if (dtMs > 0 && stats.frames > 1) { acc += dtMs; n++; worst = Math.max(worst, dtMs); }
    if (opts.test) { const now2 = [biteIn.scale.x, pa.gem.rotation.y, cam.position.x]; if (stats.frames === 2) stats.first = now2; stats.last = now2; }   // (the test's: what the loop moved between its second frame and its last)
    if (acc >= 500) { stats.ms = acc / n; stats.fps = 1000 / stats.ms; stats.worst = worst; tell(); acc = 0; n = 0; worst = 0; if (opts.onStats) opts.onStats(stats, state); }
    if (opts.test && stats.frames >= opts.test) { stopped = true; cancelAnimationFrame(raf); tell();
      const gl = renderer.getContext(), px = new Uint8Array(4), seen = new Set(); for (let i = 0; i < 12; i++) for (let j = 0; j < 8; j++) { gl.readPixels(Math.floor((i + 0.5) / 12 * pxW), Math.floor((j + 0.5) / 8 * pxH), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); seen.add(px[0] + ',' + px[1] + ',' + px[2]); }
      stats.colours = seen.size; if (opts.onDone) opts.onDone(stats, state); } }
  const api = { stats, state, scene, room: world.g, orbit, set(k, v) { state[k] = v; sized = ''; if (opts.onStats) opts.onStats(stats, state); }, stop() { stopped = true; cancelAnimationFrame(raf); }, start() { stopped = false; last = 0; raf = requestAnimationFrame(frame); },
    step(dt) { stopped = true; cancelAnimationFrame(raf); clock += dt; draw(); tell(); } };   // (step: one frame, the clock moved on by hand: for a recording)
  // (the test's frames are stepped here, a tenth of a second apart on a clock of their own: a headless browser's frame clock runs at no steady rate, and a test must not depend on it)
  if (opts.test) { for (let i = 0; i < opts.test && !stopped; i++) loop(100 * (i + 1)); } else api.start();
  return api;
})();
