// ─────────────────────────────────────────────────────────
//  THE PACK — the player's inventory (docs/TUTORIAL.md, phase 3)
// ─────────────────────────────────────────────────────────
// A data-driven item system: ITEMS is a table, and the pack window, the pickups, the class restrictions and the use effects are all generated from it. An item is
//   id / name / cat          what it is called, and the tab it is under (gear, tool, part, sample)
//   type                     "consumable" (used up), "tool" (reusable) or "component" (a part, used up by what takes it)
//   stack                    the most of it the pack holds
//   classes                  [class ids] reserved for those classes to USE (none = anyone). Any class can carry it (CLASS_RULES in js/classes.js)
//   col / icon               its colour and the drawing in INV_ICONS
//   desc / lore / stats      a line for the list, the text and numbers of the INSPECT page
//   use(item)                what using it does: returns { ok: true, msg } or { ok: false, why }. A consumable is used up only when it works.
// Adding an item is one row here, an icon (or a reuse of one) and, if it does something, one `use`.
//
// The pack is `playerInv`: { itemId: quantity }. It is the facility tutorial's own state (the facility's save keeps it: js/facilitysave.js).

const INV_CATS = [{ id: "all", label: "ALL" }, { id: "gear", label: "GEAR" }, { id: "tool", label: "TOOLS" }, { id: "part", label: "PARTS" }, { id: "sample", label: "SAMPLES" }];
const INV_TYPES = { consumable: "CONSUMABLE", tool: "TOOL", component: "COMPONENT" };

