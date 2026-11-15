// THE SUBWAY (build 2026-11-15c; docs/FACILITY.md, "The subway"): a first place, empty, off the Sewers.
// The owner, 2026-11-15: "I want a subway system to connect from the sewer system. Just go ahead and put it in there, and then I'll use that to jog my memory for later updates." Every size, name and
// look here is the agent's, provisional.
//   THE WAY IN     the side passage off the Sewers' south ledge (its gate taken away: "a later area opens one by taking its gate away") ends in a stairwell door in its west wall, SUBWAY over it;
//                  the way back up is an alcove in the platform's north wall, SEWERS over it; you and the squad following you go down and come back
//   THE PLACE      two rooms of one interior, far from everything: the platform (30 tiles long, 5 deep, at the Sewers' level) and a level down beside it the track bed (38 x 4), joined by three steps at
//                  the platform's east end; the platform's edge is a railed drop; both tunnel ends are sealed walls (for later)
//   THE LOOK       old grey tile and sooty concrete, damp, a yellow edge, red signals; the track painted (two rails, sleepers); on the Armory relay with the Sewers; one place to hold; nothing lives there
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
    run(`Math.random = (function(){ let s = 20261115; return function(){ s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();
        facilityBlackoutSet(false); gameState.running = true; alertActive = false; crystal.health = crystal.maxHealth = 1e7; canvas.width = 1280; canvas.height = 860; innerWidth = 1100; health = 1e6;
        _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; classPickerOpen = false; playerClassKey = 'gunslinger';
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__tick = (n) => { for (let i = 0; i < n; i++) { frame++; techAbilityTick(); facilityTutorialTick(); for (const a of actors.slice()) if (!a.dead) updateNPC(a); actors = actors.filter(a => !a.dead || a.isFollower); } };
        globalThis.__cyc = () => FP_PORTAL.out + FP_PORTAL.hold + FP_PORTAL.in + 2;
        globalThis.__in = (id) => { const rm = facilityRoomAt(player.x, player.y, _fp.F); return !!rm && rm.id === id; };
        globalThis.__squad = (els) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear();
            els.forEach((el, i) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.x = player.x - 0.4 - 0.4 * i; f.y = player.y - 0.6; f.stance = 'follow'; f.job = null; f.post = null; });
            partyTick(); return followers.slice(); };`);

    group('THE WAY IN: the side passage off the Sewers\' south ledge, its gate taken away');
    check('the south passage\'s gate is gone (the north passage\'s and Side Quest\'s stay); at the passage\'s end a doorway in its west wall, SUBWAY over it, stairs down; the way back an alcove in the platform\'s north wall, SEWERS over it, stairs up; a door drawn at each', () => {
        const r = J(`(function(){ const F = _fp.F, P = facilityPortal('portal_sewers_subway'), Q = facilityPortal('portal_subway_sewers'), A = F.byId.get('subway_platform');
            return { gates: F.solids.filter(s => s.room === 'sewers' && s.kind === 'gate').map(s => s.id).sort().join(), down: [P.room, P.label, P.kind, P.to], w: +(P.rect[2] - P.rect[0]).toFixed(2), d: +(P.rect[3] - P.rect[1]).toFixed(2),
                back: [Q.room, Q.label, Q.kind, Q.to], backNorth: Math.abs(Q.rect[1] - A.bb[1]) < 0.01, backW: +(Q.rect[2] - Q.rect[0]).toFixed(2),
                doors: F.decor.filter(d => d.kind === 'portal_door' && /subway/.test(d.id)).map(d => d.id + ':' + d.room + ':' + !!d.up).join() }; })()`);
        same(r.gates, 'sewer_gate_n1,sewer_gate_n2', 'the Sewers\' gates'); same(r.down.join(), 'sewers,SUBWAY,stairs_down,portal_subway_sewers', 'the way down');
        same(r.w + 'x' + r.d, '1x2', 'the doorway (one tile against the west wall, two deep)'); same(r.back.join(), 'subway_platform,SEWERS,stairs_up,portal_sewers_subway', 'the way back');
        same(r.backNorth, true, 'the way back is not in the platform\'s north wall'); same(r.backW, 2, 'the way back\'s width');
        same(r.doors, 'sewer_subway_door:sewers:false,subway_stairs_door:subway_platform:true', 'the doors drawn');
    });
    check('from the culvert down from the arena you can walk to the doorway (over a bridge, along the south ledge, into the passage)', () => {
        const r = J(`(function(){ const A = facilityPortal('portal_sewers_arena'), P = facilityPortal('portal_sewers_subway'); return !!facilityPath(A.ax, A.ay, P.ax, P.ay); })()`);
        same(r, true, 'no way from the culvert to the subway\'s doorway');
    });
    check('walking into the doorway takes you down to the platform with the squad following you, the tag says Subway Platform; its stairs bring you back out in the passage, at the door', () => {
        const r = J(`(function(){ const o = {}, P = facilityPortal('portal_sewers_subway'), Q = facilityPortal('portal_subway_sewers');
            __put(P.ax, P.ay); const sq = __squad(['fire', 'core']); o.shut = facilityPortalShut(P);
            __put(P.x, P.y); _fp.portalCool = 0; __tick(1); o.phase = _fp.portal.phase; __tick(__cyc()); o.down = [__in('subway_platform'), facilityZoneName(), sq.filter(f => (facilityRoomAt(f.x, f.y, _fp.F) || {}).id === 'subway_platform').length];
            __tick(FP_PORTAL.cool + 2); __put(Q.x, Q.y); __tick(1 + __cyc()); o.up = [__in('sewers'), facilityZoneName(), Math.hypot(player.x - P.ax, player.y - P.ay) < 1.5]; return o; })()`);
        same(r.shut, false, 'shut'); same(r.phase, 'out', 'the trip'); same(r.down.join(), 'true,Subway Platform,2', 'down: on the platform, the squad with you'); same(r.up.join(), 'true,Sewers,true', 'back up, at the door');
    });

    group('THE PLACE: the platform and, down the steps, the track bed');
    check('two rooms of one interior under the Sewers, sharing one offset, built far from everything (more than 60 tiles from any other room); the platform 30 tiles long and 5 deep (6 with its alcove) at the Sewers\' level, the track bed 38 x 4 a level down', () => {
        const r = J(`(function(){ const F = _fp.F, M = FACILITY_MAP, A = F.byId.get('subway_platform'), B = F.byId.get('subway_tracks'), ints = M.interiors.filter(i => /^subway_/.test(i.id));
            const gap = (a, b) => Math.hypot(Math.max(0, a.bb[0] - b.bb[2], b.bb[0] - a.bb[2]), Math.max(0, a.bb[1] - b.bb[3], b.bb[1] - a.bb[3]));
            const others = F.rooms.filter(q => !/^subway_/.test(q.id));
            return { ints: ints.map(i => i.id + ':' + i.under + ':' + i.offset.join('/')).join(), sizeA: [A.bb[2] - A.bb[0], A.bb[3] - A.bb[1]], sizeB: [B.bb[2] - B.bb[0], B.bb[3] - B.bb[1]],
                levels: [A.level, B.level, facilityRoomHeight('subway_platform'), facilityRoomHeight('subway_tracks'), facilityRoomHeight('sewers')], near: Math.min(...others.map(q => Math.min(gap(q, A), gap(q, B)))) }; })()`);
        same(r.ints, 'subway_platform:sewers:-2560/2560,subway_tracks:sewers:-2560/2560', 'the interiors');
        same(r.sizeA.join(), '30,6', 'the platform (with its alcove)'); same(r.sizeB.join(), '38,4', 'the track bed');
        same(r.levels.join(), '-1,-2,-1.8,-3,-1.8', 'the levels and heights'); ok(r.near > 60, 'only ' + r.near.toFixed(1) + ' tiles from another room');
    });
    check('three steps join them: the floor drops from the platform\'s height to the track bed\'s in three treads; a path runs from the stairs to both ends of the track; the platform\'s edge is a railed drop, nobody walks over it; both tunnel ends are sealed walls', () => {
        const r = J(`(function(){ const F = _fp.F, R = F.ramps.find(q => q.id === 'r_subway_steps'), z = R.zone, mx = (z.x0 + z.x1) / 2, hs = []; for (let y = z.y0 + 0.1; y < z.y1; y += 0.25) hs.push(+facilityHeightAt(mx, y, F).toFixed(2));
            const Q = facilityPortal('portal_subway_sewers'), B = F.byId.get('subway_tracks').bb, A = F.byId.get('subway_platform').bb, my = (B[1] + B[3]) / 2;
            const west = !!facilityPath(Q.ax, Q.ay, B[0] + 1.5, my), east = !!facilityPath(Q.ax, Q.ay, B[2] - 2.5, my), over = facilityCanStep(A[0] + 4, A[3] - 0.6, A[0] + 4, A[3] + 0.8, F);
            const wallKinds = (room, test) => Array.from(new Set(F.walls.filter(w => w.room === room && test(w)).map(w => w.kind))).join();
            return { steps: z.steps, levels: R.between_levels.join(), treads: Array.from(new Set(hs)).join(), west, east, over,
                edge: wallKinds('subway_platform', w => Math.abs(w.a[1] - A[3]) < 0.01 && Math.abs(w.b[1] - A[3]) < 0.01),
                ends: wallKinds('subway_tracks', w => Math.abs(w.a[0] - w.b[0]) < 0.01 && (Math.abs(w.a[0] - B[0]) < 0.01 || Math.abs(w.a[0] - B[2]) < 0.01)) }; })()`);
        same(r.steps, 3, 'steps'); same(r.levels, '-1,-2', 'between'); same(r.treads, '-1.8,-2.2,-2.6,-3', 'the heights down the steps');
        same(r.west + ',' + r.east, 'true,true', 'a way from the stairs to the west and the east ends of the track'); same(r.over, false, 'someone walks over the platform\'s edge');
        same(r.edge, 'deck_rail', 'the platform\'s edge'); same(r.ends, 'wall', 'the tunnel ends (sealed)');
    });
    check('the look: grey tile and sooty concrete, dark and damp, named on the zone tag, with the Sewers on the Armory relay, one place to hold; the track painted (two rails and sleepers across it), a yellow edge on the platform; lamps and red signals; nothing lives there', () => {
        const r = J(`(function(){ const F = _fp.F, st = ['subway_platform', 'subway_tracks'].map(id => { const s = FP_ROOM_STYLE[id]; return id + ':' + !!(s && s.dark) + ':' + !!(s && s.damp) + ':' + facilityStyleRoom(id) + ':' + facilityRoomName(id); });
            const relay = FACILITY_MAP.relays.find(x => x.id === 'relay_armory'), place = PARTY_PLACES.find(p => p.id === 'subway');
            const D = F.decor.find(d => d.id === 'subway_rails'), mx = Math.round((D.rect[0] + D.rect[2]) / 2), my = (D.rect[1] + D.rect[3]) / 2, ops = [];   /* (the track's middle line runs between two rows of tiles: each rail is painted on one of them) */
            for (let y = Math.floor(my - 1); y <= Math.ceil(my + 1); y++) for (const o of (_fp.floorOps.get(mx + ',' + y) || [])) if (o.t === 'L') ops.push(o);
            const spawns = JSON.stringify(typeof FP_SPAWN !== 'undefined' ? FP_SPAWN : {}) + JSON.stringify(typeof FP_SPAWN_SEWERS !== 'undefined' ? FP_SPAWN_SEWERS : {}) + JSON.stringify(typeof FP_SPAWN_ELEC !== 'undefined' ? FP_SPAWN_ELEC : {}) + JSON.stringify(typeof SPAWN_TABLES !== 'undefined' ? SPAWN_TABLES : {});
            return { st, powered: ['sewers', 'subway_platform', 'subway_tracks'].every(id => relay.powers.includes(id)), place: place ? [place.name, place.match.test('subway_platform'), place.match.test('subway_tracks'), place.match.test('sewers')].join() : null,
                rails: ops.filter(o => o.c === 'rgba(196,204,212,0.9)').length, sleepers: ops.filter(o => o.c === 'rgba(96,74,54,0.95)').length,
                edge: F.decor.filter(d => d.kind === 'platform_edge' && d.room === 'subway_platform').length, lights: F.decor.filter(d => d.kind === 'light' && /^subway_/.test(d.room)).map(d => d.room).sort().join(),
                floors: FACILITY_MAP.floors.filter(f => /^subway_/.test(f.room)).map(f => f.room + ':' + f.style).join(), lives: /subway/.test(spawns) }; })()`);
        same(r.st.join(' | '), 'subway_platform:true:true:true:Subway Platform | subway_tracks:true:true:true:Subway Tracks', 'the rooms\' look and names');
        same(r.powered, true, 'not on the Armory relay with the Sewers'); same(r.place, 'Subway,true,true,false', 'the place to hold');
        same(r.rails, 2, 'rail heads across the track'); same(r.sleepers, 4, 'sleepers across the track (two a tile, on the two rows the track runs over)'); same(r.edge, 1, 'the platform\'s yellow edge');
        same(r.lights, 'subway_platform,subway_platform,subway_platform,subway_platform,subway_tracks,subway_tracks', 'the lamps and the signals');
        same(r.floors, 'subway_platform:tile,subway_tracks:concrete', 'the floors'); same(r.lives, false, 'a spawner or a table names the subway');
    });

    group('THE MAP');
    check('the map has no errors; a door from the platform onto a room outside the subway is still an error (an interior is reached through its doorway only); no path joins the Sewers\' floor to the subway\'s', () => {
        const r = J(`(function(){ const F = _fp.F, V = facilityValidate(F), Pm = FACILITY_MAP.portals.find(p => p.id === 'portal_subway_sewers');
            let bad = null; FACILITY_MAP.openings.push({ id: 'bad', a: [Pm.rect[0], Pm.rect[1]], b: [Pm.rect[2], Pm.rect[1]], rooms: ['subway_platform', 'sewers'] }); try { const F2 = facilityBuild({ snap: true }); bad = facilityValidate(F2).errors.filter(e => /subway_platform has a door onto another room/.test(e)).length; } catch (e) { bad = 'threw ' + e.message; } finally { FACILITY_MAP.openings = FACILITY_MAP.openings.filter(o => o.id !== 'bad'); }
            const P = facilityPortal('portal_sewers_subway'), Q = facilityPortal('portal_subway_sewers'); return { errors: V.errors, bad, joined: !!facilityPath(P.ax, P.ay, Q.ax, Q.ay) }; })()`);
        same(r.errors.join(' | '), '', 'the map\'s errors'); same(r.bad, 1, 'an interior\'s door onto the Sewers passed'); same(r.joined, false, 'a path from the Sewers\' floor to the subway\'s');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
