// THE ROLY-POLY'S RACE EMBLEM: four drafts for the owner (2026-11-14: "Make the roly-poly's card emblem"; docs/ELECTRIC-BREED.md §11, 2). Nothing here is in the game until one is picked.
// In the approved emblems' manner (js/cardart.js CARD_ART_EMBLEMS, 2026-11-06: one solid shape on a 32-unit square from discs, wedges and bars, its details cut out; the races in the enemy coral),
// drawn with that file's own helpers inside the game page:
//   A  TOP-DOWN: the armoured body from above, its plates' seams cut across, a rounded head with no face, jointed antennae, little feet at its sides, the tail's two prongs
//   B  CURLED: the closed wheel it curls into, its plates' seams wrapping round it, the antennae's tips out of the tuck
//   C  PROFILE: the arched shell in six plates over a row of legs, the antenna forward, the telson behind
//   D  CORE: A with the core on its back: a bolt in a ring cut through the middle plates (the electric breed)
//   node design/cards/rolypoly-emblem-drafts.js <out-dir>     writes emblem_drafts.png (each large, at the card's sizes, beside the six race emblems) and card_A..D.png (each on a roly-poly's real enemy card)
const DRAFT_SRC = String.raw`window.__rpEmblems = function () {
  const seamsAcross = (cx, cy, rx, ry, ys, bow, w, skip) => { let d = '';   // thin cuts across an ellipse, arched toward the head; skip = [x0, x1, y0, y1] keeps a hole clear of them
    for (const y0 of ys) { const half = rx * Math.sqrt(Math.max(0, 1 - Math.pow((y0 - cy) / ry, 2))) - 0.7; if (half <= 0) continue;
      const pieces = skip && y0 > skip[2] && y0 < skip[3] ? [[-half, skip[0] - 16], [skip[1] - 16, half]] : [[-half, half]];
      for (const [a, b] of pieces) { if (b - a < 0.8) continue; const top = [], bot = [];
        for (let i = 0; i <= 10; i++) { const x = a + (b - a) * i / 10, y = y0 - bow * (1 - Math.pow(x / half, 2)); top.push([cx + x, y - w / 2]); bot.push([cx + x, y + w / 2]); }
        d += _caPoly(top.concat(bot.reverse()), false); } }
    return d; };
  const edgeX = (cx, cy, rx, ry, y) => cx - rx * Math.sqrt(Math.max(0, 1 - Math.pow((y - cy) / ry, 2)));
  // A: from above
  const A = () => { const cx = 16, cy = 18.2, rx = 8.4, ry = 11.2;
    let d = _caEll(cx, cy, rx, ry, true) + _caEll(16, 6.6, 5.2, 3, true);                                   // the body, the head (no face)
    d += _caBoth([[13.4, 4.9], [11, 2.6], [7.4, 1.8]], 1.35);                                                  // the antennae, jointed
    [11.4, 15, 18.6, 22.2, 25.6].forEach(y => { const xe = edgeX(cx, cy, rx, ry, y) + 0.8; d += _caBoth([[xe, y], [xe - 2.6, y + 1.1]], 1.35); });   // the feet
    d += _caBoth([[14.6, 28.6], [13.2, 31]], 1.3);                                                             // the tail's prongs
    return d + _caPoly([[11.4, 8.6], [20.6, 8.6], [20.6, 9.5], [11.4, 9.5]], false) + seamsAcross(cx, cy, rx, ry, [12.6, 16.2, 19.8, 23.4, 26.6], 1.1, 0.95); };   // cuts: the head's rim, the plates' seams
  // B: curled into its wheel
  const B = () => { const cx = 16.6, cy = 16.4, R = 12.6; let d = _caDisc(cx, cy, R);
    d += _caBar([[6.2, 25.2], [3.4, 28.2], [1.4, 28.6]], 1.3) + _caBar([[8.6, 27.2], [6.8, 30.4], [4.8, 31.2]], 1.3);   // the antennae out of the tuck
    for (const s of [-0.72, -0.34, 0.04, 0.42, 0.78]) { const L = [], Rr = [];                                // cuts: the plates' seams wrapping round the ball (lines of longitude)
      for (let i = 0; i <= 14; i++) { const t = -0.86 + 1.72 * i / 14, y = cy + R * t, x = cx + s * R * Math.sqrt(1 - t * t); L.push([x - 0.45, y]); Rr.push([x + 0.45, y]); }
      d += _caPoly(L.concat(Rr.reverse()), false); }
    return d; };
  // C: in profile, head to the left
  const C = () => { const cx = 16.6, cy = 23, rx = 13.2, ry = 13, n = 6, a0 = 196, a1 = 352, gap = 2.2, r0 = 5.2;
    let d = _caEll(cx, cy + 0.2, r0 + 0.6, r0 * 0.75, true);                                                  // the body under the shell
    for (let k = 0; k < n; k++) { const s = a0 + (a1 - a0) * k / n + gap / 2, e = a0 + (a1 - a0) * (k + 1) / n - gap / 2, o = [], inn = [];   // the shell's plates
      for (let i = 0; i <= 6; i++) { const a = (s + (e - s) * i / 6) * Math.PI / 180; o.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); inn.push([cx + r0 * Math.cos(a), cy + r0 * 0.9 * Math.sin(a)]); }
      d += _caPoly(o.concat(inn.reverse()), true); }
    d += _caEll(4.6, 20.2, 2.9, 2.5, true);                                                                    // the head (no face)
    d += _caBar([[3.6, 18.4], [2.4, 14.6], [3.8, 10.6]], 1.35);                                                // the antenna
    d += _caPoly([[28.4, 22.2], [31.4, 23.4], [28.6, 24.2]], true);                                            // the telson
    for (let i = 0; i < 7; i++) { const x = 7.4 + i * 2.7; d += _caBar([[x, 23.4], [x - 0.9, 27.6]], 1.25); }   // the legs
    return d; };
  // D: A with the core: a bolt in a ring through its middle plates
  const D = () => { const cx = 16, cy = 18.2, rx = 8.4, ry = 11.2, cr = 4.6;
    let d = _caEll(cx, cy, rx, ry, true) + _caEll(16, 6.6, 5.2, 3, true) + _caBoth([[13.4, 4.9], [11, 2.6], [7.4, 1.8]], 1.35);
    [11.4, 15, 22.2, 25.6].forEach(y => { const xe = edgeX(cx, cy, rx, ry, y) + 0.8; d += _caBoth([[xe, y], [xe - 2.6, y + 1.1]], 1.35); });
    d += _caBoth([[14.6, 28.6], [13.2, 31]], 1.3);
    d += _caPoly([[11.4, 8.6], [20.6, 8.6], [20.6, 9.5], [11.4, 9.5]], false) + seamsAcross(cx, cy, rx, ry, [12.6, 16.2, 19.8, 23.4, 26.6], 1.1, 0.95, [16 - cr - 0.6, 16 + cr + 0.6, cy - cr - 0.6, cy + cr + 0.6]);
    d += _caEll(16, cy, cr, cr, false);                                                                        // cut: the core's ring
    const bolt = [[13.5, 1.5], [22.5, 1.5], [17, 12.5], [24.5, 12.5], [10.5, 30.5], [14.5, 17.5], [7.5, 17.5]].map(p => [16 + (p[0] - 16) * 0.24, cy + (p[1] - 16) * 0.24]);
    return d + _caPoly(bolt, true); };                                                                         // the bolt inside it
  return { A: A(), B: B(), C: C(), D: D() };
};
`;
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'), path = require('path');
const OUT = process.argv[2], DRAFTS = { content: DRAFT_SRC }, PAGE = 'file://' + path.join(__dirname, '..', '..', 'game.html') + '?dev';
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  let p = await b.newPage({ viewport: { width: 1180, height: 820 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(PAGE); await p.waitForTimeout(3000);
  await p.addScriptTag(DRAFTS);
  const paths = await p.evaluate(() => { const o = window.__rpEmblems(); o.races = {}; for (const r of CARD_ART_RACES) o.races[r] = cardArtEmblemPath(r); return o; });
  // the sheet
  const C = '#ff8a6a', svg = (d, s) => `<svg viewBox="0 0 32 32" width="${s}" height="${s}"><path d="${d}" fill="${C}"/></svg>`;
  const names = { A: 'A · TOP-DOWN', B: 'B · CURLED', C: 'C · PROFILE', D: 'D · CORE' };
  let html = `<html><body style="margin:0;background:#151a24;font:600 15px system-ui;color:#cfd8e6"><div style="padding:22px 26px">
    <div style="font:800 22px system-ui;color:#fff;letter-spacing:.5px">THE ROLY-POLY'S EMBLEM · four drafts</div>
    <div style="margin:4px 0 18px;color:#93a1b8">In the approved emblems' manner: one solid shape, its details cut out, in the races' coral. Each large, then at the card's sizes beside the six race emblems.</div>
    <div style="display:flex;gap:26px">`;
  for (const k of ['A', 'B', 'C', 'D']) {
    html += `<div style="background:#0d1119;border:1px solid #2a3344;border-radius:14px;padding:16px;width:236px"><div style="font:800 16px system-ui;color:#fff;margin-bottom:10px">${names[k]}</div>${svg(paths[k], 200)}
      <div style="display:flex;align-items:center;gap:10px;margin-top:14px">${svg(paths[k], 32)}${svg(paths[k], 22)}${svg(paths[k], 15)}</div>
      <div style="display:flex;align-items:center;gap:7px;margin-top:12px;flex-wrap:wrap">${Object.values(paths.races).map(d => svg(d, 22)).join('')}${svg(paths[k], 22)}</div></div>`;
  }
  html += `</div></div></body></html>`;
  const q = await b.newPage({ viewport: { width: 1110, height: 470 } }); await q.setContent(html); await q.waitForTimeout(300);
  await q.screenshot({ path: path.join(OUT, 'emblem_drafts.png') });
  // each on the real enemy card (a fresh page each: the emblem's class is made once)
  for (const k of ['A', 'B', 'C', 'D']) {
    if (k !== 'A') { await p.close(); p = await b.newPage({ viewport: { width: 1180, height: 820 } }); p.on('pageerror', e => errs.push(e.message)); await p.goto(PAGE); await p.waitForTimeout(3000); }
    await p.evaluate(([d]) => {
      facilityBlackoutSet(false); gameState.running = true; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; if (typeof dialogueClear === 'function') dialogueClear();
      CARD_ART_EMBLEMS.rolypoly = { col: '#ff8a6a', d() { return d; } }; if (CARD_ART_RACES.indexOf('rolypoly') < 0) CARD_ART_RACES.push('rolypoly');
      const A = _fp.F.byId.get('arena').bb, x = (A[0] + A[2]) / 2, y = (A[1] + A[3]) / 2; player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null;
      actors = actors.filter(a => !(a instanceof Predator)); _psImg('rolypoly');
      const t = spawnCreature({ species: 'rolypoly', className: 'tank', x: x + 2.2, y: y - 0.8, level: 5, state: 'wander' }); t.element = 'electric'; t.x = x + 2.2; t.y = y - 0.8; t.dirX = 1; t.dirY = 0.25; t.update = function () {}; window.__t = t;
    }, [paths[k]]);
    await p.waitForTimeout(1500);
    await p.evaluate(() => { if (typeof targetSet === 'function') targetSet(window.__t); else if (typeof setTarget === 'function') setTarget(window.__t); });
    await p.waitForTimeout(1300);
    await p.screenshot({ path: path.join(OUT, 'card_' + k + '.png') });
  }
  console.log(JSON.stringify({ errors: errs.slice(0, 5), sizes: Object.fromEntries(['A', 'B', 'C', 'D'].map(k => [k, paths[k].length])) }));
  await b.close();
})();
