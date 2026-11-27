// THE RECRUITMENT POSTS ARE GONE (the owner, 2026-11-24: "The respawn pads, remove them", then "Remove posts entirely"; docs/FOLLOWER-PROGRESSION.md §1), and the two small changes that came with
// them, which stay: every element is online from the first frame of the facility, and a follower has a little extra health.
// The posts were eight pads (FACILITY_MAP.followerSpots, js/followerspots.js), each with a follower of a fixed type and element waiting in its egg, free, once. Recruiting is the roster's + RECRUIT
// (js/clone.js RECRUIT_COST) alone. A game saved with posts in it (its `spots`, the posts claimed) loads: the list is read past, and a follower recruited from a post is an ordinary follower.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
async function checkA(name, fn) { try { await fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

// A game saved at build 2026-11-17dl (the last with the posts), made by that build's own code: the squad of three, spot_show claimed (its MAGE · ICE recruit holding the Warehouse), the squad-full question
// open for spot_deck's egg (a pending recruit from a post: not part of a save), seven eggs out on their pads (not part of a save either), 123 shards. Its `spots` is { spot_show: 1 }.
const OLD_SAVE = "{\"v\":1,\"cls\":null,\"perks\":[],\"inv\":{},\"seen\":[],\"ammo\":12,\"shots\":0,\"classes\":{\"seen\":[],\"weapon\":{},\"clone\":null},\"taken\":[],\"relays\":[],\"script\":{\"step\":0,\"sid\":\"supplies\",\"jseen\":0,\"baseFollowers\":3,\"done\":0,\"said\":{},\"kills\":0,\"cv\":2,\"cstages\":{}},\"followers\":[{\"element\":\"electric\",\"personality\":\"stoic\",\"combatTrait\":null,\"naturalTrait\":null,\"perk\":null,\"stats\":{\"hp\":28,\"defense\":15,\"attack\":11,\"speed\":8,\"specialAttack\":9,\"accuracy\":11,\"will\":28,\"resonance\":0},\"role\":\"camper\",\"uid\":1,\"partnerUid\":null,\"base\":{\"hp\":25,\"defense\":13,\"attack\":10,\"speed\":8,\"specialAttack\":8,\"accuracy\":10,\"will\":25,\"resonance\":0},\"level\":7,\"xp\":343,\"energy\":[\"electric\"]},{\"element\":\"core\",\"personality\":\"stoic\",\"combatTrait\":null,\"naturalTrait\":null,\"perk\":null,\"stats\":{\"hp\":28,\"defense\":15,\"attack\":11,\"speed\":8,\"specialAttack\":9,\"accuracy\":11,\"will\":28,\"resonance\":0},\"role\":\"camper\",\"uid\":2,\"partnerUid\":null,\"base\":{\"hp\":25,\"defense\":13,\"attack\":10,\"speed\":8,\"specialAttack\":8,\"accuracy\":10,\"will\":25,\"resonance\":0},\"level\":7,\"xp\":343,\"energy\":[\"core\"]},{\"element\":\"fire\",\"personality\":\"cautious\",\"combatTrait\":null,\"naturalTrait\":null,\"perk\":null,\"stats\":{\"hp\":28,\"defense\":15,\"attack\":9,\"speed\":8,\"specialAttack\":9,\"accuracy\":14,\"will\":27,\"resonance\":0},\"role\":\"sniper\",\"uid\":3,\"partnerUid\":null,\"base\":{\"hp\":25,\"defense\":13,\"attack\":8,\"speed\":8,\"specialAttack\":8,\"accuracy\":12,\"will\":24,\"resonance\":0},\"level\":7,\"xp\":343,\"energy\":[\"fire\"]},{\"element\":\"ice\",\"personality\":\"cautious\",\"combatTrait\":null,\"naturalTrait\":null,\"perk\":null,\"stats\":{\"hp\":25,\"defense\":13,\"attack\":8,\"speed\":8,\"specialAttack\":8,\"accuracy\":12,\"will\":24,\"resonance\":0},\"role\":\"sniper\",\"uid\":4,\"partnerUid\":null,\"base\":{\"hp\":25,\"defense\":13,\"attack\":8,\"speed\":8,\"specialAttack\":8,\"accuracy\":12,\"will\":24,\"resonance\":0},\"level\":5,\"xp\":125,\"post\":\"show_room\",\"energy\":[\"ice\"]}],\"cards\":{\"hand\":[],\"found\":[],\"player\":[null,null],\"credits\":0,\"shelf\":{\"ids\":[\"venom_gland\",\"ember_plating\",\"charged_wiring\",\"frost_lining\",\"furnace_heart\",\"flux_cell\"],\"left\":17987}},\"energy\":{},\"dna\":{},\"clones\":[],\"bodies\":[],\"capsules\":[],\"serum\":{\"stock\":0,\"frac\":0,\"left\":3588},\"mxp\":0,\"spots\":{\"spot_show\":1},\"launchers\":[],\"pipes\":[],\"bridges\":[],\"climbs\":[],\"reefTip\":0,\"rubble\":{},\"nestWays\":[],\"chests\":[],\"blight\":{\"clock\":1,\"pools\":[]},\"quests\":{\"purify\":{\"discoveredAt\":0,\"puzzleAt\":0,\"puzzleHow\":\"\",\"samplesAt\":0,\"turnedInAt\":0,\"moduleAt\":0,\"gateAt\":0,\"installedAt\":0,\"purifiedAt\":0,\"bossStartedAt\":0,\"bossResolvedAt\":0,\"bossOutcome\":\"\",\"bossDefeated\":0,\"cycleLeft\":0,\"closeLeft\":0,\"drops\":0,\"antKills\":0,\"nestSeenAt\":0,\"trioAt\":0,\"trioKills\":0,\"trioDeadAt\":0,\"queenOutAt\":0}},\"bosses\":{\"sewer_cistern\":{\"state\":\"idle\",\"outcome\":null,\"started\":0,\"defeated\":0}},\"puzzles\":{\"sewer_sample\":{\"solvedAt\":0,\"how\":\"\"}},\"potion\":{\"eq\":null,\"bought\":0,\"copies\":0,\"thrown\":0,\"boss\":0,\"disc\":0},\"sidequest\":{\"at\":0,\"talk\":0,\"promised\":0,\"pAt\":0,\"called\":0,\"met\":0,\"w\":\"\",\"lt\":0,\"gift\":0,\"lcall\":0},\"weapon\":{\"w\":null,\"lv\":{\"machinegun\":1}},\"shards\":123,\"kills\":0,\"crystal\":300,\"at\":[13,16],\"sentries\":{},\"moved\":[]}";

async function boot(store) {
    const errors = []; const sb = makeBrowserSandbox(store || {}); sb.console = Object.assign({}, console, { error: (...a) => errors.push(a.map(String).join(' ')) });
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) { errors.push(rel + ': ' + e.message); } }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    return { run, J, errors };
}

