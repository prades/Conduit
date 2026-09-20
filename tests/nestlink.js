// Linking a broken nest to a pylon. The bug: on pointerup the follower
// ultimate-tap scan (40px radius) ran BEFORE the nest-connect handler, so a
// tap on a pylon with a follower standing near it was swallowed — the link
// failed silently and the mode cancelled itself.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const listeners = {};
const stubCanvas = {
    width: 1000, height: 700,
    addEventListener(ev, fn) { listeners[ev] = fn; },
    setPointerCapture() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 1000, height: 700 }),
};
const sandbox = {
    console, Math, Array, Object, String, Number, Set, Map, isNaN, isFinite, parseInt,
    canvas: stubCanvas,
    TILE_W: 60, TILE_H: 30,
    world: [], actors: [], followers: [], floatingTexts: [],
    player: { x: 0, y: 0, visualX: 0, visualY: 0, stunned: 0, attackCooldown: 0 },
    nestConnectMode: false, pendingConnectNest: null, nestConnectMisses: 0,
    commandMode: false, commandTarget: null, commandNestTarget: null,
    commandX: 0, commandY: 0, dragDX: 0, dragDY: 0, buildMode: false,
    gameState: { running: true },
    performance: { now: () => 0 },
    getTile: () => null,
    window: { addEventListener() {}, visualViewport: null },
    // input.js registers save-on-leave listeners at load.
    document: { addEventListener() {}, visibilityState: 'visible' },
    saveSession() {}, savePylons() {}, saveNests() {}, saveGameState() {},
};
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8'), ctx, { filename: 'js/input.js' });
const run = s => vm.runInContext(s, ctx);

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(c, m) { if (!c) throw new Error(m); }

const pylon = o => Object.assign({ pillar: true, x: 0, y: 0, destroyed: false,
    pillarTeam: 'green', health: 20, maxHealth: 20, attackMode: true, waveMode: false }, o || {});

// Screen position of a tile, matching the projection the tap handler inverts.
function screenOf(t) {
    return [
        (t.x - sandbox.player.visualX - (t.y - sandbox.player.visualY)) * 60 + sandbox.canvas.width / 2,
        (t.x - sandbox.player.visualX + (t.y - sandbox.player.visualY)) * 30 + sandbox.canvas.height / 2 + 30,
    ];
}
function setMode(nest) {
    sandbox.nestConnectMode = true;
    sandbox.pendingConnectNest = nest || { nest: true, x: 9, y: -1, nestHealth: 0, connectedPylon: null };
    sandbox.nestConnectMisses = 0;
    sandbox.floatingTexts.length = 0;
    return sandbox.pendingConnectNest;
}

group('eligibility');
check('a linked, living green pylon in a mode is eligible', () => {
    eq(run('isNestLinkablePylon')(pylon()), true, 'attack mode');
    eq(run('isNestLinkablePylon')(pylon({ attackMode: false, waveMode: true })), true, 'wave mode');
});
check('dormant, destroyed, dead and enemy pylons are not', () => {
    eq(run('isNestLinkablePylon')(pylon({ attackMode: false, waveMode: false })), false, 'dormant');
    eq(run('isNestLinkablePylon')(pylon({ destroyed: true })), false, 'destroyed');
    eq(run('isNestLinkablePylon')(pylon({ health: 0 })), false, 'dead');
    eq(run('isNestLinkablePylon')(pylon({ pillarTeam: 'red' })), false, 'enemy');
    eq(run('isNestLinkablePylon')({ x: 1, y: 1 }), false, 'not a pylon');
    eq(run('isNestLinkablePylon')(null), false, 'null');
});

group('picking the pylon');
check('a tap on a pylon finds it', () => {
    const p = pylon({ x: 3, y: 2 });
    sandbox.world.length = 0; sandbox.world.push(p);
    const [sx, sy] = screenOf(p);
    eq(run('pickNestLinkPylon')(sx, sy), p, 'should find the pylon under the tap');
});
check('THE FIX: the NEAREST pylon wins, not the last one in world order', () => {
    const near = pylon({ x: 3, y: 2 });
    const far  = pylon({ x: 5, y: 2 });
    // `far` is pushed last — the old scan kept the last match and would pick it.
    sandbox.world.length = 0; sandbox.world.push(near, far);
    const [sx, sy] = screenOf(near);
    eq(run('pickNestLinkPylon')(sx, sy), near, 'nearest should win');
});
check('a tap far from any pylon finds nothing', () => {
    sandbox.world.length = 0; sandbox.world.push(pylon({ x: 3, y: 2 }));
    const [sx, sy] = screenOf({ x: 20, y: 2 });
    eq(run('pickNestLinkPylon')(sx, sy), null, 'should miss');
});
check('an ineligible pylon is never picked', () => {
    const dormant = pylon({ x: 3, y: 2, attackMode: false, waveMode: false });
    sandbox.world.length = 0; sandbox.world.push(dormant);
    const [sx, sy] = screenOf(dormant);
    eq(run('pickNestLinkPylon')(sx, sy), null, 'dormant pylon is not a link target');
});

