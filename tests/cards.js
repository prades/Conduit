// EQUIP CARDS, AND THE SUBCLASS TAG (js/cards.js, js/cardsui.js; the hooks in js/facilitysave.js, js/game.js, js/helpers.js, js/party.js, js/specimen.js, js/commandcenter.js).
// ASKED: "Make way for a robust card system that will be used to give followers [...] a equip card and actually have a slot for another equip card. So two equip cards per follower. [...] there also needs to be a new sub
// archetype for each of the followers [...] a tag for later classification when it comes to giving buffs to creatures. So just make it to where there's not going to be any conflict, and this new system can rest
// peacefully within our infrastructure." Chosen with the user (the Notion "Conduit Game Design Archive", 2026-10-30): five subclasses, two slots on each follower and two Universal ones on the player, a card is a type
// (never used up), unlocked for good for 1,000 shards, a hand of up to three chosen at the start of a run, a CARDS dock button on a tablet or a desktop, inert test cards behind a developer switch (?cards).
//   THE TAG       each of the 18 forms has the subclass the user's roster chart gives it (by name); an egg, and the ten retired forms, have none; it decides nothing
//   THE RULES     a card fits by element, role (class), subclass or not at all (universal); in the hand to be worn; one slot each, not twice on a unit, any number of units may wear one; the player takes Universal only;
//                 a role switched or a card put back takes it off (the tick); unlocking pays the flat price from the run's shards, once, and is kept where NEW GAME does not reach
//   THE LIFE      a respawn keeps a follower's cards; EXILE, falling for good (its restored body too) and a RE-ROLL empty the slots; the save carries them, additively (FS.version still 1), and a save from before the cards loads
//   NOTHING ELSE  the nine test cards do nothing (the six real ones, the Crystalline cards, are tests/crystalline.js's); with no card in the registry the button, the roster's slots and the sheet are there and say so; the game's own numbers (the stats, the save's other parts) are as they were
//   THE SCREENS   in the real page: the CARDS button and its sheet (a rarity chip on each card's edge, YOUR HAND, YOU, THE COLLECTION, UNLOCK in two taps), the roster's SUBCLASS and CARD 1 / CARD 2, the start-of-run choice; a phone has none
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

// the user's roster chart (the Notion Archive, "Follower subclass assignments — consolidated roster"), by the forms' names in the game (Sonic Orb is the STATIC ORB, Seaper the SEEPER, Emberhood the EMBER HOOD,
// Void Star the VOIDSTAR, Horn Shell the HORNSHELL, Rime Star the RIMESTAR, Thermite Brawler the THERMITE BURROWER)
const CHART = {
    'QUILLSTONE': 'crustacean', 'STATIC ORB': 'drone', 'RIFT MIMIC': 'jelly', 'JELLY RAM': 'jelly', 'SEEPER': 'crustacean', 'FROST MAW': 'elemental',
    'EMBER HOOD': 'elemental', 'THUNDERHEAD': 'elemental', 'VOIDSTAR': 'mollusk', 'HORNSHELL': 'mollusk', 'ROTSHARD': 'elemental', 'RIMESTAR': 'drone',
    'THERMITE BURROWER': 'drone', 'HOVER SHELL': 'drone', 'GOO PROXY': 'jelly', 'HAMMER SLUG': 'mollusk', 'BLIGHT SPIDER': 'drone', 'IGLOO SKATER': 'elemental',
};

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
// A context with the game loaded: `search` is the address's query (?cards), `store` the browser's storage.
async function boot(search, store) {
    const sb = makeBrowserSandbox(store || {}); sb.location.search = search || '';
    sb.console = Object.assign({}, console, { error: (...a) => { if (!/the cards screen could not open/.test(String(a[0]))) console.error(...a); } });   // (the sheet is drawn with a DOM the stub does not have: the real page, below, is where it is looked at)
    const ctx = vm.createContext(sb);
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) { /* the page's own boot check says */ } }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    vm.runInContext(`gameState.running = true; facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860;
        globalThis.__fresh = n => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; respawnQueue.length = 0; selectedUnits.clear(); floatingTexts.length = 0; shardCount = 5000;
            for (let i = 0; i < n; i++) recruitFollower(); for (const f of followers) { f.returningToCrystal = false; f.spawnProtection = 1e9; } partyTick(); return followers.slice(); };
        globalThis.__mk = (el, role) => { spawnFollowerAtCrystal(el, role); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.role = role; return f; };
        globalThis.__form = (f, id) => { f.evolved = id; f.element = EVOLUTIONS[id].element; f.role = EVOLUTIONS[id].role; return f; };
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };`, ctx);
    return { ctx, run: s => vm.runInContext(s, ctx), J: s => JSON.parse(vm.runInContext('JSON.stringify(' + s + ')', ctx)) };
}

