// ELEMENT COMBOS — docs/ROADMAP-top5.md §1.
//
// Two awake support/disruption pylons of DIFFERENT elements within link range
// form a combo link; the strip between them runs that pair's effect. Fifteen
// pairs, discovered once and kept.
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

    // A generator, then wave pylons of the listed elements along y=2, `gap`
    // tiles apart; held awake unless `asleep`. A unit `who` ('foe'|'ally') is
    // held on the strip between the first two for `frames`.
    const scene = (els, opts) => run(`(function(){
        const o = ${JSON.stringify(opts || {})};
        actors.length = 0; followers.length = 0; floatingTexts.length = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false;
            t.isConnector = false; t.attackModeElement = null; t.waveTripped = false; t.circuitOn = undefined; t.nestConnection = null;
            t.waveAwake = undefined; t._awakeUntil = undefined; }
            if (t.nest) { t.powerOff = false; t.nestEnergy = undefined; } });
        shardCount = 9999;
        const home = world.find(t => isHomePortal(t));
        const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
        _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), T(home.x + 1, 2));
        const ps = ${JSON.stringify(els)}.map((id, i) => { const t = T(home.x + 3 + i * (o.gap || 2), 2);
            _executeBuildInstant(ELEMENTS.find(e => e.id === id), t, waveRole(id)); if (!o.asleep) t._awakeUntil = Infinity; return t; });
        player.x = home.x - 12; player.y = 2;
        _cacheAge = -999; for (let f = 0; f < 3; f++) render();
        let u = null;
        if (o.who === 'foe') { const S = SPECIES.ant; u = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 0, 0);
            u.team = 'red'; u.speciesName = 'ant'; u.className = 'scout'; u.health = u.maxHealth = 1e6; u.provoked = true; actors.push(u); }
        if (o.who === 'ally') { spawnFollowerAtCrystal('fire'); u = followers[followers.length - 1]; u.returningToCrystal = false; u.health = u.maxHealth * 0.5; }
        const mx = (ps[0].x + ps[1].x) / 2, my = ps[0].y + (o.off || 0);
        let blindSeen = 0, minSlow = 1, maxHaste = 0, maxShield = 0, dist0 = Math.abs(o.off || 0), minDist = 99;
        for (let f = 0; f < (o.frames || 0); f++) {
            if (u) { if (!o.free || f === 0) { u.x = mx; u.y = my; } u.spawnProtection = 0; }
            render();
            if (u) { if (u.blinded > 0) blindSeen++; if (u.slowed > 0) { minSlow = Math.min(minSlow, u.slowFactor); maxHaste = Math.max(maxHaste, u.slowFactor); }
                maxShield = Math.max(maxShield, u.shieldAmount || 0); const d = Math.hypot(u.x - mx, u.y - my); if (dist0 === null) dist0 = d; minDist = Math.min(minDist, d); }
        }
        globalThis.__ps = ps; globalThis.__u = u;
        return { links: _comboLinks.map(L => L.key + ':' + L.combo.name), awake: ps.map(t => t.waveAwake),
                 hpLost: u ? (u.isFollower ? null : 1e6 - u.health) : null, hp: u ? u.health : null, maxHp: u ? u.maxHealth : null,
                 blindSeen, minSlow, maxHaste, maxShield, dist0, minDist, said: floatingTexts.map(t => t.text) };
    })()`);

    group('THE TABLE');

    await check('all fifteen pairs of the six elements, each exactly once', () => {
        const r = run(`(function(){ const ids = ELEMENTS.map(e => e.id), want = [];
            for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) want.push(comboKey(ids[i], ids[j]));
            const have = Object.keys(ELEMENT_COMBOS);
            return { want: want.length, have: have.length, missing: want.filter(k => !ELEMENT_COMBOS[k]), names: new Set(have.map(k => ELEMENT_COMBOS[k].name)).size }; })()`);
        ok(r.want === 15 && r.have === 15 && r.missing.length === 0, JSON.stringify(r));
        ok(r.names === 15, 'combo names are not unique');
    });
    await check('every "every" is a multiple of 3 (the effects pass runs every third frame)', () => {
        const bad = run(`Object.entries(ELEMENT_COMBOS).flatMap(([k, c]) => [c.foe && c.foe.every, c.foe && c.foe.stunEvery, c.ally && c.ally.shieldEvery, c.ally && c.ally.healEvery].filter(v => v && v % 3).map(v => k + ':' + v))`);
        ok(bad.length === 0, JSON.stringify(bad));
    });

    group('FORMING A LINK');

    await check('THE ASK: two awake pylons of different elements link into their combo', () => {
        const r = scene(['fire', 'ice']);
        ok(r.links.length === 1 && r.links[0] === 'fire+ice:STEAM', JSON.stringify(r.links));
    });
    await check('the same element does not form a combo', () => {
        ok(scene(['fire', 'fire']).links.length === 0, 'fire + fire made a combo');
    });
    await check('out of link range does not', () => {
        ok(scene(['fire', 'ice'], { gap: 5 }).links.length === 0, 'it linked across 5 tiles');
    });
    await check('a pylon takes part in at most COMBO_MAX_LINKS combos', () => {
        // ice in the middle of fire, toxic, flux, core — all within 3 tiles of it
        const r = run(`(function(){
            world.forEach(t => { if (t.pillar) { t.pillar = false; t.waveMode = false; t.attackMode = false; t.isGenerator = false; } });
            const home = world.find(t => isHomePortal(t));
            const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
            _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), T(home.x + 1, 2));
            const c = T(home.x + 4, 2);
            _executeBuildInstant(ELEMENTS.find(e => e.id === 'ice'), c, 'disruption');
            [[home.x + 3, 1], [home.x + 5, 1], [home.x + 3, 3], [home.x + 5, 3]].forEach(([x, y], i) =>
                _executeBuildInstant(ELEMENTS.find(e => e.id === ['fire', 'toxic', 'flux', 'core'][i]), T(x, y), waveRole(['fire', 'toxic', 'flux', 'core'][i])));
            _cacheAge = -999; render();
            return _comboLinks.filter(L => L.a === c || L.b === c).length;
        })()`);
        ok(r === run('COMBO_MAX_LINKS'), 'the middle pylon has ' + r + ' links');
    });

    group('EFFECTS');

    await check('STEAM (fire + ice) blinds a predator on the strip', () => {
        const r = scene(['fire', 'ice'], { who: 'foe', frames: 60 });
        ok(r.blindSeen > 30, 'blinded ' + r.blindSeen + ' of 60 frames');
        ok(r.hpLost > 0, 'and burns it');
    });
    await check('a blinded predator does not attack', () => {
        const r = run(`(function(){ const S = SPECIES.ant; const q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 5, 2);
            q.team = 'red'; q.health = q.maxHealth = 999; actors.length = 0; actors.push(q);
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.x = 5.3; f.y = 2; f.health = f.maxHealth = 1e6;
            q.blinded = 300; const h0 = f.health; for (let i = 0; i < 200; i++) { f.x = q.x + 0.3; f.y = q.y; q.update(); }
            return { lost: h0 - f.health, state: q.state, target: !!q.currentTarget }; })()`);
        ok(r.lost === 0 && !r.target, JSON.stringify(r));
    });
    await check('NAPALM (fire + toxic) burns and shreds', () => {
        const r = scene(['fire', 'toxic'], { who: 'foe', frames: 60 });
        ok(r.hpLost > 0, 'no damage');
        ok(run('__u.defenseShredded > 0'), 'no shred');
    });
    await check('BLACK ICE (ice + flux) slows hard and pulls toward the link', () => {
        const r = scene(['ice', 'flux'], { who: 'foe', frames: 40, off: 1.2, free: true });
        ok(r.minSlow <= 0.31, 'slow ' + r.minSlow);
        ok(r.minDist < r.dist0, 'it was not pulled in: ' + r.dist0 + ' -> ' + r.minDist);
    });
    await check('CRYO-ARC (electric + ice) stuns: stopped and blind for a beat', () => {
        const r = scene(['electric', 'ice'], { who: 'foe', frames: 130 });
        ok(r.minSlow === 0 && r.blindSeen > 0, JSON.stringify({ minSlow: r.minSlow, blind: r.blindSeen }));
    });
    await check('OVERDRIVE (core + electric) hastes and shields your side', () => {
        const r = scene(['core', 'electric'], { who: 'ally', frames: 60 });
        ok(r.maxHaste >= 1.4 && r.maxShield > 0, JSON.stringify({ haste: r.maxHaste, shield: r.maxShield }));
    });
    await check('ANTIDOTE (core + toxic) heals your side', () => {
        const r = scene(['core', 'toxic'], { who: 'ally', frames: 70 });
        ok(r.hp > r.maxHp * 0.5, 'no healing: ' + r.hp + ' / ' + r.maxHp);
    });
    await check('a disruption combo leaves your own units alone', () => {
        const r = scene(['fire', 'toxic'], { who: 'ally', frames: 60 });
        ok(r.hp >= r.maxHp * 0.5 && r.minSlow === 1 && r.maxShield === 0, JSON.stringify({ hp: r.hp, max: r.maxHp, slow: r.minSlow }));
    });
    await check('with both ends asleep the link rests', () => {
        const r = run(`(function(){ __ps.forEach(t => { t._awakeUntil = -1; t.waveAwake = false; }); const S = SPECIES.ant;
            const q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 0, 0); q.team = 'red'; q.health = q.maxHealth = 1e6; actors.length = 0;
            const L = _comboLinks[0]; return L ? comboLinkActive(L) : 'nolink'; })()`);
        ok(r === false, 'an asleep link is still active: ' + r);
    });

    group('DISCOVERY');

    await check('THE ASK: the first time, it says COMBO DISCOVERED and remembers it', () => {
        run(`comboDiscovered.clear(); localStorage.removeItem(COMBO_STORE_KEY);`);
        const a = scene(['flux', 'toxic']);
        ok(a.said.some(t => /COMBO DISCOVERED: MIASMA/.test(t)), 'no discovery banner: ' + JSON.stringify(a.said));
        ok(run(`JSON.parse(localStorage.getItem(COMBO_STORE_KEY)).includes('flux+toxic')`), 'not saved');
        const b = scene(['flux', 'toxic']);
        ok(!b.said.some(t => /COMBO DISCOVERED/.test(t)), 'it announced a combo it already knew');
    });
    await check('the codex lists all fifteen, hiding the ones not yet found', () => {
        const rows = run(`codexComboRows(48).filter(r => Array.isArray(r))`);
        ok(rows.length === 15, rows.length + ' rows');
        ok(rows.some(r => r[0] === 'MIASMA') && rows.some(r => r[0] === '???'), 'found/unfound not shown');
        ok(run(`codexIndexRows(48).some(r => Array.isArray(r) && r[3] && r[3].codexPage === 'combos')`), 'no COMBOS entry in the index');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
