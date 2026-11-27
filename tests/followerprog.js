// FOLLOWER PROGRESSION (js/clone.js, js/breeding.js, js/vital.js; docs/FOLLOWER-PROGRESSION.md): the roster's RECRUIT for ◆200 (the recruitment posts were removed, the owner, 2026-11-24: tests/followerspots.js), breeding a bonded pair's offspring for ◆50 with a base that is
// better than a recruit's, the Vital items that put back the hp stat deaths took, and the five hidden cases.
// ASKED (the archive's Next Major Update Framework, the follow-up scope of 2026-10-31): "Each recruit post/location in the facility can yield its available follower only once ... preserve that state through revisits,
// transitions, and save/load"; "Directly purchasing a recruit costs exactly 200 shards. Sanctuary breeding costs exactly 50 shards per offspring"; "Prevent duplicate followers, repeated post claims, and duplicate charges
// ... Insufficient currency must not consume the post or create an offspring"; "a deterministic, testable behind-the-scenes quality advantage for bred offspring ... Do not double-apply inherited bonuses when stats are
// recalculated"; "Vital Fleck restores +5 permanent base HP; Vital Prism restores +10; Vital Core restores +20 ... consumed exactly once and its effect survives save/load ... No Vital Prisms effect bypasses the
// established permanent-death and resurrection rules"; "Pickups are hidden, placed intentionally, finite, and cannot be repeatedly farmed through area reloads."
// BUILD C (the owner, 2026-11-02; docs/CONVERSION.md "Breeding, once conversion exists"): an offspring's element is an even toss between its parents' current elements and its class an even draw among the three,
// "not tied to the parents"; the draws are seedable for tests (one injected source, js/breeding.js).
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
function near(a, b, tol, m) { if (!(Math.abs(a - b) <= tol)) throw new Error(`${m}: expected ${b} ± ${tol}, got ${a}`); }

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; facilityPlayStart(); facilityBlackoutSet(false); if (typeof classPickerOpen !== 'undefined') classPickerOpen = false; playerClassKey = playerClassKey || 'gunslinger'; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3;
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__clearF = () => { if (typeof partyPickBusy === 'function' && partyPickBusy()) partyPickChoose('cancel'); actors = actors.filter(a => !a.isFollower && !a.isClone && !(a instanceof Predator) && a.team !== 'green'); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; respawnQueue.length = 0; selectedUnits.clear(); if (typeof cloneBodies !== 'undefined') cloneBodies.length = 0; floatingTexts.length = 0; if (typeof breedDisarm === 'function') breedDisarm(); };
        globalThis.__rec = (el, type) => { shardCount += RECRUIT_COST; recruitFollower(type, el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; return f; };
        globalThis.__bond = (a, b) => { a.partnerUid = followerUid(b); b.partnerUid = followerUid(a); return bondPartner(a) === b; };
        globalThis.__said = re => floatingTexts.filter(t => re.test(t.text)).length;
        globalThis.__step = () => { frame++; if (typeof _simStep === 'function') _simStep(false); else update(); };`);

    group('1. RECRUITING: the roster\'s RECRUIT ◆200 (the recruitment posts were removed: the owner, 2026-11-24, "Remove posts entirely")');
    check('the table: the quick recruit RECRUIT_COST = 200 (the archive: "Directly purchasing a recruit costs exactly 200 shards"); the posts\' price, FP_SPOT, is gone with them', () => {
        same(J('RECRUIT_COST'), 200, 'the recruit'); same(run('typeof FP_SPOT'), 'undefined', 'the posts\' table');
    });

    group('2. BREEDING: a bonded pair\'s offspring, ◆50, better raised');
    check('the table: ◆50 an offspring, the upbringing +5%, the variation ±3%, the cap 2× the personality\'s own number, six stats; breeding is the cheaper way in', () => {
        const B = J('BREED'); same(B.price, 50, 'price'); same(B.upbringing, 1.05, 'upbringing'); same(B.variation, 0.03, 'variation'); same(B.cap, 2, 'cap'); same(B.stats.join(), 'hp,attack,defense,specialAttack,accuracy,will', 'stats'); ok(J('RECRUIT_COST') > B.price, 'cheaper');
    });
    check('the formula is pure and deterministic: own = applyPersonality; with a fixed draw the same parents give the same base; each stat = max(own, the parents\' mean) × 1.05 × (1 + v), three places; never under own; capped at 2 × own; speed and resonance untouched', () => {
        const r = J(`(function(){ const own = applyPersonality('aggressive'), o = {}; const mid = () => 0.5, low = () => 0, high = () => 0.999999;
            o.same = JSON.stringify(breedBase(own, own, own, mid)) === JSON.stringify(breedBase(own, own, own, mid)); o.a = breedBase(own, own, own, mid); o.own = own;
            const big = {}; for (const k in own) big[k] = own[k] * 10; o.capped = breedBase(own, big, big, mid); o.low = breedBase(own, own, own, low); o.high = breedBase(own, own, own, high);
            const A = Object.assign({}, own, { hp: 30, attack: 10 }), B = Object.assign({}, own, { hp: 16, attack: 30 }); o.mean = breedBase(own, A, B, mid); return o; })()`);
        same(r.same, true, 'deterministic'); const S = ['hp', 'attack', 'defense', 'specialAttack', 'accuracy', 'will'];
        for (const s of S) { same(r.a[s], Math.round(r.own[s] * 1.05 * 1000) / 1000, s + ' of two equals'); same(r.capped[s], 2 * r.own[s], s + ' capped'); same(r.low[s], Math.round(r.own[s] * 1.05 * 0.97 * 1000) / 1000, s + ' the worst draw'); ok(r.low[s] >= r.own[s], s + ' under own'); near(r.high[s], r.own[s] * 1.05 * 1.03, 0.002, s + ' the best draw'); }
        same(r.mean.hp, Math.round(23 * 1.05 * 1000) / 1000, 'hp from the mean (30 and 16)'); same(r.mean.attack, Math.round(20 * 1.05 * 1000) / 1000, 'attack from the mean (10 and 30; own 20)'); same(r.a.resonance, 0, 'resonance'); same(r.a.speed, r.own.speed, 'speed is not in the list: as own');
    });
    check('who may: a follower with no bond is refused with the reason; bonded but short of ◆50, refused; bonded with the shards: yes, with the partner, and the button names it', () => {
        const r = J(`(function(){ __clearF(); shardCount = 0; const a = __rec('fire', 'brawler'), b = __rec('ice', 'sniper'), o = {}; shardCount = 500; const c0 = breedCan(a); o.noBond = [c0.ok, c0.why]; o.bonded = __bond(a, b); shardCount = 49; const c1 = breedCan(a); o.poor = [c1.ok, c1.why]; shardCount = 500; const c = breedCan(a); o.ok = [c.ok, c.partner === b]; const l = breedLabel(a); o.label = [l.text, l.on]; return o; })()`);
        same(r.noBond[0], false, 'no bond'); ok(/NO BOND/.test(r.noBond[1]), 'the reason: ' + r.noBond[1]); same(r.bonded, true, 'bonded'); same(r.poor[0], false, 'poor'); ok(/NEED \u25c650/.test(r.poor[1]), 'the reason: ' + r.poor[1]); same(r.ok.join(), 'true,true', 'bonded with the shards'); ok(/^BREED WITH .*\u25c650$/.test(r.label[0]), 'the button: ' + r.label[0]); same(r.label[1], true, 'on');
    });
    check('the act: the offspring comes out at the Crystal, exactly ◆50 taken, of the DRAWN element and class (the draw injected: 0.5 gives the partner\'s element and the middle class, a MAGE, though the parent in view leads by two levels: the lead no longer decides), at the recruit level, unbonded, no cards, its base from the formula, hp0 its born hp, bred { gen 1, parents }, its stats and health from that base; the parents unchanged and not used up', () => {
        const r = J(`(function(){ __clearF(); shardCount = 0; const a = __rec('fire', 'brawler'), b = __rec('ice', 'sniper'); __bond(a, b); a.level = b.level + 2; _applyFollowerLevel(a, true); const A0 = JSON.stringify(a.base), B0 = JSON.stringify(b.base);
            shardCount = 500; const n = followers.length; const c = breedMake(a, () => 0.5), o = {}; if (!c) return { none: true };
            const own = applyPersonality(c.personality), want = breedBase(own, breedParentBase(a), breedParentBase(b), () => 0.5);
            o.made = [followers.length - n, shardCount, c.role, c.element, c.level === recruitLevel(), c.partnerUid || null, Math.hypot(c.x - crystal.x, c.y - crystal.y) < 4, typeof equipRecord === 'function' ? String(JSON.stringify(equipRecord(c))) : 'none'];
            o.base = JSON.stringify(c.base) === JSON.stringify(want); o.hp0 = c.hp0 === c.base.hp; o.bred = JSON.stringify(c.bred); o.uids = [a.uid, b.uid]; o.parents = A0 === JSON.stringify(a.base) && B0 === JSON.stringify(b.base) && !a.dead && !b.dead && followers.includes(a) && followers.includes(b) && bondPartner(a) === b;
            o.stats = JSON.stringify(c.stats) === JSON.stringify(levelledStats(c.base, c.level)); o.hp = c.maxHealth === Math.round(c.stats.hp * FOLLOWER_HP_MULT) && c.health === c.maxHealth; o.personality = FOLLOWER_TYPES.sniper.personalities.includes(c.personality); return o; })()`);
        ok(!r.none, 'nothing was made'); same(r.made.slice(0, 4).join(), '1,450,sniper,ice', 'one offspring, ◆50, the drawn class and element'); same(r.made[4], true, 'the recruit level'); same(r.made[5], null, 'unbonded'); same(r.made[6], true, 'at the Crystal'); ok(!/[a-z]{3,}_[a-z]{3,}/.test(r.made[7]), 'a card: ' + r.made[7]);
        same(r.base, true, 'the base from the formula'); same(r.hp0, true, 'hp0'); same(r.bred, JSON.stringify({ gen: 1, parents: r.uids }), 'its line'); same(r.parents, true, 'the parents'); same(r.stats, true, 'its stats from its base'); same(r.hp, true, 'its health'); same(r.personality, true, 'a personality of the type');
    });
    check('the draws (Build C; the owner, 2026-11-02: docs/CONVERSION.md "Breeding, once conversion exists"): the element an even toss between the two parents\' current elements (under 0.5 the first\'s, else the second\'s; a parent with none gives the other\'s), the class an even draw among the three (brawler, sniper = MAGE, camper = TECHNICIAN) with nothing of the parents in it; a draw out of range is held to the ends; breedLead and breedType are gone', () => {
        const r = J(`(function(){ const A = { element: 'fire', role: 'brawler', level: 9 }, B = { element: 'ice', role: 'sniper', level: 1 }, k = v => () => v;
            return { el: [breedElement(A, B, k(0)), breedElement(A, B, k(0.4999)), breedElement(A, B, k(0.5)), breedElement(A, B, k(0.9999)), breedElement({}, B, k(0.1)), breedElement(A, {}, k(0.9))],
                cl: [breedClass(k(0)), breedClass(k(0.3333)), breedClass(k(0.34)), breedClass(k(0.6666)), breedClass(k(0.67)), breedClass(k(0.9999)), breedClass(k(1)), breedClass(k(-0.2)), breedClass(k(NaN))], order: FOLLOWER_TYPE_ORDER, gone: [typeof breedLead, typeof breedType] }; })()`);
        same(r.el.join(), 'fire,fire,ice,ice,ice,fire', 'the element'); same(r.cl.join(), 'brawler,brawler,sniper,sniper,camper,camper,camper,brawler,brawler', 'the class'); same(r.order.join(), 'brawler,sniper,camper', 'the three'); same(r.gone.join(), 'undefined,undefined', 'the lead\'s rule');
        ok(/breedElement\(f, p, draw\)/.test(rd('js/breeding.js')) && /breedClass\(draw\)/.test(rd('js/breeding.js')) && /breedBase\(own, breedParentBase\(f\), breedParentBase\(p\), draw\)/.test(rd('js/breeding.js')), 'one source for every draw in breedMake');
    });
    check('BLOOM (build 2026-11-09a, the owner: "Build it"): a toxic + fire pair, once the purification module is installed and has run, is BLOOM half the draws and each parent\'s element a quarter; before the module has run, never; another pair, never', () => {
        const r = J(`(function(){ const T = { element: 'toxic' }, F = { element: 'fire' }, I = { element: 'ice' }, k = v => () => v, Q = questState('purify'), keep = [Q.installedAt, Q.purifiedAt];
            Q.installedAt = 0; Q.purifiedAt = 0; const before = [0, 0.3, 0.6, 0.9].map(v => breedElement(T, F, k(v)));
            Q.installedAt = 1; Q.purifiedAt = 0; const running = [0, 0.3].map(v => breedElement(T, F, k(v)));
            Q.installedAt = 1; Q.purifiedAt = 2; const after = [0, 0.4999, 0.5, 0.7499, 0.75, 0.9999].map(v => breedElement(T, F, k(v))), flip = [0.1, 0.6, 0.9].map(v => breedElement(F, T, k(v))), other = [0.1, 0.9].map(v => breedElement(T, I, k(v)));
            let t = 5, n = { blossom: 0, toxic: 0, fire: 0 }; const rnd = () => { t = (t + 0x6D2B79F5) >>> 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
            for (let i = 0; i < 1000; i++) n[breedElement(i % 2 ? T : F, i % 2 ? F : T, rnd)]++;
            Q.installedAt = keep[0]; Q.purifiedAt = keep[1]; return { before, running, after, flip, other, n }; })()`);
        same(r.before.join(), 'toxic,toxic,fire,fire', 'before the module is in'); same(r.running.join(), 'toxic,toxic', 'while its cycle has not run');
        same(r.after.join(), 'blossom,blossom,toxic,toxic,fire,fire', 'once it has run'); same(r.flip.join(), 'blossom,fire,toxic', 'fire + toxic'); same(r.other.join(), 'toxic,ice', 'toxic + ice');
        ok(r.n.blossom >= 450 && r.n.blossom <= 550, 'BLOOM ' + r.n.blossom + ' of 1000'); ok(r.n.toxic >= 200 && r.n.toxic <= 300, 'toxic ' + r.n.toxic); ok(r.n.fire >= 200 && r.n.fire <= 300, 'fire ' + r.n.fire);
    });
    check('over 600 offspring of a fire Brawler and an ice MAGE (a seeded draw, the parent in view taking turns): about half fire and half ice and no other element; about a third of each class, its role the class drawn; the same seed gives the same elements and classes in the same order (seedable for tests); each paid ◆50', () => {
        const r = J(`(function(){ __clearF(); shardCount = 0; const a = __rec('fire', 'brawler'), b = __rec('ice', 'sniper'); __bond(a, b);
            const seeded = seed => { let t = seed >>> 0; return () => { t = (t + 0x6D2B79F5) >>> 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; }; };   /* (mulberry32) */
            const batch = (seed, n) => { const rnd = seeded(seed), out = []; for (let i = 0; i < n; i++) { shardCount = 50; const c = breedMake(i % 2 ? b : a, rnd); if (!c) return { failed: i, shards: shardCount }; out.push(c.element + ':' + c.role); followers.splice(followers.indexOf(c), 1); const j = actors.indexOf(c); if (j >= 0) actors.splice(j, 1); if (typeof partySync === 'function') partySync(false); } return out; };
            const one = batch(7, 600); if (one.failed !== undefined) return one; const two = batch(7, 60); if (two.failed !== undefined) return two;
            const n = {}; for (const s of one) for (const k of s.split(':')) n[k] = (n[k] || 0) + 1; return { n, same: JSON.stringify(one.slice(0, 60)) === JSON.stringify(two), other: batch(8, 60).join() !== two.join(), shards: shardCount }; })()`);
        ok(r.failed === undefined, 'breeding failed at ' + r.failed + ' with ' + r.shards); const n = r.n, tot = (n.fire || 0) + (n.ice || 0);
        same(tot, 600, 'an element neither parent has: ' + JSON.stringify(n)); ok(n.fire >= 255 && n.fire <= 345, 'fire ' + n.fire + ' of 600'); ok(n.ice >= 255 && n.ice <= 345, 'ice ' + n.ice + ' of 600');
        same((n.brawler || 0) + (n.sniper || 0) + (n.camper || 0), 600, 'a role that is not one of the three: ' + JSON.stringify(n)); for (const c of ['brawler', 'sniper', 'camper']) ok(n[c] >= 160 && n[c] <= 240, c + ' ' + n[c] + ' of 600');
        same(r.same, true, 'the same seed, another sequence'); same(r.other, true, 'another seed, the same sequence'); same(r.shards, 0, 'each paid ◆50');
    });
    check('better raised, measured: 150 offspring of two fire Brawlers (any class since Build C, a seeded draw); against the inheritance term (the greater of its own personality\'s number and the parents\' mean) the upbringing is +5% on average on every stat in the list wherever the cap cannot be reached; where it is always reached (a class far from its parents\', a stat they are strong in: two Brawlers\' cautious MAGE\'s ATK) the stat is the cap, 2 × its own, exactly; against a recruit of its own personality no offspring is under on any of them (at least +1.85%, the worst draw) or past 2 ×; each cost ◆50', () => {
        const r = J(`(function(){ __clearF(); shardCount = 0; const a = __rec('fire', 'brawler'), b = __rec('fire', 'brawler'); __bond(a, b); const S = BREED.stats, up = {}, free = {}, bound = {}, minOwn = {}, maxOwn = {}; let off = 0, n = 0; for (const s of S) { up[s] = 0; free[s] = 0; bound[s] = 0; minOwn[s] = 9; maxOwn[s] = 0; } const A = breedParentBase(a), B = breedParentBase(b);
            let t = 11; const rnd = () => { t = (t + 0x6D2B79F5) >>> 0; let x = Math.imul(t ^ (t >>> 15), 1 | t); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };   /* (mulberry32) */
            for (let i = 0; i < 150; i++) { shardCount = 50; const c = breedMake(a, rnd); if (!c) return { failed: i, shards: shardCount }; const own = applyPersonality(c.personality);
                for (const s of S) { const inh = Math.max(own[s], (A[s] + B[s]) / 2), cap = BREED.cap * own[s];
                    if (inh * BREED.upbringing * (1 + BREED.variation) <= cap) { up[s] += c.base[s] / inh; free[s]++; } else if (inh * BREED.upbringing * (1 - BREED.variation) >= cap) { bound[s]++; if (c.base[s] !== Math.round(cap * 1000) / 1000) off++; }
                    const k = c.base[s] / own[s]; if (k < minOwn[s]) minOwn[s] = k; if (k > maxOwn[s]) maxOwn[s] = k; }
                n++; followers.splice(followers.indexOf(c), 1); const j = actors.indexOf(c); if (j >= 0) actors.splice(j, 1); if (typeof partySync === 'function') partySync(false); }
            const mean = {}; for (const s of S) mean[s] = free[s] ? up[s] / free[s] : null; return { n, mean, free, bound, off, minOwn, maxOwn, shards: shardCount }; })()`);
        ok(r.failed === undefined, 'breeding failed at ' + r.failed + ' with ' + r.shards); same(r.n, 150, 'offspring');
        for (const s of J('BREED.stats')) { ok(r.free[s] >= 30, s + ': too few offspring the cap leaves alone (' + r.free[s] + ')'); near(r.mean[s], 1.05, 0.01, s + ' upbringing'); ok(r.minOwn[s] >= 1.018, s + ' worst against own ' + r.minOwn[s]); ok(r.maxOwn[s] <= 2.0000001, s + ' past the cap ' + r.maxOwn[s]); }
        /* (since the personalities stay within +-25% of the base, 2 x the personality's own number cannot be reached by the parents' mean x 1.05: nothing meets the cap, and the checks on the cap above and below still hold) */ same(r.off, 0, 'a stat at the cap that is not 2 × its own'); same(r.shards, 0, 'each paid ◆50');
    });
    check('applied once: a level-up, a save and a load (followerBuild from its record), a death and its respawn (the queue carries hp0 and bred, and the base as it was: a death costs nothing, the owner\'s rule of 2026-11-01) and an older save\'s body restored at the Crystal (the hp stat it lost comes back on load) all take their numbers from the one base: nothing is added twice', () => {
        const r = J(`(function(){ __clearF(); shardCount = 0; const a = __rec('fire', 'brawler'), b = __rec('ice', 'sniper'); __bond(a, b); shardCount = 50; const c = breedMake(a, () => 0.5); if (!c) return { none: true }; const o = {}; const base0 = JSON.stringify(c.base), bred0 = JSON.stringify(c.bred), hp00 = c.hp0, hpB = c.base.hp;
            gainXp(c, xpForLevel(c.level + 1) - c.xp + 1); o.level = [c.level, JSON.stringify(c.base) === base0, JSON.stringify(c.stats) === JSON.stringify(levelledStats(c.base, c.level)), c.maxHealth === Math.round(c.stats.hp * FOLLOWER_HP_MULT)];
            const rec = followerRecord(c), d = followerBuild(JSON.parse(JSON.stringify(rec))); o.load = [JSON.stringify(d.base) === base0, JSON.stringify(d.bred) === bred0, d.hp0 === hp00, JSON.stringify(d.stats) === JSON.stringify(c.stats), d.maxHealth === c.maxHealth];
            c.dead = true; c.health = 0; __step(); const q = respawnQueue.find(e => e.uid === c.uid); o.queued = [!!q, !!q && JSON.stringify(q.bred) === bred0, !!q && q.hp0 === hp00, !!q && !!q.base && q.base.hp === hpB, !!q && q.hpStat === hpB];
            if (q) { q.timer = 1; __step(); } const e = followers.find(f => f.uid === c.uid && f !== c); o.back = [!!e, !!e && JSON.stringify(e.bred) === bred0, !!e && e.hp0 === hp00, !!e && e.base.hp === hpB, !!e && JSON.stringify(e.stats) === JSON.stringify(levelledStats(e.base, e.level))];
            if (e) { e.base.hp = 1; const bd = specimenFollowerFell(e); const u = spawnFollowerFromSave(bd.rec); o.body = [u.base.hp === hp00, JSON.stringify(u.bred) === bred0, u.hp0 === hp00]; }
            return o; })()`);
        ok(!r.none, 'nothing bred'); same(r.level.slice(1).join(), 'true,true,true', 'a level-up, from the base'); same(r.load.join(), 'true,true,true,true,true', 'a load'); same(r.queued.join(), 'true,true,true,true,true', 'queued with its birth'); same(r.back.join(), 'true,true,true,true,true', 'back from the queue'); same(r.body.join(), 'true,true,true', 'a restored body (its lost hp stat back)');
    });
    check('two taps: the first arms it and pays nothing, the second breeds; a refused tap disarms; the button is in the Command Center\'s settings column and on the phone\'s roster card', () => {
        const r = J(`(function(){ __clearF(); shardCount = 0; const a = __rec('fire', 'brawler'), b = __rec('ice', 'sniper'); __bond(a, b); shardCount = 120; const o = {}; const n = followers.length;
            o.first = [breedTap(a), shardCount, followers.length - n, breedArmed(a), breedLabel(a).text]; o.second = [breedTap(a), shardCount, followers.length - n, breedArmed(a)];
            shardCount = 10; o.refused = [breedTap(a), shardCount, breedArmed(a)]; shardCount = 60; o.third = [breedTap(a), breedArmed(a)]; breedDisarm(); o.disarmed = [breedArmed(a), breedTap(a)]; return o; })()`);
        same(r.first.slice(0, 4).join(), 'armed,120,0,true', 'the first tap'); ok(/TAP AGAIN: BREED/.test(r.first[4]), 'the armed label: ' + r.first[4]); same(r.second.join(), 'bred,70,1,false', 'the second'); same(r.refused.join(), 'refused,10,false', 'refused'); same(r.third.join(), 'armed,true', 'armed again'); same(r.disarmed.join(), 'false,armed', 'disarmed');
        ok(/breedTap\(one\)/.test(rd('js/commandcenter.js')) && /breedLabel\(one\)/.test(rd('js/commandcenter.js')), 'the Command Center\'s button'); ok(/breedTap\(r\.f\)/.test(rd('js/radialmenu.js')), 'the phone\'s button');
    });
    check('the squad full: breeding asks first who makes room and nothing is paid; CANCEL pays nothing; a choice breeds and pays once, and the offspring holds a room', () => {
        const r = J(`(function(){ __clearF(); shardCount = 0; const a = __rec('fire', 'brawler'), b = __rec('ice', 'sniper'); __rec('core', 'camper'); __bond(a, b); shardCount = 200; const o = {}; const n = followers.length; o.full = partyFull();
            o.asked = [breedStart(a), partyPickBusy(), shardCount, followers.length - n]; partyPickChoose('cancel'); o.cancel = [partyPickBusy(), shardCount, followers.length - n];
            breedStart(a); partyPickChoose('nobody'); const c = followers[followers.length - 1]; o.done = [partyPickBusy(), shardCount, followers.length - n, !!c.bred, !!c.post]; return o; })()`);
        same(r.full, true, 'the squad was full'); same(r.asked.join(), 'true,true,200,0', 'asked'); same(r.cancel.join(), 'false,200,0', 'CANCEL'); same(r.done.join(), 'false,150,1,true,true', 'NOBODY: bred, paid once, holds a room');
    });
    check('a RE-ROLL makes someone new: hp0 and bred are cleared with the rest of its identity', () => {
        const r = J(`(function(){ __clearF(); shardCount = 0; const a = __rec('fire', 'brawler'), b = __rec('ice', 'sniper'); __bond(a, b); shardCount = 50; const c = breedMake(a); const had = Number.isFinite(c.hp0) && !!c.bred; const did = startFollowerReroll(c, true); return [had, did, c.hp0 === undefined, c.bred === undefined, c.personality]; })()`);
        same(r.join(), 'true,true,true,true,', 'cleared');
    });

    group('3. A DEATH COSTS NOTHING, AND THE VITAL ITEMS ARE GONE (the owner, 2026-11-01: "They need to be revived with the same amount of HP"; the Vital items: "Remove them")');
    check('a follower struck down comes back at the Crystal with its HP stat and its XP as they were; no Vital Fleck, Prism or Core is left: not in the pack\'s table, not hidden in the facility, no VITAL table', () => {
        const r = J(`(function(){ __clearF(); shardCount = 0; const f = __rec('fire', 'brawler'); gainXp(f, xpForLevel(f.level + 1) - f.xp + 37); const hp = f.base.hp, xp = f.xp, lv = f.level; f.dead = true; f.health = 0; __step(); const q = respawnQueue.find(e => e.uid === f.uid); if (q) { q.timer = 1; __step(); } const e = followers.find(x => x.uid === f.uid && x !== f);
            return { back: !!e, hp: e && e.base.hp === hp, xp: e && e.xp === xp, lv: e && e.level === lv, items: ['vital_fleck', 'vital_prism', 'vital_core'].filter(id => ITEMS[id] || ITEM_ORDER.includes(id)).length, pickups: FACILITY_MAP.pickups.filter(p => /vital/.test(p.id) || (p.items || []).some(i => /vital/.test(i[0]))).length, table: typeof VITAL }; })()`);
        same(r.back, true, 'it did not come back'); same([r.hp, r.xp, r.lv].join(), 'true,true,true', 'its HP stat, XP and level'); same(r.items, 0, 'a Vital item in the pack\'s table'); same(r.pickups, 0, 'a Vital case in the facility'); same(r.table, 'undefined', 'the VITAL table');
    });
    check('an older save: a follower whose deaths wore its HP stat down gets it back on load, up to what it was born with (never past it); a pack holding Vital items loads without them', () => {
        const r = J(`(function(){ __clearF(); shardCount = 0; const f = __rec('ice', 'sniper'), born = followerHp0(f), rec = followerRecord(f); rec.base = Object.assign({}, rec.base, { hp: born - 3 }); const u = spawnFollowerFromSave(JSON.parse(JSON.stringify(rec)));
            const whole = followerRecord(f); const w = spawnFollowerFromSave(JSON.parse(JSON.stringify(whole)));
            const sv = facilitySaveCollect(); sv.inv = Object.assign({}, sv.inv, { vital_prism: 2, flare: 1 }); let err = null; try { facilitySaveApply(sv); } catch (x) { err = x.message; }
            return { worn: u.base.hp === born, whole: w.base.hp === whole.base.hp, err, prism: invCount('vital_prism'), flare: invCount('flare'), listed: invItems('all').indexOf('vital_prism') }; })()`);
        same([r.worn, r.whole].join(), 'true,true', 'the hp stat on load'); same(r.err, null, 'the load threw'); same(r.prism, 0, 'a Vital Prism came back'); ok(r.flare >= 1, 'the rest of the pack did not'); same(r.listed, -1, 'the pack lists a Vital Prism');
    });

    group('4. THE PAGE: the scripts, the probes, the INFO');
    check('js/breeding.js is on the page with its probe (js/vital.js is gone); the INFO of a follower says where it came from and its hp stat', () => {
        const html = rd('game.html'); ok(/js\/breeding\.js\?v=/.test(html) && !/js\/vital\.js/.test(html), 'the scripts'); ok(/"js\/breeding\.js": "BREED"/.test(html), 'the probe');
        const r = J(`(function(){ __clearF(); shardCount = 0; const a = __rec('fire', 'brawler'), b = __rec('ice', 'sniper'); __bond(a, b); shardCount = 50; const c = breedMake(a, () => 0.5); a.base.hp -= 2; const rows = x => unitInfo(x).stats.find(s => s.h === 'VITALS').rows.map(r => r.join('=')).join('|'); return [rows(a), rows(c)]; })()`);
        ok(/ORIGIN=RECRUITED/.test(r[0]) && /HP STAT=\d+/.test(r[0]) && !/LOST/.test(r[0]), 'a recruit\'s INFO: ' + r[0]); ok(/ORIGIN=BRED · GEN 1/.test(r[1]) && /HP STAT=[\d.]+/.test(r[1]) && !/LOST/.test(r[1]), 'an offspring\'s INFO: ' + r[1]);
    });

    console.log(failures ? '\n' + failures + ' FAILED' : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
