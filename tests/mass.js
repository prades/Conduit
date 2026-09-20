// Charged mass: predator drops that have to be worked before they are worth
// anything. An ELECTRIC worker bleeds the charge off, a CORE worker hauls the
// inert lump to the Crystal. Followers split into fighters and workers.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

function makeEnv() {
    const sandbox = {
        console, Math, Array, Object, String, Number, Set, Map, isNaN, isFinite, parseInt,
        floatingTexts: [], elementEffects: [], actors: [], followers: [], world: [],
        _cacheAge: 0,
        crystal: { x: 0, y: 2 },
        canvas: { width: 900, height: 700 },
        shardCount: 0, frame: 0,
        saveShards() { sandbox.saved = sandbox.shardCount; },
        saved: null,
    };
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/mass.js'), 'utf8'), ctx, { filename: 'js/mass.js' });
    return { sandbox, run: s => vm.runInContext(s, ctx) };
}

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// mass.js declares `let chargedMass`, a global lexical binding. Inside a vm
// context that shadows a same-named sandbox property, so the live array has to
// be read back through the vm rather than off the sandbox object. In a browser
// every script shares one lexical scope, so this only affects the harness.
function masses(env) { return env.run('chargedMass'); }

function worker(env, element, x, y) {
    const f = { element, x, y, dead: false, isFollower: true, team: 'green',
                duty: 'worker', moveSpeed: 0.05, walkCycle: 0, job: null };
    env.sandbox.followers.push(f); env.sandbox.actors.push(f);
    return f;
}
// Run the worker until a condition holds, or give up.
function until(env, f, cond, maxFrames) {
    for (let i = 0; i < (maxFrames || 4000); i++) {
        env.sandbox.frame++;
        env.run('followerWorkTick')(f);
        env.run('updateChargedMass()');
        if (cond()) return i + 1;
    }
    return -1;
}

group('the drop');
check('a lump starts charged, inert and worth something', () => {
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(5, 2, 7);
    eq(m.state, 'charged', 'state');
    eq(m.value, 7, 'value');
    eq(m.progress, 0, 'not yet neutralised');
    eq(m.carrier, null, 'nobody carrying it');
    eq(masses(env).length, 1, 'tracked');
});
check('value is floored at 1 and rounded', () => {
    const env = makeEnv();
    eq(env.run('spawnChargedMass')(0, 0, 0).value, 1, 'zero');
    eq(env.run('spawnChargedMass')(0, 0, -5).value, 1, 'negative');
    eq(env.run('spawnChargedMass')(0, 0, 2.6).value, 3, 'rounded');
});
check('walking over one does nothing — it is not a pickup', () => {
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(5, 2, 9);
    env.sandbox.crystal = { x: 99, y: 99 };
    for (let i = 0; i < 200; i++) { env.sandbox.frame++; env.run('updateChargedMass()'); }
    eq(env.sandbox.shardCount, 0, 'no free shards');
    eq(m.state, 'charged', 'still charged');
    eq(masses(env).length, 1, 'still lying there');
});

group('neutralising');
check('THE CHAIN, STEP 1: an electric worker walks over and bleeds the charge', () => {
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(6, 2, 4);
    const f = worker(env, 'electric', 0, 2);
    const t = until(env, f, () => m.state === 'neutral');
    ok(t > 0, 'never neutralised it');
    eq(m.state, 'neutral', 'state');
    ok(Math.abs(f.x - m.x) < 1.0, 'should have walked to it, ended at ' + f.x.toFixed(2));
});
check('it takes real time, not one frame', () => {
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(0.2, 2, 4);
    const f = worker(env, 'electric', 0, 2);
    const t = until(env, f, () => m.state === 'neutral');
    ok(t >= env.run('MASS_NEUTRALISE_FRAMES'), 'finished too fast: ' + t + ' frames');
});
check('a hauler cannot neutralise', () => {
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(0.2, 2, 4);
    const f = worker(env, 'flux', 0, 2);
    until(env, f, () => false, 400);
    eq(m.state, 'charged', 'the hauler should not be able to do this job');
});
check('a fighter ignores the work entirely', () => {
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(0.2, 2, 4);
    const f = worker(env, 'electric', 0, 2);
    f.duty = 'fighter';
    eq(env.run('followerWorkTick')(f), false, 'should not take the frame');
    until(env, f, () => false, 300);
    eq(m.state, 'charged', 'untouched');
});
check('an explicit player order outranks the work crew', () => {
    const env = makeEnv();
    env.run('spawnChargedMass')(0.2, 2, 4);
    const f = worker(env, 'electric', 0, 2);
    f.job = { type: 'attack', target: {} };
    eq(env.run('followerWorkTick')(f), false, 'orders win');
});

