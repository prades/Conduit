// ─────────────────────────────────────────────────────────
//  EQUIP CARDS — two slots on every follower, and the subclass tag (the Notion "Conduit Game Design Archive"; docs/CARD-SYSTEM.md on the design-notes branch)
// ─────────────────────────────────────────────────────────
// ASKED: "Make way for a robust card system that will be used to give followers [...] a equip card and actually have a slot for another equip card. So two equip cards per follower. And these equip cards are going to be used to buff
// followers and give them new abilities. I'm planning out the specifics, but there also needs to be a new sub archetype for each of the followers, one of four. Being a drone, a mollusk, a crustacean, or an elemental. And these
// basically are nothing but a tag for later classification when it comes to giving buffs to creatures. So just make it to where there's not going to be any conflict, and this new system can rest peacefully within our infrastructure."
// (FIVE subclasses: the user's own roster chart, in the Archive, has a fifth, JELLY, beside the four.) "Card" is also the interface's word for a roster card or a panel (cc-card, the squad bar's slots): these are EQUIP CARDS, and every
// name here starts with equip / EQUIP so that it cannot be mistaken for those or for the other two things "class" means (the player's CLASSES, js/classes.js; a creature's class, js/species.js; a follower's role is what the cards call its class).
//
// WHAT IS BUILT is the plumbing, and nothing that changes a fight. No equip card has an effect yet (the list is not designed): the only cards that exist are the INERT TEST CARDS behind ?cards, which is how the rules, the saving and the
// screens are played with. With no card the screens are there and empty (equipAny): the CARDS sheet says so, and the roster's slots say NO CARDS IN YOUR HAND; the choice at the start of a run opens only when the collection holds a card.
//   SUBCLASS  a tag on each evolved form (EQUIP_FORM_SUBCLASS, the user's roster chart): crustacean, mollusk, elemental, drone or jelly. An egg has none until it evolves, nor do the ten retired forms. It decides nothing yet: it is for the cards to classify by.
//   SLOTS     every follower has two (f.cards = [id | null, id | null]); the player has two UNIVERSAL ones (equipPlayer). A unit cannot wear the same card twice; any number of units can wear the same card, because a card is a TYPE you own, never used up.
//   FITS      a card is one kind: ELEMENT (a follower of that element), CLASS (a follower of that role: brawler, mage or technician), SUBCLASS (a follower of that subclass) or UNIVERSAL (any follower, and the player).
//   OWNED     the permanent COLLECTION: a card is unlocked for good for EQUIP.unlockCost shards (flat, paid from the run's), kept at EQUIP.key, which NEW GAME does not touch and the run's save does not hold.
//   THE HAND  the card types taken into a run, up to EQUIP.startPick, chosen from the collection when it begins (js/cardsui.js); only these can be worn. A card out of the hand comes off everyone.
//   LEAVING   a respawn keeps a follower's cards; EXILE, falling for good (its body is restored with empty slots) and a RE-ROLL empty the slots. Nothing is lost: the card is still in the hand.
//   SAVED     additively (js/facilitysave.js, FS.version stays 1, so every save made before the cards still loads): a follower's record carries `cards`, the run's save carries `cards: { hand, player }`.
//   TICK      equipTick takes off, every half second, whatever no longer fits (a role switched, a card out of the hand): nothing else has to know the cards exist.

const EQUIP = { followerSlots: 2, playerSlots: 2, startPick: 3, unlockCost: 1000, key: "conduit_fp_cards", every: 30 };

