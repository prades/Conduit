// ─────────────────────────────────────────────────────────
//  THE CLASS GEAR, SEEN ON THE PLAYER (docs/TUTORIAL.md, "Class gear")
// ─────────────────────────────────────────────────────────
// Each class has one signature perk (CLASS_SIGNATURE, js/classes.js) and owning it changes how the player looks. The gear is modelled onto the same cube (design/evolutions/forms30.js, Nos. 840-843) and baked
// to a sheet of its own like the cube's (img/hd/player_gun.png, player_gun_aim.png, player_mech.png, player_coat.png: 8 facings x 8 idle + 8 action frames): the player is drawn from that sheet in place of
// the plain one (js/hdsprites.js drawHdPlayer asks playerGearSheet). The sheets are wider than the cube's (186 px cells over 4.4 units: the same pixels per unit), so each has its own box and anchor in HD_BOX.
//   GUNSLINGER   the armory's machine gun. The cube still floats; two of its tentacles carry the gun low at its left side, and when the weapon is ARMED (js/input.js setPlayerAttackMode) they pull it up level beside
//                the screen, looking down the sights; the action frames are firing (recoil, muzzle flash), shown for a few frames after each shot. It turns to the enemy that is locked (js/gunfire.js).
//   TECHNOMANCER the four-legged spider mech built in the show room: an armoured walker with the cube seated in it, walking when the player moves.
//   MUTATOR      a lab coat and safety goggles, put on in the experiment lab on the way through the teleport room and the passage (a trail of rooms), and kept for good.
const GEAR = { trail: ["teleport_room_1", "lab_passage", "experiment_lab"], fireFrames: 14, sheets: { machinegun: "player_gun", mech: "player_mech", labcoat: "player_coat" } };

// the signature perk the player owns, or null
function playerGear() { const id = typeof playerClassKey !== "undefined" && playerClassKey ? CLASS_SIGNATURE[playerClassKey] : null; return id && classHas(id) ? id : null; }
// the sheet to draw the player from, and whether its action frames play (walking, or for the armed gun firing); null with no gear
function playerGearSheet(walking) {
    const g = playerGear(); if (!g) return null;
    if (g === "machinegun") {
        const armed = typeof playerAttackMode !== "undefined" && playerAttackMode, f0 = typeof frame !== "undefined" ? frame : 0, firing = armed && f0 - (player.gunShotAt === undefined ? -999 : player.gunShotAt) < GEAR.fireFrames;
        return { key: armed ? "player_gun_aim" : "player_gun", action: armed ? firing : walking };
    }
    return { key: GEAR.sheets[g], action: walking };
}

// the Gunslinger turns the gun on the enemy it has locked
function playerGearFacing(row) {
    if (playerGear() !== "machinegun" || typeof playerLockTarget === "undefined" || !playerLockTarget || playerLockTarget.dead) return row;
    return hdRow(playerLockTarget.x - player.x, playerLockTarget.y - player.y);
}

// ── the Mutator puts the coat on ──
// Walking the trail (teleport room, the passage, the experiment lab) in that order, the Mutator is given the coat and goggles: the first two rooms start it, the lab finishes it. Kept for good.
function facilityGearTick() {
    if (typeof playerClassKey === "undefined" || playerClassKey !== "mutator" || classHas("labcoat")) return;
    const T = _fp.gearTrail = _fp.gearTrail || { i: 0 };
    const here = typeof facilityRoomAt === "function" && _fp && _fp.F ? facilityRoomAt(player.visualX, player.visualY, _fp.F) : null; if (!here) return;
    const id = here.id === "teleport_stair_room" ? "teleport_room_1" : here.id;
    if (id === GEAR.trail[T.i]) {
        T.i++;
        if (T.i >= GEAR.trail.length) { classGrant("labcoat"); T.i = 0; facilityGearSay(); }
    } else if (T.i > 0 && id !== GEAR.trail[T.i - 1]) {
        // off the trail: the walk starts again (the room the walk began in counts for the first)
        T.i = id === GEAR.trail[0] ? 1 : 0;
    }
}
function facilityGearSay() {
    if (typeof floatingTexts === "undefined" || typeof canvas === "undefined") return;
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 130, text: "LAB COAT AND GOGGLES ON — YOURS FOR GOOD", color: CLASSES.mutator.colour, life: 260, vy: -0.05, size: 15 });
}
