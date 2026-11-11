// THE FROST MAW'S ATTACKS (build 2026-11-11v; js/evolution.js MAW_JAWS, chomp, mawBite; the owner, 2026-11-11, of the agent's three ideas for each: "Lunge-bite for the hit, giant jaws for CHOMP"; designs Nos. 934 and 935).
//   the everyday hit is the sheet's action block, now a lunge: looks only (the body thrown forward, the rubble left on the floor); the hit is the Brawlers' shared hit as it was
//   CHOMP drops giant jaws over the nearest enemy it can see; the bite (damage, stun, slow) lands as they shut, MAW_JAWS.snap frames after the cast: not before, once, on the enemy as it is then
//   a Maw that dies in the drop, or an enemy that does, takes or gives no bite; the cast's reach, sight, wind-up and wait are as they were
//   its sheets are baked, cropped and told to the game (img/evo/maw.png, img/evo/mawjaws.png, js/evopack.js)
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
        globalThis.__maw = () => { __clear(); const f = __fol('ice', 'brawler', 'maw'); f.currentWill = 100; f.attackCooldown = 0; return f; };
        globalThis.__tick = n => { for (let i = 0; i < n; i++) { frame++; updateElementEffects(); } };`);

    group('CHOMP DROPS GIANT JAWS AND BITES AS THEY SHUT');
    check('the cast makes the jaws on the nearest enemy and no bite yet, none until they shut', () => {
        const r = run(`(function(){ const f = __maw(), near = __foe(f.x + 1.2, f.y), far = __foe(f.x + 1.6, f.y + 0.2); const fired = chomp(f); const fx = elementEffects.filter(e => e.type === 'mawjaws');
            const out = { fired, n: fx.length, onNear: fx[0] && fx[0].target === near, at0: __dmg(near) }; __tick(MAW_JAWS.snap - 1); out.before = __dmg(near) + __dmg(far); return out; })()`);
        ok(r.fired, 'chomp did not fire'); same(r.n, 1, 'jaws made'); ok(r.onNear, 'on the nearest'); same(r.at0, 0, 'a bite at the cast'); same(r.before, 0, 'a bite before they shut');
    });
    check('the bite lands once as they shut: damage, a real stun, the slow beside it, and nothing after', () => {
        const r = run(`(function(){ const f = __maw(), t = __foe(f.x + 1.2, f.y), mate = __foe(f.x + 2.2, f.y + 0.4); chomp(f); __tick(MAW_JAWS.snap + 12); const landed = __dmg(t), out = { landed, stun: t.stunned || 0, slow: mate.slowed > 0, mateHurt: __dmg(mate) };
            __tick(MAW_JAWS.total); out.after = __dmg(t); out.gone = elementEffects.filter(e => e.type === 'mawjaws').length; return out; })()`);
        ok(r.landed > 0, 'no bite'); same(r.after, r.landed, 'a second bite'); ok(r.stun >= 60, 'no real stun'); ok(r.slow, 'the neighbour was not slowed'); same(r.mateHurt, 0, 'the neighbour was bitten'); same(r.gone, 0, 'the jaws are gone at the end');
    });
    check('the Maw closes in first (the owner: "he\'s a brawler, so whenever he attacks, he should move up to the enemy"): from 1.7 tiles it walks up to MAW_STAND, a step a frame, and the bite lands only after it arrived plus the jaws\' drop', () => {
        const r = run(`(function(){ const f = __maw(), t = __foe(f.x + 1.7, f.y); const d0 = Math.hypot(t.x - f.x, t.y - f.y); chomp(f); const e = elementEffects.find(e => e.type === 'mawjaws'), go = e.go;
            const out = { d0, go, sig0: f._sigAt }; __tick(go - 1); out.mid = Math.hypot(t.x - f.x, t.y - f.y); out.hurtMid = __dmg(t); __tick(1); out.dEnd = Math.hypot(t.x - f.x, t.y - f.y); out.sig = f._sigAt !== undefined; out.state = f.state;
            __tick(MAW_JAWS.snap - 1); out.before = __dmg(t); __tick(1); out.after = __dmg(t); return out; })()`);
        ok(r.go >= 1, 'it did not need to close in: ' + JSON.stringify(r)); ok(r.d0 - r.mid > 0.3, 'it did not walk: ' + JSON.stringify(r)); ok(Math.abs(r.dEnd - 0.8) < 0.02, 'it did not stop at MAW_STAND: ' + JSON.stringify(r));
        same(r.hurtMid, 0, 'bitten while closing in'); ok(r.sig && r.state === 'attack', 'its lunge-bite did not begin as it arrived'); same(r.before, 0, 'a bite before the jaws shut'); ok(r.after > 0, 'no bite as they shut');
    });
    check('the jaws follow the enemy down, and the bite is where it is then', () => {
        const r = run(`(function(){ const f = __maw(), t = __foe(f.x + 1.2, f.y); chomp(f); t.x += 0.4; __tick(4); return { x: elementEffects.find(e => e.type === 'mawjaws').x, tx: t.x }; })()`);
        same(r.x, r.tx, 'the jaws stayed where the enemy was');
    });
    check('a Maw that dies in the drop bites nothing; an enemy that dies in it takes no bite', () => {
        const r = run(`(function(){ const f = __maw(), t = __foe(f.x + 1.2, f.y); chomp(f); __tick(6); f.dead = true; __tick(MAW_JAWS.total); const a = __dmg(t);
            const g = __maw(), u = __foe(g.x + 1.2, g.y); chomp(g); __tick(6); u.dead = true; const hp = u.health; __tick(MAW_JAWS.total); return { a, b: u.health - hp }; })()`);
        same(r.a, 0, 'the dead Maw bit'); same(r.b, 0, 'the dead enemy was bitten');
    });
    check('the reach and the wait are as they were: nothing in reach, no jaws and no wait; with an enemy, the wind-up as before', () => {
        const r = run(`(function(){ const f = __maw(), none = chomp(f); const lone = __foe(f.x + MAW_RANGE + 2, f.y); const farFired = chomp(f); const near = __foe(f.x + 1, f.y); const fired = chomp(f);
            return { none, farFired, fired, cd: f._sigCd, wind: moveWindupFrames('chomp'), jaws: elementEffects.filter(e => e.type === 'mawjaws').length }; })()`);
        ok(!r.none && !r.farFired, 'it cast with nothing in reach'); ok(r.fired, 'it did not cast in reach'); same(r.cd, r.wind, 'its wait'); same(r.jaws, 1, 'jaws made');
    });

    group('ITS SHEETS ARE BAKED, CROPPED AND TOLD TO THE GAME');
    check('img/evo/mawjaws.png is the cropped sheet js/evopack.js describes (16 jaw cells in columns 16 to 31 of one row), and the Maw\'s definition names it', () => {
        const png = fs.readFileSync(path.join(ROOT, 'img/evo/mawjaws.png')), w = png.readUInt32BE(16), h = png.readUInt32BE(20), pk = JSON.parse(run(`JSON.stringify(EVO_PACK['img/evo/mawjaws.png'] || null)`));
        ok(pk, 'js/evopack.js has no entry for it'); same(pk.w, w, 'its width'); same(pk.h, h, 'its height'); same(pk.cell, 256, 'its cell'); same(pk.cols, 32, 'its columns');
        let filled = 0; for (let c = 16; c < 32; c++) if (pk.cells[(0 * pk.cols + c) * 6 + 2] > 0) filled++; same(filled, 16, 'the jaw cells in row 0');
        for (let c = 0; c < 16; c++) same(pk.cells[c * 6 + 2], 0, 'column ' + c + ' is empty');
        const d = JSON.parse(run('JSON.stringify(EVOLUTIONS.maw.jaws)')); same(d.sheet, 'img/evo/mawjaws.png', 'the definition\'s sheet'); same(d.cell, 256, 'the definition\'s cell');
    });
    check('the Maw\'s own sheet is still 16 columns of 144 px and its definition keeps its move', () => {
        const pk = JSON.parse(run(`JSON.stringify(EVO_PACK['img/evo/maw.png'] || null)`)), d = JSON.parse(run('JSON.stringify(EVOLUTIONS.maw)'));
        ok(pk, 'no entry'); same(pk.cell, 144, 'its cell'); same(pk.cols, 16, 'its columns'); same(d.move, 'CHOMP', 'its move'); same(d.sheet, 'img/evo/maw.png', 'its sheet');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
