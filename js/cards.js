// ─────────────────────────────────────────────────────────
//  EQUIP CARDS — two slots on every follower, and the subclass tag (the Notion "Conduit Game Design Archive"; docs/CARD-SYSTEM.md on the design-notes branch)
// ─────────────────────────────────────────────────────────
// ASKED: "Make way for a robust card system that will be used to give followers [...] a equip card and actually have a slot for another equip card. So two equip cards per follower. And these equip cards are going to be used to buff
// followers and give them new abilities. I'm planning out the specifics, but there also needs to be a new sub archetype for each of the followers, one of four. Being a drone, a mollusk, a crustacean, or an elemental. And these
// basically are nothing but a tag for later classification when it comes to giving buffs to creatures. So just make it to where there's not going to be any conflict, and this new system can rest peacefully within our infrastructure."
// (FIVE subclasses: the user's own roster chart, in the Archive, has a fifth, JELLY, beside the four.) "Card" is also the interface's word for a roster card or a panel (cc-card, the squad bar's slots): these are EQUIP CARDS, and every
// name here starts with equip / EQUIP so that it cannot be mistaken for those or for the other two things "class" means (the player's CLASSES, js/classes.js; a creature's class, js/species.js; a follower's role is what the cards call its class).
//
// WHAT IS BUILT is the plumbing and the real cards: the six CRYSTALLINE class cards (each a flat +50% to one stat of a follower's class) and PACK 1's eighteen ELEMENT cards (below). The rest of the list is not designed; the INERT TEST CARDS behind
// ?cards are how the rules, the saving and the screens are played with. A card added to EQUIP_CARDS appears in every screen. With no card the screens are there and empty (equipAny): the CARDS sheet says so, and the roster's slots say NO CARDS
// IN YOUR HAND; the choice at the start of a run opens only when the collection holds a card.
//   EFFECTS   a real card has `bonus` ({ stat: fraction }, a key of EQUIP_STATS) or `proc` (an effect on a hit). A follower's bonus to a stat is the SUM over what it wears (equipBonus: two +50% make +100% of the base, never +125%). It is applied
//             where the follower's numbers are made from its base (js/levels.js _applyFollowerLevel: attack, SP.ATK, defense, maximum health; js/combat.js followerRest: the rest between attacks; js/helpers.js applyDamage: the damage it deals),
//             so it is never saved, never added twice, and comes off with the card (equipRefresh). A proc (equipOnHit, from applyDamage) rolls once for each hit a follower lands and sets a status on the target (js/combat.js) that is refreshed, never stacked.
//   SUBCLASS  a tag on each evolved form (EQUIP_FORM_SUBCLASS, the user's roster chart): crustacean, mollusk, elemental, drone or jelly. An egg has none until it evolves, nor do the ten retired forms. It decides nothing yet: it is for the cards to classify by.
//   SLOTS     every follower has two (f.cards = [id | null, id | null]); the player has two UNIVERSAL ones (equipPlayer). A unit cannot wear the same card twice; any number of units can wear the same card, because a card is a TYPE you own, never used up.
//   FITS      a card is one kind: ELEMENT (a follower of that element), CLASS (a follower of that role: brawler, mage or technician), SUBCLASS (a follower of that subclass) or UNIVERSAL (any follower, and the player).
//   OWNED     the permanent COLLECTION: a card is unlocked for good for EQUIP.unlockCost shards (flat, paid from the run's), kept at EQUIP.key, which NEW GAME does not touch and the run's save does not hold.
//   THE HAND  the card types taken into a run, up to EQUIP.startPick, chosen from the collection when it begins (js/cardsui.js). A card put back out of the hand comes off everyone, unless it was found as well.
//   PACK 1    ◆EQUIP_PACK.price buys a BOOSTER PACK: 4 Element cards, one reserved for a Precision, the others rolled over Unrefined, Refined and Precision by weight; none twice in a pack. What a pack deals is FOUND (equipFound): a card
//             to wear at once, for this run only (NEW GAME clears it) unless EQUIP.unlockCost shards keep it for good. Only the hand and what is found can be worn.
//   SERIES 2  a second pack (EQUIP_PACK2, in EQUIP_PACKS with Pack 1) for the SPECIES cards (the subclass kind) and CLASS cards of the "Series 2" brief: its plumbing is here (the roll, the sale, the shelf and the sheet take any pack of
//             the list), its card list (EQUIP_SERIES2) and its numbers are not, so it is not on sale (equipPackOnSale) until they are. A technician's ABILITY COOLDOWN is a stat a card can name (EQUIP_STATS.cooldown).
//   LEAVING   a respawn keeps a follower's cards; EXILE, falling for good (its body is restored with empty slots) and a RE-ROLL empty the slots. Nothing is lost: the card is still in the hand.
//   SAVED     additively (js/facilitysave.js, FS.version stays 1, so every save made before the cards still loads): a follower's record carries `cards`, the run's save carries `cards: { hand, player, found }`.
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

