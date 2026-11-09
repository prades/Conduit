// FOLLOWER BONDS — docs/ROADMAP-top5.md §4; docs/FOLLOWER-PROGRESSION.md "Bonds".
//
// Two followers who fight side by side long enough bond, one partner each, kept by a stable uid. Since build
// 2026-11-09b (the owner, 2026-11-09: "the bonuses there is none other than breeding and the visual effect") a
// bond is for BREEDING and the HEARTS only: no bonus together, no rage, no DUO ultimate; and it lasts through a
// fall ("Bond survives"). The hearts: within BOND_HEARTS.near tiles, a few over each for BOND_HEARTS.frames, not
// again until the two have been more than BOND_HEARTS.apart tiles apart ("As drafted").
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
    run('gameState.running = true; facilityBlackoutSet(false);');

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
    await check('a respawned follower comes back with the same uid, and its partner (a bond lasts through a fall since build 2026-11-09b)', () => {
        ok(/hpStat:Math\.max\(1,keptHp\), uid:a\.uid, partnerUid:a\.partnerUid\|\|null,/.test(rd('js/game.js')), 'the respawn queue does not carry the uid and the partner');   // (keptHp: a death costs nothing since 2026-11-01)
        ok(/bondRestoreFields\(npc, \{ uid: entry\.uid, partnerUid: entry\.partnerUid \}\)/.test(rd('js/game.js')), 'the respawn does not restore them');
    });
    await check('uid and partner survive the facility\'s save (js/facilitysave.js)', () => {
        const r = run(`(function(){ actors.length = 0; followers.length = 0;
            spawnFollowerFromSave({ element: 'fire', uid: 77, partnerUid: 78 }); const f = followers[followers.length - 1];
            spawnFollowerAtCrystal('ice'); const g = followers[followers.length - 1];
            return { uid: f.uid, partner: f.partnerUid, next: g.uid }; })()`);
        ok(r.uid === 77 && r.partner === 78, JSON.stringify(r));
        ok(r.next > 77, 'a new follower reused a saved uid: ' + r.next);
        ok(/uid:\s*a\.uid \|\| null,\s*partnerUid:\s*a\.partnerUid \|\| null/.test(rd('js/facilitysave.js')), 'the roster does not save them');
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

    group('A BOND IS FOR BREEDING (build 2026-11-09b: "the bonuses there is none other than breeding and the visual effect")');

    await check('no bonus in a fight: a bonded follower beside its partner hits as hard as apart, and takes as much; no rage, no DUO (their code and numbers are gone)', () => {
        pair(1, true, run('BOND_POINTS'));
        const r = run(`(function(){ const S = SPECIES.ant; const q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 7, 2);
            q.health = q.maxHealth = 1000; q.team = 'red'; applyDamage(q, 100, __a); const together = 1000 - q.health;
            q.health = 1000; __b.x = 20; applyDamage(q, 100, __a); const apart = 1000 - q.health; __b.x = __a.x + 1;
            __a.health = __a.maxHealth; applyDamage(__a, 10, q); const took = __a.maxHealth - __a.health; __a.health = __a.maxHealth; __b.x = 20; applyDamage(__a, 10, q); const tookApart = __a.maxHealth - __a.health;
            return { together, apart, took, tookApart, gone: ['bondAttackMult', 'bondDefenseMult', 'bondOnDeath', 'tryDuoUltimate', 'bondTogether', 'BOND_ATTACK_MULT', 'BOND_DEFENSE_MULT', 'BOND_RAGE_FRAMES', 'BOND_DUO_MULT', 'BOND_TOGETHER'].filter(k => typeof globalThis[k] !== 'undefined' || (function(){ try { return eval('typeof ' + k) !== 'undefined'; } catch (e) { return false; } })()) }; })()`);
        ok(r.together > 0 && Math.abs(r.together - r.apart) < 1e-9, 'its hit together and apart: ' + JSON.stringify(r));
        ok(Math.abs(r.took - r.tookApart) < 1e-9, 'the hit it took together and apart: ' + JSON.stringify(r));
        ok(r.gone.length === 0, 'still defined: ' + r.gone.join());
    });
    await check('a bonded pair can breed: each is the other\'s breeding partner (js/breeding.js breedPartner); an unbonded follower has none', () => {
        pair(1, true, run('BOND_POINTS'));
        const r = run(`(function(){ const o = { a: breedPartner(__a) === __b, b: breedPartner(__b) === __a }; spawnFollowerAtCrystal('core'); const c = followers[followers.length - 1]; o.c = breedPartner(c); return o; })()`);
        ok(r.a && r.b && r.c === null, JSON.stringify(r));
    });

    group('THE HEARTS ("As drafted": within 1 tile, three over each, about 1.5 s; again only after being more than 3 tiles apart)');

    await check('they come when the pair come within BOND_HEARTS.near tiles, last BOND_HEARTS.frames, and do not come back while the two stay close; apart past BOND_HEARTS.apart, then close again: again', () => {
        pair(1.5, true, run('BOND_POINTS'));
        const r = run(`(function(){ _bondHearts = new Map(); const H = BOND_HEARTS, o = {}; __b.x = __a.x + 2;
            o.mid = _bondHeartTick(__a, __b); __b.x = __a.x + 0.8; o.start = _bondHeartTick(__a, __b); frame += H.frames - 1; o.late = _bondHeartTick(__a, __b) > 0.9;
            frame += 2; o.over = _bondHeartTick(__a, __b); frame += 600; o.stayed = _bondHeartTick(__a, __b);
            __b.x = __a.x + 2.5; _bondHeartTick(__a, __b); __b.x = __a.x + 0.5; o.notApart = _bondHeartTick(__a, __b);
            __b.x = __a.x + 3.5; _bondHeartTick(__a, __b); __b.x = __a.x + 0.5; o.again = _bondHeartTick(__a, __b);
            o.H = [H.near, H.apart, H.frames, H.count]; return o; })()`);
        ok(r.H.join() === '1,3,90,3', 'the numbers: ' + r.H.join());
        ok(r.mid === -1, 'hearts 2 tiles off: ' + r.mid); ok(r.start === 0, 'none within a tile: ' + r.start); ok(r.late === true, 'not lasting their 90 frames');
        ok(r.over === -1 && r.stayed === -1, 'still showing after their time, or again while they stayed close: ' + JSON.stringify(r));
        ok(r.notApart === -1, 'again after only 2.5 tiles apart: ' + r.notApart); ok(r.again === 0, 'not again after 3.5 tiles apart: ' + r.again);
    });
    await check('drawn: while they show, three hearts over each partner (six); once over, none; no line between them any more', () => {
        pair(1.5, true, run('BOND_POINTS'));
        const r = run(`(function(){ _bondHearts = new Map(); const keep = cachedText, keepDash = ctx.setLineDash; let n = 0, dash = 0; cachedText = function(t){ if (t === '♥') n++; return keep.apply(this, arguments); }; ctx.setLineDash = function(){ dash++; return keepDash.apply(this, arguments); };
            try { __b.x = __a.x + 0.8; drawBonds(); const during = n; n = 0; frame += BOND_HEARTS.frames + 1; drawBonds(); return { during, after: n, dash }; } finally { cachedText = keep; ctx.setLineDash = keepDash; } })()`);
        ok(r.during === 6 && r.after === 0 && r.dash === 0, JSON.stringify(r));
    });

    group('A FALL ("Bond survives")');

    await check('if one falls, the bond is kept: no rage, nothing announced; it comes back still bonded, each the other\'s partner again', () => {
        pair(1, true, run('BOND_POINTS'));
        const r = run(`(function(){ const ub = __b.uid, ua = __a.uid; floatingTexts.length = 0; __b.dead = true; __b.health = 0; render();
            const o = { kept: __a.partnerUid === ub, rage: __a._rageUntil > frame, said: floatingTexts.map(t => t.text).filter(t => /RAGE|DUO/.test(t)), queued: respawnQueue.filter(e => e.uid === ub).map(e => e.partnerUid) };
            for (const e of respawnQueue) e.timer = 1; if (typeof crystal !== 'undefined') crystal.health = crystal.maxHealth;
            for (let i = 0; i < 4; i++) render();
            const nb = followers.find(f => f.uid === ub && !f.dead); o.back = !!nb && nb !== __b; o.partner = nb ? nb.partnerUid === ua : null; o.pair = nb ? bondPartner(__a) === nb && breedPartner(nb) === __a : null; return o; })()`);
        ok(r.kept && !r.rage && r.said.length === 0, 'when it fell: ' + JSON.stringify(r));
        ok(r.queued.length === 1 && r.queued[0] === run('__a.uid'), 'the respawn queue does not carry its partner: ' + JSON.stringify(r.queued));
        ok(r.back && r.partner && r.pair, 'when it came back: ' + JSON.stringify(r));
    });
    await check('re-rolling a follower breaks the bond (it is someone new)', () => {
        pair(1, true, run('BOND_POINTS'));
        const r = run(`(function(){ startFollowerReroll(__a, true); return { a: __a.partnerUid, b: __b.partnerUid }; })()`);
        ok(!r.a && !r.b, JSON.stringify(r));
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
