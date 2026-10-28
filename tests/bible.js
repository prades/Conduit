// THE GAME BIBLE (bible.html): Conduit's design reference on one page, and its card on the home page (index.html).
// ASKED: "we make some sort of game Bible that can be maybe all one document, and maybe we can put it on the website somewhere." Chosen with the user: a design reference (every system, its
// numbers, where it lives in the code, the decisions made and what is still open), a card on the home page, story sections left to be written, and pictures from the game.
//   THE NUMBERS   every number on the page that is read from the code (class "n", data-k = the expression that gives it) is what the code says now: the game is loaded here and each
//                 expression evaluated, so a change in the code that the page does not follow fails (data-f: "pct" a fraction shown as %, "s" ms shown as seconds, "f" frames at 60 fps
//                 shown as seconds, "min" ms shown as minutes)
//   THE PAGE      the home page has its card; every picture is in the repo and the pictures stay small; every link inside it goes somewhere; the contents list every part; the story's parts
//                 say they are to be written; it loads nothing from elsewhere
//   THE SCREEN    in the real browser (no Chromium: it says so and passes): every picture loads, the script runs, and on a phone nothing is wider than the screen
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
const unesc = s => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
// the page in the real browser: its pictures, its script, and how wide it is
const PROBE = `<script>window.addEventListener('load', function(){ setTimeout(function(){
  var out = {}; try {
    var im = Array.prototype.slice.call(document.images); out.imgs = im.length; out.broken = im.filter(function(i){ return !(i.complete && i.naturalWidth > 0); }).map(function(i){ return i.getAttribute('src'); });
    out.titled = Array.prototype.slice.call(document.querySelectorAll('.n[data-k]')).every(function(e){ return /^From the code: /.test(e.title); });
    out.sw = document.documentElement.scrollWidth; out.w = window.innerWidth;
    out.wide = Array.prototype.slice.call(document.querySelectorAll('main *')).filter(function(e){ var r = e.getBoundingClientRect(); return r.width > 0 && r.right > window.innerWidth + 1 && !e.closest('.tw'); }).slice(0, 5).map(function(e){ return e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right); });
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__bb'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 300); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bb-')), file = path.join(dir, 'bible.html');
    fs.writeFileSync(file, rd('bible.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<img ([^>]*?)loading="lazy"/g, '<img $1').replace(/<\/body>/i, () => PROBE));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=15000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 100000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__bb">([\s\S]*?)<\/pre>/); return m ? JSON.parse(unesc(m[1])) : undefined;
}

(async () => {
    const page = rd('bible.html'), home = rd('index.html');

    group('THE NUMBERS (each one against the code)');
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const tags = [...page.matchAll(/<span class="n" data-k="([^"]+)"(?: data-f="([^"]+)")?>([^<]*)<\/span>/g)].map(m => ({ k: unesc(m[1]), f: m[2] || '', t: unesc(m[3]).trim() }));
    check('the page has numbers read from the code, and each one is written the one way the test reads (no other attributes on a number, no tags inside it)', () => {
        ok(tags.length >= 80, 'only ' + tags.length + ' numbers are tagged');
        same((page.match(/class="n"/g) || []).length, tags.length, 'a number the test cannot read (another attribute, or a tag inside it)');
    });
    const wrong = [];
    for (const g of tags) {
        let v; try { v = vm.runInContext('(' + g.k + ')', context); } catch (e) { wrong.push(g.k + ': the code has no such thing (' + e.message + ')'); continue; }
        if (typeof v === 'string') { if (v !== g.t) wrong.push(g.k + ' is "' + v + '", the page says "' + g.t + '"'); continue; }
        if (typeof v !== 'number' || !isFinite(v)) { wrong.push(g.k + ' is not a number (' + v + ')'); continue; }
        const shown = g.f === 'pct' ? v * 100 : g.f === 's' ? v / 1000 : g.f === 'f' ? v / 60 : g.f === 'min' ? v / 60000 : v;
        const txt = g.t.replace(/−/g, '-').replace(/,/g, ''), num = parseFloat((txt.match(/-?\d+(\.\d+)?/) || [])[0]), dec = ((txt.match(/\.(\d+)/) || [])[1] || '').length;
        if (!isFinite(num)) { wrong.push(g.k + ': the page says "' + g.t + '", not a number'); continue; }
        const want = Math.round(shown * Math.pow(10, dec)) / Math.pow(10, dec);
        if (Math.abs(want - num) > 1e-9) wrong.push(g.k + (g.f ? ' (' + g.f + ')' : '') + ' gives ' + want + ', the page says "' + g.t + '"');
    }
    check('every number on the page is what the code says now (' + tags.length + ' numbers)', () => { ok(!wrong.length, wrong.length + ' wrong:\n        ' + wrong.slice(0, 25).join('\n        ')); });

    group('THE PAGE');
    check('the home page has the bible\'s card (a project card that goes to bible.html), and the bible goes back to the home page', () => {
        ok(/<a class="project-card[^"]*" href="bible\.html">[\s\S]*?Game Bible[\s\S]*?<\/a>/.test(home), 'no card for the bible on index.html');
        ok(/href="index\.html"/.test(page), 'no way back to the home page');
        ok(/<title>Conduit Game Bible<\/title>/.test(page), 'the title');
    });
    const srcs = [...page.matchAll(/\s(?:src|href)="([^"#][^"]*)"/g)].map(m => unesc(m[1]));
    check('every picture and file the page points to is in the repo, and it loads nothing from elsewhere (no outside scripts, styles or fonts)', () => {
        const missing = srcs.filter(s => !/^(https?:|mailto:)/.test(s) && !fs.existsSync(path.join(ROOT, s.split('?')[0])));
        ok(!missing.length, 'missing: ' + missing.join(', '));
        ok(!/<script[^>]+src=/.test(page) && !/<link[^>]+stylesheet/.test(page) && !/@import|url\(["']?https?:/.test(page), 'it loads something from elsewhere');
    });
    check('the pictures stay small (all of img/bible under 3.5 MB, none over 400 KB)', () => {
        const dir = path.join(ROOT, 'img/bible'), files = [];
        const walk = d => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else files.push(p); } };
        walk(dir); const total = files.reduce((s, f) => s + fs.statSync(f).size, 0), big = files.filter(f => fs.statSync(f).size > 400 * 1024);
        ok(total < 3.5 * 1024 * 1024, 'img/bible is ' + Math.round(total / 1024) + ' KB'); ok(!big.length, 'too big: ' + big.map(f => path.relative(ROOT, f)).join(', '));
        const unused = files.map(f => path.relative(ROOT, f)).filter(f => !srcs.includes(f)); ok(!unused.length, 'pictures the page does not show: ' + unused.join(', '));
    });
    check('every link inside the page goes somewhere, and the contents list every part', () => {
        const ids = new Set([...page.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
        const dead = [...page.matchAll(/href="#([^"]+)"/g)].map(m => m[1]).filter(id => !ids.has(id)); ok(!dead.length, 'links to nothing: ' + dead.join(', '));
        const toc = (page.match(/<nav class="toc"[\s\S]*?<\/nav>/) || [''])[0], parts = [...page.matchAll(/<section class="part" id="([^"]+)"/g)].map(m => m[1]);
        ok(parts.length >= 10, 'parts: ' + parts.length); const off = parts.filter(id => !toc.includes('href="#' + id + '"')); ok(!off.length, 'not in the contents: ' + off.join(', '));
        same(ids.size, [...page.matchAll(/\sid="([^"]+)"/g)].length, 'an id is used twice');
    });
    check('the story is left to be written: its parts are marked TO BE WRITTEN, beside what the game already says', () => {
        const story = (page.match(/<section class="part" id="story"[\s\S]*?<\/section>/) || [''])[0];
        ok(story, 'no story part'); ok((story.match(/class="tbw"/g) || []).length >= 4, 'fewer than four story parts to be written'); ok((story.match(/TO BE WRITTEN/g) || []).length >= 4, 'not marked TO BE WRITTEN');
    });

    group('THE SCREEN (real browser)');
    for (const [w, h] of [[1280, 900], [390, 844]]) {
        const r = measure(w, h);
        if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
        check(w + 'x' + h + ': every picture loads, every number says where it comes from, and nothing is wider than the screen', () => {
            ok(r && !r.err, 'the probe: ' + JSON.stringify(r)); ok(r.imgs >= 40, 'pictures: ' + r.imgs); ok(!r.broken.length, 'broken: ' + r.broken.join(', '));
            same(r.titled, true, 'a number without its source'); ok(r.sw <= r.w + 1, 'the page is ' + r.sw + ' px wide on a ' + r.w + ' px screen: ' + r.wide.join('; '));
        });
    }

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
