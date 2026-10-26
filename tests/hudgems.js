// THE SHARD GEMS AND THE ALARM TRIANGLE (js/hudgems.js; js/alarm.js; js/game.js; the css in game.html).
//
// REPORTED: "the shards count at the top could be a rotating series of crystals that has a number near or around it. The alarm could just be an
// exclamation triangle symbol next to the zone, no box there at all." The crystals are one still SVG beside the bare number; an alarm (js/alarm.js
// triggerAlarm) puts body.alarm-on on the page and the red triangle shows beside the ROOM TAG (#zoneInfo: the room you are in). The strip game's
// objective banner (#waveInfo) is gone from the page altogether.
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
  try {
  if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300); gameState.running = true;
  out.polys = document.querySelectorAll('#shardGems polygon').length; out.anims = document.querySelectorAll('#shardGems animate').length;
  out.calm = { cls: b.classList.contains('alarm-on'), icon: cs('alarmIcon'), banner: cs('waveInfo'), alert: alertActive };
  shardCount = 1250; await wait(300); out.count = document.getElementById('shardCount').textContent;
  triggerAlarm('proximity', player.x, player.y); await wait(500);
  out.alarm = { cls: b.classList.contains('alarm-on'), icon: cs('alarmIcon'), banner: cs('waveInfo'), alert: alertActive, label: alarmLabel(alertType) };
  var boxed = getComputedStyle(document.getElementById('alarmIcon')); out.iconBox = { bg: boxed.backgroundColor, border: boxed.borderTopWidth };
  var ic = document.getElementById('alarmIcon').getBoundingClientRect(), zn = document.getElementById('zoneInfo').getBoundingClientRect(); out.beside = { gap: Math.round(zn.left - ic.right), sameRow: Math.abs((ic.top + ic.bottom) / 2 - (zn.top + zn.bottom) / 2) < 24, tag: document.getElementById('zoneInfo').textContent, room: facilityZoneName() };
  clearAlarm(); await wait(500);
  out.cleared = { cls: b.classList.contains('alarm-on'), icon: cs('alarmIcon'), alert: alertActive };
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__hg'; pre.textContent = JSON.stringify(out); b.appendChild(pre);
}, 1500); });</script></body>`;
function measure() {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hg-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, HTML.replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=1080,700', '--virtual-time-budget=12000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 90000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e.stdout || '').toString(); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__hg">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    console.log('\nTHE SOURCE');
    check('the shards plate is crystals and a number, and the alarm is a triangle beside the room tag (no banner anywhere in the page)', () => {
        ok(/<div id="shards"[^>]*><span id="shardGems"><\/span><span id="shardCount">0<\/span><\/div>/.test(HTML), 'the shard counter is not gems + a number');
        ok(/<div id="zoneLine"><span id="alarmIcon"[\s\S]{0,700}<div id="zoneInfo"/.test(HTML), 'the alarm triangle is not beside the room tag');
        ok(/body\.alarm-on #alarmIcon \{ display: block; \}/.test(HTML), 'the alarm does not show the triangle');
        ok(!/id="waveInfo"/.test(HTML) && !/#waveInfo/.test(HTML), 'the objective banner is still in the page');
        ok(/#shards::before \{ display: none !important; \}/.test(HTML), 'the shards still sit in a box');
        ok(/js\/hudgems\.js/.test(HTML), 'hudgems.js is not loaded');
        ok(!/id="zoneInfo"[^>]*onclick=/.test(HTML) && /id="zoneInfo" title="The room you are in"/.test(HTML), 'the room tag is still a button (it names the room you are in)');
    });
    check('the game writes the bare NUMBER into the counter, not "Shards: N", and toggles body.alarm-on only when the alarm changes', () => {
        const game = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8'), cfg = fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8');
        ok(/shardUI\.textContent = String\(shardCount\);/.test(game) && !/Shards: /.test(game), 'a write still says "Shards:"');
        ok(/const shardUI = document\.getElementById\('shardCount'\);/.test(cfg), 'shardUI is not the number element');
        ok(/if \(_alarmOn !== _lastAlarmOn\) \{ _lastAlarmOn = _alarmOn;[^\n]*classList\.toggle\("alarm-on", _alarmOn\)/.test(game), 'the alarm class is not toggled on a change');
        ok(/function triggerAlarm\(type, sx, sy\)/.test(fs.readFileSync(path.join(ROOT, 'js/alarm.js'), 'utf8')) && /function clearAlarm\(\)/.test(fs.readFileSync(path.join(ROOT, 'js/alarm.js'), 'utf8')), 'the alarm is not js/alarm.js');
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
        check('the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); });
        if (r && !r.err) {
            check('THE ASK: the icon is built (still, no animations) and the number is just the count', () => { same(r.polys, 13, 'polygons'); same(r.anims, 0, 'animations'); same(r.count, '1250', 'the count'); });
            check('THE ASK: a calm HUD shows no alarm triangle, and there is no objective banner in the page at all', () => { same(r.calm.alert, false, 'an alarm at the start'); same(r.calm.cls, false, 'class'); same(r.calm.icon, 'none', 'triangle'); same(r.calm.banner, 'missing', 'banner'); });
            check('THE ASK: an alarm shows a triangle next to the room tag and NO banner box', () => { same(r.alarm.alert, true, 'alertActive'); same(r.alarm.label, 'PROXIMITY ALARM', 'its name'); same(r.alarm.cls, true, 'class'); same(r.alarm.icon, 'block', 'triangle shown'); same(r.alarm.banner, 'missing', 'a banner'); });
            check('the triangle has no box round it, and sits on the room tag\'s row just left of it (the tag names the room you are in)', () => {
                ok(r.iconBox.bg === 'rgba(0, 0, 0, 0)' && r.iconBox.border === '0px', JSON.stringify(r.iconBox));
                same(r.beside.sameRow, true, 'not on the same row'); ok(r.beside.gap >= 0 && r.beside.gap <= 40, 'the gap to the tag is ' + r.beside.gap + 'px'); same(r.beside.tag, r.beside.room, 'the tag does not name the room');
            });
            check('and clearing the alarm removes the triangle', () => { same(r.cleared.alert, false, 'alertActive'); same(r.cleared.cls, false, 'class'); same(r.cleared.icon, 'none', 'triangle'); });
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