group('hauling');
check('THE CHAIN, STEP 2: a flux worker drags a neutral lump to the Crystal', () => {
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(6, 2, 11);
    m.state = 'neutral';
    const f = worker(env, 'flux', 5, 2);
    const t = until(env, f, () => env.sandbox.shardCount > 0);
    ok(t > 0, 'never delivered');
    eq(env.sandbox.shardCount, 11, 'shards paid on delivery');
    eq(masses(env).length, 0, 'lump consumed');
    eq(env.sandbox.saved, 11, 'shard count persisted');
});
check('a hauler will not pick up a still-charged lump', () => {
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(0.2, 2, 11);
    const f = worker(env, 'flux', 0, 2);
    until(env, f, () => false, 400);
    eq(m.state, 'charged', 'untouched');
    eq(env.sandbox.shardCount, 0, 'no payout');
});
check('an electric worker will not haul', () => {
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(0.2, 2, 11);
    m.state = 'neutral';
    const f = worker(env, 'electric', 0, 2);
    until(env, f, () => false, 400);
    eq(m.state, 'neutral', 'still lying there');
    eq(env.sandbox.shardCount, 0, 'no payout');
});
check('a carried lump rides its carrier', () => {
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(5, 2, 3);
    m.state = 'neutral';
    env.sandbox.crystal = { x: 99, y: 99 };     // too far to deliver during the test
    const f = worker(env, 'flux', 5, 2);
    until(env, f, () => m.state === 'carried', 200);
    eq(m.state, 'carried', 'picked up');
    eq(m.carrier, f, 'carrier recorded');
    for (let i = 0; i < 40; i++) { env.sandbox.frame++; env.run('followerWorkTick')(f); env.run('updateChargedMass()'); }
    ok(Math.abs(m.x - f.x) < 1e-6 && Math.abs(m.y - f.y) < 1e-6, 'lump should track the carrier');
});
check('killing the carrier drops the lump back on the floor', () => {
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(5, 2, 3);
    m.state = 'neutral';
    env.sandbox.crystal = { x: 99, y: 99 };
    const f = worker(env, 'flux', 5, 2);
    until(env, f, () => m.state === 'carried', 200);
    f.dead = true;
    env.run('updateChargedMass()');
    eq(m.state, 'neutral', 'dropped, not lost');
    eq(m.carrier, null, 'carrier cleared');
    eq(masses(env).length, 1, 'still in the world');
});
check('the full chain end to end pays out once', () => {
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(7, 2, 6);
    const e = worker(env, 'electric', 6, 2);
    const c = worker(env, 'flux', 6, 2);
    for (let i = 0; i < 6000 && env.sandbox.shardCount === 0; i++) {
        env.sandbox.frame++;
        env.run('followerWorkTick')(e);
        env.run('followerWorkTick')(c);
        env.run('updateChargedMass()');
    }
    eq(env.sandbox.shardCount, 6, 'paid exactly once, for its value');
    eq(masses(env).length, 0, 'nothing left over');
});

