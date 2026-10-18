// node design/ui-mocks/shard-icons.js <out.png> : a numbered sheet of candidate shard icons for the HUD (each big, and at HUD size beside the number). Needs playwright + chromium.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const OUT = process.argv[2] || '/tmp/shard-icons.png';
const G = { l: '#fff4b0', m: '#ffd23c', d: '#d99a06', k: '#8a5300', w: '#fffbe0' };
const defs = `<defs>
 <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4b0"/><stop offset="0.5" stop-color="#ffd23c"/><stop offset="1" stop-color="#c78400"/></linearGradient>
 <linearGradient id="gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe680"/><stop offset="1" stop-color="#b87400"/></linearGradient>
 <linearGradient id="gl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ffef9a"/><stop offset="1" stop-color="#ffc21a"/></linearGradient>
 <radialGradient id="gr" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#fff8c8"/><stop offset="0.5" stop-color="#ffd23c"/><stop offset="1" stop-color="#b87400"/></radialGradient>
 <linearGradient id="gp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6cf4a"/><stop offset="1" stop-color="#9c6300"/></linearGradient>
</defs>`;
const P = (pts, fill, extra) => `<polygon points="${pts}" fill="${fill}" stroke="rgba(255,248,200,0.6)" stroke-width="0.8" stroke-linejoin="round" ${extra || ''}/>`;
const diamond = (t) => `<g transform="${t || ''}">` + P('12,46 30,28 38,46', '#e0a210') + P('30,28 50,28 50,46 38,46', '#ffe680') + P('50,28 70,28 62,46 50,46', '#fff4b0') + P('70,28 88,46 62,46', '#f2b91c')
  + P('12,46 38,46 50,88', '#c98a08') + P('38,46 50,46 50,88', '#f0b920') + P('50,46 62,46 50,88', '#ffd23c') + P('62,46 88,46 50,88', '#d99a06') + '</g>';
