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

    console.log('\nTHE ICON');
    const sb = makeBrowserSandbox({}), ctx = vm.createContext(sb);
    for (const rel of scriptOrder()) { try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); } catch (e) {} }
    const run = s => vm.runInContext(s, ctx);
    check('THE ASK: the icon is the crystal cluster "twin and chip": two tall crystals and a small chunk, one still SVG', () => {
        const svg = run('SHARD_ICON_SVG'); same((svg.match(/<polygon/g) || []).length, 13, 'polygons');
        ok(/viewBox="0 0 100 100"/.test(svg), 'viewBox'); ok(!/<animate|<script|setInterval/.test(svg), 'it is not still');
    });
    check('it keeps the gold palette (no flashing colours: a fixed gold ramp)', () => { const svg = run('SHARD_ICON_SVG'); ok(/#ffd84a/.test(svg) && /#e0a210/.test(svg) && /#fff4b0/.test(svg), 'palette'); });
    check('hudgems.js has no turning-gem code or timer left', () => { const src = fs.readFileSync(path.join(ROOT, 'js/hudgems.js'), 'utf8'); ok(!/gemFace|gemCrystal|GEM_FRAMES|createElementNS|setInterval|<animate/.test(src), 'old gem code remains'); });

    console.log('\nIN THE REAL PAGE (1080x700)');
    const r = measure();
    if (r === null) console.log('  (no Chromium here: skipped)');
    else {
        check('the instrument ran', () => ok(r, 'the probe produced nothing'));
        if (r) {
            check('THE ASK: the icon is built (still, no animations) and the number is just the count', () => { same(r.polys, 13, 'polygons'); same(r.anims, 0, 'animations'); same(r.count, '1250', 'the count'); });
            check('THE ASK: a calm HUD shows no alarm triangle (and the objective line under the bars is gone)', () => { same(r.calm.cls, false, 'class'); same(r.calm.icon, 'none', 'triangle'); same(r.calm.banner, 'none', 'banner'); });
            check('THE ASK: an alarm shows a triangle next to the zone and NO banner box', () => { same(r.alarm.cls, true, 'class'); same(r.alarm.icon, 'block', 'triangle shown'); same(r.alarm.banner, 'none', 'banner hidden'); });
            check('the triangle has no box round it', () => ok(r.iconBox.bg === 'rgba(0, 0, 0, 0)' && r.iconBox.border === '0px', JSON.stringify(r.iconBox)));
            check('and clearing the alarm removes the triangle', () => { same(r.cleared.cls, false, 'class'); same(r.cleared.icon, 'none', 'triangle'); });
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