group('the tap handler');
check('it does nothing when no link is pending', () => {
    sandbox.nestConnectMode = false;
    eq(run('handleNestConnectTap')(500, 350), false, 'should not consume the tap');
});
check('a hit links the nest and leaves the mode', () => {
    const p = pylon({ x: 3, y: 2 });
    sandbox.world.length = 0; sandbox.world.push(p);
    const nest = setMode();
    const [sx, sy] = screenOf(p);
    eq(run('handleNestConnectTap')(sx, sy), true, 'consumed');
    eq(p.nestConnection, nest, 'pylon points at the nest');
    eq(nest.connectedPylon, p, 'nest points at the pylon');
    eq(sandbox.nestConnectMode, false, 'mode ends');
    ok(sandbox.floatingTexts.some(t => /LINKED/.test(t.text)), 'confirms to the player');
});
check('a stray tap no longer cancels the link outright', () => {
    sandbox.world.length = 0; sandbox.world.push(pylon({ x: 3, y: 2 }));
    setMode();
    const [sx, sy] = screenOf({ x: 20, y: 2 });
    eq(run('handleNestConnectTap')(sx, sy), true, 'still consumed, so nothing else grabs it');
    eq(sandbox.nestConnectMode, true, 'mode should survive one miss');
    ok(sandbox.floatingTexts.some(t => /TAP A LIT PYLON/.test(t.text)), 'tells the player what to do');
});
check('two misses in a row cancel, so the mode cannot trap you', () => {
    sandbox.world.length = 0; sandbox.world.push(pylon({ x: 3, y: 2 }));
    setMode();
    const [sx, sy] = screenOf({ x: 20, y: 2 });
    run('handleNestConnectTap')(sx, sy);
    run('handleNestConnectTap')(sx, sy);
    eq(sandbox.nestConnectMode, false, 'cancelled');
    eq(sandbox.pendingConnectNest, null, 'pending nest cleared');
    ok(sandbox.floatingTexts.some(t => /CANCELLED/.test(t.text)), 'says so');
});
check('a hit after a miss still links, and resets the miss count', () => {
    const p = pylon({ x: 3, y: 2 });
    sandbox.world.length = 0; sandbox.world.push(p);
    const nest = setMode();
    run('handleNestConnectTap')(...screenOf({ x: 20, y: 2 }));
    eq(sandbox.nestConnectMisses, 1, 'one miss banked');
    run('handleNestConnectTap')(...screenOf(p));
    eq(nest.connectedPylon, p, 'linked');
    eq(sandbox.nestConnectMisses, 0, 'miss count reset');
});

group('ordering in pointerup');
const SRC = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
const up  = SRC.slice(SRC.indexOf("addEventListener('pointerup'"));
check('THE REPORTED CASE: the pylon is handled before the follower scan', () => {
    const nest      = up.indexOf('handleNestConnectTap');
    const ultimate  = up.indexOf('ULTIMATE DOUBLE-TAP DETECTION');
    const followerU = up.indexOf('handleFollowerUIClick');
    ok(nest > 0, 'nest handler is not wired into pointerup at all');
    ok(nest < ultimate, 'the follower ultimate scan still gets first refusal');
    ok(nest < followerU, 'the follower panel still gets first refusal');
});
check('it also beats the gesture handlers', () => {
    const nest = up.indexOf('handleNestConnectTap');
    const gest = up.indexOf('detectFollowerToEnemyGesture');
    ok(gest < 0 || nest < gest, 'gestures should not pre-empt a pending link');
});
check('a long press cannot open the command menu mid-link', () => {
    const fn = SRC.slice(SRC.indexOf('function handleLongHold'), SRC.indexOf('function handleLongHold') + 400);
    ok(/if \(nestConnectMode\) return;/.test(fn), 'handleLongHold is not guarded');
});
check('the LINK highlight uses the same predicate as the tap test', () => {
    const game = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
    ok(/nestConnectMode && isNestLinkablePylon\(obj\)/.test(game),
       'the highlight re-implements eligibility instead of sharing it');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
