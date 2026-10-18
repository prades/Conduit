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
    check('R1: the battery count is exactly the target tier\'s (0, 2, 4, 6): none spare', () => { for (const k of J('KITS.map(k => ({ id: k.id, b: kitPieces(k).filter(p => p.c === "B").length, t: k.target.tier }))')) same(k.b, [0, 2, 4, 6][k.t], k.id + ' batteries'); });
    check('the sizes are what the plan said (3 to 17 pieces), the cost is ten a piece plus the MK II upgrades', () => {
        const s = J('KITS.map(k => [k.id, kitPieceCount(k), kitCost(k)])'), by = Object.fromEntries(s.map(x => [x[0], x]));
        same(by.skeleton[1], 3, 'skeleton'); same(by.outpost[1], 5, 'outpost'); same(by.strongpoint[1], 7, 'strongpoint'); same(by.bastion[1], 9, 'bastion'); same(by.fullkit[1], 17, 'fullkit (the old autoplay plan: the most a zone needs)'); same(by.hardened[2], 100, 'hardened (two MK II at 15)');
        for (const [id, n, c] of s) ok(n >= 3 && n <= 17 && c >= n * 10, id + ' ' + n + '/' + c);
    });
    check('they only get bigger up the chains: SKELETON in OUTPOST in STRONGPOINT in BASTION, and STRONGPOINT in ULTRA NEAR in SIEGE', () => {
        const has = (a, b) => run(`(function(){ const A = kitPieces(kitById("${a}")), B = new Set(kitPieces(kitById("${b}")).map(p => p.c + p.dx + "," + p.dy)); return A.every(p => B.has(p.c + p.dx + "," + p.dy)); })()`);
        for (const [a, b] of [['skeleton', 'outpost'], ['outpost', 'strongpoint'], ['strongpoint', 'bastion'], ['strongpoint', 'ultranear'], ['ultranear', 'siege'], ['strongpoint', 'hardened'], ['strongpoint', 'fullkit'], ['bastion', 'fullkit']]) ok(has(a, b), a + ' is not inside ' + b);
    });

    group('THE RULES CATCH EXAGGERATION (mutations)');
    const mutate = (id, fn) => J(`(function(){ const k = JSON.parse(JSON.stringify(kitById("${id}"))); ${fn}; return kitValidate(k); })()`);
    check('a spare battery fails R1', () => ok(mutate('strongpoint', 'k.map[0] = ".BBB"').some(v => /^R1/.test(v)), 'not caught'));
    check('a loose wave pylon fails R3', () => ok(mutate('outpost', 'k.map[0] = "...W"').some(v => /^R3/.test(v)), 'not caught'));
    check('a fifth lane gun fails R2', () => ok(mutate('gunline', 'k.map[0] = "T...T"; k.map[3] = "T....T"; k.map[2] = ".T...T"').some(v => /^R2/.test(v)), 'not caught'));
    check('a second generator fails R4, and a connector in a kit that is not about reach fails R4', () => { ok(mutate('outpost', 'k.map[0] = "G.."').some(v => /^R4/.test(v)), 'generator'); ok(mutate('outpost', 'k.map[0] = ".C."').some(v => /^R4/.test(v)), 'connector'); });
    check('a piece left dark (out of link range) fails R5', () => ok(mutate('outpost', 'k.map[2] = "...TT.....T"').some(v => /^R5/.test(v)), 'not caught'));
    check('a turret square nothing asked for (it would fuse into an Ultra) fails R2', () => ok(mutate('outpost', 'k.map[2] = "...TT"; k.map[3] = "...TT"').some(v => /^R2/.test(v)), 'not caught'));
    check('a formation too far from its bank fails R6', () => ok(mutate('trap', 'k.map[1] = "GBB.......WW"; k.map[2] = ".........WW"').length > 0, 'not caught'));
    check('a column blocked wall to wall fails R7', () => ok(mutate('ultranear', 'k.map[0] = "...BB"; k.map[1] = "GBBBT"; k.map[2] = "...TT"; k.map[3] = "...TT"; k.map[0] = ".BB.T"').some(v => /^R7/.test(v)), 'not caught'));

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
                const m = J(`(function(){ const kit = kitById("${k.id}"), z = world.filter(t => t.pillar && t.pillarTeam === "green" && getZoneIndex(t.x) === 1 && !t.destroyed);
                    return { pillars: z.length, tier: networkStrength["${el}"] || 0, dark: z.filter(t => (t.attackMode || t.waveMode) && !t.isBattery && !t.isGenerator && !t.isConnector && t.powered !== true).map(t => t.x + "," + t.y),
                             ultras: z.filter(t => t._ultra).length, forms: z.filter(t => t._wform).map(t => t._wform.kind), gens: z.filter(t => t.isGenerator).length,
                             batteries: z.filter(t => t.isBattery).length, mk: z.filter(t => (t.mk || 0) >= 2).length, supports: z.filter(t => t.waveMode && !t._wform && !t._wformOf).length,
                             target: kit.target, mk2want: kitPieces(kit).filter(p => p.mk2).length }; })()`);
                same(m.pillars, info.n, 'pieces standing (extras or losses)'); same(m.gens, 1, 'generators'); same(m.tier, m.target.tier, 'the network tier it claims');
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
    check('a kit placed on a smaller one only adds the difference (STRONGPOINT on an OUTPOST: two batteries)', () => {
        clearZone(); run('kitBuild(kitFindPlacement(kitById("outpost"), "fire", __nest));'); frames(5);
        const p = J('(function(){ const pl = kitFindPlacement(kitById("strongpoint"), "fire", __nest); return { have: pl.have, free: pl.free, cost: pl.cost, blocked: pl.blocked }; })()');
        same(p.have, 5, 'already there'); same(p.free, 2, 'to add'); same(p.cost, 20, 'the cost of the difference'); same(p.blocked, 0, 'blocked');
        same(J('kitBuild(kitFindPlacement(kitById("strongpoint"), "fire", __nest)).built'), 2, 'built'); frames(5);
        same(run('world.filter(t => t.pillar && getZoneIndex(t.x) === 1).length'), 7, 'pieces after');
    });
    check('a different element on the same tiles is not "there": it is blocked (the kit does not replace what stands)', () => {
        const p = J('(function(){ const pl = kitFindPlacement(kitById("strongpoint"), "ice", __nest); return { have: pl.have, blocked: pl.blocked, free: pl.free }; })()');
        ok(p.have < 7, 'ice counted as the fire kit: ' + JSON.stringify(p));
    });
    check('an obstacle moves the placement (mirrored or shifted) to a clean spot, or reports the blocked pieces', () => {
        clearZone();
        run('(function(){ const T = (x, y) => world.find(t => t.x === x && t.y === y); const t = T(__nest.x + 2, 1); _executeBuildInstant(ELEMENTS.find(e => e.id === "core"), t, "support"); })(); _cacheAge = -999;');
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
    check('a zone has one generator: a kit placed ANYWHERE in the zone uses it (its own generator is not built or charged), so an existing generator never blocks a kit or pins it to one spot', () => {
        clearZone(); run('_executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), getTile(__nest.x + 2, 1), null); _cacheAge = -999;'); frames(2);
        const p = J('(function(){ const pl = kitFindPlacement(kitById("outpost"), "fire", __nest); return { ok: pl.ok, have: pl.have, x0: pl.x0 - __nest.x, g: pl.pieces.find(q => q.piece.c === "G").state }; })()');
        same(p.ok, true, 'a clean placement'); same(p.g, 'have', 'the generator is the existing one'); same(p.x0, 2, 'anchored on it');
        const q = J('(function(){ const pl = kitPlan(kitById("outpost"), "fire", __nest.x, 1, __nest); const g = pl.pieces.find(q => q.piece.c === "G"); return { st: g.state, why: g.why }; })()');
        same(q.st, 'have', 'a second generator was planned');
        // and it can be moved around: three different spots in the zone all plan clean, none charged for a generator
        for (const dx of [3, -4, -6]) { const pl = J('(function(){ const pl = kitPlan(kitById("outpost"), "fire", __nest.x + ' + dx + ', 1, __nest); return { blocked: pl.blocked, free: pl.free, g: pl.pieces.find(q => q.piece.c === "G").state }; })()'); same(pl.g, 'have', 'generator at shift ' + dx); same(pl.blocked, 0, 'blocked at shift ' + dx + ': ' + JSON.stringify(J('kitPlan(kitById("outpost"), "fire", __nest.x + ' + dx + ', 1, __nest).pieces.filter(q => q.state === "blocked").map(q => [q.piece.c, q.x, q.y, q.why])'))); same(pl.free, 4, 'free at shift ' + dx); }
        same(J('kitBuild(kitFindPlacement(kitById("outpost"), "fire", __nest)).built'), 4, 'the other four'); frames(3); same(run('world.filter(t => t.pillar && t.isGenerator && getZoneIndex(t.x) === 1).length'), 1, 'generators');
    });
    check('short of shards it builds what it can, in order (generator first), and says how many shards it still needs', () => {
        clearZone(); run('shardCount = 35;'); const r = J('kitBuild(kitFindPlacement(kitById("strongpoint"), "fire", __nest))'); same(r.built, 3, 'built'); ok(r.short > 0, 'no shortfall reported');
        same(run('world.filter(t => t.pillar && t.isGenerator && getZoneIndex(t.x) === 1).length'), 1, 'the generator was not first');
    });
    check('a generator spot more than six tiles from every nest is refused: the plan says so instead of building a dark kit', () => {
        const p = J('(function(){ const far = world.find(t => t.nest && getZoneIndex(t.x) === 3); const pl = kitPlan(kitById("skeleton"), "fire", far.x + 8, 1, far); return { blocked: pl.blocked, why: pl.pieces.map(q => q.why).filter(Boolean) }; })()');
        ok(p.blocked >= 1, JSON.stringify(p));
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
