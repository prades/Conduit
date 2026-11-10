// renders a three.js model script to a transparent PNG: node r3d.js <model.js> <out.png> <w> <h>
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs');
const [,, MODEL, OUT, W, H] = process.argv;
const page = `<!doctype html><body style="margin:0"><script src="three.min.js"></script><script>
window.go = async () => { const T = THREE, W=${W}, H=${H};
  const r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setPixelRatio(1); r.setSize(W, H, false); r.setClearColor(0, 0); r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.1;
  r.shadowMap.enabled = true;
  document.body.appendChild(r.domElement);
  ${fs.readFileSync(MODEL, 'utf8')}
  r.render(scene, cam); return r.domElement.toDataURL('image/png'); };
</script></body>`;
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(require('path').join(process.env.THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://r.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://r.local/');
  const d = await p.evaluate(() => window.go());
  fs.writeFileSync(OUT, Buffer.from(d.split(',')[1], 'base64')); console.log('ok', OUT, errs.slice(0, 3)); await b.close();
})();
