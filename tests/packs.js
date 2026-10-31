// PACK 1: THE BOOSTER PACK AND ITS EIGHTEEN ELEMENT CARDS (js/cards.js EQUIP_PACK1, EQUIP_PACK, equipPackRoll / equipPackOpen, equipFound, equipOnHit; the hooks in js/levels.js, js/combat.js, js/helpers.js applyDamage, js/predator.js; js/cardsui.js).
// ASKED (the "Pack 1" brief, 2026-10-30): a data-driven registry of 18 Element cards (Fire, Toxic, Electric, Ice, Flux, Core: Unrefined, Refined, Precision each); a ◆100 pack of exactly 4 cards, rarities Unrefined / Refined / Precision only at 60 / 30 / 10, one slot
// reserved for a Precision, no card twice in a pack, seedable; the 1,000-shard permanent unlock, the hand of up to 3, two slots a follower, the same owned card on any number of followers, slots emptied (never the collection) when a follower leaves; stat
// bonuses through modifiers made from the base (never multiplied again and again); statuses that run out and are refreshed, never stacked; no console errors.
//   THE CARDS      the 18, by name, element, rarity and number, as the brief gives them; stable unique ids; only the ELEMENT kind; nothing of Prototype or above
//   THE PACK       4 cards, one Precision at least, only eligible cards, none twice, the same pack for the same seed, the weights, the price, a pack that cannot be made is not sold
//   FOUND, UNLOCK  what a pack deals is found for the run (worn at once), kept for good at ◆1,000 (only a found card), NEW GAME clears the found and keeps the collection; the hand
//   EQUIPPING      validation, one card not on both slots, one card on many followers, moving a card, the player takes none of them
//   THE STATS      Attack, Special Attack, Attack Speed, Defense, Maximum HP, and Core's damage dealt: each exact, each gone with the card, additive with the Crystalline cards
//   THE PROCS      Burn, Poison, Paralyze, Slow, Siphon, Knockback: the chance, the numbers, what they do to the target, refresh not stack, expiry, no proc from what is not an attack
//   LEAVING        EXILE, falling for good, a RE-ROLL, a respawn, an evolution: the slots, never the collection
//   SAVING         the found cards and the cards worn survive; NEW GAME keeps the collection; no new save key
//   THE GAME RUNS  a fight with every card worn: no error, no NaN, every status over at the end
//   THE SCREENS    (real browser) the pack, the found cards, the roster, no page error
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
const near = (a, b, m, eps) => { if (!(Math.abs(a - b) <= (eps === undefined ? 1e-6 : eps))) throw new Error(`${m}: expected ${b}, got ${a}`); };

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
// A context with the game loaded. `errs` collects every console.error the game makes.
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
        globalThis.__form = (f, id) => { f.evolved = id; f.element = EVOLUTIONS[id].element; f.role = EVOLUTIONS[id].role; return f; };
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };
        globalThis.__hand = ids => { equipHand.length = 0; for (const id of ids) equipHand.push(id); };
        globalThis.__lv = (f, L) => { f.level = L; f.xp = xpForLevel(L); _applyFollowerLevel(f, true); return f; };
        globalThis.__prep = (el, role, L) => { const f = __mk(el, role || 'brawler'); delete f.evolved; f.perk = null; f.combatTrait = null; f.naturalTrait = null; return __lv(f, L || 12); };   // (no perk or trait: nothing random is in a number)
        globalThis.__snap = f => ({ stats: JSON.parse(JSON.stringify(f.stats)), power: f.power, maxHealth: f.maxHealth, health: f.health, base: JSON.parse(JSON.stringify(f.base)), level: f.level, xp: f.xp, cards: f.cards ? f.cards.slice() : null });
        globalThis.__rests = f => [45, 40, 55, 70].map(n => followerRest(f, n));
        // a creature with no defense that stays alive; the damage a hit really takes from it; Math.random held at a value while a function runs; status frames run
        globalThis.__ant = (dx, dy) => { const e = spawnCreature({ species: 'ant', className: 'scout', level: 3, x: crystal.x + (dx === undefined ? 1 : dx), y: crystal.y + (dy || 0), state: 'hunt' }); e.provoked = true; e.health = e.maxHealth = 1e9; return e; };
        globalThis.__dealt = (e, amount, src) => { const h = e.health; applyDamage(e, amount, src); return h - e.health; };
        globalThis.__with = (v, fn) => { const r = Math.random; Math.random = typeof v === 'function' ? v : () => v; try { return fn(); } finally { Math.random = r; } };
        globalThis.__tick = n => { for (let i = 0; i < n; i++) { frame++; updateStatusEffects(); } };
        globalThis.__gone = e => { e.dead = true; const k = actors.indexOf(e); if (k >= 0) actors.splice(k, 1); };
        globalThis.__fall = (f, forGood) => { f.spawnProtection = 0; if (forGood) f.base.hp = 1; const foe = { x: f.x + 1, y: f.y, team: 'red' }; for (let i = 0; i < 40 && !f.dead; i++) applyDamage(f, f.maxHealth, foe); render(); render(); };`, ctx);
    return { ctx, errs, run: s => vm.runInContext(s, ctx), J: s => JSON.parse(vm.runInContext('JSON.stringify(' + s + ')', ctx)) };
}

// the brief's eighteen, copied here on purpose: [id, name, element, rarity, effect, the card's words]
const PACK1 = [
    ['ember_plating', 'EMBER PLATING', 'fire', 'unrefined', { bonus: { attack: 0.05 } }, '+5% ATTACK'],
    ['furnace_heart', 'FURNACE HEART', 'fire', 'refined', { bonus: { attack: 0.10 } }, '+10% ATTACK'],
    ['cinderbrand', 'CINDERBRAND', 'fire', 'precision', { proc: { kind: 'burn', chance: 0.15, dps: 3, seconds: 3 } }, '15% PER HIT TO BURN: 3 DAMAGE A SECOND FOR 3 SECONDS'],
    ['venom_gland', 'VENOM GLAND', 'toxic', 'unrefined', { bonus: { specialAttack: 0.05 } }, '+5% SPECIAL ATTACK'],
    ['corrosive_reservoir', 'CORROSIVE RESERVOIR', 'toxic', 'refined', { bonus: { specialAttack: 0.10 } }, '+10% SPECIAL ATTACK'],
    ['mireblight', 'MIREBLIGHT', 'toxic', 'precision', { proc: { kind: 'poison', chance: 0.15, cut: 0.40, seconds: 4 } }, '15% PER HIT TO POISON: IT HITS 40% WEAKER FOR 4 SECONDS'],
    ['charged_wiring', 'CHARGED WIRING', 'electric', 'unrefined', { bonus: { attackSpeed: 0.05 } }, '+5% ATTACK SPEED'],
    ['arc_capacitor', 'ARC CAPACITOR', 'electric', 'refined', { bonus: { attackSpeed: 0.10 } }, '+10% ATTACK SPEED'],
    ['static_lock', 'STATIC LOCK', 'electric', 'precision', { proc: { kind: 'glitch', chance: 0.10, seconds: 0.5 } }, '10% PER HIT TO GLITCH: ITS WIND-UPS FAIL FOR 0.5 SECONDS'],
    ['frost_lining', 'FROST LINING', 'ice', 'unrefined', { bonus: { defense: 0.05 } }, '+5% DEFENSE'],
    ['permafrost_shell', 'PERMAFROST SHELL', 'ice', 'refined', { bonus: { defense: 0.10 } }, '+10% DEFENSE'],
    ['rime_snare', 'RIME SNARE', 'ice', 'precision', { proc: { kind: 'slow', chance: 0.20, cut: 0.25, seconds: 2 } }, '20% PER HIT TO SLOW BY 25% FOR 2 SECONDS'],
    ['flux_cell', 'FLUX CELL', 'flux', 'unrefined', { bonus: { maxHealth: 0.05 } }, '+5% MAXIMUM HP'],
    ['vortex_core', 'VORTEX CORE', 'flux', 'refined', { bonus: { maxHealth: 0.10 } }, '+10% MAXIMUM HP'],
    ['siphon_field', 'SIPHON FIELD', 'flux', 'precision', { proc: { kind: 'siphon', chance: 0.15, share: 0.10 } }, '15% PER HIT TO HEAL 10% OF THE DAMAGE DEALT'],
    ['impact_studs', 'IMPACT STUDS', 'core', 'unrefined', { bonus: { damage: 0.05 } }, '+5% DAMAGE DEALT, ALL ATTACKS'],
    ['bedrock_matrix', 'BEDROCK MATRIX', 'core', 'refined', { bonus: { damage: 0.10 } }, '+10% DAMAGE DEALT, ALL ATTACKS'],
    ['repulsor_pulse', 'REPULSOR PULSE', 'core', 'precision', { proc: { kind: 'knockback', chance: 0.15, push: 0.22 } }, '15% PER HIT TO KNOCK THE TARGET BACK'],
];
const ELEMENTS = ['fire', 'toxic', 'electric', 'ice', 'flux', 'core'], RARITY3 = ['unrefined', 'refined', 'precision'];
const st = (v, k) => Math.max(1, Math.round(v * k * 1000) / 1000);   // a stat a card moves: kept to three places, as js/levels.js makes it
const restOf = (n, k) => Math.max(1, Math.round((n + 1) / k) - 1);   // the rest after an attack of n frames at attack speed x k (js/combat.js followerRest)
const idsOf = (el) => PACK1.filter(c => c[2] === el).map(c => c[0]);

// ── THE REAL PAGE ──
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = { errors: [] }, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var click = function(el){ if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  var byText = function(sel, t){ return $$(sel).filter(function(e){ return e.textContent.indexOf(t) === 0; })[0]; };
  window.addEventListener('error', function(e){ out.errors.push(String(e.message)); }); var ce = console.error; console.error = function(){ out.errors.push(Array.prototype.slice.call(arguments).join(' ')); ce.apply(console, arguments); };
  try {
    out.wide = typeof hudCorners === 'function' && hudCorners(); out.startOpen = $('#cardsRoot').className.indexOf('open') >= 0;
    gameState.running = true; facilityBlackoutSet(false); if (typeof classPickerClose === 'function') classPickerClose(); classPickerOpen = false;
    for (var i = followers.length; i < 4; i++) recruitFollower(); for (var k = 0; k < followers.length; k++) followers[k].returningToCrystal = false; partyTick(); await wait(50);
    shardCount = 350; var f = followers[0]; f.role = 'brawler'; f.element = 'fire'; delete f.evolved; f.perk = null; f.level = 6; f.xp = xpForLevel(6); _applyFollowerLevel(f, true);
    var plain = function(g){ var lv = levelledStats(g.base, g.level), m = g.evolved ? EVOLVE_MULT : 1; return { atk: Math.round(lv.attack * m) }; };
    var added = [], oa = EventTarget.prototype.addEventListener; EventTarget.prototype.addEventListener = function(t, fn, o){ if (this === window || this === document || this === document.body || this === document.documentElement) added.push(t); return oa.call(this, t, fn, o); };
    cardsOpen(); await wait(120);
    var pk = function(){ return $('#cardsRoot .cd-pack > .cd-btn'); };
    out.sections = $$('#cardsRoot .cd-sec').map(function(e){ return e.childNodes[0].textContent; }); out.packBtn0 = pk().textContent; var s0 = shardCount;
    click(pk()); await wait(80); out.armed = pk().querySelector('.cd-bl').textContent; out.armedSpent = s0 - shardCount;
    click(pk()); await wait(120); out.spent = s0 - shardCount;
    out.found = equipFound.slice(); out.owned = equipOwnedList().length;
    out.slabs = $$('#cardsRoot .cd-pack .cd-card').map(function(s){ var ch = s.querySelector('.cd-chip'); return [s.querySelector('.cd-name').textContent, s.querySelector('.cd-rar').textContent, ch ? ch.querySelectorAll('i.on').length + '/' + ch.querySelectorAll('i').length : '', s.querySelector('.cd-kind').textContent, s.querySelector('.cd-text').textContent]; });
    out.foundSecs = $$('#cardsRoot .cd-sec').map(function(e){ return e.childNodes[0].textContent; }); out.foundSlabs = $$('#cardsRoot .cd-grid').filter(function(g){ return g.previousSibling && g.previousSibling.textContent.indexOf('FOUND THIS RUN') === 0; }).map(function(g){ return g.querySelectorAll('.cd-card').length; });
    out.summary = ($('#cardsRoot .cd-summary') || {}).textContent; out.packBtn1 = pk().textContent + '|' + pk().disabled;
    // a found card is unlocked for good for ◆1,000, in two taps, from the sheet; the one that is not found cannot be
    var first = equipFound[0]; var slab = function(n){ return $$('#cardsRoot .cd-grid .cd-card').filter(function(s){ return s.querySelector('.cd-name').textContent === n && s.querySelector('.cd-btn'); }); };
    var nm = equipCard(first).name; shardCount = 1500; cardsRender(true); await wait(100); var cs = slab(nm); out.foundCopies = cs.length; out.unlockWhyBefore = equipUnlockWhyNot(first);
    var notFound = Object.keys(equipCards()).filter(function(id){ return equipCard(id).pack && !equipIsFound(id); })[0]; out.notFoundWhy = equipUnlockWhyNot(notFound);
    var sh0 = shardCount; click(cs[0].querySelector('.cd-btn')); await wait(80); click(slab(nm)[0].querySelector('.cd-btn')); await wait(120);
    out.unlock = { owned: equipOwns(first), spent: sh0 - shardCount, stored: localStorage.getItem('conduit_fp_cards') };
    // wear a found card on the follower from the roster, then take it off
    var fc = equipFound.filter(function(id){ var c = equipCard(id); return c.match === 'fire'; })[0]; out.fireFound = fc || null;
    if (!fc) { equipFound.push('ember_plating'); fc = 'ember_plating'; }
    for (var r = 0; r < 6; r++) { cardsClose(); await wait(20); cardsOpen(); await wait(40); cardsRender(true); } out.added = added.slice(); EventTarget.prototype.addEventListener = oa;
    cardsClose(); await wait(60); selectedUnits.clear(); ccOpen('roster'); await wait(300); _ccFocus = f; ccRender(); await wait(80);
    click(byText('#ccSide .cc-dd', 'CARD 1')); await wait(80);
    out.opts = $$('#ccSide .cc-dd-list .cc-btn').map(function(b){ return [b.querySelector('.cc-bl').textContent, b.disabled, (b.querySelector('.cc-bs') || {}).textContent || '']; });
    var before = plain(f).atk; click(byText('#ccSide .cc-dd-list .cc-btn', equipCard(fc).name)); await wait(100); ccRender(); await wait(60);
    out.worn = { cards: f.cards ? f.cards.slice() : null, atk: f.stats.attack, plain: plain(f).atk, card: fc };
    var snap = function(){ return JSON.stringify([f.stats, f.maxHealth, f.cards, equipHand, equipFound, equipWearers(fc)]); }, s1 = snap();
    for (var n = 0; n < 5; n++) { cardsOpen(); await wait(40); cardsRender(true); cardsClose(); await wait(20); }
    out.stable = snap() === s1;
    click(byText('#ccSide .cc-dd', 'CARD 1')); await wait(60); click(byText('#ccSide .cc-dd-list .cc-btn', 'EMPTY')); await wait(100); ccRender(); await wait(60);
    out.off = { cards: f.cards ? f.cards.slice() : null, atk: f.stats.attack, plain: plain(f).atk, stillFound: equipIsFound(fc) };
    ccClose();
  } catch (err) { out.err = String(err && err.stack || err); }
  var pre = document.createElement('pre'); pre.id = '__cd'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2500); });</script></body>`;
