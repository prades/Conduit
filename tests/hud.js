// THE HUD: everything in it has to be readable at once, at any screen size.
//
// REPORTED, with a screenshot taken on a tablet: "update the HUD so that all
// parts are visible, the wave information is hidden."
//
// Every piece of the top HUD was hand-placed at absolute coordinates picked on
// a 1440-wide desktop, where they happen not to touch. Narrow the window and
// they slide into each other: on a 1024 tablet the health bar, the ultimate
// bar, the objective banner and the toggle row all overlapped. A phone was
// worse. The top HUD is a flow column now, and the strip game's objective
// banner (#waveInfo) is gone from the page altogether: the facility's HUD is
// the crystals (top left), the health and ultimate bars (centre), the room tag
// with the alarm triangle beside it (top right), the NEW GAME chip, the battle
// tool and the squad bar (bottom left), the dock (bottom; on a phone the
// radial menu's hub on the left edge instead). The network panel, the
// objective plate and the target dial are drawn on the canvas, so the DOM
// cannot overlap them.
//
// These are layout bugs, and layout cannot be reasoned about from the source —
// it has to be measured. So this suite drives the real browser that ships in
// this container, loads the real game (the page boots the facility), and asks
// it where things ended up.
//
// If no browser is available the suite says so and passes: it is a measurement,
// not a parse, and a missing instrument is not a failing game.
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT } = require('./domstub.js');

const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// ── THE INSTRUMENT ───────────────────────────────────────────────────────────

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH;
    if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
    let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) {
        for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) {
            const p = path.join(base, d, rel);
            if (fs.existsSync(p)) return p;
        }
    }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser',
                     '/usr/bin/google-chrome']) {
        if (fs.existsSync(p)) return p;
    }
    return null;
}

// The HUD pieces that all have to be legible together. The alarm triangle is
// hidden until an alarm is up, so the probe reveals it — a box that only
// appears mid-game is exactly the one nobody checks. The dock is a tablet's and
// a desktop's; a phone (700px and under) has the radial menu's hub instead.
const IDS = ['shards', 'ui', 'ultWrap', 'topToggles', 'zoneInfo', 'alarmIcon', 'mixTool',
             'squadBar', 'facilityNewChip', 'radialHub'];
const expectedAt = (id, w) => id === 'topToggles' ? w > 700 : id === 'radialHub' ? w <= 700 : true;

// The longest ultimate caption, which is what used to run out from under the
// bar and finish underneath the siphon switch.
const ULT_CAPTION = 'NO SQUAD IN RANGE · 100%';

// Headless Chromium will not open a window narrower than 500 CSS px, so 500 is
// the narrowest this can measure. It is still below the caption's breakpoint,
// so it exercises the case that was broken — but it is NOT phone-portrait
// width. The rules that only matter below 500 (the 480px centre-column
// override) are covered by the source checks above rather than by measurement,
// and that is the limit of this instrument.
const SIZES = [[500, 800], [620, 900], [768, 1024], [1024, 768], [1440, 900]];

