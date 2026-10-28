// ─────────────────────────────────────────────────────────
//  THE INFO PANEL — an index of everything, with a description of each (layout style)
// ─────────────────────────────────────────────────────────
// REPORTED: "You can make the info tab work again with the new menu. Make it actual index of everything and give it like a description."
// The long-press ring's INFO opens this (js/commands.js openInfoPanel), on the readout of what was pressed; its INDEX button turns the pages. Three kinds of page, all drawn with the UI kit (js/uikit.js):
//   the READOUT   (infoPanelPage null)   what you pressed — a follower, a clone or a creature: its live numbers, then a button to read about its kind
//   the INDEX     (infoPanelPage 'codex') four tabs of everything in the facility game, one slab per entry
//   an ENTRY      ('e:<id>')              a description, then its numbers (read off the game's own constants, so it cannot drift)
// A page taller than the panel is split into pages (the middle button turns them): there is no scrolling to find.
// The press hands in what it hit: a follower or an enemy (infoPanelSubject). The old strip game's pages (pylons, power, nests, the work crew, the codex) went with it: there is nothing to build or power here
// but the relays, and they are an entry under RULES.

const INFO_CATS = [
    { id: "allies",   label: "ALLIES",   col: "#7dffb5", blurb: "Your squad of three, the rooms the rest hold, and the clones you grow from DNA." },
    { id: "foes",     label: "ENEMIES",  col: "#ff7766", blurb: "The arena's creatures, six kinds of them, and the alarm that sets them on you." },
    { id: "elements", label: "ELEMENTS", col: "#19e6c1", blurb: "Six elements in two triangles. Each one colours a follower and decides what its attacks do." },
    { id: "rules",    label: "RULES",    col: "#8fe3ff", blurb: "How the facility fits together: the Crystal, the relays, your gun and your pack, what a kill pays." },
];

// What each element's follower attacks are called (the attacks themselves are js/elements.js; their names were only ever written down in the GAME INDEX, so they are written down here too).
const _IP_ATTACKS = {
    fire:     { physical: "Ring of Fire",    special: "Fire Bombs",    ult: "Volcanic Eruption", proc: "burn" },
    electric: { physical: "Chain Lightning", special: "Static Field",  ult: "EMP",          proc: "stun" },
    ice:      { physical: "Frost Lance",     special: "Ice Burst",     ult: "Blizzard",     proc: "hard freeze" },
    flux:     { physical: "Volatility Aura", special: "Singularity",   ult: "Disorient",    proc: "disorient" },
    core:     { physical: "Shield Bash",     special: null,            ult: null,           proc: "knockback" },   // (Radiant Pulse and Shield Grant shielded the followers: gone with the followers' shield)
    toxic:    { physical: "Smoke Form",      special: "Toxic Cloud",   ult: "Smoke Screen", proc: "defense shred" },
};
const _ipElName = (id) => { const e = ELEMENTS.find(x => x.id === id); return e ? e.label.toUpperCase() : String(id || "?").toUpperCase(); };

