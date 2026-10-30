// THE MARKET: CREDITS AND THE SHELF (js/cards.js EQUIP_MARKET, equipPackOpen's duplicates, equipShelf*, equipMarket*; js/cardsui.js _cdMarketBox).
// ASKED (the owner's answers, 2026-10-30): a card a pack deals that you already have goes "into a special buy menu: credits that you use to buy the permanent cards, and a rotating buy menu that refreshes every 5 minutes; cards go from 90 to 650
// credits; duplicates cannot be found there; the credits from a duplicate are 25% of the card's market value; you can also buy the cards with actual shards too". Chosen with the owner in the same round: credits belong to the run; the shelf shows six
// cards and never a card in the hand or found this run; the Crystalline six are not sold; shards pay the same number as credits; a duplicate is a card in the hand or already found this run (a card owned for good but not brought is found, no
// credits); buying a card new to you keeps it for good and finds it, buying one you own for good finds it; the flat ◆1,000 unlock of a found card stays; the 5 minutes are the game's own clock.
//   THE NUMBERS   90 / 150 / 250 / 350 / 500 / 650 by rarity, 25%, six on the shelf, 18,000 frames
//   DUPLICATES    what pays credits and what does not; the sums; the pack still costs ◆100
//   THE SHELF     six different cards of Pack 1 that you do not have; a new one when the time is up, not before; a card found or taken into the hand leaves it; fewer when few are left
//   BUYING        credits or the same number of shards; a new card is kept for good and found, an owned one is found; what cannot be bought; the ◆1,000 unlock stays
//   SAVING        the credits and the shelf (with the time left) survive saving and loading; an old save loads; NEW GAME clears them
//   THE SCREENS   (real browser) the credits in the header, the shelf with two prices on each card, two taps to buy, the duplicate's tag, the clock read in place, no page error
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
const sameJ = (a, b, m) => same(JSON.stringify(a), JSON.stringify(b), m);
const near = (a, b, m, eps) => { if (!(Math.abs(a - b) <= (eps === undefined ? 1e-9 : eps))) throw new Error(`${m}: expected ${b}, got ${a}`); };

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
async function boot(search, store) {
    const errs = [], sb = makeBrowserSandbox(store || {}); sb.location.search = search || '';
    sb.console = Object.assign({}, console, { error: (...a) => { if (!/the cards screen could not open/.test(String(a[0]))) errs.push(a.map(String).join(' ')); } });
    const ctx = vm.createContext(sb);
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) { /* the page's own boot check says */ } }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    vm.runInContext(`gameState.running = true; facilityBlackoutSet(false); alertActive = false; canvas.width = 1280; canvas.height = 860;
        globalThis.__fresh = n => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; respawnQueue.length = 0; selectedUnits.clear(); floatingTexts.length = 0; shardCount = 5000;
            for (let i = 0; i < n; i++) recruitFollower(); for (const f of followers) { f.returningToCrystal = false; f.spawnProtection = 1e9; } partyTick(); return followers.slice(); };
        globalThis.__mk = (el, role) => { spawnFollowerAtCrystal(el, role); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.role = role; return f; };
        globalThis.__lv = (f, L) => { f.level = L; f.xp = xpForLevel(L); _applyFollowerLevel(f, true); return f; };
        globalThis.__prep = (el, role, L) => { const f = __mk(el, role || 'brawler'); delete f.evolved; f.perk = null; f.combatTrait = null; f.naturalTrait = null; return __lv(f, L || 12); };
        // a pack that deals the cards given (the roll is staged; the opening, the price and the duplicates are the game's)
        globalThis.__deal = ids => { const orig = equipPackRoll; equipPackRoll = () => ids.slice(); try { return equipPackOpen(); } finally { equipPackRoll = orig; } };
        globalThis.__at = f => { frame = f; };`, ctx);
    return { ctx, errs, run: s => vm.runInContext(s, ctx), J: s => JSON.parse(vm.runInContext('JSON.stringify(' + s + ')', ctx)) };
}

