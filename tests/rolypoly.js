// THE ROLY-POLY, the electric breed's species (docs/ELECTRIC-BREED.md; js/rolypoly.js, js/species.js, js/damage.js).
// ASKED (the owner, 2026-11-13): "immune to crushing, immune to slashing, and resistant to piercing. That will be electric type and will inhabit the electric domain";
// "Clone potential"; "Physical half does 0"; "Curls up to defend"; then "Build it" on the agent's proposals (a beetle's health, speed and size and an ant's bite; a
// Crushing bite; the curl: under half its health, 4 s, ×0.3, 12 s apart, not stunned or asleep; weak to Earthquake and Projectile; baked sprites).
//   THE TABLES     its species block, clone cost, race row and bite
//   THE IMMUNITY   a Crushing or Slashing hit's physical part does 0 (a word says so); its elemental part lands; the player's lash and gauntlet do nothing; Piercing ×0.7
//   THE CURL       when, how long, what it takes while curled, the rest after, never stunned or asleep; through applyDamage; a curled one neither moves nor bites
//   ITS LOOK       the baked sheet's cells; the cell for a heading, a walk frame, the wheel; drawBug3D hands it over
//   WHERE IT LIVES the electrical domain only; its clone
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
function near(a, b, m, eps) { if (!(Math.abs(a - b) <= (eps || 1e-6))) throw new Error(`${m}: expected ${b}, got ${a}`); }
function sameJSON(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    // a roly-poly of a class, alone and far from everything
    run(`globalThis.__rp = (cls, o) => { const S = SPECIES.rolypoly; const p = new Predator(cls || 'scout', Object.assign({}, S[cls || 'scout'], { color: S.color }), 5, 5); p.speciesName = 'rolypoly'; p.element = 'electric'; p.team = 'red'; return Object.assign(p, o || {}); };
         globalThis.__noWords = () => { floatingTexts.length = 0; };
         globalThis.__words = () => floatingTexts.map(t => t.text);`);

    group('THE TABLES (js/species.js, js/damage.js)');
    check('a scout, a striker and a tank with a beetle\'s health, speed and size and an ant\'s bite; always electric; its own place (the electrical domain); a beetle\'s clone cost', () => {
        const r = J(`(function(){ const R = SPECIES.rolypoly, B = SPECIES.beetle, A = SPECIES.ant, o = { classes: ['scout', 'striker', 'tank'].map(c => !!R[c]), extra: ['nymph', 'worker', 'boss'].filter(c => R[c]), el: R.element, only: R.only, same: true };
            for (const c of ['scout', 'striker', 'tank']) { const x = R[c]; if (x.health !== B[c].health || x.moveSpeed !== B[c].moveSpeed || x.width !== B[c].width || x.height !== B[c].height || x.power !== A[c].power) o.same = false; }
            o.cost = CLONE_COSTS.rolypoly; o.beetle = CLONE_COSTS.beetle; return o; })()`);
        sameJSON(r.classes, [true, true, true], 'its three classes'); sameJSON(r.extra, [], 'no nymph, worker or boss of its own');
        ok(r.el === 'electric', 'electric'); ok(r.only === 'electrical', 'the electrical domain\'s'); ok(r.same, 'a beetle\'s health, speed and size, an ant\'s power'); sameJSON(r.cost, r.beetle, 'a beetle\'s clone cost');
    });
    check('its row: IMMUNE to Crushing and Slashing, resists Piercing, weak to Earthquake and Projectile; it bites with Crushing', () => {
        const r = J(`({ row: DMG_RACE.rolypoly, bite: DMG_RACE_BITE.rolypoly, m: ['slashing', 'piercing', 'projectile', 'crushing', 'earthquake', 'elemental'].map(t => dmgRowMult(DMG_RACE.rolypoly, t)) })`);
        sameJSON(r.row.immune, ['crushing', 'slashing'], 'immune'); sameJSON(r.row.resist, ['piercing'], 'resists'); sameJSON(r.row.weak, ['earthquake', 'projectile'], 'weak');
        sameJSON(r.m, [0, 0.7, 1.3, 0, 1.3, 1], 'slashing 0, piercing 0.7, projectile 1.3, crushing 0, earthquake 1.3, elemental 1'); ok(r.bite === 'crushing', 'a Crushing bite');
    });
    check('no other race is immune to anything (the new list is the roly-poly\'s)', () => {
        const r = J(`Object.keys(DMG_RACE).filter(k => k !== 'rolypoly' && DMG_RACE[k].immune)`); sameJSON(r, [], 'others with an immune list');
    });

    group('THE IMMUNITY (js/damage.js dmgApply; the owner: "Physical half does 0")');
    check('an enemy-style Slashing or Crushing hit with no element does 0, with SLASHING IMMUNE / CRUSHING IMMUNE beside it; Piercing lands ×0.7, Earthquake and Projectile ×1.3', () => {
        const r = J(`(function(){ const t = __rp('tank'), o = {}; for (const ty of ['slashing', 'crushing', 'piercing', 'earthquake', 'projectile']) { __noWords(); t._dmgWordAt = undefined; o[ty] = { v: dmgApply(t, 100, null, null, DMG_HIT_ENEMY[ty]), w: __words() }; } return o; })()`);
        near(r.slashing.v, 0, 'slashing'); near(r.crushing.v, 0, 'crushing'); near(r.piercing.v, 70, 'piercing'); near(r.earthquake.v, 130, 'earthquake'); near(r.projectile.v, 130, 'projectile');
        ok(r.slashing.w.indexOf('SLASHING IMMUNE') >= 0, 'SLASHING IMMUNE: ' + r.slashing.w); ok(r.crushing.w.indexOf('CRUSHING IMMUNE') >= 0, 'CRUSHING IMMUNE: ' + r.crushing.w);
    });
    check('a follower\'s Slashing hit lands only its elemental part (the physical part does 0)', () => {
        const r = J(`(function(){ spawnFollowerAtCrystal('fire', 'brawler'); const f = followers[followers.length - 1]; f.evolved = 'quillstone'; f.level = 20; _applyFollowerLevel(f, true); f.energy = ['fire', null, null];
            const t = __rp('tank'), hit = { which: 'main', stat: 'atk', type: 'slashing' }, all = dmgApply(t, 40, f, 'fire', hit);
            const ant = new Predator('scout', Object.assign({}, SPECIES.ant.scout), 5, 5); ant.speciesName = 'ant'; ant.element = 'electric';
            const on = dmgApply(ant, 40, f, 'fire', hit); return { all, on, el: dmgRowMult(DMG_RACE.ant, 'elemental'), phys: dmgRowMult(DMG_RACE.ant, 'slashing') }; })()`);
        ok(r.all > 0, 'its elemental part lands: ' + r.all); ok(r.all < r.on, 'less than the same hit on an ant (' + r.on + ')');
    });
    check('the player\'s lash (Slashing) and gauntlet (Crushing) do nothing to it; the gun lands ×1.3 (Projectile); the arc lands (Elemental)', () => {
        const r = J(`(function(){ const t = __rp('tank'); return { lash: dmgApply(t, 50, player, null, DMG_HIT_LASH), punch: dmgApply(t, 50, player, null, DMG_HIT_PUNCH), gun: dmgApply(t, 50, player, null, DMG_HIT_GUN), arc: dmgApply(t, 50, player, null, DMG_HIT_ARC) }; })()`);
        near(r.lash, 0, 'the lash'); near(r.punch, 0, 'the gauntlet'); near(r.gun, 65, 'the gun'); ok(r.arc > 0, 'the arc: ' + r.arc);
    });

    group('THE CURL (js/rolypoly.js; the owner: "Curls up to defend")');
    check('a hit that leaves it under half its health curls it for 4 s (240 frames); over half, or stunned, or asleep, it does not', () => {
        const r = J(`(function(){ const o = {}; let p = __rp('tank'); p.health = p.maxHealth * 0.6; o.over = rolyAfterHit(p);
            p = __rp('tank'); p.health = p.maxHealth * 0.4; o.under = rolyAfterHit(p); o.frames = p.curled;
            p = __rp('tank', { stunned: 30 }); p.health = p.maxHealth * 0.4; o.stunned = rolyAfterHit(p);
            p = __rp('tank', { asleep: 30 }); p.health = p.maxHealth * 0.4; o.asleep = rolyAfterHit(p);
            p = __rp('tank'); p.health = 0; o.dead = rolyAfterHit(p); return o; })()`);
        ok(!r.over, 'over half'); ok(r.under, 'under half'); ok(r.frames === 240, '240 frames: ' + r.frames); ok(!r.stunned, 'stunned'); ok(!r.asleep, 'asleep'); ok(!r.dead, 'dead');
    });
    check('curled, it takes ×0.3 of a hit; it uncurls after 4 s and cannot curl again for 12 s more', () => {
        const r = J(`(function(){ const p = __rp('tank'); p.health = p.maxHealth * 0.4; rolyAfterHit(p); const o = { curled: rolyTaken(p, 100) };
            for (let i = 0; i < 240; i++) rolyTick(p); o.after = rolyTaken(p, 100); o.curledAfter = rolyCurled(p); o.again = rolyAfterHit(p);
            for (let i = 0; i < 719; i++) rolyTick(p); o.stillResting = rolyAfterHit(p); rolyTick(p); o.rested = rolyAfterHit(p); return o; })()`);
        near(r.curled, 30, 'curled'); near(r.after, 100, 'uncurled'); ok(!r.curledAfter, 'uncurled after 240 frames'); ok(!r.again, 'not again at once'); ok(!r.stillResting, 'not a frame before 12 s'); ok(r.rested, 'again after 12 s');
    });
    check('another species never curls and takes what it takes', () => {
        const r = J(`(function(){ const p = new Predator('scout', Object.assign({}, SPECIES.beetle.scout), 5, 5); p.speciesName = 'beetle'; p.health = p.maxHealth * 0.2; return { curl: rolyAfterHit(p), taken: rolyTaken(p, 100) }; })()`);
        ok(!r.curl, 'a beetle curled'); near(r.taken, 100, 'a beetle\'s share');
    });

    group('ITS LOOK (js/rolypoly.js; img/props/rolypoly.png, design/props/models/rolypoly.js)');
    check('the baked sheet has eight facings of four walk frames and eight wheels', () => {
        const r = J(`Object.keys(PROP_ATLAS.rolypoly.cells).sort()`), want = [];
        for (let d = 0; d < 8; d++) { want.push('c' + d); for (let f = 0; f < 4; f++) want.push('w' + d + '_' + f); }
        sameJSON(r, want.sort(), 'its cells');
    });
    check('the cell: its heading in eighths (0 the game\'s +x), the walk frame from its walk cycle while it walks, frame 0 standing, the wheel while curled', () => {
        const r = J(`(function(){ const p = __rp('scout'), o = {}; p.state = 'idle';
            p.dirX = 1; p.dirY = 0; o.e = rolyCell(p); p.dirX = 0; p.dirY = 1; o.s = rolyCell(p); p.dirX = -1; p.dirY = 0; o.w = rolyCell(p); p.dirX = 0.7; p.dirY = -0.7; o.ne = rolyCell(p);
            p.state = 'hunt'; p.dirX = 1; p.dirY = 0; const seen = {}; for (let i = 0; i < 40; i++) { p.walkCycle = i * 0.4; seen[rolyCell(p)] = 1; } o.frames = Object.keys(seen).sort();
            p.curled = 10; o.curled = rolyCell(p); return o; })()`);
        ok(r.e === 'w0_0', 'facing +x: ' + r.e); ok(r.s === 'w2_0', 'facing +y: ' + r.s); ok(r.w === 'w4_0', 'facing -x: ' + r.w); ok(r.ne === 'w7_0', 'facing +x -y: ' + r.ne);
        sameJSON(r.frames, ['w0_0', 'w0_1', 'w0_2', 'w0_3'], 'the four walk frames'); ok(r.curled === 'c0', 'curled: ' + r.curled);
    });
    check('drawBug3D hands a roly-poly to its sheet (baked at twice its size: drawn at half, scaled by its width), and stands a beetle in while the sheet is not there', () => {
        const r = J(`(function(){ const o = {}, p = __rp('scout'), calls = []; const g = { save(){}, restore(){}, drawImage(...a){ calls.push(a); }, globalAlpha: 1 };
            const real = _psImg; _psImg = () => ({ complete: true, naturalWidth: 10 }); o.h = drawBug3D(p, 100, 100, g); o.calls = calls.length; o.args = calls[0] ? calls[0].slice(1) : null;
            const c = PROP_ATLAS.rolypoly.cells[rolyCell(p)], k = 26 / 42 / ROLYPOLY.res; o.want = [c.x, c.y, c.w, c.h, 100 - c.ax * k, 100 - c.ay * k, c.w * k, c.h * k]; o.top = c.ay * k;
            _psImg = () => null; let beetle = 0; const rb = drawBeetle3D; drawBeetle3D = () => { beetle++; }; drawBug3D(p, 100, 100, g); drawBeetle3D = rb; _psImg = real; o.beetle = beetle; return o; })()`);
        ok(r.calls === 1, 'one blit: ' + r.calls); sameJSON(r.args.map(v => Math.round(v * 100) / 100), r.want.map(v => Math.round(v * 100) / 100), 'the cell, at its ground point, at a scout\'s size');
        near(r.h, r.top, 'its height for the bars'); ok(r.beetle === 1, 'a beetle stands in');
    });

    group('THROUGH THE GAME (js/helpers.js applyDamage, js/combat.js updateStatusEffects, js/predator.js update, js/clone.js, js/facilityspawn.js)');
    check('applyDamage: a hit that leaves it under half its health curls it; curled, a hit lands at ×0.3 of what it does uncurled; the curl runs down in updateStatusEffects, a stun does not hold it', () => {
        const r = J(`(function(){ const p = __rp('tank'); p.health = p.maxHealth = 1000; actors.push(p); const o = {};
            applyDamage(p, 300, null); o.over = p.curled || 0; applyDamage(p, 300, null); o.curled = p.curled || 0;
            let h = p.health; applyDamage(p, 100, null); o.inWheel = h - p.health;
            p.stunned = 60; for (let i = 0; i < 240; i++) updateStatusEffects(); o.after = p.curled || 0; o.rest = p.curlRest || 0;
            h = p.health; applyDamage(p, 100, null); o.open = h - p.health; o.again = p.curled || 0; actors.splice(actors.indexOf(p), 1); return o; })()`);
        ok(r.over === 0, 'it curled over half its health'); ok(r.curled === 240, 'curled under half: ' + r.curled);
        ok(r.open > 0, 'an uncurled hit lands: ' + r.open); near(r.inWheel / r.open, 0.3, 'curled over uncurled', 0.02);
        ok(r.after === 0, 'still curled after 240 frames under a stun: ' + r.after); ok(r.rest === 720, 'its rest after: ' + r.rest); ok(r.again === 0, 'curled again in its rest');
    });
    check('curled, it stays where it is: its update returns at once (no walking, no bite)', () => {
        const r = J(`(function(){ const p = __rp('scout'); p.state = 'hunt'; p.curled = 100; const x = p.x, y = p.y, w = p.walkCycle; for (let i = 0; i < 30; i++) p.update(); return { moved: p.x !== x || p.y !== y || p.walkCycle !== w, wind: p.attackWindup || 0 }; })()`);
        ok(!r.moved, 'it moved while curled'); ok(r.wind === 0, 'it wound up a bite while curled');
    });
    check('its clone (the Mutator\'s, "Clone potential") keeps its row and curls: a Slashing bite does nothing to it, and hurt under half it curls; the Clone Bay offers it once you hold its DNA', () => {
        const r = J(`(function(){ const c = makeClone('rolypoly', 'scout', 5, 5, 'idle', 3); const o = { made: !!c, row: c && dmgRow(c) === DMG_RACE.rolypoly, bite: c ? dmgApply(c, 100, null, null, DMG_HIT_ENEMY.slashing) : -1 };
            if (c) { c.health = c.maxHealth * 0.4; o.curl = rolyAfterHit(c); }
            addDNA('rolypoly_scout', 5); const row = getCloneOptions().find(x => x.speciesName === 'rolypoly' && x.className === 'scout'); o.opt = row ? [row.have, row.needed, row.shardCost] : null; return o; })()`);
        ok(r.made, 'no clone'); ok(r.row, 'its row'); near(r.bite, 0, 'a Slashing bite on it'); ok(r.curl, 'it did not curl');
        sameJSON(r.opt, [5, 5, 7], 'the Clone Bay\'s row: 5 splices of 5, 7 shards');
    });
    check('it lives in the electrical domain only: the domain\'s spawner makes roly-polies, electric, of their race, up from its floor while you are there; the arena\'s and the Sewers\' tables make ants', () => {
        const r = J(`(function(){ const W = spawnWhat(FP_SPAWN_ELEC), o = { species: W.species.join(), element: W.element, arena: spawnWhat(FP_SPAWN).species.join(), sewers: spawnWhat(FP_SPAWN_SEWERS).species.join() };
            const cells = partyRoomCells('electrical'); o.cells = cells.length;
            if (cells.length) { const c = cells[Math.floor(cells.length / 2)]; player.x = player.visualX = c[0]; player.y = player.visualY = c[1]; o.place = partyPlaceOf(partyRoomAt(player.x, player.y));
                _fp.elecAt = undefined; facilityElecTick(typeof frame !== 'undefined' ? frame : 0); const got = facilityCreatures('electrical'); o.made = got.length;
                o.kinds = [...new Set(got.map(a => a.speciesName + ':' + a.element + ':' + a.race + ':' + /^elec_/.test(partyRoomAt(a.x, a.y) || '')))].join(); got.forEach(a => { a.dead = true; }); }
            return o; })()`);
        ok(r.species === 'rolypoly', 'the domain\'s species: ' + r.species); ok(r.element === 'electric', 'electric'); ok(r.arena === 'ant' && r.sewers === 'ant', 'the arena\'s and the Sewers\': ' + r.arena + ' / ' + r.sewers);
        ok(r.cells > 0, 'the domain\'s floor'); ok(r.place === 'electrical', 'the player in the domain: ' + r.place); ok(r.made >= 1, 'nothing came up: ' + r.made);
        ok(r.kinds === 'rolypoly:electric:rolypoly:true', 'what came up: ' + r.kinds);
    });

    console.log('\n' + (failures ? failures + ' FAILED' : 'all passed'));
    process.exit(failures ? 1 : 0);
})();
