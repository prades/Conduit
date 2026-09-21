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

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// The real progression code out of wavedata.js, with a Crystal to walk back to.
function makeEnv() {
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
    };
    sandbox.saveUnlocks  = () => { sandbox.unlockSaves++; };
    sandbox.saveProgress = () => { sandbox.progressSaves++; };
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    const from = SRC.wavedata.indexOf('const KILL_UNLOCKS');
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
const thresholds = () => {
    const m = SRC.wavedata.match(/const KILL_UNLOCKS = \[[\s\S]*?\n\];/)[0];
    return [...m.matchAll(/kills:\s*(\d+), element: "([a-z]+)"/g)].map(x => ({ kills: +x[1], element: x[2] }));
};

group('kills earn elements');

check('THE REPORTED CASE: enough kills earns an element', () => {
    const env = makeEnv();
    const first = thresholds()[0];
    kill(env, first.kills - 1);
    same(env.sandbox.pendingElements.length, 0, 'one kill short should earn nothing');
    kill(env, 1);
    same(env.sandbox.pendingElements.join(','), first.element, 'the threshold should earn it');
});

check('earning is NOT activating — it does not go straight into the pool', () => {
    // This is the whole two-step: the Crystal is where an element comes online.
    const env = makeEnv();
    kill(env, thresholds()[0].kills);
    ok(!env.sandbox.unlockedElements.has(thresholds()[0].element),
       'an earned element must not be usable before it is activated');
    same(env.sandbox.unlockSaves, 0, 'and must not be written as unlocked');
    ok(env.sandbox.floatingTexts.some(t => /ACTIVATE AT THE CRYSTAL/.test(t.text)),
       'the player should be told where to go');
});

check('activating at the crystal brings it online', () => {
    const env = makeEnv();
    const el = thresholds()[0].element;
    kill(env, thresholds()[0].kills);
    same(env.run('activatePendingElement')(el), el, 'it should activate');
    ok(env.sandbox.unlockedElements.has(el), 'it should now be usable');
    same(env.sandbox.pendingElements.length, 0, 'and no longer pending');
    ok(env.sandbox.unlockSaves > 0, 'the unlock should persist');
});

check('activating flags the modulation as stale', () => {
    const env = makeEnv();
    kill(env, thresholds()[0].kills);
    same(env.sandbox.modulationDirty, false, 'clean before');
    env.run('activatePendingElement')(thresholds()[0].element);
    same(env.sandbox.modulationDirty, true, 'a new element makes the slider stale');
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
    const el = thresholds()[0].element;
    kill(env, thresholds()[0].kills + 40);
    same(env.sandbox.pendingElements.filter(e => e === el).length, 1, 'pending once');
    env.run('activatePendingElement')(el);
    kill(env, 60);
    ok(!env.sandbox.pendingElements.includes(el), 'an activated element must not come back as pending');
});

check('every element is reachable, and the thresholds climb', () => {
    const ts = thresholds();
    const env = makeEnv();
    kill(env, ts[ts.length - 1].kills);
    same(env.sandbox.pendingElements.length, ts.length, 'all of them should be earned by the last threshold');
    for (let i = 1; i < ts.length; i++) {
        ok(ts[i].kills > ts[i - 1].kills, `threshold ${i} should cost more than the one before`);
    }
    // Nothing unobtainable.
    const granted = new Set(ts.map(t => t.element));
    for (const el of env.sandbox.ELEMENTS) {
        ok(el.id === 'fire' || el.id === 'electric' || granted.has(el.id),
           el.id + ' can never be obtained');
    }
});

check('the readout says what is next and how far', () => {
    const env = makeEnv();
    const ts = thresholds();
    let n = env.run('nextKillUnlock()');
    same(n.element, ts[0].element, 'the first element should be next');
    same(n.remaining, ts[0].kills, 'with the full count to go');
    kill(env, 10);
    same(env.run('nextKillUnlock()').remaining, ts[0].kills - 10, 'it should count down');
    // Once earned it is no longer "next", even before activation.
    kill(env, ts[0].kills);
    n = env.run('nextKillUnlock()');
    ok(!n || n.element !== ts[0].element, 'an earned element should not still be next');
});

