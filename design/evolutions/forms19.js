// ── THE SMOOTH CORE SLUG · Nos. 402–409: ONE continuous satin-blue body (no ribs or segments, so it does not read as a grub), a tapered tail, a black crystal spike leaning a little
// forward from its head, two eye-stalks with a crystal rim round a black centre. Needs forms13.js (_taperTube), forms15.js (_gemMatGloss), forms16.js (_armB, _trimLine). ──
function _smoothSlug(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1.15);
  const N = 26, SIDES = 16, L = o.len, mat = new T.MeshStandardMaterial({ color: o.blue || 0x031a8a, emissive: o.glowBlue || 0x010720, emissiveIntensity: 1, roughness: 0.5, metalness: 0.05, flatShading: false }); mat.envMapIntensity = 0.18;
  const tube = _taperTube(mat, N, SIDES); const body = tube.mesh; body.scale.y = o.flat; b.add(body);
  const pts = Array.from({ length: N }, () => new T.Vector3()), rad = new Array(N);
  // belly: a slightly lighter foot strip under the body
  const foot = new T.Mesh(new T.CylinderGeometry(1, 1, 0.03, 20), new T.MeshStandardMaterial({ color: o.foot || 0x0a3fd0, emissive: 0x020c34, roughness: 0.7, metalness: 0 })); foot.scale.set(o.rad * 1.05, 1, L * 0.5); b.add(foot);
  const profile = u => { const head = Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.05 + 0.02)), 0.5); return o.rad * (u > 0.84 ? (0.78 + 0.22 * (1 - (u - 0.84) / 0.16)) * (o.headK || 1) * 0.95 : (0.12 + 0.88 * Math.pow(Math.sin(Math.PI * (0.04 + 0.86 * u / 0.84 * 0.84)), 0.55))); };
  // head group at the front: the spike and the eye-stalks
  const hg = G(); b.add(hg), horn = G(); hg.add(horn);
  const hc = hexCrystal(o.hornR, o.horn * 0.8, o.horn * 0.4, _gemMatGloss); hc.position.y = o.horn * 0.4 + 0.03; horn.add(hc); horn.rotation.x = o.hornTilt;
  const stalks = []; for (const s of [-1, 1]) { const sp = G(), shaft = limb(o.stalkR, mat); sp.add(shaft); const eye = G(), ec = hexCrystal(o.eyeR * 1.15, o.eyeR * 1.2, o.eyeR, M.crystal); ec.rotation.x = PI / 2; eye.add(ec); const pu = new T.Mesh(new T.SphereGeometry(o.eyeR * 0.82, 12, 10), new T.MeshBasicMaterial({ color: 0x000102 })); pu.position.z = o.eyeR * 0.85; pu.scale.set(0.95, 1.05, 0.8); eye.add(pu); sp.add(eye); hg.add(sp); stalks.push({ sp, shaft, eye, s }); }
  // an optional armour saddle: a smooth black plate riding on the back, edged in teal
  let saddle = null; if (o.saddle) { saddle = G(); const pl = new T.Mesh(new T.SphereGeometry(1, 18, 10, 0, TAU, 0, PI / 2), _armB); pl.scale.set(o.rad * 1.25, o.rad * 0.7, L * 0.2); saddle.add(pl); const rim = new T.Mesh(new T.TorusGeometry(1, 0.012, 4, 20), M.glow); rim.rotation.x = PI / 2; rim.scale.set(o.rad * 1.25, L * 0.2, 1); saddle.add(rim); b.add(saddle); }
  const L2 = _lamp(b, 0.7, 0.6);
  return { g, core: 0.4, update(t, act) { const ph = 1.6 * t, ac = act || 0, lunge = 0.25 * ac;
    for (let i = 0; i < N; i++) { const u = i / (N - 1), w = Math.sin(ph * 2 - u * 6.0) * (0.35 + 0.65 * (1 - u));   // the crawl: a wave running tail-to-head, so the head stays calm
      const r = profile(u); rad[i] = Math.max(0.012, r * (1 + 0.07 * w)); pts[i].set(0, Math.max(0.05, r * o.flat * 0.5 + 0.03 + o.arch * Math.sin(Math.PI * u) + 0.03 * w), -L / 2 + u * L + lunge * u); }
    tube.set(pts, rad);
    const head = pts[N - 1], h2 = pts[N - 3];
    hg.position.set(0, head.y + rad[N - 1] * o.flat * 0.4, head.z - 0.06);
    horn.rotation.x = o.hornTilt + 0.04 * Math.sin(ph * 2) + 0.2 * ac; horn.position.set(0, 0, 0);
    stalks.forEach(K => { const base = new T.Vector3(K.s * 0.05, rad[N - 1] * 0.25, rad[N - 1] * 0.55), sway = 0.1 * Math.sin(ph * 2 + K.s * 1.4) + 0.06 * ac, tip = new T.Vector3(K.s * o.stalkSep, rad[N - 1] * 0.25 + o.stalkLen * (1 + 0.05 * Math.sin(ph * 2 + K.s * 2)), rad[N - 1] * 0.55 + 0.16 + sway + 0.08 * ac); setLink(K.shaft, base, tip); K.eye.position.copy(tip); K.eye.rotation.set(0.15 * Math.sin(ph * 2 + K.s), K.s * -0.12, 0); });
    foot.position.z = 0.01 + lunge * 0.4; if (saddle) { const k = Math.floor(N * 0.46); saddle.position.set(0, pts[k].y + rad[k] * o.flat * 0.5, pts[k].z); saddle.rotation.x = 0.04 * Math.sin(ph * 2); }
    L2.intensity = 0.5 + 0.4 * Math.sin(ph * 2) + 0.7 * ac; } };
}
const _smB = { len: 1.6, rad: 0.34, flat: 0.8, arch: 0.04, horn: 0.95, hornR: 0.12, hornTilt: 0.34, stalkLen: 0.36, stalkSep: 0.34, stalkR: 0.026, eyeR: 0.09 };
fx(402, "Smooth slug: one satin cobalt-blue body, black spike, black-centred eyes.", () => _smoothSlug(Object.assign({}, _smB)));
fx(403, "Smooth slug, chubby: short and round with a big spike and big eyes.", () => _smoothSlug(Object.assign({}, _smB, { len: 1.1, rad: 0.42, flat: 0.95, headK: 1.15, horn: 1.0, hornR: 0.14, eyeR: 0.105, stalkSep: 0.38, stalkLen: 0.32 })));
fx(404, "Smooth slug with an armour saddle: a smooth black plate riding on its back.", () => _smoothSlug(Object.assign({}, _smB, { saddle: true })));
fx(405, "Smooth slug, long and sleek: a stretched, low, streamlined body.", () => _smoothSlug(Object.assign({}, _smB, { len: 2.1, rad: 0.27, flat: 0.72, horn: 1.0 })));
fx(406, "Smooth slug, tall stalks and a short thick black spike.", () => _smoothSlug(Object.assign({}, _smB, { horn: 0.7, hornR: 0.17, stalkLen: 0.6, stalkSep: 0.4, eyeR: 0.095 })));
fx(407, "Smooth slug, ice-blue: a lighter, brighter blue, a crisper look.", () => _smoothSlug(Object.assign({}, _smB, { blue: 0x0a45d8, glowBlue: 0x031044, foot: 0x2a6bff })));
fx(408, "Smooth slug, midnight: a very deep navy blue, almost black.", () => _smoothSlug(Object.assign({}, _smB, { blue: 0x010a40, glowBlue: 0x000310, foot: 0x0a2a9a })));
fx(409, "Smooth slug, high-arched back: a hunched crouch.", () => _smoothSlug(Object.assign({}, _smB, { arch: 0.2, len: 1.5, rad: 0.36, saddle: true })));
