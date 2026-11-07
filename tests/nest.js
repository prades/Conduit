// THE ANT NEST (docs/NEST.md): a big egg cavern beyond the arena's south rock, where THE ANT QUEEN will live (step B) and the testing console will stand (step C).
// ASKED (the owner, 2026-11-07): "Can we finally create the nest layer? [...] I want to use it to test the player and squad combinations and different moves against a boss ant that's huge"; "the nest would be
// in the against the wall of the arena that the southernmost wall and it is beyond the rubble in a new room"; "Big egg cavern".
//   STEP A (build 2026-11-07ll): the room (an interior under the arena, sixteen tiles by twelve, rock walls, eggs and brood holes round the edge, the middle open) and the way in: the hole a fire technician drills
//   through the arena's south rubble is a doorway (a portal shut until the rubble is drilled through), the tunnel mouth in the Nest's north wall the way back up; the squad comes along; the save keeps it open.
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
    run(`Math.random = (function(){ let s = 20261107; return function(){ s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();
        facilityBlackoutSet(false); gameState.running = true; alertActive = false; crystal.health = crystal.maxHealth = 1e7; canvas.width = 1280; canvas.height = 860; innerWidth = 1100; health = 1e6;
        _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; classPickerOpen = false; playerClassKey = 'gunslinger';
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__tick = (n) => { for (let i = 0; i < n; i++) { frame++; techAbilityTick(); facilityTutorialTick(); for (const a of actors.slice()) if (!a.dead) updateNPC(a); actors = actors.filter(a => !a.dead || a.isFollower); } };
        globalThis.__cyc = () => FP_PORTAL.out + FP_PORTAL.hold + FP_PORTAL.in + 2;
        globalThis.__in = (id) => { const rm = facilityRoomAt(player.x, player.y, _fp.F); return !!rm && rm.id === id; };
        globalThis.__squad = (els) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear();
            els.forEach((el, i) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.x = player.x - 1 - 0.4 * i; f.y = player.y - 0.5; f.stance = 'follow'; f.job = null; f.post = null; });
            partyTick(); return followers.slice(); };`);

    group('THE ROOM: a big egg cavern beyond the arena\'s south rock (an interior, sixteen tiles by twelve)');
    check('the Ant Nest is an interior under the arena, built in a part of the map of its own, its floor all one stretch; its name on the zone tag is ANT NEST; the map has no errors', () => {
        const r = J(`(function(){ const F = _fp.F, N = F.byId.get('nest_area'), A = F.byId.get('arena'), V = facilityValidate(F); let cells = 0, comps = new Set(); for (const [k, c] of _fp.cells) { const rm = facilityRoomAt(c[0], c[1], F); if (rm && rm.id === 'nest_area') { cells++; comps.add(_pComp(c[0], c[1])); } }
            return { label: N.label, interior: !!N.raw.interior, under: (F.interiors.find(i => i.id === 'nest_area') || {}).under, size: [N.bb[2] - N.bb[0], N.bb[3] - N.bb[1]], far: N.bb[1] - A.bb[3], cells, comps: comps.size, tag: FP_ROOM_TAG.nest_area, errors: V.errors }; })()`);
        same(r.label, 'Ant Nest', 'its name'); same(r.tag, 'Ant Nest', 'the zone tag'); same(r.interior, true, 'an interior'); same(r.under, 'arena', 'under'); same(r.size.join(), '16,13', 'across and deep (twelve, and the tunnel mouth\'s alcove)');
        ok(r.far > 60, 'built ' + r.far + ' tiles from the arena: in sight of it'); ok(r.cells >= 170, 'floor tiles: ' + r.cells); same(r.comps, 1, 'stretches of floor'); same(r.errors.length, 0, r.errors.join(' | '));
    });
    check('dressed as an egg cavern: packed dirt, the colony\'s eggs in clusters round the edge, brood holes and resin on the walls the camera sees, the middle open; the tunnel mouth drawn as a burrow', () => {
        const M = J('FACILITY_MAP'), D = M.decor.filter(d => d.room === 'nest_area'), fl = M.floors.find(f => f.room === 'nest_area');
        same(fl && fl.style, 'sand', 'the floor'); ok(D.filter(d => d.kind === 'egg_cluster').length >= 6, 'egg clusters'); ok(D.filter(d => d.kind === 'brood_hole').length >= 4, 'brood holes'); ok(D.filter(d => d.kind === 'resin').length >= 4, 'resin');
        const door = D.find(d => d.kind === 'portal_door'); ok(door && door.burrow && door.up, 'the tunnel mouth');
        const mid = [600, 1300]; ok(D.filter(d => d.kind === 'egg_cluster').every(d => Math.hypot(d.at[0] - mid[0], d.at[1] - mid[1]) > 100), 'eggs in the middle');
        ok(/_fpBurrowDoor/.test(rd('js/facilitystyleall.js')) && /function _fpBurrowDoor/.test(rd('js/facilitysewers.js')), 'the burrow\'s drawing');
    });

    group('THE WAY IN: the hole drilled through the arena\'s south rubble, shut until it is drilled; the tunnel mouth back up');
    check('before the rubble is drilled: the doorway in front of it is shut (standing in it does nothing), its name is not shown (the rubble\'s own tag is), and followers do not try it', () => {
        const r = J(`(function(){ _fp.rubbleHits = {}; const P = facilityPortal('portal_arena_nest'); __put(P.x, P.y); _fp.portalCool = 0; __tick(3);
            return { shut: facilityPortalShut(P), phase: _fp.portal.phase, inArena: __in('arena'), left: techRubbleLeft(_techRubble('rubble_arena_south')), rubble: P.rubble }; })()`);
        same(r.rubble, 'rubble_arena_south', 'the rubble it goes through'); same(r.shut, true, 'shut'); same(r.phase, 'idle', 'a trip started'); same(r.inArena, true, 'left the arena'); same(r.left, J('TECH_AB.drill.hits'), 'hits left');
        ok(/if \(p\.rubble && facilityPortalShut\(p\)\) continue;/.test(rd('js/facilityportals.js')), 'the shut doorway\'s name is drawn');
    });
    check('drilled through: the doorway opens; walking into the hole takes you down to the Nest, and the squad following you comes along; the tunnel mouth takes you back up, out in front of the hole', () => {
        const r = J(`(function(){ const o = {}; _fp.rubbleHits = {}; const P = facilityPortal('portal_arena_nest'), Q = facilityPortal('portal_nest_arena');
            __put(P.ax, P.ay); const sq = __squad(['fire', 'core']); techRubbleApply({ rubble_arena_south: TECH_AB.drill.hits }); o.shut = facilityPortalShut(P);
            __put(P.x, P.y); _fp.portalCool = 0; __tick(1); o.phase = _fp.portal.phase; __tick(__cyc()); o.down = [__in('nest_area'), _fp.zoneRoom, sq.filter(f => facilityRoomAt(f.x, f.y, _fp.F).id === 'nest_area').length];
            __tick(FP_PORTAL.cool + 2); __put(Q.x, Q.y); __tick(1 + __cyc()); o.up = [__in('arena'), _fp.zoneRoom, Math.hypot(player.x - P.ax, player.y - P.ay) < 1.5]; return o; })()`);
        same(r.shut, false, 'still shut'); same(r.phase, 'out', 'the trip'); same(r.down.join(), 'true,nest_area,2', 'down: in the Nest, the squad with you'); same(r.up.join(), 'true,arena,true', 'back up');
    });
    check('the save keeps the rubble drilled, so the way stays open; a fresh game has the rubble back and the way shut', () => {
        const r = J(`(function(){ techRubbleApply({ rubble_arena_south: TECH_AB.drill.hits }); const sv = facilitySaveCollect(), P = facilityPortal('portal_arena_nest'); techRubbleApply({}); const fresh = facilityPortalShut(P); techRubbleApply(JSON.parse(JSON.stringify(sv.rubble))); return [sv.rubble.rubble_arena_south, fresh, facilityPortalShut(P)]; })()`);
        same(r.join(), J('TECH_AB.drill.hits') + ',true,false', 'saved hits, fresh, loaded');
    });

    console.log(failures ? `\n${failures} check(s) FAILED` : '\nall checks passed');
    process.exit(failures ? 1 : 0);
})();
