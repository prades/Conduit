// THE PICTURES FOR PLAYERS (build 2026-11-11c; tools/images.js, js/imgmap.js, js/config.js imgSrc). The owner, 2026-11-11: "Yes, do the images next" (a picture's address changes only when the picture
// does, so a new build does not download every picture again; and the big pictures in a smaller format with no visible loss).
//   FRESH       js/imgmap.js is what tools/images.js makes from the pictures as they are: every picture the game loads (img/{cards,cave,evo,fx,hd,hud,props}/*.png) at its PNG's fingerprint now, each WebP
//               it names there, none left over; game.html preloads the props sheets at the map's addresses; the page loads the map after js/config.js; the stamp runs the tool before the bundler
//   EXACT       each WebP is lossless (every channel of every pixel its PNG's, the colour under a clear pixel included: ImageMagick, when it is installed), smaller than its PNG, and a plain lossless
//               WebP with nothing else in it; a picture left a PNG is one whose WebP would be bigger
//   THE ASKING  every loader asks for its picture at the map's address; every picture the game names is in the map; one it has not got is asked for at its path and the build
//   THE BROWSER in a real browser every WebP the map names loads at its PNG's size and looks as its PNG does: opaque and clear pixels and every alpha exact; drawn over the game's dark, a
//               partly clear pixel at most 1 of 255 off (Chromium's WebP decoder rounds those its own way; the files themselves are exact: EXACT)
const fs = require('fs'), path = require('path'), os = require('os'), vm = require('vm');
const { execFile, execFileSync } = require('child_process');
const { makeBrowserSandbox, scriptOrder } = require('./domstub');
const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const I = require(path.join(ROOT, 'tools/images.js'));
let failures = 0;
function group(n) { console.log('\n' + n); }
async function check(name, fn) { try { await fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
const MAP = I.current(), PICS = I.pictures(), file = a => a.replace(/\?.*/, ''), WEBP = PICS.filter(p => (MAP[p] || '').indexOf('.webp?') > 0);
const magick = (() => { try { execFileSync('convert', ['-version'], { stdio: 'ignore' }); return true; } catch (e) { return false; } })();
const rgba = f => new Promise((res, rej) => execFile('convert', [path.join(ROOT, f), '-depth', '8', 'rgba:-'], { encoding: 'buffer', maxBuffer: 1024 * 1024 * 1024 }, (e, out) => e ? rej(e) : res(out)));
async function pool(items, n, fn) { const q = items.slice(), out = []; await Promise.all(Array.from({ length: n }, async () => { while (q.length) { const it = q.shift(); out.push(await fn(it)); } })); return out; }

(async () => {
    group('FRESH (tools/images.js)');
    await check('js/imgmap.js is what tools/images.js makes from the pictures as they are: every picture the game loads, each at its PNG\'s fingerprint now, each WebP it names there, none left over (else: node tools/images.js, or stamp the build)', () => {
        const E = I.expected();
        same(E.stale.join(', '), '', 'pictures changed since the map was made'); same(E.orphans.join(', '), '', 'WebP copies without their picture');
        same(Object.keys(MAP).sort().join(), PICS.join(), 'the pictures in the map'); ok(rd(I.MAP_FILE) === I.text(E.map), 'js/imgmap.js is not what the tool writes');
        for (const p of PICS) { ok(MAP[p].endsWith('?v=' + I.print(p)), p + ': not its fingerprint'); ok(fs.existsSync(path.join(ROOT, file(MAP[p]))), MAP[p] + ' is not a file'); ok(file(MAP[p]) === p || file(MAP[p]) === p.replace(/\.png$/, '.webp'), p + ' is loaded from ' + MAP[p]); }
        ok(WEBP.length > PICS.length * 0.9, 'only ' + WEBP.length + ' of ' + PICS.length + ' are WebP');
    });
    await check('game.html preloads the props sheets at the map\'s addresses (play.html is game.html\'s head: tests/bundle.js)', () => {
        const h = rd('game.html'), links = [...h.matchAll(/<link rel="preload" as="image" href="([^"]+)">/g)].map(m => m[1]);
        ok(links.length >= 10, 'only ' + links.length + ' preloads'); same(I.preloaded(h, MAP), h, 'a preload at another address');
        for (const l of links) ok(Object.values(MAP).includes(l), l + ' is not an address in the map');
    });
    await check('the page loads js/imgmap.js right after js/config.js (which has imgSrc), and the stamp brings the pictures up to date before it bundles', () => {
        const tags = [...rd('game.html').matchAll(/<script src="(js\/[^"?]+)\?v=/g)].map(m => m[1]); same(tags.slice(0, 2).join(), 'js/config.js,js/imgmap.js', 'the first two scripts');
        const st = rd('tools/stamp.js'), a = st.indexOf("require('./images.js').write("), b = st.indexOf("require('./bundle.js').write(");
        ok(a > 0 && b > a, 'tools/stamp.js does not run tools/images.js before tools/bundle.js');
    });

    group('EXACT (each WebP against its PNG)');
    await check('each WebP the map names is smaller than its PNG and a plain lossless WebP with nothing else in it (no profile, no metadata: the colours as the PNG\'s, which has none either)', () => {
        for (const p of WEBP) {
            const w = file(MAP[p]), b = fs.readFileSync(path.join(ROOT, w)), sp = fs.statSync(path.join(ROOT, p)).size;
            ok(b.length < sp, w + ' is not smaller than its PNG (' + b.length + ' >= ' + sp + ')');
            same(b.toString('latin1', 0, 4) + b.toString('latin1', 8, 12), 'RIFFWEBP', w + ': not a WebP');
            const ch = []; for (let i = 12; i < b.length;) { const n = b.readUInt32LE(i + 4); ch.push(b.toString('latin1', i, i + 4)); i += 8 + n + (n & 1); }
            same(ch.join(), 'VP8L', w + ': its chunks');
        }
        for (const p of PICS) { const b = fs.readFileSync(path.join(ROOT, p)); const ch = []; for (let i = 8; i < b.length;) { const n = b.readUInt32BE(i); ch.push(b.toString('latin1', i + 4, i + 8)); i += 12 + n; } ok(!ch.some(c => /^(gAMA|iCCP|sRGB|cHRM)$/.test(c)), p + ' has colour information (' + ch.join() + '): its WebP would not show it'); }
    });
    if (!magick) console.log('  (no ImageMagick here: the pixels were not compared)');
    else {
        await check('every WebP is lossless: every channel of every pixel is its PNG\'s, the colour under a clear pixel included (' + WEBP.length + ' pictures, decoded by ImageMagick)', async () => {
            const bad = (await pool(WEBP, 4, async p => { const [a, b] = await Promise.all([rgba(p), rgba(file(MAP[p]))]); return a.equals(b) ? null : p; })).filter(Boolean);
            same(bad.join(', '), '', 'pictures whose WebP differs');
        });
        await check('a picture left a PNG is one whose WebP would be bigger (not one left so because ImageMagick was missing)', async () => {
            const left = PICS.filter(p => !WEBP.includes(p)), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'im-'));
            try { for (const p of left) { const t = path.join(dir, 'x.webp'); execFileSync('convert', [path.join(ROOT, p), '-strip', '-define', 'webp:lossless=true', '-define', 'webp:method=6', '-define', 'webp:exact=true', t]); ok(fs.statSync(t).size >= fs.statSync(path.join(ROOT, p)).size, p + ' is a PNG but its WebP would be smaller: node tools/images.js'); } }
            finally { fs.rmSync(dir, { recursive: true, force: true }); }
        });
    }

    group('THE ASKING (js/config.js imgSrc; the loaders)');
    const sb = makeBrowserSandbox({}); sb.Image = function () { return { style: {}, addEventListener() {} }; };
    const ctx = vm.createContext(sb); for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const J = s => JSON.parse(vm.runInContext('JSON.stringify(' + s + ')', ctx));
    await check('every loader asks for its picture at the map\'s address: a props sheet, the player\'s and an egg\'s HD sheets, a form\'s sheet and its ground, a cave room\'s walls and the rubble, an effect, a card\'s item', () => {
        const got = J(`(function(){ const o = {};
            _psImg("lab"); o["img/props/lab.png"] = _psImgs.lab && _psImgs.lab.src;
            _hdImg("player"); o["img/hd/player.png"] = _hdImgs.player && _hdImgs.player.src; _hdImg("egg_fire"); o["img/hd/egg_fire.png"] = _hdImgs.egg_fire && _hdImgs.egg_fire.src;
            const d = EVOLUTIONS.thunderhead; delete d._img; _evoImg(d); o[d.sheet] = d._img && d._img.src;
            const g = Object.values(EVOLUTIONS).find(function (e) { return e.ground; }); delete g._gimg; _evoGroundImg(g); o[g.ground] = g._gimg && g._gimg.src;
            const room = Object.keys(CAVE_ATLAS.rooms)[0]; delete _caveImgs[room]; _caveImg(room); o[CAVE_ATLAS.rooms[room].sheet] = _caveImgs[room] && _caveImgs[room].src;
            _caveRubbleImg = undefined; _caveRubbleSheet(); o[CAVE_RUBBLE.sheet] = _caveRubbleImg && _caveRubbleImg.src;
            delete FX3D.pieces.quill._img; _fx3dImg("quill"); o[FX3D.pieces.quill.sheet] = FX3D.pieces.quill._img && FX3D.pieces.quill._img.src;
            o["img/cards/double_cell.png"] = cardArtItemUrl(EQUIP_CARDS.double_cell); return o; })()`);
        same(Object.keys(got).length, 9, 'the loaders tried'); for (const [p, src] of Object.entries(got)) same(src, MAP[p], p);
        ok(Object.values(got).filter(s => /\.webp\?v=/.test(s)).length >= 9, 'most of them are not WebP');
    });
    await check('every picture the game names is in the map: the forms\' sheets and grounds, the side quest\'s hauler, the cave\'s rooms and rubble, the effects, the props, the cards\' items', () => {
        const named = J(`[].concat(Object.values(EVOLUTIONS).map(function (e) { return e.sheet; }), Object.values(EVOLUTIONS).map(function (e) { return e.ground; }).filter(Boolean), [SQ_LOOK.sheet],
            Object.values(CAVE_ATLAS.rooms).map(function (r) { return r.sheet; }), [CAVE_RUBBLE.sheet], Object.values(FX3D.pieces).map(function (p) { return p.sheet; }),
            Object.keys(PROP_ATLAS).map(function (f) { return "img/props/" + f + ".png"; }), CARD_ITEMS.ids.map(function (id) { return "img/cards/" + id + ".png"; }))`);
        ok(named.length > 100, 'only ' + named.length + ' named'); same(named.filter(p => !MAP[p]).join(', '), '', 'pictures not in the map');
    });
    await check('a picture the map has not got (one baked since it was made) is asked for at its path and the build', () => {
        same(J('imgSrc("img/evo/not_baked_yet.png")'), 'img/evo/not_baked_yet.png?v=' + J('BUILD_VERSION'), 'its address');
    });

    group('THE BROWSER (real browser)');
    const bin = findChromium();
    if (!bin) console.log('  (no Chromium here: skipped)');
    else await check('in a real browser every WebP the map names loads at its PNG\'s size and looks as its PNG does: every opaque and every clear pixel exactly its PNG\'s, every pixel\'s alpha too, and drawn over the game\'s dark no value more than 1 of 255 off (a partly clear pixel: Chromium\'s WebP decoder rounds it its own way) (' + WEBP.length + ' pictures)', () => {
        const pairs = WEBP.map(p => [p, MAP[p]]), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'imb-')), page = path.join(dir, 'p.html');
        fs.writeFileSync(page, '<!doctype html><html><head><base href="file://' + ROOT + '/"></head><body><script>var P = ' + JSON.stringify(pairs) + ', out = {};'
            + 'function load(u) { return new Promise(function (res) { var im = new Image(); im.onload = function () { res(im); }; im.onerror = function () { res(null); }; im.src = u; }); }'
            + 'function px(im, w, h, bg) { var c = document.createElement("canvas"); c.width = w; c.height = h; var g = c.getContext("2d", { willReadFrequently: true }); if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); } g.drawImage(im, 0, 0); return g.getImageData(0, 0, w, h).data; }'
            + '(async function () { for (var i = 0; i < P.length; i++) { var a = await load(P[i][0]), b = await load(P[i][1]); if (!a || !b) { out[P[i][0]] = "did not load"; continue; }'
            + '  var w = a.naturalWidth, h = a.naturalHeight; if (b.naturalWidth !== w || b.naturalHeight !== h) { out[P[i][0]] = "is " + b.naturalWidth + "x" + b.naturalHeight + ", its PNG " + w + "x" + h; continue; }'
            + '  var da = px(a, w, h), db = px(b, w, h), alpha = 0, solid = 0, k, j; for (k = 0; k < da.length; k += 4) { if (da[k + 3] !== db[k + 3]) alpha++; else if ((da[k + 3] === 255 || da[k + 3] === 0) && (da[k] !== db[k] || da[k + 1] !== db[k + 1] || da[k + 2] !== db[k + 2])) solid++; }'
            + '  var oa = px(a, w, h, "#060b16"), ob = px(b, w, h, "#060b16"), most = 0; for (k = 0; k < oa.length; k++) { j = Math.abs(oa[k] - ob[k]); if (j > most) most = j; }'
            + '  out[P[i][0]] = alpha ? alpha + " pixels\' alpha differs" : solid ? solid + " opaque or clear pixels differ" : most > 1 ? "drawn over the dark it is " + most + " off" : "same"; }'
            + '  var pre = document.createElement("pre"); pre.id = "__im"; pre.textContent = JSON.stringify(out); document.body.appendChild(pre); })();</script></body></html>');
        let dom = '';
        try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--virtual-time-budget=60000', '--dump-dom', 'file://' + page], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 240000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
        try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
        const m = dom.match(/<pre id="__im">([\s\S]*?)<\/pre>/); ok(m, 'the page produced nothing');
        const out = JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
        same(WEBP.filter(p => out[p] !== 'same').map(p => p + ' ' + (out[p] || 'not reached')).join(', '), '', 'pictures whose WebP does not look as its PNG in the browser');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