// THE CARDS. { id, name, kind, match, rarity, text, bonus? }: kind is "element" (match: an element id), "class" (match: a follower's role: brawler, sniper = MAGE, camper = TECHNICIAN), "subclass" (match: a subclass id) or "universal" (no match).
// `bonus` ({ stat: fraction }) is what a real card adds to its wearer; a test card has none.
// The real cards: the six CRYSTALLINE ones (the rarest tier; ASKED in the "Crystalline Card Implementation" brief), each a CLASS card with one flat +50% and no other effect. The rest of the list is still being designed; a card added here appears
// in every screen, saves and unlocks with nothing else to change. The names are in the interface's capitals.
const EQUIP_CARDS = {};
[   ["impact_test", "IMPACT TEST", "brawler", "attack", "+50% ATTACK DAMAGE"], ["stress_tested", "STRESS TESTED", "brawler", "maxHealth", "+50% MAXIMUM HEALTH"],
    ["power_surge", "POWER SURGE", "sniper", "specialAttack", "+50% ELEMENTAL ATTACK POWER"], ["speed_trial", "SPEED TRIAL", "sniper", "attackSpeed", "+50% ATTACK SPEED"],
    ["prototype_x", "PROTOTYPE X", "camper", "attackSpeed", "+50% ATTACK SPEED"], ["core_reinforcement", "CORE REINFORCEMENT", "camper", "maxHealth", "+50% MAXIMUM HEALTH"],
].forEach(([id, name, role, stat, text]) => { EQUIP_CARDS[id] = { id, name, kind: "class", match: role, rarity: "crystalline", text, bonus: { [stat]: 0.5 } }; });

