// ─────────────────────────────────────────────────────────
//  EQUIP CARDS — two slots on every follower, and the subclass tag (the Notion "Conduit Game Design Archive"; docs/CARD-SYSTEM.md on the design-notes branch)
// ─────────────────────────────────────────────────────────
// ASKED: "Make way for a robust card system that will be used to give followers [...] a equip card and actually have a slot for another equip card. So two equip cards per follower. And these equip cards are going to be used to buff
// followers and give them new abilities. I'm planning out the specifics, but there also needs to be a new sub archetype for each of the followers, one of four. Being a drone, a mollusk, a crustacean, or an elemental. And these
// basically are nothing but a tag for later classification when it comes to giving buffs to creatures. So just make it to where there's not going to be any conflict, and this new system can rest peacefully within our infrastructure."
// (FIVE subclasses: the user's own roster chart, in the Archive, has a fifth, JELLY, beside the four.) "Card" is also the interface's word for a roster card or a panel (cc-card, the squad bar's slots): these are EQUIP CARDS, and every
// name here starts with equip / EQUIP so that it cannot be mistaken for those or for the other two things "class" means (the player's CLASSES, js/classes.js; a creature's class, js/species.js; a follower's role is what the cards call its class).
//
// WHAT IS BUILT is the plumbing and the real cards: the six CRYSTALLINE class cards (each a flat +50% to one stat of a follower's class), PACK 1's eighteen ELEMENT cards, SERIES 2's species cards and THE CLASS CARD FAMILIES (below: the Mage
// auras, the Brawler opportunity cards and the Technician's cooldown cards; Build B, 2026-11-02c). The INERT TEST CARDS behind ?cards are how the rules, the saving and the screens are played with. A card added to EQUIP_CARDS appears in every
// screen. With no card the screens are there and empty (equipAny): the CARDS sheet says so, and the roster's slots say NO CARDS IN YOUR HAND; the choice at the start of a run opens only when the collection holds a card.
//   EFFECTS   a real card has `bonus` ({ stat: fraction }, a key of EQUIP_STATS) or `proc` (an effect on a hit). A follower's bonus to a stat is the SUM over what it wears (equipBonus: two +50% make +100% of the base, never +125%). It is applied
//             where the follower's numbers are made from its base (js/levels.js _applyFollowerLevel: attack, SP.ATK, defense, maximum health; js/combat.js followerRest: the rest between attacks; js/helpers.js applyDamage: the damage it deals),
//             so it is never saved, never added twice, and comes off with the card (equipRefresh). A proc (equipOnHit, from applyDamage) rolls once for each hit a follower lands and sets a status on the target (js/combat.js) that is refreshed, never stacked.
//   SUBCLASS  a tag on each evolved form (EQUIP_FORM_SUBCLASS, the user's roster chart): crustacean, mollusk, elemental, drone or jelly. An egg has none until it evolves, nor do the ten retired forms. It decides nothing yet: it is for the cards to classify by.
//   SLOTS     every follower has two (f.cards = [id | null, id | null]); the player has two, for PLAYER cards (equipPlayer). A unit cannot wear the same card twice; any number of units can wear the same card, because a card is a TYPE you own, never used up.
//   FITS      a card is one kind: ELEMENT (a follower of that element), CLASS (a follower of that role: brawler, mage or technician; a Mage's AURA names an element too, and is worn by a Mage of that element), SUBCLASS (a follower of that
//             subclass) or PLAYER (the player's slots, and nothing else: a ROLE for one of the player's classes, awake while you are that class, asleep in its slot while you are another; EQUIP_PLAYER_CARDS, js/playercards.js).
//             The UNIVERSAL kind (any follower, and the player) is retired (the owner, 2026-11-02; docs/UNIVERSAL-AND-PLAYER-CARDS.md).
//   OWNED     the permanent COLLECTION: a card is unlocked for good for EQUIP.unlockCost shards (flat, paid from the run's), kept at EQUIP.key, which NEW GAME does not touch and the run's save does not hold.
//   THE HAND  the card types taken into a run, up to EQUIP.startPick, chosen from the collection when it begins (js/cardsui.js). A card put back out of the hand comes off everyone, unless it was found as well.
//   PACK 1    ◆EQUIP_PACK.price buys a BOOSTER PACK: 4 Element cards, one reserved for a Precision, the others rolled over Unrefined, Refined and Precision by weight; none twice in a pack. What a pack deals is FOUND (equipFound): a card
//             to wear at once, for this run only (NEW GAME clears it) unless EQUIP.unlockCost shards keep it for good. Only the hand and what is found can be worn.
//   SERIES 2  a second pack (EQUIP_PACK2, in EQUIP_PACKS with Pack 1), which is the archive's BOOSTER PACK 2 (the roll, the sale, the shelf and the sheet take any pack of the list). It deals 63 cards: the 20 SPECIES cards (the subclass
//             kind) and the Technician's 4 cooldown cards (EQUIP_SERIES2), the 18 Mage AURAS and the 3 Brawler OPPORTUNITY cards (EQUIP_AURAS, EQUIP_OPPORTUNITY), all four since Build B, and the 18 PLAYER cards at Prototype since the
//             following update's Part 1d (EQUIP_PLAYER_CARDS). Its eight Brawler and Mage class cards were cut (EQUIP_CUT): a copy unlocked for good is refunded (equipRefundTick). A technician's ABILITY COOLDOWN is a stat a card
//             can name (EQUIP_STATS.cooldown). Side Quest sells each quest line's three Player cards after its quest, kept for good (js/sidequest.js, through equipGrant).
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

