// ─────────────────────────────────────────────────────────
//  THE EQUIP CARDS' SCREENS (js/cards.js has the rules; the Notion "Conduit Game Design Archive" has the design)
// ─────────────────────────────────────────────────────────
// ASKED (chosen with the user): "The CARDS screen is a new dock button on tablet and desktop. Phones get it in a later update", the card slots on the roster, "Illuminated bars" for the rarity, and a start-of-run choice of up to three cards.
//
//   THE ROSTER  (the Command Center's carousel, js/commandcenter.js): beside the creature in view, CARD 1 and CARD 2 as drop-downs under its styles, listing the hand: what does not fit says why, and with no card in the hand
//               they say so; its SUBCLASS (a row, and a tag on its picture) is under RE-ROLL / INFO / EXILE, which a small tablet must still show. A phone's roster has none of this yet.
//   YOU         (build 2026-11-01l; the owner: "a new player icon and player card in the roster that the player can equip their cards to their own player") the strip's first tile is the player; in view, the player's card
//               shows its two cards, and YOUR SLOT 1 and YOUR SLOT 2 are its drop-downs (Universal cards only: equipPlayerRosterDraw below).
//   CARDS       the dock's button opens a screen over the game, as the Command Center does: THE COLLECTION (every card: unlocked or locked; UNLOCK for EQUIP.unlockCost shards, two taps; TAKE INTO THE RUN or PUT BACK).
//               Rarity is a CHIP on each card's edge: six segments, one lit for each step (and a small flat one beside a card in a slot or a list).
//               Each card is a tilted 3D slab (2026-11-01: _cdSlab below; its texture and its crystal or cube are js/cardart.js's), what can be done with it flat under it.
//   A NEW RUN   the same screen opens by itself, with a banner and a START button, when a run begins and the collection holds a card (js/cards.js equipRunStart).
//   PACK 1      BOOSTER PACK (a button: ◆EQUIP_PACK.price, two taps; the cards it dealt last are shown under it, a duplicate says what it paid), MARKET (this run's credits; a shelf of six, dealt with the pack's odds, that changes every 5 minutes of play and waits while this sheet is open: each card can
//               be bought, in two taps, with its value in credits or in shards). The cards the packs and the market gave are FOUND for the run: worn at once; ◆EQUIP.unlockCost keeps one for good.
//   SERIES 2    BOOSTER PACK · SERIES 2 under Pack 1's box (build 2026-11-01j): the same box for EQUIP_PACK2 (◆150), its button off and saying "UNLOCKS AFTER THE PURIFICATION" until the Sewers are purified.
//   TWO MENUS   (build 2026-11-01l; the owner: "make it to where the items in the shop are in a new menu on the card menu called shop", and "your hand and the cards you found this run should be consolidated into
//               this rotating thing at the bottom ... sorted under a new assortment of owned cards, and the player may view all the cards that are in the game with the same scroll mechanics"): CARDS (THE COLLECTION's
//               stage and rail, showing OWNED, the cards kept for good and found this run, or ALL) and SHOP (the booster packs and the market). The YOUR HAND and FOUND THIS RUN rows of big cards are gone: those cards
//               are on the rail. Then: "the hand part should be out of the picture. Cards that have been permanently unlocked and that the player brought along with them should be in their collection ... with an
//               illuminated background that is yellow, matching the purchased button color scheme ... remove the entire bordered in menu": nothing is beside the stage; a card taken into the run is lit gold from
//               behind, on the rail and on the stage, and the player's slots are on the roster (YOU, above).
//   A PACK      opened, its cards rise out of it one by one into a straight row over the sheet, the rarest lit from behind (_cdRevealBox below).
// Nothing here is drawn on the canvas, and nothing runs in a frame: the screen redraws only when what it shows has changed (a redraw under a finger loses the tap).

let cardsPanelOpen = false, _cdOpts = {}, _cdSig = "", _cdTimer = 0, _cdArm = null;   // _cdArm: { id, until }, a card whose UNLOCK (or a pack, or a market buy) is armed
const CARDS_ARM_MS = 3000;
// the menu shown ("cards" or "shop") and the collection's view ("owned" or "all"), kept between openings; _cdReveal: the pack whose cards are being revealed, or null
let _cdTab = "cards", _cdView = "owned", _cdReveal = null;

