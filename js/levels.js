// ─────────────────────────────────────────────────────────
//  LEVELS AND STATS  —  one system for every unit
// ─────────────────────────────────────────────────────────
// REPORTED: "There needs to be a level and stats system like in Pokémon for all
// entities. All followers have a base stat modified by their personalities,
// then the predators and clones should have a similar system, and they should
// have the level and type of npc visible next to their health bars."
//
// Followers and clones gain XP from KILLS; a creature's level is the arena's
// (creatureLevel below; the spawner and the tutorial set their own); the cap is
// 100; a unit that dies LOSES SOME XP.
//
// THE MODEL. Every unit has a LEVEL and a set of BASE stats — what it is at
// level LEVEL_START. Its real stats are the base scaled by its level:
//
//     stat(L) = base × levelFactor(L),   levelFactor(L) = (L + 10) / 15
//
// so ×1 at level 5, ×2 at 20, ×4 at 50, ×7.3 at 100. The bases are what the
// game already had, so nothing changes for a level-5 unit:
//   FOLLOWERS  BASE_STATS × their PERSONALITY (species.js applyPersonality) —
//              hp, attack, defense, specialAttack, accuracy, will are levelled;
//              speed is not (it is how fast it walks: the map's pace).
//   CREATURES  their species/class numbers (species.js SPECIES), plus a
//              DEFENSE by class (PRED_DEFENSE).
//   CLONES     their species × CLONE_*_MULT, levelled the same way.
//
// DEFENSE works for everyone: applyDamage takes a hit down by
// ref / (ref + DEF × 0.6), where ref = 10 × levelFactor of the ATTACKER (or of
// the target, for something with no level). So a level-5 follower's defense 10
// against a level-5 bite is ×0.625, and a high-level attacker punches through.
//
// XP. Total XP to reach level L is L³ (Pokémon's "medium" curve: 125 at 5,
// 1000 at 10, 125 000 at 50, 1 000 000 at 100). A creature killed is worth
// XP_YIELD[its class] × its level / 5. The unit that landed the kill gets
// XP_KILLER_SHARE of it and your units within XP_SHARE_RANGE share the rest; a
// kill by your gun or an effect goes to the units nearby (XP_ASSIST_ONLY of
// it). THE SQUAD SHARES (asked: "make it to where the technicians level up
// faster, or the experience is shared throughout the squad"; chosen: shared):
// a kill by you or by a member of your squad of three feeds the rest of the
// squad wherever they stand, as if they were near it. A unit that dies loses
// XP_DEATH_LOSS of its progress toward its next level — never a level.

const LEVEL_CAP        = 100;    // followers and clones
const PRED_LEVEL_MAX   = 999;    // a creature can be set past the cap (the number shown is still its real level)
const LEVEL_START      = 5;
const XP_KILLER_SHARE  = 0.6;
const XP_SHARE_RANGE   = 4;      // tiles
const XP_ASSIST_ONLY   = 0.5;    // a kill with no unit's last blow: this share to those near
const XP_DEATH_LOSS    = 0.25;   // of the progress toward the next level
// (Doubled after a first playtest: the squad has to be able to keep up with what it fights.)
const XP_YIELD = { nymph: 20, worker: 60, scout: 100, striker: 140, tank: 200, boss: 600 };
// A predator's armour at level 5, by class; a beetle's shell adds BEETLE_DEFENSE.
const PRED_DEFENSE   = { nymph: 0, worker: 0, scout: 0, striker: 2, tank: 5, boss: 8 };
const BEETLE_DEFENSE = 3;
// Followers' stats that grow with level (speed is how fast it walks — not these).
const LEVELLED_STATS = ["hp", "attack", "defense", "specialAttack", "accuracy", "will"];

