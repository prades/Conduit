// THE BOTTOM OF THE SCREEN: the dock, the squad bar, the battle tool and its enemy card, and the phone's round buttons, at every width: none of them lies over another; and the facility has no "N SELECTED / X / ROSTER" chip.
// ASKED, first: "the thing that says [N] selected with an X button and a roster button, that needs to be not in the way of the new little follower squad viewer on the UI." The chip sat where the squad bar had been put (over its middle
// card on a tablet, over the foot of the cards on a phone); looking for it showed the bar itself over the dock at 701-900 px, over the tool at 901-1166 px, and over the phone's round buttons. The bar is now placed by the css variables
// --sb-bottom, --sb-h, --sb-w and --sb-cx (game.html): over the dock, its middle kept clear of the tool's column at the left and (a phone) of the round buttons at the right.
// ASKED, then: "I think the selected little number thing is kind of irrelevant because it shows you which ones you have selected, and you can only have the squad really selected. So just get rid of the little box that says how many are
// selected and keep the little rostered squad." There is no chip (the squad bar lights the selected cards; a tap on one lets it go): nothing in the page makes one.
// ASKED, last: "the on screen squad roster should shuffle into the nook above the attack menu to the left, remove the element picker and replace with 'all' button [...] pull their card roster information up on the fly" (and the groups
// of the HUD, one to a corner: docs/UI-STYLE.md "The HUD"). On a tablet or a desktop (701 px and wider) the three cards are STACKED over the battle tool at the bottom left, the enemy card is at the bottom right over the dock's line, the crystals and bars
// are at the top left and the zone tag at the top right; a picked member's card stands beside the stack. A phone keeps what it had.
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

