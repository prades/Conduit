// THE RIFT MIMIC'S SHARD SHOT (build 2026-11-12d; js/evolution.js MIMIC_SHOT, mimicShotStrike/Tick/Col/Draw; the owner, 2026-11-11, of its everyday hit: "Shard stab"; the first drafts not liked; then "make it to where the
// shard comes up and shoots at the enemy and regrows like the quill stone"; design No. 937).
//   its everyday hit is a shard that rises, is shot at the enemy and grows back; the hit is the flux hit it always was (ELEMENT_ATTACKS.flux.physical) landing as the shard does: MIMIC_SHOT.fire + fly frames after
//   the cast, once, on the enemy as it is then; a Mimic that dies in it, or an enemy that does, lands none; a Mimic still growing its shard back makes the plain hit; every other flux follower is unchanged
//   its sheet's cells in order; its sheet is baked, cropped and told to the game (img/evo/mimic.png: 24 columns)
// Not a look test: the picture is the owner's to judge in the game.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
const rd = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    run(`gameState.running = true; facilityBlackoutSet(false); unlockedElements = new Set(ELEMENTS.map(e => e.id)); TUT.followerLevel = 0; for (const s of hazardSolids()) if (s.room === 'arena') facilitySolidSet(s.id, true);`);
    // An open patch of the arena's floor, the player off to one side; creatures that hold still and do not die; a follower of a form at level 20 (as tests/followercombat.js).
    run(`(function(){ const cells = partyRoomCells('arena'), set = new Set(cells.map(c => c[0] + ',' + c[1])); let best = null, bn = -1;
        for (const [x, y] of cells) { let n = 0; for (let dx = -6; dx <= 6; dx++) for (let dy = -6; dy <= 6; dy++) if (set.has((x + dx) + ',' + (y + dy))) n++; if (n > bn) { bn = n; best = [x, y]; } }
        globalThis.__C = [best[0] + 0.5, best[1] + 0.5]; player.x = player.visualX = __C[0] - 8; player.y = player.visualY = __C[1]; })();
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k] = []; followerProjectiles.length = 0; elementEffects.length = 0; floatingTexts.length = 0; frame++; };
        globalThis.__foe = (x, y, sp) => { const S = SPECIES[sp || 'ant'], p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.speciesName = sp || 'ant'; p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
        globalThis.__fol = (el, role, evo) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.evolved = evo || undefined; if (evo) energyFill(f); f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.stance = 'hold'; f.x = __C[0]; f.y = __C[1]; return f; };
        globalThis.__dmg = p => 1e6 - p.health;
        globalThis.__mim = () => { __clear(); const f = __fol('flux', 'brawler', 'mimic'); f.currentWill = 100; f.attackCooldown = 0; return f; };
        globalThis.__tick = n => { for (let i = 0; i < n; i++) { frame++; updateElementEffects(); } };`);

    group('THE SHARD IS SHOT AND THE HIT LANDS WITH IT');
    check('the cast makes the shard and no hit yet; none until it lands', () => {
        const r = run(`(function(){ const f = __mim(), t = __foe(f.x + 1.2, f.y); followerAttack(f, t); const fx = elementEffects.filter(e => e.type === 'mimicshot'), out = { n: fx.length, onT: fx[0] && fx[0].target === t, at0: __dmg(t) };
            __tick(MIMIC_SHOT.fire + MIMIC_SHOT.fly - 1); out.before = __dmg(t); return out; })()`);
        same(r.n, 1, 'shots made'); ok(r.onT, 'on the enemy'); same(r.at0, 0, 'a hit at the cast'); same(r.before, 0, 'a hit before it lands');
    });
    check('the hit is the flux hit it always was (0.6 x its ATK), landing once as the shard does, with its impact', () => {
        const r = run(`(function(){ const f = __mim(), t = __foe(f.x + 1.2, f.y), twin = __foe(f.x + 1.2, f.y + 6); followerAttack(f, t); __tick(MIMIC_SHOT.fire + MIMIC_SHOT.fly); const landed = __dmg(t);
            ELEMENT_ATTACKS.flux.physical(f, twin); const direct = __dmg(twin); __tick(MIMIC_SHOT.total); return { landed, after: __dmg(t), direct, gone: elementEffects.filter(e => e.type === 'mimicshot').length }; })()`);
        ok(r.landed > 0, 'no hit'); same(r.after, r.landed, 'a second hit'); same(r.landed, r.direct, 'not the plain flux hit\'s damage'); same(r.gone, 0, 'the shot is gone at its end');
    });
    check('the shard flies from the Mimic to the enemy and the enemy it follows is where the hit lands', () => {
        const r = run(`(function(){ const f = __mim(), t = __foe(f.x + 1.6, f.y); followerAttack(f, t); __tick(MIMIC_SHOT.fire + 1); const e = elementEffects.find(e => e.type === 'mimicshot'), a = Math.hypot(e.x - f.x, e.y - f.y); __tick(MIMIC_SHOT.fly - 2); const b = Math.hypot(e.x - t.x, e.y - t.y); return { a, b }; })()`);
        ok(r.a < 0.5, 'it left the Mimic: ' + r.a); ok(r.b < 0.5, 'it came to the enemy: ' + r.b);
    });
    check('a Mimic that dies in it, or an enemy that does, lands no hit', () => {
        const r = run(`(function(){ const f = __mim(), t = __foe(f.x + 1.2, f.y); followerAttack(f, t); __tick(5); f.dead = true; __tick(MIMIC_SHOT.total); const a = __dmg(t);
            const g = __mim(), u = __foe(g.x + 1.2, g.y); followerAttack(g, u); __tick(5); u.dead = true; const hp = u.health; __tick(MIMIC_SHOT.total); return { a, b: u.health - hp }; })()`);
        same(r.a, 0, 'the dead Mimic hit'); same(r.b, 0, 'the dead enemy was hit');
    });
    check('still growing its shard back, the Mimic makes the plain flux hit; every other flux follower\'s hit is unchanged (no shot)', () => {
        const r = run(`(function(){ const f = __mim(), t = __foe(f.x + 1.2, f.y); followerAttack(f, t); __tick(3); const d0 = __dmg(t); f.attackCooldown = 0; f.currentWill = 100; followerAttack(f, t); const d1 = __dmg(t), n = elementEffects.filter(e => e.type === 'mimicshot').length;
            __clear(); const v = __fol('flux', 'sniper', 'voidstar'); v.currentWill = 100; v.attackCooldown = 0; const u = __foe(v.x + 1.2, v.y); followerAttack(v, u); return { d0, d1, n, other: elementEffects.filter(e => e.type === 'mimicshot').length }; })()`);
        same(r.d0, 0, 'hit before landing'); ok(r.d1 > 0, 'no plain hit while growing back'); same(r.n, 1, 'a second shot'); same(r.other, 0, 'another follower shot a shard');
    });
    check('the sheet\'s cells in order: it rises and tips (16, 17), the shard leaves (18), bare (19, 20), grows back (21 to 23), then its own frames', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){ const c = a => mimicShotCol(a), S = MIMIC_SHOT; return [c(-1), c(0), c(S.fire / 2), c(S.fire), c(S.fire + 4), c(S.fire + 8), c(S.fire + S.fly + 2), c(S.fire + S.fly + 6), c(S.total - 1), c(S.total)]; })())`));
        same(r.join(), '-1,16,17,18,19,20,21,22,23,-1', 'cells');
        const f = JSON.parse(run(`JSON.stringify((function(){ const f = __mim(), t = __foe(f.x + 1.2, f.y); followerAttack(f, t); __tick(2); return _evoFrame(f, evolvedDef(f), frame).col; })())`)); ok(f >= 16 && f <= 23, 'the cell it draws: ' + f);
    });

    group('ITS SHEET IS BAKED, CROPPED AND TOLD TO THE GAME');
    check('img/evo/mimic.png is the cropped sheet js/evopack.js describes (144 px cells, 24 columns: the idle, GRAVITY SLAM and the shard shot), and the Mimic\'s definition says so', () => {
        const png = fs.readFileSync(path.join(ROOT, 'img/evo/mimic.png')), w = png.readUInt32BE(16), h = png.readUInt32BE(20), pk = JSON.parse(run(`JSON.stringify(EVO_PACK['img/evo/mimic.png'] || null)`));
        ok(pk, 'js/evopack.js has no entry for it'); same(pk.w, w, 'its width'); same(pk.h, h, 'its height'); same(pk.cell, 144, 'its cell'); same(pk.cols, 24, 'its columns'); same(pk.rows, 8, 'its rows');
        for (let c = 16; c < 24; c++) { let n = 0; for (let row = 0; row < 8; row++) if (pk.cells[(row * pk.cols + c) * 6 + 2] > 0) n++; same(n, 8, 'column ' + c + ' has its eight facings'); }
        const d = JSON.parse(run('JSON.stringify(EVOLUTIONS.mimic)')); same(d.sheet, 'img/evo/mimic.png', 'its sheet'); ok(d.shard, 'shard'); same(d.move, 'GRAVITY SLAM', 'its move');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
