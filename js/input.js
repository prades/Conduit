// ─────────────────────────────────────────────────────────
//  INPUT
// ─────────────────────────────────────────────────────────
// A tap on the floor walks the player there (js/facilityplay.js facilityWalkTo); a tap on a creature while armed fires at it (js/gunfire.js takes a press on an enemy first); a press and hold opens the
// LONG-PRESS RING (js/draw.js drawRadialMenu, js/commands.js executeCommand): on a follower its ROSTER CARD and RE-ROLL, on a creature ATTACK / STOW and INFO, on the ground POSITION and INFO. The
// panels drawn on the canvas (the pack, the class picker, the Armory's terminal, the INFO panel, SETTINGS: js/settings.js handleOverlayPanelTap; the Clone Bay: js/clone.js) take their taps first.

// Convert a pointer event's clientX/clientY to canvas pixel coordinates.
// This accounts for any CSS scaling between the canvas's displayed size
// (e.g. 100vw×100vh) and its internal pixel resolution (window.innerWidth×innerHeight).
// Cache getBoundingClientRect — it forces a layout reflow and is called on every pointermove.
let _cachedRect = null;
window.addEventListener('resize', () => { _cachedRect = null; }, { passive: true });
if (window.visualViewport) window.visualViewport.addEventListener('resize', () => { _cachedRect = null; }, { passive: true });

function toCanvas(cx, cy) {
    if (!_cachedRect) _cachedRect = canvas.getBoundingClientRect();
    const r = _cachedRect;
    return [
        (cx - r.left) * canvas.width  / r.width,
        (cy - r.top)  * canvas.height / r.height
    ];
}


// The enemy under a screen point, if any. Shared by the tap handler and the
// long press so what you can shoot is exactly what you can target.
const PICK_RADIUS = 45;

// Where a unit is TAPPED. Most stand about 55px above their projected point,
// which is where a follower's body is drawn; a clone is a creature's body: low and long.
function followerPickPoint(f) {
    const px = (f.x - player.visualX - (f.y - player.visualY)) * TILE_W + canvas.width/2;
    const py = (f.x - player.visualX + (f.y - player.visualY)) * TILE_H + canvas.height/2 - facilityLiftRel(f.x, f.y);
    if (f.isClone) return { x: px, y: py - 22 };
    return { x: px, y: py - 55 };
}

// Each finder returns the CLOSEST match rather than the first one it walks
// past, so the two can be compared fairly — see handleLongHold.
function findEnemyAtScreen(ex, ey) {
    let best = null, bestD = PICK_RADIUS;
    for (const a of actors) {
        if (!(a instanceof Predator) || a.dead || a.team === "green" || a.isClone) continue;
        const apx = (a.x - player.visualX - (a.y - player.visualY)) * TILE_W + canvas.width/2;
        const apy = (a.x - player.visualX + (a.y - player.visualY)) * TILE_H + canvas.height/2 + TILE_H - facilityLiftRel(a.x, a.y);
        const d = Math.hypot(ex - apx, ey - (apy - 55));
        if (d < bestD) { bestD = d; best = a; }
    }
    return best;
}
function enemyPickDistance(ex, ey) {
    let bestD = Infinity;
    for (const a of actors) {
        if (!(a instanceof Predator) || a.dead || a.team === "green" || a.isClone) continue;
        const apx = (a.x - player.visualX - (a.y - player.visualY)) * TILE_W + canvas.width/2;
        const apy = (a.x - player.visualX + (a.y - player.visualY)) * TILE_H + canvas.height/2 + TILE_H - facilityLiftRel(a.x, a.y);
        const d = Math.hypot(ex - apx, ey - (apy - 55));
        if (d < bestD) bestD = d;
    }
    return bestD;
}

