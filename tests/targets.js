// WHO MAY BE ATTACKED, BY WHOM.
//
// TWO REPORTED CASES: "the predators are too hostile too fast. They're
// attacking the new recruits as they make their way to the crystals." And:
// "the predators should not attack the player."
//
// THE RECRUITS. Not the predators, as it turned out. A hostile predator's
// melee strikes team "green", and recruits are "red" — so enemies never
// touched them. What did was everything on YOUR side, because a recruit stays
// on team "red" until it reaches the Crystal:
//
//   - your CLONES, whose melee and threat scan both strike team "red" (and a
//     clone looks exactly like a predator, so it read as the enemy doing it)
//   - your FOLLOWERS' element attacks, which sweep an area for hostiles around
//     whatever they were aiming at
//
// Measured: 90 seconds of a facility alarm with six followers, two clones and
// the player parked among eleven incoming recruits — four hits on recruits and
// one dead. Every one of them from a follower.
//
// The cause was one expression written out TWENTY times across elements.js,
// game.js and traps.js, in four slightly different forms, each of which
// counted a recruit as hostile. It is now one predicate.
//
// THE PLAYER. Three paths could damage them: the melee swipe, the ability
// radius helper, and the abdomen projectile. All three now consult one flag.
// Hazards are deliberately NOT gated — acid, vent blasts, ground zones and
// cocoon toxin are not predators, and dodging them is a real decision.
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
    traps:    fs.readFileSync(path.join(ROOT, 'js/traps.js'),     'utf8'),
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
    const sandbox = makeBrowserSandbox(store || { tubecrawler_seed: '305419896' });
    const ctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is noisy under stubs */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    return { run, sandbox };
}