const ITEMS = {
    ammo_pack: { id: "ammo_pack", name: "AMMO PACK", cat: "gear", type: "consumable", stack: 9, col: "#ffb070", icon: "ammo", classes: null,
        desc: "Rounds in a paper sleeve. Reloads your gun.",
        lore: "Armoury stock, a few years past its date and still good. The sleeve is stamped with a rota nobody kept.",
        stats: ["EFFECT  +10 ROUNDS", "THE GUN HOLDS  60 ROUNDS"],
        use: () => { if (playerAmmo >= PLAYER_AMMO_MAX) return { ok: false, why: "YOUR GUN IS FULL" }; const n = Math.min(10, PLAYER_AMMO_MAX - playerAmmo); playerAmmo += n; return { ok: true, msg: "+" + n + " ROUNDS — " + playerAmmo + " IN THE GUN" }; } },
    flare: { id: "flare", name: "FLARE", cat: "gear", type: "consumable", stack: 6, col: "#ff6a4a", icon: "flare", classes: ["gunslinger"],
        desc: "A tactical flare. Pop it to light the ground where you stand for half a minute.",
        lore: "Road-flare chemistry in a security-issue casing. Burns red and hot and does not care about the power being out.",
        stats: ["EFFECT  LIGHT, 6.5 TILES", "LASTS  30 SECONDS", "ONLY IN A ROOM YOU ARE IN"],
        use: () => (typeof facilityFlare === "function" && facilityFlare()) ? { ok: true, msg: "FLARE LIT" } : { ok: false, why: "NOT IN THE FACILITY" } },
    power_cell: { id: "power_cell", name: "POWER CELL", cat: "part", type: "component", stack: 6, col: "#31e8ff", icon: "cell", classes: ["technomancer"],
        desc: "A charged cell. Overcharges your monitor lamp for a minute.",
        lore: "A lab-grade cell, still holding most of its charge. The Technomancer knows where it wants to be plugged in.",
        stats: ["EFFECT  LAMP BRIGHTER AND 45% WIDER", "LASTS  60 SECONDS"],
        use: () => { if (!(typeof facilityLampBoost === "function" && facilityLampBoost(3600))) return { ok: false, why: "NOT IN THE FACILITY" }; const sh = typeof playerCellShield === "function" ? playerCellShield() : null; return { ok: true, msg: "LAMP OVERCHARGED" + (sh && sh.ok ? " · PHOTONIC SHIELD UP" : "") }; } },   // (BULWARK ENGINEER: a cell raises a Photonic Shield too, js/playercards.js)
    mutagen_sample: { id: "mutagen_sample", name: "MUTAGEN SAMPLE", cat: "sample", type: "consumable", stack: 6, col: "#c06bff", icon: "vial", classes: ["mutator"],
        desc: "A vial of unstable DNA. Feed it to a follower to push it up a level.",
        lore: "Cloudy, warm and faintly alive. The Mutator reads it like a letter from a creature that has not been born yet.",
        stats: ["EFFECT  +1 FOLLOWER LEVEL (+2 ONCE SEQUENCED)", "RANGE  8 TILES", "A FORM EVOLVES AT LEVEL " + (typeof EVOLVE_LEVEL === "number" ? EVOLVE_LEVEL : 10)],
        use: () => invFeedFollower() },
    mech_leg: { id: "mech_leg", name: "MECH LEG", cat: "part", type: "component", stack: 4, col: "#31e8ff", icon: "leg", classes: ["technomancer"],
        desc: "One articulated leg for a spider mech. You need four, and the core.",
        lore: "Titanium and braided cable, jointed twice, still smelling of machine oil. Somebody was building something with long legs.",
        stats: ["NEEDED  4 LEGS AND A CORE", "BUILT AT  THE MECH BAY, THE WAREHOUSE", "USED UP BY THE BUILD"],
        use: () => ({ ok: false, why: "BUILD IT AT THE MECH BAY IN THE WAREHOUSE" }) },
    mech_core: { id: "mech_core", name: "MECH CORE", cat: "part", type: "component", stack: 1, col: "#31e8ff", icon: "core", classes: ["technomancer"],
        desc: "The brain and reactor of a spider mech. It goes in the middle of four legs.",
        lore: "A hexagonal housing humming faintly through its casing. A label reads: DO NOT DROP. Then, in marker: PLEASE.",
        stats: ["NEEDED  4 LEGS AND A CORE", "BUILT AT  THE MECH BAY, THE WAREHOUSE", "USED UP BY THE BUILD"],
        use: () => ({ ok: false, why: "BUILD IT AT THE MECH BAY IN THE WAREHOUSE" }) },
    scrap_metal: { id: "scrap_metal", name: "SCRAP METAL", cat: "part", type: "component", stack: 30, col: "#9aa4b4", icon: "scrap", classes: null,
        desc: "Bent plate and torn casing off the things that live in the arena. The Armory's terminal turns it into ammunition and upgrades.",
        lore: "Whatever the arena's creatures are made of, it is mostly good steel. Somebody in the Armory will pay for it in rounds.",
        stats: ["2 SCRAP = 1 AMMO PACK", "UPGRADES AND ASSEMBLES WEAPONS", "AT  THE ARMORY TERMINAL (NEEDS ITS RELAY ONLINE)", "DROPPED BY THE ARENA'S CREATURES"],
        use: () => ({ ok: false, why: "TAKE IT TO THE ARMORY TERMINAL" }) },
    fuel_cell: { id: "fuel_cell", name: "FUEL CELL", cat: "part", type: "component", stack: 6, col: "#5dffb0", icon: "fuel", classes: null,
        desc: "A sealed canister of reactor fuel. A laser rifle loads one by itself when it runs dry: 12 charges.",
        lore: "A glass-and-steel canister with a green glow that does not flicker. The label says THIS SIDE UP and, underneath, in a different hand, YES REALLY.",
        stats: ["LOADED INTO  THE LASER RIFLE", "EACH CELL  12 CHARGES", "FOUND IN  THE SERVER ROOM, ONCE ITS POWER IS BACK"],
        use: () => ({ ok: false, why: "THE LASER RIFLE LOADS IT BY ITSELF" }) },
    // THE REPAIR KIT (docs/PLAYER-COMBAT.md, step 1, build 2026-11-11e; the owner, 2026-11-11: "have the player use items to recharge the bars"): one of your bars back, mid-fight too (js/playercombat.js)
    repair_kit: { id: "repair_kit", name: "REPAIR KIT", cat: "gear", type: "consumable", stack: 3, col: "#7dffa8", icon: "repair", classes: null,
        desc: "A pocket repair kit for your shell. Use it to get one of your bars back, even in the middle of a fight.",
        lore: "A palm-sized case of sealant, a coil of patch tape and a driver with three bits. Somebody wrote KEEP ONE ON YOU inside the lid.",
        stats: ["EFFECT  ONE BAR BACK (NOT PAST THREE)", "FROM  CREATURES, SOMETIMES; AND SPOTS IN THE FACILITY THAT FILL AGAIN", "QUICK USE  THE KIT PILL BY THE DIAL, OR H"],
        use: () => typeof playerKitUse === "function" ? playerKitUse() : { ok: false, why: "NOT NOW" } },
    // the Mutator's HEALING SERUM (js/serum.js): made at the laboratory over time, or crafted there for DNA; used, it is splashed where the Mutator stands and heals the allies in the pool
    healing_serum: { id: "healing_serum", name: "HEALING SERUM", cat: "sample", type: "consumable", stack: 5, col: "#7dffb0", icon: "vial", classes: ["mutator"],
        desc: "A green serum. Splashed on the ground, it makes a pool that heals your followers and clones standing in it.",
        lore: "Brewed under the fume hood from whatever the Mutator has learned. It smells of cut grass and copper.",
        stats: ["EFFECT  A HEALING POOL WHERE YOU STAND", "MADE AT  THE SERUM HOOD, EXPERIMENT LAB", "QUICK USE  THE SERUM PILL, OR Q"],
        use: () => typeof serumUse === "function" ? serumUse() : { ok: false, why: "NO SERUM HERE" } },
    // the brief: "The main character handles the specimen's containment capsule and transports it to the Resurrection Zone." What it holds is in specimenCarried (js/specimen.js); this is its place in the pack.
    specimen_capsule: { id: "specimen_capsule", name: "SPECIMEN CAPSULE", cat: "sample", type: "tool", stack: 3, col: "#aeeaff", icon: "fuel", classes: null,
        desc: "A fallen ally, frozen by an Ice Mage and sealed in a containment capsule. Use it at the Resurrection Zone (the Crystal) to bring it back.",
        lore: "Frost on the inside of the glass, and something very still behind it. The seal hums. It is lighter than it should be.",
        stats: ["HOLDS  ONE PRESERVED SPECIMEN", "USED AT  THE RESURRECTION ZONE: THE CRYSTAL", "IT COMES BACK AS IT WAS"],
        use: () => typeof specimenUseItem === "function" ? specimenUseItem() : { ok: false, why: "TAKE IT TO THE CRYSTAL" } },
    // the Level 1 update: "Spawn collectible rocks exactly once upon destruction", then "a pack item with no use yet" (js/techabilities.js, the Thermite Drill)
    rock: { id: "rock", name: "ROCK", cat: "part", type: "component", stack: 9, col: "#c2a888", icon: "rock", classes: null,
        desc: "A lump of rock from behind the rubble in the arena's south wall. It has no use yet.",
        lore: "Scorched on one side where the thermite went through. Something has been scratching at the other.",
        stats: ["FROM  THE RUBBLE IN THE ARENA'S SOUTH ROCK", "THREE, ONCE", "USE  NONE YET"],
        use: () => ({ ok: false, why: "NO USE FOR IT YET" }) },
    // THE SEWER PURIFICATION QUEST (js/quests.js; docs/SEWER-QUEST.md): the samples the Experiment Lab's analysis bench wants (three from the toxic ants of the Sewers, one of the river's water from the collapsed tunnel) and the module it sells
    toxic_sample: { id: "toxic_sample", name: "TOXIC ANT SAMPLE", cat: "sample", type: "component", stack: 6, col: "#8cff5a", icon: "vial", classes: null,
        desc: "A vial swabbed from a toxic ant of the Sewers. The analysis bench in the Experiment Lab wants three.",
        lore: "Whatever the ants drink down there, it comes out of them green. The vial is warm.",
        stats: ["DROPPED BY  THE TOXIC ANTS IN THE SEWERS", "NEEDED  3, AT THE ANALYSIS BENCH (EXPERIMENT LAB)", "PART OF  THE SEWER PURIFICATION"],
        use: () => ({ ok: false, why: "TAKE IT TO THE ANALYSIS BENCH IN THE EXPERIMENT LAB" }) },
    sewer_sample: { id: "sewer_sample", name: "WATER SAMPLE", cat: "sample", type: "component", stack: 1, col: "#c77dff", icon: "vial", classes: null,
        desc: "A sealed vial of the sewer river's water, from the collapsed tunnel. The analysis bench wants it with the ant samples.",
        lore: "Violet, and it will not settle. Somebody sealed it and never came back for it.",
        stats: ["FROM  THE COLLAPSED TUNNEL IN THE SEWERS", "NEEDED  1, AT THE ANALYSIS BENCH (EXPERIMENT LAB)", "PART OF  THE SEWER PURIFICATION"],
        use: () => ({ ok: false, why: "TAKE IT TO THE ANALYSIS BENCH IN THE EXPERIMENT LAB" }) },
    // THE POWER MODULE (the tutorial, build 2026-11-07qq; the owner: "you need to obtain a module to repair it somewhere on the map"): up on the catwalks over the arena, out of reach; Side Quest flies up for it
    // (js/sidequest.js). It goes into the MAIN POWER JUNCTION in the server room (js/stations.js), which then turns every relay on.
    power_module: { id: "power_module", name: "POWER MODULE", cat: "part", type: "tool", stack: 1, col: "#ffb347", icon: "core", classes: null,
        desc: "A replacement module for the facility's main power junction. Slotted in, it brings every relay back online.",
        lore: "A heavy cartridge with a cracked status window and a sticker: SPARE — DO NOT REMOVE. Someone removed it and left it on the catwalks.",
        stats: ["FOUND ON  THE CATWALKS OVER THE ARENA (SIDE QUEST FLIES UP FOR IT)", "INSTALLED AT  THE MAIN POWER JUNCTION, THE SERVER ROOM", "THE INSTALL  STAY AT THE JUNCTION WHILE IT GOES IN"],
        use: () => ({ ok: false, why: "INSTALL IT AT THE MAIN POWER JUNCTION IN THE SERVER ROOM" }) },
    purification_module: { id: "purification_module", name: "PURIFICATION MODULE", cat: "part", type: "tool", stack: 1, col: "#5ff7e0", icon: "core", classes: null,
        desc: "A filtration module built in the Experiment Lab. It mounts on the cistern's console in the Sewers, and cleans the river while it runs.",
        lore: "A canister of membranes and a pump, and a chalk mark on it: THE DRAIN. Heavier than it looks.",
        stats: ["BOUGHT AT  THE ANALYSIS BENCH, ◆" + 300, "INSTALLED AT  THE PURIFIER MOUNT: THE NEST, SEWERS", "THE INSTALL  STAY AT THE MOUNT WHILE IT MOUNTS"],   // (the price is QUEST_PURIFY.modulePrice, js/quests.js, which loads after this table: tests/sewerquest.js holds the two to one number)
        use: () => ({ ok: false, why: "INSTALL IT AT THE PURIFIER MOUNT IN THE SEWERS' CISTERN" }) },
    // THE SLEEPING POTION (js/potion.js; the archive's Side Quest design, 2026-10-31): Side Quest's original, and the Experiment Lab's copy. A TOOL in the pack's terms: its button EQUIPS it (verb), and the throw (the
    // POTION pill by the ammunition, or the key) takes it from the pack itself. Its numbers are the potion's table (stats is read when the page is drawn, after js/potion.js has loaded).
    sleeping_potion: { id: "sleeping_potion", name: "SLEEPING POTION", cat: "gear", type: "tool", stack: 1, col: "#bcd0ff", icon: "potion", classes: null,
        desc: "Side Quest's potion. Equip it and throw it: everything near where it lands sleeps a few seconds, your followers too. Never you.",
        lore: "A round flask of something blue that settles slowly. The drone would not say where he got it. It smells of cold rain.",
        get stats() { const P = typeof POTION !== "undefined" ? POTION : null; return P ? ["EFFECT  SLEEP, " + Math.round(P.sleep / 60) + " S, " + P.radius + " TILES ROUND WHERE IT LANDS", "SPARES  ONLY YOU", "THROWN BY  THE POTION PILL, OR " + P.key.toUpperCase() + ", ONCE EQUIPPED", "FROM  SIDE QUEST, ◆" + P.price + " (◆" + P.bossPrice + " THE NEXT, ONCE IT HAS PUT THE QUEEN TO SLEEP)"] : []; },
        verb: () => typeof potionVerb === "function" ? potionVerb("sleeping_potion") : "EQUIP", use: () => typeof potionUse === "function" ? potionUse("sleeping_potion") : { ok: false, why: "NO POTION HERE" } },
    sleeping_potion_copy: { id: "sleeping_potion_copy", name: "COPIED POTION", cat: "gear", type: "tool", stack: 2, col: "#dbe3ff", icon: "potion", classes: null,
        desc: "The Experiment Lab's copy of Side Quest's potion: a quarter of its sleep, and it touches enemies only.",
        lore: "Paler, and it does not settle. Side Quest never said you could. You did not ask.",
        get stats() { const P = typeof POTION !== "undefined" ? POTION : null; return P ? ["EFFECT  SLEEP, " + (Math.round(P.sleep * P.copyFactor) / 60).toFixed(2).replace(/\.?0+$/, "") + " S (A QUARTER OF THE ORIGINAL), " + P.radius + " TILES", "SPARES  YOU AND YOURS: ENEMIES ONLY", "THROWN BY  THE POTION PILL, OR " + P.key.toUpperCase() + ", ONCE EQUIPPED", "MADE AT  THE ANALYSIS BENCH, ◆" + P.copyPrice + ", WITH THE ORIGINAL IN YOUR PACK"] : []; },
        verb: () => typeof potionVerb === "function" ? potionVerb("sleeping_potion_copy") : "EQUIP", use: () => typeof potionUse === "function" ? potionUse("sleeping_potion_copy") : { ok: false, why: "NO POTION HERE" } },
};
const ITEM_ORDER = ["ammo_pack", "repair_kit", "flare", "power_cell", "mutagen_sample", "power_module", "mech_leg", "mech_core", "scrap_metal", "fuel_cell", "healing_serum", "specimen_capsule", "rock", "toxic_sample", "sewer_sample", "purification_module", "sleeping_potion", "sleeping_potion_copy"];

