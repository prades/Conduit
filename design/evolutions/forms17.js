// ── THE ELECTRIC BRAWLER, designed to move (Nos. 372–376): the hollow black pyramid and the diamond inside it, built from four triangular panels so it can
// breathe, open, orbit and ripple. Needs forms14.js (_hoodBlack, _diamond) and forms15.js (_quillShard). The sheet shows four moments of each. ──
function _panelSet(R, H, hv) {   // four triangular faces of a square pyramid, each a group hinged at the middle of its base edge
  const out = [], apex = new T.Vector3(0, H, 0);
  for (let k = 0; k < 4; k++) { const a0 = PI / 4 + k * PI / 2, a1 = a0 + PI / 2, c0 = new T.Vector3(Math.sin(a0) * R, 0, Math.cos(a0) * R), c1 = new T.Vector3(Math.sin(a1) * R, 0, Math.cos(a1) * R), m = c0.clone().lerp(c1, 0.5);
    const e = c1.clone().sub(c0).normalize(), nOut = new T.Vector3(m.x, 0, m.z).normalize(), apexRel = apex.clone().sub(m), s = Math.sign(e.clone().cross(apexRel).dot(nOut)) || 1;
    const geo = new T.BufferGeometry(); const A = c0.clone().sub(m), B = c1.clone().sub(m), C = apexRel; geo.setAttribute('position', new T.Float32BufferAttribute([A.x, A.y, A.z, B.x, B.y, B.z, C.x, C.y, C.z], 3)); geo.computeVertexNormals();
    const g = G(); g.position.copy(m).add(new T.Vector3(0, hv, 0)); g.add(new T.Mesh(geo, _hoodBlack)); g.add(new T.LineSegments(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color: 0x5a5470, transparent: true, opacity: 0.8 })));
    // the face's outward normal, and a point-on-face function for shards
    const nrm = apexRel.clone().cross(B.clone().sub(A)).normalize(); if (nrm.dot(nOut) < 0) nrm.negate();
    out.push({ g, e, s, nOut, m, A, B, C, nrm, k, pivot: m.clone() }); }
  return out;
}
function _hinge(P, th) { P.g.quaternion.setFromAxisAngle(P.e, P.s * th); }
function _animBase(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1); b.rotation.y = o.yaw == null ? 0.6 : o.yaw; const hv = o.hover, R = o.R, H = o.H;
  const pv = G(); b.add(pv); const P = _panelSet(R, H, hv); P.forEach(p => pv.add(p.g));
  const dm = _diamond('octa', o.dR), d = dm.main, dc = dm.core, dgl = glowSprite(o.dR * 8); const dY = hv + H * 0.34; [d, dc, dgl].forEach(x => { x.position.set(0, dY, 0); b.add(x); });
  const L = new T.PointLight(0xffffff, 1.2, 3.2, 2); L.color.set(EL.color); L.position.set(0, dY, 0.2); b.add(L); LIGHTS.push(L);
  return { g, b, pv, P, d, dc, dgl, L, dY, hv, R, H };
}
function _spin(B, ph, ac, o) { B.d.rotation.y = ph * 0.7; B.dc.rotation.y = -ph * 0.7; B.d.position.y = B.dY + 0.03 * Math.sin(ph * 2); B.dc.position.y = B.d.position.y; B.dgl.position.y = B.d.position.y; B.dgl.scale.setScalar(o.dR * (8 + 2 * Math.sin(ph * 2) + 4 * ac)); B.L.intensity = 1.2 + 0.4 * Math.sin(ph * 2) + 0.8 * ac; }

