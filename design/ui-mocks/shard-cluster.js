// node design/ui-mocks/shard-cluster.js <out.png> : ten takes on the crystal-cluster shard icon (No. 4 of shard-icons.js), each big and at HUD size beside the number. Needs playwright + chromium.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const OUT = process.argv[2] || '/tmp/shard-cluster.png';
const defs = `<defs>
 <radialGradient id="glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="rgba(255,226,110,0.85)"/><stop offset="1" stop-color="rgba(255,200,40,0)"/></radialGradient>
 <linearGradient id="rock" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3f55"/><stop offset="1" stop-color="#14172a"/></linearGradient>
 <linearGradient id="pad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3150"/><stop offset="1" stop-color="#0d1226"/></linearGradient>
</defs>`;
const P = (pts, fill, extra) => `<polygon points="${pts}" fill="${fill}" stroke="rgba(255,248,200,0.6)" stroke-width="0.9" stroke-linejoin="round" ${extra || ''}/>`;
// crystals are drawn in a 100 x 100 box with their base at (50,94); cr() places one: x,y = where the base sits, s = scale, rot = lean in degrees, dim = darker (further back)
const KINDS = {
  tall:  () => P('50,8 26,32 26,74 50,94', '#e0a210') + P('50,8 74,32 74,74 50,94', '#ffd84a') + P('50,8 26,32 50,40 74,32', '#fff4b0') + '<polygon points="33,40 39,37 39,72 33,68" fill="rgba(255,255,235,0.45)"/>',
  spike: () => P('50,2 38,34 40,94 50,94', '#e0a210') + P('50,2 62,34 60,94 50,94', '#ffd84a') + P('50,2 38,34 50,38 62,34', '#fff4b0') + '<polygon points="43,40 46,38 46,86 43,84" fill="rgba(255,255,235,0.45)"/>',
  chunk: () => P('26,40 74,40 82,94 18,94', '#c98a08') + P('50,40 74,40 82,94 50,94', '#ffd23c') + P('26,40 50,18 82,28 74,40', '#fff4b0') + P('26,40 50,18 74,40 50,50', '#ffe680') + '<polygon points="30,50 36,48 38,84 32,86" fill="rgba(255,255,235,0.4)"/>',
  bip:   () => P('50,6 22,42 50,48', '#e0a210') + P('50,6 78,42 50,48', '#fff4b0') + P('22,42 50,48 50,94', '#c98a08') + P('50,48 78,42 50,94', '#ffd23c') + '<line x1="50" y1="6" x2="50" y2="94" stroke="rgba(255,255,230,0.5)" stroke-width="1"/>',
  cut:   () => P('12,46 30,28 38,46', '#e0a210') + P('30,28 50,28 50,46 38,46', '#ffe680') + P('50,28 70,28 62,46 50,46', '#fff4b0') + P('70,28 88,46 62,46', '#f2b91c') + P('12,46 38,46 50,88', '#c98a08') + P('38,46 50,46 50,88', '#f0b920') + P('50,46 62,46 50,88', '#ffd23c') + P('62,46 88,46 50,88', '#d99a06'),
};
const cr = (kind, x, y, s, rot, dim) => `<g transform="translate(${x} ${y}) rotate(${rot || 0}) scale(${s}) translate(-50 -94)" ${dim ? `style="filter:brightness(${dim})"` : ''}>${KINDS[kind]()}</g>`;
const sparks = (pts) => pts.map(([x, y, r]) => `<path d="M${x} ${y - r} L${x + r * 0.25} ${y - r * 0.25} L${x + r} ${y} L${x + r * 0.25} ${y + r * 0.25} L${x} ${y + r} L${x - r * 0.25} ${y + r * 0.25} L${x - r} ${y} L${x - r * 0.25} ${y - r * 0.25} Z" fill="#fff8c8"/>`).join('');
const glowBack = '<ellipse cx="50" cy="56" rx="46" ry="44" fill="url(#glow)"/>';
const shadow = (w) => `<ellipse cx="50" cy="94" rx="${w || 34}" ry="5" fill="rgba(0,0,0,0.45)"/>`;
const ICONS = [
  ['TRIO, TIGHTER', 'No. 4 cleaned up: a big centre crystal, two leaning, shared base shadow.', shadow() + cr('tall', 30, 92, 0.62, -14, 0.82) + cr('tall', 70, 92, 0.62, 14, 0.82) + cr('tall', 50, 94, 0.9)],
  ['FAN OF FIVE', 'Five crystals fanned out: reads as a lot of shards.', shadow(38) + cr('tall', 18, 92, 0.46, -32, 0.72) + cr('tall', 82, 92, 0.46, 32, 0.72) + cr('tall', 33, 93, 0.6, -15, 0.85) + cr('tall', 67, 93, 0.6, 15, 0.85) + cr('tall', 50, 95, 0.88)],
  ['TWIN AND CHIP', 'Two big crystals and a small chip in front: a clear silhouette at small size.', shadow(30) + cr('tall', 36, 92, 0.86, -6, 0.88) + cr('tall', 64, 94, 0.74, 9) + cr('chunk', 52, 96, 0.34, 0)],
  ['ON THE ROCK', 'The cluster growing out of a dark rock with gold veins.', '<polygon points="8,88 24,70 50,76 78,68 94,88 70,98 28,98" fill="url(#rock)" stroke="#5a6080" stroke-width="1"/><polyline points="30,90 40,82 52,86" fill="none" stroke="#ffd23c" stroke-width="1.6"/><polyline points="62,92 72,84 82,90" fill="none" stroke="#ffd23c" stroke-width="1.6"/>' + cr('tall', 34, 84, 0.58, -12, 0.82) + cr('tall', 66, 84, 0.52, 14, 0.82) + cr('tall', 50, 86, 0.78)],
  ['GLOW CORE', 'The trio with a warm glow behind it and a few sparks: it looks charged.', glowBack + shadow() + cr('tall', 30, 92, 0.6, -14, 0.85) + cr('tall', 70, 92, 0.6, 14, 0.85) + cr('tall', 50, 94, 0.88) + sparks([[18, 22, 6], [84, 16, 5], [72, 42, 3.5], [24, 48, 3]])],
  ['DOUBLE PYRAMIDS', 'Three double-pointed gems in a heap, the shape the old HUD gems had, held still.', shadow(32) + cr('bip', 30, 92, 0.58, -10, 0.82) + cr('bip', 70, 92, 0.58, 10, 0.82) + cr('bip', 50, 96, 0.84)],
  ['SPIKES', 'Four long thin spikes of different heights: sharp and a little dangerous.', shadow(30) + cr('spike', 26, 94, 0.62, -12, 0.8) + cr('spike', 74, 94, 0.7, 12, 0.8) + cr('spike', 40, 95, 0.86, -3, 0.92) + cr('spike', 60, 96, 0.96, 4)],
  ['CHUNKY', 'Short, stubby, flat-topped crystals: very readable at a glance.', shadow(38) + cr('chunk', 28, 92, 0.58, -4, 0.82) + cr('chunk', 72, 92, 0.58, 4, 0.82) + cr('chunk', 50, 96, 0.84)],
  ['ON A HEX PAD', 'The trio standing on a hex plate like the UI chips.', '<polygon points="50,66 90,80 90,88 50,100 10,88 10,80" fill="url(#pad)" stroke="#ffd23c" stroke-width="2"/><polygon points="50,66 90,80 50,92 10,80" fill="#1b2240" stroke="#ffd23c" stroke-width="1.5"/>' + cr('tall', 33, 80, 0.5, -12, 0.82) + cr('tall', 67, 80, 0.5, 12, 0.82) + cr('tall', 50, 84, 0.72)],
  ['FLOATING TRIO', 'Three crystals hovering over a thin ring and shadow: they float, like the player.', '<ellipse cx="50" cy="92" rx="30" ry="6" fill="none" stroke="#ffd23c" stroke-width="2.4"/><ellipse cx="50" cy="92" rx="30" ry="6" fill="rgba(255,210,60,0.18)"/>' + cr('tall', 32, 76, 0.5, -14, 0.82) + cr('tall', 68, 76, 0.5, 14, 0.82) + cr('tall', 50, 80, 0.74)],
];
const card = (n, [name, note, svg]) => `<div class="card"><div class="n">${n + 1}</div><div class="name">${name}</div><svg class="big" viewBox="0 0 100 100">${svg}</svg><div class="hud"><svg viewBox="0 0 100 100">${svg}</svg><span>1,240</span></div><div class="note">${note}</div></div>`;
const html = `<body style="margin:0;background:#070a14;color:#fff;font-family:'DejaVu Sans',sans-serif"><style>
 body{padding:24px;width:1900px} h1{font:italic 900 46px 'DejaVu Sans';color:#ffe733;margin:0 0 4px} .sub{font:700 18px monospace;color:#8aa0c8;margin-bottom:20px}
 .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
 .card{background:linear-gradient(180deg,#0f1730,#070a14);border:2px solid #1d2b55;padding:14px 16px 16px;position:relative}
 .n{position:absolute;top:6px;left:12px;font:italic 900 54px 'DejaVu Sans';color:#ffe733}
 .name{font:italic 900 22px 'DejaVu Sans';text-align:right;color:#fff;margin-bottom:6px}
 .big{width:200px;height:200px;display:block;margin:0 auto;filter:drop-shadow(0 0 10px rgba(255,214,60,0.45))}
 .hud{display:flex;align-items:center;gap:10px;justify-content:center;margin:10px 0 6px;padding:8px 10px;background:#0a1022;border:1px solid #1d2b55}
 .hud svg{width:64px;height:64px;filter:drop-shadow(0 0 6px rgba(255,214,60,0.55))} .hud span{font:italic 900 34px 'DejaVu Sans';color:#fff}
 .note{font:700 14px monospace;color:#8aa0c8;line-height:1.35;min-height:38px}</style>
 <h1>CRYSTAL CLUSTER: TEN TAKES</h1><div class="sub">ALL BUILT ON NO. 4. EACH BIG, AND AT HUD SIZE BESIDE THE NUMBER. PICK A NUMBER.</div>
 <svg width="0" height="0" style="position:absolute">${defs}</svg>
 <div class="grid">${ICONS.map((ic, i) => card(i, ic)).join('')}</div></body>`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1950, height: 1400 } }); await p.setContent(html); await p.waitForTimeout(300);
  await p.screenshot({ path: OUT, fullPage: true }); await b.close(); console.log('wrote', OUT);
})();