function _cdEl(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function _cdClick(el, fn) { el.addEventListener("click", ev => { ev.stopPropagation(); fn(ev); }); }
function _cdNow() { return typeof performance !== "undefined" && performance.now ? performance.now() : Date.now(); }

// ── the dock's button (game.html): always there; with no card to show, the sheet says so ──
function cardsToggle() { if (cardsPanelOpen) cardsClose(); else cardsOpen(); }
function cardsOpen(opts) {
    const root = document.getElementById("cardsRoot"); if (!root) return false;
    equipShelfTick();   // (a shelf that is due comes first: while the sheet is open the shelf's clock waits)
    _cdOpts = opts || {}; _cdArm = null; _cdSig = ""; _cdReveal = null; cardsPanelOpen = true;
    if (_cdOpts.start) _cdTab = "cards";   // (the start of a run: the hand is chosen from the collection)
    root.classList.add("open"); if (document.body) document.body.classList.add("cardsOpen");
    clearInterval(_cdTimer); _cdTimer = setInterval(cardsRender, 400);
    cardsRender(); return true;
}
function cardsClose() {
    equipShelfSync();   // (the time the sheet was open is not the shelf's)
    cardsPanelOpen = false; _cdOpts = {}; _cdArm = null; _cdSig = ""; _cdReveal = null; clearInterval(_cdTimer); _cdTimer = 0;
    const root = document.getElementById("cardsRoot"); if (root) { root.classList.remove("open"); root.textContent = ""; }
    if (document.body) document.body.classList.remove("cardsOpen");
}

// ── one card, as a slab ──
// THE RARITY CHIP (docs/CARD-SYSTEM.md: "a cartridge-inspired rarity indicator" of illuminated bars): a notched plate set into the card's edge, six segments, one lit for each step of the rarity (the lowest at the foot).
// On a card it stands on the right edge; in a slot or a list it is the same plate laid flat and small (.mini). Its title and label say the tier ("RARITY · PRECISION · 3 OF 6").
function _cdChip(c, mini) {
    const n = equipRarityBars(c), chip = _cdEl("span", "cd-chip" + (mini ? " mini" : "")), say = "RARITY · " + equipRarityLabel(c) + " · " + n + " OF " + EQUIP_RARITIES.length;
    chip.title = say; chip.setAttribute("role", "img"); chip.setAttribute("aria-label", say); chip.style.setProperty("--c", _cdKindCol(c));
    for (let i = 0; i < EQUIP_RARITIES.length; i++) { const seg = _cdEl("i", i < n ? "on" : ""); seg.style.setProperty("--i", String(i)); chip.appendChild(seg); }   // (--i: its place, so a lit chip can light up one segment after another)
    return chip;
}
function _cdKindCol(c) { return c.kind === "element" ? ((typeof ELEMENTS !== "undefined" && ELEMENTS.find(e => e.id === c.match)) || {}).color || "#8fe3ff" : c.kind === "universal" ? "#ffe733" : "#8fe3ff"; }
// THE 3D CARD (ASKED 2026-11-01: "actual cards that look 3D ... a 3D looking object inside the card, and the card itself is kind of like tilted a little bit on an axis ... the text might be a raised hologram"; the
// design canvas's chosen board, then "Make an update to implement this style"). The card is a slab tilted in 3D with a little thickness (game.html "THE 3D CARDS"): its face wears the card's texture under a veil
// (js/cardart.js: its element's, or a class card's class's), the element's crystal or a class card's cube floats over it, the rarity and the card's state are along its top, the rarity chip stands on its right
// edge, and its name, kind and text are a raised hologram with a blurred copy under it for its shadow. `extra` is its state: "hand", "found", "locked" (or "" for none). The callers put what can be done with it
// (its buttons, who wears it) under the slab, flat: a tap there is never lost to the tilt.
const _CD_STATE = { hand: "IN YOUR HAND", found: "FOUND THIS RUN", locked: "LOCKED" };
function _cdSlab(c, extra) {
    const s = _cdEl("div", "cd-card" + (extra ? " " + extra : "")), col = _cdKindCol(c); s.style.setProperty("--c", col);
    const art = _cdEl("div", "cd-art"), slab = _cdEl("div", "cd-slab"), face = _cdEl("div", "cd-face");
    slab.appendChild(_cdEl("i", "cd-back"));   // (its back plate, which shows along its right edge and its foot: its thickness)
    const tex = _cdEl("i", "cd-tex"); if (typeof cardArtFaceClass === "function") cardArtMark(tex, cardArtFaceClass(c)); face.appendChild(tex);
    face.appendChild(_cdEl("i", "cd-frame"));
    const top = _cdEl("div", "cd-top"); top.appendChild(_cdEl("span", "cd-rar", equipRarityLabel(c))); if (_CD_STATE[extra]) top.appendChild(_cdEl("span", "cd-state", _CD_STATE[extra])); face.appendChild(top);
    face.appendChild(_cdChip(c));   // (on the card's right edge)
    face.appendChild(_cdEl("i", "cd-glow")); face.appendChild(_cdEl("i", "cd-shadow"));
    const gem = _cdEl("i", "cd-gem"); if (typeof cardArtObjectClass === "function") cardArtMark(gem, cardArtObjectClass(c, col), "gem"); face.appendChild(gem);
    // THE CARD'S ITEM (js/cardart.js CARD_ITEMS: EMBER PLATING's is live since build 2026-11-01j; a new piece is on a preview until approved): the card's own 3D object, in place of the crystal (still made, hidden under it),
    // standing in front of the tilted card and rising past its top edge, hovering
    const item = typeof cardArtItemUrl === "function" ? cardArtItemUrl(c) : "";
    const long = /\S{12,}/.test(c.name) ? " long" : "";   // (a name with a long word, CORE REINFORCEMENT, is set smaller so that it breaks between words, not inside one)
    const ghost = _cdEl("div", "cd-holo ghost"); ghost.setAttribute("aria-hidden", "true");   // the hologram's shadow: its own class names, so a card has one .cd-name, .cd-kind and .cd-text
    ghost.appendChild(_cdEl("div", "cd-gn" + long, c.name)); ghost.appendChild(_cdEl("div", "cd-gk", equipKindLabel(c))); ghost.appendChild(_cdEl("div", "cd-gt", c.text || "")); face.appendChild(ghost);
    const holo = _cdEl("div", "cd-holo"); holo.appendChild(_cdEl("div", "cd-name" + long, c.name)); holo.appendChild(_cdEl("div", "cd-kind", equipKindLabel(c))); holo.appendChild(_cdEl("div", "cd-text", c.text || "")); face.appendChild(holo);
    face.appendChild(_cdEl("i", "cd-emit l")); face.appendChild(_cdEl("i", "cd-emit r"));
    slab.appendChild(face); art.appendChild(slab);
    if (item) { s.classList.add("itemed"); const im = _cdEl("i", "cd-item"); im.style.backgroundImage = 'url("' + item + '")'; im.setAttribute("aria-hidden", "true"); art.appendChild(im); }
    s.appendChild(art);
    return s;
}
function _cdBtn(label, sub, col, fn, disabled) {
    const b = _cdEl("button", "cd-btn"); b.style.setProperty("--c", col || "#19e6c1"); b.appendChild(_cdEl("span", "cd-bl", label)); if (sub) b.appendChild(_cdEl("span", "cd-bs", sub));
    if (disabled) b.disabled = true; else _cdClick(b, () => { fn(); cardsRender(true); }); return b;
}
// what can be done with a card of the collection: UNLOCK (two taps) while it is not yours, else TAKE INTO THE RUN or PUT IT BACK (gold, as the buttons that buy: a card taken into the run is lit gold, build 2026-11-01l)
function _cdCollectionActions(c) {
    if (!equipOwns(c.id)) {
        const why = equipUnlockWhyNot(c.id), armed = _cdArm && _cdArm.id === c.id && _cdNow() < _cdArm.until;
        return [_cdBtn(armed ? "TAP AGAIN TO UNLOCK" : "UNLOCK ◆" + EQUIP.unlockCost, why || (armed ? "◆" + EQUIP.unlockCost + " OF YOUR SHARDS, FOR GOOD" : "FOR GOOD, EVERY RUN"), "#ffe733", () => {
            if (_cdArm && _cdArm.id === c.id && _cdNow() < _cdArm.until) { _cdArm = null; equipUnlock(c.id); } else _cdArm = { id: c.id, until: _cdNow() + CARDS_ARM_MS };
        }, !!why)];
    }
    const worn = equipWearers(c.id);
    if (equipInHand(c.id)) return [_cdBtn("IN YOUR HAND ✓", "PUT IT BACK" + (worn ? " · COMES OFF " + worn : ""), "#ffe733", () => equipHandRemove(c.id))];
    const full = equipHand.length >= equipHandCap(); return [_cdBtn("TAKE INTO THE RUN", full ? "YOUR HAND IS FULL (" + EQUIP.startPick + ")" : "", "#ffe733", () => equipHandAdd(c.id), full)];
}
function _cdStateOf(c) { return equipOwns(c.id) ? (equipInHand(c.id) ? "hand" : "") : equipIsFound(c.id) ? "found" : "locked"; }
// the player's own cards (THE COLLECTION's OWNED view): those kept for good and those found this run; the hand is among them
function _cdOwnedCards() { return Object.values(equipCards()).filter(c => equipOwns(c.id) || equipIsFound(c.id)); }

// ── a booster pack (Pack 1; Series 2 when it is on sale: js/cards.js EQUIP_PACKS): its button (two taps, as an unlock is) and what the last pack of it dealt ──
function _cdPackKinds(pack) { return pack.kinds.map(k => k === "subclass" ? "SPECIES" : k === "class" ? "CLASS" : k.toUpperCase()).join(" AND ") + " CARDS"; }
function _cdPackGuarantee(pack) { return "ONE " + equipRarityLabel({ rarity: pack.guaranteed.rarity }) + (pack.guaranteed.orHigher ? " OR BETTER" : ""); }   // (Pack 2's guarantee is "Precision or higher": js/cards.js)
function _cdPackSub(pack) { return "◆" + pack.price + " · " + pack.size + " " + _cdPackKinds(pack) + ", ALWAYS " + _cdPackGuarantee(pack) + " · THEY ARE FOUND FOR THIS RUN · ◆" + EQUIP.unlockCost + " KEEPS ONE FOR GOOD"; }
function _cdPackBox(pack) {
    pack = pack || EQUIP_PACK;
    const box = _cdEl("div", "cd-pack"), why = equipPackWhyNot(pack), key = pack === EQUIP_PACK ? "pack" : "pack:" + pack.id, armed = _cdArm && _cdArm.id === key && _cdNow() < _cdArm.until;
    box.appendChild(_cdBtn(armed ? "TAP AGAIN TO OPEN" : "OPEN A PACK ◆" + pack.price, why || (armed ? "◆" + pack.price + " OF YOUR SHARDS · " + pack.size + " CARDS" : pack.size + " CARDS · " + _cdPackGuarantee(pack) + " AT LEAST"), "#ffe733", () => {
        if (_cdArm && _cdArm.id === key && _cdNow() < _cdArm.until) {
            _cdArm = null;
            if (equipPackOpen(undefined, pack) && equipPackLast) _cdReveal = { pack: equipPackLast.pack || pack.id, ids: equipPackLast.ids.slice(), fresh: equipPackLast.fresh.slice() };   // (its cards come out of it: _cdRevealBox)
        } else _cdArm = { id: key, until: _cdNow() + CARDS_ARM_MS };
    }, !!why));
    if (equipPackLast && (equipPackLast.pack || EQUIP_PACK.id) === pack.id) {
        box.appendChild(_cdEl("div", "cd-note", "THE LAST PACK"));
        const row = _cdEl("div", "cd-row");
        equipPackLast.ids.map(equipCard).filter(Boolean).forEach(c => { const s = _cdSlab(c, "found"); s.appendChild(_cdEl("div", "cd-worn", equipPackLast.fresh.indexOf(c.id) >= 0 ? "NEW · FOUND FOR THIS RUN" : "DUPLICATE · +◇" + equipCreditsText(equipMarketValue(c) * EQUIP_MARKET.share) + " CREDITS")); row.appendChild(s); });
        box.appendChild(row);
    }
    return box;
}

// ── the screen: drawn once per change ──
// ── the market: the shelf, its clock, and two ways to pay for each card ──
function _cdClock(frames) { const t = Math.max(0, Math.ceil(frames / 60)); return Math.floor(t / 60) + ":" + String(t % 60).padStart(2, "0"); }
function _cdShelfNote() { return "NEXT SHELF IN " + _cdClock(equipShelf.until - _equipNow()) + " · THE CLOCK WAITS WHILE THIS SHEET IS OPEN · YOUR CREDITS COME FROM THE DUPLICATES IN YOUR PACKS"; }
function _cdMarketBox() {
    const box = _cdEl("div", "cd-market"), ids = equipShelfIds();
    box.appendChild(_cdEl("div", "cd-note cd-shelf-t", _cdShelfNote()));
    if (!ids.length) { box.appendChild(_cdEl("div", "cd-note", "NOTHING ON THE SHELF: YOU HAVE EVERY CARD THAT IS SOLD, OR THEY ARE ALL BOUGHT")); return box; }
    const grid = _cdEl("div", "cd-grid");
    ids.map(equipCard).filter(Boolean).forEach(c => {
        const s = _cdSlab(c, ""), v = equipMarketValue(c);
        s.appendChild(_cdEl("div", "cd-worn", equipOwns(c.id) ? "YOURS FOR GOOD · FOUND FOR THIS RUN" : "NEW · KEPT FOR GOOD"));
        ["credits", "shards"].forEach(pay => {
            const why = equipMarketWhyNot(c.id, pay), key = "buy:" + c.id + ":" + pay, armed = _cdArm && _cdArm.id === key && _cdNow() < _cdArm.until, sym = pay === "credits" ? "◇" : "◆";
            s.appendChild(_cdBtn(armed ? "TAP AGAIN TO BUY" : "BUY " + sym + v + " " + pay.toUpperCase(), why || (armed ? sym + v + " OF YOUR " + pay.toUpperCase() : pay === "credits" ? "WITH CREDITS" : "WITH SHARDS"), pay === "credits" ? "#7be3ff" : "#ffe733", () => {
                if (_cdArm && _cdArm.id === key && _cdNow() < _cdArm.until) { _cdArm = null; equipMarketBuy(c.id, pay); } else _cdArm = { id: key, until: _cdNow() + CARDS_ARM_MS };
            }, !!why));
        });
        grid.appendChild(s);
    });
    box.appendChild(grid); return box;
}

// ── THE COLLECTION: A FEATURED CARD OVER A RAIL OF MINI CARDS (ASKED 2026-11-01: "make it sortable by rarity or by the element ... the player can swipe through, and the card that is selected in the slider is
// revealed"; then, revised: "I want the cards at the bottom in the slider to be mini cards that the player can slide through, and the main card that would be in the middle of the slider is the card that is
// displayed at the top. When the card is selected, perhaps its description and card elements are labeled on the side of the card, and the card itself actually changes form and blows up the image and the
// rarity meters highlight").
//   THE RAIL     every card of the collection as a MINI CARD (its texture, its crystal or cube or item, its name, its rarity chip, a mark for in your hand or found), in a row the player slides through
//                (a native scroll, snapping each card to the middle); the one in the MIDDLE is the card selected. A tap on a mini card brings it to the middle; ◀ ▶, the wheel and the arrow keys step one.
//   THE STAGE    the selected card, at the top: the full card (js/cardsui.js _cdSlab), which CHANGES FORM as it arrives (it grows out of a mini card), its picture BLOWN UP (the crystal, cube or item scaled
//                up and kept so), its RARITY METER lighting up one segment after another and then glowing; beside it its parts LABELLED (name, kind, rarity with a large meter, effect, state) and its buttons.
//   SORT         by rarity (the rarest first) or by element (fire, toxic, electric, ice, flux, core, then the class cards, the species cards, the universal ones), the lower rarity first within each.
//   SHOW         (build 2026-11-01l) OWNED, the player's own cards (kept for good, and found this run, marked ★), or ALL, every card in the game (the locked ones too, each unlockable from the stage as before).
//                With nothing owned, ALL is shown. A card taken into the run (kept for good and brought along) is LIT GOLD FROM BEHIND, on its mini card and on the stage: the gold of the buttons that buy.
// The view, the order and the card selected are kept while the sheet is open and between openings (_cdView, _cdSort, _cdSel). Sliding the rail redraws only the stage, never the rail under the finger.
let _cdSort = "rarity", _cdSel = null;
const CD_RAIL = { settle: 110, wheel: 60 };
const _CD_EL_ORDER = ["fire", "toxic", "electric", "ice", "flux", "core"], _CD_ROLE_ORDER = ["brawler", "sniper", "camper"];
const _CD_INFO_STATE = { hand: "IN YOUR HAND", found: "FOUND THIS RUN", locked: "LOCKED", "": "YOURS FOR GOOD" };
function _cdRarityIdx(c) { return EQUIP_RARITIES.findIndex(r => r.id === c.rarity); }
function _cdGroupIdx(c) { return c.kind === "element" ? _CD_EL_ORDER.indexOf(c.match) : c.kind === "class" ? 10 + _CD_ROLE_ORDER.indexOf(c.match) : c.kind === "subclass" ? 20 + EQUIP_SUBCLASSES.findIndex(s => s.id === c.match) : 40; }
// the collection in the rail's order ("rarity" or "element")
function equipCollectionOrder(cards, by) {
    return cards.slice().sort((a, b) => by === "element" ? (_cdGroupIdx(a) - _cdGroupIdx(b) || _cdRarityIdx(a) - _cdRarityIdx(b) || a.name.localeCompare(b.name))
                                                         : (_cdRarityIdx(b) - _cdRarityIdx(a) || _cdGroupIdx(a) - _cdGroupIdx(b) || a.name.localeCompare(b.name)));
}
// a mini card on the rail
function _cdMini(c) {
    const st = _cdStateOf(c), col = _cdKindCol(c), m = _cdEl("button", "cd-mini" + (st ? " " + st : "")); m.type = "button"; m._id = c.id; m.setAttribute("data-id", c.id); m.style.setProperty("--c", col);
    const tex = _cdEl("i", "cd-mtex"); if (typeof cardArtFaceClass === "function") cardArtMark(tex, cardArtFaceClass(c)); m.appendChild(tex);
    const gem = _cdEl("i", "cd-mgem"), item = typeof cardArtItemUrl === "function" ? cardArtItemUrl(c) : "";
    if (item) { gem.classList.add("item"); gem.style.backgroundImage = 'url("' + item + '")'; } else if (typeof cardArtObjectClass === "function") cardArtMark(gem, cardArtObjectClass(c, col), "gem");
    m.appendChild(gem); m.appendChild(_cdEl("span", "cd-mn", c.name)); m.appendChild(_cdChip(c, true));
    m.setAttribute("aria-label", c.name + " · " + equipKindLabel(c) + " · " + equipRarityLabel(c) + " · " + _CD_INFO_STATE[st]);
    return m;
}
// the stage's labels: what the card is, beside it
function _cdInfo(c) {
    const st = _cdStateOf(c), box = _cdEl("div", "cd-info"); box.style.setProperty("--c", _cdKindCol(c));
    const row = (k, v, cls) => { const r = _cdEl("div", "cd-irow" + (cls ? " " + cls : "")); r.appendChild(_cdEl("span", "cd-ik", k)); r.appendChild(typeof v === "string" ? _cdEl("span", "cd-iv", v) : v); box.appendChild(r); return r; };
    row("NAME", c.name, "nm"); row("KIND", equipKindLabel(c), "kd");
    const n = equipRarityBars(c), meter = _cdEl("span", "cd-iv cd-imeter"); meter.setAttribute("role", "img"); meter.setAttribute("aria-label", "RARITY · " + equipRarityLabel(c) + " · " + n + " OF " + EQUIP_RARITIES.length);
    for (let i = 0; i < EQUIP_RARITIES.length; i++) { const seg = _cdEl("i", i < n ? "on" : ""); seg.style.setProperty("--i", String(i)); meter.appendChild(seg); }
    meter.appendChild(_cdEl("b", null, equipRarityLabel(c) + " · " + n + " OF " + EQUIP_RARITIES.length)); row("RARITY", meter, "rr");
    row("EFFECT", c.text || "NONE YET", "fx");
    const worn = st === "hand" || st === "found" ? equipWearers(c.id) : 0; row("STATE", _CD_INFO_STATE[st] + (worn ? " · WORN BY " + worn : ""), "sn");
    const acts = _cdEl("div", "cd-iacts"); _cdCollectionActions(c).forEach(b => acts.appendChild(b)); box.appendChild(acts);
    return box;
}
// the stage: the selected card in full, changing form as it arrives, and its labels
function _cdStageFill(stage, c) {
    if (!stage) return; stage.textContent = ""; if (!c) return;
    const card = _cdSlab(c, _cdStateOf(c)); card.classList.add("feat"); stage.appendChild(card); stage.appendChild(_cdInfo(c));
}
function _cdRailIndex(rail) { return (rail && rail._minis || []).findIndex(m => m._id === _cdSel); }
// the rail's marks: the mini selected, where it is in the collection, the ends
function _cdRailMark(rail) {
    const minis = rail && rail._minis || [], i = _cdRailIndex(rail);
    minis.forEach((m, k) => { if (m.classList) m.classList.toggle("on", k === i); if (m.setAttribute) m.setAttribute("aria-selected", k === i ? "true" : "false"); });
    if (rail._pos) rail._pos.textContent = (i + 1) + " OF " + minis.length;
    if (rail._prev) rail._prev.disabled = i <= 0; if (rail._next) rail._next.disabled = i >= minis.length - 1;
}
// bring the selected mini to the rail's middle (smoothly, or at once)
function _cdRailCenter(rail, smooth) {
    const m = (rail && rail._minis || [])[_cdRailIndex(rail)]; if (!m || !Number.isFinite(m.offsetLeft) || !Number.isFinite(rail.clientWidth)) return;
    const x = m.offsetLeft + (m.offsetWidth || 0) / 2 - rail.clientWidth / 2;
    rail._seek = smooth ? _cdNow() : 0;
    if (smooth && typeof rail.scrollTo === "function") rail.scrollTo({ left: x, behavior: "smooth" }); else rail.scrollLeft = x;
}
// select a card of the rail: the stage shows it (only if it changed), the rail marks it and brings it to the middle
function _cdRailGo(rail, id, smooth) {
    if (!id) return false;
    const changed = _cdSel !== id; _cdSel = id;
    if (changed) _cdStageFill(rail._stage, equipCard(id));
    _cdRailMark(rail); _cdRailCenter(rail, smooth); return changed;
}
function _cdRailStep(rail, dir) { const minis = rail && rail._minis || [], i = _cdRailIndex(rail), j = Math.max(0, Math.min(minis.length - 1, i + dir)); return j !== i && minis[j] ? _cdRailGo(rail, minis[j]._id, true) : false; }
// the mini nearest the rail's middle
function _cdRailMiddle(rail) {
    const minis = rail && rail._minis || [], mid = (rail.scrollLeft || 0) + (rail.clientWidth || 0) / 2; let best = null, bd = Infinity;
    for (const m of minis) { const d = Math.abs((m.offsetLeft || 0) + (m.offsetWidth || 0) / 2 - mid); if (d < bd) { bd = d; best = m; } }
    return best;
}
// the rail's slide (the browser's own scroll: a finger, a trackpad), its settling on a card, the wheel and the keys
function _cdRailInput(rail) {
    let t = 0, acc = 0, raf = 0;
    rail.addEventListener("scroll", () => {
        if (!raf && typeof requestAnimationFrame === "function") raf = requestAnimationFrame(() => { raf = 0; const m = _cdRailMiddle(rail); (rail._minis || []).forEach(x => x.classList.toggle("mid", x === m)); });
        clearTimeout(t); t = setTimeout(() => {   // the slide has settled: the card in the middle is the one selected
            const m = _cdRailMiddle(rail); if (!m || m._id === _cdSel) return;
            if (rail._seek && _cdNow() - rail._seek < 900) return;   // (still on its way to a card it was sent to)
            _cdRailGo(rail, m._id, false);
        }, CD_RAIL.settle);
    }, { passive: true });
    rail.addEventListener("scrollend", () => { rail._seek = 0; });
    const takeOver = () => { rail._seek = 0; };   // (a finger on the rail takes over from a card it was sent to: its slide is followed at once)
    rail.addEventListener("pointerdown", takeOver, { passive: true }); rail.addEventListener("touchstart", takeOver, { passive: true });
    rail.addEventListener("wheel", ev => {
        if (Math.abs(ev.deltaX) > Math.abs(ev.deltaY)) return;   // (a sideways swipe on a trackpad scrolls the rail itself)
        const dir = ev.deltaY > 0 ? 1 : -1, i = _cdRailIndex(rail), n = (rail._minis || []).length;
        if ((dir > 0 && i >= n - 1) || (dir < 0 && i <= 0)) { acc = 0; return; }   // (at an end the sheet scrolls on)
        ev.preventDefault(); acc += ev.deltaY;
        while (acc >= CD_RAIL.wheel) { acc -= CD_RAIL.wheel; _cdRailStep(rail, 1); } while (acc <= -CD_RAIL.wheel) { acc += CD_RAIL.wheel; _cdRailStep(rail, -1); }
    }, { passive: false });
    rail.addEventListener("keydown", ev => { if (ev.key === "ArrowRight" || ev.key === "ArrowLeft") { ev.preventDefault(); _cdRailStep(rail, ev.key === "ArrowRight" ? 1 : -1); } });
}
// THE COLLECTION: `list` the cards of the view shown ("owned" or "all"), with the counts of both for its buttons
function _cdDeckBox(list, view, nOwned, nAll) {
    const box = _cdEl("div", "cd-deckbox"), order = equipCollectionOrder(list, _cdSort);
    if (!order.some(c => c.id === _cdSel)) _cdSel = order.length ? order[0].id : null;
    const bar = _cdEl("div", "cd-deckbar"); bar.appendChild(_cdEl("span", "cd-dlab", "SHOW"));
    [["owned", "OWNED " + nOwned, !nOwned], ["all", "ALL " + nAll, false]].forEach(([k, t, off]) => {
        const b = _cdEl("button", "cd-view" + (view === k ? " on" : ""), t); b.setAttribute("aria-pressed", view === k ? "true" : "false");
        if (off) b.disabled = true; else _cdClick(b, () => { if (view !== k) { _cdView = k; cardsRender(true); } }); bar.appendChild(b);
    });
    bar.appendChild(_cdEl("span", "cd-dlab sep", "SORT BY"));
    [["rarity", "RARITY"], ["element", "ELEMENT"]].forEach(([k, t]) => { const b = _cdEl("button", "cd-sort" + (_cdSort === k ? " on" : ""), t); b.setAttribute("aria-pressed", _cdSort === k ? "true" : "false"); _cdClick(b, () => { if (_cdSort !== k) { _cdSort = k; cardsRender(true); } }); bar.appendChild(b); });
    const pos = _cdEl("span", "cd-dpos"); bar.appendChild(pos); box.appendChild(bar);
    const stage = _cdEl("div", "cd-stage"); box.appendChild(stage);   // (nothing beside it: the hand's notch and the player's slots are gone from here, build 2026-11-01l)
    const rbox = _cdEl("div", "cd-railbox"), prev = _cdEl("button", "cd-rnav", "◀"), next = _cdEl("button", "cd-rnav", "▶"), rail = _cdEl("div", "cd-rail");
    prev.setAttribute("aria-label", "THE CARD BEFORE"); next.setAttribute("aria-label", "THE NEXT CARD"); rail.tabIndex = 0; rail.setAttribute("role", "listbox"); rail.setAttribute("aria-label", "THE COLLECTION · SLIDE THROUGH IT");
    rail._minis = []; rail._stage = stage; rail._pos = pos; rail._prev = prev; rail._next = next;
    order.forEach(c => { const m = _cdMini(c); _cdClick(m, () => _cdRailGo(rail, c.id, true)); rail.appendChild(m); rail._minis.push(m); });
    _cdClick(prev, () => _cdRailStep(rail, -1)); _cdClick(next, () => _cdRailStep(rail, 1));
    rbox.appendChild(prev); rbox.appendChild(rail); rbox.appendChild(next); box.appendChild(rbox);
    _cdRailInput(rail); _cdRailMark(rail); _cdStageFill(stage, equipCard(_cdSel));
    return box;
}

// ── THE TWO MENUS: CARDS (the collection) and SHOP (the packs, the market) ──
function _cdTabs(nOwned) {
    const bar = _cdEl("div", "cd-tabs"); bar.setAttribute("role", "tablist");
    [["cards", "CARDS", "THE COLLECTION · " + nOwned + " OWNED"], ["shop", "SHOP", "PACKS · MARKET"]].forEach(([k, t, sub]) => {
        const b = _cdEl("button", "cd-tab" + (_cdTab === k ? " on" : "")); b.type = "button"; b.setAttribute("role", "tab"); b.setAttribute("aria-selected", _cdTab === k ? "true" : "false");
        b.appendChild(_cdEl("span", "cd-tl", t)); b.appendChild(_cdEl("small", null, sub));
        _cdClick(b, () => { if (_cdTab !== k) { _cdTab = k; _cdArm = null; cardsRender(true); } }); bar.appendChild(b);
    });
    return bar;
}

// ── A PACK OPENED (build 2026-11-01l; the owner: "when a player opens a pack ... make a new transparent menu pop up where the cards come up out of the pack one by one to fill the screen in a straight row with
// the rarest card highlighted from the back, or illuminated from the back"): an overlay over the sheet (it shows through); the pack drops in, shakes and bursts, and its cards rise out of it one after another
// into a straight row across the screen (scaled to fill it), each tagged NEW or DUPLICATE with the credits it paid; the rarest (every card of the pack's highest rarity) is lit from behind once all are out.
// CONTINUE, a tap once they are all out, or Escape closes it. While it is up the sheet under it is not drawn again, so the reveal never starts over.
const CD_REVEAL = { first: 0.85, gap: 0.5, rise: 0.75, slot: 250, space: 24 };   // seconds (the first card leaves the pack, the next one after, each card's rise) and the row's px (a card's place, the room between)
function _cdRevealBox(rv) {
    const pack = equipPackById(rv.pack) || EQUIP_PACK, cards = rv.ids.map(equipCard).filter(Boolean), n = cards.length, step = CD_REVEAL.slot + CD_REVEAL.space;
    const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
    const top = Math.max.apply(null, cards.map(equipRarityBars).concat([0])), end = still ? 0 : CD_REVEAL.first + Math.max(0, n - 1) * CD_REVEAL.gap + CD_REVEAL.rise;
    const ov = _cdEl("div", "cr-overlay"); ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true"); ov.setAttribute("aria-label", "A PACK OPENED");
    ov.style.setProperty("--n", String(n)); ov.style.setProperty("--end", end + "s"); ov.style.setProperty("--pc", pack === EQUIP_PACK ? "#ffe733" : "#b57bff");
    ov.appendChild(_cdEl("div", "cr-title", (pack === EQUIP_PACK ? "BOOSTER PACK" : "BOOSTER PACK · " + pack.name) + " · " + n + " CARDS"));
    const stage = _cdEl("div", "cr-stage"), row = _cdEl("div", "cr-row");
    cards.forEach((c, k) => {
        const rare = equipRarityBars(c) === top, at = (k - (n - 1) / 2) * step, fresh = rv.fresh.indexOf(c.id) >= 0;
        if (rare) { const b = _cdEl("i", "cr-back"); b.style.setProperty("--x", at + "px"); b.style.setProperty("--c", _cdKindCol(c)); stage.appendChild(b); }   // (the light behind the rarest, under the row)
        const slot = _cdEl("div", "cr-slot" + (rare ? " rarest" : "")); slot.style.setProperty("--k", String(k)); slot.style.setProperty("--fx", (-at) + "px"); slot.setAttribute("data-id", c.id);
        slot.appendChild(_cdSlab(c, ""));
        slot.appendChild(_cdEl("div", "cd-worn cr-tag" + (fresh ? " new" : ""), fresh ? "NEW · FOUND FOR THIS RUN" : "DUPLICATE · +◇" + equipCreditsText(equipMarketValue(c) * EQUIP_MARKET.share) + " CREDITS"));
        row.appendChild(slot);
    });
    stage.appendChild(row);
    const pk = _cdEl("div", "cr-pack"); pk.appendChild(_cdEl("i", "cr-flap")); pk.appendChild(_cdEl("span", "cr-pname", pack.name)); pk.appendChild(_cdEl("span", "cr-psub", n + " CARDS")); stage.appendChild(pk);
    ov.appendChild(stage);
    const go = _cdEl("button", "cr-go", "CONTINUE ▸"); go.type = "button"; _cdClick(go, _cdRevealClose); ov.appendChild(go);
    const t0 = _cdNow(); _cdClick(ov, () => { if (_cdNow() - t0 >= end * 1000) _cdRevealClose(); });   // (a tap anywhere, once every card is out)
    try {   // fill the screen: the row scaled to the room it has, never past 1.25
        const W = (window.innerWidth || 1180) - 48, H = (window.innerHeight || 820) - 190, z = Math.max(0.4, Math.min(1.25, W / Math.max(1, n * CD_REVEAL.slot + (n - 1) * CD_REVEAL.space), H / 470));
        stage.style.zoom = String(Math.round(z * 100) / 100);
    } catch (e) { /* no window: the row at its own size */ }
    return ov;
}
function _cdRevealClose() { if (!_cdReveal) return; _cdReveal = null; cardsRender(true); }
function cardsRevealOpen() { return !!_cdReveal; }   // (is a pack's reveal up: the tests, and the Escape key)

function _cdSigNow() {
    const all = Object.keys(equipCards()), have = typeof shardCount === "number" ? shardCount : 0;
    return [cardsPanelOpen, !!_cdOpts.start, _cdTab, _cdView, !!_cdReveal, all.map(id => (equipOwns(id) ? "o" : have >= EQUIP.unlockCost ? "a" : "l") + (equipInHand(id) ? "h" : "") + (equipIsFound(id) ? "f" : "") + equipWearers(id)).join(), equipHand.join(), equipPlayer.join(),
        _cdArm && _cdNow() < _cdArm.until ? _cdArm.id : "", equipPacksOnSale().map(p => p.id + ":" + (equipPackWhyNot(p) || "")).join(";"), equipPackLast ? (equipPackLast.pack || "") + ":" + equipPackLast.ids.join() + "/" + equipPackLast.fresh.join() : "", equipShelfIds().map(id => id + (equipMarketWhyNot(id, "credits") ? 0 : 1) + (equipMarketWhyNot(id, "shards") ? 0 : 1)).join(), equipCredits].join("|");
}
function cardsRender(force) {
    const root = document.getElementById("cardsRoot"); if (!root || !cardsPanelOpen) return;
    equipShelfSync();   // (the shelf's clock waits while this sheet is open, so its note never changes under a finger)
    const sh = root.querySelector(".cd-sh-n"); if (sh) { const t = "◆ " + (typeof shardCount === "number" ? shardCount : 0); if (sh.textContent !== t) sh.textContent = t; }
    if (_cdReveal && !force && root.querySelector(".cr-overlay")) return;   // (a pack's cards are being revealed: the sheet under it waits, so the reveal never starts over)
    const sg = _cdSigNow(); if (!force && sg === _cdSig && root.firstChild) return; _cdSig = sg;
    const keep = root._tab === _cdTab && root.querySelector(".cd-body") ? root.querySelector(".cd-body").scrollTop : 0;   // (the place in the list, kept; a menu switched to starts at its top)
    root.textContent = "";
    const owned = equipOwnedList().length, all = Object.values(equipCards()), start = !!_cdOpts.start, mine = _cdOwnedCards();
    const head = _cdEl("div", "cd-head"), tb = _cdEl("div", "cd-titlebox");
    tb.appendChild(_cdEl("div", "cd-title", "CARDS")); tb.appendChild(_cdEl("div", "cd-summary", "HAND " + equipHand.length + (equipDev === "all" ? "" : " / " + EQUIP.startPick) + " · " + owned + " OF " + all.length + " UNLOCKED" + (equipFound.length ? " · " + equipFound.length + " FOUND" : "") + (equipDev ? " · TEST CARDS (?cards)" : ""))); head.appendChild(tb);
    const sb = _cdEl("div", "cd-shards"); sb.appendChild(_cdEl("div", "cd-sh-n", "◆ " + (typeof shardCount === "number" ? shardCount : 0))); sb.appendChild(_cdEl("div", "cd-cr", "◇ " + equipCreditsText(equipCredits) + " CREDITS")); sb.appendChild(_cdEl("div", "cd-sh-c", "YOUR SHARDS · A CARD COSTS ◆" + EQUIP.unlockCost)); head.appendChild(sb);
    const x = _cdEl("button", "cd-close", start ? "START THE RUN ▸" : "✕ CLOSE"); _cdClick(x, cardsClose); head.appendChild(x); root.appendChild(head);
    root.appendChild(_cdTabs(mine.length));
    const body = _cdEl("div", "cd-body " + _cdTab);
    const sec = (t, sub) => { const h = _cdEl("div", "cd-sec", t); if (sub) h.appendChild(_cdEl("i", null, sub)); body.appendChild(h); };
    if (_cdTab === "shop") {
        // THE SHOP: the booster packs (a pack not on sale, one without its price or odds, is not shown; a locked one is, its button saying when it opens) and the market
        for (const pack of equipPacksOnSale()) { sec(pack === EQUIP_PACK ? "BOOSTER PACK" : "BOOSTER PACK · " + pack.name, _cdPackSub(pack)); body.appendChild(_cdPackBox(pack)); }
        sec("MARKET", "◇ CREDITS (DUPLICATES PAY " + Math.round(EQUIP_MARKET.share * 100) + "% OF A CARD'S VALUE) OR THE SAME NUMBER OF ◆ SHARDS BUY A CARD: A NEW ONE IS KEPT FOR GOOD · THE SHELF CHANGES EVERY 5 MINUTES"); body.appendChild(_cdMarketBox());
    } else {
        // THE CARDS: the collection (OWNED or ALL) on its stage and rail; a card taken into the run is lit gold
        if (start) body.appendChild(_cdEl("div", "cd-banner", "A NEW RUN · CHOOSE UP TO " + EQUIP.startPick + " CARDS TO TAKE WITH YOU, THEN START"));
        const view = _cdView === "owned" && mine.length ? "owned" : "all";
        sec("THE COLLECTION", view === "owned" ? "YOUR CARDS: KEPT FOR GOOD, AND FOUND THIS RUN (★) · LIT GOLD: TAKEN INTO THE RUN · SLIDE THROUGH THEM: THE ONE IN THE MIDDLE IS SHOWN · ALL SHOWS EVERY CARD IN THE GAME"
                                               : "EVERY CARD IN THE GAME · UNLOCK ONE FOR GOOD FROM HERE · LIT GOLD: TAKEN INTO THE RUN · SLIDE THROUGH THEM: THE ONE IN THE MIDDLE IS SHOWN");
        if (all.length) body.appendChild(_cdDeckBox(view === "owned" ? mine : all, view, mine.length, all.length));
        else body.appendChild(_cdEl("div", "cd-note", "NO CARDS YET · THE FIRST ONES ARE STILL BEING DESIGNED"));
    }
    root.appendChild(body); body.scrollTop = keep; root._tab = _cdTab;
    const rl = root.querySelector && root.querySelector(".cd-rail"); if (rl && rl._minis) _cdRailCenter(rl, false);   // (now that it is on the page: the selected mini to the middle of the rail)
    if (_cdReveal) root.appendChild(_cdRevealBox(_cdReveal));   // (a pack just opened: its cards come out of it, over the sheet)
}

// ── the roster (js/commandcenter.js _ccDrawSettings): the creature in view's subclass, and its two slots ──
function equipSig(f) {   // what the settings column must redraw for
    if (!f || f.isClone || f.isFollower !== true) return "";
    return [equipSubclassOf(f), equipSlots(f).join(","), equipHand.join(","), equipFound.join(",")].join("|");
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
    const hand = equipUsableCards();   // (the hand and what the packs found)
    for (let slot = 0; slot < EQUIP.followerSlots; slot++) {
        const cur = equipSlots(f)[slot], card = equipCard(cur), opts = [];
        opts.push({ label: "EMPTY", col: "#8aa0c8", on: !cur, off: !cur, sub: cur ? "TAKE THE CARD OFF" : "", fn: () => { equipPut(f, slot, null); } });
        hand.forEach(c => { const why = equipWhyNot(f, c.id, slot); opts.push({ label: c.name, col: "#19e6c1", on: c.id === cur, off: !!why && c.id !== cur, sub: (why && c.id !== cur ? why : equipKindLabel(c) + " · " + equipRarityLabel(c)), chip: _cdChip(c, true), fn: () => { equipPut(f, slot, c.id); } }); });
        _ccDropdown(side, "card" + slot, "CARD " + (slot + 1), card ? card.name : "EMPTY", "#ffe733", opts, hand.length ? null : "NO CARDS IN YOUR HAND", card ? _cdChip(card, true) : null);
    }
}
// ── YOU, ON THE ROSTER (build 2026-11-01l; the owner: "a new player icon and player card in the roster that the player can equip their cards to their own player"): the player's card in view (js/commandcenter.js
// _ccFocusDraw) shows its two cards, each a mini card as the collection's (a tap opens its list); the settings column has YOUR SLOT 1 and YOUR SLOT 2, drop-downs as a follower's CARD 1 and CARD 2, listing the hand
// (Universal cards only: the rest say why not, js/cards.js equipPlayerWhyNot)
function equipPlayerSig() { return [equipPlayer.join(","), equipHand.join(","), equipFound.join(","), equipUsableCards().length].join("|"); }   // (what the player's card and its column must redraw for)
function equipPlayerRosterDraw(side) {
    if (typeof _ccEl !== "function") return;
    const hand = equipUsableCards(), uni = hand.filter(c => c.kind === "universal").length;
    side.appendChild(_ccEl("div", "cc-sec", "YOUR CARDS · " + EQUIP.playerSlots + " SLOTS · UNIVERSAL CARDS ONLY"));
    for (let slot = 0; slot < EQUIP.playerSlots; slot++) {
        const cur = equipPlayer[slot], card = equipCard(cur), opts = [];
        opts.push({ label: "EMPTY", col: "#8aa0c8", on: !cur, off: !cur, sub: cur ? "TAKE THE CARD OFF" : "", fn: () => { equipPlayerPut(slot, null); } });
        hand.forEach(c => { const why = equipPlayerWhyNot(c.id, slot); opts.push({ label: c.name, col: "#ffe733", on: c.id === cur, off: !!why && c.id !== cur, sub: (why && c.id !== cur ? why : equipKindLabel(c) + " · " + equipRarityLabel(c)), chip: _cdChip(c, true), fn: () => { equipPlayerPut(slot, c.id); } }); });
        _ccDropdown(side, "pslot" + slot, "YOUR SLOT " + (slot + 1), card ? card.name : "EMPTY", "#ffe733", opts, hand.length ? null : "NO CARDS IN YOUR HAND", card ? _cdChip(card, true) : null);
    }
    side.appendChild(_ccEl("div", "cc-note", !hand.length ? "TAKE CARDS INTO THE RUN FROM THE CARDS SCREEN: THEY ARE LISTED HERE" : !uni ? "NO UNIVERSAL CARD IN YOUR HAND: ONLY THOSE FIT YOU" : "EACH FOLLOWER'S TWO CARDS ARE ON ITS OWN PAGE OF THE ROSTER"));
}
// the player's two cards on its card in view: a mini card for each (or an empty place); `onTap(slot)` opens that slot's list
function equipPlayerSlotsBox(onTap) {
    const box = _cdEl("div", "cf-pcards");
    for (let slot = 0; slot < EQUIP.playerSlots; slot++) {
        const c = equipCard(equipPlayer[slot]), cell = _cdEl("div", "cf-pslot"); cell.appendChild(_cdEl("span", "cf-pk", "SLOT " + (slot + 1)));
        let m;
        if (c) { m = _cdMini(c); m.classList.add("worn"); }
        else { m = _cdEl("button", "cd-mini cf-pempty"); m.type = "button"; m.appendChild(_cdEl("span", null, "EMPTY")); m.setAttribute("aria-label", "YOUR SLOT " + (slot + 1) + " · EMPTY"); }
        _cdClick(m, () => { if (typeof onTap === "function") onTap(slot); });
        cell.appendChild(m); box.appendChild(cell);
    }
    return box;
}

function initCardsUi() {
    if (typeof document === "undefined" || !document.body || document.getElementById("cardsRoot")) return;
    const root = _cdEl("div"); root.id = "cardsRoot"; document.body.appendChild(root);
    window.addEventListener("keydown", e => { if (e && e.key === "Escape" && cardsPanelOpen) { if (_cdReveal) _cdRevealClose(); else cardsClose(); } });   // (a pack's reveal first, then the sheet)
}
try { initCardsUi(); } catch (e) { /* no page (the test sandbox): the rules in js/cards.js still work */ }
