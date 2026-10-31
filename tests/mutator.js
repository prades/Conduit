// THE MUTATOR: the lash and the one clone (docs/MUTATOR.md; js/mutator.js, js/clone.js, js/npc.js, js/weapons.js, js/classes.js, js/game.js).
// ASKED (the brief, step 4): "Implement the Mutator's basic melee combat and single-clone lifecycle." "Mutator: melee-focused summoner [...] Fights alongside a single primary cloned creature." "The Mutator normally has
// only one active primary clone." "Clones should use the established designs and characteristics of their corresponding enemy species." "If the clone dies [...] a replacement must be created."
//   THE CLONE FIGHTS AS ITS SPECIES   its bite (its power, in the creature's two beats), its special, a striker's abdomen shot (it struck with a follower's plain 1.25 swing before)
//   CLONING IS THE MUTATOR'S          CLASS_RULES.clone: the class with the skill, one at a time; anyone else is told who can
//   THE ONE CLONE                     it follows, takes the squad's orders, and when it falls it does not come back: its body stays; a dismissed clone never comes back
//   THE LASH                          the Mutator's weapon: walk into reach, draw back, strike; a creature that slips away in the wind-up is missed; it spends no ammunition
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

    group('THE CLONE FIGHTS AS ITS SPECIES (it struck with a follower\'s plain 1.25 swing, whatever its power)');
    check('a clone bites with its power, in the creature\'s two beats: it rears back (attackWindup, the telegraph over it, its target named) and the bite lands COMBAT.bite.windup frames later for about its power', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const c = makeClone('ant', 'scout', player.x + 1, player.y, 'hunt'); const e = __creature('ant', 'scout', 5, 2.1, 0, true); e.health = e.maxHealth = 1e6;
            let first = null, land = null, dealt = 0, tgt = null, h = e.health; for (let i = 0; i < 300 && land === null; i++) { render(); if (c.attackWindup > 0 && first === null) { first = i; tgt = c.biteTarget === e; } if (h - e.health > 1) { land = i; dealt = h - e.health; } h = e.health; }
            return { first, land, dealt, tgt, power: c.power, mult: defenseMult(e, c), windup: COMBAT.bite.windup }; })()`);
        ok(r.first !== null, 'it never reared back'); same(r.tgt, true, 'it reared back at the creature');
        ok(r.land !== null && r.land - r.first >= r.windup - 1, 'the bite landed at ' + r.land + ', the wind-up began at ' + r.first);
        ok(Math.abs(r.dealt - r.power * r.mult) < 1.5, 'the bite took ' + r.dealt + ', its power through the creature\'s defense is ' + (r.power * r.mult).toFixed(1));
        ok(r.dealt > 5, 'a bite is not the plain 1.25 swing any more: ' + r.dealt);
    });
    check('ONE PREDATOR AGAINST ONE CLONE (the brief\'s test): a fresh ant scout clone beats an ant scout of its own level, several bites each way, and keeps most of its health', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const c = makeClone('ant', 'scout', player.x + 1, player.y + 0.5, 'hunt'); const e = __creature('ant', 'scout', c.level, 3, 0.5);
            let cb = 0, eb = 0; const _ad = applyDamage; applyDamage = function (t, a, s, el, rf) { const h = t.health; _ad(t, a, s, el, rf); if (t.health < h) { if (t === e) cb++; else if (t === c) eb++; } };
            let n = 0; for (; n < 1500 && !c.dead && !e.dead; n++) render(); applyDamage = _ad; return { cloneDead: !!c.dead, enemyDead: !!e.dead, cb, eb, n, left: c.health / c.maxHealth }; })()`);
        same(r.enemyDead, true, 'the creature still stands after ' + r.n + ' frames'); same(r.cloneDead, false, 'the clone fell');
        ok(r.cb >= 2, 'the creature fell to ' + r.cb + ' bite(s): a creature should survive several hits'); ok(r.eb >= 1, 'the creature never bit back'); ok(r.left > 0.5, 'the clone kept ' + Math.round(r.left * 100) + '%');
    });
    check('its special is its species\': an ant striker clone winds up MANDIBLE FRENZY at a creature in reach and it hurts the creature, never one of yours', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const c = makeClone('ant', 'striker', player.x + 1, player.y, 'hunt'); c.abilityCharge = 100; const e = __creature('ant', 'tank', 4, 2.2, 0, true); e.health = e.maxHealth = 1e6;
            const f = followers[0]; f.x = c.x - 0.6; f.y = c.y; f.job = { type: 'move', target: { x: f.x, y: f.y } }; f.attackCooldown = 1e6; f.currentWill = 0; const fh = f.health; let key = null, hurt = 0, h = e.health;   // (a follower that does not strike: what is measured is the clone's special)
            for (let i = 0; i < 160; i++) { render(); if (c.abilityPhase === 'winding' || c.abilityPhase === 'active') key = c.abilityKey; } return { key, hurt: h - e.health, mine: fh - f.health }; })()`);
        same(r.key, 'MANDIBLE_FRENZY', 'the special it wound up'); ok(r.hurt > 0, 'the creature was not hurt'); same(r.mine, 0, 'the follower beside it was hurt');
    });
    check('a striker clone\'s abdomen shot hits the creature (an untagged shot: a creature\'s hits your side), never a recruit walking to the Crystal', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const c = makeClone('scorpion', 'striker', player.x, player.y + 2, 'hunt'); c.update = c.update; const e = __creature('ant', 'tank', 4, -2.5, 2, true); e.health = e.maxHealth = 1e6;
            c.dirX = 1; c.dirY = 0; c._nearestEnemy = e; c.abdomenTimer = c.abdomenCooldown; const n0 = followerProjectiles.length; cloneTick(c); const shot = followerProjectiles[followerProjectiles.length - 1];
            const out = { fired: followerProjectiles.length > n0, tagged: shot ? !!shot.targetsGreen : null, dmg: shot ? shot.damage : 0, range: c.rangeDamage };
            const nr = { x: c.x - 2, y: c.y, team: 'red', isNeutralRecruit: true, dead: false, health: 10, maxHealth: 10 }; actors.push(nr); followerProjectiles.length = 0; e.x = c.x + 30; c._nearestEnemy = null; c.lastAttacker = null; c.abdomenTimer = c.abdomenCooldown; c._abdomenTick();
            out.atRecruit = followerProjectiles.length; actors = actors.filter(a => a !== nr); return out; })()`);
        same(r.fired, true, 'no shot'); same(r.tagged, false, 'the clone\'s shot was tagged to hit your side'); ok(r.dmg > 0 && r.dmg === r.range, 'its damage ' + r.dmg + ' (its rangeDamage ' + r.range + ')'); same(r.atRecruit, 0, 'it shot at a recruit');
    });
    check('makeClone gives a clone its species\' shot and its special (it was built without either)', () => {
        const r = J(`(function(){ const c = makeClone('scorpion', 'striker', crystal.x, crystal.y + 2); const o = { abd: c.abdomenAttack, rd: c.rangeDamage, key: c.abilityKey, base: SPECIES.scorpion.striker.rangeDamage }; c.dead = true; c.dismissed = true; render(); return o; })()`);
        same(r.abd, true, 'abdomenAttack'); ok(r.rd >= r.base, 'rangeDamage ' + r.rd); same(r.key, 'VENOM_LANCE', 'its special');
    });

    group('CLONING IS THE MUTATOR\'S (CLASS_RULES.clone: the class with the skill, one at a time)');
    check('with no class yet, or as a Gunslinger or a Technomancer, the bay grows nothing and says who can; a Mutator grows one', () => {
        const r = J(`(function(){ const o = {}; for (const id of [null, 'gunslinger', 'technomancer', 'mutator']) { __clear(); __class(id); dnaApply({ ant_scout: 99 }); shardCount = 999; const opt = getCloneOptions().find(x => x.key === 'ant_scout');
                floatingTexts.length = 0; executeClone(opt); o[id || 'none'] = { ready: opt.ready, made: actors.filter(a => a.isClone && !a.dead).length, why: cloneBlockedReason(opt), label: cloneBlockedLabel(opt), said: floatingTexts.map(t => t.text).join('|') }; }
            return o; })()`);
        same(r.none.made, 0, 'no class'); ok(/AFTER THE TUTORIAL/.test(r.none.why) && /MUTATOR/.test(r.none.why), 'no class: ' + r.none.why);
        for (const k of ['gunslinger', 'technomancer']) { same(r[k].made, 0, k + ' grew a clone'); same(r[k].ready, false, k + ' ready'); ok(/ONLY A MUTATOR/.test(r[k].why), k + ': ' + r[k].why); ok(/MUTATOR ONLY/.test(r[k].label), k + ' label: ' + r[k].label); ok(/ONLY A MUTATOR/.test(r[k].said), k + ' was not told: ' + r[k].said); }
        same(r.mutator.made, 1, 'the Mutator grew none'); same(r.mutator.ready, true, 'ready');
    });
    check('one at a time: with its clone out, a Mutator\'s second is refused ("ONE CLONE AT A TIME"), and the cap is the rule\'s', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const a = __grow('ant_scout'); dnaApply({ beetle_scout: 99 }); const opt = getCloneOptions().find(x => x.key === 'beetle_scout'); executeClone(opt);
            return { first: !!a, live: actors.filter(x => x.isClone && !x.dead).length, cap: cloneCap(), rule: CLASS_RULES.clone.max, why: cloneBlockedReason(opt) }; })()`);
        same(r.first, true, 'the first'); same(r.live, 1, 'clones out'); same(r.cap, r.rule, 'the cap'); same(r.cap, 1, 'the rule\'s max'); ok(/ONE CLONE AT A TIME/.test(r.why), r.why);
    });
    check('in the bay, at the Mutator\'s cap of one: the bay is that clone\'s (no card can be bought), RELEASE (two taps) frees the slot, and the cards can be bought again', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); __grow('ant_scout'); dnaApply({ ant_scout: 99, ant_striker: 99 }); cloneMenuOpen = true; crystalCloneSort = 'species'; _crystalScrollX = 0; drawCloneMenu();
            const tab = () => window._cloneTabOpts || []; const o = { atCap: tab().filter(x => typeof x._bx === 'number').length, panel: !!(window._cloneTabBounds && window._cloneTabBounds.upgrades), release: _mxUpBtns.some(b => b.act === 'release') };
            const rel = _mxUpBtns.find(b => b.act === 'release'); for (let k = 0; k < 2; k++) { handleCloneMenuTap(rel.r.x + 5, rel.r.y + 5); drawCloneMenu(); } __frames(2); cloneMenuOpen = true; drawCloneMenu();
            o.after = tab().filter(x => x.ready).length; o.live = actors.filter(a => a.isClone && !a.dead).length; o.bodies = cloneBodies.length; cloneMenuOpen = false; return o; })()`);
        same(r.atCap, 0, 'cards to buy at the cap'); same(r.panel, true, 'the bay is not the clone\'s'); same(r.release, true, 'no RELEASE'); same(r.live, 0, 'RELEASE left the clone'); ok(r.after >= 2, 'cards ready after RELEASE: ' + r.after); same(r.bodies, 0, 'a released clone left a body');
    });
    check('the rule is data: with no skill in it every class may clone again, up to MAX_CLONES, and those clones are not primary (they come back at the Crystal)', () => {
        const r = J(`(function(){ const keep = CLASS_RULES.clone; CLASS_RULES.clone = { skill: null }; __clear(); __class('gunslinger'); dnaApply({ ant_scout: 99 }); shardCount = 999; const opt = () => getCloneOptions().find(x => x.key === 'ant_scout');
            for (let i = 0; i < 6; i++) executeClone(opt()); const cl = actors.filter(a => a.isClone && !a.dead), o = { n: cl.length, cap: cloneCap(), max: MAX_CLONES, primary: cl.some(a => a.primary) }; CLASS_RULES.clone = keep; return o; })()`);
        same(r.n, r.max, 'clones grown'); same(r.cap, r.max, 'the cap'); same(r.primary, false, 'a clone of the open rule is primary');
    });
    check('the Mutator\'s clone is its PRIMARY clone (mutatorClone), the bay told you (YOUR CLONE: ANT SCOUT), and with no clone out the bay\'s header counts YOUR CLONE 0/1', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const c = __grow(); const told = floatingTexts.map(t => t.text).join('|'); const said = []; const keep = uiText, keepF = uiTextFit; uiText = (t) => said.push(String(t)); uiTextFit = (t) => said.push(String(t));
            try { cloneMenuOpen = true; drawCloneMenu(); dismissOldestClone(); __frames(1); drawCloneMenu(); } finally { uiText = keep; uiTextFit = keepF; cloneMenuOpen = false; }
            return { primary: !!(c && c.primary), told, said }; })()`);
        same(r.primary, true, 'primary'); ok(/YOUR CLONE: ANT SCOUT/.test(r.told), 'the bay said: ' + r.told); ok(r.said.some(t => /ANT SCOUT CLONE/.test(t)), 'the bay does not name it: ' + r.said.join(' | ')); ok(r.said.some(t => /YOUR CLONE 0\/1/.test(t)), 'the header with none out: ' + r.said.join(' | '));
    });

    group('THE ONE CLONE: it follows, it takes the orders, and when it falls it stays fallen');
    check('it follows the Mutator: grown at the Crystal, it walks to the player and stays near', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const c = __grow(); const d0 = Math.hypot(c.x - player.x, c.y - player.y); __frames(600); return { d0, d1: Math.hypot(c.x - player.x, c.y - player.y) }; })()`);
        ok(r.d1 < r.d0 && r.d1 < 3.5, 'from ' + r.d0.toFixed(1) + ' to ' + r.d1.toFixed(1) + ' tiles from the player');
    });
    check('it takes the squad\'s orders: the battle tool\'s pool has it, RETREAT pulls it back, HOLD holds it where it stands, COME lets it follow again', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const c = __grow(); squadMode = 'all'; if (typeof ccClearSelection === 'function') ccClearSelection(); const o = { inPool: getCommandPool().includes(c) };
            mixToolRetreat(); o.retreat = c.retreatUntil > frame; partyApplyStance([c], 'hold'); o.hold = !!(c.job && c.job.type === 'move') && c.stance === 'hold'; partyApplyStance([c], 'follow'); o.come = !c.job && c.stance === 'follow'; return o; })()`);
        same(r.inPool, true, 'the pool'); same(r.retreat, true, 'RETREAT'); same(r.hold, true, 'HOLD'); same(r.come, true, 'COME');
    });
    check('when it falls: DEFEATED is said, nothing is queued to bring it back, its body lies where it fell (its kind and level), the player is told, and the bay can grow a new one', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const c = __grow(); __frames(5); const at = [c.x, c.y], lv = c.level; floatingTexts.length = 0; const foe = { x: c.x + 1, y: c.y, team: 'red' };
            for (let i = 0; i < 10 && !c.dead; i++) applyDamage(c, c.maxHealth, foe); __frames(2);   // (no hit takes more than COMBAT.hitCap of it: a few)
            const b = cloneBodies[0], opt = getCloneOptions().find(x => x.key === 'ant_scout');
            return { queued: respawnQueue.filter(e => e.isClone).length, bodies: cloneBodies.length, kind: b ? b.sp + ' ' + b.cls : null, lv: b ? b.level === lv : false, near: b ? Math.hypot(b.x - at[0], b.y - at[1]) < 0.01 : false,
                     said: floatingTexts.map(t => t.text).join('|'), alive: !!mutatorClone(), ready: opt.ready }; })()`);
        same(r.queued, 0, 'it was queued to come back'); same(r.bodies, 1, 'bodies'); same(r.kind, 'ant scout', 'the body\'s kind'); same(r.lv, true, 'the body\'s level'); same(r.near, true, 'the body is not where it fell');
        ok(/HAS FALLEN/.test(r.said) && /DEFEATED/.test(r.said), 'what was said: ' + r.said); same(r.alive, false, 'a clone is still out'); same(r.ready, true, 'the bay will not grow a new one');
    });
    check('a DISMISSED clone does not come back (a dismissed clone used to come back 20 seconds later and fill the slot again), and the Mutator\'s leaves no body', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); __grow(); dismissOldestClone(); __frames(3); const o = { queued: respawnQueue.length, bodies: cloneBodies.length };
            const keep = CLASS_RULES.clone; CLASS_RULES.clone = { skill: null }; __clear(); __class('gunslinger'); dnaApply({ ant_scout: 99 }); shardCount = 999; executeClone(getCloneOptions().find(x => x.key === 'ant_scout')); dismissOldestClone(); __frames(3);
            o.plainQueued = respawnQueue.length; CLASS_RULES.clone = keep; return o; })()`);
        same(r.queued, 0, 'the Mutator\'s dismissed clone was queued'); same(r.bodies, 0, 'a dismissed clone left a body'); same(r.plainQueued, 0, 'a dismissed plain clone was queued');
    });
    check('a clone of the open rule still comes back at the Crystal after CLONE_RESPAWN_FRAMES (the old life is kept for it)', () => {
        const r = J(`(function(){ const keep = CLASS_RULES.clone; CLASS_RULES.clone = { skill: null }; __clear(); __class('gunslinger'); const c = __grow(); c.dead = true; __frames(2); const q = respawnQueue.find(e => e.isClone); CLASS_RULES.clone = keep; return { q: !!q, t: q ? q.totalTimer : 0, bodies: cloneBodies.length }; })()`);
        same(r.q, true, 'not queued'); same(r.t, run('CLONE_RESPAWN_FRAMES'), 'the wait'); same(r.bodies, 0, 'a plain clone left a body');
    });
    check('the save keeps the Mutator\'s clone as its primary and the body of one that fell; a reload brings both back', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const c = __grow(); __frames(2); c.dead = true; __frames(2); __grow(); __frames(2); const d = JSON.parse(JSON.stringify(facilitySaveCollect()));
            actors = actors.filter(a => !a.isClone); mutatorReset(); cloneRosterApply(d.clones); cloneBodiesApply(d.bodies); return { clones: d.clones.map(x => x.pr || 0), bodies: d.bodies.length, back: !!mutatorClone(), bodiesBack: cloneBodies.length, kind: cloneBodies[0] && cloneBodies[0].sp }; })()`);
        same(r.clones.join(), '1', 'the clone record'); same(r.bodies, 1, 'the saved bodies'); same(r.back, true, 'the primary clone did not come back as primary'); same(r.bodiesBack, 1, 'the body did not come back'); same(r.kind, 'ant', 'the body\'s kind');
    });
    check('the body is drawn where it fell (a body item in the draw list; drawn as the creature, still, with its name), and a new game clears it', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const c = __grow(); c.x = player.x + 1; c.y = player.y; c.dead = true; __frames(2); const list = []; cloneBodiesDrawItems(list); let err = null, said = [];
            const keep = ctx.fillText; ctx.fillText = (t) => said.push(String(t)); try { drawCloneBody(cloneBodies[0], 400, 300); } catch (e) { err = e.message; } finally { ctx.fillText = keep; }
            const o = { items: list.filter(i => i.type === 'body').length, err, said: said.join('|') }; mutatorReset(); o.after = cloneBodies.length; return o; })()`);
        same(r.items, 1, 'body items'); same(r.err, null, 'drawing it threw'); ok(/ANT SCOUT CLONE/.test(r.said) && /FALLEN/.test(r.said), 'its plate: ' + r.said); same(r.after, 0, 'a new game kept the body');
        ok(/obj\.type==='body'/.test(rd('js/game.js')) && /cloneBodiesDrawItems\(drawList\)/.test(rd('js/game.js')), 'game.js does not draw bodies');
    });

    group('THE LASH: the Mutator\'s weapon, in two beats, in reach');
    check('choosing the Mutator puts the TENTACLE LASH in hand; no other class has it (EQUIP says whose it is); the HUD says MELEE and it is never dry', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const o = { w: playerWeapon, has: weaponHas('lash'), hud: weaponHud().kind, dry: weaponDry() }; __class('gunslinger'); o.gs = [playerWeapon, weaponHas('lash'), weaponEquip('lash').why]; return o; })()`);
        same(r.w, 'lash', 'in hand'); same(r.has, true, 'the Mutator has it'); same(r.hud, 'melee', 'the HUD'); same(r.dry, false, 'dry');
        same(r.gs[0], 'service', 'the Gunslinger\'s weapon'); same(r.gs[1], false, 'the Gunslinger has the lash'); ok(/MUTATOR'S OWN/.test(r.gs[2]), 'EQUIP said: ' + r.gs[2]);
    });
    check('a click on a creature in reach: the tentacle draws back for MUTATOR.lash.windup frames, then lands for the weapon\'s damage (a number over it); no round is spent', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const e = __creature('ant', 'scout', 4, 1.0, 0, true); e.health = e.maxHealth = 1e6; playerAttackMode = true; const ammo = playerAmmo, h0 = e.health;
            const began = firePlayerShot(e); const o = { began, winding: mutatorLashing() }; let land = null; for (let i = 0; i < 40 && land === null; i++) { render(); if (h0 - e.health > 1) land = i; }
            o.land = land; o.dealt = h0 - e.health; o.dmg = weaponDamage('lash') * defenseMult(e, { x: player.x, y: player.y }); o.ammo = playerAmmo - ammo; o.windup = MUTATOR.lash.windup; o.num = floatingTexts.some(t => t.world && /^\\d+$/.test(t.text)); return o; })()`);
        same(r.began, true, 'the strike did not begin'); same(r.winding, true, 'it did not draw back'); ok(r.land !== null && r.land >= r.windup - 2, 'it landed at frame ' + r.land + ' (wind-up ' + r.windup + ')');
        ok(Math.abs(r.dealt - r.dmg) < 1.5, 'it took ' + r.dealt + ' (the lash ' + r.dmg.toFixed(1) + ')'); same(r.ammo, 0, 'rounds spent'); same(r.num, true, 'no number over it');
    });
    check('a creature out of reach is walked to, and struck once it is in reach: one click, one strike', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const e = __creature('ant', 'scout', 4, 4.5, 0, true); e.health = e.maxHealth = 1e6; playerAttackMode = true; const h0 = e.health, d0 = Math.hypot(e.x - player.x, e.y - player.y);
            const began = firePlayerShot(e); const hits = __hits(e, 260).length;
            return { began, d0, d1: Math.hypot(e.x - player.x, e.y - player.y), reach: lashReach(), hits }; })()`);
        same(r.began, false, 'a strike began out of reach'); ok(r.d1 <= r.reach + 0.05, 'the player is ' + r.d1.toFixed(2) + ' tiles away (reach ' + r.reach + ')'); same(r.hits, 1, 'strikes from one click');
    });
    check('holding keeps striking, one lash every windup + cooldown frames', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const e = __creature('ant', 'scout', 4, 1.0, 0, true); e.health = e.maxHealth = 1e6; playerAttackMode = true; playerLockTarget = e;
            gunHold = { x: 0, y: 0, pending: true, released: false, until: 0, button: true }; const at = __hits(e, 200); gunHold = null;
            return { at, cycle: MUTATOR.lash.windup + weaponCooldown('lash') }; })()`);
        ok(r.at.length >= 3, 'strikes: ' + r.at); const gap = r.at[2] - r.at[1]; ok(Math.abs(gap - r.cycle) <= 2, 'strikes ' + gap + ' frames apart (a cycle is ' + r.cycle + ')');
    });
    check('letting go of the hold stops it: no strike after the press ends (it struck once more, the attack was still going); let go while it rests after a strike (one already winding up still lands)', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const e = __creature('ant', 'scout', 4, 1.0, 0, true); e.health = e.maxHealth = 1e6; playerAttackMode = true; playerLockTarget = e;
            gunHold = { x: 0, y: 0, pending: true, released: false, until: 0, button: true }; const held = __hits(e, MUTATOR.lash.windup + 6).length; gunHold.released = true; gunHold.pending = false; const after = __hits(e, 120).length; gunHold = null;
            return { held, after, goal: mutatorLashGoal() }; })()`);
        same(r.held, 1, 'strikes while held'); same(r.after, 0, 'strikes after letting go'); same(r.goal, null, 'the attack goes on');
    });
    check('a creature that slips out of reach in the wind-up is missed: MISS, and no damage', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const e = __creature('ant', 'scout', 4, 1.0, 0, true); e.health = e.maxHealth = 1e6; playerAttackMode = true; const h0 = e.health; firePlayerShot(e); render(); e.x += 3;
            __frames(MUTATOR.lash.windup + 2); return { dealt: h0 - e.health, said: floatingTexts.map(t => t.text).join('|') }; })()`);
        ok(r.dealt < 1, 'it was hit for ' + r.dealt); ok(/MISS/.test(r.said), 'no MISS: ' + r.said);
    });
    check('a tap on the floor calls the attack off (the player walks there and strikes nothing); stowing the weapon does too', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const e = __creature('ant', 'scout', 4, 5, 0, true); e.health = e.maxHealth = 1e6; playerAttackMode = true; const h0 = e.health; firePlayerShot(e); __frames(4);
            const sx = canvas.width / 2 - 2 * TILE_W, sy = canvas.height / 2 + TILE_H; handleInput(sx, sy); const goal = mutatorLashGoal(); __frames(200); const o = { goal, dealt: h0 - e.health };
            firePlayerShot(e); setPlayerAttackMode(false, true); o.stowed = mutatorLashGoal(); return o; })()`);
        same(r.goal, null, 'the attack was not called off'); ok(r.dealt < 3, 'it struck anyway: ' + r.dealt); same(r.stowed, null, 'stowing did not call it off');
    });
    check('every other class keeps its gun: a Gunslinger\'s click fires a round as before', () => {
        const r = J(`(function(){ __clear(); __class('gunslinger'); const e = __creature('ant', 'scout', 4, 3, 0, true); playerAttackMode = true; const a0 = playerAmmo, p0 = followerProjectiles.length; const fired = firePlayerShot(e); return { fired, spent: a0 - playerAmmo, shots: followerProjectiles.length - p0 }; })()`);
        same(r.fired, true, 'it did not fire'); same(r.spent, 1, 'rounds'); same(r.shots, 1, 'projectiles');
    });
    check('the Armory terminal lists each class its own: the Mutator the lash and not the machine gun, the Gunslinger the machine gun and not the lash, the Technomancer its arc gauntlet, no class as before', () => {
        const r = J(`(function(){ const o = {}; for (const id of [null, 'gunslinger', 'technomancer', 'mutator']) { __class(id); o[id || 'none'] = weaponRows().join(); } return o; })()`);
        same(r.none, 'service,machinegun,laser', 'no class'); same(r.gunslinger, 'service,machinegun,laser', 'the Gunslinger'); same(r.technomancer, 'service,laser,gauntlet', 'the Technomancer'); same(r.mutator, 'service,laser,lash', 'the Mutator');
    });
    check('a Mutator\'s game saved before the lash comes back with the lash in hand; one saved with it keeps what was in hand', () => {
        const r = J(`(function(){ __class('mutator'); weaponRestore({ w: 'service', owned: {}, lv: {}, charge: 0 }); const old = playerWeapon; weaponRestore({ w: 'service', owned: {}, lv: {}, charge: 0, cw: 1 }); return { old, kept: playerWeapon }; })()`);
        same(r.old, 'lash', 'the old save'); same(r.kept, 'service', 'a new save that chose the gun');
    });
    check('the player turns to what it lashes, and the lash is drawn (drawing back, then the whip) without a throw; the dial and the small icon show a tentacle', () => {
        const r = J(`(function(){ __clear(); __class('mutator'); const e = __creature('ant', 'scout', 4, 1.0, 0, true); e.health = e.maxHealth = 1e6; playerAttackMode = true; firePlayerShot(e); const o = { face: mutatorFacing() === hdRow(e.x - player.x, e.y - player.y) }; let err = null;
            try { drawMutatorFx(); __frames(MUTATOR.lash.windup + 1); drawMutatorFx(); } catch (x) { err = x.message; } o.err = err; let lash = 0; const keep = _tgLash; _tgLash = function () { lash++; return keep.apply(this, arguments); }; try { targetSet(e, true); drawTargetUI(); } finally { _tgLash = keep; } o.lash = lash; return o; })()`);
        same(r.face, true, 'the player does not face the creature'); same(r.err, null, 'the lash drawing threw'); ok(r.lash >= 1, 'no tentacle glyph on the HUD');
    });

    group('STEP 5: DNA COSTS, UPGRADES (data), DEATH LOSES THEM, PART OF THE DNA COMES BACK');
    run(`globalThis.__mut = (dna) => { __clear(); __class('mutator'); const c = __grow('ant_scout'); dnaApply(Object.assign({ beetle_scout: 0 }, dna || { beetle_scout: 40 })); return c; };`);
    check('the upgrades are a table (name, ranks, a cost per rank, what each rank does), and a new row works with no other code', () => {
        const r = J(`(function(){ const rows = CLONE_UPGRADE_ORDER.map(id => { const d = CLONE_UPGRADES[id]; return [id, !!d.name, d.max, Array.isArray(d.cost) && d.cost.length === d.max, Object.keys(d.stat).join()]; });
            CLONE_UPGRADES.test = { id: 'test', name: 'TEST GLAND', desc: 'a test', max: 1, cost: [2], stat: { health: { mul: 1 } } }; const c = __mut(); const h0 = c.maxHealth; const b = cloneUpgradeBuy('test'); const o = { rows, bought: b.ok, doubled: c.maxHealth === h0 * 2 }; delete CLONE_UPGRADES.test; return o; })()`);
        same(r.rows.map(x => x[0]).join(), 'armor,serrated,leap,reach', 'the four the brief names'); for (const x of r.rows) { same(x[1], true, x[0] + ' name'); same(x[3], true, x[0] + ' a cost per rank'); }
        same(r.rows.map(x => x[4]).join('|'), 'health|power|leap|reach', 'what each one changes'); same(r.bought, true, 'the new row could not be bought'); same(r.doubled, true, 'the new row did nothing');
    });
    check('BUY: the DNA is spent (any splices, the largest stocks first), the rank goes up, what the clone cost goes up; past the top it says so; without the DNA it says how much', () => {
        const r = J(`(function(){ const c = __mut({ beetle_scout: 9, spider_tank: 3 }); const inv0 = c.invested, h0 = c.maxHealth, t0 = dnaTotal(); const b1 = cloneUpgradeBuy('armor');
            const o = { b1: b1.ok, rank: cloneUpRank(c, 'armor'), spent: t0 - dnaTotal(), cost: CLONE_UPGRADES.armor.cost[0], fromLargest: getDNA().beetle_scout, invested: c.invested - inv0, health: c.maxHealth / h0 };
            dnaApply({ beetle_scout: 99 }); cloneUpgradeBuy('armor'); cloneUpgradeBuy('armor'); o.top = cloneUpgradeBuy('armor').why; dnaApply({}); o.poor = cloneUpgradeBuy('serrated').why; o.poorRank = cloneUpRank(c, 'serrated'); return o; })()`);
        same(r.b1, true, 'the first rank'); same(r.rank, 1, 'rank'); same(r.spent, r.cost, 'DNA spent'); same(r.fromLargest, 9 - r.cost, 'spent from the largest stock (beetle 9, before the spider\'s 3)');
        same(r.invested, r.cost, 'what it cost'); ok(Math.abs(r.health - 1.25) < 0.02, 'ARMOR PLATING: health x' + r.health.toFixed(3)); ok(/TOP RANK/.test(r.top), 'past the top: ' + r.top); ok(/NEEDS \d+ DNA/.test(r.poor), 'without the DNA: ' + r.poor); same(r.poorRank, 0, 'it was bought anyway');
    });
    check('SERRATED ARMS: its bite hits a quarter harder a rank (and its level-ups keep it); LONG REACH: it bites what it could not reach before', () => {
        const r = J(`(function(){ const c = __mut(); const p0 = c.power; cloneUpgradeBuy('serrated'); const o = { power: c.power / p0 }; gainXp(c, xpForLevel(c.level + 2) - c.xp + 1); o.afterLevel = c.power / Math.round(c.base.attack * levelFactor(c.level));
            const e = __creature('ant', 'tank', 4, 0, 0, true); e.health = e.maxHealth = 1e6; const reach = cloneReach(c); c.x = e.x - (reach + 0.25); c.y = e.y; c.attackCooldown = 0; c._biteTick(e); for (let i = 0; i < COMBAT.bite.windup + 1; i++) c._biteTick(e); o.before = 1e6 - e.health;
            cloneUpgradeBuy('reach'); o.reach = cloneReach(c) - reach; e.health = 1e6; c.attackCooldown = 0; c.attackWindup = 0; for (let i = 0; i < COMBAT.bite.windup + 2; i++) c._biteTick(e); o.after = 1e6 - e.health; return o; })()`);
        ok(Math.abs(r.power - 1.25) < 0.03, 'SERRATED ARMS: power x' + r.power.toFixed(3)); ok(Math.abs(r.afterLevel - 1.25) < 0.03, 'a level-up lost it: x' + r.afterLevel.toFixed(3));
        same(r.before, 0, 'it bit out of its reach'); ok(Math.abs(r.reach - 0.35) < 0.01, 'LONG REACH added ' + r.reach); ok(r.after > 0, 'with LONG REACH it still could not bite it');
    });
    check('POUNCE: with the upgrade it crouches (POUNCE!), leaps in an arc onto a creature beyond its reach and bites as it lands, then rests; without it, it walks', () => {
        const r = J(`(function(){ const c = __mut(); const e = __creature('ant', 'tank', 4, 3.6, 0.3, true); e.health = e.maxHealth = 1e6; c.x = player.x + 0.2; c.y = player.y + 0.3; c._nearestEnemy = e;
            const none = clonePounceTick(c); cloneUpgradeBuy('leap'); c._nearestEnemy = e; floatingTexts.length = 0; const go = clonePounceTick(c); const said = floatingTexts.map(t => t.text).join('|'); let lift = 0, n = 0, h0 = e.health;
            while (c.pounce && n < 80) { clonePounceTick(c); lift = Math.max(lift, c.leapLift || 0); n++; } return { none, go, said, lift, frames: n, landed: Math.hypot(e.x - c.x, e.y - c.y), reach: cloneReach(c), dealt: h0 - e.health, rest: c.pounceReady > frame, range: c.pounceRange }; })()`);
        same(r.none, false, 'it pounced without the upgrade'); same(r.go, true, 'it did not pounce'); ok(/POUNCE!/.test(r.said), 'no POUNCE! over it'); ok(r.lift > 10, 'no arc: ' + r.lift);
        ok(r.landed <= r.reach + 0.05, 'it landed ' + r.landed.toFixed(2) + ' tiles off (reach ' + r.reach + ')'); ok(r.dealt > 0, 'no bite on landing'); same(r.rest, true, 'no rest after it'); ok(r.range > 3.6, 'its range ' + r.range);
    });
    check('a scout clone\'s escape LEAP goes further with POUNCE ("a longer leap")', () => {
        const r = J(`(function(){ const c = __mut(); const d0 = c.leapDistance || ABILITY_DEFS.LEAP.distance; cloneUpgradeBuy('leap'); return { key: c.abilityKey, d0, d1: c.leapDistance }; })()`);
        same(r.key, 'LEAP', 'an ant scout clone\'s special'); ok(r.d1 > r.d0, 'the leap ' + r.d0 + ' -> ' + r.d1);
    });
    check('DEATH LOSES THE UPGRADES: its body keeps what it had and what it cost; the next clone starts with none', () => {
        const r = J(`(function(){ const c = __mut(); cloneUpgradeBuy('armor'); cloneUpgradeBuy('serrated'); const inv = c.invested; const foe = { x: c.x + 1, y: c.y, team: 'red' }; for (let i = 0; i < 10 && !c.dead; i++) applyDamage(c, c.maxHealth, foe); __frames(2);
            const b = cloneBodies[0]; dnaApply({ ant_scout: 99 }); shardCount = 999; executeClone(getCloneOptions().find(o => o.key === 'ant_scout')); const n = mutatorClone();
            return { up: b && b.upgrades, inv: b && b.invested, was: inv, said: floatingTexts.map(t => t.text).join('|'), fresh: n ? Object.keys(n.upgrades || {}).length : -1, freshInv: n ? n.invested : -1, needed: CLONE_COSTS.ant.splicesNeeded }; })()`);
        same(JSON.stringify(r.up), '{"armor":1,"serrated":1}', 'the body\'s upgrades'); same(r.inv, r.was, 'the body\'s cost'); ok(/UPGRADES ARE LOST/.test(r.said), 'nobody said the upgrades were lost: ' + r.said);
        same(r.fresh, 0, 'the new clone has upgrades'); same(r.freshInv, r.needed, 'a new clone is worth the splices it was grown from');
    });
    check('SALVAGE DNA (the body\'s ring): near it, a share of what it cost comes back as its species\' DNA and the body is gone; from further off the player walks to it first; it is less than it cost', () => {
        const r = J(`(function(){ const c = __mut(); cloneUpgradeBuy('armor'); cloneUpgradeBuy('reach'); const inv = c.invested; c.x = player.x + 1; c.y = player.y; const foe = { x: c.x + 1, y: c.y, team: 'red' }; for (let i = 0; i < 10 && !c.dead; i++) applyDamage(c, c.maxHealth, foe); __frames(2);
            const b = cloneBodies[0], ring = mutatorBodyRing(b), dna0 = getDNA().ant_scout || 0; commandBodyTarget = b; selectedRadialAction = 'salvage_body'; commandTarget = null; executeCommand();
            const o = { label: ring.up.label, inv, back: (getDNA().ant_scout || 0) - dna0, want: Math.floor(inv * MUTATOR.dna.recover), gone: cloneBodies.length === 0 };
            const c2 = __mut(); c2.x = player.x + 6; c2.y = player.y; for (let i = 0; i < 10 && !c2.dead; i++) applyDamage(c2, c2.maxHealth, { x: c2.x + 1, y: c2.y, team: 'red' }); __frames(2); const b2 = cloneBodies[0]; player.x = player.visualX = b2.x - 6; player.fpPath = null;
            const far = cloneSalvage(b2); o.far = far; o.walking = !!(player.fpPath && player.fpPath.length); __frames(200); o.arrived = cloneBodies.length === 0; return o; })()`);
        ok(/SALVAGE DNA \+\d+/.test(r.label), 'the ring: ' + r.label); same(r.back, r.want, 'DNA back'); same(r.gone, true, 'the body is still there'); ok(r.back < r.inv, 'it gave back ' + r.back + ' of ' + r.inv + ': rebuilding must cost more than keeping it');
        same(r.far, null, 'it was salvaged from afar'); same(r.walking, true, 'the player did not walk to it'); same(r.arrived, true, 'it was not salvaged on arrival');
    });
    check('RELEASE at the Clone Bay: two taps (the first asks), its upgrades go, a share of what it cost comes back, and it leaves no body', () => {
        const r = J(`(function(){ const c = __mut(); cloneUpgradeBuy('armor'); const inv = c.invested, d0 = getDNA().ant_scout || 0; cloneMenuOpen = true; drawCloneMenu(); const rel = _mxUpBtns.find(b => b.act === 'release');
            const tap = () => { handleCloneMenuTap(rel.r.x + rel.r.w / 2, rel.r.y + rel.r.h / 2); __frames(1); }; tap(); const o = { afterOne: !!mutatorClone() }; drawCloneMenu(); tap(); __frames(2);
            o.gone = !mutatorClone(); o.back = (getDNA().ant_scout || 0) - d0; o.want = Math.floor(inv * MUTATOR.dna.recover); o.bodies = cloneBodies.length; cloneMenuOpen = false; return o; })()`);
        same(r.afterOne, true, 'one tap released it'); same(r.gone, true, 'two taps did not'); same(r.back, r.want, 'DNA back'); same(r.bodies, 0, 'a released clone left a body');
    });
    check('the bay, with your clone out, is its upgrades: a row for each with its ranks and BUY, the DNA you have, and what a fall would cost; BUY there buys', () => {
        const r = J(`(function(){ const c = __mut(); cloneMenuOpen = true; const said = []; const keep = uiTextFit, keepC = uiCaptionFit; uiTextFit = function (t) { said.push(String(t)); return keep.apply(this, arguments); }; uiCaptionFit = function (t) { said.push(String(t)); return keepC.apply(this, arguments); };
            try { drawCloneMenu(); } finally { uiTextFit = keep; uiCaptionFit = keepC; } const buys = _mxUpBtns.filter(b => b.act === 'buy'); const b = buys.find(x => x.id === 'serrated'); handleCloneMenuTap(b.r.x + 5, b.r.y + 5);
            const o = { names: CLONE_UPGRADE_ORDER.every(id => said.includes(CLONE_UPGRADES[id].name)), buys: buys.length, dna: said.some(t => /^DNA \\d+/.test(t)), stake: said.some(t => /UPGRADES ARE LOST/.test(t)), bought: cloneUpRank(c, 'serrated') }; cloneMenuOpen = false; return o; })()`);
        same(r.names, true, 'not every upgrade is listed'); same(r.buys, 4, 'BUY buttons'); same(r.dna, true, 'the DNA you have'); same(r.stake, true, 'what a fall costs'); same(r.bought, 1, 'BUY did not buy');
    });
    check('ONE PREDATOR AGAINST ONE UPGRADED CLONE (the brief\'s test): in the arena, face to face, a mantis tank kills a fresh ant striker clone (or leaves it near dead); the same clone with three ranks of ARMOR PLATING and SERRATED ARMS kills it with plenty to spare', () => {
        const r = J(`(function(){ const AC = _fsArenaCells(); let best = AC[0], bd = -1; for (const q of AC) { let free = 0; for (const s of AC) if (Math.abs(s[0] - q[0]) <= 4 && Math.abs(s[1] - q[1]) <= 2) free++; if (free > bd) { bd = free; best = q; } }   // (the arena's most open floor, far from the Crystal: a creature beside the Crystal goes for it instead)
            const fight = (ups) => { __clear(); __class('mutator'); player.x = player.targetX = player.visualX = best[0] - 1.5; player.y = player.targetY = player.visualY = best[1]; player.fpPath = null;
                const c = makeClone('ant', 'striker', player.x + 1, player.y + 0.5, 'hunt', { level: 5 }); c.primary = true; c.upgrades = ups; cloneApplyUpgrades(c); c.health = c.maxHealth;   // (level 5 both times: the arena's level, which a new clone takes, rises in a long game)
                const e = spawnCreature({ species: 'mantis', className: 'tank', level: 4, x: player.x + 2.1, y: player.y + 0.5, state: 'hunt' }); e.provoked = true;   // (face to face: a creature walking to the Crystal turns only on what bites it; a spider would web the clone and walk on)
                let n = 0; for (; n < 2400 && !c.dead && !e.dead; n++) render(); const o = { won: !!e.dead, lost: !!c.dead, left: c.health / c.maxHealth, n, lv: [c.level, e.level], hp: [Math.round(c.health), Math.round(e.health)], others: actors.filter(a => a instanceof Predator && !a.isClone && a !== e && !a.dead).length, alert: alertActive }; c.dead = true; c.dismissed = true; e.dead = true; __frames(1); return o; };
            return { fresh: fight({}), upgraded: fight({ armor: 3, serrated: 3 }) }; })()`);
        same(r.upgraded.won, true, 'the upgraded clone did not win: ' + JSON.stringify(r)); ok(r.upgraded.left > 0.35, 'it won with ' + Math.round(r.upgraded.left * 100) + '% left');
        ok(r.fresh.lost || r.upgraded.left > r.fresh.left + 0.25, 'the upgrades made no real difference: fresh ' + JSON.stringify(r.fresh) + ', upgraded ' + Math.round(r.upgraded.left * 100) + '% left');
    });
    check('the save keeps the clone\'s upgrades and what it cost, and a body\'s; a reload brings them back as they were', () => {
        const r = J(`(function(){ const c = __mut(); cloneUpgradeBuy('armor'); cloneUpgradeBuy('leap'); const want = [c.maxHealth, c.pounceRange, c.invested]; const d = JSON.parse(JSON.stringify(facilitySaveCollect()));
            actors = actors.filter(a => !a.isClone); mutatorReset(); cloneRosterApply(d.clones); const n = mutatorClone(); const got = n ? [n.maxHealth, n.pounceRange, n.invested] : null;
            for (let i = 0; i < 10 && n && !n.dead; i++) applyDamage(n, n.maxHealth, { x: n.x + 1, y: n.y, team: 'red' }); __frames(2); const d2 = JSON.parse(JSON.stringify(facilitySaveCollect())); mutatorReset(); cloneBodiesApply(d2.bodies);
            return { want, got, body: cloneBodies[0] ? [JSON.stringify(cloneBodies[0].upgrades), cloneBodies[0].invested] : null }; })()`);
        same(JSON.stringify(r.got), JSON.stringify(r.want), 'the clone came back otherwise'); same(r.body && r.body[0], '{"armor":1,"leap":1}', 'the body\'s upgrades'); same(r.body && r.body[1], r.want[2], 'the body\'s cost');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
