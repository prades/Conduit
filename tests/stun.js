// The player stun is gone.
//
// Dropping to zero health used to freeze you for 180 frames — three seconds of
// standing still while the night carried on, on top of losing your health and
// your position. Control is never taken away now. A short damage-immune window
// replaces it, purely so a predator parked by the Crystal cannot chain-kill on
// arrival.
//
// The window is also the reason this is not a one-line deletion: player.stunned
// doubled as the immunity check, and it was only consulted in two of the six
// places that can hurt the player. All of them go through hurtPlayer() now.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const FILES = ['js/config.js', 'js/game.js', 'js/input.js', 'js/predator.js',
               'js/abilities.js', 'js/elements.js', 'js/helpers.js', 'js/waves.js'];
const SRC = {};
for (const f of FILES) SRC[f] = fs.readFileSync(path.join(ROOT, f), 'utf8');

function constant(name) {
    const m = SRC['js/config.js'].match(new RegExp(`const\\s+${name}\\s*=\\s*(\\d+)`));
    if (!m) throw new Error(`config.js no longer defines ${name}`);
    return Number(m[1]);
}
const PLAYER_RESPAWN_GRACE = constant('PLAYER_RESPAWN_GRACE');

// hurtPlayer and the knockdown block, lifted out of their real files.
function makeEnv() {
    const sandbox = {
        console, Math, Object, Array, String, Number, Set, Map, isFinite, isNaN,
        health: 100, shake: 0, frame: 0,
        floatingTexts: [], actors: [], world: [], worldTileMap: new Map(),
        crystal: { x: 0, y: 2, health: 300, maxHealth: 300 },
        canvas: { width: 800, height: 600 },
        player: { x: 9, y: 9, visualX: 9, visualY: 9, targetX: 9, targetY: 9,
                  attackCooldown: 0, invuln: 0 },
        PLAYER_RESPAWN_GRACE,
        ZONE_LENGTH: 15,
    };
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);

    const hurt = SRC['js/helpers.js'].match(/function hurtPlayer\(amount, shakeAmt\) \{[\s\S]*?\n\}/);
    if (!hurt) { console.log('  FAIL could not find hurtPlayer in js/helpers.js'); process.exit(1); }
    vm.runInContext(hurt[0], ctx, { filename: 'helpers.js:hurtPlayer' });

    // The knockdown block out of game.js's update(), wrapped so it can be ticked.
    const kd = SRC['js/game.js'].match(/\/\/ ── PLAYER KNOCKDOWN ──[\s\S]*?\n    \}\n/);
    if (!kd) { console.log('  FAIL could not find the knockdown block in js/game.js'); process.exit(1); }
    vm.runInContext('function knockdownTick() {\n' + kd[0] + '\n}', ctx,
                    { filename: 'game.js:knockdown' });
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

group('the stun is gone');

check('THE REPORTED CASE: no stun state exists anywhere', () => {
    const left = FILES.filter(f => /player\.stunned|stunned:/.test(SRC[f]));
    eq(left.length, 0, `still carrying a player stun: ${left.join(', ')}`);
});

check('movement is never blocked', () => {
    // The old gate was a bare `if (player.stunned) return;` ahead of the
    // move-target assignment in handleInput.
    const inp = SRC['js/input.js'];
    const at = inp.indexOf('player.targetX=gx');
    ok(at > -1, 'could not find the move-target assignment');
    const before = inp.slice(Math.max(0, at - 900), at);
    ok(!/\bif\s*\(\s*player\.(stunned|invuln)\s*\)\s*return/.test(before),
       'something still refuses to move the player');
});

check('firing is never blocked by a timer that was never initialised', () => {
    ok(!/playerAttackMode && !?player\.stunned/.test(SRC['js/input.js']),
       'the fire gate still consults a stun');
});

check('being dropped to zero does not lock control', () => {
    const env = makeEnv();
    env.run('health = 0');
    env.run('knockdownTick()');
    ok(env.run('health') > 0, 'health should be restored on knockdown');
    // Whatever the knockdown set, it must not be something input.js checks to
    // refuse movement — and the only survivor is invuln, which does not.
    ok(env.run('player.invuln') > 0, 'the grace window should be running');
    const inp = SRC['js/input.js'];
    ok(!inp.includes('player.invuln'), 'input.js should not consult the grace window at all');
});

check('the red STUNNED vignette is gone from the render loop', () => {
    const g = SRC['js/game.js'];
    ok(!/STUNNED/.test(g), 'the STUNNED overlay text is still drawn');
    ok(!/PLAYER STUN FLASH/.test(g), 'the stun vignette block is still there');
});

group('the knockdown itself');

check('you are put back at the Crystal with health and a grace window', () => {
    const env = makeEnv();
    env.run('health = 0');
    env.run('knockdownTick()');
    eq(env.run('health'), 40, 'partial restore');
    eq(env.run('player.x'), env.run('crystal.x + 2'), 'moved next to the Crystal');
    eq(env.run('player.y'), env.run('crystal.y'), 'moved next to the Crystal');
    eq(env.run('player.targetX'), env.run('player.x'), 'walk target should follow, not drag you back');
    eq(env.run('player.visualX'), env.run('player.x'), 'sprite should not slide across the map');
    eq(env.run('player.invuln'), PLAYER_RESPAWN_GRACE, 'grace window');
    ok(env.sandbox.floatingTexts.length === 1, 'the player should be told what happened');
    ok(!/STUN/i.test(env.sandbox.floatingTexts[0].text),
       'the callout still says STUNNED: ' + env.sandbox.floatingTexts[0].text);
});

