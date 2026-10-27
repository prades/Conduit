// THE MUTATOR'S HEALING SERUM AND ITS LABORATORY (docs/MUTATOR.md 2.6; js/serum.js, js/stations.js, js/inventory.js, js/mutator.js, js/game.js, js/facilitysave.js).
// ASKED (the brief): "The Mutator can craft healing serums that are splashed onto the ground. Each serum creates an area-of-effect healing zone. Eligible allies within the splash zone receive healing.
// Healing should be visually readable and clearly communicate which units are being affected." "The Mutator has a laboratory where serum becomes available over time. Serum replenishes at configurable
// 60-second intervals. Higher Mutator levels increase the amount of serum generated automatically. DNA can also be spent whenever the player crafts a serum. The automatic supply and DNA crafting systems
// should work together." Test: "serum healing in an area".
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
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; _fp.items = _fp.items.filter(i => !(i.fp === 'prop' && i.kind === 'sentry'));
        globalThis.__clear = (cls) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; respawnQueue.length = 0; floatingTexts.length = 0;
            mutatorReset(); specimenReset(); serumReset(); invReset(); playerClassKey = null; classPerks = new Set(); weaponReset(); if (cls) classSet(cls); player.x = player.targetX = player.visualX = crystal.x - 2; player.y = player.targetY = player.visualY = crystal.y + 5; player.fpPath = null; };
        globalThis.__fol = (el, type, dx, dy) => { spawnFollowerAtCrystal(el, type); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.x = player.x + (dx || 0); f.y = player.y + (dy || 0); f.stance = 'hold'; f.job = { type: 'move', target: { x: f.x, y: f.y } }; f.attackCooldown = 1e6; return f; };
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };`);

    group('THE SERUM: SPLASHED ON THE GROUND, A POOL THAT HEALS THE ALLIES IN IT');
    check('it is an item of the pack (the Mutator\'s to use; anyone may carry it); another class cannot use it', () => {
        const r = J(`(function(){ __clear('gunslinger'); const d = ITEMS.healing_serum; const put = invAdd('healing_serum', 2); const use = invUse('healing_serum'); return { item: !!d, classes: d.classes, put, used: use.ok, left: invCount('healing_serum'), zones: serumZones.length }; })()`);
        same(r.item, true, 'no item'); same(JSON.stringify(r.classes), '["mutator"]', 'its class'); same(r.put, 2, 'another class cannot carry it'); same(r.used, false, 'a Gunslinger used it'); same(r.left, 2, 'it was used up anyway'); same(r.zones, 0, 'a pool was made');
    });
    check('SERUM HEALING IN AN AREA (the brief\'s test): used, it makes a pool where the Mutator stands; every ally in it (a follower, a clone) is healed SERUM.splash.pct of its health every SERUM.splash.every frames, with a green "+n"; one outside it and a creature in it are not; the pool goes after SERUM.splash.frames', () => {
        const r = J(`(function(){ __clear('mutator'); dnaApply({ ant_scout: 9 }); shardCount = 999; executeClone(getCloneOptions().find(o => o.key === 'ant_scout')); const c = mutatorClone(); c.x = player.x + 1; c.y = player.y; c.update = c.update;
            const inF = __fol('fire', 'brawler', -1, 0.5), outF = __fol('core', 'brawler', 6, 0); inF.moveSpeed = outF.moveSpeed = 0; const e = spawnCreature({ species: 'ant', className: 'tank', level: 4, x: player.x + 0.5, y: player.y - 1, state: 'wander' }); e.update = () => {};
            __frames(3); for (const u of [c, inF, outF]) u.health = u.maxHealth * 0.3; e.health = e.maxHealth * 0.3; const h0 = [c.health, inF.health, outF.health, e.health]; invAdd('healing_serum', 1); floatingTexts.length = 0; const used = invUse('healing_serum');
            const z = serumZones[0]; __frames(SERUM.splash.every * 3 + 2); const h1 = [c.health, inF.health, outF.health, e.health]; const plus = floatingTexts.filter(t => t.world && /^\\+\\d+/.test(t.text)).length; const zone = !!z && Math.hypot(z.x - player.x, z.y - player.y) < 0.01;
            __frames(SERUM.splash.frames); return { used: used.ok, zone, healed: [h1[0] - h0[0], h1[1] - h0[1]], max: [c.maxHealth, inF.maxHealth], outside: h1[2] - h0[2], creature: h1[3] - h0[3], plus, gone: serumZones.length, pct: SERUM.splash.pct, every: SERUM.splash.every }; })()`);
        same(r.used, true, 'the serum was not used'); same(r.zone, true, 'the pool is not where the Mutator stands');
        for (let k = 0; k < 2; k++) { const ticks = r.healed[k] / (r.max[k] * r.pct); ok(ticks > 2.5 && ticks < 4.6, ['the clone', 'the follower'][k] + ' was healed ' + ticks.toFixed(2) + ' ticks\' worth'); }
        same(r.outside, 0, 'a follower outside the pool was healed'); ok(r.creature <= 0, 'a creature in the pool was healed: ' + r.creature); ok(r.plus >= 4, 'green numbers: ' + r.plus); same(r.gone, 0, 'the pool did not go');
    });
    check('it can be read: the pool is painted on the floor tiles it covers, and every ally it is healing wears a green ring', () => {
        const r = J(`(function(){ __clear('mutator'); const f = __fol('fire', 'brawler', 0.5, 0); f.health = f.maxHealth * 0.5; serumSplash(player.x, player.y); __frames(2); let painted = 0, err = null; const keep = ctx.arc; ctx.arc = function () { painted++; return keep.apply(this, arguments); };
            try { drawSerumOnTile(Math.round(player.x), Math.round(player.y), 400, 300); const p0 = painted; drawSerumOnTile(Math.round(player.x) + 9, Math.round(player.y), 400, 300); const far = painted - p0; painted = p0; drawSerumOverlay(); return { tile: p0 > 0, far, ring: painted > p0, marked: f._serumAt === frame || frame - f._serumAt <= SERUM.splash.every + 2 }; } catch (e) { return { err: e.message }; } finally { ctx.arc = keep; } })()`);
        ok(!r.err, 'drawing threw: ' + r.err); same(r.tile, true, 'the pool was not painted on its tile'); same(r.far, 0, 'it was painted on a tile it does not cover'); same(r.ring, true, 'no ring under the ally'); same(r.marked, true, 'the ally was not marked as healed');
        ok(/drawSerumOnTile\(obj\.x, obj\.y, px, py\)/.test(rd('js/game.js')) && /drawSerumOverlay\(\)/.test(rd('js/game.js')), 'game.js does not draw the pool or the rings');
    });

    group('THE LABORATORY: SERUM OVER TIME, MORE AT A HIGHER MUTATOR LEVEL, AND CRAFTED FOR DNA');
    check('as a Mutator, every SERUM.lab.every frames (60 s) the laboratory makes SERUM.lab.base serum, up to SERUM.lab.cap waiting; for any other class it makes none', () => {
        const r = J(`(function(){ __clear('gunslinger'); __frames(SERUM.lab.every + 5); const other = serumLab.stock; __clear('mutator'); serumLab.nextAt = frame + SERUM.lab.every; const s = []; for (let k = 0; k < 7; k++) { __frames(SERUM.lab.every); s.push(serumLab.stock); }
            return { other, s, every: SERUM.lab.every, cap: SERUM.lab.cap, base: SERUM.lab.base }; })()`);
        same(r.every, 3600, 'the round is 60 seconds'); same(r.other, 0, 'another class\'s lab made serum'); same(r.s[0], r.base, 'after one round'); same(r.s[1], 2 * r.base, 'after two'); same(r.s[r.s.length - 1], r.cap, 'it does not stop at the cap');
    });
    check('HIGHER MUTATOR LEVELS MAKE MORE: the yield is base + perLevel × (level − 1), its fractions carried to the next round', () => {
        const r = J(`(function(){ __clear('mutator'); const y1 = serumLabYield(1), y5 = serumLabYield(5), y9 = serumLabYield(9); mutatorXp = MUTATOR.level.thresholds[4]; serumLab.stock = 0; serumLab.frac = 0; serumLab.nextAt = frame + 1; const got = []; for (let k = 0; k < 2; k++) { __frames(k ? SERUM.lab.every : 2); got.push(serumLab.stock); }
            return { y1, y5, y9, lv: mutatorLevel(), got, base: SERUM.lab.base, per: SERUM.lab.perLevel }; })()`);
        same(r.y1, r.base, 'level 1'); same(r.y5, r.base + 4 * r.per, 'level 5'); ok(r.y9 > r.y5 && r.y5 > r.y1, 'the yields do not rise: ' + [r.y1, r.y5, r.y9]); same(r.lv, 5, 'fixture: the level');
        same(r.got.join(), [Math.floor(r.y5), Math.floor(2 * r.y5)].join(), 'what two rounds made at level 5');
    });
    check('the SERUM HOOD (the Experiment Lab\'s fume hood, the Mutator\'s station): COLLECT takes what is waiting into the pack (no DNA); with none waiting CRAFT makes one for SERUM.craft.dna DNA; without the DNA it says why and when the next is ready', () => {
        const r = J(`(function(){ __clear('mutator'); const s = _fp.stations.find(x => x.kind === 'serum_hood'); const o = { st: !!s, room: s && s.room, prop: s && s.prop, classes: STATION_KINDS.serum_hood.classes };
            player.x = player.visualX = s.bb[0] - 1; player.y = player.visualY = (s.bb[1] + s.bb[3]) / 2; const near = stationDist(s);
            serumLab.stock = 3; dnaApply({ beetle_scout: 7 }); o.verb1 = STATION_KINDS.serum_hood.verbFn(); stationUse(s); o.collect = [invCount('healing_serum'), serumLab.stock, dnaTotal()];
            o.verb2 = STATION_KINDS.serum_hood.verbFn(); stationUse(s); o.craft = [invCount('healing_serum'), dnaTotal()]; o.why = stationCan(s).why; o.near = near; return o; })()`);
        same(r.st, true, 'no serum hood'); same(r.room, 'experiment_lab', 'its room'); same(r.prop, 'lab_hood', 'its prop'); same(JSON.stringify(r.classes), '["mutator"]', 'its class');
        ok(/COLLECT 3 SERUMS/.test(r.verb1), 'the verb with serum waiting: ' + r.verb1); same(r.collect.join(), '3,0,7', 'COLLECT took DNA or left serum'); ok(/CRAFT A SERUM/.test(r.verb2), 'the verb with none waiting: ' + r.verb2);
        same(r.craft.join(), '4,2', 'CRAFT: one more serum for five DNA'); ok(/CRAFTING TAKES \d+ DNA, YOU HAVE 2/.test(r.why) && /NEXT IN \d+ S/.test(r.why), 'without the DNA: ' + r.why);
    });
    check('THEY WORK TOGETHER: the lab\'s free serum and the crafted ones fill the same pack, and crafting always costs DNA (the free supply does not make it free)', () => {
        const r = J(`(function(){ __clear('mutator'); const s = _fp.stations.find(x => x.kind === 'serum_hood'); player.x = player.visualX = s.bb[0] - 1; player.y = player.visualY = (s.bb[1] + s.bb[3]) / 2; dnaApply({ beetle_scout: 20 }); serumLab.stock = 1;
            stationUse(s); const a = [invCount('healing_serum'), dnaTotal()]; stationUse(s); const b = [invCount('healing_serum'), dnaTotal()]; return { a, b, cost: SERUM.craft.dna }; })()`);
        same(r.a.join(), '1,20', 'the free serum cost DNA'); same(r.b.join(), '2,' + (20 - r.cost), 'the crafted serum did not cost DNA');
    });

    group('THE MUTATOR\'S LEVEL: EXPERIMENTS RAISE IT');
    check('every DNA spent on biology is a point (growing a clone, an upgrade, crafting a serum); the thresholds make the levels; a level-up is said; another class gains none', () => {
        const r = J(`(function(){ __clear('mutator'); dnaApply({ ant_scout: 99, beetle_scout: 40 }); shardCount = 999; const x0 = mutatorXp; executeClone(getCloneOptions().find(o => o.key === 'ant_scout')); const grow = mutatorXp - x0;
            cloneUpgradeBuy('armor'); const up = mutatorXp - x0 - grow; const s = _fp.stations.find(x => x.kind === 'serum_hood'); player.x = player.visualX = s.bb[0] - 1; player.y = player.visualY = (s.bb[1] + s.bb[3]) / 2; floatingTexts.length = 0; stationUse(s); const craft = mutatorXp - x0 - grow - up;
            const said = floatingTexts.map(t => t.text).join('|'); const lv = mutatorLevel(); __clear('gunslinger'); mutatorGainXp(50); return { grow, up, craft, lv, said, other: mutatorXp, needed: CLONE_COSTS.ant.splicesNeeded, upCost: CLONE_UPGRADES.armor.cost[0], craftCost: SERUM.craft.dna, t: MUTATOR.level.thresholds }; })()`);
        same(r.grow, r.needed, 'growing a clone'); same(r.up, r.upCost, 'an upgrade'); same(r.craft, r.craftCost, 'crafting a serum'); same(r.lv, 2, 'the level after ' + (r.grow + r.up + r.craft) + ' points (thresholds ' + r.t.slice(0, 3) + ')');
        ok(/MUTATOR ▲ LEVEL 2/.test(r.said), 'the level-up was not said: ' + r.said); same(r.other, 0, 'another class gained points');
    });

    group('USING IT IN A FIGHT, AND THE SAVE');
    check('the SERUM pill beside the weapon\'s: the Mutator\'s, with how many it has; a tap splashes one; another class has none', () => {
        const r = J(`(function(){ __clear('mutator'); invAdd('healing_serum', 2); drawSerumChip(100, 100, 1); const c = Object.assign({}, _SERUMCHIP); const tap = serumChipTap(c.x + 5, c.y + 5); const o = { w: c.w > 30, tap, left: invCount('healing_serum'), zones: serumZones.length };
            __clear('gunslinger'); drawSerumChip(100, 100, 1); o.other = _SERUMCHIP.w; return o; })()`);
        same(r.w, true, 'no pill'); same(r.tap, true, 'the tap was not the pill\'s'); same(r.left, 1, 'no serum was used'); same(r.zones, 1, 'no pool'); same(r.other, 0, 'a Gunslinger has the pill');
        ok(/serumChipTap\(upX, upY\)/.test(rd('js/input.js')) && /drawSerumChip\(/.test(rd('js/targeting.js')), 'the pill is not wired');
    });
    check('the save keeps the lab (what it holds, how far through its round), the Mutator\'s points, and the serums in the pack', () => {
        const r = J(`(function(){ __clear('mutator'); invAdd('healing_serum', 3); serumLab.stock = 2; serumLab.frac = 0.5; serumLab.nextAt = frame + 1000; mutatorXp = 33; const d = JSON.parse(JSON.stringify(facilitySaveCollect()));
            serumReset(); mutatorXp = 0; invReset(); playerInv = d.inv; serumApply(d.serum); mutatorXp = d.mxp; return { stock: serumLab.stock, frac: serumLab.frac, left: serumLab.nextAt - frame, xp: mutatorXp, pack: invCount('healing_serum') }; })()`);
        same(r.stock, 2, 'the lab\'s serum'); same(r.frac, 0.5, 'the carried fraction'); ok(Math.abs(r.left - 1000) <= 2, 'the round: ' + r.left); same(r.xp, 33, 'the points'); same(r.pack, 3, 'the serums in the pack');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
