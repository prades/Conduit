// THE BASIC ATTACK CARDS AS LAYERS, AND THE GAME'S WAY OF PUTTING ONE TOGETHER (docs/ATTACK-CARD-ART.md §4; the owner, 2026-11-18, of The Sweep family: "Those look good", and
// "wouldn't it be better to have two files and just mash them together whenever the time comes?"). A design proof only: nothing here is in the game.
// A card = the element's world (not a file: the game paints it live, js/energygem.js energyWorld) + its attack type's stroke, in two transparent layers per type:
//   <type>_glow.png  everything that takes the element's colour (the body, the outer glow, speed lines, sparks, rings): white, its strength in its alpha; tinted at run time
//   <type>_core.png  the white-hot head, core and highlights: white, never tinted
// The layers are split from The Sweep's own painter (bake_basic2.js OPTION_A, the stroke alone on a clear canvas): drawn once with the element's colour as pure red and its hot
// tone as pure green, the canvas's mixing being linear in colour, the red that comes out is the glow's share of each pixel and the green the core's.
// COMPOSE, below, is what the game would do at run time, with only cheap canvas steps (no ctx.filter: old iPads' Safari has none): the world from energyWorld drawn tilted (about
// 11 degrees, as on the cards) and dimmed; the glow tinted with the element's colour (js/config.js ELEMENTS) by `source-in` on a canvas of its own (once per card), then added
// over the world ('lighter'); the core added the same way, untinted; then the cards' vignette and darkened foot, in black.
//   node design/cards/attack/compose_basic.js layers <out-dir>                              the ten layer files
//   node design/cards/attack/compose_basic.js compose <layer-dir> <out-dir> <el>[,<el>...]  <type>_<el>.png for each type and element
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const { TYPES, KIT, OPTION_A, SWEEP_MOVES_MAKE, worldSrc } = require('./bake_basic2.js');
const ROOT = path.join(__dirname, '..', '..', '..');
const cfgSrc = fs.readFileSync(path.join(ROOT, 'js', 'config.js'), 'utf8');
const ELEMENTS = eval(cfgSrc.match(/const ELEMENTS = (\[[\s\S]*?\n\]);/)[1]);   // (the game's own colours)
const KINDS = ['slashing', 'piercing', 'crushing', 'projectile', 'elemental'];
const [MODE, A1, A2, A3] = process.argv.slice(2);
const RECIPE = process.env.RECIPE ? JSON.parse(process.env.RECIPE) : [['lighter'], ['lighter']];   // (RECIPE: other ways to try, for looking. Tried on ice and fire against the baked cards, 2026-11-18: both layers added ('lighter') came
// closest, a mean RMSE of 0.035 over the ten; added then laid on, 0.063; laid on alone, 0.046; screen, 0.045)

// the stroke alone, split in two layers (run in the page)
function LAYERS(TY) {
  const W = 450, H = 630, c = OPTION_A({ col: '#ff0000', mid: '#ff0000', hot: '#00ff00', night: '#000000', strokeOnly: true }, TY, W, H);
  const d = c.getContext('2d').getImageData(0, 0, W, H).data, mk = () => { const k = document.createElement('canvas'); k.width = W; k.height = H; return k; };
  const gl = mk(), co = mk(), gi = gl.getContext('2d').createImageData(W, H), ci = co.getContext('2d').createImageData(W, H);
  for (let i = 0; i < W * H * 4; i += 4) { const a = d[i + 3] / 255; gi.data[i] = gi.data[i + 1] = gi.data[i + 2] = 255; gi.data[i + 3] = Math.round(d[i] * a);
    ci.data[i] = ci.data[i + 1] = ci.data[i + 2] = 255; ci.data[i + 3] = Math.round(d[i + 1] * a); }
  gl.getContext('2d').putImageData(gi, 0, 0); co.getContext('2d').putImageData(ci, 0, 0);
  return [gl.toDataURL('image/png'), co.toDataURL('image/png')];
}

