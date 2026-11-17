// TEN DIRECTIONS FOR THE GAME'S LOOK AND COMBAT (design/style-evolution; Proposed, drafts for the owner, nothing in the game): renders the same moment of play,
// built in 3D from the game's own map and models (scene.js), in each style (styles.js), with that direction's combat overlay.
//   node design/style-evolution/export.js <dir>/sewers.json                      the map, from the game (run once)
//   node design/style-evolution/render.js <three-dir> <dir> [style ids...]        <dir>/<id>.png for each style (all ten without ids), at 1600 x 1120
// <three-dir>: an unpacked three@0.128.0 npm package (as design/evolutions/bake.js uses). Pictures go to <dir> (the scratchpad), never into the repo.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), THREE_DIR = process.argv[2], OUT = process.argv[3], ONLY = process.argv.slice(4);
const W = 1600, H = 1120;
const rd = f => fs.readFileSync(f, 'utf8');
const formsFiles = ['forms-core.js'].concat(fs.readdirSync(path.join(ROOT, 'design/evolutions')).filter(f => /^forms\d+\.js$/.test(f)).sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5))));
const forms = formsFiles.map(f => rd(path.join(ROOT, 'design/evolutions', f))).join('\n');
const scene = rd(path.join(__dirname, 'scene.js')), styles = rd(path.join(__dirname, 'styles.js')) + (process.env.STYLE_PATCH ? '\n' + rd(process.env.STYLE_PATCH) : '');   // (STYLE_PATCH: a file of changes to try on the styles)
const EX = ['postprocessing/EffectComposer.js', 'postprocessing/Pass.js', 'shaders/CopyShader.js', 'postprocessing/ShaderPass.js', 'postprocessing/MaskPass.js', 'postprocessing/RenderPass.js',
  'shaders/LuminosityHighPassShader.js', 'postprocessing/UnrealBloomPass.js', 'shaders/BokehShader.js', 'postprocessing/BokehPass.js', 'math/SimplexNoise.js', 'shaders/SSAOShader.js', 'postprocessing/SSAOPass.js',
  'shaders/HorizontalTiltShiftShader.js', 'shaders/VerticalTiltShiftShader.js', 'shaders/VignetteShader.js', 'shaders/FXAAShader.js', 'effects/OutlineEffect.js', 'math/MeshSurfaceSampler.js', 'shaders/FilmShader.js', 'postprocessing/FilmPass.js'].filter(f => fs.existsSync(path.join(THREE_DIR, 'package/examples/js', f)));
const FONTS = [['BV Titan', 'titan-one.woff2'], ['BV Bangers', 'bangers.woff2'], ['BV Barlow', 'barlow-condensed-black-italic.woff2'], ['BV Chakra', 'chakra-petch-bold-italic.woff2'], ['BV Pixel', 'pixelify-sans-bold.woff'], ['BV Cinzel', 'cinzel-decorative-black.woff2']];
const page = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS.map(f => `@font-face { font-family: "${f[0]}"; src: url("fonts/battle/${f[1]}"); }`).join('\n')}</style></head><body style="margin:0;background:#000">
<script src="three.min.js"></script>${EX.map(f => `<script src="ex/${f}"></script>`).join('')}
<script>
window.__render = async function (map, styleId, Wpx, Hpx) {
${forms}
{   // (the scene and the styles in a block of their own: the forms' code declares names of its own at this level)
${scene}
${styles}
  await Promise.all(${JSON.stringify(FONTS.map(f => f[0]))}.map(f => document.fonts.load('40px "' + f + '"').catch(() => null)));
  const S = STYLES[styleId]; if (!S) throw new Error('no style ' + styleId);
  const renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); renderer.setPixelRatio(1); renderer.setSize(Wpx, Hpx, false);
  renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = S.toneMapping === undefined ? T.ACESFilmicToneMapping : S.toneMapping; renderer.toneMappingExposure = S.exposure || 1;
  renderer.shadowMap.enabled = S.shadows !== false; renderer.shadowMap.type = T.PCFSoftShadowMap;
  const scene3 = new T.Scene(), P = S.palette(); P.renderer = renderer; if (S.studio !== false) scene3.environment = studioEnv(renderer);
  if (S.env) S.env(scene3, renderer, P);
  scene3.add(S.world ? S.world(P) : buildWorld(P));
  const cast = buildCast(P); if (S.cast) S.cast(cast, scene3, P); scene3.add(cast.g);
  const fx = buildFx(P); if (S.fx) S.fx(fx, scene3, P); scene3.add(fx.g);
  S.lights(scene3, P);
  if (S.decals) S.decals(scene3, P);
  const cam = S.camera(Wpx, Hpx); scene3.updateMatrixWorld(true); if (S.late) S.late(cast, scene3, cam, P);
  const project = (x, y, z) => { const v = new T.Vector3(x, y, z).project(cam); return [(v.x + 1) / 2 * Wpx, (1 - v.y) / 2 * Hpx]; };
  if (S.before) S.before(scene3, cam, P, project);
  (S.compose ? S.compose(renderer, scene3, cam, Wpx, Hpx, P) : () => renderer.render(scene3, cam))();
  console.log('[info] calls ' + renderer.info.render.calls + ', triangles ' + renderer.info.render.triangles + ', programs ' + (renderer.info.programs || []).length + ', scene objects ' + (() => { let n = 0; scene3.traverse(() => n++); return n; })());
  const out = document.createElement('canvas'); out.width = Wpx; out.height = Hpx; const g = out.getContext('2d'); g.drawImage(renderer.domElement, 0, 0);
  if (S.overlay) S.overlay(g, { W: Wpx, H: Hpx, project, CAST, FOES, fx: fx.parts, cam });
  return out.toDataURL('image/png');
}
};
</script></body></html>`;
(async () => {
  const map = JSON.parse(rd(path.join(OUT, 'sewers.json')));
  const ids = ONLY.length ? ONLY : (rd(path.join(__dirname, 'styles.js')).match(/^style\('([a-z0-9]+)'/gm) || []).map(s => s.slice(7, -1));
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const id of ids) {
    const p = await b.newPage({ viewport: { width: 800, height: 600 } });
    const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); else if (process.env.STYLE_DEBUG) console.log('  ' + m.type() + ': ' + m.text().slice(0, 300)); });
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
      const url = await p.evaluate(([m, id, w, h]) => window.__render(m, id, w, h), [map, id, W, H]);
      fs.writeFileSync(path.join(OUT, id + '.png'), Buffer.from(url.split(',')[1], 'base64'));
      console.log(id + ': ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s' + (errs.length ? '  errors: ' + errs.slice(0, 3).join(' | ') : ''));
    } catch (e) { console.log(id + ': FAILED ' + String(e.message || e).split('\n')[0] + (errs.length ? '  errors: ' + errs.slice(0, 3).join(' | ') : '')); }
    await p.close();
  }
  await b.close();
})();
