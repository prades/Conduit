// THE ANT NEST (docs/NEST.md): a big egg cavern beyond the arena's south rock, where THE ANT QUEEN will live (step B) and the testing console will stand (step C).
// ASKED (the owner, 2026-11-07): "Can we finally create the nest layer? [...] I want to use it to test the player and squad combinations and different moves against a boss ant that's huge"; "the nest would be
// in the against the wall of the arena that the southernmost wall and it is beyond the rubble in a new room"; "Big egg cavern".
//   STEP A (build 2026-11-07ll): the room (an interior under the arena, sixteen tiles by twelve, rock walls, eggs and brood holes round the edge, the middle open) and the way in: the hole a fire technician drills
//   through the arena's south rubble is a doorway (a portal shut until the rubble is drilled through), the tunnel mouth in the Nest's north wall the way back up; the squad comes along; the save keeps it open.
//   STEP B (build 2026-11-07mm): THE ANT QUEEN: armed on coming down, her size, body and health, waking, MANDIBLE CRUSH, TREMOR STOMP, BROOD CALL, held to the Nest, killed (nothing paid, nothing unlocked, a fresh
//   queen next time); a knock never carries you through a doorway; her enemy card.
//   STEP C (build 2026-11-07nn): the test console (BOSS RESET, the TEST SQUAD, the DAMAGE METER): REMOVED in build 2026-11-12d, when THE ANT QUEEN moved to the Deep Brood (the owner, 2026-11-12: "we need to
//   remove the test queen area anyways and move her deeper into the nest", then "Deep Brood, console gone"); the check that it is gone stands in its place.
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
        same(fl && fl.style, 'sand', 'the floor'); ok(D.filter(d => d.kind === 'egg_cluster').length >= 6, 'egg clusters'); ok(D.filter(d => d.kind === 'brood_hole').length >= 4, 'brood holes'); ok(D.filter(d => d.kind === 'resin').length >= 3, 'resin');   // (four, then three since build 2026-11-12a: the west wall's two gave way to the mouth to the Nest's tunnels)
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

    group('THE ANT QUEEN (step B; in the Deep Brood since build 2026-11-12d): huge, three moves, a fresh queen each time you come down, held to her room, pays nothing');
    run(`globalThis.__nest = () => { const Q = facilityPortal('portal_nest_arena'); techRubbleApply({ rubble_arena_south: TECH_AB.drill.hits }); __put(Q.ax, Q.ay); };
        globalThis.__out = () => { const P = facilityPortal('portal_arena_nest'); __put(P.ax, P.ay); };
        globalThis.__fresh = () => { actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); bossReset(); __out(); __tick(1); };`);
    check('coming down into the Nest arms her: asleep at her post in the middle of the Deep Brood (at the end of the main way), three times the Toxic Queen\'s size, a body 1.2 tiles round, 1.6 times the ant boss block\'s health at level 10, no plain bite and no species special, paying nothing', () => {
        const r = J(`(function(){ __fresh(); const before = !!bossUnit('nest'); __nest(); __tick(1); const q = bossUnit('nest'), S = bossState('nest'), N = _fp.F.byId.get('nest_deep');
            const ref = spawnCreature({ species: 'ant', className: 'boss', x: q.x, y: q.y, level: 10, state: 'wander' }); const o = { refHp: ref.maxHealth, refW: ref.dimensions.width }; ref.dead = true; actors.splice(actors.indexOf(ref), 1);
            return Object.assign(o, { before, state: S.state, asleep: q.bossAsleep, name: q.bossName, level: q.level, hp: q.maxHealth, w: q.dimensions.width, bodyR: q.bodyR, noBite: q.noBite, ability: q.abilityDef, noReward: q.noReward, inRoom: partyRoomAt(q.x, q.y), midX: Math.abs(q.x - (N.bb[0] + N.bb[2]) / 2) < 1.5 }); })()`);
        same(r.before, false, 'a queen before you came down'); same([r.state, r.asleep, r.name, r.level].join(), 'armed,true,THE ANT QUEEN,10', 'armed asleep');
        same(r.w, r.refW * 3, 'her size'); same(r.bodyR, 1.2, 'her body'); same(r.hp, Math.round(r.refHp * 1.6), 'her health'); same([r.noBite, r.ability, r.noReward].join(), 'true,,true', 'no bite, no special, no reward'); same([r.inRoom, r.midX].join(), 'nest_deep,true', 'her post');
    });
    check('she wakes when one of yours comes near her, or when she is hit; awake she goes after you', () => {
        const r = J(`(function(){ __fresh(); __nest(); __tick(1); const q = bossUnit('nest'), S = bossState('nest'); const o = { far: S.state };
            __put(q.x - 3.4, q.y); __tick(2); o.near = [S.state, q.bossAsleep, q.provoked];
            __fresh(); __nest(); __tick(1); const q2 = bossUnit('nest'), S2 = bossState('nest'); __put(q2.x - 6, q2.y); __tick(1); o.far2 = S2.state; applyDamage(q2, 1, player); __tick(2); o.hit = [S2.state, q2.bossAsleep]; return o; })()`);   // (hit from across her room: out of reach of waking her by coming near)
        same(r.far, 'armed', 'woke with nobody near'); same(r.near.join(), 'active,false,true', 'near her'); same(r.far2, 'armed', 'woke from across her room'); same(r.hit.join(), 'active,false', 'hit');
    });
    check('MANDIBLE CRUSH: one of yours in reach of her jaws: she stands rooted for the wind-up (a wedge in front of her), then everyone of yours in the wedge takes 0.4 times her power, crushing; one beside her, out of the wedge, does not; you take one of your hits', () => {
        const r = J(`(function(){ __fresh(); __nest(); __tick(1); const q = bossUnit('nest'), S = bossState('nest'), M = BOSS_ENCOUNTERS.nest.moves.crush; bossWake('nest', 'hit');
            spawnFollowerAtCrystal('core'); const a = followers[followers.length - 1]; spawnFollowerAtCrystal('core'); const b = followers[followers.length - 1];
            for (const f of [a, b]) { f.returningToCrystal = false; f.health = f.maxHealth = 1000; f.stance = 'hold'; f.job = null; } a.x = q.x + 2.2; a.y = q.y; b.x = q.x - 2.2; b.y = q.y + 0.1;
            __put(q.x + 2.6, q.y + 0.4); player.invuln = 0; health = 5; S.crushAt = frame; S.stompAt = frame + 1e6; S.broodAt = frame + 1e6; __tick(1);
            const o = { cast: S.cast && S.cast.kind, held: [q.moveSpeed, q.baseMoveSpeed], wind: S.cast ? S.cast.until - S.cast.t0 : 0 }; const h0 = [a.health, b.health];
            a.x = q.x + 2.2; a.y = q.y; b.x = q.x - 2.2; b.y = q.y + 0.1; for (let i = 0; i < M.windup + 2; i++) { a.x = q.x + 2.2; a.y = q.y; b.x = q.x - 2.2; b.y = q.y + 0.1; __put(q.x + 2.6, q.y + 0.4); __tick(1); }
            o.dealt = [Math.round(h0[0] - a.health), Math.round(h0[1] - b.health)]; o.want = Math.round(q.power * M.power); o.health = health; o.moving = q.baseMoveSpeed > 0; return o; })()`);
        same(r.cast, 'crush', 'the wind-up'); same(r.held.join(), '0,0', 'rooted while it winds up'); same(r.wind, 54, 'its wind-up');
        ok(r.dealt[0] > 0 && Math.abs(r.dealt[0] - r.want) <= r.want * 0.6 + 1, 'the one in the wedge took ' + r.dealt[0] + ' (her crush ' + r.want + ')'); same(r.dealt[1], 0, 'the one behind her was hit'); same(r.health, 4, 'your hits'); same(r.moving, true, 'still rooted after it');
    });
    check('TREMOR STOMP: one of yours close to her: she rears up (a ring out to its reach), then everyone of yours inside the ring is hurt (0.25 times her power) and thrown back; you take one of your hits', () => {
        const r = J(`(function(){ __fresh(); __nest(); __tick(1); const q = bossUnit('nest'), S = bossState('nest'), M = BOSS_ENCOUNTERS.nest.moves.stomp; bossWake('nest', 'hit');
            spawnFollowerAtCrystal('core'); const a = followers[followers.length - 1]; a.returningToCrystal = false; a.health = a.maxHealth = 1000; a.stance = 'hold'; a.job = null;
            const put = () => { a.x = q.x; a.y = q.y - 2.5; __put(q.x - 3.4, q.y + 0.5); }; put(); player.invuln = 0; health = 5; S.stompAt = frame; S.crushAt = frame + 1e6; S.broodAt = frame + 1e6; __tick(1);
            const o = { cast: S.cast && S.cast.kind }; const h0 = a.health; for (let i = 0; i < M.windup + 1; i++) { put(); __tick(1); }
            o.dealt = Math.round(h0 - a.health); o.want = Math.round(q.power * M.power); o.kb = Math.hypot(a.kbVX || 0, a.kbVY || 0) > 0 || Math.hypot(a.x - q.x, a.y - q.y) > 2.5; o.health = health; return o; })()`);
        same(r.cast, 'stomp', 'the wind-up'); ok(r.dealt > 0 && Math.abs(r.dealt - r.want) <= r.want * 0.6 + 1, 'it took ' + r.dealt + ' (her stomp ' + r.want + ')'); same(r.kb, true, 'thrown back'); same(r.health, 4, 'your hits');
    });
    check('BROOD CALL: ants climb out of the Deep Brood\'s brood holes (three a call, never more than six of hers alive), go for you, and pay nothing', () => {
        const r = J(`(function(){ __fresh(); __nest(); __tick(1); const q = bossUnit('nest'), S = bossState('nest'); bossWake('nest', 'hit'); __put(q.x - 4, q.y);
            const holes = _fp.F.decor.filter(d => d.room === 'nest_deep' && d.kind === 'brood_hole').map(h => [(h.a[0] + h.b[0]) / 2, (h.a[1] + h.b[1]) / 2]);
            const n1 = _bossBrood(BOSS_ENCOUNTERS.nest, q), ants = facilityCreatures('nest_deep').filter(a => a.bossWave === 'nest');
            const byHole = ants.every(a => holes.some(h => Math.hypot(a.x - h[0], a.y - h[1]) < 2)); _bossBrood(BOSS_ENCOUNTERS.nest, q); const n3 = _bossBrood(BOSS_ENCOUNTERS.nest, q);
            const all = facilityCreatures('nest_deep').filter(a => a.bossWave === 'nest');
            return { n1, byHole, n3, alive: all.length, noReward: all.every(a => a.noReward), hunt: ants.every(a => a.provoked && a.currentTarget === player), species: ants.every(a => a.speciesName === 'ant') }; })()`);
        same(r.n1, 3, 'a call'); same(r.byHole, true, 'not at the brood holes'); same(r.n3, 0, 'past the cap'); same(r.alive, 6, 'alive'); same([r.noReward, r.hunt, r.species].join(), 'true,true,true', 'her brood');
    });
    check('held to her room: when you leave she lets go, walks back to her post and sleeps again there, her wounds kept; she never leaves her room', () => {
        const r = J(`(function(){ __fresh(); __nest(); __tick(1); const q = bossUnit('nest'), S = bossState('nest'), at = bossLair(BOSS_ENCOUNTERS.nest); bossWake('nest', 'hit'); q.health -= 100; q.x += 2; const hp = q.health;
            __out(); let n = 0; for (; n < 3000 && S.state !== 'armed'; n++) __tick(1);
            return { state: S.state, asleep: q.bossAsleep, home: Math.hypot(q.x - at[0], q.y - at[1]) < 1.5, hp: q.health === hp, room: partyRoomAt(q.x, q.y), took: n }; })()`);
        same([r.state, r.asleep, r.home, r.hp, r.room].join(), 'armed,true,true,true,nest_deep', 'asleep at home, wounds kept (took ' + r.took + ' frames)');
    });
    check('killed: the encounter is resolved (defeated), nothing is paid (no shards, DNA or XP), nothing unlocks (a test boss counts for no boss); come down again and a fresh queen waits', () => {
        const r = J(`(function(){ __fresh(); __nest(); __tick(1); const q = bossUnit('nest'), S = bossState('nest'); bossWake('nest', 'hit');
            spawnFollowerAtCrystal('core'); const f = followers[followers.length - 1]; f.returningToCrystal = false; partyTick(); const xp0 = f.xp || 0, sh0 = shardCount, dna0 = JSON.stringify(typeof dnaBank !== 'undefined' ? dnaBank : null);
            q.lastAttacker = f; applyDamage(q, 1e9, f); __tick(2); for (const a of actors) if (a instanceof Predator && a.dead && !a.deathProcessed) { a.deathProcessed = true; onPredatorDeath(a); } if (typeof awardKillXp === 'function') awardKillXp(q);
            const o = { state: S.state, outcome: S.outcome, unit: !!bossUnit('nest'), shards: shardCount - sh0, xp: (f.xp || 0) - xp0, dna: JSON.stringify(typeof dnaBank !== 'undefined' ? dnaBank : null) === dna0, any: bossAnyResolved() };
            __out(); __tick(2); __nest(); __tick(1); const q2 = bossUnit('nest'); o.again = [!!q2 && q2 !== q, bossState('nest').state, q2 && q2.health === q2.maxHealth]; return o; })()`);
        same([r.state, r.outcome, r.unit].join(), 'resolved,defeated,false', 'defeated'); same([r.shards, r.xp, r.dna].join(), '0,0,true', 'paid'); same(r.any, false, 'counted for the first boss (Booster Pack 2)'); same(r.again.join(), 'true,armed,true', 'a fresh queen');
    });
    check('a knock never carries you through a doorway (the Nest\'s tunnel mouth, beside where she fought until build 2026-11-12d): pushed toward it, you stay in the Nest', () => {
        const r = J(`(function(){ __fresh(); __nest(); const Q = facilityPortal('portal_nest_arena'); __put(Q.x, Q.rect[3] + 0.25); player.invuln = 0; health = 5; _fp.portalCool = 0; hurtPlayer(1, 4, { x: Q.x, y: Q.rect[3] + 2 }); __tick(__cyc()); return [__in('nest_area'), _fp.portal.phase]; })()`);
        same(r.join(), 'true,idle', 'carried out');
    });
    check('her enemy card says CRUSH (her crush\'s strength), not BITE', () => {
        const r = J(`(function(){ __fresh(); __nest(); __tick(1); const q = bossUnit('nest'), c = targetCardInfo(q); return [c.biteLabel, c.bite, Math.round(q.power * BOSS_ENCOUNTERS.nest.moves.crush.power * 10) / 10, targetInfoLines(q)[1].indexOf('CRUSH') >= 0]; })()`);
        same(r[0], 'CRUSH', 'the label'); same(r[1], r[2], 'the number'); same(r[3], true, 'the INFO line');
    });

    group('THE TEST CONSOLE (step C): removed in build 2026-11-12d (the owner: "Deep Brood, console gone")');
    check('no console in the Nest: no prop, no station, no station kind, no script, no panel, no damage meter, no test squad; the first cavern keeps its eggs and brood holes', () => {
        const r = J(`(function(){ return { prop: _fp.F.solids.some(q => q.id === 'nest_console'), st: _fp.stations.some(s => s.id === 'st_nest_console'), kind: !!STATION_KINDS.nest_console,
            fns: ['nestConsoleOpen', 'nestMeterDraw', 'nestMeterHit', 'nestTestSendIn', 'nestQueenReset', 'nestConsoleTick'].filter(n => typeof globalThis[n] === 'function'), state: !!(_fp.nestc),
            eggs: FACILITY_MAP.decor.filter(d => d.room === 'nest_area' && d.kind === 'egg_cluster').length, holes: FACILITY_MAP.decor.filter(d => d.room === 'nest_area' && d.kind === 'brood_hole').length }; })()`);
        same([r.prop, r.st, r.kind, r.state].join(), 'false,false,false,false', 'the console'); same(r.fns.join(), '', 'its code'); ok(r.eggs >= 6 && r.holes >= 4, 'the cavern\'s eggs and brood holes: ' + r.eggs + ', ' + r.holes);
        ok(!fs.existsSync(path.join(ROOT, 'js/nestconsole.js')), 'js/nestconsole.js'); ok(!/nestconsole|nestConsole|nestMeter/.test(rd('game.html')), 'game.html still loads or styles it');
        for (const f of ['js/helpers.js', 'js/game.js', 'js/battleview.js', 'js/facilitytutorial.js', 'js/facilitysave.js', 'js/stations.js']) ok(!/nestMeter|nestConsole|nestStashed|nestTest\b|\.nestTest/.test(rd(f)), f + ' still asks for it');
    });

    // THE NEST GROWN OUT (build 2026-11-12a; docs/DOMAINS.md §2, 10 and 11; the owner: "I like the nest. Just make a spot for the volcanic layer to be included in the nest"; then "Build it")
    group('THE NEST GROWN OUT (build 2026-11-12a): tunnels and nests round the cavern, its ways through, the way down; THE DEFAULT CHEST');
    check('thirteen rooms of the Nest\'s one interior round the queen\'s cavern, joined to it and each other by mouths in the rock (no door frames); their walls low rims of rock, the cavern\'s west wall too; the shelf high ground with a cliff a REEF climb goes up and a ledge down; the way down a slope (no steps) to the volcanic layer\'s level; all lit with the cavern', () => {
        const r = J(`(function(){ const F = _fp.F, ids = [...FP_NEST_ROOMS].filter(id => id !== 'nest_area'), I = FACILITY_MAP.interiors, off = id => JSON.stringify((I.find(i => i.id === id) || {}).offset);
            const caves = F.openings.filter(o => o.cave), lowOf = id => _fp.items.filter(i => i.fp === 'wall' && i.room === id), R = F.ramps.find(x => x.id === 'r_nest_down');
            return { n: ids.length, sameOff: ids.every(id => off(id) === off('nest_area')), caves: caves.length, frames: _fp.items.filter(i => i.fp === 'door' && caves.some(o => o.id === i.id)).length,
                low: ids.every(id => lowOf(id).filter(i => i.kind === 'rock').every(i => i.low)), west: lowOf('nest_area').filter(i => i.low).length > 0, tall: lowOf('nest_area').some(i => i.kind === 'rock' && !i.low),
                shelf: facilityRoomHeight('nest_shelf', F) > facilityRoomHeight('nest_brood', F), face: F.walls.some(w => w.face && w.room === 'nest_brood'), ledge: !!F.ledges.find(l => l.id === 'ledge_nest_shelf'),
                slope: !!(R && R.zone && !R.zone.steps), deep: facilityRoomHeight('nest_down_low', F) < facilityRoomHeight('nest_down', F), light: ids.every(id => _fpLightKey(id) === 'nest_area'), tags: FP_ROOM_TAG.nest_shelf + '|' + FP_ROOM_TAG.nest_t1 }; })()`);
        same(r.n, 13, 'rooms'); same(r.sameOff, true, 'one interior with the cavern'); same(r.caves, 12, 'mouths'); same(r.frames, 0, 'a door frame on a mouth in the rock');
        same(r.low, true, 'a tall wall in the tunnels'); same(r.west, true, 'the cavern\'s west wall a low rim'); same(r.tall, true, 'the cavern\'s other walls as they were');
        same(r.shelf, true, 'the shelf is not high ground'); same(r.face, true, 'no cliff face for a REEF climb'); same(r.ledge, true, 'no ledge down from the shelf'); same(r.slope, true, 'the way down is not a slope'); same(r.deep, true, 'it does not go down');
        same(r.light, true, 'a room of the Nest lit apart'); same(r.tags, 'The Shelf|Ant Nest', 'the zone tags');
    });
    check('THE WAYS THROUGH: the collapsed tunnel shuts the way west until a fire technician\'s drill is through it; the flask by the cracked wall, shot, breaks the wall for good; the acid flask eats the resin seal; FLUX MOVE puts the boulder in its hollow (and never back across the way); the stream is water an ice bridge crosses; what was opened is saved', () => {
        const r = J(`(function(){ facilityPlayStart(); const way = (a, b) => { const p = facilityPath(a[0], a[1], b[0], b[1]); return !!(p && p.length); }, out = {};
            out.choke = way([30, 180], [8, 177]); _fp.rubbleHits.rubble_nest_choke = TECH_AB.drill.hits; techRubbleApply({ rubble_nest_choke: TECH_AB.drill.hits }); out.drilled = way([30, 180], [8, 177]);
            out.wall0 = way([7, 184], [10, 202]); hazardTrigger(_fp.F.solids.find(q => q.id === 'hazard_x3'), 0); for (let i = 0; i < 3; i++) { frame++; hazardsTick(); } out.wall1 = way([7, 184], [10, 202]);
            out.resin0 = way([10, 202], [30, 202]); hazardTrigger(_fp.F.solids.find(q => q.id === 'hazard_c2'), 0); for (let i = 0; i < 3; i++) { frame++; hazardsTick(); } out.resin1 = way([10, 202], [30, 202]);
            out.boulder0 = way([30, 180], [29, 193]); const s = fluxObject('nest_boulder'), H = fluxHere(s), c = fluxCheck(s, H.x0 + 2, H.y0, false, {}); out.move = c.ok && !!fluxMoveTo(s, H.x0 + 2, H.y0, false, {}); out.boulder1 = way([30, 180], [29, 193]);
            const H2 = fluxHere(s); out.back = fluxCheck(s, H2.x0 - 2, H2.y0, false, {}).ok;
            const w = _fp.F.solids.find(q => q.id === 'nest_stream_water'); out.water = !!(w && w.water); out.saved = facilitySaveCollect().nestWays.sort().join();
            return out; })()`);
        same(r.choke, false, 'the way west open before the drill'); same(r.drilled, true, 'drilled through, the way west still shut');
        same(r.wall0, false, 'the cracked wall lets you by'); same(r.wall1, true, 'the blast did not break the cracked wall');
        same(r.resin0, false, 'the resin seal lets you by'); same(r.resin1, true, 'the acid did not eat the resin seal');
        same(r.boulder0, false, 'the boulder lets you by'); same(r.move, true, 'FLUX MOVE cannot put the boulder in its hollow'); same(r.boulder1, true, 'the way to the old burrow still shut'); same(r.back, false, 'the boulder may be moved back across the way');
        same(r.water, true, 'the stream is not water'); same(r.saved, 'nest_cracked,nest_resin_seal', 'the ways opened, saved');
    });
    check('THE CRACKED ROCK (the owner, build 2026-11-13o: "3D rock, blast or drill"): the cracked wall is the cave\'s modelled rubble now (a rubble choke of it, its sign naming both ways; no flat board drawn); a fire technician drilling it through opens the way as a blast does; broken by a blast it counts as open (no ring), and no blast gives a drilled one way again', () => {
        const r = J(`(function(){ const way = (a, b) => { const p = facilityPath(a[0], a[1], b[0], b[1]); return !!(p && p.length); }, o = {}, X = () => _fp.F.solids.find(q => q.id === 'hazard_x3');
            const reset = () => { hazardsReset(); nestWaysReset(); techRubbleApply({}); for (const id of ['nest_cracked', 'hazard_x3']) facilitySolidSet(id, false); };   // (the check before broke the rock and set the flask off)
            reset(); let R = _techRubble('rubble_nest_cracked');
            o.rubble = !!R && R.solid === 'nest_cracked'; o.board = nestWaysItems(_fp.F).some(i => i.solid === 'nest_cracked'); o.drawn = _fp.items.some(i => i.fp === 'wdecor' && i.kind === 'rubble' && i.rubble === 'rubble_nest_cracked');
            o.tag = R.tag; o.say = /BLAST/.test(R.say || '') && /PRESS AND HOLD/.test(R.say || ''); o.ring = !!techRingFor(R); o.shut = way([7, 184], [10, 202]);
            techRubbleApply({ rubble_nest_cracked: TECH_AB.drill.hits }); o.drilled = way([7, 184], [10, 202]); o.openD = techRubbleOpen(R); const [fx, fy] = hazardCentre(X()); o.again = nestWaysBlast(fx, fy, HAZARD.blastR);
            reset(); R = _techRubble('rubble_nest_cracked'); hazardTrigger(X(), 0); for (let i = 0; i < 3; i++) { frame++; hazardsTick(); }
            o.blasted = way([7, 184], [10, 202]); o.openB = techRubbleOpen(R); o.ringB = techRingFor(R); o.saved = facilitySaveCollect().nestWays.join();
            reset(); return o; })()`);
        same(r.rubble, true, 'not a rubble choke of the cracked wall'); same(r.board, false, 'the flat board is still drawn'); same(r.drawn, true, 'the rubble is not drawn there');
        same(r.tag, 'CRACKED ROCK · SHOOT THE FLASK', 'its sign'); same(r.say, true, 'what it says near it names the blast and the drill'); same(r.ring, true, 'no THERMITE DRILL ring'); same(r.shut, false, 'the way is open before it is broken');
        same(r.drilled, true, 'drilled through, the way still shut'); same(r.openD, true, 'drilled, not open'); same(r.again, 0, 'a blast gave a drilled one way again');
        same(r.blasted, true, 'the blast did not open the way'); same(r.openB, true, 'broken by a blast, the rubble is not open'); same(r.ringB, null, 'a ring on the broken rock'); same(r.saved, 'nest_cracked', 'the blast is not saved');
    });
    check('THE ANT QUEEN keeps to the Deep Brood (since build 2026-11-12d); coming down into the Nest arms her there, and a killed one is not armed again by walking between the Nest\'s rooms (a tunnel, the Deep Brood) and back', () => {
        const r = J(`(function(){ const at = (x, y) => { __put(x, y); _bossTestEntry(); }; bossReset(); __out(); _bossTestEntry(); at(30, 178); const q0 = bossUnit('nest'), armedIn = q0 ? partyRoomAt(q0.x, q0.y) : null; if (q0) q0.dead = true; actors = actors.filter(a => !a.dead);
            at(18, 177); const tunnel = partyRoomAt(player.x, player.y); at(10, 202); const deep = partyRoomAt(player.x, player.y); at(30, 178); return { armedIn, tunnel, deep, rearmed: !!bossUnit('nest'), leash: BOSS_ENCOUNTERS.nest.room }; })()`);
        same(r.armedIn, 'nest_deep', 'armed where'); same(r.tunnel, 'nest_t1', 'the tunnel'); same(r.deep, 'nest_deep', 'the Deep Brood'); same(r.rearmed, false, 'a killed queen came back from a walk through the Nest'); same(r.leash, 'nest_deep', 'her own room');
    });
    check('THE DEFAULT CHEST (docs/CHESTS.md): tapped or E beside it, it opens once: a booster pack opened free (no shards), two items in your pack; emptied it says so; what does not fit stays in it; saved, and a new game has it shut and full', () => {
        const r = J(`(function(){ chestsReset(); playerInv = {}; const st = _fp.stations.find(s => s.id === 'st_chest_nest_b'); __put(st.x - 1.2, st.y); const sh = shardCount, cards = equipFound.length + (typeof equipOwnedSet === 'function' ? equipOwnedSet().size : 0);
            const u = stationUse(st), got = Object.values(playerInv).reduce((a, b) => a + b, 0) > 0, cards1 = equipFound.length + (typeof equipOwnedSet === 'function' ? equipOwnedSet().size : 0), can = stationCan(st);
            const st2 = _fp.stations.find(s => s.id === 'st_chest_nest_c'); playerInv = { ammo_pack: 9, repair_kit: 3, sleeping_potion: 1, scrap_metal: 30, fuel_cell: 6, flare: 6 }; __put(st2.x - 1.2, st2.y); stationUse(st2); const left = chestLeft('chest_nest_c').length;
            const saved = JSON.parse(JSON.stringify(facilitySaveCollect().chests)); chestsReset(); const fresh = chestOpened('chest_nest_b'); chestsApply(saved);
            return { ok: !!(u && u.ok), shards: shardCount === sh, got, cards: cards1 >= cards, done: !can.ok && can.why, left, saved: saved.map(e => e.id).sort().join(), fresh, back: chestOpened('chest_nest_b') && chestOpened('chest_nest_c'), sprite: chestSpriteState('chest_nest_b') }; })()`);
        same(r.ok, true, 'the chest did not open'); same(r.shards, true, 'its pack cost shards'); same(r.got, true, 'no items in the pack'); same(r.cards, true, 'the pack\'s cards not kept'); same(r.done, 'EMPTY', 'emptied');
        same(r.left, 2, 'what did not fit is not kept in the chest'); same(r.saved, 'chest_nest_b,chest_nest_c', 'the chests opened, saved'); same(r.fresh, false, 'a new game\'s chest open'); same(r.back, true, 'the save did not put them back'); same(r.sprite, 'empty', 'an emptied chest drawn');
    });

    console.log(failures ? `\n${failures} check(s) FAILED` : '\nall checks passed');
    process.exit(failures ? 1 : 0);
})();
