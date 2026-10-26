// THE BOTTOM OF THE SCREEN: the dock, the squad bar, the "N SELECTED / X / ROSTER" chip, the battle tool and its enemy card, and the phone's round buttons, at every width: none of them lies over another.
// ASKED: "the thing that says [N] selected with an X button and a roster button, that needs to be not in the way of the new little follower squad viewer on the UI." The chip sat where the squad bar had been put (over its middle card
// on a tablet, over the foot of the cards on a phone); looking for it showed the bar itself over the dock at 701-900 px, over the tool at 901-1166 px, and over the phone's round buttons. The pieces are stacked by the css variables
// --sb-bottom, --sb-h, --sb-w and --sb-cx (game.html): the bar over the dock, the chip over the bar (a phone: under it), the tool's column left of the bar.
// Real browser (no Chromium: it says so and passes).
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT } = require('./domstub.js');
process.on('unhandledRejection', () => {});
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
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}

// The real page, in the facility: the squad of three, one follower selected (the chip), a creature locked on (the enemy card); on a phone the battle tool is shut (its chip) and then open (its panel). Every piece's rectangle.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); };
  var st = document.createElement('style'); st.textContent = '#mixTool, #mixTool *, #squadBar, #squadBar *, #selChip, #selChip * { transition: none !important; animation: none !important }'; document.head.appendChild(st);
  var rect = function(s){ var e = $(s); if (!e) return null; var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return null; var b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 ? [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)] : null; };
  var circle = function(c){ return [Math.round(c.x - c.r), Math.round(c.y - c.r), Math.round(c.x + c.r), Math.round(c.y + c.r)]; };
  var snap = function(){ var o = { dock: rect('#topToggles'), bar: rect('#squadBar'), chip: rect('#selChip'), panel: rect('#mixTool .mt-panel'), pod: rect('#mixTool .mt-pod'), foe: rect('#mixTool .mt-foe'), slots: [] };
    var sl = document.querySelectorAll('#squadBar .sb-slot'); for (var i = 0; i < sl.length; i++) { var b = sl[i].getBoundingClientRect(); o.slots.push([Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]); }
    if (!dockHasMenus()) { frameNow(); o.round = [circle(_SETTINGSBTN), circle(_SHOPBTN), circle(_CAMPBTN)]; } return o; };
  var frameNow = function(){ try { render(); } catch (e) {} };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; frameNow();
    out.size = { w: innerWidth, h: innerHeight, wide: mixToolWide() };
    // one selected: the chip; one creature locked on: the enemy card
    selectedUnits.clear(); selectedUnits.add(followers[0]); squadMode = 'selected'; ccRefreshChip(); partyTick();
    actors = actors.filter(function(a){ return !(a instanceof Predator); }); spawnPredatorForZone(1, { species: 'beetle', className: 'tank' }); var e = actors[actors.length - 1]; e.x = player.x + 3; e.y = player.y + 1; e.state = 'wander'; e.provoked = false; e.moveSpeed = 0; e.baseMoveSpeed = 0;
    targetSet(e, true); mixToolRender(true); frameNow(); await wait(60);
    out.shut = snap();
    if (!mixToolWide()) { crystalMenuOpen = true; mixToolRender(true); frameNow(); await wait(60); out.open = snap(); crystalMenuOpen = false; mixToolRender(true); }
    // an empty slot or two (a follower holding a room): the bar keeps its height
    followers[1].post = partyRoomAt(followers[1].x, followers[1].y); followers[2].post = followers[1].post; partyTick(); await wait(60); out.empty = snap();
    // nothing selected: no chip
    selectedUnits.clear(); ccRefreshChip(); await wait(30); out.none = { chip: rect('#selChip') };
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__bu'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bu-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=20000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 100000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__bu">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}
// do two rectangles [left, top, right, bottom] cross (a pixel of touching is not crossing)?
const cross = (a, b) => !!a && !!b && a[0] < b[2] - 1 && b[0] < a[2] - 1 && a[1] < b[3] - 1 && b[1] < a[3] - 1;
const inside = (a, w, h) => !!a && a[0] >= 0 && a[1] >= 0 && a[2] <= w && a[3] <= h;

group('THE BOTTOM OF THE SCREEN (real browser)');
const ONLY = process.env.BU_WIDTHS ? process.env.BU_WIDTHS.split(',').map(Number) : null;   // (BU_WIDTHS=901,1101 runs just those)
for (const [w, h] of [[360, 740], [390, 844], [421, 800], [560, 800], [561, 800], [700, 800], [701, 800], [820, 1180], [901, 800], [1101, 800], [1180, 820], [1600, 900]].filter(x => !ONLY || ONLY.includes(x[0]))) {
    const r = measure(w, h);
    if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
    check(w + 'x' + h + ': the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); });
    if (!r || r.err) continue;
    const phone = w <= 700;
    for (const [state, s] of [['shut', r.shut], ['open', r.open], ['two held', r.empty]].filter(x => x[1])) {
        check(w + ' (' + state + '): the chip, the squad bar, the dock, the battle tool and the enemy card do not cross each other, and all are on the screen', () => {
            ok(s.bar, 'no squad bar'); ok(s.chip, 'no chip'); ok(s.foe, 'no enemy card'); ok(phone ? (s.pod || s.panel) : s.panel, 'no tool'); if (!phone) ok(s.dock, 'no dock');
            const items = { dock: s.dock, bar: s.bar, chip: s.chip, tool: s.panel || s.pod, foe: s.foe }; const names = Object.keys(items).filter(k => items[k]);
            for (let i = 0; i < names.length; i++) { ok(inside(items[names[i]], w, h), names[i] + ' is off the screen: ' + items[names[i]]); for (let j = i + 1; j < names.length; j++) ok(!cross(items[names[i]], items[names[j]]), names[i] + ' ' + items[names[i]] + ' lies over ' + names[j] + ' ' + items[names[j]]); }
            if (s.round) for (const c of s.round) { ok(!cross(c, s.bar), 'a round button ' + c + ' is under the bar ' + s.bar); ok(!cross(c, s.chip), 'a round button ' + c + ' is under the chip ' + s.chip); }
        });
    }
    check(w + ': the chip is over the bar (centred on it) and the bar is over the dock on a tablet, the chip is under the bar on a phone; the bar keeps its height whoever is in it', () => {
        const b = r.shut.bar, c = r.shut.chip;
        if (phone) ok(c[1] >= b[3] - 1, 'the chip ' + c + ' is not under the bar ' + b); else { ok(c[3] <= b[1] + 1, 'the chip ' + c + ' is not over the bar ' + b); ok(Math.abs((c[0] + c[2]) / 2 - (b[0] + b[2]) / 2) <= 2, 'the chip is not centred on the bar: ' + c + ' ' + b); ok(b[3] <= r.shut.dock[1] + 1, 'the bar ' + b + ' is not over the dock ' + r.shut.dock); ok(b[1] - c[3] <= 12, 'the chip is far from the bar: ' + (b[1] - c[3])); }
        same(r.empty.bar[3] - r.empty.bar[1], r.shut.bar[3] - r.shut.bar[1], 'the bar changed height with open slots'); same(r.shut.slots.length, 3, 'slots'); ok(r.shut.slots.every(q => q[3] - q[1] === r.shut.slots[0][3] - r.shut.slots[0][1]), 'the slots are not all one height: ' + JSON.stringify(r.shut.slots));
    });
    check(w + ': with nothing selected the chip is gone', () => { same(r.none.chip, null, 'the chip'); });
}
console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
