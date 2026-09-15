// Runs js/postfx.js against a stub canvas so the whole pipeline is exercised
// without a browser. Catches NaN geometry, missing globals, and bad blend states.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const calls = [];

function mkCtx(owner) {
    const c = {
        _owner: owner,
        globalCompositeOperation: 'source-over',
        globalAlpha: 1,
        imageSmoothingEnabled: true,
        fillStyle: '#000', strokeStyle: '#000', lineWidth: 1,
        font: '', textAlign: '', textBaseline: '',
        save() {}, restore() {}, setTransform() {}, translate() {}, scale() {},
        beginPath() {}, closePath() {}, moveTo() {}, lineTo() {}, stroke() {},
        fill() {},
        arc(x, y, r) { assertFinite('arc', x, y, r); },
        ellipse(x, y, rx, ry) { assertFinite('ellipse', x, y, rx, ry); },
        fillRect(x, y, w, h) { assertFinite('fillRect@' + owner, x, y, w, h); },
        strokeRect() {}, fillText() {},
        drawImage(img, ...a) {
            if (!img) throw new Error('drawImage with no source from ' + owner);
            a.forEach((v, i) => { if (!Number.isFinite(v)) throw new Error('drawImage arg ' + i + ' not finite: ' + v); });
            calls.push({ op: 'drawImage', on: owner, blend: c.globalCompositeOperation, alpha: c.globalAlpha, args: a.length });
        },
        createRadialGradient(x0, y0, r0, x1, y1, r1) {
            assertFinite('createRadialGradient@' + owner, x0, y0, r0, x1, y1, r1);
            if (r1 < 0 || r0 < 0) throw new Error('negative gradient radius');
            return { addColorStop(off, col) {
                if (!Number.isFinite(off)) throw new Error('bad stop offset ' + off);
                if (/NaN|undefined/.test(String(col))) throw new Error('bad stop colour ' + col);
            } };
        },
        createLinearGradient(x0, y0, x1, y1) {
            assertFinite('createLinearGradient', x0, y0, x1, y1);
            return { addColorStop(o, col) { if (/NaN|undefined/.test(String(col))) throw new Error('bad stop ' + col); } };
        },
        createPattern(img) { if (!img) throw new Error('createPattern with no image'); return { pattern: true }; },
        createImageData(w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; },
        putImageData() {},
        clip() {}, roundRect() {}, measureText() { return { width: 10 }; },
    };
    return c;
}

function assertFinite(where, ...vals) {
    vals.forEach((v, i) => {
        if (!Number.isFinite(v)) throw new Error(`${where}: arg ${i} is ${v}`);
    });
}

function mkCanvas(w, h) {
    const cv = { width: w, height: h };
    const c = mkCtx('buf' + w + 'x' + h);
    cv.getContext = () => c;
    return cv;
}

const mainCanvas = mkCanvas(1200, 800);
const mainCtx = mainCanvas.getContext('2d');

const sandbox = {
    console,
    performance: { now: () => Date.now() },
    navigator: { hardwareConcurrency: 8 },
    window: { innerWidth: 1200, innerHeight: 800 },
    localStorage: { _d: {}, getItem(k) { return this._d[k] ?? null; }, setItem(k, v) { this._d[k] = v; } },
    document: { createElement: () => mkCanvas(64, 64) },
    Math, isFinite, parseInt, isNaN, Map, Array, String, Number,

    // ── Game globals the FX module reads ──
    canvas: mainCanvas,
    ctx: mainCtx,
    TILE_W: 60, TILE_H: 30,
    frame: 1234,
    ELEMENTS: [
        { id: 'fire', color: '#ff5522' }, { id: 'ice', color: '#66ddff' },
        { id: 'electric', color: '#ffee44' }, { id: 'core', color: '#88aaff' },
        { id: 'flux', color: '#cc66ff' }, { id: 'toxic', color: '#66ff33' },
    ],
    crystal: { x: 0, y: 2, health: 180, maxHealth: 300 },
    player: { visualX: 4, visualY: 2, selectedElement: 'fire' },
    floatingTexts: [],
};
sandbox.globalThis = sandbox;

// document.createElement must hand back correctly sized canvases — postfx sets
// width/height after creation, so a fresh object each call is enough.
sandbox.document.createElement = () => {
    const cv = { width: 1, height: 1 };
    const c = mkCtx('offscreen');
    cv.getContext = () => c;
    return cv;
};

const ctxObj = vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(ROOT + '/js/postfx.js', 'utf8'), ctxObj, { filename: 'postfx.js' });

const run = src => vm.runInContext(src, ctxObj);

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function eq(a, b, msg) { if (a !== b) throw new Error(`${msg}: expected ${b}, got ${a}`); }

