// ─────────────────────────────────────────────────────────
//  THE INFO PANEL — an index of everything, with a description of each (layout style)
// ─────────────────────────────────────────────────────────
// REPORTED: "You can make the info tab work again with the new menu. Make it actual index of everything and give it like a description."
// The long-press ring's INFO opens this. It has three kinds of page, all drawn with the UI kit (js/uikit.js):
//   the READOUT   (infoPanelPage null)   what you pressed — its live numbers, then a button to read about its kind
//   the INDEX     (infoPanelPage 'codex') six tabs of everything in the game, one slab per entry
//   an ENTRY      ('e:<id>')              a description, then its numbers (read off the game's own constants, so it cannot drift)
//   the old codex pages (an element id, 'rules', 'infest', 'combos', 'generator') are still here, re-set in the same style.
// A page taller than the panel is split into pages (the middle button turns them): there is no scrolling to find.
// The press hands in what it hit: a follower, an enemy or a nest as well as the tile (infoPanelSubject).

const INFO_CATS = [
    { id: "build",    label: "BUILD",    col: "#ffcc44", blurb: "Everything you can place. Turn BUILD on, then long-press a tile or one of your pylons." },
    { id: "power",    label: "POWER",    col: "#ffd34d", blurb: "Nothing you build works without power. It starts in a nest and reaches your pylons through the wall." },
    { id: "allies",   label: "ALLIES",   col: "#7dffb5", blurb: "Your squad, your clones, and the work they do." },
    { id: "foes",     label: "ENEMIES",  col: "#ff7766", blurb: "The things that come out of the nests." },
    { id: "elements", label: "ELEMENTS", col: "#19e6c1", blurb: "Six elements. Each one colours a follower, a pylon and a zone effect." },
    { id: "rules",    label: "RULES",    col: "#8fe3ff", blurb: "How the pieces fit together." },
];

const _ELS = (ids) => ids.map(i => { const e = ELEMENTS.find(x => x.id === i); return e ? e.label.toUpperCase() : i.toUpperCase(); }).join(" · ");

