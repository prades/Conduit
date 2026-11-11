// ─────────────────────────────────────────────────────────
//  THE DIALOGUE BOX — whoever is talking, their picture, and what they said (docs/TUTORIAL.md, "The Crystal speaks")
// ─────────────────────────────────────────────────────────
// ASKED (the owner, 2026-11-01): "I want the text in this game to be like an RPG or a JRPG, where the little player or whoever's talking pops up at the bottom, little picture, and it shows the dialogue that they said."
// A QUEUE of lines. A line has a SPEAKER (DLG_SPEAKERS: the Crystal, the player, Side Quest; or a follower) and its words, and is drawn as one slab at the bottom of the screen: the speaker's picture in a square slab at
// the left, their name over the words, the words typed out a few letters a frame, three lines at a time (longer words turn their pages). A typed page waits a reading pace (dwell + perChar a letter) and the next comes; a tap
// on the box, Enter or Space ends the typing, else turns the page, else lets the line go. A HELD line (Side Quest at his station, js/sidequest.js) stays until its sayer replaces or dismisses it (a tap on it asks the sayer:
// onTap, his NEXT), with its CHOICE buttons in the box when there is a choice to make (I PROMISE / NO PROMISES). While a panel is open (the pack, the class picker, the roster, SETTINGS, the quest box...) the box is not drawn
// and the line waits. Nothing here is saved: whoever says a thing once keeps the record (js/tutorial.js S.said, which the save keeps).
// WHO SPEAKS: the Crystal gives the tutorial and the class's stage (js/tutorial.js), the player notes the quest line's turns (js/quests.js), Side Quest talks at his station (js/sidequest.js). Fight feedback (hits, numbers,
// the queen's calls) stays as floating text in the world: it is not talk.
// WHERE: above the dock on a tablet or a desktop (js/uikit.js uiBottomSafe), between the squad's corner and the target's corner (THE CORNERS, js/party.js hudCorners: the squad stack and the tool at the left, the enemy
// card at the right: js/targeting.js _tgAnchor's foeW); on a phone above the squad bar's row and the battle tool's chip. Centred in the room it has, at most DIALOGUE.w wide.
const DIALOGUE = {
    w: 640, h: 108, port: 76, pad: 12, gap: 12,   // the box at its widest; its height; the portrait square; the padding; the gap between the portrait and the words
    cps: 2,                                       // letters typed a frame
    dwell: 150, perChar: 2.4,                     // a typed page stays dwell + perChar × its letters frames (a short line about 3 s, a full page about 9) before the next comes
    lines: 3, lineH: 17, charW: 7.9,              // lines of words a page, their pitch, and a letter's width at 13 px mono (the wrap's budget)
    margin: 12, above: 10,                        // the gutter at the screen's edges; the gap over the dock or the squad row
    choiceH: 40, cursor: 28,                      // the choice buttons' height; the ▼'s blink (frames)
    perRow: 3,                                    // choices to a row; more go on another row under it (build 2026-11-09a: Side Quest's six roles)
    place: 15,                                    // frames a measured place is kept (the page's rectangles are not asked for every frame)
};
const DLG_SPEAKERS = {
    crystal:   { name: () => "THE CRYSTAL", col: () => "#19e6c1" },
    player:    { name: () => { const c = typeof playerClass === "function" ? playerClass() : null; return c ? c.name : "YOU"; }, col: () => { const c = typeof playerClass === "function" ? playerClass() : null; return c ? c.colour : "#ffe733"; } },
    sidequest: { name: () => typeof SIDEQUEST !== "undefined" ? SIDEQUEST.name : "SIDE QUEST", col: () => typeof SIDEQUEST !== "undefined" ? SIDEQUEST.col : "#9fd8ff" },
};
let _dlgQueue = [], _dlgCur = null, _dlgBtns = [], _dlgPlaceAt = -1, _dlgPlaceK = null;
const _dlgBox = { x: 0, y: 0, w: 0, h: 0 };   // where the box is drawn this frame (w 0: not drawn): the taps and the tests read it

