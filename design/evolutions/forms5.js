// ── CORRODED CRYSTAL · the toxic sniper, Nos. 93–97 ──────────────────────
// NB three r128 treats hex colours as linear, so these are far darker than they look in a picker.
// A six-sided crystal eaten away from below: the top half clean and lit, the lower half pitted and
// off-colour, standing in (or dripping into) a pool of the same crystal gone sour. A black shard of its
// old shell is still stuck in the clean half.
M.rot    = new T.MeshStandardMaterial({ color: 0x0a0b01, emissive: 0x070900, emissiveIntensity: 1.0, metalness: 0.05, roughness: 0.55, flatShading: true });
M.rotDk  = new T.MeshStandardMaterial({ color: 0x040401, emissive: 0x030300, emissiveIntensity: 0.8, metalness: 0.05, roughness: 0.8, flatShading: true });
M.slurry = new T.MeshStandardMaterial({ color: 0x050702, emissive: 0x0c1100, emissiveIntensity: 1.0, metalness: 0.0, roughness: 0.92 });
M.rotWash = new T.MeshBasicMaterial({ color: 0x5a6a10, transparent: true, opacity: 0.12, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false });
M.scab   = new T.MeshStandardMaterial({ color: 0x0a0c02, emissive: 0x050700, emissiveIntensity: 0.8, metalness: 0.2, roughness: 0.7, flatShading: true });
for (const m of [M.rot, M.rotDk, M.slurry, M.scab]) m.envMapIntensity = 0.2;
const _hz = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
// A six-sided crystal eaten away: every vertex pulled in by noise, most at the bottom (amt 0..1, `top` = where it starts, 0 bottom … 1 top).
function corroded(r, h, tip, amt, mat, reach) {
  const ys = [-h / 2, -h * 0.3, -h * 0.1, h * 0.1, h * 0.3, h / 2], pts = [new T.Vector2(0.0001, -h / 2 - tip * 0.7)];
  ys.forEach(y => pts.push(new T.Vector2(r, y))); pts.push(new T.Vector2(0.0001, h / 2 + tip));
  const geo = new T.LatheGeometry(pts, 6), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), rr = Math.hypot(x, z); if (rr < 0.002) continue;
    const k = Math.max(0, Math.min(1, (h / 2 * (reach == null ? 1 : reach) - y) / h)), c = amt * k * k * (3 - 2 * k);   // 1 at the foot, 0 at `reach`
    const n = _hz(Math.round(x * 400), Math.round(y * 400), Math.round(z * 400)), n2 = _hz(Math.round(z * 400), Math.round(x * 400), Math.round(y * 400));
    const s = 1 - c * (0.15 + 0.6 * n); p.setXYZ(i, x * s, y + (n2 - 0.5) * c * 0.12, z * s);
  }
  geo.computeVertexNormals(); return new T.Mesh(geo, mat || M.rot);
}
function shellShard(len, w, th) {   // a broken piece of the old black shell: jagged, glassy-black
  const g = G(); g.add(plate([[-w / 2, 0], [-w * 0.52, len * 0.4], [-w * 0.24, len * 0.52], [-w * 0.34, len * 0.88], [0, len], [w * 0.36, len * 0.62], [w * 0.14, len * 0.5], [w * 0.5, len * 0.22], [w / 2, 0]], th, 0.008, M.black));
  const cr = cbox(0.012, len * 0.42, th * 1.1, 0.002, M.glow); cr.position.set(w * 0.04, len * 0.3, th / 2); g.add(cr); return g;   // a hairline of crystal light in the crack
}
// The pool's edge: a blobby outline, wider in places and pinched in others, with a lobe running out. a = angle round it
// (0 = +z), seed varies the shape, t shifts it: the harmonics turn at whole multiples of 1.6 rad/s, so the idle loop (2π/1.6 s) closes.
function blobR(a, R, seed, t) {
  const sd = seed || 0, w = 1.6 * (t || 0), L = (((a - sd * 2.2 - w) % TAU) + TAU + PI) % TAU - PI;
  return R * (1 + 0.16 * Math.sin(2 * a + sd * 3.1 + w) + 0.11 * Math.sin(3 * a + sd * 1.7 + 1 - w) + 0.07 * Math.sin(5 * a + sd * 2.3 + 2 * w) + 0.2 * Math.exp(-L * L * 3));
}
function blobShape(R, seed, k, cx, cz, t) {   // the outline as a Shape in x-y (y = -z once laid flat)
  const sh = new T.Shape(), N = 64;
  for (let i = 0; i <= N; i++) { const a = i / N * TAU, r = blobR(a, R, seed, t) * (k || 1); const x = (cx || 0) + Math.sin(a) * r, z = (cz || 0) + Math.cos(a) * r; if (i) sh.lineTo(x, -z); else sh.moveTo(x, -z); }
  return sh;
}
function slurryPool(R, seed, puddles, poolMat, lipMat) {   // (the materials: olive slurry unless given)
  const g = G(), parts = [];
  const lay = (build, mat, y) => { const m = new T.Mesh(build(0), mat); m.rotation.x = -PI / 2; m.position.y = y; g.add(m); parts.push({ m, build }); };
  const ext = (sh, depth) => new T.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  lay(t => ext(blobShape(R, seed, 1.07, 0, 0, t), 0.05), lipMat || M.rotDk, 0);        // the dark lip
  lay(t => ext(blobShape(R, seed, 1.0, 0, 0, t), 0.045), poolMat || M.slurry, 0.035);   // the pool
  lay(t => new T.ShapeGeometry(blobShape(R, seed, 1.5, 0, 0, t)), M.rotWash, 0.012);
  // two small puddles that have got away from it, drifting with it
  for (let i = 0; i < (puddles == null ? 2 : puddles); i++) lay(t => { const a = seed * 2.7 + i * 2.9 + 1 + 0.3 * Math.sin(1.6 * t + i * 2), d = blobR(a, R, seed, t) * 1.25 + 0.12;
    return ext(blobShape(0.13 + 0.05 * i, seed + i + 1, 1, Math.sin(a) * d, Math.cos(a) * d, t), 0.04); }, poolMat || M.slurry, 0.005);
  g.userData.ground = true;   // flat on the floor: baked to the ground sheet (design/evolutions/bake.js)
  g.shift = t => parts.forEach(p => { p.m.geometry.dispose(); p.m.geometry = p.build(t); });
  g.shift(0.9);
  return g;
}
function rimShards(parent, R, n, seed) {   // pitted off-colour crystals standing round the pool's irregular edge; returns update(t), which moves them with the edge
  const all = [];
  for (let i = 0; i < n; i++) { const a = i * TAU / n + seed + (_hz(i, seed, 9) - 0.5) * 0.5, ra = _hz(i, seed, 1), c = corroded(0.06 + ra * 0.04, 0.16 + ra * 0.2, 0.1, 0.8, i % 3 ? M.rot : M.rotDk), k = 0.9 + 0.12 * _hz(i, seed, 5);
    const g = G(); g.rotation.set((ra - 0.5) * 0.9, 0, (_hz(seed, i, 2) - 0.5) * 0.9); c.position.y = 0.12; g.add(c); parent.add(g); all.push({ g, a, k, y: 0.1 + ra * 0.05 }); }
  const place = t => all.forEach(o => { const rr = blobR(o.a, R, seed, t) * o.k; o.g.position.set(Math.sin(o.a) * rr, o.y, Math.cos(o.a) * rr); });
  place(0.9); return place;
}
function drips(parent, x, z, y0, n, cols) {   // beads of slurry falling off the corroded half: update(t) moves them
  const out = [];
  for (let i = 0; i < n; i++) { const d = sphere(0.025 + 0.012 * (i % 2), M.slurry, 8); parent.add(d); out.push({ d, x: x + (_hz(i, 3, 4) - 0.5) * 0.3, z: z + (_hz(i, 5, 6) - 0.5) * 0.3, y0, ph: i / n }); }
  return t => out.forEach(o => { const u = ((t * 0.5 + o.ph) % 1); o.d.position.set(o.x, o.y0 * (1 - u * u) + 0.05, o.z); o.d.scale.setScalar(1 - u * 0.5); });
}
function _crystalHalf(r, h, tip) { const c = hexCrystal(r, h, tip, M.crystal); return c; }

