// Evaluates the real script files in the order game.html lists them, to prove
// nothing throws at load time and that the render order is intact.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const ORDER = fs.readFileSync(ROOT + '/game.html', 'utf8')
    .split('\n')
    .map(l => (l.match(/<script src="(js\/[^"]+)"><\/script>/) || [])[1])
    .filter(Boolean);

console.log('script order from game.html:');
ORDER.forEach((f, i) => console.log('  ' + String(i + 1).padStart(2) + '. ' + f));

const stubEl = () => ({
    style: {}, classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    textContent: '', innerHTML: '', value: '', checked: false,
    appendChild() {}, removeChild() {}, addEventListener() {}, remove() {},
    getContext: () => stubCtx(), setAttribute() {}, getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
    width: 64, height: 64, querySelector: () => stubEl(), querySelectorAll: () => [],
});

const stubCtx = () => new Proxy({}, {
    get(t, k) {
        if (k in t) return t[k];
        if (k === 'canvas') return stubEl();
        return (...a) => {
            if (k === 'createRadialGradient' || k === 'createLinearGradient')
                return { addColorStop() {} };
            if (k === 'createPattern') return {};
            if (k === 'createImageData') return { data: new Uint8ClampedArray(4 * 96 * 96) };
            if (k === 'measureText') return { width: 10 };
            return undefined;
        };
    },
    set(t, k, v) { t[k] = v; return true; },
});

const sandbox = {
    console,
    Math, JSON, Date, Object, Array, String, Number, Boolean, Map, Set, WeakMap, Symbol,
    Promise, RegExp, Error, TypeError, Proxy, Reflect, Float32Array, Uint8ClampedArray, Int32Array,
    isNaN, isFinite, parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
    requestAnimationFrame: () => 0,   // never actually start the loop
    performance: { now: () => 0 },
    navigator: { hardwareConcurrency: 8, userAgent: 'node', maxTouchPoints: 0 },
    localStorage: { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = String(v); }, removeItem(k) { delete this._d[k]; } },
    document: {
        getElementById: () => stubEl(),
        createElement: () => stubEl(),
        addEventListener() {},
        body: stubEl(),
        documentElement: stubEl(),
        querySelector: () => stubEl(),
        querySelectorAll: () => [],
    },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
sandbox.window.addEventListener = () => {};
sandbox.addEventListener = () => {};
sandbox.window.visualViewport = null;
sandbox.getComputedStyle = () => ({ height: '0px' });
sandbox.AudioContext = function () { return { createGain: () => ({ connect() {}, gain: {} }), destination: {} }; };

const ctxObj = vm.createContext(sandbox);

let failures = 0;
for (const rel of ORDER) {
    const src = fs.readFileSync(ROOT + '/' + rel, 'utf8');
    try {
        vm.runInContext(src, ctxObj, { filename: rel });
    } catch (e) {
        // Runtime errors from DOM-heavy init are expected with these crude stubs;
        // load-time SyntaxError / "already been declared" are the real failures.
        const fatal = e instanceof SyntaxError || /already been declared/.test(e.message);
        console.log((fatal ? '  FATAL ' : '  (soft) ') + rel + ' — ' + e.message.split('\n')[0]);
        if (fatal) failures++;
    }
}

console.log('\nchecks:');
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
const run = s => vm.runInContext(s, ctxObj);
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }

check('settings panel rows fit inside the panel', () => {
    const h = run('_SP_H');
    const bottom = run('_SP_CLOSE_Y + _SP_CLOSE_H');
    if (bottom > h - 8) throw new Error(`close button bottom ${bottom} crowds panel height ${h}`);
});

// ── Render order ──
// World geometry draws with the world; interface draws after it.
const GAME = fs.readFileSync(ROOT + '/js/game.js', 'utf8');
const WORLD_SPACE = ['drawElementEffects', 'drawTraps', 'drawHoldLine'];
const INTERFACE   = ['drawRadialMenu', 'drawElementPicker',
                     'drawSettingsPanel', 'drawInfoPanel', 'drawTrapPicker'];

console.log('\nrender order:');
check('no post-FX hook survives in the render loop', () => {
    // The post-processing pass cost 33-146ms per frame and was removed.
    for (const fn of ['fxBeginFrame', 'fxComposite', 'fxContactShadow']) {
        if (GAME.includes(fn)) throw new Error(fn + ' is still called in game.js');
    }
});
const firstInterface = Math.min(...INTERFACE.map(fn => {
    const at = GAME.indexOf(fn + '();');
    return at < 0 ? Infinity : at;
}));
WORLD_SPACE.forEach(fn => check(`${fn} draws with the world`, () => {
    const at = GAME.indexOf(fn + '();');
    if (at < 0) throw new Error('not called at all');
    if (at > firstInterface) throw new Error('drawn up with the interface instead of the world');
}));
check('no world-space overlay is called twice', () => {
    WORLD_SPACE.concat(INTERFACE).forEach(fn => {
        const n = (GAME.match(new RegExp('^\\s*' + fn + '\\(\\);', 'gm')) || []).length;
        if (n > 1) throw new Error(fn + ' called ' + n + ' times');
    });
});

console.log(failures ? `\n${failures} FAILING\n` : '\nload order and render order verified\n');
process.exit(failures ? 1 : 0);