function levelFactor(L) { return ((L || LEVEL_START) + 10) / 15; }
function xpForLevel(L) { const n = Math.max(1, Math.min(LEVEL_CAP, L || 1)); return n * n * n; }
function levelFromXp(xp) {
    let L = 1;
    while (L < LEVEL_CAP && xpForLevel(L + 1) <= xp) L++;
    return L;
}
function unitLevel(u) { return (u && u.level) || null; }

// ── THE ARENA'S LEVEL ─────────────────────────────────────
// What the facility's creatures are made at: the top of the spawner's band (js/facilityspawn.js FP_SPAWN.levels gives each its own level in the band; the tutorial's
// assault sets its own), never under LEVEL_START. A new clone comes out at it (js/clone.js makeClone), and a recruit RECRUIT_BEHIND under it (never under
// LEVEL_START), like a wild Pokémon found where you are.
function creatureLevel() {
    const band = typeof FP_SPAWN !== "undefined" && FP_SPAWN && FP_SPAWN.levels;
    return Math.max(LEVEL_START, band ? band[1] : LEVEL_START);
}
// ── FOLLOWERS ─────────────────────────────────────────────
const RECRUIT_BEHIND = 3;
function recruitLevel() { return Math.max(LEVEL_START, creatureLevel() - RECRUIT_BEHIND); }
function levelledStats(base, L) {
    const k = levelFactor(L), out = Object.assign({}, base);
    for (const s of LEVELLED_STATS) if (typeof base[s] === "number") out[s] = Math.max(1, Math.round(base[s] * k));
    return out;
}
// ASKED: "give the followers a little bit extra health." Every follower's MAX HEALTH is this much above the hp stat its level and personality give it (applied where the stats are derived, so it holds through
// every level-up, evolution, re-roll and reload). The stat itself and its attack are not touched.
const FOLLOWER_HP_MULT = 1.25;
// Set up a follower's level from its creation stats (taken as its BASE), or
// from a saved/queued entry carrying { base, level, xp }. `fresh`: full health.
function initFollowerLevel(npc, entry) {
    if (!npc || !npc.stats) return npc;
    npc.base  = entry && entry.base ? Object.assign({}, entry.base) : Object.assign({}, npc.stats);
    if (entry && entry.hpStat !== undefined && entry.base) npc.base.hp = entry.hpStat;
    npc.level = Math.max(1, Math.min(LEVEL_CAP, (entry && entry.level) || LEVEL_START));
    npc.xp    = entry && Number.isFinite(entry.xp) ? Math.max(xpForLevel(npc.level), entry.xp) : xpForLevel(npc.level);
    _applyFollowerLevel(npc, true);
    return npc;
}
function _applyFollowerLevel(npc, fresh) {
    const was = npc.maxHealth || 0;
    npc.stats = levelledStats(npc.base, npc.level);
    // An EVOLVED follower (js/evolution.js) is tougher and hits harder, for good.
    if (npc.evolved && typeof EVOLVE_MULT === "number") { npc.stats.hp = Math.round(npc.stats.hp * EVOLVE_MULT); npc.stats.attack = Math.round(npc.stats.attack * EVOLVE_MULT); }
    // EQUIP CARDS (js/cards.js): what its worn cards add, a share of the numbers above, summed per stat (two +50% are +100%). Made from the base here every time, so a bonus is never added twice and goes with the card.
    const cardK = typeof equipMult === "function" ? s => equipMult(npc, s) : () => 1, kAtk = cardK("attack"), kSp = cardK("specialAttack"), kDef = cardK("defense"), kHp = cardK("maxHealth");
    // (a stat a card moves is kept to three places, not rounded to a whole number: a +5% on a stat of 9 is +5%, not +0%; the screens round it to show it. The maximum health is a whole number as it was.)
    const cardStat = (v, k) => Math.max(1, Math.round(v * k * 1000) / 1000);
    if (kAtk !== 1) npc.stats.attack = cardStat(npc.stats.attack, kAtk);
    if (kSp !== 1) npc.stats.specialAttack = cardStat(npc.stats.specialAttack, kSp);
    if (kDef !== 1) npc.stats.defense = cardStat(npc.stats.defense, kDef);
    npc.maxHealth = Math.round(npc.stats.hp * FOLLOWER_HP_MULT * kHp);
    npc.power = npc.stats.attack;
    // Fresh: full health. Else a gain in maximum health is added to the current health (a level-up, an evolution, a card put on) and a loss comes off it the same (a card taken off), never to under 1: a card put on and off again does not heal.
    if (fresh) { npc.health = npc.maxHealth; npc.currentWill = npc.stats.will; }
    else { const hp = npc.health || 0; npc.health = Math.min(npc.maxHealth, Math.max(Math.min(1, hp), hp + npc.maxHealth - was)); }
}

