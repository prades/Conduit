// SERIES 2: THE PLUMBING FOR THE SPECIES CARDS AND THE CLASS CARDS (js/cards.js EQUIP_PACK2, EQUIP_PACKS, EQUIP_SERIES2, EQUIP_STATS.cooldown; js/techabilities.js techCooldown; js/cardsui.js the packs on sale).
// ASKED (the "Series 2" brief, 2026-10-31): two categories of card, SPECIES (the game's subclass kind: Jelly, Mollusk, Elemental, Crustacean, Drone) and CLASS (Brawler, Mage, Technician), no hybrid identities, the six rarities,
// data-driven, equip / replace / remove with the effect reversed, no stale modifiers, no accidental accumulation, saved and loaded, in the existing booster-pack and collection pipeline. THE CARD LIST (2026-11-01, the owner:
// "Pick a price and set the odds", "Prototype unlocks") is in the game, Unrefined to PROTOTYPE (docs/SERIES-2.md): since Build B (2026-11-02c) 45 cards, the 20 species cards, the Technician's 4, the 18 Mage auras and the
// 3 Brawler opportunity cards (their own rules: tests/classcards.js); the eight Brawler and Mage class cards were cut. The rules are tested here on FIXTURE cards (made here, taken out at the end), on a JELLY TECHNICIAN
// (the flux technician's form, the Goo Proxy); the real list, its price and its odds below; the Prototype abilities in tests/series2abilities.js.
//   THE PACK       Series 2 is in the list of packs, ◆150 for four, 50 / 30 / 15 / 5 over Unrefined to Prototype, locked until the purification; Pack 1 is as it was
//   THE CARDS      a species card fits its subclass and no other (an egg: evolve first); a class card fits its role and no other; worn, the bonuses add; replaced, the old one's goes; removed, nothing is left; never the same card twice
//   THE COOLDOWN   a technician's ability cooldown is a stat: two cards add, nine tenths at most, through every place a cooldown is set (Telegrab here), and nothing on a brawler
//   THE SAVE       a follower's cards and the run's found cards come back from a save; a Series 2 card found is kept as any card is
//   ON SALE        after the purification the pack rolls its own cards (never Pack 1's, never the Crystalline six), one Precision-or-better, none twice, never above Prototype; it is sold for its price; the market's shelf
//                  spans the packs that are open (a locked one's cards are not on it) with each rarity's own weight; with the numbers taken away it is off sale again and what was found stays usable
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function near(a, b, m, tol) { if (Math.abs(a - b) > (tol || 1e-6)) throw new Error(`${m}: expected about ${b}, got ${a}`); }

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; canvas.width = 1280; canvas.height = 860; innerWidth = 1100; if (typeof facilitySpawnTick === 'function') facilitySpawnTick = () => {};
        globalThis.__mk = (el, role) => { spawnFollowerAtCrystal(el, role); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.role = role; return f; };
        globalThis.__form = (f, id) => { f.evolved = id; f.element = EVOLUTIONS[id].element; f.role = EVOLUTIONS[id].role; initFollowerLevel(f, { level: 5 }); return f; };
        globalThis.__fresh = () => { actors = actors.filter(a => !a.isFollower && !(a instanceof Predator)); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); equipReset(); };
        // THE FIXTURE CARDS: Series 2 rows (species and class), made here and taken out at the end; never a card of the game's own
        globalThis.__FX = [
            ['fx_jelly_u', 'FIXTURE · JELLY U', 'subclass', 'jelly', 'unrefined', { bonus: { attack: 0.10 } }],
            ['fx_jelly_l', 'FIXTURE · JELLY L', 'subclass', 'jelly', 'lustrous', { bonus: { attack: 0.20 } }],
            ['fx_crust_p', 'FIXTURE · CRUSTACEAN P', 'subclass', 'crustacean', 'prototype', { bonus: { defense: 0.10 } }],
            ['fx_drone_r', 'FIXTURE · DRONE R', 'subclass', 'drone', 'refined', { bonus: { maxHealth: 0.10 } }],
            ['fx_tech_r', 'FIXTURE · TECHNICIAN R', 'class', 'camper', 'refined', { bonus: { cooldown: 0.25 } }],
            ['fx_tech_p', 'FIXTURE · TECHNICIAN P', 'class', 'camper', 'precision', { bonus: { cooldown: 0.25 } }],
            ['fx_tech_c', 'FIXTURE · TECHNICIAN C', 'class', 'camper', 'crystalline', { bonus: { cooldown: 0.95 } }],
            ['fx_brawl_u', 'FIXTURE · BRAWLER U', 'class', 'brawler', 'unrefined', { bonus: { maxHealth: 0.10 } }],
            ['fx_mage_u', 'FIXTURE · MAGE U', 'class', 'sniper', 'unrefined', { bonus: { specialAttack: 0.10 } }],
        ];
        globalThis.__fxIn = () => { __FX.forEach(([id, name, kind, match, rarity, fx]) => { EQUIP_CARDS[id] = Object.assign({ id, name, kind, match, rarity, text: equipEffectText(fx), pack: 'series2' }, fx); }); _equipReg = null; };
        globalThis.__fxOut = () => { __FX.forEach(([id]) => { delete EQUIP_CARDS[id]; }); _equipReg = null; equipReset(); };
        globalThis.__P2 = { price: EQUIP_PACK2.price, rarities: EQUIP_PACK2.rarities, eligible: EQUIP_PACK2.eligible };   // (the game's own numbers, put back after a test that takes them away)
        globalThis.__onSale = (on) => { if (on) { EQUIP_PACK2.price = __P2.price; EQUIP_PACK2.rarities = __P2.rarities; EQUIP_PACK2.eligible = __P2.eligible; } else { EQUIP_PACK2.price = null; EQUIP_PACK2.rarities = null; } };   // (the price and the odds the archive has not given; its guarantee and its unlock are the shipped ones)
        globalThis.__resolved = (yes) => { _fp.bosses = {}; if (yes) { const S = bossState('sewer_cistern'); S.state = 'resolved'; S.outcome = 'calm'; } };   // (the first boss encounter resolved, calm)
        globalThis.__purified = (yes) => { questState('purify').purifiedAt = yes ? 1 : 0; };   // (the Sewers' water clean: what unlocks Series 2, the owner's rule since 2026-11-01)`);

    group('THE PACK: SERIES 2 IN THE LIST, WITH NO NUMBERS');
    check('Series 2 is Booster Pack 2, after Pack 1: species (subclass) and class cards, ◆150 for four by the odds 50 / 30 / 15 / 5 over Unrefined, Refined, Precision and PROTOTYPE (the rarity it unlocks), one Precision-or-better in every pack, locked until the purification; its 45 cards are in the game (one for each species and rarity, the Technician\'s four, six auras a tier from Refined, an opportunity card a tier from Refined); Pack 1 is untouched; ABILITY COOLDOWN is a stat', () => {
        const r = J(`(function(){ shardCount = 0; __resolved(false); __purified(false); return { ids: EQUIP_PACKS.map(p => p.id), p2: { kinds: EQUIP_PACK2.kinds, price: EQUIP_PACK2.price, rarities: EQUIP_PACK2.rarities, eligible: EQUIP_PACK2.eligible, guaranteed: EQUIP_PACK2.guaranteed, unlock: EQUIP_PACK2.unlock, size: EQUIP_PACK2.size, keep: EQUIP_PACK2.keep, find: EQUIP_PACK2.unlockNeedsFind }, gr: equipGuaranteeRarities(EQUIP_PACK2), locked: equipPackLocked(EQUIP_PACK2),
            onSale: [equipPackOnSale(EQUIP_PACK), equipPackOnSale(EQUIP_PACK2)], sale: equipPacksOnSale().map(p => p.id), why: equipPackWhyNot(EQUIP_PACK2), roll: equipPackRoll(7, EQUIP_PACK2), pool: equipPackPool(EQUIP_PACK2).length, list: EQUIP_SERIES2.length, named: Object.values(equipCards()).filter(c => c.pack === 'series2' && c.kind !== 'player').length, players: Object.values(equipCards()).filter(c => c.pack === 'series2' && c.kind === 'player').length,
            p1: { price: EQUIP_PACK.price, size: EQUIP_PACK.size, rarities: EQUIP_PACK.rarities, guaranteed: EQUIP_PACK.guaranteed, kinds: EQUIP_PACK.kinds, why: equipPackWhyNot(EQUIP_PACK) }, stat: EQUIP_STATS.cooldown, words: equipEffectText({ bonus: { cooldown: 0.25 } }), byId: equipPackById('series2') === EQUIP_PACK2, ofCryst: equipPackOf(equipCard('impact_test')),
            cards: Object.values(equipCards()).filter(c => c.pack === 'series2' && c.kind !== 'player').map(c => [c.kind, c.match, c.rarity, !!(c.bonus || c.proc || c.ability || c.aura || c.opportunity), !!c.text]) }; })()`);
        same(r.ids.join(), 'pack1,series2', 'the packs'); same(JSON.stringify(r.p2), JSON.stringify({ kinds: ['subclass', 'class'], price: 150, rarities: { unrefined: 50, refined: 30, precision: 15, prototype: 5 }, eligible: ['unrefined', 'refined', 'precision', 'prototype'], guaranteed: { rarity: 'precision', count: 1, orHigher: true }, unlock: 'purified', size: 4, keep: 'run', find: true }), 'Series 2'); same(r.gr.join(), 'precision,prototype,lustrous,crystalline', 'the guarantee\'s rarities'); same(r.locked, true, 'locked before the purification'); same(r.onSale.join() + '|' + r.sale.join(), 'true,true|pack1,series2', 'on sale (its button on the sheet says when it opens)');
        same(r.why, 'UNLOCKS AFTER THE PURIFICATION', 'why not'); same(r.roll, null, 'a roll while locked'); same([r.pool, r.list, r.named, r.players].join(), '45,24,45,6', 'its cards (the pool, the species and Technician table, all it deals; and the six Player cards it names but does not deal until all eighteen are in: tests/playercards.js)');
        for (const m of ['crustacean', 'mollusk', 'elemental', 'drone', 'jelly', 'camper']) for (const q of ['unrefined', 'refined', 'precision', 'prototype']) same(r.cards.filter(c => c[1] === m && c[2] === q).length, 1, 'the ' + q + ' card for ' + m);
        for (const [m, n] of [['sniper', 6], ['brawler', 1]]) for (const q of ['unrefined', 'refined', 'precision', 'prototype']) same(r.cards.filter(c => c[1] === m && c[2] === q).length, q === 'unrefined' ? 0 : n, 'the ' + q + ' cards for ' + m);
        ok(r.cards.every(c => c[3] && c[4]), 'a card with no effect or no words'); ok(r.cards.every(c => (c[0] === 'subclass') === ['crustacean', 'mollusk', 'elemental', 'drone', 'jelly'].includes(c[1])), 'a species card that is not of a species, or a class card that is'); same(JSON.stringify(r.p1), JSON.stringify({ price: 100, size: 4, rarities: { unrefined: 60, refined: 30, precision: 10 }, guaranteed: { rarity: 'precision', count: 1 }, kinds: ['element'], why: 'NEED ◆100 MORE' }), 'Pack 1');
        same(r.stat, 'ABILITY COOLDOWN', 'the stat'); same(r.words, '−25% ABILITY COOLDOWN', 'its words'); same(r.byId && r.ofCryst === null, true, 'the lookups');
    });

    group('THE CARDS: SPECIES AND CLASS, ON A JELLY TECHNICIAN');
    check('fits: a species card fits a follower of its subclass only (a Jelly Technician takes a jelly card, not a crustacean one; an egg has to evolve first; a Jelly Ram takes it too), a class card fits its role only (the technician card on the technician, not the brawler\'s or the mage\'s); each refusal says what it is for', () => {
        const r = J(`(function(){ __fresh(); __fxIn(); equipFound = __FX.map(x => x[0]); const t = __form(__mk('flux', 'camper'), 'gooproxy'), egg = __mk('flux', 'camper'), ram = __form(__mk('core', 'brawler'), 'jellyram'), w = (u, id) => equipWhyNot(u, id, 0);
            return { who: [equipSubclassOf(t), equipRoleOf(t), equipElementOf(t), equipSubclassOf(ram), equipRoleOf(ram)], t: [w(t, 'fx_jelly_u'), w(t, 'fx_jelly_l'), w(t, 'fx_crust_p'), w(t, 'fx_drone_r'), w(t, 'fx_tech_r'), w(t, 'fx_brawl_u'), w(t, 'fx_mage_u')], egg: [w(egg, 'fx_jelly_u'), w(egg, 'fx_tech_r')], ram: [w(ram, 'fx_jelly_u'), w(ram, 'fx_tech_r'), w(ram, 'fx_brawl_u')] }; })()`);
        same(r.who.join(), 'jelly,camper,flux,jelly,brawler', 'who they are'); same(JSON.stringify(r.t), JSON.stringify([null, null, 'FOR CRUSTACEANS', 'FOR DRONES', null, 'FOR BRAWLERS', 'FOR MAGES']), 'the technician'); same(JSON.stringify(r.egg), JSON.stringify(['FOR JELLIES · EVOLVE FIRST', null]), 'the egg (JELLIES: the plural said right, build 2026-11-01j)');
        same(JSON.stringify(r.ram), JSON.stringify([null, 'FOR TECHNICIANS', null]), 'the Jelly Ram');
    });
    check('worn: two jelly cards add (+10% and +20% attack make +30%, in the stats the game makes); replaced by the class card, the +10% is gone and the cooldown bonus is there; removed, nothing is left and the stats are the base again; the same card is never on both slots; a card that does not fit counts nothing and is taken off by the tick', () => {
        const r = J(`(function(){ __fresh(); __fxIn(); equipFound = __FX.map(x => x[0]); const t = __form(__mk('flux', 'camper'), 'gooproxy'); const base = t.stats.attack, o = {};
            o.put = [equipPut(t, 0, 'fx_jelly_u'), equipPut(t, 1, 'fx_jelly_l')]; o.two = [Math.round(equipBonus(t, 'attack') * 100) / 100, Math.round(t.stats.attack / base * 100) / 100, equipWorn(t)];
            o.rep = equipPut(t, 0, 'fx_tech_r'); o.after = [equipBonus(t, 'attack'), equipBonus(t, 'cooldown'), Math.round(t.stats.attack / base * 100) / 100, equipSlots(t).join()];
            o.twice = [equipPut(t, 1, 'fx_tech_r'), equipWhyNot(t, 'fx_tech_r', 1), equipBonus(t, 'cooldown')];
            o.off = [equipPut(t, 1, null), equipPut(t, 0, null), equipBonus(t, 'attack'), equipBonus(t, 'cooldown'), t.cards === undefined, Math.round(t.stats.attack / base * 100) / 100];
            t.cards = ['fx_crust_p', 'fx_jelly_u']; equipRefresh(t); o.misfit = [equipBonus(t, 'defense'), equipBonus(t, 'attack')]; o.valid = [equipValid(t), equipSlots(t).join()]; return o; })()`);
        same(r.put.join(), 'true,true', 'put'); same(r.two.join(), '0.3,1.3,2', 'two cards: the bonus and the stat'); same(r.rep, true, 'the replacement'); same(r.after.join(), '0.2,0.25,1.2,fx_tech_r,fx_jelly_l', 'after the replacement');
        same(r.twice.join(), 'false,ALREADY ON ITS OTHER SLOT,0.25', 'the same card twice'); same(r.off.join(), 'true,true,0,0,true,1', 'taken off'); same(r.misfit.join(), '0,0.1', 'a misfit counts'); same(r.valid.join(), '1,,fx_jelly_u', 'the tick');
    });

    group('THE COOLDOWN STAT (js/techabilities.js techCooldown)');
    check('two technician cards of −25% take half off the cooldown; nine tenths is the most that comes off; a brawler with a cooldown card has nothing to shorten; the real path: a Telegrab\'s cooldown on the Jelly Technician is half of TECH_AB.grab.cooldown with the two cards, whole without', () => {
        const r = J(`(function(){ __fresh(); __fxIn(); equipFound = __FX.map(x => x[0]); const t = __form(__mk('flux', 'camper'), 'gooproxy'), o = {}; t.x = player.x - 1; t.y = player.y; partyTick(); techAbilityTick(); t._abReadyAt = frame;
            o.none = techCooldown(t, 3600); equipPut(t, 0, 'fx_tech_r'); o.one = techCooldown(t, 3600); equipPut(t, 1, 'fx_tech_p'); o.two = techCooldown(t, 3600);
            equipPut(t, 0, 'fx_tech_c'); o.capped = [equipBonus(t, 'cooldown'), techCooldown(t, 3600)]; equipPut(t, 0, 'fx_tech_r');
            const b = __form(__mk('core', 'brawler'), 'jellyram'); b.cards = ['fx_tech_r', null]; equipRefresh(b); o.brawler = [equipBonus(b, 'cooldown'), techCooldown(b, 3600)];
            const it = _fp.items.find(i => i.fp === 'pickup' && !i.taken); const g = techGrabAt(t, { kind: 'pickup', o: it }); o.grab = [g.ok, techReadyIn(t), TECH_AB.grab.cooldown / 2]; it.grab = null; techGrabs.length = 0;
            equipPut(t, 0, null); equipPut(t, 1, null); t._abReadyAt = frame; const g2 = techGrabAt(t, { kind: 'pickup', o: it }); o.grabPlain = [g2.ok, techReadyIn(t), TECH_AB.grab.cooldown]; it.grab = null; techGrabs.length = 0; return o; })()`);
        same([r.none, r.one, r.two].join(), '3600,2700,1800', 'the cooldowns'); same(r.capped.join(), '1.2,360', 'the cap'); same(r.brawler.join(), '0,3600', 'a brawler'); same(r.grab.join(), 'true,1800,1800', 'the Telegrab with the cards'); same(r.grabPlain.join(), 'true,3600,3600', 'the Telegrab without');
    });

    group('THE SAVE');
    check('a follower\'s Series 2 cards come back from the roster\'s save, worn, with their bonus; the run\'s found cards come back from the run\'s save; a card found is unlocked as any pack\'s card is (found first, then the shards)', () => {
        const r = J(`(function(){ __fresh(); __fxIn(); equipFound = ['fx_jelly_u', 'fx_tech_r']; const t = __form(__mk('flux', 'camper'), 'gooproxy'); equipPut(t, 0, 'fx_jelly_u'); equipPut(t, 1, 'fx_tech_r'); const o = {}; const base = t.stats.attack / 1.1;
            const rec = followerRosterSnapshot().find(e => e.evolved === 'gooproxy'); o.rec = [rec && rec.cards ? rec.cards.join() : null, rec && rec.evolved]; const run = equipSaveCollect(); o.run = run.found.join();
            t.dead = true; actors = actors.filter(a => a !== t); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; equipReset(); o.gone = [equipFound.length, equipUsable('fx_jelly_u')];
            equipSaveApply(run); const f2 = spawnFollowerFromSave(rec); o.back = [f2 && f2.evolved, f2 && equipSlots(f2).join(), f2 && equipBonus(f2, 'attack'), f2 && equipBonus(f2, 'cooldown'), f2 && Math.round(f2.stats.attack / base * 100) / 100, equipFound.join()];
            shardCount = 0; o.unlock = [equipUnlockWhyNot('fx_jelly_l'), equipUnlockWhyNot('fx_jelly_u')]; shardCount = 1000; o.unlock.push(equipUnlockWhyNot('fx_jelly_u'), equipUnlock('fx_jelly_u'), equipOwns('fx_jelly_u'), shardCount); equipOwnedSet().delete('fx_jelly_u'); equipWriteOwned(); return o; })()`);
        same(r.rec.join(), 'fx_jelly_u,fx_tech_r,gooproxy', 'the roster record'); same(r.run, 'fx_jelly_u,fx_tech_r', 'the run\'s found'); same(r.gone.join(), '0,false', 'gone between'); same(r.back.join(), 'gooproxy,fx_jelly_u,fx_tech_r,0.1,0.25,1.1,fx_jelly_u,fx_tech_r', 'back from the save');
        same(r.unlock.join(), 'FIND IT IN A PACK FIRST,NEED ◆1000 MORE,,true,true,0', 'the unlock');
    });

    group('ON SALE (the numbers given here only): THE ROLL, THE SALE, THE SHELF');
    check('Series 2 on sale: locked until the Sewers are purified (the first boss resolved is not enough: the owner\'s rule); then its pool is its own 45 cards; a roll deals four different cards of it, one Precision-or-better at least, never above Prototype (Lustrous comes later), the same twice with the same seed; a pack bought pays ◆150 and finds its cards; the market\'s shelf takes its cards only once it is open; taken off sale, what was found stays usable', () => {
        const r = J(`(function(){ __fxOut(); __fresh(); const o = {}; __resolved(false); __purified(false); shardCount = 500; o.locked = [equipPackWhyNot(EQUIP_PACK2), equipPackRoll(3, EQUIP_PACK2), equipPackOpen(3, EQUIP_PACK2), shardCount];
            o.shelfLocked = [equipShelfPool().some(c => c.pack === 'series2'), JSON.stringify(equipShelfWeights())];   // (before the purification: none of its cards on the shelf)
            __resolved(true); o.bossOnly = [equipPackLocked(EQUIP_PACK2), equipPackWhyNot(EQUIP_PACK2)]; __purified(true); o.unlocked = [equipPackLocked(EQUIP_PACK2), equipPackWhyNot(EQUIP_PACK2) === null];
            const pool = equipPackPool(EQUIP_PACK2); o.pool = [pool.length, pool.every(c => c.pack === 'series2' && (c.kind === 'subclass' || c.kind === 'class')), pool.some(c => c.rarity === 'crystalline')];
            const hi = id => ['precision', 'prototype', 'lustrous', 'crystalline'].indexOf(equipCard(id).rarity) >= 0; const a = equipPackRoll(11, EQUIP_PACK2), b = equipPackRoll(11, EQUIP_PACK2); o.roll = [a.length, new Set(a).size, a.every(id => equipCard(id).pack === 'series2'), a.some(hi), a.join() === b.join()];
            let seeds = 0, proto = 0, above = 0; const N = 400; for (let s = 1; s <= N; s++) { const ids = equipPackRoll(s, EQUIP_PACK2); if (ids && ids.some(hi) && new Set(ids).size === 4) seeds++; if (ids && ids.some(id => equipCard(id).rarity === 'prototype')) proto++; if (ids && ids.some(id => ['lustrous', 'crystalline'].indexOf(equipCard(id).rarity) >= 0)) above++; }
            o.always = [seeds, above, Math.round(proto / N * 100)];
            shardCount = 100; o.poor = equipPackWhyNot(EQUIP_PACK2); shardCount = 500; const got = equipPackOpen(5, EQUIP_PACK2); o.bought = [got && got.length, shardCount, equipFound.length, equipPackLast.pack, got && got.every(id => equipIsFound(id) || equipPackLast.dupes.indexOf(id) >= 0)];
            equipFound.length = 0; o.weights = equipShelfWeights(); const sp = equipShelfPool(); o.shelfPool = [sp.some(c => c.pack === 'pack1'), sp.some(c => c.pack === 'series2'), new Set(sp.map(c => c.id)).size === sp.length];
            let s2 = 0, p1 = 0; for (let s = 1; s <= 60; s++) for (const id of equipShelfDeal(s)) { if (equipCard(id).pack === 'series2') s2++; else p1++; } o.shelves = [s2 > 0, p1 > 0];
            const one = got[0]; __onSale(false); o.off = [equipPacksOnSale().map(p => p.id).join(), equipPackWhyNot(EQUIP_PACK2), equipShelfPool().every(c => c.pack === 'pack1'), JSON.stringify(equipShelfWeights())]; equipFound = [one]; o.stillUsable = equipUsable(one);
            __onSale(true); __resolved(false); __purified(false); equipReset(); o.back = [equipPackOnSale(EQUIP_PACK2), EQUIP_PACK2.price]; return o; })()`);
        same(JSON.stringify(r.locked), JSON.stringify(['UNLOCKS AFTER THE PURIFICATION', null, null, 500]), 'locked before the purification: not rolled, not sold, nothing paid'); same(r.shelfLocked.join('|'), 'false|{"unrefined":60,"refined":30,"precision":10}', 'its cards on the shelf before it opens');
        same(r.bossOnly.join(), 'true,UNLOCKS AFTER THE PURIFICATION', 'the first boss resolved, the water not clean: still locked (the owner\'s rule)'); same(r.unlocked.join(), 'false,true', 'the purification did not unlock it');
        same(r.pool.join(), '45,true,false', 'the pool'); same(r.roll.join(), '4,4,true,true,true', 'a roll'); same(r.always[0], 400, 'a pack without a Precision-or-better card, or with a card twice'); same(r.always[1], 0, 'a Lustrous or Crystalline card dealt');
        ok(r.always[2] >= 28 && r.always[2] <= 44, 'packs holding a Prototype: ' + r.always[2] + '% (by the odds 1 − 0.75 × 0.95³ ≈ 36%, about 1 in 3: the reserved slot draws Prototype 5 in 20, each other slot 5 in 100)'); same(r.poor, 'NEED ◆50 MORE', 'short of the price');
        same(r.bought.join(), '4,350,4,series2,true', 'a pack bought'); same(JSON.stringify(r.weights), JSON.stringify({ unrefined: 60, refined: 30, precision: 10, prototype: 5 }), 'the shelf\'s weights (Pack 1\'s first, Series 2\'s for Prototype)');
        same(r.shelfPool.join(), 'true,true,true', 'the shelf\'s pool'); same(r.shelves.join(), 'true,true', 'shelves of both'); same(r.off.join('|'), 'pack1|NOT ON SALE YET|true|{"unrefined":60,"refined":30,"precision":10}', 'off sale again'); same(r.stillUsable, true, 'a found card off sale'); same(r.back.join(), 'true,150', 'its numbers back');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
