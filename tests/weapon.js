// The player's weapon. Tapping used to fire at any predator the tap happened to
// land near, so brushing one while moving spent a shot. Firing is now gated
// behind an attack mode armed from the radial menu, and costs ammo.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { fnSource } = require('./domstub.js');

let store = {};
function makeEnv() {
    const shots = [];
    const sandbox = {
        console, Math, Array, Object, String, Number, Set, Map, isNaN, isFinite, parseInt,
        canvas: {
            width: 1000, height: 700,
            addEventListener() {}, setPointerCapture() {},
            getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 700 }),
        },
        TILE_W: 60, TILE_H: 30,
        world: [], actors: [], followers: [], floatingTexts: [], shots,
        player: { x: 0, y: 0, visualX: 0, visualY: 0, invuln: 0, attackCooldown: 0, selectedElement: 'fire' },
        ELEMENTS: [{ id: 'fire', label: 'FIRE', color: '#ff3300' }],
        playerAttackMode: false, playerAmmo: 5,
        PLAYER_AMMO_MAX: 60, PLAYER_AMMO_START: 12,
        _ATKCHIP: { x: 0, y: 0, w: 0, h: 0 },
        commandMode: false, commandTarget: null, commandNestTarget: null, commandEnemyTarget: null,
        commandX: 0, commandY: 0, dragDX: 0, dragDY: 0, buildMode: false,
        nestConnectMode: false, pendingConnectNest: null, nestConnectMisses: 0,
        gameState: { running: true },
        performance: { now: () => 0 },
        getTile: () => null,
        // handleInput checks the crystal before the weapon, so these have to exist.
        crystal: { x: -99, y: -99, health: 300, maxHealth: 300 },
        crystalMenuOpen: false,
        isTapNearCrystal: () => false,
        spawnFollowerProjectile(src, target) { shots.push({ target }); },
        saveAmmo() { store.ammo = String(sandbox.playerAmmo); },
        savePylons() {}, saveNests() {}, saveGameState() {}, saveSession() {},
        window: { addEventListener() {}, visualViewport: null },
        document: { addEventListener() {}, visibilityState: 'visible' },
    };
    // Predator is an identity class here; only instanceof matters to the filter.
    sandbox.Predator = class Predator {};
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    // input.js asks whether a tap landed on the home portal. The REAL
    // predicate, evaluated from helpers.js — a stub here would be a second
    // copy of the rule and would not follow it when it changes.
    vm.runInContext(fnSource('js/helpers.js', 'isHomePortal'), ctx, { filename: 'helpers.js:isHomePortal' });
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8'), ctx, { filename: 'js/input.js' });
    return { sandbox, shots, run: s => vm.runInContext(s, ctx) };
}

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// Place a predator and return the screen point the hit-test expects.
function putEnemy(env, wx, wy) {
    const p = new env.sandbox.Predator();
    Object.assign(p, { x: wx, y: wy, dead: false, team: 'red', isClone: false, health: 100, maxHealth: 100 });
    env.sandbox.actors.push(p);
    const pl = env.sandbox.player;
    const sx = (wx - pl.visualX - (wy - pl.visualY)) * 60 + env.sandbox.canvas.width / 2;
    const sy = (wx - pl.visualX + (wy - pl.visualY)) * 30 + env.sandbox.canvas.height / 2 + 30;
    return { foe: p, sx, sy: sy - 55 };
}