// The five subclasses.
const EQUIP_SUBCLASSES = [
    { id: "crustacean", label: "CRUSTACEAN" }, { id: "mollusk", label: "MOLLUSK" }, { id: "elemental", label: "ELEMENTAL" }, { id: "drone", label: "DRONE" }, { id: "jelly", label: "JELLY" },
];
// Which subclass each evolved form is (js/evolution.js EVOLUTIONS ids): the user's consolidated roster chart, with the game's spellings (Sonic Orb is the Static Orb, Seaper the Seeper, Emberhood the Ember Hood, Void Star the Voidstar,
// Horn Shell the Hornshell, Rime Star the Rimestar, Thermite Brawler the Thermite Burrower). The ten retired forms (EVOLUTIONS marked legacy) are not in it: they have none.
const EQUIP_FORM_SUBCLASS = {
    quillstone: "crustacean", staticorb: "drone", mimic: "jelly", jellyram: "jelly", seeper: "crustacean", maw: "elemental",         // the brawlers
    embercowl: "elemental", thunderhead: "elemental", voidstar: "mollusk", hornshell: "mollusk", rotshard: "elemental", rimestar: "drone",   // the mages
    thermite: "drone", hovershell: "drone", gooproxy: "jelly", hammerslug: "mollusk", blightspider: "drone", igloo: "elemental",       // the technicians
};
// A card's rarity, lowest first: the names are the older doc's, shown as bars lit one for each step (js/cardsui.js).
const EQUIP_RARITIES = [
    { id: "unrefined", label: "UNREFINED" }, { id: "refined", label: "REFINED" }, { id: "precision", label: "PRECISION" },
    { id: "prototype", label: "PROTOTYPE" }, { id: "lustrous", label: "LUSTROUS" }, { id: "crystalline", label: "CRYSTALLINE" },
];

// THE CARDS. { id, name, kind, match, rarity, text }: kind is "element" (match: an element id), "class" (match: a follower's role: brawler, sniper = MAGE, camper = TECHNICIAN), "subclass" (match: a subclass id) or "universal" (no match).
// The real cards: none yet. The list is still being designed; a card added here appears in every screen, saves and unlocks with nothing else to change.
const EQUIP_CARDS = {};
// The test cards, behind ?cards: one of each kind, a spread of rarities, and none does anything.
const EQUIP_TEST_CARDS = {};
[   ["test_fire", "TEST · FIRE", "element", "fire", "unrefined"], ["test_ice", "TEST · ICE", "element", "ice", "refined"],
    ["test_brawler", "TEST · BRAWLER", "class", "brawler", "precision"], ["test_mage", "TEST · MAGE", "class", "sniper", "prototype"], ["test_technician", "TEST · TECHNICIAN", "class", "camper", "lustrous"],
    ["test_crustacean", "TEST · CRUSTACEAN", "subclass", "crustacean", "unrefined"], ["test_drone", "TEST · DRONE", "subclass", "drone", "crystalline"],
    ["test_universal_a", "TEST · UNIVERSAL A", "universal", null, "refined"], ["test_universal_b", "TEST · UNIVERSAL B", "universal", null, "precision"],
].forEach(([id, name, kind, match, rarity]) => { EQUIP_TEST_CARDS[id] = { id, name, kind, match, rarity, test: true, text: "A TEST CARD: IT DOES NOTHING" }; });

// THE DEVELOPER SWITCH, read once from the address (as js/attract.js does): "" the real cards only (none yet), "on" (?cards) the test cards exist, "all" (?cards=all) and every one is owned and in the hand, to try the screens by hand (that is never saved).
function _equipFlag() {
    const s = typeof window !== "undefined" && window.location && window.location.search || "";
    return /[?&]cards=all\b/.test(s) ? "all" : /[?&]cards\b/.test(s) ? "on" : "";
}
let equipDev = _equipFlag();
let _equipReg = null, _equipOwned = null;
function equipDevSet(v) { equipDev = v || ""; _equipReg = null; _equipOwned = null; equipReset(); }   // (for the tests, and a console)
function equipCards() { return _equipReg || (_equipReg = equipDev ? Object.assign({}, EQUIP_CARDS, EQUIP_TEST_CARDS) : EQUIP_CARDS); }
function equipCard(id) { const c = typeof id === "string" ? equipCards()[id] : null; return c && typeof c === "object" ? c : null; }
function equipAny() { return Object.keys(equipCards()).length > 0; }   // is there any card at all (when none, the screens say so)
function equipRarityBars(c) { return Math.max(1, EQUIP_RARITIES.findIndex(r => r.id === (c && c.rarity)) + 1); }   // lit bars, of six
function equipRarityLabel(c) { return (EQUIP_RARITIES.find(r => r.id === (c && c.rarity)) || EQUIP_RARITIES[0]).label; }

