// MODULATION: what new followers are made of, and the HUD control for it.
//
// THE REPORTED CASE: "TypeError: undefined is not an object (evaluating
// 'combo.map')" at _getModScheme, every time the crystal modulation was
// changed. The control was a 0..1 slider indexing a generated list of element
// combinations, and with exactly TWO elements unlocked — fire and electric, the
// pair every save starts with — a value in the 0.25..0.55 band skipped the TRI
// branch (it wants n >= 3) and fell into the BI branch, where (s - 0.55) is
// negative, Math.floor gives -1, and combos[-1] is undefined.
//
// So the fix is not a clamp. The combination list is gone: the modulation is
// now a SET of elements the player toggles, which has no index arithmetic to
// get wrong. That makes the property worth testing not "this one slider value
// works" but "no reachable state throws, for any unlocked set".
//
// The control also moved onto the HUD, because it is the dial the whole
// follower economy turns on and it was four taps deep.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');

const SRC = {
    clone:  fs.readFileSync(path.join(ROOT, 'js/clone.js'),  'utf8'),
    input:  fs.readFileSync(path.join(ROOT, 'js/input.js'),  'utf8'),
    game:   fs.readFileSync(path.join(ROOT, 'js/game.js'),   'utf8'),
    save:   fs.readFileSync(path.join(ROOT, 'js/save.js'),   'utf8'),
    waves:  fs.readFileSync(path.join(ROOT, 'js/waves.js'),  'utf8'),
    config: fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8'),
};

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// The whole page, in the order it loads, with a browser and nothing else. The
// modulation control spans config/clone/input/game/save, so a hand-built
// sandbox would only prove the piece it was built for.
async function boot(store) {
    const sandbox = makeBrowserSandbox(store || {});
    const ctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is expected to be noisy under stubs */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    return {
        sandbox, run,
        unlock(ids) { run(`unlockedElements = new Set(${JSON.stringify(ids)}); modulationMask = new Set();`); },
        mask(ids) { run(`modulationMask = new Set(${JSON.stringify(ids)});`); },
        maskNow() { return run('[...modulationMask]').sort(); },
        scheme() { return run('_getModScheme()'); },
        elementIds() { return run('ELEMENTS.map(e => e.id)'); },
    };
}