// The follower under a screen point. Same radius as the enemy test, so the two
// feel identical to aim.
// Your followers and your clones: a long press on either opens its ring.
function _pickableAllies() {
    const out = followers.slice();
    for (const a of actors) if (a && a.isClone && a.team === "green" && !a.dead) out.push(a);
    return out;
}
function findFollowerAtScreen(ex, ey) {
    let best = null, bestD = PICK_RADIUS;
    for (const f of _pickableAllies()) {
        if (!f || f.dead) continue;
        const p = followerPickPoint(f);
        const d = Math.hypot(ex - p.x, ey - p.y);
        if (d < bestD) { bestD = d; best = f; }
    }
    return best;
}
function followerPickDistance(ex, ey) {
    let bestD = Infinity;
    for (const f of _pickableAllies()) {
        if (!f || f.dead) continue;
        const p = followerPickPoint(f);
        const d = Math.hypot(ex - p.x, ey - p.y);
        if (d < bestD) bestD = d;
    }
    return bestD;
}

let playerShotsFired = 0;   // shots the player has fired (the tutorial's gun lesson counts them: js/tutorial.js)
function firePlayerShot(foe) {
    if (!foe || foe.dead) return false;
    if (typeof weaponMelee === "function" && weaponMelee() && typeof mutatorLash === "function") return mutatorLash(foe);   // a melee weapon in hand (the Mutator's lash): walk into reach, draw back, strike (js/mutator.js)
    if (typeof playerWeapon !== "undefined" && playerWeapon === "laser" && typeof fireLaserShot === "function") return fireLaserShot(foe);   // the laser rifle: fuel cells, a beam (js/weapons.js)
    if (playerAmmo <= 0) {
        floatingTexts.push({x:canvas.width/2, y:canvas.height/2-60,
            text:"OUT OF AMMO", color:"#ff5555", life:90, vy:-0.25, size:13});
        return false;
    }
    const elDef = ELEMENTS.find(e => e.id === player.selectedElement);
    spawnFollowerProjectile(
        { x: player.x, y: player.y, element: player.selectedElement },
        foe,
        elDef ? elDef.color : "#ffffff",
        typeof weaponDamage === "function" ? weaponDamage() : 10, 5,
        null
    );
    playerAmmo = Math.max(0, playerAmmo - 1); playerShotsFired++; player.gunShotAt = typeof frame !== "undefined" ? frame : 0;   // (the gunslinger's machine gun fires: js/playergear.js)
    player.attackCooldown = typeof weaponCooldown === "function" ? weaponCooldown() : 45;
    return true;
}

function setPlayerAttackMode(on, quiet) {
    playerAttackMode = !!on; if (!on && typeof gunStow === "function") gunStow();   // (putting the gun away ends the lock: js/gunfire.js)
    if (quiet) return;
    floatingTexts.push({x:canvas.width/2, y:canvas.height/2-80,
        text: playerAttackMode ? "ARMED — tap or hold on an enemy to fire" : "WEAPON STOWED",
        color: playerAttackMode ? "#ff8844" : "#889", life:110, vy:-0.25, size:13});
}

const handleInput=(ex,ey)=>{
    // Short tap near the Crystal → the battle tool (a phone's; it is always open on a tablet or desktop, js/mixtool.js)
    if (isTapNearCrystal(ex,ey)) { crystalMenuOpen=true; return; }

    // A tap on a class station (or its plate) uses it (js/stations.js).
    if (typeof facilityStationTap === "function" && facilityStationTap(ex, ey)) return;

    // ── PLAYER ATTACK ──
    // Only while armed. This used to fire on any tap that happened to land near
    // a predator, so brushing one while moving spent a shot at it.
    if (playerAttackMode && player.attackCooldown <= 0) {
        const foe = findEnemyAtScreen(ex, ey);
        if (foe) { firePlayerShot(foe); return; }
    }

    // Movement is never locked — there is no stun any more. A path through the facility's doors (js/facilityplay.js).
    const dx=ex-canvas.width/2, dy=ey+facilityPickLift(ex, ey)-canvas.height/2-TILE_H;
    const gx=Math.round((dy/TILE_H+dx/TILE_W)/2+player.visualX);
    const gy=Math.round((dy/TILE_H-dx/TILE_W)/2+player.visualY);
    if (typeof mutatorCancel === "function") mutatorCancel();   // (a walk order calls off the Mutator's lash: it would walk the player back to the creature)
    facilityWalkTo(gx, gy);
    player.selectedFollower=null;
};

