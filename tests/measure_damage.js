// MEASURE DAMAGE: a measurement, not a test (it never fails). It prints, as JSON, what docs/NEXT-UPDATE.md Build A compares before and after the damage system
// (docs/COMBAT.md §7): each follower form's damage dealt in 15 s against a still creature of each race, each race's bite on a held follower of each subclass,
// and docs/COMBAT.md §1's audit fights. The game's randomness is seeded and each run starts from a clean slate (__clear), so the same code prints the same
// numbers, and a run's numbers do not depend on which runs came before it (`ant` alone gives the same ant rows as all six races).
//   node tests/measure_damage.js > before.json      (it is not in tests/run.js: run it by hand)
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; _fp.items = _fp.items.filter(i => !(i.fp === 'prop' && i.kind === 'sentry'));
        player.x = player.targetX = player.visualX = crystal.x - 3; player.y = player.targetY = player.visualY = crystal.y - 3; player.fpPath = null;
        globalThis.__seed = s => { let a = s >>> 0; Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
        // each run starts alike, whatever ran before it: no unit, no shot in flight, no burning ground, pool, frost or lasting effect, and the clock at 0 (as
        // js/facilityplay.js facilityResetState leaves it), since timers count from it (the ultimate's charge every 60 frames, the cards' tick) and effects
        // drawn on its beat take numbers from the seeded random draw
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; respawnQueue.length = 0; floatingTexts.length = 0;
            projectiles = []; followerProjectiles = []; elementEffects = []; fragments = []; smoke = []; shards = [];
            if (typeof fireBombs !== 'undefined') { fireBombs = []; fireTiles = new Map(); }
            if (typeof activeFireEruption !== 'undefined') activeFireEruption = null;
            if (typeof techReset === 'function') techReset();
            frame = 0; shake = 0; _fp.spawnAt = Infinity;   // (the screen's shake too, whose jitter draws random numbers; and the arena's spawner held off: a creature it sends would join the fight)
            _ucolsFrame = -1;   // (the units-by-column cache, js/helpers.js, is kept by frame and count: with the clock back at 0 it would hand the last run's units back)
            for (const a of actors) a.moveCooldown = 0;   // (the recruits waiting at their posts, far off, wander on their own clocks, and each step draws a random number)
            // nothing still pointing at the last run's creature (taken off the list, not killed): the player's lock (the auto-lock, js/targeting.js) would send the
            // follower at it, the order target and the enemy card likewise
            if (typeof gunStow === 'function') gunStow(); if (typeof commandEnemyTarget !== 'undefined') commandEnemyTarget = null; if (typeof _ixSubject !== 'undefined') _ixSubject = null;
            if (typeof selectedUnits !== 'undefined' && selectedUnits.clear) selectedUnits.clear(); };
        // a follower of a class, element, personality and level; evolved (its form) at level 10 and over
        globalThis.__fol = (el, type, pers, lv, dx, dy) => { spawnFollowerAtCrystal(el, type); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0;
            f.personality = pers; f.base = applyPersonality(pers); f.level = lv; if (lv >= EVOLVE_LEVEL) { const d = evolutionFor(f); if (d) f.evolved = d.id; } _applyFollowerLevel(f, true);
            f.x = crystal.x + 2 + (dx || 0); f.y = crystal.y + 2 + (dy || 0); return f; };
        globalThis.__cre = (sp, cl, lv, dx, dy) => { const p = spawnCreature({ species: sp, className: cl, level: lv, x: crystal.x + 2 + dx, y: crystal.y + 2 + (dy || 0), state: 'hunt' }); p.provoked = true; return p; };
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };`);

    const out = { followerDamage: [], biteDamage: [], fights: [] };
    const ELS = ['fire', 'toxic', 'electric', 'ice', 'flux', 'core'];
    const CLASSES = [['brawler', ['aggressive', 'wild'], 1], ['sniper', ['cautious', 'cunning'], 4], ['camper', ['stoic'], 1]];
    const ALL_RACES = ['ant', 'beetle', 'scorpion', 'spider', 'mantis', 'moth'];
    // `node tests/measure_damage.js ant` measures the followers against ants only (before the damage system a race changes nothing); with no argument, all six races
    const RACES = process.argv[2] ? process.argv[2].split(',') : ALL_RACES;
    // SECTIONS=bites (or followers, fights, a comma list) measures only those; each run stands alone, so a section measured by itself gives the numbers it gives in a whole run
    const SECTIONS = (process.env.SECTIONS || 'followers,bites,fights').split(',');
    const say = m => process.stderr.write(m + '\n'), t0 = Date.now();

    // 1. A follower's damage dealt in 900 frames (15 s) to a still creature of each race (the creature does not move or bite; its health is huge).
    if (SECTIONS.includes('followers')) for (const el of ELS) for (const [type, perss, dist] of CLASSES) for (const pers of perss) for (const race of RACES) {
        const r = J(`(function(){ __clear(); __seed(7); const f = __fol('${el}', '${type}', '${pers}', 10, 0, 0); const c = __cre('${race}', 'scout', 5, ${dist}, 0); c.update = () => {}; c.health = c.maxHealth = 1e6;
            __frames(900); return { form: f.evolved || null, atk: f.stats.attack, sp: f.stats.specialAttack, dealt: Math.round((1e6 - c.health) * 10) / 10 }; })()`);
        out.followerDamage.push(Object.assign({ element: el, type, personality: pers, race }, r));
    }
    say('followers measured, ' + Math.round((Date.now() - t0) / 1000) + ' s');

    // 2. Each race's bite (and its special, when it charges) on a held follower of each subclass: damage taken in 600 frames (10 s), the follower's health huge so the cap never binds.
    //    QUILLSTONE is a crustacean, FROST MAW elemental, STATIC ORB a drone, JELLY RAM a jelly, HAMMER SLUG a mollusk.
    const SUBJECTS = [['fire', 'brawler', 'aggressive'], ['ice', 'brawler', 'aggressive'], ['electric', 'brawler', 'aggressive'], ['core', 'brawler', 'aggressive'], ['core', 'camper', 'stoic']];
    if (SECTIONS.includes('bites')) for (const race of ALL_RACES) for (const [el, type, pers] of SUBJECTS) {
        // (held: no update, no swing, no will, and no signature move either: evolutionTick fires those apart from update, and one would kill the creature early)
        const r = J(`(function(){ __clear(); __seed(11); const f = __fol('${el}', '${type}', '${pers}', 10, 0, 0); f.update = () => {}; f.stance = 'hold'; f.attackCooldown = 1e6; f.currentWill = 0; f._sigCd = 1e9;
            f.maxHealth = f.health = 1e6; const c = __cre('${race}', 'striker', 5, 1, 0); __frames(600); return { form: f.evolved || null, taken: Math.round((1e6 - f.health) * 10) / 10 }; })()`);
        out.biteDamage.push(Object.assign({ race, element: el, type }, r));
    }
    say('bites measured, ' + Math.round((Date.now() - t0) / 1000) + ' s');

    // 3. The audit's fights (docs/COMBAT.md §1), both sides fighting: who falls, when, and the hits the follower took.
    const FIGHTS = [
        ['ant scout L3 vs fire brawler L5', 'ant', 'scout', 3, 'fire', 'brawler', 'aggressive', 5],
        ['mantis scout L3 vs wild brawler L5', 'mantis', 'scout', 3, 'ice', 'brawler', 'wild', 5],
        ['spider striker L4 vs electric mage L5', 'spider', 'striker', 4, 'electric', 'sniper', 'cunning', 5],
        ['scorpion striker L4 vs core brawler L9', 'scorpion', 'striker', 4, 'core', 'brawler', 'aggressive', 9],
        ['beetle scout L4 vs fire technician L10', 'beetle', 'scout', 4, 'fire', 'camper', 'stoic', 10],
        ['moth striker L4 vs flux mage L10', 'moth', 'striker', 4, 'flux', 'sniper', 'cautious', 10],
    ];
    if (SECTIONS.includes('fights')) for (const [name, sp, cl, clv, el, type, pers, flv] of FIGHTS) {
        const r = J(`(function(){ __clear(); __seed(3); const f = __fol('${el}', '${type}', '${pers}', ${flv}, 0, 0); const c = __cre('${sp}', '${cl}', ${clv}, ${type === 'sniper' ? 4 : 1.2}, 0);
            let hits = 0, last = f.health, n = 0; while (n < 1800 && !f.dead && !c.dead) { render(); n++; if (f.health < last - 0.01) hits++; last = f.health; }
            return { frames: n, followerFell: !!f.dead, creatureFell: !!c.dead, hitsTaken: hits, followerHealthLeft: Math.round(f.health), creatureHealthLeft: Math.round(Math.max(0, c.health)) }; })()`);
        out.fights.push(Object.assign({ name }, r));
    }

    // a summary: the mean damage each class dealt (over its personalities, elements and the six races), and each race's mean bite damage
    const mean = a => a.reduce((s, v) => s + v, 0) / (a.length || 1);
    out.summary = { followerMeanByClass: {}, biteMeanByRace: {} };
    for (const [type] of CLASSES) out.summary.followerMeanByClass[type] = Math.round(mean(out.followerDamage.filter(d => d.type === type).map(d => d.dealt)));
    for (const race of ALL_RACES) out.summary.biteMeanByRace[race] = Math.round(mean(out.biteDamage.filter(d => d.race === race).map(d => d.taken)) * 10) / 10;
    console.log(JSON.stringify(out, null, 1));
    process.exit(0);
})();