// PACK 1's EIGHTEEN CARDS (ASKED, the "Pack 1" brief, 2026-10-30): three for each element, Unrefined, Refined and Precision, all of the ELEMENT kind: a follower of the element wears one whatever its class. EVERY NUMBER OF AN EFFECT IS IN THIS TABLE and
// nowhere else, so it is the one place to tune (the text on each card is made from it). An effect is a stat bonus, { bonus: { stat: fraction } } (a key of EQUIP_STATS), or a PROC, { proc: { kind, chance, ... } }: each hit the follower lands rolls once
// for it. The procs: burn (dps a second for seconds), poison (NO damage: cut, the share of its bite power taken, for seconds), glitch (seconds: every wind-up it tries fails), slow (cut: the share of its speed taken, seconds), siphon (share: of
// the damage dealt, healed to the follower), knockback (push: the velocity, 0.22 as the Core bash's, which carries it about 0.8 tile).
const EQUIP_PACK1 = [
    ["ember_plating",      "EMBER PLATING",      "fire",     "unrefined", { bonus: { attack: 0.05 } }],
    ["furnace_heart",      "FURNACE HEART",      "fire",     "refined",   { bonus: { attack: 0.10 } }],
    ["cinderbrand",        "CINDERBRAND",        "fire",     "precision", { proc: { kind: "burn", chance: 0.15, dps: 3, seconds: 3 } }],
    ["venom_gland",        "VENOM GLAND",        "toxic",    "unrefined", { bonus: { specialAttack: 0.05 } }],
    ["corrosive_reservoir", "CORROSIVE RESERVOIR", "toxic",   "refined",   { bonus: { specialAttack: 0.10 } }],
    ["mireblight",         "MIREBLIGHT",         "toxic",    "precision", { proc: { kind: "poison", chance: 0.15, cut: 0.40, seconds: 4 } }],
    ["charged_wiring",     "CHARGED WIRING",     "electric", "unrefined", { bonus: { attackSpeed: 0.05 } }],
    ["arc_capacitor",      "ARC CAPACITOR",      "electric", "refined",   { bonus: { attackSpeed: 0.10 } }],
    ["static_lock",        "STATIC LOCK",        "electric", "precision", { proc: { kind: "glitch", chance: 0.10, seconds: 0.5 } }],
    ["frost_lining",       "FROST LINING",       "ice",      "unrefined", { bonus: { defense: 0.05 } }],
    ["permafrost_shell",   "PERMAFROST SHELL",   "ice",      "refined",   { bonus: { defense: 0.10 } }],
    ["rime_snare",         "RIME SNARE",         "ice",      "precision", { proc: { kind: "slow", chance: 0.20, cut: 0.25, seconds: 2 } }],
    ["flux_cell",          "FLUX CELL",          "flux",     "unrefined", { bonus: { maxHealth: 0.05 } }],
    ["vortex_core",        "VORTEX CORE",        "flux",     "refined",   { bonus: { maxHealth: 0.10 } }],
    ["siphon_field",       "SIPHON FIELD",       "flux",     "precision", { proc: { kind: "siphon", chance: 0.15, share: 0.10 } }],
    ["impact_studs",       "IMPACT STUDS",       "core",     "unrefined", { bonus: { damage: 0.05 } }],
    ["bedrock_matrix",     "BEDROCK MATRIX",     "core",     "refined",   { bonus: { damage: 0.10 } }],
    ["repulsor_pulse",     "REPULSOR PULSE",     "core",     "precision", { proc: { kind: "knockback", chance: 0.15, push: 0.22 } }],
];
const EQUIP_FPS = 60;   // the game's frames in a second (every timer in it is in frames: a 3 second burn is 180)
const _EQUIP_STAT_WORDS = { attack: "ATTACK", specialAttack: "SPECIAL ATTACK", attackSpeed: "ATTACK SPEED", defense: "DEFENSE", maxHealth: "MAXIMUM HP", damage: "DAMAGE DEALT, ALL ATTACKS", cooldown: "ABILITY COOLDOWN" };
const _equipPct = n => (Math.round(n * 1000) / 10) + "%", _equipSec = n => (Math.round(n * 10) / 10) + (n === 1 ? " SECOND" : " SECONDS");
// what a card says, made from its numbers (so that tuning a number tunes the words)
function equipEffectText(fx) {
    if (fx && fx.bonus) { const k = Object.keys(fx.bonus)[0]; return (k === "cooldown" ? "−" : "+") + _equipPct(fx.bonus[k]) + " " + (_EQUIP_STAT_WORDS[k] || String(k).toUpperCase()); }   // (a cooldown bonus is a share taken OFF)
    const p = fx && fx.proc; if (!p) return "";
    const hit = _equipPct(p.chance) + " PER HIT TO ";
    if (p.kind === "burn") return hit + "BURN: " + p.dps + " DAMAGE A SECOND FOR " + _equipSec(p.seconds);
    if (p.kind === "poison") return hit + "POISON: IT HITS " + _equipPct(p.cut) + " WEAKER FOR " + _equipSec(p.seconds);
    if (p.kind === "glitch") return hit + "GLITCH: ITS WIND-UPS FAIL FOR " + _equipSec(p.seconds);
    if (p.kind === "slow") return hit + "SLOW BY " + _equipPct(p.cut) + " FOR " + _equipSec(p.seconds);
    if (p.kind === "siphon") return hit + "HEAL " + _equipPct(p.share) + " OF THE DAMAGE DEALT";
    if (p.kind === "knockback") return hit + "KNOCK THE TARGET BACK";
    return "";
}
EQUIP_PACK1.forEach(([id, name, element, rarity, fx]) => { EQUIP_CARDS[id] = Object.assign({ id, name, kind: "element", match: element, rarity, text: equipEffectText(fx), pack: "pack1" }, fx); });
// SERIES 2 (ASKED, the "Series 2" brief, 2026-10-31): two categories of card, SPECIES CARDS (the game's `subclass` kind: Jelly, Mollusk, Elemental, Crustacean or Drone, a tag every evolved form has: EQUIP_FORM_SUBCLASS) and CLASS CARDS
// (the `class` kind: Brawler, Mage or Technician), no hybrid identities, over the six rarities. THE LIST IS NOT HERE YET: the archive that holds it could not be read this session (docs/OPEN-QUESTIONS.md), and no card is invented in its
// place. A Series 2 card is a row of this table, in the shape of Pack 1's rows with its kind and its match: [id, name, kind ("subclass" | "class"), match (a subclass id | brawler | sniper | camper), rarity, fx]; a row added here is dealt by
// the Series 2 pack (EQUIP_PACK2, below), worn by what it fits (equipFit: a species card by a follower of that subclass, a class card by one of that role), summed with the others (equipBonus), saved and loaded with nothing else to change.
const EQUIP_SERIES2 = [];
EQUIP_SERIES2.forEach(([id, name, kind, match, rarity, fx]) => { EQUIP_CARDS[id] = Object.assign({ id, name, kind, match, rarity, text: equipEffectText(fx), pack: "series2" }, fx); });
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
function equipRarityBars(c) { return Math.max(1, EQUIP_RARITIES.findIndex(r => r.id === (c && c.rarity)) + 1); }   // the segments lit on its rarity chip, of six
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
// the price of a card: flat. Why a card cannot be unlocked now, or null when it can. A card a pack deals (c.pack) is unlocked from the ones FOUND: it has to be found first (EQUIP_PACK.unlockNeedsFind); the others (the Crystalline six,
// which no pack deals yet) are unlocked as they were.
function equipUnlockWhyNot(id) {
    const c = equipCard(id); if (!c) return "NO SUCH CARD";
    if (equipOwns(id)) return "ALREADY UNLOCKED";
    { const pk = equipPackOf(c); if (pk && pk.unlockNeedsFind && !equipIsFound(id)) return "FIND IT IN A PACK FIRST"; }
    const have = typeof shardCount === "number" ? shardCount : 0;
    return have < EQUIP.unlockCost ? "NEED ◆" + (EQUIP.unlockCost - have) + " MORE" : null;
}
function equipUnlock(id) {
    if (equipUnlockWhyNot(id)) return false;
    shardCount -= EQUIP.unlockCost; equipOwnedSet().add(id); equipWriteOwned();
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: "CARD UNLOCKED · " + equipCard(id).name, color: "#ffe733", life: 140, vy: -0.25, size: 14 });
    return true;
}

