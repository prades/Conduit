// THE FOUNDATION: the facility is the whole game (ASKED: "we need to get rid of the old systems, like the build feature, the different zones, and the nests, and the batteries, and the turrets. The shield
// generators, all of that stuff from the old system needs to go away, including the tunnel. We need to completely make this game our foundation.")
//   NOTHING OF THE OLD STRIP GAME IS LEFT: not its files, not its names, not its page chrome, not its saves.
//   THE PAGE BOOTS THE FACILITY: the squad of three in the Crystal Chamber, every element online, the one save key.
//   THE NEW RULES: a kill pays its crystals on the spot (and its DNA, and counts); every creature is made by spawnCreature; the arena's level is what a clone and a recruit are made to;
//   a follower's ultimate works within its reach, not a zone; fire bombs stop at the facility's walls; the settings are kept under the facility's own keys.
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

// The files and the names of the old systems: none may exist or be mentioned by the game's code.
const OLD_FILES = ['zones', 'world', 'waves', 'wavedata', 'power', 'kits', 'kitui', 'buildmenu', 'modules', 'camp', 'raids', 'nightraids', 'breakout', 'formations', 'ultra', 'infest', 'mass', 'clonework', 'codex',
    'labwall', 'wallunit', 'autoplay', 'squads', 'ui', 'dev', 'rng', 'save', 'shieldcells', 'broods', 'nethud', 'indexart', 'predator_randomizer'].map(f => 'js/' + f + '.js');
const OLD_NAMES = ['spawnPredatorForZone', 'generateSegment', 'ensureWorldTo', 'zonePredators', 'ZONE_LENGTH', 'nightNumber', 'activeDayZones', 'getZoneIndex', 'nextZoneToTake', 'applyZoneDifficulty', 'predatorLevelFor',
    'savePylons', 'saveNests', 'saveShards', 'saveSession', 'saveGame', 'facilityMode', 'isHomePortal', 'SYNTHETIC_SPECIES', 'maybeApplyEliteDef', 'environmentalHazards', 'spawnHazardsForDay', 'PYLON_KINDS', 'PYLON_BUILD_COST',
    'workerTick', 'awardWorkXp', 'workXpScale', '_modChoices', 'pendingElements', 'ELEMENT_LADDER', 'activatePendingElement', 'MAX_LIVE_PREDATORS', 'buildMode', 'toggleBuild', 'openMidGameShop', 'squadOf', 'rollInfestSettle',
    'hurtEquipmentInRadius', 'fireTurretThrow', 'fireAimTap', 'SUPER_REPAIR', 'CLONE_JOBS', 'canWorkMass', 'cloneJob'];

