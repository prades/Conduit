// THE START: the start screen, the staged start, the sheets it waits for, and what the page promises about all three (js/init.js, game.html #startupOverlay, js/game.js gameLoopStart; docs/STARTUP.md).
//
// REPORTED (an iPad): the game sometimes started at about 20 frames a second, and a refresh often fixed it. The page used to start the clock at once and pay for each sheet of sprites in the middle of play
// (docs/STARTUP.md has the measurements). It now builds the world, draws the first picture to find out which sheets the scene wants, waits for those, draws a picture with them in, and only then starts the clock;
// a start screen covers the page and takes every touch and key until then.
//
// Nothing here can reach a browser: the sandbox has no real images, no real timers and no screen. So the sheets are a stand-in that arrives when the test says (and fails when it says), the timers are a queue the
// test turns, and the window's listeners are a list the test dispatches through (capture listeners first, as a browser does). What it proves is the sequence: what runs once, what runs when, what stays up while
// work is unfinished, what a failure leaves behind, and that trying again does not leave two of anything. The numbers (how long a start takes, how many canvases it saves) are in docs/STARTUP.md.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox, stubEl } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
async function check(name, fn) { try { await fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
const settle = async (n = 12) => { for (let i = 0; i < n; i++) await new Promise(r => setImmediate(r)); };

// ── a page that can be turned by hand ──
// opts: store (localStorage), auto (sheets arrive the moment they are asked for), noImages (no HTMLImageElement at all: the plain sandbox every other suite boots)
function makePage(opts = {}) {
    const sb = makeBrowserSandbox(opts.store || {});
    const P = { now: 1000, timers: [], tid: 0, raf: [], imgs: [], reqs: [], L: {}, dom: {}, removed: [], errors: [], logs: [] };
    class FakeImg {
        constructor() { this.complete = false; this.naturalWidth = 0; this._l = {}; this._src = ''; P.imgs.push(this); }
        set src(v) { this._src = String(v); P.reqs.push(this._src); if (P.auto) this.arrive(true); }
        get src() { return this._src; }
        addEventListener(t, f) { (this._l[t] = this._l[t] || []).push(f); }
        arrive(good) { this.complete = true; this.naturalWidth = good ? 100 : 0; for (const f of this._l[good ? 'load' : 'error'] || []) f(); const h = this[good ? 'onload' : 'onerror']; if (h) h(); }
    }
    P.auto = !!opts.auto;
    if (!opts.noImages) { sb.HTMLImageElement = FakeImg; sb.Image = function () { return new FakeImg(); }; }
    sb.performance = { now: () => P.now };
    sb.setTimeout = (fn, ms) => { const id = ++P.tid; P.timers.push({ id, at: P.now + (ms || 0), fn }); return id; };
    sb.clearTimeout = id => { P.timers = P.timers.filter(t => t.id !== id); };
    P.advance = ms => { const end = P.now + ms; for (;;) { const due = P.timers.filter(t => t.at <= end).sort((a, b) => a.at - b.at)[0]; if (!due) break; P.timers = P.timers.filter(t => t !== due); P.now = Math.max(P.now, due.at); due.fn(); } P.now = end; };
    sb.requestAnimationFrame = cb => { P.raf.push(cb); return P.raf.length; };
    const same_ = (a, f, o) => l => l.f === f && l.cap === !!(o && (o === true || o.capture));
    sb.addEventListener = sb.window.addEventListener = (t, f, o) => { (P.L[t] = P.L[t] || []).push({ f, cap: !!(o && (o === true || o.capture)) }); };
    sb.removeEventListener = sb.window.removeEventListener = (t, f, o) => { const a = P.L[t] || [], i = a.findIndex(same_(t, f, o)); if (i > -1) a.splice(i, 1); };
    // the window's listeners, in the order a browser runs them: the capture ones, then the rest; a handler that stops the event ends it
    P.dispatch = (type, extra) => {
        const ev = Object.assign({ type, target: { closest: () => null }, cancelable: true, stopped: false, prevented: false, stopImmediatePropagation() { this.stopped = true; }, stopPropagation() {}, preventDefault() { this.prevented = true; } }, extra);
        for (const grp of [true, false]) for (const l of (P.L[type] || []).filter(l => l.cap === grp).slice()) { l.f(ev); if (ev.stopped) return ev; }
        return ev;
    };
    // the start screen's parts (everything else answers with the sandbox's blank element)
    const el = id => { const e = stubEl(); e.id = id; e.hidden = false; e.onclick = null; e.parentNode = { removeChild(x) { P.removed.push(x.id); } };
        e.classList = { s: new Set(), add(c) { this.s.add(c); }, remove(c) { this.s.delete(c); }, contains(c) { return this.s.has(c); } };
        if (id === 'startupSteps') e.children = Array.from({ length: 6 }, () => ({ className: '' }));
        return e; };
    sb.document.getElementById = id => /^startup/.test(id) ? (P.dom[id] || (P.dom[id] = el(id))) : stubEl();
    sb.document.createElement = tag => String(tag).toLowerCase() === 'img' ? new FakeImg() : stubEl();
    sb.console = { log() {}, warn() {}, error: (...a) => { P.errors.push(a.map(String).join(' ')); } };
    P.sb = sb; P.ctx = vm.createContext(sb);
    P.run = (s, file) => vm.runInContext(s, P.ctx, file ? { filename: file } : undefined);
    // every script but init.js: the page, before it starts
    P.load = () => { for (const rel of scriptOrder()) if (rel !== 'js/init.js') { try { P.run(rd(rel), rel); } catch (e) { throw new Error(rel + ': ' + e.message); } } };
    P.init = () => P.run(rd('js/init.js'), 'js/init.js');
    P.boot = () => { P.load(); P.init(); return P; };
    P.defs = () => { P.load(); P.run(rd('js/init.js').replace(/^startupBegin\(\);\s*$/m, ''), 'js/init.js'); return P; };   // (the start's functions, with the start itself not begun: the loaders can be called one at a time)
    P.S = () => P.run('STARTUP');
    P.state = () => P.run('STARTUP.state');
    P.wanted = () => P.imgs.filter(i => P.run('(function (im) { const a = STARTUP.by.get(im); return !!a && a.want && a.state !== "ok"; })').call(null, i));
    return P;
}
const dom = (P, id) => P.dom[id];

(async () => {
    // ───────────────────────────────────────────────────────
    group('THE START, with every sheet already in (a warm cache, or the sandbox)');
    await check('the sandbox has no real images, so nothing is waited for: the whole start has run before init.js ends, and the clock has begun once', async () => {
        const P = makePage({ noImages: true }); P.load(); P.run('globalThis.__w = 0; { const f = facilityPlayStart; facilityPlayStart = function () { __w++; return f.apply(this, arguments); }; }'); P.init();
        same(P.state(), 'done', 'state'); same(P.sb.__w, 1, 'the facility was built once'); same(P.run('_loopRunning'), true, 'the clock'); same(P.raf.length, 1, 'frames scheduled'); same(P.run('STARTUP.pictures'), 0, 'extra pictures (the clock draws the first)');
        same(P.run('frame'), 1, 'steps run before the first refresh (the clock\'s own first picture, as before)');
    });
    await check('with sheets that arrive at once: the first picture, the warm picture, then the clock — and the facility is built once', async () => {
        const P = makePage({ auto: true }); P.load(); P.run('globalThis.__w = 0; { const f = facilityPlayStart; facilityPlayStart = function () { __w++; return f.apply(this, arguments); }; }'); P.init(); await settle();
        same(P.state(), 'done', 'state'); same(P.sb.__w, 1, 'built'); same(P.run('STARTUP.tries'), 1, 'tries'); same(P.run('_loopRunning'), true, 'clock');
        ok(P.run('STARTUP.pictures') >= 2, 'pictures before the clock: ' + P.run('STARTUP.pictures'));
        same(P.run('STARTUP.ms.length'), 6, 'a duration for every stage');
        ok(P.run('STARTUP.ms.every(m => typeof m === "number" && m >= 0)'), 'durations are numbers');
    });
    await check('THE ASK: the order is the world, the first picture, the pictures with the sheets in, the visible area measured again, and only then the clock', async () => {
        const P = makePage({ auto: true }); P.load();
        P.run(`globalThis.__log = []; { const w = (n) => { const f = globalThis[n]; globalThis[n] = function () { const tag = n + (n === 'render' ? (STARTUP.collecting ? ':first' : ':warm') : ''); __log.push(tag + '>'); try { return f.apply(this, arguments); } finally { __log.push('<' + tag); } }; }; ['facilityPlayStart', 'render', 'checkVisibleArea', 'gameLoopStart', 'gameLoop'].forEach(w); }`);
        P.init(); await settle(); same(P.state(), 'done', 'state');
        const seq = P.sb.__log, log = seq.join(' '), go = seq.indexOf('gameLoopStart>'), firstEnd = seq.indexOf('<render:first'), warm = seq.indexOf('render:warm>');
        same(seq[0], 'facilityPlayStart>', 'the world comes first: ' + log); same(seq[2], 'render:first>', 'then the first picture: ' + log); ok(go > 4, 'the clock began before the pictures: ' + log);
        same(seq[go + 1], 'gameLoop>', 'gameLoopStart calls gameLoop: ' + log); ok(!seq.slice(0, go).some(x => /^gameLoop>/.test(x)), 'the loop ran before the clock was started: ' + log);
        ok(seq.slice(go + 2).filter(x => /^render/.test(x) && x.endsWith('>')).length === 1, 'the clock drew more than its own first picture: ' + log);
        ok(firstEnd > 0 && warm > firstEnd, 'no picture with the sheets in follows the first: ' + log); ok(seq.slice(firstEnd, warm).includes('checkVisibleArea>'), 'the visible area is not measured between the first picture and the next: ' + log); ok(warm < go, 'the warm picture is not before the clock: ' + log);
        same(seq.filter(x => x === 'facilityPlayStart>').length, 1, 'worlds'); same(seq.filter(x => x === 'gameLoopStart>').length, 1, 'clocks');
    });
    await check('VALIDATING REQUIRED SYSTEMS: a start whose world did not get built stops there, with the reason, before any picture and with no clock', async () => {
        const P = makePage({ auto: true }); P.load(); P.run('globalThis.__draw = 0; { const f = render; render = function () { __draw++; return f.apply(this, arguments); }; facilityPlayStart = function () { return true; }; }');
        P.init(); await settle(); same(P.state(), 'failed', 'state'); same(P.run('STARTUP.error.stage'), 'VALIDATING REQUIRED SYSTEMS', 'stage'); ok(/the facility is not built/.test(dom(P, 'startupError').textContent), 'reason: ' + dom(P, 'startupError').textContent);
        same(P.sb.__draw, 0, 'a picture was drawn of a world that is not there'); same(P.run('_loopRunning'), false, 'clock'); same(P.raf.length, 0, 'frames scheduled'); same(dom(P, 'startupPlay').hidden, true, 'PLAY ANYWAY offered');
    });
    await check('THE ASK: called again, the start does nothing — no second world, no second clock, no second frame scheduled', async () => {
        const P = makePage({ auto: true }); P.load(); P.run('globalThis.__w = 0; { const f = facilityPlayStart; facilityPlayStart = function () { __w++; return f.apply(this, arguments); }; }'); P.init(); await settle();
        const raf = P.raf.length, fp = P.run('_fp'), tries = P.run('STARTUP.tries');
        for (let i = 0; i < 3; i++) P.run('startupBegin()');
        same(P.run('gameLoopStart()'), false, 'a second clock'); same(P.raf.length, raf, 'frames scheduled'); same(P.run('_fp') === fp, true, 'the world was rebuilt'); same(P.sb.__w, 1, 'facilityPlayStart calls'); same(P.run('STARTUP.tries'), tries, 'tries');
        same(P.run('_perf.loops'), 1, 'clocks started'); ok(P.run('_perf.denied') >= 1, 'the refused start is counted');
    });
    await check('the saved game is put back as it was: its followers come back, once (the game then saves its restored self, as it always did at its first step)', async () => {
        const save = { v: 1, followers: [{ element: 'fire', personality: 'stoic', role: 'brawler', stats: { hp: 22, attack: 6, speed: 11, will: 20 } }, { element: 'electric' }] };
        const store = { conduit_fp_save: JSON.stringify(save) }; const P = makePage({ auto: true, store }); P.load(); P.init(); await settle();
        same(P.state(), 'done', 'state'); same(P.run('followers.length'), 2, 'followers'); same(P.run('followers.map(f => f.element).join()'), 'fire,electric', 'which');
        const back = JSON.parse(store.conduit_fp_save); same(back.followers.map(f => f.element).join(), 'fire,electric', 'the followers in the save the game wrote back');
    });

    // ───────────────────────────────────────────────────────
    group('THE START SCREEN stays up while work is unfinished, and nothing reaches the game under it');
    const waiting = async () => { const P = makePage(); P.load(); P.init(); await settle(); return P; };
    await check('THE ASK: with sheets still on their way, the start waits at LOADING REQUIRED ASSETS: the screen is up, the clock has not begun, no frame is scheduled, and the game has taken no step but the first picture', async () => {
        const P = await waiting();
        same(P.state(), 'running', 'state'); same(P.run('STARTUP_STAGES[STARTUP.stage]'), 'LOADING REQUIRED ASSETS', 'stage');
        const want = P.wanted(); ok(want.length > 0, 'the first picture wanted nothing: the scene asked for no sheet');
        same(P.run('_loopRunning'), false, 'clock'); same(P.raf.length, 0, 'frames scheduled'); same(P.run('frame'), 1, 'game steps (the first picture)'); ok(!dom(P, 'startupOverlay').classList.contains('off'), 'the screen is already going');
        same(dom(P, 'startupStage').textContent, 'LOADING REQUIRED ASSETS', 'the screen names the stage'); ok(/^SHEETS 0 \/ \d+$/.test(dom(P, 'startupDetail').textContent), 'the screen counts the sheets: ' + dom(P, 'startupDetail').textContent);
        P.advance(5000); await settle(); same(P.state(), 'running', 'still waiting after 5 s'); same(P.run('_loopRunning'), false, 'clock after 5 s');
    });
    await check('the count on the screen is the real count: it moves as each sheet arrives, and the screen goes (and the clock begins) only after the last', async () => {
        const P = await waiting(); const want = P.wanted(), n = want.length; ok(n > 1, 'only ' + n + ' wanted');
        for (let i = 0; i < n - 1; i++) { want[i].arrive(true); await settle(); same(dom(P, 'startupDetail').textContent, 'SHEETS ' + (i + 1) + ' / ' + n, 'after ' + (i + 1)); same(P.state(), 'running', 'state after ' + (i + 1)); same(P.run('_loopRunning'), false, 'clock after ' + (i + 1)); }
        want[n - 1].arrive(true); await settle(40);
        // (a picture with the sheets in may ask for more: they are waited for too)
        for (let k = 0; k < 6 && P.state() === 'running'; k++) { for (const w of P.wanted()) w.arrive(true); await settle(40); }
        same(P.state(), 'done', 'state'); same(P.run('_loopRunning'), true, 'clock'); ok(dom(P, 'startupOverlay').classList.contains('off'), 'the screen went'); ok(P.run('STARTUP.pictures') >= 3, 'the pictures with the sheets in: ' + P.run('STARTUP.pictures'));
    });
    await check('sheets the page preloads for later (the first picture did not ask for them) are optional: they never hold the start', async () => {
        const P = await waiting(); const all = P.imgs.length, want = P.wanted().length; ok(all > want, 'every sheet was wanted (' + all + ')');
        for (let k = 0; k < 8 && P.state() === 'running'; k++) { for (const w of P.wanted()) w.arrive(true); await settle(40); }
        same(P.state(), 'done', 'state'); ok(P.imgs.some(i => !i.complete), 'the test left no optional sheet unfinished');
        same(P.run('STARTUP.assets.filter(a => a.want && a.state !== "ok").length'), 0, 'a wanted sheet is still unfinished');
    });
    await check('THE ASK: nothing the player does reaches the game before it has started — a key (the pack on I) and a touch are stopped at the window, and let through after', async () => {
        const P = await waiting();
        same(P.run('invPanelOpen'), false, 'the pack starts shut');
        const k = P.dispatch('keydown', { key: 'i' }); ok(k.stopped, 'the key was not stopped'); same(P.run('invPanelOpen'), false, 'the pack opened under the start screen'); ok(!k.prevented, 'a key lost its browser meaning (reload, tab switching)');
        const t = P.dispatch('pointerdown', { clientX: 5, clientY: 5 }); ok(t.stopped && t.prevented, 'a touch was not stopped'); for (const ty of ['touchstart', 'mousedown', 'click', 'wheel', 'keyup']) ok(P.dispatch(ty).stopped, ty + ' was not stopped');
        const own = P.dispatch('click', { target: { closest: s => s === '#startupOverlay' ? {} : null } }); ok(!own.stopped, 'the screen\'s own buttons are blocked');
        for (let k2 = 0; k2 < 8 && P.state() === 'running'; k2++) { for (const w of P.wanted()) w.arrive(true); await settle(40); }
        same(P.state(), 'done', 'state'); same(P.run('STARTUP.guard'), false, 'the guard is still up'); same((P.L.keydown || []).filter(l => l.f === P.run('_suBlock')).length, 0, 'the key listener was left on the window');
        const after = P.dispatch('keydown', { key: 'i' }); ok(!after.stopped, 'a key is still stopped after the start'); same(P.run('invPanelOpen'), true, 'the pack does not open once the game has started');
    });

    // ───────────────────────────────────────────────────────
    group('FAILURES leave a screen that says what and offers a way on, and trying again leaves one of everything');
    await check('THE ASK: a sheet that will not load stops the start at LOADING REQUIRED ASSETS: it says which file, offers RETRY / PLAY ANYWAY / RELOAD, writes the error to the console, and no clock runs', async () => {
        const P = await waiting(); const w = P.wanted()[0]; const file = w.src.replace(/\?.*/, ''); w.arrive(false); await settle();
        same(P.state(), 'failed', 'state'); same(P.run('STARTUP.error.stage'), 'LOADING REQUIRED ASSETS', 'stage'); ok(dom(P, 'startupError').textContent.includes(file), 'the screen does not name ' + file + ': ' + dom(P, 'startupError').textContent); ok(/^DID NOT LOAD: /.test(dom(P, 'startupError').textContent) && !/DID NOT ARRIVE/.test(dom(P, 'startupError').textContent), 'the sheets still on their way are listed as late before their time is up: ' + dom(P, 'startupError').textContent);
        ok(dom(P, 'startupOverlay').classList.contains('failed') && dom(P, 'startupActions').hidden === false && dom(P, 'startupPlay').hidden === false, 'RETRY / PLAY ANYWAY are not offered'); ok(typeof dom(P, 'startupRetry').onclick === 'function' && typeof dom(P, 'startupReload').onclick === 'function', 'the buttons do nothing');
        same(dom(P, 'startupStage').textContent, 'THE GAME COULD NOT START', 'the headline'); ok(P.errors.some(e => /STARTUP FAILED at LOADING REQUIRED ASSETS/.test(e)), 'nothing in the console');
        same(P.run('_loopRunning'), false, 'clock'); same(P.raf.length, 0, 'frames scheduled'); ok(!dom(P, 'startupOverlay').classList.contains('off'), 'the screen went with the game not started');
    });
    await check('RETRY asks for the failed sheet again, and the start carries on from there: one world, one clock, the screen gone', async () => {
        const P = makePage(); P.load(); P.run('globalThis.__w = 0; { const f = facilityPlayStart; facilityPlayStart = function () { __w++; return f.apply(this, arguments); }; }'); P.init(); await settle();
        const w = P.wanted()[0], before = P.reqs.length; w.arrive(false); await settle(); same(P.state(), 'failed', 'state');
        dom(P, 'startupRetry').onclick(); ok(P.reqs.length === before + 1 && /[?&]r=2$/.test(P.reqs[P.reqs.length - 1]), 'the sheet was not asked for again: ' + P.reqs.slice(-1));
        for (let k = 0; k < 8 && P.state() !== 'done'; k++) { for (const x of P.wanted()) x.arrive(true); await settle(40); }
        same(P.state(), 'done', 'state'); same(P.sb.__w, 1, 'the facility was built again'); same(P.run('_perf.loops'), 1, 'clocks'); same(P.raf.length, 1, 'frames scheduled'); same(P.run('STARTUP.tries'), 2, 'tries'); ok(dom(P, 'startupOverlay').classList.contains('off'), 'the screen stayed');
    });
    await check('sheets that have not arrived in time are a failure too (after STARTUP_ASSET_MS), and PLAY ANYWAY goes on with the flat drawings: once', async () => {
        const P = await waiting(); const ms = P.run('STARTUP_ASSET_MS'); P.advance(ms - 1); await settle(); same(P.state(), 'running', 'just before the limit'); P.advance(2); await settle(40);
        same(P.state(), 'failed', 'state at the limit'); ok(/DID NOT ARRIVE IN/.test(dom(P, 'startupError').textContent), 'the screen does not say they did not arrive: ' + dom(P, 'startupError').textContent); same(P.run('_loopRunning'), false, 'clock');
        dom(P, 'startupPlay').onclick(); await settle(40); same(P.state(), 'done', 'state'); same(P.run('STARTUP.skipped'), true, 'skipped'); same(P.run('_perf.loops'), 1, 'clocks'); same(P.raf.length, 1, 'frames scheduled');
        same(P.run('startupPlayAnyway()'), false, 'a second PLAY ANYWAY'); same(P.run('startupRetry()'), false, 'RETRY after the start'); same(P.raf.length, 1, 'frames scheduled after');
    });
    await check('THE ASK: an error in building the world stops the start at PREPARING INITIAL GAME STATE; RETRY builds it again from a fresh state — the same followers, the same world, nothing doubled — and the saved game is untouched', async () => {
        const save = { v: 1, followers: [{ element: 'fire', personality: 'stoic', role: 'brawler', stats: { hp: 22, attack: 6, speed: 11, will: 20 } }, { element: 'electric' }] };
        const store = { conduit_fp_save: JSON.stringify(save) }, clean = makePage({ auto: true, store: { conduit_fp_save: JSON.stringify(save) } }); clean.load(); clean.init(); await settle();
        const shape = P => P.run('JSON.stringify([followers.length, actors.length, world.length, _fp.items.length, _fp.cells.size, Object.keys(followerByElement).map(k => followerByElement[k].length)])');
        const P = makePage({ auto: true, store }); P.load();
        P.run('globalThis.__boom = true; { const f = facilityTutorialStart; facilityTutorialStart = function () { if (__boom) { __boom = false; throw new Error("the tutorial could not begin"); } return f.apply(this, arguments); }; }');
        P.init(); await settle();
        same(P.state(), 'failed', 'state'); same(P.run('STARTUP.error.stage'), 'PREPARING INITIAL GAME STATE', 'stage'); ok(/the tutorial could not begin/.test(dom(P, 'startupError').textContent), 'the screen does not say why'); same(P.run('_loopRunning'), false, 'clock'); same(P.run('STARTUP.worldOk'), false, 'worldOk');
        same(P.run('followers.length') > 0, true, 'the half-built world had followers (the test is not testing a retry over a half-built world)'); same(dom(P, 'startupPlay').hidden, true, 'PLAY ANYWAY offered for an error that is not about sheets');
        same(store.conduit_fp_save, JSON.stringify(save), 'the saved game was written while the start had failed');
        dom(P, 'startupRetry').onclick(); await settle(40); for (let k = 0; k < 8 && P.state() !== 'done'; k++) { for (const x of P.wanted()) x.arrive(true); await settle(40); }
        same(P.state(), 'done', 'state after the retry'); same(shape(P), shape(clean), 'the world after a retry is not the world of a clean start'); same(P.run('followers.map(f => f.element).join()'), 'fire,electric', 'the saved followers'); same(P.run('_perf.loops'), 1, 'clocks'); same(P.raf.length, 1, 'frames scheduled');
        same(P.run('STARTUP.tries'), 2, 'tries');
    });
    await check('an error in the first picture stops the start at RENDERING INITIAL FRAME (the screen stays, no clock); the retry draws it and goes on', async () => {
        const P = makePage({ auto: true }); P.load(); P.run('globalThis.__boom = true; { const f = render; render = function () { if (__boom && STARTUP.collecting) { __boom = false; throw new Error("the picture could not be drawn"); } return f.apply(this, arguments); }; }');
        P.init(); await settle(); same(P.state(), 'failed', 'state'); same(P.run('STARTUP.error.stage'), 'RENDERING INITIAL FRAME', 'stage'); same(P.run('_loopRunning'), false, 'clock'); same(P.raf.length, 0, 'frames scheduled'); ok(!dom(P, 'startupOverlay').classList.contains('off'), 'the screen went');
        dom(P, 'startupRetry').onclick(); await settle(40); same(P.state(), 'done', 'state after the retry'); same(P.run('_perf.loops'), 1, 'clocks');
    });
    await check('a failure is never retried by itself: with the failed start left alone (and time passing) nothing runs again', async () => {
        const P = await waiting(); P.wanted()[0].arrive(false); await settle(); same(P.state(), 'failed', 'state'); const reqs = P.reqs.length, tries = P.run('STARTUP.tries'), timers = P.timers.length;
        P.advance(120000); await settle(40); same(P.state(), 'failed', 'state after two minutes'); same(P.reqs.length, reqs, 'sheets asked for again'); same(P.run('STARTUP.tries'), tries, 'tries'); same(P.raf.length, 0, 'frames scheduled'); ok(P.timers.length <= timers, 'a timer was left to retry');
        same(P.run('startupRetry()') && P.run('STARTUP.tries'), tries + 1, 'RETRY by hand does retry');
    });
    await check('a retry while the start is running (or after it has run) does nothing', async () => {
        const P = await waiting(); same(P.run('startupRetry()'), false, 'RETRY while running'); same(P.run('startupPlayAnyway()'), false, 'PLAY ANYWAY while running'); same(P.run('STARTUP.tries'), 1, 'tries');
    });

    // ───────────────────────────────────────────────────────
    group('THE CLOCK starts once, owes nothing for the time before it, and does not burst after a pause');
    await check('gameLoopStart clears the clock\'s history: however long the start screen was up, the first refresh owes one step', async () => {
        const P = makePage({ auto: true }); P.load(); P.init(); await settle();
        P.now += 60000; P.run('_simLast = 1; _simDebt = 900;'); P.run('clockReset()'); same(P.run('_simLast') + ',' + P.run('_simDebt'), '0,0', 'history'); const f0 = P.run('frame'); P.run('gameLoop()'); same(P.run('frame') - f0, 1, 'steps on the first refresh after a reset');
    });
    await check('the source: one place begins the loop, and it is not a second requestAnimationFrame (the loop has exactly one driver)', async () => {
        const g = rd('js/game.js'); same((g.match(/requestAnimationFrame\(/g) || []).length, 1, 'requestAnimationFrame calls in game.js'); ok(/function gameLoopStart\(\) \{\s*if \(_loopRunning\)/.test(g), 'gameLoopStart does not refuse a second start');
        const init = rd('js/init.js'); ok(/\bgameLoopStart\(\)/.test(init) && !/\bgameLoop\(\)/.test(init.replace(/gameLoopStart/g, '')), 'init.js starts the clock some other way'); same((init.match(/requestAnimationFrame|setInterval/g) || []).length, 0, 'init.js schedules frames or intervals of its own');
    });

    // ───────────────────────────────────────────────────────
    group('THE SHEETS the loaders start are listed with the start, and a picture that misses one says so');
    await check('each loader lists its image (props, the player and egg sheets, an evolved form and its ground layer); one asked for during the first pictures is wanted from the start, and a miss later marks it only while they are being drawn', async () => {
        const P = makePage().defs(); P.run('STARTUP.collecting = true;');
        P.run('_hdImg("player")'); P.run('_psImg("tank")'); P.run('_evoImg(EVOLUTIONS.thunderhead)'); P.run('_evoGroundImg({ id: "x", ground: "img/evo/x_ground.png" })');
        same(P.run('STARTUP.assets.length'), 4, 'sheets listed'); same(P.run('STARTUP.assets.filter(a => a.want).length'), 4, 'wanted when first asked for during the first pictures');
        same(P.run('STARTUP.assets.map(a => a.name).join()'), 'hd/player,props/tank,evo/thunderhead,evo/x-ground', 'names');
        P.run('STARTUP.collecting = false; STARTUP.assets.forEach(a => a.want = false);'); P.run('_psImg("tank"); _hdImg("player"); _evoImg(EVOLUTIONS.thunderhead);'); same(P.run('STARTUP.assets.filter(a => a.want).length'), 0, 'a miss counted when no first picture was being drawn');
        P.run('STARTUP.collecting = true;'); P.run('_psImg("tank"); _hdImg("player"); _evoImg(EVOLUTIONS.thunderhead);'); same(P.run('STARTUP.assets.filter(a => a.want).length'), 3, 'a miss during the first pictures was not counted');
        same(P.run('STARTUP.watching'), true, 'the start was not told there are sheets to watch'); same(P.run('_suPending().length'), 3, 'pending (the three the pictures missed)');
        P.imgs.forEach(i => i.arrive(true)); same(P.run('STARTUP.assets.every(a => a.state === "ok")'), true, 'arrivals are noted'); ok(P.run('STARTUP.assets.every(a => a.ms >= 0)'), 'arrival times'); same(P.run('_suPending().length'), 0, 'pending after');
        P.run('_hdImg("player"); _psImg("tank");'); same(P.run('STARTUP.assets.length'), 4, 'a sheet that is in was listed again');
    });
    await check('a sheet that was already complete when it was asked for is in, and one that errors is failed (neither waits on an event that will not come)', async () => {
        const P = makePage().defs(); const mk = (c, w) => { const im = new P.sb.HTMLImageElement(); im.complete = c; im.naturalWidth = w; return im; };
        P.sb.__a = mk(true, 50); P.sb.__b = mk(true, 0); P.run('startupAsset(__a, "a"); startupAsset(__b, "b");');
        same(P.run('STARTUP.by.get(__a).state'), 'ok', 'complete with a width'); same(P.run('STARTUP.by.get(__b).state'), 'failed', 'complete with none');
        same(P.run('startupAsset(__a, "again"); STARTUP.assets.length'), 2, 'listed twice');
    });
    await check('the getters\' hit path is the same single test it was (a sheet that is in is returned without a call to the start)', async () => {
        for (const [f, re] of [['js/propsprites.js', /function _psImg\(fam\) \{\s*if \(_psImgs\[fam\] !== undefined\) \{ const e = _psImgs\[fam\]; if \(e && e\.complete && e\.naturalWidth\) return e; if \(e && typeof startupWant === "function"\) startupWant\(e\); return null; \}/],
                               ['js/hdsprites.js', /function _hdImg\(key\) \{\s*if \(_hdImgs\[key\] !== undefined\) \{ const e = _hdImgs\[key\]; if \(e && e\.complete && e\.naturalWidth\) return e; if \(e && typeof startupWant === "function"\) startupWant\(e\); return null; \}/],
                               ['js/evolution.js', /function _evoImg\(d\) \{\s*if \(d\._img !== undefined\) \{ const e = d\._img; if \(e && e\.complete && e\.naturalWidth\) return e; if \(e && typeof startupWant === "function"\) startupWant\(e\); return null; \}/]])
            ok(re.test(rd(f)), f + ': the getter changed shape');
        for (const f of ['js/propsprites.js', 'js/hdsprites.js', 'js/evolution.js']) ok(/typeof startupAsset === "function"\) startupAsset\(im, /.test(rd(f)), f + ' does not list its images with the start');
    });

    // ───────────────────────────────────────────────────────
    group('A PAUSE: a hidden tab or a sleeping iPad does not come back as a burst of steps');
    await check('a refresh after ten minutes away is one step, not a fast-forward, and the next ones are back to one a refresh', async () => {
        const P = makePage({ auto: true }); P.load(); P.init(); await settle(); P.run('gameState.running = true;');
        const tick = ms => { P.now += ms; const f0 = P.run('frame'); P.run('gameLoop()'); return P.run('frame') - f0; };
        tick(1000 / 60); tick(1000 / 60); same(tick(1000 / 60), 1, 'a normal refresh'); same(tick(600000), 1, 'steps on the refresh after ten minutes'); same(tick(1000 / 60), 1, 'the next refresh'); same(tick(1000 / 60), 1, 'and the next');
        ok(tick(900) <= P.run('SIM_MAX_STEPS'), 'a refresh after 0.9 s runs more than SIM_MAX_STEPS'); same(tick(1001), 1, 'just over a second away');
    });

    // ───────────────────────────────────────────────────────
    group('THE READOUT (Settings → PERFORMANCE) keeps the start\'s numbers, and costs nothing while it is off');
    await check('frames are not recorded while the readout is off; on, the last 120 gaps give p50 / p95 / p99 / worst, once a second, and the readout draws the start\'s lines', async () => {
        const P = makePage({ auto: true }); P.load(); P.init(); await settle(); P.run('gameState.running = true;');
        const tick = ms => { P.now += ms; P.run('gameLoop()'); };
        for (let i = 0; i < 40; i++) tick(1000 / 60); same(P.run('_perf.gaps'), null, 'gaps were recorded with the readout off');
        P.run('perfReadout = true;'); for (let i = 0; i < 150; i++) tick(i % 10 === 9 ? 50 : 1000 / 60);
        const pc = P.run('JSON.stringify(_perfPct())'); const o = JSON.parse(pc); ok(o && o.n === 120 && o.p50 > 15 && o.p50 < 18 && o.p95 >= o.p50 && o.max >= 49, 'percentiles: ' + pc);
        const said = []; P.run('ctx = new Proxy({}, { get: (t, k) => k === "canvas" ? canvas : (k === "fillText" ? (s) => __said.push(s) : () => {}), set: (t, k, v) => { t[k] = v; return true; } });', 'x'.padEnd(0)); // (a context that records the words)
        P.sb.__said = said; P.run('drawPerfReadout()'); const text = said.join('\n'); ok(/START\b/.test(text) && /GAPS/.test(text) && /SHEETS/.test(text), 'the readout has no start lines: ' + text);
        P.run('perfReadout = false;');
    });

    // ───────────────────────────────────────────────────────
    group('THE PAGE (game.html): the start screen is in it from the first byte, plain DOM, and cheap');
    await check('the screen comes before the canvas and every game script; it holds no canvas; it says its progress in words (role=status), with one segment for each stage', async () => {
        const h = rd('game.html'), at = h.indexOf('id="startupOverlay"'), end = h.indexOf('<!-- HUD -->');
        ok(at > h.indexOf('<body>') && at < end, 'the screen is not the first thing in the body'); ok(at < h.indexOf('<canvas id="cavernCanvas">') && at < h.indexOf('<script src="js/config.js'), 'the screen comes after the canvas or the scripts');
        const box = h.slice(at, h.indexOf('<!-- HUD -->')); ok(!/<canvas/i.test(box), 'the screen draws on a canvas'); ok(/role="status"/.test(h.slice(at - 5, at + 80)), 'no role=status');
        const P = makePage().boot(); same((box.match(/<i><\/i>/g) || []).length, P.run('STARTUP_STAGES.length'), 'segments and stages');
        for (const id of ['startupStage', 'startupDetail', 'startupSteps', 'startupError', 'startupActions', 'startupRetry', 'startupPlay', 'startupReload']) ok(box.includes('id="' + id + '"'), id + ' is missing');
    });
    await check('its one animation moves only the opacity (no layout, no canvas), it is hidden for the website\'s background, and it sits under the crash panels and over every game panel', async () => {
        const h = rd('game.html'), css = h.slice(h.indexOf('THE START SCREEN'), h.indexOf('</style>', h.indexOf('THE START SCREEN')));
        const kf = [...css.matchAll(/@keyframes [\w-]+ \{([^@]*?\}\s*)\}/g)].map(m => m[1]); ok(kf.length >= 1, 'no animation found'); for (const k of kf) ok(!/\b(width|height|top|left|right|bottom|margin|padding|transform)\s*:/.test(k), 'an animation moves layout: ' + k.trim().slice(0, 60));
        ok(/html\.attract #startupOverlay \{ display: none; \}/.test(css), 'the website\'s background shows the start screen');
        const z = +(css.match(/#startupOverlay \{[^}]*z-index: (\d+)/) || [])[1]; ok(z > 10000 && z < 99999, 'z-index ' + z + ' (the game\'s panels reach 10000, the crash panels are 99999)');
        ok(/prefers-reduced-motion/.test(css), 'no reduced-motion rule');
    });
    await check('THE ASK: the props sheets begin downloading with the page — one preload for each family the page loads at start, at the same address the loader uses (the build stamp included), each a file that exists, and nothing else (the website\'s background draws no player)', async () => {
        const h = rd('game.html'), links = [...h.matchAll(/<link rel="preload" as="image" href="([^"]+)">/g)].map(m => m[1]);
        const stamp = (h.match(/window\.__PAGE_BUILD = "([^"]+)"/) || [])[1]; for (const l of links) { ok(l.endsWith('?v=' + stamp), l + ' has no build stamp ' + stamp); ok(fs.existsSync(path.join(ROOT, l.replace(/\?.*/, ''))), l + ' is not a file'); ok(/^img\/props\/\w+\.png\?/.test(l), l + ' is not a props sheet'); }
        const P = makePage(); P.load(); const fams = P.run('Object.keys(PROP_ATLAS)'); for (const f of fams) ok(links.includes('img/props/' + f + '.png?v=' + stamp), 'no preload for the props sheet ' + f); same(links.length, fams.length, 'preloads and families'); same(new Set(links).size, links.length, 'a sheet preloaded twice');
        ok(h.indexOf('rel="preload"') < h.indexOf('<style>'), 'the preloads come after the styles: they would start late');
        // the address is the loader's: img/props/<family>.png + ?v= + BUILD_VERSION (js/propsprites.js _psImg)
        ok(/im\.src = "img\/props\/" \+ fam \+ "\.png" \+ \(typeof BUILD_VERSION !== "undefined" \? "\?v=" \+ BUILD_VERSION : ""\);/.test(rd('js/propsprites.js')), 'the loader asks for another address');
    });
    await check('the screen\'s words for the stages are the ones the start runs, in order', async () => {
        const P = makePage().boot(); same(P.run('STARTUP_STAGES.join()'), 'INITIALIZING,PREPARING INITIAL GAME STATE,VALIDATING REQUIRED SYSTEMS,RENDERING INITIAL FRAME,LOADING REQUIRED ASSETS,STARTING GAMEPLAY', 'stages');
        same(P.run('_SU_STEPS.length'), P.run('STARTUP_STAGES.length'), 'a stage without a step');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
