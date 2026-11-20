// THE ULTIMATES' FIELDS IN A BATTLE, IN 3D (view3d/fields.js; docs/VIEW-3D.md stage 5, docs/CARD-BATTLES.md §2.67). The owner, 2026-11-20, told that an Ultimate's field is not
// seen in a card battle (the game's 2D drawing waits while the battle's camera is up): "we should honestly begin work putting those into the game, the full animation", then "Start
// with the Ultimates' lasting fields". Each field an Ultimate left (js/cardults.js cardUltFields) is a thing of the 3D picture while the battle's camera is up: made when first seen,
// moved and animated by the game's own clock, taken away when the field is over. Its colours are its 2D drawing's (js/elements.js drawElementEffects); its shapes the agent's,
// provisional. FIRST THREE (drafts for the owner): THUNDERSTORM, EVENT HORIZON, TOXIC PUDDLE. Nothing here touches what a field does.
// In scope: T. liftAt(x, y): the floor's height there, in the view's units.
function battleFieldsMake(scene, liftAt) {
  const live = new Map(), UP = new T.Vector3(0, 1, 0), v = new T.Vector3();
  const mat = (hex, op, add) => { const m = new T.MeshBasicMaterial({ color: hex, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide, blending: add ? T.AdditiveBlending : T.NormalBlending }); m.userData.op = op; m.userData.noInk = true; return m; };
  const solid = hex => { const m = new T.MeshBasicMaterial({ color: hex, transparent: true, opacity: 1 }); m.userData.op = 1; return m; };
  const flat = m => { m.rotation.x = -Math.PI / 2; return m; }, add = (g, m, x, y, z) => { m.position.set(x || 0, y || 0, z || 0); g.add(m); return m; };
  const fade = (g, k) => g.traverse(o => { if (o.isMesh) o.material.opacity = o.material.userData.op * k * (o.userData.k === undefined ? 1 : o.userData.k); });
  const MAKE = {
    // THUNDERSTORM: a dark cloud bank over its ground, turning slowly; a pale yellow wash on the floor under it; a jagged bolt from the cloud to the one it strikes
    thunderstorm(e) { const g = new T.Group(), R = e.radius || 4, dark = solid('#1c1f2b'), cloud = new T.Group(), sg = new T.SphereGeometry(1, 10, 8);
      for (let i = 0; i < 9; i++) { const an = i * 2.4, d = i ? R * (0.1 + 0.05 * (i % 4)) : 0, s = 0.42 + (i % 3) * 0.12, m = add(cloud, new T.Mesh(sg, dark), Math.cos(an) * d, (i % 2) * 0.12, Math.sin(an) * d); m.scale.set(s * 1.25, s * 0.42, s * 1.05); }
      cloud.position.y = 2.7; g.add(cloud); add(g, flat(new T.Mesh(new T.CircleGeometry(R, 40), mat('#fff27a', 0.1))), 0, 0.02, 0);
      const bolt = new T.Group(), bm = mat('#fffbd0', 1, true), bg = new T.BoxGeometry(0.07, 1, 0.07); for (let i = 0; i < 6; i++) bolt.add(new T.Mesh(bg, bm)); bolt.visible = false; g.add(bolt);
      return { g, step(e, f0) { cloud.rotation.y = f0 * 0.004; cloud.position.y = 2.7 + Math.sin(f0 * 0.03) * 0.05;
        const since = (e.maxLife - e.life) - e.boltAt; bolt.visible = !!e.bolt && since >= 0 && since < 10;
        if (bolt.visible) { const tx = e.bolt[0] - e.x, tz = e.bolt[1] - e.y, ty = liftAt(e.bolt[0], e.bolt[1]) - liftAt(e.x, e.y) + 0.25; let px = tx * 0.2, py = 2.6, pz = tz * 0.2;
          for (let s = 0; s < 6; s++) { const u = (s + 1) / 6, j = s < 5 ? 0.22 : 0, nx = tx * (0.2 + 0.8 * u) + (((s * 37 + e.boltAt) % 11) - 5) * j * 0.2, nz = tz * (0.2 + 0.8 * u) + (((s * 53 + e.boltAt) % 7) - 3) * j * 0.3, ny = 2.6 + (ty - 2.6) * u, b = bolt.children[s];
            v.set(nx - px, ny - py, nz - pz); const L = v.length() || 1e-3; b.position.set((px + nx) / 2, (py + ny) / 2, (pz + nz) / 2); b.scale.set(1, L, 1); b.quaternion.setFromUnitVectors(UP, v.divideScalar(L)); b.userData.k = 1 - since / 10; px = nx; py = ny; pz = nz; } } } }; },
    // EVENT HORIZON: a black ball over its tile with a rim of violet light, a faint violet ground, three arcs of light on the floor swirling in to it
    eventhorizon(e) { const g = new T.Group(), R = e.radius || 4, arcs = [];
      add(g, flat(new T.Mesh(new T.CircleGeometry(R, 40), mat('#7a4adf', 0.13))), 0, 0.02, 0);
      for (let i = 0; i < 3; i++) arcs.push(add(g, flat(new T.Mesh(new T.TorusGeometry(R * (0.3 + i * 0.25), 0.035, 5, 36, 2.2), mat('#c9a6ff', 0.6, true))), 0, 0.04, 0));
      const ball = add(g, new T.Mesh(new T.SphereGeometry(0.42, 18, 14), solid('#050308')), 0, 0.62, 0), rim = add(g, new T.Mesh(new T.TorusGeometry(0.5, 0.045, 6, 30), mat('#e6d6ff', 0.95, true)), 0, 0.62, 0), halo = add(g, new T.Mesh(new T.TorusGeometry(0.72, 0.02, 5, 30), mat('#a070ff', 0.6, true)), 0, 0.62, 0);
      return { g, step(e, f0) { const sp = f0 * 0.12; arcs.forEach((a, i) => { a.rotation.z = sp + i; }); rim.rotation.set(1.15, f0 * 0.05, 0); halo.rotation.set(1.15 + Math.sin(f0 * 0.04) * 0.3, -f0 * 0.07, 0.4); const p = 1 + Math.sin(f0 * 0.2) * 0.05; ball.scale.setScalar(p); } }; },
    // TOXIC PUDDLE: no green ground (the owner, 2026-11-09: "Remove [the] green space"): its bubbles rising where it lies, and black spikes up through each one it bites
    toxicpuddle(e) { const g = new T.Group(), bub = [], spikes = new T.Group(), bm = mat('#b8ff8a', 0.75), sg = new T.SphereGeometry(0.07, 8, 6), black = solid('#0b0d10'), cg = new T.ConeGeometry(0.11, 0.8, 5);
      for (let i = 0; i < 9; i++) bub.push(add(g, new T.Mesh(sg, bm)));
      for (let i = 0; i < 12; i++) { const c = new T.Mesh(cg, black); c.visible = false; spikes.add(c); } g.add(spikes);
      return { g, step(e, f0) { const R = e.radius || 1;
        bub.forEach((b, i) => { const an = i * 2.4 + e.x, t = (f0 * 0.02 + i * 0.37) % 1, d = R * (0.25 + 0.5 * ((i * 7) % 5) / 5); b.position.set(Math.cos(an) * d, 0.05 + t * 0.5, Math.sin(an) * d); b.scale.setScalar(0.6 + t * 1.2); b.userData.k = 1 - t; });
        const since = (e.maxLife - e.life) - (e.shardAt || -99), up = Math.max(0, 1 - since / 18), rise = Math.min(1, since / 4 + 0.3), S = e.shards || [];
        spikes.children.forEach((c, i) => { const s = S[Math.floor(i / 3)]; c.visible = !!s && up > 0; if (!c.visible) return; const j = i % 3, an = j * 2.1 + s[0] * 3.1 + s[1] * 1.7, h = (j ? 0.7 : 1) * rise;
          c.position.set(s[0] - e.x + Math.cos(an) * 0.16 * (j ? 1 : 0), 0.4 * h, s[1] - e.y + Math.sin(an) * 0.16 * (j ? 1 : 0)); c.scale.set(1, h, 1); c.rotation.set(j ? Math.cos(an) * 0.3 : 0, 0, j ? Math.sin(an) * 0.3 : 0); c.userData.k = up; }); } }; },
  };
  // ONE FRAME: `list` the battle's fields (or null: none are shown), f0 the game's frame
  function step(list, f0) {
    for (const o of live.values()) o.seen = false;
    if (list) for (const e of list) { const mk = MAKE[e.type]; if (!mk) continue; let o = live.get(e); if (!o) { o = mk(e); o.g.traverse(m => { if (m.isMesh && m.material.userData.noInk) m.layers.set(2); }); scene.add(o.g);   /* (light and washes: off the ink line's pass, as the view's lines are) */ live.set(e, o); }
      o.seen = true; o.g.position.set(e.x, liftAt(e.x, e.y), e.y); o.step(e, f0); fade(o.g, Math.max(0, Math.min(1, (e.maxLife - e.life) / 10, e.life / 20))); }
    for (const [e, o] of live) if (!o.seen) { scene.remove(o.g); o.g.traverse(m => { if (m.isMesh) m.material.dispose(); }); live.delete(e); }
    return live.size;
  }
  return { step, kinds: Object.keys(MAKE), get size() { return live.size; } };
}
