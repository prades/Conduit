// THE REPORTED CASE: predators get stuck on FLUX wave pylons and never fight
// their way out, which makes the game not worth playing.
//
// Three things had to be true at once for that to happen:
//   1. exposure was counted every third frame against a threshold of 300, so a
//      trapped predator waited 900 real frames (15s) before reacting;
//   2. the pylonAggro behaviour in predator.js was gated on alertActive or
//      night, so a predator trapped during the day could never react at all;
//   3. the flux pull (0.10–0.20 per 3 frames) is several times a predator's own
//      walk speed, so even once it wanted to leave it physically could not.
//
// These tests drive the real zone-effect loop out of game.js and the real
// Predator.update() out of predator.js — no reimplementations.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const CONFIG = fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8');
const GAME   = fs.readFileSync(path.join(ROOT, 'js/game.js'),   'utf8');

// Lift the tuning constants out of config.js rather than copying the numbers,
// so a change in the game cannot silently leave this suite testing fiction.
function constant(name) {
    const m = CONFIG.match(new RegExp(`const\\s+${name}\\s*=\\s*([\\d.]+)`));
    if (!m) throw new Error(`config.js no longer defines ${name}`);
    return Number(m[1]);
}
const PYLON_AGGRO_EXPOSURE  = constant('PYLON_AGGRO_EXPOSURE');
const PYLON_AGGRO_TRAP_RATE = constant('PYLON_AGGRO_TRAP_RATE');
const PYLON_BASH_COOLDOWN   = constant('PYLON_BASH_COOLDOWN');
const PYLON_AGGRO_GIVE_UP   = constant('PYLON_AGGRO_GIVE_UP');

