// ─────────────────────────────────────────────────────────
//  THE FLUX TEST ROOM'S MODE (?fluxlab): docs/FLUX-MOVEMENT.md §9.1, Build 2 (the owner, 2026-11-06: "Test room + arena")
// ─────────────────────────────────────────────────────────
// The room is map data (js/facilitymap.js FLUX_LAB_MAP), put in the map by js/facilitygrow.js only when the address carries ?fluxlab. This file is the mode round it. Each piece is a small hook elsewhere, guarded
// by fluxLabOn(), as ?attract's are (js/attract.js):
//   NOTHING KEPT   no saved game is read or written, and nothing at all is written to storage (js/facilitysave.js facilitySaveLoad; js/facilityplay.js _fpNoStorage and _fp.saveReady): a player's own save is left
//                  exactly as it was. NEW GAME (the chip) starts the room again: the address keeps ?fluxlab.
//   NO TUTORIAL    the power is on and the tutorial is over before it starts: no blackout, none of the Crystal's lines, no class picker (?class= still names a class), no cards screen (js/facilityplay.js).
//   THE START      the player in the test room, by its doorway; the squad, a flux technician (at the level a new game's squad has: js/tutorial.js TUT.followerLevel), its chip ready at once (no squad-join wait).
//                  The rest of the facility is a new game's; the stairwell in the Crystal Chamber's floor and the room's doorway join the two.
//   THE CREATURES  three ants of the arena's kind on the far side of the room's divider, of the room: they wander in it and never leave it (creatures do not take doorways), calm until provoked as the arena's are.
//                  They are not replaced: a reload (or NEW GAME) brings them back.
// FLUX MOVE's rules are the game's own (js/fluxmove.js): the room adds nothing to them but its layout. What is a reading here (the squad, the creatures, no join wait, the layout): docs/OPEN-QUESTIONS.md §1w.

const FLUX_LAB = {
    flag: /[?&]fluxlab\b/,
    room: "flux_lab",
    tag: "Flux Test Room",             // the room's name on the room tag (js/facilitynet.js)
    look: "teleport_room_1",           // the room's style: the teleport rooms' violet (js/facilitystyleall.js FP_ROOM_STYLE)
    start: [4, 2],                     // the player's tile, from the room's top-left floor tile (its first corner, js/facilitymap.js FLUX_LAB_MAP): by the doorway
    squad: [["flux", "camper"]],       // the squad: a flux technician (js/helpers.js spawnFollowerAtCrystal: element, type)
    creatures: { room: "flux_lab", species: ["ant"], classes: { worker: 1, scout: 1 }, levels: [2, 2] },   // WHAT they are (a spawner of its own: js/population.js spawnWhat reads its fields)
    spots: [[4, 10], [9, 9], [13, 11]],   // where they start, from the room's top-left floor tile: beyond the divider
};

let _flSearch = null, _flFlag = false;
// the address is read once (a page's address does not change without a reload); fluxLabRefresh reads it again (the tests change it)
function fluxLabRefresh() {
    const s = typeof window !== "undefined" && window.location ? window.location.search || "" : "";
    _flSearch = s; _flFlag = FLUX_LAB.flag.test(s); return _flFlag;
}
function fluxLabOn() { return _flSearch === null ? fluxLabRefresh() : _flFlag; }

// the room's look and name, with the flag only (without it nothing of the facility's tables changes)
function fluxLabLook() {
    if (!fluxLabOn()) return false;
    if (typeof FP_STYLE_ROOMS !== "undefined") FP_STYLE_ROOMS.add(FLUX_LAB.room);
    if (typeof FP_ROOM_STYLE !== "undefined" && !FP_ROOM_STYLE[FLUX_LAB.room] && FP_ROOM_STYLE[FLUX_LAB.look]) FP_ROOM_STYLE[FLUX_LAB.room] = FP_ROOM_STYLE[FLUX_LAB.look];
    if (typeof FP_ROOM_TAG !== "undefined") FP_ROOM_TAG[FLUX_LAB.room] = FLUX_LAB.tag;
    return true;
}
try { fluxLabLook(); } catch (e) {}

// a tile of the room, from its top-left floor tile (the room's first corner is its top-left: js/facilitymap.js FLUX_LAB_MAP)
function fluxLabTile(F, p) {
    const R = F && F.byId && F.byId.get(FLUX_LAB.room); if (!R || !R.poly || !R.poly.length) return null;
    return [R.poly[0][0] + 0.5 + p[0], R.poly[0][1] + 0.5 + p[1]];
}

// the squad a game in the test room starts with (js/facilityplay.js facilityPlayStart, in place of a new game's three)
function fluxLabSquad() {
    if (typeof spawnFollowerAtCrystal !== "function") return [];
    const out = [];
    for (const [el, type] of FLUX_LAB.squad) { const n = followers.length; spawnFollowerAtCrystal(el, type); const f = followers.length > n ? followers[followers.length - 1] : null; if (f) { f.role = type; out.push(f); } }
    return out;
}

// the start (js/facilityplay.js facilityPlayStart, after the tutorial has begun and before the arena's creatures): the tutorial over, the player and the squad in the room, its creatures. False when not in the mode.
function fluxLabStart(F) {
    if (!fluxLabOn() || !_fp || !F || !F.byId || !F.byId.has(FLUX_LAB.room)) return false;
    if (typeof facilityBlackoutSet === "function") facilityBlackoutSet(false);
    const S = _fp.tut && _fp.tut.script;
    if (S && typeof TUT_STEPS !== "undefined") { S.step = TUT_STEPS.length; S.doneAt = Math.max(1, typeof frame !== "undefined" ? frame : 1); }   // (over before it starts: no lines, no class picker, js/tutorial.js)
    const s = fluxLabTile(F, FLUX_LAB.start);
    player.x = player.targetX = player.visualX = s[0]; player.y = player.targetY = player.visualY = s[1]; player.fpPath = null;
    followers.forEach((f, i) => {
        f.x = s[0] - 1 + (i % 3); f.y = s[1] + 1 + Math.floor(i / 3); f.returningToCrystal = false; f._fpPath = null; f._fpGoalAt = null; f._fpStuck = 0;
        f._abMember = true; f._abReadyAt = 0;   // its chip ready at once: no squad-join wait in the test room (js/techabilities.js techAbilityTick)
    });
    _fp.zoneRoom = FLUX_LAB.room;
    _fp.fluxLab = { creatures: fluxLabCreatures(F) };
    return true;
}
// the room's creatures: one at each spot, of the room
function fluxLabCreatures(F) {
    const out = [];
    if (typeof facilitySpawnCreature !== "function") return out;
    for (const p of FLUX_LAB.spots) { const at = fluxLabTile(F, p), c = at ? facilitySpawnCreature(null, at, FLUX_LAB.creatures) : null; if (c) out.push(c); }
    return out;
}
