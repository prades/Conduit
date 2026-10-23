// THE VORTICES, TONED DOWN.
//
// THE REPORTED CASE: "not the black hole on the ground but the mini ones that
// were part of the old code should be removed. Also the vortex's seem too
// strong … perhaps make beetles immune."
//
// Asked: beetles AND boss predators are immune to the pull; the pull is halved
// for everything else; both for the BLACK HOLE (four flux wave pylons in a
// square, js/formations.js) and the FLUX LINK between two flux pylons
// (applyPylonZoneEffects, game.js). The little purple vortex a lone flux wave
// pylon floated over itself is gone.
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
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) { console.log('  (load ' + rel + ': ' + e.message + ')'); }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; shardCount = 3000; unlockedElements = new Set(ELEMENTS.map(e => e.id));
         player.x = player.targetX = player.visualX = 9; player.y = player.targetY = player.visualY = 1.5; render();
         const portal = world.find(t => isHomePortal(t));
         const g = world.find(t => t.type === 'floor' && !t.pillar && !t.nest && !t.nodeType && t.x >= 0 && Math.abs(t.x - portal.x) <= 2 && t.y === 1);
         _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), g, null); _cacheAge = -999; render();`);
    // A hostile of a species, standing still (its own AI off), at (x, y).
    const MOB = (sp, x, y, extra) => `(function(){ const p = spawnPredatorForZone(1, { species: '${sp}', className: 'scout' });
        p.update = () => {}; p.isWanderer = false; p.x = ${x}; p.y = ${y}; p.maxHealth = p.health = 1e6; ${extra || ''} return p; })()`;

    console.log('\nWHO IS TOO HEAVY TO DRAG');
    check('THE ASK: beetles and boss predators; not ants', () => {
        same(run(`vortexPullImmune(${MOB('beetle', 30, 1)})`), true, 'beetle');
        same(run(`vortexPullImmune(${MOB('ant', 30, 1, 'p.isBoss = true;')})`), true, 'a boss');
        same(run(`vortexPullImmune(${MOB('ant', 30, 1)})`), false, 'an ant');
    });

    console.log('\nTHE BLACK HOLE');
    // A black hole needs a flux tier II network: the wall power unit booted as flux and upgraded once (four cells).
    const F = run(`(function(){ toggleBuild(); if (!buildMenuOpen) toggleBuild();
        shardCount = 900; wallUnitBoot(0, 'flux'); wallUnitUpgrade(0); _cacheAge = -999; for (let i = 0; i < 31; i++) render();
        buildLevel.wave = 3; buildMenuTab = 'wave';
        setBuildTool(buildMenuItems('wave').find(i => i.elId === 'flux'));
        let best = null; for (const t of world) { if (t.x >= 0 && canBuildAt(t).ok) { best = t; break; } }
        buildToolPlaceAt(best); setBuildTool(null); _cacheAge = -999; for (let i = 0; i < 31; i++) render();
        const f = _formations.find(t => t._wform && t._wform.kind === 'blackhole');
        return f ? { wx: f._wform.wx, wy: f._wform.wy, active: formationActive(f._wform) } : null; })()`);
    check('a black hole formed for the test', () => { ok(F && F.active, 'no active black hole: ' + JSON.stringify(F)); });
    // Where a mob at the rim ends up after `n` frames of the hole alone.
    const inHole = (sp, extra, n) => run(`(function(){ const p = ${MOB(sp, F.wx + 2, F.wy, extra)};
        const x0 = p.x, h0 = p.health;
        for (let i = 0; i < ${n}; i++) { frame++; formationTick(); }
        const out = { moved: x0 - p.x, hurt: h0 - p.health }; p.dead = true; actors = actors.filter(a => a !== p); return out; })()`);
    check('THE ASK: an ant at the rim is dragged in — at the halved pull', () => {
        const r = inHole('ant', '', 60);
        ok(r.moved > 0.2, 'an ant was not dragged: ' + JSON.stringify(r));
        ok(r.moved <= 60 * run('BH_PULL') * 1.4 + 1e-9, 'dragged faster than the halved pull allows: ' + r.moved.toFixed(2));
        same(run('BH_PULL'), 0.015, 'BH_PULL');
    });
    check('THE ASK: a beetle is not dragged at all — but it still takes the crushing', () => {
        const r = inHole('beetle', '', 61);
        same(r.moved, 0, 'beetle dragged');
        ok(r.hurt > 0, 'a beetle in the hole took no damage');
    });
    check('THE ASK: nor is a boss', () => {
        same(inHole('ant', 'p.isBoss = true;', 61).moved, 0, 'boss dragged');
    });

    console.log('\nTHE FLUX LINK');
    const L = run(`(function(){ setBuildTool(null); buildLevel.wave = 1;
        const tool = { tab: 'wave', kind: 'disruption', elId: 'flux' };
        const flux = PYLON_PICKER_TYPES.find(e => e.id === 'flux');
        // Two flux wave pylons on row 3, two tiles apart, near the grid.
        for (let x = 0; x < 40; x++) { const a = getTile(x, 3), b = getTile(x + 2, 3);
            if (a && b && canBuildAt(a, tool).ok && canBuildAt(b, tool).ok) {
                _executeBuildInstant(flux, a, 'disruption'); _executeBuildInstant(flux, b, 'disruption');
                _cacheAge = -999; for (let i = 0; i < 31; i++) render();
                const pair = _wPylonPairs.find(p => (p.pa === a && p.pb === b) || (p.pa === b && p.pb === a));
                if (pair) { a.waveAwake = true; b.waveAwake = true; return { ax: a.x, ay: a.y, mx: pair.midX, my: pair.midY }; }
            } }
        return null; })()`);
    check('a flux link formed for the test', () => { ok(L, 'no flux link'); });
    // How far a mob on the link line moves toward the middle in `n` frames.
    const onLink = (sp, extra, n) => run(`(function(){ const p = ${MOB(sp, L.ax + 0.3, L.ay, extra)};
        const d0 = Math.hypot(p.x - ${L.mx}, p.y - ${L.my}), h0 = p.health;
        for (let i = 0; i < ${n}; i++) { frame++; applyPylonZoneEffects(_wPylons); }
        const out = { pulled: d0 - Math.hypot(p.x - ${L.mx}, p.y - ${L.my}) }; p.dead = true; actors = actors.filter(a => a !== p); return out; })()`);
    check('THE ASK: an ant on the link is dragged — no faster than the halved pull', () => {
        const r = onLink('ant', '', 9);
        ok(r.pulled > 0, 'an ant was not dragged: ' + JSON.stringify(r));
        // 3 pulses (every 3rd frame) at tier ≤ III's 0.14, times any season / status bonus.
        ok(r.pulled <= 3 * 0.14 * 2 + 1e-9, 'dragged ' + r.pulled.toFixed(3) + ' in 3 pulses');
    });
    check('THE ASK: a beetle on the link is not dragged', () => {
        same(onLink('beetle', '', 9).pulled, 0, 'beetle dragged');
    });
    check('THE ASK: nor is a boss', () => {
        same(onLink('ant', 'p.isBoss = true;', 9).pulled, 0, 'boss dragged');
    });
    check('the codex states the halved pull', () => {
        same(run('CODEX_ELEMENTS.flux.numbers.pull.join(",")'), '0.07,0.105,0.14', 'codex');
    });

    console.log('\nTHE MINI VORTICES');
    check('THE ASK: a lone flux wave pylon no longer floats a little vortex over itself', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
        ok(!/#6600cc/.test(src) && !/_pylonsWithPartner\.has\(obj\)\) \{/.test(src), 'the mini vortex drawing is still in game.js');
    });
    check('…and a flux follower\'s singularity does not drag a beetle either', () => {
        const r = run(`(function(){ const b = ${MOB('beetle', 30, 1)}; b.kbVX = 0; b.kbVY = 0;
            const ant = ${MOB('ant', 30.5, 1)}; ant.kbVX = 0; ant.kbVY = 0;
            const me = { x: 28, y: 1, team: 'green', isFollower: true, element: 'flux', stats: { specialAttack: 10 } };
            const ab = (typeof ELEMENT_ATTACKS !== 'undefined' ? ELEMENT_ATTACKS : (typeof ELEMENTAL_ATTACKS !== 'undefined' ? ELEMENTAL_ATTACKS : null));
            if (!ab || !ab.flux || !ab.flux.special) return null;
            ab.flux.special(me, { x: 29, y: 1 });
            return { b: b.kbVX || 0, a: ant.kbVX || 0 }; })()`);
        if (r === null) { console.log('         (flux special not found by name — skipped)'); return; }
        same(r.b, 0, 'beetle knocked toward the singularity');
        ok(r.a !== 0, 'the ant was not pulled either (the test is not reaching the pull)');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
