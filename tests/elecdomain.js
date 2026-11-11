// THE ELECTRICAL DOMAIN (docs/DOMAINS.md), step 1 (build 2026-11-11d): the little door and the place, empty.
// The owner, 2026-11-11: "a little door in the server room that goes to the electric domain"; of its place, "1" (beside the junction); the way down opens after the junction repair; look A (the cold blue
// server graveyard); empty at first. The deep server room's racks standing near the door, toppled further in (step 2); the circuitry (step 3).
//   THE DOOR       a doorway in an alcove of the Server Room's north wall, right beside the junction, labelled ELECTRICAL DOMAIN; the way back up in the deep server room's north wall
//   THE JUNCTION   shut until the junction is repaired (standing in it does nothing; its tag says why); open after: you and the squad following you go down, and the stairs bring you back out at the door;
//                  walking to the junction to repair it never ends in the doorway
//   THE PLACE      two rooms of one interior, far from everything: the deep server room (24 x 18, at the arena's level) and down four wide steps the circuitry (32 x 23, lower), joined only to each other;
//                  dark steel and blue light, as dim as the Server Room, on its relay; racks standing near the door; nothing lives there
//   THE MAP        no errors; an interior's door onto a room outside it is still an error
const fs = require('fs'), vm = require('vm'), path = require('path');
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
    run(`Math.random = (function(){ let s = 20261111; return function(){ s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();
        facilityBlackoutSet(false); gameState.running = true; alertActive = false; crystal.health = crystal.maxHealth = 1e7; canvas.width = 1280; canvas.height = 860; innerWidth = 1100; health = 1e6;
        _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; classPickerOpen = false; playerClassKey = 'gunslinger';
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__tick = (n) => { for (let i = 0; i < n; i++) { frame++; techAbilityTick(); facilityTutorialTick(); for (const a of actors.slice()) if (!a.dead) updateNPC(a); actors = actors.filter(a => !a.dead || a.isFollower); } };
        globalThis.__cyc = () => FP_PORTAL.out + FP_PORTAL.hold + FP_PORTAL.in + 2;
        globalThis.__in = (id) => { const rm = facilityRoomAt(player.x, player.y, _fp.F); return !!rm && rm.id === id; };
        globalThis.__power = (on) => { for (const id of Object.keys(_fp.relays)) { if (on) relaySetOnline(id); else _fp.relays[id].online = false; } };
        globalThis.__squad = (els) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear();
            els.forEach((el, i) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.x = player.x - 1 - 0.4 * i; f.y = player.y + 0.6; f.stance = 'follow'; f.job = null; f.post = null; });
            partyTick(); return followers.slice(); };`);

    group('THE DOOR: a little door in the Server Room\'s north wall, right beside the junction');
    check('the Server Room\'s doorway is an alcove two tiles wide and one deep in its north wall, its east side against the junction; ELECTRICAL DOMAIN over it, stairs down; the way back up an alcove in the deep server room\'s north wall, SERVER ROOM over it', () => {
        const r = J(`(function(){ const F = _fp.F, P = facilityPortal('portal_lobby_elec'), Q = facilityPortal('portal_elec_lobby'), S = F.byId.get('front_lobby'), jn = F.solids.find(s => s.id === 'junction');
            return { room: P.room, label: P.label, kind: P.kind, to: P.to, w: +(P.rect[2] - P.rect[0]).toFixed(2), d: +(P.rect[3] - P.rect[1]).toFixed(2), north: +(S.bb[1]).toFixed(2), top: +(P.rect[1]).toFixed(2),
                besideJunction: Math.abs(P.rect[2] - jn.bb[0]) < 0.01, junctionTop: Math.abs(jn.bb[1] - P.rect[3]) < 0.01, back: [Q.room, Q.label, Q.kind, Q.to], backAtNorth: Math.abs(Q.rect[1] - F.byId.get('elec_servers').bb[1]) < 0.01,
                doors: F.decor.filter(d => d.kind === 'portal_door' && (d.room === 'front_lobby' || d.room === 'elec_servers')).map(d => d.id + ':' + !!d.up).join() }; })()`);
        same(r.room, 'front_lobby', 'its room'); same(r.label, 'ELECTRICAL DOMAIN', 'its name'); same(r.kind, 'stairs_down', 'its kind'); same(r.to, 'portal_elec_lobby', 'where it goes');
        same(r.w, 2, 'its width (tiles)'); same(r.d, 1, 'its depth'); same(r.top, r.north, 'it is not in the north wall'); same(r.besideJunction, true, 'its east side is not the junction\'s west'); same(r.junctionTop, true, 'the junction does not stand at its mouth');
        same(r.back.join(), 'elec_servers,SERVER ROOM,stairs_up,portal_lobby_elec', 'the way back'); same(r.backAtNorth, true, 'the way back is not in the deep server room\'s north wall');
        same(r.doors, 'lobby_elec_door:false,elec_stairs_door:true', 'the doors drawn');
    });

    group('THE JUNCTION: the way down opens once the junction is repaired');
    check('before the repair: the doorway is shut; standing in it does nothing; its tag says NO POWER: REPAIR THE JUNCTION; followers do not try it', () => {
        const r = J(`(function(){ __power(false); const P = facilityPortal('portal_lobby_elec'); __put(P.x, P.y); _fp.portalCool = 0; __tick(3);
            return { repaired: junctionRepaired(), shut: facilityPortalShut(P), phase: _fp.portal.phase, inLobby: __in('front_lobby') }; })()`);
        same(r.repaired, false, 'repaired'); same(r.shut, true, 'shut'); same(r.phase, 'idle', 'a trip started'); same(r.inLobby, true, 'left the Server Room');
        ok(/p\.needs === "junction" \? " · NO POWER: REPAIR THE JUNCTION"/.test(rd('js/facilityportals.js')), 'its tag');
        ok(/p\.needs === "junction" && !\(typeof junctionRepaired === "function" && junctionRepaired\(\)\)/.test(rd('js/facilityportals.js')), 'facilityPortalShut does not ask the junction');
    });
    check('after it: walking into the doorway takes you down into the deep server room with the squad following you, the tag says Deep Server Room; its stairs bring you back out at the door', () => {
        const r = J(`(function(){ const o = {}; __power(true); const P = facilityPortal('portal_lobby_elec'), Q = facilityPortal('portal_elec_lobby');
            __put(P.ax, P.ay + 1); const sq = __squad(['fire', 'core']); o.shut = facilityPortalShut(P);
            __put(P.x, P.y); _fp.portalCool = 0; __tick(1); o.phase = _fp.portal.phase; __tick(__cyc()); o.down = [__in('elec_servers'), facilityZoneName(), sq.filter(f => (facilityRoomAt(f.x, f.y, _fp.F) || {}).id === 'elec_servers').length];
            __tick(FP_PORTAL.cool + 2); __put(Q.x, Q.y); __tick(1 + __cyc()); o.up = [__in('front_lobby'), facilityZoneName(), Math.hypot(player.x - P.ax, player.y - P.ay) < 1.5]; return o; })()`);
        same(r.shut, false, 'still shut'); same(r.phase, 'out', 'the trip'); same(r.down.join(), 'true,Deep Server Room,2', 'down: in the deep server room, the squad with you'); same(r.up.join(), 'true,Server Room,true', 'back up, at the door');
    });
    check('walking to the junction to repair it never ends in the doorway beside it, from wherever you come (it would take you down the moment the repair was done)', () => {
        const r = J(`(function(){ __power(false); const P = facilityPortal('portal_lobby_elec'), jn = _fp.F.solids.find(s => s.id === 'junction'), bad = [];
            for (const at of [[P.ax - 3, P.ay - 0.4], [P.ax, P.ay], [P.ax - 1, P.ay + 3], [jn.bb[2] + 2, jn.bb[3] + 1], [jn.bb[0] - 4, jn.bb[3] + 4], [P.x, P.y]]) {
                __put(at[0], at[1]); const t = facilityApproachTile(jn.bb, STATION_RANGE - 0.3); if (!t || facilityPortalAt(t[0], t[1])) bad.push(at.map(v => v.toFixed(1)).join('/') + '>' + (t ? t.join('/') : 'none')); }
            return bad; })()`);
        same(r.join(' | '), '', 'approaches that end in the doorway (or nowhere)');
    });

    group('THE PLACE: the deep server room and, down the steps, the circuitry');
    check('two rooms of one interior under the Server Room, sharing one offset, built far from everything (more than 60 tiles from any room of the building); 24 x 18 tiles at the arena\'s level, and 32 x 23 lower down', () => {
        const r = J(`(function(){ const F = _fp.F, M = FACILITY_MAP, A = F.byId.get('elec_servers'), B = F.byId.get('elec_circuitry'), ints = M.interiors.filter(i => /^elec_/.test(i.id));
            const inner = new Set(F.interiors.map(i => i.id)), building = F.rooms.filter(q => !inner.has(q.id));
            const gap = (a, b) => Math.hypot(Math.max(0, a.bb[0] - b.bb[2], b.bb[0] - a.bb[2]), Math.max(0, a.bb[1] - b.bb[3], b.bb[1] - a.bb[3]));
            return { ints: ints.map(i => i.id + ':' + i.under + ':' + i.offset.join('/')).join(), sizeA: [A.bb[2] - A.bb[0], +(A.bb[3] - A.bb[1]).toFixed(1)], sizeB: [B.bb[2] - B.bb[0], B.bb[3] - B.bb[1]],
                levels: [A.level, B.level, facilityRoomHeight('elec_servers'), facilityRoomHeight('elec_circuitry'), facilityRoomHeight('arena')], near: Math.min(...building.map(q => Math.min(gap(q, A), gap(q, B)))) }; })()`);
        same(r.ints, 'elec_servers:front_lobby:2560/0,elec_circuitry:front_lobby:2560/0', 'the interiors');
        same(r.sizeA.join(), '24,19', 'the deep server room (with its alcove)'); same(r.sizeB.join(), '32,23', 'the circuitry');
        same(r.levels.join(), '-1,-2,-1.8,-3,-1.8', 'the levels and heights'); ok(r.near > 60, 'only ' + r.near.toFixed(1) + ' tiles from the building');
    });
    check('four wide steps join them: the floor drops from the deep server room\'s height to the circuitry\'s in four treads; a path runs from the door down into the middle of the circuitry; the ledge beside the steps is a railed edge, and nobody walks over it', () => {
        const r = J(`(function(){ const F = _fp.F, R = F.ramps.find(q => q.id === 'r_elec_steps'), z = R.zone, mx = (z.x0 + z.x1) / 2, hs = []; for (let y = z.y0 + 0.1; y < z.y1; y += 0.25) hs.push(+facilityHeightAt(mx, y, F).toFixed(2));
            const Q = facilityPortal('portal_elec_lobby'), B = F.byId.get('elec_circuitry').bb, path = facilityPath(Q.ax, Q.ay, (B[0] + B[2]) / 2, (B[1] + B[3]) / 2);
            const A = F.byId.get('elec_servers').bb, over = facilityCanStep(A[0] + 3, A[3] - 0.6, A[0] + 3, A[3] + 0.8, F);
            return { steps: z.steps, levels: R.between_levels.join(), treads: Array.from(new Set(hs)).join(), path: !!path, over, kinds: F.walls.filter(w => w.room === 'elec_servers' && Math.abs(w.a[1] - A[3]) < 0.01 && Math.abs(w.b[1] - A[3]) < 0.01).map(w => w.kind).filter((k, i, a) => a.indexOf(k) === i).join() }; })()`);
        same(r.steps, 4, 'steps'); same(r.levels, '-1,-2', 'between'); same(r.treads, '-1.8,-2.1,-2.4,-2.7,-3', 'the heights down the steps'); same(r.path, true, 'no way from the door into the circuitry');
        same(r.over, false, 'someone walks over the ledge'); same(r.kinds, 'deck_rail', 'the ledge\'s edge');
    });
    check('the look: dark steel and blue light (look A), as dim as the Server Room, lit by the Server Room\'s relay; named on the zone tag; racks standing near the door; nothing lives there', () => {
        const r = J(`(function(){ const st = ['elec_servers', 'elec_circuitry'].map(id => { const s = FP_ROOM_STYLE[id]; return id + ':' + !!s + ':' + !!(s && s.dark) + ':' + (FP_ROOM_DIM[id] || 1) + ':' + facilityStyleRoom(id) + ':' + facilityRoomName(id); });
            const relay = (FACILITY_MAP.relays || []).find(x => x.id === 'relay_lobby'), racks = FACILITY_MAP.props.filter(p => p.room === 'elec_servers' && p.kind === 'server_rack').length;
            const spawns = JSON.stringify(typeof FP_SPAWN !== 'undefined' ? FP_SPAWN : {}) + JSON.stringify(typeof FP_SPAWN_SEWERS !== 'undefined' ? FP_SPAWN_SEWERS : {}) + JSON.stringify(typeof SPAWN_TABLES !== 'undefined' ? SPAWN_TABLES : {});
            return { st, powers: relay.powers.join(), racks, lives: /elec_/.test(spawns) }; })()`);
        same(r.st.join(' | '), 'elec_servers:true:true:0.42:true:Deep Server Room | elec_circuitry:true:true:0.42:true:The Circuitry', 'the rooms\' look and names');
        same(r.powers, 'front_lobby,security_room,elec_servers,elec_circuitry', 'the Server Room\'s relay'); same(r.racks, 6, 'racks standing'); same(r.lives, false, 'a spawner names the domain');
    });

    group('THE MAP');
    check('the map has no errors; a door from one of the domain\'s rooms onto a room outside it is still an error (an interior is reached through its doorway only); no path joins the Server Room\'s floor to the domain\'s', () => {
        const r = J(`(function(){ const F = _fp.F, V = facilityValidate(F), P = FACILITY_MAP.portals.find(p => p.id === 'portal_elec_lobby');
            let bad = null; FACILITY_MAP.openings.push({ id: 'bad', a: [P.rect[0], P.rect[1]], b: [P.rect[2], P.rect[1]], rooms: ['elec_servers', 'front_lobby'] }); try { const F2 = facilityBuild({ snap: true }); bad = facilityValidate(F2).errors.filter(e => /elec_servers has a door onto another room/.test(e)).length; } catch (e) { bad = 'threw ' + e.message; } finally { FACILITY_MAP.openings = FACILITY_MAP.openings.filter(o => o.id !== 'bad'); }
            const L = F.byId.get('front_lobby').bb, Q = facilityPortal('portal_elec_lobby'); return { errors: V.errors, bad, joined: !!facilityPath((L[0] + L[2]) / 2, (L[1] + L[3]) / 2, Q.ax, Q.ay) }; })()`);
        same(r.errors.join(' | '), '', 'the map\'s errors'); same(r.bad, 1, 'an interior\'s door onto the Server Room passed'); same(r.joined, false, 'a path from the Server Room\'s floor to the domain\'s');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