fx(93, "Half-sunk crystal.", () => {   // standing in the pool, top half clean, a black shard through it
  const g = G(), b = G(); g.add(b); const pool = slurryPool(1.0, 0.3); b.add(pool); const rim = rimShards(b, 1.0 * 0.92, 7, 0.3);
  const body = G(); b.add(body); body.rotation.z = 0.1;
  const low = corroded(0.32, 0.9, 0.35, 1.0); low.position.y = 0.75; body.add(low);
  const top = _crystalHalf(0.3, 0.7, 0.45); top.position.y = 1.65; body.add(top); const cg = glowSprite(0.7); cg.position.y = 1.7; body.add(cg);
  for (let i = 0; i < 4; i++) { const a = i * 1.7, sc = mesh(new T.IcosahedronGeometry(0.06, 0), M.scab, Math.sin(a) * 0.3, 1.25 + i * 0.08, Math.cos(a) * 0.3); sc.scale.y = 0.5; body.add(sc); }
  const s1 = shellShard(0.8, 0.3, 0.05); s1.position.set(-0.1, 1.2, 0.28); s1.rotation.set(0.2, 0.3, 0.45); body.add(s1);
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.7, 0.6); body.add(L); LIGHTS.push(L);
  return { g, core: 1.7, update(t) { pool.shift(t); rim(t); body.position.y = bob(t, 0, 0.03); } };
});
fx(94, "Corroded rifle crystal.", () => {   // tilted like a barrel: the clean tip aims, the rotten tail drips into the pool
  const g = G(), b = G(); g.add(b); const pool = slurryPool(1.05, 1.1); b.add(pool); const rim = rimShards(b, 1.05 * 0.92, 6, 1.1);
  const body = G(); body.position.set(0, 1.15, 0); body.rotation.x = 1.0; b.add(body);   // long axis points forward and a little up
  const low = corroded(0.27, 1.1, 0.3, 1.0, M.rot, 0.15); low.position.y = -0.45; body.add(low);
  const top = _crystalHalf(0.25, 0.8, 0.5); top.position.y = 0.55; body.add(top);
  const cg = glowSprite(0.65); cg.position.set(0, 0.9, 0); body.add(cg);
  const sh = shellShard(0.8, 0.3, 0.05); sh.position.set(0.0, 0.1, -0.2); sh.rotation.set(-0.3, 0.1, 0.0); body.add(sh);   // the old spine along its back
  const dr = drips(b, 0, -0.55, 0.85, 5);
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.5, 0.9); b.add(L); LIGHTS.push(L);
  return { g, core: 1.7, update(t) { pool.shift(t); rim(t); body.position.y = 1.15 + bob(t, 1, 0.03); dr(t); } };
});
fx(95, "Scabbed crystal.", () => {   // clean crystal wearing corroded scab plates on its lower half and one side, a black shard cap on top
  const g = G(), b = G(); g.add(b); const pool = slurryPool(1.0, 2.0); b.add(pool); const rim = rimShards(b, 1.0 * 0.92, 6, 2.0);
  const body = G(); body.position.y = 0.3; b.add(body);
  const cr = _crystalHalf(0.34, 1.3, 0.55); cr.position.y = 1.05; body.add(cr); const cg = glowSprite(0.85); cg.position.y = 1.25; body.add(cg);
  for (let i = 0; i < 9; i++) { const a = 0.4 + i * 0.7, y = 0.45 + (i % 4) * 0.28, k = 1 - (y - 0.4) / 1.0;
    const pl = corroded(0.1 + k * 0.05, 0.3, 0.12, 0.7, i % 2 ? M.rot : M.scab); const holder = G(); holder.position.set(Math.sin(a) * 0.38, y, Math.cos(a) * 0.38); holder.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); holder.add(pl); body.add(holder); }
  const cap = shellShard(0.8, 0.32, 0.05); cap.position.set(-0.05, 1.62, 0.28); cap.rotation.set(0.5, 0.25, 0.3); body.add(cap);
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.7, 0.7); body.add(L); LIGHTS.push(L);
  return { g, core: 1.35, update(t) { pool.shift(t); rim(t); body.position.y = 0.3 + bob(t, 0, 0.02); } };
});
fx(96, "Corroded crystal and satellites.", () => {   // a big rotting crystal in the pool, the shell's black shards orbiting its clean tip
  const g = G(), b = G(), orb = G(); g.add(b); const pool = slurryPool(1.1, 0.7); b.add(pool); const rim = rimShards(b, 1.1 * 0.92, 8, 0.7);
  const body = G(); body.rotation.z = -0.12; b.add(body);
  const low = corroded(0.36, 1.0, 0.35, 1.0); low.position.y = 0.7; body.add(low);
  const top = _crystalHalf(0.33, 0.9, 0.55); top.position.y = 1.7; body.add(top); const cg = glowSprite(0.9); cg.position.y = 1.8; body.add(cg);
  orb.position.y = 1.95; b.add(orb);
  for (let i = 0; i < 1; i++) { const a = i * TAU / 3, s = shellShard(0.75, 0.28, 0.05), h = G(); h.position.set(Math.sin(a) * 0.62, (i - 1) * 0.12, Math.cos(a) * 0.62); h.rotation.y = a; s.rotation.set(0.0, PI / 2, 0.5); h.add(s); orb.add(h); }
  const sat = []; for (let i = 0; i < 3; i++) { const c = hexCrystal(0.06, 0.18, 0.1, M.crystal); b.add(c); sat.push(c); }
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.9, 0.8); b.add(L); LIGHTS.push(L);
  return { g, core: 1.8, update(t) { pool.shift(t); rim(t); body.position.y = bob(t, 0, 0.025); orb.rotation.y = t * 0.6; sat.forEach((c, i) => { const a = t * 0.9 + i * TAU / 3; c.position.set(Math.sin(a) * 0.75, 0.55 + 0.3 * Math.sin(t + i), Math.cos(a) * 0.75); c.rotation.z = Math.sin(a) * 0.3; }); } };
});
fx(97, "Rising shard-clawed crystal.", () => {   // tall, rising out of the pool: slimy base, pristine tip, three black shell shards clasped round it like claws
  const g = G(), b = G(); g.add(b); const pool = slurryPool(0.95, 3.3); b.add(pool); const rim = rimShards(b, 0.95 * 0.92, 7, 3.3);
  const body = G(); b.add(body);
  const low = corroded(0.3, 1.0, 0.3, 1.0, M.rot, 0.2); low.position.y = 0.75; body.add(low);
  const top = _crystalHalf(0.28, 0.8, 0.5); top.position.y = 1.75; body.add(top); const cg = glowSprite(0.8); cg.position.y = 1.8; body.add(cg);
  for (let i = 0; i < 1; i++) { const a = 0.4, s = shellShard(0.8, 0.3, 0.05), h = G(); h.position.set(Math.sin(a) * 0.3, 1.2, Math.cos(a) * 0.3); h.rotation.y = a; s.rotation.set(-0.12, 0, 0); s.rotation.x = -0.18; h.add(s); body.add(h); s.position.z = 0.0; }
  const dr = drips(b, 0, 0, 0.9, 5);
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.8, 0.8); b.add(L); LIGHTS.push(L);
  return { g, core: 1.8, update(t) { pool.shift(t); rim(t); body.position.y = bob(t, 0, 0.03); dr(t); } };
});