(async () => {
    const store = {};
    const context = vm.createContext(makeBrowserSandbox(store));
    const loadErrors = [];
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) { loadErrors.push(rel + ': ' + e.message.split('\n')[0]); } }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));

    group('NOTHING OF THE OLD STRIP GAME IS LEFT');
    check('none of its files exists, and game.html loads no file that does not exist', () => {
        const gone = OLD_FILES.filter(f => fs.existsSync(path.join(ROOT, f))); same(gone.join(), '', 'still on disk');
        const order = scriptOrder(), missing = order.filter(f => !fs.existsSync(path.join(ROOT, f))); same(missing.join(), '', 'loaded but missing');
        const stale = order.filter(f => OLD_FILES.includes(f)); same(stale.join(), '', 'still loaded');
    });
    check('every file in js/ is loaded by the page (no dead file), in the order the page lists', () => {
        const all = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js')).map(f => 'js/' + f).sort(), order = scriptOrder();
        const orphans = all.filter(f => !order.includes(f)); same(orphans.join(), '', 'in js/ but not loaded');
        ok(order.length === all.length, order.length + ' loaded, ' + all.length + ' on disk');
    });
    check('no file of the game names a thing of the old systems', () => {
        const hits = [];
        for (const f of scriptOrder().concat(['game.html'])) { const src = rd(f); for (const n of OLD_NAMES) if (new RegExp('(?<![\\w$.])' + n.replace(/\$/g, '\\$') + '(?![\\w$])').test(src)) hits.push(f + ':' + n); }
        same(hits.join(' '), '', 'still named');
    });
    check('the page has no other game to open, no wave line, no build button; the dock is ROSTER, CARDS, CLONES, SETTINGS, PACK, MAP, ?; the room tag is a plate, not a button', () => {
        const H = rd('game.html');
        ok(!/\?classic|CLASSIC GAME|facilityPlayChip/.test(H), 'the classic game is still on the page');
        ok(!/id="waveInfo"|id="btnBuild"|id="btnSquad"|id="padHud"|id="aimRing"/.test(H), 'old chrome is still on the page');
        const dock = H.slice(H.indexOf('id="dockScroll"'), H.indexOf('</div>', H.indexOf('id="dockScroll"')));
        const labels = [...dock.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim());
        same(labels.join('|'), 'ROSTER|CARDS|CLONES|SETTINGS|PACK|MAP|?', 'the dock');
        const tag = (H.match(/<div id="zoneInfo"[^>]*>/) || [''])[0]; ok(tag && !/onclick|role="button"/.test(tag), 'the room tag is still a button: ' + tag);
    });
    check('every file evaluates, and the game state is the facility\'s: running, and nothing of nights or zones', () => {
        same(loadErrors.join(' | '), '', 'load errors');
        same(J('Object.keys(gameState)').join(), 'running', 'gameState');
        same(run('typeof world[0].pillar + typeof world[0].nest'), 'undefinedundefined', 'a floor tile carries no pylon or nest fields');
        same(J('[world[0].type, world[0].facility, typeof world[0].room]').join(), 'floor,true,string', 'a floor tile');
    });

    group('THE PAGE BOOTS THE FACILITY');
    check('the facility is up when the files have loaded: the squad of three beside the Crystal in its chamber, every element online, the starting crystals, and the arena\'s creatures out', () => {
        const r = J(`(function(){ return { fp: facilityPlay, n: followers.length, room: facilityZoneName(), els: [...unlockedElements].sort().join(), shards: shardCount, start: STARTING_SHARDS, creatures: actors.filter(a => a.team !== 'green' && a.speciesName && !a.dead).length, cap: FP_SPAWN.cap, near: followers.every(f => Math.hypot(f.x - crystal.x, f.y - crystal.y) < 6) }; })()`);
        same(r.fp, true, 'facilityPlay'); same(r.n, 3, 'the squad'); same(r.room, 'Crystal Chamber', 'the room'); same(r.els, 'core,electric,fire,flux,ice,toxic', 'every element'); same(r.shards, r.start, 'the starting crystals');
        ok(r.creatures >= 1 && r.creatures <= r.cap, r.creatures + ' creatures (cap ' + r.cap + ')'); same(r.near, true, 'the squad is at the Crystal');
    });
    check('it writes only its own keys: conduit_fp_*; the save carries the crystals and the kill count, and puts them back', () => {
        run('toggleGfxLow(); togglePerfReadout(); toggleGfxLow(); togglePerfReadout(); shardCount = 137; lifetimeKills = 4; _fp.saveReady = true; facilitySaveWrite();');
        const keys = Object.keys(store); ok(keys.length >= 3, 'nothing was written: ' + keys.join()); same(keys.filter(k => !/^conduit_fp_/.test(k)).join(), '', 'a key that is not the facility\'s');
        ok(keys.includes('conduit_fp_gfx') && keys.includes('conduit_fp_perf') && keys.includes('conduit_fp_save'), 'the keys: ' + keys.join());
        const d = JSON.parse(store.conduit_fp_save); same(d.shards, 137, 'the crystals in the save'); same(d.kills, 4, 'the kills in the save');
        const r = J('(function(){ shardCount = 5; lifetimeKills = 0; facilitySaveApply(JSON.parse(localStorage.getItem("conduit_fp_save"))); return [shardCount, lifetimeKills]; })()'); same(r.join(), '137,4', 'put back');
        run('shardCount = STARTING_SHARDS; lifetimeKills = 0;');
    });

    group('A KILL PAYS ON THE SPOT');
    run('facilityBlackoutSet(false); alertActive = false;');
    check('spawnCreature makes a creature of the species and class asked for: on the red side, worth its class\'s crystals and DNA, with its ability, at the arena\'s level, where it was put, wandering while no alarm is up', () => {
        const r = J(`(function(){ const n = actors.length, p = spawnCreature({ species: 'beetle', className: 'tank', x: crystal.x + 3, y: crystal.y + 1 }); const d = SPECIES.beetle.tank;
            return { made: !!p, inActors: actors.includes(p), added: actors.length - n, team: p.team, sp: p.speciesName, cls: p.className, worth: [p.shardDrop, d.shardDrop], dna: [p.dnaDrops, d.dnaDrops], ability: p.abilityKey, level: [p.level, creatureLevel()], at: [p.x, p.y, crystal.x + 3, crystal.y + 1], state: p.state, base: p.baseMoveSpeed === p.moveSpeed, hp: p.health === p.maxHealth && p.maxHealth > 0 }; })()`);
        same(r.made && r.inActors, true, 'made'); same(r.added, 1, 'one creature'); same(r.team, 'red', 'team'); same(r.sp + ' ' + r.cls, 'beetle tank', 'what it is'); same(r.worth[0], r.worth[1], 'crystals'); same(r.dna[0], r.dna[1], 'DNA');
        same(r.ability, 'CARAPACE_SLAM', 'its special'); same(r.level[0], r.level[1], 'the arena\'s level'); same(r.at[0], r.at[2], 'x'); same(r.at[1], r.at[3], 'y'); same(r.state, 'wander', 'calm'); same(r.base && r.hp, true, 'its base speed and full health');
    });
    check('it refuses what the table does not have (an unknown species, an unknown class) and makes nothing; a level and a state asked for are honoured; an alarm makes it hunt', () => {
        const r = J(`(function(){ const n = actors.length, o = {}; o.noSp = spawnCreature({ species: 'XV-09', className: 'scout' }); o.noCls = spawnCreature({ species: 'ant', className: 'nope' }); o.added = actors.length - n;
            const p = spawnCreature({ species: 'ant', className: 'scout', level: 12, state: 'hunt' }); o.lv = p.level; o.st = p.state; p.dead = true;
            alertActive = true; const q = spawnCreature({ species: 'ant', className: 'scout' }); o.alarm = q.state; q.dead = true; alertActive = false; actors = actors.filter(a => !a.dead); return o; })()`);
        same(r.noSp, null, 'an unknown species'); same(r.noCls, null, 'an unknown class'); same(r.added, 0, 'nothing added'); same(r.lv, 12, 'the level asked for'); same(r.st, 'hunt', 'the state asked for'); same(r.alarm, 'hunt', 'hunting under an alarm');
    });
    check('THE ASK ("kills pay directly"): the creature a follower kills pays its crystals at once, says so over itself, drops its DNA under species_class, counts, and pays XP to the killer', () => {
        const r = J(`(function(){ const f = followers.find(x => !x.dead), c = actors.find(a => a.speciesName === 'beetle' && a.className === 'tank' && !a.dead); const o = { before: shardCount, worth: c.shardDrop, kills0: lifetimeKills, xp0: f.xp, dna0: getDNA()['beetle_tank'] || 0, dnaDrops: c.dnaDrops };
            floatingTexts.length = 0; c.lastAttacker = f; applyDamage(c, 1e6, f); render(); render();
            o.after = shardCount; o.dead = c.dead; o.gone = !actors.includes(c); o.kills = lifetimeKills; o.xp = f.xp; o.dna = getDNA()['beetle_tank'] || 0; o.text = floatingTexts.map(t => t.text).join('|'); return o; })()`);
        same(r.after - r.before, r.worth, 'the crystals'); same(r.dead && r.gone, true, 'dead and swept'); same(r.kills - r.kills0, 1, 'counted'); ok(r.xp > r.xp0, 'XP to the killer'); same(r.dna - r.dna0, r.dnaDrops, 'its DNA'); ok(new RegExp('◆ ' + r.worth).test(r.text), 'it says: ' + r.text);
    });
    check('a nymph pays nothing (its DNA is an ant scout\'s)', () => {
        const r = J(`(function(){ const f = followers.find(x => !x.dead), c = spawnCreature({ species: 'ant', className: 'nymph', x: crystal.x + 2, y: crystal.y + 2 }); const before = shardCount, dna0 = getDNA()['ant_scout'] || 0; floatingTexts.length = 0; c.lastAttacker = f; applyDamage(c, 1e6, f); render();
            return { paid: shardCount - before, dna: (getDNA()['ant_scout'] || 0) - dna0, text: floatingTexts.map(t => t.text).join('|') }; })()`);
        same(r.paid, 0, 'crystals'); ok(r.dna >= 1, 'its DNA'); ok(!/◆/.test(r.text), 'it said: ' + r.text);
    });

    group('THE ARENA\'S LEVEL');
    check('creatureLevel is the top of the arena spawner\'s band, never under LEVEL_START; a recruit comes out RECRUIT_BEHIND under it; a clone comes out at it (or with its own)', () => {
        const r = J(`(function(){ const o = { lv: creatureLevel(), band: FP_SPAWN.levels, start: LEVEL_START, recruit: recruitLevel(), behind: RECRUIT_BEHIND };
            const c = makeClone('ant', 'scout', crystal.x + 1, crystal.y + 1); o.clone = c ? c.level : null; o.cloneSide = c && c.team; o.cloneIs = c && c.isClone; c.dead = true;
            const k = makeClone('beetle', 'striker', crystal.x + 1, crystal.y + 1, 'wander', { level: 9, xp: 1000 }); o.own = k ? [k.level, k.xp] : null; k.dead = true; o.none = makeClone('XV-09', 'scout', 1, 1); actors = actors.filter(a => !a.dead); return o; })()`);
        same(r.lv, Math.max(r.start, r.band[1]), 'creatureLevel'); ok(r.lv >= r.start, 'under LEVEL_START'); same(r.recruit, Math.max(r.start, r.lv - r.behind), 'recruitLevel'); same(r.clone, r.lv, 'a new clone'); same(r.cloneSide, 'green', 'on your side'); same(r.cloneIs, true, 'a clone');
        same(r.own && r.own[0], 9, 'a clone with its own level'); ok(r.own && r.own[1] >= 1000, 'and its own xp'); same(r.none, null, 'a species the table does not have');
    });
    check('the arena spawner makes its creatures in the band, wandering, of the arena, through spawnCreature', () => {
        const r = J(`(function(){ const p = facilitySpawnCreature('mantis'); return p ? { lv: p.level, band: FP_SPAWN.levels, st: p.state, room: p.homeRoom, fp: p.fpCreature, sp: p.speciesName, inArena: facilityRoomAt(p.x, p.y, _fp.F) && facilityRoomAt(p.x, p.y, _fp.F).id } : null; })()`);
        ok(r, 'nothing was made'); ok(r.lv >= r.band[0] && r.lv <= r.band[1], 'level ' + r.lv); same(r.st, 'wander', 'wandering'); same(r.room, 'arena', 'its home'); same(r.fp, true, 'the arena\'s'); same(r.sp, 'mantis', 'the species asked'); same(r.inArena, 'arena', 'in the arena');
        ok(/spawnCreature\(/.test(rd('js/facilityspawn.js')) && /spawnCreature\(/.test(rd('js/tutorial.js')), 'the spawner and the tutorial use spawnCreature');
    });

    group('AN ULTIMATE WORKS WITHIN ITS REACH');
    run(`globalThis.__foes = (f) => { actors = actors.filter(a => !(a.speciesName) || a.isClone); const near = spawnCreature({ species: 'ant', className: 'scout', x: f.x + 4, y: f.y }), far = spawnCreature({ species: 'ant', className: 'scout', x: f.x + 40, y: f.y }); for (const c of [near, far]) { c.shielded = true; c.shieldAmount = 5; c._shieldMax = 5; c.moveSpeed = 0; } return [near, far]; };`);
    check('ULT_REACH is twelve tiles; the toxic smoke, the flux disorient and the EMP reach the creature four tiles off and not the one forty tiles off; the smoke and the blizzard carry a radius, not a zone', () => {
        const r = J(`(function(){ const f = followers.find(x => !x.dead), o = { reach: ULT_REACH, smokeReach: SMOKE_SCREEN_REACH }; let [near, far] = __foes(f);
            f.ultimateCharge = 100; FOLLOWER_ULTIMATES.toxic.execute(f); o.smoke = [near.smokeDebuff > 0, far.smokeDebuff > 0]; const sm = elementEffects.find(e => e.type === 'smokeScreen'); o.smokeFx = sm ? [sm.radius, sm.zone === undefined] : null;
            f.ultimateCharge = 100; FOLLOWER_ULTIMATES.flux.execute(f); o.dis = [near.disoriented > 0, far.disoriented > 0];
            f.ultimateCharge = 100; FOLLOWER_ULTIMATES.electric.execute(f); o.emp = [near.shielded, far.shielded]; o.empFx = activeEmpEffect ? Object.keys(activeEmpEffect).sort().join() : null;
            f.ultimateCharge = 100; FOLLOWER_ULTIMATES.ice.execute(f); const bz = elementEffects.find(e => e.type === 'blizzardField'); o.bz = bz ? [bz.radius, bz.zone === undefined, bz.x === f.x && bz.y === f.y] : null; o.charge = f.ultimateCharge; return o; })()`);
        same(r.reach, 12, 'ULT_REACH'); same(r.smokeReach, 12, 'the smoke creeps as far'); same(r.smoke.join(), 'true,false', 'the smoke'); same(r.dis.join(), 'true,false', 'disorient'); same(r.emp.join(), 'false,true', 'the EMP strips the near shield and not the far one');
        same(r.empFx, 'maxTimer,timer', 'the EMP flash carries no zone'); ok(r.smokeFx && r.smokeFx[0] === 12 && r.smokeFx[1] === true, 'the smoke effect: ' + r.smokeFx); ok(r.bz && r.bz[0] === 12 && r.bz[1] === true && r.bz[2], 'the blizzard effect: ' + r.bz); same(r.charge, 0, 'spent');
    });
    check('the eruption goes for the biggest enemy within reach (never one out of it); two blizzards within reach of each other merge into one', () => {
        const r = J(`(function(){ const f = followers.find(x => !x.dead), o = {}; let [near, far] = __foes(f); const big = spawnCreature({ species: 'beetle', className: 'tank', x: f.x + 6, y: f.y + 1 }); far.health = far.maxHealth = 1e6; big.health = big.maxHealth = 500; near.health = 10;
            o.pick = ultBiggestFoe(f) === big; o.notFar = ultBiggestFoe(f) !== far;
            elementEffects.length = 0; spawnElementEffect({ type: 'blizzardField', x: f.x, y: f.y, radius: ULT_REACH, life: 100, maxLife: 360 }); spawnElementEffect({ type: 'blizzardField', x: f.x + 3, y: f.y, radius: ULT_REACH, life: 200, maxLife: 360 }); fxTidy(); o.merged = elementEffects.filter(e => e.type === 'blizzardField').length; o.life = elementEffects[0] && elementEffects[0].life;
            spawnElementEffect({ type: 'blizzardField', x: f.x + 30, y: f.y, radius: ULT_REACH, life: 50, maxLife: 360 }); fxTidy(); o.apart = elementEffects.filter(e => e.type === 'blizzardField').length; elementEffects.length = 0; return o; })()`);
        same(r.pick && r.notFar, true, 'the eruption\'s target'); same(r.merged, 1, 'merged'); same(r.life, 200, 'the longer life is kept'); same(r.apart, 2, 'one out of reach is its own');
    });

    group('FIRE BOMBS STOP AT THE WALLS');
    check('a bomb is blocked where there is no floor (the facility\'s walls and props) up to FIRE_WALL_Z, and flies over a floor tile; the ground burns on floor only', () => {
        const r = J(`(function(){ const t = world.find(x => x.type === 'floor'); let off = null; for (let x = -200; x < 200 && off === null; x++) if (!getTile(x, -200)) off = x;
            return { wallZ: FIRE_WALL_Z, floor: _fireBlocked(t.x, t.y, 0), wall: _fireBlocked(off, -200, 0), high: _fireBlocked(off, -200, FIRE_WALL_Z + 1), lit: igniteFireTile(t.x, t.y, 3), has: fireTiles.has(t.x + ',' + t.y), notLit: igniteFireTile(off, -200, 3), lanes: typeof FIRE_LANE_MIN }; })()`);
        same(r.wallZ, 3, 'FIRE_WALL_Z'); same(r.floor, false, 'a floor tile blocks'); same(r.wall, true, 'no floor: a wall'); same(r.high, false, 'over it'); same(r.lit && r.has, true, 'floor burns'); same(r.notLit, false, 'nothing burns where there is no floor'); same(r.lanes, 'undefined', 'the lane is gone');
        run('fireTiles.clear();');
    });
    check('a fire follower\'s special lobs two bombs at its target, and the fire forms\' move three; the bombs are the only fire that flies (no turret throws one)', () => {
        const r = J(`(function(){ const f = followers.find(x => !x.dead), c = spawnCreature({ species: 'ant', className: 'scout', x: f.x + 3, y: f.y }); fireBombs.length = 0; const n = throwFireBombsAt(f, c, 2, 0.16, 10); return { n, bombs: fireBombs.length, src: fireBombs.every(b => b.src === f), nest: fireBombs.some(b => 'nestDmg' in b) }; })()`);
        same(r.n, 2, 'two bombs'); same(r.bombs, 2, 'in flight'); same(r.src, true, 'thrown by the follower'); same(r.nest, false, 'no nest damage on a bomb');
        const src = rd('js/firebombs.js'); ok(!/fireTurretThrow|fireAimTap|FIRE_LANE_|fireOnPylonDestroyed/.test(src), 'the turrets are gone from the fire bombs');
        run('fireBombs.length = 0; actors = actors.filter(a => !a.speciesName || a.isClone);');
    });

    group('WHAT IS KEPT');
    check('the Clone Bay still prices the six species from CLONE_COSTS (no synthetic entries), and the clone index cards are drawn from it', () => {
        same(J('Object.keys(CLONE_COSTS).sort()').join(), 'ant,beetle,mantis,moth,scorpion,spider', 'the species'); ok(/function renderCloneCostIndex/.test(rd('js/clone.js')) && /cmCloneCosts/.test(rd('game.html')), 'the clone index');
        // a clone is a better version of its species: four times the health (an earlier ask), and more power (1.5 since a clone bites with it at all: docs/MUTATOR.md §2.1, a knob)
        const m = J('[CLONE_POWER_MULT, CLONE_HEALTH_MULT, MAX_CLONES > 0]'); ok(m[0] > 1, 'a clone\'s power is not over its species\': ' + m[0]); same(m[1], 4, 'a clone\'s health'); same(m[2], true, 'MAX_CLONES');
    });
    check('the Crystal heals while no alarm is up; a creature within bite range costs the player one hit and a knockback (no stun)', () => {
        const r = J(`(function(){ const o = {}; crystal.health = 100; alertActive = false; render(); o.healed = crystal.health > 100; alertActive = true; const h = crystal.health; render(); o.notInAlarm = crystal.health === h; alertActive = false;
            health = PLAYER_HITS; player.invuln = 0; const px = player.x; hurtPlayer(4, 0); o.hits = [PLAYER_HITS, health, player.invuln > 0]; o.stun = typeof playerStun; return o; })()`);
        same(r.healed, true, 'heals'); same(r.notInAlarm, true, 'not in an alarm'); same(r.hits[1], r.hits[0] - 1, 'one hit'); same(r.stun, 'undefined', 'no stun');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
