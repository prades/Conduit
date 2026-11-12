// DRAFTS (2026-11-12), for the owner; not the game. Two sheets for design/maps/passages-draft.js: 3, the ways through (each technician's way past an obstacle, before and after), and 4, seeing into a
// narrow passage (the camera looks from the bottom right, and a wall is 122 px tall on screen: FP_WALL_H, js/facilityplay.js).
const { WHO, kit, page } = require('./passages-draft.js');

// ───────────── 3. THE WAYS THROUGH ─────────────
function ways() {
  const T = 15, PW = 360, PH = 300;
  // a mini top-down scene, 9 x 6 tiles, in a box; `draw(k)` adds what is in it
  const scene = (draw, ox) => { const k = kit(T, 0); let s = `<g transform="translate(${ox},0)">`; s += k.rect(0, 0, 9, 6, 'fill="#0f141c" stroke="#2c3a4c" stroke-width="1"'); s += draw(k); return s + '</g>'; };
  const floor = (k, rects, col, wall) => rects.map(r => k.rect(...r, `fill="${wall}" stroke="${wall}" stroke-width="${T * 0.5}"`)).join('') + rects.map(r => k.rect(...r, `fill="${col}"`)).join('');
  const steel = (k, rects) => floor(k, rects, '#121a26', '#5d7390'), dirt = (k, rects) => floor(k, rects, '#2b2016', '#6e5238');
  const passage = [[0.6, 2, 8.4, 4]];
  const panels = [
    { who: ['any'], title: 'BREAK THROUGH', status: 'new', caption: ['A cracked wall with a flask within reach.', 'Shoot the flask: the blast breaks the', 'wall, and the way stays open (saved).'],
      a: k => steel(k, [[0.6, 2, 4.6, 4], [5.4, 2, 8.4, 4]]) + k.rect(4.6, 1.6, 5.4, 4.4, 'fill="#5d7390"') + k.crack([[5, 1.7], [5, 4.3]]) + k.barrel(3.6, 2.9),
      b: k => steel(k, passage) + k.rubble(4.5, 2.2, 5.5, 2.6, 3) + k.rubble(4.5, 3.6, 5.5, 3.9, 7) + `<circle cx="${k.X(3.6)}" cy="${k.Y(2.9)}" r="${T * 1.1}" fill="#ff9a3c" opacity="0.25"/>` },
    { who: ['any'], title: 'BRING IT DOWN', status: 'new', caption: ['A leaning stack (racks; in the Nest, a', 'hanging rock) blocks a doorway. Shoot', 'the flask at its foot: it comes down.'],
      a: k => steel(k, passage) + [[4.4, 2.5, 70], [4.6, 3.1, 105], [4.4, 3.6, 80]].map(([x, y, r]) => k.rack(x, y, 1.6, 0.6, r, true)).join('') + k.barrel(3.4, 3.6),
      b: k => steel(k, passage) + [[5.6, 1.6 + 0.9, 10], [6.2, 3.6, -8]].map(([x, y, r]) => k.rack(x, y, 1.7, 0.5, r, true)).join('') },
    { who: ['flux'], title: 'OUT OF THE WAY', status: 'new place', caption: ['An object across a passage, a niche', 'beside it. FLUX MOVE it in (2 tiles, as', 'built): the passage is clear.'],
      a: k => steel(k, passage.concat([[3.6, 0.8, 5.4, 2.05]])) + k.rack(4.5, 3, 2, 0.9, 90, true) + k.arrow([4.5, 2.6], [4.5, 1.5], '#c39bff'),
      b: k => steel(k, passage.concat([[3.6, 0.8, 5.4, 2.05]])) + k.rack(4.5, 1.45, 1.7, 0.8, 0, true) },
    { who: ['flux', 'any'], title: 'BRING THE BLAST', status: 'new', caption: ['The flask stands out of reach of the', 'cracked wall: FLUX MOVE it up, then', 'shoot it. Your two ideas together.'],
      a: k => steel(k, [[0.6, 2, 5.6, 4], [6.4, 2, 8.4, 4]]) + k.rect(5.6, 1.6, 6.4, 4.4, 'fill="#5d7390"') + k.crack([[6, 1.7], [6, 4.3]]) + k.barrel(1.8, 3) + k.arrow([2.3, 3], [3.4, 3], '#c39bff') + `<circle cx="${k.X(3.8)}" cy="${k.Y(3)}" r="${T * 0.42}" fill="none" stroke="#c39bff" stroke-dasharray="3 3" stroke-width="1.5"/>`,
      b: k => steel(k, passage) + k.rubble(5.5, 2.2, 6.5, 2.6, 5) + k.rubble(5.5, 3.6, 6.5, 3.9, 9) + `<circle cx="${k.X(3.8)}" cy="${k.Y(3)}" r="${T * 1.1}" fill="#ff9a3c" opacity="0.25"/>` },
    { who: ['fire'], title: 'DRILL THROUGH', status: 'built', caption: ['Rubble, or a collapsed tunnel: the', 'THERMITE DRILL, as at the arena\'s', 'south rubble and the Sewers\' choke.'],
      a: k => dirt(k, passage) + k.rubble(4, 2.05, 5.4, 3.95, 13),
      b: k => dirt(k, passage) + k.rubble(4.1, 2.1, 4.6, 2.5, 17) + k.rubble(4.9, 3.6, 5.4, 3.9, 19) },
    { who: ['ice'], title: 'BRIDGE IT', status: 'built', caption: ['Water across the way (a stream; in', 'the electrical domain, coolant): an', 'ICE BRIDGE, up to 8 tiles, as built.'],
      a: k => dirt(k, [[0.6, 2, 3.4, 4], [6, 2, 8.4, 4]]) + k.water(3.4, 0.6, 6, 5.4, '#145a6e'),
      b: k => dirt(k, [[0.6, 2, 3.4, 4], [6, 2, 8.4, 4]]) + k.water(3.4, 0.6, 6, 5.4, '#145a6e') + k.rect(3.2, 2.2, 6.2, 3.8, 'fill="#cfefff" stroke="#ffffff" stroke-width="1.5"') },
    { who: ['elec', 'bloom'], title: 'GET UP THERE', status: 'built', caption: ['A ledge to high ground: ride the', 'KINETIC LAUNCHER up, or climb a', 'REEF up its face (both built).'],
      a: k => steel(k, [[0.6, 0.6, 8.4, 5.4]]) + k.rect(5, 0.6, 8.4, 3.2, 'fill="#22324a" stroke="#9fc4ff" stroke-width="2.5"') + `<circle cx="${k.X(3.4)}" cy="${k.Y(4.2)}" r="${T * 0.7}" fill="none" stroke="#ffe14d" stroke-dasharray="4 3" stroke-width="2"/>`,
      b: k => steel(k, [[0.6, 0.6, 8.4, 5.4]]) + k.rect(5, 0.6, 8.4, 3.2, 'fill="#22324a" stroke="#9fc4ff" stroke-width="2.5"') + k.arrow([3.6, 3.8], [6, 2.2], '#ffe14d', true) + `<circle cx="${k.X(6.4)}" cy="${k.Y(1.8)}" r="${T * 0.4}" fill="#7dffa8"/>` },
    { who: ['acid'], title: 'EAT THROUGH', status: 'new idea', caption: ['A resin seal in a Nest tunnel. Shoot', 'the acid flask beside it: its pool eats', 'the resin away. (My idea, not asked.)'],
      a: k => dirt(k, passage) + k.rect(4.4, 2, 5.2, 4, 'fill="#4f8a2a" stroke="#a6f070" stroke-width="2"') + k.barrel(3.5, 3, true),
      b: k => dirt(k, passage) + `<ellipse cx="${k.X(4.2)}" cy="${k.Y(3)}" rx="${T * 1.2}" ry="${T * 0.9}" fill="#8cff3a" opacity="0.35"/>` },
  ];
  const stTag = st => { const c = st === 'built' ? '#7dffa8' : st === 'new idea' ? '#f0b429' : '#ffb070'; return `<span style="font-size:11px;letter-spacing:1px;padding:1px 6px;border:1px solid ${c};color:${c};border-radius:3px;margin-left:6px">${st.toUpperCase()}</span>`; };
  const badgeSvg = who => { const w = WHO[who]; return `<svg width="30" height="30" viewBox="0 0 30 30" style="vertical-align:middle;margin-right:4px"><circle cx="15" cy="15" r="12" fill="#0b0f16" stroke="${w.c}" stroke-width="3"/><text x="15" y="19.5" font-size="13" fill="${w.c}" text-anchor="middle">${w.g}</text></svg>`; };
  let cells = '';
  for (const p of panels) {
    const sw = 9 * T;
    const svg = `<svg width="${sw * 2 + 40}" height="${6 * T}" viewBox="0 0 ${sw * 2 + 40} ${6 * T}">${scene(p.a, 0)}<g transform="translate(${sw + 6},${3 * T - 9})"><polygon points="4,0 22,9 4,18" fill="#9fb3c8"/></g>${scene(p.b, sw + 40)}</svg>`;
    cells += `<div style="width:${PW}px;min-height:${PH - 60}px;background:#0e131b;border:1px solid #223042;border-radius:6px;padding:12px 14px">
      <div style="font-size:16px;font-weight:bold;color:#fff;margin-bottom:8px">${p.who.map(badgeSvg).join('')}${p.title}${stTag(p.status)}</div>${svg}
      <div style="font-size:13px;color:#8fa6bd;margin:4px 0 2px">BEFORE <span style="margin-left:${9 * T - 6}px">AFTER</span></div>
      <div style="font-size:14px;line-height:1.4;color:#c4d2df">${p.caption.join(' ')}</div></div>`;
  }
  const body = `<h1>3 · The ways through <span class="tag">DRAFT</span></h1><p class="sub">Each obstacle and who opens it, seen from above. <b style="color:#7dffa8">BUILT</b> works in the game today; <b style="color:#ffb070">NEW</b> is new; <b style="color:#ffb070">NEW PLACE</b> is built, used a new way; <b style="color:#f0b429">NEW IDEA</b> is mine, not asked for.</p>
    <div style="display:grid;grid-template-columns:repeat(4,${PW + 30}px);gap:14px">${cells}</div>
    <div class="notes" style="margin-top:18px;width:1500px"><ul>
    <li><b>Nothing gets stuck:</b> a flask that went off comes back on its own tile 60 s later (built), so a missed shot can be tried again. What a blast, a drill or a move opens stays open (saved), as drilled rubble does now.</li>
    <li><b>A blast still hurts everyone within 2 tiles</b>, your side too (built): stand back before you shoot.</li>
    <li class="q">To decide: which obstacles a blast breaks (a cracked wall, a leaning stack, and in the Nest a hanging rock?), and whether the acid idea is in.</li></ul></div>`;
  return page(4 * (PW + 30) + 3 * 14, 0, body);
}

