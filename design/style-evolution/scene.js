// THE SHARED SCENE (design/style-evolution; Proposed, a draft for the owner, nothing in the game). Loaded into the render page after three.js r128, its
// postprocessing scripts and the follower forms' model code (design/evolutions/forms-*.js, as design/evolutions/bake.js loads them), inside window.__render,
// so FORMS, FORMS2, M, setElementColour, EL and T are in scope. One moment of play, built from the game's own map (export.js): the squad fighting toxic ants
// on the Sewers' north bank by Side Quest's gate. A style (styles.js) chooses materials, light, camera, post-processing and the combat overlay.
// World units: a tile is 1; the game's 122 px wall is 1.66 (a vertical unit is 73.5 px in its 2:1 projection); game (x, y) is three.js (x, z).

const SC = {};
const PX = 73.5, WALL_H = map.wallH / PX, GATE_H = map.gateH / PX, SINK = 12 / PX, CUT_H = 0.1;
const v3 = (x, y, z) => new T.Vector3(x, y, z);
function mat(o) { return new T.MeshStandardMaterial(Object.assign({ roughness: 0.7, metalness: 0.1 }, o)); }
function canvasTex(w, h, draw, opts) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; if (opts && opts.nearest) { t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; } if (opts && opts.repeat) { t.wrapS = t.wrapT = T.RepeatWrapping; } return t; }

// ── the map, read once ──
const W = map.window, key = (x, y) => x + ',' + y;
const RIVER = map.solids.filter(s => s.kind === 'river').map(s => s.bb);
const BAND0 = [W[0] - 2, 110.5, -14.5, 113.5], BAND = BAND0;   // the river's band across the shot (the west river and the bridge's gap are water too, under the grating)
const inBand = (x, y) => x > BAND[0] && x < BAND[2] && y > BAND[1] && y < BAND[3];
const DECK = map.decor.filter(d => d.kind === 'bridge_deck').map(d => d.rect), BROKEN = map.decor.filter(d => d.kind === 'bridge_broken').map(d => d.rect);
const room = new Set(map.cells.map(c => key(c[0], c[1])));
const SOLID = []; for (let x = W[0] - 3; x <= W[2] + 3; x++) for (let y = Math.floor(W[1]) - 3; y <= W[3] + 3; y++) if (!room.has(key(x, y)) && !inBand(x, y)) SOLID.push([x, y]);
const solidCells = SOLID;
const north = y => y < 110;   // (the north side stands full height; the south side is cut away so the camera sees in)

// THE MOMENT: who stands where (tiles), who faces whom, what is in the air
const CAST = {
  player:   { at: [-31.0, 109.25], face: [-27.2, 108.9], form: 814, color: '#19e6c1', h: 0.78, name: 'YOU', hp: 0.82, act: 0 },
  ram:      { at: [-28.45, 109.0], face: [-27.2, 108.9], form: 935, color: '#00ccaa', h: 0.95, w: 0.95, name: 'JELLY RAM', role: 'BRAWLER', lv: 9, hp: 0.64, t: 1.2, act: 0.8 },
  skink:    { at: [-32.7, 110.0], face: [-26.0, 109.9], form: 905, color: '#ffe033', h: 0.7, w: 1.25, name: 'ELECTRO SKINK', role: 'MAGE', lv: 8, hp: 0.9, t: 1.2, act: 0.7 },
  egg:      { at: [-30.0, 110.15], face: [-26.0, 109.9], form: 835, color: '#ff3300', h: 0.8, w: 0.7, name: 'FIRE EGG', role: 'TECHNICIAN', lv: 7, hp: 0.48 },
};
const FOES = [
  { id: 'a', at: [-27.25, 108.85], face: [-28.45, 109.0], size: 1.12, name: 'TOXIC SOLDIER', lv: 9, hp: 0.38 },
  { id: 'b', at: [-25.85, 109.95], face: [-30.0, 110.15], size: 0.92, name: 'TOXIC WORKER', lv: 7, hp: 0.86 },
  { id: 'c', at: [-26.0, 108.05], face: [-28.0, 109.6], size: 0.84, name: 'TOXIC WORKER', lv: 6, hp: 1 },
];
const TOXIC = '#5cff5c';
const ANG = (from, to) => Math.atan2(-(to[1] - from[1]), to[0] - from[0]);   // a model's +x forward turned to face a point (three's y-rotation; game y is three z)