// ── who a follower is: its element and its role (an evolved form's are its form's), its subclass ──
function _equipForm(f) { return f && f.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[f.evolved] || null : null; }
function equipElementOf(f) { const e = _equipForm(f); return (e && e.element) || (f && f.element) || null; }
function equipRoleOf(f) { const e = _equipForm(f), r = (e && e.role) || (f && f.role) || null; return r === "hybrid" ? "brawler" : r; }   // (a hybrid fights as a brawler: js/npc.js)
function equipSubclassOf(f) { const s = f && f.evolved ? EQUIP_FORM_SUBCLASS[f.evolved] : null; return typeof s === "string" ? s : null; }
function equipSubclassLabel(id) { const s = EQUIP_SUBCLASSES.find(x => x.id === id); return s ? s.label : ""; }
function _equipElementLabel(id) { const e = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(x => x.id === id) : null; return e ? e.label : String(id || "").toUpperCase(); }
function _equipRoleLabel(id) { return typeof roleLabel === "function" ? roleLabel(id) : String(id || "").toUpperCase(); }
// what a card is for, in words: "FIRE FOLLOWERS", "BRAWLERS", "DRONES", "ANY FOLLOWER AND THE PLAYER"
function equipKindLabel(c) {
    if (!c) return "";
    if (c.kind === "element") return "ELEMENT · " + _equipElementLabel(c.match);
    if (c.kind === "class") return "CLASS · " + _equipRoleLabel(c.match);
    if (c.kind === "subclass") return "SUBCLASS · " + equipSubclassLabel(c.match);
    return "UNIVERSAL";
}

// ── THE COLLECTION: the cards unlocked for good (kept at EQUIP.key) ──
function equipOwnedSet() {
    if (_equipOwned) return _equipOwned;
    let ids = [];
    try { const d = JSON.parse(localStorage.getItem(EQUIP.key) || "null"); if (d && d.v === 1 && Array.isArray(d.owned)) ids = d.owned.filter(x => typeof x === "string"); } catch (e) { /* no storage, or not ours: an empty collection */ }
    return _equipOwned = new Set(ids);   // (an id the registry does not know stays: ?cards on and then off loses nothing)
}
function equipOwns(id) { return !!equipCard(id) && (equipDev === "all" || equipOwnedSet().has(id)); }
function equipOwnedList() { return Object.values(equipCards()).filter(c => equipOwns(c.id)); }
function equipWriteOwned() {
    if (equipDev === "all") return false;   // (everything is owned for the look of it: that is not the player's)
    try { localStorage.setItem(EQUIP.key, JSON.stringify({ v: 1, owned: [...equipOwnedSet()] })); return true; } catch (e) { return false; }
}
// the price of a card: flat. Why a card cannot be unlocked now, or null when it can.
function equipUnlockWhyNot(id) {
    if (!equipCard(id)) return "NO SUCH CARD";
    if (equipOwns(id)) return "ALREADY UNLOCKED";
    const have = typeof shardCount === "number" ? shardCount : 0;
    return have < EQUIP.unlockCost ? "NEED ◆" + (EQUIP.unlockCost - have) + " MORE" : null;
}
function equipUnlock(id) {
    if (equipUnlockWhyNot(id)) return false;
    shardCount -= EQUIP.unlockCost; equipOwnedSet().add(id); equipWriteOwned();
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: "CARD UNLOCKED · " + equipCard(id).name, color: "#ffe733", life: 140, vy: -0.25, size: 14 });
    return true;
}

