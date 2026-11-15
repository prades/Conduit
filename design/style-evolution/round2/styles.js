// ROUND 2 · THE TEN DIRECTIONS, REIMAGINED (design/style-evolution/round2; Proposed, for the owner to choose from, nothing in the game).
// Each direction is a whole way the game could look and fight: a palette, lights, a camera, post-processing, what it does to the models, its marks on the floor,
// and a HUD that shows how its fights are slowed down and made readable. Every colour, size, number, name and word here is the agent's, for a picture; none is a decision.
const STYLES = {};
function style(id, def) { def.id = id; STYLES[id] = def; }

// ── THE MOMENT: ants raid the Crystal; the squad holds them between the Crystal and the doors ──
function RAID(o) {
  const U = {
    player:  { kind: 'form', team: 'squad', form: 814, color: '#19e6c1', at: [12.6, 18.2], face: [15.3, 18.9], h: 0.95, w: 1.2, name: 'YOU', role: 'Conduit', tint: '#19e6c1', hp: 0.82, lvl: 9 },
    ram:     { kind: 'form', team: 'squad', form: 935, color: '#00ccaa', at: [13.6, 20.2], face: [15.3, 18.9], h: 2.3, w: 2.6, t: 1.2, act: 0.8, name: 'JELLY RAM', role: 'Brawler', el: 'CORE', tint: '#2fe0c0', hp: 0.64, lvl: 9 },
    crab:    { kind: 'form', team: 'squad', form: 923, color: '#ff7ab8', at: [12.3, 21.9], face: [11.0, 23.6], h: 1.15, w: 1.5, t: 0.9, act: 0.5, name: 'STONEPETAL', role: 'Technician', el: 'BLOOM', tint: '#ff8cc6', hp: 0.9, lvl: 8 },
    star:    { kind: 'form', team: 'squad', form: 940, color: '#7fd6ff', at: [11.2, 19.6], face: [11.0, 23.6], h: 1.5, w: 2.4, t: 0.6, act: 0.6, lift: 0.25, name: 'RIMESTAR', role: 'Mage', el: 'ICE', tint: '#9fe3ff', hp: 0.48, lvl: 8 },
    soldier: { kind: 'ant', team: 'ants', cls: 'tank', size: 0.86, at: [15.3, 18.9], face: [13.6, 20.2], open: 0.15, walk: 0.3, name: 'SOLDIER ANT', tint: '#ff4d6a', hp: 0.7, lvl: 10 },
    striker: { kind: 'ant', team: 'ants', cls: 'striker', at: [10.95, 23.55], face: [12.3, 21.9], open: 0.06, walk: 0.55, name: 'STRIKER ANT', tint: '#ff4d6a', hp: 0.45, lvl: 8 },
    scout:   { kind: 'ant', team: 'ants', cls: 'scout', at: [16.9, 22.6], face: [13.0, 19.5], walk: 0.2, name: 'SCOUT ANT', tint: '#ff4d6a', hp: 1, lvl: 7 },
    worker:  { kind: 'ant', team: 'ants', cls: 'worker', at: [11.9, 25.1], face: [11.5, 20.0], walk: 0.75, name: 'WORKER ANT', tint: '#ff4d6a', hp: 1, lvl: 6 },
  };
  if (o) for (const k of Object.keys(o)) { if (o[k] === null) delete U[k]; else U[k] = Object.assign(U[k] || {}, o[k]); }
  return U;
}
const SQUAD = ['player', 'ram', 'crab', 'star'], ANTS = ['soldier', 'striker', 'scout', 'worker'];
const SENTRY = [16, 21];

// the caption strip under the picture: the direction's number and name, its look and its way of fighting
function footer(g, W, H, F, S) {
  const x = S.n >= 10 ? 132 : 100; g.save(); g.fillStyle = '#0a1218'; g.fillRect(0, H, W, F); g.fillStyle = S.accent || '#31e8ff'; g.fillRect(0, H, W, 4);
  text(g, String(S.n), S.n >= 10 ? 62 : 46, H + 88, { font: font('title', S.n >= 10 ? 66 : 78), fill: S.accent || '#31e8ff', align: 'center' });
  text(g, S.title, x, H + 56, { font: font('title', 40), fill: '#ffffff' });
  if (S.tier) { const tw = textW(g, S.title, font('title', 40)); chip(g, S.tier, x + tw + 22, H + 22, { px: 17, fill: 'rgba(255,255,255,0.08)', stroke: 'rgba(255,255,255,0.3)', color: '#cfe3ee', font: font('ui', 16), h: 34 }); }
  text(g, 'LOOK', x, H + 92, { font: font('ui', 17), fill: '#7fd9ea' }); text(g, S.look, x + 64, H + 92, { font: font('ui', 19), fill: '#dcecf2' });
  text(g, 'FIGHT', x, H + 119, { font: font('ui', 17), fill: '#ffcf70' }); text(g, S.fight, x + 64, H + 119, { font: font('ui', 19), fill: '#f6e7c8' });
  g.restore();
}

// ── what the raid has in the air: the sentry's beam at the scout, the Rimestar's icicles at the striker, Stonepetal's stakes rising round it, the Jelly Ram's blow on the soldier ──
function raidFx(scene, ctx, o) {
  o = o || {}; const g = new T.Group(), U = ctx.units, out = { g }; scene.add(g);
  const sp = ctx.world.parts.props.sentry_chamber_1;
  if (sp && U.scout && o.beam !== false) { const m = sp.marks.muzzle || [0, 0.72, 0], a = [SENTRY[0] + m[0], m[1], SENTRY[1] + m[2]], b = [U.scout.at[0], 0.2, U.scout.at[1]]; g.add(boltBetween(a, b, o.beamHex || PAL.cyan, { jag: 0, r: 0.022, n: 2 })); g.add(glowBall(a, 0.1, o.beamHex || PAL.cyan)); g.add(burst(b, o.beamHex || PAL.cyan, 9, 0.3)); out.beam = [a, b]; }
  if (U.star && U.striker && o.ice !== false) { const a = [U.star.at[0], 0.62 + (U.star.lift || 0), U.star.at[1]], b = [U.striker.at[0], 0.28, U.striker.at[1]], d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = d.clone().normalize(), ice = new T.MeshStandardMaterial({ color: lin('#dff6ff'), emissive: lin('#7fd6ff'), emissiveIntensity: 0.9, roughness: 0.15, flatShading: true });
    for (let i = 0; i < 3; i++) { const t = 0.3 + i * 0.2, c = new T.Mesh(new T.ConeGeometry(0.05, 0.36, 5), o.iceMat || ice); c.position.set(a[0] + d.x * t + (i - 1) * 0.1 * n.z, a[1] + d.y * t + 0.05 * Math.sin(i * 2.1), a[2] + d.z * t - (i - 1) * 0.1 * n.x); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), n); c.castShadow = true; g.add(c);
      const tr = rodBetween([c.position.x - n.x * 0.75, c.position.y - n.y * 0.75, c.position.z - n.z * 0.75], [c.position.x - n.x * 0.2, c.position.y - n.y * 0.2, c.position.z - n.z * 0.2], 0.012, glowMat('#bfeaff', 1, { transparent: true, opacity: 0.6 }), 5); tr.userData.noInk = true; g.add(tr); } out.ice = [a, b]; }
  if (U.striker && o.stakes !== false) { const mat = o.stakeMat || new T.MeshStandardMaterial({ color: lin('#ff9ccc'), emissive: lin('#ff5fa8'), emissiveIntensity: 0.55, roughness: 0.2, flatShading: true }); for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + 0.4, h = 0.34 + (i % 3) * 0.1, c = new T.Mesh(new T.ConeGeometry(0.075, h, 5), mat); c.position.set(U.striker.at[0] + Math.cos(a) * 0.82, h / 2, U.striker.at[1] + Math.sin(a) * 0.82); c.rotation.set(Math.sin(a) * 0.22, 0, -Math.cos(a) * 0.22); c.castShadow = true; g.add(c); } }
  if (U.ram && U.soldier && o.hit !== false) { const k = 0.6, at = [U.ram.at[0] + (U.soldier.at[0] - U.ram.at[0]) * k, 0.5, U.ram.at[1] + (U.soldier.at[1] - U.ram.at[1]) * k]; g.add(burst(at, o.hitHex || '#eaffff', 12, 0.42, { w: 0.016 })); g.add(glowBall(at, 0.12, o.hitHex2 || '#2fe0c0', { op: 0.55 })); out.hit = at; }
  return out;
}
const TEAM = { squad: '#31e8ff', ants: '#ff3b5c' };
const reach = u => u.kind === 'ant' ? ({ tank: 0.78, striker: 0.66, scout: 0.56, worker: 0.52 })[u.cls] * (u.size || 1) : ({ ram: 0.62, crab: 0.66, star: 0.5, player: 0.5 })[u.key] || 0.55;
function teamRings(scene, ctx, o) { o = o || {}; for (const k of Object.keys(ctx.units)) { const u = ctx.units[k]; u.key = k; decalRing(scene, u.at, reach(u), o.w || 0.05, (o.col || TEAM)[u.team], o.op === undefined ? 0.9 : o.op); if (o.fill) decalDisc(scene, u.at, reach(u), (o.col || TEAM)[u.team], o.fill); } }
function wedge(at, ang, r, half, n) { const pts = [at]; for (let i = 0; i <= (n || 18); i++) { const t = ang - half + 2 * half * i / (n || 18); pts.push([at[0] + Math.cos(t) * r, at[1] + Math.sin(t) * r]); } return pts; }
const angTo = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
const along = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

// ── the HUD's shared pieces ──
function gem2d(g, x, y, s, fill, edge) { g.save(); g.translate(x, y); g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.55, -s * 0.15); g.lineTo(0, s); g.lineTo(-s * 0.55, -s * 0.15); g.closePath(); g.fillStyle = fill || '#3aa0ff'; g.fill(); g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.55, -s * 0.15); g.lineTo(0, s * 0.1); g.closePath(); g.fillStyle = 'rgba(255,255,255,0.45)'; g.fill(); if (edge) { g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.55, -s * 0.15); g.lineTo(0, s); g.lineTo(-s * 0.55, -s * 0.15); g.closePath(); g.lineWidth = 2.5; g.strokeStyle = edge; g.stroke(); } g.restore(); }
function crystalMeter(g, x, y, pct, o) { o = o || {}; const w = o.w || 330; panel(g, x, y, w, 74, { fill: o.fill || 'rgba(8,20,28,0.84)', stroke: o.stroke || 'rgba(49,232,255,0.55)', r: o.r });
  gem2d(g, x + 36, y + 37, 24, '#3aa0ff', o.ink); text(g, 'THE CRYSTAL', x + 68, y + 30, { font: o.font || font('chakra', 20), fill: o.color || '#bdf3ff' }); text(g, Math.round(pct * 100) + '%', x + w - 18, y + 30, { font: o.font || font('chakra', 20), fill: '#ffffff', align: 'right' });
  bar(g, x + 68, y + 42, w - 88, 14, pct, o.bar || '#31e8ff', { back: 'rgba(0,0,0,0.6)' }); if (o.sub) text(g, o.sub, x + 4, y + 98, { font: font('ui', 16), fill: o.subColor || 'rgba(230,245,250,0.85)', stroke: 'rgba(0,0,0,0.55)', sw: 4 }); }
function squadStrip(g, ctx, x, y, o) { o = o || {}; const cw = o.cw || 188, ch = o.ch || 78, gap = o.gap || 10; (o.keys || SQUAD).forEach((k, i) => { const u = ctx.units[k], cx = x + i * (cw + gap), act = o.active === k;
    panel(g, cx, y - (act ? 8 : 0), cw, ch, { fill: o.fill || 'rgba(8,20,28,0.86)', stroke: act ? '#ffffff' : (o.stroke || u.tint), lw: act ? 4 : 2, r: o.r }); squareBadge(g, ctx.portraits[k], cx + 8, y - (act ? 8 : 0) + 8, ch - 16, u.tint, { back: o.back || '#102630', r: o.br });
    text(g, u.name, cx + ch + 2, y - (act ? 8 : 0) + 28, { font: o.font || font('chakra', 17), fill: '#f2fbff' }); bar(g, cx + ch + 2, y - (act ? 8 : 0) + 38, cw - ch - 16, 10, u.hp, u.hp > 0.5 ? '#43e0a8' : u.hp > 0.3 ? '#f2b13a' : '#ff4d6a');
    if (o.line) text(g, o.line(k, u), cx + ch + 2, y - (act ? 8 : 0) + 68, { font: o.lineFont || font('ui', 13), fill: o.lineColor || u.tint }); }); }
