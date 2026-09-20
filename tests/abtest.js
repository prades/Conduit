// Exercises the insect ability machine, the worker class and the slow fix
// against stub game state. All of this is DOM-free logic, so it runs for real.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const sandbox = {
    console, Math, Array, Object, String, Number, Set, Map, isFinite, isNaN, parseInt,
    // ── game globals ──
    actors: [], world: [], elementEffects: [], floatingTexts: [],
    _pillarCache: [], zonePredators: {},
    frame: 0, health: 100, shake: 0,
    ZONE_LENGTH: 15, activeDayZones: 3,
    gameState: { nightNumber: 1, phase: 'day' },
    alertActive: false,
    crystal: { x: 0, y: 2, health: 300, maxHealth: 300 },
    player: { x: 5, y: 2, visualX: 5, visualY: 2, invuln: 0 },
    // damage is recorded rather than simulated, so specials can be asserted on
    damageLog: [],
    applyDamage(target, amount, source, element) {
        sandbox.damageLog.push({ target, amount, element });
        if (target) target.health = Math.max(0, (target.health ?? 100) - amount);
    },
    Predator: class {},
    SYNTHETIC_SPECIES: {
        'XV-09': {
            color: '#888',
            nymph:   { width: 17, height: 9,  moveSpeed: 0.026, health: 95,  power: 30, dnaDrops: 3, shardDrop: 10, reactionSpeed: 14 },
            scout:   { width: 28, height: 13, moveSpeed: 0.019, health: 280, power: 68, dnaDrops: 4, shardDrop: 18, reactionSpeed: 5 },
            striker: { width: 35, height: 16, moveSpeed: 0.015, health: 420, power: 98, dnaDrops: 5, shardDrop: 26, reactionSpeed: 9 },
            tank:    { width: 46, height: 21, moveSpeed: 0.009, health: 720, power: 130, dnaDrops: 5, shardDrop: 36, reactionSpeed: 20 },
            boss:    { width: 42, height: 19, moveSpeed: 0.006, health: 2700, power: 195, dnaDrops: 11, shardDrop: 85, reactionSpeed: 7 },
        },
    },
};
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
// abilities.js hurts the player through hurtPlayer(); load the real one out of
// helpers.js rather than stubbing it, so the respawn-grace behaviour is the
// behaviour under test here too.
const _helpers = fs.readFileSync(path.join(ROOT, 'js/helpers.js'), 'utf8')
    .match(/function hurtPlayer\(amount, shakeAmt\) \{[\s\S]*?\n\}/);
if (!_helpers) { console.log('  FAIL could not find hurtPlayer in js/helpers.js'); process.exit(1); }
vm.runInContext(_helpers[0], ctx, { filename: 'helpers.js:hurtPlayer' });

for (const f of ['js/species.js', 'js/abilities.js']) {
    vm.runInContext(fs.readFileSync(ROOT + '/' + f, 'utf8'), ctx, { filename: f });
}
const run = s => vm.runInContext(s, ctx);

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// ── fixtures ──
function reset() {
    sandbox.actors.length = 0;
    sandbox.world.length = 0;
    sandbox._pillarCache.length = 0;
    sandbox.elementEffects.length = 0;
    sandbox.floatingTexts.length = 0;
    sandbox.damageLog.length = 0;
    sandbox.zonePredators = {};
    sandbox.frame = 0;
    sandbox.health = 100;
    sandbox.shake = 0;
    sandbox.alertActive = false;
    sandbox.player.x = 50; sandbox.player.y = 2; sandbox.player.stunned = 0;
}

function mkBug(species, cls, over) {
    const b = Object.assign({
        speciesName: species, className: cls,
        x: 5, y: 2, dirX: 1, dirY: 0,
        health: 100, maxHealth: 100, power: 20,
        moveSpeed: 0.02, baseMoveSpeed: 0.02,
        walkCycle: 0, state: 'hunt', dead: false,
        isClone: false, team: 'red', provoked: true,
        attackAnim: 0,
    }, over || {});
    run('initAbility')(b);
    sandbox.actors.push(b);
    return b;
}

