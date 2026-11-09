// THE NINE SECOND ATTACKS and the ELECTRO SKINK's LIGHTNING CIRCUIT (build 2026-11-09c; the owner, 2026-11-09, picked one of the agent's drafts for each form that had BASH as a stand-in, one form at a
// time, and the Skink's Ultimate; every number is the agent's, provisional: js/evolution.js "THE NINE SECOND ATTACKS", js/moves.js, js/elements.js FORM_ULTIMATES.electroskink, ULT_CIRCUIT).
//   ZIGZAG DASH (Electro Skink), WOBBLE SLAM (Jelly Ram), ICICLE VOLLEY (Rimestar), ECHO PULSE (Hornshell), SHELL GUARD (Hammer Slug), PHASE SWAP (Goo Proxy), VENOM BITE (Blight Spider),
//   SHOCK ZAP (Hover Shell), SKATE CHARGE (Igloo Skater); LIGHTNING CIRCUIT. A follower saved locked on BASH carries over to its form's own.
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
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

const NINE = [['electroskink', 'zigzag_dash', 'ZIGZAG DASH'], ['jellyram', 'wobble_slam', 'WOBBLE SLAM'], ['rimestar', 'icicle_volley', 'ICICLE VOLLEY'], ['hornshell', 'echo_pulse', 'ECHO PULSE'],
    ['hammerslug', 'shell_guard', 'SHELL GUARD'], ['gooproxy', 'phase_swap', 'PHASE SWAP'], ['blightspider', 'venom_bite', 'VENOM BITE'], ['hovershell', 'shock_zap', 'SHOCK ZAP'], ['igloo', 'skate_charge', 'SKATE CHARGE']];

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    // staged as tests/secondattacks.js: the arena's most open spot, followers and creatures that do only what the test says
    run(`gameState.running = true; facilityBlackoutSet(false); unlockedElements = new Set(ELEMENTS.map(e => e.id)); TUT.followerLevel = 0; if (typeof facilitySpawnTick === 'function') facilitySpawnTick = () => {};
        (function(){ const cells = partyRoomCells('arena'), set = new Set(cells.map(c => c[0] + ',' + c[1])); let best = null, bn = -1;
            for (const [x, y] of cells) { let n = 0; for (let dx = -6; dx <= 6; dx++) for (let dy = -6; dy <= 6; dy++) if (set.has((x + dx) + ',' + (y + dy))) n++; if (n > bn) { bn = n; best = [x, y]; } }
            globalThis.__C = [best[0] + 0.5, best[1] + 0.5]; player.x = player.visualX = __C[0] - 8; player.y = player.visualY = __C[1]; })();
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k] = []; followerProjectiles.length = 0; elementEffects.length = 0; floatingTexts.length = 0; frame++; };
        globalThis.__foe = (dx, dy) => { const S = SPECIES.ant, p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), __C[0] + dx, __C[1] + dy); p.speciesName = 'ant'; p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; p.element = null; actors.push(p); return p; };
        globalThis.__fol = (id) => { const E = EVOLUTIONS[id]; spawnFollowerAtCrystal(E.element); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = E.role; f.evolved = id; energyFill(f); f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.stance = 'hold'; f.x = __C[0]; f.y = __C[1]; f.update = () => {}; return f; };
        globalThis.__dmg = p => Math.round((1e6 - p.health) * 1000) / 1000;`);

    group('THE NINE: each form\'s own second attack in place of BASH (the owner, 2026-11-09, one form at a time)');
    check('the nine forms list their own (BASH only before a follower evolves now); each has a wind-up, a reach and its INFO rows', () => {
        const r = J(`${JSON.stringify(NINE)}.map(([id, mid, nm]) => [EVOLUTIONS[id].moves.join(), EVOLUTIONS[id].move, MOVES[mid] && MOVES[mid].name, moveWindupFrames(mid) > 0, moveReach(mid) > 0, !!MOVE_INFO[nm] && MOVE_INFO[nm]().length >= 3].join())`);
        NINE.forEach(([id, mid, nm], i) => same(r[i], [mid, nm, nm, true, true, true].join(), id));
        same(J(`Object.values(EVOLUTIONS).filter(E => !E.legacy && !E.aside && (E.moves || []).indexOf('bash') >= 0).map(E => E.id).join()`), '', 'a current form still on BASH');
        same(J(`UNEVOLVED_MOVES.moves.join()`), 'bash', 'an unevolved follower\'s second attack');
        same(J(`[MOVES.wobble_slam.close, MOVES.venom_bite.close, !!MOVES.zigzag_dash.close]`).join(), 'true,true,false', 'the close moves (a Mage or Technician walks in to use them)');
    });
    check('a follower saved locked on BASH carries over to its form\'s own (and an unevolved follower keeps BASH; any other choice is kept)', () => {
        const r = J(`[moveAltCarried({ isFollower: true, evolved: 'jellyram' }, 'bash'), moveAltCarried({ isFollower: true, evolved: 'igloo' }, 'bash'), moveAltCarried({ isFollower: true }, 'bash'), moveAltCarried({ isFollower: true, evolved: 'quillstone' }, 'quill_burst')]`);
        same(r.join(), 'wobble_slam,skate_charge,bash,quill_burst', 'carried');
        ok(/npc\.alt = typeof moveAltCarried === "function" \? moveAltCarried\(npc, entry\.alt\) : entry\.alt/.test(rd('js/facilitysave.js')), 'the load does not ask');
    });

    group('EACH MOVE (the numbers the agent\'s, provisional)');
    check('ZIGZAG DASH: through the nearest enemy and on, a hop at a time, three at most: each slashed (electric) and its wind-up broken; it ends beside the last; one too far for a hop untouched; nothing in reach, no fire', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electroskink'), a = __foe(2, 0), b = __foe(3.5, 1), c = __foe(5, 0), d = __foe(9, 0); const fired = zigzagDash(f);
            const o = { fired, hit: [a, b, c, d].map(__dmg).map(x => x > 0), glitch: [a, b, c].map(q => q.glitched > 0), end: Math.round(Math.hypot(f.x - c.x, f.y - c.y) * 100) / 100, trail: (f._arcPts || []).length, cd: f._sigCd === moveWindupFrames('zigzag_dash') };
            __clear(); const g = __fol('electroskink'); __foe(6, 0); o.none = zigzagDash(g); return o; })()`);
        same(r.fired, true, 'it fired'); same(r.hit.join(), 'true,true,true,false', 'who it slashed'); same(r.glitch.join(), 'true,true,true', 'glitched'); ok(r.end <= 1, 'it did not end beside the last: ' + r.end);
        same(r.trail, 3, 'the trail back along its way'); same(r.cd, true, 'its wind-up starts'); same(r.none, false, 'an enemy 6 tiles off');
    });
    check('WOBBLE SLAM: every enemy within 1.5 tiles hurt (crushing) and staggered half a second, not a boss; one 2.5 tiles off untouched', () => {
        const r = J(`(function(){ __clear(); const f = __fol('jellyram'), a = __foe(1, 0), b = __foe(0, 1.2), c = __foe(2.5, 0), boss = __foe(-1, 0); boss.bossId = 'test'; const fired = wobbleSlam(f);
            return { fired, hit: [a, b, c, boss].map(q => __dmg(q) > 0), stun: [a.stunned || 0, b.stunned || 0, boss.stunned || 0] }; })()`);
        same(r.fired, true, 'it fired'); same(r.hit.join(), 'true,true,false,true', 'who it hurt'); ok(r.stun[0] > 0 && r.stun[1] > 0, 'not staggered: ' + r.stun); same(r.stun[2], 0, 'a boss staggered');
    });
    check('ICICLE VOLLEY: three icicles in a fan at the nearest enemy, each its shot (special attack × the Mages\' share), ice; the one that hits slows it (to 60% for 2 s)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('rimestar'), t = __foe(4, 0); const n0 = followerProjectiles.length, fired = icicleVolley(f), shots = followerProjectiles.slice(n0);
            const o = { fired, n: shots.length, hit: shots.every(p => p.hit === DMG_HIT_ICICLE), dmg: shots.map(p => Math.round(p.damage * 1000) / 1000), want: Math.round(f.stats.specialAttack * MAGE_SHOT_MULT * 1000) / 1000,
                spread: Math.round(Math.abs(Math.atan2(shots[0].vy, shots[0].vx) - Math.atan2(shots[2].vy, shots[2].vx)) * 100) / 100 };
            for (let i = 0; i < 60 && followerProjectiles.length; i++) render(); o.took = __dmg(t) > 0; o.slow = [t.slowed || 0, t.slowFactor]; return o; })()`);
        same(r.fired, true, 'it fired'); same(r.n, 3, 'icicles'); same(r.hit, true, 'their hit'); same(r.dmg.join(), [r.want, r.want, r.want].join(), 'each its shot');
        same(r.spread, 0.52, 'the fan (two 0.26 apart)'); same(r.took, true, 'the enemy hit'); ok(r.slow[0] > 0 && Math.abs(r.slow[1] - 0.6) < 1e-9, 'not slowed: ' + r.slow);
    });
    check('ECHO PULSE: every enemy within 4 tiles it can see hurt (0.4 × power) and its wind-up broken; one 5 tiles off untouched', () => {
        const r = J(`(function(){ __clear(); const f = __fol('hornshell'), a = __foe(1, 0), b = __foe(-3, 2), c = __foe(5, 0); const fired = echoPulse(f); return { fired, hit: [a, b, c].map(q => __dmg(q) > 0), gl: [a.glitched > 0, b.glitched > 0, !!(c.glitched > 0)] }; })()`);
        same(r.fired, true, 'it fired'); same(r.hit.join(), 'true,true,false', 'who it hurt'); same(r.gl.join(), 'true,true,false', 'who it glitched');
    });
    check('SHELL GUARD: with an enemy within 3 tiles it braces for 4 s: half damage, and the enemies in reach (not a boss) go for it; none in reach, no fire', () => {
        const r = J(`(function(){ __clear(); const f = __fol('hammerslug'), a = __foe(2, 0), boss = __foe(-2, 0); boss.bossId = 'test'; const far = __foe(5, 0);
            const before = (function(){ const h = f.health; applyDamage(f, 20, a, null, false, false); const d = h - f.health; f.health = f.maxHealth; return d; })();
            const fired = shellGuard(f), after = (function(){ const h = f.health; applyDamage(f, 20, a, null, false, false); const d = h - f.health; f.health = f.maxHealth; return d; })();
            const o = { fired, ratio: Math.round(after / before * 1000) / 1000, lure: [scentLure(a) === f, scentLure(boss) === f, scentLure(far) === f], until: f._guardUntil - frame };
            frame += 241; o.overRatio = Math.round((function(){ const h = f.health; applyDamage(f, 20, a, null, false, false); const d = h - f.health; f.health = f.maxHealth; return d; })() / before * 1000) / 1000;
            __clear(); const g = __fol('hammerslug'); __foe(4, 0); o.none = shellGuard(g); return o; })()`);
        same(r.fired, true, 'it fired'); same(r.ratio, 0.5, 'the hit it took while braced'); same(r.lure.join(), 'true,false,false', 'who went for it (the near one; not a boss nor one 5 tiles off)');
        same(r.until, 240, 'braced for'); same(r.overRatio, 1, 'after'); same(r.none, false, 'no enemy within 3 tiles');
    });
    check('PHASE SWAP: it swaps places with the nearest enemy it can see within 6 tiles that is not a boss, and a goo burst at the spot it left hurts every enemy within 1 tile of it (the one swapped there included); one farther off untouched', () => {
        const r = J(`(function(){ __clear(); const f = __fol('gooproxy'), boss = __foe(0.4, -0.4); boss.bossId = 'test'; const n1 = __foe(0.7, 0.2), n2 = __foe(-0.7, 0.5), far = __foe(3, 1), x0 = f.x, y0 = f.y, tx = n1.x, ty = n1.y; const fired = phaseSwap(f);
            return { fired, f: [f.x === tx, f.y === ty], t: [n1.x === x0, n1.y === y0], boss: [boss.x !== x0 || boss.y !== y0], hit: [n1, n2, boss, far].map(q => __dmg(q) > 0) }; })()`);
        same(r.fired, true, 'it fired'); same(r.f.join() + '|' + r.t.join(), 'true,true|true,true', 'swapped with the nearest (not the boss)');
        same(r.hit.join(), 'true,true,true,false', 'the burst (the one swapped there, one beside the spot, the boss beside it; not one 3 tiles off)');
    });
    check('VENOM BITE: it bites the nearest enemy within reach (piercing): POISONED (its hits 40% weaker for 4 s) and MARKED: your side\'s next 3 hits on it deal 20% more, the 4th as before', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blightspider'), t = __foe(1.2, 0), m = __fol('maw'); m.x = t.x - 1; m.y = t.y;
            const hit = () => { const h = t.health; applyDamage(t, 10, m, null, false, false); return Math.round((h - t.health) * 1000) / 1000; };
            const base = hit(); const fired = venomBite(f), o = { fired, poison: [t.toxicWeakened, t.toxicWeakenFactor], marks: t._venomHits };
            o.hits = [hit(), hit(), hit(), hit()].map(x => Math.round(x / base * 1000) / 1000); return o; })()`);
        same(r.fired, true, 'it fired'); same(r.poison.join(), '240,0.6', 'poisoned'); same(r.marks, 3, 'marked'); same(r.hits.join(), '1.2,1.2,1.2,1', 'the next hits on it');
    });
    check('SHOCK ZAP: the nearest enemy within 4 tiles zapped (electric) and its wind-up broken; one 5 tiles off not; drawn as a bolt', () => {
        const r = J(`(function(){ __clear(); const f = __fol('hovershell'), a = __foe(3, 0); const fired = shockZap(f); const o = { fired, hit: __dmg(a) > 0, gl: a.glitched > 0, bolt: (f._arcPts || []).length };
            __clear(); const g = __fol('hovershell'), b = __foe(5, 0); o.none = shockZap(g); return o; })()`);
        same(r.fired + ',' + r.hit + ',' + r.gl + ',' + r.bolt, 'true,true,true,1', 'the zap'); same(r.none, false, 'an enemy 5 tiles off');
    });
    check('SKATE CHARGE: it skates toward the nearest enemy and on, 4 tiles, along open floor: every enemy within 0.8 of its line hurt (ice) and slowed (to 60% for 2 s); one off the line not', () => {
        const r = J(`(function(){ __clear(); const f = __fol('igloo'), a = __foe(1.5, 0.3), b = __foe(3, 0.55), off = __foe(2, 2), x0 = f.x; const fired = skateCharge(f);
            return { fired, hit: [a, b, off].map(q => __dmg(q) > 0), slow: [a.slowed > 0, b.slowed > 0, !!(off.slowed > 0)], moved: Math.round((f.x - x0) * 10) / 10 }; })()`);
        same(r.fired, true, 'it fired'); same(r.hit.join(), 'true,true,false', 'who it hit'); same(r.slow.join(), 'true,true,false', 'who it slowed'); ok(r.moved >= 3, 'it did not skate on: ' + r.moved);
    });

    group('LIGHTNING CIRCUIT, the Electro Skink\'s Ultimate (the owner\'s pick)');
    check('it races a loop round the biggest group it can see (a point a frame), then a ring lies there 5 s: a shock each half second for every enemy inside, a stun for one that has crossed it; nothing in reach keeps the charge; the Skink is no longer flagged', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electroskink'), U = followerUltimate(f), o = { name: U && U.name, pending: followerUltPending(f) };
            const g1 = __foe(4, 0), g2 = __foe(4.6, 0.5), g3 = __foe(4.2, -0.6), lone = __foe(-4, 0), out = __foe(4 + ULT_CIRCUIT.radius + 1, 0);
            f.ultimateCharge = 100; const fired = followerUltFire(f); o.fired = fired; o.charge = f.ultimateCharge;
            const loop = elementEffects.find(e => e.type === 'skinkloop'); o.loop = loop ? loop.path.length : 0; const sx = f.x;
            let ring = null; for (let i = 0; i < 40 && !ring; i++) { updateElementEffects(); ring = elementEffects.find(e => e.type === 'circuit'); } o.ring = !!ring; o.moved = f.x !== sx;
            o.center = ring ? [Math.round(Math.hypot(ring.x - g1.x, ring.y - g1.y) * 10) / 10 <= 1, ring.radius] : null;
            const h = [g1, g2, g3, lone].map(__dmg); for (let i = 0; i < 31; i++) updateElementEffects(); o.shock = [g1, g2, g3, lone].map((q, i) => __dmg(q) > h[i]);
            out.x = ring.x + 1; out.y = ring.y; out.stunned = 0; const h2 = __dmg(out); for (let i = 0; i < 30; i++) updateElementEffects(); o.cross = [out.stunned > 0, __dmg(out) > h2];
            for (let i = 0; i < 400; i++) updateElementEffects(); o.gone = !elementEffects.some(e => e.type === 'circuit');
            __clear(); const g = __fol('electroskink'); __foe(9, 0); g.ultimateCharge = 100; o.none = [followerUltFire(g), g.ultimateCharge]; return o; })()`);
        same(r.name, 'Lightning Circuit', 'its Ultimate'); same(r.pending, false, 'still flagged'); same(r.fired + ',' + r.charge, 'true,0', 'fired, the charge spent');
        ok(r.loop >= 20, 'the loop: ' + r.loop + ' points'); same(r.ring, true, 'no ring after the loop'); same(r.moved, true, 'it did not race round');
        same(String(r.center), 'true,2.5', 'the ring on the group'); same(r.shock.join(), 'true,true,true,false', 'shocked inside (and not the lone one far off)');
        same(r.cross.join(), 'true,true', 'one that crossed in: stunned, and shocked'); same(r.gone, true, 'the ring stayed past its 5 s'); same(r.none.join(), 'false,100', 'nothing in reach');
    });
    check('the retired forms kept for old saves are not flagged (the owner: "No, leave them"): no Ultimate, no NOT DESIGNED YET', () => {
        const r = J(`['manta', 'reaver', 'bloom'].map(id => { const f = { isFollower: true, evolved: id, element: EVOLUTIONS[id].element }; return [!!followerUltimate(f), followerUltPending(f), formUltPending(id)].join(); })`);
        same(r.join('|'), 'false,false,false|false,false,false|false,false,false', 'retired');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