// Build a copy of the game whose scripts still resolve against the repo, with a
// probe appended that measures the HUD and writes the answer into the DOM where
// --dump-dom will hand it back. No browser-driver dependency, and it is the
// real page: the real CSS, the real boot, the real fonts.
function probeSource() {
    let html = HTML.replace(/<head>/i, '<head><base href="file://' + ROOT + '/">');
    const probe = `
<script>
setTimeout(function () {
  var report = { vw: innerWidth, vh: innerHeight, boxes: {}, hits: {}, text: {} };
  try {
  report.facility = typeof facilityPlay !== 'undefined' && facilityPlay;
  // Put the HUD into its worst state: the longest ultimate caption, and the
  // alarm triangle, which stays hidden until an alarm is up, made visible.
  var u = document.getElementById('ultLabel');
  if (u) u.textContent = ${JSON.stringify(ULT_CAPTION)};
  document.body.classList.add('alarm-on');
  report.panelOpen = document.body.classList.contains('panel-open');
  ${JSON.stringify(IDS)}.forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    var r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    report.boxes[id] = { x: Math.round(r.x), y: Math.round(r.y),
                         w: Math.round(r.width), h: Math.round(r.height) };
  });
  // Does the pixel on each control actually belong to that control? The HUD
  // column is see-through so taps reach the cavern; every control inside it
  // has to take its own clicks back, or the bar stops firing.
  function at(id, fx, fy) {
    var el = document.getElementById(id);
    if (!el) return 'missing';
    var r = el.getBoundingClientRect();
    var hit = document.elementFromPoint(r.x + r.width * fx, r.y + r.height * fy);
    // a click on the button's own label or icon (a child) reaches the button, so it counts as the button
    return hit ? (el.contains(hit) ? id : (hit.id || hit.tagName)) : 'nothing';
  }
  report.hits.ultWrap   = at('ultWrap', 0.2, 0.5);
  report.hits.siphonBtn = at('siphonBtn', 0.5, 0.5);
  report.hits.btnRoster = at('btnRoster', 0.5, 0.5);
  // On a phone (<= 700px) the dock is replaced by the radial menu's hub (js/radialmenu.js).
  report.hits.radialHub = at('radialHub', 0.5, 0.5);
  report.topHidden = getComputedStyle(document.getElementById('topToggles')).display === 'none';
  // ...and an empty corner of the column must NOT take them, or it swallows
  // taps meant for the world underneath.
  var hud = document.getElementById('topHud').getBoundingClientRect();
  var gap = document.elementFromPoint(hud.x + 4, hud.y + hud.height - 3);
  report.hits.gap = gap ? (gap.id || gap.tagName) : 'nothing';
  // How wide the ultimate caption actually draws, against the room it has.
  if (u) {
    var rg = document.createRange();
    rg.selectNodeContents(u);
    report.text.ultLabel = Math.round(rg.getBoundingClientRect().width);
    report.text.ultLabelBox = Math.round(u.getBoundingClientRect().width);
    report.text.ultLabelRight = Math.round(u.getBoundingClientRect().right);
    var sb = document.getElementById('siphonBtn');
    report.text.siphonLeft = sb ? Math.round(sb.getBoundingClientRect().x) : null;
  }
  } catch (e) { report.err = String(e && e.stack || e); }
  var pre = document.createElement('pre');
  pre.id = 'HUDPROBE';
  pre.textContent = JSON.stringify(report);
  document.body.appendChild(pre);
}, 1200);
<\/script>`;
    return html.replace(/<\/body>/i, probe + '</body>');
}

function measure(chrome, dir, w, h) {
    const file = path.join(dir, `probe-${w}x${h}.html`);
    fs.writeFileSync(file, probeSource());
    const dom = execFileSync(chrome, [
        '--headless', '--disable-gpu', '--no-sandbox', '--mute-audio',
        '--allow-file-access-from-files', '--hide-scrollbars',
        `--window-size=${w},${h}`, '--virtual-time-budget=6000',
        '--dump-dom', 'file://' + file,
    ], { encoding: 'utf8', maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] });
    const m = dom.match(/<pre id="HUDPROBE">([\s\S]*?)<\/pre>/);
    if (!m) throw new Error(`the page never reported at ${w}x${h} — it did not boot`);
    const raw = m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    return JSON.parse(raw);
}

function overlaps(boxes) {
    const names = Object.keys(boxes);
    const hits = [];
    for (let i = 0; i < names.length; i++) {
        for (let j = i + 1; j < names.length; j++) {
            const a = boxes[names[i]], b = boxes[names[j]];
            const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
            const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
            if (ox > 1 && oy > 1) hits.push(`${names[i]} x ${names[j]} (${ox}x${oy}px)`);
        }
    }
    return hits;
}

// ── WHAT THE SOURCE HAS TO SAY ───────────────────────────────────────────────
// These run with or without a browser: they are the rules that let the measured
// layout hold, so a change that breaks them is caught even where nothing can be
// measured.

group('the HUD is laid out by the browser, not by hand');

check('the top HUD is a flow column, so nothing can be placed on top of anything', () => {
    const at = HTML.indexOf('#topHud');
    ok(at > -1, '#topHud is gone');
    const block = HTML.slice(at, HTML.indexOf('}', at));
    ok(/display:\s*flex/.test(block), '#topHud is not a flex container');
    ok(/flex-direction:\s*column/.test(block), '#topHud does not stack its rows');
});

