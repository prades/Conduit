// ─────────────────────────────────────────────────────────
//  THE START: the page's one entry point (docs/STARTUP.md)
// ─────────────────────────────────────────────────────────
// REPORTED (an iPad): the game sometimes started at about 20 frames a second, and a refresh often fixed it. What was measured (headless Chromium over a server that behaves like GitHub Pages: that is not an
// iPad, and what happens on one is not proved): the page used to start the clock at once, drawing flat sprites for the sheets that had not arrived, and then paid for each sheet in the middle of play, in one
// frame. The first picture after the sheets came in cut 460 small canvases and read their pixels back (3 slow getImageData calls); the first frame ran 170 to 230 ms; a returning player's evolved forms
// (0.8 to 2.7 MB a sheet) made it worse (a 93 ms frame). And the sheets were not even asked for until the first picture had been drawn: the browser sends no request until the script that made it yields.
//
// Now the page puts a plain start screen up at once (game.html #startupOverlay: DOM, no canvas) and starts the sheets downloading with the page (the <link rel="preload"> tags in its head). This file builds
// the world as it always did, draws the first picture (flat where a sheet is missing: that picture is how the scene says which sheets it wants), waits for exactly those, draws a picture with them in (that is
// where the slices and their canvases are cut), and only then starts the clock (js/game.js gameLoopStart) and lifts the screen. Nothing the player does reaches the game before that: _suBlock stops it at the window.
//
// The stages, in the order they run (the screen names the one under way, and a segment of it lights as each is done):
//   INITIALIZING                  the page is checked and the guard against input goes up
//   PREPARING INITIAL GAME STATE  the facility is built and the saved game put back (js/facilityplay.js); synchronous, as it always was: scripts that come after this one can count on it
//   VALIDATING REQUIRED SYSTEMS   what the first picture needs is there
//   RENDERING INITIAL FRAME       the first picture
//   LOADING REQUIRED ASSETS       the sheets that picture wanted and did not have (not the ones the page loads for later: those are optional and never waited for); then the pictures that put them in
//   STARTING GAMEPLAY             the clock, once; the screen goes
// (The brief's order puts the assets first. The scene is what says which sheets the first picture wants, and a saved game's evolved forms differ from one player to the next, so the world comes first.)
// A stage that throws stops the sequence: the screen says which stage and why (the console has the error too), with RETRY (the same stage again), RELOAD and, when it was only sheets that did not arrive, PLAY
// ANYWAY (every sprite has a flat drawing to fall back on). Nothing retries by itself. In the test sandbox there are no real images, so there is nothing to wait for and the whole sequence has run before
// this file ends, as the page did before.
let health = PLAYER_HITS;

const STARTUP_STAGES = ["INITIALIZING", "PREPARING INITIAL GAME STATE", "VALIDATING REQUIRED SYSTEMS", "RENDERING INITIAL FRAME", "LOADING REQUIRED ASSETS", "STARTING GAMEPLAY"];
const STARTUP_ASSET_MS = 15000;   // the sheets the first picture wanted get this long to arrive before the start says they have not
const STARTUP_ROUNDS = 3;         // at most this many pictures to find the wanted sheets (a form's ground layer is only asked for once its body has been drawn)
const STARTUP_WARM = 1;           // pictures drawn after the last sheet is in, before the clock: measured, with the picture that follows the wait that makes two, and the canvases cut during play went from 463 to 4 (docs/STARTUP.md)
const STARTUP = { state: "idle", stage: -1, tries: 0, worldOk: false, t: [], ms: [], ready: 0, pictures: 0, watching: false, collecting: false, skipped: false, guard: false, wired: false, wake: null, error: null, assets: [], by: new Map() };

// ── the sheets: every image the loaders start (js/propsprites.js, js/hdsprites.js, js/evolution.js) is listed here, with when it arrived or failed ──
function startupAsset(im, name) {
    if (typeof HTMLImageElement === "undefined" || !(im instanceof HTMLImageElement) || STARTUP.by.has(im)) return;   // (the test sandbox has no real images: nothing to wait for)
    const a = { im, name, state: "loading", at: _perfNow(), ms: 0, want: STARTUP.collecting };   // (a sheet first asked for by one of the first pictures is wanted from the start; the page's own preload is not a picture)
    STARTUP.assets.push(a); STARTUP.by.set(im, a); STARTUP.watching = true;
    const set = ok => { if (a.state !== "loading") return; a.state = ok ? "ok" : "failed"; a.ms = Math.round(_perfNow() - a.at); _suChanged(); };
    if (im.complete) { set(im.naturalWidth > 0); return; }
    im.addEventListener("load", () => set(true)); im.addEventListener("error", () => set(false));
}
// a picture asked for a sheet that is not in yet (the loaders call this on a miss; it counts only while the first pictures are being drawn)
function startupWant(im) { if (!STARTUP.collecting) return; const a = STARTUP.by.get(im); if (a) a.want = true; }
function _suPending() { return STARTUP.assets.filter(a => a.want && a.state !== "ok"); }
function _suChanged() { if (STARTUP.wake) STARTUP.wake(); _suPaint(); }
function _suFile(a) { return String(a.im.src || a.name).replace(/^.*\/(img\/)/, "$1").replace(/\?.*$/, ""); }

