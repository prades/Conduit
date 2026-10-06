// WHAT A CLONE COSTS.
//
// REPORTED: "making clones of the predators should not cost any followers.
// Let's just make it cost shards. Maybe a cost of five starting off at the
// lower grades and then up to 25 shards. But we still keep the DNA splices."
//
// Cloning used to charge DNA splices AND followers — up to five of them,
// killed outright at the Crystal by executeClone. That is why the mechanic went
// unused: trading your squad for one unit of a squad is not a trade anyone
// takes twice.
//
// It now charges splices and SHARDS. The splices stay because they are what
// makes a clone specific to something you actually fought and killed; no amount
// of shards substitutes for that.
//
// Found while rewriting the price: the old sum counted tankExtra TWICE — once
// folded into baseCost and again on the very next line — so a tank silently
// cost double what the table said. Nothing tested any of this.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox, fnSource, configNums } = require('./domstub.js');

const SRC = {
    clone:   fs.readFileSync(path.join(ROOT, 'js/clone.js'),   'utf8'),
    species: fs.readFileSync(path.join(ROOT, 'js/species.js'), 'utf8'),
    codex:   fs.readFileSync(path.join(ROOT, 'js/codex.js'),   'utf8'),
};

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

async function ready() {
    const sandbox = makeBrowserSandbox({ tubecrawler_seed: '305419896' });
    const ctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is noisy under stubs */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run(`gameState.running = true; gameState.phase = 'day'; gameState.nightNumber = 1;`);
    run(`for (let i = 0; i < 3 * ZONE_LENGTH; i++) { try { generateSegment(i); } catch(e) {} }`);
    return { run, sandbox };
}

