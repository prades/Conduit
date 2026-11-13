// ─────────────────────────────────────────────────────────
//  UNIT INFO — the INFO tab on every card: a follower's (or a clone type's) attacks, jobs and stats
// ─────────────────────────────────────────────────────────
// REPORTED: "I would like an info tab for each of the followers and their different attacks and jobs", "on each card". Every card (the Command
// Center's roster cards, the phone roster, the Clone Bay's player cards) has an INFO button that opens this: ATTACKS, JOBS and STATS tabs.
// The numbers are the game's own constants (evolution.js, species.js, elements.js), read, not retyped, so the page cannot drift from play.
// The Ultimates are each evolved form's own (js/elements.js FORM_ULTIMATES, since build 2026-11-09b): each works within ULT_REACH tiles of the follower. An unevolved follower has none; a form
// without one of its own is flagged (followerUltPending): NOT DESIGNED YET.
const ROLE_INFO = {
    brawler: { label: "BRAWLER",    text: "Closes in and fights up close." },
    sniper:  { label: "MAGE",       text: "Fires from a distance." },
    camper:  { label: "TECHNICIAN", text: "Holds a post." },
};
const CLONE_SPECIAL = {
    scorpion: "STINGER", spider: "WEB SHOT", mantis: "AMBUSH", moth: "DUST",
};
const CLONE_SPECIAL_TEXT = {
    scorpion: "Fires its stinger tail from the rear.", spider: "Spits spinneret venom from the rear.", mantis: "Strikes with its raptorial forelegs at range.", moth: "Blows a cloud of wing-dust powder.",
};
const _uiSec = f => Math.round(f / 60 * 100) / 100 + " s";   // (to the hundredth, no trailing zeros: the second attacks' halved times are 2.75 s and the like since build 2026-11-10a)
const _uiX = n => n + "×";

