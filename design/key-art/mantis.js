const scene = new T.Scene();
const cam = new T.PerspectiveCamera(32, W / H, 0.1, 200);
cam.position.set(-4, 1.0, 27); cam.lookAt(0.3, 3.9, 0);
scene.add(new T.HemisphereLight(0x3a4a60, 0x050a06, 0.35));
const key = new T.DirectionalLight(0xff9a50, 1.5); key.position.set(8, 6, 3); scene.add(key);   // the volcano's light, from the right
const rim = new T.DirectionalLight(0x6dff5a, 1.6); rim.position.set(-6, -2, -4); scene.add(rim);   // toxic light from the sewer below
const fill = new T.DirectionalLight(0x4a9cff, 0.5); fill.position.set(-8, 4, 6); scene.add(fill);
const chit = new T.MeshStandardMaterial({ color: 0x1a2a1e, roughness: 0.55, metalness: 0.25, flatShading: true });
const chitD = new T.MeshStandardMaterial({ color: 0x0c140f, roughness: 0.5, metalness: 0.3, flatShading: true });
const glow = new T.MeshStandardMaterial({ color: 0x2a6a2a, emissive: 0x3dcf3a, emissiveIntensity: 0.9, roughness: 0.3, flatShading: true });
const eyeM = new T.MeshStandardMaterial({ color: 0x3aff4a, emissive: 0x2aff3a, emissiveIntensity: 1.0, roughness: 0.15, metalness: 0.1, flatShading: true });
const wingM = new T.MeshStandardMaterial({ color: 0x8dffb0, emissive: 0x2a8a40, emissiveIntensity: 0.5, transparent: true, opacity: 0.32, side: T.DoubleSide, roughness: 0.2, flatShading: true });
const M = new T.Group(); scene.add(M);
const seg = (a, b, r0, r1, mat, sides) => { const A = new T.Vector3(...a), B = new T.Vector3(...b), L = A.distanceTo(B);
  const m = new T.Mesh(new T.CylinderGeometry(r1, r0, L, sides || 6), mat); m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize()); M.add(m); return m; };
const ball = (p, r, mat, d) => { const m = new T.Mesh(new T.IcosahedronGeometry(r, d || 0), mat); m.position.set(...p); M.add(m); return m; };
const spike = (a, dir, len, r) => { const A = new T.Vector3(...a), D = new T.Vector3(...dir).normalize(); const m = new T.Mesh(new T.ConeGeometry(r, len, 4), chitD);
  m.position.copy(A).add(D.clone().multiplyScalar(len / 2)); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), D); M.add(m); };