// Every entry: { id, cat, name, col, sub (one line, shown on its slab), text: [paragraphs], rows: [[label, value, colour?]] }.
// A function, so the numbers are read from the constants when it is opened (files loaded after this one are not needed at load).
function infoEntries() {
    const sec = f => +(f / 60).toFixed(2) + " s";
    const E = [];
    const add = (id, cat, name, col, sub, text, rows) => E.push({ id, cat, name, col, sub, text, rows: rows || [] });

    // ── BUILD ──
    add("turret", "build", "ATTACK TURRET", "#ff7755", "Shoots enemies on its own",
        ["A pylon set to ATTACK mode. It fires at any enemy in range without being told, so long as it has power: a live cell of its zone's wall power unit within " + BATTERY_SUPPLY_RANGE + " tiles.",
         "Its element decides what its rounds do and how a network of that element helps it. Long-press it to CONVERT it to a wave pylon of the same element, or to buy MK II.",
         "Four turrets in a 2×2 square fuse into an ULTRA."],
        [["REACH", TURRET_RANGE + " tiles"], ["ROUND", "one every " + sec(TURRET_FIRE_FRAMES)], ["NETWORK", "+" + Math.round(TURRET_TIER_BONUS * 100) + "% PER TIER"], ["BUILD", PYLON_BUILD_COST + " ◆, then UPGRADE it"]]);
    add("wave", "build", "WAVE PYLON", "#c08cff", "Support or disruption zones",
        ["A pylon set to WAVE mode does not shoot. It links to pylons of the same element within 3 tiles and fills the line between them with a zone effect. It wakes only when a unit it works on is near.",
         "SUPPORT pylons help your side. DISRUPTION pylons hit the enemy. Which one you get is decided by the element, so the element picker only offers the ones that fit."],
        [["SUPPORT", _ELS(WAVE_SUPPORT_ELEMENTS), "#7fffb0"], ["DISRUPTION", _ELS(ELEMENTS.map(e => e.id).filter(i => !WAVE_SUPPORT_ELEMENTS.includes(i))), "#c08cff"], ["LINKS", "same element, 3 tiles"]]);
    add("mk2", "build", "MK II", "#ffe733", "A better turret or wave pylon",
        ["Buy it on one of your own turrets or wave pylons from the TOP of the long-press ring (with BUILD off). It keeps everything the pylon had and adds a stronger body and stronger output.",
         "It needs the pylon's element network to be at least tier I, and the ring says why when it cannot be bought."],
        [["PRICE", MK2_COST + " ◆"], ["OUTPUT", "×" + STATUS_MULT_MK2 + " (rebuilt pylon ×" + STATUS_MULT_UPGRADED + ")"], ["HEALTH", "×" + MK2_HP_MULT], ["NEEDS", "tier " + ["", "I", "II", "III"][MK2_MIN_TIER] + " network"]]);
    add("ultra", "build", "ULTRA TURRET", "#ff4a1c", "Four turrets fused into one",
        ["Put four finished attack turrets in a 2×2 square and they fuse by themselves. One gun fires for all four: their rounds added together, bigger, further, and bursting on the target.",
         "Lose any of the four (broken, taken, converted) and the rest are four ordinary turrets again. Your squad walks straight through it; enemies cannot stand on its core.",
         "It only fuses where the element's network is tier " + ["", "I", "II", "III"][ULTRA_MIN_TIER] + " or better."],
        [["DAMAGE", "×" + ULTRA_DAMAGE_BONUS + " the four together"], ["REACH", "+" + ULTRA_RANGE_BONUS + " tiles"], ["BURST", ULTRA_SPLASH + " tiles, " + Math.round(ULTRA_SPLASH_SHARE * 100) + "% damage"], ["NEEDS", "tier " + ["", "I", "II", "III"][ULTRA_MIN_TIER] + " network"]]);
    add("modules", "build", "MODULES", "#66ccff", "Powered structures anywhere",
        ["Placed from the build window's MODULES tab on any free floor tile the grid reaches. A module works only while it has power, and covers the ground around it. Build as many as you like; demolishing one returns " + Math.round(MODULE_REFUND * 100) + "%."]
            .concat(MODULE_IDS.map(k => MODULE_DEFS[k].label + ": " + MODULE_DEFS[k].note)),
        MODULE_IDS.map(k => [MODULE_DEFS[k].label, MODULE_DEFS[k].cost + " ◆", MODULE_DEFS[k].colour]));
    add("kits", "build", "LAYOUT KITS", "#19e6c1", "A whole layout in one tap",
        ["In the build window's KITS tab, a kit places a whole layout of turrets and wave pylons in one go. You can move the ghost first, or snap it to the nest.",
         "A kit says what power unit tier it needs (\"BOOT THE POWER UNIT\" or \"UPGRADE IT\"), and never places a piece the unit cannot reach."],
        [["KITS", KITS.length]]);
    add("demolish", "build", "DESTROY", "#ff4a1c", "Take a pylon down for shards",
        ["With BUILD on, long-press one of your own pylons and pick DESTROY (the bottom of the ring). The pylon goes and you get shards back. The power unit's cells cannot be destroyed."],
        [["REFUND", DEMOLISH_REFUND + " ◆"]]);

    // ── POWER ──
    add("unit", "power", "WALL POWER UNIT", "#ffd34d", "Each zone's generator",
        ["Every zone's back wall carries one power unit: six cells and a machine. Tap the machine (or long-press it) to open its panel. The cells are real pylons, and together they power everything in the zone.",
         "BOOT it once you hold the zone's nest. UPGRADE adds two cells a time. RECONFIGURE changes its element. A cell that is wrecked goes dark and the unit loses a tier until it is mended.",
         "There are no loose batteries, generators or connectors any more: this is all of them."],
        [["BOOT", (2 * PYLON_BUILD_COST) + " ◆, needs the nest"], ["TIER I", "2 cells"], ["TIER II", "4 cells"], ["TIER III", "6 cells"], ["RECONFIGURE", PYLON_BUILD_COST + " ◆"], ["FEEDS", "pylons within " + BATTERY_SUPPLY_RANGE + " tiles"]]);
    add("cells", "power", "CELLS & REPAIR", "#ff6a4a", "Hunters bash them; mend them",
        ["Enemy hunters walk to the wall and bash the cells. A cell at no health is WRECKED: dark, out of the bank. A blow also splashes onto the cells beside it in the same segment.",
         "Cells heal slowly by themselves once left alone, an ANT clone on worker duty rebuilds them, or you can pay at the unit's panel."],
        [["CELL HEALTH", WALL_CELL_HP + " HP"], ["SPLASH", Math.round(WALL_SPLASH * 100) + "% to its segment"], ["REPAIR", WALL_REPAIR_COST + " ◆ a cell"]]);
    add("nest", "power", "NESTS", NEST_COLOUR_CONTROLLED, "Hold one to power its zone",
        ["A hostile nest hatches enemies. Stand in front of it to HACK it; once it is yours it stops hatching and becomes the zone's power source. Its energy pool refills slowly and your pylons and modules draw on it.",
         "A held nest can be switched off and on in BUILD mode, and from out of BUILD mode its ring teleports you between your front nest and home.",
         "Deeper nests hold more energy."],
        [["HACK", "stand there " + (NEST_HACK_FRAMES / 60) + " s"], ["POOL", NEST_ENERGY_BASE + " (zone 0), +" + NEST_ENERGY_BASE * NEST_ENERGY_ZONE + " a zone"], ["HOME", NEST_ENERGY_HOME], ["REGEN", (NEST_ENERGY_REGEN * 60).toFixed(1) + " / s"]]);
    add("overcharge", "power", "OVERCHARGE", "#ffe733", "A surge from a held nest",
        ["Long-press a nest you hold (BUILD off) and pick OVERCHARGE from the top of the ring. It spends part of the grid for a short surge: everything on it fires much faster."],
        [["COST", Math.round(OVERCHARGE_COST * 100) + "% of the grid"], ["NEEDS", Math.round(OVERCHARGE_MIN_FILL * 100) + "% full"], ["LASTS", sec(OVERCHARGE_FRAMES)], ["FIRE RATE", "×" + OVERCHARGE_FIRE_MULT], ["COOLDOWN", sec(OVERCHARGE_COOLDOWN)]]);

    // ── ALLIES ──
    add("squad", "allies", "YOUR SQUAD", "#7dffb5", "Followers, in six elements",
        ["Followers come from the Crystal. Each has an element, a role (BRAWLER closes in, MAGE fires from range, TECHNICIAN holds a post), a level and a set of stats, shown over its health bar.",
         "Long-press one to send it TO WORK or back TO LINE, or to RE-ROLL it at the Crystal. Double-tap one to fire its ultimate once the bar is full.",
         "The six elements follow two triangles: fire > flux > toxic > fire, and electric > core > ice > electric."],
        []);
    add("clones", "allies", "CLONES", "#19e6c1", "Bought from the Clone Bay",
        ["Summon a clone in the Clone Bay for shards and the DNA you have collected from that kind and class of enemy (at most " + MAX_CLONES + " at once). It is far tougher than a follower and fights beside you; when it falls it comes back after a while.",
         "A clone can work too: an ANT clone on worker duty goes out and builds and repairs pylons and wall cells."],
        [["POWER", "×" + CLONE_POWER_MULT], ["HEALTH", "×" + CLONE_HEALTH_MULT], ["COMES BACK", "after " + sec(CLONE_RESPAWN_FRAMES)]]);
    add("jobs", "allies", "WORK DUTY", "#8fe3ff", "What each element does at work",
        ["A follower on WORK duty stops fighting and runs the mass chain: mass lumps are neutralised, hauled and paid out in shards."]
            .concat(Object.keys(WORK_INFO).map(k => k.toUpperCase() + " — " + WORK_INFO[k].label + ": " + WORK_INFO[k].text)),
        []);

    // ── ENEMIES ──
    const SP = (k) => SPECIES[k] && SPECIES[k].scout;
    add("species", "foes", "THE PREDATORS", "#ff7766", "Six kinds, by depth",
        ["Predators come in six kinds. They get stronger and tougher the deeper the zone, and each of them comes as a scout, a striker or a tank. A boss is rarer and much heavier.",
         "ANTS are the weakest. BEETLES haul charged mass to the nest. SCORPIONS, SPIDERS, MANTISES and MOTHS from the striker class up also attack at range from the rear."],
        Object.keys(SPECIES).map(k => [k.toUpperCase(), SP(k) ? "scout " + SP(k).health + " HP · " + SP(k).power + " pwr" : "", SPECIES[k].color]));
    add("hunter", "foes", "HUNTERS", "#f77", "They chew your pylons over",
        ["About one predator in four is a hunter. With no alarm up it walks to your nearest pylon and starts converting it to its side; if the pylon is a power cell it bashes it instead.",
         "A bar shows a conversion under way. Interrupt the hunter and the pylon recovers. A pylon already turned shows red: long-press it and pick RECLAIM, and a crew rebuilds it."],
        [["CONVERSION", (1 / INFEST_RATE / 60).toFixed(0) + " s of contact"]]);

    return E;
}

