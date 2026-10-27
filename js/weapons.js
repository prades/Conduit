// ─────────────────────────────────────────────────────────
//  THE PLAYER'S WEAPONS, AND THE ARMORY'S TERMINAL (docs/TUTORIAL.md, "Weapons")
// ─────────────────────────────────────────────────────────
// The player has ONE weapon in hand at a time, from a table (WEAPONS): the data says how hard it hits, how fast it fires, what it runs on and how far it reaches, so a fourth weapon is one more row.
//   SERVICE GUN    every class starts with it. Ammunition (the pack's ammo packs fill the gun: js/inventory.js).
//   MACHINE GUN    the Gunslinger's, taken from the Armory's weapon locker (js/stations.js): four times the rate of fire, each round a little softer. Ammunition.
//   LASER RIFLE    assembled at the Armory's terminal from scrap metal (any class). It runs on FUEL CELLS, not rounds: a cell is a magazine of charges (a lit-up beam that hits at once and goes through
//                  whatever is behind the target), and the fuel cells are in the computer lab (the Front Lobby) once its power has been restored (js/facilitymap.js: pickups with `needs`).
// A weapon has a LEVEL (1 to 3): each level hits harder and fires faster. Levels are bought at the terminal with SCRAP METAL, which the arena's creatures drop where they fall (js/facilityspawn.js).
// THE ARMORY TERMINAL (a station: js/stations.js, in the Armory, working once the Armory relay has restored its power) is a window with three things: turn scrap into ammunition, equip a weapon
// you have, and upgrade or assemble one. What is equipped is also what the player is seen holding (js/playergear.js).
const WEAPONS = {
    service:    { id: "service", name: "SERVICE GUN", kind: "ammo", damage: 10, cooldown: 45, maxLevel: 3, upgrade: [8, 16], col: "#ffb070",
        desc: "The rifle every one of you was issued. One round a shot, one shot every three-quarters of a second." },
    machinegun: { id: "machinegun", name: "MACHINE GUN", kind: "ammo", damage: 8, cooldown: 11, maxLevel: 3, upgrade: [12, 24], col: "#ffb347", perk: "machinegun",
        desc: "A belt-fed gun held in your tentacles. Four times the rate of fire; each round hits a little softer. The Gunslinger's." },
    laser:      { id: "laser", name: "LASER RIFLE", kind: "fuel", damage: 22, cooldown: 28, maxLevel: 3, upgrade: [14, 28], col: "#31e8ff", assemble: 15, charges: 12, range: 12, pierce: 0.6,
        desc: "An energy rifle: a beam that hits at once and goes through whatever stands behind the target. A fuel cell holds 12 charges." },
    // THE MUTATOR'S OWN (cls: only that class has it; js/classes.js puts it in hand when the class is chosen). Melee: the targeting's ATTACK walks you into `reach` (tiles) and the lash comes in two beats
    // (js/mutator.js: MUTATOR.lash.windup, then the hit). It spends nothing. Its numbers are TENTATIVE (docs/MUTATOR.md); it has no scrap levels: the Mutator grows by DNA, not at the bench.
    lash:       { id: "lash", name: "TENTACLE LASH", kind: "melee", damage: 18, cooldown: 34, reach: 1.45, maxLevel: 1, upgrade: [], col: "#c06bff", cls: "mutator",
        desc: "The Mutator's own: a tentacle that lashes whatever is in reach. It spends nothing, but you have to be close." },
    // THE TECHNOMANCER'S OWN (js/technomancer.js): HYBRID. In reach it PUNCHES (the same two beats as the lash: windup, then the hit), and every punch that lands stores a CHARGE; out of reach, with a charge,
    // it throws an ELECTRIC ARC that chains to the creatures beside the first and cuts short a bite being wound up. The punch's numbers are here; the arc's are TECHNO.arc. TENTATIVE (docs/TECHNOMANCER.md).
    gauntlet:   { id: "gauntlet", name: "ARC GAUNTLET", kind: "hybrid", damage: 14, cooldown: 28, reach: 1.4, windup: 8, maxLevel: 1, upgrade: [], col: "#31e8ff", cls: "technomancer", element: "electric", fx: "jab",
        onHit: () => { if (typeof technoGain === "function") technoGain(TECHNO.charge.perHit); },   // (a punch that lands stores a charge)
        desc: "The Technomancer's own: a shock punch up close that stores charge, and an electric arc at range that spends it. It draws charge from the facility's powered rooms." },
};
const WEAPON_ORDER = ["service", "machinegun", "laser", "lash", "gauntlet"];
const WEAPON_RULES = { levelDamage: 0.3, levelCooldown: 0.12, scrapPerAmmoPack: 2, ammoPackRounds: 10, beamFrames: 10 };