// A signature move, as rows ([label, value]) read off the constants.
const MOVE_INFO = {
    "PETAL BLAZE":     () => [["REACH", BLOOM_RADIUS + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("petal_blaze"))], ["DAMAGE", _uiX(BLOOM_MULT) + " power"], ["EFFECT", "A ring of fire hits everything around it and sets it burning for " + _uiSec(BLOOM_BURN)]],
    "QUILL BURST":     () => [["REACH", QUILL_RANGE + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("quill_burst"))], ["QUILLS", QUILL_COUNT + ", all at once, fanned " + QUILL_FAN + "°"], ["DAMAGE", _uiX(QUILL_MULT) + " power a quill"], ["EFFECT", "Crystal quills fly out together; each stops at the first enemy it touches. No piercing, no splash: up close one enemy can take them all, far off they spread"]],
    "ARC VOLLEY":      () => [["REACH", REAVER_RANGE + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("arc_volley"))], ["DAMAGE", _uiX(REAVER_MULT) + " power"], ["EFFECT", "A charged arc that jumps to " + REAVER_CHAIN + " more enemies"]],
    "MAELSTROM": () => [["REACH", MAEL_RANGE + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("maelstrom"))], ["DAMAGE", _uiX(MAEL_BITE) + " power every " + _uiSec(MAEL_TICK) + ", for " + _uiSec(MAEL_LIFE)], ["EFFECT", "A small swirl of purple crystals, " + MAEL_RADIUS + " tiles across, on the nearest enemy: everything in it is hurt and blinded (each of its attacks then misses " + Math.round(BLIND_MISS * 100) + "% of the time) while it is in and for " + _uiSec(MAEL_BLIND) + " after; a boss takes the damage but is not blinded"]],
    "SINGULARITY SHOT": () => [["REACH", SERPENT_RANGE + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("singularity_shot"))], ["DAMAGE", _uiX(SERPENT_MULT) + " power"], ["EFFECT", "Drags every enemy within " + SERPENT_PULL_R + " tiles of the target in and slows them (a beetle, a boss or a machine is too heavy to drag)"]],
    "SONIC ROLL":      () => [["REACH", MANTA_RANGE + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("static_rush"))], ["DAMAGE", _uiX(MANTA_MULT) + " power"], ["EFFECT", "Dashes to the enemy, hits it and shocks " + MANTA_CHAIN + " more; all are stunned for " + _uiSec(MANTA_STUN)]],
    "MAGMA VENT":      () => [["REACH", MAGMA_RANGE + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("magma_vent"))], ["VENT", MAGMA_RADIUS + " tiles round, " + _uiSec(MAGMA_LIFE)], ["DAMAGE", _uiX(MAGMA_BITE) + " power a burst, every " + _uiSec(MAGMA_TICK)], ["EFFECT", "A volcanic vent opens under the enemy it can see and bursts magma up at everything near it until it closes"]],
    "HEXFIRE":         () => [["REACH", HALO_RANGE + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("hexfire"))], ["CIRCLE", HALO_RADIUS + " tiles round, " + _uiSec(HALO_LIFE)], ["DAMAGE", _uiX(HALO_BITE) + " power every " + _uiSec(HALO_TICK)], ["EFFECT", "A fire shot that leaves a burning circle where it lands. The circle stays put and never grows; enemies in it burn, your side does not. A new one takes the last one's place"]],
    "SEEDFALL":        () => [["REACH", SEEDFALL_RANGE + " tiles: it winds up with an enemy this close"], ["WIND-UP", _uiSec(moveWindupFrames("seedfall"))], ["AREA", BUD_RADIUS + " tiles round the Thornwhip itself, " + _uiSec(BUD_LIFE)], ["HEALS", Math.round(BUD_MEND * 100) + "% of maximum health every " + _uiSec(BUD_TICK) + ", the Thornwhip and every follower of yours standing among the buds"], ["EFFECT", "Seeds are flung round its feet and grow into healing buds that last a few seconds; it hurts no enemy"]],
    "PINBALL":         () => [["REACH", PIN_RANGE + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("pinball")) + " after a roll"], ["DAMAGE", _uiX(PIN_MULT) + " power a collision"], ["EFFECT", "Rolls into the nearest enemy, then on into the nearest one it has not hit within " + PIN_HOP + " tiles, and on while one is that near: each enemy once. A wall stops it"]],
    "STATIC VORTEX":   () => [["REACH", VORTEX_RANGE + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("static_vortex"))], ["STORM", VORTEX_RADIUS + " tiles round, " + _uiSec(VORTEX_LIFE)], ["DAMAGE", _uiX(VORTEX_MULT) + " power every " + _uiSec(VORTEX_TICK)], ["EFFECT", "A storm that stays where it is cast: it pulls the enemies in it to a spot in front of it, about " + VORTEX_HOLD + " tile from its middle, so the storm does not hide them (not a beetle or a boss) and shocks them until it runs out"]],
    "ROTTEN DECOY":    () => [["REACH", ROT_RANGE + " tiles (set " + DECOY_SET + " tiles from the nearest enemy, out to the side of it where there is less clutter)"], ["WIND-UP", _uiSec(moveWindupFrames("rotten_decoy"))], ["LASTS", _uiSec(DECOY_LIFE) + " or until broken (half its max HP)"], ["EFFECT", "A black crystal copy in green mist: every enemy within " + DECOY_DRAW + " tiles goes for it (not a boss); its mist poisons enemies within " + DECOY_MIST + " tiles"]],
    "CORRODE SHOT":    () => [["REACH", ROT_RANGE + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("corrode_shot"))], ["DAMAGE", _uiX(ROT_MULT) + " power"], ["EFFECT", "Eats the target's armour for " + _uiSec(ROT_SHRED_FRAMES) + " and splashes the corrosion over " + ROT_SPLASH_R + " tiles"]],
    "GRAVITY SLAM":    () => [["REACH", MIMIC_RADIUS + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("gravity_slam"))], ["DAMAGE", _uiX(MIMIC_MULT) + " power"], ["EFFECT", "Flattens and slams: shoves enemies back and slows them for " + _uiSec(MIMIC_SLOW_FRAMES) + " (heavy ones are not moved)"]],
    "ERUPTION":        () => [["REACH", CALDERA_RADIUS + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("eruption"))], ["DAMAGE", _uiX(CALDERA_MULT) + " power"], ["EFFECT", "The crater bursts in toxic goo and eats the armour of everything it hits for " + _uiSec(CALDERA_SHRED_FRAMES)]],
    "STAKE RING":      () => [["REACH", STAKE_RADIUS + " tiles, all round it"], ["WIND-UP", _uiSec(moveWindupFrames("stake_ring"))], ["DAMAGE", _uiX(STAKE_MULT) + " power, piercing, to every enemy in reach it can see"], ["EFFECT", "It plants its legs and a ring of crystal spikes bursts up round it: each enemy is pushed " + STAKE_PUSH + " tiles out"]],
    "SWEET SCENT":     () => [["REACH", SCENT_RADIUS + " tiles, enemies it can see (not a boss)"], ["WIND-UP", _uiSec(moveWindupFrames("sweet_scent"))], ["PUFF", "the enemies in reach go for it for " + _uiSec(SCENT_FRAMES) + ", and are poisoned: their bites " + Math.round((1 - SCENT_POISON_FACTOR) * 100) + "% weaker for " + _uiSec(SCENT_POISON_FRAMES)], ["STOCKPILE FULL", "instead it heals itself and your followers within " + SCENT_HEAL_R + " tiles " + Math.round(SCENT_HEAL * 100) + "% of their maximum health, and the stockpile empties"], ["EFFECT", "A sweet puff of scent that draws enemies in; its NECTAR STING fills the stockpile (four pips over it)"]],
    // THE NINE SECOND ATTACKS (build 2026-11-09c: js/evolution.js; every number the agent's, provisional)
    "ZIGZAG DASH":     () => [["REACH", ZIG_RANGE + " tiles to the first enemy, then " + ZIG_HOP + " tiles a hop, " + ZIG_HITS + " enemies at most"], ["WIND-UP", _uiSec(moveWindupFrames("zigzag_dash"))], ["DAMAGE", _uiX(ZIG_MULT) + " power each, slashing, electric"], ["EFFECT", "It darts in a zig-zag through the enemies ahead, slashing each it passes and breaking their wind-ups (GLITCH " + _uiSec(ZIG_GLITCH) + "); it ends beside the last"]],
    "WOBBLE SLAM":     () => [["REACH", WOBBLE_RADIUS + " tiles, all round it"], ["WIND-UP", _uiSec(moveWindupFrames("wobble_slam"))], ["DAMAGE", _uiX(WOBBLE_MULT) + " power, crushing"], ["EFFECT", "It bounces up and lands on its jelly body: every enemy in reach it can see is staggered " + _uiSec(WOBBLE_STUN) + " (not a boss)"]],
    "ICICLE VOLLEY":   () => [["REACH", ICICLE_RANGE + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("icicle_volley"))], ["DAMAGE", ICICLE_COUNT + " icicles, each its shot (" + _uiX(typeof MAGE_SHOT_MULT !== "undefined" ? MAGE_SHOT_MULT : 0.5) + " special attack), ice"], ["EFFECT", "A fan of icicles at the nearest enemy: each that hits slows its target to " + Math.round(ICICLE_SLOW_F * 100) + "% of its speed for " + _uiSec(ICICLE_SLOW)]],
    "ECHO PULSE":      () => [["REACH", ECHO_RADIUS + " tiles, all round it"], ["WIND-UP", _uiSec(moveWindupFrames("echo_pulse"))], ["DAMAGE", _uiX(ECHO_MULT) + " power, core"], ["EFFECT", "A ring of sound from its horn: every enemy in reach it can see has its wind-up broken (GLITCH " + _uiSec(ECHO_GLITCH) + ")"]],
    "SHELL GUARD":     () => [["REACH", GUARD_LURE + " tiles, enemies it can see (not a boss)"], ["WIND-UP", _uiSec(moveWindupFrames("shell_guard"))], ["GUARD", Math.round(GUARD_CUT * 100) + "% less damage for " + _uiSec(GUARD_FRAMES)], ["EFFECT", "It braces in its shell: the enemies in reach come for it, not the squad, while it lasts"]],
    "PHASE SWAP":      () => [["REACH", SWAP_RANGE + " tiles, an enemy it can see (not a boss)"], ["WIND-UP", _uiSec(moveWindupFrames("phase_swap"))], ["DAMAGE", _uiX(SWAP_MULT) + " power, flux, within " + SWAP_BURST + " tile of the spot it left"], ["EFFECT", "It swaps places with the nearest enemy, and a goo burst at the spot it left hits it there"]],
    "VENOM BITE":      () => [["REACH", VENOM_RANGE + " tiles (it steps in to bite)"], ["WIND-UP", _uiSec(moveWindupFrames("venom_bite"))], ["DAMAGE", _uiX(VENOM_MULT) + " power, piercing"], ["POISON", "its hits " + Math.round(VENOM_CUT * 100) + "% weaker for " + _uiSec(VENOM_POISON)], ["MARK", "your side's next " + VENOM_MARK + " hits on it deal " + Math.round(VENOM_BONUS * 100) + "% more (within " + _uiSec(VENOM_FRAMES) + ")"]],
    "SHOCK ZAP":       () => [["REACH", ZAP_RANGE + " tiles, an enemy it can see"], ["WIND-UP", _uiSec(moveWindupFrames("shock_zap"))], ["DAMAGE", _uiX(ZAP_MULT) + " power, electric"], ["EFFECT", "A zap from its shell: the enemy's wind-up is broken (GLITCH " + _uiSec(ZAP_GLITCH) + "). Its KINETIC LAUNCHER is as it was"]],
    "SKATE CHARGE":    () => [["REACH", SKATE_RANGE + " tiles, in a straight line"], ["WIND-UP", _uiSec(moveWindupFrames("skate_charge"))], ["DAMAGE", _uiX(SKATE_MULT) + " power, slashing, ice, to every enemy on its line"], ["EFFECT", "It skates through them: each is slowed to " + Math.round(SKATE_SLOW_F * 100) + "% of its speed for " + _uiSec(SKATE_SLOW)]],
    "BASH":            () => [["REACH", BASH_RANGE + " tiles (it steps in to ram)"], ["WIND-UP", _uiSec(moveWindupFrames("bash"))], ["DAMAGE", _uiX(BASH_MULT) + " power, crushing"], ["EFFECT", "Rams the nearest enemy: pushed " + BASH_PUSH + " tile, stunned " + _uiSec(BASH_STUN)]],
    "CAPACITOR DISCHARGE": () => [["WIND-UP", "none: you release it (its squad card's ⚡ chip, or here)"], ["CHARGES", "1 every " + _uiSec(moveWindupFrames("capacitor_discharge")) + ", up to " + CAP_MAX + ", standing still"], ["REACH", CAP_REACH + " tiles, then it chains " + CAP_HOP + " tiles at a time"], ["DAMAGE", _uiX(CAP_MULT) + " power a charge, to each of 1 + the charges enemies"]],
    "CHOMP":           () => [["REACH", MAW_RANGE + " tiles"], ["WIND-UP", _uiSec(moveWindupFrames("chomp"))], ["DAMAGE", _uiX(MAW_MULT) + " power"], ["EFFECT", "The fangs slam down: the target is frozen stiff for " + _uiSec(MAW_STUN) + " and everything within " + MAW_SLOW_R + " tiles of it is slowed"]],
};

