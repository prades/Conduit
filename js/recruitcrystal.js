// ─────────────────────────────────────────────────────────
//  THE RECRUIT CRYSTAL — pick the element of the next recruit on a turning prism, in the Command Center header (and the phone roster)
// ─────────────────────────────────────────────────────────
// REPORTED: "make a little crystal element selector in the command center right next to recruit, and remove the second window that pops up whenever you click recruit... a real cool UI that
// brings the user's attention towards it, like some sort of rotating crystal. But I don't like the flashing colors thing. Make it prismatic, with different colored facets for the colors
// unlocked within it that the user can select. A 3D menu that's compact and readable."
// A hexagonal prism with a pyramid on each end, made of CSS 3D faces (no canvas, no per-frame script: the only motion is a slow CSS turn and a gentle bob, and nothing flashes). One side
// facet for each of the six elements, in its colour; an element not unlocked yet is a smoked-glass facet that cannot be picked. The pick is the facet in front: tap a facet (or the arrows) and
// the crystal turns to it. MIX leaves it turning slowly, every colour in view, and recruits from the current mix as before.
// + RECRUIT then recruits straight away: the element picker window is gone (it was recruitPickerOpen in js/commandcenter.js).
const RECRUIT_CHOICE_KEY = "conduit_recruit_el";
let recruitChoice = "mix";
try { const v = typeof localStorage !== "undefined" ? localStorage.getItem(RECRUIT_CHOICE_KEY) : null; if (v) recruitChoice = v; } catch (e) {}

function _rcElements() { return typeof ELEMENTS !== "undefined" ? ELEMENTS : []; }
// MIX first, then the unlocked elements in the order of the facets.
function recruitOptions() {
    const un = typeof unlockedElements !== "undefined" ? unlockedElements : new Set();
    return ["mix"].concat(_rcElements().filter(e => un.has(e.id)).map(e => e.id));
}
// The choice, or MIX when it is not open to you (an element not unlocked, or a stale save).
function recruitChoiceNow() { return recruitOptions().indexOf(recruitChoice) >= 0 ? recruitChoice : "mix"; }
function recruitSetChoice(id) {
    if (recruitOptions().indexOf(id) < 0) return false;
    recruitChoice = id;
    try { if (typeof localStorage !== "undefined") localStorage.setItem(RECRUIT_CHOICE_KEY, id); } catch (e) {}
    _rcRefreshAll();
    return true;
}
function recruitCycle(dir) {
    const o = recruitOptions(), i = Math.max(0, o.indexOf(recruitChoiceNow()));
    return recruitSetChoice(o[(i + (dir < 0 ? -1 : 1) + o.length) % o.length]);
}
// Recruit now, as picked: MIX is a draw from the current mix (clone.js recruitFollower with no element).
function recruitDo() {
    const c = recruitChoiceNow(), ok = recruitFollower(c === "mix" ? undefined : c);
    if (typeof ccRender === "function") ccRender();
    if (typeof radialRender === "function") radialRender();
    return ok;
}
function recruitChoiceLabel() { const c = recruitChoiceNow(), e = _rcElements().find(x => x.id === c); return c === "mix" ? "MIX" : e ? e.label.toUpperCase() : "MIX"; }
function recruitChoiceColour() { const c = recruitChoiceNow(), e = _rcElements().find(x => x.id === c); return e ? e.color : "#ffe733"; }

// ── THE DOM ──
function _rcEl(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function _rcClick(el, fn) { el.addEventListener("click", ev => { if (ev && ev.stopPropagation) ev.stopPropagation(); fn(ev); }); }
const _rcRoots = [];
// compact: the phone roster's smaller size.
function recruitCrystalBuild(compact) {
    const root = _rcEl("div", "rcx" + (compact ? " compact" : ""));
    const prev = _rcEl("button", "rcx-arrow", "‹"), next = _rcEl("button", "rcx-arrow", "›");
    prev.setAttribute("aria-label", "Previous element"); next.setAttribute("aria-label", "Next element");
    _rcClick(prev, () => recruitCycle(-1)); _rcClick(next, () => recruitCycle(1));
    const stage = _rcEl("div", "rcx-stage"), gem = _rcEl("div", "rcx-gem"), turn = _rcEl("div", "rcx-turn");
    _rcElements().forEach((el, i) => {
        const col = _rcEl("div", "rcx-col"); col.style.setProperty("--i", String(i)); col.style.setProperty("--c", el.color); col.setAttribute("data-el", el.id);
        ["side", "top", "bot"].forEach(k => { const f = _rcEl("div", "rcx-f rcx-" + k); _rcClick(f, () => { if (!recruitSetChoice(el.id) && typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: el.label.toUpperCase() + " IS LOCKED", color: "#8aa0c8", life: 80, vy: -0.25, size: 12 }); }); col.appendChild(f); });
        turn.appendChild(col);
    });
    gem.appendChild(turn); stage.appendChild(gem);
    const lab = _rcEl("div", "rcx-label"); lab.appendChild(_rcEl("div", "rcx-name")); lab.appendChild(_rcEl("div", "rcx-cap", "RECRUIT AS"));
    root.appendChild(prev); root.appendChild(stage); root.appendChild(next); root.appendChild(lab);
    root._turn = turn; _rcRoots.push(root);
    recruitCrystalUpdate(root);
    return root;
}
// Bring one crystal in line with the state: facets locked or open, the turn, the name. Cheap, and a no-op when nothing changed.
function recruitCrystalUpdate(root) {
    if (!root || !root._turn) return;
    const un = typeof unlockedElements !== "undefined" ? unlockedElements : new Set(), c = recruitChoiceNow(), els = _rcElements();
    const sig = c + "|" + els.map(e => un.has(e.id) ? 1 : 0).join("");
    if (root._sig === sig) return; root._sig = sig;
    const idx = els.findIndex(e => e.id === c), mix = c === "mix";
    root.classList.toggle("mix", mix);
    root._turn.style.setProperty("--ry", mix ? "0deg" : (-idx * 60) + "deg");
    root.style.setProperty("--pick", recruitChoiceColour());
    Array.prototype.forEach.call(root._turn.children || [], (col, i) => { const e = els[i]; if (!e) return; col.classList.toggle("locked", !un.has(e.id)); col.classList.toggle("sel", e.id === c); });
    const n = root.querySelector ? root.querySelector(".rcx-name") : null; if (n) { n.textContent = recruitChoiceLabel(); n.style.color = recruitChoiceColour(); }
}
function _rcRefreshAll() { for (let i = _rcRoots.length - 1; i >= 0; i--) { const r = _rcRoots[i]; if (r.isConnected === false) { _rcRoots.splice(i, 1); continue; } recruitCrystalUpdate(r); } }
