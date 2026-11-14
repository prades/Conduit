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
function _tgSees(a) { return typeof facilitySeesFrom === "function" ? facilitySeesFrom(player.visualX, player.visualY, a.x, a.y) : true; }   // (sight, which sees over low objects: js/facilityplay.js facilitySeesFrom)
function targetName(a) { if (a && a.isHazardTarget && typeof hazardTargetName === "function") return hazardTargetName(a); return typeof unitTypeLabel === "function" ? unitTypeLabel(a) : String(a.speciesName || "ENEMY").toUpperCase(); }   // (a flask locked as a target: js/hazards.js)
function _tgColour(a) { if (a && a.isHazardTarget) return a.color; const el = a.element && typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === a.element) : null; return el ? el.color : "#ff8a6a"; }

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
        if (targetFireHold()) { _gunPressed = true; _targetPressed = false; } return true;
    }
    // a creature other than the locked one: lock it instead (the locked one is the gun's: a click fires, holding keeps firing)
    const foe = typeof findEnemyAtScreen === "function" ? findEnemyAtScreen(ex, ey) : null;
    if (foe && foe !== targetCurrent()) { targetSet(foe, true); _tgBtnDown = { kind: "switch", x: ex, y: ey }; _targetPressed = true; return true; }
    // A FLASK (the owner, build 2026-11-13r: "Whenever the player clicks on a flask, it should show up at the bottom right as a target and for the mini command as a card"): locked as a creature is, its
    // stand-in (js/hazards.js hazardTarget) on THE CORE's slab and the enemy card; a tap on the locked one fires at it, as on a locked creature
    const hz = !foe && typeof hazardTargetAtScreen === "function" ? hazardTargetAtScreen(ex, ey) : null;
    if (hz) {
        if (hz !== targetCurrent()) { targetSet(hz, true); _tgBtnDown = { kind: "switch", x: ex, y: ey }; _targetPressed = true; return true; }
        if (targetFireHold()) { _gunPressed = true; _targetPressed = false; } return true;
    }
    return false;
}
// the FIRE button pressed (the dial's, or THE CORE's slab: js/corehud.js): a click is a shot, holding keeps firing at the locked creature until js/gunfire.js gunRelease. False with none locked.
function targetFireHold() {
    const foe = targetCurrent(); if (!foe) return false;
    const p = typeof _gunScreen === "function" ? _gunScreen(foe) : { x: 0, y: 0 };
    gunHold = { x: p.x, y: p.y, pending: true, released: false, until: 0, button: true }; if (typeof gunTick === "function") gunTick(); return true;
}
function targetMove() { }
// pointerup of a press that was the targeting's
function targetRelease(ex, ey) {
    const b = _tgBtnDown; _tgBtnDown = null; if (!b) return;
    if (b.kind === "info" && _tgOnInfo(ex, ey)) infoOpen = !infoOpen;
}