function infoEntry(id) { return infoEntries().find(e => e.id === id) || null; }

// What a pressed thing is: the entry that describes its kind.
function infoEntryForSubject(sub, tile) {
    sub = sub || {};
    if (sub.follower) return sub.follower.isClone ? "clones" : "squad";
    if (sub.enemy) return "species";
    const t = (sub.nest && sub.nest.nest) ? sub.nest : tile;
    if (t && t.nest && !(typeof isHomePortal === "function" && isHomePortal(t))) return "nest";
    if (t && t.nest) return "nest";
    if (t && t.pillar && !t.destroyed) {
        if (typeof isWallUnitTile === "function" && isWallUnitTile(t)) return "cells";
        if (t.pillarTeam === "red") return "hunter";
        if ((t.mk || 0) >= 2) return "mk2";
        return t.waveMode ? "wave" : "turret";
    }
    return null;
}

// ─────────────────────────────────────────────────────────
//  PAGES → ITEMS
// ─────────────────────────────────────────────────────────
// An item is { k: 'head' | 'text' | 'pair' | 'nav' | 'gap' | 'line', ... }; its height is _IP_H[k].
const _IP_H = { head: 36, text: 21, pair: 26, nav: 56, gap: 12, line: 10 };
let _infoCat = "build";
let _infoPageNo = 0;