function unitTag(g, ctx, key, o) { o = o || {}; const u = ctx.units[key], h = ctx.head(key, o.up === undefined ? 0.28 : o.up), w = o.w || 120; if (o.name !== false) text(g, o.label || u.name, h[0], h[1] - 12, { font: o.font || font('chakra', 16), fill: o.color || '#ffffff', align: 'center', stroke: 'rgba(4,10,14,0.85)', sw: 5 }); bar(g, h[0] - w / 2, h[1] - 4, w, o.h || 9, u.hp, o.bar || (u.team === 'ants' ? '#ff4d6a' : '#43e0a8'), { back: 'rgba(4,10,14,0.8)' }); return h; }
function countRing(g, x, y, r, frac, col, label, o) { o = o || {}; g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = o.back || 'rgba(8,16,22,0.9)'; g.fill(); g.lineWidth = r * 0.3; g.strokeStyle = 'rgba(255,255,255,0.16)'; g.stroke(); g.beginPath(); g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); g.strokeStyle = col; g.lineCap = 'round'; g.stroke(); g.restore(); if (label) text(g, label, x, y + 1, { font: o.font || font('chakra', r * 0.82), fill: '#ffffff', align: 'center', base: 'middle' }); }

// ═════════ 1 · CRYSTAL LAB 3D ═════════ the game's own look (docs/STYLE-CRYSTAL-LAB.md: flat cartoon colour, one bold ink line, neon seams) as a real 3D world;
// the fight SLOWED AND SIGNALLED: real time as now, at a slower pace, and every blow is shown on the floor before it lands
style('lab', {
  n: 1, title: 'CRYSTAL LAB 3D', tier: 'THE SAME GAME, CLEARER', accent: '#31e8ff',
  look: 'the game\'s own cartoon lab, flat colour and one bold ink line, as a real 3D world',
  fight: 'SLOWED AND SIGNALLED: real time at a slower pace; every blow marks the floor before it lands',
  exposure: 1.0, toneMapping: T.NoToneMapping, studio: false, shadowType: T.PCFShadowMap, room: { sentryAim: [16.9, 22.6] },
  palette() { const P = basePalette(); P.scorch = null; P.stain = null; return P; },
  env(scene) { scene.background = lin('#0d1d26'); },
  world(world, scene, ctx) { ctx.grad = GRAD([0.62, 0.84, 1.0]); toonify(world.g, ctx.grad); const c = world.parts.gemAt; scene.add(glowSprite(c, 1.5, '#6adfff', 0.5)); },
  cast(cast, scene, ctx) { toonify(cast.g, ctx.grad, { sat: 1.1 }); },
  fx(scene, ctx) { ctx.fx = raidFx(scene, ctx); },
  lights(scene, ctx) { scene.add(new T.HemisphereLight(lin('#ffffff'), lin('#9fb6c0'), 0.62)); keyLight(scene, '#ffffff', 0.62, [8, 14, 3], [13, 0, 19], 11); const c = ctx.world.parts.gemAt; pointLight(scene, '#6adfff', 0.5, c, 7); },
  decals(scene, ctx) { const U = ctx.units; teamRings(scene, ctx, { w: 0.045, op: 0.95 });
    const a = angTo(U.soldier.at, U.ram.at); decalPoly(scene, wedge(U.soldier.at, a, 2.15, 0.42), '#ff3b5c', 0.2); decalPoly(scene, wedge(U.soldier.at, a, 1.45, 0.42), '#ff3b5c', 0.42); decalLine(scene, wedge(U.soldier.at, a, 2.15, 0.42).concat([U.soldier.at]), 0.045, '#ff3b5c', 1);
    decalDashes(scene, [along(U.striker.at, U.crab.at, 0.3), along(U.striker.at, U.crab.at, 0.72)], 0.07, '#ff3b5c', 0.95, 0.16, 0.1); decalArrow(scene, along(U.striker.at, U.crab.at, 0.6), along(U.striker.at, U.crab.at, 0.78), 0.07, '#ff3b5c', 0.95);
    decalArrow(scene, along(U.ram.at, U.soldier.at, 0.32), along(U.ram.at, U.soldier.at, 0.58), 0.08, '#31e8ff', 0.95); },
  camera: (W, H) => persp(W, H, 22, [13.25, 0.35, 20.3], 45, 33, 23),
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [new InkPass(scene, cam, W, H, { ink: '#16303a', thick: 1.7, depth: 0.02 })]),
  overlay(g, ctx) { const U = ctx.units;
    crystalMeter(g, 28, 26, 0.87, { sub: 'RAID · WAVE 2 OF 3' });
    chip(g, 'FIGHT SPEED  ×0.6', ctx.W / 2, 30, { align: 'center', px: 24, fill: 'rgba(8,20,28,0.86)', stroke: '#31e8ff', color: '#dffbff' });
    for (const k of ['striker', 'scout']) unitTag(g, ctx, k, { name: false, w: 96 });
    const hs = unitTag(g, ctx, 'soldier', { name: false, w: 130, up: 0.3 }), bx = hs[0] + 96, by = hs[1] - 96; leader(g, [hs[0] + 30, hs[1] - 14], [bx + 20, by + 56], '#ff6b84', 3);
    panel(g, bx, by, 252, 58, { fill: 'rgba(60,8,20,0.92)', stroke: '#ff6b84', r: 12 }); countRing(g, bx + 32, by + 29, 20, 0.7, '#ff6b84', '0.6'); text(g, 'BITE', bx + 64, by + 26, { font: font('title', 22), fill: '#ffe1e6' }); text(g, 'on JELLY RAM', bx + 64, by + 47, { font: font('ui', 15), fill: '#ffb3c0' });
    const hk = ctx.head('striker', 0.5); chip(g, 'LUNGE  1.4 s', hk[0], hk[1] - 44, { align: 'center', px: 17, fill: 'rgba(60,8,20,0.9)', stroke: '#ff6b84', color: '#ffd5dc' });
    const hit = ctx.project(ctx.fx.hit[0], ctx.fx.hit[1] + 0.75, ctx.fx.hit[2]); bigNumber(g, '42', hit[0] - 30, hit[1] - 6, 92, '#eaffff', '#16303a', 'title', -0.08);
    squadStrip(g, ctx, 28, ctx.H - 104, { cw: 232, line: k => ({ player: 'GUARD · ready', ram: 'WOBBLE SLAM · landing', crab: 'STAKE RING · 0.9 s', star: 'ICICLE VOLLEY · flying' })[k] });
  },
});

// a unit as it will be a moment from now: a see-through copy in its team's colour, standing at `at` (o: changes to the unit, such as an ant's jaws shut)
function ghostUnit(ctx, scene, key, at, o) { const u = Object.assign({}, ctx.units[key], o || {}, { at }); if (!u.face || (u.face[0] === at[0] && u.face[1] === at[1])) u.face = [at[0] + 1, at[1]];
  const c = buildCast(ctx.P, { g: u }); remat(c.g, () => new T.MeshBasicMaterial({ color: lin(TEAM[u.team]), transparent: true, opacity: (o && o.op) || 0.2, depthWrite: false, toneMapped: false })); c.g.traverse(q => { q.userData.noInk = true; q.castShadow = false; q.receiveShadow = false; }); scene.add(c.g); return c.g; }
