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
// THE ULTIMATE BAR. One bar, the character's own, SIPHONED from the squad and
// spent on an army-wide surge. Each follower sends a wisp of static to the
// player every SIPHON_INTERVAL frames and the charge lands when the wisp
// arrives, so the trickle on screen is the transfer rather than decoration over
// a counter — and the player can switch the draw off. It is deliberately NOT
// the same system as
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
        // `at` places the squad relative to the player. It defaults to right on
        // top of them because most checks are not about range — but it has to
        // be explicit, or a range gate can be added and every check still
        // passes by accident, which is exactly what happened.
        squad(n, at) {
            const off = at === undefined ? 0 : at;
            run(`player.x = 0; player.y = 0; player.visualX = 0; player.visualY = 0;`);
            run('actors = []; followers = [];');
            for (let i = 0; i < n; i++) {
                run(`(function(){
                    const f = { x: ${off + i * 0.1}, y: 0, type: "virus", team: "green",
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
    const P1 = await boot();   // one wisp, launch to landing
    const P2 = await boot();   // rate with one follower
    const P3 = await boot();   // rate with six
    const P4 = await boot();   // no squad at all
    const P5 = await boot();   // a full bar
    const P6 = await boot();   // mid-surge
    const P7 = await boot();   // the switch
    const P8 = await boot();   // a wisp in flight when it is switched off
    const P9 = await boot();   // launch versus arrival, with no squad to interfere
    const PR = await boot();   // the rate against the arithmetic
    const R1 = await boot();   // out of range
    const R2 = await boot();   // just inside
    const R3 = await boot();   // walking away and back
    const R4 = await boot();   // no accrual in absentia
    const R5 = await boot();   // the surge is not range-gated
    const R6 = await boot();   // the stalled caption
    // Persistence: write with one context, read back with another.
    const RT = {};
    const RTa = await boot(RT);
    RTa.run('playerUltimate = 42; saveSession();');
    const RTb = await boot(RT);
    // The switch, written by one context and read back by another.
    const SIPH = {};
    const SIPHa = await boot(SIPH);
    SIPHa.run('siphonEnabled = false; saveSession();');
    const SIPHb = await boot(SIPH);
    const SIPHjunk = await boot({ tubecrawler_session: JSON.stringify({ siphon: 'off' }) });
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

    check('THE ASK: the squad is what charges it, not kills', () => {
        ok(!/chargePlayerUltimate/.test(SRC.game),
           'game.js still charges the bar directly — the siphon should be the only source');
        const at = SRC.game.indexOf('a.progressCounted = true;');
        const body = SRC.game.slice(at, at + 200);
        ok(!/chargePlayerUltimate/.test(body), 'a kill still charges the bar');
        ok(/siphonTick\(\)/.test(SRC.game), 'the siphon is never ticked');
        same((SRC.game.match(/siphonTick\(\)/g) || []).length, 1,
             'ticking twice a frame would double the rate');
    });

    check('it fills, stops, and announces itself once', () => {
        E.run('playerUltimate = 0; armySurgeTimer = 0; floatingTexts = [];');
        E.run('for (let i = 0; i < 400; i++) chargePlayerUltimate(SIPHON_PER_WISP);');
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
    group('THE ASK: it is siphoned off the followers');

    check('a follower sends a wisp', () => {
        P1.squad(1);
        P1.run('playerUltimate = 0; armySurgeTimer = 0; siphonEnabled = true; siphonWisps = [];');
        // Emission is randomly phased, so a full interval guarantees one.
        const emitted = P1.run(`(function(){
            let seen = 0;
            for (let i = 0; i < SIPHON_INTERVAL + 2; i++) { siphonTick(); seen += siphonWisps.length; }
            return seen;
        })()`);
        ok(emitted > 0, 'a follower should have sent something within one interval');
    });

    check('THE ASK: it is the WISP that pays, not the launch', () => {
        // With no followers nothing can be emitted, so the only wisp in play is
        // the one placed by hand — which is what makes this able to tell launch
        // from arrival. Driving it with a live squad cannot: emissions during
        // the flight would mask it, which is how the first version of this
        // check passed with the charge moved to the launch.
        P9.run(`actors = []; followers = [];
                playerUltimate = 0; armySurgeTimer = 0; siphonEnabled = true;
                siphonWisps = [{ ax: 5, ay: 5, t: 0, seed: 1 }];`);
        const early = P9.run(`(function(){
            const seen = [];
            for (let i = 0; i < SIPHON_TRAVEL - 1; i++) { siphonTick(); seen.push(playerUltimate); }
            return seen;
        })()`);
        ok(early.every(v => v === 0),
           'charge landed before the wisp did: ' + JSON.stringify(early.filter(v => v !== 0)));
        P9.run('siphonTick(); siphonTick();');
        ok(P9.run('playerUltimate') > 0, 'charge should land when the wisp arrives');
        same(P9.run('siphonWisps.length'), 0, 'and the wisp should be spent');
    });

    check('the rate matches the arithmetic, so nothing pays twice', () => {
        // Charging at BOTH launch and arrival looks almost identical on screen
        // and doubles the fill rate, which no other check here can see. So the
        // rate is compared against what the constants say it should be:
        //   followers x (frames - travel) / interval x per-wisp
        const N = 6, T = 1200;
        PR.squad(N);
        PR.run('playerUltimate = 0; armySurgeTimer = 0; siphonEnabled = true; siphonWisps = [];');
        PR.run(`for (let i = 0; i < ${T}; i++) siphonTick();`);
        const got = PR.run('playerUltimate');
        const per = PR.run('SIPHON_PER_WISP');
        const iv  = PR.run('SIPHON_INTERVAL');
        const tr  = PR.run('SIPHON_TRAVEL');
        const expected = N * ((T - tr) / iv) * per;
        ok(got > expected * 0.7 && got < expected * 1.3,
           `expected about ${expected.toFixed(1)} after ${T} frames, got ${got.toFixed(1)}`);
    });

    check('the rate scales with the size of the squad', () => {
        // "Siphoned from the followers" means more of them is faster. This is
        // the whole shape of the mechanic, so it is measured rather than assumed.
        const charge = (env, n) => {
            env.squad(n);
            env.run('playerUltimate = 0; armySurgeTimer = 0; siphonEnabled = true; siphonWisps = [];');
            env.run(`for (let i = 0; i < ${600}; i++) siphonTick();`);
            return env.run('playerUltimate');
        };
        const one  = charge(P2, 1);
        const six  = charge(P3, 6);
        ok(six > one * 3, `six followers (${six.toFixed(1)}) should far outpace one (${one.toFixed(1)})`);
    });

    check('with no followers it does not fill at all', () => {
        // The consequence of siphoning: an empty squad means an empty bar.
        P4.run('actors = []; followers = []; playerUltimate = 0; siphonWisps = []; siphonEnabled = true;');
        P4.run('for (let i = 0; i < 600; i++) siphonTick();');
        same(P4.run('playerUltimate'), 0, 'nothing to siphon from, nothing to show');
        same(P4.run('siphonWisps.length'), 0, 'and no wisps from nowhere');
    });

    check('a full bar stops drawing', () => {
        P5.squad(4);
        P5.run('playerUltimate = PLAYER_ULT_MAX; armySurgeTimer = 0; siphonEnabled = true; siphonWisps = [];');
        P5.run('for (let i = 0; i < 400; i++) siphonTick();');
        same(P5.run('siphonWisps.length'), 0, 'a full bar should not keep pulling on the squad');
    });

    check('no wisp is sent during a surge', () => {
        // Checked at EVERY tick, not once at the end. A wisp lives 34 frames,
        // so a single snapshot after 400 ticks can read empty by luck — which
        // is exactly how the first version of this check passed with the guard
        // taken out. Note the bar is protected twice over: chargePlayerUltimate
        // also refuses mid-surge, so the guard here is specifically about not
        // drawing on the squad, and it has to be tested as that.
        P6.squad(4);
        P6.fill();
        P6.run('fireArmySurge(); siphonWisps = [];');
        const everSeen = P6.run(`(function(){
            let seen = 0;
            for (let i = 0; i < 400; i++) { siphonTick(); seen += siphonWisps.length; }
            return seen;
        })()`);
        same(everSeen, 0, 'a surge should not draw on the squad at all');
        same(P6.run('playerUltimate'), 0, 'nor charge the bar');
    });

    // ─────────────────────────────────────────────────────
    group('THE ASK: only followers near me');

    check('a follower out of range contributes nothing', () => {
        const far = R1.run('SIPHON_RANGE') + 3;
        R1.squad(6, far);
        R1.run('playerUltimate = 0; armySurgeTimer = 0; siphonEnabled = true; siphonWisps = [];');
        const everSeen = R1.run(`(function(){
            let seen = 0;
            for (let i = 0; i < 900; i++) { siphonTick(); seen += siphonWisps.length; }
            return seen;
        })()`);
        same(everSeen, 0, 'a squad that far away should send nothing');
        same(R1.run('playerUltimate'), 0, 'and the bar should not move');
        same(R1.run('_siphonInRange'), 0, 'nor count as reachable');
    });

    check('the same follower just inside the range does contribute', () => {
        // Paired with the check above so the range is shown to be the ONLY
        // difference: same squad size, same frames, one tile either side.
        const near = R2.run('SIPHON_RANGE') - 1;
        R2.squad(6, near);
        R2.run('playerUltimate = 0; armySurgeTimer = 0; siphonEnabled = true; siphonWisps = [];');
        R2.run('for (let i = 0; i < 900; i++) siphonTick();');
        ok(R2.run('playerUltimate') > 0, 'a squad in reach should be drawn from');
        same(R2.run('_siphonInRange'), 6, 'and all six should count');
    });

    check('walking away stalls it, coming back resumes', () => {
        R3.squad(4, 0);
        R3.run('playerUltimate = 0; armySurgeTimer = 0; siphonEnabled = true; siphonWisps = [];');
        R3.run('for (let i = 0; i < 400; i++) siphonTick();');
        const near = R3.run('playerUltimate');
        ok(near > 0, 'fixture: it should be filling while together');
        // Step well away without moving the squad.
        R3.run(`player.x = SIPHON_RANGE + 10; player.y = 0; siphonWisps = [];`);
        R3.run('for (let i = 0; i < 600; i++) siphonTick();');
        same(R3.run('playerUltimate'), near, 'nothing should accrue at a distance');
        // And back.
        R3.run('player.x = 0; player.y = 0;');
        R3.run('for (let i = 0; i < 400; i++) siphonTick();');
        ok(R3.run('playerUltimate') > near, 'the draw should resume on return');
    });

    check('nothing accrues in absentia — a returning squad waits its turn', () => {
        // The timer is skipped rather than ticked while out of range, so coming
        // back does not dump a backlog of wisps at once.
        R4.squad(1, 0);
        R4.run('playerUltimate = 0; armySurgeTimer = 0; siphonEnabled = true; siphonWisps = [];');
        R4.run('siphonTick();');                       // seed the timer
        const t0 = R4.run('followers[0]._siphonTimer');
        ok(Number.isFinite(t0), 'fixture: the timer should be set');
        R4.run(`player.x = SIPHON_RANGE + 10;`);
        R4.run('for (let i = 0; i < 500; i++) siphonTick();');
        same(R4.run('followers[0]._siphonTimer'), t0, 'the timer ticked down while away');
    });

    check('THE DISTINCTION: a surge still lifts the WHOLE army', () => {
        // The range gate is about the siphon. Spending the bar was asked to
        // power up the entire army, and that has not changed.
        const far = R5.run('SIPHON_RANGE') + 8;
        R5.squad(5, far);
        R5.fill();
        same(R5.run('siphonableUnits().length'), 0, 'fixture: none of them should be reachable');
        same(R5.run('fireArmySurge()'), true, 'the surge should still fire');
        const healed = R5.run('followers.filter(f => f.health === f.maxHealth).length');
        same(healed, 5, 'every unit should have been lifted, however far away');
    });

    check('one predicate decides what "near" means', () => {
        // Stating the rule twice — once in the tick, once for the UI — is how
        // the two come to disagree.
        ok(/function inSiphonRange/.test(SRC.helpers), 'there is no single range predicate');
        const at = SRC.helpers.indexOf('function siphonableUnits');
        const body = SRC.helpers.slice(at, at + 300);
        ok(/inSiphonRange/.test(body), 'siphonableUnits does not use the predicate');
        const tick = SRC.helpers.slice(SRC.helpers.indexOf('function siphonTick'), SRC.helpers.indexOf('function siphonTick') + 1800);
        ok(/inSiphonRange\(a\)/.test(tick), 'the tick does not use the predicate');
        // Squared, because it runs for every unit every frame.
        const pred = SRC.helpers.slice(SRC.helpers.indexOf('function inSiphonRange'), SRC.helpers.indexOf('function siphonableUnits'));
        ok(!/Math\.(hypot|sqrt)/.test(pred), 'the range test takes a square root on the hot path');
    });

    check('the range is a named constant, bounded at both ends', () => {
        // Bounded ABOVE as well as below, because the checks that place a squad
        // out of reach read the range from the code — so they move with it and
        // cannot notice it being widened until the gate means nothing. The two
        // bounds are what "near me" has to mean to be worth having.
        ok(/const SIPHON_RANGE/.test(SRC.config), 'the range is not named');
        const r = Number(SRC.config.match(/const SIPHON_RANGE\s*=\s*([\d.]+)/)[1]);
        const follow = Number(SRC.config.match(/const FOLLOW_STOP\s*=\s*([\d.]+)/)[1]);
        ok(r > 4.0, `a range of ${r} would exclude a sniper standing at 4.0`);
        ok(r > follow, `a range of ${r} would exclude a brawler at FOLLOW_STOP (${follow})`);
        // A camper anchors to a pylon and a worker walks off on chores; both can
        // be a long way off, and neither is "near me".
        ok(r < 14, `a range of ${r} reaches things that are not with you at all`);
    });

    check('the HUD explains a stalled bar', () => {
        const far = R6.run('SIPHON_RANGE') + 6;
        R6.squad(3, far);
        R6.run(`gameState.running = true; playerUltimate = 30; armySurgeTimer = 0;
                siphonEnabled = true; _lastUltInt = -1; _lastUltState = ""; render();`);
        const label = R6.run('ultLabel.textContent');
        ok(/NO SQUAD IN RANGE/.test(label), 'a stalled bar says nothing about why: ' + label);
        // And the caption must change the moment they come back into reach,
        // even though the percentage has not moved. Walk TO the squad — the
        // first version of this moved the player to the origin while the squad
        // stood far away, so they were still apart and it "stuck" correctly.
        R6.run(`player.x = ${far}; player.y = 0; render();`);
        const back = R6.run('ultLabel.textContent');
        ok(!/NO SQUAD IN RANGE/.test(back), 'the caption stuck after they came back: ' + back);
    });

    // ─────────────────────────────────────────────────────
    group('THE ASK: the player can turn it off');

    check('switching it off stops the wisps and the charge', () => {
        P7.squad(6);
        P7.run('playerUltimate = 0; armySurgeTimer = 0; siphonWisps = []; siphonEnabled = true;');
        same(P7.run('toggleSiphon()'), false, 'the toggle should report the new state');
        P7.run('for (let i = 0; i < 600; i++) siphonTick();');
        same(P7.run('siphonWisps.length'), 0, 'no wisps while it is off');
        same(P7.run('playerUltimate'), 0, 'and no charge');
        ok(P7.run('floatingTexts.some(t => /SIPHON OFF/.test(t.text))'), 'it should say so');
    });

    check('switching it back on resumes', () => {
        same(P7.run('toggleSiphon()'), true, 'it should flip back');
        P7.run(`for (let i = 0; i < 600; i++) siphonTick();`);
        ok(P7.run('playerUltimate') > 0, 'the draw should resume');
    });

    check('a wisp already in flight still lands when you switch off', () => {
        // It has been paid for. Dropping it mid-air would read as a glitch.
        P8.squad(1);
        // Through toggleSiphon(), not by assigning the flag: the first version
        // set siphonEnabled directly, so it could not see a toggle that threw
        // the wisps away.
        P8.run(`actors = []; followers = [];
                playerUltimate = 0; armySurgeTimer = 0; siphonEnabled = true;
                siphonWisps = [{ ax: 5, ay: 5, t: 0.5, seed: 7 }];
                toggleSiphon();`);
        same(P8.run('siphonEnabled'), false, 'fixture: the toggle should have switched it off');
        same(P8.run('siphonWisps.length'), 1, 'the wisp in flight was thrown away');
        P8.run(`for (let i = 0; i < ${P8.run('SIPHON_TRAVEL')}; i++) siphonTick();`);
        ok(P8.run('playerUltimate') > 0, 'the wisp in flight should still have paid out');
        same(P8.run('siphonWisps.length'), 0, 'and cleared');
    });

    check('the switch is on the bar and does NOT fire the ultimate', () => {
        ok(/id="siphonBtn"/.test(SRC.html), 'there is no switch in the HUD');
        ok(/onclick="event\.stopPropagation\(\);toggleSiphon\(\)"/.test(SRC.html),
           'a tap on the switch would fall through to the bar and fire the ultimate');
        // And it lives inside the bar, so it cannot drift away from it on a
        // resize. The element is written on one line, so the line is the scope
        // — slicing to the first </div> stops at the inner fill element.
        const at = SRC.html.indexOf('id="ultWrap"');
        const line = SRC.html.slice(at, SRC.html.indexOf('\n', at));
        ok(/siphonBtn/.test(line), 'the switch is not inside the bar');
        ok(line.indexOf('id="ult"') < line.indexOf('siphonBtn'),
           'the switch should come after the fill, or it draws under it');
    });

    check('the switch survives a refresh', () => {
        same(JSON.parse(SIPH.tubecrawler_session).siphon, false, 'the switch is not saved');
        same(SIPHb.run('siphonEnabled'), false, 'it should come back off');
    });

    check('a junk saved value leaves it on', () => {
        // On is what a player who has never touched it expects.
        same(SIPHjunk.run('siphonEnabled'), true, 'a non-boolean should not switch it off');
    });

    check('a reset turns it back on and clears the air', () => {
        ok(/siphonEnabled=true; siphonWisps=\[\]; _lastSiphonOn=null;/.test(SRC.waves),
           'restartGame leaves the siphon where it was');
    });

    check('the wisps draw with the world, and cheaply', () => {
        ok(/drawSiphonWisps\(\)/.test(SRC.game), 'the wisps are never drawn');
        // World space: they travel between two things in the world, so they must
        // sort with it rather than sit up with the interface.
        ok(SRC.game.indexOf('drawSiphonWisps()') < SRC.game.indexOf('drawRadialMenu()'),
           'the wisps draw up with the interface instead of the world');
        // Small by design — the brief was "not crazy, just a little wisp".
        const at = SRC.helpers.indexOf('function drawSiphonWisps');
        const body = SRC.helpers.slice(at, SRC.helpers.indexOf('\nfunction ', at + 10));
        ok(!/shadowBlur/.test(body), 'a glow on every wisp is not "a little wisp"');
        ok(/k <= 3/.test(body), 'the wisp should be a few short segments');
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
        // Sliced to the function's own boundary, not to a character count. A
        // fixed 1800-char window passed until a comment was added at the top of
        // applyDamage and pushed the multiplier out of it — the check broke on
        // a change that could not possibly have affected what it tests.
        const at   = SRC.helpers.indexOf('function applyDamage');
        const next = SRC.helpers.indexOf('\nfunction ', at + 1);
        const body = SRC.helpers.slice(at, next === -1 ? undefined : next);
        ok(body.length > 400, 'the applyDamage body could not be located');
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
        ok(/siphoned from followers near you/i.test(SRC.html),
           'it does not say the charge comes from followers NEAR you');
        ok(/NO SQUAD IN RANGE/.test(SRC.html), 'it does not explain the stalled caption');
        // The range in the docs must be the range in the code.
        const r = SRC.config.match(/const SIPHON_RANGE\s*=\s*([\d.]+)/)[1];
        ok(new RegExp('>' + r + ' tiles<').test(SRC.html),
           'the documented range does not match SIPHON_RANGE (' + r + ')');
        ok(/camper|worker/i.test(SRC.html), 'it does not say who falls outside the range');
        ok(/does not fill at all/i.test(SRC.html),
           'it does not admit the consequence of siphoning');
        ok(/switch at the right end of the bar/i.test(SRC.html), 'it does not mention the switch');
        ok(/Nothing is siphoned while a surge is running/i.test(SRC.html),
           'it does not state the one rule a player could otherwise not infer');
        ok(!/fills as you kill/i.test(SRC.html), 'the index still says kills charge it');
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
