// Evaluates the real script files in the order game.html lists them, to prove
// the postfx fallbacks in config.js are replaced by the real implementations
// and that nothing throws at load time.
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

check('config.js stubs were replaced by the real postfx functions', () => {
    // The stubs are anonymous; the real ones are named declarations.
    eq(run('fxBeginFrame.name'), 'fxBeginFrame', 'fxBeginFrame');
    eq(run('fxComposite.name'), 'fxComposite', 'fxComposite');
    eq(run('fxContactShadow.name'), 'fxContactShadow', 'fxContactShadow');
});
check('no "already been declared" collision between config and postfx', () => {
    eq(typeof run('FX_LEVELS'), 'object', 'FX_LEVELS present');
    eq(run('FX_LEVELS.length'), 4, 'four levels');
});
check('postfx loads before ui.js, which reads FX_LEVELS', () => {
    const iFx = ORDER.indexOf('js/postfx.js'), iUi = ORDER.indexOf('js/ui.js');
    if (iFx < 0) throw new Error('postfx.js is not in game.html at all');
    if (iFx > iUi) throw new Error('postfx.js loads after ui.js');
});
check('postfx loads before game.js, which calls into it', () => {
    const iFx = ORDER.indexOf('js/postfx.js'), iG = ORDER.indexOf('js/game.js');
    if (iFx > iG) throw new Error('postfx.js loads after game.js');
});
check('_spHasFX reports the module present', () => eq(run('_spHasFX()'), true, 'has fx'));
check('settings panel rows fit inside the panel', () => {
    const h = run('_SP_H');
    const bottom = run('_SP_CLOSE_Y + _SP_CLOSE_H');
    if (bottom > h - 8) throw new Error(`close button bottom ${bottom} crowds panel height ${h}`);
    const gfxBottom = run('_SP_GFX_Y + _SP_GFX_H');
    if (gfxBottom > run('_SP_RESET_Y')) throw new Error('graphics row overlaps reset button');
});
check('graphics segments tile the panel width exactly', () => {
    const pw = run('_SP_W'), n = run('FX_LEVELS.length');
    const segW = Math.floor((pw - 40) / n);
    if (20 + segW * n > pw - 20) throw new Error('segments overflow the panel');
    // last segment tap must resolve to the last level
    const i = Math.floor((pw - 21 - 20) / segW);
    eq(i, n - 1, 'rightmost tap index');
});

// ── Render-order seam ──
// World-space geometry must be drawn BEFORE fxComposite so it receives bloom
// and lighting; interface must be drawn AFTER so it stays crisp. Getting this
// backwards makes world objects look pasted onto the scene.
const GAME = fs.readFileSync(ROOT + '/js/game.js', 'utf8');
const WORLD_SPACE = ['drawElementEffects', 'drawTraps', 'drawHoldLine'];
const INTERFACE   = ['drawFloatingTexts', 'drawRadialMenu', 'drawElementPicker',
                     'drawSettingsPanel', 'drawInfoPanel', 'drawTrapPicker'];
const seam = GAME.indexOf('fxComposite();');

console.log('\nrender-order seam:');
check('fxComposite is called exactly once in the render loop', () => {
    const n = (GAME.match(/^\s*fxComposite\(\);/gm) || []).length;
    eq(n, 1, 'call count');
});
check('fxBeginFrame is called exactly once', () => {
    const n = (GAME.match(/^\s*fxBeginFrame\(\);/gm) || []).length;
    eq(n, 1, 'call count');
});
WORLD_SPACE.forEach(fn => check(`${fn} runs before the post-FX seam`, () => {
    const at = GAME.indexOf(fn + '();');
    if (at < 0) throw new Error('not called at all');
    if (at > seam) throw new Error('called after fxComposite, so it misses bloom and lighting');
}));
INTERFACE.forEach(fn => check(`${fn} runs after the post-FX seam`, () => {
    const at = GAME.indexOf(fn + '();');
    if (at < 0) throw new Error('not called at all');
    if (at < seam) throw new Error('called before fxComposite, so the UI gets bloomed');
}));
check('no world-space overlay is called twice', () => {
    WORLD_SPACE.concat(INTERFACE).forEach(fn => {
        const n = (GAME.match(new RegExp('^\\s*' + fn + '\\(\\);', 'gm')) || []).length;
        if (n > 1) throw new Error(fn + ' called ' + n + ' times');
    });
});

console.log(failures ? `\n${failures} FAILING\n` : '\nload order and render seam verified\n');
process.exit(failures ? 1 : 0);
