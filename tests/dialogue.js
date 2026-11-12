// THE DIALOGUE BOX AND THE QUEST BOX (js/dialogue.js, js/questbox.js, js/tutorial.js, js/quests.js, js/input.js, js/game.js, game.html).
// ASKED (the owner, 2026-11-01): "I want the text in this game to be like an RPG or a JRPG, where the little player or whoever's talking pops up at the bottom, little picture, and it shows the dialogue that they said. So I want the
// crystal to give you instructions for the tutorial on what to do, but still have the objective thing, but hide it. Make a little quest box on the menu."
// The box: a queue of lines, each with its speaker (the Crystal, the player, Side Quest), typed out a few letters a frame, three lines a page, a reading pace between pages, a tap / Enter to hurry; held lines with choice buttons.
// The Crystal gives the blackout words, then each tutorial step (its words, then its hint) as it comes up, once a game; the class's stage the same; the player notes the quest line's turns. The objective plate is hidden: the record
// stays (objectiveCurrent), the QUESTS panel shows it (the dock's button with a "!" for a new objective; a phone's round button), and opening it reads it. The logic runs in the sandbox, the picture and the real pointer handlers in Chromium.
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
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}

// The real page, in the facility: a fresh tutorial, the box as it is drawn, the real pointer handlers, the QUESTS button and the panel.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; canvas.setPointerCapture = function(){}; canvas.releasePointerCapture = function(){};
    var frames = function(n){ for (var i = 0; i < n; i++) render(); }, R = function(id){ var e = document.getElementById(id); if (!e) return null; var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? { l: r.left, t: r.top, r: r.right, b: r.bottom } : null; };
    var ptr = function(type, x, y){ canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' })); };
    var tap = function(x, y){ ptr('pointerdown', x, y); var pressing = isPressing; ptr('pointerup', x, y); return pressing; };
    var teal = function(x, y, w, h){ var d = ctx.getImageData(x, y, w, h).data, n = 0; for (var i = 0; i < d.length; i += 4) if (d[i + 1] > 150 && d[i + 2] > 120 && d[i] < 120) n++; return n; };   // the Crystal's teal in the portrait square
    var cur = function(){ var c = dialogueCurrent(); return c ? { key: c.key, page: c.page, shown: c.shown, len: c.flow ? c.flow.pages[c.page].join('').length : -1 } : null; };
    facilityTutorialStart(_fp.F); dialogueClear(); questBoxOpen = false; frame = 0; frames(70);   // a fresh tutorial: the blackout words come at frame 60, the first step after them
    out.size = { w: innerWidth, cw: canvas.width, ch: canvas.height, corners: hudCorners(), dockMenus: dockHasMenus() };
    out.start = { lines: dialogueLines().map(function(l){ return [l.who, l.key]; }), box: Object.assign({}, _dlgBox), cur: cur(), dock: R('topToggles'), sb: R('squadBar'), mt: R('mixTool'), foeW: canvas.width > 1100 ? 260 : canvas.width > 900 ? 232 : 214, bottom: _fpObjBottom, badge: document.body.classList.contains('quest-new'), unread: objectiveUnread(), qbtn: Object.assign({}, _QUESTBTN), bang: getComputedStyle(document.querySelector('#btnQuests .top-bang')).display };
    frames(2); var B = Object.assign({}, _dlgBox), px = B.x + DIALOGUE.pad + 6, py = B.y + DIALOGUE.pad; out.portrait = teal(px + 4, py + 4, DIALOGUE.port - 8, DIALOGUE.port - 8);
    // a tap on the box ends the typing: no walk, no ring, no long press; another turns the page; Enter ends the typing of that page
    var p0 = player.fpPath ? player.fpPath.length : 0, c0 = cur(); var down = tap(B.x + B.w / 2, B.y + B.h / 2); frames(1);
    out.tap1 = { pressing: down, path: (player.fpPath ? player.fpPath.length : 0) === p0, cmd: commandTarget === null || commandTarget === undefined, before: c0, after: cur() };
    tap(B.x + B.w / 2, B.y + B.h / 2); out.tap2 = cur(); frames(1);
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); out.enter = cur();
    // the pack open: the box is not drawn and the line waits
    var s1 = cur(); invPanelOpen = true; frames(10); out.paused = { box: _dlgBox.w, shown: cur() && cur().shown, was: s1 && s1.shown, paused: dialoguePaused() }; invPanelOpen = false; frames(2); out.back = _dlgBox.w;
    // QUESTS (the dock's button, or the phone's round one) opens the box, which reads the objective; the dialogue waits; CLOSE shuts it
    if (dockHasMenus()) document.getElementById('btnQuests').click(); else tap(_QUESTBTN.x, _QUESTBTN.y);
    frames(2); var L = _qbLayout(); out.qb = { open: questBoxOpen, unread: objectiveUnread(), badge: document.body.classList.contains('quest-new'), x: L.x, y: L.y, w: L.w, h: L.h, rows: L.rows.map(function(r){ return (r.mark ? r.mark + ' ' : '') + r.text; }), cut: L.cut, dlg: _dlgBox.w, top: uiTopSafe(), bottom: uiBottomSafe(), close: L.close };
    tap(L.close.x + L.close.w / 2, L.close.y + L.close.h / 2); frames(2); out.closed = { open: questBoxOpen, dlg: _dlgBox.w };
    // the next objective: the "!" is back, and the Crystal gives it
    _fp.tut.script.step = 1; frames(3); out.next = { badge: document.body.classList.contains('quest-new'), unread: objectiveUnread(), key: _fp.tut.script.objKey, said: dialogueLines().some(function(l){ return l.key === 'tut:step:junction'; }) };
  } catch (e) { out.err = String(e && e.stack || e); }
  var pre = document.createElement('pre'); pre.id = '__dg'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dg-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=20000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 100000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__dg">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); canvas.width = 1280; canvas.height = 860;');   // (the page boots the facility: the start returns early)
    run(`globalThis.__fresh = (power) => { invReset(); playerClassKey = null; classPickerOpen = false; invPanelOpen = false; questBoxOpen = false; facilityTutorialStart(_fp.F); if (power) _fp.tut.blackout = false; dialogueClear(); frame = 0; return _fp.tut.script; };
        globalThis.__tick = (n) => { for (let i = 0; i < (n || 1); i++) { frame++; facilityTutorialTick(); } };
        globalThis.__typeAll = () => { let n = 0; while (dialogueCurrent() && dialogueCurrent().flow && dialogueCurrent().shown < dialogueCurrent().flow.pages[dialogueCurrent().page].join('').length && n++ < 5000) dialogueTick(); return n; };`);

    group('THE BOX (js/dialogue.js): a queue of lines, typed out, three lines a page');
    check('a line is typed cps letters a frame, a typed page waits dwell + perChar × its letters and goes; a key is said once; long words turn pages of three lines; a tap ends the typing, then turns the page, then lets the line go; two pages given come in turn', () => {
        const r = J(`(function(){ const o = {}; __fresh(); dialogueClear();
            const a = dialogueSay('crystal', 'HELLO THERE', { key: 'k1' }); const again = dialogueSay('crystal', 'HELLO THERE', { key: 'k1' }); o.dedupe = [again === a, dialogueLines().length];
            dialogueTick(); const L = dialogueCurrent(); o.first = [L === a, L.name, L.col, L.shown, L.flow.pages.length]; dialogueTick(); o.typed = L.shown; __typeAll(); o.full = [L.shown, L.t];
            const dwell = DIALOGUE.dwell + DIALOGUE.perChar * 'HELLO THERE'.length; for (let i = 0; i < dwell - 1; i++) dialogueTick(); o.waits = dialogueCurrent() === a; dialogueTick(); dialogueTick(); o.gone = dialogueCurrent();
            const long = Array.from({ length: 30 }, (_, i) => 'WORD' + i).join(' '); const b = dialogueSay('player', long); dialogueTick(); const chars = b.flow.chars; o.pages = [b.flow.pages.length, b.flow.pages.every(p => p.length <= DIALOGUE.lines), Math.ceil(uiWrap(long, chars).length / DIALOGUE.lines), chars, b.name, b.col];
            o.adv1 = dialogueAdvance() && [b.page, b.shown === b.flow.pages[0].join('').length]; o.adv2 = dialogueAdvance() && [b.page, b.shown]; let n = 0; while (dialogueCurrent() === b && n++ < 50) dialogueAdvance(); o.ended = [dialogueCurrent() === null, n];
            const c = dialogueSay('crystal', ['ONE', 'TWO']); dialogueTick(); __typeAll(); o.twoA = [c.flow.pages.length, c.flow.pages[0][0], c.page]; dialogueAdvance(); o.twoB = [c.page, c.flow.pages[1][0], c.shown]; __typeAll(); dialogueAdvance(); o.twoGone = dialogueCurrent() === null; return o; })()`);
        same(r.dedupe.join(), 'true,1', 'the same key twice'); same(r.first.join(), 'true,THE CRYSTAL,#19e6c1,2,1', 'the first frame'); same(r.typed, 4, 'two frames'); same(r.full.join(), '11,0', 'typed out'); same(r.waits, true, 'it went before its pace'); same(r.gone, null, 'it stayed past its pace');
        ok(r.pages[0] > 1 && r.pages[1] && r.pages[0] === r.pages[2], 'the pages: ' + r.pages); same(r.pages[4] + '|' + r.pages[5], 'YOU|#ffe733', 'the player with no class'); same(r.adv1.join(), '0,true', 'the first tap ends the typing'); same(r.adv2.join(), '1,0', 'the second turns the page'); same(r.ended[0], true, 'the line never went: ' + r.ended);
        same(r.twoA.join(), '2,ONE,0', 'two pages given'); same(r.twoB.join(), '1,TWO,0', 'the second page'); same(r.twoGone, true, 'the line stayed');
    });
    check('a held line stays until its sayer replaces or dismisses it (a tap asks the sayer); now shows at once and gives the line it displaced back (unless it is the same group\'s); dismissing a group clears it; choice buttons stand once the words are typed, a tap on one calls it; a press on the box is the box\'s and one off it is not; while a panel is open the box waits and is not drawn', () => {
        const r = J(`(function(){ const o = {}; dialogueClear(); invPanelOpen = false; questBoxOpen = false;
            let asked = 0; const h = dialogueSay('sidequest', 'STAY', { key: 'h', group: 'g', hold: true, onTap: () => { asked++; } }); dialogueTick(); __typeAll(); for (let i = 0; i < 2000; i++) dialogueTick(); o.held = [dialogueCurrent() === h, h.name, h.col]; o.heldTap = [dialogueAdvance(), dialogueCurrent() === h, asked];
            const q = dialogueSay('crystal', 'QUEUED'); const h2 = dialogueSay('sidequest', 'STAY 2', { key: 'h2', group: 'g', hold: true, now: true }); o.now = [dialogueCurrent() === h2, dialogueLines().map(l => l.key || l.text).join()];
            const n3 = dialogueSay('player', 'URGENT', { now: true }); o.nowBack = [dialogueCurrent() === n3, dialogueLines().map(l => l.key || l.text).join()]; o.dismiss = [dialogueDismiss('g'), dialogueLines().map(l => l.key || l.text).join()];
            dialogueClear(); let picked = null; const ch = dialogueSay('sidequest', 'PICK', { hold: true, choices: [{ label: 'YES', fn: () => { picked = 'yes'; } }, { label: 'NO', fn: () => { picked = 'no'; } }] }); dialogueTick(); dialogueDraw(); o.noBtnYet = [_dlgBtns.length, _dlgBox.h]; __typeAll(); dialogueDraw();
            o.btns = _dlgBtns.map(b => [b.label, b.w > 40, b.h, b.y + b.h <= _dlgBox.y + _dlgBox.h, b.x >= _dlgBox.x]); o.boxTall = _dlgBox.h > DIALOGUE.h;
            o.tapBtn = [dialogueTap(_dlgBtns[1].x + 2, _dlgBtns[1].y + 2), picked, dialogueCurrent() === ch]; o.tapOff = dialogueTap(_dlgBox.x - 50, _dlgBox.y - 50); o.press = [dialoguePress(_dlgBox.x + 5, _dlgBox.y + 5), dialoguePress(_dlgBox.x - 5, _dlgBox.y)];
            dialogueClear(); invPanelOpen = true; const z = dialogueSay('crystal', 'WAIT FOR THE PACK'); dialogueTick(); dialogueTick(); o.pausedTick = [dialoguePaused(), dialogueCurrent(), dialogueLines().length]; dialogueDraw(); o.pausedDraw = _dlgBox.w; o.pausedTap = dialogueTap(10, 10); invPanelOpen = false; dialogueTick(); o.resumed = dialogueCurrent() === z;
            questBoxOpen = true; o.qbPauses = dialoguePaused(); questBoxOpen = false; dialogueClear(); return o; })()`);
        same(r.held.join(), 'true,SIDE QUEST,#9fd8ff', 'a held line'); same(r.heldTap.join(), 'true,true,1', 'a tap on a held line'); same(r.now.join('|'), 'true|h2,QUEUED', 'now, the same group'); same(r.nowBack.join('|'), 'true|URGENT,h2,QUEUED', 'now, another sayer: the held line goes back to the front');
        same(r.dismiss.join('|'), '1|URGENT,QUEUED', 'dismissing the group'); same(r.noBtnYet.join(), '0,' + J('DIALOGUE.h'), 'buttons before the words are typed'); same(JSON.stringify(r.btns), JSON.stringify([['YES', true, 40, true, true], ['NO', true, 40, true, true]]), 'the buttons'); same(r.boxTall, true, 'the box did not grow for them');
        same(r.tapBtn.join(), 'true,no,true', 'a tap on NO'); same(r.tapOff, false, 'a tap off the box'); same(r.press.join(), 'true,false', 'where a press is the box\'s'); same(r.pausedTick.join(), 'true,,1', 'the pack open: the line came up'); same(r.pausedDraw, 0, 'drawn under the pack'); same(r.pausedTap, false, 'a tap while paused'); same(r.resumed, true, 'it did not go on'); same(r.qbPauses, true, 'the quest box does not pause it');
    });

    group('WHO SPEAKS (js/tutorial.js, js/facilitytutorial.js, js/quests.js)');
    check('the Crystal: the blackout words first (frame 60), then the first step\'s words with its hint as a second page; a step is said once (S.said, which the save keeps: a loaded game is not told again); the next step when it comes; with the power on the step comes at once', () => {
        const r = J(`(function(){ const o = {}; const S = __fresh(); o.blackout = _fp.tut.blackout; __tick(30); o.early = dialogueLines().map(l => l.key); __tick(35); o.order = dialogueLines().map(l => l.who + ':' + l.key);
            const L = dialogueLines()[1]; o.step = L && [L.text.indexOf(TUT_STEPS[0].text()) === 0, L.text.indexOf(TUT_STEPS[0].hint()) > 0]; const q = (dialogueCurrent() && dialogueCurrent().key === 'tut:step:supplies') ? dialogueCurrent() : _dlgQueue.find(l => l.key === 'tut:step:supplies'); o.pages = q ? q.pages.length : null; o.said = !!S.said['step:supplies'];
            S.step = 1; __tick(1); o.next = dialogueLines().some(l => l.key === 'tut:step:junction'); dialogueClear(); __tick(1); o.once = dialogueLines().length;
            __fresh(true); __tick(1); o.power = dialogueLines().map(l => l.key).join();
            const S3 = __fresh(); S3.said = { 'step:supplies': true }; __tick(70); o.loaded = dialogueLines().map(l => l.key).join(); dialogueClear(); return o; })()`);
        same(r.blackout, true, 'the sandbox starts lit'); same(r.early.join(), '', 'something before the blackout words'); same(r.order.join('|'), 'crystal:blackout|crystal:tut:step:supplies', 'the order'); same(r.step && r.step.join(), 'true,true', 'the step\'s words and hint'); same(r.pages, 2, 'the hint is not a second page'); same(r.said, true, 'not recorded');
        same(r.next, true, 'the next step is not said'); same(r.once, 0, 'said twice'); same(r.power, 'tut:step:supplies', 'with the power on'); same(r.loaded, 'blackout', 'a loaded game is told the step again');
    });
    check('the player notes the quest line: each step as it comes up (its words, then its hint), once; questSay is the player\'s; the name is the class\'s once there is one', () => {
        const r = J(`(function(){ const o = {}; const S = __fresh(); S.step = TUT_STEPS.length; S.doneAt = 1; dialogueClear(); questReset(); const Q = questState('purify'); Q.discoveredAt = 1; questTick(); o.step1 = dialogueLines().map(l => l.who + ':' + l.name + ':' + l.key).join(); const t = dialogueLines()[0]; o.words = t && [t.text.indexOf('COLLECT THE SAMPLES. ANT SAMPLES') === 0, /THE BANK IS CUT OFF/.test(t.text)]   /* (the hint since build 2026-11-07bb: the sample across the river) */;
            questTick(); o.once = dialogueLines().length; questSay('◈ A NOTE'); o.note = dialogueLines().slice(-1)[0].who; Q.samplesAt = 1; Q.turnedInAt = 1; questTick(); o.step3 = dialogueLines().some(l => l.key === 'quest:purify:module'); o.skipped = dialogueLines().some(l => l.key === 'quest:purify:turnin');
            classSet('gunslinger'); dialogueClear(); questSay('X'); o.named = [dialogueLines()[0].name, dialogueLines()[0].col]; playerClassKey = null; questReset(); dialogueClear(); return o; })()`);
        same(r.step1, 'player:YOU:quest:purify:samples', 'the first step'); same(r.words && r.words.join(), 'true,true', 'its words and hint'); same(r.once, 1, 'said twice'); same(r.note, 'player', 'questSay'); same(r.step3, true, 'the module step'); same(r.skipped, false, 'a step passed by was said'); same(r.named.join(), 'GUNSLINGER,' + J('CLASSES.gunslinger.colour'), 'the class\'s name and colour');
    });
    check('the class\'s stage: once a class is chosen and the tutorial is done the Crystal gives each step as it comes (GET YOUR GEAR first, its words then its hint), says a step done, and the stage complete', () => {
        const r = J(`(function(){ const o = {}; const S = __fresh(); S.step = TUT_STEPS.length; S.doneAt = 1; classSet('gunslinger'); dialogueClear(); __tick(2); o.first = dialogueLines().map(l => l.who + ':' + l.key).join(); const L = dialogueLines()[0]; o.words = L && [L.text.indexOf(TUT_CLASS_STEP.text()) === 0, L.text.indexOf(TUT_CLASS_STEP.hint()) > 0];
            classGrant(CLASS_SIGNATURE.gunslinger); __tick(2); o.done = dialogueLines().map(l => l.key); classGrant('cctv'); S.tally = { flare: 1 }; S.ck0 = lifetimeKills - 3; __tick(2); o.complete = dialogueLines().some(l => /GUNSLINGER STAGE COMPLETE/.test(l.text)); dialogueClear(); playerClassKey = null; classPerks.clear(); return o; })()`);
        same(r.first, 'crystal:tut:cstep:gunslinger:perk', 'the gear step'); same(r.words && r.words.join(), 'true,true', 'its words and hint'); ok(r.done.includes('tut:c:gunslinger:perk') && r.done.includes('tut:cstep:gunslinger:cctv'), 'the step done and the next: ' + r.done); same(r.complete, true, 'the stage complete');
    });

    group('THE QUEST BOX (js/questbox.js) and the hidden plate (js/tutorial.js)');
    check('QUESTS lists the objective now (its title, words and hint) and the steps of what is under way with a mark each (✓ ▶ ○); opening it reads the objective; a tap on it is its, CLOSE, a tap outside, or the button again shut it; it fits between the HUD and the dock; the dialogue waits while it is open; after the tutorial it lists the class\'s stage, and the quest line once found', () => {
        const r = J(`(function(){ const o = {}; const S = __fresh(); dialogueClear(); facilityDrawObjective(); o.unread0 = objectiveUnread(); o.toggle = questBoxToggle(); o.read = [questBoxOpen, objectiveUnread()];
            const L = _qbLayout(); o.rows = L.rows.map(r => (r.mark ? r.mark + ' ' : '') + r.text); o.title = L.rows[0].kind === 'title' && L.rows[0].text === objectiveCurrent().title; o.body = L.rows.filter(r => r.kind === 'body').map(r => r.text).join(' ') === uiWrap(TUT_STEPS[0].text(), L.chars).join(' '); o.hint = L.rows.some(r => r.kind === 'hint'); o.marks = L.rows.filter(r => r.kind === 'step').map(r => r.mark).join('');
            o.fits = [L.x >= 0, L.x + L.w <= canvas.width, L.y >= uiTopSafe(), L.y + L.h <= uiBottomSafe(), L.close.y + L.close.h <= L.y + L.h, L.cut]; const said = []; const k = ctx.fillText; ctx.fillText = t => said.push(String(t)); try { drawQuestBox(); } finally { ctx.fillText = k; } o.drawn = [said[0], said.includes(objectiveCurrent().title), said.includes('CLOSE')];
            S.step = 2; const L2 = _qbLayout(); o.marks2 = L2.rows.filter(r => r.kind === 'step').map(r => r.mark).join(''); o.section = L2.rows.find(r => r.kind === 'section').text;
            o.tapIn = [_handleQuestBoxTap(L2.x + 10, L2.y + 10), questBoxOpen]; o.tapClose = [_handleQuestBoxTap(L2.close.x + 5, L2.close.y + 5), questBoxOpen]; questBoxToggle(true); o.tapOut = [handleOverlayPanelTap(1, 1), questBoxOpen]; questBoxToggle(true); o.again = [questBoxToggle(), questBoxOpen];
            questBoxToggle(true); dialogueSay('crystal', 'LATER'); dialogueTick(); o.waits = [dialoguePaused(), dialogueCurrent()]; questBoxToggle(false); dialogueTick(); o.goesOn = !!dialogueCurrent(); dialogueClear();
            S.step = TUT_STEPS.length; S.doneAt = 1; classSet('gunslinger'); const L3 = _qbLayout(); o.stage = L3.rows.filter(r => r.kind === 'section').map(r => r.text).join('|'); o.stageTitle = L3.rows[0].text; questReset(); questState('purify').discoveredAt = 1; const L4 = _qbLayout(); o.quest = L4.rows.filter(r => r.kind === 'section').map(r => r.text).join('|'); o.questMarks = L4.rows.filter(r => r.kind === 'step').map(r => r.mark).join('');
            playerClassKey = null; classPerks.clear(); questReset(); S.step = 0; S.doneAt = 0; questBoxOpen = false; return o; })()`);
        same(r.unread0, true, 'a new objective'); same(r.toggle, true, 'toggle'); same(r.read.join(), 'true,false', 'opening reads it'); same(r.rows[0], 'OBJECTIVE 1/9  ·  FIND SUPPLIES', 'the title'); same(r.title, true, 'the title row'); same(r.body, true, 'the words'); same(r.hint, true, 'the hint'); same(r.marks, '▶○○○○○○○○', 'the marks');
        same(r.fits.join(), 'true,true,true,true,true,false', 'it does not fit: ' + r.fits); same(r.drawn.join('|'), 'QUESTS|true|true', 'drawn'); same(r.marks2, '✓✓▶○○○○○○', 'two steps done'); same(r.section, 'THE TUTORIAL  ·  2/9', 'the section'); same(r.tapIn.join(), 'true,true', 'a tap on the panel'); same(r.tapClose.join(), 'true,false', 'CLOSE'); same(r.tapOut.join(), 'true,false', 'a tap outside'); same(r.again.join(), 'false,false', 'the button again');
        same(r.waits.join(), 'true,', 'the dialogue did not wait'); same(r.goesOn, true, 'it did not go on'); same(r.stage, 'GUNSLINGER STAGE  ·  0/4', 'the class\'s stage'); same(r.stageTitle, 'GUNSLINGER  ·  1/4  ·  GET YOUR GEAR', 'the stage\'s objective'); same(r.quest, 'GUNSLINGER STAGE  ·  0/4|PURIFY THE SEWERS  ·  0/5', 'the quest line'); same(r.questMarks, '▶○○○▶○○○○', 'the quest\'s marks');
    });
    check('the plate is hidden: facilityDrawObjective writes nothing and leaves no foot; the record stays; the wiring: the press is the box\'s before the targeting\'s and its release ends it, the quest box absorbs presses and takes taps, the box draws after the floating texts and the quest box after SETTINGS, the dock has QUESTS with its badge, the files load and are checked at boot; no centre-screen floating text is left for the tutorial, the quest line or Side Quest; nothing of it is saved; no shadowBlur', () => {
        const r = J(`(function(){ __fresh(); const said = []; const k = ctx.fillText; ctx.fillText = t => said.push(String(t)); try { facilityDrawObjective(); } finally { ctx.fillText = k; } const S = _fp.tut.script; return [said.length, _fpObjBottom, S.objKey, typeof objectiveCurrent().title]; })()`);
        same(r.join(), '0,0,t0,string', 'the plate');
        const i = rd('js/input.js'), down = i.split("canvas.addEventListener('pointerdown'")[1].split("canvas.addEventListener('pointermove'")[0], up = i.split("canvas.addEventListener('pointerup'")[1];
        ok(/dialoguePress\(pressX, pressY\)\) \{ _dlgPressed = true; isPressing = false; return; \}/.test(down) && down.indexOf('dialoguePress') < down.indexOf('targetPress'), 'pointerdown does not hand the press to the box before the targeting');
        ok(/if \(_dlgPressed\) \{ _dlgPressed = false;[^}]*dialogueTap\(_dx, _dy\)[^}]*isPressing = false; return; \}/.test(up.split('\n').slice(0, 8).join('\n')), 'pointerup does not end the box\'s press first');
        ok(/\(typeof questBoxOpen !== "undefined" && questBoxOpen\)/.test(down.split('AIMING A TECHNICIAN')[0]), 'pointerdown is not absorbed while the quest box is open'); ok(/_QUESTBTN/.test(up) && /questBoxToggle\(\)/.test(up), 'the phone\'s QUESTS button takes no tap');
        ok(/questBoxOpen\) return _handleQuestBoxTap\(tx, ty\)/.test(rd('js/settings.js')), 'a tap does not go to the quest box');
        const g = rd('js/game.js'); ok(g.indexOf('drawFloatingTexts();') < g.indexOf('dialogueDraw()') && g.indexOf('dialogueDraw()') < g.indexOf('drawCloneMenu()'), 'the box is not drawn after the floating texts and under the panels'); ok(g.indexOf('drawSettingsPanel();') < g.indexOf('drawQuestBox()'), 'the quest box is not drawn after SETTINGS'); ok(/questBoxOpen/.test(g.split('const _panelOpen')[1].split('\n')[0]) && /questBoxBadgeTick\(\)/.test(g), 'the quest box is no panel to the HUD, or the badge is not kept');
        const h = rd('game.html'); ok(/id="btnQuests" class="top-btn" onclick="questBoxToggle\(\)"/.test(h) && /<i class="top-bang" aria-hidden="true">!<\/i>/.test(h) && /body\.quest-new #btnQuests \.top-bang \{ display: block; \}/.test(h), 'the dock\'s QUESTS button and its badge'); ok(/js\/dialogue\.js\?v=/.test(h) && /js\/questbox\.js\?v=/.test(h) && /"js\/dialogue\.js": "DIALOGUE", "js\/questbox\.js": "QUESTBOX"/.test(h), 'the files are not loaded, or not checked at boot');
        ok(!/floatingTexts\.push/.test(rd('js/tutorial.js')) && !/floatingTexts/.test(rd('js/sidequest.js')) && /dialogueSay\("player", text\)/.test(rd('js/quests.js')) && !/floatingTexts\.push\(\{ x: canvas\.width \/ 2, y: canvas\.height \/ 2 - 150, text: FP_TUT/.test(rd('js/facilitytutorial.js')), 'the centre-screen texts are still there');
        ok(/dialogueTick\(\)/.test(rd('js/facilitytutorial.js')), 'the box is not ticked'); ok(!/\.shadowBlur\s*=/.test(rd('js/dialogue.js') + rd('js/questbox.js')), 'shadowBlur'); ok(!/objSeen|objKey|_dlg|dialogue/.test(rd('js/facilitysave.js')), 'the box or the read state is saved');
        ok(!/_objBox|_objHit|objectiveCompact|OBJ_BOX|_SQ_BTN|objectivePress/.test(rd('js/tutorial.js') + rd('js/input.js') + rd('js/sidequest.js')), 'the plate\'s old parts are still about'); ok(!fs.existsSync(path.join(ROOT, 'tests/mailbox.js')), 'the mailbox suite is still on disk');
    });

    group('THE BOX AND THE QUEST BOX (real browser)');
    for (const [w, h] of [[1180, 820], [390, 740]]) {
        const r = measure(w, h);
        if (r === null) { console.log('  (no Chromium here: skipped)'); break; }
        check(w + 'x' + h + ': the instrument ran', () => { ok(r, 'the probe produced nothing'); same(r.err, undefined, 'the probe threw'); });
        if (!r || r.err) continue;
        const phone = w <= 700, S = r.start, B = S.box, Z = r.size;
        check(w + ': the Crystal\'s blackout words come first, then the first objective; the box stands at the bottom in the room it has: above the dock, clear of the squad\'s corner and the target\'s (a tablet or a desktop), above the squad row and the chip and clear of the round buttons (a phone); the plate left no foot; the QUESTS button wears its "!"', () => {
            same(JSON.stringify(S.lines), JSON.stringify([['crystal', 'blackout'], ['crystal', 'tut:step:supplies']]), 'the lines'); same(S.cur && S.cur.key, 'blackout', 'the line showing'); ok(B.w > 0 && B.h >= J('DIALOGUE.h'), 'the box is not drawn: ' + JSON.stringify(B));
            ok(B.x >= 0 && B.x + B.w <= Z.cw && B.y >= 0 && B.y + B.h <= Z.ch, 'off the screen: ' + JSON.stringify([B, Z.cw, Z.ch, Z.w])); same(S.bottom, 0, 'the plate left a foot');
            if (!phone) { same(Z.corners, true, 'the corners'); ok(S.dock && (B.y >= S.dock.b + 8 || B.x >= S.dock.r + 8 || B.y + B.h <= S.dock.t - 8) && B.y + B.h <= Z.ch - 8, 'over the dock (the vertical bar at the left since build 2026-11-11w) or off the bottom: ' + JSON.stringify([B, S.dock])); ok(S.sb && B.x >= S.sb.r + 10, 'over the squad stack: ' + JSON.stringify([B, S.sb])); ok(B.x + B.w <= Z.cw - 14 - S.foeW - 10, 'over the enemy card\'s corner: ' + JSON.stringify([B, S.foeW])); same(S.bang, 'block', 'the dock badge'); }
            else { const top = Math.min(S.sb ? S.sb.t : 1e9, S.mt ? S.mt.t : 1e9); ok(top < 1e9 && B.y + B.h <= top - 8, 'not above the squad row / the chip: ' + JSON.stringify([B, S.sb, S.mt])); ok(B.x + B.w <= S.qbtn.x - S.qbtn.r - 6, 'under the round buttons: ' + JSON.stringify([B, S.qbtn])); ok(S.qbtn.y < Z.ch - 180 && S.qbtn.x > Z.cw - 40, 'the round QUESTS button: ' + JSON.stringify(S.qbtn)); }
            same(S.badge, true, 'a new objective (body.quest-new)'); same(S.unread, true, 'unread'); ok(r.portrait > 40, 'no teal in the portrait square (the Crystal\'s shard): ' + r.portrait);
        });
        check(w + ': a tap on the box (the real pointer handlers) ends the typing and starts no walk, ring or long press; another turns the page; Enter ends the typing of that page; with the pack open the box is not drawn and the line waits', () => {
            const t = r.tap1; same(t.pressing, false, 'the press went on as a world press'); same(t.path, true, 'a move order was given'); same(t.cmd, true, 'a command ring started'); ok(t.before && t.before.shown < t.before.len, 'the words were typed out already: ' + JSON.stringify(t.before)); ok(t.after && t.after.key === 'blackout' && t.after.page === 0 && t.after.shown === t.after.len, 'the tap did not end the typing: ' + JSON.stringify(t.after));
            ok(r.tap2 && r.tap2.key === 'blackout' && r.tap2.page === 1 && r.tap2.shown === 0, 'the second tap did not turn the page: ' + JSON.stringify(r.tap2)); ok(r.enter && r.enter.page === 1 && r.enter.shown === r.enter.len, 'Enter did not end the typing: ' + JSON.stringify(r.enter));
            same(r.paused.box, 0, 'drawn under the pack'); same(r.paused.paused, true, 'not paused'); same(r.paused.shown, r.paused.was, 'the line went on under the pack'); ok(r.back > 0, 'it did not come back');
        });
        check(w + ': QUESTS (the dock\'s button, or the phone\'s round one) opens the quest box, which reads the objective (the "!" goes) and waits the dialogue; it lists the objective and the tutorial\'s steps and fits between the HUD and the dock; CLOSE (a real tap) shuts it and the box comes back; the next objective brings the "!" back and the Crystal gives it', () => {
            const q = r.qb; same(q.open, true, 'opened'); same(q.unread, false, 'read'); same(q.badge, false, 'the badge went'); same(q.dlg, 0, 'the dialogue box under the panel'); same(q.rows[0], 'OBJECTIVE 1/9  ·  FIND SUPPLIES', 'the first row'); ok(q.rows.includes('▶ FIND SUPPLIES') && q.rows.includes('○ EVOLVE A FOLLOWER'), 'the steps: ' + q.rows.join(' / '));
            ok(q.x >= 0 && q.x + q.w <= Z.cw && q.y >= q.top - 1 && q.y + q.h <= q.bottom + 1, 'the panel does not fit: ' + JSON.stringify([q.x, q.y, q.w, q.h, q.top, q.bottom, Z.cw, Z.ch])); same(q.cut, false, 'cut'); ok(q.close.y + q.close.h <= q.y + q.h, 'CLOSE is outside the panel');
            same(r.closed.open, false, 'CLOSE did not shut it'); ok(r.closed.dlg > 0, 'the dialogue box did not come back'); same(r.next.badge, true, 'the next objective: no badge'); same(r.next.key, 't1', 'the record'); same(r.next.said, true, 'the Crystal did not give the next step');
        });
    }
    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