fx(372, "Breathing hood: the front flap slowly lifts and settles, the whole hood rising a little as it inhales.", () => {
  const o = { hover: 0.34, R: 0.78, H: 1.0, dR: 0.21 }, B = _animBase(o); B.P[0].g.visible = true;   // panel 0 faces +x+z? the front flap is the one nearest +z
  const front = B.P.reduce((a, p) => (p.nOut.z > a.nOut.z ? p : a), B.P[0]); const others = B.P.filter(p => p !== front); B.P.forEach(p => { if (p !== front && p.nOut.z > 0.3) p.g.visible = false; });   // the other front-ish face is left off: the hood is open at the front
  return { g: B.g, core: B.dY, update(t, act) { const ph = 1.6 * t, ac = act || 0, br = 0.5 + 0.5 * Math.sin(ph); _hinge(front, 0.45 + 0.85 * br + 0.3 * ac); B.pv.position.y = 0.05 * br; B.pv.rotation.x = 0.05 * Math.sin(ph); _spin(B, ph, ac, o); } };
});
fx(373, "Gyroscope: the four panels float free and orbit the diamond, drifting out and back in.", () => {
  const o = { hover: 0.3, R: 0.7, H: 1.0, dR: 0.21 }, B = _animBase(o);
  return { g: B.g, core: B.dY, update(t, act) { const ph = 1.6 * t, ac = act || 0, br = 0.5 + 0.5 * Math.sin(ph * 2);
    B.P.forEach((p, i) => { const ang = ph * 0.5 + i * PI / 2 - p.k * PI / 2, r = (0.12 + 0.16 * br + 0.18 * ac), c = Math.cos(ph * 0.5), s2 = Math.sin(ph * 0.5);   // each panel keeps its face but circles the centre
      p.g.position.set(p.pivot.x * (1 + r) , B.hv + 0.04 * Math.sin(ph + i), p.pivot.z * (1 + r)); const rot = ph * 0.5; p.g.position.applyAxisAngle(new T.Vector3(0, 1, 0), 0).setY(B.hv + 0.06 * Math.sin(ph * 2 + i * 1.6)); const q = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), rot); p.g.position.applyQuaternion(q); p.g.quaternion.copy(q).multiply(new T.Quaternion().setFromAxisAngle(p.e, p.s * (0.1 + 0.2 * br + 0.3 * ac))); });
    _spin(B, ph, ac, o); } };
});
fx(374, "Rolling ripple: fat black shards on the coat rise and settle in a smooth wave that travels round the hood.", () => {
  const o = { hover: 0.34, R: 0.8, H: 1.0, dR: 0.2 }, B = _animBase(o), UP2 = new T.Vector3(0, 1, 0), shards = [], mat = _hoodBlack;
  const front = B.P.reduce((a, p) => (p.nOut.z > a.nOut.z ? p : a), B.P[0]); B.P.forEach(p => { if (p !== front && p.nOut.z > 0.3) p.g.visible = false; }); _hinge(front, 0.3);
  B.P.forEach((p, pi) => { if (!p.g.visible) return; for (let i = 0; i < 6; i++) { const u = 0.14 + 0.5 * _hz(i, pi, 1), t2 = (_hz(i, pi, 2) * 2 - 1) * 0.72 * (1 - u), pos = p.A.clone().lerp(p.C, u).addScaledVector(p.B.clone().sub(p.A), 0.5 + t2 * 0.5).addScaledVector(p.nrm, -0.02);
      const len = 0.2 + 0.22 * _hz(i, pi, 3), sh = _quillShard(len, len * 0.5, 5, mat, i + pi * 9), dir = p.nrm.clone().multiplyScalar(0.8).add(new T.Vector3(0, 0.7, 0)).normalize(); sh.position.copy(pos); sh.quaternion.setFromUnitVectors(UP2, dir); p.g.add(sh); shards.push({ sh, q: sh.quaternion.clone(), az: Math.atan2(p.nOut.x, p.nOut.z) + (t2 * 0.6), u }); } });
  return { g: B.g, core: B.dY, update(t, act) { const ph = 1.6 * t, ac = act || 0; B.pv.position.y = 0.025 * Math.sin(ph); for (const S of shards) { const w = 0.5 + 0.5 * Math.sin(ph * 2 - S.az * 1.0 - S.u * 3); S.sh.scale.set(1 + 0.12 * w, 1 + 0.4 * w + 0.4 * ac, 1 + 0.12 * w); S.sh.quaternion.copy(S.q).multiply(new T.Quaternion().setFromEuler(new T.Euler(0.14 * (w - 0.5), 0, 0.14 * (w - 0.5)))); } _spin(B, ph, ac, o); } };
});
const _tierMat = new T.MeshStandardMaterial({ color: 0x000001, metalness: 0.1, roughness: 0.6, flatShading: true }); _tierMat.envMapIntensity = 0.15;
fx(375, "Drifting tiers: the pyramid sliced into four tiers that hover apart and slide in a slow wave, the diamond showing in the gaps.", () => {
  const o = { hover: 0.3, R: 0.78, H: 1.0, dR: 0.2 }, g = G(), b = G(); g.add(b); b.rotation.y = 0.6; const tiers = [], hv = o.hover, n = 4;
  for (let i = 0; i < n; i++) { const r0 = o.R * (1 - i / n), r1 = o.R * (1 - (i + 1) / n), h = o.H / n * 0.82, geo = new T.CylinderGeometry(Math.max(0.03, r1), r0, h, 4, 1, false), t = new T.Mesh(geo, _tierMat); t.rotation.y = PI / 4; const grp = G(); grp.add(t); grp.add(new T.LineSegments(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color: 0x5a5470, transparent: true, opacity: 0.8 })).rotateY(PI / 4)); grp.userData.i = i; b.add(grp); tiers.push(grp); }
  const dm = _diamond('octa', o.dR), dY = hv + o.H * 0.28; [dm.main, dm.core].forEach(x => { x.position.set(0, dY, 0); b.add(x); }); const dgl = glowSprite(o.dR * 8); dgl.position.set(0, dY, 0); b.add(dgl); const L = new T.PointLight(0xffffff, 1.2, 3.2, 2); L.color.set(EL.color); L.position.set(0, dY, 0.3); b.add(L); LIGHTS.push(L);
  return { g, core: dY, update(t, act) { const ph = 1.6 * t, ac = act || 0; tiers.forEach((tr, i) => { const w = Math.sin(ph - i * 0.9); tr.position.set(0.05 * Math.sin(ph * 2 - i), hv + (i + 0.5) * o.H / n + 0.06 * w + i * 0.05 + 0.1 * ac * i, 0.05 * Math.cos(ph - i)); tr.rotation.y = (i % 2 ? 1 : -1) * (0.15 * Math.sin(ph * 0.5 + i) + 0.2 * ac); });
    dm.main.rotation.y = ph * 0.7; dm.core.rotation.y = -ph * 0.7; dgl.scale.setScalar(o.dR * (8 + 2 * Math.sin(ph * 2) + 4 * ac)); L.intensity = 1.2 + 0.4 * Math.sin(ph * 2) + 0.8 * ac; } };
});
fx(376, "Petals: all four panels hinge open and shut in turn, rolling round the diamond like a slow breath.", () => {
  const o = { hover: 0.34, R: 0.76, H: 1.0, dR: 0.21 }, B = _animBase(o);
  return { g: B.g, core: B.dY, update(t, act) { const ph = 1.6 * t, ac = act || 0; B.P.forEach((p, i) => { const w = 0.5 + 0.5 * Math.sin(ph - i * PI / 2); _hinge(p, 0.05 + 0.5 * w + 0.35 * ac); }); B.pv.position.y = 0.03 * Math.sin(ph); B.dgl.scale.setScalar(o.dR * (8 + 4 * Math.sin(ph) + 4 * ac)); _spin(B, ph, ac, o); } };
});

