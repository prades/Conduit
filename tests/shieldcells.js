// THE GENERATOR, REQUIRED IN EVERY ZONE — and SHIELD CELLS, the CORE tech's shields.
//
// THE REPORTED CASES: "get rid of the shield generator idea as a standalone
// object; rather it be part of the core tech strategy. Make the generator an
// object that is required for all tech on each zone." — and: "The pylons
// should drop shield cells; they're used to build up a shield cell collection
// used to fuel individual shields for followers and the shield barrier."
// (Asked: CORE pylons make them; one generator per zone powers that zone.)
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
process.on('unhandledRejection', () => {});

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const ctx = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    run(`gameState.running = true; tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id)); ensureWorldTo(4 * ZONE_LENGTH);`);

    // A clean slate: no pylons, no followers, a generator by home (zone of the
    // home portal) unless told not to, and helpers to build on a tile.
    const scene = (withGen) => run(`(function(){
        actors.length = 0; followers.length = 0; groundItems.length = 0; modules.length = 0; shieldCells = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false; t.isConnector = false; t.isBattery = false; t.attackModeElement = null; t.mk = 0; t._cellT = 0; t.circuitOn = undefined; } if (t.nest) t.nestEnergy = undefined; t._module = null; });
        shardCount = 9999;
        const home = world.find(t => isHomePortal(t));
        globalThis.__T = (x, y) => world.find(o => o.type === 'floor' && o.x === x && o.y === y && !o.nest && !o.nodeType);
        globalThis.__home = home;
        globalThis.__build = (el, x, y, kind) => { const t = __T(x, y); _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === el), t, kind); return t; };
        if (${withGen}) globalThis.__gen = __build(GENERATOR_ID, home.x + 1, 2);
        _cacheAge = -999; render();
        return { homeZone: getZoneIndex(home.x), homeX: home.x };
    })()`);
    const refresh = '_cacheAge = -999; render();';

    group('THE GENERATOR — required for all tech in its zone');
    const sc = scene(true);
    check('THE ASK: it is the GENERATOR now — it powers, it shields no one', () => {
        same(run('GENERATOR_LABEL'), 'GENERATOR', 'its name');
        ok(!/function shieldFieldTick/.test(rd('js/game.js')), 'the shield field is still there');
        const r = run(`(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false;
            f.shielded = false; f.shieldAmount = 0; f._shieldHitAt = undefined;
            for (let i = 0; i < 300; i++) { f.x = __gen.x + 1; f.y = __gen.y; frame++; shieldCellTick(); }
            return f.shielded ? f.shieldAmount : 0; })()`);
        same(r, 0, 'shield from standing by a generator with no cells');
    });
    check('THE ASK: a turret in its zone works; one in a zone with no generator is dark and never fires', () => {
        const r = run(`(function(){
            const a = __build('fire', __home.x + 3, 2, 'attack');
            const zx = (getZoneIndex(__home.x) + 1) * ZONE_LENGTH + 4;
            const b = __build('fire', zx, 2, 'attack');
            ${refresh}
            const S = SPECIES.ant;
            const qa = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), a.x + 1, a.y); qa.team = 'red'; qa.health = qa.maxHealth = 1e7; qa.update = () => {};
            const qb = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), b.x + 1, b.y); qb.team = 'red'; qb.health = qb.maxHealth = 1e7; qb.update = () => {};
            actors.push(qa, qb);
            player.x = player.visualX = b.x; player.y = player.visualY = 3;
            for (let i = 0; i < TURRET_FIRE_FRAMES * 3; i++) { qa.x = a.x + 1; qb.x = b.x + 1; render(); }
            qa.dead = qb.dead = true;
            return { aDark: !!a.zoneDark, bDark: !!b.zoneDark, aShot: a._lastShotFrame !== undefined, bShot: b._lastShotFrame !== undefined, bPowered: b.powered }; })()`);
        ok(!r.aDark && r.aShot, 'the turret by the generator: ' + JSON.stringify(r));
        ok(r.bDark && !r.bShot && r.bPowered === false, 'the turret with no generator in its zone: ' + JSON.stringify(r));
    });
    check('…and a generator in that zone lights it', () => {
        const r = run(`(function(){
            const zx = (getZoneIndex(__home.x) + 1) * ZONE_LENGTH + 4, b = __T(zx, 2);
            // A generator needs a nest in reach: give that zone's tile one to draw on.
            const keep = generatorSource; generatorSource = g => g ? __home : null;
            __build(GENERATOR_ID, zx + 1, 3); ${refresh}
            const out = { dark: !!b.zoneDark, zone: zoneHasGenerator(getZoneIndex(zx)) }; generatorSource = keep; ${refresh}
            return out; })()`);
        ok(!r.dark && r.zone, JSON.stringify(r));
    });
    check('switched off, its zone goes dark', () => {
        const r = run(`(function(){ const a = __T(__home.x + 3, 2); __gen.circuitOn = false; ${refresh}
            const off = !!a.zoneDark; __gen.circuitOn = true; ${refresh} return { off, back: !a.zoneDark }; })()`);
        ok(r.off && r.back, JSON.stringify(r));
    });
    check('batteries and modules in a zone with no generator do nothing', () => {
        const r = run(`(function(){
            const zx = (getZoneIndex(__home.x) + 2) * ZONE_LENGTH + 4;
            const b = __build('fire', zx, 1, 'battery'); b.charge = 50;
            const m = placeModule('medbay', __T(zx, 3)); ${refresh} _moduleRefresh(m);
            return { live: _liveBattery(b), bp: b.powered, m: m.powered, md: !!m.zoneDark }; })()`);
        ok(!r.live && r.bp === false && !r.m && r.md, JSON.stringify(r));
    });
    check('THE ASK: the build window greys tech out where the zone has no power (no generator, no booted power unit)', () => {
        const r = run(`(function(){
            const zx = (getZoneIndex(__home.x) + 3) * ZONE_LENGTH + 4;
            player.x = player.targetX = player.visualX = zx; player.y = player.targetY = player.visualY = 2;
            const items = buildMenuItems('turrets');
            const out = { turret: buildItemState(items.find(i => i.kind === 'attack')).why || 'ok',
                          tile: canBuildAt(__T(zx, 2), { tab: 'turrets', kind: 'attack', elId: 'fire' }).why };
            player.x = player.targetX = player.visualX = __home.x + 2;
            out.home = buildItemState(buildMenuItems('turrets').find(i => i.kind === 'attack')).why || 'ok';
            return out; })()`);
        same(r.turret, 'NO GENERATOR', 'a turret, standing in a zone with none');
        ok(/^NO POWER UNIT IN ZONE \d+: BOOT IT$/.test(r.tile), 'placing one there: ' + r.tile);
        ok(r.home !== 'NO GENERATOR', 'greyed in the zone that has one: ' + r.home);
    });

    group('SHIELD CELLS — made by CORE WAVE pylons, and the SHIELD FORGE');
    // "It should be just the wave pylons for the core element, and make an
    // ultra pylon for the wave element that creates those shield cells."
    const tick = n => run(`for (let i = 0; i < ${n}; i++) { frame++; shieldCellTick(); }`);
    const floorCells = 'groundItems.filter(g => g.type === "shieldCell").length';
    check('THE ASK: a powered CORE wave pylon drops a cell beside it every SHIELD_CELL_EVERY', () => {
        scene(true);
        run(`globalThis.__core = __build('core', __home.x + 3, 2, 'support'); ${refresh} frame = Math.ceil(frame / 30) * 30;`);
        ok(run('__core.waveMode && !__core.attackMode'), 'fixture: not a wave pylon');
        tick(run('SHIELD_CELL_EVERY') - 31);
        same(run(floorCells), 0, 'cells before its time');
        tick(62);
        same(run(floorCells), 1, 'cells after');
        const c = run('(function(){ const g = groundItems.find(g => g.type === "shieldCell"); return { x: g.x, y: g.y, mine: g.from === __core }; })()');
        ok(c.mine && Math.abs(c.x - run('__core.x')) <= 1 && Math.abs(c.y - run('__core.y')) <= 1, 'not beside it: ' + JSON.stringify(c));
    });
    check('…at most SHIELD_CELL_DROP_MAX lie on the floor from one pylon', () => {
        tick(run('SHIELD_CELL_EVERY') * 5);
        same(run(floorCells), run('SHIELD_CELL_DROP_MAX'), 'cells lying there');
    });
    check('a MK II makes them twice as fast', () => {
        scene(true);
        run(`globalThis.__core = __build('core', __home.x + 3, 2, 'support'); __core.mk = 2; ${refresh} frame = Math.ceil(frame / 30) * 30;`);
        tick(Math.ceil(run('SHIELD_CELL_EVERY') / run('SHIELD_CELL_MK2_MULT')) + 31);
        same(run(floorCells), 1, 'cells at half the time');
    });
    check('THE ASK: not a CORE TURRET; not a fire wave pylon; not a core wave pylon in a zone with no generator', () => {
        scene(true);
        run(`__build('core', __home.x + 3, 2, 'attack'); __build('fire', __home.x + 5, 2, 'disruption');
             __build('core', (getZoneIndex(__home.x) + 1) * ZONE_LENGTH + 4, 2, 'support'); ${refresh}`);
        tick(run('SHIELD_CELL_EVERY') * 2);
        same(run(floorCells), 0, 'cells');
    });

    // Four core wave pylons in a square, and a tier II core bank by them.
    const forge = () => run(`(function(){ const X = __home.x + 4;
        for (const [dx, dy] of [[0, 1], [1, 1], [0, 2], [1, 2]]) __build('core', X + dx, dy, 'support');
        for (let i = 0; i < 4; i++) __build('core', X - 2 + i * 2, 0, 'battery');
        ${refresh}
        const A = _formations.find(t => t._wform.kind === 'shieldforge');
        globalThis.__forge = A;
        return { kind: A ? A._wform.kind : null, on: !!A && formationActive(A._wform), why: A ? formationBlocker(A._wform) : 'none' }; })()`);
    check('THE ASK: four CORE wave pylons in a square fuse into the SHIELD FORGE', () => {
        scene(true);
        const r = forge();
        ok(r.kind === 'shieldforge' && r.on, JSON.stringify(r));
        same(run('FORM_KINDS.core'), 'shieldforge', 'the core formation');
        const why = run(`(function(){ buildLevel.wave = 3; const w = buildItemState(buildMenuItems('wave').find(i => i.elId === 'core')).why || 'ok'; buildLevel.wave = 1; return w; })()`);
        ok(why !== 'NO FORMATION', 'the build window says core has no formation');
    });
    check('THE ASK: …which makes them much faster than its four pylons would apart — and they make none of their own', () => {
        const r = run(`(function(){ groundItems.length = 0; const n = SHIELD_CELL_EVERY + 60;   // long enough for a lone pylon to make one too
            for (let i = 0; i < n; i++) { frame++; formationTick(); shieldCellTick(); }
            const cells = groundItems.filter(g => g.type === 'shieldCell');
            return { n: cells.length, fromForge: cells.every(g => g.from === __forge), frames: n,
                     around: cells.every(g => g.x >= __forge.x - 1 && g.x <= __forge.x + 2 && g.y >= __forge.y - 1 && g.y <= __forge.y + 2) }; })()`);
        ok(r.n >= 3 && r.fromForge && r.around, JSON.stringify(r));
        // Its four pylons apart would make 4 per SHIELD_CELL_EVERY; it makes more.
        ok(run('SHIELD_CELL_EVERY / FORGE_CELL_EVERY') > 4, 'not faster than four pylons apart');
    });
    check('…up to FORGE_DROP_MAX lying round it, then it waits', () => {
        run(`for (let i = 0; i < FORGE_CELL_EVERY * 10; i++) { frame++; formationTick(); }`);
        same(run(floorCells), run('FORGE_DROP_MAX'), 'cells lying round it');
    });
    check('dark (no tier II core bank), it makes nothing', () => {
        scene(true);
        const r = run(`(function(){ const X = __home.x + 4;
            for (const [dx, dy] of [[0, 1], [1, 1], [0, 2], [1, 2]]) __build('core', X + dx, dy, 'support');
            ${refresh} groundItems.length = 0;
            for (let i = 0; i < FORGE_CELL_EVERY * 3; i++) { frame++; formationTick(); }
            const A = _formations.find(t => t._wform.kind === 'shieldforge');
            return { formed: !!A, on: !!A && formationActive(A._wform), cells: groundItems.length }; })()`);
        ok(r.formed && !r.on && r.cells === 0, JSON.stringify(r));
    });
    check('it is drawn, named and pictured', () => {
        run(`drawFormationGround(__forge ? __forge._wform : { kind: 'shieldforge', col: '#00ccaa', s: { glow: 0.5 }, tiles: [] }, 200, 200);`);
        same(run('FORM_NAMES.shieldforge'), 'SHIELD FORGE', 'its name');
        ok(/data-art="shieldforge"/.test(rd('game.html')) && /SHIELD FORGE/.test(rd('game.html')), 'not in the guide');
    });

    group('SHIELD CELLS — collected');
    check('THE ASK: walk over one and it is yours', () => {
        scene(true);
        const r = run(`(function(){ const t = __T(__home.x + 4, 2); groundItems.push({ type: 'shieldCell', x: t.x, y: t.y, from: null });
            player.x = player.targetX = player.visualX = t.x; player.y = player.targetY = player.visualY = t.y; render();
            return { have: shieldCells, left: ${floorCells} }; })()`);
        ok(r.have === 1 && r.left === 0, JSON.stringify(r));
    });
    check('…a follower walking over one picks it up too', () => {
        const r = run(`(function(){ const t = __T(__home.x + 6, 1); groundItems.push({ type: 'shieldCell', x: t.x, y: t.y, from: null });
            player.x = player.targetX = player.visualX = __home.x + 2;
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.x = t.x; f.y = t.y;
            f.shielded = true; f.shieldAmount = 50;   // so it does not spend what it picks up straight away
            const before = shieldCells; for (let i = 0; i < 6; i++) { frame++; f.x = t.x; f.y = t.y; shieldCellTick(); }
            return { got: shieldCells - before, left: ${floorCells} }; })()`);
        ok(r.got === 1 && r.left === 0, JSON.stringify(r));
    });
    check('a full store leaves it on the floor', () => {
        const r = run(`(function(){ shieldCells = SHIELD_CELL_CAP; const t = __T(__home.x + 4, 3); groundItems.push({ type: 'shieldCell', x: t.x, y: t.y, from: null });
            player.x = player.targetX = player.visualX = t.x; player.y = player.targetY = player.visualY = t.y; render();
            const out = { have: shieldCells, left: ${floorCells} }; groundItems.length = 0; shieldCells = 0; return out; })()`);
        ok(r.have === run('SHIELD_CELL_CAP') && r.left === 1, JSON.stringify(r));
    });
    check('the HUD shows them beside your shards', () => {
        run(`shieldCells = 7; render();`);
        ok(/⬡ 7/.test(run('shardUI.textContent')), run('shardUI.textContent'));
        run('shieldCells = 0; render();');
    });
    check('kept between sessions, and a new game starts with none', () => {
        const r = run(`(function(){ shieldCells = 9; saveShieldCells(); shieldCells = 0; loadShieldCells(); const kept = shieldCells;
            clearShieldCells(); loadShieldCells(); return { kept, fresh: shieldCells }; })()`);
        ok(r.kept === 9 && r.fresh === 0, JSON.stringify(r));
        ok(/clearShieldCells\(\)/.test(rd('js/waves.js')), 'restartGame does not clear them');
    });

    group('SHIELD CELLS — spent: one cell, one full shield');
    const unit = (extra) => run(`(function(){ actors.length = 0; followers.length = 0;
        spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false;
        f.shielded = false; f.shieldAmount = 0; f._shieldMax = 0; f._shieldHitAt = undefined; ${extra || ''}
        globalThis.__f = f; for (let i = 0; i < 15; i++) { frame++; shieldCellTick(); }
        return { sh: f.shielded ? f.shieldAmount : 0, cap: Math.max(SHIELD_GEN_MIN, Math.round(f.maxHealth * SHIELD_GEN_SHARE)), left: shieldCells }; })()`);
    check('THE ASK: a follower with no shield spends ONE cell for a full shield', () => {
        run('shieldCells = 3;');
        const r = unit();
        ok(r.sh === r.cap && r.left === 2, JSON.stringify(r));
    });
    check('…and none while its shield holds, or with no cells', () => {
        run('shieldCells = 3;');
        const r = unit('f.shielded = true; f.shieldAmount = 5;');
        same(r.left, 3, 'cells spent on a shielded unit');
        run('shieldCells = 0;');
        same(unit().sh, 0, 'a shield from no cells');
    });
    check('…and it waits SHIELD_GEN_DELAY after a hit', () => {
        run('shieldCells = 3;');
        same(unit('f._shieldHitAt = frame;').sh, 0, 'a shield right after a hit');
        run('shieldCells = 3;');
        ok(unit('f._shieldHitAt = frame - SHIELD_GEN_DELAY - 1;').sh > 0, 'no shield once the delay had passed');
    });
    check('a clone takes one too', () => {
        const r = run(`(function(){ actors.length = 0; shieldCells = 2; const c = makeClone('ant', 'scout', __home.x + 2, 2); c.shielded = false; c.shieldAmount = 0;
            for (let i = 0; i < 15; i++) { frame++; shieldCellTick(); } const out = { sh: c.shieldAmount, left: shieldCells }; c.dead = true; return out; })()`);
        ok(r.sh > 0 && r.left === 1, JSON.stringify(r));
    });
    check('THE ASK: while it holds, a hit takes NOTHING off health; once it breaks, health takes it', () => {
        run('shieldCells = 1;'); unit();
        const r = run(`(function(){ const h0 = __f.health, s0 = __f.shieldAmount; applyDamage(__f, 5, { team: 'red' });
            const held = { health: h0 - __f.health, shield: s0 - __f.shieldAmount };
            __f.health = __f.maxHealth = 1000; applyDamage(__f, 99999, { team: 'red' }); const broke = !__f.shielded;
            const h1 = __f.health; applyDamage(__f, 10, { team: 'red' }); return { held, broke, lost: h1 - __f.health }; })()`);
        ok(r.held.health === 0 && r.held.shield === 5, 'while it held: ' + JSON.stringify(r.held));
        ok(r.broke && r.lost > 0, 'after it broke: ' + JSON.stringify(r));
    });
    check('THE ASK: the shield barrier (FORCE WALL) runs on cells too', () => {
        ok(/spendShieldCells\(FW_RISE_CELLS\)/.test(rd('js/modules.js')), 'it does not take cells to rise (tests/modules.js drives it)');
        ok(/spendShieldCells\(1\)/.test(rd('js/modules.js')), 'it does not burn cells to mend');
    });

    group('THE LOOK');
    check('the generator keeps its thicker body and big pale orb', () => {
        ok(/else if \(obj\.isGenerator && !obj\.destroyed\) \{[\s\S]{0,140}drawShieldGenerator\(/.test(rd('js/game.js')), 'the generator is drawn as a tower');
    });
    check('a cell on the floor is drawn, and a dark pylon says why', () => {
        run(`groundItems.push({ type: 'shieldCell', x: __home.x + 4, y: 2, from: null }); render(); drawShieldCellItem(groundItems[groundItems.length - 1], 100, 100); groundItems.length = 0;`);
        ok(/no generator in this zone/.test(rd('js/game.js')), 'a dark pylon does not say why');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
