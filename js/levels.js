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
// it). A unit that dies loses XP_DEATH_LOSS of its progress toward its next
// level — never a level.

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
    npc.maxHealth = Math.round(npc.stats.hp * FOLLOWER_HP_MULT);
    npc.power = npc.stats.attack;
    if (fresh) { npc.health = npc.maxHealth; npc.currentWill = npc.stats.will; }
    else npc.health = Math.min(npc.maxHealth, (npc.health || 0) + Math.max(0, npc.maxHealth - was));
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
    p.maxHealth = Math.max(1, Math.round(b.hp * k));
    p.power     = Math.max(1, Math.round(b.attack * k));
    p.def       = Math.round(b.defense * k);
    if (b.special) p.rangeDamage = Math.round(b.special * k);
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
    const near = [];
    for (const a of (typeof actors !== "undefined" ? actors : [])) {
        if (a === killer || !_xpUnit(a)) continue;
        if (Math.hypot(a.x - p.x, a.y - p.y) <= XP_SHARE_RANGE) near.push(a);
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