// ── THE RUN'S STATE: the hand, the cards found in packs, and the player's two Universal slots ──
let equipHand = [];                // the card types in this run's hand
let equipFound = [];               // the card types found in packs this run: worn at once, and gone with the run unless EQUIP.unlockCost shards unlock one for good
let equipPackLast = null;          // the last pack opened this run, for the sheet to show: { ids, fresh } (not saved)
let equipPlayer = [null, null];    // the player's slots
function equipReset() {            // a fresh game (js/facilityplay.js facilityResetState): the collection stays, the rest begins empty
    equipHand = equipDev === "all" ? Object.keys(equipCards()) : []; equipFound = []; equipPackLast = null; equipPlayer = [null, null]; equipCredits = 0; equipShelf = { ids: [], until: 0 };
}
function equipInHand(id) { return equipHand.indexOf(id) >= 0; }
function equipIsFound(id) { return equipFound.indexOf(id) >= 0; }
function equipUsable(id) { return !!equipCard(id) && (equipInHand(id) || equipIsFound(id)); }   // a card that can be worn now: in the hand, or found this run
function equipHandCards() { return equipHand.map(equipCard).filter(Boolean); }
function equipUsableCards() { return Object.values(equipCards()).filter(c => equipUsable(c.id)); }   // (in the registry's order: what the roster's drop-downs list)
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
// why this card cannot go in this slot of this follower, or null when it can: a follower (not a clone), the card in the hand or found, a fit, and not already on its other slot
function equipWhyNot(f, id, slot) {
    const c = equipCard(id);
    if (!c) return "NO SUCH CARD";
    if (!f || f.dead || f.isClone || f.isFollower !== true) return "FOLLOWERS ONLY";
    if (!equipUsable(id)) return "NOT IN YOUR HAND";
    const fit = equipFit(f, c); if (fit) return fit;
    return equipSlots(f).some((x, i) => i !== slot && x === id) ? "ALREADY ON ITS OTHER SLOT" : null;
}
// put a card in a slot (id null empties it); true when it changed
function equipPut(f, slot, id) {
    if ((slot !== 0 && slot !== 1) || !f) return false;
    const c = equipSlots(f);
    if (id == null) { if (!c[slot]) return false; c[slot] = null; f.cards = c[0] || c[1] ? c : undefined; equipRefresh(f); return true; }
    if (equipWhyNot(f, id, slot) || c[slot] === id) return false;
    c[slot] = id; f.cards = c; equipRefresh(f); return true;
}
function equipClear(f) { if (f && f.cards) { f.cards = undefined; equipRefresh(f); return true; } return false; }   // (EXILE, a re-roll)
// takes off what no longer fits (a role switched, a card out of the hand and not found, a card the registry no longer has); how many came off
function equipValid(f) {
    const c = f && f.cards; if (!c) return 0;
    let n = 0;
    for (let i = 0; i < EQUIP.followerSlots; i++) {
        const id = c[i]; if (!id) continue;
        const card = equipCard(id);
        if (!card || !equipUsable(id) || equipFit(f, card) || c.indexOf(id) !== i) { c[i] = null; n++; }
    }
    if (!c[0] && !c[1]) f.cards = undefined;
    if (n) equipRefresh(f);
    return n;
}

// ── THE EFFECTS: what the worn cards add ──
// The stats a card's `bonus` can name, and what each one is in the game (no stat is made up: each is a number the game already has for it).
//   attack         ATTACK            the follower's ATK (stats.attack, and its power, which the signature moves read)
//   specialAttack  SPECIAL ATTACK    its SP.ATK (stats.specialAttack): the Mage's ranged shot and each element's special (fire bombs, static field, ice burst, singularity, smoke bomb) are made from it
//   defense        DEFENSE           its DEF (stats.defense): a hit it takes is taken down by it (js/levels.js defenseMult)
//   maxHealth      MAXIMUM HEALTH    its maximum health (js/levels.js: the hp stat's FOLLOWER_HP_MULT)
//   attackSpeed    ATTACK SPEED      the rest between its attacks (js/combat.js followerRest: the basic, elemental and special attacks, and the Mage's shot; a signature move and a technician's ability keep their own timers)
//   damage         DAMAGE DEALT      a share of every hit it deals, whatever the attack (js/helpers.js applyDamage). The game has no damage categories (its attacks are ELEMENTAL and sort only into the basic hit, the element's
//                                    "physical" and its special), so "across all damage categories" is every hit it lands: a burn's own tick has no attacker, so it is not one.
//   cooldown       ABILITY COOLDOWN  the share taken OFF a technician's ability cooldown (js/techabilities.js techCooldown, at every place a cooldown is set): two cards of +0.25 take half off; never more than nine tenths. A card of
//                                    this stat on a brawler or a mage does nothing (they have no ability cooldown), as the Series 2 class cards for technicians need it. The first wait after joining the squad is not a cooldown.
const EQUIP_STATS = { attack: "ATTACK", specialAttack: "SPECIAL ATTACK", defense: "DEFENSE", maxHealth: "MAXIMUM HEALTH", attackSpeed: "ATTACK SPEED", damage: "DAMAGE DEALT", cooldown: "ABILITY COOLDOWN" };
// a follower's total bonus to one stat: ADDITIVE over the cards it wears (two +50% are +1.0), a card counted once, only a card that exists and fits it. Whether the card is in the hand is not asked here: the stats are made before the
// hand is put back on a load (equipSaveApply), and a card out of the hand comes off at once or within half a second (equipHandRemove, equipTick), which makes the stats again.
function equipBonus(f, stat) {
    const c = f && f.cards; if (!Array.isArray(c)) return 0;
    let sum = 0;
    for (let i = 0; i < EQUIP.followerSlots; i++) {
        const id = c[i]; if (!id || c.indexOf(id) !== i) continue;
        const card = equipCard(id); if (!card || !card.bonus || equipFit(f, card)) continue;
        const b = card.bonus[stat]; if (typeof b === "number" && isFinite(b)) sum += b;
    }
    return sum;
}
function equipMult(f, stat) { return 1 + equipBonus(f, stat); }   // (1 for a follower with no card)
// after a follower's cards changed: its numbers made again from its base, as a level-up does (js/levels.js), so the bonus is on or off at once and is never added twice. Only a follower that is up and levelled (not a clone, not one
// walking back to be re-rolled, not one that is gone).
function equipRefresh(f) {
    if (!f || f.isClone || f.isFollower !== true || f.dead || f.returningToCrystal || !f.base || !Number.isFinite(f.level) || typeof _applyFollowerLevel !== "function") return false;
    _applyFollowerLevel(f, false); return true;
}

