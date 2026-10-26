// FOLLOWER TYPES: a follower has its type (brawler, mage, technician) and its element when it is found or recruited, and keeps them; the player does not choose or change either, and makes a follower better by
// evolving it. The Crystal's element mix (which elements new followers may be made of, set by the player) is gone: every element brought online makes followers, an even draw.
// (It replaces the old modulation suite: the mix, its toggles, the re-modulate prompt and the recruit crystal's element chooser no longer exist.)
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(c, m) { if (!c) throw new Error(m); }

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true;');

    group('THE TYPES: brawler, mage, technician');
    check('three types, in the ids the saves and tests know the roles by; every personality of a type gives exactly that role, and the labels are the player\'s words', () => {
        const r = J(`(function(){ const o = { ids: FOLLOWER_TYPE_ORDER.slice(), roles: {}, labels: FOLLOWER_TYPE_ORDER.map(roleLabel) }; for (const t of FOLLOWER_TYPE_ORDER) o.roles[t] = FOLLOWER_TYPES[t].personalities.map(p => assignRole(applyPersonality(p)));
            const seen = {}; for (let i = 0; i < 400; i++) { const t = FOLLOWER_TYPE_ORDER[i % 3], p = personalityForType(t); seen[t + ':' + assignRole(applyPersonality(p))] = 1; } o.seen = Object.keys(seen).sort(); o.any = []; for (let i = 0; i < 300; i++) o.any.push(personalityForType('hybrid')); o.anyKinds = Array.from(new Set(o.any)).length; return o; })()`);
        same(r.ids.join(), 'brawler,sniper,camper', 'the types'); same(r.labels.join(), 'BRAWLER,MAGE,TECHNICIAN', 'the labels');
        for (const t of r.ids) for (const x of r.roles[t]) same(x, t, 'a ' + t + ' personality gives the role ' + x);
        same(r.seen.join(), 'brawler:brawler,camper:camper,sniper:sniper', 'a draw of a type gives another role'); ok(r.anyKinds >= 4, 'a draw of no type is not a draw of every personality: ' + r.anyKinds);
        const pers = J('Object.keys(PERSONALITIES)'); for (const p of pers) ok(J('FOLLOWER_TYPE_ORDER').some(t => J(`FOLLOWER_TYPES.${t}.personalities`).indexOf(p) >= 0), 'the personality ' + p + ' is in no type');
    });
    check('a follower made at the Crystal is the type it was asked for, with the element it was asked for, and its stats and perk follow from its personality', () => {
        const r = J(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower); const out = []; for (const t of FOLLOWER_TYPE_ORDER) { spawnFollowerAtCrystal('ice', t); const f = followers[followers.length - 1]; out.push([t, f.role, f.element, FOLLOWER_TYPES[t].personalities.indexOf(f.personality) >= 0, f.stats.attack, f.stats.specialAttack, f.stats.defense, followerByElement.ice.indexOf(f) >= 0]); }
            spawnFollowerAtCrystal('fire'); const g = followers[followers.length - 1]; out.push(['draw', g.role, g.element]); followers.length = 0; actors = actors.filter(a => !a.isFollower); return out; })()`);
        for (const x of r.slice(0, 3)) { same(x[1], x[0], 'the role'); same(x[2], 'ice', 'the element'); same(x[3], true, 'a personality of the type'); same(x[7], true, 'in the element list'); }
        ok(r[0][4] >= 14, 'a brawler\'s attack ' + r[0][4]); ok(r[2][6] >= 14, 'a technician\'s defence ' + r[2][6]); ok(['brawler', 'sniper', 'camper'].includes(r[3][1]), 'a draw');
    });

    group('THE ELEMENTS: every one online makes followers, evenly; there is nothing to narrow');
    check('the pool is what is online, in the elements\' order; a draw is even across it, and null when nothing is online', () => {
        const r = J(`(function(){ unlockedElements = new Set(['ice', 'fire', 'toxic']); const o = { pool: recruitElementPool(), d0: modulationPick(0), d5: modulationPick(0.5), d9: modulationPick(0.999), seen: {} }; for (let i = 0; i < 600; i++) { const e = modulationPick(); o.seen[e] = (o.seen[e] || 0) + 1; } unlockedElements = new Set(); o.none = modulationPick(); o.nonePool = recruitElementPool(); unlockedElements = new Set(ELEMENTS.map(e => e.id)); return o; })()`);
        const order = J('ELEMENTS.map(e => e.id)').filter(e => ['ice', 'fire', 'toxic'].includes(e)); same(r.pool.join(), order.join(), 'the pool'); same(r.d0, order[0], 'the first'); same(r.d9, order[2], 'the last'); same(r.d5, order[1], 'the middle');
        for (const e of order) ok(r.seen[e] > 140, e + ' came out ' + (r.seen[e] || 0) + ' times in 600'); same(Object.keys(r.seen).length, 3, 'an element that is not online'); same(r.none, null, 'a draw of nothing'); same(r.nonePool.length, 0, 'the pool of nothing');
    });
    check('there is no element mix left: no mask, no toggles, no re-modulate prompt, no recruit chooser, no ALL cell, and the battle tool has no ELEMENTS tab (every element is online from the start: nothing to bring online)', () => {
        const names = /modulationMask|modulationDirty|modulationToggle|modulationIncludes|modulationUntouched|_getModScheme|normaliseModulationMask|recruitChoice|recruitCrystal|recruitCycle|RE-MODULATE|ELEMENT MIX/;
        for (const f of fs.readdirSync(path.join(ROOT, 'js')).filter(f => f.endsWith('.js'))) { const src = rd('js/' + f); ok(!names.test(src.replace(/\/\/[^\n]*/g, '')), 'js/' + f + ' still has a piece of the mix: ' + (src.replace(/\/\/[^\n]*/g, '').match(names) || [])[0]); }
        ok(!/recruitcrystal|rcx/.test(rd('game.html')), 'game.html still has the recruit crystal'); ok(!fs.existsSync(path.join(ROOT, 'js/recruitcrystal.js')), 'the recruit crystal file is back');
        const mt = rd('js/mixtool.js'); ok(!/data-tab|mt-comb|mt-hex|UNLOCK|activatePendingElement|data-all/.test(mt), 'the tool has an ELEMENTS tab, a honeycomb or an unlock cell'); same(run('mixToolPodLabel()'), 'BATTLE', 'the pod is not BATTLE');
        same(run('typeof modulationMask'), 'undefined', 'the mask is still a global'); same(run('typeof recruitChoiceNow'), 'undefined', 'the recruit choice is still a global');
        same(run('typeof saveProgress') + run('typeof applyProgress'), 'undefinedundefined', 'the strip\'s progress save (which carried the mix) is back');
    });

    group('A RE-ROLL KEEPS WHAT A FOLLOWER IS');
    check('a re-rolled follower comes back the same type and the same element (the player cannot change a follower\'s class); its personality (within the type), stats and traits are made again; the identity fields it was asked to keep are cleared', () => {
        const r = J(`(function(){ followers.length = 0; actors = actors.filter(a => !a.isFollower); unlockedElements = new Set(ELEMENTS.map(e => e.id)); const out = [];
            for (const [t, e] of [['brawler', 'ice'], ['sniper', 'toxic'], ['camper', 'fire'], ['sniper', 'electric'], ['brawler', 'flux']]) { spawnFollowerAtCrystal(e, t); const f = followers[followers.length - 1]; const was = { role: f.role, el: f.element, pers: f.personality }; f.x = crystal.x + 0.3; f.y = crystal.y;
                const started = startFollowerReroll(f, true); const mid = { isF: f.isFollower, back: f.returningToCrystal, want: f.wantType, keep: f.keepElement, listed: followers.indexOf(f) >= 0 }; for (let i = 0; i < 5; i++) updateNPC(f);
                out.push({ was, mid, started, now: { role: f.role, el: f.element, isF: f.isFollower, back: f.returningToCrystal, want: f.wantType, keep: f.keepElement, pers: f.personality, inType: FOLLOWER_TYPES[t].personalities.indexOf(f.personality) >= 0, listed: followers.indexOf(f) >= 0, byEl: (followerByElement[e] || []).indexOf(f) >= 0, hp: f.maxHealth === f.stats.hp } }); }
            followers.length = 0; actors = actors.filter(a => !a.isFollower); return out; })()`);
        for (const x of r) { same(x.started, true, 'the re-roll did not start'); same(x.mid.isF, false, 'still a follower on the way'); same(x.mid.back, true, 'not walking home'); same(x.mid.keep, x.was.el, 'the element to keep'); same(x.mid.want, x.was.role, 'the type to keep');
            same(x.now.role, x.was.role, 'the type changed'); same(x.now.el, x.was.el, 'the element changed'); same(x.now.isF, true, 'not a follower again'); same(x.now.back, false, 'still walking'); same(x.now.want, null, 'the type request was not cleared'); same(x.now.keep, null, 'the element request was not cleared'); same(x.now.inType, true, 'a personality of another type'); same(x.now.listed, true, 'not in the list'); same(x.now.byEl, true, 'not in its element\'s list'); same(x.now.hp, true, 'its health is not its stats\''); }
    });
    check('a follower asked for with no type is a draw of every personality (js/species.js), and one that is made again at a death or put back from the save keeps its personality (so its type)', () => {
        ok(/PERSONALITY_KEYS\[Math\.floor\(Math\.random\(\) \* PERSONALITY_KEYS\.length\)\]/.test(rd('js/species.js').split('function personalityForType')[1] || ''), 'a follower of no type is not a draw');
        ok(/entry\.personality \|\| PERSONALITY_KEYS/.test(rd('js/game.js')) && /entry\.personality \|\| PERSONALITY_KEYS/.test(rd('js/facilitysave.js')), 'a respawn or a restore does not keep the personality');
        ok(/personalityForType\(actor\.wantType\)/.test(rd('js/npc.js')) && /personalityForType\(type\)/.test(rd('js/helpers.js')), 'the type is not what makes the personality');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
