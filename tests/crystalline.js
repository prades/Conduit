// THE SIX CRYSTALLINE CARDS (js/cards.js EQUIP_CARDS, equipBonus / equipMult / equipRefresh; the hooks in js/levels.js _applyFollowerLevel and js/combat.js followerRest, npc.js).
// ASKED (the "Crystalline Card Implementation" brief, 2026-10-30): six approved cards of the rarest tier, "Impact Test" (Brawler, +50% attack damage), "Stress Tested" (Brawler, +50% maximum health), "Power Surge" (Mage, +50% elemental
// attack power), "Speed Trial" (Mage, +50% attack speed), "Prototype X" (Technician, +50% attack speed), "Core Reinforcement" (Technician, +50% maximum health). The bonuses go through the existing stat paths (no new combat or stat system), two
// slots stay two, two cards may share a follower, bonuses to the SAME stat add (two +50% are +100% of the base, not +125%) and to different stats are independent; nothing is saved but the cards, and nothing corrupts a base stat.
//   THE CARDS     the approved names, classes, bonuses and rarity; the rarity names unchanged; no other field, so no other effect
//   EACH ALONE    the one stat moves by half and nothing else does; a card taken off puts it back exactly; the follower's base, level and XP are never touched
//   IN PLAY       the numbers reach the fight: the plain hit, the Mage's shot, the elements' specials; the rest between attacks (the real cooldown) shortens, in frames
//   TOGETHER      two cards on a follower; different stats are independent; the same stat adds (fixture cards: the six cannot share a stat on one follower, see the report)
//   HEALTH        a gain in maximum health is added to the current health, a loss comes off it (never to under 1): a card put on and off again does not heal
//   RULES         a class card fits its class only (a hybrid is a Brawler, an evolved form its own role), not the player, not a clone, not out of the hand, not twice; a role switched or a card put back takes it (and its bonus) off
//   SAVE          the collection and the cards a follower wears survive saving and loading, a respawn and a body restored; a bonus is never added twice
//   SCREENS       (real browser) the sheet, the roster's slots and the stats on the card in view; opening and closing the sheet again and again changes nothing
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

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
// A context with the game loaded: `search` is the address's query, `store` the browser's storage.
async function boot(search, store) {
    const sb = makeBrowserSandbox(store || {}); sb.location.search = search || '';
    sb.console = Object.assign({}, console, { error: (...a) => { if (!/the cards screen could not open/.test(String(a[0]))) console.error(...a); } });
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
        globalThis.__lv = (f, L) => { f.level = L; f.xp = xpForLevel(L); _applyFollowerLevel(f, true); return f; };   // (an egg of the level, full health)
        globalThis.__prep = (role, el, L) => { const f = __mk(el, role); delete f.evolved; f.perk = null; f.combatTrait = null; f.naturalTrait = null; return __lv(f, L || 12); };   // (no perk or trait: nothing random is in a number)
        globalThis.__snap = f => ({ stats: JSON.parse(JSON.stringify(f.stats)), power: f.power, maxHealth: f.maxHealth, health: f.health, base: JSON.parse(JSON.stringify(f.base)), level: f.level, xp: f.xp, cards: f.cards ? f.cards.slice() : null });
        globalThis.__rests = f => [45, 40, 55, 70].map(n => followerRest(f, n));
        // the plain hit, as followerAttack makes it: the damage it asks the game to deal (no will: the plain tier)
        globalThis.__hit = f => { const t = { x: f.x + 1, y: f.y, health: 1e9, maxHealth: 1e9, team: 'red', dead: false }, got = [], orig = applyElementalDamage; applyElementalDamage = (tg, amt) => { got.push(amt); };
            try { f.currentWill = 0; f.attackCooldown = 0; followerAttack(f, t); } finally { applyElementalDamage = orig; } return { got, rest: f.attackCooldown }; };
        // attacks made in a number of frames by followerAttack called every frame, as the movement code does while a target is in reach
        globalThis.__swings = (f, frames) => { const t = { x: f.x + 1, y: f.y, health: 1e9, maxHealth: 1e9, team: 'red', dead: false }; let n = 0; const orig = applyElementalDamage; applyElementalDamage = () => { n++; };
            try { f.currentWill = 0; f.attackCooldown = 0; for (let i = 0; i < frames; i++) followerAttack(f, t); } finally { applyElementalDamage = orig; } return n; };
        // a creature to shoot at, held still
        globalThis.__foe = (dx, dy) => { const e = spawnCreature({ species: 'ant', className: 'tank', level: 3, x: crystal.x + dx, y: crystal.y + dy, state: 'hunt' }); e.provoked = true; e.health = e.maxHealth = 1e9; e.moveSpeed = 0; e.baseMoveSpeed = 0; return e; };
        // the Mage's shots: the damage of each shot made in a number of frames, with the foe in its sweet spot (js/npc.js), taken from the call that makes the shot
        globalThis.__shots = (f, frames) => { const e = __foe(0, 0); f.stance = 'follow'; f.job = null; f.post = null; f.health = f.maxHealth = 1e9; f.attackCooldown = 0; f.x = crystal.x; f.y = crystal.y; const log = [], orig = spawnFollowerProjectile; spawnFollowerProjectile = (a, t, col, dmg) => { log.push(dmg); };
            try { for (let i = 0; i < frames; i++) { frame++; e.x = f.x + 3.2; e.y = f.y; e.hitStun = 1e9; updateNPC(f); } } finally { spawnFollowerProjectile = orig; e.dead = true; const k = actors.indexOf(e); if (k >= 0) actors.splice(k, 1); } return log; };`, ctx);
    return { ctx, run: s => vm.runInContext(s, ctx), J: s => JSON.parse(vm.runInContext('JSON.stringify(' + s + ')', ctx)) };
}

// ── THE REAL PAGE: the CARDS sheet and the roster, with the real cards; opening and closing again and again must change nothing ──
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, $$ = function(s){ return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var click = function(el){ if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); };
  var st = function(v, k){ return Math.max(1, Math.round(v * k * 1000) / 1000); };
  var byText = function(sel, t){ return $$(sel).filter(function(e){ return e.textContent.indexOf(t) === 0; })[0]; };
  try {
    out.dev = equipDev; out.wide = typeof hudCorners === 'function' && hudCorners(); out.startOpen = $('#cardsRoot').className.indexOf('open') >= 0;
    gameState.running = true; facilityBlackoutSet(false); if (typeof classPickerClose === 'function') classPickerClose(); classPickerOpen = false;
    shardCount = 5000; for (var i = followers.length; i < 4; i++) recruitFollower(); for (var k = 0; k < followers.length; k++) followers[k].returningToCrystal = false; partyTick(); await wait(50);
    var f = followers[0]; f.role = 'brawler'; f.element = 'fire'; delete f.evolved; f.perk = null; f.level = 6; f.xp = xpForLevel(6); _applyFollowerLevel(f, true);
    // what it would be with no card (its level and form alone), read in the same breath as the number it is compared with: the live game goes on, and a level-up between two readings moves both
    var plain = function(g){ var lv = levelledStats(g.base, g.level), m = g.evolved ? EVOLVE_MULT : 1; return { atk: Math.round(lv.attack * m), max: Math.round(Math.round(lv.hp * m) * FOLLOWER_HP_MULT) }; };
    var read = function(){ var p = plain(f); return { cards: f.cards ? f.cards.slice() : null, atk: f.stats.attack, power: f.power, max: f.maxHealth, plainAtk: p.atk, plainMax: p.max }; };
    out.before = read();
    // UNLOCK in two taps, then take it into the run
    cardsOpen(); await wait(80);
    var slab = function(n){ return $$('#cardsRoot .cd-grid .cd-card').filter(function(s){ return s.querySelector('.cd-name').textContent === n; })[0]; };
    var s1 = slab('IMPACT TEST'); out.lockedAtFirst = !!s1 && s1.className.indexOf('locked') >= 0; shardCount = 5000; click(s1.querySelector('.cd-btn')); await wait(60); var armed = slab('IMPACT TEST').querySelector('.cd-bl').textContent, s0 = shardCount; click(slab('IMPACT TEST').querySelector('.cd-btn')); await wait(80);
    out.unlock = { armed: armed, owned: equipOwns('impact_test'), spent: s0 - shardCount, stored: localStorage.getItem('conduit_fp_cards') };
    click(byText('#cardsRoot .cd-grid .cd-btn', 'TAKE INTO THE RUN')); await wait(60); out.hand = equipHand.slice(); var nb = read(); out.noBonusYet = nb.atk === nb.plainAtk && nb.max === nb.plainMax; cardsClose(); await wait(60);
    // THE ROSTER: CARD 1 offers IMPACT TEST to a Brawler and says why not for a Mage's card
    selectedUnits.clear(); ccOpen('roster'); await wait(300); _ccFocus = f; ccRender(); await wait(60);
    click(byText('#ccSide .cc-dd', 'CARD 1')); await wait(60);
    out.opts = $$('#ccSide .cc-dd-list .cc-btn').map(function(b){ return [b.querySelector('.cc-bl').textContent, b.disabled, (b.querySelector('.cc-bs') || {}).textContent || '']; });
    click(byText('#ccSide .cc-dd-list .cc-btn', 'IMPACT TEST')); await wait(80); ccRender(); await wait(60);
    var bars = function(){ var o = {}; $$('#ccFocus .cf-bar').forEach(function(r){ o[r.querySelector('.cf-k').textContent] = r.querySelector('em').textContent; }); return o; };
    out.on = Object.assign(read(), { bars: bars(), wearers: equipWearers('impact_test') });
    // the sheet opened, closed and drawn again and again: nothing moves
    var snap = function(){ var r = read(); return JSON.stringify([r.atk === st(r.plainAtk, 1.5), r.max === r.plainMax, r.power === r.atk, f.cards, equipHand, equipWearers('impact_test')]); }, s0 = snap();
    for (var n = 0; n < 6; n++) { cardsOpen(); await wait(40); cardsRender(true); cardsRender(true); cardsClose(); await wait(20); }
    for (var m = 0; m < 4; m++) { click(byText('#ccSide .cc-dd', 'CARD 2')); await wait(40); ccRender(); click(byText('#ccSide .cc-dd', 'CARD 2')); await wait(40); }
    out.stable = snap() === s0; out.nCards = $$('#cardsRoot').length;
    click(byText('#ccSide .cc-dd', 'CARD 1')); await wait(60); click(byText('#ccSide .cc-dd-list .cc-btn', 'EMPTY')); await wait(80); ccRender(); await wait(60);
    out.off = Object.assign(read(), { bars: bars() });
    ccClose();
  } catch (err) { out.err = String(err && err.stack || err); }
  var pre = document.createElement('pre'); pre.id = '__cd'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2500); });</script></body>`;
function measure(w, h, query, seed) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cx-')), file = path.join(dir, 'game.html');
    const pre = seed ? '<script>try { ' + Object.keys(seed).map(k => 'localStorage.setItem(' + JSON.stringify(k) + ', ' + JSON.stringify(seed[k]) + ');').join(' ') + ' } catch (e) {}</script>' : '';
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">' + pre).replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=60000', '--dump-dom', 'file://' + file + (query || '')], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = String(e.stdout || ''); }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__cd">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

// the brief's six: [name, class (the code's role), stat, the follower to test it on: [role, element]]
const SIX = [
    ['impact_test', 'IMPACT TEST', 'brawler', 'attack', ['brawler', 'fire']], ['stress_tested', 'STRESS TESTED', 'brawler', 'maxHealth', ['brawler', 'fire']],
    ['power_surge', 'POWER SURGE', 'sniper', 'specialAttack', ['sniper', 'ice']], ['speed_trial', 'SPEED TRIAL', 'sniper', 'attackSpeed', ['sniper', 'ice']],
    ['prototype_x', 'PROTOTYPE X', 'camper', 'attackSpeed', ['camper', 'core']], ['core_reinforcement', 'CORE REINFORCEMENT', 'camper', 'maxHealth', ['camper', 'core']],
];
const LABEL = { brawler: 'BRAWLER', sniper: 'MAGE', camper: 'TECHNICIAN' };
const st = (v, k) => Math.max(1, Math.round(v * k * 1000) / 1000);   // a stat a card moves: kept to three places, as js/levels.js makes it
const restOf = (n, k) => Math.max(1, Math.round((n + 1) / k) - 1);   // the rest after an attack of n frames at attack speed x k: the period (n + 1) over k, less the attack's own frame

(async () => {
    const G = await boot('', {}), run = G.run, J = G.J;

    group('1. THE SIX CARDS: names, classes, bonuses, rarity, and nothing else');
    await check('the six exist, in the brief\'s order, with the approved names, classes and one flat +50% each, all of the rarest tier', () => {
        const cs = J('Object.values(EQUIP_CARDS).filter(function(c){ return c.kind === "class"; })'); same(cs.length, 6, 'the class cards'); same(J('Object.values(EQUIP_CARDS).filter(function(c){ return c.rarity === "crystalline"; }).length'), 6, 'the Crystalline cards: the six, and no Pack 1 card');
        SIX.forEach(([id, name, role, stat], i) => {
            const c = cs[i]; same(c.id, id, 'card ' + (i + 1) + '\'s id'); same(c.name, name, id + '\'s name'); same(c.kind, 'class', id + ' is a class card'); same(c.match, role, id + '\'s class'); same(c.rarity, 'crystalline', id + '\'s rarity');
            sameJ(c.bonus, { [stat]: 0.5 }, id + '\'s bonus'); same(Object.keys(c).sort().join(), 'bonus,id,kind,match,name,rarity,text', id + ' has a field that is not the card shape plus its bonus (another effect?)');
        });
        same(J('Object.values(EQUIP_CARDS).filter(function(c){ return c.kind === "class"; }).map(function(c){ return equipKindLabel(c); })').join('|'), 'CLASS · BRAWLER|CLASS · BRAWLER|CLASS · MAGE|CLASS · MAGE|CLASS · TECHNICIAN|CLASS · TECHNICIAN', 'what each is for');
        same(J('Object.values(EQUIP_CARDS).filter(function(c){ return c.kind === "class"; }).map(function(c){ return c.text; })').join('|'), '+50% ATTACK DAMAGE|+50% MAXIMUM HEALTH|+50% ELEMENTAL ATTACK POWER|+50% ATTACK SPEED|+50% ATTACK SPEED|+50% MAXIMUM HEALTH', 'what each says');
        same(new Set(cs.map(c => c.id)).size, 6, 'ids are unique'); same(new Set(cs.map(c => c.name)).size, 6, 'names are unique');
    });
    await check('the six rarity names are unchanged and Crystalline is the rarest, six bars of six; the cards use no other tier', () => {
        same(J('EQUIP_RARITIES.map(function(r){ return r.label; })').join(), 'UNREFINED,REFINED,PRECISION,PROTOTYPE,LUSTROUS,CRYSTALLINE', 'the rarity names'); same(J('EQUIP_RARITIES[EQUIP_RARITIES.length - 1].id'), 'crystalline', 'the rarest');
        same(J('Object.values(EQUIP_CARDS).filter(function(c){ return c.kind === "class"; }).map(function(c){ return equipRarityBars(c); })').join(), '6,6,6,6,6,6', 'the bars lit'); same(J('Object.values(EQUIP_CARDS).filter(function(c){ return c.kind === "class"; }).map(function(c){ return equipRarityLabel(c); })').join(), 'CRYSTALLINE,CRYSTALLINE,CRYSTALLINE,CRYSTALLINE,CRYSTALLINE,CRYSTALLINE', 'the labels');
    });
    await check('every stat a bonus names is one the game has (EQUIP_STATS), and each is made where the game makes it: no new stat, no new combat system', () => {
        same(J('Object.keys(EQUIP_STATS)').join(), 'attack,specialAttack,defense,maxHealth,attackSpeed,damage', 'the stats'); const used = new Set(J('Object.values(EQUIP_CARDS).filter(function(c){ return c.kind === "class"; }).map(function(c){ return Object.keys(c.bonus)[0]; })')); sameJ([...used].sort(), ['attack', 'attackSpeed', 'maxHealth', 'specialAttack'], 'the stats the cards name');
        const lv = rd('js/levels.js'), cb = rd('js/combat.js'), np = rd('js/npc.js');
        ok(/cardK\("attack"\)/.test(lv) && /cardK\("specialAttack"\)/.test(lv) && /cardK\("maxHealth"\)/.test(lv), 'attack, SP.ATK and maximum health are not made in _applyFollowerLevel');
        same((cb.match(/followerRest\(actor, \d+\)/g) || []).join(), 'followerRest(actor, 45),followerRest(actor, 40),followerRest(actor, 70)', 'the three attacks\' rests'); ok(/followerRest\(actor, 55\)/.test(np), 'the Mage\'s shot\'s rest');
        ok(!/equip\w*\(|attackSpeed/.test(rd('js/elements.js')) && !/equip\w*\(|attackSpeed/.test(rd('js/evolution.js')), 'an element or a signature move reads a card stat');
    });

    group('2. EACH CARD ALONE: one stat moves by half, nothing else does, and taking the card off puts it back');
    for (const [id, name, role, stat, [r, el]] of SIX) {
        await check(`${name} (${LABEL[role]}, ${stat}): on a ${LABEL[role]}, exactly that stat is x1.5 and the rest of the follower is as it was; off, everything is back; base, level and XP never move`, () => {
            const o = J(`(function(){ __fresh(0); const f = __prep('${r}', '${el}'); __hand(['${id}']); const a = __snap(f), ra = __rests(f), put = equipPut(f, 0, '${id}'), b = __snap(f), rb = __rests(f), rec = JSON.parse(JSON.stringify(followerRecord(f))), off = equipPut(f, 0, null), c = __snap(f), rc = __rests(f);
                return { a, b, c, ra, rb, rc, put, off, recBase: rec.base, recCards: rec.cards }; })()`);
            same(o.put, true, 'it was refused'); same(o.off, true, 'it did not come off');
            const same_ = (x, y, skip, m) => { const X = Object.assign({}, x.stats), Y = Object.assign({}, y.stats); for (const k of skip) { delete X[k]; delete Y[k]; } sameJ(X, Y, m); };
            if (stat === 'attack') { same(o.b.stats.attack, st(o.a.stats.attack, 1.5), 'ATK'); same(o.b.power, o.b.stats.attack, 'power follows ATK'); same_(o.a, o.b, ['attack'], 'another stat moved'); same(o.b.maxHealth, o.a.maxHealth, 'maximum health moved'); ok(o.b.stats.attack > o.a.stats.attack, 'ATK did not rise'); }
            if (stat === 'maxHealth') { same(o.b.maxHealth, Math.round(o.a.stats.hp * 1.25 * 1.5), 'maximum health'); same_(o.a, o.b, [], 'a stat moved'); same(o.b.power, o.a.power, 'power moved'); ok(o.b.maxHealth > o.a.maxHealth, 'maximum health did not rise'); }
            if (stat === 'specialAttack') { same(o.b.stats.specialAttack, st(o.a.stats.specialAttack, 1.5), 'SP.ATK'); same_(o.a, o.b, ['specialAttack'], 'another stat moved'); same(o.b.maxHealth, o.a.maxHealth, 'maximum health moved'); same(o.b.power, o.a.power, 'ATK moved'); }
            if (stat === 'attackSpeed') { sameJ(o.b.stats, o.a.stats, 'a stat moved'); same(o.b.maxHealth, o.a.maxHealth, 'maximum health moved'); same(o.b.power, o.a.power, 'ATK moved'); sameJ(o.ra, [45, 40, 55, 70], 'the rests before'); sameJ(o.rb, [45, 40, 55, 70].map(n => restOf(n, 1.5)), 'the rests with the card'); sameJ(o.rb, [30, 26, 36, 46], 'the rests, in frames'); }
            else sameJ(o.rb, o.ra, 'the rests moved');
            // full health stays full; the base and the level are the follower's own and never touched
            same(o.b.health, o.b.maxHealth, 'a follower at full health is at full health'); sameJ(o.b.base, o.a.base, 'the base stats were changed'); same(o.b.level, o.a.level, 'level'); same(o.b.xp, o.a.xp, 'xp'); sameJ(o.recBase, o.a.base, 'the saved base carries the card\'s bonus'); sameJ(o.recCards, [id, null], 'the record');
            sameJ(o.c.stats, o.a.stats, 'taking it off left a stat changed'); same(o.c.power, o.a.power, 'power'); same(o.c.maxHealth, o.a.maxHealth, 'maximum health'); same(o.c.health, o.a.health, 'health'); sameJ(o.rc, o.ra, 'the rests'); same(o.c.cards, null, 'the slot'); sameJ(o.c.base, o.a.base, 'base');
        });
    }

    group('3. THE NUMBERS REACH THE FIGHT (the real attack code, with what it asks the game to deal recorded)');
    await check('Impact Test: a Brawler\'s plain hit is made from ATK (x0.25), so it hits for half as much again', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('brawler', 'fire'); __hand(['impact_test']); const a = __hit(f), atk0 = f.stats.attack; equipPut(f, 0, 'impact_test'); const b = __hit(f), atk1 = f.stats.attack; equipPut(f, 0, null); const c = __hit(f); return { a, b, c, atk0, atk1 }; })()`);
        sameJ(o.a.got, [o.atk0 * 0.25], 'the plain hit before'); sameJ(o.b.got, [o.atk1 * 0.25], 'the plain hit with the card'); same(o.atk1, st(o.atk0, 1.5), 'ATK'); ok(Math.abs(o.b.got[0] / o.a.got[0] - 1.5) < 0.05, 'the hit is not half as much again: ' + o.a.got + ' to ' + o.b.got); sameJ(o.c.got, o.a.got, 'taken off, the hit as before');
    });
    await check('end to end: with Impact Test a Brawler takes half as much again off a real creature (the real damage code, the element wheel and its defense included); taken off, as before', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('brawler', 'fire'); __hand(['impact_test']); const e = __foe(1, 0); const hits = n => { e.health = e.maxHealth = 1e9; for (let i = 0; i < n; i++) { f.currentWill = 0; f.attackCooldown = 0; followerAttack(f, e); } return 1e9 - e.health; };
            const a = hits(30); equipPut(f, 0, 'impact_test'); const b = hits(30); equipPut(f, 0, null); const c = hits(30); e.dead = true; return { a, b, c }; })()`);
        ok(o.a > 0, 'the creature took nothing'); ok(Math.abs(o.b / o.a - 1.5) < 0.05, 'not half as much again: ' + o.a + ' to ' + o.b); same(o.c, o.a, 'taken off, a different damage');
    });
    await check('Impact Test reaches the elemental physical hits too (the core shield bash is made from ATK x0.45), and a signature move\'s damage (it reads power, which is ATK)', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('brawler', 'core'); __hand(['impact_test']); const e = __foe(1, 0); const run = () => { const got = [], orig = applyElementalDamage; applyElementalDamage = (t, a) => { got.push(a); }; try { ELEMENT_ATTACKS.core.physical(f, e); } finally { applyElementalDamage = orig; } return got[0]; };
            const a = run(), atk0 = f.stats.attack; equipPut(f, 0, 'impact_test'); const b = run(); e.dead = true; return { a, b, atk0, atk: f.stats.attack, power: f.power }; })()`);
        same(o.a, o.atk0 * 0.45, 'the bash before'); same(o.b, o.atk * 0.45, 'the bash with the card'); ok(Math.abs(o.b / o.a - 1.5) < 0.05, 'the bash is not half as much again: ' + o.a + ' to ' + o.b); same(o.power, o.atk, 'power is ATK, which the signature moves read (js/evolution.js)');
    });
    await check('Power Surge: a Mage\'s ranged shot (SP.ATK x0.5) and an element\'s special (SP.ATK x0.6 for ice) are half as much again; its plain ATK is untouched', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('sniper', 'ice'); __hand(['power_surge']); const sp0 = f.stats.specialAttack, atk0 = f.stats.attack, shot0 = __shots(f, 1)[0]; equipPut(f, 0, 'power_surge'); const sp1 = f.stats.specialAttack, shot1 = __shots(f, 1)[0], atk1 = f.stats.attack;
            const e = __foe(1.2, 0), spec = () => { const got = [], orig = applyElementalDamage; applyElementalDamage = (t, a) => { got.push(a); }; try { ELEMENT_ATTACKS.ice.special(f, e); } finally { applyElementalDamage = orig; } return got[0]; };
            const special1 = spec(); equipPut(f, 0, null); const special0 = spec(); e.dead = true; return { sp0, sp1, atk0, atk1, shot0, shot1, special0, special1 }; })()`);
        same(o.shot0, o.sp0 * 0.5, 'the shot before'); same(o.shot1, o.sp1 * 0.5, 'the shot with the card'); same(o.sp1, st(o.sp0, 1.5), 'SP.ATK'); ok(Math.abs(o.shot1 / o.shot0 - 1.5) < 0.05, 'the shot is not half as much again');
        same(o.special0, o.sp0 * 0.6, 'the ice burst before'); same(o.special1, o.sp1 * 0.6, 'the ice burst with the card'); ok(Math.abs(o.special1 / o.special0 - 1.5) < 0.05, 'the ice burst is not half as much again'); same(o.atk1, o.atk0, 'ATK moved');
    });
    await check('Speed Trial: the Mage\'s shots come half as often again (the rest after a shot, 55 frames, is 36); with the card off, as before', () => {
        const N = 2300, o = J(`(function(){ __fresh(0); const f = __prep('sniper', 'ice'); __hand(['speed_trial']); __shots(f, 1); const r0 = f.attackCooldown, a = __shots(f, ${N}); equipPut(f, 0, 'speed_trial'); __shots(f, 1); const r1 = f.attackCooldown, b = __shots(f, ${N}); equipPut(f, 0, null); const c = __shots(f, ${N}); return { a: a.length, b: b.length, c: c.length, r0, r1 }; })()`);
        const per = rest => Math.floor((N - 1) / (rest + 1)) + 1;   // a shot, then the rest counted down, then the next shot
        same(o.r0, 55, 'the rest as it was'); same(o.r1, 36, 'the rest with the card'); same(o.a, per(55), 'shots before'); same(o.b, per(36), 'shots with the card'); same(o.c, o.a, 'shots after taking it off'); ok(Math.abs(o.b / o.a - 1.5) < 0.04, 'not half as often again: ' + o.a + ' to ' + o.b);
    });
    await check('Prototype X: a Technician\'s attacks come half as often again (the plain hit\'s rest, 45 frames, is 30), and the other two attacks\' rests (40, 70) shorten the same way', () => {
        const N = 2300, o = J(`(function(){ __fresh(0); const f = __prep('camper', 'core'); __hand(['prototype_x']); const a = __swings(f, ${N}), r0 = __hit(f).rest; equipPut(f, 0, 'prototype_x'); const b = __swings(f, ${N}), r1 = __hit(f).rest, rs = __rests(f); equipPut(f, 0, null); const c = __swings(f, ${N}); return { a, b, c, r0, r1, rs }; })()`);
        const per = rest => Math.floor((N - 1) / (rest + 1)) + 1;
        same(o.r0, 45, 'the rest as it was'); same(o.r1, 30, 'the rest with the card'); same(o.a, per(45), 'attacks before'); same(o.b, per(30), 'attacks with the card'); same(o.c, o.a, 'attacks after taking it off'); ok(Math.abs(o.b / o.a - 1.5) < 0.04, 'not half as often again: ' + o.a + ' to ' + o.b); sameJ(o.rs, [30, 26, 36, 46], 'all the rests');
    });
    await check('Speed Trial and Prototype X do not touch what is not an attack: the signature moves\' timers (_sigCd) and the technicians\' abilities keep their own', () => {
        const ev = rd('js/evolution.js'), ta = rd('js/techabilities.js'); ok(!/followerRest|equipMult|attackSpeed/.test(ev), 'a signature move\'s timer reads attack speed'); ok(!/followerRest|equipMult|attackSpeed/.test(ta), 'a technician\'s ability reads attack speed');
    });
    await check('Stress Tested and Core Reinforcement: the follower\'s health bar is half as long again, and a hit takes the same from it (so it lasts half as many hits again)', () => {
        const o = J(`(function(){ __fresh(0); const out = []; for (const [id, role, el] of [['stress_tested', 'brawler', 'fire'], ['core_reinforcement', 'camper', 'core']]) { const f = __prep(role, el); __hand([id]); const foe = { x: f.x + 1, y: f.y, team: 'red' }; f.spawnProtection = 0; const hits = () => { let n = 0; f.health = f.maxHealth; while (f.health > 0 && n < 500) { applyDamage(f, 7, foe); n++; } return n; };
            const h0 = hits(); f.dead = false; f.health = f.maxHealth; equipPut(f, 0, id); const h1 = hits(); out.push({ id, h0, h1 }); } return out; })()`);
        for (const x of o) ok(x.h0 > 3 && Math.abs(x.h1 / x.h0 - 1.5) < 0.2, x.id + ': ' + x.h0 + ' hits to fall, then ' + x.h1);
    });

    group('4. TWO CARDS ON ONE FOLLOWER: different stats are independent; the same stat adds');
    run(`[['atk', 'attack'], ['hp', 'maxHealth'], ['sp', 'specialAttack'], ['spd', 'attackSpeed']].forEach(function(p){ ['a', 'b'].forEach(function(s){ ['brawler', 'sniper', 'camper'].forEach(function(role){ var id = 'fx_' + p[0] + '_' + s + '_' + role; EQUIP_CARDS[id] = { id: id, name: 'FIXTURE', kind: 'class', match: role, rarity: 'crystalline', text: '', bonus: (function(){ var b = {}; b[p[1]] = 0.5; return b; })() }; }); }); });
         EQUIP_CARDS.fx_atk_quarter = { id: 'fx_atk_quarter', name: 'FIXTURE', kind: 'class', match: 'brawler', rarity: 'crystalline', text: '', bonus: { attack: 0.25 } };`);
    await check('Impact Test + Stress Tested on a Brawler: ATK x1.5 and maximum health x1.5, each as if the other were not there (and both slots are full)', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('brawler', 'fire'); __hand(['impact_test', 'stress_tested']); const a = __snap(f); const p1 = equipPut(f, 0, 'impact_test'), p2 = equipPut(f, 1, 'stress_tested'), b = __snap(f); equipPut(f, 0, null); const c = __snap(f); return { a, b, c, p1, p2 }; })()`);
        same(o.p1 && o.p2, true, 'two Crystalline cards on one follower'); same(o.b.stats.attack, st(o.a.stats.attack, 1.5), 'ATK'); same(o.b.maxHealth, Math.round(o.a.stats.hp * 1.25 * 1.5), 'maximum health'); same(o.b.stats.specialAttack, o.a.stats.specialAttack, 'SP.ATK moved'); same(o.c.stats.attack, o.a.stats.attack, 'ATK with Impact Test off'); same(o.c.maxHealth, o.b.maxHealth, 'maximum health with Impact Test off');
    });
    await check('Power Surge + Speed Trial on a Mage, and Prototype X + Core Reinforcement on a Technician: each pair works at once', () => {
        const o = J(`(function(){ __fresh(0); const m = __prep('sniper', 'ice'), t = __prep('camper', 'core'); __hand(['power_surge', 'speed_trial', 'prototype_x', 'core_reinforcement']); const ma = __snap(m), ta = __snap(t); equipPut(m, 0, 'power_surge'); equipPut(m, 1, 'speed_trial'); equipPut(t, 0, 'prototype_x'); equipPut(t, 1, 'core_reinforcement');
            return { ma, mb: __snap(m), mr: __rests(m), ta, tb: __snap(t), tr: __rests(t), shot: __shots(m, 1)[0], swings: __swings(t, 2300) }; })()`);
        same(o.mb.stats.specialAttack, st(o.ma.stats.specialAttack, 1.5), 'the Mage\'s SP.ATK'); sameJ(o.mr, [30, 26, 36, 46], 'the Mage\'s rests'); same(o.mb.maxHealth, o.ma.maxHealth, 'the Mage\'s health moved'); same(o.shot, o.mb.stats.specialAttack * 0.5, 'the shot');
        same(o.tb.maxHealth, Math.round(o.ta.stats.hp * 1.25 * 1.5), 'the Technician\'s maximum health'); sameJ(o.tr, [30, 26, 36, 46], 'the Technician\'s rests'); same(o.tb.stats.attack, o.ta.stats.attack, 'the Technician\'s ATK moved'); same(o.swings, Math.floor(2299 / 31) + 1, 'its attacks in 2300 frames');
    });
    await check('the same stat ADDS: two +50% attack damage are +100% of the base (x2), not +125% (x2.25); two attack speeds, two maximum healths, two SP.ATK the same (fixture cards: the six have no pair that can share a follower)', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('brawler', 'fire', 40); __hand(['fx_atk_a_brawler', 'fx_atk_b_brawler', 'fx_hp_a_brawler', 'fx_hp_b_brawler', 'fx_spd_a_brawler', 'fx_spd_b_brawler', 'fx_sp_a_brawler', 'fx_sp_b_brawler', 'fx_atk_quarter']); const a = __snap(f), out = { a };
            const two = (x, y) => { equipPut(f, 0, x); equipPut(f, 1, y); const s = __snap(f), r = __rests(f); equipPut(f, 0, null); equipPut(f, 1, null); return { s, r }; };
            out.atk = two('fx_atk_a_brawler', 'fx_atk_b_brawler'); out.hp = two('fx_hp_a_brawler', 'fx_hp_b_brawler'); out.spd = two('fx_spd_a_brawler', 'fx_spd_b_brawler'); out.sp = two('fx_sp_a_brawler', 'fx_sp_b_brawler'); out.mix = two('fx_atk_a_brawler', 'fx_atk_quarter'); out.cross = two('fx_atk_a_brawler', 'fx_hp_a_brawler'); out.end = __snap(f); return out; })()`);
        const a = o.a; same(o.atk.s.stats.attack, st(a.stats.attack, 2), 'ATK with two +50%'); ok(Math.abs(o.atk.s.stats.attack - a.stats.attack * 2.25) > 1, 'ATK is +125%'); same(o.atk.s.power, o.atk.s.stats.attack, 'power');
        same(o.hp.s.maxHealth, Math.round(a.stats.hp * 1.25 * 2), 'maximum health with two +50%'); sameJ(o.spd.r, [22, 20, 27, 35], 'the rests with two +50% (attack speed x2)'); sameJ(o.spd.r, [45, 40, 55, 70].map(n => restOf(n, 2)), 'x2, from the formula'); ok(o.spd.r[0] !== restOf(45, 2.25), 'the rests are for +125%');
        same(o.sp.s.stats.specialAttack, st(a.stats.specialAttack, 2), 'SP.ATK with two +50%'); same(o.mix.s.stats.attack, st(a.stats.attack, 1.75), 'ATK with +50% and +25%');
        same(o.cross.s.stats.attack, st(a.stats.attack, 1.5), 'ATK beside a maximum-health card'); same(o.cross.s.maxHealth, Math.round(a.stats.hp * 1.25 * 1.5), 'maximum health beside an ATK card');
        sameJ(o.end.stats, a.stats, 'the stats after all of it'); same(o.end.maxHealth, a.maxHealth, 'maximum health after all of it'); same(o.end.power, a.power, 'power after all of it'); sameJ(o.end.base, a.base, 'base after all of it');
    });
    await check('one card is never worn twice on a follower (so two real cards of the same stat cannot be stacked on one: they are on different classes)', () => {
        const o = J(`(function(){ __fresh(0); const t = __prep('camper', 'core'), m = __prep('sniper', 'ice'); __hand(['prototype_x', 'speed_trial', 'impact_test']); const a = equipPut(t, 0, 'prototype_x'), twice = equipPut(t, 1, 'prototype_x'), why = equipWhyNot(t, 'prototype_x', 1), other = equipWhyNot(t, 'speed_trial', 1), s = equipSlots(t).join('|'), k = equipBonus(t, 'attackSpeed');
            t.cards = ['prototype_x', 'prototype_x']; const forced = equipBonus(t, 'attackSpeed'); return { a, twice, why, other, s, k, forced }; })()`);
        same(o.a, true, 'the first'); same(o.twice, false, 'the same card went on both slots'); same(o.why, 'ALREADY ON ITS OTHER SLOT', 'its reason'); same(o.other, 'FOR MAGES', 'a Mage\'s attack-speed card on a Technician'); same(o.s, 'prototype_x|', 'the slots'); same(o.k, 0.5, 'one card\'s bonus'); same(o.forced, 0.5, 'even if a record held it twice it counts once');
    });

    group('5. LEAVING AND CHANGING: the bonus goes with the card, is made from the base each time, and the health follows the rule');
    await check('putting a card on and taking it off, again and again, and every kind of recalculation, never adds it twice or leaves any of it behind', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('brawler', 'fire'); __hand(['impact_test', 'stress_tested']); const a = __snap(f); equipPut(f, 0, 'impact_test'); equipPut(f, 1, 'stress_tested'); const b = __snap(f);
            for (let i = 0; i < 25; i++) { equipRefresh(f); _applyFollowerLevel(f, false); equipTick(true); equipPut(f, 0, 'impact_test'); equipPut(f, 1, 'stress_tested'); } const c = __snap(f);
            for (let i = 0; i < 12; i++) { equipPut(f, 0, null); equipPut(f, 1, null); equipPut(f, 0, 'impact_test'); equipPut(f, 1, 'stress_tested'); } const d = __snap(f); equipPut(f, 0, null); equipPut(f, 1, null); return { a, b, c, d, e: __snap(f), cards: f.cards === undefined }; })()`);
        sameJ(o.c.stats, o.b.stats, 'the stats drifted'); same(o.c.maxHealth, o.b.maxHealth, 'maximum health drifted'); same(o.c.power, o.b.power, 'power drifted'); sameJ(o.d.stats, o.b.stats, 'cycles drifted'); same(o.d.health, o.b.health, 'health drifted');
        sameJ(o.e.stats, o.a.stats, 'something stayed after both came off'); same(o.e.maxHealth, o.a.maxHealth, 'maximum health after'); same(o.e.power, o.a.power, 'power after'); same(o.e.health, o.a.health, 'health after'); same(o.cards, true, 'the field was left');
    });
    await check('HEALTH: a gain in maximum health is added to the current health, a loss comes off it (never to under 1), so a card put on and off again does not heal; a follower at full health stays at full health', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('brawler', 'fire'); __hand(['stress_tested']); const full = f.maxHealth; f.health = Math.round(full / 2); const h0 = f.health;
            equipPut(f, 0, 'stress_tested'); const gain = f.maxHealth - full, on = f.health; equipPut(f, 0, null); const off = f.health, offMax = f.maxHealth;
            for (let i = 0; i < 8; i++) { equipPut(f, 0, 'stress_tested'); equipPut(f, 0, null); } const cyc = f.health;
            f.health = 1; equipPut(f, 0, 'stress_tested'); const lowOn = f.health; f.health = 3; equipPut(f, 0, null); const lowOff = f.health;
            f.health = f.maxHealth; equipPut(f, 0, 'stress_tested'); const fullOn = [f.health, f.maxHealth]; equipPut(f, 0, null); const fullOff = [f.health, f.maxHealth];
            return { full, h0, gain, on, off, offMax, cyc, lowOn, lowOff, fullOn, fullOff }; })()`);
        same(o.on, o.h0 + o.gain, 'put on: the gain is added'); same(o.off, o.h0, 'taken off: the same comes off'); same(o.offMax, o.full, 'maximum health after'); same(o.cyc, o.h0, 'eight swaps healed (or hurt)'); same(o.lowOn, 1 + o.gain, 'at 1 health, put on'); same(o.lowOff, 1, 'at 3 health, taken off: never under 1');
        same(o.fullOn[0], o.fullOn[1], 'full stays full when put on'); same(o.fullOff[0], o.fullOff[1], 'full stays full when taken off'); same(o.fullOff[1], o.full, 'back to the maximum it had');
    });
    await check('a level-up while wearing a card makes the new level\'s numbers x1.5, not the old bonus on top; so does evolving (the form\'s own multiplier first, then the card)', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('brawler', 'fire', 6); __hand(['impact_test', 'stress_tested']); equipPut(f, 0, 'impact_test'); equipPut(f, 1, 'stress_tested'); const before = __snap(f); gainXp(f, xpForLevel(7) - f.xp + 1); const lv = levelledStats(f.base, f.level), after = __snap(f);
            const evolvedAtk = Math.round(lv.attack * EVOLVE_MULT), evolvedHp = Math.round(lv.hp * EVOLVE_MULT); __form(f, 'quillstone'); _applyFollowerLevel(f, false); const evo = __snap(f); return { before, after, lv, level: f.level, evolvedAtk, evolvedHp, evo }; })()`);
        same(o.level, 7, 'it levelled'); same(o.after.stats.attack, st(o.lv.attack, 1.5), 'ATK at the new level'); same(o.after.maxHealth, Math.round(o.lv.hp * 1.25 * 1.5), 'maximum health at the new level'); ok(o.after.stats.attack > o.before.stats.attack && o.after.maxHealth > o.before.maxHealth, 'it did not grow');
        same(o.evo.stats.attack, st(o.evolvedAtk, 1.5), 'ATK evolved'); same(o.evo.maxHealth, Math.round(o.evolvedHp * 1.25 * 1.5), 'maximum health evolved'); sameJ(o.evo.cards, ['impact_test', 'stress_tested'], 'evolving kept the cards (a Quillstone is a Brawler)');
    });
    await check('a role switched with ATTACK STYLE takes a class card off (and its bonus with it) at the next tick; a card put back out of the hand does the same at once', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('brawler', 'fire'); __hand(['impact_test', 'stress_tested']); const a = __snap(f); equipPut(f, 0, 'impact_test'); equipPut(f, 1, 'stress_tested'); const on = __snap(f);
            equipHandRemove('stress_tested'); const handOff = __snap(f), inHand = equipInHand('stress_tested'); f.role = 'sniper'; const stillThere = equipSlots(f).join('|'), stillAtk = f.stats.attack; equipTick(true); const sw = __snap(f);
            return { a, on, handOff, inHand, stillThere, stillAtk, sw, slots: f.cards === undefined }; })()`);
        same(o.handOff.maxHealth, o.a.maxHealth, 'the card put back did not take its bonus off at once'); same(o.handOff.stats.attack, o.on.stats.attack, 'the other card lost its bonus'); same(o.inHand, false, 'in the hand');
        same(o.stillThere, 'impact_test|', 'before the tick'); same(o.stillAtk, o.on.stats.attack, 'before the tick the bonus is still on (the card is still worn)'); sameJ(o.sw.stats, o.a.stats, 'the stats after the switch'); same(o.sw.power, o.a.power, 'power after the switch'); same(o.slots, true, 'the slots');
    });

    group('6. THE RULES: who can wear what');
    await check('a class card fits its class only: each of the six on each class says yes or "FOR <CLASS>S"; a hybrid fights as a Brawler; an evolved form has its form\'s class', () => {
        const o = J(`(function(){ __fresh(0); const ids = ${JSON.stringify(SIX.map(x => x[0]))}; __hand(ids); const out = {}; for (const role of ['brawler', 'sniper', 'camper', 'hybrid']) { const f = __prep(role === 'hybrid' ? 'brawler' : role, 'fire'); f.role = role; out[role] = ids.map(id => equipWhyNot(f, id, 0)); } return out; })()`);
        const ids = SIX.map(x => x[0]);
        for (const role of ['brawler', 'sniper', 'camper', 'hybrid']) { const as = role === 'hybrid' ? 'brawler' : role; ids.forEach((id, i) => { const mine = SIX[i][2] === as; same(o[role][i], mine ? null : 'FOR ' + LABEL[SIX[i][2]] + 'S', `${id} on a ${role}`); }); }
        const forms = J(`Object.values(EVOLUTIONS).filter(function(e){ return !e.legacy; }).map(function(e){ return { id: e.id, role: e.role }; })`); same(forms.length, 18, 'forms in play');
        const six = ids, fits = J(`(function(){ __fresh(0); const six = ${JSON.stringify(ids)}; __hand(six); const out = {}; for (const e of Object.values(EVOLUTIONS)) { if (e.legacy) continue; const f = __form(__mk(e.element, e.role), e.id); out[e.id] = six.filter(id => equipWhyNot(f, id, 0) === null); } return out; })()`);
        for (const e of forms) sameJ(fits[e.id], SIX.filter(x => x[2] === e.role).map(x => x[0]), e.id + ' (' + e.role + ') can wear');
    });
    await check('not the player (Universal cards only), not a clone, not a card out of the hand, not a third slot, not the same card twice; the stats do not move when it is refused', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('brawler', 'fire'); __hand(['impact_test']); equipPlayer = [null, null]; const a = __snap(f); const out = {};
            out.player = [equipPlayerPut(0, 'impact_test'), equipPlayerWhyNot('impact_test', 0), equipPlayer.join()]; out.clone = equipPut({ isClone: true, role: 'brawler' }, 0, 'impact_test'); out.third = equipPut(f, 2, 'impact_test'); out.out = equipPut(f, 0, 'stress_tested'); out.outWhy = equipWhyNot(f, 'stress_tested', 0);
            out.dead = (function(){ const g = __prep('brawler', 'fire'); g.dead = true; const r = equipPut(g, 0, 'impact_test'); g.dead = false; return r; })(); out.wrong = equipPut(__prep('sniper', 'ice'), 0, 'impact_test'); out.same = JSON.stringify(__snap(f)) === JSON.stringify(a); return out; })()`);
        sameJ(o.player, [false, 'UNIVERSAL CARDS ONLY', ','], 'the player'); same(o.clone, false, 'a clone'); same(o.third, false, 'a third slot'); same(o.out, false, 'out of the hand'); same(o.outWhy, 'NOT IN YOUR HAND', 'its reason'); same(o.dead, false, 'a follower that is gone'); same(o.wrong, false, 'the wrong class'); same(o.same, true, 'a refused card moved something');
    });
    await check('a Crystalline card is a type you own, never used up: any number of followers wear it at once, each with its own bonus', () => {
        const o = J(`(function(){ const fs = __fresh(0); const a = __prep('brawler', 'fire'), b = __prep('brawler', 'ice'), c = __prep('brawler', 'core'); __hand(['impact_test']); const base = [a, b, c].map(f => f.stats.attack); [a, b, c].forEach(f => equipPut(f, 0, 'impact_test')); return { base, now: [a, b, c].map(f => f.stats.attack), wearers: equipWearers('impact_test'), inHand: equipInHand('impact_test') }; })()`);
        same(o.wearers, 3, 'wearers'); same(o.inHand, true, 'still in the hand'); o.base.forEach((x, i) => same(o.now[i], st(x, 1.5), 'follower ' + i + '\'s ATK'));
    });

    group('7. THE SAVE: the collection and the cards survive saving, loading, a respawn and a restored body, and a bonus is never added twice');
    await check('the collection is kept at conduit_fp_cards (ids only), survives a new boot and NEW GAME, and holds no bonus', async () => {
        const store = {}, A = await boot('', store);
        A.run(`shardCount = 7000; ['impact_test', 'power_surge', 'core_reinforcement'].forEach(id => equipUnlock(id));`); const kept = JSON.parse(store.conduit_fp_cards); same(kept.v, 1, 'its version'); same(kept.owned.join(), 'impact_test,power_surge,core_reinforcement', 'what is kept'); same(A.J('shardCount'), 4000, 'three at the flat price'); ok(!/bonus|0\.5/.test(store.conduit_fp_cards), 'the collection holds a bonus');
        A.run('facilitySaveWrite()'); A.run('facilitySaveClear()'); const B = await boot('', store); same(B.J('equipOwnedList().map(function(c){ return c.id; })').join(), 'impact_test,power_surge,core_reinforcement', 'the collection after NEW GAME and a new boot'); same(B.J('equipHand.length'), 0, 'the hand carried over');
    });
    await check('a follower wearing two cards is saved with the cards and its BASE (not the bonus), and loads with the bonus exactly once; saving and loading again changes nothing', async () => {
        const store = {}, A = await boot('', store);
        const a = A.J(`(function(){ shardCount = 9000; ['impact_test', 'stress_tested'].forEach(id => { equipUnlock(id); equipHandAdd(id); }); const fs = __fresh(2); const f = fs[0]; f.role = 'brawler'; f.element = 'fire'; delete f.evolved; __lv(f, 15); const before = __snap(f); equipPut(f, 0, 'impact_test'); equipPut(f, 1, 'stress_tested'); facilitySaveWrite(); return { uid: followerUid(f), before, on: __snap(f) }; })()`);
        const saved = JSON.parse(store.conduit_fp_save), rec = saved.followers.find(e => e.uid === a.uid); ok(rec, 'the follower is not in the save'); sameJ(rec.cards, ['impact_test', 'stress_tested'], 'its cards in the save'); sameJ(rec.base, a.before.base, 'the saved base has the bonus in it'); sameJ(saved.cards.hand, ['impact_test', 'stress_tested'], 'the hand in the save');
        same(rec.stats.attack, a.on.stats.attack, 'the saved stats are the follower\'s as it stands (they are made again from the base on load)');
        let prev = store.conduit_fp_save, last = null;
        for (let round = 1; round <= 3; round++) {
            const B = await boot('', store); last = B.J(`(function(){ const f = followers.filter(x => followerUid(x) === ${a.uid})[0]; const s = __snap(f); facilitySaveWrite(); return { s, hand: equipHand.slice(), owned: equipOwnedList().length }; })()`);
            sameJ(last.s.cards, ['impact_test', 'stress_tested'], 'round ' + round + ': its cards'); sameJ(last.s.stats, a.on.stats, 'round ' + round + ': its stats'); same(last.s.maxHealth, a.on.maxHealth, 'round ' + round + ': maximum health'); same(last.s.power, a.on.power, 'round ' + round + ': power'); sameJ(last.s.base, a.before.base, 'round ' + round + ': its base');
            sameJ(last.hand, ['impact_test', 'stress_tested'], 'round ' + round + ': the hand'); same(last.owned, 2, 'round ' + round + ': the collection');
        }
        same(last.s.stats.attack, st(a.before.stats.attack, 1.5), 'after three loads the bonus is still half, once'); const rec2 = JSON.parse(store.conduit_fp_save).followers.find(e => e.uid === a.uid); sameJ(rec2.base, a.before.base, 'after three loads the saved base');
    });
    await check('a save whose hand lacks a card (or whose collection lost it) loses the card quietly, and the bonus with it', async () => {
        const store = {}, A = await boot('', store);
        A.run(`shardCount = 9000; equipUnlock('impact_test'); equipHandAdd('impact_test'); const f = __fresh(1)[0]; f.role = 'brawler'; f.element = 'fire'; delete f.evolved; __lv(f, 15); equipPut(f, 0, 'impact_test'); facilitySaveWrite();`);
        const saved = JSON.parse(store.conduit_fp_save); saved.cards.hand = []; store.conduit_fp_save = JSON.stringify(saved);
        const B = await boot('', store), r = B.J(`(function(){ const f = followers[0]; const during = f.stats.attack; equipTick(true); const after = f.stats.attack; const base = levelledStats(f.base, f.level).attack; return { during, after, base, cards: f.cards === undefined }; })()`);
        same(r.cards, true, 'the card stayed'); same(r.after, r.base, 'the bonus stayed after the card went'); ok(r.during >= r.after, 'it never went down');
    });
    await check('a fall and a respawn at the Crystal keep the cards and the bonus (once); falling for good, EXILE and a RE-ROLL empty the slots, and a body restored later has none of the bonus (its saved stats are made again from its base)', () => {
        const o = J(`(function(){ const out = {}; const mk = () => { const f = __prep('brawler', 'fire', 6); __hand(['impact_test', 'stress_tested']); equipPut(f, 0, 'impact_test'); equipPut(f, 1, 'stress_tested'); return f; };
            const fall = (f, forGood) => { f.spawnProtection = 0; if (forGood) f.base.hp = 1; const foe = { x: f.x + 1, y: f.y, team: 'red' }; for (let i = 0; i < 40 && !f.dead; i++) applyDamage(f, f.maxHealth, foe); render(); render(); };
            __fresh(0); let f = mk(); const uid = followerUid(f), on = __snap(f); fall(f, false); __frames(260); equipTick(true); const back = followers.filter(x => followerUid(x) === uid)[0], bs = back ? __snap(back) : null, lv = back ? levelledStats(back.base, back.level) : null, em = back && back.evolved ? EVOLVE_MULT : 1;
            out.respawn = { back: !!back, cards: bs && bs.cards, atk: bs && bs.stats.attack, expectAtk: lv && Math.max(1, Math.round(Math.round(lv.attack * em) * 1.5 * 1000) / 1000), max: bs && bs.maxHealth, expectMax: lv && Math.round(Math.round(lv.hp * em) * 1.25 * 1.5), onAtk: on.stats.attack, health: bs && [bs.health, bs.maxHealth], evolved: back && back.evolved || null };
            __fresh(0); f = mk(); fall(f, true); const body = cloneBodies.filter(b => b.kind === 'follower')[0]; out.body = { there: !!body, recCards: body ? body.rec.cards : 'none', recAtk: body ? body.rec.stats.attack : null, worn: equipWorn(f) };
            if (body) { const rest = spawnFollowerFromSave(body.rec), rl = levelledStats(rest.base, rest.level), rm = rest.evolved ? EVOLVE_MULT : 1; out.restored = { cards: rest.cards === undefined, atk: rest.stats.attack, expect: Math.round(rl.attack * rm), max: rest.maxHealth, expectMax: Math.round(Math.round(rl.hp * rm) * 1.25) }; }
            __fresh(0); f = mk(); partyExile(f, true); out.exile = { worn: equipWorn(f), field: f.cards === undefined };
            __fresh(0); f = mk(); startFollowerReroll(f, true); out.reroll = { worn: equipWorn(f), field: f.cards === undefined, bonus: equipBonus(f, 'attack') + equipBonus(f, 'maxHealth') }; return out; })()`);
        same(o.respawn.back, true, 'it did not come back'); sameJ(o.respawn.cards, ['impact_test', 'stress_tested'], 'its cards on the way back'); same(o.respawn.atk, o.respawn.expectAtk, 'ATK after the respawn is half again of its base, once'); same(o.respawn.max, o.respawn.expectMax, 'maximum health after the respawn'); same(o.respawn.health[0], o.respawn.health[1], 'it came back at full health');
        same(o.body.there, true, 'no body'); ok(o.restored, 'the body could not be restored'); same(o.body.recCards, undefined, 'the body kept the cards'); same(o.body.worn, 0, 'the fallen still wears them'); ok(o.body.recAtk > o.restored.expect, 'the body\'s saved stats were not the boosted ones, so this checks nothing: ' + o.body.recAtk + ' to ' + o.restored.expect);
        same(o.restored.cards, true, 'the restored body wears cards'); same(o.restored.atk, o.restored.expect, 'the restored body has the bonus (its saved stats were used as they were)'); same(o.restored.max, o.restored.expectMax, 'the restored body\'s maximum health');
        same(o.exile.worn, 0, 'exile'); same(o.exile.field, true, 'exile left a field'); same(o.reroll.worn, 0, 're-roll'); same(o.reroll.field, true, 're-roll left a field'); same(o.reroll.bonus, 0, 're-roll left a bonus');
    });

    group('8. NOTHING ELSE MOVED');
    await check('a follower with no card has the numbers it had: its stats and maximum health are the level\'s and the form\'s alone, every rest is the attack\'s own, every multiplier is 1; the nine inert test cards change nothing', async () => {
        const T = await boot('?cards', {});
        const o = T.J(`(function(){ __fresh(0); const f = __prep('brawler', 'fire', 20); const lv = levelledStats(f.base, f.level); const nobody = { stats: ['attack', 'maxHealth', 'specialAttack', 'attackSpeed'].map(s => [equipBonus(f, s), equipMult(f, s), equipBonus(null, s), equipMult(undefined, s)]), rests: __rests(f), baseline: JSON.stringify([f.stats, f.maxHealth, f.power]) };
            const expect = JSON.stringify([lv, Math.round(lv.hp * FOLLOWER_HP_MULT), lv.attack]); __hand(Object.keys(EQUIP_TEST_CARDS)); const w = Object.keys(EQUIP_TEST_CARDS).map(id => equipPut(f, 0, id) ? id : null).filter(Boolean); const worn = JSON.stringify([f.stats, f.maxHealth, f.power]);
            return { nobody, expect, worn, w, restsOnTest: __rests(f) }; })()`);
        sameJ(o.nobody.stats.map(r => r.join()), Array(4).fill('0,1,0,1'), 'the bonuses and multipliers of nobody'); sameJ(o.nobody.rests, [45, 40, 55, 70], 'the rests'); same(o.nobody.baseline, o.expect, 'the numbers of a follower with no card'); ok(o.w.length >= 1, 'no test card could be worn'); same(o.worn, o.expect, 'a test card changed a number'); sameJ(o.restsOnTest, [45, 40, 55, 70], 'a test card changed a rest');
    });
    await check('levelling still adds the gain to the current health (a follower hurt before a level-up is hurt after it, by the same amount), and nothing about a follower without cards changed', () => {
        const o = J(`(function(){ __fresh(0); const f = __prep('brawler', 'fire', 6); f.health = f.maxHealth - 5; const miss = f.maxHealth - f.health, max0 = f.maxHealth; gainXp(f, xpForLevel(7) - f.xp + 1); return { miss, now: f.maxHealth - f.health, grew: f.maxHealth > max0 }; })()`);
        same(o.grew, true, 'maximum health did not grow'); same(o.now, o.miss, 'a level-up changed how hurt it is');
    });
    await check('the save keeps its parts (28 fields) and its version, the follower record its fields, and the collection its shape: nothing was added for the bonuses', () => {
        same(J('Object.keys(facilitySaveCollect()).length'), 28, 'the save\'s fields'); same(J('FS.version'), 1, 'FS.version'); const f = JSON.parse(run('JSON.stringify(followerRecord(__fresh(1)[0]))')), known = 'element,personality,combatTrait,naturalTrait,perk,stats,role,uid,partnerUid,base,level,xp,evolved,evoWait,playStyle,post,move,cards'.split(',');
        for (const k of Object.keys(f)) ok(known.includes(k), 'a new field in a follower\'s record: ' + k);
    });

    group('9. THE SCREENS (real browser)');
    const P = measure(1180, 820, '');
    if (P === null) console.log('  (no Chromium here: skipped)');
    else {
        await check('the instrument ran (a tablet, the plain page: the six real cards, nothing owned, the start-of-run sheet did not open)', () => { ok(P, 'the probe produced nothing'); same(P.err, undefined, 'the probe threw'); same(P.dev, '', 'the switch'); same(P.wide, true, 'the tablet layout'); same(P.startOpen, false, 'the sheet opened by itself with nothing owned'); });
        if (P && !P.err) {
            await check('the whole path through the screens: IMPACT TEST is locked, UNLOCK takes two taps and ◆1,000, TAKE INTO THE RUN, then CARD 1 offers it to a Brawler (a Mage\'s card says FOR MAGES) and puts the +50% on at once; the card in view shows it; EMPTY takes it off', () => {
                same(P.lockedAtFirst, true, 'it was not locked'); same(P.unlock.armed, 'TAP AGAIN TO UNLOCK', 'the first tap'); same(P.unlock.owned, true, 'unlock'); ok(P.unlock.spent >= 900 && P.unlock.spent <= 1000, 'the price (the live game earns a little in the meantime): ' + P.unlock.spent); same(JSON.parse(P.unlock.stored).owned.join(), 'impact_test', 'what is kept'); sameJ(P.hand, ['impact_test'], 'the hand'); same(P.noBonusYet, true, 'having it in the hand moved a stat'); same(P.before.atk, P.before.plainAtk, 'a follower with no card has the numbers its level gives it');
                const o = Object.fromEntries(P.opts.map(x => [x[0], x])); same(o['IMPACT TEST'][1], false, 'Impact Test is offered'); same(o['POWER SURGE'], undefined, 'a card not in the hand is listed'); same(P.opts.length, 2, 'EMPTY and the one in the hand');
                sameJ(P.on.cards, ['impact_test', null], 'the slot'); same(P.on.atk, st(P.on.plainAtk, 1.5), 'ATK'); same(P.on.power, P.on.atk, 'power'); same(P.on.max, P.on.plainMax, 'maximum health moved'); same(P.on.wearers, 1, 'wearers'); same(P.on.bars.ATTACK, String(Math.round(P.on.atk)), 'the ATTACK shown on the card in view (the screen rounds it)'); same(P.on.bars.POWER, String(Math.round(P.on.power)), 'the POWER shown (rounded)');
                same(P.off.cards, null, 'EMPTY'); same(P.off.atk, P.off.plainAtk, 'ATK after EMPTY'); same(P.off.power, P.off.atk, 'power after EMPTY'); same(P.off.max, P.off.plainMax, 'maximum health after EMPTY'); same(P.off.bars.ATTACK, String(Math.round(P.off.atk)), 'the ATTACK shown after');
            });
            await check('the sheet opened and closed six times, drawn again ten times, and the roster\'s list opened and closed four times: no stat, card, hand or wearer count moved, and there is still one sheet', () => { same(P.stable, true, 'something moved'); same(P.nCards, 1, 'sheets'); });
        }
    }

    console.log(failures ? `\n${failures} failing` : '\nall passing'); process.exit(failures ? 1 : 0);
})();