function _dlgFrame() { return typeof frame !== "undefined" ? frame : 0; }
// the speaker's name and colour now (a class picked, a follower's element)
function dialogueSpeaker(who) {
    if (who && typeof who === "object") { const e = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(x => x.id === who.element) : null; return { id: "unit", name: typeof unitTypeLabel === "function" ? unitTypeLabel(who) : "FOLLOWER", col: e ? e.color : "#8aa0c8" }; }
    const sp = DLG_SPEAKERS[who] || DLG_SPEAKERS.player; return { id: DLG_SPEAKERS[who] ? who : "player", name: sp.name(), col: sp.col() };
}
// SAY: who ("crystal", "player", "sidequest", or a follower), text (one string, or an array: its pages), opts { key, group, col, hold, now, choices: [{ label, col, fn, sub }], onTap }
//   (a choice's `sub`: a second, smaller line under its label, shrunk to fit: Side Quest's cards, their price)
//   key: a line already queued or showing with this key is not added again;  group: the sayer's name, for dismissal and replacement;  col: a tint for this one line (the speaker's colour else)
//   hold: it stays until replaced or dismissed;  now: it shows at once, in place of the line showing (which goes back to the front of the queue, unless it is the same group's: then it is replaced)
function dialogueSay(who, text, opts) {
    opts = opts || {};
    const pages = (Array.isArray(text) ? text : [text]).map(t => t == null ? "" : String(t).trim()).filter(t => t.length);
    if (!pages.length) return null;
    const key = opts.key || null;
    if (key) { if (_dlgCur && _dlgCur.key === key) return _dlgCur; const q = _dlgQueue.find(l => l.key === key); if (q) return q; }
    const sp = dialogueSpeaker(who);
    const L = { who, id: sp.id, name: sp.name, col: opts.col || sp.col, pages, flow: null, page: 0, shown: 0, t: 0, key, group: opts.group || null, hold: !!opts.hold, choices: opts.choices && opts.choices.length ? opts.choices : null, onTap: typeof opts.onTap === "function" ? opts.onTap : null, at: _dlgFrame() };
    if (opts.now) { const was = _dlgCur; _dlgCur = L; if (was && !(L.group && was.group === L.group)) { was.flow = null; was.page = 0; was.shown = 0; was.t = 0; _dlgQueue.unshift(was); } }
    else _dlgQueue.push(L);
    return L;
}
// a group's lines go, queued and showing (Side Quest's, when you walk away from him)
function dialogueDismiss(group) {
    let n = 0; _dlgQueue = _dlgQueue.filter(l => { const g = l.group === group; if (g) n++; return !g; });
    if (_dlgCur && _dlgCur.group === group) { _dlgCur = null; n++; }
    return n;
}
function dialogueClear() { _dlgQueue = []; _dlgCur = null; _dlgBtns = []; _dlgBox.w = 0; }
function dialogueCurrent() { return _dlgCur; }
// what is showing, then what waits (the tests read this)
function dialogueLines() { return (_dlgCur ? [_dlgCur] : []).concat(_dlgQueue).map(l => ({ who: l.id, name: l.name, col: l.col, text: l.pages.join(" "), key: l.key, group: l.group, hold: l.hold, choices: l.choices ? l.choices.map(c => c.label) : null })); }
function dialogueOn() { return !!_dlgCur && !dialoguePaused(); }
// a panel is open: the box is not drawn and the line waits (the website's background shows nothing either: js/attract.js)
function dialoguePaused() {
    return !!((typeof classPickerOpen !== "undefined" && classPickerOpen) || (typeof invPanelOpen !== "undefined" && invPanelOpen) || (typeof settingsPanelOpen !== "undefined" && settingsPanelOpen)
        || (typeof cloneMenuOpen !== "undefined" && cloneMenuOpen) || (typeof infoPanelOpen !== "undefined" && infoPanelOpen) || (typeof armoryPanelOpen !== "undefined" && armoryPanelOpen)
        || (typeof cardsPanelOpen !== "undefined" && cardsPanelOpen) || (typeof ccOpenTab !== "undefined" && ccOpenTab) || (typeof questBoxOpen !== "undefined" && questBoxOpen)
        || (typeof attractOn === "function" && attractOn()));
}

