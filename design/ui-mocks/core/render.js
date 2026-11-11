// DRAFT HARNESS (not the game's code): renders THE CORE (core-widget.js; its header says what it is) in each of its states to transparent PNGs, at 2x. The repo's files are read, never written.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../../..'), EV = ROOT + '/design/evolutions/', HERE = __dirname;
const rd = f => fs.readFileSync(f, 'utf8');
const arg = (k, d) => { const a = process.argv.find(x => x.startsWith('--' + k + '=')); return a ? a.split('=')[1] : d; };
const FORM = +arg('form', 814), OUT = path.resolve(arg('out', '/tmp/core-draft')), THREE_JS = arg('three', '/tmp/threepkg/package/build/three.min.js'), CLS = arg('cls', 'none');
const BOX = { w: +arg("w", 340), h: +arg("h", 270) };
const CLASS_COL = { none: '#19e6c1', gunslinger: '#ffb347', technomancer: '#31e8ff', mutator: '#c06bff' };
const gemSvg = (() => { const src = rd(ROOT + '/js/hudgems.js'); const fn = new Function(src.split('function buildShardGems')[0] + '; return SHARD_ICON_SVG;'); return fn(); })();
const CSS = `
@font-face { font-family: "BV Barlow"; src: url("/fonts/battle/barlow-condensed-black-italic.woff2") format("woff2"); font-style: italic; font-weight: 900; }
:root { --neo-font: "DejaVu Sans", "Segoe UI", system-ui, sans-serif; --c: ${CLASS_COL[CLS] || '#19e6c1'}; --gold: #ffe733; }
html, body { margin: 0; background: transparent; }
#core { position: relative; width: ${BOX.w}px; height: ${BOX.h}px; font-family: var(--neo-font); font-style: italic; font-weight: 900; color: #fff; overflow: visible; }
#cv { position: absolute; left: 0; top: 0; z-index: 2; pointer-events: none; }
.slab { position: absolute; right: 2px; bottom: 2px; width: ${BOX.w - 34}px; height: 50px; z-index: 3; }
.slab::before { content: ""; position: absolute; inset: 0; transform: skewX(-12deg); background: linear-gradient(180deg, #121a34, #05070f); border: 2px solid var(--c); box-shadow: 0 0 14px var(--c), inset 0 0 12px rgba(0,0,0,0.6); }
.slab::after { content: ""; position: absolute; left: 8px; top: 7px; bottom: 7px; width: 4px; transform: skewX(-12deg); background: var(--c); box-shadow: 0 0 8px var(--c); }
.cells { position: absolute; left: 24px; top: 14px; display: flex; gap: 6px; z-index: 3; }
.cell { width: 30px; height: 20px; transform: skewX(-12deg); background: #161b2a; border: 1px solid #2a3348; box-sizing: border-box; position: relative; }
.cell.g { background: linear-gradient(180deg, #5cffd9, #19b894); border-color: #9fffe9; box-shadow: 0 0 10px #19e6c1; }
.cell.y { background: linear-gradient(180deg, #fff27a, #e0c200); border-color: #fff8b0; box-shadow: 0 0 10px #ffe733; }
.cell.r { background: linear-gradient(180deg, #ff6a5a, #d4241a); border-color: #ffb0a8; box-shadow: 0 0 14px #ff3b2b; }
.cell.lost { background: rgba(255,60,40,0.18); border: 2px solid #ff5a4a; box-shadow: 0 0 14px #ff3b2b; }
.cell.lost::before, .cell.lost::after { content: ""; position: absolute; width: 9px; height: 7px; background: #ff7a6a; box-shadow: 0 0 6px #ff3b2b; }
.cell.lost::before { left: 30px; top: -12px; transform: rotate(28deg); } .cell.lost::after { left: 38px; top: 8px; transform: rotate(-20deg); width: 6px; height: 5px; }
.cell.gain { outline: 3px solid #c8ffdc; outline-offset: 1px; box-shadow: 0 0 20px #7dffa8; }
.count { position: absolute; right: 26px; top: 0; height: 50px; display: flex; align-items: center; gap: 2px; z-index: 3; }
.count .gem { width: 42px; height: 42px; filter: drop-shadow(0 0 7px rgba(255,214,60,0.55)); } .count .gem svg { width: 100%; height: 100%; display: block; overflow: visible; }
.count b { font: italic 900 36px/1 "BV Barlow", var(--neo-font); letter-spacing: 0.5px; color: #fff; text-shadow: 0 0 12px var(--gold), 0 2px 0 #000; }
.count em { position: absolute; right: -6px; top: -26px; font: italic 900 24px/1 "BV Barlow", var(--neo-font); color: #ffe733; text-shadow: 0 0 10px #ffb300, 0 2px 0 #000; }
.lbl { position: absolute; transform: translate(-50%, 0); z-index: 3; font-size: 11px; letter-spacing: 0.08em; color: #c8d6e8; text-shadow: 0 1px 3px #000, 0 0 6px #000; white-space: nowrap; }
.lbl.on { color: #b6ffd0; text-shadow: 0 0 8px #33ff88, 0 1px 3px #000; } #lblStun.on { color: #fff3a0; text-shadow: 0 0 8px #ffcc00, 0 1px 3px #000; } .lbl.rest { color: #8c96a8; font-size: 13px; }
#pack { position: absolute; transform: translate(-6%, -100%); z-index: 3; padding: 3px 10px 3px 9px; font-size: 12px; letter-spacing: 0.06em; color: #e8fff9; white-space: nowrap; }
#pack::before { content: ""; position: absolute; inset: 0; z-index: -1; transform: skewX(-12deg); background: #05070f; border: 2px solid var(--c); box-shadow: 0 0 8px var(--c); }
#pack b { color: var(--c); margin-left: 4px; } #pack.open::before { background: var(--c); } #pack.open { color: #05070f; } #pack.open b { color: #05070f; }
#surge { position: absolute; transform: translate(-50%, -100%); z-index: 3; padding: 3px 12px; font-size: 12px; letter-spacing: 0.08em; color: #ffe9a0; white-space: nowrap; text-shadow: 0 1px 3px #000; }
#surge::before { content: ""; position: absolute; inset: 0; z-index: -1; transform: skewX(-12deg); background: rgba(5,7,15,0.85); border: 1px solid rgba(255,216,74,0.7); }
#surge.ready { font-size: 15px; color: #05070f; text-shadow: none; } #surge.ready::before { background: linear-gradient(180deg, #fff27a, #ffc21a); border: 2px solid #fff6b8; box-shadow: 0 0 18px #ffd84a; }
#surge.surging { color: #fff6c8; text-shadow: 0 0 8px #ffc21a; } #surge:empty { display: none; }
#siphon { position: absolute; transform: translate(-50%, -50%); z-index: 3; width: 26px; height: 26px; line-height: 26px; text-align: center; font-size: 16px; font-style: normal; color: #ffe733; text-shadow: 0 0 8px #ffb300; }
#siphon::before { content: ""; position: absolute; inset: 0; z-index: -1; border-radius: 50%; background: #05070f; border: 1.5px solid rgba(255,216,74,0.7); }
#core.isko .slab::before { border-color: #ff5a4a; box-shadow: 0 0 14px #ff3b2b; } #core.isko .slab::after { background: #ff5a4a; }
#core.islow .slab::before { border-color: #ff5a4a; box-shadow: 0 0 16px #ff3b2b, inset 0 0 16px rgba(255,40,30,0.35); }
#core.isready .slab::before, #core.issurging .slab::before { border-color: #ffe733; box-shadow: 0 0 18px #ffd84a; }
`;
const HTML = `<div id="core"><div class="slab"><div class="cells"><i class="cell"></i><i class="cell"></i><i class="cell"></i></div><div class="count"><span class="gem">${gemSvg}</span><b id="count">5,859</b><em id="plus"></em></div></div>
<canvas id="cv"></canvas><div class="lbl" id="lblGuard">GUARD</div><div class="lbl" id="lblStun">STUN</div><div id="pack">PACK<b>8</b></div><div id="surge"></div><div id="siphon">⌁</div></div>`;
const page = `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${HTML}
<script src="/three.min.js"></script><script>window.__BOX_W = ${BOX.w}; window.__BOX_H = ${BOX.h}; window.__FORM = ${FORM};
(function () {\n${rd(EV + 'forms-core.js')}\n${rd(EV + 'forms2.js')}\n${rd(EV + 'forms29.js')}\n${rd(EV + 'forms30.js')}\n${rd(HERE + '/core-widget.js')}\n})();</script></body></html>`;
module.exports = { page, CSS, HTML, BOX, OUT, THREE_JS, ROOT };
if (require.main === module) (async () => {
  const states = (process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'calm,hit,danger,heal,shards,ready,surging,guard,stun,rest,pack,ko').split(',');
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const p = await b.newPage({ viewport: { width: BOX.w + 40, height: BOX.h + 40 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.route('http://core.local/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: rd(THREE_JS) }));
  await p.route('http://core.local/fonts/**', r => r.fulfill({ contentType: 'font/woff2', body: fs.readFileSync(ROOT + new URL(r.request().url()).pathname) }));
  await p.route('http://core.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://core.local/'); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  for (const s of states) {
    await p.evaluate(s => { CORE.set(s); CORE.render(); }, s);
    const el = await p.$('#core'); await el.screenshot({ path: path.join(OUT, s + '.png'), omitBackground: true });
  }
  console.log(JSON.stringify({ states, errs: errs.slice(0, 5) }));
  await b.close();
})();
