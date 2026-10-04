// ─────────────────────────────────────────────────────────
//  INPUT
// ─────────────────────────────────────────────────────────

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

// A pylon the player is allowed to link a broken nest to — the same test the
// blinking LINK highlight uses, so what is tappable is exactly what is lit.
//
// A nest will only link to a GENERATOR. That is the generator's whole reason
// to exist on the nest side, and it stops the link being a free bonus on any
// lit pylon the player happened to already own.
function isNestLinkablePylon(t) {
    return !!(t && t.pillar && !t.destroyed && t.pillarTeam === "green"
              && t.health > 0 && (t.isGenerator || t.isConnector));
}

// Nearest eligible pylon to a tap. The old scan kept the LAST match in world
// order rather than the closest, so with two lit pylons in range the tap could
// land on the wrong one.
function pickNestLinkPylon(ex, ey) {
    const dx = ex - canvas.width/2, dy = ey - canvas.height/2 - TILE_H;
    const gx = (dy/TILE_H + dx/TILE_W) / 2 + player.visualX;
    const gy = (dy/TILE_H - dx/TILE_W) / 2 + player.visualY;
    let best = null, bestD = 2.5;
    for (const t of world) {
        if (!isNestLinkablePylon(t)) continue;
        const d = Math.hypot(t.x - gx, t.y - gy);
        if (d < bestD) { bestD = d; best = t; }
    }
    return best;
}

// While linking a nest, a tap means "pick that pylon" and nothing else. This
// runs ahead of the follower and gesture handling in pointerup, because those
// were swallowing the tap whenever a follower happened to stand within 40px of
// the pylon — the link then failed silently and the mode cancelled itself.
//
// Returns true when the tap has been consumed.
function handleNestConnectTap(ex, ey) {
    if (!nestConnectMode) return false;
    const tapped = pickNestLinkPylon(ex, ey);
    // Same reach the placement rule enforces, so anything you were allowed to
    // build can always take the link — and a generator across the map cannot.
    if (tapped && pendingConnectNest &&
        Math.hypot(tapped.x - pendingConnectNest.x, tapped.y - pendingConnectNest.y) > GENERATOR_NEST_RANGE) {
        floatingTexts.push({x:canvas.width/2, y:canvas.height/2-80,
            text:"THAT RELAY IS TOO FAR FROM THE NEST", color:"#f44", life:120, vy:-0.25});
        return true;
    }
    if (tapped && pendingConnectNest) {
        tapped.nestConnection = pendingConnectNest;
        pendingConnectNest.connectedPylon = tapped;
        const _home = typeof isHomePortal === "function" && isHomePortal(pendingConnectNest);
        floatingTexts.push({x:canvas.width/2, y:canvas.height/2-80,
            text: _home ? "HOME CONNECTED — feeding that generator"
                        : "ZONE CONTROLLED — bonus charge active",
            color: _home ? "#0f8" : NEST_COLOUR_CONTROLLED, life:120, vy:-0.3});
        nestConnectMode = false; pendingConnectNest = null; nestConnectMisses = 0;
        return true;
    }
    // A miss no longer cancels outright — that is what made a stray tap so
    // costly. Two misses in a row does, so the mode can never trap the player.
    nestConnectMisses++;
    if (nestConnectMisses >= 2) {
        nestConnectMode = false; pendingConnectNest = null; nestConnectMisses = 0;
        floatingTexts.push({x:canvas.width/2, y:canvas.height/2-80,
            text:"LINK CANCELLED", color:"#888", life:90, vy:-0.25});
    } else {
        floatingTexts.push({x:canvas.width/2, y:canvas.height/2-80,
            text:"TAP A GENERATOR OR CONNECTOR  (tap again to cancel)", color:"#00ffcc", life:110, vy:-0.25});
    }
    return true;
}

// The enemy under a screen point, if any. Shared by the tap handler and the
// long press so what you can shoot is exactly what you can target.
const PICK_RADIUS = 45;

