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
function slurryPool(R) {
  const g = G(); const p = cyl(R, R * 1.03, 0.07, M.slurry, 40); p.position.y = 0.035; g.add(p);
  const rim = new T.Mesh(new T.TorusGeometry(R * 1.01, 0.035, 5, 40), M.rotDk); rim.rotation.x = PI / 2; rim.position.y = 0.06; g.add(rim);
  const gl = mesh(new T.CircleGeometry(R * 1.5, 40), M.rotWash, 0, 0.012, 0); gl.rotation.x = -PI / 2; g.add(gl);
  return g;
}
function rimShards(parent, R, n, seed) {   // pitted off-colour crystals standing round the pool
  for (let i = 0; i < n; i++) { const a = i * TAU / n + seed, ra = _hz(i, seed, 1), c = corroded(0.06 + ra * 0.04, 0.16 + ra * 0.2, 0.1, 0.8, i % 3 ? M.rot : M.rotDk);
    const g = G(); g.position.set(Math.sin(a) * R, 0.1 + ra * 0.05, Math.cos(a) * R); g.rotation.set((ra - 0.5) * 0.9, 0, (_hz(seed, i, 2) - 0.5) * 0.9); c.position.y = 0.12; g.add(c); parent.add(g); }
}
function drips(parent, x, z, y0, n, cols) {   // beads of slurry falling off the corroded half: update(t) moves them
  const out = [];
  for (let i = 0; i < n; i++) { const d = sphere(0.025 + 0.012 * (i % 2), M.slurry, 8); parent.add(d); out.push({ d, x: x + (_hz(i, 3, 4) - 0.5) * 0.3, z: z + (_hz(i, 5, 6) - 0.5) * 0.3, y0, ph: i / n }); }
  return t => out.forEach(o => { const u = ((t * 0.5 + o.ph) % 1); o.d.position.set(o.x, o.y0 * (1 - u * u) + 0.05, o.z); o.d.scale.setScalar(1 - u * 0.5); });
}
function _crystalHalf(r, h, tip) { const c = hexCrystal(r, h, tip, M.crystal); return c; }

