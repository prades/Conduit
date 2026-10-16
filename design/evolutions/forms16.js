// ── THE CORE BRAWLER, redesigned (Nos. 362–371): shields and armour plating, close-range bruisers. Pitch-black faceted plate with teal trim, hex crystal. ──
const _armB = new T.MeshStandardMaterial({ color: 0x000001, metalness: 0.12, roughness: 0.6, flatShading: true, side: T.DoubleSide }); _armB.envMapIntensity = 0.2;
const _trimLine = (w, h, d) => cbox(w, h, d, 0.002, M.glow);
function _coreCrystal(r, y, z) { const g = G(); const c = hexCrystal(r, r * 1.6, r * 1.6, M.crystal); g.add(c); const gs = glowSprite(r * 7); g.add(gs); g.position.set(0, y, z || 0); return g; }
function _hideFeet(b, sx, sz, y) { const fs = []; for (let i = 0; i < 4; i++) { const f = cbox(0.14, 0.1, 0.18, 0.03, _armB); f.position.set((i % 2 ? -1 : 1) * sx, y, (i < 2 ? 1 : -1) * sz); b.add(f); fs.push(f); } return fs; }
function _lamp(b, y, z) { const L = new T.PointLight(0xffffff, 0.5, 3.5, 2); L.color.set(EL.color); L.position.set(0, y, z); b.add(L); LIGHTS.push(L); return L; }

