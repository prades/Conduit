// THE WILD ANTS' OWN SPECIALS (js/abilities.js; docs/COMBAT.md §9; the owner, 2026-11-17: "the different species of ants have different abilities"), in the real game's logic (the
// sandbox with every script, as tests/cardbattle.js): a scout CALLS FOR BACKUP once when hurt, and the two that come up in its room pay nothing when killed; a striker LEAPS at a Mage
// from range in the game's own step and bites it; a tank SLAMS round itself. tests/abtest.js checks the machine itself against stubs.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
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
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860;');
    run(`globalThis.__cell = (room, k) => { const cs = partyRoomCells(room); return cs[Math.floor(cs.length * (k === undefined ? 0.5 : k))]; };
        globalThis.__fresh = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); frame = 1000;
            const c = __cell('arena', 0.3); player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1]; player.fpPath = null; };
        globalThis.__ant = (cls, x, y, lv) => { const e = spawnCreature({ species: 'ant', className: cls, level: lv || 4 }); const c = _fpNearestCellOpen(x, y); e.x = c[0]; e.y = c[1]; e.spawnProtection = 0; e.provoked = true; e.state = 'hunt'; e.fpCreature = true; e.homeRoom = 'arena'; return e; };
        globalThis.__fol = (el, x, y, role) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; const c = _fpNearestCellOpen(x, y); f.x = f.targetX = c[0]; f.y = f.targetY = c[1]; f.role = role || f.role; f.health = f.maxHealth = 1e6; return f; };`);

    group('CALL FOR BACKUP (the owner: "Once, when hurt"; its backup pays "Nothing")');
    check('hurt below half, an arena scout calls once: two scouts a level under it come up in its room, in its sight, on its target; killed, they pay no crystals, no DNA and no XP', () => {
        const r = J(`(function(){ __fresh(); const f = __fol('fire', player.x + 4, player.y); render();   // (a follower's XP settles on its first frame)
            const s = __ant('scout', player.x + 3, player.y, 5); s.currentTarget = f; s.health = s.maxHealth * 0.4;
            const before = actors.filter(a => a instanceof Predator && !a.dead).length; for (let i = 0; i < 60; i++) { frame++; abilityTick(s); }
            const made = actors.filter(a => a instanceof Predator && a.backup && !a.dead);
            const o = { n: made.length, added: actors.filter(a => a instanceof Predator && !a.dead).length - before, kinds: made.map(p => p.speciesName + ':' + p.className + ':' + p.level), room: made.every(p => partyRoomAt(p.x, p.y) === partyRoomAt(s.x, s.y)), sight: made.every(p => facilitySeesFrom(s.x, s.y, p.x, p.y)), target: made.every(p => p.currentTarget === f), pay: made.every(p => p.noReward) };
            for (let i = 0; i < 300; i++) { frame++; abilityTick(s); } o.again = actors.filter(a => a instanceof Predator && a.backup && !a.dead).length;
            const sh = shardCount, dna = JSON.stringify(dnaInventory), xp = f.xp || 0; for (const p of made) { p.lastAttacker = f; p.health = 0; p.dead = true; } render();
            o.paid = [shardCount - sh, JSON.stringify(dnaInventory) === dna, (f.xp || 0) - xp]; return o; })()`);
        same(r.n, 2, 'two answered'); same(r.added, 2, 'two more creatures'); same(r.kinds.join(), 'ant:scout:4,ant:scout:4', 'its kind, a level under it');
        same(JSON.stringify([r.room, r.sight, r.target, r.pay]), '[true,true,true,true]', 'in its room, in its sight, on its target, paying nothing');
        same(r.again, 2, 'it called again'); same(JSON.stringify(r.paid), JSON.stringify([0, true, 0]), 'crystals, DNA unchanged, XP when killed');
    });
    check('a toxic scout of the Sewers\' brood calls toxic backup', () => {
        const r = J(`(function(){ __fresh(); const s = __ant('scout', player.x + 3, player.y, 4); s.element = 'toxic'; s.sewerBrood = true; s.health = s.maxHealth * 0.3; for (let i = 0; i < 60; i++) { frame++; abilityTick(s); }
            return actors.filter(a => a instanceof Predator && a.backup && !a.dead).map(p => [p.element, !!p.sewerBrood]); })()`);
        same(JSON.stringify(r), JSON.stringify([['toxic', true], ['toxic', true]]), 'its backup');
    });

    group('LEAP STRIKE (the owner: "Engineered to take out high impact mages"), in the game\'s own step');
    check('a striker with a Mage 3 tiles off and a brawler beside it leaps at the Mage and bites it, in the game\'s own frames', () => {
        const r = J(`(function(){ __fresh(); const st = __ant('striker', player.x + 2, player.y + 1, 5), mage = __fol('electric', st.x + 3, st.y, 'sniper'), br = __fol('core', st.x - 1.5, st.y + 0.5, 'brawler');
            for (const u of [st, mage, br]) u.moveSpeed = u.baseMoveSpeed = 1e-9;   // (all held where they stand: the Mage stays 3 tiles off; 0 would read as a follower's default pace, js/npc.js)
            const h0 = mage.health; let flew = false, picked = null;
            for (let i = 0; i < 900; i++) { _simStep(false); if (st.abilityPhase === 'winding' && !picked) picked = st.strikeTarget === mage ? 'mage' : st.strikeTarget === br ? 'brawler' : 'other'; if ((st.leapLift || 0) > 5) flew = true; if (flew && st.abilityPhase === 'charging') break; }
            return { key: st.abilityKey, picked, flew, near: +Math.hypot(st.x - mage.x, st.y - mage.y).toFixed(2), hurt: h0 - mage.health > 0 }; })()`);
        same(r.key, 'LEAP_STRIKE', 'its special'); same(r.picked, 'mage', 'whom it picked'); same(r.flew, true, 'it leapt'); ok(r.near < 1.6, 'it landed by the Mage: ' + r.near); same(r.hurt, true, 'the Mage bitten');
    });

    group('GROUND SLAM (the owner: "Slam around itself")');
    check('a tank with two of yours beside it slams them both, and not one farther off', () => {
        const r = J(`(function(){ __fresh(); const t = __ant('tank', player.x + 2, player.y + 1, 5); t.moveSpeed = t.baseMoveSpeed = 0; const a = __fol('fire', t.x + 1, t.y), b = __fol('ice', t.x, t.y + 1.2), far = __fol('core', t.x + 4, t.y);
            const h = [a.health, b.health, far.health]; let slammed = false;
            for (let i = 0; i < 1200 && !slammed; i++) { frame++; abilityTick(t); if (t.abilityPhase === 'active' || (h[0] - a.health > 0 && h[1] - b.health > 0)) slammed = true; }
            return { key: t.abilityKey, a: h[0] - a.health > 0, b: h[1] - b.health > 0, far: h[2] - far.health > 0 }; })()`);
        same(r.key, 'GROUND_SLAM', 'its special'); same(JSON.stringify([r.a, r.b, r.far]), '[true,true,false]', 'the two beside it hurt, the far one not');
    });

    group('THE PIECES');
    check('a wild ant\'s special is its class\'s; a worker has none; the boss keeps MANDIBLE FRENZY', () => {
        const r = J(`(function(){ __fresh(); return ['scout', 'striker', 'tank', 'worker', 'boss'].map(c => { const e = __ant(c, player.x + 3, player.y); initAbility(e); return e.abilityKey; }); })()`);
        same(r.join(), 'BACKUP_CALL,LEAP_STRIKE,GROUND_SLAM,,MANDIBLE_FRENZY', 'scout, striker, tank, worker, boss');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