// Where a unit is TAPPED. Most stand about 55px above their projected point,
// which is where a virus sprite's body is drawn.
//
// An ICE BLOCK does not: it is a cube sitting ON its tile, so its centre is a
// little above the tile's own centre and 68px BELOW where the old probe looked.
// Tapping a block therefore never selected it, and the only way to open its
// menu — and so to thaw it — was to tap the empty air above it.
function followerPickPoint(f) {
    const px = (f.x - player.visualX - (f.y - player.visualY)) * TILE_W + canvas.width/2;
    const py = (f.x - player.visualX + (f.y - player.visualY)) * TILE_H + canvas.height/2;
    if (f.iceBlock) {
        return { x: px, y: py + TILE_H - (TILE_H * ICE_BLOCK_H_MULT) / 2 };
    }
    return { x: px, y: py - 55 };
}

// A pylon is a TALL BODY, not a point. It stands on its tile centre and rises
// to about where its health bar is drawn — game.js puts that at base-75 — so
// anywhere on that column reads as "the pylon" to the player.
//
// A point-and-radius test is the wrong shape for it: the body is 75px tall and
// 60 wide, so a single centre point with a 45px radius misses the top of the
// pylon by a few pixels, which is exactly where a finger reaching past a
// follower lands.
const PYLON_BODY_RISE = 75;   // matches the health bar in game.js
const PYLON_BODY_DROP = 8;    // the base flares slightly below the tile centre
function pylonBodyBox(t) {
    const px = (t.x - player.visualX - (t.y - player.visualY)) * TILE_W + canvas.width/2;
    const py = (t.x - player.visualX + (t.y - player.visualY)) * TILE_H + canvas.height/2;
    const base = py + TILE_H;
    return { x: px, top: base - PYLON_BODY_RISE, bottom: base + PYLON_BODY_DROP, base };
}

// The pylon drawn under this point, or null.
//
// Build mode needs this because a pylon's body and a follower standing on it
// occupy the SAME screen space: the follower is picked 55px above its tile and
// the pylon rises 75px off that same tile. A press meant for the pylon landed
// squarely on the follower, and the ring came back offering TO WORK.
//
// Where two bodies overlap the FRONT one wins — the one whose base is lower on
// screen — because that is the one drawn on top and so the one being pointed at.
function findPylonAtScreen(ex, ey) {
    let best = null, bestBase = -Infinity;
    for (const t of world) {
        if (!t.pillar || t.destroyed || !(t.health > 0)) continue;
        const b = pylonBodyBox(t);
        if (Math.abs(ex - b.x) > TILE_W / 2) continue;
        if (ey < b.top || ey > b.bottom) continue;
        if (b.base > bestBase) { bestBase = b.base; best = t; }
    }
    return best;
}

// Each finder returns the CLOSEST match rather than the first one it walks
// past, so the two can be compared fairly — see handleLongHold.
function findEnemyAtScreen(ex, ey) {
    let best = null, bestD = PICK_RADIUS;
    for (const a of actors) {
        if (!(a instanceof Predator) || a.dead || a.team === "green" || a.isClone) continue;
        const apx = (a.x - player.visualX - (a.y - player.visualY)) * TILE_W + canvas.width/2;
        const apy = (a.x - player.visualX + (a.y - player.visualY)) * TILE_H + canvas.height/2 + TILE_H;
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
        const apy = (a.x - player.visualX + (a.y - player.visualY)) * TILE_H + canvas.height/2 + TILE_H;
        const d = Math.hypot(ex - apx, ey - (apy - 55));
        if (d < bestD) bestD = d;
    }
    return bestD;
}

// The follower under a screen point. Same radius as the enemy test, so the two
// feel identical to aim.
function findFollowerAtScreen(ex, ey) {
    let best = null, bestD = PICK_RADIUS;
    for (const f of followers) {
        if (!f || f.dead) continue;
        const p = followerPickPoint(f);
        const d = Math.hypot(ex - p.x, ey - p.y);
        if (d < bestD) { bestD = d; best = f; }
    }
    return best;
}
function followerPickDistance(ex, ey) {
    let bestD = Infinity;
    for (const f of followers) {
        if (!f || f.dead) continue;
        const p = followerPickPoint(f);
        const d = Math.hypot(ex - p.x, ey - p.y);
        if (d < bestD) bestD = d;
    }
    return bestD;
}

function firePlayerShot(foe) {
    if (!foe || foe.dead) return false;
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
        10, 5,
        null
    );
    playerAmmo = Math.max(0, playerAmmo - 1);
    saveAmmo();
    player.attackCooldown = 45;
    return true;
}