(async () => {
    const C = await ready();
    const LO = C.run('CLONE_SHARD_MIN');
    const HI = C.run('CLONE_SHARD_MAX');

    // A squad, some shards, and the splices for one named clone.
    const scene = (key, shards, body) => C.run(`(function(){
        actors.length = 0; followers.length = 0;
        ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
        floatingTexts.length = 0;
        for (let i = 0; i < 6; i++) spawnFollowerAtCrystal('fire');
        shardCount = ${shards};
        setDNA({ ${JSON.stringify(key)}: 99 });
        const opt = getCloneOptions().find(o => o.key === ${JSON.stringify(key)});
        if (!opt) throw new Error('fixture: ' + ${JSON.stringify(key)} + ' was not offered');
        const before = {
            shards: shardCount,
            followers: followers.filter(f => !f.dead).length,
            splices: (getDNA())[${JSON.stringify(key)}] || 0,
        };
        ${body || 'executeClone(opt);'}
        return {
            cost: opt.shardCost, ready: opt.ready, before,
            shards: shardCount,
            followers: followers.filter(f => !f.dead).length,
            sacrificed: actors.filter(a => a.sacrificed).length,
            splices: (getDNA())[${JSON.stringify(key)}] || 0,
            clones: actors.filter(a => a.isClone && !a.dead).length,
            said: floatingTexts.map(f => f.text),
        };
    })()`);

    // ─────────────────────────────────────────────────────
    group('THE ASK: shards, not followers');

    check('THE REPORTED CASE: cloning costs no followers at all', () => {
        const r = scene('ant_tank', 100);
        same(r.clones, 1, 'the clone should have been made');
        same(r.sacrificed, 0, 'no follower may be sacrificed');
        same(r.followers, r.before.followers, 'the squad should be untouched');
    });

    check('it costs shards, and exactly what the option said', () => {
        const r = scene('ant_tank', 100);
        same(r.before.shards - r.shards, r.cost,
             'it should have taken exactly ' + r.cost + ' shards');
    });

    check('AND THE SPLICES ARE KEPT', () => {
        // "But we still keep the DNA splices."
        const r = scene('ant_tank', 100);
        ok(r.splices < r.before.splices,
           'the splices were not spent: ' + r.before.splices + ' -> ' + r.splices);
        same(r.before.splices - r.splices, C.run(`CLONE_COSTS['ant'].splicesNeeded`),
             'it should spend exactly splicesNeeded');
    });

    check('no shards means no clone, and it says so', () => {
        const r = scene('ant_tank', 2);
        same(r.ready, false, 'the option should not be offered as ready');
        same(r.clones, 0, 'and no clone should appear');
        same(r.shards, 2, 'nor should any shards be taken');
        same(r.sacrificed, 0, 'and certainly no followers');
    });

    check('a stale menu cannot buy one you can no longer afford', () => {
        // option.ready is computed when the menu is BUILT. Shards can be spent
        // between then and the tap, so the price is re-checked at the point of
        // sale rather than trusted.
        const r = scene('ant_tank', 2, `executeClone(Object.assign({}, opt, { ready: true }));`);
        same(r.clones, 0, 'a forced buy should still be refused');
        same(r.shards, 2, 'and take nothing');
        ok(r.said.some(s => /NEED \d+ SHARDS/.test(s)), 'with a reason: ' + JSON.stringify(r.said));
    });

    check('with no followers at all, you can still clone', () => {
        // The old cost made this impossible by definition, and a wiped squad is
        // exactly when you most want one.
        const r = C.run(`(function(){
            actors.length = 0; followers.length = 0;
            ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
            shardCount = 100; setDNA({ 'ant_scout': 99 });
            const opt = getCloneOptions().find(o => o.key === 'ant_scout');
            if (!opt) throw new Error('fixture: ant_scout was not offered');
            executeClone(opt);
            return { ready: opt.ready, clones: actors.filter(a => a.isClone && !a.dead).length };
        })()`);
        same(r.ready, true, 'an empty squad should not block a purchase');
        same(r.clones, 1, 'the clone should have been made');
    });

    // ─────────────────────────────────────────────────────
    group('THE PRICE: five at the bottom, twenty-five at the top');

    check('the declared range is 5 to 25', () => {
        same(LO, 5, 'the floor should be 5 shards');
        same(HI, 25, 'the ceiling should be 25 shards');
    });

    check('every option the menu can offer lands inside it', () => {
        const r = C.run(`(function(){
            const all = [];
            for (const s of Object.keys(CLONE_COSTS))
                for (const c of ['scout','striker','tank'])
                    all.push({ s, c, cost: cloneShardCost(s, c) });
            return { min: Math.min(...all.map(x=>x.cost)),
                     max: Math.max(...all.map(x=>x.cost)),
                     outside: all.filter(x => x.cost < CLONE_SHARD_MIN || x.cost > CLONE_SHARD_MAX) };
        })()`);
        same(r.outside.length, 0, 'outside the range: ' + JSON.stringify(r.outside));
        same(r.min, LO, 'the cheapest option should be exactly the floor');
        same(r.max, HI, 'the dearest should be exactly the ceiling');
    });

    check('and the range is CLAMPED, not just a tidy table', () => {
        // The guarantee has to survive someone editing the table. Feeding the
        // formula an absurd class extra must still land in range.
        const r = C.run(`(function(){
            const saveN = CLONE_CLASS_SHARDS.nymph, saveB = CLONE_CLASS_SHARDS.boss;
            CLONE_CLASS_SHARDS.nymph = -999; CLONE_CLASS_SHARDS.boss = 999;
            const lowest  = cloneShardCost('ant', 'nymph');
            const highest = cloneShardCost('QX-z1', 'boss');
            CLONE_CLASS_SHARDS.nymph = saveN; CLONE_CLASS_SHARDS.boss = saveB;
            return { lowest, highest };
        })()`);
        same(r.lowest, LO, 'an absurdly cheap class should clamp up to the floor');
        same(r.highest, HI, 'an absurdly dear one should clamp down to the ceiling');
    });

    check('the cheapest thing in the game is the lowest grade scout', () => {
        same(C.run(`cloneShardCost('ant','scout')`), LO, 'an ant scout should be the floor price');
    });

    check('it rises with the class and with the species', () => {
        const r = C.run(`(function(){
            return {
                antScout: cloneShardCost('ant','scout'),
                antStriker: cloneShardCost('ant','striker'),
                antTank: cloneShardCost('ant','tank'),
                mothScout: cloneShardCost('moth','scout'),
            };
        })()`);
        ok(r.antStriker > r.antScout, 'a striker should cost more than a scout');
        ok(r.antTank > r.antStriker, 'a tank more than a striker');
        ok(r.mothScout > r.antScout, 'a deeper species should cost more');
    });

    check('THE DOUBLE CHARGE: a tank is charged its extra ONCE', () => {
        // The old code added tankExtra twice. Stated as the exact table value
        // so it cannot drift back.
        const r = C.run(`(function(){
            return { tank: cloneShardCost('ant','tank'),
                     scout: cloneShardCost('ant','scout'),
                     extra: CLONE_CLASS_SHARDS.tank };
        })()`);
        same(r.tank - r.scout, r.extra,
             'a tank costs ' + (r.tank - r.scout) + ' over a scout, not ' + r.extra);
    });

    check('an unknown species is not free', () => {
        // CLONE_COSTS has synthetic entries precisely so a stray DNA key cannot
        // crash — it must not be able to buy a clone for nothing either.
        same(C.run(`cloneShardCost('not-a-species','scout')`), HI,
             'an unknown species should cost the maximum');
        same(C.run(`cloneShardCost(undefined,'scout')`), HI, 'and so should nothing at all');
    });

    // ─────────────────────────────────────────────────────
    group('nothing is left charging followers');

    check('the follower cost is gone from the code entirely', () => {
        // Comments stripped: the note explaining the old double charge names
        // tankExtra, and it failed this check on correct code.
        const code = s => s.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
        const clone = code(SRC.clone), species = code(SRC.species);
        ok(!/followerCost/.test(clone), 'clone.js still computes a followerCost');
        ok(!/sacrificed = true/.test(clone), 'clone.js still sacrifices followers');
        // And the old table fields with it, so two price models cannot coexist
        // — duplicated cost literals are what caused the double charge.
        for (const dead of ['tankExtra', 'bossExtra']) {
            ok(!new RegExp(dead).test(species), 'species.js still declares ' + dead);
            ok(!new RegExp(dead).test(clone), 'clone.js still reads ' + dead);
        }
    });

    check('the menus show the shard price, not a follower price', () => {
        ok(/shards/.test(SRC.clone), 'no shard cost is drawn');
        ok(!/followers"/.test(SRC.clone), 'a menu still labels the cost in followers');
        // One menu now (the HUD clone bay), greyed when unaffordable so the
        // number explains the missing CLONE button.
        ok((SRC.clone.match(/shardCount >= opt\.shardCost/g) || []).length >= 1,
           'the clone bay should grey the price when you cannot afford it');
    });

    check('readiness depends on shards, not on squad size', () => {
        const at = SRC.clone.indexOf('function getCloneOptions');
        const end = SRC.clone.indexOf('\nfunction ', at + 1);
        const body = SRC.clone.slice(at, end === -1 ? undefined : end);
        ok(body.length > 200, 'getCloneOptions could not be located');
        ok(/shardCount >= shardCost/.test(body), 'readiness does not check shards');
        ok(!/followers\.length >=/.test(body), 'readiness still gates on squad size');
    });

    // ─────────────────────────────────────────────────────
    group('BUYING ONE FROM THE CRYSTAL MENU');

    // REPORTED: "even though I have the money, I'm unable to buy the clone
    // from the crystal menu."
    //
    // Not the price. With four clones already out, every row went dim, the
    // CLONE button was simply not drawn, and a tap did nothing and said
    // nothing — so three affordable rows sat there with no way to act on them.
    // And clones PERSIST across waves (waves.js rebuilds cloneArmy at the start
    // of each one), so the cap filled once and stayed full for the rest of the
    // game. There was no way to dismiss one anywhere in the game.
    //
    // A sweep of every sort mode against five scroll positions also turned up
    // sixteen GHOST buttons: rows scrolled out of the clipped list kept their
    // tappable bounds, so a tap on empty space bought a clone you never chose.

    // Open the crystal clone tab with `live` clones already out, draw it, and
    // hand back what the player can see and press.
    const menu = (live, body) => C.run(`(function(){
        actors.length = 0; followers.length = 0; floatingTexts.length = 0;
        ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
        shardCount = 9999;
        const inv = {};
        for (const c of ['scout','striker','tank']) inv['ant_' + c] = 99;
        setDNA(inv);
        for (let i = 0; i < ${live}; i++) {
            const S = SPECIES['ant'];
            const c = new Predator('scout', Object.assign({}, S.scout, {color:S.color}), 1, 2);
            c.team = 'green'; c.isClone = true; c.speciesName = 'ant'; c.className = 'scout';
            actors.push(c);
        }
        cloneMenuOpen = true;
        crystalCloneSort = 'species'; _crystalScrollY = 0;
        drawCloneMenu();
        ${body || ''}
        const tab = window._cloneTabOpts || [];
        return {
            offered: tab.length,
            ready: tab.filter(o => o.ready).length,
            buyable: tab.filter(o => typeof o._bx === 'number').length,
            explains: tab.filter(o => typeof o._nbx === 'number').length,
            clones: actors.filter(a => a.isClone && !a.dead).length,
            dismissBtn: !!window._cloneDismissBtn,
            said: floatingTexts.map(f => f.text),
        };
    })()`);

    check('under the cap, a row you can afford has a CLONE button', () => {
        const r = menu(3);
        same(r.ready, 3, 'all three ant rows should be ready');
        same(r.buyable, 3, 'and all three should be pressable');
    });

    check('THE REPORTED CASE: at the cap, a blocked row EXPLAINS itself', () => {
        // It used to draw nothing at all and swallow the tap.
        const r = menu(4);
        same(r.ready, 0, 'fixture: nothing should be ready at the cap');
        same(r.buyable, 0, 'and nothing should be buyable');
        ok(r.explains > 0, 'a blocked row must still be tappable so it can say why');
    });

    check('and tapping it says exactly what is in the way', () => {
        const r = menu(4, `
            const o = (window._cloneTabOpts||[]).find(x => typeof x._nbx === 'number');
            crystalMenuOpen = true;
            handleCloneMenuTap(o._nbx + o._nbw/2, o._nby + o._nbh/2);
        `);
        ok(r.said.some(s => /CLONE CAP 4\/4/.test(s)),
           'it should name the cap: ' + JSON.stringify(r.said));
        same(r.clones, 4, 'and must not buy anything');
    });

    check('the reason is specific — DNA and shards each say their own thing', () => {
        const r = C.run(`(function(){
            actors.length = 0; followers.length = 0;
            shardCount = 9999; setDNA({ ant_scout: 1 });
            const short = getCloneOptions().find(o => o.key === 'ant_scout');
            const dnaWhy = cloneBlockedReason(short);
            const dnaLbl = cloneBlockedLabel(short);
            shardCount = 0; setDNA({ ant_scout: 99 });
            const poor = getCloneOptions().find(o => o.key === 'ant_scout');
            const shardWhy = cloneBlockedReason(poor);
            const shardLbl = cloneBlockedLabel(poor);
            return { dnaWhy, dnaLbl, shardWhy, shardLbl };
        })()`);
        ok(/DNA/.test(r.dnaWhy), 'short on splices should say so: ' + r.dnaWhy);
        ok(/SHARDS/.test(r.shardWhy), 'short on shards should say so: ' + r.shardWhy);
        ok(r.dnaWhy !== r.shardWhy, 'the two reasons must not be the same sentence');
        ok(r.dnaLbl !== r.shardLbl, 'nor the two button labels');
    });

    check('THE WAY OUT: DISMISS frees a slot and the rows come back', () => {
        // Clones persist across waves, so without this the cap filled once and
        // the whole menu was dead for the rest of the game.
        const r = menu(4, `
            const db = window._cloneDismissBtn;
            if (!db) throw new Error('no DISMISS button was drawn at the cap');
            crystalMenuOpen = true;
            handleCloneMenuTap(db.x + db.w/2, db.y + db.h/2);
            drawCloneMenu();
        `);
        same(r.clones, 3, 'one clone should have been dismissed');
        same(r.ready, 3, 'and the rows should be ready again');
        ok(r.buyable > 0, 'with a pressable CLONE button');
    });

    check('and then the purchase actually goes through', () => {
        const r = menu(4, `
            const db = window._cloneDismissBtn;
            crystalMenuOpen = true;
            handleCloneMenuTap(db.x + db.w/2, db.y + db.h/2);
            drawCloneMenu();
            const o = (window._cloneTabOpts||[]).find(x => typeof x._bx === 'number');
            crystalMenuOpen = true;
            handleCloneMenuTap(o._bx + o._bw/2, o._by + o._bh/2);
        `);
        same(r.clones, 4, 'the slot freed by DISMISS should have been refilled');
        ok(r.said.some(s => /DISMISSED/.test(s)), 'the dismissal should be announced');
        ok(r.said.some(s => /CLONED/.test(s)), 'and so should the purchase');
    });

    check('DISMISS is not offered when there is nothing to dismiss', () => {
        same(menu(0).dismissBtn, false, 'an empty field should not offer it');
        same(menu(1).dismissBtn, true, 'one clone out should');
    });

    check('THE GHOSTS: a button you cannot see is not tappable', () => {
        // Every sort mode against several scroll positions. A row scrolled out
        // of the clipped list must leave no bounds behind.
        const r = C.run(`(function(){
            actors.length = 0; followers.length = 0; shardCount = 9999;
            const inv = {};
            for (const s of ['ant','beetle','mantis','scorpion','spider','moth'])
                for (const c of ['scout','striker','tank']) inv[s + '_' + c] = 99;
            setDNA(inv);
            cloneMenuOpen = true;
            const bad = [];
            for (const sort of CSORTS.map(s => s.id)) {
                for (const scroll of [0, 60, 200, 600, 2000]) {
                    crystalCloneSort = sort; _crystalScrollY = scroll;
                    drawCloneMenu();
                    const cl = window._cloneTabBounds;
                    for (const o of (window._cloneTabOpts || [])) {
                        for (const [bx, by, bh] of [[o._bx, o._by, o._bh], [o._nbx, o._nby, o._nbh]]) {
                            if (typeof bx !== 'number') continue;
                            if (by < cl.listY || by + bh > cl.listY + cl.listH)
                                bad.push(sort + '@' + scroll + ' ' + o.key);
                        }
                    }
                }
            }
            return bad;
        })()`);
        same(r.length, 0, 'tappable but invisible: ' + r.slice(0, 6).join(', '));
    });

    // ─────────────────────────────────────────────────────
    group('A CLONE IS A BETTER VERSION OF WHAT YOU KILLED');

    // "I want the clones to be more resilient — basically three times as much
    // health as their predator counterparts. And they respawn but slowly, and
    // there's a ticker at the crystal showing the respawn time. And make it
    // more noticeable they're on your team — a little green health bar."
    //
    // The 3x POWER multiplier already existed, at ONE of the three places a
    // clone is built. The respawn and the between-waves restore each built
    // their own and left it off, so a clone that died once — or merely
    // survived a wave — came back an ordinary predator for the rest of the
    // game. All three go through makeClone() now.
    const MUL = configNums(['CLONE_HEALTH_MULT', 'CLONE_POWER_MULT', 'CLONE_RESPAWN_FRAMES']);

    const built = (how) => C.run(`(function(){
        actors.length = 0; respawnQueue.length = 0;
        shardCount = 9999; setDNA({ ant_scout: 99 });
        ${how}
        const c = actors.find(a => a && a.isClone);
        const cd = SPECIES['ant'].scout;
        return c ? { hp: c.maxHealth, health: c.health, power: c.power,
                     baseHp: cd.health, basePower: cd.power,
                     team: c.team, isClone: !!c.isClone } : null;
    })()`);

    check('THE ASK: a summoned clone has 3x the health', () => {
        const r = built(`executeClone(getCloneOptions().find(o => o.key === 'ant_scout'));`);
        ok(!!r, 'no clone was summoned');
        same(r.hp, r.baseHp * MUL.CLONE_HEALTH_MULT,
             `${r.hp} max health against a base of ${r.baseHp}`);
        same(r.health, r.hp, 'it should arrive at FULL health, not a third of the bar');
    });

    check('and 3x the power, which it always had', () => {
        const r = built(`executeClone(getCloneOptions().find(o => o.key === 'ant_scout'));`);
        same(r.power, r.basePower * MUL.CLONE_POWER_MULT,
             `${r.power} power against a base of ${r.basePower}`);
    });

    check('THE BUG: a RESPAWNED clone is just as strong', () => {
        // It was not. This block built its own predator and never multiplied.
        const r = built(`
            const victim = makeClone('ant', 'scout', 0, 2);
            victim.dead = true; victim.stats = { hp: 5 };
            for (let f = 0; f < 5; f++) render();
            const q = respawnQueue.find(e => e.isClone);
            if (q) q.timer = 1;
            actors.length = 0;
            for (let f = 0; f < 5; f++) render();
        `);
        ok(!!r, 'nothing respawned');
        same(r.hp, r.baseHp * MUL.CLONE_HEALTH_MULT, 'a respawned clone lost its health bonus');
        same(r.power, r.basePower * MUL.CLONE_POWER_MULT, 'a respawned clone lost its power bonus');
    });

    check('and so is one that merely SURVIVED a wave', () => {
        // The between-waves restore in waves.js was the third copy.
        const WAVES = fs.readFileSync(path.join(ROOT, 'js/waves.js'), 'utf8');
        ok(/makeClone\(/.test(WAVES), 'the wave restore still builds its own clone');
        ok(!/clone\.isClone\s*=\s*true/.test(WAVES), 'it still assembles one by hand');
    });

    check('ONE builder, so the three can never disagree again', () => {
        const CLONE = fs.readFileSync(path.join(ROOT, 'js/clone.js'), 'utf8');
        const GAME  = fs.readFileSync(path.join(ROOT, 'js/game.js'),  'utf8');
        same((CLONE.match(/function makeClone/g) || []).length, 1,
             'makeClone is declared more than once');
        // Nothing else may construct a Predator and call it a clone.
        for (const [name, src] of [['game.js', GAME], ['waves.js',
                fs.readFileSync(path.join(ROOT, 'js/waves.js'), 'utf8')]]) {
            ok(!/isClone\s*=\s*true/.test(src), name + ' still hand-builds a clone');
        }
    });

    check('the multipliers are named constants, not numbers inline', () => {
        const CLONE = fs.readFileSync(path.join(ROOT, 'js/clone.js'), 'utf8');
        ok(/CLONE_HEALTH_MULT/.test(CLONE), 'the health multiplier is not named');
        ok(/CLONE_POWER_MULT/.test(CLONE), 'the power multiplier is not named');
        ok(!/clone\.power \* 3\b/.test(CLONE), 'the old inline 3 is still there');
    });

    check('THE SLOW RESPAWN: a clone takes far longer than a follower', () => {
        const r = C.run(`(function(){
            actors.length = 0; respawnQueue.length = 0;
            const c = makeClone('ant', 'scout', 0, 2);
            c.dead = true; c.stats = { hp: 5 };
            const f = { x: 0, y: 2, team: 'green', dead: true, element: 'fire',
                        stats: { hp: 5 }, isFollower: true };
            actors.push(f); followers.push(f);
            for (let n = 0; n < 5; n++) render();
            const clone    = respawnQueue.find(e => e.isClone);
            const follower = respawnQueue.find(e => !e.isClone);
            return { clone: clone ? clone.timer : null,
                     total: clone ? clone.totalTimer : null,
                     follower: follower ? follower.timer : null };
        })()`);
        ok(r.clone !== null, 'the clone was never queued to respawn');
        ok(r.follower !== null, 'fixture: the follower was not queued');
        ok(r.clone > r.follower * 5,
           `a clone waits ${r.clone} frames against a follower's ${r.follower}`);
        same(r.total, MUL.CLONE_RESPAWN_FRAMES, 'the total is not recorded for the ticker');
    });

    check('it does come back — slow, not never', () => {
        const r = built(`
            const victim = makeClone('ant', 'scout', 0, 2);
            victim.dead = true; victim.stats = { hp: 5 };
            for (let n = 0; n < 5; n++) render();
            actors.length = 0;
            for (let n = 0; n < CLONE_RESPAWN_FRAMES + 120; n++) render();
        `);
        ok(!!r, 'the clone never came back at all');
        same(r.isClone, true, 'it came back as something other than a clone');
        same(r.team, 'green', 'it came back on the wrong side');
    });

    // ─────────────────────────────────────────────────────
    group('a clone LOOKS like yours');

    // A recording context, because the game's own ctx is a const and cannot be
    // swapped out from a test. Only the two drawing functions are evaluated —
    // fnSource lifts the real ones rather than a copy.
    function painter(extra) {
        const ops = [];
        const rec = new Proxy({}, {
            get(t, k) {
                if (k in t) return t[k];
                return (...a) => { ops.push({ op: k, args: a }); };
            },
            set(t, k, v) { ops.push({ op: 'set:' + k, args: [v] }); t[k] = v; return true; },
        });
        const sandbox = Object.assign({
            console, Math, Object, Array, String, Number, JSON,
            ctx: rec, respawnQueue: [],
        }, extra || {});
        sandbox.globalThis = sandbox;
        const c = vm.createContext(sandbox);
        vm.runInContext(fnSource('js/draw.js', 'drawHealthBar'), c, { filename: 'drawHealthBar' });
        vm.runInContext(fnSource('js/game.js', 'drawCloneRespawnTicker'), c, { filename: 'ticker' });
        return { ops, run: e => vm.runInContext(e, c), sandbox };
    }

    check('THE ASK: an ally bar is GREEN at a health an enemy\'s is not', () => {
        const p = painter();
        p.run('drawHealthBar(0,0,36,5,50,100,ctx,false)');
        const enemy = p.ops.filter(o => o.op === 'set:fillStyle').map(o => o.args[0]);
        p.ops.length = 0;
        p.run('drawHealthBar(0,0,36,5,50,100,ctx,true)');
        const ally = p.ops.filter(o => o.op === 'set:fillStyle').map(o => o.args[0]);
        // At half health the ordinary ramp is yellow — the same colour as the
        // enemy standing next to it, which is the whole complaint.
        ok(enemy.some(c => /^#ff0/i.test(c)), 'fixture: a half-health enemy bar should be yellow: ' + enemy);
        ok(!ally.some(c => /^#ff0/i.test(c)), 'the ally bar is still yellow at half health: ' + ally);
        ok(ally.some(c => /^#(1|2)[0-9a-f]c?/i.test(c) && c !== '#000'), 'the ally bar is not green: ' + ally);
    });

    check('and it is green at every health, because colour means WHOSE', () => {
        const p = painter();
        const at = pct => {
            p.ops.length = 0;
            p.run(`drawHealthBar(0,0,36,5,${pct},100,ctx,true)`);
            return p.ops.filter(o => o.op === 'set:fillStyle')
                        .map(o => o.args[0]).filter(c => c !== '#000');
        };
        for (const pct of [95, 50, 10]) {
            const cols = at(pct);
            ok(cols.length > 0, 'nothing drawn at ' + pct + '%');
            for (const c of cols) {
                // Handles #rgb as well as #rrggbb — the ordinary ramp uses the
                // short form, and a 6-digit parser read "#0f8" as r=15 g=8 and
                // reported a green colour as not green.
                const hex = c.length === 4
                    ? c[1] + c[1] + c[2] + c[2] + c[3] + c[3]
                    : c.slice(1);
                const r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16);
                ok(g > r, `at ${pct}% health the ally bar is ${c} (r=${r} g=${g}), which is not green`);
            }
        }
    });

    check('the bar still SHRINKS, so length is still health', () => {
        // Colour carrying ownership must not cost the health reading.
        const p = painter();
        const width = pct => {
            p.ops.length = 0;
            p.run(`drawHealthBar(0,0,36,5,${pct},100,ctx,true)`);
            const fills = p.ops.filter(o => o.op === 'fillRect');
            return fills.length > 1 ? fills[1].args[2] : null;
        };
        const full = width(100), half = width(50);
        ok(full > half, `the bar does not shrink: ${full} at full, ${half} at half`);
    });

    check('an allied PREDATOR is drawn with the ally bar', () => {
        const DRAW = fs.readFileSync(path.join(ROOT, 'js/draw.js'), 'utf8');
        ok(/_isAllyPred = actor\.team === "green" \|\| actor\.isClone/.test(DRAW),
           'the ally test changed shape');
        ok(/drawHealthBar\(px-18, py-85, 36, 5, actor\.health, actor\.maxHealth, drawCtx, _isAllyPred\)/
            .test(DRAW), 'the predator bar is not told whether it is an ally');
    });

    // ─────────────────────────────────────────────────────
    group('THE TICKER: the Crystal shows what is coming back');

    check('it lists a clone that is on its way', () => {
        const p = painter();
        p.run(`respawnQueue.push({ isClone: true, speciesName: 'ant', className: 'scout',
                                   timer: 900, totalTimer: 1800 });`);
        p.run('drawCloneRespawnTicker(100, 200)');
        const text = p.ops.filter(o => o.op === 'fillText').map(o => o.args[0]).join(' | ');
        ok(/ANT SCOUT/.test(text), 'the ticker does not name the clone: ' + text);
        ok(/15s/.test(text), 'the ticker does not count down in seconds: ' + text);
    });

    check('it ignores a FOLLOWER waiting to respawn', () => {
        const p = painter();
        p.run(`respawnQueue.push({ isClone: false, element: 'fire', timer: 100 });`);
        p.run('drawCloneRespawnTicker(100, 200)');
        same(p.ops.filter(o => o.op === 'fillText').length, 0,
             'the ticker listed an ordinary follower');
    });

    check('nothing is drawn when nothing is coming back', () => {
        const p = painter();
        p.run('drawCloneRespawnTicker(100, 200)');
        same(p.ops.length, 0, 'the ticker drew with an empty queue');
    });

    check('the soonest is listed first', () => {
        const p = painter();
        p.run(`respawnQueue.push({ isClone: true, speciesName: 'moth', className: 'tank',
                                   timer: 1500, totalTimer: 1800 });
               respawnQueue.push({ isClone: true, speciesName: 'ant', className: 'scout',
                                   timer: 120, totalTimer: 1800 });`);
        p.run('drawCloneRespawnTicker(100, 200)');
        const text = p.ops.filter(o => o.op === 'fillText').map(o => o.args[0]);
        ok(/ANT/.test(text[0]), 'the soonest is not first: ' + text.join(' | '));
    });

    check('it is wired to the Crystal, not floating in the HUD', () => {
        const GAME = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
        // Bounded by the BRANCH, not by a character count. The crystal branch
        // is a hundred and thirty lines of gem, halo and light-pool drawing, so
        // a fixed window put the call outside it and failed on correct code —
        // the same trap as every other fixed-size source slice in this suite.
        const at   = GAME.indexOf("obj.type==='crystal'");
        ok(at > -1, 'the crystal draw branch could not be found');
        const next = GAME.indexOf("else if (obj.type===", at + 10);
        const body = GAME.slice(at, next === -1 ? undefined : next);
        ok(body.length > 500, 'the crystal branch could not be measured');
        ok(/drawCloneRespawnTicker\(/.test(body), 'the ticker is not drawn with the Crystal');
    });

    // ─────────────────────────────────────────────────────
    group('the index says so');

    check('the clone page is generated from the table', () => {
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        // The hand-written table said "1 follower / +1 follower" and would have
        // gone on saying it.
        ok(/id="cmCloneCosts"/.test(HTML), 'the index has no host for the generated table');
        ok(!/>1 follower</.test(HTML), 'the hardcoded follower table is still there');
        ok(/renderCloneCostIndex/.test(SRC.codex), 'codex.js does not build the clone page');
        ok(/cloneShardCost\(/.test(SRC.codex), 'the page does not read the price from the function');
        // And the boot actually CALLS it. The check below renders the page by
        // hand, so it would pass with the page left blank in the real game —
        // which is exactly what happened when a stray git checkout dropped
        // this line, and nothing noticed.
        const INIT = fs.readFileSync(path.join(ROOT, 'js/init.js'), 'utf8');
        ok(/renderCloneCostIndex\(\);/.test(INIT), 'init.js never builds the clone page');
    });

    check('the rendered page really does reach the host element', () => {
        // The builder finds its host by id, and the id in game.html has to be
        // the one it looks for. Stubbing getElementById to always answer would
        // hide a mismatch, so this one lets the real lookup run against a stub
        // document that only knows the correct id.
        const r = C.run(`(function(){
            let html = '';
            const el = { set innerHTML(v) { html = v; }, get innerHTML() { return html; } };
            const realGet = document.getElementById;
            document.getElementById = id => (id === 'cmCloneCosts' ? el : null);
            renderCloneCostIndex();
            document.getElementById = realGet;
            return html;
        })()`);
        ok(r.length > 200, 'the builder did not find #cmCloneCosts — the id does not match');
    });

    check('and it states the range and the no-followers rule', () => {
        // Rendered, not grepped: the numbers have to come out of the table.
        const r = C.run(`(function(){
            let html = '';
            const el = { set innerHTML(v) { html = v; }, get innerHTML() { return html; } };
            const realGet = document.getElementById;
            document.getElementById = () => el;
            renderCloneCostIndex();
            document.getElementById = realGet;
            return html;
        })()`);
        ok(r.length > 200, 'the page rendered nothing: ' + r);
        ok(/no followers/i.test(r), 'the page does not say it costs no followers');
        ok(r.includes(String(LO)) && r.includes(String(HI)),
           'the page does not state the ' + LO + '..' + HI + ' range');
        // A real price out of the table, so the page cannot be stating numbers
        // it invented.
        const antTank = C.run(`cloneShardCost('ant','tank')`);
        ok(r.includes(String(antTank)), 'the ant tank price ' + antTank + ' is not on the page');
        ok(/splices/.test(r), 'the page does not mention the DNA splices');
        const HTML2 = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(new RegExp(MUL.CLONE_HEALTH_MULT + '&times; the health').test(HTML2),
           'the index does not state the health multiplier');
        ok(/green health bar/i.test(HTML2), 'nor that an ally bar is green');
        ok(new RegExp(Math.round(MUL.CLONE_RESPAWN_FRAMES / 60) + ' seconds').test(HTML2),
           'nor the respawn wait');
        // Synthetic constructs are not offered, so listing them would be a lie.
        ok(!/QX-z1/.test(r), 'the page lists a species you cannot clone');
    });

    group('THE CLONE BAY LIVES ON THE HUD');

    // "Make the clone menu only appear on the HUD — the button should be on the
    // HUD and look like a little rotating 3D DNA icon."
    check('the Crystal panel no longer has a clone tab', () => {
        const ids = C.run('CTABS.map(t => t.id)');
        ok(!ids.includes('clones'), 'the Crystal still has a CLONES tab: ' + ids);
        ok(!/case "clones":/.test(SRC.clone), 'the Crystal panel still draws the clone bay');
        ok(C.run('crystalMenuTab') !== 'clones', 'the Crystal still opens on the clone bay');
    });
    check('the DNA button on the HUD opens (and closes) the clone bay', () => {
        const INPUT = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
        ok(/Math\.hypot\(upX-b\.x, upY-b\.y\)<b\.r\+8\) \{\s*cloneMenuOpen=!cloneMenuOpen; crystalMenuOpen=false;/.test(INPUT),
           'the HUD button does not toggle the clone bay');
    });
    check('the button is a turning helix: it draws two strands and they move', () => {
        const xs = C.run(`(function(){
            const pts = []; const keep = ctx.arc;
            ctx.arc = (x, y, r) => { pts.push(Math.round(x * 10) / 10); };
            try { frame = 100; drawClonesBlob(); const a = pts.slice(); pts.length = 0;
                  frame = 130; drawClonesBlob(); return [a, pts.slice()]; }
            finally { ctx.arc = keep; } })()`);
        ok(xs[0].length >= 20, 'too few beads for a double helix: ' + xs[0].length);
        ok(JSON.stringify(xs[0]) !== JSON.stringify(xs[1]), 'the helix does not turn');
    });
    check('a badge counts the clones you could summon right now', () => {
        const r = C.run(`(function(){
            actors.length = 0; shardCount = 9999;
            const inv = {}; for (const c of ['scout','striker','tank']) inv['ant_' + c] = 99; setDNA(inv);
            frame = 300; _BLOB.ready = undefined;
            const said = []; const keep = ctx.fillText;
            ctx.fillText = (t) => said.push(String(t));
            try { drawClonesBlob(); } finally { ctx.fillText = keep; }
            return { ready: _BLOB.ready, said };
        })()`);
        same(r.ready, 3, 'the count is wrong');
        ok(r.said.includes('3'), 'the badge does not show it: ' + r.said);
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