// ── the pack ──
let playerInv = {};
let invPanelOpen = false, _invCat = "all", _invSel = null, _invInspect = false, _invMsg = null;
function itemDef(id) { return ITEMS[id] || null; }
function invCount(id) { return playerInv[id] || 0; }
function invHas(id, n) { return invCount(id) >= (n || 1); }
function invRoom(id) { const d = itemDef(id); return d ? Math.max(0, d.stack - invCount(id)) : 0; }
// put n of an item in the pack: returns how many went in (a full stack leaves the rest where it was)
function invAdd(id, n) {
    const d = itemDef(id); n = Math.floor(n === undefined ? 1 : n); if (!d || !(n > 0)) return 0;
    if (!classCanCarry(d.classes)) return 0;
    const put = Math.min(n, invRoom(id)); if (put > 0) { playerInv[id] = invCount(id) + put; invSeen.add(id); if (!_invSel) _invSel = id; }
    return put;
}
function invRemove(id, n) { n = Math.floor(n === undefined ? 1 : n); if (!invHas(id, n)) return false; playerInv[id] -= n; if (playerInv[id] <= 0) { delete playerInv[id]; if (_invSel === id && !invPanelOpen) _invSel = null; } return true; }   // (the window open: the last one used stays chosen, its tile at x0)
function invItems(cat) { return ITEM_ORDER.filter(id => invCount(id) > 0 && (!cat || cat === "all" || itemDef(id).cat === cat)); }
function invReset() { invSeen = new Set(); if (typeof classPerks !== "undefined") classPerks = new Set(); if (typeof classReset === "function") classReset(); if (typeof weaponReset === "function") weaponReset(); playerInv = {}; _invSel = null; _invInspect = false; _invMsg = null; invPanelOpen = false; }
// can the player use it? { ok, why }: the class rule first, then what the item itself needs
function invCanUse(id) {
    const d = itemDef(id); if (!d) return { ok: false, why: "UNKNOWN ITEM" };
    if (!invHas(id)) return { ok: false, why: "NONE IN THE PACK" };
    if (!classAllows(d.classes)) return { ok: false, why: playerClassKey ? "ONLY A " + d.classes.map(className).join(" / ") + " CAN USE THIS" : "CLASSES COME AFTER THE TUTORIAL" };
    return { ok: true };
}
function invUse(id) {
    const can = invCanUse(id); if (!can.ok) { invSay(can.why, false); return can; }
    const d = itemDef(id), r = d.use ? d.use(d) : { ok: false, why: "NOTHING HAPPENS" };
    if (r.ok) { if (d.type !== "tool") invRemove(id, 1); invSay(r.msg, true); } else invSay(r.why, false);
    return r;
}
function invSay(text, good) {
    _invMsg = { text, good: !!good, until: (typeof frame !== "undefined" ? frame : 0) + 150 };
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && !invPanelOpen) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 120, text, color: good ? "#9dffb6" : "#ff9c8a", life: 120, vy: -0.12, size: 13 });
}
// a Mutator's sample, fed to the nearest follower in range: it gains a level (and so may evolve: js/levels.js gainXp, js/evolution.js)
function invFeedFollower() {
    if (typeof followers === "undefined" || typeof gainXp !== "function") return { ok: false, why: "NO FOLLOWERS HERE" };
    let best = null, bd = 8;
    for (const f of followers) { if (!f || f.dead || f.team !== "green" || !Number.isFinite(f.level) || f.level >= LEVEL_CAP) continue; const d = Math.hypot(f.x - player.visualX, f.y - player.visualY); if (d < bd) { bd = d; best = f; } }
    if (!best) return { ok: false, why: "NO FOLLOWER WITHIN 8 TILES" };
    const levels = Math.max(1, Math.round(typeof classStat === "function" ? classStat("mutagenLevels", 1) : 1)), from = best.level;
    for (let i = 0; i < levels && best.level < LEVEL_CAP; i++) { const need = xpForLevel(best.level + 1) - (Number.isFinite(best.xp) ? best.xp : xpForLevel(best.level)); gainXp(best, Math.max(1, need)); }
    return { ok: true, msg: ((best.name || best.speciesName || "FOLLOWER") + "").toUpperCase() + " ▲ LEVEL " + best.level + (best.level - from > 1 ? "  (+" + (best.level - from) + ")" : "") };
}

