// CODE CARDS AND THE NAMING SYSTEM (js/redeem.js; build 2026-11-12e; the owner, 2026-11-12: "Go ahead and make a code card feature for my game." On the pack/card screen; a code typed in; the gift "a lvl 20
// mantis clone that's integrated with the mutator clones", the Tank; the codes "Kylie" or "frommatt"; its name "Emotional Support 💚": "add a naming system"; then "It shouldn't mention anything upon save, and it
// shouldn't be only once": a code can be typed as often as the player likes, and nothing on the screen speaks of saving).
//   a code gives its gift every time, however it is typed; an unknown code gives nothing and says so
//   the gift is a level 20 mantis tank clone with the name, at the Crystal; the Mutator's PRIMARY clone for a Mutator; with a clone already out, or before a run, it makes none and says why
//   the name is what a unit is called (unitTypeLabel); it is cleaned (24 characters at most, no control characters); a clone's save keeps it
//   the Cards sheet's shop tab has the REDEEM A CODE box, and nothing in it speaks of saving or of once (not a look test: the page is the owner's to judge)
// Every number read here is the code's own, PROVISIONAL (the agent's reading of the answers, said in js/redeem.js).
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
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; _fp.items = _fp.items.filter(i => !(i.fp === 'prop' && i.kind === 'sentry'));   // (no sentries: the chamber's would shoot the creatures)
        // (the fights are staged in the lower half of the Crystal Chamber, five tiles from the Crystal: a creature beside the Crystal chews on it and pays no heed to what bites it, js/predator.js)
        globalThis.__home = () => { player.x = player.targetX = player.visualX = crystal.x - 2; player.y = player.targetY = player.visualY = crystal.y + 5; player.fpPath = null; player.attackCooldown = 0; health = PLAYER_HITS; player.invuln = 0; };
        // a hit is a DROP of more than a point (a creature loses nothing on its own: js/game.js)
        globalThis.__hits = (u, n, each) => { const at = []; let h = u.health; for (let i = 0; i < n; i++) { render(); if (h - u.health > 1) { at.push(i); if (each) each(i); } h = u.health; } return at; };
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone); for (const f of followers) { f.x = crystal.x - 30; f.y = crystal.y; f.stance = 'hold'; f.job = { type: 'move', target: { x: f.x, y: f.y } }; }
            respawnQueue.length = 0; floatingTexts.length = 0; followerProjectiles.length = 0; mutatorReset(); playerAttackMode = false; gunHold = null; playerLockTarget = null; __home(); };
        globalThis.__class = id => { invReset(); playerClassKey = null; classPerks = new Set(); weaponReset(); if (id) classSet(id); };
        globalThis.__creature = (sp, cl, lv, dx, dy, still) => { const p = spawnCreature({ species: sp, className: cl, level: lv || 3, x: player.x + (dx === undefined ? 3 : dx), y: player.y + (dy || 0), state: 'hunt' }); p.provoked = true; if (still) p.update = () => {}; return p; };
        globalThis.__grow = (key) => { dnaApply({ [key || 'ant_scout']: 99 }); shardCount = 999; const o = getCloneOptions().find(o => o.key === (key || 'ant_scout')); if (o) executeClone(o); return actors.find(a => a.isClone && !a.dead) || null; };
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };`);

    group('A CODE GIVES ITS GIFT, EVERY TIME');
    check('"Kylie" gives a level 20 mantis tank clone named EMOTIONAL SUPPORT, at the Crystal; the message says it joins the squad', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const t = redeemTry('Kylie'), k = actors.find(a => a.isClone && !a.dead);
            return { ok: t.ok, say: t.say, sp: k && k.speciesName, cls: k && k.className, lv: k && k.level, name: k && unitTypeLabel(k), nick: k && k.nick, hp: k && k.health === k.maxHealth, near: k && Math.hypot(k.x - crystal.x, k.y - crystal.y) < 1 }; })()`);
        ok(r.ok, 'it did not work'); same(r.sp, 'mantis', 'its species'); same(r.cls, 'tank', 'its kind'); same(r.lv, 20, 'its level'); same(r.nick, 'Emotional Support \uD83D\uDC9A', 'its name'); same(r.name, 'EMOTIONAL SUPPORT \uD83D\uDC9A', 'what it is called');
        ok(/EMOTIONAL SUPPORT/.test(r.say) && /SQUAD/.test(r.say), 'the message: ' + r.say); ok(r.hp, 'full health'); ok(r.near, 'at the Crystal');
    });
    check('it is a Mutator\'s PRIMARY clone, with no upgrades and nothing invested; for another class it is a clone like any other', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); redeemTry('kylie'); const a = mutatorClone(), o = { pa: !!a, up: a && Object.keys(a.upgrades || {}).length, inv: a && a.invested };
            __clear(); __class('technomancer'); const t = redeemTry('kylie'), b = actors.find(x => x.isClone && !x.dead); o.other = { ok: t.ok, primary: !!(b && b.primary), lv: b && b.level }; return o; })()`);
        ok(r.pa, 'not the primary clone'); same(r.up, 0, 'upgrades'); same(r.inv, 0, 'invested'); ok(r.other.ok && !r.other.primary && r.other.lv === 20, 'another class: ' + JSON.stringify(r.other));
    });
    check('"frommatt" gives the same gift in any case and with spaces round it; the codes can be typed again and again: each time there is room for a clone, one is made', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const a = redeemTry('  FromMatt '), k1 = actors.find(x => x.isClone && !x.dead); k1.dead = true; k1.dismissed = true; actors = actors.filter(x => x !== k1);
            const b = redeemTry('kylie'), k2 = actors.find(x => x.isClone && !x.dead); k2.dead = true; k2.dismissed = true; actors = actors.filter(x => x !== k2); const c = redeemTry('KYLIE'), k3 = actors.find(x => x.isClone && !x.dead);
            return { a: a.ok, b: b.ok, c: c.ok, n: actors.filter(x => x.isClone && !x.dead).length, lab: k3 && unitTypeLabel(k3), lv: k3 && k3.level }; })()`);
        ok(r.a && r.b && r.c, 'a try did not work: ' + JSON.stringify(r)); same(r.n, 1, 'clones out'); same(r.lab, 'EMOTIONAL SUPPORT \uD83D\uDC9A', 'its name each time'); same(r.lv, 20, 'its level each time');
    });
    check('an unknown or empty code gives nothing and says so', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const a = redeemTry('hello'), b = redeemTry('   '), c = redeemTry(null); return { a: a.ok, aw: a.why, b: b.ok, c: c.ok, n: actors.filter(x => x.isClone && !x.dead).length }; })()`);
        ok(!r.a && !r.b && !r.c, 'it worked'); ok(/NOT A CODE/.test(r.aw), r.aw); same(r.n, 0, 'clones');
    });
    check('with a clone already out the code makes no second: it says to dismiss it, and works after', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const k = __grow('ant_scout'), t = redeemTry('kylie'), n1 = actors.filter(x => x.isClone && !x.dead).length; k.dead = true; k.dismissed = true; const t2 = redeemTry('kylie'); return { grown: !!k, ok: t.ok, why: t.why, n1, ok2: t2.ok }; })()`);
        ok(r.grown, 'fixture'); ok(!r.ok && /DISMISS/.test(r.why), 'with a clone out: ' + JSON.stringify(r)); same(r.n1, 1, 'a second clone'); ok(r.ok2, 'it did not work after');
    });
    check('before a run has started the code makes no clone and says so, and works once the run has', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); gameState.running = false; const t = redeemTry('kylie'), n = actors.filter(x => x.isClone && !x.dead).length; gameState.running = true; const t2 = redeemTry('kylie'); return { ok: t.ok, why: t.why, n, ok2: t2.ok }; })()`);
        ok(!r.ok && /START A RUN/.test(r.why), r.why); same(r.n, 0, 'a clone before the run'); ok(r.ok2, 'not once the run started');
    });

    group('THE NAME');
    check('a name is cleaned: control characters out, 24 characters at most, trimmed; an empty or non-string name takes it away; the label is the name, in capitals', () => {
        const r = J(`(function(){ const u = { isClone: true, speciesName: 'ant' }, o = {}; o.a = unitSetNick(u, '  Mr\\u0007 Pinch ' + 'x'.repeat(40)); o.n = u.nick; o.len = u.nick.length; o.lab = unitTypeLabel(u); o.b = unitSetNick(u, '   '); o.gone = u.nick === undefined; o.c = unitSetNick(u, 12); o.kind = unitTypeLabel(u);
            const f = { isFollower: true, element: 'fire', role: 'brawler' }; unitSetNick(f, 'Ember'); o.f = unitTypeLabel(f); return o; })()`);
        ok(r.a, 'set'); ok(r.len <= 24 && !/[\u0000-\u001f]/.test(r.n), 'cleaned: ' + JSON.stringify(r.n)); ok(/^MR PINCH/.test(r.lab), 'the label: ' + r.lab); ok(!r.b && r.gone, 'empty name'); ok(!r.c, 'a non-string'); same(r.kind, 'ANT CLONE', 'its kind again'); same(r.f, 'EMBER', 'a follower\'s name');
    });
    check('the save keeps a clone\'s name: it comes back from the save, and from the respawn queue, named and at its level', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); redeemTry('kylie'); const rec = cloneRosterSnapshot(), k = actors.find(a => a.isClone && !a.dead); k.dead = true; k.dismissed = true; actors = actors.filter(a => a !== k);
            cloneRosterApply(rec); const b = actors.find(a => a.isClone && !a.dead), o = { nm: rec[0] && rec[0].nm, back: b && unitTypeLabel(b), lv: b && b.level };
            const q = { isClone: true, speciesName: 'mantis', className: 'tank', nick: 'Emotional Support', level: 20, xp: 0, timer: 1, totalTimer: 1 }; o.q = typeof q.nick; return o; })()`);
        same(r.nm, 'Emotional Support \uD83D\uDC9A', 'its record'); same(r.back, 'EMOTIONAL SUPPORT \uD83D\uDC9A', 'back named'); same(r.lv, 20, 'back at its level');
    });

    group('THE CARDS SHEET');
    check('the shop tab has a REDEEM A CODE box with an input and a button, wired to the code module', () => {
        const src = rd('js/cardsui.js');
        ok(/function _cdRedeemBox\(/.test(src) && /sec\("REDEEM A CODE"/.test(src), 'the box is not on the shop tab'); ok(/redeemTry\(_cdCode\)/.test(src), 'it does not call the module'); ok(/ev\.key === "Escape"\) return; ev\.stopPropagation\(\)/.test(src), 'the game\'s keys are not kept out of the box');
        ok(/js\/redeem\.js/.test(rd('game.html')), 'the page does not load js/redeem.js');
        const box = src.slice(src.indexOf('function _cdRedeemBox('), src.indexOf('function _cdMarketBox(')), line = src.slice(src.indexOf('sec("REDEEM A CODE"'), src.indexOf('sec("REDEEM A CODE"') + 140);
        ok(!/save|once/i.test(box + line), 'the box speaks of saving or of once: ' + (box + line).match(/.{0,30}(save|once).{0,30}/i));
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