const FX_LEVELS_LIST = ['off', 'low', 'medium', 'high'];

console.log('\ncolour parsing');
check('#rgb shorthand', () => eq(run('_fxRGB("#f8a").join(",")'), '255,136,170', 'shorthand'));
check('#rrggbb', () => eq(run('_fxRGB("#00ff88").join(",")'), '0,255,136', 'long form'));
check('rgba() string', () => eq(run('_fxRGB("rgba(12,34,56,0.5)").join(",")'), '12,34,56', 'rgba'));
check('garbage falls back to white', () => eq(run('_fxRGB("chartreuse-ish").join(",")'), '255,255,255', 'fallback'));
check('null falls back to white', () => eq(run('_fxRGB(null).join(",")'), '255,255,255', 'null'));

console.log('\nquality levels');
check('off disables every effect', () => {
    run('fxApplyLevel("off")');
    ['lights', 'shadows', 'bloom', 'vignette', 'scanlines', 'grain', 'sweep', 'aberration']
        .forEach(k => eq(run('FX.' + k), false, k + ' should be off'));
});
check('low enables bloom but not grain', () => {
    run('fxApplyLevel("low")');
    eq(run('FX.bloom'), true, 'bloom');
    eq(run('FX.grain'), false, 'grain');
    eq(run('FX.aberration'), false, 'aberration');
});
check('high enables aberration', () => {
    run('fxApplyLevel("high")');
    eq(run('FX.aberration'), true, 'aberration');
    eq(run('FX.bloomTight'), true, 'tight bloom');
});
check('unknown level falls back to low', () => {
    run('fxApplyLevel("ultra")');
    eq(run('FX.level'), 'low', 'level');
});
check('low runs a single bloom tap, medium two', () => {
    run('fxApplyLevel("low")');
    eq(run('FX.bloomTwoTap'), false, 'low two-tap');
    run('fxApplyLevel("medium")');
    eq(run('FX.bloomTwoTap'), true, 'medium two-tap');
});
check('grain, sweep and aberration are high only', () => {
    ['low', 'medium'].forEach(lv => {
        run('fxApplyLevel("' + lv + '")');
        ['grain', 'sweep', 'aberration'].forEach(k => eq(run('FX.' + k), false, lv + ' ' + k));
    });
    run('fxApplyLevel("high")');
    ['grain', 'sweep', 'aberration'].forEach(k => eq(run('FX.' + k), true, 'high ' + k));
});
check('haze stays subtle at every level', () => {
    FX_LEVELS_LIST.forEach(lv => {
        run('fxApplyLevel("' + lv + '")');
        const hz = run('FX.haze');
        if (!(hz > 0 && hz <= 0.22)) throw new Error(lv + ' haze is ' + hz + ', want 0 < h <= 0.22');
    });
});
check('changing scanlines invalidates the baked overlay', () => {
    run('fxApplyLevel("medium"); fxBeginFrame(); fxComposite()');
    if (run('_fxOv') === null) throw new Error('overlay was not built');
    run('fxApplyLevel("low")');            // scanlines off -> different overlay
    eq(run('_fxOv'), null, 'overlay should be discarded');
});
check('cycle walks the list and wraps', () => {
    run('fxApplyLevel("off")');
    eq(run('fxCycleLevel()'), 'low', '1st');
    eq(run('fxCycleLevel()'), 'medium', '2nd');
    eq(run('fxCycleLevel()'), 'high', '3rd');
    eq(run('fxCycleLevel()'), 'off', 'wrap');
});
check('setLevel persists and pins user choice', () => {
    run('fxSetLevel("low")');
    eq(run('localStorage.getItem("conduit.fx")'), 'low', 'stored');
    eq(run('fxUserSet'), true, 'user set');
});

console.log('\nlight accumulation');
check('off-screen light is rejected', () => {
    run('fxApplyLevel("high"); fxBeginFrame();');
    run('pushLight(-9999, -9999, 50, "#fff", 1)');
    eq(run('_fxLightCount'), 0, 'count');
});
check('on-screen light is counted', () => {
    run('fxBeginFrame(); pushLight(600, 400, 200, "#00ff88", 0.5)');
    eq(run('_fxLightCount'), 1, 'count');
});
check('non-finite position is rejected, not thrown', () => {
    run('fxBeginFrame(); pushLight(undefined, 400, 200, "#fff", 1); pushLight(NaN, NaN, 10, "#fff", 1)');
    eq(run('_fxLightCount'), 0, 'count');
});
check('zero radius or intensity is rejected', () => {
    run('fxBeginFrame(); pushLight(600, 400, 0, "#fff", 1); pushLight(600, 400, 50, "#fff", 0)');
    eq(run('_fxLightCount'), 0, 'count');
});
check('light budget is capped', () => {
    run('fxBeginFrame(); for (let i=0;i<500;i++) pushLight(600, 400, 80, "#fff", 0.3)');
    eq(run('_fxLightCount'), run('FX_MAX_LIGHTS'), 'capped at budget');
});
check('a light too small to survive the upscale is dropped', () => {
    run('fxBeginFrame(); pushLight(600, 400, 4, "#fff", 1)');
    eq(run('_fxLightCount'), 0, 'sub-pixel light');
});
check('world light projects through the camera', () => {
    // player at (4,2): a light at the player position must land at screen centre.
    run('fxBeginFrame(); pushWorldLight(4, 2, 120, "#fff", 0.5, 0)');
    eq(run('_fxLightCount'), 1, 'centre light accepted');
});

