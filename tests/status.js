// WHAT A UNIT IS DOING (js/status.js), over its head (js/levels.js drawUnitTag, js/draw.js drawPlate) and in the roster; and the HOLD that used to hang.
//
// REPORTED: "Make sure it actually works, it looks like it's being hung up on something. Make it say what the followers are doing, above their head and in the
// roster, and make the status bar and text above their head match the style of the game's new layout."
// The hang: a HOLD is stance "hold" + a standing move job. A job dropped by anything (hurt below half and sent to heal, a vanished target, a replacing order) left the stance on "hold"
// with nothing to hold: the unit stood for good, ignoring COME and the player.
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
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    run(`gameState.running = true; tutorialMode = false; zoneGenerated = () => true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); for (let z = 0; z <= 2; z++) ensureWorldTo((z + 1) * ZONE_LENGTH);
        globalThis.__fresh = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone); followers.length = 0; squadMode = 'all'; player.x = player.targetX = player.visualX = 8; player.y = player.targetY = player.visualY = 1.5;
            ['fire', 'ice', 'electric'].forEach((el, i) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = 'brawler'; f.x = 7 + i * 0.6; f.y = 1.5; }); render(); };
        __fresh();`);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    const frames = n => { for (let i = 0; i < n; i++) run('render()'); };

    group('THE HANG');
    check('THE REPORTED CASE: a hold dropped for being hurt does not leave the unit stuck on "hold": it heals and follows again', () => {
        run('__fresh(); mixToolOrder("hold"); followers.forEach(f => f.health = f.maxHealth * 0.3);'); frames(40);
        const r = J('followers.map(f => [f.stance, !!f.job])'); for (const [st, job] of r) { same(st, 'follow', 'stance after the post was dropped'); same(job, false, 'job'); }
        run('followers.forEach(f => f.health = f.maxHealth); player.x = player.targetX = player.visualX = 16;'); frames(400);
        const d = J('followers.map(f => Math.round(Math.abs(f.x - player.x)))'); ok(d.every(x => x <= 5), 'they did not follow after healing: ' + d);
    });
    check('HOLD stands the squad where it is (even as the player walks away), and COME brings them back', () => {
        run('__fresh(); mixToolOrder("hold");'); frames(30); const x0 = J('followers.map(f => +f.x.toFixed(1))'); run('player.x = player.targetX = player.visualX = 16;'); frames(200);
        same(JSON.stringify(J('followers.map(f => +f.x.toFixed(1))')), JSON.stringify(x0), 'they moved while holding');
        same(J('followers.every(f => f.stance === "hold" && f.job && f.job.type === "move")'), true, 'hold state');
        run('mixToolOrder("follow");'); frames(1100); const d = J('followers.map(f => Math.round(Math.abs(f.x - 16)))'); ok(d.every(x => x <= 5), 'COME did not bring them: ' + d);
        same(J('followers.every(f => f.stance === "follow" && !f.job)'), true, 'follow state');
    });
    check('a hold with nothing to hold is dropped by the AI itself (any path that clears the job)', () => { run('__fresh(); followers[0].stance = "hold"; followers[0].job = null;'); frames(3); same(run('followers[0].stance'), 'follow', 'stance'); ok(/stance==="hold" && !actor\.job/.test(rd('js/npc.js')), 'the guard is gone'); });

    group('WHAT THEY ARE DOING (unitStatus)');
    const st = setup => { run('__fresh();' + setup); return J('followers.map(f => unitStatus(f) && unitStatus(f).text)'); };
    check('following is the default', () => same(st('')[0], 'FOLLOWING', 'default'));
    check('hold, attack, build, reclaim, capture, upgrade, heal, return, hack, siphon, each in its own words', () => {
        const one = (setup) => { run('__fresh();' + setup); return run('unitStatus(followers[0]).text'); };
        same(one('followers[0].stance="hold"; followers[0].job={type:"move",target:{x:7,y:1}};'), 'HOLDING', 'hold');
        same(one('followers[0].job={type:"attack",target:{dead:false}};'), 'ATTACKING', 'attack');
        same(one('followers[0].job={type:"build_pylon",target:{}};'), 'BUILDING', 'build');
        same(one('followers[0].job={type:"reconstruct",target:{}};'), 'RECLAIMING', 'reclaim');
        same(one('followers[0].job={type:"capture_node",target:{}};'), 'CAPTURING', 'capture');
        same(one('followers[0].job={type:"merge_pylon",target:{}};'), 'UPGRADING', 'upgrade');
        same(one('followers[0].isHealing=true;'), 'HEALING', 'heal');
        same(one('followers[0].returningToCrystal=true;'), 'RETURNING', 'return');
        same(one('followers[0].hackOrder={};'), 'HACKING', 'hack');
        same(one('followers[0].siphonOrder={};'), 'SIPHONING', 'siphon');
    });
    check('a worker says its job by element (flux hauls, core re-arms, electric neutralises); a crew member says its zone; a technician is on post', () => {
        const one = (setup) => { run('__fresh();' + setup); return run('unitStatus(followers[0]).text'); };
        same(one('followers[0].element="flux"; followers[0].duty="worker";'), 'HAULING', 'flux'); same(one('followers[0].element="core"; followers[0].duty="worker";'), 'RE-ARMING', 'core'); same(one('followers[0].element="electric"; followers[0].duty="worker";'), 'NEUTRALISING', 'electric');
        same(one('followers[0].duty="worker"; followers[0].crewZone=2;'), 'CREW · ZONE 2', 'crew'); same(one('followers[0].role="camper";'), 'ON POST', 'technician');
    });
    check('a unit with an enemy close says FIGHTING; a clone says its species job when working', () => {
        same(one0('followers[0]._nearestEnemy = { x: followers[0].x + 2, y: followers[0].y, dead: false };'), 'FIGHTING', 'fighting');
        same(J('(function(){ const c = makeClone("ant", "scout", 6, 2); c.duty = "worker"; return unitStatus(c).text; })()'), 'BUILD', 'ant clone job');
        function one0(setup) { run('__fresh();' + setup); return run('unitStatus(followers[0]).text'); }
    });
    check('an enemy, the dead and the neutral have no status (only your own units)', () => { run('__fresh();'); same(run('unitStatus({ team: "red", isFollower: false })'), null, 'enemy'); run('followers[0].dead = true;'); same(run('unitStatus(followers[0])'), null, 'dead'); });
    check('the status colours are the game\'s palette (teal following, ice holding, red fighting, gold working)', () => { for (const [k, v] of Object.entries({ follow: '#19e6c1', hold: '#8fe3ff', fight: '#ff4a1c', work: '#ffe733' })) same(run(`STATUS_COL.${k}`), v, k); });

    group('ABOVE THEIR HEADS, IN THE GAME\'S STYLE');
    check('THE ASK: a unit\'s plate has the level, the name AND a status chip over it (drawPlate called twice for your own units, once for an enemy)', () => {
        const r = J(`(function(){ __fresh(); const calls = []; const keep = drawPlate; drawPlate = (t, col, x, y, chip) => { calls.push([t, !!chip, y]); return true; };
            const f = followers[0]; f.level = 6; drawUnitTag(f, 0, 100, ctx);
            const e = spawnPredatorForZone(1, { species: 'ant', className: 'scout' }); const n0 = calls.length; drawUnitTag(e, 0, 100, ctx); drawPlate = keep; return { calls, n0, nEnemy: calls.length - n0 }; })()`);
        same(r.calls[0][1], false, 'the name plate first'); ok(/^Lv 6 /.test(r.calls[0][0]), r.calls[0][0]); same(r.calls[1][1], true, 'a status chip'); ok(r.calls[1][2] < r.calls[0][2], 'the chip is above the plate'); same(r.nEnemy, 1, 'an enemy gets no status chip');
    });
    check('the status bar is a slanted slab in the new style (a polygon with a hi-vis outline, not a flat rect), teal for yours, red-edged for an enemy', () => {
        const r = J(`(function(){ const ops = []; const rec = new Proxy({}, { get(t, k) { return (...a) => { ops.push([k, a]); }; }, set(t, k, v) { ops.push(['set:' + k, v]); return true; } });
            drawHealthBar(0, 0, 36, 6, 50, 100, rec, true); const mine = ops.splice(0); drawHealthBar(0, 0, 36, 6, 50, 100, rec, false); const foe = ops.splice(0); drawHealthBar(0, 0, 36, 6, 50, 100, rec); const plain = ops.splice(0);
            return { mineEdge: mine.filter(o => o[0] === 'set:strokeStyle').map(o => o[1]), foeEdge: foe.filter(o => o[0] === 'set:strokeStyle').map(o => o[1]), plainEdge: plain.filter(o => o[0] === 'set:strokeStyle').map(o => o[1]), polys: mine.filter(o => o[0] === 'lineTo').length, rects: mine.filter(o => o[0] === 'fillRect').length }; })()`);
        ok(r.polys >= 6 && r.rects === 0, 'not a slanted polygon: ' + JSON.stringify(r)); same(r.mineEdge[0], '#19e6c1', 'ally edge'); same(r.foeEdge[0], '#ff4a1c', 'enemy edge'); same(r.plainEdge[0], '#8aa0c8', 'structure edge');
    });
    check('the old flat bracket and diamond over an ally predator are gone (the outline says whose it is)', () => { const d = rd('js/draw.js'); ok(!/Clone\/ally: green bracket frame/.test(d) && !/fillText\("◆", px, py - 88\)/.test(d), 'the bracket is still drawn'); });
    check('the plate and chip are cached stamps drawn with the game\'s italic display font (no per-frame text layout)', () => { const d = rd('js/draw.js'); ok(/function cachedPlate/.test(d) && /italic 900 9px "DejaVu Sans"/.test(d) && /_plateCache/.test(d), 'no cached plates'); });

    group('IN THE ROSTER');
    check('every roster row carries its status, and the Command Center card and the phone roster show it', () => {
        run('__fresh(); followers[1].stance = "hold"; followers[1].job = { type: "move", target: { x: 7, y: 1 } };');
        same(J('ccRow(followers[1]).status.text'), 'HOLDING', 'row'); same(J('ccRow(followers[0]).status.text'), 'FOLLOWING', 'row');
        ok(/cc-status/.test(rd('js/commandcenter.js')) && /r\.status\.text/.test(rd('js/commandcenter.js')), 'the card does not show it'); ok(/rp-cstat/.test(rd('js/radialmenu.js')) && /unitStatus\(r\.f\)/.test(rd('js/radialmenu.js')), 'the phone roster does not show it');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