fx(362, "Armadillo: a curled ball of black plates, its front open on a glowing crystal.", () => {
  const g = G(), b = G(); g.add(b); if (1) b.scale.setScalar(1.15); const R = 0.55, Y = R + 0.08, body = G(); body.position.y = Y; b.add(body);
  body.add(new T.Mesh(new T.SphereGeometry(R * 0.94, 16, 10), new T.MeshBasicMaterial({ color: 0x000102 })));
  for (let ring = 0; ring < 7; ring++) { const polar = 0.38 + ring * 0.4, n = Math.max(5, Math.round(Math.sin(polar) * 12)); for (let i = 0; i < n; i++) { const az = i * TAU / n + (ring % 2) * 0.25; if (Math.abs(((az + PI) % TAU) - PI) < 0.0 && false) continue;
    const dir = new T.Vector3(Math.sin(polar) * Math.sin(az), Math.cos(polar), Math.sin(polar) * Math.cos(az)); if (dir.z > 0.55 && dir.y < 0.6 && dir.y > -0.5) continue;   // the open front
    scaleOn(body, dir.clone().multiplyScalar(R), 0.3, 0.24, 0.35, _armB); } }
  const c = _coreCrystal(0.12, 0, R * 0.78); body.add(c); const L = _lamp(b, Y, 0.9); const feet = _hideFeet(b, 0.26, 0.26, 0.05);
  return { g, core: Y + 0.05, update(t, act) { const ph = 1.6 * t, ac = act || 0; body.position.y = Y + 0.012 * Math.sin(ph * 2); body.rotation.x = 0.04 * Math.sin(ph) - 0.15 * ac; body.rotation.z = 0.03 * Math.sin(ph * 2); L.intensity = 0.5 + 0.6 * ac; feet.forEach((f, i) => f.position.z = (i < 2 ? 1 : -1) * 0.26 + 0.04 * Math.sin(ph + (i % 2 ? PI : 0))); } };
});
fx(363, "Shield crab: a low hex-plated body, two huge kite-shield claws.", () => {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(1.1); const Y = 0.32;
  const body = hexPlate(0.55, 0.2, _armB); body.position.y = Y; b.add(body); const top = hexPlate(0.38, 0.14, _armB); top.position.y = Y + 0.15; b.add(top); const tm = new T.Mesh(new T.TorusGeometry(0.56, 0.014, 4, 6), M.glow); tm.rotation.x = PI / 2; tm.position.y = Y + 0.1; b.add(tm);
  const c = _coreCrystal(0.1, Y + 0.34); b.add(c); const claws = [];
  for (const s of [-1, 1]) { const pv = G(); pv.position.set(s * 0.52, Y + 0.05, 0.28); b.add(pv); const arm = cbox(0.14, 0.14, 0.4, 0.03, _armB); arm.position.set(0, 0, 0.18); pv.add(arm); const sh = kitePlate(0.62, 0.95, 0.07, _armB); sh.position.set(0, 0.12, 0.46); sh.rotation.set(0.1, s * -0.35, 0); pv.add(sh); claws.push({ pv, s }); }
  for (let i = 0; i < 3; i++) { const p = hexShield(0.18, 0.05, _armB); p.rotation.x = -PI / 2; p.position.set((i - 1) * 0.3, Y + 0.12, -0.34); b.add(p); }
  const L = _lamp(b, Y + 0.4, 0.6); const feet = _hideFeet(b, 0.3, 0.3, 0.05);
  return { g, core: Y + 0.34, update(t, act) { const ph = 1.6 * t, ac = act || 0; b.position.y = 0.01 * Math.sin(ph * 2); claws.forEach(C => { C.pv.rotation.y = C.s * (0.15 + 0.1 * Math.sin(ph + C.s) + 0.5 * ac) * -1; C.pv.position.z = 0.28 + 0.15 * ac; }); L.intensity = 0.5 + 0.6 * ac; feet.forEach((f, i) => f.position.z = (i < 2 ? 1 : -1) * 0.3 + 0.04 * Math.sin(ph + (i % 2 ? PI : 0))); } };
});
fx(364, "Gauntlet: a floating black armoured fist, a crystal on its knuckles.", () => {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(1.2); const Y = 0.95, f = G(); f.position.y = Y; f.rotation.x = 0.35; b.add(f);
  const palm = cbox(0.56, 0.4, 0.5, 0.07, _armB); f.add(palm); const fingers = [];
  for (let i = 0; i < 4; i++) { const fg = G(); fg.position.set(-0.21 + i * 0.14, 0.04, 0.27); const k1 = cbox(0.12, 0.13, 0.22, 0.03, _armB); k1.position.set(0, 0, 0.1); fg.add(k1); const k2 = cbox(0.115, 0.12, 0.2, 0.03, _armB); k2.position.set(0, -0.09, 0.22); k2.rotation.x = 0.7; fg.add(k2); f.add(fg); fingers.push(fg); }
  const th = cbox(0.14, 0.14, 0.3, 0.03, _armB); th.position.set(-0.34, -0.02, 0.1); th.rotation.y = 0.5; f.add(th);
  for (let i = 0; i < 4; i++) { const pl = hexShield(0.1, 0.03, _armB); pl.position.set(-0.21 + i * 0.14, 0.22, 0.08); pl.rotation.x = -PI / 2; f.add(pl); const ln = new T.Mesh(new T.TorusGeometry(0.1, 0.007, 4, 6), M.glow); ln.position.copy(pl.position); ln.position.y += 0.02; ln.rotation.x = PI / 2; f.add(ln); }
  const cf = _coreCrystal(0.1, 0.38, 0.0); f.add(cf); for (let i = 0; i < 3; i++) { const cuff = hexRing(0.34 - i * 0.03, 0.03, _armB); cuff.rotation.set(PI / 2, 0, PI / 6); cuff.position.set(0, 0, -0.34 - i * 0.12); f.add(cuff); }
  const L = _lamp(b, Y + 0.4, 0.5);
  return { g, core: Y + 0.3, update(t, act) { const ph = 1.6 * t, ac = act || 0; f.position.y = Y + 0.04 * Math.sin(ph); f.position.z = 0.25 * ac; f.rotation.x = 0.35 - 0.5 * ac; fingers.forEach((fg, i) => fg.rotation.x = 0.1 * Math.sin(ph + i * 0.5) + 0.9 * ac); L.intensity = 0.5 + 0.6 * ac; } };
});
fx(365, "Beetle: a plated black carapace and a crystal-tipped horn.", () => {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(1.1); const Y = 0.32;
  const sh = new T.Mesh(new T.SphereGeometry(1, 14, 8, 0, TAU, 0, PI / 2), _armB); sh.scale.set(0.5, 0.42, 0.72); sh.position.y = Y; b.add(sh); for (const s of [-1, 1]) { const seam = new T.Mesh(new T.TorusGeometry(1, 0.012, 4, 20, PI), M.glow); seam.scale.set(0.5, 0.42, 0.72); seam.rotation.set(0, s > 0 ? 0 : 0, 0); }
  const seam = _trimLine(0.014, 0.012, 1.3); seam.position.set(0, Y + 0.43, -0.02); b.add(seam); for (let i = 0; i < 3; i++) { const pl = hexShield(0.2 - i * 0.03, 0.04, _armB); pl.rotation.x = -PI / 2 + 0.25; pl.position.set(0, Y + 0.38 - i * 0.02, -0.2 + i * 0.28); b.add(pl); }
  const head = G(); head.position.set(0, Y + 0.02, 0.62); b.add(head); const hd = cbox(0.34, 0.24, 0.3, 0.06, _armB); head.add(hd); const horn = new T.Mesh(new T.ConeGeometry(0.07, 0.62, 5), _armB); horn.position.set(0, 0.2, 0.18); horn.rotation.x = 1.15; head.add(horn); const cr = hexCrystal(0.05, 0.12, 0.2, M.crystal); cr.position.set(0, 0.42, 0.42); cr.rotation.x = 1.15; head.add(cr);
  for (const s of [-1, 1]) { const mand = new T.Mesh(new T.ConeGeometry(0.05, 0.3, 4), _armB); mand.position.set(s * 0.12, -0.06, 0.26); mand.rotation.set(1.3, 0, s * -0.4); head.add(mand); }
  const c = _coreCrystal(0.08, Y + 0.5, -0.4); b.add(c); const L = _lamp(b, Y + 0.5, 0.7);
  const legs = []; for (let i = 0; i < 6; i++) { const s = i % 2 ? -1 : 1, z = -0.3 + Math.floor(i / 2) * 0.35, l = cbox(0.1, 0.22, 0.12, 0.03, _armB); l.position.set(s * 0.46, 0.12, z); b.add(l); legs.push(l); }
  return { g, core: Y + 0.45, update(t, act) { const ph = 1.6 * t, ac = act || 0; head.rotation.x = 0.04 * Math.sin(ph) + 0.3 * ac; head.position.z = 0.62 + 0.12 * ac; L.intensity = 0.5 + 0.6 * ac; legs.forEach((l, i) => l.position.z += 0.0 * i); legs.forEach((l, i) => l.rotation.x = 0.25 * Math.sin(ph + i * 1.1)); } };
});
fx(366, "Limpet: a low ridged black cone shell, plates fanned round its skirt.", () => {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(1.25); const Y = 0.05;
  const cone = new T.Mesh(new T.ConeGeometry(0.78, 0.62, 9, 1, true), _armB); cone.rotation.y = PI / 9; cone.position.y = Y + 0.31; b.add(cone); const inner = new T.Mesh(new T.ConeGeometry(0.76, 0.6, 9, 1, true), new T.MeshBasicMaterial({ color: 0x000102, side: T.BackSide })); inner.position.y = Y + 0.31; b.add(inner);
  for (let i = 0; i < 4; i++) { const r = 0.7 - i * 0.16, rg = new T.Mesh(new T.TorusGeometry(r, 0.02 + 0.004 * (3 - i), 4, 9), i % 2 ? M.glow : _armB); rg.rotation.x = PI / 2; rg.position.y = Y + 0.06 + i * 0.15; b.add(rg); }
  for (let i = 0; i < 9; i++) { const a = i * TAU / 9, pl = kitePlate(0.28, 0.42, 0.05, _armB), h = G(); h.position.set(Math.sin(a) * 0.86, 0.14, Math.cos(a) * 0.86); h.rotation.y = a; pl.rotation.x = -0.5; pl.position.y = 0.0; h.add(pl); b.add(h); }
  const c = _coreCrystal(0.12, Y + 0.7); b.add(c); const L = _lamp(b, Y + 0.9, 0.3);
  return { g, core: Y + 0.65, update(t, act) { const ph = 1.6 * t, ac = act || 0; b.position.y = 0.01 * Math.sin(ph * 2); cone.rotation.y = PI / 9 + 0.0; c.rotation.y = ph * 0.5; c.position.y = Y + 0.7 + 0.05 * ac; L.intensity = 0.5 + 0.8 * ac; } };
});
fx(367, "Shield wall: three tall black kite shields hovering round a crystal pillar.", () => {
  const g = G(), b = G(), ring = G(); g.add(b); b.scale.setScalar(1.15); const Y = 0.55; ring.position.y = Y; b.add(ring); const shs = [];
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3, h = G(); h.rotation.y = a; const sh = kitePlate(0.78, 1.3, 0.08, _armB); sh.position.set(0, 0.3, 0.52); sh.rotation.x = -0.08; h.add(sh); const e = _trimLine(0.7, 0.016, 0.1); e.position.set(0, 0.95, 0.52); h.add(e); const e2 = _trimLine(0.016, 1.0, 0.1); e2.position.set(0, 0.3, 0.57); h.add(e2); ring.add(h); shs.push(h); }
  const pil = hexCrystal(0.14, 0.7, 0.4, M.crystal); pil.position.y = Y + 0.45; b.add(pil); const gs = glowSprite(1.2); gs.position.y = Y + 0.45; b.add(gs); const base = hexPlate(0.34, 0.06, _armB); base.position.y = Y - 0.12; b.add(base); const L = _lamp(b, Y + 0.5, 0.2);
  return { g, core: Y + 0.45, update(t, act) { const ph = 1.6 * t, ac = act || 0; ring.position.y = Y + 0.03 * Math.sin(ph); ring.rotation.y = ph / 3; shs.forEach((h, i) => { h.children[0].position.z = 0.52 + 0.25 * ac; }); pil.rotation.y = ph * 0.6; L.intensity = 0.5 + 0.8 * ac; } };
});
fx(368, "Anvil golem: a squat black anvil with a crystal in its slot, hex plates on its flanks.", () => {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(1.15); const Y = 0.2;
  const base = cbox(0.7, 0.22, 0.5, 0.05, _armB); base.position.y = Y + 0.11; b.add(base); const waist = cbox(0.34, 0.3, 0.3, 0.05, _armB); waist.position.y = Y + 0.37; b.add(waist); const top = cbox(0.92, 0.24, 0.5, 0.06, _armB); top.position.y = Y + 0.64; b.add(top);
  const horn = new T.Mesh(new T.ConeGeometry(0.13, 0.5, 6), _armB); horn.rotation.z = -PI / 2; horn.position.set(0.7, Y + 0.64, 0); b.add(horn);
  const slot = cbox(0.2, 0.04, 0.34, 0.01, new T.MeshBasicMaterial({ color: 0x000102 })); slot.position.set(0, Y + 0.77, 0); b.add(slot); const c = _coreCrystal(0.1, Y + 0.9); b.add(c);
  for (const s of [-1, 1]) { const pl = hexShield(0.2, 0.05, _armB); pl.position.set(s * 0.37, Y + 0.4, 0.2); pl.rotation.y = s * 0.7; b.add(pl); const ln = new T.Mesh(new T.TorusGeometry(0.18, 0.01, 4, 6), M.glow); ln.position.copy(pl.position); ln.rotation.y = s * 0.7; ln.position.z += 0.03; b.add(ln); }
  const ed = _trimLine(0.9, 0.014, 0.52); ed.position.y = Y + 0.76; b.add(ed); const L = _lamp(b, Y + 0.95, 0.5); const feet = _hideFeet(b, 0.26, 0.16, 0.05);
  return { g, core: Y + 0.8, update(t, act) { const ph = 1.6 * t, ac = act || 0; b.position.y = 0.01 * Math.sin(ph * 2); top.position.y = Y + 0.64 + 0.1 * ac; c.position.y = Y + 0.9 + 0.1 * ac + 0.02 * Math.sin(ph * 3); L.intensity = 0.5 + 0.8 * ac; feet.forEach((f, i) => f.position.z = (i < 2 ? 1 : -1) * 0.16 + 0.04 * Math.sin(ph + (i % 2 ? PI : 0))); } };
});
fx(369, "Ram: a low wedge of black plates with tusks, a crystal on its back.", () => {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(1.1); const Y = 0.28;
  const body = cbox(0.62, 0.34, 0.9, 0.07, _armB); body.position.y = Y; b.add(body);
  for (let i = 0; i < 4; i++) { const w = 0.62 - i * 0.12, pl = cbox(w, 0.05, 0.3, 0.015, _armB); pl.position.set(0, Y + 0.2 - i * 0.07, 0.5 + i * 0.12); pl.rotation.x = 0.4 + i * 0.05; b.add(pl); const tr = _trimLine(w * 0.9, 0.012, 0.02); tr.position.set(0, Y + 0.23 - i * 0.07, 0.6 + i * 0.12); b.add(tr); }
  for (const s of [-1, 1]) { const tk = new T.Mesh(new T.ConeGeometry(0.075, 0.46, 5), _armB); tk.position.set(s * 0.26, Y - 0.02, 0.88); tk.rotation.set(1.2, 0, s * 0.3); b.add(tk); }
  for (let i = 0; i < 3; i++) { const pl = hexShield(0.2, 0.04, _armB); pl.rotation.x = -PI / 2; pl.position.set(0, Y + 0.2, -0.25 + i * 0.26); b.add(pl); }
  const c = _coreCrystal(0.1, Y + 0.5, -0.3); b.add(c); const L = _lamp(b, Y + 0.6, 0.4); const feet = _hideFeet(b, 0.24, 0.3, 0.05);
  return { g, core: Y + 0.45, update(t, act) { const ph = 1.6 * t, ac = act || 0; body.position.z = 0.12 * ac; b.position.y = 0.01 * Math.sin(ph * 2); body.rotation.x = -0.12 * ac; L.intensity = 0.5 + 0.8 * ac; feet.forEach((f, i) => f.position.z = (i < 2 ? 1 : -1) * 0.3 + 0.04 * Math.sin(ph + (i % 2 ? PI : 0))); } };
});
fx(370, "Plate totem: four black hex plates stacked and offset, a crystal in the gaps.", () => {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(1.15); const Y = 0.3, pls = [];
  for (let i = 0; i < 4; i++) { const R = 0.62 - i * 0.1, pl = G(); pl.position.y = Y + i * 0.3; const h = hexPlate(R, 0.12, _armB); pl.add(h); const tm = new T.Mesh(new T.TorusGeometry(R, 0.014, 4, 6), M.glow); tm.rotation.x = PI / 2; tm.position.y = 0.062; pl.add(tm); b.add(pl); pls.push(pl); }
  const c = _coreCrystal(0.12, Y + 0.45); b.add(c); const L = _lamp(b, Y + 0.45, 0.4);
  return { g, core: Y + 0.45, update(t, act) { const ph = 1.6 * t, ac = act || 0; pls.forEach((p, i) => { p.rotation.y = (i % 2 ? -1 : 1) * (ph / 6 * 2 + i * 0.4); p.position.y = Y + i * (0.3 + 0.12 * ac) + 0.02 * Math.sin(ph * 2 + i); }); c.rotation.y = ph * 0.6; L.intensity = 0.5 + 0.8 * ac; } };
});
fx(371, "Empty suit: a floating helm, two huge pauldrons and two gauntlets, a crystal in the chest gap.", () => {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(1.15); const Y = 0.9;
  const helm = cbox(0.38, 0.4, 0.38, 0.08, _armB); helm.position.y = Y + 0.5; b.add(helm); const vz = _trimLine(0.28, 0.04, 0.04); vz.position.set(0, Y + 0.54, 0.2); b.add(vz); const crest = new T.Mesh(new T.ConeGeometry(0.05, 0.3, 6), _armB); crest.position.set(0, Y + 0.84, -0.04); b.add(crest);
  const c = _coreCrystal(0.12, Y + 0.05); b.add(c); const parts = [];
  for (const s of [-1, 1]) { const pd = hexShield(0.34, 0.09, _armB); pd.position.set(s * 0.56, Y + 0.3, 0); pd.rotation.set(-0.3, s * 0.6, s * 0.25); b.add(pd); const ln = new T.Mesh(new T.TorusGeometry(0.31, 0.012, 4, 6), M.glow); ln.position.copy(pd.position); ln.rotation.copy(pd.rotation); ln.translateZ(0.05); b.add(ln);
    const fist = G(); fist.position.set(s * 0.6, Y - 0.35, 0.14); const fb = cbox(0.3, 0.26, 0.3, 0.06, _armB); fist.add(fb); const kn = cbox(0.26, 0.07, 0.07, 0.015, M.glow); kn.position.set(0, 0.08, 0.17); fist.add(kn); b.add(fist); parts.push({ fist, s }); }
  const L = _lamp(b, Y + 0.2, 0.6);
  return { g, core: Y + 0.1, update(t, act) { const ph = 1.6 * t, ac = act || 0; b.position.y = 0.04 * Math.sin(ph); helm.position.y = Y + 0.5 + 0.02 * Math.sin(ph * 2 + 1); parts.forEach(P => { P.fist.position.y = Y - 0.35 + 0.05 * Math.sin(ph * 2 + P.s) + 0.2 * ac; P.fist.position.z = 0.14 + 0.35 * ac; }); L.intensity = 0.5 + 0.8 * ac; } };
});
