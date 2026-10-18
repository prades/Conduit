// ─────────────────────────────────────────────────────────
//  THE RECRUIT CRYSTAL — pick the element of the next recruit on a turning prism, in the Command Center header (and the phone roster)
// ─────────────────────────────────────────────────────────
// REPORTED: "make a little crystal element selector in the command center right next to recruit, and remove the second window that pops up whenever you click recruit... a real cool UI that
// brings the user's attention towards it, like some sort of rotating crystal. But I don't like the flashing colors thing. Make it prismatic, with different colored facets for the colors
// unlocked within it that the user can select. A 3D menu that's compact and readable."
// REPORTED (after the first, turning version): "the prism is really confusing, and the colors don't light up. I want to select each shade of color on the crystal, and it makes it clear if it's
// selected by a darker sort of aura or a bright selected aura."
// So it holds still: a cut gem seen from above, six coloured segments (one per element, each an outer bevel and an inner facet, lit from the top left). TAP A COLOUR to pick it: that segment lights
// up (full colour, a bright rim and a glow, lifted a little) and every other colour goes dark, so what is picked can be read at a glance. The small prismatic hex in the middle is MIX (every colour
// lit, recruits from the current mix). An element not unlocked yet is a grey, locked segment. It is one SVG (no canvas, no script per frame); the only motion is a slow float.
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
const _rcRoots = []; let _rcGradN = 0;
// Mix a "#rrggbb" toward white (k > 0) or black (k < 0).
function _rcShade(hex, k) {
    const n = parseInt(String(hex).slice(1), 16), t = k < 0 ? 0 : 255, a = Math.abs(k);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v + (t - v) * a));
    return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
}
// The gem as SVG markup: for element i, the segment between vertices i and i+1 (the first at the top), an outer bevel and an inner facet, shaded by where it faces (light from the top left).
function _rcGemSVG() {
    const gid = "rcxMix" + (++_rcGradN);   // one gradient id per crystal: a gradient inside a hidden SVG does not paint
    const els = _rcElements(), n = els.length || 6, R = 46, r = 21, C = 50, pt = (rad, k) => { const a = (-90 - 180 / n + k * 360 / n) * Math.PI / 180; return [C + rad * Math.cos(a), C + rad * Math.sin(a)]; };
    const f = p => p[0].toFixed(1) + "," + p[1].toFixed(1);
    let out = '<svg class="rcx-svg" viewBox="0 0 100 100" aria-hidden="false"><defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3a8"/><stop offset="0.34" stop-color="#9ff0ff"/><stop offset="0.68" stop-color="#d9a8ff"/><stop offset="1" stop-color="#ffb3c8"/></linearGradient></defs>';
    els.forEach((el, i) => {
        const o0 = pt(R, i), o1 = pt(R, i + 1), i0 = pt(r, i), i1 = pt(r, i + 1), mid = (-90 + i * 360 / n) * Math.PI / 180;
        const lit = Math.cos(mid - (-135 * Math.PI / 180));                 // 1 facing the light (top left), -1 away
        const outer = _rcShade(el.color, 0.16 + 0.22 * lit), inner = _rcShade(el.color, -0.05 - 0.2 * (1 - lit) / 2);
        out += '<g class="rcx-seg" data-el="' + el.id + '" style="--c:' + el.color + '"><title>' + el.label + '</title>'
            + '<polygon class="rcx-out" points="' + [o0, o1, i1, i0].map(f).join(" ") + '" fill="' + outer + '"/>'
            + '<polygon class="rcx-in" points="' + [i0, i1, [C, C]].map(f).join(" ") + '" fill="' + inner + '"/>'
            + '<polyline class="rcx-edge" points="' + [o0, o1, i1, [C, C], i0, o0].map(f).join(" ") + '"/></g>';
    });
    // the middle: MIX
    const m = []; for (let k = 0; k < n; k++) m.push(f(pt(10.5, k)));
    out += '<g class="rcx-mixg" data-el="mix"><title>MIX</title><polygon class="rcx-mixp" points="' + m.join(" ") + '" fill="url(#' + gid + ')"/></g></svg>';
    return out;
}
// compact: the phone roster's smaller size.
function recruitCrystalBuild(compact) {
    const root = _rcEl("div", "rcx" + (compact ? " compact" : ""));
    const stage = _rcEl("div", "rcx-stage"); stage.innerHTML = _rcGemSVG(); root.appendChild(stage);
    const lab = _rcEl("div", "rcx-label"); lab.appendChild(_rcEl("div", "rcx-name")); lab.appendChild(_rcEl("div", "rcx-cap", "TAP A COLOUR"));
    root.appendChild(lab);
    root._stage = stage; _rcRoots.push(root);
    // the segments are tapped (a locked one says so); the middle is MIX
    const segs = stage.querySelectorAll ? stage.querySelectorAll("[data-el]") : [];
    Array.prototype.forEach.call(segs, g => {
        const id = g.getAttribute("data-el");
        _rcClick(g, () => {
            if (recruitSetChoice(id)) return;
            const e = _rcElements().find(x => x.id === id);
            if (e && typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: e.label.toUpperCase() + " IS LOCKED", color: "#8aa0c8", life: 80, vy: -0.25, size: 12 });
        });
    });
    recruitCrystalUpdate(root);
    return root;
}
// Bring one crystal in line with the state: which segments are open, which one is lit, the name. Cheap, and a no-op when nothing changed.
function recruitCrystalUpdate(root) {
    if (!root || !root._stage) return;
    const un = typeof unlockedElements !== "undefined" ? unlockedElements : new Set(), c = recruitChoiceNow(), els = _rcElements();
    const sig = c + "|" + els.map(e => un.has(e.id) ? 1 : 0).join("");
    if (root._sig === sig) return; root._sig = sig;
    root.classList.toggle("mix", c === "mix");
    root.style.setProperty("--pick", recruitChoiceColour());
    const segs = root._stage.querySelectorAll ? root._stage.querySelectorAll("[data-el]") : [];
    Array.prototype.forEach.call(segs, g => { const id = g.getAttribute("data-el"); if (id === "mix") { g.classList.toggle("sel", c === "mix"); return; } g.classList.toggle("locked", !un.has(id)); g.classList.toggle("sel", id === c); });
    const n = root.querySelector ? root.querySelector(".rcx-name") : null; if (n) { n.textContent = recruitChoiceLabel(); n.style.color = recruitChoiceColour(); }
}
function _rcRefreshAll() { for (let i = _rcRoots.length - 1; i >= 0; i--) { const r = _rcRoots[i]; if (r.isConnected === false) { _rcRoots.splice(i, 1); continue; } recruitCrystalUpdate(r); } }
