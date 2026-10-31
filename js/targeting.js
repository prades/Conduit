// ─────────────────────────────────────────────────────────
//  TARGETING: the gun locks on to the nearest creature by itself, and a round button at the top left fires at it (docs/TUTORIAL.md, "Targeting")
// ─────────────────────────────────────────────────────────
// ASKED: "whenever you get close to an enemy, it automatically takes aim [...] a little circular menu that shows the creature that you're nearest, and it pops up, and you can hold it or click it to shoot. It also comes
// with an info button and a little icon that shows a little gun that indicates that you're going to shoot it. [...] and how it automatically locks on to the nearest creature, have it so you can switch it by clicking on
// another creature." The bottom-left tool keeps RETREAT, HOLD, COME and the element selector (js/mixtool.js).
// In the facility:
//   AUTO-LOCK   every few frames the nearest creature within TARGET.range tiles that the player can see (no wall between) becomes the TARGET: the gun is armed (js/input.js setPlayerAttackMode), the red corners close in on
//               it and stay (js/gunfire.js drawLockReticle). A creature that is much nearer takes the lock over; with none in range the gun is put away.
//   THE DIAL    a round button where the objective's plate ends: the target's picture in a ring that is its health, its level, a small gun (it fires at what is locked), an INFO button (what it is, and its numbers) and
//               below it the ammunition. CLICK it for a shot, HOLD it to keep firing (the gun's own rate: js/gunfire.js).
//   STAND DOWN  the ammunition chip puts the gun away, and it stays away until no creature is in range (or one is tapped).
//   SWITCH      a tap on ANOTHER creature locks that one instead (and keeps it while it is within TARGET.manualKeep tiles); a tap on the locked creature is a shot, hold to keep firing (as before).
const TARGET = { range: 9, keep: 12, manualKeep: 18, every: 8, margin: 1.6, pop: 12, acquire: 24 };
let lockManual = false;         // the player chose the target by tapping it: kept until it dies or goes far
let _acquireAt = -1000;         // the frame the current target was locked (the pop-in, the closing corners)
let standDown = false;          // the player stowed the gun (the ammunition chip): no auto-lock until no creature is in range, or one is tapped
let infoOpen = false;           // the INFO card is up
let _ixSubject = null;          // the creature the enemy card in the bottom-left tool is for (js/mixtool.js)
const _tgIds = new WeakMap(); let _tgIdN = 0;
let _targetPressed = false;     // the press is the targeting's (input.js starts no ring, move or long-hold under it)
let _tgBtnDown = null;          // { kind: "info" | "switch", x, y }
let _tgDial = null;             // where the dial was drawn: { x, y, r, ix, iy, ir }
const _tgPortraits = {};
let _tgSlot = null;               // the enemy card's slot in the page (the dial stands over it in the corners layout)

function targetLive(a) { return !!a && !a.dead && a.team !== "green" && !a.isClone; }
function targetOn() { return typeof facilityPlay !== "undefined" && facilityPlay; }
function targetCurrent() { return typeof playerLockTarget !== "undefined" && targetLive(playerLockTarget) ? playerLockTarget : null; }
function _tgDist(a) { return Math.hypot(a.x - player.x, a.y - player.y); }
function _tgSees(a) { return typeof _fpLos === "function" && typeof _fp !== "undefined" && _fp && _fp.F ? _fpLos(player.visualX, player.visualY, a.x, a.y) : true; }
function targetName(a) { return typeof unitTypeLabel === "function" ? unitTypeLabel(a) : String(a.speciesName || "ENEMY").toUpperCase(); }
function _tgColour(a) { const el = a.element && typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === a.element) : null; return el ? el.color : "#ff8a6a"; }

