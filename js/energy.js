// ─────────────────────────────────────────────────────────
//  ENERGY CARDS (docs/ENERGY-CARDS.md; the owner, 2026-11-09: "this one kind of incorporates a resource system that's been at the heart of most of the games I've ever played")
// ─────────────────────────────────────────────────────────
// A follower's element comes from an ENERGY CARD it holds. The owner's rules (ENERGY-CARDS.md §2):
//   SLOTS       an unevolved follower has 1 energy slot, an evolved one 3; its two equip card slots (js/cards.js) are as they were.
//   ELEMENT     an unevolved follower without an energy card has no element (ENERGY_NONE) and no element colour; the card in its slot gives it that card's element.
//   EVOLVING    at level ENERGY.evolveLevel (8) with an energy card it evolves on its own into its element's form for its role (js/evolution.js evoCheck); the card is used up, and the element is its own for good.
//   UNLOCKS     an evolved follower's cards of its OWN element unlock its next attack: ENERGY.altNeeds for its second attack, ENERGY.ultNeeds for its Ultimate (js/moves.js evoMoveAllowed, js/elements.js
//               followerUltimate ask energyAltOpen and energyUltOpen). A card of ANOTHER element unlocks a HYBRID attack of the two (energyHybrids): none is designed yet ("NOT DESIGNED YET").
//   OWNING      counted copies: energyStock, element -> how many you hold (not in a slot). Put in a slot, a card leaves your stock; taken out before it evolves a follower, it comes back.
//   PACKS       Pack 1 and Series 2 each deal 2 energy cards, guaranteed, of their 4 (the pack's `energy`, js/cards.js; the owner: "make 2 of the cards guaranteed energy cards"), of elements found, and BLOOM's too
//               once the purification module has run (energyPackPool; build 2026-11-09vv).
//   THE RUN'S   NEW GAME clears the stock (energyReset); the run's save holds it (js/facilitysave.js), and each follower's record its slots.
//   EGGS        a bred egg comes with an energy card of the element breeding picked (js/breeding.js), free: it is not taken from the stock. A recruit comes with none.
//   CONVERSION  an unevolved toxic follower's toxic card becomes a BLOOM one (js/conversion.js).
//   OLD SAVES   a follower saved before energy cards: an unevolved one loses its element; an evolved one keeps it, its slots empty (its second attack and Ultimate locked until it has cards of its element).
// The numbers the owner gave: 1 slot, 3 slots, level 8, 2 a pack. The owner's rule "a card of its own element unlocks its next attack: its second attack, then its Ultimate" read as 1 card, then 2.
const ENERGY_NONE = "none";
// THE THREE STEPS (build 2026-11-13u; the owner, 2026-11-13: "there's 3 energy card slots for the evolved followers, and I don't think all of them are really utilized ... if they have 3 energy cards, they can
// use their ultimate, and if they have 2 energy cards, they can use their alternate attack if there's an extra one. If not, the alternate attack is unlocked at 1 energy"): 1 card of its own element opens its
// second attack (altNeeds), 2 its EXTRA attack where its form has one (alt2Needs: a form's moves after its first, js/moves.js evoMoveAllowed), 3 its Ultimate (ultNeeds: it was 2). A form with no extra attack
// gets nothing more from its second card. With all three slots its own for the Ultimate, a HYBRID's card (another element's) and the Ultimate cannot be held together: open, with the hybrids (none designed).
const ENERGY = { unevolvedSlots: 1, evolvedSlots: 3, evolveLevel: 8, altNeeds: 1, alt2Needs: 2, ultNeeds: 3 };
let energyStock = {};   // the run's: element id -> the cards of it you hold (not in a slot)

// what its energy row shows (the roster draws it again when this changes: js/commandcenter.js _ccSideSigNow)
function energySig(f) { return energyFor(f) ? energySlots(f).join() + "/" + energyHeld().map(el => el + energyCount(el)).join() : ""; }
// an element an energy card can be of: a real one (not "none")
function energyElementOk(el) { return typeof el === "string" && el !== ENERGY_NONE && typeof ELEMENTS !== "undefined" && ELEMENTS.some(e => e.id === el && !e.none); }
function energyLabel(el) { const e = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(x => x.id === el) : null; return e ? e.label : "NO"; }
function energyColor(el) { const e = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(x => x.id === el) : null; return e ? e.color : "#cfd8e3"; }
function energyCount(el) { return energyElementOk(el) ? Math.max(0, energyStock[el] | 0) : 0; }
function energyTotal() { let n = 0; for (const el in energyStock) n += energyCount(el); return n; }
function energyAdd(el, n) { if (!energyElementOk(el)) return false; energyStock[el] = Math.max(0, energyCount(el) + (n | 0)); return true; }
// the elements you hold cards of, in the elements' order
function energyHeld() { return (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).map(e => e.id).filter(el => energyCount(el) > 0); }

