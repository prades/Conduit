// FOLLOWER TRAITS & THE HYBRID ROLE — systems that were defined and did nothing.
//
// The audit found: no movement branch for the "hybrid" role (the strongest
// recruits fell through to a passive follow), Berserker's multiplier read in a
// single job branch only, and Opportunistic / Empathetic / Lone Wolf hooks that
// nothing ever called. Each now has an observable effect, held here.
// The page boots the facility (js/init.js); the scenes stand on open arena floor (__O: x 26..48 at y 49..52, and x 34..39 down to y 45; js/facilitymap.js).
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
    const ctx = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the facility did not build');
    run('gameState.running = true; facilityBlackoutSet(false); globalThis.__O = { x: 36, y: 50 }; for (const s of hazardSolids()) if (s.room === "arena") facilitySolidSet(s.id, true);');   // (the arena\'s hazard containers, build 2026-11-09yy, taken off the floor: one stood on the open row these scenes walk)

    // A clean board: one follower of the given role/traits at the arena's origin, the player on top of it.
    const scene = (setup, frames) => run(`(function(){
        actors.length = 0; followers.length = 0;
        ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
        spawnFollowerAtCrystal('fire');
        const f = followers[0];
        f.x = __O.x; f.y = __O.y; f.stance = 'follow'; f.job = null; f.post = null; f.returningToCrystal = false; f._fpPath = null;
        f.currentWill = 100; f.combatTrait = null; f.naturalTrait = null; f.perk = null; f.role = 'brawler';
        f.preferGroup = false; f.wanderRadius = 0; f.damageMultiplier = 1;
        player.x = __O.x; player.y = __O.y; player.visualX = __O.x; player.visualY = __O.y; player.targetX = __O.x; player.targetY = __O.y; player.fpPath = null;
        const mk = (x, y, hp) => { const p = new Predator('scout', Object.assign({}, SPECIES['ant'].scout, { color: SPECIES['ant'].color }), x, y);
            p.team = 'red'; p.speciesName = 'ant'; p.className = 'scout'; p.health = hp; p.maxHealth = 1e6;
            p.state = 'hunt'; p.provoked = true; p.moveSpeed = 0; p.baseMoveSpeed = 0; actors.push(p); return p; };
        const out = {};
        ${setup}
        for (let n = 0; n < ${frames || 1}; n++) { frame++; updateNPC(f); if (typeof fireBombsTick === 'function') fireBombsTick(); }
        return Object.assign(out, { fx: f.x, fy: f.y, target: f._nearestEnemy ? f._nearestEnemy.id : null });
    })()`);

    group('THE PERKS ARE GONE (build 2026-11-14e; the owner, 2026-11-14: "can we get rid of those perks? And maybe we can redesign those at a later time")');
    await check('no perk exists and none is drawn: a new follower has none; one saved with SIPHON or IRON WILL comes back with none; a follower still carrying the word neither heals on a hit nor takes less', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){ const o = { n: Object.keys(PERKS).length };
            spawnFollowerAtCrystal('fire', 'brawler'); const f = followers[followers.length - 1]; o.fresh = f.perk === null || f.perk === undefined;
            o.load = typeof followerBuild === 'function' ? (function(){ const e = { element: 'fire', personality: 'aggressive', role: 'brawler', perk: 'siphon', stats: Object.assign({}, f.stats) }; const g = followerBuild(e); return g ? (g.perk === null || g.perk === undefined) : 'none'; })() : 'no followerBuild';
            f.perk = 'iron_will'; f.spawnProtection = 0; f.health = f.maxHealth = 1000; applyDamage(f, 10, null, null, false, true); o.took = 1000 - f.health;
            f.perk = 'siphon'; f.health = 500; const S = SPECIES.ant, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), f.x + 0.5, f.y); p.team = 'red'; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p);
            for (let i = 0; i < 5; i++) { f.attackCooldown = 0; followerAttack(f, p); } o.healed = f.health - 500; p.dead = true; followers.splice(followers.indexOf(f), 1); actors = actors.filter(a => a !== f && a !== p); return o; })())`));
        ok(r.n === 0, 'perks left: ' + r.n); ok(r.fresh === true, 'a new follower drew a perk'); ok(r.load === true, 'a saved perk came back: ' + r.load); ok(r.took === 10, 'IRON WILL still cut a hit: took ' + r.took); ok(r.healed <= 0, 'SIPHON still healed: ' + r.healed);
    });

    group('HYBRID: no longer passive');

    await check('a hybrid chases and fights an enemy like a brawler', () => {
        const r = scene(`f.role = 'hybrid'; const e = mk(__O.x + 3, __O.y, 1e6); out.hp0 = e.health;
                         out.e = e; globalThis.__e = e;`, 120);
        const e = run('__e');
        ok(r.fx > run('__O.x') + 0.5, 'the hybrid never moved toward the enemy (x=' + r.fx + ')');
        ok(e.health < 1e6, 'the hybrid never attacked');
    });

    await check('a plain follower with no role branch is gone: every role has one', () => {
        ok(/role === "hybrid" \? "brawler"/.test(rd('js/npc.js')), 'hybrid is not routed to a movement branch');
    });

    group('THE TRAITS ARE GONE (build 2026-11-14f; the owner, 2026-11-14: "Remove all four"): Berserker, Opportunistic, Empathetic, Lone Wolf');

    await check('no trait exists and none is drawn: a new follower has none, and one saved with any of the four comes back with none', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){ actors.length = 0; followers.length = 0; const o = { n: Object.keys(COMBAT_TRAITS).length + Object.keys(NATURAL_TRAITS).length, fresh: [], load: [] };
            for (let i = 0; i < 12; i++) { spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; o.fresh.push(f.combatTrait || f.naturalTrait || null); }
            for (const [c, n] of [['berserker', 'lone_wolf'], ['opportunistic', 'empathetic']]) { const g = followerBuild({ element: 'fire', personality: 'aggressive', role: 'brawler', combatTrait: c, naturalTrait: n, stats: Object.assign({}, followers[0].stats) }); o.load.push(g.combatTrait || g.naturalTrait || null); }
            return o; })())`));
        ok(r.n === 0, 'traits left: ' + r.n); ok(r.fresh.every(x => x === null), 'a new follower drew a trait: ' + r.fresh); ok(r.load.every(x => x === null), 'a saved trait came back: ' + r.load);
    });

    await check('BERSERKER does nothing: a follower still carrying the word, at 10% health, hits as hard as at full health; a multiplier it had been left with is cleared', () => {
        const r = scene(`f.combatTrait = 'berserker'; f.damageMultiplier = 1.5; f.health = f.maxHealth * 0.1; mk(__O.x + 30, __O.y, 900);`, 3);
        const m = run(`(function(){ const f = followers[0]; const mkT = () => ({ x: __O.x, y: __O.y, health: 1000, maxHealth: 1000, team: 'red', element: null, dead: false, defense: 0 });
            const a = mkT(), b = mkT(); f.health = f.maxHealth; applyDamage(a, 100, f, null); f.health = f.maxHealth * 0.1; updateNPC(f); applyDamage(b, 100, f, null); return { a: 1000 - a.health, b: 1000 - b.health, mult: f.damageMultiplier }; })()`);
        ok(m.a > 0 && Math.abs(m.b - m.a) < 1e-6, 'it hit harder near death: ' + m.b + ' vs ' + m.a); ok(!(m.mult > 1), 'its multiplier was left on: ' + m.mult);
    });

    await check('OPPORTUNISTIC does nothing: a follower still carrying the word goes for the nearest enemy, as a plain one does, not the weakest', () => {
        const pick = trait => scene(`f.combatTrait = ${JSON.stringify(trait)};
            const near = mk(__O.x + 2, __O.y, 900), weak = mk(__O.x + 4.5, __O.y, 50);
            out.near = near.id; out.weak = weak.id; actors.forEach((a, i) => { a.id = a.id || ('p' + i); }); out.nearId = near.id; out.weakId = weak.id;`, 10);
        const plain = pick(null), opp = pick('opportunistic');
        ok(plain.target === plain.nearId, 'fixture: a default follower should pick the nearest');
        ok(opp.target === opp.nearId, 'one saved as opportunistic still picked the weak one');
    });

    await check('LONE WOLF and EMPATHETIC do nothing: a follower still carrying either word ends where a plain one does', () => {
        const d = trait => { const r = scene(`f.naturalTrait = ${JSON.stringify(trait)}; f.preferGroup = true; f.wanderRadius = 4; f.x = __O.x - 5; f.y = __O.y;`, 900);
            return Math.hypot(r.fx - run('__O.x'), r.fy - run('__O.y')); };
        const normal = (function(){ const r = scene(`f.naturalTrait = null; f.x = __O.x - 5; f.y = __O.y;`, 900); return Math.hypot(r.fx - run('__O.x'), r.fy - run('__O.y')); })(), lone = d('lone_wolf'), emp = d('empathetic');
        ok(normal <= 2.3, 'fixture: a default follower stops near the player, got ' + normal.toFixed(2));
        ok(Math.abs(lone - normal) < 0.15, 'a lone wolf still stands apart: ' + lone.toFixed(2) + ' vs ' + normal.toFixed(2)); ok(Math.abs(emp - normal) < 0.15, 'an empathetic one still stands nearer: ' + emp.toFixed(2) + ' vs ' + normal.toFixed(2));
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
