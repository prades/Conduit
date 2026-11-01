// ─────────────────────────────────────────────────────────
//  THE QUEST BOX — the objective, off the HUD and kept in a panel on the menu (docs/TUTORIAL.md, "The Crystal speaks")
// ─────────────────────────────────────────────────────────
// ASKED (the owner, 2026-11-01): "still have the objective thing, but hide it. Make a little quest box on the menu." The objective plate (js/tutorial.js facilityDrawObjective) is drawn no more: the director still runs its steps and
// keeps the record of the objective (objectiveCurrent; S.objKey, S.objSeen), the Crystal says each step as it comes (js/dialogue.js), and THIS PANEL shows it when you ask: QUESTS on the dock (a tablet or a desktop: game.html
// #btnQuests, with a "!" on it while the objective is one you have not opened: body.quest-new, js/game.js), a round QUESTS button over the SETTINGS one on a phone (drawQuestButton; js/input.js takes its tap). The panel is drawn
// as SETTINGS is (js/uikit.js uiPanel): the objective NOW (its title, its words, its hint: the tutorial's, the quest line's, the class's stage's or the closing line), then the steps of what is under way, a mark each (✓ done,
// ▶ the one now, ○ to come): the tutorial's seven, the class's stage once a class is chosen, the Sewer purification once it is found. Opening it reads the objective (the "!" goes). CLOSE, a tap outside it, Escape or the
// button again shut it; while it is open the game's taps are the panel's (js/settings.js handleOverlayPanelTap) and the dialogue box waits.
let questBoxOpen = false;
const QUESTBOX = { w: 540, pad: 24, head: 66, lineH: 17, stepH: 22, gap: 12, btnH: 48, charW: 7.3 };   // the panel's width, padding, the title's room, the pitch of the words, of the steps, the gaps, CLOSE's height, a letter's width (the wrap's budget)
const _QUESTBTN = { x: 0, y: 0, r: 20 };   // a phone's round button (js/input.js)

