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
// Returns a promise when `fn` is async, so an async check must be AWAITED.
// Without the await an async check that throws prints "ok" and the suite goes
// green on a broken game: the try/catch sees a returned promise, not a throw.
function check(name, fn) {
    try {
        const r = fn();
        if (r && typeof r.then === 'function') {
            return r.then(() => console.log('  ok   ' + name),
                          e => { failures++; console.log('  FAIL ' + name + ' — ' + e.message); });
        }
        console.log('  ok   ' + name);
    } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
    return Promise.resolve();
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
        E.scheme();                       // a read, as laying out the tab does
        // And the draw itself: the control reads the mask on every frame.
        E.run('crystalMenuOpen = true; crystalMenuTab = "modulation"; drawCrystalPanel();');
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
        E.run('crystalMenuOpen = true; crystalMenuTab = "modulation"; drawCrystalPanel();');
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

    await check('a respawn really does come out re-modulated', async () => {
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
    group('the control lives in the Crystal, and fits the panel');

    // REPORTED: "the modulation tab isn't fully available — make the design
    // simpler, incorporating the crystal, and removing the slider tool."
    //
    // The tab was two hand-placed columns split at 62% of the panel width, and
    // the right one held the only control. On a 1024 tablet its heading was cut
    // to "NEW FOLLOWERS COME OUT", the help text ended mid-word, and the fifth
    // swatch was half outside the panel; on a phone the fifth was gone. With
    // six elements unlocked the last one could not be tapped at all.
    //
    // There was also a SECOND copy of the swatch row floating at the
    // bottom-right of the HUD — two controls for one setting, the floating one
    // wedged between the radial buttons and the TUTORIAL button.

    // Lay the panel out for real and hand back where the controls landed. The
    // stubbed canvas does no painting, but the arithmetic that places things is
    // the game's own, which is the part that was wrong.
    function layout(env, w, h) {
        env.run(`canvas.width = ${w}; canvas.height = ${h};`);
        env.run('crystalMenuOpen = true; crystalMenuTab = "modulation"; drawCrystalPanel();');
        return env.run(`(() => {
            const b = window._cpBounds;
            const sw = (window._modSwatchRects || []).map(r => ({t:"swatch",x:r.x,y:r.y,w:r.w,h:r.h}));
            const ac = (window._modActivateRects || []).map(r => ({t:"activate",x:r.bx,y:r.by,w:r.bw,h:r.bh}));
            return { b, controls: sw.concat(ac) };
        })()`);
    }
    const outside = L => L.controls.filter(r =>
        r.x < L.b.PX || r.x + r.w > L.b.PX + L.b.PW ||
        r.y < L.b.contentY || r.y + r.h > L.b.contentY + L.b.contentH);

    check('THE ASK: every swatch is inside the panel, at every screen size', () => {
        const C = E;
        // Six unlocked is the worst case — the most the row ever has to hold.
        C.unlock(C.elementIds());
        same(C.elementIds().length, 6, 'fixture: six elements should be the full set');
        for (const [w, h] of [[1024, 768], [768, 1024], [390, 844], [844, 390], [360, 640], [260, 480]]) {
            const L = layout(C, w, h);
            same(L.controls.length, 6, `only ${L.controls.length} of 6 swatches at ${w}x${h}`);
            same(outside(L).length, 0,
                 `${outside(L).length} control(s) outside the panel at ${w}x${h}`);
        }
    });

    check('and so is the ACTIVATE button for an earned element', () => {
        const C = E;
        C.unlock(['fire', 'electric', 'ice', 'flux', 'core']);
        C.run('pendingElements = ["toxic"];');
        for (const [w, h] of [[1024, 768], [390, 844], [844, 390]]) {
            const L = layout(C, w, h);
            const act = L.controls.filter(r => r.t === 'activate');
            same(act.length, 1, `the ACTIVATE button is missing at ${w}x${h}`);
            same(outside(L).length, 0, `something fell outside the panel at ${w}x${h}`);
        }
        C.run('pendingElements = [];');
    });

    check('a short panel drops the decoration, not the control', () => {
        // Landscape on a phone leaves 236px of panel. A crystal sized off the
        // panel height pushed the ACTIVATE button and the footer off the
        // bottom: the one decoration on the screen crowded out the only
        // control. It stands down instead.
        const C = E;
        C.unlock(C.elementIds());
        C.run('pendingElements = ["toxic"];');
        const tall = layout(C, 1024, 768);
        const short = layout(C, 844, 390);
        same(outside(short).length, 0, 'the control still falls outside a short panel');
        const topOf = L => Math.min(...L.controls.map(r => r.y));
        ok(topOf(short) - short.b.contentY < topOf(tall) - tall.b.contentY,
           'the short panel did not reclaim the decoration\'s space');
        C.run('pendingElements = [];');
    });

    check('the row shrinks to fit rather than overflowing', () => {
        // With the six elements the game ships, the row fits at full size on
        // every real screen — the clamp does no work and a test that only used
        // those six could not tell a fitting rule from a fixed one. The row's
        // job is to fit whatever it is handed, so hand it more.
        const C = E;
        // ELEMENTS is a const, so the array is grown in place rather than
        // rebound.
        C.run(`ELEMENTS.push(...[1,2,3,4].map(i => (
                   { id: "test" + i, label: "TEST" + i, color: "#888888" })));`);
        C.unlock(C.elementIds());
        same(C.elementIds().length, 10, 'fixture: ten elements should be unlocked');
        for (const [w, h] of [[1024, 768], [390, 844], [360, 640]]) {
            const L = layout(C, w, h);
            same(L.controls.length, 10, `only ${L.controls.length} of 10 swatches at ${w}x${h}`);
            same(outside(L).length, 0, `the row overflowed the panel at ${w}x${h}`);
        }
        C.run('ELEMENTS.length = ELEMENTS.length - 4;');
        C.unlock(C.elementIds());
    });

    check('the swatches stay big enough to hit', () => {
        const C = E;
        C.unlock(C.elementIds());
        for (const [w, h] of [[390, 844], [360, 640], [844, 390], [260, 480]]) {
            const L = layout(C, w, h);
            const cell = L.controls[0].w;
            ok(cell >= 16, `a ${cell}px swatch at ${w}x${h} is too small for a finger`);
        }
    });

    check('THE ASK: ONE control, not two', () => {
        // A second copy on the HUD is a second place to read the mix from and a
        // second place to keep in step.
        ok(!/function drawModulationChip/.test(SRC.clone), 'the HUD chip is still drawn');
        ok(!/_MODCHIP/.test(SRC.clone), 'the HUD chip state survives in clone.js');
        ok(!/drawModulationChip/.test(SRC.game), 'game.js still paints the HUD chip');
        ok(!/modulationChipTap/.test(SRC.input), 'input.js still routes taps to the HUD chip');
        const uses = (SRC.clone.match(/drawModulationSwatches\(/g) || []).length;
        same(uses, 2, 'the swatch row should be defined once and called once, got ' + uses);
    });

    check('tapping a swatch in the panel toggles that element', () => {
        const C = E;
        C.unlock(['fire', 'electric', 'ice']);
        C.mask(['fire']);
        const L = layout(C, 1024, 768);
        const r = C.run('(window._modSwatchRects || []).find(r => r.id === "ice")');
        ok(!!r, 'no tap target for ice');
        // The panel toggles on RELEASE, not press — a toggle that fires on
        // press repeats for every move event while the finger is down.
        same(C.run(`handleCrystalPanelInput(${r.x + r.w / 2}, ${r.y + r.h / 2}, false)`), true,
             'the tap should be taken by the panel');
        ok(C.maskNow().includes('ice'), 'ice should now be in the mix');
        ok(L.controls.length === 3, 'fixture: three swatches should have been laid out');
    });

    check('THE ASK: the mix is stated ONCE, not three times', () => {
        // The old tab said it under the crystal, again under the swatches, and
        // again on the HUD chip — with a size caption ("all elements") and a
        // strip of cycling colour chips saying it a fourth and fifth way.
        const at = SRC.clone.indexOf('function _drawModTab');
        const body = SRC.clone.slice(at, SRC.clone.indexOf('\n}\n', at));
        ok(at > -1 && body.length > 400, 'the modulation tab could not be located');
        const label = (body.match(/scheme\.label|sch\.label/g) || []).length;
        same(label, 1, 'the mix label is drawn ' + label + ' times on one screen');
        ok(!/all elements/.test(body), 'the old size caption is still drawn');
    });

    check('the crystal IS the readout, and shows the mix', () => {
        // "Incorporating the crystal": it cycles through the colours actually
        // in the mix, which is why no separate colour strip is needed.
        const at = SRC.clone.indexOf('function _drawModTab');
        const body = SRC.clone.slice(at, SRC.clone.indexOf('\n}\n', at));
        ok(/_draw2DCrystal\(/.test(body), 'the crystal is gone from the modulation tab');
        ok(/cycleColor/.test(body), 'the crystal is not driven by the mix colours');
        // And the cycle colour comes from the mix, not from a fixed list.
        const panel = SRC.clone.slice(SRC.clone.indexOf('function drawCrystalPanel'));
        ok(/scheme\.colors\[cycleIdx\]/.test(panel), 'the cycle no longer reads the mix');
    });

    check('the crystal panel no longer draws a slider', () => {
        ok(!/_crystalSliderTrack/.test(SRC.clone), 'the slider track is still published');
        ok(!/_crystalSliderDrag/.test(SRC.clone), 'the slider drag flag survives in clone.js');
        ok(!/_crystalSliderDrag/.test(SRC.input), 'input.js still has a slider drag branch');
    });

    // ─────────────────────────────────────────────────────
    group('it survives a refresh, and a reset clears it');

    await check('the mask round-trips through the save', async () => {
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

    await check('junk in the saved mask does not throw', async () => {
        const store = { tubecrawler_progress: JSON.stringify({ kills: 5, modulation: 'fire' }) };
        const C = await boot(store);
        ok(Array.isArray(C.maskNow()), 'a non-array mask should read as empty');
        const s = C.scheme();
        ok(s.size > 0, 'and fall back to any');
    });

    check('the GAME INDEX sends the player to the one control that exists', () => {
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(!/bottom-right of the HUD/.test(HTML),
           'the index still sends the player to the HUD chip, which is gone');
        ok(/MODULATION tab/.test(HTML), 'the index does not say where the control is');
        ok(/at the Crystal/.test(HTML), 'the index does not say where followers take their element');
        ok(/respawns/.test(HTML), 'the index does not mention re-modulation on respawn');
        ok(!/MODULATION slider/.test(HTML), 'the index still describes the slider');
        ok(!/tri-colour, bi-colour or mono/.test(HTML), 'the index still describes the old bands');
        // And it has to be honest about when the prompt appears, because that
        // is the thing that was reported as always-on.
        ok(/RE-MODULATE/.test(HTML), 'the index never mentions the prompt');
        ok(/untouched mix/i.test(HTML),
           'the index does not explain that an untouched mix takes new elements in');
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