// ── The SAME hood pyramid (No. 312's hood, the diamond inside), with new spikes and new movement (Nos. 377–381) ──
const _hm = Object.assign({}, _ha, { yaw: 0.35, jolt: true });
fx(377, "Fat horns, a smooth ripple travelling round the hood.", () => _hoodPyramid(Object.assign({}, _hm, { motion: 'ripple', attached: { n: 8, uMin: 0.1, uMax: 0.62, len: [0.22, 0.5], skew: 0.8, seed: 11, twin: 0.2, ridge: 0.3, fat: 2.5 } })));
fx(378, "Long thin needles, swaying together like grass in wind.", () => _hoodPyramid(Object.assign({}, _hm, { motion: 'sway', attached: { n: 26, uMin: 0.05, uMax: 0.8, len: [0.28, 0.62], skew: 1, seed: 5, twin: 0.1, ridge: 0.25, fat: 1.2, shape: 'needle' } })));
fx(379, "Flat black blades that fan open and closed.", () => _hoodPyramid(Object.assign({}, _hm, { motion: 'fan', attached: { n: 10, uMin: 0.1, uMax: 0.6, len: [0.26, 0.5], skew: 1, seed: 7, twin: 0.1, ridge: 0.45, fat: 1.6, shape: 'blade' } })));
fx(380, "Black hex crystals growing and shrinking as if breathing.", () => _hoodPyramid(Object.assign({}, _hm, { motion: 'breathe', attached: { n: 13, uMin: 0.08, uMax: 0.7, len: [0.15, 0.42], skew: 1.2, seed: 9, twin: 0.5, ridge: 0.3, fat: 2.2, shape: 'hex' } })));
fx(381, "Big and small mixed, a pulse running from the base up to the tips.", () => _hoodPyramid(Object.assign({}, _hm, { motion: 'sweep', attached: { n: 17, uMin: 0.04, uMax: 0.75, len: [0.08, 0.58], skew: 1.8, seed: 13, twin: 0.3, ridge: 0.25, fat: 2 } })));