// ── THE WORLD ──
function buildWorld(P) {
  const g = new T.Group(), unit = new T.BoxGeometry(1, 1, 1), B = P.board, onBoard = c => !B || (c[0] > B[0] && c[0] < B[2] && c[1] > B[1] && c[1] < B[3]);   // (P.board: only the map's cells in that rectangle, a board on a table)
  const floorCells = map.cells.filter(c => !inBand(c[0], c[1]) && onBoard(c)), solidCells = SOLID.filter(onBoard), BAND = B ? [B[0], BAND0[1], B[2], BAND0[3]] : BAND0;
  // the floor: a tile each
  const fl = new T.InstancedMesh(unit, P.floor, floorCells.length); fl.receiveShadow = true; const m4 = new T.Matrix4(), col = new T.Color();
  floorCells.forEach((c, i) => { m4.makeScale(1, 0.12, 1); m4.setPosition(c[0], -0.06, c[1]); fl.setMatrixAt(i, m4); if (P.floorTint) { P.floorTint(c, col); fl.setColorAt(i, col); } });
  g.add(fl); SC.floor = fl;
  // the solid ground outside the room: full height on the north side (its faces are the walls), cut low on the south
  const tall = solidCells.filter(c => north(c[1])), low = solidCells.filter(c => !north(c[1]));
  const wt = new T.InstancedMesh(unit, P.wallMats, tall.length); wt.castShadow = true; wt.receiveShadow = true;
  tall.forEach((c, i) => { m4.makeScale(1, WALL_H, 1); m4.setPosition(c[0], WALL_H / 2, c[1]); wt.setMatrixAt(i, m4); }); g.add(wt); SC.walls = wt;
  const wl = new T.InstancedMesh(unit, P.cutMats, low.length); wl.receiveShadow = true;
  low.forEach((c, i) => { m4.makeScale(1, CUT_H, 1); m4.setPosition(c[0], CUT_H / 2, c[1]); wl.setMatrixAt(i, m4); }); g.add(wl); SC.cut = wl;
  // the river: its bed, the water sunk below the ledges, the far bank's face
  const bandW = BAND[2] - BAND[0], bandD = BAND[3] - BAND[1];
  const bed = new T.Mesh(new T.BoxGeometry(bandW, 0.1, bandD), P.bed); bed.position.set((BAND[0] + BAND[2]) / 2, -SINK - 0.25, (BAND[1] + BAND[3]) / 2); g.add(bed);
  const water = new T.Mesh(new T.PlaneGeometry(bandW, bandD), P.water); water.rotation.x = -Math.PI / 2; water.position.set((BAND[0] + BAND[2]) / 2, -SINK, (BAND[1] + BAND[3]) / 2); water.receiveShadow = true; g.add(water); SC.water = water;
  const bank = new T.Mesh(new T.BoxGeometry(bandW, SINK + 0.3, 0.06), P.bank); bank.position.set((BAND[0] + BAND[2]) / 2, -(SINK + 0.3) / 2, BAND[1] + 0.03); g.add(bank);
  const bank2 = bank.clone(); bank2.position.z = BAND[3] - 0.03; g.add(bank2);
  // the hazard kerb along both banks (the owner's pick of 2026-11-15)
  if (P.kerb) for (const z of [BAND[1] - 0.09, BAND[3] + 0.09]) { const k = new T.Mesh(new T.BoxGeometry(bandW, 0.035, 0.18), P.kerb); k.position.set((BAND[0] + BAND[2]) / 2, 0.0, z); k.receiveShadow = true; g.add(k); }
  // the bridges: the west one's grating and rails; the broken one's two stumps
  for (const r of DECK) if (onBoard([(r[0] + r[2]) / 2, (r[1] + r[3]) / 2])) g.add(bridge(P, r, 0));
  for (const r of BROKEN) if (onBoard([(r[0] + r[2]) / 2, (r[1] + r[3]) / 2])) { g.add(bridge(P, [r[0], r[1], r[2], r[1] + 1.15], 1)); g.add(bridge(P, [r[0], r[3] - 0.95, r[2], r[3]], -1)); }
  // the gate across Side Quest's passage, the rubble in the collapsed tunnel's mouth
  for (const s of map.solids) {
    if (s.kind === 'gate') g.add(gate(P, s.bb));
    if (s.kind === 'rubble') g.add(rubble(P, s.bb));
    if (s.kind === 'pump' || s.kind === 'valve') g.add(machine(P, s));
  }
  // the north wall's things: pipes, the sealed hatch's rungs, lamps, the brood hole and its eggs, puddles
  for (const d of map.decor) {
    if (d.kind === 'pipe' && d.a) g.add(pipe(P, d.a, d.b));
    if (d.kind === 'sealed_hatch' && d.a) g.add(ladder(P, d.a, d.b));
    if (d.kind === 'brood_hole' && d.a) g.add(broodHole(P, d.a, d.b));
    if (d.kind === 'egg_cluster' && d.at) g.add(eggs(P, d.at));
    if (d.kind === 'puddle' && d.at) g.add(puddle(P, d.at));
    if (d.kind === 'wall_light' && d.a) g.add(wallLight(P, d.a, d.b, 0.55));
  }
  for (const l of map.lamps) g.add(wallLight(P, [l[0] - 0.15, l[1]], [l[0] + 0.15, l[1]], 0.0, true));
  return g;
}
// a point on a far wall's face (its line a-b), pushed out by `off`, at height h
function onWall(a, b, t, off, h) { const x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, vertical = Math.abs(a[0] - b[0]) < 1e-6; return vertical ? v3(x + off, h, y) : v3(x, h, y + off); }
function bridge(P, r, broken) {
  const g = new T.Group(), w = r[2] - r[0], d = r[3] - r[1];
  const deck = new T.Mesh(new T.BoxGeometry(w, 0.05, d), P.grating); deck.position.set((r[0] + r[2]) / 2, -0.03, (r[1] + r[3]) / 2); deck.receiveShadow = true; deck.castShadow = true; g.add(deck);
  for (const x of [r[0] + 0.04, r[2] - 0.04]) {
    const rail = new T.Mesh(new T.BoxGeometry(0.04, 0.04, d), P.rail); rail.position.set(x, 0.5, (r[1] + r[3]) / 2); rail.castShadow = true; g.add(rail);
    for (let z = r[1] + 0.1; z <= r[3] - 0.05; z += broken ? 0.45 : 0.75) { const post = new T.Mesh(new T.BoxGeometry(0.04, 0.5, 0.04), P.rail); post.position.set(x, 0.25, z); post.castShadow = true; g.add(post); }
  }
  if (broken) deck.rotation.x = broken * 0.08;   // (a stump sags towards the gap)
  return g;
}
function gate(P, bb) {
  const g = new T.Group(), y = (bb[1] + bb[3]) / 2, x0 = bb[0], x1 = bb[2], n = Math.round((x1 - x0) * 5);
  for (let k = 1; k < n; k++) { const b = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, GATE_H - 0.08, 6), P.bar); b.position.set(x0 + (x1 - x0) * k / n, (GATE_H - 0.08) / 2, y); b.castShadow = true; g.add(b); }
  for (const h of [0.08, GATE_H * 0.5, GATE_H - 0.1]) { const r = new T.Mesh(new T.BoxGeometry(x1 - x0, 0.05, 0.05), P.gateRail); r.position.set((x0 + x1) / 2, h, y); r.castShadow = true; g.add(r); }
  for (const x of [x0, x1]) { const p = new T.Mesh(new T.BoxGeometry(0.08, GATE_H + 0.05, 0.08), P.gateRail); p.position.set(x, (GATE_H + 0.05) / 2, y); g.add(p); }
  const lock = new T.Mesh(new T.BoxGeometry(0.1, 0.1, 0.04), P.lock); lock.position.set((x0 + x1) / 2, GATE_H * 0.5 - 0.05, y + 0.04); g.add(lock);
  return g;
}
function rubble(P, bb) {
  const g = new T.Group(); let s = 7;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 26; i++) { const r = 0.12 + rnd() * 0.28, m = new T.Mesh(new T.DodecahedronGeometry(r, 0), P.rock); m.position.set(bb[0] + 0.2 + rnd() * (bb[2] - bb[0] - 0.4), r * 0.6 + rnd() * 0.5, bb[1] + 0.1 - rnd() * 0.9); m.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); m.castShadow = true; m.receiveShadow = true; g.add(m); }
  return g;
}
function machine(P, s) {
  const g = new T.Group(), cx = (s.bb[0] + s.bb[2]) / 2, cz = (s.bb[1] + s.bb[3]) / 2, w = s.bb[2] - s.bb[0], d = s.bb[3] - s.bb[1];
  const body = new T.Mesh(new T.BoxGeometry(w * 0.85, s.kind === 'pump' ? 0.7 : 0.35, d * 0.7), P.machine); body.position.set(cx, s.kind === 'pump' ? 0.35 : 0.175, cz); body.castShadow = true; body.receiveShadow = true; g.add(body);
  const wheel = new T.Mesh(new T.TorusGeometry(0.16, 0.03, 6, 16), P.lock); wheel.position.set(cx, (s.kind === 'pump' ? 0.7 : 0.35) + 0.12, cz); wheel.rotation.x = Math.PI / 2; g.add(wheel);
  return g;
}
function pipe(P, a, b) { const p0 = onWall(a, b, 0, 0.12, 1.15), p1 = onWall(a, b, 1, 0.12, 1.15), L = p0.distanceTo(p1), m = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, L, 10), P.pipe); m.position.copy(p0).lerp(p1, 0.5); m.quaternion.setFromUnitVectors(v3(0, 1, 0), p1.clone().sub(p0).normalize()); m.castShadow = true; return m; }
function ladder(P, a, b) { const g = new T.Group(); for (let h = 0.15; h < WALL_H - 0.1; h += 0.16) { const p0 = onWall(a, b, 0.25, 0.06, h), p1 = onWall(a, b, 0.75, 0.06, h), m = new T.Mesh(new T.CylinderGeometry(0.015, 0.015, p0.distanceTo(p1), 6), P.rail); m.position.copy(p0).lerp(p1, 0.5); m.quaternion.setFromUnitVectors(v3(0, 1, 0), p1.clone().sub(p0).normalize()); g.add(m); } return g; }
function broodHole(P, a, b) { const c = onWall(a, b, 0.5, 0.02, 0.28), m = new T.Mesh(new T.CircleGeometry(0.34, 20), P.hole); m.position.copy(c); m.scale.set(1, 0.75, 1); return m; }
function eggs(P, at) { const g = new T.Group(); [[0, 0, 0.09], [0.13, 0.05, 0.07], [-0.12, 0.06, 0.08], [0.04, 0.14, 0.06]].forEach(e => { const m = new T.Mesh(new T.SphereGeometry(e[2], 12, 8), P.egg); m.position.set(at[0] + e[0], e[2] * 0.8, at[1] + e[1]); m.scale.y = 1.3; g.add(m); }); return g; }
function puddle(P, at) { const m = new T.Mesh(new T.CircleGeometry(0.42, 24), P.puddle); m.rotation.x = -Math.PI / 2; m.position.set(at[0], 0.002, at[1]); m.scale.set(1.3, 0.8, 1); return m; }
function wallLight(P, a, b, h, refit) {
  const g = new T.Group(), c = onWall(a, b, 0.5, 0.05, refit ? 0.84 : 1.25 + h), vertical = Math.abs(a[0] - b[0]) < 1e-6;
  const lamp = new T.Mesh(new T.BoxGeometry(vertical ? 0.06 : 0.34, 0.08, vertical ? 0.34 : 0.06), P.lampOn); lamp.position.copy(c); g.add(lamp);
  if (P.lampLight) { const l = new T.PointLight(P.lampLight.color, P.lampLight.intensity, P.lampLight.distance, 2); l.position.copy(onWall(a, b, 0.5, 0.45, refit ? 0.8 : 1.2)); g.add(l); }
  return g;
}