group('duty assignment');
check('electric, flux and core can be put on the crew', () => {
    const env = makeEnv();
    for (const el of ['electric', 'flux', 'core']) {
        const f = worker(env, el, 0, 0); f.duty = 'fighter';
        eq(env.run('setFollowerDuty')(f, 'worker'), true, el + ' should be eligible');
        eq(f.duty, 'worker', el + ' duty');
    }
});
check('any other element is refused, and told why', () => {
    const env = makeEnv();
    for (const el of ['fire', 'ice', 'toxic']) {
        const f = worker(env, el, 0, 0); f.duty = 'fighter';
        eq(env.run('setFollowerDuty')(f, 'worker'), false, el + ' should be refused');
        eq(f.duty, 'fighter', el + ' should stay a fighter');
    }
    ok(env.sandbox.floatingTexts.some(t => /ONLY ELECTRIC, FLUX AND CORE/.test(t.text)), 'should say why');
});
check('toggling flips between the two duties', () => {
    const env = makeEnv();
    const f = worker(env, 'flux', 0, 0); f.duty = 'fighter';
    env.run('toggleFollowerDuty')(f); eq(f.duty, 'worker', 'to work');
    env.run('toggleFollowerDuty')(f); eq(f.duty, 'fighter', 'back to the line');
});
check('pulling a carrier back to the line makes it drop its load', () => {
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(5, 2, 3);
    m.state = 'neutral';
    env.sandbox.crystal = { x: 99, y: 99 };
    const f = worker(env, 'flux', 5, 2);
    until(env, f, () => m.state === 'carried', 200);
    env.run('setFollowerDuty')(f, 'fighter');
    eq(m.state, 'neutral', 'load dropped');
    eq(m.carrier, null, 'carrier cleared');
    eq(f.carryingMass, null, 'hands empty');
});

group('broken pylons');
function brokenPylon(env, x, y, team) {
    const t = { pillar: true, x, y, destroyed: true, pillarTeam: team || 'green',
                health: 0, maxHealth: 20, reconstructing: false, reconstructProgress: 0,
                attackModeElement: 'fire', waveMode: true };
    env.sandbox.world.push(t);
    return t;
}
check('a broken pylon is recognised as repairable', () => {
    const env = makeEnv();
    const t = brokenPylon(env, 4, 3);
    eq(env.run('isBrokenPylon')(t), true, 'broken');
    t.destroyed = false;
    eq(env.run('isBrokenPylon')(t), false, 'standing pylon is not a repair job');
    eq(env.run('isBrokenPylon')({ x: 1, y: 1 }), false, 'not a pylon at all');
});
check('THE REPORTED CASE: a core worker rebuilds a broken pylon in place', () => {
    const env = makeEnv();
    const t = brokenPylon(env, 4, 2);
    const f = worker(env, 'core', 0, 2);
    let done = -1;
    for (let i = 0; i < 6000; i++) {
        env.sandbox.frame++;
        env.run('followerWorkTick')(f);
        if (!t.destroyed) { done = i; break; }
    }
    ok(done > 0, 'never rebuilt it');
    eq(t.destroyed, false, 'back up');
    ok(t.health > 0, 'has health again');
});
check('a rebuilt pylon keeps the element and mode it had', () => {
    const env = makeEnv();
    const t = brokenPylon(env, 0.2, 2);
    env.run('restoreBrokenPylon')(t);
    eq(t.attackModeElement, 'fire', 'element kept');
    eq(t.waveMode, true, 'mode kept');
    eq(t.reconstructProgress, 0, 'progress cleared');
    eq(t.reconstructing, false, 'no longer under repair');
});
check('repairing is not instant', () => {
    const env = makeEnv();
    const t = brokenPylon(env, 0.2, 2);
    const f = worker(env, 'core', 0, 2);
    env.run('followerWorkTick')(f);
    ok(t.destroyed, 'one frame should not finish it');
    ok((t.reconstructProgress || 0) > 0, 'but it should have started');
});
check('a core worker will not repair enemy wreckage', () => {
    const env = makeEnv();
    const t = brokenPylon(env, 0.2, 2, 'red');
    const f = worker(env, 'core', 0, 2);
    for (let i = 0; i < 600; i++) { env.sandbox.frame++; env.run('followerWorkTick')(f); }
    eq(t.destroyed, true, 'enemy pylon left broken');
});
check('only core repairs — the other two ignore wreckage', () => {
    for (const el of ['electric', 'flux']) {
        const env = makeEnv();
        const t = brokenPylon(env, 0.2, 2);
        const f = worker(env, el, 0, 2);
        for (let i = 0; i < 600; i++) { env.sandbox.frame++; env.run('followerWorkTick')(f); }
        eq(t.destroyed, true, el + ' should not repair');
    }
});
check('a core worker with no wreckage to fix stands down', () => {
    const env = makeEnv();
    const f = worker(env, 'core', 0, 2);
    eq(env.run('followerWorkTick')(f), false, 'should hand the frame back');
});
check('each worker element has exactly one job, and they are distinct', () => {
    const env = makeEnv();
    const jobs = ['electric', 'flux', 'core'].map(el => env.run('workerJobLabel')(el));
    eq(new Set(jobs).size, 3, 'jobs should be distinct: ' + jobs.join(','));
    for (const el of ['fire', 'ice', 'toxic']) eq(env.run('workerJobLabel')(el), null, el + ' has no job');
});
check('broken pylons are drawn rather than vanishing', () => {
    const game = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
    ok(/obj\.pillar && obj\.destroyed/.test(game), 'nothing draws a broken pylon');
    ok(/BROKEN/.test(game), 'no label on player wreckage');
});

