// THE FOLLOWER COMBAT REDESIGN (the owner's brief "CONDUIT — FOLLOWER COMBAT REDESIGN · Fire & Electric Follower Attack Implementation Brief", 2026-11-02; docs/FOLLOWER-COMBAT-REDESIGN.md).
// The brief's Phase 3 list: QUILLSTONE (QUILL BURST: exactly five quills, at once, each on its own, stopping at the first enemy, no piercing, no splash), EMBER HOOD (FIREBALL; HEXFIRE's circle
// placed, stationary, its duration and damage, never growing or travelling), STATIC ORB (SONIC ROLL kept; PINBALL: the nearest targets, never one twice, ending, never looping), THUNDERHEAD
// (CHAIN LIGHTNING by distance: clusters chain further, a gap breaks it; STATIC VORTEX: stationary, pulling in, biting on), and HOVER SHELL with its KINETIC LAUNCHER unchanged.
// (The THERMITE BURROWER's BURROW STRIKE and FAULTLINE are the next build's, and get their checks with it.) Every number read here is the code's own, PROVISIONAL constant.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
const rd = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; facilityBlackoutSet(false); unlockedElements = new Set(ELEMENTS.map(e => e.id)); TUT.followerLevel = 0;`);
    // An open patch of the arena's floor (the cell with the most floor round it), the player off to one side; creatures that hold still and do not die; a follower of a form at level 20.
    run(`(function(){ const cells = partyRoomCells('arena'), set = new Set(cells.map(c => c[0] + ',' + c[1])); let best = null, bn = -1;
        for (const [x, y] of cells) { let n = 0; for (let dx = -6; dx <= 6; dx++) for (let dy = -6; dy <= 6; dy++) if (set.has((x + dx) + ',' + (y + dy))) n++; if (n > bn) { bn = n; best = [x, y]; } }
        globalThis.__C = [best[0] + 0.5, best[1] + 0.5]; player.x = player.visualX = __C[0] - 8; player.y = player.visualY = __C[1]; })();
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k] = []; followerProjectiles.length = 0; elementEffects.length = 0; floatingTexts.length = 0; frame++; };
        globalThis.__foe = (x, y, sp) => { const S = SPECIES[sp || 'ant'], p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.speciesName = sp || 'ant'; p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
        globalThis.__fol = (el, role, evo) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.evolved = evo || undefined; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.stance = 'hold'; f.x = __C[0]; f.y = __C[1]; return f; };
        globalThis.__off = f => { actors = actors.filter(a => a !== f); followers = followers.filter(a => a !== f); };   // (out of the world: its own AI and melee add nothing; its shots and fields keep it as their source)
        globalThis.__dmg = p => 1e6 - p.health;
        globalThis.__fire = f => { frame++; f._sigCd = 1; evolutionTick(); };
        globalThis.__one = (f, x, y, sp) => { const twin = __foe(x, y, sp); return twin; };`);

    // ── QUILLSTONE ──────────────────────────────────────────
    group('QUILLSTONE (fire Brawler): QUILL BURST, five crystal quills at once, each stopping at the first enemy it hits; its main attack and FIRE BOMBS kept');
    check('EXACTLY five quills, all launched at once (the same frame, from the Quillstone), in a forward fan QUILL_FAN degrees edge to edge with the middle one at the nearest enemy', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'), t = __foe(f.x + 3, f.y + 1); __fire(f);
            const q = followerProjectiles.filter(p => p.kind === 'quill'), a0 = Math.atan2(t.y - f.y, t.x - f.x) * 180 / Math.PI, ang = q.map(p => Math.atan2(p.vy, p.vx) * 180 / Math.PI - a0);
            return { n: q.length, all: followerProjectiles.length, born: q.every(p => p.frame === 0 && p.x === f.x && p.y === f.y && p.source === f), ang, fan: QUILL_FAN, count: QUILL_COUNT, cd: f._sigCd, every: QUILL_EVERY }; })()`);
        same(r.count, 5, 'QUILL_COUNT (approved: exactly five)'); same(r.n, 5, 'quills'); same(r.all, 5, 'shots in all'); ok(r.born, 'not all launched together from the Quillstone');
        const s = r.ang.slice().sort((a, b) => a - b); ok(Math.abs(s[0] + r.fan / 2) < 1e-6 && Math.abs(s[4] - r.fan / 2) < 1e-6 && Math.abs(s[2]) < 1e-6, 'the fan: ' + JSON.stringify(s));
        for (let i = 1; i < 5; i++) ok(Math.abs(s[i] - s[i - 1] - r.fan / 4) < 1e-6, 'evenly spread: ' + JSON.stringify(s));
        same(r.cd, r.every, 'its wait');
    });
    check('each quill travels on its own: its own heading and speed, the follower shots\' flight, as far as QUILL_RANGE and no farther', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'); __foe(f.x + 3, f.y); __fire(f); __off(f); actors = actors.filter(a => !(a instanceof Predator));
            const q = followerProjectiles.filter(p => p.kind === 'quill'), s0 = q.map(p => [p.x, p.y]); let fr = 0; while (followerProjectiles.length && fr < 200) { render(); fr++; }
            const far = q.map((p, i) => Math.hypot(p.x - s0[i][0], p.y - s0[i][1]));
            return { speeds: q.map(p => Math.hypot(p.vx, p.vy)), heads: new Set(q.map(p => Math.round(Math.atan2(p.vy, p.vx) * 1000))).size, far, range: QUILL_RANGE, speed: QUILL_SPEED, left: followerProjectiles.length }; })()`);
        same(r.heads, 5, 'five headings'); ok(r.speeds.every(v => Math.abs(v - r.speed) < 1e-9), 'speeds ' + r.speeds); same(r.left, 0, 'quills still flying');
        ok(r.far.every(d => d >= r.range - 1e-6 && d <= r.range + r.speed + 1e-6), 'how far each flew with nothing in the way: ' + r.far);
    });
    check('each stops at the FIRST enemy it touches: no piercing (an enemy in line behind the first takes no quill), no explosion, no fragment splash (all the damage is the quills\' own hits, one a quill)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'), front = __foe(f.x + 2, f.y), behind = __foe(f.x + 3.3, f.y), off = __foe(f.x + 2.6, f.y + 2.8); __fire(f); __off(f);
            const q = followerProjectiles.filter(p => p.kind === 'quill'), hits = [], dmg = [];
            for (const p of q) { const o = p.onHit; p.onHit = a => { hits.push([q.indexOf(p), a === front ? 'front' : a === behind ? 'behind' : a === off ? 'off' : 'other']); if (o) o(a); }; }
            const keep = applyDamage; globalThis.applyDamage = function (t, amt, src) { dmg.push(t === front ? 'front' : t === behind ? 'behind' : t === off ? 'off' : 'other'); return keep.apply(this, arguments); };
            let fr = 0; try { while (followerProjectiles.length && fr < 200) { render(); fr++; } } finally { globalThis.applyDamage = keep; }
            const twin = __foe(f.x + 40, f.y + 40); applyDamage(twin, f.power * QUILL_MULT, f, null, false, false, DMG_HIT_ALT);
            return { hits, dmg, d: [__dmg(front), __dmg(behind), __dmg(off)], one: __dmg(twin), fx: elementEffects.map(e => e.type) }; })()`);
        ok(r.hits.length >= 1 && r.hits.length <= 5, 'quill hits: ' + JSON.stringify(r.hits));
        same(new Set(r.hits.map(h => h[0])).size, r.hits.length, 'a quill hit twice (it pierced)'); ok(r.hits.every(h => h[1] === 'front'), 'a quill passed the front enemy: ' + JSON.stringify(r.hits));
        same(r.d[1], 0, 'the enemy behind took damage'); same(r.d[2], 0, 'the enemy beside the fan took damage');
        same(r.dmg.length, r.hits.length, 'damage beyond the quills\' own hits (an explosion or a splash): ' + JSON.stringify(r.dmg));
        ok(Math.abs(r.d[0] - r.hits.length * r.one) < 1e-6 * r.d[0] + 1e-6, 'a quill\'s hit is power × QUILL_MULT through the damage system: ' + JSON.stringify(r));
        ok(!r.fx.some(t => /impact|splash|explo/i.test(t)), 'an impact or splash effect: ' + r.fx);
    });
    check('a cluster catches several quills and spread-out enemies fewer: five enemies across the fan take one each; one enemy close up takes them all', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'), out = {};
            const near = __foe(f.x + 1.0, f.y); __fire(f); __off(f); { let fr = 0; while (followerProjectiles.length && fr < 200) { render(); fr++; } } out.close = __dmg(near); near.dead = true;
            frame++; followers.push(f); actors.push(f); const ps = [-20, -10, 0, 10, 20].map(d => { const R = d ? 3.9 : 3.8, an = (90 + d) * Math.PI / 180; return __foe(f.x + Math.cos(an) * R, f.y + Math.sin(an) * R); });   // (the middle one the nearest, so the fan is aimed at it; the fan down the floor's y, its quills spread along x, where a shot's touch is narrowest: js/game.js tests 30 px of (dx × TILE_W, dy × TILE_H))
            __fire(f); __off(f); { let fr = 0; while (followerProjectiles.length && fr < 200) { render(); fr++; } } out.spread = ps.map(__dmg);
            const twin = __foe(f.x + 40, f.y + 40); applyDamage(twin, f.power * QUILL_MULT, f, null, false, false, DMG_HIT_ALT); out.one = __dmg(twin); return out; })()`);
        ok(Math.abs(r.close - 5 * r.one) < 1e-6 * r.close + 1e-6, 'close up, five quills in one enemy: ' + JSON.stringify(r));
        ok(r.spread.every(d => Math.abs(d - r.one) < 1e-6 * d + 1e-6), 'across the fan, a quill each: ' + JSON.stringify(r));
    });
    check('nobody in reach: no quills and no wait spent; QUILL BURST stays its default move and FIRE BOMBS a choice on INFO; its main attack (the Brawler\'s plain hit, Piercing) is kept', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'); __foe(f.x + QUILL_RANGE + 0.6, f.y); __fire(f);
            return { n: followerProjectiles.length, cd: f._sigCd, ids: evoMoveIds(EVOLUTIONS.quillstone), def: evoMoveOf(f).id, info: followerInfo(f).attacks.filter(s => s.choices).map(s => s.choices.map(c => c.label)), main: DMG_FORM.quillstone.main, alt: DMG_FORM.quillstone.alt, shot: EVOLUTIONS.quillstone.shot || null }; })()`);
        same(r.n, 0, 'quills at an enemy out of reach'); ok(r.cd <= 0, 'a wait for nothing: ' + r.cd);
        same(r.ids.join(), 'quill_burst,bomb_lob', 'its moves'); same(r.def, 'quill_burst', 'its default'); same(JSON.stringify(r.info), JSON.stringify([['QUILL BURST', 'FIRE BOMBS']]), 'the INFO choice');
        same(r.main, 'piercing', 'its main attack\'s type'); same(r.alt, 'projectile', 'QUILL BURST\'s type'); same(r.shot, null, 'a shot of its own (a Brawler has none)');
    });

    // ── EMBER HOOD ──────────────────────────────────────────
    group('EMBER HOOD (fire Mage): FIREBALL, the direct shot; HEXFIRE, a shot that leaves a stationary burning circle, enemies only');
    check('FIREBALL is its everyday shot: the Mages\' fire projectile at the nearest enemy, SP.ATK × MAGE_SHOT_MULT, a plain hit (no effect of its own), named FIREBALL on INFO', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'sniper', 'embercowl'), t = __foe(f.x + 3.5, f.y); f.attackCooldown = 0; f._sigCd = 1e9;
            let fr = 0; while (!followerProjectiles.length && fr < 120) { frame++; updateNPC(f); fr++; }
            const p = followerProjectiles[0], i = followerInfo(f).attacks.find(s => /^MAIN ATTACK/.test(s.h));
            return { got: !!p, el: p && p.element, kind: p ? p.kind || null : null, onHit: p ? !!p.onHit : null, hit: p && p.hit === DMG_HIT_SHOT, dmg: p && p.damage, want: f.stats.specialAttack * MAGE_SHOT_MULT, shot: EVOLUTIONS.embercowl.shot, info: i && i.h }; })()`);
        ok(r.got, 'no shot'); same(r.el, 'fire', 'its element'); same(r.kind, null, 'a special look (it is the fire shot, drawn as a fireball)'); same(r.onHit, false, 'an effect of its own'); ok(r.hit, 'not the Mages\' shot');
        ok(Math.abs(r.dmg - r.want) < 1e-9, 'damage ' + r.dmg + ' not ' + r.want); same(r.shot, 'FIREBALL', 'its name'); same(r.info, 'MAIN ATTACK · FIREBALL', 'INFO');
    });
    check('HEXFIRE: one shot at the nearest enemy in reach, doing no damage itself; where it lands, a circle HALO_RADIUS tiles round that bites every enemy in it at once and every HALO_TICK frames, then is gone after HALO_LIFE frames', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'sniper', 'embercowl'), t = __foe(f.x + 5, f.y + 0.5); __fire(f); __off(f);
            const shot = followerProjectiles.find(p => p.kind === 'hex'); let fr = 0, c = null; while (!c && fr < 200) { render(); fr++; c = elementEffects.find(e => e.type === 'hexfire'); }
            const at = c && { x: c.x, y: c.y, r: c.radius, life: c.life, maxLife: c.maxLife }, first = __dmg(t), bites = []; let last = first, k = 0;
            while (elementEffects.some(e => e.type === 'hexfire') && k < 400) { render(); k++; const d = __dmg(t); if (d !== last) { bites.push(k); last = d; } }
            const twin = __foe(f.x + 40, f.y + 40); applyDamage(twin, f.power * HALO_BITE, f, 'fire', false, false, DMG_HIT_ALT);
            return { shot: shot ? shot.damage : null, landed: fr, at, t: [t.x, t.y], first, bites, after: k, one: __dmg(twin), r: HALO_RADIUS, tick: HALO_TICK, life: HALO_LIFE }; })()`);
        same(r.shot, 0, 'the shot\'s own damage'); ok(r.at, 'no circle');
        ok(Math.hypot(r.at.x - r.t[0], r.at.y - r.t[1]) < 1.1, 'not where it landed on the enemy: ' + JSON.stringify(r)); same(r.at.r, r.r, 'its radius');
        ok(Math.abs(r.first - r.one) < 1e-6 * r.one + 1e-6, 'it bit at once as it landed: ' + JSON.stringify(r));
        ok(r.bites.length >= 6 && r.bites.every((b, i) => i === 0 || b - r.bites[i - 1] === r.tick), 'a bite every ' + r.tick + ' frames: ' + JSON.stringify(r.bites));
        ok(r.after <= r.life + 2 && r.after >= r.life - 2, 'it lasted ' + r.after + ' frames, not ' + r.life);
    });
    check('the circle is STATIONARY: it never travels and never grows, a creature walking out of it is no longer bitten, and one walking into it is', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'sniper', 'embercowl'), t = __foe(f.x + 5, f.y); __fire(f); __off(f);
            let fr = 0, c = null; while (!c && fr < 200) { render(); fr++; c = elementEffects.find(e => e.type === 'hexfire'); }
            const x0 = c.x, y0 = c.y, r0 = c.radius, late = __foe(c.x + 6, c.y); let moved = false;
            for (let i = 0; i < 40; i++) { render(); if (c.x !== x0 || c.y !== y0 || c.radius !== r0) moved = true; }
            t.x = c.x + 3; const out0 = __dmg(t); late.x = c.x + 0.3; const in0 = __dmg(late);
            for (let i = 0; i < 70; i++) { render(); if (c.x !== x0 || c.y !== y0 || c.radius !== r0) moved = true; }
            return { moved, outAfter: __dmg(t) - out0, inAfter: __dmg(late) - in0 }; })()`);
        same(r.moved, false, 'the circle moved or grew'); same(r.outAfter, 0, 'bitten after leaving it'); ok(r.inAfter > 0, 'not bitten after walking in');
    });
    check('enemies only (unlike FIRE BOMBS\' burning ground): a follower and the player in the circle take nothing; a new HEXFIRE takes the place of the same Ember Hood\'s last circle', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'sniper', 'embercowl'), t = __foe(f.x + 5, f.y), mate = __fol('fire', 'brawler', null); mate.x = t.x + 0.4; mate.y = t.y; mate.stance = 'hold';
            const mh = mate.health; __fire(f); __off(f); __off(mate);
            let fr = 0, c = null; while (!c && fr < 200) { render(); fr++; c = elementEffects.find(e => e.type === 'hexfire'); }
            const ph = health, px = player.x, py = player.y; player.x = c.x - 0.3; player.y = c.y;
            for (let i = 0; i < 100; i++) render(); const out = { mate: mh - mate.health, player: ph - health };
            player.x = px; player.y = py;
            followers.push(f); actors.push(f); __fire(f); __off(f); fr = 0; let n2 = 0; while (fr < 200) { render(); fr++; const cs = elementEffects.filter(e => e.type === 'hexfire' && e.by === f); n2 = Math.max(n2, cs.length); if (cs.length && cs[0] !== c) break; }
            out.circles = elementEffects.filter(e => e.type === 'hexfire' && e.by === f).length; out.most = n2; return out; })()`);
        same(r.mate, 0, 'the follower in it was hurt'); same(r.player, 0, 'the player in it was hurt'); same(r.circles, 1, 'circles of one Ember Hood'); same(r.most, 1, 'two at once');
    });
    check('a shot that touches nobody lands where it was aimed and leaves its circle there; the retired Cinder Halo shares the move; HEXFIRE and FIRE BOMBS stay the INFO choice', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'sniper', 'embercowl'), t = __foe(f.x + 5, f.y); __fire(f); __off(f); const aim = [t.x, t.y]; t.x += 30;
            let fr = 0, c = null; while (!c && fr < 200) { render(); fr++; c = elementEffects.find(e => e.type === 'hexfire'); }
            return { at: c && [c.x, c.y], aim, halo: evoMoveIds(EVOLUTIONS.halo), ember: evoMoveIds(EVOLUTIONS.embercowl), def: evoMoveOf(f).id }; })()`);
        ok(r.at && Math.hypot(r.at[0] - r.aim[0], r.at[1] - r.aim[1]) < 0.4, 'not where it was aimed: ' + JSON.stringify(r));
        same(r.halo.join(), 'hexfire,bomb_lob', 'the Cinder Halo'); same(r.ember.join(), 'hexfire,bomb_lob', 'the Ember Hood'); same(r.def, 'hexfire', 'its default');
    });

    // ── STATIC ORB ──────────────────────────────────────────
    group('STATIC ORB (electric Brawler): SONIC ROLL kept (STATIC RUSH renamed); PINBALL, an automatic ricochet from enemy to enemy');
    check('SONIC ROLL is STATIC RUSH renamed, kept as it is: the same id (a saved choice), function and numbers; the default move; dash, hit, shock two more, all stunned', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'), a = __foe(f.x + 3, f.y), b = __foe(f.x + 4.5, f.y + 0.6), c = __foe(f.x + 6, f.y + 1), far = __foe(f.x + 12, f.y);
            __fire(f); const d = __dmg;
            return { name: MOVES.static_rush.name, fn: MOVES.static_rush.fn.toString(), nums: [MANTA_RANGE, MANTA_EVERY, MANTA_MULT, MANTA_CHAIN, MANTA_HOP, MANTA_CHAIN_SHARE, MANTA_STUN], def: evoMoveOf(f).id, ids: evoMoveIds(EVOLUTIONS.staticorb),
                     dist: Math.hypot(a.x - f.x, a.y - f.y), hit: [d(a), d(b), d(c), d(far)], stun: [a, b, c].every(p => p.stunned > 0), cd: f._sigCd, legacy: ['manta', 'prism', 'voltring'].map(k => EVOLUTIONS[k].move) }; })()`);
        same(r.name, 'SONIC ROLL', 'its name'); ok(/staticRush\(/.test(r.fn), 'its function'); same(r.nums.join(), '4,300,2.4,2,2.2,0.6,45', 'its numbers (unchanged)');
        same(r.def, 'static_rush', 'the default'); same(r.ids.join(), 'static_rush,pinball', 'its moves');
        ok(Math.abs(r.dist - 0.8) < 1e-6, 'the dash stops 0.8 short: ' + r.dist); ok(r.hit[0] > r.hit[1] && r.hit[1] > 0 && r.hit[2] > 0 && r.hit[3] === 0, 'hit and shocks: ' + r.hit); ok(r.stun, 'not stunned'); same(r.cd, 300, 'its wait');
        same(r.legacy.join(), 'SONIC ROLL,SONIC ROLL,SONIC ROLL', 'the retired electric brawlers');
    });
    check('PINBALL rolls into the nearest valid enemy, then each time into the nearest enemy it has NOT hit within PIN_HOP of it; an enemy farther than that ends it; no fixed count', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); f.move = 'pinball';
            const a = __foe(f.x + 2, f.y), b = __foe(f.x + 4.2, f.y + 0.6), c = __foe(f.x + 5.5, f.y + 2.4), d = __foe(f.x + 6.4, f.y + 4.6), far = __foe(f.x + 6.4, f.y + 9), name = p => p === a ? 'a' : p === b ? 'b' : p === c ? 'c' : p === d ? 'd' : p === far ? 'far' : 'other';
            __fire(f); const order = [], keep = applyDamage; globalThis.applyDamage = function (t, amt, src, el, rf, fx, hit) { if (src === f && hit === DMG_HIT_ALT) order.push(name(t)); return keep.apply(this, arguments); };   // (the roll's own hits: its melee, once it has stopped, is another attack)
            let fr = 0; try { while (f._pinball && fr < 900) { frame++; updateNPC(f); fr++; } } finally { globalThis.applyDamage = keep; }
            return { order, ended: !f._pinball, fr }; })()`);
        same(r.order.join(), 'a,b,c,d', 'the order it hit them (four collisions, no count fixed)'); ok(r.ended, 'it did not end');
    });
    check('PINBALL never hits one enemy twice and never loops: two enemies side by side are hit once each and it stops; it ends with its wait (PIN_EVERY, counted from the end) and fires nothing while rolling', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); f.move = 'pinball'; const a = __foe(f.x + 2, f.y), b = __foe(f.x + 2.6, f.y + 0.4);
            __fire(f); const hits = [], keep = applyDamage; globalThis.applyDamage = function (t, amt, src, el, rf, fx, hit) { if (src === f && hit === DMG_HIT_ALT) hits.push(t === a ? 'a' : 'b'); return keep.apply(this, arguments); };
            let fr = 0, fired = 0; try { while (f._pinball && fr < 900) { const cd = f._sigCd; frame++; updateNPC(f); evolutionTick(); if (f._pinball && f._sigCd !== cd) fired++; fr++; } } finally { globalThis.applyDamage = keep; }
            return { hits, ended: !f._pinball, cd: f._sigCd, fired, every: PIN_EVERY, fr }; })()`);
        same(r.hits.slice().sort().join(), 'a,b', 'hits'); ok(r.ended && r.fr < 100, 'it went on: ' + JSON.stringify(r)); same(r.fired, 0, 'its wait ran (or a move fired) while it rolled');
        ok(r.cd >= r.every - 1 && r.cd <= r.every, 'its wait after the roll: ' + r.cd);
    });
    check('PINBALL ROLLS (never more than PIN_SPEED tiles a frame) and stops cleanly at its safety limits: a target that keeps running off ends it by PIN_MAX_FRAMES or PIN_MAX_DIST', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); f.move = 'pinball'; const a = __foe(f.x + 3, f.y); __fire(f);
            let fr = 0, most = 0, x = f.x, y = f.y; while (f._pinball && fr < 2000) { a.x = f.x + 1.5; a.y = f.y + (fr % 2 ? 0.3 : -0.3); frame++; updateNPC(f); most = Math.max(most, Math.hypot(f.x - x, f.y - y)); x = f.x; y = f.y; fr++; }   // (it runs on ahead every frame: a wall, PIN_MAX_FRAMES or PIN_MAX_DIST must stop it)
            return { most, speed: PIN_SPEED, fr, ended: !f._pinball, maxF: PIN_MAX_FRAMES, maxD: PIN_MAX_DIST }; })()`);
        ok(r.most <= r.speed + 1e-9, 'a frame\'s step ' + r.most); ok(r.ended, 'it never stopped: ' + JSON.stringify(r)); ok(r.fr <= r.maxF + 2, 'it rolled ' + r.fr + ' frames');
    });
    check('PINBALL: nobody in reach, no roll and no wait spent; an enemy it cannot see (a wall between) is not picked; PINBALL is the Static Orb\'s only (the retired electric brawlers keep SONIC ROLL alone)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); f.move = 'pinball'; __foe(f.x + PIN_RANGE + 0.7, f.y); __fire(f); const out = { roll: !!f._pinball, cd: f._sigCd };
            out.legacy = ['manta', 'prism', 'voltring'].map(k => evoMoveIds(EVOLUTIONS[k]).join()); out.hover = evoMoveIds(EVOLUTIONS.hovershell).length;
            out.sees = (function(){ const g = { x: __C[0], y: __C[1] }, cells = partyRoomCells('arena'); return typeof _pinSees === 'function' && cells.length > 0; })(); return out; })()`);
        same(r.roll, false, 'a roll at an enemy out of reach'); ok(r.cd <= 0, 'a wait for nothing: ' + r.cd); same(r.legacy.join('|'), 'static_rush|static_rush|static_rush', 'the retired forms'); same(r.hover, 0, 'the Hover Shell has a move'); ok(r.sees, 'no sight check');
        ok(/_pinSees\(f, a\)/.test(rd('js/evolution.js')) && /facilityLosFrom\(f\.x, f\.y, a\.x, a\.y\)/.test(rd('js/evolution.js')), 'PINBALL does not ask whether it can see its target');
    });

    // ── THUNDERHEAD ─────────────────────────────────────────
    group('THUNDERHEAD (electric Mage): CHAIN LIGHTNING, its everyday shot, conducting by distance; STATIC VORTEX, a stationary pull with continuous damage');
    check('CHAIN LIGHTNING respects distance: from the enemy struck, on to each next enemy within CHAIN_HOP of the last (a cluster carries it far), and a gap wider than that breaks it', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'); const A = __foe(f.x + 3, f.y), B = __foe(f.x + 5, f.y), C = __foe(f.x + 7, f.y), D = __foe(f.x + 9, f.y), gap = __foe(f.x + 12, f.y);
            frame++; const n = chainLightning(f, A, 40), close = [B, C, D, gap].map(__dmg);
            __clear(); const g = __fol('electric', 'sniper', 'thunderhead'), A2 = __foe(g.x + 3, g.y), B2 = __foe(g.x + 6, g.y), C2 = __foe(g.x + 6.5, g.y + 2.9); frame++; const n2 = chainLightning(g, A2, 40);
            return { n, close, n2, spread: [__dmg(B2), __dmg(C2)], hop: CHAIN_HOP }; })()`);
        same(r.hop, 2.5, 'CHAIN_HOP'); same(r.n, 3, 'jumps through a cluster 2 tiles apart'); ok(r.close[0] > 0 && r.close[1] > 0 && r.close[2] > 0, 'the cluster: ' + r.close); same(r.close[3], 0, 'across a 3-tile gap');
        same(r.n2, 0, 'jumps between enemies 3 tiles apart'); same(r.spread.join(), '0,0', 'damage across the gaps');
    });
    check('each jump does CHAIN_SHARE of the one before; each enemy is struck once (it never bounces back); it ends when a jump would do under CHAIN_MIN, with no fixed cap', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'), ps = []; for (let i = 0; i < 9; i++) ps.push(__foe(f.x + 3 + i * 1.5, f.y + (i % 2) * 0.4));
            const sim = __foe(f.x + 40, f.y + 40); frame++; const n = chainLightning(f, ps[0], 30), got = ps.map(__dmg);
            const share = []; for (let i = 2; i < got.length && got[i] > 0; i++) share.push(got[i] / got[i - 1]);
            __clear(); const g = __fol('electric', 'sniper', 'thunderhead'), a = __foe(g.x + 3, g.y), b = __foe(g.x + 3.8, g.y); frame++; const twice = chainLightning(g, a, 30);
            __clear(); const h = __fol('electric', 'sniper', 'thunderhead'), q = []; for (let i = 0; i < 6; i++) q.push(__foe(h.x + 3 + i, h.y)); frame++; const weak = chainLightning(h, q[0], 2.5);
            return { n, got, share, twice, weak, min: CHAIN_MIN, k: CHAIN_SHARE }; })()`);
        ok(r.share.length >= 3 && r.share.every(s => Math.abs(s - r.k) < 1e-6), 'each jump ' + JSON.stringify(r.share) + ' of the last, not ' + r.k);
        ok(r.n >= 4, 'jumps through a long cluster: ' + r.n); same(r.got[0], 0, 'the first enemy (the shot\'s own) struck again by the chain');
        same(r.twice, 1, 'two enemies: one jump (none back)'); same(r.weak, 1, 'a 2.5 shot: 1.5, then 0.9 is under ' + r.min);
    });
    check('the Thunderhead\'s everyday shot IS the CHAIN LIGHTNING (the Mages\' shot, conducting on from the enemy it strikes); an electric Mage egg\'s and the retired Reaver\'s shots are plain', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'), A = __foe(f.x + 3.5, f.y), B = __foe(f.x + 5, f.y + 0.5); f.attackCooldown = 0; f._sigCd = 1e9;
            let fr = 0; while (!followerProjectiles.length && fr < 120) { frame++; updateNPC(f); fr++; } const p = followerProjectiles[0]; __off(f);
            fr = 0; while (followerProjectiles.length && fr < 120) { render(); fr++; }
            const egg = __fol('electric', 'sniper', null), rea = __fol('electric', 'sniper', 'reaver');
            return { shot: !!p, hasHit: !!(p && p.onHit), hit: p && p.hit === DMG_HIT_SHOT, a: __dmg(A), b: __dmg(B), egg: !!evoShotOnHit(egg, 10), reaver: !!evoShotOnHit(rea, 10), name: EVOLUTIONS.thunderhead.shot, info: followerInfo(f).attacks.find(s => /^MAIN ATTACK/.test(s.h)).h }; })()`);
        ok(r.shot && r.hasHit && r.hit, 'the shot: ' + JSON.stringify(r)); ok(r.a > 0 && r.b > 0 && r.b < r.a, 'struck and conducted: ' + JSON.stringify(r));
        same(r.egg, false, 'an egg\'s shot chains'); same(r.reaver, false, 'the Reaver\'s shot chains'); same(r.name, 'CHAIN LIGHTNING', 'its name'); same(r.info, 'MAIN ATTACK · CHAIN LIGHTNING', 'INFO');
    });
    check('STATIC VORTEX is STATIONARY (it never travels or grows) and pulls the enemies in it toward its middle; a beetle is too heavy to drag; one outside it is left alone', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'), t = __foe(f.x + 5, f.y), p = __foe(f.x + 6.9, f.y + 0.4), b = __foe(f.x + 5, f.y + 1.8, 'beetle'), out = __foe(f.x + 9, f.y);
            __fire(f); __off(f); const v = elementEffects.find(e => e.type === 'staticVortex'), x0 = v.x, y0 = v.y, r0 = v.radius, d0 = Math.hypot(p.x - v.x, p.y - v.y), b0 = [b.x, b.y], o0 = [out.x, out.y];
            let moved = false; for (let i = 0; i < 90; i++) { render(); if (v.x !== x0 || v.y !== y0 || v.radius !== r0) moved = true; }
            return { at: [x0, y0], t: [5, 0], moved, d0, d1: Math.hypot(p.x - x0, p.y - y0), beetle: Math.hypot(b.x - b0[0], b.y - b0[1]), outMoved: Math.hypot(out.x - o0[0], out.y - o0[1]), r: r0, R: VORTEX_RADIUS }; })()`);
        same(r.moved, false, 'the vortex moved or grew'); same(r.r, r.R, 'its radius'); ok(r.d1 < r.d0 - 1, 'pulled in from ' + r.d0 + ' to ' + r.d1);
        same(r.beetle, 0, 'the beetle was dragged'); same(r.outMoved, 0, 'an enemy outside it was pulled');
    });
    check('STATIC VORTEX bites every enemy in it every VORTEX_TICK frames for power × VORTEX_MULT, through the damage system, until it runs out after VORTEX_LIFE frames; it is the Thunderhead\'s move (ARC VOLLEY stays the Reaver\'s)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'), t = __foe(f.x + 5, f.y), out = __foe(f.x + 9.5, f.y); __fire(f); __off(f);
            const bites = []; let last = 0, k = 0; while (elementEffects.some(e => e.type === 'staticVortex') && k < 600) { render(); k++; const d = __dmg(t); if (d !== last) { bites.push([k, d - last]); last = d; } }
            const twin = __foe(f.x + 40, f.y + 40); applyDamage(twin, f.power * VORTEX_MULT, f, 'electric', false, false, DMG_HIT_ALT);
            return { bites, k, one: __dmg(twin), out: __dmg(out), tick: VORTEX_TICK, life: VORTEX_LIFE, move: evoMoveOf(f).id, reaver: EVOLUTIONS.reaver.move, thunder: EVOLUTIONS.thunderhead.move }; })()`);
        ok(r.bites.length >= 6 && r.bites.every((b, i) => i === 0 || b[0] - r.bites[i - 1][0] === r.tick), 'bites every ' + r.tick + ': ' + JSON.stringify(r.bites));
        ok(r.bites.every(b => Math.abs(b[1] - r.one) < 1e-6 * r.one + 1e-6), 'a bite is power × VORTEX_MULT: ' + JSON.stringify(r));
        ok(Math.abs(r.k - r.life) <= 2, 'it lasted ' + r.k); same(r.out, 0, 'an enemy outside it was bitten');
        same(r.move, 'static_vortex', 'the Thunderhead\'s move'); same(r.thunder, 'STATIC VORTEX', 'its form'); same(r.reaver, 'ARC VOLLEY', 'the Reaver');
    });

    // ── HOVER SHELL ─────────────────────────────────────────
    group('HOVER SHELL (electric Technician) and its KINETIC LAUNCHER: unchanged');
    check('the Kinetic Launcher is as it was: its id, name, chip, colour and aim (a follower, then an enemy), and every one of its numbers', () => {
        const r = J(`(function(){ const a = TECH_ABILITIES.electric, o = {}; for (const k in a) o[k] = typeof a[k] === 'function' ? 'fn' : a[k]; return { ab: o, launch: TECH_AB.launch }; })()`);
        same(JSON.stringify(r.ab), JSON.stringify({ id: 'kinetic_launcher', name: 'KINETIC LAUNCHER', short: 'LAUNCH', icon: '⚡', col: '#ffe733', aim: ['follower', 'enemy'], use: 'fn', ask: 'fn' }), 'the ability');
        same(JSON.stringify(r.launch), JSON.stringify({ cooldown: 3600, selfDamage: 10, powerMult: 3, siteXp: 100, hitReach: 1.6, loadReach: 1.3, loadWait: 480, flight: 40, peak: 70, siteFlight: 64, sitePeak: 120, dropFlight: 28, near: 6, setupWalk: 1200, setup: 120 }), 'its numbers');
    });
    check('the Hover Shell itself is as it was: no move, no named shot, its types (Crushing, Earthquake) and subclass (Drone), and the Technicians\' shared plain hit within 4 tiles', () => {
        const r = J(`({ form: EVOLUTIONS.hovershell, dmg: DMG_FORM.hovershell, sub: EQUIP_FORM_SUBCLASS.hovershell })`);
        same(JSON.stringify(r.form), JSON.stringify({ id: 'hovershell', name: 'HOVER SHELL', element: 'electric', role: 'camper', sheet: 'img/evo/hovershell.png', cell: 144, anchor: [72, 114.2], core: [72, 91.1], noGlow: true, color: '#ffee33' }), 'its form');
        same(JSON.stringify(r.dmg), JSON.stringify({ main: 'crushing', alt: 'earthquake' }), 'its damage types'); same(r.sub, 'drone', 'its subclass');
        const N = rd('js/npc.js'); ok(/const CAMPER_ENGAGE_RADIUS = 4;/.test(N) && /\} else \{\s*followerAttack\(actor, nearestEnemy\);\s*\}/.test(N.slice(N.indexOf('CAMPER (the technician)'))), 'the Technicians\' plain hit changed');
    });

    // ── THE DAMAGE SYSTEM, THE TABLES AND THE WORDS ─────────
    group('ONE DAMAGE SYSTEM, ONE TABLE, ONE SET OF WORDS');
    check('every new hit goes through applyDamage with the established hit kinds (a move\'s DMG_HIT_ALT, the Mages\' DMG_HIT_SHOT): no health is taken off by hand', () => {
        const E = rd('js/evolution.js'), body = n => { const i = E.indexOf('function ' + n + '('); ok(i >= 0, 'no ' + n); const j = E.indexOf('\nfunction ', i + 10); return E.slice(i, j < 0 ? undefined : j); };
        for (const [fn, kind] of [['quillBurst', 'DMG_HIT_ALT'], ['fieldBite', 'DMG_HIT_ALT'], ['pinballStep', 'DMG_HIT_ALT'], ['chainLightning', 'DMG_HIT_SHOT']]) { const b = body(fn); ok(b.indexOf(kind) >= 0, fn + ' does not use ' + kind); ok(!/\.health\s*-=|\.health\s*=\s*[^=]/.test(b), fn + ' sets health by hand'); }
        ok(/applyDamage\(t, \(f\.power \|\| 10\) \* PIN_MULT/.test(E) && /applyDamage\(a, e\.bite/.test(E) && /applyDamage\(next, d, f/.test(E), 'not through applyDamage');
    });
    check('the move table has one row a move, no id twice, every form\'s moves in it; the new ids are pinball and static_vortex; static_rush keeps its id under its new name', () => {
        const r = J(`(function(){ const ids = Object.keys(MOVES), names = ids.map(k => MOVES[k].name), missing = []; for (const k in EVOLUTIONS) for (const id of (EVOLUTIONS[k].moves || [])) if (!MOVES[id]) missing.push(k + ':' + id);
            return { ids, names, dupN: names.length - new Set(names).size, idOk: ids.every(k => MOVES[k].id === k), missing }; })()`);
        same(r.dupN, 0, 'a name twice'); ok(r.idOk, 'a row whose id is not its key'); same(r.missing.join(), '', 'moves a form lists that have no row');
        ok(r.ids.indexOf('pinball') >= 0 && r.ids.indexOf('static_vortex') >= 0 && r.ids.indexOf('static_rush') >= 0, 'the ids: ' + r.ids);
        same(r.names.indexOf('STATIC RUSH'), -1, 'the old name is still in the table');
    });
    check('INFO says what each new attack does, read off the constants: QUILL BURST, HEXFIRE, SONIC ROLL, PINBALL, STATIC VORTEX, and the named shots FIREBALL and CHAIN LIGHTNING', () => {
        const r = J(`(function(){ const o = {}; for (const k of ['QUILL BURST', 'HEXFIRE', 'SONIC ROLL', 'PINBALL', 'STATIC VORTEX']) o[k] = MOVE_INFO[k] ? MOVE_INFO[k]() : null; for (const k of ['FIREBALL', 'CHAIN LIGHTNING']) o[k] = SHOT_INFO[k] ? SHOT_INFO[k]() : null; o.old = !!MOVE_INFO['STATIC RUSH']; return o; })()`);
        for (const k of ['QUILL BURST', 'HEXFIRE', 'SONIC ROLL', 'PINBALL', 'STATIC VORTEX', 'FIREBALL', 'CHAIN LIGHTNING']) ok(r[k] && r[k].length >= 3, k + ': ' + JSON.stringify(r[k]));
        const row = (k, h) => (r[k].find(x => x[0] === h) || [])[1] || '';
        ok(/^5, all at once/.test(row('QUILL BURST', 'QUILLS')), 'QUILL BURST: ' + row('QUILL BURST', 'QUILLS')); ok(/stays put and never grows/.test(row('HEXFIRE', 'EFFECT')), 'HEXFIRE: ' + row('HEXFIRE', 'EFFECT'));
        ok(/each enemy once/.test(row('PINBALL', 'EFFECT')), 'PINBALL: ' + row('PINBALL', 'EFFECT')); ok(/stays where it is cast/.test(row('STATIC VORTEX', 'EFFECT')), 'STATIC VORTEX: ' + row('STATIC VORTEX', 'EFFECT'));
        same(r.old, false, 'INFO still has STATIC RUSH');
    });
    check('the new fields are drawn without an error (the circle, the vortex, the chain\'s bolt, a quill and a HEXFIRE shot), and kept from the effects budget', () => {
        same(run(`(function(){ try { elementEffects.length = 0; elementEffects.push({ type: 'hexfire', x: player.x, y: player.y, radius: HALO_RADIUS, life: 100, maxLife: HALO_LIFE }, { type: 'staticVortex', x: player.x + 1, y: player.y, radius: VORTEX_RADIUS, life: 100, maxLife: VORTEX_LIFE }, { type: 'chainBolt', pts: [{ x: player.x, y: player.y }, { x: player.x + 2, y: player.y }], color: '#ffee33', life: 10, maxLife: 18 });
            drawElementEffects(); _drawFollowerProjectile(ctx, { kind: 'quill', vx: 0.18, vy: 0, element: 'fire', frame: 3 }, 100, 100); _drawFollowerProjectile(ctx, { kind: 'hex', vx: 0.18, vy: 0, element: 'fire', frame: 3 }, 100, 100); return 'drawn'; } catch (e) { return e.message; } finally { elementEffects.length = 0; } })()`), 'drawn', 'drawing');
        same(run(`FX_LONG.hexfire === 1 && FX_LONG.staticVortex === 1`), true, 'the budget could drop them');
    });

    console.log(failures ? `\n${failures} FAILED` : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