function isTapNearCrystal(ex, ey) {
    const px = (crystal.x - player.visualX - (crystal.y - player.visualY)) * TILE_W + canvas.width/2;
    const py = (crystal.x - player.visualX + (crystal.y - player.visualY)) * TILE_H + canvas.height/2 + TILE_H;
    return Math.hypot(ex - px, ey - py) < 60;
}

// ── THE LONG-PRESS HINT ──────────────────────────────────
// The ring is where a follower's card and a creature's INFO are, and nothing on
// screen says so: until the ring has been opened once, ever, a tip floats up
// every RING_HINT_FRAMES.
const RING_HINT_FRAMES = 2400;   // 40 seconds
let _ringUsed = (function () { try { return localStorage.getItem("conduit_ring_used") === "1"; } catch (e) { return false; } })();
function noteRingUsed() {
    if (_ringUsed) return;
    _ringUsed = true;
    try { localStorage.setItem("conduit_ring_used", "1"); } catch (e) {}
}
function ringHintTick() {
    if (_ringUsed || frame <= 0 || frame % RING_HINT_FRAMES !== 0) return;
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 60,
        text: "TIP: PRESS AND HOLD A FOLLOWER OR A CREATURE FOR ITS CARD", color: "#0df", life: 220, vy: -0.05, size: 12 });
}

function handleLongHold(ex,ey) {
    commandMode=true; commandX=ex; commandY=ey;
    // KEEP THE RING ON SCREEN. A creature by an edge, or under the top HUD, had the ring's buttons off the screen. The ring is drawn
    // clear of the HUD and the edges; a drag is still measured from the press point, so releasing in place can never pick a button.
    const _R = typeof RADIAL_RADIUS === "number" ? RADIAL_RADIUS : 60, _M = typeof radialMargins === "function" ? radialMargins() : { x: _R + 40, top: _R + 40, bottom: _R + 40 };
    commandX = Math.max(_M.x, Math.min(canvas.width - _M.x, ex));
    commandY = Math.max(140 + _M.top, Math.min(canvas.height - _M.bottom, ey));
    commandShiftX = commandX - ex; commandShiftY = commandY - ey;
    noteRingUsed();
    const dx=ex-canvas.width/2, dy=ey+facilityPickLift(ex, ey)-canvas.height/2-TILE_H;
    const gx=Math.round((dy/TILE_H+dx/TILE_W)/2+player.visualX);
    const gy=Math.round((dy/TILE_H-dx/TILE_W)/2+player.visualY);
    const t=getTile(gx,gy);
    commandTarget=(t&&!t.type.includes("wall"))?t:null;
    // Whichever is CLOSER to the finger wins, rather than the enemy always
    // taking it: a creature pressed right up against a follower would otherwise
    // take every press meant for the follower.
    const _eD = enemyPickDistance(ex, ey);
    const _fD = followerPickDistance(ex, ey);
    // A FALLEN CLONE'S BODY (js/mutator.js), when it is nearer the finger than any unit: its own ring (SALVAGE DNA)
    const _bp = typeof cloneBodyAtScreen === "function" ? cloneBodyAtScreen(ex, ey) : null;
    commandBodyTarget = _bp && _bp.d < _eD && _bp.d < _fD ? _bp.body : null;
    if (commandBodyTarget) { commandFollowerTarget = null; commandEnemyTarget = null; }
    else if (_fD <= _eD) {
        commandFollowerTarget = findFollowerAtScreen(ex, ey);
        commandEnemyTarget    = null;
    } else {
        commandEnemyTarget    = findEnemyAtScreen(ex, ey);
        commandFollowerTarget = null;
    }
    dragDX=0; dragDY=0;
}