group('counts and persistence');
check('the tally splits by state', () => {
    const env = makeEnv();
    env.run('spawnChargedMass')(1, 1, 2);
    const n = env.run('spawnChargedMass')(2, 1, 3); n.state = 'neutral';
    const c = env.run('spawnChargedMass')(3, 1, 4); c.state = 'carried'; c.carrier = {};
    const t = env.run('massCounts()');
    eq(t.charged, 1, 'charged'); eq(t.neutral, 1, 'neutral');
    eq(t.carried, 1, 'carried'); eq(t.total, 3, 'total'); eq(t.value, 9, 'value');
});
check('a save round-trips position, value and state', () => {
    const env = makeEnv();
    env.run('spawnChargedMass')(4, 1, 5);
    const n = env.run('spawnChargedMass')(6, 3, 8); n.state = 'neutral';
    const data = env.run('serialiseChargedMass()');
    const env2 = makeEnv();
    env2.run('restoreChargedMass')(data);
    eq(masses(env2).length, 2, 'both restored');
    const back = masses(env2);
    eq(back[0].value, 5, 'value'); eq(back[0].state, 'charged', 'state');
    eq(back[1].state, 'neutral', 'neutral kept');
    eq(back[1].x, 6, 'x'); eq(back[1].y, 3, 'y');
});
check('a lump in transit is saved as dropped, not lost or duplicated', () => {
    // Carrier references cannot survive JSON, so it lands where it was.
    const env = makeEnv();
    const m = env.run('spawnChargedMass')(4, 1, 5);
    m.state = 'carried'; m.carrier = {};
    const data = env.run('serialiseChargedMass()');
    eq(data.length, 1, 'still one lump');
    eq(data[0].s, 'neutral', 'saved as neutral');
    const env2 = makeEnv();
    env2.run('restoreChargedMass')(data);
    eq(masses(env2)[0].carrier, null, 'nobody carrying it on load');
});
check('restoring junk does not throw', () => {
    const env = makeEnv();
    env.run('restoreChargedMass')(null);
    env.run('restoreChargedMass')(undefined);
    env.run('restoreChargedMass')([{ x: 'nope', y: 2, v: 3 }]);
    eq(masses(env).length, 0, 'garbage entries skipped');
});

group('wiring');
check('predators drop mass instead of paying shards directly', () => {
    const drops = fs.readFileSync(path.join(ROOT, 'js/drops.js'), 'utf8');
    ok(/spawnChargedMass\(/.test(drops), 'no mass dropped on death');
    ok(!/shardCount \+= shardsGained/.test(drops), 'still paying shards straight out');
});
check('the follower AI gives worker duty the frame', () => {
    const npc = fs.readFileSync(path.join(ROOT, 'js/npc.js'), 'utf8');
    ok(/followerWorkTick\(actor\)/.test(npc), 'workers never run their chain');
});
check('mass.js loads before save.js, which serialises it', () => {
    const html = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
    const order = html.split('\n').map(l => (l.match(/<script src="(js\/[^"]+)"><\/script>/) || [])[1]).filter(Boolean);
    const iMass = order.indexOf('js/mass.js'), iSave = order.indexOf('js/save.js');
    ok(iMass >= 0, 'mass.js is not loaded at all');
    ok(iMass < iSave, 'mass.js must precede save.js');
});
check('the radial can assign duty', () => {
    const draw = fs.readFileSync(path.join(ROOT, 'js/draw.js'), 'utf8');
    const cmd  = fs.readFileSync(path.join(ROOT, 'js/commands.js'), 'utf8');
    ok(/commandFollowerTarget/.test(draw), 'no follower branch in the radial');
    ok(/toggle_duty/.test(draw) && /case "toggle_duty"/.test(cmd), 'duty toggle not wired');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