const woodTexture = () => canvasTex(512, 512, (g, w, h) => { g.fillStyle = '#5b3d26'; g.fillRect(0, 0, w, h); for (let i = 0; i < 260; i++) { const y = (i * 61) % h, a = 0.04 + (i % 7) * 0.012; g.strokeStyle = i % 3 ? `rgba(30,16,8,${a})` : `rgba(190,140,90,${a})`; g.lineWidth = 1 + (i % 4); g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin((x + i * 13) / 70) * 5); g.stroke(); } for (let x = 128; x < w; x += 128) { g.fillStyle = 'rgba(20,10,5,0.35)'; g.fillRect(x, 0, 2, h); } }, { repeat: true });
// the room as a model on a base: a slab under the whole footprint with a little plate on its near sides, standing on a table
function dioramaBase(scene, o) { o = o || {}; const x0 = 7.3, x1 = 19.5, z0 = 11.3, z1 = 26.5, th = o.th || 0.55, y1 = -0.122, g = new T.Group();
  const slab = new T.Mesh(new T.BoxGeometry(x1 - x0, th, z1 - z0), [o.side, o.side, o.top, o.side, o.side, o.side]); slab.position.set((x0 + x1) / 2, y1 - th / 2, (z0 + z1) / 2); slab.castShadow = true; slab.receiveShadow = true; g.add(slab);
  if (o.plate) { const tex = canvasTex(512, 96, (c, w, h) => { c.fillStyle = o.plate[0]; c.fillRect(0, 0, w, h); c.strokeStyle = o.plate[1]; c.lineWidth = 5; c.strokeRect(7, 7, w - 14, h - 14); c.fillStyle = o.plate[1]; c.font = '900 46px "DejaVu Sans", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.plate[2] || 'CRYSTAL CHAMBER', w / 2, h / 2 + 3); });
    const pm = new T.MeshStandardMaterial({ map: tex, metalness: 0.75, roughness: 0.3 }), p1 = new T.Mesh(new T.PlaneGeometry(2.6, 0.3), pm); p1.position.set(x1 + 0.006, y1 - th / 2, 19.6); p1.rotation.y = Math.PI / 2; g.add(p1); }
  if (o.table) { const t = new T.Mesh(new T.PlaneGeometry(160, 160), o.table); t.rotation.x = -Math.PI / 2; t.position.set(14, y1 - th, 20); t.receiveShadow = true; g.add(t); }
  scene.add(g); return g; }

// ═════════ 2 · THE LIVING DIORAMA ═════════ every room a little model on a table: soft light, soft shadows, a tilt-shift blur;
// the fight in STOP-AND-GO TIME: time runs only while you move. Stand still and the world holds, and shows where everyone will be when you arrive
style('diorama', {
  n: 2, title: 'THE LIVING DIORAMA', tier: 'THE SAME GAME, CLEARER', accent: '#ffd08a',
  look: 'every room a little model on a table: soft light, soft shadows, a tilt-shift blur',
  fight: 'TIME MOVES WHEN YOU MOVE: stand still and the fight holds, and shows what happens next',
  exposure: 1.05, room: { sentryAim: [16.9, 22.6] },
  palette() { const P = basePalette(); P.ground = null; P.outside = null; return P; },
  env(scene) { scene.background = lin('#120c08'); scene.fog = new T.Fog(lin('#120c08'), 46, 90); },
  world(world, scene, ctx) { const wood = woodTexture(); wood.repeat.set(9, 9); dioramaBase(scene, { top: std('#16262e', { roughness: 0.8 }), side: std('#20262c', { roughness: 0.5, metalness: 0.3 }), plate: ['#c9a25a', '#3a2a10'], table: new T.MeshStandardMaterial({ map: wood, roughness: 0.55, metalness: 0.05 }) }); },
  fx(scene, ctx) { ctx.fx = raidFx(scene, ctx); const U = ctx.units;
    ctx.dest = [14.6, 17.3]; ghostUnit(ctx, scene, 'player', ctx.dest, { face: U.soldier.at, op: 0.26 });
    ghostUnit(ctx, scene, 'soldier', along(U.soldier.at, U.ram.at, 0.26), { open: 0.0, face: U.ram.at, op: 0.24 }); ghostUnit(ctx, scene, 'striker', along(U.striker.at, U.crab.at, 0.36), { face: U.crab.at, walk: 0.9 }); ghostUnit(ctx, scene, 'scout', along(U.scout.at, U.scout.face, 0.2), { walk: 0.7 }); ghostUnit(ctx, scene, 'worker', along(U.worker.at, U.worker.face, 0.2), { walk: 0.2 }); },
  lights(scene, ctx) { scene.add(new T.HemisphereLight(lin('#ffe9d2'), lin('#3a4650'), 0.5)); const k = keyLight(scene, '#ffe2bd', 1.75, [9, 17, 6], [14, 0, 19.5], 14, 5); k.shadow.mapSize.set(4096, 4096); fillLight(scene, '#9fc4ff', 0.3, [30, 8, 34]); pointLight(scene, '#6adfff', 1.4, ctx.world.parts.gemAt, 8); },
  decals(scene, ctx) { const U = ctx.units, a = U.player.at, b = ctx.dest; decalDashes(scene, [along(a, b, 0.2), along(a, b, 0.86)], 0.07, '#31e8ff', 0.95, 0.14, 0.1); decalRing(scene, b, 0.5, 0.06, '#31e8ff', 0.95); decalDisc(scene, b, 0.5, '#31e8ff', 0.14);
    for (const k of ANTS) decalRing(scene, U[k].at, reach(Object.assign(U[k], { key: k })), 0.04, '#ff3b5c', 0.8); },
  camera: (W, H) => persp(W, H, 17, [13.75, -0.2, 19.35], 41, 37, 39),
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [bloom(W, H, 0.22, 0.6, 0.9), shader(T.HorizontalTiltShiftShader, { h: 2.3 / W, r: 0.55 }), shader(T.VerticalTiltShiftShader, { v: 2.3 / H, r: 0.55 })], { after: [shader(VIGNETTE, { amount: 0.55, colour: new T.Color(0x0a0604) })] }),
  overlay(g, ctx) { const U = ctx.units, W = ctx.W, H = ctx.H;
    crystalMeter(g, 28, 26, 0.87, { stroke: 'rgba(255,208,138,0.6)', sub: 'RAID · WAVE 2 OF 3' });
    panel(g, W / 2 - 250, 22, 500, 84, { fill: 'rgba(20,12,6,0.9)', stroke: '#ffd08a' }); text(g, '❚❚  TIME IS STOPPED', W / 2, 62, { font: font('title', 32), fill: '#fff1d6', align: 'center' }); text(g, 'it runs only while you move', W / 2, 90, { font: font('ui', 17), fill: '#ffd08a', align: 'center' });
    const d = ctx.project(ctx.dest[0], 1.25, ctx.dest[1]); chip(g, 'MOVE HERE  ·  0.8 s', d[0], d[1] - 20, { align: 'center', px: 20, fill: 'rgba(6,30,36,0.92)', stroke: '#31e8ff', color: '#dffbff' });
    const sg = along(U.soldier.at, U.ram.at, 0.26), s = ctx.project(sg[0], 0.9, sg[1]); leader(g, [s[0] + 24, s[1] + 4], [s[0] + 170, s[1] + 42], '#ff6b84', 3); panel(g, s[0] + 170, s[1] + 14, 344, 62, { fill: 'rgba(60,8,20,0.92)', stroke: '#ff6b84', r: 12 }); text(g, 'BITE lands at 0.6 s', s[0] + 188, s[1] + 42, { font: font('title', 21), fill: '#ffe1e6' }); text(g, 'before you get there: 38 to the Jelly Ram', s[0] + 188, s[1] + 64, { font: font('ui', 14), fill: '#ffb3c0' });
    // the next two seconds, as a bar you drag
    const bx = W / 2 - 430, by = H - 150, bw = 860; panel(g, bx - 26, by - 44, bw + 52, 104, { fill: 'rgba(20,12,6,0.9)', stroke: 'rgba(255,208,138,0.7)' }); text(g, 'NOW', bx, by - 14, { font: font('ui', 15), fill: '#ffd08a' }); text(g, '+2.0 s', bx + bw, by - 14, { font: font('ui', 15), fill: '#ffd08a', align: 'right' });
    g.fillStyle = 'rgba(255,255,255,0.14)'; rrect(g, bx, by, bw, 12, 6); g.fill(); g.fillStyle = '#31e8ff'; rrect(g, bx, by, bw * 0.4, 12, 6); g.fill();
    for (const [t, lab, col] of [[0.15, 'ICICLES hit', '#9fe3ff'], [0.3, 'BITE', '#ff6b84'], [0.45, 'STAKE RING', '#ff8cc6'], [0.7, 'LUNGE', '#ff6b84']]) { const x = bx + bw * t; g.fillStyle = col; g.fillRect(x - 2, by - 8, 4, 28); text(g, lab, x, by + 42, { font: font('ui', 15), fill: col, align: 'center' }); }
    const hx = bx + bw * 0.4; g.beginPath(); g.arc(hx, by + 6, 17, 0, 7); g.fillStyle = '#eaffff'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#31e8ff'; g.stroke(); text(g, '0.8 s', hx, by - 18, { font: font('title', 20), fill: '#eaffff', align: 'center' });
  },
});

// ═════════ 3 · CRYSTAL NOIR ═════════ the facility in its blackout: the Crystal is the light, the floor is dark glass, the doors burn red;
// the fight by THE CRYSTAL'S BEAM: nobody acts until the Crystal's light reaches them. You draw the beam to a follower and it acts; the ants strike on a count you can see
style('noir', {
  n: 3, title: 'CRYSTAL NOIR', tier: 'ONE ACTION AT A TIME', accent: '#6adfff',
  look: 'the blackout as a look: the Crystal is the only light, the floor mirrors it, the doors burn red',
  fight: 'THE CRYSTAL\'S BEAM: draw its light to a follower and that one acts; the ants strike on a count',
  exposure: 1.2, room: { sentryAim: [16.9, 22.6] },
  palette() { const P = basePalette(); P.ground = null; P.floor = new T.MeshStandardMaterial({ map: floorTexture({ a: '#31474f', line: 'rgba(120,220,240,0.22)', shine: 'rgba(255,255,255,0.05)' }), roughness: 0.68, metalness: 0.1 });   // (matt itself: its shine is the mirror laid over it; a glossy floor makes one hard streak of glare towards the Crystal) P.floorSide = std('#16242a'); P.outside = std('#0c1418', { roughness: 0.5 });
    P.wallFace = new T.MeshStandardMaterial({ map: wallTexture({ body: '#7f98a2', base: '#2b6d78' }), roughness: 0.6 }); P.wallCap = std('#93aab3'); P.cutFace = std('#3c5560'); P.cutTop = std('#0a1a20'); P.lampOpen = glowMat('#ff3b4a', 1); P.scorch = null; P.stain = null; P.crystalLight = null; return P; },
  env(scene) { scene.background = lin('#010306'); scene.fog = new T.FogExp2(lin('#010409'), 0.028); },
  world(world, scene, ctx) { const pa = world.parts; for (const q of pa.tank.concat([pa.liquid, pa.gem])) q.traverse(o => { o.castShadow = false; }); scene.add(mirrorFloor(CH.poly, { strength: 0.42, tint: '#bfe6ff' }));
    const shaft = lightShaft([CRYSTAL[0], 0.4, CRYSTAL[1]], 0.55, 2.1, 7, '#6adfff', 0.2); shaft.layers.set(1); scene.add(shaft); scene.add(glowSprite(pa.gemAt, 2.0, '#6adfff', 0.55)); },   // (layer 1: the camera sees the shaft, the floor's mirror does not)
  fx(scene, ctx) { ctx.fx = raidFx(scene, ctx, { ice: false, stakes: false }); const U = ctx.units, a = ctx.world.parts.gemAt, b = [U.ram.at[0], 1.0, U.ram.at[1]], mid = [(a[0] + b[0]) / 2, 2.5, (a[2] + b[2]) / 2];
    const curve = new T.QuadraticBezierCurve3(new T.Vector3(a[0], a[1], a[2]), new T.Vector3(mid[0], mid[1], mid[2]), new T.Vector3(b[0], b[1], b[2])); const core = new T.Mesh(new T.TubeGeometry(curve, 48, 0.035, 8), glowMat('#ffffff', 1)), halo = new T.Mesh(new T.TubeGeometry(curve, 48, 0.11, 8), glowMat('#6adfff', 1, { transparent: true, opacity: 0.4, depthWrite: false })); for (const q of [core, halo]) { q.layers.set(1); scene.add(q); }
    const gs = glowSprite(b, 0.9, '#9ff3ff', 0.3); gs.layers.set(1); scene.add(gs); ctx.beamMid = mid; },
  lights(scene, ctx) { const U = ctx.units, c = ctx.world.parts.gemAt; scene.add(new T.HemisphereLight(lin('#7fa6c8'), lin('#05080a'), 0.1));
    const cl = pointLight(scene, '#6adfff', 3.0, c, 17, 1.6); cl.castShadow = true; cl.shadow.mapSize.set(1024, 1024); cl.shadow.bias = -0.004; cl.shadow.camera.near = 0.3; cl.shadow.camera.far = 20;
    for (const d of DOORS) pointLight(scene, '#ff2a3a', 2.2, [d.mid[0] + d.n[0] * 0.2, 0.7, d.mid[1] + d.n[1] * 0.2], 6.5, 1.5);
    const sp = new T.SpotLight(lin('#dffcff'), 0.9, 9, 0.5, 0.6, 1.2); sp.position.set(U.ram.at[0] - 0.6, 4.2, U.ram.at[1] - 0.6); sp.target.position.set(U.ram.at[0], 0.5, U.ram.at[1]); scene.add(sp); scene.add(sp.target); fillLight(scene, '#ff3040', 0.3, [34, 5, 30]); fillLight(scene, '#ff3040', 0.16, [14, 5, 40]); },
  decals(scene, ctx) { const U = ctx.units; decalRing(scene, U.ram.at, 0.72, 0.06, '#9ff3ff', 0.95); for (const k of ANTS) decalRing(scene, U[k].at, reach(Object.assign(U[k], { key: k })), 0.04, '#ff3b4a', 0.85); },
  camera: (W, H) => { const c = persp(W, H, 33, [13.0, 0.75, 20.0], 52, 21, 13.6); c.layers.enable(1); return c; },
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [bloom(W, H, 0.55, 0.65, 0.7)], { after: [shader(VIGNETTE, { amount: 0.5 })] }),
  overlay(g, ctx) { const U = ctx.units, W = ctx.W, H = ctx.H;
    crystalMeter(g, 28, 26, 0.87, { fill: 'rgba(2,8,12,0.8)', sub: 'RAID · WAVE 2 OF 3' });
    // the ants' count
    panel(g, W - 300, 26, 272, 96, { fill: 'rgba(30,4,8,0.86)', stroke: '#ff4d5e' }); countRing(g, W - 250, 74, 30, 0.62, '#ff4d5e', '3', { font: font('title', 30) }); text(g, 'THE ANTS', W - 204, 66, { font: font('chakra', 21), fill: '#ffd0d5' }); text(g, 'STRIKE IN 3', W - 204, 94, { font: font('title', 24), fill: '#ffffff' });
    // the beam's charges, and how it is used
    const bx = W / 2 - 330, by = H - 128; panel(g, bx, by, 660, 100, { fill: 'rgba(2,8,12,0.84)', stroke: 'rgba(106,223,255,0.7)' }); text(g, 'THE BEAM', bx + 26, by + 40, { font: font('title', 26), fill: '#dffbff' });
    for (let i = 0; i < 4; i++) gem2d(g, bx + 212 + i * 46, by + 34, 20, i < 2 ? '#3aa0ff' : 'rgba(255,255,255,0.14)', i < 2 ? '#bff3ff' : 'rgba(255,255,255,0.25)');
    text(g, 'a new charge every 2 s', bx + 400, by + 40, { font: font('ui', 16), fill: '#8fd8ea' }); text(g, 'Draw the Crystal\'s light to a follower: that one acts. Nobody else moves.', bx + 26, by + 78, { font: font('ui', 17), fill: '#eaffff' });
    // the drag, drawn from the Crystal to the Jelly Ram
    const hr = ctx.head('ram', 0.75); text(g, 'JELLY RAM ACTS', hr[0], hr[1] - 6, { font: font('chakra', 24), fill: '#eaffff', align: 'center', stroke: 'rgba(2,8,12,0.9)', sw: 6 });
    const hit = ctx.project(ctx.fx.hit[0], ctx.fx.hit[1] + 0.8, ctx.fx.hit[2]); bigNumber(g, '42', hit[0] + 96, hit[1] + 6, 100, '#eaffff', '#04222c', 'title', 0.06);
    for (const k of ANTS) unitTag(g, ctx, k, { name: false, w: 90, bar: '#ff4d5e' });
  },
});