function _ipWrapItems(text, chars, col) { return codexWrap(text, chars).map(l => ({ k: "text", t: l, c: col })); }

// The old codex pages and their rows (codex.js: {h}, {t}, [label, value, colour, nav], null) in the new item form.
function _ipRowsToItems(rows, chars) {
    const out = [];
    rows.forEach(r => {
        if (r === null) out.push({ k: "line" });
        else if (Array.isArray(r)) {
            if (r[3] && (r[3].codexElement || r[3].codexPage)) out.push({ k: "nav", t: r[0], sub: r[1], c: r[2], page: r[3].codexElement || r[3].codexPage });
            else out.push({ k: "pair", a: r[0], b: String(r[1]), c: r[2] });
        } else if (r.h !== undefined) out.push({ k: "head", t: r.h, c: r.c });
        else _ipWrapItems(r.t, chars, r.c).forEach(i => out.push(i));
    });
    return out;
}

function _ipEntryItems(e, chars) {
    const out = [{ k: "head", t: e.name, c: e.col }, { k: "text", t: e.sub.toUpperCase(), c: "#7f93bd" }, { k: "gap" }];
    e.text.forEach(p => { _ipWrapItems(p, chars, "#c8d4f0").forEach(i => out.push(i)); out.push({ k: "gap" }); });
    if (e.rows.length) { out.push({ k: "line" }); e.rows.forEach(r => out.push({ k: "pair", a: r[0], b: String(r[1]), c: r[2] })); }
    return out;
}

