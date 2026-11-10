const scene = new T.Scene();
const cam = new T.PerspectiveCamera(28, W / H, 0.1, 400);
cam.position.set(22, 9, 82); cam.lookAt(5, 9, 0);
scene.add(new T.HemisphereLight(0x5a6a80, 0x0a0a0a, 0.35));
const key = new T.DirectionalLight(0xff9050, 1.3); key.position.set(-30, 12, 10); scene.add(key);   // the volcano lies to its left
const tox = new T.DirectionalLight(0x6dff5a, 0.25); tox.position.set(10, -4, 10); scene.add(tox);
const con = new T.MeshStandardMaterial({ color: 0x4a4d52, roughness: 0.85, flatShading: true });
const conD = new T.MeshStandardMaterial({ color: 0x2e3238, roughness: 0.9, flatShading: true });
const met = new T.MeshStandardMaterial({ color: 0x2a3038, roughness: 0.5, metalness: 0.7, flatShading: true });
const grn = new T.MeshStandardMaterial({ color: 0x6dff5a, emissive: 0x6dff5a, emissiveIntensity: 1.2 });
const warn = new T.MeshStandardMaterial({ color: 0xffcc44, emissive: 0xffaa22, emissiveIntensity: 0.6 });
const add = (geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); scene.add(m); return m; };
// cooling towers (hyperboloids), one cracked and stained
const tower = (x, z, h, r) => { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new T.Vector2(r * (0.62 + 0.38 * Math.pow(2 * t - 1.15, 2)), t * h)); }
  const m = add(new T.LatheGeometry(pts, 18), con, x, 0, z); m.material = con; m.material.side = T.DoubleSide;
  add(new T.CylinderGeometry(r * 0.66, r * 0.66, 0.4, 18, 1, true), new T.MeshStandardMaterial({ color: 0x8a6a2a, emissive: 0x5a3a10, emissiveIntensity: 0.4, side: T.DoubleSide, flatShading: true }), x, h * 0.86, z); return m; };
tower(-9, -6, 18, 6.5); tower(4, -10, 16, 6);
// the reactor dome and its hall
add(new T.CylinderGeometry(6, 6, 7, 16), conD, 14, 3.5, 2); add(new T.SphereGeometry(6, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), con, 14, 7, 2);
add(new T.BoxGeometry(18, 6, 8), conD, -2, 3, 6); add(new T.BoxGeometry(6, 9, 6), met, -12, 4.5, 6);
// the stack, its warning bands
add(new T.CylinderGeometry(0.9, 1.3, 26, 10), con, 24, 13, -4); [6, 14, 22].forEach(y => add(new T.CylinderGeometry(1.32 - y * 0.015, 1.32 - y * 0.015, 0.8, 10), warn, 24, y, -4));
// pipes, one broken (the leak is painted on top)
const pipe = (a, b, r) => { const A = new T.Vector3(...a), B = new T.Vector3(...b); const m = add(new T.CylinderGeometry(r, r, A.distanceTo(B), 8), met, 0, 0, 0); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize()); };
pipe([-11, 7, 9], [8, 7, 9], 0.7); pipe([8, 7, 9], [8, 2, 13], 0.7); pipe([8, 2, 13], [12, 2, 16], 0.7);
add(new T.TorusGeometry(0.75, 0.15, 6, 10), grn, 12.2, 2, 16.3);
// green windows on the hall
for (let i = 0; i < 7; i++) add(new T.BoxGeometry(1.2, 0.8, 0.1), grn, -9 + i * 2.4, 4.5, 10.05);