// ── the icons: each draws centred on (x, y) in a box of `s` pixels (t is a slow clock for the inspect page's shine) ──
const INV_ICONS = {
    rock: (c, x, y, s, col) => {   // a rough lump, scorched along one side
        c.lineJoin = "round"; c.lineWidth = Math.max(2, s * 0.05); c.strokeStyle = "#2a2018";
        c.fillStyle = "#8a7660"; c.beginPath(); c.moveTo(x - s * 0.32, y + s * 0.18); c.lineTo(x - s * 0.24, y - s * 0.16); c.lineTo(x - s * 0.02, y - s * 0.3); c.lineTo(x + s * 0.26, y - s * 0.18); c.lineTo(x + s * 0.34, y + s * 0.1); c.lineTo(x + s * 0.12, y + s * 0.3); c.lineTo(x - s * 0.18, y + s * 0.3); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = col; c.beginPath(); c.moveTo(x - s * 0.24, y - s * 0.16); c.lineTo(x - s * 0.02, y - s * 0.3); c.lineTo(x + s * 0.26, y - s * 0.18); c.lineTo(x + s * 0.02, y - s * 0.06); c.closePath(); c.fill();
        c.fillStyle = "rgba(60,30,14,0.75)"; c.beginPath(); c.moveTo(x + s * 0.12, y + s * 0.3); c.lineTo(x + s * 0.34, y + s * 0.1); c.lineTo(x + s * 0.2, y + s * 0.04); c.lineTo(x + s * 0.02, y + s * 0.22); c.closePath(); c.fill();
        c.strokeStyle = "rgba(255,150,60,0.55)"; c.lineWidth = Math.max(1, s * 0.03); c.beginPath(); c.moveTo(x + s * 0.06, y + s * 0.24); c.lineTo(x + s * 0.26, y + s * 0.08); c.stroke();
    },
    scrap: (c, x, y, s, col) => {
        c.lineJoin = "round"; c.lineWidth = Math.max(2, s * 0.05); c.strokeStyle = col;
        c.fillStyle = "#3b414c"; c.beginPath(); c.moveTo(x - s * 0.34, y + s * 0.08); c.lineTo(x - s * 0.1, y - s * 0.28); c.lineTo(x + s * 0.14, y - s * 0.12); c.lineTo(x + s * 0.06, y + s * 0.2); c.lineTo(x - s * 0.22, y + s * 0.3); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = "#59606d"; c.beginPath(); c.moveTo(x - s * 0.02, y + s * 0.02); c.lineTo(x + s * 0.3, y - s * 0.16); c.lineTo(x + s * 0.36, y + s * 0.18); c.lineTo(x + s * 0.12, y + s * 0.3); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = "#1a1d24"; c.beginPath(); c.arc(x - s * 0.12, y + s * 0.08, s * 0.045, 0, 6.2832); c.arc(x + s * 0.22, y + s * 0.08, s * 0.035, 0, 6.2832); c.fill();
    },
    fuel: (c, x, y, s, col) => {
        c.lineWidth = Math.max(2, s * 0.05); c.strokeStyle = col; c.fillStyle = "rgba(93,255,176,0.16)";
        c.beginPath(); c.rect(x - s * 0.17, y - s * 0.26, s * 0.34, s * 0.6); c.fill(); c.stroke();
        c.fillStyle = col; c.globalAlpha = 0.85; c.fillRect(x - s * 0.13, y - s * 0.02, s * 0.26, s * 0.3); c.globalAlpha = 1;
        c.fillStyle = "#3b414c"; c.fillRect(x - s * 0.21, y - s * 0.34, s * 0.42, s * 0.1); c.fillRect(x - s * 0.21, y + s * 0.32, s * 0.42, s * 0.08);
        c.fillStyle = "#e8fff4"; c.fillRect(x - s * 0.09, y - s * 0.16, s * 0.04, s * 0.22);
    },
    ammo: (c, x, y, s, col) => {
        c.fillStyle = "#2a2018"; c.strokeStyle = col; c.lineWidth = Math.max(2, s * 0.05); c.beginPath(); c.rect(x - s * 0.34, y - s * 0.12, s * 0.68, s * 0.42); c.fill(); c.stroke();
        for (let i = 0; i < 4; i++) { const bx = x - s * 0.26 + i * s * 0.17; c.fillStyle = "#f2d27a"; c.fillRect(bx, y - s * 0.34, s * 0.1, s * 0.24); c.fillStyle = "#c58b45"; c.fillRect(bx, y - s * 0.34, s * 0.1, s * 0.07); }
        c.fillStyle = col; c.fillRect(x - s * 0.34, y + s * 0.02, s * 0.68, s * 0.07);
    },
    flare: (c, x, y, s, col, t) => {
        c.save(); c.translate(x, y); c.rotate(-0.5);
        c.fillStyle = "#5a1d16"; c.strokeStyle = col; c.lineWidth = Math.max(2, s * 0.05); c.beginPath(); c.rect(-s * 0.08, -s * 0.22, s * 0.16, s * 0.5); c.fill(); c.stroke();
        c.fillStyle = "#f4e2c0"; c.fillRect(-s * 0.08, -s * 0.02, s * 0.16, s * 0.07);
        const fl = 0.85 + 0.15 * Math.sin((t || 0) * 0.15); c.fillStyle = "#ffd27a"; c.beginPath(); c.ellipse(0, -s * 0.34, s * 0.13 * fl, s * 0.2 * fl, 0, 0, 6.2832); c.fill(); c.fillStyle = "#fff6d8"; c.beginPath(); c.ellipse(0, -s * 0.31, s * 0.06, s * 0.1, 0, 0, 6.2832); c.fill();
        c.restore();
    },
    cell: (c, x, y, s, col) => {
        c.fillStyle = "#0c2a33"; c.strokeStyle = col; c.lineWidth = Math.max(2, s * 0.05); c.beginPath(); c.rect(x - s * 0.2, y - s * 0.28, s * 0.4, s * 0.58); c.fill(); c.stroke();
        c.fillStyle = col; c.fillRect(x - s * 0.1, y - s * 0.36, s * 0.2, s * 0.08);
        for (let i = 0; i < 3; i++) { c.globalAlpha = 0.5 + i * 0.25; c.fillRect(x - s * 0.14, y + s * 0.16 - i * s * 0.17, s * 0.28, s * 0.12); } c.globalAlpha = 1;
    },
    vial: (c, x, y, s, col) => {
        c.strokeStyle = col; c.lineWidth = Math.max(2, s * 0.05); c.fillStyle = "rgba(192,107,255,0.28)";
        c.beginPath(); c.moveTo(x - s * 0.07, y - s * 0.34); c.lineTo(x - s * 0.07, y - s * 0.12); c.lineTo(x - s * 0.24, y + s * 0.2); c.quadraticCurveTo(x - s * 0.26, y + s * 0.32, x - s * 0.12, y + s * 0.32); c.lineTo(x + s * 0.12, y + s * 0.32); c.quadraticCurveTo(x + s * 0.26, y + s * 0.32, x + s * 0.24, y + s * 0.2); c.lineTo(x + s * 0.07, y - s * 0.12); c.lineTo(x + s * 0.07, y - s * 0.34); c.closePath(); c.fill(); c.stroke();
        c.fillStyle = col; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(x, y + s * 0.2, s * 0.14, s * 0.07, 0, 0, 6.2832); c.fill(); c.globalAlpha = 1; c.fillRect(x - s * 0.1, y - s * 0.38, s * 0.2, s * 0.06);
        c.fillStyle = "#e9c8ff"; c.beginPath(); c.arc(x - s * 0.04, y + s * 0.06, s * 0.03, 0, 6.2832); c.arc(x + s * 0.06, y + s * 0.14, s * 0.02, 0, 6.2832); c.fill();
    },
    potion: (c, x, y, s, col, t) => {   // a round flask: a narrow neck, a stopper, the liquid settling, a slow bubble
        c.strokeStyle = col; c.lineWidth = Math.max(2, s * 0.05); c.fillStyle = "rgba(188,208,255,0.16)";
        c.beginPath(); c.moveTo(x - s * 0.08, y - s * 0.3); c.lineTo(x - s * 0.08, y - s * 0.1); c.bezierCurveTo(x - s * 0.36, y - s * 0.02, x - s * 0.36, y + s * 0.34, x, y + s * 0.34); c.bezierCurveTo(x + s * 0.36, y + s * 0.34, x + s * 0.36, y - s * 0.02, x + s * 0.08, y - s * 0.1); c.lineTo(x + s * 0.08, y - s * 0.3); c.closePath(); c.fill(); c.stroke();
        c.save(); c.beginPath(); c.arc(x, y + s * 0.13, s * 0.22, 0, 6.2832); c.clip(); c.fillStyle = col; c.globalAlpha = 0.8; c.fillRect(x - s * 0.3, y + s * 0.08 + Math.sin((t || 0) * 0.05) * s * 0.01, s * 0.6, s * 0.3); c.restore();
        c.fillStyle = "#2a3350"; c.fillRect(x - s * 0.11, y - s * 0.38, s * 0.22, s * 0.09);
        c.fillStyle = "#f0f4ff"; c.globalAlpha = 0.9; c.beginPath(); c.arc(x + s * 0.06, y + s * 0.1 - (((t || 0) * 0.3) % (s * 0.14)), s * 0.025, 0, 6.2832); c.fill(); c.globalAlpha = 1;
    },
    kit: (c, x, y, s, col) => {
        c.fillStyle = "#2b2f3a"; c.strokeStyle = col; c.lineWidth = Math.max(2, s * 0.05); c.beginPath(); c.rect(x - s * 0.36, y - s * 0.12, s * 0.72, s * 0.44); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(x - s * 0.14, y - s * 0.12); c.lineTo(x - s * 0.14, y - s * 0.26); c.lineTo(x + s * 0.14, y - s * 0.26); c.lineTo(x + s * 0.14, y - s * 0.12); c.stroke();
        c.fillStyle = col; c.beginPath(); c.moveTo(x + s * 0.04, y - s * 0.02); c.lineTo(x - s * 0.1, y + s * 0.12); c.lineTo(x, y + s * 0.12); c.lineTo(x - s * 0.04, y + s * 0.26); c.lineTo(x + s * 0.12, y + s * 0.08); c.lineTo(x + s * 0.02, y + s * 0.08); c.closePath(); c.fill();
    },
    repair: (c, x, y, s, col) => {   // the repair kit: a small case with a handle, a plus on its lid
        c.fillStyle = "#2b2f3a"; c.strokeStyle = col; c.lineWidth = Math.max(2, s * 0.05); c.beginPath(); c.rect(x - s * 0.34, y - s * 0.12, s * 0.68, s * 0.42); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(x - s * 0.13, y - s * 0.12); c.lineTo(x - s * 0.13, y - s * 0.25); c.lineTo(x + s * 0.13, y - s * 0.25); c.lineTo(x + s * 0.13, y - s * 0.12); c.stroke();
        c.fillStyle = col; c.fillRect(x - s * 0.045, y - s * 0.03, s * 0.09, s * 0.25); c.fillRect(x - s * 0.125, y + s * 0.05, s * 0.25, s * 0.09);
    },
    leg: (c, x, y, s, col) => {
        c.strokeStyle = "#0b1a20"; c.lineCap = "round"; c.lineJoin = "round"; c.lineWidth = Math.max(5, s * 0.16); c.beginPath(); c.moveTo(x - s * 0.3, y + s * 0.3); c.lineTo(x - s * 0.05, y - s * 0.22); c.lineTo(x + s * 0.3, y - s * 0.02); c.stroke();
        c.strokeStyle = col; c.lineWidth = Math.max(2.5, s * 0.08); c.stroke(); c.fillStyle = "#e8f6ff"; c.beginPath(); c.arc(x - s * 0.05, y - s * 0.22, s * 0.07, 0, 6.2832); c.fill();
    },
    core: (c, x, y, s, col) => {
        c.fillStyle = "#12323a"; c.strokeStyle = col; c.lineWidth = Math.max(2, s * 0.05); c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * 1.0472 + 0.5236; c.lineTo(x + Math.cos(a) * s * 0.34, y + Math.sin(a) * s * 0.34); } c.closePath(); c.fill(); c.stroke();
        c.fillStyle = col; c.beginPath(); c.arc(x, y, s * 0.13, 0, 6.2832); c.fill(); c.globalAlpha = 0.5; c.beginPath(); c.arc(x, y, s * 0.2, 0, 6.2832); c.stroke(); c.globalAlpha = 1;
    },
};
// THE ITEMS IN 3D (build 2026-11-13x; the owner: "I want to redo the items in the game make them have 3-D looking assets"): each item is drawn as its 3D model, baked from the game's own camera
// (img/props/itemicons.png: design/props/models/itemicons.js, the same models as the floor's pickups), its larger side INV_ICON_FIT of the box; the flat drawing above until the sheet has arrived
const INV_ICON_FIT = 0.96;
function invIconCell(id) { return typeof PROP_ATLAS !== "undefined" && PROP_ATLAS.itemicons ? PROP_ATLAS.itemicons.cells[id] || null : null; }
function _invIconImg(id) { const c = invIconCell(id), im = c && typeof _psImg === "function" ? _psImg("itemicons") : null; return im ? { im, c } : null; }
function _invBlitIcon(g, I, x, y, s) { const c = I.c, k = s * INV_ICON_FIT / Math.max(c.w, c.h); g.imageSmoothingQuality = "high"; g.drawImage(I.im, c.x, c.y, c.w, c.h, x - c.w * k / 2, y - c.h * k / 2, c.w * k, c.h * k); }
function invDrawIcon(id, x, y, s, t) {
    const d = itemDef(id); if (!d || typeof ctx === "undefined") return; ctx.save();
    const I = _invIconImg(id); if (I) _invBlitIcon(ctx, I, x, y, s); else (INV_ICONS[d.icon] || INV_ICONS.ammo)(ctx, x, y, s, d.col, t || 0);
    ctx.restore();
}

