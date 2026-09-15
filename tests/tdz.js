// Loads postfx.js fresh under conditions that make fxApplyLevel invalidate the
// baked overlay DURING the module's own evaluation. That is the exact path that
// hit a temporal dead zone ReferenceError, and neither the old detection
// defaults nor fxtest.js's 1200px viewport reach it.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const SRC = fs.readFileSync(ROOT + '/js/postfx.js', 'utf8');

const stubCtx = () => new Proxy({}, {
    get(t, k) {
        if (k in t) return t[k];
        return () => {
            if (/createRadialGradient|createLinearGradient/.test(k)) return { addColorStop() {} };
            if (k === 'createPattern') return {};
            if (k === 'createImageData') return { data: new Uint8ClampedArray(4 * 96 * 96) };
            return undefined;
        };
    },
    set(t, k, v) { t[k] = v; return true; },
});
const mkCanvas = () => { const cv = { width: 8, height: 8 }; const c = stubCtx(); cv.getContext = () => c; return cv; };

function load(label, { stored, cores, width }) {
    const sandbox = {
        console, Math, Map, Array, String, Number, isFinite, isNaN, parseInt, Proxy, Uint8ClampedArray,
        performance: { now: () => 0 },
        navigator: { hardwareConcurrency: cores },
        window: { innerWidth: width, innerHeight: Math.round(width * 0.66) },
        localStorage: { _d: stored ? { 'conduit.fx': stored } : {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = v; } },
        document: { createElement: mkCanvas },
        canvas: mkCanvas(), ctx: stubCtx(),
        TILE_W: 60, TILE_H: 30, frame: 0, ELEMENTS: [],
    };
    sandbox.globalThis = sandbox;
    const c = vm.createContext(sandbox);
    try {
        vm.runInContext(SRC, c, { filename: 'postfx.js' });
        const lvl = vm.runInContext('FX.level', c);
        console.log(`  ok   ${label} → level "${lvl}"`);
        return true;
    } catch (e) {
        console.log(`  FAIL ${label} — ${e.constructor.name}: ${e.message}`);
        return false;
    }
}

console.log('\nfresh module load (temporal dead zone regression)');
let ok = true;
ok = load('stored "high" forces overlay invalidation at init', { stored: 'high', cores: 8, width: 1200 }) && ok;
ok = load('stored "medium"', { stored: 'medium', cores: 4, width: 900 }) && ok;
ok = load('stored "off"', { stored: 'off', cores: 2, width: 700 }) && ok;
ok = load('stored "low"', { stored: 'low', cores: 4, width: 1000 }) && ok;
ok = load('no stored choice, big 8-core tablet', { stored: null, cores: 8, width: 1600 }) && ok;
ok = load('no stored choice, small 2-core phone', { stored: null, cores: 2, width: 420 }) && ok;
ok = load('corrupt stored value', { stored: 'ultra-max', cores: 4, width: 1000 }) && ok;

console.log(ok ? '\nno dead-zone error on any startup path\n' : '\nFAILURES\n');
process.exit(ok ? 0 : 1);