check('no HUD piece picks its own coordinates any more', () => {
    // Hand-placed `top:`/`left:` is exactly how the pieces ended up on top of
    // each other: coordinates chosen on one screen width do not survive another.
    const start = HTML.indexOf('#topHud');
    const end = HTML.indexOf('#overlay');
    ok(start > -1 && end > start, 'the HUD stylesheet could not be located');
    const css = HTML.slice(start, end).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const id of ['#shards', '#zoneLine', '#zoneInfo', '#ui', '#hudRow1']) {
        const at = css.indexOf(id + ' ');
        if (at < 0) continue;
        const block = css.slice(at, css.indexOf('}', at));
        ok(!/position:\s*(fixed|absolute)/.test(block),
           id + ' is still positioned by hand, so it will collide again');
    }
});

check('the objective banner of the strip game is gone from the page, not hidden', () => {
    ok(!/id="waveInfo"/.test(HTML) && !/#waveInfo/.test(HTML), 'the banner is still in the page');
    ok(!/id="padHud"|id="dnaHud"|id="devBtn"|id="aimRing"|id="btnSquad"|id="btnBuild"/.test(HTML), 'a piece of the strip game\'s HUD is still in the page');
});

check('the ultimate caption is clipped, not spilled', () => {
    const at = HTML.indexOf('#ultLabel {');
    const block = HTML.slice(at, HTML.indexOf('}', at));
    ok(/overflow:\s*hidden/.test(block) && /white-space:\s*nowrap/.test(block),
       'a long caption can still escape the bar');
    ok(/@media[^{]*max-width:\s*5\d\dpx[^}]*\{[^}]*#ultLabel/.test(
           HTML.replace(/\s+/g, ' ')),
       'the caption never shrinks, so it is clipped on a phone instead of fitting');
});

check('the controls inside the see-through column take their clicks back', () => {
    const at = HTML.indexOf('#topHud');
    const css = HTML.slice(at, HTML.indexOf('#overlay'));
    ok(/pointer-events:\s*none/.test(css), 'the HUD column swallows taps meant for the cavern');
    const flat = css.replace(/\s+/g, ' ');
    const takers = flat.match(/([^{};]*)\{[^}]*pointer-events: auto[^}]*\}/g) || [];
    const named = takers.join(' ');
    for (const sel of ['#ultWrap', '#siphonBtn', '.top-btn']) {
        ok(named.indexOf(sel) > -1,
           sel + ' does not take its clicks back from the see-through column');
    }
});

check('the in-game index describes the HUD the player is actually looking at', () => {
    const at = HTML.indexOf('THE HUD &mdash; WHAT IS WHERE');
    ok(at > -1, 'the index never explains the HUD');
    const docs = HTML.slice(at, at + 2500);
    // The pieces the index names are the pieces the page has.
    for (const [word, id] of [['crystals', 'shards'], ['ULTIMATE', 'ultWrap'], ['room tag', 'zoneInfo'], ['alarm triangle', 'alarmIcon'], ['squad bar', 'squadBar']]) {
        ok(docs.indexOf(word) > -1, 'the index does not mention the ' + word);
        ok(new RegExp('id="' + id + '"').test(HTML), 'the index promises ' + word + ', which the page has not got');
    }
    ok(/siphon switch/.test(docs) && /id="siphonBtn"/.test(HTML), 'the siphon switch');
    // The alarm names the index lists are the ones the code can raise (js/alarm.js).
    const ALARM = fs.readFileSync(path.join(ROOT, 'js/alarm.js'), 'utf8');
    for (const kind of ['PROXIMITY ALARM', 'FACILITY BREACH']) {
        ok(HTML.indexOf(kind) > -1, 'the index does not mention ' + kind);
        ok(ALARM.indexOf(kind) > -1, 'the index promises ' + kind + ', which the alarm cannot raise');
    }
    ok(!/HOME SECURE|NEXT: ZONE|ZONE ALARM/.test(HTML), 'the index still describes the strip game\'s banner');
});