// THE GAME'S WAY (run in the page): the world, the glow tinted, the core, the grade
async function COMPOSE(el, colour, glowUrl, coreUrl, RECIPE) {
  const W = 450, H = 630, load = u => new Promise((ok, no) => { if (!u) return ok(null); const i = new Image(); i.onload = () => ok(i); i.onerror = no; i.src = u; });
  const w = energyWorld(el), [scene, motes, bolts, glow, core] = await Promise.all([load(w.scene), load(w.motes), load(w.bolts), load(glowUrl), load(coreUrl)]);
  const mk = () => { const k = document.createElement('canvas'); k.width = W; k.height = H; return k; };
  const out = mk(), g = out.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  // the world, tilted and a little larger (so the tilt leaves no corner bare), its motes (and the storm's lightning) at 0.7, then dimmed
  g.save(); g.translate(W / 2, H / 2); g.rotate(-0.19); const box = [-W * 0.66, -H * 0.62, W * 1.32, H * 1.24];
  g.drawImage(scene, ...box); g.globalAlpha = 0.7; g.drawImage(motes, ...box); if (bolts) g.drawImage(bolts, ...box); g.restore();
  g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, W, H);
  // the glow, tinted (on a canvas of its own: the mask, then the colour 'source-in'), added then laid on; the core the same, untinted
  const tint = mk(), t = tint.getContext('2d'); t.drawImage(glow, 0, 0); t.globalCompositeOperation = 'source-in'; t.fillStyle = colour; t.fillRect(0, 0, W, H);
  [tint, core].forEach((L, i) => { for (const op of RECIPE[i]) { g.globalCompositeOperation = op; g.drawImage(L, 0, 0); } }); g.globalCompositeOperation = 'source-over';
  // the grade: the cards' vignette and the foot darkened for the name
  let gr = g.createRadialGradient(W * 0.5, H * 0.38, 0, W * 0.5, H * 0.38, H * 0.8); gr.addColorStop(0.45, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.7)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  gr = g.createLinearGradient(0, H * 0.6, 0, H); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.65)'); g.fillStyle = gr; g.fillRect(0, H * 0.6, W, H * 0.4);
  return out.toDataURL('image/png');
}

const page = `<!doctype html><html><body style="margin:0;background:#000"><script>
${worldSrc}
${KIT.toString()}
${OPTION_A.toString()}
const SWEEP_MOVES = (${SWEEP_MOVES_MAKE.toString()})();
${LAYERS.toString()}
${COMPOSE.toString()}
</script></body></html>`;

(async () => {
  if (!(MODE === 'layers' && A1) && !(MODE === 'compose' && A1 && A2 && A3)) { console.error('usage: node design/cards/attack/compose_basic.js layers <out-dir> | compose <layer-dir> <out-dir> <el>[,<el>...]'); process.exit(1); }
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('http://card.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://card.local/');
  const save = (f, url) => { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log('wrote ' + f + '  ' + fs.statSync(f).size + ' bytes'); };
  if (MODE === 'layers') for (const k of KINDS) { const [gl, co] = await p.evaluate(TY => LAYERS(TY), TYPES[k]); save(path.join(A1, k + '_glow.png'), gl); save(path.join(A1, k + '_core.png'), co); }
  else for (const el of A3.split(',')) { const E = ELEMENTS.find(e => e.id === el); if (!E) { console.error('no element ' + el); process.exit(1); }
    for (const k of KINDS) { const du = f => 'data:image/png;base64,' + fs.readFileSync(path.join(A1, f)).toString('base64');
      save(path.join(A2, k + '_' + el + '.png'), await p.evaluate(([el, c, g, o, r]) => COMPOSE(el, c, g, o, r), [el, E.color, du(k + '_glow.png'), du(k + '_core.png'), RECIPE])); } }
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  await b.close();
})();
