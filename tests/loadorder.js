// Evaluates the real script files in the order game.html lists them, to prove
// nothing throws at load time and that the render order is intact.
const fs = require('fs');
const vm = require('vm');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');

const ORDER = scriptOrder();

console.log('script order from game.html:');
ORDER.forEach((f, i) => console.log('  ' + String(i + 1).padStart(2) + '. ' + f));

// The browser stub lives in tests/domstub.js so this suite and tests/globals.js
// cannot drift apart: a stub that quietly supplies a game global is how a
// missing declaration hides from every suite at once.
const sandbox = makeBrowserSandbox();

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