// ── No. 95, simplified (Nos. 98–100): the clean crystal, a corroded lower half, ONE black shard, the shifting pool ──
fx(98, "95, fewer lumps.", () => {   // 95 with four scabs, a third of the rim crystals
  const g = G(), b = G(); g.add(b); const pool = slurryPool(1.0, 2.0); b.add(pool); const rim = rimShards(b, 0.92, 3, 2.0);
  const body = G(); body.position.y = 0.3; b.add(body);
  const cr = _crystalHalf(0.34, 1.3, 0.55); cr.position.y = 1.05; body.add(cr); const cg = glowSprite(0.85); cg.position.y = 1.25; body.add(cg);
  for (let i = 0; i < 4; i++) { const a = 0.6 + i * 1.5, y = 0.5 + (i % 2) * 0.3, pl = corroded(0.13, 0.32, 0.12, 0.7, i % 2 ? M.rot : M.scab), h = G(); h.position.set(Math.sin(a) * 0.38, y, Math.cos(a) * 0.38); h.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); h.add(pl); body.add(h); }
  const cap = shellShard(0.8, 0.32, 0.05); cap.position.set(-0.05, 1.62, 0.28); cap.rotation.set(0.5, 0.25, 0.3); body.add(cap);
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.7, 0.7); body.add(L); LIGHTS.push(L);
  return { g, core: 1.35, update(t) { pool.shift(t); rim(t); body.position.y = 0.3 + bob(t, 0, 0.02); } };
});
fx(99, "95, one corroded half.", () => {   // the lower half of the crystal itself is the corroded part; no scabs, no rim crystals
  const g = G(), b = G(); g.add(b); const pool = slurryPool(1.0, 2.0, 1); b.add(pool);
  const body = G(); body.position.y = 0.3; b.add(body);
  const low = corroded(0.34, 0.8, 0.3, 1.0); low.position.y = 0.7; body.add(low);
  const top = _crystalHalf(0.34, 0.75, 0.55); top.position.y = 1.5; body.add(top); const cg = glowSprite(0.85); cg.position.y = 1.6; body.add(cg);
  const cap = shellShard(0.8, 0.32, 0.05); cap.position.set(-0.05, 1.5, 0.3); cap.rotation.set(0.5, 0.25, 0.3); body.add(cap);
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.7, 0.7); body.add(L); LIGHTS.push(L);
  return { g, core: 1.55, update(t) { pool.shift(t); body.position.y = 0.3 + bob(t, 0, 0.02); } };
});
fx(100, "95, bare.", () => {   // crystal, three scabs at its foot, the one shard, the pool: nothing else
  const g = G(), b = G(); g.add(b); const pool = slurryPool(1.0, 2.0, 0); b.add(pool);
  const body = G(); body.position.y = 0.3; b.add(body);
  const cr = _crystalHalf(0.34, 1.3, 0.55); cr.position.y = 1.05; body.add(cr); const cg = glowSprite(0.85); cg.position.y = 1.25; body.add(cg);
  for (let i = 0; i < 3; i++) { const a = 0.3 + i * 2.1, pl = corroded(0.15, 0.34, 0.14, 0.8, i % 2 ? M.rot : M.scab), h = G(); h.position.set(Math.sin(a) * 0.36, 0.5, Math.cos(a) * 0.36); h.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); h.add(pl); body.add(h); }
  const cap = shellShard(0.8, 0.32, 0.05); cap.position.set(-0.05, 1.62, 0.28); cap.rotation.set(0.5, 0.25, 0.3); body.add(cap);
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.7, 0.7); body.add(L); LIGHTS.push(L);
  return { g, core: 1.35, update(t) { pool.shift(t); body.position.y = 0.3 + bob(t, 0, 0.02); } };
});

