// THE CORNERS: where the canvas-drawn parts of the HUD stand in the facility on a tablet or a desktop (js/targeting.js, js/tutorial.js; game.html "THE CORNERS"; docs/UI-STYLE.md "The HUD").
// ASKED: "This is the correct direction for this hud all parts": every part of the HUD that works together has a corner. The target's (the round dial, the ammunition, its INFO card) is the bottom right, over the enemy card; the place's (the objective plate)
// is under the network panel at the top right; a phone is as it was. The page's own pieces (the stack, the tool, the enemy card, the bars) are measured in a real browser in tests/bottomui.js and tests/squadfly.js.
// The page boots the facility (js/init.js): the sandbox has it up once the scripts have run; the test only lifts the tutorial's blackout.
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
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1180; canvas.height = 820; innerWidth = 1180;');
    run(`globalThis.__size = (w, h) => { innerWidth = w; canvas.width = w; canvas.height = h; };
        globalThis.__open = (() => { const offs = [[2, 1], [-2, 3], [5, 0]]; for (const c of _fp.cellsP.values()) if (offs.every(d => _fpLos(c[0], c[1], c[0] + d[0], c[1] + d[1]) && facilityWalkable(c[0] + d[0], c[1] + d[1], _fp.F))) return c; return null; })();
        globalThis.__foe = () => { actors = actors.filter(a => !(a instanceof Predator)); const a = spawnCreature({ species: 'beetle', className: 'tank' }); player.x = player.targetX = player.visualX = __open[0]; player.y = player.targetY = player.visualY = __open[1]; a.x = player.visualX + 2; a.y = player.visualY + 1; a.team = 'red'; a.dead = false; a.level = 4; a.element = 'fire'; a.maxHealth = a.health = 100; a.moveSpeed = 0; a.baseMoveSpeed = 0; a.state = 'wander'; a.provoked = false; standDown = false; targetSet(a, true); return a; };
        globalThis.__slabs = []; globalThis.__spy = fn => { const keep = uiSlab; uiSlab = function () { __slabs.push([].slice.call(arguments, 0, 4)); return keep.apply(this, arguments); }; try { fn(); } finally { uiSlab = keep; } };`);
    ok(run('!!__open'), 'no open spot in the facility to test in');

    group('THE TARGET\'S CORNER: the dial and the ammunition (js/targeting.js)');
    check('on a tablet or a desktop the dial stands at the bottom right over the enemy card (its centre in the right half and the lower half, its edge clear of the screen\'s), the ammunition beside it; a phone keeps the top left under the plate', () => {
        const r = J(`(function(){ const o = {}; __size(1180, 820); const A = _tgAnchor(); o.wide = [A.corner === true, A.x > canvas.width / 2, A.y > canvas.height / 2, A.x + A.R <= canvas.width - 14, A.y - A.R >= 8, A.top === A.y - A.R, A.R];
            __size(1600, 900); const B = _tgAnchor(); o.big = [B.corner === true, B.x > 1180, B.y > 450]; __size(820, 1180); const C = _tgAnchor(); o.portrait = [C.corner === true, C.x > 410, C.y > 590, C.x + C.R <= 820 - 14];
            __size(390, 800); const D = _tgAnchor(); o.phone = [D.corner === undefined, D.narrow, D.left, D.R]; __size(1180, 820); return o; })()`);
        same(r.wide.slice(0, 6).join(), 'true,true,true,true,true,true', '1180x820: ' + r.wide.join()); same(r.big.join(), 'true,true,true', '1600x900'); same(r.portrait.join(), 'true,true,true,true', '820x1180'); same(r.phone.join(), 'true,true,78,40', 'a phone');
    });
    check('with a creature locked the dial is drawn there (its tap areas too: the dial, INFO), and the ammunition chip, when the gun is armed, is to the right of it and its tap area is in the corner; its INFO card opens to the LEFT of the dial, on the screen', () => {
        const r = J(`(function(){ const o = {}; __size(1180, 820); const foe = __foe(); frame += 40; frame = Math.ceil(frame / TARGET.every) * TARGET.every; targetTick(); playerAttackMode = true; infoOpen = false; _ATKCHIP.w = 0; drawTargetUI(); const d = _tgDial;
            o.dial = d ? [d.x > canvas.width / 2, d.y > canvas.height / 2, d.x + d.r <= canvas.width - 10, d.ix > d.x, d.iy < d.y] : null; o.chip = [_ATKCHIP.w > 20, _ATKCHIP.x >= d.x + d.r, _ATKCHIP.x + _ATKCHIP.w <= canvas.width, _ATKCHIP.y > canvas.height / 2];
            o.press = [_tgOnDial(d.x, d.y), _tgOnInfo(d.ix, d.iy), _tgOnDial(40, 40)];
            infoOpen = true; __slabs.length = 0; __spy(() => drawTargetUI()); const s = __slabs[0]; o.info = s ? [s[0] >= 0, s[0] + s[2] <= d.x - d.r, s[1] >= 0, s[1] + s[3] <= canvas.height, s[2] >= 200] : null; infoOpen = false; foe.dead = true; targetDrop(); playerAttackMode = false; return o; })()`);
        same(r.dial.join(), 'true,true,true,true,true', 'the dial: ' + r.dial); same(r.chip.join(), 'true,true,true,true', 'the ammunition chip: ' + r.chip); same(r.press.join(), 'true,true,false', 'the tap areas'); ok(r.info, 'the INFO card was not drawn'); same(r.info.join(), 'true,true,true,true,true', 'the INFO card: ' + r.info);
    });
    check('with no creature locked the ammunition is in the corner too, where the dial would come up (armed or not); the dial itself is not drawn', () => {
        const r = J(`(function(){ const o = {}; __size(1180, 820); actors = actors.filter(a => !(a instanceof Predator)); targetDrop(); standDown = false; _ixSubject = null; playerAttackMode = true; _ATKCHIP.w = 0; drawTargetUI(); o.chip = [_ATKCHIP.w > 20, _ATKCHIP.x > canvas.width / 2, _ATKCHIP.y > canvas.height / 2]; o.dial = _tgDial; playerAttackMode = false; return o; })()`);
        same(r.chip.join(), 'true,true,true', 'the ammunition chip alone: ' + r.chip); same(r.dial, null, 'a dial with nothing locked');
    });

    group('THE PLACE\'S CORNER: the objective is no longer a plate under the network panel (the owner, 2026-11-01: "hide it"; js/tutorial.js objectiveCurrent, js/questbox.js)');
    check('facilityDrawObjective draws nothing and leaves no foot for the round button (0) at a tablet, under a network panel, at 1600 wide and on a phone (no mailbox either), and keeps the record of which objective is up; objectiveCurrent is the plate\'s old content (the title, the words, the hint, the colour); opening the quest box reads it, the next objective is new again', () => {
        const r = J(`(function(){ const o = {}; invReset(); playerClassKey = null; classPickerOpen = false; facilityTutorialStart(_fp.F); const S = _fp.tut.script;
            const drew = (w, h) => { __size(w, h); const said = []; const k = ctx.fillText; ctx.fillText = t => said.push(String(t)); try { facilityDrawObjective(); } finally { ctx.fillText = k; } return [said.length, _fpObjBottom, S.objKey]; };
            _fnBottom = 0; o.tablet = drew(1180, 820); _fnBottom = 300; o.net = drew(1180, 820); o.big = drew(1600, 900); o.phone = drew(390, 800); __size(1180, 820); _fnBottom = 0;
            const c = objectiveCurrent(); o.cur = [c.key, c.title, /POWER IS OUT/.test(c.body), /AMMUNITION/.test(c.hint), c.col]; o.unread = objectiveUnread(); questBoxRead(); o.read = objectiveUnread(); S.step = 1; facilityDrawObjective(); o.next = [S.objKey, objectiveUnread()]; S.step = 0; return o; })()`);
        same(r.tablet.join(), '0,0,t0', 'a tablet'); same(r.net.join(), '0,0,t0', 'under a network panel'); same(r.big.join(), '0,0,t0', '1600 wide'); same(r.phone.join(), '0,0,t0', 'a phone');
        same(r.cur.join('|'), 't0|OBJECTIVE 1/9  ·  FIND SUPPLIES|true|true|#19e6c1', 'the objective now'); same(r.unread, true, 'a new objective is not new'); same(r.read, false, 'opening the quest box did not read it'); same(r.next.join(), 't1,true', 'the next objective is not new');
    });

    group('THE REST OF THE CORNERS (game.html)');
    check('me at the top left (the crystals and the two bars side by side), the place at the top right, the stack and the tool at the bottom left, the enemy card at the bottom right: the css is scoped to body.corners, which js/party.js sets only on a tablet or a desktop in the facility', () => {
        const h = rd('game.html'); ok(/body\.corners #hudRow1 \{ justify-content: flex-start; \}/.test(h) && /body\.corners #hudRight \{ margin-left: auto; \}/.test(h), 'the top row'); ok(/body\.corners #mixTool \.mt-foe-slot \{ position: fixed; right: 14px;/.test(h), 'the enemy card');
        ok(/body\.corners #squadBar \{ left: 14px;/.test(h) && /flex-direction: column;/.test(h.slice(h.indexOf('body.corners #squadBar {'), h.indexOf('body.corners #squadBar {') + 400)), 'the stack'); ok(/--cn-tool: 178px/.test(h), 'the tool\'s height');
        const rules = h.slice(h.indexOf('THE CORNERS (docs/UI-STYLE.md'), h.indexOf('THE GAME INDEX, NEO-FUTURISTIC BLUE')); const bare = rules.split('\n').filter(l => /^\s+(body\.corners|#squadFly|:root|@media)/.test(l) || /^\s+\/\*/.test(l) || /^\s{7}/.test(l) || !l.trim());
        ok(!/^\s+#(mixTool|squadBar|hudRow1|hudRight|hudCentre)\b/m.test(rules), 'a corners rule that is not scoped to body.corners would change a phone');
    });
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