// THE CARDS. { id, name, kind, match, rarity, text, bonus? }: kind is "element" (match: an element id), "class" (match: a follower's role: brawler, sniper = MAGE, camper = TECHNICIAN), "subclass" (match: a subclass id) or "player" (no match;
// the player's slots). The "universal" kind is retired (Build B).
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
// a status in words, from its numbers: what follows "15% PER HIT TO " on a Pack 1 card (and "EVERY HIT TO " on a Player card); "" for a kind it does not know
function _equipStatusText(p) {
    if (!p) return "";
    if (p.kind === "burn") return "BURN: " + p.dps + " DAMAGE A SECOND FOR " + _equipSec(p.seconds);
    if (p.kind === "poison") return "POISON: IT HITS " + _equipPct(p.cut) + " WEAKER FOR " + _equipSec(p.seconds);
    if (p.kind === "glitch") return "GLITCH: ITS WIND-UPS FAIL FOR " + _equipSec(p.seconds);
    if (p.kind === "slow") return "SLOW BY " + _equipPct(p.cut) + " FOR " + _equipSec(p.seconds);
    if (p.kind === "siphon") return "HEAL " + _equipPct(p.share) + " OF THE DAMAGE DEALT";
    if (p.kind === "knockback") return "KNOCK THE TARGET BACK";
    return "";
}
// what a card says, made from its numbers (so that tuning a number tunes the words)
function equipEffectText(fx) {
    if (fx && fx.bonus) return Object.keys(fx.bonus).map(k => (k === "cooldown" ? "−" : "+") + _equipPct(fx.bonus[k]) + " " + (_EQUIP_STAT_WORDS[k] || String(k).toUpperCase())).join(" · ");   // (a cooldown bonus is a share taken OFF; a card of two stats names both)
    if (fx && fx.ability) return equipAbilityText(fx.ability);
    if (fx && fx.attack) return equipAttackText(fx.attack);
    if (fx && fx.aura) {   // a Mage's aura: its ATK, its reach, and at Prototype its element's status (named by the Pack 1 card whose numbers it uses)
        const a = fx.aura, tpl = EQUIP_CARDS[_EQUIP_ATTUNED[a.el]], st = tpl && tpl.proc ? _EQUIP_STATUS_WORDS[tpl.proc.kind] : "";
        return "AURA: +" + _equipPct(a.attack) + " ATTACK TO EVERY FOLLOWER WITHIN " + EQUIP_AURA.reach + " TILES IN ITS ROOM, AND THE CLONE" + (a.status > 0 && st ? " · EACH OF THEIR HITS: " + _equipPct(a.status) + " TO " + st : "");
    }
    if (fx && fx.opportunity) return "OPPORTUNITY: +" + _equipPct(fx.opportunity) + " ON A HIT FOR EACH WEAKNESS IT EXPLOITS: AN ELEMENT MATCH-UP, A RACE WEAK TO ITS TYPE, A RACE WEAK TO ELEMENTAL, A STUNNED OR SLEEPING TARGET";
    const p = fx && fx.proc; if (!p) return "";
    if (p.kind === "attuned") return _equipPct(p.chance) + " PER HIT: ITS OWN ELEMENT'S STATUS (BURN, POISON, GLITCH, SLOW, SIPHON OR KNOCKBACK)";
    const st = _equipStatusText(p);
    return st ? _equipPct(p.chance) + " PER HIT TO " + st : "";
}
EQUIP_PACK1.forEach(([id, name, element, rarity, fx]) => { EQUIP_CARDS[id] = Object.assign({ id, name, kind: "element", match: element, rarity, text: equipEffectText(fx), pack: "pack1" }, fx); });
// EACH ELEMENT'S OWN STATUS: the one Pack 1's Precision card of that element sets, with its numbers (fire burns, toxic poisons, electric glitches, ice slows, flux siphons, core knocks back). ATTUNED CORE (Series 2) and the Prototype Mage auras set it.
const _EQUIP_ATTUNED = { fire: "cinderbrand", toxic: "mireblight", electric: "static_lock", ice: "rime_snare", flux: "siphon_field", core: "repulsor_pulse" };
const _EQUIP_STATUS_WORDS = { burn: "BURN", poison: "POISON", glitch: "GLITCH", slow: "SLOW", siphon: "SIPHON", knockback: "KNOCK BACK" };
// SERIES 2 (ASKED, the "Series 2" brief, 2026-10-31): two categories of card, SPECIES CARDS (the game's `subclass` kind: Jelly, Mollusk, Elemental, Crustacean or Drone, a tag every evolved form has: EQUIP_FORM_SUBCLASS) and CLASS CARDS
// (the `class` kind: Brawler, Mage or Technician), no hybrid identities, over the six rarities. THE LIST IS NOT HERE YET: the archive that holds it could not be read this session (docs/OPEN-QUESTIONS.md), and no card is invented in its
// place. A Series 2 card is a row of this table, in the shape of Pack 1's rows with its kind and its match: [id, name, kind ("subclass" | "class"), match (a subclass id | brawler | sniper | camper), rarity, fx]; a row added here is dealt by
// the Series 2 pack (EQUIP_PACK2, below), worn by what it fits (equipFit: a species card by a follower of that subclass, a class card by one of that role), summed with the others (equipBonus), saved and loaded with nothing else to change.
// THE LIST (the owner, 2026-11-01: the draft docs/SERIES-2.md; "Prototype unlocks": Series 2 deals Unrefined to PROTOTYPE, the rarity it unlocks beyond Pack 1's Precision; Lustrous comes in a later update). The five species
// and the Technician, four cards each: UNREFINED +8% to one stat, REFINED +14%, PRECISION a Pack 1 status on a hit or two stats at +10%, PROTOTYPE an ABILITY (`ability`, below: equipAbilityText says what each does, and the hooks
// that make it happen are under "THE SERIES 2 ABILITIES"). Every number is here and PROPOSED (docs/SERIES-2.md), so tuning stays one edit. The Brawler's and the Mage's four were CUT in Build B (EQUIP_CUT, below): the class
// families took their place.
const EQUIP_SERIES2 = [
    ["chitin_scale",      "CHITIN SCALE",      "subclass", "crustacean", "unrefined", { bonus: { defense: 0.08 } }],
    ["barnacle_bracer",   "BARNACLE BRACER",   "subclass", "crustacean", "refined",   { bonus: { maxHealth: 0.14 } }],
    ["pincer_clamp",      "PINCER CLAMP",      "subclass", "crustacean", "precision", { proc: { kind: "slow", chance: 0.15, cut: 0.30, seconds: 2 } }],
    ["tide_shell",        "TIDE SHELL",        "subclass", "crustacean", "prototype", { ability: { kind: "shellBlock", every: 8 } }],
    ["mantle_gel",        "MANTLE GEL",        "subclass", "mollusk",    "unrefined", { bonus: { maxHealth: 0.08 } }],
    ["nacre_pearl",       "NACRE PEARL",       "subclass", "mollusk",    "refined",   { bonus: { defense: 0.14 } }],
    ["siphon_slime",      "SIPHON SLIME",      "subclass", "mollusk",    "precision", { proc: { kind: "siphon", chance: 0.15, share: 0.12 } }],
    ["regrowth_sac",      "REGROWTH SAC",      "subclass", "mollusk",    "prototype", { ability: { kind: "regrowth", perSecond: 0.005 } }],
    ["raw_shard",         "RAW SHARD",         "subclass", "elemental",  "unrefined", { bonus: { specialAttack: 0.08 } }],
    ["focusing_prism",    "FOCUSING PRISM",    "subclass", "elemental",  "refined",   { bonus: { specialAttack: 0.14 } }],
    ["attuned_core",      "ATTUNED CORE",      "subclass", "elemental",  "precision", { proc: { kind: "attuned", chance: 0.12 } }],
    ["storm_heart",       "STORM HEART",       "subclass", "elemental",  "prototype", { ability: { kind: "nova", every: 6, radius: 1.5, share: 0.6 } }],
    ["servo_oil",         "SERVO OIL",         "subclass", "drone",      "unrefined", { bonus: { attackSpeed: 0.08 } }],
    ["gyro_stabilizer",   "GYRO STABILIZER",   "subclass", "drone",      "refined",   { bonus: { attackSpeed: 0.14 } }],
    ["hunter_optics",     "HUNTER OPTICS",     "subclass", "drone",      "precision", { bonus: { damage: 0.10, attackSpeed: 0.10 } }],
    ["overclock_chip",    "OVERCLOCK CHIP",    "subclass", "drone",      "prototype", { ability: { kind: "overclock", every: 12, lasts: 3, attackSpeed: 0.5 } }],
    ["gel_membrane",      "GEL MEMBRANE",      "subclass", "jelly",      "unrefined", { bonus: { maxHealth: 0.08 } }],
    ["stinger_tendril",   "STINGER TENDRIL",   "subclass", "jelly",      "refined",   { bonus: { attack: 0.14 } }],
    ["nematocyst",        "NEMATOCYST",        "subclass", "jelly",      "precision", { proc: { kind: "poison", chance: 0.18, cut: 0.30, seconds: 3 } }],
    ["amorphous_body",    "AMORPHOUS BODY",    "subclass", "jelly",      "prototype", { ability: { kind: "absorb", after: 5, cut: 0.4 } }],
    // THE TECHNICIAN'S FAMILY: cooldown management (docs/UNIVERSAL-AND-PLAYER-CARDS.md: the owner, 2026-11-02, "Series 2's four Technician cards", unchanged)
    ["spare_parts_kit",   "SPARE PARTS KIT",   "class",    "camper",     "unrefined", { bonus: { cooldown: 0.08 } }],
    ["capacitor_bank",    "CAPACITOR BANK",    "class",    "camper",     "refined",   { bonus: { cooldown: 0.14 } }],
    ["field_multitool",   "FIELD MULTITOOL",   "class",    "camper",     "precision", { bonus: { cooldown: 0.10, maxHealth: 0.10 } }],
    ["double_cell",       "DOUBLE CELL",       "class",    "camper",     "prototype", { ability: { kind: "doubleCharge" } }],
    // THE CARD ATTACKS (the owner, 2026-11-06: "Series 2, Prototype", "Only its own form"; docs/NEXT-PHASE-ROADMAP.md §12.5): a FORM card, worn only in a follower's SPECIAL ATTACK slot (its own menu,
    // equipSpecialPut), never in CARD 1 or 2. Set, it is the follower's new primary attack ("It stays the new primary attack"): it strikes when its wait is over and does nothing between (js/combat.js
    // cardAttackTry). `el` is its element (its colour and texture); the numbers are in seconds and tiles.
    ["crystal_spike_trio", "CRYSTAL SPIKE TRIO", "form",   "rotshard",   "prototype", { el: "toxic", attack: { kind: "spikeTrio", reach: 6, mult: 1.5, stun: 0.5, poison: 3, wait: 8 } }],      // "Light"
    ["seared_charge",      "SEARED CHARGE",      "form",   "quillstone", "prototype", { el: "fire",  attack: { kind: "searedCharge", reach: 3, mult: 1.5, knock: 2, wait: 8 } }],                // "Short and hard"
    ["voltage_field",      "VOLTAGE FIELD",      "form",   "staticorb",  "prototype", { el: "electric", attack: { kind: "voltageField", reach: 2, radius: 2, lasts: 5, move: 0.3, atkSpeed: 0.2, mult: 0.1, every: 0.5, wait: 14 } }],   // "Speed and attack speed"
    ["wraithfire",         "WRAITHFIRE",         "form",   "embercowl",  "prototype", { el: "fire", attack: { kind: "wraithfire", reach: 6, give: 0.25, per: 10, lasts: 4, speed: 0.12, touch: 0.15, touchEvery: 1, blast: 2, wait: 15 } }],   // "Haunt"
];
// what a card attack does, in the card's words, made from its numbers
function equipAttackText(a) {
    if (!a) return "";
    const sec = n => (Math.round(n * 10) / 10) + (n === 1 ? " SECOND" : " SECONDS"), tiles = n => n + (n === 1 ? " TILE" : " TILES"), tail = (a.lasts ? " · THEN " + sec(a.wait) + " TO WAIT" : " · READY AGAIN EVERY " + sec(a.wait)) + " · ITS PRIMARY ATTACK WHILE SET";
    if (a.kind === "spikeTrio") return "THREE TOXIC CRYSTAL SPIKES ERUPT UNDER ONE ENEMY WITHIN " + tiles(a.reach) + ": " + a.mult + "× ITS ATTACK, STUNNED " + sec(a.stun) + ", POISONED " + sec(a.poison) + tail;
    if (a.kind === "voltageField") return "AN ELECTRIC FIELD " + tiles(a.radius) + " ROUND IT FOR " + sec(a.lasts) + ": FOLLOWERS IN IT MOVE +" + Math.round(a.move * 100) + "% FASTER AND ATTACK +" + Math.round(a.atkSpeed * 100) + "% FASTER; ENEMIES IN IT TAKE " + a.mult + "× ITS ATTACK EVERY " + sec(a.every) + tail;
    if (a.kind === "wraithfire") return "IT GIVES " + Math.round(a.give * 100) + "% OF ITS HP AND BECOMES A GHOST FOR " + sec(a.lasts) + ": ITS POWER IS THE HP GIVEN × ITS ATTACK ÷ " + a.per + "; EACH ENEMY IT TOUCHES (AT MOST ONCE A SECOND) TAKES " + Math.round(a.touch * 100) + "% OF IT (FIRE); THE REST EXPLODES " + tiles(a.blast) + " ROUND AT THE END, AND IT IS BACK WHERE IT BEGAN" + tail;
    if (a.kind === "searedCharge") return "A FIERY SHOULDER-CHECK INTO AN ENEMY WITHIN " + tiles(a.reach) + ": " + a.mult + "× ITS ATTACK (HALF CRUSHING, HALF FIRE), KNOCKED BACK " + tiles(a.knock) + tail;
    return "";
}
// what an ability does, in the card's words, made from its numbers
function equipAbilityText(a) {
    if (!a) return "";
    const sec = n => (Math.round(n * 10) / 10) + (n === 1 ? " SECOND" : " SECONDS"), tiles = n => n + (n === 1 ? " TILE" : " TILES");
    if (a.kind === "shellBlock") return "SHELL BLOCK: THE NEXT HIT IT TAKES IS BLOCKED; READY AGAIN " + sec(a.every) + " AFTER A BLOCK";
    if (a.kind === "regrowth") return "REGROWTH: REGAINS " + _equipPct(a.perSecond) + " OF ITS MAXIMUM HP EVERY SECOND";
    if (a.kind === "nova") return "NOVA: EVERY " + a.every + "TH HIT BURSTS ON EVERY ENEMY WITHIN " + tiles(a.radius) + " OF ITS TARGET FOR " + _equipPct(a.share) + " OF ITS SPECIAL ATTACK";
    if (a.kind === "overclock") return "OVERCLOCK: EVERY " + sec(a.every) + ", +" + _equipPct(a.attackSpeed) + " ATTACK SPEED FOR " + sec(a.lasts);
    if (a.kind === "absorb") return "ABSORB: AFTER " + sec(a.after) + " WITHOUT BEING HIT, THE NEXT HIT DOES " + _equipPct(a.cut) + " LESS";
    if (a.kind === "cleave") return "CLEAVE: ITS HITS ALSO STRIKE EVERY OTHER ENEMY WITHIN " + tiles(a.radius) + " FOR " + _equipPct(a.share);
    if (a.kind === "chain") return "CHAIN: EACH HIT JUMPS TO ONE MORE ENEMY WITHIN " + tiles(a.radius) + " FOR " + _equipPct(a.share);
    if (a.kind === "doubleCharge") return "DOUBLE CHARGE: ITS ABILITY HOLDS TWO CHARGES";
    return "";
}
EQUIP_SERIES2.forEach(([id, name, kind, match, rarity, fx]) => { EQUIP_CARDS[id] = Object.assign({ id, name, kind, match, rarity, text: equipEffectText(fx), pack: "series2" }, fx); });
// THE CLASS CARD FAMILIES (Build B, 2026-11-02c; docs/UNIVERSAL-AND-PLAYER-CARDS.md section 2, the owner, 2026-11-02: "mages get aura cards, and the brawlers get opportunity bonuses ... and then technicians get cool down management").
// Each is a CLASS card, dealt by Series 2. The names are the owner's approval of the agent's draft ("Approve all 21"). Every number is in these two tables.
//   MAGE AURAS   six elements × Refined, Precision, Prototype. A Mage of the aura's element wears it (equipFit); every follower within EQUIP_AURA.reach tiles of it AND IN ITS ROOM (the owner, 2026-11-02: "It shouldn't be displayed
//                or affected in other rooms"), the Mage included, and the Mutator's clone, gets `aura.attack` more ATK (equipBonus; the clone's hits: js/helpers.js applyDamage). At Prototype, each hit of one of them has
//                `aura.status` chance (10%: the owner raised the first guess of 5%, 2026-11-02) to set the element's own status (_EQUIP_ATTUNED, with its Pack 1 numbers: equipOnHit). Different auras stack; THE SAME AURA (the same card) counts once, even from two Mages. Who is in reach is worked out on the card tick (_equipAuraTick); the look is equipAuraDraw.
//   OPPORTUNITY  a Brawler's: each OPENING a hit meets adds `opportunity` to the whole hit (js/damage.js dmgApply, through equipOpportunity): an element match-up, a race weak to the hit's physical type, a race weak to Elemental,
//                a stunned or sleeping target. A hit that meets none is unchanged.
const EQUIP_AURA = { reach: 4 };   // tiles from the Mage (the owner, 2026-11-02)
const EQUIP_AURAS = [
    ["kindling_band",    "KINDLING BAND",    "fire",     "refined",   { aura: { attack: 0.05 } }],
    ["hearth_sigil",     "HEARTH SIGIL",     "fire",     "precision", { aura: { attack: 0.075 } }],
    ["inferno_crown",    "INFERNO CROWN",    "fire",     "prototype", { aura: { attack: 0.10, status: 0.10 } }],
    ["spore_band",       "SPORE BAND",       "toxic",    "refined",   { aura: { attack: 0.05 } }],
    ["miasma_sigil",     "MIASMA SIGIL",     "toxic",    "precision", { aura: { attack: 0.075 } }],
    ["pestilence_crown", "PESTILENCE CROWN", "toxic",    "prototype", { aura: { attack: 0.10, status: 0.10 } }],
    ["ionic_band",       "IONIC BAND",       "electric", "refined",   { aura: { attack: 0.05 } }],
    ["voltaic_sigil",    "VOLTAIC SIGIL",    "electric", "precision", { aura: { attack: 0.075 } }],
    ["tempest_crown",    "TEMPEST CROWN",    "electric", "prototype", { aura: { attack: 0.10, status: 0.10 } }],
    ["chill_band",       "CHILL BAND",       "ice",      "refined",   { aura: { attack: 0.05 } }],
    ["glacial_sigil",    "GLACIAL SIGIL",    "ice",      "precision", { aura: { attack: 0.075 } }],
    ["winter_crown",     "WINTER CROWN",     "ice",      "prototype", { aura: { attack: 0.10, status: 0.10 } }],
    ["phase_band",       "PHASE BAND",       "flux",     "refined",   { aura: { attack: 0.05 } }],
    ["warp_sigil",       "WARP SIGIL",       "flux",     "precision", { aura: { attack: 0.075 } }],
    ["eclipse_crown",    "ECLIPSE CROWN",    "flux",     "prototype", { aura: { attack: 0.10, status: 0.10 } }],
    ["lodestone_band",   "LODESTONE BAND",   "core",     "refined",   { aura: { attack: 0.05 } }],
    ["keystone_sigil",   "KEYSTONE SIGIL",   "core",     "precision", { aura: { attack: 0.075 } }],
    ["monolith_crown",   "MONOLITH CROWN",   "core",     "prototype", { aura: { attack: 0.10, status: 0.10 } }],
];
const EQUIP_OPPORTUNITY = [
    ["pressure_spur",    "PRESSURE SPUR",    "refined",   { opportunity: 0.20 }],
    ["faultline_talon",  "FAULTLINE TALON",  "precision", { opportunity: 0.30 }],
    ["rupture_fang",     "RUPTURE FANG",     "prototype", { opportunity: 0.40 }],
];
EQUIP_AURAS.forEach(([id, name, el, rarity, fx]) => { fx.aura.el = el; EQUIP_CARDS[id] = Object.assign({ id, name, kind: "class", match: "sniper", rarity, text: equipEffectText(fx), pack: "series2" }, fx); });
EQUIP_OPPORTUNITY.forEach(([id, name, rarity, fx]) => { EQUIP_CARDS[id] = Object.assign({ id, name, kind: "class", match: "brawler", rarity, text: equipEffectText(fx), pack: "series2" }, fx); });
// THE PLAYER CARDS (the following update's Part 1; docs/UNIVERSAL-AND-PLAYER-CARDS.md section 2, "The 18 kits": drafted, then approved by the owner 2026-11-02, "Approve as drafted"). Each is a ROLE: while it is worn and AWAKE (the player is
// its class: equipPlayerRole, below) it turns that class into an elemental role. A row: [id, name, class (js/classes.js CLASSES: the class it is for, its `match`), element (the role's), kit]. Every one is PROTOTYPE and is
// SERIES 2's (the owner, 2026-11-02: Series 2 deals them at Prototype), so like every Series 2 card it is found before it can be kept for good (equipUnlockWhyNot). Series 2 deals them since all eighteen are in (Part 1d:
// "All 18 together"), and Side Quest sells each quest line's three after its quest, ◆1,000 each, kept for good (js/sidequest.js). What a kit does is js/playercards.js; EVERY NUMBER IS HERE, and the words on each card are
// made from it (equipPlayerKitText). Built: all eighteen (Parts 1a to 1c).
//   (every kit)  its class's hits take the role's ELEMENT, for the element triangle only (docs/COMBAT.md §7.9; the owner: "The role's element"): no SP.ATK, no elemental share
//   status       true: EVERY hit sets the role element's own status with Pack 1's Precision numbers (_EQUIP_ATTUNED, as the Prototype auras use them): fire burns, toxic weakens (the game's POISON), ice slows, core knocks back
//   jump         { radius, share }: each shot jumps on to the nearest other creature within `radius` tiles, for `share` of its damage (the Technomancer arc's jump: js/technomancer.js TECHNO.arc chainRange, chainPct)
//   freeze       { frames, again }: a hit on a creature ALREADY slowed freezes it, a stun of `frames` (the Frost Maw's bite: js/evolution.js MAW_STUN), and not again on that creature for `again` frames (new, approved)
//   slower       the share of the guns' rate of fire taken off (new, approved): their wait between shots is divided by (1 − slower)
//   pull         the push of a knockback, reversed: the creature hit is pulled toward you (js/helpers.js vortexPullImmune: a beetle or a boss is not)
//   sentries     true: the facility's sentries' rounds set the role element's status (the Technomancer places no sentries of its own: the kits' reading, approved)
//   repair       the share of the time your repairs take: a sentry's (js/antraids.js SENTRY.repair) and a relay's (js/classes.js CLASS_RULES.relay.skillFrames)
//   relays       { radius }: every ONLINE relay sets the role element's status on every creature within `radius` tiles of it, on every card tick while it stays (the sleeping potion's area: js/potion.js POTION.radius)
//   lamp         { every }: while your lamp is overcharged (a POWER CELL), every `every` frames (the grid's charge beat: js/technomancer.js TECHNO.charge.gridEvery) every creature in its light, in sight, takes the
//                arc's zap and the role element's status
//   swap         { every }: SWAP on a squad member's card trades places with it, once in `every` frames (the technicians' ability wait: js/techabilities.js TECH_AB)
//   shield       { width, frames }: a POWER CELL also raises a PHOTONIC SHIELD in front of you (the core technician's wall: TECH_AB.shield width and life)
//   bite         true: EVERY BITE of your clone (its bite, and its POUNCE's bite as it lands) sets the role element's status, with Pack 1's numbers
//   pool         true: on every heal beat of your serum's pool (js/serum.js SERUM.splash.every), every creature in the pool gets the role element's status
//   freeRevive   true: a fallen follower comes back at no cost to the Crystal (js/crystalpower.js CRYSTAL_POWER.cost.follower is not drawn)
//   preserve     true: your clone, when it falls, is preserved at once, without an Ice Mage: its body is a specimen capsule, its upgrades kept (js/specimen.js)
//   splice       true: your clone's bites take the element of the last creature it killed, and that element's status, until its next kill; a creature with no element leaves it as it was (it replaces the
//                role's element for the clone)
//   tank         { health, slower }: your clone has `health` more health (two ranks of ARMOR PLATING: js/mutator.js CLONE_UPGRADES.armor) and moves `slower` slower (new, approved)
const EQUIP_PLAYER_CARDS = [
    ["incendiary_gunner", "INCENDIARY GUNNER", "gunslinger", "fire",     { status: true }],
    ["blight_shooter",    "BLIGHT SHOOTER",    "gunslinger", "toxic",    { status: true }],
    ["arc_slinger",       "ARC SLINGER",       "gunslinger", "electric", { jump: { radius: 2.6, share: 0.6 } }],
    ["cryo_marksman",     "CRYO MARKSMAN",     "gunslinger", "ice",      { status: true, freeze: { frames: 75, again: 300 }, slower: 0.2 }],
    ["rift_runner",       "RIFT RUNNER",       "gunslinger", "flux",     { pull: 0.22 }],
    ["breach_gunner",     "BREACH GUNNER",     "gunslinger", "core",     { status: true }],
    // THE TECHNOMANCER'S SIX (the following update's Part 1b): its punch and its arc take the role's element; the rest is the kit
    ["forgemaster",       "FORGEMASTER",       "technomancer", "fire",     { sentries: true, repair: 0.5 }],
    ["smog_engineer",     "SMOG ENGINEER",     "technomancer", "toxic",    { relays: { radius: 3 } }],
    ["arc_warden",        "ARC WARDEN",        "technomancer", "electric", { lamp: { every: 120 } }],
    ["cryo_tech",         "CRYO TECH",         "technomancer", "ice",      { relays: { radius: 3 } }],
    ["gravity_engineer",  "GRAVITY ENGINEER",  "technomancer", "flux",     { swap: { every: 3600 } }],
    ["bulwark_engineer",  "BULWARK ENGINEER",  "technomancer", "core",     { shield: { width: 3, frames: 1200 } }],
    // THE MUTATOR'S SIX (the following update's Part 1c): its lash and its clone's bites take the role's element (SPLICER's clone: its last kill's); the rest is the kit
    ["ash_surgeon",       "ASH SURGEON",       "mutator",      "fire",     { pool: true }],
    ["plague_doctor",     "PLAGUE DOCTOR",     "mutator",      "toxic",    { bite: true, pool: true }],
    ["spark_geneticist",  "SPARK GENETICIST",  "mutator",      "electric", { bite: true }],
    ["cryo_geneticist",   "CRYO GENETICIST",   "mutator",      "ice",      { freeRevive: true, preserve: true }],
    ["splicer",           "SPLICER",           "mutator",      "flux",     { splice: true }],
    ["core_shaper",       "CORE SHAPER",       "mutator",      "core",     { bite: true, tank: { health: 0.5, slower: 0.2 } }],
];
// what a role does, in the card's words, made from its kit's numbers
const _EQUIP_KIT_HITS = { gunslinger: ["YOUR ROUNDS ARE ", "EACH SHOT"], technomancer: ["YOUR PUNCH AND ARC ARE ", "EACH ARC"], mutator: ["YOUR LASH AND YOUR CLONE'S BITES ARE ", "EVERY BITE OF YOUR CLONE"] };   // (whose hits a class's role works on: rule 1)
function equipPlayerKitText(cls, k) {
    const h = _EQUIP_KIT_HITS[cls]; if (!h || !k) return "";
    const sec2 = n => (Math.round(n * 100) / 100) + (n === 1 ? " SECOND" : " SECONDS"), tpl = EQUIP_CARDS[_EQUIP_ATTUNED[k.el]], st = tpl && tpl.proc ? _equipStatusText(tpl.proc) : "", out = [(k.splice ? "YOUR LASH IS " : h[0]) + _equipElementLabel(k.el)];
    if (k.status && st) out.push("EVERY HIT TO " + st);
    if (k.jump) out.push(h[1] + " JUMPS TO ONE MORE ENEMY WITHIN " + k.jump.radius + " TILES FOR " + _equipPct(k.jump.share));
    if (k.freeze) out.push("A HIT ON AN ENEMY ALREADY SLOWED FREEZES IT FOR " + sec2(k.freeze.frames / EQUIP_FPS) + ", ONCE IN " + sec2(k.freeze.again / EQUIP_FPS));
    if (k.pull > 0) out.push("EVERY HIT PULLS THE TARGET TOWARD YOU (NOT A BEETLE OR A BOSS)");
    if (k.slower > 0) out.push("YOUR GUNS FIRE " + _equipPct(k.slower) + " SLOWER");
    if (k.sentries && st) out.push("EVERY SENTRY HIT TO " + st);
    if (k.repair > 0 && k.repair < 1) out.push(k.repair === 0.5 ? "YOUR REPAIRS ARE TWICE AS FAST" : "YOUR REPAIRS TAKE " + _equipPct(k.repair) + " OF THE TIME");
    if (k.relays && st) out.push("ENEMIES WITHIN " + k.relays.radius + " TILES OF AN ONLINE RELAY, WHILE THEY STAY, TO " + st);
    if (k.lamp && st) out.push("WHILE YOUR LAMP IS OVERCHARGED, EVERY " + sec2(k.lamp.every / EQUIP_FPS) + ": YOUR ARC'S ZAP ON EVERY ENEMY IN ITS LIGHT, AND " + st);
    if (k.swap) out.push("SWAP: TRADE PLACES WITH A SQUAD MEMBER FROM ITS CARD, ONCE IN " + sec2(k.swap.every / EQUIP_FPS));
    if (k.shield) out.push("A POWER CELL ALSO RAISES A PHOTONIC SHIELD IN FRONT OF YOU: " + k.shield.width + " TILES WIDE, " + sec2(k.shield.frames / EQUIP_FPS));
    if (k.bite && st) out.push(h[1] + " TO " + st);
    if (k.pool && st) out.push("ENEMIES IN YOUR SERUM'S POOL, ON EVERY HEAL BEAT, TO " + st);
    if (k.freeRevive) out.push("A FALLEN FOLLOWER COMES BACK AT NO COST TO THE CRYSTAL");
    if (k.preserve) out.push("IF YOUR CLONE FALLS, IT IS PRESERVED AT ONCE (NO ICE MAGE), ITS UPGRADES KEPT");
    if (k.splice) out.push("YOUR CLONE'S BITES TAKE THE ELEMENT OF THE LAST ENEMY IT KILLED, AND THAT ELEMENT'S STATUS, UNTIL ITS NEXT KILL");
    if (k.tank) out.push("YOUR CLONE HAS " + _equipPct(k.tank.health) + " MORE HEALTH AND MOVES " + _equipPct(k.tank.slower) + " SLOWER");
    return out.join(" · ");
}
EQUIP_PLAYER_CARDS.forEach(([id, name, cls, el, kit]) => { const k = Object.assign({ el }, kit); EQUIP_CARDS[id] = { id, name, kind: "player", match: cls, rarity: "prototype", pack: "series2", kit: k, text: equipPlayerKitText(cls, k) }; });
// THE CUT CARDS (the owner, 2026-11-02: Series 2 reshaped): its eight Brawler and Mage class cards are no longer cards. The registry does not know them, so every place that reads a saved id already drops them (the hand, the cards
// found, the shelf, the player's slots: equipSaveApply; a follower's slots: equipValid on the tick, and the bonuses skip them before that). The COLLECTION keeps ids it does not know (?cards on and off loses nothing), so it drops these
// by name, and each one it held (unlocked for good) pays back EQUIP.unlockCost shards, once (equipOwnedSet, equipRefundTick). Their abilities' code (Cleave, Chain) is kept, worn by no card.
const EQUIP_CUT = ["knuckle_wraps", "iron_guard", "haymaker_gauntlet", "cleaver_arm", "focus_lens", "channeling_rod", "spellweave_circlet", "chain_conduit"];
const EQUIP_REFUND_CAP = EQUIP_CUT.length * EQUIP.unlockCost;   // the most a refund can be (every cut card owned): a saved number above it is not believed
// The test cards, behind ?cards: one of each kind, a spread of rarities, and none does anything. The two PLAYER ones were the Universal kind's until it was retired (Build B): the only cards the player's slots take until the Player cards come.
const EQUIP_TEST_CARDS = {};
[   ["test_fire", "TEST · FIRE", "element", "fire", "unrefined"], ["test_ice", "TEST · ICE", "element", "ice", "refined"],
    ["test_brawler", "TEST · BRAWLER", "class", "brawler", "precision"], ["test_mage", "TEST · MAGE", "class", "sniper", "prototype"], ["test_technician", "TEST · TECHNICIAN", "class", "camper", "lustrous"],
    ["test_crustacean", "TEST · CRUSTACEAN", "subclass", "crustacean", "unrefined"], ["test_drone", "TEST · DRONE", "subclass", "drone", "crystalline"],
    ["test_player_a", "TEST · PLAYER A", "player", null, "refined"], ["test_player_b", "TEST · PLAYER B", "player", null, "precision"],
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
// what a card is for, in words: "ELEMENT · FIRE", "CLASS · BRAWLER", "CLASS · FIRE MAGE" (a Mage's aura), "SUBCLASS · DRONE", "PLAYER · GUNSLINGER · FIRE" (a Player card's role), "PLAYER" (a test card)
function _equipClassLabel(id) { return typeof className === "function" ? className(id) : String(id || "").toUpperCase(); }   // (the player's classes: js/classes.js)
function equipKindLabel(c) {
    if (!c) return "";
    if (c.kind === "element") return "ELEMENT · " + _equipElementLabel(c.match);
    if (c.kind === "class") return "CLASS · " + (c.aura ? _equipElementLabel(c.aura.el) + " " : "") + _equipRoleLabel(c.match);
    if (c.kind === "subclass") return "SUBCLASS · " + equipSubclassLabel(c.match);
    if (c.kind === "player") return "PLAYER" + (c.match ? " · " + _equipClassLabel(c.match) : "") + (c.kit && c.kit.el ? " · " + _equipElementLabel(c.kit.el) : "");
    if (c.kind === "form") return "SPECIAL ATTACK · " + _equipFormName(c.match);
    return "";
}
function _equipFormName(id) { const e = typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[id] : null; return e ? e.name : String(id || "").toUpperCase(); }

// ── THE COLLECTION: the cards unlocked for good (kept at EQUIP.key as { v: 1, owned: [ids], refund?: shards }) ──
// `refund`: the shards owed for CUT cards the collection held (EQUIP_CUT), kept here until a run's shards take them (equipRefundTick). The cut ids leave the record IN THE SAME WRITE that adds their refund, so a refund is counted
// once however often the page loads, and paid once: the write that pays it sets it to nothing. A refund that is not a positive number is not believed, nor one above EQUIP_REFUND_CAP.
let _equipRefund = 0;
function equipOwnedSet() {
    if (_equipOwned) return _equipOwned;
    let ids = [], owed = 0;
    try {
        const d = JSON.parse(localStorage.getItem(EQUIP.key) || "null");
        if (d && d.v === 1 && Array.isArray(d.owned)) ids = d.owned.filter(x => typeof x === "string");
        if (d && d.v === 1 && Number.isFinite(d.refund) && d.refund > 0) owed = Math.floor(d.refund);
    } catch (e) { /* no storage, or not ours: an empty collection */ }
    const set = new Set(ids);   // (an id the registry does not know stays: ?cards on and then off loses nothing; the cut cards are the exception, by name)
    let cut = 0; for (const id of EQUIP_CUT) if (set.delete(id)) cut++;
    _equipOwned = set; _equipRefund = Math.min(EQUIP_REFUND_CAP, owed + cut * EQUIP.unlockCost);
    if (cut) equipWriteOwned();   // (at once: gone from the record, and their refund kept, in one write)
    return _equipOwned;
}
// the shards owed for cut cards, not yet paid
function equipRefundDue() { equipOwnedSet(); return _equipRefund; }
// THE REFUND IS PAID (the owner, 2026-11-02: "added when the next run starts, at once if one is in progress"): on the first card tick of play, into the run's shards; the collection's record forgets it in the same moment, and the run is
// saved at once so the shards are kept. Not on the website's background, not before the run has begun (the facility saves from then), not after it is over, never with ?cards=all (nothing it does is the player's).
function equipRefundTick() {
    if (equipDev === "all" || !(equipRefundDue() > 0) || typeof shardCount !== "number") return 0;
    if ((typeof attractOn === "function" && attractOn()) || typeof _fp === "undefined" || !_fp || !_fp.saveReady || (typeof gameState !== "undefined" && gameState && gameState.running === false)) return 0;
    const r = _equipRefund, n = Math.round(r / EQUIP.unlockCost);
    shardCount += r; _equipRefund = 0; equipWriteOwned();
    if (typeof facilitySaveWrite === "function") facilitySaveWrite();
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: "◆" + r + " BACK · " + n + (n === 1 ? " SERIES 2 CARD YOU OWNED WAS CUT" : " SERIES 2 CARDS YOU OWNED WERE CUT"), color: "#ffe733", life: 200, vy: -0.2, size: 14 });
    return r;
}
function equipOwns(id) { return !!equipCard(id) && (equipDev === "all" || equipOwnedSet().has(id)); }
function equipOwnedList() { return Object.values(equipCards()).filter(c => equipOwns(c.id)); }
function equipWriteOwned() {
    if (equipDev === "all") return false;   // (everything is owned for the look of it: that is not the player's)
    try { const d = { v: 1, owned: [...equipOwnedSet()] }; if (_equipRefund > 0) d.refund = _equipRefund; localStorage.setItem(EQUIP.key, JSON.stringify(d)); return true; } catch (e) { return false; }
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

// ── THE RUN'S STATE: the hand, the cards found in packs, and the player's two slots (Player cards) ──
let equipHand = [];                // the card types in this run's hand
let equipFound = [];               // the card types found in packs this run: worn at once, and gone with the run unless EQUIP.unlockCost shards unlock one for good
let equipPackLast = null;          // the last pack opened this run, for the sheet to show: { ids, fresh } (not saved)
let equipPlayer = [null, null];    // the player's slots
function equipReset() {            // a fresh game (js/facilityplay.js facilityResetState): the collection stays, the rest begins empty
    equipHand = equipDev === "all" ? Object.keys(equipCards()) : []; equipFound = []; equipPackLast = null; equipPlayer = [null, null]; equipCredits = 0; equipShelf = { ids: [], until: 0 };
    _equipAuraHeld = []; _equipAuraRings = [];   // (the auras: the next tick finds them again)
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
function _equipPlural(w) { return /[^AEIOU]Y$/.test(w) ? w.slice(0, -1) + "IES" : w + "S"; }   // (JELLY: JELLIES; the others take an S)
function equipFit(f, c) {
    if (!c) return "NO SUCH CARD";
    if (c.kind === "element") return equipElementOf(f) === c.match ? null : "FOR " + _equipElementLabel(c.match) + " FOLLOWERS";
    if (c.kind === "class") return equipRoleOf(f) === c.match && (!c.aura || equipElementOf(f) === c.aura.el) ? null : "FOR " + (c.aura ? _equipElementLabel(c.aura.el) + " " : "") + _equipPlural(_equipRoleLabel(c.match));   // (a Mage's aura: a Mage of its element)
    if (c.kind === "subclass") { const s = equipSubclassOf(f); return s === c.match ? null : "FOR " + _equipPlural(equipSubclassLabel(c.match)) + (s ? "" : " · EVOLVE FIRST"); }
    if (c.kind === "player") return "FOR THE PLAYER";
    if (c.kind === "form") return f && f.evolved === c.match ? null : "FOR A " + _equipFormName(c.match) + " ONLY";   // (a card attack: its own form)
    return "NOT A CARD";
}
// why this card cannot go in this slot of this follower, or null when it can: a follower (not a clone), the card in the hand or found, a fit, and not already on its other slot
function equipWhyNot(f, id, slot) {
    const c = equipCard(id);
    if (!c) return "NO SUCH CARD";
    if (!f || f.dead || f.isClone || f.isFollower !== true) return "FOLLOWERS ONLY";
    if (c.attack) return "A SPECIAL ATTACK · ITS OWN MENU";
    if (!equipUsable(id)) return "NOT IN YOUR HAND";
    const fit = equipFit(f, c); if (fit) return fit;
    return equipSlots(f).some((x, i) => i !== slot && x === id) ? "ALREADY ON ITS OTHER SLOT" : null;
}
// ── THE SPECIAL ATTACK SLOT (the owner, 2026-11-06: "You must change it in a separate menu inside of index/roster card system. Including access main hud"): one a follower, f.special (a card id); only a card
// attack (a card with `attack`) goes in it, and only on its own form. Its menus: the roster's SPECIAL ATTACK (js/cardsui.js equipRosterDraw) and the squad card's (js/squadfly.js). Saved as the record's `special`. ──
function equipSpecialWhyNot(f, id) {
    const c = equipCard(id);
    if (!c) return "NO SUCH CARD";
    if (!f || f.dead || f.isClone || f.isFollower !== true) return "FOLLOWERS ONLY";
    if (!c.attack) return "NOT A SPECIAL ATTACK";
    if (!equipUsable(id)) return "NOT IN YOUR HAND";
    return equipFit(f, c);
}
function equipSpecialPut(f, id) {   // (id null empties it); true when it changed
    if (!f) return false;
    if (id == null) { if (!f.special) return false; f.special = undefined; return true; }
    if (f.special === id || equipSpecialWhyNot(f, id)) return false;
    f.special = id; return true;
}
function equipSpecial(f) { const c = f && f.special ? equipCard(f.special) : null; return c && c.attack && !equipFit(f, c) ? c : null; }   // the card attack it fights with, or null
function equipSpecialCards() { return equipUsableCards().filter(c => c.attack); }   // (the card attacks in the hand and found)
function equipSpecialFor(f) { return !!(f && f.evolved && f.isFollower === true && !f.isClone) && Object.values(EQUIP_CARDS).some(c => c.attack && c.kind === "form" && c.match === f.evolved); }   // (a form some card attack is for: only then is its menu shown)
// ── THE CARD ATTACKS IN A FIGHT (a FORM card in the follower's SPECIAL ATTACK slot; the owner, 2026-11-06) ──
// Set, the card attack is the follower's new primary attack ("It stays the new primary attack"). It strikes when its wait (the card's `wait` seconds) is over and an enemy it can see is within
// its reach; between strikes the follower makes no everyday hit ("the followers just chill while they're waiting for the next one": the wait is a timer, filled by nothing it does). Its moves and
// its Ultimate are its own and still fire. Each role's branch in js/npc.js asks cardAttackTry first; followerAttack (js/combat.js) and the Mage's shot make no hit while cardAttackHolds.
function cardAttackHolds(f) { return !!equipSpecial(f); }
function cardAttackReadyIn(f) { const f0 = typeof frame !== "undefined" ? frame : 0; return Math.max(0, (f && f._spReadyAt || 0) - f0); }   // (frames until it can strike again; 0: ready)
function cardAttackTry(f, t) {
    const c = equipSpecial(f); if (!c || !t || t.dead) return false;
    const A = c.attack, f0 = typeof frame !== "undefined" ? frame : 0;
    if (f0 < (f._spReadyAt || 0) || Math.hypot(t.x - f.x, t.y - f.y) > A.reach) return false;
    if (typeof facilitySeesFrom === "function" && !facilitySeesFrom(f.x, f.y, t.x, t.y)) return false;   // (sight: docs/COMBAT.md §8)
    let fired = false;
    if (A.kind === "spikeTrio") fired = _cardSpikeTrio(f, t, A);
    else if (A.kind === "searedCharge") fired = _cardSearedCharge(f, t, A);
    else if (A.kind === "voltageField") fired = _cardVoltageField(f, A);
    else if (A.kind === "wraithfire") fired = _cardWraithfire(f, A);
    if (fired) { f._spReadyAt = f0 + Math.round(((A.lasts || 0) + A.wait) * 60);   // (one that lasts waits from its end)
        f.state = "attack"; f.attackAnim = 0; const dx = t.x - f.x, dy = t.y - f.y, L = Math.hypot(dx, dy); if (L > 0) { f.dirX = dx / L; f.dirY = dy / L; } }
    return fired;
}
// CRYSTAL SPIKE TRIO (the Rotshard's): three small toxic crystal spikes erupt in a tight cluster under the one enemy: `mult` × its attack (toxic), stunned `stun` s, poisoned `poison` s
function _cardSpikeTrio(f, t, A) {
    applyDamage(t, (f.power || 10) * A.mult, f, "toxic", false, false, DMG_HIT_SPECIAL);
    if (!t.dead) { applyStun(t, Math.round(A.stun * 60)); if (typeof applyWeaken === "function") applyWeaken(t, Math.round(A.poison * 60)); }
    if (typeof spawnElementEffect === "function") spawnElementEffect({ type: "spiketrio", x: t.x, y: t.y, life: 36, maxLife: 36, element: "toxic" });
    return true;
}
// SEARED CHARGE (the Quillstone's): a fiery shoulder-check: it charges straight at the enemy (only along floor it could walk: the dash rule, js/evolution.js _evoDashOk), `mult` × its attack, half
// crushing and half fire, and knocks it back `knock` tiles
// VOLTAGE FIELD (the Static Orb's): an electric field `radius` tiles round it that moves with it for `lasts` s: followers in it move `move` and attack `atkSpeed` faster (js/npc.js updateNPC, js/combat.js
// followerRest read the marks the field leaves on them); enemies in it that can be seen from its middle take `mult` × its attack every `every` s (js/elements.js updateElementEffects)
function _cardVoltageField(f, A) {
    if (typeof spawnElementEffect !== "function") return false;
    const n = Math.round(A.lasts * 60);
    spawnElementEffect({ type: "voltagefield", x: f.x, y: f.y, on: f, radius: A.radius, bite: (f.power || 10) * A.mult, every: Math.round(A.every * 60), move: 1 + A.move, atk: 1 + A.atkSpeed, life: n, maxLife: n, element: "electric" });
    return true;
}
// WRAITHFIRE (the Ember Hood's): it gives `give` of its HP and is a ghost for `lasts` s (it cannot be targeted or hurt); its power is the HP given × its attack ÷ `per`. The ghost rushes on its own through the
// enemies it can see (wraithfireTick, from js/npc.js updateNPC); each it touches, at most once every `touchEvery` s, takes `touch` of the power (fire), until the power is spent; at the end the rest explodes
// `blast` tiles round it, and it is back where it began.
function _cardWraithfire(f, A) {
    const give = (f.health || 0) * A.give; if (!(give > 0)) return false;
    f.health -= give;
    const P = give * (f.power || 10) / A.per, n = Math.round(A.lasts * 60), f0 = typeof frame !== "undefined" ? frame : 0;
    f._wraith = { power: P, left: P, until: f0 + n, x0: f.x, y0: f.y, touched: new Map(), A }; f.untargetable = true; f._fpPath = null;
    if (typeof spawnElementEffect === "function") spawnElementEffect({ type: "wraithfire", x: f.x, y: f.y, on: f, life: n, maxLife: n, element: "fire" });
    return true;
}
function wraithfireTick(f) {
    const W = f._wraith, A = W.A, f0 = typeof frame !== "undefined" ? frame : 0;
    const done = () => { f._wraith = null; f.untargetable = false; f._fpPath = null; };
    if (f.dead) return done();
    if (f0 >= W.until || W.left <= 1e-6) {   // the end: the rest explodes, and it is back where it began
        if (W.left > 0 && typeof _evoFoesSeen === "function") for (const a of _evoFoesSeen(f.x, f.y, A.blast)) applyDamage(a, W.left, f, "fire", false, false, DMG_HIT_SPECIAL);
        if (typeof spawnElementEffect === "function") { spawnElementEffect({ type: "ring", x: f.x, y: f.y, radius: A.blast, color: "#ff8a3a", life: 30, element: "fire" }); spawnElementEffect({ type: "impact", x: f.x, y: f.y, color: "#ffb04a", radius: 1.4, life: 22, element: "fire" }); }
        W.left = 0; f.x = W.x0; f.y = W.y0; return done();
    }
    const foes = typeof _evoFoesSeen === "function" ? _evoFoesSeen(f.x, f.y, A.reach) : [], gap = Math.round(A.touchEvery * 60);
    for (const a of foes) if (Math.hypot(a.x - f.x, a.y - f.y) <= 0.6 && !(f0 - (W.touched.get(a) ?? -1e9) < gap)) {
        const d = Math.min(W.left, W.power * A.touch); if (!(d > 0)) break;
        W.left -= d; W.touched.set(a, f0); applyDamage(a, d, f, "fire", false, false, DMG_HIT_SPECIAL);
    }
    let t = null, best = 1e9;   // on to the nearest it has not touched within the gap (else the nearest)
    for (const a of foes) { const d = Math.hypot(a.x - f.x, a.y - f.y) + (f0 - (W.touched.get(a) ?? -1e9) < gap ? 50 : 0); if (d < best) { best = d; t = a; } }
    if (!t) return;
    const dx = t.x - f.x, dy = t.y - f.y, L = Math.hypot(dx, dy) || 1, nx = f.x + dx / L * A.speed, ny = f.y + dy / L * A.speed;
    if (typeof facilityStandOk !== "function" || facilityStandOk(nx, ny)) { f.x = nx; f.y = ny; }
    f.dirX = dx / L; f.dirY = dy / L;
}
function _cardSearedCharge(f, t, A) {
    if (typeof _evoDashOk === "function" && !_evoDashOk(f, t)) return false;
    const dx = t.x - f.x, dy = t.y - f.y, L = Math.hypot(dx, dy) || 1, s = Math.max(0, L - 0.8), x0 = f.x, y0 = f.y;
    f.x += dx / L * s; f.y += dy / L * s; f._fpPath = null;
    const p = (f.power || 10) * A.mult / 2;
    applyDamage(t, p, f, null, false, false, typeof DMG_HIT_ULT_CRUSH !== "undefined" ? DMG_HIT_ULT_CRUSH : DMG_HIT_SPECIAL); if (!t.dead) applyDamage(t, p, f, "fire", false, false, DMG_HIT_SPECIAL);
    if (!t.dead && typeof applyKnockback === "function") applyKnockback(t, f, A.knock * (typeof KNOCK_PER_TILE !== "undefined" ? KNOCK_PER_TILE : 0.28));
    if (typeof spawnElementEffect === "function") spawnElementEffect({ type: "searedcharge", x: f.x, y: f.y, x0, y0, life: 24, maxLife: 24, element: "fire" });
    return true;
}
// put a card in a slot (id null empties it); true when it changed
function equipPut(f, slot, id) {
    if ((slot !== 0 && slot !== 1) || !f) return false;
    const c = equipSlots(f);
    if (id == null) { if (!c[slot]) return false; c[slot] = null; f.cards = c[0] || c[1] ? c : undefined; equipRefresh(f); return true; }
    if (equipWhyNot(f, id, slot) || c[slot] === id) return false;
    c[slot] = id; f.cards = c; equipRefresh(f); return true;
}
function equipClear(f) { if (f && (f.cards || f.special)) { f.cards = undefined; f.special = undefined; equipRefresh(f); return true; } return false; }   // (EXILE, a re-roll; its special attack too)
// takes off what no longer fits (a role switched, a card out of the hand and not found, a card the registry no longer has); how many came off
function equipValid(f) {
    if (f && f.special) { const sc = equipCard(f.special); if (!sc || !sc.attack || !equipUsable(f.special) || equipFit(f, sc)) f.special = undefined; }   // (its special attack: the same rules)
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
    if (!f) return 0;
    let sum = 0;
    const au = f._aura; if (stat === "attack" && au && au.attack > 0) sum += au.attack;   // (THE MAGE AURAS it stands in, worn or not: their ATK, below)
    const c = f.cards; if (!Array.isArray(c)) return sum;
    for (let i = 0; i < EQUIP.followerSlots; i++) {
        const id = c[i]; if (!id || c.indexOf(id) !== i) continue;
        const card = equipCard(id); if (!card || !card.bonus || equipFit(f, card)) continue;
        const b = card.bonus[stat]; if (typeof b === "number" && isFinite(b)) sum += b;
    }
    if (stat === "attackSpeed" && _equipNow() < (f._ocUntil || 0)) { const oc = equipAbility(f, "overclock"); if (oc) sum += oc.attackSpeed; }   // (OVERCLOCK while it runs: the Series 2 abilities, below)
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
// A unit in reach of a PROTOTYPE MAGE AURA (a follower or the clone, worn cards or none) rolls each such aura once a hit, at its `status` chance, for that element's own status (_EQUIP_ATTUNED: the Pack 1 Precision card's numbers).
function equipOnHit(src, target, dealt) {
    if (_equipEcho || !src || !target || target === src) return;   // (a hit an ability made, below: no card answers it, so one hit never sets off a chain of them)
    const c = src.cards, worn = Array.isArray(c) && src.isFollower === true && !src.isClone;   // (cards are a follower's: the clone only ever comes for an aura)
    if (worn) for (let i = 0; i < EQUIP.followerSlots; i++) {
        const id = c[i]; if (!id || c.indexOf(id) !== i) continue;
        const card = equipCard(id), p = card && card.proc; if (!p || equipFit(src, card)) continue;
        if (Math.random() < p.chance) _equipProc(src, target, p, dealt);
    }
    const au = src._aura;
    if (au && au.extras.length) for (const a of au.extras) if (Math.random() < a.status) { const tpl = EQUIP_CARDS[_EQUIP_ATTUNED[a.el]]; if (tpl && tpl.proc) _equipProc(src, target, tpl.proc, dealt); }
    if (worn) _equipAbilitiesOnHit(src, target, dealt);
}
// OPPORTUNITY (a Brawler's cards): the share each opening adds to a hit, over the opportunity cards it wears that fit it (js/damage.js dmgApply counts the openings); 0 for anyone else
function equipOpportunity(f) {
    const c = f && f.cards; if (!Array.isArray(c)) return 0;
    let sum = 0;
    for (let i = 0; i < EQUIP.followerSlots; i++) { const id = c[i]; if (!id || c.indexOf(id) !== i) continue; const card = equipCard(id); if (card && card.opportunity > 0 && !equipFit(f, card)) sum += card.opportunity; }
    return sum;
}

// ── THE SERIES 2 ABILITIES (the PROTOTYPE cards; docs/SERIES-2.md; the owner, 2026-11-01: "Prototype unlocks") ──
// A card's `ability` ({ kind, ...its numbers }) works only on a follower the card fits (equipFit), as a bonus does. Where each acts:
//   shellBlock    js/helpers.js applyDamage → equipOnHurt: an enemy's hit is blocked whole while the shell is ready; ready again `every` seconds after a block
//   absorb        equipOnHurt: an enemy's hit that comes `after` seconds or more since the last one does `cut` less
//   regrowth      equipTick: `perSecond` of its maximum HP back every second, while it is up and hurt
//   overclock     equipTick starts it every `every` seconds, for `lasts`; while it runs equipBonus adds its `attackSpeed` (js/combat.js followerRest reads the attack speed at each attack)
//   nova, cleave, chain   equipOnHit: a hit it lands strikes others as well, each an ECHO (_equipEcho): an echo sets off no card, so one hit never chains into many
//   doubleCharge  js/techabilities.js techCooldown → equipChargeSpend: a technician's ability holds a second charge; used, the ability is ready again at once, and the charge refills one cooldown later
function equipAbilities(f) {
    const out = [], c = f && f.cards; if (!Array.isArray(c)) return out;
    for (let i = 0; i < EQUIP.followerSlots; i++) { const id = c[i]; if (!id || c.indexOf(id) !== i) continue; const card = equipCard(id); if (card && card.ability && !equipFit(f, card)) out.push(card.ability); }
    return out;
}
function equipAbility(f, kind) { return equipAbilities(f).find(a => a.kind === kind) || null; }
let _equipEcho = false;
function _equipStrike(src, t, dmg, word, col) {
    if (!t || t.dead || !(dmg > 0)) return;
    _equipEcho = true; try { if (typeof applyDamage === "function") applyDamage(t, dmg, src, src.element || null); } finally { _equipEcho = false; }
    if (word) _equipSay(t, word, col);
}
function _equipFoesNear(x, y, r, but) {   // (only what can be seen from the target: an echo strikes at once, and nothing strikes through a wall or a tall object; the owner, 2026-11-06, "Need sight": docs/COMBAT.md §8)
    return (typeof actors !== "undefined" ? actors : []).filter(a => a && a !== but && !a.dead && a.health > 0 && a.team !== "green" && !a.isClone && (typeof isHostileTarget !== "function" || isHostileTarget(a)) && Math.hypot(a.x - x, a.y - y) <= r
        && (typeof facilitySeesFrom !== "function" || facilitySeesFrom(x, y, a.x, a.y)));
}
function _equipAbilitiesOnHit(src, target, dealt) {
    for (const a of equipAbilities(src)) {
        if (a.kind === "nova") {   // every `every`th hit: a burst on every enemy within `radius` of the target (the target too), for `share` of its special attack
            src._novaN = (src._novaN || 0) + 1; if (src._novaN % a.every) continue;
            const sp = (src.stats && src.stats.specialAttack) || src.power || 5;
            for (const e of _equipFoesNear(target.x, target.y, a.radius, null)) _equipStrike(src, e, sp * a.share);
            _equipSay(target, "NOVA", "#ffe733"); if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: target.x, y: target.y, color: "#ffe733", radius: a.radius, life: 30 });
        } else if (a.kind === "cleave") {   // every other enemy within `radius` of the target, for `share` of what the hit took
            const near = _equipFoesNear(target.x, target.y, a.radius, target); if (!near.length) continue;
            for (const e of near) _equipStrike(src, e, dealt * a.share); _equipSay(target, "CLEAVE", "#ff9a4a");
        } else if (a.kind === "chain") {   // the nearest other enemy within `radius` of the target, for `share`
            const near = _equipFoesNear(target.x, target.y, a.radius, target); if (!near.length) continue;
            near.sort((p, q) => Math.hypot(p.x - target.x, p.y - target.y) - Math.hypot(q.x - target.x, q.y - target.y));
            _equipStrike(src, near[0], dealt * a.share, "CHAIN", "#8fe3ff");
        }
    }
}
// a hit about to land on a follower of yours (js/helpers.js applyDamage, after its defense and the cap): Shell block and Absorb. Returns what lands. Only an enemy's hit counts (not a hazard's, not a friend's).
function equipOnHurt(f, dmg, source) {
    if (!f || !(dmg > 0) || !source || source === f || source.team === "green") return dmg;
    const now = _equipNow(), sh = equipAbility(f, "shellBlock");
    if (sh && now >= (f._shellAt || 0)) { f._shellAt = now + Math.round(sh.every * EQUIP_FPS); f._hurtAt = now; _equipSay(f, "BLOCKED", "#8fe3ff"); return 0; }
    const ab = equipAbility(f, "absorb");
    if (ab && now - (Number.isFinite(f._hurtAt) ? f._hurtAt : -1e9) >= ab.after * EQUIP_FPS) { dmg *= 1 - ab.cut; _equipSay(f, "ABSORBED", "#c77dff"); }
    f._hurtAt = now;
    return dmg;
}
// each card tick (equipTick): Regrowth's healing, Overclock's clock, Double charge's spare refilled
function _equipAbilityTick(f) {
    const now = _equipNow(), secs = EQUIP.every / EQUIP_FPS;
    const rg = equipAbility(f, "regrowth");
    if (rg && f.health > 0 && f.health < f.maxHealth) f.health = Math.min(f.maxHealth, f.health + f.maxHealth * rg.perSecond * secs);
    const oc = equipAbility(f, "overclock");
    if (oc) { if (!(f._ocNext > 0)) f._ocNext = now + Math.round(oc.every * EQUIP_FPS); if (now >= f._ocNext) { f._ocUntil = now + Math.round(oc.lasts * EQUIP_FPS); f._ocNext = now + Math.round(oc.every * EQUIP_FPS); _equipSay(f, "OVERCLOCK", "#ffe733"); } }
    else { f._ocNext = 0; f._ocUntil = 0; }
    if (equipAbility(f, "doubleCharge")) { if (f._abSpare !== 1 && now >= (f._abSpareAt || 0)) f._abSpare = 1; } else { f._abSpare = 0; f._abSpareAt = 0; }
}
// a technician has just used its ability (js/techabilities.js techCooldown, `cd` the wait it would have): with DOUBLE CHARGE and the second charge held, the charge is spent instead; true when it was
function equipChargeSpend(f, cd) {
    if (!f || f._abSpare !== 1 || !equipAbility(f, "doubleCharge")) return false;
    f._abSpare = 0; f._abSpareAt = _equipNow() + cd; return true;
}
function _equipSay(t, text, col) { if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: t.x, y: t.y, text, color: col, size: 11, life: 40, vy: -0.03 }); }
// ATTUNED CORE (Series 2): its wearer's own element's status, the one Pack 1's Precision card of that element sets (its numbers: _EQUIP_ATTUNED, above), at the Attuned Core's own chance
function _equipProc(src, t, p, dealt) {
    if (p.kind === "attuned") { const tpl = EQUIP_CARDS[_EQUIP_ATTUNED[equipElementOf(src)]]; if (tpl && tpl.proc) _equipProc(src, t, tpl.proc, dealt); return; }
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

// ── THE PLAYER'S SLOTS: Player cards only (the owner, 2026-11-02: the Universal kind is retired; the player cannot wear auras) ──
// A Player card is a ROLE for one class (its `match`: EQUIP_PLAYER_CARDS, above; the two test cards have none, and fit whatever you are). The rules (approved 2026-11-02, docs/UNIVERSAL-AND-PLAYER-CARDS.md):
//   ITS CLASS      a role goes into a slot only while you are its class ("it needs the matching class"): FOR THE GUNSLINGER
//   ONE AT A TIME  the two slots never hold two roles of one class ("one at a time"), so one role at most is awake: ONE GUNSLINGER ROLE AT A TIME. (Two slots and three classes: a role for each of two classes can be worn, one
//                  awake, the other asleep.)
//   ASLEEP         after a switch of class, a role for the other class stays in its slot, greyed out, and does nothing until you switch back (the owner, 2026-11-02). Asleep is not saved: it is what the class is now
//                  (equipPlayerAwake). So the tick and a load KEEP a role whatever the class (_equipPlayerWhy with `keep`), and only putting one in asks for its class.
function _equipPlayerClass() { return typeof playerClassKey !== "undefined" ? playerClassKey : null; }
// why `id` cannot be in `slot` beside the other slot of `slots`, or null: `keep` asks only what a slot may keep (the tick, a load), not the class you are now
function _equipPlayerWhy(id, slot, slots, keep) {
    const c = equipCard(id);
    if (!c) return "NO SUCH CARD";
    if (!equipUsable(id)) return "NOT IN YOUR HAND";
    if (c.kind !== "player") return "PLAYER CARDS ONLY";
    if (slots.some((x, i) => i !== slot && x === id)) return "ALREADY IN THE OTHER SLOT";
    if (!keep && c.match && c.match !== _equipPlayerClass()) return "FOR THE " + _equipClassLabel(c.match);
    if (c.match && slots.some((x, i) => { const o = i !== slot && x ? equipCard(x) : null; return !!o && o.match === c.match; })) return "ONE " + _equipClassLabel(c.match) + " ROLE AT A TIME";
    return null;
}
function equipPlayerWhyNot(id, slot) { return _equipPlayerWhy(id, slot, equipPlayer, false); }
function equipPlayerPut(slot, id) {
    if (slot !== 0 && slot !== 1) return false;
    if (id == null) { if (!equipPlayer[slot]) return false; equipPlayer[slot] = null; return true; }
    if (equipPlayerWhyNot(id, slot) || equipPlayer[slot] === id) return false;
    equipPlayer[slot] = id; return true;
}
// is the card in a slot awake (a role of the class you are, or a test card), or asleep (a role of another class)?
function equipPlayerAwake(id) { const c = equipCard(id); return !!c && c.kind === "player" && (!c.match || c.match === _equipPlayerClass()); }
// THE ROLE AWAKE NOW: the Player card in your slots for the class you are (one at most), or null. js/playercards.js asks it at each attack. (Not whether it is still in the hand: a card out of the hand is off the slot by the next tick.)
function equipPlayerRole() {
    const k = _equipPlayerClass(); if (!k) return null;
    for (let i = 0; i < EQUIP.playerSlots; i++) { const c = equipCard(equipPlayer[i]); if (c && c.kind === "player" && c.kit && c.match === k) return c; }
    return null;
}
// a hit's element's own status, with Pack 1's Precision numbers (_EQUIP_ATTUNED): what a role's kit sets on every hit (js/playercards.js)
function equipElementStatus(src, t, el, dealt) { const tpl = EQUIP_CARDS[_EQUIP_ATTUNED[el]]; if (tpl && tpl.proc) _equipProc(src, t, tpl.proc, dealt || 0); }
// how many units wear a card right now (the player's slots count)
function equipWearers(id) {
    let n = equipPlayer.filter(x => x === id).length;
    if (typeof followers !== "undefined") for (const f of followers) if (f && !f.dead && ((f.cards && (f.cards[0] === id || f.cards[1] === id)) || f.special === id)) n++;
    return n;
}

// ── THE MAGE AURAS: who stands in which (each card tick) ──
// A SOURCE is a Mage of yours that is up (not falling, not walking back to be re-rolled) wearing aura cards that fit it. A UNIT in reach is any follower of yours that is up, or the Mutator's clone, within EQUIP_AURA.reach tiles of a
// source (the source too) AND IN THE SAME ROOM (js/facility.js facilityRoomAt: a wall stops an aura; two units outside every room count as one space; with no facility, as in a test's bare sandbox, the distance alone). A unit's auras are `_aura` ({ attack: the ATK share, extras: the Prototype auras, cols: their colours } or null) and `_auraSig` (the card ids, sorted): never saved, worked out again a tick after a load or
// a respawn. When a follower's auras change its stats are made again (equipRefresh; equipBonus adds the ATK), so the bonus comes on as it walks in and goes as it walks out, within a tick (half a second). Enemies never get one.
let _equipAuraHeld = [];    // the units in an aura now (so an aura that ends is taken off them without looking at everyone)
let _equipAuraRings = [];   // the sources and their colours, for the drawing: [{ f, cols }]
function equipAurasOf(f) {   // the aura cards a follower gives off: worn, fitting, each once (none for anyone not up and yours)
    const out = [], c = f && f.cards; if (!Array.isArray(c) || f.dead || f.isClone || f.isFollower !== true || f.team !== "green" || f.returningToCrystal || !(f.health > 0)) return out;
    for (let i = 0; i < EQUIP.followerSlots; i++) { const id = c[i]; if (!id || c.indexOf(id) !== i) continue; const card = equipCard(id); if (card && card.aura && !equipFit(f, card)) out.push(card); }
    return out;
}
function _equipAuraColour(el) { const e = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(x => x.id === el) : null; return e ? e.color : "#8fe3ff"; }
// the room a unit stands in (null: outside every room), or undefined where there is no facility (a test's bare sandbox): an aura stays in its Mage's room
function _equipRoomAt(x, y) { return typeof facilityRoomAt === "function" && typeof _fp !== "undefined" && _fp && _fp.F ? facilityRoomAt(x, y, _fp.F) : undefined; }
function _equipRoomOf(u) { return _equipRoomAt(u.x, u.y); }
function _equipAuraTick() {
    const src = [], rings = [];
    if (typeof followers !== "undefined") for (const f of followers) {
        const cards = equipAurasOf(f); if (!cards.length) continue;
        const cols = [], room = _equipRoomOf(f); for (const card of cards) { src.push({ f, card, room }); const col = _equipAuraColour(card.aura.el); if (cols.indexOf(col) < 0) cols.push(col); }
        rings.push({ f, cols });
    }
    _equipAuraRings = rings;
    const held = new Set();
    if (src.length) {
        const R2 = EQUIP_AURA.reach * EQUIP_AURA.reach, units = [];
        for (const f of followers) if (f && !f.dead && f.isFollower === true && !f.isClone && f.team === "green" && !f.returningToCrystal && f.health > 0) units.push(f);
        if (typeof actors !== "undefined") for (const a of actors) if (a && a.isClone && !a.dead && a.team === "green" && a.health > 0) units.push(a);
        for (const u of units) {
            let ids = null; const room = _equipRoomOf(u);
            for (const s of src) { const dx = u.x - s.f.x, dy = u.y - s.f.y; if (dx * dx + dy * dy <= R2 && room === s.room && !(ids && ids.indexOf(s.card.id) >= 0)) (ids || (ids = [])).push(s.card.id); }   // (in reach and in its room; the same aura from two Mages: once)
            if (ids) { _equipAuraSet(u, ids); held.add(u); }
        }
    }
    for (const u of _equipAuraHeld) if (!held.has(u)) _equipAuraSet(u, null);
    _equipAuraHeld = [...held];
}
function _equipAuraSet(u, ids) {
    const sig = ids ? ids.slice().sort().join(",") : "";
    if ((u._auraSig || "") === sig) return false;
    u._auraSig = sig;
    if (!ids) u._aura = null;
    else {
        const au = { attack: 0, extras: [], cols: [] };
        for (const id of ids) { const a = equipCard(id).aura; au.attack += a.attack; if (a.status > 0) au.extras.push(a); const col = _equipAuraColour(a.el); if (au.cols.indexOf(col) < 0) au.cols.push(col); }
        u._aura = au;
    }
    if (u.isFollower === true && !u.isClone) equipRefresh(u);   // (its ATK made again; the clone's is read at each hit: js/helpers.js)
    return true;
}
// THE LOOK (the owner: "some minimal way to show a aura ... It should be really subtle as well and reflect the different elements"; docs/UNIVERSAL-AND-PLAYER-CARDS.md): a faint, thin dashed ring on the ground round each Mage giving off
// an aura, at its reach (EQUIP_AURA.reach tiles: an ellipse, the floor being drawn on the slant), in the element's colour, slowly turning; and a tiny glint of that colour beside each unit in it. Several colours: a ring and a glint
// each. THE RING IS ON THE FLOOR OF THE MAGE'S ROOM ONLY (the owner, 2026-11-02: "It shouldn't be displayed or affected in other rooms", then "It shouldn't show up on the walls either"): equipAuraOnTile draws it tile by tile in the
// floor's own pass (js/game.js, beside the Frost Patch's), each floor tile of the Mage's room that the ring crosses drawing its piece, cut to the tile; the walls, the props and the units, drawn after the floor in front of them, cover
// it. The glints are drawn with the world's overlays (equipAuraDraw), beside their units.
const EQUIP_AURA_LOOK = { alpha: 0.22, width: 1.5, dash: [14, 10], turn: 0.3, glint: 3.5 };
const _EQUIP_AURA_BAND = [EQUIP_AURA.reach - 0.71 - 0.4, EQUIP_AURA.reach + 0.71 + 0.1];   // the tiles the ring can cross: a tile's centre within these tiles of the Mage (a tile reaches 0.71 from its centre; the inner colours sit a little inside)
function equipAuraOnTile(tx, ty, px, py) {
    if (!_equipAuraRings.length || typeof ctx === "undefined" || !ctx) return;
    const L = EQUIP_AURA_LOOK, t = _equipNow(), lo = _EQUIP_AURA_BAND[0] * _EQUIP_AURA_BAND[0], hi = _EQUIP_AURA_BAND[1] * _EQUIP_AURA_BAND[1], R = EQUIP_AURA.reach * Math.SQRT2, rx = R * TILE_W, ry = R * TILE_H;
    let room = null, roomKnown = false;
    for (const r of _equipAuraRings) {
        const f = r.f; if (!f || f.dead) continue;
        const dx = tx - f.x, dy = ty - f.y, d2 = dx * dx + dy * dy; if (d2 < lo || d2 > hi) continue;
        if (r.rf !== t) { r.rf = t; r.room = _equipRoomAt(f.x, f.y); }   // (the Mage's room, once a frame)
        if (!roomKnown) { room = _equipRoomAt(tx, ty); roomKnown = true; }
        if (room !== r.room) continue;   // (a tile of another room shows none of it)
        const cx = px + ((f.x - tx) - (f.y - ty)) * TILE_W, cy = py + TILE_H + ((f.x - tx) + (f.y - ty)) * TILE_H;   // the Mage's ground point, from this tile
        ctx.save(); ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TILE_W, py + TILE_H); ctx.lineTo(px, py + 2 * TILE_H); ctx.lineTo(px - TILE_W, py + TILE_H); ctx.closePath(); ctx.clip();
        ctx.lineWidth = L.width; ctx.setLineDash(L.dash); ctx.globalAlpha = L.alpha;
        for (let i = 0; i < r.cols.length; i++) { ctx.strokeStyle = r.cols[i]; ctx.lineDashOffset = -(t * L.turn + i * 12); ctx.beginPath(); ctx.ellipse(cx, cy, rx - i * 5, ry - i * 2.5, 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.restore();
    }
}
function equipAuraDraw() {   // the glints, over the world
    if (!_equipAuraHeld.length || typeof ctx === "undefined" || !ctx || typeof player === "undefined" || typeof canvas === "undefined") return;
    const L = EQUIP_AURA_LOOK, W = canvas.width / 2, H = canvas.height / 2, t = _equipNow();
    const scr = (x, y, o) => { o.x = (x - player.visualX - (y - player.visualY)) * TILE_W + W; o.y = (x - player.visualX + (y - player.visualY)) * TILE_H + H + TILE_H - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0); return o; };
    const p = _equipAuraPt;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const u of _equipAuraHeld) {
        const au = u && u._aura; if (!au || u.dead) continue;
        scr(u.x, u.y, p); if (p.x < -40 || p.x > canvas.width + 40 || p.y < -40 || p.y > canvas.height + 40) continue;
        for (let i = 0; i < au.cols.length; i++) {
            const a = t * 0.04 + i * 2.1 + u.x + u.y, gx = p.x + Math.cos(a) * 16, gy = p.y - 6 + Math.sin(a) * 6, g = L.glint;
            ctx.globalAlpha = 0.45 + 0.35 * Math.sin(t * 0.15 + i + u.x); ctx.fillStyle = au.cols[i];
            ctx.beginPath(); ctx.moveTo(gx, gy - g); ctx.lineTo(gx + 1, gy - 1); ctx.lineTo(gx + g, gy); ctx.lineTo(gx + 1, gy + 1); ctx.lineTo(gx, gy + g); ctx.lineTo(gx - 1, gy + 1); ctx.lineTo(gx - g, gy); ctx.lineTo(gx - 1, gy - 1); ctx.closePath(); ctx.fill();   // a four-pointed glint
        }
    }
    ctx.restore();
}
const _equipAuraPt = { x: 0, y: 0 };

