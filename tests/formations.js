// WAVE FORMATIONS — "Whenever 4 flux wave pylons are constructed together it
// creates a black hole in the middle of the four connected pylons (now
// transparent pylons) and lights up when enemies are entangled. When 4 fire
// wave pylons are constructed it creates a small fire wall and gets bigger
// when enemies enter it and damages them."
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

    // A shield generator by home for power, then wave pylons of the listed
    // elements at the listed offsets from (home.x + 3, 0).
    const build = (cells, els, opts) => run(`(function(){
        const o = ${JSON.stringify(opts || {})};
        actors.length = 0; followers.length = 0; floatingTexts.length = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false; t.isConnector = false; t.attackModeElement = null; t._wform = null; t._wformOf = null; t.circuitOn = undefined; } if (t.nest) { t.powerOff = false; t.nestEnergy = undefined; } });
        shardCount = 9999; _formState = new Map();   // a fresh square, not the last test's
        const home = world.find(t => isHomePortal(t)), X = home.x + 3;
        const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
        if (!o.unpowered) _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), T(home.x + 1, 3));
        const els = ${JSON.stringify(els)};
        ${JSON.stringify(cells)}.forEach(([dx, dy], i) => { const id = els[i] || els[0]; const t = T(X + dx, dy); _executeBuildInstant(ELEMENTS.find(e => e.id === id), t, waveRole(id)); t._awakeUntil = Infinity; });
        player.x = player.targetX = player.visualX = home.x - 12; player.y = player.targetY = player.visualY = 2;
        _cacheAge = -999; render();
        globalThis.__X = X; globalThis.__T = T;
        return { n: _formations.length, kinds: _formations.map(t => t._wform.kind), active: _formations.map(t => formationActive(t._wform)) };
    })()`);
    const SQ = [[0, 1], [1, 1], [0, 2], [1, 2]];
    const foe = (x, y) => `(function(){ const S = SPECIES.ant, q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), ${x}, ${y}); q.team = 'red'; q.provoked = true; q.health = q.maxHealth = 1e6; actors.push(q); return q; })()`;

    group('FORMING');

    await check('THE ASK: four flux wave pylons in a square make a black hole', () => {
        const r = build(SQ, ['flux']);
        ok(r.n === 1 && r.kinds[0] === 'blackhole', JSON.stringify(r));
        ok(r.active[0], 'fixture: it is not powered');
    });
    await check('THE ASK: four fire wave pylons in a square make a fire wall', () => {
        const r = build(SQ, ['fire']);
        ok(r.n === 1 && r.kinds[0] === 'firewall', JSON.stringify(r));
    });
    await check('not three, not a mixed square, not other elements, not turrets', () => {
        ok(build(SQ.slice(0, 3), ['flux']).n === 0, 'three formed');
        ok(build(SQ, ['flux', 'flux', 'flux', 'fire']).n === 0, 'a mixed square formed');
        ok(build(SQ, ['ice']).n === 0, 'ice formed something');
    });
    await check('THE ASK: the four round a black hole are drawn see-through', () => {
        ok(/function drawWaveMonolith\(px, base, colour, dark, tier, asleep, ghost\)/.test(rd('js/draw.js')), 'the tablet cannot be faded');
        ok(/_bhF && _bhF.kind === "blackhole" \? 0\.35 : 1/.test(rd('js/game.js')), 'the pylon pass does not fade them');
    });

    group('THE BLACK HOLE');

    await check('THE ASK: it drags enemies in, slows them and crushes them; it lights up holding them', () => {
        build(SQ, ['flux']);
        const r = run(`(function(){
            const F = _formations[0]._wform, q = ${foe('__X + 1 + 1.8', 2)};
            const S = SPECIES.ant;
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.stance = 'hold'; f.x = F.wx - 1.5; f.y = F.wy;
            const d0 = Math.hypot(q.x - F.wx, q.y - F.wy), fx0 = f.x;
            for (let i = 0; i < 60; i++) { q.provoked = true; formationTick(); frame++; }
            return { d0, d1: Math.hypot(q.x - F.wx, q.y - F.wy), hurt: 1e6 - q.health, slowed: q.slowed > 0, glow: F.s.glow, ally: f.x - fx0 };
        })()`);
        ok(r.d1 < r.d0 - 0.5, 'not dragged in: ' + JSON.stringify(r));
        ok(r.hurt > 0 && r.slowed, 'not hurt or slowed: ' + JSON.stringify(r));
        ok(r.glow > 0.1, 'it did not light up: ' + r.glow);
        ok(r.ally === 0, 'it dragged a follower');
    });
    await check('nothing past its reach; dark again once it is empty', () => {
        build(SQ, ['flux']);
        const r = run(`(function(){
            const F = _formations[0]._wform, q = ${foe('__X + 1 + BH_RADIUS + 1', 2)};
            const x0 = q.x; F.s.glow = 1;
            for (let i = 0; i < 90; i++) { formationTick(); frame++; }
            return { moved: q.x - x0, glow: F.s.glow };
        })()`);
        ok(r.moved === 0, 'it reached past its radius');
        ok(r.glow < 0.2, 'still lit with nothing in it: ' + r.glow);
    });
    await check('unpowered, it does nothing and says it needs power', () => {
        const b = build(SQ, ['flux'], { unpowered: true });
        ok(b.n === 1 && !b.active[0], 'fixture: ' + JSON.stringify(b));
        const r = run(`(function(){ const F = _formations[0]._wform, q = ${foe('__X + 1 + 1.5', 2)}; const x0 = q.x; for (let i = 0; i < 60; i++) { formationTick(); frame++; } return q.x - x0; })()`);
        ok(r === 0, 'an unpowered hole pulled');
        ok(/NEEDS POWER/.test(rd('js/formations.js')), 'it does not say why');
    });

    group('THE FIRE WALL');

    await check('THE ASK: small to start; an enemy in it burns, and it grows while one is in it', () => {
        build(SQ, ['fire']);
        const r = run(`(function(){
            const F = _formations[0]._wform, len0 = fireWallLength(F), q = ${foe('_formations[0]._wform.wx', '_formations[0]._wform.wy')};
            for (let i = 0; i < 90; i++) { q.x = F.wx; q.y = F.wy; formationTick(); frame++; }
            return { len0, len1: fireWallLength(F), size: F.s.size, hurt: 1e6 - q.health };
        })()`);
        ok(r.len0 < run('FW_LEN_MAX') * 0.5, 'not small to start: ' + r.len0);
        ok(r.hurt > 0, 'it did not burn');
        ok(r.size > 0.5 && r.len1 > r.len0 + 1, 'it did not grow: ' + JSON.stringify(r));
    });
    await check('it burns harder as it grows, and dies back down when empty', () => {
        build(SQ, ['fire']);
        const r = run(`(function(){
            const F = _formations[0]._wform, q = ${foe('_formations[0]._wform.wx', '_formations[0]._wform.wy')};
            q.maxHealth = 200;   // so the max-HP share does not drown the size term
            const dmg = () => { const h = q.health; frame = (Math.floor(frame / FORM_TICK) + 1) * FORM_TICK; q.x = F.wx; q.y = F.wy; formationTick(); return h - q.health; };
            const small = dmg();
            for (let i = 0; i < 60; i++) { q.x = F.wx; q.y = F.wy; formationTick(); frame++; }
            const big = dmg(), size = F.s.size;
            q.x = F.wx + 3;
            for (let i = 0; i < 400; i++) { formationTick(); frame++; }
            return { small, big, size, after: F.s.size };
        })()`);
        ok(r.big > r.small, 'not harder: ' + JSON.stringify(r));
        ok(r.after < r.size, 'it did not die back: ' + JSON.stringify(r));
    });
    await check('it spares your squad', () => {
        build(SQ, ['fire']);
        const r = run(`(function(){
            const F = _formations[0]._wform;
            spawnFollowerAtCrystal('ice'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.stance = 'hold';
            const h0 = f.health;
            for (let i = 0; i < 90; i++) { f.x = F.wx; f.y = F.wy; formationTick(); frame++; }
            return h0 - f.health;
        })()`);
        ok(r === 0, 'it burned a follower for ' + r);
    });

    group('DRAWING');

    await check('both draw without error, with no glow, and the guide explains them', () => {
        build(SQ, ['flux']);
        run('player.x = player.visualX = __X; player.y = player.visualY = 3; render(); drawFormations();');
        build(SQ, ['fire']);
        run('player.x = player.visualX = __X; player.y = player.visualY = 3; render(); drawFormations();');
        ok(!/shadowBlur\s*=\s*[1-9]/.test(rd('js/formations.js')), 'formations.js sets a shadowBlur');
        const html = rd('game.html');
        ok(/BLACK HOLE/.test(html) && /FIRE WALL/.test(html), 'not in the guide');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