// ── 380, cuter (Nos. 382–386): chubbier, rounder, with a face and feet ──
const _c380 = Object.assign({}, _hm, { motion: 'breathe', yaw: 0.35 });
const _cA = (extra) => Object.assign({ n: 9, uMin: 0.08, uMax: 0.68, len: [0.1, 0.26], skew: 1, seed: 9, twin: 0.7, ridge: 0.3, fat: 3.2, shape: 'hex' }, extra || {});
fx(382, "Chubby: a shorter, wider hood, short fat crystal nubs, a squash-and-stretch bounce.", () => _hoodPyramid(Object.assign({}, _c380, { H: 0.72, R: 0.9, dR: 0.25, trim: 0.026, bounce: true, attached: _cA() })));
fx(383, "Peeking eyes: two big glowing eyes flanking the diamond that blink.", () => _hoodPyramid(Object.assign({}, _c380, { H: 0.78, R: 0.9, dR: 0.17, dY: 0.4, dZ: -0.02, trim: 0.026, bounce: true, eyes: true, eyeR: 0.09, eyeX: 0.26, eyeY: 0.0, eyeZ: 0.2, attached: _cA() })));
fx(384, "Tiny feet: four chunky feet right under the hem, shuffling as it bounces.", () => _hoodPyramid(Object.assign({}, _c380, { H: 0.72, R: 0.9, hover: 0.2, dR: 0.25, trim: 0.026, bounce: true, feet: true, attached: _cA() })));
fx(385, "Little tufts: the crystals in small bunches, and a round bobble on the apex.", () => _hoodPyramid(Object.assign({}, _c380, { H: 0.72, R: 0.9, dR: 0.25, trim: 0.026, bounce: true, bobble: true, attached: _cA({ n: 6, twin: 0.95, len: [0.12, 0.3], fat: 3 }) })));
fx(386, "All of it: chubby, big eyes, feet, tufts, bobble and bounce.", () => _hoodPyramid(Object.assign({}, _c380, { H: 0.74, R: 0.92, hover: 0.2, dR: 0.17, dY: 0.4, dZ: -0.02, trim: 0.026, bounce: true, eyes: true, eyeR: 0.09, eyeX: 0.26, eyeY: 0.0, eyeZ: 0.2, feet: true, bobble: true, attached: _cA({ n: 6, twin: 0.95, len: [0.12, 0.3], fat: 3 }) })));

// ── 383 (and 386) with three gems in a triangle hovering in front of the face crystal in place of the two eyes (Nos. 387–390) ──
const _b383 = { H: 0.78, R: 0.9, dR: 0.17, dY: 0.4, dZ: -0.02, trim: 0.026, bounce: true, attached: _cA() };
const _b386 = { H: 0.74, R: 0.92, hover: 0.2, dR: 0.17, dY: 0.4, dZ: -0.02, trim: 0.026, bounce: true, feet: true, bobble: true, attached: _cA({ n: 6, twin: 0.95, len: [0.12, 0.3], fat: 3 }) };
fx(387, "383 with three hovering gems, two above one.", () => _hoodPyramid(Object.assign({}, _c380, _b383, { triGems: 'down' })));
fx(388, "383 with three hovering gems, one above two.", () => _hoodPyramid(Object.assign({}, _c380, _b383, { triGems: 'up' })));
fx(389, "386 (feet, tufts, bobble) with three hovering gems, two above one.", () => _hoodPyramid(Object.assign({}, _c380, _b386, { triGems: 'down' })));
fx(390, "386 (feet, tufts, bobble) with three hovering gems, one above two.", () => _hoodPyramid(Object.assign({}, _c380, _b386, { triGems: 'up' })));

// The game sprite of No. 388: the hood facing forward, scaled to fill its cell.
fx(391, "388, the game sprite.", () => _hoodPyramid(Object.assign({}, _c380, _b383, { triGems: 'up', yaw: 0, S: 1.45 })));
