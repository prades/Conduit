// THE CLOCK, and the costs that made it needed.
//
// THE REPORTED CASE: "Changing the graphics to high does nothing to slow it
// down, and it is slow. I believe there is something else that is slowing it
// down."
//
// Two things were. Everything in the game moved a fixed amount per call of
// render(), and render() ran once per screen refresh — so a device drawing 30
// frames a second ran the GAME at half speed, and no graphics setting could
// change that. gameLoop (game.js) now runs 60 game steps a second and draws as
// often as the screen manages; the catch-up steps run with drawing switched to
// a canvas that ignores every call.
//
// And in a night fight the follower sprite cache built about one new 168x168
// canvas EVERY frame (a texture upload each on an iPad) and held ~97 MB at its
// cap. The sprites are 1x now, and a fight's looks fit in the cache.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// A browser whose clock the test turns, and whose 2D context has a prototype
// (the catch-up steps build their do-nothing canvas from it).
const sandbox = makeBrowserSandbox({});
let NOW = 0;
sandbox.performance = { now: () => NOW };
function Ctx2D() {}
for (const k of ['fill', 'stroke', 'fillRect', 'strokeRect', 'drawImage', 'fillText', 'strokeText', 'save', 'restore',
                 'beginPath', 'closePath', 'moveTo', 'lineTo', 'arc', 'ellipse', 'quadraticCurveTo', 'bezierCurveTo',
                 'translate', 'rotate', 'scale', 'setTransform', 'transform', 'clip', 'rect', 'roundRect', 'setLineDash',
                 'createRadialGradient', 'createLinearGradient', 'measureText', 'getLineDash'])
    Ctx2D.prototype[k] = function () {};
sandbox.CanvasRenderingContext2D = Ctx2D;
const context = vm.createContext(sandbox);
for (const rel of scriptOrder()) {
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); }
    catch (e) { console.log('  (load ' + rel + ': ' + e.message + ')'); }
}
const run = src => vm.runInContext(src, context);

// A context that counts what is painted on it — the real picture's cost.
// (Path building — moveTo, arc … — is not counted: it is the paints that cost.)
const PAINT = new Set(['fill', 'stroke', 'drawImage', 'fillRect', 'strokeRect', 'fillText', 'strokeText']);
const counts = { n: 0 };
sandbox.__counting = new Proxy({}, {
    get(t, k) {
        if (k in t) return t[k];
        if (k === 'canvas') return run('canvas');
        return (...a) => {
            if (PAINT.has(k)) counts.n++;
            if (k === 'createRadialGradient' || k === 'createLinearGradient') return { addColorStop() {} };
            if (k === 'measureText') return { width: 10 };
            if (k === 'getLineDash') return [];
            return undefined;
        };
    },
    set(t, k, v) { t[k] = v; return true; },
});
run(`gameState.running = true; 
     ctx = __counting;`);
for (let i = 0; i < 30; i++) run('render();');   // settle the scene

// One refresh of the real loop, `ms` after the last one.
function tick(ms) {
    NOW += ms;
    const f0 = run('frame'), n0 = counts.n;
    run('gameLoop();');
    return { steps: run('frame') - f0, ops: counts.n - n0 };
}

