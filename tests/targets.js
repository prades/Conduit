// WHO MAY BE ATTACKED, BY WHOM.
//
// TWO REPORTED CASES: "the predators are too hostile too fast. They're
// attacking the new recruits as they make their way to the crystals." And:
// "the predators should not attack the player."
//
// THE RECRUITS. Not the predators, as it turned out. A hostile predator's
// melee strikes team "green", and recruits are "red" — so enemies never
// touched them. What did was everything on YOUR side, because a recruit stays
// on team "red" until it joins (in the facility: the egg waiting on its pad,
// js/followerspots.js):
//
//   - your CLONES, whose melee and threat scan both strike team "red" (and a
//     clone looks exactly like a predator, so it read as the enemy doing it)
//   - your FOLLOWERS' element attacks, which sweep an area for hostiles around
//     whatever they were aiming at
//
// The cause was one expression written out TWENTY times across elements.js,
// game.js and the rest, in four slightly different forms, each of which
// counted a recruit as hostile. It is now one predicate.
//
// THE PLAYER. A creature hurts you one way: the bite, up close. Its shots and
// specials pass you by. Burning ground (js/firebombs.js) is deliberately NOT
// gated — it is not a predator, and standing in it is a real decision.
// The page boots the facility (js/init.js); the fixtures stand on open arena floor (__O: x 26..48 at y 49..52, js/facilitymap.js).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');

const SRC = {
    config:   fs.readFileSync(path.join(ROOT, 'js/config.js'),    'utf8'),
    helpers:  fs.readFileSync(path.join(ROOT, 'js/helpers.js'),   'utf8'),
    predator: fs.readFileSync(path.join(ROOT, 'js/predator.js'),  'utf8'),
    abilities:fs.readFileSync(path.join(ROOT, 'js/abilities.js'), 'utf8'),
    elements: fs.readFileSync(path.join(ROOT, 'js/elements.js'),  'utf8'),
    game:     fs.readFileSync(path.join(ROOT, 'js/game.js'),      'utf8'),
    firebombs:fs.readFileSync(path.join(ROOT, 'js/firebombs.js'), 'utf8'),
};

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

async function ready(store) {
    const sandbox = makeBrowserSandbox(store || {});
    const ctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is noisy under stubs */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the facility did not build');
    run('gameState.running = true; facilityBlackoutSet(false); globalThis.__O = { x: 34, y: 50 };');
    return { run, sandbox };
}

// A fight with everything in it: the eggs waiting on their pads (the recruits), followers, clones of our
// own, a hostile creature on top of the squad at the Crystal, and the player standing beside an egg.
// Damage is tallied by victim kind from inside applyDamage.
const SCENE = `(function(){
    globalThis.__tally = {};
    const note = k => { __tally[k] = (__tally[k] || 0) + 1; };
    const origAD = applyDamage;
    applyDamage = function(target, amount, source) {
        if (target && target.isNeutralRecruit) {
            note('recruit by ' + (!source ? 'hazard'
                : source.isClone ? 'clone'
                : source instanceof Predator ? 'predator'
                : source.isFollower ? 'follower' : 'other'));
        }
        if (target && target.isFollower) note('follower');
        if (target instanceof Predator && target.team !== 'green') note('enemy');
        return origAD.apply(this, arguments);
    };
    const origHP = hurtPlayer;
    hurtPlayer = function() { note('player'); return origHP.apply(this, arguments); };

    for (let k = 0; k < 6; k++) spawnFollowerAtCrystal('fire');
    for (const sp of ['ant', 'spider']) { const c = makeClone(sp, 'striker', crystal.x + 2, crystal.y + 2, 'wander'); c.entryDelay = 0; }
    // beside an egg, not on it: walking onto one hatches it (js/followerspots.js FP_SPOT.take)
    const r = actors.filter(a => a.isNeutralRecruit && !a.dead)[0];
    if (r) { const c = _fpNearestCell(r.x + 2.5, r.y + 2.5); if (c) { player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1]; player.fpPath = null; } }
    triggerAlarm('facility', crystal.x, crystal.y);
    const foe = spawnCreature({ species: 'ant', className: 'striker', x: crystal.x + 1, y: crystal.y + 1, state: 'hunt' });
    foe.entryDelay = 0; foe.provoked = true; foe.health = 1e6; foe.maxHealth = 1e6;
    return actors.filter(a => a.isNeutralRecruit && !a.dead).length;
})()`;