group('firing is gated');
check('THE REPORTED CASE: a tap does not fire when the weapon is stowed', () => {
    const env = makeEnv();
    const { sx, sy } = putEnemy(env, 2, 1);
    env.sandbox.playerAttackMode = false;
    env.run(`handleInput(${sx}, ${sy})`);
    eq(env.shots.length, 0, 'should not have fired');
    eq(env.sandbox.playerAmmo, 5, 'and should not have spent ammo');
});
check('once armed, a tap on an enemy fires', () => {
    const env = makeEnv();
    const { foe, sx, sy } = putEnemy(env, 2, 1);
    env.sandbox.playerAttackMode = true;
    env.run(`handleInput(${sx}, ${sy})`);
    eq(env.shots.length, 1, 'should have fired');
    eq(env.shots[0].target, foe, 'at the enemy under the tap');
});
check('armed, repeated taps keep firing', () => {
    const env = makeEnv();
    const { sx, sy } = putEnemy(env, 2, 1);
    env.sandbox.playerAttackMode = true;
    for (let i = 0; i < 3; i++) {
        env.sandbox.player.attackCooldown = 0;
        env.run(`handleInput(${sx}, ${sy})`);
    }
    eq(env.shots.length, 3, 'three taps, three shots');
});
check('a player who was just knocked down can still fire', () => {
    // There is no stun any more. The knockdown leaves a damage-immune window,
    // and that window must not double as a weapons lock — see tests/stun.js.
    const env = makeEnv();
    const { sx, sy } = putEnemy(env, 2, 1);
    env.sandbox.playerAttackMode = true;
    env.sandbox.player.invuln = 60;
    env.run(`handleInput(${sx}, ${sy})`);
    eq(env.shots.length, 1, 'the grace window should not stop you shooting back');
});
check('the cooldown still applies while armed', () => {
    const env = makeEnv();
    const { sx, sy } = putEnemy(env, 2, 1);
    env.sandbox.playerAttackMode = true;
    env.run(`handleInput(${sx}, ${sy})`);
    env.run(`handleInput(${sx}, ${sy})`);     // cooldown not cleared
    eq(env.shots.length, 1, 'second tap should be on cooldown');
});

group('target selection');
check('allies, clones and the dead are never targets', () => {
    const env = makeEnv();
    const { foe, sx, sy } = putEnemy(env, 2, 1);
    foe.team = 'green';
    eq(env.run(`findEnemyAtScreen(${sx}, ${sy})`), null, 'ally');
    foe.team = 'red'; foe.isClone = true;
    eq(env.run(`findEnemyAtScreen(${sx}, ${sy})`), null, 'clone');
    foe.isClone = false; foe.dead = true;
    eq(env.run(`findEnemyAtScreen(${sx}, ${sy})`), null, 'dead');
});
check('a tap on empty ground finds nothing', () => {
    const env = makeEnv();
    putEnemy(env, 2, 1);
    eq(env.run('findEnemyAtScreen(20, 20)'), null, 'far corner');
});

group('ammo');
check('each shot spends a round', () => {
    const env = makeEnv();
    const { sx, sy } = putEnemy(env, 2, 1);
    env.sandbox.playerAttackMode = true;
    env.sandbox.playerAmmo = 3;
    env.run(`handleInput(${sx}, ${sy})`);
    eq(env.sandbox.playerAmmo, 2, 'one round spent');
});
check('an empty magazine fires nothing and says so', () => {
    const env = makeEnv();
    const { foe } = putEnemy(env, 2, 1);
    env.sandbox.playerAmmo = 0;
    eq(env.run('firePlayerShot')(foe), false, 'should refuse');
    eq(env.shots.length, 0, 'no shot');
    ok(env.sandbox.floatingTexts.some(t => /OUT OF AMMO/.test(t.text)), 'should tell the player');
});
check('ammo never goes negative', () => {
    const env = makeEnv();
    const { foe } = putEnemy(env, 2, 1);
    env.sandbox.playerAmmo = 1;
    env.run('firePlayerShot')(foe);
    env.sandbox.player.attackCooldown = 0;
    env.run('firePlayerShot')(foe);
    eq(env.sandbox.playerAmmo, 0, 'floored at zero');
});
check('firing persists the new count', () => {
    store = {};
    const env = makeEnv();
    const { foe } = putEnemy(env, 2, 1);
    env.sandbox.playerAmmo = 4;
    env.run('firePlayerShot')(foe);
    eq(store.ammo, '3', 'saved');
});
check('a dead target is not worth a round', () => {
    const env = makeEnv();
    const { foe } = putEnemy(env, 2, 1);
    foe.dead = true;
    env.sandbox.playerAmmo = 4;
    eq(env.run('firePlayerShot')(foe), false, 'refused');
    eq(env.sandbox.playerAmmo, 4, 'no round spent');
});

group('arming');
check('setPlayerAttackMode flips the mode and announces it', () => {
    const env = makeEnv();
    env.run('setPlayerAttackMode(true)');
    eq(env.sandbox.playerAttackMode, true, 'armed');
    ok(env.sandbox.floatingTexts.some(t => /ARMED/.test(t.text)), 'announced');
    env.run('setPlayerAttackMode(false)');
    eq(env.sandbox.playerAttackMode, false, 'stowed');
    ok(env.sandbox.floatingTexts.some(t => /STOWED/.test(t.text)), 'announced');
});
check('a long press over an enemy records it as the command target', () => {
    const env = makeEnv();
    const { foe, sx, sy } = putEnemy(env, 2, 1);
    env.run(`handleLongHold(${sx}, ${sy})`);
    eq(env.sandbox.commandEnemyTarget, foe, 'enemy picked up by the long press');
});
check('a long press over empty ground records no enemy', () => {
    const env = makeEnv();
    putEnemy(env, 2, 1);
    env.run('handleLongHold(20, 20)');
    eq(env.sandbox.commandEnemyTarget, null, 'no enemy');
});