// ── the window: THE WHOLE ROSTER (build 2026-11-09zz; the owner, 2026-11-10: "redo the item bag to match the Super Smash Bros. Roster style"; of two drafts, "B The whole roster") ──
// A select screen of every item in the game (ITEM_ORDER), filtered by the tabs. An item you carry is a lit tile: its icon, its count, its name on a black bar, a corner of its colour. One you have held but have
// none of now is dimmed at ×0; one never found is a dark silhouette marked ???; one your class may not use has a red LOCKED strip. The chosen tile glows white. The chosen item stands on the STAGE card at the
// foot: big, its name, its line (tab, kind, count, who may use it), its text (on INSPECT its lore and numbers), USE and INSPECT. A phone: the same, smaller tiles, SWITCH CLASS in a row under the title band, the
// buttons along the foot of the stage. (Until this build the pack listed only what it held, beside an item page.)
let invSeen = new Set();   // every item ever in the pack, so its tile stays known when the last of it is used (kept with the save: js/facilitysave.js)
function invKnown(id) { return invSeen.has(id) || invCount(id) > 0; }
function _ivRoster() { return ITEM_ORDER.filter(id => _invCat === "all" || itemDef(id).cat === _invCat); }
function _ivRgba(hex, a) { const h = String(hex || "#ffffff").replace("#", ""), n = parseInt(h.length === 3 ? h.split("").map(c => c + c).join("") : h, 16); return "rgba(" + ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")"; }
function _ivLayout() {
    const W = canvas.width, H = canvas.height, wide = W >= 720;
    const top = typeof uiTopSafe === "function" ? uiTopSafe() : 8, bottom = typeof uiBottomSafe === "function" ? uiBottomSafe() : H - 8;
    const pw = Math.min(W - 16, wide ? 1100 : 560), px = Math.round((W - pw) / 2), py = Math.max(4, Math.min(top, H - 380)), ph = Math.max(360, bottom - py), gut = wide ? 22 : 12;
    const L = { W, H, wide, px, py, pw, ph, gut, tabs: [], cells: [], buttons: [], close: null, swap: null };
    // the title band: CLOSE at its end, SWITCH CLASS beside it once there is a class (js/classes.js; on a phone in a row of its own under the band, with the class's line)
    const hasClass = !!(typeof playerClassKey !== "undefined" && playerClassKey);
    L.close = { x: px + pw - gut - 112, y: py + 12, w: 112, h: 38 };
    if (hasClass) L.swap = wide ? { x: L.close.x - 10 - 170, y: py + 12, w: 170, h: 38 } : { x: px + pw - gut - 160, y: py + 68, w: 160, h: 34 };
    L.classAt = wide ? { x: px + gut + 150, y: py + 22, w: (L.swap ? L.swap.x : L.close.x) - (px + gut + 150) - 12 } : { x: px + gut, y: py + 76, w: pw - gut * 2 - (L.swap ? 172 : 0) };
    const ty = py + 62 + (wide ? 12 : 54), tabH = wide ? 38 : 34, tw = Math.floor((pw - gut * 2 - (INV_CATS.length - 1) * 8) / INV_CATS.length);
    INV_CATS.forEach((c, i) => L.tabs.push({ id: c.id, label: c.label, x: px + gut + i * (tw + 8), y: ty, w: tw, h: tabH, on: c.id === _invCat }));
    // the stage at the foot, and the roster between the tabs and it: as many tiles across as gives the biggest tiles that all fit
    const sh = wide ? 170 : 212; L.stage = L.detail = { x: px + 6, y: py + ph - sh - 6, w: pw - 12, h: sh };
    const gy = ty + tabH + 14, gw = pw - gut * 2, gh = L.stage.y - 12 - gy, ids = _ivRoster(), gap = wide ? 10 : 6;
    let best = null;
    for (let cols = wide ? 6 : 4; cols <= (wide ? 11 : 6); cols++) { const w = Math.floor((gw - (cols - 1) * gap) / cols), h = Math.round(w * 0.84), rows = Math.ceil(ids.length / cols); if (rows * (h + gap) - gap <= gh && (!best || w > best.w)) best = { cols, w, h }; }
    if (!best) { const cols = wide ? 11 : 6, rows = Math.max(1, Math.ceil(ids.length / cols)); best = { cols, w: Math.floor((gw - (cols - 1) * gap) / cols), h: Math.max(36, Math.floor((gh + gap) / rows - gap)) }; }
    best.h = Math.max(best.h, Math.min(Math.round(best.w * 1.05), Math.floor((gh + gap) / Math.max(1, Math.ceil(ids.length / best.cols)) - gap)));   // (taller tiles where the rows leave room: the names fit)
    L.list = { x: px + gut, y: gy, w: gw, h: gh };
    ids.forEach((id, i) => L.cells.push({ id, x: px + gut + (i % best.cols) * (best.w + gap), y: gy + Math.floor(i / best.cols) * (best.h + gap), w: best.w, h: best.h }));
    const S = L.stage, bw = wide ? 150 : Math.floor((S.w - 50) / 2), bh = wide ? 52 : 42, by = wide ? S.y + Math.round(S.h / 2 - bh / 2) + 4 : S.y + S.h - bh - 12;
    L.buttons = wide ? [{ id: "use", x: S.x + S.w - 34 - bw * 2 - 14, y: by, w: bw, h: bh }, { id: "inspect", x: S.x + S.w - 34 - bw, y: by, w: bw, h: bh }]
                     : [{ id: "use", x: S.x + 20, y: by, w: bw, h: bh }, { id: "inspect", x: S.x + 30 + bw, y: by, w: bw, h: bh }];
    return L;
}
function _ivWrap(lines, text, chars) { for (const l of uiWrap(text, chars)) lines.push(l); }
function _ivPara(x, y, w, h, s) { ctx.beginPath(); ctx.moveTo(x + s, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - s, y + h); ctx.lineTo(x, y + h); ctx.closePath(); }
// an item never found: its icon as a dark silhouette (drawn once per size; its 3D icon's once the sheet has arrived)
const _ivSil = {};
function _ivSilhouette(id, s) {
    const I = _invIconImg(id), k = id + "@" + s + (I ? "/3d" : ""); if (_ivSil[k] !== undefined) return _ivSil[k];
    let c = null; try { c = document.createElement("canvas"); c.width = c.height = Math.ceil(s * 1.4); const g = c.getContext("2d"), d = itemDef(id); if (!g) c = null; else { if (I) _invBlitIcon(g, I, c.width / 2, c.height / 2, s); else (INV_ICONS[d.icon] || INV_ICONS.ammo)(g, c.width / 2, c.height / 2, s, d.col, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = "#1c2440"; g.fillRect(0, 0, c.width, c.height); } } catch (e) { c = null; }
    return (_ivSil[k] = c);
}
// a tile's name on its bar: one line, or two when it does not fit
function _ivName(t, c, nb, col) {
    const max = c.w - 10, size = Math.max(8, Math.min(13, Math.round(nb * 0.5))), y = c.y + c.h - nb / 2 + 1;
    ctx.save(); ctx.font = uiFont(size); const one = ctx.measureText(t).width <= max; ctx.restore();
    if (one || t.indexOf(" ") < 0) { uiTextFit(t, c.x + c.w / 2, y, size, col, "center", max); return; }
    const w = t.split(" "), mid = Math.ceil(w.length / 2), s2 = Math.max(7, size - 2);
    uiTextFit(w.slice(0, mid).join(" "), c.x + c.w / 2, y - s2 * 0.55, s2, col, "center", max); uiTextFit(w.slice(mid).join(" "), c.x + c.w / 2, y + s2 * 0.55, s2, col, "center", max);
}
// A TILE: A TRANSLUCENT GLOSSY BUTTON (build 2026-11-13x; the owner: "change that item menu to the borders on those on the grid aren't so big maybe make them translucent glossy buttons"): glass tinted
// with the item's colour, the panel showing through it, a sheen over its top half, a hairline edge and a bright rim where the light catches its top; the name on a soft fade at its foot. (Until this build:
// a dark tile with a corner of its colour, a black name bar and a 2 px edge, the chosen one a 9 px glow and a 3 px white frame.)
function _ivTile(c, f) {
    const id = c.id, d = itemDef(id), n = invCount(id), known = invKnown(id), on = id === _invSel, ok = classAllows(d.classes), col = known ? d.col : "#2a3350", s = Math.min(10, c.h * 0.16);
    const nb = Math.max(14, Math.round(c.h * 0.22)), isz = Math.round(Math.min(c.w, c.h) * 0.66), ix = c.x + c.w / 2, iy = c.y + (c.h - nb) * 0.53, lit = known ? (n > 0 ? 1 : 0.5) : 0.3;
    ctx.save();
    _ivPara(c.x, c.y, c.w, c.h, s);
    ctx.fillStyle = "rgba(6,10,24,0.38)"; ctx.fill();   // the glass: dark and see-through, tinted with the item's colour from the top
    const g = ctx.createLinearGradient(0, c.y, 0, c.y + c.h); g.addColorStop(0, _ivRgba(col, (on ? 0.34 : 0.2) * lit)); g.addColorStop(0.6, _ivRgba(col, (on ? 0.12 : 0.06) * lit)); g.addColorStop(1, _ivRgba(col, (on ? 0.08 : 0.03) * lit)); ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    const gl = ctx.createLinearGradient(0, c.y, 0, c.y + c.h * 0.5); gl.addColorStop(0, "rgba(255,255,255," + (on ? 0.24 : 0.15) * (known ? 1 : 0.5) + ")"); gl.addColorStop(1, "rgba(255,255,255,0.015)");   // the sheen
    ctx.fillStyle = gl; ctx.beginPath(); ctx.moveTo(c.x - 4, c.y - 2); ctx.lineTo(c.x + c.w + 4, c.y - 2); ctx.lineTo(c.x + c.w + 4, c.y + c.h * 0.34); ctx.quadraticCurveTo(c.x + c.w * 0.5, c.y + c.h * 0.5, c.x - 4, c.y + c.h * 0.38); ctx.closePath(); ctx.fill();
    if (known) { ctx.save(); if (!n || !ok) ctx.globalAlpha = 0.38; invDrawIcon(id, ix, iy, isz, f); ctx.restore(); }
    else { const sil = _ivSilhouette(id, isz); if (sil) ctx.drawImage(sil, ix - sil.width / 2, iy - sil.height / 2); }
    const ng = ctx.createLinearGradient(0, c.y + c.h - nb - 8, 0, c.y + c.h); ng.addColorStop(0, "rgba(2,4,10,0)"); ng.addColorStop(1, "rgba(2,4,10,0.6)"); ctx.fillStyle = ng; ctx.fillRect(c.x - 2, c.y + c.h - nb - 8, c.w + 4, nb + 8);   // the name's fade
    if (known && !ok) { ctx.fillStyle = "rgba(150,20,10,0.62)"; ctx.fillRect(c.x - 2, c.y + c.h - nb - 12, c.w + 4, 11); uiCaption("LOCKED", c.x + c.w / 2, c.y + c.h - nb - 6, "#ffd0c8", "center", 9); }
    ctx.restore();
    _ivName(known ? d.name : "???", c, nb, known ? (n ? "#ffffff" : "#8a93ab") : "#4f5b7a");
    if (known) uiText("×" + n, c.x + c.w - 8, c.y + Math.max(12, c.h * 0.15), Math.max(12, Math.round(c.h * 0.17)), n ? d.col : "#6d7fa6", "right");
    _ivPara(c.x, c.y, c.w, c.h, s);   // the edge: a hairline of its colour (the chosen one: a soft glow of its colour and a fine white line)
    if (on) { ctx.lineWidth = 5; ctx.globalAlpha = 0.28; ctx.strokeStyle = known ? d.col : UI_TEAL; ctx.stroke(); ctx.globalAlpha = 0.95; ctx.lineWidth = 1.5; ctx.strokeStyle = "#ffffff"; ctx.stroke(); }
    else { ctx.lineWidth = 1; ctx.strokeStyle = col; ctx.globalAlpha = known ? (n ? 0.6 : 0.32) : 0.4; ctx.stroke(); }
    ctx.globalAlpha = known ? (on ? 0.7 : 0.4) : 0.15; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c.x + s + 2, c.y + 1.5); ctx.lineTo(c.x + c.w - 3, c.y + 1.5); ctx.stroke();   // the rim of light along its top
    ctx.globalAlpha = 1; ctx.restore();
}
function _ivStage(L, f) {
    const S = L.stage, id = _invSel, d = id ? itemDef(id) : null, known = !!d && invKnown(id), col = known ? d.col : UI_TEAL, sk = 16, wide = L.wide;
    ctx.save(); _ivPara(S.x, S.y, S.w, S.h, sk); const g = ctx.createLinearGradient(S.x, 0, S.x + S.w, 0); g.addColorStop(0, "#04070f"); g.addColorStop(0.6, "#0b1430"); g.addColorStop(1, "#04070f"); ctx.fillStyle = g; ctx.fill(); ctx.fillStyle = col; ctx.fillRect(S.x + sk, S.y, S.w - sk, 4); ctx.restore();
    const use = L.buttons[0], ins = L.buttons[1];
    if (!d) { uiTextFit("SELECT AN ITEM", S.x + S.w / 2, S.y + S.h / 2 - (wide ? 0 : 20), 22, "#6d7fa6", "center", S.w - 40); return; }
    const isz = wide ? (_invInspect ? 108 : 98) : 66, cx = S.x + (wide ? 50 : 22) + isz / 2, cy = wide ? S.y + S.h / 2 + 2 : S.y + 18 + isz / 2, sway = _invInspect ? Math.sin(f * 0.04) * 5 : 0;
    ctx.save(); const r = ctx.createRadialGradient(cx, cy, 4, cx, cy, isz); r.addColorStop(0, _ivRgba(col, known ? 0.32 : 0.12)); r.addColorStop(1, _ivRgba(col, 0)); ctx.fillStyle = r; ctx.fillRect(cx - isz, cy - isz, isz * 2, isz * 2); ctx.restore();
    if (known) { ctx.save(); ctx.beginPath(); ctx.rect(S.x, S.y, S.w, S.h); ctx.clip(); invDrawIcon(id, cx + sway, cy, isz, f); ctx.restore(); } else { const sil = _ivSilhouette(id, isz); if (sil) ctx.drawImage(sil, cx - sil.width / 2, cy - sil.height / 2); }
    const tx = cx + isz / 2 + (wide ? 34 : 16), tw = (wide ? use.x - 24 : S.x + S.w - 16) - tx;
    if (!known) { uiTextFit("???", tx, S.y + (wide ? 46 : 34), wide ? 40 : 28, "#6d7fa6", "left", tw); uiCaptionFit("NOT FOUND YET: SEARCH THE FACILITY", tx, S.y + (wide ? 84 : 62), "#8aa0c8", "left", 13, tw); }
    else {
        const n = invCount(id), cls = d.classes && d.classes.length ? d.classes.map(className).join(" / ") + " ONLY" : "ANY CLASS", okc = classAllows(d.classes), eq = typeof potionEquipped === "function" && potionEquipped() === d.id;   // (the Sleeping Potion in hand: js/potion.js)
        uiTextFit(d.name, tx, S.y + (wide ? 42 : 32), wide ? 38 : 26, d.col, "left", tw);
        uiCaptionFit(INV_CATS.find(c => c.id === d.cat).label.replace(/S$/, "") + "  ·  " + INV_TYPES[d.type] + "  ·  ×" + n, tx, S.y + (wide ? 76 : 56), "#8aa0c8", "left", 12, tw);
        uiCaptionFit(cls + (eq ? "  ·  EQUIPPED: THE POTION PILL, OR " + (typeof POTION !== "undefined" ? POTION.key.toUpperCase() : "T") + ", THROWS IT" : ""), tx, S.y + (wide ? 96 : 74), okc ? (eq ? "#bcd0ff" : "#9dffb6") : "#ff9c8a", "left", 12, tw);
        const chars = Math.max(14, Math.floor(tw / 8.4)), lines = []; if (_invInspect) { _ivWrap(lines, d.lore, chars); lines.push(""); for (const st of d.stats) lines.push(st); } else _ivWrap(lines, d.desc, chars);
        let y = S.y + (wide ? 120 : 96); const yMax = wide ? S.y + S.h - 12 : use.y - 10;
        for (const l of lines) { if (y > yMax) break; if (l) uiCaptionFit(l, tx, y, /^[A-Z ]{3,}  /.test(l) ? d.col : "#c8d4f0", "left", 13, tw); y += 18; }
    }
    const can = known ? invCanUse(id) : { ok: false, why: "" };
    uiButton(use, known && typeof d.verb === "function" ? d.verb(d) : "USE", known ? d.col : "#3a4566", !!can.ok, wide ? 20 : 17, null, !can.ok);   // (filled with its colour when it can be used)   // (verb: an item whose button is not a use: the potion's EQUIP)
    uiButton(ins, _invInspect ? "BACK" : "INSPECT", UI_ICE, _invInspect, wide ? 20 : 17, null, !known);
    if (known && !can.ok && _invMsg === null) uiCaptionFit(can.why, use.x, use.y - 12, "#ff9c8a", "left", 12, ins.x + ins.w - use.x);
}
function drawInvPanel() {
    if (!invPanelOpen) return;
    const L = _ivLayout(), pc = playerClass(), f = typeof frame !== "undefined" ? frame : 0;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    uiBackdrop(0.62);
    // the roster's ground: a deep wash with faint diagonal streaks, a thin outline
    ctx.save(); ctx.beginPath(); ctx.rect(L.px, L.py, L.pw, L.ph); ctx.clip();
    const bg = ctx.createRadialGradient(L.px + L.pw / 2, L.py + L.ph * 0.4, 20, L.px + L.pw / 2, L.py + L.ph * 0.4, L.pw * 0.75); bg.addColorStop(0, "rgba(20,33,66,0.97)"); bg.addColorStop(1, "rgba(7,11,22,0.98)"); ctx.fillStyle = bg; ctx.fillRect(L.px, L.py, L.pw, L.ph);
    ctx.strokeStyle = "rgba(49,232,255,0.05)"; ctx.lineWidth = 2; for (let x = L.px - L.ph; x < L.px + L.pw; x += 46) { ctx.beginPath(); ctx.moveTo(x, L.py + L.ph); ctx.lineTo(x + L.ph * 0.47, L.py); ctx.stroke(); }
    ctx.restore(); ctx.strokeStyle = _ivRgba(UI_TEAL, 0.55); ctx.lineWidth = 2; ctx.strokeRect(L.px + 1, L.py + 1, L.pw - 2, L.ph - 2);
    // the title band: PACK (white on a teal shadow), the class's line, SWITCH CLASS and CLOSE
    ctx.fillStyle = "#04070f"; ctx.beginPath(); ctx.moveTo(L.px, L.py); ctx.lineTo(L.px + L.pw, L.py); ctx.lineTo(L.px + L.pw - 18, L.py + 62); ctx.lineTo(L.px, L.py + 62); ctx.closePath(); ctx.fill(); ctx.fillStyle = UI_TEAL; ctx.fillRect(L.px, L.py + 60, L.pw - 18, 3);
    uiText("PACK", L.px + L.gut + 3, L.py + 34, L.wide ? 46 : 38, UI_TEAL, "left", false); uiText("PACK", L.px + L.gut, L.py + 31, L.wide ? 46 : 38, "#ffffff", "left");
    if (pc) { const A = L.classAt; uiCaptionFit(pc.name + "  ·  RANK " + classRank(), A.x, A.y, pc.colour, "left", 14, A.w); const pl = classPerkList(); uiCaptionFit(pl.length ? pl.map(q => q.name).join("  ·  ") : "NO PERKS YET: FIND YOUR CLASS'S STATION", A.x, A.y + 18, pl.length ? "#9dffb6" : "#6d7fa6", "left", 11, A.w); }
    uiButton(L.close, "CLOSE", UI_RED, false, 16);
    if (L.swap) uiButton(L.swap, "SWITCH CLASS", pc ? pc.colour : UI_TEAL, false, 15);   // (js/classes.js: every class keeps its own progress)
    for (const t of L.tabs) uiButton(t, t.label, UI_TEAL, t.on, 15);
    for (const c of L.cells) _ivTile(c, f);
    _ivStage(L, f);
    if (_invMsg && _invMsg.until > f) uiTextFit(_invMsg.text, L.stage.x + L.stage.w - 30, L.stage.y - 14, 17, _invMsg.good ? "#9dffb6" : "#ff9c8a", "right", L.pw * 0.6); else if (_invMsg) _invMsg = null;
    ctx.restore();
}
function invOpen() { invPanelOpen = true; if (!_invSel || !invCount(_invSel)) _invSel = invItems("all")[0] || null; _invInspect = false; }
function invClose() { invPanelOpen = false; _invInspect = false; }
function invToggle() { if (invPanelOpen) invClose(); else { if (typeof infoPanelOpen !== "undefined") infoPanelOpen = false; if (typeof settingsPanelOpen !== "undefined") settingsPanelOpen = false; invOpen(); } }
function _handleInvPanelTap(tx, ty) {
    if (!invPanelOpen) return false;
    const L = _ivLayout(), inR = r => !!r && tx >= r.x && tx <= r.x + r.w && ty >= r.y && ty <= r.y + r.h;
    if (inR(L.close) || tx < L.px || tx > L.px + L.pw || ty < L.py || ty > L.py + L.ph) { invClose(); return true; }
    if (L.swap && inR(L.swap)) { if (typeof classSwitchOpen === "function") classSwitchOpen(); return true; }   // the class picker, over the pack (js/classes.js)
    for (const t of L.tabs) if (inR(t)) { _invCat = t.id; const list = _ivRoster(); if (!list.includes(_invSel)) _invSel = list.find(id => invCount(id) > 0) || list.find(invKnown) || null; _invInspect = false; return true; }
    for (const c of L.cells) if (inR(c)) { _invSel = c.id; _invInspect = false; return true; }
    if (_invSel && invKnown(_invSel)) {
        if (inR(L.buttons[1])) { _invInspect = !_invInspect; return true; }
        if (inR(L.buttons[0])) { invUse(_invSel); return true; }   // (the last one used: its tile stays, at ×0)
    }
    return true;
}
// THE PACK BUTTON on the HUD (game.html #btnPack: the bottom-right corner since build 2026-11-09zz; it was in the dock): shown in the facility, its line the count of the kinds of item carried, written only when it changes
// (js/game.js calls the tick each frame, as it does the quests' "!"; a phone shows the count as a badge, data-n)
function invButtonShow(on) { try { const b = document.getElementById("btnPack"); if (b) b.style.display = on ? "" : "none"; } catch (e) {} }
let _ivBadgeN = -1, _ivBadgeEl = null, _ivBadgeBtn = null;
function invBadgeTick() {
    let n = 0; for (const id in playerInv) if (playerInv[id] > 0) n++;
    if (n === _ivBadgeN) return; _ivBadgeN = n;
    try { if (!_ivBadgeEl || !_ivBadgeEl.isConnected) { _ivBadgeEl = document.getElementById("packCount"); _ivBadgeBtn = document.getElementById("btnPack"); }
          if (_ivBadgeEl) _ivBadgeEl.textContent = n + (n === 1 ? " ITEM" : " ITEMS"); if (_ivBadgeBtn && _ivBadgeBtn.setAttribute) _ivBadgeBtn.setAttribute("data-n", String(n)); } catch (e) {}
}
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (!e) return; if ((e.key === "i" || e.key === "I") && typeof facilityPlay !== "undefined" && facilityPlay && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName || ""))) invToggle(); else if (e.key === "Escape" && invPanelOpen && !(typeof classPickerOpen !== "undefined" && classPickerOpen)) invClose(); }); } catch (e) { /* no page (the test sandbox) */ }
