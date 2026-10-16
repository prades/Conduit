// ─────────────────────────────────────────────────────────
//  LEVELS AND STATS  —  one system for every unit
// ─────────────────────────────────────────────────────────
// REPORTED: "There needs to be a level and stats system like in Pokémon for all
// entities. All followers have a base stat modified by their personalities,
// then the predators and clones should have a similar system, and they should
// have the level and type of npc visible next to their health bars." And:
// "This will replace the current combat system."
//
// Asked: followers and clones gain XP from KILLS; a predator's level is set by
// the WAVE and the ZONE; the cap is 100; a unit that dies LOSES SOME XP.
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
//   PREDATORS  their species/class numbers (species.js SPECIES), plus a
//              DEFENSE by class (PRED_DEFENSE); the zone ramp and the deep-zone
//              growth that used to multiply them are now their LEVEL.
//   CLONES     their species × CLONE_*_MULT, levelled the same way.
//
// DEFENSE now works for everyone (it was followers only): applyDamage takes
// a hit down by ref / (ref + DEF × 0.6), where ref = 10 × levelFactor of the
// ATTACKER (or of the target, for something with no level — a turret, a
// hazard). So a level-5 follower's defense 10 against a level-5 bite is the
// same ×0.625 it always was, and a high-level attacker punches through.
//
// XP. Total XP to reach level L is L³ (Pokémon's "medium" curve: 125 at 5,
// 1000 at 10, 125 000 at 50, 1 000 000 at 100). A predator killed is worth
// XP_YIELD[its class] × its level / 5 (× XP_ELITE for an elite). The unit that
// landed the kill gets XP_KILLER_SHARE of it and your units within
// XP_SHARE_RANGE share the rest; a kill by a turret or an effect goes to the
// units nearby (XP_ASSIST_ONLY of it). A unit that dies loses XP_DEATH_LOSS of
// its progress toward its next level — never a level.

const LEVEL_CAP        = 100;    // followers and clones
// A PREDATOR in the deep tunnel goes past it: "the tunnel never ends", and a
// capped level would have stopped it getting harder. The number shown is still
// its real level.
const PRED_LEVEL_MAX   = 999;
const LEVEL_START      = 5;
const XP_KILLER_SHARE  = 0.6;
const XP_SHARE_RANGE   = 4;      // tiles
const XP_ASSIST_ONLY   = 0.5;    // a kill with no unit's last blow: this share to those near
const XP_ELITE         = 1.5;
const XP_DEATH_LOSS    = 0.25;   // of the progress toward the next level
// Doubled after a first playtest: the squad sat at level 5-6 while the waves
// reached 12 — it has to be able to keep up with what it fights.
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