// ═════════ 4 · INK AND SPOT COLOUR ═════════ a comic: black ink and screen tone, and colour only where it matters (your squad, the creatures, the Crystal);
// the fight PANEL BY PANEL: the fight is cut into exchanges, one blow each, played one after another, each one its own panel; you cut in between panels
style('comic', {
  n: 4, title: 'INK AND SPOT COLOUR', tier: 'ONE ACTION AT A TIME', accent: '#ffd21f',
  look: 'a comic: black ink and screen tone; colour only on the squad, the creatures and the Crystal',
  fight: 'PANEL BY PANEL: one blow at a time, each in its own panel; you cut in between panels',
  exposure: 1.0, toneMapping: T.NoToneMapping, studio: false, shadowType: T.PCFShadowMap, room: { sentryAim: [16.9, 22.6] },
  palette() { const P = basePalette(); P.scorch = null; P.stain = null; P.hazardFloor = 0.12; return P; },
  env(scene) { scene.background = lin('#f6f1e4'); },
  world(world, scene, ctx) { ctx.grad = GRAD([0.6, 0.8, 1.0]); toonify(world.g, ctx.grad); world.parts.rig.userData.spot = true; world.parts.ground.material = new T.MeshBasicMaterial({ color: 0x101216 }); },
  cast(cast, scene, ctx) { toonify(cast.g, GRAD([0.55, 1.0]), { sat: 1.25 }); cast.g.userData.spot = true; },
  fx(scene, ctx) { ctx.fx = raidFx(scene, ctx); ctx.fx.g.userData.spot = true; },
  lights(scene, ctx) { scene.add(new T.HemisphereLight(lin('#ffffff'), lin('#6a6a6a'), 0.5)); keyLight(scene, '#ffffff', 0.85, [9, 13, 2], [13, 0, 19], 11); },
  decals(scene, ctx) { const U = ctx.units, g = new T.Group(); g.userData.spot = true; scene.add(g); for (const k of Object.keys(U)) { U[k].key = k; decalRing(g, U[k].at, reach(U[k]), 0.06, TEAM[U[k].team], 1); } },
  camera: (W, H) => persp(W, H, 24, [14.75, 0.3, 20.1], 45, 34, 22),
  compose: (renderer, scene, cam, W, H) => { const mask = new SpotMaskPass(scene, cam, W, H); return composer(renderer, scene, cam, W, H, [mask, new InkPass(scene, cam, W, H, { ink: '#0d0f14', thick: 2.0, depth: 0.02 })], { after: [shader(HALFTONE, { res: new T.Vector2(W, H), size: 6.5, tMask: mask.rt.texture })] }); },
  late(ctx) { const U = ctx.units, W = ctx.W, H = ctx.H; ctx.panelA = ctx.shoot(persp(W, H, 30, [14.5, 0.55, 19.5], 12, 13, 5.2)); ctx.panelB = ctx.shoot(persp(W, H, 30, [11.65, 0.5, 22.75], 118, 15, 4.6)); },
  overlay(g, ctx) { const U = ctx.units, W = ctx.W, H = ctx.H, INK = '#0d0f14', PAPER = '#f6f1e4';
    const comicBox = (x, y, w, h, fill) => { g.fillStyle = INK; g.fillRect(x + 6, y + 6, w, h); g.fillStyle = fill || PAPER; g.fillRect(x, y, w, h); g.lineWidth = 4; g.strokeStyle = INK; g.strokeRect(x, y, w, h); };
    const inset = (img, x, y, w, h, rot, sx, sy, sw, next) => { g.save(); g.translate(x + w / 2, y + h / 2); g.rotate(rot); g.fillStyle = INK; g.fillRect(-w / 2 + 9, -h / 2 + 9, w, h); g.fillStyle = PAPER; g.fillRect(-w / 2 - 9, -h / 2 - 9, w + 18, h + 18); g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w, h); g.clip(); g.drawImage(img, sx, sy, sw, sw * h / w, -w / 2, -h / 2, w, h); if (next) { g.fillStyle = 'rgba(246,241,228,0.5)'; g.fillRect(-w / 2, -h / 2, w, h); } g.restore(); g.lineWidth = 6; g.strokeStyle = INK; if (next) g.setLineDash([18, 10]); g.strokeRect(-w / 2, -h / 2, w, h); g.restore(); };
    const cap = (s, x, y, o) => { o = o || {}; const f = font('bang', o.px || 26), w = textW(g, s, f) + 28; comicBox(x, y, w, (o.px || 26) + 16, o.fill || '#ffe66b'); text(g, s, x + 14, y + (o.px || 26) + 3, { font: f, fill: INK }); return w; };
    // the page: the wide panel is the picture; two panels over its right side: THIS blow, and the NEXT one
    inset(ctx.panelA, W - 560, 34, 520, 400, -0.018, 180, 150, 1240, false); inset(ctx.panelB, W - 500, 478, 440, 330, 0.02, 200, 180, 1200, true);
    cap('3 · THE JELLY RAM HITS FIRST', W - 572, 22); g.save(); g.translate(W - 190, 150); g.rotate(-0.14); text(g, 'KRAK!', 0, 0, { font: font('bang', 96), fill: '#ffd21f', stroke: INK, sw: 14, align: 'center' }); g.restore(); bigNumber(g, '42', W - 130, 392, 84, '#ffffff', INK, 'title', 0.05);
    cap('4 · NEXT: THE STRIKER LUNGES', W - 512, 466, { fill: '#ffffff' });
    // the head of the page, and the strip of this exchange's panels along its foot
    comicBox(28, 26, 318, 70); gem2d(g, 62, 61, 24, '#3aa0ff', INK); text(g, 'THE CRYSTAL', 94, 56, { font: font('bang', 28), fill: INK }); g.fillStyle = INK; g.fillRect(94, 66, 232, 16); g.fillStyle = '#31e8ff'; g.fillRect(97, 69, 226 * 0.87, 10);
    const order = [['sentry', 'scout', 1], ['star', 'striker', 1], ['ram', 'soldier', 2], ['soldier', 'ram', 0], ['crab', 'striker', 0], ['striker', 'crab', 0]], bx = 28, by = H - 132, bw = 150;
    cap('THIS EXCHANGE', bx, by - 50, { fill: '#ffffff', px: 24 });
    order.forEach(([a, b, st], i) => { const x = bx + i * (bw + 14); comicBox(x, by, bw, 100, st === 2 ? '#ffe66b' : st === 1 ? '#d9d5c8' : PAPER); text(g, String(i + 1), x + 12, by + 34, { font: font('bang', 32), fill: INK });
      const pa = a === 'sentry' ? null : ctx.portraits[a]; if (pa) g.drawImage(pa, x + 34, by + 22, 54, 54); else { g.fillStyle = INK; g.fillRect(x + 52, by + 34, 18, 34); g.fillStyle = '#31e8ff'; g.fillRect(x + 56, by + 26, 10, 10); } text(g, '▸', x + 91, by + 60, { font: font('ui', 24), fill: INK }); g.drawImage(ctx.portraits[b], x + 104, by + 30, 42, 42);
      text(g, st === 1 ? 'DONE' : st === 2 ? 'NOW' : 'NEXT', x + bw / 2, by + 92, { font: font('bang', 20), fill: st === 0 ? '#8a8578' : INK, align: 'center' }); });
    const cx = bx + 6 * (bw + 14) + 10; comicBox(cx, by + 14, 208, 72, '#31e8ff'); text(g, 'CUT IN', cx + 104, by + 64, { font: font('bang', 44), fill: INK, align: 'center' });
  },
});

// ═════════ 5 · PIXEL SQUAD ═════════ the squad and the creatures as crisp pixel sprites standing in a lit 3D lab with depth of field (2.5D);
// the fight on ACTIVE TIME: every unit has a gauge; when it fills, the world waits while that one makes its move, then time goes on
style('pixel', {
  n: 5, title: 'PIXEL SQUAD', tier: 'ONE ACTION AT A TIME', accent: '#ffe066',
  look: '2.5D: the squad and the creatures as crisp pixel sprites, standing in a lit 3D lab',
  fight: 'ACTIVE TIME: every unit\'s gauge fills; when one is full the world waits for its move',
  exposure: 1.0, room: { sentryAim: [16.9, 22.6] },
  palette() { const P = basePalette(); P.scorch = null; P.stain = null; return P; },
  env(scene) { scene.background = lin('#060b10'); scene.fog = new T.Fog(lin('#060b10'), 30, 60); },
  fx(scene, ctx) { ctx.fx = raidFx(scene, ctx, { hit: false }); },
  lights(scene, ctx) { scene.add(new T.HemisphereLight(lin('#dcefff'), lin('#55707c'), 0.62)); keyLight(scene, '#fff1dc', 1.2, [8, 14, 3], [13, 0, 19], 11, 3); fillLight(scene, '#9fc4ff', 0.3, [26, 8, 30]); pointLight(scene, '#6adfff', 1.5, ctx.world.parts.gemAt, 8); },
  decals(scene, ctx) { const U = ctx.units, fill = { player: 0.35, ram: 0.8, crab: 1, star: 0.55, soldier: 0.9, striker: 0.6, scout: 0.3, worker: 0.15 };
    for (const k of Object.keys(U)) { U[k].key = k; const r = reach(U[k]) + 0.06; decalRing(scene, U[k].at, r, 0.12, '#0b1620', 0.75); decalRing(scene, U[k].at, r, 0.085, k === 'crab' ? '#ffffff' : TEAM[U[k].team], 1, 0, fill[k]); } ctx.fill = fill; },
  camera: (W, H) => persp(W, H, 23, [13.2, 0.45, 20.3], 45, 31, 22.5),
  late(ctx) { for (const k of Object.keys(ctx.cast.parts)) pixelSprite(ctx.cast.parts[k], ctx.scene, ctx.renderer, ctx.cam, { px: 46, levels: 7, outline: [16, 34, 44] }); },
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [new T.BokehPass(scene, cam, { focus: 22.5, aperture: 0.00055, maxblur: 0.008, width: W, height: H }), bloom(W, H, 0.22, 0.5, 0.92)], { after: [shader(VIGNETTE, { amount: 0.35 })] }),
  overlay(g, ctx) { const U = ctx.units, W = ctx.W, H = ctx.H, PXF = k => font('pixel', k);
    const box = (x, y, w, h, o) => { o = o || {}; g.fillStyle = '#0b1620'; g.fillRect(x - 4, y - 4, w + 8, h + 8); g.fillStyle = o.edge || '#eaf6ff'; g.fillRect(x - 2, y - 2, w + 4, h + 4); g.fillStyle = o.fill || '#122838'; g.fillRect(x, y, w, h); };
    box(28, 28, 320, 66); gem2d(g, 62, 61, 22, '#3aa0ff'); text(g, 'THE CRYSTAL', 92, 54, { font: PXF(22), fill: '#bdf3ff' }); g.fillStyle = '#0b1620'; g.fillRect(92, 64, 240, 16); g.fillStyle = '#31e8ff'; g.fillRect(94, 66, 236 * 0.87, 12);
    // the active-time track: everyone slides right as their gauge fills; at ACT the world waits for that one
    const tx = W / 2 - 330, ty = 40, tw = 660; box(tx - 16, ty - 14, tw + 120, 78); text(g, 'ACTIVE TIME', tx - 4, ty + 60, { font: PXF(16), fill: '#8fd8ea' }); g.fillStyle = '#0b1620'; g.fillRect(tx, ty + 26, tw, 10); g.fillStyle = '#ffe066'; g.fillRect(tx + tw, ty - 4, 6, 62); text(g, 'ACT', tx + tw + 52, ty + 38, { font: PXF(24), fill: '#ffe066', align: 'center' });
    const order = Object.keys(ctx.fill).sort((a, b) => ctx.fill[a] - ctx.fill[b]); order.forEach((k, i) => { const x = tx + tw * ctx.fill[k] - (k === 'crab' ? 0 : 6), s = k === 'crab' ? 54 : 40, y = ty + 31 - s / 2 + (i % 2 ? 9 : -9) * (k === 'crab' ? 0 : 1); g.fillStyle = k === 'crab' ? '#ffffff' : TEAM[U[k].team]; g.fillRect(x - s / 2 - 3, y - 3, s + 6, s + 6); g.fillStyle = '#0d1a22'; g.fillRect(x - s / 2, y, s, s); g.imageSmoothingEnabled = false; g.drawImage(ctx.portraits[k], 0, 0, 256, 256, x - s / 2, y, s, s); g.imageSmoothingEnabled = true; });
    // whose move it is, and what it may do
    const h0 = ctx.head('crab', 0.1), h = [h0[0] - 250, h0[1] + 250]; box(h[0] - 190, h[1] - 150, 380, 124, { edge: '#ffffff' }); text(g, 'STONEPETAL: YOUR MOVE', h[0] - 172, h[1] - 118, { font: PXF(22), fill: '#ffffff' });
    [['STAKE RING', '#ff8cc6', true], ['REEF', '#9fe3ff', false], ['GUARD', '#eaf6ff', false]].forEach(([n, c, on], i) => { const x = h[0] - 172 + i * 118, y = h[1] - 102; g.fillStyle = on ? c : '#0b1620'; g.fillRect(x, y, 110, 40); if (!on) { g.strokeStyle = c; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, 108, 38); } text(g, n, x + 55, y + 27, { font: PXF(n.length > 6 ? 16 : 19), fill: on ? '#0b1620' : c, align: 'center' }); });
    text(g, 'the world waits · plays by itself in 2 s', h[0] - 172, h[1] - 40, { font: PXF(15), fill: '#ffe066' }); leader(g, [h[0] + 120, h[1] - 150], [h0[0] - 40, h0[1] + 80], '#ffffff', 4);
    for (const k of ANTS) unitTag(g, ctx, k, { name: false, w: 88, h: 10 });
    squadStrip(g, ctx, 28, H - 100, { cw: 214, ch: 72, font: PXF(18), r: 2, br: 2, active: 'crab', line: (k) => Math.round(ctx.fill[k] * 100) + '% gauge', lineFont: PXF(14) });
  },
});

