// ENERGY CARDS (docs/ENERGY-CARDS.md; js/energy.js; the owner, 2026-11-09: "a resource system that's been at the heart of most of the games I've ever played"). A follower's element comes from an energy card it holds;
// at level 8 with one it evolves (the card used up); an evolved follower's three slots: its own element's cards unlock its second attack, then its Ultimate; another element's, a hybrid (not designed yet).
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

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`facilityBlackoutSet(false); gameState.running = true; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; classPickerOpen = false;
        globalThis.__mk = (role, el) => { spawnFollowerAtCrystal(el || 'fire', role || 'brawler'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; return f; };
        globalThis.__clear = () => { actors = actors.filter(a => !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; energyReset(); };`);

    group('THE RULES (js/energy.js)');
    check('the owner\'s numbers: 1 slot unevolved, 3 evolved, level 8, 2 a pack; the second attack with 1 card of its element, the Ultimate with 2; "none" is no element a card can be', () => {
        same(J('[ENERGY.unevolvedSlots, ENERGY.evolvedSlots, ENERGY.evolveLevel, ENERGY.altNeeds, ENERGY.ultNeeds].join()'), '1,3,8,1,2', 'the numbers');
        same(J('EVOLVE_LEVEL'), 8, 'the evolution level'); same(J('energyElementOk(ENERGY_NONE)'), false, '"none" as a card'); same(J('energyElementOk("fire") && energyElementOk("blossom")'), true, 'fire and BLOOM as cards');
    });

    group('OWNING THEM: counted copies; put in a slot it leaves you, taken out it comes back');
    check('an unevolved follower has 1 slot; a card put in it gives it the card\'s element and leaves your stock; taken out, it comes back and the follower has no element', () => {
        const r = J(`(function(){ __clear(); const f = __mk('brawler'); energyStart(f, null); energyAdd('ice', 2); const o = { slots0: energySlots(f).length, el0: f.element };
            o.put = energyPut(f, 0, 'ice'); o.el1 = f.element; o.stock1 = energyCount('ice'); o.swap = energyPut(f, 0, 'fire'); o.whyFire = energyWhyNot(f, 0, 'fire');
            o.out = energyPut(f, 0, null); o.el2 = f.element; o.stock2 = energyCount('ice'); o.bucket = (followerByElement[ENERGY_NONE] || []).includes(f); return o; })()`);
        same(r.slots0, 1, 'slots'); same(r.el0, 'none', 'its element with no card'); same(r.put, true, 'put'); same(r.el1, 'ice', 'its element with an ICE card'); same(r.stock1, 1, 'your ICE cards after');
        same(r.swap, false, 'a card you hold none of went in'); same(r.whyFire, 'NO FIRE ENERGY CARD', 'why not'); same(r.out, true, 'taken out'); same(r.el2, 'none', 'its element after'); same(r.stock2, 2, 'your ICE cards back');
    });

    group('EVOLVING: at level 8 with an energy card, on its own; the card used up; the element its own for good');
    check('at level 8 without a card it does not evolve; with one it does, the card is used up (not back in your stock), it has 3 empty slots and keeps its element', () => {
        const r = J(`(function(){ __clear(); const f = __mk('brawler'); energyStart(f, null); f.level = 8; const o = { none: evoCheck(f) };
            energyAdd('fire', 1); energyPut(f, 0, 'fire'); o.at7 = (f.level = 7, evoCheck(f)); f.level = 8; o.at8 = evoCheck(f); o.evolved = f.evolved || null; o.el = f.element; o.slots = energySlots(f); o.stock = energyCount('fire'); return o; })()`);
        same(r.none, false, 'evolved with no card'); same(r.at7, false, 'evolved at level 7'); same(r.at8, true, 'did not evolve at 8 with a card'); ok(r.evolved, 'no form'); same(r.el, 'fire', 'its element');
        same(r.slots.join(), ',,', 'its three slots (empty: the card used up)'); same(r.stock, 0, 'the card came back');
    });

    group('UNLOCKS: its own element\'s cards, its second attack then its Ultimate; another element\'s, a hybrid (not designed yet)');
    check('an evolved follower with no card: second attack and Ultimate locked; 1 of its element: its second attack; 2: its Ultimate too; another element\'s card: a hybrid, unlocking nothing yet', () => {
        const r = J(`(function(){ __clear(); const f = __mk('brawler', 'fire'); f.evolved = 'quillstone'; energyStart(f); const d = evolvedDef(f), mv = evoMoveIds(d)[0], o = {};
            const st = () => [evoMoveAllowed(f, d, mv), !!followerUltimate(f), !!followerUltLocked(f), energyHybrids(f).join('+')].join('/');
            o.none = st(); energyAdd('fire', 3); energyAdd('ice', 1);
            energyPut(f, 0, 'ice'); o.hybrid = st(); energyPut(f, 1, 'fire'); o.one = st(); energyPut(f, 2, 'fire'); o.two = st();
            o.altSet = followerAltSet(f, mv); energyPut(f, 1, null); o.altOne = f.alt || null; energyPut(f, 2, null); o.altAfter = f.alt || null; o.roles = [0, 1, 2].map(i => energySlotRole(f, i)); return o; })()`);
        same(r.none, 'false/false/' + 'true/', 'no card (second attack / Ultimate / Ultimate locked / hybrids)');
        same(r.hybrid, 'false/false/true/ice', 'an ICE card on a FIRE form'); same(r.one, 'true/false/true/ice', 'one FIRE card'); same(r.two, 'true/true/false/ice', 'two FIRE cards');
        same(r.altSet, true, 'its second attack could not be chosen'); same(r.altOne, r.altOne && String(r.altOne), 'one FIRE card left: its second attack kept'); ok(r.altOne, 'one FIRE card left, yet it left its second attack'); same(r.altAfter, null, 'its last FIRE card taken out left it on a locked second attack');
    });

    group('PACKS (the owner, 2026-11-09: "Make the pack 50% less, but make 2 of the cards guaranteed energy cards, and 1 card guaranteed 3 rarity")');
    check('Pack 1 ◆50 and Series 2 ◆75 (half): 4 cards each, 2 of them energy cards and 2 their own, one of those the guaranteed Precision (the third rarity; Series 2\'s or better)', () => {
        const r = J(`EQUIP_PACKS.map(p => [p.id, p.price, p.size, p.energy, p.guaranteed.rarity, p.guaranteed.count, EQUIP_RARITIES.findIndex(x => x.id === p.guaranteed.rarity) + 1].join(':'))`);
        same(r.join(' '), 'pack1:50:2:2:precision:1:3 series2:75:2:2:precision:1:3', 'the packs');
    });
    check('opening a pack deals its 2 energy cards into your stock, of elements found (never BLOOM), and its 2 own cards; over many rolls every element found comes up', () => {
        const r = J(`(function(){ __clear(); shardCount = 1000; const ids = equipPackOpen(11, EQUIP_PACK), o = { ids: ids && ids.length, energy: equipPackLast.energy.length, stock: energyTotal(), paid: 1000 - shardCount };
            let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647, el = {}; for (let i = 0; i < 2000; i++) for (const e of energyPackRoll(rnd, 2)) el[e] = 1; o.el = Object.keys(el).sort(); o.found = elementsFound().sort(); return o; })()`);
        same(r.ids, 2, 'its own cards'); same(r.energy, 2, 'its energy cards'); same(r.stock, 2, 'your energy cards after'); same(r.paid, 50, 'what it cost');
        same(r.el.join(), r.found.join(), 'the elements dealt'); ok(r.el.indexOf('blossom') < 0, 'BLOOM dealt');
    });

    group('THE RUN\'S, AND SAVED');
    check('the stock is saved and read back; NEW GAME clears it (equipReset); a follower\'s slots are in its record and come back with it', () => {
        const r = J(`(function(){ __clear(); energyAdd('toxic', 3); energyAdd('core', 1); const saved = energySaveCollect(); energyReset(); const after = energyTotal(); energySaveApply(saved);
            const o = { saved, after, back: energySaveCollect() }; energyAdd('flux', 1); equipReset(); o.newGame = energyTotal();
            const f = __mk('mage'); energyStart(f, null); energyAdd('flux', 1); energyPut(f, 0, 'flux'); const rec = followerRecord(f), g = followerBuild(rec); o.rec = rec.energy; o.g = [g.element, energySlots(g).join()]; return o; })()`);
        same(JSON.stringify(r.saved), '{"toxic":3,"core":1}', 'saved'); same(r.after, 0, 'cleared'); same(JSON.stringify(r.back), '{"toxic":3,"core":1}', 'read back'); same(r.newGame, 0, 'NEW GAME left the stock');
        same(JSON.stringify(r.rec), '["flux"]', 'its record'); same(r.g.join('|'), 'flux|flux', 'rebuilt from its record');
    });
    check('a follower saved before energy cards (no `energy` in its record): an unevolved one loses its element ("Start elementless"); an evolved one keeps it, its slots empty ("Lock them too")', () => {
        const r = J(`(function(){ const u = followerBuild({ element: 'ice', role: 'brawler', level: 5 }), e = followerBuild({ element: 'fire', role: 'brawler', level: 12, evolved: 'quillstone' });
            return { u: [u.element, energySlots(u).join()], e: [e.element, energySlots(e).join(), !!followerUltimate(e)] }; })()`);
        same(r.u.join('|'), 'none|', 'an unevolved follower from an old save'); same(r.e.join('|'), 'fire|,,|false', 'an evolved one');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
