// THE HUD: everything in it has to be readable at once, at any screen size.
//
// REPORTED, with a screenshot taken on a tablet: "update the HUD so that all
// parts are visible, the wave information is hidden."
//
// Every piece of the top HUD was hand-placed at absolute coordinates picked on
// a 1440-wide desktop, where they happen not to touch. Narrow the window and
// they slide into each other: on a 1024 tablet the health bar, the ultimate
// bar, the objective banner and the toggle row all overlapped, and the
// objective line — the one that says which zone to attack next — was underneath
// three of them. A phone was worse.
//
// On top of that the canvas painted its OWN copy of the objective at a fixed
// screen (230, 58), which is inside the banner's box on anything narrower than
// a desktop, so the two sentences printed over each other.
//
// These are layout bugs, and layout cannot be reasoned about from the source —
// it has to be measured. So this suite drives the real browser that ships in
// this container, loads the real game, and asks it where things ended up.
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

// The HUD pieces that all have to be legible together. dnaHud and padHud are
// hidden until they have something to say, so the probe reveals them — a box
// that only appears mid-game is exactly the one nobody checks.
const IDS = ['shards', 'ui', 'ultWrap', 'waveInfo', 'topToggles', 'zoneInfo',
             'dnaHud', 'padHud', 'tutBtn', 'devBtn'];

// The two longest lines the banner can produce — the worst case, not the
// opening one. Anything shorter has slack these do not.
const LINES = {
    objective: 'ZONE 11 TAKEN  →  NEXT: ZONE 12 — hack a nest there',
    alarm: '⚠ FACILITY BREACH — TAKING ZONE 12 — Kill 18/24',
};
// The longest ultimate caption, which is what used to run out from under the
// bar and finish underneath the siphon switch.
const ULT_CAPTION = 'NO SQUAD IN RANGE · 100%';

// Headless Chromium will not open a window narrower than 500 CSS px, so 500 is
// the narrowest this can measure. It is still narrower than the longest banner
// and below the caption's breakpoint, so it exercises the case that was broken
// — but it is NOT phone-portrait width. The rules that only matter below 500
// (the 480px centre-column override) are covered by the source checks above
// rather than by measurement, and that is the limit of this instrument.
const SIZES = [[500, 800], [620, 900], [768, 1024], [1024, 768], [1440, 900]];

// Build a copy of the game whose scripts still resolve against the repo, with a
// probe appended that measures the HUD and writes the answer into the DOM where
// --dump-dom will hand it back. No browser-driver dependency, and it is the
// real page: the real CSS, the real boot, the real fonts.
function probeSource(line) {
    let html = HTML.replace(/<head>/i, '<head><base href="file://' + ROOT + '/">');
    const probe = `
<script>
setTimeout(function () {
  var report = { vw: innerWidth, vh: innerHeight, boxes: {}, hits: {}, text: {} };
  // Put the HUD into its worst state: the longest banner, the longest ultimate
  // caption, and the panels that stay hidden until mid-game made visible.
  var w = document.getElementById('waveInfo');
  if (w) w.textContent = ${JSON.stringify(line)};
  var u = document.getElementById('ultLabel');
  if (u) u.textContent = ${JSON.stringify(ULT_CAPTION)};
  ['dnaHud', 'padHud'].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.style.display = '';
    el.textContent = id === 'dnaHud' ? 'DNA: ant x3' : 'PAD +2';
  });
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
    return hit ? (hit.id || hit.tagName) : 'nothing';
  }
  report.hits.ultWrap   = at('ultWrap', 0.2, 0.5);
  report.hits.siphonBtn = at('siphonBtn', 0.5, 0.5);
  report.hits.btnSquad  = at('btnSquad', 0.5, 0.5);
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
  var pre = document.createElement('pre');
  pre.id = 'HUDPROBE';
  pre.textContent = JSON.stringify(report);
  document.body.appendChild(pre);
}, 1200);
<\/script>`;
    return html.replace(/<\/body>/i, probe + '</body>');
}

function measure(chrome, dir, w, h, line) {
    const file = path.join(dir, `probe-${w}x${h}-${line.length}.html`);
    fs.writeFileSync(file, probeSource(line));
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
    for (const id of ['#shards', '#waveInfo', '#topToggles', '#zoneInfo', '#ui']) {
        const at = css.indexOf(id + ' ');
        if (at < 0) continue;
        const block = css.slice(at, css.indexOf('}', at));
        ok(!/position:\s*(fixed|absolute)/.test(block),
           id + ' is still positioned by hand, so it will collide again');
    }
});