// ── the creature's picture ──
// the square it is first drawn into at its own size, and where its ground point is: 260 px (THE ANT QUEEN's fits), more for a bigger one (the diving beetle larva, build 2026-11-14b)
function _tgBox(a) { const n = Math.max(260, 2 * Math.ceil(1.3 * ((a && a.dimensions && a.dimensions.width) || 26))); return { n, ox: n / 2, oy: Math.round(n * 150 / 260) }; }
// Drawn once per kind with the game's own creature drawing (js/bugs3d.js) into a small canvas, fitted to the box whatever its size.
function targetPortrait(a) {
    if (a && a.isHazardTarget) return _tgHazardPic(a, 96, false);   // (a flask: its own sprite, js/hazards.js)
    if (!a) return null; const key = [a.speciesName, a.className, a.color, a.element, (typeof rolyArtReady === "function" ? +rolyArtReady(a) : 1), (typeof larvaArtReady === "function" ? +larvaArtReady(a) : 1)].join("|");   // (the last: a roly-poly's sheet has arrived, js/rolypoly.js: a beetle stood in before) if (_tgPortraits[key] !== undefined) return _tgPortraits[key];
    let c = null;
    try {
        c = document.createElement("canvas"); c.width = c.height = 96; const g = c.getContext("2d"), col = _tgColour(a);
        const bg = g.createRadialGradient(48, 50, 4, 48, 50, 62); bg.addColorStop(0, "rgba(86,104,160,0.95)"); bg.addColorStop(1, "rgba(14,20,44,0.95)"); g.fillStyle = bg; g.fillRect(0, 0, 96, 96);
        const halo = g.createRadialGradient(48, 56, 2, 48, 56, 44); halo.addColorStop(0, col); halo.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = 0.28; g.fillStyle = halo; g.fillRect(0, 0, 96, 96); g.globalAlpha = 1;
        const dx = a.dirX, dy = a.dirY, cu = a.curled; a.dirX = 0.35; a.dirY = 1; a.curled = 0;   // (facing the camera's left, as drawn in play, a roly-poly uncurled: put back below)
        try {
            const B = _tgBox(a), t = document.createElement("canvas"); t.width = t.height = B.n; const tg = t.getContext("2d"); tg.translate(B.ox, B.oy); if (typeof drawBug3D === "function") drawBug3D(a, 0, 0, tg);
            const d = tg.getImageData(0, 0, B.n, B.n).data; let x0 = B.n, y0 = B.n, x1 = -1, y1 = -1;
            for (let y = 0; y < B.n; y++) for (let x = 0; x < B.n; x++) if (d[(y * B.n + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
            if (x1 >= 0) { const w = x1 - x0 + 1, h = y1 - y0 + 1, sc = Math.min(5, 76 / Math.max(w, h)); g.imageSmoothingEnabled = true; g.drawImage(t, x0, y0, w, h, 48 - w * sc / 2, 50 - h * sc / 2, w * sc, h * sc); }
        } finally { a.dirX = dx; a.dirY = dy; a.curled = cu; }
    } catch (e) { c = null; }
    return (_tgPortraits[key] = c);
}

// A FLASK'S PICTURE (build 2026-11-13r): the container's own sprite (js/hazards.js hazardTargetPicture), fitted to a square of `size`, on the portrait's ground (`bare`: on a clear ground, the card's full
// art); kept once the sheet has arrived, null until then (so the card and the slab ask again)
const _tgHazardPics = {};
function _tgHazardPic(a, size, bare) {
    const key = a.solid.kind + "|" + size + "|" + (bare ? 1 : 0); if (_tgHazardPics[key]) return _tgHazardPics[key];
    const P = typeof hazardTargetPicture === "function" ? hazardTargetPicture(a) : null; if (!P) return null;
    let c = null;
    try {
        c = document.createElement("canvas"); c.width = c.height = size; const g = c.getContext("2d"), m = size / 2;
        if (!bare) { const bg = g.createRadialGradient(m, m, 4, m, m, size * 0.65); bg.addColorStop(0, "rgba(86,104,160,0.95)"); bg.addColorStop(1, "rgba(14,20,44,0.95)"); g.fillStyle = bg; g.fillRect(0, 0, size, size);
            const halo = g.createRadialGradient(m, m * 1.1, 2, m, m * 1.1, size * 0.46); halo.addColorStop(0, a.color); halo.addColorStop(1, "rgba(0,0,0,0)"); g.globalAlpha = 0.32; g.fillStyle = halo; g.fillRect(0, 0, size, size); g.globalAlpha = 1; }
        const sc = size * (bare ? 0.94 : 0.8) / Math.max(P.sw, P.sh), w = P.sw * sc, h = P.sh * sc; g.imageSmoothingEnabled = true; g.drawImage(P.img, P.sx, P.sy, P.sw, P.sh, m - w / 2, m - h / 2, w, h);
    } catch (e) { c = null; }
    if (c) _tgHazardPics[key] = c;
    return c;
}
// the same picture as a data URL, for the enemy card in the page (js/mixtool.js)
const _tgPortraitURLs = {};
function targetPortraitURL(a) {
    const c = targetPortrait(a); if (!c) return ""; const key = [a.speciesName, a.className, a.color, a.element].join("|");
    if (_tgPortraitURLs[key] === undefined) { try { _tgPortraitURLs[key] = c.toDataURL("image/png"); } catch (e) { _tgPortraitURLs[key] = ""; } }
    return _tgPortraitURLs[key];
}
// THE BIG PORTRAIT (the enemy card's full art at the left, build 2026-11-11o): the creature as the portrait draws it, but on a clear ground and drawn at the size it is shown
// (it is drawn in shapes, so it stays sharp), centred in a square, 94% of it; "" where it cannot be drawn (the card then takes the small portrait). Made once per kind.
const _tgBigURLs = {}, TG_BIG = 300;
function targetBigPortraitURL(a) {
    if (a && a.isHazardTarget) { const k = a.solid.kind; if (_tgBigURLs[k]) return _tgBigURLs[k]; const c = _tgHazardPic(a, TG_BIG, true); return c ? (_tgBigURLs[k] = c.toDataURL("image/png")) : ""; }   // (a flask: its own sprite, large: js/hazards.js)
    if (!a || typeof drawBug3D !== "function") return ""; const key = [a.speciesName, a.className, a.color, a.element, (typeof rolyArtReady === "function" ? +rolyArtReady(a) : 1), (typeof larvaArtReady === "function" ? +larvaArtReady(a) : 1)].join("|"); if (_tgBigURLs[key] !== undefined) return _tgBigURLs[key];
    let url = ""; const dx = a.dirX, dy = a.dirY, cu = a.curled; a.dirX = 0.35; a.dirY = 1; a.curled = 0;   // (facing the camera's left, as the portrait, a roly-poly uncurled: put back below)
    try {
        const B = _tgBox(a), t = document.createElement("canvas"); t.width = t.height = B.n; const tg = t.getContext("2d"); tg.translate(B.ox, B.oy); drawBug3D(a, 0, 0, tg);   // where it is: drawn once at its own size
        const d = tg.getImageData(0, 0, B.n, B.n).data; let x0 = B.n, y0 = B.n, x1 = -1, y1 = -1;
        for (let y = 0; y < B.n; y++) for (let x = 0; x < B.n; x++) if (d[(y * B.n + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 >= 0) {
            const w = x1 - x0 + 1, h = y1 - y0 + 1, sc = TG_BIG * 0.94 / Math.max(w, h), c = document.createElement("canvas"); c.width = c.height = TG_BIG; const g = c.getContext("2d");
            g.translate(TG_BIG / 2, TG_BIG / 2); g.scale(sc, sc); g.translate(-(x0 + w / 2 - B.ox), -(y0 + h / 2 - B.oy)); drawBug3D(a, 0, 0, g); url = c.toDataURL("image/png");
        }
    } catch (e) { url = ""; } finally { a.dirX = dx; a.dirY = dy; a.curled = cu; }
    return (_tgBigURLs[key] = url);
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
// a panel over the corner (or no play) hides the pills by the dial and the two round buttons: their tap areas go with them, so a tap there is the panel's (js/input.js asks them before the panels)
function _tgChipsOff() {
    _ATKCHIP.w = 0;
    if (typeof _SERUMCHIP !== "undefined") _SERUMCHIP.w = 0;
    if (typeof _POTIONCHIP !== "undefined") _POTIONCHIP.w = 0;
    if (typeof _KITCHIP !== "undefined") _KITCHIP.w = 0;
    if (typeof drawPlayerCombatChips === "function") drawPlayerCombatChips(null);   // (nothing to draw by: GUARD's and STUN's taps off)
}
function drawTargetUI() {
    _tgDial = null; if (!targetOn() || typeof ctx === "undefined") { _tgChipsOff(); return; }
    if ((typeof invPanelOpen !== "undefined" && invPanelOpen) || (typeof classPickerOpen !== "undefined" && classPickerOpen) || (typeof armoryPanelOpen !== "undefined" && armoryPanelOpen) || (typeof infoPanelOpen !== "undefined" && infoPanelOpen)) { _tgChipsOff(); return; }
    if (typeof drawPlayerCombatChips === "function") drawPlayerCombatChips(_tgAnchor());   // GUARD and STUN, round, just left of the dial (js/playercombat.js)
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
        const r = slot && slot.firstElementChild && slot.getBoundingClientRect ? slot.getBoundingClientRect() : null, cardTop = r && r.height > 0 && r.left > W / 2 ? r.top : canvas.height - 100 - 90;   // (the card stands at the left since build 2026-11-11m: the dial keeps the corner, where it stands with no card)
        const left = W - 14 - foeW, x = left + R + 6, ct = typeof coreTop === "function" ? coreTop() : null, y = Math.max(R + 12, Math.min(cardTop - 22 - R, ct !== null ? ct - 10 - R : Infinity));   // (above THE CORE when it is there: js/corehud.js)
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
// x: the pill's left edge, y: its middle. Sets the tap area (_ATKCHIP) while the gun is armed. maxX: how far right the row may run (THE CORE's box, js/corehud.js corePills): a pill that would run past it
// goes a row up, out to the left of the box (clear of its words and of the dock below), and any after it beside that one, leftwards.
function _tgAmmoIcon(x, y, alpha, maxX) {
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
    let px = x + w + 8, qx = x;   // (qx: where a pill that does not fit goes, leftwards from the row's start)
    for (let i = 0; i < 4; i++) {   // the pills beside it (_tgPill); in THE CORE each is measured first (drawn under an empty clip: nothing shows) to see whether it fits
        if (maxX) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 0, 0); ctx.clip(); const cw = _tgPill(i, px, y, alpha); ctx.restore();
            if (cw && (qx < x || px + cw - 8 > maxX)) { qx -= cw; _tgPill(i, qx, y - 30, alpha); continue; } }
        px += _tgPill(i, px, y, alpha);
    }
}
// a pill beside the ammunition, its left edge at x and its middle at y: the room it took (0 when it is not shown)
function _tgPill(i, x, y, alpha) {
    if (i === 0) { if (typeof drawSerumChip !== "function") return 0; drawSerumChip(x, y, alpha); return typeof _SERUMCHIP !== "undefined" && _SERUMCHIP.w ? _SERUMCHIP.w + 4 : 0; }   // the Mutator's serum (js/serum.js)
    if (i === 1) return typeof drawPotionChip === "function" ? drawPotionChip(x, y, alpha) || 0 : 0;   // the Sleeping Potion in hand, for every class (js/potion.js)
    if (i === 2) return typeof drawKitChip === "function" ? drawKitChip(x, y, alpha) || 0 : 0;         // the repair kits you carry (js/playercombat.js)
    return typeof drawPoisonChip === "function" ? drawPoisonChip(x, y, alpha) || 0 : 0;                 // POISONED, while a nymph's bite lasts (js/combat.js)
}
// THE CORE holds the pill row in its box (js/corehud.js corePills: the owner, 2026-11-11, "the new little box should include the ammo and the equipped item with it"), and hides it as it hides; else it is by the dial
function _tgPillsInCore() {
    const C = typeof corePills === "function" ? corePills() : null; if (C === null) return false;
    if (C) _tgAmmoIcon(C.x, C.y, 1, C.maxX); else _tgChipsOff();
    return true;
}
function _tgAmmoDraw() { if (_tgPillsInCore()) return; const A = _tgAnchor(); if (A.corner) _tgAmmoIcon(A.left + 4, A.y + 4, 1); else _tgAmmoIcon(A.left - 4, A.top + 12, 1); }
function _tgDialDraw(a, f) {
    if (typeof uiSlab !== "function") { _ATKCHIP.w = 0; return; }
    // THE CORE holds the creature's slab (js/corehud.js, build 2026-11-11v): no dial; its INFO card opens to the slab's left, its foot level with the slab's
    const F = typeof coreFoe === "function" ? coreFoe() : null;
    if (F !== null) { _tgDial = null; _tgPillsInCore(); if (F && infoOpen) _tgInfo(a, F.x0 + F.r, F.y, F.r, _tgColour(a)); return; }
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
    if (!_tgPillsInCore()) { if (corner) _tgAmmoIcon(x + R + 24, y + 4, ease); else _tgAmmoIcon(lx, y + R + 36, ease); }
    _tgDial = { x, y, r: R, ix, iy, ir };
    if (infoOpen) _tgInfo(a, x, y, R, col);
}
// the INFO card beside the dial: what it is and its numbers
const TARGET_NOTES = {
    species: { ant: "A colony animal: it swarms; workers carry.", beetle: "Armoured and slow: hits hard up close.", spider: "Spits webs and venom from a distance.", scorpion: "Strikes with a stinger tail from behind.", rolypoly: "A mech of the electrical domain: Crushing and Slashing do nothing to its plates, and hurt, it curls up.", mantis: "Ambushes with its raptorial forelegs.", moth: "Blows dust clouds that dull the senses." },
    cls: { scout: "Fast and fragile.", worker: "Middling at everything.", striker: "Hits hard, tougher than a scout.", tank: "Slow, with a great deal of health.", boss: "Very dangerous." },
};
function targetInfoLines(a) {
    if (a && a.isHazardTarget && typeof hazardTargetLines === "function") return hazardTargetLines(a);   // (a flask: what it does, js/hazards.js)
    const mx = Math.ceil(a.maxHealth || a.health || 0), hp = Math.ceil(Math.max(0, a.health)), pw = Number.isFinite(a.power) ? Math.round(a.power * 10) / 10 : "?", sp = Number.isFinite(a.moveSpeed) ? Math.round(a.moveSpeed * 1000) / 10 : "?";
    return [
        "LEVEL " + (Number.isFinite(a.level) ? a.level : "?") + "  ·  " + String(a.className || "").toUpperCase() + "  ·  " + (a.element ? String(a.element).toUpperCase() : "NO ELEMENT"),
        "HEALTH " + hp + " / " + mx + "   " + _tgBiteLabel(a) + " " + (Number.isFinite(a.power) ? Math.round(a.power * _tgBiteK(a) * 10) / 10 : pw) + "   SPEED " + sp,
        TARGET_NOTES.species[a.speciesName] || "", TARGET_NOTES.cls[a.className] || "",
    ].filter(Boolean);
}
// a creature with no plain bite (THE ANT QUEEN: her MANDIBLE CRUSH is her bite, js/bosses.js) shows her crush instead
function _tgCrush(a) { const E = a && a.noBite && a.bossId && typeof bossEnc === "function" ? bossEnc(a.bossId) : null; return E && E.moves && E.moves.crush ? E.moves.crush : null; }
function _tgBiteK(a) { const c = _tgCrush(a); return c ? c.power : 1; }
function _tgBiteLabel(a) { if (a && a.isHazardTarget) return a.solid && a.solid.kind === "hazard_corrosive" ? "ACID" : "BLAST"; return _tgCrush(a) ? "CRUSH" : "BITE"; }   // (a flask: its blast, or its acid's bite)
// what the enemy card shows (js/mixtool.js): its name (and the shorter title for the card) and colour, level and class, health and the two numbers that matter
function targetCardInfo(a) {
    const hp = Math.ceil(Math.max(0, a.health || 0)), mx = Math.max(1, Math.ceil(a.maxHealth || a.health || 1)), el = a.element && typeof ELEMENTS !== "undefined" ? ELEMENTS.find(e => e.id === a.element) : null;
    return {
        name: targetName(a), title: a.bossName ? a.bossName : a.speciesName ? ((typeof speciesLabel === "function" ? speciesLabel(a.speciesName) : String(a.speciesName || "").toUpperCase()) + " " + String(a.className || "").toUpperCase()).trim() : targetName(a),   // (a boss is named: js/bosses.js)   // (the card's name line: the kind, without the element, which is on the line under it in its colour)
        col: _tgColour(a), level: Number.isFinite(a.level) ? a.level : null, cls: String(a.className || "").toUpperCase(), element: el ? el.label.toUpperCase() : "", hp, max: mx, frac: Math.max(0, Math.min(1, hp / mx)),
        bite: Number.isFinite(a.power) ? Math.round(a.power * _tgBiteK(a) * 10) / 10 : null, biteLabel: _tgBiteLabel(a), speed: Number.isFinite(a.moveSpeed) ? Math.round(a.moveSpeed * 1000) / 10 : null,
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
