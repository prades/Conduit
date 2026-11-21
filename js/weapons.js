// ─────────────────────────────────────────────────────────
//  THE PLAYER'S WEAPON, AND THE ARMORY'S TERMINAL (docs/TUTORIAL.md, "Weapons")
// ─────────────────────────────────────────────────────────
// THE ONLY PERSONAL WEAPON IS THE GUNSLINGER'S MACHINE GUN (the owner, 2026-11-20: "I want to get rid of all guns except for the gun given to the gunslinger whenever the tutorial is finished. That means
// removing the tutorial gun, and also I want to remove the Technomancer's arc shot and melee. No melee unless it's the gunslinger."; and of the Mutator's lash: "Remove the lash too"). The SERVICE GUN every
// class began with, the LASER RIFLE (and its fuel cells), the Technomancer's ARC GAUNTLET and the Mutator's TENTACLE LASH went in build 2026-11-17at (docs/DECISION-LOG.md). The player has ONE weapon in hand
// or none, from a table (WEAPONS): the data says how hard it hits, how fast it fires and what it runs on, so another weapon is one more row.
//   MACHINE GUN    the Gunslinger's, taken from the Armory's weapon locker (js/stations.js) once the tutorial is over and the class is chosen. Ammunition (the pack's ammo packs fill the gun: js/inventory.js).
//   NO WEAPON      everyone else, and a Gunslinger who has not been to the locker: playerWeapon is null. Nothing is armed, nothing is fired, the dial has no fire button and there is no ammunition pill
//                  (js/input.js setPlayerAttackMode, firePlayerShot; js/targeting.js). The squad does the fighting.
// A weapon has a LEVEL (1 to 3): each level hits harder and fires faster. Levels are bought at the terminal with SCRAP METAL, which the arena's creatures drop where they fall (js/facilityspawn.js).
// THE ARMORY TERMINAL (a station: js/stations.js, in the Armory, working once the Armory relay has restored its power) is a window with two things: turn scrap into ammunition, and upgrade the weapon
// you have. What is in hand is also what the player is seen holding (js/playergear.js).
const WEAPONS = {
    machinegun: { id: "machinegun", name: "MACHINE GUN", kind: "ammo", damage: 8, cooldown: 11, maxLevel: 3, upgrade: [12, 24], col: "#ffb347", perk: "machinegun",
        desc: "A belt-fed gun held in your tentacles: one round a shot. The Gunslinger's, from the Armory's weapon locker." },
};
const WEAPON_ORDER = ["machinegun"];
const WEAPON_RULES = { levelDamage: 0.3, levelCooldown: 0.12, scrapPerAmmoPack: 2, ammoPackRounds: 10 };

