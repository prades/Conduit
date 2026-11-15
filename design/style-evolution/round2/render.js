// ROUND 2 · TEN DIRECTIONS, REIMAGINED (design/style-evolution/round2; Proposed, drafts for the owner, nothing in the game): renders the raid on the Crystal,
// built in 3D from the game's own map and models (chamber.js), in each direction's look with its way of fighting drawn over it (styles.js).
//   node design/style-evolution/round2/export.js <dir>/chamber.json                    the map, from the game (run once)
//   node design/style-evolution/round2/render.js <three-dir> <dir> [style ids...]      <dir>/<id>.png for each (all ten without ids): the picture, 1600 x 1120, over a caption strip
// <three-dir>: an unpacked three@0.128.0 npm package (as design/evolutions/bake.js uses). Pictures go to <dir> (the scratchpad), never into the repo.
// STYLE_PATCH=<file.js>: its code is added after the styles (to try a change); STYLE_DEBUG=1: the page's console, and each picture's draw calls.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../../..'), THREE_DIR = process.argv[2], OUT = process.argv[3], ONLY = process.argv.slice(4);
const W = 1600, H = 1120, FOOT = 132;
const rd = f => fs.readFileSync(f, 'utf8');
const EVO = path.join(ROOT, 'design/evolutions'), MODELS = path.join(ROOT, 'design/props/models');
const forms = ['forms-core.js'].concat(fs.readdirSync(EVO).filter(f => /^forms\d+\.js$/.test(f)).sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5)))).map(f => rd(path.join(EVO, f))).join('\n');
const modelFiles = fs.readdirSync(MODELS).filter(f => f.endsWith('.js')).sort(), props = modelFiles.filter(f => f.startsWith('_')).concat(modelFiles.filter(f => !f.startsWith('_'))).map(f => rd(path.join(MODELS, f))).join('\n');
const kit = rd(path.join(__dirname, 'kit.js')), chamber = rd(path.join(__dirname, 'chamber.js')), styles = rd(path.join(__dirname, 'styles.js')) + (process.env.STYLE_PATCH ? '\n' + rd(process.env.STYLE_PATCH) : '');
const EX = ['postprocessing/EffectComposer.js', 'postprocessing/Pass.js', 'shaders/CopyShader.js', 'postprocessing/ShaderPass.js', 'postprocessing/MaskPass.js', 'postprocessing/RenderPass.js',
  'shaders/LuminosityHighPassShader.js', 'postprocessing/UnrealBloomPass.js', 'shaders/BokehShader.js', 'postprocessing/BokehPass.js',
  'shaders/HorizontalTiltShiftShader.js', 'shaders/VerticalTiltShiftShader.js', 'objects/Reflector.js'].filter(f => fs.existsSync(path.join(THREE_DIR, 'package/examples/js', f)));
