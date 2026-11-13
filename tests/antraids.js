// THE CRYSTAL'S POWER, THE TURRETS AND THE ANT RAIDS (js/crystalpower.js, js/antraids.js; js/stations.js facilitySentryTick and the repair station; js/predator.js a raider's goal and bite; js/game.js the
// revivals and the idle refill; js/facilitynet.js the network meter; js/input.js its tap).
// ASKED (the owner, 2026-11-01, playtesting): "The ants need to invade and go for the crystal and the turrets"; "the facility has permanent turrets that are already located on the map. There's about three of them.
// Now they become destructible but repairable"; "make it to where the crystal powers the turrets, and also powers the revival of you and the followers, and it's tied to the network meter at the top now. And
// crystal can be charged up 75% by a 50 shard cost, or it'll heal up over time if it's idle." The answers asked the same day: raids on a timer, every 3 minutes, 3 ants, turrets first, from the Sewers' discovery,
// just the alarm, they attack while you are away; turrets sturdy, repaired by standing 10 s, free, on the Crystal alone; the Crystal one pool (its health), the dial's ring, a tap on the meter, full in ~5
// minutes idle, costs "Light" (a shot 0.1%, a follower 3%, you 5%), a reserve of 10%, an unpaid follower waits, an unpaid you is game over.
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
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; canvas.width = 1280; canvas.height = 860; health = PLAYER_HITS;
        _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; classPickerOpen = false; playerClassKey = 'gunslinger';
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__wild = () => { actors = actors.filter(a => !(a instanceof Predator)); };
        globalThis.__crystal = (h, max) => { crystal.maxHealth = max || 300; crystal.health = h; _crystalDrawnAt = -1e9; };
        globalThis.__sentry = id => sentryItems().find(i => i.id === id);
        globalThis.__ant = (x, y, cls) => { const p = spawnCreature({ species: 'ant', className: cls || 'scout', x, y, level: 3, state: 'wander' }); p.fpCreature = true; p.homeRoom = 'arena'; p.spawnProtection = 0; return p; };`);

    group('THE CRYSTAL\'S POWER (js/crystalpower.js): one pool, its health');
    check('the numbers are the owner\'s answers: a reserve of 10%; a turret\'s shot 0.1%, a clone\'s revival 3%, yours 5% ("Light"); ◆50 for +75%; idle, whole in five minutes; a fallen follower\'s return 5% to 10% by its energy cards (build 2026-11-12o: "5 to 10 ... depending on how much energy the follower had")', () => {
        const r = J(`[CRYSTAL_POWER.reserve, CRYSTAL_POWER.cost.shot, CRYSTAL_POWER.cost.follower, CRYSTAL_POWER.cost.player, CRYSTAL_POWER.charge.price, CRYSTAL_POWER.charge.amount, CRYSTAL_POWER.refill.fullFrames / 60]`);
        same(r.join(), '0.1,0.001,0.03,0.05,50,0.75,300', 'the numbers');
        same(J('CRYSTAL_POWER.fallen.join()'), '0.05,0.1', 'a fallen follower\'s, from none to three cards');
        same(J('[[], [null], ["fire"], ["fire", null, null], ["fire", "fire", null], ["fire", "ice", "fire"], undefined].map(e => Math.round(crystalFallenCost(e === undefined ? {} : { energy: e }) * 300)).join()'), '15,15,20,20,25,30,15', 'its cost in the Crystal\'s 300: no card 15, one 20, two 25, three 30');
    });
    check('after the tutorial each use is paid from it (a shot 0.3, a follower 9, you 15 of its 300); while the tutorial runs nothing is', () => {
        const r = J(`(function(){ __crystal(300); const o = {}; let h = crystal.health; crystalDraw('shot'); o.shot = Math.round((h - crystal.health) * 1000) / 1000; h = crystal.health; crystalDraw('follower'); o.fol = Math.round(h - crystal.health); h = crystal.health; crystalDraw('player'); o.you = Math.round(h - crystal.health);
            _fp.tut.script.doneAt = 0; h = crystal.health; o.free = crystalDraw('player'); o.tut = h - crystal.health; _fp.tut.script.doneAt = 3; return o; })()`);
        same([r.shot, r.fol, r.you].join(), '0.3,9,15', 'what each costs'); same(r.free, true, 'the tutorial refused'); same(r.tut, 0, 'the tutorial paid');
    });
    check('at or below the reserve it pays for nothing: a draw is refused and takes nothing; a turret goes quiet', () => {
        const r = J(`(function(){ __crystal(30); const it = __sentry('sentry_hall'); const o = { can: crystalCanDraw(), shot: crystalDraw('shot'), h: crystal.health, on: sentryOn(it) }; __crystal(31); o.above = [crystalCanDraw(), sentryOn(it)]; __crystal(300); return o; })()`);
        same([r.can, r.shot, r.h, r.on].join(), 'false,false,30,false', 'at the reserve'); same(r.above.join(), 'true,true', 'just above it');
    });
    check('a follower whose revival cannot be paid WAITS at the Crystal (the ticker says NEEDS POWER) and comes back, paid, once there is power; its HP stat is the same', () => {
        const r = J(`(function(){ __wild(); __crystal(20); respawnQueue.length = 0; spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; const uid = f.uid, hp = f.base.hp;
            f.dead = true; f.health = 0; for (let i = 0; i < 260; i++) render(); const o = { back: followers.some(x => x.uid === uid && !x.dead), q: respawnQueue.length, wait: !!(respawnQueue[0] && respawnQueue[0].waitPower), crys: Math.round(crystal.health * 10) / 10 };
            crystal.health = 150; const h0 = crystal.health; for (let i = 0; i < 3; i++) render(); const g = followers.find(x => x.uid === uid && !x.dead); o.after = [!!g, respawnQueue.length, Math.round(h0 - crystal.health), g && g.base.hp === hp]; __crystal(300); return o; })()`);
        same([r.back, r.q, r.wait].join(), 'false,1,true', 'with the Crystal at its reserve'); ok(r.crys <= 30, 'the Crystal paid anyway, or refilled past the reserve: ' + r.crys); same(r.after.join(), 'true,0,20,true', 'with power again (back, paid 20: 5% and a third of 5% more for its one energy card, build 2026-11-12o; the same HP stat)');
    });
    check('your third hit with the Crystal at its reserve is the END of the run ("THE CRYSTAL HAS NO POWER LEFT TO BRING YOU BACK"); above it, you are knocked back and it pays 5%', () => {
        const r = J(`(function(){ __wild(); const keep = showGameOver; let why = null; showGameOver = w => { why = w; gameState.running = false; }; const o = {};
            __crystal(20); health = 0; render(); o.end = [why, gameState.running]; gameState.running = true; why = null;
            __crystal(200); health = 0; const h0 = crystal.health; render(); o.back = [why, health === PLAYER_HITS, Math.round(h0 - crystal.health)]; showGameOver = keep; health = PLAYER_HITS; __crystal(300); return o; })()`);
        same(String(r.end[0]), 'THE CRYSTAL HAS NO POWER LEFT TO BRING YOU BACK', 'why'); same(r.end[1], false, 'the run went on'); same(JSON.stringify(r.back), JSON.stringify([null, true, 15]), 'knocked back and paid');
    });
    check('IDLE it refills whole in five minutes; not while an alarm is up, not while an ant raid is on, and not in the moments after it paid for something', () => {
        const r = J(`(function(){ __wild(); __crystal(150); alertActive = false; for (let i = 0; i < CRYSTAL_POWER.refill.fullFrames / 2; i++) crystalRefillTick(); const o = { half: Math.round(crystal.health) };
            __crystal(150); alertActive = true; for (let i = 0; i < 600; i++) crystalRefillTick(); o.alarm = crystal.health; alertActive = false;
            __crystal(150); crystalDraw('shot'); const h = crystal.health; for (let i = 0; i < CRYSTAL_POWER.refill.idleAfter - 5; i++) crystalRefillTick(); o.justPaid = crystal.health === h;
            __crystal(150); const a = __ant(crystal.x + 30, crystal.y); a.raid = 1; for (let i = 0; i < 600; i++) crystalRefillTick(); o.raid = crystal.health; a.dead = true; __wild(); __crystal(300); return o; })()`);
        same(r.half, 300, 'whole in five minutes from half'); same(r.alarm, 150, 'it refilled during an alarm'); same(r.justPaid, true, 'it refilled right after paying'); same(r.raid, 150, 'it refilled during a raid');
    });
    check('THE NETWORK METER: its outer ring is the Crystal\'s charge; a tap on the panel charges it, ◆50 for +75% up to the full; full, or short of ◆50, nothing happens and nothing is paid; a tap off the panel is not its', () => {
        const r = J(`(function(){ __crystal(60); drawFacilityNetworkHUD(); const R = _fnRect, cx = R.x + R.w / 2, cy = R.y + R.h / 2, o = { charge: facilityNetState().charge };
            shardCount = 60; o.tap = facilityNetTap(cx, cy); o.paid = [shardCount, Math.round(crystal.health)]; o.poor = facilityNetTap(cx, cy); o.poorPaid = [shardCount, Math.round(crystal.health)];
            __crystal(250); shardCount = 100; facilityNetTap(cx, cy); o.capped = [shardCount, crystal.health]; facilityNetTap(cx, cy); o.full = [shardCount, crystal.health]; o.off = facilityNetTap(R.x - 20, cy); __crystal(300); shardCount = 0; return o; })()`);
        same(r.charge, 0.2, 'the meter\'s charge'); same(r.tap, true, 'the tap was not the panel\'s'); same(r.paid.join(), '10,285', 'charged (◆50, +225 of 300)'); same(r.poor, true, 'the panel let a short tap through');
        same(r.poorPaid.join(), '10,285', 'charged without the shards'); same(r.capped.join(), '50,300', 'not up to the full only'); same(r.full.join(), '50,300', 'charged when full'); same(r.off, false, 'a tap off the panel');
        ok(/THE CRYSTAL'S CHARGE/.test(rd('js/facilitynet.js')) && /facilityNetTap\(upX, upY\)/.test(rd('js/input.js')), 'the dial or the input does not say so');
    });

    group('THE TURRETS (js/antraids.js; js/stations.js facilitySentryTick)');
    check('two (since build 2026-11-09ww: one in the Crystal Chamber, one in the hallway), each whole at SENTRY.hp; they run on the Crystal ALONE: every relay off, a turret fires at a creature in range and the Crystal pays for the shot; at the reserve it holds its fire', () => {
        const r = J(`(function(){ __wild(); __crystal(300); sentriesStart(); const all = sentryItems(), it = __sentry('sentry_hall'); for (const k in _fp.relays) _fp.relays[k].online = false; facilityBlackoutSet(true);
            const a = __ant(it.x + 3, it.y); a.health = a.maxHealth = 1e6; followerProjectiles = []; it.cd = 0; const h0 = crystal.health; facilitySentryTick(); const o = { n: all.length, hp: all.every(i => i.hp === SENTRY.hp), shots: followerProjectiles.length, paid: Math.round((h0 - crystal.health) * 10) / 10 };
            __crystal(30); it.cd = 0; followerProjectiles = []; facilitySentryTick(); o.reserve = followerProjectiles.length; facilityBlackoutSet(false); __wild(); __crystal(300); followerProjectiles = []; return o; })()`);
        same(r.n, 2, 'the turrets'); same(r.hp, true, 'a turret not whole'); same(r.shots, 1, 'it did not fire with the relays off'); same(r.paid, 0.3, 'the shot\'s cost'); same(r.reserve, 0, 'it fired at the reserve');
    });
    check('a turret aims only at what its shot can hit: never at a RECRUIT WAITING AT ITS POST (the old Experiment Lab\'s was in the hallway turret\'s range, through the wall: it fired at that one forever, every shot paid from the Crystal; that post moved west with the lab in build 2026-11-13a, so a waiting recruit is put behind a wall in its range: behind the Lounge\'s divider); at a creature, yes', () => {
        const r = J(`(function(){ __wild(); __crystal(200); sentriesStart(); const h = __sentry('sentry_hall'), lab = actors.find(a => a.isNeutralRecruit && !a.dead);
            if (lab) { lab.x = lab.targetX = lab.visualX = Math.round(h.x) - 2; lab.y = lab.targetY = lab.visualY = Math.round(h.y) + 8; }   /* (in the hallway south of the Lounge's divider, through it from the turret) */
            const o = { lab: !!lab && Math.hypot(lab.x - h.x, lab.y - h.y) < SENTRY_RANGE && facilityWalkable(lab.x, lab.y, _fp.F) && !!_facWallCrossed(h.x, h.y, lab.x, lab.y, _fp.F) }; followerProjectiles = []; for (const it of sentryItems()) it.cd = 0; for (let i = 0; i < 600; i++) facilitySentryTick(); o.idle = [followerProjectiles.length, Math.round((200 - crystal.health) * 100) / 100];
            const rec = __ant(h.x + 3, h.y); rec.isNeutralRecruit = true; followerProjectiles = []; h.cd = 0; facilitySentryTick(); o.recruit = followerProjectiles.length; rec.isNeutralRecruit = false; h.cd = 0; facilitySentryTick(); o.foe = followerProjectiles.length;
            __wild(); followerProjectiles = []; __crystal(300); return o; })()`);
        same(r.lab, true, 'fixture: no recruit waits within the hallway turret\'s range'); same(r.idle.join(), '0,0', 'ten seconds with only the recruits about: the shots, and what the Crystal paid');
        same(r.recruit, 0, 'it fired at a recruit beside it'); same(r.foe, 1, 'it did not fire at a creature');
    });
    check('a raider\'s BITE wears a turret down (js/predator.js); at none it is WRECKED: it stops, it says so, and a REPAIR station stands on it', () => {
        const r = J(`(function(){ __wild(); __crystal(300); sentriesStart(); const it = __sentry('sentry_hall'), a = __ant(it.x + 1, it.y, 'tank'); a.raid = 1; const before = it.hp; a.bite(it); const o = { bit: Math.round((before - it.hp) * 10) / 10, power: Math.round(a.power * 10) / 10 };
            floatingTexts.length = 0; sentryDamage(it, it.hp); o.broken = [it.broken, it.hp, sentryOn(it), _fp.stations.some(s => s.kind === 'sentry_repair' && s.sentry === it.id), floatingTexts.some(t => /WRECKED/.test(t.text))]; __wild(); return o; })()`);
        same(r.bit, r.power, 'the bite took what the ant bites'); same(r.broken.join(), 'true,0,false,true,true', 'wrecked');
    });
    check('REPAIRING is a build of ten seconds at the turret, FREE: walking off stops it; done, the turret is whole and fires again, and its station is gone', () => {
        const r = J(`(function(){ __wild(); __crystal(300); sentriesStart(); const it = __sentry('sentry_hall'); sentryDamage(it, it.hp); const st = _fp.stations.find(s => s.kind === 'sentry_repair'); const c = _fpNearestCell(it.x + 1.2, it.y); __put(c[0], c[1]); shardCount = 7;
            const o = { frames: STATION_KINDS.sentry_repair.build, start: stationUse(st).ok, chan: !!_fp.channel }; __put(it.x + 8, it.y); facilityRelayTick(); o.off = !_fp.channel;
            __put(c[0], c[1]); stationUse(st); for (let i = 0; i < SENTRY.repair + 2; i++) { frame++; facilityRelayTick(); } o.done = [it.broken, it.hp === it.maxHp, sentryOn(it), _fp.stations.some(s => s.kind === 'sentry_repair'), shardCount]; return o; })()`);
        same(r.frames, 600, 'ten seconds'); same(r.start, true, 'the repair did not start'); same(r.chan, true, 'no build under way'); same(r.off, true, 'walking off did not stop it'); same(r.done.join(), 'false,true,true,false,7', 'repaired (and free)');
    });
    check('the save keeps their wear: a hurt one and a wrecked one (with its repair station) come back as they were; a fresh start has them whole', () => {
        const r = J(`(function(){ sentriesStart(); const h = __sentry('sentry_hall'), c1 = __sentry('sentry_chamber_1'); sentryDamage(h, 120); sentryDamage(c1, c1.hp); const sv = facilitySaveCollect(); const snap = sv.sentries;
            sentriesStart(); const fresh = sentryItems().every(i => i.hp === SENTRY.hp && !i.broken); sentryApply(JSON.parse(JSON.stringify(snap))); const o = { snap, fresh, back: [h.hp, c1.hp, c1.broken, _fp.stations.some(s => s.sentry === 'sentry_chamber_1')] }; sentriesStart(); return o; })()`);
        same(JSON.stringify(r.snap), JSON.stringify({ sentry_chamber_1: 0, sentry_hall: 380 }), 'the save'); same(r.fresh, true, 'a fresh start'); same(r.back.join(), '380,0,true,true', 'after the load');
    });

    group('THE ANT RAIDS (js/antraids.js)');
    check('no raid before the Sewers are found; the first comes three minutes after, then one every three minutes', () => {
        const r = J(`(function(){ __wild(); __crystal(300); _fp.raid = null; const Q = questState('purify'); Q.discoveredAt = 0; frame = 5000; raidTick(); const o = { before: [raidRaiders().length, _fp.raid.nextAt] };
            Q.discoveredAt = 5000; raidTick(); o.armed = _fp.raid.nextAt - frame; frame = _fp.raid.nextAt - 1; raidTick(); o.early = raidRaiders().length; frame++; raidTick(); o.first = [raidRaiders().length, _fp.raid.nextAt - frame];
            __wild(); frame = _fp.raid.nextAt; raidTick(); o.second = raidRaiders().length; __wild(); Q.discoveredAt = 0; _fp.raid = null; return o; })()`);
        same(JSON.stringify(r.before), JSON.stringify([0, null]), 'before the Sewers'); same(r.armed, 10800, 'the first raid\'s wait'); same(r.early, 0, 'it came early'); same(r.first.join(), '3,10800', 'the first raid, and the next one\'s wait'); same(r.second, 3, 'the second raid');
    });
    check('a raid is THREE ants of the arena, its own first and the rest up out of its grates; they hunt, alarmed on their own (the facility\'s alarm is not raised; the Sewers\' brood is not roused); a raid is on while one lives', () => {
        const r = J(`(function(){ __wild(); __crystal(300); _fp.raid = null; const own = facilitySpawnCreature(null, null, FP_SPAWN); const s = spawnCreature({ species: 'ant', className: 'worker', x: 10, y: 10, level: 3, state: 'wander' }); s.fpCreature = true; s.homeRoom = 'sewers';
            const got = raidStart(); const o = { n: got.length, own: got.includes(own), all: got.every(a => a.raid && a.state === 'hunt' && a.provoked && a.speciesName === 'ant' && a.homeRoom === 'arena'), alarm: alertActive, raid: raidActive(), alarmed: predatorAlarm(got[0]), brood: predatorAlarm(s) };
            for (const a of got) a.dead = true; o.over = raidActive(); __wild(); return o; })()`);
        same(r.n, 3, 'the raiders'); same(r.own, true, 'the arena\'s own ant did not go'); same(r.all, true, 'a raider is not an arena ant on the hunt'); same(r.alarm, false, 'the facility\'s alarm was raised');
        same([r.raid, r.alarmed, r.brood].join(), 'true,true,false', 'the raid\'s alarm'); same(r.over, false, 'still on with none left');
    });
    check('THE GOAL: the nearest turret still standing, then the next, then the Crystal; after a fight on the way a raider marches on', () => {
        const r = J(`(function(){ __wild(); sentriesStart(); const h = __sentry('sentry_hall'), a = __ant(h.x + 2, h.y); a.raid = 1; const o = { first: raidGoal(a) && raidGoal(a).id };
            sentryDamage(h, h.hp); o.next = raidGoal(a) && raidGoal(a).id; for (const it of sentryItems()) sentryDamage(it, it.hp); o.last = raidGoal(a) === crystal;
            a.state = 'wander'; a.provoked = false; raidTick(); o.march = [a.state, a.provoked]; sentriesStart(); __wild(); return o; })()`);
        same(r.first, 'sentry_hall', 'the nearest'); ok(/^sentry_chamber/.test(r.next), 'the next: ' + r.next); same(r.last, true, 'then the Crystal'); same(r.march.join(), 'hunt,true', 'it did not march on');
    });
    check('in the real loop, with you away in the Sewers, a raider walks to the hallway turret round the walls and bites it (nobody in its way: a follower it meets it fights first, as any creature does)', () => {
        const r = J(`(function(){ __wild(); actors = actors.filter(x => !x.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; respawnQueue.length = 0; __crystal(1e7, 1e7); sentriesStart(); const h = __sentry('sentry_hall'), c = _fpNearestCell(h.x + 4, h.y + 1), a = __ant(c[0], c[1], 'tank'); a.raid = 1; a.state = 'hunt'; a.provoked = true; a.health = a.maxHealth = 1e7;
            const p = _fp.portals.find(q => q.room === 'sewers'); __put(p.ax, p.ay); const d0 = Math.hypot(a.x - h.x, a.y - h.y); for (let i = 0; i < 900 && h.hp === h.maxHp; i++) render();
            const o = { room: partyRoomAt(player.x, player.y), d0: Math.round(d0 * 10) / 10, d: Math.round(Math.hypot(a.x - h.x, a.y - h.y) * 10) / 10, bitten: h.hp < h.maxHp }; __wild(); sentriesStart(); __crystal(300); return o; })()`);
        same(r.room, 'sewers', 'fixture: the player is not away'); same(r.bitten, true, 'the turret was not bitten (the raider got from ' + r.d0 + ' to ' + r.d + ' tiles off)');
    });

    group('THE PAGE');
    check('js/crystalpower.js and js/antraids.js are on the page with their probes, after the spawner', () => {
        const html = rd('game.html'), i = f => html.indexOf('js/' + f + '.js?v=');
        ok(i('crystalpower') > i('facilityspawn') && i('antraids') > i('crystalpower'), 'the order'); ok(/"js\/crystalpower\.js": "CRYSTAL_POWER"/.test(html) && /"js\/antraids\.js": "RAID"/.test(html), 'the probes');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