function _ipIndexItems(chars) {
    const cat = INFO_CATS.find(c => c.id === _infoCat) || INFO_CATS[0];
    const out = _ipWrapItems(cat.blurb, chars, "#8aa0c8");
    out.push({ k: "gap" });
    if (cat.id === "elements") {
        ELEMENTS.forEach(el => { const en = CODEX_ELEMENTS[el.id]; if (en) out.push({ k: "nav", t: el.label.toUpperCase(), sub: en.role, c: el.color, page: el.id }); });
        out.push({ k: "nav", t: "COMBOS", sub: (typeof comboDiscovered !== "undefined" ? comboDiscovered.size : 0) + " / 15 FOUND", c: "#ffe066", page: "combos" });
    } else if (cat.id === "rules") {
        out.push({ k: "nav", t: "HOW PYLONS WORK", sub: "MODES, TIERS, SEASONING", c: cat.col, page: "rules" });
        out.push({ k: "nav", t: "INFESTATION", sub: "WHAT HUNTERS DO", c: "#f77", page: "infest" });
    } else {
        infoEntries().filter(e => e.cat === cat.id).forEach(e => out.push({ k: "nav", t: e.name, sub: e.sub, c: e.col, page: "e:" + e.id }));
    }
    return out;
}

// The readout of whatever was pressed: live numbers, then a way into its entry.
function _ipReadout(chars) {
    const S = infoPanelSubject || {}, tile = infoPanelTarget;
    const out = [], P = (a, b, c) => out.push({ k: "pair", a, b: String(b), c });
    let title = "NOTHING HERE", col = UI_TEAL;
    const f = S.follower || (!S.enemy && !S.nest && tile ? [...followers, ...actors.filter(a => a.isClone)].filter(a => !a.dead && Math.hypot(a.x - tile.x, a.y - tile.y) < 3)[0] : null);
    const nest = S.nest || (tile && tile.nest ? tile : null);
    if (f) {
        const el = ELEMENTS.find(e => e.id === f.element);
        title = (typeof unitTypeLabel === "function" ? unitTypeLabel(f) : (f.speciesName || "UNIT").toUpperCase()); col = el ? el.color : UI_TEAL;
        const lv = f.level, xpNext = Number.isFinite(lv) && lv < LEVEL_CAP ? Math.max(0, Math.ceil(xpForLevel(lv + 1) - (f.xp || 0))) : 0;
        if (Number.isFinite(lv)) P("LEVEL", lv + (lv < LEVEL_CAP ? "  ·  " + xpNext + " XP TO NEXT" : "  ·  MAX"), UI_GOLD);
        P("ELEMENT", (el ? el.label : f.element || "?").toUpperCase(), col);
        P("PERSONALITY", (f.personality || "—").toUpperCase());
        P("HP", Math.ceil(f.health) + " / " + f.maxHealth, "#7dffb5");
        P("SPEED", ((f.moveSpeed || 0) * 1000).toFixed(1) + "‰");
        if (f.stats) { P("ATK / DEF", (f.stats.attack || 0).toFixed(0) + " / " + (f.stats.defense || 0).toFixed(0), "#ff8a7a"); P("SP.ATK / ACC", (f.stats.specialAttack || 0).toFixed(0) + " / " + (f.stats.accuracy || 0).toFixed(0), "#d8a0ff"); P("WILL", (f.stats.will || 0).toFixed(0)); }
        else P("ATK / DEF", (f.power || 0).toFixed(0) + " / " + (f.def || 0).toFixed(0), "#ff8a7a");
        out.push({ k: "line" });
        const ct = f.combatTrait ? (COMBAT_TRAITS[f.combatTrait]?.name || f.combatTrait) : "—", nt = f.naturalTrait ? (NATURAL_TRAITS[f.naturalTrait]?.name || f.naturalTrait) : "—", pk = f.perk ? (PERKS[f.perk]?.name || f.perk) : "—";
        P("COMBAT", ct, "#ff8a7a"); P("NATURAL", nt, "#9cff9c"); P("PERK", pk, "#9ca8ff");
    } else if (S.enemy && !S.enemy.dead) {
        const e = S.enemy, el = ELEMENTS.find(x => x.id === e.element);
        title = (typeof unitTypeLabel === "function" ? unitTypeLabel(e) : "ENEMY") || "ENEMY"; col = el ? el.color : UI_RED;
        if (el) P("ELEMENT", el.label.toUpperCase(), el.color);
        P("HP", Math.ceil(e.health) + " / " + e.maxHealth, "#ff8a7a");
        P("POWER", (e.power || 0).toFixed(0));
        P("SPEED", ((e.moveSpeed || 0) * 1000).toFixed(1) + "‰");
    } else if (nest) {
        const home = typeof isHomePortal === "function" && isHomePortal(nest), held = nestIsPowerSource(nest);
        title = home ? "THE CRYSTAL PORTAL" : "NEST · ZONE " + (Number.isFinite(nest.nestZone) ? nest.nestZone : "?"); col = held ? NEST_COLOUR_CONTROLLED : NEST_COLOUR_HOSTILE;
        P("STATE", home ? "HOME" : held ? "HELD — YOURS" : "HOSTILE — HACK IT", col);
        if (held) { P("ENERGY", Math.round(nestEnergy(nest)) + " / " + Math.round(nestEnergyMax(nest)), UI_GOLD); if (nest.powerOff) P("POWER", "SWITCHED OFF", "#ff8a7a"); }
        else P("HEALTH", Math.max(0, Math.ceil(nest.nestHealth)) + " / " + nest.nestMaxHealth, "#ff8a7a");
    } else if (tile && tile.pillar && !tile.destroyed) {
        const el = ELEMENTS.find(e => e.id === tile.attackModeElement), ally = tile.pillarTeam === "green";
        const unitCell = typeof isWallUnitTile === "function" && isWallUnitTile(tile);
        title = unitCell ? "POWER UNIT CELL" : tile.attackMode ? "ATTACK TURRET" : tile.waveMode ? waveRoleLabel(tile.attackModeElement) + " PYLON" : "DORMANT PYLON"; col = el ? el.color : UI_TEAL;
        if ((tile.mk || 0) >= 2) title = "MK II · " + title;
        P("TEAM", ally ? "ALLY" : "ENEMY", ally ? "#7dffb5" : "#ff6655");
        P("ELEMENT", el ? el.label.toUpperCase() : "NONE", el ? el.color : "#778");
        P("MODE", tile.attackMode ? "ATTACK" : tile.waveMode ? waveRoleLabel(tile.attackModeElement) + (tile.waveAwake === false ? " (STANDBY)" : "") : "DORMANT", UI_GOLD);
        P("HP", Math.ceil(tile.health) + " / " + tile.maxHealth, "#7dffb5");
        P("STATUS", tile.constructing ? "BUILDING" : tile.reconstructing ? "REPAIRING" : "ACTIVE");
        if (typeof pylonPowerState === "function") { const ps = pylonPowerState(tile); P("POWER", ps.text, ps.colour); }
        if (el) { const tier = (typeof networkStrength !== "undefined" && networkStrength[el.id]) || 0; P("NETWORK", tier ? "TIER " + ["", "I", "II", "III"][tier] : "NONE", el.color); }
    } else out.push({ k: "text", t: "Nothing you can read about is here. Long-press a pylon, a nest, a unit or an enemy.", c: "#8aa0c8" });
    // Your own turret or wave pylon: MK II and CONVERT live here now (they were on the long-press ring).
    if (tile && tile.pillar && !tile.destroyed && tile.pillarTeam === "green" && !nest && !f && !S.enemy) {
        if (typeof mk2Eligible === "function" && mk2Eligible(tile)) { const why = mk2Blocker(tile); out.push({ k: "nav", t: tile.mk >= 2 ? "MK II \u2713" : "BUY MK II  " + MK2_COST + "\u25c6", sub: why || "STRONGER BODY AND OUTPUT", c: UI_GOLD, act: "mk2", dim: !!why }); }
        if ((tile.attackMode || tile.waveMode) && !isRelayPylon(tile)) out.push({ k: "nav", t: "CONVERT", sub: "TURRET \u21c4 WAVE PYLON, KEEPS ITS ELEMENT", c: UI_VIOLET, act: "convert" });
    }
    const eid = infoEntryForSubject({ follower: f, enemy: S.enemy, nest }, tile);
    out.push({ k: "gap" });
    if (eid) { const e = infoEntry(eid); if (e) out.push({ k: "nav", t: "ABOUT: " + e.name, sub: e.sub, c: e.col, page: "e:" + eid }); }
    const elId = tile && tile.pillar && !tile.destroyed ? tile.attackModeElement : f && f.element;
    const el2 = elId && ELEMENTS.find(e => e.id === elId);
    if (el2 && CODEX_ELEMENTS[elId]) out.push({ k: "nav", t: el2.label.toUpperCase() + " NETWORK", sub: CODEX_ELEMENTS[elId].role, c: el2.color, page: elId });
    return { title, col, items: out };
}