// A form's everyday attack where it has a name of its own (a Mage's shot, EVOLUTIONS[x].shot; the Thermite Burrower's hit, EVOLUTIONS[x].hit; the follower combat redesign, docs/FOLLOWER-COMBAT-REDESIGN.md), as rows read off the constants.
const SHOT_INFO = {
    "FIREBALL":        () => [["DAMAGE", _uiX(MAGE_SHOT_MULT) + " special attack"], ["WIND-UP", _uiSec(MAGE_SHOT_WINDUP) + ", standing still"], ["EVERY", _uiSec(MAGE_SHOT_REST) + " after it (less with attack-speed cards)"], ["EFFECT", "A ball of fire at the nearest enemy: a direct hit"]],
    "BURROW STRIKE":   () => [["REACH", BURROW_REACH + " tiles, an enemy it can see"], ["DAMAGE", _uiX(BURROW_MULT) + " its plain hit, as it erupts"], ["REST", _uiSec(BURROW_REST) + " after an eruption"], ["EFFECT", "It dives into the floor, travels under it to the enemy and erupts beneath it. Under the floor nothing can target or hurt it"]],
    "CORRODE SHOT":    () => [["DAMAGE", _uiX(MAGE_SHOT_MULT) + " special attack"], ["WIND-UP", _uiSec(MAGE_SHOT_WINDUP) + ", standing still"], ["EVERY", _uiSec(MAGE_SHOT_REST) + " after it (less with attack speed)"], ["EFFECT", "Eats the target's armour for " + _uiSec(ROT_SHRED_FRAMES) + " (×" + ROT_SHRED + " defence), weaker within " + ROT_SPLASH_R + " tiles of it"]],
    "NECTAR STING":    () => [["DAMAGE", _uiX(typeof ELEMENT_ATTACKS !== "undefined" && ELEMENT_ATTACKS.blossom ? ELEMENT_ATTACKS.blossom.mult : 0.45) + " its attack, piercing (1 WILL; without WILL a quarter)"], ["STOCKPILE", "+" + SUNDEW_NECTAR_STEP + "% a sting; four fill it (the pips over it), and then SWEET SCENT heals"], ["EFFECT", "Its stem arches over and stabs with its blade-leaf"]],
    "SEED SHOT":       () => [["DAMAGE", _uiX(MAGE_SHOT_MULT) + " special attack, Elemental"], ["WIND-UP", _uiSec(MAGE_SHOT_WINDUP) + ", standing still"], ["EVERY", _uiSec(MAGE_SHOT_REST) + " after it (less with attack-speed cards)"], ["EFFECT", "Its vines rear round a glowing seed and fling it at the nearest enemy, like a sling: a direct hit, and it MENDs, as every BLOOM hit"]],
    "CHAIN LIGHTNING": () => [["DAMAGE", _uiX(MAGE_SHOT_MULT) + " special attack on the first enemy"], ["WIND-UP", _uiSec(MAGE_SHOT_WINDUP) + ", standing still"], ["EVERY", _uiSec(MAGE_SHOT_REST) + " after it (less with attack-speed cards)"], ["JUMPS", "On to the nearest enemy not yet struck within " + CHAIN_HOP + " tiles, each " + Math.round(CHAIN_SHARE * 100) + "% of the one before, while one is that near"], ["EFFECT", "A close cluster carries it far; a gap breaks it"]],
};
const _uiLabel = id => { const e = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(x => x.id === id) : null; return e ? e.label.toUpperCase() : String(id || "").toUpperCase(); };
const _uiColour = id => { const e = typeof ELEMENTS !== "undefined" ? ELEMENTS.find(x => x.id === id) : null; return e ? e.color : "#8aa0c8"; };

