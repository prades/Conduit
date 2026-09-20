// Predators must face what they are attacking — melee, crystal, pylon bash,
// and every ability. The melee attack branch returns before predator.js's
// HEAD CONTROL block, so nothing was turning them at all.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const sandbox = {
    console, Math, Array, Object, String, Number, Set, Map, isFinite, isNaN, parseInt,
    actors: [], world: [], elementEffects: [], floatingTexts: [], followerProjectiles: [],
    _pillarCache: [], zonePredators: {},
    frame: 0, health: 100, shake: 0,
    ZONE_LENGTH: 15, activeDayZones: 3,
    gameState: { nightNumber: 1, phase: 'night' },
    alertActive: true,                       // keeps predators hostile rather than grazing
    activeCrystalBuild: null,
    crystal: { x: 0, y: 2, health: 300, maxHealth: 300 },
    player: { x: 99, y: 2, visualX: 99, visualY: 2, stunned: 0 },
    PREDATOR_TYPES: { scout: { moveSpeed: 0.022 }, striker: { moveSpeed: 0.018 },
                      tank: { moveSpeed: 0.012 }, worker: { moveSpeed: 0.024 } },
    damageLog: [],
    applyDamage(t, amt, src, el) { sandbox.damageLog.push({ t, amt, el }); if (t) t.health = Math.max(0, (t.health ?? 100) - amt); },
    applyElementalDamage() {},
    findNearestFriendlyPillar: () => null,
    spawnFollowerProjectile() { sandbox.followerProjectiles.push({}); },
    getZoneIndex: x => Math.floor(x / 15),
};
sandbox.globalThis = sandbox;
// predator.js reads a handful of config.js constants at runtime. config.js
// itself touches the DOM, so lift just the constants out of its source —
// copying the numbers here instead would let the test drift from the game.
for (const name of ['PYLON_AGGRO_EXPOSURE', 'PYLON_AGGRO_TRAP_RATE',
                    'PYLON_BASH_COOLDOWN', 'PYLON_AGGRO_GIVE_UP']) {
    const src = fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8');
    const m = src.match(new RegExp(`const\\s+${name}\\s*=\\s*([\\d.]+)`));
    if (!m) throw new Error(`config.js no longer defines ${name}`);
    sandbox[name] = Number(m[1]);
}
const ctx = vm.createContext(sandbox);
for (const f of ['js/species.js', 'js/abilities.js', 'js/predator.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
}
const run = s => vm.runInContext(s, ctx);

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }
function close(a, b, tol, m) { if (Math.abs(a - b) > tol) throw new Error(`${m}: expected ~${b}, got ${a}`); }