// ── where it goes ──
function _dlgRect(id) {
    try { if (typeof document === "undefined" || !document.getElementById) return null; const el = document.getElementById(id); if (!el || !el.getBoundingClientRect) return null; const r = el.getBoundingClientRect(); return r && r.width > 0 && r.height > 0 && isFinite(r.top) ? r : null; } catch (e) { return null; }
}
// { x, w, bottom }: measured every DIALOGUE.place frames (the page's rectangles cost a layout)
function dialoguePlace(force) {
    if (typeof canvas === "undefined" || !canvas) return { x: DIALOGUE.margin, w: DIALOGUE.w, bottom: 600, W: 0, H: 0 };
    const f = _dlgFrame(), K = _dlgPlaceK;
    if (!force && K && f - _dlgPlaceAt >= 0 && f - _dlgPlaceAt < DIALOGUE.place && K.W === canvas.width && K.H === canvas.height) return K;
    const W = canvas.width, H = canvas.height, corner = typeof hudCorners === "function" && hudCorners();
    let bottom = typeof uiBottomSafe === "function" ? uiBottomSafe() : H - 8, left = DIALOGUE.margin, right = W - DIALOGUE.margin;
    if (corner) {   // the squad's corner at the left (the stack and the tool), the target's at the right (the enemy card: js/targeting.js _tgAnchor's foeW, 14 px from the edge)
        const sb = _dlgRect("squadBar"), mt = _dlgRect("mixTool"), l = Math.max(sb ? sb.right : 0, mt ? mt.right : 0);
        if (l > 0 && l < W * 0.45) left = Math.max(left, Math.round(l) + DIALOGUE.gap);
        const foeW = W > 1100 ? 260 : W > 900 ? 232 : 214; right = Math.min(right, W - 14 - foeW - DIALOGUE.gap);
        const core = typeof coreOn === "function" && coreOn() && typeof CORE_HUD !== "undefined" ? _dlgRect("coreHud") : null;   // THE CORE (js/corehud.js): into the empty strip at its left, not under its buttons
        if (core && core.left > W / 2) right = Math.min(right, Math.round(core.left) + CORE_HUD.strip - DIALOGUE.gap);
    } else {   // a phone: over the squad's row and the tool's chip, and clear of the round buttons at the right edge (SETTINGS, QUESTS: js/settings.js, js/questbox.js)
        for (const id of ["squadBar", "mixTool"]) { const r = _dlgRect(id); if (r && r.top > H * 0.45) bottom = Math.min(bottom, Math.round(r.top)); }
        if (typeof dockHasMenus === "function" && !dockHasMenus()) right = Math.min(right, W - 50);
    }
    if (right - left < 240) { left = DIALOGUE.margin; right = W - DIALOGUE.margin; }   // (no room between the corners: the box takes the width, over them)
    const w = Math.min(DIALOGUE.w, right - left), x = Math.round((left + right) / 2 - w / 2);
    _dlgPlaceAt = f; return (_dlgPlaceK = { x, w, bottom: bottom - DIALOGUE.above, W, H });
}

// ── the words, typed ──
function _dlgChars(w) { return Math.max(14, Math.floor((w - DIALOGUE.pad * 2 - 6 - DIALOGUE.port - DIALOGUE.gap - 14) / DIALOGUE.charW)); }   // letters a line in a box w wide
// the line's pages for this width: each page of words wrapped, three lines to a page
function _dlgFlow(L, chars) {
    if (L.flow && L.flow.chars === chars) return L.flow;
    const pages = []; for (const p of L.pages) { const ls = typeof uiWrap === "function" ? uiWrap(p, chars) : [p]; for (let i = 0; i < ls.length; i += DIALOGUE.lines) pages.push(ls.slice(i, i + DIALOGUE.lines)); }
    L.flow = { chars, pages: pages.length ? pages : [[""]] }; if (L.page >= L.flow.pages.length) L.page = L.flow.pages.length - 1; L.shown = Math.min(L.shown, _dlgPageLen(L));
    return L.flow;
}
function _dlgPageLen(L) { const pg = L.flow ? L.flow.pages[L.page] : null; return pg ? pg.reduce((n, l) => n + l.length, 0) : 0; }
function _dlgPages(L) { return L.flow ? L.flow.pages.length : L.pages.length; }
// each frame (js/facilitytutorial.js facilityTutorialTick): the next line comes up, the words type, a typed page waits its reading pace and turns
function dialogueTick() {
    if (dialoguePaused()) return;
    if (!_dlgCur) { if (!_dlgQueue.length) return; _dlgCur = _dlgQueue.shift(); }
    const L = _dlgCur; _dlgFlow(L, _dlgChars(dialoguePlace().w)); const len = _dlgPageLen(L);
    if (L.shown < len) { L.shown = Math.min(len, L.shown + DIALOGUE.cps); L.t = 0; return; }
    L.t++;
    if (L.page + 1 >= _dlgPages(L) && (L.hold || L.choices)) return;   // (a held line, or a choice to make: it waits for its sayer, or for the buttons)
    if (L.t >= DIALOGUE.dwell + DIALOGUE.perChar * len) _dlgTurn();
}
function _dlgTurn() { const L = _dlgCur; if (!L) return false; if (L.page + 1 < _dlgPages(L)) { L.page++; L.shown = 0; L.t = 0; return true; } _dlgCur = null; return true; }
// a tap on the box, Enter or Space: the typing ends; else the page turns; else the line goes (a held line asks its sayer; a choice is made on its buttons)
function dialogueAdvance() {
    const L = _dlgCur; if (!L || dialoguePaused()) return false;
    const len = _dlgPageLen(L); if (L.shown < len) { L.shown = len; L.t = 0; return true; }
    if (L.page + 1 < _dlgPages(L)) return _dlgTurn();
    if (L.choices) return true;
    if (L.hold) { if (L.onTap) L.onTap(); return true; }
    _dlgCur = null; return true;
}

