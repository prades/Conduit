// THE PLAYER'S ULTIMATE, and what a pylon costs.
//
// Two asks, and they share a theme: a price that was spelled out in eight
// places, and a new number that must not become the ninth.
//
// PYLON COST. "Too much to build" was really two costs — 10 in the slow build
// path, 40 in the instant one — with the radial gate and the element picker each
// holding their own copy of 40. Since the gate demanded 40 before the picker
// would even open, the effective price was always 40 and the 10-shard path was
// unreachable. It is now one constant at 10.
//
// THE ULTIMATE BAR. One bar, the character's own, filled by killing and spent on
// an army-wide surge. It is deliberately NOT the same system as
// FOLLOWER_ULTIMATES, which are per-follower and fire on a double-tap; those
// keep working, and the surge charges all of them at once.
//
// The load-bearing parts are the boundaries: it must not charge while it is
// running (or a surge pays for the next one and the bar stops reading as a
// cost), it must lift the ARMY and not the player, and it must never come back
// from a refresh reading as charged when it was not.
//
// NOTE ON SHAPE: every context is booted at the top, before the checks. check()
// is synchronous and does not await its callback, so an `await` inside one is a
// syntax error at best and — for an async callback — a check that passes
// unconditionally because nothing ever inspects the promise. I wrote both of
// those mistakes in the first draft of this file.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');

const SRC = {
    config:   fs.readFileSync(path.join(ROOT, 'js/config.js'),   'utf8'),
    commands: fs.readFileSync(path.join(ROOT, 'js/commands.js'), 'utf8'),
    ui:       fs.readFileSync(path.join(ROOT, 'js/ui.js'),       'utf8'),
    helpers:  fs.readFileSync(path.join(ROOT, 'js/helpers.js'),  'utf8'),
    game:     fs.readFileSync(path.join(ROOT, 'js/game.js'),     'utf8'),
    save:     fs.readFileSync(path.join(ROOT, 'js/save.js'),     'utf8'),
    waves:    fs.readFileSync(path.join(ROOT, 'js/waves.js'),    'utf8'),
    elements: fs.readFileSync(path.join(ROOT, 'js/elements.js'), 'utf8'),
    html:     fs.readFileSync(path.join(ROOT, 'game.html'),      'utf8'),
};

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }
function near(a, b, tol, m) {
    if (Math.abs(a - b) > tol) throw new Error(`${m}: expected ~${b} (±${tol}), got ${a}`);
}

// The whole page. The bar spans config, helpers, game, save, waves and the HUD
// markup, so a hand-built sandbox would only prove the piece it was built for.
async function boot(store) {
    const sandbox = makeBrowserSandbox(store || {});
    const ctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is noisy under stubs */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    return {
        sandbox, run, store: store || {},
        // A squad standing at the origin, hurt and out of WILL, so a surge has
        // something visible to do.
        squad(n) {
            run('actors = []; followers = [];');
            for (let i = 0; i < n; i++) {
                run(`(function(){
                    const f = { x: ${i * 0.1}, y: 0, type: "virus", team: "green",
                                isFollower: true, dead: false, element: "fire",
                                health: 10, maxHealth: 40, power: 10,
                                stats: { hp: 40, attack: 10, specialAttack: 10, will: 20 },
                                currentWill: 0, ultimateCharge: 0, moveSpeed: 0.02 };
                    actors.push(f); followers.push(f);
                })()`);
            }
            return run('followers.map(f => ({ h: f.health, w: f.currentWill, u: f.ultimateCharge }))');
        },
        // A red punchbag with plenty of health, so damage is measurable.
        target(name) {
            run(`(function(){
                globalThis.${name} = { x: 0, y: 0, team: "red", dead: false,
                                       health: 1000, maxHealth: 1000 };
                actors.push(${name});
            })()`);
        },
        hit(name, amount, sourceExpr) {
            run(`${name}.health = 1000; applyDamage(${name}, ${amount}, ${sourceExpr});`);
            return 1000 - run(`${name}.health`);
        },
        fill() { run('playerUltimate = PLAYER_ULT_MAX;'); },
    };
}

