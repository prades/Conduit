// THE CORNERS: where the canvas-drawn parts of the HUD stand in the facility on a tablet or a desktop (js/targeting.js, js/tutorial.js; game.html "THE CORNERS"; docs/UI-STYLE.md "The HUD").
// ASKED: "This is the correct direction for this hud all parts": every part of the HUD that works together has a corner. The target's (the round dial, the ammunition, its INFO card) is the bottom right, over the enemy card; the place's (the objective plate)
// is under the network panel at the top right; a phone, and the classic game, are as they were. The page's own pieces (the stack, the tool, the enemy card, the bars) are measured in a real browser in tests/bottomui.js and tests/squadfly.js.
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
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1180; canvas.height = 820; innerWidth = 1180;');
    run(`globalThis.__size = (w, h) => { innerWidth = w; canvas.width = w; canvas.height = h; };
        globalThis.__open = (() => { const offs = [[2, 1], [-2, 3], [5, 0]]; for (const c of _fp.cellsP.values()) if (offs.every(d => _fpLos(c[0], c[1], c[0] + d[0], c[1] + d[1]) && facilityWalkable(c[0] + d[0], c[1] + d[1], _fp.F))) return c; return null; })();
        globalThis.__foe = () => { actors = actors.filter(a => !(a instanceof Predator)); spawnPredatorForZone(1, { species: 'beetle', className: 'tank' }); const a = actors[actors.length - 1]; player.x = player.targetX = player.visualX = __open[0]; player.y = player.targetY = player.visualY = __open[1]; a.x = player.visualX + 2; a.y = player.visualY + 1; a.team = 'red'; a.dead = false; a.level = 4; a.element = 'fire'; a.maxHealth = a.health = 100; a.moveSpeed = 0; a.baseMoveSpeed = 0; a.state = 'wander'; a.provoked = false; standDown = false; targetSet(a, true); return a; };
        globalThis.__slabs = []; globalThis.__spy = fn => { const keep = uiSlab; uiSlab = function () { __slabs.push([].slice.call(arguments, 0, 4)); return keep.apply(this, arguments); }; try { fn(); } finally { uiSlab = keep; } };`);
    ok(run('!!__open'), 'no open spot in the facility to test in');

    group('THE TARGET\'S CORNER: the dial and the ammunition (js/targeting.js)');
    check('on a tablet or a desktop the dial stands at the bottom right over the enemy card (its centre in the right half and the lower half, its edge clear of the screen\'s), the ammunition beside it; a phone and the classic game keep the top left under the plate', () => {
        const r = J(`(function(){ const o = {}; __size(1180, 820); const A = _tgAnchor(); o.wide = [A.corner === true, A.x > canvas.width / 2, A.y > canvas.height / 2, A.x + A.R <= canvas.width - 14, A.y - A.R >= 8, A.top === A.y - A.R, A.R];
            __size(1600, 900); const B = _tgAnchor(); o.big = [B.corner === true, B.x > 1180, B.y > 450]; __size(820, 1180); const C = _tgAnchor(); o.portrait = [C.corner === true, C.x > 410, C.y > 590, C.x + C.R <= 820 - 14];
            __size(390, 800); const D = _tgAnchor(); o.phone = [D.corner === undefined, D.narrow, D.left, D.R]; __size(1180, 820); facilityPlay = false; const E = _tgAnchor(); o.classic = [E.corner === undefined, E.left]; facilityPlay = true; return o; })()`);
        same(r.wide.slice(0, 6).join(), 'true,true,true,true,true,true', '1180x820: ' + r.wide.join()); same(r.big.join(), 'true,true,true', '1600x900'); same(r.portrait.join(), 'true,true,true,true', '820x1180'); same(r.phone.join(), 'true,true,78,40', 'a phone'); same(r.classic.join(), 'true,18', 'the classic game');
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

    group('THE PLACE\'S CORNER: the objective under the network panel (js/tutorial.js)');
    check('on a tablet or a desktop the plate is at the top right, its right edge in line with the zone tag\'s (18 px from the edge), under the network panel (10 px under where it ends; with none drawn, under the tag); elsewhere it is top left under the tabs', () => {
        const r = J(`(function(){ const o = {}; invReset(); playerClassKey = null; classPickerOpen = false; facilityTutorialStart(_fp.F); __size(1180, 820);
            _fnBottom = 0; facilityDrawObjective(); o.none = [_objBox.w, _objBox.x + _objBox.w, _objBox.y, _fpObjBottom === _objBox.y + _objBox.h]; _fnBottom = 300; facilityDrawObjective(); o.net = [_objBox.x, _objBox.y, _fpObjBottom];
            __size(1600, 900); _fnBottom = 300; facilityDrawObjective(); o.big = [_objBox.x + _objBox.w, _objBox.y];
            __size(1180, 820); const keep = partyOn; partyOn = () => false; facilityDrawObjective(); o.old = [_objBox.x, _objBox.y, _objBox.w]; partyOn = keep;
            __size(390, 800); facilityDrawObjective(); o.phone = [_objBox.x, _objBox.y, _objHit.w > 0]; __size(1180, 820); return o; })()`);
        same(r.none[0], 304, 'the width'); same(r.none[1], 1180 - 18, 'its right edge'); ok(r.none[2] >= 150, 'under the tag: ' + r.none[2]); same(r.none[3], true, '_fpObjBottom is the plate\'s foot');
        same(r.net[0], 1180 - 18 - 304, 'x'); same(r.net[1], 310, 'under the network panel'); ok(r.net[2] > 330, 'its foot ' + r.net[2]); same(r.big.join(), (1600 - 18) + ',310', '1600 wide');
        same(r.old.join(), '12,158,350', 'a wide screen without the corners layout keeps the old place'); same(r.phone.join(), '12,158,true', 'a phone keeps its mailbox');
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
