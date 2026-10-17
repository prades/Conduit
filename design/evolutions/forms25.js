// ── THE SHARD JAR · the electric brawler, Nos. 641–: a thick, elegant jar (urn, vase, bowl or top) of matte black, rigid shards standing ornately along its sides,
// a gem above it that turns. It HOPS about; to attack the whole thing spins like a top, very fast. ──
const _sjBlack = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.1, roughness: 0.95, flatShading: true }); _sjBlack.envMapIntensity = 0.1;
function _sjBand() { const m = new T.MeshStandardMaterial({ color: 0x0a0800, emissive: new T.Color(EL.color).multiplyScalar(0.07), emissiveIntensity: 1.0, roughness: 1, metalness: 0 }); m.envMapIntensity = 0; return m; }
function _sjBrawler(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1.3);
  const hop = G(); b.add(hop); const spin = G(); hop.add(spin);
  // the body: a lathe of the profile, faceted
  const pts = o.prof.map(p => new T.Vector2(Math.max(0.0001, p[0]), p[1]));
  const jar = new T.Mesh(new T.LatheGeometry(pts, o.segs || 10), _sjBlack); jar.material = _sjBlack; spin.add(jar);
  const bands = _sjBand(); (o.bands || []).forEach(B => { const ring = new T.Mesh(new T.TorusGeometry(B.r, 0.022, 5, o.segs || 10), bands); ring.rotation.x = PI / 2; ring.position.y = B.y; spin.add(ring); });
  // the shards along its sides: tiers of rigid polished shards standing out from the body, alternating long and short, with a few lit ones between
  const shards = []; (o.tiers || []).forEach((Tr, ti) => { for (let i = 0; i < Tr.n; i++) { const a = i * TAU / Tr.n + (Tr.rot || 0) + ti * 0.2, long = i % 2 === 0, len = Tr.len * (long ? 1 : Tr.short || 0.6), sh = _clawShard(len, Tr.r * (long ? 1 : 0.8), 0, i * 7 + ti, 5), gs = G(); gs.add(sh);
      const out = new T.Vector3(Math.sin(a), 0, Math.cos(a)), dir = new T.Vector3(Math.sin(a) * Tr.lean, 1, Math.cos(a) * Tr.lean).normalize();
      gs.position.set(out.x * Tr.R, Tr.y, out.z * Tr.R); gs.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir); spin.add(gs); shards.push({ gs, a, len, base: gs.position.clone(), out, ti });
      if (Tr.litEvery && i % Tr.litEvery === Tr.litEvery - 1) { const ls = _prong(Tr.len * 0.4, Tr.r * 0.55, 'electric', i + ti * 11), gl = G(); gl.add(ls); const a2 = a + TAU / Tr.n * 0.5; gl.position.set(Math.sin(a2) * Tr.R * 1.02, Tr.y + 0.02, Math.cos(a2) * Tr.R * 1.02); gl.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), new T.Vector3(Math.sin(a2) * Tr.lean * 1.2, 1, Math.cos(a2) * Tr.lean * 1.2).normalize()); spin.add(gl); shards.push({ gs: gl, a: a2, len: Tr.len * 0.4, base: gl.position.clone(), out: new T.Vector3(Math.sin(a2), 0, Math.cos(a2)), ti, lit: true }); } } });
  // the gem above the mouth: it turns all the time, and faster when it attacks
  const G0 = o.gem, gem = G(); gem.position.y = G0.y; hop.add(gem);
  const gm = new T.Mesh(_litFacets(G0.hex ? new T.CylinderGeometry(G0.r, G0.r, G0.h, 6, 1).toNonIndexed() : new T.OctahedronGeometry(G0.r, 0)), new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); if (!G0.hex) gm.scale.y = 1.5; gem.add(gm);
  if (G0.hex) { const t1 = new T.Mesh(_litFacets(new T.ConeGeometry(G0.r, G0.r * 1.1, 6, 1).toNonIndexed()), new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); t1.position.y = G0.h / 2 + G0.r * 0.55; gem.add(t1); const b1 = new T.Mesh(_litFacets(new T.ConeGeometry(G0.r, G0.r * 1.1, 6, 1).toNonIndexed()), new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); b1.rotation.x = PI; b1.position.y = -G0.h / 2 - G0.r * 0.55; gem.add(b1); }
  const core = new T.Mesh(new T.OctahedronGeometry(G0.r * 0.4, 0), new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); core.scale.y = 1.4; gem.add(core);
  const halo = glowSprite(G0.r * 6); halo.material = halo.material.clone(); halo.material.opacity = 0.25; gem.add(halo);
  const L = new T.PointLight(0xffffff, 0.4, 3.5, 2); L.color.set(EL.color); L.position.set(0, G0.y, 0); b.add(L); LIGHTS.push(L);
  return { g, core: (G0.y * 0.7) * (o.S || 1.3), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    // hopping: up and down on a squash and stretch, forward on each hop; less of it as it winds up to spin
    const H = o.hopH * Math.abs(Math.sin(ph)) * (1 - 0.8 * ac), sq = Math.max(0, 1 - H / (0.3 * o.hopH + 0.001)) * (1 - ac);
    hop.position.y = H; hop.position.z = o.hopFwd * Math.sin(ph) * (1 - ac); hop.scale.set(1 + 0.1 * sq, 1 - 0.14 * sq + 0.05 * (1 - sq), 1 + 0.1 * sq); hop.rotation.x = 0.12 * Math.cos(ph) * (1 - ac) + 0.22 * ac;
    // the ATTACK: the whole jar spins like a top, very fast (a turn every couple of frames at its height), the shards flung out
    spin.rotation.y = ac * ph * 16 + 0.05 * Math.sin(ph * 2);
    shards.forEach(S => { const ext = 1 + (o.flare || 0.45) * ac, sway = 0.04 * Math.sin(ph * 2 + S.a * 3); S.gs.position.set(S.base.x * (1 + 0.18 * ac), S.base.y, S.base.z * (1 + 0.18 * ac)); S.gs.scale.setScalar(ext * (S.lit ? 1 + 0.4 * (0.5 + 0.5 * Math.sin(ph * 3 + S.a)) : 1)); });
    gem.rotation.y = ph * 2 + ac * ph * 18; gem.position.y = G0.y + 0.04 * Math.sin(ph * 2) * (1 - ac) + 0.05 * ac; gem.scale.setScalar(1 + 0.25 * ac); core.scale.setScalar(1 + 0.2 * Math.sin(ph * 4) + 0.5 * ac); core.scale.y *= 1.4; halo.material.opacity = 0.2 + 0.1 * Math.sin(ph * 3) + 0.35 * ac; L.intensity = 0.4 + 0.9 * ac; } };
}
const _sjUrn = [[0.0, 0.0], [0.2, 0.0], [0.3, 0.05], [0.55, 0.32], [0.58, 0.45], [0.5, 0.68], [0.34, 0.84], [0.22, 0.95], [0.25, 1.04], [0.33, 1.1], [0.27, 1.1], [0.2, 1.03], [0.0, 1.0]];
const _sjTier1 = { n: 12, y: 0.4, R: 0.6, len: 0.5, short: 0.6, r: 0.045, lean: 0.5, litEvery: 3 };
fx(641, "An ornate shard jar: a thick black urn with bronze bands, a ring of rigid polished shards standing out along its belly (long and short alternating, a few lit), and a gem turning above its mouth. It hops; to attack, it spins like a top.", () => _sjBrawler({ prof: _sjUrn, bands: [{ r: 0.56, y: 0.4 }, { r: 0.27, y: 0.98 }], tiers: [_sjTier1], gem: { r: 0.12, y: 1.45 }, hopH: 0.3, hopFwd: 0.08 }));
fx(642, "Two tiers of shards, belly and shoulder, a hex crystal seated in the mouth, more ornate.", () => _sjBrawler({ prof: _sjUrn, bands: [{ r: 0.56, y: 0.4 }, { r: 0.45, y: 0.72 }, { r: 0.27, y: 0.98 }], tiers: [_sjTier1, { n: 10, y: 0.74, R: 0.47, len: 0.36, short: 0.6, r: 0.04, lean: 0.6, rot: 0.3 }], gem: { r: 0.1, h: 0.2, hex: true, y: 1.3 }, hopH: 0.28, hopFwd: 0.08 }));
fx(643, "A squat, wide bowl with a sunburst of shards all round its rim, the gem hovering above, like a spinning top lying in wait.", () => _sjBrawler({ prof: [[0.0, 0.0], [0.22, 0.0], [0.5, 0.1], [0.78, 0.34], [0.82, 0.5], [0.76, 0.5], [0.72, 0.36], [0.45, 0.2], [0.0, 0.18]], bands: [{ r: 0.8, y: 0.46 }], tiers: [{ n: 16, y: 0.46, R: 0.8, len: 0.55, short: 0.55, r: 0.045, lean: 1.1, litEvery: 4 }], gem: { r: 0.13, y: 0.95 }, hopH: 0.26, hopFwd: 0.1 }));
fx(644, "A tall slender vase, the shards sweeping up and in along its sides like petals, the gem above the neck.", () => _sjBrawler({ prof: [[0.0, 0.0], [0.18, 0.0], [0.4, 0.2], [0.44, 0.45], [0.3, 0.8], [0.15, 1.1], [0.13, 1.3], [0.22, 1.42], [0.16, 1.42], [0.1, 1.3], [0.0, 1.25]], bands: [{ r: 0.43, y: 0.42 }, { r: 0.14, y: 1.25 }], tiers: [{ n: 10, y: 0.3, R: 0.42, len: 0.7, short: 0.65, r: 0.045, lean: -0.25, litEvery: 3 }], gem: { r: 0.11, y: 1.8 }, hopH: 0.34, hopFwd: 0.06 }));
fx(645, "A spinning-top shape: a fat cone on a point, shards ringing its rim, the gem crowning it. It hops on its point.", () => _sjBrawler({ prof: [[0.0, 0.0], [0.05, 0.02], [0.3, 0.3], [0.6, 0.55], [0.62, 0.66], [0.5, 0.7], [0.25, 0.72], [0.0, 0.7]], bands: [{ r: 0.61, y: 0.6 }], tiers: [{ n: 12, y: 0.62, R: 0.62, len: 0.5, short: 0.6, r: 0.045, lean: 0.9, litEvery: 3 }], gem: { r: 0.13, y: 1.05 }, hopH: 0.34, hopFwd: 0.08 }));
