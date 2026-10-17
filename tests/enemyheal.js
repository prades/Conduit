// NO STARTING PYLONS, AND THE ENEMY HEALS AT ITS NESTS ONLY (js/world.js, js/helpers.js findNearestHealingNest / enemyNearHealingNest,
// js/predator.js retreat, the healing pass in js/game.js).
//
// REPORTED: "Get rid of the pylons that spawn at the beginning and make it to where the enemies heal from the nests only."
// The world used to scatter pylons over the ground, a mix of yours and the enemy's, and the enemy's healed it.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const sb = makeBrowserSandbox({});
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) {}
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id)); ensureWorldTo(4 * ZONE_LENGTH); player.x = 20; player.y = 2; gameState.phase = 'day';`);

    check('THE ASK: the world starts with NO pylons on the ground, neither yours nor the enemy\'s', () => {
        same(run('world.filter(t => t.pillar).length'), 0, 'pylons at the start');
        ok(run('world.length') > 100, 'fixture: the world did not generate');
    });
    check('the nests are still there', () => { ok(run('world.filter(t => t.nest).length') >= 3, 'no nests'); });

    // A wounded enemy beside a thing: a live nest, or an enemy pylon (taken from you), with nobody else about.
    const wounded = (where) => run(`(function(){ actors = actors.filter(a => !(a instanceof Predator) && !a.isFollower); followers.length = 0; frame += 3 - (frame % 3);
        render(); _cacheAge = -999;
        const S = SPECIES.ant, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 0, 0); p.team = 'red'; p.maxHealth = 1000; p.health = 100; p.update = () => {};
        ${where}
        actors.push(p); globalThis.__p = p; return 1; })()`);
    const heal = n => run(`(function(){ for (let i = 0; i < ${n}; i++) { frame++; __p.health = __p.health; render(); } return __p.health; })()`);

    check('THE ASK: an enemy standing at a live nest heals', () => {
        wounded(`const n = world.find(t => t.nest && t.nestZone >= 1 && t.nestHealth > 0); p.x = n.x; p.y = n.y + 1;`);
        const h = heal(60); ok(h > 100, 'it did not heal at its nest: ' + h);
    });
    check('and an enemy at a nest with no health left does not', () => {
        wounded(`const n = world.find(t => t.nest && t.nestZone >= 2 && t.nestHealth > 0); n._keep = n.nestHealth; n.nestHealth = 0; p.x = n.x; p.y = n.y + 1; globalThis.__n = n;`);
        const h = heal(60); run(`__n.nestHealth = __n._keep;`);
        ok(h <= 100, 'it healed at a dead nest: ' + h);
    });
    check('THE ASK: an enemy pylon heals nobody (one it took from you, standing right beside it)', () => {
        wounded(`const t = world.find(t => t.type === 'floor' && t.y === 3 && t.x >= 30 && !t.nest); t.pillar = true; t.pillarTeam = 'red'; t.destroyed = false; t.health = 20; _cacheAge = -9999; p.x = t.x; p.y = t.y;`);
        const h = heal(90); ok(h <= 100, 'it healed at a pylon: ' + h);
    });
    check('a retreating predator runs for the nearest NEST, not a pylon', () => {
        wounded(`const n = world.find(t => t.nest && t.nestZone >= 1 && t.nestHealth > 0), pl = world.find(t => t.type === 'floor' && t.y === 3 && t.x > n.x + 2 && !t.nest);
            pl.pillar = true; pl.pillarTeam = 'red'; pl.destroyed = false; _cacheAge = -9999; p.x = n.x + 6; p.y = 2; p.update = Predator.prototype.update; p.state = 'retreat'; p.isRetreating = true; globalThis.__n = n; globalThis.__pl = pl; globalThis.__d0 = Math.hypot(p.x - n.x, p.y - n.y);`);
        const r = run(`(function(){ for (let i = 0; i < 40; i++) { p0 = __p; __p.update(); } return { d: Math.hypot(__p.x - __n.x, __p.y - __n.y), d0: __d0 }; })()`);
        ok(r.d < r.d0 - 0.3, 'it did not move toward the nest: ' + JSON.stringify(r));
    });
    check('your own pylons still heal your own units (only the enemy changed)', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator) && !a.isFollower); followers.length = 0; frame += 3 - (frame % 3);
            const t = world.find(t => t.type === 'floor' && t.y === 3 && t.x >= 30 && !t.nest); t.pillar = true; t.pillarTeam = 'green'; t.destroyed = false; t.health = 20; _cacheAge = -9999;
            spawnFollowerAtCrystal('core'); const f = followers[0]; f.x = t.x; f.y = t.y; f.health = 10; f.maxHealth = 100; f.returningToCrystal = false;
            for (let i = 0; i < 90; i++) { frame++; f.x = t.x; f.y = t.y; render(); } const h = f.health; t.pillar = false; return h; })()`);
        ok(r > 10, 'a follower beside its own pylon did not heal: ' + r);
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
