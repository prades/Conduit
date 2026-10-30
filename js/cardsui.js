// ─────────────────────────────────────────────────────────
//  THE EQUIP CARDS' SCREENS (js/cards.js has the rules; the Notion "Conduit Game Design Archive" has the design)
// ─────────────────────────────────────────────────────────
// ASKED (chosen with the user): "The CARDS screen is a new dock button on tablet and desktop. Phones get it in a later update", the card slots on the roster, "Illuminated bars" for the rarity, and a start-of-run choice of up to three cards.
//
//   THE ROSTER  (the Command Center's carousel, js/commandcenter.js): beside the creature in view, CARD 1 and CARD 2 as drop-downs under its styles, listing the hand: what does not fit says why, and with no card in the hand
//               they say so; its SUBCLASS (a row, and a tag on its picture) is under RE-ROLL / INFO / EXILE, which a small tablet must still show. A phone's roster has none of this yet.
//   CARDS       the dock's button opens a screen over the game, as the Command Center does: YOUR HAND (the card types taken into this run, up to three), YOU (the player's two Universal slots), and THE COLLECTION
//               (every card: unlocked or locked; UNLOCK for EQUIP.unlockCost shards, two taps; TAKE INTO THE RUN or PUT BACK). Rarity is a row of six bars, one lit for each step.
//   A NEW RUN   the same screen opens by itself, with a banner and a START button, when a run begins and the collection holds a card (js/cards.js equipRunStart).
// Nothing here is drawn on the canvas, and nothing runs in a frame: the screen redraws only when what it shows has changed (a redraw under a finger loses the tap).

let cardsPanelOpen = false, _cdOpts = {}, _cdSig = "", _cdTimer = 0, _cdDD = null, _cdArm = null;   // _cdDD: the player's slot whose list is open; _cdArm: { id, until }, a card whose UNLOCK is armed
const CARDS_ARM_MS = 3000;