(async () => {
    const { run, J, errors } = await boot({});
    run('gameState.running = true; facilityBlackoutSet(false);');   // (the page boots the facility; only the tutorial's blackout is lifted)

    group('NO POSTS: not in the map, the code or the page');
    check('the map has no follower spots, the built facility has none and passes every rule; the posts\' code is gone (js/followerspots.js, its table, its start, tick, claim and save) and so is its script tag', () => {
        same(run('FACILITY_MAP.followerSpots === undefined'), true, 'FACILITY_MAP.followerSpots');
        const r = J(`(function(){ const F = facilityBuild({ snap: true, margin: 0.3 }), v = facilityValidate(F); return { errors: v.errors, spots: F.followerSpots === undefined }; })()`); same(r.errors.length, 0, r.errors.join(' | ')); same(r.spots, true, 'the built facility\'s followerSpots');
        same(['FP_SPOT', 'facilityFollowerSpotsStart', 'facilityFollowerSpotsTick', 'facilityFollowerSpotTake', 'facilityFollowerSpotCan', 'followerSpotsSnapshot', 'followerSpotsApply', '_fpDrawSpot', '_fpSpotEgg', '_fpSpotLabel'].filter(k => run('typeof ' + k) !== 'undefined').join(), '', 'still defined');
        ok(!fs.existsSync(path.join(ROOT, 'js', 'followerspots.js')), 'js/followerspots.js is still there'); ok(!scriptOrder().some(s => /followerspots/.test(s)), 'its script tag is still on the page');
        for (const f of ['js/facilityplay.js', 'js/facilitystyle.js', 'js/facilitytutorial.js', 'js/facilitysave.js', 'js/fluxmove.js', 'js/facilitygrow.js', 'js/draw.js']) ok(!/followerSpot|FollowerSpot|_fpDrawSpot|fpSpot|it\.fp === "spot"/.test(rd(f)), f + ' still names the posts');
    });
    check('in play: no pad among the floor\'s items, no egg waiting anywhere, and the facility\'s tick runs; the tutorial\'s RECRUIT step names only the roster\'s + RECRUIT (its first free), with no egg and no pad', () => {
        const r = J(`(function(){ for (let i = 0; i < 30; i++) { frame++; facilityTutorialTick(); } return { pads: _fp.items.filter(i => i.fp === 'spot').length, spots: _fp.spots === undefined, eggs: actors.filter(a => a && (a.fpSpot || (a.isNeutralRecruit && !a.dead))).length,
            text: TUT_STEPS.find(s => s.id === 'recruit').text(), hint: TUT_STEPS.find(s => s.id === 'recruit').hint(), cost: RECRUIT_COST }; })()`);
        same(r.pads, 0, 'pads'); same(r.spots, true, '_fp.spots'); same(r.eggs, 0, 'eggs waiting');
        same(r.text, 'OPEN THE ROSTER (BOTTOM BAR) AND PRESS + RECRUIT: YOUR FIRST IS FREE.', 'the step (a new game: its first recruit is free)'); ok(!/EGG|PAD/.test(r.text + ' ' + r.hint), 'the step or its hint still speaks of eggs or pads: ' + r.text + ' / ' + r.hint); ok(/EVERY ELEMENT IS ONLINE FROM THE START/.test(r.hint), 'the hint');
        ok(!/EGGS ON THE PADS/.test(rd('js/infodex.js')) && !/recruitment post/.test(rd('js/infodex.js')), 'the INFO index still has the posts');
    });
    group('THE TUTORIAL\'S FIRST RECRUIT IS FREE (the owner, 2026-11-24: "First recruit free")');
    // (Measured when the posts went: a new game reaches the RECRUIT step with STARTING_SHARDS, 100, nothing before it paying any, and + RECRUIT cost 200, so the step was out of reach without kills.)
    const toRecruit = `facilityResetState(); facilityTutorialStart(_fp.F); globalThis.__S = _fp.tut.script; globalThis.__tick = () => { facilityDirectorTick(); return __S.step; };
        for (const it of _fp.items.filter(i => i.fp === 'pickup')) it.taken = true; __tick(); __S.jseen = 1; __tick(); invAdd('power_module', 1); __tick(); facilityJunctionRepair(true); invRemove('power_module', 1); __tick();`;
    check('a new player at the RECRUIT step with STARTING_SHARDS (100) recruits for free with + RECRUIT and keeps the 100, which finishes the step; the second costs RECRUIT_COST (200): short of it nothing is made, with it in hand it is paid', () => {
        const r = J(`(function(){ ${toRecruit} const o = {}; o.step = TUT_STEPS[__S.step].id; o.shards = shardCount; o.start = STARTING_SHARDS; o.price = recruitPrice(); o.text = TUT_STEPS[__S.step].text();
            const n = followers.length; o.made = recruitDo(); o.n = followers.length - n; o.after = shardCount; o.step2 = (__tick(), TUT_STEPS[__S.step].id); o.price2 = recruitPrice();
            const n2 = followers.length; o.second = recruitFollower(); o.n2 = followers.length - n2; o.after2 = shardCount; shardCount = RECRUIT_COST; o.third = recruitFollower(); o.left = shardCount; invReset(); return o; })()`);
        console.log('       (measured: ' + r.shards + ' shards at the RECRUIT step; the first + RECRUIT costs ' + r.price + ', then ' + r.price2 + ')');
        same(r.step, 'recruit', 'the step reached'); same(r.shards, r.start, 'the shards at the RECRUIT step'); same(r.price, 0, 'the first recruit\'s price'); same(r.text, 'OPEN THE ROSTER (BOTTOM BAR) AND PRESS + RECRUIT: YOUR FIRST IS FREE.', 'the step\'s words');
        same(r.made, true, 'the free recruit'); same(r.n, 1, 'a follower made'); same(r.after, 100, 'the shards kept'); same(r.step2, 'position', 'RECRUIT finished by it');
        same(r.price2, 200, 'the next recruit\'s price'); same(r.second, false, 'a second recruit with 100'); same(r.n2, 0, 'a follower made short of the price'); same(r.after2, 100, 'shards taken'); same(r.third, true, 'a recruit with 200 in hand'); same(r.left, 0, 'the price taken');
    });
    check('a free recruit with the squad full asks first who makes room, as + RECRUIT does: nothing is made until it is chosen, CANCEL makes nothing and keeps the free one; then it is made free', () => {
        const r = J(`(function(){ ${toRecruit} const o = {}; while (partyMembers().length < PARTY.max) spawnFollowerAtCrystal('fire'); __S.baseFollowers = followers.length; shardCount = 0; const n = followers.length;
            o.asked = [recruitDo(), partyPickBusy(), followers.length - n, recruitPrice()]; partyPickChoose('cancel'); o.cancel = [partyPickBusy(), followers.length - n, recruitPrice()];
            recruitDo(); partyPickChoose('nobody'); o.done = [followers.length - n, shardCount, recruitPrice()]; invReset(); return o; })()`);
        same(r.asked.join(), 'true,true,0,0', 'asked first'); same(r.cancel.join(), 'false,0,0', 'CANCEL'); same(r.done.join(), '1,0,200', 'made free once chosen');
    });
    check('past the tutorial, or past its RECRUIT step, + RECRUIT costs RECRUIT_COST (200) as ever, and the step\'s words say so; the button and the roster\'s readout say FREE only for the free one (js/commandcenter.js)', () => {
        const r = J(`(function(){ ${toRecruit} const o = {}; __S.step = TUT_STEPS.findIndex(s => s.id === 'position'); o.past = recruitPrice(); __S.step = TUT_STEPS.length; __S.doneAt = 1; o.done = recruitPrice(); o.text = TUT_STEPS.find(s => s.id === 'recruit').text();
            shardCount = 100; const n = followers.length; o.bought = recruitFollower(); o.n = followers.length - n; invReset(); return o; })()`);
        same(r.past, 200, 'past the RECRUIT step'); same(r.done, 200, 'after the tutorial'); same(r.text, 'OPEN THE ROSTER (BOTTOM BAR) AND PRESS + RECRUIT: 200 SHARDS.', 'the step\'s words when not free'); same(r.bought, false, 'a recruit with 100 after the tutorial'); same(r.n, 0, 'a follower made');
        const cc = rd('js/commandcenter.js'); ok(/"FREE"/.test(cc) && /"RECRUIT FREE"/.test(cc) && /YOUR FIRST RECRUIT IS FREE/.test(cc) && (cc.match(/recruitPrice\(\)/g) || []).length >= 3, 'the button, the tile and the readout do not say FREE');
    });
    await checkA('saved: the free recruit used is kept through a save and reload in the middle of the tutorial (script.fr), and one not used is still free after a reload; a save from before it (no fr) loads as before, its first recruit free', async () => {
        const store = {}, A = await boot(store); A.run(`gameState.running = true; facilityBlackoutSet(false); facilityResetState(); facilityTutorialStart(_fp.F); facilitySaveWrite();`);
        const unused = JSON.parse(store.conduit_fp_save); same(unused.script.fr, 0, 'the flag in a save, not used');
        const B = await boot({ conduit_fp_save: JSON.stringify(unused) }); same(B.J('[_fp.tut.script.step, recruitPrice()]').join(), '0,0', 'reloaded, not used: the step and the price');
        A.run(`recruitFollower(); facilitySaveWrite();`); const used = JSON.parse(store.conduit_fp_save); same(used.script.fr, 1, 'the flag in a save, used'); same(used.script.step, 0, 'still in the tutorial\'s first step');
        const C = await boot({ conduit_fp_save: JSON.stringify(used) }); same(C.errors.join(' | '), '', 'errors'); same(C.J('[_fp.tut.script.step, recruitPrice(), shardCount]').join(), '0,200,100', 'reloaded, used: the step, the price, the shards');
        const old = JSON.parse(JSON.stringify(used)); delete old.script.fr; const D = await boot({ conduit_fp_save: JSON.stringify(old) }); same(D.errors.join(' | '), '', 'errors with no flag'); same(D.J('recruitPrice()'), 0, 'a save with no flag: the first recruit free');
        const bad = JSON.parse(JSON.stringify(used)); bad.script.fr = 'yes'; const E = await boot({ conduit_fp_save: JSON.stringify(bad) }); same(E.errors.join(' | '), '', 'errors with a malformed flag'); same(E.J('recruitPrice()'), 0, 'a malformed flag reads as not used');
    });

    group('THE CRYSTAL: every element online from the start, and followers a little sturdier');
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

    group('AN OLD SAVE: a game saved with posts in it');
    await checkA('a game saved at build 2026-11-17dl (spot_show claimed, its recruit holding the Warehouse, a squad-full question open for an egg, eggs out) loads without an error: its four followers come back as they were, the claimed-posts list is read past and is not written again, no pad or egg comes back, and its shards are its own', async () => {
        const old = JSON.parse(OLD_SAVE); same(JSON.stringify(old.spots), '{"spot_show":1}', 'the fixture');
        const store = { conduit_fp_save: OLD_SAVE }, B = await boot(store);
        const r = B.J(`(function(){ gameState.running = true; for (let i = 0; i < 30; i++) { frame++; facilityTutorialTick(); } const d = facilitySaveCollect();
            return { n: followers.length, f: followers.map(f => [f.role, f.element, f.post || null, f.dead ? 1 : 0]), shards: shardCount, pads: _fp.items.filter(i => i.fp === 'spot').length, eggs: actors.filter(a => a && (a.fpSpot || (a.isNeutralRecruit && !a.dead))).length,
                busy: typeof partyPickBusy === 'function' ? partyPickBusy() : null, saved: 'spots' in d, price: recruitPrice() }; })()`);
        same(B.errors.join(' | '), '', 'errors while loading');
        same(r.n, 4, 'followers'); same(JSON.stringify(r.f), JSON.stringify(old.followers.map(e => [e.role, e.element, e.post || null, 0])), 'the followers as they were saved');
        same(r.shards, 123, 'shards'); same(r.price, old.script && old.script.step <= 4 && !old.script.done ? 0 : 200, 'the old save\'s recruit price (no flag: its first recruit free while before the RECRUIT step)'); same(r.pads, 0, 'pads'); same(r.eggs, 0, 'eggs'); same(r.busy, false, 'a question open'); same(r.saved, false, 'the claimed posts written again');
        const odd = JSON.parse(OLD_SAVE); odd.spots = { spot_cold: 777, spot_lobby: 1, nonsense: 'x' }; const C = await boot({ conduit_fp_save: JSON.stringify(odd) }); same(C.errors.join(' | '), '', 'errors with an older save\'s refill delays'); same(C.J('followers.length'), 4, 'its followers');
        const bad = JSON.parse(OLD_SAVE); bad.spots = 'broken'; const D = await boot({ conduit_fp_save: JSON.stringify(bad) }); same(D.errors.join(' | '), '', 'errors with a malformed list'); same(D.J('followers.length'), 4, 'its followers');
    });

    same(errors.join(' | '), '', 'errors while booting');
    console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
