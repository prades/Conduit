// EQUIP NOW (build 2026-11-07rr; js/cards.js equipNowPut, js/cardsui.js equipNowOpen). ASKED: "there needs to be an equip now feature that whenever you open up a new pack or whenever you're looking through your
// collection, you can select equip now and it pulls up a sliding roster menu where you can select the follower that you want to equip the card to, and it shows the creatures that have two cards that you are able
// to replace the card with, and it shows a new feature that allows you to switch the cards from that menu as well."
//   THE RULES   the slot's own rules decide; a card kept for good that is not in the hand goes into it as it goes on (while the hand has room); a slot holding another card SWITCHES (that card comes off, still yours);
//               nothing changes when it cannot go on; a Player card goes on you, a card attack in a SPECIAL ATTACK slot
//   THE SCREEN  in the real page: EQUIP NOW under the card on the collection's stage and under each card of a pack's reveal; the pop-out lists only the followers the card fits, each with its slots (EQUIP HERE,
//               SWITCH, WORN ✓, or why not); it stays open after a card goes on and says what changed; Escape closes it first (then the reveal, then the sheet); the reveal under it is never drawn again
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
async function check(name, fn) { try { await fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

async function boot(search) {
    const sb = makeBrowserSandbox({}); sb.location.search = search || '';
    sb.console = Object.assign({}, console, { error: (...a) => { if (!/the cards screen could not open/.test(String(a[0]))) console.error(...a); } });
    const ctx = vm.createContext(sb);
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) { /* the page's own boot check says */ } }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    vm.runInContext(`gameState.running = true; facilityBlackoutSet(false);
        globalThis.__mk = (el, role, form) => { spawnFollowerAtCrystal(el, role); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.role = role; if (form) { f.evolved = form; f.element = EVOLUTIONS[form].element; f.role = EVOLUTIONS[form].role; } return f; };`, ctx);
    return { run: s => vm.runInContext(s, ctx), J: s => JSON.parse(vm.runInContext('JSON.stringify(' + s + ')', ctx)) };
}

