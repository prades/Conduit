// THREE HITS — the player's health is a count of hits (js/config.js PLAYER_HITS).
//
// THE REPORTED CASE: "the main character can only get hit three times by an
// insect or a predator, then they get knocked back to the crystal and it gets
// reset to three — and it stays like this all the way up into the later tiers
// and the later zones."
// The page boots the facility (js/init.js); the creatures that bite stand on open arena floor (__O: js/facilitymap.js).
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
    run(`gameState.running = true; facilityBlackoutSet(false); globalThis.__O = { x: 34, y: 50 };   // open arena floor: x 26..48 at y 49..52
         render();`);
    const fresh = `health = PLAYER_HITS; player.invuln = 0;`;
    // Put the player on a spot (and nowhere on the way: no path).
    const put = (x, y) => `player.x = player.targetX = player.visualX = ${x}; player.y = player.targetY = player.visualY = ${y}; player.fpPath = null;`;

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
        const r = run(`(function(){ ${fresh} ${put('__O.x + 10', '__O.y')}
            for (let i = 0; i < 3; i++) { player.invuln = 0; hurtPlayer(5); }
            const at0 = health; render();
            return { at0, hp: health, d: Math.hypot(player.x - crystal.x, player.y - crystal.y), grace: player.invuln }; })()`);
        same(r.at0, 0, 'hits left after the third');
        same(r.hp, 3, 'hits after the knockdown');
        ok(r.d < 3, 'it left you ' + r.d.toFixed(1) + ' tiles from the Crystal');
        ok(r.grace > 60, 'no grace at the Crystal: ' + r.grace);
    });
    check('…and two hits do not', () => {
        const r = run(`(function(){ ${fresh} ${put('__O.x + 10', '__O.y')} const d0 = Math.hypot(player.x - crystal.x, player.y - crystal.y);
            for (let i = 0; i < 2; i++) { player.invuln = 0; hurtPlayer(5); }
            render(); return { hp: health, d0, d: Math.hypot(player.x - crystal.x, player.y - crystal.y) }; })()`);
        same(r.hp, 1, 'hits left');
        ok(r.d0 > 30, 'fixture: the arena is ' + r.d0.toFixed(1) + ' tiles from the Crystal');
        ok(Math.abs(r.d - r.d0) < 1, 'it moved you to the Crystal after two hits');
    });

    console.log('\nTHE CREATURES');
    // A calm creature facing mostly away from the player (an exact about-face would leave one half-turn at dirX = cos(90°) ≈ 0).
    const biter = `(function(){ actors = actors.filter(a => !(a instanceof Predator));
        const foe = spawnCreature({ species: 'ant', className: 'scout', x: __O.x, y: __O.y, state: 'hunt' });
        foe.entryDelay = 0; foe.health = foe.maxHealth = 1e9; foe.moveSpeed = 0; foe.dirX = -0.6; foe.dirY = 0.8;
        return foe; })()`;
    check('THE ASK: brush up against a creature and it turns and bites — one hit', () => {
        const r = run(`(function(){ ${fresh} const foe = ${biter};
            ${put('__O.x + 0.6', '__O.y')}
            foe.update(); const out = { hp: health, dx: foe.dirX }; foe.dead = true; return out; })()`);
        same(r.hp, 2, 'hits left after brushing a creature');
        ok(r.dx > 0, 'it did not turn toward you (dirX ' + r.dx + ')');
    });
    check('THE ASK: …and you are knocked back a little, away from it', () => {
        const r = run(`(function(){ ${fresh} const foe = ${biter};
            ${put('__O.x + 0.6', '__O.y')}
            foe.update(); foe.dead = true; return { x: player.x - __O.x, tx: player.targetX - __O.x, y: player.y - __O.y }; })()`);
        const kb = run('PLAYER_KNOCKBACK');
        ok(Math.abs(r.x - (0.6 + kb)) < 1e-6 && Math.abs(r.tx - (0.6 + kb)) < 1e-6, 'pushed to ' + r.x + ' (walk target ' + r.tx + ')');
        ok(kb > 0.3 && kb <= 1, 'a little: ' + kb + ' tiles');
        same(r.y, 0, 'y');
    });
    check('a step away, it leaves you alone (it does not hunt you)', () => {
        const r = run(`(function(){ ${fresh} const foe = ${biter};
            ${put('__O.x + 1.5', '__O.y')}
            for (let i = 0; i < 300; i++) { foe.x = __O.x; foe.y = __O.y; foe.update(); }
            foe.dead = true; return health; })()`);
        same(r, 3, 'hits left standing 1.5 tiles from a creature for five seconds');
    });
    check('standing on one: one bite per PLAYER_HIT_GRACE — not every frame', () => {
        const r = run(`(function(){ ${fresh} const foe = ${biter}; let bites = 0;
            for (let i = 0; i < 120; i++) { player.x = __O.x + 0.3; player.y = __O.y; foe.x = __O.x; foe.y = __O.y;
                if (player.invuln > 0) player.invuln--; const h = health; foe.update(); if (health < h) bites++; if (health === 0) health = PLAYER_HITS; }
            foe.dead = true; return bites; })()`);
        ok(r >= 1 && r <= 2, r + ' bites in two seconds');
    });
    check('THE ASK: they do not shoot you — a creature\'s round passes you by', () => {
        const r = run(`(function(){ ${fresh} actors = actors.filter(a => !(a instanceof Predator));
            ${put('__O.x', '__O.y')}
            followerProjectiles.push({ x: __O.x, y: __O.y, vx: 0, vy: 0, life: 5, damage: 50, targetsGreen: true, element: 'fire', color: '#f00', size: 3 });
            render(); return health; })()`);
        same(r, 3, 'hits left after a creature\'s round sat on you');
    });
    check('a clone never bites you', () => {
        const r = run(`(function(){ ${fresh} const c = makeClone('ant', 'scout', __O.x, __O.y);
            ${put('__O.x + 0.3', '__O.y')}
            for (let i = 0; i < 60; i++) { c.x = __O.x; c.y = __O.y; c.update(); } c.dead = true; return health; })()`);
        same(r, 3, 'hits left beside a clone');
    });
    check('THE ASK: still three at the high levels — a level-90 boss takes one hit, not more', () => {
        const r = run(`(function(){ ${fresh}
            const p = spawnCreature({ species: 'mantis', className: 'boss', x: __O.x, y: __O.y, level: 90 }); p.dead = true;
            hurtPlayer(p.power); return { hp: health, lv: p.level, pw: p.power }; })()`);
        ok(r.lv > 30, 'fixture: a high-level creature, level ' + r.lv);
        same(r.hp, 2, 'hits left after a level-' + r.lv + ' boss (power ' + r.pw + ')');
    });
    check('a new game gives all three back', () => {
        const src = fs.readFileSync(path.join(ROOT, 'js/facilityplay.js'), 'utf8');
        const at = src.indexOf('function facilityResetState'), body = src.slice(at, src.indexOf('\nfunction ', at + 10));
        ok(at > -1 && /health = PLAYER_HITS;/.test(body), 'facilityResetState does not reset to PLAYER_HITS');
        ok(!/health ?= ?100\b/.test(src) && !/health ?= ?100\b/.test(fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8')), 'a reset to 100 is left');
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

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