// ── PREDATORS AND CLONES ──────────────────────────────────
// What it is at level 5, kept so a level change (a clone's level-up) can be
// worked out again from it.
function _predBase(p) {
    if (!p.base) {
        const cls = p.className || "scout";
        const def = (PRED_DEFENSE[cls] !== undefined ? PRED_DEFENSE[cls] : 0) + (p.speciesName === "beetle" ? BEETLE_DEFENSE : 0);
        p.base = { hp: p.maxHealth, attack: p.power, defense: def, special: p.rangeDamage || 0 };
    }
    return p.base;
}
function _applyPredLevel(p, fresh) {
    const b = _predBase(p), k = levelFactor(p.level), was = p.maxHealth || 0;
    // a clone's upgrades (js/mutator.js CLONE_UPGRADES: ARMOR PLATING, SERRATED ARMS) multiply its health and power at every level
    const uh = p.isClone && typeof cloneUpStat === "function" ? cloneUpStat(p, "health", 1) : 1, up = p.isClone && typeof cloneUpStat === "function" ? cloneUpStat(p, "power", 1) : 1;
    p.maxHealth = Math.max(1, Math.round(b.hp * k * uh));
    p.power     = Math.max(1, Math.round(b.attack * k * up));
    p.def       = Math.round(b.defense * k);
    if (b.special) p.rangeDamage = Math.round(b.special * k * up);
    if (fresh) p.health = p.maxHealth;
    else p.health = Math.min(p.maxHealth, (p.health || 0) + Math.max(0, p.maxHealth - was));
}
// Give a creature (or a clone) its level. Its current numbers are taken as its
// level-5 base the first time.
function setPredatorLevel(p, L, fresh) {
    if (!p) return p;
    _predBase(p);
    p.level = Math.max(1, Math.min(p.isClone ? LEVEL_CAP : PRED_LEVEL_MAX, L || LEVEL_START));
    if (p.isClone && !Number.isFinite(p.xp)) p.xp = xpForLevel(p.level);
    _applyPredLevel(p, fresh !== false);
    return p;
}

// ── DEFENSE ───────────────────────────────────────────────
function unitDefense(t) {
    if (!t) return 0;
    if (t.stats && typeof t.stats.defense === "number") return t.stats.defense;   // a follower
    return t.def || 0;                                                         // a predator or clone
}
// The share of a hit that gets through `target`'s defense, from `source`.
function defenseMult(target, source) {
    const D = unitDefense(target);
    if (!(D > 0)) return 1;
    const ref = 10 * levelFactor(unitLevel(source) || unitLevel(target) || LEVEL_START);
    return ref / (ref + D * 0.6);
}

