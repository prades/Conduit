// THE SHARD GEMS AND THE ALARM TRIANGLE (js/hudgems.js; js/game.js; the css in game.html).
//
// REPORTED: "the shards count at the top could be a rotating series of crystals that has a number near or around it. The alarm could just be an
// exclamation triangle symbol next to the zone, no box there at all."
const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  // (the headless dump runs no animation frames, so the probe drives the game's frame function, which is all its own loop does)
  setInterval(function(){ try { render(); } catch (e) {} }, 100);
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, b = document.body;
  var cs = function(id){ var e = document.getElementById(id); return e ? getComputedStyle(e).display : 'missing'; };
  out.polys = document.querySelectorAll('#shardGems polygon').length; out.anims = document.querySelectorAll('#shardGems animate').length;
  out.calm = { cls: b.classList.contains('alarm-on'), icon: cs('alarmIcon'), banner: cs('waveInfo') };
  shardCount = 1250; await wait(300); out.count = document.getElementById('shardCount').textContent;
  triggerAlarm('proximity', player.x, player.y); await wait(500);
  out.alarm = { cls: b.classList.contains('alarm-on'), icon: cs('alarmIcon'), banner: cs('waveInfo') };
  var boxed = getComputedStyle(document.getElementById('alarmIcon')); out.iconBox = { bg: boxed.backgroundColor, border: boxed.borderTopWidth };
  clearAlarm(); await wait(500);
  out.cleared = { cls: b.classList.contains('alarm-on'), icon: cs('alarmIcon'), banner: cs('waveInfo') };
  var pre = document.createElement('pre'); pre.id = '__hg'; pre.textContent = JSON.stringify(out); b.appendChild(pre);
}, 1500); });</script></body>`;
function measure() {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hg-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, HTML.replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1080,700', '--virtual-time-budget=12000', '--dump-dom', 'file://' + file], { encoding: 'utf8', timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    const m = dom.match(/<pre id="__hg">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : undefined;
}

(async () => {
    console.log('\nTHE SOURCE');
    check('the shards plate is crystals and a number, and the alarm banner is replaced by a triangle beside the zone', () => {
        ok(/<div id="shards"[^>]*><span id="shardGems"><\/span><span id="shardCount">0<\/span><\/div>/.test(HTML), 'the shard counter is not gems + a number');
        ok(/<div id="zoneLine"><span id="alarmIcon"[\s\S]{0,700}<div id="zoneInfo"/.test(HTML), 'the alarm triangle is not beside the zone');
        ok(/body\.alarm-on #alarmIcon \{ display: block; \} body\.alarm-on #waveInfo \{ display: none !important; \}/.test(HTML), 'the alarm banner is not hidden by the alarm');
        ok(/#shards::before \{ display: none !important; \}/.test(HTML), 'the shards still sit in a box');
        ok(/js\/hudgems\.js/.test(HTML), 'hudgems.js is not loaded');
    });
    check('the game writes the bare NUMBER (plus any shield cells) into the counter, not "Shards: N"', () => {
        const game = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8'), cfg = fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8');
        ok(/shardUI\.textContent = shardCount \+ \(_cellsNow > 0/.test(game) && /shardUI\.textContent = String\(shardCount\);/.test(game), 'a write still says "Shards:"');
        ok(/const shardUI = document\.getElementById\('shardCount'\);/.test(cfg), 'shardUI is not the number element');
    });

    console.log('\nTHE CRYSTAL TURN');
    const sb = makeBrowserSandbox({}), ctx = vm.createContext(sb);
    for (const rel of scriptOrder()) { try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); } catch (e) {} }
    const run = s => vm.runInContext(s, ctx);
    check('a face is animated for a 60-degree turn in GEM_FRAMES steps', () => same(run('gemFace(18, 20, 33, 54, 9, 0, -1, -35).pts.length'), run('GEM_FRAMES') + 1, 'frames'));
    check('THE TURN LOOPS SEAMLESSLY: at the end of the turn each face looks exactly like the next face at the start (shape, colour, visibility)', () => {
        const same2 = run(`(function(){ let bad = 0; for (const half of [-1, 1]) for (let k = 0; k < 6; k++) {
            const a = gemFace(18, 20, 33, 54, 9, k * 60, half, -35), b = gemFace(18, 20, 33, 54, 9, ((k + 1) % 6) * 60, half, -35), last = a.pts.length - 1;
            if (a.pts[last] !== b.pts[0] || a.fill[last] !== b.fill[0] || a.vis[last] !== b.vis[0]) bad++; } return bad; })()`);
        same(same2, 0, 'faces whose end does not meet the next face\'s start');
    });
    check('only the faces turned towards you are shown, and a face turned away has no width to see', () => {
        const r = run(`(function(){ let front = 0, back = 0; for (let k = 0; k < 6; k++) { const f = gemFace(18, 20, 33, 54, 9, k * 60, -1, -35); if (f.vis[0] === "1") front++; else back++; } return [front, back]; })()`);
        same(r[0], 3, 'three faces face the viewer'); same(r[1], 3, 'and three face away');
    });
    check('the lit side is brighter than the shaded side', () => {
        const hsl = f => parseInt(/(\d+)%\)$/.exec(f)[1]);
        const L = run(`(function(){ const out = []; for (let k = 0; k < 6; k++) { const f = gemFace(18, 20, 33, 54, 9, k * 60, -1, -35); out.push(f.fill[0]); } return out; })()`).map(hsl);
        ok(Math.max(...L) - Math.min(...L) >= 15, 'the faces are all the same brightness: ' + L);
    });

    console.log('\nIN THE REAL PAGE (1080x700)');
    const r = measure();
    if (r === null) console.log('  (no Chromium here: skipped)');
    else {
        check('the instrument ran', () => ok(r, 'the probe produced nothing'));
        if (r) {
            check('THE ASK: the crystals are built (three crystals × 12 animated faces) and the number is just the count', () => { same(r.polys, 36, 'faces'); same(r.anims, 108, 'animations (shape, colour, visibility each)'); same(r.count, '1250', 'the count'); });
            check('THE ASK: a calm HUD shows the objective banner and no alarm triangle', () => { same(r.calm.cls, false, 'class'); same(r.calm.icon, 'none', 'triangle'); ok(r.calm.banner !== 'none', 'banner'); });
            check('THE ASK: an alarm shows a triangle next to the zone and NO banner box', () => { same(r.alarm.cls, true, 'class'); same(r.alarm.icon, 'block', 'triangle shown'); same(r.alarm.banner, 'none', 'banner hidden'); });
            check('the triangle has no box round it', () => ok(r.iconBox.bg === 'rgba(0, 0, 0, 0)' && r.iconBox.border === '0px', JSON.stringify(r.iconBox)));
            check('and clearing the alarm brings the banner back and removes the triangle', () => { same(r.cleared.cls, false, 'class'); same(r.cleared.icon, 'none', 'triangle'); ok(r.cleared.banner !== 'none', 'banner back'); });
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