// ── A PROC: an effect on a hit ──
// js/helpers.js applyDamage calls equipOnHit for every hit a follower of yours lands on an enemy (not a reflected hit, not a set amount, not a burn's or a cloud's own tick: those have no attacker). Each proc card the follower wears rolls once, at its chance, and
// a success sets a status on the target through the game's own status code (js/combat.js applyBurn, applyWeaken, applyGlitch, applyKnockback; js/abilities.js applySlow; healUnit). A status already on is REFRESHED (the longer time and the stronger number win),
// never stacked, so a fast hitter keeps one timer going and not many; a status runs out by itself (js/combat.js updateStatusEffects). `dealt` is the health the hit really took.
function equipOnHit(src, target, dealt) {
    const c = src && src.cards; if (!Array.isArray(c) || !target || target === src) return;
    for (let i = 0; i < EQUIP.followerSlots; i++) {
        const id = c[i]; if (!id || c.indexOf(id) !== i) continue;
        const card = equipCard(id), p = card && card.proc; if (!p || equipFit(src, card)) continue;
        if (Math.random() < p.chance) _equipProc(src, target, p, dealt);
    }
}
function _equipSay(t, text, col) { if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: t.x, y: t.y, text, color: col, size: 11, life: 40, vy: -0.03 }); }
function _equipProc(src, t, p, dealt) {
    if (p.kind === "siphon") { if (typeof healUnit === "function") healUnit(src, dealt * p.share, src); return; }   // (to the follower, whatever the hit killed or not)
    if (!t || t.dead || !(t.health > 0) || t.team === "green") return;   // (every other effect is for an enemy still standing)
    const frames = Math.round((p.seconds || 0) * EQUIP_FPS), tick = typeof DOT_TICK === "number" ? DOT_TICK : 20;
    if (p.kind === "burn" && typeof applyBurn === "function") { if (applyBurn(t, p.dps * tick / EQUIP_FPS, frames)) _equipSay(t, "BURN", "#ff8844"); }
    else if (p.kind === "poison" && typeof applyWeaken === "function") { if (applyWeaken(t, frames, 1 - p.cut)) _equipSay(t, "POISON", "#88ff44"); }
    else if (p.kind === "glitch" && typeof applyGlitch === "function") { if (applyGlitch(t, frames)) _equipSay(t, "GLITCH", "#ffee55"); }
    else if (p.kind === "slow" && typeof applySlow === "function") {
        const k = 1 - p.cut; if (t.slowed > 0 && t.slowFactor < k) return;   // (a stronger slow it has, a web, is kept: js/techabilities.js does the same)
        if (!(t.slowed > 0)) _equipSay(t, "SLOWED", "#aaeeff"); applySlow(t, frames, k);
    }
    else if (p.kind === "knockback" && typeof applyKnockback === "function") applyKnockback(t, src, p.push);
}