// ── THE RUN'S STATE: the hand, and the player's two Universal slots ──
let equipHand = [];                // the card types in this run's hand
let equipPlayer = [null, null];    // the player's slots
function equipReset() {            // a fresh game (js/facilityplay.js facilityResetState): the collection stays, the rest begins empty
    equipHand = equipDev === "all" ? Object.keys(equipCards()) : []; equipPlayer = [null, null];
}
function equipInHand(id) { return equipHand.indexOf(id) >= 0; }
function equipHandCards() { return equipHand.map(equipCard).filter(Boolean); }
function equipHandCap() { return equipDev === "all" ? Infinity : EQUIP.startPick; }   // (?cards=all has no limit: the whole point is to have every card to hand)
function equipHandAdd(id) {
    if (!equipOwns(id) || equipInHand(id) || equipHand.length >= equipHandCap()) return false;
    equipHand.push(id); return true;
}
function equipHandRemove(id) {     // out of the hand: off everyone who wears it (the tick would do the same, a moment later)
    const i = equipHand.indexOf(id); if (i < 0) return false;
    equipHand.splice(i, 1); equipTick(true); return true;
}
// a fresh run begins (js/facilityplay.js, no saved game): the screen opens to choose the hand, when the collection has anything to choose from (?cards=all fills the hand and asks nothing)
function equipRunStart() {
    if (equipDev === "all" || !equipOwnedList().length || typeof cardsOpen !== "function") return false;
    if (typeof hudCorners === "function" && !hudCorners()) return false;   // a phone has no cards screen yet, so nothing to choose there (it comes later)
    try { return cardsOpen({ start: true }) === true; } catch (e) { console.error("the cards screen could not open", e); return false; }   // (a screen that cannot be drawn never takes the game down)
}

// ── THE FOLLOWER'S SLOTS ──
function equipSlots(f) { const c = f && f.cards; return [c && c[0] || null, c && c[1] || null]; }   // (a copy)
function equipWorn(f) { return equipSlots(f).filter(Boolean).length; }
// does the card fit this follower (null), or why not
function equipFit(f, c) {
    if (!c) return "NO SUCH CARD";
    if (c.kind === "universal") return null;
    if (c.kind === "element") return equipElementOf(f) === c.match ? null : "FOR " + _equipElementLabel(c.match) + " FOLLOWERS";
    if (c.kind === "class") return equipRoleOf(f) === c.match ? null : "FOR " + _equipRoleLabel(c.match) + "S";
    if (c.kind === "subclass") { const s = equipSubclassOf(f); return s === c.match ? null : "FOR " + equipSubclassLabel(c.match) + "S" + (s ? "" : " · EVOLVE FIRST"); }
    return "NOT A CARD";
}
// why this card cannot go in this slot of this follower, or null when it can: a follower (not a clone), the card in the hand, a fit, and not already on its other slot
function equipWhyNot(f, id, slot) {
    const c = equipCard(id);
    if (!c) return "NO SUCH CARD";
    if (!f || f.dead || f.isClone || f.isFollower !== true) return "FOLLOWERS ONLY";
    if (!equipInHand(id)) return "NOT IN YOUR HAND";
    const fit = equipFit(f, c); if (fit) return fit;
    return equipSlots(f).some((x, i) => i !== slot && x === id) ? "ALREADY ON ITS OTHER SLOT" : null;
}
// put a card in a slot (id null empties it); true when it changed
function equipPut(f, slot, id) {
    if ((slot !== 0 && slot !== 1) || !f) return false;
    const c = equipSlots(f);
    if (id == null) { if (!c[slot]) return false; c[slot] = null; f.cards = c[0] || c[1] ? c : undefined; return true; }
    if (equipWhyNot(f, id, slot) || c[slot] === id) return false;
    c[slot] = id; f.cards = c; return true;
}
function equipClear(f) { if (f && f.cards) { f.cards = undefined; return true; } return false; }   // (EXILE, a re-roll)
// takes off what no longer fits (a role switched, a card out of the hand, a card the registry no longer has); how many came off
function equipValid(f) {
    const c = f && f.cards; if (!c) return 0;
    let n = 0;
    for (let i = 0; i < EQUIP.followerSlots; i++) {
        const id = c[i]; if (!id) continue;
        const card = equipCard(id);
        if (!card || !equipInHand(id) || equipFit(f, card) || c.indexOf(id) !== i) { c[i] = null; n++; }
    }
    if (!c[0] && !c[1]) f.cards = undefined;
    return n;
}