// ── THE DATA: { title, sub, color, attacks: [section], jobs: [section], stats: [section] }, a section = { h, rows: [[k, v]], note } ──
function followerInfo(a) {
    const ev = typeof evolvedDef === "function" ? evolvedDef(a) : null, role = a.role === "hybrid" ? "brawler" : a.role, r = ROLE_INFO[role] || ROLE_INFO.brawler;
    const ps = typeof PLAY_STYLES !== "undefined" ? (PLAY_STYLES.find(p => p.id === a.playStyle) || PLAY_STYLES[1]) : null;
    const title = typeof unitTypeLabel === "function" ? unitTypeLabel(a) : _uiLabel(a.element) + " " + r.label;
    const out = { kind: "follower", unit: a, title, sub: _uiLabel(a.element) + " · LV " + (a.level || 1) + (ev ? " · EVOLVED" : ""), color: _uiColour(a.element), attacks: [], jobs: [], stats: [] };
    // ATTACKS
    out.attacks.push({ h: "ATTACK STYLE · " + r.label, note: r.text, rows: ps ? [["PLAY STYLE", ps.label + " (" + ps.blurb.toLowerCase() + ")"], ["ENGAGE REACH", _uiX(ps.reach) + " its usual"]] : [] });
    { const mainName = ev && (ev.shot || ev.hit); if (mainName && SHOT_INFO[mainName]) out.attacks.push({ h: "MAIN ATTACK · " + mainName, note: ev.name, rows: SHOT_INFO[mainName]() }); }
    {   // its SPECIAL ATTACK, a card attack set in its own menu (js/cards.js equipSpecial): its primary attack while set (js/combat.js cardAttackTry)
        const sc = typeof equipSpecial === "function" ? equipSpecial(a) : null;
        if (sc) { const A = sc.attack, w = typeof cardAttackReadyIn === "function" ? cardAttackReadyIn(a) : 0;
            out.attacks.push({ h: "SPECIAL ATTACK · " + sc.name, note: "Its primary attack while the card is set (SPECIAL ATTACK, on the roster and its squad card). It makes no everyday hit between strikes.",
                rows: [["REACH", A.reach + " tiles, an enemy it can see"], ...(A.mult ? [["DAMAGE", _uiX(A.mult) + " its attack"]] : []), ["WAIT", A.wait + " s " + (A.lasts ? "after it ends (it lasts " + A.lasts + " s)" : "between strikes")], ["READY", w > 0 ? "in " + Math.ceil(w / 60) + " s" : "now"], ["EFFECT", sc.text]] }); }
    }   // a form's named everyday attack (FIREBALL, CHAIN LIGHTNING, BURROW STRIKE)
    const mvd = typeof followerMoveDef === "function" ? followerMoveDef(a) : ev;   // (its form's moves, or BASH before it evolves: js/moves.js, build 2026-11-07ss)
    const altIds = mvd && typeof evoMoveIds === "function" ? evoMoveIds(mvd).filter(id => typeof evoMoveAllowed !== "function" || evoMoveAllowed(a, mvd, id)) : [];
    if (altIds.length) {
        // ITS ALTERNATES (js/moves.js "THE ALTERNATE ATTACK IS A CHOSEN MODE"): each move it may use, what it does, and the mode it fights in now: its NORMAL ATTACK or one alternate it is locked to
        const cur = typeof evoMoveOf === "function" ? evoMoveOf(a, mvd) : null, w = a._altWind > 0 ? Math.ceil(a._altWind / 60) : 0, who = ev ? ev.name : "BEFORE IT EVOLVES";
        const cools = typeof altCools === "function" && altCools(a), cd = cools ? Math.max(0, Math.ceil(((a._altReadyAt || 0) - (typeof frame !== "undefined" ? frame : 0)) / 60)) : 0;   // (a Brawler cools down after its second attack instead of winding up before it: build 2026-11-10a)
        const timeRows = rows => cools ? rows.map(r => r[0] === "WIND-UP" ? ["COOLDOWN", r[1]] : r) : rows;
        const both = !!cur && !!a.altBoth;   // (BOTH, js/moves.js: its normal attack and that move, switching on their own)
        for (const id of altIds) { const m = MOVES[id], on = !!cur && cur.id === id, cap = on && m.manual;
            out.attacks.push({ h: "ALTERNATE · " + m.name + (on ? (both ? " · BOTH, " + (a._altTurn ? "ITS TURN" : "EVERYDAY HITS NOW") : " · LOCKED ON") : ""), note: who + (cap ? " · " + (a._cap || 0) + " OF " + CAP_MAX + " CHARGES" + ((a._cap || 0) < CAP_MAX ? " (IT STANDS STILL TO CHARGE)" : " · FULL") : on ? (w ? " · WINDING UP, " + w + " S (IT STANDS STILL)" : a._altLive ? (cools ? " · ITS EFFECT IS ON: ITS COOLDOWN STARTS WHEN IT ENDS" : " · ITS EFFECT IS ON: IT WINDS UP AGAIN WHEN IT ENDS") : cd ? " · COOLING DOWN, " + cd + " S" : " · READY") : ""), rows: timeRows(MOVE_INFO[m.name] ? MOVE_INFO[m.name]() : []),
                choices: cap ? [{ id: "release", label: "RELEASE ⚡ " + (a._cap || 0) + "/" + CAP_MAX + (typeof capacitorWhyNot === "function" && capacitorWhyNot(a) ? " · " + capacitorWhyNot(a) : ""), act: () => capacitorRelease(a) }] : undefined, unit: a }); }
        const bothLine = id => { const m = MOVES[id]; return m.full ? "its everyday hits until its meter is full, then " + m.name + " until it has used it" : m.manual ? "charging " + m.name + " to full, then its everyday hits until you release it" : "its everyday hits for " + BOTH_REST_SECONDS + " s, then " + m.name; };
        out.attacks.push({ h: "ATTACK", note: "Its normal attack, or one alternate it is locked to until you switch it back, or BOTH, switching on its own (" + (altIds.length === 1 ? bothLine(altIds[0]) : altIds.map(id => MOVES[id].name + ": " + bothLine(id)).join("; ")) + "). Locked on an alternate, " + (cools ? "a Brawler strikes the moment an enemy is in reach, then cools down once the strike's effect is over (it can move meanwhile)." : "it winds up standing still, strikes, and winds up again when the strike's effect is over.") + " On an alternate it makes no other attack, an attack order included.",
            choices: [{ id: null, label: "NORMAL ATTACK", on: !cur }].concat(altIds.map(id => ({ id, label: MOVES[id].name, on: !!cur && cur.id === id && !both })), altIds.map(id => ({ id: "both:" + id, label: "BOTH · " + MOVES[id].name, on: both && cur.id === id }))), unit: a });
    }
    const altLocked = ev && !altIds.length && typeof energyAltOpen === "function" && !energyAltOpen(a) && mvd && typeof evoMoveIds === "function" && evoMoveIds(mvd).length;   // ENERGY CARDS (js/energy.js): its second attack locked
    if (altLocked) out.attacks.push({ h: "SECOND ATTACK · " + evoMoveIds(mvd).map(id => MOVES[id].name).join(", ") + " · LOCKED", note: "It needs " + ENERGY.altNeeds + " " + energyLabel(a.element) + " energy card in its ENERGY slots (the roster) to use it.", rows: [] });
    else if (ev && mvd && typeof evoMoveIds === "function" && evoMoveIds(mvd).length > 1 && typeof energyAlt2Open === "function" && !energyAlt2Open(a)) out.attacks.push({ h: "EXTRA ATTACK · " + evoMoveIds(mvd).slice(1).map(id => MOVES[id].name).join(", ") + " · LOCKED", note: "It needs " + ENERGY.alt2Needs + " " + energyLabel(a.element) + " energy cards in its ENERGY slots (the roster) to use it.", rows: [] });   // (its form's extra attack: build 2026-11-13u)
    else if (ev && !altIds.length) out.attacks.push({ h: "SIGNATURE", note: "The " + ev.name + " has no signature move yet.", rows: [] });   // (none now: every form has a second attack since build 2026-11-07ss)
    else if (!ev) {
        const f = typeof evolutionFor === "function" ? evolutionFor(a) : null;
        if (typeof energyFor === "function" && energyFor(a) && !energySlots(a)[0]) out.attacks.push({ h: "NO ELEMENT", note: "Put an energy card in its ENERGY slot (the roster): it takes that card's element, and at level " + EVOLVE_LEVEL + " it evolves into its element's form (the card is used up). Energy cards come in Pack 1 and Series 2.", rows: [] });   // (ENERGY CARDS, js/energy.js)
        else out.attacks.push({ h: "SIGNATURE", note: f ? "Evolves at level " + EVOLVE_LEVEL + " into the " + f.name + " (and gets ×" + EVOLVE_MULT + " health, attack and special attack)" + (f.move ? ", with the move " + f.move + ":" : ". It has no signature move yet.") : "No form for this element and role yet.", rows: f && MOVE_INFO[f.move] ? MOVE_INFO[f.move]().map(r => r[0] === "WIND-UP" && typeof altCools === "function" && altCools(a) ? ["COOLDOWN", r[1]] : r) : [] });   // (a Brawler's is a cooldown: build 2026-11-10a)
    }
    { const ab = typeof techAbilityInfo === "function" ? techAbilityInfo(a) : null; if (ab) out.attacks.push(ab); }   // a technician's ability: what it does, its numbers, when it is ready (js/techabilities.js)
    { const ab2 = typeof techAbility2Info === "function" ? techAbility2Info(a) : null; if (ab2) out.attacks.push(ab2); }   // the Thermite Burrower's second ability, FAULTLINE
    const u = typeof followerUltimate === "function" ? followerUltimate(a) : null;   // (its form's own Ultimate, js/elements.js; an unevolved follower has none since build 2026-11-09b)
    if (u) out.attacks.push({ h: "ULTIMATE · " + u.name.toUpperCase(), note: (u.desc || u.name) + ". When it is fully charged, tap ULTIMATE on its squad card (or double-tap the follower).", rows: typeof a.ultimateCharge === "number" ? [["CHARGE", Math.round(Math.min(100, a.ultimateCharge)) + "%"]] : [] });
    else if (typeof followerUltLocked === "function" && followerUltLocked(a)) out.attacks.push({ h: "ULTIMATE · " + FORM_ULTIMATES[a.evolved].name.toUpperCase() + " · LOCKED", note: "It needs " + ENERGY.ultNeeds + " " + energyLabel(a.element) + " energy cards in its ENERGY slots (the roster) to use it.", rows: [] });   // (ENERGY CARDS, js/energy.js)
    else if (typeof followerUltPending === "function" && followerUltPending(a)) out.attacks.push({ h: "ULTIMATE · NOT DESIGNED YET", note: "The " + (ev ? ev.name : "form") + " has no Ultimate of its own yet: none until it is designed.", rows: [] });   // (flagged: the owner, 2026-11-09)
    for (const el of typeof energyHybrids === "function" ? energyHybrids(a) : []) out.attacks.push({ h: "HYBRID · " + energyLabel(a.element) + " + " + energyLabel(el) + " · NOT DESIGNED YET", note: "A " + energyLabel(el) + " energy card in its ENERGY slots: the hybrid attack it will unlock has not been designed yet.", rows: [] });   // (ENERGY CARDS: the owner's "hybrid attacks", to design)
    // JOBS: the squad, or a room it holds (js/party.js)
    out.jobs.push({ h: "RIGHT NOW", rows: [["STANCE", a.post && typeof partyRoomName === "function" ? "HOLDING THE " + partyRoomName(a.post).toUpperCase() : typeof partyIsMember === "function" && partyIsMember(a) ? "IN THE SQUAD, FOLLOWING YOU" : a.stance === "hold" || (a.job && a.job.type === "move") ? "HOLDING A POST" : "FOLLOWING YOU"]] });
    // STATS
    const xpp = typeof xpProgress === "function" ? xpProgress(a) : null;   // its XP, and how far it is from evolving (js/levels.js)
    out.stats.push({ h: "VITALS", rows: [["LEVEL", String(a.level || 1)]].concat(xpp ? [["XP", xpText(xpp)]] : [], xpp && xpp.evo ? [["EVOLVES", xpEvoText(xpp).replace(/^EVOLVES /, "")]] : [],
        [["HEALTH", Math.max(0, Math.round(a.health || 0)) + " / " + Math.round(a.maxHealth || 0)], ["POWER", String(Math.round(a.power || 0))], ["SPEED", ((a.moveSpeed || 0) * 1000).toFixed(0)]], _uiBirthRows(a)) });
    if (a.stats) out.stats.push({ h: "BASE STATS" + (a.personality ? " · " + String(a.personality).toUpperCase() : ""), rows: Object.keys(a.stats).filter(k => k !== "resonance").map(k => [k.replace(/([A-Z])/g, " $1").toUpperCase(), String(a.stats[k])]) });
    const tr = [], add = (tab, key, label) => { const t = tab && key && tab[key]; if (t) tr.push([label, t.name + " — " + t.description]); };
    if (typeof COMBAT_TRAITS !== "undefined") { add(COMBAT_TRAITS, a.combatTrait, "COMBAT"); add(NATURAL_TRAITS, a.naturalTrait, "NATURE"); add(PERKS, a.perk, "PERK"); }
    if (tr.length) out.stats.push({ h: "TRAITS", rows: tr });
    return out;
}

