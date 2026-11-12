// THE EMBER HOOD'S FLARE (build 2026-11-12g; js/evolution.js flareCol, js/npc.js MAGE_SHOT_WINDUP; the owner, 2026-11-12: "Work on the mages"; of the agent's three looks for the Ember Hood's everyday FIREBALL: "Hood flare"; design No. 938).
//   its hood swells and a fireball forms in front of it over the shot's wind-up (six cells of its sheet's extra block), the shot leaves as it always did, the hood settles (two cells)
//   looks only: the shot's damage, its wind-up (rooted) and its rest are as they were; a cancelled wind-up shows no settle; every other Mage's frames are its own
//   its sheet is baked, cropped and told to the game (img/evo/embercowl.png: 24 columns)
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
        globalThis.__hood = () => { __clear(); const f = __fol('fire', 'sniper', 'embercowl'); f.currentWill = 100; f.attackCooldown = 0; return f; };
        globalThis.__tick = n => { for (let i = 0; i < n; i++) { frame++; updateElementEffects(); } };`);

    group('THE FLARE RIDES ON THE SHOT\'S WIND-UP');
    check('the cells run 16 to 21 across the wind-up, then the settle (22, 23), then its own frames', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){ const f = __hood(), c = () => flareCol(f, frame), out = []; f._shotWind0 = 12; for (const w of [12, 10, 8, 6, 4, 2, 1]) { f._shotWind = w; out.push(c()); }
            f._shotWind = 0; f._shotFiredAt = frame; for (const a of [0, 3, 4, 9, 10]) { out.push(flareCol(f, frame + a)); } return out; })())`));
        same(r.join(), '16,17,18,19,20,21,21,22,22,23,23,-1', 'cells');
    });
    check('a mage\'s shot winds up 12 frames and goes off as it did; the flare\'s columns follow it, and the shot has been fired when the settle begins', () => {
        const r = run(`(function(){ const f = __hood(), t = __foe(f.x + 3, f.y); f._shotTarget = t; f._shotWind = f._shotWind0 = MAGE_SHOT_WINDUP; const cols = [], n0 = followerProjectiles.length;
            for (let i = 0; i < MAGE_SHOT_WINDUP + 2; i++) { frame++; updateRTSNPC(f); cols.push(_evoFrame(f, evolvedDef(f), frame).col); } return { cols: cols.join(), shots: followerProjectiles.length - n0, rest: f.attackCooldown > 0, firedAt: f._shotFiredAt !== undefined }; })()`);
        same(r.shots, 1, 'shots'); ok(r.rest, 'its rest'); ok(r.firedAt, 'fired-at'); ok(/^16,16,17,17,18,18,19,19,20,20,21,21/.test(r.cols.replace(/,16,16,17,17/, ',16,16,17,17')) || /(^|,)16,/.test(r.cols), 'the columns: ' + r.cols); ok(/22/.test(r.cols), 'no settle: ' + r.cols);
    });
    check('a wind-up that is cancelled (a retreat) shows no settle; another mage\'s frames are its own', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){ const f = __hood(), t = __foe(f.x + 3, f.y); f._shotFiredAt = undefined; f._shotTarget = t; f._shotWind = f._shotWind0 = 12; f.retreatUntil = frame + 100; frame++; updateRTSNPC(f); const a = flareCol(f, frame);
            const g = __fol('toxic', 'sniper', 'rotshard'); const d = evolvedDef(g); return { a, flag: !!d.flare, hood: !!evolvedDef(f).flare }; })())`));
        same(r.a, -1, 'a settle after a cancelled wind-up'); ok(!r.flag, 'another mage has the flare'); ok(r.hood, 'the hood does not');
    });

    group('THE SHOT IN FLIGHT IS A GLOWY BLOB');
    check('the Ember Hood\'s shot is a "fireball" (drawn as a flat-colour blob: no gradient, no shadowBlur); another fire mage\'s shot is not', () => {
        const r = run(`(function(){ const f = __hood(), t = __foe(f.x + 3, f.y); f._shotTarget = t; f._shotWind = 1; const n = followerProjectiles.length; frame++; updateRTSNPC(f); const a = followerProjectiles[n] && followerProjectiles[n].kind;
            __clear(); const g = __fol('fire', 'sniper', undefined), u = __foe(g.x + 3, g.y); g._shotTarget = u; g._shotWind = 1; const m = followerProjectiles.length; frame++; updateRTSNPC(g); return { a, b: followerProjectiles[m] && followerProjectiles[m].kind }; })()`);
        same(r.a, 'fireball', 'the Hood\'s shot'); ok(r.b !== 'fireball', 'another fire shot: ' + r.b);
        const src = rd('js/game.js'), blob = src.slice(src.indexOf('function _drawFireBlob('), src.indexOf('function _drawFollowerProjectile('));
        ok(blob.length > 200 && !/createRadialGradient|createLinearGradient|shadowBlur/.test(blob), 'the blob uses a gradient or a shadow'); ok(/p\.kind === "fireball"/.test(src), 'the projectile is not drawn as a blob');
    });

    group('THE RIMESTAR\'S FLARE (build 2026-11-12i; the owner: "Fins flare", "the wings separate into two parts each, so there\'s six"; design No. 939)');
    check('the Rimestar has the flare too: its shot is an "iceball" (the same flat-colour blob, frosty), its sheet 24 columns with the flare\'s eight cells in every facing, its other frames as they were', () => {
        const d = JSON.parse(run('JSON.stringify(EVOLUTIONS.rimestar)')); ok(d.flare, 'flare'); same(d.sheet, 'img/evo/rimestar.png', 'its sheet'); same(d.move, 'ICICLE VOLLEY', 'its move');
        const png = fs.readFileSync(path.join(ROOT, 'img/evo/rimestar.png')), w = png.readUInt32BE(16), h = png.readUInt32BE(20), pk = JSON.parse(run(`JSON.stringify(EVO_PACK['img/evo/rimestar.png'] || null)`));
        ok(pk, 'js/evopack.js has no entry'); same(pk.w, w, 'width'); same(pk.h, h, 'height'); same(pk.cell, 144, 'cell'); same(pk.cols, 24, 'columns');
        for (let c = 0; c < 24; c++) { let n = 0; for (let row = 0; row < 8; row++) if (pk.cells[(row * pk.cols + c) * 6 + 2] > 0) n++; same(n, 8, 'column ' + c + ' has its eight facings'); }
        const r = run(`(function(){ __clear(); const f = __fol('ice', 'sniper', 'rimestar'), t = __foe(f.x + 3, f.y); f.currentWill = 100; f._shotTarget = t; f._shotWind = 1; const n = followerProjectiles.length; frame++; updateRTSNPC(f); const k = followerProjectiles[n] && followerProjectiles[n].kind;
            f._shotWind0 = 12; f._shotWind = 6; return { k, col: flareCol(f, frame) }; })()`);
        same(r.k, 'iceball', 'the shot\'s look'); same(r.col, 19, 'the cell halfway through the wind-up');
        const src = rd('js/game.js'); ok(/p\.kind === "iceball"/.test(src), 'the projectile is not drawn as a blob');
    });

    group('ITS SHEET IS BAKED, CROPPED AND TOLD TO THE GAME');
    check('img/evo/embercowl.png is the cropped sheet js/evopack.js describes (144 px cells, 32 columns: the idle, the old action, the flare and the lighting up for HEXFIRE), and the definition says so', () => {
        const png = fs.readFileSync(path.join(ROOT, 'img/evo/embercowl.png')), w = png.readUInt32BE(16), h = png.readUInt32BE(20), pk = JSON.parse(run(`JSON.stringify(EVO_PACK['img/evo/embercowl.png'] || null)`));
        ok(pk, 'js/evopack.js has no entry for it'); same(pk.w, w, 'its width'); same(pk.h, h, 'its height'); same(pk.cell, 144, 'its cell'); same(pk.cols, 32, 'its columns'); same(pk.rows, 8, 'its rows');
        for (let c = 16; c < 32; c++) { let n = 0; for (let row = 0; row < 8; row++) if (pk.cells[(row * pk.cols + c) * 6 + 2] > 0) n++; same(n, 8, 'column ' + c + ' has its eight facings'); }
        const d = JSON.parse(run('JSON.stringify(EVOLUTIONS.embercowl)')); same(d.sheet, 'img/evo/embercowl.png', 'its sheet'); ok(d.flare, 'flare'); same(d.shot, 'FIREBALL', 'its shot'); same(d.move, 'HEXFIRE', 'its move');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