// ── THE CAST ──
// a follower form or the player, built from the forms' own model code, with its own materials (the forms share theirs, coloured by element)
function buildForm(c) {   // (as design/evolutions/bake.js: posed by its update, its glow sprites and its pools on the floor left out; it faces +z)
  EL = { color: c.color }; setElementColour(c.color);
  const B = (FORMS2[c.form] || FORMS[c.form]).build(), g = new T.Group();
  const ground = o => { for (let q = o; q; q = q.parent) if (q.userData && q.userData.ground) return true; return false; };
  const shown = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
  if (B.update) B.update(c.t === undefined ? 0.6 : c.t, c.act || 0);
  B.g.traverse(o => { if (o.isSprite || o.isLight || (M.rotWash && o.material === M.rotWash) || ground(o)) o.visible = false; });
  B.g.traverse(o => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); o.castShadow = true; o.receiveShadow = true; } });
  B.g.updateMatrixWorld(true); const box = new T.Box3();
  B.g.traverse(o => { if (o.isMesh && shown(o)) { o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
  const h = box.max.y - box.min.y || 1, len = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) || 1, s = Math.min(c.h / h, (c.w || 1.0) / len);   // (as tall as c.h, no longer than c.w: a lizard is long, not tall)
  B.g.scale.setScalar(s); B.g.position.set(-(box.min.x + box.max.x) / 2 * s, -box.min.y * s, -(box.min.z + box.max.z) / 2 * s); g.add(B.g); g.userData.B = B;
  g.position.set(c.at[0], 0, c.at[1]); g.rotation.y = Math.atan2(c.face[0] - c.at[0], c.face[1] - c.at[1]); return g;
}
// the forms' metal wants something to reflect: the baker's little studio (a dark box, three soft panels), as an environment map
function studioEnv(renderer) {
  const es = new T.Scene(); es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -Math.PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, Math.PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, Math.PI);
  return new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
}
// a toxic ant: gaster, petiole, thorax, a heart-shaped head with slanted eyes, long curved jaws, six two-part legs, antennae (the game's ant, js/bugs3d.js, in 3D)
function buildAnt(f) {
  const g = new T.Group(), shell = mat({ color: 0x14201a, roughness: 0.35, metalness: 0.35 }), plate = mat({ color: 0x223a2a, roughness: 0.4, metalness: 0.3 }), glow = mat({ color: TOXIC, emissive: TOXIC, emissiveIntensity: 0.9, roughness: 0.3 }), jaw = mat({ color: 0x9fbf8f, roughness: 0.35, metalness: 0.4 });
  const ell = (rx, ry, rz, m, x, y, z) => { const e = new T.Mesh(new T.SphereGeometry(1, 20, 14), m); e.scale.set(rx, ry, rz); e.position.set(x, y, z); e.castShadow = true; return e; };
  g.add(ell(0.26, 0.19, 0.2, shell, -0.36, 0.3, 0));                       // the gaster
  for (const k of [0.2, 0.5]) { const band = new T.Mesh(new T.TorusGeometry(0.18 - k * 0.06, 0.018, 6, 24), glow); band.position.set(-0.36 + (k - 0.35) * 0.4, 0.31, 0); band.rotation.y = Math.PI / 2; band.scale.set(1, 1.05, 1); g.add(band); }
  g.add(ell(0.06, 0.06, 0.06, plate, -0.12, 0.28, 0));                      // the waist
  g.add(ell(0.15, 0.11, 0.11, shell, 0.03, 0.31, 0));                       // the thorax
  g.add(ell(0.1, 0.09, 0.075, shell, 0.22, 0.36, 0.055)); g.add(ell(0.1, 0.09, 0.075, shell, 0.22, 0.36, -0.055));   // the head's two lobes
  g.add(ell(0.08, 0.07, 0.07, plate, 0.29, 0.34, 0));
  for (const s of [1, -1]) {
    g.add(ell(0.028, 0.016, 0.022, glow, 0.31, 0.385, 0.07 * s));          // an eye, slanted
    const jp = [v3(0.33, 0.31, 0.05 * s), v3(0.45, 0.29, 0.1 * s), v3(0.55, 0.27, 0.04 * s), v3(0.57, 0.26, -0.03 * s)];   // a jaw, curving in
    const jm = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(jp), 12, 0.018, 6), jaw); jm.castShadow = true; g.add(jm);
    const ap = [v3(0.3, 0.42, 0.04 * s), v3(0.38, 0.6, 0.12 * s), v3(0.52, 0.66, 0.2 * s)];   // an antenna
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(ap), 10, 0.008, 5), shell));
    for (let i = 0; i < 3; i++) {   // the legs: up and out, then down to the floor
      const hip = v3(0.08 - i * 0.09, 0.27, 0.07 * s), knee = v3(0.12 - i * 0.16, 0.42, 0.26 * s), foot = v3(0.2 - i * 0.24, 0.0, 0.42 * s);
      for (const [p, q] of [[hip, knee], [knee, foot]]) { const L = p.distanceTo(q), m = new T.Mesh(new T.CylinderGeometry(0.014, 0.02, L, 6), shell); m.position.copy(p).lerp(q, 0.5); m.quaternion.setFromUnitVectors(v3(0, 1, 0), q.clone().sub(p).normalize()); m.castShadow = true; g.add(m); }
    }
  }
  g.scale.setScalar(f.size * 0.95); g.position.set(f.at[0], 0, f.at[1]); g.rotation.y = ANG(f.at, f.face); g.userData.glow = glow; return g;
}
function buildCast(P) {
  const g = new T.Group(), parts = {};
  for (const k in CAST) { const o = buildForm(CAST[k]); parts[k] = o; g.add(o); }
  for (const f of FOES) { const o = buildAnt(f); parts['ant_' + f.id] = o; g.add(o); }
  return { g, parts };
}
// THE SHOTS IN THE AIR: the Skink's bolt flying at the worker on the bank, the Ram's blow landing on the soldier, the worker's spit at the egg
function buildFx(P) {
  const g = new T.Group(), parts = {};
  const bolt = new T.Group(), a = v3(-32.3, 0.62, 110.0), b = v3(-28.9, 0.55, 109.97); let pts = [a];
  for (let i = 1; i < 9; i++) { const t = i / 9, p = a.clone().lerp(b, t); p.y += Math.sin(i * 2.1) * 0.06; p.z += Math.cos(i * 3.3) * 0.07; pts.push(p); } pts.push(b);
  const boltMat = new T.MeshBasicMaterial({ color: 0xfff6a0, toneMapped: false }); bolt.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, false, 'catmullrom', 0), 64, 0.018, 6), boltMat));
  const head = new T.Mesh(new T.SphereGeometry(0.09, 16, 10), new T.MeshBasicMaterial({ color: 0xffffcc, toneMapped: false })); head.position.copy(b); bolt.add(head);
  if (P.fxLights !== false) { const l = new T.PointLight(0xffe033, 2.2, 3.5, 2); l.position.copy(b); bolt.add(l); }
  g.add(bolt); parts.bolt = bolt; parts.boltAt = b;
  const spark = new T.Group(), sc = v3(-27.75, 0.45, 108.95), sm = new T.MeshBasicMaterial({ color: 0x9ffff0, toneMapped: false });
  for (let i = 0; i < 9; i++) { const d = v3(Math.cos(i * 2.4) * 0.5, Math.sin(i * 1.7) * 0.35 + 0.2, Math.sin(i * 2.4) * 0.5).normalize(), L = 0.18 + (i % 3) * 0.07, m = new T.Mesh(new T.ConeGeometry(0.018, L, 5), sm); m.position.copy(sc).addScaledVector(d, L / 2 + 0.04); m.quaternion.setFromUnitVectors(v3(0, 1, 0), d); spark.add(m); }
  if (P.fxLights !== false) { const l = new T.PointLight(0x00ffcc, 1.6, 2.5, 2); l.position.copy(sc); spark.add(l); }
  g.add(spark); parts.spark = spark; parts.sparkAt = sc;
  const spit = new T.Group(), s0 = v3(-26.4, 0.4, 109.98), s1 = v3(-28.2, 0.5, 110.05), sp = new T.MeshStandardMaterial({ color: TOXIC, emissive: TOXIC, emissiveIntensity: 1.2, transparent: true, opacity: 0.9 });
  for (let i = 0; i < 4; i++) { const m = new T.Mesh(new T.SphereGeometry(0.07 - i * 0.012, 12, 8), sp); m.position.copy(s1).lerp(s0, i * 0.12); spit.add(m); }
  g.add(spit); parts.spit = spit; parts.spitAt = s1;
  return { g, parts };
}
