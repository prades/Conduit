// A browser, and nothing else.
//
// Every other suite hand-builds its sandbox: it declares the handful of game
// globals the code under test happens to touch. That is fine for testing one
// function, but it means a variable the game reads and never declares is
// invisible — the fixture supplies it. That is exactly how the shop removal
// shipped a crash: five perm-bonus scalars lost their declarations, six files
// kept reading them, and three suites were injecting them into the sandbox.
//
// So this stub supplies DOM, timers and storage, and deliberately supplies no
// game state at all. Anything the game needs, the game has to declare.
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// The <script> tags, in the order the page lists them.
function scriptOrder() {
    return fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8')
        .split('\n')
        .map(l => (l.match(/<script src="(js\/[^"]+)"><\/script>/) || [])[1])
        .filter(Boolean);
}

const stubEl = () => ({
    style: {}, classList: { add() {}, remove() {}, contains: () => false, toggle() {} },
    textContent: '', innerHTML: '', value: '', checked: false,
    appendChild() {}, removeChild() {}, addEventListener() {}, remove() {},
    getContext: () => stubCtx(), setAttribute() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
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

// `store` is handed in so a test can seed localStorage before the page boots,
// which is the only way to exercise the restore-from-save paths.
function makeBrowserSandbox(store = {}) {
    const sandbox = {
        console,
        Math, JSON, Date, Object, Array, String, Number, Boolean, Map, Set, WeakMap, Symbol,
        Promise, RegExp, Error, TypeError, Proxy, Reflect,
        Float32Array, Uint8ClampedArray, Int32Array,
        isNaN, isFinite, parseInt, parseFloat, encodeURIComponent, decodeURIComponent,
        setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {},
        requestAnimationFrame: () => 0,   // never actually start the loop
        performance: { now: () => 0 },
        navigator: { hardwareConcurrency: 8, userAgent: 'node', maxTouchPoints: 0 },
        // No config files on disk here, and the game already handles that.
        fetch: () => Promise.resolve({ ok: false, json: () => Promise.resolve({}) }),
        localStorage: {
            getItem(k) { return k in store ? store[k] : null; },
            setItem(k, v) { store[k] = String(v); },
            removeItem(k) { delete store[k]; },
        },
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
    sandbox.AudioContext = function () {
        return { createGain: () => ({ connect() {}, gain: {} }), destination: {} };
    };
    return sandbox;
}

module.exports = { ROOT, scriptOrder, makeBrowserSandbox, stubEl, stubCtx };
