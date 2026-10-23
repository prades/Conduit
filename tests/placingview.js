// PLACING: ZOOMED OUT, WITH THE INTERFACE OUT OF THE WAY (js/buildmenu.js placingTick / placingHidesUi, js/config.js viewZoom).
//
// REPORTED: "on the build menu, on the phone especially, the user can see the entire battlefield or the entire zone whenever they're building
// stuff. It would be really helpful if it zoomed out just for the time being, and also hid all of the UI stuff whenever an item or generator or
// some other equipment is selected."
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const sb = makeBrowserSandbox({});
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) {}
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); ensureWorldTo(2 * ZONE_LENGTH); player.x = 20; player.y = 2;`);
    const innerW = run('window.innerWidth');
    const setW = w => run(`window.innerWidth = ${w}; if (window.visualViewport) window.visualViewport = undefined;`);

    check('no tool in hand: normal size, the interface is shown', () => {
        run('buildMenuOpen = true; buildTool = null; _placingWas = false; setViewZoom(1); placingTick();');
        same(run('viewZoom'), 1, 'zoom'); same(run('placingHidesUi()'), false, 'hides the ui');
    });
    check('THE ASK: a tool in hand zooms the picture out and hides the interface', () => {
        setW(390); run('buildMenuOpen = true; buildTool = { tab: "turrets", kind: "attack", elId: "fire", label: "FIRE TURRET" }; placingTick();');
        same(run('placingHidesUi()'), true, 'hides the ui'); same(run('viewZoom'), run('PLACING_ZOOM_PHONE'), 'a phone zooms furthest');
        ok(run('viewZoom') < 0.6, 'a phone should see much more of the world: ' + run('viewZoom'));
    });
    check('the canvas is drawn bigger (screen / zoom) so more world fits, and the css scales it back to the screen', () => {
        const w = run('canvas.width'), expect = Math.round(390 / run('viewZoom'));
        ok(Math.abs(w - expect) <= 1, 'canvas ' + w + ' vs ' + expect);
        ok(run('canvas.width') > 390 * 1.8, 'more than 1.8x as many pixels across');
    });
    check('a wider screen zooms out less than a phone', () => {
        setW(1280); run('_placingWas = false; buildTool = null; placingTick(); buildTool = { tab: "turrets", kind: "attack", elId: "fire", label: "X" }; placingTick();');
        same(run('viewZoom'), run('PLACING_ZOOM'), 'desktop zoom'); ok(run('PLACING_ZOOM') > run('PLACING_ZOOM_PHONE'), 'desktop zooms out less');
    });
    check('putting the tool down brings everything back at normal size', () => {
        run('buildTool = null; placingTick();');
        same(run('viewZoom'), 1, 'zoom'); same(run('placingHidesUi()'), false, 'ui back'); same(run('canvas.width'), 1280, 'canvas back to the screen size');
    });
    check('closing the build window while a tool is in hand also puts it down (zoom restores)', () => {
        run('buildMenuOpen = true; buildTool = { tab: "turrets", kind: "attack", elId: "fire", label: "X" }; placingTick(); closeBuildMenu(); placingTick();');
        same(run('viewZoom'), 1, 'zoom restored');
    });
    check('a window resize while zoomed keeps the zoom', () => {
        setW(390); run('buildMenuOpen = true; buildTool = { tab: "turrets", kind: "attack", elId: "fire", label: "X" }; placingTick(); window.innerWidth = 420; resize();');
        ok(Math.abs(run('canvas.width') - Math.round(420 / run('viewZoom'))) <= 1, 'canvas follows the screen / zoom'); run('buildTool = null; placingTick();');
    });
    check('taps: while placing, ONLY the ground takes a tap (the hidden controls cannot fire), and the long-press ring is off', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
        const at = src.indexOf("canvas.addEventListener('pointerup'"), gate = src.indexOf('placingHidesUi()', at), crys = src.indexOf('The mix selector is open: a tap', at);
        ok(at > 0 && gate > at && gate < crys, 'the tap handler does not gate on placing before the controls (the crystal button, the panels and the rest)');
        ok(/function handleLongHold\(ex,ey\) \{\s*if \(typeof placingHidesUi/.test(src), 'the long press still opens the ring while placing');
    });
    check('drawing: the canvas controls are skipped while placing', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
        ok(/const _hideUi = typeof placingHidesUi === "function" && placingHidesUi\(\);\s*if \(!_hideUi\) \{\s*(\/\/[^\n]*\n\s*)*drawCloneMenu\(\);/.test(src), 'the canvas UI is not skipped');
        ok(/function render\(\) \{[\s\S]{0,900}if \(typeof placingTick === "function"\) placingTick\(\);/.test(src), 'placingTick is not called each frame');
    });
    check('the page: the DOM controls are hidden while placing and a DONE chip stays', () => {
        const html = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(/body\.placing #topHud, body\.placing #topToggles, body\.placing #radialRoot \{ display: none !important; \}/.test(html), 'the DOM controls are not hidden');
        ok(/body\.placing #placeChip \{ display: flex/.test(html), 'no DONE chip');
    });
    check('the tool is still placed by the ground tap (handleBuildToolTap) while zoomed: taps go through the scaled canvas', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
        ok(/function toCanvas\(cx, cy\)[\s\S]{0,300}canvas\.width\s*\/ r\.width/.test(src), 'toCanvas no longer scales a touch by canvas.width / displayed width');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