// ═════════ 6 · THIRD PERSON ═════════ the camera comes down into the room, behind your cube: the facility at eye level, in full 3D;
// the fight by LOCK ON: you face one creature at a time, its move is announced, and you answer it: guard, dive or strike; the squad holds the others
style('third', {
  n: 6, title: 'THIRD PERSON', tier: 'A NEW POINT OF VIEW', accent: '#7ff7c9',
  look: 'full 3D at eye level: the camera behind your cube, the room standing tall around you',
  fight: 'LOCK ON: face one creature at a time; its move is announced, you answer it; the squad holds the rest',
  exposure: 1.05, room: { sentryAim: [13.15, 20.55], upper: 1.7 },
  units: () => RAID({ player: { at: [14.6, 22.4], face: [13.2, 20.6] }, soldier: { at: [13.15, 20.55], face: [14.6, 22.4], open: 0.17 }, ram: { at: [11.6, 20.6], face: [10.7, 21.8] }, striker: { at: [10.6, 21.95], face: [11.6, 20.6] },
    crab: { at: [15.3, 18.3], face: [16.2, 17.2] }, scout: { at: [16.25, 17.1], face: [15.3, 18.3], open: 0.08 }, star: { at: [13.3, 17.9], face: [12.9, 16.9] }, worker: { at: [13.1, 16.95], face: [11.5, 15.5], open: 0.1 } }),
  palette() { const P = basePalette(); P.wallUpper = std('#5d7f8a', { roughness: 0.75 }); P.scorch = null; P.stain = null; P.ground = std('#0a1216'); return P; },
  env(scene) { scene.background = lin('#070d11'); scene.fog = new T.Fog(lin('#0b1820'), 9, 24); },
  fx(scene, ctx) { const U = ctx.units, g = new T.Group(); scene.add(g); const a = [U.star.at[0], 0.85, U.star.at[1]], b = [U.worker.at[0], 0.25, U.worker.at[1]]; g.add(boltBetween(a, b, '#9fe3ff', { jag: 0.02, r: 0.014, n: 3 })); g.add(burst(b, '#dff6ff', 8, 0.25));
    const k = 0.55, hit = [U.ram.at[0] + (U.striker.at[0] - U.ram.at[0]) * k, 0.45, U.ram.at[1] + (U.striker.at[1] - U.ram.at[1]) * k]; g.add(burst(hit, '#eaffff', 10, 0.36)); },
  lights(scene, ctx) { scene.add(new T.HemisphereLight(lin('#dff1ff'), lin('#4a6470'), 0.5)); keyLight(scene, '#fff0dc', 1.0, [-4, 12, 7], [13.5, 0, 19.5], 11, 4); const c = ctx.world.parts.gemAt; pointLight(scene, '#6adfff', 2.4, c, 12, 1.6); for (const d of DOORS) pointLight(scene, '#ff5a3a', 0.9, [d.mid[0], 0.9, d.mid[1]], 5); },
  decals(scene, ctx) { const U = ctx.units, a = angTo(U.soldier.at, U.player.at); decalPoly(scene, wedge(U.soldier.at, a, 2.3, 0.4), '#ff3b5c', 0.2); decalPoly(scene, wedge(U.soldier.at, a, 1.5, 0.4), '#ff3b5c', 0.42); decalLine(scene, wedge(U.soldier.at, a, 2.3, 0.4).concat([U.soldier.at]), 0.04, '#ff3b5c', 1); decalRing(scene, U.soldier.at, 0.86, 0.06, '#ff3b5c', 1); decalRing(scene, U.player.at, 0.56, 0.045, '#7ff7c9', 0.9); },
  camera(W, H, ctx) { const U = ctx.units, c = new T.PerspectiveCamera(52, W / H, 0.3, 80); c.position.set(17.1, 2.25, 24.15); c.lookAt(13.1, 0.75, 20.3); c.updateProjectionMatrix(); c.updateMatrixWorld(); return c; },
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [bloom(W, H, 0.3, 0.6, 0.88)], { after: [shader(VIGNETTE, { amount: 0.5 })] }),
  overlay(g, ctx) { const U = ctx.units, W = ctx.W, H = ctx.H;
    crystalMeter(g, 28, 26, 0.87, { stroke: 'rgba(127,247,201,0.6)', sub: 'RAID · WAVE 2 OF 3' });
    // the lock: brackets round the soldier, its name, its bar, and what it is about to do
    const c = ctx.project(U.soldier.at[0], 0.3, U.soldier.at[1]), R = 185; g.save(); g.strokeStyle = '#ff5a72'; g.lineWidth = 6; g.lineCap = 'round'; for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { g.beginPath(); g.moveTo(c[0] + sx * R, c[1] + sy * (R * 0.62 - 34)); g.lineTo(c[0] + sx * R, c[1] + sy * R * 0.62); g.lineTo(c[0] + sx * (R - 34), c[1] + sy * R * 0.62); g.stroke(); } g.restore();
    text(g, '◀   SOLDIER ANT   ▶', c[0], c[1] - R * 0.62 - 52, { font: font('chakra', 26), fill: '#ffffff', align: 'center', stroke: 'rgba(4,10,14,0.9)', sw: 6 }); bar(g, c[0] - 130, c[1] - R * 0.62 - 40, 260, 14, U.soldier.hp, '#ff4d6a', { back: 'rgba(4,10,14,0.85)' });
    panel(g, c[0] + R + 26, c[1] - 62, 300, 96, { fill: 'rgba(60,8,20,0.92)', stroke: '#ff6b84' }); countRing(g, c[0] + R + 70, c[1] - 14, 28, 0.6, '#ff6b84', '0.8', { font: font('title', 22) }); text(g, 'BITE', c[0] + R + 112, c[1] - 22, { font: font('title', 28), fill: '#ffe1e6' }); text(g, 'coming at YOU', c[0] + R + 112, c[1] + 6, { font: font('ui', 17), fill: '#ffb3c0' }); text(g, 'guard it, or dive clear', c[0] + R + 112, c[1] + 26, { font: font('ui', 14), fill: '#ffd0d8' });
    // your three answers, by the right thumb; the stick by the left
    const btn = (x, y, r, label, sub, col, big) => { g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = 'rgba(6,16,22,0.78)'; g.fill(); g.lineWidth = big ? 8 : 5; g.strokeStyle = col; g.stroke(); g.restore(); text(g, label, x, y + (sub ? 2 : 9), { font: font('title', big ? 32 : 24), fill: col, align: 'center' }); if (sub) text(g, sub, x, y + 26, { font: font('ui', 14), fill: '#dceff2', align: 'center' }); };
    btn(W - 150, H - 150, 92, 'STRIKE', null, '#7ff7c9', true); btn(W - 318, H - 96, 66, 'GUARD', '0.8 s', '#ffffff'); btn(W - 232, H - 300, 66, 'DIVE', 'stun', '#ffd08a');
    g.save(); g.beginPath(); g.arc(170, H - 160, 92, 0, 7); g.fillStyle = 'rgba(6,16,22,0.5)'; g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,0.4)'; g.stroke(); g.beginPath(); g.arc(196, H - 190, 40, 0, 7); g.fillStyle = 'rgba(234,255,255,0.85)'; g.fill(); g.restore();
    // the squad's cards, each with whom it is holding
    squadStrip(g, ctx, 330, H - 96, { keys: ['ram', 'crab', 'star'], cw: 250, ch: 70, line: k => ({ ram: 'holding the STRIKER', crab: 'holding the SCOUT', star: 'guarding the CRYSTAL' })[k] });
  },
});

