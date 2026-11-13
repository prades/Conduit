// REEF'S CLIMB (STONEPETAL's utility, docs/TECHNICIANS.md): BOULDER STEPS, design 5 of the ten (design/props/drafts: the owner, 2026-11-12, "5 is cool, polish it more details and rocks", then
// "Build it" on the polished draft). In STONEPETAL's own make (design/evolutions/forms38.js, No. 914/923, whose helpers are copied here): smooth boulders of its plated near-black stone heaped into steps,
// each one's top flattened to a lighter tread, a capstone on the lip, side rocks and pebbles round its foot, its square crystals wedged in the gaps (never on a tread) with BLOOM's pink glowing over the rock
// from each, and two crystal flowers on the side rocks.
// One sprite for each way a climb can face and each height of ledge the map has. Its ORIGIN (the sprite's anchor) is the foot of the ledge's face, on the low floor, in the middle of the climb; the climb
// runs out from the face onto the low floor. Variants `<side><height>`:
//   side     where the climb stands from the face: s (south of it: the face looks down-left on screen, toward the camera), w (west), e (east), n (north)
//   height   the ledge in tenths of a tile of height: 18 (the arena up to the Catwalk Spur), 34 (the Nest's brood up to its shelf), 50 (the arena up to the catwalks); 34 px a tile
// Marks: `lip` (the middle of the capstone, on the ledge) and `toe` (the far end of its run, on the low floor).
// Everything is in a block: the helpers must not collide with the other families'.
{
  const V3 = (x, y, z) => new T.Vector3(x || 0, y || 0, z || 0);
  const rndOf = s => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const smooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  // STONEPETAL's crystal (forms38.js _ccCrystal): a square prism, its top cut at a slant to an apex, its foot sunk
  const crystalGeo = (h, r, tip, jag, twist, seed, bot) => {
    const rn = rndOf(seed), q = [], at = (k, y, rr) => [rr * Math.cos(twist + k * PI / 2), y, rr * Math.sin(twist + k * PI / 2)];
    const top = [0, 1, 2, 3].map(k => at(k, h * (1 - 0.12 * rn()), r)), foot = [0, 1, 2, 3].map(k => at(k, 0, r * (bot ? 0.95 : 0.82))), ax = jag * (rn() - 0.5) * r, az = jag * (rn() - 0.5) * r, apex = [ax, h + tip, az];
    for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; q.push(foot[k], top[k2], foot[k2], foot[k], top[k], top[k2], top[k], apex, top[k2]); }
    if (bot) { const low = [0.5 * jag * (rn() - 0.5) * r, -bot, 0.5 * jag * (rn() - 0.5) * r]; for (let k = 0; k < 4; k++) q.push(foot[k], foot[(k + 1) % 4], low); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(q.flat(), 3)); geo.computeVertexNormals(); return geo;
  };
  const smoothSeams = (geo, NW) => {   // (a sphere's seam and poles: one normal each, so no line shows)
    const nr = geo.attributes.normal, R = NW + 1, rows = nr.count / R, s = V3();
    const avg = ids => { s.set(0, 0, 0); ids.forEach(j => { s.x += nr.getX(j); s.y += nr.getY(j); s.z += nr.getZ(j); }); s.normalize(); ids.forEach(j => nr.setXYZ(j, s.x, s.y, s.z)); };
    avg(Array.from({ length: R }, (_, j) => j)); avg(Array.from({ length: R }, (_, j) => (rows - 1) * R + j));
    for (let r = 1; r < rows - 1; r++) avg([r * R, r * R + NW]);
  };
  const aim = (obj, dir, up) => { const y = dir.clone().normalize(), z = up.clone().sub(y.clone().multiplyScalar(up.dot(y))).normalize(), x = new T.Vector3().crossVectors(y, z); obj.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z)); };
  // a crystal coloured facet by facet (lit from the upper left, a hot sheen on the faces toward the light), unlit so it keeps BLOOM's pink in any room
  const gemMesh = (geo, base) => {
    geo = geo.index ? geo.toNonIndexed() : geo;
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3); geo.setAttribute('color', new T.BufferAttribute(col, 3));
    const m = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
    const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3(), Ld = new T.Vector3(-0.4, 0.7, 0.6).normalize();
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i); b.fromBufferAttribute(pos, i + 1); c.fromBufferAttribute(pos, i + 2);
      n.crossVectors(b.sub(a), c.sub(a)).normalize();
      const k = 0.5 + 0.5 * n.dot(Ld), w = 0.45 * k * k * k, f = 0.35 + 0.65 * k;
      for (let j = 0; j < 3; j++) { col[(i + j) * 3] = base.r * f + w; col[(i + j) * 3 + 1] = base.g * f + w; col[(i + j) * 3 + 2] = base.b * f + w; }
    }
    return m;
  };
  const PINK = new T.Color('#ff7ab8').convertSRGBToLinear();
  // THE STONE: STONEPETAL's (near-black, a soft sheen), BLOOM's pink spreading over it from every crystal that breaks out of it (glow: world points with a reach), its flat tops lighter (the treads)
  const stoneMat = (glow, tone) => {
    const m = new T.MeshPhysicalMaterial({ color: new T.Color(tone).convertSRGBToLinear(), emissive: PINK, metalness: 0, roughness: 0.66, reflectivity: 0.18 }); m.envMapIntensity = 0.22;
    m.onBeforeCompile = sh => {
      const N = Math.max(1, glow.length); sh.uniforms.gemP = { value: glow.length ? glow : [new T.Vector4(0, -9, 0, 0.001)] };
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;\nvarying vec3 vWN;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvW = (modelMatrix * vec4(position, 1.0)).xyz;\nvWN = mat3(modelMatrix) * objectNormal;');
      sh.fragmentShader = 'uniform vec4 gemP[' + N + '];\nvarying vec3 vW;\nvarying vec3 vWN;\n' + sh.fragmentShader
        .replace('vec3 totalEmissiveRadiance = emissive;', 'float gg = 0.0; for (int i = 0; i < ' + N + '; i++) { vec3 d = vW - gemP[i].xyz; gg += exp(-dot(d, d) / (gemP[i].w * gemP[i].w)); }\n  vec3 totalEmissiveRadiance = emissive * 0.6 * min(gg, 1.0);')
        .replace('#include <color_fragment>', '#include <color_fragment>\n  float upK = smoothstep(0.72, 0.95, normalize(vWN).y); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 2.6 + vec3(0.012, 0.008, 0.016), upK);');
    };
    m.customProgramCacheKey = () => 'reefGlow' + glow.length + tone;
    return m;
  };
  // A BOULDER of STONEPETAL's plates: a sphere broken into rounded plates with soft grooves between them, its top flattened to a tread at `flat` (of its height), its foot flat on the ground
  const plateBoulder = (sx, sy, sz, seed, mat, o) => {
    o = o || {}; const rnd = rndOf(seed), NP = o.plates || 9, flat = o.flat === undefined ? 0.55 : o.flat;
    const cells = Array.from({ length: NP }, (_, i) => { const y = 1 - 2 * (i + 0.5) / NP, r = Math.sqrt(1 - y * y), a = i * 2.39996 + 0.7 * (rnd() - 0.5); return V3(r * Math.cos(a), y + 0.2 * (rnd() - 0.5), r * Math.sin(a)).normalize(); });
    const rockAt = n => { let d1 = -2, d2 = -2; for (const c of cells) { const d = n.dot(c); if (d > d1) { d2 = d1; d1 = d; } else if (d > d2) d2 = d; } const gap = d1 - d2; return 1 + 0.09 * smooth(0, 0.16, gap) - 0.05 * (1 - smooth(0, 0.07, gap)); };
    const NW = 72, geo = new T.SphereGeometry(1, NW, 54), p = geo.attributes.position, n = V3();
    for (let i = 0; i < p.count; i++) { n.set(p.getX(i), p.getY(i), p.getZ(i)).normalize(); const k = rockAt(n); let y = n.y * k; if (y > flat) y = flat + (y - flat) * 0.18; if (y < -0.35) y = -0.35 + (y + 0.35) * 0.2; p.setXYZ(i, n.x * k * sx, y * sy, n.z * k * sz); }
    geo.computeVertexNormals(); smoothSeams(geo, NW);
    return new T.Mesh(geo, mat);
  };
  // a crystal, whole, its foot sunk in the rock at P, along dir; its glow on the rock round it
  const gem = (g, P, dir, h, r, seed, glow, reach) => {
    const geo = crystalGeo(h, r, r * 0.9, 0.8, (seed % 7) * 0.4, seed, r * 0.8), o = new T.Object3D();
    o.position.copy(P).addScaledVector(dir.clone().normalize(), r * 0.35); aim(o, dir, V3(0, 0, 1)); o.updateMatrix(); geo.applyMatrix4(o.matrix);
    g.add(gemMesh(geo, PINK)); glow.push(new T.Vector4(P.x, P.y, P.z, (reach || r * 3.2) * 0.75));
  };
  // a crystal flower (its back's kind): short crystals fanned from a smooth dome of the stone
  const flower = (g, P, s, seed, glow, mat) => {
    const dome = new T.Mesh(new T.SphereGeometry(1, 24, 14, 0, TAU, 0, PI / 2), mat); dome.scale.set(s * 0.42, s * 0.3, s * 0.42); dome.position.copy(P); g.add(dome);
    const rn = rndOf(seed), n = 5 + Math.floor(rn() * 2);
    for (let i = 0; i < n; i++) { const a = i / n * TAU + rn() * 0.4, open = 0.75, dir = V3(Math.cos(a) * Math.sin(open), Math.cos(open), Math.sin(a) * Math.sin(open)); gem(g, P.clone().add(V3(Math.cos(a) * s * 0.12, s * 0.12, Math.sin(a) * s * 0.12)), dir, s * (0.42 + 0.18 * rn()), s * 0.1, seed * 13 + i, glow, s * 0.5); }
  };
  // THE CLIMB: boulder steps up to a ledge H high whose face is at z = 0 (the deck behind it, z < 0), running D out toward +z, W wide
  const reefBoulders = (H, D, W, seed) => {
    const g = G(), glow = [], rn = rndOf(seed), N = Math.max(3, Math.round(H / 0.28));
    const mats = [stoneMat(glow, '#1c1722'), stoneMat(glow, '#221c29'), stoneMat(glow, '#18141d')], steps = new Set();
    // the steps: each boulder's tread a step higher, the last flush with the lip
    for (let i = 0; i < N; i++) {
      const t = (i + 0.5) / N, z = D * (1 - t) + 0.05, top = (i + 1) / N * H, sx = W * (0.44 + 0.06 * rn()), sz = Math.max(0.3, D / N * 0.72), flat = 0.5, sy = top / (flat + 0.02 + 0.35);
      const b = plateBoulder(sx, sy, sz, seed * 31 + i, mats[i % 3], { flat, plates: 8 + (i % 3) }); b.position.set((rn() - 0.5) * 0.14, 0.35 * sy, z); b.rotation.y = (rn() - 0.5) * 0.5; steps.add(b); g.add(b);
    }
    // the capstone over the lip: a flat plate of the stone from the last tread onto the deck
    const cap = plateBoulder(W * 0.4, 0.07, 0.3, seed * 7, mats[1], { flat: 0.3, plates: 6 }); cap.position.set(0.02, H - 0.025, -0.06); g.add(cap);
    // the side rocks, leaning on the steps; the pebbles at its foot
    [[-1, 0.6, 0.26, 0.3], [1, 0.32, 0.36, 0.28], [1, 0.8, 0.18, 0.24], [-1, 0.95, 0.14, 0.18]].forEach(([s, t, hh, r], k) => {
      const ht = Math.min(H * 0.95, hh * (H / 0.83) * (0.8 + 0.3 * rn())), b = plateBoulder(r, ht / 0.7, r * 0.9, seed * 53 + k, mats[(k + 1) % 3], { flat: 0.42, plates: 7 });
      b.position.set(s * (W * 0.5 + r * 0.45), 0.35 * ht / 0.7 - 0.02, D * (1 - t) + 0.05); b.rotation.y = rn() * 3; g.add(b);
    });
    for (let k = 0; k < 11; k++) { const a = rn() * TAU, rr = 0.35 + rn() * 0.5, s = 0.05 + rn() * 0.06, b = plateBoulder(s * 1.2, s * 0.9, s, seed * 97 + k, mats[k % 3], { flat: 0.4, plates: 5 }); b.position.set(Math.cos(a) * rr * W * 0.8, s * 0.3, D + 0.15 + Math.sin(a) * rr * 0.5); g.add(b); }
    // the crystals and two flowers, each set where its ray from above meets the rock (so none floats), on the rocks' sides and in the gaps (a hit on a step's flat top moves outward: the treads stay clear)
    g.updateMatrixWorld(true); const rocks = g.children.filter(c => c.isMesh);
    const ray = new T.Raycaster(), nm = new T.Matrix3();
    const stick = (xf, zf, side) => { let x = xf * W; const z = zf * D; for (let k = 0; k < 5; k++, x += side * 0.06) { ray.set(V3(x, H + 3, z), V3(0, -1, 0)); const h = ray.intersectObjects(rocks, false)[0]; if (!h) continue; nm.getNormalMatrix(h.object.matrixWorld); const n = h.face.normal.clone().applyMatrix3(nm).normalize(); if (steps.has(h.object) && n.y > 0.8) continue; return { P: h.point, n }; } return null; };
    [[-0.38, 0.14, -1, 0.36, 0.062], [0.42, 0.2, 1, 0.34, 0.058], [-0.36, 0.64, -1, 0.3, 0.05], [0.4, 0.42, 1, 0.32, 0.05], [0.3, 0.86, 1, 0.18, 0.035], [-0.3, 0.4, -1, 0.18, 0.034], [0.55, 0.9, 1, 0.24, 0.045], [-0.52, 0.86, -1, 0.2, 0.04], [0.14, 0.03, 1, 0.2, 0.04], [-0.12, 0.05, -1, 0.16, 0.034], [0.62, 0.62, 1, 0.2, 0.04]]
      .forEach(([xf, zf, side, h, r], k) => { const hit = stick(xf, zf, side); if (!hit) return; const dir = hit.n.clone().multiplyScalar(0.55).add(V3(side * 0.35, 0.9, 0.1)); gem(g, hit.P, dir, h * (0.9 + 0.2 * rn()), r, seed * 17 + k, glow); });
    for (const [xf, zf, side, s, sd] of [[0.62, 0.32, 1, 0.36, 5], [-0.6, 0.42, -1, 0.3, 9]]) { const hit = stick(xf, zf, side); if (hit) flower(g, hit.P.clone().add(V3(0, -0.02, 0)), s, sd, glow, mats[0]); }
    // a pink light in the heap, as the draft had it, so the crystals' light falls on the stone near them
    const pk = new T.PointLight(0xff5aa8, 1.6, 3.2 + H); pk.position.set(0.2, H * 0.6 + 0.3, D * 0.55); g.add(pk);
    return g;
  };
  // the ledge heights (tenths of a tile), as model heights: 34 game px a tile of height, a unit of height UH px
  const SIDES = { s: 0, e: PI / 2, n: PI, w: -PI / 2 };   // the turn that sends the model's +z (out from the face) to the game's +y, +x, -y, -x
  const HEIGHTS = [18, 34, 50];
  PROPS.reef = {
    variants: HEIGHTS.flatMap(h => ['s', 'w', 'e', 'n'].map(s => s + h)), canvas: [780, 760], exposure: 1.0,
    build(name) {
      const side = name[0], H = px(Number(name.slice(1)) / 10 * 34), D = Math.max(2.0, 1.2 + H * 1.1), W = H < 1 ? 1.4 : 1.5, turn = SIDES[side];
      const climb = reefBoulders(H, D, W, 11), g = G(); climb.rotation.y = turn; g.add(climb);
      const toe = [Math.sin(turn) * D, 0, Math.cos(turn) * D];
      return { g, marks: { lip: [0, H, 0], toe } };
    },
  };
}