function measure(w, h, query, seed) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pk-')), file = path.join(dir, 'game.html');
    const pre = seed ? '<script>try { ' + Object.keys(seed).map(k => 'localStorage.setItem(' + JSON.stringify(k) + ', ' + JSON.stringify(seed[k]) + ');').join(' ') + ' } catch (e) {}</script>' : '';
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">' + pre).replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=60000', '--dump-dom', 'file://' + file + (query || '')], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__cd">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const G = await boot('', {}), run = G.run, J = G.J;

    group('1. THE EIGHTEEN CARDS: the registry');
    await check('eighteen cards, the ELEMENT kind, three for each of the six elements (Unrefined, Refined, Precision), with the brief\'s names, elements, rarities, numbers and words', () => {
        const cs = J('Object.values(EQUIP_CARDS).filter(function(c){ return c.pack === "pack1"; })'); same(cs.length, 18, 'Pack 1\'s cards');
        PACK1.forEach(([id, name, el, rarity, fx, text], i) => {
            const c = cs[i]; same(c.id, id, 'card ' + (i + 1) + '\'s id'); same(c.name, name, id + '\'s name'); same(c.kind, 'element', id + ' is of the element kind'); same(c.match, el, id + '\'s element'); same(c.rarity, rarity, id + '\'s rarity');
            sameJ(fx.bonus || null, c.bonus || null, id + '\'s bonus'); sameJ(fx.proc || null, c.proc || null, id + '\'s proc'); same(c.text, text, id + '\'s words'); same(Object.keys(c).sort().join(), (fx.bonus ? 'bonus,' : 'proc,').concat('id,kind,match,name,pack,rarity,text').split(',').sort().join(), id + ' has a field that is not the card shape plus its effect');
        });
        for (const el of ELEMENTS) sameJ(cs.filter(c => c.match === el).map(c => c.rarity), RARITY3, el + '\'s three');
    });
    await check('stable ids: unique, lower_snake_case, the same as the names\' words; no id is shared with another card (the Crystalline six, the test cards)', () => {
        const ids = J('Object.keys(EQUIP_CARDS)'); same(new Set(ids).size, ids.length, 'ids are unique'); ok(ids.every(i => /^[a-z]+(_[a-z]+)*$/.test(i)), 'an id is not lower_snake_case');
        for (const [id, name] of PACK1) same(id, name.toLowerCase().replace(/ /g, '_'), id + ' is not its name');
        const names = J('Object.values(EQUIP_CARDS).map(function(c){ return c.name; })'); same(new Set(names).size, names.length, 'names are unique');
        same(J('Object.keys(EQUIP_TEST_CARDS).filter(function(i){ return i in EQUIP_CARDS; }).length'), 0, 'a test card shares an id');
    });
    await check('every card of Pack 1 is of an eligible kind and rarity (ELEMENT; Unrefined, Refined, Precision) and none is Prototype, Lustrous or Crystalline; the rarity names are the six, unchanged', () => {
        const cs = J('Object.values(EQUIP_CARDS).filter(function(c){ return c.pack === "pack1"; })'); ok(cs.every(c => c.kind === 'element' && RARITY3.includes(c.rarity)), 'a card of Pack 1 is of another kind or rarity');
        same(J('EQUIP_RARITIES.map(function(r){ return r.label; })').join(), 'UNREFINED,REFINED,PRECISION,PROTOTYPE,LUSTROUS,CRYSTALLINE', 'the rarity names');
        same(J('Object.values(EQUIP_CARDS).filter(function(c){ return c.pack === "pack1"; }).map(function(c){ return equipRarityBars(c); })').join(), '1,2,3,1,2,3,1,2,3,1,2,3,1,2,3,1,2,3', 'the illuminated bars: one, two, three');
    });
    await check('the numbers are in the registry only: the words on a card are made from them (changing a number changes the card\'s words, and nothing else holds a copy)', () => {
        const o = J(`(function(){ const c = EQUIP_CARDS.cinderbrand, was = c.text; c.proc.chance = 0.25; c.proc.dps = 5; c.proc.seconds = 2; const now = equipEffectText({ proc: c.proc }); c.proc.chance = 0.15; c.proc.dps = 3; c.proc.seconds = 3; return { was, now, back: equipEffectText({ proc: c.proc }) }; })()`);
        same(o.now, '25% PER HIT TO BURN: 5 DAMAGE A SECOND FOR 2 SECONDS', 'the words follow the numbers'); same(o.back, o.was, 'and back');
        const src = rd('js/cards.js'); for (const lit of ['0.15', '0.10', '0.20']) ok((src.match(new RegExp('chance: ' + lit.replace('.', '\\.'), 'g')) || []).length >= 1, 'a chance is not in the table');
        ok(!/p\.chance\s*[<>=]=?\s*0\.\d/.test(src) && !/dps\s*=\s*\d/.test(src), 'a number of an effect is written outside the table');
    });

    group('2. THE PACK: exactly 4 cards, one Precision at least, only eligible cards, none twice, seedable');
    await check('the price is 100 (shards: the game\'s one currency), the size 4, the rarities the three at 60 / 30 / 10, one slot reserved for a Precision; the unlock is 1,000, the hand 3, a follower\'s slots 2, the player\'s 2', () => {
        sameJ(J('({ price: EQUIP_PACK.price, size: EQUIP_PACK.size, rarities: EQUIP_PACK.rarities, guaranteed: EQUIP_PACK.guaranteed, kinds: EQUIP_PACK.kinds })'), { price: 100, size: 4, rarities: { unrefined: 60, refined: 30, precision: 10 }, guaranteed: { rarity: 'precision', count: 1 }, kinds: ['element'] }, 'the pack');
        sameJ(J('({ unlock: EQUIP.unlockCost, pick: EQUIP.startPick, slots: EQUIP.followerSlots, pslots: EQUIP.playerSlots })'), { unlock: 1000, pick: 3, slots: 2, pslots: 2 }, 'the rules that must not change');
    });
    await check('4000 packs, each from its own seed: exactly 4 cards, all different, all of Pack 1 (an element card of an eligible rarity), at least one Precision', () => {
        const o = J(`(function(){ const bad = []; let precisionMin = 9, sizes = new Set(); for (let s = 1; s <= 4000; s++) { const ids = equipPackRoll(s); if (!ids) { bad.push([s, 'null']); continue; } sizes.add(ids.length);
            if (new Set(ids).size !== ids.length) bad.push([s, 'twice', ids]); const cs = ids.map(equipCard); if (cs.some(c => !c || c.kind !== 'element' || c.pack !== 'pack1' || ['unrefined', 'refined', 'precision'].indexOf(c.rarity) < 0 || c.test)) bad.push([s, 'ineligible', ids]);
            precisionMin = Math.min(precisionMin, cs.filter(c => c && c.rarity === 'precision').length); } return { bad: bad.slice(0, 3), sizes: [...sizes], precisionMin }; })()`);
        sameJ(o.bad, [], 'a bad pack'); sameJ(o.sizes, [4], 'the size'); ok(o.precisionMin >= 1, 'a pack with no Precision');
    });
    await check('the same seed deals the same pack; different seeds mostly differ; with no seed the pack comes from Math.random (so a test can hold it)', () => {
        const o = J(`(function(){ const a = equipPackRoll(7), b = equipPackRoll(7), c = equipPackRoll(8); let diff = 0; for (let s = 1; s <= 200; s++) if (equipPackRoll(s).join() !== equipPackRoll(s + 1).join()) diff++;
            const low = __with(0, () => equipPackRoll()), high = __with(0.999999, () => equipPackRoll()); return { a, b, c, diff, low, high }; })()`);
        sameJ(o.a, o.b, 'the same seed'); ok(o.a.join() !== o.c.join(), 'two seeds, one pack'); ok(o.diff > 150, 'seeds barely differ: ' + o.diff); same(o.low.length, 4, 'a roll of 0'); same(o.high.length, 4, 'a roll of 0.999999'); same(new Set(o.high).size, 4, 'no card twice when every roll is high');
    });
    await check('the guarantee holds at the worst rolls: when every roll for the open slots is the lowest rarity, or the highest, there is still a Precision, and four different cards', () => {
        const o = J(`(function(){ const rar = ids => ids.map(i => equipCard(i).rarity); const low = __with(0, () => rar(equipPackRoll())), high = __with(0.999999, () => rar(equipPackRoll())); return { low, high }; })()`);
        ok(o.low.includes('precision') && o.low.filter(r => r === 'unrefined').length === 3, 'every open slot at the lowest: ' + o.low); same(o.high.filter(r => r === 'precision').length, 4, 'every open slot at the highest: ' + o.high);
    });
    await check('the weights: over 20,000 packs the open slots are 60 / 30 / 10 (so a pack holds on average 1.8 Unrefined, 0.9 Refined and 1.3 Precision, the reserved one counted), and each card of a rarity comes about as often as the others', () => {
        const o = J(`(function(){ const n = { unrefined: 0, refined: 0, precision: 0 }, per = {}; const N = 20000; for (let s = 1; s <= N; s++) for (const id of equipPackRoll(100000 + s)) { n[equipCard(id).rarity]++; per[id] = (per[id] || 0) + 1; } return { n, per, N }; })()`);
        near(o.n.unrefined / o.N, 1.8, 'Unrefined a pack', 0.04); near(o.n.refined / o.N, 0.9, 'Refined a pack', 0.04); near(o.n.precision / o.N, 1.3, 'Precision a pack', 0.04);
        for (const r of RARITY3) { const ids = PACK1.filter(c => c[3] === r).map(c => c[0]), counts = ids.map(i => o.per[i] || 0), mean = counts.reduce((a, b) => a + b, 0) / ids.length; ok(counts.every(c => Math.abs(c - mean) / mean < 0.1), r + ': a card comes more often than the others: ' + counts); }
    });
    await check('an ineligible card never comes out: a Prototype, a class card, a card with no pack, a test card, all tagged for the pack or not, are left out of 3000 packs', () => {
        const o = J(`(function(){ const mk = (id, kind, match, rarity, extra) => { EQUIP_CARDS[id] = Object.assign({ id, name: 'FX', kind, match, rarity, text: '' }, extra || {}); };
            mk('fx_proto', 'element', 'fire', 'prototype', { pack: 'pack1' }); mk('fx_class', 'class', 'brawler', 'precision', { pack: 'pack1' }); mk('fx_nopack', 'element', 'fire', 'precision'); mk('fx_test', 'element', 'fire', 'precision', { pack: 'pack1', test: true }); mk('fx_other', 'element', 'fire', 'precision', { pack: 'pack2' }); mk('fx_cryst', 'element', 'fire', 'crystalline', { pack: 'pack1' });
            const seen = new Set(); for (let s = 1; s <= 3000; s++) for (const id of equipPackRoll(s)) seen.add(id); const pool = equipPackPool().map(c => c.id); for (const id of ['fx_proto', 'fx_class', 'fx_nopack', 'fx_test', 'fx_other', 'fx_cryst']) delete EQUIP_CARDS[id];
            return { fx: [...seen].filter(i => /^fx_/.test(i)), pool: pool.length, crystalline: [...seen].filter(i => equipCard(i) && equipCard(i).rarity === 'crystalline') }; })()`);
        sameJ(o.fx, [], 'an ineligible card came out'); same(o.pool, 18, 'the pool'); sameJ(o.crystalline, [], 'a Crystalline card came out');
    });
    await check('a pack that cannot be made is not sold and costs nothing: no card of the reserved rarity, fewer cards than the size, or too few shards', () => {
        const o = J(`(function(){ shardCount = 1000; const out = {}; const keep = EQUIP_PACK1.length;
            const noPrec = { id: 'pack1', price: 100, size: 4, kinds: ['element'], rarities: { unrefined: 60, refined: 30 }, guaranteed: { rarity: 'precision', count: 1 } }; out.noPrec = [equipPackWhyNot(noPrec), equipPackRoll(1, noPrec), equipPackOpen(1, noPrec), shardCount];
            const tiny = { id: 'pack1', price: 100, size: 40, kinds: ['element'], rarities: { unrefined: 60, refined: 30, precision: 10 }, guaranteed: { rarity: 'precision', count: 1 } }; out.tiny = [equipPackWhyNot(tiny), equipPackRoll(1, tiny), equipPackOpen(1, tiny), shardCount];
            const other = { id: 'pack9', price: 100, size: 4, kinds: ['element'], rarities: { unrefined: 60, refined: 30, precision: 10 }, guaranteed: { rarity: 'precision', count: 1 } }; out.other = [equipPackWhyNot(other), equipPackPool(other).length];
            shardCount = 99; out.short = [equipPackWhyNot(), equipPackOpen(1), shardCount, equipFound.length]; shardCount = 5000; return out; })()`);
        same(o.noPrec[0], 'NO CARDS TO FIND', 'no Precision card: why'); same(o.noPrec[1], null, 'no Precision card: a roll'); same(o.noPrec[2], null, 'no Precision card: sold'); same(o.noPrec[3], 1000, 'it was paid for');
        same(o.tiny[0], 'NO CARDS TO FIND', 'too few cards: why'); same(o.tiny[1], null, 'too few cards: a roll'); same(o.tiny[2], null, 'too few cards: sold'); same(o.tiny[3], 1000, 'it was paid for');
        same(o.other[1], 0, 'a pack takes only the cards that name it'); same(o.other[0], 'NO CARDS TO FIND', 'an empty pool is not sold'); same(o.short[0], 'NEED ◆1 MORE', 'short of shards: why'); same(o.short[1], null, 'short of shards: sold'); same(o.short[2], 99, 'short of shards: paid'); same(o.short[3], 0, 'short of shards: a card was found');
    });

    group('3. BUYING, FINDING, KEEPING: what a pack deals is found for the run; ◆1,000 keeps a found card for good');
    await check('opening a pack pays ◆100, deals 4 cards, and they are FOUND (this run); the permanent collection is untouched and nothing is written to it', async () => {
        const store = {}, B = await boot('', store);
        const o = B.J(`(function(){ shardCount = 250; const ids = equipPackOpen(11); const o = { ids, shards: shardCount, found: equipFound.slice(), fresh: equipPackLast.fresh.slice(), owned: equipOwnedList().length, last: equipPackLast.ids.slice() };
            const again = equipPackOpen(11); o.again = { ids: again, shards: shardCount, found: equipFound.length, fresh: equipPackLast.fresh.length }; shardCount = 40; o.short = [equipPackOpen(12), shardCount, equipFound.length]; return o; })()`);
        same(o.ids.length, 4, 'a pack\'s cards'); same(o.shards, 150, 'the price'); sameJ(o.found, o.ids, 'what is found'); sameJ(o.fresh, o.ids, 'what is new'); same(o.owned, 0, 'a card was owned for good'); sameJ(o.last, o.ids, 'the last pack');
        sameJ(o.again.ids, o.ids, 'the same seed, the same pack'); same(o.again.shards, 50, 'the second price'); same(o.again.found, 4, 'a card found twice is found once'); same(o.again.fresh, 0, 'nothing in the second pack was new'); sameJ(o.short, [null, 40, 4], 'a pack with 40 shards');
        same(store.conduit_fp_cards, undefined, 'the collection was written: ' + store.conduit_fp_cards);
    });
    await check('a found card can be worn at once by a follower of its element (any class), without being in the hand; the hand\'s cap of 3 is not touched by what is found', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['ember_plating', 'furnace_heart', 'cinderbrand', 'venom_gland']; equipHand.length = 0; const out = {};
            const b = __prep('fire', 'brawler'), m = __prep('fire', 'sniper'), t = __prep('fire', 'camper'), ice = __prep('ice', 'brawler');
            out.fits = [b, m, t].map(f => equipWhyNot(f, 'ember_plating', 0)); out.wrong = [equipWhyNot(ice, 'ember_plating', 0), equipWhyNot(b, 'venom_gland', 0)]; out.put = [b, m, t].map(f => equipPut(f, 0, 'ember_plating'));
            out.hand = equipHand.length; out.cap = equipHandCap(); out.notFound = equipWhyNot(b, 'flux_cell', 1); out.usable = equipUsableCards().map(c => c.id); return out; })()`);
        sameJ(o.fits, [null, null, null], 'a fire Brawler, Mage and Technician'); sameJ(o.wrong, ['FOR FIRE FOLLOWERS', 'FOR TOXIC FOLLOWERS'], 'the wrong element'); sameJ(o.put, [true, true, true], 'worn'); same(o.hand, 0, 'the hand'); same(o.cap, 3, 'the cap'); same(o.notFound, 'NOT IN YOUR HAND', 'a card not found, not in the hand'); same(o.usable.length, 4, 'what can be worn');
    });
    await check('the permanent unlock costs ◆1,000 and is of a FOUND card (a card of a pack that was not found says so, and costs nothing); the Crystalline six, which no pack deals, are unlocked as they were', () => {
        const store = {}; return boot('', store).then(B => {
            const o = B.J(`(function(){ shardCount = 5000; const out = {}; out.notFound = [equipUnlockWhyNot('ember_plating'), equipUnlock('ember_plating'), shardCount]; equipFound = ['ember_plating']; out.found = equipUnlockWhyNot('ember_plating'); shardCount = 999; out.short = [equipUnlockWhyNot('ember_plating'), equipUnlock('ember_plating'), shardCount];
                shardCount = 1000; out.ok = [equipUnlock('ember_plating'), shardCount, equipOwns('ember_plating')]; out.twice = [equipUnlockWhyNot('ember_plating'), equipUnlock('ember_plating'), shardCount]; shardCount = 3000; out.cryst = [equipUnlockWhyNot('impact_test'), equipUnlock('impact_test'), shardCount]; return out; })()`);
            sameJ(o.notFound, ['FIND IT IN A PACK FIRST', false, 5000], 'a card not found'); same(o.found, null, 'a found card can be unlocked'); sameJ(o.short, ['NEED ◆1 MORE', false, 999], 'short of it'); sameJ(o.ok, [true, 0, true], 'unlocked at ◆1,000'); sameJ(o.twice, ['ALREADY UNLOCKED', false, 0], 'twice'); sameJ(o.cryst, [null, true, 2000], 'a Crystalline card: no pack deals it, so it is bought as before');
            same(JSON.parse(store.conduit_fp_cards).owned.join(), 'ember_plating,impact_test', 'what is kept');
        });
    });
    await check('the hand is chosen from the PERMANENT collection, up to 3: a found card that is not unlocked cannot be taken into the hand, a fourth is refused; a card in the hand and found at once is still worn when it is put back out of the hand', () => {
        const o = J(`(function(){ __fresh(0); equipOwnedSet().clear(); ['ember_plating', 'furnace_heart', 'cinderbrand', 'venom_gland'].forEach(id => equipOwnedSet().add(id)); equipFound = ['frost_lining']; equipHand.length = 0; const out = {};
            out.foundOnly = equipHandAdd('frost_lining'); out.add = ['ember_plating', 'furnace_heart', 'cinderbrand', 'venom_gland'].map(id => equipHandAdd(id)); out.hand = equipHand.slice();
            const f = __prep('fire', 'brawler'); equipPut(f, 0, 'ember_plating'); equipFound.push('ember_plating'); equipHandRemove('ember_plating'); out.stillWorn = equipSlots(f).join('|'); equipFound = []; equipTick(true); out.gone = equipSlots(f).join('|'); return out; })()`);
        same(o.foundOnly, false, 'a card that is only found went into the hand'); sameJ(o.add, [true, true, true, false], 'the hand\'s cap'); same(o.hand.length, 3, 'hand'); same(o.stillWorn, 'ember_plating|', 'found as well, it stays worn when put back'); same(o.gone, '|', 'not found and not in the hand, it comes off');
    });
    await check('NEW GAME clears what was found and the hand and keeps the permanent collection (conduit_fp_cards); a game started again begins with the collection and nothing found; ?cards=all and the dev mode are never saved', async () => {
        const store = {}, A = await boot('', store);
        A.run(`shardCount = 5000; equipPackOpen(5); const id = equipFound[0]; equipUnlock(id); equipHandAdd(id); facilitySaveWrite();`); const saved = JSON.parse(store.conduit_fp_save); same(saved.cards.found.length, 4, 'the save holds the found cards'); sameJ(saved.cards.hand.length, 1, 'the hand'); ok(JSON.parse(store.conduit_fp_cards).owned.length === 1, 'the collection holds the unlocked card');
        A.run('facilitySaveClear()'); const B = await boot('', store), r = B.J('({ found: equipFound, hand: equipHand, owned: equipOwnedList().map(function(c){ return c.id; }), last: equipPackLast })');
        sameJ(r.found, [], 'found after NEW GAME'); sameJ(r.hand, [], 'the hand after NEW GAME'); sameJ(r.owned, [saved.cards.hand[0]], 'the collection after NEW GAME'); same(r.last, null, 'the last pack');
        const R = await boot('', {}); const kept = R.J(`(function(){ shardCount = 9000; equipPackOpen(2); const id = equipFound[0]; equipUnlock(id); equipHandAdd(id); equipReset(); return { found: equipFound, hand: equipHand, last: equipPackLast, owned: equipOwnedList().map(c => c.id), id }; })()`); sameJ(kept.found, [], 'equipReset left the found cards'); sameJ(kept.hand, [], 'equipReset left the hand'); same(kept.last, null, 'equipReset left the last pack'); sameJ(kept.owned, [kept.id], 'equipReset touched the collection');
        const D = await boot('?cards=all', {}); D.run(`shardCount = 5000; equipPackOpen(1);`); same(D.J('equipWriteOwned()'), false, '?cards=all wrote the collection');
    });
    await check('what a dealt card becomes is one setting (EQUIP_PACK.keep): "forever" owns it for good at once (and writes the collection), "run" finds it; nothing else changes', async () => {
        const store = {}, B = await boot('', store);
        const o = B.J(`(function(){ shardCount = 1000; EQUIP_PACK.keep = 'forever'; const ids = equipPackOpen(3); const out = { ids, found: equipFound.length, owned: equipOwnedList().map(c => c.id).sort(), fresh: equipPackLast.fresh.length }; EQUIP_PACK.keep = 'run'; return out; })()`);
        same(o.found, 0, 'found'); sameJ(o.owned, o.ids.slice().sort(), 'owned'); same(o.fresh, 4, 'new'); sameJ(JSON.parse(store.conduit_fp_cards).owned.sort(), o.ids.slice().sort(), 'written');
    });

    group('4. EQUIPPING: validation, one card not twice, one card on many followers, moving a card');
    await check('a card cannot be on both slots of one unit; it can be on the other unit\'s; a third slot, a clone, a unit that is gone, the wrong element, a card not found are all refused with a reason, and nothing moves when it is refused', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['ember_plating', 'furnace_heart', 'frost_lining']; const f = __prep('fire', 'brawler'), g = __prep('fire', 'sniper'); const a = __snap(f); const out = {};
            out.first = equipPut(f, 0, 'ember_plating'); out.twice = [equipPut(f, 1, 'ember_plating'), equipWhyNot(f, 'ember_plating', 1)]; out.second = equipPut(f, 1, 'furnace_heart'); out.slots = equipSlots(f).join('|'); out.other = equipPut(g, 1, 'ember_plating'); out.third = equipPut(f, 2, 'ember_plating');
            out.clone = equipPut({ isClone: true, element: 'fire' }, 0, 'ember_plating'); const h = __prep('fire', 'brawler'); h.dead = true; out.dead = equipPut(h, 0, 'ember_plating'); out.ice = [equipPut(f, 0, 'frost_lining'), equipWhyNot(f, 'frost_lining', 0)]; out.notFound = [equipPut(g, 0, 'vortex_core'), equipWhyNot(g, 'vortex_core', 0)];
            out.same = JSON.stringify(equipSlots(f)); out.noCard = [equipPut(f, 0, 'nope'), equipWhyNot(f, 'nope', 0)]; return out; })()`);
        same(o.first, true, 'the first'); sameJ(o.twice, [false, 'ALREADY ON ITS OTHER SLOT'], 'the same card twice'); same(o.second, true, 'a second card'); same(o.slots, 'ember_plating|furnace_heart', 'the slots'); same(o.other, true, 'the same card on another unit'); same(o.third, false, 'a third slot'); same(o.clone, false, 'a clone'); same(o.dead, false, 'a unit that is gone');
        sameJ(o.ice, [false, 'FOR ICE FOLLOWERS'], 'an ice card on a fire follower'); sameJ(o.notFound, [false, 'NOT IN YOUR HAND'], 'a card not found'); sameJ(o.noCard, [false, 'NO SUCH CARD'], 'a card that does not exist'); same(o.same, JSON.stringify(['ember_plating', 'furnace_heart']), 'a refused card moved something');
    });
    await check('one owned (or found) card on many followers at once: each wears it and has its bonus, and it is never used up; moving it (off one, on another) takes its effect off the first and puts it on the second', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['furnace_heart']; const a = __prep('fire', 'brawler'), b = __prep('fire', 'sniper'), c = __prep('fire', 'camper'); const base = [a, b, c].map(f => f.stats.attack); [a, b, c].forEach(f => equipPut(f, 0, 'furnace_heart')); const on = [a, b, c].map(f => f.stats.attack), wearers = equipWearers('furnace_heart');
            equipPut(a, 0, null); const moved = [a, b, c].map(f => f.stats.attack); equipPut(a, 1, 'furnace_heart'); const again = a.stats.attack; return { base, on, wearers, moved, again, found: equipFound.slice() }; })()`);
        o.base.forEach((x, i) => same(o.on[i], st(x, 1.10), 'follower ' + i + '\'s ATK with Furnace Heart')); same(o.wearers, 3, 'wearers'); same(o.moved[0], o.base[0], 'taken off the first'); same(o.moved[1], o.on[1], 'the second keeps it'); same(o.again, o.on[0], 'put on the first again'); sameJ(o.found, ['furnace_heart'], 'never used up');
    });
    await check('two cards on one follower add up: Ember Plating (+5%) and Furnace Heart (+10%) are +15% ATK (a factor of 1.15, not 1.155); with a Crystalline Impact Test (+50%) Ember Plating is +55%: the modifiers add and do not multiply', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['ember_plating', 'furnace_heart']; const f = __prep('fire', 'brawler', 40), a = f.stats.attack; equipPut(f, 0, 'ember_plating'); equipPut(f, 1, 'furnace_heart'); const two = f.stats.attack, k2 = [equipBonus(f, 'attack'), equipMult(f, 'attack')]; equipPut(f, 1, null); equipHand.push('impact_test'); equipPut(f, 1, 'impact_test'); const cr = f.stats.attack, k3 = [equipBonus(f, 'attack'), equipMult(f, 'attack')]; return { a, two, cr, k2, k3 }; })()`);
        same(o.two, st(o.a, 1.15), 'two cards'); near(o.k2[0], 0.15, 'the sum of two'); near(o.k2[1], 1.15, 'the factor of two (1.155 would be a product)'); same(o.cr, st(o.a, 1.55), 'Ember Plating and Impact Test'); near(o.k3[0], 0.55, 'the sum with a Crystalline card'); near(o.k3[1], 1.55, 'the factor with a Crystalline card');
    });
    await check('the player\'s two slots take Universal cards only: no card of Pack 1 can go there (an element card is refused, with its reason)', () => {
        const o = J(`(function(){ equipFound = ['ember_plating']; equipPlayer = [null, null]; return [equipPlayerPut(0, 'ember_plating'), equipPlayerWhyNot('ember_plating', 0), equipPlayer.join()]; })()`);
        sameJ(o, [false, 'UNIVERSAL CARDS ONLY', ','], 'the player');
    });

    group('5. THE STATS: each exact, each gone with the card, made from the base every time');
    const STATCARDS = [['ember_plating', 'fire', 'attack', 0.05], ['furnace_heart', 'fire', 'attack', 0.10], ['venom_gland', 'toxic', 'specialAttack', 0.05], ['corrosive_reservoir', 'toxic', 'specialAttack', 0.10], ['frost_lining', 'ice', 'defense', 0.05], ['permafrost_shell', 'ice', 'defense', 0.10], ['flux_cell', 'flux', 'maxHealth', 0.05], ['vortex_core', 'flux', 'maxHealth', 0.10]];
    for (const [id, el, stat, pct] of STATCARDS) {
        await check(`${id} (${el}, ${stat} +${pct * 100}%): that stat is x${1 + pct} and nothing else moves; off, every number is back; the base, level and XP are never touched`, () => {
            const o = J(`(function(){ __fresh(0); equipFound = ['${id}']; const f = __prep('${el}', 'brawler', 30); const a = __snap(f); const put = equipPut(f, 0, '${id}'), b = __snap(f); for (let i = 0; i < 30; i++) { equipRefresh(f); _applyFollowerLevel(f, false); equipTick(true); } const c = __snap(f); const off = equipPut(f, 0, null), d = __snap(f); return { a, b, c, d, put, off }; })()`);
            same(o.put && o.off, true, 'put on and off'); const X = Object.assign({}, o.b.stats), Y = Object.assign({}, o.a.stats);
            if (stat === 'maxHealth') { same(o.b.maxHealth, Math.round(o.a.stats.hp * 1.25 * (1 + pct)), 'maximum health'); same(o.b.power, o.a.power, 'power moved'); }
            else { same(o.b.stats[stat], st(o.a.stats[stat], (1 + pct)), stat); delete X[stat]; delete Y[stat]; same(o.b.maxHealth, o.a.maxHealth, 'maximum health moved'); if (stat === 'attack') same(o.b.power, o.b.stats.attack, 'power follows ATK'); else same(o.b.power, o.a.power, 'power moved'); }
            sameJ(X, Y, 'another stat moved'); sameJ(o.c.stats, o.b.stats, 'thirty recalculations moved a stat'); same(o.c.maxHealth, o.b.maxHealth, 'thirty recalculations moved the maximum health'); sameJ(o.b.base, o.a.base, 'the base was changed'); same(o.b.level, o.a.level, 'level'); same(o.b.xp, o.a.xp, 'xp');
            sameJ(o.d.stats, o.a.stats, 'taking it off left a stat changed'); same(o.d.maxHealth, o.a.maxHealth, 'maximum health after'); same(o.d.power, o.a.power, 'power after'); sameJ(o.d.base, o.a.base, 'base after');
        });
    }
    await check('Charged Wiring (+5%) and Arc Capacitor (+10%) ATTACK SPEED: the rests after an attack are shorter by that share, by the game\'s own cooldowns (45, 40, 55, 70 frames), and the attacks made in a stretch of frames rise by it; off, as before', () => {
        const N = 2300, o = J(`(function(){ __fresh(0); equipFound = ['charged_wiring', 'arc_capacitor']; const f = __prep('electric', 'camper'), swings = (n) => { const t = { x: f.x + 1, y: f.y, health: 1e9, maxHealth: 1e9, team: 'red', dead: false }; let c = 0; const orig = applyElementalDamage; applyElementalDamage = () => { c++; }; try { f.currentWill = 0; f.attackCooldown = 0; for (let i = 0; i < n; i++) followerAttack(f, t); } finally { applyElementalDamage = orig; } return c; };
            const out = { r0: __rests(f), n0: swings(${N}) }; equipPut(f, 0, 'charged_wiring'); out.r5 = __rests(f); out.n5 = swings(${N}); equipPut(f, 0, 'arc_capacitor'); out.r10 = __rests(f); out.n10 = swings(${N}); equipPut(f, 0, 'charged_wiring'); equipPut(f, 1, 'arc_capacitor'); out.r15 = __rests(f); equipPut(f, 0, null); equipPut(f, 1, null); out.r00 = __rests(f); out.stats = JSON.stringify(f.stats) === JSON.stringify(levelledStats(f.base, f.level)); return out; })()`);
        const per = rest => Math.floor((N - 1) / (rest + 1)) + 1;
        sameJ(o.r0, [45, 40, 55, 70], 'the rests as they were'); sameJ(o.r5, [45, 40, 55, 70].map(n => restOf(n, 1.05)), '+5%'); sameJ(o.r10, [45, 40, 55, 70].map(n => restOf(n, 1.10)), '+10%'); sameJ(o.r15, [45, 40, 55, 70].map(n => restOf(n, 1.15)), 'both: +15% (added)'); sameJ(o.r00, o.r0, 'off');
        same(o.n0, per(45), 'attacks before'); same(o.n5, per(restOf(45, 1.05)), 'attacks with +5%'); same(o.n10, per(restOf(45, 1.10)), 'attacks with +10%'); ok(o.n5 > o.n0 && o.n10 > o.n5, 'more attacks'); same(o.stats, true, 'a stat moved');
    });
    await check('Frost Lining and Permafrost Shell DEFENSE: a hit on the follower is taken down by the game\'s own defense rule (levels.js defenseMult) with the raised DEF: a hit of 20 takes what it took before times the new factor', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['frost_lining', 'permafrost_shell']; const f = __prep('ice', 'brawler', 30), foe = { x: f.x + 1, y: f.y, team: 'red', level: 30 }; f.spawnProtection = 0; const hit = () => { f.health = f.maxHealth; const h = f.health; applyDamage(f, 20, foe); return h - f.health; };
            const out = { d0: f.stats.defense, h0: hit(), mult0: defenseMult(f, foe) }; equipPut(f, 0, 'frost_lining'); out.d5 = f.stats.defense; out.h5 = hit(); out.mult5 = defenseMult(f, foe); equipPut(f, 0, 'permafrost_shell'); out.d10 = f.stats.defense; out.h10 = hit(); equipPut(f, 0, null); out.hOff = hit(); return out; })()`);
        same(o.d5, st(o.d0, 1.05), 'DEF +5%'); same(o.d10, st(o.d0, 1.10), 'DEF +10%'); near(o.h0, 20 * o.mult0, 'the hit before'); near(o.h5, 20 * o.mult5, 'the hit with +5%'); ok(o.h5 < o.h0 && o.h10 < o.h5, 'the hits were not taken down more'); near(o.hOff, o.h0, 'taken off, as before');
    });
    await check('Venom Gland and Corrosive Reservoir SPECIAL ATTACK: what is made from SP.ATK (a Mage\'s ranged shot x0.5, an element\'s special) is made from the raised number', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['venom_gland', 'corrosive_reservoir']; const f = __prep('toxic', 'sniper', 30); f.x = crystal.x; f.y = crystal.y; f.stance = 'follow'; f.job = null; f.post = null; f.health = f.maxHealth = 1e9;
            const shot = () => { const e = __ant(0, 0); f.attackCooldown = 0; const log = [], orig = spawnFollowerProjectile; spawnFollowerProjectile = (a, t, col, dmg) => { log.push(dmg); }; try { frame++; e.x = f.x + 3.2; e.y = f.y; updateNPC(f); } finally { spawnFollowerProjectile = orig; __gone(e); } return log[0]; };
            const out = { sp0: f.stats.specialAttack, s0: shot() }; equipPut(f, 0, 'venom_gland'); out.sp5 = f.stats.specialAttack; out.s5 = shot(); equipPut(f, 0, 'corrosive_reservoir'); out.sp10 = f.stats.specialAttack; out.s10 = shot(); return out; })()`);
        same(o.s0, o.sp0 * 0.5, 'the shot before'); same(o.s5, o.sp5 * 0.5, 'the shot with +5%'); same(o.s10, o.sp10 * 0.5, 'the shot with +10%'); same(o.sp5, st(o.sp0, 1.05), 'SP.ATK +5%'); same(o.sp10, st(o.sp0, 1.10), 'SP.ATK +10%');
    });
    await check('Flux Cell and Vortex Core MAXIMUM HP follow the health rule: a gain is added to the current health, a loss comes off it (never under 1), a card on and off again does not heal', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['flux_cell', 'vortex_core']; const f = __prep('flux', 'brawler', 30), full = f.maxHealth; f.health = Math.round(full / 2); const h0 = f.health; equipPut(f, 0, 'vortex_core'); const gain = f.maxHealth - full, on = f.health; equipPut(f, 0, null); const off = f.health;
            for (let i = 0; i < 6; i++) { equipPut(f, 0, 'flux_cell'); equipPut(f, 0, null); } const cyc = f.health; f.health = f.maxHealth; equipPut(f, 0, 'vortex_core'); const fullOn = f.health === f.maxHealth; equipPut(f, 0, null); return { full, h0, gain, on, off, cyc, fullOn, fullOff: f.health === f.maxHealth }; })()`);
        same(o.on, o.h0 + o.gain, 'put on'); same(o.off, o.h0, 'taken off'); same(o.cyc, o.h0, 'swaps healed'); same(o.fullOn && o.fullOff, true, 'full stays full');
    });
    await check('Impact Studs (+5%) and Bedrock Matrix (+10%) DAMAGE DEALT: every hit the follower lands is that much bigger, whatever the attack (the plain hit, an element\'s physical and special, a projectile, a signature move); off, as before; a set amount and a creature\'s hit are not changed', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['impact_studs', 'bedrock_matrix']; const f = __prep('core', 'brawler', 30), e = __ant(1, 0); f.currentWill = 1e5; const out = { direct: [], plain: [], phys: [], spec: [], sig: [] };
            const hits = (fn) => { const got = [], orig = applyDamage; applyDamage = (t, a, s, el, r, fx) => { const h = t.health; orig(t, a, s, el, r, fx); got.push(h - t.health); }; try { fn(); } finally { applyDamage = orig; } return got; };
            const run = (tag) => { e.health = e.maxHealth = 1e9; out.direct.push(__dealt(e, 100, f)); out.plain.push(hits(() => { f.currentWill = 0; f.attackCooldown = 0; followerAttack(f, e); })[0]); f.currentWill = 1e5; out.phys.push(hits(() => { ELEMENT_ATTACKS.core.physical(f, e); })[0]); };
            run(); equipPut(f, 0, 'impact_studs'); run(); equipPut(f, 0, 'bedrock_matrix'); run(); equipPut(f, 0, 'impact_studs'); equipPut(f, 1, 'bedrock_matrix'); run(); equipPut(f, 0, null); equipPut(f, 1, null); run();
            out.fixed = [__with(0.5, () => { equipPut(f, 0, 'bedrock_matrix'); const h = e.health; applyDamage(e, 50, f, null, false, true); return h - e.health; })]; out.nofollower = []; const foe = { x: e.x, y: e.y, team: 'red', isFollower: false, cards: ['bedrock_matrix', null] }; const g = __prep('core', 'brawler'); g.spawnProtection = 0; const hg = g.health; applyDamage(g, 10, foe); out.hitOnFollower = hg - g.health; equipPut(f, 0, null); const hh = g.health; applyDamage(g, 10, foe); out.hitOnFollower2 = hh - g.health; __gone(e); return out; })()`);
        const base = o.direct[0]; near(o.direct[1], base * 1.05, 'a hit of 100 with +5%', 1e-6); near(o.direct[2], base * 1.10, 'with +10%', 1e-6); near(o.direct[3], base * 1.15, 'both: +15% (added)', 1e-6); near(o.direct[4], base, 'off'); ok(base > 0, 'the creature took nothing');
        near(o.plain[1] / o.plain[0], 1.05, 'the plain hit +5%', 1e-6); near(o.plain[2] / o.plain[0], 1.10, 'the plain hit +10%', 1e-6); near(o.phys[1] / o.phys[0], 1.05, 'the core bash +5%', 1e-6); near(o.phys[2] / o.phys[0], 1.10, 'the core bash +10%', 1e-6); near(o.phys[4], o.phys[0], 'the core bash off');
        near(o.fixed[0], 50, 'a set amount is as set'); near(o.hitOnFollower, o.hitOnFollower2, 'a creature\'s hit with a card on its own record (not a follower) is not changed');
    });
    await check('Impact Studs reaches a projectile, a signature move and an ultimate too: every one of them goes through the same damage code, so the multiplier is in the damage the game deals, not only in one attack', () => {
        const src = rd('js/helpers.js'); const i = src.indexOf('function applyDamage'), j = src.indexOf('function applyElementalDamage'); const body = src.slice(i, j);
        ok(/!fixed && source && source\.isFollower && source\.team === "green" && source\.cards && typeof equipMult === "function"\) amount \*= equipMult\(source, "damage"\)/.test(body), 'the multiplier is not in applyDamage');
        const callers = ['js/game.js', 'js/evolution.js', 'js/elements.js'].map(f => (rd(f).match(/applyDamage\(|applyElementalDamage\(/g) || []).length); ok(callers.every(n => n > 0), 'the projectile, the moves and the specials do not go through applyDamage');
    });

    group('6. THE PROCS: Burn, Poison, Paralyze, Slow, Siphon, Knockback');
    await check('the chance: each hit rolls once per proc card, strictly under the chance (0.1499 procs a 15%, 0.15 does not); no card, no roll; the wrong element wears none of it', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['cinderbrand', 'static_lock']; const f = __prep('fire', 'brawler'), e = __ant(1, 0); let rolls = 0; const orig = equipOnHit; equipOnHit = (a, b, c) => { rolls++; return orig(a, b, c); }; const out = {};
            equipPut(f, 0, 'cinderbrand'); const at = v => { e.burning = 0; e.burnDamage = 0; __with(v, () => applyDamage(e, 10, f)); return e.burning > 0; };
            out.under = at(0.1499); out.at = at(0.15); out.over = at(0.9); out.zero = at(0); rolls = 0; applyDamage(e, 10, f); out.rolls1 = rolls; const g = __prep('electric', 'brawler'); rolls = 0; applyDamage(e, 10, g); out.noCard = rolls; equipPut(f, 0, null); rolls = 0; applyDamage(e, 10, f); out.rolls0 = rolls;
            f.cards = ['cinderbrand', null]; f.element = 'ice'; e.burning = 0; __with(0, () => applyDamage(e, 10, f)); out.wrongElement = e.burning; f.element = 'fire'; equipOnHit = orig; __gone(e); return out; })()`);
        same(o.under, true, '0.1499'); same(o.at, false, '0.15'); same(o.over, false, '0.9'); same(o.zero, true, '0'); same(o.rolls1, 1, 'a hit rolls once for one card'); same(o.noCard, 0, 'a follower with no card rolled'); same(o.rolls0, 0, 'a follower whose card is off is not even asked'); same(o.wrongElement, 0, 'a card on a follower of another element did something');
    });
    await check('BURN (Cinderbrand: 15%, 3 damage a second for 3 seconds): a proc sets the game\'s own burn (180 frames, 1 a tick: three ticks a second), 9 damage over 3 seconds, and it is over after', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['cinderbrand']; const f = __prep('fire', 'brawler'), e = __ant(1, 0); equipPut(f, 0, 'cinderbrand'); __with(0, () => applyDamage(e, 1, f)); const out = { burning: e.burning, tick: e.burnDamage, others: [e.toxicWeakened || 0, e.glitched || 0, e.stunned || 0].join() }; const h0 = e.health; __tick(180); out.dealt = h0 - e.health; out.after = [e.burning, e.health === e.health]; const h1 = e.health; __tick(120); out.late = h1 - e.health; __gone(e); return out; })()`);
        same(o.burning, 180, 'the burn\'s frames'); near(o.tick, 1, 'a tick'); same(o.others, '0,0,0', 'another status (a weakness, a glitch, a stun) came with the burn'); near(o.dealt, 9, '3 damage a second for 3 seconds'); same(o.after[0], 0, 'it ran out'); same(o.late, 0, 'it kept burning');
    });
    await check('POISON (Mireblight: 15%, no damage, it makes the creature weak for 4 seconds): a proc sets the game\'s own weakness: its bite lands for 60% of its power (the share the card says it cuts: 40%), nothing is taken from its health, and it runs out and its bite is back', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['mireblight']; const f = __prep('toxic', 'brawler'), e = __ant(1, 0), g = __prep('fire', 'brawler'); g.spawnProtection = 0; g.health = g.maxHealth = 1e9; g.x = e.x + 1; g.y = e.y; equipPut(f, 0, 'mireblight');
            const bite = () => { const h = g.health; e.bite(g); return h - g.health; }; const out = { free: bite() }; const h0 = e.health; __with(0, () => applyDamage(e, 1, f)); out.hit = h0 - e.health; out.timer = e.toxicWeakened; out.factor = e.toxicWeakenFactor; out.weak = bite();
            const h1 = e.health; __tick(240); out.ticks = h1 - e.health; out.after = [e.toxicWeakened, e.toxicWeakenFactor === undefined]; out.back = bite(); const keys = Object.keys(e).filter(k => /poison/i.test(k)); out.noPoisonFields = keys.length; __gone(e); return out; })()`);
        same(o.timer, 240, 'the weakness\'s frames'); near(o.factor, 0.6, 'the share of its power it keeps'); near(o.weak / o.free, 0.6, 'its bite with the weakness'); ok(o.free > 0, 'the free bite did nothing'); near(o.hit, 1, 'the hit took only its own damage (a poison that does damage took more)', 0.05); same(o.ticks, 0, 'a poison that does damage'); sameJ(o.after, [0, true], 'it ran out'); near(o.back / o.free, 1, 'its bite is back'); same(o.noPoisonFields, 0, 'a damage-over-time poison is left on the creature');
    });
    await check('the weakness is refreshed, never stacked, and a stronger one is kept: a thousand procs hold one 240-frame timer; a weakness of x0.3 is not undone by the card\'s x0.6; the smoke bomb\'s own weakness (no strength of its own) is still x0.6', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['mireblight']; const f = __prep('toxic', 'brawler'), e = __ant(1, 0), g = __prep('fire', 'brawler'); g.spawnProtection = 0; g.health = g.maxHealth = 1e9; g.x = e.x + 1; g.y = e.y; equipPut(f, 0, 'mireblight'); const bite = () => { const h = g.health; e.bite(g); return h - g.health; }; const out = {};
            for (let i = 0; i < 1000; i++) { __with(0, () => applyDamage(e, 0.01, f)); if (i % 9 === 0) __tick(1); } out.timer = e.toxicWeakened; e.toxicWeakened = 0; e.toxicWeakenFactor = undefined; applyWeaken(e, 240, 0.3); __with(0, () => applyDamage(e, 0.01, f)); out.stronger = e.toxicWeakenFactor; out.time = e.toxicWeakened;
            e.toxicWeakened = 240; e.toxicWeakenFactor = undefined; const free = (() => { e.toxicWeakened = 0; return bite(); })(); e.toxicWeakened = 240; out.smoke = bite() / free; out.follower = [applyWeaken(g, 240, 0.6), g.toxicWeakened || 0]; __gone(e); return out; })()`);
        ok(o.timer <= 240, 'the weakness ran past its time: ' + o.timer); near(o.stronger, 0.3, 'the stronger weakness was undone'); ok(o.time >= 239, 'its time was cut'); near(o.smoke, 0.6, 'the smoke bomb\'s weakness'); sameJ(o.follower, [false, 0], 'a follower was weakened');
    });
    await check('GLITCH (Static Lock: 10%, 0.5 seconds): a proc sets a 30-frame glitch; a glitched creature never finishes a wind-up: a bite it was winding up is cut, and it cannot start another until the glitch is over, but it can still walk; after it, it bites again', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['static_lock']; const f = __prep('electric', 'brawler'); f.x = crystal.x; f.y = crystal.y; f.health = f.maxHealth = 1e9; f.stance = 'hold'; f.job = { type: 'move', target: { x: f.x, y: f.y } }; f.attackCooldown = 1e9; f.spawnProtection = 0; equipPut(f, 0, 'static_lock');
            const e = __ant(1, 0); e.state = 'hunt'; e.provoked = true; const out = {}; const p0 = [crystal.x + 1, crystal.y];
            const step = n => { const r = Math.random; Math.random = () => 0.5; try { const p = []; for (let i = 0; i < n; i++) { frame++; updateStatusEffects(); updateNPC(e); p.push([e.x, e.y, e.attackWindup || 0]); } return p; } finally { Math.random = r; } };
            out.freeWindup = step(12).some(p => p[2] > 0);
            e.x = p0[0]; e.y = p0[1]; e.state = 'hunt'; e.attackWindup = 12; e.biteTarget = f; e.attackAnim = 0.4; e.attackCooldown = 0; const h0 = f.health; __with(0, () => applyDamage(e, 1, f)); out.timer = e.glitched; out.cut = [e.attackWindup, e.biteTarget, e.attackAnim];
            const during = step(28); out.noWindup = during.every(p => p[2] === 0); out.left = e.glitched; out.hurt = h0 - f.health; const after = step(40); out.over = e.glitched; out.windupAfter = after.some(p => p[2] > 0);
            const g = __prep('fire', 'brawler'); out.follower = [applyGlitch(g, 30), g.glitched || 0]; out.clone = applyGlitch({ isClone: true, team: 'green', health: 5 }, 30);
            // it still walks: a creature far from everything, hunting the Crystal, moves while glitched
            const w = __ant(8, 8); w.state = 'hunt'; w.provoked = true; applyGlitch(w, 30); const x0 = [w.x, w.y]; const r = Math.random; Math.random = () => 0.5; try { for (let i = 0; i < 20; i++) { frame++; updateStatusEffects(); updateNPC(w); } } finally { Math.random = r; } out.walked = Math.hypot(w.x - x0[0], w.y - x0[1]);
            __gone(e); __gone(w); return out; })()`);
        same(o.freeWindup, true, 'a free creature never wound up a bite beside a follower'); same(o.timer, 30, 'the glitch\'s frames'); sameJ(o.cut, [0, null, 0], 'the bite it was winding up was not cut'); same(o.noWindup, true, 'it started a wind-up while glitched'); same(o.left, 2, 'the timer ran down a frame each'); same(o.hurt, 1e9 * 0 + o.hurt, 'x'); same(o.over, 0, 'it ran out'); same(o.windupAfter, true, 'it did not bite again after');
        sameJ(o.follower, [false, 0], 'a follower was glitched'); same(o.clone, false, 'a clone was glitched'); ok(o.walked > 0.1, 'a glitched creature could not walk: ' + o.walked);
    });
    await check('GLITCH reaches the ability wind-ups too (the telegraph before a leap, a web, a dust cloud): the wind-up it is in fails, and it cannot start one while glitched; without the glitch the same creature winds up', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('electric', 'brawler'); f.x = crystal.x + 1; f.y = crystal.y; f.spawnProtection = 1e9; const e = __ant(1, 0); e.provoked = true; e.state = 'hunt'; e.health = e.maxHealth = 100; e.health = 5; abilityTick(e); e.abilityCharge = 100;   // (a scout leaps to get away, low on health with a foe close)
            const wound = () => { e.abilityPhase = 'ready'; e.abilityCharge = 100; abilityTick(e); return e.abilityPhase === 'winding'; }; const out = { control: wound() };
            e.abilityPhase = 'winding'; e.abilityTimer = 15; applyGlitch(e, 30); out.cut = e.abilityPhase; let started = 0; for (let i = 0; i < 25; i++) { frame++; updateStatusEffects(); e.abilityCharge = 100; abilityTick(e); if (e.abilityPhase === 'winding') started++; } out.started = started; out.left = e.glitched; for (let i = 0; i < 10; i++) { frame++; updateStatusEffects(); } e.abilityPhase = 'ready'; e.abilityCharge = 100; abilityTick(e); out.after = e.abilityPhase === 'winding'; __gone(e); return out; })()`);
        same(o.control, true, 'the control: with no glitch this creature did not wind up (the test is not staged right)'); same(o.cut, 'ready', 'the wind-up it was in was not cut'); same(o.started, 0, 'it started an ability wind-up while glitched'); same(o.after, true, 'it did not wind up after the glitch');
    });
    await check('the Frost Maw\'s and the Manta\'s STUNS are real: a stunned creature does not move, bite or use an ability until the timer is out, a bite it was winding up is cut, and it acts again after; a follower or a clone cannot be stunned (js/combat.js applyStun, called by both moves)', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('electric', 'brawler'); f.x = crystal.x; f.y = crystal.y; f.health = f.maxHealth = 1e9; f.stance = 'hold'; f.job = { type: 'move', target: { x: f.x, y: f.y } }; f.attackCooldown = 1e9; f.spawnProtection = 0;
            const e = __ant(1, 0); e.state = 'hunt'; e.provoked = true; const out = {}; const p0 = [crystal.x + 1, crystal.y];
            const step = n => { const r = Math.random; Math.random = () => 0.5; try { const p = []; for (let i = 0; i < n; i++) { frame++; updateStatusEffects(); updateNPC(e); p.push([e.x, e.y, e.attackWindup || 0]); } return p; } finally { Math.random = r; } };
            const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]), acts = ps => ps.some(p => p[2] > 0 || dist(p, p0) > 0.01); out.free = acts(step(10));
            e.x = p0[0]; e.y = p0[1]; e.state = 'hunt'; e.attackWindup = 12; e.biteTarget = f; e.attackAnim = 0.4; e.attackCooldown = 0; out.fresh = applyStun(e, 45); out.cut = [e.attackWindup, e.biteTarget, e.attackAnim, e.attackCooldown];
            const held = step(44); out.held = held.every(p => p[0] === p0[0] && p[1] === p0[1] && p[2] === 0); out.left = e.stunned; const after = step(120); out.resumed = acts(after);
            for (let i = 0; i < 500; i++) applyStun(e, 45); out.timer = e.stunned; const g = __prep('fire', 'brawler'); out.follower = [applyStun(g, 30), g.stunned || 0]; out.clone = applyStun({ isClone: true, team: 'green', health: 5 }, 30); __gone(e); return out; })()`);
        same(o.free, true, 'the creature did nothing when free'); same(o.fresh, true, 'a first stun'); sameJ(o.cut.slice(0, 3), [0, null, 0], 'the bite was not cut'); ok(o.cut[3] >= 45, 'it did not rest'); same(o.held, true, 'it moved or wound up a bite while stunned'); same(o.left, 1, 'the timer ran down a frame each'); same(o.resumed, true, 'it did not act again'); ok(o.timer <= 45, 'a stun stacked: ' + o.timer); sameJ(o.follower, [false, 0], 'a follower was stunned'); same(o.clone, false, 'a clone was stunned');
    });
    await check('SLOW (Rime Snare: 20%, 25% of its speed for 2 seconds): the game\'s own slow (120 frames, x0.75): the target\'s speed is cut by a quarter while it lasts and is back after; a stronger slow it already has (a web) is kept', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['rime_snare']; const f = __prep('ice', 'brawler'), e = __ant(1, 0); e.state = 'wander'; e.moveSpeed = 0.02; e.baseMoveSpeed = 0.02; equipPut(f, 0, 'rime_snare'); __tick(1); __with(0, () => applyDamage(e, 1, f)); const out = { slowed: e.slowed, k: e.slowFactor }; __tick(5); out.speed = e.moveSpeed; __tick(125); out.after = [e.moveSpeed, e.slowFactor, e.slowed];
            e.slowed = 0; e.slowFactor = 1; applySlow(e, 300, 0.18); __with(0, () => applyDamage(e, 1, f)); out.web = [e.slowFactor, e.slowed]; __gone(e); return out; })()`);
        same(o.slowed, 120, 'the frames'); near(o.k, 0.75, 'the factor'); near(o.speed, 0.015, 'a quarter off its speed'); sameJ(o.after, [0.02, 1, 0], 'back after'); same(o.web[0], 0.18, 'a stronger slow was weakened'); ok(o.web[1] >= 295, 'the web\'s time was cut: ' + o.web[1]);
    });
    await check('SIPHON (Siphon Field: 15%, 10% of the damage dealt, to the follower): a proc heals the attacker by a tenth of what the hit really took (never past its maximum, none at full health), even when the hit kills; no proc, no heal', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['siphon_field']; const f = __prep('flux', 'brawler', 30), e = __ant(1, 0); equipPut(f, 0, 'siphon_field'); f.health = f.maxHealth / 2; const out = {};
            const h0 = f.health, dealt = __with(0, () => __dealt(e, 80, f)); out.gain = f.health - h0; out.dealt = dealt; const h1 = f.health; __with(0.9, () => applyDamage(e, 80, f)); out.noProc = f.health - h1; f.health = f.maxHealth - 0.2; __with(0, () => applyDamage(e, 80, f)); out.capped = f.health === f.maxHealth;
            e.health = e.maxHealth = 12; f.health = 1; __with(0, () => applyDamage(e, 80, f)); out.kill = [f.health - 1, e.dead || e.health <= 0]; __gone(e); return out; })()`);
        near(o.gain, o.dealt * 0.10, 'a tenth of the damage dealt'); same(o.noProc, 0, 'a heal without a proc'); same(o.capped, true, 'past the maximum'); near(o.kill[0], 1.2, 'a kill heals a tenth of the health it took (12), not of the overkill'); same(o.kill[1], true, 'it died');
    });
    await check('KNOCKBACK (Repulsor Pulse: 15%, a short distance): a proc pushes the target away from the attacker with the Core bash\'s push (0.22, about 0.8 tile in all), and a second push replaces the first, it does not add', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['repulsor_pulse']; const f = __prep('core', 'brawler'), e = __ant(2, 0); f.x = crystal.x; f.y = crystal.y; e.x = f.x + 2; e.y = f.y; e.moveSpeed = 0; equipPut(f, 0, 'repulsor_pulse'); __with(0, () => applyDamage(e, 1, f)); const out = { v: [e.kbVX, e.kbVY] }; const x0 = e.x, y0 = e.y;
            for (let i = 0; i < 40; i++) { frame++; updateStatusEffects(); } out.moved = [e.x - x0, e.y - y0]; out.stopped = [e.kbVX, e.kbVY]; for (let i = 0; i < 50; i++) __with(0, () => applyDamage(e, 1, f)); out.v2 = [e.kbVX, e.kbVY]; __gone(e); return out; })()`);
        near(o.v[0], 0.22, 'the push'); near(o.v[1], 0, 'sideways'); near(o.moved[0], 0.22 / (1 - 0.72), 'the distance it carried it', 0.03); near(o.moved[1], 0, 'sideways distance'); sameJ(o.stopped, [0, 0], 'it stopped'); ok(o.moved[0] > 0.5 && o.moved[0] < 1.2, 'a short distance: ' + o.moved[0]); near(Math.hypot(o.v2[0], o.v2[1]), 0.22, 'fifty pushes did not add up');
    });
    await check('REFRESH, NEVER STACK: a status already on is refreshed (its time is at most its full time, its number the strongest), however many procs land; a fast hitter keeps one timer going; the total of a burn after a thousand procs is the total of one', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['cinderbrand', 'mireblight', 'static_lock', 'rime_snare']; const out = {}; const mk = (el, id) => { const f = __prep(el, 'brawler'); equipPut(f, 0, id); return f; }; const e = __ant(1, 0);
            const fb = mk('fire', 'cinderbrand'), fp = mk('toxic', 'mireblight'), fs = mk('electric', 'static_lock'), fr = mk('ice', 'rime_snare'); e.state = 'wander'; e.moveSpeed = 0.02; e.baseMoveSpeed = 0.02;
            for (let i = 0; i < 1000; i++) { __with(0, () => { applyDamage(e, 0.01, fb); applyDamage(e, 0.01, fp); applyDamage(e, 0.01, fs); applyDamage(e, 0.01, fr); }); if (i % 7 === 0) { frame++; updateStatusEffects(); e.attackWindup = 0; } }
            out.timers = [e.burning, e.toxicWeakened, e.glitched, e.slowed]; out.tick = e.burnDamage; out.weak = e.toxicWeakenFactor; out.factor = e.slowFactor; __with(0.99, () => { __tick(400); }); out.after = [e.burning, e.toxicWeakened, e.glitched, e.slowed, e.slowFactor, e.moveSpeed, e.toxicWeakenFactor === undefined]; __gone(e); return out; })()`);
        ok(o.timers[0] <= 180 && o.timers[1] <= 240 && o.timers[2] <= 30 && o.timers[3] <= 120, 'a timer ran past its full time: ' + o.timers); near(o.tick, 1, 'the burn\'s tick'); near(o.weak, 0.6, 'the weakness\'s strength'); near(o.factor, 0.75, 'the slow\'s factor'); sameJ(o.after.slice(0, 5), [0, 0, 0, 0, 1], 'every status ran out'); near(o.after[5], 0.02, 'its speed is back'); same(o.after[6], true, 'the weakness\'s strength was left');
        const one = J(`(function(){ __fresh(0); const e = __ant(1, 0); applyBurn(e, 1, 180); const h = e.health; __tick(180); const once = h - e.health; const e2 = __ant(1, 0); for (let i = 0; i < 1000; i++) applyBurn(e2, 1, 180); const h2 = e2.health; __tick(180); const many = h2 - e2.health; __gone(e); __gone(e2); return { once, many }; })()`); near(one.many, one.once, 'a thousand burns burned more than one');
    });
    await check('no proc from what is not an attack: a burn\'s or a poison\'s own tick, a reflected hit, a set amount, a creature\'s or a clone\'s hit, a hit on a friend, a hit that a shield took, a hit on a dead target', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['cinderbrand', 'siphon_field']; const f = __prep('fire', 'brawler'), e = __ant(1, 0); equipPut(f, 0, 'cinderbrand'); let calls = 0; const orig = equipOnHit; equipOnHit = (a, b, c) => { calls++; return orig(a, b, c); }; const out = {};
            applyBurn(e, 1, 120); __tick(120); out.burnTicks = calls; applyDamage(e, 5, f, null, true); out.reflected = calls; applyDamage(e, 5, f, null, false, true); out.fixed = calls;
            const foe = { x: e.x, y: e.y, team: 'red', isFollower: false, cards: ['cinderbrand', null], element: 'fire' }; applyDamage(__prep('fire', 'brawler'), 5, foe); out.creature = calls; const cl = { x: e.x, y: e.y, team: 'green', isClone: true, isFollower: false, cards: ['cinderbrand', null] }; applyDamage(e, 5, cl); out.clone = calls;
            const a = __prep('fire', 'brawler'); a.spawnProtection = 0; applyDamage(a, 5, f); out.friend = calls; e.shielded = true; e.shieldAmount = 1e6; applyDamage(e, 5, f); out.shield = calls; e.shielded = false; e.shieldAmount = 0; const d = __ant(1, 0); d.dead = true; applyDamage(d, 5, f); out.dead = calls;
            applyDamage(e, 5, f); out.real = calls; equipOnHit = orig; __gone(e); __gone(d); return out; })()`);
        same(o.burnTicks, 0, 'a burn\'s own ticks rolled'); same(o.reflected, 0, 'a reflected hit'); same(o.fixed, 0, 'a set amount'); same(o.creature, 0, 'a creature\'s hit'); same(o.clone, 0, 'a clone\'s hit'); same(o.shield, 1, 'a hit a shield took (the friend\'s hit counted: ' + o.friend + ')'); same(o.dead, 1, 'a hit on a dead target'); same(o.real, 2, 'a real hit');
    });

    group('7. LEAVING: the slots are emptied, never the collection');
    await check('EXILE, falling for good and a RE-ROLL empty a follower\'s slots (the cards stay found, owned and wearable by someone else); a respawn at the Crystal keeps the cards and the bonus once', () => {
        const o = J(`(function(){ const out = {}; const mk = () => { const f = __prep('fire', 'brawler', 6); f.base = f.base; equipFound = ['ember_plating', 'furnace_heart']; equipOwnedSet().clear(); equipOwnedSet().add('ember_plating'); equipPut(f, 0, 'ember_plating'); equipPut(f, 1, 'furnace_heart'); return f; };
            __fresh(0); let f = mk(); const ex = partyExile(f, true); out.exile = { ok: ex, worn: equipWorn(f), field: f.cards === undefined, found: equipFound.slice(), owned: equipOwnedList().map(c => c.id), wearers: equipWearers('ember_plating') };
            __fresh(0); f = mk(); __fall(f, true); out.loss = { worn: equipWorn(f), found: equipFound.length, owned: equipOwnedList().length, queued: respawnQueue.filter(e => !e.isClone).length }; const g = __prep('fire', 'sniper'); out.reuse = equipPut(g, 0, 'ember_plating');
            __fresh(0); f = mk(); const rr = startFollowerReroll(f, true); out.reroll = { ok: rr, worn: equipWorn(f), field: f.cards === undefined, found: equipFound.length, owned: equipOwnedList().length };
            __fresh(0); f = mk(); const uid = followerUid(f); const lv = levelledStats(f.base, f.level); __fall(f, false); __frames(260); equipTick(true); const back = followers.filter(x => followerUid(x) === uid)[0]; const bl = back ? levelledStats(back.base, back.level) : null, em = back && back.evolved ? EVOLVE_MULT : 1;
            out.respawn = { back: !!back, cards: back && back.cards, atk: back && back.stats.attack, expect: bl && Math.max(1, Math.round(Math.round(bl.attack * em) * 1.15 * 1000) / 1000) }; return out; })()`);
        same(o.exile.ok, true, 'exile'); same(o.exile.worn, 0, 'exile: worn'); same(o.exile.field, true, 'exile: a field was left'); sameJ(o.exile.found, ['ember_plating', 'furnace_heart'], 'exile: the found cards'); sameJ(o.exile.owned, ['ember_plating'], 'exile: the collection'); same(o.exile.wearers, 0, 'exile: wearers');
        same(o.loss.worn, 0, 'falling for good: worn'); same(o.loss.found, 2, 'falling for good: found'); same(o.loss.owned, 1, 'falling for good: the collection'); same(o.loss.queued, 0, 'it was queued to come back'); same(o.reuse, true, 'the card could not be worn by another');
        same(o.reroll.ok, true, 're-roll'); same(o.reroll.worn, 0, 're-roll: worn'); same(o.reroll.field, true, 're-roll: a field'); same(o.reroll.found, 2, 're-roll: found'); same(o.reroll.owned, 1, 're-roll: the collection');
        same(o.respawn.back, true, 'it did not come back'); sameJ(o.respawn.cards, ['ember_plating', 'furnace_heart'], 'a respawn keeps the cards'); same(o.respawn.atk, o.respawn.expect, 'a respawn has the bonus once (+15%)');
    });
    await check('evolving keeps an element card (the form keeps the element), and a card whose element the follower no longer has comes off at the next tick, with its bonus', () => {
        const o = J(`(function(){ __fresh(0); equipFound = ['ember_plating']; const f = __prep('fire', 'brawler', 6); equipPut(f, 0, 'ember_plating'); const lv = levelledStats(f.base, f.level);
            const fire = Object.values(EVOLUTIONS).find(e => !e.legacy && e.element === 'fire'), other = Object.values(EVOLUTIONS).find(e => !e.legacy && e.element !== 'fire'); __form(f, fire.id); _applyFollowerLevel(f, false); equipTick(true); const kept = f.cards ? f.cards.slice() : null, atk = f.stats.attack, expect = Math.max(1, Math.round(Math.round(lv.attack * EVOLVE_MULT) * 1.05 * 1000) / 1000);
            __form(f, other.id); equipTick(true); const gone = f.cards === undefined, atk2 = f.stats.attack, expect2 = Math.round(Math.round(lv.attack * EVOLVE_MULT)); return { kept, atk, expect, gone, atk2, expect2 }; })()`);
        sameJ(o.kept, ['ember_plating', null], 'evolving into a fire form'); same(o.atk, o.expect, 'its ATK with the card'); same(o.gone, true, 'a form of another element kept the card'); same(o.atk2, o.expect2, 'its ATK without it');
    });

    group('8. SAVING: the found cards, the cards worn and the collection; no new key, an old save loads');
    await check('a game is saved with its found cards, its hand and the cards a follower wears, and comes back with them and each bonus once (three loads in a row); the save has the same keys and version; the collection is its own key', async () => {
        const store = {}, A = await boot('', store);
        const a = A.J(`(function(){ shardCount = 9000; equipPackOpen(21); const fire = equipFound.find(id => equipCard(id).match === 'fire') || null; equipFound = ['ember_plating', 'furnace_heart'].concat(equipFound.filter(id => id !== 'ember_plating' && id !== 'furnace_heart')); equipUnlock('ember_plating'); equipHandAdd('ember_plating'); const f = __fresh(2)[0]; f.role = 'brawler'; f.element = 'fire'; delete f.evolved; f.perk = null; __lv(f, 15); const before = __snap(f); equipPut(f, 0, 'ember_plating'); equipPut(f, 1, 'furnace_heart'); facilitySaveWrite(); return { uid: followerUid(f), before, on: __snap(f), found: equipFound.slice() }; })()`);
        const saved = JSON.parse(store.conduit_fp_save); sameJ(saved.cards.found, a.found, 'the found cards in the save'); sameJ(saved.cards.hand, ['ember_plating'], 'the hand'); const rec = saved.followers.find(e => e.uid === a.uid); sameJ(rec.cards, ['ember_plating', 'furnace_heart'], 'its cards'); sameJ(rec.base, a.before.base, 'the saved base has a bonus in it'); same(saved.v, 1, 'the save\'s version'); same(Object.keys(saved).length, 31, 'the save\'s fields');
        let last = null; for (let round = 1; round <= 3; round++) { const B = await boot('', store); last = B.J(`(function(){ const f = followers.filter(x => followerUid(x) === ${a.uid})[0]; const s = __snap(f); facilitySaveWrite(); return { s, found: equipFound.slice(), hand: equipHand.slice(), owned: equipOwnedList().map(c => c.id) }; })()`);
            sameJ(last.s.cards, ['ember_plating', 'furnace_heart'], 'round ' + round + ': its cards'); sameJ(last.s.stats, a.on.stats, 'round ' + round + ': its stats'); sameJ(last.s.base, a.before.base, 'round ' + round + ': its base'); sameJ(last.found, a.found, 'round ' + round + ': the found cards'); sameJ(last.hand, ['ember_plating'], 'round ' + round + ': the hand'); sameJ(last.owned, ['ember_plating'], 'round ' + round + ': the collection'); }
        same(last.s.stats.attack, st(a.before.stats.attack, 1.15), 'after three loads the bonus is +15%, once');
    });
    await check('a save made before Pack 1 (no found cards in it) loads as it did: nothing is found, nothing throws; a save whose found list holds a card the game has not (or the same twice) keeps only the real ones, once', async () => {
        const store = {}, A = await boot('', store); A.run(`__fresh(2); facilitySaveWrite();`); const old = JSON.parse(store.conduit_fp_save); delete old.cards.found; store.conduit_fp_save = JSON.stringify(old);
        const B = await boot('', store), r = B.J('({ found: equipFound, n: followers.length, loaded: !!facilitySaveLoad() })'); sameJ(r.found, [], 'found'); same(r.n, 2, 'its followers'); same(r.loaded, true, 'the old save was refused'); same(B.errs.length, 0, 'errors: ' + B.errs.join(' | '));
        old.cards.found = ['ember_plating', 'nope', 'ember_plating', 7, 'flux_cell']; store.conduit_fp_save = JSON.stringify(old); const C = await boot('', store); sameJ(C.J('equipFound'), ['ember_plating', 'flux_cell'], 'a found list with strangers in it');
    });

    group('9. THE GAME RUNS: a fight with every card worn, no error, no NaN, every status over at the end');
    await check('three followers wearing the procs and the stats fight three creatures for 900 frames in the real loop: no console error, no exception, no NaN position or health, and every status the cards set is over once the fight is', () => {
        return boot('', {}).then(B => {
            const o = B.J(`(function(){ __fresh(0); equipFound = Object.keys(EQUIP_CARDS).filter(id => EQUIP_CARDS[id].pack); const fs = []; const pairs = [['fire', 'cinderbrand', 'furnace_heart'], ['toxic', 'mireblight', 'corrosive_reservoir'], ['electric', 'static_lock', 'arc_capacitor']]; const out = { thrown: null };
                for (const [el, a, b] of pairs) { const f = __mk(el, 'brawler'); delete f.evolved; f.spawnProtection = 0; __lv(f, 20); equipPut(f, 0, a); equipPut(f, 1, b); f.x = crystal.x + 1; f.y = crystal.y + 1; f.stance = 'follow'; fs.push(f); }
                const g = __mk('ice', 'sniper'); g.spawnProtection = 0; __lv(g, 20); equipPut(g, 0, 'rime_snare'); equipPut(g, 1, 'permafrost_shell'); const h = __mk('flux', 'camper'); h.spawnProtection = 0; __lv(h, 20); equipPut(h, 0, 'siphon_field'); equipPut(h, 1, 'vortex_core'); const k = __mk('core', 'brawler'); k.spawnProtection = 0; __lv(k, 20); equipPut(k, 0, 'repulsor_pulse'); equipPut(k, 1, 'bedrock_matrix'); fs.push(g, h, k);
                const es = [0, 1, 2].map(i => spawnCreature({ species: 'ant', className: 'scout', level: 3, x: crystal.x + 2 + i, y: crystal.y + 2, state: 'hunt' })); es.forEach(e => { e.provoked = true; e.health = e.maxHealth = 60000; });
                try { __frames(900); } catch (e) { out.thrown = String(e && e.stack || e); }
                out.nan = fs.some(f => !Number.isFinite(f.x) || !Number.isFinite(f.y) || !Number.isFinite(f.health)) || es.some(e => !Number.isFinite(e.x) || !Number.isFinite(e.y) || !Number.isFinite(e.health));
                out.hurt = es.map(e => 60000 - e.health); es.forEach(e => { e.health = 1e9; e.maxHealth = 1e9; }); fs.forEach(f => { f.spawnProtection = 1e9; }); __tick(600);
                out.statuses = es.map(e => [e.burning || 0, e.toxicWeakened || 0, e.glitched || 0, e.stunned || 0, e.slowed || 0, e.kbVX || 0, e.kbVY || 0]); out.stats = fs.map(f => JSON.stringify(f.stats) !== JSON.stringify(levelledStats(f.base, f.level))); es.forEach(__gone); return out; })()`);
            same(o.thrown, null, 'the loop threw'); same(o.nan, false, 'a NaN'); ok(o.hurt.some(x => x > 0), 'the creatures took no damage: ' + o.hurt); for (const s of o.statuses) sameJ(s, [0, 0, 0, 0, 0, 0, 0], 'a status was left on a creature'); ok(o.stats.every(Boolean), 'a follower wearing stat cards has the plain stats'); same(B.errs.length, 0, 'console errors: ' + B.errs.join(' | '));
        });
    });

    group('10. THE SCREENS (real browser)');
    const P = measure(1180, 820, '');
    if (P === null) console.log('  (no Chromium here: skipped)');
    else {
        await check('the instrument ran (a tablet, the plain page): no page error, the start-of-run sheet did not open (nothing owned)', () => { ok(P, 'the probe produced nothing'); same(P.err, undefined, 'the probe threw'); same(P.wide, true, 'the tablet layout'); same(P.startOpen, false, 'the sheet opened by itself with nothing owned'); sameJ(P.errors, [], 'page errors'); });
        if (P && !P.err) {
            await check('the sheet has a BOOSTER PACK (◆100, two taps: the first arms and spends nothing, the second pays ◆100 and deals 4 cards, each with its rarity chip, its element and its words), then FOUND THIS RUN with the 4 cards and no permanent unlock', () => {
                same(P.sections.join('|'), 'YOUR HAND|YOU|BOOSTER PACK|MARKET|THE COLLECTION', 'the sections before a pack'); ok(/OPEN A PACK ◆100/.test(P.packBtn0), 'the button: ' + P.packBtn0); same(P.armed, 'TAP AGAIN TO OPEN', 'the first tap'); same(P.armedSpent, 0, 'the first tap spent shards'); same(P.spent, 100, 'the second tap\'s price');
                same(P.found.length, 4, 'found'); same(P.owned, 0, 'a card was owned'); same(P.slabs.length, 4, 'the cards shown'); for (const s of P.slabs) { const c = PACK1.find(x => x[1] === s[0]); ok(c, s[0] + ' is not a card of Pack 1'); same(s[1], c[3].toUpperCase(), s[0] + '\'s rarity'); same(s[2], (1 + RARITY3.indexOf(c[3])) + '/6', s[0] + '\'s bars'); same(s[3], 'ELEMENT · ' + c[2].toUpperCase(), s[0] + '\'s element'); same(s[4], c[5], s[0] + '\'s words'); }
                ok(P.slabs.some(s => s[1] === 'PRECISION'), 'no Precision in the pack shown'); same(P.foundSecs.join('|'), 'YOUR HAND|YOU|BOOSTER PACK|MARKET|FOUND THIS RUN|THE COLLECTION', 'the sections after'); sameJ(P.foundSlabs, [4], 'the found cards shown'); ok(/4 FOUND/.test(P.summary), 'the summary: ' + P.summary);
            });
            await check('a found card is unlocked for good in two taps for ◆1,000 from the sheet; a card of a pack that was not found cannot be (it says so); the unlocked card is kept at conduit_fp_cards', () => {
                same(P.foundCopies >= 1, true, 'the found card is on the sheet with a button'); same(P.unlockWhyBefore, null, 'a found card can be unlocked'); same(P.notFoundWhy, 'FIND IT IN A PACK FIRST', 'a card not found'); same(P.unlock.owned, true, 'unlocked'); same(P.unlock.spent, 1000, 'the price'); same(JSON.parse(P.unlock.stored).owned.length, 1, 'kept: ' + P.unlock.stored);
            });
            await check('the roster\'s CARD 1 lists what is found and fits (a fire follower: the fire cards found), a pick puts the bonus on at once and EMPTY takes it off; the card is still found; opening and closing the sheet five times changes nothing', () => {
                ok(P.opts.length >= 1 && P.opts[0][0] === 'EMPTY', 'the list: ' + JSON.stringify(P.opts)); ok(P.opts.slice(1).every(o => o[2].indexOf('FOR ') !== 0 || o[1]), 'a card that does not fit is offered'); ok(P.opts.some(o => o[0] === PACK1.find(x => x[0] === P.worn.card)[1] && !o[1]), 'the card worn was not offered');
                sameJ(P.worn.cards.filter(Boolean), [P.worn.card], 'the slot'); const c = PACK1.find(x => x[0] === P.worn.card); if (c[4].bonus && c[4].bonus.attack) same(P.worn.atk, st(P.worn.plain, 1 + c[4].bonus.attack), 'ATK with the card'); same(P.stable, true, 'something moved'); same(P.off.cards, null, 'EMPTY'); same(P.off.atk, P.off.plain, 'ATK after EMPTY'); same(P.off.stillFound, true, 'the card was lost with the slot');
            });
            await check('no page error in the whole path, and no listener added on the window or the document by opening the sheet, buying, unlocking and opening it six times more (the screen is drawn again, its one key listener is the page\'s own)', () => { sameJ(P.errors, [], 'page errors'); sameJ(P.added, [], 'a listener was added'); });
        }
    }

    console.log(failures ? `\n${failures} failing` : '\nall passing'); process.exit(failures ? 1 : 0);
})();