// ── The crystal eaten by the pool (Nos. 101–103): tilted, clean above, its own lower half ragged and dissolving where the slurry climbs it.
// No separate corroded part between the two: the pool meets the crystal itself.
function slurryMound(r, h, seed) {   // slurry heaped up round the crystal's foot, with an uneven top
  const geo = new T.SphereGeometry(r, 14, 6, 0, TAU, 0, PI / 2), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = _hz(Math.round(x * 300) + seed, Math.round(y * 300), Math.round(z * 300)); p.setXYZ(i, x * (0.92 + 0.16 * n), y * h / r * (0.8 + 0.4 * n), z * (0.92 + 0.16 * n)); }
  geo.computeVertexNormals(); return new T.Mesh(geo, M.slurry);
}
function eatenCrystal(r, h, tip, reach) { return corroded(r, h, tip, 1.0, M.crystal, reach); }
function _eatenDesign(opts) {
  const g = G(), b = G(); g.add(b); const R = opts.R || 1.0, pool = slurryPool(R, opts.seed, 1); b.add(pool);
  const piv = G(); piv.position.set(0, 0.08, 0); piv.rotation.set(opts.tx, 0, opts.tz); b.add(piv);   // tilts about the point where it goes into the pool
  const cr = eatenCrystal(0.34, opts.h, 0.55, opts.reach); cr.position.y = opts.h / 2 + opts.up; piv.add(cr);
  const cg = glowSprite(0.85); cg.position.y = opts.h * 0.7 + opts.up; piv.add(cg);
  const sh = shellShard(0.8, 0.32, 0.05); sh.position.set(-0.05, opts.h * 0.8 + opts.up, 0.28); sh.rotation.set(0.5, 0.25, 0.3); piv.add(sh);   // the one old-shell shard, in the clean half
  const mound = slurryMound(0.55, 0.32, opts.seed * 10); mound.position.y = 0.0; piv.add(mound);
  const bits = []; for (let i = 0; i < (opts.bits || 0); i++) { const c = eatenCrystal(0.07 + 0.02 * i, 0.18, 0.1, 0.6); b.add(c); bits.push(c); }
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.7, 0.7); b.add(L); LIGHTS.push(L);
  return { g, core: opts.h * 0.7 + 0.2, update(t, act) { pool.shift(t); piv.rotation.z = opts.tz + 0.02 * Math.sin(1.6 * t); piv.rotation.x = opts.tx - 0.22 * (act || 0); mound.scale.setScalar(1 + 0.04 * Math.sin(1.6 * t + 1) + 0.12 * (act || 0));   // when it fires it recoils and the pool surges
    bits.forEach((c, i) => { const a = i * 2.4 + 0.6 + 0.4 * Math.sin(1.6 * t + i), d = (0.7 + 0.15 * i) * R; c.position.set(Math.sin(a) * d, 0.1, Math.cos(a) * d); c.rotation.set(1.1 + i * 0.3, a, 0.5); }); } };
}
fx(101, "Eaten crystal, leaning.", () => _eatenDesign({ seed: 2.0, h: 1.5, up: 0.25, reach: 0.5, tx: -0.12, tz: -0.35, R: 0.8 }));
fx(102, "Eaten crystal, toppling.", () => _eatenDesign({ seed: 1.1, h: 1.6, up: 0.1, reach: 0.9, tx: -0.25, tz: -0.65 }));
fx(103, "Eaten crystal, shedding bits.", () => _eatenDesign({ seed: 3.3, h: 1.4, up: 0.2, reach: 0.7, tx: 0.1, tz: -0.25, bits: 3, R: 0.8 }));