(async () => {
    const E = await ready();
    const W  = await ready();
    const C1 = await ready();   // a predator pinned on the player
    const C2 = await ready();   // a clone pinned on a recruit
    const C3 = await ready();   // the same clone on a real foe
    const K  = await ready();   // kill counting, reset between checks
    const startRecruits = W.run(SCENE);
    // Ninety seconds of the alarm. The Crystal is kept whole: an unkillable creature chewing it would end
    // the game (and the frames) long before the ninety seconds are up, and this scene is about who ATTACKS.
    W.run(`for (let i = 0; i < 60 * 90; i++) {
        alertTimer = 99999; crystal.health = crystal.maxHealth;
        render();
    }`);
    const tally = W.run('JSON.parse(JSON.stringify(__tally))');
    const endRecruits = W.run("actors.filter(a => a.isNeutralRecruit && !a.dead).length");

    // ─────────────────────────────────────────────────────
    group('THE REPORTED CASES, in a running fight');

    check('recruits wait in their eggs unharmed', () => {
        ok(startRecruits > 5, 'fixture: there should be recruits, got ' + startRecruits);
        // Attackers only. A hazard hurting a recruit is intended behaviour and
        // has its own check; the reported bug was about things ATTACKING them.
        const hits = Object.entries(tally)
            .filter(([k]) => /^recruit by (clone|predator|follower|other)$/.test(k));
        same(hits.length, 0, 'recruits were attacked by: ' + JSON.stringify(hits));
        same(endRecruits, startRecruits,
             `${startRecruits - endRecruits} recruits died in their eggs`);
    });

    check('the player\'s health stays a count of hits: 1 to PLAYER_HITS', () => {
        // Creatures bite the player (three hits, then the Crystal —
        // tests/threehits.js). Whatever the fight did, the count is whole and
        // in range: the knockdown refills it, it never sticks at 0.
        const h = W.run('health'), max = W.run('PLAYER_HITS');
        ok(Number.isInteger(h) && h >= 1 && h <= max, 'health ' + h + ' of ' + max);
    });

    check('but the fight itself is untouched', () => {
        // The whole risk of this change is turning combat off by accident.
        // Thresholds kept clear of the boundary: the follower-hit count ranged
        // from 9 to 55 across runs, so "> 10" failed on correct code. The
        // deterministic contact checks below are what actually pin this.
        ok((tally.enemy || 0) > 0, 'the squad never hurt the enemy at all');
        ok((tally.follower || 0) > 0, 'the enemy never hurt the squad at all');
    });

    // ─────────────────────────────────────────────────────
    group('contact, guaranteed');

    // The fight above is evidence, not proof: whether the player or a recruit is
    // ever actually reached in ninety seconds is luck. Re-arming predators left
    // "the player is not touched" passing, and ungating the clone melee left
    // every check passing. These put the two units in contact on purpose.

    check('THE ASK (three hits): a hostile creature standing on the player bites — one hit per grace', () => {
        const hp = C1.run(`(function(){
            actors = []; followers = []; health = PLAYER_HITS; player.invuln = 0;
            player.x = __O.x; player.y = __O.y; player.visualX = __O.x; player.visualY = __O.y; player.fpPath = null;
            // A follower for it to be attacking, so it is in its melee branch
            // at all — and the swipe at the player is collateral to that.
            const f = { x: __O.x + 0.2, y: __O.y, type: 'virus', team: 'green', isFollower: true,
                        dead: false, element: 'fire', health: 1e9, maxHealth: 1e9,
                        power: 1, stats: { hp: 1e9, attack: 1, specialAttack: 1, will: 20 },
                        currentWill: 20, moveSpeed: 0, update: () => {} };
            actors.push(f); followers.push(f);
            const foe = spawnCreature({ species: 'ant', className: 'striker', x: __O.x, y: __O.y, state: 'hunt' });
            foe.entryDelay = 0; foe.provoked = true; foe.health = 1e9; foe.maxHealth = 1e9;
            foe.state = 'attack'; foe.currentTarget = f;
            for (let i = 0; i < 600; i++) {
                foe.x = __O.x; foe.y = __O.y;            // pinned on the player
                player.x = __O.x; player.y = __O.y;
                if (player.invuln > 0) player.invuln--;   // as the game loop does
                foe.state = 'attack'; foe.currentTarget = f;
                foe.update();
            }
            return health;
        })()`);
        // Ten seconds on top of it: all three hits gone (the knockdown that
        // refills them is the game loop's, not run here).
        same(hp, 0, 'hits left after ten seconds under a creature');
    });

    check('and the same creature IS still mauling the follower', () => {
        // Which proves the contact was real and the melee branch ran.
        ok(C1.run('followers[0].health < followers[0].maxHealth'),
           'the follower took no damage either — the creature never attacked at all');
    });

    check('THE ASK: a clone standing on a recruit does not bite it', () => {
        const r = C2.run(`(function(){
            actors = []; followers = [];
            const recruit = { x: __O.x, y: __O.y, type: 'virus', team: 'red', isNeutralRecruit: true,
                              dead: false, health: 500, maxHealth: 500, moveSpeed: 0,
                              update: () => {} };
            actors.push(recruit);
            const c = makeClone('ant', 'striker', __O.x, __O.y, 'hunt');
            c.entryDelay = 0; c.health = 1e9; c.maxHealth = 1e9;
            for (let i = 0; i < 600; i++) {
                c.x = __O.x; c.y = __O.y; recruit.x = __O.x; recruit.y = __O.y;
                c.update();
            }
            return { health: recruit.health, target: c.currentTarget === recruit };
        })()`);
        same(r.health, 500, 'a clone chewed on a recruit waiting in its egg');
        same(r.target, false, 'and it should not even have acquired it as a target');
    });

    check('but the same clone DOES bite an ordinary red unit', () => {
        // So the clone is not simply inert.
        const hp = C3.run(`(function(){
            actors = []; followers = [];
            const foe = { x: __O.x, y: __O.y, type: 'virus', team: 'red', dead: false,
                          health: 500, maxHealth: 500, moveSpeed: 0, update: () => {} };
            actors.push(foe);
            const c = makeClone('ant', 'striker', __O.x, __O.y, 'hunt');
            c.entryDelay = 0; c.health = 1e9; c.maxHealth = 1e9;
            for (let i = 0; i < 600; i++) { c.x = __O.x; c.y = __O.y; foe.x = __O.x; foe.y = __O.y; c.update(); }
            return foe.health;
        })()`);
        ok(hp < 500, 'the clone did not attack an ordinary red unit either');
    });

    // ─────────────────────────────────────────────────────
    group('the two predicates');

    check('a recruit is a bystander until it joins', () => {
        const r = E.run(`(function(){
            const before = isNeutralBystander({ isNeutralRecruit: true, team: 'red' });
            // npc.js clears the flag and flips the team at the Crystal.
            const after  = isNeutralBystander({ isNeutralRecruit: false, team: 'green' });
            const plainRed = isNeutralBystander({ team: 'red' });
            return { before, after, plainRed };
        })()`);
        same(r.before, true, 'a waiting recruit should be a bystander');
        same(r.after, false, 'once recruited it is one of yours, not a bystander');
        same(r.plainRed, false, 'an ordinary red unit is not a bystander');
    });

    check('isHostileTarget spares bystanders and nothing else', () => {
        const r = E.run(`(function(){
            const S = SPECIES['ant'];
            const mk = over => Object.assign(
                new Predator('striker', Object.assign({}, S.striker, {color:S.color}), 0, 0), over);
            return {
                bystander: isHostileTarget({ team: 'red', isNeutralRecruit: true }),
                red:       isHostileTarget({ team: 'red' }),
                foe:       isHostileTarget(mk({ team: 'red', dead: false })),
                clone:     isHostileTarget(mk({ team: 'green', isClone: true, dead: false })),
                dead:      isHostileTarget({ team: 'red', dead: true }),
                nothing:   isHostileTarget(null),
                follower:  isHostileTarget({ team: 'green', isFollower: true }),
            };
        })()`);
        same(r.bystander, false, 'a recruit waiting in its egg must not be a target');
        same(r.red, true, 'an ordinary red unit is');
        same(r.foe, true, 'so is a hostile creature');
        same(r.clone, false, 'your own clone is not');
        same(r.dead, false, 'nor is a corpse');
        same(r.nothing, false, 'nor is nothing at all');
        same(r.follower, false, 'nor is one of your followers');
    });

    check('one predicate, not twenty copies', () => {
        // The expression lived in four forms across three files, and every one
        // counted a recruit as hostile.
        // Every file, not a hand-kept list of three: the copies were spread
        // across the codebase and a list can go stale the moment one moves.
        const files = fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'));
        ok(files.length > 20, 'the source directory could not be read, got ' + files.length);
        let users = 0;
        for (const f of files) {
            const raw = fs.readFileSync(path.join(ROOT, 'js', f), 'utf8');
            // Comments stripped: helpers.js quotes all four of the old forms
            // directly above the predicate that replaced them, so the file that
            // fixed the bug matched the pattern for it.
            const src = raw.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
            ok(!/a\.team\s*===?\s*"red"\s*\|\|\s*\(a instanceof Predator/.test(src),
               f + ' still spells the hostile test out for itself');
            if (/isHostileTarget\(/.test(raw)) users++;
        }
        ok(users >= 3, 'only ' + users + ' file(s) ask the predicate — it is not the shared rule');
        same((SRC.helpers.match(/function isHostileTarget/g) || []).length, 1,
             'the predicate is defined more than once');
    });

    // ─────────────────────────────────────────────────────
    group('KILLS STILL COUNT — the cost of unifying the predicate');

    // The regression this group exists for: "I'm not getting my kills
    // calculated."
    //
    // Folding twenty-five hostility expressions into isHostileTarget swept up
    // the place that COUNTS a kill. isHostileTarget begins `if (a.dead) return
    // false`, so that condition became `a.dead && isHostileTarget(a)`, which is
    // `a.dead && !a.dead`. Never true. Measured: six ordinary creatures killed,
    // zero counted.
    //
    // The drops kept paying out, which is why nothing looked wrong at a glance,
    // and nothing here or anywhere else tested a kill being counted at all.

    check('THE PAIR: a corpse is still an enemy unit, just not a target', () => {
        const r = E.run(`(function(){
            const dead = { team: 'red', dead: true };
            return { unitDead:   isEnemyUnit(dead),
                     targetDead: isHostileTarget(dead),
                     unitAlive:  isEnemyUnit({ team: 'red' }),
                     recruit:    isEnemyUnit({ team: 'red', isNeutralRecruit: true, dead: true }),
                     follower:   isEnemyUnit({ team: 'green', isFollower: true, dead: true }),
                     nothing:    isEnemyUnit(null) };
        })()`);
        same(r.unitDead, true, 'a dead enemy is still one of theirs — that is what a kill IS');
        same(r.targetDead, false, 'but it is not something you may shoot');
        same(r.unitAlive, true, 'and a live one is both');
        same(r.recruit, false, 'a dead recruit was never theirs to begin with');
        same(r.follower, false, 'nor is one of yours');
        same(r.nothing, false, 'nor is nothing at all');
    });

    check('THE BUG: no condition anywhere asks for a dead hostile TARGET', () => {
        // The generalisable guard. `x.dead && isHostileTarget(x)` cannot be
        // true, so any such condition is dead code — this catches the whole
        // class rather than the two instances of it that were found.
        // Comments stripped first. The explanation of this very bug, sitting
        // above the fixed line in game.js, matched the pattern and failed the
        // check on correct code.
        const code = s => s.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
        for (const [name, src] of [['game.js', SRC.game], ['elements.js', SRC.elements],
                                   ['predator.js', SRC.predator], ['helpers.js', SRC.helpers]]) {
            const bad = code(src).match(/\w+\.dead\s*&&\s*isHostileTarget\s*\(/g);
            ok(!bad, name + ' has a condition that can never be true: ' + (bad || []).join(', '));
        }
    });

    // One facility, reset between checks. check() is synchronous and drops a
    // returned promise on the floor, so an `async () =>` check here would pass
    // no matter what it asserted.
    const killScene = body => K.run(`(function(){
        // running, or render() bails out before it ever reaches the counters
        // and every one of these checks quietly reads zero.
        gameState.running = true;
        actors.length = 0; followers.length = 0;
        lifetimeKills = 0;
        alertActive = true; alertTimer = 99999; alertSource = { x: __O.x, y: __O.y };
        ${body}
    })()`);

    check('killing an ordinary enemy counts as a kill, once the sweep has seen the corpse', () => {
        const r = killScene(
            `const p = spawnCreature({ species: 'ant', className: 'striker', x: __O.x, y: __O.y, state: 'hunt' });
             render();
             p.health = 0; p.dead = true;
             for (let f = 0; f < 5; f++) render();
             return { kills: lifetimeKills, flagged: !!p.progressCounted };`);
        same(r.kills, 1, 'lifetimeKills did not move');
        same(r.flagged, true, 'the corpse was never marked as counted');
    });

    check('a kill is counted exactly ONCE, end to end', () => {
        // What this actually proves, and what it does not. Two seconds of
        // frames after the death yield one kill — that is the behaviour the
        // player sees, and it is worth pinning.
        //
        // It is NOT a test of the progressCounted / deathProcessed flags. The
        // cleanup pass splices a corpse out of `actors` on the very first frame
        // after it dies, so the counting loop never sees it twice and the flags
        // are belt-and-braces today: removing them leaves this green. The
        // corpse lifetime is asserted below so that if cleanup ever starts
        // retaining bodies — for a death animation, say — the flags become
        // load-bearing and this check starts testing them for real.
        const r = killScene(
            `const p = spawnCreature({ species: 'ant', className: 'striker', x: __O.x, y: __O.y, state: 'hunt' });
             render();
             p.health = 0; p.dead = true;
             let lingered = 0;
             for (let f = 0; f < 120; f++) { render(); if (actors.includes(p)) lingered++; }
             return { kills: lifetimeKills, lingered };`);
        same(r.kills, 1, 'the same corpse was counted more than once');
        same(r.lingered, 0,
             'corpses now linger in actors for ' + r.lingered + ' frames — the '
             + 'progressCounted/deathProcessed flags are load-bearing now, not belt-and-braces');
    });

    check('a recruit dying is not a kill won', () => {
        // It is on the enemy's team until it joins, so a naive "team red died"
        // would bank it — and the player did nothing to earn it.
        const r = killScene(
            `const rec = { x: __O.x, y: __O.y, team: 'red', isNeutralRecruit: true, dead: true,
                           health: 0, maxHealth: 60, type: 'virus' };
             actors.push(rec);
             for (let f = 0; f < 5; f++) render();
             return { kills: lifetimeKills };`);
        same(r.kills, 0, 'a dead recruit should not count as a kill');
    });

    check('and neither is one of your own clones dying', () => {
        const r = killScene(
            `const p = makeClone('ant', 'striker', __O.x, __O.y);
             render();
             p.health = 0; p.dead = true;
             for (let f = 0; f < 5; f++) render();
             return { kills: lifetimeKills };`);
        same(r.kills, 0, 'losing a clone should not count as a kill');
    });

    check('chain lightning no longer jumps to your own clone', () => {
        // One of the four forms was `a.team==="red" || (a instanceof Predator)`
        // with no clone check, so the electric chain could earth itself on a
        // clone of yours. Unifying closed it.
        // Sliced to the electric physical attack, not a character count: the
        // predicate sits 651 characters past the first mention of chainTargets,
        // and a 400-character window failed this on correct code.
        const at = SRC.elements.indexOf('// Chain lightning');
        ok(at > -1, 'fixture: the chain should still exist');
        const end = SRC.elements.indexOf('special(', at);
        const body = SRC.elements.slice(at, end > at ? end : at + 2000);
        ok(/isHostileTarget\(/.test(body), 'the chain does not use the predicate');
        ok(!/a instanceof Predator\)\)/.test(body), 'the unguarded form is still there');
    });

    // ─────────────────────────────────────────────────────
    group('creatures attack the player (three hits, js/config.js PLAYER_HITS)');

    check('the flag is ON, and it is a named constant', () => {
        ok(/const PREDATORS_ATTACK_PLAYER = true/.test(SRC.config),
           'the rule is not a named constant set to true');
        same(E.run('predatorMayHurtPlayer()'), true, 'the predicate should say yes');
    });

    check('only the bite consults it: shots and specials never touch the player', () => {
        // "They should turn to hit you if you're super close, and they won't
        // shoot at you." The up-close bite is the one path (tests/threehits.js
        // drives it); the ability radius helper and the abdomen shot have none.
        ok(/!this\.isClone && !this\.untargetable && typeof predatorMayHurtPlayer === \"function\" && predatorMayHurtPlayer\(\)/.test(SRC.predator),
           'the bite is not gated');
        ok(!/predatorMayHurtPlayer|hurtPlayer/.test(SRC.abilities), 'a special can still hurt the player');
        const at = SRC.game.indexOf('followerProjectiles = followerProjectiles.filter(');
        ok(at > -1, 'fixture: the projectile filter');
        const end = SRC.game.indexOf('return !hit && p.life > 0', at);
        ok(end > at && !/hurtPlayer/.test(SRC.game.slice(at, end)), 'a creature\'s shot can still hurt the player');
        same((SRC.helpers.match(/function predatorMayHurtPlayer/g) || []).length, 1,
             'the predicate is defined more than once');
    });

    // ─────────────────────────────────────────────────────
    group('hazards still hurt — they are not predators');

    check('the player can still be damaged at all', () => {
        // If hurtPlayer itself had been gated, every hazard would be toothless.
        const r = E.run(`(function(){
            health = PLAYER_HITS; player.invuln = 0;
            hurtPlayer(12);
            return health;
        })()`);
        same(r, E.run('PLAYER_HITS') - 1, 'hurtPlayer should take one hit — hazards depend on it');
    });

    check('burning ground is NOT gated', () => {
        const at = SRC.firebombs.indexOf('function fireBombsTick');
        ok(at > -1, 'fixture: could not find the burning ground');
        const body = SRC.firebombs.slice(at, SRC.firebombs.indexOf('\nfunction ', at + 10));
        ok(/hurtPlayer\(/.test(body), 'burning ground no longer hurts the player at all');
        ok(!/predatorMayHurtPlayer/.test(body), 'burning ground is gated as if it were a predator');
    });

    // ─────────────────────────────────────────────────────
    group('the player cannot order an attack on a recruit either');

    check('a long-press cannot pick a bystander', () => {
        const r = E.run(`(function(){
            actors = [];
            const sc = a => [(a.x - player.visualX - (a.y - player.visualY)) * TILE_W + canvas.width / 2,
                             (a.x - player.visualX + (a.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H - facilityLiftRel(a.x, a.y) - 55];
            const recruit = { x: player.x + 1, y: player.y, team: 'red', isNeutralRecruit: true, dead: false };
            actors.push(recruit); const [sx, sy] = sc(recruit);
            const a = findEnemyAtScreen(sx, sy);
            const foe = spawnCreature({ species: 'ant', className: 'scout', x: recruit.x, y: recruit.y });      // a real foe
            const b = findEnemyAtScreen(sx, sy);
            return { onlyRecruit: a === null, withFoe: b === foe };
        })()`);
        same(r.onlyRecruit, true, 'a recruit alone should offer no target');
        same(r.withFoe, true, 'but a real foe on the same spot still does');
    });

    group('the index says so');

    check('the rules are written down', () => {
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(/<span class="cm-stat">3<\/span> hits, then you are knocked back to the Crystal/.test(HTML), 'the index does not state the three-hit rule');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
