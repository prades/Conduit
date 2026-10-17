// ─────────────────────────────────────────────────────────
//  THE SLIDING TOOLBOX — the bottom dock as a drawer (tablet and desktop)
// ─────────────────────────────────────────────────────────
// REPORTED: "make it a slider toolbox." The bottom dock (SEL / BUILD / AUTO / ROSTER / COMMAND / SQUAD / ?) now SLIDES: a small TOOLS handle sits on
// the bottom edge; tap it, or drag it up, and the toolbox slides up; tap the handle again, or swipe the toolbox down, and it slides away, leaving the
// whole screen to the game. It remembers how you left it. It is held open while the tutorial is asking for one of its buttons. (Phones have the radial
// menu instead: this is for widths above 700px.)
const TOOLBOX_KEY = "tubecrawler_toolbox";
const TOOLBOX_SWIPE = 28;      // pixels of drag that count as a slide
let toolboxOpen = true;

function toolboxSet(open, remember) {
    toolboxOpen = !!open;
    if (typeof document !== "undefined" && document.body && document.body.classList) document.body.classList.toggle("tb-closed", !toolboxOpen);
    const h = typeof document !== "undefined" ? document.getElementById("toolboxHandle") : null;
    if (h) { h.setAttribute("aria-expanded", toolboxOpen ? "true" : "false"); const l = h.querySelector(".tb-label"); if (l) l.textContent = toolboxOpen ? "▼ TOOLS" : "▲ TOOLS"; }
    if (remember !== false) { try { localStorage.setItem(TOOLBOX_KEY, toolboxOpen ? "open" : "closed"); } catch (e) {} }
    return toolboxOpen;
}
function toolboxToggle() { return toolboxSet(!toolboxOpen); }
// The tutorial points at BUILD / SEL with a pulse: it cannot be hidden then.
function toolboxHeldOpen() {
    if (typeof tutorialMode !== "undefined" && tutorialMode) return true;
    return typeof document !== "undefined" && !!document.querySelector && !!document.querySelector("#topToggles .top-btn.tut-wanted");
}
function toolboxTick() { if (!toolboxOpen && toolboxHeldOpen()) toolboxSet(true, false); }

function initToolbox() {
    if (typeof document === "undefined" || !document.getElementById) return;
    const dock = document.getElementById("topToggles"); if (!dock || document.getElementById("toolboxHandle")) return;
    const h = document.createElement("button"); h.id = "toolboxHandle"; h.setAttribute("aria-controls", "topToggles");
    const grip = document.createElement("span"); grip.className = "tb-grip"; h.appendChild(grip);
    const lab = document.createElement("span"); lab.className = "tb-label"; lab.textContent = "▼ TOOLS"; h.appendChild(lab);
    dock.appendChild(h);
    // tap = toggle; drag up = open; drag down = close
    let y0 = null, moved = false;
    h.addEventListener("pointerdown", e => { y0 = e.clientY; moved = false; try { h.setPointerCapture(e.pointerId); } catch (x) {} });
    h.addEventListener("pointermove", e => { if (y0 === null) return; const dy = e.clientY - y0; if (Math.abs(dy) >= TOOLBOX_SWIPE) { moved = true; toolboxSet(dy < 0); y0 = e.clientY; } });
    h.addEventListener("pointerup", () => { if (y0 !== null && !moved) toolboxToggle(); y0 = null; });
    h.addEventListener("pointercancel", () => { y0 = null; });
    // a swipe down on the toolbox itself slides it away
    let sy = null;
    dock.addEventListener("pointerdown", e => { if (e.target === h || h.contains(e.target)) return; sy = e.clientY; });
    dock.addEventListener("pointermove", e => { if (sy !== null && e.clientY - sy >= TOOLBOX_SWIPE * 1.5) { sy = null; toolboxSet(false); } });
    dock.addEventListener("pointerup", () => { sy = null; });
    let saved = null; try { saved = localStorage.getItem(TOOLBOX_KEY); } catch (e) {}
    toolboxSet(saved !== "closed", false);
    setInterval(toolboxTick, 400);
}
try { initToolbox(); } catch (e) { /* no page (the test sandbox) */ }