// the nearest creature in range that can be seen
function targetNearest() {
    let best = null, bd = TARGET.range;
    for (const a of actors) { if (!(a instanceof Predator) || !targetLive(a) || (typeof spiderLurking === "function" && spiderLurking(a)) || (typeof bossPassive === "function" && bossPassive(a))) continue; const d = _tgDist(a); if (d < bd && _tgSees(a)) { bd = d; best = a; } }   // (a spider lurking at cover is passed by: js/facilityspawn.js; so is a boss asleep or calm in its lair: a tap still locks it, js/bosses.js)
    return best;
}
function targetSet(foe, manual) {
    if (!targetLive(foe)) return false;
    if (typeof gunLock === "function") gunLock(foe); setPlayerAttackMode(true, true);
    lockManual = !!manual; standDown = false; _acquireAt = typeof frame !== "undefined" ? frame : 0; _ixSubject = foe; _tgRefresh(); return true;
}
function targetDrop() {
    if (typeof gunStow === "function") gunStow(); if (typeof playerAttackMode !== "undefined" && playerAttackMode) setPlayerAttackMode(false, true);
    lockManual = false; infoOpen = false; _tgRefresh();
}
// the ammunition chip put the gun away: it stays away while creatures are about (the auto-lock would only take it out again)
function targetStand() { if (!targetOn()) return; standDown = true; lockManual = false; infoOpen = false; _tgRefresh(); }
function _tgRefresh() { if (typeof mixToolRender === "function") mixToolRender(false); }

// THE ENEMY CARD'S CREATURE (js/mixtool.js): the one the gun is locked on (the dial at the top left and the card are always one creature), else the one the card already had while it is still near and in sight, else the nearest in range that can be seen
// (so it does not jump about, and it is there with the gun put away).
function targetIndexSubject() { return targetOn() && targetLive(_ixSubject) ? _ixSubject : null; }
function targetIndexId(a) { if (!a) return 0; let n = _tgIds.get(a); if (!n) _tgIds.set(a, n = ++_tgIdN); return n; }
function _tgIndexUpdate() {
    let cur = _ixSubject;
    if (cur && (!targetLive(cur) || _tgDist(cur) > TARGET.keep || (!_tgSees(cur) && _tgDist(cur) > 3))) cur = null;
    const next = targetCurrent() || cur || targetNearest();
    if (next !== _ixSubject) { _ixSubject = next; _tgRefresh(); }
}
// each frame (game.js, after the gun)
function targetTick() {
    if (!targetOn() || (typeof gameState !== "undefined" && !gameState.running)) { if (_ixSubject) { _ixSubject = null; _tgRefresh(); } return; }
    const f = typeof frame !== "undefined" ? frame : 0; if (f % TARGET.every !== 0) return;
    _targetLockTick(); _tgIndexUpdate();
}
function _targetLockTick() {
    if (standDown) { if (!targetNearest()) standDown = false; return; }
    let cur = targetCurrent();
    if (cur && (_tgDist(cur) > (lockManual ? TARGET.manualKeep : TARGET.keep) || (!lockManual && !_tgSees(cur) && _tgDist(cur) > 3))) { cur = null; if (typeof gunStow === "function") gunStow(); }
    if (cur && !lockManual) { const n = targetNearest(); if (n && n !== cur && _tgDist(n) + TARGET.margin < _tgDist(cur)) { targetSet(n, false); return; } }   // a much nearer one takes the lock over
    if (!cur) { const n = targetNearest(); if (n) targetSet(n, false); else if (typeof playerAttackMode !== "undefined" && playerAttackMode) targetDrop(); }
}