check('the banner shrinks to fit instead of running off the edge', () => {
    const at = HTML.indexOf('#waveInfo {');
    const block = HTML.slice(at, HTML.indexOf('}', at));
    ok(/clamp\(/.test(block), 'the objective line has a fixed size, so it cannot fit a phone');
    ok(/max-width:\s*100%/.test(block), 'the objective line is not bounded by the screen');
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

check('the DEV button is out of the player HUD', () => {
    // It was pinned to the top right at z-index 9999, directly over the pad
    // readout and the zone name.
    const DEV = fs.readFileSync(path.join(ROOT, 'js/dev.js'), 'utf8');
    const at = DEV.indexOf('devBtn.textContent');
    ok(at > -1, 'the DEV button could not be located');
    const block = DEV.slice(at, at + 400);
    ok(!/top:"15px"/.test(block), 'the DEV button is still parked on the top HUD');
    ok(/bottom:/.test(block), 'the DEV button is not anchored to the bottom');
});

check('the in-game index describes the bar the player is actually looking at', () => {
    const at = HTML.indexOf('THE TOP BAR');
    ok(at > -1, 'the index never explains the top bar');
    const docs = HTML.slice(at, at + 3000);
    // The three alarm names moved from the canvas onto the banner. If the index
    // lists one the code cannot produce, the docs have drifted.
    const WAVES = fs.readFileSync(path.join(ROOT, 'js/waves.js'), 'utf8');
    for (const kind of ['PROXIMITY ALARM', 'ZONE ALARM', 'FACILITY BREACH']) {
        ok(docs.indexOf(kind) > -1, 'the index does not mention ' + kind);
        ok(WAVES.indexOf(kind) > -1, 'the index promises ' + kind + ', which the banner cannot say');
    }
    ok(/HOME SECURE/.test(docs) && /HOME SECURE/.test(WAVES),
       'the index and the banner disagree about the opening line');
    ok(/NEXT: ZONE/.test(docs), 'the index does not show what the objective line looks like');
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
    for (const [w, h] of SIZES) {
        for (const [kind, line] of Object.entries(LINES)) {
            runs.push({ w, h, kind, r: measure(chrome, dir, w, h, line) });
        }
    }
} finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
}

group('the measured layout, in a real browser');

check('the fixture really measured something', () => {
    same(runs.length, SIZES.length * 2, 'not every screen size was measured');
    for (const run of runs) {
        const n = Object.keys(run.r.boxes).length;
        ok(n >= 7, `only ${n} HUD boxes were found at ${run.w}x${run.h} — the page did not boot`);
        ok(run.r.boxes.waveInfo, `the objective banner is missing at ${run.w}x${run.h}`);
    }
});

check('THE ASK: nothing in the HUD covers anything else, at any size', () => {
    const bad = [];
    for (const run of runs) {
        const hits = overlaps(run.r.boxes);
        if (hits.length) bad.push(`${run.w}x${run.h} (${run.kind}): ${hits.join(', ')}`);
    }
    ok(bad.length === 0, 'HUD pieces overlap — ' + bad.join(' | '));
});

check('and nothing hangs off the edge of the screen', () => {
    const bad = [];
    for (const run of runs) {
        for (const [id, b] of Object.entries(run.r.boxes)) {
            if (b.x < -1 || b.y < -1 || b.x + b.w > run.r.vw + 1 || b.y + b.h > run.r.vh + 1) {
                bad.push(`${id} at ${run.w}x${run.h} (${run.kind})`);
            }
        }
    }
    ok(bad.length === 0, 'HUD pieces run off screen — ' + bad.join(', '));
});

check('THE ASK: the objective line is on top of nothing and under nothing', () => {
    // This is the piece the screenshot showed buried. It gets its own check so
    // a regression names it rather than hiding in a list.
    const bad = [];
    for (const run of runs) {
        const w = run.r.boxes.waveInfo;
        for (const [id, b] of Object.entries(run.r.boxes)) {
            if (id === 'waveInfo') continue;
            const ox = Math.min(w.x + w.w, b.x + b.w) - Math.max(w.x, b.x);
            const oy = Math.min(w.y + w.h, b.y + b.h) - Math.max(w.y, b.y);
            if (ox > 1 && oy > 1) bad.push(`${id} at ${run.w}x${run.h} (${run.kind})`);
        }
        ok(w.w > 40 && w.h > 10, `the banner collapsed at ${run.w}x${run.h}`);
    }
    ok(bad.length === 0, 'the wave information is covered by ' + bad.join(', '));
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

check('the ultimate bar, its switch and the toggles are all hit', () => {
    for (const run of runs) {
        same(run.r.hits.ultWrap, 'ultWrap', `the ultimate bar is unclickable at ${run.w}`);
        same(run.r.hits.siphonBtn, 'siphonBtn', `the siphon switch is unclickable at ${run.w}`);
        same(run.r.hits.btnSquad, 'btnSquad', `the SQUAD button is unclickable at ${run.w}`);
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
