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
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');

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
        // Both menus, and both greyed when unaffordable so the number explains
        // the missing CLONE button.
        same((SRC.clone.match(/shardCount >= opt\.shardCost/g) || []).length, 2,
             'both clone menus should grey the price when you cannot afford it');
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
        crystalMenuOpen = true; crystalMenuTab = 'clones';
        crystalCloneSort = 'species'; _crystalScrollY = 0;
        drawCrystalPanel();
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
            handleCrystalPanelInput(o._nbx + o._nbw/2, o._nby + o._nbh/2, true);
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
            handleCrystalPanelInput(db.x + db.w/2, db.y + db.h/2, true);
            drawCrystalPanel();
        `);
        same(r.clones, 3, 'one clone should have been dismissed');
        same(r.ready, 3, 'and the rows should be ready again');
        ok(r.buyable > 0, 'with a pressable CLONE button');
    });

    check('and then the purchase actually goes through', () => {
        const r = menu(4, `
            const db = window._cloneDismissBtn;
            crystalMenuOpen = true;
            handleCrystalPanelInput(db.x + db.w/2, db.y + db.h/2, true);
            drawCrystalPanel();
            const o = (window._cloneTabOpts||[]).find(x => typeof x._bx === 'number');
            crystalMenuOpen = true;
            handleCrystalPanelInput(o._bx + o._bw/2, o._by + o._bh/2, true);
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
            crystalMenuOpen = true; crystalMenuTab = 'clones';
            const bad = [];
            for (const sort of CSORTS.map(s => s.id)) {
                for (const scroll of [0, 60, 200, 600, 2000]) {
                    crystalCloneSort = sort; _crystalScrollY = scroll;
                    drawCrystalPanel();
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
        // Synthetic constructs are not offered, so listing them would be a lie.
        ok(!/QX-z1/.test(r), 'the page lists a species you cannot clone');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
