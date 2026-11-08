// THE SERIES 2 ABILITIES (js/cards.js: the PROTOTYPE cards' `ability`, equipOnHit, equipOnHurt, the card tick, equipBonus; js/helpers.js applyDamage's hook; js/techabilities.js techCooldown).
// ASKED (the owner, 2026-11-01): "Series 2. Pick a price and set the odds for the pack and make it to where another rarity is unlocked", and asked which: "Prototype unlocks": Series 2 deals up to PROTOTYPE, one ability for each
// species and class (docs/SERIES-2.md). Each is worn here by a follower of the identity it is for (and by one it is not, where that matters), and set off through the game's own damage path.
//   TIDE SHELL      (spine-legged, was crustacean) SHELL BLOCK: an enemy's hit blocked whole; ready again 8 s after a block
//   REGROWTH SAC    (mollusk)    REGROWTH: 0.5% of its maximum HP back every second
//   STORM HEART     (elemental)  NOVA: every 6th hit bursts on every enemy within 1.5 tiles of the target, for 60% of its special attack
//   OVERCLOCK CHIP  (drone)      OVERCLOCK: every 12 s, +50% attack speed for 3 s
//   AMORPHOUS BODY  (jelly)      ABSORB: a hit after 5 s without one does 40% less
//   CLEAVER ARM and CHAIN CONDUIT (brawler, mage): CUT in Build B (2026-11-02c) with the other Brawler and Mage class cards; their code stays, worn by no card (tests/classcards.js)
//   DOUBLE CELL     (technician) DOUBLE CHARGE: a second charge of its ability, refilled one cooldown after it is spent
// And the Precision cards that are new kinds: ATTUNED CORE (its own element's status) and the two-stat cards (HUNTER OPTICS).
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
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; canvas.width = 1280; canvas.height = 860; if (typeof facilitySpawnTick === 'function') facilitySpawnTick = () => {};
        globalThis.__fresh = () => { actors = actors.filter(a => !a.isFollower && !(a instanceof Predator)); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); equipReset(); floatingTexts.length = 0; };
        // a follower of a form (its subclass and its role come with it), at (x, y), wearing a card (found for the run, so the tick keeps it on)
        globalThis.__wear = (form, card, x, y) => { const E = EVOLUTIONS[form]; spawnFollowerAtCrystal(E.element, E.role); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.role = E.role; f.evolved = form; f.element = E.element;
            initFollowerLevel(f, { level: 10 }); f.x = x; f.y = y; if (card) { if (equipFound.indexOf(card) < 0) equipFound.push(card); f.cards = [card, null]; equipRefresh(f); } f.health = f.maxHealth; return f; };
        globalThis.__ant = (x, y) => { const p = spawnCreature({ species: 'ant', className: 'tank', x, y, level: 5, state: 'wander' }); p.fpCreature = true; p.homeRoom = 'arena'; p.spawnProtection = 0; p.health = p.maxHealth = 5000; return p; };
        globalThis.__said = w => floatingTexts.some(t => t.text === w);`);

    group('THE PROTOTYPE CARDS: one ability for each species and class');
    check('every Prototype species card of Series 2, and the Technician\'s, has an ability its words describe: shell block, regrowth, nova, overclock, absorb, double charge (the Mage\'s and the Brawler\'s Prototypes are an aura and an opportunity card since Build B)', () => {
        const r = J(`Object.values(EQUIP_CARDS).filter(c => c.pack === 'series2' && c.rarity === 'prototype' && c.ability).map(c => [c.match, c.ability && c.ability.kind, c.text.split(':')[0]])`);
        same(r.map(x => x[0] + '=' + x[1]).join(), 'spinelegged=shellBlock,mollusk=regrowth,elemental=nova,drone=overclock,jelly=absorb,camper=doubleCharge', 'the abilities');
        same(r.map(x => x[2]).join(), 'SHELL BLOCK,REGROWTH,NOVA,OVERCLOCK,ABSORB,DOUBLE CHARGE', 'their words');
        same(J(`Object.values(EQUIP_CARDS).filter(c => c.pack === 'series2' && c.rarity === 'prototype' && !c.ability).map(c => c.aura ? 'aura' : c.opportunity ? 'opportunity' : c.kind === 'player' ? 'player' : c.attack ? 'attack' : c.id).join()`), 'attack,attack,attack,attack,aura,aura,aura,aura,aura,aura,opportunity,player,player,player,player,player,player,player,player,player,player,player,player,player,player,player,player,player,player', 'the Prototypes without an ability (the eighteen Player cards Series 2 names but does not deal yet: tests/playercards.js)');
    });
    check('TIDE SHELL on a Crustacean (a Quillstone): an enemy\'s hit is BLOCKED whole; the next one lands; 8 s after the block the shell is ready again; on a follower it does not fit (a Jelly Ram) it blocks nothing', () => {
        const r = J(`(function(){ __fresh(); frame = 1000; const q = __wear('quillstone', 'tide_shell', 0, 0), a = __ant(1, 0), o = {};
            let h = q.health; applyDamage(q, 30, a); o.first = [Math.round(h - q.health), __said('BLOCKED')]; h = q.health; applyDamage(q, 30, a); o.second = Math.round(h - q.health) > 0;
            frame += 470; h = q.health; applyDamage(q, 30, a); o.early = Math.round(h - q.health) > 0; frame += 480; h = q.health; applyDamage(q, 30, a); o.again = Math.round(h - q.health);
            const j = __wear('jellyram', 'tide_shell', 3, 0); h = j.health; applyDamage(j, 30, a); o.notFit = Math.round(h - j.health) > 0; return o; })()`);
        same(r.first.join(), '0,true', 'the first hit'); same(r.second, true, 'the second hit was blocked too'); same(r.early, true, 'blocked again too soon'); same(r.again, 0, 'not blocked again after 8 s'); same(r.notFit, true, 'a Jelly blocked it');
    });
    check('AMORPHOUS BODY on a Jelly (a Jelly Ram): a hit after 5 s without one does 40% less (ABSORBED); a hit right after does it all', () => {
        const r = J(`(function(){ __fresh(); frame = 5000; const j = __wear('jellyram', 'amorphous_body', 0, 0), a = __ant(1, 0), o = {};
            let h = j.health; applyDamage(j, 20, a); o.first = h - j.health; o.word = __said('ABSORBED'); j.health = j.maxHealth; frame += 30; h = j.health; applyDamage(j, 20, a); o.next = h - j.health; j.health = j.maxHealth;
            frame += 301; h = j.health; applyDamage(j, 20, a); o.later = h - j.health; return o; })()`);
        ok(r.next > 0 && Math.abs(r.first - r.next * 0.6) < 0.01 && r.word, 'the first hit (after a long while) is not 60% of a full one: ' + JSON.stringify(r)); ok(Math.abs(r.later - r.next * 0.6) < 0.01, 'a hit 5 s after the last is not 60%: ' + JSON.stringify(r));
    });
    check('REGROWTH SAC on a Mollusk (a Hornshell): 0.5% of its maximum HP back every second, through the card tick; nothing past full; not while it is down', () => {
        const r = J(`(function(){ __fresh(); frame = 9000; const m = __wear('hornshell', 'regrowth_sac', 0, 0), o = {}; m.health = m.maxHealth * 0.5; const h0 = m.health;
            for (let i = 0; i < 20; i++) { frame += EQUIP.every; equipTick(true); } o.tenSeconds = Math.round((m.health - h0) / m.maxHealth * 1000) / 10;
            m.health = m.maxHealth - 0.01; for (let i = 0; i < 4; i++) equipTick(true); o.capped = m.health === m.maxHealth; return o; })()`);
        same(r.tenSeconds, 5, '% healed in 10 s'); same(r.capped, true, 'healed past full');
    });
    check('OVERCLOCK CHIP on a Drone (a Static Orb): 12 s after it is worn its attack speed is +50% for 3 s (OVERCLOCK), then back; the rest between its attacks is shorter while it runs', () => {
        const r = J(`(function(){ __fresh(); frame = 20000; const d = __wear('staticorb', 'overclock_chip', 0, 0), o = { base: equipBonus(d, 'attackSpeed'), rest0: followerRest(d, 60) }; equipTick(true);
            frame += 700; equipTick(true); o.before = equipBonus(d, 'attackSpeed'); frame += 30; equipTick(true); o.on = [equipBonus(d, 'attackSpeed'), __said('OVERCLOCK'), followerRest(d, 60)];
            frame += 200; o.after = equipBonus(d, 'attackSpeed'); return o; })()`);
        same(r.base, 0, 'a bonus before'); same(r.before, 0, 'it came early'); same(r.on[0], 0.5, 'the bonus while it runs'); same(r.on[1], true, 'no OVERCLOCK'); ok(r.on[2] < r.rest0, 'the rest is not shorter: ' + r.on[2] + ' vs ' + r.rest0); same(r.after, 0, 'it did not end');
    });
    check('STORM HEART on an Elemental (an Ember Cowl): its 6th hit bursts (NOVA) on every enemy within 1.5 tiles of the target, the target too, for 60% of its special attack; the 5th does not; one farther off is untouched', () => {
        const r = J(`(function(){ __fresh(); const c = [..._fp.cellsP.values()].find(q => [1, 2, 3, 4, 5].every(k => _fp.cellsP.has((q[0] + k) + ',' + q[1])) && facilitySeesFrom(q[0], q[1], q[0] + 5, q[1]));   // (on the floor, in sight: the burst strikes at once, and nothing strikes through a wall: build 2026-11-06i)
            const e = __wear('embercowl', 'storm_heart', c[0], c[1]), t = __ant(c[0] + 2, c[1]), n = __ant(c[0] + 3, c[1]), far = __ant(c[0] + 5, c[1]), o = {}; const hp = () => [t.health, n.health, far.health];
            for (let i = 0; i < 5; i++) applyDamage(t, 10, e); const b5 = hp(); o.fifth = n.health === 5000; applyDamage(t, 10, e); const a6 = hp(); o.sixth = [b5[1] - a6[1] > 0, b5[2] - a6[2], __said('NOVA')];
            o.burst = Math.round((b5[1] - a6[1]) * 10) / 10; o.sp = e.stats.specialAttack; return o; })()`);
        same(r.fifth, true, 'a burst before the 6th hit'); same(r.sixth.join(), 'true,0,true', 'the burst (near, far, the word)'); ok(r.burst > 0 && r.burst <= r.sp * 0.6 + 0.01, 'the burst\'s damage: ' + r.burst + ' for a special attack of ' + r.sp);
    });
    check('CLEAVER ARM and CHAIN CONDUIT were cut (Build B, the owner, 2026-11-02): no card cleaves or chains, so a Brawler\'s and a Mage\'s hits strike their target alone', () => {
        const r = J(`(function(){ __fresh(); const b = __wear('quillstone', null, 0, 0), t = __ant(1, 0), n = __ant(1.6, 0.4); applyDamage(t, 20, b); return [!!EQUIP_CARDS.cleaver_arm, !!EQUIP_CARDS.chain_conduit, 5000 - n.health, __said('CLEAVE') || __said('CHAIN')]; })()`);
        same(r.join(), 'false,false,0,false', 'the cut cards, the one beside struck, the words');
    });
    check('DOUBLE CELL on a Technician (a flux one\'s FLUX MOVE): the card tick fills a second charge; the first use spends it (ready again at once), the second waits the whole cooldown; the charge is back one cooldown after it was spent', () => {
        const r = J(`(function(){ __fresh(); frame = 40000; const f = __wear('gooproxy', 'double_cell', 0, 0), o = {}; equipTick(true); o.spare = f._abSpare;
            const cd = TECH_AB.flux.cooldown; o.first = techCooldown(f, cd); o.second = techCooldown(f, cd); frame += cd - 10; equipTick(true); o.early = f._abSpare; frame += 20; equipTick(true); o.back = f._abSpare;
            const plain = __wear('gooproxy', null, 3, 0); o.plain = techCooldown(plain, cd); return o; })()`);
        same(r.spare, 1, 'no second charge'); same(r.first, 1, 'the first use waited'); ok(r.second > 100, 'the second use did not wait the cooldown: ' + r.second); same(r.early, 0, 'the charge came back early'); same(r.back, 1, 'the charge did not come back'); ok(r.plain > 100, 'a technician without it');
    });

    group('THE NEW PRECISION KINDS');
    check('ATTUNED CORE on an Elemental sets its own element\'s status, the one Pack 1\'s Precision card of that element sets (a fire one: BURN, an ice one: SLOWED)', () => {
        const r = J(`(function(){ __fresh(); const keep = Math.random; Math.random = () => 0; try { const fe = __wear('embercowl', 'attuned_core', 0, 0), t = __ant(1, 0); applyDamage(t, 10, fe); const fire = [t.burning > 0 || !!t.burnTimer || __said('BURN'), __said('BURN')];
                floatingTexts.length = 0; const ie = __wear('igloo', 'attuned_core', 0, 4), t2 = __ant(1, 4); applyDamage(t2, 10, ie); return { el: [fe.element, ie.element], fire, ice: [t2.slowed > 0, __said('SLOWED')] }; } finally { Math.random = keep; } })()`);
        same(r.el.join(), 'fire,ice', 'fixture: the elements'); same(r.fire[1], true, 'the fire one did not burn'); same(r.ice.join(), 'true,true', 'the ice one did not slow');
    });
    check('a card of two stats (HUNTER OPTICS, on a Drone) adds both, and its words name both', () => {
        const r = J(`(function(){ __fresh(); const d = __wear('staticorb', 'hunter_optics', 0, 0); return [equipBonus(d, 'damage'), equipBonus(d, 'attackSpeed'), EQUIP_CARDS.hunter_optics.text]; })()`);
        same(r[0] + '|' + r[1], '0.1|0.1', 'its two bonuses'); ok(/DAMAGE DEALT/.test(r[2]) && /ATTACK SPEED/.test(r[2]), 'its words: ' + r[2]);
    });

    group('THE PAGE');
    check('the hooks are where the game makes the numbers: applyDamage asks equipOnHurt for a follower hit, techCooldown asks equipChargeSpend, the card tick runs the abilities', () => {
        ok(/equipOnHurt\(target, dmg, source\)/.test(rd('js/helpers.js')), 'applyDamage'); ok(/equipChargeSpend\(f, cd\)/.test(rd('js/techabilities.js')), 'techCooldown'); ok(/_equipAbilityTick\(f\)/.test(rd('js/cards.js')), 'the tick');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