function setPlayerAttackMode(on) {
    playerAttackMode = !!on;
    if (on && typeof tutorialNoteArm === "function") tutorialNoteArm();
    floatingTexts.push({x:canvas.width/2, y:canvas.height/2-80,
        text: playerAttackMode ? "ARMED — tap enemies to fire" : "WEAPON STOWED",
        color: playerAttackMode ? "#ff8844" : "#889", life:110, vy:-0.25, size:13});
}

const handleInput=(ex,ey)=>{
    // Nest linking is handled earlier in pointerup; this is a backstop for any
    // other path that reaches handleInput while the mode is active.
    if (nestConnectMode) { handleNestConnectTap(ex, ey); return; }
    // Short tap near crystal → open crystal panel
    if (isTapNearCrystal(ex,ey)) { crystalMenuOpen=true; return; }
    // The HOME PORTAL is the other way in. Zone 0's nest spawns nothing and
    // raises no alarm, so it was an inert hive taking up the safest tile in
    // the game; it is the Crystal's doorway now.
    if (isTapNearHomePortal(ex,ey)) { crystalMenuOpen=true; return; }

    // ── PLAYER ATTACK ──
    // Only while armed. This used to fire on any tap that happened to land near
    // a predator, so brushing one while moving spent a shot at it.
    if (playerAttackMode && player.attackCooldown <= 0) {
        const foe = findEnemyAtScreen(ex, ey);
        if (foe) { firePlayerShot(foe); return; }
    }

    // Movement is never locked — there is no stun any more.
    const dx=ex-canvas.width/2, dy=ey-canvas.height/2-TILE_H;
    const gx=Math.round((dy/TILE_H+dx/TILE_W)/2+player.visualX);
    const gy=Math.round((dy/TILE_H-dx/TILE_W)/2+player.visualY);
    const t=getTile(gx,gy);
    if (t&&!t.type.includes('wall')) { player.targetX=gx; player.targetY=gy; }
    player.selectedFollower=null;
};

function isTapNearCrystal(ex, ey) {
    const px = (crystal.x - player.visualX - (crystal.y - player.visualY)) * TILE_W + canvas.width/2;
    const py = (crystal.x - player.visualX + (crystal.y - player.visualY)) * TILE_H + canvas.height/2 + TILE_H;
    return Math.hypot(ex - px, ey - py) < 60;
}

// The portal's screen position is the centre of its wall face, which is where
// drawHomePortal puts it — not the tile's own projected point. Kept next to
// isTapNearCrystal because the two answer the same question.
function homePortalScreenPos() {
    const t = world.find(isHomePortal);
    if (!t) return null;
    const px = (t.x - player.visualX - (t.y - player.visualY)) * TILE_W + canvas.width/2;
    const py = (t.x - player.visualX + (t.y - player.visualY)) * TILE_H + canvas.height/2;
    const sW1x = px, sW1y = py - 60, numT = 4;
    const blx = sW1x - TILE_W,              bly = sW1y + TILE_H;
    const brx = sW1x + (numT - 1) * TILE_W, bry = sW1y + (numT + 1) * TILE_H;
    return { x: (blx + brx) / 2, y: (bly + bry) / 2 - NEST_WALL_H * 0.5 };
}

function isTapNearHomePortal(ex, ey) {
    const p = homePortalScreenPos();
    if (!p) return false;
    return Math.hypot(ex - p.x, ey - p.y) < PORTAL_R + 18;
}

// ── THE LONG-PRESS HINT ──────────────────────────────────
// Every order in the game lives in a ring you open with a long press, and
// nothing on screen said so: someone who skipped the tutorial never found
// ATTACK, TO WORK, RE-ROLL or the circuit switch. Until the ring has been
// opened once, ever, a tip floats up every RING_HINT_FRAMES.
const RING_HINT_FRAMES = 2400;   // 40 seconds
let _ringUsed = (function () { try { return localStorage.getItem("conduit_ring_used") === "1"; } catch (e) { return false; } })();
function noteRingUsed() {
    if (_ringUsed) return;
    _ringUsed = true;
    try { localStorage.setItem("conduit_ring_used", "1"); } catch (e) {}
}
function ringHintTick() {
    if (_ringUsed || frame <= 0 || frame % RING_HINT_FRAMES !== 0) return;
    if (typeof tutorialMode !== "undefined" && tutorialMode) return;
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 60,
        text: "TIP: PRESS AND HOLD A UNIT, PYLON OR BUG FOR ORDERS", color: "#0df", life: 220, vy: -0.05, size: 12 });
}