// Every entry: { id, cat, name, col, sub (one line, shown on its slab), text: [paragraphs], rows: [[label, value, colour?]] }.
// A function, so the numbers are read from the constants when it is opened (files loaded after this one are not needed at load, and a constant that is not there has a plain stand-in).
function infoEntries() {
    const sec = f => +(f / 60).toFixed(f % 60 ? 1 : 0) + " s";
    const E = [];
    const add = (id, cat, name, col, sub, text, rows) => E.push({ id, cat, name, col, sub, text, rows: rows || [] });
    const party = typeof PARTY !== "undefined" ? PARTY : { max: 3 };
    const spot = typeof FP_SPOT !== "undefined" ? FP_SPOT : { take: 1.5, refill: 5400, cap: 12 };
    const spawn = typeof FP_SPAWN !== "undefined" ? FP_SPAWN : { every: 1200, start: 4, cap: 7, levels: [2, 4], species: ["ant", "beetle", "spider", "scorpion", "mantis", "moth"], scrap: { chance: 0.75, life: 3600 } };
    const relayRule = typeof CLASS_RULES !== "undefined" && CLASS_RULES.relay ? CLASS_RULES.relay : { skillCells: 1, kitCells: 2 };
    const relays = typeof _fp !== "undefined" && _fp && _fp.F && _fp.F.relays ? _fp.F.relays.length : 6;
    const recruitCost = typeof RECRUIT_COST !== "undefined" ? RECRUIT_COST : 30;
    const evolveAt = typeof EVOLVE_LEVEL !== "undefined" ? EVOLVE_LEVEL : 10, evolveMult = typeof EVOLVE_MULT !== "undefined" ? EVOLVE_MULT : 1.25;
    const alarmFrames = typeof ALERT_DURATION !== "undefined" ? ALERT_DURATION : 600;
    const crystalHp = typeof crystal !== "undefined" && crystal && crystal.maxHealth ? crystal.maxHealth : 300;
    const target = typeof TARGET !== "undefined" ? TARGET : { range: 9 };
    const ammoMax = typeof PLAYER_AMMO_MAX !== "undefined" ? PLAYER_AMMO_MAX : 60, hits = typeof PLAYER_HITS !== "undefined" ? PLAYER_HITS : 3;

    // ── ALLIES ──
    add("squad", "allies", "YOUR SQUAD", "#7dffb5", "Three walk with you; the rest hold rooms",
        ["Up to " + party.max + " followers walk with you: the three small cards over the orders at the bottom left (on a phone, the bar over the dock). Each has an element, a role (BRAWLER closes in, MAGE fires from range, TECHNICIAN holds its ground), a personality, a level and a set of stats.",
         "The orders go to ALL of them, or to the one whose card you tapped. RETREAT breaks them off to fall back to you for six seconds. HOLD posts each one in the room it is in: it patrols that room and fights what comes into it, and does not follow you. COME calls the held ones back, as long as there is room in the squad.",
         "Long-press a follower on the floor, or tap its card, for its card: its numbers, INDEX (its attacks, move and stats) and DISMISS, which leaves it holding the room it is in. A follower that joins when the squad is full holds the room it was found in. Double-tap one to fire its ultimate once the bar under its health is full."],
        [["WITH YOU", party.max + " at once"], ["HOLD", "patrols its room until called"], ["COME", "back to the squad, if there is room"], ["RETREAT", "breaks off for 6 s"]]);
    add("recruit", "allies", "THE CRYSTAL'S RECRUITS", "#19e6c1", "A new follower for shards",
        ["The roster's + RECRUIT (open ROSTER from the dock) buys a follower at the Crystal for " + recruitCost + " ◆. What comes out is a draw: a BRAWLER, a MAGE or a TECHNICIAN, of one of the six elements, with a personality to match its type. You do not choose it, and cannot change it afterwards: you level it and evolve it.",
         "A follower that falls comes back at the Crystal after a while, as it was, and rejoins the squad if there is room; if there is none it holds the Crystal Chamber."],
        [["PRICE", recruitCost + " ◆", UI_GOLD], ["TYPE", "brawler, mage or technician"], ["ELEMENT", "one of the six"]]);
    add("eggs", "allies", "EGGS ON THE PADS", "#c8d4f0", "Followers found around the facility",
        ["A pad on the floor in an element's colour holds a grey egg, with a label over it saying what hatches: its type and its element, fixed. Walk up to it and it hatches there and then and joins you (or holds the pad's room, if the squad is full).",
         "The pad fills again with the same egg a while after you have walked away from it, as long as the roster is under its cap, and the wait is part of the saved game."],
        [["TAKE", "walk within " + spot.take + " tiles"], ["FILLS AGAIN", "after " + sec(spot.refill)], ["ROSTER CAP", spot.cap + " followers"]]);
    add("evolution", "allies", "EVOLUTION", UI_GOLD, "At level " + evolveAt + " a follower sheds its egg",
        ["A follower that reaches level " + evolveAt + " and has a form for its element and role evolves on the spot: it molts, the egg cracks and the machine rises out of it. It keeps that form for good, through death and a reload, and its role is fixed from then on.",
         "An evolved form has a signature MOVE it fires by itself when an enemy is near, and some forms can choose a second one on the INDEX tab of their card. Its health and power are multiplied too."],
        [["AT", "level " + evolveAt, UI_GOLD], ["HEALTH & POWER", "×" + evolveMult], ["MOVE", "one signature move, fired on its own"]]);
    add("levels", "allies", "LEVELS & XP", "#9ca8ff", "Every unit levels the same way",
        ["Every unit has a level and a set of base stats; its real stats are the base scaled by its level (×1 at level " + (typeof LEVEL_START !== "undefined" ? LEVEL_START : 5) + ", ×2 at 20, ×4 at 50, ×" + (typeof levelFactor === "function" ? +levelFactor(typeof LEVEL_CAP !== "undefined" ? LEVEL_CAP : 100).toFixed(1) : 7.3) + " at " + (typeof LEVEL_CAP !== "undefined" ? LEVEL_CAP : 100) + "). The level and type show over the health bar, and the card's INDEX has the full sheet.",
         "XP comes from kills: the killer takes " + Math.round((typeof XP_KILLER_SHARE !== "undefined" ? XP_KILLER_SHARE : 0.6) * 100) + "% and your units within " + (typeof XP_SHARE_RANGE !== "undefined" ? XP_SHARE_RANGE : 4) + " tiles share the rest. The XP for a level is its cube (level 10 is 1,000). A unit that dies keeps its level but loses part of its progress to the next."],
        [["CAP", "level " + (typeof LEVEL_CAP !== "undefined" ? LEVEL_CAP : 100)], ["ON A DEATH", "−" + Math.round((typeof XP_DEATH_LOSS !== "undefined" ? XP_DEATH_LOSS : 0.25) * 100) + "% of the progress", "#ff8a7a"], ["EVOLVES", "at level " + evolveAt, UI_GOLD]]);
    add("bonds", "allies", "BONDS", typeof BOND_COLOUR !== "undefined" ? BOND_COLOUR : "#ff7ab8", "Two who fight side by side",
        ["Two followers who fight side by side for about " + sec(typeof BOND_TICK !== "undefined" && typeof BOND_POINTS !== "undefined" ? BOND_TICK * BOND_POINTS : 1200) + " bond: a dotted pink line with a heart joins them, one partner each. Close together they hit harder and take less.",
         "If one dies the other rages for a while, then the bond is over and the fallen one comes back unbonded. With both ultimate bars full and the pair close, double-tap either and both ultimates fire at once."],
        [["TOGETHER", "+" + Math.round(((typeof BOND_ATTACK_MULT !== "undefined" ? BOND_ATTACK_MULT : 1.15) - 1) * 100) + "% damage, −" + Math.round((1 - (typeof BOND_DEFENSE_MULT !== "undefined" ? BOND_DEFENSE_MULT : 0.9)) * 100) + "% taken, within " + (typeof BOND_TOGETHER !== "undefined" ? BOND_TOGETHER : 3) + " tiles"],
         ["RAGE", "+" + Math.round(((typeof BOND_RAGE_ATTACK !== "undefined" ? BOND_RAGE_ATTACK : 1.5) - 1) * 100) + "% damage for " + sec(typeof BOND_RAGE_FRAMES !== "undefined" ? BOND_RAGE_FRAMES : 600), "#ff6655"],
         ["DUO", "×" + (typeof BOND_DUO_MULT !== "undefined" ? BOND_DUO_MULT : 1.3) + " for " + sec(typeof BOND_DUO_FRAMES !== "undefined" ? BOND_DUO_FRAMES : 300)]]);
    add("clones", "allies", "CLONES", "#19e6c1", "Grown in the Clone Bay from DNA",
        ["Clones are the MUTATOR's: open the CLONE BAY (CLONES on the dock) and grow a creature's species as your ally, for shards and the DNA splices its kind drops when you kill it (" + (typeof cloneCap === "function" ? cloneCap() : MAX_CLONES) + " at a time). A clone is far tougher than a follower, fights as its species does (its bite in two beats, its special) and follows you under the squad's orders.",
         "The Mutator's clone does NOT come back by itself: when it falls its body stays where it fell, and a new one has to be grown. Keep it alive: pull it back (RETREAT, COME) when a fight turns.",
         "The clone prices by species and class are in the GAME INDEX (the ? button, SQUAD tab)."],
        [["POWER", "×" + CLONE_POWER_MULT], ["HEALTH", "×" + CLONE_HEALTH_MULT], ["AT ONCE", typeof cloneCap === "function" ? cloneCap() : MAX_CLONES], ["WHO", typeof cloneWho === "function" && cloneWho() ? cloneWho() : "ANY CLASS"], ["COMES BACK", typeof cloneRule === "function" && cloneRule() && cloneRule().primary ? "NO: GROW A NEW ONE" : "after " + sec(CLONE_RESPAWN_FRAMES)]]);

    // ── ENEMIES ──
    const SP = (k) => SPECIES[k] && SPECIES[k].scout;
    add("species", "foes", "THE CREATURES", "#ff7766", "Six kinds, in four classes",
        ["The facility's wild things come in six kinds, each in a class of its own: a WORKER, a SCOUT, a STRIKER or a TANK, bigger and tougher down that list. Each has a level, and its stats scale with it the way your units' do.",
         "ANTS are the weakest and simply walk up and bite. BEETLES are armoured. SCORPIONS, SPIDERS, MANTISES and MOTHS from the striker class up also strike from range: a sting, a venom shot, a foreleg lunge, a cloud of wing-dust.",
         "Tap one to lock your gun on it; tap the enemy card at the bottom of the screen (or long-press the creature and pick ATTACK) to send the squad at it."],
        Object.keys(SPECIES).filter(k => SP(k)).map(k => [k.toUpperCase(), "scout " + SP(k).health + " HP · " + SP(k).power + " pwr", SPECIES[k].color]));
    add("arena", "foes", "THE ARENA", "#ff9a6a", "Where the creatures live",
        ["The arena is where the facility's creatures are. A few are there when the game opens, and every so often another comes out of the dark at a spot you cannot see, always the kind there are fewest of, so they are all different.",
         "They potter about the arena from spot to spot, never out of it, and hunt only when provoked or when an alarm is up. One that dies drops a case of scrap metal where it fell, which the Armory's terminal turns into ammunition."],
        [["AT THE START", spawn.start], ["ANOTHER", "every " + sec(spawn.every)], ["AT MOST", spawn.cap + " alive at once"], ["LEVELS", spawn.levels.join(" to ")], ["SCRAP", Math.round(spawn.scrap.chance * 100) + "% drop, lies " + sec(spawn.scrap.life)]]);
    add("alarm", "foes", "THE ALARM", UI_RED, "The triangle at the top right",
        ["An alarm is the state of a fight. While one is up the creatures it reached hunt instead of pottering about, and the red triangle shows beside the room tag. A PROXIMITY ALARM wakes the creatures near whatever raised it; a FACILITY BREACH wakes every creature there is.",
         "An alarm fades " + sec(alarmFrames) + " after the last thing that fed it, and a creature nobody is fighting goes back to its round."],
        [["LASTS", sec(alarmFrames) + " after the last trigger"], ["PROXIMITY", "creatures within 6 tiles"], ["BREACH", "every creature", UI_RED]]);

    // ── ELEMENTS ──
    const mult = (a, d) => typeof getElementMultiplier === "function" ? getElementMultiplier(a, d) : 1;
    const strong = typeof ELEMENT_STRONG_AGAINST !== "undefined" ? ELEMENT_STRONG_AGAINST : { fire: "flux", flux: "toxic", toxic: "fire", electric: "core", core: "ice", ice: "electric" };
    const weak = typeof ELEMENT_WEAK_TO !== "undefined" ? ELEMENT_WEAK_TO : { fire: "toxic", flux: "fire", toxic: "flux", electric: "ice", core: "electric", ice: "core" };
    add("wheel", "elements", "THE WHEEL", UI_GOLD, "Two triangles, on every hit",
        ["FIRE beats FLUX, FLUX beats TOXIC, TOXIC beats FIRE. ELECTRIC beats CORE, CORE beats ICE, ICE beats ELECTRIC. A hit of the element that beats its target's does ×" + mult("fire", "flux") + "; the one it is beaten by does ×" + mult("flux", "fire") + "; ice does " + (mult("ice", "core") === 0 ? "nothing" : "×" + mult("ice", "core")) + " to core.",
         "It runs on every hit, your followers' and the creatures' alike, against anything that has an element. A follower's element is the one it was found with: an egg's pad says it, and a recruit draws one."],
        [["BEATS", "×" + mult("fire", "flux"), "#7fffb0"], ["BEATEN BY", "×" + mult("flux", "fire"), "#ff8a7a"], ["ICE ON CORE", mult("ice", "core") === 0 ? "no damage" : "×" + mult("ice", "core"), "#99ddff"]]);
    ELEMENTS.forEach(el => {
        const a = _IP_ATTACKS[el.id] || {}, proc = typeof ELEMENT_PROC_CHANCE !== "undefined" ? ELEMENT_PROC_CHANCE[el.id] : undefined;
        add("el_" + el.id, "elements", el.label.toUpperCase(), el.color, "Beats " + _ipElName(strong[el.id]).toLowerCase() + ", weak to " + _ipElName(weak[el.id]).toLowerCase(),
            ["A " + el.label.toUpperCase() + " follower hits " + _ipElName(strong[el.id]) + " for ×" + mult(el.id, strong[el.id]) + " and " + _ipElName(weak[el.id]) + " for ×" + mult(el.id, weak[el.id]) + (el.id === "ice" ? ", and does nothing to CORE" : "") + ".",
             "Its physical attack is " + (a.physical || "—") + " (1 WILL)" + (a.special || a.ult ? ", its special " + (a.special || "—") + " (4 WILL), and its ultimate, fired by a double-tap once the bar is full, is " + (a.ult || "—") + "." : ". It has no special and no ultimate for now.") + " Its hits can " + (a.proc || "proc") + " the target."],
            [["BEATS", _ipElName(strong[el.id]), ELEMENTS.find(x => x.id === strong[el.id]).color], ["WEAK TO", _ipElName(weak[el.id]), ELEMENTS.find(x => x.id === weak[el.id]).color],
             ["PHYSICAL", a.physical || "—"], ["SPECIAL", a.special || "—"], ["ULTIMATE", a.ult || "—", UI_GOLD], ["PROC", (proc !== undefined ? Math.round(proc * 100) + "% " : "") + (a.proc || "")]]);
    });

    // ── RULES ──
    add("crystal", "rules", "THE CRYSTAL", "#2bff9b", "Home, and the end if it falls",
        ["The Crystal stands in the Crystal Chamber: it is where you start, where recruits come out and where a fallen follower or clone comes back. It mends slowly on its own.",
         "The creatures hunt it when an alarm is up. If it is destroyed the game is over: the card says so, with the shards you had, and NEW GAME starts the facility again (SETTINGS on the dock does the same)."],
        [["HEALTH", crystalHp + " HP", "#7dffb5"], ["LOST", "game over", UI_RED]]);
    add("relays", "rules", "RELAYS & THE BLACKOUT", "#ffe733", "Power the rooms back up",
        ["The facility starts in a blackout: every room dark, your monitor lamp and the emergency lights the only light. " + relays + " relays stand broken, and each one powers a few rooms. Walk up to one (or tap it) to repair it: a Technomancer spends " + relayRule.skillCells + " power cell and starts by itself; anyone else needs the RELAY KIT and " + relayRule.kitCells + " cells. Walk away and the repair stops, nothing spent.",
         "Once a relay is online its rooms have power: lit while you are in them, their doors throwing light, and whatever it feeds (sentries, the charging station) working. The NETWORK panel at the top right counts the relays online and the rooms powered, and the room tag names the room you are in; with every relay online the blackout is over."],
        [["RELAYS", relays], ["TECHNOMANCER", relayRule.skillCells + " power cell"], ["ANYONE", "the relay kit + " + relayRule.kitCells + " cells"]]);
    add("gun", "rules", "YOUR GUN", "#ffb070", "Lock on, then the round dial fires",
        ["Near a creature the gun takes aim by itself: the nearest one within " + target.range + " tiles that you can see is locked, red corners close on it, and a round DIAL with its picture appears: its health as a ring, its level, an INFO button and the ammunition under it. CLICK the dial for a shot, HOLD it to keep firing at the gun's own rate.",
         "Tap another creature to lock that one instead; a tap on the locked creature is a shot too. The ammunition chip stands the gun down. Rounds come from AMMO PACKS in the supply cases and from scrap at the Armory's terminal, where weapons are equipped and upgraded as well."],
        [["LOCKS", "within " + target.range + " tiles, in sight"], ["THE GUN HOLDS", ammoMax + " rounds"], ["YOU", hits + " hits, then back to the Crystal", "#ff8a7a"]]);
    add("pack", "rules", "THE PACK & THE CLASSES", "#31e8ff", "Press I; a class after the tutorial",
        ["Press I (or PACK on the dock) for your pack: everything you carry, in tabs, with an INSPECT page and USE for each item. Supply cases glow in the dark; walk over one to take what is in it. Any class may carry another class's gear, but only the right class may use it.",
         "When the tutorial is finished you choose a class, and its cases arrive in the facility. Each class has a station in the rooms it works in, and earns a perk there."],
        (typeof CLASSES !== "undefined" && typeof CLASS_ORDER !== "undefined" ? CLASS_ORDER.map(k => [CLASSES[k].name, CLASSES[k].tagline, CLASSES[k].colour]) : []));
    add("kills", "rules", "WHAT A KILL PAYS", UI_GOLD, "Shards, DNA and scrap",
        ["A creature you kill pays its worth in shards on the spot (◆ n floats over it): the shards are what recruits and clones cost. It drops DNA splices of its kind and class for the Clone Bay, and in the arena a case of scrap metal where it fell. A nymph is worth nothing.",
         "Your followers and clones take the kill's XP too (the killer the most, the units near it the rest), which is how they level and evolve."],
        [["SHARDS", "its worth, on the spot", UI_GOLD], ["DNA", "a splice or more, by class", "#0f8"], ["SCRAP", "a case that lies " + sec(spawn.scrap.life)]]);
    add("surge", "rules", "YOUR ULTIMATE", UI_GOLD, "The bar under your health",
        ["The bar under your health is your own ultimate, and it is siphoned from the followers near you: anything within " + (typeof SIPHON_RANGE !== "undefined" ? SIPHON_RANGE : 6) + " tiles sends a wisp of static across every couple of seconds, so the more of them are with you the faster it fills. With none in reach it reads NO SQUAD IN RANGE. The ⌁ switch at its end turns the siphon off.",
         "Tap the bar when it is full for an ARMY SURGE: every follower and clone healed, its will refilled, its own ultimate charged, and more damage for a while."],
        [["SIPHON", "followers within " + (typeof SIPHON_RANGE !== "undefined" ? SIPHON_RANGE : 6) + " tiles"], ["SURGE", "×" + (typeof ARMY_SURGE_POWER !== "undefined" ? ARMY_SURGE_POWER : 1.6) + " damage for " + sec(typeof ARMY_SURGE_FRAMES !== "undefined" ? ARMY_SURGE_FRAMES : 600), UI_GOLD]]);

    return E;
}

