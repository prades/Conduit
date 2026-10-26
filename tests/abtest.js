// Exercises the insect ability machine (js/abilities.js: the charge-up specials and the scout's escape leap) and
// the slow fix against stub game state. All of this is DOM-free logic, so it runs for real.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
// Read out of config.js rather than written here: a fixture that disagreed with
// the game about whether predators bite the player would test a different game.
const PREDATORS_ATTACK_PLAYER_FIXTURE = /const PREDATORS_ATTACK_PLAYER\s*=\s*true/
    .test(fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8'));

const sandbox = {
    console, Math, Array, Object, String, Number, Set, Map, isFinite, isNaN, parseInt,
    // ── game globals ──
    actors: [], elementEffects: [], floatingTexts: [],
    frame: 0, health: 3, shake: 0, PLAYER_HITS: 3, PLAYER_HIT_GRACE: 60,
    alertActive: false,
    crystal: { x: 0, y: 2, health: 300, maxHealth: 300 },
    player: { x: 5, y: 2, visualX: 5, visualY: 2, invuln: 0 },
    // damage is recorded rather than simulated, so specials can be asserted on
    damageLog: [],
    applyDamage(target, amount, source, element) {
        sandbox.damageLog.push({ target, amount, element });
        if (target) target.health = Math.max(0, (target.health ?? 100) - amount);
    },
    // The real predicates from js/helpers.js, which the ability and predator
    // code now consults. Stubbing them as permissive would hide the very
    // behaviour these suites check.
    predatorMayHurtPlayer: () => PREDATORS_ATTACK_PLAYER_FIXTURE,
    isNeutralBystander: a => !!(a && a.isNeutralRecruit && a.team === 'red'),
    Predator: class {},
};
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
// abilities.js hurts the player through hurtPlayer(); load the real one out of
// helpers.js rather than stubbing it, so the respawn-grace behaviour is the
// behaviour under test here too.
const _helpers = fs.readFileSync(path.join(ROOT, 'js/helpers.js'), 'utf8')
    .match(/function hurtPlayer\(amount, shakeAmt, source\) \{[\s\S]*?\n\}/);
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
    sandbox.elementEffects.length = 0;
    sandbox.floatingTexts.length = 0;
    sandbox.damageLog.length = 0;
    sandbox.frame = 0;
    sandbox.health = 3; sandbox.player.invuln = 0;
    sandbox.shake = 0;
    sandbox.alertActive = false;
    sandbox.player.x = 50; sandbox.player.y = 2;
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
check('a worker gets no ability (it stays chaff, like a nymph)', () => {
    for (const sp of ['ant', 'beetle', 'scorpion', 'spider', 'mantis', 'moth'])
        eq(run('resolveAbilityKey')(sp, 'worker'), null, sp);
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
check('a species the table does not know gets none', () => {
    eq(run('resolveAbilityKey')('XV-09', 'tank'), null, 'unknown species');
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
check('a species table with no worker block gets a derived worker instead of undefined', () => {
    const partial = { color: '#888', scout: { width: 28, height: 13, moveSpeed: 0.019, health: 280, power: 68, dnaDrops: 4, shardDrop: 18, reactionSpeed: 5 } };
    const d = run('getClassDef')(partial, 'worker');
    ok(d, 'derived');
    ok(d.power > 0 && d.health > 0 && d.moveSpeed > 0, 'usable stats');
    ok(d.power < partial.scout.power && d.moveSpeed > partial.scout.moveSpeed, 'weaker and faster than its scout');
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
check('a worker has no ability: the machine never claims its frame, and nothing charges', () => {
    reset();
    const b = mkBug('ant', 'worker'); mkFoe();
    let claimed = false;
    for (let i = 0; i < 400; i++) {
        sandbox.frame++;
        if (run('abilityTick')(b)) claimed = true;
    }
    eq(claimed, false, 'a worker should never be taken over by an ability');
    eq(b.abilityCharge, 0, 'charge');
    eq(sandbox.damageLog.length, 0, 'no damage dealt');
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
check('THE RULE: no special touches the player, hostile or friendly', () => {
    // "They won't shoot at you" — a predator hurts the player only by biting
    // them up close (js/predator.js, tests/threehits.js), never with a special.
    reset();
    sandbox.player.x = 5.2; sandbox.player.y = 2;
    const b = mkBug('ant', 'striker'); mkFoe();
    spin(b, 500);
    eq(sandbox.health, 3, 'a hostile frenzy should not touch the player');

    reset();
    sandbox.player.x = 5.2;
    const c = mkBug('ant', 'striker', { isClone: true, team: 'green' });
    sandbox.actors.push({ x: 6, y: 2, team: 'red', health: 1e9, maxHealth: 1e9, dead: false });
    spin(c, 500);
    eq(sandbox.health, 3, 'a friendly clone should not touch the player');
});

check('but the special still lands on what it IS aimed at', () => {
    // The gate must not have quietly disarmed the ability itself.
    reset();
    sandbox.player.x = 99; sandbox.player.y = 99;      // far away, irrelevant
    const b = mkBug('ant', 'striker');
    const foe = mkFoe();
    spin(b, 500);
    ok(sandbox.damageLog.some(d => d.target === foe),
       'a hostile frenzy should still hit the follower it is aimed at');
});

check('a special spares a recruit waiting in its egg', () => {
    // A clone's specials reach team "red", which is an egg's team until it is
    // hatched (js/followerspots.js). Without the bystander rule your own
    // converted predators would cut down the followers waiting on the pads.
    reset();
    sandbox.player.x = 99; sandbox.player.y = 99;
    const c = mkBug('ant', 'striker', { isClone: true, team: 'green' });
    const recruit = { x: 6, y: 2, team: 'red', isNeutralRecruit: true,
                      health: 1e9, maxHealth: 1e9, dead: false };
    sandbox.actors.push(recruit);
    spin(c, 500);
    ok(!sandbox.damageLog.some(d => d.target === recruit),
       'a recruit should not be hit by a clone special');
});

group('scout leap');
// "The predators should use their leap to escape if they are low health and not
// to attack." The leap fires only below ABILITY_DEFS.LEAP.escapeBelow, jumps
// away from the nearest foe, and lands without hurting anybody.
const lowHp = () => run('ABILITY_DEFS').LEAP.escapeBelow * 0.5 * 100;
check('a HEALTHY scout never leaps, however close the foe', () => {
    reset();
    const b = mkBug('ant', 'scout', { x: 5, y: 2 });
    mkFoe({ x: 6.5, y: 2, health: 1e9, maxHealth: 1e9 });
    let flew = false;
    for (let i = 0; i < 600; i++) { sandbox.frame++; run('abilityTick')(b); if (b.leapLift > 0) flew = true; }
    ok(!flew, 'a scout at full health leapt');
});
check('a healthy scout does not leap at a distant foe or toward the crystal either', () => {
    reset();
    const b = mkBug('ant', 'scout', { x: 5, y: 2, state: 'hunt' });
    mkFoe({ x: 9, y: 2, health: 1e9, maxHealth: 1e9 });
    let flew = false;
    for (let i = 0; i < 600; i++) { sandbox.frame++; run('abilityTick')(b); if (b.leapLift > 0) flew = true; }
    ok(!flew, 'it leapt to attack or to gain ground');
});
check('a wounded scout leaps to ESCAPE: arcs up, lands flat, and ends farther from the foe', () => {
    reset();
    const b = mkBug('ant', 'scout', { x: 5, y: 2, health: lowHp() });
    const foe = mkFoe({ x: 7, y: 2, health: 1e9, maxHealth: 1e9 });
    const d0 = Math.hypot(foe.x - b.x, foe.y - b.y);
    let peak = 0, sawFlight = false;
    for (let i = 0; i < 400; i++) {
        sandbox.frame++;
        run('abilityTick')(b);
        if (b.leapLift > 0) { sawFlight = true; peak = Math.max(peak, b.leapLift); }
        if (sawFlight && b.abilityPhase === 'charging') break;
    }
    ok(sawFlight, 'a wounded scout never left the ground');
    ok(peak > 10, 'arc peak too low: ' + peak);
    eq(b.leapLift, 0, 'must land flat');
    ok(Math.hypot(foe.x - b.x, foe.y - b.y) > d0 + 1, 'it did not get away from the foe');
});
check('the escape is capped at the ability distance', () => {
    reset();
    const b = mkBug('ant', 'scout', { x: 5, y: 2, health: lowHp() });
    mkFoe({ x: 7, y: 2, health: 1e9, maxHealth: 1e9 });
    const x0 = b.x;
    let sawFlight = false;
    for (let i = 0; i < 400; i++) {
        sandbox.frame++;
        run('abilityTick')(b);
        if (b.leapLift > 0) sawFlight = true;
        if (sawFlight && b.abilityPhase === 'charging') break;
    }
    const moved = x0 - b.x;
    ok(moved > 1, 'barely moved: ' + moved);
    ok(moved <= run('ABILITY_DEFS').LEAP.distance + 0.01, 'overshot: ' + moved);
});
check('landing hurts nobody', () => {
    reset();
    const b = mkBug('ant', 'scout', { x: 5, y: 2, health: lowHp() });
    const foe = mkFoe({ x: 6, y: 2, health: 1000, maxHealth: 1000 });
    for (let i = 0; i < 400; i++) { sandbox.frame++; run('abilityTick')(b); }
    eq(foe.health, 1000, 'the leap damaged the foe');
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
check('an actor first seen under a haste or slow still gets a base, and the factor', () => {
    // moveSpeed is only ever scaled by tickSlowSpeed from the base, so before
    // there is a base it is the unscaled speed. REPORTED: followers got no
    // haste — one that first moved while hasted (the EMP's boost), renewed every
    // few frames, was "slowed" forever and never captured a base at all.
    const a = { moveSpeed: 0.02, state: 'hunt', slowed: 12, slowFactor: 1.9 };
    run('tickSlowSpeed')(a);
    eq(a.baseMoveSpeed, 0.02, 'captured the unscaled speed');
    ok(Math.abs(a.moveSpeed - 0.038) < 1e-12, 'and hasted it: ' + a.moveSpeed);
});
check('tickSlowSpeed leaves an attacking actor parked at zero', () => {
    const a = { moveSpeed: 0, baseMoveSpeed: 0.02, state: 'attack' };
    run('tickSlowSpeed')(a);
    eq(a.moveSpeed, 0, 'still parked');
});
check('a refreshing slow source cannot latch a permanent freeze', () => {
    // A slow that is re-applied every few frames (a web, a blizzard) with a
    // chance of a 0% freeze: under "strongest wins" that freeze would stick forever.
    const a = { moveSpeed: 0.02, baseMoveSpeed: 0.02, state: 'hunt' };
    run('applySlow')(a, 90, 0.0);
    run('applySlow')(a, 40, 0.35);
    run('tickSlowSpeed')(a);
    ok(a.moveSpeed > 0, 'freeze latched permanently');
});

console.log(failures ? `\n${failures} FAILING\n` : `\nall passing\n`);
process.exit(failures ? 1 : 0);