// ── FOLLOWERS ─────────────────────────────────────────────
// A recruit joins at the level of where it was found, like a wild Pokémon:
// RECRUIT_BEHIND below that zone's predators (never under LEVEL_START), so a
// late-game recruit is not a level-5 straggler among level-20 waves.
const RECRUIT_BEHIND = 3;
function recruitLevel(zone) {
    const z = Number.isFinite(zone) ? zone : (typeof nextZoneToTake === "function" ? nextZoneToTake() : 1);
    return Math.max(LEVEL_START, predatorLevelFor(z, undefined, false) - RECRUIT_BEHIND);
}
function levelledStats(base, L) {
    const k = levelFactor(L), out = Object.assign({}, base);
    for (const s of LEVELLED_STATS) if (typeof base[s] === "number") out[s] = Math.max(1, Math.round(base[s] * k));
    return out;
}
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
    npc.maxHealth = npc.stats.hp;
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
// The level a predator of zone z has on wave w: one level every two waves
// (each step of the wave ladder), three per zone of the old difficulty ramp,
// six per deep zone past 12 — the old multipliers, now levels.
function predatorLevelFor(z, wave, spread) {
    const w = Math.max(1, wave || (typeof gameState !== "undefined" && gameState.nightNumber) || 1);
    const r = typeof rampLevel === "function" ? rampLevel(z) : 0;
    const d = typeof deepZoneLevel === "function" ? deepZoneLevel(z) : 0;
    let L = LEVEL_START + Math.floor((w - 1) / 2) + 3 * r + 6 * d;
    if (spread) L += Math.floor(Math.random() * 3) - 1;   // -1, 0, +1
    return Math.max(1, Math.min(PRED_LEVEL_MAX, L));
}
// Give a predator (or a clone) its level. Its current numbers are taken as its
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
            floatingTexts.push({ x: u.x, y: u.y - 1.2, text: "▲ LEVEL " + u.level, color: "#ffee66", life: 70, vy: -0.07, size: 12 });
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: u.x, y: u.y, color: "#ffee66", radius: 0.6, life: 22 });
        if (!u.isClone && typeof evoCheck === "function") evoCheck(u);   // reaching EVOLVE_LEVEL (10): it may evolve (js/evolution.js)
    }
    return ups;
}
// What a dead predator is worth.
function killXp(p) {
    const y = XP_YIELD[p.className] !== undefined ? XP_YIELD[p.className] : XP_YIELD.scout;
    return Math.round(y * (p.level || LEVEL_START) / LEVEL_START * (p.isElite ? XP_ELITE : 1));
}
// Once per dead predator (from the death sweep, game.js).
function awardKillXp(p) {
    if (!p || p._xpGiven || p.team === "green" || p.isClone || p.isMachine) return 0;
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
// ── XP FOR WORKING ─────────────────────────────────────────
// REPORTED: "How much experience is granted for working? Can we sort that out
// right now as opposed to experience from attacking?" It was NONE: only kills
// gave XP, so a worker never levelled (or evolved, js/evolution.js).
//
// A finished job pays XP_WORK[job] × (the level of the enemies in the zone
// you are in) ÷ LEVEL_START — the same scaling a kill has (killXp), so a worker
// keeps pace with the fighters as the zones get harder. A kill's lump is worth
// a neutralise and a haul between them, about a scout kill's worth. Mending
// pays per point of health put into a clone; holding the line with an ice block
// pays once it is set and then every XP_ICE_HOLD_EVERY frames an enemy is held
// against it.
const XP_WORK = { neutralise: 30, haul: 50, rearm: 80, ice: 40, iceHold: 10 };
const XP_MEND_PER_HP   = 0.12;
const XP_ICE_HOLD_EVERY = 120;
function workXpScale() {
    const z = typeof getZoneIndex === "function" && typeof player !== "undefined" ? Math.max(0, getZoneIndex(Math.floor(player.x))) : 0;
    return Math.max(LEVEL_START, predatorLevelFor(z, 0, 0)) / LEVEL_START;
}
// A finished job's XP to a follower. Returns what it gave.
function awardWorkXp(a, job) {
    const base = typeof job === "number" ? job : XP_WORK[job];
    if (!_xpUnit(a) || a.isClone || !(base > 0)) return 0;
    const n = Math.max(1, Math.round(base * workXpScale()));
    gainXp(a, n);
    a._workXp = (a._workXp || 0) + n;
    return n;
}
// Mending: per point of health put in, banked and paid whole.
function awardMendXp(a, hp) {
    if (!_xpUnit(a) || a.isClone || !(hp > 0)) return 0;
    a._mendXpAcc = (a._mendXpAcc || 0) + hp * XP_MEND_PER_HP * workXpScale();
    const whole = Math.floor(a._mendXpAcc);
    if (whole < 1) return 0;
    a._mendXpAcc -= whole; gainXp(a, whole); a._workXp = (a._workXp || 0) + whole;
    return whole;
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
    if (a.speciesName) return (a.element ? String(a.element).toUpperCase() + " " : "") + String(a.speciesName).toUpperCase() + " " + String(a.className || "").toUpperCase() + (a.isElite ? " ★" : "");
    return "";
}
// Drawn centred above a health bar whose top edge is at y. Off in a crowd of
// identical labels? No — a level is worth reading; it is a cached stamp.
function drawUnitTag(a, cx, y, drawCtx) {
    if (!a || !Number.isFinite(a.level) || (drawCtx && drawCtx !== ctx)) return;
    if (typeof cachedText !== "function") return;
    const ally = a.team === "green" || a.isClone;
    // An enemy's tag is in its element's colour.
    const elDef = !ally && a.element && typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === a.element) : null;
    const col = ally ? "#bfffe0" : a.isElite ? "#ffd866" : elDef ? elDef.color : "#ffb0a0";
    cachedText("Lv " + a.level + " " + unitTypeLabel(a), "bold 7px monospace", col, cx, y);
}
