// THE DIVING BEETLE LARVA, the electric breed's boss (docs/ELECTRIC-BREED.md §5; js/bosses.js the row `circuitry`, js/larva.js, js/species.js; build 2026-11-14b).
// ASKED (the owner, 2026-11-13): "a boss creature will be a predaceous diving beetle larva"; its look: "A for the larva"; 2026-11-14: "The larva boss should be big", then "Build it" on the agent's
// proposal: the middle of The Circuitry; about twice THE ANT QUEEN's length, its body's reach 1.8 tiles; it wakes when you or yours come near it or hit it; twice her health at level 12, electric; SICKLE SNAP
// (her crush: every 6 s at most, 0.9 s of warning, 2.5 tiles past its body); SHOCK RING (her stomp, throwing back: every 10 s at most, when one of yours is within 3 tiles); no brood (the domain's roly-polies
// keep coming); no damage row of its own (every type ×1).
//   THE TABLES     its species (a boss only), its encounter's row, no clone, no race, no damage row
//   THE BOSS       armed on coming into the domain, asleep at its post; its size, health, level and power; waking; SICKLE SNAP; SHOCK RING; no brood while the roly-polies keep coming; held to its room;
//                  killed (nothing paid or unlocked; a fresh one next time)
//   ITS LOOK       the baked sheet's cells; the cell for a heading, a walk frame and each warning; drawBug3D hands it over; its enemy card's picture fits; a tap anywhere on its body picks it
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
function sameJSON(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`Math.random = (function(){ let s = 20261114; return function(){ s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; })();
        facilityBlackoutSet(false); gameState.running = true; alertActive = false; crystal.health = crystal.maxHealth = 1e7; canvas.width = 1280; canvas.height = 860; innerWidth = 1100; health = 1e6;
        _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; classPickerOpen = false; playerClassKey = 'gunslinger';
        globalThis.__put = (x, y) => { const c = _fpNearestCell(x, y) || [x, y]; player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1]; player.fpPath = null; };
        globalThis.__tick = (n) => { for (let i = 0; i < n; i++) { frame++; techAbilityTick(); facilityTutorialTick(); for (const a of actors.slice()) if (!a.dead) updateNPC(a); actors = actors.filter(a => !a.dead || a.isFollower); } };
        globalThis.__mid = (id) => { const R = _fp.F.byId.get(id).bb; return [(R[0] + R[2]) / 2, (R[1] + R[3]) / 2]; };
        globalThis.__dom = () => { const m = __mid('elec_servers'); __put(m[0], m[1] + 2); };   // into the electrical domain: the Deep Server Room, above The Circuitry
        globalThis.__out = () => { const m = __mid('arena'); __put(m[0], m[1]); };
        globalThis.__fresh = () => { actors = actors.filter(a => !(a instanceof Predator)); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); bossReset(); _fp.elecAt = 1e12; __out(); __tick(1); };
        globalThis.__mate = (el, hp) => { spawnFollowerAtCrystal(el || 'core'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.health = f.maxHealth = hp || 1000; f.stance = 'hold'; f.job = null; return f; };
        globalThis.__queen = () => { bossReset(); const E = BOSS_ENCOUNTERS.nest, b = _bossSpawn(E, 'asleep'), o = { hp: b.maxHealth, w: b.dimensions.width, len: null }; b.dead = true; actors.splice(actors.indexOf(b), 1); bossReset(); return o; };`);

    group('THE TABLES (js/species.js, js/bosses.js, js/damage.js, js/clone.js, js/population.js)');
    check('its species is a boss and nothing else: THE ANT QUEEN\'s block (the ant\'s boss), always electric, the electrical domain\'s, named DIVING BEETLE LARVA; no clone cost, no race, no damage row (every type ×1)', () => {
        const r = J(`(function(){ const L = SPECIES.larva, A = SPECIES.ant.boss; return { classes: ['nymph', 'worker', 'scout', 'striker', 'tank', 'boss'].filter(c => L[c]), same: ['width', 'height', 'moveSpeed', 'health', 'power', 'reactionSpeed'].every(k => L.boss[k] === A[k]),
            el: L.element, only: L.only, label: speciesLabel('larva'), cost: CLONE_COSTS.larva || null, race: speciesRace('larva'), row: DMG_RACE.larva || null, bite: DMG_RACE_BITE.larva || null,
            mult: ['slashing', 'piercing', 'projectile', 'crushing', 'earthquake', 'elemental'].map(t => dmgRowMult(dmgRow({ speciesName: 'larva' }), t)), tables: Object.values(SPAWN_TABLES).some(T => T.some(s => s.races.some(r => (ENEMY_RACES[r].species || []).includes('larva')))) }; })()`);
        sameJSON(r.classes, ['boss'], 'its classes'); ok(r.same, 'not the ant boss\'s block'); same([r.el, r.only, r.label].join(), 'electric,electrical,DIVING BEETLE LARVA', 'electric, the domain\'s, its name');
        same(r.cost, null, 'a clone cost'); same(r.race, null, 'a race'); same(r.row, null, 'a damage row'); same(r.bite, null, 'a bite type'); sameJSON(r.mult, [1, 1, 1, 1, 1, 1], 'every type ×1'); same(r.tables, false, 'on a spawn table');
    });
    check('the Clone Bay never offers it (a boss only), and its options list still builds with it in the species table', () => {
        const r = J(`(function(){ addDNA('larva_boss', 9); addDNA('ant_scout', 3); const o = getCloneOptions(); return { larva: o.filter(x => x.speciesName === 'larva').length, ant: o.some(x => x.speciesName === 'ant') }; })()`);
        same(r.larva, 0, 'larva rows'); same(r.ant, true, 'the other species\' rows');
    });
    check('its encounter, the row circuitry: The Circuitry\'s middle, armed by the electrical domain, twice the queen\'s size, a body 1.8 tiles round, level 12, electric, woken by a hit or one of yours near, pays nothing; SICKLE SNAP and SHOCK RING with the approved timings; no brood', () => {
        const r = J(`(function(){ const E = BOSS_ENCOUNTERS.circuitry, N = BOSS_ENCOUNTERS.nest, M = E.moves; return { room: E.room, place: E.place, sp: E.species + '/' + E.cls, size: E.size / N.size, bodyR: E.bodyR, level: E.level, el: E.element, test: E.test, wakes: E.wakes.join(), wakeNear: E.wakeNear, name: E.name,
            crush: [M.crush.name, M.crush.every, M.crush.windup, M.crush.reach, M.crush.arc, M.crush.power, M.crush.type], stomp: [M.stomp.name, M.stomp.every, M.stomp.windup, M.stomp.trigger, M.stomp.radius, M.stomp.power, M.stomp.push, M.stomp.type], brood: M.brood || null, kinds: Object.keys(M).join() }; })()`);
        same([r.room, r.place, r.sp].join(), 'elec_circuitry,electrical,larva/boss', 'where and what'); same(r.size, 2, 'twice her size'); same(r.bodyR, 1.8, 'its body'); same([r.level, r.el, r.test].join(), '12,electric,true', 'level 12, electric, a test boss (pays nothing)');
        same([r.wakes, r.wakeNear].join(), 'hit,near,2.5', 'what wakes it (hers)'); same(r.name, 'THE DIVING BEETLE LARVA', 'its tag');
        sameJSON(r.crush, ['SICKLE SNAP', 360, 54, 2.5, 1, 0.4, 'piercing'], 'SICKLE SNAP: every 6 s, 0.9 s of warning, 2.5 tiles past its body, her wedge and strength'); sameJSON(r.stomp, ['SHOCK RING', 600, 72, 3, 3.6, 0.25, 0.35, 'elemental'], 'SHOCK RING: every 10 s, within 3 tiles, her ring');
        same(r.brood, null, 'a brood'); same(r.kinds, 'crush,stomp', 'its moves');
    });

    group('THE BOSS (js/bosses.js): armed on coming into the domain, big, two moves, held to its room, pays nothing');
    check('coming into the electrical domain (the Deep Server Room, before its own room) arms it: asleep at its post in the middle of The Circuitry; twice THE ANT QUEEN\'s drawn size and health, at level 12 with the ant boss block\'s power there; electric; no plain bite and no special; paying nothing', () => {
        const r = J(`(function(){ const q = __queen(); __fresh(); const before = !!bossUnit('circuitry'); __dom(); __tick(1); const b = bossUnit('circuitry'), S = bossState('circuitry'), m = __mid('elec_circuitry');
            const ref = spawnCreature({ species: 'ant', className: 'boss', x: b.x, y: b.y, level: 12, state: 'wander' }), refPow = ref.power; ref.dead = true; actors.splice(actors.indexOf(ref), 1);
            return { before, where: partyRoomAt(player.x, player.y), state: S.state, asleep: b.bossAsleep, name: b.bossName, level: b.level, hp: b.maxHealth, qhp: q.hp, w: b.dimensions.width, qw: q.w, bodyR: b.bodyR, pow: b.power, refPow,
                el: b.element, noBite: b.noBite, ability: b.abilityDef, noReward: b.noReward, room: partyRoomAt(b.x, b.y), mid: Math.hypot(b.x - m[0], b.y - m[1]) < 1.5, reach: b.biteReach }; })()`);
        same(r.before, false, 'a larva before you came'); same(r.where, 'elec_servers', 'you are in the room above'); same([r.state, r.asleep, r.name, r.level].join(), 'armed,true,THE DIVING BEETLE LARVA,12', 'armed asleep');
        same([r.room, r.mid].join(), 'elec_circuitry,true', 'its post'); same(r.w, r.qw * 2, 'twice her size'); same(r.bodyR, 1.8, 'its body');
        ok(Math.abs(r.hp / r.qhp - 2) < 0.01, 'twice her health: ' + r.hp + ' (hers ' + r.qhp + ')'); same(r.pow, r.refPow, 'the ant boss block\'s power at level 12'); same(r.el, 'electric', 'electric');
        same([r.noBite, r.ability, r.noReward].join(), 'true,,true', 'no bite, no special, no reward');
    });
    check('it wakes when one of yours comes near it (2.5 tiles from its body), or when it is hit; asleep, your squad leaves it be; awake it goes after you', () => {
        const r = J(`(function(){ __fresh(); __dom(); __tick(1); const b = bossUnit('circuitry'), S = bossState('circuitry'); const o = { passive: bossPassive(b) };
            __put(b.x - 5.5, b.y); __tick(2); o.far = S.state; __put(b.x - 3.6, b.y); __tick(2); o.near = [S.state, b.bossAsleep, b.provoked];
            __fresh(); __dom(); __tick(1); const b2 = bossUnit('circuitry'), S2 = bossState('circuitry'); __put(b2.x - 7, b2.y); __tick(1); o.far2 = S2.state; applyDamage(b2, 1, player); __tick(2); o.hit = [S2.state, b2.bossAsleep]; return o; })()`);
        same(r.passive, true, 'asleep, a target for your squad'); same(r.far, 'armed', 'woke with nobody near'); same(r.near.join(), 'active,false,true', 'near it'); same(r.far2, 'armed', 'woke from across its room'); same(r.hit.join(), 'active,false', 'hit');
    });
    check('SICKLE SNAP: one of yours in reach of its jaws: it stands rooted for 0.9 s (a wedge in front of it, its jaws wide), then everyone of yours in the wedge takes 0.4 times its power, a piercing hit half of it electric; one behind it does not; you take one of your hits; its jaws shut a moment', () => {
        const r = J(`(function(){ __fresh(); __dom(); __tick(1); const b = bossUnit('circuitry'), S = bossState('circuitry'), M = BOSS_ENCOUNTERS.circuitry.moves.crush; bossWake('circuitry', 'hit');
            const a = __mate('core'), c = __mate('core'), seen = [], hits = [], real = applyDamage; applyDamage = function (t, amt, src, el, rf, fx, hit) { if (src === b) hits.push(hit && hit.type); return real.apply(this, arguments); };
            const place = () => { a.x = b.x + 3.2; a.y = b.y; c.x = b.x - 3.2; c.y = b.y + 0.1; __put(b.x + 3.6, b.y + 0.4); };
            place(); player.invuln = 0; health = 5; S.crushAt = frame; S.stompAt = frame + 1e6; __tick(1);
            const o = { cast: S.cast && S.cast.kind, held: [b.moveSpeed, b.baseMoveSpeed], wind: S.cast ? S.cast.until - S.cast.t0 : 0, cell: larvaCell(b).charAt(0) }; const h0 = [a.health, c.health];
            for (let i = 0; i < M.windup + 2; i++) { place(); __tick(1); seen.push(larvaCell(b).charAt(0)); }
            applyDamage = real; o.dealt = [Math.round(h0[0] - a.health), Math.round(h0[1] - c.health)]; o.want = Math.round(b.power * M.power); o.health = health; o.hits = [...new Set(hits)].join(); o.shut = seen.slice(-2).join(); o.moving = b.baseMoveSpeed > 0; return o; })()`);
        same(r.cast, 'crush', 'the warning'); same(r.held.join(), '0,0', 'rooted while it warns'); same(r.wind, 54, 'its 0.9 s'); same(r.cell, 'o', 'its jaws wide');
        ok(r.dealt[0] > 0 && Math.abs(r.dealt[0] - r.want) <= r.want * 0.6 + 1, 'the one in the wedge took ' + r.dealt[0] + ' (its snap ' + r.want + ')'); same(r.dealt[1], 0, 'the one behind it was hit');
        same(r.health, 4, 'your hits'); same(r.hits, 'piercing', 'its kind of hit'); same(r.shut, 's,s', 'its jaws shut after'); same(r.moving, true, 'still rooted after it');
    });
    check('SHOCK RING: one of yours within 3 tiles of its body: its seams flash (a ring out to its reach), then everyone of yours inside the ring takes 0.25 times its power, all of it electric, and is thrown back; you take one of your hits', () => {
        const r = J(`(function(){ __fresh(); __dom(); __tick(1); const b = bossUnit('circuitry'), S = bossState('circuitry'), M = BOSS_ENCOUNTERS.circuitry.moves.stomp; bossWake('circuitry', 'hit');
            const a = __mate('core'), hits = [], real = applyDamage; applyDamage = function (t, amt, src, el, rf, fx, hit) { if (src === b) hits.push(hit && hit.type); return real.apply(this, arguments); };
            const place = () => { a.x = b.x; a.y = b.y - 3.4; __put(b.x - 4.4, b.y + 0.5); }; place(); player.invuln = 0; health = 5; S.stompAt = frame; S.crushAt = frame + 1e6; __tick(1);
            const o = { cast: S.cast && S.cast.kind, wind: S.cast ? S.cast.until - S.cast.t0 : 0, cells: [] }; const h0 = a.health;
            for (let i = 0; i < M.windup + 1; i++) { place(); __tick(1); if (S.cast) o.cells.push(larvaCell(b).charAt(0)); }
            applyDamage = real; o.dealt = Math.round(h0 - a.health); o.want = Math.round(b.power * M.power); o.kb = Math.hypot(a.kbVX || 0, a.kbVY || 0) > 0 || Math.hypot(a.x - b.x, a.y - b.y) > 3.4; o.health = health; o.hits = [...new Set(hits)].join();
            o.flash = [...new Set(o.cells)].sort().join(); return o; })()`);
        same(r.cast, 'stomp', 'the warning'); same(r.wind, 72, 'its 1.2 s'); same(r.flash, 'w,z', 'its seams flashing'); ok(r.dealt > 0 && Math.abs(r.dealt - r.want) <= r.want * 0.6 + 1, 'it took ' + r.dealt + ' (its ring ' + r.want + ')');
        same(r.hits, 'elemental', 'all of it electric'); same(r.kb, true, 'thrown back'); same(r.health, 4, 'your hits');
    });
    check('no brood: a long fight calls none, while the domain\'s roly-polies keep coming (its spawner is not counted against the larva)', () => {
        const r = J(`(function(){ __fresh(); __dom(); __tick(1); const b = bossUnit('circuitry'), S = bossState('circuitry'); bossWake('circuitry', 'hit'); __put(b.x - 6, b.y);
            _fp.elecAt = undefined; const o = {}; for (let i = 0; i < 1800; i++) { __put(b.x - 6, b.y); b.health = b.maxHealth; __tick(1); }
            o.brood = facilityCreatures().filter(a => a.bossWave === 'circuitry').length; o.broodAt = S.broodAt == null; o.roly = facilityCreatures('electrical').filter(a => a.speciesName === 'rolypoly' && !a.dead).length; return o; })()`);
        same(r.brood, 0, 'its brood'); same(r.broodAt, true, 'a brood timer'); ok(r.roly > 0, 'no roly-polies came');
    });
    check('held to its room: when you leave The Circuitry it lets go, walks back to its post and sleeps again there, its wounds kept; it never leaves its room', () => {
        const r = J(`(function(){ __fresh(); __dom(); __tick(1); const b = bossUnit('circuitry'), S = bossState('circuitry'), at = bossLair(BOSS_ENCOUNTERS.circuitry); bossWake('circuitry', 'hit'); b.health -= 100; b.x += 2; const hp = b.health;
            __dom(); let n = 0; for (; n < 3000 && S.state !== 'armed'; n++) __tick(1);
            return { state: S.state, asleep: b.bossAsleep, home: Math.hypot(b.x - at[0], b.y - at[1]) < 1.5, hp: b.health === hp, room: partyRoomAt(b.x, b.y), same: bossUnit('circuitry') === b, took: n }; })()`);
        same([r.state, r.asleep, r.home, r.hp, r.room, r.same].join(), 'armed,true,true,true,elec_circuitry,true', 'asleep at home, wounds kept (took ' + r.took + ' frames)');
    });
    check('killed: the encounter is resolved (defeated), nothing is paid (no shards, DNA or XP), nothing unlocks (a test boss counts for no boss); leave the domain and come back, and a fresh one waits', () => {
        const r = J(`(function(){ __fresh(); __dom(); __tick(1); const b = bossUnit('circuitry'), S = bossState('circuitry'); bossWake('circuitry', 'hit');
            const f = __mate('core'); partyTick(); const xp0 = f.xp || 0, sh0 = shardCount, dna0 = JSON.stringify(typeof dnaBank !== 'undefined' ? dnaBank : null);
            b.lastAttacker = f; applyDamage(b, 1e9, f); __tick(2); for (const a of actors) if (a instanceof Predator && a.dead && !a.deathProcessed) { a.deathProcessed = true; onPredatorDeath(a); } if (typeof awardKillXp === 'function') awardKillXp(b);
            const o = { state: S.state, outcome: S.outcome, unit: !!bossUnit('circuitry'), shards: shardCount - sh0, xp: (f.xp || 0) - xp0, dna: JSON.stringify(typeof dnaBank !== 'undefined' ? dnaBank : null) === dna0, any: bossAnyResolved() };
            __put(b.x - 2, b.y); __tick(2); o.stillGone = !bossUnit('circuitry'); __out(); __tick(2); __dom(); __tick(1); const b2 = bossUnit('circuitry'); o.again = [!!b2 && b2 !== b, bossState('circuitry').state, b2 && b2.health === b2.maxHealth]; return o; })()`);
        same([r.state, r.outcome, r.unit].join(), 'resolved,defeated,false', 'defeated'); same([r.shards, r.xp, r.dna].join(), '0,0,true', 'paid'); same(r.any, false, 'counted for the first boss (Booster Pack 2)');
        same(r.stillGone, true, 'back while you stay in the domain'); same(r.again.join(), 'true,armed,true', 'a fresh larva');
    });
    check('the save: an armed or awake larva is armed again on a load, asleep and whole at its post; a load with no larva in it arms none until you come into the domain', () => {
        const r = J(`(function(){ __fresh(); __dom(); __tick(1); const b = bossUnit('circuitry'); bossWake('circuitry', 'hit'); b.health -= 300; const snap = bossSnapshot(); bossReset(); actors = actors.filter(a => !(a instanceof Predator));
            bossApply(JSON.parse(JSON.stringify(snap))); const b2 = bossUnit('circuitry'), o = { saved: snap.circuitry && snap.circuitry.state, state: bossState('circuitry').state, whole: !!b2 && b2.health === b2.maxHealth, asleep: !!b2 && b2.bossAsleep };
            bossReset(); actors = actors.filter(a => !(a instanceof Predator)); bossApply({}); o.none = !bossUnit('circuitry'); return o; })()`);
        same([r.saved, r.state, r.whole, r.asleep].join(), 'active,armed,true,true', 'armed again'); same(r.none, true, 'a larva from nothing');
    });

    group('ITS LOOK (js/larva.js; img/props/larva.png, design/props/models/larva.js); its card and its tap');
    check('the baked sheet has eight facings of four walk frames, its jaws wide (o), its jaws shut (s) and its seams charged (z)', () => {
        const r = J(`Object.keys(PROP_ATLAS.larva.cells).sort()`), want = [];
        for (let d = 0; d < 8; d++) { want.push('o' + d, 's' + d, 'z' + d); for (let f = 0; f < 4; f++) want.push('w' + d + '_' + f); }
        sameJSON(r, want.sort(), 'its cells');
    });
    check('the cell: its heading in eighths (0 the game\'s +x), the walk frame from its walk cycle while it walks, frame 0 asleep or standing', () => {
        const r = J(`(function(){ __fresh(); __dom(); __tick(1); const b = bossUnit('circuitry'), o = {}; b.state = 'idle';
            b.dirX = 1; b.dirY = 0; o.e = larvaCell(b); b.dirX = 0; b.dirY = 1; o.s = larvaCell(b); b.dirX = -1; b.dirY = 0; o.w = larvaCell(b); b.dirX = 0.7; b.dirY = -0.7; o.ne = larvaCell(b);
            b.state = 'hunt'; b.bossAsleep = false; b.dirX = 1; b.dirY = 0; const seen = {}; for (let i = 0; i < 80; i++) { b.walkCycle = i * 0.4; seen[larvaCell(b)] = 1; } o.frames = Object.keys(seen).sort();
            b.bossAsleep = true; b.walkCycle = 5; o.asleep = larvaCell(b); return o; })()`);
        same([r.e, r.s, r.w, r.ne].join(), 'w0_0,w2_0,w4_0,w7_0', 'its facings'); sameJSON(r.frames, ['w0_0', 'w0_1', 'w0_2', 'w0_3'], 'the four walk frames'); same(r.asleep, 'w0_0', 'asleep');
    });
    check('drawBug3D hands it to its sheet (baked at its own size: drawn at 1 by its width), and stands a beetle in while the sheet is not there', () => {
        const r = J(`(function(){ __fresh(); __dom(); __tick(1); const p = bossUnit('circuitry'), o = {}, calls = []; const g = { save(){}, restore(){}, drawImage(...a){ calls.push(a); }, globalAlpha: 1 };
            const real = _psImg; _psImg = () => ({ complete: true, naturalWidth: 10 }); o.h = drawBug3D(p, 100, 100, g); o.calls = calls.length; o.args = calls[0] ? calls[0].slice(1) : null;
            const c = PROP_ATLAS.larva.cells[larvaCell(p)], k = p.dimensions.width / LARVA.width / LARVA.res; o.k = k; o.want = [c.x, c.y, c.w, c.h, 100 - c.ax * k, 100 - c.ay * k, c.w * k, c.h * k]; o.top = c.ay * k;
            _psImg = () => null; let beetle = 0; const rb = drawBeetle3D; drawBeetle3D = () => { beetle++; }; drawBug3D(p, 100, 100, g); drawBeetle3D = rb; _psImg = real; o.beetle = beetle; o.style = bugBodyStyle(p); return o; })()`);
        same(r.calls, 1, 'one blit'); same(r.k, 1, 'drawn at its baked size'); sameJSON(r.args.map(v => Math.round(v * 100) / 100), r.want.map(v => Math.round(v * 100) / 100), 'the cell, at its ground point');
        same(r.h, r.top, 'its height for the bars'); same(r.beetle, 1, 'a beetle stands in'); same(r.style, 'larva', 'its body style');
    });
    check('about twice THE ANT QUEEN\'s length on the floor: lying across the screen its cell is about twice as wide as she is drawn (191 px at her size, measured 2026-11-14)', () => {
        const r = J(`[PROP_ATLAS.larva.cells.w3_0.w, PROP_ATLAS.larva.cells.w7_0.w]`);
        for (const w of r) ok(w >= 191 * 1.8 && w <= 191 * 2.2, 'across: ' + w + ' px');
    });
    check('its enemy card\'s picture is drawn in a box that holds it (THE ANT QUEEN\'s box is as it was); the picture waits for its sheet', () => {
        const r = J(`(function(){ __fresh(); __dom(); __tick(1); const b = bossUnit('circuitry'), B = _tgBox(b), q = _tgBox({ dimensions: { width: 78 } }), s = _tgBox({ dimensions: { width: 26 } }); const c = PROP_ATLAS.larva.cells.w2_0;
            return { B, q: q.n, s: s.n, fits: c.ax <= B.ox && c.w - c.ax <= B.n - B.ox && c.ay <= B.oy && c.h - c.ay <= B.n - B.oy, key: /larvaArtReady/.test(targetPortrait.toString()) && /larvaArtReady/.test(targetBigPortraitURL.toString()) }; })()`);
        ok(r.fits, 'the portrait\'s facing does not fit its box: ' + JSON.stringify(r.B)); same(r.q, 260, 'the queen\'s box'); same(r.s, 260, 'a creature\'s box'); same(r.key, true, 'the picture waits for its sheet');
    });
    check('its enemy card names its strength by its own move: SNAP and SICKLE SNAP\'s strength (0.4 × its power), not CRUSH or BITE (THE ANT QUEEN\'s card still says CRUSH)', () => {
        const r = J(`(function(){ __fresh(); __dom(); __tick(1); const b = bossUnit('circuitry'); const o = { label: _tgBiteLabel(b), k: _tgBiteK(b) }; bossReset(); const q = _bossSpawn(BOSS_ENCOUNTERS.nest, 'asleep'); o.queen = _tgBiteLabel(q); q.dead = true; actors.splice(actors.indexOf(q), 1); bossReset(); return o; })()`);
        same([r.label, r.k, r.queen].join(), 'SNAP,0.4,CRUSH', 'the card\'s word and strength');
    });
    check('a tap anywhere on its body picks it (its body\'s reach added to the pick), not only at its middle', () => {
        const r = J(`(function(){ __fresh(); __dom(); __tick(1); const b = bossUnit('circuitry'); __put(b.x - 4, b.y - 4); __tick(1); _bv.z = 1;
            const px = (b.x - player.visualX - (b.y - player.visualY)) * TILE_W + canvas.width / 2, py = (b.x - player.visualX + (b.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H - facilityLiftRel(b.x, b.y) - 55;
            return { mid: findEnemyAtScreen(px, py) === b, side: findEnemyAtScreen(px + 140, py) === b, far: findEnemyAtScreen(px + 260, py) === b }; })()`);
        same(r.mid, true, 'its middle'); same(r.side, true, '140 px along its body'); same(r.far, false, 'beyond its body');
    });

    console.log('\n' + (failures ? failures + ' FAILED' : 'all passed'));
    process.exit(failures ? 1 : 0);
})();