// A wave with everything in it: recruits coming in, followers, clones of our
// own, a hostile predator on top of the squad, and the player standing among
// the recruits. Damage is tallied by victim kind from inside applyDamage.
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

    gameState.running = true; gameState.nightNumber = 6; activeDayZones = 6;
    nightEnemiesTarget = 99999;
    for (let k = 0; k < 6; k++) spawnFollowerAtCrystal('fire');
    for (const sp of ['ant', 'spider']) {
        const S = SPECIES[sp];
        const c = new Predator('striker', Object.assign({}, S.striker, {color:S.color}),
                               crystal.x + 2, 2);
        c.speciesName = sp; c.className = 'striker'; c.team = 'green'; c.isClone = true;
        c.state = 'wander'; c.entryDelay = 0;
        applySpeciesBody(c, sp); if (typeof initAbility === 'function') initAbility(c);
        actors.push(c);
    }
    const r = actors.filter(a => a.isNeutralRecruit && !a.dead)[0];
    if (r) { player.x = r.x; player.y = r.y; player.visualX = r.x; player.visualY = r.y; }
    triggerAlarm('facility', 20, 2);
    const S2 = SPECIES['ant'];
    const foe = new Predator('striker', Object.assign({}, S2.striker, {color:S2.color}),
                             crystal.x + 1, 2);
    foe.speciesName = 'ant'; foe.className = 'striker'; foe.state = 'hunt';
    foe.entryDelay = 0; foe.provoked = true; foe.health = 1e6; foe.maxHealth = 1e6;
    applySpeciesBody(foe, 'ant'); if (typeof initAbility === 'function') initAbility(foe);
    actors.push(foe);
    return actors.filter(a => a.isNeutralRecruit && !a.dead).length;
})()`;

(async () => {
    const E = await ready();
    const W  = await ready();
    const C1 = await ready();   // a predator pinned on the player
    const C2 = await ready();   // a clone pinned on a recruit
    const C3 = await ready();   // the same clone on a real foe
    const startRecruits = W.run(SCENE);
    // Cleared every frame: the cocoon toxin is DESIGNED to bite recruits, so
    // leaving puddles in made this scene's verdict depend on whether one
    // happened to form near the path — it failed two runs in five. Hazards get
    // their own checks below; this scene is about who ATTACKS.
    // Both hazard sources cleared every frame — cocoon toxin AND acid pools.
    // Hazards are designed to bite recruits, so their presence made this
    // scene's verdict depend on whether one happened to form on the path.
    W.run(`for (let i = 0; i < 60 * 90; i++) {
        alertTimer = 99999; cocoons.length = 0; environmentalHazards.length = 0;
        render();
    }`);
    const tally = W.run('JSON.parse(JSON.stringify(__tally))');
    const endRecruits = W.run("actors.filter(a => a.isNeutralRecruit && !a.dead).length");

    // ─────────────────────────────────────────────────────
    group('THE REPORTED CASES, in a running wave');

    check('recruits reach the Crystal unharmed', () => {
        ok(startRecruits > 5, 'fixture: there should be recruits, got ' + startRecruits);
        // Attackers only. A hazard hurting a recruit is intended behaviour and
        // has its own check; the reported bug was about things ATTACKING them.
        const hits = Object.entries(tally)
            .filter(([k]) => /^recruit by (clone|predator|follower|other)$/.test(k));
        same(hits.length, 0, 'recruits were attacked by: ' + JSON.stringify(hits));
        same(endRecruits, startRecruits,
             `${startRecruits - endRecruits} recruits died on the way in`);
    });

    check('the player is not touched', () => {
        // End-to-end evidence, but NOT the load-bearing check: in a big scene
        // the player may simply never come into reach, and this passed even
        // with predators re-armed. The deterministic contact checks below are
        // the ones that bite.
        same(tally.player || 0, 0, 'the player was damaged ' + tally.player + ' times');
        same(W.run('health'), 100, 'and lost health');
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

    // The wave above is evidence, not proof: whether the player or a recruit is
    // ever actually reached in ninety seconds is luck. Re-arming predators left
    // "the player is not touched" passing, and ungating the clone melee left
    // every check passing. These put the two units in contact on purpose.

    check('THE ASK: a hostile predator standing on the player does not bite', () => {
        const hp = C1.run(`(function(){
            gameState.running = true;
            actors = []; followers = []; health = 100; player.invuln = 0;
            player.x = 4; player.y = 2; player.visualX = 4; player.visualY = 2;
            // A follower for it to be attacking, so it is in its melee branch
            // at all — and the swipe at the player is collateral to that.
            const f = { x: 4.2, y: 2, type: 'virus', team: 'green', isFollower: true,
                        dead: false, element: 'fire', health: 1e9, maxHealth: 1e9,
                        power: 1, stats: { hp: 1e9, attack: 1, specialAttack: 1, will: 20 },
                        currentWill: 20, moveSpeed: 0, update: () => {} };
            actors.push(f); followers.push(f);
            const S = SPECIES['ant'];
            const foe = new Predator('striker', Object.assign({}, S.striker, {color:S.color}), 4, 2);
            foe.speciesName = 'ant'; foe.className = 'striker'; foe.entryDelay = 0;
            foe.provoked = true; foe.health = 1e9; foe.maxHealth = 1e9;
            foe.state = 'attack'; foe.currentTarget = f;
            applySpeciesBody(foe, 'ant'); if (typeof initAbility === 'function') initAbility(foe);
            actors.push(foe);
            for (let i = 0; i < 600; i++) {
                foe.x = 4; foe.y = 2;            // pinned on the player
                player.x = 4; player.y = 2;
                player.invuln = 0;
                foe.state = 'attack'; foe.currentTarget = f;
                foe.update();
            }
            return health;
        })()`);
        same(hp, 100, 'the player lost health to a predator standing on them');
    });

    check('and the same predator IS still mauling the follower', () => {
        // Which proves the contact was real and the melee branch ran.
        ok(C1.run('followers[0].health < followers[0].maxHealth'),
           'the follower took no damage either — the predator never attacked at all');
    });

    check('THE ASK: a clone standing on a recruit does not bite it', () => {
        const r = C2.run(`(function(){
            gameState.running = true;
            actors = []; followers = [];
            const recruit = { x: 4, y: 2, type: 'virus', team: 'red', isNeutralRecruit: true,
                              dead: false, health: 500, maxHealth: 500, moveSpeed: 0,
                              update: () => {} };
            actors.push(recruit);
            const S = SPECIES['ant'];
            const c = new Predator('striker', Object.assign({}, S.striker, {color:S.color}), 4, 2);
            c.speciesName = 'ant'; c.className = 'striker'; c.team = 'green'; c.isClone = true;
            c.entryDelay = 0; c.health = 1e9; c.maxHealth = 1e9;
            applySpeciesBody(c, 'ant'); if (typeof initAbility === 'function') initAbility(c);
            actors.push(c);
            for (let i = 0; i < 600; i++) {
                c.x = 4; c.y = 2; recruit.x = 4; recruit.y = 2;
                c.update();
            }
            return { health: recruit.health, target: c.currentTarget === recruit };
        })()`);
        same(r.health, 500, 'a clone chewed on a recruit walking to the Crystal');
        same(r.target, false, 'and it should not even have acquired it as a target');
    });

    check('but the same clone DOES bite an ordinary red unit', () => {
        // So the clone is not simply inert.
        const hp = C3.run(`(function(){
            gameState.running = true;
            actors = []; followers = [];
            const foe = { x: 4, y: 2, type: 'virus', team: 'red', dead: false,
                          health: 500, maxHealth: 500, moveSpeed: 0, update: () => {} };
            actors.push(foe);
            const S = SPECIES['ant'];
            const c = new Predator('striker', Object.assign({}, S.striker, {color:S.color}), 4, 2);
            c.speciesName = 'ant'; c.className = 'striker'; c.team = 'green'; c.isClone = true;
            c.entryDelay = 0; c.health = 1e9; c.maxHealth = 1e9;
            applySpeciesBody(c, 'ant'); if (typeof initAbility === 'function') initAbility(c);
            actors.push(c);
            for (let i = 0; i < 600; i++) { c.x = 4; c.y = 2; foe.x = 4; foe.y = 2; c.update(); }
            return foe.health;
        })()`);
        ok(hp < 500, 'the clone did not attack an ordinary red unit either');
    });

    // ─────────────────────────────────────────────────────
    group('the two predicates');

    check('a recruit is a bystander until it arrives', () => {
        const r = E.run(`(function(){
            const before = isNeutralBystander({ isNeutralRecruit: true, team: 'red' });
            // npc.js clears the flag and flips the team at the Crystal.
            const after  = isNeutralBystander({ isNeutralRecruit: false, team: 'green' });
            const plainRed = isNeutralBystander({ team: 'red' });
            return { before, after, plainRed };
        })()`);
        same(r.before, true, 'an incoming recruit should be a bystander');
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
        same(r.bystander, false, 'a recruit walking in must not be a target');
        same(r.red, true, 'an ordinary red unit is');
        same(r.foe, true, 'so is a hostile predator');
        same(r.clone, false, 'your own clone is not');
        same(r.dead, false, 'nor is a corpse');
        same(r.nothing, false, 'nor is nothing at all');
        same(r.follower, false, 'nor is one of your followers');
    });

    check('one predicate, not twenty copies', () => {
        // The expression lived in four forms across three files, and every one
        // counted a recruit as hostile.
        for (const [name, src] of [['elements.js', SRC.elements], ['game.js', SRC.game],
                                   ['traps.js', SRC.traps]]) {
            ok(!/a\.team\s*===?\s*"red"\s*\|\|\s*\(a instanceof Predator/.test(src),
               name + ' still spells the hostile test out for itself');
            ok(/isHostileTarget\(/.test(src), name + ' does not use the predicate');
        }
        same((SRC.helpers.match(/function isHostileTarget/g) || []).length, 1,
             'the predicate is defined more than once');
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
    group('predators do not attack the player');

    check('the flag is off, and it is a named constant', () => {
        ok(/const PREDATORS_ATTACK_PLAYER = false/.test(SRC.config),
           'the rule is not a named constant set to false');
        same(E.run('predatorMayHurtPlayer()'), false, 'the predicate should say no');
    });

    check('all three paths consult it', () => {
        // The melee swipe, the ability radius helper, and the abdomen shot.
        ok(/!this\.isClone && predatorMayHurtPlayer\(\)/.test(SRC.predator),
           'the melee swipe is not gated');
        ok(/predatorMayHurtPlayer\(\) && typeof player/.test(SRC.abilities),
           'the ability radius helper is not gated');
        ok(/p\.targetsGreen && predatorMayHurtPlayer\(\)/.test(SRC.game),
           'the abdomen projectile is not gated');
        same((SRC.helpers.match(/function predatorMayHurtPlayer/g) || []).length, 1,
             'the predicate is defined more than once');
    });

    check('an ungated shot no longer eats itself either', () => {
        // The projectile used to be consumed by the player even when immunity
        // stopped the damage. Gated, the round passes by instead.
        // Sliced to the end of the enclosing filter rather than a character
        // count — the explanatory comment inside the branch pushed `hit = true`
        // past a 400-character window.
        const at = SRC.game.indexOf('p.targetsGreen && predatorMayHurtPlayer()');
        ok(at > -1, 'the projectile branch is not gated');
        const end = SRC.game.indexOf('return !hit && p.life > 0', at);
        ok(end > at, 'fixture: the branch should sit inside the projectile filter');
        const body = SRC.game.slice(at, end);
        ok(/hit = true/.test(body), 'fixture: the branch should still consume the shot');
    });

    // ─────────────────────────────────────────────────────
    group('hazards still hurt — they are not predators');

    check('the player can still be damaged at all', () => {
        // If hurtPlayer itself had been gated, every hazard would be toothless.
        const r = E.run(`(function(){
            health = 100; player.invuln = 0;
            hurtPlayer(12);
            return health;
        })()`);
        same(r, 88, 'hurtPlayer should still work — hazards depend on it');
    });

    check('acid, vents and ground zones are NOT gated', () => {
        for (const [what, src, near] of [
            ['the acid pool',    SRC.elements, 'ACID'],
            ['the ground zone',  SRC.elements, 'ZAP'],
            ['the vent blast',   SRC.game,     'BLAST'],
        ]) {
            const at = src.indexOf(near);
            ok(at > -1, 'fixture: could not find ' + what);
            const body = src.slice(at, at + 500);
            ok(/hurtPlayer\(/.test(body), what + ' no longer hurts the player at all');
            ok(!/predatorMayHurtPlayer/.test(body),
               what + ' is gated as if it were a predator');
        }
    });

    check('the cocoon toxin still reaches recruits, by design', () => {
        // Which is why the attack scene above clears cocoons: a recruit CAN be
        // hurt by a hazard, and that is not the bug that was reported.
        const r = E.run(`(function(){
            return { recruit: puddleAffects({ isNeutralRecruit: true, dead: false }),
                     follower: puddleAffects({ isFollower: true, element: 'ice', dead: false }) };
        })()`);
        same(r.recruit, true, 'the toxin should still reach an un-recruited recruit');
        same(r.follower, true, 'and a follower');
    });

    check('the cocoon toxin still bites followers', () => {
        // It never touched the player, and it should still reach the squad.
        const inf = fs.readFileSync(path.join(ROOT, 'js/infest.js'), 'utf8');
        ok(/function puddleAffects/.test(inf), 'the toxin rule is gone');
        ok(!/predatorMayHurtPlayer/.test(inf), 'the toxin is gated as if it were a predator');
    });

    // ─────────────────────────────────────────────────────
    group('the player cannot order an attack on a recruit either');

    check('a long-press cannot pick a bystander', () => {
        const r = E.run(`(function(){
            actors = [];
            const recruit = { x: 4, y: 2, team: 'red', isNeutralRecruit: true, dead: false };
            actors.push(recruit);
            const a = getEnemyAtTile({ x: 4, y: 2 });
            actors.push({ x: 4, y: 2, team: 'red', dead: false });      // a real foe
            const b = getEnemyAtTile({ x: 4, y: 2 });
            return { onlyRecruit: a === null, withFoe: b !== null && !b.isNeutralRecruit };
        })()`);
        same(r.onlyRecruit, true, 'a recruit alone should offer no target');
        same(r.withFoe, true, 'but a real foe on the same tile still does');
    });

    check('nor can a gesture selection', () => {
        ok(/a\.dead \|\| isNeutralBystander\(a\)/.test(SRC.helpers),
           'the gesture selection does not skip bystanders');
        same((SRC.helpers.match(/isNeutralBystander\(a\)/g) || []).length >= 3, true,
             'not every selection path skips them');
    });

    group('the index says so');

    check('the rules are written down', () => {
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        ok(/Predators never attack you/i.test(HTML), 'the index does not state the player rule');
        ok(/Hazards still hurt/i.test(HTML), 'nor that hazards are the exception');
        ok(/Recruits are never attacked/i.test(HTML), 'nor the recruit rule');
        ok(/your own side used to cut them down/i.test(HTML),
           'nor that it was your own side doing it');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
