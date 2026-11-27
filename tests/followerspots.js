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
    check('in play: no pad among the floor\'s items, no egg waiting anywhere, and the facility\'s tick runs; the tutorial\'s RECRUIT step names only the roster\'s + RECRUIT and its price (RECRUIT_COST), with no egg and no pad', () => {
        const r = J(`(function(){ for (let i = 0; i < 30; i++) { frame++; facilityTutorialTick(); } return { pads: _fp.items.filter(i => i.fp === 'spot').length, spots: _fp.spots === undefined, eggs: actors.filter(a => a && (a.fpSpot || (a.isNeutralRecruit && !a.dead))).length,
            text: TUT_STEPS.find(s => s.id === 'recruit').text(), hint: TUT_STEPS.find(s => s.id === 'recruit').hint(), cost: RECRUIT_COST }; })()`);
        same(r.pads, 0, 'pads'); same(r.spots, true, '_fp.spots'); same(r.eggs, 0, 'eggs waiting');
        same(r.text, 'OPEN THE ROSTER (BOTTOM BAR) AND PRESS + RECRUIT: ' + r.cost + ' SHARDS.', 'the step'); ok(!/EGG|PAD/.test(r.text + ' ' + r.hint), 'the step or its hint still speaks of eggs or pads: ' + r.text + ' / ' + r.hint); ok(/EVERY ELEMENT IS ONLINE FROM THE START/.test(r.hint), 'the hint');
        ok(!/EGGS ON THE PADS/.test(rd('js/infodex.js')) && !/recruitment post/.test(rd('js/infodex.js')), 'the INFO index still has the posts');
    });
    check('a new game reaches the RECRUIT step with STARTING_SHARDS: nothing before it pays shards (a kill pays, js/drops.js, and no step asks for one), so + RECRUIT (RECRUIT_COST) is out of reach there until the squad has killed enough in the arena; measured, not changed (docs/OPEN-QUESTIONS.md)', () => {
        const r = J(`(function(){ const o = {}; facilityResetState(); facilityTutorialStart(_fp.F); const S = _fp.tut.script, tick = () => { facilityDirectorTick(); return S.step; }; o.start = shardCount;
            for (const it of _fp.items.filter(i => i.fp === 'pickup')) it.taken = true; tick(); S.jseen = 1; tick(); invAdd('power_module', 1); tick(); facilityJunctionRepair(true); invRemove('power_module', 1); tick();
            o.step = TUT_STEPS[S.step] && TUT_STEPS[S.step].id; o.shards = shardCount; o.cost = RECRUIT_COST; o.start0 = STARTING_SHARDS; const n = followers.length; o.bought = recruitFollower(); o.n = followers.length - n; o.after = shardCount;
            shardCount = RECRUIT_COST; o.bought2 = recruitFollower(); o.step2 = (tick(), TUT_STEPS[S.step] && TUT_STEPS[S.step].id); o.left = shardCount; invReset(); return o; })()`);
        console.log('       (measured: ' + r.shards + ' shards at the RECRUIT step; + RECRUIT costs ' + r.cost + ')');
        same(r.step, 'recruit', 'the step reached'); same(r.start, r.start0, 'a new game\'s shards'); same(r.shards, r.start0, 'the shards at the RECRUIT step'); ok(r.shards < r.cost, 'there are enough for + RECRUIT: the open question can be closed');
        same(r.bought, false, 'a recruit bought short of the price'); same(r.n, 0, 'a follower made'); same(r.after, r.shards, 'shards taken'); same(r.bought2, true, 'a recruit with the price in hand'); same(r.step2, 'position', 'RECRUIT finished by + RECRUIT'); same(r.left, 0, 'the price taken');
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
                busy: typeof partyPickBusy === 'function' ? partyPickBusy() : null, saved: 'spots' in d }; })()`);
        same(B.errors.join(' | '), '', 'errors while loading');
        same(r.n, 4, 'followers'); same(JSON.stringify(r.f), JSON.stringify(old.followers.map(e => [e.role, e.element, e.post || null, 0])), 'the followers as they were saved');
        same(r.shards, 123, 'shards'); same(r.pads, 0, 'pads'); same(r.eggs, 0, 'eggs'); same(r.busy, false, 'a question open'); same(r.saved, false, 'the claimed posts written again');
        const odd = JSON.parse(OLD_SAVE); odd.spots = { spot_cold: 777, spot_lobby: 1, nonsense: 'x' }; const C = await boot({ conduit_fp_save: JSON.stringify(odd) }); same(C.errors.join(' | '), '', 'errors with an older save\'s refill delays'); same(C.J('followers.length'), 4, 'its followers');
        const bad = JSON.parse(OLD_SAVE); bad.spots = 'broken'; const D = await boot({ conduit_fp_save: JSON.stringify(bad) }); same(D.errors.join(' | '), '', 'errors with a malformed list'); same(D.J('followers.length'), 4, 'its followers');
    });

    same(errors.join(' | '), '', 'errors while booting');
    console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