check('the grace window runs down and does not go negative', () => {
    const env = makeEnv();
    env.run('health = 0');
    env.run('knockdownTick()');
    for (let i = 0; i < PLAYER_RESPAWN_GRACE + 30; i++) env.run('knockdownTick()');
    eq(env.run('player.invuln'), 0, 'the window should settle at zero');
});

check('the grace window is short — it is not a stun by another name', () => {
    const secs = PLAYER_RESPAWN_GRACE / 60;
    ok(secs <= 2, `the grace window is ${secs}s long`);
    // The old stun was 180 frames. Anything near that is the same punishment.
    ok(PLAYER_RESPAWN_GRACE < 180, 'as long as the stun it replaced');
});

check('a knockdown does not retrigger every frame', () => {
    const env = makeEnv();
    env.run('health = 0');
    for (let i = 0; i < 10; i++) env.run('knockdownTick()');
    eq(env.sandbox.floatingTexts.length, 1, 'knocked down more than once from one death');
});

group('the grace window actually covers everything');

check('THE REPORTED GAP: every player-damage path goes through hurtPlayer', () => {
    // Six paths can hurt the player. The stun was only consulted by two, so
    // abdomen shots, vent blasts, acid pools and toxic zones hit through it.
    const raw = [];
    for (const f of ['js/game.js', 'js/elements.js', 'js/predator.js', 'js/abilities.js']) {
        const lines = SRC[f].split('\n');
        lines.forEach((l, i) => {
            if (/health\s*=\s*Math\.max\(0,\s*health\s*-/.test(l)) raw.push(`${f}:${i + 1}`);
        });
    }
    eq(raw.length, 0, `these still subtract player health directly: ${raw.join(', ')}`);
});

check('hurtPlayer refuses damage while the window is up', () => {
    const env = makeEnv();
    env.run('health = 100; player.invuln = 30');
    eq(env.run('hurtPlayer(25, 4)'), false, 'damage should be refused');
    eq(env.run('health'), 100, 'health should be untouched');
    eq(env.run('shake'), 0, 'no hit shake for damage that did not land');
});

check('hurtPlayer lets damage through once the window closes', () => {
    const env = makeEnv();
    env.run('health = 100; player.invuln = 0');
    eq(env.run('hurtPlayer(25, 4)'), true, 'damage should land');
    eq(env.run('health'), 75, 'health should drop');
    eq(env.run('shake'), 4, 'hit shake should fire');
});

check('hurtPlayer never drives health below zero', () => {
    const env = makeEnv();
    env.run('health = 5');
    env.run('hurtPlayer(500, 2)');
    eq(env.run('health'), 0, 'health should floor at zero, not go negative');
});

check('zero and nonsense damage is ignored', () => {
    const env = makeEnv();
    env.run('health = 50');
    for (const arg of ['0', '-5', 'undefined', 'NaN', 'null']) {
        eq(env.run(`hurtPlayer(${arg}, 4)`), false, `hurtPlayer(${arg}) should be a no-op`);
    }
    eq(env.run('health'), 50, 'health changed on a no-op');
});

check('a projectile is still consumed when the window eats it', () => {
    // Otherwise the shot passes through and can hit again a frame later.
    const g = SRC['js/game.js'];
    const at = g.indexOf('hurtPlayer(p.damage, 5)');
    ok(at > -1, 'the abdomen-shot path no longer calls hurtPlayer');
    const after = g.slice(at, at + 200);
    ok(/hit = true/.test(after), 'the projectile is not marked as hit');
});

check('the melee swipe no longer carries its own immunity check', () => {
    const p = SRC['js/predator.js'];
    const at = p.indexOf('PLAYER HIT');
    ok(at > -1, 'could not find the player-hit branch');
    const slice = p.slice(at, at + 400);
    ok(/hurtPlayer\(/.test(slice), 'melee should route through hurtPlayer');
    ok(!/player\.(stunned|invuln)/.test(slice), 'melee should not re-check immunity itself');
});

check('the ability radius helper gates the player, and not on the old stun', () => {
    // This used to assert the player was swept in unconditionally. Predators no
    // longer attack the player at all, so the branch is still there — the helper
    // drives non-damaging effects too — but it is gated on
    // predatorMayHurtPlayer() rather than removed. Sliced to the function
    // rather than a fixed 700 characters: adding the gate pushed fn(null) past
    // that window and failed this check on correct code.
    const a = SRC['js/abilities.js'];
    const at = a.indexOf('function _abForEachFoeInRadius');
    const slice = a.slice(at, a.indexOf('\nfunction ', at + 10));
    ok(/fn\(null\)/.test(slice), 'the player branch has been removed entirely');
    ok(/predatorMayHurtPlayer\(\)/.test(slice), 'the player branch is not gated');
    ok(!/player\.stunned/.test(slice), 'still gating on the old stun');
});

group('a reset leaves a usable player');

check('THE REPORTED GAP: restartGame rebuilds every player field', () => {
    // A missing attackCooldown left `undefined <= 0` false, so the fire gate in
    // input.js stayed shut and the weapon could never be used after a reset.
    const initial = SRC['js/config.js'].match(/let player = \{[\s\S]*?\n\};/);
    const reset   = SRC['js/waves.js'].match(/player=\{[\s\S]*?\};/);
    ok(initial && reset, 'could not read both player shapes');
    const fields = s => new Set([...s.matchAll(/([A-Za-z_]\w*)\s*:/g)].map(m => m[1]));
    const want = fields(initial[0]), got = fields(reset[0]);
    const missing = [...want].filter(k => !got.has(k));
    eq(missing.length, 0, `restartGame's player is missing: ${missing.join(', ')}`);
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
