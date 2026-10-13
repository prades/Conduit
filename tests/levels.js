// LEVELS AND STATS — one system for followers, predators and clones.
//
// THE REPORTED CASE: "There needs to be a level and stats system like in
// Pokémon for all entities. All followers have a base stat modified by their
// personalities, then the predators and clones should have a similar system and
// they should have the level and type of npc visible next to their health
// bars." — "This will replace the current combat system."
//
// Asked: XP from kills; a predator's level by wave and zone; cap 100; a death
// costs some XP. js/levels.js.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
const near = (a, b, e) => Math.abs(a - b) <= (e || 1e-9);

async function boot(store) {
    const sb = makeBrowserSandbox(store || {});
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) { console.log('  (load ' + rel + ': ' + e.message + ')'); }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id));
         ensureWorldTo(80); player.x = player.targetX = player.visualX = 10; player.y = player.targetY = player.visualY = 1.5; render();`);
    return run;
}

(async () => {
    const run = await boot();
    // A follower of a personality, placed and held still.
    const FOL = (pers, x, y) => `(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1];
        f.returningToCrystal = false; f.x = ${x}; f.y = ${y}; f.moveSpeed = 0;
        ${pers ? `f.personality = '${pers}'; f.stats = applyPersonality('${pers}'); f.role = assignRole(f.stats); initFollowerLevel(f);` : ''}
        return f; })()`;

    console.log('\nTHE CURVE');
    check('×1 at level 5, ×4 at 50; total XP to a level is its cube', () => {
        ok(near(run('levelFactor(5)'), 1) && near(run('levelFactor(50)'), 4) && near(run('levelFactor(100)'), 110 / 15), 'levelFactor');
        same(run('xpForLevel(10)'), 1000, 'xp for 10'); same(run('levelFromXp(1000)'), 10, 'level at 1000'); same(run('levelFromXp(999)'), 9, 'level at 999');
        same(run('levelFromXp(1e12)'), 100, 'the cap');
    });

    console.log('\nFOLLOWERS (base stats × personality, then the level)');
    check('THE ASK: a new follower is level 5 with exactly its personality\'s stats — nothing changes for it', () => {
        const r = run(`(function(){ const f = ${FOL('aggressive', 12, 1)};
            return { lv: f.level, xp: f.xp, st: f.stats, base: applyPersonality('aggressive'), hp: f.maxHealth, pw: f.power }; })()`);
        same(r.lv, 5, 'level'); same(r.xp, 125, 'xp');
        same(JSON.stringify(r.st), JSON.stringify(r.base), 'stats');
        same(r.hp, r.base.hp, 'max health'); same(r.pw, r.base.attack, 'power');
    });
    check('THE ASK: gaining levels raises every levelled stat in proportion — but not its walking speed or its role', () => {
        const r = run(`(function(){ const f = ${FOL('cunning', 12, 1)}; const sp = f.moveSpeed, role = f.role, b = Object.assign({}, f.base);
            f.health = 5; const h0 = f.health, m0 = f.maxHealth;
            gainXp(f, xpForLevel(20) - f.xp);
            return { lv: f.level, atk: f.stats.attack, def: f.stats.defense, hp: f.maxHealth, health: f.health, h0, m0, b, sp, sp2: f.moveSpeed, role, role2: f.role, speed: f.stats.speed }; })()`);
        same(r.lv, 20, 'level');
        same(r.atk, Math.round(r.b.attack * 2), 'attack at 20 (×2)');
        same(r.def, Math.round(r.b.defense * 2), 'defense at 20');
        same(r.hp, Math.round(r.b.hp * 2), 'max hp at 20');
        same(r.health, r.h0 + (r.hp - r.m0), 'the new max health is added to its current health');
        same(r.sp2, r.sp, 'walking speed'); same(r.role2, r.role, 'role'); same(r.speed, r.b.speed, 'the speed stat');
    });
    check('a recruit joins at the level of where it was found: three behind its predators, never under 5', () => {
        same(run('recruitLevel(1)'), 5, 'zone 1, wave 1');
        same(run('recruitLevel(8)'), run('predatorLevelFor(8, undefined, false)') - 3, 'zone 8');
        const lv = run(`(function(){ const keep = nextZoneToTake; nextZoneToTake = () => 7; spawnFollowerAtCrystal('fire'); nextZoneToTake = keep; return followers[followers.length - 1].level; })()`);
        same(lv, run('predatorLevelFor(7, undefined, false)') - 3, 'a recruit made at the Crystal with the frontier at zone 7');
    });
    check('it stops at level 100', () => {
        same(run(`(function(){ const f = ${FOL('', 12, 1)}; gainXp(f, 1e12); return f.level; })()`), 100, 'level');
    });

    console.log('\nPREDATORS (their level is the wave and the zone)');
    const lvAt = (z, w, n) => run(`(function(){ gameState.nightNumber = ${w}; const out = [];
        for (let i = 0; i < ${n || 20}; i++) { const p = spawnPredatorForZone(${z}, { species: 'ant', className: 'scout' }); out.push(p.level); p.dead = true; }
        actors = actors.filter(a => !a.dead); gameState.nightNumber = 1; return out; })()`);
    check('THE ASK: wave 1 in zone 1 is level 5, give or take one', () => {
        ok(lvAt(1, 1).every(L => L >= 4 && L <= 6), 'levels ' + lvAt(1, 1));
    });
    check('…a level for every two waves, three for every zone of the ramp', () => {
        ok(lvAt(1, 9).every(L => L >= 8 && L <= 10), 'wave 9 zone 1: ' + lvAt(1, 9));
        ok(lvAt(6, 1).every(L => L >= 16 && L <= 18), 'wave 1 zone 6: ' + lvAt(6, 1));
    });
    check('its numbers are its level-5 numbers × its level', () => {
        const r = run(`(function(){ const p = spawnPredatorForZone(6, { species: 'ant', className: 'scout' }); p.dead = true;
            return { lv: p.level, hp: p.maxHealth, pw: p.power, base: p.base }; })()`);
        same(r.hp, Math.round(r.base.hp * run(`levelFactor(${r.lv})`)), 'health');
        same(r.pw, Math.round(r.base.attack * run(`levelFactor(${r.lv})`)), 'power');
    });
    check('armour by class: a tank and a beetle have DEF; a scout has none', () => {
        const r = run(`(function(){ const mk = (sp, cl) => { const p = spawnPredatorForZone(1, { species: sp, className: cl }); p.dead = true; return p.def; };
            return { scout: mk('ant', 'scout'), tank: mk('ant', 'tank'), beetle: mk('beetle', 'scout') }; })()`);
        same(r.scout, 0, 'ant scout'); ok(r.tank > 0, 'ant tank DEF ' + r.tank); ok(r.beetle > 0, 'beetle DEF ' + r.beetle);
    });
    check('deep in the tunnel a predator goes past 100 (the tunnel never ends)', () => {
        ok(run('predatorLevelFor(60, 1, false)') > 100, 'zone 60 level ' + run('predatorLevelFor(60, 1, false)'));
    });

    console.log('\nDEFENSE (every unit now)');
    check('a level-5 follower against a level-5 bite: the same ×0.625 it always took', () => {
        const r = run(`(function(){ const f = ${FOL('', 12, 1)}; f.stats.defense = 10; const p = spawnPredatorForZone(1, { species: 'ant', className: 'scout' }); p.level = 5; p.dead = true;
            return defenseMult(f, p); })()`);
        ok(near(r, 10 / 16), 'mult ' + r);
    });
    check('a higher-level attacker punches through more of it', () => {
        const r = run(`(function(){ const f = ${FOL('', 12, 1)}; f.stats.defense = 10; const a = { level: 5 }, b = { level: 40 }; return [defenseMult(f, a), defenseMult(f, b)]; })()`);
        ok(r[1] > r[0], 'level 40 ' + r[1] + ' vs level 5 ' + r[0]);
    });
    check('a predator\'s armour now cuts your damage too', () => {
        const r = run(`(function(){ const p = spawnPredatorForZone(1, { species: 'ant', className: 'tank' }); p.dead = false; p.health = p.maxHealth = 1e6;
            const f = ${FOL('', 12, 1)}; const h0 = p.health; applyDamage(p, 100, f); const took = h0 - p.health; p.dead = true; return { took, mult: defenseMult(p, f) }; })()`);
        ok(r.mult < 1 && Math.abs(r.took - 100 * r.mult) < 1.5, JSON.stringify(r));
    });

    console.log('\nXP FROM KILLS');
    const KILL = (cls, setup) => run(`(function(){ actors = actors.filter(a => !(a instanceof Predator) && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k] = [];
        const killer = ${FOL('', 30, 1)}, ally = ${FOL('', 31, 2)}, far = ${FOL('', 50, 1)};
        const p = spawnPredatorForZone(2, { species: 'ant', className: '${cls}' }); p.x = 30.5; p.y = 1.5; p.update = () => {};
        p.lastAttacker = killer; ${setup || ''}
        const x0 = [killer.xp, ally.xp, far.xp]; p.health = 0; p.dead = true; render();
        return { worth: killXp(p), lv: p.level, k: killer.xp - x0[0], a: ally.xp - x0[1], f: far.xp - x0[2] }; })()`);
    check('THE ASK: the killer gets 60% and the ally fighting beside it 40%; one far away nothing', () => {
        const r = KILL('scout');
        ok(near(r.k, r.worth * 0.6, 1e-6) && near(r.a, r.worth * 0.4, 1e-6) && r.f === 0, JSON.stringify(r));
        same(r.worth, Math.round(run('XP_YIELD.scout') * r.lv / 5), 'a scout is worth its yield × level / 5');
    });
    check('…alone, the killer gets it all', () => {
        const r = KILL('scout', 'ally.x = 70;');
        ok(near(r.k, r.worth, 1e-6), JSON.stringify(r));
    });
    check('…a kill by a turret goes to the units near it (half of it)', () => {
        const r = KILL('scout', 'p.lastAttacker = { x: 30, y: 0, pillar: true };');
        ok(r.k > 0 && near(r.k + r.a, r.worth * 0.5, 1e-6), JSON.stringify(r));
    });
    check('stronger predators are worth more', () => {
        ok(KILL('tank').worth > KILL('scout').worth, 'tank vs scout');
        ok(KILL('scout', 'p.isElite = true;').worth > KILL('scout').worth, 'elite vs plain');
    });
    check('enough kills level a follower up, and it says so', () => {
        const r = run(`(function(){ const f = ${FOL('', 12, 1)}; const n0 = floatingTexts.length; gainXp(f, xpForLevel(6) - f.xp + 1);
            return { lv: f.level, said: floatingTexts.slice(n0).some(t => /LEVEL 6/.test(t.text)) }; })()`);
        ok(r.lv === 6 && r.said, JSON.stringify(r));
    });

    console.log('\nDYING');
    check('THE ASK: a follower that dies keeps its level but loses a quarter of its progress, and comes back with it', () => {
        const r = run(`(function(){ actors = actors.filter(a => !a.isFollower); followers.length = 0;
            const f = ${FOL('', 12, 1)}; gainXp(f, xpForLevel(12) - f.xp + 400); const lv = f.level, xp = f.xp, baseHp = f.base.hp;
            f.health = 0; f.dead = true;
            for (let i = 0; i < 400 && !followers.some(x => !x.dead); i++) { gameState.running = true; crystal.health = crystal.maxHealth; render(); }
            const g = followers.find(x => !x.dead);
            return g ? { lv, xp, lv2: g.level, xp2: g.xp, baseHp, baseHp2: g.base.hp } : null; })()`);
        ok(r, 'it never came back');
        same(r.lv2, r.lv, 'level after dying');
        same(r.xp2, Math.round(run(`xpForLevel(${r.lv})`) + (r.xp - run(`xpForLevel(${r.lv})`)) * 0.75), 'xp after dying');
        same(r.baseHp2, r.baseHp - 1, 'the HP stat still wears down by one');
    });

    console.log('\nCLONES');
    check('a clone comes out at the frontier\'s level, its species × the clone multipliers', () => {
        const r = run(`(function(){ const c = makeClone('ant', 'scout', 5, 2); c.dead = true;
            return { lv: c.level, hp: c.maxHealth, base: SPECIES.ant.scout.health * CLONE_HEALTH_MULT, k: levelFactor(c.level) }; })()`);
        same(r.lv, run('predatorLevelFor(nextZoneToTake(), undefined, false)'), 'level');
        same(r.hp, Math.round(r.base * r.k), 'health');
    });
    check('…it gains XP from its kills and levels up', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); const c = makeClone('ant', 'scout', 30, 1); c.update = () => {};
            const p = spawnPredatorForZone(2, { species: 'ant', className: 'scout' }); p.x = 30.4; p.y = 1; p.update = () => {}; p.lastAttacker = c;
            const x0 = c.xp; p.health = 0; p.dead = true; render();
            const l0 = c.level, hp0 = c.maxHealth;
            gainXp(c, xpForLevel(c.level + 3) - c.xp);
            return { gained: c.xp - x0 > 0, l0, l1: c.level, hp0, hp1: c.maxHealth }; })()`);
        ok(r.gained && r.l1 === r.l0 + 3 && r.hp1 > r.hp0, JSON.stringify(r));
    });
    check('a clone that dies now COMES BACK (it never did: it had no HP stat to read) — at its level', () => {
        const r = run(`(function(){ actors = actors.filter(a => !a.isClone); respawnQueue.length = 0; const c = makeClone('ant', 'scout', 5, 2);
            gainXp(c, xpForLevel(c.level + 2) - c.xp); const lv = c.level; c.health = 0; c.dead = true;
            for (let i = 0; i < 3; i++) render();
            const e = respawnQueue.find(q => q.isClone); if (!e) return null; e.timer = 1;
            for (let i = 0; i < 3; i++) render();
            const back = actors.find(a => a.isClone && !a.dead); return back ? { lv, lv2: back.level } : 'none'; })()`);
        ok(r && r !== 'none', 'the clone was not queued or did not come back: ' + JSON.stringify(r));
        same(r.lv2, r.lv, 'level after respawning');
    });

    console.log('\nTHE LABEL');
    check('THE ASK: level and kind over the bar — "Lv 5 FIRE BRAWLER", "Lv n ANT SCOUT", "Lv n ANT CLONE"', () => {
        const r = run(`(function(){ const f = ${FOL('aggressive', 12, 1)}; const p = spawnPredatorForZone(1, { species: 'ant', className: 'scout' }); p.dead = true;
            const c = makeClone('ant', 'scout', 5, 2); c.dead = true;
            const said = []; const keep = cachedText; cachedText = (t) => said.push(t);
            drawUnitTag(f, 0, 0, ctx); drawUnitTag(p, 0, 0, ctx); drawUnitTag(c, 0, 0, ctx); cachedText = keep;
            return { said, p: p.level, c: c.level, role: f.role.toUpperCase() }; })()`);
        same(r.said[0], 'Lv 5 FIRE ' + r.role, 'follower');
        same(r.said[1], 'Lv ' + r.p + ' ANT SCOUT', 'predator');
        same(r.said[2], 'Lv ' + r.c + ' ANT CLONE', 'clone');
    });
    check('it is drawn over every unit\'s health bar', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/draw.js'), 'utf8');
        ok((src.match(/drawUnitTag\(actor, px, py - /g) || []).length >= 2, 'not called from both health bars');
    });

    console.log('\nKEEPING IT');
    {
        const store = {};
        const a = await boot(store);
        a(`(function(){ spawnFollowerAtCrystal('fire'); const f = followers[0]; gainXp(f, xpForLevel(14) - f.xp + 50);
            const c = makeClone('beetle', 'scout', 5, 2); gainXp(c, xpForLevel(c.level + 4) - c.xp);
            globalThis.__want = { f: [f.level, f.xp], c: [c.level, c.xp] }; saveFollowerRoster(); saveSession(); })()`);
        const want = a('__want');
        const b = await boot(store);
        check('levels and XP survive a refresh — followers and clones', () => {
            const got = b(`({ f: [followers[0].level, followers[0].xp], c: (function(){ const c = actors.find(a => a.isClone && !a.dead); return c ? [c.level, c.xp] : null; })() })`);
            same(JSON.stringify(got.f), JSON.stringify(want.f), 'follower');
            same(JSON.stringify(got.c), JSON.stringify(want.c), 'clone');
        });
    }

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
