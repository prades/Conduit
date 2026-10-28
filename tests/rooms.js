// ROOM CAPACITY, WHO MAKES ROOM, AND THE ARENA OVER ITS SIX (js/party.js; docs/TECHNICIANS.md "Rooms and recruitment").
// ASKED: "Category 1 rooms: two followers. Main Hallway Level 2: three followers. Arena Level 2: six followers. These room capacities are separate from the three active squad slots", the hallway and the arena "automatically a level 2 just
// because of the amount of space", every other room Category 1; "When recruiting a follower requires replacing an existing follower, let the player select which follower to replace", the replaced one "has option to go to a vacancy in the
// rooms but if not confirm retirement"; the arena over its six removes its weakest by "Roster order" to a "free room, else retired".
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
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860; innerWidth = 1100;');
    run(`globalThis.__cell = (room, k) => { const cs = partyRoomCells(room); return cs[Math.floor(cs.length * (k === undefined ? 0.5 : k))]; };
        globalThis.__keepVac = partyVacancy;
        globalThis.__fresh = (n) => { partyVacancy = __keepVac; if (partyPickBusy()) partyPickChoose('cancel'); actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; respawnQueue.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); floatingTexts.length = 0;
            const c = __cell('crystal_chamber'); player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1];
            for (let i = 0; i < n; i++) { spawnFollowerAtCrystal(['electric', 'core', 'fire', 'ice', 'toxic', 'flux'][i % 6]); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.x = c[0] + 0.3 * (i % 4); f.y = c[1] + 0.3 * Math.floor(i / 4); }
            partyTick(); return followers.slice(); };
        globalThis.__sweep = () => { actors = actors.filter(a => !a.dead); followers = followers.filter(a => !a.dead && a.team === 'green'); };`);

    group('THE CAPS');
    check('every room holds two, the Main Hallway three, the Arena six; the squad is not counted, and one on its way back from the dead keeps its place', () => {
        const r = J(`(function(){ const o = {}; o.caps = _fp.F.rooms.map(r => r.id + ':' + partyRoomCap(r.id)); const fs = __fresh(3);
            o.squadCounted = partyRoomCount('crystal_chamber'); respawnQueue.push({ post: 'crystal_chamber', isClone: false }); o.dead = partyRoomCount('crystal_chamber'); respawnQueue.length = 0; return o; })()`);
        for (const c of r.caps) { const [id, n] = c.split(':'); same(+n, id === 'lab_hallway' ? 3 : id === 'arena' ? 6 : 2, id); }
        same(r.squadCounted, 0, 'the squad counted in its room'); same(r.dead, 1, 'one coming back from the dead');
    });
    check('HOLD in a full room: it keeps following and the player is told; REMOVE goes to the nearest room with a place; a fourth follower with the squad full holds the nearest room with a place', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; ccApplyStance(fs, 'hold'); o.held = fs.filter(f => f.post).map(f => f.post).join(); o.kept = fs.filter(f => !f.post).length; o.said = floatingTexts.map(t => t.text).join('|');
            ccApplyStance(fs, 'follow'); const g = __fresh(5); o.fourth = g.filter(f => f.post).map(f => f.post); const m = partyOrdered()[0]; partyRemove([m]); o.removedTo = m.post; o.inChamber = partyRoomCount('crystal_chamber'); return o; })()`);
        same(r.held, 'crystal_chamber,crystal_chamber', 'two hold the Crystal Chamber'); same(r.kept, 1, 'the third'); ok(/THE CRYSTAL CHAMBER IS FULL · 2 OF 2/.test(r.said), 'said ' + r.said);
        same(r.fourth.join(), 'crystal_chamber,crystal_chamber', 'the 4th and 5th'); ok(r.removedTo && r.removedTo !== 'crystal_chamber', 'the removed one: ' + r.removedTo); same(r.inChamber, 2, 'the Crystal Chamber after');
    });

    group('WHO MAKES ROOM (a recruit or an egg with the squad full)');
    check('+ RECRUIT with the squad full asks first and pays nothing until a choice: a member makes room (it holds the nearest room with a place, the recruit takes its card); NOBODY (the recruit holds a room); CANCEL (nothing happens); one question at a time', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; shardCount = 500; const s0 = shardCount;
            o.asked = recruitDo(); o.busy = partyPickBusy(); o.paid = s0 - shardCount; o.again = recruitDo(); o.n = followers.length;
            const m = partyOrdered()[1], slot = m.partySlot; partyPickChoose(m); __sweep();
            o.member = [m.post, partyIsMember(m)]; const newest = followers[followers.length - 1]; o.recruit = [partyIsMember(newest), newest.partySlot === slot, s0 - shardCount, followers.length];
            recruitDo(); partyPickChoose('nobody'); const n2 = followers[followers.length - 1]; o.nobody = [!!n2.post, partyMembers().length, followers.length];
            const before = shardCount; recruitDo(); partyPickChoose('cancel'); o.cancel = [before - shardCount, followers.length, partyPickBusy()]; return o; })()`);
        same(r.asked, true, 'asked'); same(r.busy, true, 'the question is up'); same(r.paid, 0, 'paid before the choice'); same(r.again, false, 'a second question at once'); same(r.n, 3, 'a recruit made before the choice');
        ok(r.member[0] && !r.member[1], 'the member that made room: ' + JSON.stringify(r.member)); same(r.recruit.join(), 'true,true,30,4', 'the recruit takes its card, paid once');
        same(r.nobody.join(), 'true,3,5', 'NOBODY: the recruit holds a room'); same(r.cancel.join(), '0,5,false', 'CANCEL');
    });
    check('a member that makes room when no room has a place: retiring it is asked first; BACK goes back; RETIRE takes it off the roster for good (no body, not coming back, not saved) and the recruit takes its card', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; shardCount = 500; partyVacancy = () => null; recruitDo(); const m = partyOrdered()[0], slot = m.partySlot; partyPickChoose(m);
            o.confirm = document.getElementById('partyPick') && 1; o.stage = (_ppAsk || {}).stage; partyPickChoose('back'); o.back = _ppAsk.stage; partyPickChoose(m); partyPickChoose('retire');
            o.retired = [m.retired === true, m.sacrificed === true, m.dead === true]; __sweep(); o.gone = !followers.includes(m) && !followerRosterSnapshot().some(e => e.uid === m.uid);
            const newest = followers[followers.length - 1]; o.recruit = [partyIsMember(newest), newest.partySlot === slot]; partyVacancy = __keepVac; return o; })()`);
        same(r.stage, 'retire', 'retiring was not asked'); same(r.back, 'pick', 'BACK'); same(r.retired.join(), 'true,true,true', 'retired'); same(r.gone, true, 'still on the roster'); same(r.recruit.join(), 'true,true', 'the recruit');
    });
    check('an egg with the squad full: walking up to it asks; it is taken once a choice is made, and asked again only after walking away and back', () => {
        const r = J(`(function(){ const fs = __fresh(3), o = {}; const s = _fp.spots.find(x => x.id === 'spot_lobby'); if (!s.egg) { s.readyAt = 0; player.x = s.x + 10; player.y = s.y; facilityFollowerSpotsTick(); }
            player.x = s.x; player.y = s.y; facilityFollowerSpotsTick(); o.asked = partyPickBusy(); o.egg = !!s.egg; partyPickChoose('cancel'); facilityFollowerSpotsTick(); o.again = partyPickBusy();
            player.x = s.x + 4; facilityFollowerSpotsTick(); player.x = s.x; facilityFollowerSpotsTick(); o.reasked = partyPickBusy(); partyPickChoose(partyOrdered()[2]); o.taken = !s.egg; o.members = partyMembers().length; return o; })()`);
        same(r.asked, true, 'not asked'); same(r.egg, true, 'taken before the choice'); same(r.again, false, 'asked again without walking away'); same(r.reasked, true, 'not asked again after walking away'); same(r.taken, true, 'not taken after the choice'); same(r.members, 3, 'the squad');
    });

    group('THE ARENA OVER ITS SIX');
    check('a seventh in the arena: the weakest by the roster\'s order (not evolved before evolved, then the lowest level, then the lowest power) goes to the nearest room with a place; with none it retires; it says so', () => {
        const r = J(`(function(){ const fs = __fresh(7), o = {}; const a = __cell('arena'); fs.forEach((f, i) => { f.x = a[0] + 0.3 * i; f.y = a[1]; f.level = 9; f.evolved = 'quillstone'; f.power = 20; }); fs[3].level = 6; fs[5].level = 6; fs[5].power = 5;
            for (let i = 0; i < 6; i++) partyPost(fs[i], 'arena', true); o.six = partyRoomCount('arena'); floatingTexts.length = 0; partyPlace(fs[6], 'arena', true);
            o.moved = fs[5].post; o.arena = partyRoomCount('arena'); o.said = floatingTexts.map(t => t.text).join('|');
            fs[6].evolved = undefined; partyVacancy = () => null; partyPost(fs[5], 'arena', true); partyArenaOverflow(); o.retired = [fs[6].retired === true, partyRoomCount('arena')]; partyVacancy = __keepVac; return o; })()`);
        same(r.six, 6, 'six'); ok(r.moved && r.moved !== 'arena', 'the weakest (level 6, power 5) did not move: ' + r.moved); same(r.arena, 6, 'the arena after'); ok(/THE ARENA IS FULL · .* MOVES TO THE /.test(r.said), 'said ' + r.said);
        same(r.retired.join(), 'true,6', 'with no room: the weakest (not evolved) retires');
    });
    check('the catwalks hold two too: the launcher will not send a third up', () => {
        const r = J(`(function(){ const fs = __fresh(4), o = {}, s = _fp.F.launchSites[0]; techLaunchersApply([s.id]); partyPost(fs[0], 'catwalks', true); partyPost(fs[1], 'catwalks', true); o.why = techSiteLaunch(s, fs[2]).why; techLaunchersApply([]); return o; })()`);
        same(r.why, 'THE ARENA CATWALK IS FULL · 2 OF 2', 'a third up');
    });
    check('the code: every way of posting asks partyPlace (HOLD, REMOVE, DISBAND, the squad over-full, an egg); + RECRUIT and an egg ask who makes room; the picker is in the page', () => {
        const P = rd('js/party.js'), C = rd('js/clone.js'), S = rd('js/followerspots.js'), H = rd('game.html');
        ok(/partyPlace\(a, room, true\)/.test(P) && /partyPlace\(f, partyRoomOf\(f\), true\)/.test(P) && /const at = partyPlace\(f, room, true\);/.test(P), 'party.js');
        ok(/partyPickOpen\("A RECRUIT"/.test(C), 'the recruit'); ok(/partyPickOpen\(roleLabel\(s\.type\)/.test(S) && /partyPlace\(f, s\.room, true\)/.test(S), 'the egg'); ok(/<div id="partyPick"/.test(H) && /body\.party-pick #partyPick/.test(H), 'the page');
    });
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
