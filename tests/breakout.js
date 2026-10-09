// ELEMENTAL BREAKOUT — "all predators have new elemental flare just like the
// followers. Has the elemental wheel of super effective attacks and elemental
// weaknesses been uploaded?"
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
    run('gameState.running = true; if (typeof tutorialMode !== "undefined") tutorialMode = false;');
    const foe = (el) => `(function(){ const S = SPECIES.ant, q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 5, 2); q.team = 'red'; q.health = q.maxHealth = 1e6; ${el ? `q.element = '${el}';` : ''} actors.push(q); return q; })()`;
    const hit = (el, targetEl) => run(`(function(){ actors.length = 0; const q = ${foe(targetEl)};
        applyDamage(q, 100, { team: 'green', x: 0, y: 0 }, ${el ? `'${el}'` : 'null'}); return 1e6 - q.health; })()`);

    group('THE WHEEL');

    await check('THE ASK: it is live — a strong element lands 1.3x, a weak one 0.7x, on any hit', () => {
        ok(Math.abs(hit('fire', 'flux') - 130) < 1e-6, 'fire on flux: ' + hit('fire', 'flux'));
        ok(Math.abs(hit('fire', 'toxic') - 70) < 1e-6, 'fire on toxic: ' + hit('fire', 'toxic'));
        ok(Math.abs(hit('electric', 'core') - 130) < 1e-6, 'electric on core: ' + hit('electric', 'core'));
        ok(Math.abs(hit('fire', 'ice') - 100) < 1e-6, 'fire on ice (unrelated) should be 1x: ' + hit('fire', 'ice'));
        ok(hit('ice', 'core') === 0, 'ice does nothing to core');
    });
    await check('the attacker\'s element counts when the hit carries none', () => {
        const r = run(`(function(){ actors.length = 0; const q = ${foe('flux')};
            applyDamage(q, 100, { team: 'green', element: 'fire' }); return 1e6 - q.health; })()`);
        ok(Math.abs(r - 130) < 1e-6, 'got ' + r);
    });
    await check('applyElementalDamage no longer applies it twice', () => {
        const r = run(`(function(){ actors.length = 0; const q = ${foe('flux')}; applyElementalDamage(q, 100, { team: 'green' }, 'fire'); return 1e6 - q.health; })()`);
        ok(Math.abs(r - 130) < 1e-6, 'got ' + r + ' (1.69x would be applied twice)');
    });
    await check('it cuts both ways: a predator\'s element against a follower\'s', () => {
        const r = run(`(function(){ actors.length = 0; followers.length = 0; spawnFollowerAtCrystal('flux'); const f = followers[followers.length - 1];
            f.health = f.maxHealth = 1e6; f.stats = null; const q = ${foe('fire')};
            const plain = ${foe(null)};
            let h = f.health; applyDamage(f, 100, plain); const base = h - f.health;
            h = f.health; applyDamage(f, 100, q); const fire = h - f.health;
            return { base, fire }; })()`);
        ok(Math.abs(r.fire / r.base - 1.3) < 1e-6, 'a fire predator did not hit a flux follower 1.3x as hard: ' + JSON.stringify(r));
    });

    group('THE NIGHT');

    await check('THE ASK: ELEMENTAL BREAKOUT is one of the siege nights', () => {
        ok(run('SIEGES.breakout && SIEGES.breakout.label') === 'ELEMENTAL BREAKOUT', 'not in SIEGES');
    });
    await check('THE ASK: on that night every predator gets an element and its flare; after it, they lose it', () => {
        const r = run(`(function(){ actors.length = 0; const a = ${foe(null)}, b = ${foe(null)};
            siegeToday = 'breakout'; frame = (Math.floor(frame / BREAKOUT_TICK) + 1) * BREAKOUT_TICK; breakoutTick();
            const during = [a.element, b.element, a._breakout];
            siegeToday = null; frame += BREAKOUT_TICK; breakoutTick();
            return { during, after: [a.element, b.element] }; })()`);
        ok(r.during[0] && r.during[1] && r.during[2], 'no elements handed out: ' + JSON.stringify(r));
        ok(!r.after[0] && !r.after[1], 'they kept them after the night: ' + JSON.stringify(r));
    });
    await check('not on other nights, and never the machines or the grub', () => {
        const r = run(`(function(){ actors.length = 0; const a = ${foe(null)};
            const m = spawnMachine('sentry', world.find(t => t.nest && getZoneIndex(t.x) === 2));
            siegeToday = 'storm'; frame = (Math.floor(frame / BREAKOUT_TICK) + 1) * BREAKOUT_TICK; breakoutTick(); const other = a.element;
            siegeToday = 'breakout'; frame += BREAKOUT_TICK; breakoutTick(); const mach = m.element;
            siegeToday = null; frame += BREAKOUT_TICK; breakoutTick();
            return { other: other || null, mach: mach || null }; })()`);
        ok(!r.other && !r.mach, JSON.stringify(r));
    });
    await check('THE ASK: its hits can set its element\'s status on your units', () => {
        const r = run(`(function(){ actors.length = 0; followers.length = 0; spawnFollowerAtCrystal('electric'); const f = followers[followers.length - 1];
            f.health = f.maxHealth = 1e6; f.burning = 0; const q = ${foe('fire')}; q._breakout = true;
            const R = Math.random; Math.random = () => 0; try { applyDamage(f, 10, q); } finally { Math.random = R; }
            return f.burning; })()`);
        ok(r > 0, 'a fire predator\'s hit did not set a burn');
    });
    await check('its flare draws, with no glow', () => {
        run(`(function(){ actors.length = 0; const q = ${foe('ice')}; q._breakout = true; drawBreakoutFlare(q, 100, 100); })()`);
        ok(!/shadowBlur\s*=\s*[1-9]/.test(rd('js/breakout.js')), 'breakout.js sets a shadowBlur');
        ok(/Elemental Breakout/i.test(rd('game.html')) && /ELEMENT WHEEL/.test(rd('game.html')), 'the guide does not explain it');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
