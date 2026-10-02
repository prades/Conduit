// PROGRESSION: depth, not purchases.
//
// The shop is gone — all four panes (Supply, Pylons, Armaments, Builds) and
// every item in them. Removing it took two things with it that the game cannot
// do without, and both had to be replaced in the same change:
//
//   - ELEMENT UNLOCKS were shop-only. Without a replacement the player is
//     locked to fire and electric for the whole game.
//   - AMMO was shop-only. Without a replacement the weapon is dry forever
//     after the opening magazine.
//
// Elements now come from depth: kill a zone's nest, take its element. Ammo
// comes from hacking a wall panel. Both are acts in the world rather than
// purchases, which is the point of the revamp.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const SRC = {};
for (const f of ['config', 'wavedata', 'waves', 'game', 'clone', 'helpers', 'predator']) {
    SRC[f] = fs.readFileSync(path.join(ROOT, `js/${f}.js`), 'utf8');
}
const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
const { scriptOrder, makeBrowserSandbox, fnSource } = require('./domstub.js');

// The whole page, so a wave can be cleared the way the game clears one. The
// fragment sandbox below calls noteWaveClearedForProgression directly, which
// cannot tell whether checkWaveClear actually reaches it.
async function bootGame() {
    const store = {};
    const sandbox = makeBrowserSandbox(store);
    const ctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is noisy under stubs */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    return {
        run, store,
        // Meet the quota, then let checkWaveClear do what it does.
        clearOne() {
            run(`gameState.phase = "night"; nightEnemiesTarget = 1; nightKillCount = 1;
                 alertSource = { x: 20, y: 2 };`);
            run('checkWaveClear();');
        },
        pending() { return run('[...pendingElements]'); },
        unlocked() { return run('[...unlockedElements]'); },
    };
}

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// The real progression code out of wavedata.js, with a Crystal to walk back to.
// `starting` overrides the starting set for the checks that test a RULE of the
// ladder rather than the ladder the game ships with. Stacking two unclaimed
// rewards needs at least two elements left to earn, and the shipped ladder is
// down to one — but the rule still has to hold if a seventh element is ever
// added, so it is tested against a widened ladder and the real one is pinned
// separately below.
function makeEnv(starting) {
    const sandbox = {
        console, Math, Object, Array, String, Number, Set, Map, isNaN, isFinite, parseInt,
        floatingTexts: [],
        canvas: { width: 800, height: 600 },
        ELEMENTS: [
            { id: 'fire', label: 'FIRE', color: '#ff3300' },
            { id: 'electric', label: 'ELECTRIC', color: '#ffee33' },
            { id: 'ice', label: 'ICE', color: '#99ddff' },
            { id: 'flux', label: 'FLUX', color: '#9933ff' },
            { id: 'core', label: 'CORE', color: '#00ccaa' },
            { id: 'toxic', label: 'TOXIC', color: '#66ff66' },
        ],
        unlockedElements: new Set(['fire', 'electric']),
        pendingElements: [],
        lifetimeKills: 0,
        modulationDirty: false,
        unlockSaves: 0, progressSaves: 0,
        // Read out of config.js rather than written here: the wave ladder is
        // "every element that is not a starting one", so a fixture that
        // disagreed with the real pair would test a different ladder.
        STARTING_ELEMENTS: starting || JSON.parse(
            SRC.config.match(/const STARTING_ELEMENTS = (\[[^\]]*\])/)[1].replace(/'/g, '"')),
    };
    if (starting) sandbox.unlockedElements = new Set(starting);
    sandbox.saveUnlocks  = () => { sandbox.unlockSaves++; };
    sandbox.saveProgress = () => { sandbox.progressSaves++; };
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    const from = SRC.wavedata.indexOf('const WAVE_UNLOCK_ORDER');
    const at   = SRC.wavedata.indexOf('function activatePendingElement', from);
    if (from < 0 || at < 0) { console.log('  FAIL could not find the progression block'); process.exit(1); }
    let i = SRC.wavedata.indexOf('{', at), depth = 0;
    while (true) {
        if (SRC.wavedata[i] === '{') depth++;
        else if (SRC.wavedata[i] === '}') depth--;
        if (depth === 0) break;
        i++;
    }
    vm.runInContext(SRC.wavedata.slice(from, i + 1), ctx, { filename: 'wavedata.js:progression' });
    return { sandbox, run: s => vm.runInContext(s, ctx) };
}
function kill(env, n) { for (let k = 0; k < n; k++) env.run('noteKillForProgression()'); }
function clearWave(env, n) {
    for (let k = 0; k < (n === undefined ? 1 : n); k++) env.run('noteWaveClearedForProgression()');
}
// The ladder, read out of the running code rather than restated: it is derived
// from ELEMENTS minus STARTING_ELEMENTS, so a new element extends it.
const ladder = env => env.run('[...WAVE_UNLOCK_ORDER]');

group('a cleared wave earns an element');

check('THE ASK: clearing a wave earns the next element', () => {
    const env = makeEnv();
    same(env.sandbox.pendingElements.length, 0, 'nothing earned before the first wave');
    clearWave(env);
    same(env.sandbox.pendingElements.join(','), ladder(env)[0],
         'the first cleared wave should earn the first element');
});

check('THE ASK: every single wave earns one', () => {
    const env = makeEnv();
    const L = ladder(env);
    for (let i = 0; i < L.length; i++) {
        clearWave(env);
        same(env.sandbox.pendingElements.length, i + 1,
             `wave ${i + 1} should have earned ${i + 1} elements in total`);
    }
    same(env.sandbox.pendingElements.join(','), L.join(','), 'and in ladder order');
});

check('kills no longer gate anything', () => {
    // They are still counted — the Crystal shows the total — but a pile of
    // kills with no cleared wave earns nothing.
    const env = makeEnv();
    kill(env, 500);
    same(env.sandbox.pendingElements.length, 0, 'kills should not earn elements any more');
    same(env.sandbox.lifetimeKills, 500, 'but they should still be counted');
    ok(!/KILL_UNLOCKS/.test(SRC.wavedata), 'the kill ladder is still in the source');
});

check('THE LIMIT: the ladder is spent once every element is earned', () => {
    // Four to earn, so the fifth cleared wave has nothing to give. Asserted
    // rather than left implicit, because "an element every wave" cannot hold
    // past wave four with six elements in the game.
    const env = makeEnv();
    const L = ladder(env);
    clearWave(env, L.length + 3);
    same(env.sandbox.pendingElements.length, L.length,
         'it should stop at the end of the ladder, not keep pushing');
    same(env.run('noteWaveClearedForProgression()'), null, 'and report that there was nothing to give');
});

check('the ladder is derived from ELEMENTS, not written out again', () => {
    // A hand-written list is how a newly added element ends up unreachable.
    const env = makeEnv();
    const L = ladder(env);
    const starting = env.sandbox.STARTING_ELEMENTS;
    for (const el of env.sandbox.ELEMENTS) {
        ok(starting.includes(el.id) || L.includes(el.id), el.id + ' can never be obtained');
    }
    same(L.length, env.sandbox.ELEMENTS.length - starting.length, 'the ladder is the wrong length');
    ok(/ELEMENTS\s*\n?\s*\.map/.test(SRC.wavedata), 'WAVE_UNLOCK_ORDER is not derived from ELEMENTS');
});

check('earning is NOT activating — it does not go straight into the pool', () => {
    // This is the whole two-step: the Crystal is where an element comes online.
    const env = makeEnv();
    clearWave(env);
    ok(!env.sandbox.unlockedElements.has(ladder(env)[0]),
       'an earned element must not be usable before it is activated');
    same(env.sandbox.unlockSaves, 0, 'and must not be written as unlocked');
    ok(env.sandbox.floatingTexts.some(t => /ACTIVATE AT THE CRYSTAL/.test(t.text)),
       'the player should be told where to go');
});

check('activating at the crystal brings it online', () => {
    const env = makeEnv();
    const el = ladder(env)[0];
    clearWave(env);
    same(env.run('activatePendingElement')(el), el, 'it should activate');
    ok(env.sandbox.unlockedElements.has(el), 'it should now be usable');
    same(env.sandbox.pendingElements.length, 0, 'and no longer pending');
    ok(env.sandbox.unlockSaves > 0, 'the unlock should persist');
});

check('activating flags the modulation as stale', () => {
    const env = makeEnv();
    clearWave(env);
    same(env.sandbox.modulationDirty, false, 'clean before');
    env.run('activatePendingElement')(ladder(env)[0]);
    same(env.sandbox.modulationDirty, true, 'a new element makes the modulation stale');
    ok(env.sandbox.floatingTexts.some(t => /RE-MODULATE/.test(t.text)), 'the player should be prompted');
});

check('activating something you have not earned does nothing', () => {
    const env = makeEnv();
    same(env.run('activatePendingElement')('toxic'), null, 'not earned');
    same(env.run('activatePendingElement')('fire'), null, 'already held');
    same(env.run('activatePendingElement')(undefined), null, 'nonsense');
    same(env.sandbox.unlockedElements.size, 2, 'nothing should have been granted');
});

check('an element is never earned twice', () => {
    const env = makeEnv();
    const el = ladder(env)[0];
    clearWave(env, 3);
    same(env.sandbox.pendingElements.filter(e => e === el).length, 1, 'pending once');
    env.run('activatePendingElement')(el);
    clearWave(env, 3);
    ok(!env.sandbox.pendingElements.includes(el), 'an activated element must not come back as pending');
});

check('putting off the trip back does not forfeit the reward', () => {
    // The reward is for the wave. Clearing another while one is still pending
    // should stack rather than overwrite or be dropped.
    //
    // Tested against a WIDENED ladder: the shipped game now starts with five of
    // the six elements, so there is only one left to earn and two waves cannot
    // both pay out. The rule is still the rule, and it has to keep holding if a
    // seventh element is ever added.
    const env = makeEnv(['fire', 'electric']);
    ok(ladder(env).length >= 2, 'fixture: this needs at least two earnable elements');
    clearWave(env);
    clearWave(env);
    same(env.sandbox.pendingElements.length, 2, 'both waves should have paid out');
    same(new Set(env.sandbox.pendingElements).size, 2, 'and with different elements');
});

check('THE WIRING: the wave clear is what calls it', () => {
    const at = SRC.waves.indexOf('function checkWaveClear');
    const body = SRC.waves.slice(at, SRC.waves.indexOf('\n}', at));
    ok(/noteWaveClearedForProgression\(\)/.test(body), 'checkWaveClear does not earn the element');
    // Once per wave: checkWaveClear returns early unless the phase is "night",
    // and it sets the phase to "waveComplete" before paying out.
    ok(body.indexOf('gameState.phase = "waveComplete"') <
       body.indexOf('noteWaveClearedForProgression()'),
       'the phase must be closed out first, or a wave could pay twice');
    same((SRC.waves.match(/noteWaveClearedForProgression\(\)/g) || []).length, 1,
         'it should be called from exactly one place');
});

check('the readout says which element is next', () => {
    // Widened for the same reason: with a one-element ladder there is no
    // "next" left to move on to once the first is earned.
    const env = makeEnv(['fire', 'electric']);
    const n = env.run('nextWaveUnlock()');
    same(n.element, ladder(env)[0], 'the first element should be next');
    clearWave(env);
    const after = env.run('nextWaveUnlock()');
    ok(after && after.element !== ladder(env)[0],
       'an earned element should not still be next');
});

check('THE SHIPPED LADDER: what you start with, and what is left', () => {
    // Pinned, because STARTING_ELEMENTS decides the whole ladder and the
    // checks above deliberately widen it.
    const env = makeEnv();
    const start = env.sandbox.STARTING_ELEMENTS;
    for (const id of ['electric', 'core', 'toxic', 'flux', 'fire']) {
        ok(start.includes(id), 'the game should start with ' + id.toUpperCase());
    }
    ok(!start.includes('ice'), 'ICE should be the one still to earn');
    same(ladder(env).join(','), 'ice', 'the ladder should be exactly ICE');
});

check('and the very first cleared wave spends it', () => {
    // The direct consequence of starting with five: one wave and the ladder is
    // done. Worth stating plainly rather than leaving to be discovered.
    const env = makeEnv();
    clearWave(env);
    same(env.sandbox.pendingElements.join(','), 'ice', 'the first wave should earn ICE');
    clearWave(env);
    same(env.sandbox.pendingElements.length, 1, 'and a second wave has nothing left to pay');
    same(env.run('nextWaveUnlock()'), null, 'with nothing reported as next');
});

check('with everything held there is nothing next', () => {
    const env = makeEnv();
    for (const id of ladder(env)) env.sandbox.unlockedElements.add(id);
    same(env.run('nextWaveUnlock()'), null, 'nothing left to earn');
});

check('progress is saved as it is made', () => {
    const env = makeEnv();
    kill(env, 3);
    ok(env.sandbox.progressSaves >= 3, 'each kill should be recorded');
});

group('the crystal is where it happens');

check('the modulation actually drives recruits now', () => {
    // _getModScheme() only ever fed a label and swatches; recruits took any
    // unlocked element regardless of how the crystal was modulated.
    ok(/function recruitElementPool/.test(SRC.clone), 'no recruit pool from the scheme');
    const NPC = fs.readFileSync(path.join(ROOT, 'js/npc.js'), 'utf8');
    ok(/recruitElementPool\(\)/.test(NPC), 'recruits do not use the modulation pool');
    ok(!/const pool = \[\.\.\.unlockedElements\];/.test(NPC),
       'recruits still ignore the modulation and take any unlocked element');
});

check('the pool never comes back empty', () => {
    // A recruit with no element is worse than an unmodulated one.
    const at = SRC.clone.indexOf('function recruitElementPool');
    const body = SRC.clone.slice(at, at + 500);
    ok(/ids\.length \? ids : \[\.\.\.unlockedElements\]/.test(body), 'no fallback for an empty scheme');
    ok(/unlockedElements\.has\(id\)/.test(body), 'the pool should only offer activated elements');
});

check('a boss modulator still overrides the modulation', () => {
    const NPC = fs.readFileSync(path.join(ROOT, 'js/npc.js'), 'utf8');
    const at = NPC.indexOf('if (activeCrystalModulation) {');
    ok(at > -1, 'the boss modulator override is gone');
    ok(at < NPC.indexOf('recruitElementPool()'), 'the modulator should be checked first');
});

check('the crystal offers an ACTIVATE control per pending element', () => {
    ok(/EARNED — TAP TO ACTIVATE/.test(SRC.clone), 'the tab does not offer activation');
    ok(/_modActivateRects/.test(SRC.clone), 'no hit targets for activation');
    ok(/activatePendingElement\(r\.id\)/.test(SRC.clone), 'tapping one does not activate it');
    // Checked before the swatches, or an ACTIVATE tap that happens to land on
    // a swatch toggles the mix instead of bringing the element online.
    ok(SRC.clone.indexOf('_modActivateRects||[]') < SRC.clone.indexOf('_modSwatchRects||[]'),
       'the activate tap must be checked before the modulation swatches');
});

check('the crystal shows what is next when nothing is pending', () => {
    ok(/nextWaveUnlock\(\)/.test(SRC.clone), 'the tab does not show the next unlock');
    ok(/CLEAR A WAVE/.test(SRC.clone), 'it does not say how the next one is earned');
});

check('THE PROMPT: the crystal button says an element is waiting', () => {
    const at = SRC.clone.indexOf('function drawCrystalButton');
    const body = SRC.clone.slice(at, at + 2200);
    ok(/pendingElements\.length > 0 \|\| modulationDirty/.test(body),
       'the button does not prompt');
    ok(/ELEMENT READY/.test(body), 'no prompt for a pending element');
    ok(/RE-MODULATE/.test(body), 'no prompt for a stale modulation');
    ok(/!crystalMenuOpen/.test(body), 'it should stop prompting once the menu is open');
});

check('re-modulating clears the prompt', () => {
    ok(/modulationDirty = false;\s*\/\/ they have modulated/.test(SRC.clone),
       'changing the modulation does not clear the stale flag');
});

group('it survives a refresh, and a reset clears it');

check('kills and pending elements persist', () => {
    const SAVE = fs.readFileSync(path.join(ROOT, 'js/save.js'), 'utf8');
    for (const fn of ['saveProgress', 'loadProgress', 'clearProgress', 'applyProgress']) {
        ok(new RegExp('function ' + fn).test(SAVE), 'no ' + fn);
    }
    const INIT = fs.readFileSync(path.join(ROOT, 'js/init.js'), 'utf8');
    ok(/applyProgress\(loadProgress\(\)\)/.test(INIT), 'progress is never loaded');
    ok(INIT.indexOf('unlockedElements = new Set(getUnlocks())') < INIT.indexOf('applyProgress'),
       'progress must load after unlocks, so activated elements drop out of pending');
});

check('an already-activated element does not come back as pending', () => {
    const SAVE = fs.readFileSync(path.join(ROOT, 'js/save.js'), 'utf8');
    const at = SAVE.indexOf('function applyProgress');
    ok(/!unlockedElements\.has\(e\)/.test(SAVE.slice(at, at + 400)),
       'applyProgress should drop pending elements that are already online');
});

check('progress is kept out of the session blob', () => {
    // Clearing a session must not cost the player their elements.
    const SAVE = fs.readFileSync(path.join(ROOT, 'js/save.js'), 'utf8');
    const at = SAVE.indexOf('tubecrawler_session');
    const blob = SAVE.slice(at, at + 600);
    ok(!/lifetimeKills|pendingElements/.test(blob), 'progress is inside the session snapshot');
    ok(/tubecrawler_progress/.test(SAVE), 'progress has no storage key of its own');
});

check('a reset clears it all', () => {
    ok(/clearProgress\(\)/.test(SRC.waves), 'restartGame does not clear progress');
    ok(/pendingElements=\[\]; lifetimeKills=0; modulationDirty=false;/.test(SRC.waves),
       'restartGame leaves progression state behind');
    ok(/modulationMask=new Set\(STARTING_ELEMENTS\);/.test(SRC.waves),
       'restartGame leaves the modulation where it was');
});

check('every enemy killed counts, wanderers included', () => {
    // The wave quota ignores wanderers; progression should not, because it is a
    // record of what you have fought rather than of a quota.
    ok(/noteKillForProgression\(\);/.test(SRC.game), 'kills are never reported to progression');
    const at = SRC.game.indexOf('!a.progressCounted');
    ok(at > -1, 'no separate progression guard — it would share the wave flag');
    const block = SRC.game.slice(at - 200, at + 200);
    ok(!/isWanderer/.test(block), 'progression should not skip wanderers');
    same((SRC.game.match(/noteKillForProgression\(\)/g) || []).length, 1, 'reported more than once');
});

group('the in-game docs match');

check('the index describes waves and the crystal, not zones, kills or a shop', () => {
    ok(!/purchased in the shop/.test(HTML), 'the docs still describe buying elements');
    ok(!/ZONE 1 nest/.test(HTML), 'the docs still describe the old nest rule');
    ok(/There is no shop/.test(HTML), 'the docs do not say the shop is gone');
    ok(/Clear a wave, earn an element/i.test(HTML), 'the docs do not state the wave rule');
    ok(/no longer earn anything/i.test(HTML), 'the docs do not say kills stopped gating');
    ok(/activate/i.test(HTML), 'the docs do not mention activating at the crystal');
});

check('the documented ladder matches the code', () => {
    const env = makeEnv();
    const L = ladder(env);
    L.forEach((id, i) => {
        // The index lists each element against the wave it arrives on.
        const re = new RegExp(id.toUpperCase() + '[\\s\\S]{0,120}?wave ' + (i + 1), 'i');
        ok(re.test(HTML), `the docs do not put ${id.toUpperCase()} on wave ${i + 1}`);
    });
    ok(/CLEARED WAVE EARNS/i.test(HTML), 'the index still describes the kill ladder');
    ok(!/25 kills|180 kills/.test(HTML), 'the old kill thresholds are still documented');
    // And it must be honest about running out.
    // Singular when there is one left, which there now is — the text has to
    // read as English, not as a template.
    ok(new RegExp('spent after ' + L.length + ' wave' + (L.length === 1 ? '\\b' : 's'), 'i').test(HTML),
       'the index does not say the ladder runs out after ' + L.length);
});

group('THE OBJECTIVE LINE: what to take next');

// REPORTED: "after each zone that you conquer it should update the top, and it
// should say to conquer the next zone and which zone it is you need to attack."
//
// The banner read "Best Zone: 3" — a score, not an objective. It named what had
// already been done and never said where to go, and the string was written out
// in six places, each slightly different.
//
// A zone is CONQUERED by clearing the wave its alarm came from, which is what
// moves highestZoneCleared, so the next objective is simply the zone after it.

const OBJ = (() => {
    const sandbox = {
        console, Math, Object, Array, String, Number, JSON,
        gameState: { highestZoneCleared: 0, phase: 'day' },
        alertActive: false, alertZone: null, alertSource: null, alertType: 'facility',
        nightKillCount: 0, nightEnemiesTarget: 0,
        getZoneIndex: x => Math.floor(x / 15),
        // A banner element good enough to take the text AND the alarm class,
        // because the flash now lives on the class rather than on the canvas.
        waveUI: (() => {
            const classes = new Set();
            return {
                textContent: '',
                classList: {
                    toggle: (n, on) => { if (on) classes.add(n); else classes.delete(n); },
                    contains: n => classes.has(n),
                },
            };
        })(),
    };
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    // alarmLabel reads a table declared beside it. Take the real declaration
    // rather than restating the three names here, so a test cannot agree with
    // itself while the game says something else.
    const table = SRC.waves.match(/const ALARM_LABELS = \{[\s\S]*?\};/);
    if (!table) throw new Error('the alarm label table could not be located');
    vm.runInContext(table[0].replace('const ', 'var '), ctx, { filename: 'waves.js:ALARM_LABELS' });
    for (const name of ['nextZoneToTake', 'alarmLabel', 'objectiveText', 'updateObjectiveUI']) {
        vm.runInContext(fnSource('js/waves.js', name), ctx, { filename: 'waves.js:' + name });
    }
    return { sandbox, run: e => vm.runInContext(e, ctx) };
})();

check('THE ASK: it names the zone to attack next', () => {
    OBJ.sandbox.gameState.highestZoneCleared = 3;
    OBJ.sandbox.alertActive = false;
    const line = OBJ.run('objectiveText()');
    ok(/NEXT: ZONE 4/.test(line), 'it does not name the next zone: ' + line);
    ok(/ZONE 3 TAKEN/.test(line), 'nor what was just taken: ' + line);
});

check('and it says HOW to start it', () => {
    OBJ.sandbox.gameState.highestZoneCleared = 2;
    OBJ.sandbox.alertActive = false;
    ok(/hack a nest/i.test(OBJ.run('objectiveText()')),
       'it does not say how to pick the fight');
});

check('a fresh game is pointed at zone 1', () => {
    OBJ.sandbox.gameState.highestZoneCleared = 0;
    OBJ.sandbox.alertActive = false;
    const line = OBJ.run('objectiveText()');
    ok(/NEXT: ZONE 1/.test(line), 'a new game is not pointed anywhere: ' + line);
    ok(!/ZONE 0 TAKEN/.test(line), 'it claims zone 0 was conquered: ' + line);
});

check('the next zone is always the one after the last taken', () => {
    for (const taken of [0, 1, 5, 11]) {
        OBJ.sandbox.gameState.highestZoneCleared = taken;
        same(OBJ.run('nextZoneToTake()'), taken + 1, 'after taking ' + taken);
    }
});

check('during the fight it shows the fight, not the next objective', () => {
    OBJ.sandbox.gameState.highestZoneCleared = 2;
    OBJ.sandbox.gameState.phase = 'night';
    OBJ.sandbox.alertActive = true;
    OBJ.sandbox.alertZone = 3;
    OBJ.sandbox.nightKillCount = 2;
    OBJ.sandbox.nightEnemiesTarget = 7;
    const line = OBJ.run('objectiveText()');
    ok(/TAKING ZONE 3/.test(line), 'it does not name the zone being taken: ' + line);
    ok(/2\/7/.test(line), 'nor the quota: ' + line);
    OBJ.sandbox.alertActive = false;
    OBJ.sandbox.gameState.phase = 'day';
});

check('THE MOMENT OF CONQUEST: the alarm no longer wins the line', () => {
    // alertActive is still set when a zone is taken, so the alarm branch used
    // to win and the banner read "TAKING ZONE 1 — Kill 5/5" at exactly the
    // moment zone 1 had been taken. The PHASE is what says the fight is over.
    OBJ.sandbox.gameState.highestZoneCleared = 1;
    OBJ.sandbox.gameState.phase = 'waveComplete';
    OBJ.sandbox.alertActive = true;
    OBJ.sandbox.alertZone = 1;
    OBJ.sandbox.nightKillCount = 5;
    OBJ.sandbox.nightEnemiesTarget = 5;
    const line = OBJ.run('objectiveText()');
    ok(/NEXT: ZONE 2/.test(line), 'the line still shows the finished fight: ' + line);
    ok(!/TAKING/.test(line), 'it is still counting kills for a wave that is over: ' + line);
    OBJ.sandbox.alertActive = false;
    OBJ.sandbox.gameState.phase = 'day';
});

check('it is refreshed AT the clear, not on the next wave', () => {
    const at = SRC.waves.indexOf('function checkWaveClear');
    const body = SRC.waves.slice(at, SRC.waves.indexOf('\n}', at));
    ok(at > -1 && body.length > 200, 'checkWaveClear could not be located');
    ok(/updateObjectiveUI\(\)/.test(body),
       'the banner is not refreshed when the zone is taken');
    ok(body.indexOf('highestZoneCleared =') < body.indexOf('updateObjectiveUI()'),
       'the refresh runs before the zone is recorded, so it names the old one');
});

check('ONE line, not six copies of a string', () => {
    // It was written out at every site that touched the banner.
    ok(!/waveUI\.textContent = "Best Zone/.test(SRC.waves),
       'a "Best Zone" banner string is still written by hand');
    const writes = (SRC.waves.match(/waveUI\.textContent\s*=/g) || []).length;
    ok(writes <= 2,
       writes + ' places still write the banner directly instead of calling updateObjectiveUI');
    same((SRC.waves.match(/function objectiveText/g) || []).length, 1,
         'the objective line is built in more than one place');
});

check('the canvas does not paint a SECOND copy of the line', () => {
    // It used to, at a hardcoded screen position (230, 58) — which is inside
    // the banner's box on anything narrower than a desktop, so on a tablet the
    // two sentences printed over each other and neither could be read.
    // REPORTED: "update the HUD so that all parts are visible, the wave
    // information is hidden".
    const GAME = SRC.game;
    ok(!/Best Zone: "\+gameState\.highestZoneCleared/.test(GAME),
       'the HUD still shows a score instead of an objective');
    for (const phrase of ['HOME SECURE', 'NEXT: ZONE', 'PROXIMITY ALARM',
                          'ZONE ALARM', 'FACILITY BREACH']) {
        ok(!new RegExp('fillText\\([^)]*' + phrase).test(GAME)
           && GAME.indexOf('"' + phrase + '"') === -1,
           'the canvas still paints "' + phrase + '" over the banner');
    }
    // And the one place that DOES say it must still work the zone out itself.
    ok(/nextZoneToTake/.test(SRC.waves), 'the banner no longer derives the next zone');
});

check('the alarm kind survives the move off the canvas', () => {
    // Deleting the canvas copy nearly took "PROXIMITY ALARM" with it — what
    // tripped the alarm is the one thing the banner did not already say.
    OBJ.sandbox.gameState.highestZoneCleared = 1;
    OBJ.sandbox.gameState.phase = 'night';
    OBJ.sandbox.alertActive = true;
    OBJ.sandbox.alertZone = 2;
    OBJ.sandbox.nightKillCount = 1;
    OBJ.sandbox.nightEnemiesTarget = 4;
    // The types come from the world generator's own list, not from a copy here
    // — the first version of this test invented a type ("breach") the game
    // never raises, and passed anyway against a fallback.
    const WORLD = fs.readFileSync(path.join(ROOT, 'js/world.js'), 'utf8');
    const listed = WORLD.match(/PANEL_ALARM_TYPES\s*=\s*\[([^\]]*)\]/);
    ok(!!listed, 'the alarm types could not be located in the world generator');
    const kinds = listed[1].match(/"([^"]+)"/g).map(s => s.replace(/"/g, ''));
    same(kinds.length, 3, 'there are no longer three kinds of alarm');
    const seen = {};
    for (const kind of kinds) {
        OBJ.sandbox.alertType = kind;
        const line = OBJ.run('objectiveText()');
        const label = OBJ.run(`alarmLabel(${JSON.stringify(kind)})`);
        ok(label !== 'INTRUDER ALERT', kind + ' is raised but has no name of its own');
        ok(line.indexOf(label) > -1, kind + ' does not name itself: ' + line);
        ok(/TAKING ZONE 2/.test(line) && /1\/4/.test(line),
           'naming the alarm cost the zone or the quota: ' + line);
        seen[label] = true;
    }
    same(Object.keys(seen).length, 3, 'the three alarms are not told apart');
    OBJ.sandbox.alertActive = false;
    OBJ.sandbox.gameState.phase = 'day';
});

