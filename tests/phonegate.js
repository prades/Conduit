// PHONES ARE NOT SUPPORTED (build 2026-11-11a; game.html's head: deviceIsPhone, #phoneGate; js/init.js holds the start). The owner, 2026-11-11: "Can we make a distinction between phones and like my
// iPad and old iPads? If so, let's make it to where if you log in on a phone, it tells you you have to play on an iPad, and we're going to quit developing for the phone."
//   THE RULE   a tablet's own word (iPad, Tablet) wins; a phone: its browser says so (an iPhone, an iPod, Android's "Mobile", Windows Phone), or a touch screen whose short side is under 600 CSS px
//              (Chromium's userAgentData.mobile only when there is no screen to go by).
//              Every iPad (744 and up, the oldest 768) and Android tablet (600 and up) is not; a computer (no touch) never is, however small its window.
//   THE PAGE   a phone sees PLAY ON AN iPAD and nothing else, and the game does not start; ?anydevice opens it anyway; the website's background (?attract) is never stopped.
const fs = require('fs'), path = require('path'), os = require('os'), vm = require('vm');
const { execFileSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
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
const UA = {
    iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    ipadNew: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',   // (iPadOS asks for the desktop site: it says Macintosh)
    ipadOld: 'Mozilla/5.0 (iPad; CPU OS 12_5_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1',
    android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    androidTab: 'Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    mac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

group('THE RULE (game.html\'s head: deviceIsPhone)');
const html = rd('game.html'), head = html.slice(0, html.indexOf('</head>'));
const src = (head.match(/window\.deviceIsPhone = function \(d\) \{[\s\S]*?\n    \};/) || [])[0];
check('the check is in the page\'s head, before anything is drawn, and it defines deviceIsPhone', () => { ok(src, 'no deviceIsPhone in the head'); ok(head.indexOf('window.__phoneGate = true') > 0 && head.indexOf('" phone-gate"') > 0, 'the head does not set the gate'); });
const ctx = vm.createContext({ window: {} }); if (src) vm.runInContext(src, ctx); const isPhone = d => vm.runInContext('window.deviceIsPhone(' + JSON.stringify(d) + ')', ctx);
const CASES = [
    ['an iPhone (its browser says so)', { ua: UA.iphone, sw: 390, sh: 844, touch: true }, true],
    ['the smallest iPhone (320 × 568)', { ua: UA.iphone, sw: 320, sh: 568, touch: true }, true],
    ['an Android phone ("Mobile")', { ua: UA.android, sw: 412, sh: 915, touch: true }, true],
    ['a phone whose browser asks for the desktop site (a Mac\'s words, a 430-wide touch screen)', { ua: UA.mac, sw: 430, sh: 932, touch: true }, true],
    ['Chromium saying it is mobile, with no screen to go by', { ua: '', mobile: true, sw: 0, sh: 0, touch: true }, true],
    ['an emulated iPad that Chromium calls mobile (Playwright\'s iPad: the iPad\'s own word wins)', { ua: UA.ipadOld, mobile: true, sw: 810, sh: 1080, touch: true }, false],
    ['an iPad today (iPadOS says Macintosh), 820 × 1180', { ua: UA.ipadNew, sw: 820, sh: 1180, touch: true }, false],
    ['an iPad mini (744 × 1133)', { ua: UA.ipadNew, sw: 744, sh: 1133, touch: true }, false],
    ['an old iPad (iOS 12 says iPad), 768 × 1024', { ua: UA.ipadOld, sw: 768, sh: 1024, touch: true }, false],
    ['an Android tablet (no "Mobile"), 800 × 1280', { ua: UA.androidTab, sw: 800, sh: 1280, touch: true }, false],
    ['a computer', { ua: UA.mac, sw: 1440, sh: 900, touch: false }, false],
    ['a computer whose window is narrow (its screen is what counts)', { ua: UA.mac, sw: 1920, sh: 1080, touch: false }, false],
    ['a touch laptop', { ua: UA.mac, sw: 1366, sh: 768, touch: true }, false],
];
for (const [name, d, want] of CASES) check((want ? 'a phone: ' : 'not a phone: ') + name, () => same(isPhone(d), want, name));

group('THE PAGE (real browser: Chromium\'s headless shell with each device\'s words)');
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(function(){ var g = document.getElementById('phoneGate'), cs = g ? getComputedStyle(g) : null, su = document.getElementById('startupOverlay');
  var out = { gate: window.__phoneGate === true, cls: document.documentElement.classList.contains('phone-gate'), shown: !!cs && cs.display !== 'none', head: g ? (g.querySelector('.pg-head') || {}).textContent : null,
    startup: typeof STARTUP !== 'undefined' ? STARTUP.state : null, built: typeof facilityPlay !== 'undefined' && !!facilityPlay, overlayHidden: !su || getComputedStyle(su).display === 'none', canvasHidden: (function(){ var c = document.querySelector('canvas'); return !c || getComputedStyle(c).display === 'none'; })() };
  var pre = document.createElement('pre'); pre.id = '__pg'; pre.textContent = JSON.stringify(out); document.documentElement.appendChild(pre); }, 2500); });</script></body>`;
function page(ua, w, h, query) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pg-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, html.replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--user-agent=' + ua, '--window-size=' + w + ',' + h, '--virtual-time-budget=15000', '--dump-dom', 'file://' + file + (query || '')], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 100000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__pg">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}
const P = {}; let skipped = false;
for (const [k, ua, w, h, q] of [['iphone', UA.iphone, 390, 844, ''], ['ipad', UA.ipadNew, 1180, 820, ''], ['ipadOld', UA.ipadOld, 1024, 768, ''], ['anydevice', UA.iphone, 390, 844, '?anydevice'], ['attract', UA.iphone, 390, 844, '?attract']]) {
    const r = page(ua, w, h, q); if (r === null) { skipped = true; break; } P[k] = r;
}
if (skipped) console.log('  (no Chromium here: skipped)');
else {
    check('an iPhone sees PLAY ON AN iPAD and nothing else: the start screen and the canvas are hidden, and the game is not started (nothing is built)', () => {
        const r = P.iphone; ok(r, 'the page produced nothing'); same([r.gate, r.cls, r.shown].join(), 'true,true,true', 'the gate'); same(r.head, 'PLAY ON AN iPAD', 'its words');
        same(r.startup, 'idle', 'the start ran'); same(r.built, false, 'the facility was built'); same(r.overlayHidden, true, 'the start screen shows'); same(r.canvasHidden, true, 'the game\'s canvas shows');
    });
    check('an iPad (today\'s, which says Macintosh, and an old one, which says iPad) plays: no gate, the game starts', () => {
        for (const k of ['ipad', 'ipadOld']) { const r = P[k]; ok(r, k + ': the page produced nothing'); same([r.gate, r.cls, r.shown].join(), 'false,false,false', k + ': the gate'); ok(r.startup && r.startup !== 'idle', k + ': the start did not run (' + r.startup + ')'); }
    });
    check('?anydevice opens the game on a phone anyway (development); the website\'s background (?attract) is never stopped', () => {
        for (const k of ['anydevice', 'attract']) { const r = P[k]; ok(r, k + ': the page produced nothing'); same(r.gate, false, k + ': the gate'); same(r.shown, false, k + ': the gate shows'); }
    });
}
group('WHERE IT IS');
check('js/init.js starts nothing on a phone; the page has the gate\'s words and style', () => {
    ok(/function startupBegin\(\) \{\n    if \(typeof window !== "undefined" && window\.__phoneGate\) return STARTUP;/.test(rd('js/init.js')), 'js/init.js starts the game on a phone');
    ok(/<div id="phoneGate" role="alert">/.test(html) && /PLAY ON AN iPAD/.test(html) && /html\.phone-gate body > \*:not\(#phoneGate\) \{ display: none !important; \}/.test(html), 'the gate in game.html');
});
console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
