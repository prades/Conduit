// TOXIC TENDS THE CLONES — and keeps doing it.
//
// THE REPORTED CASE: "The toxic followers will absolutely not heal the clones."
//
// A toxic follower mends a clone on WORKER duty. But duty was never saved: the
// roster written at a wave change left it out, a follower that died came back
// without it, and a refresh restored the roster from the last wave change (so a
// follower gained since then was gone altogether). Every route back put the
// crew on the line, where a toxic follower fights and mends nothing. And the
// mend itself was a flat 9 HP/s against clones of 240-800 HP.
//
// Now duty is kept through all three, the autosave keeps the roster current,
// the mend scales with the clone, and a toxic follower on the line still mends
// a hurt clone it is standing beside.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }

// A page load on a shared localStorage — a second boot on the same store is a refresh.
async function boot(store) {
    const sb = makeBrowserSandbox(store);
    sb.setTimeout = fn => { fn(); return 0; };   // nextWave defers its rebuild; run it now
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) {}
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; 
         unlockedElements = new Set(ELEMENTS.map(e => e.id));`);
    return run;
}

// A hurt clone with one toxic follower beside it (or `gap` tiles away); how
// much health the clone gains in `frames` steps, over its own regeneration.
const MEND_SCENE = (duty, gap, frames, pin, keep) => `(function(){   // keep: stand it back beside the clone each step (the AI is free to wander off, which made this test flake)
    actors = actors.filter(a => !a.isClone && !a.isFollower); followers.length = 0;
    for (const k in followerByElement) followerByElement[k] = [];
    const base = (function(){ const c = makeClone('beetle', 'scout', crystal.x + 4, 2); c.health = c.maxHealth * 0.3;
        const h0 = c.health; for (let i = 0; i < ${frames}; i++) { gameState.running = true; render(); }
        const g = c.health - h0; c.dead = true; actors = actors.filter(a => a !== c); return g; })();
    const c = makeClone('beetle', 'scout', crystal.x + 4, 2);
    spawnFollowerAtCrystal('toxic'); const f = followers[followers.length - 1];
    f.returningToCrystal = false; f.x = c.x + ${gap}; f.y = c.y; ${duty ? `setFollowerDuty(f, '${duty}', true);` : ''}
    ${pin ? 'f.moveSpeed = 0; f.baseMoveSpeed = 0; c.moveSpeed = 0;' : ''}
    c.health = c.maxHealth * 0.3;
    const h0 = c.health;
    for (let i = 0; i < ${frames}; i++) { gameState.running = true; ${keep ? 'f.x = c.x + ' + gap + '; f.y = c.y;' : ''} render(); }
    return { mended: c.health - h0 - base, max: c.maxHealth };
})()`;

(async () => {
    console.log('\nTHE MEND');
    await check('THE ASK: a toxic WORKER mends a clone — and enough to matter on a big one', async () => {
        const run = await boot({});
        const r = run(MEND_SCENE('worker', 1, 300));
        const flat = run('MEND_RATE') * 300;
        ok(r.mended > flat * 1.5, 'five seconds mended ' + r.mended.toFixed(1) + ' HP of a ' + r.max + ' HP clone (flat rate alone: ' + flat + ')');
    });
    await check('THE ASK: a toxic follower ON THE LINE mends a hurt clone it is standing beside', async () => {
        const run = await boot({});
        const r = run(MEND_SCENE(null, 0.8, 300, false, true));
        ok(r.mended > 10, 'a toxic fighter beside the clone mended ' + r.mended.toFixed(1) + ' HP in five seconds');
    });
    await check('…but not from across the map, and less than a worker would', async () => {
        const run = await boot({});
        const far = run(MEND_SCENE(null, 6, 120, true));   // held where it is
        ok(far.mended < 1, 'a toxic fighter six tiles off mended ' + far.mended.toFixed(1));
        const line = run(MEND_SCENE(null, 0.8, 120)), work = run(MEND_SCENE('worker', 0.8, 120));
        ok(line.mended < work.mended, 'the line (' + line.mended.toFixed(1) + ') out-mended the worker (' + work.mended.toFixed(1) + ')');
    });
    await check('a fire follower beside a clone mends nothing (it is the TOXIC job)', async () => {
        const run = await boot({});
        const r = run(MEND_SCENE(null, 0.8, 120).replace("spawnFollowerAtCrystal('toxic')", "spawnFollowerAtCrystal('fire')"));
        ok(r.mended < 1, 'a fire follower mended ' + r.mended.toFixed(1));
    });

    console.log('\nTHE DUTY IS KEPT');
    await check('THE ASK: a worker is still a worker after a REFRESH (and so is a follower gained mid-day)', async () => {
        const store = {};
        let run = await boot(store);
        run(`for (let i = 0; i < 3; i++) spawnFollowerAtCrystal('toxic');
             setFollowerDuty(followers[0], 'worker', true);
             for (let i = 0; i < 301; i++) { gameState.running = true; render(); }`);   // the 5 s autosave
        run = await boot(store);
        same(run('followers.length'), 3, 'followers after the refresh');
        same(run(`followers.filter(f => f.duty === 'worker').length`), 1, 'workers after the refresh');
    });
    await check('…after a WAVE CHANGE', async () => {
        const run = await boot({});
        run(`for (let i = 0; i < 2; i++) spawnFollowerAtCrystal('toxic');
             setFollowerDuty(followers[1], 'worker', true); nextWave();`);
        same(run('followers.length'), 2, 'followers after the wave change');
        same(run(`followers.filter(f => f.duty === 'worker').length`), 1, 'workers after the wave change');
    });
    await check('…and after it DIES and respawns', async () => {
        const run = await boot({});
        // A respawn takes its element from the Crystal; pinned to toxic so the
        // follower that comes back is one that CAN work.
        run(`activeCrystalModulation = { pair: ['toxic'] };
             spawnFollowerAtCrystal('toxic'); const f = followers[0]; f.returningToCrystal = false;
             setFollowerDuty(f, 'worker', true); f.health = 0; f.dead = true;
             for (let i = 0; i < 3000 && !followers.some(x => !x.dead); i++) { gameState.running = true; crystal.health = crystal.maxHealth; render(); }`);
        ok(run('followers.some(x => !x.dead)'), 'it never respawned');
        same(run(`followers.find(x => !x.dead).duty`), 'worker', 'duty after the respawn');
    });
    await check('the saved roster does not count a follower twice', async () => {
        const run = await boot({});
        run(`spawnFollowerAtCrystal('toxic'); followers[0].returningToCrystal = true;`);
        same(run('followerRosterSnapshot().length'), 1, 'roster entries for one follower');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