// Which page we are on: { title, col, items, back (label|null), tabs (bool) }.
function _ipPage(chars) {
    const p = infoPanelPage;
    if (p === "codex") return { title: "INDEX", col: UI_TEAL, items: _ipIndexItems(chars), back: infoPanelTarget || infoPanelSubject ? "‹ BACK" : null, tabs: true };
    const legacy = { rules: ["HOW PYLONS WORK", codexRulesRows], infest: ["INFESTATION", codexInfestRows], generator: ["GENERATOR", codexGeneratorRows], combos: ["COMBOS", codexComboRows] };
    if (typeof p === "string" && p.slice(0, 2) === "e:") {
        const e = infoEntry(p.slice(2));
        if (e) return { title: INFO_CATS.find(c => c.id === e.cat).label, col: e.col, items: _ipEntryItems(e, chars), back: "‹ INDEX" };
    }
    if (p && legacy[p]) return { title: legacy[p][0], col: UI_TEAL, items: _ipRowsToItems(legacy[p][1](chars), chars), back: "‹ INDEX" };
    if (p && CODEX_ELEMENTS[p]) {
        const el = ELEMENTS.find(e => e.id === p);
        return { title: el.label.toUpperCase(), col: el.color, items: _ipRowsToItems(codexElementRows(p, chars), chars), back: "‹ INDEX" };
    }
    const r = _ipReadout(chars);
    return { title: r.title, col: r.col, items: r.items, back: "INDEX ›" };
}

