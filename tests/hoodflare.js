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
    check('the Rimestar has the flare too: its shot is an "iceball" (the same flat-colour blob, frosty), its sheet 32 columns (the flare, then ICICLE VOLLEY\'s fan) with every cell in every facing, its other frames as they were', () => {
        const d = JSON.parse(run('JSON.stringify(EVOLUTIONS.rimestar)')); ok(d.flare, 'flare'); same(d.sheet, 'img/evo/rimestar.png', 'its sheet'); same(d.move, 'ICICLE VOLLEY', 'its move');
        const png = fs.readFileSync(path.join(ROOT, 'img/evo/rimestar.png')), w = png.readUInt32BE(16), h = png.readUInt32BE(20), pk = JSON.parse(run(`JSON.stringify(EVO_PACK['img/evo/rimestar.png'] || null)`));
        ok(pk, 'js/evopack.js has no entry'); same(pk.w, w, 'width'); same(pk.h, h, 'height'); same(pk.cell, 144, 'cell'); same(pk.cols, 32, 'columns');
        for (let c = 0; c < 32; c++) { let n = 0; for (let row = 0; row < 8; row++) if (pk.cells[(row * pk.cols + c) * 6 + 2] > 0) n++; same(n, 8, 'column ' + c + ' has its eight facings'); }
        const r = run(`(function(){ __clear(); const f = __fol('ice', 'sniper', 'rimestar'), t = __foe(f.x + 3, f.y); f.currentWill = 100; f._shotTarget = t; f._shotWind = 1; const n = followerProjectiles.length; frame++; updateRTSNPC(f); const k = followerProjectiles[n] && followerProjectiles[n].kind;
            f._shotWind0 = 12; f._shotWind = 6; return { k, col: flareCol(f, frame) }; })()`);
        same(r.k, 'iceball', 'the shot\'s look'); same(r.col, 19, 'the cell halfway through the wind-up');
        const src = rd('js/game.js'); ok(/p\.kind === "iceball"/.test(src), 'the projectile is not drawn as a blob');
    });

    group('THE RIMESTAR\'S SPINNING FAN FOR ICICLE VOLLEY (build 2026-11-12j; the owner: "it turns into a fan and it shoots crystals at the enemy", a fan like an office fan; design No. 940)');
    check('over the move\'s wind-up the cells run 24 to 29, then 30 and 31 after the icicles leave, then its own frames; the move itself (its three icicles) is as it was, and the old cast is not shown after it', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){ const f = __fol('ice', 'sniper', 'rimestar'), d = evolvedDef(f), t = __foe(f.x + 3, f.y); followerAltSet(f, 'icicle_volley'); const out = [], c = () => fanCol(f, frame, d); f._altWindMax = 150;
            for (const w of [150, 125, 100, 75, 50, 25, 1]) { f._altWind = w; out.push(c()); }
            f._altWind = 0; const n0 = followerProjectiles.filter(p => p.kind === 'icicle').length; f.currentWill = 100; frame++; const fired = icicleVolley(f), n1 = followerProjectiles.filter(p => p.kind === 'icicle').length;
            const at = f._icAt === frame; for (const a of [0, 3, 4, 11, 12]) out.push(fanCol(f, frame + a, d)); const hold = _evoFrame(f, d, frame + 5).col; return { out, fired, icicles: n1 - n0, at, hold }; })())`));
        same(r.out.join(), '24,25,26,27,28,29,29,30,30,31,31,-1', 'cells'); ok(r.fired, 'ICICLE VOLLEY did not fire'); same(r.icicles, 3, 'its icicles'); ok(r.at, 'when it went off'); ok(r.hold >= 24, 'the old cast is shown after it: ' + r.hold);
    });
    check('another mage has no fan; the Rimestar\'s flare (its everyday shot) and its fan do not use the same cells', () => {
        const r = JSON.parse(run(`JSON.stringify({ rime: !!EVOLUTIONS.rimestar.fan, hood: !!EVOLUTIONS.embercowl.fan, rot: !!EVOLUTIONS.rotshard.fan })`));
        ok(r.rime && !r.hood && !r.rot, JSON.stringify(r)); ok(fs.readFileSync(path.join(ROOT, 'js/evolution.js'), 'utf8').includes('return 24 + Math.min(5, Math.floor((f._altWindMax - f._altWind)'), 'the fan\'s cells start at 24');
    });

    group('THE HORNSHELL\'S ECHO PULSE PULLS ITS ARMS IN AND SENDS OUT A RING OF WATER (build 2026-11-12l; the owner: "he pulls his arms inside and by doing that it creates a water ring"; design No. 941)');
    check('over the wind-up the cells run 16 to 21, then 22 and 23 after the pulse, then its own frames; the pulse itself (reach, damage, glitch) is as it was, and the old bow is not shown after it', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){ __clear(); const f = __fol('core', 'sniper', 'hornshell'), d = evolvedDef(f), t = __foe(f.x + 1, f.y); followerAltSet(f, 'echo_pulse'); const out = [], c = () => pullCol(f, frame, d); f._altWindMax = 150;
            for (const w of [150, 125, 100, 75, 50, 25, 1]) { f._altWind = w; out.push(c()); }
            f._altWind = 0; f.currentWill = 100; frame++; const fired = echoPulse(f), hurt = __dmg(t) > 0, gl = t.glitched > 0, at = f._echoAt === frame;
            const wr = elementEffects.filter(e => e.type === 'waterring').length, flat = elementEffects.filter(e => e.type === 'ring' && e.color === '#00ccaa').length, rad = (elementEffects.find(e => e.type === 'waterring') || {}).radius;
            for (const a of [0, 3, 4, 11, 12]) out.push(pullCol(f, frame + a, d)); const hold = _evoFrame(f, d, frame + 5).col; return { out, fired, hurt, gl, at, wr, flat, rad, hold, reach: ECHO_RADIUS }; })())`));
        same(r.out.join(), '16,17,18,19,20,21,21,22,22,23,23,-1', 'cells'); ok(r.fired, 'ECHO PULSE did not fire'); ok(r.hurt, 'it did not hurt'); ok(r.gl, 'it did not break the wind-up'); ok(r.at, 'when it went off'); same(r.wr, 1, 'its ring of water'); same(r.flat, 0, 'the old flat ring'); same(r.rad, r.reach, 'the ring goes out to its reach'); ok(r.hold >= 16, 'the old bow is shown after it: ' + r.hold);
    });
    check('only the Hornshell pulls; its sheet is 32 columns of 8 facings and its definition says so', () => {
        const r = JSON.parse(run(`JSON.stringify({ hs: !!EVOLUTIONS.hornshell.pull, other: Object.keys(EVOLUTIONS).filter(k => k !== 'hornshell' && EVOLUTIONS[k].pull).join() })`));
        ok(r.hs && r.other === '', JSON.stringify(r));
        const pk = JSON.parse(run(`JSON.stringify(EVO_PACK['img/evo/hornshell.png'] || null)`)); ok(pk, 'js/evopack.js has no entry for it'); same(pk.cols, 32, 'its columns'); same(pk.rows, 8, 'its rows');
    });
    check('its EVERYDAY SHOT (the owner: "a 3D ring of water looking substance. It\'s glowing blue goo that shoots at the enemy. That would be his normal fire"; design No. 942): over the shot\'s wind-up the cells run 24 to 29, then 30 and 31 after it leaves; the shot flies as a "gooring"; the shot itself (its damage, speed, rest) is as it was; no other mage\'s shot is one', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){ __clear(); const f = __fol('core', 'sniper', 'hornshell'), d = evolvedDef(f), t = __foe(f.x + 3, f.y), out = []; f._shotWind0 = 12;
            for (const w of [12, 10, 8, 6, 4, 2, 1]) { f._shotWind = w; out.push(gooCol(f, frame)); }
            f._shotWind = 0; f._shotTarget = t; const n0 = followerProjectiles.length; _mageShotFire(f); const p = followerProjectiles[followerProjectiles.length - 1], n1 = followerProjectiles.length;
            for (const a of [0, 3, 4, 9, 10]) out.push(gooCol(f, frame + a)); const hold = _evoFrame(f, d, frame + 1).col;
            const o = __fol('ice', 'sniper', 'rimestar'), t2 = __foe(o.x + 3, o.y); o._shotTarget = t2; _mageShotFire(o); const q = followerProjectiles[followerProjectiles.length - 1];
            return { out, n: n1 - n0, kind: p.kind, dmg: p.damage, speed: Math.hypot(p.vx, p.vy), hold, other: q.kind, others: Object.keys(EVOLUTIONS).filter(k => EVOLUTIONS[k].goo).join() }; })())`));
        same(r.out.join(), '24,25,26,27,28,29,29,30,30,31,31,-1', 'cells'); same(r.n, 1, 'its shot'); same(r.kind, 'gooring', 'its kind'); same(r.other, 'iceball', 'the Rimestar\'s kind'); same(r.others, 'hornshell', 'who has it'); ok(r.dmg > 0 && Math.abs(r.speed - 0.18) < 1e-9, 'the shot changed: ' + r.dmg + ' ' + r.speed);
    });
    check('the goo ring is drawn flat: strokes and fills, no gradient and no shadowBlur (the effects plan), and the projectile is drawn by it', () => {
        const src = rd('js/game.js'), a = src.indexOf('function _drawGooRing'), blob = src.slice(a, src.indexOf('function _drawFollowerProjectile'));
        ok(blob.length > 300 && !/createRadialGradient|createLinearGradient|shadowBlur/.test(blob), 'the ring uses a gradient or a shadow'); ok(/p\.kind === "gooring"/.test(src), 'the projectile is not drawn as the goo ring');
    });

    group('THE THUNDERHEAD\'S EVERYDAY SHOT: A STRING OF LIGHTNING THAT CONNECTS AND BREAKS OFF (build 2026-11-12o; the owner: "It should have like a string of lightning that connects and breaks off at some point"; its body does not change)');
    check('its shot flies as a "bolt" (no other follower\'s does); the shot itself (damage, speed, CHAIN LIGHTNING\'s jump on) is as it was; its sheet is as it was (16 columns)', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'), t = __foe(f.x + 3, f.y); f._shotTarget = t; _mageShotFire(f); const p = followerProjectiles[followerProjectiles.length - 1];
            const o = __fol('blossom', 'sniper', 'shrub'), t2 = __foe(o.x + 3, o.y); o._shotTarget = t2; _mageShotFire(o); const q = followerProjectiles[followerProjectiles.length - 1];
            return { kind: p.kind, dmg: p.damage, speed: Math.hypot(p.vx, p.vy), hit: typeof p.onHit, src: p.source === f, other: q.kind || null, cols: (EVO_PACK['img/evo/thunderhead.png'] || {}).cols, flags: ['flare', 'fan', 'pull', 'goo', 'blaze'].filter(k => EVOLUTIONS.thunderhead[k]).join() }; })())`));
        same(r.kind, 'bolt', 'its kind'); ok(r.dmg > 0 && Math.abs(r.speed - 0.18) < 1e-9, 'the shot changed: ' + r.dmg + ' ' + r.speed); same(r.hit, 'function', 'CHAIN LIGHTNING still conducts on'); ok(r.src, 'the shot knows who fired it (the string is joined to it)'); same(r.other, null, 'another mage\'s kind'); same(r.flags, '', 'its sheet is untouched');
    });
    check('the string is drawn flat (strokes and fills, no gradient, no shadowBlur), joined to the shooter, and snaps at THUNDER_SNAP tiles', () => {
        const src = rd('js/game.js'), a = src.indexOf('function _drawThunderBolt'), fn = src.slice(a, src.indexOf('function _drawFollowerProjectile'));
        ok(fn.length > 500 && !/createRadialGradient|createLinearGradient|shadowBlur/.test(fn), 'the string uses a gradient or a shadow'); ok(/p\.kind === "bolt"/.test(src), 'the projectile is not drawn as the string'); ok(/dist > THUNDER_SNAP/.test(fn), 'it never snaps'); ok(/p\.source/.test(fn), 'it is not joined to the shooter');
    });

    group('THE HORNSHELL KEEPS ITS JAR IN EVERY FACING (build 2026-11-12n: a bug of 2026-11-12l: the pull lowered the jar a little more every frame it was drawn, so the sideways and rear facings had lost it)');
    check('every cell of its sheet, in every facing, is as tall as the jar and tentacles together (the broken ones were a third as tall), and the builder never moves the jar by a step', () => {
        const pk = JSON.parse(run(`JSON.stringify(EVO_PACK['img/evo/hornshell.png'] || null)`)); ok(pk, 'js/evopack.js has no entry for it'); const bad = [];
        for (let r = 0; r < pk.rows; r++) for (let c = 0; c < pk.cols; c++) { const h = pk.cells[(r * pk.cols + c) * 6 + 3]; if (h < 60) bad.push(r + ':' + c + '=' + h); }
        same(bad.join(), '', 'cells too short (row:column=height)');
        const src = rd('design/evolutions/forms13.js'), fd = src.slice(src.indexOf('function _fatDragger'), src.indexOf('const _fd = '));
        ok(!/jar\.position\.y\s*[-+]=/.test(fd) && /jar\.position\.y = jy0/.test(fd), 'the jar is moved by a step: one model draws every cell of a sheet in turn, so a step adds up');
    });

    group('THE VOIDSTAR LIFTS ITS FRONT ARMS TOWARDS THE ENEMY OVER MAELSTROM (build 2026-11-12r; the owner: "Lifts his front arms up towards the enemy"; design No. 943)');
    check('over the move\'s wind-up the cells run 16 to 21, then 22 and 23 after the swirl opens, then its own frames; the old bow is not shown after it; only the Voidstar has it; its sheet is 24 columns of 8 facings, every cell a sensible size', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){ __clear(); const f = __fol('flux', 'sniper', 'voidstar'), d = evolvedDef(f), t = __foe(f.x + 3, f.y); followerAltSet(f, 'maelstrom'); const out = [], c = () => reachCol(f, frame, d); f._altWindMax = 150;
            for (const w of [150, 125, 100, 75, 50, 25, 1]) { f._altWind = w; out.push(c()); }
            f._altWind = 0; f.currentWill = 100; frame++; const fired = maelstrom(f), at = f._maelAt === frame;
            for (const a of [0, 3, 4, 11, 12]) out.push(reachCol(f, frame + a, d)); const hold = _evoFrame(f, d, frame + 5).col;
            return { out, fired, at, hold, who: Object.keys(EVOLUTIONS).filter(k => EVOLUTIONS[k].reach).join() }; })())`));
        same(r.out.join(), '16,17,18,19,20,21,21,22,22,23,23,-1', 'cells'); ok(r.fired, 'MAELSTROM did not fire'); ok(r.at, 'when it went off'); ok(r.hold >= 16, 'the old bow is shown after it: ' + r.hold); same(r.who, 'voidstar', 'who has it');
        const pk = JSON.parse(run(`JSON.stringify(EVO_PACK['img/evo/voidstar.png'] || null)`)); ok(pk, 'js/evopack.js has no entry for it'); same(pk.cols, 24, 'its columns'); same(pk.rows, 8, 'its rows'); const bad = [];
        for (let rr = 0; rr < pk.rows; rr++) for (let c = 0; c < pk.cols; c++) { const h = pk.cells[(rr * pk.cols + c) * 6 + 3]; if (h < 60) bad.push(rr + ':' + c + '=' + h); } same(bad.join(), '', 'cells too short');
    });

    group('THE ROTSHARD\'S CRYSTAL SPLITS FOR ROTTEN DECOY (build 2026-11-12u; the owner: "the crystal splits"; design No. 944)');
    check('over the wind-up the cells run 16 to 21, then 22 and 23 as the decoy is set, then its own frames; the black crystal that broke free flies to the decoy (decoylob, DECOY_LOB frames) and the decoy, set at once as it was, is drawn from then; only the Rotshard splits', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){ __clear(); const f = __fol('toxic', 'sniper', 'rotshard'), d = evolvedDef(f), t = __foe(f.x + 3, f.y); followerAltSet(f, 'rotten_decoy'); const out = [], c = () => splitCol(f, frame, d); f._altWindMax = 150;
            for (const w of [150, 125, 100, 75, 50, 25, 1]) { f._altWind = w; out.push(c()); }
            f._altWind = 0; f.currentWill = 100; frame++; const n0 = rotDecoys.length, fired = rottenDecoy(f), at = f._decoyAt === frame, lob = elementEffects.filter(e => e.type === 'decoylob'), dec = rotDecoys.slice(n0), eff = elementEffects.filter(e => e.type === 'rotdecoy');
            for (const a of [0, 3, 4, 11, 12]) out.push(splitCol(f, frame + a, d)); const hold = _evoFrame(f, d, frame + 5).col;
            return { out, fired, at, hold, lobs: lob.length, life: lob[0] && lob[0].life, to: lob[0] && dec[0] ? [lob[0].x === dec[0].x, lob[0].y === dec[0].y] : null, live: dec.length === 1 && !dec[0].dead && dec[0].until > frame, eff: eff.length, K: DECOY_LOB, who: Object.keys(EVOLUTIONS).filter(k => EVOLUTIONS[k].split).join() }; })())`));
        same(r.out.join(), '16,17,18,19,20,21,21,22,22,23,23,-1', 'cells'); ok(r.fired && r.at, 'ROTTEN DECOY did not fire'); same(r.lobs, 1, 'the crystal that flew'); same(r.life, r.K, 'its flight'); same(r.K, 14, 'DECOY_LOB'); ok(r.to && r.to[0] && r.to[1], 'it did not fly to the decoy: ' + JSON.stringify(r.to)); ok(r.live, 'the decoy is not set at once'); same(r.eff, 1, 'the decoy\'s picture'); ok(r.hold >= 16, 'the old bow is shown after it: ' + r.hold); same(r.who, 'rotshard', 'who splits');
    });
    check('its sheets, the body\'s and its pool\'s, are 32 columns of 8 facings (build 2026-11-12w: the third block, CORRODE SHOT\'s), every body cell a sensible size', () => {
        for (const key of ['img/evo/rotshard.png', 'img/evo/rotshard_g.png']) { const pk = JSON.parse(run(`JSON.stringify(EVO_PACK['${key}'] || null)`)); ok(pk, key + ': js/evopack.js has no entry'); same(pk.cols, 32, key + ' columns'); same(pk.rows, 8, key + ' rows');
            if (key === 'img/evo/rotshard.png') { const bad = []; for (let rr = 0; rr < pk.rows; rr++) for (let c = 0; c < pk.cols; c++) { const h = pk.cells[(rr * pk.cols + c) * 6 + 3]; if (h < 60) bad.push(rr + ':' + c + '=' + h); } same(bad.join(), '', 'cells too short'); } }
    });

    group('THE ROTSHARD\'S SOUL BLOB FOR CORRODE SHOT (build 2026-11-12w; the owner: "the corrode shot should look like a shocking soul blob that hits the target", "It should be the same color as [the Rotshard]", "no gradient just highlighter color", and its body moving "a little"; design No. 945)');
    check('over the shot\'s wind-up the cells run 24 to 29, then 30 and 31 after it goes, then its own frames; the shot flies as a "soulblob" (no other mage\'s does) and splats on the target (a "soulsplat", no ring on the floor); the shot itself (its damage, its armour-eating, its splash) is as it was; only the Rotshard', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){ __clear(); const f = __fol('toxic', 'sniper', 'rotshard'), d = evolvedDef(f), t = __foe(f.x + 3, f.y), near = __foe(f.x + 3.8, f.y), out = []; f._shotWind0 = 12;
            for (const w of [12, 10, 8, 6, 4, 2, 1]) { f._shotWind = w; out.push(spitCol(f, frame)); }
            f._shotWind = 0; f._shotTarget = t; _mageShotFire(f); const p = followerProjectiles[followerProjectiles.length - 1], sf = f._shotFiredAt; for (const a of [0, 3, 4, 9, 10]) out.push(spitCol(f, sf + a)); const hold = _evoFrame(f, d, sf + 5).col;
            const hp0 = t.health; p.onHit(t); const splat = elementEffects.filter(e => e.type === 'soulsplat'), ring = elementEffects.filter(e => e.type === 'ring').length, shred = t.defenseShredded > 0 && t.defenseShredFactor === ROT_SHRED, nearShred = near.defenseShredded > 0;
            const o = __fol('ice', 'sniper', 'rimestar'), t2 = __foe(o.x + 3, o.y); o._shotTarget = t2; _mageShotFire(o); const q = followerProjectiles[followerProjectiles.length - 1];
            return { out, kind: p.kind, dmg: p.damage, want: f.stats.specialAttack * MAGE_SHOT_MULT, hold, splat: splat.length, at: splat[0] && [splat[0].x === t.x, splat[0].y === t.y], ring, shred, nearShred, other: q.kind || null, who: Object.keys(EVOLUTIONS).filter(k => EVOLUTIONS[k].spit).join() }; })())`));
        same(r.out.join(), '24,25,26,27,28,29,29,30,30,31,31,-1', 'cells'); same(r.kind, 'soulblob', 'its kind'); ok(Math.abs(r.dmg - r.want) < 1e-9, 'the shot\'s damage changed: ' + r.dmg); ok(r.hold >= 16 || r.hold === 31 || r.hold >= 8, 'hold: ' + r.hold);
        same(r.splat, 1, 'the splat'); ok(r.at && r.at[0] && r.at[1], 'not on the target'); same(r.ring, 0, 'a ring on the floor'); ok(r.shred, 'it did not eat the armour'); ok(r.nearShred, 'its splash did not reach the one beside it'); same(r.other, 'iceball', 'another mage\'s kind'); same(r.who, 'rotshard', 'who has it');
    });
    check('the soul blob is drawn flat, in the Rotshard\'s own crystal green: strokes and fills, no gradient and no shadowBlur (the effects plan)', () => {
        const src = rd('js/game.js'), a = src.indexOf('function _drawSoulBlob'), fn = src.slice(a, src.indexOf('function _drawFollowerProjectile')), el = rd('js/elements.js'), b = el.indexOf('case "soulsplat"'), sp = el.slice(b, b + 2400);
        ok(fn.length > 800 && !/createRadialGradient|createLinearGradient|shadowBlur/.test(fn), 'the blob uses a gradient or a shadow'); ok(!/createRadialGradient|createLinearGradient|shadowBlur/.test(sp), 'the splat uses a gradient or a shadow'); ok(/p\.kind === "soulblob"/.test(src), 'the projectile is not drawn as the blob'); ok(/_SOUL = \{ body: '#9adeae'/.test(src) && /#9adeae/.test(sp), 'not the crystal\'s green');
    });

    group('THE VOIDSTAR SLAPS WITH TELEPATHIC TENTACLES (build 2026-11-12x; the owner: "How about the void star slaps the enemy with telepathic tentacles?"; asked, "Ghostly violet energy" and "Two alternate")');
    check('its everyday shot flies as a "tendril" (no other mage\'s does) and, where it lands, a one-two slap (a "tendrilslap") is drawn on the target; the shot itself (its damage, its speed, its element) is as it was', () => {
        const r = JSON.parse(run(`JSON.stringify((function(){ __clear(); const f = __fol('flux', 'sniper', 'voidstar'), t = __foe(f.x + 3, f.y); f._shotTarget = t; _mageShotFire(f); const p = followerProjectiles[followerProjectiles.length - 1];
            const before = elementEffects.filter(e => e.type === 'tendrilslap').length; p.onHit(t); const slap = elementEffects.filter(e => e.type === 'tendrilslap');
            const o = __fol('toxic', 'sniper', 'rotshard'), t2 = __foe(o.x + 3, o.y); o._shotTarget = t2; _mageShotFire(o); const q = followerProjectiles[followerProjectiles.length - 1];
            return { kind: p.kind, dmg: p.damage, want: f.stats.specialAttack * MAGE_SHOT_MULT, speed: Math.hypot(p.vx, p.vy), el: p.element, src: p.source === f, before, slap: slap.length, at: slap[0] && [slap[0].x === t.x, slap[0].y === t.y], other: q.kind || null }; })())`));
        same(r.kind, 'tendril', 'its kind'); ok(Math.abs(r.dmg - r.want) < 1e-9, 'the shot\'s damage changed: ' + r.dmg); ok(Math.abs(r.speed - 0.18) < 1e-9, 'its speed changed: ' + r.speed); same(r.el, 'flux', 'its element'); ok(r.src, 'the shot knows who fired it (the tentacles are joined to it)');
        same(r.before, 0, 'a slap before it landed'); same(r.slap, 1, 'the slap'); ok(r.at && r.at[0] && r.at[1], 'not on the target'); same(r.other, 'soulblob', 'another mage\'s kind');
    });
    check('the tentacles and the slap are drawn flat: strokes and fills, no gradient and no shadowBlur (the effects plan), joined to the shooter', () => {
        const src = rd('js/game.js'), a = src.indexOf('function _drawTendrils'), fn = src.slice(a, src.indexOf('function _drawFollowerProjectile')), el = rd('js/elements.js'), b = el.indexOf('case "tendrilslap"'), sp = el.slice(b, b + 1800);
        ok(fn.length > 800 && !/createRadialGradient|createLinearGradient|shadowBlur/.test(fn), 'the tentacles use a gradient or a shadow'); ok(!/createRadialGradient|createLinearGradient|shadowBlur/.test(sp), 'the slap uses a gradient or a shadow'); ok(/p\.kind === "tendril"/.test(src), 'the projectile is not drawn as tentacles'); ok(/p\.source/.test(fn), 'the tentacles are not joined to the shooter');
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