// ── the taps (js/input.js: a press on the box is the box's: no ring, no move order, no long press) ──
function _dlgBtnAt(ex, ey) { return _dlgBtns.find(b => ex >= b.x && ex <= b.x + b.w && ey >= b.y && ey <= b.y + b.h) || null; }
function dialoguePress(ex, ey) { if (!_dlgCur || _dlgBox.w <= 0 || dialoguePaused()) return false; if (_dlgBtnAt(ex, ey)) return true; const B = _dlgBox; return ex >= B.x && ex <= B.x + B.w && ey >= B.y && ey <= B.y + B.h; }
function dialogueTap(ex, ey) {
    if (!dialoguePress(ex, ey)) return false;
    const b = _dlgBtnAt(ex, ey); if (b) { if (typeof b.fn === "function") b.fn(); return true; }
    dialogueAdvance(); return true;
}

// ── the picture ──
// the speaker, in the portrait square (cx, cy, s wide): the Crystal's shard (js/facilitystyle.js), the player's own sheet facing you (js/hdsprites.js), Side Quest's void walker facing you (js/sidequest.js sqPortrait), a follower's roster picture (js/commandcenter.js)
function _dlgPortrait(L, cx, cy, s, f) {
    const who = L.id === "unit" ? L.who : L.id;
    if (who === "crystal" && typeof _fpCrystal === "function") { _fpCrystal(cx, cy + s * 0.36, s * 0.72, s * 0.27, L.col, f, 3); return; }
    if (who === "player" && typeof _hdImg === "function" && typeof _hdBlit === "function" && typeof HD_BOX !== "undefined") {
        const img = _hdImg("player");
        if (img) { ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.beginPath(); ctx.ellipse(cx, cy + s * 0.37, s * 0.24, s * 0.09, 0, 0, Math.PI * 2); ctx.fill(); _hdBlit(ctx, img, HD_BOX.player, typeof hdCol === "function" ? hdCol(false, f) : 0, typeof hdRow === "function" ? hdRow(1, 1) : 0, cx, cy + s * 0.37, s * 0.0075); return; }
    }
    if (who === "sidequest" && typeof sqPortrait === "function") { sqPortrait(cx, cy, s, f); return; }
    if (who && typeof who === "object" && typeof _ccThumb === "function" && typeof document !== "undefined" && document.createElement) {
        if (!L.cv) { const cv = document.createElement("canvas"); if (cv) { cv.width = cv.height = 72; try { _ccThumb(cv, who); L.cv = cv; } catch (e) { L.cv = null; } } }
        if (L.cv) { try { ctx.drawImage(L.cv, cx - s * 0.42, cy - s * 0.42, s * 0.84, s * 0.84); return; } catch (e) {} }
    }
    // no picture to hand (a sheet still arriving, the test sandbox): the speaker's initial in their colour
    ctx.fillStyle = L.col; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(cx, cy, s * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = "#05070f"; ctx.font = "italic 900 " + Math.round(s * 0.36) + "px " + (typeof UI_FONT !== "undefined" ? UI_FONT : "sans-serif"); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(L.name).charAt(0), cx, cy + 1);
}
// the box (js/game.js render, over the picture and under the panels)
function dialogueDraw() {
    _dlgBox.w = 0; _dlgBtns = [];
    const L = _dlgCur; if (!L || dialoguePaused() || typeof ctx === "undefined" || typeof uiSlab !== "function") return;
    const P = dialoguePlace(), f = _dlgFrame(), pad = DIALOGUE.pad, ps = DIALOGUE.port, w = P.w, flow = _dlgFlow(L, _dlgChars(w)), pg = flow.pages[L.page], len = _dlgPageLen(L), typed = L.shown >= len, last = L.page + 1 >= flow.pages.length;
    const choices = L.choices && last && typed ? L.choices : null, rows = choices ? Math.ceil(choices.length / DIALOGUE.perRow) : 0;   // (more than DIALOGUE.perRow choices wrap onto more rows: Side Quest's six roles, build 2026-11-09a)
    const h = DIALOGUE.h + (choices ? rows * (DIALOGUE.choiceH + 10) : 0), x = P.x, y = P.bottom - h;
    _dlgBox.x = x; _dlgBox.y = y; _dlgBox.w = w; _dlgBox.h = h;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    uiSlab(x, y, w, h, L.col, false, "#0b1226");
    const px = x + pad + 6, py = y + pad; uiSlab(px, py, ps, ps, L.col, false, "#070b18");   // the portrait's own slab
    ctx.save(); ctx.beginPath(); ctx.rect(px + 2, py + 2, ps - 4, ps - 4); ctx.clip(); try { _dlgPortrait(L, px + ps / 2, py + ps / 2, ps, f); } catch (e) {} ctx.restore();
    const tx = px + ps + DIALOGUE.gap, tw = x + w - 14 - tx;
    uiTextFit(L.name, tx, y + pad + 9, 15, L.col, "left", tw);
    let n = 0, yy = y + pad + 31;
    for (const ln of pg) { if (n >= L.shown) break; const part = L.shown - n >= ln.length ? ln : ln.slice(0, L.shown - n); n += ln.length; uiCaption(part, tx, yy, "#e8f0ff", "left", 13); yy += DIALOGUE.lineH; }
    if (typed && !choices && (!last || !L.hold || L.onTap) && Math.floor(f / DIALOGUE.cursor) % 2 === 0) {   // the ▼: a tap turns the page, lets the line go, or (a held line with a NEXT) asks its sayer
        ctx.fillStyle = L.col; const cx = x + w - 24, cy = y + h - 15; ctx.beginPath(); ctx.moveTo(cx - 6, cy - 4); ctx.lineTo(cx + 6, cy - 4); ctx.lineTo(cx, cy + 4); ctx.closePath(); ctx.fill();
    }
    if (choices && typeof uiButton === "function") {
        const k = Math.min(choices.length, DIALOGUE.perRow), bw = Math.floor((tw - 10 * (k - 1)) / k), by0 = y + h - pad - rows * DIALOGUE.choiceH - (rows - 1) * 10;
        choices.forEach((c, i) => {
            const row = Math.floor(i / DIALOGUE.perRow), col = i % DIALOGUE.perRow;
            const r = { x: tx + col * (bw + 10), y: by0 + row * (DIALOGUE.choiceH + 10), w: bw, h: DIALOGUE.choiceH, label: c.label, fn: c.fn, yes: c.yes, sub: c.sub || null, card: c.card || null };
            if (c.sub && typeof uiCaptionFit === "function") { uiButton(r, c.label, c.col || L.col, false, 15, " "); uiCaptionFit(c.sub, r.x + r.w / 2, r.y + r.h * 0.76, "#8aa0c8", "center", 12, r.w - 14); }   // (the label up top, the sub shrunk to fit under it)
            else uiButton(r, c.label, c.col || L.col, false, 16);
            _dlgBtns.push(r);
        });
    }
    ctx.restore();
}
// Enter or Space: as a tap on the box (not from a button or a field that has the keyboard)
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (!e || e.repeat || !_dlgCur || !(typeof facilityPlay !== "undefined" && facilityPlay)) return; if ((e.key === "Enter" || e.key === " ") && !(e.target && /INPUT|TEXTAREA|BUTTON|SELECT/.test(e.target.tagName || "")) && dialogueAdvance()) e.preventDefault(); }); } catch (e) { /* no page (the test sandbox) */ }
