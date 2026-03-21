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

const handleInput=(ex,ey)=>{
    // Pylon-select mode for nest connection
    if (nestConnectMode) {
        const _dx=ex-canvas.width/2, _dy=ey-canvas.height/2-TILE_H;
        const _gx=Math.round((_dy/TILE_H+_dx/TILE_W)/2+player.visualX);
        const _gy=Math.round((_dy/TILE_H-_dx/TILE_W)/2+player.visualY);
        let tapped=null;
        world.forEach(t=>{
            if(t.pillar&&!t.destroyed&&t.pillarTeam==="green"&&t.health>0
               &&(t.attackMode||t.waveMode)
               &&Math.hypot(t.x-_gx,t.y-_gy)<2.5) tapped=t;
        });
        if(tapped&&pendingConnectNest){
            tapped.nestConnection=pendingConnectNest;
            pendingConnectNest.connectedPylon=tapped;
            floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,
                text:"NEST LINKED — bonus charge active",color:"#ff4444",life:120,vy:-0.3});
        }
        nestConnectMode=false; pendingConnectNest=null;
        return;
    }
    // Short tap near crystal → open crystal panel
    if (isTapNearCrystal(ex,ey)) { crystalMenuOpen=true; return; }
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

function handleLongHold(ex,ey) {
    commandMode=true; commandX=ex; commandY=ey;
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
    // Check if any nest pod (live or broken) is near this tile (within 2.5 tiles)
    commandNestTarget=null;
    world.forEach(obj=>{
        if (obj.nest && Math.hypot(obj.x-gx,obj.y-gy)<4.0) {
            commandNestTarget=obj;
        }
    });
    dragDX=0; dragDY=0;
}

canvas.addEventListener('pointerdown', e=>{
    if (!gameState.running) return;
    e.preventDefault(); canvas.setPointerCapture(e.pointerId);
    gesturePoints=[]; isPressing=true; longHoldFired=false; touchMoved=false;
    [pressX,pressY]=toCanvas(e.clientX,e.clientY); pressStartTime=performance.now();

    // Canvas overlay panels — absorb pointerdown so no game action triggers
    if (elementPickerOpen || infoPanelOpen || campMenuOpen || trapPickerOpen) return;

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

    // Crystal panel slider drag
    if (crystalMenuOpen && _crystalSliderDrag) {
        handleCrystalPanelInput(pointerX, pointerY, true);
        touchMoved=true; return;
    }

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

    // Blob button — tap opens clone menu
    if (!touchMoved) {
        const b=_BLOB;
        if (b && Math.hypot(upX-b.x, upY-b.y)<b.r+8) {
            cloneMenuOpen=true; isPressing=false; return;
        }
    }

    if (handleOverlayPanelTap(upX, upY)) { isPressing=false; return; }
    if (handleCloneMenuTap(upX, upY)) { isPressing=false; return; }
    if (handleTrapPickerTap(upX, upY)) { isPressing=false; return; }
    if (handleCampMenuTap(upX, upY)) { isPressing=false; return; }
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

    // Home node tap — opens camp building menu
    if (!touchMoved) {
        const _hnx = (HOME_NODE_TILE.x - player.visualX - (HOME_NODE_TILE.y - player.visualY)) * TILE_W + canvas.width/2;
        const _hny = (HOME_NODE_TILE.x - player.visualX + (HOME_NODE_TILE.y - player.visualY)) * TILE_H + canvas.height/2 + TILE_H;
        if (Math.hypot(upX - _hnx, upY - (_hny - 40)) < 40) {
            campMenuOpen = true; isPressing = false; return;
        }
    }

    // ── ULTIMATE DOUBLE-TAP DETECTION ────────────────────
    if (!touchMoved) {
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
                const isLiveNest   = commandNestTarget && commandNestTarget.nestHealth > 0;
                const nestLinked   = commandNestTarget && commandNestTarget.connectedPylon && !commandNestTarget.connectedPylon.destroyed;
                const isBrokenNest = commandNestTarget && commandNestTarget.nestHealth <= 0 && !nestLinked;
                const _isPyCmd = commandTarget && commandTarget.pillar && !commandTarget.destroyed;
                const _isCapturableCmd = commandTarget && commandTarget.capturable && !commandTarget.captured;
                if      (relAngle < -Math.PI/4 && relAngle > -3*Math.PI/4 && (_isPyCmd || buildMode)) selectedRadialAction = "build_upgrade";
                else if (relAngle >  Math.PI/4 && relAngle <  3*Math.PI/4 && !buildMode && _isCapturableCmd) selectedRadialAction = "capture";
                else if (relAngle >  Math.PI/4 && relAngle <  3*Math.PI/4 && !buildMode) selectedRadialAction = "position";
                else if (relAngle > -Math.PI/4 && relAngle <  Math.PI/4 && buildMode && !_isPyCmd) selectedRadialAction = "place_trap";
                else if (relAngle > -Math.PI/4 && relAngle <  Math.PI/4 && !buildMode) selectedRadialAction = "info";
                else if (isLiveNest)   selectedRadialAction = "destroy_nest";
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
