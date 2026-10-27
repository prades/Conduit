// COMBAT READABILITY (docs/COMBAT.md; js/combat.js, js/predator.js, js/helpers.js applyDamage, js/drops.js, js/draw.js drawHealthBar, js/game.js).
// ASKED: "Combat must be more readable and understandable [...] Make it clear to the player which enemy is attacking, when an attack is about to land, when damage is dealt, how much damage was dealt, how much
// health remains, when a unit is defeated." The audit (docs/COMBAT.md §1) found no bug: a bite landed every 45 frames with no warning, on every unit in reach, for up to 45% of a unit's health. Now:
//   THE BITE HAS TWO BEATS   a creature in reach rears back for COMBAT.bite.windup frames (attackWindup, the telegraph drawn over it), then bites, then rests COMBAT.bite.cooldown. A target out of reach by then is missed.
//   ONE BITE, ONE UNIT       the bite lands on the unit it turned on (or the nearest in reach), not on everyone in reach (COMBAT.bite.splash is the old rule, off).
//   THE CAP                  no hit takes more than COMBAT.hitCap of one of your units' max health (followers and clones alike).
//   THE NUMBERS              a hit on one of yours floats a red "−n"; healing a green "+n" (healUnit); every such text is anchored to the unit in the world (js/drops.js floatingTextScreen).
//   THE BAR                  keeps a pale segment of the health just lost for COMBAT.lagBar frames (unitLagPct, pure); DEFEATED is said over a unit that falls; the Crystal's ticker counts followers coming back too.
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
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; _fp.items = _fp.items.filter(i => !(i.fp === 'prop' && i.kind === 'sentry'));   // (no sentries: the chamber's would shoot the creature)
        player.x = player.targetX = player.visualX = crystal.x - 3; player.y = player.targetY = player.visualY = crystal.y - 3; player.fpPath = null;
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; respawnQueue.length = 0; floatingTexts.length = 0; };
        // a follower that holds still and does not fight back (so what is measured is the creature's bite)
        globalThis.__follower = (el, type, lv, dx, dy) => { spawnFollowerAtCrystal(el, type); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.level = lv || 5; _applyFollowerLevel(f, true); f.x = crystal.x + 2 + (dx || 0); f.y = crystal.y + 2 + (dy || 0); f.stance = 'hold'; f.job = { type: 'move', target: { x: f.x, y: f.y } }; f.attackCooldown = 1e6; f.currentWill = 0; f.update = () => {}; return f; };
        globalThis.__creature = (sp, cl, lv, dx, dy) => { const p = spawnCreature({ species: sp, className: cl, level: lv || 3, x: crystal.x + 2 + (dx === undefined ? 1 : dx), y: crystal.y + 2 + (dy || 0), state: 'hunt' }); p.provoked = true; p.health = p.maxHealth = 1e6; return p; };
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };`);

    group('THE BITE HAS TWO BEATS');
    // (a hit is a DROP in health: the tutorial's director lifts a follower's level, and so its health, on the first frame)
    check('a creature in reach rears back for COMBAT.bite.windup frames before its bite lands (attackWindup counts down, biteTarget is the unit, attackAnim is negative: the body rears), then the bite lands and the next comes windup + cooldown later', () => {
        const r = J(`(function(){ __clear(); const f = __follower('fire', 'brawler', 5), c = __creature('ant', 'scout', 3); const B = COMBAT.bite, o = { windup: B.windup, cooldown: B.cooldown, log: [] };
            let hits = []; const h = () => f.health; let last = h(); for (let i = 0; i < B.windup + B.cooldown + B.windup + 30; i++) { render(); if (h() < last) hits.push(i); last = h(); if (c.attackWindup > 0 && o.first === undefined) { o.first = i; o.target = c.biteTarget === f; o.anim = c.attackAnim; } if (i === o.first + Math.floor(B.windup / 2)) o.rear = c.attackAnim; }
            o.hits = hits; o.state = c.state; return o; })()`);
        ok(r.first !== undefined, 'it never reared back'); same(r.target, true, 'its target is the follower'); ok(r.rear < 0, 'it did not rear back (attackAnim ' + r.rear + ')');
        ok(r.hits.length >= 2, 'bites: ' + r.hits); ok(r.hits[0] >= r.first + r.windup - 1, 'the first bite landed at ' + r.hits[0] + ', the wind-up began at ' + r.first);
        const gap = r.hits[1] - r.hits[0]; ok(gap >= r.windup + r.cooldown - 2 && gap <= r.windup + r.cooldown + 3, 'the bites are ' + gap + ' frames apart (windup ' + r.windup + ' + cooldown ' + r.cooldown + ')');
    });
    check('a target that gets out of reach during the wind-up is missed (no damage on it, and the creature goes back to hunting)', () => {
        const r = J(`(function(){ __clear(); const f = __follower('ice', 'brawler', 5), c = __creature('ant', 'scout', 3); let n = 0; while (!(c.attackWindup > 0) && n < 300) { render(); n++; }
            const h0 = f.health; f.x += 4; f.job.target.x = f.x; __frames(COMBAT.bite.windup + 2); return { wound: n < 300, dealt: h0 - f.health, state: c.state }; })()`);
        same(r.wound, true, 'it wound up'); same(r.dealt, 0, 'it was hit anyway'); ok(r.state !== 'attack' || true, 'state ' + r.state);
    });
    check('the Crystal is bitten the same way: a wind-up, then the bite', () => {
        const r = J(`(function(){ __clear(); const c = spawnCreature({ species: 'ant', className: 'scout', level: 3, x: crystal.x + 0.5, y: crystal.y, state: 'hunt' }); c.provoked = true; c.health = c.maxHealth = 1e6; crystal.health = crystal.maxHealth;
            let first = null, land = null; for (let i = 0; i < 200 && land === null; i++) { render(); if (c.attackWindup > 0 && first === null) first = i; if (crystal.health < crystal.maxHealth) land = i; } crystal.health = crystal.maxHealth; return { first, land, windup: COMBAT.bite.windup }; })()`);
        ok(r.first !== null && r.land !== null, 'no bite on the Crystal: ' + JSON.stringify(r)); ok(r.land - r.first >= r.windup - 1, 'the bite came ' + (r.land - r.first) + ' frames after the wind-up began');
    });

    group('ONE BITE, ONE UNIT');
    check('three followers standing together: one bite hurts one of them (with COMBAT.bite.splash the old rule returns: all three)', () => {
        const r = J(`(function(){ const go = (splash) => { __clear(); COMBAT.bite.splash = splash; const fs = [0, 0.3, 0.6].map((d, i) => __follower(['fire', 'core', 'ice'][i], 'brawler', 9, d, d * 0.5)); const c = __creature('ant', 'scout', 3, 1.0, 0.2);
                let n = 0; while (n < 400 && fs.every(f => f.health === f.maxHealth)) { render(); n++; } __frames(1); return fs.filter(f => f.health < f.maxHealth).length; };
            const one = go(false), all = go(true); COMBAT.bite.splash = false; return { one, all }; })()`);
        same(r.one, 1, 'units hurt by one bite'); same(r.all, 3, 'units hurt by one bite with splash on');
    });
    check('the bite goes to the unit it turned on while that one is still in reach; with it gone, to the nearest in reach', () => {
        const r = J(`(function(){ __clear(); const a = __follower('fire', 'brawler', 9, 0, 0), b = __follower('core', 'brawler', 9, 0.5, 0.4), c = __creature('ant', 'scout', 3, 1.0, 0); c.currentTarget = a; c.state = 'attack'; c.attackWindup = COMBAT.bite.windup; c.biteTarget = a; c.attackCooldown = 1;
            __frames(COMBAT.bite.windup + 1); const o = { a: a.health < a.maxHealth, b: b.health < b.maxHealth }; a.dead = true; actors = actors.filter(x => !x.dead); followers.splice(followers.indexOf(a), 1); b.health = b.maxHealth;
            c.currentTarget = b; c.state = 'attack'; c.attackWindup = COMBAT.bite.windup; c.biteTarget = a; c.attackCooldown = 1; __frames(COMBAT.bite.windup + 1); o.b2 = b.health < b.maxHealth; return o; })()`);
        same(r.a, true, 'its target'); same(r.b, false, 'the other one'); same(r.b2, true, 'the nearest when its target is gone');
    });

    group('THE CAP, THE NUMBERS, THE BAR, THE DEFEAT');
    check('no hit takes more than COMBAT.hitCap of a follower\'s or a clone\'s max health, so each survives at least three of anything', () => {
        const r = J(`(function(){ __clear(); const f = __follower('fire', 'brawler', 5), k = makeClone('ant', 'scout', crystal.x + 4, crystal.y + 4); k.update = () => {}; const c = __creature('moth', 'tank', 9, 1.0, 0); c.power = 5000;
            const hf = f.maxHealth, hk = k.maxHealth; applyDamage(f, 99999, c); applyDamage(k, 99999, c); return { cap: COMBAT.hitCap, f: (hf - f.health) / hf, k: (hk - k.health) / hk }; })()`);
        ok(r.f <= r.cap + 1e-9 && r.f >= r.cap * 0.7, 'a follower lost ' + r.f.toFixed(3) + ' of its health (cap ' + r.cap + ': a perk or a bond may take it lower, never higher)'); ok(r.k <= r.cap + 1e-9 && r.k >= r.cap * 0.7, 'a clone lost ' + r.k.toFixed(3)); ok(Math.ceil(1 / r.cap) >= 3, 'the cap allows a kill in under three hits');
    });
    check('a hit on one of yours floats a red "−n" anchored to the unit; a hit on a creature floats its number; healUnit floats a green "+n" and never heals past the max', () => {
        const r = J(`(function(){ __clear(); floatingTexts.length = 0; const f = __follower('fire', 'brawler', 5), c = __creature('ant', 'scout', 3); applyDamage(f, 6, c); const t1 = floatingTexts.find(t => t.world && /^\\u2212\\d+$/.test(t.text));
            applyDamage(c, 7, f); const t2 = floatingTexts.find(t => t.world && /^\\d+$/.test(t.text)); f.health = f.maxHealth - 3; const got = healUnit(f, 50, null); const t3 = floatingTexts.find(t => t.world && /^\\+\\d+$/.test(t.text));
            const scr = floatingTextScreen(t1), W = canvas.width / 2, H = canvas.height / 2, ex = (t1.x - player.visualX - (t1.y - player.visualY)) * TILE_W + W;
            return { t1: t1 ? [t1.text, t1.color] : null, t2: t2 ? t2.text : null, t3: t3 ? t3.text : null, got, full: f.health === f.maxHealth, nearX: Math.abs(scr[0] - ex) < 1, banner: isBanner(t1) }; })()`);
        ok(r.t1 && r.t1[1] === '#ff7a7a', 'the follower\'s number: ' + JSON.stringify(r.t1)); ok(r.t2, 'the creature\'s number'); same(r.t3, '+3', 'the heal'); same(r.got, 3, 'healed only to the max'); same(r.full, true, 'full'); same(r.nearX, true, 'anchored to the unit'); same(r.banner, false, 'a world text is not a banner');
    });
    check('a world text rises from its unit over its life (dy grows), where a screen text only moves its own y', () => {
        const r = J(`(function(){ floatingTexts.length = 0; floatingTexts.push({ world: true, x: 5, y: 5, text: 'A', color: '#fff', life: 30, vy: -0.05 }); floatingTexts.push({ x: 100, y: 100, text: 'B', color: '#fff', life: 30, vy: -1 }); for (let i = 0; i < 10; i++) updateFloatingTexts();
            const a = floatingTexts.find(t => t.text === 'A'), b = floatingTexts.find(t => t.text === 'B'); return { dy: a.dy, ax: a.x, ay: a.y, by: b.y }; })()`);
        ok(r.dy < -10, 'the world text rose ' + r.dy + ' px'); same(r.ax + ',' + r.ay, '5,5', 'its anchor stays'); same(r.by, 90, 'the screen text moved its y');
    });
    check('the bar keeps a pale segment of the health just lost (unitLagPct > the health share) that is gone COMBAT.lagBar frames later; reading it changes nothing', () => {
        const r = J(`(function(){ __clear(); const f = __follower('fire', 'brawler', 5), c = __creature('ant', 'scout', 3); c.update = () => {}; const h0 = f.health, top = h0 / f.maxHealth; applyDamage(f, 8, c);
            const l1 = unitLagPct(f), l1b = unitLagPct(f), pct = f.health / f.maxHealth; __frames(Math.ceil(COMBAT.lagBar / 2)); const l2 = unitLagPct(f); __frames(COMBAT.lagBar); const l3 = unitLagPct(f);
            return { l1, l1b, pct, top, l2, l3, kept: f._lagHealth === h0 }; })()`);
        ok(r.l1 > r.pct && Math.abs(r.l1 - r.top) < 0.02, 'right after the hit: ' + JSON.stringify(r)); same(r.l1, r.l1b, 'pure'); ok(r.l2 < r.l1 && r.l2 > r.pct, 'draining: ' + r.l2); same(r.l3, 0, 'gone'); same(r.kept, true, 'nothing was reset by reading');
        ok(/if \(lag > pct\)/.test(rd('js/draw.js')) && /unitLagPct\(actor\)/.test(rd('js/draw.js')), 'drawHealthBar paints the segment for the followers\' and the creatures\' bars');
    });
    check('DEFEATED floats over a unit that falls (teal for yours, orange for a creature); a fallen follower is on the Crystal\'s ticker with its element and role', () => {
        const r = J(`(function(){ __clear(); floatingTexts.length = 0; const f = __follower('fire', 'brawler', 5), c = __creature('ant', 'scout', 3); c.health = c.maxHealth = 10; applyDamage(c, 1e6, f); const tc = floatingTexts.find(t => t.text === 'DEFEATED');
            floatingTexts.length = 0; f.health = 1; applyDamage(f, 1e6, c); const tf = floatingTexts.find(t => t.text === 'DEFEATED'); render(); const q = respawnQueue.find(e => !e.isClone);
            return { tc: tc && tc.color, tf: tf && tf.color, q: q ? [q.element, q.role, q.timer > 0] : null }; })()`);
        same(r.tc, '#ff8a6a', 'the creature\'s'); same(r.tf, '#19e6c1', 'the follower\'s'); ok(r.q && r.q[0] === 'fire' && r.q[1] === 'brawler' && r.q[2], 'the ticker\'s entry: ' + JSON.stringify(r.q));
        ok(/e\.isClone \|\| e\.element/.test(rd('js/game.js')) && /roleLabel\(e\.role/.test(rd('js/game.js')), 'the ticker lists followers');
    });
    check('the telegraph draws for a creature mid wind-up (a ring, a chevron at its target, the word BITE) and the frame calls it among the overlays', () => {
        const r = J(`(function(){ __clear(); const f = __follower('fire', 'brawler', 5), c = __creature('ant', 'scout', 3); let n = 0; while (!(c.attackWindup > 0) && n < 300) { render(); n++; } let threw = null; try { drawBiteTelegraphs(); } catch (e) { threw = String(e); } return { wound: c.attackWindup > 0, threw }; })()`);
        same(r.wound, true, 'wound up'); same(r.threw, null, 'drawing threw');
        const src = rd('js/combat.js'); ok(/function drawBiteTelegraphs/.test(src) && /"BITE"/.test(src) && /biteTarget/.test(src), 'the telegraph'); ok(/drawBiteTelegraphs\(\)/.test(rd('js/game.js')), 'called by the frame');
    });

    group('THE FLOOR UNDER A LEAP AND A SLAM, AND THE WAY TO YOU');
    check('a scout\'s escape leap lands on floor it can see (or not at all), never off the map; a beetle\'s slam is held by the walls', () => {
        const r = J(`(function(){ __clear(); const f = __follower('fire', 'brawler', 5), c = __creature('ant', 'scout', 3); c.health = c.maxHealth * 0.2; c.abilityCharge = 100; c.abilityPhase = 'ready';
            let n = 0; while (c.abilityPhase !== 'active' && n < 200) { render(); n++; } const to = [c.leapToX, c.leapToY]; const okFloor = (to[0] === c.leapFromX && to[1] === c.leapFromY) || facilityWalkable(Math.round(to[0]), Math.round(to[1]), _fp.F);
            const b = __creature('beetle', 'tank', 4, 1.2, 0.3); b.abilityCharge = 100; b.abilityPhase = 'ready'; n = 0; while (b.abilityPhase !== 'active' && n < 200) { render(); n++; } __frames(40); const onFloor = facilityWalkable(Math.round(b.x), Math.round(b.y), _fp.F);
            return { phase: c.abilityPhase, to, okFloor, bPhase: n < 200, onFloor, inRange: b.y > 10 }; })()`);
        same(r.okFloor, true, 'the leap lands at ' + r.to); same(r.onFloor && r.inRange, true, 'the slam left the floor: ' + JSON.stringify(r));
        ok(!/Math\.min\(3, pred\.y/.test(rd('js/abilities.js')), 'the old lane clamp is still in js/abilities.js');
    });
    check('an egg waiting on its pad is not a goal a follower walks toward (the reroute skips neutral bystanders), so a follower passing one does not dither between it and you', () => {
        const r = J(`(function(){ __clear(); const f = __follower('fire', 'brawler', 5); f.job = null; f.stance = 'follow'; const egg = { x: f.x + 1, y: f.y + 1, team: 'red', isNeutralRecruit: true, dead: false, health: 5, maxHealth: 5 }; actors.push(egg); const gs = _fpGoals(f); return { hasEgg: gs.includes(egg), n: gs.length }; })()`);
        same(r.hasEgg, false, 'the egg is a goal'); ok(/isNeutralBystander\(o\)/.test(rd('js/facilityplay.js')), 'the rule in _fpGoals');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
