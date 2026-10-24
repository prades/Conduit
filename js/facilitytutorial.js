// ─────────────────────────────────────────────────────────
//  THE TUTORIAL BLACKOUT — the facility starts with its power down (docs/TUTORIAL.md, phase 2)
// ─────────────────────────────────────────────────────────
// The tutorial opens in the dark: the whole facility is a blackout, with every room unlit, doors open or shut, the Crystal Chamber included. The player's own light is a lamp in the monitor
// that is their head: a pool of light that goes with them. The only other lights are the facility's own EMERGENCY lights: the floodlights, the exit signs, the crystal's glow and the Security Room's
// monitor wall. Enemies are never dimmed (units are not part of the room lighting), and in a blackout each one also shows a faint hostile glow on the floor under it, so it is recognisable at a distance.
//
// This sits on top of the room lighting in js/facilitystyle.js and changes none of its rules: a room is lit while the player is in it and dark when they leave, an open door throws a pool of light
// on the ground beyond it. A blackout only adds one condition: a room can be lit (and a pool thrown) only once it has POWER. Restoring power (facilityPower) is what the later phases hang their
// relays, charging stations and defences on; until then nothing is powered and the lamp and the emergency lights are all the light there is.
//
//   _fp.tut = { blackout, powered: Set of light keys, sources: [...] }     facilityTutorialStart(F) makes it; ?facilityplay&power=on starts the facility lit instead
//   facilityBlackout()                   is the blackout on?
//   facilityPower(roomId, on)            power one room (the stair room is part of the hallway), or facilityPower("all", true) for the whole facility
//   _fpExtraLight(x, y, keys)            the lamp's and the emergency lights' level at a spot, for the room(s) it belongs to (0 to 1)
//   _fpDarkAmt()                         how dark an unlit thing is: FP_DARK, or FP_TUT.dark in a blackout

const FP_TUT = {
    dark: 0.95,                  // an unlit thing in a blackout loses this much of its light (FP_DARK is 0.82 in an ordinary dark room)
    lampR: 4.8, lampCore: 0.8, lampK: 0.55,   // the monitor lamp: its brightest (lampK, a dim light) within lampCore tiles, fading to nothing at lampR
    boost: 2, boostReach: 1.45, boostK: 1.55,   // an overcharged lamp (a power cell): wider and brighter
    flareR: 6.5, flareK: 0.9, flareFrames: 1800, flareRgb: "255,106,74",   // a flare: its light, how long it burns, its colour
    lampRgb: "0,255,136", lampAngryRgb: "255,34,34", lampGlow: 0.13,   // its colour is the visor's (the green eye-lines of the monitor face, red when the player is angry), and how strongly it tints what it lights
    floodR: 7, floodK: 0.8,    // a floodlight
    exitR: 2.4, exitK: 0.4,      // an exit sign's green emergency glow
    lights: { light_1: 0.32, light_9: 0.5, light_9b: 0.45 },   // (a light's own radius is its reach, capped at lightMax)
    lightMax: 4.5,   // floor-light decor that stays on: the crystal's glow and the Security Room's monitor wall (decor id -> strength)
    glow: "255,92,60",           // the hostile glow under an enemy in the dark (r,g,b)
    message: ["◈ BLACKOUT — FACILITY POWER IS DOWN", "YOUR MONITOR LAMP IS YOUR LIGHT"],
};

function facilityBlackout() { return !!(typeof _fp !== "undefined" && _fp && _fp.tut && _fp.tut.blackout); }
function _fpPowered(key) { return !facilityBlackout() || _fp.tut.powered.has(key); }
function _fpDarkAmt() { return facilityBlackout() ? FP_TUT.dark : FP_DARK; }