function mkFoe(over) {
    const f = Object.assign({ x: 6, y: 2, health: 100, maxHealth: 100, team: 'green', dead: false,
                              moveSpeed: 0.03, baseMoveSpeed: 0.03, state: 'hunt' }, over || {});
    sandbox.actors.push(f);
    return f;
}

function mkPylon(x, over) {
    const t = Object.assign({ pillar: true, x, y: 3, pillarTeam: 'red', destroyed: false,
                              health: 20, maxHealth: 20, reconstructing: false,
                              reconstructProgress: 0 }, over || {});
    sandbox.world.push(t);
    if (!t.destroyed) sandbox._pillarCache.push(t);
    return t;
}

// Advance a bug N frames through its ability machine.
function spin(bug, n, extra) {
    for (let i = 0; i < n; i++) {
        sandbox.frame++;
        run('abilityTick')(bug);
        if (extra) extra(i);
    }
}

// ─────────────────────────────────────────────────────────
group('ability resolution');
check('worker class always gets SUPER REPAIR', () => {
    for (const sp of ['ant', 'beetle', 'scorpion', 'spider', 'mantis', 'moth'])
        eq(run('resolveAbilityKey')(sp, 'worker'), 'SUPER_REPAIR', sp);
});
check('scout class always gets LEAP', () => {
    for (const sp of ['ant', 'moth', 'spider'])
        eq(run('resolveAbilityKey')(sp, 'scout'), 'LEAP', sp);
});
check('nymphs get no ability', () => eq(run('resolveAbilityKey')('ant', 'nymph'), null, 'nymph'));
check('each species has its own signature special', () => {
    const want = { ant: 'MANDIBLE_FRENZY', beetle: 'CARAPACE_SLAM', scorpion: 'VENOM_LANCE',
                   spider: 'WEB_SNARE', mantis: 'BLADE_FLURRY', moth: 'BLINDING_DUST' };
    for (const [sp, key] of Object.entries(want)) {
        for (const cls of ['striker', 'tank', 'boss'])
            eq(run('resolveAbilityKey')(sp, cls), key, sp + '/' + cls);
    }
    eq(new Set(Object.values(want)).size, 6, 'all six specials distinct');
});
check('synthetic species get a stable special, never null', () => {
    const a = run('resolveAbilityKey')('XV-09', 'tank');
    const b = run('resolveAbilityKey')('XV-09', 'tank');
    ok(a && a === b, 'deterministic');
    ok(run('ABILITY_DEFS')[a], 'resolves to a real def');
});
check('every ability def has the fields the machine reads', () => {
    const defs = run('ABILITY_DEFS');
    for (const [k, d] of Object.entries(defs)) {
        ok(typeof d.name === 'string' && d.name.length, k + ' name');
        ok(d.chargeRate > 0, k + ' chargeRate');
        ok(d.windup > 0, k + ' windup');
        ok(d.duration >= 0, k + ' duration');
        ok(/^#[0-9a-f]{6}$/i.test(d.color), k + ' color');
    }
});

group('class stat lookup');
check('every species defines a worker block', () => {
    const S = run('SPECIES');
    for (const sp of Object.keys(S)) ok(S[sp].worker, sp + ' worker');
});
check('worker is weaker and faster than the same species scout', () => {
    const S = run('SPECIES');
    for (const sp of Object.keys(S)) {
        ok(S[sp].worker.power < S[sp].scout.power, sp + ' power');
        ok(S[sp].worker.moveSpeed > S[sp].scout.moveSpeed, sp + ' speed');
        ok(S[sp].worker.health < S[sp].scout.health, sp + ' health');
    }
});
check('synthetic species get a derived worker instead of undefined', () => {
    const d = run('getClassDef')(sandbox.SYNTHETIC_SPECIES['XV-09'], 'worker');
    ok(d, 'derived');
    ok(d.power > 0 && d.health > 0 && d.moveSpeed > 0, 'usable stats');
    eq(d.abdomenAttack, false, 'workers do not shoot');
});
check('an unknown class never returns undefined', () => {
    ok(run('getClassDef')(run('SPECIES').ant, 'gibberish'), 'falls back');
});

group('charge machine');
check('charge does not build for an unprovoked wanderer', () => {
    reset();
    const b = mkBug('ant', 'striker', { state: 'wander', provoked: false });
    spin(b, 120);
    eq(b.abilityCharge, 0, 'charge');
});
check('charge builds while engaged and reaches ready', () => {
    reset();
    const b = mkBug('ant', 'striker');
    spin(b, 300);
    eq(b.abilityCharge, 100, 'charge full');
    ok(b.abilityPhase === 'ready' || b.abilityPhase === 'winding' || b.abilityPhase === 'active', b.abilityPhase);
});
check('a primed insect with no target waits in ready rather than firing', () => {
    reset();
    const b = mkBug('ant', 'striker');
    spin(b, 400);
    eq(b.abilityPhase, 'ready', 'phase');
    eq(sandbox.damageLog.length, 0, 'no damage dealt');
});
check('windup roots the insect, so the telegraph is fair', () => {
    reset();
    const b = mkBug('ant', 'striker'); mkFoe();
    spin(b, 260);
    eq(b.abilityPhase, 'winding', 'phase');
    eq(run('abilityTick')(b), true, 'claims the frame');
});
check('a winding worker is NOT rooted — it keeps repairing', () => {
    reset();
    const p = mkPylon(5, { health: 5 });
    const b = mkBug('ant', 'worker');
    let rooted = false;
    for (let i = 0; i < 400; i++) {
        sandbox.frame++;
        if (run('abilityTick')(b) && b.abilityPhase === 'winding') rooted = true;
    }
    eq(rooted, false, 'worker windup should not root');
});
check('the full cycle completes and resets to charging', () => {
    reset();
    const b = mkBug('ant', 'striker'); mkFoe();
    spin(b, 700);
    eq(b.abilityPhase, 'charging', 'back to charging');
    ok(sandbox.damageLog.length > 0, 'frenzy dealt damage');
});

group('species specials');
check('MANDIBLE FRENZY lands repeated hits over its duration', () => {
    reset();
    const b = mkBug('ant', 'striker'); const f = mkFoe({ health: 10000, maxHealth: 10000 });
    spin(b, 400);
    const hits = sandbox.damageLog.filter(d => d.target === f).length;
    ok(hits >= 4, 'expected several frenzy hits, got ' + hits);
});
check('CARAPACE SLAM moves the beetle and knocks its victim back', () => {
    reset();
    const b = mkBug('beetle', 'tank', { x: 5 });
    const f = mkFoe({ x: 6.6, y: 2, health: 10000, maxHealth: 10000 });
    const x0 = b.x;
    spin(b, 500);
    ok(b.x > x0, `beetle should dash forward (${x0} → ${b.x})`);
    ok((f.kbVX || 0) !== 0 || (f.kbVY || 0) !== 0, 'victim knocked back');
});
check('CARAPACE SLAM hits each victim only once per dash', () => {
    reset();
    const b = mkBug('beetle', 'tank', { x: 5 });
    // Must sit beyond 1.0 tiles: the beetle deliberately will not dash at a
    // victim already inside melee range, so a closer fixture never fires.
    const f = mkFoe({ x: 6.4, y: 2, health: 1e9, maxHealth: 1e9 });
    // Run exactly one full cycle and count hits on that victim.
    let fired = false, hits0 = 0;
    for (let i = 0; i < 2000; i++) {
        sandbox.frame++;
        run('abilityTick')(b);
        if (b.abilityPhase === 'active') { fired = true; }
        if (fired && b.abilityPhase === 'charging') break;
    }
    hits0 = sandbox.damageLog.filter(d => d.target === f).length;
    eq(hits0, 1, 'one slam hit per victim');
});
check('WEB SNARE slows everything in radius', () => {
    reset();
    const b = mkBug('spider', 'striker');
    const near = mkFoe({ x: 6, y: 2 }), far = mkFoe({ x: 40, y: 2 });
    spin(b, 500);
    ok(near.slowed > 0 && near.slowFactor < 1, 'near foe snared');
    ok(!(far.slowed > 0), 'distant foe untouched');
});
check('VENOM LANCE shreds defence and ticks poison', () => {
    reset();
    const b = mkBug('scorpion', 'tank');
    const f = mkFoe({ x: 6, y: 2, health: 1e9, maxHealth: 1e9 });
    spin(b, 600);
    ok(f.defenseShredded > 0, 'shredded');
    ok(sandbox.damageLog.some(d => d.element === 'toxic'), 'poison ticks logged');
});
check('BLINDING DUST slows and shreds in an area', () => {
    reset();
    const b = mkBug('moth', 'tank');
    const f = mkFoe({ x: 6.5, y: 2, health: 1e9, maxHealth: 1e9 });
    spin(b, 600);
    ok(f.slowed > 0, 'slowed');
    ok(f.defenseShredded > 0, 'shredded');
});
check('hostile specials can hit the player, clone specials cannot', () => {
    reset();
    sandbox.player.x = 5.2; sandbox.player.y = 2;
    const b = mkBug('ant', 'striker'); mkFoe();
    spin(b, 500);
    ok(sandbox.health < 100, 'player took damage from a hostile frenzy');

    reset();
    sandbox.player.x = 5.2;
    const c = mkBug('ant', 'striker', { isClone: true, team: 'green' });
    sandbox.actors.push({ x: 6, y: 2, team: 'red', health: 1e9, maxHealth: 1e9, dead: false });
    spin(c, 500);
    eq(sandbox.health, 100, 'a friendly clone never hurts the player');
});

group('scout leap');
check('leap arcs up and lands back on the ground', () => {
    reset();
    const b = mkBug('ant', 'scout', { x: 5 });
    mkFoe({ x: 8, y: 2, health: 1e9, maxHealth: 1e9 });
    let peak = 0, sawFlight = false;
    for (let i = 0; i < 400; i++) {
        sandbox.frame++;
        run('abilityTick')(b);
        if (b.leapLift > 0) { sawFlight = true; peak = Math.max(peak, b.leapLift); }
        if (sawFlight && b.abilityPhase === 'charging') break;
    }
    ok(sawFlight, 'never left the ground');
    ok(peak > 10, 'arc peak too low: ' + peak);
    eq(b.leapLift, 0, 'must land flat');
});
check('leap covers ground, capped at the ability distance', () => {
    reset();
    const b = mkBug('ant', 'scout', { x: 5, y: 2 });
    mkFoe({ x: 9, y: 2, health: 1e9, maxHealth: 1e9 });
    const x0 = b.x;
    let sawFlight = false;
    for (let i = 0; i < 400; i++) {
        sandbox.frame++;
        run('abilityTick')(b);
        if (b.leapLift > 0) sawFlight = true;
        if (sawFlight && b.abilityPhase === 'charging') break;
    }
    const moved = b.x - x0;
    ok(moved > 1, 'barely moved: ' + moved);
    ok(moved <= run('ABILITY_DEFS').LEAP.distance + 0.01, 'overshot: ' + moved);
});
check('leap stays inside the corridor', () => {
    reset();
    const b = mkBug('ant', 'scout', { x: 5, y: 0 });
    mkFoe({ x: 5, y: 0, health: 1e9, maxHealth: 1e9 });
    // Put the foe off-corridor so the leap vector points out of bounds.
    sandbox.actors[1].y = -8;
    spin(b, 400);
    ok(b.y >= 0 && b.y <= 3, 'leapt out of the corridor to y=' + b.y);
});

group('worker class');
check('worker walks toward a damaged pylon of its own team', () => {
    reset();
    const p = mkPylon(12, { health: 6 });
    const b = mkBug('ant', 'worker', { x: 5 });
    const d0 = Math.abs(p.x - b.x);
    for (let i = 0; i < 200; i++) { sandbox.frame++; run('workerTick')(b); }
    ok(Math.abs(p.x - b.x) < d0, 'did not approach');
});
check('worker repairs a damaged pylon once in range', () => {
    reset();
    const p = mkPylon(5, { health: 6 });
    const b = mkBug('ant', 'worker', { x: 5, y: 3 });
    for (let i = 0; i < 100; i++) { sandbox.frame++; run('workerTick')(b); }
    ok(p.health > 6, 'no repair happened (health ' + p.health + ')');
});
check('SUPER REPAIR is several times faster than base repair', () => {
    reset();
    const p1 = mkPylon(5, { health: 2 });
    const w1 = mkBug('ant', 'worker', { x: 5, y: 3 });
    for (let i = 0; i < 60; i++) { sandbox.frame++; run('workerTick')(w1); }
    const plain = p1.health - 2;

    reset();
    const p2 = mkPylon(5, { health: 2 });
    const w2 = mkBug('ant', 'worker', { x: 5, y: 3, superRepair: true });
    for (let i = 0; i < 60; i++) { sandbox.frame++; run('workerTick')(w2); }
    const super_ = p2.health - 2;

    ok(super_ > plain * 3, `super ${super_} should far exceed base ${plain}`);
});
check('worker rebuilds a destroyed pylon back to life', () => {
    reset();
    const p = mkPylon(5, { destroyed: true, health: 0 });
    const b = mkBug('ant', 'worker', { x: 5, y: 3, superRepair: true });
    for (let i = 0; i < 3000 && p.destroyed; i++) { sandbox.frame++; run('workerTick')(b); }
    eq(p.destroyed, false, 'still a wreck');
    ok(p.health > 0, 'revived with no health');
});
check('worker prefers a standing damaged pylon over a wreck', () => {
    reset();
    mkPylon(5, { destroyed: true, health: 0 });     // wreck, right next to it
    const dmg = mkPylon(7, { health: 4 });          // damaged, further away
    const b = mkBug('ant', 'worker', { x: 5, y: 3 });
    eq(run('_abFindRepairTarget')(b), dmg, 'should pick the repairable one');
});
check('a red worker ignores green pylons, and a clone ignores red', () => {
    reset();
    mkPylon(5, { pillarTeam: 'green', health: 3 });
    const red = mkBug('ant', 'worker', { x: 5, y: 3 });
    eq(run('_abFindRepairTarget')(red), null, 'red worker must not fix green pylons');

    reset();
    const gp = mkPylon(5, { pillarTeam: 'green', health: 3 });
    const clone = mkBug('ant', 'worker', { x: 5, y: 3, isClone: true, team: 'green' });
    eq(run('_abFindRepairTarget')(clone), gp, 'cloned worker should fix green pylons');
});
check('worker does not repair a pylon already at full health', () => {
    reset();
    mkPylon(5, { health: 20 });
    const b = mkBug('ant', 'worker', { x: 5, y: 3 });
    eq(run('_abFindRepairTarget')(b), null, 'full-health pylon is not a job');
});
check('a badly hurt worker disengages instead of fighting', () => {
    reset();
    mkPylon(5, { health: 3 });
    const b = mkBug('ant', 'worker', { x: 5, y: 3, health: 10, maxHealth: 100 });
    eq(run('workerTick')(b), false, 'should hand control back');
    eq(b.state, 'retreat', 'state');
});
check('workerTick ignores non-worker classes', () => {
    reset();
    mkPylon(5, { health: 3 });
    const b = mkBug('ant', 'tank', { x: 5, y: 3 });
    eq(run('workerTick')(b), false, 'not a worker');
});

group('worker spawn pressure');
check('a damaged red pylon pulls a worker into that zone', () => {
    reset();
    mkPylon(1 * 15 + 3, { health: 8 });
    eq(run('zoneNeedsWorker')(1), true, 'should want a worker');
});
check('an undamaged zone does not', () => {
    reset();
    mkPylon(1 * 15 + 3, { health: 20 });
    eq(run('zoneNeedsWorker')(1), false, 'should not want one');
});
check('a green pylon in the zone does not summon a red worker', () => {
    reset();
    mkPylon(1 * 15 + 3, { pillarTeam: 'green', health: 2 });
    eq(run('zoneNeedsWorker')(1), false, 'wrong team');
});
check('the zone worker count is capped at two', () => {
    reset();
    mkPylon(1 * 15 + 3, { health: 8 });
    sandbox.zonePredators[1] = [
        { dead: false, className: 'worker' }, { dead: false, className: 'worker' },
    ];
    eq(run('zoneNeedsWorker')(1), false, 'already has two');
    sandbox.zonePredators[1][0].dead = true;
    eq(run('zoneNeedsWorker')(1), true, 'one died, room for another');
});
check('adding workers did not eat the front-zone boss roll', () => {
    // The worker branch originally reused `roll`, which consumed the same 0.08
    // band the boss check needs — bosses would have stopped spawning entirely.
    reset();
    sandbox.gameState.nightNumber = 20;
    const seen = {};
    for (let i = 0; i < 40000; i++) {
        const c = run('getZoneClass')(5);   // front zone at activeDayZones=3 → isFront
        seen[c] = (seen[c] || 0) + 1;
    }
    ok(seen.boss > 0, 'no bosses spawned in 40k rolls — the boss band was consumed');
    ok(seen.worker > 0, 'no workers spawned');
    ok(seen.tank > 0, 'no tanks spawned');
});

group('slow plumbing (previously a no-op)');
check('applySlow records duration and factor', () => {
    const a = { moveSpeed: 0.02, baseMoveSpeed: 0.02, state: 'hunt' };
    run('applySlow')(a, 120, 0.25);
    eq(a.slowed, 120, 'frames'); eq(a.slowFactor, 0.25, 'factor');
});
check('tickSlowSpeed actually scales moveSpeed', () => {
    const a = { moveSpeed: 0.02, baseMoveSpeed: 0.02, state: 'hunt' };
    run('applySlow')(a, 60, 0.25);
    run('tickSlowSpeed')(a);
    eq(a.moveSpeed, 0.005, 'scaled speed');
});
check('speed is restored when the slow expires', () => {
    const a = { moveSpeed: 0.02, baseMoveSpeed: 0.02, state: 'hunt' };
    run('applySlow')(a, 1, 0.1);
    run('tickSlowSpeed')(a);
    ok(a.moveSpeed < 0.02, 'slowed');
    a.slowed = 0;
    run('tickSlowSpeed')(a);
    eq(a.moveSpeed, 0.02, 'restored');
    eq(a.slowFactor, 1, 'factor reset');
});
check('a full stun drops speed to zero, then recovers', () => {
    const a = { moveSpeed: 0.02, baseMoveSpeed: 0.02, state: 'hunt' };
    run('applySlow')(a, 30, 0);
    run('tickSlowSpeed')(a);
    eq(a.moveSpeed, 0, 'stunned');
    a.slowed = 0; run('tickSlowSpeed')(a);
    eq(a.moveSpeed, 0.02, 'recovered');
});
check('base speed is captured lazily for actors spawned without one', () => {
    const a = { moveSpeed: 0.05, state: 'hunt' };
    run('tickSlowSpeed')(a);
    eq(a.baseMoveSpeed, 0.05, 'captured');
});
check('attack state never latches a base speed of zero', () => {
    // Predators park moveSpeed at 0 while attacking. Capturing that as the base
    // would freeze them permanently once a slow expired.
    const a = { moveSpeed: 0, state: 'attack' };
    run('tickSlowSpeed')(a);
    eq(a.baseMoveSpeed, undefined, 'must not capture 0 from attack state');
    a.state = 'hunt'; a.moveSpeed = 0.03;
    run('tickSlowSpeed')(a);
    eq(a.baseMoveSpeed, 0.03, 'captured once moving again');
});
check('an already-slowed actor does not capture its slowed speed as base', () => {
    const a = { moveSpeed: 0.004, state: 'hunt', slowed: 50, slowFactor: 0.2 };
    run('tickSlowSpeed')(a);
    eq(a.baseMoveSpeed, undefined, 'must not capture while slowed');
});
check('tickSlowSpeed leaves an attacking actor parked at zero', () => {
    const a = { moveSpeed: 0, baseMoveSpeed: 0.02, state: 'attack' };
    run('tickSlowSpeed')(a);
    eq(a.moveSpeed, 0, 'still parked');
});
check('a refreshing slow source cannot latch a permanent freeze', () => {
    // The ice pylon re-applies its slow every few frames and has a 1.5% chance
    // of a 0% freeze. Under "strongest wins" that freeze would stick forever.
    const a = { moveSpeed: 0.02, baseMoveSpeed: 0.02, state: 'hunt' };
    run('applySlow')(a, 90, 0.0);
    run('applySlow')(a, 40, 0.35);
    run('tickSlowSpeed')(a);
    ok(a.moveSpeed > 0, 'freeze latched permanently');
});

console.log(failures ? `\n${failures} FAILING\n` : `\nall passing\n`);
process.exit(failures ? 1 : 0);