// A clone TYPE (a species and class), from a Clone Bay card: what the clone does, its job, its numbers and its price.
function cloneTypeInfo(species, cls) {
    const S = SPECIES[species], d = (typeof getClassDef === "function" ? getClassDef(S, cls) : S[cls]) || S.scout;
    const special = d.abdomenAttack || (d.rangeDamage && d.rangeDamage > 0);
    const out = { kind: "clone", title: species.toUpperCase() + " " + cls.toUpperCase(), sub: "CLONE · " + (typeof CLONE_COSTS !== "undefined" && CLONE_COSTS[species] ? CLONE_COSTS[species].splicesNeeded + " SPLICES · " + cloneShardCost(species, cls) + " SHARDS" : ""), color: S.color, species, cls, attacks: [], jobs: [], stats: [] };
    const P = typeof CLONE_POWER_MULT === "number" ? CLONE_POWER_MULT : 1, H = typeof CLONE_HEALTH_MULT === "number" ? CLONE_HEALTH_MULT : 1;   // (a clone's numbers are its species' times these, at level 5: js/config.js)
    out.attacks.push({ h: "BITE", note: "Fights up close, as its species does: it rears back (the ring over it), then bites.", rows: [["POWER", String(Math.round(d.power * P))], ["REACTS IN", d.reactionSpeed + " frames when hit"]] });
    out.attacks.push(special ? { h: "SPECIAL · " + (CLONE_SPECIAL[species] || "SPECIAL"), note: CLONE_SPECIAL_TEXT[species] || "A ranged attack from the rear.", rows: [["DAMAGE", String(Math.round(d.rangeDamage * P))], ["EVERY", _uiSec(d.abdomenCooldown)], ["NOTE", "It will not turn when hit from behind"]] }
                              : { h: "SPECIAL", note: "None: a " + cls + " has no ranged attack" + (species === "ant" || species === "beetle" ? " (an " + species + " never does)." : " (the striker and tank do)."), rows: [] });
    out.jobs.push({ h: "RIGHT NOW", note: "A clone fights beside you: it follows, and holds where it is told to.", rows: [] });
    out.stats.push({ h: "VITALS", rows: [["HEALTH", String(Math.round(d.health * H))], ["POWER", String(Math.round(d.power * P))], ["SPEED", String(Math.round(d.moveSpeed * 1000))], ["SIZE", d.width + " × " + d.height]] });
    if (typeof cloneCap === "function") out.stats.push({ h: "LIMITS", rows: [["CLONES AT ONCE", String(cloneCap())], ["WHO GROWS IT", typeof cloneWho === "function" && cloneWho() ? cloneWho() : "ANY CLASS"], ["COST", cloneShardCost(species, cls) + " shards and " + (CLONE_COSTS[species] ? CLONE_COSTS[species].splicesNeeded : "?") + " splices"]] });
    return out;
}
// A live clone: its type's info, with its own health.
function cloneInfo(a) { const o = cloneTypeInfo(a.speciesName, a.className || "scout"); o.unit = a; o.stats[0].rows[0] = ["HEALTH", Math.max(0, Math.round(a.health || 0)) + " / " + Math.round(a.maxHealth || 0)]; return o; }
// a follower's birth and its hp stat (js/breeding.js): where it came from, and the hp stat it was born with (a death no longer wears it down: the owner, 2026-11-01)
function _uiBirthRows(a) {
    if (!a || a.isFollower !== true || a.isClone || !a.base) return [];
    const n = v => String(Math.round(v * 10) / 10);   // (a bred follower's base is kept to three places: the screen says one)
    return [["ORIGIN", a.bred ? "BRED · GEN " + a.bred.gen : "RECRUITED"], ["HP STAT", n(a.base.hp)]];
}
function unitInfo(a) { return a && a.isClone ? cloneInfo(a) : followerInfo(a); }