function facilityTutorialStart(F) {
    const key = (id) => (typeof _fpLightKey === "function" ? _fpLightKey(id) : id), src = [];
    for (const p of (F.solids || [])) if (p.kind === "floodlight" && p.bb) src.push({ x: (p.bb[0] + p.bb[2]) / 2, y: (p.bb[1] + p.bb[3]) / 2, r: FP_TUT.floodR, k: FP_TUT.floodK, room: key(p.room), what: "floodlight" });
    for (const d of (F.decor || [])) {
        if (d.kind === "exit_sign" && d.a && d.b) src.push({ x: (d.a[0] + d.b[0]) / 2, y: (d.a[1] + d.b[1]) / 2, r: FP_TUT.exitR, k: FP_TUT.exitK, room: key(d.room), what: "exit_sign" });
        else if (d.kind === "light" && FP_TUT.lights[d.id] && d.at) src.push({ x: d.at[0], y: d.at[1], r: Math.min(d.radius, FP_TUT.lightMax), k: FP_TUT.lights[d.id], room: key(d.room), what: d.id });
    }
    const off = /[?&]power=on\b/.test((typeof window !== "undefined" && window.location && window.location.search) || "");
    _fp.tut = { blackout: !off, powered: new Set(), sources: src, said: false, boostUntil: 0 };
    facilityPickupsStart(F);
    if (typeof facilityStationsStart === "function") facilityStationsStart(F);
    if (typeof facilityDirectorStart === "function") facilityDirectorStart();
    return _fp.tut;
}
// the player's side of the tutorial: an empty pack and no class yet. The class picker opens (a Gunslinger, a Technomancer or a Mutator), unless the URL names one (?class=technomancer).
function facilityTutorialClass() {
    if (typeof invReset !== "function") return;
    invReset(); playerClassKey = null; classPickerOpen = false; if (typeof invButtonShow === "function") invButtonShow(true);
    const m = /[?&]class=(\w+)/.exec((typeof window !== "undefined" && window.location && window.location.search) || "");
    if (m && CLASSES[m[1]]) classSet(m[1]); else classPickerOpen = true;
}

// power a room on or off (the stair room is the hallway's); "all" is every room. A blackout ends by itself when every room has power.
function facilityPower(roomId, on) {
    if (!facilityBlackout()) return false;
    const T = _fp.tut, rooms = roomId === "all" ? _fp.F.rooms.map(r => r.id) : [roomId];
    for (const id of rooms) { const k = _fpLightKey(id); if (on === false) T.powered.delete(k); else T.powered.add(k); }
    if (_fp.F.rooms.every(r => T.powered.has(_fpLightKey(r.id)))) T.blackout = false;
    return true;
}
function facilityBlackoutSet(on) { if (_fp && _fp.tut) _fp.tut.blackout = !!on; }

// the lamp's light on a spot (0 to 1): full near the player, a smooth fall to nothing at lampR
function _fpLampBoost() { const T = _fp && _fp.tut; return T && T.boostUntil > (typeof frame !== "undefined" ? frame : 0) ? FP_TUT.boost : 1; }   // a power cell overcharges the lamp (facilityLampBoost)
function _fpLampAt(x, y) {
    const b = _fpLampBoost(), R = FP_TUT.lampR * (b > 1 ? FP_TUT.boostReach : 1) * (typeof classStat === "function" ? classStat("lampReach", 1) : 1), d = Math.hypot(x - player.visualX, y - player.visualY); if (d >= R) return 0;
    const t = d <= FP_TUT.lampCore ? 1 : 1 - (d - FP_TUT.lampCore) / (R - FP_TUT.lampCore);
    return Math.min(1, FP_TUT.lampK * (b > 1 ? FP_TUT.boostK : 1) * Math.pow(t * t * (3 - 2 * t), 1.3));
}
// the extra light a thing at (x, y) gets in a blackout: the lamp, when it belongs to the room the player is in (or stands at its edge); the emergency lights, when it belongs to their room. `keys` are
// the light keys of the room(s) the thing shows to.
function _fpExtraLight(x, y, keys) {
    if (!facilityBlackout()) return 0;
    let v = 0;
    if (keys && _fp.here && (keys.includes(_fp.here) || Math.hypot(x - player.visualX, y - player.visualY) < 1.2)) v = _fpLampAt(x, y);
    const now = typeof frame !== "undefined" ? frame : 0;
    for (const s of _fp.tut.sources) {
        if (s.until && s.until < now) continue;
        if (keys && !keys.includes(s.room)) continue;
        const d = Math.hypot(x - s.x, y - s.y); if (d >= s.r) continue;
        const t = 1 - d / s.r; v = Math.max(v, s.k * t * (2 - t));
    }
    return v;
}

// each frame (from facilityDrawItems): say what is going on, once
function facilityTutorialTick() {
    facilityPickupTick();
    if (typeof facilityStationTick === "function") facilityStationTick();
    if (typeof facilityRelayTick === "function") facilityRelayTick();
    if (typeof facilityDirectorTick === "function") facilityDirectorTick();
    const T = _fp && _fp.tut; if (!T || T.said || !T.blackout || (typeof frame !== "undefined" ? frame : 0) < 60) return;
    T.said = true;
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") {
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 150, text: FP_TUT.message[0], color: "#ffb347", life: 420, vy: -0.03, size: 15 });
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 126, text: FP_TUT.message[1], color: "#bfe8ff", life: 420, vy: -0.03, size: 12 });
    }
}

