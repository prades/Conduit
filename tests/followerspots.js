// FOLLOWER SPOTS (js/followerspots.js), and the two small changes that came with them: every element is online from the first frame of the facility, and a follower has a little extra health.
// ASKED: "give the followers a little bit extra health. Make the crystal have access to all the colors from the beginning, and we're going to put a few spots where the followers exist and will respawn there,
// and they'll have a fixed type and a fixed element." ("Respawn": the spot refills after a delay.)
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
    run('gameState.running = true;');

    group('THE DATA: a few spots, each a fixed type and a fixed element');
    check('eight spots (the eighth the ice technician in the Cold Storage), every element on at least one and every type on at least two, each in a room with floor under it, two of them in the arena, none within three tiles of another; the map passes every rule', () => {
        const r = J(`(function(){ const F = facilityBuild({ snap: true, margin: 0.3 }), v = facilityValidate(F); return { errors: v.errors, spots: F.followerSpots.map(p => [p.id, p.room, p.type, p.element, !!facilityRoomAt(p.at[0], p.at[1], F) && facilityRoomAt(p.at[0], p.at[1], F).id === p.room, facilityWalkable(p.at[0], p.at[1], F)]) }; })()`);
        same(r.errors.length, 0, r.errors.join(' | ')); same(r.spots.length, 8, 'spots'); ok(r.spots.some(s => s[0] === 'spot_cold' && s[1] === 'cold_storage' && s[2] === 'camper' && s[3] === 'ice'), 'no ice technician in the Cold Storage'); same([...new Set(r.spots.map(s => s[3]))].sort().join(), 'core,electric,fire,flux,ice,toxic', 'every element');
        for (const t of ['brawler', 'sniper', 'camper']) ok(r.spots.filter(s => s[2] === t).length >= 2, 'spots of type ' + t);
        for (const s of r.spots) ok(s[4] && s[5], s[0] + ' is not on floor of ' + s[1]);
        same(r.spots.filter(s => s[1] === 'arena').length, 2, 'two in the arena'); same(new Set(r.spots.map(s => s[1])).size, 7, 'spread over seven rooms');
    });
    check('the validator refuses a spot with a type or element that does not exist, in no room, or beside another (and lets one stand in the arena)', () => {
        const r = J(`(function(){ const F = facilityBuild({ snap: true, margin: 0.3 }), a = F.followerSpots[0], keep = F.followerSpots.slice(), out = [];
            const errs = (spots) => { F.followerSpots = spots; return facilityValidate(F).errors.join(' | '); };
            out.push(errs([Object.assign({}, a, { type: 'tank' })])); out.push(errs([Object.assign({}, a, { element: 'mud' })])); out.push(errs([Object.assign({}, a, { room: 'nowhere' })])); out.push(errs([keep.find(q => q.room === 'arena')]));
            out.push(errs([a, Object.assign({}, a, { id: 'dup' })])); out.push(errs(keep)); return out; })()`);
        ok(/not a follower type/.test(r[0]), 'a type that is not one'); ok(/not an element/.test(r[1]), 'an element that is not one'); ok(/does not exist/.test(r[2]), 'a room that is not one'); same(r[3], '', 'the arena is allowed'); ok(/within three tiles/.test(r[4]), 'two on one tile'); same(r[5], '', 'the real ones pass');
    });

    group('THE CRYSTAL: every element online from the start, and followers a little sturdier');
    run('facilityPlayStart(); facilityBlackoutSet(false);');   // (the page boots the facility: the start returns early; only the tutorial's blackout is lifted)
    check('entering the facility brings every element online (the Crystal can make a follower of any of the six, and the roster\'s element row has all of them)', () => {
        same(J('[...unlockedElements].sort()').join(), 'core,electric,fire,flux,ice,toxic', 'online'); same(J('recruitElementPool().slice().sort()').join(), 'core,electric,fire,flux,ice,toxic', 'the pool a recruit is drawn from');
        const seen = J(`(function(){ const s = new Set(); for (let i = 0; i < 400; i++) s.add(recruitElementPool()[Math.floor(Math.random() * recruitElementPool().length)]); return [...s].sort(); })()`); same(seen.length, 6, 'a draw reaches all six');
    });
    check('a follower has FOLLOWER_HP_MULT times the max health its level and personality give it (the hp stat itself is not changed), through level-ups and evolution, and its attack is as it was', () => {
        const r = J(`(function(){ const o = { mult: FOLLOWER_HP_MULT }; followers.length = 0; spawnFollowerAtCrystal('fire', 'brawler'); const f = followers[0], base = levelledStats(f.base, f.level);
            o.hp = f.maxHealth; o.want = Math.round(base.hp * FOLLOWER_HP_MULT); o.health = f.health; o.attack = f.power; o.baseAttack = base.attack;
            f.level = 6; _applyFollowerLevel(f, true); const b6 = levelledStats(f.base, 6); o.hp6 = f.maxHealth; o.want6 = Math.round(b6.hp * FOLLOWER_HP_MULT);
            f.evolved = 'quillstone'; _applyFollowerLevel(f, true); o.hpEvo = f.maxHealth; o.wantEvo = Math.round(Math.round(b6.hp * EVOLVE_MULT) * FOLLOWER_HP_MULT); o.stat = f.stats.hp; o.statWant = Math.round(b6.hp * EVOLVE_MULT); return o; })()`);
        same(r.mult, 1.25, 'a little extra: a quarter'); same(r.hp, r.want, 'level one'); same(r.health, r.hp, 'full health'); same(r.attack, r.baseAttack, 'attack untouched'); same(r.hp6, r.want6, 'after a level-up'); same(r.hpEvo, r.wantEvo, 'evolved: the evolution comes on top'); same(r.stat, r.statWant, 'the hp STAT is not touched by the bonus');
        run('followers.length = 0; actors = actors.filter(a => !a.isFollower);');
    });

    group('THE SPOTS IN PLAY: eggs, take, refill');
    check('the spots start full: an egg of each type and element on each, neutral, still, nobody\'s target, with its pad as an item of the floor', () => {
        run('frame = 10; facilityFollowerSpotsTick();');
        const r = J(`(function(){ return { spots: _fp.spots.map(s => [s.id, !!s.egg, s.egg && s.egg.element === s.element, s.egg && s.egg.role === s.type, s.egg && s.egg.isNeutralRecruit, s.egg && s.egg.team, s.egg && s.egg.x === s.x && s.egg.y === s.y, s.egg && actors.includes(s.egg)]), items: _fp.items.filter(i => i.fp === 'spot').length, hostile: actors.filter(a => isHostileTarget(a) && a.fpSpot).length }; })()`);
        same(r.items, 8, 'pads'); same(r.hostile, 0, 'an egg is nobody\'s enemy'); for (const s of r.spots) { ok(s[1] && s[2] && s[3] && s[4] && s[7], s[0] + ' is not a full spot: ' + s); same(s[5], 'red', 'neutral'); same(s[6], true, 'on its spot'); }
    });
    check('eggs stay where they are and are not walked home: the player beside one (outside the spot\'s reach) converts nothing and takes it only by the spot\'s rule', () => {
        const r = J(`(function(){ const s = _fp.spots[1], e = s.egg, n = followers.length; player.x = s.x + 1.8; player.y = s.y; for (let i = 0; i < 30; i++) { frame++; facilityFollowerSpotsTick(); const nn = followers.length; if (nn !== n) return { early: true }; }
            return { moved: e.x !== s.x || e.y !== s.y, team: e.team, home: !!e.returningToCrystal, followers: followers.length - n, still: s.egg === e }; })()`);
        same(r.early, undefined, 'taken from outside its reach'); same(r.moved, false, 'it moved'); same(r.team, 'red', 'its team'); same(r.home, false, 'walking home'); same(r.followers, 0, 'followers'); same(r.still, true, 'still there');
    });
    check('walking up to an egg makes a follower THERE, of exactly the spot\'s type and element, at full health, with the squad one bigger, and the spot empty with its delay running', () => {
        const r = J(`(function(){ const s = _fp.spots[2], n = followers.length, e = s.egg; player.x = s.x + 0.6; player.y = s.y; frame += 1; facilityFollowerSpotsTick(); const f = followers[followers.length - 1];
            return { n: followers.length - n, role: f.role, element: f.element, at: [f.x, f.y, s.x, s.y], home: f.returningToCrystal, team: f.team, isF: f.isFollower, health: f.health === f.maxHealth, level: f.level, gone: !actors.includes(e), empty: s.egg === null, wait: s.readyAt - frame, type: s.type, el: s.element, from: f.fromSpot }; })()`);
        same(r.n, 1, 'one follower'); same(r.role, r.type, 'its type'); same(r.element, r.el, 'its element'); same(r.at[0], r.at[2], 'x'); same(r.at[1], r.at[3], 'y'); same(r.home, false, 'walks home first'); same(r.team, 'green', 'team'); same(r.isF, true, 'a follower'); same(r.health, true, 'full health'); same(r.gone, true, 'the egg is gone'); same(r.empty, true, 'the spot is empty');
        ok(r.wait > 5000 && r.wait <= 5400, 'the delay is ' + r.wait); same(r.from, 'spot_deck', 'it remembers where it is from');
    });
    check('a taken spot fills again after its delay, with the same type and element: not before, not while the player stands by it, not with the squad full', () => {
        const r = J(`(function(){ const s = _fp.spots[2], o = {}; const step = () => { frame++; facilityFollowerSpotsTick(); };
            player.x = s.x + 20; player.y = s.y; frame = s.readyAt - 5; step(); o.early = !!s.egg;
            frame = s.readyAt; player.x = s.x + 1; player.y = s.y; step(); o.near = !!s.egg;
            player.x = s.x + 20; const keep = followers.slice(); for (let i = followers.length; i < FP_SPOT.cap; i++) followers.push({ dead: false }); step(); o.full = !!s.egg; followers.length = 0; for (const f of keep) followers.push(f);
            step(); o.after = !!s.egg; o.same = s.egg && s.egg.element === s.element && s.egg.role === s.type; o.taken = s.taken; return o; })()`);
        same(r.early, false, 'before the delay'); same(r.near, false, 'with the player beside it'); same(r.full, false, 'with the squad full'); same(r.after, true, 'once the delay is up'); same(r.same, true, 'the same type and element'); same(r.taken, 1, 'taken once');
    });
    check('an egg that goes some other way (destroyed) is replaced after the delay too', () => {
        const r = J(`(function(){ const s = _fp.spots[0], e = s.egg; e.dead = true; frame++; facilityFollowerSpotsTick(); const o = { empty: s.egg === null, wait: s.readyAt - frame }; player.x = s.x + 30; frame = s.readyAt; facilityFollowerSpotsTick(); o.back = !!s.egg && s.egg !== e; return o; })()`);
        same(r.empty, true, 'the spot lets it go'); ok(r.wait > 5000, 'a delay of ' + r.wait); same(r.back, true, 'refilled');
    });

    group('SAVED: a reload does not fill every spot again');
    check('the delay still to run is saved and put back, and a spot with an egg is saved as nothing to wait for', () => {
        const r = J(`(function(){ frame = 20000; const s = _fp.spots[3]; if (s.egg) { actors.splice(actors.indexOf(s.egg), 1); s.egg = null; } s.readyAt = frame + 1234; const snap = followerSpotsSnapshot(), saved = facilitySaveCollect();
            const o = { snap: snap[s.id], full: Object.keys(snap).length, collected: saved.spots[s.id] };
            s.readyAt = 0; followerSpotsApply({ [s.id]: 777, nonsense: 5 }); o.applied = s.readyAt - frame; o.egg = !!s.egg; followerSpotsApply({ [s.id]: 1e9 }); o.capped = s.readyAt - frame; followerSpotsApply(null); return o; })()`);
        same(r.snap, 1234, 'the delay'); same(r.collected, 1234, 'in the save'); ok(r.full >= 1 && r.full <= 7, 'only empty spots are saved: ' + r.full); same(r.applied, 777, 'put back'); same(r.egg, false, 'no egg meanwhile'); same(r.capped, 5400, 'never longer than a refill');
        ok(/followerSpotsApply\(d\.spots\)/.test(rd('js/facilitysave.js')), 'a loaded game applies it');
    });

    group('THE PAGE: the pad, the label and the tutorial\'s words');
    check('the pad is drawn as a floor item lit by itself, the egg wears no bar, and no egg is a hostile glow in a blackout', () => {
        ok(/else if \(it\.fp === "spot"\) _fpDrawSpot\(it\)/.test(rd('js/facilityplay.js')), 'the draw dispatch'); ok(/it\.fp === "spot"\) return 0\.8/.test(rd('js/facilitystyle.js')), 'lit by itself');
        ok(/const _bare = actor\.fpSpot \|\|/.test(rd('js/draw.js')), 'no bar'); ok(/a\.isNeutralRecruit \|\| typeof ctx === "undefined"/.test(rd('js/facilitytutorial.js')), 'no hostile glow');
        const order = require('./domstub.js').scriptOrder(); ok(order.indexOf('js/followerspots.js') > 0, 'the script is on the page');
        ok(/WALK UP TO A FOLLOWER'S EGG/.test(rd('js/tutorial.js')) && /EVERY ELEMENT IS ONLINE FROM THE START/.test(rd('js/tutorial.js')), 'the recruit step says so');
    });

    console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