function handleLongHold(ex,ey) {
    // Holding during a pending nest link would open the command menu over the
    // pylon the player is trying to pick.
    if (nestConnectMode) return;
    // The follower index takes its own long press: a row there is a GROUP, and
    // the duty switch belongs to it. Checked before anything else so the world
    // radial does not also open underneath the panel.
    if (typeof openFollowerDutyMenu === "function" && openFollowerDutyMenu(ex, ey)) return;
    commandMode=true; commandX=ex; commandY=ey;
    noteRingUsed();
    const dx=ex-canvas.width/2, dy=ey-canvas.height/2-TILE_H;
    const gx=Math.round((dy/TILE_H+dx/TILE_W)/2+player.visualX);
    const gy=Math.round((dy/TILE_H-dx/TILE_W)/2+player.visualY);
    const t=getTile(gx,gy);
    commandTarget=(t&&!t.type.includes("wall"))?t:null;
    // Snap to nearest pylon within 2 tiles — ensures pylons are reliably targeted
    // even when the press lands on an adjacent floor tile.
    // Skip snap in buildMode so the player can target empty tiles for new pylons.
    // Skip snap when target is already a capturable node so CAPTURE option appears.
    if (!commandTarget?.pillar && !commandTarget?.capturable && !buildMode) {
        const _snap=world.find(obj=>obj.pillar&&!obj.destroyed&&obj.health>0&&Math.hypot(obj.x-gx,obj.y-gy)<2.0);
        if (_snap) commandTarget=_snap;
    }
    // ── BUILD MODE: THE GROUND WINS ──────────────────────────────────────
    // With build mode on, the player has said what this press is about. A
    // pylon's body and a follower standing on it share the same screen space,
    // so the press that means UPGRADE landed on the follower instead and the
    // ring came back offering TO WORK. The same collision already had to be
    // worked around once, for nest linking — see handleNestConnectTap.
    //
    // A pylon actually UNDER the point wins, which is a tighter rule than the
    // two-tile snap above: that snap is skipped in build mode on purpose, so
    // the empty tile beside a pylon stays reachable for a new one.
    if (buildMode) {
        const _onPylon = findPylonAtScreen(ex, ey);
        if (_onPylon) commandTarget = _onPylon;
        // And no unit takes the press. Build mode's ring has no unit actions on
        // it — the follower and enemy branches of drawRadialMenu return before
        // BUILD/UPGRADE is ever drawn — so picking one here could only hide the
        // button the player opened the menu for. Turn build mode off to command
        // the squad, exactly as POSITION already requires.
        commandFollowerTarget = null;
        commandEnemyTarget    = null;
        commandNestTarget     = null;
        dragDX=0; dragDY=0;
        return;
    }
    // Whichever is CLOSER to the finger wins, rather than the enemy always
    // taking it. An enemy used to win outright, and a TOXIC repeller has
    // enemies pressed right up against it by definition — that is its whole
    // job — so the ring showed ATTACK at exactly the moment you wanted to call
    // the worker off. Measured: with a predator within 0.3 tiles the follower
    // could not be selected at all.
    const _eD = enemyPickDistance(ex, ey);
    const _fD = followerPickDistance(ex, ey);
    if (_fD <= _eD) {
        commandFollowerTarget = findFollowerAtScreen(ex, ey);
        commandEnemyTarget    = null;
    } else {
        commandEnemyTarget    = findEnemyAtScreen(ex, ey);
        commandFollowerTarget = null;
    }

    // Check if any nest pod (live or broken) is near this tile (within 2.5 tiles)
    commandNestTarget=null;
    world.forEach(obj=>{
        // Never the home portal: CONNECT on it is an order against
        // your own doorway.
        if (obj.nest && !isHomePortal(obj) && Math.hypot(obj.x-gx,obj.y-gy)<4.0) {
            commandNestTarget=obj;
        }
    });
    // THE HOME PORTAL, the nest labelled CRYSTAL. It is left out of the radius
    // scan above on purpose — a long press anywhere within four tiles of it
    // would turn every nearby press into a CONNECT, and a base is built right
    // there — so it is picked only when the press lands ON the portal itself.
    if (typeof isTapNearHomePortal === "function" && isTapNearHomePortal(ex, ey)) {
        const home = typeof homePortalTile === "function" ? homePortalTile() : null;
        if (home) {
            commandNestTarget = home;
            // And the portal's tile is the target, which stops the snap-to-nearest-
            // pylon step above from handing the press to a pylon standing beside
            // it. A base is built right there, and with a pylon within two tiles
            // the left button became that pylon's SWITCH and CONNECT never came up.
            commandTarget = home;
        }
    }
    dragDX=0; dragDY=0;
}