function infoEntry(id) { return infoEntries().find(e => e.id === id) || null; }

// What a pressed thing is: the entry that describes its kind.
function infoEntryForSubject(sub) {
    sub = sub || {};
    if (sub.follower) return sub.follower.isClone ? "clones" : "squad";
    if (sub.enemy) return "species";
    return null;
}

// ─────────────────────────────────────────────────────────
//  PAGES → ITEMS
// ─────────────────────────────────────────────────────────
// An item is { k: 'head' | 'text' | 'pair' | 'nav' | 'gap' | 'line', ... }; its height is _IP_H[k].
const _IP_H = { head: 36, text: 21, pair: 26, nav: 56, gap: 12, line: 10 };
let _infoCat = "allies";
let _infoPageNo = 0;

function _ipWrapItems(text, chars, col) { return uiWrap(text, chars).map(l => ({ k: "text", t: l, c: col })); }

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
    infoEntries().filter(e => e.cat === cat.id).forEach(e => out.push({ k: "nav", t: e.name, sub: e.sub, c: e.col, page: "e:" + e.id }));
    return out;
}

// The readout of whatever was pressed: live numbers, then a way into its entry.
function _ipReadout(chars) {
    const S = infoPanelSubject || {}, tile = infoPanelTarget;
    const out = [], P = (a, b, c) => out.push({ k: "pair", a, b: String(b), c });
    let title = "NOTHING HERE", col = UI_TEAL;
    const f = S.follower || (!S.enemy && tile ? [...followers, ...actors.filter(a => a.isClone)].filter(a => !a.dead && Math.hypot(a.x - tile.x, a.y - tile.y) < 3)[0] : null);
    if (f) {
        const el = ELEMENTS.find(e => e.id === f.element);
        title = (typeof unitTypeLabel === "function" ? unitTypeLabel(f) : (f.speciesName || "UNIT").toUpperCase()); col = el ? el.color : UI_TEAL;
        const lv = f.level, xpNext = Number.isFinite(lv) && lv < LEVEL_CAP ? Math.max(0, Math.ceil(xpForLevel(lv + 1) - (f.xp || 0))) : 0;
        if (Number.isFinite(lv)) P("LEVEL", lv + (lv < LEVEL_CAP ? "  ·  " + xpNext + " XP TO NEXT" : "  ·  MAX"), UI_GOLD);
        P("ELEMENT", (el ? el.label : f.element || "?").toUpperCase(), col);
        P("PERSONALITY", (f.personality || "—").toUpperCase());
        if (f.post) P("HOLDS", (typeof partyRoomName === "function" ? partyRoomName(f.post) : String(f.post)).toUpperCase(), "#8fe3ff");
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
        if (Number.isFinite(e.level)) P("LEVEL", e.level, UI_GOLD);
        if (el) P("ELEMENT", el.label.toUpperCase(), el.color);
        P("HP", Math.ceil(e.health) + " / " + e.maxHealth, "#ff8a7a");
        P("POWER", (e.power || 0).toFixed(0));
        P("SPEED", ((e.moveSpeed || 0) * 1000).toFixed(1) + "‰");
    } else out.push({ k: "text", t: "Nothing you can read about is here. Long-press a follower, a clone or a creature, or open the INDEX.", c: "#8aa0c8" });
    const eid = infoEntryForSubject({ follower: f, enemy: S.enemy });
    out.push({ k: "gap" });
    if (eid) { const e = infoEntry(eid); if (e) out.push({ k: "nav", t: "ABOUT: " + e.name, sub: e.sub, c: e.col, page: "e:" + eid }); }
    const elId = f ? f.element : S.enemy ? S.enemy.element : null, el2 = elId && ELEMENTS.find(e => e.id === elId);
    if (el2) out.push({ k: "nav", t: el2.label.toUpperCase(), sub: "WHAT IT BEATS, WHAT BEATS IT", c: el2.color, page: "e:el_" + elId });
    return { title, col, items: out };
}

