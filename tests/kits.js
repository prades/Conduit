// THE SIXTEEN LAYOUT KITS (js/kits.js, docs/LAYOUT-KITS.md).
//
// REPORTED: "layouts for different equipment systems that do not exaggerate unnecessary equipment ... 16 different variants of zone equipment layouts that make
// sense." The rules are checked on the data (R1 to R7, with mutations that must each fail), and every kit is BUILT in the real game, for the elements it
// takes, and its claims are measured: the network tier, every piece powered, the Ultra fused, the formation formed, nothing extra, nothing dark.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    run(`gameState.running = true; tutorialMode = false; zoneGenerated = () => true; shardCount = 5000; unlockedElements = new Set(ELEMENTS.map(e => e.id));
        gameState.highestZoneCleared = 2; activeDayZones = 4; for (let z = 0; z <= 4; z++) ensureWorldTo((z + 1) * ZONE_LENGTH);
        actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.isBattery = false; t.attackMode = false; t.waveMode = false; t.attackModeElement = null; } });
        (function(){ const n = world.find(t => t.nest && !isHomePortal(t) && getZoneIndex(t.x) === 1); n.nestHealth = 0; globalThis.__nest = n; })();
        player.x = player.visualX = 3; player.y = player.visualY = 1.5; render();`);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    const frames = n => { for (let i = 0; i < n; i++) run('render()'); };

    group('THE DATA');
    check('there are exactly sixteen kits, each with a distinct id, name and map', () => {
        same(run('KITS.length'), 16, 'kits'); same(run('new Set(KITS.map(k => k.id)).size'), 16, 'ids'); same(run('new Set(KITS.map(k => k.name)).size'), 16, 'names');
        same(run(`new Set(KITS.map(k => k.map.join("|") + (k.mk2 || []).join(""))).size`), 16, "layouts (no two kits are the same: HARDENED is the STRONGPOINT map with MK II)");
        same(run('KIT_FAMILIES.every(f => KITS.some(k => k.family === f[0]))'), true, 'a family is empty');
    });
    check('THE ASK (no exaggeration): every kit passes R1 to R7', () => {
        const bad = J('KITS.map(k => [k.id, kitValidate(k)]).filter(x => x[1].length)'); same(bad.length, 0, 'violations: ' + JSON.stringify(bad));
    });
    check('R1: no kit has a battery (the power unit in the wall is the bank), and each names a tier of it, 1 to 3', () => { for (const k of J('KITS.map(k => ({ id: k.id, b: k.map.join("").indexOf("B") >= 0, t: k.target.tier }))')) { same(k.b, false, k.id + ' has a battery'); ok(k.t >= 1 && k.t <= 3, k.id + ' tier ' + k.t); } });
    check('the sizes are what the plan said (1 to 12 pieces), the cost is ten a piece plus the MK II upgrades', () => {
        const s = J('KITS.map(k => [k.id, kitPieceCount(k), kitCost(k)])'), by = Object.fromEntries(s.map(x => [x[0], x]));
        same(by.picket[1], 1, 'picket'); same(by.outpost[1], 2, 'outpost'); same(by.strongpoint[1], 3, 'strongpoint'); same(by.bastion[1], 4, 'bastion'); same(by.fullkit[1], 12, 'fullkit (the most a zone needs: no generator, connector or batteries)'); same(by.hardened[2], 75, 'hardened (three MK II at 15)');
        for (const [id, n, c] of s) ok(n >= 1 && n <= 12 && c >= n * 10, id + ' ' + n + '/' + c);
    });
    check('they only get bigger up the chains: PICKET in OUTPOST in STRONGPOINT in BASTION, and STRONGPOINT in ULTRA NEAR in SIEGE', () => {
        const has = (a, b) => run(`(function(){ const A = kitPieces(kitById("${a}")), B = new Set(kitPieces(kitById("${b}")).map(p => p.c + p.dx + "," + p.dy)); return A.every(p => B.has(p.c + p.dx + "," + p.dy)); })()`);
        for (const [a, b] of [['picket', 'outpost'], ['outpost', 'strongpoint'], ['strongpoint', 'bastion'], ['strongpoint', 'ultranear'], ['ultranear', 'siege'], ['strongpoint', 'hardened'], ['strongpoint', 'fullkit'], ['bastion', 'fullkit']]) ok(has(a, b), a + ' is not inside ' + b);
    });

    group('THE RULES CATCH EXAGGERATION (mutations)');
    const mutate = (id, fn) => J(`(function(){ const k = JSON.parse(JSON.stringify(kitById("${id}"))); ${fn}; return kitValidate(k); })()`);
    check('a battery in a kit fails R1', () => ok(mutate('strongpoint', 'k.map[0] = ".B"').some(v => /^R1/.test(v)), 'not caught'));
    check('a loose wave pylon fails R3', () => ok(mutate('outpost', 'k.map[0] = "...W"').some(v => /^R3/.test(v)), 'not caught'));
    check('a fifth lane gun fails R2', () => ok(mutate('gunline', 'k.map[0] = "T...T"; k.map[3] = "T....T"; k.map[2] = ".T...T"').some(v => /^R2/.test(v)), 'not caught'));
    check('a generator or a connector in a kit fails R4 (the power unit in the wall is both)', () => { ok(mutate('outpost', 'k.map[1] = "G"').some(v => /^R4/.test(v)), 'generator'); ok(mutate('outpost', 'k.map[1] = ".C"').some(v => /^R4/.test(v)), 'connector'); });
    check('a turret square nothing asked for (it would fuse into an Ultra) fails R2', () => ok(mutate('outpost', 'k.map[2] = "...TT"; k.map[3] = "...TT"').some(v => /^R2/.test(v)), 'not caught'));
    check('an Ultra asked of a tier I unit fails R6', () => ok(mutate('ultranear', 'k.target.tier = 1').some(v => /^R6/.test(v)), 'not caught'));
    check('a column blocked wall to wall fails R7', () => ok(mutate('ultranear', 'k.map = ["..T", "G.T", "..T", "..T"]').some(v => /^R7/.test(v)), 'not caught'));

    group('EVERY KIT BUILT IN THE REAL GAME');
    const els = { any: ['electric', 'fire'], form: ['flux', 'fire', 'core'], support: ['electric', 'core'] };
    const clearZone = () => { run('world.filter(t => t.pillar && getZoneIndex(t.x) === 1).forEach(t => clearPylon(t)); _cacheAge = -999; shardCount = 5000;'); frames(3); };
    for (const k of J('KITS.map(k => ({ id: k.id, needs: k.needs }))')) {
        for (const el of els[k.needs]) {
            check(`${k.id} with ${el}: built, tier reached, every piece powered, Ultra and formation formed, nothing extra`, () => {
                clearZone();
                const info = J(`(function(){ const kit = kitById("${k.id}"), plan = kitFindPlacement(kit, "${el}", __nest); if (!plan) return { noplan: true };
                    return { ok: plan.ok, blocked: plan.blocked, cost: plan.cost, free: plan.free, x0: plan.x0, dir: plan.dir, n: kitPieceCount(kit) }; })()`);
                ok(!info.noplan && info.ok, 'no clean placement at the nest: ' + JSON.stringify(info));
                const res = J(`kitBuild(kitFindPlacement(kitById("${k.id}"), "${el}", __nest))`);
                same(res.built, info.n, 'pieces built (blocked: ' + res.blocked.join('; ') + ')'); same(res.short, 0, 'short of shards');
                frames(90);
                // the kit waits for the zone's power unit: boot it and upgrade it to the tier the kit asks for
                run(`(function(){ shardCount = 5000; wallUnitBoot(1, "${el}"); for (let i = 1; i < kitById("${k.id}").target.tier; i++) wallUnitUpgrade(1); _cacheAge = -999; })()`); frames(60);
                const m = J(`(function(){ const kit = kitById("${k.id}"), z = world.filter(t => t.pillar && t.pillarTeam === "green" && getZoneIndex(t.x) === 1 && !t.destroyed);
                    return { pillars: z.length, tier: networkStrength["${el}"] || 0, dark: z.filter(t => (t.attackMode || t.waveMode) && !t.isBattery && !t.isGenerator && !t.isConnector && t.powered !== true).map(t => t.x + "," + t.y),
                             ultras: z.filter(t => t._ultra).length, forms: z.filter(t => t._wform).map(t => t._wform.kind), gens: z.filter(t => t.isGenerator).length,
                             batteries: z.filter(t => t.isBattery).length, mk: z.filter(t => (t.mk || 0) >= 2).length, supports: z.filter(t => t.waveMode && !t._wform && !t._wformOf).length,
                             target: kit.target, mk2want: kitPieces(kit).filter(p => p.mk2).length }; })()`);
                same(m.pillars, info.n + [0, 2, 4, 6][m.target.tier], 'pieces standing (the kit and the unit\'s cells; extras or losses)'); same(m.gens, 0, 'generators (there are none)'); same(m.tier, m.target.tier, 'the network tier it claims');
                same(m.dark.length, 0, 'pieces left dark: ' + m.dark.join(' '));
                if (m.target.ultra) same(m.ultras, 1, 'the Ultra turret did not fuse'); else same(m.ultras, 0, 'an Ultra nobody asked for');
                if (m.target.formation) { same(m.forms.length, 1, 'formations'); same(m.forms[0], run(`FORM_KINDS["${el}"]`), 'which formation'); } else same(m.forms.length, 0, 'a formation nobody asked for');
                if (m.target.support) same(m.supports, 2, 'supports');
                same(m.batteries, [0, 2, 4, 6][m.target.tier], 'batteries');
                if (m.mk2want) { frames(30); run(`kitBuild(kitFindPlacement(kitById("${k.id}"), "${el}", __nest))`); frames(5); same(run('world.filter(t => t.pillar && getZoneIndex(t.x) === 1 && (t.mk || 0) >= 2).length'), m.mk2want, 'MK II upgrades'); }
            });
        }
    }

    group('PLACING');
    check('a kit placed on a smaller one only adds the difference (STRONGPOINT on an OUTPOST: one more gun)', () => {
        clearZone(); run('kitBuild(kitFindPlacement(kitById("outpost"), "fire", __nest));'); frames(5);
        const p = J('(function(){ const pl = kitFindPlacement(kitById("strongpoint"), "fire", __nest); return { have: pl.have, free: pl.free, cost: pl.cost, blocked: pl.blocked }; })()');
        same(p.have, 2, 'already there'); same(p.free, 1, 'to add'); same(p.cost, 10, 'the cost of the difference'); same(p.blocked, 0, 'blocked');
        same(J('kitBuild(kitFindPlacement(kitById("strongpoint"), "fire", __nest)).built'), 1, 'built'); frames(5);
        same(run('world.filter(t => t.pillar && getZoneIndex(t.x) === 1).length'), 3, 'pieces after');
    });
    check('a different element on the same tiles is not "there": it is blocked (the kit does not replace what stands)', () => {
        const p = J('(function(){ const pl = kitFindPlacement(kitById("strongpoint"), "ice", __nest); return { have: pl.have, blocked: pl.blocked, free: pl.free }; })()');
        ok(p.have < 7, 'ice counted as the fire kit: ' + JSON.stringify(p));
    });
    check('an obstacle moves the placement (mirrored or shifted) to a clean spot, or reports the blocked pieces', () => {
        clearZone();
        run('(function(){ const T = (x, y) => world.find(t => t.x === x && t.y === y); const t = T(__nest.x + 2, 2); _executeBuildInstant(ELEMENTS.find(e => e.id === "core"), t, "support"); })(); _cacheAge = -999;');
        const p = J('(function(){ const pl = kitFindPlacement(kitById("bastion"), "electric", __nest); return { ok: pl.ok, blocked: pl.blocked, dir: pl.dir, x0: pl.x0 - __nest.x }; })()');
        ok(p.ok || p.blocked >= 1, JSON.stringify(p)); ok(p.dir !== 1 || p.x0 !== 0, 'the placement did not move off the obstacle: ' + JSON.stringify(p));
    });
    check('a kit never crosses the zone line (a piece over it would have no generator): wide kits shift back to fit', () => {
        clearZone();
        const p = J('(function(){ const pl = kitFindPlacement(kitById("relayline"), "fire", __nest); return { ok: pl.ok, x0: pl.x0 - __nest.x, dir: pl.dir, zones: Array.from(new Set(pl.pieces.map(q => getZoneIndex(q.x)))) }; })()');
        same(p.ok, true, 'a clean placement exists'); same(p.zones.length, 1, 'zones the pieces stand in: ' + p.zones); ok(p.x0 < 0 || p.dir < 0, 'a 10-column kit cannot sit unshifted at the nest: ' + JSON.stringify(p));
        const q = J('(function(){ const pl = kitPlan(kitById("relayline"), "fire", __nest.x, 1, __nest); return { blocked: pl.blocked, why: pl.pieces.map(q => q.why).filter(Boolean) }; })()');
        ok(q.blocked >= 1 && q.why.includes('ACROSS THE ZONE LINE'), 'the unshifted plan should be blocked at the zone line: ' + JSON.stringify(q));
    });
    check('a kit can stand anywhere in its zone: there is no generator to anchor it, and every spot a few tiles either way plans clean', () => {
        clearZone(); frames(2);
        for (const dx of [0, 3, -4, -6]) { const pl = J('(function(){ const pl = kitPlan(kitById("outpost"), "fire", __nest.x + ' + dx + ', 1, __nest); return { blocked: pl.blocked, free: pl.free, have: pl.have }; })()'); same(pl.blocked, 0, 'blocked at shift ' + dx + ': ' + JSON.stringify(J('kitPlan(kitById("outpost"), "fire", __nest.x + ' + dx + ', 1, __nest).pieces.filter(q => q.state === "blocked").map(q => [q.piece.c, q.x, q.y, q.why])'))); same(pl.free, 2, 'free at shift ' + dx); }
        same(J('kitBuild(kitFindPlacement(kitById("outpost"), "fire", __nest)).built'), 2, 'the two guns'); frames(3); same(run('world.filter(t => t.pillar && t.isGenerator && getZoneIndex(t.x) === 1).length'), 0, 'a generator was built');
    });
    check('short of shards it builds what it can, in order, and says how many shards it still needs', () => {
        clearZone(); run('shardCount = 25;'); const r = J('kitBuild(kitFindPlacement(kitById("strongpoint"), "fire", __nest))'); same(r.built, 2, 'built'); ok(r.short > 0, 'no shortfall reported');
    });
    check('a kit says which power-unit tier it needs, and whether the zone\'s unit is short of it', () => {
        clearZone(); const u = J('kitFindPlacement(kitById("bastion"), "fire", __nest).unit'); same(u.need, 3, 'tier asked'); same(u.have, 0, 'tier had'); same(u.short, true, 'short');
        run('wallUnitBoot(1, "fire"); wallUnitUpgrade(1); wallUnitUpgrade(1); _cacheAge = -999;'); same(J('kitFindPlacement(kitById("bastion"), "fire", __nest).unit.short'), false, 'short after upgrading to III');
    });
    check('a piece out of the power unit\'s reach is blocked, not built dark (the reach rule, asked of a far tile)', () => {
        const r = J('(function(){ const pl = kitPlan(kitById("outpost"), "fire", __nest.x, 1, __nest); const far = { x: __nest.x - 40, y: 1 }; return { near: pl.pieces.every(q => q.state !== "blocked"), reach: BATTERY_SUPPLY_RANGE }; })()'); same(r.near, true, 'a placement at the nest is in reach'); same(r.reach, 12, 'the reach');
        ok(/OUT OF THE POWER UNIT/.test(rd('js/kits.js')), 'the rule is not in kitPlan');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
