// THE BOTTOM OF THE SCREEN: the dock, the squad bar, the battle tool and its enemy card, and the phone's round buttons, at every width: none of them lies over another; and the facility has no "N SELECTED / X / ROSTER" chip.
// ASKED, first: "the thing that says [N] selected with an X button and a roster button, that needs to be not in the way of the new little follower squad viewer on the UI." The chip sat where the squad bar had been put (over its middle
// card on a tablet, over the foot of the cards on a phone); looking for it showed the bar itself over the dock at 701-900 px, over the tool at 901-1166 px, and over the phone's round buttons. The bar is now placed by the css variables
// --sb-bottom, --sb-h, --sb-w and --sb-cx (game.html): over the dock, its middle kept clear of the tool's column at the left and (a phone) of the round buttons at the right.
// ASKED, then: "I think the selected little number thing is kind of irrelevant because it shows you which ones you have selected, and you can only have the squad really selected. So just get rid of the little box that says how many are
// selected and keep the little rostered squad." There is no chip (the squad bar lights the selected cards; a tap on one lets it go): nothing in the page makes one.
// ASKED, last: "the on screen squad roster should shuffle into the nook above the attack menu to the left, remove the element picker and replace with 'all' button [...] pull their card roster information up on the fly" (and the groups
// of the HUD, one to a corner: docs/UI-STYLE.md "The HUD"). On a tablet or a desktop (701 px and wider) the three cards are STACKED over the battle tool at the bottom left, the enemy card is at the bottom right over the dock's line, the crystals and bars
// are at the top left and the zone tag at the top right; a picked member's card stands beside the stack. A phone keeps what it had.
// The member's card keeps clear of the dock and of the enemy card where they lie under it (the third member's card; a narrow screen): it goes up as far as it must, and its tip still
// points at the member's card on the stack (js/squadfly.js).
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
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}