// ── A FOLLOWER'S SLOTS ──
function energyFor(f) { return !!f && f.isFollower === true && !f.isClone; }
function energySlotCount(f) { return f && f.evolved ? ENERGY.evolvedSlots : ENERGY.unevolvedSlots; }
function energySlots(f) { const n = energySlotCount(f), e = f && Array.isArray(f.energy) ? f.energy : [], out = []; for (let i = 0; i < n; i++) out.push(energyElementOk(e[i]) ? e[i] : null); return out; }   // (a copy)
function energyOwn(f) { return f && f.evolved ? energySlots(f).filter(x => x === f.element).length : 0; }   // its cards of its own element (evolved)
function energyAltOpen(f) { return !f || !f.evolved || f.isFollower !== true || energyOwn(f) >= ENERGY.altNeeds; }   // its second attack (an unevolved follower's BASH is not an element's: open)
function energyAlt2Open(f) { return !f || !f.evolved || f.isFollower !== true || energyOwn(f) >= ENERGY.alt2Needs; }   // its extra attack, where its form has one (a form's moves after its first)
function energyUltOpen(f) { return !!f && !!f.evolved && (f.isFollower !== true || energyOwn(f) >= ENERGY.ultNeeds); }   // its Ultimate (a follower's: with ENERGY.ultNeeds cards of its element)
function energyHybrids(f) { return f && f.evolved ? energySlots(f).filter(x => x && x !== f.element) : []; }   // the other elements whose hybrid attack it would have (none is designed yet)
// what an energy slot's card is for, in words: its element (unevolved), its next attack or a hybrid (evolved)
function energySlotRole(f, slot) {
    const s = energySlots(f), el = s[slot]; if (!el) return null;
    if (!f.evolved) return "ITS ELEMENT";
    if (el !== f.element) return "HYBRID · " + energyLabel(f.element) + " + " + energyLabel(el) + " · NOT DESIGNED YET";
    const k = s.slice(0, slot + 1).filter(x => x === f.element).length;
    const d = typeof evolvedDef === "function" ? evolvedDef(f) : null, extra = d && typeof evoMoveIds === "function" && evoMoveIds(d).length > 1;
    return k === ENERGY.altNeeds ? "UNLOCKS ITS SECOND ATTACK" : k === ENERGY.alt2Needs ? (extra ? "UNLOCKS ITS EXTRA ATTACK" : "ONE MORE FOR ITS ULTIMATE") : k === ENERGY.ultNeeds ? "UNLOCKS ITS ULTIMATE" : "NOTHING MORE YET";
}