// ───────────── 4. SEEING INTO A NARROW PASSAGE ─────────────
function seeing() {
  // the game's projection: a tile step along x is (30, 15) px on screen, along y (-30, 15); z is px up (js/config.js TILE_W 60, TILE_H 30)
  const S = 0.9, P = (x, y, z, o) => [o[0] + (x - y) * 30 * S, o[1] + (x + y) * 15 * S - (z || 0) * S];
  const quad = (pts, o, fill, stroke, extra) => `<polygon points="${pts.map(p => P(p[0], p[1], p[2], o).map(v => v.toFixed(1)).join(',')).join(' ')}" fill="${fill}" stroke="${stroke || 'none'}" stroke-width="1.5" ${extra || ''}/>`;
  const box = (x, y, w, d, h, o, top, left, right, extra) => quad([[x, y + d, h], [x + w, y + d, h], [x + w, y + d, 0], [x, y + d, 0]], o, left, '#0b0f16', extra) + quad([[x + w, y, h], [x + w, y + d, h], [x + w, y + d, 0], [x + w, y, 0]], o, right, '#0b0f16', extra) + quad([[x, y, h], [x + w, y, h], [x + w, y + d, h], [x, y + d, h]], o, top, '#0b0f16', extra);
  const WALL = 122, L = 8, D = 3;
  // one picture: the passage along x (across the screen), its far wall (north) and its near wall (south), the player in it, a flask and a chest
  const pic = (mode) => {
    const o = [30 + D * 30 * S + 6, 30 + WALL * S], nearH = mode === 'A' ? 22 : WALL;
    let s = '';
    s += quad([[0, 0, 0], [L, 0, 0], [L, 0, WALL], [0, 0, WALL]], o, '#2c3a4c', '#5d7390');                       // the far wall (north), seen face on
    s += quad([[0, 0, 0], [0, D, 0], [0, D, WALL], [0, 0, WALL]], o, '#24303f', '#5d7390');                       // the west end
    s += quad([[0, 0, 0], [L, 0, 0], [L, D, 0], [0, D, 0]], o, '#151d29', '#33445a');                             // the floor
    for (let i = 1; i < L; i++) s += `<polyline points="${P(i, 0, 0, o).join(',')} ${P(i, D, 0, o).join(',')}" stroke="#1f2a3a" stroke-width="1"/>`;
    // a chest and a flask on the floor, and the player (a cube) in the middle
    s += box(1.6, 0.9, 0.8, 0.6, 22, o, '#ffcf4a', '#b8901a', '#d9a92a') + box(5.8, 0.8, 0.5, 0.5, 34, o, '#ff9a3c', '#a83a14', '#c4441c');
    const me = (extra) => box(3.7, 1.2, 0.6, 0.6, 52, o, '#7dffa8', '#2f9a64', '#45c287', extra);
    s += me();
    // the near wall (south): full height today, a low rim (A), faded (B), full with an outline through it (C)
    const near = (fill, op) => quad([[0, D, 0], [L, D, 0], [L, D, nearH], [0, D, nearH]], o, fill, '#5d7390', op ? `opacity="${op}"` : '') + quad([[0, D, nearH], [L, D, nearH], [L, D + 0.25, nearH], [0, D + 0.25, nearH]], o, '#3c4d64', '#5d7390', op ? `opacity="${op}"` : '');
    if (mode === 'B') s += near('#33435a', 0.28); else s += near('#33435a');
    if (mode === 'C') s += box(3.7, 1.2, 0.6, 0.6, 52, o, 'none', 'none', 'none', 'stroke="#7dffa8" stroke-width="2.4" stroke-dasharray="5 3" fill-opacity="0"').replace(/stroke="#0b0f16"/g, '');
    const w = (L + D) * 30 * S + 70, h = (L + D) * 15 * S + WALL * S + 70;
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${s}</svg>`;
  };
  const card = (mode, title, lines, col) => `<div style="width:420px;background:#0e131b;border:1px solid ${col || '#223042'};border-radius:6px;padding:12px 14px"><div style="font-size:16px;font-weight:bold;color:#fff;margin-bottom:6px">${title}</div>${pic(mode)}<div style="font-size:14px;line-height:1.4;color:#c4d2df">${lines}</div></div>`;
  const body = `<h1>4 · Seeing into a narrow passage <span class="tag">TO DECIDE</span></h1><p class="sub">The camera looks from the bottom right, and a wall stands 122 px tall on the screen: the wall on the camera's side of a 3-tile passage covers all of its floor and nearly all of whoever is in it. Big rooms never showed this; passages will. The pictures: you (green), a chest and a flask in a passage.</p>
    <div style="display:flex;gap:14px;flex-wrap:wrap">
    ${card('T', 'TODAY · the near wall hides it all', 'Built as every wall is now. You, the chest and the flask are behind the wall.', '#5a2a2a')}
    ${card('A', 'A · LOW NEAR WALLS (my pick)', 'In passages and small rooms the walls on the camera\'s side are a low rim, as the deck\'s rail and the moat\'s lip are now; the far walls stay full height. Nothing reacts, and you always see in.', '#2f6a4a')}
    ${card('B', 'B · THE NEAR WALL FADES', 'The fight\'s ghost (built in 11r), used whenever you or your squad are behind a wall in the tight places. The walls react, which you turned down for the facility in 09uu.')}
    ${card('C', 'C · OUTLINES THROUGH THE WALL', 'Walls stay; you, your squad and creatures show as an outline through them. The floor behind stays hidden: the chest, the flask, a cracked wall.')}
    </div>`;
  return page(4 * 450 + 3 * 14, 0, body);
}

module.exports.sheets = () => [['3_ways', ways()], ['4_seeing', seeing()]];