// The real page, in the facility: the squad of three, one follower selected (its card is lit; there is no chip), a creature locked on (the enemy card); on a phone the battle tool is shut (its chip) and then open (its panel). Every piece's rectangle.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var st = document.createElement('style'); st.textContent = '#mixTool, #mixTool *, #squadBar, #squadBar *, #squadFly, #squadFly *, #selChip, #selChip * { transition: none !important; animation: none !important }'; document.head.appendChild(st);
  var rect = function(s){ var e = $(s); if (!e) return null; var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return null; var b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 ? [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)] : null; };
  var circle = function(c){ return [Math.round(c.x - c.r), Math.round(c.y - c.r), Math.round(c.x + c.r), Math.round(c.y + c.r)]; };
  var box = function(s){ var e = $(s); if (!e) return null; var b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 ? [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)] : null; };   // (where it stands, shown or hidden)
  var snap = function(){ var o = { dock: rect('#topToggles'), bar: rect('#squadBar'), panel: rect('#mixTool .mt-panel'), toolBox: box('#mixTool .mt-panel'), pod: rect('#mixTool .mt-pod'), foe: rect('#mixTool .mt-foe'), fly: rect('#squadFly.on'), hudl: rect('#hudLeft'), hudc: rect('#hudCentre'), core: rect('#coreHud'), coreOn: document.body.classList.contains('core-on'), hudr: rect('#zoneLine'), kit: rect('#kitCards'), pack: rect('#btnPack'), slots: [] };   // (CARDS and the PACK by THE CORE: build 2026-11-12g)
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
    // a tablet: the picked member's card is open, in the squad's corner (since build 2026-11-10c the stack and the tool's orders give way to it); then put away, the member still picked: the stack and the orders are back
    var vis = function(s){ var el = $(s); return el ? getComputedStyle(el).visibility : null; };
    out.card = snap(); out.card.corner = [vis('#squadBar'), vis('#mixTool .mt-main')].join(); out.card.tab = rect('#squadFly .sf-back');
    if (hudCorners()) { _sfAway = true; partyFlyRender(true); frameNow(); await wait(30); }
    out.shut = snap();
    // the third member's card, the lowest on the stack: in the same corner, clear of the dock and the enemy card
    var s2 = $$('#squadBar .sb-slot')[2];
    if (hudCorners() && s2 && s2._unit) { selectedUnits.clear(); selectedUnits.add(s2._unit); _sfAway = false; partyTick(); frameNow(); await wait(60);   // (as a tap on its card opens it: js/party.js partyBarClick)
      out.third = { fly: rect('#squadFly.on'), dock: rect('#topToggles'), foe: rect('#mixTool .mt-foe') };
      selectedUnits.clear(); selectedUnits.add(followers[0]); partyTick(); }
    if (!mixToolWide()) { crystalMenuOpen = true; mixToolRender(true); frameNow(); await wait(60); out.open = snap(); crystalMenuOpen = false; mixToolRender(true); }
    // what lets a selection go without it: a tap on the lit card, the battle tool's WHO row (ALL)
    selectedUnits.clear(); partyBarRender(true); var slot0 = $('#squadBar .sb-slot'); var click = function(el){ el.dispatchEvent(new MouseEvent('click', { bubbles: true })); if (el.closest && el.closest('#squadBar') && document.querySelector('#squadBar .sb-slot.peek')) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };   // (a card on the strip: the first tap lights it, the second opens it since build 2026-11-13j; this taps through to the open card, as the checks below were written for: tests/party.js has the two taps' own check)
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
        check(w + ' (' + state + '): the squad bar, the dock, the battle tool and the enemy card do not cross each other, and all are on the screen' + (phone ? '' : ' (the enemy card stands in the tool\'s place, over its orders: build 2026-11-11m)'), () => {
            ok(s.bar, 'no squad bar'); ok(s.foe, 'no enemy card'); ok(phone ? (s.pod || s.panel) : (s.panel || (s.toolBox && Math.abs(s.foe[0] - s.toolBox[0]) <= 24 && Math.abs(s.foe[3] - s.toolBox[3]) <= 2)), 'no tool, nor the enemy card in its place: ' + JSON.stringify([s.foe, s.toolBox])); if (!phone) ok(s.dock, 'no dock');
            const items = { dock: s.dock, bar: s.bar, tool: s.panel || s.pod, foe: s.foe, core: s.coreOn ? s.core : null }; const names = Object.keys(items).filter(k => items[k]);   // (THE CORE, build 2026-11-11t: your cube in the bottom-right corner; CARDS and the PACK in its slab since build 2026-11-12h)
            for (let i = 0; i < names.length; i++) { ok(inside(items[names[i]], w, h), names[i] + ' is off the screen: ' + items[names[i]]); for (let j = i + 1; j < names.length; j++) ok(!cross(items[names[i]], items[names[j]]), names[i] + ' ' + items[names[i]] + ' lies over ' + names[j] + ' ' + items[names[j]]); }
            if (s.round) for (const c of s.round) ok(!cross(c, s.bar), 'a round button ' + c + ' is under the bar ' + s.bar);
        });
    }
    check(w + ': the bar is ' + (phone ? 'in the middle of the screen as far as the tool and the round buttons let it be' : 'a strip of cards side by side, right of the dock and the orders (build 2026-11-12g: it stood under the dock, over the orders)') + '; it keeps its height whoever is in it, and its three slots are one height', () => {
        const b = r.shut.bar; if (!phone) { ok(b[0] >= Math.max(r.shut.dock[2], r.shut.toolBox[2]) - 1, 'the strip ' + b + ' is not right of the dock ' + r.shut.dock + ' and the orders ' + r.shut.toolBox); ok(b[2] - b[0] > b[3] - b[1], 'the cards are not side by side: ' + b); }
        same(r.empty.bar[3] - r.empty.bar[1], r.shut.bar[3] - r.shut.bar[1], 'the bar changed height with open slots'); same(r.shut.slots.length, 3, 'slots'); ok(r.shut.slots.every(q => q[3] - q[1] === r.shut.slots[0][3] - r.shut.slots[0][1]), 'the slots are not all one height: ' + JSON.stringify(r.shut.slots));
    });
    if (!phone) check(w + ': the corners (THE BOTTOM ROW, build 2026-11-12g): the orders at the bottom left with the dock standing on them; with a creature near the enemy card stands in the orders\' place, over them; the squad a strip of cards right of them, along the bottom (over THE CORE under 1020 px); THE CORE at the bottom right, CARDS and the PACK in its slab (build 2026-11-12h); a picked member\'s card stays at the foot where the orders stand (the strip, the orders, the dock, the enemy card, CARDS and the PACK give way to it), clear of THE CORE, its tab on top of it', () => {
        const s = r.shut, c = r.card, T = s.toolBox; ok(s.bar && T && s.foe && s.dock && c && c.fly, 'a piece is missing: ' + JSON.stringify({ bar: s.bar, tool: T, foe: s.foe, dock: s.dock, fly: c && c.fly }));
        ok(T[0] <= 20 && s.dock[0] <= 20 && (s.foe ? s.dock[3] <= s.foe[1] && s.foe[1] - s.dock[3] <= 16 : Math.abs(s.dock[3] - T[1]) <= 2), 'the dock ' + s.dock + ' does not stand on the orders ' + T + ' (or, with the enemy card up, on it: ' + s.foe + ', the upright card since build 2026-11-13f) at the left');
        same(s.panel, null, 'the orders show under the enemy card'); ok(s.foe[0] <= 24 && Math.abs(s.foe[3] - T[3]) <= 2 && !cross(s.foe, s.dock), 'the enemy card ' + s.foe + ' is not in the orders\' place ' + T + ', clear of the dock ' + s.dock);
        ok(s.coreOn && s.core && Math.abs(w - s.core[2] - 14) <= 1 && Math.abs(h - s.core[3] - 14) <= 1 && s.hudr && w - s.hudr[2] <= 30, 'the zone tag at the top right, and THE CORE in the bottom-right corner: ' + JSON.stringify([s.hudr, s.core]));
        if (w >= 1020) ok(Math.abs(s.bar[3] - T[3]) <= 2 && s.bar[2] <= s.core[0], 'the strip ' + s.bar + ' is not along the bottom, left of THE CORE ' + s.core); else ok(s.bar[3] <= s.core[1] + 1, 'the strip ' + s.bar + ' is not over THE CORE ' + s.core);
        ok(s.kit && s.pack && s.pack[0] >= s.core[0] + s.core[2] - s.core[0] - 200 && s.kit[2] <= s.core[2] && s.pack[2] <= s.kit[0] + 1 && s.kit[3] <= s.core[3] && s.kit[1] >= s.core[3] - 56 && Math.abs(s.pack[1] - s.kit[1]) <= 1, 'CARDS ' + s.kit + ' and the PACK ' + s.pack + ' are not side by side at the right of THE CORE\'s slab ' + s.core + ' (build 2026-11-12h)');
        same(c.corner, 'hidden,hidden', 'the strip and the orders while the card is open'); same(c.bar, null, 'the strip'); same(c.panel, null, 'the orders'); same(c.foe, null, 'the enemy card stayed (the owner: "Keep it down low at the bottom of the screen")'); same(c.kit, null, 'CARDS stayed'); same(c.pack, null, 'the PACK stayed');
        ok(Math.abs(c.fly[0] - T[0]) <= 2 && Math.abs(c.fly[3] - T[3]) <= 2, 'the member\'s card ' + c.fly + ' is not at the foot where the orders ' + T + ' stand');
        ok(!cross(c.fly, c.core) && inside(c.fly, w, h), 'the member\'s card ' + c.fly + ' lies over THE CORE ' + c.core + ', or off the screen');
        ok(c.tab && c.tab[1] >= 0 && c.tab[3] <= c.fly[1] + 1 && c.tab[0] >= c.fly[0], 'its tab ' + c.tab + ' is not on top of it ' + c.fly);
        ok(r.lit.flyAfter === false, 'the card stays after the member is let go');
    });
    if (!phone) check(w + ': the third member\'s card (the last on the strip) stands where the first\'s does, clear of the dock and the enemy card, on the screen', () => {
        const t = r.third; ok(t && t.fly, 'no card: ' + JSON.stringify(t));
        ok(!cross(t.fly, t.dock) && !cross(t.fly, t.foe) && inside(t.fly, w, h), 'the member\'s card ' + t.fly + ' lies over something (dock ' + t.dock + ', enemy card ' + t.foe + ')');
        ok(Math.abs(t.fly[0] - r.card.fly[0]) <= 1 && Math.abs(t.fly[3] - r.card.fly[3]) <= 1, 'the third member\'s card ' + t.fly + ' is not where the first\'s is ' + r.card.fly);
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
