// A SQUAD MEMBER'S CARD, ON THE FLY, and the orders' ALL button (js/squadfly.js, js/mixtool.js; game.html "THE CORNERS": the facility on a tablet or a desktop).
// ASKED: "the on screen squad roster should shuffle into the nook above the attack menu to the left, remove the element picker and replace with 'all' button the player can select each squad member and pull their card roster information
// up on the fly and may choose to dismiss from squad from this little side menu and index."
// The logic runs in the sandbox, the cards, the buttons and the taps in the real browser (no Chromium: it says so and passes).
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

// The real page, in the facility: the squad of three, a tap on a card, the card beside the stack, INDEX, DISMISS, ALL.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var st = document.createElement('style'); st.textContent = '#mixTool, #mixTool *, #squadBar, #squadBar *, #squadFly, #squadFly * { transition: none !important; animation: none !important }'; document.head.appendChild(st);
  var click = function(el){ el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  var rect = function(e){ if (!e) return null; var b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
  var flyOn = function(){ var f = $('#squadFly'); return !!f && f.classList.contains('on') && getComputedStyle(f).display !== 'none'; };
  var slots = function(){ return $$('#squadBar .sb-slot'); }, txt = function(sel){ var e = $(sel); return e ? e.textContent : null; };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; var wide = innerWidth > 700; out.wide = wide; out.corners = hudCorners(); if (!wide) crystalMenuOpen = true; selectedUnits.clear(); partyTick(); mixToolRender(true); await wait(60);   // (a phone: the tool is open, to see its WHO row)
    out.start = { fly: flyOn(), all: !!$('#mixTool .mt-all.on'), to: $('#mixTool .mt-to b') ? $('#mixTool .mt-to b').textContent : null, who: $$('#mixTool [data-scope]').map(function(c){ return c.getAttribute('data-scope'); }).join(), chips: $$('#mixTool .mt-chip').length, body: document.body.classList.contains('corners') };
    // a tap on the first card: the card opens beside the stack
    var s0 = slots()[0], m0 = s0._unit; click(s0); await wait(60);
    var f = $('#squadFly'), card = f ? f.querySelector('.sf-card') : null;
    out.pick = { fly: flyOn(), sel: selectedUnits.size, all: !!$('#mixTool .mt-all.on'), to: $('#mixTool .mt-to b') ? $('#mixTool .mt-to b').textContent : null, name: f && f.querySelector('.sf-name') ? f.querySelector('.sf-name').textContent : null, label: unitTypeLabel(m0), sub: f && f.querySelector('.sf-sub') ? f.querySelector('.sf-sub').textContent : null,
      tags: f ? $$('#squadFly .sf-tag, #squadFly .sf-rt').map(function(t){ return t.textContent; }).join() : '', hpn: f && f.querySelector('.sf-hpn') ? f.querySelector('.sf-hpn').textContent : null, btns: f ? $$('#squadFly .sf-btn').filter(function(b){ return b.getClientRects().length > 0; }).map(function(b){ return b.textContent; }) : [], thumb: !!(f && f.querySelector('canvas.sf-thumb')),
      fr: rect(f), sr: rect(s0), br: rect($('#squadBar')), tr: rect($('#mixTool .mt-panel')), col: card ? card.style.getPropertyValue('--c') : '', go: $('#mixTool .mt-foe-go') ? $('#mixTool .mt-foe-go').textContent : null };
    // ITS TWO EQUIP CARD SLOTS on the card (js/cards.js; the owner, 2026-11-01: "equip different equipment cards from the on-screen roster open tab"): with nothing in the hand the two rows say so and take no tap; with the test cards to hand
    // (?cards=all, in-page) CARD 1 lists EMPTY and the cards that fit this follower, each with its short text (since build 2026-11-07pp the rest are not shown); a tap wears one (the row names it, with its rarity chip, the list shuts, the card stays open); EMPTY takes it off
    if (card) {
      var slotRows = function(){ return $$('#squadFly .sf-slot').map(function(b){ return [b.querySelector('.sf-sk').textContent, b.querySelector('.sf-sv').textContent, b.disabled, !!b.querySelector('.cd-chip.mini')]; }); };
      out.cards = { off: slotRows(), offList: $$('#squadFly .sf-slot-list').length }; click($$('#squadFly .sf-slot')[0]); await wait(40); out.cards.offTap = $$('#squadFly .sf-slot-list').length;
      equipDevSet('all'); partyTick(); partyFlyRender(true); await wait(60); out.cards.rows = slotRows(); out.cards.hand = equipUsableCards().filter(function(c){ return !c.attack; }).length; out.cards.fits = equipUsableCards().filter(function(c){ return !c.attack && !equipWhyNot(m0, c.id, 0); }).length;
      click($$('#squadFly .sf-slot')[0]); await wait(60); out.cards.list = $$('#squadFly .sf-opt').map(function(o){ return [o.querySelector('.sf-ol').textContent, o.disabled, (o.querySelector('.sf-os') || {}).textContent || '', !!o.querySelector('.cd-chip.mini')]; }); out.cards.open = $$('#squadFly .sf-slot.open').length;
      out.cards.fx = $$('#squadFly .sf-opt').filter(function(o){ return o.querySelector('.sf-ol').textContent !== 'EMPTY'; }).map(function(o){ var c = Object.values(equipCards()).filter(function(c){ return c.name === o.querySelector('.sf-ol').textContent; })[0]; return !!c && !!c.text && (o.querySelector('.sf-ofx') || {}).textContent === equipShortText(c); });
      var fitOpt = out.cards.list.filter(function(o){ return o[0] !== 'EMPTY' && !o[1]; })[0]; out.cards.pick = fitOpt ? fitOpt[0] : null; out.cards.pickId = (Object.values(equipCards()).filter(function(c){ return c.name === out.cards.pick; })[0] || {}).id || null;   // (the first card that fits this member: no card fits everyone since the Universal kind was retired, Build B)
      click($$('#squadFly .sf-opt').filter(function(o){ return o.querySelector('.sf-ol').textContent === out.cards.pick; })[0]); await wait(60);
      out.cards.worn = [m0.cards ? m0.cards.slice() : null, $$('#squadFly .sf-slot-list').length, slotRows()[0], flyOn(), selectedUnits.has(m0)];
      ccOpen(); if (typeof ccShowUnit === 'function') ccShowUnit(m0); ccRender(); await wait(60); click($$('#ccSide .cc-dd').filter(function(d){ return /^CARD 1/.test(d.querySelector('.cc-dd-k').textContent); })[0]); await wait(80);
      out.cards.roster = { opts: $$('#cardPick .cp-tile').filter(function(t){ return t.getAttribute('data-card'); }).map(function(t){ var c = equipCard(t.getAttribute('data-card')); return !!c && (t.querySelector('.cd-card .cd-text') || {}).textContent === equipShortText(c) && t.querySelector('.cp-nm').textContent === c.name && !equipWhyNot(m0, c.id, 0); }), title: ($('#cardPick.open .cp-title') || {}).textContent || '', worn: ($$('#ccRoot .cc-dd-fx')[0] || {}).textContent || '', wornText: equipShortText(equipCard(m0.cards && m0.cards[0])) };
      cardPickClose(); ccClose(); partyFlyRender(true); await wait(40);
      click($$('#squadFly .sf-slot')[1]); await wait(60); out.cards.second = [$$('#squadFly .sf-slot-list').length, $$('#squadFly .sf-slot.open').length, $$('#squadFly .sf-opt').filter(function(o){ return o.querySelector('.sf-ol').textContent === out.cards.pick; }).length];
      click($$('#squadFly .sf-slot')[1]); await wait(40); click($$('#squadFly .sf-slot')[0]); await wait(60); click($$('#squadFly .sf-opt').filter(function(o){ return o.querySelector('.sf-ol').textContent === 'EMPTY'; })[0]); await wait(60);
      out.cards.off2 = [m0.cards || null, slotRows()[0][1], $$('#squadFly .sf-slot-list').length];
      equipDevSet(''); partyTick(); partyFlyRender(true); await wait(40); out.cards.back = slotRows()[0];
    }
    // ITS XP: how far through its level, and how far it is from evolving (js/levels.js xpProgress)
    if (card) { var xs = function(){ var b = $('#squadFly .sf-xp .sb-xp u'), e = $('#squadFly .sf-evo'); return { n: txt('#squadFly .sf-xpn'), evo: e ? e.textContent : null, w: b ? b.style.width : null, soon: !!(e && e.classList.contains('soon')), hidden: !!(e && getComputedStyle(e).display === 'none') }; };
      m0.evolved = undefined; m0.level = 7; m0.xp = xpForLevel(7) + 85; partyTick(); await wait(60); out.xp = { l7: xs() };
      m0.level = 9; m0.xp = xpForLevel(9) + 100; partyTick(); await wait(60); out.xp.l9 = xs();
      m0.evolved = 'seeper'; partyTick(); await wait(60); out.xp.evolved = xs(); m0.evolved = undefined; m0.level = 5; m0.xp = xpForLevel(5); partyTick(); await wait(60); out.xp.l5 = xs(); }
    // INDEX opens the unit's info (its attacks, jobs and stats)
    var ix = $('#squadFly [data-act=index]'); if (ix) click(ix); await wait(40); out.index = { open: !!$('#unitInfo'), title: $('#unitInfo .ui-title') ? $('#unitInfo .ui-title').textContent : null };
    var press = function(el){ el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 1, isPrimary: true })); };
    if ($('#unitInfo')) press($('#unitInfo')); unitInfoClose(); await wait(40); out.index.back = flyOn();   // (a press on the unit info is not one away from the card: closing it brings the card back)
    // REPORTED: "when I click away, it should still have that character selected, but the card should go away"
    if ($('#squadFly .sf-name')) press($('#squadFly .sf-name')); await wait(40); out.away = { onCard: flyOn() };   // (a phone has no card)
    press(document.body); await wait(60); out.away.fly = flyOn(); out.away.sel = selectedUnits.size; out.away.lit = s0.classList.contains('sel');
    for (var w = 0; w < 40 && txt('#mixTool .mt-to b') !== unitTypeLabel(m0); w++) { if (typeof mixToolRender === 'function') mixToolRender(false); await wait(25); }   // (the tool's caption is redrawn by the loop every six frames, js/game.js render, when its signature moves: in this page the loop's cadence is not reliable, and the XP step's SEEPER could stay on the caption; the loop's own call is made here until it catches up, up to a second)
    out.away.to = txt('#mixTool .mt-to b'); out.away.label = unitTypeLabel(m0);
    partyTick(); await wait(40); out.away.tick = flyOn();
    click(s0); await wait(60); out.away.letGo = [selectedUnits.size, flyOn()]; click(s0); await wait(60); out.away.again = [selectedUnits.size, flyOn(), txt('#squadFly .sf-name')];
    // a second card picked: the card is the last one tapped; two picked says so
    var s1 = slots()[1], m1 = s1._unit; click(s1); await wait(60);
    out.two = { fly: flyOn(), sel: selectedUnits.size, name: txt('#squadFly .sf-name'), label1: unitTypeLabel(m1), to: txt('#mixTool .mt-to b') };
    // letting the last tapped one go: the card goes to the other one that is picked
    click(s1); await wait(60); out.back = { fly: flyOn(), sel: selectedUnits.size, name: txt('#squadFly .sf-name'), label0: unitTypeLabel(m0) };
    // ALL lets them all go, and the card goes
    if ($('#mixTool .mt-all')) click($('#mixTool .mt-all')); await wait(60); out.all = { fly: flyOn(), sel: selectedUnits.size, on: !!$('#mixTool .mt-all.on'), to: txt('#mixTool .mt-to b'), mode: squadMode };
    // DISMISS FROM SQUAD: the member holds the room it is in, the card goes, the slot is open and says CALL
    click(s0); await wait(60); var before = partyMembers().length, room = partyRoomOf(m0); if ($('#squadFly [data-act=dismiss]')) click($('#squadFly [data-act=dismiss]')); await wait(80);
    var op = slots()[0].querySelector('.sb-open');
    out.dismiss = { before: before, after: partyMembers().length, post: m0.post || null, room: room, member: partyIsMember(m0), fly: flyOn(), sel: selectedUnits.size, to: txt('#mixTool .mt-to b'), slotEmpty: slots()[0].classList.contains('empty'), open: op ? op.textContent : null, said: floatingTexts.slice(-2).map(function(t){ return t.text; }) };
    // a card that is picked and then taken out some other way (HOLD) closes the card too
    click(slots()[1]); await wait(60); out.hold = { fly0: flyOn() }; mixToolOrder('hold'); await wait(60); out.hold.fly1 = flyOn();
    // the tool is one slab: ORDERS TO, ALL, RETREAT, HOLD, COME (the tool's height is what game.html reserves for the stack above it)
    var p = $('#mixTool .mt-panel'); out.tool = { h: p ? Math.round(p.getBoundingClientRect().height) : 0, css: getComputedStyle(document.documentElement).getPropertyValue('--cn-tool').trim(), kids: p ? p.children.length : 0 };
    // a creature locked on: the picked member names who goes on the card's strip
    actors = actors.filter(function(a){ return !(a instanceof Predator); }); var e = spawnCreature({ species: 'beetle', className: 'tank' }); e.x = player.x + 3; e.y = player.y + 1; e.state = 'wander'; e.provoked = false; e.moveSpeed = 0; e.baseMoveSpeed = 0; targetSet(e, true);
    selectedUnits.clear(); partyTick(); mixToolRender(true); await wait(60); out.foe0 = $('#mixTool .mt-foe-go') ? $('#mixTool .mt-foe-go').textContent : null;
    selectedUnits.add(partyOrdered()[0]); mixToolRender(true); await wait(60); out.foe1 = $('#mixTool .mt-foe-go') ? $('#mixTool .mt-foe-go').textContent : null;
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__sf'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sf-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=20000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 100000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__sf">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860; innerWidth = 1100;');   // (the page boots the facility: the start returns early; only the tutorial's blackout is lifted)
    run(`globalThis.__cell = (room, k) => { const cs = partyRoomCells(room); return cs[Math.floor(cs.length * (k === undefined ? 0.5 : k))]; };
        globalThis.__fresh = (n) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); squadMode = 'all'; floatingTexts.length = 0; _sfLast = null; _sfAway = false; player.x = player.targetX = player.visualX = __cell('crystal_chamber')[0]; player.y = player.targetY = player.visualY = __cell('crystal_chamber')[1];
            for (let i = 0; i < n; i++) { spawnFollowerAtCrystal(['electric', 'core', 'fire', 'ice', 'toxic', 'flux'][i % 6]); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.health = f.maxHealth = 1e7; f.currentWill = 1e5; f.x = player.x + 0.5 + i * 0.2; f.y = player.y + 0.5; } partyTick(); return followers.slice(); };`);

    group('THE CORNERS LAYOUT (js/party.js hudCorners)');
    check('a tablet or a desktop in the facility has it (701 px and wider); a phone and the website\'s background have not', () => {
        const r = J(`(function(){ const o = {}; innerWidth = 1100; o.wide = hudCorners(); innerWidth = 701; o.edge = hudCorners(); innerWidth = 700; o.phone = hudCorners(); innerWidth = 1100; const keep = attractOn; attractOn = () => true; o.away = hudCorners(); attractOn = keep; return o; })()`);
        same(r.wide, true, 'a wide screen'); same(r.edge, true, '701 px'); same(r.phone, false, '700 px'); same(r.away, false, 'the website\'s background');
        ok(/document\.body\.classList\.toggle\("corners", hudCorners\(\)\)/.test(rd('js/party.js')), 'the body class is not set by the bar\'s render'); ok(/body\.corners #squadBar/.test(rd('game.html')) && /body\.corners #mixTool/.test(rd('game.html')), 'game.html has no corners rules');
    });

    group('THE ORDERS: ALL, or the member picked (js/mixtool.js)');
    check('the corners layout\'s tool has ORDERS TO and one ALL button (lit while nobody is picked), RETREAT, HOLD and COME, and no WHO row or element chips; a phone keeps the WHO row', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; innerWidth = 1100; o.html = mixToolHTML(); o.who0 = mixToolWho(); selectedUnits.add(fs[1]); o.one = [mixToolWho(), /mt-all on/.test(mixToolHTML()), mixToolTarget()]; selectedUnits.add(fs[2]); o.two = mixToolWho(); selectedUnits.clear();
            innerWidth = 500; crystalMenuOpen = true; o.phone = mixToolHTML(); crystalMenuOpen = false; innerWidth = 1100; return o; })()`);
        ok(/class="mt-to"><span>ORDERS TO<\/span><b>3 FOLLOWING<\/b>/.test(r.html), 'the caption: ' + r.html.slice(0, 200)); same((r.html.match(/data-scope="/g) || []).length, 1, 'scope buttons'); ok(/class="mt-all on" data-scope="all"/.test(r.html), 'ALL is lit'); ok(!/mt-who|mt-chip/.test(r.html), 'the WHO row is still there');
        ok(/data-act="retreat"/.test(r.html) && /data-order="hold"/.test(r.html) && /data-order="follow"/.test(r.html), 'the controls'); same(r.who0, '3 FOLLOWING', 'the caption with nobody picked');
        same(r.one[0], r.one[0].toUpperCase(), 'the member\'s name'); ok(/ICE|CORE|ELECTRIC|FIRE|TOXIC|FLUX/.test(r.one[0]) && !/FOLLOWING/.test(r.one[0]), 'a picked member is named: ' + r.one[0]); same(r.one[1], false, 'ALL is lit with a member picked'); same(r.one[2], 'SELECTED 1', 'the enemy card\'s strip'); same(r.two, '2 SELECTED', 'two picked');
        same((r.phone.match(/data-scope="/g) || []).length, 7, 'a phone keeps ALL and the six elements'); ok(/mt-who/.test(r.phone) && !/mt-all/.test(r.phone), 'a phone\'s WHO row');
    });
    check('ALL lets go of whoever is picked and puts the orders back on the whole squad (an element left set by a phone is not heard); the orders of a picked member reach that member alone', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; innerWidth = 1100; squadMode = 'selected'; player.selectedElement = fs[0].element; o.pool0 = getCommandPool().length; selectedUnits.add(fs[1]); o.pool1 = getCommandPool().map(f => f === fs[1]).join(); mixToolScope('all'); o.after = [selectedUnits.size, squadMode, getCommandPool().length];
            selectedUnits.add(fs[2]); mixToolOrder('hold'); o.hold = [!!fs[2].post, !!fs[0].post, !!fs[1].post]; return o; })()`);
        same(r.pool0, 3, 'an element left set narrowed the orders in the corners layout'); same(r.pool1, 'true', 'the picked member alone'); same(r.after.join(), '0,all,3', 'ALL'); same(r.hold.join(), 'true,false,false', 'HOLD reached the picked member only');
    });

    group('THE MEMBER\'S CARD (js/squadfly.js)');
    check('the card is for the last member tapped that is still picked, else the first that is picked; nobody picked, a follower holding a room, and a phone have none', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; innerWidth = 1100; o.none = partyFlySubject() === null; selectedUnits.add(fs[0]); o.one = partyFlySubject() === fs[0]; selectedUnits.add(fs[2]); _sfLast = fs[2]; o.last = partyFlySubject() === fs[2]; selectedUnits.delete(fs[2]); o.fallback = partyFlySubject() === fs[0];
            selectedUnits.clear(); fs[1].post = 'lab_hallway'; selectedUnits.add(fs[1]); o.held = partyFlySubject() === null; fs[1].post = null; selectedUnits.clear(); selectedUnits.add(fs[0]); innerWidth = 500; o.phone = partyFlySubject() === null; innerWidth = 1100; return o; })()`);
        for (const k of ['none', 'one', 'last', 'fallback', 'held', 'phone']) same(r[k], true, k);
    });
    check('a press away puts the card away and the member stays picked; the next member tapped on the stack opens theirs, a tap on a picked one lets it go and leaves the card away, and with nobody picked the next pick opens it', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}, tap = f => partyBarClick({ target: { closest: s => s === '.sb-slot' ? { _unit: f, _call: null } : null } }); innerWidth = 1100;
            tap(fs[0]); o.open = [partyFlySubject() === fs[0], _sfAway]; _sfAway = true; o.away = [partyFlySubject() === null, selectedUnits.has(fs[0])]; partyTick(); o.kept = _sfAway;
            tap(fs[1]); o.next = [partyFlySubject() === fs[1], _sfAway, selectedUnits.size]; _sfAway = true; tap(fs[1]); o.letGo = [selectedUnits.has(fs[1]), _sfAway, partyFlySubject() === null];
            selectedUnits.clear(); partyTick(); o.reset = _sfAway; return o; })()`);
        same(r.open.join(), 'true,false', 'the card of the member tapped'); same(r.away.join(), 'true,true', 'put away: no card, the member still picked'); same(r.kept, true, 'the next tick brought the card back');
        same(r.next.join(), 'true,false,2', 'the next member tapped opens theirs'); same(r.letGo.join(), 'false,true,true', 'a tap on a picked member lets it go and the card stays away'); same(r.reset, false, 'nobody picked: the next pick opens it');
        const t = rd('js/squadfly.js'); ok(/addEventListener\("pointerdown", partyFlyPressAway, true\)/.test(t), 'the press away is not heard'); ok(/closest\("\.sf-card"\)/.test(t) && /closest\("#squadBar"\)/.test(t) && /closest\("#unitInfo"\)/.test(t), 'a press on the card, the stack or the unit info counts as away');
    });
    check('the card\'s code: INDEX opens the unit info, DISMISS is the roster\'s REMOVE (the member holds the room it is in); it follows the card it is for and is hidden with the bar', () => {
        const t = rd('js/squadfly.js'); ok(/unitInfoOpen\(f\)/.test(t) && /partyRemove\(\[f\]\)/.test(t), 'the buttons'); ok(/data-act="index"/.test(t) && /data-act="dismiss"/.test(t), 'the markup'); ok(/getBoundingClientRect\(\)/.test(t), 'it is not placed beside its card');
        ok(/body\.placing #squadFly, body\.ccOpen #squadFly, body\.panel-open #squadFly/.test(rd('game.html')), 'it stays up over the Command Center'); ok(/<div id="squadFly"/.test(rd('game.html')) && /js\/squadfly\.js/.test(rd('game.html')), 'game.html');
        ok(/typeof partyFlyRender === "function"\) partyFlyRender\(\)/.test(rd('js/party.js')), 'the bar does not render it');
    });

    group('THE CARD (real browser)');
    for (const [w, h] of [[1180, 820], [820, 1180], [500, 800]]) {
        const r = measure(w, h);
        if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
        check(w + 'x' + h + ': the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); });
        if (!r || r.err) continue;
        const wide = w > 700;
        if (!wide) {
            check(w + ': a phone has no corners and no card: the bar and the tool are as they were (the WHO row, no ALL button), a tap on a card picks it and nothing opens beside it', () => {
                same(r.corners, false, 'hudCorners'); same(r.start.body, false, 'the corners class'); same(r.start.chips > 0, true, 'the WHO row'); same(r.start.all, false, 'an ALL button on a phone'); same(r.pick.fly, false, 'a card on a phone'); same(r.pick.sel, 1, 'the tap did not pick the member');
            });
            continue;
        }
        check(w + ': at the start nobody is picked: ALL is lit, the tool says how many follow, there is one scope button, no card; the body has the corners class', () => {
            same(r.corners, true, 'hudCorners'); same(r.start.body, true, 'the corners class'); same(r.start.fly, false, 'a card with nobody picked'); same(r.start.all, true, 'ALL is not lit'); same(r.start.to, '3 FOLLOWING', 'the caption'); same(r.start.who, 'all', 'the scope buttons'); same(r.start.chips, 0, 'element chips');
        });
        check(w + ': a tap on a card picks that member (the tool names them, ALL goes dark, the enemy strip says SELECTED) and their card opens beside the stack: picture, name, element · level · role, state / role / style / SQUAD, health, INDEX and DISMISS FROM SQUAD; its top lines up with the card and it lies clear of the tool, the dock and the stack', () => {
            same(r.pick.fly, true, 'no card'); same(r.pick.sel, 1, 'picked'); same(r.pick.all, false, 'ALL is lit'); same(r.pick.to, r.pick.label, 'the tool names the member'); same(r.pick.name, r.pick.label, 'the card\'s name'); ok(/LV 9/.test(r.pick.sub) && / · /.test(r.pick.sub), 'sub ' + r.pick.sub);
            ok(/FOLLOWING/.test(r.pick.tags) && /SQUAD/.test(r.pick.tags) && /BRAWL|MAGE|TECH/.test(r.pick.tags), 'tags ' + r.pick.tags); ok(/^\d+ \/ \d+$/.test(r.pick.hpn), 'health ' + r.pick.hpn); same(r.pick.thumb, true, 'a picture'); ok(/^#/.test(r.pick.col) || /rgb/.test(r.pick.col), 'colour ' + r.pick.col);
            same(r.pick.btns.length, 2, 'buttons'); ok(/^INDEX/.test(r.pick.btns[0]) && /^DISMISS FROM SQUAD/.test(r.pick.btns[1]), 'buttons ' + r.pick.btns);
            ok(r.pick.fr[0] >= r.pick.br[2], 'the card ' + r.pick.fr + ' is not beside the stack ' + r.pick.br); ok(Math.abs(r.pick.fr[1] - r.pick.sr[1]) <= 16, 'the card\'s top ' + r.pick.fr[1] + ' is not at its card\'s ' + r.pick.sr[1]); ok(r.pick.fr[3] <= r.pick.tr[1] + 40 || r.pick.fr[0] >= r.pick.tr[2], 'the card ' + r.pick.fr + ' lies over the tool ' + r.pick.tr);
            ok(r.pick.fr[2] <= w && r.pick.fr[3] <= h, 'the card is off the screen: ' + r.pick.fr);
        });
        check(w + ': the card has an XP row (a bar as long as the level is done, and the numbers) and says how far the member is from evolving: the levels and the XP to go, in the last level before it evolves lit; an evolved member says EVOLVED', () => {
            if (!wide) return; ok(r.xp, 'no xp probe');
            same(r.xp.l7.n, '85 / 169', 'level 7'); same(r.xp.l7.w, Math.round(85 / 169 * 100) + '%', 'the bar'); same(r.xp.l7.evo, 'EVOLVES AT LV 10 · 3 LEVELS · 572 XP TO GO', 'the evolution line'); same(r.xp.l7.soon, false, 'not yet in the last level');
            same(r.xp.l9.n, '100 / 271', 'level 9'); same(r.xp.l9.evo, 'EVOLVES AT LV 10 · 1 LEVEL · 171 XP TO GO', 'one level'); same(r.xp.l9.soon, true, 'lit in the last level before it evolves');
            same(r.xp.evolved.evo, 'EVOLVED', 'an evolved member'); same(r.xp.l5.n, '0 / 91', 'a recruit'); same(r.xp.l5.w, '0%', 'an empty bar'); same(r.xp.l5.evo, 'EVOLVES AT LV 10 · 5 LEVELS · 875 XP TO GO', 'five levels');
        });
        check(w + ': the card has the member\'s two equip card slots, CARD 1 and CARD 2: with no cards in the hand they say so and take no tap; with cards to hand each lists EMPTY and every card (the ones that do not fit disabled, saying why); a tap wears one (the row names it with its rarity chip, the list shuts, the card stays open, the member stays picked); the other slot refuses the same card; EMPTY takes it off', () => {
            if (!wide) return; ok(r.cards, 'no cards probe'); if (!r.cards) return;
            same(JSON.stringify(r.cards.off), JSON.stringify([['CARD 1', 'NO CARDS IN YOUR HAND', true, false], ['CARD 2', 'NO CARDS IN YOUR HAND', true, false]]), 'the rows with nothing in the hand'); same(r.cards.offList, 0, 'a list with nothing in the hand'); same(r.cards.offTap, 0, 'a tap on the empty-hand row opened a list');
            ok(r.cards.hand > 1, 'the test cards are not to hand: ' + r.cards.hand); same(JSON.stringify(r.cards.rows), JSON.stringify([['CARD 1', 'EMPTY', false, false], ['CARD 2', 'EMPTY', false, false]]), 'the rows with the cards to hand');
            same(r.cards.open, 1, 'one row open'); ok(r.cards.fits > 0 && r.cards.fits < r.cards.hand, 'the test needs a hand with cards that fit and cards that do not: ' + r.cards.fits + ' / ' + r.cards.hand); same(r.cards.list.length, r.cards.fits + 1, 'EMPTY and the cards in the hand that fit (since build 2026-11-07pp no other is shown)'); same(JSON.stringify(r.cards.list[0].slice(0, 2)), JSON.stringify(['EMPTY', true]), 'EMPTY first, and off while nothing is worn');
            ok(r.cards.fx.length > 1 && r.cards.fx.every(Boolean), 'a card in the list without its short text under its name: ' + JSON.stringify(r.cards.fx));   // (the owner, 2026-11-07: "see information about the cards when I'm equipping them", then "use shortened text")
            ok(r.cards.roster.opts.length > 1 && r.cards.roster.opts.every(Boolean), 'a card in the roster\'s card picker that does not fit, or without its card (art, name, its short text): ' + JSON.stringify(r.cards.roster.opts)); ok(/^CARD 1 · /.test(r.cards.roster.title), 'CARD 1 did not open the card picker: ' + r.cards.roster.title); ok(r.cards.roster.worn && r.cards.roster.worn === r.cards.roster.wornText, 'the card worn: its short text is not under its slot in the roster: ' + JSON.stringify(r.cards.roster));
            const fit = r.cards.list.find(o => o[0] === r.cards.pick), unfit = r.cards.list.filter(o => o[1] && o[0] !== 'EMPTY');
            ok(r.cards.pick && fit && !fit[1] && fit[3], 'no card that fits the member is offered with its chip (the first that fits: ' + r.cards.pick + '): ' + JSON.stringify(fit)); same(unfit.length, 0, 'a card in the list is off (a card that does not fit is shown): ' + JSON.stringify(unfit.slice(0, 3)));
            ok(r.cards.worn[0] && r.cards.pickId && r.cards.worn[0][0] === r.cards.pickId, 'the tap did not wear it: ' + JSON.stringify(r.cards.worn[0]) + ' / ' + r.cards.pickId); same(r.cards.worn[1], 0, 'the list stayed open'); same(JSON.stringify(r.cards.worn[2]), JSON.stringify(['CARD 1', r.cards.pick, false, true]), 'the row does not name the worn card with its chip'); same(r.cards.worn[3], true, 'the card closed'); same(r.cards.worn[4], true, 'the member was let go');
            same(r.cards.second[0], 1, 'CARD 2 did not open its list'); same(r.cards.second[1], 1, 'open rows'); same(r.cards.second[2], 0, 'CARD 2 shows the card CARD 1 wears');
            ok(!(r.cards.off2[0] && r.cards.off2[0][0]), 'EMPTY did not take the card off: ' + JSON.stringify(r.cards.off2[0])); same(r.cards.off2[1], 'EMPTY', 'the row after EMPTY'); same(r.cards.off2[2], 0, 'the list after EMPTY');
            same(JSON.stringify(r.cards.back), JSON.stringify(['CARD 1', 'NO CARDS IN YOUR HAND', true, false]), 'the row with the hand empty again');
        });
        check(w + ': a press on the card keeps it; a press anywhere else puts it away and the member stays picked (its card on the stack lit, the tool still names it), also after a tick; a tap on it then lets it go, and the next tap picks it and opens its card; a press on the unit info is not one away', () => {
            same(r.index.back, true, 'closing the unit info did not bring the card back'); same(r.away.onCard, true, 'a press on the card put it away');
            same(r.away.fly, false, 'the card stayed after a press away'); same(r.away.sel, 1, 'the press away let the member go'); same(r.away.lit, true, 'its card on the stack is not lit'); same(r.away.to, r.away.label, 'the tool does not name it'); same(r.away.tick, false, 'a tick brought the card back');
            same(r.away.letGo.join(), '0,false', 'a tap on the picked member'); same(r.away.again[0], 1, 'the next tap did not pick it'); same(r.away.again[1], true, 'the next tap did not open its card'); same(r.away.again[2], r.away.label, 'the card is not its');
        });
        check(w + ': INDEX opens the unit\'s info; a second member picked makes THEIR card the open one and the tool says 2 SELECTED; letting that one go gives the card back to the first; ALL lets everyone go and the card closes', () => {
            same(r.index.open, true, 'INDEX opened nothing'); ok(/./.test(r.index.title || ''), 'its title'); same(r.two.fly, true, 'card'); same(r.two.sel, 2, 'two picked'); same(r.two.name, r.two.label1, 'the last tapped'); same(r.two.to, '2 SELECTED', 'the caption');
            same(r.back.fly, true, 'the card closed with one still picked'); same(r.back.sel, 1, 'one picked'); same(r.back.name, r.back.label0, 'the card went back to the first');
            same(r.all.fly, false, 'the card stays after ALL'); same(r.all.sel, 0, 'ALL left a selection'); same(r.all.on, true, 'ALL is not lit'); same(r.all.to, '3 FOLLOWING', 'the caption'); same(r.all.mode, 'all', 'the scope');
        });
        check(w + ': DISMISS FROM SQUAD takes the member out of the squad (it holds the room it is in), closes the card, leaves the selection empty, and its slot on the stack is open and says + CALL <it>; HOLD on a picked member closes its card too', () => {
            same(r.dismiss.before, 3, 'the squad'); same(r.dismiss.after, 2, 'DISMISS left them in the squad'); same(r.dismiss.member, false, 'still a member'); same(r.dismiss.post, r.dismiss.room, 'the room it holds'); same(r.dismiss.fly, false, 'the card stays'); same(r.dismiss.sel, 0, 'selection'); same(r.dismiss.to, '2 FOLLOWING', 'the caption');
            same(r.dismiss.slotEmpty, true, 'its slot is not open'); ok(/^\+ CALL /.test(r.dismiss.open || ''), 'the open slot says ' + r.dismiss.open); ok(r.dismiss.said.some(t => /REMOVED FROM THE SQUAD/.test(t)), 'said ' + r.dismiss.said);
            same(r.hold.fly0, true, 'the card opened for the next pick'); same(r.hold.fly1, false, 'HOLD left the card open for a member that has left the squad');
        });
        check(w + ': the tool is one slab of the height game.html reserves for the stack above it (--cn-tool), and with a creature locked the enemy strip says who goes: EVERYONE, or SELECTED for a picked member', () => {
            same(r.tool.h, parseInt(r.tool.css, 10), 'the tool is ' + r.tool.h + ' px high, the css says ' + r.tool.css); ok(/ATTACK · EVERYONE \d/.test(r.foe0 || ''), 'no one picked: ' + r.foe0); same(r.foe1, 'ATTACK · SELECTED 1', 'one picked');
        });
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
