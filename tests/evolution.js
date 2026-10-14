// EVOLUTION (js/evolution.js) — the fire brawler molts into the BUNKER BLOOM,
// the electric sniper into the REAVER.
//
// THE REPORTED CASE: "Make the Bunker Bloom an evolution of the fire brawler
// and the Reaver an evolution of the electric sniper." Asked: automatically at
// a level; a stat boost and a signature move.
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

(async () => {
    const sb = makeBrowserSandbox({});
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) {}
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id)); ensureWorldTo(4 * ZONE_LENGTH);`);

    // A follower of this element and role, one XP short of `lv`.
    const mk = (el, role, lv) => run(`(function(){
        spawnFollowerAtCrystal('${el}'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = '${role}';
        f.level = ${lv} - 1; f.xp = xpForLevel(${lv}) - 1; _applyFollowerLevel(f, true); globalThis.__f = f; return followers.length - 1; })()`);
    const lvlUp = `gainXp(__f, 5);`;

    console.log('\nWHO EVOLVES, AND WHEN');
    check('THE ASK: a FIRE BRAWLER reaching level 20 becomes the BUNKER BLOOM, there and then', () => {
        mk('fire', 'brawler', 20);
        const r = run(`(function(){ const before = !!__f.evolved; ${lvlUp} return { before, evo: __f.evolved, lv: __f.level, molt: __f._moltAt === frame, tag: unitTypeLabel(__f) }; })()`);
        ok(!r.before, 'evolved before level 20');
        same(r.evo, 'bloom', 'its form'); same(r.lv, 20, 'level'); ok(r.molt, 'no molt started');
        same(r.tag, 'BUNKER BLOOM', 'its tag');
    });
    check('THE ASK: an ELECTRIC SNIPER reaching level 20 becomes the REAVER', () => {
        mk('electric', 'sniper', 20); run(lvlUp);
        same(run('__f.evolved'), 'reaver', 'its form');
    });
    check('…and nobody else: not a fire sniper, an ice brawler, an electric brawler — nor before level 20', () => {
        for (const [el, role] of [['fire', 'sniper'], ['ice', 'brawler'], ['electric', 'brawler'], ['toxic', 'camper']]) { mk(el, role, 20); run(lvlUp); same(run('__f.evolved || null'), null, el + ' ' + role); }
        mk('fire', 'brawler', 19); run(lvlUp); same(run('__f.evolved || null'), null, 'a fire brawler at 19');
    });
    check('a follower already past level 20 (an old save) evolves on the next tick', () => {
        const r = run(`(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.role = 'brawler'; f.level = 34; f.xp = xpForLevel(34); _applyFollowerLevel(f, true);
            frame = Math.ceil((frame + 1) / 30) * 30; evolutionTick(); return f.evolved; })()`);
        same(r, 'bloom', 'its form');
    });

    console.log('\nWHAT IT GAINS');
    check('THE ASK: health and power × EVOLVE_MULT — and they survive the next level-up', () => {
        // The twin is a fire SNIPER, which never evolves; stats come from base and level only.
        const r = run(`(function(){ mkTwin = (ev) => { spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.role = ev ? 'brawler' : 'sniper';
                f.base = { hp: 40, attack: 12, defense: 10, specialAttack: 10, accuracy: 10, will: 20, speed: 10 }; f.level = 22; f.xp = xpForLevel(22); if (ev) f.evolved = 'bloom'; _applyFollowerLevel(f, true); return f; };
            const a = mkTwin(false), b = mkTwin(true); b._moltAt = -1e9;
            const r1 = { hp: b.maxHealth / a.maxHealth, pw: b.power / a.power };
            a.xp = xpForLevel(23); b.xp = xpForLevel(23); gainXp(a, 1); gainXp(b, 1);
            return { r1, r2: { hp: b.maxHealth / a.maxHealth, pw: b.power / a.power, lv: [a.level, b.level] } }; })()`);
        const M = run('EVOLVE_MULT');
        ok(Math.abs(r.r1.hp - M) < 0.05 && Math.abs(r.r1.pw - M) < 0.1, 'at evolving: ' + JSON.stringify(r.r1));
        ok(Math.abs(r.r2.hp - M) < 0.05 && Math.abs(r.r2.pw - M) < 0.1 && r.r2.lv[1] === 23, 'after a level-up: ' + JSON.stringify(r.r2));
    });
    check('THE ASK: PETAL BLAZE — a ring of fire that hits and burns everything close, then waits', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator));
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.role = 'brawler'; f.evolved = 'bloom'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, 2); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const near = mkP(21), far = mkP(24);
            f._sigCd = 1; evolutionTick();
            const out = { near: 1e6 - near.health, burn: near.burning > 0, far: 1e6 - far.health, cd: f._sigCd };
            near.health = 1e6; evolutionTick(); out.again = 1e6 - near.health;
            near.dead = far.dead = true; return out; })()`);
        ok(r.near > 0 && r.burn, 'the close one: ' + JSON.stringify(r));
        same(r.far, 0, 'damage 4 tiles away');
        ok(r.cd > 300 && r.again === 0, 'it fired again at once: ' + JSON.stringify(r));
    });
    check('THE ASK: ARC VOLLEY — a charged arc into the nearest enemy in range, jumping to the ones beside it', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator));
            spawnFollowerAtCrystal('electric'); const f = followers[followers.length - 1]; f.role = 'sniper'; f.evolved = 'reaver'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP(24, 2), b = mkP(25.5, 2.5), c = mkP(26.8, 1.5), lone = mkP(32, 2), tooFar = mkP(20, 40);
            f._sigCd = 1; evolutionTick();
            const d = p => 1e6 - p.health, out = { a: d(a), b: d(b), c: d(c), lone: d(lone), arcs: (f._arcPts || []).length };
            [a, b, c, lone, tooFar].forEach(p => p.dead = true); return out; })()`);
        ok(r.a > r.b && r.b > 0 && r.c > 0, 'the arc and its jumps: ' + JSON.stringify(r));
        same(r.lone, 0, 'damage to one out of reach of any jump');
        same(r.arcs, 3, 'arcs drawn');
    });

    console.log('\nIT STAYS EVOLVED');
    check('its role is fixed: a role switch skips it', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower);
            spawnFollowerAtCrystal('electric'); const e = followers[0]; e.role = 'sniper'; e.evolved = 'reaver';
            spawnFollowerAtCrystal('fire'); const p = followers[1]; p.role = 'brawler';
            selectedRole = null; squadMode = 'all'; commandTarget = { x: 5, y: 2 }; selectedRadialAction = 'switch_context'; executeCommand();
            return { e: e.role, p: p.role }; })()`);
        same(r.e, 'sniper', 'the evolved one'); same(r.p, 'sniper', 'the other one (brawler → sniper)');
    });
    check('it is saved, and loads back evolved with its boosted stats', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower); respawnQueue.length = 0;
            spawnFollowerAtCrystal('fire'); const f = followers[0]; f.role = 'brawler'; f.level = 25; f.xp = xpForLevel(25); _applyFollowerLevel(f, true); evoCheck(f);
            const snap = followerRosterSnapshot(); const hp = f.maxHealth;
            followers.length = 0; actors = actors.filter(a => !a.isFollower);
            spawnFollowerFromSave(snap[0]); const g = followers[0];
            return { saved: snap[0].evolved, evo: g.evolved, hp: g.maxHealth, was: hp }; })()`);
        same(r.saved, 'bloom', 'in the save'); same(r.evo, 'bloom', 'after loading'); same(r.hp, r.was, 'its health after loading');
    });
    check('it comes back from the dead as the same machine — its element and role too', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower); respawnQueue.length = 0;
            activeCrystalModulation = { pair: ['ice'] };
            spawnFollowerAtCrystal('electric'); const f = followers[0]; f.role = 'sniper'; f.level = 21; f.xp = xpForLevel(21); _applyFollowerLevel(f, true); evoCheck(f);
            f.health = 0; f.dead = true;
            for (let i = 0; i < 400 && !followers.some(x => !x.dead); i++) render();
            const g = followers.find(x => !x.dead); activeCrystalModulation = null;
            return g ? { evo: g.evolved, el: g.element, role: g.role } : null; })()`);
        ok(r, 'it never respawned');
        same(r.evo, 'reaver', 'its form'); same(r.el, 'electric', 'its element (the Crystal was set to ice)'); same(r.role, 'sniper', 'its role');
    });

    console.log('\nTHE LOOK');
    check('the sheets are in the build, 8 facings × 16 frames of 144 px', () => {
        for (const id of ['bloom', 'reaver']) {
            const b = fs.readFileSync(path.join(ROOT, 'img/evo', id + '.png'));
            same(b.readUInt32BE(16) + 'x' + b.readUInt32BE(20), '2304x1152', id + ' size');
        }
        ok(/js\/evolution\.js/.test(fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8')), 'not loaded by the game');
    });
    check('it is drawn in place of the egg (and the egg is drawn until the sheet has loaded)', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/draw.js'), 'utf8');
        ok(/drawEvolvedFollower\(actor, px, py, drawCtx\)\) \{\}\s*else if \(_figOpts\)/.test(src), 'the follower body does not hand an evolved one over');
        const r = run(`(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.evolved = 'bloom'; f._moltAt = -1e9;
            const drew = drawEvolvedFollower(f, 300, 300, ctx); drawNPC(f, 300, 300, ctx); f._moltAt = frame - 60; drawNPC(f, 300, 300, ctx); return drew; })()`);
        same(r, false, 'drawn with no sheet loaded');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
