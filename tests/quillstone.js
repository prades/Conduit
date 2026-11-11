// THE QUILLSTONE'S ATTACKS (build 2026-11-11n; js/evolution.js quillBurst, quillFireTick, quillBurstCol, EVOLUTIONS.quillstone; design No. 927, forms15.js; the owner, 2026-11-11: "it just dives forward a little bit
// for the primary attack, and for the secondary attack, it should turn around and shoot off all of its projectiles, and they should disappear for a second"; of the agent's questions: its back to the enemy, the quills "grow back fast").
//   its sheet: baked (40 columns: the loop, the dive, QUILL BURST's three blocks), cropped, named in its definition at the bigger cell
//   QUILL BURST: it turns; the quills are launched QUILL_FIRE frames later (not at once), in the fan the move always had; it is gone from the sheet's turn, bare time and regrowth in order, then ordinary again
//   the everyday hit's dive is the action block, as the form's attack frames always were
// Every number read here is the code's own, PROVISIONAL constant. Not a look test: whether it looks right is the owner's to judge in the game.
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
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; facilityBlackoutSet(false); unlockedElements = new Set(ELEMENTS.map(e => e.id)); TUT.followerLevel = 0; for (const s of hazardSolids()) if (s.room === 'arena') facilitySolidSet(s.id, true);`);
    // An open patch of the arena's floor, the player off to one side; creatures that hold still and do not die; a follower of a form at level 20 (as tests/followercombat.js).
    run(`(function(){ const cells = partyRoomCells('arena'), set = new Set(cells.map(c => c[0] + ',' + c[1])); let best = null, bn = -1;
        for (const [x, y] of cells) { let n = 0; for (let dx = -6; dx <= 6; dx++) for (let dy = -6; dy <= 6; dy++) if (set.has((x + dx) + ',' + (y + dy))) n++; if (n > bn) { bn = n; best = [x, y]; } }
        globalThis.__C = [best[0] + 0.5, best[1] + 0.5]; player.x = player.visualX = __C[0] - 8; player.y = player.visualY = __C[1]; })();
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k] = []; followerProjectiles.length = 0; elementEffects.length = 0; floatingTexts.length = 0; frame++; };
        globalThis.__foe = (x, y, sp) => { const S = SPECIES[sp || 'ant'], p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.speciesName = sp || 'ant'; p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
        globalThis.__fol = (el, role, evo) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.evolved = evo || undefined; if (evo) energyFill(f); f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.stance = 'hold'; f.x = __C[0]; f.y = __C[1]; return f; };
        globalThis.__qs = () => { __clear(); const f = __fol('fire', 'brawler', 'quillstone'); f.currentWill = 100; f.attackCooldown = 0; return f; };
        globalThis.__go = n => { for (let i = 0; i < n; i++) { frame++; evolutionTick(); } };`);

    group('ITS SHEET: baked, cropped, named');
    check('img/evo/quillstone.png is the cropped 40-column sheet js/evopack.js describes (a 192 px cell: the same pixels a unit as before), and the definition names it', () => {
        const png = fs.readFileSync(path.join(ROOT, 'img/evo/quillstone.png')), w = png.readUInt32BE(16), h = png.readUInt32BE(20), pk = J(`EVO_PACK['img/evo/quillstone.png'] || null`);
        ok(pk, 'js/evopack.js has no entry for it'); same(pk.w, w, 'its width'); same(pk.h, h, 'its height'); same(pk.cell, 192, 'its cell'); same(pk.cols, 40, 'its columns'); same(pk.rows, 8, 'its rows');
        const d = J('EVOLUTIONS.quillstone'), m = JSON.parse(rd('img/evo/quillstone.json')); same(d.sheet, 'img/evo/quillstone.png', 'its sheet'); same(d.cell, 192, 'the definition\'s cell'); same(m.cols, 40, 'the bake\'s columns'); same(m.blocks, 3, 'the bake\'s extra blocks');
        ok(Math.abs(d.anchor[0] - m.anchor.x) < 0.5 && Math.abs(d.anchor[1] - m.anchor.y) < 0.5, 'the anchor is the bake\'s: ' + d.anchor + ' vs ' + m.anchor.x + ', ' + m.anchor.y);
        ok(Math.abs(d.core[0] - m.core.x) < 0.5 && Math.abs(d.core[1] - m.core.y) < 0.5, 'the core is the bake\'s'); ok(d.burst === true, 'the form is not marked as having QUILL BURST\'s frames');
    });
    check('what the form is is as it was: fire, brawler, QUILL BURST its only second attack', () => {
        const d = J('EVOLUTIONS.quillstone'); same(d.element, 'fire', 'element'); same(d.role, 'brawler', 'role'); same(d.move, 'QUILL BURST', 'move'); same(d.moves.join(), 'quill_burst', 'moves');
    });

    group('WHICH CELL OF A QUILL BURST (the turn, the bare time, the regrowth)');
    check('the turn is cols 16 to 23 (a cell every 3 frames), turning back is cols 24 to 27, bare standing cols 32 to 39, the regrowth cols 28 to 31, then ordinary frames', () => {
        const A = J('QUILL_ANIM'), col = a => J('quillBurstCol(' + a + ')'), total = J('QUILL_ANIM_FRAMES');
        same(col(0), 16, 'the first'); same(col(A.turn * 8 - 1), 23, 'the turn\'s last'); same(col(A.turn * 8), 24, 'turning back begins'); same(col(A.turn * 8 + A.back * 4 - 1), 27, 'turning back ends');
        same(col(A.turn * 8 + A.back * 4), 32, 'bare standing begins'); same(col(A.hold - 1) >= 32 && col(A.hold - 1) <= 39, true, 'bare standing runs to the hold'); same(col(A.hold), 28, 'the regrowth begins');
        same(col(total - 1), 31, 'the regrowth\'s last'); same(col(total), -1, 'after it, ordinary'); same(col(-1), -1, 'before it, ordinary'); same(total, A.hold + 4 * A.grow, 'its length');
    });
    check('"they should disappear for a second": the cells with no quills last about a second, between the quills leaving and growing back', () => {
        const total = J('QUILL_ANIM_FRAMES'), bare = []; for (let a = 0; a < total; a++) { const c = J('quillBurstCol(' + a + ')'); if (c === 22 || c === 23 || (c >= 24 && c <= 27) || (c >= 32 && c <= 39)) bare.push(a); }
        ok(bare.length >= 50 && bare.length <= 70, 'bare frames: ' + bare.length); for (let i = 1; i < bare.length; i++) same(bare[i], bare[i - 1] + 1, 'the bare time is not one run');
    });
    check('the quills "grow back fast": under half a second', () => {
        const A = J('QUILL_ANIM'); ok(4 * A.grow <= 30, 'the regrowth takes ' + 4 * A.grow + ' frames');
    });

    group('THE QUILLS LEAVE AFTER THE TURN BEGINS, AS THEY ALWAYS FLEW');
    check('the cast launches nothing at once; QUILL_FIRE frames later QUILL_COUNT quills leave, in the fan (QUILL_FAN degrees edge to edge), the middle one straight at the enemy, aimed as at the cast; and only once', () => {
        const r = J(`(function(){ const f = __qs(), t = __foe(f.x + 2, f.y + 0.5), a0 = Math.atan2(t.y - f.y, t.x - f.x), ok = quillBurst(f), o = { ok, at0: followerProjectiles.length, burstAt: f._burstAt === frame, sig: f._sigAt === frame, a0 };
            t.y += 1.5;   // (the enemy moves in the turn: the quills are aimed as they were at the cast)
            __go(QUILL_FIRE - 1); o.before = followerProjectiles.length; __go(1); o.at = followerProjectiles.length; o.angles = followerProjectiles.map(p => Math.atan2(p.vy, p.vx)); __go(40); o.kinds = followerProjectiles.length; return o; })()`);
        same(r.ok, true, 'it fired'); same(r.at0, 0, 'quills at the cast'); same(r.before, 0, 'quills a frame early'); same(r.at, J('QUILL_COUNT'), 'quills at QUILL_FIRE'); ok(r.burstAt && r.sig, 'its turn and its cooldown did not start at the cast');
        const F = J('[QUILL_FAN, QUILL_COUNT]'), ang = r.angles.slice().sort((x, y) => x - y), edge = (F[0] * Math.PI / 180) / 2;
        ok(Math.abs(ang[Math.floor(F[1] / 2)] - r.a0) < 1e-6, 'the middle quill is not at the enemy (as at the cast)'); ok(Math.abs(ang[0] - (r.a0 - edge)) < 1e-6 && Math.abs(ang[ang.length - 1] - (r.a0 + edge)) < 1e-6, 'the fan is not QUILL_FAN across');
        ok(r.kinds <= r.at, 'quills left again after');
    });
    check('a Quillstone that dies in the turn launches nothing', () => {
        const r = run(`(function(){ const f = __qs(), t = __foe(f.x + 2, f.y); quillBurst(f); __go(4); f.dead = true; __go(QUILL_FIRE + 5); return followerProjectiles.length; })()`);
        same(r, 0, 'quills from a dead Quillstone');
    });
    check('with no enemy in reach it does not turn or fire (the move is as it was: it fires only at one it sees)', () => {
        const r = J(`(function(){ const f = __qs(); const ok = quillBurst(f); __go(QUILL_FIRE + 2); return { ok, n: followerProjectiles.length, turned: f._burstAt !== undefined }; })()`);
        same(r.ok, false, 'it said it fired'); same(r.n, 0, 'quills'); same(r.turned, false, 'it turned');
    });

    group('WHAT THE BODY SHOWS');
    check('while it turns, goes bare and regrows the body is drawn from those cells, and from the ordinary ones before and after', () => {
        const r = J(`(function(){ const f = __qs(), t = __foe(f.x + 2, f.y), d = evolvedDef(f), at = a => { frame = f._burstAt + a; return _evoFrame(f, d, frame).col; }; const before = _evoFrame(f, d, frame).col; quillBurst(f); const b = f._burstAt;
            return { before, turn: at(1), bare: at(50), grow: at(80), after: at(QUILL_ANIM_FRAMES + 1) < 8 }; })()`);
        ok(r.before >= 0 && r.before < 8, 'before: the idle cells'); same(r.turn, 16, 'the turn'); ok(r.bare >= 32 && r.bare <= 39, 'bare: ' + r.bare); ok(r.grow >= 28 && r.grow <= 31, 'the regrowth: ' + r.grow); ok(r.after, 'after: the idle cells');
    });
    check('the everyday hit\'s dive is the action block, as the form\'s attack frames always were (cols 8 to 15, over the attack)', () => {
        const r = J(`(function(){ const f = __qs(), d = evolvedDef(f); f.state = 'attack'; const o = []; for (const a of [0, 1, 2, 3.1]) { f.attackAnim = a; o.push(_evoFrame(f, d, frame).col); } return o; })()`);
        ok(r.every(c => c >= 8 && c <= 15), 'cols ' + r.join()); ok(r[0] < r[r.length - 1], 'the dive does not run on: ' + r.join());
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
