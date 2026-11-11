// THE ELECTRO SKINK'S SWIRL (build 2026-11-11k; js/evolution.js SKINK_SWIRL; the owner, 2026-11-11: "what would be cool is if he like swirls around the enemy in a vortex really fast and then pops
// back to natural form"; "Looks only", one hit ("you should just have one number"), the chain "Drop it", "Slashing" (its form's type already), "keep it as is" for the look; design No. 926).
//   its everyday hit is a vortex at the enemy and ONE hit landing as the ring closes, SKINK_SWIRL.mult × its ATK, one enemy (no chain), the same hit the old chain's first jump made
//   the Skink's own body is not drawn while it swirls and is back after; a target that dies in the coil takes no hit; a Skink that dies ends the vortex
//   every other electric follower keeps its CHAIN LIGHTNING; with no WILL the Skink makes the plain hit, no swirl
//   its sheet is baked, cropped and told to the game (img/evo/skinkswirl.png, js/evopack.js)
// Every number read here is the code's own, PROVISIONAL constant. Not a look test: the picture is the owner's to judge in the game.
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
        globalThis.__skink = () => { __clear(); const f = __fol('electric', 'brawler', 'electroskink'); f.currentWill = 100; f.attackCooldown = 0; return f; };
        globalThis.__tick = n => { for (let i = 0; i < n; i++) { frame++; updateElementEffects(); } };`);

    group('THE ELECTRO SKINK\'S EVERYDAY HIT IS A SWIRL');
    check('it is a vortex at the enemy: one effect, no hit at once, none before the ring closes', () => {
        const r = run(`(function(){ const f = __skink(), t = __foe(f.x + 1.5, f.y); followerAttack(f, t);
            const fx = elementEffects.filter(e => e.type === 'skinkswirl'), at0 = __dmg(t), out = { n: fx.length, at0, atX: fx[0] && fx[0].x, onTarget: fx[0] && fx[0].target === t };
            __tick(SKINK_SWIRL.coil - 1); out.before = __dmg(t); return out; })()`);
        same(r.n, 1, 'swirl effects made'); same(r.at0, 0, 'damage at the start'); ok(r.onTarget, 'the vortex is on the enemy'); same(r.before, 0, 'damage before the ring closes');
    });
    check('ONE hit lands as the ring closes, and no more through the spin and the release: the old chain\'s first jump (0.35 × its ATK), the same as a direct hit', () => {
        const r = run(`(function(){ const f = __skink(), t = __foe(f.x + 1.5, f.y), twin = __foe(f.x + 1.5, f.y + 4); followerAttack(f, t);
            __tick(SKINK_SWIRL.coil); const landed = __dmg(t); __tick(SKINK_SWIRL_FRAMES);
            applyElementalDamage(twin, f.stats.attack * SKINK_SWIRL.mult, f, 'electric', DMG_HIT_MAIN);
            return { landed, after: __dmg(t), direct: __dmg(twin), mult: SKINK_SWIRL.mult, gone: elementEffects.filter(e => e.type === 'skinkswirl').length }; })()`);
        ok(r.landed > 0, 'no hit landed'); same(r.after, r.landed, 'a second hit landed'); same(r.landed, r.direct, 'it is not the direct hit\'s damage'); same(r.mult, 0.35, 'its number'); same(r.gone, 0, 'the vortex is gone at its end');
    });
    check('one enemy: no chain to another within three tiles', () => {
        const r = run(`(function(){ const f = __skink(), t = __foe(f.x + 1.5, f.y), near = __foe(f.x + 2.5, f.y), also = __foe(f.x + 1.5, f.y + 1.5); followerAttack(f, t); __tick(SKINK_SWIRL_FRAMES);
            return { t: __dmg(t), near: __dmg(near), also: __dmg(also), chain: elementEffects.some(e => e.type === 'chain') }; })()`);
        ok(r.t > 0, 'the target took no hit'); same(r.near, 0, 'the next enemy took damage'); same(r.also, 0, 'a second enemy took damage'); ok(!r.chain, 'a chain was drawn');
    });
    check('it costs the WILL and rests as the old hit did (the swirl is not free, nor faster)', () => {
        const r = run(`(function(){ const f = __skink(), t = __foe(f.x + 1.5, f.y), w0 = f.currentWill; followerAttack(f, t); return { spent: w0 - f.currentWill, cost: WILL_COST_PHYSICAL, rest: f.attackCooldown, want: followerRest(f, 40) }; })()`);
        same(r.spent, r.cost, 'the WILL spent'); same(r.rest, r.want, 'the rest');
    });
    check('with no WILL it makes the plain hit (a quarter of its ATK) and no swirl', () => {
        const r = run(`(function(){ const f = __skink(); f.currentWill = 0; const t = __foe(f.x + 1.5, f.y); followerAttack(f, t); __tick(SKINK_SWIRL_FRAMES);
            return { n: elementEffects.length, hurt: __dmg(t) > 0, swirling: skinkSwirling(f) }; })()`);
        ok(r.hurt, 'the plain hit did not land'); ok(!r.swirling, 'it swirled with no WILL');
    });

    group('THE SKINK POPS OUT OF THE FLOOR AND BACK');
    check('its own body is hidden from the first frame to the last of the vortex, then it is back', () => {
        const r = run(`(function(){ const f = __skink(), t = __foe(f.x + 1.5, f.y), before = skinkSwirling(f); followerAttack(f, t);
            const first = skinkSwirling(f); __tick(SKINK_SWIRL_FRAMES - 1); const last = skinkSwirling(f); __tick(1); return { before, first, last, after: skinkSwirling(f) }; })()`);
        ok(!r.before, 'hidden before it attacked'); ok(r.first, 'not hidden as it started'); ok(r.last, 'back before the vortex ended'); ok(!r.after, 'still hidden after the vortex');
    });
    check('a target that dies in the coil takes no hit, and the vortex plays on without a fault', () => {
        const r = run(`(function(){ const f = __skink(), t = __foe(f.x + 1.5, f.y); followerAttack(f, t); __tick(2); t.dead = true; const h = t.health; __tick(SKINK_SWIRL_FRAMES); return { same: t.health === h }; })()`);
        ok(r.same, 'a dead enemy was hit');
    });
    check('a Skink that dies ends the vortex, and no hit lands', () => {
        const r = run(`(function(){ const f = __skink(), t = __foe(f.x + 1.5, f.y); followerAttack(f, t); __tick(2); f.dead = true; __tick(SKINK_SWIRL_FRAMES); return { hurt: __dmg(t), left: elementEffects.filter(e => e.type === 'skinkswirl').length }; })()`);
        same(r.hurt, 0, 'a dead Skink hit'); same(r.left, 0, 'the vortex went on');
    });
    check('it does not start a second vortex while one is playing (a fast attack card)', () => {
        const r = run(`(function(){ const f = __skink(), t = __foe(f.x + 1.5, f.y); followerAttack(f, t); f.attackCooldown = 0; __tick(3); followerAttack(f, t); return elementEffects.filter(e => e.type === 'skinkswirl').length; })()`);
        same(r, 1, 'vortexes at once');
    });
    check('the cells it shows: the coil from the action block, the ring spinning from the idle block, the release the coil backward', () => {
        const r = run(`(function(){ const S = SKINK_SWIRL, c = a => skinkSwirlCol(a); return { start: c(0), coilEnd: c(S.coil - 1), spin0: c(S.coil), spin8: c(S.coil + 8), relStart: c(S.coil + S.spin), relEnd: c(SKINK_SWIRL_FRAMES - 1) }; })()`);
        same(r.start, 8, 'the first cell'); same(r.coilEnd, 15, 'the coil\'s last'); same(r.spin0, 0, 'the spin\'s first'); same(r.spin8, 0, 'the spin loops every 8'); same(r.relStart, 15, 'the release starts closed'); same(r.relEnd, 8, 'the release ends open');
    });

    group('EVERY OTHER ELECTRIC FOLLOWER KEEPS ITS CHAIN LIGHTNING');
    check('a Hover Shell\'s everyday hit is still the chain, with no swirl', () => {
        const r = run(`(function(){ __clear(); const f = __fol('electric', 'camper', 'hovershell'); f.currentWill = 100; f.attackCooldown = 0; const t = __foe(f.x + 1.5, f.y), n = __foe(f.x + 2.5, f.y); followerAttack(f, t);
            return { chain: elementEffects.some(e => e.type === 'chain'), swirl: elementEffects.some(e => e.type === 'skinkswirl'), jumped: __dmg(n) > 0 }; })()`);
        ok(r.chain, 'no chain'); ok(!r.swirl, 'a swirl'); ok(r.jumped, 'the chain did not jump');
    });

    group('ITS SHEET IS BAKED, CROPPED AND TOLD TO THE GAME');
    check('img/evo/skinkswirl.png is the cropped sheet js/evopack.js describes, and the Skink\'s definition names it', () => {
        const png = fs.readFileSync(path.join(ROOT, 'img/evo/skinkswirl.png')), w = png.readUInt32BE(16), h = png.readUInt32BE(20);
        const P = run(`JSON.stringify(EVO_PACK['img/evo/skinkswirl.png'] || null)`), pk = JSON.parse(P);
        ok(pk, 'js/evopack.js has no entry for it'); same(pk.w, w, 'its width'); same(pk.h, h, 'its height'); same(pk.cell, 192, 'its cell'); same(pk.cols, 16, 'its columns'); same(pk.rows, 8, 'its rows');
        const d = JSON.parse(run('JSON.stringify(EVOLUTIONS.electroskink.swirl)'));
        same(d.sheet, 'img/evo/skinkswirl.png', 'the definition\'s sheet'); same(d.cell, 192, 'the definition\'s cell'); same(d.anchor[0], 96, 'its anchor x');
    });
    check('the Skink\'s own sheet and definition are as they were (the swirl is an addition)', () => {
        const d = JSON.parse(run('JSON.stringify(EVOLUTIONS.electroskink)'));
        same(d.sheet, 'img/evo/electroskink.png', 'its own sheet'); same(d.cell, 192, 'its cell'); same(d.moves[0], 'zigzag_dash', 'its second attack');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