canvas.addEventListener('pointerdown', e=>{
    if (!gameState.running) return;
    e.preventDefault(); canvas.setPointerCapture(e.pointerId);
    gesturePoints=[]; isPressing=true; longHoldFired=false; touchMoved=false;
    [pressX,pressY]=toCanvas(e.clientX,e.clientY); pressStartTime=performance.now();

    // Canvas overlay panels — absorb pointerdown so no game action triggers
    if (elementPickerOpen || infoPanelOpen || campMenuOpen || settingsPanelOpen
        || followerDutyMenu) return;

    // If the radial menu is waiting for a tap, preserve commandTarget from long-press
    if (commandPendingTap) return;

    commandTarget=null;

    // Crystal panel — forward pointerdown (for slider drag init) and block game input
    if (crystalMenuOpen) { handleCrystalPanelInput(pressX, pressY, true); return; }
    // Crystal button tap — toggle panel
    if (Math.hypot(pressX-_CRYSBTN.x, pressY-_CRYSBTN.y) < _CRYSBTN.r+6) { return; }

    const dx=pressX-canvas.width/2, dy=pressY-canvas.height/2-TILE_H;
    const gx=Math.round((dy/TILE_H+dx/TILE_W)/2+player.visualX);
    const gy=Math.round((dy/TILE_H-dx/TILE_W)/2+player.visualY);
    const t=getTile(gx,gy);
    if (t&&!t.type.includes("wall")) commandTarget=t;
    // Snap to nearby pylon on initial press too.
    // Skip snap in buildMode so the player can target empty tiles for new pylons.
    // Skip snap when target is already a capturable node so CAPTURE option appears.
    if (!commandTarget?.pillar && !commandTarget?.capturable && !buildMode) {
        const _snap=world.find(obj=>obj.pillar&&!obj.destroyed&&obj.health>0&&Math.hypot(obj.x-gx,obj.y-gy)<2.0);
        if (_snap) commandTarget=_snap;
    }
});

canvas.addEventListener('pointermove', e=>{
    if (!isPressing) return;
    [pointerX,pointerY]=toCanvas(e.clientX,e.clientY);

    dragDX=pointerX-commandX; dragDY=pointerY-commandY;
    gesturePoints.push({x:pointerX,y:pointerY});
    if (Math.sqrt((pointerX-pressX)**2+(pointerY-pressY)**2)>22) touchMoved=true;
});