// Which page we are on: { title, col, items, back (label|null), tabs (bool) }.
function _ipPage(chars) {
    const p = infoPanelPage;
    if (p === "codex") return { title: "INDEX", col: UI_TEAL, items: _ipIndexItems(chars), back: infoPanelTarget || infoPanelSubject ? "‹ BACK" : null, tabs: true };
    if (typeof p === "string" && p.slice(0, 2) === "e:") {
        const e = infoEntry(p.slice(2));
        if (e) return { title: INFO_CATS.find(c => c.id === e.cat).label, col: e.col, items: _ipEntryItems(e, chars), back: "‹ INDEX" };
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
        // four tabs are a 2 × 2 grid (more would go three to a row)
        const cols = INFO_CATS.length <= 4 ? 2 : 3, rows = Math.ceil(INFO_CATS.length / cols), tw = Math.floor((iw - (cols - 1) * 6) / cols), th = 40;
        INFO_CATS.forEach((c, i) => L.tabs.push({ id: c.id, label: c.label, col: c.col, x: ix + (i % cols) * (tw + 6), y: y0 + Math.floor(i / cols) * (th + 6), w: tw, h: th, on: c.id === _infoCat }));
        y0 += rows * (th + 6) + 4;
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
    for (const p of L.placed) if (p.it.k === "nav" && inR({ x: L.ix, y: p.y, w: L.iw, h: p.h })) { _ipGo(p.it.page); return true; }
    return true;
}
