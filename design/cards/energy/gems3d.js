// THE ENERGY CARDS' 3D GEMS (build 2026-11-12q; docs/ENERGY-CARDS.md §9): each element's gem as a real 3D model, after the shapes the owner locked in for build 2026-11-12n
// (then drawn as SVG): fire a crooked crystal cluster of three with two shards behind; ice a hexagonal prism tower with a smaller companion; electric a rock with crystals growing out of
// it and lightning between them (the owner, 2026-11-12: "just a rock with some crystal coming out of it. And electricity, of course"; the geode is gone); flux two three-sided pyramids
// base to base; core a translucent teal "flubber" blob with three droplets; toxic a green bubble with eight half-bubbles welling up on it; BLOOM a lotus (eight outer petals, seven mid,
// five inner, a gold stamen with ten pistils). Lit as the card items are (design/cards/bake_items.js). Baked by design/cards/energy/bake.js to img/cards/energy_<element>.png.
// The code below runs in the bake's page (three r128): GEMS.<element> = { az, el, exposure?, build() -> a THREE.Group }.
globalThis.GEMS_JS = String.raw`
const T = THREE, PI = Math.PI, TAU = PI * 2;
const col = h => new T.Color(h).convertSRGBToLinear();
const G = () => new T.Group();
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const rnd = (s => () => (s = (s * 16807) % 2147483647) / 2147483647)(7);
function std(hex, o) { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: 0, roughness: 0.3 }, o || {})); m.color = col(hex); if (o && o.emissiveHex) { m.emissive = col(o.emissiveHex); } m.envMapIntensity = (o && o.env) || 1.4; return m; }
function glowMat(hex, k) { const m = new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }); m.color = col(hex); if (k) m.color.multiplyScalar(k); return m; }
// a soft radial halo (additive), for the light round a gem
function innerGlow(hex, size, alpha) { const s = halo(hex, size, alpha); s.material.depthTest = false; s.renderOrder = 10; return s; }
function halo(hex, size, alpha) {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.6, 'rgba(255,255,255,0.12)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const m = new T.SpriteMaterial({ map: new T.CanvasTexture(c), color: col(hex), transparent: true, opacity: alpha == null ? 0.6 : alpha, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false });
    const s = new T.Sprite(m); s.scale.set(size, size, 1); return s;
}
// a crystal: a column of n sides, its top a point, its foot a shorter point; coloured up its height (vertex colours), flat-shaded
function crystal(h, r, sides, cols, o) {
    o = o || {}; const tip = o.tip == null ? 0.28 : o.tip, foot = o.foot == null ? 0.0 : o.foot, body = h * (1 - tip - foot);
    const geo = new T.CylinderGeometry(r * (o.taper == null ? 0.92 : o.taper), r, body, sides, 1, false); geo.translate(0, h * foot + body / 2, 0);
    const tg = new T.ConeGeometry(r * (o.taper == null ? 0.92 : o.taper), h * tip, sides, 1, false); tg.translate(0, h * foot + body + h * tip / 2, 0);
    const parts = [geo.toNonIndexed(), tg.toNonIndexed()];
    if (foot > 0) { const fg = new T.ConeGeometry(r, h * foot, sides, 1, false); fg.rotateX(PI); fg.translate(0, h * foot / 2, 0); parts.push(fg.toNonIndexed()); }
    const merged = mergeGeos(parts); const pos = merged.attributes.position, cs = [];
    for (let i = 0; i < pos.count; i++) { const t = Math.max(0, Math.min(1, pos.getY(i) / h)); const c = gradAt(cols, t); cs.push(c.r, c.g, c.b); }
    merged.setAttribute('color', new T.Float32BufferAttribute(cs, 3)); merged.computeVertexNormals();
    const mat = new T.MeshStandardMaterial({ vertexColors: true, metalness: 0, roughness: o.rough == null ? 0.07 : o.rough, flatShading: true, transparent: o.opacity != null, opacity: o.opacity == null ? 1 : o.opacity, emissive: col(o.emissive || '#000000'), emissiveIntensity: o.ei == null ? 0.5 : o.ei });
    mat.envMapIntensity = o.env == null ? 1.9 : o.env;
    const mesh = new T.Mesh(merged, mat);
    if (o.edges) { const e = new T.LineSegments(new T.EdgesGeometry(merged, 12), new T.LineBasicMaterial({ color: col(o.edges), transparent: true, opacity: o.edgeA == null ? 0.55 : o.edgeA, toneMapped: false })); mesh.add(e); }
    return mesh;
}
function mergeGeos(list) {
    let n = 0; for (const g of list) n += g.attributes.position.count; const pos = new Float32Array(n * 3); let k = 0;
    for (const g of list) { const p = g.attributes.position.array; pos.set(p, k); k += p.length; }
    const out = new T.BufferGeometry(); out.setAttribute('position', new T.BufferAttribute(pos, 3)); return out;
}
function gradAt(cols, t) { const n = cols.length - 1, i = Math.min(n - 1, Math.floor(t * n)), f = t * n - i; const a = col(cols[i]), b = col(cols[i + 1]); return a.lerp(b, f); }
// a smooth blob: a sphere pushed by a few low waves
function blob(r, amp, seed, segs) {
    const geo = new T.SphereGeometry(r, segs || 64, segs ? Math.round(segs * 0.75) : 48), p = geo.attributes.position, v = new T.Vector3();
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v.clone().normalize(); const w = Math.sin(n.x * 3.1 + seed) * Math.cos(n.y * 2.7 + seed * 1.7) * 0.6 + Math.sin(n.z * 4.3 + seed * 0.7) * 0.4; v.addScaledVector(n, w * amp * r); p.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals(); return geo;
}
const GEMS = {};
// ── FIRE: a crooked cluster of three, two shards behind ──
GEMS.fire = { halo: '#ff5a1a', az: 0.35, el: 0.16, exposure: 0.88, build() {
    const g = G(), C = ['#1a0200', '#700c00', '#d62806', '#ff6a12', '#ffcf4a'], o = { emissive: '#ff1e00', ei: 0.75, edges: '#ffb44a', edgeA: 0.55, env: 0.6 };
    const add = (h, r, x, z, rz, rx, ry, cols, oo) => { const m = crystal(h, r, 6, cols || C, Object.assign({}, o, oo || {})); m.rotation.set(rx, ry, rz); g.add(at(m, x, 0, z)); return m; };
    add(0.62, 0.11, 0.08, -0.2, -0.36, -0.18, 0.4, ['#1a0200', '#5a0c00', '#b02400', '#ff6a1a'], { ei: 0.45 });   // the shards behind
    add(0.52, 0.095, -0.12, -0.22, 0.46, -0.2, 1.1, ['#1a0200', '#5a0c00', '#b02400', '#ff6a1a'], { ei: 0.45 });
    add(1.08, 0.17, 0.0, 0.0, 0.06, 0.04, 0.3);   // the tall one, a little crooked
    add(0.74, 0.135, -0.13, 0.05, 0.5, 0.12, 0.9);
    add(0.6, 0.12, 0.14, 0.06, -0.55, 0.1, 0.2);
    // the rock they grow from, a few dark lumps with glowing cracks
    const rock = std('#2a1a14', { roughness: 0.9, env: 0.4 }); for (const [x, z, s] of [[0, 0, 0.2], [-0.16, 0.04, 0.14], [0.17, 0.02, 0.13], [0.03, -0.14, 0.15]]) { const m = new T.Mesh(new T.DodecahedronGeometry(s, 0), rock); m.scale.y = 0.5; m.rotation.set(rnd() * 3, rnd() * 3, 0); g.add(at(m, x, 0.02, z)); }
    for (let k = 0; k < 5; k++) { const a = rnd() * TAU, m = new T.Mesh(new T.BoxGeometry(0.16, 0.012, 0.012), glowMat('#ff7a1a', 1.6)); m.rotation.y = a; g.add(at(m, Math.cos(a) * 0.14, 0.07, Math.sin(a) * 0.1)); }
    g.add(at(innerGlow('#ff9a2a', 0.8, 0.32), 0, 0.42, 0.05));
    return g;
} };
// ── ICE: a hexagonal prism tower and a smaller companion ──
GEMS.ice = { halo: '#7fd6ff', az: 0.42, el: 0.16, build() {
    const g = G(), C = ['#123f6e', '#3f8fd6', '#9fd6ff', '#eaf7ff'], o = { emissive: '#2f8fff', ei: 0.3, opacity: 0.84, rough: 0.03, edges: '#e8f8ff', edgeA: 0.75, env: 1.8, taper: 1, tip: 0.18 };
    const tower = crystal(1.18, 0.2, 6, C, o); g.add(at(tower, 0, 0, 0));
    const inner = crystal(1.0, 0.08, 6, ['#9fdcff', '#ffffff'], { emissive: '#bfe8ff', ei: 0.9, opacity: 0.5, tip: 0.16, taper: 1 }); g.add(at(inner, 0, 0.04, 0));   // the light inside it
    g.add(at(innerGlow('#8fd8ff', 0.9, 0.35), 0, 0.55, 0));
    const mate = crystal(0.6, 0.12, 6, C, o); mate.rotation.set(0.05, 0.4, -0.32); g.add(at(mate, 0.2, 0, 0.08));
    const snow = std('#eaf6ff', { roughness: 0.55, env: 0.8 }); for (const [x, z, s] of [[0, 0, 0.24], [0.2, 0.08, 0.13], [-0.18, 0.05, 0.12], [0.06, -0.15, 0.13]]) { const m = new T.Mesh(new T.IcosahedronGeometry(s, 1), snow); m.scale.y = 0.32; g.add(at(m, x, 0.02, z)); }
    for (let k = 0; k < 6; k++) { const m = crystal(0.12 + rnd() * 0.08, 0.025, 6, C, Object.assign({}, o, { edges: null })); const a = rnd() * TAU; m.rotation.set((rnd() - 0.5) * 0.9, 0, (rnd() - 0.5) * 0.9); g.add(at(m, Math.cos(a) * 0.24, 0.02, Math.sin(a) * 0.16)); }
    return g;
} };
// ── ELECTRIC: a rock with crystals growing out of it, and lightning between them (the owner, 2026-11-12: "just a rock with some crystal coming out of it. And electricity, of course"; the geode is gone) ──
GEMS.electric = { halo: '#ffe14a', az: 0.4, el: 0.2, exposure: 0.95, build() {
    const g = G();
    // the rock: a rough dark lump, flat-shaded, a little blue in its grey, with glowing cracks where the crystals come out
    const rg = new T.IcosahedronGeometry(0.34, 1), rp = rg.attributes.position, v = new T.Vector3();
    for (let i = 0; i < rp.count; i++) { v.fromBufferAttribute(rp, i); const n = v.clone().normalize(); const w = Math.sin(n.x * 5.1 + 0.7) * 0.5 + Math.cos(n.z * 4.3 + 1.9) * 0.35 + Math.sin(n.y * 6.7) * 0.25; v.addScaledVector(n, w * 0.06); rp.setXYZ(i, v.x * 1.25, v.y * 0.72, v.z * 1.05); }
    rg.computeVertexNormals();
    const rock = new T.Mesh(rg, new T.MeshStandardMaterial({ color: col('#3b3f4a'), roughness: 0.92, metalness: 0.05, flatShading: true })); rock.material.envMapIntensity = 0.5; g.add(rock);
    const Y = ['#1e1500', '#a07000', '#ffc800', '#fff1a0'], yo = { emissive: '#ffa800', ei: 0.75, edges: '#fff0a0', edgeA: 0.5, env: 0.55 };
    // the crystals: out of the rock's top and sides, crooked, of a few sizes (the tallest leaning a little)
    const tips = [];
    for (const [dx, dy, dz, h, r] of [[0.05, 1, 0.1, 0.92, 0.12], [-0.55, 0.8, 0.15, 0.6, 0.09], [0.6, 0.75, 0.05, 0.56, 0.085], [-0.2, 0.7, -0.6, 0.48, 0.08], [0.35, 0.6, 0.55, 0.42, 0.07], [-0.75, 0.25, 0.4, 0.34, 0.06], [0.8, 0.2, -0.35, 0.3, 0.055]]) {
        const d = new T.Vector3(dx, dy, dz).normalize(), c = crystal(h, r, 6, Y, yo), base = d.clone().multiplyScalar(0.2).multiply(new T.Vector3(1.25, 0.72, 1.05));
        c.position.copy(base); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d); g.add(c);
        tips.push(base.clone().addScaledVector(d, h * 0.97));
        const crack = new T.Mesh(new T.RingGeometry(r * 1.05, r * 1.45, 6), glowMat('#ffd84a', 1.4)); crack.position.copy(base.clone().addScaledVector(d, 0.01)); crack.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), d); g.add(crack);   // (the rock glows where it split)
    }
    // the lightning: jagged arcs, a white-hot core in a yellow glow, from tip to tip and down to the rock, with a few short forks
    const bolt = (a, b, seed, jag) => {
        const pts = [], n = 10; for (let k = 0; k <= n; k++) { const t = k / n, q = a.clone().lerp(b, t); if (k && k < n) q.add(new T.Vector3(Math.sin(seed * 3.7 + k * 2.9), Math.cos(seed * 1.3 + k * 3.3), Math.sin(seed + k * 1.7)).multiplyScalar(jag)); pts.push(q); }
        const path = new T.CatmullRomCurve3(pts, false, 'catmullrom', 0.05);
        g.add(new T.Mesh(new T.TubeGeometry(path, 60, 0.007, 5, false), glowMat('#ffffff', 1.6)));
        g.add(new T.Mesh(new T.TubeGeometry(path, 60, 0.02, 6, false), new T.MeshBasicMaterial({ color: col('#ffd000'), transparent: true, opacity: 0.4, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false })));
        return pts;
    };
    const p1 = bolt(tips[1], tips[0], 1, 0.035), p2 = bolt(tips[0], tips[2], 2, 0.035), p3 = bolt(tips[2], new T.Vector3(0.36, 0.08, 0.28), 3, 0.025), p4 = bolt(tips[1], new T.Vector3(-0.4, 0.02, 0.24), 4, 0.025);
    for (const [pts, k, d] of [[p1, 4, [0.08, 0.1, 0.06]], [p2, 6, [0.06, -0.12, 0.08]], [p1, 7, [-0.05, 0.12, 0.04]]]) bolt(pts[k], pts[k].clone().add(new T.Vector3(d[0], d[1], d[2])), k * 5, 0.012);   // (forks)
    for (const t of tips.slice(0, 3)) g.add(at(innerGlow('#fff1a0', 0.22, 0.6), t.x, t.y, t.z));   // (where it leaves a tip)
    g.add(at(innerGlow('#ffd84a', 0.9, 0.22), 0, 0.3, 0));
    return g;
} };
// ── FLUX: two three-sided pyramids base to base ──
GEMS.flux = { halo: '#a35cff', az: 0.25, el: 0.2, exposure: 0.92, build() {
    const g = G(), H = 0.62, r = 0.46, eq = []; for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.3; eq.push(new T.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)); }
    const half = (tipY, cols, ei) => { const tip = new T.Vector3(0, tipY, 0), pos = [];
        for (let k = 0; k < 3; k++) { const a = eq[k], b = eq[(k + 1) % 3]; if (tipY > 0) pos.push(a.x, a.y, a.z, tip.x, tip.y, tip.z, b.x, b.y, b.z); else pos.push(b.x, b.y, b.z, tip.x, tip.y, tip.z, a.x, a.y, a.z); }
        const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); const cs = []; for (let i = 0; i < 9; i++) { const y = pos[i * 3 + 1]; const c = gradAt(cols, Math.abs(y) / H); cs.push(c.r, c.g, c.b); }
        geo.setAttribute('color', new T.Float32BufferAttribute(cs, 3)); geo.computeVertexNormals();
        const m = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, metalness: 0, roughness: 0.06, emissive: col('#4a10ff'), emissiveIntensity: ei + 0.12, transparent: true, opacity: 0.95 })); m.material.envMapIntensity = 0.6;
        m.add(new T.LineSegments(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color: col('#efd8ff'), transparent: true, opacity: 0.75, toneMapped: false }))); return m; };
    const P = G(), up = half(H, ['#a070ff', '#5a14e8', '#1e0866'], 0.5), dn = half(-H * 0.86, ['#8a5aff', '#4210c8', '#140440'], 0.42); up.position.y = 0.03; dn.position.y = -0.03; P.add(up); P.add(dn);
    const seam = new T.Mesh(new T.TorusGeometry(r * 0.5, 0.012, 6, 3), glowMat('#e6ccff', 1.5)); seam.rotation.x = PI / 2; seam.rotation.z = 0.3 + PI / 6; P.add(seam);   // the line where they meet, lit
    const disc = new T.Mesh(new T.CircleGeometry(r * 0.98, 3), new T.MeshBasicMaterial({ color: col('#d2b0ff'), transparent: true, opacity: 0.6, side: T.DoubleSide, toneMapped: false })); disc.rotation.x = -PI / 2; disc.rotation.z = -0.3 + PI / 2; P.add(disc);   // the light between them
    P.rotation.set(0.1, 0.62, 0.08); g.add(P);
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.4, m = new T.Mesh(new T.OctahedronGeometry(0.03, 0), glowMat('#d9b8ff', 1.2)); g.add(at(m, Math.cos(a) * 0.62, (k % 2 ? 0.08 : -0.06), Math.sin(a) * 0.3)); }
    return g;
} };
// ── CORE: a translucent teal flubber blob, three droplets ──
GEMS.core = { halo: '#19e6c1', az: 0.3, el: 0.22, exposure: 0.95, build() {
    const g = G(), mat = new T.MeshPhysicalMaterial({ color: col('#00c89e'), metalness: 0, roughness: 0.1, clearcoat: 0.45, clearcoatRoughness: 0.08, transparent: true, opacity: 0.86, emissive: col('#009a7c'), emissiveIntensity: 0.7 }); mat.envMapIntensity = 0.7;
    const b = new T.Mesh(blob(0.48, 0.09, 1.3), mat); b.scale.set(1.12, 0.86, 1.04); g.add(b);
    g.add(at(innerGlow('#7fffe0', 0.95, 0.42), 0.02, -0.02, 0));   // the light inside it, soft
    for (const [x, y, z, s] of [[0.62, 0.3, 0.1, 0.085], [-0.6, -0.12, 0.18, 0.07], [0.32, -0.5, 0.25, 0.06]]) { const d = new T.Mesh(blob(s, 0.06, x * 9, 24), mat); d.scale.y = 1.12; g.add(at(d, x, y, z)); }
    return g;
} };
// ── TOXIC: a green bubble with eight half-bubbles welling up ──
GEMS.toxic = { halo: '#5cff5c', az: 0.3, el: 0.2, build() {
    const g = G(), mat = new T.MeshPhysicalMaterial({ color: col('#36e83a'), metalness: 0, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.8, emissive: col('#139a1c'), emissiveIntensity: 0.55 }); mat.envMapIntensity = 1.0;
    const R = 0.46; g.add(new T.Mesh(new T.SphereGeometry(R, 48, 36), mat));
    g.add(at(innerGlow('#b8ff8a', 0.9, 0.4), 0, 0, 0));
    for (const [x, y, z, s] of [[0.18, 0.62, 0.1, 0.045], [-0.08, 0.76, 0.05, 0.03], [0.05, 0.9, -0.02, 0.022]]) g.add(at(new T.Mesh(new T.SphereGeometry(s, 16, 12), mat), x, y, z));
    const small = new T.MeshPhysicalMaterial({ color: col('#9dff6a'), metalness: 0, roughness: 0.08, clearcoat: 1, transparent: true, opacity: 0.85, emissive: col('#2fbf2f'), emissiveIntensity: 0.4 }); small.envMapIntensity = 2;
    const dirs = [[0.6, 0.6, 0.5], [-0.7, 0.4, 0.6], [0.1, 0.95, 0.3], [0.85, -0.2, 0.5], [-0.5, -0.55, 0.65], [0.3, -0.75, 0.6], [-0.9, 0.1, -0.2], [0.55, 0.3, -0.75]];
    dirs.forEach(([x, y, z], k) => { const d = new T.Vector3(x, y, z).normalize(), s = 0.09 + (k % 3) * 0.035; const hb = new T.Mesh(new T.SphereGeometry(s, 24, 12, 0, TAU, 0, PI / 2), small); hb.position.copy(d.clone().multiplyScalar(R * 0.97)); hb.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d); g.add(hb); });
    return g;
} };
// ── BLOOM: a lotus (8 outer, 7 mid, 5 inner petals), a gold stamen with ten pistils ──
GEMS.blossom = { halo: '#ff7ac8', az: 0.0, el: 0.3, exposure: 0.92, build() {
    const g = G();
    const petal = (len, wid, cup, cols) => {
        const geo = new T.PlaneGeometry(wid, len, 8, 14); geo.translate(0, len / 2, 0); const p = geo.attributes.position, cs = [];
        for (let i = 0; i < p.count; i++) { let x = p.getX(i), y = p.getY(i); const t = y / len, w = Math.pow(Math.sin(Math.min(1, t * 0.92 + 0.06) * PI), 0.55) * (1 - t * 0.12); x *= Math.max(0.04, w); const z = (x / (wid / 2)) ** 2 * cup * wid * 0.42 - t * t * len * 0.22; p.setXYZ(i, x, y, z); const c = gradAt(cols, t); cs.push(c.r, c.g, c.b); }
        geo.setAttribute('color', new T.Float32BufferAttribute(cs, 3)); geo.computeVertexNormals();
        const m = new T.MeshStandardMaterial({ vertexColors: true, side: T.DoubleSide, metalness: 0, roughness: 0.45, emissive: col('#ff2f90'), emissiveIntensity: 0.3 }); m.envMapIntensity = 0.5; return new T.Mesh(geo, m); };
    const ring = (n, len, wid, tilt, cup, cols, off, y) => { for (let k = 0; k < n; k++) { const a = (k + off) / n * TAU, P = G(), m = petal(len, wid, cup, cols); m.rotation.x = -tilt; P.add(m); P.rotation.y = a; P.position.y = y; g.add(P); } };
    ring(8, 0.6, 0.46, 1.08, 0.8, ['#7a0840', '#e8308a', '#ff9fcf'], 0, 0);
    ring(7, 0.52, 0.4, 0.6, 0.9, ['#a0125a', '#ff4fa3', '#ffc6e2'], 0.5, 0.03);
    ring(5, 0.42, 0.34, 0.24, 1.0, ['#d02a7c', '#ff7ab8', '#ffe0ef'], 0.25, 0.06);
    const gold = std('#ffcf3a', { metalness: 0.6, roughness: 0.3, emissiveHex: '#a86a00', env: 1.6 }); gold.emissiveIntensity = 0.5;
    const disk = new T.Mesh(new T.CylinderGeometry(0.1, 0.085, 0.07, 24), gold); g.add(at(disk, 0, 0.1, 0));
    for (let k = 0; k < 10; k++) { const a = k / 10 * TAU, s = new T.Mesh(new T.CylinderGeometry(0.006, 0.008, 0.16, 6), gold); s.rotation.set(Math.sin(a) * 0.45, 0, -Math.cos(a) * 0.45); g.add(at(s, Math.cos(a) * 0.06, 0.2, Math.sin(a) * 0.06));
        g.add(at(new T.Mesh(new T.SphereGeometry(0.018, 10, 8), glowMat('#ffe27a', 1.4)), Math.cos(a) * 0.1, 0.27, Math.sin(a) * 0.1)); }
    return g;
} };
`;