// ── the screen (game.html #startupOverlay) ──
function _suEl(id) { return typeof document !== "undefined" && document.getElementById ? document.getElementById(id) : null; }
function _suPaint() {
    const o = _suEl("startupOverlay"); if (!o) return;
    const text = (id, t) => { const e = _suEl(id); if (e && e.textContent !== t) e.textContent = t; }, hide = (id, h) => { const e = _suEl(id); if (e) e.hidden = h; };
    const failed = STARTUP.state === "failed", i = Math.max(0, STARTUP.stage), want = STARTUP.assets.filter(a => a.want);
    text("startupStage", failed ? "THE GAME COULD NOT START" : STARTUP_STAGES[i]);
    text("startupDetail", failed ? "AT " + STARTUP.error.stage : (i === 4 && want.length ? "SHEETS " + want.filter(a => a.state === "ok").length + " / " + want.length : ""));
    text("startupError", failed ? STARTUP.error.message : ""); hide("startupError", !failed); hide("startupActions", !failed); hide("startupPlay", !(failed && STARTUP.error.assets));
    if (o.classList) o.classList[failed ? "add" : "remove"]("failed");
    const seg = _suEl("startupSteps"); if (seg && seg.children) for (let k = 0; k < seg.children.length; k++) seg.children[k].className = failed && k === i ? "bad" : k < i ? "done" : k === i ? "now" : "";
}
function _suWire() {
    if (STARTUP.wired) return; STARTUP.wired = true;
    const on = (id, fn) => { const b = _suEl(id); if (b) b.onclick = fn; };
    on("startupRetry", startupRetry); on("startupPlay", startupPlayAnyway); on("startupReload", () => location.reload());
}
function _suOverlayOff() {
    const o = _suEl("startupOverlay"); if (!o) return;
    if (o.classList) o.classList.add("off");   // (it fades, and takes no touches from the first moment)
    setTimeout(() => { if (o.parentNode) o.parentNode.removeChild(o); }, 400);
}

// ── nothing the player does reaches the game until it has started ──
// One listener for each kind of event, on the window, in the capture phase: it runs before every handler the game has (the canvas's, the window's key handlers, the panels'). The screen's own buttons are let through.
const _SU_BLOCK = ["pointerdown", "pointermove", "pointerup", "pointercancel", "mousedown", "mousemove", "mouseup", "touchstart", "touchmove", "touchend", "touchcancel", "click", "dblclick", "contextmenu", "wheel", "keydown", "keyup"];
function _suBlock(e) {
    if (STARTUP.state === "done") return;
    const t = e.target; if (t && t.closest && t.closest("#startupOverlay")) return;
    e.stopImmediatePropagation();
    if (e.cancelable && e.type.indexOf("key") !== 0) e.preventDefault();   // (a key keeps its browser meaning: reload, switching tabs)
}
function _suGuard(on) {
    if (on === STARTUP.guard || typeof window === "undefined" || !window.addEventListener) return;
    STARTUP.guard = on;
    for (const k of _SU_BLOCK) window[on ? "addEventListener" : "removeEventListener"](k, _suBlock, { capture: true, passive: false });
}

// ── the stages ──
function _suInit() {
    if (!canvas || !ctx) throw new Error("the page has no drawing surface");
    _suGuard(true);
}
function _suWorld() {
    if (facilityPlay && !STARTUP.worldOk) facilityPlay = false;   // an earlier try stopped half way through building the world: build it again (facilityPlayStart begins from a fresh state)
    if (typeof preloadIcons === "function") preloadIcons();
    if (typeof renderCloneCostIndex === "function") renderCloneCostIndex();
    facilityPlayStart();
    STARTUP.worldOk = true;
}
function _suValidate() {
    const bad = [];
    if (!facilityPlay || !_fp || !_fp.items || !_fp.items.length) bad.push("the facility is not built");
    if (typeof player === "undefined" || !player || typeof crystal === "undefined" || !crystal) bad.push("no player or crystal");
    if (typeof render !== "function" || typeof gameLoopStart !== "function") bad.push("the game loop is missing");
    if (!(canvas.width > 0 && canvas.height > 0)) bad.push("the canvas has no size");
    if (bad.length) throw new Error(bad.join("; "));
}
function _suFirstPicture() {
    if (!STARTUP.watching) return;   // (no sheets to wait for: the clock's own first picture is the first)
    STARTUP.collecting = true;
    render(); STARTUP.pictures++;
}
function _suAssets() {
    if (!STARTUP.watching) return null;
    const round = n => {
        const need = STARTUP.skipped ? [] : _suPending();
        if (!need.length) return null;
        _suPaint();
        return _suWait(need).then(late => {
            const bad = need.filter(a => a.state === "failed" || (late && a.state === "loading"));   // (the ones that failed; and, only if the time ran out, the ones still on their way)
            if (bad.length) { const e = new Error(bad.map(a => (a.state === "failed" ? "DID NOT LOAD: " : "DID NOT ARRIVE IN " + STARTUP_ASSET_MS / 1000 + " s: ") + _suFile(a)).join("\n")); e.assets = bad; throw e; }
            render(); STARTUP.pictures++;   // a picture with them in (it cuts the slices); it may want more
            return n + 1 < STARTUP_ROUNDS ? round(n + 1) : null;
        });
    };
    const r = round(0);
    return r ? r.then(_suSettle) : _suSettle();
}
function _suSettle() {
    STARTUP.collecting = false;
    if (typeof checkVisibleArea === "function") checkVisibleArea();   // (the visible area is measured again: the canvas is the size it will have)
    for (let i = 0; i < STARTUP_WARM; i++) { render(); STARTUP.pictures++; }
}
function _suWait(list) {
    return new Promise(resolve => {
        const finish = late => { clearTimeout(timer); STARTUP.wake = null; resolve(late); };   // (late: the time ran out)
        const timer = setTimeout(() => finish(true), STARTUP_ASSET_MS);
        STARTUP.wake = () => { if (list.some(a => a.state === "failed") || !list.some(a => a.state === "loading")) finish(false); };   // (a sheet that failed ends the wait at once: the error is known, and waiting out the rest would leave the count on the screen for seconds)
        STARTUP.wake();
    });
}
function _suGo() { gameLoopStart(); }
const _SU_STEPS = [_suInit, _suWorld, _suValidate, _suFirstPicture, _suAssets, _suGo];