group('wiring');
const INPUT  = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
const DRAW   = fs.readFileSync(path.join(ROOT, 'js/draw.js'), 'utf8');
const CMD    = fs.readFileSync(path.join(ROOT, 'js/commands.js'), 'utf8');
const SHOP   = fs.readFileSync(path.join(ROOT, 'js/wavedata.js'), 'utf8');
const WAVES  = fs.readFileSync(path.join(ROOT, 'js/waves.js'), 'utf8');

check('the only tap-fire path checks playerAttackMode first', () => {
    const at = INPUT.indexOf('if (playerAttackMode && player.attackCooldown <= 0)');
    ok(at > 0, 'the gate is gone from handleInput');
    // and nothing else calls firePlayerShot from a plain tap
    const calls = (INPUT.match(/firePlayerShot\(/g) || []).length;
    ok(calls <= 2, 'unexpected extra fire path in input.js: ' + calls);
});
check('the radial offers ATTACK on an enemy and STOW once armed', () => {
    ok(/commandEnemyTarget && !commandEnemyTarget\.dead/.test(DRAW), 'no enemy branch in the radial');
    ok(/playerAttackMode \? "STOW" : "ATTACK"/.test(DRAW), 'no arm/stow label');
    ok(/selectedRadialAction = playerAttackMode \? "stow_weapon" : "attack_mode"/.test(DRAW), 'no action wired');
});
check('both radial actions are handled', () => {
    ok(/case "attack_mode"/.test(CMD), 'attack_mode unhandled');
    ok(/case "stow_weapon"/.test(CMD), 'stow_weapon unhandled');
});
check('arming fires at the enemy that was long-pressed', () => {
    const at = CMD.indexOf('case "attack_mode"');
    const body = CMD.slice(at, at + 400);
    ok(/firePlayerShot\(commandEnemyTarget\)/.test(body), 'arming should also take the shot');
});
check('THE SHOP IS GONE: ammo comes from hacking a panel', () => {
    // The shop sold ammo; with it removed that was the only source, which
    // would have left the weapon permanently dry after the opening magazine.
    const GAME = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
    const CFG  = fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8');
    ok(!/id:"ammo_resupply"/.test(SHOP), 'the shop ammo item is back');
    ok(!/SHOP_ITEMS/.test(SHOP), 'the shop item list is back');
    const reward = CFG.match(/const PANEL_AMMO_REWARD = (\d+)/);
    ok(reward, 'no panel ammo reward defined');
    ok(Number(reward[1]) > 0, 'the panel reward should actually give rounds');
    // Paid out where the panel pays shards, and capped.
    const at = GAME.indexOf('shardCount += t.shardReward;');
    ok(at > -1, 'could not find the panel payout');
    const block = GAME.slice(at, at + 700);
    ok(/PANEL_AMMO_REWARD/.test(block), 'a hacked panel does not yield ammo');
    ok(/PLAYER_AMMO_MAX - playerAmmo/.test(block), 'the ammo gain is not capped');
    ok(/saveAmmo\(\)/.test(block), 'the gain is not persisted');
});

check('a decoy panel pays nothing — no shards, no ammo', () => {
    // The decoy trips the alarm instead of paying out, and that has to stay
    // true for ammo as well or the alarm becomes a free resupply.
    const GAME = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
    const at = GAME.indexOf('if (t.isDecoy) {');
    ok(at > -1, 'could not find the decoy branch');
    const decoy = GAME.slice(at, GAME.indexOf('} else {', at));
    ok(!/PANEL_AMMO_REWARD|playerAmmo/.test(decoy), 'a decoy hands out ammo');
    ok(!/shardCount/.test(decoy), 'a decoy hands out shards');
});
check('a new game resets the magazine and stows the weapon', () => {
    ok(/clearAmmo\(\)/.test(WAVES), 'restartGame does not clear ammo');
    ok(/playerAttackMode\s*=\s*false/.test(WAVES), 'restartGame leaves the weapon armed');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
