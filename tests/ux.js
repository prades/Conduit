// WHY IS IT DARK, AND CAN A NEW PLAYER FIND THE RING — the player-experience
// fixes from the design audit.
//
// Held here: a pylon can always say why it has no power; a turret that cannot
// fire says so; a network that loses a tier says so; the long-press ring is
// hinted until it has been used once; and the index describes the real rings.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
async function check(name, fn) {
    try { await fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }

(async () => {
    const ctx = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true;');

    // generator at row[0], a pylon of `kind` at row[1].
    const state = (kind, opts) => run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false;
            t.isConnector = false; t.waveTripped = false; t.connectedPylon = null; t.nestConnection = null;
            t.powered = undefined; if (t.nest) { t.nestHealth = t.nestMaxHealth || 200; t.nestEnergy = undefined; } });
        const row = world.filter(t => t.type === 'floor' && t.y === 3 && t.x >= 4 && !t.nest && !t.nodeType).sort((a,b) => a.x - b.x);
        const o = ${JSON.stringify(opts || {})};
        const base = { pillar: true, destroyed: false, pillarTeam: o.team || 'green', health: 99999, maxHealth: 99999, attackModeElement: 'fire' };
        if (!o.noGen) Object.assign(row[0], base, { isGenerator: true, attackMode: true, attackModeElement: 'generator' });
        const t = row[o.far ? 9 : 1];
        Object.assign(t, base, { attackMode: ${JSON.stringify(kind)} === 'attack', waveMode: ${JSON.stringify(kind)} === 'wave',
            isConnector: ${JSON.stringify(kind)} === 'connector', circuitOn: !o.open });
        if (o.tripped) t.waveTripped = true;
        if (o.energy !== undefined) { const h = world.find(x => isHomePortal(x)); h.nestEnergy = o.energy; }
        _cacheAge = -999; render();
        return pylonPowerState(t);
    })()`);

    group('a pylon can say why it is lit or dark');

    await check('powered: names the nest and its level', () => {
        const s = state('attack'); ok(/^POWERED/.test(s.text) && /%/.test(s.text), s.text);
    });
    await check('no generator or connector in reach', () => {
        const s = state('attack', { noGen: true }); ok(/NO GENERATOR OR CONNECTOR/.test(s.text), s.text);
    });
    await check('a battery that is empty', () => {
        const s = state('attack', { energy: 0 }); ok(/EMPTY/.test(s.text), s.text);
    });
    await check('a wave pylon that shut off says it is waiting to refill', () => {
        const s = state('wave', { tripped: true, energy: 10 }); ok(/SHUT OFF/.test(s.text), s.text);
    });
    await check('a connector with its circuit open says what that means', () => {
        const s = state('connector', { open: true }); ok(/CIRCUIT OPEN/.test(s.text), s.text);
    });
    await check('a connector with it closed shows the nest level', () => {
        const s = state('connector'); ok(/CIRCUIT CLOSED/.test(s.text) && /%/.test(s.text), s.text);
    });
    await check('an enemy pylon is not powered', () => {
        const s = state('attack', { team: 'red' }); ok(/NOT YOURS/.test(s.text), s.text);
    });
    await check('the INFO panel shows it', () => {
        ok(/\["POWER", ps\.text, ps\.colour\]/.test(rd('js/ui.js')), 'the panel has no power row');
    });

    group('silent failures now speak');

    await check('a turret with no power says it fires plain rounds, and why', () => {
        // It no longer goes silent (see tests/gunswitch.js, THE BOLT), so the
        // readout says what it is doing instead of "out of power".
        const s = state('attack', { noGen: true }); ok(/^PLAIN ROUNDS/.test(s.text), s.text);
    });
    await check('a network that loses a tier says so', () => {
        ok(/NETWORK DOWN TO/.test(rd('js/game.js')) && /NETWORK LOST/.test(rd('js/game.js')), 'tier loss is silent');
    });

    group('the top buttons are icons');

    await check('THE ASK: BUILD is a wrench and hammer; SQUAD is one figure on SEL and three on ALL', () => {
        const r = run(`(function(){
            // The shared stub hands back a fresh element per lookup; keep two.
            const mk = () => ({ innerHTML: '', title: '', setAttribute() {}, classList: { toggle() {} } });
            const sq = mk(), bd = mk(), keep = document.getElementById;
            document.getElementById = id => id === 'btnSquad' ? sq : id === 'btnBuild' ? bd : keep(id);
            squadMode = 'all'; toggleSquad(); const sel = sq.innerHTML;
            toggleSquad(); const all = sq.innerHTML;
            buildMode = true; toggleBuild(); const off = bd.innerHTML;
            toggleBuild(); const on = bd.innerHTML;
            squadMode = 'selected'; buildMode = false; document.getElementById = keep;
            return { sel: sel.indexOf(ICON_SQUAD_SEL) === 0 && /SEL/.test(sel), all: all.indexOf(ICON_SQUAD_ALL) === 0 && /ALL/.test(all),
                     off: off.indexOf(ICON_BUILD) === 0 && /OFF/.test(off), on: on.indexOf(ICON_BUILD) === 0 && />ON</.test(on),
                     three: (ICON_SQUAD_ALL.match(/<circle/g) || []).length, one: (ICON_SQUAD_SEL.match(/<circle/g) || []).length };
        })()`);
        ok(r.sel && r.all && r.off && r.on, JSON.stringify(r));
        ok(r.one === 1 && r.three === 3, 'one figure on SEL, three on ALL: ' + JSON.stringify(r));
        const html = rd('game.html');
        ok(/id="btnSquad"[^>]*>\s*<svg/.test(html) && /id="btnBuild"[^>]*>\s*<svg/.test(html), 'the buttons start without their icons');
    });

    group('the quiet bugs from the audit');

    await check('a turret is not lit when the pool cannot pay for a shot', () => {
        const lit = e => run(`(function(){ const h = world.find(x => isHomePortal(x)); h.nestEnergy = ${e}; _cacheAge = -999;
            recomputePower(); const t = world.find(x => x.pillar && x.attackMode && !x.isGenerator && !x.isConnector); return !!t.powered; })()`);
        state('attack');
        ok(lit(POWER_SHOT_COST() - 0.5) === false, 'lit with less than one shot in the pool');
        ok(lit(POWER_SHOT_COST() + 0.5) === true, 'dark with enough for a shot');
        function POWER_SHOT_COST() { return run('POWER_SHOT_COST'); }
    });
    await check('flipping the circuit takes effect at once, not at the next cache rebuild', () => {
        const age = run(`(function(){ const c = world.find(t => t.pillar); c.isConnector = true; c.circuitOn = true; _cacheAge = 0;
            toggleConnectorCircuit(c); return _cacheAge; })()`);
        ok(age < -1000, 'the pylon lists were not invalidated (' + age + ')');
    });
    await check('a pylon taken by the enemy leaves the firing and wave lists at once', () => {
        state('attack');
        const r = run(`(function(){ const t = world.find(x => x.pillar && x.attackMode && !x.isGenerator);
            convertPylonToRed(t, null); const age = _cacheAge; render();
            return { age, still: _aPylons.includes(t) || _wPylons.includes(t) }; })()`);
        ok(r.age < -1000 && !r.still, 'a converted pylon was still firing: ' + JSON.stringify(r));
    });
    await check('the firing and wave lists only ever hold YOUR pylons', () => {
        const src = rd('js/game.js');
        ok(/_aPylons\s*=.*pillarTeam === "green"/.test(src) && /_wPylons\s*=.*pillarTeam === "green"/.test(src), 'a team filter is missing');
    });
    await check('the EMP speed boost survives the slow-recovery pass', () => {
        const el = rd('js/elements.js');
        ok(/_empBaseBase = f\.baseMoveSpeed; f\.baseMoveSpeed = f\.baseMoveSpeed \* 1\.5/.test(el), 'the boost does not raise the base speed');
        ok(/actor\.baseMoveSpeed = actor\._empBaseBase/.test(rd('js/npc.js')), 'the base is not restored when it ends');
        // behaviourally: raised base survives tickSlowSpeed
        const r = run(`(function(){ const a = { moveSpeed: 0.02, baseMoveSpeed: 0.02, state: 'idle', slowed: 0, slowFactor: 1 };
            a._empBaseBase = a.baseMoveSpeed; a.baseMoveSpeed *= 1.5; a.moveSpeed *= 1.5; tickSlowSpeed(a); return a.moveSpeed; })()`);
        ok(Math.abs(r - 0.03) < 1e-9, 'the boost was wiped within a frame: ' + r);
    });
    await check('ice freeze-solid is no longer overwritten by the next pass', () => {
        ok(/if \(!\(a\.slowed > 0 && a\.slowFactor === 0\)\) applySlow\(a, 50, 0\.12\)/.test(rd('js/game.js')), 'the freeze is still overwritten');
    });
    await check('a lone flux pylon uses the same aggro threshold as a pair', () => {
        ok(/pylonExposureFrames>PYLON_AGGRO_EXPOSURE&&!a\.pylonAggro\)\s*a\.pylonAggro=pv/.test(rd('js/game.js')), 'the solo branch still has its own number');
    });
    await check('a recruit keeps the speed its personality gave it', () => {
        ok(/actor\.baseMoveSpeed = actor\.moveSpeed; actor\.slowed = 0/.test(rd('js/npc.js')), 'the base is not reset at the crystal');
    });

    group('the long-press ring is hinted until it has been used');

    const hintFrames = () => run('RING_HINT_FRAMES');
    await check('the tip appears on the interval while the ring is unused', () => {
        const n = run(`(function(){ _ringUsed = false; floatingTexts.length = 0; frame = ${hintFrames()};
            tutorialMode = false; ringHintTick(); return floatingTexts.filter(f => /PRESS AND HOLD/.test(f.text)).length; })()`);
        ok(n === 1, 'expected one tip, got ' + n);
    });
    await check('it stays quiet between intervals', () => {
        const n = run(`(function(){ _ringUsed = false; floatingTexts.length = 0; frame = ${hintFrames()} + 7; ringHintTick();
            return floatingTexts.length; })()`);
        ok(n === 0, 'a tip appeared off the interval');
    });
    await check('opening the ring once ends it for good', () => {
        const n = run(`(function(){ _ringUsed = false; noteRingUsed(); floatingTexts.length = 0; frame = ${hintFrames()};
            ringHintTick(); return [_ringUsed, floatingTexts.length]; })()`);
        ok(n[0] === true && n[1] === 0, JSON.stringify(n));
        ok(/noteRingUsed\(\);\s*\n\s*const dx/.test(rd('js/input.js')), 'a long press does not record that the ring was used');
    });
    await check('no tip during the tutorial', () => {
        const n = run(`(function(){ _ringUsed = false; tutorialMode = true; floatingTexts.length = 0; frame = ${hintFrames()};
            ringHintTick(); tutorialMode = false; return floatingTexts.length; })()`);
        ok(n === 0, 'a tip appeared over the tutorial');
    });

    group('the index describes the real rings');

    const HTML = rd('game.html');
    await check('every ring is named, and the stale claims are gone', () => {
        for (const w of ['ATTACK', 'RE-ROLL', 'TO WORK', 'OPEN / CLOSE CIRCUIT', 'follower index', 'BUILD mode ignores units'])
            ok(HTML.includes(w), 'the index does not mention ' + w);
        ok(!/LEFT — Switch role \/ Destroy nest/.test(HTML), 'the index still lists Destroy nest');
        ok(!/Fire &amp; Electric start/.test(HTML), 'the index still says only two elements start unlocked');
        ok(!/tap tile to place pylon/.test(HTML), 'the index still says to tap a tile to place a pylon');
    });
    await check('the starting elements it states match the game', () => {
        const n = run('STARTING_ELEMENTS.length');
        ok(n === 5 && /Five elements start/.test(HTML), 'the index says something other than the real ' + n);
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
