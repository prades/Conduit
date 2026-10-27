// WHOM A CREATURE GOES FOR, AND THE SPIDERS THAT LURK (docs/COMBAT.md "Whom a creature goes for", "Spiders lurk"; js/predator.js predatorPickPrey, js/combat.js COMBAT.prey, js/facilityspawn.js SPIDER_LURK).
// ASKED: "it feels like I'm invulnerable if I'm really trying, the different predators will have more attacks with cool downs later but they should feel more dangerous, make them target you if you are
// weak especially. They should target weak targets and the player has a health bar too. They should also target you if you attack them. Spiders should have no tag and should hang out near objects that
// reveal it only partially when idle."
//   THE PLAYER IS PREY   a creature you hit turns on YOU (not on the spot you stood on), chases you and bites you in two beats: one of your three hits; step out while it rears back and it misses
//   THE WEAK FIRST       of what is near it, it goes for the weakest: a weak player above all; a calm one turns on a player down to the last hit
//   SPIDERS LURK         no tag; idle, behind a prop, faint, with no bar, not auto-locked
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; crystal.health = crystal.maxHealth = 1e7; _fp.items = _fp.items.filter(i => !(i.fp === 'prop' && i.kind === 'sentry'));   // (no sentries; a Crystal that cannot fall)
        facilitySpawnTick = () => {};   // (no arena spawner: the only creatures are the ones a check makes)
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };
        // the arena's most open floor (the fights are staged there, far from the Crystal)
        globalThis.__open = (() => { const AC = _fsArenaCells(); let best = AC[0], bd = -1; for (const q of AC) { let free = 0; for (const s of AC) if (Math.abs(s[0] - q[0]) <= 5 && Math.abs(s[1] - q[1]) <= 3) free++; if (free > bd) { bd = free; best = q; } } return best; })();
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone); for (const f of followers) { f.x = crystal.x - 30; f.y = crystal.y; f.stance = 'hold'; f.job = { type: 'move', target: { x: f.x, y: f.y } }; f.health = f.maxHealth; }
            floatingTexts.length = 0; mutatorReset(); playerAttackMode = false; gunHold = null; playerLockTarget = null; alertActive = false;
            player.x = player.targetX = player.visualX = __open[0] - 2; player.y = player.targetY = player.visualY = __open[1]; player.fpPath = null; player.attackCooldown = 0; health = PLAYER_HITS; player.invuln = 0; };
        globalThis.__ant = (dx, dy, state) => { const e = spawnCreature({ species: 'ant', className: 'scout', level: 4, x: player.x + dx, y: player.y + (dy || 0), state: state || 'wander' }); e.health = e.maxHealth = 1e6; e.element = null; return e; };
        // frames until the player loses a hit (or n): the frame, else null
        globalThis.__bitAt = (n, each) => { const h = health; for (let i = 0; i < n; i++) { render(); if (each) each(i); if (health < h) return i; } return null; };`);
    const PLAYER_HITS_N = J('PLAYER_HITS'), SPIDER_LURK_REST = J('SPIDER_LURK.rest[0]'), SPIDER_ALPHA = J('SPIDER_LURK.alpha');

    group('THE PLAYER IS PREY (it bit only by touch, and a hit turned it on the spot the player stood on)');
    check('a creature the player shoots turns on the PLAYER (not on a copy of where the player stood), chases from 8 tiles and bites: one hit, after its wind-up', () => {
        const r = J(`(function(){ __clear(); const e = __ant(8, 0); __frames(2); playerAttackMode = true; const fired = firePlayerShot(e); let hitAt = null; for (let i = 0; i < 120 && hitAt === null; i++) { render(); if (e.lastAttacker) hitAt = i; }
            const o = { fired, isPlayer: e.lastAttacker === player, target: e.currentTarget === player, provoked: e.provoked }; let reared = false; const at = __bitAt(900, () => { if (e.attackWindup > 0 && e.biteTarget === player) reared = true; });
            o.bitAt = at; o.reared = reared; o.hp = health; e.dead = true; __frames(1); return o; })()`);
        same(r.fired, true, 'no shot'); same(r.isPlayer, true, 'its attacker is not the player'); same(r.target, true, 'it did not turn on the player'); same(r.provoked, true, 'provoked');
        ok(r.bitAt !== null, 'it never bit the player'); same(r.reared, true, 'it bit without the telegraph'); same(r.hp, PLAYER_HITS_N - 1, 'hits left');
    });
    check('in melee the player is bitten now (it felt invulnerable): a Technomancer punching an ant scout takes a hit within a few seconds unless it steps away', () => {
        const r = J(`(function(){ __clear(); invReset(); playerClassKey = null; weaponReset(); classSet('technomancer'); technoReset(); TECHNO.charge.gridEvery = 0; const e = __ant(1.2, 0, 'hunt'); e.provoked = true;
            playerAttackMode = true; playerLockTarget = e; gunHold = { x: 0, y: 0, pending: true, released: false, until: 0, button: true }; const at = __bitAt(400); gunHold = null; const o = { at, punched: e.health < e.maxHealth };
            e.dead = true; __frames(1); invReset(); playerClassKey = null; weaponReset(); return o; })()`);
        same(r.punched, true, 'no punch landed'); ok(r.at !== null && r.at < 300, 'not bitten in melee: ' + r.at);
    });
    check('DODGE: stepping out of its reach while it rears back makes it miss (DODGED over the player); it comes on after you', () => {
        const r = J(`(function(){ __clear(); const e = __ant(1.2, 0, 'hunt'); e.lastAttacker = player; e.provoked = true; let n = 0; for (; n < 200 && !(e.attackWindup > 0 && e.biteTarget === player); n++) render();
            const reared = e.attackWindup > 0; player.x = player.targetX = player.visualX = player.x - 1.6; player.fpPath = null; const h = health, d0 = Math.hypot(e.x - player.x, e.y - player.y); __frames(3);
            const o = { reared, hit: h - health, dodged: floatingTexts.some(t => t.text === 'DODGED'), cut: e.attackWindup }; __frames(30); o.closer = Math.hypot(e.x - player.x, e.y - player.y) < d0; e.dead = true; __frames(1); return o; })()`);
        same(r.reared, true, 'it never reared back'); same(r.hit, 0, 'hits taken'); same(r.dodged, true, 'no DODGED'); same(r.cut, 0, 'the wind-up went on'); same(r.closer, true, 'it did not come after the player');
    });
    check('a creature the player touches turns on the player and bites in two beats (it bit on the instant of the touch)', () => {
        const r = J(`(function(){ __clear(); const e = __ant(0.5, 0); e.update = e.update; let first = null, land = null; const h = health;
            for (let i = 0; i < 60 && land === null; i++) { player.x = player.targetX = player.visualX = e.x - 0.5; player.y = player.targetY = player.visualY = e.y; render(); if (first === null && e.attackWindup > 0 && e.biteTarget === player) first = i; if (health < h) land = i; }
            const o = { first, land, windup: COMBAT.bite.windup }; e.dead = true; __frames(1); return o; })()`);
        ok(r.first !== null, 'it never reared back at the player'); ok(r.land !== null && r.land - r.first >= r.windup - 2, 'it bit at ' + r.land + ', the wind-up began at ' + r.first);
    });
    check('it lets a prey that got away go (beyond COMBAT.prey.leash) and, with no alarm, calms down: it does not follow a player knocked back to the Crystal', () => {
        const r = J(`(function(){ __clear(); const e = __ant(3, 0); applyDamage(e, 5, { x: player.x, y: player.y, isPlayer: true }); __frames(4); const o = { on: e.currentTarget === player };
            player.x = player.targetX = player.visualX = crystal.x + 2; player.y = player.targetY = player.visualY = crystal.y; player.fpPath = null; __frames(40); o.after = [e.currentTarget === player, e.provoked, e.state]; e.dead = true; __frames(1); return o; })()`);
        same(r.on, true, 'it did not turn on the player'); same(r.after.join(), 'false,false,wander', 'after the player was far off');
    });

    group('THE WEAK FIRST (a weak player above all; the player\'s health bar is its three hits)');
    check('a calm creature leaves a healthy player alone at 2.5 tiles; the same creature comes for a player down to the last hit', () => {
        const r = J(`(function(){ const o = {}; for (const hp of [PLAYER_HITS, 1]) { __clear(); health = hp; const e = __ant(2.5, 0); e.dirX = 1; e.dirY = 0; __frames(COMBAT.prey.every * 2 + 2); o['hp' + hp] = e.currentTarget === player; e.dead = true; __frames(1); } health = PLAYER_HITS; return o; })()`);
        same(r['hp' + 3], false, 'it went for a healthy player'); same(r.hp1, true, 'it let a player down to the last hit be');
    });
    check('in a fight, of two followers beside it the weak one is picked; a player down to the last hit is picked over both; a healthy player a few tiles off is not', () => {
        const r = J(`(function(){ __clear(); alertActive = true; const [f1, f2] = followers; const e = __ant(3, 1, 'hunt'); f1.x = e.x + 1.2; f1.y = e.y; f2.x = e.x - 1.2; f2.y = e.y; f1.health = f1.maxHealth * 0.9; f2.health = f2.maxHealth * 0.3;
            player.x = player.visualX = e.x; player.y = player.visualY = e.y + 3; const name = a => a === f2 ? 'weak follower' : a === f1 ? 'healthy follower' : a === player ? 'player' : String(a);
            const o = { pick: name(predatorPickPrey(e)) }; health = 1; o.weakPlayer = name(predatorPickPrey(e)); health = PLAYER_HITS; o.healthyPlayer = name(predatorPickPrey(e)); alertActive = false; e.dead = true; __frames(1); for (const f of followers) f.health = f.maxHealth; return o; })()`);
        same(r.pick, 'weak follower', 'the pick'); same(r.weakPlayer, 'player', 'with the player down to the last hit'); same(r.healthyPlayer, 'weak follower', 'with the player healthy');
    });
    check('in a fight with nothing close or weak it still goes for the Crystal (the Crystal is not forgotten)', () => {
        const r = J(`(function(){ __clear(); alertActive = true; alertTimer = 1e6; const f = followers[0]; const e = spawnCreature({ species: 'ant', className: 'scout', level: 4, x: crystal.x + 0.6, y: crystal.y, state: 'hunt' }); e.health = e.maxHealth = 1e6; e.provoked = true;
            f.x = crystal.x + 4.5; f.y = crystal.y; f.attackCooldown = 1e6; f.moveSpeed = 0; f.baseMoveSpeed = 0; player.x = player.targetX = player.visualX = crystal.x - 7; player.y = player.targetY = player.visualY = crystal.y + 4; player.fpPath = null;
            const c0 = crystal.health; __frames(200); const o = { chewed: crystal.health < c0, target: e.currentTarget === f }; alertActive = false; alertTimer = 0; e.dead = true; __frames(1); crystal.health = crystal.maxHealth; return o; })()`);
        same(r.chewed, true, 'it never bit the Crystal'); same(r.target, false, 'it left the Crystal for a healthy follower 4 tiles off');
    });
    check('the rules are data (COMBAT.prey), every number a knob; a shot of the player\'s says it is the player\'s (isPlayer: the gun, the laser, the melee, the arc)', () => {
        const P = J('COMBAT.prey'); for (const k of ['every', 'close', 'sense', 'weakAt', 'notice', 'calmWeakAt', 'revenge', 'leash', 'near', 'weak', 'weakPlayer', 'attacker', 'keep']) ok(Number.isFinite(P[k]), 'COMBAT.prey.' + k);
        ok(P.weakPlayer > P.weak, 'a weak player is not weighted above a weak unit');
        for (const f of ['js/input.js', 'js/weapons.js', 'js/mutator.js', 'js/technomancer.js']) ok(/isPlayer: true/.test(rd(f)), f + ' does not say its hit is the player\'s');
    });

    group('SPIDERS LURK (no tag; idle behind a prop, only partly seen)');
    check('a spider of the arena wears no tag (an ant does; a spider clone of yours does)', () => {
        const r = J(`(function(){ __clear(); const s = facilitySpawnCreature('spider', __open), a = __ant(4, 0), c = makeClone('spider', 'scout', player.x + 2, player.y + 2, 'hunt'); let n = 0; const keep = drawUnitTag; drawUnitTag = function () { n++; };
            const o = {}; try { for (const [k, u] of [['spider', s], ['ant', a], ['clone', c]]) { n = 0; s.provoked = true; _drawPredatorBars(u, 400, 300, ctx); o[k] = n; } } finally { drawUnitTag = keep; } s.dead = a.dead = true; c.dead = true; c.dismissed = true; __frames(1); return o; })()`);
        same(r.spider, 0, 'tags on an arena spider'); same(r.ant, 1, 'tags on an ant'); same(r.clone, 1, 'tags on a spider clone');
    });
    check('idle, a spider goes from cover to cover: a floor tile just behind a prop of the arena (its north or west side, so the prop is drawn over part of it), where it stays a while', () => {
        const r = J(`(function(){ __clear(); const C = _fsCoverCells(), props = _fp.F.solids.filter(p => p.room === 'arena' && SPIDER_LURK.cover.includes(p.kind));
            // (behind: on a prop's west or north side, next to it, and nearer the back of the picture than the prop's front corner, so the prop is drawn after it, over it)
            const behind = C.every(c => props.some(p => { const [x0, y0, x1, y1] = p.bb, N = SPIDER_LURK.near; return c[0] + c[1] < x1 + y1 && ((c[0] < x0 && c[0] >= x0 - N && c[1] >= y0 - 0.3 && c[1] <= y1 + 0.3) || (c[1] < y0 && c[1] >= y0 - N && c[0] >= x0 - 0.3 && c[0] <= x1 + 0.3)); }));
            const s = facilitySpawnCreature('spider', __open); let at = null; for (let i = 0; i < 3000 && at === null; i++) { render(); if (spiderLurking(s)) at = i; }
            const t = s.wanderTarget, o = { cells: C.length, behind, at, cover: !!t && t.lurk && C.some(c => c[0] === t.x && c[1] === t.y), rest: t ? t.rest : 0 }; __frames(200); o.still = spiderLurking(s); s.dead = true; __frames(1); return o; })()`);
        ok(r.cells >= 6, 'cover tiles: ' + r.cells); same(r.behind, true, 'a cover tile is not behind a prop'); ok(r.at !== null, 'it never reached cover'); same(r.cover, true, 'what it went to is not cover');
        same(r.still, true, 'it did not stay'); ok(r.rest >= SPIDER_LURK_REST, 'it stays ' + r.rest + ' frames');
    });
    check('lurking it is only partly seen: drawn faint (SPIDER_LURK.alpha), with no bar over it and no glow under it in the dark; the auto-lock passes it by', () => {
        const r = J(`(function(){ __clear(); const s = facilitySpawnCreature('spider', __open); for (let i = 0; i < 3000 && !spiderLurking(s); i++) render();
            let spot = null; for (const [k, c] of _fp.cellsP) { const d = Math.hypot(c[0] - s.x, c[1] - s.y); if (d >= 2 && d <= 4 && _fpLos(c[0], c[1], s.x, s.y)) { spot = c; break; } }   // (where the player can see it: from behind its prop it is out of sight anyway)
            player.x = player.targetX = player.visualX = spot[0]; player.y = player.targetY = player.visualY = spot[1]; player.fpPath = null; render();
            let alpha = null, bars = 0, glow = 0; const kb = drawBug3D, kbar = drawHealthBar; drawBug3D = function (a, px, py, g) { alpha = g.globalAlpha; return kb.apply(this, arguments); }; drawHealthBar = function () { bars++; };
            const o = { lurking: spiderLurking(s) }; try { ctx.globalAlpha = 1; _drawPredator(s, 400, 300, ctx); } finally { drawBug3D = kb; drawHealthBar = kbar; }
            o.alpha = alpha; o.bars = bars; facilityBlackoutSet(true); const kg = ctx.createRadialGradient; ctx.createRadialGradient = function () { glow++; return kg.apply(this, arguments); }; try { facilityEnemyGlow(s, 400, 300); } finally { ctx.createRadialGradient = kg; facilityBlackoutSet(false); } o.glow = glow;
            o.locked = targetNearest() === s; s.provoked = true; o.out = [spiderLurking(s), targetNearest() === s]; s.dead = true; __frames(1); return o; })()`);
        same(r.lurking, true, 'it is not lurking'); ok(Math.abs(r.alpha - SPIDER_ALPHA) < 0.01, 'drawn at alpha ' + r.alpha); same(r.bars, 0, 'its bars were drawn'); same(r.glow, 0, 'it glows in the dark');
        same(r.locked, false, 'the auto-lock took it'); same(r.out.join(), 'false,true', 'provoked, it is out (seen and locked)');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
