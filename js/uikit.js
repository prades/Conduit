// ─────────────────────────────────────────────────────────
//  THE UI KIT — slabs and big italic type for the canvas panels (docs/UI-STYLE.md)
// ─────────────────────────────────────────────────────────
// REPORTED: "make the other menus as clean." The HUD, the dock and the Command Center are slanted slabs with big italic type; Settings, Build,
// Crystal and the Clone Bay were still small monospace on grey boxes. These helpers are what those panels are now drawn with, so they match.
// Everything draws in screen pixels (the caller has set the identity transform) and nothing here uses shadowBlur (a rule of this game: the glow is
// a second, wider, fainter outline).
//
// A slab is a parallelogram that stays inside its rectangle, so a panel's hit test is still the plain rectangle it always was.
const UI_FONT = '"DejaVu Sans","Segoe UI",system-ui,sans-serif';
const UI_TEAL = "#19e6c1", UI_GOLD = "#ffe733", UI_VIOLET = "#a64dff", UI_ICE = "#8fe3ff", UI_RED = "#ff4a1c", UI_INK = "#05070f";

function uiFont(px)  { return "italic 900 " + Math.round(px) + "px " + UI_FONT; }
function uiMono(px)  { return "bold " + Math.round(px) + "px monospace"; }
// A bigger tap target on a touch screen, the same on a desktop: sizes the panels use are multiplied by this.
function uiScale() { return typeof canvas !== "undefined" && canvas.width < 600 ? 1.0 : 1.15; }

