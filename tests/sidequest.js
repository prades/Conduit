// SIDE QUEST (js/sidequest.js; docs/SEWER-QUEST.md, "Side Quest and the Sleeping Potion")
// ASKED (the archive, 2026-10-31): a small flying drone, an outlander, "an optional side-quest giver, merchant, technician, and source of hints"; "a safe side passage or maintenance platform roughly halfway along the route";
// he appears "only after the required samples have been collected and returned to the Experiment Lab", with "approximately 10 Toxic Ants" killed ("not location alone"); the suggested opening; the promise as a moral
// choice that invalidates nothing; the user: his post-encounter line is "…" whether the queen is spared or killed.
//   WHEN           not before the lab turn-in, not before ten brood kills, not on location; both: he appears, the gate of his maintenance platform off the north ledge opens (2026-11-01: he was in the south
//                  ledge's side passage, behind walls the camera hides), he hovers on the platform with his station, its back wall facing you; the brood keeps off him
//   THE COUNT      a brood ant's death counts; the queen's and an arena creature's do not
//   THE CALL       the first time you come near, once
//   THE TALK       four lines a press, the archive's opening first; the choice of two buttons; I PROMISE or NO PROMISES recorded; his answer, then the hint; the quest line untouched by any of it; the shop after
//   AFTER          the queen's fate decided (calm, or defeated): "…", and the shop
//   HIS LOOK       the void walker (the owner, 2026-11-02; build 2026-11-02f): the old flux worker's sheet, in the world turned toward you and in the dialogue box facing you
//   THE SAVE       he comes back where he was, the gate open, the talk and the promise kept; the plate's install hint names him once he is there
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
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; crystal.health = crystal.maxHealth = 1e7; canvas.width = 1280; canvas.height = 860; innerWidth = 1100; health = 1e6;
        _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; classPickerOpen = false; playerClassKey = 'gunslinger';
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__clearSquad = () => { actors = actors.filter(a => !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); };
        globalThis.__tick = (n) => { for (let i = 0; i < n; i++) { frame++; if (player.invuln > 0) player.invuln--; techAbilityTick(); facilityTutorialTick(); for (const a of actors.slice()) if (!a.dead) updateNPC(a); updateStatusEffects(); actors = actors.filter(a => !a.dead || a.isFollower); } };
        globalThis.__kill = (a) => { a.health = 0; a.dead = true; a.deathProcessed = true; onPredatorDeath(a); actors = actors.filter(q => q !== a); };
        globalThis.__st = (id) => _fp.stations.find(s => s.id === id);
        globalThis.__near = (s) => { const g = _stApproach(s) || [s.x, s.y + 1.5]; __put(g[0], g[1]); return stationDist(s) <= STATION_RANGE; };
        globalThis.__Q = () => questState('purify'); globalThis.__S = () => sqState();
        globalThis.__sewers = () => { const p = _fp.portals.find(q => q.room === 'sewers'); __put(p.ax, p.ay); };
        globalThis.__gone = () => { _fp.items = _fp.items.filter(i => !(i.fp === 'sidequest' || (i.fp === 'station' && i.id === 'st_sidequest'))); _fp.stations = _fp.stations.filter(s => s.id !== 'st_sidequest'); _fp.sidequest = null; _fp._sqSpot = null; _fp.quests = {}; _fp.potion = null; invReset(); playerClassKey = 'gunslinger'; floatingTexts.length = 0; };   // (a test's reset: the game never takes him away)
        globalThis.__gate = () => _fp.F.solids.find(q => q.id === 'sewer_gate_n2');
        globalThis.__reload = (sv) => { const F = _fp.F; actors = actors.filter(a => !(a instanceof Predator)); facilityTutorialStart(F); invReset(); facilitySaveApply(sv); _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; };
        globalThis.__dlg = () => { for (let i = 0; i < 600; i++) dialogueTick(); dialogueDraw(); };   // (his line in the dialogue box, typed to its end and drawn: its choice buttons stand, js/dialogue.js)`);

    group('WHEN HE APPEARS (sqUnlocked, sqPlace, js/quests.js questAntKilled)');
    check('before: nobody, the side gate shut; the lab turn-in alone does not bring him, nor ten kills alone, nor standing in the Sewers; both together do: the gate opens, he hovers on his platform (floor of the Sewers, NORTH of the gate\'s line: the back wall the camera sees behind him, now walkable from the ledge), with his station on him; the brood keeps off him', () => {
        const r = J(`(function(){ const o = {}; __gone(); __clearSquad(); __sewers(); __tick(2); const g = __gate(); o.before = [sqPresent(), !!__st('st_sidequest'), facilitySolidIsOpen('sewer_gate_n2'), sqSpot(), sqUnlocked()];
            const Q = __Q(); Q.turnedInAt = 1; sqTick(); o.turnInOnly = [sqUnlocked(), sqPresent()]; Q.turnedInAt = 0; Q.antKills = QUEST_PURIFY.antTarget; sqTick(); o.killsOnly = [sqUnlocked(), sqPresent()];
            Q.turnedInAt = 1; __tick(2); const sp = sqSpot(), st = __st('st_sidequest'), it = _fp.items.find(i => i.fp === 'sidequest'), cx = (g.bb[0] + g.bb[2]) / 2, cy = (g.bb[1] + g.bb[3]) / 2;
            o.appeared = [sqUnlocked(), sqPresent(), facilitySolidIsOpen('sewer_gate_n2'), !!st, st && st.kind, !!it, partyRoomAt(sp[0], sp[1]), facilityStandOk(sp[0], sp[1]), sp[1] < cy, Math.hypot(sp[0] - cx, sp[1] - cy) <= 3.2, !!facilityPath(player.x, player.y, sp[0], sp[1]), dialogueLines().some(l => /MAINTENANCE PLATFORM/.test(l.text) && l.who === 'player'), __S().appearedAt > 0];
            let near = 0; for (let i = 0; i < 150; i++) { const c = facilitySpawnSpot(FP_SPAWN_SEWERS); if (c && Math.hypot(c[0] - sp[0], c[1] - sp[1]) < 3) near++; } o.broodOff = near; return o; })()`);
        same(JSON.stringify(r.before), JSON.stringify([false, false, false, null, false]), 'before'); same(r.turnInOnly.join(), 'false,false', 'the turn-in alone'); same(r.killsOnly.join(), 'false,false', 'the kills alone');
        same(r.appeared.join('|'), 'true|true|true|true|sidequest|true|sewers|true|true|true|true|true|true', 'he did not appear as he should: ' + r.appeared.join('|')); same(r.broodOff, 0, 'the brood came up beside him');
    });
    check('the count: a brood ant\'s death counts toward him; the queen\'s does not, nor an arena creature\'s; the brood thinned quietly does not die (no count)', () => {
        const r = J(`(function(){ const o = {}; const Q = __Q(); Q.antKills = 0; __sewers(); const a = facilitySpawnCreature(null, null, FP_SPAWN_SEWERS); o.brood = !!a && a.sewerBrood; __kill(a); o.one = Q.antKills;
            const b = facilitySpawnCreature(null, null, FP_SPAWN_SEWERS); b.bossId = 'sewer_cistern'; __kill(b); o.queen = Q.antKills; const c = spawnCreature({ species: 'ant', className: 'scout', x: player.x + 2, y: player.y, level: 2, state: 'wander' }); c.fpCreature = true; c.homeRoom = 'arena'; __kill(c); o.arena = Q.antKills;
            for (let i = 0; i < 3; i++) facilitySpawnCreature(null, null, FP_SPAWN_SEWERS); Q.purifiedAt = 1; const gone = facilityBroodThin(); Q.purifiedAt = 0; o.thinned = [gone > 0, Q.antKills]; return o; })()`);
        same(r.brood, true, 'no brood ant'); same(r.one, 1, 'one kill'); same(r.queen, 1, 'the queen counted'); same(r.arena, 1, 'an arena creature counted'); same(r.thinned.join(), 'true,1', 'the thinning counted');
    });

    group('THE CALL, THE TALK, THE CHOICE, THE SHOP (sqTick, sqUse, sqChoose, js/stations.js STATION_KINDS.sidequest)');
    check('the first time you come within eight tiles he calls you over (once, in the dialogue box with his picture); at his station: TALK TO SIDE QUEST, the archive\'s opening word for word, NEXT, NEXT, then the ask and CHOOSE: the plate is dim and his two buttons stand in the dialogue box; NO PROMISES is recorded, he answers, and the plate sells the potion; nothing of the quest line changed', () => {
        const r = J(`(function(){ const o = {}; const sp = sqSpot(), st = __st('st_sidequest'), S = __S(), L = SIDEQUEST.lines; const far = _fpNearestCell(sp[0] + 9, sp[1] + 3), near = _fpNearestCell(sp[0], sp[1] + 3); __put(far[0], far[1]); o.farNoCall = [S.calledAt, sqSpeech()]; __put(near[0], near[1]); __tick(2);   /* (on the north ledge below his platform: nine tiles along it, then right below him) */ o.call = [S.calledAt > 0, dialogueLines().some(l => l.text.indexOf(L.call) >= 0 && l.who === 'sidequest'), sqSpeech() === L.call]; dialogueClear(); __tick(2); o.once = dialogueLines().some(l => l.text.indexOf(L.call) >= 0);
            const q0 = JSON.stringify(__Q()); o.near = __near(st); const V = () => STATION_KINDS.sidequest.verbFn(st), C = () => stationCan(st); o.v0 = [V(), C().ok];
            const steps = []; for (let i = 0; i < 4; i++) { const r = stationUse(st); steps.push([r.ok, !!r.quiet, S.talk, sqSpeech(), V()]); } o.steps = steps; o.choosing = [sqChoosing(), C().ok, C().why, stationUse(st).why];
            sqDrawOverlay(); __dlg(); const held = dialogueCurrent(); o.held = [held && held.who, held && held.hold, held && held.group, held && held.pages[0] === L.talk[3]]; o.buttons = _dlgBtns.map(b => [b.yes, b.w > 100, b.h]); const B = _dlgBtns[1]; o.tapMiss = sqTap(B.x - 300, B.y - 300); o.tap = sqTap(B.x + 5, B.y + 5); sqDrawOverlay(); __dlg(); o.declined = [S.promised, S.promisedAt > 0, sqSpeech() === L.declined, V(), sqChoosing(), _dlgBtns.length, dialogueCurrent() && dialogueCurrent().pages[0] === L.declined];
            __tick(SIDEQUEST.replyFrames + 2); o.hint = sqSpeech() === L.hint; o.quest = JSON.stringify(__Q()) === q0; shardCount = 1000; o.can = C().ok; const b1 = stationUse(st); o.shop = [b1.ok, invCount('sleeping_potion'), shardCount, potionEquipped(), V()]; o.again = stationUse(st).why; return o; })()`);
        same(r.farNoCall.join(), '0,', 'he called from far off'); same(r.call.join(), 'true,true,true', 'the call'); same(r.once, false, 'he called twice'); same(r.near, true, 'not at his station'); same(r.v0.join(), 'TALK TO SIDE QUEST,true', 'the first verb');
        const L = J('SIDEQUEST.lines'); same(JSON.stringify(r.steps), JSON.stringify([[true, true, 1, L.talk[0], 'NEXT'], [true, true, 2, L.talk[1], 'NEXT'], [true, true, 3, L.talk[2], 'NEXT'], [true, true, 4, L.talk[3], 'CHOOSE']]), 'the talk'); same(L.talk[0], "OH NO, IT'S CLOGGING EVERYTHING. LOOK, PLEASE, THERE HAS TO BE A WAY TO FIX THIS WITHOUT KILLING IT.", 'the archive\'s opening');
        same(r.choosing.join('|'), 'true|false|CHOOSE: I PROMISE, OR NO PROMISES|CHOOSE: I PROMISE, OR NO PROMISES', 'the choice'); same(r.held.join('|'), 'sidequest|true|sq|true', 'his ask is not the held line of the dialogue box'); same(JSON.stringify(r.buttons), JSON.stringify([[true, true, 40], [false, true, 40]]), 'the buttons'); same([r.tapMiss, r.tap].join(), 'false,true', 'the tap');
        same(r.declined.join('|'), '-1|true|true|BUY A SLEEPING POTION ◆100|false|0|true', 'NO PROMISES'); same(r.hint, true, 'the hint after his answer'); same(r.quest, true, 'the quest line changed'); same(r.can, true, 'the shop is shut'); same(r.shop.join('|'), 'true|1|900|sleeping_potion|BUY A SLEEPING POTION ◆100', 'the shop'); same(r.again, 'YOU HAVE ONE · THROW IT BEFORE YOU BUY ANOTHER', 'a second potion while holding one');
    });
    check('I PROMISE is the other answer (recorded 1, his thanks, then the hint); either way the shop; the promise changes nothing of the quest line and forbids nothing: killing the queen later is the quest line\'s business', () => {
        const r = J(`(function(){ const o = {}; const st = __st('st_sidequest'), S = __S(), L = SIDEQUEST.lines; S.talk = SIDEQUEST.lines.talk.length; S.promised = 0; S.replyUntil = 0; const q0 = JSON.stringify(__Q()); __near(st); sqDrawOverlay(); __dlg(); const A = _dlgBtns[0]; o.tap = sqTap(A.x + 5, A.y + 5); o.promised = [S.promised, sqSpeech() === L.promised, STATION_KINDS.sidequest.verbFn(st)]; __tick(SIDEQUEST.replyFrames + 2); o.hint = sqSpeech() === L.hint; o.quest = JSON.stringify(__Q()) === q0;
            const Q = __Q(); Q.bossResolvedAt = 1; Q.bossOutcome = 'defeated'; Q.bossDefeated = 1; o.killedLater = [sqSpeech(), S.promised, sqChoosing(), STATION_KINDS.sidequest.verbFn(st)]; Q.bossOutcome = 'calm'; Q.bossDefeated = 0; o.spared = sqSpeech(); Q.bossResolvedAt = 0; Q.bossOutcome = ''; return o; })()`);
        same(r.tap, true, 'the tap'); same(r.promised.join('|'), '1|true|BUY A SLEEPING POTION ◆100', 'I PROMISE'); same(r.hint, true, 'the hint'); same(r.quest, true, 'the quest line changed');
        same(r.killedLater.join('|'), '…|1|false|BUY A SLEEPING POTION ◆100', 'after a kill: the placeholder, the promise kept as it was, the shop'); same(r.spared, '…', 'after a sparing: the placeholder');
    });
    check('met only after the queen\'s fate is decided: no talk, "…", and the shop; the plate\'s install hint names him once he is there (by his name, SIDE QUEST, not "THE DRONE": the owner, 2026-11-02)', () => {
        const r = J(`(function(){ const o = {}; const st = __st('st_sidequest'), S = __S(); S.talk = 0; S.promised = 0; const Q = __Q(); Q.bossResolvedAt = 1; Q.bossOutcome = 'calm'; __near(st); shardCount = 100; invRemove('sleeping_potion', invCount('sleeping_potion')); o.after = [sqSpeech(), STATION_KINDS.sidequest.verbFn(st), stationCan(st).ok, sqChoosing()]; const b = stationUse(st); o.buys = [b.ok, invCount('sleeping_potion'), S.talk];
            Q.bossResolvedAt = 0; Q.bossOutcome = ''; Q.discoveredAt = 1; Q.samplesAt = 1; Q.turnedInAt = 1; Q.moduleAt = 1; const ob = questObjective(); o.plate = [ob.key, /SIDE QUEST, ON THE MAINTENANCE PLATFORM OFF THE NORTH LEDGE, SELLS A SLEEPING POTION\./.test(ob.hint) && !/DRONE/.test(ob.hint)]; return o; })()`);
        same(r.after.join('|'), '…|BUY A SLEEPING POTION ◆100|true|false', 'after the encounter, unmet'); same(r.buys.join(), 'true,1,0', 'the shop without a talk'); same(r.plate.join(), 'purify:install,true', 'the plate\'s hint');
    });

    group('HIS LOOK: the void walker (the owner, 2026-11-02: "he should be the void walker character ... that used to be the flux worker"; js/sidequest.js sqDraw, sqPortrait)');
    check('drawn from the void walker\'s sheet (img/evo/hauler.png, the old flux worker\'s, with hauler.json\'s numbers), asked for when he appears: in the world one 144-px cell of the idle beat, its feet on his spot at the evolved followers\' scale, turned toward you (east, south-east, north; standing on him keeps the last), over his shadow, his plate over him; in the dialogue box the same sheet facing you, inside the square; the sheet not in yet: only the shadow and the plate, nothing thrown; the saucer drawn in code is gone', () => {
        const js = JSON.parse(rd('img/evo/hauler.json')); ok(fs.existsSync(path.join(ROOT, 'img/evo/hauler.png')), 'the sheet is not in the repository');
        const r = J(`(function(){ const o = {}; const it = _fp.items.find(i => i.fp === 'sidequest'); if (!it) return { none: true }; o.look = [SQ_LOOK.sheet, SQ_LOOK.cell, SQ_LOOK.anchor, SQ_LOOK.core, SQ_LOOK.plate];
            delete SQ_LOOK._img; sqPlace(false); o.asked = SQ_LOOK._img !== undefined; const it2 = _fp.items.find(i => i.fp === 'sidequest');
            const calls = [], plates = [], keep = ctx.drawImage, dp = drawPlate, px = player.x, py = player.y, pvx = player.visualX, pvy = player.visualY, f0 = frame;
            ctx.drawImage = function(){ calls.push(Array.prototype.slice.call(arguments, 1)); }; drawPlate = function(t, c, x, y){ plates.push([t, c, x, y]); return true; };
            const at = (dx, dy) => { player.x = it2.x + dx; player.y = it2.y + dy; }, look = () => { calls.length = 0; plates.length = 0; drawFacilityItem(it2); const g = _fpP(it2.x, it2.y, 0); return { c: calls.slice(), p: plates.slice(), g }; };
            try {
                SQ_LOOK._img = null; at(3, 0); const none = look(); let threw = null; try { sqPortrait(200, 200, 90, 3); } catch (e) { threw = e.message; } o.unloaded = [none.c.length, none.p.length, threw];
                SQ_LOOK._img = { complete: true, naturalWidth: 2304, naturalHeight: 1152 }; frame = 7 * 3 + 2;
                at(3, 0); const e = look(); at(2, 2); const se = look(); at(0, -3); const n = look(); at(0, 0); const on = look();
                o.world = { e: e.c, se: se.c, n: n.c, on: on.c, g: e.g, plate: e.p, s: EVO_SCALE };
                calls.length = 0; sqPortrait(200, 300, 90, 7 * 5); o.portrait = calls.slice();
            } finally { ctx.drawImage = keep; drawPlate = dp; player.x = px; player.y = py; player.visualX = pvx; player.visualY = pvy; frame = f0; SQ_LOOK._img = null; }
            return o; })()`);
        ok(!r.none, 'he is not in the world'); same(r.look[0], 'img/evo/hauler.png', 'the sheet'); same(r.look[1], js.cell, 'the cell');
        ok(Math.abs(r.look[2][0] - js.anchor.x) < 0.05 && Math.abs(r.look[2][1] - js.anchor.y) < 0.05, 'the anchor is not hauler.json\'s: ' + r.look[2]); ok(Math.abs(r.look[3][0] - js.core.x) < 0.05 && Math.abs(r.look[3][1] - js.core.y) < 0.05, 'the core is not hauler.json\'s: ' + r.look[3]);
        same(r.asked, true, 'his sheet was not asked for when he appeared'); same(r.unloaded.join('|'), '0|1|', 'the sheet not in: a frame drawn, no plate, or a throw');
        const W = r.world, s = W.s, C = 144, A = r.look[2]; same(W.e.length, 1, 'one frame in the world');
        const [sx, sy, sw, sh, dx, dy, dw, dh] = W.e[0]; same([sx, sy, sw, sh].join(), [3 * C, 0, C, C].join(), 'the idle beat\'s fourth frame, facing east (you to the east)');
        ok(Math.abs(dx - (W.g[0] - A[0] * s)) < 0.01 && Math.abs(dy - (W.g[1] - A[1] * s)) < 0.01 && Math.abs(dw - C * s) < 0.01 && Math.abs(dh - C * s) < 0.01, 'its feet are not on his spot at the followers\' scale: ' + W.e[0].join() + ' at ' + W.g.join());
        same(W.se[0][1], C, 'you to the south-east: the row facing the screen'); same(W.n[0][1], 6 * C, 'you to the north: the north row'); same(W.on[0][1], 6 * C, 'standing on him: the last facing kept');
        same(JSON.stringify(W.plate), JSON.stringify([['SIDE QUEST', '#9fd8ff', W.g[0], W.g[1] - r.look[4]]]), 'his plate over him');
        same(r.portrait.length, 1, 'one frame in the dialogue box'); const P = r.portrait[0], k = 90 * 0.84 / C; same([P[0], P[1], P[2], P[3]].join(), [5 * C, C, C, C].join(), 'the idle beat, facing you');
        ok(Math.abs(P[6] - C * k) < 0.01 && P[5] + 45 * k >= 300 - 45 - 0.01 && P[5] + 143 * k <= 300 + 45 + 0.01 && P[4] >= 200 - 45 - 0.01 && P[4] + P[6] <= 200 + 45 + 0.01, 'the picture is not inside its square: ' + P.join());
        ok(!/_sqSaucer|ctx\.ellipse\(0, 2, 17/.test(rd('js/sidequest.js')), 'the saucer is still drawn in code');
    });

    group('HIS CARDS (the following update\'s Part 1d: after each quest, its line\'s three Player cards, ◆1,000 each, kept for good; js/sidequest.js sqCardsForSale, sqCardBuy)');
    check('before the purification he sells none of them (not even with the queen\'s fate decided: the quest is the clean water), and asked, says when; after it, three buttons in his line under "…": BLIGHT SHOOTER, SMOG ENGINEER and PLAGUE DOCTOR (the toxic roles, one for each class), each ◆1000 · KEPT FOR GOOD, in gold; the potion stays on his station', () => {
        const r = J(`(function(){ const o = {}; const st = __st('st_sidequest'), S = __S(), Q = __Q(); __near(st); equipDevSet(''); for (const id of [...equipOwnedSet()]) equipOwnedSet().delete(id); equipWriteOwned(); dialogueClear();
            Q.purifiedAt = 0; Q.bossResolvedAt = 0; Q.bossOutcome = ''; S.talk = SIDEQUEST.lines.talk.length; S.promised = 1; S.replyUntil = 0;
            sqDrawOverlay(); __dlg(); o.before = [sqStock().length, sqCardsForSale().length, _dlgBtns.length, sqCardWhyNot('blight_shooter'), hudCorners()];
            Q.bossResolvedAt = 1; Q.bossOutcome = 'calm'; o.fateOnly = [sqCardsForSale().length, sqSpeech()];
            Q.purifiedAt = 1; dialogueClear(); sqDrawOverlay(); __dlg(); const L = dialogueCurrent();
            o.after = { stock: sqStock().map(c => c.id + ':' + c.match + ':' + c.kit.el).join(), names: sqCardsForSale().map(c => c.name).join('|'), line: L && L.pages[0], who: L && L.who,
                btns: _dlgBtns.map(b => [b.label, b.sub, b.card, b.w > 100, b.h].join('/')), verb: STATION_KINDS.sidequest.verbFn(st), price: SIDEQUEST.cardPrice, col: SIDEQUEST.cardCol, lines: dialogueLines()[0].choices };
            return o; })()`);
        same(JSON.stringify(r.before), JSON.stringify([0, 0, 0, 'HE SELLS BLIGHT SHOOTER AFTER THE PURIFICATION', true]), 'before the purification');
        same(r.fateOnly.join('|'), '0|…', 'the queen calm, the water not yet clean');
        same(r.after.stock, 'blight_shooter:gunslinger:toxic,smog_engineer:technomancer:toxic,plague_doctor:mutator:toxic', 'his stock');
        same(r.after.names, 'BLIGHT SHOOTER|SMOG ENGINEER|PLAGUE DOCTOR', 'on sale'); same(r.after.line + '|' + r.after.who, '…|sidequest', 'his line');
        same(JSON.stringify(r.after.btns), JSON.stringify(['BLIGHT SHOOTER/◆1000 · KEPT FOR GOOD/blight_shooter/true/40', 'SMOG ENGINEER/◆1000 · KEPT FOR GOOD/smog_engineer/true/40', 'PLAGUE DOCTOR/◆1000 · KEPT FOR GOOD/plague_doctor/true/40']), 'the buttons');
        same(JSON.stringify(r.after.lines), JSON.stringify(['BLIGHT SHOOTER', 'SMOG ENGINEER', 'PLAGUE DOCTOR']), 'the line\'s choices');
        same(r.after.verb, 'BUY A SLEEPING POTION ◆100', 'the potion on his station'); same(r.after.price + '|' + r.after.col, '1000|#ffe733', 'the price and the gold');
    });
    check('buying: short of ◆1000 nothing is paid and it says why; with the shards a tap on BLIGHT SHOOTER pays ◆1000 and keeps it for good (in the collection\'s record) and found for this run, so a Gunslinger wears it at once; it leaves the row; SMOG ENGINEER and PLAGUE DOCTOR the same; then no buttons, "…" alone; bought twice, or a card he does not sell, is refused; the potion still sells', () => {
        const r = J(`(function(){ const o = {}; const st = __st('st_sidequest'); __near(st); equipFound.length = 0; dialogueClear(); sqDrawOverlay(); __dlg();
            shardCount = 999; const B0 = _dlgBtns.find(b => b.card === 'blight_shooter'); o.tapPoor = sqTap(B0.x + 5, B0.y + 5); o.poor = [shardCount, equipOwns('blight_shooter'), equipIsFound('blight_shooter'), sqCardWhyNot('blight_shooter')];
            shardCount = 2500; const pot = invCount('sleeping_potion'); const B1 = _dlgBtns.find(b => b.card === 'blight_shooter'); o.tap = sqTap(B1.x + 5, B1.y + 5);
            const rec = JSON.parse(localStorage.getItem(EQUIP.key) || 'null');
            o.bought = [shardCount, equipOwns('blight_shooter'), equipIsFound('blight_shooter'), !!rec && rec.owned.indexOf('blight_shooter') >= 0, invCount('sleeping_potion') === pot];
            playerClassKey = 'gunslinger'; o.wear = [equipPlayerWhyNot('blight_shooter', 0), equipPlayerPut(0, 'blight_shooter'), equipPlayer[0], equipPlayerAwake('blight_shooter')];
            sqDrawOverlay(); __dlg(); o.left = _dlgBtns.map(b => b.card).join();
            o.again = sqCardBuy('blight_shooter').why; o.other = sqCardBuy('incendiary_gunner').why;
            o.smog = [sqCardBuy('smog_engineer').ok, shardCount]; o.poorPlague = sqCardBuy('plague_doctor').why; shardCount = 1000; o.plague = [sqCardBuy('plague_doctor').ok, shardCount];
            sqDrawOverlay(); __dlg(); const L = dialogueCurrent(); o.none = [sqCardsForSale().length, _dlgBtns.length, L && L.pages[0], L && L.choices];
            shardCount = 100; invRemove('sleeping_potion', invCount('sleeping_potion')); const b = stationUse(st); o.potion = [b.ok, invCount('sleeping_potion')];
            equipPlayerPut(0, null); return o; })()`);
        same(r.tapPoor, true, 'the tap on the button'); same(JSON.stringify(r.poor), JSON.stringify([999, false, false, 'NEED ◆1 MORE FOR BLIGHT SHOOTER (◆1000)']), 'short of the price');
        same(r.tap, true, 'the tap'); same(r.bought.join(), '1500,true,true,true,true', 'bought: paid, kept for good (the record), found, nothing else taken');
        same(JSON.stringify(r.wear), JSON.stringify([null, true, 'blight_shooter', true]), 'worn at once by a Gunslinger');
        same(r.left, 'smog_engineer,plague_doctor', 'the row after'); same(r.again, 'YOU KEEP BLIGHT SHOOTER FOR GOOD ALREADY', 'bought twice'); same(r.other, 'HE DOES NOT SELL THAT', 'a card he does not sell');
        same(r.smog.join(), 'true,500', 'SMOG ENGINEER'); same(r.poorPlague, 'NEED ◆500 MORE FOR PLAGUE DOCTOR (◆1000)', 'short again'); same(r.plague.join(), 'true,0', 'PLAGUE DOCTOR');
        same(JSON.stringify(r.none), JSON.stringify([0, 0, '…', null]), 'all three kept: no buttons, his line alone'); same(r.potion.join(), 'true,1', 'the potion still sells');
    });
    check('a card kept for good another way (found in a pack, then ◆1000) is not offered; with ?cards=all none is (every card is yours); none on a phone (it has no cards screen yet), nor from afar; the run\'s save holds nothing new (the collection keeps them, and is read back on the next page load)', () => {
        const r = J(`(function(){ const o = {}; const st = __st('st_sidequest'); __near(st); for (const id of [...equipOwnedSet()]) equipOwnedSet().delete(id); equipWriteOwned(); equipFound.length = 0;
            shardCount = 1000; equipFound.push('smog_engineer'); o.unlock = equipUnlock('smog_engineer'); o.unlocked = sqCardsForSale().map(c => c.id).join();
            equipDevSet('all'); o.all = sqCardsForSale().length; equipDevSet('');
            const iw = innerWidth; innerWidth = 600; o.phone = [hudCorners(), sqCardsForSale().length, sqCardWhyNot('blight_shooter')]; innerWidth = iw;
            const far = _fpNearestCell(st.x + 12, st.y + 4); __put(far[0], far[1]); o.far = sqCardWhyNot('blight_shooter'); __near(st);
            const keys0 = Object.keys(facilitySaveCollect()).sort().join(); shardCount = 1000; o.buy = sqCardBuy('blight_shooter').ok; const sv = facilitySaveCollect(); o.keys = Object.keys(sv).sort().join() === keys0; o.cards = Object.keys(sv.cards || {}).sort().join();
            equipDevSet(''); o.reread = [equipOwns('blight_shooter'), equipOwns('smog_engineer'), equipOwns('plague_doctor'), sqCardsForSale().map(c => c.id).join()];   // (the collection read again from its record, as a new page would)
            for (const id of [...equipOwnedSet()]) equipOwnedSet().delete(id); equipWriteOwned(); equipFound.length = 0; const Q = __Q(); Q.purifiedAt = 0; Q.bossResolvedAt = 0; Q.bossOutcome = ''; return o; })()`);
        same(r.unlock, true, 'the unlock'); same(r.unlocked, 'blight_shooter,plague_doctor', 'a card kept another way'); same(r.all, 0, 'with ?cards=all');
        same(JSON.stringify(r.phone), JSON.stringify([false, 0, 'NOT ON A PHONE YET: IT HAS NO CARDS SCREEN']), 'on a phone'); same(r.far, 'TOO FAR AWAY', 'from afar');
        same(r.buy, true, 'the buy'); same(r.keys, true, 'a new field in the run\'s save'); same(r.cards, 'credits,found,hand,player,shelf', 'the run\'s card record (as before: the market\'s credits and shelf beside the hand, the slots and what was found)');
        same(r.reread.join('|'), 'true|true|false|plague_doctor', 'the collection read again');
    });

    group('THE SAVE (js/facilitysave.js)');
    check('the record: that he appeared, the talk, the promise, the call; a load puts him back on his platform with the gate open and his station, the talk and the promise as they were; a save from before he appeared brings nobody', () => {
        const r = J(`(function(){ const o = {}; const S = __S(); S.talk = 4; S.promised = -1; const sv = facilitySaveCollect(); o.saved = sv.sidequest; const sp = sqSpot(); __reload(sv); const S2 = __S(), st = __st('st_sidequest'), sp2 = sqSpot();
            o.back = [sqPresent(), S2.appearedAt === sv.sidequest.at, S2.talk, S2.promised, S2.calledAt > 0, facilitySolidIsOpen('sewer_gate_n2'), !!st, sp2 && sp2[0] === sp[0] && sp2[1] === sp[1], _fp.items.filter(i => i.fp === 'sidequest').length, __Q().turnedInAt > 0, __Q().antKills];
            const sv2 = facilitySaveCollect(); sv2.sidequest = null; __reload(sv2); o.none = [sqPresent(), !!__st('st_sidequest'), _fp.items.filter(i => i.fp === 'sidequest').length]; return o; })()`);
        ok(r.saved && r.saved.at > 0 && r.saved.talk === 4 && r.saved.promised === -1 && r.saved.called > 0, 'the record: ' + JSON.stringify(r.saved)); same(r.back.join('|'), 'true|true|4|-1|true|true|true|true|1|true|1', 'the load'); same(r.none.join(), 'false,false,0', 'a save from before him');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
