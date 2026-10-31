// LEVELS AND STATS — one system for followers, creatures and clones.
//
// THE REPORTED CASE: "There needs to be a level and stats system like in
// Pokémon for all entities. All followers have a base stat modified by their
// personalities, then the predators and clones should have a similar system and
// they should have the level and type of npc visible next to their health
// bars." — "This will replace the current combat system."
//
// Asked: XP from kills; a creature's level is the arena's (js/levels.js creatureLevel: the top of the spawner's band, js/facilityspawn.js FP_SPAWN.levels);
// cap 100; a death costs some XP. js/levels.js.
//
// THE FIXTURE: the page boots the facility (js/init.js). Its tutorial director puts every follower at TUT.followerLevel on each tick (js/tutorial.js), which
// would hide the level system under test, so the fixture switches that off (TUT.followerLevel = 0). Units that have to stand still stand on open arena floor (__O).
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
    run(`gameState.running = true; facilityBlackoutSet(false); TUT.followerLevel = 0;   // (the tutorial's levelling is off: the level system itself is under test)
         globalThis.__O = { x: 30, y: 50 };   // open arena floor: x 26..48 at y 49..52 (js/facilitymap.js)
         player.x = player.targetX = player.visualX = __O.x + 4; player.y = player.targetY = player.visualY = __O.y + 1; player.fpPath = null; render();`);
    return run;
}