// The real page, in the facility: the squad of three, one follower selected (its card is lit; there is no chip), a creature locked on (the enemy card); on a phone the battle tool is shut (its chip) and then open (its panel). Every piece's rectangle.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var st = document.createElement('style'); st.textContent = '#mixTool, #mixTool *, #squadBar, #squadBar *, #squadFly, #squadFly *, #selChip, #selChip * { transition: none !important; animation: none !important }'; document.head.appendChild(st);
  var rect = function(s){ var e = $(s); if (!e) return null; var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return null; var b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 ? [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)] : null; };
  var circle = function(c){ return [Math.round(c.x - c.r), Math.round(c.y - c.r), Math.round(c.x + c.r), Math.round(c.y + c.r)]; };
  var snap = function(){ var o = { dock: rect('#topToggles'), bar: rect('#squadBar'), panel: rect('#mixTool .mt-panel'), pod: rect('#mixTool .mt-pod'), foe: rect('#mixTool .mt-foe'), fly: rect('#squadFly.on'), hudl: rect('#hudLeft'), hudc: rect('#hudCentre'), hudr: rect('#zoneLine'), slots: [] };
    var sl = document.querySelectorAll('#squadBar .sb-slot'); for (var i = 0; i < sl.length; i++) { var b = sl[i].getBoundingClientRect(); o.slots.push([Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]); }
    if (!dockHasMenus()) { frameNow(); o.round = [circle(_SETTINGSBTN), circle(_BLOB)]; } return o; };   // (a phone's round buttons: SETTINGS at the right edge, js/settings.js; the DNA button, js/clone.js)
  var frameNow = function(){ try { render(); } catch (e) {} };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; frameNow();
    out.size = { w: innerWidth, h: innerHeight, wide: mixToolWide() };
    // one selected (the squad bar lights its card, and nothing else says how many); one creature locked on: the enemy card
    selectedUnits.clear(); selectedUnits.add(followers[0]); squadMode = 'selected'; partyTick();
    actors = actors.filter(function(a){ return !(a instanceof Predator); }); var e = spawnCreature({ species: 'beetle', className: 'tank' }); e.x = player.x + 3; e.y = player.y + 1; e.state = 'wander'; e.provoked = false; e.moveSpeed = 0; e.baseMoveSpeed = 0;
    targetSet(e, true); mixToolRender(true); frameNow(); await wait(60);
    out.shut = snap();
    if (!mixToolWide()) { crystalMenuOpen = true; mixToolRender(true); frameNow(); await wait(60); out.open = snap(); crystalMenuOpen = false; mixToolRender(true); }
    // what lets a selection go without it: a tap on the lit card, the battle tool's WHO row (ALL)
    selectedUnits.clear(); partyBarRender(true); var slot0 = $('#squadBar .sb-slot'); var click = function(el){ el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
    click(slot0); await wait(30); out.lit = { size: selectedUnits.size, cls: slot0.classList.contains('sel') }; click(slot0); await wait(30); out.lit.after = [selectedUnits.size, slot0.classList.contains('sel')]; out.lit.flyAfter = !!document.querySelector('#squadFly.on');
    selectedUnits.add(followers[0]); selectedUnits.add(followers[2]); partyBarRender(true); out.lit.two = $$('#squadBar .sb-slot.sel').length; mixToolScope('all'); partyBarRender(true); out.lit.scope = [selectedUnits.size, $$('#squadBar .sb-slot.sel').length];
    // an empty slot or two (a follower holding a room): the bar keeps its height
    followers[1].post = partyRoomAt(followers[1].x, followers[1].y); followers[2].post = followers[1].post; partyTick(); await wait(60); out.empty = snap();
    // the chip: there is none, with one selected (or three, or one the roster picked that holds a room): nothing makes it
    selectedUnits.clear(); selectedUnits.add(followers[0]); partyTick(); await wait(30);
    out.chip = { made: !!document.getElementById('selChip'), one: rect('#selChip'), maker: typeof ccRefreshChip };
    selectedUnits.clear(); for (var i = 0; i < followers.length; i++) selectedUnits.add(followers[i]); partyTick(); await wait(30); out.chip.three = rect('#selChip');
    selectedUnits.clear(); selectedUnits.add(followers[1]); partyTick(); await wait(30); out.chip.posted = rect('#selChip'); out.chip.madeAfter = !!document.getElementById('selChip');
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
        check(w + ' (' + state + '): the squad bar, the dock, the battle tool and the enemy card do not cross each other, and all are on the screen', () => {
            ok(s.bar, 'no squad bar'); ok(s.foe, 'no enemy card'); ok(phone ? (s.pod || s.panel) : s.panel, 'no tool'); if (!phone) ok(s.dock, 'no dock');
            const items = { dock: s.dock, bar: s.bar, tool: s.panel || s.pod, foe: s.foe }; const names = Object.keys(items).filter(k => items[k]);
            for (let i = 0; i < names.length; i++) { ok(inside(items[names[i]], w, h), names[i] + ' is off the screen: ' + items[names[i]]); for (let j = i + 1; j < names.length; j++) ok(!cross(items[names[i]], items[names[j]]), names[i] + ' ' + items[names[i]] + ' lies over ' + names[j] + ' ' + items[names[j]]); }
            if (s.round) for (const c of s.round) ok(!cross(c, s.bar), 'a round button ' + c + ' is under the bar ' + s.bar);
        });
    }
    check(w + ': the bar is over the dock (a tablet) and the middle of the screen as far as the tool and the round buttons let it be; it keeps its height whoever is in it, and its three slots are one height', () => {
        const b = r.shut.bar; if (!phone) ok(b[3] <= r.shut.dock[1] + 1, 'the bar ' + b + ' is not over the dock ' + r.shut.dock);
        same(r.empty.bar[3] - r.empty.bar[1], r.shut.bar[3] - r.shut.bar[1], 'the bar changed height with open slots'); same(r.shut.slots.length, 3, 'slots'); ok(r.shut.slots.every(q => q[3] - q[1] === r.shut.slots[0][3] - r.shut.slots[0][1]), 'the slots are not all one height: ' + JSON.stringify(r.shut.slots));
    });
    if (!phone) check(w + ': the corners: the three cards are stacked over the battle tool at the bottom left, the enemy card is at the bottom right over the dock\'s line, the crystals and the bars are at the top left and the zone tag at the top right, and a picked member\'s card stands beside the stack, clear of the tool, the dock and the enemy card', () => {
        const s = r.shut; ok(s.bar && s.panel && s.foe && s.dock && s.fly, 'a piece is missing: ' + JSON.stringify({ bar: s.bar, panel: s.panel, foe: s.foe, dock: s.dock, fly: s.fly }));
        ok(s.bar[3] <= s.panel[1] + 1, 'the stack ' + s.bar + ' is not over the tool ' + s.panel); ok(s.bar[0] <= 20 && s.panel[0] <= 20, 'not at the left: ' + s.bar + ' ' + s.panel); ok(s.bar[3] - s.bar[1] > (s.bar[2] - s.bar[0]) / 2, 'the cards are not stacked: ' + s.bar);
        ok(w - s.foe[2] <= 20 && s.foe[2] <= w && s.foe[1] > h / 2 && !cross(s.foe, s.dock), 'the enemy card ' + s.foe + ' is not at the bottom right, clear of the dock ' + s.dock);   // (on a wide screen the dock is narrower than the room: the card may stand beside it)
        ok(s.hudl && s.hudc && s.hudr && s.hudl[2] <= s.hudc[0] + 1 && s.hudc[0] < w / 2 && w - s.hudr[2] <= 30, 'the top: ' + JSON.stringify([s.hudl, s.hudc, s.hudr]));
        ok(s.fly[0] >= s.bar[2] && !cross(s.fly, s.panel) && !cross(s.fly, s.dock) && !cross(s.fly, s.foe) && inside(s.fly, w, h), 'the member\'s card ' + s.fly + ' lies over something (bar ' + s.bar + ', tool ' + s.panel + ', dock ' + s.dock + ', enemy card ' + s.foe + ')');
        ok(r.lit.flyAfter === false, 'the card stays after the member is let go');
    });
    check(w + ': there is no "N SELECTED" chip, with one selected, with all three, or with a follower the roster picked that holds a room: nothing in the page makes one', () => {
        same(r.chip.made, false, 'a chip is in the page'); same(r.chip.maker, 'undefined', 'the chip\'s code is still there'); same(r.chip.one, null, 'a chip with one selected'); same(r.chip.three, null, 'a chip with three selected'); same(r.chip.posted, null, 'a chip for a selected follower that holds a room'); same(r.chip.madeAfter, false, 'a chip was made along the way');
        ok(!/selChip|ccRefreshChip/.test(fs.readdirSync(path.join(ROOT, 'js')).map(f => rd('js/' + f)).join('\n')), 'a script still makes the chip');
    });
    check(w + ': without the chip, the squad bar says who is selected and lets them go: a tap on a card lights it (and the next tap lets it go), and the battle tool\'s WHO row (ALL) lets the whole selection go', () => {
        same(r.lit.size, 1, 'a tap on a card'); same(r.lit.cls, true, 'the card is not lit'); same(r.lit.after.join(), '0,false', 'a second tap'); same(r.lit.two, 2, 'two lit cards'); same(r.lit.scope.join(), '0,0', 'ALL in the tool leaves a selection');
    });
}
console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