// ── WHAT THE BROWSER SAYS ────────────────────────────────────────────────────

const chrome = findChromium();
if (!chrome) {
    console.log('\nthe measured layout');
    console.log('  --   skipped: no Chromium in this container, so the HUD could');
    console.log('       not be laid out and measured. Set CHROMIUM_PATH to run it.');
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
}

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'conduit-hud-'));
const runs = [];
try {
    for (const [w, h] of SIZES) runs.push({ w, h, r: measure(chrome, dir, w, h) });
} finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

group('the measured layout, in a real browser');

check('the fixture really measured something: the facility booted, and every piece of its HUD was found', () => {
    same(runs.length, SIZES.length, 'not every screen size was measured');
    for (const run of runs) {
        ok(!run.r.err, `the probe threw at ${run.w}x${run.h}: ${run.r.err}`);
        same(run.r.facility, true, `the page did not boot the facility at ${run.w}x${run.h}`);
        same(run.r.panelOpen, false, `a panel is open over the HUD at boot at ${run.w}x${run.h}`);
        for (const id of IDS) {
            if (!expectedAt(id, run.w)) { ok(!run.r.boxes[id], `${id} is shown at ${run.w}x${run.h}, where it should not be`); continue; }
            ok(run.r.boxes[id], `${id} was not found at ${run.w}x${run.h}`);
        }
    }
});

check('THE ASK: nothing in the HUD covers anything else, at any size', () => {
    const bad = [];
    for (const run of runs) {
        const hits = overlaps(run.r.boxes);
        if (hits.length) bad.push(`${run.w}x${run.h}: ${hits.join(', ')}`);
    }
    ok(bad.length === 0, 'HUD pieces overlap — ' + bad.join(' | '));
});

check('and nothing hangs off the edge of the screen', () => {
    const bad = [];
    for (const run of runs) {
        for (const [id, b] of Object.entries(run.r.boxes)) {
            if (b.x < -1 || b.y < -1 || b.x + b.w > run.r.vw + 1 || b.y + b.h > run.r.vh + 1) {
                bad.push(`${id} at ${run.w}x${run.h}`);
            }
        }
    }
    ok(bad.length === 0, 'HUD pieces run off screen — ' + bad.join(', '));
});

check('the ultimate caption stays inside its bar and clear of the switch', () => {
    const bad = [];
    for (const run of runs) {
        const t = run.r.text;
        if (!t || t.ultLabel == null) continue;
        if (t.ultLabel > t.ultLabelBox + 1) {
            bad.push(`${run.w}: caption needs ${t.ultLabel}px, box is ${t.ultLabelBox}px`);
        }
        if (t.siphonLeft != null && t.ultLabelRight > t.siphonLeft + 1) {
            bad.push(`${run.w}: the caption reaches the siphon switch`);
        }
    }
    ok(bad.length === 0, bad.join('; '));
});

group('the HUD still takes clicks');

check('the ultimate bar, its switch, the dock\'s buttons and the phone\'s hub are all hit', () => {
    for (const run of runs) {
        same(run.r.hits.ultWrap, 'ultWrap', `the ultimate bar is unclickable at ${run.w}`);
        same(run.r.hits.siphonBtn, 'siphonBtn', `the siphon switch is unclickable at ${run.w}`);
        same(run.r.topHidden, run.w <= 700, `the dock is ${run.r.topHidden ? 'hidden' : 'shown'} at ${run.w}`);
        if (run.r.topHidden) same(run.r.hits.radialHub, 'radialHub', `the radial menu hub is unclickable at ${run.w}`);   // a phone: the hub stands in for the dock
        else same(run.r.hits.btnRoster, 'btnRoster', `the ROSTER button is unclickable at ${run.w}`);
    }
});

check('but an empty gap in the HUD falls through to the cavern', () => {
    for (const run of runs) {
        ok(/canvas/i.test(run.r.hits.gap) || run.r.hits.gap === 'CANVAS',
           `a tap in an empty part of the HUD hits "${run.r.hits.gap}" at ${run.w}, not the cavern`);
    }
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