// a hostile glow under an enemy that is standing in the dark: a soft ember-red pool and a pulse, fainter the more light there is where it stands. Drawn under the unit, never over it.
function facilityEnemyGlow(a, px, py) {
    if (!facilityBlackout() || !a || a.dead || a.team !== "red" || typeof ctx === "undefined") return;
    const lit = _fpTileLight(Math.round(a.x), Math.round(a.y), _fpRoomKeyAt(a.x, a.y));   // how lit the floor under it is (the lamp, an emergency light, a lit room)
    const k = 1 - Math.min(1, lit * 2); if (k < 0.05) return;   // (gone where there is half light or more)
    const f = typeof frame !== "undefined" ? frame : 0, pul = 0.75 + 0.25 * Math.sin(f * 0.09 + (a.x * 3 + a.y * 5)), cy = py + TILE_H;
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(px, cy, 2, px, cy, 44); g.addColorStop(0, "rgba(" + FP_TUT.glow + "," + (0.55 * k * pul).toFixed(3) + ")"); g.addColorStop(0.5, "rgba(" + FP_TUT.glow + "," + (0.2 * k * pul).toFixed(3) + ")"); g.addColorStop(1, "rgba(" + FP_TUT.glow + ",0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, cy, 44, 22, 0, 0, 6.2832); ctx.fill();
    ctx.restore();
}
function _fpRoomKeyAt(x, y) { const r = typeof facilityRoomAt === "function" && _fp && _fp.F ? facilityRoomAt(x, y, _fp.F) : null; return r ? _fpLightKey(r.id) : null; }

// the lamp's colour: a soft pool of the visor's green over everything near the player, drawn after the scene in screen space (the player is the centre of the screen, the iso ground is an ellipse)
function facilityDrawLampGlow() {
    if (!facilityBlackout() || typeof ctx === "undefined" || !ctx.createRadialGradient) return;
    const rgb = (typeof player !== "undefined" && player.angryTimer > 0) ? FP_TUT.lampAngryRgb : FP_TUT.lampRgb, R = FP_TUT.lampR, rx = R * TILE_W * 1.4142, cx = canvas.width / 2, cy = canvas.height / 2;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "lighter"; ctx.translate(cx, cy); ctx.scale(1, TILE_H / TILE_W);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx), a = FP_TUT.lampGlow; g.addColorStop(0, "rgba(" + rgb + "," + a + ")"); g.addColorStop(0.45, "rgba(" + rgb + "," + (a * 0.5).toFixed(3) + ")"); g.addColorStop(1, "rgba(" + rgb + ",0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.2832); ctx.fill(); ctx.restore();
}

// ── items that act on the light ──
// a flare: a lit source on the spot where the player stands, in the room they are in, for flareFrames
function facilityFlare() {
    if (!_fp || !_fp.tut || !_fp.here) return false;
    const now = typeof frame !== "undefined" ? frame : 0, T = _fp.tut;
    T.sources = T.sources.filter(s => !s.until || s.until >= now);
    T.sources.push({ x: player.visualX, y: player.visualY, r: FP_TUT.flareR, k: FP_TUT.flareK, room: _fp.here, what: "flare", until: now + FP_TUT.flareFrames, born: now });
    return true;
}
function facilityLampBoost(frames) { if (!_fp || !_fp.tut) return false; _fp.tut.boostUntil = (typeof frame !== "undefined" ? frame : 0) + Math.round(frames * (typeof classStat === "function" ? classStat("boostFrames", 1) : 1)); return true; }
// the flares' glow on the ground, after the scene like the lamp's
function facilityDrawFlares() {
    const T = _fp && _fp.tut; if (!T || typeof ctx === "undefined") return; const now = typeof frame !== "undefined" ? frame : 0;
    for (const s of T.sources) {
        if (s.what !== "flare" || s.until < now) continue;
        const fade = Math.min(1, (s.until - now) / 120, (now - s.born) / 12 + 0.2), fl = 0.8 + 0.2 * Math.sin(now * 0.31 + s.x), px = (s.x - player.visualX - (s.y - player.visualY)) * TILE_W + canvas.width / 2, py = (s.x - player.visualX + (s.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H;
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "lighter"; ctx.translate(px, py); ctx.scale(1, TILE_H / TILE_W);
        const R = s.r * TILE_W * 1.4142 * 0.8, g = ctx.createRadialGradient(0, 0, 0, 0, 0, R); g.addColorStop(0, "rgba(" + FP_TUT.flareRgb + "," + (0.3 * fade * fl).toFixed(3) + ")"); g.addColorStop(0.35, "rgba(" + FP_TUT.flareRgb + "," + (0.12 * fade).toFixed(3) + ")"); g.addColorStop(1, "rgba(" + FP_TUT.flareRgb + ",0)");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.2832); ctx.fill(); ctx.restore();
        ctx.save(); ctx.fillStyle = "#fff2c8"; ctx.beginPath(); ctx.arc(px, py - 6, 3.2 * fl, 0, 6.2832); ctx.fill(); ctx.fillStyle = "rgba(255,150,80,0.9)"; ctx.beginPath(); ctx.moveTo(px - 3, py - 4); ctx.lineTo(px, py - 14 - 3 * fl); ctx.lineTo(px + 3, py - 4); ctx.closePath(); ctx.fill(); ctx.restore();
    }
}

// ── pickups: the supply cases (F.pickups, js/facilitymap.js) ──
// Each is a low case with a beacon and the first item's icon floating over it, so it can be found in the dark. Walk over one to take what it holds; a case whose items will not all fit stays where it is.
const FP_PICK_R = 1.25;
function facilityPickupsStart(F) {
    if (!_fp || !_fp.items) return;
    _fp.items = _fp.items.filter(i => i.fp !== "pickup");
    for (const p of (F.pickups || [])) _fp.items.push({ type: "fp", fp: "pickup", id: p.id, room: p.room, x: p.at[0], y: p.at[1], depth: p.at[0] + p.at[1], base: facilityRoomHeight(p.room, F) * FP_ELEV_PX, items: p.items.map(i => i.slice()), taken: false, seed: _fpHash(Math.round(p.at[0] * 3), Math.round(p.at[1] * 5)) });
}
function _fpDrawPickup(it) {
    if (it.taken) return;
    const f = _fpFrame(), first = it.items[0][0], d = typeof itemDef === "function" ? itemDef(first) : null, col = d ? d.col : "#ffe9a0", bob = Math.sin(f * 0.06 + it.seed) * 3, A = FP_PAL;
    _fpSBox(it.x - 0.3, it.y - 0.3, it.x + 0.3, it.y + 0.3, 0, 13, A.caseLit, A.case, A.cap, 3);   // the case
    _fpSBox(it.x - 0.31, it.y - 0.31, it.x + 0.31, it.y + 0.31, 8, 11, col, _fpShade(col, 0.7), _fpShade(col, 0.88), 2);   // a coloured band round it
    const c = _fpP(it.x, it.y, 40 + bob); if (typeof invDrawIcon === "function") invDrawIcon(first, c[0], c[1], 30, f);
    const g = _fpP(it.x, it.y, 18); _fpGlow(g[0], g[1], 34 + Math.sin(f * 0.08 + it.seed) * 4, col, 0.34);
    if (it.items.length > 1) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(c[0] + 14, c[1] - 11, 3, 0, 6.2832); ctx.fill(); }
}
// each frame: take what the player walks over
function facilityPickupTick() {
    if (!_fp || !_fp.items || typeof invAdd !== "function") return;
    for (const it of _fp.items) {
        if (it.fp !== "pickup" || it.taken) continue;
        if (Math.hypot(it.x - player.visualX, it.y - player.visualY) > FP_PICK_R) continue;
        if (!it.items.every(([id, n]) => invRoom(id) >= n)) { if (!it.said) { it.said = true; invSay("YOUR PACK IS FULL OF THAT", false); } continue; }
        for (const [id, n] of it.items) { invAdd(id, n); const d = itemDef(id); if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 100 - 20 * it.items.indexOf(it.items.find(q => q[0] === id)), text: "+" + n + " " + d.name + (classAllows(d.classes) ? "" : "  (" + d.classes.map(className).join(" / ") + " ONLY)"), color: d.col, life: 110, vy: -0.1, size: 13 }); }
        it.taken = true;
    }
}

// everything the tutorial paints over the scene, in screen space: the lamp's colour, the flares, a CCTV sweep's markers, the plate of the station in range
function facilityDrawOverlay() {
    facilityDrawLampGlow(); facilityDrawFlares();
    if (typeof facilityDrawCctv === "function") facilityDrawCctv();
    if (typeof facilityDrawRelays === "function") facilityDrawRelays();
    if (typeof facilityDrawStationPrompt === "function") facilityDrawStationPrompt();
    if (typeof facilityDrawObjective === "function") facilityDrawObjective();
}