// an unevolved follower's element is its card's (none without one): set as the conversion sets one (js/conversion.js convertApply): the table of followers by element, the cards that stop fitting, the squad bar
function energySetElement(f, el) {
    if (!f) return false; el = energyElementOk(el) ? el : ENERGY_NONE;
    if (f.element === el) return false;
    f.element = el;
    if (typeof rebuildFollowerTable === "function") rebuildFollowerTable();
    if (typeof equipValid === "function") equipValid(f);
    if (typeof partyBarRender === "function") partyBarRender(true);
    return true;
}
// why this card cannot go in this slot (el null: take the card out), or null when it can
function energyWhyNot(f, slot, el) {
    if (!energyFor(f) || f.dead) return "FOLLOWERS ONLY";
    if (!(slot >= 0 && slot < energySlotCount(f))) return "NO SUCH SLOT";
    const cur = energySlots(f)[slot];
    if (el == null) return cur ? null : "EMPTY ALREADY";
    if (!energyElementOk(el)) return "NO SUCH CARD";
    if (cur === el) return "IN THIS SLOT ALREADY";
    if (energyCount(el) < 1) return "NO " + energyLabel(el) + " ENERGY CARD";
    return null;
}
// put a card from your stock in the slot, or take it out (el null): the card there before comes back to you. True when it changed.
function energyPut(f, slot, el) {
    if (energyWhyNot(f, slot, el)) return false;
    const s = energySlots(f), cur = s[slot];
    if (cur) energyAdd(cur, 1);
    if (el) energyStock[el] = energyCount(el) - 1;
    s[slot] = el || null; f.energy = s;
    if (!f.evolved) energySetElement(f, s[0]);   // (unevolved: its element is its card's)
    else if (typeof partyBarRender === "function") partyBarRender(true);
    if (f.evolved && f.alt && typeof evoMoveOf === "function" && !evoMoveOf(f)) { f.alt = null; f.altBoth = false; f._altWind = 0; f._altLive = null; }   // (its second attack locked again: back to its normal attack)
    return true;
}
// EXILE (js/party.js partyExile): every card in its slots comes back to your stock (the owner, 2026-11-09: "They come back to you")
function energyReturnAll(f) { if (!energyFor(f)) return 0; let n = 0; for (const el of energySlots(f)) if (el) { energyAdd(el, 1); n++; } f.energy = new Array(energySlotCount(f)).fill(null); return n; }
// EVOLVING (js/evolution.js evoCheck): the card in its slot is used up, its element is its own for good, and it has ENERGY.evolvedSlots empty slots
function energyEvolved(f) { if (!f) return; f.energy = new Array(ENERGY.evolvedSlots).fill(null); }
// a follower's slots full of its own element's cards, free (not from the stock): the title screen's crowd (js/attract.js) shows a form whole
function energyFill(f) { if (!energyFor(f) || !energyElementOk(f.element)) return; f.energy = new Array(energySlotCount(f)).fill(f.element); }
// a follower made without a card (a recruit) or with one (a bred egg's, free: not from the stock): its slots and element
function energyStart(f, el) {
    if (!energyFor(f)) return;
    if (f.evolved) { f.energy = energySlots(f); return; }
    f.energy = [energyElementOk(el) ? el : null]; f.element = f.energy[0] || ENERGY_NONE;
}

// ── PACKS: a pack's `energy` cards (2 in Pack 1 and Series 2: js/cards.js), each of an element found, each element as likely; BLOOM's too once the purification module is installed and has run
//    (build 2026-11-09vv; the owner, 2026-11-10: "Need to add Bloom energy cards ASAP": as BLOOM's other cards, js/cards.js equipBloomReady, and its breeding; until then BLOOM's came only with a bred egg or a conversion) ──
function energyPackPool() {
    const pool = typeof elementsFound === "function" ? elementsFound().filter(energyElementOk) : [], bloom = typeof CONVERT !== "undefined" ? CONVERT.to : "blossom";
    if (typeof convertReady === "function" && convertReady() && energyElementOk(bloom) && pool.indexOf(bloom) < 0) pool.push(bloom);
    return pool;
}
function energyPackRoll(rnd, n) {
    rnd = rnd || Math.random; const pool = energyPackPool();
    if (!pool.length || !(n > 0)) return [];
    const out = []; for (let i = 0; i < n; i++) out.push(pool[Math.min(pool.length - 1, Math.floor(rnd() * pool.length))]);
    return out;
}
function energyPackDeal(rnd, n) { const got = energyPackRoll(rnd, n); for (const el of got) energyAdd(el, 1); return got; }

// ── SAVING: the run's stock (the run's save, js/facilitysave.js); a follower's slots (its record) ──
function energyReset() { energyStock = {}; }   // NEW GAME (js/facilityplay.js facilityResetState, through equipReset)
function energySaveCollect() { const o = {}; for (const el in energyStock) if (energyCount(el) > 0) o[el] = energyCount(el); return o; }
function energySaveApply(o) { energyStock = {}; if (o && typeof o === "object") for (const el in o) if (energyElementOk(el) && Number.isFinite(o[el])) energyAdd(el, Math.min(999, Math.max(0, o[el] | 0))); }
function energyRecord(f) { return energyFor(f) ? energySlots(f) : undefined; }
// a follower's slots from its record; a record from before energy cards (no `energy`): an unevolved follower loses its element, an evolved one keeps it with empty slots (the owner: "Start elementless", "Lock them too")
function energyApplyRecord(f, rec) {
    if (!energyFor(f)) return;
    if (rec && Array.isArray(rec.energy)) { f.energy = rec.energy.slice(0, energySlotCount(f)).map(x => energyElementOk(x) ? x : null); if (!f.evolved) f.element = f.energy[0] || ENERGY_NONE; return; }
    f.energy = new Array(energySlotCount(f)).fill(null);
    if (!f.evolved) f.element = ENERGY_NONE;
}

