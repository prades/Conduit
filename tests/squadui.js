// THE SQUAD IN THE COMMAND CENTER, AND NO MORE WORKING (js/party.js, js/commandcenter.js, js/radialmenu.js; the facility is the game: there is no work crew, no duty and no roster squad anywhere in it, and no code for them).
// ASKED: "For the squads, let's make it to where in the roster command center area, you click a creature and it has like a little box at the top that shows the squad. And when you click the creature on the roster, it should show on the side
// add to party or add to squad. Then when you go at the top to squads, it should already show all three creatures in your squad. So you should be able to see your whole squad up top without having to click to another menu. But if you do click
// on that squad button at the top [...] this should also show all three of the creatures, followers, a little roster card of each of them. And here you can disband them. And we're also going to remove working. There is no more working."
// The logic runs in the sandbox, the roster, the SQUADS window and the phone's menu in the real browser (no Chromium: it says so and passes).
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

// The real page, in the facility: the roster with the squad box, ADD TO / REMOVE FROM / SWAP in the side panel, the SQUADS window (three cards, REMOVE, DISBAND), the phone's menu, and nobody working.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var st = document.createElement('style'); st.textContent = '#mixTool, #mixTool *, #squadBar, #squadBar *, #ccRoot, #ccRoot * { transition: none !important; animation: none !important }'; document.head.appendChild(st);
  var click = function(el){ el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  var texts = function(sel){ return $$(sel).map(function(e){ return e.textContent; }); };
  var btn = function(root, label){ return $$(root + ' .cc-btn').find(function(b){ var l = b.querySelector('.cc-bl'); return l && l.textContent.indexOf(label) === 0; }) || null; };
  var names = function(box){ return $$(box + ' .sb-slot').map(function(e){ return e.classList.contains('empty') ? '-' : e.querySelector('.sb-name').textContent; }); };
  var sideBtns = function(){ return texts('#ccSide .sqrow .cc-btn .cc-bl'); };   // (the squad's buttons: not RE-ROLL, not CLEAR SELECTION)
  var squad = function(){ return partyOrdered().map(function(f){ return f.partySlot + ':' + unitTypeLabel(f); }).join(); };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; shardCount = 900; for (var i = 0; i < 3; i++) recruitFollower(); partyTick(); await wait(60);
    out.start = { members: partyMembers().length, posted: partyPosted().length, squad: squad() };
    ccOpen('roster'); await wait(300);
    var cards = function(){ return $$('#ccGrid .cc-card'); };
    out.box = { shown: getComputedStyle($('#ccSquadBoxWrap')).display, count: $('#ccSquadCount').textContent, names: names('#ccSquadBox'), bar: names('#squadBar'), summary: $('#ccSummary').textContent, filters: texts('#ccFilters .cc-btn .cc-bl'),
      squadTags: $$('#ccGrid .cc-tag.squad').length, workTags: $$('#ccGrid .cc-tag.work').length, sqTags: $$('#ccGrid .cc-tag.sq').length, aboveFilters: $('#ccSquadBoxWrap').getBoundingClientRect().bottom <= $('#ccFilters').getBoundingClientRect().top + 1 };
    // a tap on a card in the box selects that follower: the side panel offers REMOVE FROM SQUAD, and no STANCE or DUTY
    click($$('#ccSquadBox .sb-slot')[1]); await wait(60);
    out.member = { sel: selectedUnits.size, title: $('#ccSide .cc-sel-title').textContent, sub: $('#ccSide .cc-sel-sub').textContent, btns: sideBtns(), dds: texts('#ccSide .cc-dd .cc-dd-k'), secs: texts('#ccSide .cc-sec'), boxSel: $$('#ccSquadBox .sb-slot.sel').length };
    var gone = partyOrdered()[1], goneSlot = gone.partySlot; click(btn('#ccSide', 'REMOVE FROM SQUAD')); await wait(80);
    out.removed = { members: partyMembers().length, posted: partyPosted().length, goneHolds: !!gone.post, box: names('#ccSquadBox'), bar: names('#squadBar'), summary: $('#ccSummary').textContent, count: $('#ccSquadCount').textContent, sel: selectedUnits.size, title: $('#ccSide .cc-sel-title').textContent, sub: $('#ccSide .cc-sel-sub').textContent, side: sideBtns(), tagOnGone: !!(gone.post && cards().find(function(c){ return c._unit === gone; }).querySelector('.cc-tag.squad')) };
    // THE REPORTED CASE ("it ends up adding the same follower that was previously on the squad back"): tap a DIFFERENT follower, ADD TO SQUAD: it is THAT one that joins, in the card that was free; the one just removed keeps holding its room
    var other = partyPosted().filter(function(f){ return f !== gone; })[0]; click(cards().find(function(c){ return c._unit === other; })); await wait(60);
    out.other = { sel: selectedUnits.size, isOther: selectedUnits.has(other), hasGone: selectedUnits.has(gone), title: $('#ccSide .cc-sel-title').textContent, btns: sideBtns(), sub: texts('#ccSide .sqrow .cc-btn .cc-bs'), dds: texts('#ccSide .cc-dd .cc-dd-k') };
    click(btn('#ccSide', 'ADD TO SQUAD')); await wait(80);
    out.added = { members: partyMembers().length, otherIn: partyIsMember(other), goneIn: partyIsMember(gone), goneHolds: !!gone.post, slot: other.partySlot, goneSlot: goneSlot, box: names('#ccSquadBox'), sel: selectedUnits.size, side: sideBtns(), title: $('#ccSide .cc-sel-title').textContent };
    // the squad full, a follower holding a room selected: SWAP WITH each of the three; it takes the card of the one it replaces
    var whoseSlot = partyOrdered()[2], slotNo = whoseSlot.partySlot;
    selectedUnits.clear(); selectedUnits.add(gone); ccRender(); await wait(60);
    out.swapBtns = sideBtns(); click($$('#ccSide .sqrow .cc-btn')[2]); await wait(80);
    out.swapped = { goneIn: partyIsMember(gone), goneSlot: gone.partySlot, slotNo: slotNo, outPosted: !!whoseSlot.post, members: partyMembers().length, box: names('#ccSquadBox'), sel: selectedUnits.size };
    // one member and one follower holding a room selected, the squad full: ONE button, SWAP IN, that names both
    var m = partyOrdered()[0], p = partyPosted()[0], mSlot = m.partySlot; selectedUnits.clear(); selectedUnits.add(m); selectedUnits.add(p); ccRender(); await wait(60);
    out.pair = { btns: sideBtns(), sub: texts('#ccSide .sqrow .cc-btn .cc-bs'), title: $('#ccSide .cc-sel-title').textContent, mLabel: unitTypeLabel(m), pLabel: unitTypeLabel(p) };
    click($$('#ccSide .sqrow .cc-btn')[0]); await wait(80);
    out.pairDone = { pIn: partyIsMember(p), mOut: !!m.post, slot: p.partySlot === mSlot, members: partyMembers().length, sel: selectedUnits.size };
    // a slot free, one member and one follower holding a room selected: ADD <name> TO SQUAD and REMOVE <name> FROM SQUAD, each for exactly that one (and the other stays selected)
    var q = partyOrdered()[1]; partyRemove([q]); var m2 = partyOrdered()[0], p2 = partyPosted().filter(function(f){ return f !== q; })[0]; selectedUnits.clear(); selectedUnits.add(m2); selectedUnits.add(p2); ccRender(); await wait(60);
    out.named = { btns: sideBtns(), m2: unitTypeLabel(m2), p2: unitTypeLabel(p2) };
    click($$('#ccSide .sqrow .cc-btn')[0]); await wait(80);
    out.namedAdd = { p2In: partyIsMember(p2), m2In: partyIsMember(m2), members: partyMembers().length, selM2: selectedUnits.has(m2), selP2: selectedUnits.has(p2) };
    // two followers holding rooms selected, one slot free: one ADD for each of them; the second one's button adds the SECOND (not the first selected)
    var r1 = partyOrdered()[0]; partyRemove([r1]); var ps = partyPosted().filter(function(f){ return f !== r1; }).slice(0, 2); selectedUnits.clear(); ps.forEach(function(f){ selectedUnits.add(f); }); ccRender(); await wait(60);
    out.pickBtns = { btns: sideBtns(), sub: texts('#ccSide .sqrow .cc-btn .cc-bs'), names: ps.map(unitTypeLabel) };
    click($$('#ccSide .sqrow .cc-btn')[1]); await wait(80);
    out.picked = { secondIn: partyIsMember(ps[1]), firstIn: partyIsMember(ps[0]), members: partyMembers().length, selFirst: selectedUnits.has(ps[0]), selSecond: selectedUnits.has(ps[1]) };
    // the squad full and two followers holding rooms selected: ADD is off, and says to select one
    selectedUnits.clear(); partyPosted().slice(0, 2).forEach(function(f){ selectedUnits.add(f); }); ccRender(); await wait(60);
    var fullBtn = btn('#ccSide', 'ADD TO SQUAD'); out.fullBtn = { present: !!fullBtn, disabled: !!(fullBtn && fullBtn.disabled), sub: fullBtn ? fullBtn.querySelector('.cc-bs').textContent : null };
    // an OPEN SLOT lists who could fill it: the roster filtered to NOT IN SQUAD, with nothing selected (the next tap picks exactly one); IN SQUAD and ALL put it back
    partyRemove([partyOrdered()[2]]); selectedUnits.clear(); selectedUnits.add(partyOrdered()[0]); ccRender(); await wait(60);
    var openBox = $$('#ccSquadBox .sb-slot').find(function(e){ return e.classList.contains('empty'); }); click(openBox); await wait(100);
    out.openSlot = { filter: ccFilter.squad, sel: selectedUnits.size, cards: cards().length, allOut: cards().every(function(c){ return !partyIsMember(c._unit); }), nOut: followers.filter(function(f){ return !partyIsMember(f); }).length, on: texts('#ccFilters .cc-btn.on .cc-bl'), chips: texts('#ccFilters .cc-btn .cc-bl'), tab: ccOpenTab };
    click($$('#ccFilters .cc-btn').find(function(b){ return b.textContent === 'IN SQUAD'; })); await wait(60);
    out.inSquadFilter = { filter: ccFilter.squad, cards: cards().length, allIn: cards().every(function(c){ return partyIsMember(c._unit); }), members: partyMembers().length };
    click($$('#ccFilters .cc-btn').find(function(b){ return b.textContent === 'ALL'; })); await wait(60);
    out.allFilter = { filter: ccFilter.squad, cards: cards().length, units: followers.filter(function(f){ return !f.dead; }).length, on: texts('#ccFilters .cc-btn.on .cc-bl') };
    // the bar over the dock: its open slot opens the roster with the same list; closing the roster puts the list away
    ccClose(); await wait(40); click($$('#squadBar .sb-slot').find(function(e){ return e.classList.contains('empty'); })); await wait(150);
    out.barSlot = { tab: ccOpenTab, filter: ccFilter.squad, sel: selectedUnits.size, cards: cards().length, allOut: cards().every(function(c){ return !partyIsMember(c._unit); }) };
    ccClose(); await wait(40); out.closed = { filter: ccFilter.squad };
    partyAdd(partyPosted().slice(0, PARTY.max - partyMembers().length)); ccOpen('roster'); await wait(120); out.refilled = { members: partyMembers().length, filter: ccFilter.squad, cards: cards().length };
    // THE SQUADS WINDOW: the three cards (REMOVE on each), DISBAND SQUAD; no roster squads, no work
    selectedUnits.clear(); ccSquadsOpen = true; ccRender(); await wait(80);
    var win = function(){ return { shown: getComputedStyle($('#ccSquadWin')).display, title: $('#ccSquadTitle').textContent, cards: $$('#ccSquadBody .cc-yoursquad .cc-card:not(.cc-open)').length, open: $$('#ccSquadBody .cc-yoursquad .cc-card.cc-open').length, remove: $$('#ccSquadBody .cc-yoursquad .cc-btn').length,
      names: texts('#ccSquadBody .cc-yoursquad .cc-name'), hasDisband: !!btn('#ccSquadBody', 'DISBAND SQUAD'), disbandOff: !!(btn('#ccSquadBody', 'DISBAND SQUAD') || { disabled: false }).disabled, btns: texts('#ccSquadBody .cc-btn .cc-bl'), btnBox: $('#ccSquadBody').textContent,
      squadsBtn: !!$('#ccSquadsBtn') && getComputedStyle($('#ccSquadsBtn')).display !== 'none', btnText: $('#ccSquadsBtn').textContent, headFirst: texts('#ccRoot .cc-head button').slice(-2).join('|') }; };
    out.win = win(); out.winSquad = squad();
    click($$('#ccSquadBody .cc-yoursquad .cc-btn')[0]); await wait(80); out.winRemoved = { win: win(), members: partyMembers().length };
    click(btn('#ccSquadBody', 'DISBAND SQUAD')); await wait(80); out.disbanded = { win: win(), members: partyMembers().length, posted: partyPosted().length, allHold: partyPosted().every(function(f){ return !!f.post && f.stance === 'hold'; }), box: names('#ccSquadBox'), bar: names('#squadBar'), summary: $('#ccSummary').textContent };
    // an open slot of the window is the same as everywhere: it closes the window and lists who could fill it
    click($$('#ccSquadBody .cc-yoursquad .cc-card.cc-open')[0]); await wait(120); out.winOpenSlot = { open: ccSquadsOpen, filter: ccFilter.squad, shown: getComputedStyle($('#ccSquadWin')).display, cards: cards().length, nOut: followers.filter(function(f){ return !partyIsMember(f); }).length, sel: selectedUnits.size };
    ccSquadsOpen = false; ccRender(); await wait(30);
    // nobody works: no duty on anyone, the INFO card says the squad or the room, no row or summary has a work field, and the code for work, duty and roster squads is gone
    var f0 = followers[0]; out.work = { duties: followers.filter(function(f){ return f.duty === 'worker'; }).length, info: JSON.stringify(unitInfo(f0).jobs), row: Object.keys(ccRow(f0)).join(), sum: Object.keys(ccSelectionSummary()).join(),
      gone: ['canWorkMass', 'setFollowerDuty', 'toggleFollowerDuty', 'radialSetAllWork', 'ccApplyDuty', 'cloneJob', 'squadOf', 'squadsLive', 'squadMake'].map(function(n){ return typeof window[n]; }).join() };
    // THE PHONE'S MENU (the radial menu's DOM at any width): the squad strip and ADD TO / REMOVE FROM on the roster cards, YOUR SQUAD with DISBAND, no work in the orders
    ccClose(); partyAdd(partyPosted().slice(0, 3)); await wait(30);
    var panel = function(id){ radialOpen = true; radialPanel = id; radialRender(); var p = $('#radialPanel'); return { text: p.textContent, disband: !!$$('#radialPanel .rp-btn').find(function(b){ return b.textContent === 'DISBAND SQUAD'; }), btns: $$('#radialPanel .rp-btn').map(function(b){ return b.textContent; }), cards: $$('#radialPanel .rp-card:not(.rp-open)').length, open: $$('#radialPanel .rp-open').length, chips: $$('#radialPanel .rp-chips .rp-btn, #radialPanel .rp-chips .rp-chip').map(function(b){ return b.textContent; }) }; };
    out.radialRoster = panel('roster'); out.radialSquad = panel('squad'); out.radialOrders = panel('orders');
    panel('squad'); click($$('#radialPanel .rp-btn').find(function(b){ return b.textContent === 'DISBAND SQUAD'; })); await wait(30); out.radialDisbanded = { members: partyMembers().length };
    radialOpen = false; radialPanel = null; radialRender();
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__sq'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sq-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=20000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 100000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__sq">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860;');   // (the page boots the facility: the start returns early; only the tutorial's blackout is lifted)
    // fixtures: a clean squad of the given size in the Crystal Chamber, a floor cell in a named room
    run(`globalThis.__cell = (room, k) => { const cs = partyRoomCells(room); return cs[Math.floor(cs.length * (k === undefined ? 0.5 : k))]; };
        globalThis.__fresh = (n) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); squadMode = 'all'; floatingTexts.length = 0; const c = __cell('crystal_chamber'); player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1];
            for (let i = 0; i < n; i++) { spawnFollowerAtCrystal(['electric', 'core', 'fire', 'ice', 'toxic', 'flux'][i % 6]); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.health = f.maxHealth = 1e7; f.x = player.x + 0.5 + i * 0.2; f.y = player.y + 0.5; }
            partyTick(); return followers.slice(); };`);

    group('THE SQUAD\'S BUTTONS (js/party.js)');
    check('REMOVE posts a squad member in the room it is in (the squad shrinks, the card slot is free); it ignores a follower that is not in the squad; ADD puts a follower holding a room back in the lowest free card slot, as far as the squad has room', () => {
        const r = J(`(function(){ const fs = __fresh(4), o = {}; const posted = fs.find(f => f.post), mem = fs.filter(f => !f.post); o.start = [partyMembers().length, partyPosted().length];
            const h = __cell('lab_hallway'); mem[1].x = h[0]; mem[1].y = h[1]; const slot1 = mem[1].partySlot; floatingTexts.length = 0;
            o.rm = [partyRemove([mem[1]]), mem[1].post, mem[1].stance, partyMembers().length, mem[1].partySlot, partyRemove([posted]), floatingTexts.map(t => t.text).join('|')];
            o.free = partyOrdered().map(f => f.partySlot).join(); floatingTexts.length = 0; o.add = [partyAdd([mem[1]]), partyIsMember(mem[1]), mem[1].partySlot === slot1, partyMembers().length, floatingTexts.map(t => t.text).join('|')];
            floatingTexts.length = 0; o.full = [partyAdd([posted]), !!posted.post, partyMembers().length, floatingTexts.map(t => t.text).join('|')];
            partyRemove([mem[0], mem[1]]); const p2 = fs.filter(f => f.post); floatingTexts.length = 0; o.two = [partyAdd(p2.slice(0, 3)), partyMembers().length, p2.filter(f => !!f.post).length, p2.length]; o.slots = partyOrdered().map(f => f.partySlot).join(); return o; })()`);
        same(r.start.join(), '3,1', 'the start'); same(r.rm[0], 1, 'removed'); same(r.rm[1], 'lab_hallway', 'it holds the room it is in'); same(r.rm[2], 'hold', 'stance'); same(r.rm[3], 2, 'the squad'); same(r.rm[4], null, 'its card slot'); same(r.rm[5], 0, 'a follower that was not in the squad'); ok(/REMOVED FROM THE SQUAD/.test(r.rm[6]) && /MAIN HALLWAY/.test(r.rm[6]), 'said ' + r.rm[6]);
        same(r.add[0], 1, 'added'); same(r.add[1], true, 'in the squad'); same(r.add[2], true, 'the same card slot'); same(r.add[3], 3, 'the squad'); ok(/ADDED TO THE SQUAD · 3 OF 3/.test(r.add[4]), 'said ' + r.add[4]);
        same(r.full[0], 0, 'added to a full squad'); same(r.full[1], true, 'it stayed posted'); same(r.full[2], 3, 'the squad'); ok(/SQUAD FULL/.test(r.full[3]), 'said ' + r.full[3]);
        same(r.two[0], 2, 'two slots, three offered: two come'); same(r.two[1], 3, 'the squad'); same(r.two[2], 1, 'the one that did not fit keeps holding'); same(r.two[3], 3, 'the ones holding rooms'); same(r.slots, '0,1,2', 'the slots');
    });
    check('SWAP puts a follower that holds a room in the card of a squad member, who holds the room it is in; it refuses what is not a swap; DISBAND posts the whole squad, each in its own room, once', () => {
        const r = J(`(function(){ const fs = __fresh(4), o = {}; const posted = fs.find(f => f.post), mem = fs.filter(f => !f.post); const h = __cell('lab_hallway'); mem[2].x = h[0]; mem[2].y = h[1]; const slot = mem[2].partySlot; floatingTexts.length = 0;
            o.swap = [partySwap(mem[2], posted), partyIsMember(posted), posted.partySlot === slot, mem[2].post, partyMembers().length, floatingTexts.map(t => t.text).join('|')];
            o.bad = [partySwap(mem[2], posted), partySwap(mem[0], mem[1]), partySwap(mem[0], null), partyMembers().length];
            const rooms = partyMembers().map(f => partyRoomOf(f)); floatingTexts.length = 0; const n = partyDisband(); o.disband = [n, partyMembers().length, partyPosted().length, partyPosted().every(f => f.stance === 'hold' && !!f.post), floatingTexts.map(t => t.text).join('|'), partyDisband()];
            const g = __fresh(2); const h2 = __cell('lab_hallway'), c2 = __cell('crystal_chamber'); g[0].x = h2[0]; g[0].y = h2[1]; g[1].x = c2[0]; g[1].y = c2[1]; partyDisband(); o.rooms = g.map(f => f.post).join(); return o; })()`);
        same(r.swap[0], true, 'swapped'); same(r.swap[1], true, 'the new one is in the squad'); same(r.swap[2], true, 'in the same card'); same(r.swap[3], 'lab_hallway', 'the old one holds its room'); same(r.swap[4], 3, 'the squad is still three'); ok(/SWAPPED IN/.test(r.swap[5]), 'said ' + r.swap[5]);
        same(r.bad.join(), 'false,false,false,3', 'swaps that are not swaps'); same(r.disband[0], 3, 'disbanded'); same(r.disband[1], 0, 'the squad'); same(r.disband[2], 4, 'holding rooms'); same(r.disband[3], true, 'all posted'); ok(/SQUAD DISBANDED · 3/.test(r.disband[4]), 'said ' + r.disband[4]); same(r.disband[5], 0, 'a second DISBAND'); same(r.rooms, 'lab_hallway,crystal_chamber', 'each holds its own room');
    });

    check('THE REPORTED BUG: the followers a squad button has dealt with leave the selection, so after REMOVE the next follower tapped is the only one selected and ADD takes exactly that one (it used to take the FIRST selected: the one just removed, back again); the same for SWAP and DISBAND', () => {
        const r = J(`(function(){ const fs = __fresh(5), o = {}; const mem = fs.filter(f => !f.post), post = fs.filter(f => !!f.post); const A = mem[0], B = post[0], C = post[1];
            selectedUnits.add(A); partyRemove([A]); o.afterRemove = [selectedUnits.size, A.post]; selectedUnits.add(B); const sel = ccSelectionList(); o.bug = [sel.length, sel[0] === B, partyAdd(sel), partyIsMember(B), partyIsMember(A), !!A.post, selectedUnits.size];
            selectedUnits.add(C); selectedUnits.add(mem[1]); partySwap(mem[1], C); o.swap = [partyIsMember(C), !!mem[1].post, selectedUnits.size];
            selectedUnits.add(mem[2]); selectedUnits.add(B); partyDisband(); o.disband = [partyMembers().length, selectedUnits.size, selectedUnits.has(B)];
            selectedUnits.add(A); selectedUnits.add(B); partyAdd([A]); o.add = [partyIsMember(A), selectedUnits.has(A), selectedUnits.has(B)]; selectedUnits.clear(); return o; })()`);
        same(r.afterRemove.join(), '0,' + r.afterRemove[1], 'the follower just removed is still selected'); ok(r.afterRemove[1], 'it holds no room');
        same(r.bug.join(), '1,true,1,true,false,true,0', 'the selection is one follower, ADD adds it (not the one removed), nothing stays selected'); same(r.swap.join(), 'true,true,0', 'SWAP'); same(r.disband.join(), '0,0,false', 'DISBAND'); same(r.add.join(), 'true,false,true', 'ADD takes only the ones it added out of the selection');
    });

    group('NO MORE WORKING (the facility is the game: no work crew, no duty, no roster squads)');
    check('nobody works: there is no work crew, no duty and no roster squad anywhere in the game (the code is gone), a follower has no duty, no row, summary or filter has a work field, and the INFO card has no DUTY and no WORK: it says it is in the squad, or which room it holds', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; const f = fs[0]; o.gone = ['canWorkMass', 'setFollowerDuty', 'toggleFollowerDuty', 'radialSetAllWork', 'ccApplyDuty', 'cloneJob', 'cloneDutyLabel', 'canCloneWork', 'squadOf', 'squadsLive', 'squadMake', 'squadAssign'].map(n => typeof globalThis[n]).join();
            o.duty = [f.duty || null, fs.filter(x => x.duty === 'worker').length]; o.info = JSON.stringify(unitInfo(f).jobs); ccApplyStance([fs[1]], 'hold'); o.held = JSON.stringify(unitInfo(fs[1]).jobs);
            o.fields = Object.keys(ccRow(f)).join() + '|' + Object.keys(ccSelectionSummary([f])).join() + '|' + Object.keys(ccFilter).join(); return o; })()`);
        same(r.gone, Array(12).fill('undefined').join(), 'work or roster-squad code is still there'); same(r.duty.join(), ',0', 'a duty'); ok(!/DUTY|WORKING|FIGHTING|WORK/.test(r.info), 'the INFO card talks of work: ' + r.info); ok(/STANCE/.test(r.info) && /IN THE SQUAD/.test(r.info), 'the INFO card does not say it is in the squad: ' + r.info);
        ok(/HOLDING THE CRYSTAL CHAMBER/.test(r.held) && !/WORK/.test(r.held), 'the INFO card does not say which room it holds: ' + r.held); ok(!/duty|canWork|work|squadId/i.test(r.fields), 'a row, a summary or a filter still has a work or roster-squad field: ' + r.fields);
    });
    check('the roster does not offer work or roster squads: no WORKING / FIGHTING filter, no WORK tag, no DUTY drop-down, no ALL TO WORK / ALL TO FIGHT, no MAKE SQUAD, and the phone\'s menu has none of them either; both keep SWITCH ROLES; the work and roster-squad files are gone', () => {
        const c = rd('js/commandcenter.js'), m = rd('js/radialmenu.js'), code = s => s.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
        ok(!/WORKING|FIGHTING|"duty"|ALL TO WORK|ALL TO FIGHT|MAKE SQUAD|squadId|canWorkMass|_ccParty/.test(code(c)), 'the Command Center still offers work or roster squads'); ok(!/ALL TO WORK|ALL TO FIGHT|MAKE SQUAD|canWorkMass|duty|_rParty/.test(code(m)), 'the phone\'s menu still offers work or roster squads');
        ok(/SWITCH ROLES/.test(c) && /SWITCH ROLES/.test(m), 'SWITCH ROLES is gone'); ok(!fs.existsSync(path.join(ROOT, 'js/mass.js')) && !fs.existsSync(path.join(ROOT, 'js/squads.js')), 'the work or the roster-squad file is back');
    });

    group('THE ROSTER, THE SQUADS WINDOW AND THE PHONE\'S MENU (real browser)');
    for (const [w, h] of [[500, 800]]) {   // (the roster of a tablet or a desktop is the carousel: tests/carousel.js; this is the phone's, with the squad box, the side panel and the phone's menu)
        const r = measure(w, h);
        if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
        check(w + 'x' + h + ': the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); });
        if (!r || r.err) continue;
        const phone = w <= 700;
        check(w + ': the roster has the squad at the top (three cards, "YOUR SQUAD · 3 / 3", above the filters, the same as the bar over the dock); its summary and filters say nothing of working; the squad\'s cards carry SQUAD, no roster-squad letter, no WORK', () => {
            same(r.start.members, 3, 'the squad'); same(r.start.posted, 3, 'followers holding rooms'); same(r.box.shown !== 'none', true, 'the box is not shown'); same(r.box.count, 'YOUR SQUAD · 3 / 3', 'the count'); same(r.box.names.join(), r.box.bar.join(), 'the box and the bar show different squads'); ok(r.box.names.every(n => n !== '-' && n.length > 4), 'names ' + r.box.names);
            same(r.box.aboveFilters, true, 'the box is not over the filters'); ok(/^SQUAD 3\/3 · 3 POSTED · 6 UNITS$/.test(r.box.summary), 'summary ' + r.box.summary); ok(!/WORK/i.test(r.box.summary), 'the summary says WORKING'); ok(!r.box.filters.some(f => /WORK|FIGHT/.test(f)), 'filters ' + r.box.filters); ok(r.box.filters.includes('ALL') && r.box.filters.includes('CLONES'), 'the filters are gone ' + r.box.filters);
            same(r.box.squadTags, 3, 'SQUAD tags'); same(r.box.workTags, 0, 'WORK tags'); same(r.box.sqTags, 0, 'roster-squad tags');
        });
        check(w + ': a tap on a card in the box selects that follower; the side panel says SQUAD · 3 OF 3 and offers REMOVE FROM SQUAD (no STANCE, no DUTY); REMOVE posts it: its card slot opens in the box and on the bar, the summary and the card follow, and the follower LEAVES THE SELECTION (nothing is selected after it)', () => {
            same(r.member.sel, 1, 'selected'); same(r.member.boxSel, 1, 'the card is not lit'); ok(/IN THE SQUAD/.test(r.member.sub), 'sub ' + r.member.sub); same(r.member.btns.join(), 'REMOVE FROM SQUAD', 'the squad buttons'); same(r.member.dds.join(), 'ATTACK STYLE,PLAY STYLE', 'the settings (no STANCE, no DUTY)'); ok(r.member.secs.includes('SQUAD · 3 OF 3'), 'secs ' + r.member.secs);
            same(r.removed.members, 2, 'the squad'); same(r.removed.goneHolds, true, 'it holds a room'); same(r.removed.box.filter(n => n === '-').length, 1, 'an open slot in the box'); same(r.removed.box.join(), r.removed.bar.join(), 'the bar and the box'); ok(/^SQUAD 2\/3 · 4 POSTED/.test(r.removed.summary), 'summary ' + r.removed.summary); same(r.removed.count, 'YOUR SQUAD · 2 / 3', 'the count'); same(r.removed.tagOnGone, false, 'the SQUAD tag stayed');
            same(r.removed.sel, 0, 'the follower just removed is still selected'); same(r.removed.title, 'NOTHING SELECTED', 'the panel did not move on'); ok(/PUT IT IN THE SQUAD, TAKE IT OUT, OR SWAP IT/.test(r.removed.sub), 'the empty panel says nothing of the squad: ' + r.removed.sub); same(r.removed.side.length, 0, 'the squad buttons after REMOVE: ' + r.removed.side);
        });
        check(w + ': THE REPORTED CASE: after REMOVE, a tap on a DIFFERENT follower selects only that one and ADD TO SQUAD puts THAT one in the squad, in the card that was free; the one just removed keeps holding its room (it did not come back); the selection is empty again', () => {
            same(r.other.sel, 1, 'selected after the tap (the removed follower was still in the selection)'); same(r.other.isOther, true, 'the tapped follower'); same(r.other.hasGone, false, 'the removed follower is selected'); same(r.other.btns.join(), 'ADD TO SQUAD', 'the button'); same(r.other.sub[0], '1 SLOT FREE', 'the note'); same(r.other.dds.join(), 'ATTACK STYLE,PLAY STYLE', 'settings');
            same(r.added.otherIn, true, 'the follower that was tapped is not in the squad'); same(r.added.goneIn, false, 'the one just removed came back'); same(r.added.goneHolds, true, 'it holds its room'); same(r.added.slot, r.added.goneSlot, 'the card that was free'); same(r.added.members, 3, 'the squad'); same(r.added.sel, 0, 'the selection after ADD'); same(r.added.title, 'NOTHING SELECTED', 'the panel after ADD'); same(r.added.side.length, 0, 'buttons after ADD');
        });
        check(w + ': with the squad full a follower holding a room offers SWAP WITH each of the three (it takes the card of the one it replaces, who holds its room); a member and a follower holding a room selected together offer one SWAP IN that names both', () => {
            same(r.swapBtns.length, 3, 'the swap buttons'); ok(r.swapBtns.every(b => /^SWAP WITH /.test(b)), 'swap ' + r.swapBtns); same(r.swapped.goneIn, true, 'the follower is in the squad'); same(r.swapped.goneSlot, r.swapped.slotNo, 'the card it took'); same(r.swapped.outPosted, true, 'the one it replaced holds its room'); same(r.swapped.members, 3, 'the squad'); same(r.swapped.sel, 0, 'the selection after SWAP');
            same(r.pair.btns.length, 1, 'one button'); same(r.pair.btns[0], 'SWAP IN ' + r.pair.pLabel, 'its words'); ok(r.pair.sub[0].indexOf('FOR ' + r.pair.mLabel) === 0, 'its note ' + r.pair.sub[0]); same(r.pair.title, 'SELECTED 2', 'the title'); same(r.pairDone.pIn, true, 'SWAP IN put it in'); same(r.pairDone.mOut, true, 'the other holds its room'); same(r.pairDone.slot, true, 'the same card'); same(r.pairDone.members, 3, 'the squad'); same(r.pairDone.sel, 0, 'the selection');
        });
        check(w + ': with several selected each button names the follower it is for and acts on exactly that one (ADD <name> TO SQUAD, REMOVE <name> FROM SQUAD); with more followers holding rooms selected than the squad has room for there is one ADD for each of them, and the one pressed is the one added; with none free ADD is off', () => {
            same(r.named.btns.join('|'), 'ADD ' + r.named.p2 + ' TO SQUAD|REMOVE ' + r.named.m2 + ' FROM SQUAD', 'the named buttons'); same(r.namedAdd.p2In, true, 'the named follower joined'); same(r.namedAdd.m2In, true, 'the other one left'); same(r.namedAdd.members, 3, 'the squad'); same(r.namedAdd.selP2, false, 'the added one is still selected'); same(r.namedAdd.selM2, true, 'the other one lost its selection');
            same(r.pickBtns.btns.length, 2, 'one ADD for each'); ok(r.pickBtns.btns.every((b, i) => b === 'ADD ' + r.pickBtns.names[i]), 'their names ' + r.pickBtns.btns + ' vs ' + r.pickBtns.names); ok(/ROOM FOR 1/.test(r.pickBtns.sub[0]), 'note ' + r.pickBtns.sub); same(r.picked.secondIn, true, 'the second one\'s button did not add the second'); same(r.picked.firstIn, false, 'the first one was added'); same(r.picked.members, 3, 'the squad'); same(r.picked.selFirst, true, 'the first one lost its selection'); same(r.picked.selSecond, false, 'the added one is still selected');
            same(r.fullBtn.present, true, 'the full button'); same(r.fullBtn.disabled, true, 'the full button is on'); ok(/SQUAD FULL/.test(r.fullBtn.sub) && /SELECT ONE/.test(r.fullBtn.sub), 'note ' + r.fullBtn.sub);
        });
        check(w + ': an OPEN SLOT (in the roster\'s box, and on the bar over the dock) lists the followers that could fill it: the roster filtered to NOT IN SQUAD, nothing selected; IN SQUAD and ALL put the list back; closing the roster puts the filter away', () => {
            same(r.openSlot.filter, 'out', 'the filter'); same(r.openSlot.sel, 0, 'the selection (a stale one is what added the wrong follower)'); same(r.openSlot.tab, 'roster', 'the tab'); same(r.openSlot.allOut, true, 'a member is in the list'); same(r.openSlot.cards, r.openSlot.nOut, 'the cards are not the followers outside the squad'); same(r.openSlot.on.join(), 'NOT IN SQUAD', 'the lit chip'); ok(r.openSlot.chips.includes('IN SQUAD') && r.openSlot.chips.includes('NOT IN SQUAD'), 'the chips ' + r.openSlot.chips);
            same(r.inSquadFilter.filter, 'in', 'IN SQUAD'); same(r.inSquadFilter.allIn, true, 'a follower outside the squad is shown'); same(r.inSquadFilter.cards, r.inSquadFilter.members, 'the members'); same(r.allFilter.filter, null, 'ALL'); same(r.allFilter.cards, r.allFilter.units, 'everyone'); same(r.allFilter.on.join(), 'ALL', 'the lit chip');
            same(r.barSlot.tab, 'roster', 'the bar\'s open slot does not open the roster'); same(r.barSlot.filter, 'out', 'the bar\'s open slot: the filter'); same(r.barSlot.sel, 0, 'the bar\'s open slot: the selection'); same(r.barSlot.allOut, true, 'the bar\'s open slot: a member in the list'); same(r.closed.filter, null, 'the filter after closing'); same(r.refilled.members, 3, 'the squad'); same(r.refilled.filter, null, 'the roster reopened filtered'); ok(r.refilled.cards >= 6, 'the reopened roster shows everyone: ' + r.refilled.cards);
        });
        check(w + ': the SQUADS button is still at the top beside CLOSE, and opens YOUR SQUAD: all three followers as roster cards, a REMOVE on each, DISBAND SQUAD, the orders without work, no MAKE SQUAD; REMOVE opens its slot (a dashed card); DISBAND posts them all and turns itself off', () => {
            same(r.win.squadsBtn, true, 'the SQUADS button'); same(r.win.btnText, 'SQUADS', 'its words'); same(r.win.headFirst, 'SQUADS|✕ CLOSE', 'its place among the buttons'); same(r.win.shown, 'flex', 'the window'); same(r.win.title, 'YOUR SQUAD', 'the title'); same(r.win.cards, 3, 'the cards'); same(r.win.open, 0, 'open slots'); same(r.win.remove, 3, 'REMOVE buttons'); same(r.win.hasDisband, true, 'DISBAND SQUAD'); same(r.win.disbandOff, false, 'DISBAND is off with a squad');
            ok(!/MAKE SQUAD|ALL TO WORK|ALL TO FIGHT/.test(r.win.btnBox), 'the window has the classic buttons: ' + r.win.btns); ok(r.win.btns.includes('SWITCH ROLES'), 'the orders are gone ' + r.win.btns); same(r.win.names.length, 3, 'names');
            same(r.winRemoved.win.cards, 2, 'cards after REMOVE'); same(r.winRemoved.win.open, 1, 'a dashed card after REMOVE'); same(r.winRemoved.members, 2, 'the squad');
            same(r.winOpenSlot.open, false, 'an open slot of the window did not close it'); same(r.winOpenSlot.shown, 'none', 'the window'); same(r.winOpenSlot.filter, 'out', 'its list'); same(r.winOpenSlot.cards, r.winOpenSlot.nOut, 'the followers listed'); same(r.winOpenSlot.sel, 0, 'its selection'); same(r.disbanded.members, 0, 'the squad after DISBAND'); same(r.disbanded.posted, 6, 'holding rooms'); same(r.disbanded.allHold, true, 'all posted'); same(r.disbanded.win.cards, 0, 'cards'); same(r.disbanded.win.open, 3, 'dashed cards'); same(r.disbanded.win.disbandOff, true, 'DISBAND is on with nobody'); same(r.disbanded.box.join(), '-,-,-', 'the box'); same(r.disbanded.bar.join(), '-,-,-', 'the bar'); ok(/^SQUAD 0\/3 · 6 POSTED/.test(r.disbanded.summary), 'summary ' + r.disbanded.summary);
        });
        check(w + ': nobody works: no follower is on a crew, no INFO, row or summary speaks of work or duty, the code for work and roster squads is gone, and the phone\'s menu has the squad strip, ADD TO / REMOVE FROM SQUAD on the cards, YOUR SQUAD with DISBAND, and no ALL TO WORK', () => {
            same(r.work.duties, 0, 'workers'); ok(!/DUTY|WORK/.test(r.work.info), 'INFO ' + r.work.info); ok(!/duty|canWork|work|squadId/i.test(r.work.row + '|' + r.work.sum), 'the row or the summary: ' + r.work.row + ' | ' + r.work.sum); same(r.work.gone, Array(9).fill('undefined').join(), 'the work and roster-squad code: ' + r.work.gone);
            ok(/YOUR SQUAD · 3 \/ 3/.test(r.radialRoster.text), 'the strip ' + r.radialRoster.text.slice(0, 120)); same(r.radialRoster.chips.length >= 3, true, 'strip chips'); ok(r.radialRoster.btns.filter(b => /REMOVE FROM SQUAD/.test(b)).length === 3, 'REMOVE on the squad\'s cards: ' + r.radialRoster.btns); ok(r.radialRoster.btns.some(b => /ADD TO SQUAD|SQUAD FULL/.test(b)), 'ADD on a card that holds a room'); ok(!r.radialRoster.btns.some(b => /^WORK$/.test(b)) && !/MAKE SQUAD/.test(r.radialRoster.text), 'WORK or MAKE SQUAD');
            ok(/YOUR SQUAD/.test(r.radialSquad.text) && r.radialSquad.disband, 'the squad petal: ' + r.radialSquad.text.slice(0, 100)); same(r.radialSquad.cards, 3, 'its cards'); ok(!/WORKING|WORKERS/.test(r.radialSquad.text), 'the squad petal talks of work');
            ok(!/ALL TO WORK|ALL TO FIGHT/.test(r.radialOrders.text) && /SWITCH ROLES/.test(r.radialOrders.text), 'orders: ' + r.radialOrders.btns); same(r.radialDisbanded.members, 0, 'DISBAND on the phone');
        });
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
