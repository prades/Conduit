// ─────────────────────────────────────────────────────────
//  INPUT
// ─────────────────────────────────────────────────────────
const handleInput=(ex,ey)=>{
    const dx=ex-canvas.width/2, dy=ey-canvas.height/2;
    const gx=Math.round((dy/TILE_H+dx/TILE_W)/2+player.visualX);
    const gy=Math.round((dy/TILE_H-dx/TILE_W)/2+player.visualY);
    const t=getTile(gx,gy);

    if (t&&!t.type.includes('wall')) { player.targetX=gx; player.targetY=gy; }
    // Deselect follower when tapping empty ground
    player.selectedFollower=null;
};

function isTapNearCrystal(ex, ey) {
    const px = (crystal.x - player.visualX - (crystal.y - player.visualY)) * TILE_W + canvas.width/2;
    const py = (crystal.x - player.visualX + (crystal.y - player.visualY)) * TILE_H + canvas.height/2;
    return Math.hypot(ex - px, ey - py) < 60;
}

function handleLongHold(ex,ey) {
    // Long press near crystal — open clone menu
    if (isTapNearCrystal(ex, ey)) {
        // If crystal is under attack — open radial instead of clone menu
        const crystalUnderAttack = actors.some(a =>
            a instanceof Predator && !a.dead && a.team !== "green" &&
            (a.state === "attack" || a.state === "hunt") &&
            Math.hypot(a.x - crystal.x, a.y - crystal.y) < 3
        );
        if (!crystalUnderAttack) {
            cloneMenuOpen = true;
            return;
        }
        // Fall through to radial menu
    }
    commandMode=true; commandX=ex; commandY=ey;
    const dx=ex-canvas.width/2, dy=ey-canvas.height/2;
    const gx=Math.round((dy/TILE_H+dx/TILE_W)/2+player.visualX);
    const gy=Math.round((dy/TILE_H-dx/TILE_W)/2+player.visualY);
    const t=getTile(gx,gy);
    commandTarget=(t&&!t.type.includes("wall"))?t:null;
    dragDX=0; dragDY=0;
}

canvas.addEventListener('pointerdown', e=>{
    if (!gameState.running) return;
    e.preventDefault(); canvas.setPointerCapture(e.pointerId);
    gesturePoints=[]; isPressing=true; longHoldFired=false; touchMoved=false;
    pressX=e.clientX; pressY=e.clientY; pressStartTime=performance.now();
    commandTarget=null;
    const dx=pressX-canvas.width/2, dy=pressY-canvas.height/2;
    const gx=Math.round((dy/TILE_H+dx/TILE_W)/2+player.visualX);
    const gy=Math.round((dy/TILE_H-dx/TILE_W)/2+player.visualY);
    const t=getTile(gx,gy);
    if (t&&!t.type.includes("wall")) commandTarget=t;
});

canvas.addEventListener('pointermove', e=>{
    if (!isPressing) return;
    pointerX=e.clientX; pointerY=e.clientY;
    dragDX=pointerX-commandX; dragDY=pointerY-commandY;
    gesturePoints.push({x:pointerX,y:pointerY});
    if (Math.sqrt((pointerX-pressX)**2+(pointerY-pressY)**2)>12) touchMoved=true;
});

canvas.addEventListener('pointerup', e=>{
    if (handleCloneMenuTap(e.clientX, e.clientY)) { isPressing=false; return; }
    if (handleFollowerUIClick(e.clientX,e.clientY)) { isPressing=false; return; }
    if (detectCircleGesture()) { recallFollowers(); gesturePoints=[]; isPressing=false; commandMode=false; return; }
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