// ── THE REAL PAGE ──
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var click = function(el){ if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  var byText = function(sel, t){ return $$(sel).filter(function(e){ return e.textContent.indexOf(t) === 0; })[0]; };
  var shown = function(el){ return !!el && getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().width > 0; };
  // the sheet and the roster's slots with NO card in the registry (the contract of js/cardsui.js; the game itself has six real cards now, so a probe empties the registry for the moment)
  var emptyProbe = async function(){
      var f0 = followers[0]; f0.evolved = 'quillstone'; f0.role = 'brawler'; f0.element = 'fire'; selectedUnits.clear(); ccOpen('roster'); await wait(300); _ccFocus = f0; ccRender(); await wait(60);
      var offs = $$('#ccSide .cc-dd').map(function(d){ return [d.querySelector('.cc-dd-k').textContent, d.querySelector('.cc-dd-v').textContent, d.disabled]; });
      out.plain = { dds: offs.map(function(o){ return o[0]; }), cardDds: offs.filter(function(o){ return /^CARD/.test(o[0]); }), sub: $$('#ccSide .cc-stat').map(function(r){ return [r.querySelector('.cc-stat-k').textContent, r.querySelector('.cc-stat-v').textContent]; }).filter(function(r){ return r[0] === 'SUBCLASS'; })[0], chip: ($('#ccFocus .cf-sc') || {}).textContent, cardsOpen: $('#cardsRoot').className };
      ccClose(); await wait(60);
      click($('#btnCards')); await wait(200);
      out.emptySheet = { cls: $('#cardsRoot').className, slabs: $$('#cardsRoot .cd-card:not(.cd-empty)').length, empties: $$('#cardsRoot .cd-card.cd-empty').length, pslots: $$('#cardsRoot .cd-pbtn').length, note: ($('#cardsRoot .cd-note') || {}).textContent, secs: $$('#cardsRoot .cd-sec').map(function(e){ return e.childNodes[0].textContent; }), summary: ($('#cardsRoot .cd-summary') || {}).textContent };
      click($('#cardsRoot .cd-pbtn')); await wait(60); out.emptySheet.pList = $$('#cardsRoot .cd-plist .cd-btn').length + '/' + $$('#cardsRoot .cd-plist .cd-note').map(function(e){ return e.textContent; }).join();
      click($('#cardsRoot .cd-close')); await wait(60); out.emptySheet.closed = $('#cardsRoot').className;
  };
  try {
    out.dev = equipDev; out.any = equipAny(); out.wide = typeof hudCorners === 'function' && hudCorners();
    out.startOpen = $('#cardsRoot').className; out.startBanner = !!$('#cardsRoot .cd-banner'); out.startClose = ($('#cardsRoot .cd-close') || {}).textContent;
    if (out.startOpen.indexOf('open') >= 0) {   // A NEW RUN: the screen opened by itself, to choose the hand
      out.startHand0 = equipHand.length; out.takes = $$('#cardsRoot .cd-grid .cd-btn').filter(function(b){ return /^TAKE INTO THE RUN/.test(b.textContent); }).length;
      out.locks = $$('#cardsRoot .cd-grid .cd-btn').filter(function(b){ return /^UNLOCK/.test(b.textContent); }).length; out.locksOff = $$('#cardsRoot .cd-grid .cd-btn').filter(function(b){ return /^UNLOCK/.test(b.textContent) && b.disabled; }).length;
      click(byText('#cardsRoot .cd-grid .cd-btn', 'TAKE INTO THE RUN')); await wait(60); click(byText('#cardsRoot .cd-grid .cd-btn', 'TAKE INTO THE RUN')); await wait(60);
      out.startHand1 = equipHand.slice(); click($('#cardsRoot .cd-close')); await wait(60); out.startAfter = $('#cardsRoot').className; out.startBodyClass = document.body.classList.contains('cardsOpen');
    }
    gameState.running = true; facilityBlackoutSet(false); if (typeof classPickerClose === 'function') classPickerClose(); classPickerOpen = false;
    shardCount = 2500; for (var i = followers.length; i < 4; i++) recruitFollower(); for (var k = 0; k < followers.length; k++) followers[k].returningToCrystal = false; partyTick(); await wait(50);
    var btn = $('#btnCards'); out.btn = { there: !!btn, shown: shown(btn), inDock: !!btn && !!btn.closest('#dockScroll'), label: btn ? btn.textContent : null, topHud: shown($('#topToggles')) };
    if (out.any && out.wide && out.dev) {
      // THE SCREEN, from the dock
      click(btn); await wait(200);
      var slabs = $$('#cardsRoot .cd-grid .cd-card');
      out.open = { cls: $('#cardsRoot').className, body: document.body.classList.contains('cardsOpen'), hudHidden: !shown($('#topHud')) && !shown($('#topToggles')), slabs: slabs.length, title: ($('#cardsRoot .cd-title') || {}).textContent, secs: $$('#cardsRoot .cd-sec').map(function(e){ return e.childNodes[0].textContent; }), summary: ($('#cardsRoot .cd-summary') || {}).textContent, shardsHead: ($('#cardsRoot .cd-sh-n') || {}).textContent };
      out.bars = slabs.map(function(s){ var name = s.querySelector('.cd-name').textContent, c = Object.values(equipCards()).filter(function(x){ return x.name === name; })[0]; var chip = s.querySelector('.cd-chip'), sr = s.getBoundingClientRect(), cr = chip ? chip.getBoundingClientRect() : null; return [name, s.querySelectorAll('.cd-chip i.on').length, s.querySelectorAll('.cd-chip i').length, c ? equipRarityBars(c) : -1, s.querySelector('.cd-rar').textContent, c ? equipRarityLabel(c) : '', s.querySelectorAll('.cd-chip').length, cr ? [Math.round(sr.right - cr.right), Math.round(cr.top - sr.top), Math.round(cr.height), (chip.getAttribute('aria-label') || '')] : null]; });
      // THE PLAYER'S TWO SLOTS: Universal cards only; not the same twice
      var ps = $$('#cardsRoot .cd-pbtn'); out.pslots = ps.length; click(ps[0]); await wait(60);
      var lst = function(){ return $$('#cardsRoot .cd-plist .cd-btn').map(function(b){ return [b.querySelector('.cd-bl').textContent, b.disabled]; }); };
      out.pList0 = lst(); click(byText('#cardsRoot .cd-plist .cd-btn', 'TEST · UNIVERSAL A')); await wait(60);
      out.pAfter = equipPlayer.slice(); out.pShown = ($$('#cardsRoot .cd-pbtn .cd-pv')[0] || {}).textContent; out.pChips = $$('#cardsRoot .cd-pbtn').map(function(b){ var c = b.querySelector('.cd-chip.mini'); return c ? c.querySelectorAll('i.on').length : -1; });
      click($$('#cardsRoot .cd-pbtn')[1]); await wait(60); out.pList1 = lst(); click(byText('#cardsRoot .cd-plist .cd-btn', 'TEST · UNIVERSAL B')); await wait(60); out.pAfter2 = equipPlayer.slice();
      // CLOSE, and the key
      click($('#cardsRoot .cd-close')); await wait(60); out.closed = { cls: $('#cardsRoot').className, body: document.body.classList.contains('cardsOpen'), hud: shown($('#topToggles')) };
      click(btn); await wait(100); window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })); await wait(60); out.escaped = $('#cardsRoot').className;
      // UNLOCK: two taps, the flat price, kept
      cardsOpen(); await wait(60); var locked = $$('#cardsRoot .cd-grid .cd-card.locked');
      if (locked.length) {
        var before = shardCount, lc = $$('#cardsRoot .cd-grid .cd-card.locked')[0], nm = lc.querySelector('.cd-name').textContent, id = Object.values(equipCards()).filter(function(x){ return x.name === nm; })[0].id;
        click(lc.querySelector('.cd-btn')); await wait(60); lc = $$('#cardsRoot .cd-grid .cd-card').filter(function(s){ return s.querySelector('.cd-name').textContent === nm; })[0]; out.arm = { label: lc.querySelector('.cd-bl').textContent, shards: shardCount - before, owned: equipOwns(id) };
        click(lc.querySelector('.cd-btn')); await wait(60); out.unlock = { shards: before - shardCount, owned: equipOwns(id), stored: localStorage.getItem('conduit_fp_cards') };
      }
      cardsClose();
      // THE ROSTER: the creature in view's SUBCLASS and its two slots
      var f = followers[0]; f.evolved = 'quillstone'; f.role = 'brawler'; f.element = 'fire'; f.cards = undefined;
      selectedUnits.clear(); ccOpen('roster'); await wait(300); _ccFocus = f; ccRender(); await wait(60);
      var rows = function(){ return $$('#ccSide .cc-stat').map(function(r){ return [r.querySelector('.cc-stat-k').textContent, r.querySelector('.cc-stat-v').textContent]; }); };
      out.ro = { dds: $$('#ccSide .cc-dd .cc-dd-k').map(function(e){ return e.textContent; }), sub: rows().filter(function(r){ return r[0] === 'SUBCLASS'; })[0], chip: ($('#ccFocus .cf-sc') || {}).textContent, chipShown: shown($('#ccFocus .cf-sc')) };
      click(byText('#ccSide .cc-dd', 'CARD 1')); await wait(60);
      var opts = function(){ return $$('#ccSide .cc-dd-list .cc-btn').map(function(b){ var n = b.querySelector('.cc-bl').textContent, c = Object.values(equipCards()).filter(function(x){ return x.name === n; })[0], ch = b.querySelector('.cd-chip.mini'); return [n, b.disabled, (b.querySelector('.cc-bs') || {}).textContent || '', ch ? ch.querySelectorAll('i.on').length + '/' + ch.querySelectorAll('i').length : '', c ? String(equipRarityBars(c)) + '/6' : '']; }); };
      out.ro.opts1 = opts(); click(byText('#ccSide .cc-dd-list .cc-btn', 'TEST · FIRE')); await wait(60); out.ro.cards1 = f.cards ? f.cards.slice() : null; out.ro.closedAfter = $$('#ccSide .cc-dd-list').length;
      click(byText('#ccSide .cc-dd', 'CARD 2')); await wait(60); out.ro.opts2 = opts(); click(byText('#ccSide .cc-dd-list .cc-btn', 'TEST · BRAWLER')); await wait(60); out.ro.cards2 = f.cards ? f.cards.slice() : null;
      out.ro.values = $$('#ccSide .cc-dd .cc-dd-v').map(function(e){ return e.textContent; }); out.ro.headChips = $$('#ccSide .cc-dd').filter(function(d){ return /^CARD/.test(d.querySelector('.cc-dd-k').textContent); }).map(function(d){ var c = d.querySelector('.cd-chip.mini'); return c ? c.querySelectorAll('i.on').length + '/' + c.querySelectorAll('i').length : ''; });
      click(byText('#ccSide .cc-dd', 'CARD 1')); await wait(60); click(byText('#ccSide .cc-dd-list .cc-btn', 'EMPTY')); await wait(60); out.ro.cards3 = f.cards ? f.cards.slice() : null;
      // an egg, and a retired form
      var g = followers[1]; g.evolved = undefined; _ccFocus = g; ccRender(); await wait(60); out.egg = { sub: rows().filter(function(r){ return r[0] === 'SUBCLASS'; })[0], chipShown: shown($('#ccFocus .cf-sc')) };
      g.evolved = 'bloom'; g.element = 'fire'; g.role = 'brawler'; _ccFocus = g; ccRender(); await wait(60); out.legacy = { sub: rows().filter(function(r){ return r[0] === 'SUBCLASS'; })[0], chipShown: shown($('#ccFocus .cf-sc')) };
      ccClose();
    } else if (out.any && out.wide) {
      // THE REAL CARDS, no switch: the sheet lists the six, all locked (nothing is owned yet), each with its rarity chip; the roster's slots have no card in the hand to offer
      click(btn); await wait(200);
      var rs = $$('#cardsRoot .cd-grid .cd-card');
      out.real = { slabs: rs.length, locked: $$('#cardsRoot .cd-grid .cd-card.locked').length, names: rs.map(function(s){ return s.querySelector('.cd-name').textContent; }), kinds: rs.map(function(s){ return s.querySelector('.cd-kind').textContent; }), texts: rs.map(function(s){ return s.querySelector('.cd-text').textContent; }),
          rars: rs.map(function(s){ return s.querySelector('.cd-rar').textContent; }), lit: rs.map(function(s){ return s.querySelectorAll('.cd-chip i.on').length + '/' + s.querySelectorAll('.cd-chip i').length; }), buttons: rs.map(function(s){ return s.querySelector('.cd-btn .cd-bl').textContent; }), summary: ($('#cardsRoot .cd-summary') || {}).textContent, start: $('#cardsRoot .cd-banner') ? 1 : 0 };
      click($('#cardsRoot .cd-close')); await wait(60);
      _equipReg = {}; await emptyProbe(); _equipReg = null; equipReset();
    } else if (!out.any) {
      // NO CARD: the button, the sheet and the slots are all there, and say so
      await emptyProbe();
    } else if (!out.wide) {
      // A PHONE: no dock, and its roster has no slots yet
      out.phone = { dock: shown($('#topToggles')) };
      selectedUnits.clear(); ccOpen('roster'); await wait(300); ccRender(); out.phone.dds = $$('#ccSide .cc-dd .cc-dd-k').map(function(e){ return e.textContent; }); out.phone.sub = $$('#ccSide .cc-stat-k').map(function(e){ return e.textContent; }).indexOf('SUBCLASS'); ccClose();
    }
  } catch (err) { out.err = String(err && err.stack || err); }
  var pre = document.createElement('pre'); pre.id = '__cd'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2500); });</script></body>`;
// `seed`: storage written before the game starts (a collection left by earlier runs)
function measure(w, h, query, seed) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cd-')), file = path.join(dir, 'game.html');
    const pre = seed ? '<script>try { ' + Object.keys(seed).map(k => 'localStorage.setItem(' + JSON.stringify(k) + ', ' + JSON.stringify(seed[k]) + ');').join(' ') + ' } catch (e) {}</script>' : '';
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">' + pre).replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=60000', '--dump-dom', 'file://' + file + (query || '')], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000 }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__cd">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const G = await boot('?cards', {}), run = G.run, J = G.J;

    group('1. THE SUBCLASS TAG (five; the user\'s roster chart)');
    await check('the five: crustacean, mollusk, elemental, drone and jelly (Jelly is the fifth, beside the four first asked for)', () => {
        const r = J('EQUIP_SUBCLASSES.map(function(s){ return s.id; })'); same(r.join(), 'crustacean,mollusk,elemental,drone,jelly', 'the subclasses');
        same(J('EQUIP_SUBCLASSES.map(function(s){ return s.label; })').join(), 'CRUSTACEAN,MOLLUSK,ELEMENTAL,DRONE,JELLY', 'their names');
    });
    await check('each of the 18 forms has the subclass the chart gives it (by name); the ten retired forms have none; nothing else is in the table', () => {
        const forms = J('Object.values(EVOLUTIONS).map(function(e){ return { id: e.id, name: e.name, legacy: !!e.legacy, sub: equipSubclassOf({ evolved: e.id }) }; })');
        const live = forms.filter(f => !f.legacy), legacy = forms.filter(f => f.legacy);
        same(live.length, 18, 'forms in play'); same(legacy.length, 10, 'retired forms');
        for (const f of live) same(f.sub, CHART[f.name], f.name + '\'s subclass');
        for (const f of legacy) same(f.sub, null, f.name + ' (retired) has a subclass');
        same(Object.keys(CHART).length, 18, 'the chart'); same(J('Object.keys(EQUIP_FORM_SUBCLASS).length'), 18, 'the table');
        const ids = J('Object.keys(EQUIP_FORM_SUBCLASS)'); for (const id of ids) ok(live.some(f => f.id === id), id + ' is in the table and is not a form in play');
    });
    await check('the counts: crustacean 2, mollusk 3, elemental 5, drone 5, jelly 3', () => {
        const n = {}; for (const v of Object.values(CHART)) n[v] = (n[v] || 0) + 1;
        same(JSON.stringify(n), JSON.stringify({ crustacean: 2, drone: 5, jelly: 3, elemental: 5, mollusk: 3 }), 'the chart\'s counts');
    });
    await check('an egg has no subclass until it evolves; a follower evolved into a retired form has none; a clone, and nobody, have none', () => {
        const r = J(`(function(){ __fresh(0); const egg = __mk('fire', 'brawler'), old = __mk('fire', 'brawler'); old.evolved = 'bloom'; const q = __form(__mk('fire', 'brawler'), 'quillstone');
            return { egg: equipSubclassOf(egg), old: equipSubclassOf(old), q: equipSubclassOf(q), none: equipSubclassOf(null), clone: equipSubclassOf({ isClone: true, speciesName: 'beetle' }) }; })()`);
        same(r.egg, null, 'an egg'); same(r.old, null, 'a retired form'); same(r.q, 'crustacean', 'a Quillstone'); same(r.none, null, 'nobody'); same(r.clone, null, 'a clone');
    });
    await check('it is only a tag: it changes no stat (a follower\'s health, power and speed are what they were)', () => {
        const r = J(`(function(){ __fresh(0); const f = __form(__mk('fire', 'brawler'), 'quillstone'); initFollowerLevel(f, { level: 12 }); const a = [f.maxHealth, f.power, f.moveSpeed, JSON.stringify(f.stats)]; equipSubclassOf(f); const b = [f.maxHealth, f.power, f.moveSpeed, JSON.stringify(f.stats)];
            return { a, b, keys: Object.keys(f).filter(function(k){ return /sub|card/i.test(k); }) }; })()`);
        same(JSON.stringify(r.a), JSON.stringify(r.b), 'a stat moved'); same(r.keys.length, 0, 'the follower carries something for it: ' + r.keys);
    });

    group('2. THE CARDS: what exists');
    await check('the real cards: the six Crystalline ones (tests/crystalline.js) and Pack 1\'s eighteen (tests/packs.js). The test cards (?cards): nine, one of each kind, every rarity named, none does anything', () => {
        same(J('Object.keys(EQUIP_CARDS).length'), 24, 'real cards'); const t = J('Object.values(EQUIP_TEST_CARDS)'); same(t.length, 9, 'test cards'); same(J('Object.keys(equipCards()).length'), 33, 'the live registry');
        ok(t.every(c => c.bonus === undefined), 'a test card has a bonus');
        const kinds = new Set(t.map(c => c.kind)); same([...kinds].sort().join(), 'class,element,subclass,universal', 'the kinds');
        const subs = J('EQUIP_SUBCLASSES.map(function(s){ return s.id; })'), roles = ['brawler', 'sniper', 'camper'], els = J('ELEMENTS.map(function(e){ return e.id; })'), rar = J('EQUIP_RARITIES.map(function(r){ return r.id; })');
        for (const c of t) {
            ok(/^test_/.test(c.id) && c.id === Object.keys(J('EQUIP_TEST_CARDS')).find(k => k === c.id) && c.test === true, c.id + ' is not marked a test card'); ok(rar.includes(c.rarity), c.id + ' has a rarity that is not named');
            if (c.kind === 'element') ok(els.includes(c.match), c.id + ' matches an element that is not'); if (c.kind === 'class') ok(roles.includes(c.match), c.id + ' matches a role that is not');
            if (c.kind === 'subclass') ok(subs.includes(c.match), c.id + ' matches a subclass that is not'); if (c.kind === 'universal') ok(c.match === null, c.id + ' matches something');
            ok(/NOTHING/.test(c.text), c.id + ' does not say it does nothing');
        }
        same(rar.join(), 'unrefined,refined,precision,prototype,lustrous,crystalline', 'the rarity names, lowest first');
        same(new Set(t.map(c => c.rarity)).size >= 5, true, 'the test cards spread over the rarities');
    });
    const Q = await boot('', {});
    await check('without ?cards: the registry is the real cards (24) and no test card, equipAny is true, and a test card cannot be unlocked, taken or worn', () => {
        same(Q.J('Object.keys(equipCards()).length'), 24, 'cards'); same(Q.J('equipAny()'), true, 'any'); same(Q.J('equipDev'), '', 'the switch'); same(Q.J('Object.keys(equipCards()).some(function(id){ return /^test_/.test(id); })'), false, 'a test card is in the registry');
        const r = Q.J(`(function(){ shardCount = 5000; const a = equipUnlock('test_fire'), b = equipHandAdd('test_fire'), f = __mk('fire', 'brawler'); return { a, b, put: equipPut(f, 0, 'test_fire'), why: equipUnlockWhyNot('test_fire'), shards: shardCount, run: equipRunStart(), owned: equipOwnedList().length }; })()`);
        same(r.a, false, 'unlocked a card that does not exist'); same(r.b, false, 'a card that does not exist went into the hand'); same(r.put, false, 'a card that does not exist was put on'); same(r.shards, 5000, 'it cost something'); same(r.run, false, 'a run began with a choice to make'); same(r.owned, 0, 'owned');
    });
    await check('?cards=all: every card (the 24 real and the nine test) is owned and in the hand, to try the screens by hand; none of that is ever saved', async () => {
        const store = {}, A = await boot('?cards=all', store);
        const r = A.J(`(function(){ shardCount = 5000; const own = equipOwnedList().length, hand = equipHand.length, un = equipUnlock('test_fire'), w = equipWriteOwned(); const off = equipHandRemove('test_fire'), on = equipHandAdd('test_fire'); equipHand.length = 0; equipReset(); return { dev: equipDev, own, hand, un, w, off, on, again: equipHand.length, keys: Object.keys(equipCards()).length, shards: shardCount }; })()`);
        same(r.dev, 'all', 'the switch'); same(r.own, 33, 'owned'); same(r.hand, 33, 'in the hand'); same(r.un, false, 'it unlocked a card it already owns'); same(r.w, false, 'it wrote the collection'); same(r.again, 33, 'a fresh run\'s hand'); same(r.shards, 5000, 'it cost something'); same(r.off && r.on, true, 'a card put back could not be taken again (the hand has no limit here)');
        same(Object.keys(store).filter(k => /cards/.test(k)).length, 0, 'it saved something: ' + Object.keys(store));
    });

    group('3. TWO SLOTS ON EVERY FOLLOWER, AND THE RULES FOR A CARD');
    run(`globalThis.__hand = ids => { equipHand.length = 0; for (const id of ids) equipHand.push(id); };`);
    await check('every follower has two slots (a clone has none); both are empty to begin with; a follower\'s cards are its own and only a field of it', () => {
        const r = J(`(function(){ const fs = __fresh(3); const k = { slots: fs.map(f => equipSlots(f).length), empty: fs.every(f => equipSlots(f).every(x => x === null)), worn: fs.map(equipWorn).join(), n: EQUIP.followerSlots, pn: EQUIP.playerSlots }; return k; })()`);
        same(r.slots.join(), '2,2,2', 'slots'); same(r.empty, true, 'not empty'); same(r.worn, '0,0,0', 'worn'); same(r.n, 2, 'EQUIP.followerSlots'); same(r.pn, 2, 'EQUIP.playerSlots');
    });
    await check('a card fits by its kind: ELEMENT (that element), CLASS (that role), SUBCLASS (that subclass, so an egg takes none), UNIVERSAL (anyone); the reason is said', () => {
        const r = J(`(function(){ __fresh(0); __hand(Object.keys(equipCards())); const f = __form(__mk('fire', 'brawler'), 'quillstone'), egg = __mk('fire', 'brawler'), ice = __mk('ice', 'sniper'), t = __form(__mk('fire', 'camper'), 'thermite'); const w = (u, id) => equipWhyNot(u, id, 0);
            return { fire: [w(f, 'test_fire'), w(ice, 'test_fire')], iceCard: [w(f, 'test_ice'), w(ice, 'test_ice')], cls: [w(f, 'test_brawler'), w(f, 'test_mage'), w(ice, 'test_mage'), w(t, 'test_technician'), w(ice, 'test_technician')],
              sub: [w(f, 'test_crustacean'), w(f, 'test_drone'), w(t, 'test_drone'), w(egg, 'test_crustacean'), w(egg, 'test_drone')], uni: [w(f, 'test_universal_a'), w(egg, 'test_universal_a'), w(ice, 'test_universal_b')] }; })()`);
        same(r.fire[0], null, 'a fire card on a fire follower'); same(r.fire[1], 'FOR FIRE FOLLOWERS', 'a fire card on an ice one'); same(r.iceCard[0], 'FOR ICE FOLLOWERS', 'an ice card on a fire follower'); same(r.iceCard[1], null, 'an ice card on an ice one');
        same(r.cls[0], null, 'a brawler card on a brawler'); same(r.cls[1], 'FOR MAGES', 'a mage card on a brawler'); same(r.cls[2], null, 'a mage card on a mage (the code\'s "sniper")'); same(r.cls[3], null, 'a technician card on a technician (the "camper")'); same(r.cls[4], 'FOR TECHNICIANS', 'a technician card on a mage');
        same(r.sub[0], null, 'a crustacean card on a Quillstone'); same(r.sub[1], 'FOR DRONES', 'a drone card on a Quillstone'); same(r.sub[2], null, 'a drone card on a Thermite Burrower'); same(r.sub[3], 'FOR CRUSTACEANS · EVOLVE FIRST', 'a subclass card on an egg'); same(r.sub[4], 'FOR DRONES · EVOLVE FIRST', 'a drone card on an egg');
        same(r.uni.join(), ',,', 'a universal card is for anyone');
    });
    await check('a card is worn from the hand only; the same card cannot be on both of one follower\'s slots; any number of followers can wear the same card (it is a type, never used up)', () => {
        const r = J(`(function(){ const fs = __fresh(3); fs.forEach(f => { f.element = 'fire'; f.role = 'brawler'; }); __hand([]); const o = {}; o.outOfHand = equipPut(fs[0], 0, 'test_fire'); __hand(['test_fire', 'test_brawler']);
            o.a = equipPut(fs[0], 0, 'test_fire'); o.dupOther = equipPut(fs[0], 1, 'test_fire'); o.sameSlot = equipPut(fs[0], 0, 'test_fire'); o.b = equipPut(fs[0], 1, 'test_brawler'); o.cards = equipSlots(fs[0]);
            o.second = equipPut(fs[1], 0, 'test_fire'); o.third = equipPut(fs[2], 1, 'test_fire'); o.wearers = equipWearers('test_fire'); o.badSlot = equipPut(fs[0], 2, 'test_fire'); o.clone = equipPut({ isClone: true }, 0, 'test_fire');
            o.swap = equipPut(fs[0], 0, 'test_brawler'); o.afterSwap = equipSlots(fs[0]); o.off = equipPut(fs[0], 0, null); o.offAgain = equipPut(fs[0], 0, null); o.afterOff = equipSlots(fs[0]); o.hasField = fs[0].cards !== undefined; return o; })()`);
        same(r.outOfHand, false, 'a card not in the hand was worn'); same(r.a, true, 'a card in the hand was refused'); same(r.dupOther, false, 'the same card on both slots'); same(r.sameSlot, false, 'putting it again changed something');
        same(r.b, true, 'a second card was refused'); same(r.cards.join(), 'test_fire,test_brawler', 'the slots'); same(r.second, true, 'a second follower could not wear it'); same(r.third, true, 'a third follower could not'); same(r.wearers, 3, 'wearers');
        same(r.badSlot, false, 'a third slot'); same(r.clone, false, 'a clone wore one'); same(r.swap, false, 'a brawler card went on the slot that already has the other slot\'s'); same(r.afterSwap.join(), 'test_fire,test_brawler', 'the swap changed the slots');
        same(r.off, true, 'it did not come off'); same(r.offAgain, false, 'an empty slot changed'); same(r.afterOff.join(), ',test_brawler', 'the slots after'); same(r.hasField, true, 'the second card went with the first');
    });
    await check('both slots empty: the follower carries no field at all (nothing is left behind)', () => {
        const r = J(`(function(){ const f = __fresh(1)[0]; f.element = 'fire'; __hand(['test_fire']); equipPut(f, 1, 'test_fire'); const had = f.cards !== undefined; equipPut(f, 1, null); return { had, now: f.cards === undefined, rec: equipRecord(f) === undefined }; })()`);
        same(r.had, true, 'it was not worn'); same(r.now, true, 'a field was left'); same(r.rec, true, 'a record was made for nothing');
    });
    await check('the hand: up to three, from the collection only; a card put back comes off everyone at once (the tick would do it a half second later)', () => {
        const r = J(`(function(){ const fs = __fresh(2); fs.forEach(f => { f.element = 'fire'; f.role = 'brawler'; }); equipHand.length = 0; const o = {}; o.notOwned = equipHandAdd('test_fire');
            ['test_fire', 'test_brawler', 'test_universal_a', 'test_universal_b'].forEach(id => equipOwnedSet().add(id)); o.add = ['test_fire', 'test_brawler', 'test_universal_a', 'test_universal_b'].map(id => equipHandAdd(id)); o.hand = equipHand.slice(); o.twice = equipHandAdd('test_fire'); o.max = EQUIP.startPick;
            equipPut(fs[0], 0, 'test_fire'); equipPut(fs[1], 1, 'test_fire'); equipPlayerPut(0, 'test_universal_a'); o.before = equipWearers('test_fire'); o.back = equipHandRemove('test_fire'); o.after = equipWearers('test_fire'); o.f0 = equipSlots(fs[0]).join('|'); o.backAgain = equipHandRemove('test_fire');
            equipHandRemove('test_universal_a'); o.player = equipPlayer.slice(); return o; })()`);
        same(r.notOwned, false, 'a card not owned went into the hand'); same(r.add.join(), 'true,true,true,false', 'the hand holds ' + r.max); same(r.hand.length, 3, 'hand'); same(r.twice, false, 'twice'); same(r.max, 3, 'EQUIP.startPick');
        same(r.before, 2, 'before'); same(r.back, true, 'put back'); same(r.after, 0, 'a card out of the hand is still worn'); same(r.f0, '|', 'the slot'); same(r.backAgain, false, 'put back twice'); same(r.player.join(), ',', 'the player\'s slot kept a card that left the hand');
    });
    await check('the player: two slots, Universal cards only, from the hand, not the same one twice', () => {
        const r = J(`(function(){ __hand(['test_universal_a', 'test_universal_b', 'test_fire']); equipPlayer = [null, null]; const o = {}; o.n = equipPlayer.length; o.fire = equipPlayerPut(0, 'test_fire'); o.fireWhy = equipPlayerWhyNot('test_fire', 0); o.a = equipPlayerPut(0, 'test_universal_a');
            o.dup = equipPlayerPut(1, 'test_universal_a'); o.dupWhy = equipPlayerWhyNot('test_universal_a', 1); o.b = equipPlayerPut(1, 'test_universal_b'); o.slots = equipPlayer.slice(); o.noHand = equipPlayerPut(0, 'test_ice'); o.third = equipPlayerPut(2, 'test_universal_a');
            o.off = equipPlayerPut(0, null); o.offAgain = equipPlayerPut(0, null); o.rec = equipSaveCollect(); return o; })()`);
        same(r.n, 2, 'slots'); same(r.fire, false, 'a fire card on the player'); same(r.fireWhy, 'UNIVERSAL CARDS ONLY', 'the reason'); same(r.a, true, 'a Universal card'); same(r.dup, false, 'the same card twice'); same(r.dupWhy, 'ALREADY IN THE OTHER SLOT', 'the reason');
        same(r.b, true, 'a second'); same(r.slots.join(), 'test_universal_a,test_universal_b', 'slots'); same(r.noHand, false, 'a card not in the hand'); same(r.third, false, 'a third slot'); same(r.off, true, 'take off'); same(r.offAgain, false, 'take off an empty slot');
        same(JSON.stringify(r.rec), JSON.stringify({ hand: ['test_universal_a', 'test_universal_b', 'test_fire'], found: [], player: [null, 'test_universal_b'] }), 'what the save would keep');
    });
    await check('the tick takes off what no longer fits: a role switched (a class card), a card put out of the hand, a card that is on both slots, a card the registry does not have; every EQUIP.every frames, and at once when forced', () => {
        const r = J(`(function(){ const f = __fresh(1)[0]; f.element = 'fire'; f.role = 'brawler'; delete f.evolved; __hand(['test_brawler', 'test_fire', 'test_universal_a']); const o = {};
            equipPut(f, 0, 'test_brawler'); equipPut(f, 1, 'test_fire'); f.role = 'sniper'; frame = 1; equipTick(); o.notYet = equipSlots(f).join('|'); frame = EQUIP.every * 4; equipTick(); o.afterTick = equipSlots(f).join('|');
            f.cards = ['test_fire', 'test_fire']; equipTick(true); o.dup = equipSlots(f).join('|'); f.cards = ['gone_card', 'test_fire']; equipTick(true); o.unknown = equipSlots(f).join('|'); f.cards = ['test_universal_a', null]; __hand([]); frame = EQUIP.every * 5; equipTick(); o.outOfHand = f.cards === undefined;
            return o; })()`);
        same(r.notYet, 'test_brawler|test_fire', 'it ran between its beats'); same(r.afterTick, '|test_fire', 'a brawler card stayed on a mage'); same(r.dup, 'test_fire|', 'the same card on both slots'); same(r.unknown, '|test_fire', 'a card the registry does not have'); same(r.outOfHand, true, 'a card left the hand and stayed on');
    });

    group('4. UNLOCKING, AND THE COLLECTION THAT NEW GAME DOES NOT TOUCH');
    await check('a card costs a flat ◆1,000 of the run\'s shards, once: short of it nothing is spent and it says how short; at it, the shards are paid, the card is owned, kept at conduit_fp_cards, and it says so', () => {
        const store = {}; return boot('?cards', store).then(B => {
            const r = B.J(`(function(){ const o = {}; o.cost = EQUIP.unlockCost; o.key = EQUIP.key; shardCount = 999; o.why = equipUnlockWhyNot('test_fire'); o.short = equipUnlock('test_fire'); o.kept = shardCount; shardCount = 1000; floatingTexts.length = 0; o.ok = equipUnlock('test_fire'); o.paid = shardCount;
                o.owns = equipOwns('test_fire'); o.said = floatingTexts.map(t => t.text).join('|'); o.again = equipUnlock('test_fire'); o.againWhy = equipUnlockWhyNot('test_fire'); o.paid2 = shardCount; shardCount = 5000; o.other = equipUnlock('test_ice'); o.after = shardCount; o.none = equipUnlock('nope'); o.list = equipOwnedList().map(c => c.id); return o; })()`);
            same(r.cost, 1000, 'the price'); same(r.key, 'conduit_fp_cards', 'the key'); same(r.why, 'NEED ◆1 MORE', 'the reason'); same(r.short, false, 'unlocked short of it'); same(r.kept, 999, 'something was spent'); same(r.ok, true, 'could not unlock with exactly enough'); same(r.paid, 0, 'the price');
            same(r.owns, true, 'owned'); ok(/CARD UNLOCKED · TEST · FIRE/.test(r.said), 'it said: ' + r.said); same(r.again, false, 'unlocked twice'); same(r.againWhy, 'ALREADY UNLOCKED', 'the reason'); same(r.paid2, 0, 'it cost again'); same(r.other, true, 'another card'); same(r.after, 4000, 'its price'); same(r.none, false, 'a card that is not');
            same(r.list.join(), 'test_fire,test_ice', 'the collection'); const kept = JSON.parse(store.conduit_fp_cards); same(kept.v, 1, 'its version'); same(kept.owned.join(), 'test_fire,test_ice', 'what is kept');
        });
    });
    await check('NEW GAME throws the run away and not the collection: the save goes, conduit_fp_cards stays; a game that is started again is a fresh run with an empty hand and the same collection', async () => {
        const store = {}, B = await boot('?cards', store);
        B.run(`shardCount = 3000; equipUnlock('test_fire'); equipUnlock('test_universal_a'); equipHandAdd('test_fire'); equipHandAdd('test_universal_a'); equipPlayerPut(0, 'test_universal_a'); facilitySaveWrite();`);
        ok(store.conduit_fp_save && store.conduit_fp_cards, 'the save and the collection were not both written: ' + Object.keys(store));
        B.run('facilitySaveClear()'); same(store.conduit_fp_save, undefined, 'the save stayed'); ok(JSON.parse(store.conduit_fp_cards).owned.length === 2, 'the collection did not stay');
        const C = await boot('?cards', store), r = C.J('({ owned: equipOwnedList().map(c => c.id), hand: equipHand, player: equipPlayer })');
        same(r.owned.join(), 'test_fire,test_universal_a', 'the collection after NEW GAME'); same(r.hand.length, 0, 'the hand carried over'); same(r.player.join(), ',', 'the slots carried over');
    });
    await check('a collection is not the run: a game that starts fresh with a collection asks for the hand (equipRunStart); one with none asks nothing; ?cards=all asks nothing', async () => {
        const store = { conduit_fp_cards: JSON.stringify({ v: 1, owned: ['test_fire', 'test_ice'] }) }, B = await boot('?cards', store);
        same(B.J('equipOwnedList().map(c => c.id)').join(), 'test_fire,test_ice', 'the collection read back');
        B.run(`globalThis.__asked = []; globalThis.cardsOpen = function(o){ __asked.push(JSON.stringify(o)); return true; };`);
        same(B.J('equipRunStart()'), true, 'it did not ask'); same(B.J('__asked').join(), '{"start":true}', 'what it asked for');
        const Z = await boot('?cards', {}); Z.run(`globalThis.cardsOpen = function(){ globalThis.__n = (globalThis.__n || 0) + 1; return true; };`); same(Z.J('equipRunStart()'), false, 'it asked with nothing to choose from'); same(Z.J('globalThis.__n || 0'), 0, 'it opened the screen');
        const A = await boot('?cards=all', {}); A.run(`globalThis.cardsOpen = function(){ globalThis.__n = (globalThis.__n || 0) + 1; return true; };`); same(A.J('equipRunStart()'), false, '?cards=all asked'); same(A.J('globalThis.__n || 0'), 0, '?cards=all opened the screen');
        const Ph = await boot('?cards', store); Ph.run(`innerWidth = 390; globalThis.cardsOpen = function(){ globalThis.__n = (globalThis.__n || 0) + 1; return true; };`); same(Ph.J('equipRunStart()'), false, 'a phone was asked to choose a hand'); same(Ph.J('globalThis.__n || 0'), 0, 'a phone has no cards screen to open');
        ok(/if \(!away && !saved && typeof equipRunStart === "function"\) equipRunStart\(\);/.test(rd('js/facilityplay.js')), 'a fresh game (no saved one, not the website\'s background) is where the hand is asked for');
    });

    group('5. THE LIFE OF A FOLLOWER\'S CARDS');
    run(`globalThis.__wear = f => { f.element = 'fire'; f.role = 'brawler'; __hand(['test_fire', 'test_brawler', 'test_universal_a']); equipPut(f, 0, 'test_fire'); equipPut(f, 1, 'test_brawler'); return f; };
         globalThis.__fall = (f, forGood) => { f.spawnProtection = 0; if (forGood) f.base.hp = 1; const foe = { x: f.x + 1, y: f.y, team: 'red' }; for (let i = 0; i < 20 && !f.dead; i++) applyDamage(f, f.maxHealth, foe); render(); render(); };`);
    await check('a follower that falls and comes back at the Crystal comes back with its cards (the same person, the same uid), and with the role it had: an egg switched to another ATTACK STYLE keeps it, so its Class card stays on', () => {
        const r = J(`(function(){ const f = __fresh(1)[0]; f.element = 'fire'; delete f.evolved; const own = assignRole(applyPersonality(f.personality)); f.role = own === 'camper' ? 'brawler' : 'camper'; const picked = f.role; __hand(['test_fire', 'test_brawler', 'test_technician']);
            equipPut(f, 0, 'test_fire'); equipPut(f, 1, picked === 'camper' ? 'test_technician' : 'test_brawler'); const worn = equipSlots(f).join('|'); const uid = followerUid(f); __fall(f, false); const q = respawnQueue.filter(e => !e.isClone)[0]; const queued = q && q.cards ? q.cards.join('|') : null; __frames(260);
            equipTick(true); const back = followers.filter(x => followerUid(x) === uid)[0]; return { worn, queued, back: !!back, cards: back ? equipSlots(back).join('|') : null, old: f.dead, picked, role: back ? back.role : null }; })()`);
        same(r.old, true, 'it did not fall'); same(r.queued, r.worn, 'the respawn entry'); same(r.back, true, 'it did not come back'); same(r.role, r.picked, 'the attack style it was switched to was forgotten'); same(r.cards, r.worn, 'its cards on the way back (the Class card with them)');
    });
    await check('an evolved follower comes back as its form (the form\'s role); a follower with no role on record gets one from its personality, as it always did', () => {
        const game = rd('js/game.js'); ok(/const role        = _evo && _evo\.role \? _evo\.role : \(entry\.role \|\| assignRole\(stats\)\);/.test(game), 'the respawn\'s role is not the form\'s, else the one it had, else its personality\'s');
        const r = J(`(function(){ const f = __fresh(1)[0]; __form(f, 'quillstone'); f.element = 'fire'; const uid = followerUid(f); __fall(f, false); __frames(260); const back = followers.filter(x => followerUid(x) === uid)[0]; return { role: back && back.role, evolved: back && back.evolved }; })()`);
        same(r.evolved, 'quillstone', 'the form'); same(r.role, 'brawler', 'the form\'s role');
    });
    await check('falling for good: the slots are empty, the preserved body keeps none, and a body restored later has empty slots', () => {
        const r = J(`(function(){ const f = __wear(__fresh(1)[0]); __fall(f, true); const body = cloneBodies.filter(b => b.kind === 'follower')[0]; const o = { body: !!body, recCards: body ? body.rec.cards : 'no body', worn: equipWorn(f), queued: respawnQueue.filter(e => !e.isClone).length };
            const back = spawnFollowerFromSave(body.rec); o.restored = equipSlots(back).join('|'); o.restoredField = back.cards === undefined; return o; })()`);
        same(r.body, true, 'no body'); same(r.recCards, undefined, 'the body kept its cards'); same(r.worn, 0, 'the fallen one still wears them'); same(r.queued, 0, 'it was queued to come back'); same(r.restored, '|', 'the restored body\'s slots'); same(r.restoredField, true, 'a field was left');
    });
    await check('EXILE empties the slots at once (the card is still in the hand: nothing is lost) and nothing is saved for the exiled', () => {
        const r = J(`(function(){ const fs = __fresh(3), f = __wear(fs[0]), g = __wear(fs[1]); const had = equipWearers('test_fire'); const ok = partyExile(f, true); return { had, ok, worn: equipWorn(f), field: f.cards === undefined, wearers: equipWearers('test_fire'), inHand: equipInHand('test_fire'), saved: facilitySaveCollect().followers.filter(e => e.cards).length, other: equipSlots(g).join('|') }; })()`);
        same(r.had, 2, 'before'); same(r.ok, true, 'exile'); same(r.worn, 0, 'the exiled still wear them'); same(r.field, true, 'a field was left'); same(r.wearers, 1, 'the other still wears it'); same(r.inHand, true, 'the card left the hand'); same(r.saved, 1, 'the save keeps the other\'s only'); same(r.other, 'test_fire|test_brawler', 'the other\'s cards');
    });
    await check('a RE-ROLL empties the slots (someone new comes back to the Crystal); the cards are still in the hand', () => {
        const r = J(`(function(){ const f = __wear(__fresh(1)[0]); const ok = startFollowerReroll(f, true); return { ok, worn: equipWorn(f), field: f.cards === undefined, inHand: equipInHand('test_fire') }; })()`);
        same(r.ok, true, 're-roll'); same(r.worn, 0, 'still worn'); same(r.field, true, 'a field'); same(r.inHand, true, 'the hand');
    });
    await check('EVOLVING keeps the cards (the element and the role are the form\'s own); a subclass card, which an egg could not wear, is worn once it has evolved', () => {
        const r = J(`(function(){ const f = __wear(__fresh(1)[0]); delete f.evolved; __hand(['test_fire', 'test_brawler', 'test_crustacean']); const egg = equipWhyNot(f, 'test_crustacean', 0); __form(f, 'quillstone'); const fit = equipWhyNot(f, 'test_crustacean', 0); equipTick(true); return { egg, fit, kept: equipSlots(f).join('|'), put: equipPut(f, 0, 'test_crustacean'), now: equipSlots(f).join('|') }; })()`);
        same(r.egg, 'FOR CRUSTACEANS · EVOLVE FIRST', 'an egg'); same(r.fit, null, 'evolved'); same(r.kept, 'test_fire|test_brawler', 'evolving took them off'); same(r.put, true, 'put'); same(r.now, 'test_crustacean|test_brawler', 'now');
    });

    group('6. THE SAVE (additive: FS.version stays 1, an old save still loads)');
    await check('a follower\'s record carries its cards and a follower built from it wears them; through JSON; nothing in it when nothing is worn', () => {
        const r = J(`(function(){ const f = __wear(__fresh(1)[0]); const rec = JSON.parse(JSON.stringify(followerRecord(f))); const back = followerBuild(rec); const bare = followerRecord(__fresh(1)[0]);
            return { rec: rec.cards, back: equipSlots(back).join('|'), bare: bare.cards === undefined, keys: Object.keys(bare).includes('cards') }; })()`);
        same(r.rec.join('|'), 'test_fire|test_brawler', 'the record'); same(r.back, 'test_fire|test_brawler', 'the follower built from it'); same(r.bare, true, 'a record for nothing worn carries cards');
    });
    await check('the run\'s save carries the hand and the player\'s slots; FS.version is still 1', () => {
        const r = J(`(function(){ __hand(['test_universal_a', 'test_fire']); equipPlayer = ['test_universal_a', null]; const d = JSON.parse(JSON.stringify(facilitySaveCollect())); return { cards: d.cards, v: d.v, version: FS.version, key: FS.key }; })()`);
        same(JSON.stringify(r.cards), JSON.stringify({ hand: ['test_universal_a', 'test_fire'], found: [], player: ['test_universal_a', null] }), 'cards'); same(r.v, 1, 'the save\'s version'); same(r.version, 1, 'FS.version'); same(r.key, 'conduit_fp_save', 'FS.key');
    });
    await check('a game is saved with its cards and comes back with them: the followers\' cards, the hand, the player\'s slots; the collection stays its own key', async () => {
        const store = {}, A = await boot('?cards', store);
        A.run(`shardCount = 5000; ['test_fire', 'test_brawler', 'test_universal_a'].forEach(id => equipUnlock(id)); const f = __fresh(2)[0]; f.element = 'fire'; f.role = 'brawler'; ['test_fire', 'test_brawler', 'test_universal_a'].forEach(id => equipHandAdd(id)); equipPut(f, 0, 'test_fire'); equipPut(f, 1, 'test_brawler'); equipPlayerPut(1, 'test_universal_a'); facilitySaveWrite();`);
        ok(store.conduit_fp_save, 'no save was written'); const saved = JSON.parse(store.conduit_fp_save); same(saved.cards.hand.join(), 'test_fire,test_brawler,test_universal_a', 'the hand in the save'); ok(saved.followers.some(e => e.cards && e.cards.join() === 'test_fire,test_brawler'), 'a follower\'s cards are not in the save');
        const B = await boot('?cards', store), r = B.J(`({ hand: equipHand, player: equipPlayer, worn: followers.map(f => equipSlots(f).join('|')), n: followers.length, owned: equipOwnedList().length })`);
        same(r.hand.join(), 'test_fire,test_brawler,test_universal_a', 'the hand after'); same(r.player.join(), ',test_universal_a', 'the player\'s slots after'); ok(r.worn.includes('test_fire|test_brawler'), 'the follower\'s cards after: ' + r.worn); same(r.owned, 3, 'the collection');
    });
    await check('a save made before the cards (no cards anywhere in it) loads as it did: its followers are all there, nothing is worn, the hand is empty, and nothing throws', async () => {
        const store = {}, A = await boot('?cards', store);
        A.run(`__fresh(4); facilitySaveWrite();`); const old = JSON.parse(store.conduit_fp_save); delete old.cards; old.followers.forEach(e => { delete e.cards; });
        const B = await boot('?cards', { conduit_fp_save: JSON.stringify(old) }), r = B.J(`({ n: followers.length, worn: followers.reduce((n, f) => n + equipWorn(f), 0), hand: equipHand.length, player: equipPlayer.join(), loaded: !!facilitySaveLoad() })`);
        same(r.loaded, true, 'the old save was refused'); same(r.n, 4, 'its followers'); same(r.worn, 0, 'worn'); same(r.hand, 0, 'hand'); same(r.player, ',', 'slots');
    });
    await check('a save with a test card in a game with the switch off (?cards off): it is dropped, quietly (the collection keeps its id for when the switch is back on)', async () => {
        const store = {}, A = await boot('?cards', store);
        A.run(`shardCount = 5000; equipUnlock('test_fire'); equipHandAdd('test_fire'); const f = __fresh(1)[0]; f.element = 'fire'; equipPut(f, 0, 'test_fire'); facilitySaveWrite();`);
        const B = await boot('', store); B.run('equipTick(true)');
        same(B.J('followers.length >= 1'), true, 'its followers'); same(B.J('equipCards().test_fire === undefined'), true, 'the test card exists'); same(B.J('followers.reduce((n, f) => n + equipWorn(f), 0)'), 0, 'a card that does not exist is worn'); same(B.J('equipHand.length'), 0, 'a hand without cards');
        same(JSON.parse(store.conduit_fp_cards).owned.join(), 'test_fire', 'the collection lost its ids');
    });

    group('7. NOTHING ELSE MOVED');
    await check('the save has the parts it had and one more (cards); the follower record has the fields it had and one more; the build stamp agrees', () => {
        const keys = Object.keys(JSON.parse(run('JSON.stringify(facilitySaveCollect())'))); ok(keys.includes('cards'), 'cards is not in the save'); ok(keys.includes('followers') && keys.includes('shards') && keys.includes('crystal'), 'the save lost a part');
        const f = JSON.parse(run('JSON.stringify(followerRecord(__wear(__fresh(1)[0])))')); for (const k of ['element', 'personality', 'stats', 'role', 'uid', 'level', 'xp', 'cards']) ok(k in f, 'the record lost ' + k);
    });
    await check('the hooks are one line each and guarded (typeof equip... === "function"): the game runs if a card file were missing', () => {
        const need = { 'js/facilitysave.js': 3, 'js/game.js': 3, 'js/helpers.js': 3, 'js/party.js': 1, 'js/specimen.js': 1, 'js/facilityplay.js': 2, 'js/commandcenter.js': 2, 'js/levels.js': 1, 'js/combat.js': 1 };
        for (const [f, n] of Object.entries(need)) { const hits = (rd(f).match(/typeof (equip\w+) === "function"/g) || []).length; ok(hits >= n, f + ' has ' + hits + ' guarded hooks, ' + n + ' expected'); }
        // a card reaches the fight in four places, each through a guarded function: the stats are made from the base (js/levels.js, equipMult), the rest after an attack (js/combat.js followerRest, equipMult), the damage a follower deals and the effect on a
        // hit (js/helpers.js applyDamage: equipMult, equipOnHit); the elements and the Mage's shot are not touched, and the statuses are the combat code's own (applyBurn and the others are not card functions)
        const calls = f => (rd(f).match(/\bequip\w*\(/g) || []).filter(x => x !== 'equipMult(').join();
        same(calls('js/levels.js') + calls('js/combat.js'), '', 'levels.js or combat.js calls a card function other than equipMult (guarded)'); ok(/typeof equipMult === "function"/.test(rd('js/levels.js')) && /typeof equipMult === "function"/.test(rd('js/combat.js')), 'the two hooks are not guarded');
        ok(!/equip|cards/i.test(rd('js/elements.js')) && !/equip|cards/i.test(rd('js/npc.js').replace(/EQUIP CARDS: \+attack speed shortens the rest, js\/combat\.js followerRest/, '')), 'a card is in the elements or the movement');
    });
    await check('the files are on the page, in the boot check, and the dock has its button (always shown)', () => {
        const html = rd('game.html'), order = scriptOrder(); ok(order.includes('js/cards.js') && order.includes('js/cardsui.js'), 'the scripts are not on the page'); ok(order.indexOf('js/cards.js') < order.indexOf('js/game.js') && order.indexOf('js/cardsui.js') > order.indexOf('js/commandcenter.js'), 'their order');
        ok(/"js\/cards\.js": "EQUIP"/.test(html) && /"js\/cardsui\.js": "cardsOpen"/.test(html), 'the boot check does not probe them'); ok(/id="btnCards" class="top-btn" onclick="cardsToggle\(\)"/.test(html) && !/id="btnCards"[^>]*style="display:none"/.test(html), 'the dock button is not there, or is hidden'); ok(/body\.cardsOpen #topToggles/.test(html), 'the HUD stays over the sheet');
    });

    group('8. THE SCREENS (real browser)');
    const T = measure(1180, 820, '?cards=all');
    if (T === null) console.log('  (no Chromium here: skipped)');
    else {
        await check('the instrument ran (a tablet, ?cards=all)', () => { ok(T, 'the probe produced nothing'); same(T.err, undefined, 'the probe threw'); same(T.dev, 'all', 'the switch'); same(T.wide, true, 'the tablet layout'); same(T.startOpen.indexOf('open') < 0, true, '?cards=all opened the start screen'); });
        if (T && !T.err) {
            await check('the CARDS button is in the dock, shown (there are cards), and opens the sheet over the game: the HUD gives way, the title, the three parts, the count and the shards', () => {
                same(T.btn.there && T.btn.inDock && T.btn.shown, true, 'the button: ' + JSON.stringify(T.btn)); ok(/CARDS/.test(T.btn.label), 'its label ' + T.btn.label);
                same(T.open.cls.indexOf('open') >= 0, true, 'the sheet did not open'); same(T.open.body, true, 'body.cardsOpen'); same(T.open.hudHidden, true, 'the HUD stayed over the sheet'); same(T.open.title, 'CARDS', 'the title');
                same(T.open.secs.join('|'), 'YOUR HAND|YOU|BOOSTER PACK|THE COLLECTION', 'its parts'); same(T.open.slabs, 33, 'the cards'); ok(/HAND 33 · 33 OF 33 UNLOCKED · TEST CARDS \(\?cards\)/.test(T.open.summary), 'the summary: ' + T.open.summary); ok(/^◆ \d+$/.test(T.open.shardsHead), 'the shards: ' + T.open.shardsHead);
            });
            await check('rarity is a CHIP on each card\'s edge: one notched plate with six segments, one lit for each step (illuminated bars), standing on the right edge of the card, with the name of its tier on the card', () => {
                same(T.bars.length, 33, 'slabs'); for (const b of T.bars) {
                    same(b[6], 1, b[0] + ' has not one chip'); same(b[2], 6, b[0] + ' segments'); same(b[1], b[3], b[0] + ' lit segments'); ok(b[3] >= 1 && b[3] <= 6, b[0] + ' rarity'); same(b[4], b[5], b[0] + ' rarity name');
                    ok(b[7] && b[7][0] >= 0 && b[7][0] <= 2, b[0] + '\'s chip is not on the card\'s right edge: ' + JSON.stringify(b[7])); ok(b[7][1] >= 4 && b[7][2] >= 50, b[0] + '\'s chip is not a plate set into the edge: ' + JSON.stringify(b[7])); ok(new RegExp('^RARITY · ' + b[5] + ' · ' + b[3] + ' OF 6$').test(b[7][3]), b[0] + '\'s chip says ' + b[7][3]);
                }
                same(new Set(T.bars.map(b => b[1])).size, 6, 'every step is shown by some card'); const css = rd('game.html'); ok(css.includes('.cd-chip i.on { background: var(--neo-teal); box-shadow'), 'a lit segment is not lit'); ok(/\.cd-chip \{[^}]*clip-path: polygon/.test(css), 'the chip is not a notched plate'); ok(!/cd-bars/.test(css + rd('js/cardsui.js')), 'the old row of bars is still there');
            });
            await check('a slot with a card in it wears the small chip too, and an empty one none', () => {
                same(T.pChips.join(), '2,-1', 'the player\'s slots (a card with two steps, and an empty one)');
            });
            await check('YOU: the player has two slots; each lists the hand (the Universal cards the only ones that can be picked, EMPTY off while empty); a card picked shows; the other slot cannot take the same one', () => {
                same(T.pslots, 2, 'slots'); const en = l => l.filter(x => !x[1]).map(x => x[0]).sort().join('|');
                same(en(T.pList0), 'TEST · UNIVERSAL A|TEST · UNIVERSAL B', 'what the first slot can take'); same(T.pList0.length, 34, 'the list (EMPTY and the 33)'); same(T.pAfter.join(), 'test_universal_a,', 'slot one'); same(T.pShown, 'TEST · UNIVERSAL A', 'what it shows');
                same(en(T.pList1), 'TEST · UNIVERSAL B', 'what the second can take once the first has A (EMPTY is off while it is empty)'); same(T.pAfter2.join(), 'test_universal_a,test_universal_b', 'both slots');
            });
            await check('✕ CLOSE and Escape shut the sheet and give the HUD back', () => { same(T.closed.cls.indexOf('open') < 0, true, 'close'); same(T.closed.body, false, 'body.cardsOpen after'); same(T.closed.hud, true, 'the dock did not come back'); same(T.escaped.indexOf('open') < 0, true, 'Escape'); });
            await check('THE ROSTER: the creature in view shows its SUBCLASS (a row, and a tag on its picture), and CARD 1 and CARD 2 under its styles', () => {
                same(T.ro.dds.join('|'), 'ATTACK STYLE|PLAY STYLE|CARD 1|CARD 2', 'the settings'); same(T.ro.sub.join(), 'SUBCLASS,CRUSTACEAN', 'the row'); same(T.ro.chip, 'CRUSTACEAN', 'the tag'); same(T.ro.chipShown, true, 'the tag is not shown');
            });
            await check('a slot lists the hand: the cards that fit can be picked, the rest say why not; a pick fills the slot and folds the list; the other slot cannot take the same card; EMPTY takes it off', () => {
                const en = l => l.filter(x => !x[1]).map(x => x[0]).sort().join('|'), why = (l, n) => (l.find(x => x[0] === n) || [])[2];
                same(en(T.ro.opts1), 'CINDERBRAND|EMBER PLATING|FURNACE HEART|IMPACT TEST|STRESS TESTED|TEST · BRAWLER|TEST · CRUSTACEAN|TEST · FIRE|TEST · UNIVERSAL A|TEST · UNIVERSAL B', 'what a fire brawler Quillstone can wear (the two Brawler Crystalline cards and the three fire cards of Pack 1 with it)'); same(why(T.ro.opts1, 'FROST LINING'), 'FOR ICE FOLLOWERS', 'an ice card of Pack 1 on a fire follower');
                same(why(T.ro.opts1, 'POWER SURGE'), 'FOR MAGES', 'a Mage\'s card on a Brawler'); same(why(T.ro.opts1, 'CORE REINFORCEMENT'), 'FOR TECHNICIANS', 'a Technician\'s card on a Brawler'); same(why(T.ro.opts1, 'TEST · ICE'), 'FOR ICE FOLLOWERS', 'ice'); same(why(T.ro.opts1, 'TEST · MAGE'), 'FOR MAGES', 'mage');
                same(why(T.ro.opts1, 'TEST · TECHNICIAN'), 'FOR TECHNICIANS', 'technician'); same(why(T.ro.opts1, 'TEST · DRONE'), 'FOR DRONES', 'drone'); same(T.ro.cards1.join(), 'test_fire,', 'slot one after the pick'); same(T.ro.closedAfter, 0, 'the list stayed open');
                ok(T.ro.opts2.find(x => x[0] === 'TEST · FIRE')[1], 'the same card is offered on the other slot'); same(why(T.ro.opts2, 'TEST · FIRE'), 'ALREADY ON ITS OTHER SLOT', 'its reason'); same(T.ro.cards2.join(), 'test_fire,test_brawler', 'slot two after the pick');
                same(T.ro.values.slice(2).join('|'), 'TEST · FIRE|TEST · BRAWLER', 'what the drop-downs show'); same(T.ro.cards3.join(), ',test_brawler', 'EMPTY');
                same(T.ro.headChips.join('|'), '1/6|3/6', 'the chip beside each card worn (its rarity: unrefined, precision)'); for (const o of [...T.ro.opts1, ...T.ro.opts2]) same(o[3], o[0] === 'EMPTY' ? '' : o[4], o[0] + '\'s chip in the list');
            });
            await check('an egg has no subclass yet (the row says so, and no tag); a retired form has none (the row says so)', () => {
                same(T.egg.sub.join(), 'SUBCLASS,NONE YET · IT HAS NOT EVOLVED', 'an egg'); same(T.egg.chipShown, false, 'an egg has a tag'); same(T.legacy.sub.join(), 'SUBCLASS,NONE · A RETIRED FORM', 'a retired form'); same(T.legacy.chipShown, false, 'a retired form has a tag');
            });
        }
    }
    const U = measure(1180, 820, '?cards', { conduit_fp_cards: JSON.stringify({ v: 1, owned: ['test_fire', 'test_universal_a'] }) });
    if (U === null) console.log('  (no Chromium here: skipped)');
    else {
        await check('A NEW RUN with a collection: the sheet opens by itself with a banner and START THE RUN; the owned cards can be taken (up to three), the locked ones cost ◆1,000 and are off while the shards are short; START shuts it and the HUD is back', () => {
            ok(U && !U.err, 'the probe: ' + (U && U.err)); same(U.dev, 'on', 'the switch'); same(U.startOpen.indexOf('open') >= 0, true, 'the sheet did not open'); same(U.startBanner, true, 'no banner'); same(U.startClose, 'START THE RUN ▸', 'its button'); same(U.startHand0, 0, 'the hand began full');
            same(U.takes, 2, 'cards to take'); same(U.locks, 31, 'cards to unlock (the 24 real and the seven test cards not owned)'); same(U.locksOff, 31, 'unlocks that were on with ' + 100 + ' shards'); same(U.startHand1.join(), 'test_fire,test_universal_a', 'the hand chosen'); same(U.startAfter.indexOf('open') < 0, true, 'START did not shut it'); same(U.startBodyClass, false, 'body.cardsOpen after');
        });
        await check('?cards (not =all): the button is there, shown; UNLOCK asks twice, the second tap pays ◆1,000 once and the card is owned and kept; the same card is not charged again', () => {
            same(U.btn.shown, true, 'the button'); same(U.arm.label, 'TAP AGAIN TO UNLOCK', 'the first tap'); same(U.arm.shards, 0, 'the first tap spent shards'); same(U.arm.owned, false, 'the first tap unlocked');
            same(U.unlock.shards, 1000, 'the price'); same(U.unlock.owned, true, 'owned'); ok(JSON.parse(U.unlock.stored).owned.length === 3, 'kept: ' + U.unlock.stored);
        });
    }
    const N = measure(1180, 820, '');
    if (N === null) console.log('  (no Chromium here: skipped)');
    else await check('WITHOUT ?cards: the CARDS button is in the dock and shown, the sheet lists the six real cards (locked, a rarity chip on each), and with no card in the registry the sheet is empty and says so, and the roster has the SUBCLASS tag and CARD 1 / CARD 2, off, saying there is no card in the hand', () => {
        ok(N && !N.err, 'the probe: ' + (N && N.err)); same(N.dev, '', 'the switch'); same(N.any, true, 'a card exists'); same(N.btn.there && N.btn.inDock && N.btn.shown, true, 'the button: ' + JSON.stringify(N.btn));
        same(N.real.slabs, 24, 'the 24 on the sheet'); same(N.real.locked, 24, 'locked'); same(N.real.names.slice(0, 6).join('|'), 'IMPACT TEST|STRESS TESTED|POWER SURGE|SPEED TRIAL|PROTOTYPE X|CORE REINFORCEMENT', 'their names (the Crystalline six first)'); same(N.real.kinds.slice(0, 6).join('|'), 'CLASS · BRAWLER|CLASS · BRAWLER|CLASS · MAGE|CLASS · MAGE|CLASS · TECHNICIAN|CLASS · TECHNICIAN', 'their classes');
        same(N.real.lit.slice(0, 6).join(), '6/6,6/6,6/6,6/6,6/6,6/6', 'the rarity chips'); same(N.real.rars.slice(0, 6).join(), 'CRYSTALLINE,CRYSTALLINE,CRYSTALLINE,CRYSTALLINE,CRYSTALLINE,CRYSTALLINE', 'the rarity names');
        same(N.real.texts.slice(0, 6).join('|'), '+50% ATTACK DAMAGE|+50% MAXIMUM HEALTH|+50% ELEMENTAL ATTACK POWER|+50% ATTACK SPEED|+50% ATTACK SPEED|+50% MAXIMUM HEALTH', 'what each says'); ok(/^UNLOCK ◆1000$/.test(N.real.buttons[0]) && N.real.buttons.every(b => b === N.real.buttons[0]), 'the buttons: ' + N.real.buttons); same(N.real.start, 0, 'the choice at the start of a run opened with nothing owned');
        same(N.real.names.slice(6).length, 18, 'Pack 1\'s eighteen follow'); same(N.real.lit.slice(6).join(), '1/6,2/6,3/6,1/6,2/6,3/6,1/6,2/6,3/6,1/6,2/6,3/6,1/6,2/6,3/6,1/6,2/6,3/6', 'their rarity chips: Unrefined, Refined, Precision, six times');
        ok(/HAND 0 \/ 3 · 0 OF 24 UNLOCKED$/.test(N.real.summary), 'the summary: ' + N.real.summary);
        same(N.plain.dds.join('|'), 'ATTACK STYLE|PLAY STYLE|CARD 1|CARD 2', 'the roster\'s settings'); same(JSON.stringify(N.plain.cardDds), JSON.stringify([['CARD 1', 'NO CARDS IN YOUR HAND', true], ['CARD 2', 'NO CARDS IN YOUR HAND', true]]), 'the slots with no card to put in them');
        same(N.plain.sub.join(), 'SUBCLASS,CRUSTACEAN', 'the subclass row'); same(N.plain.chip, 'CRUSTACEAN', 'the subclass tag'); same(N.plain.cardsOpen.indexOf('open') < 0, true, 'the sheet is open on its own');
        ok(N.emptySheet.cls.indexOf('open') >= 0, 'the sheet did not open'); same(N.emptySheet.slabs, 0, 'a card on the sheet'); same(N.emptySheet.empties, 3, 'the hand\'s empty places'); same(N.emptySheet.pslots, 2, 'the player\'s slots');
        same(N.emptySheet.secs.join('|'), 'YOUR HAND|YOU|BOOSTER PACK|THE COLLECTION', 'its parts'); same(N.emptySheet.note, 'NO CARDS YET · THE FIRST ONES ARE STILL BEING DESIGNED', 'what the collection says'); ok(/HAND 0 \/ 3 · 0 OF 0 UNLOCKED/.test(N.emptySheet.summary) && !/TEST CARDS/.test(N.emptySheet.summary), 'the summary: ' + N.emptySheet.summary);
        same(N.emptySheet.pList, '1/NO CARD IN YOUR HAND', 'a player slot\'s list with no card in the hand (EMPTY, off, and the note)'); same(N.emptySheet.closed.indexOf('open') < 0, true, 'close');
    });
    const P = measure(390, 844, '?cards=all');
    if (P === null) console.log('  (no Chromium here: skipped)');
    else await check('A PHONE: the dock is not there (the radial menu is), and its roster has no subclass row or slots yet (they come later)', () => {
        ok(P && !P.err, 'the probe: ' + (P && P.err)); same(P.wide, false, 'a phone'); same(P.phone.dock, false, 'the dock is shown'); same(P.phone.dds.indexOf('CARD 1'), -1, 'a slot'); same(P.phone.sub, -1, 'a subclass row');
    });

    console.log(failures ? `\n${failures} failing` : '\nall passing'); process.exit(failures ? 1 : 0);
})();