// ─────────────────────────────────────────────────────────
//  LAYOUT (shared by the drawing and the taps)
// ─────────────────────────────────────────────────────────
function _ipLayout() {
    const W = canvas.width, H = canvas.height;
    const pw = Math.min(W - 16, 520), px = Math.round((W - pw) / 2);
    const top = typeof uiTopSafe === "function" ? uiTopSafe() : 8, bottom = typeof uiBottomSafe === "function" ? uiBottomSafe() : H - 8;
    const ph = Math.max(280, Math.min(bottom - top, 680)), py = Math.max(4, Math.min(top, H - ph - 4));
    const gut = 26, ix = px + gut, iw = pw - gut * 2;
    const chars = Math.max(20, Math.floor(iw / 8.4));
    const pg = _ipPage(chars);
    const L = { px, py, pw, ph, ix, iw, chars, title: pg.title, col: pg.col, tabs: [], buttons: [], placed: [], page: 0, pages: 1 };
    let y0 = py + 60;
    if (pg.tabs) {
        const tw = Math.floor((iw - 2 * 6) / 3), th = 40;
        INFO_CATS.forEach((c, i) => L.tabs.push({ id: c.id, label: c.label, col: c.col, x: ix + (i % 3) * (tw + 6), y: y0 + Math.floor(i / 3) * (th + 6), w: tw, h: th, on: c.id === _infoCat }));
        y0 += 2 * (th + 6) + 4;
    }
    const footY = py + ph - 62, y1 = footY - 8;
    // split the items into pages that fit
    const pages = [[]]; let used = 0;
    for (const it of pg.items) {
        const h = _IP_H[it.k];
        if (used + h > y1 - y0 && pages[pages.length - 1].length) { pages.push([]); used = 0; }
        pages[pages.length - 1].push(it); used += h;
    }
    L.pages = pages.length; L.page = Math.max(0, Math.min(_infoPageNo, pages.length - 1));
    let y = y0;
    for (const it of pages[L.page]) { L.placed.push({ it, y, h: _IP_H[it.k] }); y += _IP_H[it.k]; }
    // buttons
    const names = []; if (pg.back) names.push({ id: "back", label: pg.back, col: UI_TEAL }); if (L.pages > 1) names.push({ id: "page", label: (L.page + 1) + " / " + L.pages + "  ▼", col: UI_ICE }); names.push({ id: "close", label: "CLOSE", col: UI_RED });
    const bw = Math.floor((iw - (names.length - 1) * 8) / names.length);
    names.forEach((b, i) => { b.x = ix + i * (bw + 8); b.y = footY; b.w = bw; b.h = 46; L.buttons.push(b); });
    return L;
}