// ── the press (input.js) ──
function _tgOnDial(ex, ey) { const d = _tgDial; return !!d && Math.hypot(ex - d.x, ey - d.y) <= d.r + 4; }
function _tgOnInfo(ex, ey) { const d = _tgDial; return !!d && Math.hypot(ex - d.ix, ey - d.iy) <= d.ir + 6; }
// pointerdown: true when it is the targeting's
function targetPress(ex, ey) {
    if (!targetOn()) return false;
    if (_tgDial && (_tgOnInfo(ex, ey) || _tgOnDial(ex, ey))) {
        if (_tgOnInfo(ex, ey)) { _tgBtnDown = { kind: "info", x: ex, y: ey }; _targetPressed = true; return true; }
        // the dial itself is the FIRE button: a click is a shot, holding it keeps firing at the locked creature
        const foe = targetCurrent(); if (!foe) return true;
        const p = typeof _gunScreen === "function" ? _gunScreen(foe) : { x: ex, y: ey };
        gunHold = { x: p.x, y: p.y, pending: true, released: false, until: 0, button: true }; _gunPressed = true; _targetPressed = false; gunTick(); return true;
    }
    // a creature other than the locked one: lock it instead (the locked one is the gun's: a click fires, holding keeps firing)
    const foe = typeof findEnemyAtScreen === "function" ? findEnemyAtScreen(ex, ey) : null;
    if (foe && foe !== targetCurrent()) { targetSet(foe, true); _tgBtnDown = { kind: "switch", x: ex, y: ey }; _targetPressed = true; return true; }
    return false;
}
function targetMove() { }
// pointerup of a press that was the targeting's
function targetRelease(ex, ey) {
    const b = _tgBtnDown; _tgBtnDown = null; if (!b) return;
    if (b.kind === "info" && _tgOnInfo(ex, ey)) infoOpen = !infoOpen;
}

