// ─────────────────────────────────────────────────────────
//  THE SLIDER TOOLBOX — the bottom dock you slide sideways through (tablet and desktop)
// ─────────────────────────────────────────────────────────
// REPORTED: "I meant you could slide through the different items horizontally." The bottom dock (game.html #topToggles) is a strip of tools:
// SEL, BUILD, AUTO | ROSTER, COMMAND, SQUAD | CLONES, SHOP, SETTINGS | ?  There are more than fit, so the strip SLIDES:
//   - swipe it on a touch screen (native scrolling, snapping to the items),
//   - drag it with a mouse (click-and-drag; a drag never fires the button under it),
//   - roll the mouse wheel over it (a vertical wheel slides it sideways),
//   - or press the arrows at its ends. Where more is hidden an edge fades and an arrow shows.
// The buttons that open the game's older canvas panels (Crystal, Clones, Shop, Settings; the modules are a tab of the BUILD window, not a button of their own) are here too, so every menu is in one place.
// Phones use the radial menu instead (this is for widths above 700px).
const TOOLBOX_DRAG = 6;           // pixels of mouse travel before a press is a drag, not a click
const TOOLBOX_STEP = 0.7;         // an arrow slides this share of the visible width

// ── the buttons for the game's canvas panels (each is what the canvas button does) ──
function dockClones()    { cloneMenuOpen = !cloneMenuOpen; if (cloneMenuOpen) crystalMenuOpen = false; }
function dockSettings()  { settingsPanelOpen = !settingsPanelOpen; settingsResetConfirm = false; }
function dockShop() {
    // The same conditions as the canvas SHOP button (input.js): not mid-alarm, not between waves.
    if (alertActive || gameState.phase === "night" || gameState.phase === "waveComplete" || gameState.phase === "gameOver") {
        if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 70, text: "THE SHOP IS CLOSED RIGHT NOW", color: "#f88", life: 90, vy: -0.2, size: 12 });
        return false;
    }
    openMidGameShop(); return true;
}

// ── the slider ──
function toolboxEls() { return typeof document === "undefined" ? {} : { bar: document.getElementById("topToggles"), track: document.getElementById("dockScroll"), prev: document.getElementById("dockPrev"), next: document.getElementById("dockNext") }; }
// How far the strip can slide each way (0 = nowhere).
function toolboxRoom() {
    const t = toolboxEls().track; if (!t) return { left: 0, right: 0 };
    return { left: Math.max(0, Math.round(t.scrollLeft)), right: Math.max(0, Math.round(t.scrollWidth - t.clientWidth - t.scrollLeft)) };
}
// Edge fades and arrows follow how much is hidden on each side.
function toolboxSync() {
    const E = toolboxEls(); if (!E.bar || !E.bar.classList) return;
    const r = toolboxRoom();
    E.bar.classList.toggle("fade-l", r.left > 2); E.bar.classList.toggle("fade-r", r.right > 2); E.bar.classList.toggle("slides", r.left > 2 || r.right > 2 || (E.track.scrollWidth > E.track.clientWidth + 2));
}
function toolboxSlide(dir) {
    const t = toolboxEls().track; if (!t) return;
    const by = Math.max(120, Math.round(t.clientWidth * TOOLBOX_STEP)) * (dir < 0 ? -1 : 1);
    if (t.scrollBy) { try { t.scrollBy({ left: by, behavior: "smooth" }); } catch (e) { t.scrollLeft += by; } } else t.scrollLeft += by;
}
// Bring one button into view.
function toolboxReveal(btn) {
    const t = toolboxEls().track; if (!t || !btn) return false;
    const tr = t.getBoundingClientRect(), br = btn.getBoundingClientRect();
    if (br.left >= tr.left && br.right <= tr.right) return false;
    t.scrollLeft += (br.left + br.right) / 2 - (tr.left + tr.right) / 2; toolboxSync(); return true;
}
function toolboxTick() {
    if (typeof mixToolTick === "function") mixToolTick();   // the mix selector (js/mixtool.js)
    toolboxSync();
}

function initToolbox() {
    if (typeof document === "undefined" || !document.getElementById) return;
    const E = toolboxEls(); if (!E.track || E.track._slider) return; E.track._slider = true;
    // mouse drag: slide the strip; a real drag swallows the click that follows it
    let x0 = null, s0 = 0, dragged = false;
    E.track.addEventListener("pointerdown", e => { if (e.pointerType === "touch") return; x0 = e.clientX; s0 = E.track.scrollLeft; dragged = false; });
    E.track.addEventListener("pointermove", e => {
        if (x0 === null || e.pointerType === "touch") return;
        const dx = e.clientX - x0;
        if (!dragged && Math.abs(dx) >= TOOLBOX_DRAG) { dragged = true; E.track.classList.add("dragging"); try { E.track.setPointerCapture(e.pointerId); } catch (x) {} }
        if (dragged) { E.track.scrollLeft = s0 - dx; toolboxSync(); }
    });
    const end = () => { if (x0 !== null) { x0 = null; E.track.classList.remove("dragging"); } };
    E.track.addEventListener("pointerup", end); E.track.addEventListener("pointercancel", end); E.track.addEventListener("pointerleave", () => { if (!dragged) x0 = null; });
    E.track.addEventListener("click", e => { if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; } }, true);
    // the wheel: a vertical roll slides it sideways (only while it has somewhere to go that way)
    E.track.addEventListener("wheel", e => {
        const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY, r = toolboxRoom();
        if (!d || (d < 0 && !r.left) || (d > 0 && !r.right)) return;
        e.preventDefault(); E.track.scrollLeft += d; toolboxSync();
    }, { passive: false });
    E.track.addEventListener("scroll", () => toolboxSync(), { passive: true });
    if (E.prev) E.prev.addEventListener("click", ev => { ev.stopPropagation(); toolboxSlide(-1); });
    if (E.next) E.next.addEventListener("click", ev => { ev.stopPropagation(); toolboxSlide(1); });
    window.addEventListener("resize", toolboxSync);
    toolboxSync(); [200, 800, 2000].forEach(ms => setTimeout(toolboxSync, ms));
}
try { initToolbox(); } catch (e) { /* no page (the test sandbox) */ }
