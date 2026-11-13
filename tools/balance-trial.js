// THE BALANCE TRIAL (build 2026-11-13q; the owner, 2026-11-13: "make it to where they're battling 3 enemies, and also make it to where the amount of healing and other instances of blocking
// or decoying or assisting in any sort of way, make that tallyable and give me a reading on how effective every follower is"): `node tools/balance-trial.js` fights every evolved form at level 20
// with the same base stats for 20 seconds against three standing 1,000,000-HP ants, once on its everyday attack and once on each alternate, and writes design/balance-trial.json, which
// tools/balance.js puts on balance.html. Tallied for the form under test: its damage, the HP it healed in a wounded ally (kept at 30%), the damage its guard or decoy took or cut, the extra
// damage its mark added to an ally's hits, the enemy-seconds enemies were lured or held (stunned, slowed, weakened, blinded, glitched), and the damage it took. A second pass
// with enemies that fight back (3 runs each) measures what a SHELL GUARD, ROTTEN DECOY or SWEET SCENT blocks and lures. It takes several minutes (not part of tests/run.js).
// (Since build 2026-11-13x a standing enemy that is pushed is put back where it stood, and a close move is fought from one tile.)
// HONEST LIMITS: one dummy species (an ant: it resists elemental, is weak to crushing and earthquake), one level, one run for the damage; the live-enemy runs vary a lot (use the averages
// as a guide); a heal is an upper bound (the ally is always wounded); CAPACITOR DISCHARGE reads 0 (it needs a held charge); a technician is held in place, so it only fights what is in reach.
const _cp = require('child_process'), _fs = require('fs'), _path = require('path');
if (process.argv[2] !== '--worker') {
    const ROOT_ = _path.join(__dirname, '..'), self = __filename, tmp = _path.join(require('os').tmpdir(), 'conduit-balance-' + process.pid); _fs.mkdirSync(tmp, { recursive: true });
    const run = (args, out) => new Promise(res => { const p = _cp.spawn(process.execPath, [self, '--worker', ...args], { stdio: ['ignore', 'ignore', 'inherit'] }); p.on('exit', () => res(JSON.parse(_fs.readFileSync(out, 'utf8')))); });
    (async () => {
        const N = 4, A = [], LIVE = 'hammerslug:main,hammerslug:shell_guard,rotshard:rotten_decoy,sundew:sweet_scent,sundew:sweet_scent_full';
        const pa = []; for (let i = 0; i < N; i++) { const out = _path.join(tmp, 'a' + i + '.json'); pa.push(run([out, String(i), String(N), 'inert'], out)); }
        const pb = run([_path.join(tmp, 'b.json'), '0', '1', 'live', LIVE, '3'], _path.join(tmp, 'b.json'));
        for (const r of await Promise.all(pa)) A.push(...r); const B = await pb;
        const avg = (ts, k) => ts.reduce((a, t) => a + (t[k] || 0), 0) / ts.length;
        const live = {}; for (const R of B) for (const [m, ts] of Object.entries(R.modes)) if (ts.length && !ts[0].err) live[R.id + ':' + m] = { block: (avg(ts, 'cut') + avg(ts, 'soak')) / 20, lured: avg(ts, 'lured'), denied: avg(ts, 'denied'), taken: (avg(ts, 'allyTaken') + avg(ts, 'taken')) / 20 };
        const forms = A.map(R => ({ id: R.id, name: R.name, modes: Object.entries(R.modes).filter(([, ts]) => ts[0] && !ts[0].err).map(([m, ts]) => { const t = ts[0], L = live[R.id + ':' + m];
            return { mode: m, dmg: t.dmg / 20, heal: t.heal / 20, block: L ? L.block : (t.cut + t.soak) / 20, assist: t.assist / 20, lured: L ? L.lured : t.lured, cc: t.cc, denied: L ? Math.max(L.denied, t.denied) : t.denied, taken: L ? L.taken : null }; }) }));
        // what one enemy deals in a second when nothing holds it off: the live run with a follower that does nothing (the Hammer Slug on its everyday attack), over the three enemies
        const foeDps = live['hammerslug:main'] ? live['hammerslug:main'].taken / 3 : null;
        const build = /BUILD_VERSION = "([^"]+)"/.exec(_fs.readFileSync(_path.join(ROOT_, 'js/config.js'), 'utf8'))[1];
        _fs.writeFileSync(_path.join(ROOT_, 'design/balance-trial.json'), JSON.stringify({ build, foeDps, forms }, null, 1) + '\n'); console.log('design/balance-trial.json written for build ' + build + ' (' + forms.length + ' forms)');
    })();
    return;
}
process.argv.splice(2, 1);
const fs = require('fs'), vm = require('vm'), path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require(require('path').join(__dirname, '..', 'tests', 'domstub.js'));
process.on('unhandledRejection', () => {});
const rd = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    vm.runInContext('globalThis.__arm = (f, id) => { const d = evolvedDef(f); f.alt = id || (f.move && evoMoveAllowed(f, d, f.move) ? f.move : evoMoveIds(d)[0]); f._altLive = null; f._altWind = 1; };', context);   // (the alternate as a chosen mode, js/moves.js: __arm locks a follower on its alternate and fires it on the next evolutionTick)
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; facilityBlackoutSet(false); unlockedElements = new Set(ELEMENTS.map(e => e.id)); TUT.followerLevel = 0; for (const s of hazardSolids()) if (s.room === 'arena') facilitySolidSet(s.id, true);`);   // (the arena's hazard containers, build 2026-11-09yy, taken off the floor: the open patch below had one beside it, which stopped quills and went off)
    // An open patch of the arena's floor (the cell with the most floor round it), the player off to one side; creatures that hold still and do not die; a follower of a form at level 20.
    run(`(function(){ const cells = partyRoomCells('arena'), set = new Set(cells.map(c => c[0] + ',' + c[1])); let best = null, bn = -1;
        for (const [x, y] of cells) { let n = 0; for (let dx = -6; dx <= 6; dx++) for (let dy = -6; dy <= 6; dy++) if (set.has((x + dx) + ',' + (y + dy))) n++; if (n > bn) { bn = n; best = [x, y]; } }
        globalThis.__C = [best[0] + 0.5, best[1] + 0.5]; player.x = player.visualX = __C[0] - 8; player.y = player.visualY = __C[1]; })();
        globalThis.__pinOn = () => { if (!globalThis.__soMoves) globalThis.__soMoves = EVOLUTIONS.staticorb.moves.slice(); EVOLUTIONS.staticorb.moves = ['static_rush', 'pinball']; };   // (PINBALL is superseded by CAPACITOR DISCHARGE since build 2026-11-07ss: its checks turn it back on for themselves, as its code is kept)
        globalThis.__clear = () => { if (globalThis.__soMoves) { EVOLUTIONS.staticorb.moves = globalThis.__soMoves; globalThis.__soMoves = null; } actors = actors.filter(a => !(a instanceof Predator) && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k] = []; followerProjectiles.length = 0; elementEffects.length = 0; floatingTexts.length = 0; frame++; };
        globalThis.__foe = (x, y, sp) => { const S = SPECIES[sp || 'ant'], p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.speciesName = sp || 'ant'; p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
        globalThis.__fol = (el, role, evo) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.evolved = evo || undefined; if (evo) energyFill(f); f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.stance = 'hold'; f.x = __C[0]; f.y = __C[1]; return f; };
        globalThis.__off = f => { actors = actors.filter(a => a !== f); followers = followers.filter(a => a !== f); };   // (out of the world: its own AI and melee add nothing; its shots and fields keep it as their source)
        globalThis.__dmg = p => 1e6 - p.health;
        globalThis.__fire = f => { frame++; __arm(f); evolutionTick(); };
        globalThis.__fireQ = f => { __fire(f); for (let i = 0; i < QUILL_FIRE; i++) { frame++; evolutionTick(); } };   // (QUILL BURST: the Quillstone turns, and its quills leave QUILL_FIRE frames after the cast: build 2026-11-11n)
        globalThis.__one = (f, x, y, sp) => { const twin = __foe(x, y, sp); return twin; };
        globalThis.__scr = (wx, wy) => { let sx = (wx - player.visualX - (wy - player.visualY)) * TILE_W + canvas.width / 2, sy = (wx - player.visualX + (wy - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H; for (let i = 0; i < 8; i++) { const w = techScreenToWorld(sx, sy), ex = wx - w.x, ey = wy - w.y; if (Math.hypot(ex, ey) < 1e-4) break; sx += (ex - ey) * TILE_W; sy += (ex + ey) * TILE_H; } return { x: sx, y: sy }; };
        globalThis.__burrower = () => { const f = __fol('fire', 'camper', 'thermite'); partyAdd([f]); techAbilityTick(); f._abReadyAt = 0; f._ab2ReadyAt = 0; f.attackCooldown = 0; f.ultimateCharge = 100; return f; };   // (FAULTLINE is its Ultimate: charged)
        globalThis.__draw = (f, wpts) => { const sp = wpts.map(p => __scr(f.x + p[0], f.y + p[1])); techAimPathStart(sp[0].x, sp[0].y); for (let i = 1; i < sp.length; i++) techAimPathMove(sp[i].x, sp[i].y); return techAimTap(sp[sp.length - 1].x, sp[sp.length - 1].y); };
        globalThis.__arc = (R, n) => { const o = []; for (let i = 0; i <= n; i++) { const th = Math.PI * (1 - i / n) / 2; o.push([1 + R - R * Math.cos(th), R - R * Math.sin(th)]); } return o; };`);


    // ── THE SUPPORT TRIAL: 3 enemies, every effect tallied ──
    // Tallies (T): dmg (by the follower under test), heal (HP actually restored to the wounded ally or itself), cut (HP a damage cut prevented), soak (HP of hits that landed on its decoy), taken (HP of hits on the
    // follower), lured (enemy-seconds enemies were drawn to a decoy / scent / guard), cc (enemy-seconds weakened, slowed, stunned, glitched, blinded), assist (extra HP a mark added to an ally's hits).
    run(`globalThis.__T = null;
      (function(){
        const ad = applyDamage, hu = healUnit, sc = (typeof shellGuardCut === 'function' ? shellGuardCut : null), vm = (typeof venomMark === 'function' ? venomMark : null);
        applyDamage = function(t, amount, src, el, r, fx, hit) {
            const T = globalThis.__T;
            if (T && t && !t.dead) {
                const before = t.health;
                const ret = ad.apply(this, arguments);
                const lost = Math.max(0, before - t.health);
                if (src === T.f) T.dmg += lost;
                if (t === T.f) T.taken += lost;
                if (t === T.ally) T.allyTaken += lost;
                if (t.isDecoy) T.soak += Math.max(0, amount || 0);
                return ret;
            }
            return ad.apply(this, arguments);
        };
        healUnit = function(t, amount, src) { const got = hu.apply(this, arguments); const T = globalThis.__T; if (T && got > 0 && (src === T.f || t === T.f)) T.heal += got; return got; };
        if (sc) shellGuardCut = function(t, amount) { const r = sc.apply(this, arguments); const T = globalThis.__T; if (T && t === T.f) T.cut += Math.max(0, amount - r); return r; };
        if (vm) venomMark = function(t, src, amount) { const r = vm.apply(this, arguments); const T = globalThis.__T; if (T && r > amount) T.assist += r - amount; return r; };
      })();`);
    const forms = J(`Object.keys(EVOLUTIONS).filter(k => !EVOLUTIONS[k].legacy && EVOLUTIONS[k].role).map(k => ({ id: k, name: EVOLUTIONS[k].name, el: EVOLUTIONS[k].element, role: EVOLUTIONS[k].role, moves: (typeof evoMoveIds === 'function' ? evoMoveIds(EVOLUTIONS[k]) : []) }))`);
    const results = [];
    const SH = parseInt(process.argv[3] || '0'), NS = parseInt(process.argv[4] || '1');
    const FR = 1200, LIVE = process.argv[5] === 'live', ONLY = process.argv[6] ? process.argv[6].split(',') : null, REPS = parseInt(process.argv[7] || '1');   // 20 seconds
    for (const F of forms.filter((_, i) => i % NS === SH)) {
        const R = { id: F.id, name: F.name, el: F.el, role: F.role, modes: {} };
        const modes = ['main'].concat(F.moves); if (F.moves.indexOf('sweet_scent') >= 0) modes.push('sweet_scent_full');
        for (const mode of modes) { if (ONLY && ONLY.indexOf(F.id + ':' + mode) < 0) continue; R.modes[mode] = []; for (let rep = 0; rep < REPS; rep++) {
            try {
                R.modes[mode].push(J(`(function(){ __clear(); globalThis.__T = null;
                    const f = __fol('${F.el}', '${F.role}', '${F.id}'); f.base = { hp: 20, defense: 10, attack: 14, speed: 12, specialAttack: 14, accuracy: 10, will: 24, resonance: 0 }; _applyFollowerLevel(f, true);
                    const ally = __fol('${F.el === 'fire' ? 'ice' : 'fire'}', 'brawler', null); ally.power = 0; ally.stance = 'hold';
                    const real0 = '${mode}'.replace('_full', ''), dist = (${F.role === 'brawler'} || (MOVES[real0] && MOVES[real0].close)) ? 1.0 : ${F.role === 'camper'} ? 1.6 : 3.5;   // (a close move is fought up close: its user walks in, and the trial holds it in place)
                    const foes = []; for (let i = 0; i < 3; i++) { const p = __foe(f.x + dist + (i % 2) * 0.5, f.y + (i >> 1) * 0.5 - 0.25); if (${LIVE}) delete p.update; foes.push(p); }
                    const real = '${mode}'.replace('_full', ''); if ('${mode}' !== 'main') followerAltSet(f, real); else followerAltSet(f, null);
                    if ('${mode}' === 'sweet_scent_full') f._nectar = 100;
                    f.currentWill = 100; f.attackCooldown = 0;
                    ally.x = f.x - 1; ally.y = f.y + 1; 
                    const T = { f, ally, allyTaken: 0, dmg: 0, heal: 0, cut: 0, soak: 0, taken: 0, lured: 0, cc: 0, denied: 0, assist: 0, err: 0 }; globalThis.__T = T;
                    const X0 = f.x, Y0 = f.y, AX = ally.x, AY = ally.y; let used = 0; const FP = foes.map(p => [p.x, p.y]);
                    for (let k = 0; k < ${FR}; k++) {
                        try { render(); } catch (e) { T.err++; break; } used++;
                        if (!${LIVE}) foes.forEach((p, i) => { p.x = FP[i][0]; p.y = FP[i][1]; p.kbVX = p.kbVY = 0; });   // (a standing enemy that is knocked back is put back: it cannot walk back by itself, and the Jelly Ram's knock would leave it out of reach for good, which read as 2 damage a second)
                        f.x = X0; f.y = Y0; f.stance = 'hold'; ally.x = AX; ally.y = AY; ally.stance = 'hold'; ally.power = 0;
                        if (f.currentWill < 60) f.currentWill = 100;
                        // the wounded ally stays at 30% so a heal always has something to restore; the follower itself is kept alive (its damage taken is tallied)
                        ally.dead = false; ally.health = ally.maxHealth * 0.3; f.dead = false; if (f.health < f.maxHealth * 0.5) f.health = f.maxHealth * 0.5;
                        if (k % 30 === 0) for (const p of foes) if (!p.dead) { applyDamage(player, 0, null); const src = player; ad2(p, 10, src); }
                        for (const p of foes) { if (p.dead) continue;
                            const lu = !!((typeof scentLure === 'function' && scentLure(p)) || (typeof decoyLure === 'function' && decoyLure(p))); if (lu) T.lured += 1 / 60;
                            // DENIED: how much of this enemy's damage is held off this frame (the balance system's rates, tools/balance.js DENY): stunned, glitched, asleep or lured away 1; blinded BLIND_MISS; weakened 1 - its factor; slowed 0.25; the greatest of them, never added up
                            { let w = lu ? 1 : 0; if (p.stunned > 0 || p.glitched > 0 || p.asleep > 0) w = 1; if (p.blinded > 0) w = Math.max(w, BLIND_MISS); if (p.toxicWeakened > 0) w = Math.max(w, 1 - (p.toxicWeakenFactor || 0.6)); if (p.slowed > 0) w = Math.max(w, 0.25); T.denied += w / 60; }
                            let c = 0; if (p.toxicWeakened > 0) c = 1; if (p.slowed > 0) c = 1; if (p.stunned > 0) c = 1; if (p.glitched > 0) c = 1; if (p.blinded > 0) c = 1; if (p.asleep > 0) c = 1; T.cc += c / 60; }
                    }
                    globalThis.__T = null; delete T.f; delete T.ally; T.frames = used; return T; })()`.replace('ad2(p, 10, src)', 'applyDamage(p, 10, src, null)').replace('applyDamage(player, 0, null); ', '')));
            } catch (e) { R.modes[mode].push({ err: String(e && e.message || e).slice(0, 160) }); } }
        }
        results.push(R); process.stderr.write(F.id + ' ');
    }
    fs.writeFileSync(process.argv[2], JSON.stringify(results, null, 1)); console.log('done', results.length);
})();