// ── ITS FACE (the card picker and a pack's reveal draw it as a card: js/cardsui.js; its kind, colour and no rarity: js/cards.js) ──
function energyCardOf(el) {
    if (!energyElementOk(el)) return null;
    return { id: "energy:" + el, kind: "energy", el, name: energyLabel(el) + " ENERGY", rarity: null,
        text: energyLabel(el) + " FOR AN EGG: IT EVOLVES WITH IT AT LV " + ENERGY.evolveLevel + " (USED UP) · " + energyLabel(el) + " FORMS: THEIR NEXT ATTACK" };
}
function energyCardEl(id) { return typeof id === "string" && id.indexOf("energy:") === 0 ? id.slice(7) : null; }

// ITS SYMBOLS (build 2026-11-10e; from the drafts of the squad member's card, the owner picking B: "B looks great and explains progression. Nice touch"): a small mark for each element (a flame, a bolt, a
// snowflake, a drop, a core, a swirl, a flower), for energy itself (a crystal with a spark: an empty slot) and for a slot locked, open or emptied, as SVG on a 24-unit square in the colour around it (currentColor)
const ENERGY_GLYPHS = {
    fire: '<path d="M12 2c.4 3.4-3.6 5-3.6 9 0 1.1.4 2 1 2.6-1.4-.4-2.4-1.6-2.6-3C5.4 12.3 5 14 5 15.3 5 19 8.1 22 12 22s7-3 7-6.7C19 9.6 13.9 7.4 12 2z"/>',
    electric: '<path d="M13.6 2 4.6 13.6h6.2L9.6 22l9.2-11.8h-6.2L13.6 2z"/>',
    ice: '<g fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"><path d="M12 2.8v18.4M4 7.4l16 9.2M4 16.6l16-9.2"/><path d="M12 6.3 9.9 4.2M12 6.3l2.1-2.1M12 17.7l-2.1 2.1M12 17.7l2.1 2.1M7.1 9.2 4.2 8.4M7.1 9.2l-.8-2.9M16.9 14.8l2.9.8M16.9 14.8l.8 2.9M16.9 9.2l.8-2.9M16.9 9.2l2.9-.8M7.1 14.8l-.8 2.9M7.1 14.8l-2.9.8"/></g>',
    toxic: '<path d="M12 2.5S5.4 10.1 5.4 14.6a6.6 6.6 0 0 0 13.2 0C18.6 10.1 12 2.5 12 2.5z"/><circle cx="9.4" cy="14.8" r="1.7" fill="rgba(0,0,0,0.35)"/><circle cx="13.4" cy="17.6" r="1" fill="rgba(0,0,0,0.3)"/>',
    core: '<path d="M12 2.6 20.1 7.3v9.4L12 21.4l-8.1-4.7V7.3z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.6"/>',
    flux: '<path d="M12.2 11.4a1.3 1.3 0 1 1-1.6 1.5M10.6 12.9a3.6 3.6 0 1 1 5.1 1.9M15.7 14.8a6.2 6.2 0 1 1-1.9-9.6M13.8 5.2a8.8 8.8 0 0 1 6.3 9.9" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round"/>',
    blossom: '<circle cx="12" cy="6.3" r="3.6"/><circle cx="17.4" cy="10.2" r="3.6"/><circle cx="15.3" cy="16.6" r="3.6"/><circle cx="8.7" cy="16.6" r="3.6"/><circle cx="6.6" cy="10.2" r="3.6"/><circle cx="12" cy="12" r="2.7" fill="rgba(0,0,0,0.35)"/>',
    energy: '<path d="M12 1.8 18.8 9 12 22.2 5.2 9z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M13 6.6 9.6 12.4h2.6l-1 4.6 3.4-6h-2.6z"/>',
    lock: '<path d="M7.5 11V8.2a4.5 4.5 0 0 1 9 0V11" fill="none" stroke="currentColor" stroke-width="2.2"/><rect x="5.5" y="11" width="13" height="10" rx="2"/>',
    open: '<path d="M7.5 11V8.2a4.5 4.5 0 0 1 8.7-1.6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><rect x="5.5" y="11" width="13" height="10" rx="2"/>',
    out: '<path d="M12 14V3M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 14v6h14v-6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
};
function energyGlyph(k, cls) { return '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="' + (cls || "en-gl") + '">' + (ENERGY_GLYPHS[k] || ENERGY_GLYPHS.energy) + "</svg>"; }
