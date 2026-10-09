// WAVE FORMATIONS — "Whenever 4 flux wave pylons are constructed together it
// creates a black hole in the middle of the four connected pylons (now
// transparent pylons) and lights up when enemies are entangled." Then:
// "Black hole vortex on the ground, 3D looking." The straight fire wall was
// taken out ("it looks wonky"); four fire wave pylons now make a SPINNING
// FIREWALL: "how about the ultra turret for the fire wave is a spinning
// firewall".
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
    await check('THE ASK: four FIRE wave pylons in a square make a spinning firewall', () => {
        const r = build(SQ, ['fire']);
        ok(r.n === 1 && r.kinds[0] === 'firespin', JSON.stringify(r));
    });
    await check('not three, not a mixed square, not other elements, not turrets', () => {
        ok(build(SQ.slice(0, 3), ['flux']).n === 0, 'three formed');
        ok(build(SQ, ['flux', 'flux', 'flux', 'fire']).n === 0, 'a mixed square formed');
        ok(build(SQ, ['core']).n === 0, 'core formed something');
        ok(build(SQ, ['flux', 'flux', 'fire', 'fire']).n === 0, 'half flux, half fire formed something');
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

    group('THE SPINNING FIREWALL');

    await check('THE ASK: its walls turn, and an enemy one sweeps over burns', () => {
        build(SQ, ['fire']);
        const r = run(`(function(){
            const F = _formations[0]._wform, q = ${foe('_formations[0]._wform.wx + 0.6', '_formations[0]._wform.wy')};
            const s0 = F.s.spin; let swept = 0;
            for (let i = 0; i < 160; i++) { q.x = F.wx + 0.6; q.y = F.wy; formationTick(); frame++; if (F.caught.includes(q)) swept++; }
            return { turned: F.s.spin !== s0, swept, hurt: 1e6 - q.health };
        })()`);
        ok(r.turned, 'it does not turn');
        ok(r.swept > 0 && r.hurt > 0, 'never swept or burned: ' + JSON.stringify(r));
    });
    await check('a wall burns the same enemy once a pass, not every frame', () => {
        build(SQ, ['fire']);
        const r = run(`(function(){
            const F = _formations[0]._wform, q = ${foe('_formations[0]._wform.wx + 0.5', '_formations[0]._wform.wy')};
            q.maxHealth = 100; let hits = 0, last = q.health;
            F.s.spin = 0;   // a wall lies right on it
            for (let i = 0; i < FS_HIT_EVERY; i++) { q.x = F.wx + 0.5; q.y = F.wy; F.s.spin = 0; formationTick(); F.s.spin = 0; frame++; if (q.health < last) { hits++; last = q.health; } }
            return hits;
        })()`);
        ok(r === 1, 'burned ' + r + ' times in one pass');
    });
    await check('nothing past its walls, and it spins faster with enemies close', () => {
        build(SQ, ['fire']);
        const r = run(`(function(){
            const F = _formations[0]._wform, far = ${foe('_formations[0]._wform.wx + FS_LEN + FS_HALF + 0.4', '_formations[0]._wform.wy')};
            let cold = 0; F.s.glow = 0;
            for (let i = 0; i < 120; i++) { formationTick(); frame++; }
            const spin0 = F.s.spin; formationTick(); frame++; const slowStep = (F.s.spin - spin0 + Math.PI * 2) % (Math.PI * 2);
            return { hurt: 1e6 - far.health, slowStep, glow: F.s.glow };
        })()`);
        ok(r.hurt === 0, 'it burned past its walls');
        ok(r.slowStep > run('FS_SPIN') + 1e-6, 'an enemy nearby did not speed it up: ' + JSON.stringify(r));
    });
    await check('it spares your squad', () => {
        build(SQ, ['fire']);
        const r = run(`(function(){
            const F = _formations[0]._wform;
            spawnFollowerAtCrystal('ice'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.stance = 'hold';
            const h0 = f.health;
            for (let i = 0; i < 160; i++) { f.x = F.wx + 0.5; f.y = F.wy; formationTick(); frame++; }
            return h0 - f.health;
        })()`);
        ok(r === 0, 'it burned a follower for ' + r);
    });

    group('THE ICE GENERATOR');

    await check('THE ASK: four ICE wave pylons in a square make an ice generator', () => {
        const r = build(SQ, ['ice']);
        ok(r.n === 1 && r.kinds[0] === 'icegen', JSON.stringify(r));
    });
    await check('THE ASK: frost on the ground round it, painted by each floor tile it covers', () => {
        build(SQ, ['ice']);
        const r = run(`(function(){ const F = _formations[0]._wform; let near = 0, far = 0;
            for (const [k, G] of _frostTiles) { const [x, y] = k.split(',').map(Number); const d = Math.hypot(x + 0.5 - F.wx, y + 0.5 - F.wy); if (d < 1.5) near++; if (d > ICE_RADIUS + 1) far++; }
            return { n: _frostTiles.size, near, far }; })()`);
        ok(r.n >= 12 && r.near >= 4 && r.far === 0, JSON.stringify(r));
        const g = rd('js/game.js');
        ok(/drawFrostOnTile\(obj, px, py\);[\s\S]{0,200}drawCablesOnTile\(obj, px, py\)/.test(g), 'the floor pass does not paint the frost (under the cables)');
    });
    await check('enemies on the frost are slowed and chilled; the pulse roots them', () => {
        build(SQ, ['ice']);
        const r = run(`(function(){
            const F = _formations[0]._wform, q = ${foe('_formations[0]._wform.wx + 1.8', '_formations[0]._wform.wy')};
            frame = Math.floor(frame / ICE_PULSE) * ICE_PULSE + 1;
            for (let i = 0; i < FORM_TICK + 1; i++) { formationTick(); frame++; }
            const slow = q.slowFactor, hurt = 1e6 - q.health;
            frame = (Math.floor(frame / ICE_PULSE) + 1) * ICE_PULSE; formationTick();
            return { slow, hurt, root: q.slowFactor };
        })()`);
        ok(r.slow <= run('ICE_SLOW') + 1e-9 && r.hurt > 0, 'not slowed or chilled: ' + JSON.stringify(r));
        ok(r.root <= run('ICE_ROOT_SLOW') + 1e-9, 'the pulse did not root it: ' + JSON.stringify(r));
    });
    await check('not past the frost, and never your squad', () => {
        build(SQ, ['ice']);
        const r = run(`(function(){
            const F = _formations[0]._wform, q = ${foe('_formations[0]._wform.wx + ICE_RADIUS + 0.5', '_formations[0]._wform.wy')};
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.stance = 'hold'; f.x = F.wx + 0.5; f.y = F.wy;
            const h0 = f.health; f.slowed = 0;
            for (let i = 0; i < ICE_PULSE + 2; i++) { f.x = F.wx + 0.5; f.y = F.wy; formationTick(); frame++; }
            return { qHurt: 1e6 - q.health, qSlow: q.slowed > 0, fHurt: h0 - f.health, fSlow: f.slowed > 0 };
        })()`);
        ok(r.qHurt === 0 && !r.qSlow, 'it reached past its frost: ' + JSON.stringify(r));
        ok(r.fHurt === 0 && !r.fSlow, 'it hit a follower: ' + JSON.stringify(r));
    });

    group('THE TOXIC TOWER');

    await check('THE ASK: four TOXIC wave pylons in a square raise a toxic tower', () => {
        const r = build(SQ, ['toxic']);
        ok(r.n === 1 && r.kinds[0] === 'toxtower', JSON.stringify(r));
    });
    await check('its fumes poison enemies and strip their armour; it runs hotter with them close', () => {
        build(SQ, ['toxic']);
        const r = run(`(function(){
            const F = _formations[0]._wform, q = ${foe('_formations[0]._wform.wx + 1.6', '_formations[0]._wform.wy')};
            for (let i = 0; i < FORM_TICK * 2 + 1; i++) { formationTick(); frame++; }
            return { hurt: 1e6 - q.health, shred: q.defenseShredded > 0, glow: F.s.glow };
        })()`);
        ok(r.hurt > 0 && r.shred, 'not poisoned: ' + JSON.stringify(r));
        ok(r.glow > 0.05, 'it did not heat up: ' + r.glow);
    });
    await check('THE ASK: and mend your clones standing in them — not followers, not past the fumes', () => {
        build(SQ, ['toxic']);
        const r = run(`(function(){
            const F = _formations[0]._wform;
            const c = makeClone('ant', 'scout', F.wx + 1, F.wy); c.health = c.maxHealth * 0.3;
            const far = makeClone('ant', 'scout', F.wx + TT_RADIUS + 1, F.wy); far.health = far.maxHealth * 0.3;
            spawnFollowerAtCrystal('fire'); const fo = followers[followers.length - 1]; fo.returningToCrystal = false; fo.x = F.wx + 1; fo.y = F.wy + 0.5; fo.maxHealth = 100; fo.health = 30;
            const c0 = c.health, f0 = far.health, o0 = fo.health;
            for (let i = 0; i < FORM_TICK * 2 + 1; i++) { formationTick(); frame++; }
            return { clone: c.health - c0, far: far.health - f0, follower: fo.health - o0 };
        })()`);
        ok(r.clone > 0, 'the clone in the fumes was not mended: ' + JSON.stringify(r));
        ok(r.far === 0 && r.follower === 0, 'it mended past its fumes or a follower: ' + JSON.stringify(r));
    });
    await check('its haze lies on the floor, painted per tile like the frost', () => {
        build(SQ, ['toxic']);
        const r = run(`(function(){ const F = _formations[0]._wform; let n = 0; for (const [, G] of _frostTiles) if (G === F) n++; return n; })()`);
        ok(r >= 12, 'only ' + r + ' tiles of haze');
    });

    group('DRAWING');

    await check('THE ASK: a vortex on the floor, painted from the front tile before its pylon', () => {
        build(SQ, ['flux']);
        const g = rd('js/game.js');
        ok(/_bhA\._wform\.front === obj && typeof drawFormationGround === "function"\) drawFormationGround\(_bhA\._wform, px, py\)/.test(g), 'not drawn from the front tile');
        ok(g.indexOf('drawFormationGround(_bhA') < g.indexOf('drawWaveMonolith(px, _base'), 'drawn after the pylon, not under it');
        run('player.x = player.visualX = __X; player.y = player.visualY = 3; render(); drawFormationGround(_formations[0]._wform, 200, 200);');
        build(SQ, ['fire']);
        run('render(); drawFormationGround(_formations[0]._wform, 200, 200);');
        build(SQ, ['ice']);
        run('render(); drawFormationGround(_formations[0]._wform, 200, 200); const k = [..._frostTiles.keys()][0].split(",").map(Number); drawFrostOnTile(getTile(k[0], k[1]), 200, 200);');
        build(SQ, ['toxic']);
        run('render(); drawFormationGround(_formations[0]._wform, 200, 200); const k2 = [..._frostTiles.keys()][0].split(",").map(Number); drawFrostOnTile(getTile(k2[0], k2[1]), 200, 200);');
    });
    await check('an enemy standing in it is drawn over it, not under it', () => {
        build(SQ, ['flux']);
        const r = run(`(function(){ const F = _formations[0]._wform, q = ${foe('_formations[0]._wform.wx + 0.3', '_formations[0]._wform.wy')};
            formationTick(); return { on: q._onVortex === frame, d: drawDepthOf({ x: q.x, y: q.y, actor: q }) - (q.x + q.y) }; })()`);
        ok(r.on && r.d > 1, JSON.stringify(r));
    });
    await check('no glow, and the guide explains it', () => {
        ok(!/shadowBlur\s*=\s*[1-9]/.test(rd('js/formations.js')), 'formations.js sets a shadowBlur');
        const html = rd('game.html');
        ok(/BLACK HOLE/.test(html) && /in the floor/.test(html) && /SPINNING FIREWALL/.test(html) && /ICE GENERATOR/.test(html) && /TOXIC TOWER/.test(html), 'the guide is out of date');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