let _gunPressed = false;   // the press began on an enemy while armed: it is the gun's (js/gunfire.js)
let _cloneDrag = null;     // a press that began on the clone card strip: { x0, s0, moved } (it slides the strip; a drag never presses a card)
canvas.addEventListener('pointerdown', e=>{
    if (!gameState.running) return;
    e.preventDefault(); canvas.setPointerCapture(e.pointerId);
    isPressing=true; longHoldFired=false; touchMoved=false;
    [pressX,pressY]=toCanvas(e.clientX,e.clientY); pressStartTime=performance.now();

    // The clone card strip (js/clone.js): a press on it can become a slide.
    _cloneDrag = null;
    if (cloneMenuOpen && window._cloneTabBounds && window._cloneTabBounds.listW) {
        const cb = window._cloneTabBounds;
        if (pressX >= cb.listX && pressX <= cb.listX + cb.listW && pressY >= cb.listY && pressY <= cb.listY + cb.listH) { _cloneDrag = { x0: pressX, s0: _crystalScrollX, moved: false }; return; }
    }
    // Canvas overlay panels — absorb pointerdown so no game action triggers
    if (infoPanelOpen || settingsPanelOpen
        || (typeof classPickerOpen !== "undefined" && classPickerOpen) || (typeof invPanelOpen !== "undefined" && invPanelOpen) || (typeof armoryPanelOpen !== "undefined" && armoryPanelOpen)) return;

    // If the radial menu is waiting for a tap, preserve commandTarget from long-press
    if (commandPendingTap) return;

    // THE OBJECTIVE'S MAILBOX (js/tutorial.js), on a phone: a press on it (or on the plate it unfolds into) is its own: no ring, no move order, no long press
    _objPressed = false; if (typeof objectivePress === "function" && objectivePress(pressX, pressY)) { isPressing = false; return; }
    // TARGETING (js/targeting.js): a press on the round fire/info buttons, or on a creature that is not the locked one (it takes the lock): no ring, no move order
    _targetPressed = false; _tgBtnDown = null; if (typeof targetPress === "function" && targetPress(pressX, pressY)) return;
    // THE GUN (js/gunfire.js): armed, a press that lands on an enemy is a shot (and holding it keeps firing): no ring, no move order
    _gunPressed = false; if (typeof gunPress === "function" && gunPress(pressX, pressY)) { _gunPressed = true; return; }

    commandTarget=null;

    // The battle tool (js/mixtool.js) is open on a phone: a press on the world is not a game action (its release puts the tool away)
    if (crystalMenuOpen && !(typeof mixToolWide === "function" && mixToolWide())) return;

    const dx=pressX-canvas.width/2, dy=pressY+facilityPickLift(pressX, pressY)-canvas.height/2-TILE_H;
    const gx=Math.round((dy/TILE_H+dx/TILE_W)/2+player.visualX);
    const gy=Math.round((dy/TILE_H-dx/TILE_W)/2+player.visualY);
    const t=getTile(gx,gy);
    if (t&&!t.type.includes("wall")) commandTarget=t;
});

canvas.addEventListener('pointermove', e=>{
    if (!isPressing) return;
    [pointerX,pointerY]=toCanvas(e.clientX,e.clientY);
    if (_cloneDrag) { const dx = pointerX - _cloneDrag.x0; if (Math.abs(dx) > 8) _cloneDrag.moved = true; if (_cloneDrag.moved) _crystalScrollX = Math.max(0, _cloneDrag.s0 - dx); return; }

    // From the press point while the first hold is down; from the drawn ring
    // once it is open and being tapped.
    const _ox = commandPendingTap ? 0 : commandShiftX, _oy = commandPendingTap ? 0 : commandShiftY;
    dragDX=pointerX-(commandX-_ox); dragDY=pointerY-(commandY-_oy);
    if (_gunPressed && typeof gunMove === "function") { gunMove(pointerX, pointerY); return; }
    if (_targetPressed && typeof targetMove === "function") { targetMove(pointerX, pointerY); return; }
    if (Math.sqrt((pointerX-pressX)**2+(pointerY-pressY)**2)>22) touchMoved=true;
});

