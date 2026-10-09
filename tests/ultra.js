// THE ULTRA TURRET — "When you build 4 turrets next to each other it should
// automatically fuse into an Ultra turret. That takes up 4 tiles. And sprites
// have to move around it."
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
    run('gameState.running = true; if (typeof tutorialMode !== "undefined") tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id));');

    // Turrets at the listed offsets from (home.x + 4, 0), elements by index.
    const build = (cells, els) => run(`(function(){
        actors.length = 0; followers.length = 0; turretShots.length = 0; floatingTexts.length = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false; t.isConnector = false; t.attackModeElement = null; t._ultra = null; t._ultraOf = null; } });
        shardCount = 9999;
        const home = world.find(t => isHomePortal(t)), X = home.x + 4;
        const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
        const els = ${JSON.stringify(els || [])};
        ${JSON.stringify(cells)}.forEach(([dx, dy], i) => _executeBuildInstant(ELEMENTS.find(e => e.id === (els[i] || 'fire')), T(X + dx, dy), 'attack'));
        _cacheAge = -999; render();
        globalThis.__X = X; globalThis.__T = T;
        return { n: _ultras.length, anchors: _ultras.map(u => [u.x - X, u.y]), el: _ultras[0] && _ultras[0]._ultra.el };
    })()`);
    const SQ = [[0, 1], [1, 1], [0, 2], [1, 2]];

    group('FUSING');

    await check('THE ASK: four turrets in a square fuse into one Ultra turret', () => {
        const r = build(SQ);
        ok(r.n === 1 && JSON.stringify(r.anchors[0]) === '[0,1]', JSON.stringify(r));
        ok(run('__T(__X + 1, 2)._ultraOf === __T(__X, 1)'), 'the other three are not part of it');
    });
    await check('three, or four in a row, do not', () => {
        ok(build(SQ.slice(0, 3)).n === 0, 'three fused');
        ok(build([[0, 1], [1, 1], [2, 1], [3, 1]]).n === 0, 'a line of four fused');
    });
    await check('a 2x3 block of six makes one Ultra and leaves two turrets', () => {
        const r = build([[0, 1], [1, 1], [2, 1], [0, 2], [1, 2], [2, 2]]);
        ok(r.n === 1, JSON.stringify(r));
        ok(run('_aPylons.filter(t => !t._ultra && !t._ultraOf).length') === 2, 'not two left over');
    });
    await check('it takes the element most of the four carry', () => {
        ok(build(SQ, ['ice', 'fire', 'fire', 'fire']).el === 'fire', 'not the majority');
    });
    await check('lose one of the four and it is four turrets again (three, here)', () => {
        build(SQ);
        run('const p = __T(__X + 1, 2); p.health = 0; p.destroyed = true; _cacheAge = -999; render();');
        ok(run('_ultras.length') === 0, 'still fused with a part destroyed');
        ok(run('!__T(__X, 1)._ultra && !__T(__X + 1, 1)._ultraOf'), 'flags left behind');
    });
    await check('it is worked out again from the turrets, so a reload keeps it', () => {
        build(SQ);
        run('rebuildUltras(); rebuildUltras();');
        ok(run('_ultras.length') === 1, 'rebuilding lost it');
    });

    group('FIRING');

    // A tough foe `d` tiles right of the square's centre.
    const fight = (d, extra) => run(`(function(){
        const A = __T(__X, 1), U = A._ultra; turretShots.length = 0;
        const S = SPECIES.ant, q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), U.cx + ${d}, U.cy);
        q.team = 'red'; q.provoked = true; q.health = q.maxHealth = 1e7; actors.push(q);
        ${extra || ''}
        // Every shot seen in flight over one firing interval.
        const seen = new Set();
        for (let i = 0; i < TURRET_FIRE_FRAMES + 2; i++) { q.x = U.cx + ${d}; q.y = U.cy; render(); turretShots.forEach(s => seen.add(s)); }
        const big = [...seen].filter(s => s.big), all = seen.size;
        globalThis.__q = q;
        return { big: big.length, all, from: big[0] ? [big[0].src.x - U.cx, big[0].src.y - U.cy] : null,
                 dmg: big[0] ? big[0].dmg : 0, one: turretRoundDamage(A, q) };
    })()`);

    await check('THE ASK: one heavy round from the centre, the four rounds together and more', () => {
        build(SQ);
        const r = fight(2);
        ok(r.big >= 1 && r.all === r.big, 'shots: ' + JSON.stringify(r));
        ok(JSON.stringify(r.from) === '[0,0]', 'not from the centre: ' + JSON.stringify(r.from));
        ok(r.dmg >= r.one * 4, `round ${r.dmg} vs one turret's ${r.one}`);
    });
    await check('it reaches further than a single turret', () => {
        build(SQ);
        const d = run('TURRET_RANGE') + 1;
        ok(fight(d).big >= 1, 'no shot at ' + d + ' tiles');
    });
    await check('its round bursts over the enemies round the one it hits', () => {
        build(SQ);
        const r = run(`(function(){
            const U = __T(__X, 1)._ultra, S = SPECIES.ant;
            const a = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), U.cx + 2, U.cy); a.team = 'red'; a.provoked = true; a.health = a.maxHealth = 1e7;
            const b = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), U.cx + 2.5, U.cy + 0.3); b.team = 'red'; b.health = b.maxHealth = 1e7;
            actors.push(a, b);
            const s = { x: a.x, y: a.y, dmg: 100, src: { x: 0, y: 0, team: 'green' }, el: 'fire', col: '#f40', splash: ULTRA_SPLASH };
            return { n: ultraSplash(s, a), b: 1e7 - b.health };
        })()`);
        ok(r.n === 1 && r.b > 0, JSON.stringify(r));
    });

    group('SOLID');

    await check('THE ASK: nothing stands on its four tiles', () => {
        build(SQ);
        const r = run(`(function(){
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false;
            const S = SPECIES.ant, q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 0, 0); q.team = 'red'; actors.push(q);
            f.x = __X + 0.9; f.y = 1.9; q.x = __X + 1.2; q.y = 2.2;
            ultraBlockTick();
            const inside = a => a.x > __X && a.x < __X + 2 && a.y > 1 && a.y < 3;
            return { f: inside(f), q: inside(q) };
        })()`);
        ok(!r.f && !r.q, 'still inside: ' + JSON.stringify(r));
    });
    await check('THE ASK: a follower sent across it walks round it', () => {
        build(SQ);
        const r = run(`(function(){
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false;
            f.x = __X - 1.5; f.y = 2; f.job = { type: 'move', target: { x: __X + 3.5, y: 2 }, route: null }; f.stance = 'hold';
            let inside = 0;
            for (let i = 0; i < 900; i++) { render(); if (f.x > __X + 0.05 && f.x < __X + 1.95 && f.y > 1.05 && f.y < 2.95) inside++; }
            return { x: f.x - __X, y: f.y, inside };
        })()`);
        ok(r.x > 2.8, 'it never got past: ended at ' + JSON.stringify(r));
        ok(r.inside === 0, 'it walked through it for ' + r.inside + ' frames');
    });
    await check('you walk round it too', () => {
        build(SQ);
        const r = run(`(function(){
            player.x = player.visualX = __X - 1.5; player.y = player.visualY = 2;
            player.targetX = __X + 3.5; player.targetY = 2;
            for (let i = 0; i < 600; i++) render();
            return { x: player.x - __X, y: player.y, ty: player.targetY };
        })()`);
        ok(r.x > 2.5, 'you never got past: ' + JSON.stringify(r));
        ok(Math.abs(r.ty - 2) < 1e-9, 'your walk target was not put back: ' + r.ty);
    });

    group('DRAWING');

    await check('it draws once, from its front tile, as one structure', () => {
        build(SQ);
        ok(/drawUltraTurret\(_A, px, py\)/.test(rd('js/game.js')), 'the pylon pass does not hand it to drawUltraTurret');
        run('player.x = player.visualX = __X; player.y = player.visualY = 3; render(); drawUltraTurret(__T(__X, 1), 100, 100);');
    });
    await check('no glow (the effects rules) and the guide describes it', () => {
        ok(!/shadowBlur\s*=\s*[1-9]/.test(rd('js/ultra.js')), 'ultra.js sets a shadowBlur');
        ok(/ULTRA TURRET/.test(rd('game.html')), 'not in the guide');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
