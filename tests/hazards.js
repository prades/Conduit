// THE HAZARD CONTAINERS (js/hazards.js; docs/FACILITY.md, "The hazard containers"). The owner, 2026-11-10: "containers on the map that contain explosives ... and some that contain acid, I guess, or like corrosive
// material, and the flux move can work on it. And we're going to put one in the sewer ... and then two explosive ones in the arena"; of the behaviour offered (compressed air dropped): a shot from anyone sets one
// off and FLUX MOVE carries it safely; the EXPLOSIVE one's blast hurts everything within about 2 tiles, your side included, and sets off any other container caught in it; the CORROSIVE one leaves a pool about 1.5
// tiles across that eats at anything standing in it for about 10 seconds; "Comes back" (after about a minute, where it stood). The look: "4 Flask in hex armour" (design/props/models/hazard.js).
// Run in the sandbox against the real map; a real shot (firePlayerShot, stepped with render()) sets the first one off.
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

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860; innerWidth = 1100;');
    run(`globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__ant = (x, y) => { const e = spawnCreature({ species: 'ant', className: 'scout' }); e.x = x; e.y = y; e.update = () => {}; e.health = e.maxHealth = 5000; return e; };
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator)); followerProjectiles = []; elementEffects.length = 0; };
        globalThis.__fresh = () => { __clear(); hazardsReset(); for (const s of hazardSolids()) if (s.open) facilitySolidSet(s.id, false); };   // (every container back on its tile, no fuse, no pool)
        globalThis.__S = id => _fp.F.solids.find(s => s.id === id);
        globalThis.__steps = (n) => { for (let i = 0; i < n; i++) { frame++; hazardsTick(); } };
        globalThis.__mapOk = (id) => { const s = __S(id), F = _fp.F; let bad = 0; for (let x = Math.floor(s.bb[0]) - 1; x <= Math.ceil(s.bb[2]) + 1; x++) for (let y = Math.floor(s.bb[1]) - 1; y <= Math.ceil(s.bb[3]) + 1; y++) { const k = x + ',' + y; if (facilityWalkable(x, y, F) !== _fp.cells.has(k)) bad++; if (_fp.cells.has(k) !== worldTileMap.has(k)) bad++; } return bad === 0 && world.length === _fp.cells.size; };`);

    group('ON THE MAP');
    check('two explosive containers in the arena and a corrosive one in the sewer, each a one-tile solid that FLUX MOVE moves (range 2), gives cover and stops shots, and lets sight pass over it', () => {
        const r = J(`(function(){ const H = _fp.F.solids.filter(s => /^hazard_/.test(s.kind)).map(s => ({ id: s.id, kind: s.kind, room: s.room, at: [Math.round((s.bb[0] + s.bb[2]) / 2), Math.round((s.bb[1] + s.bb[3]) / 2)], w: s.bb[2] - s.bb[0], h: s.bb[3] - s.bb[1], flux: !!fluxObject(s.id), range: s.flux && s.flux.range, cover: !!s.cover, low: !!s.low, floor: _fp.cells.has(Math.round((s.bb[0] + s.bb[2]) / 2) + ',' + Math.round((s.bb[1] + s.bb[3]) / 2)) })); return H; })()`);
        same(r.length, 5, 'containers');   // (and the Nest's two since build 2026-11-12a: the flask by the cracked wall, the acid flask by the resin seal: js/nestways.js) same(r.filter(h => h.kind === 'hazard_explosive' && h.room === 'arena').length, 2, 'explosive ones in the arena'); same(r.filter(h => h.kind === 'hazard_corrosive' && h.room === 'sewers').length, 1, 'corrosive ones in the sewer');
        for (const h of r) { same(h.w + 'x' + h.h, '1x1', h.id + ' size'); ok(h.flux && h.range === 2, h.id + ' is not moved by FLUX MOVE (range 2)'); ok(h.cover && h.low, h.id + ' does not give cover or blocks sight'); same(h.floor, false, h.id + ' stands on walkable floor'); }
        same(r.map(h => h.id + '@' + h.at).sort().join(' '), 'hazard_c1@-3,112 hazard_c2@23,202 hazard_x1@35,47 hazard_x2@38,54 hazard_x3@9,192', 'where they stand');
    });
    check('their sprite: the hazard sheet has both kinds (a flask in hex armour), neither touching its canvas edge, and each container resolves to its own kind; its model is in the repository', () => {
        const r = J(`(function(){ const A = PROP_ATLAS.hazard; return { cells: A ? Object.keys(A.cells).sort().join() : null, edge: A ? Object.values(A.cells).some(c => c.edge) : null, fam: [PS_FAMILY.hazard_explosive, PS_FAMILY.hazard_corrosive].join(), x: _psResolve('hazard', 'hazard_explosive', '1x1', null, 3), c: _psResolve('hazard', 'hazard_corrosive', '1x1', null, 3) }; })()`);
        same(r.cells, 'hazard_corrosive,hazard_explosive', 'cells'); same(r.edge, false, 'a cell touches its canvas edge'); same(r.fam, 'hazard,hazard', 'the family'); same(r.x, 'hazard_explosive', 'explosive'); same(r.c, 'hazard_corrosive', 'corrosive');
        ok(fs.existsSync(path.join(ROOT, 'design/props/models/hazard.js')) && fs.statSync(path.join(ROOT, 'img/props/hazard.png')).size < 200000, 'the model or the sheet');
    });

    group('A SHOT SETS ONE OFF; THE EXPLOSIVE ONE\'S BLAST');
    check('the player\'s round at an ant behind an explosive container stops on it and sets it off: it is taken off its tile (floor now), the blast hurts those within 2 tiles (more near the middle), your side and you included, and nothing further off', () => {
        const r = J(`(function(){ __fresh(); const s = __S('hazard_x1'), o = {};
            const behind = __ant(35, 45.2), near = __ant(36.2, 47.2), far = __ant(32, 49.6);   // the ant shot at (1.8 tiles beyond it), one beside it, one 3.9 tiles off (off the shot's line)
            spawnFollowerAtCrystal('core'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.x = 34; f.y = 48; const fh = f.health;
            __put(35, 51.5); player.invuln = 0; const hp0 = health; playerAmmo = 20; player.attackCooldown = 0; player.selectedElement = null;
            // (the player 4.5 tiles from it: the round flies over no cover of the player's own)
            o.fired = firePlayerShot(behind); for (let i = 0; i < 120 && followerProjectiles.length; i++) render(); render();
            o.open = !!s.open; o.floor = _fp.cells.has('35,47'); o.map = __mapOk('hazard_x1');
            o.behind = 5000 - behind.health; o.near = 5000 - near.health; o.far = 5000 - far.health; o.follower = fh - f.health; o.player = hp0 - health; o.x2 = !__S('hazard_x2').open;
            o.flux = fluxObject('hazard_x1'); o.blasts = _hz.blasts.length; return o; })()`);
        ok(r.fired, 'the shot was not fired'); same(r.open, true, 'the container went off'); same(r.floor, true, 'its tile is floor'); same(r.map, true, 'the floor round it matches the map');
        ok(r.near >= 20 && r.near <= 30, 'the ant beside it took ' + r.near); ok(r.behind > 0 && r.behind < r.near, 'the ant 1.8 tiles off took ' + r.behind + ' (less than beside it)'); same(r.far, 0, 'the ant 3.9 tiles off');
        ok(r.follower > 0, 'your follower 1.1 tiles off was not hurt'); same(r.player, 0, 'the player 4.5 tiles off lost health'); same(r.x2, true, 'the other one (8 tiles off) went off'); same(r.flux, null, 'FLUX MOVE can pick it while it is away'); ok(r.blasts >= 1, 'no blast drawn');
    });
    check('the player within 2 tiles loses a heart (as from any hit), and a container caught in a blast goes off a moment later (a chain), even when FLUX MOVE carried it there; FLUX MOVE itself never sets one off', () => {
        const r = J(`(function(){ __fresh(); const s1 = __S('hazard_x1');
            const s2 = __S('hazard_x2'), H = fluxHere(s2), o = {};
            const mv = facilitySolidMove('hazard_x2', 38, 52, 1, 1, false); o.moved = mv.ok && !s2.open;   // (2 tiles: FLUX MOVE's reach)
            const mv2 = facilitySolidMove('hazard_x1', 37, 50, 1, 1, false); o.moved2 = mv2.ok && !s1.open && _hz.st.size === 0;
            __put(37, 48.6); player.invuln = 0; const hp0 = health;
            hazardTrigger(s1, 0); __steps(1); o.first = !!s1.open; o.fuse = _hz.st.get('hazard_x2') && _hz.st.get('hazard_x2').fuse; o.second0 = !!s2.open;
            __steps(HAZARD.chainDelay + 1); o.second = !!s2.open; o.player = hp0 - health; o.map = __mapOk('hazard_x1') && __mapOk('hazard_x2'); return o; })()`);
        same(r.moved, true, 'FLUX MOVE moved the second'); same(r.moved2, true, 'FLUX MOVE moved the first, and setting nothing off'); same(r.first, true, 'the first went off'); ok(r.fuse > 0, 'the second\'s fuse was not lit'); same(r.second0, false, 'the second went off at once');
        same(r.second, true, 'the second did not go off'); same(r.player, 1, 'hearts the player lost'); same(r.map, true, 'the floor round them');
    });

    group('THE CORROSIVE ONE\'S POOL; COMING BACK');
    check('the corrosive container bursts into a pool about 1.5 tiles across that eats at everyone standing in it, a little hit every half second, for 10 seconds, and then is gone', () => {
        const r = J(`(function(){ __fresh(); const s = __S('hazard_c1'), o = {}; const [cx, cy] = hazardCentre(s);
            hazardTrigger(s, 0); __steps(1); o.open = !!s.open; o.pools = _hz.pools.length;
            const inside = __ant(cx + 0.4, cy + 0.3), out = __ant(cx + 1.4, cy), f0 = frame; __steps(HAZARD.poolFrames + 30);
            o.inside = 5000 - inside.health; o.out = 5000 - out.health; o.left = _hz.pools.length; o.map = __mapOk('hazard_c1'); return o; })()`);
        same(r.open, true, 'it went off'); same(r.pools, 1, 'pools'); ok(r.inside >= 54 && r.inside <= 63, 'the ant in it took ' + r.inside + ' over 10 s (3 every half second)'); same(r.out, 0, 'the ant 1.4 tiles off'); same(r.left, 0, 'the pool is gone after 10 s');
        same(r.map, true, 'the floor round it');
    });
    check('a container that went off comes back on its tile after a minute (not before), waits while someone stands there, and is a solid again: not floor, moved by FLUX MOVE, set off by a shot', () => {
        const r = J(`(function(){ __fresh(); const s = __S('hazard_c1'), o = {}; const [cx, cy] = hazardCentre(s);
            o.went = hazardTrigger(s, 0); __steps(1); o.gone = !!s.open; __steps(HAZARD.back - 60); o.early = !!s.open;
            const sit = __ant(cx, cy); __steps(120); o.waits = !!s.open;
            sit.x = cx + 3; __steps(2); o.back = !s.open; o.floor = _fp.cells.has(cx + ',' + cy); o.flux = !!fluxObject('hazard_c1'); o.map = __mapOk('hazard_c1');
            o.again = hazardShot(s); __steps(1); o.off2 = !!s.open; return o; })()`);
        same(r.went && r.gone, true, 'it did not go off'); same(r.early, true, 'it came back before a minute'); same(r.waits, true, 'it came back under an ant'); same(r.back, true, 'it did not come back'); same(r.floor, false, 'its tile is still floor');
        same(r.flux, true, 'FLUX MOVE cannot pick it'); same(r.map, true, 'the floor round it'); same(r.again, true, 'a shot does not set it off again'); same(r.off2, true, 'it did not go off again');
    });

    group('DRAWING, AND A NEW GAME');
    check('a container draws (present, with its fuse lit, and away), the acid on the floor and the blast and splash draw, in every graphics level, without throwing; a new game puts every container back and clears the pools', () => {
        const r = J(`(function(){ __fresh(); let err = null; const o = {};
            try { for (const low of [false, true]) { gfxLow = low; for (const id of ['hazard_x1', 'hazard_x2', 'hazard_c1']) { const s = __S(id); if (s.open) facilitySolidSet(id, false); const it = _fp.items.find(i => i.fp === 'prop' && i.id === id); __put((s.bb[0] + s.bb[2]) / 2 + 2, (s.bb[1] + s.bb[3]) / 2 + 2); drawFacilityItem(it); hazardTrigger(s, 30); drawFacilityItem(it); __steps(31); drawFacilityItem(it); drawHazardBlasts(); const [cx, cy] = hazardCentre(s); drawAcidOnTile(Math.round(cx), Math.round(cy), 600, 400); drawAcidOnTile(Math.round(cx) + 1, Math.round(cy), 660, 430); } } } catch (e) { err = e.message; }
            gfxLow = false; o.err = err; o.pools = _hz.pools.length; o.blasts = _hz.blasts.length;
            facilityResetState(); o.after = _hz.pools.length + _hz.blasts.length + _hz.st.size; return o; })()`);
        same(r.err, null, 'drawing threw'); ok(r.pools >= 1 && r.blasts >= 1, 'nothing to draw: ' + r.pools + ' pools, ' + r.blasts + ' blasts'); same(r.after, 0, 'a new game left pools, blasts or fuses');
    });
    check('the rules\' numbers are the ones offered (provisional): a 2-tile blast, a pool about 1.5 tiles across for 10 seconds, back after a minute; and the page loads the script and preloads the sheet', () => {
        const r = J('[HAZARD.blastR, HAZARD.poolR * 2, HAZARD.poolFrames / 60, HAZARD.back / 60]'); same(r.join(), '2,1.5,10,60', 'blast, pool, its seconds, the comeback\'s');
        const h = rd('game.html'); ok(/<script src="js\/hazards\.js\?v=[^"]+"><\/script>/.test(h) && h.indexOf('js/hazards.js') > h.indexOf('js/firebombs.js'), 'the script'); ok(/<link rel="preload" as="image" href="img\/props\/hazard\.(webp|png)\?v=/.test(h), 'the preload');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