function _cdEl(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function _cdClick(el, fn) { el.addEventListener("click", ev => { ev.stopPropagation(); fn(ev); }); }
function _cdNow() { return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now(); }

// ── the dock's button (game.html): always there; with no card to show, the sheet says so ──
function cardsToggle() { if (cardsPanelOpen) cardsClose(); else cardsOpen(); }
function cardsOpen(opts) {
    const root = document.getElementById("cardsRoot"); if (!root) return false;
    _cdOpts = opts || {}; _cdDD = null; _cdArm = null; _cdSig = ""; cardsPanelOpen = true;
    root.classList.add("open"); if (document.body) document.body.classList.add("cardsOpen");
    clearInterval(_cdTimer); _cdTimer = setInterval(cardsRender, 400);
    cardsRender(); return true;
}
function cardsClose() {
    cardsPanelOpen = false; _cdOpts = {}; _cdDD = null; _cdArm = null; _cdSig = ""; clearInterval(_cdTimer); _cdTimer = 0;
    const root = document.getElementById("cardsRoot"); if (root) { root.classList.remove("open"); root.textContent = ""; }
    if (document.body) document.body.classList.remove("cardsOpen");
}

// ── one card, as a slab ──
function _cdBars(c) {
    const n = equipRarityBars(c), box = _cdEl("span", "cd-bars"); box.title = equipRarityLabel(c);
    for (let i = 0; i < EQUIP_RARITIES.length; i++) box.appendChild(_cdEl("i", i < n ? "on" : ""));
    return box;
}
function _cdKindCol(c) { return c.kind === "element" ? ((typeof ELEMENTS !== "undefined" && ELEMENTS.find(e => e.id === c.match)) || {}).color || "#8fe3ff" : c.kind === "universal" ? "#ffe733" : "#8fe3ff"; }
function _cdSlab(c, extra) {
    const s = _cdEl("div", "cd-card" + (extra ? " " + extra : "")); s.style.setProperty("--c", _cdKindCol(c));
    const top = _cdEl("div", "cd-top"); top.appendChild(_cdBars(c)); top.appendChild(_cdEl("span", "cd-rar", equipRarityLabel(c))); s.appendChild(top);
    s.appendChild(_cdEl("div", "cd-name", c.name)); s.appendChild(_cdEl("div", "cd-kind", equipKindLabel(c)));
    s.appendChild(_cdEl("div", "cd-text", c.text || "")); return s;
}
function _cdBtn(label, sub, col, fn, disabled) {
    const b = _cdEl("button", "cd-btn"); b.style.setProperty("--c", col || "#19e6c1"); b.appendChild(_cdEl("span", "cd-bl", label)); if (sub) b.appendChild(_cdEl("span", "cd-bs", sub));
    if (disabled) b.disabled = true; else _cdClick(b, () => { fn(); cardsRender(true); }); return b;
}
// the collection's slab, with what can be done with it
function _cdCollectionCard(c) {
    const own = equipOwns(c.id), inHand = equipInHand(c.id), s = _cdSlab(c, own ? (inHand ? "hand" : "") : "locked");
    if (!own) {
        const why = equipUnlockWhyNot(c.id), armed = _cdArm && _cdArm.id === c.id && _cdNow() < _cdArm.until;
        s.appendChild(_cdBtn(armed ? "TAP AGAIN TO UNLOCK" : "UNLOCK ◆" + EQUIP.unlockCost, why || (armed ? "◆" + EQUIP.unlockCost + " OF YOUR SHARDS, FOR GOOD" : "FOR GOOD, EVERY RUN"), "#ffe733", () => {
            if (_cdArm && _cdArm.id === c.id && _cdNow() < _cdArm.until) { _cdArm = null; equipUnlock(c.id); } else _cdArm = { id: c.id, until: _cdNow() + CARDS_ARM_MS };
        }, !!why));
        return s;
    }
    const worn = equipWearers(c.id);
    if (inHand) s.appendChild(_cdBtn("IN YOUR HAND ✓", "PUT IT BACK" + (worn ? " · COMES OFF " + worn : ""), "#19e6c1", () => equipHandRemove(c.id)));
    else { const full = equipHand.length >= equipHandCap(); s.appendChild(_cdBtn("TAKE INTO THE RUN", full ? "YOUR HAND IS FULL (" + EQUIP.startPick + ")" : "", "#19e6c1", () => equipHandAdd(c.id), full)); }
    return s;
}
// the player's two slots: each opens a list of the Universal cards in the hand
function _cdPlayerSlot(slot) {
    const box = _cdEl("div", "cd-pslot"), id = equipPlayer[slot], c = equipCard(id), open = _cdDD === slot;
    const head = _cdEl("button", "cd-pbtn" + (c ? " full" : "") + (open ? " open" : "")); head.appendChild(_cdEl("span", "cd-pk", "YOUR SLOT " + (slot + 1))); head.appendChild(_cdEl("span", "cd-pv", c ? c.name : "EMPTY"));
    if (c) head.appendChild(_cdBars(c));
    _cdClick(head, () => { _cdDD = open ? null : slot; cardsRender(true); }); box.appendChild(head);
    if (open) {
        const list = _cdEl("div", "cd-plist"), hand = equipHandCards();
        list.appendChild(_cdBtn("EMPTY", id ? "TAKE THE CARD OFF" : "", "#8aa0c8", () => { equipPlayerPut(slot, null); _cdDD = null; }, !id));
        hand.forEach(h => { const why = equipPlayerWhyNot(h.id, slot); list.appendChild(_cdBtn(h.name, why || equipRarityLabel(h), "#19e6c1", () => { equipPlayerPut(slot, h.id); _cdDD = null; }, !!why)); });
        if (!hand.length) list.appendChild(_cdEl("div", "cd-note", "NO CARD IN YOUR HAND"));
        box.appendChild(list);
    }
    return box;
}

// ── the screen: drawn once per change ──
function _cdSigNow() {
    const all = Object.keys(equipCards()), have = typeof shardCount === "number" ? shardCount : 0;
    return [cardsPanelOpen, !!_cdOpts.start, all.map(id => (equipOwns(id) ? "o" : have >= EQUIP.unlockCost ? "a" : "l") + (equipInHand(id) ? "h" : "") + equipWearers(id)).join(), equipHand.join(), equipPlayer.join(), _cdDD,
        _cdArm && _cdNow() < _cdArm.until ? _cdArm.id : ""].join("|");
}
function cardsRender(force) {
    const root = document.getElementById("cardsRoot"); if (!root || !cardsPanelOpen) return;
    const sh = root.querySelector(".cd-sh-n"); if (sh) { const t = "◆ " + (typeof shardCount === "number" ? shardCount : 0); if (sh.textContent !== t) sh.textContent = t; }
    const sg = _cdSigNow(); if (!force && sg === _cdSig && root.firstChild) return; _cdSig = sg;
    const keep = root.querySelector(".cd-body") ? root.querySelector(".cd-body").scrollTop : 0;
    root.textContent = "";
    const owned = equipOwnedList().length, all = Object.values(equipCards()), start = !!_cdOpts.start;
    const head = _cdEl("div", "cd-head"), tb = _cdEl("div", "cd-titlebox");
    tb.appendChild(_cdEl("div", "cd-title", "CARDS")); tb.appendChild(_cdEl("div", "cd-summary", "HAND " + equipHand.length + (equipDev === "all" ? "" : " / " + EQUIP.startPick) + " · " + owned + " OF " + all.length + " UNLOCKED" + (equipDev ? " · TEST CARDS (?cards)" : ""))); head.appendChild(tb);
    const sb = _cdEl("div", "cd-shards"); sb.appendChild(_cdEl("div", "cd-sh-n", "◆ " + (typeof shardCount === "number" ? shardCount : 0))); sb.appendChild(_cdEl("div", "cd-sh-c", "YOUR SHARDS · A CARD COSTS ◆" + EQUIP.unlockCost)); head.appendChild(sb);
    const x = _cdEl("button", "cd-close", start ? "START THE RUN ▸" : "✕ CLOSE"); _cdClick(x, cardsClose); head.appendChild(x); root.appendChild(head);
    const body = _cdEl("div", "cd-body");
    if (start) body.appendChild(_cdEl("div", "cd-banner", "A NEW RUN · CHOOSE UP TO " + EQUIP.startPick + " CARDS TO TAKE WITH YOU, THEN START"));
    const sec = (t, sub) => { const h = _cdEl("div", "cd-sec", t); if (sub) h.appendChild(_cdEl("i", null, sub)); body.appendChild(h); };
    sec("YOUR HAND", equipHand.length ? "THE CARDS YOU CAN WEAR THIS RUN · EACH CAN BE WORN BY ANY NUMBER OF FOLLOWERS" : equipAny() ? "EMPTY · TAKE CARDS FROM THE COLLECTION BELOW" : "EMPTY");
    const hand = _cdEl("div", "cd-row"); const cap = equipDev === "all" ? equipHand.length : EQUIP.startPick;
    for (let i = 0; i < Math.max(cap, 0); i++) { const c = equipCard(equipHand[i]); if (c) { const s = _cdSlab(c, "hand"); s.appendChild(_cdEl("div", "cd-worn", equipWearers(c.id) ? "WORN BY " + equipWearers(c.id) : "NOT WORN")); hand.appendChild(s); } else { const e = _cdEl("div", "cd-card cd-empty"); e.appendChild(_cdEl("div", "cd-name", "EMPTY")); hand.appendChild(e); } }
    body.appendChild(hand);
    sec("YOU", "THE PLAYER WEARS TWO UNIVERSAL CARDS · EACH FOLLOWER'S TWO ARE ON ITS ROSTER PAGE");
    const you = _cdEl("div", "cd-you"); you.appendChild(_cdPlayerSlot(0)); you.appendChild(_cdPlayerSlot(1)); body.appendChild(you);
    sec("THE COLLECTION", "UNLOCKED FOR GOOD · IT SURVIVES A NEW GAME");
    const grid = _cdEl("div", "cd-grid"); all.forEach(c => grid.appendChild(_cdCollectionCard(c))); body.appendChild(grid);
    if (!all.length) body.appendChild(_cdEl("div", "cd-note", "NO CARDS YET · THE FIRST ONES ARE STILL BEING DESIGNED"));
    root.appendChild(body); body.scrollTop = keep;
}

// ── the roster (js/commandcenter.js _ccDrawSettings): the creature in view's subclass, and its two slots ──
function equipSig(f) {   // what the settings column must redraw for
    if (!f || f.isClone || f.isFollower !== true) return "";
    return [equipSubclassOf(f), equipSlots(f).join(","), equipHand.join(",")].join("|");
}
function _cdSubclassNote(f) {
    const s = equipSubclassOf(f);
    if (s) return equipSubclassLabel(s);
    return f.evolved ? "NONE · A RETIRED FORM" : "NONE YET · IT HAS NOT EVOLVED";
}
function equipSubclassRow(side, f) {   // (drawn under the buttons, above the stats)
    if (!f || f.isClone || f.isFollower !== true || typeof _ccEl !== "function") return;
    const idx = _ccEl("div", "cc-stats"), row = _ccEl("div", "cc-stat"); row.appendChild(_ccEl("span", "cc-stat-k", "SUBCLASS")); row.appendChild(_ccEl("span", "cc-stat-v", _cdSubclassNote(f))); idx.appendChild(row); side.appendChild(idx);
}
function equipRosterDraw(side, f) {   // (drawn under the styles)
    if (!f || f.isClone || f.isFollower !== true || typeof _ccEl !== "function") return;
    const hand = equipHandCards();
    for (let slot = 0; slot < EQUIP.followerSlots; slot++) {
        const cur = equipSlots(f)[slot], card = equipCard(cur), opts = [];
        opts.push({ label: "EMPTY", col: "#8aa0c8", on: !cur, off: !cur, sub: cur ? "TAKE THE CARD OFF" : "", fn: () => { equipPut(f, slot, null); } });
        hand.forEach(c => { const why = equipWhyNot(f, c.id, slot); opts.push({ label: c.name, col: "#19e6c1", on: c.id === cur, off: !!why && c.id !== cur, sub: (why && c.id !== cur ? why : equipKindLabel(c) + " · " + equipRarityLabel(c)), fn: () => { equipPut(f, slot, c.id); } }); });
        _ccDropdown(side, "card" + slot, "CARD " + (slot + 1), card ? card.name : "EMPTY", "#ffe733", opts, hand.length ? null : "NO CARDS IN YOUR HAND");
    }
}

function initCardsUi() {
    if (typeof document === "undefined" || !document.body || document.getElementById("cardsRoot")) return;
    const root = _cdEl("div"); root.id = "cardsRoot"; document.body.appendChild(root);
    window.addEventListener("keydown", e => { if (e && e.key === "Escape" && cardsPanelOpen) cardsClose(); });
}
try { initCardsUi(); } catch (e) { /* no page (the test sandbox): the rules in js/cards.js still work */ }