canvas.addEventListener('pointerup', e=>{
    if (!gameState.running) { isPressing=false; return; } // block canvas input during buy screen
    const [upX,upY]=toCanvas(e.clientX,e.clientY);
    // Crystal button tap — toggle panel open/close
    if (!touchMoved && Math.hypot(upX-_CRYSBTN.x, upY-_CRYSBTN.y) < _CRYSBTN.r+8) {
        crystalMenuOpen=!crystalMenuOpen; isPressing=false; return;
    }
    // Crystal panel tap/release
    if (crystalMenuOpen) {
        handleCrystalPanelInput(upX, upY, false);
        isPressing=false; return;
    }

    // Ammo chip — tap while armed to stow the weapon again
    if (!touchMoved && playerAttackMode && _ATKCHIP.w > 0
        && upX >= _ATKCHIP.x && upX <= _ATKCHIP.x + _ATKCHIP.w
        && upY >= _ATKCHIP.y && upY <= _ATKCHIP.y + _ATKCHIP.h) {
        setPlayerAttackMode(false); isPressing=false; return;
    }

    // Blob button — tap opens clone menu
    if (!touchMoved) {
        const b=_BLOB;
        if (b && Math.hypot(upX-b.x, upY-b.y)<b.r+8) {
            cloneMenuOpen=true; isPressing=false; return;
        }
    }

    if (handleOverlayPanelTap(upX, upY)) { isPressing=false; return; }
    if (handleCloneMenuTap(upX, upY)) { isPressing=false; return; }
    if (handleCampMenuTap(upX, upY)) { isPressing=false; return; }
    // Pylons win over everything below while a nest link is pending: the
    // follower panel, the ultimate double-tap scan and the gesture handlers all
    // used to get first refusal and steal the tap.
    if (!touchMoved && handleNestConnectTap(upX, upY)) { isPressing=false; return; }
    // The group duty menu first: it sits beside the index, and the index's own
    // tap handler would otherwise take a press aimed at the menu.
    if (typeof handleFollowerDutyMenuTap === "function"
        && handleFollowerDutyMenuTap(upX, upY)) { isPressing=false; return; }
    if (handleFollowerUIClick(upX, upY)) { isPressing=false; return; }
    // SHOP button tap
    if (!touchMoved && !alertActive && gameState.phase !== "night" && gameState.phase !== "waveComplete" && gameState.phase !== "gameOver"
        && Math.hypot(upX-_SHOPBTN.x, upY-_SHOPBTN.y) < _SHOPBTN.r+8) {
        openMidGameShop(); isPressing=false; return;
    }
    // CAMP button tap
    if (!touchMoved && Math.hypot(upX-_CAMPBTN.x, upY-_CAMPBTN.y) < _CAMPBTN.r+8) {
        campMenuOpen=!campMenuOpen; isPressing=false; return;
    }
    // SETTINGS button tap
    if (!touchMoved && Math.hypot(upX-_SETTINGSBTN.x, upY-_SETTINGSBTN.y) < _SETTINGSBTN.r+8) {
        settingsPanelOpen=!settingsPanelOpen; settingsResetConfirm=false; isPressing=false; return;
    }

    // Home node tap — opens camp building menu
    if (!touchMoved) {
        const _hnx = (HOME_NODE_TILE.x - player.visualX - (HOME_NODE_TILE.y - player.visualY)) * TILE_W + canvas.width/2;
        const _hny = (HOME_NODE_TILE.x - player.visualX + (HOME_NODE_TILE.y - player.visualY)) * TILE_H + canvas.height/2 + TILE_H;
        if (Math.hypot(upX - _hnx, upY - (_hny - 40)) < 40) {
            campMenuOpen = true; isPressing = false; return;
        }
    }

    // ── ULTIMATE DOUBLE-TAP DETECTION ────────────────────
    // Not while the radial menu is up or waiting for its tap, and not in build
    // mode. This scan swallows any tap landing within 40px of a follower, and
    // it runs AHEAD of the radial menu's own handling — so the tap confirming
    // BUILD or UPGRADE was eaten whenever a follower happened to be standing
    // near the button, and the order silently did nothing. The nest link hit
    // exactly this and had to be moved above the scan to get out of its way;
    // this is the same fix stated as a condition instead.
    if (!touchMoved && !commandMode && !commandPendingTap && !buildMode) {
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
                if (typeof _tappedFollower.ultimateCharge === "number" && _tappedFollower.ultimateCharge >= 100) {
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

    if (touchMoved && gesturePoints.length>=5 && !commandMode) {
        // 1. Follower → enemy targeting line
        const ftoe=detectFollowerToEnemyGesture(pressX,pressY,upX,upY);
        if (ftoe) {
            ftoe.follower.job={type:"attack",target:ftoe.enemy};
            gesturePoints=[]; isPressing=false; commandMode=false; return;
        }
        // 2. Vertical hold line
        if (detectVerticalLineGesture()) {
            applyHoldLine();
            gesturePoints=[]; isPressing=false; commandMode=false; return;
        }
        // 3. Circle gesture — attack enclosed enemies OR recall / clear hold line
        if (detectCircleGesture()) {
            const enclosed=detectEnemiesInCircle();
            if (enclosed.length>0) {
                issueAttackOnEnemies(enclosed);
            } else if (holdLineX!==null) {
                holdLineX=null;
            } else {
                recallFollowers();
            }
            gesturePoints=[]; isPressing=false; commandMode=false; return;
        }
    }

    if (commandMode) {
        // If drag didn't hover a button, try treating release point as a tap on a button
        if (!selectedRadialAction) {
            const relX = upX - commandX, relY = upY - commandY;
            const relDist = Math.hypot(relX, relY);
            const relAngle = Math.atan2(relY, relX);
            if (relDist > 18) {
                // Mirrors drawRadialMenu: one test for "can this nest be connected".
                const isBrokenNest = nestCanConnect(commandNestTarget);
                const _isPyCmd = commandTarget && commandTarget.pillar && !commandTarget.destroyed;
                const _isCapturableCmd = commandTarget && commandTarget.capturable && !commandTarget.captured;
                // The top button is drawn whenever build mode is on — UPGRADE on a
                // pylon, BUILD on an empty tile (see showTopBtn in drawRadialMenu).
                // This used to read `buildMode ? !_isPyCmd : _isPyCmd`, which
                // excluded exactly the UPGRADE case: tapping the UPGRADE button on
                // a pylon fell through to switch_context and toggled the pylon's
                // mode instead. It also fired build_upgrade with build mode OFF,
                // where no top button is drawn at all.
                // Own follower ring (mirrors its branch in drawRadialMenu).
                if (commandFollowerTarget && !commandFollowerTarget.dead) {
                    const _f = commandFollowerTarget;
                    if (relAngle < -Math.PI/4 && relAngle > -3*Math.PI/4) {
                        if (canWorkMass(_f)) selectedRadialAction = "toggle_duty";
                    } else if (relAngle > -Math.PI/4 && relAngle < Math.PI/4) selectedRadialAction = "info";
                    else if (Math.abs(relAngle) > Math.PI*3/4 && canRerollFollower(_f)) selectedRadialAction = "reroll_follower";
                    commandPendingTap = false;
                    executeCommand(); commandTarget=null;
                    isPressing=false;
                    return;
                }
                if      (relAngle < -Math.PI/4 && relAngle > -3*Math.PI/4 && buildMode) selectedRadialAction = "build_upgrade";
                else if (relAngle >  Math.PI/4 && relAngle <  3*Math.PI/4 && !buildMode && _isCapturableCmd) selectedRadialAction = "capture";
                else if (relAngle >  Math.PI/4 && relAngle <  3*Math.PI/4 && !buildMode) selectedRadialAction = "position";
                // RIGHT is INFO whether build mode is on or off. It used to be
                // TRAP in build mode on an empty tile; placeable traps are gone,
                // and leaving the side dead would have made a quarter of the
                // menu do nothing.
                else if (relAngle > -Math.PI/4 && relAngle <  Math.PI/4) selectedRadialAction = "info";
                // Left side. Mirrors drawRadialMenu's leftAction, enemy pylon first.
                else if (_isPyCmd && commandTarget.pillarTeam === "red" && commandTarget.health > 0)
                                       selectedRadialAction = "reconstruct";
                else if (_isPyCmd && isConnectorPylon(commandTarget) && commandTarget.pillarTeam === "green")
                                       selectedRadialAction = "toggle_circuit";
                else if (isBrokenNest) selectedRadialAction = "connect_nest";
                else                   selectedRadialAction = "switch_context";
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

// ─────────────────────────────────────────────────────────
//  SHARD UPDATE
// ─────────────────────────────────────────────────────────
function updateShards() {
    shards.forEach(s=>{ s.z+=s.vz; s.vz-=0.01; if(s.z<0){s.z=0;s.vz=0;} });
    shards=shards.filter(s=>{
        const dx=s.x-player.x, dy=s.y-player.y, dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<1.0&&s.z===0) { shardCount++; saveShards(); return false; }
        return true;
    });
}

// ─────────────────────────────────────────────────────────
//  SAVE ON LEAVING
// ─────────────────────────────────────────────────────────
// The autosave tick runs every 5 seconds, so without this a refresh could still
// drop the last few seconds. pagehide is the reliable one on iOS — beforeunload
// does not fire there when a tab is swiped away or backgrounded out of memory.
function saveOnLeave() {
    if (typeof saveSession !== "function") return;
    try { saveSession(); savePylons(); saveNests(); saveGameState(); } catch (e) {}
}
window.addEventListener("pagehide", saveOnLeave);
window.addEventListener("beforeunload", saveOnLeave);
document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") saveOnLeave();
});