check('the banner flashes under alarm, and stops when the alarm does', () => {
    // The canvas painted the flashing copy. Deleting it would have left the
    // alarm looking like any other line, so the urgency moved onto the banner
    // itself — which means it now has to be TAKEN OFF again, or the line stays
    // red for the rest of the game.
    const lit = () => OBJ.sandbox.waveUI.classList.contains('alarm');
    OBJ.sandbox.gameState.phase = 'night';
    OBJ.sandbox.alertActive = true;
    OBJ.sandbox.alertZone = 2;
    OBJ.run('updateObjectiveUI()');
    ok(lit(), 'the banner does not flash while the alarm is running');
    OBJ.sandbox.alertActive = false;
    OBJ.run('updateObjectiveUI()');
    ok(!lit(), 'the banner is still flashing after the alarm stopped');
    // And it stops at the moment the zone falls, while alertActive is still set.
    OBJ.sandbox.alertActive = true;
    OBJ.sandbox.gameState.phase = 'waveComplete';
    OBJ.run('updateObjectiveUI()');
    ok(!lit(), 'the banner flashes an alarm for a fight that is already won');
    OBJ.sandbox.alertActive = false;
    OBJ.sandbox.gameState.phase = 'day';
    // The whole selector, not a prefix of it: `/#waveInfo\.alarm/` happily
    // matched `#waveInfo.alarmX`, so renaming the rule looked like a pass.
    const rule = HTML.match(/#waveInfo\.alarm\s*\{([^}]*)\}/);
    ok(!!rule, 'nothing in the stylesheet reacts to the alarm class');
    ok(/animation|color/.test(rule[1]), 'the alarm rule does not change how the line looks');
});

check('the kill counter updates the banner through the shared builder', () => {
    // The kill site hand-wrote a SEVENTH copy, in a format none of the other
    // six used ("Zone 2" where every other line says "TAKING ZONE 2").
    ok(/function updateKillProgressUI/.test(SRC.waves),
       'there is no shared updater for the tally');
    const at = SRC.game.indexOf('nightKillCount++');
    ok(at > -1, 'the kill counter could not be located');
    const near = SRC.game.slice(at, at + 400);
    ok(/updateKillProgressUI\(\)/.test(near),
       'the kill counter does not refresh the banner through the shared builder');
    ok(!/waveUI\.textContent\s*=/.test(SRC.game),
       'game.js still writes the banner text by hand');
});

(async () => {
    group('a real wave clear, end to end');
    const G = await bootGame();

    check('THE ASK, in the running game: clearing a wave earns an element', () => {
        same(G.pending().length, 0, 'nothing pending before the first wave');
        G.clearOne();
        same(G.pending().length, 1, 'the cleared wave should have earned one');
        same(G.pending()[0], G.run('WAVE_UNLOCK_ORDER[0]'), 'and it should be the first of the ladder');
    });

    // A fresh game: G has already cleared one wave above.
    const H = await bootGame();
    check('and it is one per wave, right up the ladder', () => {
        const L = H.run('[...WAVE_UNLOCK_ORDER]');
        H.clearOne();
        same(H.pending().length, 1, 'fixture: the first wave should pay out');
        for (let i = 1; i < L.length; i++) {
            H.clearOne();
            same(H.pending().length, i + 1, `after ${i + 1} waves, ${i + 1} should be pending`);
        }
        H.clearOne();
        same(H.pending().length, L.length, 'a fifth wave has nothing left to give');
    });

    check('activating them at the crystal brings each online', () => {
        for (const id of G.pending().slice()) G.run(`activatePendingElement(${JSON.stringify(id)});`);
        ok(G.unlocked().length > 2, 'the activated element should be online');
        same(G.run('modulationDirty'), true, 'and the mix should be flagged stale');
    });

    check('the earned element survives a refresh before it is activated', () => {
        const blob = JSON.parse(G.store.tubecrawler_progress || '{}');
        ok(Array.isArray(blob.pending), 'pending elements are not saved');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