// ── THE PLAYER'S SLOTS: Universal cards only ──
function equipPlayerWhyNot(id, slot) {
    const c = equipCard(id);
    if (!c) return "NO SUCH CARD";
    if (!equipInHand(id)) return "NOT IN YOUR HAND";
    if (c.kind !== "universal") return "UNIVERSAL CARDS ONLY";
    return equipPlayer.some((x, i) => i !== slot && x === id) ? "ALREADY IN THE OTHER SLOT" : null;
}
function equipPlayerPut(slot, id) {
    if (slot !== 0 && slot !== 1) return false;
    if (id == null) { if (!equipPlayer[slot]) return false; equipPlayer[slot] = null; return true; }
    if (equipPlayerWhyNot(id, slot) || equipPlayer[slot] === id) return false;
    equipPlayer[slot] = id; return true;
}
// how many units wear a card right now (the player's slots count)
function equipWearers(id) {
    let n = equipPlayer.filter(x => x === id).length;
    if (typeof followers !== "undefined") for (const f of followers) if (f && !f.dead && f.cards && (f.cards[0] === id || f.cards[1] === id)) n++;
    return n;
}

// ── EACH FRAME (js/game.js, beside partyTick): every EQUIP.every frames, whatever no longer fits comes off ──
function equipTick(force) {
    if (!force && typeof frame === "number" && frame % EQUIP.every) return;
    if (typeof followers !== "undefined") for (const f of followers) if (f && f.cards) equipValid(f);
    for (let i = 0; i < EQUIP.playerSlots; i++) { const id = equipPlayer[i]; if (id && (equipPlayerWhyNot(id, i) || equipPlayer.indexOf(id) !== i)) equipPlayer[i] = null; }
}

// ── THE RECORD: what a follower's save entry, and a respawn entry, carry ──
function equipRecord(f) { const c = equipSlots(f); return c[0] || c[1] ? c : undefined; }
function equipRestore(f, cards) {   // (not checked against the hand here: the hand is put back after the followers, and the tick checks them a moment later)
    f.cards = undefined; if (!Array.isArray(cards)) return false;
    const c = [typeof cards[0] === "string" ? cards[0] : null, typeof cards[1] === "string" ? cards[1] : null];
    if (c[0] && c[0] === c[1]) c[1] = null;
    if (c[0] || c[1]) f.cards = c;
    return !!f.cards;
}
// the run's save (js/facilitysave.js): the hand and the player's slots. The collection is its own key.
function equipSaveCollect() { return { hand: equipHand.slice(), player: equipPlayer.slice() }; }
function equipSaveApply(d) {
    if (!d || typeof d !== "object") return false;
    const ids = a => (Array.isArray(a) ? a : []).filter((x, i, all) => typeof x === "string" && equipOwns(x) && all.indexOf(x) === i);
    equipHand = equipDev === "all" ? Object.keys(equipCards()) : ids(d.hand).slice(0, equipHandCap());
    equipPlayer = [null, null];
    (Array.isArray(d.player) ? d.player : []).slice(0, EQUIP.playerSlots).forEach((id, i) => { if (typeof id === "string" && !equipPlayerWhyNot(id, i)) equipPlayer[i] = id; });
    return true;
}