let playerWeapon = "service";                                   // the one in hand
let weaponOwned = { service: true, machinegun: false, laser: false };
let weaponLevel = { service: 1, machinegun: 1, laser: 1, lash: 1, gauntlet: 1 };
let laserCharge = 0;                                            // charges left in the cell in the rifle
function weaponReset() { playerWeapon = "service"; weaponOwned = { service: true, machinegun: false, laser: false }; weaponLevel = { service: 1, machinegun: 1, laser: 1, lash: 1, gauntlet: 1 }; laserCharge = 0; armoryClose(); }
function weaponDef(id) { return WEAPONS[id || playerWeapon] || WEAPONS.service; }
// what is owned: the service gun always, the machine gun with its perk, a class's own weapon by that class, the rifle once assembled
function weaponHas(id) { const w = WEAPONS[id]; if (!w) return false; if (w.perk) return typeof classHas === "function" && classHas(w.perk); if (w.cls) return typeof playerClassKey !== "undefined" && playerClassKey === w.cls; return !!weaponOwned[id] || id === "service"; }
// the class a weapon is reserved for (its own `cls`, or the class of the perk that gives it), or null
function weaponClassOf(id) { const w = WEAPONS[id]; if (!w) return null; if (w.cls) return w.cls; if (w.perk && typeof CLASS_PERKS !== "undefined" && CLASS_PERKS[w.perk]) return CLASS_PERKS[w.perk].cls; return null; }
// the rows the Armory terminal lists: a weapon reserved for a class only to that class (with no class yet, the ones a class earns at a station are listed, as before, and a class's own weapon is not)
function weaponRows() { const k = typeof playerClassKey !== "undefined" ? playerClassKey : null; return WEAPON_ORDER.filter(id => { const c = weaponClassOf(id); return !c || (k ? c === k : !WEAPONS[id].cls); }); }
function weaponLevelOf(id) { return Math.max(1, Math.min(WEAPONS[id || playerWeapon].maxLevel, weaponLevel[id || playerWeapon] | 0 || 1)); }
// the numbers in hand: the weapon's own, raised by its level, and the class perks' on top (classStat)
function weaponDamage(id) { const w = weaponDef(id), L = weaponLevelOf(id || playerWeapon); return Math.round(classStat("shotDamage", w.damage * (1 + WEAPON_RULES.levelDamage * (L - 1))) * 10) / 10; }
function weaponCooldown(id) { const w = weaponDef(id), L = weaponLevelOf(id || playerWeapon); return Math.max(4, Math.round(classStat("shotCooldown", w.cooldown * (1 - WEAPON_RULES.levelCooldown * (L - 1))))); }
function weaponEquip(id) {
    if (!WEAPONS[id]) return { ok: false, why: "NO SUCH WEAPON" };
    if (!weaponHas(id)) return { ok: false, why: id === "machinegun" ? "THE GUNSLINGER'S: FROM THE WEAPON LOCKER" : WEAPONS[id].cls ? "THE " + (typeof className === "function" ? className(WEAPONS[id].cls) : String(WEAPONS[id].cls).toUpperCase()) + "'S OWN" : "ASSEMBLE IT FIRST" };
    playerWeapon = id; if (typeof playerLockTarget !== "undefined") { /* the lock is kept */ }
    return { ok: true, msg: WEAPONS[id].name + " IN HAND" };
}
// the next level's price in scrap, or null at the top
function weaponUpgradeCost(id) { const w = WEAPONS[id], L = weaponLevelOf(id); return w && L < w.maxLevel ? w.upgrade[L - 1] : null; }
function weaponUpgrade(id) {
    const w = WEAPONS[id]; if (!w || !weaponHas(id)) return { ok: false, why: "YOU DO NOT HAVE IT" };
    const c = weaponUpgradeCost(id); if (c === null) return { ok: false, why: "ALREADY AT THE TOP LEVEL" };
    if (!invHas("scrap_metal", c)) return { ok: false, why: "NEEDS " + c + " SCRAP METAL" };
    invRemove("scrap_metal", c); weaponLevel[id] = weaponLevelOf(id) + 1;
    return { ok: true, msg: w.name + " ▲ LEVEL " + weaponLevel[id] };
}
function weaponAssemble(id) {
    const w = WEAPONS[id]; if (!w || !w.assemble) return { ok: false, why: "NOTHING TO ASSEMBLE" }; if (weaponHas(id)) return { ok: false, why: "YOU HAVE IT" };
    if (!invHas("scrap_metal", w.assemble)) return { ok: false, why: "NEEDS " + w.assemble + " SCRAP METAL" };
    invRemove("scrap_metal", w.assemble); weaponOwned[id] = true; playerWeapon = id;
    return { ok: true, msg: w.name + " ASSEMBLED — IN HAND" };
}
// scrap into ammunition: `packs` ammo packs (or as many as scrap and room allow)
function weaponConvert(packs) {
    const per = WEAPON_RULES.scrapPerAmmoPack, have = invCount("scrap_metal"), room = invRoom("ammo_pack");
    if (have < per) return { ok: false, why: "NEEDS " + per + " SCRAP METAL" };
    if (room <= 0) return { ok: false, why: "YOUR PACK IS FULL OF AMMO PACKS" };
    const n = Math.min(packs === "all" ? 99 : Math.max(1, packs | 0), Math.floor(have / per), room);
    invRemove("scrap_metal", n * per); invAdd("ammo_pack", n);
    return { ok: true, msg: n + " AMMO PACK" + (n > 1 ? "S" : "") + " FOR " + n * per + " SCRAP" };
}
// out of what it runs on? (the gunfire hold stops, the HUD says so). A melee weapon runs on nothing.
function weaponDry() { const w = weaponDef(); return w.kind === "melee" || w.kind === "hybrid" ? false : w.kind === "fuel" ? laserCharge <= 0 && !invHas("fuel_cell") : playerAmmo <= 0; }
// a weapon that strikes in reach (the lash; the gauntlet's punch): js/mutator.js walks the player in and strikes
function weaponMelee(id) { const k = weaponDef(id).kind; return k === "melee" || k === "hybrid"; }
// the HUD's words: { text, dry }
function weaponHud() {
    const w = weaponDef(), armed = typeof playerAttackMode !== "undefined" && playerAttackMode;
    if (w.kind === "hybrid") { const n = typeof technoCharge !== "undefined" ? technoCharge : 0, m = typeof technoMax === "function" ? technoMax() : 6; return { text: "CHARGE " + n + "/" + m, dry: false, short: "CHARGE " + n + "/" + m, kind: "hybrid", n: n + "/" + m, cells: 0, full: n >= m, grid: typeof technoGridOn === "function" && technoGridOn() }; }   // (the gauntlet: its charges; grid, a powered room is charging it: js/technomancer.js)
    if (w.kind === "melee") return { text: armed ? "LASH ◆ IN REACH" : "LASH", dry: false, short: "LASH", kind: "melee", n: "", cells: 0 };   // (the small icon shows a tentacle and no count: js/targeting.js)
    if (w.kind === "fuel") { const cells = invCount("fuel_cell"), dry = laserCharge <= 0 && cells <= 0, t = laserCharge + (cells ? " +" + cells + "▣" : ""); return { text: (armed ? (dry ? "NO FUEL — STOW" : "LASER ◆ " + t) : "FUEL ◆ " + t), dry, short: "FUEL " + t, kind: "fuel", n: laserCharge, cells }; }
    const dry = playerAmmo <= 0; return { text: armed ? (dry ? "NO AMMO — STOW" : "ARMED ◆ " + playerAmmo) : "AMMO ◆ " + playerAmmo, dry, short: "AMMO " + playerAmmo, kind: "ammo", n: playerAmmo, cells: 0 };   // (kind, n and cells: what the little icon in the facility shows, js/targeting.js drawAmmoIcon)
}

