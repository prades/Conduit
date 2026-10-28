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
let _sfEls = null, _sfSig = "";
function partyFlyEl() { return typeof document !== "undefined" && document.getElementById ? document.getElementById("squadFly") : null; }
// the member whose card is open: the last one tapped that is still picked, else the first that is picked; nobody when nothing is picked, when the card was put away (the member
// is still picked: partyFlyPressAway), or when this is not the corners layout
function partyFlySubject() {
    if (_sfAway || !(typeof hudCorners === "function" && hudCorners()) || typeof ccSelectionList !== "function") return null;
    const sel = ccSelectionList().filter(partyIsMember); if (!sel.length) return null;
    return sel.indexOf(_sfLast) >= 0 ? _sfLast : sel[0];
}
function partyFlyBuild(root) {
    if (_sfEls && _sfEls.root === root) return _sfEls;
    root.innerHTML = '<div class="sf-card"><span class="sf-tip"></span><div class="sf-head"><canvas class="sf-thumb" width="64" height="64"></canvas><span class="sf-ht"><b class="sf-name"></b><i class="sf-sub"></i></span></div>'
        + '<div class="sf-tags"></div><div class="sf-hp"><span>HP</span><span class="sb-hp"><u></u></span><em class="sf-hpn"></em></div><div class="sf-kv"><span>POWER<b class="sf-pw"></b></span><span>SPEED<b class="sf-sp"></b></span></div>'
        + '<div class="sf-btns"><button class="sf-btn sf-index" data-act="index">INDEX ▸</button><button class="sf-btn sf-dismiss" data-act="dismiss">DISMISS FROM SQUAD<small>Holds the room it is in</small></button></div></div>';
    root.addEventListener("click", partyFlyClick);
    if (typeof document !== "undefined" && document.addEventListener) document.addEventListener("pointerdown", partyFlyPressAway, true);   // (capture: before the floor's own press)
    const q = s => root.querySelector(s);
    _sfEls = { root, card: q(".sf-card"), thumb: q(".sf-thumb"), name: q(".sf-name"), sub: q(".sf-sub"), tags: q(".sf-tags"), hp: q(".sb-hp u"), hpn: q(".sf-hpn"), pw: q(".sf-pw"), sp: q(".sf-sp"), subject: null, thumbKey: null };
    return _sfEls;
}
function partyFlyClick(ev) {
    const t = ev && ev.target && ev.target.closest ? ev.target : null; if (!t) return;
    const f = _sfEls ? _sfEls.subject : null; if (!f) return;
    const b = t.closest("[data-act]"); if (!b) return;
    const act = b.getAttribute("data-act");
    if (act === "index") { if (typeof unitInfoOpen === "function") unitInfoOpen(f); return; }
    if (act === "dismiss") {
        if (typeof partyRemove === "function") partyRemove([f]);
        _sfLast = null; _sfSig = ""; partyFlyRender(true); if (typeof partyBarRender === "function") partyBarRender(true); if (typeof mixToolRender === "function") mixToolRender(true);
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
function partyFlyRender(force) {
    if (_sfAway && !(typeof ccSelectionList === "function" && ccSelectionList().some(partyIsMember))) _sfAway = false;   // (nobody picked now: the next one picked opens their card)
    const root = partyFlyEl(); if (!root) return;
    const f = partyFlySubject(), bar = typeof _sbEls !== "undefined" ? _sbEls : null, slot = f && bar && f.partySlot !== undefined ? bar.slots[f.partySlot] : null;
    if (!f || !slot) { if (_sfEls) _sfEls.subject = null; if (root.classList) root.classList.remove("on"); _sfSig = ""; return; }
    const E = partyFlyBuild(root); E.subject = f;
    const def = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === f.element) : null, col = def ? def.color : "#19e6c1", st = typeof unitStatus === "function" ? unitStatus(f) : null;
    if (E.card && E.card.style && typeof E.card.style.setProperty === "function") E.card.style.setProperty("--c", col);
    const role = ({ brawler: "BRAWL", sniper: "MAGE", camper: "TECH" })[f.role === "hybrid" ? "brawler" : f.role] || "BRAWL", style = f.playStyle === "defensive" ? "DEF" : f.playStyle === "aggressive" ? "AGG" : "BAL";
    const roleName = ({ brawler: "BRAWLER", sniper: "MAGE", camper: "TECHNICIAN" })[f.role === "hybrid" ? "brawler" : f.role] || "BRAWLER";
    const hp = Math.max(0, Math.round(f.health || 0)), mx = Math.max(1, Math.round(f.maxHealth || 1)), frac = Math.max(0, Math.min(1, hp / mx));
    _sfSet(E.name, "textContent", typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER");
    _sfSet(E.sub, "textContent", (def ? def.label.toUpperCase() : "") + " · LV " + (f.level || 1) + " · " + roleName + (f.evolved ? " · EVOLVED" : ""));
    const tags = [st ? st.text : "FOLLOWING", role, style, "SQUAD"].join("|"), tcol = st ? st.col : "#19e6c1";
    if (_sfSig !== tags + "|" + tcol || force) {
        _sfSig = tags + "|" + tcol; E.tags.innerHTML = "";
        const mk = (cls, txt) => { const s = document.createElement("span"); s.className = cls; s.textContent = txt; return s; };
        const a = mk("sf-tag", st ? st.text : "FOLLOWING"); if (a.style) a.style.background = tcol; E.tags.appendChild(a); E.tags.appendChild(mk("sf-rt", role)); E.tags.appendChild(mk("sf-rt", style)); E.tags.appendChild(mk("sf-rt", "SQUAD"));
    }
    const w = Math.round(frac * 100) + "%", cls = frac > 0.5 ? "" : frac > 0.25 ? "mid" : "low";
    if (E.hp) { if (E.hp.style && E.hp.style.width !== w) E.hp.style.width = w; _sfSet(E.hp, "className", cls); }
    _sfSet(E.hpn, "textContent", hp + " / " + mx); _sfSet(E.pw, "textContent", String(Math.round(f.power || 0))); _sfSet(E.sp, "textContent", String(((f.moveSpeed || 0) * 1000).toFixed(0)));
    const key = f.evolved + "|" + f.element + "|" + (f.id || ""); if (E.thumbKey !== key && typeof _ccThumb === "function" && E.thumb) { E.thumbKey = key; _ccThumb(E.thumb, f); }
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