const tall = (t) => `<g transform="${t || ''}">` + P('50,8 26,32 26,74 50,94', '#e0a210') + P('50,8 74,32 74,74 50,94', '#ffd84a') + P('50,8 26,32 50,40 74,32', '#fff4b0') + `<polygon points="33,40 39,37 39,72 33,68" fill="rgba(255,255,235,0.45)"/></g>`;
const ICONS = [
  ['FACETED DIAMOND', 'The classic cut gem, front on: bright crown, gold pavilion.', diamond()],
  ['HEX TOKEN', 'A gold hex coin with a gem struck into it.', P('50,6 88,28 88,72 50,94 12,72 12,28', 'url(#gd)') + P('50,16 79,33 79,67 50,84 21,67 21,33', '#a86a00') + P('50,28 66,50 50,72 34,50', 'url(#gv)') + '<line x1="34" y1="50" x2="66" y2="50" stroke="#fff8c8" stroke-width="1"/><line x1="50" y1="28" x2="50" y2="72" stroke="#fff8c8" stroke-width="0.8" opacity="0.6"/>'],
  ['TALL SHARD', 'One big hexagonal crystal with a lit edge.', tall()],
  ['CRYSTAL CLUSTER', 'A big shard with two leaning ones: reads as a pile of shards.', tall('translate(-2 6) scale(0.62) rotate(-18 50 90)') + tall('translate(38 8) scale(0.62) rotate(16 50 90)') + tall('translate(13 -2) scale(0.9)')],
  ['NEO SLAB', 'A slanted slab chip like the HUD plates, a gold gem inside.', '<polygon points="16,24 96,24 84,76 4,76" fill="#0b1226" stroke="#ffd23c" stroke-width="4" stroke-linejoin="round"/><polygon points="16,24 96,24 84,76 4,76" fill="none" stroke="rgba(255,210,60,0.3)" stroke-width="9" stroke-linejoin="round"/>' + diamond('translate(25 26) scale(0.5)')],
  ['CIRCUIT NODE', 'A hex node on gold traces: the game is a circuit board.', '<g stroke="#ffd23c" stroke-width="3" fill="none" stroke-linecap="round"><path d="M2 50 H20"/><path d="M80 50 H98"/><path d="M50 4 V16"/><path d="M50 84 V96"/></g><g fill="#ffd23c"><circle cx="4" cy="50" r="3.5"/><circle cx="96" cy="50" r="3.5"/><circle cx="50" cy="5" r="3.5"/><circle cx="50" cy="95" r="3.5"/></g>' + P('50,16 76,32 76,68 50,84 24,68 24,32', '#0b1226', 'stroke="#ffd23c" stroke-width="3"') + diamond('translate(31 31) scale(0.38)')],
  ['BROKEN SHARD', 'A jagged glass fragment: a literal shard.', P('44,6 66,30 60,44 78,62 56,94 30,70 36,50 22,30', '#d99a06') + P('44,6 66,30 52,40 36,50 22,30', '#fff4b0') + P('60,44 78,62 56,94 50,60', '#b87400') + P('36,50 52,40 50,60 30,70', '#ffd23c') + P('50,60 56,94 30,70', '#f0b920')],
  ['ISO CUBE GEM', 'A gold cube in the game\'s own isometric view.', P('50,10 88,30 50,50 12,30', '#fff4b0') + P('12,30 50,50 50,92 12,72', '#e0a210') + P('50,50 88,30 88,72 50,92', '#b87400') + '<polyline points="22,34 50,46 78,34" fill="none" stroke="rgba(255,255,255,0.5)" stroke-width="1.2"/>'],
  ['ENERGY DROP', 'A drop of molten gold, with a highlight.', '<path d="M50 6 C50 6 84 44 84 64 A34 34 0 0 1 16 64 C16 44 50 6 50 6 Z" fill="url(#gr)" stroke="rgba(255,248,200,0.6)" stroke-width="1"/><ellipse cx="38" cy="62" rx="6" ry="13" fill="rgba(255,255,240,0.55)" transform="rotate(14 38 62)"/>'],
  ['DATA PLATES', 'Three stacked hex plates, like data chips.', [58, 36, 14].map((y, i) => `<g transform="translate(0 ${y})">` + '<polygon points="50,0 90,14 90,24 50,38 10,24 10,14" fill="#b87400"/>' + `<polygon points="50,0 90,14 50,28 10,14" fill="${['#ffe680', '#fff4b0', '#fffbe0'][i]}" stroke="rgba(255,248,200,0.7)" stroke-width="0.8"/>` + '<polygon points="10,14 50,28 50,38 10,24" fill="#e0a210"/><polygon points="90,14 50,28 50,38 90,24" fill="#c98a08"/></g>').join('')],
  ['SPARK', 'A four-point spark: bright, simple, reads small.', '<path d="M50 4 C52 38 62 48 96 50 C62 52 52 62 50 96 C48 62 38 52 4 50 C38 48 48 38 50 4 Z" fill="url(#gr)" stroke="rgba(255,248,200,0.7)" stroke-width="1"/><path d="M78 14 C79 22 82 25 90 26 C82 27 79 30 78 38 C77 30 74 27 66 26 C74 25 77 22 78 14 Z" fill="#fff4b0"/>'],
  ['HOLO GEM', 'A gem floating over a projector ring: the player floats too.', '<ellipse cx="50" cy="84" rx="34" ry="9" fill="none" stroke="#ffd23c" stroke-width="3"/><ellipse cx="50" cy="84" rx="22" ry="5.5" fill="rgba(255,210,60,0.25)" stroke="rgba(255,210,60,0.6)" stroke-width="1.5"/><g stroke="rgba(255,226,120,0.5)" stroke-width="1.4"><line x1="30" y1="82" x2="38" y2="52"/><line x1="70" y1="82" x2="62" y2="52"/></g>' + diamond('translate(20 -6) scale(0.6)')],
  ['TETRA PRISM', 'A three-sided pyramid gem, sharp and modern.', P('50,8 14,76 50,92', '#e0a210') + P('50,8 50,92 86,76', '#ffd84a') + P('14,76 50,92 86,76 50,66', '#b87400') + '<line x1="50" y1="8" x2="50" y2="66" stroke="rgba(255,255,230,0.6)" stroke-width="1.2"/>'],
];
const card = (n, [name, note, svg]) => `<div class="card"><div class="n">${n + 1}</div><div class="name">${name}</div><svg class="big" viewBox="0 0 100 100">${svg}</svg><div class="hud"><svg viewBox="0 0 100 100">${svg}</svg><span>1,240</span></div><div class="note">${note}</div></div>`;
const html = `<body style="margin:0;background:#070a14;color:#fff;font-family:'DejaVu Sans',sans-serif"><style>
 body{padding:24px;width:1900px} h1{font:italic 900 46px 'DejaVu Sans';color:#ffe733;margin:0 0 4px} .sub{font:700 18px monospace;color:#8aa0c8;margin-bottom:20px}
 .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
 .card{background:linear-gradient(180deg,#0f1730,#070a14);border:2px solid #1d2b55;padding:14px 16px 16px;position:relative}
 .n{position:absolute;top:6px;left:12px;font:italic 900 54px 'DejaVu Sans';color:#ffe733}
 .name{font:italic 900 22px 'DejaVu Sans';text-align:right;color:#fff;margin-bottom:6px}
 .big{width:190px;height:190px;display:block;margin:0 auto;filter:drop-shadow(0 0 10px rgba(255,214,60,0.5))}
 .hud{display:flex;align-items:center;gap:10px;justify-content:center;margin:10px 0 6px;padding:8px 10px;background:#0a1022;border:1px solid #1d2b55}
 .hud svg{width:58px;height:58px;filter:drop-shadow(0 0 6px rgba(255,214,60,0.55))} .hud span{font:italic 900 34px 'DejaVu Sans';color:#fff}
 .note{font:700 14px monospace;color:#8aa0c8;line-height:1.35;min-height:38px}</style>
 <h1>SHARD ICON OPTIONS</h1><div class="sub">EACH BIG, AND AT HUD SIZE BESIDE THE NUMBER. PICK A NUMBER.</div>
 <svg width="0" height="0" style="position:absolute">${defs}</svg>
 <div class="grid">${ICONS.map((ic, i) => card(i, ic)).join('')}</div></body>`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1950, height: 1400 } }); await p.setContent(html); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT, fullPage: true }); await b.close(); console.log('wrote', OUT);
})();