(async () => {
    // Every context, up front — see the note on shape above.
    const E  = await boot();   // general state reads
    const B  = await boot();   // driving builds
    const S  = await boot();   // one full surge, start to finish
    const G1 = await boot();   // charging mid-surge
    const G2 = await boot();   // an unfilled bar
    const G3 = await boot();   // firing twice
    const G4 = await boot();   // no army at all
    const D1 = await boot();   // the damage multiplier
    const D2 = await boot();   // player and hazards excluded
    const D3 = await boot();   // the enemy excluded
    const H1 = await boot();   // the bar is written
    const H2 = await boot();   // labels
    // Persistence: write with one context, read back with another.
    const RT = {};
    const RTa = await boot(RT);
    RTa.run('playerUltimate = 42; saveSession();');
    const RTb = await boot(RT);
    const clamped = [];
    for (const [saved, expect] of [[9999, 100], [-5, 0], ['lots', 0]]) {
        const C = await boot({ tubecrawler_session: JSON.stringify({ ult: saved }) });
        clamped.push([saved, expect, C.run('playerUltimate')]);
    }

    // ─────────────────────────────────────────────────────
    group('THE ASK: a pylon costs 10');

    check('the cost is 10', () => {
        same(E.run('PYLON_BUILD_COST'), 10, 'a pylon should cost 10 shards');
    });

    check('no site holds its own copy of the price', () => {
        // Eight literals for one price is how "too expensive" gets fixed in one
        // place and left alone in seven.
        for (const [name, src] of [['commands.js', SRC.commands], ['ui.js', SRC.ui]]) {
            ok(!/\b40 shards\b/.test(src), name + ' still names a price of its own');
            ok(!/shardCount\s*[<>]=?\s*\d/.test(src), name + ' still compares shards to a literal');
            ok(!/shardCount\s*[-+]=\s*\d/.test(src), name + ' still adds or deducts a literal');
        }
        ok(/PYLON_BUILD_COST/.test(SRC.commands), 'commands.js does not read the constant');
        ok(/PYLON_BUILD_COST/.test(SRC.ui), 'ui.js does not read the constant');
    });

    check('the instant build deducts exactly the cost', () => {
        // Driven, not read: the deduction is what the player feels.
        B.run('shardCount = 50; gameState.running = true; buildMode = false;');
        const before = B.run('shardCount');
        B.run(`(function(){
            const t = world.find(p => !p.pillar && !p.nest && !p.nodeType && p.y >= 1 && p.y <= 2);
            _executeBuildInstant(ELEMENTS.find(e => e.id === "fire"), t);
        })()`);
        same(before - B.run('shardCount'), 10, 'the instant build should cost the constant');
    });

    check('the slow build path costs the same', () => {
        B.run('shardCount = 50;');
        const before = B.run('shardCount');
        B.run(`(function(){
            const t = world.find(p => !p.pillar && !p.nest && !p.nodeType && p.y >= 2 && p.y <= 3);
            _executeBuild(ELEMENTS.find(e => e.id === "fire"), t);
        })()`);
        same(before - B.run('shardCount'), 10, 'the two paths should not disagree on price');
    });

    check('10 shards is enough to open the picker', () => {
        // The radial gate demanded 40 before the element picker would appear,
        // which is what made the cheaper path unreachable.
        const at = SRC.commands.indexOf('case "build_upgrade"');
        const body = SRC.commands.slice(at, SRC.commands.indexOf('break;', at));
        ok(/shardCount >= PYLON_BUILD_COST/.test(body), 'the radial gate has its own price');
    });

    check('an aborted build refunds what it took', () => {
        const at = SRC.commands.indexOf('No available followers');
        const body = SRC.commands.slice(at - 300, at + 300);
        ok(/shardCount \+= PYLON_BUILD_COST/.test(body), 'the refund does not match the cost');
    });

    // ─────────────────────────────────────────────────────
    group('THE ASK: the character has an ultimate bar');

    check('it exists, starts empty, and has a ceiling', () => {
        same(E.run('playerUltimate'), 0, 'the bar should start empty');
        ok(E.run('PLAYER_ULT_MAX') > 0, 'no ceiling');
        same(E.run('playerUltimateReady()'), false, 'an empty bar is not ready');
    });

    check('it is ONE bar, and the per-follower ultimates are untouched', () => {
        ok(/let playerUltimate/.test(SRC.config), 'the bar is not player state');
        same(E.run('typeof FOLLOWER_ULTIMATES'), 'object', 'the per-follower ultimates are gone');
        ok(/ultimateCharge/.test(SRC.elements), 'the per-follower charge was removed');
    });

    check('killing charges it', () => {
        E.run('playerUltimate = 0; armySurgeTimer = 0;');
        same(E.run('chargePlayerUltimate(PLAYER_ULT_PER_KILL)'), true, 'a kill should charge it');
        same(E.run('playerUltimate'), E.run('PLAYER_ULT_PER_KILL'), 'by the per-kill amount');
    });

    check('it is the kill that charges it, in the running game', () => {
        // Wired on the same guard progression uses, so every enemy counts once.
        const at = SRC.game.indexOf('a.progressCounted = true;');
        const body = SRC.game.slice(at, at + 200);
        ok(/chargePlayerUltimate\(PLAYER_ULT_PER_KILL\)/.test(body),
           'a kill does not charge the bar');
        same((SRC.game.match(/chargePlayerUltimate\(/g) || []).length, 1,
             'it should be charged from exactly one place');
    });

    check('it fills, stops, and announces itself once', () => {
        E.run('playerUltimate = 0; armySurgeTimer = 0; floatingTexts = [];');
        E.run('for (let i = 0; i < 200; i++) chargePlayerUltimate(PLAYER_ULT_PER_KILL);');
        same(E.run('playerUltimate'), E.run('PLAYER_ULT_MAX'), 'it should cap at the ceiling');
        same(E.run('playerUltimateReady()'), true, 'and read as ready');
        same(E.run('floatingTexts.filter(t => /ULTIMATE READY/.test(t.text)).length'), 1,
             'the announcement should fire once, not on every kill after it fills');
    });

    check('a full bar takes no more charge', () => {
        E.fill();
        same(E.run('chargePlayerUltimate(50)'), false, 'a full bar should refuse');
        same(E.run('playerUltimate'), E.run('PLAYER_ULT_MAX'), 'and not overflow');
    });

    // ─────────────────────────────────────────────────────
    group('spending it powers up the entire army');

    const squadBefore = S.squad(4);
    S.fill();
    S.run('floatingTexts = [];');
    const fired = S.run('fireArmySurge()');

    check('THE ASK: a full bar fires and lifts every unit', () => {
        same(fired, true, 'a full bar should fire');
        ok(squadBefore.every(f => f.h < 40 && f.w === 0 && f.u === 0),
           'fixture: the squad should start hurt, spent and uncharged');
        const after = S.run('followers.map(f => ({h: f.health, mh: f.maxHealth, w: f.currentWill, u: f.ultimateCharge}))');
        same(after.length, 4, 'fixture: four followers');
        for (const f of after) {
            same(f.h, f.mh, 'every unit should be healed');
            same(f.w, 20, 'and its WILL refilled');
            same(f.u, 100, 'and its own ultimate charged');
        }
        ok(S.run('floatingTexts.some(t => /ARMY SURGE/.test(t.text))'), 'no callout');
    });

    check('it spends the bar', () => {
        same(S.run('playerUltimate'), 0, 'the bar should be empty after firing');
        same(S.run('playerUltimateReady()'), false, 'and not still read as ready');
    });

    check('it runs for a while, then ends', () => {
        same(S.run('armySurgeActive()'), true, 'the surge should be running');
        const frames = S.run('ARMY_SURGE_FRAMES');
        S.run(`for (let i = 0; i < ${frames - 1}; i++) tickArmySurge();`);
        same(S.run('armySurgeActive()'), true, 'it should still be running one frame short');
        S.run('floatingTexts = []; tickArmySurge();');
        same(S.run('armySurgeActive()'), false, 'and be over on the last frame');
        ok(S.run('floatingTexts.some(t => /SURGE SPENT/.test(t.text))'), 'it should say when it ends');
    });

    check('THE GUARD: it does not charge while it is running', () => {
        // A surge that pays for the next one stops reading as a cost.
        G1.squad(2); G1.fill();
        G1.run('fireArmySurge();');
        same(G1.run('chargePlayerUltimate(100)'), false, 'charging mid-surge should be refused');
        same(G1.run('playerUltimate'), 0, 'and the bar should stay empty');
    });

    check('an unfilled bar does not fire', () => {
        G2.squad(2);
        G2.run('playerUltimate = PLAYER_ULT_MAX - 1; floatingTexts = [];');
        same(G2.run('fireArmySurge()'), false, 'it should refuse');
        same(G2.run('armySurgeActive()'), false, 'and not start a surge');
        same(G2.run('playerUltimate'), G2.run('PLAYER_ULT_MAX - 1'), 'nor spend the bar');
        ok(G2.run('floatingTexts.some(t => /ULTIMATE/.test(t.text))'),
           'it should say how far along it is');
    });

    check('firing twice does not stack', () => {
        G3.squad(2); G3.fill();
        G3.run('fireArmySurge();');
        const left = G3.run('armySurgeTimer');
        G3.fill();                                  // as if it had recharged
        same(G3.run('fireArmySurge()'), false, 'a second firing should be refused');
        same(G3.run('armySurgeTimer'), left, 'and the timer should not be extended');
        same(G3.run('playerUltimate'), G3.run('PLAYER_ULT_MAX'), 'nor the bar spent again');
    });

    check('it fires with no army at all without throwing', () => {
        G4.run('actors = []; followers = []; floatingTexts = [];');
        G4.fill();
        same(G4.run('fireArmySurge()'), true, 'it should still fire');
        ok(G4.run('floatingTexts.some(t => /0 UNITS/.test(t.text))'), 'and report an empty army');
    });

    // ─────────────────────────────────────────────────────
    group('the surge actually makes the army hit harder');

    check('THE LEVER: army damage is multiplied while it runs', () => {
        D1.squad(1);
        D1.target('_tgt');
        const plain = D1.hit('_tgt', 100, 'followers[0]');
        D1.fill(); D1.run('fireArmySurge();');
        const surged = D1.hit('_tgt', 100, 'followers[0]');
        ok(surged > plain, `surged damage ${surged} should beat ${plain}`);
        near(surged / plain, D1.run('ARMY_SURGE_POWER'), 0.01, 'the multiplier should be the constant');
    });

    check('it covers element attacks too, not just the melee swing', () => {
        // The twelve damage expressions in elements.js all funnel through
        // applyDamage, which is why the multiplier lives there rather than at
        // each attack — patching them one by one would have missed some.
        const at = SRC.helpers.indexOf('function applyDamage');
        const body = SRC.helpers.slice(at, at + 1800);
        ok(/ARMY_SURGE_POWER/.test(body), 'the multiplier is not in the damage funnel');
        ok(/applyDamage\(target, amount \* mult, source, element\)/.test(SRC.helpers),
           'applyElementalDamage no longer funnels into applyDamage');
    });

    check('it lifts the army, NOT the player or a hazard', () => {
        // The bar is what the player spends; their own shots are not the reward.
        D2.squad(1);
        D2.target('_tgt2');
        D2.fill(); D2.run('fireArmySurge();');
        same(D2.hit('_tgt2', 100, 'null'), 100, 'a sourceless hazard hit should be untouched');
        same(D2.hit('_tgt2', 100, '{ team: "green" }'), 100,
             'a green non-unit should not be lifted either');
    });

    check('it does not lift the enemy', () => {
        D3.squad(1);
        D3.fill(); D3.run('fireArmySurge();');
        D3.run(`(function(){
            globalThis._me = { x: 0, y: 0, team: "green", isFollower: true, dead: false,
                               health: 1000, maxHealth: 1000 };
            actors.push(_me);
            applyDamage(_me, 100, { team: "red", isFollower: false });
        })()`);
        same(D3.run('1000 - _me.health'), 100, 'a red attacker should not get the surge');
    });

    // ─────────────────────────────────────────────────────
    group('the bar on the HUD');

    check('THE ASK: there is a bar, under the health bar', () => {
        ok(/id="ultWrap"/.test(SRC.html), 'no ultimate bar in the HUD');
        ok(/id="ult"/.test(SRC.html), 'the bar has no fill element');
        // Below the health bar: #ui sits at top 20 with height 28.
        const m = SRC.html.match(/#ultWrap\s*\{[^}]*top:\s*(\d+)px/);
        ok(!!m, 'the bar is not positioned');
        ok(Number(m[1]) >= 48, 'it should sit below the health bar, got top ' + m[1]);
    });

    check('tapping it fires the ultimate', () => {
        ok(/id="ultWrap"[^>]*onclick="fireArmySurge\(\)"/.test(SRC.html),
           'the bar is not wired to fire');
    });

    check('the bar moves as it fills', () => {
        H1.run('gameState.running = true; playerUltimate = 0; armySurgeTimer = 0; _lastUltInt = -1;');
        H1.run('render();');
        const empty = H1.run('ultBar.style.width');
        H1.run('playerUltimate = PLAYER_ULT_MAX / 2; render();');
        const half = H1.run('ultBar.style.width');
        ok(empty !== half, `the bar did not move: ${empty} then ${half}`);
        ok(/^50/.test(half), 'a half-full bar should read 50%, got ' + half);
    });

    check('a full bar invites a tap, and a running surge counts down', () => {
        H2.squad(1);
        H2.run('gameState.running = true; playerUltimate = PLAYER_ULT_MAX; _lastUltInt = -1; render();');
        const ready = H2.run('ultLabel.textContent');
        ok(/TAP/.test(ready), 'a ready bar should invite a tap, got ' + ready);
        H2.run('fireArmySurge(); _lastUltInt = -1; render();');
        const surging = H2.run('ultLabel.textContent');
        ok(/SURGE/.test(surging), 'a running surge should be labelled, got ' + surging);
    });

    check('the surge is ticked by the render loop, once', () => {
        ok(/tickArmySurge\(\)/.test(SRC.game), 'the surge is never ticked');
        same((SRC.game.match(/tickArmySurge\(\)/g) || []).length, 1,
             'ticking twice a frame would halve the duration');
    });

    // ─────────────────────────────────────────────────────
    group('it survives a refresh, and a reset clears it');

    check('the bar round-trips through the session', () => {
        ok(!!RT.tubecrawler_session, 'the session was not written');
        same(JSON.parse(RT.tubecrawler_session).ult, 42, 'the bar is not in the snapshot');
        same(RTb.run('playerUltimate'), 42, 'the bar should come back where it was');
    });

    check('a junk or over-full saved value is clamped', () => {
        for (const [saved, expect, got] of clamped) {
            same(got, expect, `a saved ${JSON.stringify(saved)} should clamp to ${expect}`);
        }
    });

    check('the surge timer is deliberately NOT saved', () => {
        // A ten-second buff resuming hours later is a stranger outcome than
        // letting it lapse.
        ok(!/armySurgeTimer/.test(SRC.save), 'the surge timer is being persisted');
        ok(/ult: Math.round\(playerUltimate\)/.test(SRC.save), 'the bar itself is not persisted');
    });

    check('the GAME INDEX documents it', () => {
        ok(/ARMY SURGE/.test(SRC.html), 'the index does not describe the ultimate');
        ok(/bar under your health/i.test(SRC.html), 'it does not say where the bar is');
        ok(/will not charge while a surge is running/i.test(SRC.html),
           'it does not state the one rule a player could otherwise not infer');
    });

    check('a reset clears the bar and any running surge', () => {
        ok(/playerUltimate=0; armySurgeTimer=0;/.test(SRC.waves),
           'restartGame leaves the ultimate where it was');
        ok(/_lastUltInt=-1/.test(SRC.waves),
           'the HUD cache would keep the old reading after a reset');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
