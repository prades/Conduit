// FOLLOWER TRAITS & THE HYBRID ROLE — systems that were defined and did nothing.
//
// The audit found: no movement branch for the "hybrid" role (the strongest
// recruits fell through to a passive follow), Berserker's multiplier read in a
// single job branch only, and Opportunistic / Empathetic / Lone Wolf hooks that
// nothing ever called. Each now has an observable effect, held here.
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
    run('gameState.running = true;');

    // A clean board: one follower of the given role/traits at (6,2), player at (6,2+px).
    const scene = (setup, frames) => run(`(function(){
        actors.length = 0; followers.length = 0; chargedMass.length = 0;
        ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
        spawnFollowerAtCrystal('fire');
        const f = followers[0];
        f.x = 6; f.y = 2; f.stance = 'follow'; f.job = null; f.duty = 'fighter';
        f.currentWill = 100; f.combatTrait = null; f.naturalTrait = null; f.perk = null; f.role = 'brawler';
        f.preferGroup = false; f.wanderRadius = 0; f.damageMultiplier = 1;
        player.x = 6; player.y = 2; player.visualX = 6; player.visualY = 2;
        const mk = (x, y, hp) => { const p = new Predator('scout', Object.assign({}, SPECIES['ant'].scout, { color: SPECIES['ant'].color }), x, y);
            p.team = 'red'; p.speciesName = 'ant'; p.className = 'scout'; p.health = hp; p.maxHealth = 1e6;
            p.state = 'hunt'; p.provoked = true; p.moveSpeed = 0; p.baseMoveSpeed = 0; actors.push(p); return p; };
        const out = {};
        ${setup}
        for (let n = 0; n < ${frames || 1}; n++) { frame++; updateNPC(f); }
        return Object.assign(out, { fx: f.x, fy: f.y, target: f._nearestEnemy ? f._nearestEnemy.id : null });
    })()`);

    group('HYBRID: no longer passive');

    await check('a hybrid chases and fights an enemy like a brawler', () => {
        const r = scene(`f.role = 'hybrid'; const e = mk(9, 2, 1e6); out.hp0 = e.health;
                         out.e = e; globalThis.__e = e;`, 120);
        const e = run('__e');
        ok(r.fx > 6.5, 'the hybrid never moved toward the enemy (x=' + r.fx + ')');
        ok(e.health < 1e6, 'the hybrid never attacked');
    });

    await check('a plain follower with no role branch is gone: every role has one', () => {
        ok(/role === "hybrid" \? "brawler"/.test(rd('js/npc.js')), 'hybrid is not routed to a movement branch');
    });

    group('BERSERKER: the multiplier is applied to real damage');

    await check('a berserking follower deals 1.5x through the damage chokepoint', () => {
        const r = run(`(function(){
            actors.length = 0; followers.length = 0;
            spawnFollowerAtCrystal('fire'); const f = followers[0];
            const mkT = () => ({ x: 9, y: 9, health: 1000, maxHealth: 1000, team: 'red', element: null, dead: false, defense: 0 });
            const a = mkT(), b = mkT();
            f.damageMultiplier = 1; applyDamage(a, 100, f, null);
            f.damageMultiplier = 1.5; applyDamage(b, 100, f, null);
            return { a: 1000 - a.health, b: 1000 - b.health };
        })()`);
        ok(r.a > 0 && Math.abs(r.b / r.a - 1.5) < 0.02, 'expected 1.5x, got ' + (r.b / r.a).toFixed(2) + ' (' + r.a + ' vs ' + r.b + ')');
    });

    await check('the trait itself switches the multiplier on under 30% health', () => {
        const r = run(`(function(){
            const f = { health: 20, maxHealth: 100 }; COMBAT_TRAITS.berserker.onUpdate(f);
            const g = { health: 90, maxHealth: 100 }; COMBAT_TRAITS.berserker.onUpdate(g);
            return [f.damageMultiplier, g.damageMultiplier]; })()`);
        ok(r[0] === 1.5 && r[1] === 1, JSON.stringify(r));
    });

    group('OPPORTUNISTIC: weakest in reach');

    await check('it picks the weakest enemy in reach, not the nearest', () => {
        const pick = trait => scene(`f.combatTrait = ${JSON.stringify(trait)};
            const near = mk(8, 2, 900), weak = mk(10.5, 2, 50);
            out.near = near.id; out.weak = weak.id; actors.forEach((a, i) => { a.id = a.id || ('p' + i); }); out.nearId = near.id; out.weakId = weak.id;`, 10);
        const plain = pick(null), opp = pick('opportunistic');
        ok(plain.target === plain.nearId, 'fixture: a default follower should pick the nearest');
        ok(opp.target === opp.weakId, 'opportunistic did not pick the weak one');
    });

    group('NATURAL TRAITS: distance and company');

    await check('LONE WOLF keeps its distance, a default follower comes close', () => {
        const d = trait => { const r = scene(`f.naturalTrait = ${JSON.stringify(trait)}; f.x = 1; f.y = 2;`, 900);
            return Math.hypot(r.fx - 6, r.fy - 2); };
        const normal = d(null), lone = d('lone_wolf');
        ok(normal <= 2.3, 'fixture: a default follower stops near the player, got ' + normal.toFixed(2));
        ok(lone >= 3.5, 'a lone wolf came within ' + lone.toFixed(2) + ' tiles');
    });

    await check('EMPATHETIC leans toward its allies', () => {
        const x = trait => scene(`f.naturalTrait = ${JSON.stringify(trait)}; f.x = 6; f.y = 7;
            spawnFollowerAtCrystal('fire'); spawnFollowerAtCrystal('fire');
            for (const o of followers.slice(1)) { o.x = 2; o.y = 7; o.isFollower = true; o.stance = 'hold'; o.moveSpeed = 0; }`, 600);
        const plain = x(null), emp = x('empathetic');
        ok(emp.fx < plain.fx - 0.5, 'empathetic ended at x=' + emp.fx.toFixed(2) + ' vs ' + plain.fx.toFixed(2) + ' for a default follower');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