console.log('\nTHE CLOCK');
check('a direct render() is still exactly one step and one picture', () => {
    const f0 = run('frame'), n0 = counts.n;
    run('render();');
    same(run('frame') - f0, 1, 'steps');
    ok(counts.n - n0 > 20, 'and it drew the picture: ' + (counts.n - n0) + ' paints');
});
// Prime the loop's own clock.
tick(1000 / 60); tick(1000 / 60);
check('THE ASK: a 60 Hz screen runs one game step per refresh', () => {
    // Real refreshes jitter either side of 16.7 ms; each must still be one step.
    for (let i = 0; i < 60; i++) {
        const t = tick(i % 2 ? 16.0 : 17.3);
        same(t.steps, 1, 'refresh ' + i);
    }
});
check('THE ASK: a screen managing 20 frames a second still runs the GAME at full speed', () => {
    let steps = 0;
    for (let i = 0; i < 20; i++) steps += tick(50).steps;   // one second of 50 ms frames
    ok(steps >= 58 && steps <= 62, 'one second of play was ' + steps + ' game steps, not 60');
});
check('…and the catch-up steps are not drawn: one picture per refresh, not three', () => {
    const one = (() => { const n0 = counts.n; run('render();'); return counts.n - n0; })();
    const t = tick(50);
    same(t.steps, 3, 'steps in a 50 ms refresh');
    ok(t.ops < one * 1.5, 'a 3-step refresh asked for ' + t.ops + ' canvas operations; one picture is ' + one);
});
check('the real canvas is back after the catch-up steps', () => {
    tick(50);
    ok(run('ctx === __counting'), 'ctx was left pointing at the do-nothing canvas');
});
check('a very slow refresh catches up a bounded amount (no spiral)', () => {
    const t = tick(400);
    ok(t.steps >= 1 && t.steps <= run('SIM_MAX_STEPS'), t.steps + ' steps in one refresh');
});
check('a 120 Hz screen no longer runs the game at double speed', () => {
    let steps = 0;
    for (let i = 0; i < 120; i++) steps += tick(1000 / 120).steps;
    ok(steps >= 58 && steps <= 62, 'one second at 120 Hz was ' + steps + ' game steps');
});
check('paused, nothing moves — and coming back does not fast-forward', () => {
    run('gameState.running = false;');
    const t = tick(3000);
    same(t.steps, 0, 'steps while paused');
    run('gameState.running = true;');
    same(tick(1000 / 60).steps, 1, 'steps on the first refresh back');
});

console.log('\nTHE FOLLOWER SPRITES');
run('ctx = __counting;');
check('a sprite is drawn at 1x (it was 2x: four times the memory, thrown away when stamped)', () => {
    const cv = run(`(function(){ const f = { isFollower: true, element: 'fire', stats: { attack: 14, specialAttack: 12, accuracy: 10 }, state: 'idle', walkCycle: 0 };
        _virusSprites.clear(); return _virusSprite(f, false, 255, 80, 0, 0); })()`);
    ok(cv, 'no sprite was made');
    same(cv.width, run('VSPR_W'), 'sprite width');
});
check('THE ASK: a fighting follower\'s every look fits in the cache, so a fight does not build a canvas a frame', () => {
    const n = run(`(function(){
        _virusSprites.clear();
        const f = { isFollower: true, element: 'fire', stats: { attack: 15, specialAttack: 13, accuracy: 11 }, state: 'idle', walkCycle: 0, attackAnim: 0 };
        for (let i = 0; i < 400; i++) {
            f.walkCycle = i * 0.137; f.attackAnim = i * 0.29;
            f.state = i % 3 ? 'attack' : 'idle';
            _virusSprite(f, i % 5 === 0, 255, 80, 0, f.walkCycle);
        }
        return _virusSprites.size; })()`);
    ok(n <= 48, 'one follower in a fight made ' + n + ' different sprites');
});
check('a hit keeps a sprite: the cache drops the least recently USED', () => {
    const r = run(`(function(){
        _virusSprites.clear();
        const f = { isFollower: true, element: 'ice', stats: {}, state: 'idle', walkCycle: 0 };
        const first = _virusSprite(f, false, 1, 2, 3, 0);
        for (let i = 0; i < VIRUS_SPRITE_CAP - 1; i++) _virusSprite(f, false, 10 + i, 0, 0, 0);
        _virusSprite(f, false, 1, 2, 3, 0);                      // used again
        _virusSprite(f, false, 9999, 0, 0, 0);                   // one more: something must go
        return _virusSprite(f, false, 1, 2, 3, 0) === first; })()`);
    ok(r, 'the sprite in use was evicted and rebuilt');
});

console.log('\nTHE SHIELD GENERATOR');
check('it is stamped, not drawn path by path (it was 13 paints each)', () => {
    run('drawShieldGenerator(100, 100, true, 0.5); drawShieldGenerator(100, 100, false, 0.5);');   // build the sprites
    const n0 = counts.n;
    run('drawShieldGenerator(100, 100, true, 0.5);');
    const on = counts.n - n0;
    ok(on <= 5, 'a working generator took ' + on + ' paints');
});

console.log(failures ? `\n${failures} FAILING` : '\nall passing');
process.exit(failures ? 1 : 0);