canvas.addEventListener('pointerup', e=>{
    if (_gunPressed) { _gunPressed = false; if (typeof gunRelease === "function") gunRelease(); isPressing = false; return; }   // the gun's press ends here (js/gunfire.js)
    if (_targetPressed) { _targetPressed = false; const [_tx, _ty] = toCanvas(e.clientX, e.clientY); if (typeof targetRelease === "function") targetRelease(_tx, _ty); isPressing = false; return; }   // the targeting's press ends here (js/targeting.js)
    if (_objPressed) { _objPressed = false; const [_ox, _oy] = toCanvas(e.clientX, e.clientY); if (typeof objectiveRelease === "function") objectiveRelease(_ox, _oy); isPressing = false; return; }   // the objective mailbox's press ends here (js/tutorial.js)
    if (!gameState.running) { isPressing=false; return; } // no canvas input on the game-over screen
    const [upX,upY]=toCanvas(e.clientX,e.clientY);
    // A slide on the clone card strip is not a tap on a card.
    if (_cloneDrag) { const moved = _cloneDrag.moved; _cloneDrag = null; if (moved) { isPressing = false; return; } }
    // The battle tool is open on a phone: a tap on the world puts it away (its own buttons are page elements and never reach here)
    if (crystalMenuOpen && !(typeof mixToolWide === "function" && mixToolWide())) {
        crystalMenuOpen=false;
        isPressing=false; return;
    }

    // The ammunition pill (js/targeting.js draws it): a tap while armed stows the weapon again
    if (!touchMoved && playerAttackMode && _ATKCHIP.w > 0
        && upX >= _ATKCHIP.x && upX <= _ATKCHIP.x + _ATKCHIP.w
        && upY >= _ATKCHIP.y && upY <= _ATKCHIP.y + _ATKCHIP.h) {
        if (typeof targetStand === "function") targetStand();   // (the gun stays put away while creatures are about: js/targeting.js)
        setPlayerAttackMode(false); isPressing=false; return;
    }

    // Blob button — tap opens clone menu (a phone only: the dock has it elsewhere)
    if (!touchMoved && !dockHasMenus()) {
        const b=_BLOB;
        if (b && Math.hypot(upX-b.x, upY-b.y)<b.r+8) {
            cloneMenuOpen=!cloneMenuOpen; crystalMenuOpen=false; isPressing=false; return;
        }
    }

    if (handleOverlayPanelTap(upX, upY)) { isPressing=false; return; }
    if (handleCloneMenuTap(upX, upY)) { isPressing=false; return; }
    // SETTINGS button tap (a phone only: js/settings.js drawSettingsButton)
    if (!touchMoved && !dockHasMenus() && Math.hypot(upX-_SETTINGSBTN.x, upY-_SETTINGSBTN.y) < _SETTINGSBTN.r+8) {
        settingsPanelOpen=!settingsPanelOpen; settingsResetConfirm=false; isPressing=false; return;
    }

    // ── ULTIMATE DOUBLE-TAP DETECTION ────────────────────
    // Not while the radial menu is up or waiting for its tap. This scan swallows any tap landing within 40px of a follower.
    if (!touchMoved && !commandMode && !commandPendingTap) {
        let _tappedFollower = null;
        for (const f of followers) {
            if (f.dead) continue;
            const _fpx = (f.x - player.visualX - (f.y - player.visualY)) * TILE_W + canvas.width/2;
            const _fpy = (f.x - player.visualX + (f.y - player.visualY)) * TILE_H + canvas.height/2;
            if (Math.hypot(upX - _fpx, upY - (_fpy - 55)) < 40) {
                _tappedFollower = f;
                break;
            }
        }
        if (_tappedFollower !== null) {
            const _now = performance.now();
            if (_tappedFollower === _ultimateLastTapActor && (_now - _ultimateLastTapTime) < 400) {
                // Double-tap confirmed — fire ultimate if charged
                // A bonded pair, both full and close: the DUO ultimate (js/bonds.js).
                if (typeof tryDuoUltimate === "function" && tryDuoUltimate(_tappedFollower)) { /* fired both */ }
                else if (typeof _tappedFollower.ultimateCharge === "number" && _tappedFollower.ultimateCharge >= 100) {
                    const _ult = FOLLOWER_ULTIMATES[_tappedFollower.element];
                    if (_ult) _ult.execute(_tappedFollower);
                }
                _ultimateLastTapActor = null;
                _ultimateLastTapTime  = 0;
            } else {
                // First tap — record it, do NOT move player
                _ultimateLastTapActor = _tappedFollower;
                _ultimateLastTapTime  = _now;
            }
            isPressing = false;
            return;
        }
    }
    // ── END ULTIMATE DOUBLE-TAP DETECTION ────────────────

    if (commandMode) {
        // If drag didn't hover a button, try treating release point as a tap on a button
        if (!selectedRadialAction) {
            const _rox = commandPendingTap ? 0 : commandShiftX, _roy = commandPendingTap ? 0 : commandShiftY;
            const relX = upX - (commandX - _rox), relY = upY - (commandY - _roy);
            const relDist = Math.hypot(relX, relY);
            const relAngle = Math.atan2(relY, relX);
            if (relDist > 18) {
                // A fallen clone's body (mirrors its branch in drawRadialMenu): UP is SALVAGE DNA, RIGHT is the body's second order (js/mutator.js mutatorBodyRing)
                if (commandBodyTarget) {
                    if (relAngle < -Math.PI/4 && relAngle > -3*Math.PI/4) selectedRadialAction = "salvage_body";
                    else if (relAngle > -Math.PI/4 && relAngle < Math.PI/4 && typeof mutatorBodyRing === "function" && mutatorBodyRing(commandBodyTarget).right) selectedRadialAction = mutatorBodyRing(commandBodyTarget).right.act;
                    commandPendingTap = false; executeCommand(); commandTarget = null; isPressing = false; return;
                }
                // Own follower ring (mirrors its branch in drawRadialMenu).
                if (commandFollowerTarget && !commandFollowerTarget.dead) {
                    const _f = commandFollowerTarget;
                    if (relAngle > -Math.PI/4 && relAngle < Math.PI/4) selectedRadialAction = "roster_card";
                    else if (Math.abs(relAngle) > Math.PI*3/4 && canRerollFollower(_f)) selectedRadialAction = "reroll_follower";
                    commandPendingTap = false;
                    executeCommand(); commandTarget=null;
                    isPressing=false;
                    return;
                }
                // The ground's ring (mirrors drawRadialMenu): POSITION below, INFO on the right; the top and the left draw nothing.
                if      (relAngle >  Math.PI/4 && relAngle <  3*Math.PI/4) selectedRadialAction = "position";
                else if (relAngle > -Math.PI/4 && relAngle <  Math.PI/4) selectedRadialAction = "info";
                else                   selectedRadialAction = null;
            } else if (longHoldFired && !commandPendingTap) {
                // User released right on the long-hold spot — menu just appeared.
                // Keep it open so they can tap a button next.
                commandPendingTap = true;
                isPressing = false;
                return;
            }
        }
        commandPendingTap = false;
        executeCommand(); commandTarget=null;
    }
    else if (!longHoldFired&&!touchMoved) handleInput(pressX,pressY);
    isPressing=false;
});

// The wheel slides the clone card strip sideways (a vertical roll too).
canvas.addEventListener('wheel', e => {
    if (!cloneMenuOpen || !window._cloneTabBounds || !window._cloneTabBounds.listW) return;
    e.preventDefault(); _crystalScrollX = Math.max(0, _crystalScrollX + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY));
}, { passive: false });