// ── THE PLAYER'S SLOTS: Universal cards only ──
function equipPlayerWhyNot(id, slot) {
    const c = equipCard(id);
    if (!c) return "NO SUCH CARD";
    if (!equipUsable(id)) return "NOT IN YOUR HAND";
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
    equipShelfTick();   // (the market's shelf: a new one when the time is up)
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
// the run's save (js/facilitysave.js): the hand, the cards found and the player's slots. The collection is its own key.
function equipSaveCollect() { equipShelfSync(); return { hand: equipHand.slice(), found: equipFound.slice(), player: equipPlayer.slice(), credits: equipCredits, shelf: { ids: equipShelf.ids.slice(), left: Math.max(0, equipShelf.until - _equipNow()) } }; }
function equipSaveApply(d) {
    if (!d || typeof d !== "object") return false;
    const ids = a => (Array.isArray(a) ? a : []).filter((x, i, all) => typeof x === "string" && equipOwns(x) && all.indexOf(x) === i);
    equipHand = equipDev === "all" ? Object.keys(equipCards()) : ids(d.hand).slice(0, equipHandCap());
    equipFound = (Array.isArray(d.found) ? d.found : []).filter((x, i, all) => typeof x === "string" && !!equipCard(x) && all.indexOf(x) === i);   // (a card the registry has; found needs no ownership)
    equipCredits = Number.isFinite(d.credits) && d.credits > 0 ? d.credits : 0;
    const sh = d.shelf && typeof d.shelf === "object" ? d.shelf : null;   // (a save from before the market has none: the first tick deals a shelf)
    equipShelf = sh && Array.isArray(sh.ids) && Number.isFinite(sh.left) ? { ids: sh.ids.filter((x, i, all) => typeof x === "string" && !!equipCard(x) && all.indexOf(x) === i).slice(0, EQUIP_MARKET.shelf), until: _equipNow() + Math.max(0, Math.min(EQUIP_MARKET.every, sh.left)) } : { ids: [], until: 0 };
    equipPlayer = [null, null];
    (Array.isArray(d.player) ? d.player : []).slice(0, EQUIP.playerSlots).forEach((id, i) => { if (typeof id === "string" && !equipPlayerWhyNot(id, i)) equipPlayer[i] = id; });
    return true;
}

// ── PACK 1: THE BOOSTER PACK ──
// ASKED (the "Pack 1" brief, 2026-10-30): "Price: 100 coins [the game's currency is shards]. Exactly 4 cards per pack. Eligible rarities: Unrefined, Refined, Precision only. Initial per-slot rarity weights: Unrefined 60%, Refined 30%,
// Precision 10%. Guarantee at least one Precision card in every pack: reserve one of the four slots for the guarantee, then roll the remaining slots using the configured weights. Prevent the same card from appearing twice in a single pack."
// All of it is in EQUIP_PACK, to tune. A pack takes its cards from the cards that name it (c.pack) and are of its kinds and rarities, so no other card can come out of it; a rarity that has run out of cards in this pack is left out of the roll
// (the weights of the others are used as they are), and a pack that cannot be made (too few cards, none of the reserved rarity) is not sold. A card you already have (in the hand, or found this run) is a DUPLICATE: it pays credits (the market, below) and is not found again.
const EQUIP_PACK = {
    id: "pack1", name: "PACK 1", price: 100, size: 4,
    kinds: ["element"],
    rarities: { unrefined: 60, refined: 30, precision: 10 },   // the weight of each eligible rarity for a slot that is rolled
    guaranteed: { rarity: "precision", count: 1 },             // the slots reserved for a rarity, filled first
    keep: "run",                                               // what a dealt card becomes: "run" (FOUND: worn at once, this run only) or "forever" (owned for good at once)
    unlockNeedsFind: true,                                     // a card a pack deals has to be found before EQUIP.unlockCost shards can keep it for good
};
// THE SERIES 2 PACK (the "Series 2" brief, 2026-10-31): the pack that deals the Series 2 cards (EQUIP_SERIES2: species cards and class cards), in the same shape as Pack 1. Its price, its odds and its reserved slot are NOT SET
// (null): the brief gives the two categories and the six rarities and leaves the numbers to the archive, which could not be read this session (docs/OPEN-QUESTIONS.md). A pack that is not on sale (equipPackOnSale: a price, odds and
// a reserved slot) is not rolled, not sold ("NOT ON SALE YET") and not shown on the CARDS sheet; its cards, when they are rows of EQUIP_SERIES2, are still worn, found, unlocked and saved like any card. Every pack is in EQUIP_PACKS:
// the roll, the sale, the shelf and the sheet take a pack and ask nothing of which one it is.
const EQUIP_PACK2 = {
    id: "series2", name: "SERIES 2", price: null, size: 4,
    kinds: ["subclass", "class"],                              // species cards (the subclass kind) and class cards; never an element card, never a universal one
    rarities: null,                                            // NOT SET: the weight of each of the six rarities, when the archive gives them
    guaranteed: null,                                          // NOT SET: the slot reserved for a rarity, if Series 2 has one
    keep: "run", unlockNeedsFind: true,
};
const EQUIP_PACKS = [EQUIP_PACK, EQUIP_PACK2];
function equipPackById(id) { return EQUIP_PACKS.find(p => p.id === id) || null; }
function equipPackOf(c) { return c && c.pack ? equipPackById(c.pack) : null; }   // the pack a card is dealt by, or null (the Crystalline six)
function equipPackOnSale(pack) { return !!pack && Number.isFinite(pack.price) && pack.price >= 0 && !!pack.rarities && !!pack.guaranteed && pack.size > 0; }
function equipPacksOnSale() { return EQUIP_PACKS.filter(equipPackOnSale); }
// a small seeded generator (mulberry32), so a pack can be rolled the same twice: the tests give a seed; the game gives none and uses Math.random
function equipRng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function equipPackPool(pack) { pack = pack || EQUIP_PACK; return Object.values(equipCards()).filter(c => !c.test && c.pack === pack.id && pack.kinds.indexOf(c.kind) >= 0 && !!pack.rarities && pack.rarities[c.rarity] > 0); }
// the ids a pack deals (in no set order), or null when it cannot be made (nor from a pack that is not on sale)
function equipPackRoll(seed, pack) {
    pack = pack || EQUIP_PACK; if (!equipPackOnSale(pack)) return null; const rnd = Number.isFinite(seed) ? equipRng(seed) : Math.random;
    const pool = equipPackPool(pack); if (pool.length < pack.size) return null;
    const left = {}; for (const c of pool) (left[c.rarity] = left[c.rarity] || []).push(c);
    const out = [], take = r => { const l = left[r]; if (!l || !l.length) return false; out.push(l.splice(Math.min(l.length - 1, Math.floor(rnd() * l.length)), 1)[0]); return true; };   // (a card leaves the pool once it is taken: never twice)
    for (let i = 0; i < pack.guaranteed.count; i++) if (!take(pack.guaranteed.rarity)) return null;
    while (out.length < pack.size) {
        const rs = Object.keys(pack.rarities).filter(r => left[r] && left[r].length), total = rs.reduce((n, r) => n + pack.rarities[r], 0); if (!rs.length) return null;
        let x = rnd() * total, pick = rs[rs.length - 1]; for (const r of rs) { if (x < pack.rarities[r]) { pick = r; break; } x -= pack.rarities[r]; }
        take(pick);
    }
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = out[i]; out[i] = out[j]; out[j] = t; }   // (the reserved card is not always first)
    return out.map(c => c.id);
}
// why a pack cannot be bought now, or null when it can
function equipPackWhyNot(pack) {
    pack = pack || EQUIP_PACK;
    if (!equipPackOnSale(pack)) return "NOT ON SALE YET";   // (Series 2, until its numbers are given)
    const have = typeof shardCount === "number" ? shardCount : 0, pool = equipPackPool(pack);
    if (have < pack.price) return "NEED ◆" + (pack.price - have) + " MORE";
    if (pool.length < pack.size || pool.filter(c => c.rarity === pack.guaranteed.rarity).length < pack.guaranteed.count) return "NO CARDS TO FIND";
    return null;
}
// buy and open a pack: the price is paid from the run's shards, the cards are dealt; returns their ids, or null (nothing is paid)
function equipPackOpen(seed, pack) {
    pack = pack || EQUIP_PACK; if (equipPackWhyNot(pack)) return null;
    const ids = equipPackRoll(seed, pack); if (!ids || ids.length !== pack.size) return null;
    shardCount -= pack.price;
    const fresh = [], dupes = []; let credits = 0;
    for (const id of ids) {
        if (equipDuplicate(id)) { dupes.push(id); credits += equipMarketValue(equipCard(id)) * EQUIP_MARKET.share; continue; }   // a card you already have pays credits instead of being found again
        if (pack.keep === "forever") equipOwnedSet().add(id); else equipFound.push(id);
        fresh.push(id);
    }
    if (pack.keep === "forever") equipWriteOwned();
    equipCredits += credits;
    equipPackLast = { pack: pack.id, ids: ids.slice(), fresh, dupes, credits };
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: "PACK OPENED · " + ids.length + " CARDS", color: "#ffe733", life: 140, vy: -0.25, size: 14 });
    return ids;
}