// ── EACH FRAME (js/game.js, beside partyTick): every EQUIP.every frames, whatever no longer fits comes off; who stands in an aura is worked out; a refund owed is paid ──
function equipTick(force) {
    if (!force && typeof frame === "number" && frame % EQUIP.every) return;
    if (typeof followers !== "undefined") for (const f of followers) if (f && (f.cards || f.special)) { equipValid(f); if (!f.dead && f.cards) _equipAbilityTick(f); }
    { const kept = [null, null]; for (let i = 0; i < EQUIP.playerSlots; i++) { const id = equipPlayer[i]; if (id && !_equipPlayerWhy(id, i, kept, true)) kept[i] = id; } for (let i = 0; i < EQUIP.playerSlots; i++) if (equipPlayer[i] !== kept[i]) equipPlayer[i] = kept[i]; }   // (each slot against those before it: of two that clash the first stays; a role asleep stays)
    _equipAuraTick();   // (after the cards that no longer fit came off)
    equipRefundTick();
    equipShelfTick();   // (the market's shelf: a new one when the time is up)
    if (typeof playerRolesTick === "function") playerRolesTick();   // (the Player cards' roles that act on a beat: the relays' areas, ARC WARDEN: js/playercards.js)
}

// ── THE RECORD: what a follower's save entry, and a respawn entry, carry ──
function equipRecord(f) { const c = equipSlots(f); return c[0] || c[1] ? c : undefined; }
function equipSpecialRecord(f) { return f && typeof f.special === "string" ? f.special : undefined; }   // (the record's `special`)
function equipSpecialRestore(f, id) { f.special = typeof id === "string" && id ? id : undefined; return !!f.special; }   // (checked by the tick a moment later, as the slots are)
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
    (Array.isArray(d.player) ? d.player : []).slice(0, EQUIP.playerSlots).forEach((id, i) => { if (typeof id === "string" && !_equipPlayerWhy(id, i, equipPlayer, true)) equipPlayer[i] = id; });   // (a role asleep is kept: the class may be put back after the cards)
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
// THE SERIES 2 PACK, which is BOOSTER PACK 2 (the user, 2026-10-31): the pack that deals the Series 2 cards (EQUIP_SERIES2: species cards and class cards), in the same shape as Pack 1, with the archive's approved rules for Pack 2
// (the Game Design Archive, 2026-10-30): it UNLOCKS AFTER THE PURIFICATION (the owner, 2026-11-01, settling the sources that disagreed; it was "after the first boss", calm or defeated), all SIX rarities are eligible, and every pack holds
// at least one PRECISION-OR-HIGHER card (`guaranteed.orHigher`: the reserved slot is filled from Precision and up, by the pack's own odds among them). ON SALE since build 2026-11-01j (the owner: "Series 2. Pick a price and set the
// odds for the pack and make it to where another rarity is unlocked"): ◆150, odds 50/30/15/5, Unrefined to PROTOTYPE (the rarity it unlocks). Its cards: 63 since the following update's Part 1d (the 20 species cards, the
// Technician's 4, the 18 Mage auras and the 3 Brawler opportunity cards since Build B, 45; and the 18 Player cards, at Prototype: "All 18 together", the owner, 2026-11-02; its eight Brawler and Mage class cards were cut,
// EQUIP_CUT); the price and the odds stay (the owner, 2026-11-02), so its Prototype row is 31 cards and each comes up less often than when it was 13. Before the purification it is on the sheet with its button off
// ("UNLOCKS AFTER THE PURIFICATION"), not rolled, and its cards are not on the market's shelf (equipPacksOpen). Its cards are worn, found, unlocked and saved like any card; once it is open the market's shelf can offer any of
// them, a Player card too (a Prototype card's value). Every pack is in EQUIP_PACKS: the roll, the sale, the shelf and the sheet take a pack and ask nothing of which one it is.
const EQUIP_PACK2 = {
    id: "series2", name: "SERIES 2", price: 150, size: 4,     // PICKED by us at the owner's word ("Pick a price and set the odds", 2026-11-01): half again Pack 1's ◆100, for stronger cards that come later
    kinds: ["subclass", "class", "player", "form"],            // species cards (the subclass kind), class cards (the class families), Player cards and, since build 2026-11-06q, the card attacks (the form kind: "Series 2, Prototype") (the player's roles, all Prototype; since Part 1d, once all eighteen were
                                                               // built); never an element card
    eligible: ["unrefined", "refined", "precision", "prototype"],   // THE OWNER (2026-11-01): "Prototype unlocks": Series 2 deals up to PROTOTYPE, the rarity it unlocks beyond Pack 1's Precision; Lustrous joins in a
                                                               // later update (the archive's rule was all six rarities: it is where this is going)
    rarities: { unrefined: 50, refined: 30, precision: 15, prototype: 5 },   // PICKED (as the price): a slot rolled over the four; with the reserved Precision-or-better slot (Prototype 5 in 20) a pack holds a Prototype about 1 time in 3 (1 − 0.75 × 0.95³ ≈ 36%)
    guaranteed: { rarity: "precision", count: 1, orHigher: true },   // APPROVED: at least one Precision-or-higher card in every pack
    unlock: "purified",                                        // DECIDED by the owner (2026-11-01, asked to choose between the sources): on sale once the Sewers are PURIFIED (it was "first_boss": the
                                                               // first boss encounter resolved, calm or defeated, so killing the queen before the water was clean unlocked it)
    keep: "run", unlockNeedsFind: true,
};
const EQUIP_PACKS = [EQUIP_PACK, EQUIP_PACK2];
function equipPackById(id) { return EQUIP_PACKS.find(p => p.id === id) || null; }
function equipPackOf(c) { return c && c.pack ? equipPackById(c.pack) : null; }   // the pack a card is dealt by, or null (the Crystalline six)
function equipPackOnSale(pack) { return !!pack && Number.isFinite(pack.price) && pack.price >= 0 && !!pack.rarities && !!pack.guaranteed && pack.size > 0; }
function equipPacksOnSale() { return EQUIP_PACKS.filter(equipPackOnSale); }
// the packs on sale whose cards can be had now: not one still locked (Series 2 before the purification is on the sheet, its button saying when it opens, but its cards are not on the market's shelf yet)
function equipPacksOpen() { return equipPacksOnSale().filter(p => !equipPackLocked(p)); }
// is the pack still locked (its `unlock` not met)? "purified": the Sewers' water not yet clean (js/quests.js questDone); "first_boss": no boss encounter resolved yet (js/bosses.js bossAnyResolved)
function equipPackLocked(pack) {
    if (!pack || !pack.unlock) return false;
    if (pack.unlock === "purified") return !(typeof questDone === "function" && questDone("purify"));
    if (pack.unlock === "first_boss") return !(typeof bossAnyResolved === "function" && bossAnyResolved());
    return false;
}
// the rarities a guarantee may be filled from: the one named, or that one and every rarer one (`orHigher`), rarest last
function equipGuaranteeRarities(pack) { const g = pack && pack.guaranteed; if (!g) return []; const order = EQUIP_RARITIES.map(r => r.id), i = order.indexOf(g.rarity); if (i < 0) return []; return g.orHigher ? order.slice(i) : [g.rarity]; }
// a small seeded generator (mulberry32), so a pack can be rolled the same twice: the tests give a seed; the game gives none and uses Math.random
function equipRng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function equipPackPool(pack) { pack = pack || EQUIP_PACK; return Object.values(equipCards()).filter(c => !c.test && c.pack === pack.id && pack.kinds.indexOf(c.kind) >= 0 && (!pack.eligible || pack.eligible.indexOf(c.rarity) >= 0) && !!pack.rarities && pack.rarities[c.rarity] > 0); }
// the ids a pack deals (in no set order), or null when it cannot be made (nor from a pack that is not on sale)
function equipPackRoll(seed, pack) {
    pack = pack || EQUIP_PACK; if (!equipPackOnSale(pack) || equipPackLocked(pack)) return null; const rnd = Number.isFinite(seed) ? equipRng(seed) : Math.random;
    const pool = equipPackPool(pack); if (pool.length < pack.size) return null;
    const left = {}; for (const c of pool) (left[c.rarity] = left[c.rarity] || []).push(c);
    const out = [], take = r => { const l = left[r]; if (!l || !l.length) return false; out.push(l.splice(Math.min(l.length - 1, Math.floor(rnd() * l.length)), 1)[0]); return true; };   // (a card leaves the pool once it is taken: never twice)
    const pickOf = rs => { const total = rs.reduce((n, r) => n + pack.rarities[r], 0); let x = rnd() * total, pick = rs[rs.length - 1]; for (const r of rs) { if (x < pack.rarities[r]) { pick = r; break; } x -= pack.rarities[r]; } return pick; };   // (a rarity by the pack's weights, among those given)
    for (let i = 0; i < pack.guaranteed.count; i++) { const rs = equipGuaranteeRarities(pack).filter(r => left[r] && left[r].length); if (!rs.length || !take(pickOf(rs))) return null; }   // (the reserved slot: the guaranteed rarity, or any rarer one when the guarantee is "or higher")
    while (out.length < pack.size) {
        const rs = Object.keys(pack.rarities).filter(r => left[r] && left[r].length); if (!rs.length) return null;
        take(pickOf(rs));
    }
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = out[i]; out[i] = out[j]; out[j] = t; }   // (the reserved card is not always first)
    return out.map(c => c.id);
}
// why a pack cannot be bought now, or null when it can
function equipPackWhyNot(pack) {
    pack = pack || EQUIP_PACK;
    if (!equipPackOnSale(pack)) return "NOT ON SALE YET";   // (a pack without its price, odds or reserved slot)
    if (equipPackLocked(pack)) return pack.unlock === "purified" ? "UNLOCKS AFTER THE PURIFICATION" : "UNLOCKS AFTER THE FIRST BOSS";   // (Series 2: once the Sewers are purified, the owner's rule)
    const have = typeof shardCount === "number" ? shardCount : 0, pool = equipPackPool(pack), gr = equipGuaranteeRarities(pack);
    if (have < pack.price) return "NEED ◆" + (pack.price - have) + " MORE";
    if (pool.length < pack.size || pool.filter(c => gr.indexOf(c.rarity) >= 0).length < pack.guaranteed.count) return "NO CARDS TO FIND";
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
function equipShelfPool() { const seen = new Set(); return equipPacksOpen().flatMap(p => equipPackPool(p)).filter(c => !seen.has(c.id) && seen.add(c.id) && equipMarketValue(c) > 0 && !equipInHand(c.id) && !equipIsFound(c.id)); }   // (the cards the packs on sale deal, that you do not have this run)
function equipShelfIds() { const ok = new Set(equipShelfPool().map(c => c.id)); return equipShelf.ids.filter(id => ok.has(id)); }   // (on sale now: a card that came into the hand, or was found, has left the shelf)
// the shelf's odds: each rarity's weight is the first on-sale pack's that deals it (Pack 1's 60 / 30 / 10 today; a Series 2 rarity Pack 1 has not, its own, when it is on sale)
function equipShelfWeights() { const w = {}; for (const p of equipPacksOpen()) for (const r of Object.keys(p.rarities)) if (!(r in w) && p.rarities[r] > 0) w[r] = p.rarities[r]; return w; }
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
    const fresh = equipGrant(id);
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: (fresh ? "BOUGHT, KEPT FOR GOOD · " : "BOUGHT · ") + c.name, color: "#ffe733", life: 140, vy: -0.25, size: 14 });
    return true;
}
// a card bought (the market's shelf; Side Quest's shop, js/sidequest.js): new to you, it is kept for good (the collection's record is written at once); and it is found, so it can be worn at once. True when it was new to you.
function equipGrant(id) {
    if (!equipCard(id)) return false;
    const fresh = !equipOwns(id); if (fresh) { equipOwnedSet().add(id); equipWriteOwned(); }
    if (!equipIsFound(id)) equipFound.push(id);
    return fresh;
}