// ═════════ 7 · CARTRIDGE 3D ═════════ chunky low-resolution 3D: big pixels, flat-shaded models, a short haze; a fight is staged side-on, the squad on the left;
// the fight by COMMAND MENU: a battle of turns. You choose each member's move from its list, pick a target, and the round plays out in order
style('cartridge', {
  n: 7, title: 'CARTRIDGE 3D', tier: 'A NEW KIND OF FIGHT', accent: '#8fb3ff',
  look: 'chunky low-resolution 3D: big pixels, flat-shaded models; a fight is staged side-on',
  fight: 'COMMAND MENU: a battle of turns; pick each member\'s move and its target, then the round plays',
  exposure: 1.0, toneMapping: T.NoToneMapping, studio: false, shadowType: T.BasicShadowMap, room: { sentryAim: [14.55, 21.5] },
  units: () => RAID({ player: { at: [10.8, 19.9], face: [16, 19.9] }, star: { at: [11.7, 18.3], face: [16, 18.3] }, ram: { at: [12.9, 19.9], face: [16, 19.9], act: 0.2 }, crab: { at: [12.0, 21.6], face: [16, 21.6], act: 0.1 },
    soldier: { at: [15.4, 19.6], face: [10, 19.6], open: 0.08 }, striker: { at: [14.55, 21.5], face: [10, 21.5] }, scout: { at: [16.5, 18.4], face: [10, 18.4] }, worker: { at: [16.0, 17.2], face: [10, 17.2] } }),
  palette() { const P = basePalette(); P.scorch = null; P.stain = null; P.ground = std('#0c161c'); return P; },
  env(scene) { scene.background = lin('#101c26'); scene.fog = new T.Fog(lin('#18303c'), 7, 19); },
  world(world) { facet(world.g, { lambert: true }); }, cast(cast) { facet(cast.g, { lambert: true }); },
  lights(scene, ctx) { scene.add(new T.HemisphereLight(lin('#ffffff'), lin('#5d7480'), 0.55)); keyLight(scene, '#ffffff', 0.7, [4, 12, 8], [13.5, 0, 19.5], 10); pointLight(scene, '#6adfff', 0.9, ctx.world.parts.gemAt, 9); },
  decals(scene, ctx) { const U = ctx.units; decalRing(scene, U.crab.at, 0.74, 0.08, '#ffffff', 1); decalRing(scene, U.striker.at, 0.74, 0.08, '#ffe066', 1); },
  camera(W, H) { const c = new T.PerspectiveCamera(34, W / H, 2, 60); c.position.set(13.55, 2.7, 29.9); c.lookAt(13.55, 0.45, 19.7); c.updateProjectionMatrix(); c.updateMatrixWorld(); return c; },
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [], { after: [shader(PIXELS, { res: new T.Vector2(W, H), cell: 4, levels: 22, dither: 1 })] }),
  overlay(g, ctx) { const U = ctx.units, W = ctx.W, H = ctx.H, PXF = k => font('pixel', k);
    const win = (x, y, w, h) => { g.fillStyle = '#05080f'; g.fillRect(x - 6, y - 6, w + 12, h + 12); g.fillStyle = '#eef4ff'; g.fillRect(x - 3, y - 3, w + 6, h + 6); const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#2b4fb8'); gr.addColorStop(1, '#0e1c56'); g.fillStyle = gr; g.fillRect(x, y, w, h); };
    const T2 = (s, x, y, px, col, al) => text(g, s, x, y, { font: PXF(px), fill: col || '#ffffff', align: al, stroke: '#05080f', sw: 4 });
    // whose turn, and in what order the round runs
    win(28, 28, 560, 84); T2('ROUND 2', 46, 62, 24, '#ffe066'); ['crab', 'soldier', 'ram', 'striker', 'star', 'scout', 'player', 'worker'].forEach((k, i) => { const x = 170 + i * 51; g.fillStyle = i === 0 ? '#ffe066' : TEAM[U[k].team]; g.fillRect(x - 3, 37, 48, 48); g.fillStyle = '#0d1a22'; g.fillRect(x, 40, 42, 42); g.imageSmoothingEnabled = false; g.drawImage(ctx.portraits[k], x, 40, 42, 42); g.imageSmoothingEnabled = true; }); T2('STONEPETAL\'S TURN', 46, 100, 16, '#cfe0ff');
    // the command list
    win(28, H - 318, 430, 290); T2('STONEPETAL', 50, H - 278, 28, '#ff9ccc'); [['ATTACK', ''], ['STAKE RING', '6 EN'], ['REEF PILLAR', 'ULT'], ['ITEM', ''], ['GUARD', '']].forEach(([n, c], i) => { const y = H - 232 + i * 42; if (i === 1) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(40, y - 28, 406, 38); T2('▶', 50, y, 24, '#ffe066'); } T2(n, 86, y, 26, i === 1 ? '#ffffff' : '#cfe0ff'); if (c) T2(c, 436, y, 20, c === 'ULT' ? '#ff9ccc' : '#8fe6ff', 'right'); });
    // the party
    win(W - 590, H - 228, 562, 200); SQUAD.forEach((k, i) => { const y = H - 190 + i * 44, u = U[k]; T2(u.name, W - 572, y, 22, k === 'crab' ? '#ffe066' : '#ffffff'); T2(String(Math.round(u.hp * 140)) + ' / 140', W - 252, y, 20, '#cfe0ff', 'right'); g.fillStyle = '#05080f'; g.fillRect(W - 236, y - 18, 190, 18); g.fillStyle = u.hp > 0.5 ? '#5cf08a' : '#ffb347'; g.fillRect(W - 233, y - 15, 184 * u.hp, 12); });
    // the target
    const h = ctx.head('striker', 0.12); T2('▼', h[0], h[1] - 4, 44, '#ffe066', 'center'); win(h[0] - 150, h[1] - 118, 300, 62); T2('STRIKER ANT', h[0], h[1] - 86, 22, '#ffffff', 'center'); g.fillStyle = '#05080f'; g.fillRect(h[0] - 120, h[1] - 78, 240, 14); g.fillStyle = '#ff5a72'; g.fillRect(h[0] - 118, h[1] - 76, 236 * U.striker.hp, 10);
  },
});

// ═════════ 8 · FACET TACTICS ═════════ clean flat facets, like cut crystal, under a soft low light; the floor's tiles are the board;
// the fight TURN BY TURN ON THE TILES: your side moves, then theirs. Where a unit can go is blue, what it can hit is red, cover and facing count
style('facet', {
  n: 8, title: 'FACET TACTICS', tier: 'A NEW KIND OF FIGHT', accent: '#7cc4ff',
  look: 'clean flat facets, like cut crystal, under a soft low light; the floor\'s tiles are the board',
  fight: 'TURNS ON THE TILES: your side, then theirs; blue is where it can go, red is what it can hit',
  exposure: 1.0, studio: false, room: { sentryAim: [16, 23] },
  units: () => RAID({ player: { at: [12, 18], face: [14, 20] }, star: { at: [11, 20], face: [11, 24] }, ram: { at: [14, 19], face: [16, 19], act: 0.3 }, crab: { at: [12, 22], face: [11, 24], act: 0.2 },
    soldier: { at: [16, 19], face: [14, 19], open: 0.05 }, striker: { at: [11, 24], face: [12, 22] }, scout: { at: [16, 23], face: [14, 21] }, worker: { at: [12, 25], face: [12, 22] } }),
  palette() { const P = basePalette(); P.scorch = null; P.stain = null; P.hazardFloor = 0.1; P.floor = new T.MeshStandardMaterial({ map: floorTexture({ a: '#d3e3e8', line: 'rgba(40,90,110,0.55)', shine: 'rgba(255,255,255,0.5)' }), roughness: 0.9 }); P.ground = std('#23404c'); return P; },
  env(scene) { scene.background = lin('#2f5361'); },
  world(world) { facet(world.g, { rough: 0.9 }); }, cast(cast) { facet(cast.g, { rough: 0.85 }); },
  lights(scene, ctx) { scene.add(new T.HemisphereLight(lin('#f2fbff'), lin('#7f9ba6'), 0.7)); keyLight(scene, '#fff0d8', 1.0, [10, 9, -2], [13, 0, 19], 12, 3); fillLight(scene, '#a8d4ff', 0.25, [26, 10, 32]); pointLight(scene, '#6adfff', 0.8, ctx.world.parts.gemAt, 7); },
  decals(scene, ctx) { const U = ctx.units, taken = new Set(Object.keys(U).map(k => Math.round(U[k].at[0]) + ',' + Math.round(U[k].at[1])).concat(CH.solids.flatMap(s => { const o = []; for (let x = Math.ceil(s.bb[0]); x < s.bb[2]; x++) for (let y = Math.ceil(s.bb[1]); y < s.bb[3]; y++) o.push(x + ',' + y); return o; })));
    const tile = (x, y, hex, op, edge) => { decalPoly(scene, tileRect(x, y, 0.45), hex, op); if (edge) decalLine(scene, tileRect(x, y, 0.45).concat([tileRect(x, y, 0.45)[0]]), 0.045, hex, 1); };
    for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) { const x = 12 + dx, y = 22 + dy; if (Math.abs(dx) + Math.abs(dy) > 3 || !(dx || dy) || !inRoom(x, y) || taken.has(x + ',' + y) || Math.hypot(x - CRYSTAL[0], y - CRYSTAL[1]) < 1.9) continue; tile(x, y, '#3c96ff', 0.3, true); }
    tile(12, 22, '#ffffff', 0.35, true); tile(11, 24, '#ff3b5c', 0.42, true); tile(12, 25, '#ff3b5c', 0.25, true);
    decalArrow(scene, [12, 22.45], [12, 23], 0.1, '#ffffff', 0.95); decalDashes(scene, [[12, 23], [11.35, 23.65]], 0.07, '#ff8cc6', 1, 0.14, 0.09);
    for (const k of Object.keys(U)) { const u = U[k], a = angTo(u.at, u.face); decalPoly(scene, [[u.at[0] + Math.cos(a) * 0.47, u.at[1] + Math.sin(a) * 0.47], [u.at[0] + Math.cos(a + 0.5) * 0.36, u.at[1] + Math.sin(a + 0.5) * 0.36], [u.at[0] + Math.cos(a - 0.5) * 0.36, u.at[1] + Math.sin(a - 0.5) * 0.36]], TEAM[u.team], 0.95, 0.02); if (k !== 'crab' && k !== 'striker') decalLine(scene, tileRect(Math.round(u.at[0]), Math.round(u.at[1]), 0.45).concat([tileRect(Math.round(u.at[0]), Math.round(u.at[1]), 0.45)[0]]), 0.035, TEAM[u.team], 0.8); } },
  camera: (W, H) => ortho(W, H, 14.4, [13.2, 0.2, 20.0], 45, 35),
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, []),
  overlay(g, ctx) { const U = ctx.units, W = ctx.W, H = ctx.H;
    panel(g, 28, 26, 430, 86, { fill: 'rgba(14,34,52,0.92)', stroke: '#7cc4ff' }); squareBadge(g, ctx.portraits.crab, 40, 36, 66, '#ff8cc6'); text(g, 'YOUR TURN', 120, 58, { font: font('ui', 16), fill: '#9fd0ff' }); text(g, 'STONEPETAL', 120, 90, { font: font('chakra', 30), fill: '#ffffff' });
    text(g, 'AP', 342, 62, { font: font('chakra', 20), fill: '#9fd0ff' }); for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(352 + i * 34, 86, 12, 0, 7); g.fillStyle = i < 3 ? '#5cf0ff' : 'rgba(255,255,255,0.15)'; g.fill(); }
    // the round's order
    ['crab', 'ram', 'star', 'player', 'soldier', 'striker', 'scout', 'worker'].forEach((k, i) => { const x = W / 2 - 150 + i * 62 + (i > 3 ? 26 : 0); badge(g, ctx.portraits[k], x, 62, i === 0 ? 30 : 24, i === 0 ? '#ffffff' : TEAM[U[k].team], { dim: i === 0 ? 0 : 0.25 }); }); text(g, 'YOUR SIDE', W / 2 - 150 + 93, 114, { font: font('ui', 14), fill: '#9fd0ff', align: 'center' }); text(g, 'THEIR SIDE', W / 2 - 150 + 367, 114, { font: font('ui', 14), fill: '#ff9aa8', align: 'center' });
    // what the chosen move will do
    const h = ctx.head('striker', 0.3); h[0] = Math.max(h[0], 360); panel(g, h[0] - 330, h[1] - 150, 330, 112, { fill: 'rgba(52,10,26,0.94)', stroke: '#ff8cc6' }); text(g, 'STAKE RING', h[0] - 312, h[1] - 116, { font: font('chakra', 24), fill: '#ffd0e6' }); text(g, '−34', h[0] - 22, h[1] - 108, { font: font('title', 40), fill: '#ffffff', align: 'right' });
    text(g, 'on the STRIKER ANT', h[0] - 312, h[1] - 90, { font: font('ui', 16), fill: '#ffb3c8' }); text(g, 'rooted for 1 turn · no cover', h[0] - 312, h[1] - 64, { font: font('ui', 15), fill: '#ffe1ee' }); leader(g, [h[0] - 60, h[1] - 38], [h[0] - 10, h[1] + 20], '#ff8cc6', 3);
    for (const k of ANTS) unitTag(g, ctx, k, { name: false, w: 84 }); for (const k of SQUAD) unitTag(g, ctx, k, { name: false, w: 84 });
    // the moves, each with what it costs
    const acts = [['MOVE', '1', false], ['STAKE RING', '2', true], ['REEF', '1', false], ['GUARD', '1', false], ['END TURN', '', false]], bw = 196, bx = W / 2 - (acts.length * (bw + 12)) / 2;
    acts.forEach(([n, c, on], i) => { const x = bx + i * (bw + 12), y = H - 96 - (on ? 10 : 0); panel(g, x, y, bw, 68, { fill: on ? '#ff8cc6' : 'rgba(14,34,52,0.92)', stroke: on ? '#ffffff' : '#7cc4ff', lw: on ? 4 : 2 }); text(g, n, x + (c ? 18 : bw / 2), y + 43, { font: font('chakra', 23), fill: on ? '#2a0a18' : '#eaf6ff', align: c ? 'left' : 'center' }); if (c) { g.beginPath(); g.arc(x + bw - 30, y + 34, 16, 0, 7); g.fillStyle = on ? '#2a0a18' : '#5cf0ff'; g.fill(); text(g, c, x + bw - 30, y + 42, { font: font('title', 20), fill: on ? '#ffd0e6' : '#06202c', align: 'center' }); } });
  },
});