// ── XP ────────────────────────────────────────────────────
function _xpUnit(a) { return !!a && !a.dead && a.team === "green" && (a.isFollower || a.isClone) && Number.isFinite(a.level); }
function gainXp(u, n) {
    if (!_xpUnit(u) || !(n > 0)) return 0;
    if (!Number.isFinite(u.xp)) u.xp = xpForLevel(u.level);
    u.xp += n;
    let ups = 0;
    while (u.level < LEVEL_CAP && u.xp >= xpForLevel(u.level + 1)) { u.level++; ups++; }
    if (ups) {
        if (u.isClone) _applyPredLevel(u, false); else _applyFollowerLevel(u, false);
        if (typeof floatingTexts !== "undefined")
            floatingTexts.push({ world: true, x: u.x, y: u.y, text: "▲ LEVEL " + u.level, color: "#ffee66", life: 70, vy: -0.07, size: 12 });
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: u.x, y: u.y, color: "#ffee66", radius: 0.6, life: 22 });
        if (!u.isClone && typeof evoCheck === "function") evoCheck(u);   // reaching EVOLVE_LEVEL (10): it may evolve (js/evolution.js)
    }
    return ups;
}
// What a dead creature is worth.
function killXp(p) {
    const y = XP_YIELD[p.className] !== undefined ? XP_YIELD[p.className] : XP_YIELD.scout;
    return Math.round(y * (p.level || LEVEL_START) / LEVEL_START);
}
// Once per dead creature (from the death sweep, game.js).
function awardKillXp(p) {
    if (!p || p._xpGiven || p.team === "green" || p.isClone) return 0;
    p._xpGiven = true;
    const total = killXp(p);
    if (!(total > 0)) return 0;
    const killer = _xpUnit(p.lastAttacker) ? p.lastAttacker : null;
    const squad = typeof partyOn === "function" && partyOn() && typeof partyMembers === "function" ? partyMembers() : [];   // the squad of three (js/party.js)
    const squadKill = (typeof player !== "undefined" && p.lastAttacker === player) || (!!killer && squad.includes(killer));   // yours, or a squad member's: the squad shares it wherever they are
    const near = [];
    for (const a of (typeof actors !== "undefined" ? actors : [])) {
        if (a === killer || !_xpUnit(a)) continue;
        if ((squadKill && squad.includes(a)) || Math.hypot(a.x - p.x, a.y - p.y) <= XP_SHARE_RANGE) near.push(a);
    }
    if (killer) {
        gainXp(killer, near.length ? total * XP_KILLER_SHARE : total);
        if (near.length) for (const a of near) gainXp(a, total * (1 - XP_KILLER_SHARE) / near.length);
    } else if (near.length) {
        for (const a of near) gainXp(a, total * XP_ASSIST_ONLY / near.length);
    }
    return total;
}
// A unit that died: back XP_DEATH_LOSS of the way toward its last level.
function xpAfterDeath(u) {
    if (!u || !Number.isFinite(u.level)) return undefined;
    const floor = xpForLevel(u.level), xp = Number.isFinite(u.xp) ? u.xp : floor;
    return Math.round(floor + (xp - floor) * (1 - XP_DEATH_LOSS));
}