function findChromium() {
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    return null;
}
// THE REAL PAGE (?cards, with four test cards kept for good): the collection's EQUIP NOW, the pop-out, a SWITCH, the hand, a Player card, and a pack's reveal
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var click = function(el){ if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, esc = function(){ window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); };
  var still = document.createElement('style'); still.textContent = '#cardsRoot *, #cardEquip * { animation: none !important; transition: none !important; scroll-behavior: auto !important; }'; document.head.appendChild(still);
  var miniOf = function(name){ return $$('#cardsRoot .cd-rail .cd-mini').filter(function(m){ return m.querySelector('.cd-mn').textContent === name; })[0]; };
  var stageBtns = function(){ return $$('#cardsRoot .cd-info .cd-btn').map(function(b){ return [b.querySelector('.cd-bl').textContent, (b.querySelector('.cd-bs') || {}).textContent || '', b.disabled]; }); };
  var eqBtn = function(){ return $$('#cardsRoot .cd-info .cd-btn').filter(function(b){ return b.querySelector('.cd-bl').textContent === 'EQUIP NOW'; })[0]; };
  var tiles = function(){ return $$('#cardEquip .ce-tile'); }, slotsOf = function(t){ return Array.prototype.slice.call(t.querySelectorAll('.ce-slot')).map(function(s){ return [s.querySelector('.ce-sk').textContent, s.querySelector('.ce-do').textContent, s.disabled, s.className.replace('ce-slot ', '')]; }); };
  try {
    gameState.running = true; facilityBlackoutSet(false); if (typeof classPickerClose === 'function') classPickerClose(); classPickerOpen = false;
    if (cardsPanelOpen) cardsClose();
    shardCount = 2500; for (var i = followers.length; i < 3; i++) recruitFollower(); for (var k = 0; k < followers.length; k++) { followers[k].returningToCrystal = false; followers[k].element = 'toxic'; followers[k].evolved = undefined; followers[k].cards = undefined; } partyTick();
    var f1 = followers[0], f2 = followers[1]; f1.evolved = 'quillstone'; f1.element = 'fire'; f1.role = 'brawler'; f2.evolved = undefined; f2.element = 'fire'; f2.role = 'brawler';
    equipHand = []; equipHandAdd('test_brawler'); equipHandAdd('test_crustacean'); f1.cards = ['test_brawler', 'test_crustacean'];
    out.f1 = equipSlots(f1); out.hand0 = equipHand.slice();
    cardsOpen(); await wait(150); click(miniOf('TEST · FIRE')); await wait(60);
    out.stage = stageBtns();
    var fire = equipCard('test_fire'), who = _ceWho(fire);
    click(eqBtn()); await wait(80);
    out.pop = { open: $('#cardEquip').classList.contains('open'), title: $('#cardEquip .cp-title').textContent, n: tiles().length, expect: who.length, sheet: $('#cardsRoot').classList.contains('open'),
      fits: who.every(function(f){ return !equipFit(f, fire); }), others: followers.filter(function(f){ return f.element === 'toxic' && !f.dead; }).length, note: $('#cardEquip .cp-note').textContent };
    var t1 = function(){ return tiles()[_ceWho(fire).indexOf(f1)]; }, t2 = function(){ return tiles()[_ceWho(fire).indexOf(f2)]; };
    out.s1 = slotsOf(t1()); out.s2 = slotsOf(t2()); out.full1 = Array.prototype.slice.call(t1().querySelectorAll('.ce-slot .cd-mini .cd-mn')).map(function(e){ return e.textContent; });
    out.name2 = t2().querySelector('.ce-nm').textContent;
    click(t2().querySelectorAll('.ce-slot')[0]); await wait(60);
    out.put = { f2: equipSlots(f2), inHand: equipInHand('test_fire'), still: $('#cardEquip').classList.contains('open'), s2: slotsOf(t2()), note: $('#cardEquip .cp-note').textContent, said: $('#cardEquip .cp-note').classList.contains('said') };
    click(t1().querySelectorAll('.ce-slot')[1]); await wait(60);
    out.sw = { f1: equipSlots(f1), crustHand: equipInHand('test_crustacean'), crustWorn: equipWearers('test_crustacean'), s1: slotsOf(t1()), note: $('#cardEquip .cp-note').textContent };
    esc(); await wait(60); out.esc1 = { pop: $('#cardEquip').classList.contains('open'), sheet: $('#cardsRoot').classList.contains('open') };
    await wait(450); out.stage2 = stageBtns(); out.sel = _cdSel;
    // the hand is full (three): a card kept for good and not in it cannot go on from here; a Player card goes on you once there is room
    out.full = equipHand.length; click(miniOf('TEST · PLAYER A')); await wait(60); out.pFull = stageBtns();
    equipHandRemove('test_crustacean'); cardsRender(true); await wait(60); click(miniOf('TEST · PLAYER A')); await wait(60); click(eqBtn()); await wait(80);
    out.you = { n: tiles().length, name: tiles()[0] ? tiles()[0].querySelector('.ce-nm').textContent : '', slots: tiles()[0] ? slotsOf(tiles()[0]) : [] };
    click(tiles()[0].querySelectorAll('.ce-slot')[0]); await wait(60); out.you.after = equipPlayer.slice(); out.you.hand = equipInHand('test_player_a');
    click($('#cardEquip .cp-x')); await wait(60); out.xClosed = !$('#cardEquip').classList.contains('open');
    // A PACK'S REVEAL: EQUIP NOW under each card; the pop-out over it; the reveal is not drawn again; Escape closes the pop-out, then the reveal
    equipFound.push('test_ice'); _cdReveal = { pack: EQUIP_PACK.id, ids: ['test_fire', 'test_ice', 'test_mage'], fresh: ['test_ice'] }; cardsRender(true); await wait(80);
    var ov = $('#cardsRoot .cr-overlay'); ov.__mark = 1;
    out.rv = { btns: $$('#cardsRoot .cr-slot').map(function(s){ var b = s.querySelector('.cr-eq'); return [s.getAttribute('data-id'), b ? b.textContent : null, b ? b.disabled : null]; }) };
    click($$('#cardsRoot .cr-slot')[1].querySelector('.cr-eq')); await wait(80);
    out.rv.pop = $('#cardEquip').classList.contains('open') ? $('#cardEquip .cp-title').textContent : ''; out.rv.revealUp = cardsRevealOpen();
    out.rv.none = ($('#cardEquip .ce-none') || {}).textContent || '';
    await wait(500); out.rv.same = $('#cardsRoot .cr-overlay') === ov && ov.__mark === 1;
    var z = function(s){ return Number(getComputedStyle($(s)).zIndex) || 0; }; out.rv.above = z('#cardEquip') > z('#cardsRoot');
    esc(); await wait(60); out.rv.esc1 = [$('#cardEquip').classList.contains('open'), cardsRevealOpen(), cardsPanelOpen];
    esc(); await wait(60); out.rv.esc2 = [cardsRevealOpen(), cardsPanelOpen];
    // AN ENERGY CARD'S EQUIP NOW (build 2026-11-10d; the owner: "You also need to be able to equip energy cards from the packs after you pull them"): under each energy card of a reveal; the pop-out lists every
    // follower with its energy slots; EQUIP HERE puts one in from your stock; the reveal's count and button are brought up to date where they are (it is not drawn again)
    energyStock = {}; energyAdd('ice', 1); f2.evolved = undefined; f2.energy = [null]; f2.element = 'none'; f1.energy = [null, null, null];
    _cdReveal = { pack: EQUIP_PACK.id, ids: [], fresh: [], energy: ['ice'] }; cardsRender(true); await wait(80);
    var eov = $('#cardsRoot .cr-overlay'); eov.__mark = 2; var esl = $('#cardsRoot .cr-slot[data-id="energy:ice"]');
    out.en = { tag: esl.querySelector('.cr-tag') ? esl.querySelector('.cr-tag').textContent : '', btn: [esl.querySelector('.cr-eq').textContent, esl.querySelector('.cr-eq').disabled] };
    click(esl.querySelector('.cr-eq')); await wait(80);
    var ice = energyCardOf('ice'), et = function(f){ return tiles()[_ceWho(ice).indexOf(f)]; };
    out.en.pop = { title: $('#cardEquip .cp-title').textContent, n: tiles().length, all: followers.filter(function(f){ return !f.dead && f.isFollower === true && !f.isClone && f.team === 'green'; }).length, s1: slotsOf(et(f1)), s2: slotsOf(et(f2)) };
    click(et(f2).querySelectorAll('.ce-slot')[0]); await wait(60);
    out.en.put = { slots: energySlots(f2).join(), el: f2.element, stock: energyCount('ice'), s2: slotsOf(et(f2)), s1: slotsOf(et(f1)), note: $('#cardEquip .cp-note').textContent, tag: esl.querySelector('.cr-tag') ? esl.querySelector('.cr-tag').textContent : '',
      btn: [esl.querySelector('.cr-eq').disabled, (esl.querySelector('.cr-eq .cd-bs') || {}).textContent || ''], same: $('#cardsRoot .cr-overlay') === eov && eov.__mark === 2 };
    esc(); await wait(60); esc(); await wait(60);
    cardsClose();
  } catch (err) { out.err = String(err && err.stack || err); }
  var pre = document.createElement('pre'); pre.id = '__en'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2500); });</script></body>`;
function measure(w, h, query, seed) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'en-')), file = path.join(dir, 'game.html');
    const pre = seed ? '<script>try { ' + Object.keys(seed).map(k => 'localStorage.setItem(' + JSON.stringify(k) + ', ' + JSON.stringify(seed[k]) + ');').join(' ') + ' } catch (e) {}</script>' : '';
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">' + pre).replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=60000', '--dump-dom', 'file://' + file + query], { encoding: 'utf8', timeout: 120000, maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = e.stdout || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__en">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const { run, J } = await boot('?cards');
    group('1. THE RULES (js/cards.js equipNowPut)');
    await check('a card kept for good and not in the hand can go on while the hand has room (it goes into the hand as it goes on); the plain rules still ask for the hand', () => {
        const r = J(`(function(){ followers.length = 0; equipHand = []; equipFound = []; equipPlayer = [null, null]; equipOwnedSet().add('test_fire'); equipOwnedSet().add('test_ice'); equipOwnedSet().add('test_brawler'); equipOwnedSet().add('test_mage');
            const f = __mk('fire', 'brawler'), a = { takes: equipNowTakes('test_fire'), now: equipNowWhyNot(f, 0, 'test_fire'), plain: equipWhyNot(f, 'test_fire', 0), notMine: equipNowTakes('test_drone'), notMineWhy: equipNowWhyNot(f, 0, 'test_drone') };
            a.put = equipNowPut(f, 0, 'test_fire'); a.slots = equipSlots(f); a.hand = equipHand.slice(); a.takesAfter = equipNowTakes('test_fire');
            equipHandAdd('test_ice'); equipHandAdd('test_mage'); a.handFull = equipHand.length; a.fullTakes = equipNowTakes('test_brawler'); a.fullWhy = equipNowWhyNot(f, 1, 'test_brawler'); a.fullPut = equipNowPut(f, 1, 'test_brawler'); a.slots2 = equipSlots(f); a.hand2 = equipHand.slice();
            return a; })()`);
        same(r.takes, true, 'it would be taken'); same(r.now, null, 'EQUIP NOW\'s answer'); same(r.plain, 'NOT IN YOUR HAND', 'the plain rule changed'); same(r.notMine, false, 'a card not yours'); same(r.notMineWhy, 'NOT IN YOUR HAND', 'a card not yours');
        same(r.put, true, 'it went on'); same(r.slots.join(), 'test_fire,', 'the slots'); same(r.hand.join(), 'test_fire', 'it went into the hand'); same(r.takesAfter, false, 'taken again');
        same(r.handFull, 3, 'the hand'); same(r.fullTakes, false, 'a full hand takes it'); same(r.fullWhy, 'NOT IN YOUR HAND', 'a full hand'); same(r.fullPut, false, 'it went on'); same(r.slots2.join(), 'test_fire,', 'the slots changed'); same(r.hand2.length, 3, 'the hand changed');
    });
    await check('SWITCH: on a follower with two cards, the card goes in place of the one in that slot, which comes off and stays in the hand; the same card twice, or one that does not fit, changes nothing', () => {
        const r = J(`(function(){ followers.length = 0; equipHand = []; equipFound = []; equipDevSet('on'); ['test_fire', 'test_brawler', 'test_crustacean'].forEach(id => { equipOwnedSet().add(id); equipHandAdd(id); }); equipFound.push('test_ice');
            const f = __mk('fire', 'brawler', 'quillstone'); equipPut(f, 0, 'test_fire'); equipPut(f, 1, 'test_brawler'); const a = { before: equipSlots(f) };
            a.why = equipNowWhyNot(f, 1, 'test_crustacean'); a.put = equipNowPut(f, 1, 'test_crustacean'); a.after = equipSlots(f); a.offInHand = equipInHand('test_brawler'); a.offWorn = equipWearers('test_brawler');
            a.twice = equipNowWhyNot(f, 0, 'test_crustacean'); a.twicePut = equipNowPut(f, 0, 'test_crustacean'); a.ice = equipNowWhyNot(f, 0, 'test_ice'); a.end = equipSlots(f); return a; })()`);
        same(r.before.join(), 'test_fire,test_brawler', 'set up'); same(r.why, null, 'the switch is refused'); same(r.put, true, 'the switch'); same(r.after.join(), 'test_fire,test_crustacean', 'after the switch');
        same(r.offInHand, true, 'the card switched off left the hand'); same(r.offWorn, 0, 'the card switched off is still worn');
        same(r.twice, 'ALREADY ON ITS OTHER SLOT', 'the same card twice'); same(r.twicePut, false, 'put twice'); ok(/^FOR ICE/.test(r.ice), 'a card that does not fit: ' + r.ice); same(r.end.join(), 'test_fire,test_crustacean', 'the slots at the end');
    });
    await check('a Player card goes on you ("you", YOUR SLOT 1 or 2); a card attack goes in the SPECIAL ATTACK slot of a follower of its form', () => {
        const r = J(`(function(){ followers.length = 0; equipHand = []; equipFound = []; equipPlayer = [null, null]; equipOwnedSet().add('test_player_a'); const a = { you: equipNowPut('you', 1, 'test_player_a'), slots: equipPlayer.slice(), hand: equipInHand('test_player_a') };
            const sp = Object.values(EQUIP_CARDS).filter(c => c.attack && c.kind === 'form')[0]; equipFound.push(sp.id);
            const f = __mk('fire', 'brawler', sp.match); a.sp = sp.id; a.spWhy = equipNowWhyNot(f, 'special', sp.id); a.spPut = equipNowPut(f, 'special', sp.id); a.special = f.special || null; a.inCard = equipNowWhyNot(f, 0, sp.id); return a; })()`);
        same(r.you, true, 'onto you'); same(r.slots.join(), ',test_player_a', 'your slots'); same(r.hand, true, 'into the hand'); same(r.spWhy, null, 'the special attack'); same(r.spPut, true, 'put on'); same(r.special, r.sp, 'its special attack');
        same(r.inCard, 'A SPECIAL ATTACK · ITS OWN MENU', 'a card attack in CARD 1');
    });
    await check('the code: the rules are js/cards.js\'s (the screen asks equipNowWhyNot and puts with equipNowPut); the page has the pop-out\'s styles', () => {
        const ui = rd('js/cardsui.js'), css = rd('game.html');
        ok(/equipNowPut\(you \? "you" : who, slot, c\.id\)/.test(ui) && /equipNowWhyNot\(you \? "you" : who, slot, c\.id\)/.test(ui), 'the pop-out does not use the rules');
        ok(!/equipPut\(|equipPlayerPut\(|equipSpecialPut\(/.test(ui.slice(ui.indexOf('// ── EQUIP NOW'), ui.indexOf('// ── YOU, ON THE ROSTER'))), 'the pop-out puts a card on by itself');
        ok(/#cardEquip \.ce-tile \{/.test(css) && /:is\(#cardPick, #cardEquip\) \.cp-box \{/.test(css) && /:is\(#cardsRoot, #ccRoot, #cardEquip\) \.cd-mini \{/.test(css), 'the styles');
    });

    group('2. THE SCREEN (real browser)');
    const T = measure(1180, 820, '?cards', { conduit_fp_cards: JSON.stringify({ v: 1, owned: ['test_fire', 'test_brawler', 'test_crustacean', 'test_player_a'] }) });
    if (T === null) console.log('  (no Chromium here: skipped)');
    else {
        await check('the probe ran', () => { ok(T, 'the probe produced nothing'); same(T.err, undefined, 'the probe threw'); same(T.f1.join(), 'test_brawler,test_crustacean', 'set up'); });
        if (T && !T.err) {
            await check('the collection: EQUIP NOW under TAKE INTO THE RUN; a card kept for good and not in the hand says it goes into the hand', () => {
                same(JSON.stringify(T.stage), JSON.stringify([['TAKE INTO THE RUN', '', false], ['EQUIP NOW', 'PICK WHO WEARS IT · IT GOES INTO YOUR HAND', false]]), 'the stage\'s buttons');
            });
            await check('the pop-out: over the sheet, titled with the card, only the followers it fits (the toxic ones are not shown), each with its slots: SWITCH on the full one, EQUIP HERE on the empty one', () => {
                same(T.pop.open, true, 'open'); same(T.pop.sheet, true, 'the sheet closed'); same(T.pop.title, 'EQUIP NOW · TEST · FIRE', 'the title'); same(T.pop.n, T.pop.expect, 'the tiles'); same(T.pop.fits, true, 'a tile it does not fit'); ok(T.pop.n >= 2 && T.pop.others >= 1, 'the set-up: ' + T.pop.n + ' / ' + T.pop.others);
                same(JSON.stringify(T.s1), JSON.stringify([['CARD 1', 'SWITCH ⇄', false, 'full'], ['CARD 2', 'SWITCH ⇄', false, 'full']]), 'the full follower\'s slots'); same(T.full1.join(), 'TEST · BRAWLER,TEST · SPINE-LEGGED', 'the cards it wears, as mini cards');
                same(JSON.stringify(T.s2), JSON.stringify([['CARD 1', 'EQUIP HERE', false, 'open'], ['CARD 2', 'EQUIP HERE', false, 'open']]), 'the empty follower\'s slots'); ok(/^TAP A SLOT/.test(T.pop.note) && /GOES INTO YOUR HAND/.test(T.pop.note), 'the note: ' + T.pop.note);
            });
            await check('EQUIP HERE puts it on (into the hand first); the pop-out stays open, says so, and the slot reads WORN ✓ (the other: ALREADY ON ITS OTHER SLOT)', () => {
                same(T.put.f2.join(), 'test_fire,', 'the slots'); same(T.put.inHand, true, 'the hand'); same(T.put.still, true, 'it closed');
                same(JSON.stringify(T.put.s2), JSON.stringify([['CARD 1', 'WORN ✓', true, 'worn'], ['CARD 2', 'ALREADY ON ITS OTHER SLOT', true, 'off']]), 'the slots after'); same(T.put.note, 'TEST · FIRE ON · ' + T.name2 + ' · CARD 1', 'what it says'); same(T.put.said, true, 'the note lit');
            });
            await check('SWITCH puts it in place of the card in that slot: that card comes off and stays in the hand', () => {
                same(T.sw.f1.join(), 'test_brawler,test_fire', 'the slots'); same(T.sw.crustHand, true, 'the card switched off'); same(T.sw.crustWorn, 0, 'still worn'); ok(/^TEST · SPINE-LEGGED OFF · TEST · FIRE ON · /.test(T.sw.note), 'what it says: ' + T.sw.note);
                same(T.sw.s1[1][1], 'WORN ✓', 'the slot after'); same(T.sw.s1[0][1], 'ALREADY ON ITS OTHER SLOT', 'the other slot');
            });
            await check('Escape closes the pop-out and leaves the sheet; the stage says who wears it now', () => {
                same(JSON.stringify(T.esc1), JSON.stringify({ pop: false, sheet: true }), 'after Escape'); same(T.stage2[0][0], 'IN YOUR HAND ✓', 'the hand button'); same(T.sel, 'test_fire', 'the card on the stage changed (a rail drawn again picked another)'); same(T.stage2[1][1], 'WORN BY 2 · PUT IT ON ANOTHER', 'EQUIP NOW\'s line');
            });
            await check('a full hand: a card kept for good and not in it cannot be put on from here; a Player card goes on YOU (one tile, two slots)', () => {
                same(T.full, 3, 'the hand'); same(JSON.stringify(T.pFull[1]), JSON.stringify(['EQUIP NOW', 'YOUR HAND IS FULL (3)', true]), 'EQUIP NOW with a full hand');
                same(T.you.n, 1, 'the tiles'); same(T.you.name, 'YOU', 'the tile'); same(T.you.slots.map(s => s[0] + ':' + s[1]).join('|'), 'YOUR SLOT 1:EQUIP HERE|YOUR SLOT 2:EQUIP HERE', 'your slots');
                same(T.you.after.join(), 'test_player_a,', 'your slots after'); same(T.you.hand, true, 'into the hand'); same(T.xClosed, true, '✕');
            });
            await check('A PACK\'S REVEAL: EQUIP NOW under each card (off for a card not yours); it opens over the reveal, which is not drawn again; Escape closes the pop-out, then the reveal, then the sheet', () => {
                same(JSON.stringify(T.rv.btns), JSON.stringify([['test_fire', 'EQUIP NOW', false], ['test_ice', 'EQUIP NOW', false], ['test_mage', 'EQUIP NOWNOT YOURS YET', true]]), 'the buttons');
                same(T.rv.pop, 'EQUIP NOW · TEST · ICE', 'the pop-out'); same(T.rv.revealUp, true, 'the reveal closed'); same(T.rv.none, 'NONE OF YOUR FOLLOWERS FITS IT · FOR ICE FOLLOWERS', 'no ice follower is left');
                same(T.rv.same, true, 'the reveal was drawn again'); same(T.rv.above, true, 'the pop-out is under the sheet');
                same(T.rv.esc1.join(), 'false,true,true', 'the first Escape'); same(T.rv.esc2.join(), 'false,true', 'the second Escape');
            });
            await check('AN ENERGY CARD (build 2026-11-10d): EQUIP NOW under it in a pack\'s reveal; the pop-out lists every follower with its energy slots (an egg ENERGY, an evolved one ENERGY 1 to 3); EQUIP HERE puts it in from your stock, the slot reads IN IT ✓, the others say none is left, and the reveal\'s count and button follow where they are', () => {
                same(T.en.tag, '', 'the reveal\'s tag (none under an energy card since build 2026-11-13o: EQUIP NOW alone)'); same(T.en.btn.join(), 'EQUIP NOW,false', 'its button');
                same(T.en.pop.title, 'EQUIP NOW · ICE ENERGY', 'the pop-out'); same(T.en.pop.n, T.en.pop.all, 'every follower is listed');
                same(JSON.stringify(T.en.pop.s2), JSON.stringify([['ENERGY', 'EQUIP HERE', false, 'open']]), 'the egg\'s one slot'); same(JSON.stringify(T.en.pop.s1), JSON.stringify([1, 2, 3].map(i => ['ENERGY ' + i, 'EQUIP HERE', false, 'open'])), 'the evolved one\'s three');
                same([T.en.put.slots, T.en.put.el, T.en.put.stock].join(), 'ice,ice,0', 'it went in from the stock, and the egg is ICE'); same(JSON.stringify(T.en.put.s2), JSON.stringify([['ENERGY', 'IN IT ✓', true, 'worn']]), 'its slot after');
                ok(T.en.put.s1.every(s => s[1] === 'NO ICE ENERGY CARD' && s[2] === true), 'the others after: ' + JSON.stringify(T.en.put.s1)); ok(/ICE ENERGY IN · .* · ENERGY · ITS ELEMENT/.test(T.en.put.note), 'it says what changed: ' + T.en.put.note);
                same(T.en.put.tag, '', 'no count under it (build 2026-11-13o)'); same(T.en.put.btn.join(), 'true,NONE LEFT · ALL IN SLOTS', 'the reveal\'s button'); same(T.en.put.same, true, 'the reveal was drawn again');
            });
        }
    }
    console.log(failures ? `\n${failures} failing` : '\nall passing'); process.exit(failures ? 1 : 0);
})();