(async () => {
    const run = await boot();
    // A follower of a personality, placed (dx, dy from the arena's origin) and held still.
    const FOL = (pers, dx, dy) => `(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1];
        f.returningToCrystal = false; f.x = __O.x + ${dx}; f.y = __O.y + ${dy}; f.moveSpeed = 0; f._fpPath = null;
        ${pers ? `f.personality = '${pers}'; f.stats = applyPersonality('${pers}'); f.role = assignRole(f.stats); initFollowerLevel(f);` : ''}
        return f; })()`;

    console.log('\nTHE CURVE');
    check('×1 at level 5, ×4 at 50; total XP to a level is its cube', () => {
        ok(near(run('levelFactor(5)'), 1) && near(run('levelFactor(50)'), 4) && near(run('levelFactor(100)'), 110 / 15), 'levelFactor');
        same(run('xpForLevel(10)'), 1000, 'xp for 10'); same(run('levelFromXp(1000)'), 10, 'level at 1000'); same(run('levelFromXp(999)'), 9, 'level at 999');
        same(run('levelFromXp(1e12)'), 100, 'the cap');
    });

    console.log('\nFOLLOWERS (base stats × personality, then the level)');
    check('THE ASK: a new follower is level 5 with exactly its personality\'s stats — nothing changes for it but its max health, a quarter up', () => {
        const r = run(`(function(){ const f = ${FOL('aggressive', 2, 0)};
            return { lv: f.level, xp: f.xp, st: f.stats, base: applyPersonality('aggressive'), hp: f.maxHealth, pw: f.power }; })()`);
        same(r.lv, 5, 'level'); same(r.xp, 125, 'xp');
        same(JSON.stringify(r.st), JSON.stringify(r.base), 'stats');
        same(r.hp, Math.round(r.base.hp * run('FOLLOWER_HP_MULT')), 'max health (the hp stat, and a quarter more: FOLLOWER_HP_MULT)'); same(r.pw, r.base.attack, 'power');
    });
    check('THE ASK: gaining levels raises every levelled stat in proportion — but not its walking speed or its role', () => {
        const r = run(`(function(){ const evoFor = evolutionFor; evolutionFor = () => null; try { const f = ${FOL('cunning', 2, 0)}; /* evolving at its level multiplies its stats (x1.25, js/evolution.js), and every element and role has a form: switched off for the check */ const sp = f.moveSpeed, role = f.role, b = Object.assign({}, f.base);
            f.health = 5; const h0 = f.health, m0 = f.maxHealth;
            gainXp(f, xpForLevel(20) - f.xp);
            return { lv: f.level, atk: f.stats.attack, def: f.stats.defense, hp: f.maxHealth, health: f.health, h0, m0, b, sp, sp2: f.moveSpeed, role, role2: f.role, speed: f.stats.speed, evo: f.evolved || null }; } finally { evolutionFor = evoFor; } })()`);
        same(r.evo, null, 'it evolved');
        same(r.lv, 20, 'level');
        same(r.atk, Math.round(r.b.attack * 2), 'attack at 20 (×2)');
        same(r.def, Math.round(r.b.defense * 2), 'defense at 20');
        same(r.hp, Math.round(Math.round(r.b.hp * 2) * run('FOLLOWER_HP_MULT')), 'max hp at 20 (x2, and a quarter more: FOLLOWER_HP_MULT)');
        same(r.health, r.h0 + (r.hp - r.m0), 'the new max health is added to its current health');
        same(r.sp2, r.sp, 'walking speed'); same(r.role2, r.role, 'role'); same(r.speed, r.b.speed, 'the speed stat');
    });
    check('a recruit joins a little behind the arena\'s creatures (RECRUIT_BEHIND under creatureLevel), never under 5', () => {
        same(run('creatureLevel()'), run('Math.max(LEVEL_START, FP_SPAWN.levels[1])'), 'the arena\'s level is the top of the spawner\'s band');
        same(run('recruitLevel()'), run('Math.max(LEVEL_START, creatureLevel() - RECRUIT_BEHIND)'), 'recruitLevel');
        ok(run('recruitLevel()') >= run('LEVEL_START'), 'under 5: ' + run('recruitLevel()'));
        const lv = run(`(function(){ spawnFollowerAtCrystal('fire'); return followers[followers.length - 1].level; })()`);
        same(lv, run('recruitLevel()'), 'a recruit made at the Crystal');
    });
    check('it stops at level 100', () => {
        same(run(`(function(){ const f = ${FOL('', 2, 0)}; gainXp(f, 1e12); return f.level; })()`), 100, 'level');
    });

    console.log('\nCREATURES (their level is the arena\'s)');
    const lvAt = (n) => run(`(function(){ const out = [];
        for (let i = 0; i < ${n || 20}; i++) { const p = spawnCreature({ species: 'ant', className: 'scout', x: __O.x, y: __O.y }); out.push(p.level); p.dead = true; }
        actors = actors.filter(a => !a.dead); return out; })()`);
    check('THE ASK: a creature made with no level of its own is at the arena\'s level (creatureLevel), every time', () => {
        const want = run('creatureLevel()');
        ok(lvAt(20).every(L => L === want), 'levels ' + lvAt(20) + ' (creatureLevel ' + want + ')');
    });
    check('its numbers are its level-5 numbers × its level', () => {
        const r = run(`(function(){ const p = spawnCreature({ species: 'ant', className: 'scout', x: __O.x, y: __O.y, level: 17 }); p.dead = true;
            return { lv: p.level, hp: p.maxHealth, pw: p.power, base: p.base }; })()`);
        same(r.lv, 17, 'the level it was given');
        same(r.hp, Math.round(r.base.hp * run(`levelFactor(${r.lv})`)), 'health');
        same(r.pw, Math.round(r.base.attack * run(`levelFactor(${r.lv})`)), 'power');
    });
    check('armour by class: a tank and a beetle have DEF; a scout has none', () => {
        const r = run(`(function(){ const mk = (sp, cl) => { const p = spawnCreature({ species: sp, className: cl, x: __O.x, y: __O.y }); p.dead = true; return p.def; };
            return { scout: mk('ant', 'scout'), tank: mk('ant', 'tank'), beetle: mk('beetle', 'scout') }; })()`);
        same(r.scout, 0, 'ant scout'); ok(r.tank > 0, 'ant tank DEF ' + r.tank); ok(r.beetle > 0, 'beetle DEF ' + r.beetle);
    });
    check('a creature can be set past the followers\' cap of 100 (the number shown is still its real level)', () => {
        const r = run(`(function(){ const p = spawnCreature({ species: 'ant', className: 'scout', x: __O.x, y: __O.y, level: 150 }); p.dead = true; return { lv: p.level, cap: LEVEL_CAP }; })()`);
        ok(r.lv === 150 && r.lv > r.cap, 'level ' + r.lv + ' against the followers\' cap of ' + r.cap);
    });

    console.log('\nDEFENSE (every unit now)');
    check('a level-5 follower against a level-5 bite: the same ×0.625 it always took', () => {
        const r = run(`(function(){ const f = ${FOL('', 2, 0)}; f.stats.defense = 10; const p = spawnCreature({ species: 'ant', className: 'scout', x: __O.x, y: __O.y }); p.level = 5; p.dead = true;
            return defenseMult(f, p); })()`);
        ok(near(r, 10 / 16), 'mult ' + r);
    });
    check('a higher-level attacker punches through more of it', () => {
        const r = run(`(function(){ const f = ${FOL('', 2, 0)}; f.stats.defense = 10; const a = { level: 5 }, b = { level: 40 }; return [defenseMult(f, a), defenseMult(f, b)]; })()`);
        ok(r[1] > r[0], 'level 40 ' + r[1] + ' vs level 5 ' + r[0]);
    });
    check('a creature\'s armour now cuts your damage too', () => {
        const r = run(`(function(){ const p = spawnCreature({ species: 'ant', className: 'tank', x: __O.x, y: __O.y }); p.dead = false; p.health = p.maxHealth = 1e6;
            const f = ${FOL('', 2, 0)}; const h0 = p.health; applyDamage(p, 100, f); const took = h0 - p.health; p.dead = true; return { took, mult: defenseMult(p, f) }; })()`);
        ok(r.mult < 1 && Math.abs(r.took - 100 * r.mult) < 1.5, JSON.stringify(r));
    });

    console.log('\nXP FROM KILLS');
    const KILL = (cls, setup) => run(`(function(){ actors = actors.filter(a => !(a instanceof Predator) && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k] = [];
        const killer = ${FOL('', 0, 0)}, ally = ${FOL('', 1, 1)}, far = ${FOL('', 15, 0)};
        const p = spawnCreature({ species: 'ant', className: '${cls}', x: __O.x + 0.5, y: __O.y + 0.5 }); p.update = () => {};
        p.lastAttacker = killer; ${setup || ''}
        const x0 = [killer.xp, ally.xp, far.xp]; p.health = 0; p.dead = true; render();
        return { worth: killXp(p), lv: p.level, k: killer.xp - x0[0], a: ally.xp - x0[1], f: far.xp - x0[2] }; })()`);
    check('THE ASK: the killer gets 60% and the ally fighting beside it 40%; one far away nothing (one outside the squad: a follower holding a room)', () => {
        const r = KILL('scout', 'far.post = "arena";');
        ok(near(r.k, r.worth * 0.6, 1e-6) && near(r.a, r.worth * 0.4, 1e-6) && r.f === 0, JSON.stringify(r));
        same(r.worth, Math.round(run('XP_YIELD.scout') * r.lv / 5), 'a scout is worth its yield × level / 5');
    });
    check('…alone, the killer gets it all', () => {
        const r = KILL('scout', 'ally.x = __O.x + 15; ally.post = "arena"; far.post = "arena";');
        ok(near(r.k, r.worth, 1e-6), JSON.stringify(r));
    });
    check('THE SQUAD SHARES (asked: "the experience is shared throughout the squad"): a kill by a member of the squad of three feeds the rest of it wherever they are: the killer 60%, the ally beside it and the one far away share the rest', () => {
        const r = KILL('scout');
        ok(near(r.k, r.worth * 0.6, 1e-6) && near(r.a, r.worth * 0.2, 1e-6) && near(r.f, r.worth * 0.2, 1e-6), JSON.stringify(r));
    });
    check('…a kill by you (your gun) feeds the whole squad wherever they are (half of it, shared); a follower outside the squad, far away, gets none of it', () => {
        const all = KILL('scout', 'p.lastAttacker = player;'), out = KILL('scout', 'p.lastAttacker = player; far.post = "arena";');
        ok(near(all.k, all.worth * 0.5 / 3, 1e-6) && near(all.a, all.worth * 0.5 / 3, 1e-6) && near(all.f, all.worth * 0.5 / 3, 1e-6), JSON.stringify(all));
        ok(out.f === 0 && near(out.k + out.a, out.worth * 0.5, 1e-6), JSON.stringify(out));
    });
    check('…a kill by a follower outside the squad (holding a room) is shared only with those near it, as before', () => {
        const r = KILL('scout', 'killer.post = "arena";');
        ok(near(r.k, r.worth * 0.6, 1e-6) && near(r.a, r.worth * 0.4, 1e-6) && r.f === 0, JSON.stringify(r));
    });
    check('…a kill with no unit\'s last blow (your gun, an effect) goes to the units near it (half of it)', () => {
        const r = KILL('scout', 'p.lastAttacker = { x: __O.x, y: __O.y - 2 };');
        ok(r.k > 0 && near(r.k + r.a, r.worth * 0.5, 1e-6), JSON.stringify(r));
    });
    check('stronger creatures are worth more', () => {
        ok(KILL('tank', 'p.level = 10;').worth > KILL('scout', 'p.level = 10;').worth, 'tank vs scout');
    });
    check('enough kills level a follower up, and it says so', () => {
        const r = run(`(function(){ const f = ${FOL('', 2, 0)}; const n0 = floatingTexts.length; gainXp(f, xpForLevel(6) - f.xp + 1);
            return { lv: f.level, said: floatingTexts.slice(n0).some(t => /LEVEL 6/.test(t.text)) }; })()`);
        ok(r.lv === 6 && r.said, JSON.stringify(r));
    });

    console.log('\nDYING');
    check('THE ASK: a follower that dies keeps its level but loses a quarter of its progress, and comes back with it', () => {
        const r = run(`(function(){ actors = actors.filter(a => !a.isFollower); followers.length = 0;
            const f = ${FOL('', 2, 0)}; gainXp(f, xpForLevel(12) - f.xp + 400); const lv = f.level, xp = f.xp, baseHp = f.base.hp;
            f.health = 0; f.dead = true;
            for (let i = 0; i < 400 && !followers.some(x => !x.dead); i++) { gameState.running = true; crystal.health = crystal.maxHealth; render(); }
            const g = followers.find(x => !x.dead);
            return g ? { lv, xp, lv2: g.level, xp2: g.xp, baseHp, baseHp2: g.base.hp } : null; })()`);
        ok(r, 'it never came back');
        same(r.lv2, r.lv, 'level after dying');
        same(r.xp2, Math.round(run(`xpForLevel(${r.lv})`) + (r.xp - run(`xpForLevel(${r.lv})`)) * 0.75), 'xp after dying');
        same(r.baseHp2, r.baseHp - 1, 'the HP stat still wears down by one');
    });

    console.log('\nXP PROGRESS (the bars and the cards: js/levels.js xpProgress, js/draw.js drawXpBar)');
    // ASKED: "they will not evolve. I need to see the progress. Add a progress experience bar or something so I know what's going on." A recruit needs 875 XP to reach level 10 and the XP was only a line on the INFO page.
    const XP = (lv, into, extra) => run(`(function(){ const f = ${FOL('', 2, 0)}; f.level = ${lv}; f.xp = xpForLevel(${lv}) + ${into}; ${extra || ''} const p = xpProgress(f); f.dead = true; return p; })()`);
    check('xpProgress: how far through its level a unit is (into of ask), what is left, and for a follower that has not evolved how far it is from evolving (the recruit level to level 10)', () => {
        const a = XP(5, 0), b = XP(7, 85), c = XP(9, 100);
        same(a.into, 0, 'a recruit has no XP in its level'); same(a.ask, 91, 'level 5 asks 216 - 125'); same(a.frac, 0, 'frac'); same(a.toNext, 91, 'to next'); same(a.evo.level, 10, 'it evolves at 10'); same(a.evo.levels, 5, 'five levels to go'); same(a.evo.toGo, 875, '1000 - 125'); same(a.evo.frac, 0, 'no way along'); same(a.evo.next, false, 'not on its next level');
        same(b.into, 85, 'level 7 with 85'); same(b.ask, 169, '512 - 343'); ok(near(b.frac, 85 / 169), 'frac'); same(b.toNext, 84, 'to next'); same(b.evo.levels, 3, 'three levels'); same(b.evo.toGo, 572, '1000 - 428'); ok(near(b.evo.frac, (428 - 125) / 875), 'along the way from level 5 to 10');
        same(c.evo.levels, 1, 'one level to go: the last before it evolves'); same(c.evo.toGo, 1000 - (729 + 100), '171');
    });
    check('…an evolved follower has no evolution to wait for; a follower re-rolled to another element evolves on its next level-up, whatever its level; the top level is a full bar; something with no level has nothing', () => {
        const ev = XP(12, 50, "f.evolved = 'seeper';"), rr = XP(25, 100, 'f._evoOnLevelUp = true;'), top = run(`(function(){ const f = ${FOL('', 2, 0)}; f.level = 100; f.xp = xpForLevel(100); const p = xpProgress(f); f.dead = true; return p; })()`);
        same(ev.evo, null, 'an evolved follower'); same(ev.into, 50, 'but it still levels'); same(rr.evo.next, true, 're-rolled: its next level'); same(rr.evo.level, 26, 'the next level'); same(rr.evo.levels, 1, 'one level'); same(rr.evo.toGo, rr.toNext, 'the XP it still needs for it'); ok(near(rr.evo.frac, rr.frac), 'the same bar as its level');
        same(top.max, true, 'the top level'); same(top.frac, 1, 'a full bar'); same(top.evo.toGo, 0, 'one that has not evolved by then is due now');
        same(run('xpProgress(null)'), null, 'nobody'); same(run('xpProgress({})'), null, 'no level'); same(run('xpProgress({ level: 5, xp: 125, isClone: true }).evo'), null, 'a clone does not evolve');
    });
    check('…the words the cards say: the XP in this level, and what evolving still takes', () => {
        const t = (lv, into, extra) => run(`(function(){ const f = ${FOL('', 2, 0)}; f.level = ${lv}; f.xp = xpForLevel(${lv}) + ${into}; ${extra || ''} const p = xpProgress(f); f.dead = true; return [xpText(p), xpEvoText(p)]; })()`);
        same(t(7, 85).join(' | '), '85 / 169 XP | EVOLVES AT LV 10 · 3 LEVELS · 572 XP TO GO', 'level 7'); same(t(9, 100).join(' | '), '100 / 271 XP | EVOLVES AT LV 10 · 1 LEVEL · 171 XP TO GO', 'level 9: one level');
        same(t(25, 100, 'f._evoOnLevelUp = true;')[1], 'EVOLVES ON ITS NEXT LEVEL · ' + (run('xpForLevel(26)') - run('xpForLevel(25)') - 100) + ' XP TO GO', 're-rolled'); same(t(12, 0, "f.evolved = 'seeper';")[1], '', 'evolved: nothing to say'); same(run('xpText(null) + xpEvoText(null)'), '', 'nobody');
    });
    check('the bar in the world: a slab under each follower\'s health bar (3 px), as long as its level is done, and a follower about to evolve breathes lighter; an empty one draws no fill', () => {
        const r = run(`(function(){ const ops = [], g = { fillStyle: '', beginPath() { ops.push(['b']); }, moveTo(x, y) { ops.push(['m', x, y]); }, lineTo(x, y) { ops.push(['l', x, y]); }, closePath() {}, fill() { ops.push(['f', this.fillStyle]); } };
            const mk = (lv, into) => { const f = ${FOL('', 2, 0)}; f.level = lv; f.xp = xpForLevel(lv) + into; f.dead = true; return f; }, out = {};
            drawXpBar(100, 50, 28, 3, mk(7, 84.5), g); out.half = ops.filter(o => o[0] === 'f').map(o => o[1]); out.edge = ops.filter(o => o[0] === 'l').map(o => o[1]).slice(-3);   // the fill's own top right corner is the third from the last point
            ops.length = 0; drawXpBar(100, 50, 28, 3, mk(7, 0), g); out.empty = ops.filter(o => o[0] === 'f').map(o => o[1]);
            ops.length = 0; frame = 0; drawXpBar(100, 50, 28, 3, mk(9, 100), g); out.soon0 = ops.filter(o => o[0] === 'f').map(o => o[1]); ops.length = 0; frame = 26; drawXpBar(100, 50, 28, 3, mk(9, 100), g); out.soon1 = ops.filter(o => o[0] === 'f').map(o => o[1]);
            ops.length = 0; drawXpBar(100, 50, 28, 3, null, g); out.nobody = ops.length; out.col = [XP_BAR_COL, XP_BAR_SOON]; return out; })()`);
        same(r.half.join(), '#05070f,' + r.col[0], 'the dark slab, then the fill'); ok(near(r.edge[0], 100 + 2 + 26 * 84.5 / 169, 1e-6), 'the fill\'s edge is half way (115): ' + r.edge); same(r.empty.join(), '#05070f', 'an empty bar has no fill'); same(r.nobody, 0, 'nobody: nothing');
        ok(new Set([r.soon0[1], r.soon1[1]]).size === 2 && [r.soon0[1], r.soon1[1]].includes(r.col[1]), 'a follower one level from evolving breathes: ' + r.soon0 + ' / ' + r.soon1);
    });
    check('…it is drawn over every follower that is on show, and over nothing else: not an enemy, not a clone, not an egg waiting on its pad', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); canvas.width = 1280; canvas.height = 860; const fs = [${FOL('', 3, 1)}, ${FOL('', 4, 1)}]; fs.forEach((f, i) => { f.x = player.x + 1 + i; f.y = player.y + 1; });
            const egg = ${FOL('', 5, 2)}; egg.fpSpot = true; egg.x = player.x + 2; egg.y = player.y - 1; const foe = spawnCreature({ species: 'ant', className: 'scout' }); foe.x = player.x - 1; foe.y = player.y - 1; foe.update = () => {};
            const seen = []; const was = drawXpBar; drawXpBar = (x, y, w, h, u) => seen.push(u); try { render(); } finally { drawXpBar = was; }
            const o = { mine: fs.every(f => seen.includes(f)), egg: seen.includes(egg), foe: seen.includes(foe), only: seen.every(u => u.isFollower && u.team === 'green') }; fs.forEach(f => f.dead = true); egg.dead = true; foe.dead = true; return o; })()`);
        same(r.mine, true, 'a follower has its bar'); same(r.egg, false, 'an egg on a pad has none'); same(r.foe, false, 'an enemy has none'); same(r.only, true, 'only followers');
    });

    console.log('\nCLONES');
    check('a clone comes out at the arena\'s level (creatureLevel), its species × the clone multipliers', () => {
        const r = run(`(function(){ const c = makeClone('ant', 'scout', __O.x, __O.y); c.dead = true;
            return { lv: c.level, hp: c.maxHealth, base: SPECIES.ant.scout.health * CLONE_HEALTH_MULT, k: levelFactor(c.level) }; })()`);
        same(r.lv, run('creatureLevel()'), 'level');
        same(r.hp, Math.round(r.base * r.k), 'health');
    });
    check('…it gains XP from its kills and levels up', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); const c = makeClone('ant', 'scout', __O.x, __O.y); c.update = () => {};
            const p = spawnCreature({ species: 'ant', className: 'scout', x: __O.x + 0.4, y: __O.y }); p.update = () => {}; p.lastAttacker = c;
            const x0 = c.xp; p.health = 0; p.dead = true; render();
            const l0 = c.level, hp0 = c.maxHealth;
            gainXp(c, xpForLevel(c.level + 3) - c.xp);
            return { gained: c.xp - x0 > 0, l0, l1: c.level, hp0, hp1: c.maxHealth }; })()`);
        ok(r.gained && r.l1 === r.l0 + 3 && r.hp1 > r.hp0, JSON.stringify(r));
    });
    check('a clone that dies now COMES BACK (it never did: it had no HP stat to read) — at its level', () => {
        const r = run(`(function(){ actors = actors.filter(a => !a.isClone); respawnQueue.length = 0; const c = makeClone('ant', 'scout', __O.x, __O.y);
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
        const r = run(`(function(){ const f = ${FOL('aggressive', 2, 0)}; const p = spawnCreature({ species: 'ant', className: 'scout', x: __O.x, y: __O.y }); p.dead = true;
            const c = makeClone('ant', 'scout', __O.x, __O.y); c.dead = true;
            const said = []; const keep = drawPlate; drawPlate = (t, col, x, y, chip) => { if (!chip) said.push(t); return true; };
            drawUnitTag(f, 0, 0, ctx); drawUnitTag(p, 0, 0, ctx); drawUnitTag(c, 0, 0, ctx); drawPlate = keep;
            return { said, p: p.level, el: p.element || null, c: c.level, role: f.role.toUpperCase() }; })()`);
        same(r.said[0], 'Lv 5 FIRE ' + r.role, 'follower');
        // A creature names its element when it has one (the arena's are made without one: js/clone.js spawnCreature).
        same(r.said[1], 'Lv ' + r.p + ' ' + (r.el ? r.el.toUpperCase() + ' ' : '') + 'ANT SCOUT', 'creature');
        same(r.said[2], 'Lv ' + r.c + ' ANT CLONE', 'clone');
    });
    check('it is drawn over every unit\'s health bar', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/draw.js'), 'utf8');
        ok((src.match(/drawUnitTag\(actor, px, py - /g) || []).length >= 2, 'not called from both health bars');
    });

    console.log('\nKEEPING IT (the facility\'s save, js/facilitysave.js)');
    {
        const store = {};
        const a = await boot(store);
        a(`(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; gainXp(f, xpForLevel(14) - f.xp + 50);
            const c = makeClone('beetle', 'scout', __O.x, __O.y); gainXp(c, xpForLevel(c.level + 4) - c.xp);
            globalThis.__want = { uid: f.uid, f: [f.level, f.xp], c: [c.level, c.xp] }; facilitySaveWrite(); })()`);
        const want = a('__want');
        const b = await boot(store);
        check('levels and XP survive a refresh — followers', () => {
            const got = b(`(function(){ const f = followers.find(x => x.uid === ${want.uid}); return f ? [f.level, f.xp] : null; })()`);
            same(JSON.stringify(got), JSON.stringify(want.f), 'follower');
        });
        check('levels and XP survive a refresh — clones', () => {
            const got = b(`(function(){ const c = actors.find(a => a.isClone && !a.dead); return c ? [c.level, c.xp] : null; })()`);
            same(JSON.stringify(got), JSON.stringify(want.c), 'clone');
        });
    }

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