// ── XP PROGRESS: where a unit stands on the XP curve, for the bars and the cards ──
// ASKED: "they will not evolve. I need to see the progress. Add a progress experience bar or something so I know what's going on." The XP was only ever a line on the INFO page. `into` of `ask` is how far
// the unit is through its level (the bar); for a follower that has not evolved, `evo` says how far it is from evolving: the level that does it, the levels and the XP still to go, and how far along the
// way it is from the recruit level (LEVEL_START) to that level. A follower re-rolled to another element evolves on its next level-up whatever its level (js/evolution.js _evoOnLevelUp): its goal is that.
// Null for something with no level. Read by the world bar (js/draw.js drawXpBar), the squad cards (js/party.js), the member's card (js/squadfly.js), the roster (js/commandcenter.js) and the INFO.
function xpProgress(u) {
    if (!u || !Number.isFinite(u.level)) return null;
    const L = Math.max(1, Math.min(LEVEL_CAP, u.level)), xp = Number.isFinite(u.xp) ? u.xp : xpForLevel(L), lo = xpForLevel(L), maxed = L >= LEVEL_CAP;
    const ask = maxed ? 0 : xpForLevel(L + 1) - lo, into = maxed ? 0 : Math.max(0, Math.min(ask, xp - lo));
    const out = { level: L, xp, into, ask, toNext: maxed ? 0 : Math.max(0, Math.ceil(xpForLevel(L + 1) - xp)), frac: maxed ? 1 : into / ask, max: maxed, evo: null };
    if (u.isFollower && !u.evolved && typeof evolutionFor === "function" && evolutionFor(u)) {
        const next = !!u._evoOnLevelUp && !maxed, goal = next ? L + 1 : Math.min(LEVEL_CAP, typeof EVOLVE_LEVEL === "number" ? EVOLVE_LEVEL : 10), need = xpForLevel(goal), from = xpForLevel(LEVEL_START);
        out.evo = { level: goal, levels: Math.max(0, goal - L), toGo: Math.max(0, Math.ceil(need - xp)), next, frac: next ? out.frac : need > from ? Math.max(0, Math.min(1, (xp - from) / (need - from))) : 1 };
    }
    return out;
}
// the same, in words (the cards say these)
function xpText(p) { return !p ? "" : p.max ? "MAX LEVEL" : Math.round(p.into) + " / " + Math.round(p.ask) + " XP"; }
function xpEvoText(p) {
    if (!p || !p.evo) return "";
    const e = p.evo;
    return e.next ? "EVOLVES ON ITS NEXT LEVEL · " + e.toGo + " XP TO GO" : e.toGo <= 0 ? "EVOLVES NOW" : "EVOLVES AT LV " + e.level + " · " + e.levels + (e.levels === 1 ? " LEVEL" : " LEVELS") + " · " + e.toGo + " XP TO GO";
}

// ── THE LABEL ─────────────────────────────────────────────
// "the level and type of npc visible next to their health bars".
function unitTypeLabel(a) {
    if (!a) return "";
    if (a.isClone) return String(a.speciesName || "").toUpperCase() + " CLONE";
    if (a.isFollower && a.evolved && typeof EVOLUTIONS !== "undefined" && EVOLUTIONS[a.evolved]) return EVOLUTIONS[a.evolved].name;
    if (a.isFollower) return String(a.element || "").toUpperCase() + " " + roleLabel(a.role);
    // An enemy names its element (the type chart is in every fight now).
    if (a.speciesName) return (a.element ? String(a.element).toUpperCase() + " " : "") + String(a.speciesName).toUpperCase() + " " + String(a.className || "").toUpperCase();
    return "";
}
// Drawn centred above a health bar whose top edge is at y: the name plate (level and kind; js/draw.js drawPlate), and over it, for your own units, a chip saying what they
// are doing (js/status.js unitStatus). `y` is the bottom edge of the plate.
function drawUnitTag(a, cx, y, drawCtx) {
    if (!a || !Number.isFinite(a.level) || (drawCtx && drawCtx !== ctx)) return;
    if (typeof cachedText !== "function") return;
    const ally = a.team === "green" || a.isClone;
    // An enemy's tag is in its element's colour.
    const elDef = !ally && a.element && typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === a.element) : null;
    // Your own units are in their ELEMENT's colour, and a follower carries its role's emblem: brawler, mage or technician.
    const myEl = ally && a.element && typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === a.element) : null;
    const col = myEl ? myEl.color : ally ? "#19e6c1" : elDef ? elDef.color : "#ff8a6a";
    const role = ally && !a.isClone && a.isFollower ? (a.role === "sniper" || a.role === "camper" ? a.role : "brawler") : null;
    const label = "Lv " + a.level + " " + unitTypeLabel(a);
    if (typeof drawPlate === "function" && drawPlate(label, col, cx, y, false, role)) {
        const st = ally && typeof unitStatus === "function" ? unitStatus(a) : null;
        if (st && st.text !== "FOLLOWING") drawPlate(st.text, st.col, cx, y - 15, true);   // plain following is the usual state: no chip
    } else cachedText(label, "bold 7px monospace", col, cx, y);
}
