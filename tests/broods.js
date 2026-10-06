// PREDATOR PROGRESSION — each zone teaches one thing.
//
// THE ASK: zone 1's predators are "just attackers"; zone 2 is the BEETLE, less
// damage and three times the health, which collects material and spawns more
// of a lesser tier; nymphs come in; and a larval GRUB with a ton of health eats
// material, broken pylons and bodies to evolve into a giant boss that GUARDS
// its zone.
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
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }

(async () => {
    const ctx = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true; ensureWorldTo(6 * ZONE_LENGTH); gameState.nightNumber = 6;');
    run('actors.length = 0;');
    const C = n => run(n);
    const reset = () => run('actors.length = 0; followers.length = 0; chargedMass.length = 0; grubCorpses.length = 0; alertActive = false; for (const k in zonePredators) zonePredators[k] = [];');

    group('ZONE 1: ANTS — just attackers');

    await check('no special, no leap, no hunting, no hauling — ever', () => {
        reset();
        const r = run(`(function(){ const out = [];
            for (let i = 0; i < 60; i++) { const p = spawnPredatorForZone(1);
                out.push({ sp: p.speciesName, cls: p.className, ab: p.abilityDef, hunt: p.huntsPylons, haul: !!p.hauler, plain: !!p.plainAttacker }); }
            return out; })()`);
        for (const p of r) {
            same(p.ab, null, 'a zone-1 ' + p.cls + ' has a special');
            same(p.hunt, false, 'a zone-1 predator hunts pylons');
            same(p.haul, false, 'a zone-1 predator hauls');
            same(p.plain, true, 'not marked a plain attacker');
            ok(['scout', 'striker', 'tank'].includes(p.cls), 'zone 1 sent a ' + p.cls);
        }
    });
    await check('a plain attacker never charges an ability, even engaged and hurt', () => {
        reset();
        const r = run(`(function(){ const p = spawnPredatorForZone(1); p.provoked = true; p.health = p.maxHealth * 0.1;
            for (let i = 0; i < 400; i++) abilityTick(p);
            return { phase: p.abilityPhase || null, lift: p.leapLift || 0 }; })()`);
        ok(r.lift === 0 && r.phase !== 'winding' && r.phase !== 'active', JSON.stringify(r));
    });

    group('ZONE 2: BEETLES — the haulers');

    await check('a beetle has three times an ant\'s health and less bite, class for class', () => {
        for (const cls of ['nymph', 'scout', 'striker', 'tank', 'boss']) {
            const a = C(`SPECIES.ant.${cls}`), b = C(`SPECIES.beetle.${cls}`);
            same(b.health, a.health * 3, cls + ' health');
            ok(b.power < a.power, cls + ': a beetle bites as hard as an ant');
        }
    });
    await check('zone 2 beetles are haulers; nothing else hauls', () => {
        reset();
        const r = run(`(function(){ const out = [];
            for (let i = 0; i < 40; i++) { const p = spawnPredatorForZone(2); out.push([p.speciesName, !!p.hauler]); }
            for (const z of [1, 3, 4]) for (let i = 0; i < 10; i++) { const p = spawnPredatorForZone(z); out.push([p.speciesName + '@' + z, !!p.hauler]); }
            return out; })()`);
        for (const [sp, h] of r) {
            if (sp === 'beetle') ok(h, 'a zone-2 beetle is not a hauler');
            else ok(!h, sp + ' hauls');
        }
    });
    await check('what a beetle hauls hatches the LESSER tier', () => {
        same(C('lesserSpecies("beetle")'), 'ant', 'beetle → ant');
        same(C('lesserSpecies("mantis")'), 'scorpion', 'mantis → scorpion');
        same(C('lesserSpecies("ant")'), 'ant', 'nothing is lesser than an ant');
    });

    group('ZONE 3: NYMPH SWARMS');

    await check('most of what zone 3 sends is nymphs', () => {
        reset();
        const n = run(`(function(){ let ny = 0, t = 0; for (let i = 0; i < 300; i++) { const c = getZoneClass(3); t++; if (c === 'nymph') ny++; } return ny / t; })()`);
        ok(Math.abs(n - C('NYMPH_SWARM_SHARE')) < 0.1, 'nymph share ' + n.toFixed(2));
    });
    await check('a nymph arrives with its pack', () => {
        reset();
        const r = run(`(function(){ const before = actors.length; spawnPredatorForZone(3, { className: 'nymph' });
            return { added: actors.length - before, all: actors.every(a => a.className === 'nymph') }; })()`);
        same(r.added, C('NYMPH_SWARM_SIZE'), 'pack size');
        ok(r.all, 'the pack is not all nymphs');
    });
    await check('only zone 3 swarms', () => {
        reset();
        const added = run(`(function(){ const before = actors.length; spawnPredatorForZone(2, { className: 'nymph' }); return actors.length - before; })()`);
        same(added, 1, 'a nymph outside zone 3 brought a pack');
    });

    group('ZONE 4: THE GRUB');

    const grubAt = () => run(`(function(){ reset4(); const g = spawnGrub(); g.x = 4 * ZONE_LENGTH + 7; g.y = 2; return true;
        function reset4(){ actors.length = 0; chargedMass.length = 0; grubCorpses.length = 0;
            world.forEach(t => { if (t.pillar && Math.floor(t.x / ZONE_LENGTH) === 4) t.pillar = false; });
            world.forEach(t => { if (t.nest && t.nestZone === 4) t.nestHealth = t.nestMaxHealth || 200; }); } })()`);
    const G = () => 'actors.find(a => a.isGrub)';

    await check('one grub hatches in zone 4 while it is hostile — never two', () => {
        reset();
        run('world.forEach(t => { if (t.nest && t.nestZone === 4) t.nestHealth = t.nestMaxHealth || 200; }); _grubTimer = 0;');
        for (let i = 0; i < 5; i++) run('broodSpawnTick()');
        same(C('actors.filter(a => a.isGrub).length'), 1, 'grub count');
        const g = C(G());
        ok(g.maxHealth >= 1000, 'a grub should have a ton of health, has ' + g.maxHealth);
        same(g.power, 0, 'a grub should not bite');
    });
    await check('none hatches before zone 4 is hostile (night 4)', () => {
        reset();
        run('gameState.nightNumber = 3; _grubTimer = 0; for (let i = 0; i < 5; i++) broodSpawnTick();');
        same(C('actors.filter(a => a.isGrub).length'), 0, 'a grub hatched before its zone was hostile');
        run('gameState.nightNumber = 6;');
    });
    await check('none hatches in a zone you have neutralised', () => {
        reset();
        run('world.forEach(t => { if (t.nest && t.nestZone === 4) t.nestHealth = 0; }); _grubTimer = 0; broodSpawnTick();');
        same(C('actors.filter(a => a.isGrub).length'), 0, 'a grub hatched in a taken zone');
        run('world.forEach(t => { if (t.nest && t.nestZone === 4) t.nestHealth = t.nestMaxHealth || 200; });');
    });
    await check('it eats charged mass on the floor', () => {
        grubAt();
        run(`chargedMass.push({ x: 4 * ZONE_LENGTH + 8, y: 2, value: 6, state: 'charged', carrier: null })`);
        for (let i = 0; i < 400; i++) run(`${G()}.update()`);
        same(C('chargedMass.length'), 0, 'the lump is still there');
        same(C(`${G()}.evo`), 6, 'the material was not gained');
    });
    await check('it eats the bodies of predators that die in its zone', () => {
        grubAt();
        run(`(function(){ const S = SPECIES.ant; const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 4 * ZONE_LENGTH + 9, 2);
             p.shardDrop = 8; noteCorpse(p); })()`);
        same(C('grubCorpses.length'), 1, 'no body was left');
        for (let i = 0; i < 600; i++) run(`${G()}.update()`);
        same(C('grubCorpses.length'), 0, 'the body was not eaten');
        same(C(`${G()}.evo`), 8, 'the body gave nothing');
    });
    await check('it chews an enemy pylon down to a wreck, then eats the wreck', () => {
        grubAt();
        const r = run(`(function(){ const t = world.find(t => t.type === 'floor' && t.x === 4 * ZONE_LENGTH + 8 && t.y === 2);
            Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'red', health: 60, maxHealth: 80, takenFromPlayer: true });
            const g = ${G()}; for (let i = 0; i < 900; i++) g.update();
            const r = { pillar: t.pillar, evo: g.evo }; t.pillar = false; return r; })()`);
        same(r.pillar, false, 'the pylon was not eaten away');
        same(r.evo, C('GRUB_EAT_PYLON') + C('GRUB_EAT_WRECK'), 'material from pylon + wreck');
    });
    await check("it leaves the enemy's own pylons alone — only ones taken from you", () => {
        grubAt();
        const r = run(`(function(){ const t = world.find(t => t.type === 'floor' && t.x === 4 * ZONE_LENGTH + 8 && t.y === 2);
            Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'red', health: 60, maxHealth: 80, takenFromPlayer: false });
            const g = ${G()}; for (let i = 0; i < 600; i++) g.update();
            const r = { pillar: t.pillar, health: t.health }; t.pillar = false; return r; })()`);
        ok(r.pillar && r.health === 60, 'it chewed the enemy\'s own pylon');
    });
    await check('it stays in its own zone: food elsewhere is ignored', () => {
        grubAt();
        run(`chargedMass.push({ x: 2 * ZONE_LENGTH + 5, y: 2, value: 6, state: 'charged', carrier: null })`);
        for (let i = 0; i < 200; i++) run(`${G()}.update()`);
        same(C('chargedMass.length'), 1, 'it went for mass in another zone');
    });

    group('THE BROOD TYRANT');

    const evolve = () => run(`(function(){ actors.length = 0; spawnGrub(); const g = actors.find(a => a.isGrub);
        g.x = 4 * ZONE_LENGTH + 6; g.y = 2; const before = chargedMass.length; _grubGain(g, GRUB_EVOLVE_COST);
        return { grubs: actors.filter(a => a.isGrub && !a.dead).length, broods: actors.filter(a => a.isBrood).length,
                 lumps: chargedMass.length - before }; })()`);

    await check('THE ASK: at GRUB_EVOLVE_COST the grub becomes a giant boss, and drops nothing doing it', () => {
        const r = evolve();
        same(r.grubs, 0, 'the grub is still there');
        same(r.broods, 1, 'no tyrant');
        same(r.lumps, 0, 'evolving dropped loot as if it had died');
        const b = C('actors.find(a => a.isBrood)');
        ok(b.maxHealth >= 3000, 'the tyrant is not a giant (' + b.maxHealth + ')');
        ok(b.dimensions.width > C('SPECIES.mantis.boss.width') * 2, 'the tyrant is not drawn bigger');
    });
    await check('it GUARDS its zone: walked out, it is pulled back in', () => {
        evolve();
        const x = run(`(function(){ const b = actors.find(a => a.isBrood); b.x = 2 * ZONE_LENGTH; for (let i = 0; i < 2000; i++) broodTick(b); return b.x; })()`);
        ok(x > 3 * C('ZONE_LENGTH'), 'it wandered out of its zone (x=' + x.toFixed(1) + ')');
    });
    await check('predators beside it hit harder', () => {
        evolve();
        const r = run(`(function(){ const b = actors.find(a => a.isBrood);
            const S = SPECIES.ant; const near = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), b.x + 1, b.y);
            near.team = 'red'; actors.push(near); broodTick(b);
            const t1 = { health: 1000, maxHealth: 1000, team: 'green', dead: false }, t2 = { health: 1000, maxHealth: 1000, team: 'green', dead: false };
            applyDamage(t1, 100, near, null); near.broodBuffUntil = 0; applyDamage(t2, 100, near, null);
            return [1000 - t1.health, 1000 - t2.health]; })()`);
        ok(Math.abs(r[0] / r[1] - C('BROOD_AURA_MULT')) < 0.02, 'buffed ' + r[0] + ' vs ' + r[1]);
    });
    await check('it hatches nymphs on a timer, up to its cap', () => {
        evolve();
        const n = run(`(function(){ const b = actors.find(a => a.isBrood); for (let i = 0; i < BROOD_SPAWN_FRAMES * 10; i++) broodTick(b);
            return b._brood.filter(p => !p.dead).length; })()`);
        same(n, C('BROOD_MAX_NYMPHS'), 'nymph count');
    });
    await check('when the grub and tyrant are gone, a new grub hatches only after a long wait', () => {
        reset();
        run('world.forEach(t => { if (t.nest && t.nestZone === 4) t.nestHealth = t.nestMaxHealth || 200; }); _grubTimer = 0; broodSpawnTick();');
        run('actors.forEach(a => { if (a.isGrub) a.dead = true; }); broodSpawnTick();');
        same(C('actors.filter(a => a.isGrub && !a.dead).length'), 0, 'a grub came straight back');
        run('for (let i = 0; i < GRUB_RESPAWN_FRAMES + 5; i++) broodSpawnTick();');
        same(C('actors.filter(a => a.isGrub && !a.dead).length'), 1, 'no grub after the wait');
    });

    group('drawing and docs');

    await check('the grub draws as a larva with its evolution shown; the tyrant is named', () => {
        evolve(); run('spawnGrub()');
        const said = run(`(function(){ const out = []; const keep = ctx.fillText; ctx.fillText = t => out.push(String(t));
            try { for (const a of actors) _drawPredator(a, 400, 300, ctx); } finally { ctx.fillText = keep; } return out; })()`);
        ok(said.some(t => /GRUB · EVOLVING/.test(t)), 'no evolving label: ' + said);
        ok(said.some(t => /BROOD TYRANT/.test(t)), 'the tyrant is not named');
    });
    await check('the GAME INDEX explains the progression', () => {
        const html = rd('game.html');
        const at = html.indexOf('PREDATOR PROGRESSION');
        ok(at > -1, 'no index entry');
        const page = html.slice(at, at + 3000);
        for (const w of ['ANTS', 'BEETLES', 'NYMPH', 'GRUB', 'BROOD TYRANT']) ok(page.includes(w), 'it does not mention ' + w);
        ok(page.indexOf('>' + C('GRUB_EVOLVE_COST') + '<') > -1, 'it does not state the evolve cost');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