// ── the sequence ──
function startupBegin() {
    if (STARTUP.state === "running" || STARTUP.state === "done") return STARTUP;   // once: asked again while it runs, or after it has run, it does nothing
    STARTUP.state = "running"; STARTUP.tries++; STARTUP.error = null;
    _suWire(); _suRun(Math.max(0, STARTUP.stage));   // (a try after a failure goes on from the stage that failed)
    return STARTUP;
}
function _suRun(from) {
    for (let i = from; i < STARTUP_STAGES.length; i++) {
        const t0 = _perfNow(), took = () => { STARTUP.ms[i] = Math.round((_perfNow() - t0) * 10) / 10; };
        STARTUP.stage = i; STARTUP.t[i] = Math.round(t0); _suPaint();
        let r;
        try { r = _SU_STEPS[i](); } catch (e) { _suFail(i, e); return; }
        if (r && typeof r.then === "function") { r.then(() => { took(); _suRun(i + 1); }, e => _suFail(i, e)); return; }
        took();
    }
    STARTUP.state = "done"; STARTUP.ready = Math.round(_perfNow()); STARTUP.collecting = false;
    _suGuard(false); _suOverlayOff();
}
function _suFail(i, e) {
    STARTUP.state = "failed"; STARTUP.stage = i; STARTUP.collecting = false;
    STARTUP.error = { stage: STARTUP_STAGES[i], message: String(e && e.message || e), stack: e && e.stack ? String(e.stack) : "", assets: e && e.assets || null };
    console.error("STARTUP FAILED at " + STARTUP_STAGES[i] + ":", e);
    _suPaint();
}
// RETRY: the stage that failed, again (a sheet that did not load is asked for again, under an address of its own so the browser does not answer from the failure)
function startupRetry() {
    if (STARTUP.state !== "failed") return false;
    for (const a of STARTUP.assets) if (a.want && a.state === "failed") { a.state = "loading"; a.at = _perfNow(); a.im.src = a.im.src.replace(/[?&]r=\d+$/, "") + (a.im.src.indexOf("?") < 0 ? "?" : "&") + "r=" + (STARTUP.tries + 1); }
    startupBegin(); return true;
}
// PLAY ANYWAY (offered only when sheets did not arrive): on with the flat drawings
function startupPlayAnyway() {
    if (STARTUP.state !== "failed" || !STARTUP.error || !STARTUP.error.assets) return false;
    STARTUP.skipped = true; startupBegin(); return true;
}
// the start's lines in the PERFORMANCE readout (js/game.js drawPerfReadout)
function startupLines() {
    const S = STARTUP, all = S.assets, want = all.filter(a => a.want), later = all.filter(a => !a.want), ok = l => l.filter(a => a.state === "ok").length, bad = all.filter(a => a.state === "failed").length;
    return [
        "START " + (S.ready ? S.ready + " ms" : S.state.toUpperCase()) + "   clock " + _perf.loops + (_perf.denied ? " +" + _perf.denied + " refused" : "") + "   pictures " + S.pictures + (S.tries > 1 ? "   tries " + S.tries : ""),
        "stages " + (S.ms.length ? S.ms.map(m => Math.round(m)).join(" / ") + " ms" : "-"),
        "SHEETS " + (all.length ? "wanted " + ok(want) + "/" + want.length + "  later " + ok(later) + "/" + later.length + (bad ? "  FAILED " + bad : "") : "-"),
    ];
}

startupBegin();