check('with everything held there is nothing next', () => {
    const env = makeEnv();
    for (const t of thresholds()) env.sandbox.unlockedElements.add(t.element);
    same(env.run('nextKillUnlock()'), null, 'nothing left to earn');
});

check('progress is saved as it is made', () => {
    const env = makeEnv();
    kill(env, 3);
    ok(env.sandbox.progressSaves >= 3, 'each kill should be recorded');
});

group('the crystal is where it happens');

check('the modulation slider actually drives recruits now', () => {
    // _getModScheme() only ever fed a label and swatches; recruits took any
    // unlocked element regardless of where the slider sat.
    ok(/function recruitElementPool/.test(SRC.clone), 'no recruit pool from the scheme');
    const NPC = fs.readFileSync(path.join(ROOT, 'js/npc.js'), 'utf8');
    ok(/recruitElementPool\(\)/.test(NPC), 'recruits do not use the modulation pool');
    ok(!/const pool = \[\.\.\.unlockedElements\];/.test(NPC),
       'recruits still ignore the slider and take any unlocked element');
});

check('the pool never comes back empty', () => {
    // A recruit with no element is worse than an unmodulated one.
    const at = SRC.clone.indexOf('function recruitElementPool');
    const body = SRC.clone.slice(at, at + 500);
    ok(/ids\.length \? ids : \[\.\.\.unlockedElements\]/.test(body), 'no fallback for an empty scheme');
    ok(/unlockedElements\.has\(id\)/.test(body), 'the pool should only offer activated elements');
});

check('a boss modulator still overrides the slider', () => {
    const NPC = fs.readFileSync(path.join(ROOT, 'js/npc.js'), 'utf8');
    const at = NPC.indexOf('if (activeCrystalModulation) {');
    ok(at > -1, 'the boss modulator override is gone');
    ok(at < NPC.indexOf('recruitElementPool()'), 'the modulator should be checked first');
});

check('the crystal offers an ACTIVATE control per pending element', () => {
    ok(/EARNED — TAP TO ACTIVATE/.test(SRC.clone), 'the tab does not offer activation');
    ok(/_modActivateRects/.test(SRC.clone), 'no hit targets for activation');
    ok(/activatePendingElement\(r\.id\)/.test(SRC.clone), 'tapping one does not activate it');
    // Checked before the slider, or a tap gets swallowed as a drag.
    ok(SRC.clone.indexOf('_modActivateRects||[]') < SRC.clone.indexOf('Modulation slider drag'),
       'the activate tap must be checked before the slider drag');
});

check('the crystal shows what is next when nothing is pending', () => {
    ok(/nextKillUnlock\(\)/.test(SRC.clone), 'the tab does not show the next unlock');
    ok(/kills", PX \+ 10, pendY\)|in " \+ next\.remaining \+ " kills/.test(SRC.clone),
       'the remaining kill count is not shown');
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
    ok(/modulationDirty = false;\s*\/\/ they have re-modulated/.test(SRC.clone),
       'moving the slider does not clear the stale flag');
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
    ok(/crystalModSlider=0;/.test(SRC.waves), 'restartGame leaves the slider where it was');
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

check('the index describes kills and the crystal, not zones or a shop', () => {
    ok(!/purchased in the shop/.test(HTML), 'the docs still describe buying elements');
    ok(!/ZONE 1 nest/.test(HTML), 'the docs still describe the old nest rule');
    ok(/There is no shop/.test(HTML), 'the docs do not say the shop is gone');
    ok(/kills/i.test(HTML), 'the docs do not mention kills');
    ok(/ACTIVATE/.test(HTML) || /activate/.test(HTML), 'the docs do not mention activating at the crystal');
});

check('the documented thresholds match the code', () => {
    for (const t of thresholds()) {
        const re = new RegExp(t.kills + '[^<]*</span>[\\s\\S]{0,120}?' + t.element.toUpperCase(), 'i');
        const alt = new RegExp(t.element.toUpperCase() + '[\\s\\S]{0,160}?' + t.kills, 'i');
        ok(re.test(HTML) || alt.test(HTML),
           `the docs do not state ${t.element.toUpperCase()} at ${t.kills} kills`);
    }
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