(async () => {
    const E = await boot();
    const ALL = E.elementIds();

    // ─────────────────────────────────────────────────────
    group('THE REPORTED CASE: no reachable modulation throws');

    check('two unlocked elements — the exact case that crashed', () => {
        E.unlock(['fire', 'electric']);
        // Every mask a player can reach with two elements, including the ones
        // the old slider's TRI band mapped onto and crashed.
        for (const m of [['fire'], ['electric'], ['fire', 'electric']]) {
            E.mask(m);
            const s = E.scheme();
            ok(Array.isArray(s.colors) && s.colors.length === m.length,
               `mask ${m} gave ${JSON.stringify(s.colors)}`);
            ok(typeof s.label === 'string' && s.label.length > 0, `mask ${m} has no label`);
            ok(s.elements.length === m.length, `mask ${m} has the wrong element count`);
        }
    });

    check('every subset of every unlocked set, up to four elements', () => {
        // The old bug was a gap between branch conditions, so the interesting
        // input is the SIZE of the unlocked set, not which elements are in it.
        for (let n = 1; n <= 4; n++) {
            const unlocked = ALL.slice(0, n);
            E.unlock(unlocked);
            for (let bits = 1; bits < (1 << n); bits++) {
                const m = unlocked.filter((_, i) => bits & (1 << i));
                E.mask(m);
                const s = E.scheme();
                ok(s.size === m.length, `n=${n} mask=${m} size=${s.size}`);
                ok(s.colors.every(c => typeof c === 'string' && c.length > 0),
                   `n=${n} mask=${m} has a bad colour`);
            }
        }
    });

    check('the full unlocked set, and a mask of everything', () => {
        E.unlock(ALL);
        E.mask(ALL);
        const s = E.scheme();
        same(s.size, ALL.length, 'every element should be in the mix');
        ok(/^ALL /.test(s.label), 'the label should say ALL, got ' + s.label);
    });

    check('no elements unlocked at all', () => {
        E.unlock([]);
        const s = E.scheme();
        same(s.size, 0, 'nothing unlocked means nothing in the mix');
        ok(Array.isArray(s.colors) && s.colors.length > 0, 'it still needs something to draw');
        ok(typeof s.label === 'string', 'and a label');
    });

    check('the combination list is gone, not clamped', () => {
        // A clamp would leave the branch gap in place for the next person to
        // fall into. The generated combos and the band thresholds should not
        // exist any more.
        const at  = SRC.clone.indexOf('function _getModScheme');
        const end = SRC.clone.indexOf('\n}', at);
        const body = SRC.clone.slice(at, end);
        ok(!/combos/.test(body), '_getModScheme still builds a combination list');
        ok(!/0\.55|0\.80|0\.25/.test(body), 'the slider bands are still in there');
        ok(!/crystalModSlider/.test(SRC.clone), 'the slider variable is still read');
        ok(!/crystalModSlider/.test(SRC.config), 'the slider variable is still declared');
    });

    // ─────────────────────────────────────────────────────
    group('the mask is kept honest');

    check('an element that is not unlocked is dropped from the mix', () => {
        E.unlock(['fire', 'electric']);
        E.mask(['fire', 'toxic']);           // toxic is not online
        const s = E.scheme();
        same(s.size, 1, 'only the unlocked one should count');
        same(s.elements[0].id, 'fire', 'and it should be the right one');
        ok(!E.maskNow().includes('toxic'), 'the locked element should be gone from the mask');
    });

    check('an empty mask reads as every unlocked element', () => {
        // This is also the starting state, so a player who never opens the
        // control still gets a sensible mix rather than no element at all.
        E.unlock(['fire', 'electric', 'ice']);
        E.mask([]);
        const s = E.scheme();
        same(s.size, 3, 'an empty mask should mean any');
    });

    check('THE TRAP: an untouched mix takes in elements earned later', () => {
        // normaliseModulationMask used to FILL an empty mask with every
        // unlocked element and keep it, so the implicit "any" became an
        // explicit list the first time anything read it. A player who never
        // opened the control then had their mix frozen at fire and electric,
        // and every element earned afterwards was silently left out — which
        // makes a per-wave element reward pay nothing.
        E.unlock(['fire', 'electric']);
        E.scheme();                       // a read, as drawing the chip does
        E.run('drawModulationChip();');   // and the draw itself
        same(E.maskNow().length, 0, 'a read must not freeze the mix into a choice');
        E.run('unlockedElements.add("toxic");');
        const s = E.scheme();
        same(s.size, 3, 'the newly earned element should be in the mix, got ' + s.label);
        ok(s.elements.some(e => e.id === 'toxic'), 'toxic should be in it by name');
        same(E.run('recruitElementPool()').includes('toxic'), true,
             'and recruits should be able to come out as it');
    });

    check('an untouched mix shows every swatch lit', () => {
        // "Any" has to LOOK like everything is on, or an empty mask reads as
        // nothing selected.
        E.unlock(['fire', 'electric', 'ice']);
        E.run('crystalMenuOpen = false; drawModulationChip();');
        same(E.maskNow().length, 0, 'fixture: the mask should still be untouched');
        same(E.scheme().size, 3, 'all three should read as in the mix');
    });

    check('the first tap narrows, it does not invert', () => {
        // With an empty mask every swatch is lit, so tapping one must drop that
        // one element — not switch everything else off.
        E.unlock(['fire', 'electric', 'ice']);
        same(E.maskNow().length, 0, 'fixture: start untouched');
        E.run('modulationToggle("ice")');
        const left = E.maskNow();
        same(left.join(','), 'electric,fire', 'the tapped element should be the only one dropped');
        same(E.scheme().size, 2, 'and the mix should be the other two');
    });

    check('one helper decides what an empty mask means', () => {
        // Three readers — the scheme, the swatches, the chip's wash — and if
        // they each decided for themselves they would disagree.
        ok(/function modulationIncludes/.test(SRC.clone), 'no single decision point');
        const direct = (SRC.clone.match(/modulationMask\.has\(/g) || []).length;
        ok(direct <= 2, direct + ' direct mask reads bypass the helper');
    });

    check('a relock empties the mask rather than leaving it stuck', () => {
        E.unlock(['fire', 'electric', 'ice']);
        E.mask(['ice']);
        E.run('unlockedElements = new Set(["fire","electric"]);');
        const s = E.scheme();
        same(s.size, 2, 'with its only element relocked it should fall back to any');
    });

    // ─────────────────────────────────────────────────────
    group('toggling');

    check('a tap adds an element to the mix', () => {
        E.unlock(['fire', 'electric', 'ice']);
        E.mask(['fire']);
        same(E.run('modulationToggle("ice")'), true, 'the toggle should be accepted');
        ok(E.maskNow().includes('ice'), 'ice should be in the mix');
    });

    check('a tap drops one back out', () => {
        E.unlock(['fire', 'electric', 'ice']);
        E.mask(['fire', 'ice']);
        E.run('modulationToggle("ice")');
        ok(!E.maskNow().includes('ice'), 'ice should be out of the mix');
    });

    check('THE GUARD: the last element cannot be switched off', () => {
        // An empty mask reads as "any", so emptying it by tapping would do the
        // exact opposite of what the tap looks like.
        E.unlock(['fire', 'electric']);
        E.mask(['fire']);
        same(E.run('modulationToggle("fire")'), false, 'it should refuse');
        same(E.maskNow().join(), 'fire', 'and leave the mix alone');
        ok(E.run('floatingTexts.some(t => /AT LEAST ONE/.test(t.text))'), 'and say why');
    });

    check('an element that is not unlocked cannot be toggled in', () => {
        E.unlock(['fire', 'electric']);
        E.mask(['fire']);
        same(E.run('modulationToggle("toxic")'), false, 'a locked element should be refused');
        ok(!E.maskNow().includes('toxic'), 'and stay out of the mix');
    });

    check('changing it clears the re-modulate prompt', () => {
        E.unlock(['fire', 'electric', 'ice']);
        E.mask(['fire']);
        E.run('modulationDirty = true;');
        E.run('modulationToggle("ice")');
        same(E.run('modulationDirty'), false, 'the prompt should rest once they have modulated');
    });

    check('a refused toggle does NOT clear the prompt', () => {
        // Otherwise a tap that changed nothing silently dismisses the nudge.
        E.unlock(['fire', 'electric']);
        E.mask(['fire']);
        E.run('modulationDirty = true;');
        E.run('modulationToggle("fire")');      // refused: last element
        same(E.run('modulationDirty'), true, 'a refused tap should leave the prompt up');
    });

    check('changing it saves, so a refresh keeps the choice', () => {
        E.unlock(['fire', 'electric', 'ice']);
        E.mask(['fire']);
        E.run('localStorage.removeItem("tubecrawler_progress");');
        E.run('modulationToggle("ice")');
        const raw = E.run('localStorage.getItem("tubecrawler_progress")');
        ok(!!raw, 'nothing was written');
        const blob = JSON.parse(raw);
        ok(Array.isArray(blob.modulation) && blob.modulation.includes('ice'),
           'the mask is not in the saved blob: ' + raw);
    });

    // ─────────────────────────────────────────────────────
    group('it decides what followers are made of');

    check('the recruit pool is the mix', () => {
        E.unlock(['fire', 'electric', 'ice']);
        E.mask(['ice']);
        same(E.run('recruitElementPool().join()'), 'ice', 'recruits should only come out as ice');
    });

    check('the pool never comes back empty', () => {
        E.unlock(['fire', 'electric']);
        E.run('modulationMask = new Set(["toxic"]);');   // nothing valid in it
        const pool = E.run('recruitElementPool()');
        ok(pool.length > 0, 'a recruit with no element is worse than an unmodulated one');
        ok(pool.every(id => ['fire', 'electric'].includes(id)), 'and it must be an unlocked one');
    });

    check('THE ASK: a respawn takes the CURRENT modulation, not the old element', () => {
        // "They get their element from respawning from the crystal." A follower
        // used to come back as whatever it was when it died, so changing the
        // modulation only ever affected brand-new recruits.
        const at = SRC.game.indexOf('// Respawn as regular follower');
        const body = SRC.game.slice(at, at + 1400);
        ok(/recruitElementPool\(\)/.test(body), 'a respawn does not read the modulation');
        ok(!/element:entry\.element,/.test(body), 'a respawn still reuses the dead follower\'s element');
        ok(/activeCrystalModulation/.test(body), 'a boss modulator should still override it');
    });

    check('a respawn really does come out re-modulated', async () => {
        const R = await boot();
        R.run(`
            unlockedElements = new Set(["fire","electric","ice"]);
            modulationMask   = new Set(["ice"]);
            activeCrystalModulation = null;
            followers = []; actors = [];
            respawnQueue = [{ element: "fire", personality: "stoic", timer: 1,
                              combatTrait: null, naturalTrait: null, perk: null, hpStat: 20 }];
            gameState.running = true;
        `);
        R.run('for (let i = 0; i < 4; i++) render();');
        const els = R.run('followers.map(f => f.element)');
        ok(els.length === 1, 'the follower should have respawned, got ' + JSON.stringify(els));
        same(els[0], 'ice', 'it died as fire and should come back as the current modulation');
        // And it must be filed under the element it actually has.
        same(R.run('(followerByElement["ice"]||[]).length'), 1, 'filed under the wrong element');
        same(R.run('(followerByElement["fire"]||[]).length'), 0, 'still filed under the old element');
    });

    check('a recruit at the crystal takes it too', () => {
        const NPC = fs.readFileSync(path.join(ROOT, 'js/npc.js'), 'utf8');
        const at = NPC.indexOf('Always reassign element at crystal');
        ok(at > -1, 'the crystal no longer reassigns element on recruitment');
        const body = NPC.slice(at, at + 700);
        ok(/recruitElementPool\(\)/.test(body), 'recruitment does not read the modulation');
    });

    // ─────────────────────────────────────────────────────
    group('the HUD chip');

    check('THE ASK: it is drawn, in the bottom-right corner', () => {
        const C = E;
        C.unlock(['fire', 'electric', 'ice']);
        C.run('crystalMenuOpen = false; drawModulationChip();');
        const chip = C.run('({x:_MODCHIP.x, y:_MODCHIP.y, w:_MODCHIP.w, h:_MODCHIP.h, n:_MODCHIP.rects.length})');
        ok(chip.w > 0 && chip.h > 0, 'the chip has no size');
        const cw = C.run('canvas.width'), ch = C.run('canvas.height');
        ok(chip.x + chip.w <= cw, 'it runs off the right edge');
        ok(chip.x > cw / 2, 'it should be in the right half, got x=' + chip.x);
        ok(chip.y > ch / 2, 'it should be in the bottom half, got y=' + chip.y);
        same(chip.n, 3, 'one tap target per unlocked element');
    });

    check('it clears the TUTORIAL button instead of sharing its row', () => {
        // That button is a fixed-position DOM element at bottom:20px with a
        // ~42px box. Sharing the bottom row would collide on a narrow screen,
        // so the chip stacks above it.
        const C = E;
        C.run('crystalMenuOpen = false; drawModulationChip();');
        const bottom = C.run('_MODCHIP.y + _MODCHIP.h');
        const ch = C.run('canvas.height');
        ok(ch - bottom >= 62, `only ${ch - bottom}px of clearance above the tutorial button`);
    });

    check('it is hidden while the crystal panel is open', () => {
        // The panel covers the whole lower screen and carries the same control.
        const C = E;
        C.run('crystalMenuOpen = true; drawModulationChip();');
        same(C.run('_MODCHIP.w'), 0, 'the chip should stand down behind the panel');
        same(C.run('_MODCHIP.rects.length'), 0, 'and drop its tap targets with it');
        same(C.run('modulationChipTap(_MODCHIP.x, _MODCHIP.y)'), false, 'and not swallow taps');
        C.run('crystalMenuOpen = false;');
    });

    check('THE ASK: it is multicoloured — one swatch per element', () => {
        const C = E;
        C.unlock(['fire', 'electric', 'ice']);
        C.mask(['fire', 'electric', 'ice']);
        const cols = C.scheme().colors;
        same(cols.length, 3, 'three elements in the mix should give three colours');
        same(new Set(cols).size, 3, 'and they should be distinct');
        C.mask(['fire']);
        same(C.scheme().colors.length, 1, 'a single-element mix shows one colour');
    });

    check('tapping a swatch toggles that element', () => {
        const C = E;
        C.unlock(['fire', 'electric', 'ice']);
        C.mask(['fire']);
        C.run('crystalMenuOpen = false; drawModulationChip();');
        const r = C.run('_MODCHIP.rects.find(r => r.id === "ice")');
        ok(!!r, 'no tap target for ice');
        same(C.run(`modulationChipTap(${r.x + r.w / 2}, ${r.y + r.h / 2})`), true,
             'the tap should be taken by the chip');
        ok(C.maskNow().includes('ice'), 'ice should now be in the mix');
    });

    check('a tap on the body is consumed, not passed to the world', () => {
        // The chip sits over the board. A tap that falls between swatches must
        // not also issue a move order underneath it.
        const C = E;
        C.run('crystalMenuOpen = false; drawModulationChip();');
        const before = C.maskNow().join();
        same(C.run('modulationChipTap(_MODCHIP.x + 2, _MODCHIP.y + 2)'), true,
             'the chip should take a tap on its own body');
        same(C.maskNow().join(), before, 'and change nothing');
    });

    check('a tap outside it is left alone', () => {
        const C = E;
        C.run('crystalMenuOpen = false; drawModulationChip();');
        same(C.run('modulationChipTap(4, 4)'), false, 'a tap across the screen is not the chip\'s');
    });

    check('the chip is checked before any world command', () => {
        const chipAt  = SRC.input.indexOf('modulationChipTap(upX, upY)');
        const cmdAt   = SRC.input.indexOf('_ATKCHIP.w > 0');
        ok(chipAt > -1, 'input.js never routes a tap to the chip');
        ok(chipAt < cmdAt, 'the chip must be tested before the rest of the HUD');
    });

    check('the colour wash lines up with the swatches', () => {
        // Bands sized by the NUMBER of lit elements put the second colour
        // under the third swatch: with fire and toxic on out of six, the chip
        // was half red and half green while the lit swatches were at the ends.
        // This check is structural — the alignment itself was confirmed by
        // rendering the chip, which this suite does not do.
        const at = SRC.clone.indexOf('function drawModulationChip');
        const body = SRC.clone.slice(at, at + 2600);
        ok(/unlocked\.forEach/.test(body), 'the wash no longer walks the unlocked elements');
        ok(/_MODCHIP_CELL \+ _MODCHIP_GAP/.test(body), 'the wash is not measured in swatch cells');
        ok(!/w \/ scheme\.colors\.length/.test(body), 'the wash is back to bands by count');
    });

    check('it prompts when a new element has just come online', () => {
        const at = SRC.clone.indexOf('function drawModulationChip');
        const body = SRC.clone.slice(at, at + 2600);
        ok(/modulationDirty/.test(body), 'the chip does not show a stale mix');
        ok(/RE-MODULATE/.test(body), 'no prompt text');
    });

    check('the chip and the crystal panel share one control', () => {
        // Two copies of the swatch logic would be free to disagree about what
        // is switched on.
        ok(/function drawModulationSwatches/.test(SRC.clone), 'no shared swatch renderer');
        const uses = (SRC.clone.match(/drawModulationSwatches\(/g) || []).length;
        ok(uses >= 3, 'the panel and the chip should both call it, got ' + uses);
    });

    check('the crystal panel no longer draws a slider', () => {
        ok(!/_crystalSliderTrack/.test(SRC.clone), 'the slider track is still published');
        ok(!/_crystalSliderDrag/.test(SRC.clone), 'the slider drag flag survives in clone.js');
        ok(!/_crystalSliderDrag/.test(SRC.input), 'input.js still has a slider drag branch');
    });

    // ─────────────────────────────────────────────────────
    group('it survives a refresh, and a reset clears it');

    check('the mask round-trips through the save', async () => {
        const store = {};
        const A = await boot(store);
        A.run('unlockedElements = new Set(["fire","electric","ice"]); saveUnlocks();');
        A.mask(['ice']);
        A.run('saveProgress();');

        const B = await boot(store);
        same(B.maskNow().join(), 'ice', 'the modulation should come back as it was set');
    });

    check('a saved element that is no longer unlocked is dropped', () => {
        ok(/unlockedElements\.has\(e\)/.test(SRC.save),
           'applyProgress does not filter the saved mask against the unlocks');
    });

    check('junk in the saved mask does not throw', async () => {
        const store = { tubecrawler_progress: JSON.stringify({ kills: 5, modulation: 'fire' }) };
        const C = await boot(store);
        ok(Array.isArray(C.maskNow()), 'a non-array mask should read as empty');
        const s = C.scheme();
        ok(s.size > 0, 'and fall back to any');
    });

    check('the GAME INDEX documents the chip and where elements come from', () => {
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(/bottom-right of the HUD/.test(HTML), 'the index does not say where the chip is');
        ok(/at the Crystal/.test(HTML), 'the index does not say where followers take their element');
        ok(/respawns/.test(HTML), 'the index does not mention re-modulation on respawn');
        ok(!/MODULATION slider/.test(HTML), 'the index still describes the slider');
        ok(!/tri-colour, bi-colour or mono/.test(HTML), 'the index still describes the old bands');
    });

    check('a reset puts it back to the starting pair', () => {
        ok(/modulationMask=new Set\(STARTING_ELEMENTS\);/.test(SRC.waves),
           'restartGame leaves the modulation where it was');
        // And the pair itself is named once rather than spelled out per site.
        ok(/const STARTING_ELEMENTS/.test(SRC.config), 'the starting pair has no name');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