let playerWeapon = null;                                        // the one in hand; null: none (every class but a Gunslinger who has been to the locker)
let weaponLevel = { machinegun: 1 };
function weaponReset() { playerWeapon = null; weaponLevel = { machinegun: 1 }; armoryClose(); }
// the weapon `id` (the one in hand when none is named), or null: no such weapon (one a game saved before build 2026-11-17at names), or none in hand
function weaponDef(id) { return WEAPONS[id || playerWeapon] || null; }
// what is owned: a weapon comes with a class's perk (the machine gun with the Gunslinger's, from the locker), and is that class's only while you are it (js/classes.js classHas)
function weaponHas(id) { const w = WEAPONS[id]; return !!w && !!w.perk && typeof classHas === "function" && classHas(w.perk); }
// is a weapon in hand, and yours to hold as the class you are now? (classes switch: the machine gun is not in a Technomancer's hand)
function weaponInHand() { return !!playerWeapon && weaponHas(playerWeapon); }
// the weapon the class you are has, or null (what a class takes up: js/classes.js; what a loaded game holds)
function weaponOwn() { return WEAPON_ORDER.find(id => weaponHas(id)) || null; }
// the class a weapon is reserved for (the class of the perk that gives it), or null
function weaponClassOf(id) { const w = WEAPONS[id]; return w && w.perk && typeof CLASS_PERKS !== "undefined" && CLASS_PERKS[w.perk] ? CLASS_PERKS[w.perk].cls : null; }
// the rows the Armory terminal lists: a weapon reserved for a class only to that class (with no class yet it is listed, as before)
function weaponRows() { const k = typeof playerClassKey !== "undefined" ? playerClassKey : null; return WEAPON_ORDER.filter(id => { const c = weaponClassOf(id); return !c || !k || c === k; }); }
function weaponLevelOf(id) { const w = weaponDef(id); return w ? Math.max(1, Math.min(w.maxLevel, weaponLevel[w.id] | 0 || 1)) : 1; }
// the numbers in hand: the weapon's own, raised by its level, and the class perks' on top (classStat). With no weapon: no damage, no wait.
function weaponDamage(id) { const w = weaponDef(id); if (!w) return 0; const L = weaponLevelOf(w.id); return Math.round(classStat("shotDamage", w.damage * (1 + WEAPON_RULES.levelDamage * (L - 1))) * 10) / 10; }
function weaponCooldown(id) {   // (a CRYO MARKSMAN awake fires the gun slower: js/playercards.js playerGunSlower)
    const w = weaponDef(id); if (!w) return 0;
    const L = weaponLevelOf(w.id), s = typeof playerGunSlower === "function" ? playerGunSlower(w.id) : 0;
    return Math.max(4, Math.round(classStat("shotCooldown", w.cooldown * (1 - WEAPON_RULES.levelCooldown * (L - 1))) / (1 - s)));
}
// take a weapon in hand. With none named (a class that carries none: js/classes.js) the hand is emptied, and anything armed is put away.
function weaponEquip(id) {
    if (!id) { playerWeapon = null; if (typeof playerAttackMode !== "undefined" && playerAttackMode && typeof setPlayerAttackMode === "function") setPlayerAttackMode(false, true); return { ok: true, msg: "NO WEAPON IN HAND" }; }
    if (!WEAPONS[id]) return { ok: false, why: "NO SUCH WEAPON" };
    if (!weaponHas(id)) return { ok: false, why: "THE GUNSLINGER'S: FROM THE WEAPON LOCKER" };
    playerWeapon = id;
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
// scrap into ammunition: `packs` ammo packs (or as many as scrap and room allow)
function weaponConvert(packs) {
    const per = WEAPON_RULES.scrapPerAmmoPack, have = invCount("scrap_metal"), room = invRoom("ammo_pack");
    if (have < per) return { ok: false, why: "NEEDS " + per + " SCRAP METAL" };
    if (room <= 0) return { ok: false, why: "YOUR PACK IS FULL OF AMMO PACKS" };
    const n = Math.min(packs === "all" ? 99 : Math.max(1, packs | 0), Math.floor(have / per), room);
    invRemove("scrap_metal", n * per); invAdd("ammo_pack", n);
    return { ok: true, msg: n + " AMMO PACK" + (n > 1 ? "S" : "") + " FOR " + n * per + " SCRAP" };
}
// nothing to fire? Out of rounds (the gunfire hold stops, the HUD says so), or no weapon in hand at all.
function weaponDry() { return !weaponInHand() || playerAmmo <= 0; }
// the HUD's words: { text, dry, short, kind, n }; null with no weapon in hand (no ammunition pill, no caption: js/targeting.js, js/draw.js)
function weaponHud() {
    if (!weaponInHand()) return null;
    const armed = typeof playerAttackMode !== "undefined" && playerAttackMode, dry = playerAmmo <= 0;
    return { text: armed ? (dry ? "NO AMMO — STOW" : "ARMED ◆ " + playerAmmo) : "AMMO ◆ " + playerAmmo, dry, short: "AMMO " + playerAmmo, kind: "ammo", n: playerAmmo, cells: 0 };   // (kind and n: what the little icon in the facility shows, js/targeting.js _tgAmmoIcon)
}

// ── what the facility's save keeps of it (js/facilitysave.js) ──
function weaponSnapshot() { return { w: playerWeapon, lv: Object.assign({}, weaponLevel) }; }
// A game saved before build 2026-11-17at may name a weapon that is gone (the service gun, the laser rifle, the lash, the gauntlet), and hold a rifle's charge and the others' levels: all of that is let
// go. It comes back with the weapon its class has (a Gunslinger who had been to the locker: the machine gun, at the level it had), or none.
function weaponRestore(d) {
    weaponReset();
    if (d && d.lv && typeof d.lv === "object") for (const id of WEAPON_ORDER) if (Number.isFinite(d.lv[id])) weaponLevel[id] = Math.max(1, Math.min(WEAPONS[id].maxLevel, d.lv[id] | 0));
    playerWeapon = d && d.w && weaponHas(d.w) ? d.w : weaponOwn();
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
    if (L.wide) { cnt("scrap_metal", L.px + L.pw - 235); cnt("ammo_pack", L.px + L.pw - 140); }
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
        const rate = (60 / weaponCooldown(id)).toFixed(1);
        uiCaption(has ? "LEVEL " + Lv + " / " + w.maxLevel + "   ·   DAMAGE " + weaponDamage(id) + "   ·   " + rate + " SHOTS/S   ·   AMMUNITION" : "THE GUNSLINGER'S  ·  FROM THE WEAPON LOCKER", L.px + gut + 14, y + 46, has ? "#c8d4f0" : "#8aa0c8", "left", 12);
        const chars = Math.max(20, Math.floor((inner - (L.wide ? 270 : 28)) / 7.4)), lines = uiWrap(w.desc, chars).slice(0, L.wide ? 2 : 3); lines.forEach((l, i) => uiCaptionFit(l, L.px + gut + 14, y + 64 + i * 15, "#9fb0d6", "left", 11, inner - (L.wide ? 270 : 28)));
        const bx = L.wide ? L.px + L.pw - gut - 236 : L.px + gut + 14, by = L.wide ? y + 14 : y + wh - 40, bw = 110, bh = L.wide ? 30 : 32;
        if (has) {
            const eq = { x: bx, y: by, w: bw, h: bh }, upb = { x: bx + bw + 10, y: by, w: bw + 6, h: bh };
            btns.push({ r: eq, fn: () => _arSay(weaponEquip(id)) }); uiButton(eq, held ? "IN HAND" : "EQUIP", w.col, held, 14);
            btns.push({ r: upb, fn: () => _arSay(weaponUpgrade(id)) }); uiButton(upb, up === null ? "TOP LEVEL" : "UPGRADE · " + up, "#9dffb6", false, 13, null, up === null || !invHas("scrap_metal", up));
        }
        y += wh + 8;
    }
    if (!weaponRows().length) uiCaptionFit("YOUR CLASS CARRIES NO WEAPON. THE MACHINE GUN IS THE GUNSLINGER'S.", L.px + gut + 14, y + 22, "#8aa0c8", "left", 12, inner - 28);   // (a Technomancer's or a Mutator's terminal: scrap into ammunition only)
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