function questBoxToggle(open) { const was = questBoxOpen; questBoxOpen = open === undefined ? !questBoxOpen : !!open; if (questBoxOpen && !was) questBoxRead(); return questBoxOpen; }
function questBoxClose() { questBoxOpen = false; }
// opening the box reads the objective that is up (js/tutorial.js objectiveUnread: the "!")
function questBoxRead() { if (typeof facilityDrawObjective === "function") facilityDrawObjective(); const S = typeof _fp !== "undefined" && _fp && _fp.tut && _fp.tut.script; if (S && S.objKey) S.objSeen = S.objKey; }
function questBoxUnread() { return typeof objectiveUnread === "function" && objectiveUnread(); }
// the dock button's "!" (css: body.quest-new .top-bang) follows objectiveUnread; js/game.js render asks each frame, and only a change touches the page
let _qbLastNew = null;
function questBoxBadgeTick() { const on = !!questBoxUnread(); if (on === _qbLastNew) return; _qbLastNew = on; try { if (typeof document !== "undefined" && document.body && document.body.classList) document.body.classList.toggle("quest-new", on); } catch (e) {} }
// the lists: what is under way, each step with its mark
function questBoxSections() {
    const S = typeof _fp !== "undefined" && _fp && _fp.tut && _fp.tut.script, out = []; if (!S || typeof TUT_STEPS === "undefined") return out;
    const mark = (i, cur) => i < cur ? "✓" : i === cur ? "▶" : "○", tutDone = S.step >= TUT_STEPS.length;
    if (!tutDone) out.push({ id: "tutorial", title: "THE TUTORIAL  ·  " + S.step + "/" + TUT_STEPS.length, col: typeof UI_TEAL !== "undefined" ? UI_TEAL : "#19e6c1", steps: TUT_STEPS.map((st, i) => ({ mark: mark(i, S.step), text: st.title })) });
    const pc = typeof playerClass === "function" ? playerClass() : null, st = tutDone && typeof tutClassStage === "function" ? tutClassStage() : null;
    if (pc && st) { const cur = Math.min(st.length, Math.max(0, tutClassCurrent())); out.push({ id: "class", title: pc.name + " STAGE  ·  " + cur + "/" + st.length, col: pc.colour, steps: st.map((c, i) => ({ mark: mark(i, cur), text: c.title })) }); }
    if (typeof QUEST_STEPS !== "undefined" && typeof questActive === "function") for (const id of Object.keys(QUEST_STEPS)) {
        if (!questActive(id) && !questDone(id)) continue;
        const steps = QUEST_STEPS[id], cur = Math.min(steps.length, questStepIndex(id)), P = typeof QUEST_PURIFY !== "undefined" && QUEST_PURIFY.id === id ? QUEST_PURIFY : { title: String(id).toUpperCase(), col: "#8cff5a" };
        out.push({ id, title: P.title + "  ·  " + cur + "/" + steps.length, col: P.col, steps: steps.map((s, i) => ({ mark: mark(i, cur), text: s.title })) });
    }
    return out;
}
// one layout for the drawing and the taps (as SETTINGS does: js/settings.js _spLayout)
function _qbLayout() {
    const W = canvas.width, pad = QUESTBOX.pad, w = Math.min(W - 24, QUESTBOX.w), chars = Math.max(20, Math.floor((w - pad * 2) / QUESTBOX.charW)), cur = typeof objectiveCurrent === "function" ? objectiveCurrent() : null, rows = [];
    let y = QUESTBOX.head;   // (offsets from the panel's top)
    if (cur) {
        rows.push({ kind: "title", text: cur.title, col: cur.col, y }); y += 24;
        for (const l of uiWrap(cur.body, chars)) { rows.push({ kind: "body", text: l, y }); y += QUESTBOX.lineH; }
        if (cur.hint) { y += 3; for (const l of uiWrap(cur.hint, chars)) { rows.push({ kind: "hint", text: l, y }); y += QUESTBOX.lineH - 2; } }
    } else { rows.push({ kind: "body", text: "NO OBJECTIVE NOW", y }); y += QUESTBOX.lineH; }
    for (const sec of questBoxSections()) { y += QUESTBOX.gap; rows.push({ kind: "section", text: sec.title, col: sec.col, y }); y += 23; for (const s of sec.steps) { rows.push({ kind: "step", mark: s.mark, text: s.text, col: sec.col, y }); y += QUESTBOX.stepH; } }
    y += QUESTBOX.gap; const btnAt = y; y += QUESTBOX.btnH + pad - 4;
    const top = uiTopSafe(), bottom = uiBottomSafe(), h = Math.min(y, Math.max(200, bottom - top)), x = Math.round((W - w) / 2), py = Math.max(top, Math.round((top + bottom - h) / 2));
    const close = { x: x + pad, y: py + Math.min(btnAt, h - pad + 4 - QUESTBOX.btnH), w: w - pad * 2, h: QUESTBOX.btnH };
    return { x, y: py, w, h, pad, rows, close, cur, chars, cut: y > h };   // cut: more than fits (the rows are clipped above CLOSE)
}
function drawQuestBox() {
    if (!questBoxOpen || typeof ctx === "undefined" || typeof uiPanel !== "function") return;
    const L = _qbLayout(), col = L.cur ? L.cur.col : (typeof UI_TEAL !== "undefined" ? UI_TEAL : "#19e6c1"), tx = L.x + L.pad, tw = L.w - L.pad * 2;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    uiBackdrop(0.66); uiPanel(L.x, L.y, L.w, L.h, col, "QUESTS", 32);
    ctx.save(); ctx.beginPath(); ctx.rect(L.x, L.y, L.w, L.close.y - L.y - 6); ctx.clip();
    for (const r of L.rows) {
        const y = L.y + r.y;
        if (r.kind === "title") uiTextFit(r.text, tx, y, 17, r.col, "left", tw);
        else if (r.kind === "body") uiCaption(r.text, tx, y, "#e8f0ff", "left", 12);
        else if (r.kind === "hint") uiCaption(r.text, tx, y, "#8aa0c8", "left", 11);
        else if (r.kind === "section") uiTextFit(r.text, tx, y, 15, r.col, "left", tw);
        else { const done = r.mark === "✓", now = r.mark === "▶"; uiCaption(r.mark, tx + 2, y, now ? r.col : done ? "#9dffb6" : "#55618a", "left", 13); uiCaptionFit(r.text, tx + 24, y, now ? "#ffffff" : done ? "#aeb8d8" : "#7d88ad", "left", 12, tw - 24); }
    }
    ctx.restore();
    uiButton(L.close, "CLOSE", "#6a7aa0", false, 20);
    ctx.restore();
}
function _handleQuestBoxTap(tx, ty) {
    if (!questBoxOpen) return false;
    const L = _qbLayout();
    if (tx < L.x || tx > L.x + L.w || ty < L.y || ty > L.y + L.h) { questBoxOpen = false; return true; }   // a tap outside closes it
    const c = L.close; if (tx >= c.x && tx <= c.x + c.w && ty >= c.y && ty <= c.y + c.h) questBoxOpen = false;
    return true;   // (every tap on the panel is the panel's)
}
// the gold "!" a new objective puts on the phone's button, breathing (the dock's is css: .top-bang)
function _qbBang(bx, by, f) {
    const k = 1 + 0.12 * Math.sin(f * 0.12), r = 9 * k;
    ctx.save(); ctx.fillStyle = "rgba(255,231,51,0.22)"; ctx.beginPath(); ctx.arc(bx, by, r + 5, 0, 6.2832); ctx.fill();   // (the glow is a second, wider, fainter disc: this game uses no shadowBlur)
    ctx.fillStyle = typeof UI_GOLD !== "undefined" ? UI_GOLD : "#ffe733"; ctx.beginPath(); ctx.arc(bx, by, r, 0, 6.2832); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = typeof UI_INK !== "undefined" ? UI_INK : "#05070f"; ctx.stroke();
    ctx.fillStyle = typeof UI_INK !== "undefined" ? UI_INK : "#05070f"; ctx.font = "bold " + Math.round(13 * k) + "px " + (typeof UI_FONT !== "undefined" ? UI_FONT : "sans-serif"); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("!", bx, by + 1); ctx.restore();
}
// A PHONE has no dock (js/uikit.js dockHasMenus): a round button over the SETTINGS one (js/settings.js) opens the box, with the "!" while the objective is new; js/input.js takes the tap
function drawQuestButton() {
    if (typeof ctx === "undefined") return;
    _QUESTBTN.x = canvas.width - 22; _QUESTBTN.y = canvas.height - 206 - (typeof SAFE_BOTTOM !== "undefined" ? SAFE_BOTTOM || 0 : 0);
    const { x, y, r } = _QUESTBTN, on = questBoxOpen, f = typeof frame !== "undefined" ? frame : 0;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = on ? "rgba(80,80,80,0.25)" : "rgba(15,15,15,0.88)"; ctx.strokeStyle = on ? "#aaa" : "rgba(100,100,100,0.5)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = on ? "#ccc" : "rgba(140,140,140,0.8)"; ctx.font = "14px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("☰", x, y);
    ctx.fillStyle = on ? "#ccc" : "rgba(120,120,120,0.7)"; ctx.font = "bold 8px monospace"; ctx.textBaseline = "bottom"; ctx.fillText("QUEST", x, y + r + 10);
    if (questBoxUnread()) _qbBang(x + r - 5, y - r + 5, f);
    ctx.restore();
}
// Escape shuts it
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (e && e.key === "Escape" && questBoxOpen) questBoxOpen = false; }); } catch (e) { /* no page (the test sandbox) */ }