// ── the laser: a hit at once, through what is behind ──
function fireLaserShot(foe) {
    const W = WEAPONS.laser, d = Math.hypot(foe.x - player.x, foe.y - player.y);
    if (d > W.range) { _wSay("OUT OF RANGE", "#ff9c8a"); return false; }
    if (laserCharge <= 0) {
        if (!invHas("fuel_cell")) { _wSay("NO FUEL CELLS — THE COMPUTER LAB", "#ff7766"); return false; }
        invRemove("fuel_cell", 1); laserCharge = W.charges; _wSay("NEW FUEL CELL — " + W.charges + " CHARGES", "#9be8ff");
    }
    laserCharge--; playerShotsFired++; player.gunShotAt = typeof frame !== "undefined" ? frame : 0;
    const dmg = weaponDamage("laser"), src = { x: player.x, y: player.y, element: player.selectedElement || null, isPlayer: true }, f = typeof frame !== "undefined" ? frame : 0;
    applyDamage(foe, dmg, src);
    // whatever stands in the line behind it, a little further on, is hit for less
    const ux = (foe.x - player.x) / (d || 1), uy = (foe.y - player.y) / (d || 1), reach = Math.min(W.range, d + 3);
    for (const a of actors) {
        if (!a || a.dead || a === foe || !isHostileTarget(a)) continue;
        const ax = a.x - player.x, ay = a.y - player.y, t = ax * ux + ay * uy; if (t < 0 || t > reach) continue;
        if (Math.abs(ax * uy - ay * ux) < 0.75) applyDamage(a, dmg * W.pierce, src);
    }
    const ex = player.x + ux * reach, ey = player.y + uy * reach;
    (_fp.beams = _fp.beams || []).push({ x0: player.x, y0: player.y, x1: ex, y1: ey, t0: f });
    player.attackCooldown = weaponCooldown("laser");
    return true;
}
function _wSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 60, text, color: col || "#fff", life: 90, vy: -0.25, size: 13 }); }
// the beams, over the scene in screen space (js/facilitytutorial.js facilityDrawOverlay)
function facilityDrawBeams() {
    const B = typeof _fp !== "undefined" && _fp && _fp.beams; if (!B || !B.length || typeof ctx === "undefined") return;
    const f = typeof frame !== "undefined" ? frame : 0; _fp.beams = B.filter(b => f - b.t0 < WEAPON_RULES.beamFrames);
    const W = canvas.width, H = canvas.height, sc = (x, y) => [(x - player.visualX - (y - player.visualY)) * TILE_W + W / 2, (x - player.visualX + (y - player.visualY)) * TILE_H + H / 2 - 40];
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = "lighter"; ctx.lineCap = "round";
    for (const b of _fp.beams) {
        const k = 1 - (f - b.t0) / WEAPON_RULES.beamFrames, a = sc(b.x0, b.y0), z = sc(b.x1, b.y1);
        ctx.strokeStyle = "rgba(49,232,255," + (0.5 * k).toFixed(3) + ")"; ctx.lineWidth = 11 * k + 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(z[0], z[1]); ctx.stroke();
        ctx.strokeStyle = "rgba(235,255,255," + k.toFixed(3) + ")"; ctx.lineWidth = 3 * k + 1; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(z[0], z[1]); ctx.stroke();
    }
    ctx.restore();
}

