// THE CAROUSEL: the facility's Command Center on a tablet or a desktop (js/commandcenter.js ccCarousel, js/party.js, game.html "THE CAROUSEL"; docs/UI-STYLE.md "The roster"; a phone is as it was).
// ASKED: the "Roster 5 · CAROUSEL" layout, "but no recruit button at the top": the squad's three slots across the top (a tap looks at that member, ✕ REMOVE takes it out, DISBAND the lot), the creature in view big in the middle with ◂ ▸ to walk the roster
// and its settings beside it, the filters and a strip of everyone under that (RECRUIT is the strip's last tile), and one bar at the foot (ADD TO SQUAD, SWAP IN FOR one of the three, REMOVE FROM SQUAD). What is in view is the roster's own focus: looking
// at a creature does not change who the orders in the world go to (the squad bar's pick). The logic runs in the sandbox, the page in the real browser at three sizes (no Chromium: it says so and passes).
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

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}

// The real page, in the facility: the roster opened, walked, edited and closed; each measurement is taken from what the page shows.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var st = document.createElement('style'); st.textContent = '#mixTool, #mixTool *, #squadBar, #squadBar *, #ccRoot, #ccRoot * { transition: none !important; animation: none !important }'; document.head.appendChild(st);
  var click = function(el){ el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  var texts = function(sel){ return $$(sel).map(function(e){ return e.textContent; }); };
  var rect = function(s){ var e = typeof s === 'string' ? $(s) : s; if (!e) return null; var r = e.getBoundingClientRect(); return { l: Math.round(r.left), t: Math.round(r.top), r: Math.round(r.right), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
  var shown = function(s){ var e = typeof s === 'string' ? $(s) : s; return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0; };
  var btn = function(root, label){ return $$(root + ' .cc-btn').find(function(b){ var l = b.querySelector('.cc-bl'); return l && l.textContent.indexOf(label) === 0; }) || null; };
  var slotNames = function(){ return $$('#ccSquadBox .sb-slot').map(function(e){ return e.classList.contains('empty') ? '-' : e.querySelector('.sb-name').textContent; }); };
  var picks = function(){ return $$('#ccSwap .cc-pick').map(function(b){ return b.querySelector('.cc-pk-t').firstChild.textContent; }); };
  var pickSubs = function(){ return $$('#ccSwap .cc-pick small').map(function(b){ return b.textContent; }); };
  var strip = function(){ return $$('#ccGrid .cc-card:not(.cc-rtile)'); };
  var lit = function(list){ return list.findIndex(function(e){ return e.classList.contains('sel'); }); };
  var focusName = function(){ return $('#ccFocus .cf-name').textContent; };
  var step = function(d){ click($('#ccFocus .cf-arrow.' + (d > 0 ? 'next' : 'prev'))); };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; shardCount = 900; for (var i = 0; i < 3; i++) recruitFollower(); partyTick(); selectedUnits.clear(); await wait(60);
    out.car = ccCarousel(); out.start = { members: partyMembers().length, posted: partyPosted().length, order: partyOrdered().map(unitTypeLabel).join() };
    ccOpen('roster'); await wait(300);
    if (!out.car) {   // a phone: the grid of cards and the side panel, as ever
      out.phone = { root: $('#ccRoot').className, recruit: shown('#ccRecruit'), focus: shown('#ccFocus'), swap: shown('#ccSwap'), disband: shown('#ccDisband'), tile: !!$('#ccGrid .cc-rtile'), chips: texts('#ccFilters .cc-btn .cc-bl'), cap: $('#ccShards .cc-sh-c').textContent, x: $$('#ccSquadBox .sb-x').filter(shown).length, no: $$('#ccSquadBox .sb-no').filter(shown).length };
      var pre0 = document.createElement('pre'); pre0.id = '__ca'; pre0.textContent = JSON.stringify(out); document.body.appendChild(pre0); return;
    }
    out.layout = { root: $('#ccRoot').className, recruitTop: shown('#ccRecruit'), cap: $('#ccShards .cc-sh-c').textContent, crystals: $('#ccShards .cc-sh-n').textContent, title: $('#ccTitle').textContent, summary: $('#ccSummary').textContent,
      head: $$('#ccRoot .cc-head button').filter(shown).map(function(b){ return b.textContent; }), sqHead: shown('.cc-sqbox-h') };
    out.squadRow = { names: slotNames(), nums: $$('#ccSquadBox .sb-no').filter(shown).map(function(e){ return e.textContent; }), xs: $$('#ccSquadBox .sb-x').filter(shown).map(function(e){ return e.textContent; }), lit: lit($$('#ccSquadBox .sb-slot')), disband: shown('#ccDisband'), disbandOff: $('#ccDisband').disabled, disbandText: $('#ccDisband').textContent,
      subs: $$('#ccSquadBox .sb-sub').map(function(e){ return [e.textContent, e.scrollWidth <= e.clientWidth + 1]; }), thumbs: $$('#ccSquadBox .sb-thumb').filter(shown).length, info: $$('#ccSquadBox .sb-info').filter(shown).length };
    out.focus = { name: focusName(), first: _ccFocus === partyOrdered()[0], lv: $('#ccFocus .cf-lv').textContent, el: $('#ccFocus .cf-el').textContent, state: $('#ccFocus .cf-state').textContent, bars: $$('#ccFocus .cf-bar').filter(shown).map(function(r){ return r.querySelector('.cf-k').textContent + ' ' + r.querySelector('em').textContent; }),
      widths: $$('#ccFocus .cf-bar').filter(shown).map(function(r){ return Math.round(r.querySelector('i b').getBoundingClientRect().width); }), arrows: [$('#ccFocus .cf-arrow.prev').disabled, $('#ccFocus .cf-arrow.next').disabled], art: rect('#ccFocus .cf-art'), card: rect('#ccFocus .cf-card'), canvas: [$('#ccFocus .cf-cv').width, $('#ccFocus .cf-cv').height], bar: $('#ccSwap').textContent };
    out.strip = { n: strip().length, tile: !!$('#ccGrid .cc-rtile'), tileLast: $('#ccGrid').lastElementChild.classList.contains('cc-rtile'), tileText: $('#ccGrid .cc-rtile').textContent, tileShown: shown('#ccGrid .cc-rtile'), order: strip().map(function(c){ return c.querySelector('.cc-name').textContent; }), nums: strip().map(function(c){ return c.querySelector('.cc-no').textContent; }).join(),
      lit: lit(strip()), litIsFocus: strip().some(function(c){ return c.classList.contains('sel') && c._unit === _ccFocus; }), chips: texts('#ccFilters .cc-btn .cc-bl'), names: strip().map(function(c){ var n = c.querySelector('.cc-name'); return n.scrollWidth <= n.clientWidth + 1; }), selected: selectedUnits.size, scrolls: $('#ccGrid').scrollWidth > $('#ccGrid').clientWidth + 1 };
    var R = { head: rect('#ccRoot .cc-head'), squad: rect('#ccSquadBoxWrap'), focus: rect('#ccFocus'), side: rect('#ccSide'), filters: rect('#ccFilters'), strip: rect('#ccGrid'), swap: rect('#ccSwap'), body: rect('#ccBody') };
    out.rects = R; out.scroll = { y: $('#ccBody').scrollHeight - $('#ccBody').clientHeight, x: $('#ccBody').scrollWidth - $('#ccBody').clientWidth, vw: innerWidth, vh: innerHeight };
    // walking: ▸ puts the next one of the strip in view (the squad slot and the strip card follow; the orders' selection does not move), ◂ from the first goes round to the last, the arrow keys do the same
    var f0 = _ccFocus; step(1); await wait(60);
    out.next = { is2: _ccFocus === partyOrdered()[1], name: focusName(), slot: lit($$('#ccSquadBox .sb-slot')), strip: lit(strip()), sel: selectedUnits.size, bar: $('#ccSwap').textContent };
    step(-1); await wait(30); out.back = { first: _ccFocus === f0 }; step(-1); await wait(30); var units = _ccStripUnits(); out.wrap = { last: _ccFocus === units[units.length - 1], stripLit: lit(strip()) === units.length - 1 }; step(1); await wait(30); out.wrapFwd = { first: _ccFocus === f0 };
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' })); await wait(30); out.keyRight = { is2: _ccFocus === units[1] }; window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' })); await wait(30); out.keyLeft = { first: _ccFocus === f0 };
    // a creature holding a room, tapped in the strip: it is in view, the bar offers SWAP IN FOR each of the three (the squad is full), the settings are its
    var posted = partyPosted()[0]; click(strip().find(function(c){ return c._unit === posted; })); await wait(60);
    out.posted = { is: _ccFocus === posted, name: focusName(), state: $('#ccFocus .cf-state').textContent, label: $('#ccSwap .cc-sw-l').textContent, picks: picks(), subs: pickSubs(), dds: texts('#ccSide .cc-dd .cc-dd-k'), btns: texts('#ccSide .cc-btn .cc-bl'), sel: selectedUnits.size, strip: strip().findIndex(function(c){ return c._unit === posted; }) === lit(strip()) };
    // nothing sits over a button: the point at the middle of each is the button (or a part of it)
    var hitOk = function(e){ var r = e.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!t && e.contains(t); }, inside = function(e){ var r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; };
    out.hits = { prev: hitOk($('#ccFocus .cf-arrow.prev')), next: hitOk($('#ccFocus .cf-arrow.next')), slots: $$('#ccSquadBox .sb-slot').map(hitOk), xs: $$('#ccSquadBox .sb-x').map(hitOk), disband: hitOk($('#ccDisband')), chips: $$('#ccFilters .cc-btn').filter(inside).map(hitOk), strip: strip().filter(inside).map(hitOk), tile: inside($('#ccGrid .cc-rtile')) ? hitOk($('#ccGrid .cc-rtile')) : null,
      dds: $$('#ccSide .cc-dd').map(hitOk), btns: $$('#ccSide .cc-btn').map(hitOk), picks: $$('#ccSwap .cc-pick').map(hitOk), head: $$('#ccRoot .cc-head button').filter(shown).map(hitOk) };
    var out0 = partyOrdered()[0], slot0 = out0.partySlot, label0 = unitTypeLabel(out0); click($$('#ccSwap .cc-pick')[0]); await wait(80);
    out.swapped = { in: partyIsMember(posted), slotSame: posted.partySlot === slot0, outPosted: !!out0.post, stays: _ccFocus === posted, bar: $('#ccSwap').textContent, picks: picks(), names: slotNames(), lit: lit($$('#ccSquadBox .sb-slot')), label0: label0, sel: selectedUnits.size, members: partyMembers().length };
    // REMOVE FROM SQUAD on the bar: it holds the room it is in, the squad has a free slot, the bar offers ADD TO SQUAD; ADD puts it back in a slot
    click($$('#ccSwap .cc-pick')[0]); await wait(80);
    out.removedBar = { posted: !!posted.post, members: partyMembers().length, stays: _ccFocus === posted, label: $('#ccSwap .cc-sw-l').textContent, picks: picks(), subs: pickSubs(), names: slotNames(), lit: lit($$('#ccSquadBox .sb-slot')) };
    click($$('#ccSwap .cc-pick')[0]); await wait(80);
    out.addedBar = { in: partyIsMember(posted), members: partyMembers().length, stays: _ccFocus === posted, label: $('#ccSwap .cc-sw-l').textContent, picks: picks(), lit: lit($$('#ccSquadBox .sb-slot')) };
    // ✕ REMOVE on a slot of the squad row: that member holds its room, its slot opens; the one in view stays
    var inView = _ccFocus, m1 = partyOrdered().find(function(f){ return f !== inView; }), s1 = m1.partySlot; click($$('#ccSquadBox .sb-slot')[s1].querySelector('.sb-x')); await wait(80);
    out.xRemove = { posted: !!m1.post, members: partyMembers().length, open: slotNames()[s1], stays: _ccFocus === inView, sel: selectedUnits.size, summary: $('#ccSummary').textContent };
    // an open slot: the roster lists who could fill it (NOT IN SQUAD), the first of them in view, ADD TO SQUAD for it
    click($$('#ccSquadBox .sb-slot.empty')[0]); await wait(120);
    var cands = _ccStripUnits(); out.openSlot = { filter: ccFilter.squad, onlyOut: cands.every(function(f){ return !partyIsMember(f); }), n: strip().length, nOut: followers.filter(function(f){ return !partyIsMember(f); }).length, first: _ccFocus === cands[0], inView: !partyIsMember(_ccFocus), label: $('#ccSwap .cc-sw-l').textContent, picks: picks(), lit: $$('#ccFilters .cc-btn.on .cc-bl').map(function(e){ return e.textContent; }), sel: selectedUnits.size };
    var cand = _ccFocus; click($$('#ccSwap .cc-pick')[0]); await wait(80); out.openAdded = { in: partyIsMember(cand), stays: _ccFocus === cand, members: partyMembers().length, slot: slotNames().indexOf('-') };
    click(btn('#ccFilters', 'ALL')); await wait(60);
    // the settings are for the one in view alone
    var tgt = _ccFocus, other = followers.filter(function(f){ return f !== tgt; }), roles0 = other.map(function(f){ return f.role + '/' + f.playStyle; }).join(), dd = function(i){ return $$('#ccSide .cc-dd')[i]; };
    click(dd(0)); await wait(40); out.roleList = texts('#ccSide .cc-dd-list .cc-btn .cc-bl'); click($$('#ccSide .cc-dd-list .cc-btn').find(function(b){ return b.textContent.indexOf('MAGE') === 0; })); await wait(60);
    click(dd(1)); await wait(40); out.playList = texts('#ccSide .cc-dd-list .cc-btn .cc-bl'); click($$('#ccSide .cc-dd-list .cc-btn').find(function(b){ return b.textContent.indexOf('AGGRESSIVE') === 0; })); await wait(60);
    out.styles = { role: tgt.role, play: tgt.playStyle, others: other.map(function(f){ return f.role + '/' + f.playStyle; }).join() === roles0, value: texts('#ccSide .cc-dd .cc-dd-v'), closed: $$('#ccSide .cc-dd-list').length };
    out.stats = { secs: texts('#ccSide .cc-sec'), rows: texts('#ccSide .cc-stat .cc-stat-k') };
    // INFO opens the unit's own card (attacks, jobs, stats)
    click(btn('#ccSide', 'INFO')); await wait(60); out.info = { open: !!$('#unitInfo'), title: $('#unitInfo .ui-title') ? $('#unitInfo .ui-title').textContent : null, is: unitTypeLabel(tgt) }; unitInfoClose();
    // RE-ROLL asks twice; the made-again follower leaves the roster and the next one comes into view
    var reTgt = _ccFocus, nb = _ccNeighbour(reTgt, 1); click(btn('#ccSide', 'RE-ROLL')); await wait(60); out.reroll1 = { label: btn('#ccSide', 'TAP AGAIN') ? 'TAP AGAIN' : null, note: texts('#ccSide .cc-note'), stays: _ccFocus === reTgt, still: followers.indexOf(reTgt) >= 0 };
    click(btn('#ccSide', 'TAP AGAIN')); await wait(80); out.reroll2 = { gone: followers.indexOf(reTgt) < 0, returning: !!reTgt.returningToCrystal, next: _ccFocus === nb, alive: ccUnits({}).indexOf(_ccFocus) >= 0, name: focusName() }; actors = actors.filter(function(a){ return a !== reTgt; });   // (it would walk home and come back as a follower in the middle of the next step)
    // RECRUIT: the strip's last tile; the new one is in view; it dims, and says what is missing, when the crystals are short
    var before = ccUnits({}).slice(), cry = shardCount; click($('#ccGrid .cc-rtile')); await wait(100);
    out.recruit = { cost: cry - shardCount, n: ccUnits({}).length - before.length, fresh: before.indexOf(_ccFocus) < 0, name: focusName(), tile: $('#ccGrid .cc-rtile').textContent, last: $('#ccGrid').lastElementChild.classList.contains('cc-rtile'), crystals: $('#ccShards .cc-sh-n').textContent };
    shardCount = 10; ccRender(); await wait(60); var keep = _ccFocus, cnt = ccUnits({}).length; click($('#ccGrid .cc-rtile')); await wait(60);
    out.short = { dim: $('#ccGrid .cc-rtile').classList.contains('dim'), text: $('#ccGrid .cc-rtile').textContent, n: ccUnits({}).length === cnt, stays: _ccFocus === keep, cap: $('#ccShards .cc-sh-c').textContent }; shardCount = 900;
    // the filters: no SELECT SHOWN, no CLEAR; IN SQUAD narrows the strip, the arrows walk what is shown
    out.filters = { chips: texts('#ccFilters .cc-btn .cc-bl') }; click(btn('#ccFilters', 'IN SQUAD')); await wait(60); var shownN = strip().length; var hold = partyPosted()[0]; ccFocusSet(hold); await wait(60); out.narrow = { n: shownN, members: partyMembers().length, litNone: lit(strip()) === -1, view: _ccFocus === hold };
    step(1); await wait(40); out.narrowStep = { first: _ccFocus === _ccStripUnits()[0], member: partyIsMember(_ccFocus) }; click(btn('#ccFilters', 'ALL')); await wait(60);
    // the orders' selection is the squad bar's: opened on the one picked there, walked, closed, it is as it was
    ccClose(); selectedUnits.clear(); var pick = partyOrdered()[1]; selectedUnits.add(pick); ccOpen('roster'); await wait(200);
    out.reopen = { onPick: _ccFocus === pick, sel: selectedUnits.size, has: selectedUnits.has(pick), lit: lit($$('#ccSquadBox .sb-slot')) === pick.partySlot };
    step(1); await wait(40); out.browsed = { moved: _ccFocus !== pick, sel: selectedUnits.size, has: selectedUnits.has(pick) };
    ccClose(); out.closed = { sel: selectedUnits.size, has: selectedUnits.has(pick), open: $('#ccRoot').classList.contains('open'), focus: _ccFocus === null, filter: ccFilter.squad }; ccOpen('roster'); await wait(200);
    var disb = partyMembers().length; click($('#ccDisband')); await wait(80); out.disband = { members: partyMembers().length, was: disb, names: slotNames(), off: $('#ccDisband').disabled, label: $('#ccSwap .cc-sw-l').textContent, picks: picks(), subs: pickSubs(), summary: $('#ccSummary').textContent, nums: $$('#ccSquadBox .sb-no').filter(shown).length };
    partyAdd(partyPosted().slice(0, 3)); ccRender(); await wait(60);
    // the SQUADS window still opens over the carousel (it has the squad's orders)
    click($('#ccSquadsBtn')); await wait(80); out.squads = { shown: getComputedStyle($('#ccSquadWin')).display, title: $('#ccSquadTitle').textContent, cards: $$('#ccSquadBody .cc-yoursquad .cc-card:not(.cc-open)').length, disband: !!$$('#ccSquadBody .cc-btn').find(function(b){ return b.textContent.indexOf('DISBAND SQUAD') === 0; }) };
    click($('#ccSquadsBtn')); await wait(60);
    ccClose();
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__ca'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ca-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=25000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__ca">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1180; canvas.height = 820; innerWidth = 1180;');   // (the page boots the facility: the start returns early; only the tutorial's blackout is lifted)
    run(`globalThis.__cell = (room, k) => { const cs = partyRoomCells(room); return cs[Math.floor(cs.length * (k === undefined ? 0.5 : k))]; };
        globalThis.__fresh = (n) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); squadMode = 'all'; floatingTexts.length = 0; ccFilter = { element: null, role: null, kind: null, squad: null }; _ccFocus = null; const c = __cell('crystal_chamber'); player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1];
            for (let i = 0; i < n; i++) { spawnFollowerAtCrystal(['electric', 'core', 'fire', 'ice', 'toxic', 'flux'][i % 6]); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.health = f.maxHealth = 1e7; f.x = player.x + 0.5 + i * 0.2; f.y = player.y + 0.5; }
            partyTick(); return followers.slice(); };`);

    group('THE CAROUSEL: where it applies, and what is in view (js/commandcenter.js)');
    check('the carousel is the facility\'s roster on a tablet or a desktop (wider than a phone); a phone keeps the grid of cards', () => {
        const r = J(`(function(){ const o = {}; innerWidth = 1180; o.wide = ccCarousel(); innerWidth = 701; o.edge = ccCarousel(); innerWidth = 700; o.phone = ccCarousel(); innerWidth = 1180; return o; })()`);
        same(r.wide, true, 'a tablet'); same(r.edge, true, 'just over a phone'); same(r.phone, false, 'a phone');
    });
    check('the strip lists the squad first in its slots, then the rest (the most evolved, then the highest level), then the clones; the filters narrow it', () => {
        const r = J(`(function(){ const fs = __fresh(6), o = {}; const mem = partyOrdered(), post = fs.filter(f => !!f.post); post[0].level = 7; post[1].level = 9; post[2].level = 3; post[2].evolved = 'fake';
            actors.push({ isClone: true, team: 'green', dead: false, speciesName: 'beetle', level: 1, element: 'fire' });
            const names = list => list.map(u => u.isClone ? 'clone' : u.partySlot !== undefined ? 'slot' + u.partySlot : 'L' + u.level + (u.evolved ? 'e' : ''));
            o.all = names(_ccStripUnits()); ccFilter.squad = 'out'; o.out = names(_ccStripUnits()); ccFilter.squad = 'in'; o.in = names(_ccStripUnits()); ccFilter.squad = null; ccFilter.kind = 'clone'; o.clone = names(_ccStripUnits()); ccFilter.kind = null; actors = actors.filter(a => !a.isClone); return o; })()`);
        same(r.all.join(), 'slot0,slot1,slot2,L3e,L9,L7,clone', 'the order'); same(r.out.join(), 'L3e,L9,L7', 'NOT IN SQUAD'); same(r.in.join(), 'slot0,slot1,slot2', 'IN SQUAD'); same(r.clone.join(), 'clone', 'CLONES');
    });
    check('the roster opens on the creature picked on its own, else the squad\'s first; it stays on that one while it is there; when it is gone the first of the strip comes into view; an open slot shows the first who could fill it (a pick on the squad bar stays; a phone clears it)', () => {
        const r = J(`(function(){ const fs = __fresh(5), o = {}; const mem = partyOrdered(), post = fs.filter(f => !!f.post);
            _ccFocus = null; o.none = _ccFocusEnsure() === mem[0]; o.stays = (selectedUnits.add(mem[2]), selectedUnits.add(post[0]), _ccFocusEnsure() === mem[0]); selectedUnits.clear();
            _ccFocus = null; selectedUnits.add(mem[2]); o.pick = _ccFocusEnsure() === mem[2]; selectedUnits.clear();
            _ccFocus = null; selectedUnits.add(mem[1]); selectedUnits.add(mem[2]); o.two = _ccFocusEnsure() === mem[0]; selectedUnits.clear();
            _ccFocus = mem[1]; mem[1].dead = true; o.gone = _ccFocusEnsure() === mem[0]; mem[1].dead = false;
            const keepOpen = ccOpen, keepRender = ccRender; ccOpen = function () {}; ccRender = function () {}; ccShowCandidates(); o.cand = [ccFilter.squad, post.indexOf(_ccFocus) >= 0, selectedUnits.size]; o.first = _ccFocus === _ccStripUnits()[0];
            selectedUnits.add(mem[1]); _ccFocus = null; ccShowCandidates(); o.pick = [selectedUnits.size, selectedUnits.has(mem[1]), post.indexOf(_ccFocus) >= 0]; selectedUnits.clear();
            innerWidth = 500; selectedUnits.add(mem[1]); ccShowCandidates(); o.phone = [selectedUnits.size, _ccFocus === null || post.indexOf(_ccFocus) < 0]; innerWidth = 1180; ccOpen = keepOpen; ccRender = keepRender; ccFilter.squad = null; _ccFocus = null; return o; })()`);
        ok(r.none, 'no pick: the squad\'s first'); ok(r.stays, 'two picked: still the first'); ok(r.pick, 'one picked on its own'); ok(r.two, 'two picked'); ok(r.gone, 'the creature in view is gone'); same(r.cand.join(), 'out,true,0', 'an open slot'); ok(r.first, 'the first who could fill it'); same(r.pick.join(), '1,true,true', 'a pick on the squad bar stays (looking does not change it) and the first who could fill the slot is in view'); same(r.phone[0], 0, 'a phone clears the selection, as it did');
    });
    check('◂ and ▸ walk the strip\'s order and go round; with one creature they do nothing; walking never touches the selection the orders in the world follow; RE-ROLL moves on to the next', () => {
        const r = J(`(function(){ const fs = __fresh(5), o = {}; const mem = partyOrdered(), list = _ccStripUnits(); selectedUnits.add(mem[1]); _ccFocus = list[0];
            o.walk = []; for (let i = 0; i < 6; i++) { ccFocusStep(1); o.walk.push(list.indexOf(_ccFocus)); } o.back = []; for (let i = 0; i < 2; i++) { ccFocusStep(-1); o.back.push(list.indexOf(_ccFocus)); }
            o.sel = [selectedUnits.size, selectedUnits.has(mem[1])]; o.nb = [_ccNeighbour(list[4], 1) === list[0], _ccNeighbour(list[0], -1) === list[4]];
            ccFilter.squad = 'in'; _ccFocus = list[1]; o.filtered = []; for (let i = 0; i < 4; i++) { ccFocusStep(1); o.filtered.push(list.indexOf(_ccFocus)); } ccFilter.squad = null;
            ccFilter.element = 'nothing'; o.empty = [ccFocusStep(1), _ccNeighbour(list[0], 1)]; ccFilter.element = null; return o; })()`);
        same(r.walk.join(), '1,2,3,4,0,1', 'walking right goes round'); same(r.back.join(), '0,4', 'walking left goes round'); same(r.sel.join(), '1,true', 'the selection'); same(r.nb.join(), 'true,true', 'neighbours'); same(r.filtered.join(), '2,0,1,2', 'walking what a filter shows'); same(r.empty.join(), 'false,', 'nobody to walk to');
    });
    check('the card in view shows HEALTH, POWER, SPEED, DEFENSE and ATTACK (a clone has no defense or attack), then its XP (how far through its level) and EVOLVES (how far it is from evolving: a follower that has not evolved); each bar is against the best of your roster, the health bar is what is left', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; const a = fs[0]; a.health = 30; a.maxHealth = 60; a.power = 10; a.moveSpeed = 0.02; a.stats = { defense: 20, attack: 5 }; fs[1].power = 20; fs[1].moveSpeed = 0.01; fs[1].stats = { defense: 40, attack: 10 }; fs[2].power = 5; fs[2].moveSpeed = 0.005; fs[2].stats = { defense: 10, attack: 5 };
            a.level = 7; a.xp = xpForLevel(7) + 85; fs[1].evolved = 'x'; o.rows = _ccFocusStats(a); o.evolved = _ccFocusStats(fs[1]).map(r => r[0]); fs[1].evolved = undefined; const clone = { isClone: true, team: 'green', dead: false, health: 5, maxHealth: 10, power: 2, moveSpeed: 0.01, element: 'fire', speciesName: 'beetle' }; actors.push(clone); o.clone = _ccFocusStats(clone).map(r => r[0]); actors = actors.filter(x => !x.isClone); return o; })()`);
        same(r.rows.map(x => x[0]).join(), 'HEALTH,POWER,SPEED,DEFENSE,ATTACK,XP,EVOLVES', 'the rows'); same(r.rows[5][2], '85 / 169', 'XP text: 85 of the 169 level 7 asks'); ok(Math.abs(r.rows[5][1] - 85 / 169) < 1e-9, 'XP bar'); same(r.rows[6][2], '572 TO GO', 'EVOLVES text: 1000 - 428'); ok(Math.abs(r.rows[6][1] - (428 - 125) / 875) < 1e-9, 'EVOLVES bar: from the recruit level to level 10'); same(r.evolved.join(), 'HEALTH,POWER,SPEED,DEFENSE,ATTACK,XP', 'an evolved follower has no EVOLVES'); same(r.rows[0][1], 0.5, 'health'); same(r.rows[0][2], '30 / 60', 'health text'); same(r.rows[1][1], 0.5, 'power against the best'); same(r.rows[1][2], '10', 'power text'); same(r.rows[2][1], 1, 'speed'); same(r.rows[3][1], 0.5, 'defense'); same(r.rows[4][1], 0.5, 'attack'); same(r.clone.join(), 'HEALTH,POWER,SPEED', 'a clone\'s rows');
    });
    check('the settings are for the one in view: ccSelectionSummary takes a list; the squad row lights the one in view, not the picked one (party.js)', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; selectedUnits.add(fs[1]); const S = ccSelectionSummary([fs[0]]); o.sum = [S.count, S.followers, S.playStyle]; o.def = ccSelectionSummary().count; return o; })()`);
        same(r.sum.join(), '1,1,balanced', 'a list'); same(r.def, 1, 'the selection by default');
        const p = rd('js/party.js'); ok(/partySlotsUpdate\(_sbxEls, typeof ccCarousel === "function" && ccCarousel\(\) && typeof ccFocusUnit === "function" \? \(f => f === ccFocusUnit\(\)\) : null\)/.test(p), 'the box lights the creature in view'); ok(/if \(typeof ccCarousel === "function" && ccCarousel\(\) && typeof ccFocusSet === "function"\) \{ ccFocusSet\(hit\.f\); return; \}/.test(p), 'a tap on a slot puts that member in view');
    });
    check('no recruit button at the top of the carousel: the header\'s RECRUIT is hidden there (it stays on a phone), the strip\'s last tile recruits, and the shards say YOUR SHARDS', () => {
        const c = rd('js/commandcenter.js');
        ok(/rec\.style\.display = ccOpenTab === "roster" && !car \? "" : "none"/.test(c), 'the header\'s RECRUIT'); ok(/_ccClick\(t, \(\) => \{ const had = new Set\(ccUnits\(\{\}\)\); if \(typeof recruitDo === "function"\) recruitDo\(\);/.test(c), 'the tile recruits'); ok(/car \? "YOUR SHARDS"/.test(c), 'the shards');
        ok(/if \(car\) return;   \/\/ \(the carousel picks one creature at a time: no SELECT SHOWN, no CLEAR\)/.test(c), 'SELECT SHOWN / CLEAR');
    });
    check('game.html: every rule of the carousel is scoped to #ccRoot.carousel or #ccRoot.slabs (what a phone shows is not touched), and the parts it adds are hidden until then', () => {
        const h = rd('game.html'), i = h.indexOf('THE CAROUSEL (docs/UI-STYLE.md'), j = h.indexOf('the move choices on a unit\'s INFO tab'); ok(i > 0 && j > i, 'the block'); const rules = h.slice(i, j).split('\n').filter(l => /^\s+(#|\.|@media)/.test(l));   // (the carousel's rules run up to the unit info's own, which come before THE CORNERS)
        ok(/\.sb-no, \.sb-x, \.cc-disband, \.cc-focus, \.cc-swap, \.cc-no \{ display: none; \}/.test(h), 'the hidden parts'); const loose = rules.filter(l => !/^\s+(#ccRoot\.(carousel|slabs)|@media|\.sb-no, \.sb-x)/.test(l)); same(loose.length, 0, 'unscoped rules: ' + loose.map(l => l.trim().slice(0, 60)).join(' | '));
    });

    group('THE ROSTER AS A CAROUSEL (real browser)');
    for (const [w, h] of [[1180, 820], [1024, 768], [820, 1180], [500, 800]]) {
        const r = measure(w, h);
        if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
        check(w + 'x' + h + ': the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); });
        if (!r || r.err) continue;
        if (w <= 700) {
            check(w + ': a phone keeps the roster of cards and the side panel: the header\'s RECRUIT, SELECT SHOWN and CLEAR, the old crystals line; none of the carousel\'s parts', () => {
                same(r.car, false, 'the carousel on a phone'); ok(!/carousel|slabs/.test(r.phone.root), 'classes ' + r.phone.root); same(r.phone.recruit, true, 'the header\'s RECRUIT'); same(r.phone.focus, false, 'the focus card'); same(r.phone.swap, false, 'the swap bar'); same(r.phone.disband, false, 'DISBAND'); same(r.phone.tile, false, 'the RECRUIT tile');
                ok(r.phone.chips.includes('SELECT SHOWN') && r.phone.chips.includes('CLEAR'), 'chips ' + r.phone.chips); ok(/EACH/.test(r.phone.cap) || /NEED/.test(r.phone.cap), 'crystals caption ' + r.phone.cap); same(r.phone.x, 0, '✕ REMOVE chips'); same(r.phone.no, 0, 'slot numbers');
            });
            continue;
        }
        check(w + ': the header: COMMAND CENTER, the summary, the shards (YOUR SHARDS), SQUADS and ✕ CLOSE, and NO recruit button; the squad box has no heading line (the summary says it)', () => {
            same(r.car, true, 'the carousel'); ok(/open slabs carousel/.test(r.layout.root), 'classes ' + r.layout.root); same(r.layout.recruitTop, false, 'a recruit button at the top'); same(r.layout.cap, 'YOUR SHARDS', 'the caption'); ok(/^◆ \d+$/.test(r.layout.crystals), 'crystals ' + r.layout.crystals); same(r.layout.title, 'COMMAND CENTER', 'title'); ok(/^SQUAD 3\/3 · 3 POSTED · 6 UNITS$/.test(r.layout.summary), 'summary ' + r.layout.summary);
            same(r.layout.head.join('|'), 'SQUADS|✕ CLOSE', 'the header\'s buttons'); same(r.layout.sqHead, false, 'the squad box heading');
        });
        check(w + ': the squad row: three slots numbered 1 to 3 with the member, its state and a ✕ REMOVE (no i, the card in view has INFO), the first member lit, and DISBAND; the state line is not cut', () => {
            same(r.squadRow.names.length, 3, 'slots'); ok(r.squadRow.names.every(n => n !== '-' && n.length > 4), 'names ' + r.squadRow.names); same(r.squadRow.nums.join(), '1,2,3', 'the numbers'); same(r.squadRow.xs.join('|'), '✕ REMOVE|✕ REMOVE|✕ REMOVE', 'REMOVE on each'); same(r.squadRow.info, 0, 'the i button'); same(r.squadRow.lit, 0, 'the lit slot'); same(r.squadRow.disband, true, 'DISBAND'); same(r.squadRow.disbandOff, false, 'DISBAND is off'); same(r.squadRow.disbandText, 'DISBAND', 'its words');
            if (w > 900) ok(r.squadRow.subs.every(s => /^LV \d+ · FOLLOWING$/.test(s[0]) && s[1]), 'state lines ' + JSON.stringify(r.squadRow.subs)); same(r.squadRow.thumbs, w > 1100 ? 3 : 0, 'the pictures (they give way under 1100 px, the state line under 900)');
        });
        check(w + ': the creature in view is the squad\'s first: its picture, LV, element, name, state, and its bars with numbers (HEALTH, POWER, SPEED, DEFENSE, ATTACK, then XP and EVOLVES); the arrows are on', () => {
            same(r.focus.first, true, 'the first of the squad'); same(r.focus.name, r.squadRow.names[0], 'the name'); ok(/^LV \d+$/.test(r.focus.lv), 'level ' + r.focus.lv); ok(/^[A-Z]+$/.test(r.focus.el), 'element ' + r.focus.el); same(r.focus.state, 'FOLLOWING', 'state'); same(r.focus.bars.map(b => b.split(' ')[0]).slice(0, 5).join(), 'HEALTH,POWER,SPEED,DEFENSE,ATTACK', 'the bars'); ok(/^XP( EVOLVES)?$/.test(r.focus.bars.slice(5).map(b => b.split(' ')[0]).join(' ')), 'the XP bars: ' + r.focus.bars.slice(5));
            ok(r.focus.bars.every(b => /\d/.test(b)), 'numbers ' + r.focus.bars); ok(r.focus.widths.slice(0, 5).every(x => x > 10), 'the bars have length ' + r.focus.widths); same(r.focus.arrows.join(), 'false,false', 'the arrows'); same(r.focus.canvas.join(), '128,128', 'the picture'); ok(r.focus.art.w > 150 && r.focus.art.h > 170, 'the picture is big: ' + JSON.stringify(r.focus.art));
        });
        check(w + ': the strip: everyone, the squad first with its numbers, the one in view lit, RECRUIT ◆30 as its last tile (with how many you can afford), the filters without SELECT SHOWN and CLEAR', () => {
            same(r.strip.n, 6, 'cards'); same(r.strip.tile, true, 'the tile'); same(r.strip.tileLast, true, 'the tile is last'); same(r.strip.tileShown, true, 'the tile is on screen'); ok(/^\+RECRUIT ◆30\d+ AFFORDABLE$/.test(r.strip.tileText), 'tile ' + r.strip.tileText); same(r.strip.nums, '1,2,3,,,', 'the squad\'s numbers'); same(r.strip.lit, 0, 'the lit card'); same(r.strip.litIsFocus, true, 'the lit card is the one in view');
            same(r.strip.order.slice(0, 3).join(), r.squadRow.names.join(), 'the squad first'); ok(!r.strip.chips.includes('SELECT SHOWN') && !r.strip.chips.includes('CLEAR'), 'chips ' + r.strip.chips); ok(r.strip.chips.includes('ALL') && r.strip.chips.includes('IN SQUAD') && r.strip.chips.includes('NOT IN SQUAD') && r.strip.chips.includes('CLONES'), 'chips ' + r.strip.chips); same(r.strip.selected, 0, 'nothing is selected by looking');
            if (w >= 1180) { ok(r.strip.names.every(Boolean), 'a name is cut: ' + r.strip.names); same(r.strip.scrolls, false, 'the strip scrolls'); }
        });
        check(w + ': the parts stand in order down the screen (header, squad, creature, filters, strip, bar), inside the window, with the settings beside the creature; nothing needs a scroll', () => {
            const R = r.rects; ok(R.head.b <= R.squad.t + 1, 'header over squad'); ok(R.squad.b <= R.focus.t + 1, 'squad over the creature'); ok(R.focus.b <= R.filters.t + 1, 'the creature over the filters'); ok(R.filters.b <= R.strip.t + 1, 'filters over the strip'); ok(R.strip.b <= R.swap.t + 1, 'the strip over the bar');
            for (const k of ['squad', 'focus', 'side', 'filters', 'strip', 'swap']) ok(R[k].l >= 0 && R[k].r <= r.scroll.vw && R[k].t >= 0 && R[k].b <= r.scroll.vh, k + ' is off the screen: ' + JSON.stringify(R[k]));
            if (w > 820) { ok(R.side.l >= R.focus.r - 2, 'the settings beside the creature'); ok(Math.abs(R.side.t - R.focus.t) <= 2, 'the settings\' top'); ok(R.focus.h >= 236, 'the creature has height ' + R.focus.h); }
            ok(r.scroll.x <= 1, 'sideways scroll ' + r.scroll.x); if (h >= 768 && w > 820) ok(r.scroll.y <= 1, 'the body scrolls ' + r.scroll.y + 'px');
        });
        check(w + ': ▸ puts the next of the strip in view (its slot and its card light up), ◂ goes back and goes round from the first to the last, the arrow keys do the same; the orders\' selection is not touched', () => {
            same(r.next.is2, true, 'the second'); same(r.next.slot, 1, 'its slot'); same(r.next.strip, 1, 'its card'); same(r.next.sel, 0, 'the selection'); ok(/SLOT 2✕ REMOVE FROM SQUAD/.test(r.next.bar), 'the bar ' + r.next.bar); same(r.back.first, true, 'back to the first'); same(r.wrap.last, true, 'round to the last'); same(r.wrap.stripLit, true, 'its card'); same(r.wrapFwd.first, true, 'round to the first'); same(r.keyRight.is2, true, 'the right arrow'); same(r.keyLeft.first, true, 'the left arrow');
        });
        check(w + ': a creature holding a room, tapped in the strip, is in view with its state; the bar says SWAP … IN FOR with the three of the squad (each "that one holds its room instead"); the settings are its; nothing is selected', () => {
            same(r.posted.is, true, 'in view'); ok(/^HOLDING · /.test(r.posted.state), 'state ' + r.posted.state); ok(r.posted.label.indexOf('SWAP ' + r.posted.name + ' IN FOR') === 0, 'the bar ' + r.posted.label); same(r.posted.picks.length, 3, 'three to swap for'); same(r.posted.picks.join(), r.squadRow.names.join(), 'the three of the squad'); ok(r.posted.subs.every(s => s === 'THAT ONE HOLDS ITS ROOM INSTEAD'), 'their notes ' + r.posted.subs);
            same(r.posted.dds.join(), 'ATTACK STYLE,PLAY STYLE,CARD 1,CARD 2', 'the settings (the equip cards\' two slots are there from the start: js/cardsui.js)'); ok(r.posted.btns.includes('RE-ROLL') && r.posted.btns.includes('INFO ▸'), 'the buttons ' + r.posted.btns); ok(!r.posted.btns.includes('CLEAR SELECTION'), 'CLEAR SELECTION'); same(r.posted.sel, 0, 'selected'); same(r.posted.strip, true, 'the lit card');
        });
        check(w + ': nothing covers a button: the middle of each arrow, slot, ✕ REMOVE, DISBAND, filter, strip card, RECRUIT tile, setting, RE-ROLL, INFO, bar button and header button is that button', () => {
            const H = r.hits, all = [H.prev, H.next, H.disband, ...H.slots, ...H.xs, ...H.chips, ...H.strip, ...H.dds, ...H.btns, ...H.picks, ...H.head]; ok(all.length >= 25, 'few buttons were measured: ' + all.length); same(all.filter(x => x !== true).length, 0, 'covered: ' + JSON.stringify(H)); ok(H.tile === null || H.tile === true, 'the RECRUIT tile is covered');
        });
        check(w + ': a swap puts it in the card of the one it replaces (who holds its room); the creature stays in view and the bar becomes ✕ REMOVE FROM SQUAD; REMOVE posts it and the bar offers ADD TO SQUAD with the free slot; ADD puts it back', () => {
            same(r.swapped.in, true, 'in the squad'); same(r.swapped.slotSame, true, 'the same card'); same(r.swapped.outPosted, true, 'the old one holds its room'); same(r.swapped.stays, true, 'still in view'); ok(/IS IN THE SQUAD · SLOT \d✕ REMOVE FROM SQUAD/.test(r.swapped.bar), 'the bar ' + r.swapped.bar); same(r.swapped.members, 3, 'the squad'); same(r.swapped.sel, 0, 'selected'); ok(r.swapped.names.every(n => n !== '-'), 'slots ' + r.swapped.names);
            same(r.removedBar.posted, true, 'holds a room'); same(r.removedBar.members, 2, 'the squad'); same(r.removedBar.stays, true, 'still in view'); ok(/^ADD .* TO THE SQUAD$/.test(r.removedBar.label), 'label ' + r.removedBar.label); same(r.removedBar.picks.join(), 'ADD TO SQUAD', 'the button'); same(r.removedBar.subs.join(), '1 SLOT FREE', 'its note'); same(r.removedBar.names.filter(n => n === '-').length, 1, 'an open slot'); same(r.removedBar.lit, -1, 'a slot is lit for a creature that is not in the squad');
            same(r.addedBar.in, true, 'added'); same(r.addedBar.members, 3, 'the squad'); same(r.addedBar.stays, true, 'in view'); ok(/IS IN THE SQUAD/.test(r.addedBar.label), 'label ' + r.addedBar.label); ok(r.addedBar.lit >= 0, 'its slot is lit');
        });
        check(w + ': ✕ REMOVE on a slot takes that member out (it holds its room, the slot opens, the summary follows) and leaves the one in view where it is; an open slot lists who could fill it (the first in view) and ADD TO SQUAD puts it in', () => {
            same(r.xRemove.posted, true, 'holds its room'); same(r.xRemove.members, 2, 'the squad'); same(r.xRemove.open, '-', 'the slot'); same(r.xRemove.stays, true, 'the one in view'); same(r.xRemove.sel, 0, 'selected'); ok(/^SQUAD 2\/3 · 4 POSTED/.test(r.xRemove.summary), 'summary ' + r.xRemove.summary);
            same(r.openSlot.filter, 'out', 'the filter'); same(r.openSlot.onlyOut, true, 'the list'); same(r.openSlot.n, r.openSlot.nOut, 'the cards'); same(r.openSlot.first, true, 'the first of them in view'); same(r.openSlot.inView, true, 'it is not in the squad'); ok(/^ADD .* TO THE SQUAD$/.test(r.openSlot.label), 'label ' + r.openSlot.label); same(r.openSlot.picks.join(), 'ADD TO SQUAD', 'the button'); same(r.openSlot.lit.join(), 'NOT IN SQUAD', 'the lit chip'); same(r.openSlot.sel, 0, 'selected');
            same(r.openAdded.in, true, 'added'); same(r.openAdded.stays, true, 'in view'); same(r.openAdded.members, 3, 'the squad'); same(r.openAdded.slot, -1, 'a slot is still open');
        });
        check(w + ': ATTACK STYLE and PLAY STYLE open as lists and change the one in view alone; the column lists its base stats (not the ones the card has); INFO opens its own card', () => {
            same(r.roleList.join(), 'BRAWLER,MAGE,TECHNICIAN', 'attack styles'); same(r.playList.join(), 'DEFENSIVE,BALANCED,AGGRESSIVE', 'play styles'); same(r.styles.role, 'sniper', 'MAGE'); same(r.styles.play, 'aggressive', 'AGGRESSIVE'); same(r.styles.others, true, 'the others were changed'); same(r.styles.closed, 0, 'the lists fold shut'); same(r.styles.value.join(), 'MAGE,AGGRESSIVE,NO CARDS IN YOUR HAND,NO CARDS IN YOUR HAND', 'the values');
            ok(r.stats.secs.some(s => /^BASE STATS/.test(s)), 'sections ' + r.stats.secs); ok(r.stats.rows.includes('HP') && !r.stats.rows.includes('DEFENSE') && !r.stats.rows.includes('ATTACK'), 'rows ' + r.stats.rows); ok(!r.stats.secs.includes('VITALS'), 'VITALS twice');
            same(r.info.open, true, 'INFO'); same(r.info.title, r.info.is, 'its card');
        });
        check(w + ': RE-ROLL asks twice (TAP AGAIN, and says what it does); the made-again follower leaves the roster and the next comes into view', () => {
            same(r.reroll1.label, 'TAP AGAIN', 'the first tap'); ok(r.reroll1.note.some(n => /MADE AGAIN/.test(n)), 'note ' + r.reroll1.note); same(r.reroll1.stays, true, 'in view'); same(r.reroll1.still, true, 'still here'); same(r.reroll2.gone, true, 'it is gone'); same(r.reroll2.returning, true, 'on its way to the Crystal'); same(r.reroll2.next, true, 'the next one'); same(r.reroll2.alive, true, 'a creature in view');
        });
        check(w + ': the RECRUIT tile recruits for its cost and puts the new follower in view; short of crystals it dims, says how many more, does nothing; the filters say who is in the squad and who is not', () => {
            same(r.recruit.cost, 30, 'the price'); same(r.recruit.n, 1, 'new followers'); same(r.recruit.fresh, true, 'the new one is in view'); same(r.recruit.last, true, 'the tile is still last'); ok(/AFFORDABLE/.test(r.recruit.tile), 'tile ' + r.recruit.tile); ok(/^◆ \d+$/.test(r.recruit.crystals), 'crystals ' + r.recruit.crystals);
            same(r.short.dim, true, 'dim'); ok(/NEED 20 MORE/.test(r.short.text), 'text ' + r.short.text); same(r.short.n, true, 'it recruited with too few'); same(r.short.stays, true, 'the view moved'); same(r.short.cap, 'YOUR SHARDS', 'the caption');
            ok(!r.filters.chips.includes('SELECT SHOWN'), 'chips ' + r.filters.chips); same(r.narrow.n, r.narrow.members, 'IN SQUAD shows the squad'); same(r.narrow.litNone, true, 'a creature the filter hides is not lit'); same(r.narrow.view, true, 'but it stays in view'); same(r.narrowStep.first, true, 'the arrows walk what is shown'); same(r.narrowStep.member, true, 'a member');
        });
        check(w + ': the roster opens on the creature picked on the squad bar, walking it does not change the pick, closing it leaves the pick as it was, and puts the roster away; DISBAND empties the slots (all hold their rooms) and turns itself off; the SQUADS window still opens', () => {
            same(r.reopen.onPick, true, 'opens on the pick'); same(r.reopen.sel, 1, 'the pick'); same(r.reopen.has, true, 'the same one'); same(r.reopen.lit, true, 'its slot is lit'); same(r.browsed.moved, true, 'walked'); same(r.browsed.sel, 1, 'the pick after walking'); same(r.browsed.has, true, 'the same pick');
            same(r.disband.members, 0, 'the squad'); same(r.disband.names.join(), '-,-,-', 'the slots'); same(r.disband.off, true, 'DISBAND is on'); ok(/^ADD .* TO THE SQUAD$/.test(r.disband.label), 'label ' + r.disband.label); same(r.disband.subs.join(), '3 SLOTS FREE', 'its note'); ok(/^SQUAD 0\/3/.test(r.disband.summary), 'summary ' + r.disband.summary); same(r.disband.nums, 0, 'numbers on open slots');
            same(r.squads.shown, 'flex', 'the SQUADS window'); same(r.squads.title, 'YOUR SQUAD', 'its title'); same(r.squads.cards, 3, 'its cards'); same(r.squads.disband, true, 'DISBAND SQUAD');
            same(r.closed.open, false, 'closed'); same(r.closed.sel, 1, 'the pick after closing'); same(r.closed.has, true, 'the same one'); same(r.closed.focus, true, 'the view is put away');
        });
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
