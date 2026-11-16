// THE LIVE TEST PAGE (design/style-evolution/live; a test page, lab3d/, not the game). The owner, 2026-11-16, of round 2's direction 1 (CRYSTAL LAB 3D): which piece first?
// "Live 3D test room": the Crystal Chamber running in real 3D in that look, with a frame-rate readout, to try on both iPads. Then, having seen it run ("Wow, that's exciting. I'd
// love to see more"), asked what to see next, all three: "Walk the lab floor", "A fight at the new pace", "A battle camera".
// This file is the last part of the bundle (tools/lab3d.js): the forms' and props' models, the round 2 kit, chamber and styles, the lab floor (floor.js) and its ways (walk.js)
// come before it, in one function, so the look is the very code that drew picture 1 (STYLES.lab). What is here:
//   CHEAP TO DRAW    everything that stands still is merged, one mesh a material a room; each solid's own flat colour for the ink line is carried in its vertices (`idc`);
//                    the marks on the floor, the bars and the numbers are each one mesh, rewritten every frame; the shadows are drawn every other frame
//   WALK THE FLOOR   tap the floor: the cube walks there (walk.js) and the squad follows in its steps; the walls in front of the room you are in sink
//   A FIGHT          ants come up in waves for the Crystal; the squad and the sentries fight them. EVERY BLOW IS MARKED ON THE FLOOR BEFORE IT LANDS: its shape, filling; it
//                    lands on whoever stands in the shape when it is full. PACE is the fight's speed (×1 is the game's own for what is the game's: the ants' speeds, health and
//                    power, js/species.js, and the bite's two beats, js/combat.js COMBAT.bite); while a fight is on, everything runs at that pace
//   THE CAMERA       is always on the cube. A finger turns and tilts it, two fingers come nearer, and CAMERA swings it between two angles, NEAR and FAR; it never moves by
//                    itself. (Asked for as "A battle camera", it came down to a fight by itself, AUTO; the owner, having tried it, 2026-11-16: "it automatically zooms into
//                    action that happens across the map, and that interferes with the auto camera mode, which I don't know. Just make it to where it's always near the player,
//                    and the player can change the angle of it". AUTO is taken out.)
// The fight is a TEST OF PACE AND SIGNALS. Its rules and every number marked "stand-in" below are the agent's, for this page; none is a decision about the game.
// In scope: T, map (export.js's JSON with `lab`), opts = { canvas, gl1, test, skip, walk, sharp, ink, shadows, cam, pace, raid, chunk, onStats(stats, state), onHud(hud), onDone(stats, state) },
// and everything the kit, the chamber, the styles, the floor and the walk declare.
const LIVE = (function () {
  const S = STYLES.lab, canvas = opts.canvas, PACES = [1, 0.8, 0.6, 0.4], CAMS = ['far', 'near'];
  const state = { ink: opts.ink !== false, shadows: opts.shadows !== false, sharp: opts.sharp || 1.5, cam: CAMS.includes(opts.cam) ? opts.cam : 'far', pace: PACES.includes(opts.pace) ? opts.pace : 0.6, raid: opts.raid !== false };
  const renderer = new (opts.gl1 ? T.WebGL1Renderer : T.WebGLRenderer)({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const gl2 = renderer.capabilities.isWebGL2, depthOK = gl2 || !!renderer.extensions.get('WEBGL_depth_texture');
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.NoToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap; renderer.shadowMap.autoUpdate = false; renderer.info.autoReset = false;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = k => k * k * (3 - 2 * k), dist2 = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), TAU = Math.PI * 2;
  const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };

  // ── the lab floor and the squad, in picture 1's look ──
  const scene = new T.Scene(), P = S.palette(), U0 = RAID(), squadDefs = {}; for (const k of SQUAD) squadDefs[k] = U0[k];
  const ctx = { renderer, P, S, units: squadDefs, scene, map, portraits: {} };
  S.env(scene, ctx); scene.background = new T.Color('#0d1d26');   // (as it is written: the picture is drawn in the colours the screen shows, see the ink line below)
  const world = buildLabFloor(map.lab, P); ctx.world = world; scene.add(world.g);
  const cast = buildCast(P, squadDefs); ctx.cast = cast; scene.add(cast.g);
  S.world(world, scene, ctx); world.settle(); S.cast(cast, scene, ctx); S.lights(scene, ctx);
  let key = null; scene.traverse(o => { if (o.isDirectionalLight && o.castShadow) key = o; });
  const walk = makeWalk(world), pa = world.parts, CR = world.crystal || [11.5, 15.5];
  // the glow round the Crystal: its soft disc from numbers, not from a canvas's gradient (an iPad's canvas dithers a gradient, and the glow drew as a ring of dots)
  scene.traverse(o => { if (!o.isSprite) return; const N = 64, d = new Uint8Array(N * N * 4); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = Math.hypot((x + 0.5) / N - 0.5, (y + 0.5) / N - 0.5) * 2, a = r < 0.35 ? 1 - 0.55 * r / 0.35 : 0.45 * Math.max(0, 1 - (r - 0.35) / 0.65), i = (y * N + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(a * 255); }
    const tex = new T.DataTexture(d, N, N, T.RGBAFormat); tex.magFilter = tex.minFilter = T.LinearFilter; tex.needsUpdate = true; o.material.map = tex; o.material.needsUpdate = true; });

  // ── cheap to draw ──
  let idCount = 0;
  const idMat = new T.ShaderMaterial({ side: T.DoubleSide, vertexShader: 'attribute vec3 idc; varying vec3 vId;\n#include <common>\nvoid main() { vId = idc;\n#include <begin_vertex>\n#include <project_vertex>\n}', fragmentShader: 'varying vec3 vId; void main() { gl_FragColor = vec4(vId, 1.0); }' });   // (the ink line's drawing: each solid in its own flat colour)
  idMat.shadowSide = T.BackSide;
  const keyIds = {}, idOf = h => { if (h.userData._ink === undefined) { const k = h.userData.inkKey; h.userData._ink = k ? (keyIds[k] || (keyIds[k] = ++idCount * 3)) : ++idCount * 3; } return h.userData._ink; };   // (inkKey: many meshes that are one solid: the walls, the floors)
  const idCol = id => [((id * 67 + 13) % 251) / 251, ((id * 131 + 7) % 241) / 241, ((id * 29 + 101) % 239) / 239];
  const holderOf = o => { let root = null; for (let q = o; q; q = q.parent) if (q.userData.inkGroup) root = q; return root || o; };
  const noInk = o => { for (let q = o; q; q = q.parent) if (q.userData.noInk) return true; return [].concat(o.material).some(m => (m.userData && m.userData.noInk) || (m.transparent && m.opacity < 0.3)); };
  const sig = m => m.map || m.emissiveMap || m.alphaMap ? m.uuid : m.isMeshBasicMaterial ? ['b', m.color.getHex(), m.opacity, m.transparent, m.blending, m.depthWrite, m.side, m.polygonOffset].join(',')
    : m.isMeshToonMaterial ? ['t', m.color.getHex(), m.emissive.getHex(), m.emissiveIntensity, m.opacity, m.transparent, m.depthWrite, m.side, m.vertexColors, m.gradientMap ? m.gradientMap.uuid : 0].join(',') : m.uuid;   // (two plain materials of one colour are one material)
  // every still mesh under root as one mesh a material, in root's own space; each vertex carries its solid's colour for the ink line. Plain materials (no picture, not see-through,
  // not glowing of themselves) that differ only in colour become ONE material, the colour carried in the vertices
  const plain = m => !m.map && !m.emissiveMap && !m.alphaMap && !m.transparent && (m.isMeshBasicMaterial || (m.isMeshToonMaterial && (m.emissive.r + m.emissive.g + m.emissive.b) * m.emissiveIntensity < 0.004));
  // o.chunk: a big room's meshes are kept in squares of that many tiles (by where each thing stands, counted from o.from), so what is out of the camera's sight is not drawn.
  // o.copy: the ink line's drawing of the room needs no materials, only each solid's colour, and the shadows' drawing needs only its shape: so the room gets ONE plain copy a
  // square for those two drawings (layer 3), and its meshes by material (layer 1) are left out of them: one draw a square there, not one a material
  function dropArray() { this.array = null; }
  function mergeStill(root, o2) {
    const chunk = o2 && o2.chunk, from = o2 && o2.from, copies = o2 && o2.copy ? new Map() : null;
    root.updateMatrixWorld(true); const inv = new T.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map(), gone = [], v = new T.Vector3();
    root.traverse(o => { if (!o.isMesh || o.isInstancedMesh || !shownChain(o)) return; for (let q = o; q && q !== root; q = q.parent) if (q.userData.dynamic) return; if (o.userData.dynamic) return;
      const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, mats = [].concat(o.material), pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv, col = geo.attributes.color;
      const groups = Array.isArray(o.material) && geo.groups.length ? geo.groups : [{ start: 0, count: pos.count, materialIndex: 0 }];
      const m4 = new T.Matrix4().multiplyMatrices(inv, o.matrixWorld), n3 = new T.Matrix3().getNormalMatrix(m4), flip = m4.determinant() < 0, ni = noInk(o), id = ni ? 0 : idOf(holderOf(o));
      let where = ''; if (chunk) { if (!geo.boundingBox) geo.computeBoundingBox(); geo.boundingBox.getCenter(v).applyMatrix4(m4); where = '|' + Math.floor((v.x - (from ? from[0] : 0)) / chunk) + ',' + Math.floor((v.z - (from ? from[1] : 0)) / chunk); }
      for (const gr of groups) { const mat = mats[gr.materialIndex] || mats[0], paint = plain(mat), k = (paint ? [mat.type, mat.side, mat.depthWrite, mat.toneMapped, mat.polygonOffset, mat.gradientMap ? mat.gradientMap.uuid : 0].join(',') : sig(mat)) + '|' + (ni ? 1 : 0) + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0) + '|' + (o.renderOrder || 0) + where;
        let b = buckets.get(k); if (!b) { let m2 = mat; if (paint) { m2 = mat.clone(); m2.color.setRGB(1, 1, 1); m2.vertexColors = true; } b = { mat: m2, ni, cast: o.castShadow, recv: o.receiveShadow, order: o.renderOrder || 0, pos: [], nor: [], uv: [], col: [], idc: [], needUv: !!(mat.map || mat.emissiveMap), needCol: paint || !!mat.vertexColors }; buckets.set(k, b); }
        const tint = paint ? mat.color : null, own = mat.vertexColors ? col : null;
        const c = idCol(id + (o.userData.inkIds ? o.userData.inkIds[gr.materialIndex] || 0 : 0));
        let cp = null; if (copies && !ni) { cp = copies.get(where); if (!cp) copies.set(where, cp = { pos: [], idc: [] }); }
        const push = i => { v.fromBufferAttribute(pos, i).applyMatrix4(m4); b.pos.push(v.x, v.y, v.z); if (cp) { cp.pos.push(v.x, v.y, v.z); cp.idc.push(c[0], c[1], c[2]); } else b.idc.push(c[0], c[1], c[2]);
          if (nor) { v.fromBufferAttribute(nor, i).applyMatrix3(n3).normalize(); b.nor.push(v.x, v.y, v.z); } else b.nor.push(0, 1, 0);
          if (b.needUv) b.uv.push(uv ? uv.getX(i) : 0, uv ? uv.getY(i) : 0); if (b.needCol) b.col.push((own ? own.getX(i) : 1) * (tint ? tint.r : 1), (own ? own.getY(i) : 1) * (tint ? tint.g : 1), (own ? own.getZ(i) : 1) * (tint ? tint.b : 1)); };
        for (let i = gr.start; i + 2 < gr.start + gr.count; i += 3) { push(i); push(flip ? i + 2 : i + 1); push(flip ? i + 1 : i + 2); } }
      gone.push(o); });
    for (const o of gone) o.parent.remove(o);
    const attr = (list, n) => { const a = new T.Float32BufferAttribute(list, n); if (o2 && o2.copy) a.onUpload(dropArray); return a; };   // (a room's own: not kept in memory once it is on the graphics card)
    for (const b of buckets.values()) { if (!b.pos.length) continue; const g = new T.BufferGeometry(); g.setAttribute('position', attr(b.pos, 3)); g.setAttribute('normal', attr(b.nor, 3)); if (b.needUv) g.setAttribute('uv', attr(b.uv, 2)); if (b.needCol) g.setAttribute('color', attr(b.col, 3)); if (b.idc.length) g.setAttribute('idc', attr(b.idc, 3)); g.computeBoundingSphere();
      const m = new T.Mesh(g, b.mat); m.castShadow = b.cast; m.receiveShadow = b.recv; m.renderOrder = b.order; m.userData.merged = true; if (b.ni) m.layers.set(2); else if (copies) m.layers.set(1); root.add(m); }
    if (copies) for (const cp of copies.values()) { const g = new T.BufferGeometry(); g.setAttribute('position', attr(cp.pos, 3)); g.setAttribute('idc', attr(cp.idc, 3)); g.computeBoundingSphere(); const m = new T.Mesh(g, idMat); m.layers.set(3); m.castShadow = true; m.userData.merged = true; root.add(m); }
    return buckets.size;
  }
  // what still moves (the squad's parts, the crystal): each vertex its solid's colour; what carries no line goes to layer 2, which the line's drawing leaves out
  function tagInk(root) { root.traverse(o => { if (o.isSprite || o.isLine || o.isPoints) { o.layers.set(2); return; } if (!o.isMesh || o.userData.merged || (o.geometry.attributes.idc && o.geometry.userData.ink === undefined)) return; if (noInk(o)) { o.layers.set(2); return; }
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
  const CHUNK = opts.chunk || 7;   // (tiles: smaller, fewer triangles a frame and more draws; ?chunk= in the address tries another)
  const countMeshes = () => { let n = 0; scene.traverse(o => { if (o.isMesh && shownChain(o)) n++; }); return n; };
  const before = countMeshes();

  // ── THE ANTS: a body a class, in five poses (four steps of its walk; its jaws wide, a bite on its way); the ants of a class share its shapes ──
  const ANT_POSES = [{ walk: 0 }, { walk: 0.25 }, { walk: 0.5 }, { walk: 0.75 }, { walk: 0.3, open: 0.3 }], antKits = {};
  function antKit(cls, size) { const k = cls + size; if (antKits[k]) return antKits[k]; const root = new T.Group(), poses = ANT_POSES.map(p => buildAnt(P, Object.assign({ cls, size }, p))); root.userData.inkGroup = true; for (const g of poses) root.add(g);
    toonify(root, ctx.grad, { sat: 1.1 }); for (const g of poses) mergeStill(g); return (antKits[k] = { poses, info: poses[0].userData.ant }); }
  function antBody(cls, size) { const kit = antKit(cls, size), holder = new T.Group(), id = ++idCount * 3, c = idCol(id); holder.userData.inkGroup = true; holder.userData._ink = id;
    const poses = kit.poses.map(pg => { const g = new T.Group(); for (const m of pg.children) { let geo = m.geometry; if (m.layers.mask !== 4) { geo = new T.BufferGeometry(); for (const a of Object.keys(m.geometry.attributes)) if (a !== 'idc') geo.setAttribute(a, m.geometry.attributes[a]);
          const n = m.geometry.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } geo.setAttribute('idc', new T.BufferAttribute(a, 3)); }
        const q = new T.Mesh(geo, m.material); q.castShadow = m.castShadow; q.receiveShadow = m.receiveShadow; q.layers.mask = m.layers.mask; q.renderOrder = m.renderOrder; g.add(q); } g.visible = false; holder.add(g); return g; });
    holder.visible = false; scene.add(holder); return { holder, poses, info: kit.info }; }

  // ── what is in the air, made once and shown when it happens: icicles, stakes, a sentry's beam, the spark of a blow ──
  const air = new T.Group(); air.userData.noInk = true; scene.add(air);
  const iceMat = new T.MeshToonMaterial({ color: lin('#dff6ff'), emissive: lin('#7fd6ff'), emissiveIntensity: 0.8, gradientMap: ctx.grad }), UP = new T.Vector3(0, 1, 0), tmpV = new T.Vector3(), tmpW = new T.Vector3(), tmpBox = new T.Box3();
  const icicles = []; for (let i = 0; i < 6; i++) { const c = new T.Mesh(new T.ConeGeometry(0.05, 0.36, 5), iceMat); c.castShadow = true; c.visible = false; air.add(c); icicles.push({ m: c, on: false }); }
  const stakeMat = new T.MeshToonMaterial({ color: lin('#ff9ccc'), emissive: lin('#ff5fa8'), emissiveIntensity: 0.5, gradientMap: ctx.grad }), stakeSets = [];
  for (let k = 0; k < 2; k++) { const g = new T.Group(); for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.4, h = 0.34 + (i % 3) * 0.1, c = new T.Mesh(new T.ConeGeometry(0.075, h, 5), stakeMat); c.position.set(Math.cos(a) * 0.82, h / 2, Math.sin(a) * 0.82); c.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22); c.castShadow = true; g.add(c); }
    g.userData.inkGroup = true; g.userData.dynamic = true; scene.add(g); mergeStill(g); g.visible = false; stakeSets.push({ g, t: -1 }); }
  const beams = []; for (let k = 0; k < 2; k++) { const g = new T.Group(), core = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 1, 6), glowMat('#ffffff', 1)), halo = new T.Mesh(new T.CylinderGeometry(0.057, 0.057, 1, 6), glowMat(PAL.cyan, 1, { transparent: true, opacity: 0.45, depthWrite: false })); g.add(halo); g.add(core); g.visible = false; air.add(g); beams.push({ g, t: -1 }); }
  const sparks = []; for (let k = 0; k < 6; k++) { const g = new T.Group(); g.add(burst([0, 0, 0], '#eaffff', 10, 0.36, { w: 0.016 })); g.userData.dynamic = true; air.add(g); mergeStill(g); g.visible = false; sparks.push({ g, t: -1 }); }

  // ── marks, bars and numbers: each ONE mesh whose triangles are written again every frame ──
  // (a vertex at a time, straight into the arrays: three vertices are a triangle. Nothing is made anew each frame)
  function Batch(maxTris, mat, uvs) { const max = maxTris * 3, pos = new Float32Array(max * 3), col = new Float32Array(max * 4), uv = uvs ? new Float32Array(max * 2) : null, geo = new T.BufferGeometry(), aP = new T.BufferAttribute(pos, 3), aC = new T.BufferAttribute(col, 4), aU = uv ? new T.BufferAttribute(uv, 2) : null;
    aP.setUsage(T.DynamicDrawUsage); aC.setUsage(T.DynamicDrawUsage); geo.setAttribute('position', aP); geo.setAttribute('color', aC); if (aU) { aU.setUsage(T.DynamicDrawUsage); geo.setAttribute('uv', aU); }
    const mesh = new T.Mesh(geo, mat); mesh.frustumCulled = false; mesh.layers.set(2); let n = 0;
    return { mesh, count: () => n / 3, begin() { n = 0; },
      v(x, y, z, k, al, s, t) { if (n >= max) return; let i = n * 3; pos[i] = x; pos[i + 1] = y; pos[i + 2] = z; i = n * 4; col[i] = k.r; col[i + 1] = k.g; col[i + 2] = k.b; col[i + 3] = al; if (uv) { uv[n * 2] = s; uv[n * 2 + 1] = t; } n++; },
      end() { n -= n % 3; geo.setDrawRange(0, n); for (const a of [aP, aC, aU]) if (a) { a.updateRange.offset = 0; a.updateRange.count = Math.max(a.itemSize * 3, n * a.itemSize); a.needsUpdate = true; } } }; }
  const markMat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2 });
  const FM = Batch(5200, markMat); scene.add(FM.mesh);   // the floor's marks: in the room, under whoever stands on them
  const over = new T.Scene(), barMat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, side: T.DoubleSide });
  const BR = Batch(700, barMat); BR.mesh.layers.set(0); over.add(BR.mesh);   // the bars and the numbers: over the finished picture, so no ink line crosses them
  const GLYPHS = '0123456789-+', GW = 56, GH = 76, numCanvas = document.createElement('canvas'); numCanvas.width = GW * GLYPHS.length; numCanvas.height = GH;
  const numTex = new T.CanvasTexture(numCanvas); numTex.encoding = T.sRGBEncoding; numTex.generateMipmaps = false; numTex.minFilter = numTex.magFilter = T.LinearFilter;
  function drawGlyphs() { const g = numCanvas.getContext('2d'); g.clearRect(0, 0, numCanvas.width, numCanvas.height); g.font = '58px "L3 Title", "Arial Black", "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    for (let i = 0; i < GLYPHS.length; i++) { const x = i * GW + GW / 2, y = GH / 2 + 2; g.lineWidth = 12; g.strokeStyle = '#16303a'; g.strokeText(GLYPHS[i], x, y); g.fillStyle = '#ffffff'; g.fillText(GLYPHS[i], x, y); } numTex.needsUpdate = true; }
  drawGlyphs(); if (document.fonts && document.fonts.load) document.fonts.load('58px "L3 Title"').then(drawGlyphs, () => {});   // (the page's own title face, once it has come)
  const NM = Batch(260, new T.MeshBasicMaterial({ map: numTex, vertexColors: true, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, side: T.DoubleSide }), true); NM.mesh.layers.set(0); NM.mesh.renderOrder = 2; over.add(NM.mesh);
  const C = { squad: lin(TEAM.squad), ants: lin(TEAM.ants), white: lin('#eaffff'), dark: lin('#040a0e'), ok: lin('#43e0a8'), warn: lin('#f2b13a'), bad: lin('#ff4d6a'), hurt: lin('#ff8a9c'), ghost: lin('#ffffff') };
  const Y0 = 0.014;
  // a flat four-sided piece on the floor at height y, corners a, b, c, d round it; a flat three-sided piece
  const fQuad = (ax, az, bx, bz, cx, cz, dx, dz, y, k, al) => { FM.v(ax, y, az, k, al); FM.v(bx, y, bz, k, al); FM.v(cx, y, cz, k, al); FM.v(ax, y, az, k, al); FM.v(cx, y, cz, k, al); FM.v(dx, y, dz, k, al); };
  const fTri = (ax, az, bx, bz, cx, cz, y, k, al) => { FM.v(ax, y, az, k, al); FM.v(bx, y, bz, k, al); FM.v(cx, y, cz, k, al); };
  const mRing = (x, z, r, w, k, al) => { const n = 36, r0 = r - w / 2, r1 = r + w / 2; let c0 = 1, s0 = 0; for (let i = 1; i <= n; i++) { const a = i / n * TAU, c1 = Math.cos(a), s1 = Math.sin(a); fQuad(x + c0 * r0, z + s0 * r0, x + c1 * r0, z + s1 * r0, x + c1 * r1, z + s1 * r1, x + c0 * r1, z + s0 * r1, Y0 + 0.002, k, al); c0 = c1; s0 = s1; } };
  const mFan = (x, z, r, a0, a1, k, al, y) => { const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 0.12)), h = y || Y0; let c0 = Math.cos(a0), s0 = Math.sin(a0); for (let i = 1; i <= n; i++) { const a = a0 + (a1 - a0) * i / n, c1 = Math.cos(a), s1 = Math.sin(a); fTri(x, z, x + c0 * r, z + s0 * r, x + c1 * r, z + s1 * r, h, k, al); c0 = c1; s0 = s1; } };
  const mLine = (ax, az, bx, bz, w, k, al, y) => { const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1, nx = -dz / L * w / 2, nz = dx / L * w / 2; fQuad(ax + nx, az + nz, bx + nx, bz + nz, bx - nx, bz - nz, ax - nx, az - nz, y || Y0 + 0.003, k, al); };
  const mArc = (x, z, r, a0, a1, w, k, al) => { const n = Math.max(6, Math.ceil(Math.abs(a1 - a0) / 0.12)); for (let i = 0; i < n; i++) { const p = a0 + (a1 - a0) * i / n, q = a0 + (a1 - a0) * (i + 1) / n; mLine(x + Math.cos(p) * r, z + Math.sin(p) * r, x + Math.cos(q) * r, z + Math.sin(q) * r, w, k, al); } };
  // a blow's shape on the floor, filling as p goes 0 to 1: the whole shape faint with its outline, and the part filled so far
  const mWedge = (x, z, ang, r, half, k, p) => { mFan(x, z, r, ang - half, ang + half, k, 0.2); mFan(x, z, r * p, ang - half, ang + half, k, 0.42, Y0 + 0.002); mArc(x, z, r, ang - half, ang + half, 0.045, k, 1); mLine(x, z, x + Math.cos(ang - half) * r, z + Math.sin(ang - half) * r, 0.045, k, 1); mLine(x, z, x + Math.cos(ang + half) * r, z + Math.sin(ang + half) * r, 0.045, k, 1); };
  const mDisc = (x, z, r, k, p) => { mFan(x, z, r, 0, TAU, k, 0.2); mFan(x, z, r * p, 0, TAU, k, 0.42, Y0 + 0.002); mRing(x, z, r, 0.045, k, 1); };
  const mStrip = (ax, az, bx, bz, w, k, p) => { mLine(ax, az, bx, bz, w, k, 0.2, Y0); mLine(ax, az, ax + (bx - ax) * p, az + (bz - az) * p, w, k, 0.45, Y0 + 0.002); const dx = bx - ax, dz = bz - az, L = Math.hypot(dx, dz) || 1, nx = -dz / L * w / 2, nz = dx / L * w / 2; mLine(ax + nx, az + nz, bx + nx, bz + nz, 0.035, k, 1); mLine(ax - nx, az - nz, bx - nx, bz - nz, 0.035, k, 1); };
  const mDash = (ax, az, bx, bz, w, k, al, p) => { const L = Math.hypot(bx - ax, bz - az) || 1, ux = (bx - ax) / L, uz = (bz - az) / L, h = w * 2.6; for (let t = 0; t < L - h; t += 0.26) mLine(ax + ux * t, az + uz * t, ax + ux * Math.min(L - h, t + 0.16), az + uz * Math.min(L - h, t + 0.16), w, k, al);
    const ex = bx - ux * h, ez = bz - uz * h; fTri(bx, bz, ex - uz * h * 0.6, ez + ux * h * 0.6, ex + uz * h * 0.6, ez - ux * h * 0.6, Y0 + 0.003, k, al); if (p > 0) mLine(ax, az, ax + (bx - ax) * p, az + (bz - az) * p, w * 2.4, k, 0.3, Y0); };

  // ── THE FIGHT'S NUMBERS ──
  // The ants' are the game's own first ants (js/species.js: tiles a frame at sixty a second, health, power); the bite's two beats are the game's (js/combat.js COMBAT.bite: it rears
  // back 18 frames, lands, rests 45; reach 1.5). STAND-INS, the agent's for this page: everything of the squad's and the sentries', the lunge, the Crystal's health, the waves, how far
  // an ant notices, the hurried march.
  // ONE OF YOURS AT NO HEALTH goes the game's own way: a follower leaves, and comes back by the Crystal three seconds later with its health as it was (js/game.js: 180 frames on the
  // respawn queue); the cube is set back by the Crystal (the game's knockout: docs/PLAYER-COMBAT.md). Not the game's: the cube's bar of 100 (the game's player has three hits), and
  // that a follower come back walks to you (in the game it waits by the Crystal for you). It was the agent's own before: flattened where it stood for five seconds, then up at half.
  // The owner, 2026-11-16: "maybe the player or the models get squashed by something. I'm not sure what it is, but they get squashed on the map and then they return to normal".
  const ANT = { worker: { hp: 45, power: 7, speed: 0.024 * 60 }, scout: { hp: 60, power: 18, speed: 0.022 * 60 }, striker: { hp: 100, power: 27, speed: 0.018 * 60 }, tank: { hp: 180, power: 38, speed: 0.012 * 60 } };
  const BITE = { wind: 18 / 60, rest: 45 / 60, reach: 1.5, half: 0.42 };
  const KIT = { player: { hp: 100, speed: 3.4 },
    ram: { hp: 220, speed: 2.0, atk: { kind: 'wedge', name: 'WOBBLE SLAM', range: 1.45, reach: 1.9, half: 0.62, wind: 0.42, rest: 1.0, dmg: 30 } },
    crab: { hp: 150, speed: 1.7, atk: { kind: 'ring', name: 'STAKE RING', range: 4.2, radius: 1.0, wind: 0.6, rest: 1.5, dmg: 16 } },
    star: { hp: 120, speed: 1.8, atk: { kind: 'bolt', name: 'ICICLE VOLLEY', range: 6, wind: 12 / 60, rest: 55 / 60, dmg: 8, shots: 3, fly: 11 } } };
  const SENTRY_ATK = { kind: 'beam', range: 5.5, wind: 0.5, rest: 1.0, dmg: 10 }, LUNGE = { wind: 0.6, len: 3.2, fly: 9, from: 2.2, to: 4.6, every: 6, k: 1.2, rest: 0.9 };
  const WAVES = [['worker', 'worker', 'scout'], ['scout', 'scout', 'striker', 'worker'], ['tank', 'striker', 'worker', 'worker', 'scout']], POOL = { worker: 3, scout: 3, striker: 2, tank: 1 };   // (bodies made a class: enough for a wave setting out while one ant of the wave before is left)
  const NOTICE = 4.5, HURRY = 6, CRYSTAL_HP = 400, BACK_IN = 180 / 60, POP = 0.3, FOLLOW_GAP = 1.15, NEARBY = [[1.4, -0.7], [-0.7, 1.4], [-1.3, -0.4], [-0.4, -1.3], [1.9, -1.6], [-1.6, 1.9], [-1.5, -1.5], [2.4, -0.2], [-0.2, 2.4]];

  // ── everyone ──
  const units = [], squad = [], ants = [];
  for (const k of SQUAD) { const c = U0[k], kit = KIT[k], h = cast.parts[k]; c.key = k;
    const u = { key: k, team: 'squad', kind: 'form', name: c.name, holder: h, form: h.userData.form, x: c.at[0], y: c.at[1], ang: Math.atan2(c.face[1] - c.at[1], c.face[0] - c.at[0]), r: reach(c), top: c.top, lift: c.lift || 0, hp: kit.hp, max: kit.hp, lag: kit.hp, speed: kit.speed, atk: kit.atk || null,
      alive: true, down: 0, pop: 0, home: [c.at[0], c.at[1]], path: null, pi: 0, st: 'idle', t: 0, target: null, aim: null, think: 0, repath: 0, act: 0, jab: 0 }; units.push(u); squad.push(u); }   // (down: seconds till it is back, while it is away; home: its place by the Crystal)
  const player = squad[0], followers = squad.slice(1); for (const u of followers) u.by = [u.x - player.x, u.y - player.y];   // (by: its own place beside the cube, as picture 1 has them)
  for (const cls of Object.keys(POOL)) for (let i = 0; i < POOL[cls]; i++) { const size = cls === 'tank' ? 0.86 : 1, b = antBody(cls, size), def = { kind: 'ant', cls, size };
    const u = { key: cls + i, team: 'ants', kind: 'ant', cls, name: cls, holder: b.holder, poses: b.poses, x: 0, y: 0, ang: 0, r: reach(def), top: b.info.top, lift: 0, hp: 0, max: ANT[cls].hp, lag: 0, speed: ANT[cls].speed, power: ANT[cls].power,
      alive: false, path: null, pi: 0, st: 'idle', t: 0, target: null, aim: null, think: 0, repath: 0, moved: 0, engaged: false, entering: false, spot: null, lungeIn: 0, dying: 0, hitBy: null, jab: 0 }; units.push(u); ants.push(u); }
  const sentries = world.sentries.map(s => ({ s, x: s.at[0], y: s.at[1], ang: 0, st: 'idle', t: 0, target: null, aim: null, mz: Math.hypot(s.muzzle[0], s.muzzle[2]), my: s.muzzle[1] }));
  const crystal = { x: CR[0], y: CR[1], hp: CRYSTAL_HP, max: CRYSTAL_HP, lag: CRYSTAL_HP, team: 'squad', crystal: true, alive: true, r: world.padR, top: 2.7 };
  const everyone = units.concat([crystal]), numbers = [], trail = [], log = { marks: 0, blows: 0, hits: 0, minLead: 1e9, antsDown: 0, squadDown: 0, knockouts: 0, waves: 0, raids: 0, held: 0, fell: 0 };
  const raid = { phase: state.raid ? 'calm' : 'off', wave: 0, t: 0.6, first: true }, sim = { t: 0, scale: 1, fight: false, tap: null, room: world.roomAt(player.x, player.y), steps: 0, open: [null], still: 0, hold: 0, back: 0 };
  // the tiles round the Crystal's pad an ant can bite it from, and the tiles the raid comes up by (the arena's door)
  const spots = []; for (let x = Math.floor(CR[0] - 4); x <= Math.ceil(CR[0] + 4); x++) for (let y = Math.floor(CR[1] - 4); y <= Math.ceil(CR[1] + 4); y++) { const d = Math.hypot(x - CR[0], y - CR[1]); if (world.walkable(x, y) && d > world.padR && d < world.padR + 1.25) spots.push([x, y]); }
  const raidDoor = world.doors.find(d => d.kind === 'raid') || null, gate = [];
  if (raidDoor) for (let i = 0; i < raidDoor.L; i++) { const p = [raidDoor.m[0] + raidDoor.u[0] * (i + 0.5 - raidDoor.L / 2) - raidDoor.nr[0] * raidDoor.out * 0.5, raidDoor.m[1] + raidDoor.u[1] * (i + 0.5 - raidDoor.L / 2) - raidDoor.nr[1] * raidDoor.out * 0.5]; if (world.walkable(Math.round(p[0]), Math.round(p[1]))) gate.push({ at: p, out: [raidDoor.nr[0] * raidDoor.out, raidDoor.nr[1] * raidDoor.out] }); }

  // ── everything made: merge what stands still, give what moves its colours for the ink line ──
  for (const id of world.order) mergeStill(world.rooms[id].g, { chunk: CHUNK, from: world.rooms[id].rec.bb, copy: true }); for (const G of world.groups) mergeStill(G.g, { chunk: CHUNK * 2, copy: true }); for (const q of world.sentries) mergeStill(q.head); mergeStill(world.rest, { copy: true }); for (const k of SQUAD) mergeRigid(cast.parts[k]);
  tagInk(scene);
  // how tall each of the squad stands at rest (picture 1 has the Jelly Ram reared up for its blow, half as tall again): a bar sits just over its head
  for (const u of squad) { const box = new T.Box3(); u.holder.updateMatrixWorld(true); u.holder.traverse(o => { if (o.isMesh && shownChain(o) && (o.layers.mask & 1)) { if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); box.union(tmpBox.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld)); } }); if (box.max.y > 0.2) u.top = box.max.y; }   // (its solid parts: not a faint glow round it)
  const after = countMeshes();

  const faceTo = (u, a, dt, rate) => { const d = angDiff(a, u.ang), m = (rate || 9) * dt; u.ang += Math.abs(d) < m ? d : Math.sign(d) * m; };
  function moveAlong(u, dt, speed) { let left = speed * dt; while (u.path && u.pi < u.path.length && left > 1e-9) { const p = u.path[u.pi], dx = p[0] - u.x, dy = p[1] - u.y, d = Math.hypot(dx, dy); if (d > 1e-6) faceTo(u, Math.atan2(dy, dx), dt);
      if (d <= left) { u.x = p[0]; u.y = p[1]; left -= d; u.pi++; u.moved = (u.moved || 0) + d; } else { u.x += dx / d * left; u.y += dy / d * left; u.moved = (u.moved || 0) + left; left = 0; } }
    if (u.path && u.pi >= u.path.length) { u.path = null; return true; } return false; }
  const go = (u, to, r) => { const p = walk.route([u.x, u.y], to, r); if (p && p.length > 1) { u.path = p; u.pi = 1; return true; } u.path = null; return false; };
  const sight = (a, b) => { const d = Math.hypot(b.x - a.x, b.y - a.y), n = Math.ceil(d / 0.3); for (let i = 1; i < n; i++) { const t = i / n; if (!world.roomAt(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)) return false; } return true; };   // (no wall between: a prop does not hide one from another here)
  function number(o, n, k) { if (numbers.length > 24) numbers.shift(); const near = numbers.filter(q => q.t < 0.35 && Math.hypot(q.x - o.x, q.y - o.y) < 1.2).length; numbers.push({ x: o.x, y: o.y, h: Math.min(o.top || 1, 1.3) + 0.4 + near * 0.34, s: String(Math.round(n)), t: 0, k, j: ((near + 1) % 3 - 1) * 0.3 }); }   // (those that land together stand one over the other)
  function spark(x, h, y) { const s = sparks.find(q => q.t < 0) || sparks[0]; s.t = 0; s.g.position.set(x, h, y); }
  function hurt(o, dmg, by) { if (!o.alive || dmg <= 0) return; o.hp = Math.max(0, o.hp - dmg); log.hits++; number(o, dmg, o.team === 'ants' ? C.white : C.hurt); spark(o.x, o.crystal ? 1.4 : Math.min(0.6, (o.top || 1) * 0.6), o.y); if (by && o.kind === 'ant') o.hitBy = by;
    if (o.hp > 0 || o.crystal) return; if (o.kind === 'ant') { o.alive = false; o.dying = 0.3; o.st = 'dead'; o.path = null; o.aim = null; log.antsDown++; }
    else if (o === player) { toCrystal(o); sim.tap = null; trail.length = 0; sim.back = 2.5; sim.room = world.roomAt(o.x, o.y) || sim.room; view.snap = true; log.knockouts++; }
    else { o.down = BACK_IN; o.pop = POP; o.st = 'idle'; o.path = null; o.target = null; o.aim = null; log.squadDown++; } }
  // back by the Crystal, whole: a follower when its wait is over (it grows back in), the cube at once
  function toCrystal(u) { const at = walk.standable(u.home) ? u.home : (walk.nearest(u.home, 3) || u.home); u.x = at[0]; u.y = at[1]; u.hp = u.lag = u.max; u.down = 0; u.pop = u === player ? 0 : POP; u.path = null; u.target = null; u.aim = null; u.st = 'idle'; }
  const standing = u => u.alive && !(u.down > 0);
  // a blow lands: on whoever of the other side stands in its shape NOW (so stepping out of a shape before it fills is stepping out of the blow)
  function land(u, a, foes) { log.blows++; log.minLead = Math.min(log.minLead, a.lead);
    if (a.kind === 'wedge') { for (const f of foes) { if (!standing(f)) continue; const d = dist2(u, f); if (d <= a.reach + f.r * 0.5 && (d < 0.3 || Math.abs(angDiff(Math.atan2(f.y - u.y, f.x - u.x), a.ang)) <= a.half + 0.12)) hurt(f, a.dmg, u); }
      if (a.crystal && crystal.alive && dist2(u, crystal) <= a.reach + crystal.r) hurt(crystal, a.dmg, u); }
    else if (a.kind === 'ring') { for (const f of foes) if (standing(f) && Math.hypot(f.x - a.x, f.y - a.y) <= a.radius + f.r * 0.5) hurt(f, a.dmg, u); const s = stakeSets.find(q => q.t < 0) || stakeSets[0]; s.t = 0; s.g.position.set(a.x, 0, a.y); }
    else if (a.kind === 'bolt') { for (let i = 0; i < a.shots; i++) { const c = icicles.find(q => !q.on); if (!c) break; c.on = true; c.wait = i * 0.07; c.u = 0; c.from = [u.x, 0.62 + (u.lift || 0), u.y]; c.to = a.target; c.dmg = a.dmg; c.by = u; c.side = i - (a.shots - 1) / 2; c.fly = a.fly; } }
    else if (a.kind === 'beam') { const f = a.target; if (f && standing(f)) hurt(f, a.dmg, null); const b = beams.find(q => q.t < 0) || beams[0]; b.t = 0; b.from = a.from; b.to = [f ? f.x : a.x, 0.25, f ? f.y : a.y]; } }

  // ── THE RAID: waves, one after the other ──
  function spawn(cls, at, hurry) { const u = ants.find(a => a.cls === cls && !a.alive && a.dying <= 0) || ants.find(a => a.cls === cls && !a.alive); if (!u) return null; Object.assign(u, { x: at[0], y: at[1], hp: u.max, lag: u.max, alive: true, st: 'idle', t: 0, target: null, aim: null, path: null, think: 0, repath: 0, engaged: !hurry, entering: false, lungeIn: 2, hitBy: null, moved: 0, jab: 0, dying: 0 });
    u.spot = spots.length ? spots[(ants.indexOf(u) * 3 + raid.wave) % spots.length] : [Math.round(CR[0] + 2), Math.round(CR[1])]; u.ang = Math.atan2(CR[1] - u.y, CR[0] - u.x); return u; }
  function sendWave() { raid.wave++; log.waves++; const list = WAVES[raid.wave - 1];
    if (raid.first) { raid.first = false; const near = [[21, 22], [22, 23], [21, 24], [23, 22], [23, 24]].filter(p => world.walkable(p[0], p[1])); list.forEach((c, i) => spawn(c, near[i % Math.max(1, near.length)] || [20, 22], false)); return; }   // (the first wave of all starts at the chamber's door, so the page opens on a fight)
    list.forEach((c, i) => { const q = gate.length ? gate[i % gate.length] : null, row = gate.length ? Math.floor(i / gate.length) : 0, u = spawn(c, q ? [q.at[0] + q.out[0] * (1.5 + row * 1.1), q.at[1] + q.out[1] * (1.5 + row * 1.1)] : [20, 38], true); if (u && q) { u.path = [[q.at[0], q.at[1]]]; u.pi = 0; u.entering = true; u.ang = Math.atan2(-q.out[1], -q.out[0]); } }); }
  function restore() { crystal.hp = crystal.lag = crystal.max; crystal.alive = true; for (const u of squad) { if (u.down > 0) toCrystal(u); u.hp = u.lag = u.max; } }
  const fall = a => { a.alive = false; a.dying = 0.3; a.st = 'dead'; a.aim = null; a.path = null; };
  function tickRaid(dt) {
    let alive = 0; for (const a of ants) if (a.alive) alive++;
    if (!state.raid) { if (raid.phase !== 'off') { for (const a of ants) if (a.alive) fall(a); raid.phase = 'off'; raid.wave = 0; restore(); } return; }
    if (raid.phase === 'off') { raid.phase = 'calm'; raid.t = 1; raid.wave = 0; }
    if (crystal.hp <= 0 && raid.phase !== 'fell') { raid.phase = 'fell'; raid.t = 6; log.fell++; crystal.alive = false; for (const a of ants) if (a.alive) fall(a); return; }
    if (raid.phase === 'calm') { raid.t -= dt; if (raid.t <= 0) { raid.wave = 0; log.raids++; sendWave(); raid.phase = 'wave'; } }
    else if (raid.phase === 'wave') { if (raid.wave < WAVES.length) { if (!alive || (alive <= 1 && ants.every(a => !a.alive || a.engaged))) sendWave(); } else if (!alive) { raid.phase = 'held'; raid.t = 6; log.held++; } }   // (the next wave sets out when one ant of this one is left)
    else { raid.t -= dt; if (raid.t <= 0) { restore(); raid.phase = 'calm'; raid.t = 7; raid.wave = 0; } }
  }

  // ── one step of everything (a sixtieth of a second) ──
  function windUp(u, a) { u.st = 'wind'; u.t = 0; u.aim = a; u.path = null; log.marks++; }
  function tickBlow(u, dt) {   // the wind-up, the blow and the rest after it, the same for everyone: true while it is busy with a blow
    if (u.st === 'wind') { u.t += dt; faceTo(u, u.aim.ang, dt, 14); if (u.t >= u.aim.wind) { u.aim.lead = u.t; land(u, u.aim, u.team === 'ants' ? squad : ants); u.st = 'rest'; u.t = 0; u.jab = 0.3; } return true; }
    if (u.st === 'rest') { u.t += dt; if (u.t >= u.aim.rest) { u.st = 'idle'; u.aim = null; } return true; }
    return false; }
  function tickAnt(u, dt, k) {
    if (!u.alive) { if (u.dying > 0) u.dying -= dt / k; return; } if (u.jab > 0) u.jab -= dt; if (u.lungeIn > 0) u.lungeIn -= dt;
    if (u.entering) { if (moveAlong(u, dt / k, HURRY)) u.entering = false; return; }   // (up from the arena, onto the floor)
    if (!u.engaged) { if (Math.hypot(u.x - CR[0], u.y - CR[1]) < 9 || squad.some(s => standing(s) && dist2(u, s) < NOTICE)) { u.engaged = true; u.path = null; } else { if (!u.path) go(u, u.spot, 3); moveAlong(u, dt / k, HURRY); return; } }   // (the march up is hurried, and no part of the fight's pace)
    if (u.st === 'lunge') { const a = u.aim, d = LUNGE.fly * dt; u.x += Math.cos(a.ang) * d; u.y += Math.sin(a.ang) * d; a.gone += d; u.moved += d; for (const s of squad) if (standing(s) && !a.struck.includes(s) && dist2(u, s) < 0.6 + s.r * 0.5) { a.struck.push(s); hurt(s, a.dmg, u); }
      if (a.gone >= a.len) { u.st = 'rest'; u.t = 0; } return; }
    if (u.st === 'aim') { u.t += dt; faceTo(u, u.aim.ang, dt, 14); if (u.t >= LUNGE.wind) { log.blows++; log.minLead = Math.min(log.minLead, u.t); u.st = 'lunge'; u.aim.gone = 0; u.aim.struck = []; u.lungeIn = LUNGE.every; } return; }
    if (tickBlow(u, dt)) return;
    u.think -= dt; if (u.think <= 0) { u.think = 0.4; let best = null, bd = NOTICE; if (u.hitBy && standing(u.hitBy) && dist2(u, u.hitBy) < 8) best = u.hitBy; else for (const s of squad) { const d = dist2(u, s); if (standing(s) && d < bd) { bd = d; best = s; } } if (best !== u.target) u.repath = 0; u.target = best; }
    const tg = u.target && standing(u.target) ? u.target : null;
    if (tg) { const d = dist2(u, tg), a = Math.atan2(tg.y - u.y, tg.x - u.x);
      if (d <= BITE.reach * 0.85 + tg.r * 0.3) return windUp(u, { kind: 'wedge', ang: a, reach: BITE.reach + (u.cls === 'tank' ? 0.3 : 0), half: BITE.half, wind: BITE.wind, rest: BITE.rest, dmg: u.power });
      if (u.cls === 'striker' && u.lungeIn <= 0 && d >= LUNGE.from && d <= LUNGE.to) { let len = LUNGE.len; while (len > 1 && !walk.clear([u.x, u.y], [u.x + Math.cos(a) * len, u.y + Math.sin(a) * len], 0.2)) len -= 0.4; if (len > 1.6) { u.st = 'aim'; u.t = 0; u.path = null; u.aim = { kind: 'lunge', ang: a, len, dmg: Math.round(u.power * LUNGE.k), wind: LUNGE.wind, rest: LUNGE.rest }; log.marks++; return; } }
      u.repath -= dt; if (u.repath <= 0 || !u.path) { u.repath = 0.4; go(u, [tg.x, tg.y], 2); } moveAlong(u, dt, u.speed); return; }
    if (crystal.alive && Math.hypot(u.x - CR[0], u.y - CR[1]) <= world.padR + 1.3) return windUp(u, { kind: 'wedge', ang: Math.atan2(CR[1] - u.y, CR[0] - u.x), reach: BITE.reach, half: BITE.half, wind: BITE.wind, rest: BITE.rest, dmg: u.power, crystal: true });
    if (!u.path) go(u, u.spot, 3); moveAlong(u, dt, u.speed);
  }
  function tickFollower(u, i, dt) {
    if (u.down > 0) { u.down -= dt; if (u.down <= 0) toCrystal(u); return; } u.act += ((u.st === 'wind' ? 0.35 + 0.65 * u.t / u.aim.wind : u.st === 'rest' && u.t < 0.25 ? 1 - u.t / 0.25 : 0) - u.act) * Math.min(1, dt * 18);
    if (tickBlow(u, dt)) return;
    u.think -= dt; if (u.think <= 0) { u.think = 0.35; let best = null, bd = 1e9; for (const a of ants) { if (!a.alive || !a.engaged) continue; const d = dist2(u, a); if ((d < 7.5 || dist2(player, a) < 7.5 || (Math.hypot(a.x - CR[0], a.y - CR[1]) < world.padR + 2.2 && Math.hypot(u.x - CR[0], u.y - CR[1]) < 16)) && d < bd) { bd = d; best = a; } } if (best !== u.target) u.repath = 0; u.target = best; }
    const tg = u.target && u.target.alive ? u.target : null, A = u.atk;
    if (tg) { const d = dist2(u, tg), a = Math.atan2(tg.y - u.y, tg.x - u.x), seen = A.kind === 'wedge' || sight(u, tg);
      if (d <= A.range + tg.r * 0.3 && seen) { if (A.kind === 'wedge') return windUp(u, { kind: 'wedge', ang: a, reach: A.reach, half: A.half, wind: A.wind, rest: A.rest, dmg: A.dmg });
        if (A.kind === 'ring') return windUp(u, { kind: 'ring', ang: a, x: tg.x, y: tg.y, radius: A.radius, wind: A.wind, rest: A.rest, dmg: A.dmg }); return windUp(u, { kind: 'bolt', ang: a, target: tg, wind: A.wind, rest: A.rest, dmg: A.dmg, shots: A.shots, fly: A.fly }); }
      u.repath -= dt; if (u.repath <= 0 || !u.path) { u.repath = 0.4; go(u, [tg.x, tg.y], 2); } moveAlong(u, dt, u.speed); return; }
    // no one to fight. While the cube walks: in its steps, a little behind it. Once it has stood a moment: to its own place beside it
    let slot = null; if (sim.still < 0.9) { let need = FOLLOW_GAP * (i + 1), px = player.x, py = player.y; for (let j = trail.length - 1; j >= 0 && !slot; j--) { const q = trail[j], d = Math.hypot(q[0] - px, q[1] - py); if (d >= need) slot = [px + (q[0] - px) * need / d, py + (q[1] - py) * need / d]; else { need -= d; px = q[0]; py = q[1]; } } }
    else { const fits = q => walk.standable(q) && walk.clear([player.x, player.y], q, 0.2), want = [player.x + u.by[0], player.y + u.by[1]]; slot = fits(want) ? want : null;   // (where there is no room for that: beside the cube or behind it, never between it and the camera)
      for (let j = 0; j < NEARBY.length && !slot; j++) { const o = NEARBY[(i * 2 + j) % NEARBY.length], q = [player.x + o[0], player.y + o[1]]; if (fits(q)) slot = q; } }
    if (!slot) { if (sim.still >= 0.9) u.path = null; return; } const off = Math.hypot(slot[0] - u.x, slot[1] - u.y);
    u.repath -= dt; if (off > 0.45 && (u.repath <= 0 || !u.path)) { u.repath = sim.still < 0.9 ? 0.3 : 1.2; go(u, slot, 1.5); } else if (off <= 0.45 && sim.still >= 0.9) u.path = null; if (u.path) moveAlong(u, dt, off > 2.4 ? KIT.player.speed * 1.25 : KIT.player.speed * (sim.still < 0.9 ? 1 : 0.7));
  }
  function tickSentry(q, dt) { const A = SENTRY_ATK;
    if (q.st === 'wind') { q.t += dt; const f = q.aim.target; if (f && f.alive) { q.aim.ang = Math.atan2(f.y - q.y, f.x - q.x); q.aim.x = f.x; q.aim.y = f.y; } q.ang += angDiff(q.aim.ang, q.ang) * Math.min(1, dt * 12);
      if (q.t >= A.wind) { q.aim.lead = q.t; q.aim.from = [q.x + Math.cos(q.ang) * q.mz, q.my, q.y + Math.sin(q.ang) * q.mz]; land(q, q.aim, ants); q.st = 'rest'; q.t = 0; } return; }
    if (q.st === 'rest') { q.t += dt; if (q.t >= A.rest) q.st = 'idle'; return; }
    let best = null, bd = A.range; for (const a of ants) { if (!a.alive || !a.engaged) continue; const d = Math.hypot(a.x - q.x, a.y - q.y); if (d < bd && d > 0.8 && sight({ x: q.x + (a.x - q.x) / d * 0.7, y: q.y + (a.y - q.y) / d * 0.7 }, a)) { bd = d; best = a; } }
    if (best) { q.st = 'wind'; q.t = 0; q.aim = { kind: 'beam', target: best, x: best.x, y: best.y, ang: Math.atan2(best.y - q.y, best.x - q.x), wind: A.wind, rest: A.rest, dmg: A.dmg }; log.marks++; } }
  // no two of a side stand in one spot: they ease apart (never off the floor)
  function apart(list) { for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) { const a = list[i], b = list[j]; if (!standing(a) || !standing(b) || a.st === 'lunge' || b.st === 'lunge' || a.entering || b.entering) continue; const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy), min = (a.r + b.r) * 0.72; if (d >= min || d < 1e-4) continue;
      const push = (min - d) * 0.12, ux = dx / d, uy = dy / d; for (const [o, s] of [[a, -1], [b, 1]]) { if (o === player) continue; const nx = o.x + ux * push * s, ny = o.y + uy * push * s; if (walk.standable([nx, ny])) { o.x = nx; o.y = ny; } } } }
  function step(dtReal) {   // dtReal: of the clock on the wall; the fight's own clock runs at the pace while a fight is on
    if (ants.some(a => a.alive && a.engaged)) sim.hold = 1.5; else sim.hold = ants.some(a => a.alive) ? Math.max(0, sim.hold - dtReal) : 0; sim.fight = sim.hold > 0;   // (a fight is on while an ant is at it, and for a moment after while more are coming up: so it does not end between two ants)
    sim.scale += ((sim.fight ? state.pace : 1) - sim.scale) * Math.min(1, dtReal * 5); const k = sim.scale, dt = dtReal * k; sim.t += dt; sim.steps++;
    tickRaid(dtReal);
    for (const u of squad) if (u.pop > 0) u.pop -= dtReal; if (sim.back > 0) sim.back -= dtReal;
    if (player.path) { const x0 = player.x, y0 = player.y, last = trail.length ? trail[trail.length - 1] : null; if (!last || Math.hypot(last[0] - x0, last[1] - y0) > 0.3) { trail.push([x0, y0]); if (trail.length > 60) trail.shift(); } if (moveAlong(player, dt, player.speed)) sim.tap = null; }
    sim.still = player.path ? 0 : sim.still + dt;
    followers.forEach((u, i) => tickFollower(u, i, dt)); for (const a of ants) tickAnt(a, dt, k); for (const q of sentries) tickSentry(q, dt); apart(squad); apart(ants);
    for (const c of icicles) { if (!c.on) continue; if (c.wait > 0) { c.wait -= dt; continue; } const f = c.to, L = Math.hypot(f.x - c.from[0], f.y - c.from[2]) || 1; c.u += c.fly * dt / L; if (c.u >= 1) { c.on = false; if (f.alive) hurt(f, c.dmg, c.by); } }
    for (const o of everyone) if (o.lag > o.hp) o.lag = Math.max(o.hp, o.lag - o.max * dt / 0.6); else o.lag = o.hp;   // (a bar keeps a pale piece of the health just lost, draining: the game's lagBar, 36 frames)
    for (let i = numbers.length - 1; i >= 0; i--) { numbers[i].t += dtReal; if (numbers[i].t > 0.9) numbers.splice(i, 1); }
    for (const s of stakeSets) if (s.t >= 0) { s.t += dt; if (s.t > 0.9) s.t = -1; } for (const b of beams) if (b.t >= 0) { b.t += dtReal; if (b.t > 0.14) b.t = -1; } for (const s of sparks) if (s.t >= 0) { s.t += dtReal; if (s.t > 0.16) s.t = -1; }
    if (sim.tap) sim.tap.t += dtReal; sim.room = world.roomAt(player.x, player.y) || sim.room;
  }
  function walkTo(p) { if (!go(player, p, 2.5)) return false; const e = player.path[player.path.length - 1]; sim.tap = { x: e[0], y: e[1], t: 0 }; return true; }

  // ── THE CAMERA: the game's own angle, always on the cube. A finger turns and tilts it, two fingers come nearer; CAMERA swings it to one of two angles, NEAR or FAR, and the
  // finger goes on from there. It never moves by itself, but for a little sway when left alone. The cube sits a little above the middle of the picture, as picture 1 has it
  // (ABOVE of the way from the middle to the top), so more of the floor in front of it shows over the buttons: the camera looks at a point that far in front of the cube ──
  const cam = new T.PerspectiveCamera(22, 1, 1, 100), SEE = () => { cam.layers.set(0); cam.layers.enable(1); cam.layers.enable(2); }; SEE();   // (layers: 0 what moves, 1 what stands still, 2 what carries no ink line; 3 is the still things' plain copies, for the line's drawing and the shadows')
  const ANGLES = { far: { el: 33, dist: 23 }, near: { el: 25, dist: 12.5 } }, ABOVE = 0.27, HALF = Math.tan(11 * Math.PI / 180);   // (far: picture 1's; HALF: of the lens's 22 degrees)
  const orbit = { az: 45, el: ANGLES[state.cam].el, dist: ANGLES[state.cam].dist, touched: -1e9, sway: 1 };   // (what the finger and the CAMERA button set)
  const view = { tx: player.x, ty: 0.35, tz: player.y, el: orbit.el, dist: orbit.dist, snap: true };   // (what is drawn: it eases after the cube and after `orbit`; snap: at once, when the cube is set down somewhere else)
  let clock = 0;
  function place(dt) { orbit.sway += ((clock - orbit.touched > 6 ? 1 : 0) - orbit.sway) * Math.min(1, dt * 2.4);
    const m = dt && !view.snap ? Math.min(1, dt * 5) : 1, sw = dt ? Math.min(1, dt * 3) : 1; view.snap = false; view.el += (orbit.el - view.el) * sw; view.dist += (orbit.dist - view.dist) * sw;
    const az = (orbit.az + Math.sin(clock * 0.22) * 5 * orbit.sway) * Math.PI / 180, e = view.el * Math.PI / 180, d = view.dist, front = ABOVE * d * HALF / Math.sin(e);   // (left alone, it sways a little)
    view.tx += (player.x + Math.cos(az) * front - view.tx) * m; view.tz += (player.y + Math.sin(az) * front - view.tz) * m;
    cam.position.set(view.tx + Math.cos(az) * Math.cos(e) * d, view.ty + Math.sin(e) * d, view.tz + Math.sin(az) * Math.cos(e) * d); cam.lookAt(view.tx, view.ty, view.tz); cam.near = Math.max(0.2, d * 0.3); cam.far = d * 3 + 30; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    // the walls in front of the room you are in sink
    for (const G of world.groups) { G.want = G.hide.includes(sim.room) ? 1 : 0; if (G.down !== G.want) { G.down = dt ? clamp(G.down + (G.want ? 1 : -1) * dt / 0.4, 0, 1) : G.want; G.g.position.y = -ease(G.down) * (WALL_H + 0.16); G.g.visible = G.down < 1; } }
    sim.open[0] = sim.room; }
  // the light goes with the camera, a whole dot of its shadow at a time (so a shadow's edge does not crawl), and reaches farther when the camera is far
  const Ld = key ? new T.Vector3(8, 14, 3) : null, Lz = Ld ? Ld.clone().normalize() : null, Lx = Ld ? new T.Vector3().crossVectors(UP, Lz).normalize() : null, Ly = Ld ? new T.Vector3().crossVectors(Lz, Lx) : null; let shadowSize = 0;
  function aimLight() { if (!key) return; const s = clamp(Math.round(view.dist * 0.5 / 2) * 2, 11, 34); if (s !== shadowSize) { shadowSize = s; Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s }); key.shadow.camera.updateProjectionMatrix(); }
    const tex = 2 * s / key.shadow.mapSize.x, p = tmpV.set(view.tx, 0, view.tz), a = Math.round(p.dot(Lx) / tex) * tex, b = Math.round(p.dot(Ly) / tex) * tex, c = p.dot(Lz); p.set(0, 0, 0).addScaledVector(Lx, a).addScaledVector(Ly, b).addScaledVector(Lz, c);
    key.target.position.copy(p); key.position.copy(p).add(Ld); key.target.updateMatrixWorld(); key.updateMatrixWorld(); }

  // ── fingers: one turns the room, two come nearer; a tap on the floor walks the cube there ──
  const fingers = new Map(), ray = new T.Raycaster(); let pinch = 0, tapAt = null;
  function floorAt(cx, cy) { const r = canvas.getBoundingClientRect(); ray.setFromCamera({ x: (cx - r.left) / r.width * 2 - 1, y: -((cy - r.top) / r.height) * 2 + 1 }, cam); const o = ray.ray.origin, d = ray.ray.direction; if (d.y > -1e-4) return null; const t = -o.y / d.y; return [o.x + d.x * t, o.z + d.z * t]; }
  canvas.addEventListener('pointerdown', e => { try { canvas.setPointerCapture(e.pointerId); } catch (x) {} fingers.set(e.pointerId, [e.clientX, e.clientY]); pinch = 0; orbit.touched = clock; tapAt = fingers.size === 1 ? { x: e.clientX, y: e.clientY, at: performance.now(), far: 0 } : null; e.preventDefault(); });
  canvas.addEventListener('pointermove', e => { const p = fingers.get(e.pointerId); if (!p) return; const dx = e.clientX - p[0], dy = e.clientY - p[1]; p[0] = e.clientX; p[1] = e.clientY; orbit.touched = clock; if (tapAt) { tapAt.far = Math.max(tapAt.far, Math.hypot(e.clientX - tapAt.x, e.clientY - tapAt.y)); if (tapAt.far <= 9) return; }   // (a finger that has hardly moved is a tap still)
    if (fingers.size === 1) { orbit.az = clamp(orbit.az + dx * 0.25, 8, 82); orbit.el = clamp(orbit.el + dy * 0.2, 14, 72); }   // (the room goes with the finger; kept on the side the walls sink on)
    else if (fingers.size === 2) { const q = [...fingers.values()], d = Math.hypot(q[0][0] - q[1][0], q[0][1] - q[1][1]); if (pinch) orbit.dist = clamp(orbit.dist * pinch / d, 9, 80); pinch = d; } });
  canvas.addEventListener('pointerup', e => { if (tapAt && fingers.size === 1 && tapAt.far <= 9 && performance.now() - tapAt.at < 600) { const p = floorAt(e.clientX, e.clientY); if (p) walkTo(p); } tapAt = null; });
  for (const n of ['pointerup', 'pointercancel', 'pointerleave']) canvas.addEventListener(n, e => { fingers.delete(e.pointerId); pinch = 0; });
  canvas.addEventListener('wheel', e => { orbit.dist = clamp(orbit.dist * Math.exp(e.deltaY * 0.001), 9, 80); orbit.touched = clock; e.preventDefault(); }, { passive: false });

  // ── the ink line: the room drawn a second time in its solids' flat colours, then one pass over the screen. The picture itself is drawn in the colours the screen shows
  // (not in linear light, turned at the end): eight bits of linear light are too few in the dark, and an iPad showed the glow round the Crystal as a ring of dots ──
  const target = () => { const r = new T.WebGLRenderTarget(4, 4, { minFilter: T.NearestFilter, magFilter: T.NearestFilter }); if (depthOK) { r.depthTexture = new T.DepthTexture(4, 4); r.depthTexture.type = T.UnsignedIntType; } return r; };
  const rtMain = target(), rtId = target(); rtMain.texture.minFilter = rtMain.texture.magFilter = T.LinearFilter; rtMain.texture.encoding = T.sRGBEncoding;
  const comp = new T.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { tMain: { value: rtMain.texture }, tId: { value: rtId.texture }, tDepth: { value: depthOK ? rtId.depthTexture : null }, res: { value: new T.Vector2(4, 4) }, ink: { value: new T.Color('#16303a') }, thick: { value: 1.6 }, near: { value: 1 }, far: { value: 100 }, dK: { value: 0.02 }, useDepth: { value: depthOK ? 1 : 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tMain, tId, tDepth; uniform vec2 res; uniform vec3 ink; uniform float thick, near, far, dK, useDepth; varying vec2 vUv;
    float lin(vec2 uv) { float z = texture2D(tDepth, uv).x; return (2.0 * near * far) / (far + near - (z * 2.0 - 1.0) * (far - near)); }
    void main() { vec2 e = thick / res, uA = vUv + e, uB = vUv - e, uC = vUv + e * vec2(1.0, -1.0), uD = vUv - e * vec2(1.0, -1.0); vec3 c = texture2D(tMain, vUv).rgb;
      float k = step(0.004, length(texture2D(tId, uA).rgb - texture2D(tId, uB).rgb) + length(texture2D(tId, uC).rgb - texture2D(tId, uD).rgb));
      if (useDepth > 0.5) { float dA = lin(uA), dB = lin(uB), dC = lin(uC), dD = lin(uD); k = max(k, smoothstep(dK, dK * 2.2, (abs(dA - dB) + abs(dC - dD)) / min(min(dA, dB), min(dC, dD)))); }
      gl_FragColor = vec4(mix(c, ink, k), 1.0); }` });
  const quadScene = new T.Scene(), quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new T.Mesh(new T.PlaneGeometry(2, 2), comp); quad.frustumCulled = false; quadScene.add(quad);
  let pxW = 4, pxH = 4, sized = '';
  function resize() { const w = canvas.clientWidth || 4, h = canvas.clientHeight || 4, pr = Math.min(state.sharp, Math.max(1, window.devicePixelRatio || 1)), k = w + 'x' + h + '@' + pr; if (k === sized) return; sized = k;
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false); pxW = Math.round(w * pr); pxH = Math.round(h * pr); rtMain.setSize(pxW, pxH); rtId.setSize(pxW, pxH); comp.uniforms.res.value.set(pxW, pxH); comp.uniforms.thick.value = Math.max(1, pxW / 940); cam.aspect = w / h; }

  // ── everyone and everything put where the step left them ──
  const gy0 = pa.gem ? pa.gem.position.y : 0, span = pa.tankSpan || [0, 1], bub = (pa.bubbles || []).map((b, i) => ({ b, y: b.position.y, v: 0.16 + (i % 5) * 0.05 }));
  function pose(t) {
    // (one of yours that is away shrinks out of sight where it fell, and grows back in by the Crystal: the same in every direction, never flattened)
    squad.forEach((u, i) => { const h = u.holder, f = u.form, away = u.down > 0, k = Math.max(0, u.pop) / POP, sc = away ? k : 1 - k; h.visible = sc > 0.001; if (!h.visible) return;
      h.position.set(u.x, 0, u.y); h.rotation.y = Math.PI / 2 - u.ang; h.scale.setScalar(sc); if (f && f.B.update) { f.B.update(t + i * 1.1, away ? 0 : (u.act || 0)); for (const o of f.hidden) o.visible = false; } });
    for (const u of ants) { const h = u.holder, show = u.alive || u.dying > 0; h.visible = show; if (!show) continue; const j = u.jab > 0 ? Math.sin((0.3 - u.jab) / 0.3 * Math.PI) * 0.28 : u.st === 'wind' || u.st === 'aim' ? -0.12 * Math.min(1, u.t / 0.2) : 0;
      h.position.set(u.x + Math.cos(u.ang) * j, 0, u.y + Math.sin(u.ang) * j); h.rotation.y = -u.ang; const s = u.alive ? 1 : Math.max(0.001, u.dying / 0.3); h.scale.set(s, s, s); const pi = u.st === 'wind' || u.st === 'aim' ? 4 : Math.floor((u.moved || 0) * 2.6) % 4; for (let i = 0; i < u.poses.length; i++) u.poses[i].visible = i === pi; }
    for (const q of sentries) q.s.head.rotation.y = -q.ang;
    for (const c of icicles) { const m = c.m; m.visible = c.on && c.wait <= 0; if (!m.visible) continue; const f = c.to, a = tmpV.set(c.from[0], c.from[1], c.from[2]), b = tmpW.set(f.x, Math.min(0.5, (f.top || 0.6) * 0.5), f.y), dir = b.clone().sub(a).normalize(); m.position.copy(a).lerp(b, c.u); m.position.y += Math.sin(c.u * Math.PI) * 0.1; m.position.x += c.side * 0.1 * dir.z; m.position.z -= c.side * 0.1 * dir.x; m.quaternion.setFromUnitVectors(UP, dir); }
    for (const s of stakeSets) { s.g.visible = s.t >= 0; if (s.t >= 0) { const k = s.t < 0.12 ? s.t / 0.12 : s.t < 0.7 ? 1 : 1 - (s.t - 0.7) / 0.2; s.g.scale.set(1, Math.max(0.001, k), 1); } }
    for (const b of beams) { b.g.visible = b.t >= 0; if (b.t >= 0) { const a = tmpV.set(b.from[0], b.from[1], b.from[2]), e = tmpW.set(b.to[0], b.to[1], b.to[2]), d = e.clone().sub(a), L = d.length() || 1; b.g.position.copy(a).addScaledVector(d, 0.5); b.g.quaternion.setFromUnitVectors(UP, d.normalize()); b.g.scale.set(1, L, 1); } }
    for (const s of sparks) { s.g.visible = s.t >= 0; if (s.t >= 0) s.g.scale.setScalar(0.7 + s.t / 0.16 * 0.8); }
    if (pa.gem) { pa.gem.rotation.y = t * 0.6; pa.gem.position.y = gy0 + Math.sin(t * 1.3) * 0.07; } for (const q of bub) q.b.position.y = span[0] + ((q.y - span[0] + t * q.v) % (span[1] - span[0]));
  }
  // the floor's marks: a ring under everyone; every blow on its way as its shape, filling; where the cube is walking to
  function marks() { FM.begin();
    for (const u of squad) if (!(u.down > 0)) mRing(u.x, u.y, u.r, 0.045, C.squad, 0.95); for (const u of ants) if (u.alive && !u.entering) mRing(u.x, u.y, u.r, 0.045, C.ants, 0.95);
    for (const u of units) { if (!u.alive || !u.aim) continue; const a = u.aim, k = u.team === 'ants' ? C.ants : C.squad;
      if (u.st === 'wind') { const p = clamp(u.t / a.wind, 0, 1); if (a.kind === 'wedge') mWedge(u.x, u.y, a.ang, a.reach, a.half, k, p); else if (a.kind === 'ring') mDisc(a.x, a.y, a.radius, k, p); else if (a.kind === 'bolt' && a.target.alive) mStrip(u.x, u.y, a.target.x, a.target.y, 0.2, k, p); }
      else if (u.st === 'aim') mDash(u.x, u.y, u.x + Math.cos(a.ang) * a.len, u.y + Math.sin(a.ang) * a.len, 0.07, k, 0.95, clamp(u.t / LUNGE.wind, 0, 1)); }
    for (const q of sentries) if (q.st === 'wind') mStrip(q.x + Math.cos(q.ang) * 0.4, q.y + Math.sin(q.ang) * 0.4, q.aim.x, q.aim.y, 0.14, C.squad, clamp(q.t / SENTRY_ATK.wind, 0, 1));
    if (sim.tap && player.path) { const p = (sim.tap.t * 1.6) % 1; mRing(sim.tap.x, sim.tap.y, 0.18 + p * 0.3, 0.05, C.white, 0.9 * (1 - p)); mRing(sim.tap.x, sim.tap.y, 0.16, 0.05, C.white, 0.9); }
    FM.end(); }
  // the bars over everyone's head and the numbers of the blows, facing the camera
  const cR = new T.Vector3(), cU = new T.Vector3();
  const corner = (Bt, x, y, z, a, b, k, al, s, t) => Bt.v(x + cR.x * a + cU.x * b, y + cR.y * a + cU.y * b, z + cR.z * a + cU.z * b, k, al, s, t);
  function rect(Bt, x, y, z, x0, x1, y0, y1, k, al, s0, s1) { corner(Bt, x, y, z, x0, y0, k, al, s0, 0); corner(Bt, x, y, z, x1, y0, k, al, s1, 0); corner(Bt, x, y, z, x1, y1, k, al, s1, 1); corner(Bt, x, y, z, x0, y0, k, al, s0, 0); corner(Bt, x, y, z, x1, y1, k, al, s1, 1); corner(Bt, x, y, z, x0, y1, k, al, s0, 1); }
  function bars() { cR.setFromMatrixColumn(cam.matrixWorld, 0); cU.setFromMatrixColumn(cam.matrixWorld, 1); BR.begin(); NM.begin();
    const bar = (o, w, h, up) => { const f = clamp(o.hp / o.max, 0, 1), g = clamp(o.lag / o.max, 0, 1), y = (o.crystal ? o.top : Math.min(o.top || 1, 1.45)) + up, e = h * 0.35;   // (over its head; a tall one's, across its shoulders: a bar high over a tall one reads as someone else's) rect(BR, o.x, y, o.y, -w / 2 - e, w / 2 + e, -h / 2 - e, h / 2 + e, C.dark, 0.82); if (g > f) rect(BR, o.x, y, o.y, -w / 2 + w * f, -w / 2 + w * g, -h / 2, h / 2, C.ghost, 0.8);
      if (f > 0) rect(BR, o.x, y, o.y, -w / 2, -w / 2 + w * f, -h / 2, h / 2, o.team === 'ants' ? C.bad : f > 0.5 ? C.ok : f > 0.3 ? C.warn : C.bad, 1); };
    for (const u of ants) if (u.alive && !u.entering) bar(u, u.cls === 'tank' ? 1.05 : 0.78, 0.085, 0.22); for (const u of squad) if (u.hp < u.max && !(u.down > 0)) bar(u, 0.9, 0.085, 0.24); if (crystal.hp < crystal.max) bar(crystal, 1.5, 0.11, 0);   // (an ant's bar always; one of yours, and the Crystal's, once it is hurt)
    for (const n of numbers) { const p = n.t / 0.9, sc = (n.t < 0.1 ? 1 + (1 - n.t / 0.1) * 0.5 : 1) * 0.46, w = sc * 0.62, x0 = -n.s.length * w / 2 + n.j, y = n.h + p * 0.75, al = p > 0.65 ? 1 - (p - 0.65) / 0.35 : 1;
      for (let i = 0; i < n.s.length; i++) { const gi = GLYPHS.indexOf(n.s[i]); if (gi < 0) continue; rect(NM, n.x, y, n.y, x0 + i * w - w * 0.2, x0 + (i + 1) * w + w * 0.2, -sc / 2, sc / 2, n.k, al, gi / GLYPHS.length, (gi + 1) / GLYPHS.length); } }
    BR.end(); NM.end(); }

  const stats = { fps: 0, ms: 0, worst: 0, draws: 0, tris: 0, frames: 0, w: 0, h: 0, webgl: gl2 ? 2 : 1, depth: depthOK, meshesBefore: before, meshesAfter: after, solids: idCount, rooms: world.order.length, wallPieces: world.groups.length };
  let last = 0, acc = 0, n = 0, worst = 0, stopped = false, raf = 0, owed = 0, hudAt = -1, hudWas = '', drawn = 0;
  // time moved on: the steps owed (a sixtieth of a second each, at most six a frame), then the camera
  function advance(dt) { clock += dt; owed += dt; let k = 0; while (owed >= 1 / 60 - 1e-9 && k < 6) { step(1 / 60); owed -= 1 / 60; k++; } if (k === 6) owed = 0; place(dt); }
  // one frame's drawing: with the ink line, the room twice (as it is; then in its solids' flat colours) and one pass over the screen; without it, the room once, straight to the screen.
  // Then the bars and the numbers, over the finished picture
  // the shadows are drawn from what moves and the still things' plain copies (layers 0 and 3). three draws them inside the room's own drawing, after it has listed what the
  // camera sees and with that camera's layers: so the camera's layers are changed at the moment the shadows begin (the light's shadow is told to bring itself up to date just then)
  if (key) { const upd = key.shadow.updateMatrices; key.shadow.updateMatrices = function (light) { upd.call(this, light); cam.layers.set(0); cam.layers.enable(3); }; }
  function draw() { resize(); pose(clock); marks(); bars(); aimLight(); renderer.info.reset(); if (key && key.castShadow !== state.shadows) key.castShadow = state.shadows; renderer.shadowMap.needsUpdate = state.shadows && (drawn++ % 2 === 0 || !!opts.test);   // (the shadows: every other frame)
    if (state.ink) { SEE(); renderer.setRenderTarget(rtMain); renderer.render(scene, cam);
      const bg = scene.background; scene.background = null; scene.overrideMaterial = idMat; cam.layers.set(0); cam.layers.enable(3); renderer.setRenderTarget(rtId); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, cam); scene.overrideMaterial = null; scene.background = bg;
      comp.uniforms.near.value = cam.near; comp.uniforms.far.value = cam.far; renderer.setRenderTarget(null); renderer.render(quadScene, quadCam); }
    else { SEE(); renderer.setRenderTarget(null); renderer.render(scene, cam); }
    cam.layers.set(0); renderer.autoClear = false; renderer.render(over, cam); renderer.autoClear = true; SEE(); }
  const tell = () => { stats.draws = renderer.info.render.calls; stats.tris = renderer.info.render.triangles; stats.w = pxW; stats.h = pxH; };
  const label = id => (world.rooms[id] ? world.rooms[id].label : '').replace(/\s*\(.*\)\s*$/, '').replace(/ past the Experiment Lab$/, '');
  function hud(force) { if (!opts.onHud) return; const h = { room: label(sim.room), raid: raid.phase, wave: raid.wave, waves: WAVES.length, crystal: Math.round(crystal.hp / crystal.max * 100), fight: sim.fight, pace: state.pace, cam: state.cam, coming: ants.some(a => a.alive && !a.engaged), away: squad.filter(u => u.down > 0).map(u => [u.name, Math.ceil(u.down)]), back: sim.back > 0 }, s = JSON.stringify(h); if (s !== hudWas || force) { hudWas = s; opts.onHud(h); } }
  // what the tests read: where everyone is and how the fight stands
  function snapshot() { return { t: +sim.t.toFixed(2), clock: +clock.toFixed(2), room: sim.room, player: [+player.x.toFixed(2), +player.y.toFixed(2)], walking: !!player.path, squad: squad.map(u => [u.key, +u.x.toFixed(2), +u.y.toFixed(2), Math.round(u.hp), u.down > 0 ? 1 : 0, u.holder.visible ? +(u.holder.scale.y / u.holder.scale.x).toFixed(2) : 0]), ants: ants.filter(a => a.alive).map(a => [a.cls, +a.x.toFixed(2), +a.y.toFixed(2), Math.round(a.hp), a.engaged ? 1 : 0, a.st]),
    crystal: Math.round(crystal.hp), raid: raid.phase, wave: raid.wave, fight: sim.fight, scale: +sim.scale.toFixed(3), wallsDown: world.groups.filter(G => G.want).map(G => G.key), open: sim.open.slice(), cam: { el: +view.el.toFixed(1), dist: +view.dist.toFixed(1), at: [+view.tx.toFixed(2), +view.tz.toFixed(2)], cube: (() => { const v = tmpV.set(player.x, 0.35, player.y).project(cam); return [+((v.x + 1) / 2).toFixed(3), +((1 - v.y) / 2).toFixed(3)]; })() }, marksNow: FM.count(), log: Object.assign({}, log, { minLead: log.minLead > 1e8 ? null : +log.minLead.toFixed(3) }) }; }
  function frame(now) { if (stopped) return; raf = requestAnimationFrame(frame); loop(now); }
  function loop(now) { if (!last) last = now; const dtMs = now - last; last = now; advance(Math.min(0.1, dtMs / 1000)); draw();
    stats.frames++; if (dtMs > 0 && stats.frames > 1) { acc += dtMs; n++; worst = Math.max(worst, dtMs); }
    if (opts.test) { const now2 = [sim.t, pa.gem ? pa.gem.rotation.y : 0, cam.position.x]; if (stats.frames === 2) stats.first = now2; stats.last = now2; }   // (the test's: what moved between its second frame and its last)
    if (acc >= 500) { stats.ms = acc / n; stats.fps = 1000 / stats.ms; stats.worst = worst; tell(); acc = 0; n = 0; worst = 0; if (opts.onStats) opts.onStats(stats, state); }
    if (clock - hudAt > 0.2) { hudAt = clock; hud(); }
    if (opts.test && stats.frames >= opts.test) { stopped = true; cancelAnimationFrame(raf); tell();
      const gl = renderer.getContext(), px = new Uint8Array(4), seen = new Set(); for (let i = 0; i < 12; i++) for (let j = 0; j < 8; j++) { gl.readPixels(Math.floor((i + 0.5) / 12 * pxW), Math.floor((j + 0.5) / 8 * pxH), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); seen.add(px[0] + ',' + px[1] + ',' + px[2]); }
      stats.colours = seen.size; stats.sim = snapshot(); if (opts.onDone) opts.onDone(stats, state); } }
  const api = { stats, state, scene, room: world.g, world, units, orbit, view, sim, PACES, CAMS, snapshot, walkTo, renderer, cam,
    set(k, v) { state[k] = v; sized = ''; if (k === 'cam' && ANGLES[v]) { orbit.el = ANGLES[v].el; orbit.dist = ANGLES[v].dist; } if (opts.onStats) opts.onStats(stats, state); hud(true); }, stop() { stopped = true; cancelAnimationFrame(raf); }, start() { stopped = false; last = 0; raf = requestAnimationFrame(frame); },
    step(dt) { stopped = true; cancelAnimationFrame(raf); advance(dt); draw(); tell(); hud(); },   // (one frame, the clock moved on by hand: for a recording)
    strike(key, n) { const u = units.find(q => q.key === key); if (u) hurt(u, n, null); },   // (a blow from nowhere: for the tests)
    run(seconds) { for (let i = 0, k = Math.round(seconds * 60); i < k; i++) { clock += 1 / 60; step(1 / 60); place(1 / 60); } hud(true); } };   // (time run on with nothing drawn: for the tests)
  place(0); hud(true);
  // (the test's frames are stepped here, a tenth of a second apart on a clock of their own: a headless browser's frame clock runs at no steady rate, and a test must not depend on it.
  //  Before them: a walk asked for in the address, and seconds run on with nothing drawn)
  if (opts.test) { if (opts.walk) walkTo(opts.walk); if (opts.skip) api.run(opts.skip); for (let i = 0; i < opts.test && !stopped; i++) loop(100 * (i + 1)); } else api.start();
  return api;
})();
