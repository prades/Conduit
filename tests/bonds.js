// FOLLOWER BONDS — docs/ROADMAP-top5.md §4.
//
// Two followers who fight side by side long enough bond: together they hit
// harder and take less; if one dies the other rages; both ultimates full and
// close fires a DUO ultimate. Kept by a stable uid.
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
    run('gameState.running = true; if (typeof tutorialMode !== "undefined") tutorialMode = false;');

    // Two fresh followers at (6,2) and (6+gap,2), both "in combat" every tick
    // if `fighting`, run `ticks` bond checks. Returns them on globalThis.
    const pair = (gap, fighting, ticks) => run(`(function(){
        actors.length = 0; followers.length = 0; respawnQueue.length = 0; _bondPoints = new Map(); floatingTexts.length = 0;
        spawnFollowerAtCrystal('fire'); const a = followers[followers.length - 1];
        spawnFollowerAtCrystal('ice');  const b = followers[followers.length - 1];
        [a, b].forEach((f, i) => { f.returningToCrystal = false; f.x = 6 + i * ${gap}; f.y = 2; f.partnerUid = null; });
        for (let t = 0; t < ${ticks}; t++) {
            if (${fighting}) { a._lastCombat = b._lastCombat = frame; }
            frame = Math.ceil((frame + 1) / BOND_TICK) * BOND_TICK; bondTick();
        }
        globalThis.__a = a; globalThis.__b = b;
        return { a: a.partnerUid, b: b.partnerUid, ua: a.uid, ub: b.uid, said: floatingTexts.map(t => t.text) };
    })()`);

    group('IDENTITY');

    await check('every follower gets a unique uid', () => {
        const r = run(`(function(){ actors.length = 0; followers.length = 0; for (let i = 0; i < 20; i++) spawnFollowerAtCrystal('fire');
            const u = followers.map(f => f.uid); return { n: new Set(u).size, all: u.every(x => x > 0) }; })()`);
        ok(r.n === 20 && r.all, JSON.stringify(r));
    });
    await check('a respawned follower comes back with the same uid', () => {
        ok(/hpStat:Math\.max\(1,newHp\), uid:a\.uid \}/.test(rd('js/game.js')), 'the respawn queue does not carry the uid');
        ok(/bondRestoreFields\(npc, \{ uid: entry\.uid \}\)/.test(rd('js/game.js')), 'the respawn does not restore it');
    });
    await check('uid and partner survive the wave-transition save', () => {
        const r = run(`(function(){ const npc0 = { uid: 77, partnerUid: 78 }; actors.length = 0; followers.length = 0;
            spawnFollowerFromSave({ element: 'fire', uid: 77, partnerUid: 78 }); const f = followers[followers.length - 1];
            spawnFollowerAtCrystal('ice'); const g = followers[followers.length - 1];
            return { uid: f.uid, partner: f.partnerUid, next: g.uid }; })()`);
        ok(r.uid === 77 && r.partner === 78, JSON.stringify(r));
        ok(r.next > 77, 'a new follower reused a saved uid: ' + r.next);
        ok(/uid:\s+a\.uid \|\| null,\s+partnerUid:\s+a\.partnerUid \|\| null/.test(rd('js/waves.js')), 'the roster does not save them');
    });

    group('FORMING');

    await check('THE ASK: two followers fighting side by side bond, and it is announced', () => {
        const r = pair(1, true, run('BOND_POINTS'));
        ok(r.a === r.ub && r.b === r.ua, JSON.stringify(r));
        ok(r.said.some(t => /BONDED/.test(t)), 'no announcement');
    });
    await check('not one check early', () => {
        const r = pair(1, true, run('BOND_POINTS') - 1);
        ok(!r.a && !r.b, 'bonded early');
    });
    await check('not if they are not fighting', () => {
        const r = pair(1, false, run('BOND_POINTS') * 2);
        ok(!r.a, 'bonded without fighting');
    });
    await check('not if they are too far apart', () => {
        const r = pair(run('BOND_RANGE') + 1, true, run('BOND_POINTS') * 2);
        ok(!r.a, 'bonded across ' + (run('BOND_RANGE') + 1) + ' tiles');
    });
    await check('one partner at a time', () => {
        pair(1, true, run('BOND_POINTS'));
        const r = run(`(function(){ spawnFollowerAtCrystal('core'); const c = followers[followers.length - 1]; c.returningToCrystal = false; c.x = 6.5; c.y = 2;
            for (let t = 0; t < BOND_POINTS * 2; t++) { __a._lastCombat = __b._lastCombat = c._lastCombat = frame; frame = Math.ceil((frame + 1) / BOND_TICK) * BOND_TICK; bondTick(); }
            return { c: c.partnerUid, a: __a.partnerUid === __b.uid }; })()`);
        ok(!r.c && r.a, JSON.stringify(r));
    });

    group('TOGETHER');

    await check('THE ASK: together they hit BOND_ATTACK_MULT harder and take BOND_DEFENSE_MULT', () => {
        pair(1, true, run('BOND_POINTS'));
        const r = run(`({ atk: bondAttackMult(__a), def: bondDefenseMult(__a) })`);
        ok(r.atk === run('BOND_ATTACK_MULT') && r.def === run('BOND_DEFENSE_MULT'), JSON.stringify(r));
    });
    await check('apart, the bonus is off', () => {
        pair(1, true, run('BOND_POINTS'));
        const r = run(`(function(){ __b.x = __a.x + BOND_TOGETHER + 1; return { atk: bondAttackMult(__a), def: bondDefenseMult(__a) }; })()`);
        ok(r.atk === 1 && r.def === 1, JSON.stringify(r));
    });
    await check('the bonus reaches applyDamage', () => {
        pair(1, true, run('BOND_POINTS'));
        const r = run(`(function(){ const S = SPECIES.ant; const q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 7, 2);
            q.health = q.maxHealth = 1000; q.team = 'red'; applyDamage(q, 100, __a); const together = 1000 - q.health;
            q.health = 1000; __b.x = 20; applyDamage(q, 100, __a); return { together, apart: 1000 - q.health }; })()`);
        ok(Math.abs(r.together / r.apart - run('BOND_ATTACK_MULT')) < 1e-6, JSON.stringify(r));
    });

    group('LOSS');

    await check('THE ASK: if one dies the other rages, and the bond is over', () => {
        pair(1, true, run('BOND_POINTS'));
        const r = run(`(function(){ __b.dead = true; __b.health = 0; render();
            return { rage: __a._rageUntil > frame, atk: bondAttackMult(__a), partner: __a.partnerUid, speed: __a.slowFactor, said: floatingTexts.map(t => t.text) }; })()`);
        ok(r.rage && r.partner === null, JSON.stringify(r));
        ok(Math.abs(r.atk - run('BOND_RAGE_ATTACK')) < 1e-9, 'rage attack ' + r.atk);
        ok(r.said.some(t => /RAGES/.test(t)), 'not announced');
    });
    await check('the rage wears off', () => {
        const r = run(`(function(){ frame += BOND_RAGE_FRAMES + 1; return bondAttackMult(__a); })()`);
        ok(r === 1, 'still raging: ' + r);
    });
    await check('re-rolling a follower breaks the bond', () => {
        pair(1, true, run('BOND_POINTS'));
        const r = run(`(function(){ startFollowerReroll(__a, true); return { a: __a.partnerUid, b: __b.partnerUid }; })()`);
        ok(!r.a && !r.b, JSON.stringify(r));
    });

    group('DUO');

    await check('THE ASK: both bars full and close — the double-tap fires a DUO ultimate', () => {
        pair(1, true, run('BOND_POINTS'));
        const r = run(`(function(){ let ran = []; const keep = {};
            for (const el of ['fire', 'ice']) { keep[el] = FOLLOWER_ULTIMATES[el].execute; FOLLOWER_ULTIMATES[el].execute = f => ran.push(f.element); }
            __a.ultimateCharge = 100; __b.ultimateCharge = 100; const fired = tryDuoUltimate(__a);
            for (const el in keep) FOLLOWER_ULTIMATES[el].execute = keep[el];
            return { fired, ran, a: __a.ultimateCharge, b: __b.ultimateCharge, duo: __a._duoUntil > frame, said: floatingTexts.map(t => t.text) }; })()`);
        ok(r.fired && r.ran.length === 2 && r.a === 0 && r.b === 0 && r.duo, JSON.stringify(r));
        ok(r.said.some(t => /DUO: FIRE/.test(t)), 'not announced');
        ok(/tryDuoUltimate\(_tappedFollower\)/.test(rd('js/input.js')), 'the double-tap does not try it');
    });
    await check('not with one bar short, nor apart', () => {
        pair(1, true, run('BOND_POINTS'));
        const r = run(`(function(){ __a.ultimateCharge = 100; __b.ultimateCharge = 90; const a = tryDuoUltimate(__a);
            __b.ultimateCharge = 100; __b.x = __a.x + BOND_TOGETHER + 1; const b = tryDuoUltimate(__a); return { a, b }; })()`);
        ok(!r.a && !r.b, JSON.stringify(r));
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
