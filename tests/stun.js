// The player stun is gone.
//
// Dropping to zero health used to freeze you for 180 frames — three seconds of
// standing still while the fight carried on, on top of losing your health and
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
               'js/abilities.js', 'js/elements.js', 'js/helpers.js', 'js/facilityplay.js'];
const SRC = {};
for (const f of FILES) SRC[f] = fs.readFileSync(path.join(ROOT, f), 'utf8');

function constant(name) {
    const m = SRC['js/config.js'].match(new RegExp(`const\\s+${name}\\s*=\\s*(\\d+)`));
    if (!m) throw new Error(`config.js no longer defines ${name}`);
    return Number(m[1]);
}
const PLAYER_RESPAWN_GRACE = constant('PLAYER_RESPAWN_GRACE');
const PLAYER_HITS = constant('PLAYER_HITS'), PLAYER_HIT_GRACE = constant('PLAYER_HIT_GRACE');

// hurtPlayer and the knockdown block, lifted out of their real files.
function makeEnv() {
    const sandbox = {
        console, Math, Object, Array, String, Number, Set, Map, isFinite, isNaN,
        health: PLAYER_HITS, shake: 0, frame: 0,
        floatingTexts: [], actors: [], world: [], worldTileMap: new Map(),
        crystal: { x: 0, y: 2, health: 300, maxHealth: 300 },
        canvas: { width: 800, height: 600 },
        player: { x: 9, y: 9, visualX: 9, visualY: 9, targetX: 9, targetY: 9,
                  attackCooldown: 0, invuln: 0 },
        PLAYER_RESPAWN_GRACE, PLAYER_HITS, PLAYER_HIT_GRACE,
    };
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);

    const hurt = SRC['js/helpers.js'].match(/function hurtPlayer\(amount, shakeAmt, source\) \{[\s\S]*?\n\}/);
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
    // walk in handleInput (a path through the facility's doors now).
    const inp = SRC['js/input.js'];
    const at = inp.indexOf('facilityWalkTo(gx, gy)');
    ok(at > -1, 'could not find the walk in handleInput');
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
    eq(env.run('health'), PLAYER_HITS, 'all three hits again');
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
    // Six paths could hurt the player. The stun was only consulted by two, so
    // abdomen shots and the rest hit through it.
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
    env.run('health = PLAYER_HITS; player.invuln = 30');
    eq(env.run('hurtPlayer(25, 4)'), false, 'damage should be refused');
    eq(env.run('health'), PLAYER_HITS, 'health should be untouched');
    eq(env.run('shake'), 0, 'no hit shake for damage that did not land');
});

check('hurtPlayer lets damage through once the window closes', () => {
    const env = makeEnv();
    env.run('health = PLAYER_HITS; player.invuln = 0');
    eq(env.run('hurtPlayer(25, 4)'), true, 'damage should land');
    eq(env.run('health'), PLAYER_HITS - 1, 'one hit should be taken');
    eq(env.run('shake'), 4, 'hit shake should fire');
});

check('hurtPlayer never drives health below zero', () => {
    const env = makeEnv();
    env.run('health = 1');
    env.run('hurtPlayer(500, 2)');
    eq(env.run('health'), 0, 'health should floor at zero, not go negative');
});

check('zero and nonsense damage is ignored', () => {
    const env = makeEnv();
    env.run('health = 2');
    for (const arg of ['0', '-5', 'undefined', 'NaN', 'null']) {
        eq(env.run(`hurtPlayer(${arg}, 4)`), false, `hurtPlayer(${arg}) should be a no-op`);
    }
    eq(env.run('health'), 2, 'health changed on a no-op');
});

check('predator shots and specials never reach the player at all', () => {
    // "They won't shoot at you": the only predator path to the player is the
    // up-close bite. The projectile filter and the ability radius helper no
    // longer mention the player.
    const g = SRC['js/game.js'];
    ok(!/hurtPlayer\(p\.damage/.test(g), 'a predator shot still calls hurtPlayer');
    const a = SRC['js/abilities.js'];
    const at = a.indexOf('function _abForEachFoeInRadius');
    const slice = a.slice(at, a.indexOf('\nfunction ', at + 10));
    ok(!/fn\(null\)|player/.test(slice.replace(/\/\/.*$/gm, '')), 'the ability radius helper still sweeps the player in');
});

check('the bite routes through hurtPlayer and carries no immunity check of its own', () => {
    const p = SRC['js/predator.js'];
    const at = p.indexOf('THE PLAYER (its prey too');   // (the bite at the player is the creature's bite, js/predator.js bite())
    ok(at > -1, 'could not find the bite');
    const slice = p.slice(at, at + 600);
    ok(/hurtPlayer\(pwr, 4, this\)/.test(slice), 'the bite should route through hurtPlayer, with itself as the source');
    ok(!/player\.(stunned|invuln)/.test(slice), 'the bite should not re-check immunity itself');
});

group('a new game leaves a usable player');

check('THE REPORTED GAP: a new game (js/facilityplay.js facilityResetState) rebuilds every player field', () => {
    // A missing attackCooldown left `undefined <= 0` false, so the fire gate in
    // input.js stayed shut and the weapon could never be used after a reset.
    const initial = SRC['js/config.js'].match(/let player = \{[\s\S]*?\n\};/);
    const reset   = SRC['js/facilityplay.js'].match(/player = \{[\s\S]*?\};/);
    ok(initial && reset, 'could not read both player shapes');
    const fields = s => new Set([...s.matchAll(/([A-Za-z_]\w*)\s*:/g)].map(m => m[1]));
    const want = fields(initial[0]), got = fields(reset[0]);
    const missing = [...want].filter(k => !got.has(k));
    eq(missing.length, 0, `facilityResetState's player is missing: ${missing.join(', ')}`);
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
