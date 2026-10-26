// THE SQUAD IN THE COMMAND CENTER, AND NO MORE WORKING (js/party.js, js/commandcenter.js, js/radialmenu.js, js/mass.js; the facility; the classic game is as it was).
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
    var gone = partyOrdered()[1]; click(btn('#ccSide', 'REMOVE FROM SQUAD')); await wait(80);
    out.removed = { members: partyMembers().length, posted: partyPosted().length, goneHolds: !!gone.post, box: names('#ccSquadBox'), bar: names('#squadBar'), summary: $('#ccSummary').textContent, count: $('#ccSquadCount').textContent, side: sideBtns(), tagOnGone: !!(gone.post && cards().find(function(c){ return c._unit === gone; }).querySelector('.cc-tag.squad')) };
    // a follower holding a room, with a slot free: ADD TO SQUAD puts it back in THE SAME card slot
    out.freeSlot = partyOrdered().map(function(f){ return f.partySlot; }).join();
    selectedUnits.clear(); selectedUnits.add(gone); ccRender(); await wait(60);
    out.addBtn = { btns: sideBtns(), sub: texts('#ccSide .sqrow .cc-btn .cc-bs'), dds: texts('#ccSide .cc-dd .cc-dd-k') };
    click(btn('#ccSide', 'ADD TO SQUAD')); await wait(80);
    out.added = { members: partyMembers().length, inSquad: partyIsMember(gone), slot: gone.partySlot, box: names('#ccSquadBox'), side: sideBtns(), sub: $('#ccSide .cc-sel-sub').textContent };
    // the squad full, a follower holding a room selected: SWAP WITH each of the three; it takes the card of the one it replaces
    var held = partyPosted()[0], whoseSlot = partyOrdered()[2], slotNo = whoseSlot.partySlot;
    selectedUnits.clear(); selectedUnits.add(held); ccRender(); await wait(60);
    out.swapBtns = sideBtns(); var third = $$('#ccSide .cc-btn').find(function(b){ return b.textContent.indexOf('SWAP WITH ' + unitTypeLabel(whoseSlot)) === 0; });
    click(third); await wait(80);
    out.swapped = { heldIn: partyIsMember(held), heldSlot: held.partySlot, slotNo: slotNo, outPosted: !!whoseSlot.post, members: partyMembers().length, box: names('#ccSquadBox') };
    // several selected, one slot free: ADD 1 TO SQUAD, the rest keep holding
    partyRemove([partyOrdered()[0]]); var two = partyPosted().slice(0, 2); selectedUnits.clear(); two.forEach(function(f){ selectedUnits.add(f); }); ccRender(); await wait(60);
    out.multiBtn = sideBtns(); click(btn('#ccSide', 'ADD 1 TO SQUAD')); await wait(80); out.multi = { members: partyMembers().length, stillPosted: two.filter(function(f){ return !!f.post; }).length };
    // the squad full and two posted selected: no add, and it says so
    selectedUnits.clear(); partyPosted().slice(0, 2).forEach(function(f){ selectedUnits.add(f); }); ccRender(); await wait(60);
    var fullBtn = btn('#ccSide', 'ADD TO SQUAD'); out.fullBtn = { present: !!fullBtn, disabled: !!(fullBtn && fullBtn.disabled), sub: fullBtn ? fullBtn.querySelector('.cc-bs').textContent : null };
    // THE SQUADS WINDOW: the three cards (REMOVE on each), DISBAND SQUAD; no roster squads, no work
    selectedUnits.clear(); ccSquadsOpen = true; ccRender(); await wait(80);
    var win = function(){ return { shown: getComputedStyle($('#ccSquadWin')).display, title: $('#ccSquadTitle').textContent, cards: $$('#ccSquadBody .cc-yoursquad .cc-card:not(.cc-open)').length, open: $$('#ccSquadBody .cc-yoursquad .cc-card.cc-open').length, remove: $$('#ccSquadBody .cc-yoursquad .cc-btn').length,
      names: texts('#ccSquadBody .cc-yoursquad .cc-name'), hasDisband: !!btn('#ccSquadBody', 'DISBAND SQUAD'), disbandOff: !!(btn('#ccSquadBody', 'DISBAND SQUAD') || { disabled: false }).disabled, btns: texts('#ccSquadBody .cc-btn .cc-bl'), btnBox: $('#ccSquadBody').textContent,
      squadsBtn: !!$('#ccSquadsBtn') && getComputedStyle($('#ccSquadsBtn')).display !== 'none', btnText: $('#ccSquadsBtn').textContent, headFirst: texts('#ccRoot .cc-head button').slice(-2).join('|') }; };
    out.win = win(); out.winSquad = squad();
    click($$('#ccSquadBody .cc-yoursquad .cc-btn')[0]); await wait(80); out.winRemoved = { win: win(), members: partyMembers().length };
    click(btn('#ccSquadBody', 'DISBAND SQUAD')); await wait(80); out.disbanded = { win: win(), members: partyMembers().length, posted: partyPosted().length, allHold: partyPosted().every(function(f){ return !!f.post && f.stance === 'hold'; }), box: names('#ccSquadBox'), bar: names('#squadBar'), summary: $('#ccSummary').textContent };
    ccSquadsOpen = false; ccRender(); await wait(30);
    // nobody works: the numbers, the INFO card, the orders, the long-press ring's button
    var f0 = followers[0]; out.work = { can: followers.map(function(f){ return canWorkMass(f); }).filter(Boolean).length, set: setFollowerDuty(f0, 'worker', true), duty: f0.duty || null, toggle: toggleFollowerDuty(f0), allWork: radialSetAllWork(true), duties: followers.filter(function(f){ return f.duty === 'worker'; }).length,
      row: ccRow(f0).canWork, sum: ccSelectionSummary().canWork, info: JSON.stringify(unitInfo(f0).jobs), cj: cloneJob({ isClone: true, speciesName: 'beetle', dead: false, team: 'green' }), squadOf: squadOf(f0), live: squadsLive().length };
    f0.squadId = 'A'; out.stale = { of: squadOf(f0), live: squadsLive().length, make: squadMake([f0]) }; f0.squadId = undefined;
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
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860;');
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

    group('NO MORE WORKING (the facility)');
    check('nobody works in the facility: no element can, the duty is refused (even through the roster\'s toggle or ALL TO WORK), a clone has no job, the INFO card has no DUTY and no WORK; the classic game is as it was', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; const el = ['electric', 'flux', 'core', 'toxic', 'ice', 'fire']; o.can = el.filter(e => canWorkMass({ element: e })).length; const f = fs[0]; f.element = 'electric';
            o.set = [setFollowerDuty(f, 'worker', true), f.duty || null, toggleFollowerDuty(f), radialSetAllWork(true), fs.filter(x => x.duty === 'worker').length, ccApplyDuty(fs, 'worker')];
            o.clone = [cloneJob({ isClone: true, speciesName: 'beetle' }), cloneDutyLabel({ isClone: true, speciesName: 'beetle' }), canCloneWork({ isClone: true, speciesName: 'beetle', team: 'green' })];
            const info = unitInfo(f); o.info = JSON.stringify(info.jobs); facilityPlay = false;
            o.classic = [el.filter(e => canWorkMass({ element: e })).length, setFollowerDuty(f, 'worker', true), f.duty, JSON.stringify(unitInfo(f).jobs).includes('DUTY'), JSON.stringify(unitInfo(f).jobs).includes('WORK ·')]; setFollowerDuty(f, 'fighter', true); facilityPlay = true; return o; })()`);
        same(r.can, 0, 'elements that can work'); same(r.set.join(), 'false,,false,0,0,0', 'duty, toggle, ALL TO WORK, the roster\'s duty'); same(r.clone[0], null, 'a clone\'s job'); same(r.clone[1], 'FIGHTER', 'a clone\'s label'); same(r.clone[2], false, 'a clone can work');
        ok(!/DUTY|WORKING|FIGHTING|WORK/.test(r.info), 'the INFO card talks of work: ' + r.info); ok(/STANCE/.test(r.info) && /IN THE SQUAD/.test(r.info), 'the INFO card does not say it is in the squad: ' + r.info);
        same(r.classic[0], 5, 'the classic game\'s workers'); same(r.classic[1], true, 'the classic game\'s duty'); same(r.classic[2], 'worker', 'duty set'); same(r.classic[3], true, 'the classic INFO has its DUTY'); same(r.classic[4], true, 'the classic INFO has its WORK');
    });
    check('there are no roster squads (A, B, C) in the facility: a stale letter on a follower is not found, none can be made; the classic game has them', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; fs[0].squadId = 'A'; o.fac = [squadOf(fs[0]), squadsLive().length, squadMake([fs[0]]), squadAssign('A', [fs[1]])]; facilityPlay = false; o.cla = [squadOf(fs[0]), squadsLive().length, squadAssign('A', [fs[1]])]; fs[0].squadId = undefined; fs[1].squadId = undefined; facilityPlay = true; return o; })()`);
        same(r.fac.join(), ',0,,-1', 'the facility\'s roster squads'); same(r.cla.join(), 'A,1,1', 'the classic game\'s roster squads');
    });
    check('the code has no way to make a worker in the facility, and the roster does not offer one: the filters, the tag, the DUTY drop-down, ALL TO WORK and the phone\'s WORK button are the classic game\'s alone', () => {
        const c = rd('js/commandcenter.js'), m = rd('js/radialmenu.js');
        ok(/if \(!_ccParty\(\)\) \[\["WORKING", "worker"/.test(c), 'the WORKING / FIGHTING filters'); ok(/r\.working && !pt/.test(c), 'the WORK tag'); { const i = c.indexOf('_ccDropdown(side, "duty"'), j = c.lastIndexOf('if (!_ccParty()) {', i); ok(i > 0 && j > 0 && i - j < 1200, 'the DUTY drop-down'); } ok(/\.concat\(_ccParty\(\) \? \[\]/.test(c), 'ALL TO WORK / ALL TO FIGHT');
        ok(/if \(!_rParty\(\)\) \{[^}]*ALL TO WORK/s.test(m), 'the phone\'s orders'); ok(/canWorkMass\(actor\) \{\s*if \(typeof partyOn === "function" && partyOn\(\)\) return false;/.test(rd('js/mass.js')), 'canWorkMass'); ok(/duty === 'worker' && typeof partyOn === "function" && partyOn\(\)\) return false;/.test(rd('js/mass.js')), 'setFollowerDuty');
    });

    group('THE ROSTER, THE SQUADS WINDOW AND THE PHONE\'S MENU (real browser)');
    for (const [w, h] of [[1180, 820], [500, 800]]) {
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
        check(w + ': a tap on a card in the box selects that follower; the side panel says SQUAD · 3 OF 3 and offers REMOVE FROM SQUAD (no STANCE, no DUTY); REMOVE posts it: its card slot opens in the box and on the bar, the summary and the card follow', () => {
            same(r.member.sel, 1, 'selected'); same(r.member.boxSel, 1, 'the card is not lit'); ok(/IN THE SQUAD/.test(r.member.sub), 'sub ' + r.member.sub); same(r.member.btns.join(), 'REMOVE FROM SQUAD', 'the squad buttons'); same(r.member.dds.join(), 'ATTACK STYLE,PLAY STYLE', 'the settings (no STANCE, no DUTY)'); ok(r.member.secs.includes('SQUAD · 3 OF 3'), 'secs ' + r.member.secs);
            same(r.removed.members, 2, 'the squad'); same(r.removed.goneHolds, true, 'it holds a room'); same(r.removed.box.filter(n => n === '-').length, 1, 'an open slot in the box'); same(r.removed.box.join(), r.removed.bar.join(), 'the bar and the box'); ok(/^SQUAD 2\/3 · 4 POSTED/.test(r.removed.summary), 'summary ' + r.removed.summary); same(r.removed.count, 'YOUR SQUAD · 2 / 3', 'the count'); same(r.removed.tagOnGone, false, 'the SQUAD tag stayed');
            same(r.removed.side.join(), 'ADD TO SQUAD', 'the side panel after REMOVE (it holds a room now: ADD TO SQUAD)');
        });
        check(w + ': a follower holding a room offers ADD TO SQUAD (1 SLOT FREE) and goes back to the card slot that was free; with the squad full it offers SWAP WITH each of the three, and takes the card of the one it replaces (who holds its room); several selected are added as far as there is room, the rest keep holding, and with none free ADD TO SQUAD is off', () => {
            same(r.addBtn.btns.join(), 'ADD TO SQUAD', 'the button'); same(r.addBtn.sub[0], '1 SLOT FREE', 'the note'); same(r.addBtn.dds.join(), 'ATTACK STYLE,PLAY STYLE', 'settings'); same(r.added.members, 3, 'the squad'); same(r.added.inSquad, true, 'in the squad'); same(r.added.slot, 1, 'the card slot it had'); same(r.added.side.join(), 'REMOVE FROM SQUAD', 'the side panel after ADD'); ok(/IN THE SQUAD/.test(r.added.sub), 'sub ' + r.added.sub);
            same(r.swapBtns.length, 3, 'the swap buttons'); ok(r.swapBtns.every(b => /^SWAP WITH /.test(b)), 'swap ' + r.swapBtns); same(r.swapped.heldIn, true, 'the follower is in the squad'); same(r.swapped.heldSlot, r.swapped.slotNo, 'the card it took'); same(r.swapped.outPosted, true, 'the one it replaced holds its room'); same(r.swapped.members, 3, 'the squad');
            same(r.multiBtn.join(), 'ADD 1 TO SQUAD', 'the multi button'); same(r.multi.members, 3, 'the squad after the multi add'); same(r.multi.stillPosted, 1, 'the one that did not fit'); same(r.fullBtn.present, true, 'the full button'); same(r.fullBtn.disabled, true, 'the full button is on'); ok(/SQUAD FULL/.test(r.fullBtn.sub), 'note ' + r.fullBtn.sub);
        });
        check(w + ': the SQUADS button is still at the top beside CLOSE, and opens YOUR SQUAD: all three followers as roster cards, a REMOVE on each, DISBAND SQUAD, the orders without work, no MAKE SQUAD; REMOVE opens its slot (a dashed card); DISBAND posts them all and turns itself off', () => {
            same(r.win.squadsBtn, true, 'the SQUADS button'); same(r.win.btnText, 'SQUADS', 'its words'); same(r.win.headFirst, 'SQUADS|✕ CLOSE', 'its place among the buttons'); same(r.win.shown, 'flex', 'the window'); same(r.win.title, 'YOUR SQUAD', 'the title'); same(r.win.cards, 3, 'the cards'); same(r.win.open, 0, 'open slots'); same(r.win.remove, 3, 'REMOVE buttons'); same(r.win.hasDisband, true, 'DISBAND SQUAD'); same(r.win.disbandOff, false, 'DISBAND is off with a squad');
            ok(!/MAKE SQUAD|ALL TO WORK|ALL TO FIGHT/.test(r.win.btnBox), 'the window has the classic buttons: ' + r.win.btns); ok(r.win.btns.includes('SWITCH ROLES'), 'the orders are gone ' + r.win.btns); same(r.win.names.length, 3, 'names');
            same(r.winRemoved.win.cards, 2, 'cards after REMOVE'); same(r.winRemoved.win.open, 1, 'a dashed card after REMOVE'); same(r.winRemoved.members, 2, 'the squad');
            same(r.disbanded.members, 0, 'the squad after DISBAND'); same(r.disbanded.posted, 6, 'holding rooms'); same(r.disbanded.allHold, true, 'all posted'); same(r.disbanded.win.cards, 0, 'cards'); same(r.disbanded.win.open, 3, 'dashed cards'); same(r.disbanded.win.disbandOff, true, 'DISBAND is on with nobody'); same(r.disbanded.box.join(), '-,-,-', 'the box'); same(r.disbanded.bar.join(), '-,-,-', 'the bar'); ok(/^SQUAD 0\/3 · 6 POSTED/.test(r.disbanded.summary), 'summary ' + r.disbanded.summary);
        });
        check(w + ': nobody works: no follower can be put on the crew by any button, no INFO or card says so, and the phone\'s menu has the squad strip, ADD TO / REMOVE FROM SQUAD on the cards, YOUR SQUAD with DISBAND, and no ALL TO WORK', () => {
            same(r.work.can, 0, 'who can work'); same(r.work.set, false, 'the duty'); same(r.work.duty, null, 'duty'); same(r.work.toggle, false, 'toggle'); same(r.work.allWork, 0, 'ALL TO WORK'); same(r.work.duties, 0, 'workers'); same(r.work.row, false, 'the roster row'); same(r.work.sum, 0, 'the selection'); ok(!/DUTY|WORK/.test(r.work.info), 'INFO ' + r.work.info); same(r.work.cj, null, 'clone job'); same(r.work.squadOf, null, 'squadOf'); same(r.work.live, 0, 'squadsLive');
            same(r.stale.of, null, 'a stale letter'); same(r.stale.live, 0, 'a stale squad'); same(r.stale.make, null, 'MAKE SQUAD');
            ok(/YOUR SQUAD · 3 \/ 3/.test(r.radialRoster.text), 'the strip ' + r.radialRoster.text.slice(0, 120)); same(r.radialRoster.chips.length >= 3, true, 'strip chips'); ok(r.radialRoster.btns.filter(b => /REMOVE FROM SQUAD/.test(b)).length === 3, 'REMOVE on the squad\'s cards: ' + r.radialRoster.btns); ok(r.radialRoster.btns.some(b => /ADD TO SQUAD|SQUAD FULL/.test(b)), 'ADD on a card that holds a room'); ok(!r.radialRoster.btns.some(b => /^WORK$/.test(b)) && !/MAKE SQUAD/.test(r.radialRoster.text), 'WORK or MAKE SQUAD');
            ok(/YOUR SQUAD/.test(r.radialSquad.text) && r.radialSquad.disband, 'the squad petal: ' + r.radialSquad.text.slice(0, 100)); same(r.radialSquad.cards, 3, 'its cards'); ok(!/WORKING|WORKERS/.test(r.radialSquad.text), 'the squad petal talks of work');
            ok(!/ALL TO WORK|ALL TO FIGHT/.test(r.radialOrders.text) && /SWITCH ROLES/.test(r.radialOrders.text), 'orders: ' + r.radialOrders.btns); same(r.radialDisbanded.members, 0, 'DISBAND on the phone');
        });
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