console.log('\nfull composite pass');
check('composite runs at every level without throwing', () => {
    ['off', 'low', 'medium', 'high'].forEach(lv => {
        run('fxApplyLevel("' + lv + '")');
        run('fxBeginFrame()');
        run('fxComposite()');
    });
});
check('bloom adds with the lighter blend', () => {
    calls.length = 0;
    run('fxApplyLevel("high"); fxBeginFrame(); fxComposite()');
    const lit = calls.filter(c => c.on.startsWith('buf') && c.blend === 'lighter');
    if (lit.length < 2) throw new Error('expected at least 2 additive draws onto the main canvas, got ' + lit.length);
});
check('lower levels cost fewer full-screen draws than higher ones', () => {
    const cost = lv => {
        calls.length = 0;
        run('fxApplyLevel("' + lv + '"); fxBeginFrame(); fxComposite()');
        return calls.filter(c => c.on.startsWith('buf')).length;
    };
    const low = cost('low'), med = cost('medium'), high = cost('high');
    if (!(low < med && med < high)) throw new Error(`cost should rise with level, got low=${low} med=${med} high=${high}`);
});
check('off level draws nothing', () => {
    calls.length = 0;
    run('fxApplyLevel("off"); fxBeginFrame(); fxComposite()');
    eq(calls.length, 0, 'draw calls');
});
check('collects lights from live game state', () => {
    run('fxApplyLevel("high")');
    run(`
        _pillarCache = [{x:6,y:2,pillarTeam:'green',attackMode:true,attackModeColor:'#ff5522'},
                        {x:9,y:3,pillarTeam:'red',pillarCol:'#f22'}];
        elementEffects = [{type:'impact',x:5,y:2,color:'#66ddff',radius:0.6,life:20}];
        projectiles = [{x:7,y:2,color:'#ffcc44'}];
        followerProjectiles = [];
        environmentalHazards = [{type:'acid',tiles:[[5,3],[6,3]],alpha:0.8}];
        _wallPanelCache = [{x:8,y:0,siphonProgress:40}];
        _nestCache = [{x:10,y:4,nestHealth:30,nestHackProgress:0}];
        _capturableNodeCache = [{x:11,y:2,captured:false}];
        traps = [{x:5,y:1,alive:true}];
        followers = [{x:4,y:3,element:'fire',dead:false}];
        fxBeginFrame(); fxComposite();
    `);
    const n = run('_fxLightCount');
    if (n < 8) throw new Error('expected many scene lights, got ' + n);
});
check('a hazard pool with no tiles does not break', () => {
    run(`environmentalHazards = [{type:'acid',tiles:[]}, {type:'vent'}];
         fxBeginFrame(); fxComposite();`);
});
check('an effect with no position is skipped', () => {
    run(`elementEffects = [{type:'impact',color:'#fff',radius:1,life:30}];
         fxBeginFrame(); fxComposite();`);
});
check('contact shadow geometry is finite', () => {
    run('fxApplyLevel("high"); fxContactShadow(600, 400, 22, 1); fxContactShadow(0, 0, 8, 0.45)');
});
check('shadow is skipped when disabled', () => {
    run('fxApplyLevel("off"); fxContactShadow(600, 400, 22, 1)');
});
check('canvas resize rebuilds buffers', () => {
    run('fxApplyLevel("high"); fxBeginFrame(); fxComposite()');
    const w0 = run('_fxB1.width');
    sandbox.canvas.width = 800; sandbox.canvas.height = 600;
    run('fxBeginFrame(); fxComposite()');
    const w1 = run('_fxB1.width');
    if (w0 === w1) throw new Error('buffers did not resize (both ' + w0 + ')');
    eq(w1, 200, 'quarter of 800');
});
check('a degenerate canvas size is ignored', () => {
    sandbox.canvas.width = 0; sandbox.canvas.height = 0;
    run('fxComposite()');
    sandbox.canvas.width = 1200; sandbox.canvas.height = 800;
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