const FONTS = [['BV Titan', 'titan-one.woff2'], ['BV Bangers', 'bangers.woff2'], ['BV Barlow', 'barlow-condensed-black-italic.woff2'], ['BV Chakra', 'chakra-petch-bold-italic.woff2'], ['BV Pixel', 'pixelify-sans-bold.woff'], ['BV Cinzel', 'cinzel-decorative-black.woff2']];
const page = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS.map(f => `@font-face { font-family: "${f[0]}"; src: url("fonts/battle/${f[1]}"); }`).join('\n')}</style></head><body style="margin:0;background:#000">
<script src="three.min.js"></script>${EX.map(f => `<script src="ex/${f}"></script>`).join('')}
<script>
window.__render = async function (map, styleId, Wpx, Hpx, FOOT) {
${forms}
const px = h => h / 73.48469228349533, PROPS = {};   // (the props' models: a height in game pixels, in units; each family registers itself)
(function () {
${props}
})();
{   // (the kit, the chamber and the styles in a block of their own: the forms' code declares names of its own at this level)
${kit}
${chamber}
${styles}
  await Promise.all(${JSON.stringify(FONTS.map(f => f[0]))}.map(f => document.fonts.load('40px "' + f + '"').catch(() => null)));
  const S = STYLES[styleId]; if (!S) throw new Error('no style ' + styleId);
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(Wpx, Hpx, false);
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = S.toneMapping === undefined ? T.ACESFilmicToneMapping : S.toneMapping; renderer.toneMappingExposure = S.exposure || 1;
  renderer.shadowMap.enabled = S.shadows !== false; renderer.shadowMap.type = S.shadowType || T.PCFSoftShadowMap;
  const scene3 = new T.Scene(), env = studioEnv(renderer), P = S.palette ? S.palette() : basePalette(), units = S.units ? S.units() : RAID();
  const ctx = { renderer, W: Wpx, H: Hpx, map, env, P, S, units, scene: scene3, portraits: {} };
  if (S.studio !== false) scene3.environment = S.studio > 0 ? studioEnv(renderer, S.studio) : env;
  scene3.background = new T.Color(0x05080b); if (S.env) S.env(scene3, ctx);
  const world = buildChamber(P, S.room || {}); ctx.world = world; scene3.add(world.g);
  const cast = buildCast(P, units); ctx.cast = cast; scene3.add(cast.g); scene3.updateMatrixWorld(true);
  for (const k of Object.keys(cast.parts)) ctx.portraits[k] = portraitOf(renderer, env, cast.parts[k], 256, units[k].portrait);   // (before the look changes anyone's materials: the HUD's pictures are the game's own art)
  if (S.world) S.world(world, scene3, ctx);
  if (S.cast) S.cast(cast, scene3, ctx);
  if (S.fx) S.fx(scene3, ctx);
  if (S.lights) S.lights(scene3, ctx);
  if (S.decals) S.decals(scene3, ctx);
  const cam = S.camera(Wpx, Hpx, ctx); ctx.cam = cam; scene3.updateMatrixWorld(true);
  ctx.project = (x, y, z, c) => { const v = new T.Vector3(x, y, z).project(c || cam); return [(v.x + 1) / 2 * Wpx, (1 - v.y) / 2 * Hpx]; };
  ctx.head = (key, up) => { const u = units[key]; return ctx.project(u.at[0], (u.top || 1) + (up || 0), u.at[1]); };
  ctx.feet = key => { const u = units[key]; return ctx.project(u.at[0], 0.02, u.at[1]); };
  ctx.shoot = c => { (S.compose ? S.compose(renderer, scene3, c, Wpx, Hpx, ctx) : () => { renderer.setRenderTarget(null); renderer.render(scene3, c); })(); const cv = document.createElement('canvas'); cv.width = Wpx; cv.height = Hpx; cv.getContext('2d').drawImage(renderer.domElement, 0, 0); return cv; };
  if (S.late) S.late(ctx);
  const shot = ctx.shoot(cam);
  console.log('[info] ' + styleId + ': calls ' + renderer.info.render.calls + ', triangles ' + renderer.info.render.triangles + ', programs ' + (renderer.info.programs || []).length);
  const out = document.createElement('canvas'); out.width = Wpx; out.height = Hpx + (S.bare ? 0 : FOOT); const g = out.getContext('2d'); g.drawImage(shot, 0, 0);
  if (S.overlay) { g.save(); g.beginPath(); g.rect(0, 0, Wpx, Hpx); g.clip(); S.overlay(g, ctx); g.restore(); }
  if (!S.bare) footer(g, Wpx, Hpx, FOOT, S);
  return out.toDataURL('image/png');
}
};
</script></body></html>`;
(async () => {
  const map = JSON.parse(rd(path.join(OUT, 'chamber.json')));
  const ids = ONLY.length ? ONLY : (rd(path.join(__dirname, 'styles.js')).match(/^style\('([a-z0-9]+)'/gm) || []).map(s => s.slice(7, -1)).filter(id => id !== 'base');   // (`base`, the plain room, only by name)
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const id of ids) {
    const p = await b.newPage({ viewport: { width: 800, height: 600 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); else if (process.env.STYLE_DEBUG && !/GPU stall/.test(m.text())) console.log('  ' + m.type() + ': ' + m.text().slice(0, 300)); });
    await p.route('http://style.local/**', r => {
      const u = new URL(r.request().url()).pathname;
      if (u === '/') return r.fulfill({ contentType: 'text/html', body: page });
      if (u === '/three.min.js') return r.fulfill({ contentType: 'application/javascript', body: rd(path.join(THREE_DIR, 'package/build/three.min.js')) });
      if (u.startsWith('/ex/')) return r.fulfill({ contentType: 'application/javascript', body: rd(path.join(THREE_DIR, 'package/examples/js', u.slice(4))) });
      if (u.startsWith('/fonts/')) return r.fulfill({ body: fs.readFileSync(path.join(ROOT, u.slice(1))) });
      return r.fulfill({ status: 404, body: '' });
    });
    await p.goto('http://style.local/');
    const t0 = Date.now();
    try {
      const url = await p.evaluate(([m, id, w, h, f]) => window.__render(m, id, w, h, f), [map, id, W, H, FOOT]);
      fs.writeFileSync(path.join(OUT, id + '.png'), Buffer.from(url.split(',')[1], 'base64'));
      console.log(id + ': ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s' + (errs.length ? '  errors: ' + errs.slice(0, 3).join(' | ') : ''));
    } catch (e) { console.log(id + ': FAILED ' + String(e.message || e).split('\n').slice(0, 3).join(' / ') + (errs.length ? '  errors: ' + errs.slice(0, 3).join(' | ') : '')); }
    await p.close();
  }
  await b.close();
})();