fx(93, "Half-sunk crystal.", () => {   // standing in the pool, top half clean, a black shard through it
  const g = G(), b = G(); g.add(b); b.add(slurryPool(1.0)); rimShards(b, 0.95, 7, 0.3);
  const body = G(); b.add(body); body.rotation.z = 0.1;
  const low = corroded(0.32, 0.9, 0.35, 1.0); low.position.y = 0.75; body.add(low);
  const top = _crystalHalf(0.3, 0.7, 0.45); top.position.y = 1.65; body.add(top); const cg = glowSprite(0.7); cg.position.y = 1.7; body.add(cg);
  for (let i = 0; i < 4; i++) { const a = i * 1.7, sc = mesh(new T.IcosahedronGeometry(0.06, 0), M.scab, Math.sin(a) * 0.3, 1.25 + i * 0.08, Math.cos(a) * 0.3); sc.scale.y = 0.5; body.add(sc); }
  const s1 = shellShard(1.0, 0.3, 0.05); s1.position.set(-0.1, 1.15, 0.28); s1.rotation.set(0.2, 0.3, 0.45); body.add(s1);
  const s2 = shellShard(0.5, 0.2, 0.04); s2.position.set(0.22, 1.5, -0.2); s2.rotation.set(-0.1, 2.4, -0.5); body.add(s2);
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.7, 0.6); body.add(L); LIGHTS.push(L);
  return { g, core: 1.7, update(t) { body.position.y = bob(t, 0, 0.03); } };
});
fx(94, "Corroded rifle crystal.", () => {   // tilted like a barrel: the clean tip aims, the rotten tail drips into the pool
  const g = G(), b = G(); g.add(b); b.add(slurryPool(1.05)); rimShards(b, 1.0, 6, 1.1);
  const body = G(); body.position.set(0, 1.15, 0); body.rotation.x = 1.0; b.add(body);   // long axis points forward and a little up
  const low = corroded(0.27, 1.1, 0.3, 1.0, M.rot, 0.15); low.position.y = -0.45; body.add(low);
  const top = _crystalHalf(0.25, 0.8, 0.5); top.position.y = 0.55; body.add(top);
  const cg = glowSprite(0.65); cg.position.set(0, 0.9, 0); body.add(cg);
  const sh = shellShard(1.0, 0.3, 0.05); sh.position.set(0.0, 0.1, -0.2); sh.rotation.set(-0.3, 0.1, 0.0); body.add(sh);   // the old spine along its back
  const sh2 = shellShard(0.55, 0.22, 0.04); sh2.position.set(0.18, 0.4, 0.05); sh2.rotation.set(0.1, 1.6, 0.4); body.add(sh2);
  const dr = drips(b, 0, -0.55, 0.85, 5);
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.5, 0.9); b.add(L); LIGHTS.push(L);
  return { g, core: 1.7, update(t) { body.position.y = 1.15 + bob(t, 1, 0.03); dr(t); } };
});
fx(95, "Scabbed crystal.", () => {   // clean crystal wearing corroded scab plates on its lower half and one side, a black shard cap on top
  const g = G(), b = G(); g.add(b); b.add(slurryPool(1.0)); rimShards(b, 0.92, 6, 2.0);
  const body = G(); body.position.y = 0.3; b.add(body);
  const cr = _crystalHalf(0.34, 1.3, 0.55); cr.position.y = 1.05; body.add(cr); const cg = glowSprite(0.85); cg.position.y = 1.25; body.add(cg);
  for (let i = 0; i < 9; i++) { const a = 0.4 + i * 0.7, y = 0.45 + (i % 4) * 0.28, k = 1 - (y - 0.4) / 1.0;
    const pl = corroded(0.1 + k * 0.05, 0.3, 0.12, 0.7, i % 2 ? M.rot : M.scab); const holder = G(); holder.position.set(Math.sin(a) * 0.38, y, Math.cos(a) * 0.38); holder.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); holder.add(pl); body.add(holder); }
  const cap = shellShard(0.8, 0.36, 0.05); cap.position.set(-0.05, 1.62, 0.28); cap.rotation.set(0.5, 0.25, 0.3); body.add(cap);
  const cap2 = shellShard(0.62, 0.3, 0.05); cap2.position.set(0.1, 1.7, -0.26); cap2.rotation.set(-0.45, 3.0, -0.25); body.add(cap2);
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.7, 0.7); body.add(L); LIGHTS.push(L);
  return { g, core: 1.35, update(t) { body.position.y = 0.3 + bob(t, 0, 0.02); } };
});
fx(96, "Corroded crystal and satellites.", () => {   // a big rotting crystal in the pool, the shell's black shards orbiting its clean tip
  const g = G(), b = G(), orb = G(); g.add(b); b.add(slurryPool(1.1)); rimShards(b, 1.02, 8, 0.7);
  const body = G(); body.rotation.z = -0.12; b.add(body);
  const low = corroded(0.36, 1.0, 0.35, 1.0); low.position.y = 0.7; body.add(low);
  const top = _crystalHalf(0.33, 0.9, 0.55); top.position.y = 1.7; body.add(top); const cg = glowSprite(0.9); cg.position.y = 1.8; body.add(cg);
  orb.position.y = 1.95; b.add(orb);
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3, s = shellShard(0.5 + 0.12 * i, 0.22, 0.04), h = G(); h.position.set(Math.sin(a) * 0.62, (i - 1) * 0.12, Math.cos(a) * 0.62); h.rotation.y = a; s.rotation.set(0.0, PI / 2, 0.5); h.add(s); orb.add(h); }
  const sat = []; for (let i = 0; i < 3; i++) { const c = hexCrystal(0.06, 0.18, 0.1, M.crystal); b.add(c); sat.push(c); }
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.9, 0.8); b.add(L); LIGHTS.push(L);
  return { g, core: 1.8, update(t) { body.position.y = bob(t, 0, 0.025); orb.rotation.y = t * 0.6; sat.forEach((c, i) => { const a = t * 0.9 + i * TAU / 3; c.position.set(Math.sin(a) * 0.75, 0.55 + 0.3 * Math.sin(t + i), Math.cos(a) * 0.75); c.rotation.z = Math.sin(a) * 0.3; }); } };
});
fx(97, "Rising shard-clawed crystal.", () => {   // tall, rising out of the pool: slimy base, pristine tip, three black shell shards clasped round it like claws
  const g = G(), b = G(); g.add(b); b.add(slurryPool(0.95)); rimShards(b, 0.88, 7, 3.3);
  const body = G(); b.add(body);
  const low = corroded(0.3, 1.0, 0.3, 1.0, M.rot, 0.2); low.position.y = 0.75; body.add(low);
  const top = _crystalHalf(0.28, 0.8, 0.5); top.position.y = 1.75; body.add(top); const cg = glowSprite(0.8); cg.position.y = 1.8; body.add(cg);
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + 0.4, s = shellShard(0.95, 0.26, 0.045), h = G(); h.position.set(Math.sin(a) * 0.3, 1.2, Math.cos(a) * 0.3); h.rotation.y = a; s.rotation.set(-0.12, 0, 0); s.rotation.x = -0.18; h.add(s); body.add(h); s.position.z = 0.0; }
  const dr = drips(b, 0, 0, 0.9, 5);
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, 1.8, 0.8); b.add(L); LIGHTS.push(L);
  return { g, core: 1.8, update(t) { body.position.y = bob(t, 0, 0.03); dr(t); } };
});
