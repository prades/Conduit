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
        use: () => (typeof facilityLampBoost === "function" && facilityLampBoost(3600)) ? { ok: true, msg: "LAMP OVERCHARGED" } : { ok: false, why: "NOT IN THE FACILITY" } },
    mutagen_sample: { id: "mutagen_sample", name: "MUTAGEN SAMPLE", cat: "sample", type: "consumable", stack: 6, col: "#c06bff", icon: "vial", classes: ["mutator"],
        desc: "A vial of unstable DNA. Feed it to a follower to push it up a level.",
        lore: "Cloudy, warm and faintly alive. The Mutator reads it like a letter from a creature that has not been born yet.",
        stats: ["EFFECT  +1 FOLLOWER LEVEL (+2 ONCE SEQUENCED)", "RANGE  8 TILES", "A FORM EVOLVES AT LEVEL " + (typeof EVOLVE_LEVEL === "number" ? EVOLVE_LEVEL : 10)],
        use: () => invFeedFollower() },
    relay_kit: { id: "relay_kit", name: "RELAY KIT", cat: "tool", type: "tool", stack: 1, col: "#ffb347", icon: "kit", classes: null,
        desc: "Splicing tools for a dead relay. Any class can repair with it, slowly, using two power cells.",
        lore: "A grey case of clamps, a soldering stylus and a laminated card of wiring colours. The Technomancer does not need one. Everyone else does.",
        stats: ["EFFECT  LETS YOU REPAIR A RELAY", "COST  2 POWER CELLS, 5 SECONDS", "A TECHNOMANCER NEEDS 1 CELL AND NO KIT", "NOT USED UP"],
        use: () => { const s = typeof stationNearest === "function" ? stationNearest() : null; if (!s || s.kind !== "relay") return { ok: false, why: "USE IT AT A BROKEN RELAY" }; const r = stationUse(s); return r.ok ? { ok: true, msg: r.msg } : { ok: false, why: r.why }; } },
    mech_leg: { id: "mech_leg", name: "MECH LEG", cat: "part", type: "component", stack: 4, col: "#31e8ff", icon: "leg", classes: ["technomancer"],
        desc: "One articulated leg for a spider mech. You need four, and the core.",
        lore: "Titanium and braided cable, jointed twice, still smelling of machine oil. Somebody was building something with long legs.",
        stats: ["NEEDED  4 LEGS AND A CORE", "BUILT AT  THE MECH BAY, SHOW ROOM", "USED UP BY THE BUILD"],
        use: () => ({ ok: false, why: "BUILD IT AT THE MECH BAY IN THE SHOW ROOM" }) },
    mech_core: { id: "mech_core", name: "MECH CORE", cat: "part", type: "component", stack: 1, col: "#31e8ff", icon: "core", classes: ["technomancer"],
        desc: "The brain and reactor of a spider mech. It goes in the middle of four legs.",
        lore: "A hexagonal housing humming faintly through its casing. A label reads: DO NOT DROP. Then, in marker: PLEASE.",
        stats: ["NEEDED  4 LEGS AND A CORE", "BUILT AT  THE MECH BAY, SHOW ROOM", "USED UP BY THE BUILD"],
        use: () => ({ ok: false, why: "BUILD IT AT THE MECH BAY IN THE SHOW ROOM" }) },
    scrap_metal: { id: "scrap_metal", name: "SCRAP METAL", cat: "part", type: "component", stack: 30, col: "#9aa4b4", icon: "scrap", classes: null,
        desc: "Bent plate and torn casing off the things that live in the arena. The Armory's terminal turns it into ammunition and upgrades.",
        lore: "Whatever the arena's creatures are made of, it is mostly good steel. Somebody in the Armory will pay for it in rounds.",
        stats: ["2 SCRAP = 1 AMMO PACK", "UPGRADES AND ASSEMBLES WEAPONS", "AT  THE ARMORY TERMINAL (NEEDS ITS RELAY ONLINE)", "DROPPED BY THE ARENA'S CREATURES"],
        use: () => ({ ok: false, why: "TAKE IT TO THE ARMORY TERMINAL" }) },
    fuel_cell: { id: "fuel_cell", name: "FUEL CELL", cat: "part", type: "component", stack: 6, col: "#5dffb0", icon: "fuel", classes: null,
        desc: "A sealed canister of reactor fuel. A laser rifle loads one by itself when it runs dry: 12 charges.",
        lore: "A glass-and-steel canister with a green glow that does not flicker. The label says THIS SIDE UP and, underneath, in a different hand, YES REALLY.",
        stats: ["LOADED INTO  THE LASER RIFLE", "EACH CELL  12 CHARGES", "FOUND IN  THE COMPUTER LAB, ONCE ITS POWER IS BACK"],
        use: () => ({ ok: false, why: "THE LASER RIFLE LOADS IT BY ITSELF" }) },
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
};
const ITEM_ORDER = ["ammo_pack", "flare", "power_cell", "mutagen_sample", "relay_kit", "mech_leg", "mech_core", "scrap_metal", "fuel_cell", "healing_serum", "specimen_capsule", "rock"];

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
    const put = Math.min(n, invRoom(id)); if (put > 0) { playerInv[id] = invCount(id) + put; if (!_invSel) _invSel = id; }
    return put;
}
function invRemove(id, n) { n = Math.floor(n === undefined ? 1 : n); if (!invHas(id, n)) return false; playerInv[id] -= n; if (playerInv[id] <= 0) { delete playerInv[id]; if (_invSel === id) _invSel = null; } return true; }
function invItems(cat) { return ITEM_ORDER.filter(id => invCount(id) > 0 && (!cat || cat === "all" || itemDef(id).cat === cat)); }
function invReset() { if (typeof classPerks !== "undefined") classPerks = new Set(); if (typeof classReset === "function") classReset(); if (typeof weaponReset === "function") weaponReset(); playerInv = {}; _invSel = null; _invInspect = false; _invMsg = null; invPanelOpen = false; }
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
    kit: (c, x, y, s, col) => {
        c.fillStyle = "#2b2f3a"; c.strokeStyle = col; c.lineWidth = Math.max(2, s * 0.05); c.beginPath(); c.rect(x - s * 0.36, y - s * 0.12, s * 0.72, s * 0.44); c.fill(); c.stroke();
        c.beginPath(); c.moveTo(x - s * 0.14, y - s * 0.12); c.lineTo(x - s * 0.14, y - s * 0.26); c.lineTo(x + s * 0.14, y - s * 0.26); c.lineTo(x + s * 0.14, y - s * 0.12); c.stroke();
        c.fillStyle = col; c.beginPath(); c.moveTo(x + s * 0.04, y - s * 0.02); c.lineTo(x - s * 0.1, y + s * 0.12); c.lineTo(x, y + s * 0.12); c.lineTo(x - s * 0.04, y + s * 0.26); c.lineTo(x + s * 0.12, y + s * 0.08); c.lineTo(x + s * 0.02, y + s * 0.08); c.closePath(); c.fill();
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
function invDrawIcon(id, x, y, s, t) { const d = itemDef(id); if (!d || typeof ctx === "undefined") return; ctx.save(); (INV_ICONS[d.icon] || INV_ICONS.ammo)(ctx, x, y, s, d.col, t || 0); ctx.restore(); }

// ── the window ──
// Wide screens: the items on the left, the item's page on the right. A phone: the items above, the page below.
function _ivLayout() {
    const W = canvas.width, H = canvas.height, wide = W >= 720;
    const pw = Math.min(W - 16, wide ? 900 : 520), px = Math.round((W - pw) / 2), top = typeof uiTopSafe === "function" ? uiTopSafe() : 8, bottom = typeof uiBottomSafe === "function" ? uiBottomSafe() : H - 8;
    const ph = Math.max(300, Math.min(bottom - top, wide ? 560 : 700)), py = Math.max(4, Math.min(top, H - ph - 4)), gut = 22;
    const L = { W, H, wide, px, py, pw, ph, tabs: [], cells: [], buttons: [], close: null, swap: null };
    // SWITCH CLASS (js/classes.js), once there is a class: in the title row when the pack is wide; on a phone a row of its own under the title, and everything below it a row lower
    const swapRow = !!(typeof playerClassKey !== "undefined" && playerClassKey) && !wide;
    if (typeof playerClassKey !== "undefined" && playerClassKey) L.swap = wide ? { x: px + pw - gut - 120 - 10 - 170, y: py + 12, w: 170, h: 38 } : { x: px + pw - gut - 160, y: py + 56, w: 160, h: 36 };
    L.classAt = swapRow ? { x: px + 26, y: py + 70, w: pw - gut - 160 - 36 } : { x: px + 124, y: py + 26, w: wide && L.swap ? L.swap.x - px - 134 : pw - 300 };   // (on a phone the class's line goes in that row, beside the button, out of CLOSE's way)
    const tw = Math.floor((pw - gut * 2 - (INV_CATS.length - 1) * 6) / INV_CATS.length), ty = py + 58 + (swapRow ? 44 : 0);
    INV_CATS.forEach((c, i) => L.tabs.push({ id: c.id, label: c.label, x: px + gut + i * (tw + 6), y: ty, w: tw, h: 38, on: c.id === _invCat }));
    const gy = ty + 50, listW = wide ? Math.floor((pw - gut * 2) * 0.52) : pw - gut * 2, listH = wide ? ph - (gy - py) - gut - 54 : Math.floor((ph - (gy - py)) * 0.36);
    const cell = wide ? 92 : 78, gap = 8, cols = Math.max(1, Math.floor((listW + gap) / (cell + gap)));
    L.list = { x: px + gut, y: gy, w: listW, h: listH };
    invItems(_invCat).forEach((id, i) => L.cells.push({ id, x: px + gut + (i % cols) * (cell + gap), y: gy + Math.floor(i / cols) * (cell + gap), w: cell, h: cell }));
    L.detail = wide ? { x: px + gut + listW + 16, y: gy, w: pw - gut * 2 - listW - 16, h: ph - (gy - py) - gut - 54 } : { x: px + gut, y: gy + listH + 10, w: pw - gut * 2, h: ph - (gy - py) - listH - 10 - gut - 54 };
    const by = py + ph - gut - 44, bw = 150;
    L.buttons = [{ id: "use", x: L.detail.x, y: by, w: Math.min(bw, L.detail.w * 0.46), h: 44 }, { id: "inspect", x: L.detail.x + Math.min(bw, L.detail.w * 0.46) + 8, y: by, w: Math.min(bw, L.detail.w * 0.46), h: 44 }];
    L.close = { x: px + pw - gut - 120, y: py + 12, w: 120, h: 38 };
    return L;
}
function _ivWrap(lines, text, chars) { for (const l of uiWrap(text, chars)) lines.push(l); }
function drawInvPanel() {
    if (!invPanelOpen) return;
    const L = _ivLayout(), pc = playerClass(), col = pc ? pc.colour : UI_TEAL, f = typeof frame !== "undefined" ? frame : 0;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    uiBackdrop(0.6); uiPanel(L.px, L.py, L.pw, L.ph, col);
    uiText("PACK", L.px + 26, L.py + 32, 28, col, "left"); if (pc) { const A = L.classAt; uiCaptionFit(pc.name + "  \u00b7  RANK " + classRank(), A.x, A.y, pc.colour, "left", 14, A.w); const pl = classPerkList(); uiCaptionFit(pl.length ? pl.map(q => q.name).join("  \u00b7  ") : "NO PERKS YET: FIND YOUR CLASS'S STATION", A.x, A.y + 18, pl.length ? "#9dffb6" : "#6d7fa6", "left", 11, A.w); }
    uiButton(L.close, "CLOSE", UI_RED, false, 16);
    if (L.swap) uiButton(L.swap, "SWITCH CLASS", col, false, 15);   // (js/classes.js: every class keeps its own progress)
    for (const t of L.tabs) uiButton(t, t.label, col, t.on, 15);
    // the items
    if (!L.cells.length) { uiTextFit("PACK EMPTY", L.list.x + L.list.w / 2, L.list.y + 50, 24, "#8aa0c8", "center", L.list.w); uiCaptionFit("SEARCH THE FACILITY: THE GLOWING CRATES AND LOCKERS", L.list.x + L.list.w / 2, L.list.y + 84, "#6d7fa6", "center", 13, L.list.w); }
    for (const c of L.cells) {
        const d = itemDef(c.id), ok = classAllows(d.classes), on = c.id === _invSel;
        uiSlab(c.x, c.y, c.w, c.h, on ? "#ffffff" : d.col, false, on ? "#1d2a52" : null, !ok && !on);
        ctx.save(); if (!ok) ctx.globalAlpha = 0.5; invDrawIcon(c.id, c.x + c.w / 2, c.y + c.h * 0.42, c.w * 0.62, f); ctx.restore();
        uiCaptionFit(d.name, c.x + c.w / 2, c.y + c.h - 11, ok ? "#c8d4f0" : "#7a86a6", "center", 11, c.w - 8);
        uiText("×" + invCount(c.id), c.x + c.w - 9, c.y + 15, 15, d.col, "right");
        if (!ok) uiCaption("LOCKED", c.x + 9, c.y + 13, "#ff9c8a", "left", 10);
    }
    // the item's page
    const d = _invSel ? itemDef(_invSel) : null, D = L.detail;
    uiSlab(D.x, D.y, D.w, D.h, "#2a3556", false, "#0b1226");
    if (!d) { uiTextFit("SELECT AN ITEM", D.x + D.w / 2, D.y + D.h / 2, 20, "#6d7fa6", "center", D.w - 20); }
    else {
        const ok = invCanUse(d.id), chars = Math.max(14, Math.floor((D.w - 28) / 8.4)), isz = _invInspect ? 92 : 64;
        const sway = _invInspect ? Math.sin(f * 0.04) * 6 : 0;
        ctx.save(); ctx.beginPath(); ctx.rect(D.x, D.y, D.w, D.h); ctx.clip(); invDrawIcon(d.id, D.x + 14 + isz / 2 + sway, D.y + 14 + isz / 2, isz, f); ctx.restore();
        const tx = D.x + 24 + isz;
        uiTextFit(d.name, tx, D.y + 32, 24, d.col, "left", D.w - isz - 38);
        uiCaption(INV_CATS.find(c => c.id === d.cat).label.replace(/S$/, "") + "  ·  " + INV_TYPES[d.type] + "  ·  ×" + invCount(d.id), tx, D.y + 56, "#8aa0c8", "left", 12);
        const cls = d.classes && d.classes.length ? d.classes.map(className).join(" / ") + " ONLY" : "ANY CLASS", okc = classAllows(d.classes);
        uiCaptionFit(cls, tx, D.y + 76, okc ? "#9dffb6" : "#ff9c8a", "left", 12, D.w - isz - 38);
        const lines = []; let y = D.y + isz + 34;
        if (_invInspect) { _ivWrap(lines, d.lore, chars); lines.push(""); for (const s of d.stats) lines.push(s); } else _ivWrap(lines, d.desc, chars);
        for (const l of lines) { if (y > D.y + D.h - 16) break; if (l) uiCaptionFit(l, D.x + 16, y, /^[A-Z ]{3,}  /.test(l) ? d.col : "#c8d4f0", "left", 13, D.w - 28); y += 19; }
        if (!ok.ok && _invMsg === null) uiCaptionFit(ok.why, D.x + 16, D.y + D.h - 14, "#ff9c8a", "left", 12, D.w - 28);
        const use = L.buttons[0], ins = L.buttons[1];
        uiButton(use, d.type === "tool" ? "USE" : "USE", d.col, false, 18, null, !ok.ok); uiButton(ins, _invInspect ? "BACK" : "INSPECT", UI_ICE, _invInspect, 18);
    }
    if (_invMsg && _invMsg.until > f) { const m = _invMsg, bx = L.px + 26, by = L.py + L.ph - 60; uiTextFit(m.text, L.px + L.pw - 26, by + 22, 17, m.good ? "#9dffb6" : "#ff9c8a", "right", L.pw * 0.5); void bx; } else if (_invMsg) _invMsg = null;
    ctx.restore();
}
function invOpen() { invPanelOpen = true; if (!_invSel || !invCount(_invSel)) _invSel = invItems("all")[0] || null; _invInspect = false; }
function invClose() { invPanelOpen = false; _invInspect = false; }
function invToggle() { if (invPanelOpen) invClose(); else { if (typeof infoPanelOpen !== "undefined") infoPanelOpen = false; if (typeof settingsPanelOpen !== "undefined") settingsPanelOpen = false; invOpen(); } }
function _handleInvPanelTap(tx, ty) {
    if (!invPanelOpen) return false;
    const L = _ivLayout(), inR = r => tx >= r.x && tx <= r.x + r.w && ty >= r.y && ty <= r.y + r.h;
    if (inR(L.close) || tx < L.px || tx > L.px + L.pw || ty < L.py || ty > L.py + L.ph) { invClose(); return true; }
    if (L.swap && inR(L.swap)) { if (typeof classSwitchOpen === "function") classSwitchOpen(); return true; }   // the class picker, over the pack (js/classes.js)
    for (const t of L.tabs) if (inR(t)) { _invCat = t.id; const list = invItems(_invCat); if (!list.includes(_invSel)) _invSel = list[0] || null; return true; }
    for (const c of L.cells) if (inR(c)) { _invSel = c.id; _invInspect = false; return true; }
    if (_invSel) {
        if (inR(L.buttons[1])) { _invInspect = !_invInspect; return true; }
        if (inR(L.buttons[0])) { invUse(_invSel); if (!invCount(_invSel)) { _invSel = invItems(_invCat)[0] || null; _invInspect = false; } return true; }
    }
    return true;
}
function invButtonShow(on) { try { const b = document.getElementById("btnPack"); if (b) b.style.display = on ? "" : "none"; } catch (e) {} }
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (!e) return; if ((e.key === "i" || e.key === "I") && typeof facilityPlay !== "undefined" && facilityPlay && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName || ""))) invToggle(); else if (e.key === "Escape" && invPanelOpen && !(typeof classPickerOpen !== "undefined" && classPickerOpen)) invClose(); }); } catch (e) { /* no page (the test sandbox) */ }
