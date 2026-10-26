// THE OBJECTIVE'S MAILBOX, ON A PHONE (js/tutorial.js facilityDrawObjective, js/input.js).
// ASKED: "in the mobile version you can hide the quest log, or actually make it to where the recent task is in a little mailbox thing with a little exclamation point if there's a new objective."
// On a screen 700 px wide or less the objective's plate is folded into a small envelope with a gold "!" on it while the objective has not been opened; a tap unfolds the plate (and reads it), a tap on the plate folds it away,
// the next objective puts the "!" back. Anywhere else it is the plate it always was. The logic runs in the sandbox, the taps and the picture in the real browser (no Chromium: it says so and passes).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}

// The real page, in the facility: the plate or the mailbox, the real pointer handlers on the canvas (a press and a release at the same spot), the picture's pixels.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; canvas.setPointerCapture = function(){}; canvas.releasePointerCapture = function(){};
    var S = function(){ return _fp.tut.script; }, frames = function(n){ for (var i = 0; i < n; i++) render(); };
    var ptr = function(type, x, y){ canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' })); };
    var tap = function(x, y){ ptr('pointerdown', x, y); var pressing = isPressing; ptr('pointerup', x, y); return pressing; };
    // gold pixels in a box (the "!" badge is UI_GOLD; nothing else in that corner of the picture is)
    var gold = function(x, y, w, h){ var d = ctx.getImageData(x, y, w, h).data, n = 0; for (var i = 0; i < d.length; i += 4) if (d[i] > 240 && d[i + 1] > 215 && d[i + 2] < 90) n++; return n; };
    var path0 = function(){ return player.fpPath ? player.fpPath.length : 0; };
    facilityTutorialStart(_fp.F); S().step = 0; S().objOpen = false; S().objSeen = undefined; S().objK = 0; frames(3);
    out.size = { w: innerWidth, h: innerHeight, cw: canvas.width, compact: objectiveCompact() };
    out.start = { bottom: _fpObjBottom, hit: [_objHit.x, _objHit.y, _objHit.w, _objHit.h], unread: objectiveUnread(), open: !!S().objOpen, gold: gold(50, 150, 30, 30), key: S().objKey };
    var p0 = path0(); var down = tap(39, 181); frames(14);
    out.opened = { open: !!S().objOpen, pressing: down, path: path0() === p0, cmd: commandTarget === null || commandTarget === undefined, bottom: _fpObjBottom, hit: [_objHit.x, _objHit.y, _objHit.w, _objHit.h], unread: objectiveUnread(), seen: S().objSeen, gold: gold(50, 150, 30, 30) };
    // a tap on the plate folds it away; a press that is let go OFF the plate does nothing
    ptr('pointerdown', 150, 230); ptr('pointerup', 150, 600); frames(2); out.cancel = { open: !!S().objOpen };
    tap(150, 230); frames(14);
    out.closed = { open: !!S().objOpen, bottom: _fpObjBottom, unread: objectiveUnread(), gold: gold(50, 150, 30, 30), path: path0() === p0 };
    // the next objective
    S().step = 1; frames(3); out.next = { unread: objectiveUnread(), key: S().objKey, gold: gold(50, 150, 30, 30), bottom: _fpObjBottom };
    tap(39, 181); frames(14); out.nextRead = { open: !!S().objOpen, seen: S().objSeen, unread: objectiveUnread() };
    // the plate open when the next one comes: it stays open and the new one is read at once
    S().step = 2; frames(3); out.whileOpen = { open: !!S().objOpen, seen: S().objSeen, key: S().objKey, unread: objectiveUnread(), bottom: _fpObjBottom };
    tap(150, 230); frames(14);
    // the round button and the ammunition go under whichever it is
    var A = _tgAnchor(); out.anchor = { top: A.top, bottom: _fpObjBottom };
    // the class picker and the pack hide it: nothing to tap
    classPickerOpen = true; frames(2); out.picker = { bottom: _fpObjBottom, hit: _objHit.w }; classPickerOpen = false; frames(2);
    // a creature locked on: the round button goes under the mailbox, and (a phone) under the network panel at the top right, whose text runs back to the middle of a narrow screen; opened, under the plate
    actors = actors.filter(function(a){ return !(a instanceof Predator); }); spawnPredatorForZone(1, { species: 'beetle', className: 'tank' }); var e = actors[actors.length - 1]; e.x = player.x + 3; e.y = player.y + 1; e.state = 'wander'; e.provoked = false; e.moveSpeed = 0; e.baseMoveSpeed = 0;
    targetSet(e, true); S().objOpen = false; frames(16); var d = _tgDial; out.dial = d ? { top: d.y - d.r, left: d.x - d.r, right: d.x + d.r, net: _fnBottom, obj: _fpObjBottom, ix: d.ix + d.ir } : null;
    S().objOpen = true; frames(16); var d2 = _tgDial; out.dialOpen = d2 ? { top: d2.y - d2.r, obj: _fpObjBottom, net: _fnBottom } : null;
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__mb'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mb-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=20000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 100000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__mb">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860;');
    // a fresh tutorial, the screen the given width, and a way to draw the plate a few times while collecting what it writes
    run(`globalThis.__fresh = (w) => { invReset(); playerClassKey = null; classPickerOpen = false; innerWidth = w; canvas.width = w; canvas.height = 800; facilityTutorialStart(_fp.F); return _fp.tut.script; };
        globalThis.__said = []; globalThis.__draw = (n) => { const keep = ctx.fillText; ctx.fillText = t => __said.push(String(t)); try { for (let i = 0; i < (n || 1); i++) { __said.length = 0; facilityDrawObjective(); } } finally { ctx.fillText = keep; } return __said.slice(); };   // (what the LAST frame wrote: the plate is still folding in the frames before it)`);

    group('THE MAILBOX (a phone: a screen 700 px wide or less)');
    check('a phone is the line the bottom-left tool draws (700 px); a wider screen has the plate as it was: drawn in full, no tap area, nothing to read, no "!"', () => {
        const r = J(`(function(){ const o = {}; o.line = [699, 700, 701, 1100].map(w => { innerWidth = w; return objectiveCompact(); }).join(); o.agree = [699, 700, 701, 1100].every(w => { innerWidth = w; return mixToolWide() === !objectiveCompact(); });
            let S = __fresh(1100); const t = __draw(); o.wideScreen = [_fpObjBottom > 250, _objHit.w, objectivePress(30, 170), objectiveUnread(), t.includes('!'), t.some(x => /FIND SUPPLIES/.test(x)), S.objK];
            S = __fresh(701); const t2 = __draw(); o.edge = [objectiveCompact(), _objHit.w, t2.some(x => /FIND SUPPLIES/.test(x))];
            const sx = innerWidth; innerWidth = undefined; o.noWidth = objectiveCompact(); innerWidth = sx; return o; })()`);
        same(r.line, 'true,true,false,false', 'the phone line'); same(r.agree, true, 'a phone here is not a phone to mixToolWide');
        same(r.wideScreen.join(), 'true,0,false,false,false,true,1', 'a wide screen: the plate in full, no tap area, no "!"'); same(r.edge.join(), 'false,0,true', '701 px is not a phone'); same(r.noWidth, false, 'no width: a phone');
    });
    check('on a phone the objective is folded away into a small envelope with a gold "!" (it is new): the plate\'s writing is not drawn, the tap area is the little box, and the round button and the ammunition would go under it', () => {
        const r = J(`(function(){ const o = {}; const S = __fresh(390); const t = __draw(); o.fold = [_fpObjBottom, _objHit.w > 0 && _objHit.w < 90, _objHit.h > 40 && _objHit.h < 70, objectiveUnread(), t.includes('!'), t.some(x => /OBJECTIVE|FIND SUPPLIES|POWER IS OUT/.test(x)), S.objK, S.objOpen || false, S.objKey];
            o.press = [objectivePress(39, 181), objectivePress(200, 400), objectivePress(100, 181)]; _objPressed = false; o.anchorTop = _tgAnchor().top; return o; })()`);
        same(r.fold.join(), '204,true,true,true,true,false,0,false,t0', 'the folded mailbox'); same(r.press.join(), 'true,false,false', 'where a press is the mailbox\'s (the box only)'); same(r.anchorTop, 216, 'the round button\'s top (under the box, 12 px)');
    });
    check('a tap on the mailbox unfolds the plate and reads the objective (the "!" goes, the writing appears, the area becomes the plate, the round button moves down); a tap on the plate folds it away, still read; a press let go off the box does nothing', () => {
        const r = J(`(function(){ const o = {}; const S = __fresh(390); __draw(2);
            o.cancel = [objectivePress(39, 181), (objectiveRelease(300, 600), !!S.objOpen)]; _objPressed = false;
            o.press = objectivePress(39, 181); objectiveRelease(39, 181); o.open1 = !!S.objOpen; let t = __draw(14);
            o.open = [S.objK, _fpObjBottom, _objHit.w > 300, objectiveUnread(), S.objSeen, t.includes('!'), t.some(x => /FIND SUPPLIES/.test(x)), t.some(x => /POWER IS OUT/.test(x))]; o.anchorOpen = _tgAnchor().top;
            o.on = [objectivePress(150, 230), objectivePress(39, 181)]; _objPressed = false; objectiveRelease(150, 230); o.closing = !!S.objOpen; t = __draw(14);
            o.folded = [S.objK, _fpObjBottom, objectiveUnread(), t.includes('!'), t.some(x => /FIND SUPPLIES/.test(x))]; return o; })()`);
        same(r.cancel.join(), 'true,false', 'a press let go elsewhere'); same(r.press, true, 'the press on the box'); same(r.open1, true, 'the release opens it');
        same(r.open[0], 1, 'fully unfolded'); ok(r.open[1] > 280 && r.open[1] < 340, 'the open plate ends at ' + r.open[1]); same(r.open[2], true, 'the area is the plate'); same(r.open[3], false, 'read: still unread'); same(r.open[4], 't0', 'read: the key'); same(r.open[5], false, 'the "!" on the open plate'); same(r.open[6], true, 'the title'); same(r.open[7], true, 'the text');
        ok(r.anchorOpen > 300, 'the round button stayed up under the open plate: ' + r.anchorOpen); same(r.on.join(), 'true,true', 'a press on the open plate'); same(r.closing, false, 'a tap on the plate folds it');
        same(r.folded.join(), '0,204,false,false,false', 'folded again, and read');
    });
    check('a new objective puts the "!" back (and the envelope rattles for a moment): the next step, the class\'s own, and the closing line each come in as unread; an objective that comes while the plate is open is read at once and the plate stays open', () => {
        const r = J(`(function(){ const o = {}; const S = __fresh(390); frame = 1000; __draw(2); objectiveToggle(true); __draw(14); objectiveToggle(false); __draw(14); o.read = objectiveUnread();
            frame = 2000; S.step = 1; let t = __draw(); o.next = [S.objKey, objectiveUnread(), t.includes('!'), S.objNewAt]; objectiveToggle(true); __draw(14); S.step = 2; t = __draw(); o.whileOpen = [S.objKey, S.objSeen, objectiveUnread(), t.includes('!'), !!S.objOpen, _fpObjBottom > 280];
            objectiveToggle(false); __draw(14); classSet('gunslinger'); S.step = TUT_STEPS.length; frame = 3000; t = __draw(); o.perk = [S.objKey, objectiveUnread(), t.includes('!')]; objectiveToggle(true); __draw(14); objectiveToggle(false); __draw(14); o.perkRead = objectiveUnread();
            classGrant(CLASS_SIGNATURE.gunslinger); frame = 4000; t = __draw(); o.done = [S.objKey, objectiveUnread(), t.includes('!')]; return o; })()`);
        same(r.read, false, 'read'); same(r.next.join(), 't1,true,true,2000', 'the next objective'); same(r.whileOpen.join(), 't2,t2,false,false,true,true', 'a new objective while the plate is open');
        same(r.perk.join(), 'perk,true,true', 'the class objective'); same(r.perkRead, false, 'the class objective, read'); same(r.done.join(), 'done,true,true', 'the closing line');
    });
    check('the round button and the ammunition go under the mailbox (12 px), and on a phone not higher than under the network panel; a wide screen ignores the panel and keeps the plate\'s place; no plate drawn: the old default', () => {
        const r = J(`(function(){ const o = {}; const S = __fresh(390); const a = (obj, net) => { _fpObjBottom = obj; _fnBottom = net; return _tgAnchor().top; };
            o.phone = [a(204, 0), a(204, 258), a(306, 258), a(204, 100), a(0, 0), a(0, 258)]; const w = _tgAnchor(); o.pos = [w.narrow, w.left, w.R]; canvas.width = 1280; o.wide = [a(306, 258), a(204, 258), a(0, 258)]; canvas.width = 390; _fpObjBottom = 0; _fnBottom = 0; return o; })()`);
        same(r.phone.join(), '216,266,318,216,196,266', 'the anchor on a phone'); same(r.wide.join(), '318,216,196', 'the anchor on a wide screen'); same(r.pos.join(), 'true,78,40', 'a phone\'s button is beside the menu hub');
        ok(/_fnBottom = Y \+ H;/.test(rd('js/facilitynet.js')) && /_fnBottom = 0;/.test(rd('js/facilitynet.js')), 'the network panel does not say where it ends');
    });
    check('the plate is not drawn (and the mailbox cannot be tapped) while the class picker or the pack is open; no tutorial, nothing', () => {
        const r = J(`(function(){ const o = {}; const S = __fresh(390); __draw(2); classPickerOpen = true; __draw(); o.picker = [_fpObjBottom, _objHit.w, objectivePress(39, 181)]; classPickerOpen = false; invPanelOpen = true; __draw(); o.pack = [_fpObjBottom, _objHit.w]; invPanelOpen = false; __draw(); o.back = [_fpObjBottom, _objHit.w > 0];
            const keep = _fp.tut.script; _fp.tut.script = null; __draw(); o.none = [_fpObjBottom, _objHit.w, objectiveUnread(), objectiveToggle()]; _fp.tut.script = keep; return o; })()`);
        same(r.picker.join(), '0,0,false', 'the picker'); same(r.pack.join(), '0,0', 'the pack'); same(r.back.join(), '204,true', 'it comes back'); same(r.none.slice(0, 3).join(), '0,0,false', 'no script');
    });
    check('the drawing and the taps are wired in: the press is the mailbox\'s before the targeting\'s (no ring, no move order, no long press), the release toggles it, the plate keeps drawing exactly as before on a wide screen; nothing it adds is saved (a new game is unread again)', () => {
        const i = rd('js/input.js'), down = i.split("canvas.addEventListener('pointerdown'")[1].split("canvas.addEventListener('pointermove'")[0], up = i.split("canvas.addEventListener('pointerup'")[1];
        ok(/objectivePress\(pressX, pressY\)\) \{ isPressing = false; return; \}/.test(down), 'pointerdown does not hand the press to the mailbox'); ok(down.indexOf('objectivePress') < down.indexOf('targetPress'), 'the mailbox does not come before the targeting');
        ok(/if \(_objPressed\) \{ _objPressed = false;[^}]*objectiveRelease\(_ox, _oy\)[^}]*isPressing = false; return; \}/.test(up.split('\n').slice(0, 8).join('\n')), 'pointerup does not end the mailbox\'s press first');
        const t = rd('js/tutorial.js'); ok(/innerWidth <= 700/.test(t), 'the phone line'); ok(!/\.shadowBlur\s*=/.test(t.split('function _objBang')[1].split('function facilityDrawObjective')[0]), 'the badge uses shadowBlur');
        ok(!/objOpen|objSeen|objKey/.test(rd('js/facilitysave.js')), 'the mailbox is saved'); ok(/script\.tut|_fp\.tut\.script = \{ step: 0/.test(t), 'the director starts a script');
    });

    group('THE MAILBOX (real browser)');
    for (const [w, h] of [[360, 740], [500, 800], [1180, 820]]) {
        const r = measure(w, h);
        if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
        check(w + 'x' + h + ': the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); });
        if (!r || r.err) continue;
        const phone = w <= 700;
        same(r.size.compact, phone, 'compact');
        if (phone) {
            check(w + ': the plate is a small envelope with a gold "!" (pixels in the corner of the picture); the round button would go under it', () => {
                same(r.start.bottom, 204, 'the box ends'); ok(r.start.hit[2] < 90 && r.start.hit[2] > 40, 'the box width ' + r.start.hit[2]); same(r.start.unread, true, 'unread'); same(r.start.open, false, 'open'); ok(r.start.gold > 30, 'gold pixels where the "!" goes: ' + r.start.gold);
            });
            check(w + ': a tap on it (the real pointer handlers) unfolds the plate and reads it, starts no move or ring and no long press; the "!" is gone; a press let go off the plate does nothing; a tap on the plate folds it away', () => {
                same(r.opened.open, true, 'a tap on the mailbox'); same(r.opened.pressing, false, 'the press went on as a world press (a move order, a ring or a long press would follow)'); same(r.opened.path, true, 'a move order was given'); same(r.opened.cmd, true, 'a command ring started');
                ok(r.opened.bottom > 280, 'unfolded ' + r.opened.bottom); ok(r.opened.hit[2] > 300, 'the area is the plate'); same(r.opened.unread, false, 'read'); same(r.opened.seen, 't0', 'seen'); ok(r.opened.gold < 5, 'a gold "!" on the open plate: ' + r.opened.gold);
                same(r.cancel.open, true, 'a press let go off the plate folded it'); same(r.closed.open, false, 'a tap on the plate'); same(r.closed.bottom, 204, 'folded'); same(r.closed.unread, false, 'read'); ok(r.closed.gold < 5, 'a gold "!" when it is read: ' + r.closed.gold); same(r.closed.path, true, 'a move order was given');
            });
            check(w + ': the next objective brings the "!" back (gold pixels again); opened, it is read; one that comes while the plate is open is read at once; the picker hides it', () => {
                same(r.next.key, 't1', 'the next key'); same(r.next.unread, true, 'unread'); ok(r.next.gold > 30, 'gold pixels: ' + r.next.gold); same(r.next.bottom, 204, 'folded');
                same(r.nextRead.open, true, 'opened'); same(r.nextRead.seen, 't1', 'seen'); same(r.nextRead.unread, false, 'read'); same(r.whileOpen.open, true, 'kept open'); same(r.whileOpen.seen, 't2', 'seen at once'); same(r.whileOpen.unread, false, 'read at once'); ok(r.whileOpen.bottom > 280, 'still the plate');
                ok(r.anchor.top >= r.anchor.bottom + 12, 'the round button (' + r.anchor.top + ') is not under the box (' + r.anchor.bottom + ')'); same(r.picker.bottom, 0, 'drawn under the picker'); same(r.picker.hit, 0, 'tappable under the picker');
            });
            check(w + ': a creature locked on: the round button comes up under the mailbox and under the network panel (whose text it covered at 360 px), moves down under the plate when it is opened, and stays on the screen', () => {
                ok(r.dial, 'no round button'); ok(r.dial.net > 150, 'the network panel ends at ' + r.dial.net); ok(r.dial.top >= r.dial.net + 8, 'the round button (top ' + r.dial.top + ') is over the network panel (ends ' + r.dial.net + ')'); ok(r.dial.top >= r.dial.obj + 12, 'the round button is over the mailbox');
                ok(r.dial.left >= 0 && r.dial.ix <= w, 'off the screen'); ok(r.dialOpen, 'no round button with the plate open'); ok(r.dialOpen.top >= r.dialOpen.obj + 12, 'the round button is over the open plate (' + r.dialOpen.top + ' vs ' + r.dialOpen.obj + ')'); ok(r.dialOpen.top > r.dial.top, 'the round button did not move down for the plate');
            });
        } else {
            check(w + ': a wide screen has the plate as it was: in full, no "!", no tap area, a tap on it opens nothing', () => {
                ok(r.start.bottom > 250, 'the plate ends at ' + r.start.bottom); same(r.start.hit[2], 0, 'a tap area'); same(r.start.unread, false, 'unread'); ok(r.start.gold < 5, 'a gold "!": ' + r.start.gold); same(r.opened.open, false, 'a tap opened something'); same(r.next.unread, false, 'the next objective'); same(r.opened.bottom, r.start.bottom, 'the plate moved');
            });
        }
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
