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
    check('THE ASK: a FLUX SNIPER reaching level 20 becomes the SERPENT (design No. 15)', () => {
        mk('flux', 'sniper', 20); run(lvlUp);
        const r = run('({ evo: __f.evolved, tag: unitTypeLabel(__f) })');
        same(r.evo, 'serpent', 'its form'); same(r.tag, 'SERPENT', 'its tag');
        mk('flux', 'brawler', 20); run(lvlUp); same(run('__f.evolved'), 'mimic', 'a flux brawler is the Rift Mimic');
        same(run('unitTypeLabel(__f)'), 'RIFT MIMIC', 'its tag'); same(run('__f.role'), 'brawler', 'its role');
        mk('flux', 'hybrid', 20); run(lvlUp); same(run('__f.evolved'), 'mimic', 'a hybrid fights as a brawler');
        mk('flux', 'camper', 20); run(lvlUp); same(run('__f.evolved || null'), null, 'a flux camper waits');
    });
    check('THE ASK: a CORE BRAWLER becomes the AEGIS WARDEN (design No. 57); an ELECTRIC BRAWLER the STORM MANTA (No. 68)', () => {
        mk('core', 'brawler', 20); run(lvlUp); same(run('__f.evolved'), 'warden', 'core brawler');
        mk('electric', 'brawler', 20); run(lvlUp); same(run('__f.evolved'), 'manta', 'electric brawler');
        same(run('unitTypeLabel(__f)'), 'STORM MANTA', 'its tag');
        mk('electric', 'sniper', 20); run(lvlUp); same(run('__f.evolved'), 'reaver', 'the electric sniper is still the Reaver');
    });
    check('THE ASK: a FLUX WORKER becomes the HOVER HAULER (design No. 58) — a worker is a duty, not a role', () => {
        mk('flux', 'brawler', 20); run('__f.duty = "worker";'); run(lvlUp); same(run('__f.evolved'), 'hauler', 'a flux brawler on worker duty');
        mk('flux', 'sniper', 20); run('__f.duty = "worker";'); run(lvlUp); same(run('__f.evolved'), 'hauler', 'a flux SNIPER on worker duty is a worker first');
        mk('flux', 'brawler', 20); run(lvlUp); same(run('__f.evolved'), 'mimic', 'a flux brawler on the line is the Rift Mimic');
        mk('core', 'brawler', 20); run('__f.duty = "worker";'); run(lvlUp); same(run('__f.evolved || null'), null, 'a core worker waits (no worker form for it)');
        mk('electric', 'brawler', 20); run('__f.duty = "worker";'); run(lvlUp); same(run('__f.evolved'), 'pod', 'an electric worker is the Dynamo Pod, not the Storm Manta');
        mk('flux', 'sniper', 20); run(lvlUp); same(run('__f.evolved'), 'serpent', 'a flux sniper on the line is the Serpent');
    });
    check('THE ASK: a FIRE SNIPER becomes the CINDER HALO (design No. 90, the ring drone); a fire brawler is still the Bunker Bloom', () => {
        mk('fire', 'sniper', 20); run(lvlUp);
        const r = run('({ evo: __f.evolved, tag: unitTypeLabel(__f), role: __f.role })');
        same(r.evo, 'halo', 'its form'); same(r.tag, 'CINDER HALO', 'its tag'); same(r.role, 'sniper', 'its role');
        mk('fire', 'brawler', 20); run(lvlUp); same(run('__f.evolved'), 'bloom', 'the fire brawler');
        mk('fire', 'sniper', 20); run('__f.duty = "worker";'); run(lvlUp); same(run('__f.evolved || null'), null, 'a fire worker waits (no worker form for it)');
    });
    check('THE ASK: a TOXIC SNIPER becomes the ROTSHARD (design No. 101, the crystal eaten by its pool); a toxic BRAWLER the CALDERA (No. 140); campers and workers wait', () => {
        mk('toxic', 'sniper', 20); run(lvlUp);
        const r = run('({ evo: __f.evolved, tag: unitTypeLabel(__f), role: __f.role })');
        same(r.evo, 'rotshard', 'its form'); same(r.tag, 'ROTSHARD', 'its tag'); same(r.role, 'sniper', 'its role');
        mk('toxic', 'brawler', 20); run(lvlUp); same(run('__f.evolved'), 'caldera', 'a toxic brawler is the Caldera');
        mk('toxic', 'camper', 20); run(lvlUp); same(run('__f.evolved || null'), null, 'a toxic camper waits');
        mk('toxic', 'sniper', 20); run('__f.duty = "worker";'); run(lvlUp); same(run('__f.evolved || null'), null, 'a toxic worker waits (no worker form for it)');
    });
    check('THE ASK: a CORE MAGE (the role id is still "sniper") becomes the PETAL AEGIS (design No. 120); a core brawler is still the Aegis Warden', () => {
        mk('core', 'sniper', 20); run(lvlUp);
        const r = run('({ evo: __f.evolved, tag: unitTypeLabel(__f), role: __f.role })');
        same(r.evo, 'petal', 'its form'); same(r.tag, 'PETAL AEGIS', 'its tag'); same(r.role, 'sniper', 'its role id');
        mk('core', 'brawler', 20); run(lvlUp); same(run('__f.evolved'), 'warden', 'the core brawler');
        mk('core', 'camper', 20); run(lvlUp); same(run('__f.evolved || null'), null, 'a core camper waits');
        mk('core', 'sniper', 20); run('__f.duty = "worker";'); run(lvlUp); same(run('__f.evolved || null'), null, 'a core worker waits (no worker form for it)');
    });
    check('THE ASK: the ranged role is called a MAGE on screen (its id stays "sniper")', () => {
        same(run('roleLabel("sniper")'), 'MAGE', 'sniper'); same(run('roleLabel("brawler")'), 'BRAWLER', 'brawler'); same(run('roleLabel("camper")'), 'CAMPER', 'camper'); same(run('roleLabel("hybrid")'), 'HYBRID', 'hybrid'); same(run('roleLabel(null)'), '', 'none');
        mk('flux', 'sniper', 5); same(run('unitTypeLabel(__f)'), 'FLUX MAGE', 'the tag over a unit');
        const UI = fs.readFileSync(path.join(ROOT, 'js/ui.js'), 'utf8');
        ok(/label:"MAGES"/.test(UI) && /label: "MAGES"/.test(UI) && !/SNIPERS/.test(UI), 'the index still says SNIPERS');
        ok(!/Snipers/.test(fs.readFileSync(path.join(ROOT, 'js/clone.js'), 'utf8')), 'the colony status still says Snipers');
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(!/<strong>Sniper<\/strong>/.test(HTML) && /<strong>Mage<\/strong>/.test(HTML), 'the codex still describes a Sniper');
    });
    check('…and nobody else: not an ice brawler, an electric brawler — nor before level 20', () => {
        for (const [el, role] of [['ice', 'brawler'], ['toxic', 'camper']]) { mk(el, role, 20); run(lvlUp); same(run('__f.evolved || null'), null, el + ' ' + role); }
        mk('fire', 'brawler', 19); run(lvlUp); same(run('__f.evolved || null'), null, 'a fire brawler at 19');
    });
    check('a follower already past level 20 (an old save) evolves on the next tick', () => {
        const r = run(`(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.role = 'brawler'; f.level = 34; f.xp = xpForLevel(34); _applyFollowerLevel(f, true);
            frame = Math.ceil((frame + 1) / 30) * 30; evolutionTick(); return f.evolved; })()`);
        same(r, 'bloom', 'its form');
    });

    console.log('\nWHAT IT GAINS');
    check('THE ASK: health and power × EVOLVE_MULT — and they survive the next level-up', () => {
        // The control is an ICE brawler, which has no form yet (a plain follower of the same stats); the twin is a fire brawler turned Bunker Bloom.
        const r = run(`(function(){ mkTwin = (ev) => { spawnFollowerAtCrystal(ev ? 'fire' : 'ice'); const f = followers[followers.length - 1]; f.role = 'brawler';
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
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
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
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { a: d(a), b: d(b), c: d(c), lone: d(lone), arcs: (f._arcPts || []).length };
            [a, b, c, lone, tooFar].forEach(p => p.dead = true); return out; })()`);
        ok(r.a > r.b && r.b > 0 && r.c > 0, 'the arc and its jumps: ' + JSON.stringify(r));
        same(r.lone, 0, 'damage to one out of reach of any jump');
        same(r.arcs, 3, 'arcs drawn');
    });

    check('THE ASK: HEXFIRE — the cinder halo fires six rounds at once, shared out among the nearest enemies, each setting its target burning', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('fire'); const f = followers[0]; f.role = 'sniper'; f.evolved = 'halo'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const fire = () => { frame++; f._sigCd = 1; evolutionTick(); };
            const a = mkP(24, 2), b = mkP(25, 3), c = mkP(26, 1), far = mkP(40, 2);
            fire();
            const d = p => 1e6 - p.health, shot = d(a) + d(b) + d(c), per = f.power * HALO_MULT;
            const out = { rounds: (f._arcPts || []).length, shot, per, a: d(a), b: d(b), c: d(c), far: d(far), burn: a.burning > 0 && b.burning > 0 && c.burning > 0, fan: f._arcFan, cd: f._sigCd };
            [a, b, c, far].forEach(p => p.dead = true);
            // Alone, all six go into the one.
            const solo = mkP(24, 2); fire(); out.solo = d(solo); solo.dead = true; return out; })()`);
        same(r.rounds, 6, 'six rounds');
        ok(Math.abs(r.shot - 6 * r.per) < 1e-6 * r.shot + 1e-3, 'six rounds of damage in all: ' + JSON.stringify(r));
        ok(r.a > 0 && r.b > 0 && r.c > 0 && r.burn, 'shared out among the three, burning: ' + JSON.stringify(r));
        same(r.far, 0, 'damage 20 tiles away'); ok(r.fan, 'the rounds do not fan from the ring'); ok(r.cd > 300, 'it did not wait');
        ok(Math.abs(r.solo - 6 * r.per) < 1e-3, 'alone, all six go into the one: ' + JSON.stringify(r));
    });

    check('THE ASK: CORRODE SHOT — one long shot that eats the nearest enemy\'s armour, with a weaker corrosion splashed over its neighbours', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('toxic'); const f = followers[0]; f.role = 'sniper'; f.evolved = 'rotshard'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP(24, 2), b = mkP(25, 2.8), far = mkP(40, 2), apart = mkP(24, 7);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { a: d(a), b: d(b), far: d(far), apart: d(apart), sa: [a.defenseShredded, a.defenseShredFactor], sb: [b.defenseShredded, b.defenseShredFactor], sfar: far.defenseShredded || 0, sapart: apart.defenseShredded || 0, cd: f._sigCd };
            [a, b, far, apart].forEach(p => p.dead = true); return out; })()`);
        ok(r.a > 0 && r.b === 0, 'one shot, into the nearest: ' + JSON.stringify(r));
        ok(r.sa[0] >= run('ROT_SHRED_FRAMES') && r.sa[1] <= run('ROT_SHRED'), 'the target\'s armour: ' + JSON.stringify(r));
        ok(r.sb[0] > 0 && r.sb[0] < r.sa[0] && r.sb[1] > r.sa[1] && r.sb[1] < 1, 'the neighbour\'s weaker corrosion: ' + JSON.stringify(r));
        same(r.sfar, 0, 'corroded out of range'); same(r.sapart, 0, 'corroded beyond the splash'); ok(r.cd > 300, 'it did not wait');
    });

    check('THE ASK: GRAVITY SLAM — it flattens and slams: hits, shoves and slows everything close; a beetle is too heavy to shove', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('flux'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'mimic'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const mkP = (sp, x, y) => { const S = SPECIES[sp], p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.speciesName = sp; p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP('ant', 21.2, 2), b = mkP('ant', 20, 3.4), beetle = mkP('beetle', 18.8, 2), far = mkP('ant', 25, 2);
            const a0 = Math.hypot(a.x - f.x, a.y - f.y), beetle0 = beetle.x;
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { a: d(a), b: d(b), beetle: d(beetle), far: d(far), pushed: Math.hypot(a.x - f.x, a.y - f.y) - a0, beetleMoved: beetle.x !== beetle0, slowed: a.slowed > 0 && b.slowed > 0, sf: a.slowFactor, farSlowed: far.slowed > 0, cd: f._sigCd };
            [a, b, beetle, far].forEach(p => p.dead = true); return out; })()`);
        ok(r.a > 0 && r.b > 0 && r.beetle > 0, 'the slam hit: ' + JSON.stringify(r));
        same(r.far, 0, 'damage outside the slam'); ok(!r.farSlowed, 'slowed outside the slam');
        ok(r.pushed > 0.3 && r.slowed && r.sf === run('MIMIC_SLOW') && r.sf < 1, 'shoved and slowed: ' + JSON.stringify(r)); ok(!r.beetleMoved, 'a beetle was shoved'); ok(r.cd > 300, 'it did not wait');
    });

    check('THE ASK: AEGIS BLOOM — a bolt into the nearest enemy, and a shield on the worst-hurt ally in reach', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('core'); const f = followers[0]; f.role = 'sniper'; f.evolved = 'petal'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2; f.health = f.maxHealth; f.shielded = false;
            const mkA = (x, y, frac) => { spawnFollowerAtCrystal('fire'); const a = followers[followers.length - 1]; a.returningToCrystal = false; a.x = x; a.y = y; a.health = Math.round(a.maxHealth * frac); a.shielded = false; a.shieldAmount = 0; return a; };
            const early = mkA(21.5, 3, 0.6), hurt = mkA(22, 2, 0.3), fine = mkA(21, 3.5, 0.9), late = mkA(22.5, 3, 0.45), far = mkA(34, 2, 0.1);   // the worst-hurt is neither first nor last
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP(24, 2), b = mkP(25, 2.5), tooFar = mkP(32, 2);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { a: d(a), b: d(b), tooFar: d(tooFar), hurt: hurt.shielded ? hurt.shieldAmount : 0, hurtMax: hurt.maxHealth, fine: !!fine.shielded, early: !!early.shielded, late: !!late.shielded, far: !!far.shielded, self: !!f.shielded, cd: f._sigCd, arcs: (f._arcPts || []).length };
            [a, b, tooFar].forEach(p => p.dead = true);
            // an enemy 8 tiles off is out of its reach: it does not cast at it
            const lone = mkP(28, 2); frame++; f._sigCd = 1; f._sigAt = undefined; evolutionTick(); out.loneHit = 1e6 - lone.health; out.loneCast = f._sigAt !== undefined; lone.dead = true; return out; })()`);
        ok(r.a > 0 && r.b === 0, 'one bolt, into the nearest: ' + JSON.stringify(r)); same(r.tooFar, 0, 'damage out of range');
        ok(r.hurt === Math.round(r.hurtMax * 0.35) && r.hurt > 0, 'the worst-hurt ally\'s shield (35% of its health): ' + JSON.stringify(r));
        same(r.loneHit, 0, 'a bolt at an enemy out of range'); ok(!r.loneCast, 'it cast at an enemy out of range');
        ok(!r.fine && !r.early && !r.late && !r.far && !r.self, 'only that one is shielded: ' + JSON.stringify(r)); ok(r.cd > 300, 'it did not wait'); same(r.arcs, 1, 'one bolt drawn');
    });

    check('THE ASK: ERUPTION — the crater bursts over everything close: toxic damage and eaten armour', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('toxic'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'caldera'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP(21.2, 2), b = mkP(20, 3.5), far = mkP(24, 2);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { a: d(a), b: d(b), far: d(far), sa: [a.defenseShredded, a.defenseShredFactor], sb: [b.defenseShredded, b.defenseShredFactor], sfar: far.defenseShredded || 0, cd: f._sigCd };
            [a, b, far].forEach(p => p.dead = true);
            const lone = mkP(24, 2); frame++; f._sigCd = 1; f._sigAt = undefined; evolutionTick(); out.loneCast = f._sigAt !== undefined; lone.dead = true; return out; })()`);
        ok(r.a > 0 && r.b > 0 && r.a === r.b, 'both in the blast take the same: ' + JSON.stringify(r)); same(r.far, 0, 'damage outside the blast');
        ok(r.sa[0] >= run('CALDERA_SHRED_FRAMES') && r.sa[1] === 0.5 && r.sb[1] === 0.5, 'armour eaten (it takes double): ' + JSON.stringify(r));
        same(r.sfar, 0, 'armour eaten outside the blast'); ok(r.cd > 300, 'it did not wait'); ok(!r.loneCast, 'it erupted with nothing in reach');
    });

    check('THE ASK: SINGULARITY SHOT — a gravity round into the nearest enemy, dragging those round it in; a beetle is too heavy', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator));
            spawnFollowerAtCrystal('flux'); const f = followers[followers.length - 1]; f.role = 'sniper'; f.evolved = 'serpent'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const mkP = (sp, x, y) => { const S = SPECIES[sp], p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.speciesName = sp; p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const tgt = mkP('ant', 25, 2), mate = mkP('ant', 26.5, 2.5), beetle = mkP('beetle', 25.5, 1.2), apart = mkP('ant', 29, 2), tooFar = mkP('ant', 40, 2);
            const m0 = Math.hypot(mate.x - tgt.x, mate.y - tgt.y), b0 = Math.hypot(beetle.x - tgt.x, beetle.y - tgt.y);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { tgt: d(tgt), mate: d(mate), mateIn: m0 - Math.hypot(mate.x - tgt.x, mate.y - tgt.y), beetleIn: b0 - Math.hypot(beetle.x - tgt.x, beetle.y - tgt.y),
                slowed: mate.slowed > 0, apartMoved: apart.x !== 29, cd: f._sigCd };
            [tgt, mate, beetle, apart, tooFar].forEach(p => p.dead = true); return out; })()`);
        ok(r.tgt > 0, 'no hit on the target: ' + JSON.stringify(r));
        ok(r.mateIn > 0.5 && r.slowed, 'the one beside it was not dragged in and slowed: ' + JSON.stringify(r));
        same(r.beetleIn, 0, 'a beetle was dragged');
        ok(!r.apartMoved, 'one out of the pull\'s reach was moved');
        ok(r.cd > 300, 'it did not wait: ' + r.cd);
    });

    check('THE ASK: AEGIS BURST — a blast that hits and shoves enemies back, and shields it and the allies round it', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('core'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'warden'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            spawnFollowerAtCrystal('fire'); const al = followers[1]; al.returningToCrystal = false; al.x = 21.5; al.y = 2; al.shielded = false; al.shieldAmount = 0;
            spawnFollowerAtCrystal('fire'); const far = followers[2]; far.returningToCrystal = false; far.x = 30; far.y = 2; far.shielded = false;
            const S = SPECIES.ant, mkP = (x) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, 2); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const near = mkP(21.2), outside = mkP(25);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const out = { hit: 1e6 - near.health, pushed: near.x - 21.2, outside: 1e6 - outside.health, allyShield: al.shielded ? al.shieldAmount : 0, ownShield: f.shielded ? f.shieldAmount : 0, farShield: !!far.shielded, allyMax: al.maxHealth };
            near.dead = outside.dead = true; return out; })()`);
        ok(r.hit > 0 && r.pushed > 0.3, 'the blast: ' + JSON.stringify(r));
        same(r.outside, 0, 'damage to one outside the blast');
        ok(r.allyShield > 0 && r.ownShield > 0 && !r.farShield, 'the shields: ' + JSON.stringify(r));
    });
    check('THE ASK: STATIC RUSH — it dashes to the nearest enemy, hits it, shocks two more, and stuns them all', () => {
        const r = run(`(function(){ actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0;
            spawnFollowerAtCrystal('electric'); const f = followers[0]; f.role = 'brawler'; f.evolved = 'manta'; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.x = 20; f.y = 2;
            const S = SPECIES.ant, mkP = (x, y) => { const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
            const a = mkP(23, 2), b = mkP(24.5, 2.4), c = mkP(25.8, 1.6), far = mkP(24, 8);
            frame++; f._sigCd = 1; evolutionTick();   // a new frame: the unit index is rebuilt per frame
            const d = p => 1e6 - p.health, out = { dist: Math.hypot(a.x - f.x, a.y - f.y), a: d(a), b: d(b), c: d(c), far: d(far), stun: [a, b, c].every(p => p.hitStun >= MANTA_STUN), cd: f._sigCd };
            [a, b, c, far].forEach(p => p.dead = true); return out; })()`);
        ok(r.dist < 1 && r.a > r.b && r.b > 0 && r.c > 0, 'the dash and the shocks: ' + JSON.stringify(r));
        same(r.far, 0, 'damage to one out of reach'); ok(r.stun, 'not all stunned'); ok(r.cd > 250, 'it did not wait');
    });
    check('THE ASK: HEAVY HAUL — the hover hauler pays double shards, hauls faster and reaches further than a plain flux worker', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower);
            const mk = (evo) => { spawnFollowerAtCrystal('flux'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.duty = 'worker'; if (evo) f.evolved = 'hauler'; return f; };
            const plain = mk(false), hv = mk(true), pay = (c) => { const before = shardCount; chargedMass.push({ x: crystal.x, y: crystal.y, state: MASS_STATE.CARRIED, carrier: c, value: 10, bob: 0, spin: 0, progress: 1 });
                c.x = crystal.x; c.y = crystal.y; updateChargedMass(); return shardCount - before; };
            const out = { plain: pay(plain), hv: pay(hv), h: evoHaul(hv), none: evoHaul(plain) }; return out; })()`);
        same(r.plain, 10, 'a plain flux worker\'s delivery'); same(r.hv, 10 * run('HAULER_PAY'), 'the hauler\'s delivery');
        ok(r.h.speed > 1 && r.h.reach > 1 && r.none === null, JSON.stringify(r));
        const src = fs.readFileSync(path.join(ROOT, 'js/mass.js'), 'utf8');
        ok(/evoHaul\(actor\)/.test(src) && /_hv\.speed/.test(src) && /_hv2\.reach/.test(src), 'the haul loop does not ask for the hauler\'s speed and reach');
    });
    check('THE ASK: RAPID DISCHARGE — the dynamo pod (electric worker, design No. 71) neutralises faster and from further away', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower); chargedMass.length = 0; player.x = 5;
            const mk = (evo, x) => { spawnFollowerAtCrystal('electric'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.duty = 'worker'; f.job = null; f.stance = 'follow'; f.x = x; f.y = 2; f.moveSpeed = 0.05; if (evo) f.evolved = 'pod'; return f; };
            const lump = (x) => { const m = { x, y: 2, state: MASS_STATE.CHARGED, progress: 0, carrier: null, value: 10, bob: 0, spin: 0 }; chargedMass.push(m); return m; };
            // The same lump, 1.2 tiles from each: the pod is already in reach, the plain worker has to walk.
            const a = mk(false, 30), b = mk(true, 60), ma = lump(31.2), mb = lump(61.2);
            followerWorkTick(a); followerWorkTick(b);
            const out = { plainWorking: ma.progress > 0, podWorking: mb.progress > 0 };
            // In reach, per step: the pod's progress against a plain worker's.
            const c = mk(false, 90), d = mk(true, 120), mc = lump(90.3), md = lump(120.3);
            for (let i = 0; i < 10; i++) { followerWorkTick(c); followerWorkTick(d); }
            out.plainStep = mc.progress / 10; out.podStep = md.progress / 10; out.n = evoNeutralise(d); out.none = evoNeutralise(c); return out; })()`);
        ok(!r.plainWorking && r.podWorking, 'reach: ' + JSON.stringify(r));
        ok(run('POD_RATE') >= 2 && Math.abs(r.podStep / r.plainStep - run('POD_RATE')) < 0.05, 'rate (a real boost, and what it does): ' + JSON.stringify(r));
        ok(r.n && r.n.reach > 1 && r.n.speed > 1 && r.none === null, JSON.stringify(r));
        const src = fs.readFileSync(path.join(ROOT, 'js/mass.js'), 'utf8');
        ok(/evoNeutralise\(actor\)/.test(src) && /_nv\.rate/.test(src) && /_nv\.reach/.test(src), 'the neutralise loop does not ask for the pod\'s rate and reach');
    });
    check('the hover hauler stays one across death (its element and duty too) and a reload', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower); respawnQueue.length = 0; activeCrystalModulation = { pair: ['ice'] };
            spawnFollowerAtCrystal('flux'); const f = followers[0]; f.role = 'brawler'; f.duty = 'worker'; f.level = 22; f.xp = xpForLevel(22); _applyFollowerLevel(f, true); evoCheck(f);
            const snap = followerRosterSnapshot()[0]; f.health = 0; f.dead = true;
            for (let i = 0; i < 400 && !followers.some(x => !x.dead); i++) render();
            const g = followers.find(x => !x.dead); activeCrystalModulation = null;
            followers.length = 0; actors = actors.filter(a => !a.isFollower); spawnFollowerFromSave(snap); const h = followers[0];
            return { saved: snap.evolved, evo: g && g.evolved, el: g && g.element, duty: g && g.duty, loaded: h.evolved, loadedDuty: h.duty }; })()`);
        same(r.saved, 'hauler', 'in the save'); same(r.evo, 'hauler', 'after respawn'); same(r.el, 'flux', 'its element (the Crystal was set to ice)');
        same(r.duty, 'worker', 'its duty'); same(r.loaded, 'hauler', 'after loading'); same(r.loadedDuty, 'worker', 'its duty after loading');
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
    check('its role is put back if anything changes it — except the hover hauler, which has none', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower);
            spawnFollowerAtCrystal('core'); const w = followers[0]; w.role = 'brawler'; w.evolved = 'warden'; w._moltAt = -1e9; w.role = 'camper';
            spawnFollowerAtCrystal('flux'); const h = followers[1]; h.role = 'sniper'; h.duty = 'worker'; h.evolved = 'hauler'; h._moltAt = -1e9;
            frame++; evolutionTick(); return { w: w.role, h: h.role }; })()`);
        same(r.w, 'brawler', 'the warden put back to its role'); same(r.h, 'sniper', 'the hauler\'s role left alone');
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
        for (const id of ['bloom', 'reaver', 'serpent', 'warden', 'hauler', 'manta', 'pod', 'halo', 'rotshard', 'mimic', 'petal', 'caldera']) {
            const b = fs.readFileSync(path.join(ROOT, 'img/evo', id + '.png'));
            same(b.readUInt32BE(16) + 'x' + b.readUInt32BE(20), '2304x1152', id + ' size');
        }
        ok(/js\/evolution\.js/.test(fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8')), 'not loaded by the game');
    });
    check('the pools of material are on a sheet of their own (rotshard, mimic), the same size as the body sheet', () => {
        for (const id of ['rotshard', 'mimic']) {
            const b = fs.readFileSync(path.join(ROOT, 'img/evo', id + '_g.png'));
            same(b.readUInt32BE(16) + 'x' + b.readUInt32BE(20), '2304x1152', id + ' ground sheet size');
            same(run('EVOLUTIONS.' + id + '.ground'), 'img/evo/' + id + '_g.png', id + ' ground path');
        }
        for (const id of ['bloom', 'reaver', 'serpent', 'warden', 'hauler', 'manta', 'pod', 'halo', 'petal', 'caldera']) same(run('EVOLUTIONS.' + id + '.ground || null'), null, id + ' has no pool');
    });
    check('THE ASK: a pool lies on the FLOOR — painted by each floor tile, clipped to it, under whatever stands there — not drawn with the unit', () => {
        const r = run(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower);
            const fake = { complete: true, naturalWidth: 2304 };
            EVOLUTIONS.rotshard._img = fake; EVOLUTIONS.rotshard._gimg = fake; EVOLUTIONS.mimic._img = fake; EVOLUTIONS.mimic._gimg = fake;
            canvas.width = 800; canvas.height = 600; player.visualX = 20; player.visualY = 2;
            const mk = (el, role, evo, x, y) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.evolved = evo; f._moltAt = -1e9; f.x = x; f.y = y; return f; };
            const a = mk('toxic', 'sniper', 'rotshard', 20.5, 2.5), b = mk('flux', 'brawler', 'mimic', 22.5, 2.5), egg = mk('fire', 'brawler', null, 20.5, 2.5);
            const rec = () => { const c = { draws: 0, clips: 0, ellipses: 0, globalAlpha: 1 }; for (const m of ['save', 'restore', 'beginPath', 'moveTo', 'lineTo', 'closePath', 'fill', 'stroke', 'fillRect', 'arc', 'addColorStop']) c[m] = () => {};
                c.clip = () => { c.clips++; }; c.drawImage = () => { c.draws++; }; c.ellipse = () => { c.ellipses++; }; c.createRadialGradient = () => ({ addColorStop() {} }); return c; };
            evoGroundBegin();
            const onTile = (tx, ty) => { const g = rec(); drawEvoGroundOnTile(tx, ty, (tx - 20 - (ty - 2)) * TILE_W + 400, (tx - 20 + (ty - 2)) * TILE_H + 300, g); return g; };
            const out = { own: onTile(20, 2), front: onTile(19, 1), far: onTile(20, 8), other: onTile(22, 2), list: _evoGround.length };
            const body = rec(); drawEvolvedFollower(a, 300, 300, body); out.body = body;
            frame = frame + 1; a._moltAt = frame - 5; evoGroundBegin(); out.molting = _evoGround.length;   // still the egg: no pool yet
            return out; })()`);
        same(r.list, 2, 'two pools to paint (the egg has none)');
        ok(r.own.draws === 1 && r.own.clips === 1, 'its own tile paints its pool, clipped: ' + JSON.stringify(r.own));
        ok(r.front.draws === 1 && r.front.clips === 1, 'a neighbouring tile paints its share too: ' + JSON.stringify(r.front));
        same(r.far.draws, 0, 'a tile far from every pool paints none');
        ok(r.other.draws === 1, 'the other pool (the mimic\'s) is painted on its own tile: ' + JSON.stringify(r.other));
        ok(r.body.draws === 1 && r.body.ellipses === 0, 'the body is drawn with no pool in it and no shadow: ' + JSON.stringify(r.body));
        same(r.molting, 1, 'a molting follower paints no pool until it is out of the egg');
        const GAME = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
        ok(/_drawFloorTile\(ctx, px, py[^\n]*\n\s*if \(typeof drawEvoGroundOnTile === "function"\) drawEvoGroundOnTile\(obj\.x, obj\.y, px, py\)/.test(GAME), 'the floor tile does not paint the pools');
        ok(/drawCablesOnTile\(obj, px, py\); if \(typeof drawEvoGroundOnTile === "function"\) drawEvoGroundOnTile/.test(GAME), 'the camp floor does not paint the pools');
        ok(GAME.indexOf('evoGroundBegin()') > 0 && GAME.indexOf('evoGroundBegin()') < GAME.indexOf('drawList.forEach(obj=>{'), 'the ground list is not built before the world is drawn');
    });
    check('THE ASK: a bundle of followers stands a little further apart (FOLLOWER_SEP), so every unit shows', () => {
        ok(run('FOLLOWER_SEP') >= 0.7 && run('FOLLOWER_SEP') <= 1.0, 'FOLLOWER_SEP = ' + run('FOLLOWER_SEP'));
        const GAME = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
        ok(/FOLLOWER SEPARATION[\s\S]{0,1800}_SEP2 = FOLLOWER_SEP \* FOLLOWER_SEP[\s\S]{0,900}FOLLOWER_SEP - _d/.test(GAME), 'the separation pass does not use it');
        ok(!/>= 0\.55\) break|0\.3025/.test(GAME), 'a hard-coded 0.55 is left in the separation pass');
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