// ── what the facility's save keeps of it (js/facilitysave.js) ──
// cw: the class's own weapon existed when this was saved (a Mutator's game from before the lash comes back with the lash in hand, not the service gun everyone had then)
function weaponSnapshot() { return { w: playerWeapon, owned: { laser: !!weaponOwned.laser }, lv: Object.assign({}, weaponLevel), charge: laserCharge, cw: 1 }; }
function weaponRestore(d) {
    weaponReset(); if (!d) return;
    if (d.owned && d.owned.laser) weaponOwned.laser = true;
    if (d.lv) for (const id of WEAPON_ORDER) if (Number.isFinite(d.lv[id])) weaponLevel[id] = Math.max(1, Math.min(WEAPONS[id].maxLevel, d.lv[id] | 0));
    if (Number.isFinite(d.charge)) laserCharge = Math.max(0, Math.min(WEAPONS.laser.charges, d.charge | 0));
    if (d.w && weaponHas(d.w)) playerWeapon = d.w;
    const own = typeof playerClass === "function" && playerClass() ? playerClass().weapon : null;
    if (!d.cw && own && playerWeapon === "service" && weaponHas(own)) playerWeapon = own;
}

// ── the armory terminal's window ──
let armoryPanelOpen = false, _arMsg = null, _arButtons = [];
function armoryOpenNow() { armoryPanelOpen = true; _arMsg = null; }
function armoryClose() { armoryPanelOpen = false; _arButtons = []; }
function _arSay(r) { _arMsg = { text: r.ok ? r.msg : r.why, good: !!r.ok, until: (typeof frame !== "undefined" ? frame : 0) + 200 }; }
function _arLayout() {
    const W = canvas.width, H = canvas.height, wide = W >= 700, top = typeof uiTopSafe === "function" ? uiTopSafe() : 8, bottom = typeof uiBottomSafe === "function" ? uiBottomSafe() : H - 8;
    const pw = Math.min(W - 16, wide ? 860 : 440), ph = Math.min(Math.max(380, bottom - top), wide ? 520 : 760), px = Math.round((W - pw) / 2), py = Math.max(4, Math.min(top, H - ph - 4));
    return { px, py, pw, ph, wide };
}
function drawArmoryPanel() {
    if (!armoryPanelOpen || typeof uiPanel !== "function") return;
    const L = _arLayout(), f = typeof frame !== "undefined" ? frame : 0, col = "#31e8ff", btns = [], gut = 20, inner = L.pw - gut * 2;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    uiBackdrop(0.6); uiPanel(L.px, L.py, L.pw, L.ph, col);
    uiText("ARMORY TERMINAL", L.px + gut, L.py + 34, 26, col, "left");
    const cnt = (id, x) => { if (typeof invDrawIcon === "function") invDrawIcon(id, x + 14, L.py + 28, 28, f); uiText("×" + invCount(id), x + 32, L.py + 34, 17, itemDef(id).col, "left"); };
    if (L.wide) { cnt("scrap_metal", L.px + L.pw - 330); cnt("ammo_pack", L.px + L.pw - 235); cnt("fuel_cell", L.px + L.pw - 140); }
    const close = { x: L.px + L.pw - 108, y: L.py + L.ph - 52, w: 92, h: 38 }; btns.push({ r: close, fn: armoryClose }); uiButton(close, "CLOSE", UI_RED, false, 16);
    // scrap into ammunition
    let y = L.py + 56; const rowH = L.wide ? 74 : 98;
    uiSlab(L.px + gut, y, inner, rowH, "#8a929e", false, "#0b1226");
    uiText("SCRAP → AMMUNITION", L.px + gut + 14, y + 26, 18, "#ffb070", "left");
    uiCaptionFit(WEAPON_RULES.scrapPerAmmoPack + " SCRAP METAL = 1 AMMO PACK (+" + WEAPON_RULES.ammoPackRounds + " ROUNDS).  YOU HAVE " + invCount("scrap_metal") + " SCRAP.", L.px + gut + 14, y + 48, "#c8d4f0", "left", 12, inner - (L.wide ? 250 : 28));
    const b1 = L.wide ? { x: L.px + L.pw - gut - 232, y: y + 16, w: 106, h: 42 } : { x: L.px + gut + 14, y: y + 58, w: 100, h: 34 }, b2 = L.wide ? { x: L.px + L.pw - gut - 118, y: y + 16, w: 106, h: 42 } : { x: L.px + gut + 124, y: y + 58, w: 100, h: 34 };
    btns.push({ r: b1, fn: () => _arSay(weaponConvert(1)) }, { r: b2, fn: () => _arSay(weaponConvert("all")) });
    const can = invCount("scrap_metal") >= WEAPON_RULES.scrapPerAmmoPack && invRoom("ammo_pack") > 0;
    uiButton(b1, "MAKE 1", "#ffb070", false, 15, null, !can); uiButton(b2, "MAKE ALL", "#ffb070", false, 15, null, !can);
    y += rowH + 10;
    // the weapons
    const wh = L.wide ? 92 : 112;
    for (const id of weaponRows()) {
        const w = WEAPONS[id], has = weaponHas(id), held = playerWeapon === id, Lv = weaponLevelOf(id), up = weaponUpgradeCost(id);
        uiSlab(L.px + gut, y, inner, wh, held ? w.col : "#2a3556", false, held ? "#10243a" : "#0b1226", !has);
        uiText(w.name, L.px + gut + 14, y + 26, 20, has ? w.col : "#7a86a6", "left");
        const melee = w.kind === "melee" || w.kind === "hybrid", rate = (60 / (weaponCooldown(id) + (melee ? w.windup || (typeof MUTATOR !== "undefined" ? MUTATOR.lash.windup : 0) : 0))).toFixed(1);
        uiCaption(has ? (w.kind === "hybrid" ? "PUNCH " + weaponDamage(id) + "   ·   " + rate + " STRIKES/S   ·   REACH " + w.reach + "   ·   ARC " + (typeof technoArcDamage === "function" ? technoArcDamage() : "?") + " FOR A CHARGE" : melee ? "DAMAGE " + weaponDamage(id) + "   ·   " + rate + " STRIKES/S   ·   REACH " + w.reach + " TILES   ·   SPENDS NOTHING" : "LEVEL " + Lv + " / " + w.maxLevel + "   ·   DAMAGE " + weaponDamage(id) + "   ·   " + rate + " SHOTS/S   ·   " + (w.kind === "fuel" ? "FUEL CELLS" : "AMMUNITION")) : id === "machinegun" ? "THE GUNSLINGER'S  ·  FROM THE WEAPON LOCKER" : "NOT ASSEMBLED  ·  " + w.assemble + " SCRAP METAL", L.px + gut + 14, y + 46, has ? "#c8d4f0" : "#8aa0c8", "left", 12);
        const chars = Math.max(20, Math.floor((inner - (L.wide ? 270 : 28)) / 7.4)), lines = uiWrap(w.desc, chars).slice(0, L.wide ? 2 : 3); lines.forEach((l, i) => uiCaptionFit(l, L.px + gut + 14, y + 64 + i * 15, "#9fb0d6", "left", 11, inner - (L.wide ? 270 : 28)));
        const bx = L.wide ? L.px + L.pw - gut - 236 : L.px + gut + 14, by = L.wide ? y + 14 : y + wh - 40, bw = 110, bh = L.wide ? 30 : 32;
        if (has) {
            const eq = { x: bx, y: by, w: bw, h: bh }, upb = { x: bx + bw + 10, y: by, w: bw + 6, h: bh };
            btns.push({ r: eq, fn: () => _arSay(weaponEquip(id)) }); uiButton(eq, held ? "IN HAND" : "EQUIP", w.col, held, 14);
            btns.push({ r: upb, fn: () => _arSay(weaponUpgrade(id)) }); uiButton(upb, up === null ? "TOP LEVEL" : "UPGRADE · " + up, "#9dffb6", false, 13, null, up === null || !invHas("scrap_metal", up));
        } else if (w.assemble) {
            const as = { x: bx, y: by, w: bw * 2 + 16, h: bh }; btns.push({ r: as, fn: () => _arSay(weaponAssemble(id)) }); uiButton(as, "ASSEMBLE · " + w.assemble + " SCRAP", w.col, false, 14, null, !invHas("scrap_metal", w.assemble));
        }
        y += wh + 8;
    }
    if (_arMsg && _arMsg.until > f) uiTextFit(_arMsg.text, L.px + gut, L.py + L.ph - 28, 17, _arMsg.good ? "#9dffb6" : "#ff9c8a", "left", L.pw - 150);
    ctx.restore(); _arButtons = btns;
}
function _handleArmoryTap(tx, ty) {
    if (!armoryPanelOpen) return false;
    for (const b of _arButtons) if (tx >= b.r.x && tx <= b.r.x + b.r.w && ty >= b.r.y && ty <= b.r.y + b.r.h) { b.fn(); return true; }
    const L = _arLayout(); if (tx < L.px || tx > L.px + L.pw || ty < L.py || ty > L.py + L.ph) armoryClose();   // a tap outside shuts it
    return true;
}
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (e && e.key === "Escape" && armoryPanelOpen) armoryClose(); }); } catch (e) {}
