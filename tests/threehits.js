// THREE HITS — the player's health is a count of hits (js/config.js PLAYER_HITS).
//
// THE REPORTED CASE: "the main character can only get hit three times by an
// insect or a predator, then they get knocked back to the crystal and it gets
// reset to three — and it stays like this all the way up into the later tiers
// and the later zones."
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const sb = makeBrowserSandbox({});
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) {}
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; tutorialMode = false; ensureWorldTo(12 * ZONE_LENGTH); render();`);
    const fresh = `health = PLAYER_HITS; player.invuln = 0;`;

    console.log('\nTHE COUNT');
    check('THE ASK: three hits, and you start with all three', () => {
        same(run('PLAYER_HITS'), 3, 'PLAYER_HITS');
        same(run('health'), 3, 'a new game');
    });
    check('any hit takes ONE — a scratch or a boss\'s bite', () => {
        const r = run(`(function(){ ${fresh} const out = [];
            hurtPlayer(0.5); out.push(health); player.invuln = 0;
            hurtPlayer(99999); out.push(health); return out; })()`);
        same(JSON.stringify(r), '[2,1]', 'hits left after a scratch, then a huge bite');
    });
    check('one volley is one hit: nothing lands for PLAYER_HIT_GRACE after a hit', () => {
        const r = run(`(function(){ ${fresh} hurtPlayer(10); hurtPlayer(10); hurtPlayer(10);
            const a = health; for (let i = 0; i < PLAYER_HIT_GRACE; i++) if (player.invuln > 0) player.invuln--;
            hurtPlayer(10); return [a, health]; })()`);
        same(JSON.stringify(r), '[2,1]', 'three shots in one frame, then one after the grace');
    });

    console.log('\nTHE KNOCKDOWN');
    check('THE ASK: the third hit knocks you back to the Crystal, with all three again', () => {
        const r = run(`(function(){ ${fresh}
            player.x = player.targetX = player.visualX = crystal.x + 40; player.y = player.targetY = player.visualY = 1.5;
            for (let i = 0; i < 3; i++) { player.invuln = 0; hurtPlayer(5); }
            const at0 = health; render();
            return { at0, hp: health, d: Math.hypot(player.x - crystal.x, player.y - crystal.y), grace: player.invuln }; })()`);
        same(r.at0, 0, 'hits left after the third');
        same(r.hp, 3, 'hits after the knockdown');
        ok(r.d < 3, 'it left you ' + r.d.toFixed(1) + ' tiles from the Crystal');
        ok(r.grace > 60, 'no grace at the Crystal: ' + r.grace);
    });
    check('…and two hits do not', () => {
        const r = run(`(function(){ ${fresh}
            player.x = player.targetX = player.visualX = crystal.x + 40; player.y = player.targetY = player.visualY = 1.5;
            for (let i = 0; i < 2; i++) { player.invuln = 0; hurtPlayer(5); }
            render(); return { hp: health, d: Math.hypot(player.x - crystal.x, player.y - crystal.y) }; })()`);
        same(r.hp, 1, 'hits left');
        ok(r.d > 30, 'it moved you to the Crystal after two hits');
    });

    console.log('\nTHE PREDATORS');
    check('a predator\'s bite hits you now (a follower beside you is what it is biting)', () => {
        const r = run(`(function(){ ${fresh} actors = actors.filter(a => !(a instanceof Predator));
            player.x = player.visualX = 20; player.y = player.visualY = 2;
            const f = { x: 20.2, y: 2, type: 'virus', team: 'green', isFollower: true, dead: false, element: 'fire',
                        health: 1e9, maxHealth: 1e9, power: 1, stats: { hp: 1e9, attack: 1, specialAttack: 1, will: 20 },
                        currentWill: 20, moveSpeed: 0, update: () => {} };
            actors.push(f);
            const S = SPECIES.ant, foe = new Predator('striker', Object.assign({}, S.striker, { color: S.color }), 20, 2);
            foe.speciesName = 'ant'; foe.className = 'striker'; applySpeciesBody(foe, 'ant');
            foe.entryDelay = 0; foe.provoked = true; foe.health = foe.maxHealth = 1e9; actors.push(foe);
            for (let i = 0; i < 120; i++) { foe.x = 20; foe.y = 2; player.x = 20; player.y = 2; foe.state = 'attack'; foe.currentTarget = f;
                if (player.invuln > 0) player.invuln--; foe.update(); }
            actors = actors.filter(a => a !== foe && a !== f); return health; })()`);
        ok(r < 3, 'two seconds beside a biting predator and still ' + r + ' hits');
    });
    check('THE ASK: still three in the late zones — a level-90 boss takes one hit, not more', () => {
        const r = run(`(function(){ ${fresh}
            const p = spawnPredatorForZone(30, { species: 'mantis', className: 'boss' }); p.dead = true;
            hurtPlayer(p.power); return { hp: health, lv: p.level, pw: p.power }; })()`);
        ok(r.lv > 30, 'fixture: a late predator, level ' + r.lv);
        same(r.hp, 2, 'hits left after a level-' + r.lv + ' boss (power ' + r.pw + ')');
    });
    check('a new wave and a new game give all three back', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/waves.js'), 'utf8');
        same((src.match(/health ?= ?PLAYER_HITS;/g) || []).length, 2, 'resets to PLAYER_HITS in waves.js');
        ok(!/health ?= ?100\b/.test(src), 'a reset to 100 is left');
    });

    console.log('\nWHAT SHOWS IT');
    check('the bar is cut in three and shows the hits left', () => {
        run(`health = 1; player.invuln = 0; _lastHpInt = -1; render();`);
        const w = parseFloat(run('hpBar.style.width'));
        ok(Math.abs(w - 33.33) < 0.5, 'one hit left draws the bar at ' + w + '%');
        same(run('hpBar.style.background'), '#f22', 'the last hit is red');
        ok(/#ui::after \{[^}]*33\.333%[^}]*66\.667%/.test(fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8')), 'no thirds on the bar');
        run(`health = PLAYER_HITS; _lastHpInt = -1; render();`);
    });
    check('a health pad charge gives back one hit, up to three', () => {
        same(run('HEALTH_PAD_HEAL'), 1, 'HEALTH_PAD_HEAL');
        ok(/health = Math\.min\(PLAYER_HITS, health \+ HEALTH_PAD_HEAL\)/.test(fs.readFileSync(path.join(ROOT, 'js/clone.js'), 'utf8')), 'pads heal past three');
    });
    check('an old save (health out of 100) loads as hits, never more than three', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/save.js'), 'utf8');
        ok(/health = Math\.max\(1, Math\.min\(PLAYER_HITS, Math\.round\(sess\.health\)\)\)/.test(src), 'load does not clamp to PLAYER_HITS');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