// ── THE MARKET: credits, and a shelf that changes ──
// ASKED (the owner's answers, 2026-10-30): a duplicate goes "into a special buy menu: credits that you use to buy the permanent cards, and a rotating buy menu that refreshes every 5 minutes; cards go from 90 to 650 credits; duplicates cannot be found
// there; the credits from a duplicate are 25% of the card's market value; you can also buy the cards with actual shards too". So:
//   CREDITS    this run's. A pack's DUPLICATE (a card already in the hand or already found this run) pays EQUIP_MARKET.share of its value in credits instead of being found again; a card you own for good but did not bring is NOT a duplicate (it is found
//              for the run, so you can wear it beyond the hand's three). Credits go with the run (equipReset).
//   THE SHELF  EQUIP_MARKET.shelf cards, none of them in the hand or found this run (so never a duplicate), taken only from the cards a pack deals (the Crystalline six, which no pack deals, are not sold), DEALT WITH THE PACK'S OWN ODDS
//              (EQUIP_PACK.rarities: "weighted like a pack", the owner: mostly Unrefined, a Precision only now and then); a new shelf every EQUIP_MARKET.every frames of play (5 minutes at 60 a second: the game's own clock, saved with the run, so a
//              reload keeps the shelf and the time left), and THE CLOCK WAITS WHILE THE CARDS SHEET IS OPEN (the owner), so a shelf never changes while you choose. A card bought leaves the shelf, and nothing takes its place until the next one.
//   BUYING     a card costs its value in credits, or the same number of shards. A card new to you is kept for good AND found (worn at once); one you own for good but did not bring is found for the run. The flat unlock of a found card stays.
const EQUIP_MARKET = {
    values: { unrefined: 90, refined: 150, precision: 250, prototype: 350, lustrous: 500, crystalline: 650 },   // a card's market value by rarity, in credits (a shard buys the same number)
    share: 0.25,       // the share of its value a duplicate pays in credits
    shelf: 6,          // cards on the shelf at a time
    every: 18000,      // frames between one shelf and the next (5 minutes of play)
};
let equipCredits = 0;                      // this run's credits (a half is possible: 25% of 90)
let equipShelf = { ids: [], until: 0 };    // the cards for sale, and the frame (the game's `frame`) the next shelf comes
function _equipNow() { return typeof frame === "number" ? frame : 0; }
// While the CARDS sheet is open the shelf's clock waits: each sync made with the sheet open pushes the shelf's time up by the frames since the last one, so the time spent on the sheet is not counted. The sheet's opening and closing, its
// redraws, the tick and a save all sync; the game itself is not paused (the owner's earlier answer).
let _equipSyncAt = null;                   // the frame of the last sync made with the sheet open, or null (it is closed)
function equipShelfSync() {
    const now = _equipNow(), open = typeof cardsPanelOpen !== "undefined" && cardsPanelOpen === true;
    if (open && _equipSyncAt !== null) equipShelf.until += Math.max(0, now - _equipSyncAt);
    _equipSyncAt = open ? now : null;
}
function equipCreditsText(n) { return String(Math.round(n * 100) / 100); }   // credits as they are, a half included: 22.5, 45 (the owner: "show the half")
function equipMarketValue(c) { return c && EQUIP_MARKET.values[c.rarity] || 0; }
function equipDuplicate(id) { const pk = equipPackOf(equipCard(id)); return equipInHand(id) || equipIsFound(id) || (!!pk && pk.keep === "forever" && equipOwns(id)); }   // a card you already have this run
function equipShelfPool() { const seen = new Set(); return equipPacksOnSale().flatMap(p => equipPackPool(p)).filter(c => !seen.has(c.id) && seen.add(c.id) && equipMarketValue(c) > 0 && !equipInHand(c.id) && !equipIsFound(c.id)); }   // (the cards the packs on sale deal, that you do not have this run)
function equipShelfIds() { const ok = new Set(equipShelfPool().map(c => c.id)); return equipShelf.ids.filter(id => ok.has(id)); }   // (on sale now: a card that came into the hand, or was found, has left the shelf)
// the shelf's odds: each rarity's weight is the first on-sale pack's that deals it (Pack 1's 60 / 30 / 10 today; a Series 2 rarity Pack 1 has not, its own, when it is on sale)
function equipShelfWeights() { const w = {}; for (const p of equipPacksOnSale()) for (const r of Object.keys(p.rarities)) if (!(r in w) && p.rarities[r] > 0) w[r] = p.rarities[r]; return w; }
// a new shelf: up to EQUIP_MARKET.shelf different cards from the pool, with the packs' own odds. Each place on the shelf rolls a rarity by equipShelfWeights (60 / 30 / 10 for Pack 1; a rarity with no card left is left out of the roll, as in a
// pack), then takes one of that rarity's cards at random. Unlike a pack it keeps no place for a Precision card. A seed makes it the same twice (the tests).
function equipShelfDeal(seed) {
    const rnd = Number.isFinite(seed) ? equipRng(seed) : Math.random, left = {}, ids = [], W = equipShelfWeights();
    for (const c of equipShelfPool()) (left[c.rarity] = left[c.rarity] || []).push(c);
    while (ids.length < EQUIP_MARKET.shelf) {
        const rs = Object.keys(left).filter(r => left[r].length && W[r] > 0), total = rs.reduce((n, r) => n + W[r], 0); if (!rs.length) break;
        let x = rnd() * total, pick = rs[rs.length - 1]; for (const r of rs) { if (x < W[r]) { pick = r; break; } x -= W[r]; }
        const l = left[pick]; ids.push(l.splice(Math.min(l.length - 1, Math.floor(rnd() * l.length)), 1)[0].id);
    }
    equipShelf = { ids, until: _equipNow() + EQUIP_MARKET.every }; return ids.slice();
}
function equipShelfTick() { equipShelfSync(); if (_equipNow() >= equipShelf.until) equipShelfDeal(); }
// why a shelf card cannot be bought now (with "credits" or with "shards"), or null when it can
function equipMarketWhyNot(id, pay) {
    const c = equipCard(id); if (!c) return "NO SUCH CARD";
    if (equipShelfIds().indexOf(id) < 0) return "NOT ON THE SHELF";
    const v = equipMarketValue(c);
    if (pay === "credits") return equipCredits < v ? "NEED ◇" + equipCreditsText(v - equipCredits) + " MORE" : null;
    if (pay === "shards") { const have = typeof shardCount === "number" ? shardCount : 0; return have < v ? "NEED ◆" + (v - have) + " MORE" : null; }
    return "PAY WITH CREDITS OR SHARDS";
}
function equipMarketBuy(id, pay) {
    if (equipMarketWhyNot(id, pay)) return false;
    const c = equipCard(id), v = equipMarketValue(c);
    if (pay === "credits") equipCredits -= v; else shardCount -= v;
    const fresh = !equipOwns(id); if (fresh) { equipOwnedSet().add(id); equipWriteOwned(); }   // new to you: kept for good
    if (!equipIsFound(id)) equipFound.push(id);                                                 // and found: worn at once
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: (fresh ? "BOUGHT, KEPT FOR GOOD · " : "BOUGHT · ") + c.name, color: "#ffe733", life: 140, vy: -0.25, size: 14 });
    return true;
}