function _ipGo(page) {
    infoPanelPage = page; _infoPageNo = 0;
    if (typeof page === "string" && page.slice(0, 2) === "e:") { const e = infoEntry(page.slice(2)); if (e) _infoCat = e.cat; }
    else if (page && typeof CODEX_ELEMENTS !== "undefined" && CODEX_ELEMENTS[page]) _infoCat = "elements";
    else if (page === "combos") _infoCat = "elements";
    else if (page === "rules" || page === "infest" || page === "generator") _infoCat = "rules";
}

function drawInfoPanel() {
    if (!infoPanelOpen) return;
    const L = _ipLayout();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    uiBackdrop(0.55);
    uiPanel(L.px, L.py, L.pw, L.ph, L.col);
    uiTextFit(L.title, L.px + L.pw / 2, L.py + 32, 28, L.col, "center", L.pw - 70);
    ctx.fillStyle = L.col; ctx.globalAlpha = 0.35; ctx.fillRect(L.ix, L.py + 54, L.iw, 2); ctx.globalAlpha = 1;
    for (const t of L.tabs) uiButton(t, t.label, t.col, t.on, 15);
    for (const p of L.placed) {
        const it = p.it, cy = p.y + p.h / 2;
        if (it.k === "head") uiTextFit(it.t, L.ix, cy, 21, it.c || UI_TEAL, "left", L.iw);
        else if (it.k === "text") uiCaptionFit(it.t, L.ix, cy, it.c || "#c8d4f0", "left", 14, L.iw);
        else if (it.k === "pair") {
            uiCaption(it.a, L.ix, cy, "#7f93bd", "left", 13);
            uiCaptionFit(it.b, L.ix + L.iw, cy, it.c || "#fff", "right", 14, L.iw - it.a.length * 8 - 12);
        } else if (it.k === "nav") {
            const r = { x: L.ix, y: p.y + 3, w: L.iw, h: p.h - 6 };
            uiSlab(r.x, r.y, r.w, r.h, it.c || UI_TEAL, false, null, it.dim);
            uiTextFit(it.t, r.x + 18, r.y + r.h * 0.36, 19, "#fff", "left", r.w - 60);
            if (it.sub) uiCaptionFit(String(it.sub).toUpperCase(), r.x + 18, r.y + r.h * 0.74, "#8aa0c8", "left", 12, r.w - 60);
            uiText("›", r.x + r.w - 22, r.y + r.h / 2, 24, it.c || UI_TEAL, "center");
        } else if (it.k === "line") { ctx.fillStyle = "#2a3556"; ctx.fillRect(L.ix, cy, L.iw, 1); }
    }
    for (const b of L.buttons) uiButton(b, b.label, b.col, false, 17);
    ctx.restore();
}

function _handleInfoPanelTap(tx, ty) {
    if (!infoPanelOpen) return false;
    const L = _ipLayout();
    const inR = r => tx >= r.x && tx <= r.x + r.w && ty >= r.y && ty <= r.y + r.h;
    if (tx < L.px || tx > L.px + L.pw || ty < L.py || ty > L.py + L.ph) { closeInfoPanel(); return true; }
    for (const b of L.buttons) if (inR(b)) {
        if (b.id === "close") closeInfoPanel();
        else if (b.id === "page") _infoPageNo = (L.page + 1) % L.pages;
        else if (infoPanelPage === "codex") _ipGo(null);
        else if (!infoPanelPage) _ipGo("codex");
        else _ipGo("codex");
        return true;
    }
    for (const t of L.tabs) if (inR(t)) { _infoCat = t.id; _infoPageNo = 0; return true; }
    for (const p of L.placed) if (p.it.k === "nav" && inR({ x: L.ix, y: p.y, w: L.iw, h: p.h })) {
        if (p.it.act) { const t = infoPanelTarget; if (p.it.act === "mk2") { if (!p.it.dim) { closeInfoPanel(); upgradeToMk2(t); } else upgradeToMk2(t); } else if (p.it.act === "convert") { closeInfoPanel(); openElementPicker("convert", t); } return true; }
        _ipGo(p.it.page); return true;
    }
    return true;
}