// abdomen: segmented, sloping back and down into the sewer
const abd = [[0, 3.0, -0.4], [0.2, 2.3, -1.6], [0.35, 1.5, -2.6], [0.45, 0.6, -3.4], [0.5, -0.4, -3.9]];
const ar = [0.85, 1.0, 0.95, 0.75, 0.45];
for (let i = 0; i < abd.length - 1; i++) { seg(abd[i], abd[i + 1], ar[i], ar[i + 1], i % 2 ? chit : chitD, 7); const b = seg(abd[i], abd[i + 1], ar[i] * 1.02, ar[i] * 0.2, glow, 7); b.scale.set(1.02, 0.06, 1.02); }
// thorax and the long raised neck (prothorax)
seg([0, 3.0, -0.4], [0.05, 3.6, 0.3], 0.7, 0.55, chit, 6);
seg([0.05, 3.6, 0.3], [0.2, 6.2, 1.1], 0.5, 0.32, chit, 6);
for (let i = 0; i < 5; i++) spike([0.2 + 0.03 * i, 4.0 + 0.45 * i, 0.55 + 0.15 * i], [0, 0.4, 1], 0.35, 0.08);
// head: a wide triangle, the eyes at its corners
const head = new T.Mesh(new T.ConeGeometry(0.95, 1.3, 3), chit); head.position.set(0.25, 6.75, 1.35); head.rotation.set(Math.PI, 0, 0); head.rotation.x = Math.PI + 0.35; head.scale.set(1.25, 1, 0.55); M.add(head);
ball([-0.75, 7.15, 1.4], 0.42, eyeM, 1); ball([1.25, 7.15, 1.4], 0.42, eyeM, 1);
ball([0.25, 6.15, 1.7], 0.16, glow);
// antennae
seg([0.0, 7.3, 1.4], [-1.6, 9.6, 0.4], 0.04, 0.015, chitD, 4); seg([0.5, 7.3, 1.4], [2.2, 9.4, 0.6], 0.04, 0.015, chitD, 4);
// mandibles
seg([0.0, 6.2, 1.7], [-0.1, 5.7, 2.0], 0.1, 0.03, chitD, 4); seg([0.5, 6.2, 1.7], [0.6, 5.7, 2.0], 0.1, 0.03, chitD, 4);
// raptorial forelegs, raised to strike (left high, right cocked)
const rapt = (side, sh, el, wr, tip) => { seg(sh, el, 0.32, 0.28, chit); seg(el, wr, 0.36, 0.22, chit); seg(wr, tip, 0.18, 0.05, chitD);
  const A = new T.Vector3(...el), B = new T.Vector3(...wr); for (let i = 1; i < 6; i++) { const p = A.clone().lerp(B, i / 6); spike([p.x, p.y, p.z], [side * 0.3, -0.5, 0.6], 0.5, 0.07); }
  const C = new T.Vector3(...wr), D = new T.Vector3(...tip); for (let i = 1; i < 4; i++) { const p = C.clone().lerp(D, i / 4); spike([p.x, p.y, p.z], [side * 0.2, -0.7, 0.3], 0.3, 0.05); }
  ball(el, 0.36, chitD); ball(wr, 0.25, chitD); };
rapt(-1, [-0.3, 4.6, 0.7], [-2.6, 7.4, 1.9], [-3.9, 5.4, 3.0], [-3.2, 7.2, 3.6]);
rapt(1, [0.6, 4.6, 0.7], [3.0, 6.0, 2.3], [3.6, 8.6, 2.9], [2.6, 7.4, 3.8]);
// walking legs, gripping the broken street
const leg = (hip, knee, foot) => { seg(hip, knee, 0.16, 0.13, chitD, 5); seg(knee, foot, 0.12, 0.05, chit, 5); ball(knee, 0.17, chitD); };
leg([-0.4, 3.0, -0.2], [-2.8, 3.9, 0.2], [-3.9, -0.6, 1.6]); leg([0.5, 3.0, -0.2], [3.2, 3.8, 0.0], [4.6, -0.6, 1.2]);
leg([-0.4, 2.8, -0.9], [-2.6, 3.5, -2.0], [-3.8, -0.6, -1.2]); leg([0.6, 2.8, -0.9], [3.0, 3.4, -2.2], [4.4, -0.6, -1.6]);
// wings: half spread, translucent, behind
const wing = (side) => { const s = new T.Shape(); s.moveTo(0, 0); s.quadraticCurveTo(side * 1.6, 2.4, side * 0.9, 6.2); s.quadraticCurveTo(side * 0.2, 4.0, 0, 0);
  const m = new T.Mesh(new T.ShapeGeometry(s, 8), wingM); m.position.set(0.1, 3.1, -0.5); m.rotation.set(-0.9, side * 0.5, side * -0.35); M.add(m);
  const v = new T.Mesh(new T.ShapeGeometry(s, 8), new T.MeshBasicMaterial({ color: 0x6dff5a, wireframe: true, transparent: true, opacity: 0.25 })); v.position.copy(m.position); v.rotation.copy(m.rotation); M.add(v); };
wing(-1); wing(1);
M.rotation.y = -0.35;
