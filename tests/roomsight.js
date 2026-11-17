// ONLY THE ROOM YOU ARE IN SHOWS ITS CREATURES (the owner, 2026-11-17: "Shouldn't be able to see enemies in other rooms. Only the rooms that you're in."; js/facilityplay.js facilityShowsActor).
// A creature not of yours in another room is not drawn (2D and the 3D view), cannot be tapped, and is not locked by the gun; one in your room is; yours always are; a creature a card battle is
// walking you to is; the Nest's tunnels and caves are one place; a card battle takes in only the creatures of its creature's room. The game logic, in the sandbox.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860;');
    // two rooms that share a doorway, the player in the middle of the first
    run(`globalThis.__pair = (() => { for (const o of _fp.F.openings || []) if (o && o.rooms && o.rooms.length === 2 && o.rooms[0] !== o.rooms[1] && !FP_NEST_ROOMS.has(o.rooms[0]) && partyRoomCells(o.rooms[0]).length > 20 && partyRoomCells(o.rooms[1]).length > 20) return o.rooms; return null; })();
        globalThis.__mid = room => { const cs = partyRoomCells(room); return cs[Math.floor(cs.length / 2)]; };
        globalThis.__fresh = () => { cardBattleReset(); actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; frame = 2000;
            const c = __mid(__pair[0]); player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1]; player.fpPath = null; };
        globalThis.__ant = room => { const c = __mid(room), e = spawnCreature({ species: 'ant', className: 'scout' }); e.x = c[0]; e.y = c[1]; e.moveSpeed = 0; e.baseMoveSpeed = 0; e.provoked = false; e.state = 'wander'; return e; };`);
    console.log('\nTHE ROOM YOU ARE IN (rooms ' + J('__pair') + ')');
    check('a creature in your room shows; one in the next room does not; your follower in the next room does', () => {
        const r = J(`(function(){ __fresh(); const here = __ant(__pair[0]), there = __ant(__pair[1]); frame++;
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1], c = __mid(__pair[1]); f.x = c[0]; f.y = c[1];
            return { here: facilityShowsActor(here), there: facilityShowsActor(there), mine: facilityShowsActor(f), me: facilityShowsActor(player) }; })()`);
        same(r.here, true, 'one in your room'); same(r.there, false, 'one in the next room'); same(r.mine, true, 'your follower'); same(r.me, true, 'you');
    });
    check('walk into the next room: it is the other way round', () => {
        const r = J(`(function(){ __fresh(); const a = __ant(__pair[0]), b = __ant(__pair[1]); const c = __mid(__pair[1]); player.x = c[0] + 0.3; player.y = c[1]; frame++;
            return { a: facilityShowsActor(a), b: facilityShowsActor(b) }; })()`);
        same(r.a, false, 'the one you left'); same(r.b, true, 'the one in the room you are in');
    });
    check('the one in the next room is not drawn (2D), not tapped and not locked by the gun', () => {
        const r = J(`(function(){ __fresh(); const there = __ant(__pair[1]); frame++;
            const ex = isoSX(there.x, there.y) + canvas.width / 2, ey = isoSY(there.x, there.y) + canvas.height / 2 + TILE_H - facilityLiftRel(there.x, there.y) - 55;
            const tapped = findEnemyAtScreen(ex, ey) === there; const saved = TARGET.range; TARGET.range = 99; const locked = targetNearest() === there; TARGET.range = saved;
            return { tapped, locked }; })()`);
        same(r.tapped, false, 'tapped'); same(r.locked, false, 'locked');
    });
    check('the Nest\'s tunnels and caves are one place', () => {
        const r = J(`(function(){ const ns = [...FP_NEST_ROOMS].filter(id => partyRoomCells(id).length > 5); if (ns.length < 2) return { skip: true }; __fresh();
            const c = __mid(ns[0]); player.x = c[0]; player.y = c[1]; const a = __ant(ns[1]); a.x = __mid(ns[1])[0]; a.y = __mid(ns[1])[1]; frame++; return { shown: facilityShowsActor(a) }; })()`);
        if (!r.skip) same(r.shown, true, 'a creature in another part of the Nest');
    });
    check('a card battle: the creature it walks you to shows even in another room; a battle takes in only its creature\'s room', () => {
        const r = J(`(function(){ __fresh(); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const there = __ant(__pair[1]); frame++;
            const o = { before: facilityShowsActor(there) }; _cb.phase = 'walk'; _cb.foes = [there]; o.walking = facilityShowsActor(there); cardBattleReset();
            const near = __ant(__pair[1]); near.x = there.x + 0.8; near.y = there.y; const g2 = _cbGroup(there).indexOf(near) >= 0;
            CARD_BATTLE.on = false; return { before: o.before, walking: o.walking, g2 }; })()`);
        same(r.before, false, 'before'); same(r.walking, true, 'walked to'); same(r.g2, true, 'one beside it in its room');
    });
    check('wired: the 2D draw list, the 3D view, the tap, the gun\'s lock', () => {
        const g = rd('js/game.js'), v = rd('view3d/gameview.js'), m = rd('view3d/gamemap.js'), i = rd('js/input.js'), t = rd('js/targeting.js');
        same(/visibleForDraw\(a\.x,a\.y\) && \(typeof facilityShowsActor !== "function" \|\| facilityShowsActor\(a\)\)\) drawList/.test(g), true, 'js/game.js draw list');
        same(/!GM\.shows\(a\)\) continue;/.test(v) && /shows\(a\) \{ return typeof facilityShowsActor/.test(m), true, 'the 3D view');
        same(/function findEnemyAtScreen[\s\S]{0,600}facilityShowsActor\(a\)/.test(i), true, 'the tap');
        same(/function targetNearest[\s\S]{0,900}facilityShowsActor\(a\)/.test(t), true, 'the gun\'s lock');
    });
    console.log(failures ? `\n${failures} FAILED` : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