// ── THE OVERLAY ──
function unitInfoClose() { const r = document.getElementById("unitInfo"); if (r && r.parentNode) r.parentNode.removeChild(r); }
function _uiEl(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function _uiRenderSections(body, secs) {
    body.textContent = "";
    for (const s of secs) {
        const sec = _uiEl("div", "ui-sec"); sec.appendChild(_uiEl("div", "ui-h", s.h));
        if (s.note) sec.appendChild(_uiEl("div", "ui-note", s.note));
        if (s.choices) { const row = _uiEl("div", "ui-choices"); for (const c of s.choices) { const b = _uiEl("button", "ui-choice" + (c.on ? " on" : ""), c.label); b.addEventListener("click", ev => { ev.stopPropagation(); if (c.act) c.act(); else if (s.unit && typeof followerAltChoose === "function") followerAltChoose(s.unit, c.id); if (typeof unitInfoOpen === "function") unitInfoOpen(s.unit, "attacks"); }); row.appendChild(b); } sec.appendChild(row); }
        for (const r of s.rows || []) { const row = _uiEl("div", "ui-row"); row.appendChild(_uiEl("span", "ui-k", r[0])); row.appendChild(_uiEl("span", "ui-v", r[1])); sec.appendChild(row); }
        body.appendChild(sec);
    }
}
// info: from followerInfo / cloneInfo / cloneTypeInfo. `tab`: which tab to open on.
function unitInfoShow(info, tab) {
    unitInfoClose();
    const root = _uiEl("div", "ui-over"); root.id = "unitInfo"; root.addEventListener("click", () => unitInfoClose());
    const card = _uiEl("div", "ui-card"); card.style.setProperty("--c", info.color); card.addEventListener("click", e => e.stopPropagation());
    const head = _uiEl("div", "ui-head");
    const cv = _uiEl("canvas", "ui-art"); cv.width = 96; cv.height = 96; head.appendChild(cv);
    if (info.unit && typeof cardArtUnitClass === "function") cardArtMark(cv, cardArtUnitClass(info.unit));   // a follower's picture on its backdrop (js/cardart.js)
    const ht = _uiEl("div", "ui-ht"); ht.appendChild(_uiEl("div", "ui-title", info.title)); ht.appendChild(_uiEl("div", "ui-sub", info.sub)); head.appendChild(ht);
    const x = _uiEl("button", "ui-close", "✕"); x.addEventListener("click", () => unitInfoClose()); head.appendChild(x); card.appendChild(head);
    const tabs = _uiEl("div", "ui-tabs"), body = _uiEl("div", "ui-body");
    const show = id => { tabs.querySelectorAll(".ui-tab").forEach(t => t.classList.toggle("on", t.getAttribute("data-tab") === id)); _uiRenderSections(body, info[id]); };
    [["attacks", "ATTACKS"], ["jobs", "JOBS"], ["stats", "STATS"]].forEach(t => { const b = _uiEl("button", "ui-tab", t[1]); b.setAttribute("data-tab", t[0]); b.addEventListener("click", () => show(t[0])); tabs.appendChild(b); });
    card.appendChild(tabs); card.appendChild(body); root.appendChild(card); document.body.appendChild(root);
    show(tab || "attacks");
    // the picture
    try {
        const g = cv.getContext("2d");
        if (info.kind === "clone" && typeof drawCloneArt === "function") drawCloneArt(g, { key: info.species + "_" + info.cls, speciesName: info.species, className: info.cls, ready: true }, 48, 74, 1.5);
        else if (info.unit && typeof _ccThumb === "function") { const t = _uiEl("canvas"); t.width = 72; t.height = 72; _ccThumb(t, info.unit); g.drawImage(t, 0, 0, 96, 96); }
    } catch (e) { /* a picture must never take the info down */ }
    return root;
}
function unitInfoOpen(unit, tab) { return unit ? unitInfoShow(unitInfo(unit), tab) : null; }
function unitInfoOpenType(species, cls, tab) { return unitInfoShow(cloneTypeInfo(species, cls), tab); }
window.addEventListener("keydown", e => { if (e && e.key === "Escape") unitInfoClose(); });