// ═════════ 9 · PAPERCRAFT ═════════ everything cut and folded from card: flat colour, a white cut edge round every piece, soft shadows, paper grain;
// the fight by CARDS: each follower's moves are cards in your hand; the Crystal gives the energy to play them; then the ants take their turn, which you can see coming
function drawCard(g, x, y, w, h, rot, c, o) { o = o || {}; g.save(); g.translate(x, y); g.rotate(rot); if (o.lift) { g.shadowColor = 'rgba(255,255,255,0.9)'; g.shadowBlur = 34; } else { g.shadowColor = 'rgba(0,0,0,0.5)'; g.shadowBlur = 16; g.shadowOffsetY = 6; }
  rrect(g, -w / 2, -h / 2, w, h, 16); g.fillStyle = '#fbf6ea'; g.fill(); g.shadowColor = 'transparent'; rrect(g, -w / 2 + 8, -h / 2 + 8, w - 16, h - 16, 10); g.fillStyle = c.col; g.fill();
  rrect(g, -w / 2 + 16, -h / 2 + 44, w - 32, h * 0.46, 8); g.fillStyle = c.art || '#17323d'; g.fill(); if (c.img) { g.save(); rrect(g, -w / 2 + 16, -h / 2 + 44, w - 32, h * 0.46, 8); g.clip(); const s = h * 0.5; g.drawImage(c.img, -s / 2, -h / 2 + 44 + (h * 0.46 - s) / 2, s, s); g.restore(); }
  text(g, c.name, 0, -h / 2 + 34, { font: font('bang', c.name.length > 11 ? 21 : 25), fill: '#16212a', align: 'center' });
  rrect(g, -w / 2 + 16, -h / 2 + 52 + h * 0.46, w - 32, h - h * 0.46 - 70, 8); g.fillStyle = '#fbf6ea'; g.fill(); text(g, c.who, 0, -h / 2 + 76 + h * 0.46, { font: font('ui', 13), fill: '#5a6a74', align: 'center' }); (c.rule || []).forEach((line, i) => text(g, line, 0, -h / 2 + 100 + h * 0.46 + i * 19, { font: font('ui', 14), fill: '#16212a', align: 'center' }));
  g.beginPath(); g.arc(-w / 2 + 6, -h / 2 + 6, 24, 0, 7); g.fillStyle = '#16212a'; g.fill(); gem2d(g, -w / 2 + 6, -h / 2 + 6, 15, '#3aa0ff'); text(g, String(c.cost), -w / 2 + 6, -h / 2 + 14, { font: font('title', 21), fill: '#ffffff', align: 'center', stroke: '#16212a', sw: 5 }); g.restore(); }
style('paper', {
  n: 9, title: 'PAPERCRAFT', tier: 'A NEW KIND OF FIGHT', accent: '#ffb38a',
  look: 'everything cut and folded from card: flat colour, a white cut edge, soft shadows, paper grain',
  fight: 'CARDS: each follower\'s moves are cards in your hand; the Crystal\'s energy plays them',
  exposure: 1.0, toneMapping: T.NoToneMapping, studio: false, room: { sentryAim: [16.9, 22.6] },
  palette() { const P = basePalette(); P.scorch = null; P.stain = null; P.hazardFloor = 0.16; P.ground = null; P.outside = null; P.floor = new T.MeshStandardMaterial({ map: floorTexture({ a: '#9ccdd8', line: 'rgba(255,255,255,0.55)', shine: 'rgba(255,255,255,0)' }), roughness: 1 }); P.floorSide = std('#6fa6b3');
    P.wallFace = new T.MeshStandardMaterial({ map: wallTexture({ body: '#f6efe0', base: '#3d93a0', join: 'rgba(0,0,0,0.05)', groove: '#2f7480', line: 'rgba(0,0,0,0.08)' }), roughness: 1 }); P.wallCap = std('#ffffff'); P.cutFace = std('#e4dccb'); P.cutTop = std('#f6efe0'); return P; },
  env(scene) { scene.background = lin('#28323c'); },
  world(world, scene, ctx) { facet(world.g, { lambert: true }); dioramaBase(scene, { th: 0.16, top: new T.MeshLambertMaterial({ color: lin('#f6efe0') }), side: new T.MeshLambertMaterial({ color: lin('#d9cfb8') }), table: new T.MeshLambertMaterial({ color: lin('#2f3d48') }) }); },
  cast(cast, scene, ctx) { facet(cast.g, { lambert: true }); const U = ctx.units; for (const k of Object.keys(U)) { U[k].key = k; const b = new T.Mesh(new T.CylinderGeometry(reach(U[k]) + 0.08, reach(U[k]) + 0.08, 0.035, 40), new T.MeshLambertMaterial({ color: lin('#ffffff') })); b.position.set(U[k].at[0], 0.018, U[k].at[1]); b.receiveShadow = true; b.castShadow = true; scene.add(b); decalRing(scene, U[k].at, reach(U[k]) - 0.02, 0.09, TEAM[U[k].team], 1, 0, 1, 0.04); } },
  fx(scene, ctx) { ctx.fx = raidFx(scene, ctx, { hit: false }); },
  lights(scene, ctx) { scene.add(new T.HemisphereLight(lin('#ffffff'), lin('#8d99a4'), 0.72)); keyLight(scene, '#fff3e0', 0.6, [7, 15, 5], [13.5, 0, 19.5], 13, 6); },
  decals(scene, ctx) { const U = ctx.units; decalDashes(scene, [along(U.crab.at, U.striker.at, 0.36), along(U.crab.at, U.striker.at, 0.66)], 0.08, '#ffffff', 1, 0.14, 0.09, 0.05); },
  camera: (W, H) => persp(W, H, 22, [13.6, 0, 21.3], 45, 50, 31),
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [new InkPass(scene, cam, W, H, { ink: '#ffffff', thick: 1.9, depth: 0.02 })], { after: [shader(PAPER, { res: new T.Vector2(W, H), amount: 1.25 }), shader(VIGNETTE, { amount: 0.3 })] }),
  overlay(g, ctx) { const U = ctx.units, W = ctx.W, H = ctx.H, P = ctx.portraits;
    // the ants' turn, told before it comes
    panel(g, W - 410, 26, 382, 110, { fill: 'rgba(251,246,234,0.96)', stroke: '#16212a', lw: 3 }); text(g, 'THE ANTS\' TURN, NEXT', W - 390, 58, { font: font('bang', 26), fill: '#b3243c' }); [['soldier', 'BITES the Jelly Ram · 38'], ['striker', 'LUNGES at Stonepetal · 22']].forEach(([k, t], i) => { badge(g, P[k], W - 376, 86 + i * 30, 13, '#b3243c', { back: '#f1e7d2', lw: 3 }); text(g, t, W - 354, 92 + i * 30, { font: font('ui', 16), fill: '#16212a' }); });
    panel(g, 28, 26, 330, 74, { fill: 'rgba(251,246,234,0.96)', stroke: '#16212a', lw: 3 }); gem2d(g, 64, 63, 24, '#3aa0ff', '#16212a'); text(g, 'THE CRYSTAL', 96, 56, { font: font('bang', 26), fill: '#16212a' }); g.fillStyle = '#16212a'; g.fillRect(96, 66, 244, 16); g.fillStyle = '#31b8d8'; g.fillRect(99, 69, 238 * 0.87, 10);
    // the hand
    const cards = [{ name: 'WOBBLE SLAM', who: 'JELLY RAM', cost: 1, col: '#7fe3d2', img: P.ram, rule: ['Hit one creature.', 'Knock it back a tile.'] }, { name: 'ICICLE VOLLEY', who: 'RIMESTAR', cost: 2, col: '#a9dcf5', img: P.star, rule: ['Three icicles', 'at one creature.'] },
      { name: 'STAKE RING', who: 'STONEPETAL', cost: 2, col: '#ffa9d2', img: P.crab, rule: ['Stakes rise round a', 'creature: it cannot move.'] }, { name: 'GUARD', who: 'YOU', cost: 1, col: '#9ff0d6', img: P.player, rule: ['Take the next blow', 'meant for a follower.'] }, { name: 'REEF PILLAR', who: 'STONEPETAL', cost: 4, col: '#ff8cc6', img: P.crab, rule: ['ULTIMATE'] }];
    const cw = 214, chh = 310, cx0 = W / 2 - 40; cards.forEach((c, i) => { if (i === 2) return; const k = i - 2; drawCard(g, cx0 + k * 196, H - 96 + Math.abs(k) * 22, cw, chh, k * 0.085, c); });
    const tg = ctx.head('striker', 0.2); g.save(); g.strokeStyle = '#ffffff'; g.lineWidth = 7; g.lineCap = 'round'; g.setLineDash([4, 16]); g.beginPath(); g.moveTo(cx0, H - 330); g.quadraticCurveTo(cx0 - 260, H - 520, tg[0] + 40, tg[1] + 20); g.stroke(); g.restore();
    drawCard(g, cx0, H - 190, cw * 1.12, chh * 1.12, 0, cards[2], { lift: true });
    // the energy, the deck, the end of the turn
    panel(g, 28, H - 150, 250, 120, { fill: 'rgba(251,246,234,0.96)', stroke: '#16212a', lw: 3 }); text(g, 'ENERGY', 48, H - 112, { font: font('bang', 26), fill: '#16212a' }); for (let i = 0; i < 5; i++) gem2d(g, 62 + i * 44, H - 68, 20, i < 3 ? '#3aa0ff' : '#d9d2c0', '#16212a'); text(g, '3 / 5', 258, H - 112, { font: font('bang', 26), fill: '#1f6fd0', align: 'right' });
    panel(g, W - 258, H - 110, 230, 80, { fill: '#16212a', stroke: '#fbf6ea', lw: 4 }); text(g, 'END TURN', W - 143, H - 58, { font: font('bang', 38), fill: '#fbf6ea', align: 'center' }); text(g, 'DECK 14   ·   USED 6', W - 143, H - 128, { font: font('ui', 16), fill: '#fbf6ea', align: 'center', stroke: 'rgba(0,0,0,0.5)', sw: 4 });
  },
});