// Angle between where the predator faces and where the target is, in degrees.
function facingErrorDeg(pred, tx, ty) {
    const want = Math.atan2(ty - pred.y, tx - pred.x);
    const have = Math.atan2(pred.dirY, pred.dirX);
    let d = want - have;
    while (d >  Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d) * 180 / Math.PI;
}
function headErrorDeg(pred, tx, ty) {
    const want = Math.atan2(ty - pred.y, tx - pred.x);
    let d = want - pred.headAngle;
    while (d >  Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    return Math.abs(d) * 180 / Math.PI;
}

function reset() {
    sandbox.actors.length = 0; sandbox.world.length = 0;
    sandbox._pillarCache.length = 0; sandbox.elementEffects.length = 0;
    sandbox.floatingTexts.length = 0; sandbox.followerProjectiles.length = 0;
    sandbox.damageLog.length = 0; sandbox.frame = 0;
    sandbox.crystal.x = 0; sandbox.crystal.y = 2;
}
function mkPred(species, cls, x, y) {
    const S = run('SPECIES')[species];
    const def = Object.assign({}, S[cls], { color: S.color });
    const p = new (run('Predator'))(cls, def, x, y);
    p.speciesName = species; p.className = cls;
    p.state = 'hunt'; p.walkCycle = 1; p.provoked = true;
    p.dirX = 1; p.dirY = 0; p.headAngle = 0;        // facing due +x
    run('initAbility')(p);
    p.baseMoveSpeed = p.moveSpeed;
    sandbox.actors.push(p);
    return p;
}
const mkFoe = (x, y) => {
    const f = { x, y, health: 1e9, maxHealth: 1e9, team: 'green', dead: false,
                moveSpeed: 0.03, baseMoveSpeed: 0.03, state: 'hunt' };
    sandbox.actors.push(f); return f;
};

// ─────────────────────────────────────────────────────────
group('the facing helper');
check('rate 1 snaps the body straight at the target', () => {
    const p = { x: 0, y: 0, dirX: 1, dirY: 0, headAngle: 0 };
    run('faceToward')(p, -3, 0, 1);
    close(p.dirX, -1, 1e-9, 'dirX'); close(p.dirY, 0, 1e-9, 'dirY');
});
check('a partial rate turns part of the way and keeps the vector unit-length', () => {
    const p = { x: 0, y: 0, dirX: 1, dirY: 0, headAngle: 0 };
    run('faceToward')(p, 0, 5, 0.25);
    const len = Math.hypot(p.dirX, p.dirY);
    close(len, 1, 1e-9, 'unit length');
    ok(p.dirY > 0, 'turned toward the target');
    ok(p.dirX > 0, 'but not all the way in one step');
});
check('repeated turning converges on the target', () => {
    const p = { x: 0, y: 0, dirX: 1, dirY: 0, headAngle: 0 };
    for (let i = 0; i < 40; i++) run('faceToward')(p, -4, -4, 0.25);
    ok(facingErrorDeg(p, -4, -4) < 1, 'converged, off by ' + facingErrorDeg(p, -4, -4).toFixed(1) + '°');
});
check('the head leads the body round', () => {
    const p = { x: 0, y: 0, dirX: 1, dirY: 0, headAngle: 0 };
    run('faceToward')(p, 0, 5, 0.25);
    ok(headErrorDeg(p, 0, 5) < facingErrorDeg(p, 0, 5), 'head should lead');
});
check('head angle wraps the short way round, not the long way', () => {
    const p = { x: 0, y: 0, dirX: 1, dirY: 0, headAngle: Math.PI * 0.95 };
    run('faceToward')(p, -1, -0.05, 1);   // just past -PI
    ok(Math.abs(p.headAngle) < Math.PI * 2, 'stayed bounded: ' + p.headAngle);
    ok(headErrorDeg(p, -1, -0.05) < 1, 'took the short way');
});
check('a target at the same position does not produce NaN', () => {
    const p = { x: 3, y: 3, dirX: 1, dirY: 0, headAngle: 0 };
    run('faceToward')(p, 3, 3, 1);
    ok(Number.isFinite(p.dirX) && Number.isFinite(p.dirY) && Number.isFinite(p.headAngle), 'finite');
    close(p.dirX, 1, 1e-9, 'left untouched');
});
check('abdomen aiming turns the REAR at the target, head looks back', () => {
    const p = { x: 0, y: 0, dirX: 1, dirY: 0, headAngle: 0 };
    for (let i = 0; i < 40; i++) run('faceAbdomenToward')(p, 5, 0, 0.35);
    // body points away from the target...
    ok(facingErrorDeg(p, 5, 0) > 170, 'rear should point at the target, body error ' + facingErrorDeg(p, 5, 0).toFixed(1) + '°');
    // ...while the head still looks at it
    ok(headErrorDeg(p, 5, 0) < 5, 'head should still track, error ' + headErrorDeg(p, 5, 0).toFixed(1) + '°');
});

group('melee attack');
check('THE REPORTED CASE: a predator turns to face what it bites', () => {
    reset();
    const p = mkPred('ant', 'striker', 5, 2);      // facing +x
    const foe = mkFoe(4.2, 2);                      // standing behind it, to -x
    p.state = 'attack'; p.currentTarget = foe;
    const before = facingErrorDeg(p, foe.x, foe.y);
    for (let i = 0; i < 30; i++) { sandbox.frame++; p.update(); }
    const after = facingErrorDeg(p, foe.x, foe.y);
    ok(before > 170, 'fixture should start facing away, was ' + before.toFixed(1) + '°');
    ok(after < 10, 'should end facing the target, off by ' + after.toFixed(1) + '°');
});
check('its head locks on too', () => {
    reset();
    const p = mkPred('ant', 'striker', 5, 2);
    const foe = mkFoe(5, 0.6);
    p.state = 'attack'; p.currentTarget = foe;
    for (let i = 0; i < 30; i++) { sandbox.frame++; p.update(); }
    ok(headErrorDeg(p, foe.x, foe.y) < 10, 'head off by ' + headErrorDeg(p, foe.x, foe.y).toFixed(1) + '°');
});
check('it tracks a target that circles around it', () => {
    reset();
    const p = mkPred('mantis', 'striker', 5, 2);
    const foe = mkFoe(5.8, 2);
    p.state = 'attack'; p.currentTarget = foe;
    for (let i = 0; i < 20; i++) { sandbox.frame++; p.update(); }
    foe.x = 4.2; foe.y = 2;                        // teleport to the other side
    for (let i = 0; i < 30; i++) { sandbox.frame++; p.update(); }
    ok(facingErrorDeg(p, foe.x, foe.y) < 10, 'failed to follow, off by ' + facingErrorDeg(p, foe.x, foe.y).toFixed(1) + '°');
});
check('a predator gnawing the Crystal faces the Crystal', () => {
    reset();
    sandbox.crystal.x = 5; sandbox.crystal.y = 2;
    const p = mkPred('beetle', 'tank', 5.4, 2);    // within 0.8 of the crystal
    p.dirX = 1; p.dirY = 0;                         // facing away from it
    p.state = 'hunt'; p.currentTarget = null;
    for (let i = 0; i < 40; i++) { sandbox.frame++; p.update(); }
    ok(facingErrorDeg(p, 5, 2) < 15, 'off by ' + facingErrorDeg(p, 5, 2).toFixed(1) + '°');
});
check('a predator bashing a pylon faces the pylon', () => {
    reset();
    const pylon = { x: 4.3, y: 2, pillar: true, pillarTeam: 'green', destroyed: false, health: 20, maxHealth: 20 };
    sandbox.world.push(pylon); sandbox._pillarCache.push(pylon);
    const p = mkPred('ant', 'tank', 5, 2);
    p.pylonAggro = pylon;
    for (let i = 0; i < 40; i++) { sandbox.frame++; p.update(); }
    ok(facingErrorDeg(p, pylon.x, pylon.y) < 15, 'off by ' + facingErrorDeg(p, pylon.x, pylon.y).toFixed(1) + '°');
});

group('abilities');
function runAbility(p, frames) {
    for (let i = 0; i < frames; i++) { sandbox.frame++; run('abilityTick')(p); }
}
check('the windup telegraph turns toward its target', () => {
    reset();
    const p = mkPred('ant', 'striker', 5, 2);
    const foe = mkFoe(4.2, 2);                      // behind the predator
    let sawWinding = false, errAtWinding = 999;
    for (let i = 0; i < 400; i++) {
        sandbox.frame++; run('abilityTick')(p);
        if (p.abilityPhase === 'winding') { sawWinding = true; errAtWinding = facingErrorDeg(p, foe.x, foe.y); }
        if (sawWinding && p.abilityPhase === 'active') break;
    }
    ok(sawWinding, 'never wound up');
    ok(errAtWinding < 20, 'ended its windup facing away, off by ' + errAtWinding.toFixed(1) + '°');
});
check('a scout lands facing where it leapt', () => {
    reset();
    const p = mkPred('ant', 'scout', 5, 2);
    const foe = mkFoe(2.4, 2);                      // behind it, within pounce range
    let flew = false;
    for (let i = 0; i < 400; i++) {
        sandbox.frame++; run('abilityTick')(p);
        if (p.leapLift > 0) flew = true;
        if (flew && p.abilityPhase === 'charging') break;
    }
    ok(flew, 'never leapt');
    ok(p.dirX < 0, 'should face the way it jumped (-x), dirX=' + p.dirX.toFixed(2));
});
check('a beetle charges along the direction it faces', () => {
    reset();
    const p = mkPred('beetle', 'tank', 5, 2);
    const foe = mkFoe(3.0, 2);                      // behind it
    let dashed = false, x0 = p.x;
    for (let i = 0; i < 600; i++) {
        sandbox.frame++; run('abilityTick')(p);
        if (p.abilityPhase === 'active') { dashed = true; }
        if (dashed && p.abilityPhase === 'charging') break;
    }
    ok(dashed, 'never slammed');
    ok(p.x < x0, 'should have moved toward the foe (-x)');
    ok(p.dirX < 0, 'and faced that way, dirX=' + p.dirX.toFixed(2));
});
check('a multi-hit combo keeps tracking a victim that moves', () => {
    reset();
    const p = mkPred('mantis', 'striker', 5, 2);
    const foe = mkFoe(5.9, 2);
    let active = false;
    for (let i = 0; i < 400; i++) {
        sandbox.frame++; run('abilityTick')(p);
        if (p.abilityPhase === 'active') {
            if (!active) { active = true; foe.x = 4.1; foe.y = 2; }   // dodge behind mid-combo
        } else if (active) break;
    }
    ok(active, 'flurry never fired');
    ok(facingErrorDeg(p, foe.x, foe.y) < 25, 'lost track, off by ' + facingErrorDeg(p, foe.x, foe.y).toFixed(1) + '°');
});
check('a scorpion faces the victim it lances', () => {
    reset();
    const p = mkPred('scorpion', 'tank', 5, 2);
    const foe = mkFoe(3.5, 2);
    let active = false;
    for (let i = 0; i < 600; i++) {
        sandbox.frame++; run('abilityTick')(p);
        if (p.abilityPhase === 'active') { active = true; break; }
    }
    ok(active, 'lance never fired');
    ok(facingErrorDeg(p, foe.x, foe.y) < 15, 'off by ' + facingErrorDeg(p, foe.x, foe.y).toFixed(1) + '°');
});
check('a worker faces the pylon it is repairing', () => {
    reset();
    const pylon = { x: 4.4, y: 2, pillar: true, pillarTeam: 'red', destroyed: false,
                    health: 5, maxHealth: 20, reconstructing: false, reconstructProgress: 0 };
    sandbox.world.push(pylon); sandbox._pillarCache.push(pylon);
    const p = mkPred('ant', 'worker', 5, 2);
    for (let i = 0; i < 120; i++) { sandbox.frame++; run('workerTick')(p); }
    ok(pylon.health > 5, 'should have been repairing');
    ok(facingErrorDeg(p, pylon.x, pylon.y) < 20, 'off by ' + facingErrorDeg(p, pylon.x, pylon.y).toFixed(1) + '°');
});

group('rear-weapon species');
// faceAbdomenToward's behaviour is covered by the unit test above. Driving a
// real scorpion into firing is not a stable fixture — place the foe close
// enough to be in the rear arc and the threat scan sends it into melee first,
// place it further and the hunt AI turns the body toward the Crystal, which
// swamps the aiming being measured. So assert the call site instead of
// contorting the scenario until it passes.
check('the abdomen shot aims the rear before spawning the projectile', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/predator.js'), 'utf8');
    const at   = src.indexOf('faceAbdomenToward(');
    const shot = src.indexOf('spawnFollowerProjectile(');
    ok(at > 0, 'the abdomen path never aims');
    ok(shot > 0, 'no abdomen shot is spawned at all');
    ok(at < shot, 'aiming must happen before the shot is spawned');
});
check('melee, crystal and pylon attacks all turn to face', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/predator.js'), 'utf8');
    const n = (src.match(/faceToward\(this,/g) || []).length;
    ok(n >= 3, 'expected facing on all three attack paths, found ' + n);
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