function uiSlabPath(x, y, w, h) {
    const s = Math.min(10, h * 0.2);
    ctx.beginPath(); ctx.moveTo(x + s, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - s, y + h); ctx.lineTo(x, y + h); ctx.closePath();
}
// col: the outline colour. on: filled with the colour (the active state). fill: the idle fill. dim: a disabled look.
function uiSlab(x, y, w, h, col, on, fill, dim) {
    col = col || UI_TEAL;
    ctx.save();
    if (dim) ctx.globalAlpha = 0.4;
    uiSlabPath(x, y, w, h);
    if (on) { ctx.fillStyle = col; ctx.fill(); }
    else { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, fill || "#121a34"); g.addColorStop(1, "#080c1a"); ctx.fillStyle = g; ctx.fill(); }
    if (!dim) { ctx.lineWidth = 7; ctx.globalAlpha = on ? 0.2 : 0.14; ctx.strokeStyle = col; ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.lineWidth = 2.5; ctx.strokeStyle = col; ctx.stroke();
    ctx.restore();
}
// The big panel: a tall slab with a dark wash, a glowing outline and an optional italic title.
function uiPanel(x, y, w, h, col, title, titleSize) {
    col = col || UI_TEAL;
    ctx.save();
    const s = Math.min(18, h * 0.05);
    ctx.beginPath(); ctx.moveTo(x + s, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - s, y + h); ctx.lineTo(x, y + h); ctx.closePath();
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, "rgba(15,23,48,0.97)"); g.addColorStop(1, "rgba(5,7,15,0.98)");
    ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 9; ctx.globalAlpha = 0.14; ctx.strokeStyle = col; ctx.stroke(); ctx.globalAlpha = 1;
    ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
    if (title) uiText(title, x + 26, y + (titleSize || 30) * 0.95 + 8, titleSize || 30, col, "left");
}
// Italic display text with a coloured shadow of itself (the glow without shadowBlur). align: left | center | right.
function uiText(text, x, y, size, col, align, glow) {
    ctx.save();
    ctx.font = uiFont(size); ctx.textAlign = align || "left"; ctx.textBaseline = "middle";
    if (glow !== false && col && col !== "#fff" && col !== "#ffffff") { ctx.globalAlpha = 0.3; ctx.fillStyle = col; ctx.fillText(text, x + 1.5, y + 1.5); ctx.fillText(text, x - 1.5, y - 1.5); ctx.globalAlpha = 1; }
    ctx.fillStyle = col || "#fff"; ctx.fillText(text, x, y);
    ctx.restore();
}
// The same, shrunk until it fits maxW.
function uiTextFit(text, x, y, size, col, align, maxW) {
    ctx.save(); ctx.font = uiFont(size);
    const w = ctx.measureText(text).width; ctx.restore();
    uiText(text, x, y, w > maxW ? Math.max(9, Math.floor(size * maxW / w)) : size, col, align);
}
// Small caption text: bold mono, never below 12px.
function uiCaption(text, x, y, col, align, size) {
    ctx.save(); ctx.font = uiMono(Math.max(10, size || 13)); ctx.textAlign = align || "left"; ctx.textBaseline = "middle"; ctx.fillStyle = col || "#8aa0c8"; ctx.fillText(text, x, y); ctx.restore();
}
// Caption text shrunk (down to 10px) until it fits maxW.
function uiCaptionFit(text, x, y, col, align, size, maxW) {
    ctx.save(); let sz = Math.max(10, size || 13); ctx.font = uiMono(sz);
    while (sz > 10 && ctx.measureText(text).width > maxW) { sz--; ctx.font = uiMono(sz); }
    let t = text; while (t.length > 6 && ctx.measureText(t).width > maxW) t = t.slice(0, -2);
    if (t !== text) t = t.slice(0, -1) + "\u2026";
    ctx.restore();
    uiCaption(t, x, y, col, align, sz);
}
// A button: a slab with a centred italic label (and an optional caption under it). r = { x, y, w, h }.
function uiButton(r, label, col, on, size, sub, dim) {
    uiSlab(r.x, r.y, r.w, r.h, col, on, null, dim);
    const txt = on ? UI_INK : "#fff", sz = size || Math.min(24, r.h * 0.42);
    ctx.save(); if (dim) ctx.globalAlpha = 0.45;
    if (sub) { uiTextFit(label, r.x + r.w / 2, r.y + r.h * 0.38, sz, txt, "center", r.w - 20); uiCaption(sub, r.x + r.w / 2, r.y + r.h * 0.76, on ? "#1a2233" : "#8aa0c8", "center", 12); }
    else uiTextFit(label, r.x + r.w / 2, r.y + r.h / 2 + 1, sz, txt, "center", r.w - 20);
    ctx.restore();
}
// The dimmed backdrop behind a modal panel.
function uiBackdrop(a) { ctx.fillStyle = "rgba(2,4,12," + (a || 0.7) + ")"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
// Where a panel may start: just under the HUD plates (they are page elements over the canvas, so a panel drawn beneath them would be cut off).
function uiTopSafe() {
    try { const h = document.getElementById("topHud"); if (h) { const r = h.getBoundingClientRect(); if (r.height > 0 && isFinite(r.bottom)) return Math.round(r.bottom + 10); } } catch (e) {}
    return 8;
}
// Where a panel must end: just above the bottom dock (tablet/desktop) or the bottom edge (phone).
function uiBottomSafe() {
    try { const d = document.getElementById("topToggles"); if (d && canvas.width > 700) { const r = d.getBoundingClientRect(); if (r.height > 0 && isFinite(r.top) && r.top > canvas.height * 0.4) return Math.round(r.top - 10); } } catch (e) {}
    return canvas.height - 8;
}

// The dock (js/toolbox.js) carries Crystal, Clones, Modules, Shop and Settings on a tablet or desktop, so the old round canvas buttons for them are
// neither drawn nor tapped there. A phone has no dock and keeps them.
function dockHasMenus() { return typeof canvas !== "undefined" && canvas.width > 700; }

// Text wrapped to a character budget (the panels are monospace, so a budget is exact rather than a guess).
function uiWrap(text, maxChars) {
    const words = String(text).split(/\s+/).filter(Boolean), lines = []; let line = '';
    for (const w of words) { if (!line.length) { line = w; continue; } if (line.length + 1 + w.length <= maxChars) line += ' ' + w; else { lines.push(line); line = w; } }
    if (line.length) lines.push(line);
    return lines.length ? lines : [''];
}