// ── the creature's picture ──
// Drawn once per kind with the game's own creature drawing (js/bugs3d.js) into a small canvas, fitted to the box whatever its size.
function targetPortrait(a) {
    if (!a) return null; const key = [a.speciesName, a.className, a.color, a.element].join("|"); if (_tgPortraits[key] !== undefined) return _tgPortraits[key];
    let c = null;
    try {
        c = document.createElement("canvas"); c.width = c.height = 96; const g = c.getContext("2d"), col = _tgColour(a);
        const bg = g.createRadialGradient(48, 50, 4, 48, 50, 62); bg.addColorStop(0, "rgba(86,104,160,0.95)"); bg.addColorStop(1, "rgba(14,20,44,0.95)"); g.fillStyle = bg; g.fillRect(0, 0, 96, 96);
        const halo = g.createRadialGradient(48, 56, 2, 48, 56, 44); halo.addColorStop(0, col); halo.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = 0.28; g.fillStyle = halo; g.fillRect(0, 0, 96, 96); g.globalAlpha = 1;
        const dx = a.dirX, dy = a.dirY; a.dirX = 0.35; a.dirY = 1;   // (facing the camera's left, as drawn in play; put back below)
        try {
            const t = document.createElement("canvas"); t.width = t.height = 260; const tg = t.getContext("2d"); tg.translate(130, 150); if (typeof drawBug3D === "function") drawBug3D(a, 0, 0, tg);
            const d = tg.getImageData(0, 0, 260, 260).data; let x0 = 260, y0 = 260, x1 = -1, y1 = -1;
            for (let y = 0; y < 260; y++) for (let x = 0; x < 260; x++) if (d[(y * 260 + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
            if (x1 >= 0) { const w = x1 - x0 + 1, h = y1 - y0 + 1, sc = Math.min(5, 76 / Math.max(w, h)); g.imageSmoothingEnabled = true; g.drawImage(t, x0, y0, w, h, 48 - w * sc / 2, 50 - h * sc / 2, w * sc, h * sc); }
        } finally { a.dirX = dx; a.dirY = dy; }
    } catch (e) { c = null; }
    return (_tgPortraits[key] = c);
}

// the same picture as a data URL, for the enemy card in the page (js/mixtool.js)
const _tgPortraitURLs = {};
function targetPortraitURL(a) {
    const c = targetPortrait(a); if (!c) return ""; const key = [a.speciesName, a.className, a.color, a.element].join("|");
    if (_tgPortraitURLs[key] === undefined) { try { _tgPortraitURLs[key] = c.toDataURL("image/png"); } catch (e) { _tgPortraitURLs[key] = ""; } }
    return _tgPortraitURLs[key];
}

// ── drawing ──
function _tgScreen(a) { return typeof _gunScreen === "function" ? _gunScreen(a) : { x: canvas.width / 2, y: canvas.height / 2 }; }
function _tgCorners(p, r, k, col, w, alpha) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = "round"; ctx.globalAlpha = alpha;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(p.x + sx * r, p.y + sy * (r - k)); ctx.lineTo(p.x + sx * r, p.y + sy * r); ctx.lineTo(p.x + sx * (r - k), p.y + sy * r); ctx.stroke(); }
}
// a little pistol, centred on (x, y), about 22 px wide: what the dial's gun badge shows
function _tgGun(x, y, col) {
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineJoin = "round";
    ctx.fillRect(-11, -6, 20, 6); ctx.fillRect(7, -5, 5, 3);                                 // the slide and the muzzle
    ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(-2, 0); ctx.lineTo(-4, 10); ctx.lineTo(-10, 10); ctx.closePath(); ctx.fill();   // the grip
    ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(1.5, 2.2, 3.6, 0.1, Math.PI - 0.1); ctx.stroke();   // the trigger guard
    ctx.restore();
}
// a tentacle curling to a point, centred on (x, y), about 22 px: the badge (and the small icon) when the weapon in hand is the Mutator's lash (js/weapons.js, a melee weapon)
function _tgLash(x, y, col) {
    ctx.save(); ctx.translate(x, y); ctx.strokeStyle = col; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-9, 8); ctx.bezierCurveTo(-10, -2, -2, -9, 5, -6); ctx.stroke();
    ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(5, -6); ctx.quadraticCurveTo(10, -3, 7, 1); ctx.stroke();
    ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(7, 1); ctx.quadraticCurveTo(5, 3, 3, 1); ctx.stroke();
    ctx.restore();
}
// a lightning bolt, centred on (x, y), about 20 px tall: the badge (and the small icon) when the weapon in hand is the Technomancer's arc gauntlet (js/weapons.js, a hybrid weapon)
function _tgBolt(x, y, col, s) {
    ctx.save(); ctx.translate(x, y); if (s) ctx.scale(s, s); ctx.fillStyle = col; ctx.beginPath();
    ctx.moveTo(2, -10); ctx.lineTo(-6, 1); ctx.lineTo(-1, 1); ctx.lineTo(-3, 10); ctx.lineTo(6, -2); ctx.lineTo(1, -2); ctx.lineTo(3, -10); ctx.closePath(); ctx.fill();
    ctx.restore();
}
function _tgMelee() { return typeof weaponMelee === "function" && weaponMelee(); }
function _tgHybrid() { return typeof weaponDef === "function" && weaponDef().kind === "hybrid"; }
function drawTargetUI() {
    _tgDial = null; if (!targetOn() || typeof ctx === "undefined") return;
    if ((typeof invPanelOpen !== "undefined" && invPanelOpen) || (typeof classPickerOpen !== "undefined" && classPickerOpen) || (typeof armoryPanelOpen !== "undefined" && armoryPanelOpen) || (typeof infoPanelOpen !== "undefined" && infoPanelOpen)) { _ATKCHIP.w = 0; return; }
    const a = targetCurrent(); if (!a) { _tgAmmoDraw(); return; }   // (no creature: the ammunition is still there, where the button comes up)
    const f = typeof frame !== "undefined" ? frame : 0, p = _tgScreen(a), age = f - _acquireAt;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (age >= 0 && age < TARGET.acquire) { const k = age / TARGET.acquire; _tgCorners(p, 60 - 34 * k, 10, k > 0.7 ? "#ff4a3a" : "#ffb347", 3, 0.95); }   // locking on: the corners close in (then drawLockReticle's red ones stay)
    ctx.restore();
    _tgDialDraw(a, f);
}
// where the round button comes up, at the top left under the objective's plate (a phone has the menu hub at the left edge, halfway down: the button goes beside it); the ammunition icon shares it
function _tgAnchor() {
    const W = canvas.width, narrow = W < 600, R = narrow ? 40 : 52;
    // THE CORNERS (js/party.js hudCorners; a tablet or a desktop): the dial stands over the enemy card at the bottom right (the target's corner), the ammunition beside it; the card is where game.html puts it (--cn-foe wide, 14 px from the right, over the dock's line)
    if (typeof hudCorners === "function" && hudCorners()) {
        const foeW = W > 1100 ? 260 : W > 900 ? 232 : 214; if (!_tgSlot || _tgSlot.isConnected === false) _tgSlot = typeof document !== "undefined" && document.querySelector ? document.querySelector("#mixTool .mt-foe-slot") : null;
        const slot = _tgSlot;
        const r = slot && slot.firstElementChild && slot.getBoundingClientRect ? slot.getBoundingClientRect() : null, cardTop = r && r.height > 0 ? r.top : canvas.height - 100 - 90;
        const left = W - 14 - foeW, x = left + R + 6, y = Math.max(R + 12, cardTop - 22 - R);
        return { W, narrow, R, left, top: y - R, x, y, corner: true };
    }
    const left = typeof dockHasMenus === "function" && !dockHasMenus() ? 78 : 18, net = narrow && typeof _fnBottom === "number" ? _fnBottom : 0;
    // under the objective (a phone's plate is folded into a small mailbox, so that is high up) and, on a phone, under the network panel at the top right (its text runs back to the middle of a narrow screen)
    const top = Math.max(typeof _fpObjBottom === "number" && _fpObjBottom > 0 ? _fpObjBottom + 12 : 196, net > 0 ? net + 8 : 0);
    return { W, narrow, R, left, top, x: left + R, y: Math.min(top + R + 4, canvas.height - R - 130) };
}
// THE AMMUNITION, subtle (ASKED: "move the information where it says ammo or armed up where the old little index UI shows up for the predators [...] make it subtle, like an icon with ammo and have a number on it"):
// a small cartridge (the laser's fuel: a cell) with the count beside it, in a faint pill, where the round button comes up: under the button's name with a creature locked, in the button's place with none. It is a quiet
// blue-grey, amber and breathing a little while the gun is armed, red when it is empty. It was a big chip, AMMO / ARMED, at the bottom of the screen; like it, a tap on it while armed puts the gun away.
function _tgCartridge(cx, cy, col) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(cx - 3, cy + 1); ctx.lineTo(cx - 3, cy - 3); ctx.quadraticCurveTo(cx - 3, cy - 7, cx, cy - 8); ctx.quadraticCurveTo(cx + 3, cy - 7, cx + 3, cy - 3); ctx.lineTo(cx + 3, cy + 1); ctx.closePath(); ctx.fill();   // the bullet
    ctx.fillRect(cx - 3.5, cy + 2, 7, 6); ctx.fillStyle = "rgba(6,10,24,0.45)"; ctx.fillRect(cx - 3.5, cy + 1, 7, 1.2);                                                                                                       // the case, and where it joins the bullet
}
function _tgFuelCell(cx, cy, col) {
    ctx.fillStyle = col; ctx.fillRect(cx - 2, cy - 8, 4, 2); ctx.fillRect(cx - 4, cy - 6, 8, 14);                                  // the nub and the body
    ctx.fillStyle = "rgba(6,10,24,0.75)"; ctx.beginPath(); ctx.moveTo(cx + 1, cy - 4); ctx.lineTo(cx - 2, cy + 1); ctx.lineTo(cx, cy + 1); ctx.lineTo(cx - 1, cy + 6); ctx.lineTo(cx + 2, cy); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();   // a bolt on it
}
// x: the pill's left edge, y: its middle. Sets the tap area (_ATKCHIP) while the gun is armed.
function _tgAmmoIcon(x, y, alpha) {
    const h = typeof weaponHud === "function" ? weaponHud() : null; if (!h) { _ATKCHIP.w = 0; return; }
    const armed = typeof playerAttackMode !== "undefined" && playerAttackMode, dry = !!h.dry, f = typeof frame !== "undefined" ? frame : 0, col = dry ? "#ff7766" : armed ? "#ffb070" : "#b8c8e8";
    const txt = h.kind === "melee" ? "MELEE" : h.kind === "hybrid" ? String(h.n) + (h.grid && !h.full ? " · GRID" : "") : String(h.n) + (h.cells ? " +" + h.cells : ""), hh = 22;   // (the gauntlet: its charges, and GRID while a powered room is charging it)
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha * (armed && !dry ? 0.82 + 0.18 * Math.sin(f * 0.09) : 0.9); ctx.font = uiMono(13);
    const w = 29 + ctx.measureText(txt).width;
    ctx.fillStyle = "rgba(6,10,24,0.6)"; ctx.strokeStyle = armed || dry ? col : "rgba(138,160,200,0.4)"; ctx.lineWidth = 1;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y - hh / 2, w, hh, 11); else ctx.rect(x, y - hh / 2, w, hh); ctx.fill(); ctx.stroke();
    if (h.kind === "fuel") _tgFuelCell(x + 12, y, col); else if (h.kind === "melee") _tgLash(x + 12, y, col); else if (h.kind === "hybrid") _tgBolt(x + 12, y, typeof _tc !== "undefined" && f - _tc.gainAt < 20 ? "#eaffff" : col, 0.8); else _tgCartridge(x + 12, y, col);   // (the bolt flashes white as a charge is stored)
    ctx.fillStyle = col; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(txt, x + 24, y + 1);
    ctx.restore();
    if (armed) { _ATKCHIP.x = x - 4; _ATKCHIP.y = y - hh / 2 - 4; _ATKCHIP.w = w + 8; _ATKCHIP.h = hh + 8; } else _ATKCHIP.w = 0;
    if (typeof drawSerumChip === "function") drawSerumChip(x + w + 8, y, alpha);   // the Mutator's serum, beside it (js/serum.js)
    let px = x + w + 8 + (typeof _SERUMCHIP !== "undefined" && _SERUMCHIP.w ? _SERUMCHIP.w + 4 : 0);
    if (typeof drawPotionChip === "function") px += drawPotionChip(px, y, alpha) || 0;   // the Sleeping Potion in hand, for every class (js/potion.js)
    if (typeof drawPoisonChip === "function") drawPoisonChip(px, y, alpha);             // POISONED, while a nymph's bite lasts (js/combat.js)
}
function _tgAmmoDraw() { const A = _tgAnchor(); if (A.corner) _tgAmmoIcon(A.left + 4, A.y + 4, 1); else _tgAmmoIcon(A.left - 4, A.top + 12, 1); }
function _tgDialDraw(a, f) {
    if (typeof uiSlab !== "function") { _ATKCHIP.w = 0; return; }
    const { W, narrow, R, left, x, y, corner } = _tgAnchor(), col = _tgColour(a);
    const held = typeof gunHold !== "undefined" && gunHold && gunHold.button && !gunHold.released, dry = typeof weaponDry === "function" ? weaponDry() : false, cool = (player.attackCooldown || 0) > 0;
    const pop = Math.max(0, Math.min(1, (f - _acquireAt) / TARGET.pop)), ease = 1 - Math.pow(1 - pop, 3), s = 0.55 + 0.45 * ease + (held ? 0.04 * Math.sin(f * 0.7) : 0);
    const hp = Math.max(0, a.health), mx = Math.max(1, a.maxHealth || a.health || 1), hf = Math.min(1, hp / mx);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = Math.max(0.01, ease); ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-x, -y);
    // a glow behind it (red while the trigger is held), the dark disc, the portrait cut to a circle
    const gl = ctx.createRadialGradient(x, y, R * 0.6, x, y, R * 1.5); gl.addColorStop(0, held ? "rgba(255,74,58,0.45)" : "rgba(255,136,68,0.22)"); gl.addColorStop(1, "rgba(255,136,68,0)"); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, R * 1.5, 0, 6.2832); ctx.fill();
    ctx.fillStyle = "#0b1226"; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.2832); ctx.fill();
    const pic = targetPortrait(a); if (pic) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, R - 8, 0, 6.2832); ctx.clip(); ctx.drawImage(pic, x - R + 8, y - R + 8, (R - 8) * 2, (R - 8) * 2); ctx.restore(); }
    // the ring: its health, from the top round clockwise
    ctx.lineCap = "round"; ctx.lineWidth = 7; ctx.strokeStyle = "rgba(255,255,255,0.14)"; ctx.beginPath(); ctx.arc(x, y, R - 3.5, 0, 6.2832); ctx.stroke();
    ctx.strokeStyle = hf > 0.5 ? "#5fe0a0" : hf > 0.25 ? "#ffd34d" : "#ff5a3a"; ctx.beginPath(); ctx.arc(x, y, R - 3.5, -Math.PI / 2, -Math.PI / 2 + hf * 6.2832); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = held ? "#ff4a3a" : col; ctx.beginPath(); ctx.arc(x, y, R + 1, 0, 6.2832); ctx.stroke();
    // its level, on the disc's upper left
    const lv = "LV " + (Number.isFinite(a.level) ? a.level : "?"); ctx.font = uiMono(11); const lw = ctx.measureText(lv).width + 10; ctx.fillStyle = "rgba(6,10,24,0.92)"; ctx.fillRect(x - R * 0.82, y - R * 0.86, lw, 16); ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.strokeRect(x - R * 0.82 + 0.5, y - R * 0.86 + 0.5, lw - 1, 15);
    ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(lv, x - R * 0.82 + 5, y - R * 0.86 + 8.5);
    // the gun badge (it fires at what is locked) and the INFO badge
    const gx = x + R * 0.74, gy = y + R * 0.74, gr = narrow ? 15 : 18, ix = x + R * 0.78, iy = y - R * 0.78, ir = narrow ? 11 : 13, gcol = dry ? "#6d7fa6" : held ? "#ffffff" : cool ? "#ffb347" : "#ff4a3a";
    ctx.fillStyle = held ? "#ff4a3a" : "#0b1226"; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, 6.2832); ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = dry ? "#6d7fa6" : "#ff4a3a"; ctx.stroke(); if (_tgHybrid()) _tgBolt(gx, gy, gcol); else if (_tgMelee()) _tgLash(gx, gy, gcol); else _tgGun(gx, gy - 2, gcol);
    ctx.fillStyle = infoOpen ? "#8fe3ff" : "#0b1226"; ctx.beginPath(); ctx.arc(ix, iy, ir, 0, 6.2832); ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = "#8fe3ff"; ctx.stroke();
    ctx.fillStyle = infoOpen ? "#05070f" : "#8fe3ff"; ctx.font = uiFont(narrow ? 13 : 15); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("i", ix, iy + 1);
    ctx.restore();
    // what it is under it, and the ammunition (the small icon) under that (not scaled: it must read)
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = ease;
    const lx = left - 4, nw = Math.min(230, W - lx - 8);
    if (!corner) uiCaptionFit(targetName(a), lx, y + R + 16, "#ffd9a0", "left", 12, nw);   // (the corner's enemy card says what it is)
    ctx.restore();
    if (corner) _tgAmmoIcon(x + R + 24, y + 4, ease); else _tgAmmoIcon(lx, y + R + 36, ease);
    _tgDial = { x, y, r: R, ix, iy, ir };
    if (infoOpen) _tgInfo(a, x, y, R, col);
}
// the INFO card beside the dial: what it is and its numbers
const TARGET_NOTES = {
    species: { ant: "A colony animal: it swarms; workers carry.", beetle: "Armoured and slow: hits hard up close.", spider: "Spits webs and venom from a distance.", scorpion: "Strikes with a stinger tail from behind.", mantis: "Ambushes with its raptorial forelegs.", moth: "Blows dust clouds that dull the senses." },
    cls: { scout: "Fast and fragile.", worker: "Middling at everything.", striker: "Hits hard, tougher than a scout.", tank: "Slow, with a great deal of health.", boss: "Very dangerous." },
};
function targetInfoLines(a) {
    const mx = Math.ceil(a.maxHealth || a.health || 0), hp = Math.ceil(Math.max(0, a.health)), pw = Number.isFinite(a.power) ? Math.round(a.power * 10) / 10 : "?", sp = Number.isFinite(a.moveSpeed) ? Math.round(a.moveSpeed * 1000) / 10 : "?";
    return [
        "LEVEL " + (Number.isFinite(a.level) ? a.level : "?") + "  ·  " + String(a.className || "").toUpperCase() + "  ·  " + (a.element ? String(a.element).toUpperCase() : "NO ELEMENT"),
        "HEALTH " + hp + " / " + mx + "   BITE " + pw + "   SPEED " + sp,
        TARGET_NOTES.species[a.speciesName] || "", TARGET_NOTES.cls[a.className] || "",
    ].filter(Boolean);
}
// what the enemy card shows (js/mixtool.js): its name (and the shorter title for the card) and colour, level and class, health and the two numbers that matter
function targetCardInfo(a) {
    const hp = Math.ceil(Math.max(0, a.health || 0)), mx = Math.max(1, Math.ceil(a.maxHealth || a.health || 1)), el = a.element && typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === a.element) : null;
    return {
        name: targetName(a), title: a.bossName ? a.bossName : a.speciesName ? (String(a.speciesName) + " " + String(a.className || "")).trim().toUpperCase() : targetName(a),   // (a boss is named: js/bosses.js)   // (the card's name line: the kind, without the element, which is on the line under it in its colour)
        col: _tgColour(a), level: Number.isFinite(a.level) ? a.level : null, cls: String(a.className || "").toUpperCase(), element: el ? el.label.toUpperCase() : "", hp, max: mx, frac: Math.max(0, Math.min(1, hp / mx)),
        bite: Number.isFinite(a.power) ? Math.round(a.power * 10) / 10 : null, speed: Number.isFinite(a.moveSpeed) ? Math.round(a.moveSpeed * 1000) / 10 : null,
    };
}
function _tgInfo(a, x, y, R, col) {
    const W = canvas.width, corner = typeof hudCorners === "function" && hudCorners(), w = corner ? Math.min(320, x - R - 24 - 8) : Math.min(320, W - (x + R + 24) - 8), lines = targetInfoLines(a), h = 36 + lines.length * 17 + 6;
    const bx = corner ? Math.max(8, x - R - 18 - w) : w >= 200 ? x + R + 18 : 12, by = corner ? Math.max(8, y - R - h + 2 * R) : w >= 200 ? y - R : y + R + 46, bw = corner ? w : w >= 200 ? w : Math.min(320, W - 24);   // (at the bottom right it opens to the left of the dial, its foot level with the dial's)
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); uiSlab(bx, by, bw, h, col, false, "#0b1226");
    uiTextFit(targetName(a), bx + 14, by + 20, 15, col, "left", bw - 28);
    lines.forEach((l, i) => uiCaptionFit(l, bx + 14, by + 42 + i * 17, i < 2 ? "#e8f0ff" : "#9fb0d6", "left", 12, bw - 28));
    ctx.restore();
}
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (e && e.key === "Escape" && infoOpen) infoOpen = false; }); } catch (e) {}
