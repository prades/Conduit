// ─────────────────────────────────────────────────────────
//  INPUT
// ─────────────────────────────────────────────────────────
const handleInput=(ex,ey)=>{
    // Short tap near crystal → open crystal panel
    if (isTapNearCrystal(ex,ey)) { crystalMenuOpen=true; return; }
    const dx=ex-canvas.width/2, dy=ey-canvas.height/2;
    const gx=Math.round((dy/TILE_H+dx/TILE_W)/2+player.visualX);
    const gy=Math.round((dy/TILE_H-dx/TILE_W)/2+player.visualY);
    const t=getTile(gx,gy);
    if (t&&!t.type.includes('wall')) { player.targetX=gx; player.targetY=gy; }
    player.selectedFollower=null;
};

function isTapNearCrystal(ex, ey) {
    const px = (crystal.x - player.visualX - (crystal.y - player.visualY)) * TILE_W + canvas.width/2;
    const py = (crystal.x - player.visualX + (crystal.y - player.visualY)) * TILE_H + canvas.height/2;
    return Math.hypot(ex - px, ey - py) < 60;
}

function handleLongHold(ex,ey) {
    commandMode=true; commandX=ex; commandY=ey;
    const dx=ex-canvas.width/2, dy=ey-canvas.height/2;
    const gx=Math.round((dy/TILE_H+dx/TILE_W)/2+player.visualX);
    const gy=Math.round((dy/TILE_H-dx/TILE_W)/2+player.visualY);
    const t=getTile(gx,gy);
    commandTarget=(t&&!t.type.includes("wall"))?t:null;
    // Check if a broken nest pod is near this tile (within 2 tiles)
    commandNestTarget=null;
    world.forEach(obj=>{
        if (obj.nest && obj.nestHealth<=0 && Math.hypot(obj.x-gx,obj.y-gy)<2.5) {
            commandNestTarget=obj;
        }
    });
    dragDX=0; dragDY=0;
}

canvas.addEventListener('pointerdown', e=>{
    if (!gameState.running) return;
    e.preventDefault(); canvas.setPointerCapture(e.pointerId);
    gesturePoints=[]; isPressing=true; longHoldFired=false; touchMoved=false;
    pressX=e.clientX; pressY=e.clientY; pressStartTime=performance.now();
    commandTarget=null;

    // Crystal panel — forward pointerdown (for slider drag init) and block game input
    if (crystalMenuOpen) { handleCrystalPanelInput(e.clientX, e.clientY, true); return; }
    // Crystal button tap — toggle panel
    if (Math.hypot(pressX-_CRYSBTN.x, pressY-_CRYSBTN.y) < _CRYSBTN.r+6) { return; }

    const dx=pressX-canvas.width/2, dy=pressY-canvas.height/2;
    const gx=Math.round((dy/TILE_H+dx/TILE_W)/2+player.visualX);
    const gy=Math.round((dy/TILE_H-dx/TILE_W)/2+player.visualY);
    const t=getTile(gx,gy);
    if (t&&!t.type.includes("wall")) commandTarget=t;
});

canvas.addEventListener('pointermove', e=>{
    if (!isPressing) return;
    pointerX=e.clientX; pointerY=e.clientY;

    // Crystal panel slider drag
    if (crystalMenuOpen && _crystalSliderDrag) {
        handleCrystalPanelInput(e.clientX, e.clientY, true);
        touchMoved=true; return;
    }

    dragDX=pointerX-commandX; dragDY=pointerY-commandY;
    gesturePoints.push({x:pointerX,y:pointerY});
    if (Math.sqrt((pointerX-pressX)**2+(pointerY-pressY)**2)>12) touchMoved=true;
});

canvas.addEventListener('pointerup', e=>{
    // Crystal button tap — toggle panel open/close
    if (!touchMoved && Math.hypot(e.clientX-_CRYSBTN.x, e.clientY-_CRYSBTN.y) < _CRYSBTN.r+8) {
        crystalMenuOpen=!crystalMenuOpen; isPressing=false; return;
    }
    // Crystal panel tap/release
    if (crystalMenuOpen) {
        handleCrystalPanelInput(e.clientX, e.clientY, false);
        isPressing=false; return;
    }

    // Blob button — tap opens clone menu
    if (!touchMoved) {
        const b=_BLOB;
        if (b && Math.hypot(e.clientX-b.x, e.clientY-b.y)<b.r+8) {
            cloneMenuOpen=true; isPressing=false; return;
        }
    }

    if (handleCloneMenuTap(e.clientX, e.clientY)) { isPressing=false; return; }
    if (handleFollowerUIClick(e.clientX, e.clientY)) { isPressing=false; return; }

    // ── ULTIMATE DOUBLE-TAP DETECTION ────────────────────
    if (!touchMoved) {
        let _tappedFollower = null;
        for (const f of followers) {
            if (f.dead) continue;
            const _fpx = (f.x - player.visualX - (f.y - player.visualY)) * TILE_W + canvas.width/2;
            const _fpy = (f.x - player.visualX + (f.y - player.visualY)) * TILE_H + canvas.height/2;
            if (Math.hypot(e.clientX - _fpx, e.clientY - (_fpy - 55)) < 40) {
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

    if (touchMoved && gesturePoints.length>=5) {
        // 1. Follower → enemy targeting line
        const ftoe=detectFollowerToEnemyGesture(pressX,pressY,e.clientX,e.clientY);
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

    if (commandMode) { executeCommand(); commandTarget=null; }
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
