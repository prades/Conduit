// THE GIANT HOLDING TANK (family 'holdtank', kind holding_tank; the owner, 2026-11-13: "giant holding tanks and stuff" for the new Experiment Lab; of the one-piece draft, "Looks good"). A tall glass cylinder of
// glowing liquid on a heavy steel plinth, under a domed cap: footprint radius 0.95 tiles on the origin (a 2 x 2 prop), about 200 game-px tall (taller than the arena's reserves, 170: it towers over a follower).
// In the lab tank's make (tank.js 'lab'), bigger: four slim support rods, no hoops (the owner, of the Crystal's tank: "No hoops, plain glass"), the status panel and the details on the side the camera sees
// (angles -25..135 degrees). Liquid and bubbles only, nothing in it (as drafted). Variant 'holding_tank'. Marks: top (the cap's top), mid (the liquid's middle).
{
  const hc = c => new T.Color(c).convertSRGBToLinear();
  const hStd = (c, m, r, e) => { const x = new T.MeshStandardMaterial({ color: hc(c), metalness: m, roughness: r }); x.envMapIntensity = e == null ? 0.6 : e; return x; };
  const hGlow = (c, k) => { const m = new T.MeshBasicMaterial({ color: hc(c), toneMapped: false }); if (k) m.color.multiplyScalar(k); return m; };
  const HM = {
    steel: hStd('#5a6a76', 0.7, 0.5), steel2: hStd('#4a5864', 0.7, 0.55), steelLt: hStd('#93a6b8', 0.75, 0.4, 0.9), dark: hStd('#20272f', 0.6, 0.6, 0.3), pipe: hStd('#7a8c9c', 0.65, 0.42, 0.8),
    rubber: hStd('#121418', 0.1, 0.85, 0.2), liquid: new T.MeshStandardMaterial({ color: hc('#0a4a40'), emissive: hc('#12a07e'), emissiveIntensity: 0.38, metalness: 0, roughness: 0.25 }), core: hGlow('#0b3a34', 1.0),
    liquidHot: hGlow('#7dffd8', 1.1), glass: new T.MeshStandardMaterial({ color: hc('#bfe9ee'), transparent: true, opacity: 0.22, metalness: 0, roughness: 0.04, depthWrite: false, envMapIntensity: 1.3 }),
    teal: hGlow('#43e0a8', 1.2), amber: hGlow('#ffb347', 1.2), red: hGlow('#ff4a3a', 1.2), screen: hGlow('#1e8f7a', 0.9),
  };
  const hz = (n, r, h) => { const c = document.createElement('canvas'); c.width = 256; c.height = 32; const g = c.getContext('2d'); g.fillStyle = '#14181d'; g.fillRect(0, 0, 256, 32); g.fillStyle = '#f2c230';
    for (let i = -2; i < 18; i++) { g.beginPath(); g.moveTo(i * 16, 32); g.lineTo(i * 16 + 8, 32); g.lineTo(i * 16 + 24, 0); g.lineTo(i * 16 + 16, 0); g.closePath(); g.fill(); }
    const t = new T.CanvasTexture(c); t.wrapS = T.RepeatWrapping; t.repeat.set(n, 1); t.encoding = T.sRGBEncoding; return new T.MeshStandardMaterial({ map: t, metalness: 0.3, roughness: 0.6 }); };
  const at = (th, r) => [Math.cos(th) * r, Math.sin(th) * r], deg = d => d * PI / 180, rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const cy = (rt, rb, h, m, s) => new T.Mesh(new T.CylinderGeometry(rt, rb, h, s || 48), m);
  const sp = (r, m, s) => new T.Mesh(new T.SphereGeometry(r, s || 10, s || 10), m);
  const rodY = (g, x, z, y0, y1, r, m) => { const c = cy(r, r, y1 - y0, m, 10); c.position.set(x, (y0 + y1) / 2, z); g.add(c); return c; };
  const ring = (g, R, r, m, y) => { const t = new T.Mesh(new T.TorusGeometry(R, r, 8, 64), m); t.rotation.x = PI / 2; t.position.y = y; g.add(t); };
  const tank = () => {
    const g = G(), R = 0.95, base = px(18), y0 = base + px(4), y1 = px(182), capT = px(12), top = y1 + capT, gR = 0.78;
    // the plinth: two steel tiers, a hazard band, a ring of bolts
    const p1 = cy(R, R + 0.04, px(10), HM.steel2); p1.position.y = px(5); g.add(p1);
    const hb = cy(R + 0.005, R + 0.005, px(3), hz(22)); hb.position.y = px(8.5); g.add(hb);
    const p2 = cy(R - 0.1, R - 0.04, px(8), HM.steel); p2.position.y = px(14); g.add(p2);
    for (let i = 0; i < 20; i++) { const [x, z] = at((i + 0.5) * TAU / 20, R - 0.08), b = sp(0.035, HM.steelLt, 6); b.position.set(x, base + px(0.5), z); g.add(b); }
    const lip = cy(gR + 0.07, gR + 0.09, px(4), HM.steelLt); lip.position.y = base + px(2); g.add(lip);
    ring(g, gR - 0.02, 0.03, HM.liquidHot, y0 + px(1));   // the light in its floor, up through the liquid
    // the liquid, its bright surface, the bubbles rising
    const lq = y0 + (y1 - y0) * 0.92, li = cy(gR - 0.03, gR - 0.03, lq - y0, HM.liquid, 48); li.position.y = (y0 + lq) / 2; g.add(li);
    const sf = cy(gR - 0.03, gR - 0.03, px(1.4), HM.liquidHot); sf.position.y = lq; g.add(sf);
    for (let i = 0; i < 70; i++) { const a = rnd(i) * TAU, rr = Math.sqrt(rnd(i + 40)) * (gR - 0.12), b = sp(0.02 + rnd(i + 80) * 0.04, HM.liquidHot, 6); b.position.set(Math.cos(a) * rr, y0 + px(4) + (lq - y0 - px(8)) * rnd(i + 120), Math.sin(a) * rr); g.add(b); }
    for (let i = 0; i < 14; i++) { const b = sp(0.026 + i * 0.004, HM.liquidHot, 6); b.position.set(0.16 * Math.sin(i * 2.1), y0 + px(10) + i * px(11), 0.12 * Math.cos(i * 1.7)); g.add(b); }
    // the glass, plain, its rims and highlights
    const gl = new T.Mesh(new T.CylinderGeometry(gR, gR, y1 - y0, 64, 1, true), HM.glass); gl.position.y = (y0 + y1) / 2; gl.renderOrder = 2; g.add(gl);
    ring(g, gR, 0.025, HM.steelLt, y0 + px(0.5)); ring(g, gR, 0.025, HM.steelLt, y1 - px(0.5));
    for (const [th, w] of [[deg(40), 0.1], [deg(55), 0.04], [deg(-12), 0.05]]) { const [x, z] = at(th, gR + 0.005), hl = new T.Mesh(new T.PlaneGeometry(w, (y1 - y0) * 0.9), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.38, depthWrite: false })); hl.position.set(x, (y0 + y1) / 2, z); hl.lookAt(x * 3, (y0 + y1) / 2, z * 3); g.add(hl); }
    // four slim support rods from the plinth to the cap (no hoops)
    for (let i = 0; i < 4; i++) { const [x, z] = at(deg(45 + i * 90), gR + 0.08); rodY(g, x, z, base, y1, 0.04, HM.steelLt); }
    // the domed cap: a band, a dome, a hatch wheel, two pipes up with valves, a warning lamp
    const cb = cy(gR + 0.12, gR + 0.12, capT * 0.6, HM.steel); cb.position.y = y1 + capT * 0.3; g.add(cb);
    const dome = new T.Mesh(new T.SphereGeometry(gR + 0.1, 48, 16, 0, TAU, 0, PI / 2), HM.steel2); dome.scale.y = 0.32; dome.position.y = y1 + capT * 0.6; g.add(dome);
    for (let i = 0; i < 16; i++) { const [x, z] = at((i + 0.5) * TAU / 16, gR + 0.06), b = sp(0.03, HM.steelLt, 6); b.position.set(x, y1 + capT * 0.62, z); g.add(b); }
    for (const [th, h] of [[deg(25), 22], [deg(110), 15]]) { const [x, z] = at(th, 0.42); rodY(g, x, z, top - px(4), top + px(h), 0.07, HM.pipe); const el = sp(0.09, HM.pipe, 10); el.position.set(x, top + px(h), z); g.add(el); const v = new T.Mesh(new T.TorusGeometry(0.1, 0.022, 6, 16), hStd('#c4441c', 0.4, 0.5)); v.position.set(x, top + px(h * 0.6), z); g.add(v); }
    { const lamp = sp(0.07, HM.amber, 10); lamp.position.set(0, top + px(4), 0); g.add(lamp); }
    // the status panel on the plinth (the camera's side): a screen, three lights
    { const [x, z] = at(deg(45), R - 0.02), pn = new T.Mesh(new T.BoxGeometry(0.5, px(9), 0.06), HM.dark); pn.position.set(x, px(12), z); pn.lookAt(x * 3, px(12), z * 3); g.add(pn);
      const sc = new T.Mesh(new T.PlaneGeometry(0.3, px(5)), HM.screen); sc.position.set(x * 1.03, px(12.5), z * 1.03); sc.lookAt(x * 3, px(12.5), z * 3); g.add(sc);
      [[HM.teal, -0.18], [HM.teal, -0.12], [HM.amber, 0.2]].forEach(([m, o]) => { const l = sp(0.03, m, 8), t = deg(45) + PI / 2; l.position.set(x * 1.04 + Math.cos(t) * o, px(9.5), z * 1.04 + Math.sin(t) * o); g.add(l); }); }
    // a thick cable bundle down its back (the far side) to the floor, and a drain valve
    { const [x, z] = at(deg(210), gR + 0.15), path = new T.CatmullRomCurve3([new T.Vector3(x, top - px(2), z), new T.Vector3(x * 1.15, y1 - px(20), z * 1.15), new T.Vector3(x * 1.2, base + px(20), z * 1.2), new T.Vector3(x * 1.6, 0.03, z * 1.6)]); g.add(new T.Mesh(new T.TubeGeometry(path, 24, 0.06, 8), HM.rubber)); }
    { const [x, z] = at(deg(100), R); const d = cy(0.06, 0.06, 0.3, HM.pipe, 10); d.rotation.z = PI / 2; d.position.set(x, px(5), z + 0.12); g.add(d); }
    return { g, marks: { top: [0, top, 0], mid: [0, (y0 + lq) / 2, 0] } };
  };
  PROPS.holdtank = { variants: ['holding_tank'], canvas: [700, 900], exposure: 1.0, build() { return tank(); } };
}