// The real page, a tablet: two duplicates and two new cards from a staged pack, the sheet opened, a card bought with credits and one with shards (two taps each), an owned card bought, the prices when poor, the sheet opened and closed again and again.
// (The game is held still before the prices are paid, so that no shard is earned and no frame passes between a tap and its reading.)
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = { errors: [] }, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var click = function(el){ if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  window.addEventListener('error', function(e){ out.errors.push(String(e.message)); }); var ce = console.error; console.error = function(){ out.errors.push(Array.prototype.slice.call(arguments).join(' ')); ce.apply(console, arguments); };
  try {
    gameState.running = true; facilityBlackoutSet(false); if (typeof classPickerClose === 'function') classPickerClose(); classPickerOpen = false; await wait(100);
    out.firstShelf = equipShelf.ids.length; out.firstLeft = equipShelf.until - frame;   // (dealt by the game itself, in its first half-second)
    gameState.running = false;
    var added = [], oa = EventTarget.prototype.addEventListener; EventTarget.prototype.addEventListener = function(t, fn, o){ if (this === window || this === document || this === document.body || this === document.documentElement) added.push(t); return oa.call(this, t, fn, o); };
    var slabs = function(){ return $$('#cardsRoot .cd-market .cd-card'); }, nameOf = function(s){ return s.querySelector('.cd-name').textContent; };
    var byName = function(n){ return Object.values(equipCards()).filter(function(c){ return c.name === n; })[0]; };
    var slab = function(c){ return slabs().filter(function(s){ return nameOf(s) === c.name; })[0]; };
    var btn = function(c, re){ var s = slab(c); return s && Array.prototype.slice.call(s.querySelectorAll('.cd-btn')).filter(function(b){ return re.test(b.querySelector('.cd-bl').textContent); })[0]; };
    var btns = function(s){ return Array.prototype.slice.call(s.querySelectorAll('.cd-btn')).map(function(b){ return { label: b.querySelector('.cd-bl').textContent, sub: b.querySelector('.cd-bs').textContent, off: b.disabled }; }); };

    shardCount = 1500; equipHand = []; equipFound = ['ember_plating', 'venom_gland']; equipCredits = 0;
    var orig = equipPackRoll; equipPackRoll = function(){ return ['ember_plating', 'venom_gland', 'flux_cell', 'siphon_field']; }; equipPackOpen(); equipPackRoll = orig;   // two duplicates (already found), two new
    equipShelfDeal(1); equipShelf.until = frame + 7260;   // the shelf after the pack: six cards, none of them found; 121 seconds to run
    cardsOpen(); await wait(150);
    out.credits = equipCredits; out.found = equipFound.slice();
    out.header = ($('#cardsRoot .cd-cr') || {}).textContent;
    out.secs = $$('#cardsRoot .cd-sec').map(function(e){ return e.childNodes[0].textContent; });
    out.dupTags = $$('#cardsRoot .cd-pack .cd-worn').map(function(e){ return e.textContent; });
    out.shelfIds = equipShelfIds();
    out.shelf = slabs().map(function(s){ var c = byName(nameOf(s)); return { id: c.id, value: equipMarketValue(c), tag: (s.querySelector('.cd-worn') || {}).textContent, btns: btns(s) }; });
    // the clock is written in place: a second later it says so, and the sheet was not drawn again
    var t0 = $('#cardsRoot .cd-shelf-t'); out.clock = t0.textContent; frame += 61; cardsRender(); out.clock2 = ($('#cardsRoot .cd-shelf-t') || {}).textContent; out.clockInPlace = $('#cardsRoot .cd-shelf-t') === t0;

    // a card bought with credits: two taps, the first only arms (the credits are given and the sheet is left to notice by itself: it draws again only when what it shows has changed)
    equipCredits = 400; cardsRender(); await wait(80); out.credited = ($('#cardsRoot .cd-cr') || {}).textContent; out.affordable = slabs().map(function(s){ return btns(s).map(function(b){ return !b.off; }); });
    var card = equipCard(equipShelfIds()[0]), v = equipMarketValue(card), c0 = equipCredits, sh0 = shardCount, n0 = slabs().length;
    click(btn(card, /^BUY ◇/)); await wait(80);
    out.armedSpent = c0 - equipCredits; out.armedShown = !!btn(card, /^TAP AGAIN TO BUY/);
    click(btn(card, /^TAP AGAIN TO BUY/)); await wait(120);
    out.bought = { id: card.id, value: v, creditsSpent: c0 - equipCredits, shardsSpent: sh0 - shardCount, owned: equipOwns(card.id), found: equipIsFound(card.id), stored: localStorage.getItem('conduit_fp_cards'), onShelf: equipShelfIds().indexOf(card.id) >= 0, shown: !!slab(card), before: n0, after: slabs().length };

    // a card bought with shards
    var card2 = equipCard(equipShelfIds()[0]), v2 = equipMarketValue(card2), c1 = equipCredits, sh1 = shardCount;
    click(btn(card2, /^BUY ◆/)); await wait(80); click(btn(card2, /^TAP AGAIN TO BUY/)); await wait(120);
    out.boughtShards = { id: card2.id, value: v2, creditsSpent: c1 - equipCredits, shardsSpent: sh1 - shardCount, owned: equipOwns(card2.id), found: equipIsFound(card2.id), shown: !!slab(card2) };

    // a card you own for good (and did not bring): its tag says so, buying it finds it and writes nothing new
    var card3 = equipCard(equipShelfIds()[0]); equipOwnedSet().add(card3.id); equipWriteOwned(); equipCredits = 400; cardsRender(true); await wait(80);
    out.ownedTag = (slab(card3).querySelector('.cd-worn') || {}).textContent; var st0 = localStorage.getItem('conduit_fp_cards'), c2 = equipCredits;
    click(btn(card3, /^BUY ◇/)); await wait(80); click(btn(card3, /^TAP AGAIN TO BUY/)); await wait(120);
    out.boughtOwned = { found: equipIsFound(card3.id), creditsSpent: c2 - equipCredits, storeSame: localStorage.getItem('conduit_fp_cards') === st0, shown: !!slab(card3) };

    // poor: every price is off, and says how short; tapping them spends nothing
    equipCredits = 10; shardCount = 20; cardsRender(); await wait(80);
    out.poor = slabs().map(function(s){ var c = byName(nameOf(s)); return { value: equipMarketValue(c), btns: btns(s) }; });
    var before = [equipCredits, shardCount, equipFound.length], tapAll = function(){ slabs().forEach(function(s){ Array.prototype.slice.call(s.querySelectorAll('.cd-btn')).forEach(click); }); };
    tapAll(); await wait(80); tapAll(); await wait(80);   // (twice: a card that could be armed would be bought)
    out.poorKept = [equipCredits, shardCount, equipFound.length].join() === before.join();
    // a credit more: the sheet writes the new shortfall by itself (no price came within reach, so only the credits in its change-signature can tell it); then the shards come in (and only they)
    equipCredits = 11; cardsRender(); await wait(80);
    out.poor2 = slabs().map(function(s){ var c = byName(nameOf(s)); return { value: equipMarketValue(c), sub: btns(s)[0].sub }; });
    shardCount = 120; cardsRender(); await wait(80);   // (the pack comes within reach: a change of its own)
    shardCount = 300; cardsRender(); await wait(80);   // (then plenty for every price here, with the pack still within reach and the ◆1,000 of an unlock still far: only the shelf's own prices change)
    out.rich =slabs().map(function(s){ var b = btns(s); return { credits: b[0].off, shards: b[1].off, sub: b[1].sub }; });

    // the sheet opened and closed again and again: the shelf, the credits and what is found do not move
    var snap = function(){ return JSON.stringify([equipShelf.ids, equipShelf.until, equipCredits, equipFound, equipHand]); }, s0 = snap();
    for (var n = 0; n < 6; n++) { cardsClose(); await wait(20); cardsOpen(); await wait(40); cardsRender(true); }
    out.stable = snap() === s0; out.added = added.slice(); EventTarget.prototype.addEventListener = oa;
  } catch (err) { out.err = String(err && err.stack || err); }
  var pre = document.createElement('pre'); pre.id = '__cd'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2500); });</script></body>`;
function measure(w, h, query, seed) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mk-')), file = path.join(dir, 'game.html');
    const pre = seed ? '<script>try { ' + Object.keys(seed).map(k => 'localStorage.setItem(' + JSON.stringify(k) + ', ' + JSON.stringify(seed[k]) + ');').join(' ') + ' } catch (e) {}</script>' : '';
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">' + pre).replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=60000', '--dump-dom', 'file://' + file + (query || '')], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__cd">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const G = await boot('', {}), run = G.run, J = G.J;
    const PACK1_IDS = J('Object.values(EQUIP_CARDS).filter(function(c){ return c.pack === "pack1"; }).map(function(c){ return c.id; })');

    group('1. THE NUMBERS');
    await check('a card is worth 90 / 150 / 250 / 350 / 500 / 650 credits by rarity (Unrefined to Crystalline), a duplicate pays 25% of it, the shelf holds 6, a shelf lasts 5 minutes of play (18,000 frames at 60 a second); a shard buys the same number as a credit', () => {
        sameJ(J('EQUIP_MARKET.values'), { unrefined: 90, refined: 150, precision: 250, prototype: 350, lustrous: 500, crystalline: 650 }, 'the values'); same(J('EQUIP_MARKET.share'), 0.25, 'the share'); same(J('EQUIP_MARKET.shelf'), 6, 'the shelf'); same(J('EQUIP_MARKET.every'), 18000, 'the time'); same(J('EQUIP_MARKET.every / EQUIP_FPS / 60'), 5, 'minutes');
        sameJ(J('[EQUIP_CARDS.ember_plating, EQUIP_CARDS.furnace_heart, EQUIP_CARDS.cinderbrand].map(equipMarketValue)'), [90, 150, 250], "Pack 1's three rarities");
        sameJ(J('EQUIP_RARITIES.map(function(r){ return EQUIP_MARKET.values[r.id]; })'), [90, 150, 250, 350, 500, 650], 'one value for each of the six rarities');
        sameJ(J('[equipMarketValue(null), equipMarketValue({ rarity: "mythic" })]'), [0, 0], 'no card, or a rarity with no value, is worth nothing');
    });

    group('2. DUPLICATES PAY CREDITS');
    await check('a card already in the hand, or already found this run, is a DUPLICATE: the pack still costs ◆100, the card is not found again and pays 25% of its value in credits (22.5, 37.5, 62.5); a card new to you pays nothing and is found; four Unrefined duplicates make exactly 90', () => {
        const o = J(`(function(){ __fresh(0); shardCount = 1000; equipOwnedSet().clear(); equipOwnedSet().add('ember_plating'); equipHand.length = 0; equipHandAdd('ember_plating'); equipFound = ['furnace_heart', 'cinderbrand'];
            __deal(['ember_plating', 'furnace_heart', 'cinderbrand', 'venom_gland']); const out = { shards: shardCount, credits: equipCredits, found: equipFound.slice(), last: JSON.parse(JSON.stringify(equipPackLast)) };
            const had = equipCredits; equipFound = ['ember_plating', 'venom_gland', 'charged_wiring', 'flux_cell']; equipHand.length = 0; __deal(['ember_plating', 'venom_gland', 'charged_wiring', 'flux_cell']); out.four = equipCredits - had; out.total = equipCredits; out.foundAfter = equipFound.length; return out; })()`);
        same(o.shards, 900, "the pack's price"); near(o.credits, 22.5 + 37.5 + 62.5, 'the credits'); sameJ(o.found, ['furnace_heart', 'cinderbrand', 'venom_gland'], 'what was found (only the new card)');
        sameJ(o.last.dupes, ['ember_plating', 'furnace_heart', 'cinderbrand'], 'the duplicates'); sameJ(o.last.fresh, ['venom_gland'], 'the new card'); near(o.last.credits, 122.5, "the pack's credits"); near(o.four, 90, 'four Unrefined duplicates'); near(o.total, 212.5, 'the credits add up from pack to pack'); same(o.foundAfter, 4, 'a duplicate was found again');
    });
    await check('a card you own for good but did NOT bring (not in the hand, not found) is not a duplicate: a pack finds it for the run, so it can be worn even when the hand is full of other cards, and it pays no credits', () => {
        const o = J(`(function(){ __fresh(0); shardCount = 1000; equipOwnedSet().clear(); ['venom_gland', 'ember_plating', 'frost_lining', 'charged_wiring'].forEach(id => equipOwnedSet().add(id)); equipHand.length = 0; ['ember_plating', 'frost_lining', 'charged_wiring'].forEach(id => equipHandAdd(id)); equipFound = []; equipCredits = 0;
            __deal(['venom_gland', 'ember_plating', 'flux_cell', 'cinderbrand']); const f = __prep('toxic', 'brawler'); return { hand: equipHand.length, credits: equipCredits, found: equipFound.slice(), wearsIt: equipPut(f, 0, 'venom_gland'), inHand: equipInHand('venom_gland') }; })()`);
        same(o.hand, 3, 'the hand was full'); near(o.credits, 22.5, 'only the card in the hand paid'); sameJ(o.found, ['venom_gland', 'flux_cell', 'cinderbrand'], 'the owned card was found again, the new ones too'); same(o.wearsIt, true, 'the found card was not wearable'); same(o.inHand, false, 'it went into the hand');
    });
    await check('credits come only from duplicates (a pack of new cards pays none); they belong to the run (equipReset, which NEW GAME runs, clears them and the shelf); the other pack rules are as they were (4 cards, one Precision, none twice)', () => {
        const o = J(`(function(){ __fresh(0); shardCount = 5000; equipFound = []; equipCredits = 0; for (let s = 1; s <= 30; s++) { equipFound = []; equipHand.length = 0; const ids = equipPackRoll(s); if (!ids || ids.length !== 4 || new Set(ids).size !== 4 || !ids.some(i => equipCard(i).rarity === 'precision')) return { bad: s }; }
            equipFound = []; equipHand.length = 0; equipPackOpen(1); const fresh = equipCredits; equipShelfDeal(3); const dealt = equipShelf.ids.length; equipCredits = 33.5; equipReset(); return { fresh, dealt, after: equipCredits, shelf: equipShelf.ids.length, until: equipShelf.until }; })()`);
        same(o.bad, undefined, 'a pack broke a rule'); same(o.fresh, 0, 'a new card paid credits'); same(o.dealt, 6, 'the shelf before the reset'); same(o.after, 0, 'credits survived equipReset'); same(o.shelf, 0, 'the shelf survived equipReset'); same(o.until, 0, "the shelf's clock survived equipReset");
    });

    group('3. THE SHELF: six cards you do not have, a new one every 5 minutes');
    await check('a shelf is six different cards of Pack 1, none in the hand, none found, each with a market value; a card you own for good but did not bring can be on it; the same seed deals the same shelf; over 2,000 deals every card that could come up does, about equally often', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['frost_lining']; equipHand.length = 0; equipOwnedSet().clear(); equipOwnedSet().add('ember_plating'); equipOwnedSet().add('furnace_heart'); equipHandAdd('ember_plating'); const out = {};
            const a = equipShelfDeal(5), b = equipShelfDeal(5), c = equipShelfDeal(6); out.a = a; out.same = a.join() === b.join(); out.diff = a.join() !== c.join();
            const bad = []; const seen = {}; for (let s = 1; s <= 2000; s++) { const ids = equipShelfDeal(s); if (ids.length !== 6 || new Set(ids).size !== 6) bad.push(['size', s]); for (const id of ids) { seen[id] = (seen[id] || 0) + 1; const card = equipCard(id); if (!card || !card.pack || card.test || equipInHand(id) || equipIsFound(id) || !equipMarketValue(card)) bad.push([id, s]); } }
            out.bad = bad.slice(0, 3); out.seen = Object.keys(seen).sort(); out.counts = Object.values(seen); out.crystalline = Object.keys(seen).filter(id => equipCard(id).rarity === 'crystalline'); return out; })()`);
        same(o.a.length, 6, 'a shelf'); same(o.same, true, 'the same seed'); same(o.diff, true, 'two seeds'); sameJ(o.bad, [], 'a bad shelf'); sameJ(o.seen, PACK1_IDS.filter(id => id !== 'ember_plating' && id !== 'frost_lining').sort(), 'the cards that came up (all of Pack 1 but the one in the hand and the one found; the owned one included)'); sameJ(o.crystalline, [], 'a Crystalline card was sold');
        const mean = o.counts.reduce((x, y) => x + y, 0) / o.counts.length; ok(o.counts.every(c => Math.abs(c - mean) / mean < 0.12), 'a card comes up more often than the others: ' + o.counts);
    });
    await check('with the test cards on (?cards) the shelf still sells none of them, nor any card no pack deals (the Crystalline six)', async () => {
        const T = await boot('?cards', {}), o = T.J(`(function(){ __fresh(0); equipFound = []; equipHand.length = 0; const bad = []; let all = 0; for (let s = 1; s <= 500; s++) { for (const id of equipShelfDeal(s)) { all++; const c = equipCard(id); if (c.test || !c.pack || c.kind === 'class' || c.kind === 'subclass' || c.kind === 'universal') bad.push(id); } } return { bad: bad.slice(0, 3), all, tests: Object.values(equipCards()).filter(c => c.test).length, pool: equipShelfPool().length }; })()`);
        ok(o.tests >= 9, 'the test cards are not there: ' + o.tests); sameJ(o.bad, [], 'a card that is not for sale'); same(o.all, 3000, 'the cards dealt'); same(o.pool, 18, "the pool is Pack 1's eighteen");
    });
    await check("a new shelf comes when its time is up (18,000 frames of the game's own clock) and not before; a card taken into the hand, or found by a pack, leaves the shelf at once; fewer than six are shown when fewer are left, and none when there are none", () => {
        const o = J(`(function(){ __fresh(0); equipFound = []; equipHand.length = 0; equipReset(); __at(100); equipTick(true); const first = equipShelfIds().slice(), until = equipShelf.until; const out = { first: first.length, until };
            __at(100 + 17999); equipTick(true); out.notYet = equipShelfIds().join() === first.join() && equipShelf.until === until; __at(100 + 18000); equipTick(true); out.dealt = equipShelf.until; out.second = equipShelfIds().length;
            const ids = equipShelfIds(); equipFound.push(ids[0]); equipOwnedSet().add(ids[1]); equipHandAdd(ids[1]); out.left = equipShelfIds().length; out.gone = [equipShelfIds().indexOf(ids[0]) < 0, equipShelfIds().indexOf(ids[1]) < 0];
            equipHand.length = 0; equipFound = ALL.slice(0, 16); out.few = equipShelfDeal(1).length; equipFound = ALL.slice(); out.none = equipShelfIds().length; out.dealtEmpty = equipShelfDeal(1).length; out.stillTimed = equipShelf.until > _equipNow();
            equipFound = []; equipReset(); __at(31); equipTick(); out.offBeat = equipShelf.ids.length; __at(60); equipTick(); out.onBeat = equipShelf.ids.length; return out; })()`.replace('ALL', JSON.stringify(PACK1_IDS)).replace('ALL', JSON.stringify(PACK1_IDS)));
        same(o.first, 6, 'the first shelf'); same(o.until, 100 + 18000, "the first shelf's time"); same(o.notYet, true, 'the shelf changed before its time'); same(o.dealt, 100 + 18000 + 18000, "the next shelf's time"); same(o.second, 6, 'the next shelf');
        same(o.left, 4, 'a card in the hand and a card found left the shelf'); sameJ(o.gone, [true, true], 'they are gone'); same(o.few, 2, 'with only two cards left to sell'); same(o.none, 0, 'with none left'); same(o.dealtEmpty, 0, 'a shelf dealt from nothing'); same(o.stillTimed, true, 'an empty shelf still keeps time');
        same(o.offBeat, 0, "the game's tick dealt between its half-seconds"); same(o.onBeat, 6, "the game's own tick (every half second) did not deal the due shelf");
    });

    group('4. BUYING: credits or the same number of shards');
    await check('a card costs its value in credits, or the same number in shards (never both); short of it nothing is spent and it says how short; a card that is not on the shelf (in the hand, found, a Crystalline card, one that does not exist) cannot be bought, nor can anything be paid for with something else', () => {
        const o = J(`(function(){ __fresh(0); equipFound = []; equipHand.length = 0; equipReset(); equipShelfDeal(7); const id = equipShelfIds()[0], v = equipMarketValue(equipCard(id)); const out = { id, v };
            equipCredits = v - 1; shardCount = v - 1; out.short = [equipMarketWhyNot(id, 'credits'), equipMarketWhyNot(id, 'shards'), equipMarketBuy(id, 'credits'), equipMarketBuy(id, 'shards'), equipCredits, shardCount];
            equipCredits = v + 10; shardCount = 5000; out.byCredits = { bought: equipMarketBuy(id, 'credits'), credits: equipCredits, shards: shardCount, owns: equipOwns(id), found: equipIsFound(id), off: equipShelfIds().indexOf(id) < 0, left: equipShelfIds().length };
            const id2 = equipShelfIds()[0], v2 = equipMarketValue(equipCard(id2)); equipCredits = 0; out.byShards = { id: id2, v: v2, bought: equipMarketBuy(id2, 'shards'), credits: equipCredits, spent: 5000 - shardCount, owns: equipOwns(id2), found: equipIsFound(id2) };
            const inHand = equipShelfIds()[0]; equipOwnedSet().add(inHand); equipHandAdd(inHand); const found = equipShelfIds()[0]; equipFound.push(found); equipCredits = 9999; shardCount = 9999; const other = equipShelfIds()[0];
            out.refused = [equipMarketBuy('impact_test', 'credits'), equipMarketWhyNot('impact_test', 'credits'), equipMarketBuy(id, 'credits'), equipMarketWhyNot(id, 'credits'), equipMarketBuy(inHand, 'shards'), equipMarketWhyNot(inHand, 'shards'), equipMarketBuy(found, 'credits'), equipMarketWhyNot(found, 'credits'),
                equipMarketBuy('nope', 'shards'), equipMarketWhyNot('nope', 'shards'), equipMarketBuy(other, 'gold'), equipMarketWhyNot(other, 'gold'), equipMarketWhyNot(other, undefined), equipCredits, shardCount]; return out; })()`);
        same(o.short[0], 'NEED ◇1 MORE', 'the credits reason'); same(o.short[1], 'NEED ◆1 MORE', 'the shards reason'); same(o.short[2] || o.short[3], false, 'a card was bought short of the price'); sameJ(o.short.slice(4), [o.v - 1, o.v - 1], 'something was spent');
        sameJ(o.byCredits, { bought: true, credits: 10, shards: 5000, owns: true, found: true, off: true, left: 5 }, 'bought with credits: the credits paid, the shards untouched, kept for good, found, off the shelf (five are left, not six: it is not refilled)');
        sameJ([o.byShards.bought, o.byShards.credits, o.byShards.spent, o.byShards.owns, o.byShards.found], [true, 0, o.byShards.v, true, true], 'bought with shards: the shards paid, the credits untouched, kept for good, found');
        sameJ(o.refused, [false, 'NOT ON THE SHELF', false, 'NOT ON THE SHELF', false, 'NOT ON THE SHELF', false, 'NOT ON THE SHELF', false, 'NO SUCH CARD', false, 'PAY WITH CREDITS OR SHARDS', 'PAY WITH CREDITS OR SHARDS', 9999, 9999], 'what cannot be bought');
    });
    await check('a card NEW to you is kept for good (conduit_fp_cards) and found (worn at once); one you OWN for good but did not bring is found for the run and nothing is written; neither touches the hand (its cap of three)', async () => {
        const store = {}, B = await boot('', store);
        const o = B.J(`(function(){ __fresh(0); equipFound = []; equipHand.length = 0; equipReset(); equipShelfDeal(9); const [a, b] = equipShelfIds(); equipOwnedSet().add(b); equipWriteOwned(); const written = JSON.parse(localStorage.getItem(EQUIP.key)).owned.slice(); shardCount = 5000; equipCredits = 0;
            const f = __prep(equipCard(a).match, 'brawler'), g = __prep(equipCard(b).match, 'brawler'); const out = { a, b, written }; equipMarketBuy(a, 'shards'); out.newCard = [equipOwns(a), equipIsFound(a), JSON.parse(localStorage.getItem(EQUIP.key)).owned.indexOf(a) >= 0, equipPut(f, 0, a)];
            const before = JSON.parse(localStorage.getItem(EQUIP.key)).owned.slice(); equipMarketBuy(b, 'shards'); out.ownedCard = [equipIsFound(b), JSON.parse(localStorage.getItem(EQUIP.key)).owned.join() === before.join(), equipPut(g, 0, b)]; out.hand = equipHand.length; return out; })()`);
        sameJ(o.written, [o.b], 'only the owned card was in the collection before'); sameJ(o.newCard, [true, true, true, true], 'a new card: kept for good, found, written, worn at once'); sameJ(o.ownedCard, [true, true, true], 'a card owned for good: found, nothing new written, worn at once'); same(o.hand, 0, 'buying touched the hand');
    });
    await check('the flat ◆1,000 unlock of a found card is as it was (it still needs the card found first); a card bought on the shelf cannot be unlocked again; the Crystalline six are still bought outright', () => {
        const o = J(`(function(){ __fresh(0); equipOwnedSet().clear(); equipFound = ['ember_plating']; shardCount = 5000; const out = { why: [equipUnlockWhyNot('ember_plating'), equipUnlockWhyNot('furnace_heart'), equipUnlockWhyNot('impact_test')] };
            out.unlock = [equipUnlock('ember_plating'), shardCount, equipOwns('ember_plating'), equipUnlockWhyNot('ember_plating')]; equipReset(); equipShelfDeal(2); const id = equipShelfIds()[0]; equipMarketBuy(id, 'shards'); out.bought = equipUnlockWhyNot(id); return out; })()`);
        sameJ(o.why, [null, 'FIND IT IN A PACK FIRST', null], 'the unlock rule'); sameJ(o.unlock, [true, 4000, true, 'ALREADY UNLOCKED'], 'the unlock'); same(o.bought, 'ALREADY UNLOCKED', 'a card bought on the shelf');
    });

    group('5. SAVING: the credits and the shelf, with the time left');
    await check('a saved game comes back with its credits and its shelf and the time left on it (a reload keeps the same six cards and the clock); three saves and loads in a row change nothing; the save has the same 28 fields and version 1', async () => {
        const store = {}, A = await boot('', store);
        const a = A.J(`(function(){ __fresh(1); equipReset(); equipFound = ['frost_lining']; equipCredits = 77.5; __at(500); equipShelfDeal(4); __at(500 + 6000); const wrote = facilitySaveWrite(); return { wrote, ids: equipShelfIds().slice(), left: equipShelf.until - frame, credits: equipCredits }; })()`);
        same(a.wrote, true, 'the save was written'); const saved = JSON.parse(store.conduit_fp_save); sameJ(saved.cards.shelf.ids, a.ids, 'the shelf in the save'); same(saved.cards.shelf.left, a.left, 'the time left in the save'); same(a.left, 12000, 'the time left'); same(saved.cards.credits, 77.5, 'the credits in the save'); same(saved.v, 1, 'the version'); same(Object.keys(saved).length, 28, 'the fields');
        for (let round = 1; round <= 3; round++) {
            const B = await boot('', store), r = B.J(`(function(){ const out = { ids: equipShelfIds().slice(), until: equipShelf.until, credits: equipCredits, found: equipFound.slice() }; __at(0); facilitySaveWrite(); return out; })()`);   // (saved again at the instant it loaded: a frame or two may have run since)
            sameJ(r.ids, a.ids, 'round ' + round + ': the shelf'); same(r.until, a.left, 'round ' + round + ': the time left (the clock starts again at 0 on a load)'); same(r.credits, 77.5, 'round ' + round + ': the credits'); sameJ(r.found, ['frost_lining'], 'round ' + round + ': the found cards'); same(B.errs.length, 0, 'errors: ' + B.errs.join(' | '));
        }
    });
    await check('a save from before the market (no credits, no shelf in it) loads as it did: no credits, and the first tick deals a shelf; a damaged one (strangers on the shelf, a negative time, credits that are not a number) is cleaned: only real cards, at most six, a time between none and 5 minutes', async () => {
        const store = {}, A = await boot('', store); A.run('__fresh(1); facilitySaveWrite();'); const old = JSON.parse(store.conduit_fp_save); delete old.cards.credits; delete old.cards.shelf; store.conduit_fp_save = JSON.stringify(old);
        const B = await boot('', store), r = B.J(`(function(){ const credits = equipCredits; equipShelf = { ids: [], until: 0 }; equipTick(true); return { credits, after: equipShelfIds().length, until: equipShelf.until - frame }; })()`);
        same(r.credits, 0, 'credits from a save that had none'); same(r.after, 6, 'the first tick dealt a shelf'); same(r.until, 18000, 'and its time'); same(B.errs.length, 0, 'errors: ' + B.errs.join(' | '));
        old.cards.credits = 'lots'; old.cards.shelf = { ids: ['ember_plating', 'nope', 'ember_plating', 5, 'flux_cell', 'a', 'b', 'c', 'd', 'e', 'f', 'g'], left: 999999 }; store.conduit_fp_save = JSON.stringify(old);
        const C = await boot('', store), c = C.J('({ credits: equipCredits, ids: equipShelf.ids, until: equipShelf.until })'); same(c.credits, 0, 'credits that are not a number'); sameJ(c.ids, ['ember_plating', 'flux_cell'], 'the shelf with strangers in it'); same(c.until, 18000, 'a time far too long');
        old.cards.credits = 3; old.cards.shelf = { ids: PACK1_IDS, left: 5000 }; store.conduit_fp_save = JSON.stringify(old); const E = await boot('', store), e = E.J('({ credits: equipCredits, ids: equipShelf.ids, until: equipShelf.until })'); same(e.credits, 3, 'credits kept'); sameJ(e.ids, PACK1_IDS.slice(0, 6), 'a shelf of eighteen is cut to six'); same(e.until, 5000, 'its time');
        old.cards.credits = -5; old.cards.shelf = { ids: [], left: -200 }; store.conduit_fp_save = JSON.stringify(old); const D = await boot('', store), d = D.J('(function(){ const credits = equipCredits; equipTick(true); return { credits, left: equipShelf.until - frame }; })()'); same(d.credits, 0, 'negative credits');
        ok(d.left > 17000 && d.left <= 18000, 'a negative time means the shelf is due: the next tick deals a new one with its whole 5 minutes: ' + d.left); same(D.errs.length, 0, 'errors: ' + D.errs.join(' | '));
    });
    await check('NEW GAME clears the credits and the shelf and keeps the permanent collection (the cards bought for good stay)', async () => {
        const store = {}, A = await boot('', store);
        A.run(`__fresh(1); equipReset(); __at(0); equipShelfDeal(2); __at(6000); const id = equipShelfIds()[0]; shardCount = 5000; equipMarketBuy(id, 'shards'); equipCredits = 40; facilitySaveWrite();`);
        const kept = JSON.parse(store.conduit_fp_cards).owned.slice(); same(kept.length, 1, 'the bought card is kept'); same(JSON.parse(store.conduit_fp_save).cards.shelf.left, 12000, 'the shelf was in the save');
        A.run('facilitySaveClear()'); same(store.conduit_fp_save, undefined, 'the save is gone'); const B = await boot('', store), r = B.J('({ credits: equipCredits, until: equipShelf.until, found: equipFound.length, owned: equipOwnedList().map(function(c){ return c.id; }) })');
        same(r.credits, 0, 'credits'); ok(r.until !== 12000, "the old shelf's time came back: " + r.until); same(r.found, 0, 'found cards'); sameJ(r.owned, kept, 'the collection');
    });

    group('6. THE SCREENS (real browser)');
    const P = measure(1180, 1100, '');
    if (P === null) console.log('  (no Chromium here: skipped)');
    else {
        await check('the instrument ran (a tablet, the plain page): no page error, no listener added on the window or the document by the market', () => { ok(P, 'the probe produced nothing'); same(P.err, undefined, 'the probe threw'); sameJ(P.errors, [], 'page errors'); sameJ(P.added, [], 'a listener was added'); });
        if (P && !P.err) {
            await check("the header shows the run's credits, the pack shows each duplicate with what it paid (+◇22.5 for an Unrefined) and each new card as new, and the MARKET lists the shelf: six cards, none found, each with its value as a price in credits and in shards", () => {
                near(P.credits, 45, 'the credits from two Unrefined duplicates'); same(P.header, '◇ 45 CREDITS', 'the header'); sameJ(P.secs, ['YOUR HAND', 'YOU', 'BOOSTER PACK', 'MARKET', 'FOUND THIS RUN', 'THE COLLECTION'], 'the sections');
                same(P.dupTags.filter(t => /^DUPLICATE · \+◇22\.5 CREDITS$/.test(t)).length, 2, "the duplicates' tags: " + P.dupTags); same(P.dupTags.filter(t => /^NEW · FOUND FOR THIS RUN$/.test(t)).length, 2, "the new cards' tags");
                same(P.shelf.length, 6, 'the shelf on the screen'); sameJ(P.shelf.map(s => s.id), P.shelfIds, 'the screen shows what is on sale'); ok(P.shelf.every(s => ['ember_plating', 'venom_gland', 'flux_cell', 'siphon_field'].indexOf(s.id) < 0), 'a found card is for sale');
                for (const s of P.shelf) {
                    sameJ(s.btns.map(b => b.label), ['BUY ◇' + s.value + ' CREDITS', 'BUY ◆' + s.value + ' SHARDS'], 'the two prices on ' + s.id); same(s.tag, 'NEW · KEPT FOR GOOD', 'the tag on ' + s.id);
                    sameJ(s.btns.map(b => b.off), [P.credits < s.value, false], 'what is within reach on ' + s.id); same(s.btns[0].sub, P.credits < s.value ? 'NEED ◇' + Math.ceil(s.value - P.credits) + ' MORE' : 'WITH CREDITS', 'the credits button says why or how on ' + s.id); same(s.btns[1].sub, 'WITH SHARDS', 'the shards button on ' + s.id);
                }
            });
            await check("the game itself deals the first shelf (six cards and the whole 5 minutes, or a little less) within its first moments, through its own tick", () => {
                same(P.firstShelf, 6, 'the shelf the game dealt'); ok(P.firstLeft > 17000 && P.firstLeft <= 18000, 'the time on it: ' + P.firstLeft);
            });
            await check("the shelf's clock reads the game's own time (121 seconds is 2:01) and is written in place a second later (2:00) without drawing the sheet again", () => {
                same(P.clock, 'NEXT SHELF IN 2:01 · YOUR CREDITS COME FROM THE DUPLICATES IN YOUR PACKS', 'the clock'); same(P.clock2, 'NEXT SHELF IN 2:00 · YOUR CREDITS COME FROM THE DUPLICATES IN YOUR PACKS', 'a second later'); same(P.clockInPlace, true, 'the sheet was drawn again for the clock');
            });
            await check("the sheet notices by itself that credits came (the header, every price now within reach) and, later, that they ran out: it draws again only when what it shows has changed", () => {
                same(P.credited, '◇ 400 CREDITS', 'the header'); ok(P.affordable.length === 6 && P.affordable.every(a => a[0] && a[1]), 'a price out of reach with ◇400 and ◆1,500: ' + JSON.stringify(P.affordable));
            });
            await check("a card is bought in two taps with credits (the first arms and spends nothing) and in two taps with shards: the price is paid in the one currency, the card is found, kept for good when it was new, and leaves the shelf", () => {
                same(P.armedSpent, 0, 'the first tap spent something'); same(P.armedShown, true, 'the first tap did not arm'); same(P.bought.creditsSpent, P.bought.value, 'the credits paid'); same(P.bought.shardsSpent, 0, 'shards paid for a card bought with credits'); same(P.bought.owned, true, 'kept for good'); same(P.bought.found, true, 'found');
                same(P.bought.onShelf, false, 'still on the shelf'); same(P.bought.shown, false, 'still on the screen'); same(P.bought.after, P.bought.before - 1, 'the shelf on the screen is not refilled'); ok(JSON.parse(P.bought.stored).owned.indexOf(P.bought.id) >= 0, 'kept: ' + P.bought.stored);
                same(P.boughtShards.shardsSpent, P.boughtShards.value, 'the shards paid'); same(P.boughtShards.creditsSpent, 0, 'credits paid for a card bought with shards'); same(P.boughtShards.owned, true, 'kept for good'); same(P.boughtShards.found, true, 'found'); same(P.boughtShards.shown, false, 'still on the screen');
            });
            await check('a card you own for good says so on the shelf ("YOURS FOR GOOD · FOUND FOR THIS RUN"); buying it finds it, writes nothing new and takes it off the shelf', () => {
                same(P.ownedTag, 'YOURS FOR GOOD · FOUND FOR THIS RUN', 'its tag'); same(P.boughtOwned.found, true, 'found'); ok(P.boughtOwned.creditsSpent > 0, 'the credits paid'); same(P.boughtOwned.storeSame, true, 'something new was written'); same(P.boughtOwned.shown, false, 'still on the screen');
            });
            await check('with next to nothing (◇10, ◆20) every price is off and says how short (NEED ◇ / NEED ◆), and tapping them spends nothing; opening and closing the sheet six times moves nothing', () => {
                ok(P.poor.length >= 1, 'the shelf was empty'); for (const s of P.poor) { sameJ(s.btns.map(b => b.off), [true, true], 'both prices are off'); sameJ(s.btns.map(b => b.sub), ['NEED ◇' + (s.value - 10) + ' MORE', 'NEED ◆' + (s.value - 20) + ' MORE'], 'how short'); }
                same(P.poorKept, true, 'tapping the prices spent something'); same(P.stable, true, 'something moved');
            });
            await check("the sheet notices by itself a credit more (every shortfall is written again) and the shards coming in (the shards' prices come within reach, the credits' do not), without being told", () => {
                ok(P.poor2.length >= 1 && P.rich.length === P.poor2.length, 'the shelf was empty'); for (const s of P.poor2) same(s.sub, 'NEED ◇' + (s.value - 11) + ' MORE', 'the shortfall after a credit more');
                for (const s of P.rich) { same(s.credits, true, 'the credits button, still short'); same(s.shards, false, 'the shards button, now within reach'); same(s.sub, 'WITH SHARDS', 'its words'); }
            });
        }
    }

    console.log(failures ? `\n${failures} failing` : '\nall passing'); process.exit(failures ? 1 : 0);
})();