// ═════════ 10 · THE WAR TABLE ═════════ the whole facility as a hologram on a table, every room and corridor at once, the raid's route drawn through it;
// the fight is PLANNED, THEN WATCHED: before a wave you post the squad at doors and corners; then the wave plays by itself, as fast or slow as you like
function warTable(scene, ctx) {
  const F = map.facility, LH = 1.3, g = new T.Group(), keep = new Set(['crystal_chamber', 'teleport_room_1', 'front_lobby', 'security_room', 'show_room', 'lab_hallway', 'lounge', 'lab_passage', 'experiment_lab', 'teleport_stair_room', 'teleport_room_2', 'observation_deck', 'catwalk_spur', 'arena', 'catwalks']);
  const line = (hex, op) => new T.LineBasicMaterial({ color: lin(hex), transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }), fill = (hex, op) => new T.MeshBasicMaterial({ color: lin(hex), transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide, toneMapped: false });
  const rooms = {}; for (const r of F.rooms) { if (!keep.has(r.id)) continue; const y = r.level * LH, home = r.id === 'crystal_chamber', hex = home ? '#7ff7ff' : r.id === 'arena' ? '#ffb86b' : '#31c8f0', h = home ? 0 : 0.7;
    const loop = yy => { const pts = r.poly.map(p => new T.Vector3(p[0], yy, p[1])); pts.push(pts[0].clone()); return new T.Line(new T.BufferGeometry().setFromPoints(pts), line(hex, home ? 0.95 : 0.6)); };
    g.add(loop(y + 0.02)); if (h) { g.add(loop(y + h)); const v = []; for (const p of r.poly) { v.push(new T.Vector3(p[0], y, p[1]), new T.Vector3(p[0], y + h, p[1])); } g.add(new T.LineSegments(new T.BufferGeometry().setFromPoints(v), line(hex, 0.35))); }
    const sh = new T.Shape(r.poly.map(p => new T.Vector2(p[0], -p[1]))), fm = new T.Mesh(new T.ShapeGeometry(sh), fill(hex, home ? 0.1 : 0.05)); fm.rotation.x = -Math.PI / 2; fm.position.y = y; g.add(fm);
    rooms[r.id] = { y, c: [(r.bb[0] + r.bb[2]) / 2, (r.bb[1] + r.bb[3]) / 2], label: r.label }; }
  for (const s of F.solids) { if (!keep.has(s.room) || s.room === 'crystal_chamber' || !s.bb) continue; const w = s.bb[2] - s.bb[0], d = s.bb[3] - s.bb[1], b = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(w * 0.9, 0.35, d * 0.9)), line('#31c8f0', 0.22)); b.position.set((s.bb[0] + s.bb[2]) / 2, rooms[s.room].y + 0.18, (s.bb[1] + s.bb[3]) / 2); g.add(b); }
  for (const d of F.doors) { if (!d.rooms || !d.rooms.every(id => keep.has(id))) continue; const y = Math.max(rooms[d.rooms[0]].y, rooms[d.rooms[1]].y), m = new T.Mesh(new T.BoxGeometry(Math.abs(d.b[0] - d.a[0]) + 0.12, 0.22, Math.abs(d.b[1] - d.a[1]) + 0.12), fill('#eaffff', 0.16)); m.position.set((d.a[0] + d.b[0]) / 2, y + 0.11, (d.a[1] + d.b[1]) / 2); g.add(m); }
  // the table under it: a dark disc with rings
  const tb = new T.Mesh(new T.CircleGeometry(70, 96), new T.MeshBasicMaterial({ color: lin('#03101a'), toneMapped: false })); tb.rotation.x = -Math.PI / 2; tb.position.set(28, -2.2, 34); g.add(tb);
  for (const rr of [18, 30, 42, 54, 66]) { const pts = []; for (let i = 0; i <= 128; i++) pts.push(new T.Vector3(28 + Math.cos(i / 128 * Math.PI * 2) * rr, -2.18, 34 + Math.sin(i / 128 * Math.PI * 2) * rr)); g.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), line('#1f6f8f', 0.5))); }
  // the wave's route: up from the arena, round the lounge by the hallway, to the Crystal Chamber's east door
  const ay = rooms.arena.y, route = [[33, ay, 48], [24, ay, 44], [20.5, ay, 40.6], [20.5, 0, 37.6], [20.5, 0, 35.2], [40.6, 0, 35.2], [40.6, 0, 23.6], [19.6, 0, 23.6], [19.6, 0, 22.5], [17.4, 0, 22.5]];
  const rm = fill('#ff3b5c', 0.95); for (let i = 0; i + 1 < route.length; i++) { const a = route[i], b = route[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), n = Math.max(1, Math.round(L / 0.9)); for (let k = 0; k < n; k++) { const t0 = (k + 0.15) / n, t1 = (k + 0.7) / n; g.add(rodBetween([a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0 + 0.12, a[2] + (b[2] - a[2]) * t0], [a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1 + 0.12, a[2] + (b[2] - a[2]) * t1], 0.09, rm, 6)); } }
  const ants = [[30, ay, 46.7], [26.5, ay, 45.1], [22.4, ay, 42.4], [20.5, 0, 36.4], [25, 0, 35.2], [31, 0, 35.2], [36.5, 0, 35.2], [40.6, 0, 31], [40.6, 0, 26.4]]; for (const a of ants) { const m = new T.Mesh(new T.OctahedronGeometry(0.42, 0), fill('#ff6b84', 1)); m.position.set(a[0], a[1] + 0.75, a[2]); m.scale.y = 1.5; g.add(m); }
  scene.add(g); return { rooms, route, ants, LH };
}
style('table', {
  n: 10, title: 'THE WAR TABLE', tier: 'A NEW KIND OF FIGHT', accent: '#ff8ba0',
  look: 'the whole facility as a hologram on a table: every room at once, the raid\'s route drawn through it',
  fight: 'PLAN, THEN WATCH: post the squad at doors and corners; the wave then plays by itself, at your speed',
  exposure: 1.0, toneMapping: T.NoToneMapping, studio: false, shadows: false, room: { sentryAim: [17.4, 22.5] },
  units: () => RAID({ ram: { at: [16.6, 22.5], face: [18.5, 22.5], act: 0 }, crab: { at: [15.2, 20.6], face: [17.5, 22.5], act: 0 }, star: { at: [13.2, 18.2], face: [17.5, 22.5] }, player: { at: [12.6, 17.4], face: [17.5, 22.5] }, soldier: null, striker: null, scout: null, worker: null }),
  palette() { const P = basePalette(); P.ground = null; P.outside = null; P.scorch = null; P.stain = null; P.hazard = null; P.cable = null; return P; },
  env(scene) { scene.background = lin('#01060b'); },
  world(world, scene, ctx) { const pa = world.parts; for (const q of [pa.floor, pa.walls, pa.cutWalls, pa.marks]) if (q) q.visible = false; for (const d of pa.doors) d.visible = false; holo(pa.propsGroup, '#31c8f0', { fill: 0.07, line: 0.55 }); holo(pa.fittings, '#31c8f0', { fill: 0.05, line: 0.35 }); holo(pa.pad, '#7ff7ff', { fill: 0.08, line: 0.5 }); for (const t of pa.tank) t.visible = false; pa.liquid.visible = false;
    scene.add(glowSprite(pa.gemAt, 2.6, '#6adfff', 0.9)); ctx.wt = warTable(scene, ctx); },
  cast(cast, scene, ctx) { for (const k of Object.keys(cast.parts)) holo(cast.parts[k], '#7ff7ff', { fill: 0.3, line: 0.9 }); },
  decals(scene, ctx) { const U = ctx.units; for (const [at, r] of [[U.ram.at, 1.0], [U.crab.at, 1.0], [[12.9, 17.8], 1.5]]) { decalRing(scene, at, r, 0.09, '#eaffff', 0.95); decalDisc(scene, at, r, '#7ff7ff', 0.12); }
    const s = SENTRY, a = angTo(s, [17.4, 22.5]); decalPoly(scene, wedge(s, a, 3.2, 0.5), '#31c8f0', 0.16); },
  camera: (W, H) => persp(W, H, 27, [17.2, 0, 22.6], 228, 43, 47),
  compose: (renderer, scene, cam, W, H) => composer(renderer, scene, cam, W, H, [bloom(W, H, 1.0, 0.6, 0.18)], { after: [shader(VIGNETTE, { amount: 0.45 })] }),
  overlay(g, ctx) { const U = ctx.units, W = ctx.W, H = ctx.H, wt = ctx.wt, P = ctx.portraits;
    const lab = (id, s, col, dy) => { const r = wt.rooms[id], p = ctx.project(r.c[0], r.y + 0.9, r.c[1]); text(g, s, p[0], p[1] + (dy || 0), { font: font('chakra', 19), fill: col || '#8fe6ff', align: 'center', stroke: 'rgba(1,6,11,0.9)', sw: 5 }); };
    wt.rooms.lab_hallway.c = [36, 23.6]; wt.rooms.arena.c = [30, 52];
    lab('arena', 'THE ARENA', '#ffc98a'); lab('lab_hallway', 'LAB HALLWAY'); lab('lounge', 'THE LOUNGE'); lab('front_lobby', 'FRONT LOBBY'); lab('teleport_room_1', 'TELEPORT ROOM');
    const cc = ctx.project(CRYSTAL[0], 3.4, CRYSTAL[1]); text(g, 'THE CRYSTAL CHAMBER', cc[0], cc[1], { font: font('title', 26), fill: '#eaffff', align: 'center', stroke: 'rgba(1,6,11,0.9)', sw: 6 });
    // the wave on its way
    const a0 = wt.ants[4], pa = ctx.project(a0[0], a0[1] + 1.9, a0[2]); panel(g, pa[0] - 120, pa[1] - 96, 240, 80, { fill: 'rgba(50,6,16,0.92)', stroke: '#ff6b84' }); text(g, '9 ANTS', pa[0], pa[1] - 60, { font: font('title', 28), fill: '#ffe1e6', align: 'center' }); text(g, 'at the east door in 0:12', pa[0], pa[1] - 32, { font: font('ui', 16), fill: '#ffb3c0', align: 'center' });
    const st = ctx.project(wt.route[0][0], wt.route[0][1] + 0.6, wt.route[0][2]); text(g, 'up from the NEST', st[0], st[1] - 14, { font: font('ui', 16), fill: '#ffb3c0', align: 'center', stroke: 'rgba(1,6,11,0.9)', sw: 5 });
    // the posts, and who holds each
    panel(g, 28, 150, 380, 330, { fill: 'rgba(2,14,22,0.9)', stroke: '#31c8f0' }); text(g, 'THE PLAN', 50, 192, { font: font('title', 30), fill: '#eaffff' });
    [['THE EAST DOOR', ['ram'], 'and the SENTRY'], ['THE CORNER', ['crab'], 'stakes the way in'], ['BY THE CRYSTAL', ['star', 'player'], 'the last line']].forEach(([n, ks, sub], i) => { const y = 222 + i * 84; g.fillStyle = 'rgba(49,200,240,0.1)'; rrect(g, 44, y, 348, 72, 10); g.fill(); text(g, n, 60, y + 30, { font: font('chakra', 21), fill: '#8fe6ff' }); text(g, sub, 60, y + 56, { font: font('ui', 15), fill: '#cfeaf2' }); ks.forEach((k, j) => badge(g, P[k], 356 - j * 54, y + 36, 24, '#7ff7ff')); });
    for (const [k, s] of [['ram', 'EAST DOOR'], ['crab', 'THE CORNER']]) { const h = ctx.head(k, 1.1); chip(g, s, h[0], h[1] - 40, { align: 'center', px: 16, fill: 'rgba(2,14,22,0.9)', stroke: '#eaffff', color: '#eaffff' }); }
    crystalMeter(g, 28, 26, 0.87, { fill: 'rgba(2,14,22,0.9)', sub: 'WAVE 2 OF 3 · NOT STARTED' });
    // the wave's clock
    const bx = W / 2 - 400, by = H - 118; panel(g, bx, by, 800, 90, { fill: 'rgba(2,14,22,0.92)', stroke: '#31c8f0' }); ['❚❚', '1×', '2×', '4×'].forEach((t, i) => { panel(g, bx + 22 + i * 86, by + 16, 74, 58, { fill: i === 1 ? '#31c8f0' : 'rgba(49,200,240,0.12)', stroke: '#31c8f0', shadow: false }); text(g, t, bx + 59 + i * 86, by + 55, { font: font('title', 24), fill: i === 1 ? '#02141c' : '#8fe6ff', align: 'center' }); });
    panel(g, bx + 390, by + 12, 392, 66, { fill: '#ff5a72', stroke: '#ffe1e6', lw: 3, shadow: false }); text(g, 'START THE WAVE  ▶', bx + 586, by + 56, { font: font('title', 30), fill: '#2a0410', align: 'center' });
  },
});

// ── a plain build of the room, to check it against the game (not one of the ten: render.js draws it only when asked for by name, `base`) ──
style('base', {
  n: 0, title: 'THE ROOM, PLAIN', look: 'the Crystal Chamber as the game has it, in 3D', fight: '(a check, not a direction)', bare: false,
  exposure: 1.0, room: { sentryAim: [16.9, 22.6] },
  env(scene) { scene.background = new T.Color(0x070d12); },
  lights(scene, ctx) { scene.add(new T.HemisphereLight(lin('#eaf6ff'), lin('#6f8a96'), 0.75)); keyLight(scene, '#fff4e4', 1.25, [7, 14, 4], [13, 0, 18.5], 11); fillLight(scene, '#bfe0ff', 0.35, [20, 9, 30]); const c = ctx.world.parts.gemAt; if (c) pointLight(scene, '#6adfff', 1.2, c, 8); },
  camera: (W, H) => ortho(W, H, 15.5, [13.2, 0.4, 18.8], 45, 30),
});
