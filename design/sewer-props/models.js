// THE SEWER DUNGEON'S PROPS AND KEY ITEMS, FOR THE REVIEW SHEETS (docs/SEWER-PROPS.md; design/sewer-props/review.js draws a sheet of each). Nothing in the game reads this file.
// THE APPROVED PIECES ARE NOT HERE ANY MORE: they are the game's own models now (design/props/models/_sewer.js: SEWER3D, SEWER_KIT; the families sewer.js and sewerfinds.js; build
// 2026-11-17bp). This file only names them for the review tool, each by its kit's caption, and holds whatever is still a DRAFT (now: the egg wall) (docs/ART-PROCESS.md: one piece first, a yes before the rest
// of its kind). A draft is built as the game's props are (design/props/BRIEF.md); approved, it moves into _sewer.js.
//   SEWER_DRAFTS.<id> = { no, title, sub, keyItem, states?, foot?, build(state) -> THREE.Group }
// Rejected and taken out (they are in the repository's history): a float box for the bridge box (the owner, 2026-11-21: "The bridge box should be facilities ordinary crates"); the Nest's
// three finds, a dead ant, shed chitin and eggs (the owner, 2026-11-21: "I don't really like the nest stuff. It's kind of too surreal").
const SEWER_DRAFTS = (function () {
  const D = {};
  for (const kind of Object.keys(SEWER_KIT.props)) D[kind] = Object.assign(SEWER3D.sheet(kind), { build: state => SEWER3D.prop(kind, state) });
  for (const id of SEWER_KIT.finds) D[id] = Object.assign(SEWER3D.sheet(id), { build: state => SEWER3D.find(id, state) });
  D.wall_sample = Object.assign(SEWER3D.sheet('wall_sample'), { build: () => SEWER3D.wall() });
  // ── F2 · AN EGG WALL (DRAFT) ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // The Nest's three finds first drafted (a dead ant, a shed skin, three glowing eggs on the floor) were rejected (the owner, 2026-11-21: "I don't really like the nest stuff. It's kind of too
  // surreal"). Asked what the things a sample is taken from should look like instead, the owner, 2026-11-22: "It should look like eggs that take up a wall and are adhered together by a black
  // substance and the eggs have big irregular patterns." So: two tiles of wall taken up by eggs, floor to nearly its top (the wall is 74 px), each in a collar of a black, wet-looking substance that
  // runs between them, hangs in drips and pools at the foot; the eggs bone-pale with big irregular dark blotches, no two alike in size or turn; a few fallen at the foot. No glow, nothing lit: a
  // thing that could be found on a wall. It stands at the back of its tiles, against the wall behind it, as the doors do. The colours, how many eggs and their sizes are the agent's, provisional.
  D.egg_wall = { no: 'F2', title: 'AN EGG WALL', sub: 'the Nest · two tiles of a wall · a sample is taken from it · DRAFT', keyItem: false, foot: [2, 1],
    build() {
      const g = new T.Group(), ZB = -0.38; let sd = 23; const r = () => { sd = sd + 0x6D2B79F5 | 0; let t = Math.imul(sd ^ sd >>> 15, 1 | sd); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      const tar = STY.std('#08090c', 0.4, 0.2), tarDull = STY.std('#0f1014', 0.2, 0.55);
      // an egg's shell: a pale ground and big irregular blotches, each a clump of overlapping rounds (drawn again a sheet's width off, so it closes round the egg)
      const shell = (seed, ground, dark, mid) => { let q = seed; const rr = () => { q = q + 0x6D2B79F5 | 0; let t = Math.imul(q ^ q >>> 15, 1 | q); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
        const c = document.createElement('canvas'); c.width = 256; c.height = 128; const x = c.getContext('2d'); x.fillStyle = ground; x.fillRect(0, 0, 256, 128);
        const clump = (col, n, r0, r1) => { const cx = rr() * 256, cy = 18 + rr() * 92; x.fillStyle = col; for (let i = 0; i < n; i++) { const a = rr() * 6.283, d = rr() * r1 * 0.9, rad = r0 + rr() * (r1 - r0); for (const ox of [-256, 0, 256]) { x.beginPath(); x.arc(cx + Math.cos(a) * d + ox, cy + Math.sin(a) * d * 0.7, rad, 0, 6.283); x.fill(); } } };
        for (let i = 0; i < 5; i++) clump(dark, 6, 9, 24); for (let i = 0; i < 4; i++) clump(mid, 4, 5, 13); for (let i = 0; i < 26; i++) { x.fillStyle = dark; x.beginPath(); x.arc(rr() * 256, rr() * 128, 1.5 + rr() * 2.5, 0, 6.283); x.fill(); }
        const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = T.RepeatWrapping; return new T.MeshStandardMaterial({ map: t, roughness: 0.5, metalness: 0.02 }); };
      const shells = [shell(3, '#b9b596', '#1b211d', '#6f7852'), shell(8, '#b0b792', '#20261f', '#7c7f58'), shell(15, '#c2bea2', '#161b19', '#656f4c'), shell(21, '#a9af8b', '#232a22', '#747a56')];
      const lump = (x, y, z, s, sx, sy, sz, m) => { const b = new T.Mesh(new T.IcosahedronGeometry(s, 1), m); b.scale.set(sx, sy, sz); b.position.set(x, y, z); g.add(b); };
      // the black substance: a bed against the wall, thinner toward its edges and its top; a pool at the foot; drips
      for (let i = 0; i < 80; i++) { const x = (r() * 2 - 1) * 0.9, top = 0.9 * (1 - 0.1 * x * x), y = 0.04 + r() * top; lump(x, y, ZB + 0.04 + r() * 0.05, 0.08 + r() * 0.09, 1, 0.9 + r() * 0.4, 0.42, i % 3 ? tar : tarDull); }
      for (let i = 0; i < 12; i++) lump((r() * 2 - 1) * 0.9, 0.012, ZB + 0.12 + r() * 0.3, 0.08 + r() * 0.1, 1.3, 0.14, 1, tar);
      for (let i = 0; i < 9; i++) { const x = (r() * 2 - 1) * 0.85, y = 0.25 + r() * 0.5, len = 0.1 + r() * 0.16; lump(x, y - len / 2, ZB + 0.13 + r() * 0.05, 0.02 + r() * 0.012, 1, len / 0.05, 1, tar); lump(x, y - len, ZB + 0.14, 0.03, 1, 1.2, 1, tar); }
      // the eggs: packed, none through another, each in its collar of the black stuff
      const eggs = []; for (let n = 0; eggs.length < 42 && n < 9000; n++) { const x = (r() * 2 - 1) * 0.87, top = 0.95 * (1 - 0.1 * x * x), rad = 0.07 + r() * 0.065, y = rad * 1.1 + r() * Math.max(0.01, top - rad * 1.1);
        if (eggs.every(e => Math.hypot(e.x - x, (e.y - y) * 0.88) > (e.rad + rad) * 0.9)) eggs.push({ x, y, rad }); }
      eggs.forEach((e, i) => { const z = ZB + 0.1 + e.rad * 0.5 + r() * 0.03, m = new T.Mesh(new T.SphereGeometry(1, 22, 16), shells[i % 4]); m.scale.set(e.rad * 0.82, e.rad * 1.14, e.rad * 0.82); m.position.set(e.x, e.y, z); m.rotation.set((r() - 0.5) * 0.5, r() * 6.283, (r() - 0.5) * 0.9); g.add(m);
        const c = new T.Mesh(new T.TorusGeometry(e.rad * 0.8, e.rad * 0.3, 8, 20), tar); c.scale.set(1, 1.12, 0.7); c.position.set(e.x, e.y, z - e.rad * 0.42); g.add(c); });
      // three fallen at the foot, in the pool
      for (const [x, z, rad, tz] of [[-0.42, ZB + 0.5, 0.085, 1.3], [0.2, ZB + 0.44, 0.1, 1.5], [0.62, ZB + 0.56, 0.075, 1.1]]) { const m = new T.Mesh(new T.SphereGeometry(1, 22, 16), shells[Math.floor(r() * 4)]); m.scale.set(rad * 0.82, rad * 1.14, rad * 0.82); m.position.set(x, rad * 0.8, z); m.rotation.set(0.2, r() * 6.283, tz); g.add(m); lump(x, 0.012, z, rad * 1.1, 1.3, 0.16, 1.1, tar); }
      return g; } };
  return D;
})();
