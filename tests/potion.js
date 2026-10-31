// THE SLEEPING POTION (js/potion.js; docs/SEWER-QUEST.md, "Side Quest and the Sleeping Potion")
// ASKED (the archive, 2026-10-31): a dedicated item; "equipped and activated through a universal equipped-item trigger/button available to every class"; the serum's floor-throw as the model; "puts all eligible characters in
// the area to sleep, including the player's followers, but never the player character"; the crafted version "targets enemies only"; "throwing the sleeping potion can interrupt any attack [...] prevent the interrupted attack
// from dealing delayed damage after cancellation"; ◆100 from Side Quest, ◆50 the next once it has been used on the sewer boss, ◆100 for a lost one; the lab's copy at ◆100 with "one-fourth the effectiveness"; saves.
//   THE ITEMS      two rows of the pack, tools whose button EQUIPS; one kind in hand at a time; put away; gone from the pack, not in hand
//   THE THROW      the pill and the key for every class; it flies and lands at your feet, or on the creature your dial has locked within reach; it is taken from the pack
//   THE SLEEP      a creature within the radius sleeps for the sleep's length and does nothing (no step, no bite); a bite it was winding up is cancelled and never lands; an ability winding up is cancelled; it wakes after;
//                  the ORIGINAL sleeps your followers too, never you; the COPY sleeps enemies only, for a quarter of the time
//   THE ECONOMY    ◆100; too poor; one at a time; ◆50 once a boss has been put to sleep, spent by that purchase; ◆100 again; the lab's copy at the bench for ◆100 with the original kept, two at most
//   THE SAVE       the potion in hand and the discount owed come back; a potion no longer in the pack is not in hand
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
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; crystal.health = crystal.maxHealth = 1e7; canvas.width = 1280; canvas.height = 860; innerWidth = 1100; health = 1e6;
        _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; classPickerOpen = false; playerClassKey = 'gunslinger';
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__clearSquad = () => { actors = actors.filter(a => !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); };
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); floatingTexts.length = 0; invReset(); playerClassKey = 'gunslinger'; _fp.potion = null; potionFlights = []; potionSplashes = []; health = 1e6; player.invuln = 0; player.poisonUntil = 0; targetDrop(); };
        globalThis.__tick = (n) => { for (let i = 0; i < n; i++) { frame++; if (player.invuln > 0) player.invuln--; techAbilityTick(); facilityTutorialTick(); for (const a of actors.slice()) if (!a.dead) updateNPC(a); updateStatusEffects(); actors = actors.filter(a => !a.dead || a.isFollower); } };   // (the whole facility tick; the hit grace runs down as js/game.js runs it)
        // a creature of the arena's kinds near the player, on floor, wandering: species, class, where (an offset from the player)
        globalThis.__creature = (sp, cls, dx, dy) => { const p = spawnCreature({ species: sp, className: cls, x: player.x + dx, y: player.y + dy, level: 3, state: 'wander' }); p.fpCreature = true; p.homeRoom = partyRoomAt(p.x, p.y) || 'arena'; p.spawnProtection = 0; p.health = p.maxHealth = 1e6; return p; };
        globalThis.__fresh = (els) => { __clearSquad(); els.forEach((el, i) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.health = f.maxHealth = 400; f.currentWill = 1e5; f.x = player.x - 1 - 0.3 * i; f.y = player.y + (i ? 0.3 : 0); }); partyTick(); return followers.slice(); };
        globalThis.__st = (id) => _fp.stations.find(s => s.id === id);
        globalThis.__near = (s) => { const g = _stApproach(s) || [s.x, s.y + 1.5]; __put(g[0], g[1]); return stationDist(s) <= STATION_RANGE; };
        globalThis.__reload = (sv) => { const F = _fp.F; actors = actors.filter(a => !(a instanceof Predator)); facilityTutorialStart(F); invReset(); facilitySaveApply(sv); _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; };
        // open floor in the arena for the fights (the arena's spawner's cells)
        globalThis.__open = () => { const cells = _fsArenaCells(); let best = null, bs = -1; for (const c of cells) { let d = 99; for (const s of _fp.F.solids) if (s.room === 'arena' && s.bb) d = Math.min(d, Math.hypot(Math.max(s.bb[0] - c[0], 0, c[0] - s.bb[2]), Math.max(s.bb[1] - c[1], 0, c[1] - s.bb[3]))); if (d > bs) { bs = d; best = c; } } return best; };`);

    group('THE ITEMS AND THE EQUIP (js/inventory.js, js/potion.js)');
    check('two rows of the pack (the original: one at a time; the copy: two), tools with the potion icon and no class rule; the pack\'s button EQUIPS (verb) and puts away; one kind in hand at a time; gone from the pack, nothing is in hand', () => {
        const r = J(`(function(){ const o = {}; __clear(); const a = ITEMS.sleeping_potion, c = ITEMS.sleeping_potion_copy; o.rows = [a.type, a.stack, String(a.classes), a.icon, !!INV_ICONS[a.icon], c.type, c.stack, ITEM_ORDER.includes('sleeping_potion') && ITEM_ORDER.includes('sleeping_potion_copy'), a.stats.length, /SIDE QUEST/.test(a.stats.join('|')), /QUARTER/.test(c.stats.join('|'))];
            o.none = [potionEquipped(), a.verb(a), potionUse('sleeping_potion').why]; invAdd('sleeping_potion', 1); invAdd('sleeping_potion_copy', 2); o.held = [invCount('sleeping_potion'), invCount('sleeping_potion_copy'), invAdd('sleeping_potion', 1)];
            const u = invUse('sleeping_potion'); o.equip = [u.ok, u.msg, potionEquipped(), a.verb(a), c.verb(c), invCount('sleeping_potion')]; const u2 = invUse('sleeping_potion_copy'); o.swap = [u2.ok, potionEquipped(), a.verb(a), c.verb(c)];
            const u3 = invUse('sleeping_potion_copy'); o.away = [u3.ok, u3.msg, potionEquipped()]; potionEquip('sleeping_potion'); invRemove('sleeping_potion', 1); o.gone = potionEquipped(); return o; })()`);
        same(r.rows.join('|'), 'tool|1|null|potion|true|tool|2|true|4|true|true', 'the rows'); same(r.none.join('|'), '|EQUIP|NONE IN THE PACK', 'nothing in the pack'); same(r.held.join(), '1,2,0', 'held (the original one at a time)');
        same(r.equip.join('|'), 'true|SLEEPING POTION EQUIPPED — THE POTION PILL, OR T, THROWS IT|sleeping_potion|UNEQUIP|EQUIP|1', 'the equip (a tool: the pack keeps it)'); same(r.swap.join('|'), 'true|sleeping_potion_copy|EQUIP|UNEQUIP', 'one kind in hand at a time');
        same(r.away.join('|'), 'true|COPIED POTION PUT AWAY|', 'put away'); same(r.gone, null, 'gone from the pack, still in hand');
    });
    check('the universal trigger: the POTION pill beside the ammunition for any class (not a Mutator) while a potion is in hand, a tap on it throws; the key T is bound; wired in js/input.js and js/targeting.js', () => {
        const r = J(`(function(){ const o = {}; __clear(); playerClassKey = 'technomancer'; o.bare = [drawPotionChip(100, 100, 1), _POTIONCHIP.w]; invAdd('sleeping_potion', 1); potionEquip('sleeping_potion'); const w = drawPotionChip(100, 100, 1); const c = Object.assign({}, _POTIONCHIP); o.pill = [w > 30, c.w > 30, potionChipTap(c.x + 5, c.y + 5), invCount('sleeping_potion'), potionFlights.length, potionChipTap(c.x - 50, c.y)];
            potionFlights = []; o.key = POTION.key; return o; })()`);
        same(r.bare.join(), '0,0', 'a pill with nothing in hand'); same(r.pill.join(), 'true,true,true,0,1,false', 'the pill and its tap'); same(r.key, 't', 'the key');
        ok(/potionChipTap\(upX, upY\)/.test(rd('js/input.js')) && /drawPotionChip\(/.test(rd('js/targeting.js')) && /e\.key === POTION\.key/.test(rd('js/potion.js')), 'the pill or the key is not wired');
    });

    group('THE THROW AND THE SLEEP (js/potion.js potionThrow, potionSplash; js/combat.js applySleep)');
    check('thrown with nothing locked it lands at your feet after its flight and is taken from the pack; a creature within the radius SLEEPS for the sleep\'s length: it takes no step and bites nothing, then wakes; a locked creature within reach is where it lands; one beyond reach is not', () => {
        const r = J(`(function(){ const o = {}; __clear(); const c = __open(); __put(c[0], c[1]); const a = __creature('ant', 'tank', 2, 0); const ax = a.x, ay = a.y; invAdd('sleeping_potion', 1); potionEquip('sleeping_potion');
            const t = potionThrow(); o.throw = [t.ok, t.id, t.at[0] === player.x && t.at[1] === player.y, invCount('sleeping_potion'), potionEquipped(), potionFlights.length]; __tick(POTION.flight - 2); o.inAir = [potionFlights.length, a.asleep > 0]; __tick(3); o.landed = [potionFlights.length, a.asleep >= POTION.sleep - 3, a.stunned === a.asleep, bossControlled(a), potionSplashes.length];
            a.provoked = true; a.currentTarget = player; a.state = 'attack'; a.attackCooldown = 0; const h0 = health, ax2 = a.x, ay2 = a.y; let moved = 0, bit = 0; for (let i = 0; i < POTION.sleep - 10; i++) { __tick(1); if (Math.hypot(a.x - ax2, a.y - ay2) > 0.05) moved++; if (health < h0) bit++; } o.slept = [moved, bit, a.asleep > 0, a.attackWindup, Math.hypot(a.x - ax, a.y - ay) < 3];
            __tick(20); o.woke = [a.asleep, a.stunned, a.dead];
            __clear(); __put(c[0], c[1]); const b = __creature('beetle', 'tank', 3, 0); invAdd('sleeping_potion', 1); potionEquip('sleeping_potion'); o.lock = targetSet(b, true); const t2 = potionThrow(); o.atLocked = [Math.abs(t2.at[0] - b.x) < 0.01, Math.abs(t2.at[1] - b.y) < 0.01]; __tick(POTION.flight + 2); o.lockedSleeps = b.asleep > 0; targetDrop();
            __clear(); __put(c[0], c[1]); const d = __creature('beetle', 'tank', POTION.reach + 2, 0); invAdd('sleeping_potion', 1); potionEquip('sleeping_potion'); targetSet(d, true); const t3 = potionThrow(); o.tooFar = [t3.at[0] === player.x, Math.hypot(d.x - player.x, d.y - player.y) > POTION.radius]; __tick(POTION.flight + 2); o.farAwake = !(d.asleep > 0); targetDrop(); return o; })()`);
        same(r.throw.join(), 'true,sleeping_potion,true,0,,1', 'the throw'); same(r.inAir.join(), '1,false', 'in the air'); same(r.landed.join(), '0,true,true,true,1', 'the landing');
        same(r.slept.join(), '0,0,true,0,true', 'asleep: it moved or bit'); same(r.woke.join(), '0,0,false', 'it did not wake'); same(r.lock && r.atLocked.join(), 'true,true', 'the toss did not reach the locked creature'); same(r.lockedSleeps, true, 'the locked creature did not sleep');
        same(r.tooFar.join(), 'true,true', 'a creature beyond reach: the toss went to it'); same(r.farAwake, true, 'the far creature slept');
    });
    check('THE INTERRUPT: a bite being wound up at you is cancelled by the sleep and never lands (a creature left alone lands it); an ability winding up is cancelled; a sleeper hit does not wake (your followers can hold it)', () => {
        const r = J(`(function(){ const o = {}; __clear(); const c = __open(); __put(c[0], c[1]);
            const a = __creature('ant', 'tank', 0.6, 0); a.provoked = true; a.currentTarget = player; a.state = 'attack'; a.attackCooldown = 1; let n = 0; for (; n < 60 && !(a.attackWindup > 0); n++) __tick(1); o.winding = [a.attackWindup > 0, a.biteTarget === player, n < 60];
            const h0 = health; const slept = applySleep(a, 120); o.cancelled = [slept, a.attackWindup, a.biteTarget, a.attackCooldown >= 120]; __tick(COMBAT.bite.windup + 30); o.noBite = h0 - health;
            const b = __creature('ant', 'tank', -0.6, 0); b.provoked = true; b.currentTarget = player; b.state = 'attack'; b.attackCooldown = 1; player.invuln = 0; const h1 = health; for (n = 0; n < 120 && health === h1; n++) __tick(1); o.control = [h1 - health, n < 120];
            const s = __creature('scorpion', 'striker', 3, 0); s.abilityPhase = 'winding'; s.abilityTimer = 20; s.abilityCharge = 100; applySleep(s, 60); o.ability = [s.abilityPhase, s.abilityCharge, s.abilityTimer];
            applyDamage(a, 5, player); __tick(1); o.hitAsleep = [a.asleep > 0, a.stunned > 0]; o.player = applySleep(player, 60); return o; })()`);
        same(r.winding.join(), 'true,true,true', 'the creature did not wind up a bite'); same(r.cancelled.join(), 'true,0,,true', 'the wind-up was not cancelled'); same(r.noBite, 0, 'the cancelled bite landed'); same(r.control.join(), '1,true', 'the control: a bite left alone did not land');
        same(r.ability.join(), 'charging,0,0', 'the ability\'s wind-up'); same(r.hitAsleep.join(), 'true,true', 'a hit woke it'); same(r.player, false, 'the player can be put to sleep');
    });
    check('the ORIGINAL sleeps your followers within the radius too, never you; the COPY sleeps enemies only, for a quarter of the time; a bystander recruit is nobody\'s', () => {
        const r = J(`(function(){ const o = {}; __clear(); const c = __open(); __put(c[0], c[1]); const fs = __fresh(['fire']), f = fs[0]; f.x = player.x - 1.5; f.y = player.y; const a = __creature('ant', 'tank', 1.5, 0.5);
            potionSplash('sleeping_potion', player.x, player.y); o.orig = [a.asleep, f.asleep, f.stunned || 0, player.asleep || 0];
            __put(player.x + 6, player.y); __tick(1); const fx = f.x, fy = f.y; __tick(59); o.followerStill = [Math.hypot(f.x - fx, f.y - fy) < 0.05, f.asleep > 0]; __tick(POTION.sleep); o.followerMoves = [Math.hypot(f.x - fx, f.y - fy) > 0.5, f.asleep];
            __put(c[0], c[1]); f.x = player.x - 1.5; f.y = player.y; const b = __creature('beetle', 'tank', 1.5, 0); potionSplash('sleeping_potion_copy', player.x, player.y); o.copy = [b.asleep, f.asleep, Math.round(POTION.sleep * POTION.copyFactor)];
            const n = __creature('ant', 'scout', 0, 1.5); n.isNeutralRecruit = true; potionSplash('sleeping_potion', player.x, player.y); o.recruit = n.asleep || 0; return o; })()`);
        same(r.orig.join(), J('POTION.sleep') + ',' + J('POTION.sleep') + ',0,0', 'the original: the creature and the follower, not you'); same(r.followerStill.join(), 'true,true', 'the sleeping follower moved'); same(r.followerMoves.join(), 'true,0', 'the follower did not wake and follow');
        same(r.copy.join(), '75,0,75', 'the copy: enemies only, a quarter'); same(r.recruit, 0, 'a recruit was put to sleep');
    });

    group('THE ECONOMY (js/potion.js potionBuy, potionCopyUse; the bench, js/quests.js)');
    check('◆100 for the original; too poor is refused; one at a time; the next is ◆50 once a boss has been put to sleep by it, and that purchase spends the discount; ◆100 again; losing it changes no price', () => {
        const r = J(`(function(){ const o = {}; __clear(); shardCount = 50; o.poor = [potionPrice(), potionBuyCan().ok, potionBuyCan().why, potionBuy().ok, shardCount, invCount('sleeping_potion')];
            shardCount = 100; const b1 = potionBuy(); o.first = [b1.ok, b1.price, shardCount, invCount('sleeping_potion'), potionEquipped(), potionState().bought]; shardCount = 500; o.holding = potionBuy().why;
            const c = __open(); __put(c[0], c[1]); const q = __creature('ant', 'boss', 2, 0); q.bossId = 'test_boss'; potionSplash('sleeping_potion', player.x, player.y); invRemove('sleeping_potion', 1); o.afterBoss = [q.asleep > 0, potionState().discount, potionState().bossUses, potionPrice()];
            const b2 = potionBuy(); o.cheap = [b2.ok, b2.price, shardCount, /HALF/.test(b2.msg), potionState().discount, potionPrice()];
            invRemove('sleeping_potion', 1); o.lost = [potionEquipped(), potionPrice()]; const b3 = potionBuy(); o.again = [b3.price, shardCount];
            q.dead = true; actors = actors.filter(a => a !== q); const x = __creature('ant', 'tank', -2, 0); potionSplash('sleeping_potion', player.x, player.y); o.notBoss = [x.asleep > 0, potionState().discount, potionPrice()]; return o; })()`);
        same(r.poor.join('|'), '100|false|NEED ◆50 MORE FOR THE POTION (◆100)|false|50|0', 'too poor'); same(r.first.join('|'), 'true|100|0|1|sleeping_potion|1', 'the first (in hand at once)'); same(r.holding, 'YOU HAVE ONE · THROW IT BEFORE YOU BUY ANOTHER', 'one at a time');
        same(r.afterBoss.join(), 'true,true,1,50', 'a boss put to sleep: the discount'); same(r.cheap.join(), 'true,50,450,true,false,100', 'the ◆50 purchase'); same(r.lost.join(), ',100', 'a lost potion'); same(r.again.join(), '100,350', '◆100 again'); same(r.notBoss.join(), 'true,false,100', 'a creature that is no boss earned the discount');
    });
    check('the lab\'s copy at the ANALYSIS BENCH, once the module is bought: COPY THE SLEEPING POTION ◆100 with the original in the pack (refused without it, or too poor); the copy is added and the original kept; two copies at most; the bench\'s earlier verbs come first', () => {
        const r = J(`(function(){ const o = {}; __clear(); const Q = questState('purify'); Q.discoveredAt = 1; Q.turnedInAt = 1; Q.moduleAt = 0; const b = __st('st_analysis_bench'); o.near = __near(b); const V = () => STATION_KINDS.analysis_bench.verbFn(b), C = () => STATION_KINDS.analysis_bench.canFn(b);
            invAdd('sleeping_potion', 1); o.moduleFirst = V(); Q.moduleAt = 1; o.verb = V(); shardCount = 40; o.poor = C().why; shardCount = 240; o.can = C().ok; const r1 = stationUse(b); o.copy = [r1.ok, /COPIES/.test(r1.msg), shardCount, invCount('sleeping_potion'), invCount('sleeping_potion_copy'), potionState().copies];
            stationUse(b); o.two = [shardCount, invCount('sleeping_potion_copy')]; shardCount = 500; o.full = C().why; invRemove('sleeping_potion_copy', 2); invRemove('sleeping_potion', 1); o.without = [V(), C().why]; Q.turnedInAt = 0; Q.moduleAt = 0; Q.discoveredAt = 0; return o; })()`);
        same(r.near, true, 'not at the bench'); same(r.moduleFirst, 'BUY THE PURIFICATION MODULE ◆800', 'the module comes first'); same(r.verb, 'COPY THE SLEEPING POTION ◆100', 'the verb'); same(r.poor, 'NEED ◆60 MORE TO COPY THE POTION', 'too poor'); same(r.can, true, 'can');
        same(r.copy.join(), 'true,true,140,1,1,1', 'the copy'); same(r.two.join(), '40,2', 'the second copy'); same(r.full, 'YOUR PACK HOLDS NO MORE COPIES', 'a third'); same(r.without.join('|'), 'NOTHING MORE TO ANALYSE|THE MODULE IS BOUGHT · INSTALL IT IN THE SEWERS\' CISTERN', 'without the original');
    });

    group('THE SAVE (js/facilitysave.js)');
    check('the potion in hand, the count bought, the copies, the throws, the boss uses and the discount owed come back; a potion the pack no longer holds is not in hand; the save has 33 fields', () => {
        const r = J(`(function(){ const o = {}; __clear(); shardCount = 300; potionBuy(); invAdd('sleeping_potion_copy', 1); potionEquip('sleeping_potion_copy'); potionState().discount = true; potionState().bossUses = 2; potionState().thrown = 3;
            const sv = facilitySaveCollect(); o.saved = sv.potion; o.fields = Object.keys(sv).length; __reload(sv); o.back = [potionEquipped(), invCount('sleeping_potion'), invCount('sleeping_potion_copy'), potionState().bought, potionState().copies, potionState().thrown, potionState().bossUses, potionState().discount, potionPrice()];
            const sv2 = facilitySaveCollect(); delete sv2.inv.sleeping_potion_copy; __reload(sv2); o.notHeld = [potionEquipped(), invCount('sleeping_potion_copy'), potionState().discount]; return o; })()`);
        same(JSON.stringify(r.saved), JSON.stringify({ eq: 'sleeping_potion_copy', bought: 1, copies: 0, thrown: 3, boss: 2, disc: 1 }), 'the record'); same(r.fields, 33, 'the fields');
        same(r.back.join(), 'sleeping_potion_copy,1,1,1,0,3,2,true,50', 'the load'); same(r.notHeld.join(), ',0,true', 'a potion no longer in the pack');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
