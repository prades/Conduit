// ─────────────────────────────────────────────────────────
//  A SQUAD MEMBER'S CARD, ON THE FLY (the facility's corners layout: docs/UI-STYLE.md "The HUD", docs/TUTORIAL.md "The squad")
// ─────────────────────────────────────────────────────────
// ASKED: "the on screen squad roster should shuffle into the nook above the attack menu to the left, remove the element picker and replace with 'all' button the player can select each squad member and pull their card roster information up on the fly and
// may choose to dismiss from squad from this little side menu and index." The squad's three cards stand over RETREAT / HOLD / COME at the bottom left (js/party.js, game.html "THE CORNERS"); a tap on one picks that member (the orders go to them alone,
// the battle tool says so, and ALL lets them go) and opens THEIR CARD beside the stack: the picture, the name, element, level and role, how they are (their state, health, power and speed), INDEX (the unit info: attacks, jobs and stats, js/unitinfo.js)
// and DISMISS FROM SQUAD (they hold the room they are in, as REMOVE does in the roster: js/party.js partyRemove). It is for a tablet or a desktop (hudCorners); a phone keeps the bar it has, with the i on each card for its INFO.
// ASKED: "it would not be on the home screen side HUD roster. I think it would be in the main roster with all the creatures in the separate window." EXILE is not on this card: it is in the roster
// (js/commandcenter.js; on a phone, the ROSTER's cards: js/radialmenu.js).
// REPORTED: "when I select a creature from my squad and it pulls up ... the little index card, when I click away, it should still have that character selected, but the card should go away."
// A press anywhere but on the card or the stack puts the card away and leaves the member picked (partyFlyPressAway); the next member tapped on the stack opens their card again.
// ASKED (2026-11-01): "be able to equip different equipment cards from the on-screen roster open tab, like the active squad bar." ITS TWO EQUIP CARD SLOTS are on the card (CARD 1 and CARD 2, as on the roster's
// settings column: js/cardsui.js equipRosterDraw): tap a slot for the hand's cards (EMPTY, then each card, the ones that do not fit saying why), tap one and the member wears it at once (js/cards.js equipPut),
// its rarity chip beside the name; one list is open at a time, and a press away closes the card as before.
let _sfEls = null, _sfSig = "", _sfDD = null;   // _sfDD: the slot whose list of cards is open on the card (0, 1 or "sp", its SPECIAL ATTACK), or null
function partyFlyEl() { return typeof document !== "undefined" && document.getElementById ? document.getElementById("squadFly") : null; }
// the member whose card is open: the last one tapped that is still picked, else the first that is picked; nobody when nothing is picked, when the card was put away (the member
// is still picked: partyFlyPressAway), or when this is not the corners layout
function partyFlySubject() {
    if (_sfAway || !(typeof hudCorners === "function" && hudCorners()) || typeof ccSelectionList !== "function") return null;
    const sel = ccSelectionList().filter(u => typeof partySquadHas === "function" ? partySquadHas(u) : partyIsMember(u)); if (!sel.length) return null;   // (a member, or the Mutator's clone: js/party.js partyClone)
    return sel.indexOf(_sfLast) >= 0 ? _sfLast : sel[0];
}
function partyFlyBuild(root) {
    if (_sfEls && _sfEls.root === root) return _sfEls;
    root.innerHTML = '<div class="sf-card"><span class="sf-tip"></span><div class="sf-head"><canvas class="sf-thumb" width="64" height="64"></canvas><span class="sf-ht"><b class="sf-name"></b><i class="sf-sub"></i></span></div>'
        + '<div class="sf-tags"></div><div class="sf-hp"><span>HP</span><span class="sb-hp"><u></u></span><em class="sf-hpn"></em></div><div class="sf-xp"><span>XP</span><span class="sb-xp"><u></u></span><em class="sf-xpn"></em></div><div class="sf-evo"></div><div class="sf-kv"><span>POWER<b class="sf-pw"></b></span><span>SPEED<b class="sf-sp"></b></span></div>'
        + '<div class="sf-cards"></div>'
        + '<div class="sf-btns sf-swaprow"><button class="sf-btn sf-swap" data-act="swap">SWAP PLACES ⇄<small class="sf-swapw"></small></button></div>'   // (GRAVITY ENGINEER's SWAP: shown only while that role is awake, js/playercards.js)
        + '<div class="sf-btns"><button class="sf-btn sf-index" data-act="index">INDEX ▸</button><button class="sf-btn sf-dismiss" data-act="dismiss">DISMISS FROM SQUAD<small>Holds the room it is in</small></button></div></div>';
    root.addEventListener("click", partyFlyClick);
    if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("pointerdown", partyFlyPressAway, true);   // (capture: before the floor's own press)
    const q = s => root.querySelector(s);
    _sfEls = { root, card: q(".sf-card"), thumb: q(".sf-thumb"), name: q(".sf-name"), sub: q(".sf-sub"), tags: q(".sf-tags"), hp: q(".sb-hp u"), hpn: q(".sf-hpn"), xp: q(".sf-xp .sb-xp u"), xpn: q(".sf-xpn"), evo: q(".sf-evo"), pw: q(".sf-pw"), sp: q(".sf-sp"), cards: q(".sf-cards"), cardSig: "", subject: null, thumbKey: null };
    return _sfEls;
}
function partyFlyClick(ev) {
    const t = ev && ev.target && ev.target.closest ? ev.target : null; if (!t) return;
    const f = _sfEls ? _sfEls.subject : null; if (!f) return;
    // A CARD SLOT's list: a card picked goes on (EMPTY takes the card off); the slot's own row opens or shuts its list (one open at a time)
    const o = t.closest(".sf-opt");
    if (o) { if (o.disabled) return; const raw = o.getAttribute("data-slot"), id = o.getAttribute("data-card") || null; if (raw === "alt") { if (typeof followerAltSet === "function") followerAltSet(f, id); } else if (raw === "sp") { if (typeof equipSpecialPut === "function") equipSpecialPut(f, id); } else if (typeof equipPut === "function") equipPut(f, +raw, id); _sfDD = null; partyFlyRender(true); if (typeof partyBarRender === "function") partyBarRender(true); return; }
    const s = t.closest(".sf-slot");
    if (s) { if (s.disabled) return; const raw = s.getAttribute("data-slot"), slot = raw === "sp" || raw === "alt" ? raw : +raw; _sfDD = _sfDD === slot ? null : slot; partyFlyRender(true); return; }
    const b = t.closest("[data-act]"); if (!b) return;
    const act = b.getAttribute("data-act");
    if (act === "index") { if (typeof unitInfoOpen === "function") unitInfoOpen(f); return; }
    if (act === "swap") { if (typeof playerSwap === "function") { const r = playerSwap(f); if (!r.ok && typeof _pcSay === "function") _pcSay(r.why, "#ff9c8a"); } partyFlyRender(true); return; }   // (GRAVITY ENGINEER: js/playercards.js)
    if (act === "dismiss") {
        if (typeof partyRemove === "function") partyRemove([f]);
        _sfLast = null; _sfSig = ""; _sfDD = null; partyFlyRender(true); if (typeof partyBarRender === "function") partyBarRender(true); if (typeof mixToolRender === "function") mixToolRender(true);
    }
}
// A press anywhere but on the card or on the stack (the floor, the orders, the enemy card, the dock) puts the card away; the member stays picked, so the orders still go to them
// alone. A tap on the stack picks or lets go as it did (js/party.js partyBarClick). A press on the unit info (the card's INDEX, the stack's i: js/unitinfo.js) or while the
// card is hidden (the Command Center) is not one away from it: closing those brings it back.
function partyFlyPressAway(ev) {
    const E = _sfEls; if (!E || !E.subject || (typeof E.root.getClientRects === "function" && !E.root.getClientRects().length)) return;
    const t = ev && ev.target && ev.target.closest ? ev.target : null;
    if (t && (t.closest(".sf-card") || t.closest("#squadBar") || t.closest("#unitInfo"))) return;
    _sfAway = true; partyFlyRender(true);
}
function _sfSet(el, prop, v) { if (el && el[prop] !== v) el[prop] = v; }
// GRAVITY ENGINEER's SWAP (a Player card: js/playercards.js): its row is on the card only while that role is awake; it says when it is ready, or why it cannot be used with this member, and is off until it can
function _sfSwapDraw(E, f) {
    const row = E.root.querySelector ? E.root.querySelector(".sf-swaprow") : null, b = row && row.querySelector ? row.querySelector(".sf-swap") : null, w = row && row.querySelector ? row.querySelector(".sf-swapw") : null; if (!row) return;
    const st = typeof playerSwapState === "function" ? playerSwapState() : null, v = st ? "" : "none"; if (row.style && row.style.display !== v) row.style.display = v; if (!st) return;
    const why = typeof playerSwapWhyNot === "function" ? playerSwapWhyNot(f) : null;
    if (w) _sfSet(w, "textContent", why || "YOU TAKE ITS PLACE, IT TAKES YOURS"); if (b) _sfSet(b, "disabled", !!why);
}
// ITS TWO EQUIP CARD SLOTS (js/cards.js; the same rows as the roster's CARD 1 and CARD 2, js/cardsui.js equipRosterDraw): the slot's row names the card it wears (EMPTY when none; NO CARDS IN YOUR HAND, and no list, when the hand
// is empty), with the card's rarity chip; its list, when it is open, is EMPTY and then every card the hand holds, the ones that do not fit this follower disabled and saying why, the one worn lit. Redrawn only when any of it changes.
function _sfCardsDraw(E, f) {
    const box = E.cards; if (!box) return;
    const can = !!f && f.isFollower === true && !f.isClone && typeof equipSlots === "function" && typeof EQUIP !== "undefined";
    const ev = typeof followerMoveDef === "function" ? followerMoveDef(f) : null, altIds = ev && typeof evoMoveIds === "function" ? evoMoveIds(ev).filter(id => evoMoveAllowed(f, ev, id)) : [];   // (its alternates: js/moves.js; BASH before it evolves, build 2026-11-07ss)
    const sig = can || altIds.length ? [can && typeof equipSig === "function" ? equipSig(f) : "", _sfDD, f.uid || f.id || "", f.alt || "", altIds.join()].join("|") : "";
    if (sig === E.cardSig) return;
    E.cardSig = sig; box.textContent = ""; if (box.style) box.style.display = can || altIds.length ? "" : "none"; if (!can && !altIds.length) return;
    const all = typeof equipUsableCards === "function" ? equipUsableCards() : [], chip = c => typeof _cdChip === "function" ? _cdChip(c, true) : null;
    const mk = (tag, cls, txt) => { const e = document.createElement(tag); e.className = cls; if (txt != null) e.textContent = txt; return e; };
    // ITS ATTACK (the owner, 2026-11-07: "the alternate attacks must be visible from the index and the pop out menu on the HUD"): NORMAL ATTACK, or one alternate it is locked to (js/moves.js followerAltSet)
    if (altIds.length) {
        const cur = typeof evoMoveOf === "function" ? evoMoveOf(f, ev) : null, open = _sfDD === "alt";
        const b = mk("button", "sf-slot sp" + (open ? " open" : "")); b.type = "button"; b.setAttribute("data-slot", "alt");
        b.appendChild(mk("span", "sf-sk", "ATTACK")); b.appendChild(mk("span", "sf-sv", cur ? cur.name + (f._altWind > 0 ? " · WINDING UP" : typeof altCools === "function" && altCools(f) && (f._altReadyAt || 0) > (typeof frame !== "undefined" ? frame : 0) ? " · COOLING DOWN" : " · LOCKED ON") : "NORMAL ATTACK")); b.appendChild(mk("span", "sf-sa", open ? "\u25b4" : "\u25be"));
        box.appendChild(b);
        if (open) {
            const list = mk("div", "sf-slot-list"), opt = (label, sub, on, id) => { const el = mk("button", "sf-opt" + (on ? " on" : "")); el.type = "button"; el.setAttribute("data-slot", "alt"); el.setAttribute("data-card", id || ""); el.appendChild(mk("span", "sf-ol", label)); el.appendChild(mk("small", "sf-os", sub)); list.appendChild(el); };
            opt("NORMAL ATTACK", "ITS EVERYDAY HITS", !cur, null);
            for (const id of altIds) opt(MOVES[id].name, "LOCKED ON · WINDS UP IN PLACE", !!cur && cur.id === id, id);   // (short: the owner, 2026-11-07, "use shortened text")
            box.appendChild(list);
        }
    }
    if (!can) return;
    // CARD 1 and CARD 2 list the cards that are not card attacks; SPECIAL ATTACK ("sp": the owner, 2026-11-06, "Including access main hud") lists the card attacks (js/cards.js equipSpecialWhyNot). Only the cards the
    // slot can take are listed, and the one worn, each with its short text (the owner, 2026-11-07: "don't display cards that aren't available to the follower, and use shortened text": js/cards.js equipShortText)
    for (const slot of [0, 1].concat(typeof equipSpecialFor === "function" && equipSpecialFor(f) ? ["sp"] : [])) {   // (its SPECIAL ATTACK only on a form some card attack is for)
        const sp = slot === "sp", hand = all.filter(c => !!c.attack === sp), why0 = c => sp ? equipSpecialWhyNot(f, c.id) : equipWhyNot(f, c.id, slot);
        const cur = sp ? f.special || null : equipSlots(f)[slot], card = typeof equipCard === "function" ? equipCard(cur) : null, shown = hand.filter(c => c.id === cur || !why0(c));
        const usable = !!card || shown.length > 0, open = _sfDD === slot && usable;   // (a slot with no card on and none that fits it is off: nothing to list)
        const b = mk("button", "sf-slot" + (open ? " open" : "") + (usable ? "" : " off") + (sp ? " sp" : "")); b.type = "button"; b.setAttribute("data-slot", String(slot));
        b.appendChild(mk("span", "sf-sk", sp ? "SPECIAL ATTACK" : "CARD " + (slot + 1))); b.appendChild(mk("span", "sf-sv", usable ? (card ? card.name : "EMPTY") : hand.length ? "NO CARD FITS" : sp ? "NO CARD ATTACKS IN YOUR HAND" : "NO CARDS IN YOUR HAND"));
        if (card) { const ch = chip(card); if (ch) b.appendChild(ch); }
        b.appendChild(mk("span", "sf-sa", open ? "▴" : "▾"));
        if (!usable) b.disabled = true;
        box.appendChild(b);
        if (!open) continue;
        const list = mk("div", "sf-slot-list");
        const opt = (label, sub, on, off, id, c) => { const el = mk("button", "sf-opt" + (on ? " on" : "")); el.type = "button"; el.setAttribute("data-slot", String(slot)); el.setAttribute("data-card", id || ""); el.appendChild(mk("span", "sf-ol", label)); if (sub) el.appendChild(mk("small", "sf-os", sub)); if (c) { const ch = chip(c); if (ch) el.appendChild(ch); const fx = typeof equipShortText === "function" ? equipShortText(c) : c.text; if (fx) el.appendChild(mk("small", "sf-ofx", fx)); } if (off) el.disabled = true; list.appendChild(el); };   // (sf-ofx: what the card does, short)
        opt("EMPTY", cur ? "TAKE IT OFF" : "", !cur, !cur, null, null);
        shown.forEach(c => opt(c.name, "", c.id === cur, false, c.id, c));
        box.appendChild(list);
    }
}
function partyFlyRender(force) {
    const has = u => typeof partySquadHas === "function" ? partySquadHas(u) : partyIsMember(u);
    if (_sfAway && !(typeof ccSelectionList === "function" && ccSelectionList().some(has))) _sfAway = false;   // (nobody picked now: the next one picked opens their card)
    const root = partyFlyEl(); if (!root) return;
    const f = partyFlySubject(), bar = typeof _sbEls !== "undefined" ? _sbEls : null, slot = f && bar ? (f.isClone ? bar.clone || null : f.partySlot !== undefined ? bar.slots[f.partySlot] : null) : null;   // (the clone's card is its own: js/party.js _partyCloneCard)
    if (!f || !slot) { if (_sfEls) { _sfEls.subject = null; _sfEls.cardSig = ""; } _sfDD = null; if (root.classList) root.classList.remove("on"); _sfSig = ""; return; }
    const E = partyFlyBuild(root); if (E.subject !== f) { _sfDD = null; E.cardSig = ""; E.thumbKey = null; } E.subject = f;   // (another member's card: its own slots, no list open)
    const clone = !!f.isClone, def = !clone && typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === f.element) : null, col = clone ? (typeof PARTY_CLONE_COL !== "undefined" ? PARTY_CLONE_COL : "#c06bff") : def ? def.color : "#19e6c1", st = typeof unitStatus === "function" ? unitStatus(f) : null;
    if (E.card && E.card.style && typeof E.card.style.setProperty === "function") E.card.style.setProperty("--c", col);
    if (typeof cardArtUnitClass === "function") cardArtMark(E.card, clone ? "" : cardArtUnitClass(f));   // its backdrop (js/cardart.js); a clone has no element or class to show
    const role = ({ brawler: "BRAWL", sniper: "MAGE", camper: "TECH" })[f.role === "hybrid" ? "brawler" : f.role] || "BRAWL", style = f.playStyle === "defensive" ? "DEF" : f.playStyle === "aggressive" ? "AGG" : "BAL";
    const roleName = ({ brawler: "BRAWLER", sniper: "MAGE", camper: "TECHNICIAN" })[f.role === "hybrid" ? "brawler" : f.role] || "BRAWLER";
    const hp = Math.max(0, Math.round(f.health || 0)), mx = Math.max(1, Math.round(f.maxHealth || 1)), frac = Math.max(0, Math.min(1, hp / mx));
    _sfSet(E.name, "textContent", typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER");
    _sfSet(E.sub, "textContent", clone ? String(f.speciesName || "").toUpperCase() + " " + String(f.className || "scout").toUpperCase() + " · LV " + (f.level || 1) + " · THE MUTATOR'S CLONE"
                                        : (def ? def.label.toUpperCase() : "") + " · LV " + (f.level || 1) + " · " + roleName + (f.evolved ? " · EVOLVED" : ""));
    const tagList = clone ? [st ? st.text : "FOLLOWING", "CLONE", "SQUAD"] : [st ? st.text : "FOLLOWING", role, style, "SQUAD"], tags = tagList.join("|"), tcol = st ? st.col : "#19e6c1";
    if (_sfSig !== tags + "|" + tcol || force) {
        _sfSig = tags + "|" + tcol; E.tags.innerHTML = "";
        const mk = (cls, txt) => { const s = document.createElement("span"); s.className = cls; s.textContent = txt; return s; };
        const a = mk("sf-tag", tagList[0]); if (a.style) a.style.background = tcol; E.tags.appendChild(a); for (const t of tagList.slice(1)) E.tags.appendChild(mk("sf-rt", t));
    }
    { const dm = E.root.querySelector ? E.root.querySelector(".sf-dismiss") : null; if (dm && dm.style) { const v = clone ? "none" : ""; if (dm.style.display !== v) dm.style.display = v; } }   // (a clone is not dismissed from the squad: it is released at the Clone Bay)
    const w = Math.round(frac * 100) + "%", cls = frac > 0.5 ? "" : frac > 0.25 ? "mid" : "low";
    if (E.hp) { if (E.hp.style && E.hp.style.width !== w) E.hp.style.width = w; _sfSet(E.hp, "className", cls); }
    { const p = typeof xpProgress === "function" ? xpProgress(f) : null;   // its XP: how far through its level, and (until it evolves) how far from evolving (js/levels.js)
      if (E.xp && E.xp.style && p) { const xw = Math.round(p.frac * 100) + "%"; if (E.xp.style.width !== xw) E.xp.style.width = xw; }
      if (E.xpn) _sfSet(E.xpn, "textContent", p ? (p.max ? "MAX" : Math.round(p.into) + " / " + Math.round(p.ask)) : "");
      if (E.evo) { _sfSet(E.evo, "textContent", p ? (p.evo ? xpEvoText(p) : f.evolved ? "EVOLVED" : "") : ""); if (E.evo.classList) E.evo.classList.toggle("soon", !!(p && p.evo && p.evo.levels <= 1)); } }
    _sfSet(E.hpn, "textContent", hp + " / " + mx); _sfSet(E.pw, "textContent", String(Math.round(f.power || 0))); _sfSet(E.sp, "textContent", String(((f.moveSpeed || 0) * 1000).toFixed(0)));
    _sfCardsDraw(E, f);   // its two equip card slots
    _sfSwapDraw(E, f);    // GRAVITY ENGINEER's SWAP, while that role is awake
    const key = clone ? "clone|" + f.speciesName + "|" + f.className : f.evolved + "|" + f.element + "|" + (f.id || "");
    if (E.thumbKey !== key && E.thumb) { if (clone && typeof partyCloneThumb === "function") { E.thumbKey = key; partyCloneThumb(E.thumb, f); } else if (typeof _ccThumb === "function") { E.thumbKey = key; _ccThumb(E.thumb, f); } }
    // beside the member's own card: its top lines up with the card's, and it stands to the right of the stack; it keeps clear of the dock and of the enemy card where they lie
    // under it (it goes up as far as it must: a lower member's card, a narrow screen), and its tip still points at the member's card
    if (root.classList) root.classList.add("on");
    if (typeof slot.getBoundingClientRect === "function" && root.style) {
        const r = slot.getBoundingClientRect(), br = bar && bar.root && bar.root.getBoundingClientRect ? bar.root.getBoundingClientRect() : r, H = typeof innerHeight === "number" ? innerHeight : 700;
        const left = Math.round(br.right + 18), own = typeof root.getBoundingClientRect === "function" ? root.getBoundingClientRect() : null, cw = own && own.width || 340, ch = own && own.height || 322;
        let floor = H - 8;
        for (const sel of ["#topToggles", "#mixTool .mt-foe"]) {   // (the dock; the enemy card, while a creature is locked)
            const el = typeof document !== "undefined" && document.querySelector ? document.querySelector(sel) : null, q = el && typeof el.getBoundingClientRect === "function" ? el.getBoundingClientRect() : null;
            if (q && q.width > 0 && q.height > 0 && q.left < left + cw && q.right > left) floor = Math.min(floor, q.top - 8);
        }
        const top = Math.round(Math.max(8, Math.min(r.top - 4, floor - ch)));
        root.style.left = left + "px"; root.style.top = top + "px";
        const tip = root.querySelector ? root.querySelector(".sf-tip") : null, tt = Math.round(Math.max(10, Math.min(r.top + 18 - top, ch - 34))) + "px";
        if (tip && tip.style && tip.style.top !== tt) tip.style.top = tt;
    }
}
