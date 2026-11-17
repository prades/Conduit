// THE 3D CORE (view3d/core.js): how the chosen look, round 2's CRYSTAL LAB 3D (docs/STYLE-EVOLUTION.md), is drawn every frame. One core, two users:
//   the game's 3D view (view3d/gameview.js, docs/VIEW-3D.md): the real game drawn in 3D behind its switch (the owner, 2026-11-16: "The real game in 3D")
//   the live test page (design/style-evolution/live/viewer.js, lab3d/): the lab floor with a stand-in fight
// What is here: the renderer; the look's world made from rooms' records and merged so it is cheap to draw; every solid's own flat colour for the ink line, carried in its
// vertices; a creature's body in its poses; one mesh written again every frame for marks; the light that goes with the camera; and a frame's drawing (the shadows, the room,
// the room again in flat colours for the ink line, one pass over the screen, then whatever is laid over the finished picture).
// In scope: T, the kit, the chamber and the styles of round 2 (design/style-evolution/round2), and the lab floor's builder (design/style-evolution/live/floor.js).
function view3dCore(opts) {
  const S = STYLES.lab, canvas = opts.canvas, state = opts.state || { ink: true, shadows: true, sharp: 1.5 };
  const renderer = new (opts.gl1 ? T.WebGL1Renderer : T.WebGLRenderer)({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  const gl2 = renderer.capabilities.isWebGL2, depthOK = gl2 || !!renderer.extensions.get('WEBGL_depth_texture');
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.NoToneMapping; renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap; renderer.shadowMap.autoUpdate = false; renderer.info.autoReset = false;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), ease = k => k * k * (3 - 2 * k), UP = new T.Vector3(0, 1, 0), tmpV = new T.Vector3();
  const scene = new T.Scene(), P = S.palette(), ctx = { renderer, P, S, units: {}, scene, map: opts.map || null, portraits: {} };
  S.env(scene, ctx); scene.background = new T.Color('#0d1d26');   // (as it is written: the picture is drawn in the colours the screen shows, see the ink line below)
  let key = null, cam = null, built = 0, drawn = 0;
  const CHUNK = opts.chunk || 7;   // (tiles: smaller, fewer triangles a frame and more draws)
  const countMeshes = () => { let n = 0; scene.traverse(o => { if (o.isMesh && shownChain(o)) n++; }); return n; };

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
    for (const o of gone) { if (o2 && o2.keep) { o.visible = false; o.userData.gone = true; } else o.parent.remove(o); }   // (keep: hidden where it was, so its siblings keep their places: a form's own code finds its parts by place)
    const attr = (list, n) => { const a = new T.Float32BufferAttribute(list, n); if (o2 && o2.copy) a.onUpload(dropArray); return a; };   // (a room's own: not kept in memory once it is on the graphics card)
    for (const b of buckets.values()) { if (!b.pos.length) continue; const g = new T.BufferGeometry(); g.setAttribute('position', attr(b.pos, 3)); g.setAttribute('normal', attr(b.nor, 3)); if (b.needUv) g.setAttribute('uv', attr(b.uv, 2)); if (b.needCol) g.setAttribute('color', attr(b.col, 3)); if (b.idc.length) g.setAttribute('idc', attr(b.idc, 3)); g.computeBoundingSphere();
      const m = new T.Mesh(g, b.mat); m.castShadow = b.cast; m.receiveShadow = b.recv; m.renderOrder = b.order; m.userData.merged = true; if (b.ni) m.layers.set(2); else if (copies) m.layers.set(1); root.add(m); }
    if (copies) for (const cp of copies.values()) { const g = new T.BufferGeometry(); g.setAttribute('position', attr(cp.pos, 3)); g.setAttribute('idc', attr(cp.idc, 3)); g.computeBoundingSphere(); const m = new T.Mesh(g, idMat); m.layers.set(3); m.castShadow = true; m.userData.merged = true; root.add(m); }
    return buckets.size;
  }
  // what still moves (the squad's parts, the crystal): each vertex its solid's colour; what carries no line goes to layer 2, which the line's drawing leaves out
  function tagInk(root) { root.traverse(o => { if (o.isSprite || o.isLine || o.isPoints) { o.layers.set(2); return; } if (!o.isMesh || o.userData.merged || o.userData.gone || (o.geometry.attributes.idc && o.geometry.userData.ink === undefined)) return; if (noInk(o)) { o.layers.set(2); return; }
    const id = idOf(holderOf(o)); let g = o.geometry; if (g.userData.ink !== undefined) { if (g.userData.ink === id) return; g = o.geometry = g.clone(); }
    const n = g.attributes.position.count, a = new Float32Array(n * 3), set = (i, c) => { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; }, base = idCol(id); for (let i = 0; i < n; i++) set(i, base);
    if (o.userData.inkIds && g.groups.length) for (const gr of g.groups) { const c = idCol(id + (o.userData.inkIds[gr.materialIndex] || 0)); for (let i = gr.start; i < gr.start + gr.count; i++) set(g.index ? g.index.getX(i) : i, c); }
    g.setAttribute('idc', new T.BufferAttribute(a, 3)); g.userData.ink = id; }); }
  // a form's parts that never move against their parent (found by posing it many ways and watching) are merged with that parent's other still parts
  // (more: other poses it is ever put in, each [t, act, block]: a part that moves only in one of those is not taken for still. A part whose shape the pose rewrites (some forms bend
  //  their own geometry) is not still either)
  const shapeSum = o => { const a = o.isMesh && o.geometry && o.geometry.attributes.position; if (!a) return 0; const v = a.array, st = Math.max(1, Math.floor(v.length / 96)); let s = 0; for (let i = 0; i < v.length; i += st) s += v[i] * (1 + (i % 7)); return s; };
  function mergeRigid(holder, more) { const f = holder.userData.form; if (!f || !f.B.update) return; const nodes = [], first = new Map(), poses = []; f.B.g.traverse(o => nodes.push(o));
    for (const t of [0, 0.37, 0.91, 1.7, 2.9, 4.3]) for (const act of [0, 0.25, 0.5, 0.75, 1]) poses.push([t, act]); if (more) for (const q of more) poses.push(q);
    for (const q of poses) { if (q[2]) f.B.update(q[0], q[1], q[2]); else f.B.update(q[0], q[1]); for (const o of f.hidden) o.visible = false;
      for (const o of nodes) { o.updateMatrix(); const e = o.matrix.elements, a = first.get(o), sh = shapeSum(o); if (!a) { first.set(o, { e: e.slice(), v: o.visible, sh }); continue; } if (a.v !== o.visible || Math.abs(a.sh - sh) > 1e-6 * (1 + Math.abs(sh))) o.userData.dynamic = true; else for (let i = 0; i < 16; i++) if (Math.abs(a.e[i] - e[i]) > 1e-5) { o.userData.dynamic = true; break; } } }
    f.B.update(0.6, 0); for (const o of f.hidden) o.visible = false;
    const roots = [holder].concat(nodes.filter(o => o.userData.dynamic && o.children.length)); for (const r of roots) mergeStill(r, { keep: true }); }   // (keep: the Thunderhead's shard fades its edge as children[1]; with its core taken out, there was none)

  // ── THE ANTS: a body a class, in five poses (four steps of its walk; its jaws wide, a bite on its way); the ants of a class share its shapes ──
  // (how: its size, or { size, zk, accent, stand }: buildAnt's own; stand adds a sixth pose, every foot down)
  const ANT_POSES = [{ walk: 0 }, { walk: 0.25 }, { walk: 0.5 }, { walk: 0.75 }, { walk: 0.3, open: 0.3 }], antKits = {};
  function antKit(cls, how) { const o = typeof how === 'object' && how ? how : { size: how }, k = cls + JSON.stringify(o); if (antKits[k]) return antKits[k];
    const base = Object.assign({ cls }, o); delete base.stand;
    const root = new T.Group(), list = o.stand ? ANT_POSES.concat([{ walk: 0, stand: true }]) : ANT_POSES, poses = list.map(p => buildAnt(P, Object.assign({}, base, p))); root.userData.inkGroup = true; for (const g of poses) root.add(g);
    toonify(root, ctx.grad, { sat: 1.1 }); for (const g of poses) mergeStill(g); return (antKits[k] = { poses, info: poses[0].userData.ant }); }
  function antBody(cls, how) { const kit = antKit(cls, how), holder = new T.Group(), id = ++idCount * 3, c = idCol(id); holder.userData.inkGroup = true; holder.userData._ink = id;
    const poses = kit.poses.map(pg => { const g = new T.Group(); for (const m of pg.children) { let geo = m.geometry; if (m.layers.mask !== 4) { geo = new T.BufferGeometry(); for (const a of Object.keys(m.geometry.attributes)) if (a !== 'idc') geo.setAttribute(a, m.geometry.attributes[a]);
          const n = m.geometry.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } geo.setAttribute('idc', new T.BufferAttribute(a, 3)); }
        const q = new T.Mesh(geo, m.material); q.castShadow = m.castShadow; q.receiveShadow = m.receiveShadow; q.layers.mask = m.layers.mask; q.renderOrder = m.renderOrder; g.add(q); } g.visible = false; holder.add(g); return g; });
    holder.visible = false; scene.add(holder); return { holder, poses, info: kit.info }; }

  // ── marks and the like: ONE mesh whose triangles are written again every frame ──
  // (a vertex at a time, straight into the arrays: three vertices are a triangle. Nothing is made anew each frame)
  function Batch(maxTris, mat, uvs) { const max = maxTris * 3, pos = new Float32Array(max * 3), col = new Float32Array(max * 4), uv = uvs ? new Float32Array(max * 2) : null, geo = new T.BufferGeometry(), aP = new T.BufferAttribute(pos, 3), aC = new T.BufferAttribute(col, 4), aU = uv ? new T.BufferAttribute(uv, 2) : null;
    aP.setUsage(T.DynamicDrawUsage); aC.setUsage(T.DynamicDrawUsage); geo.setAttribute('position', aP); geo.setAttribute('color', aC); if (aU) { aU.setUsage(T.DynamicDrawUsage); geo.setAttribute('uv', aU); }
    const mesh = new T.Mesh(geo, mat); mesh.frustumCulled = false; mesh.layers.set(2); let n = 0;
    return { mesh, count: () => n / 3, begin() { n = 0; },
      v(x, y, z, k, al, s, t) { if (n >= max) return; let i = n * 3; pos[i] = x; pos[i + 1] = y; pos[i + 2] = z; i = n * 4; col[i] = k.r; col[i + 1] = k.g; col[i + 2] = k.b; col[i + 3] = al; if (uv) { uv[n * 2] = s; uv[n * 2 + 1] = t; } n++; },
      end() { n -= n % 3; geo.setDrawRange(0, n); for (const a of [aP, aC, aU]) if (a) { a.updateRange.offset = 0; a.updateRange.count = Math.max(a.itemSize * 3, n * a.itemSize); a.needsUpdate = true; } } }; }

  // ── THE WORLD: rooms' records (round2/export.js's, or the game's own made the same way) built in the look, lit, and merged ──
  function buildWorld(lab, how) {
    const world = buildLabFloor(lab, P, how); ctx.world = world; scene.add(world.g); S.world(world, scene, ctx); world.settle(); S.lights(scene, ctx);
    scene.traverse(o => { if (o.isDirectionalLight && o.castShadow) key = o; });
    // the glow round the Crystal: its soft disc from numbers, not from a canvas's gradient (an iPad's canvas dithers a gradient, and the glow drew as a ring of dots)
      scene.traverse(o => { if (!o.isSprite) return; const N = 64, d = new Uint8Array(N * N * 4); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const r = Math.hypot((x + 0.5) / N - 0.5, (y + 0.5) / N - 0.5) * 2, a = r < 0.35 ? 1 - 0.55 * r / 0.35 : 0.45 * Math.max(0, 1 - (r - 0.35) / 0.65), i = (y * N + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(a * 255); }
      const tex = new T.DataTexture(d, N, N, T.RGBAFormat); tex.magFilter = tex.minFilter = T.LinearFilter; tex.needsUpdate = true; o.material.map = tex; o.material.needsUpdate = true; });
    // the shadows are drawn from what moves and the still things' plain copies (layers 0 and 3). three draws them inside the room's own drawing, after it has listed what the
    // camera sees and with that camera's layers: so the camera's layers are changed at the moment the shadows begin (the light's shadow is told to bring itself up to date just then)
    if (key) { const upd = key.shadow.updateMatrices; key.shadow.updateMatrices = function (light) { upd.call(this, light); if (cam) { cam.layers.set(0); cam.layers.enable(3); } }; }
    built = countMeshes();
    for (const id of world.order) mergeStill(world.rooms[id].g, { chunk: CHUNK, from: world.rooms[id].rec.bb, copy: true }); for (const G of world.groups) mergeStill(G.g, { chunk: CHUNK * 2, copy: true }); for (const q of world.sentries) mergeStill(q.head); mergeStill(world.rest, { copy: true });
    for (const d of world.doors) if (d.leaves) for (const lf of d.leaves) mergeStill(lf.g);   // (a door's leaf slides: one mesh of its own)
    return world;
  }
  // the walls in front of a room sink (the room that is opened), the others stand: eased over `dt` seconds of the wall's clock (0: at once)
  function openRoom(world, room, dt, turn) { for (const G of world.groups) { G.want = (turn && G.hides ? G.hides[turn] : G.hide).includes(room) ? 1 : 0;   // (turn: the camera's quarter turn, a group's rooms as seen from there)
    if (G.down !== G.want) { G.down = dt ? clamp(G.down + (G.want ? 1 : -1) * dt / 0.4, 0, 1) : G.want; G.g.position.y = -ease(G.down) * (G.sink || WALL_H + 0.16); G.g.visible = G.down < 1; } } }

  // the light goes with the camera, a whole dot of its shadow at a time (so a shadow's edge does not crawl), and reaches farther when the camera is far
  let Ld = null, Lz = null, Lx = null, Ly = null, shadowSize = 0;
  function aimLight(tx, tz, reach) { if (!key) return; if (!Ld) { Ld = new T.Vector3(8, 14, 3); Lz = Ld.clone().normalize(); Lx = new T.Vector3().crossVectors(UP, Lz).normalize(); Ly = new T.Vector3().crossVectors(Lz, Lx); } const s = clamp(Math.round(reach / 2) * 2, 11, 34); if (s !== shadowSize) { shadowSize = s; Object.assign(key.shadow.camera, { left: -s, right: s, top: s, bottom: -s }); key.shadow.camera.updateProjectionMatrix(); }
    const tex = 2 * s / key.shadow.mapSize.x, p = tmpV.set(tx, 0, tz), a = Math.round(p.dot(Lx) / tex) * tex, b = Math.round(p.dot(Ly) / tex) * tex, c = p.dot(Lz); p.set(0, 0, 0).addScaledVector(Lx, a).addScaledVector(Ly, b).addScaledVector(Lz, c);
    key.target.position.copy(p); key.position.copy(p).add(Ld); key.target.updateMatrixWorld(); key.updateMatrixWorld(); }

  // ── the ink line: the room drawn a second time in its solids' flat colours, then one pass over the screen. The picture itself is drawn in the colours the screen shows
  // (not in linear light, turned at the end): eight bits of linear light are too few in the dark, and an iPad showed the glow round the Crystal as a ring of dots ──
  const target = () => { const r = new T.WebGLRenderTarget(4, 4, { minFilter: T.NearestFilter, magFilter: T.NearestFilter }); if (depthOK) { r.depthTexture = new T.DepthTexture(4, 4); r.depthTexture.type = T.UnsignedIntType; } return r; };
  const rtMain = target(), rtId = target(); rtMain.texture.minFilter = rtMain.texture.magFilter = T.LinearFilter; rtMain.texture.encoding = T.sRGBEncoding;
  const comp = new T.ShaderMaterial({ depthTest: false, depthWrite: false, uniforms: { tMain: { value: rtMain.texture }, tId: { value: rtId.texture }, tDepth: { value: depthOK ? rtId.depthTexture : null }, res: { value: new T.Vector2(4, 4) }, ink: { value: new T.Color('#16303a') }, thick: { value: 1.6 }, near: { value: 1 }, far: { value: 100 }, dK: { value: opts.dK || 0.02 }, useDepth: { value: depthOK ? 1 : 0 }, isOrtho: { value: 0 }, tFx: { value: null }, useFx: { value: 0 }, floorId: { value: new T.Vector3() } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tMain, tId, tDepth, tFx; uniform vec2 res; uniform vec3 ink, floorId; uniform float thick, near, far, dK, useDepth, isOrtho, useFx; varying vec2 vUv;
    float lin(vec2 uv) { float z = texture2D(tDepth, uv).x; return isOrtho > 0.5 ? near + z * (far - near) : (2.0 * near * far) / (far + near - (z * 2.0 - 1.0) * (far - near)); }
    void main() { vec2 e = thick / res, uA = vUv + e, uB = vUv - e, uC = vUv + e * vec2(1.0, -1.0), uD = vUv - e * vec2(1.0, -1.0); vec3 c = texture2D(tMain, vUv).rgb;
      if (useFx > 0.5) { vec4 f = texture2D(tFx, vUv); float on = 1.0 - step(0.02, length(texture2D(tId, vUv).rgb - floorId)); c = mix(c, f.rgb, f.a * on); }
      float k = step(0.004, length(texture2D(tId, uA).rgb - texture2D(tId, uB).rgb) + length(texture2D(tId, uC).rgb - texture2D(tId, uD).rgb));
      if (useDepth > 0.5) { float dA = lin(uA), dB = lin(uB), dC = lin(uC), dD = lin(uD); k = max(k, smoothstep(dK, dK * 2.2, (abs(dA - dB) + abs(dC - dD)) / min(min(dA, dB), min(dC, dD)))); }
      gl_FragColor = vec4(mix(c, ink, k), 1.0); }` });
  const quadScene = new T.Scene(), quadCam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new T.Mesh(new T.PlaneGeometry(2, 2), comp); quad.frustumCulled = false; quadScene.add(quad);
  let pxW = 4, pxH = 4, cssW = 4, cssH = 4, sized = '';
  // the picture's size follows the canvas's (and SHARP); true when it changed. The camera is its owner's to fit to it (cssW, cssH)
  function resize() { const w = canvas.clientWidth || 4, h = canvas.clientHeight || 4, pr = Math.min(state.sharp, Math.max(1, window.devicePixelRatio || 1)), k = w + 'x' + h + '@' + pr; if (k === sized) return false; sized = k;
    renderer.setPixelRatio(pr); renderer.setSize(w, h, false); cssW = w; cssH = h; pxW = Math.round(w * pr); pxH = Math.round(h * pr); rtMain.setSize(pxW, pxH); rtId.setSize(pxW, pxH); comp.uniforms.res.value.set(pxW, pxH); comp.uniforms.thick.value = Math.max(1, pxW / 940); return true; }

  // ── ONE FRAME'S DRAWING: with the ink line, the room twice (as it is; then in its solids' flat colours) and one pass over the screen; without it, the room once, straight to
  // the screen. Then `over` (a scene of bars and numbers, say), on the finished picture, so no ink line crosses it. The shadows are drawn every other frame.
  // more.fx (the game's view; with the ink line only): a picture the size of the screen (a canvas, its alpha as it is) laid on the FLOOR alone, where the floor shows: under
  // everything that stands on it ──
  const SEE = c => { c.layers.set(0); c.layers.enable(1); c.layers.enable(2); };   // (layers: 0 what moves, 1 what stands still, 2 what carries no ink line; 3 is the still things' plain copies, for the line's drawing and the shadows')
  function draw(camera, over, more) { cam = camera; renderer.info.reset(); if (key && key.castShadow !== state.shadows) key.castShadow = state.shadows; renderer.shadowMap.needsUpdate = !!key && state.shadows && (drawn++ % 2 === 0 || !!opts.test);
    if (state.ink) { SEE(cam); renderer.setRenderTarget(rtMain); renderer.render(scene, cam);
      const bg = scene.background; scene.background = null; scene.overrideMaterial = idMat; cam.layers.set(0); cam.layers.enable(3); renderer.setRenderTarget(rtId); renderer.setClearColor(0x000000, 1); renderer.clear(); renderer.render(scene, cam); scene.overrideMaterial = null; scene.background = bg;
      const fx = more && more.fx && keyIds.floor ? more.fx : null; comp.uniforms.tFx.value = fx; comp.uniforms.useFx.value = fx ? 1 : 0; if (fx) { const c = idCol(keyIds.floor); comp.uniforms.floorId.value.set(c[0], c[1], c[2]); }
      comp.uniforms.near.value = cam.near; comp.uniforms.far.value = cam.far; comp.uniforms.isOrtho.value = cam.isOrthographicCamera ? 1 : 0; renderer.setRenderTarget(null); renderer.render(quadScene, quadCam); }
    else { SEE(cam); renderer.setRenderTarget(null); renderer.render(scene, cam); }
    if (over) { cam.layers.set(0); renderer.autoClear = false; renderer.render(over, cam); renderer.autoClear = true; } SEE(cam); }
  const size = () => ({ w: cssW, h: cssH, pxW, pxH });
  return { opts, state, renderer, scene, P, ctx, gl2, depthOK, SEE, mergeStill, tagInk, mergeRigid, Batch, antBody, idCol, newInk: () => ++idCount * 3, countMeshes, buildWorld, openRoom, aimLight, resize, size, draw,
    built: () => built, solids: () => idCount, key: () => key, resized() { sized = ''; } };
}
