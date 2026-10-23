// ELECTRIC WORKERS HACK WALL PANELS (js/mass.js: _workHackPanel, nearestHackablePanel; the panel loop in js/game.js).
//
// REPORTED: "Make it to where the electric followers can hack the panels. And that's what they do for work when there's no shards."
// An electric worker bleeds a charged lump if there is one; with none it walks to a wall panel it can hack safely and stands there until
// the panel has paid out its shards. It skips decoys; the other worker elements are untouched.
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
    run(`gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); ensureWorldTo(4 * ZONE_LENGTH); player.x = 20; player.y = 2; gameState.phase = 'day';`);

    // One safe panel near the player, a worker of the given element standing a few tiles from it, nothing else about.
    const setup = (el, opts) => run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower && !(a instanceof Predator)); chargedMass.length = 0; frame += 7;
        render();
        const panels = world.filter(t => t.nodeType === 'wall_panel'); if (!panels.length) return { noPanel: true };
        const p = panels.filter(t => t.x > 14 && t.x < 30)[0] || panels[0]; world.forEach(t => { if (t.nodeType === 'wall_panel' && t !== p) t.panelActivated = true; });
        p.panelActivated = false; p.siphonProgress = 0; p.isDecoy = ${opts && opts.decoy ? 'true' : 'false'}; _wallPanelCache = [p]; player.x = p.x + 8; player.y = 2;
        spawnFollowerAtCrystal('${el}'); const f = followers[0]; f.returningToCrystal = false; f.duty = 'worker'; f.job = null; f.stance = 'follow'; f.x = p.x + 3; f.y = 2; f.siphonOrder = null;
        globalThis.__w = f; globalThis.__p = p; globalThis.__s0 = shardCount; return { x: p.x, reward: p.shardReward }; })()`);
    const frames = n => run(`(function(){ for (let i = 0; i < ${n}; i++) { render(); __w.x = Math.min(__w.x, __p.x + 40); } return { done: __p.panelActivated, shards: shardCount - __s0, order: !!__w.siphonOrder }; })()`);

    check('THE ASK: an electric worker with no charged lump hacks a wall panel, and the panel pays its shards', () => {
        const s = setup('electric'); ok(!s.noPanel, 'fixture: no wall panel in the world');
        const r = frames(900);
        ok(r.done, 'the panel was never hacked: ' + JSON.stringify(r));
        ok(r.shards > 0, 'no shards paid: ' + JSON.stringify(r));
    });
    check('it prefers a charged lump: with one on the floor it bleeds that and does not go for the panel', () => {
        setup('electric');
        run(`spawnChargedMass(__w.x + 0.3, 2, 5);`);
        const r = run(`(function(){ for (let i = 0; i < 40; i++) render(); return { order: !!__w.siphonOrder, mass: chargedMass.length }; })()`);
        ok(r.mass >= 1 && !r.order, 'it should be on the lump, not heading for a panel: ' + JSON.stringify(r));
    });
    check('it never hacks a decoy: the panel that would trip an alarm is left alone', () => {
        setup('electric', { decoy: true });
        const r = run(`(function(){ gameState.highestZoneCleared = 0; for (let i = 0; i < 400; i++) render(); return { order: !!__w.siphonOrder, done: __p.panelActivated, alarm: !!alertActive }; })()`);
        ok(!r.order && !r.done && !r.alarm, 'a decoy was hacked: ' + JSON.stringify(r));
    });
    check('only ELECTRIC workers do it: a core worker (the re-armer) leaves the panels alone', () => {
        setup('core');
        const r = run(`(function(){ for (let i = 0; i < 400; i++) render(); return { order: !!__w.siphonOrder, done: __p.panelActivated }; })()`);
        ok(!r.order && !r.done, 'a core worker hacked a panel: ' + JSON.stringify(r));
    });
    check('a fighter (no worker duty) does not do it either', () => {
        setup('electric'); run(`__w.duty = null;`);
        const r = run(`(function(){ for (let i = 0; i < 400; i++) render(); return { order: !!__w.siphonOrder, done: __p.panelActivated }; })()`);
        ok(!r.order && !r.done, 'a fighter hacked a panel: ' + JSON.stringify(r));
    });
    check('the crew label says so', () => {
        same(run('workerJobLabel("electric")'), 'NEUTRALISE / HACK', 'the label');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