const sandbox = {
    console, Math, Array, Object, String, Number, Set, Map, isFinite, isNaN, parseInt,
    actors: [], world: [], elementEffects: [], floatingTexts: [], followerProjectiles: [],
    _pillarCache: [], _wPylonPairs: [], zonePredators: {},
    networkStrength: {}, _seasonBonusCache: {},
    frame: 0, health: 100, shake: 0,
    ZONE_LENGTH: 15, activeDayZones: 3,
    gameState: { nightNumber: 1, phase: 'night' },
    alertActive: true,
    activeCrystalBuild: null,
    crystal: { x: -99, y: 2, health: 300, maxHealth: 300 },
    player: { x: 99, y: 2, visualX: 99, visualY: 2, stunned: 0 },
    PREDATOR_TYPES: { scout: { moveSpeed: 0.022 }, striker: { moveSpeed: 0.018 },
                      tank: { moveSpeed: 0.012 }, worker: { moveSpeed: 0.024 } },
    PYLON_AGGRO_EXPOSURE, PYLON_AGGRO_TRAP_RATE, PYLON_BASH_COOLDOWN, PYLON_AGGRO_GIVE_UP,
    damageLog: [],
    applyDamage(t, amt) { sandbox.damageLog.push({ t, amt }); if (t) t.health = Math.max(0, (t.health ?? 100) - amt); },
    applyElementalDamage() {},
    findNearestFriendlyPillar: () => null,
    spawnFollowerProjectile() {},
    getZoneIndex: x => Math.floor(x / 15),
};
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
for (const f of ['js/species.js', 'js/abilities.js', 'js/predator.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
// The zone-effect loop, straight out of game.js.
const zoneFn = GAME.match(/function applyPylonZoneEffects\(wavePylons\) \{[\s\S]*?\n\}/);
if (!zoneFn) { console.log('  FAIL could not find applyPylonZoneEffects in js/game.js'); process.exit(1); }
vm.runInContext(zoneFn[0], ctx, { filename: 'game.js:applyPylonZoneEffects' });

const run = s => vm.runInContext(s, ctx);
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }

// ── fixtures ──────────────────────────────────────────────
function pylon(x, y, el) {
    return { x, y, pillar: true, pillarTeam: 'green', destroyed: false,
             health: 200, maxHealth: 200, waveMode: true,
             attackModeElement: el, attackModeColor: '#8844ff' };
}
// A linked pair, in the shape rebuildPylonPairs() produces. tests/pylons.js
// covers the linking itself; here we only need a live zone to stand in.
function pair(pa, pb, el) {
    const lx = pb.x - pa.x, ly = pb.y - pa.y;
    return { pa, pb, el, col: '#8844ff',
             midX: (pa.x + pb.x) / 2, midY: (pa.y + pb.y) / 2,
             lx, ly, len2: lx * lx + ly * ly,
             bMinX: Math.min(pa.x, pb.x) - 1.5, bMaxX: Math.max(pa.x, pb.x) + 1.5,
             bMinY: Math.min(pa.y, pb.y) - 1.5, bMaxY: Math.max(pa.y, pb.y) + 1.5 };
}
function mkPred(x, y) {
    const S = run('SPECIES')['mantis'];
    const def = Object.assign({}, S.striker, { color: S.color });
    const p = new (run('Predator'))('striker', def, x, y);
    p.speciesName = 'mantis'; p.className = 'striker';
    p.state = 'hunt'; p.walkCycle = 1; p.provoked = true;
    p.dirX = 1; p.dirY = 0; p.headAngle = 0;
    run('initAbility')(p);
    p.baseMoveSpeed = p.moveSpeed;
    sandbox.actors.push(p);
    return p;
}
function reset(el, tier) {
    sandbox.actors.length = 0;
    sandbox._wPylonPairs.length = 0;
    sandbox.elementEffects.length = 0;
    sandbox.floatingTexts.length = 0;
    sandbox.damageLog.length = 0;
    sandbox.frame = 0;
    sandbox.networkStrength = { [el]: tier || 1 };
    sandbox._seasonBonusCache = {};
    sandbox.gameState.phase = 'night';
    sandbox.alertActive = true;
}
// One frame of the game as far as a pylon zone is concerned.
function tick(n, pylons) {
    for (let i = 0; i < n; i++) {
        sandbox.frame++;
        run('applyPylonZoneEffects')(pylons);
        sandbox.actors.forEach(a => a.update && a.update());
    }
}
// A flux zone with one predator standing in the middle of it.
function fluxTrap(tier) {
    reset('flux', tier || 1);
    const pa = pylon(0, 0, 'flux'), pb = pylon(0, 4, 'flux');
    sandbox._wPylonPairs.push(pair(pa, pb, 'flux'));
    const p = mkPred(0.6, 2);
    return { pa, pb, p, pylons: [pa, pb] };
}

// ── the reported case ─────────────────────────────────────
group('breaking out of a flux zone');

check('THE REPORTED CASE: a predator held in a flux zone turns on the pylon', () => {
    const t = fluxTrap();
    tick(180, t.pylons);
    ok(t.p.pylonAggro, 'predator never turned on the pylon that was holding it');
});

check('it reacts in a couple of seconds, not fifteen', () => {
    const t = fluxTrap();
    let frames = 0;
    while (frames < 600 && !t.p.pylonAggro) { tick(1, t.pylons); frames++; }
    ok(t.p.pylonAggro, 'never aggroed at all');
    ok(frames <= 180, `took ${frames} frames (${(frames / 60).toFixed(1)}s) to react`);
});

check('a flux zone counts for more than an ordinary one', () => {
    const t = fluxTrap();
    tick(3, t.pylons);
    const fluxGain = t.p.pylonExposureFrames;

    reset('fire', 1);
    const fa = pylon(0, 0, 'fire'), fb = pylon(0, 4, 'fire');
    sandbox._wPylonPairs.push(pair(fa, fb, 'fire'));
    const q = mkPred(0.6, 2);
    tick(3, [fa, fb]);

    ok(fluxGain === q.pylonExposureFrames * PYLON_AGGRO_TRAP_RATE,
       `flux gained ${fluxGain} vs fire ${q.pylonExposureFrames}, expected ${PYLON_AGGRO_TRAP_RATE}x`);
});

check('it breaks out during the DAY too, not only at night', () => {
    const t = fluxTrap();
    sandbox.gameState.phase = 'day';
    sandbox.alertActive = false;         // no alarm either — the old gate blocked both
    let frames = 0;
    while (frames < 600 && !t.p.pylonAggro) { tick(1, t.pylons); frames++; }
    ok(t.p.pylonAggro, 'a predator trapped in daylight never marked a pylon');
    ok(frames <= 180, `took ${frames} frames in daylight`);
    // Marking one is not fighting out of it — it has to actually land bites,
    // which is what the old alertActive/night gate stopped it doing.
    tick(600, t.pylons);
    ok([t.pa, t.pb].some(p => p.health < p.maxHealth),
       'a predator trapped in daylight never bit its way out');
});

check('the player is told what is happening', () => {
    const t = fluxTrap();
    tick(180, t.pylons);
    ok(sandbox.floatingTexts.some(f => /BREAK/i.test(f.text)),
       'no callout when a predator breaks out');
});

check('exposure is counted once per frame however many zones overlap', () => {
    reset('flux', 1);
    const a1 = pylon(0, 0, 'flux'), b1 = pylon(0, 4, 'flux');
    const a2 = pylon(1, 0, 'flux'), b2 = pylon(1, 4, 'flux');
    sandbox._wPylonPairs.push(pair(a1, b1, 'flux'), pair(a2, b2, 'flux'));
    const p = mkPred(0.6, 2);
    tick(3, [a1, b1, a2, b2]);
    ok(p.pylonExposureFrames === PYLON_AGGRO_TRAP_RATE,
       `two overlapping zones counted ${p.pylonExposureFrames}, should be ${PYLON_AGGRO_TRAP_RATE}`);
});

check('only a STUCK predator breaks out — exposure fades once it is clear', () => {
    const t = fluxTrap();
    tick(30, t.pylons);
    const banked = t.p.pylonExposureFrames;
    ok(banked > 0, 'precondition: should have taken some exposure');
    // Walk it out of the zone: no pylon effects reach it any more.
    sandbox._wPylonPairs.length = 0;
    tick(banked + 10, []);
    ok(t.p.pylonExposureFrames === 0,
       `a predator that left the zone kept ${t.p.pylonExposureFrames} exposure banked`);
    ok(!t.p.pylonAggro, 'a predator that walked away should not turn on a pylon');
});

check('exposure does not fade while it is still being zapped', () => {
    const t = fluxTrap();
    tick(30, t.pylons);
    const after30 = t.p.pylonExposureFrames;
    // 30 frames inside a flux zone: 10 effect ticks at TRAP_RATE each.
    ok(after30 === 10 * PYLON_AGGRO_TRAP_RATE,
       `expected ${10 * PYLON_AGGRO_TRAP_RATE} exposure after 30 frames, got ${after30}`);
});

// ── the pull has to let go ────────────────────────────────
group('the flux pull releases a committed predator');

check('flux stops dragging once the predator has committed', () => {
    const t = fluxTrap(3);                 // tier 3 — the strongest pull
    tick(180, t.pylons);
    ok(t.p.pylonAggro, 'precondition: should have aggroed');
    // Park it off the midpoint, still inside the zone, and confirm nothing drags it back.
    t.p.x = 1.2; t.p.y = 2;
    const before = { x: t.p.x, y: t.p.y };
    sandbox.frame++;
    run('applyPylonZoneEffects')(t.pylons);
    ok(t.p.x === before.x && t.p.y === before.y,
       `flux still pulled a committed predator: ${before.x},${before.y} -> ${t.p.x},${t.p.y}`);
});

check('an uncommitted predator is still pulled — the zone still works', () => {
    const t = fluxTrap(3);
    t.p.x = 1.2; t.p.y = 2;          // inside the pair's bounding box
    const before = t.p.x;
    sandbox.frame = 3;
    run('applyPylonZoneEffects')(t.pylons);
    ok(t.p.x < before, 'flux should still pull a predator that has not broken out');
});

check('it can walk against the pull to reach its pylon', () => {
    // The heart of the reported bug: the pull is several times a predator's own
    // walk speed, so it has to be off for a committed one or it can never
    // arrive. Aim at the far pylon from just past the midpoint, so the pull —
    // if it were still on — would drag it the other way.
    const t = fluxTrap(3);
    tick(180, t.pylons);
    ok(t.p.pylonAggro, 'precondition: should have aggroed');
    t.p.x = 0; t.p.y = 2.2;
    t.p.pylonAggro = t.pb;               // the pylon at (0, 4), pull points to (0, 2)
    const start = Math.hypot(t.pb.x - t.p.x, t.pb.y - t.p.y);
    let closest = start;
    for (let i = 0; i < 240; i++) {
        tick(1, t.pylons);
        closest = Math.min(closest, Math.hypot(t.pb.x - t.p.x, t.pb.y - t.p.y));
    }
    ok(closest < 0.9, `never got within biting range: closest was ${closest.toFixed(2)} of ${start.toFixed(2)}`);
    ok(t.pb.health < t.pb.maxHealth, 'arrived but never bit');
});

// ── and then bite it ──────────────────────────────────────
group('biting the pylon');

check('a broken-out predator damages the pylon it is stuck on', () => {
    const t = fluxTrap();
    tick(900, t.pylons);
    const hurt = [t.pa, t.pb].some(p => p.health < p.maxHealth);
    ok(hurt, 'the predator never landed a bite on the pylon holding it');
});

check('it bashes on a cooldown rather than every frame', () => {
    const t = fluxTrap();
    tick(180, t.pylons);
    ok(t.p.pylonAggro, 'precondition: should have aggroed');
    const target = t.p.pylonAggro;
    // Put it in reach and let it chew. Bites landed on the way here don't count.
    t.p.x = target.x + 0.5; t.p.y = target.y;
    const before = target.health;
    sandbox.floatingTexts.length = 0;
    tick(PYLON_BASH_COOLDOWN * 3, t.pylons);
    const bites = sandbox.floatingTexts.filter(f => f.text === 'BASH!').length;
    ok(target.health < before, 'no damage dealt while in reach');
    ok(bites <= 4, `landed ${bites} bites in ${PYLON_BASH_COOLDOWN * 3} frames — too fast`);
});

check('a pylon bitten to nothing is marked for destruction', () => {
    const t = fluxTrap();
    tick(180, t.pylons);
    const target = t.p.pylonAggro;
    ok(target, 'precondition: should have aggroed');
    t.p.x = target.x + 0.5; t.p.y = target.y;
    target.health = 1;
    tick(PYLON_BASH_COOLDOWN + 2, t.pylons);
    ok(target.pendingDestroy, 'pylon reduced to zero was not marked pendingDestroy');
    ok(t.p.pylonAggro === null, 'predator should let go of a felled pylon');
});

check('it gives up on a pylon it has been dragged away from', () => {
    const t = fluxTrap();
    tick(180, t.pylons);
    ok(t.p.pylonAggro, 'precondition: should have aggroed');
    t.p.x = t.p.pylonAggro.x + PYLON_AGGRO_GIVE_UP + 2;
    t.p.update();
    ok(t.p.pylonAggro === null, 'kept chasing a pylon far out of reach');
    ok(t.p.pylonExposureFrames === 0, 'exposure should reset when it gives up');
});

check('an already-destroyed pylon is dropped as a target', () => {
    const t = fluxTrap();
    tick(180, t.pylons);
    ok(t.p.pylonAggro, 'precondition: should have aggroed');
    t.p.pylonAggro.destroyed = true;
    t.p.update();
    ok(t.p.pylonAggro === null, 'still attacking wreckage');
});

// ── the constants themselves ──────────────────────────────
group('tuning');

check('the exposure threshold is reachable in a playable amount of time', () => {
    // Counted once every three frames, tripled inside a flux zone.
    const secs = (PYLON_AGGRO_EXPOSURE / PYLON_AGGRO_TRAP_RATE) * 3 / 60;
    ok(secs <= 3, `a trapped predator waits ${secs.toFixed(1)}s before reacting`);
});

check('game.js and predator.js use the constants, not literals', () => {
    const PRED = fs.readFileSync(path.join(ROOT, 'js/predator.js'), 'utf8');
    ok(GAME.includes('PYLON_AGGRO_EXPOSURE') && GAME.includes('PYLON_AGGRO_TRAP_RATE'),
       'game.js should read the tuning constants');
    ok(PRED.includes('PYLON_BASH_COOLDOWN') && PRED.includes('PYLON_AGGRO_GIVE_UP'),
       'predator.js should read the tuning constants');
});

check('the pylonAggro branch is not gated on night or the alarm', () => {
    const PRED = fs.readFileSync(path.join(ROOT, 'js/predator.js'), 'utf8');
    const at = PRED.indexOf('if (this.pylonAggro)');
    ok(at > -1, 'pylonAggro branch not found');
    // Strip comments — the code says why the gate went, and that prose would
    // otherwise match.
    const slice = PRED.slice(at, at + 1800).replace(/\/\/[^\n]*/g, '');
    ok(!/alertActive/.test(slice) && !/phase\s*===\s*"night"/.test(slice),
       'the day/alarm gate is back — trapped predators cannot fight out in daylight');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
