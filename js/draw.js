// ─────────────────────────────────────────────────────────
//  DRAWING HELPERS
// ─────────────────────────────────────────────────────────
function drawHealthBar(x, y, width, height, health, maxHealth, drawCtx=ctx) {
    if (typeof health!=="number"||typeof maxHealth!=="number"||maxHealth<=0) return;
    const pct=Math.max(0,Math.min(1,health/maxHealth));
    const col = pct>0.6?"#0f8":pct>0.3?"#ff0":"#f22";
    drawCtx.fillStyle="#000"; drawCtx.fillRect(x,y,width,height);
    drawCtx.fillStyle=col;    drawCtx.fillRect(x+1,y+1,(width-2)*pct,height-2);
}

function drawRadialButton(x, y, label, active) {
    ctx.fillStyle=active?"#0f8":"#055";
    ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=active?"#000":"#0f8";
    ctx.font="12px monospace"; ctx.textAlign="center";
    ctx.fillText(label,x,y-14);
}

function drawRadialMenu() {
    if (!commandMode) return;
    selectedRadialAction=null;
    const dist=Math.hypot(dragDX,dragDY), angle=Math.atan2(dragDY,dragDX);
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    ctx.strokeStyle="#0f8"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(commandX,commandY,RADIAL_RADIUS,0,Math.PI*2); ctx.stroke();

    const isPylonTarget   = commandTarget&&commandTarget.pillar&&!commandTarget.destroyed&&commandTarget.health>0;
    const isLiveNest      = commandNestTarget&&commandNestTarget.nestHealth>0;
    const nestAlreadyLinked = commandNestTarget&&commandNestTarget.connectedPylon&&!commandNestTarget.connectedPylon.destroyed;
    const isBrokenNest    = commandNestTarget&&commandNestTarget.nestHealth<=0&&!nestAlreadyLinked;

    // ── TOP = UPGRADE (pylon) / BUILD (only when buildMode ON, not on pylon tile) ──
    const showTopBtn = buildMode ? !isPylonTarget : isPylonTarget;
    const tHov = showTopBtn && dist>RADIAL_RADIUS*0.25&&angle<-Math.PI/4&&angle>-3*Math.PI/4;
    if (showTopBtn) {
        drawRadialButton(commandX, commandY-RADIAL_RADIUS, isPylonTarget?"UPGRADE":"BUILD", tHov);
        if (tHov) selectedRadialAction="build_upgrade";
    }

    // ── DOWN = POSITION (or CAPTURE on capturable tiles) — hidden in build mode ──
    if (!buildMode) {
        const dHov=dist>RADIAL_RADIUS*0.25&&angle>Math.PI/4&&angle<3*Math.PI/4;
        const isCapturableTarget = commandTarget && commandTarget.capturable && !commandTarget.captured;
        if (isCapturableTarget) {
            drawRadialButton(commandX, commandY+RADIAL_RADIUS, "CAPTURE", dHov);
            if (dHov) selectedRadialAction="capture";
        } else {
            drawRadialButton(commandX, commandY+RADIAL_RADIUS, "POSITION", dHov);
            if (dHov) selectedRadialAction="position";
        }
    }

    // ── RIGHT = INFO (normal) / TRAP (build mode on empty tile) ──
    if (!buildMode) {
        const rHov=dist>RADIAL_RADIUS*0.25&&angle>-Math.PI/4&&angle<Math.PI/4;
        drawRadialButton(commandX+RADIAL_RADIUS, commandY, "INFO", rHov);
        if (rHov) selectedRadialAction="info";
    } else if (buildMode && !isPylonTarget) {
        const rHov=dist>RADIAL_RADIUS*0.25&&angle>-Math.PI/4&&angle<Math.PI/4;
        drawRadialButton(commandX+RADIAL_RADIUS, commandY, "TRAP", rHov);
        if (rHov) selectedRadialAction="place_trap";
    }

    // ── LEFT = SWITCH / DESTROY / CONNECT (context) ───────
    const lHov=dist>RADIAL_RADIUS*0.25&&Math.abs(angle)>Math.PI*3/4;
    let leftLabel="SWITCH", leftAction="switch_context";
    const isPylonSwitchable = isPylonTarget && (commandTarget.attackMode || commandTarget.waveMode);
    if (!isPylonSwitchable) {
        if (isLiveNest && !buildMode) { leftLabel="DESTROY"; leftAction="destroy_nest"; }
        else if (isBrokenNest)        { leftLabel="CONNECT"; leftAction="connect_nest"; }
    }
    drawRadialButton(commandX-RADIAL_RADIUS, commandY, leftLabel, lHov);
    if (lHov) selectedRadialAction=leftAction;

    ctx.restore();
}

function drawPredatorDebug(actor, px, py) {
    if (!DEBUG_PREDATOR) return;
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    const bx=px-60, by=py-140, bw=120, bh=70;
    ctx.fillStyle="rgba(0,0,0,0.6)"; ctx.fillRect(bx,by,bw,bh);
    ctx.strokeStyle="rgba(0,255,136,0.6)"; ctx.strokeRect(bx,by,bw,bh);
    ctx.fillStyle="#0f8"; ctx.font="11px monospace"; ctx.textAlign="left";
    const snap=Math.round(Math.atan2(actor.dirY,actor.dirX)/(Math.PI/4))*(Math.PI/4);
    ["STATE:"+actor.state,"X:"+actor.x.toFixed(2),"Y:"+actor.y.toFixed(2),
     "dX:"+actor.dirX.toFixed(2),"dY:"+actor.dirY.toFixed(2),
     "snap°:"+(snap*180/Math.PI).toFixed(0)
    ].forEach((l,i)=>ctx.fillText(l,bx+6,by+14+i*11));
    ctx.restore();
}

// ─────────────────────────────────────────────────────────
//  DRAW NPC  (FIX: one drawLeg per scope, no duplicate)
// ─────────────────────────────────────────────────────────
function drawNPC(actor, px, py, drawCtx=ctx) {
    if (actor instanceof Predator) {
        _drawPredator(actor, px, py, drawCtx);
    } else {
        _drawVirus(actor, px, py, drawCtx);
    }
}

function _drawPredator(actor, px, py, drawCtx) {
    const dim=actor.dimensions;
    let bodyBaseY=py-(dim.height*2) - (actor.heightBoost ? dim.height*(actor.heightBoost-1) : 0);
    let rearOffset=0;
    if (actor.state==="attack" && !actor.isMantis) { const t=actor.attackAnim/Math.PI; rearOffset=Math.sin(t*Math.PI)*4; }
    bodyBaseY-=rearOffset;

    const angle=Math.atan2(actor.dirY,actor.dirX);
    const dirX=Math.cos(angle), dirY=Math.sin(angle);

    // Build segments
    const segments=[];
    const baseLength=dim.height*0.9;
    // Thorax — optional yOffset lifts/lowers it relative to body centre (mantis raised prothorax)
    segments.push({ length:baseLength*actor.body.thorax.size, width:dim.width*actor.body.thorax.size, rotation:angle, yOffset:actor.body.thorax.yOffset||0 });
    segments.push({ length:baseLength*actor.body.head.size,   width:dim.width*actor.body.head.size,   rotation:actor.headAngle||angle });
    // Abdomen — absoluteAngle fixes it to a screen-space direction (e.g. mantis always-up);
    // angleOffset rotates it relative to the facing direction.
    // abdWalkSway adds a gentle side-to-side tilt driven by the walk cycle.
    const abdWalkSway = Math.sin((actor.walkCycle || 0) * 0.015) * 0.13;
    let abdAngle;
    if (actor.isMantis) {
        abdAngle = actor.body.abdomen.absoluteAngle !== undefined ? actor.body.abdomen.absoluteAngle : Math.PI * 0.38;
    } else {
        abdAngle = actor.body.abdomen.absoluteAngle !== undefined
            ? actor.body.abdomen.absoluteAngle
            : angle + (actor.body.abdomen.angleOffset || 0) + abdWalkSway;
    }
    const abdDirX  = Math.cos(abdAngle), abdDirY = Math.sin(abdAngle);
    // Compress abdomen width based on depth: how much the abdomen points into/out of screen.
    // Camera depth axis is roughly SE (π*0.25). When abdomen aligns with it, foreshorten.
    const _abdDepth = Math.abs(Math.cos(abdAngle - Math.PI * 0.25));
    const abdCompress = 1.0 - _abdDepth * 0.55;
    let abdLen=baseLength*actor.body.abdomen.size;
    for (let i=0;i<actor.body.abdomen.segments;i++) {
        segments.push({ length:abdLen, width:dim.width*actor.body.abdomen.size*abdCompress, rotation:abdAngle });
        abdLen*=actor.body.abdomen.taper;
    }

    // Position segments
    segments[0].cx=px; segments[0].cy=bodyBaseY+(segments[0].yOffset||0);
    segments[1].cx=segments[0].cx+dirX*(segments[0].length*0.5+segments[1].length*0.5);
    segments[1].cy=segments[0].cy+Math.max(0,dirY)*(segments[0].length*0.5+segments[1].length*0.5);
    // Abdomen anchor at thorax rear for all creatures.
    let anchorX = segments[0].cx - dirX * segments[0].length * 0.5;
    let anchorY = segments[0].cy - Math.max(0,dirY) * segments[0].length * 0.5 + (actor.body.abdomen.yOffset || 0);
    for (let i=2;i<segments.length;i++) {
        segments[i].cx = anchorX - abdDirX * segments[i].length * 0.5;
        segments[i].cy = anchorY - abdDirY * segments[i].length * 0.5;
        anchorX -= abdDirX * segments[i].length;
        anchorY -= abdDirY * segments[i].length;
    }

    // ── Legs split by isometric depth: far side behind body, near side in front ──
    // In iso projection depth = world(x+y). Legs at side s have depth offset s*(perpX+perpY).
    // perpX+perpY = dirX-dirY: positive → side+1 is far; negative → side-1 is far.
    const perpX=-dirY, perpY=dirX;
    const _legDepth = perpX + perpY; // dirX - dirY
    const thoraxCX=segments[0].cx+dirX*actor.joints.legRoot.forward;
    const thoraxCY=segments[0].cy+actor.joints.legRoot.vertical;
    const legData=actor.appendages.legs;
    function _drawLegsPass(farOnly) {
        // _legDepth = perpX+perpY. In iso (depth = x+y), larger depth = closer to viewer.
        // side+1 legs are offset by +perp, so their depth delta = _legDepth.
        // side+1 is FAR (behind body) when _legDepth <= 0; NEAR (in front) when _legDepth > 0.
        // side-1 is FAR when _legDepth >= 0; NEAR when _legDepth < 0.
        if (legData && legData.count===6) {
            drawCtx.strokeStyle="#111"; drawCtx.lineWidth=2;
            const positions=[-1,0,1];
            positions.forEach((pos,index)=>{
                if (actor.isMantis && pos===-1) return; // front pair replaced by raptorial praying arms
                const long=-pos*(dim.width*0.35);
                const hx=thoraxCX+dirX*long, hy=thoraxCY+dirY*long;
                if (farOnly ? _legDepth <= 0 : _legDepth > 0)
                    _drawInsectLeg(drawCtx,hx,hy, 1,(index+1)%2===0?0:Math.PI,pos,actor,legData,dirX,dirY,perpX,perpY);
                if (farOnly ? _legDepth >= 0 : _legDepth < 0)
                    _drawInsectLeg(drawCtx,hx,hy,-1,(index)%2===0?0:Math.PI,pos,actor,legData,dirX,dirY,perpX,perpY);
            });
        } else if (legData && legData.count===8) {
            drawCtx.strokeStyle="#111"; drawCtx.lineWidth=1.2;
            const positions=[-1.2,-0.4,0.4,1.2];
            positions.forEach((pos,index)=>{
                const long=-pos*(dim.width*0.22);
                const hx=thoraxCX+dirX*long, hy=thoraxCY+dirY*long;
                if (farOnly ? _legDepth <= 0 : _legDepth > 0)
                    _drawInsectLeg(drawCtx,hx,hy, 1,(index+1)%2===0?0:Math.PI,pos,actor,legData,dirX,dirY,perpX,perpY);
                if (farOnly ? _legDepth >= 0 : _legDepth < 0)
                    _drawInsectLeg(drawCtx,hx,hy,-1,(index)%2===0?0:Math.PI,pos,actor,legData,dirX,dirY,perpX,perpY);
            });
        }
        // ── Mantis raptorial praying forelegs — split by depth same as regular legs ──
        if (actor.isMantis && legData) {
            const frontAttachX = thoraxCX + dirX*(dim.width*0.35);
            const frontAttachY = thoraxCY + dirY*(dim.width*0.35);
            const armCol = "#111";
            const femurLen = legData.femur * 0.7;
            const tibiaLen = legData.tibia * 0.9;
            const strike = (actor.state === "attack") ? Math.sin(actor.attackAnim) : 0;
            drawCtx.save();
            drawCtx.strokeStyle = armCol; drawCtx.lineWidth = 2.5; drawCtx.lineCap = "round";
            [-1, 1].forEach(side => {
                // side s is FAR when s * _legDepth >= 0 (opposite sign convention to regular legs
                // because the foreleg shoulder is at +perp*side, so depth delta = side*_legDepth;
                // FAR = smaller depth = side*_legDepth <= 0).
                const isFar = side * _legDepth <= 0;
                if (farOnly !== isFar) return;
                const sx = frontAttachX + perpX*side*legData.coxa*0.45;
                const sy = frontAttachY + perpY*side*legData.coxa*0.45;
                const prayElbX = sx + perpX*side*femurLen*0.5;
                const prayElbY = sy + perpY*side*femurLen*0.5 + femurLen*0.75;
                const prayTipX = prayElbX - perpX*side*tibiaLen*0.28 + dirX*tibiaLen*0.15;
                const prayTipY = prayElbY - tibiaLen                  + dirY*tibiaLen*0.15;
                const strikeElbX = sx + dirX*femurLen*0.55 + perpX*side*femurLen*0.30;
                const strikeElbY = sy + dirY*femurLen*0.55 + perpY*side*femurLen*0.30;
                const strikeTipX = strikeElbX + dirX*tibiaLen*0.75 - perpX*side*tibiaLen*0.18;
                const strikeTipY = strikeElbY + dirY*tibiaLen*0.75 - perpY*side*tibiaLen*0.18;
                const ex = prayElbX + (strikeElbX - prayElbX)*strike;
                const ey = prayElbY + (strikeElbY - prayElbY)*strike;
                const tx = prayTipX + (strikeTipX - prayTipX)*strike;
                const ty = prayTipY + (strikeTipY - prayTipY)*strike;
                drawCtx.beginPath();
                drawCtx.moveTo(sx, sy);
                drawCtx.lineTo(ex, ey);
                drawCtx.lineTo(tx, ty);
                drawCtx.stroke();
                drawCtx.fillStyle = armCol;
                drawCtx.beginPath(); drawCtx.arc(tx, ty, 2.5, 0, Math.PI*2); drawCtx.fill();
            });
            drawCtx.restore();
        }
    }
    _drawLegsPass(true); // far legs drawn behind body

    // Nymph: draw translucent
    if (actor.isNymph) drawCtx.globalAlpha = 0.38;
    // Boss aura ring
    if (actor.isBoss && (actor.team !== "green" || actor.isClone)) {
        const auraR = (actor.shieldAuraRadius||5) * TILE_W * 0.5;
        const pulse = 0.5 + 0.5 * Math.sin((actor.shieldAuraPulse||0) * 0.1);
        drawCtx.save();
        drawCtx.globalAlpha = 0.12 + pulse * 0.08;
        drawCtx.strokeStyle = "#aaddff";
        drawCtx.lineWidth = 3;
        drawCtx.beginPath();
        drawCtx.arc(px, bodyBaseY, auraR, 0, Math.PI*2);
        drawCtx.stroke();
        drawCtx.globalAlpha = 1;
        drawCtx.restore();
    }

    // Draw segments — all predators/clones jet black with grey accent lines
    for (let i=0;i<segments.length;i++) {
        const seg=segments[i];
        drawCtx.save(); drawCtx.translate(seg.cx,seg.cy); drawCtx.rotate(seg.rotation);
        const isHead    = i === 1;
        const isAbdomen = i >= 2;

        // Jet black body for all predators/clones
        drawCtx.fillStyle = "#090909";

        if (actor.body.abdomen.round && isAbdomen) {
            // Spider: round globe abdomen
            const rx = seg.width * 0.52, ry = seg.length * 0.58;
            drawCtx.beginPath();
            drawCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI*2);
            drawCtx.fill();
            // Single grey ridge highlight
            drawCtx.strokeStyle = "rgba(75,75,75,0.75)";
            drawCtx.lineWidth = 1.2;
            drawCtx.beginPath();
            drawCtx.ellipse(-rx*0.2, -ry*0.18, rx*0.3, ry*0.24, -0.4, Math.PI*0.85, Math.PI*1.65);
            drawCtx.stroke();
        } else if (isHead) {
            // Angular head: wedge shape — wide flared cheeks, pointed forward snout
            // In rotated context: +X = forward (face), ±Y = sides (cheeks/neck)
            const hw = seg.width * 0.5, ht = seg.length * 0.5;
            const sp = actor.speciesName || "";
            if (sp === "beetle") {
                // Beetle: wide flat armored faceplate
                drawCtx.beginPath();
                drawCtx.moveTo(-hw,        -ht * 0.5 );
                drawCtx.lineTo( hw * 0.55, -ht * 1.3 );
                drawCtx.lineTo( hw * 1.05, -ht * 0.45);
                drawCtx.lineTo( hw * 1.05,  ht * 0.45);
                drawCtx.lineTo( hw * 0.55,  ht * 1.3 );
                drawCtx.lineTo(-hw,         ht * 0.5 );
                drawCtx.closePath(); drawCtx.fill();
            } else if (sp === "scorpion") {
                // Scorpion: wide angular crest head
                drawCtx.beginPath();
                drawCtx.moveTo(-hw * 0.7,  -ht * 0.5 );
                drawCtx.lineTo( hw * 0.3,  -ht * 1.25);
                drawCtx.lineTo( hw,        -ht * 0.7 );
                drawCtx.lineTo( hw * 1.1,   0        );
                drawCtx.lineTo( hw,         ht * 0.7 );
                drawCtx.lineTo( hw * 0.3,   ht * 1.25);
                drawCtx.lineTo(-hw * 0.7,   ht * 0.5 );
                drawCtx.closePath(); drawCtx.fill();
            } else if (sp === "mantis") {
                // Mantis: long triangular blade head
                drawCtx.beginPath();
                drawCtx.moveTo(-hw,         -ht * 0.35);
                drawCtx.lineTo( hw * 0.6,   -ht * 0.85);
                drawCtx.lineTo( hw * 1.2,    0        );
                drawCtx.lineTo( hw * 0.6,    ht * 0.85);
                drawCtx.lineTo(-hw,          ht * 0.35);
                drawCtx.closePath(); drawCtx.fill();
            } else {
                // Ant + default: aggressive wedge with cheek flare
                drawCtx.beginPath();
                drawCtx.moveTo(-hw,         -ht * 0.55);
                drawCtx.lineTo( hw * 0.45,  -ht * 1.15);
                drawCtx.lineTo( hw,          0        );
                drawCtx.lineTo( hw * 0.45,   ht * 1.15);
                drawCtx.lineTo(-hw,          ht * 0.55);
                drawCtx.closePath(); drawCtx.fill();
            }
            // Grey brow/jaw accent lines
            drawCtx.strokeStyle = "rgba(80,80,80,0.75)";
            drawCtx.lineWidth = 0.8;
            drawCtx.beginPath();
            drawCtx.moveTo(hw * 0.1, -ht * 0.5); drawCtx.lineTo(hw * 0.65, 0);
            drawCtx.moveTo(hw * 0.1,  ht * 0.5); drawCtx.lineTo(hw * 0.65, 0);
            drawCtx.stroke();
        } else {
            // Sharp-edged thorax/abdomen (corner radius near-zero)
            const cr = actor.segmentCornerRadius !== undefined ? Math.min(actor.segmentCornerRadius, 2) : 1;
            drawCtx.beginPath(); drawCtx.roundRect(-seg.width*0.5,-seg.length*0.5,seg.width,seg.length,cr); drawCtx.fill();
        }

        // Grey accent lines on all segments (not round abdomen or head — head has its own)
        if (!(actor.body.abdomen.round && isAbdomen) && !isHead) {
            drawCtx.strokeStyle = "rgba(65,65,65,0.7)";
            drawCtx.lineWidth = 0.8;
            // Central spine
            drawCtx.beginPath();
            drawCtx.moveTo(0, -seg.length * 0.3);
            drawCtx.lineTo(0,  seg.length * 0.3);
            drawCtx.stroke();
            // Side edge lines
            [-1, 1].forEach(s => {
                drawCtx.beginPath();
                drawCtx.moveTo(seg.width * 0.31 * s, -seg.length * 0.25);
                drawCtx.lineTo(seg.width * 0.31 * s,  seg.length * 0.25);
                drawCtx.stroke();
            });
        }

        drawCtx.restore();
    }
    _drawLegsPass(false); // near legs drawn over body
    // Stinger tail for scorpions
    if (actor.hasStinger && segments.length > 2) {
        const tail = segments[segments.length-1];
        const tailAngle = angle + Math.PI + Math.sin(frame*0.05)*0.3;
        const stingLen = 14;
        const sx = tail.cx - dirX*tail.length*0.5;
        const sy = tail.cy - dirY*tail.length*0.5;
        drawCtx.save();
        drawCtx.strokeStyle="#555"; drawCtx.lineWidth=3; drawCtx.lineCap="round";
        drawCtx.beginPath();
        drawCtx.moveTo(sx, sy);
        drawCtx.quadraticCurveTo(
            sx - dirX*stingLen*0.5 + Math.cos(tailAngle)*stingLen*0.8,
            sy - dirY*stingLen*0.5 + Math.sin(tailAngle)*stingLen*0.8,
            sx + Math.cos(tailAngle)*stingLen,
            sy + Math.sin(tailAngle)*stingLen
        );
        drawCtx.stroke();
        drawCtx.restore();
    }

    // Mouth designs — species-specific, work at all angles via headAngle
    {
        const headSeg = segments[1] || segments[0];
        const ha = actor.headAngle;
        const fwdX = Math.cos(ha), fwdY = Math.sin(ha);
        const sideX = -fwdY, sideY = fwdX;
        const sp = actor.speciesName || "";
        const wc = actor.walkCycle || 0;
        const isAttacking = actor.state === "attack";
        // Face tip — forward edge of head
        const headHW = (segments[1] ? segments[1].width : segments[0].width) * 0.5;
        const faceX = headSeg.cx + fwdX * headHW;
        const faceY = headSeg.cy + fwdY * headHW;

        drawCtx.save();
        drawCtx.lineCap = "round";

        if (sp === "ant") {
            // Ant: wide-swept razor mandibles — long angular blades, alternate chomp
            const mLen = (actor.appendages.mandibles?.length || 5) * 1.4;
            const chompSpd = isAttacking ? 0.4 : 0.1;
            const chL = Math.sin(wc * chompSpd) * 0.55;
            const chR = Math.sin(wc * chompSpd + Math.PI) * 0.55;
            drawCtx.strokeStyle = "#222"; drawCtx.lineWidth = actor.appendages.mandibles?.thickness || 2;
            [-1, 1].forEach(side => {
                const ch = side === -1 ? chL : chR;
                const bx = faceX + sideX * side * 3.2, by = faceY + sideY * side * 3.2;
                // Two-segment angular blade: sweeps outward then snaps inward
                const a1 = ha + side * (-0.9 + ch * 0.6);
                const ex = bx + Math.cos(a1) * mLen * 0.52, ey = by + Math.sin(a1) * mLen * 0.52;
                const a2 = a1 - side * 0.55;
                const tx = ex + Math.cos(a2) * mLen * 0.55, ty = ey + Math.sin(a2) * mLen * 0.55;
                drawCtx.beginPath(); drawCtx.moveTo(bx,by); drawCtx.lineTo(ex,ey); drawCtx.stroke();
                drawCtx.beginPath(); drawCtx.moveTo(ex,ey); drawCtx.lineTo(tx,ty); drawCtx.stroke();
                drawCtx.fillStyle = "#333";
                drawCtx.beginPath(); drawCtx.arc(tx,ty,1.8,0,Math.PI*2); drawCtx.fill();
            });

        } else if (sp === "beetle") {
            // Beetle: heavy crushing horn-plates — two thick blade fins + central horn
            const bLen = (actor.appendages.mandibles?.length || 4) * 1.8;
            const hornPulse = isAttacking ? Math.sin(actor.attackAnim || 0) * 2 : 0;
            drawCtx.fillStyle = "#151515"; drawCtx.strokeStyle = "#555"; drawCtx.lineWidth = 0.8;
            [-1, 1].forEach(side => {
                const bx = faceX + sideX * side * 4, by = faceY + sideY * side * 4;
                const backX = bx - sideX * side * 3.5, backY = by - sideY * side * 3.5;
                const tipX  = bx + fwdX * (bLen + hornPulse), tipY = by + fwdY * (bLen + hornPulse);
                drawCtx.beginPath();
                drawCtx.moveTo(backX, backY); drawCtx.lineTo(bx, by);
                drawCtx.lineTo(tipX, tipY); drawCtx.closePath();
                drawCtx.fill(); drawCtx.stroke();
            });
            // Central horn protrusion
            drawCtx.fillStyle = "#1a1a1a";
            const hornTX = faceX + fwdX * bLen * 0.7 + hornPulse * fwdX;
            const hornTY = faceY + fwdY * bLen * 0.7 + hornPulse * fwdY;
            drawCtx.beginPath();
            drawCtx.moveTo(faceX + sideX * 2.5, faceY + sideY * 2.5);
            drawCtx.lineTo(faceX - sideX * 2.5, faceY - sideY * 2.5);
            drawCtx.lineTo(hornTX, hornTY);
            drawCtx.closePath(); drawCtx.fill();

        } else if (sp === "scorpion") {
            // Scorpion: forward-curved chelae (pincers) — claw hooks that snap
            const cLen = (actor.appendages.mandibles?.length || 7) * 1.1;
            const snapSpd = isAttacking ? 0.35 : 0.08;
            const snap = Math.sin(wc * snapSpd) * 0.4;
            drawCtx.strokeStyle = "#333"; drawCtx.lineWidth = 2.5;
            [-1, 1].forEach(side => {
                const bx = faceX + sideX * side * 4.5, by = faceY + sideY * side * 4.5;
                const midX = bx + fwdX * cLen * 0.55 + sideX * side * cLen * 0.22;
                const midY = by + fwdY * cLen * 0.55 + sideY * side * cLen * 0.22;
                // Upper claw arm
                const upA = ha + side * (0.35 - snap * 0.7);
                const upTX = midX + Math.cos(upA) * cLen * 0.42, upTY = midY + Math.sin(upA) * cLen * 0.42;
                // Lower claw arm (snaps toward upper)
                const loA = ha + side * (0.7 - snap * 0.4);
                const loTX = midX + Math.cos(loA) * cLen * 0.35, loTY = midY + Math.sin(loA) * cLen * 0.35;
                drawCtx.beginPath(); drawCtx.moveTo(bx,by); drawCtx.quadraticCurveTo(midX,midY,upTX,upTY); drawCtx.stroke();
                drawCtx.beginPath(); drawCtx.moveTo(midX,midY); drawCtx.lineTo(loTX,loTY); drawCtx.stroke();
                drawCtx.fillStyle = "#444";
                drawCtx.beginPath(); drawCtx.arc(upTX,upTY,1.8,0,Math.PI*2); drawCtx.fill();
                drawCtx.beginPath(); drawCtx.arc(loTX,loTY,1.4,0,Math.PI*2); drawCtx.fill();
            });

        } else if (sp === "mantis") {
            // Mantis: sharp serrated beak — narrow pointed labrum with saw edge
            const bLen = (actor.appendages.mandibles?.length || 8) * 0.55;
            const beakTX = faceX + fwdX * bLen, beakTY = faceY + fwdY * bLen;
            drawCtx.fillStyle = "#1a1a1a"; drawCtx.strokeStyle = "#666"; drawCtx.lineWidth = 0.7;
            // Upper beak half
            drawCtx.beginPath();
            drawCtx.moveTo(faceX + sideX * 3.5,  faceY + sideY * 3.5);
            drawCtx.lineTo(faceX - sideX * 0.5, faceY - sideY * 0.5);
            drawCtx.lineTo(beakTX, beakTY);
            drawCtx.closePath(); drawCtx.fill(); drawCtx.stroke();
            // Lower beak half
            drawCtx.fillStyle = "#131313";
            drawCtx.beginPath();
            drawCtx.moveTo(faceX - sideX * 3.5,  faceY - sideY * 3.5);
            drawCtx.lineTo(faceX + sideX * 0.5,  faceY + sideY * 0.5);
            drawCtx.lineTo(beakTX, beakTY);
            drawCtx.closePath(); drawCtx.fill(); drawCtx.stroke();
            // Tip spike
            drawCtx.fillStyle = "#555";
            drawCtx.beginPath(); drawCtx.arc(beakTX, beakTY, 1.5, 0, Math.PI*2); drawCtx.fill();

        } else {
            // Generic / nymph fallback: simple V-mandibles
            const mandData = actor.appendages.mandibles;
            if (mandData && mandData.enabled) {
                const mLen = mandData.length;
                const chompSpd = isAttacking ? 0.35 : 0.10;
                const chL = Math.sin(wc * chompSpd) * 0.4;
                const chR = Math.sin(wc * chompSpd + Math.PI) * 0.4;
                drawCtx.strokeStyle = "#222"; drawCtx.lineWidth = mandData.thickness;
                [-1, 1].forEach(side => {
                    const ch = side === -1 ? chL : chR;
                    const bx = faceX + sideX * side * 3.5, by = faceY + sideY * side * 3.5;
                    const a1 = ha + side * (-0.6) + ch;
                    const ex = bx + Math.cos(a1) * mLen * 0.55, ey = by + Math.sin(a1) * mLen * 0.55;
                    const a2 = a1 - side * 0.45;
                    const tx = ex + Math.cos(a2) * mLen * 0.5, ty = ey + Math.sin(a2) * mLen * 0.5;
                    drawCtx.beginPath(); drawCtx.moveTo(bx,by); drawCtx.lineTo(ex,ey); drawCtx.stroke();
                    drawCtx.beginPath(); drawCtx.moveTo(ex,ey); drawCtx.lineTo(tx,ty); drawCtx.stroke();
                    drawCtx.fillStyle = "#333";
                    drawCtx.beginPath(); drawCtx.arc(tx,ty,mandData.thickness*0.6,0,Math.PI*2); drawCtx.fill();
                });
            }
        }
        drawCtx.restore();
    }

    // Chelicerae — spider downward-curved fangs
    const chelData = actor.appendages.chelicerae;
    if (chelData && chelData.enabled) {
        const headSeg = segments[1] || segments[0];
        const ha = actor.headAngle;
        const fwdX=Math.cos(ha), fwdY=Math.sin(ha);
        const sideX=-fwdY, sideY=fwdX;
        const baseX=headSeg.cx+fwdX*5, baseY=headSeg.cy+fwdY*5;
        const fangCol = "#222";
        drawCtx.save();
        drawCtx.strokeStyle=fangCol; drawCtx.lineWidth=chelData.thickness; drawCtx.lineCap="round";
        [-1,1].forEach(side => {
            const ox = sideX*3.5*side, oy = sideY*3.5*side;
            // Base segment downward
            const mid1X = baseX+ox+fwdX*chelData.length*0.45;
            const mid1Y = baseY+oy+fwdY*chelData.length*0.45;
            // Fang curves inward — chelicerae hook
            const tipX = mid1X + fwdX*chelData.length*0.5 - sideX*side*chelData.fangCurve*6;
            const tipY = mid1Y + fwdY*chelData.length*0.5 - sideY*side*chelData.fangCurve*6;
            drawCtx.beginPath();
            drawCtx.moveTo(baseX+ox, baseY+oy);
            drawCtx.quadraticCurveTo(mid1X, mid1Y, tipX, tipY);
            drawCtx.stroke();
            // Fang tip dot
            drawCtx.fillStyle = "#444";
            drawCtx.beginPath(); drawCtx.arc(tipX, tipY, chelData.thickness*0.7, 0, Math.PI*2); drawCtx.fill();
        });
        drawCtx.restore();
    }

    // Pedipalps — short segmented sensory arms flanking chelicerae
    const pedData = actor.appendages.pedipalps;
    if (pedData && pedData.enabled) {
        const headSeg = segments[1] || segments[0];
        const ha = actor.headAngle;
        const fwdX=Math.cos(ha), fwdY=Math.sin(ha);
        const sideX=-fwdY, sideY=fwdX;
        const baseX=headSeg.cx+fwdX*3, baseY=headSeg.cy+fwdY*3;
        drawCtx.save();
        drawCtx.strokeStyle="#333"; drawCtx.lineWidth=pedData.thickness; drawCtx.lineCap="round";
        [-1,1].forEach(side => {
            const ox=sideX*6*side, oy=sideY*6*side;
            // Two segments — elbow out then tip bulb
            const j1x=baseX+ox+fwdX*pedData.length*0.5;
            const j1y=baseY+oy+fwdY*pedData.length*0.5;
            const tipX=j1x+fwdX*pedData.length*0.4+sideX*side*2;
            const tipY=j1y+fwdY*pedData.length*0.4+sideY*side*2;
            drawCtx.beginPath(); drawCtx.moveTo(baseX+ox,baseY+oy); drawCtx.lineTo(j1x,j1y); drawCtx.stroke();
            drawCtx.beginPath(); drawCtx.moveTo(j1x,j1y); drawCtx.lineTo(tipX,tipY); drawCtx.stroke();
            // Bulb tip
            drawCtx.fillStyle="#444";
            drawCtx.beginPath(); drawCtx.arc(tipX,tipY,pedData.thickness*1.2,0,Math.PI*2); drawCtx.fill();
        });
        drawCtx.restore();
    }

    // Spinnerets — rear of abdomen, small paired nubs
    const spinData = actor.appendages.spinnerets;
    if (spinData && spinData.enabled) {
        const abdSeg = segments[segments.length-1];
        const tailX = abdSeg.cx - dirX*abdSeg.length*0.55;
        const tailY = abdSeg.cy - dirY*abdSeg.length*0.55;
        drawCtx.save();
        drawCtx.fillStyle = "#1a1a1a";
        [-1,1].forEach(side => {
            const ox=perpX*side*abdSeg.width*0.2, oy=perpY*side*abdSeg.width*0.2;
            drawCtx.beginPath();
            drawCtx.ellipse(tailX+ox, tailY+oy, spinData.size*0.7, spinData.size, angle, 0, Math.PI*2);
            drawCtx.fill();
        });
        drawCtx.restore();
    }

    // Spider eyes — 4 pairs arranged in arc on cephalothorax front
    if (actor.appendages.eyes && actor.appendages.eyes.count === 8) {
        const headSeg = segments[1] || segments[0];
        const ha = actor.headAngle;
        const fwdX=Math.cos(ha), fwdY=Math.sin(ha);
        const sideX=-fwdY, sideY=fwdX;
        const eyeSize = actor.appendages.eyes.size;
        const eyeGlow = actor.appendages.eyes.glow || 0;
        const eyeBaseX = headSeg.cx+fwdX*headSeg.length*0.3;
        const eyeBaseY = headSeg.cy+fwdY*headSeg.length*0.3;
        // Two rows of 4 eyes each
        [[0.5,1.5],[0.5,1.5]].forEach((cols, row) => {
            cols.forEach((col, ci) => {
                [-1,1].forEach(side => {
                    const ex = eyeBaseX + sideX*col*eyeSize*2*side - fwdX*row*eyeSize*2.5;
                    const ey = eyeBaseY + sideY*col*eyeSize*2*side - fwdY*row*eyeSize*2.5;
                    drawCtx.save();
                    const _isAllyEye = actor.team === "green" || actor.isClone;
                    if (eyeGlow > 0) { drawCtx.shadowColor=_isAllyEye?"#00ee88":"#aaaacc"; drawCtx.shadowBlur=eyeSize*eyeGlow*3; }
                    drawCtx.fillStyle = _isAllyEye ? "#00cc77" : "#9999bb";
                    drawCtx.beginPath(); drawCtx.arc(ex, ey, eyeSize, 0, Math.PI*2); drawCtx.fill();
                    // Pupil
                    drawCtx.shadowBlur=0;
                    drawCtx.fillStyle="#000";
                    drawCtx.beginPath(); drawCtx.arc(ex+fwdX*0.5, ey+fwdY*0.5, eyeSize*0.45, 0, Math.PI*2); drawCtx.fill();
                    drawCtx.restore();
                });
            });
        });
    }

    // Wings / Elytra
    const wingData=actor.appendages.wings;
    if (wingData&&wingData.enabled) {
        const wCX=px+dirX*actor.joints.wingRoot.forward;
        const wCY=bodyBaseY+actor.joints.wingRoot.vertical;
        const flare=wingData.angleOffset/2;
        drawCtx.save(); drawCtx.fillStyle=`rgba(180,220,255,${actor.visual.wingAlpha})`;
        drawCtx.beginPath(); drawCtx.moveTo(wCX,wCY);
        drawCtx.lineTo(wCX+perpX*wingData.length-dirX*wingData.width*flare, wCY+perpY*wingData.length-dirY*wingData.width*flare);
        drawCtx.lineTo(wCX-dirX*wingData.width,wCY-dirY*wingData.width); drawCtx.closePath(); drawCtx.fill();
        drawCtx.beginPath(); drawCtx.moveTo(wCX,wCY);
        drawCtx.lineTo(wCX-perpX*wingData.length-dirX*wingData.width*flare, wCY-perpY*wingData.length-dirY*wingData.width*flare);
        drawCtx.lineTo(wCX-dirX*wingData.width,wCY-dirY*wingData.width); drawCtx.closePath(); drawCtx.fill();
        drawCtx.restore();
    }

    // Beetle elytra — hardened shell halves, concave dome, meet at center seam
    if (actor.armorPlated) {
        const thorax = segments[0];
        const abdomen = segments[segments.length-1];

        // Shell runs from thorax center back to abdomen tip
        const shellFrontX = thorax.cx;
        const shellFrontY = thorax.cy;
        const shellBackX  = abdomen.cx - dirX * abdomen.length * 0.5;
        const shellBackY  = abdomen.cy - dirY * abdomen.length * 0.5;
        const shellLen    = Math.hypot(shellBackX - shellFrontX, shellBackY - shellFrontY);
        const halfW       = dim.width * 0.80; // how far each half dome extends sideways

        // Isometric compression
        const isoY = 0.5;

        drawCtx.save();

        // Draw two shell halves — left and right
        [-1, 1].forEach(side => {
            const outX = perpX * side * halfW;
            const outY = perpY * side * halfW * isoY;

            // Shell outline points
            const tipFX = shellFrontX;
            const tipFY = shellFrontY;
            const tipBX = shellBackX;
            const tipBY = shellBackY;
            const outerMidX = shellFrontX + (shellBackX - shellFrontX) * 0.5 + outX;
            const outerMidY = shellFrontY + (shellBackY - shellFrontY) * 0.5 + outY;

            // Base shell fill — dark chitin
            const shellBaseColor = "#0d0d0d";
            drawCtx.fillStyle = shellBaseColor;
            drawCtx.beginPath();
            drawCtx.moveTo(tipFX, tipFY);
            // Convex outer edge (dome outward)
            drawCtx.quadraticCurveTo(outerMidX, outerMidY, tipBX, tipBY);
            // Concave inner seam (curves slightly back toward center)
            const seamCtrlX = (tipFX + tipBX) * 0.5 - perpX * side * halfW * 0.18;
            const seamCtrlY = (tipFY + tipBY) * 0.5 - perpY * side * halfW * 0.18 * isoY;
            drawCtx.quadraticCurveTo(seamCtrlX, seamCtrlY, tipFX, tipFY);
            drawCtx.closePath();
            drawCtx.fill();

            // Highlight ridge — top curve of the dome
            const ridgeColor = "#252525";
            drawCtx.strokeStyle = ridgeColor;
            drawCtx.lineWidth = 2.5;
            drawCtx.beginPath();
            drawCtx.moveTo(tipFX, tipFY);
            drawCtx.quadraticCurveTo(outerMidX, outerMidY, tipBX, tipBY);
            drawCtx.stroke();

            // Specular highlight — inner dome shine strip
            const shineX = shellFrontX + (shellBackX - shellFrontX) * 0.3 + outX * 0.45;
            const shineY = shellFrontY + (shellBackY - shellFrontY) * 0.3 + outY * 0.45;
            const shine2X = shellFrontX + (shellBackX - shellFrontX) * 0.65 + outX * 0.4;
            const shine2Y = shellFrontY + (shellBackY - shellFrontY) * 0.65 + outY * 0.4;
            const shineCol = "rgba(80,80,80,0.35)";
            drawCtx.strokeStyle = shineCol;
            drawCtx.lineWidth = 3;
            drawCtx.lineCap = "round";
            drawCtx.beginPath();
            drawCtx.moveTo(shineX, shineY);
            drawCtx.lineTo(shine2X, shine2Y);
            drawCtx.stroke();
        });

        // Center seam line
        drawCtx.strokeStyle = "#1a1a1a";
        drawCtx.lineWidth = 1.5;
        drawCtx.setLineDash([3, 4]);
        drawCtx.beginPath();
        drawCtx.moveTo(shellFrontX, shellFrontY);
        drawCtx.lineTo(shellBackX, shellBackY);
        drawCtx.stroke();
        drawCtx.setLineDash([]);

        drawCtx.restore();
    }

    if (actor.isNymph) drawCtx.globalAlpha = 1; // restore after nymph transparency
    const _isAllyPred = actor.team === "green" || actor.isClone;
    drawHealthBar(px-18, py-85, 36, 5, actor.health, actor.maxHealth, drawCtx);
    // Clone/ally: green bracket frame + diamond marker for identification
    if (_isAllyPred) {
        drawCtx.strokeStyle = "#0f8"; drawCtx.lineWidth = 1;
        drawCtx.strokeRect(px - 20, py - 87, 40, 9);
        drawCtx.save();
        drawCtx.setTransform(1, 0, 0, 1, 0, 0);
        drawCtx.fillStyle = "#0f8";
        drawCtx.font = "bold 7px monospace";
        drawCtx.textAlign = "center";
        drawCtx.fillText("◆", px, py - 88);
        drawCtx.restore();
    }
    // Shield bar — blue, drawn above HP bar; drains on damage, no passive regen
    if (actor.shielded && actor.shieldAmount > 0) {
        actor._shieldMax = Math.max(actor._shieldMax || 0, actor.shieldAmount);
        const shPct = Math.max(0, Math.min(1, actor.shieldAmount / actor._shieldMax));
        drawCtx.fillStyle = "#000"; drawCtx.fillRect(px-18, py-93, 36, 4);
        drawCtx.fillStyle = "#3af"; drawCtx.fillRect(px-18, py-93, Math.round(36 * shPct), 4);
    }
    drawPredatorDebug(actor, px, py);
}

// Insect leg helper — tracks two points: crest (knee arc) and foot (ground grip)
function _drawInsectLeg(drawCtx, hx, hy, side, phaseOffset, pos, actor, legData, dirX, dirY, perpX, perpY) {
    // True outward direction — perpendicular to body, both sides spread correctly
    const outX = perpX * side;
    const outY = perpY * side;

    // crouchRise lifts the knee above the hip and pushes the foot down the same amount,
    // giving a bent-leg crouching posture for species like ant, beetle, and scorpion.
    const crouchRise = legData.crouchRise || 0;

    // Gyrations: walk cycle drives lift (crest rises) and stride (foot steps fore/aft)
    const gait   = actor.state !== "attack" ? Math.sin(actor.walkCycle + phaseOffset) : 0;
    const swing  = gait > 0;
    const lift   = swing ? gait * 7 : 0;
    const stride = Math.sin(actor.walkCycle * legData.swingSpeed + phaseOffset) * 5;

    // ── CREST (knee) — apex at full coxa+femur reach, barely strides ──
    // In 3/4 view the perpendicular vector can point upward in screen space (outY < 0) for
    // the far side of the body. Two corrections keep legs grounded:
    //   1. Far-side knees (outY < 0): dampen the upward rise to ~20% so they barely clear the hip.
    //   2. Lateral legs (outY ≈ 0, creature facing up/down): add a gravity pull (½ × lateral
    //      spread) so knees angle toward the ground plane rather than staying horizontal.
    const effectiveOutY = outY > 0 ? outY : outY * 0.2;
    const gravityPull   = Math.abs(outX) * 0.5;
    const crestX = hx + outX * (legData.coxa + legData.femur) + dirX * stride * 0.2;
    const crestY = hy + (effectiveOutY + gravityPull) * (legData.coxa + legData.femur) - lift - crouchRise;

    // ── FOOT — tibia pulls inward + downward from knee ──
    // (-out * 0.4) brings foot closer to body than knee.
    // (Math.abs(dirX) + Math.abs(dirY)) adds downward gravity regardless of facing direction —
    // at 0°/180° dirX drives the pull; at 90°/270° dirY drives it. Stride only animates, no constant forward lean.
    const footX = crestX - outX * legData.tibia * 0.4 + dirX * stride * 0.8;
    const footY = crestY - outY * legData.tibia * 0.4 + (Math.abs(dirX) + Math.abs(dirY)) * legData.tibia * 0.8 - lift * 0.3 + crouchRise;

    drawCtx.beginPath(); drawCtx.moveTo(hx, hy); drawCtx.lineTo(crestX, crestY); drawCtx.lineTo(footX, footY); drawCtx.stroke();
}

function _drawVirus(actor, px, py, drawCtx) {
    drawHealthBar(px-14, py-75, 28, 4, actor.health, actor.maxHealth, drawCtx);

    // ── ULTIMATE CHARGE BAR ───────────────────────────────
    if (actor.isFollower && typeof actor.ultimateCharge === "number") {
        const _uc = Math.max(0, Math.min(100, actor.ultimateCharge));
        const _ucFull = _uc >= 100;
        const _elDef = ELEMENTS.find(e => e.id === actor.element);
        const _elCol = _elDef ? _elDef.color : "#aaa";
        // Background track
        drawCtx.fillStyle = "#111";
        drawCtx.fillRect(px - 14, py - 82, 28, 3);
        // Filled portion — pulses white when full
        if (_ucFull) {
            const _pulse = 0.5 + 0.5 * Math.sin((frame || 0) * 0.18);
            drawCtx.fillStyle = _pulse > 0.5 ? "#ffffff" : _elCol;
        } else {
            drawCtx.fillStyle = _elCol;
        }
        drawCtx.fillRect(px - 13, py - 81, Math.floor(26 * (_uc / 100)), 1);
        // "▲" ready indicator
        if (_ucFull) {
            drawCtx.save();
            drawCtx.setTransform(1, 0, 0, 1, 0, 0);
            drawCtx.font = "bold 8px monospace";
            drawCtx.textAlign = "center";
            drawCtx.fillStyle = _elCol;
            drawCtx.fillText("▲", px, py - 85);
            drawCtx.restore();
        }
    }

    const elementDef   = ELEMENTS.find(e => e.id === actor.element);
    const elementColor = actor.isNeutralRecruit ? "#aaaaaa" : (elementDef ? elementDef.color : "#777");
    const hr = actor.maxHealth > 0 ? actor.health / actor.maxHealth : 0;
    const er = parseInt(elementColor.substring(1,3),16);
    const eg = parseInt(elementColor.substring(3,5),16);
    const eb = parseInt(elementColor.substring(5,7),16);
    const flash = actor.hitFlash > 0 && actor.state !== "retreat";

    // ── GHOSTPHAGE GHOST — translucent white wraith, no element color ──
    if (actor.ghostphageLife) {
        const bodyY2 = py - 40;
        const pulse = 0.38 + 0.14 * Math.sin((frame||0) * 0.1);
        drawCtx.save();
        drawCtx.globalAlpha = pulse;
        // Wispy legs
        drawCtx.strokeStyle = "#aacccc"; drawCtx.lineWidth = 1.2; drawCtx.lineCap = "round";
        [[px-6,bodyY2+22,Math.PI*0.83,Math.PI*0.56],[px+6,bodyY2+22,Math.PI*0.17,Math.PI*0.44],[px,bodyY2+20,Math.PI*0.55,Math.PI*0.38]].forEach(([hx,hy,a1,a2])=>{
            const kx=hx+Math.cos(a1)*13, ky=hy+Math.sin(a1)*13;
            const fx=kx+Math.cos(a2)*11, fy=ky+Math.sin(a2)*11;
            drawCtx.beginPath(); drawCtx.moveTo(hx,hy); drawCtx.lineTo(kx,ky); drawCtx.lineTo(fx,fy); drawCtx.stroke();
        });
        // Ghost body — hollow white column with glow
        drawCtx.shadowColor = "#aaffff"; drawCtx.shadowBlur = 12;
        drawCtx.strokeStyle = "#ddeeff"; drawCtx.lineWidth = 1.2;
        drawCtx.strokeRect(px-5, bodyY2+5, 10, 18);
        // Head diamond — white outline
        drawCtx.beginPath();
        drawCtx.moveTo(px, bodyY2-8); drawCtx.lineTo(px+10, bodyY2+2);
        drawCtx.lineTo(px, bodyY2+12); drawCtx.lineTo(px-10, bodyY2+2); drawCtx.closePath();
        drawCtx.strokeStyle = "#ffffff"; drawCtx.lineWidth = 1.5;
        drawCtx.stroke();
        drawCtx.shadowBlur = 0;
        drawCtx.restore();
        drawHealthBar(px-14, py-75, 28, 4, actor.health, actor.maxHealth, drawCtx);
        return;
    }

    const wc = actor.walkCycle || 0;

    // ── Layout constants ──────────────────────────────────────────────────────
    // (all y values relative to py = isometric ground point)
    const BASE_Y    = py - 28;   // base plate centre
    const TORSO_BOT = BASE_Y - 2;
    const TORSO_TOP = TORSO_BOT - 17;
    const COLLAR_Y  = TORSO_TOP;
    const DOME_CY   = COLLAR_Y;        // half-capsule base (flat bottom at collar)
    const DOME_R    = 10;

    // ── 3 SOLID BLACK LEGS — drawn first (behind body) ──────────────────────
    const legDefs = [
        { hOX:-7, hOY:1, femA: Math.PI*0.80, tibA: Math.PI*0.62, ph: 0            },
        { hOX: 7, hOY:1, femA: Math.PI*0.20, tibA: Math.PI*0.38, ph: Math.PI*2/3  },
        { hOX: 0, hOY:-1, femA: Math.PI*0.50, tibA: Math.PI*0.55, ph: Math.PI*4/3 },
    ];
    const FEM_LEN = 15, TIB_LEN = 13;

    // Pre-compute saw size and claw size so leg loop can use them
    const _sawSt    = (actor.isFollower && !actor.ghostphageLife) ? (actor.stats || {}) : null;
    const _sawSize  = _sawSt ? Math.max(0, ((_sawSt.attack || 10) - 10) * 0.35) : 0;
    const _clawSt   = _sawSt;
    const _clawSize = _clawSt ? Math.max(0, (Math.max(_clawSt.specialAttack || 0, _clawSt.accuracy || 0) - 10) * 0.45) : 0;
    const _elDef2   = _clawSt ? ELEMENTS.find(e => e.id === actor.element) : null;
    const _elCol2   = _elDef2 ? _elDef2.color : "#aaa";

    drawCtx.save();
    drawCtx.lineCap = "round";
    legDefs.forEach(({ hOX, hOY, femA, tibA, ph }) => {
        const gait  = Math.sin(wc + ph);
        const lift  = gait > 0 ? gait * 5 : 0;
        const swing = gait * 0.12;
        const hx = px + hOX, hy = BASE_Y + hOY;

        const kx = hx + Math.cos(femA + swing) * FEM_LEN;
        const ky = hy + Math.sin(femA + swing) * FEM_LEN - lift;
        const fx = kx + Math.cos(tibA + swing * 0.5) * TIB_LEN;
        const fy = ky + Math.sin(tibA + swing * 0.5) * TIB_LEN - lift * 0.25;

        // Upper leg — solid black body + white gloss
        drawCtx.strokeStyle = flash ? "#dde" : "#080808"; drawCtx.lineWidth = 4;
        drawCtx.beginPath(); drawCtx.moveTo(hx, hy); drawCtx.lineTo(kx, ky); drawCtx.stroke();
        drawCtx.strokeStyle = flash ? "#fff" : "rgba(255,255,255,0.55)"; drawCtx.lineWidth = 1;
        drawCtx.beginPath(); drawCtx.moveTo(hx, hy); drawCtx.lineTo(kx, ky); drawCtx.stroke();
        // Lower leg — solid black body + white gloss
        drawCtx.strokeStyle = flash ? "#ccd" : "#080808"; drawCtx.lineWidth = 3;
        drawCtx.beginPath(); drawCtx.moveTo(kx, ky); drawCtx.lineTo(fx, fy); drawCtx.stroke();
        drawCtx.strokeStyle = flash ? "#fff" : "rgba(255,255,255,0.45)"; drawCtx.lineWidth = 0.8;
        drawCtx.beginPath(); drawCtx.moveTo(kx, ky); drawCtx.lineTo(fx, fy); drawCtx.stroke();
        // Foot tip — just a sharp point, no round pad

        // ── SAW TEETH on lower leg (brawler) ──
        if (_sawSize > 0.3) {
            const tibDX = fx - kx, tibDY = fy - ky;
            const tibLen = Math.sqrt(tibDX * tibDX + tibDY * tibDY);
            const tux = tibDX / tibLen, tuy = tibDY / tibLen; // unit along tibia
            // Two candidate perpendiculars — pick the one pointing away from body centre
            const midX = (kx + fx) * 0.5, midY = (ky + fy) * 0.5;
            const dot = (midX - px) * (-tuy) + (midY - BASE_Y) * tux;
            const perpX = dot >= 0 ? -tuy :  tuy;
            const perpY = dot >= 0 ?  tux : -tux;

            const TEETH  = Math.round(3 + _sawSize * 1.1);
            const toothH = 1.8 + _sawSize * 0.55;

            drawCtx.fillStyle = flash ? "#dde" : "#080808";
            drawCtx.beginPath();
            for (let t = 0; t < TEETH; t++) {
                const t0 = t / TEETH, t1 = (t + 1) / TEETH, tm = (t0 + t1) * 0.5;
                const b0x = kx + tux * tibLen * t0, b0y = ky + tuy * tibLen * t0;
                const b1x = kx + tux * tibLen * t1, b1y = ky + tuy * tibLen * t1;
                const tipX = kx + tux * tibLen * tm + perpX * toothH;
                const tipY = ky + tuy * tibLen * tm + perpY * toothH;
                drawCtx.moveTo(b0x, b0y);
                drawCtx.lineTo(tipX, tipY);
                drawCtx.lineTo(b1x, b1y);
            }
            drawCtx.closePath();
            drawCtx.fill();
        }

        // ── KNEE CLAW (sniper) — 'c'-shaped talon at each knee joint ──
        if (_clawSize > 0.3) {
            const isMiddle = (hOX === 0);
            const clawLen  = 3 + _clawSize * 0.9;
            const snapOut  = actor.state === "attack" ? Math.sin(actor.attackAnim || 0) * 4 : 0;

            // "out" = perpendicular to femur, pointing away from body centre
            const femDX = kx - hx, femDY = ky - hy;
            const femMag = Math.sqrt(femDX * femDX + femDY * femDY);
            const fux = femDX / femMag, fuy = femDY / femMag;
            const kDot = (kx - px) * (-fuy) + (ky - BASE_Y) * fux;
            const outX = kDot >= 0 ? -fuy :  fuy;
            const outY = kDot >= 0 ?  fux : -fux;

            // "up" = along femur back toward hip (the 'c' tip points this way)
            const upX = -fux, upY = -fuy;

            const cH  = clawLen * 1.5;
            // Middle leg is foreshortened — compress the width so it reads as the same shape seen straight-on
            const cBW = (clawLen * 0.8 + snapOut * 0.25) * (isMiddle ? 0.55 : 1.0);

            const botOuterX = kx + outX * cBW;
            const botOuterY = ky + outY * cBW;

            const tipX = kx + outX * cBW * 0.08 + upX * cH;
            const tipY = ky + outY * cBW * 0.08 + upY * cH;

            const ctrlOutX = kx + outX * cBW * 1.18 + upX * cH * 0.40;
            const ctrlOutY = ky + outY * cBW * 1.18 + upY * cH * 0.40;

            const ctrlInX = kx + outX * cBW * 0.16 + upX * cH * 0.64;
            const ctrlInY = ky + outY * cBW * 0.16 + upY * cH * 0.64;

            drawCtx.save();
            drawCtx.fillStyle = flash ? "#fff" : _elCol2;
            drawCtx.beginPath();
            drawCtx.moveTo(botOuterX, botOuterY);
            drawCtx.quadraticCurveTo(ctrlOutX, ctrlOutY, tipX, tipY);
            drawCtx.quadraticCurveTo(ctrlInX, ctrlInY, kx, ky);
            drawCtx.closePath();
            drawCtx.fill();

            // Knee joint dot
            drawCtx.fillStyle = flash ? "#fff" : "#333";
            drawCtx.beginPath(); drawCtx.arc(kx, ky, 1.8, 0, Math.PI * 2); drawCtx.fill();
            drawCtx.restore();
        }
    });
    drawCtx.restore();

    // ── CLEAR GLASS — element color visible inside, transparent walls ─────────
    drawCtx.save();

    const glassTop = DOME_CY;
    const glassBot = BASE_Y;
    const glassH   = glassBot - glassTop;

    // Element fill — rectangular body interior
    drawCtx.fillStyle = `rgba(${er},${eg},${eb},0.18)`;
    drawCtx.fillRect(px - DOME_R + 1.5, glassTop, (DOME_R - 1.5) * 2, glassH);

    // Element fill — dome interior radial gradient
    const liqGrad = drawCtx.createRadialGradient(px - 2, DOME_CY - DOME_R*0.3, 1, px, DOME_CY, DOME_R - 1);
    liqGrad.addColorStop(0, `rgba(${Math.min(255,er+80)},${Math.min(255,eg+80)},${Math.min(255,eb+80)},0.55)`);
    liqGrad.addColorStop(1, `rgba(${er},${eg},${eb},0.2)`);
    drawCtx.fillStyle = liqGrad;
    drawCtx.beginPath(); drawCtx.arc(px, DOME_CY, DOME_R - 1, Math.PI, 0, false);
    drawCtx.closePath(); drawCtx.fill();

    // Crystal — centred in the full glass, element-colored diamond
    const cCY  = (DOME_CY - DOME_R + glassBot) * 0.5; // vertical mid of entire glass
    const cR   = 7.5;
    const cBright = `rgb(${Math.min(255,er+100)},${Math.min(255,eg+100)},${Math.min(255,eb+100)})`;
    const cMid    = `rgb(${Math.min(255,er+40)},${Math.min(255,eg+40)},${Math.min(255,eb+40)})`;
    const crystalPulse = 0.85 + 0.15 * Math.sin((frame||0) * 0.12 + (actor.x||0));
    drawCtx.save();
    drawCtx.globalAlpha = flash ? 1 : crystalPulse;
    drawCtx.fillStyle = cMid;
    drawCtx.beginPath();
    drawCtx.moveTo(px,           cCY - cR);
    drawCtx.lineTo(px + cR*0.7,  cCY);
    drawCtx.lineTo(px,           cCY + cR*0.65);
    drawCtx.lineTo(px - cR*0.7,  cCY);
    drawCtx.closePath(); drawCtx.fill();
    drawCtx.fillStyle = cBright;
    drawCtx.beginPath();
    drawCtx.moveTo(px,           cCY - cR);
    drawCtx.lineTo(px + cR*0.7,  cCY);
    drawCtx.lineTo(px,           cCY - cR*0.15);
    drawCtx.closePath(); drawCtx.fill();
    drawCtx.fillStyle = flash ? "#fff" : "rgba(255,255,255,0.8)";
    drawCtx.beginPath();
    drawCtx.moveTo(px,           cCY - cR);
    drawCtx.lineTo(px + cR*0.3,  cCY - cR*0.5);
    drawCtx.lineTo(px,           cCY - cR*0.65);
    drawCtx.closePath(); drawCtx.fill();
    drawCtx.restore();

    // ── AERATION BUBBLES — each has unique speed, size and phase ──
    const bSeed = ((actor.x||0) * 7 + (actor.y||0) * 13) | 0;
    const bubbleDefs = [
        { xOff: -3, period: 55, phase: (bSeed * 3)        % 55, r: 1.2 },
        { xOff:  4, period: 38, phase: (bSeed * 7  + 15)  % 38, r: 0.9 },
        { xOff: -1, period: 70, phase: (bSeed * 5  + 30)  % 70, r: 1.5 },
        { xOff:  2, period: 47, phase: (bSeed * 11 +  8)  % 47, r: 0.7 },
        { xOff: -5, period: 62, phase: (bSeed * 2  + 22)  % 62, r: 1.0 },
    ];
    drawCtx.save();
    // Clip to glass interior so bubbles don't bleed outside the walls
    drawCtx.beginPath();
    drawCtx.rect(px - DOME_R + 2, DOME_CY - DOME_R, (DOME_R - 2) * 2, glassH + DOME_R);
    drawCtx.clip();
    const riseRange = glassH + DOME_R - 4;
    for (const b of bubbleDefs) {
        const t   = ((frame + b.phase) % b.period) / b.period; // 0..1 progress bottom→top
        const bY  = glassBot - 2 - t * riseRange;
        const bX  = px + b.xOff + Math.sin(t * Math.PI * 3 + b.phase) * 1.5;
        const alpha = t < 0.1 ? t * 10 : (t > 0.85 ? (1 - t) / 0.15 : 1);
        drawCtx.globalAlpha = (flash ? 0.9 : 0.5) * alpha;
        drawCtx.strokeStyle = `rgba(${Math.min(255,er+80)},${Math.min(255,eg+80)},${Math.min(255,eb+80)},1)`;
        drawCtx.lineWidth = 0.7;
        drawCtx.beginPath();
        drawCtx.arc(bX, bY, b.r, 0, Math.PI * 2);
        drawCtx.stroke();
    }
    drawCtx.restore();

    // Glass walls — barely-there tint so glass reads as solid
    drawCtx.fillStyle = "rgba(220,240,255,0.04)";
    drawCtx.beginPath();
    drawCtx.arc(px, DOME_CY, DOME_R, Math.PI, 0, false);
    drawCtx.lineTo(px + DOME_R, glassBot);
    drawCtx.lineTo(px - DOME_R, glassBot);
    drawCtx.closePath(); drawCtx.fill();

    // Glass outline — crisp white edge
    drawCtx.strokeStyle = flash ? "rgba(255,255,255,0.95)" : "rgba(210,235,255,0.75)";
    drawCtx.lineWidth = 1.5;
    drawCtx.beginPath();
    drawCtx.arc(px, DOME_CY, DOME_R, Math.PI, 0, false);
    drawCtx.lineTo(px + DOME_R, glassBot);
    drawCtx.lineTo(px - DOME_R, glassBot);
    drawCtx.closePath(); drawCtx.stroke();

    // ── BLACK BASE — flat platform at the bottom of the glass ──
    const baseH = 4;
    drawCtx.fillStyle = "#000";
    drawCtx.fillRect(px - DOME_R, glassBot, DOME_R * 2, baseH);

    // ── HALF-RADIAL ACCENT — flipped black button on the base ──
    const accentCY = glassBot + baseH * 0.5;
    const accentR  = 4;
    drawCtx.save();
    drawCtx.globalAlpha = flash ? 1 : 0.85;
    // Filled half-circle (top half, dome-up — flipped from original)
    drawCtx.fillStyle = "#111";
    drawCtx.beginPath();
    drawCtx.arc(px, accentCY, accentR, Math.PI, 0, false); // top half arc (flipped)
    drawCtx.closePath();
    drawCtx.fill();
    // Crisp edge
    drawCtx.strokeStyle = flash ? "#fff" : "rgba(80,80,80,0.9)";
    drawCtx.lineWidth = 0.8;
    drawCtx.stroke();
    // Small specular dot
    drawCtx.fillStyle = "rgba(255,255,255,0.6)";
    drawCtx.beginPath();
    drawCtx.arc(px - 1, accentCY - 1.5, 1, 0, Math.PI * 2);
    drawCtx.fill();
    drawCtx.restore();

    // Dome specular arc (top-left shine)
    drawCtx.strokeStyle = flash ? "rgba(255,255,255,0.8)" : "rgba(230,245,255,0.65)";
    drawCtx.lineWidth = 2.5;
    drawCtx.lineCap = "round";
    drawCtx.beginPath();
    drawCtx.arc(px - DOME_R*0.28, DOME_CY - DOME_R*0.28, DOME_R*0.45, Math.PI*1.05, Math.PI*1.7);
    drawCtx.stroke();
    // Left-edge body reflection
    drawCtx.strokeStyle = "rgba(220,240,255,0.3)";
    drawCtx.lineWidth = 1;
    drawCtx.beginPath();
    drawCtx.moveTo(px - DOME_R + 2, glassTop + 2);
    drawCtx.lineTo(px - DOME_R + 2, glassBot - 3);
    drawCtx.stroke();

    drawCtx.restore();
}

// ─────────────────────────────────────────────────────────
//  PLAYER DRAW
// ─────────────────────────────────────────────────────────
function drawPlayer(p) {
    if (player.angryTimer>0) player.angryTimer--;
    const bob=Math.sin(frame*cfg.bobSpeed)*cfg.bobAmount;
    let targetTilt=player.targetX>player.x?cfg.tiltIntensity:(player.targetX<player.x?-cfg.tiltIntensity:0);
    player.rotY+=((player.baseRot+targetTilt)-player.rotY)*cfg.rotationSmoothing;
    const w=26,h=22,d=36,c=Math.cos(player.rotY),s=Math.sin(player.rotY);
    ctx.save(); ctx.translate(p.x, p.y+bob-45);
    const proj=(x,y,z)=>{ let rZ=x*s+z*c; return {x:x*c-z*s, y:y+rZ*0.35}; };
    const v=[proj(-w,-h,-7),proj(w,-h,-7),proj(w,h,0),proj(-w,h,0),
             proj(-w,-h,d), proj(w,-h,d), proj(w,h,d), proj(-w,h,d)];
    let ventPos=proj(w,-2,d/2);
    if (frame%cfg.exhaustFrequency===0) {
        smoke.push({x:p.x+ventPos.x,y:p.y+bob-45+ventPos.y,vx:0.2+Math.random()*0.4,vy:-0.15-Math.random()*0.2,life:1,size:4+Math.random()*6});
    }
    ctx.lineWidth=5; ctx.strokeStyle="#050505";
    for (let t=0;t<4;t++) {
        let sock=proj(t%2===0?-11:11,t<2?-7:7,d);
        ctx.beginPath(); ctx.moveTo(sock.x,sock.y);
            for (let i=0;i<50;i+=10) ctx.lineTo(sock.x+Math.sin(frame*0.06+t)*5, sock.y+i);
            ctx.stroke();
    }
    const drawF=(pts,col)=>{ ctx.fillStyle=col; ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); pts.forEach(pt=>ctx.lineTo(pt.x,pt.y)); ctx.fill(); };
    drawF([v[4],v[5],v[6],v[7]],"#020202"); drawF([v[0],v[3],v[7],v[4]],"#0a0a0a");
    drawF([v[1],v[2],v[6],v[5]],"#111111"); drawF([v[0],v[1],v[5],v[4]],"#222222");
    drawF([v[0],v[1],v[2],v[3]],"#333333");
    const sw=w*0.82,sh=h*0.78,sz=-7.2;
    const sPts=[proj(-sw,-sh,sz),proj(sw,-sh,sz),proj(sw,sh,sz+0.5),proj(-sw,sh,sz+0.5)];
    ctx.fillStyle="#010801"; ctx.beginPath(); ctx.moveTo(sPts[0].x,sPts[0].y); sPts.forEach(pt=>ctx.lineTo(pt.x,pt.y)); ctx.fill();
    const isAngry=player.angryTimer>0;
    ctx.strokeStyle=isAngry?"#f22":"#0f8"; ctx.lineWidth=3; ctx.lineCap="round";
    [-1,1].forEach(sd=>{
        ctx.beginPath();
        let xOff=sd===-1?-11:4;
        let e1=proj(xOff,-1+(isAngry&&sd===-1?-2:0),sz-0.1);
        let e2=proj(xOff+7,-1+(isAngry&&sd===1?-2:0),sz-0.1);
        ctx.moveTo(e1.x,e1.y); ctx.lineTo(e2.x,e2.y); ctx.stroke();
    });
    ctx.restore();
}

// ─────────────────────────────────────────────────────────
//  CIRCUIT BOARD BACKGROUND LAYER
//  Pre-renders a dense PCB-trace pattern onto an offscreen
//  canvas once (or on resize) and blits it at low alpha each
//  frame — giving a subtle, familiar circuit-board feel.
// ─────────────────────────────────────────────────────────

let _circuitOffscreen = null;
let _circuitSize      = { w: 0, h: 0 };

function _mkCircuitRng(seed) {
    let s = (seed >>> 0) || 1;
    return function () {
        s ^= s << 13;
        s ^= s >> 17;
        s ^= s << 5;
        return (s >>> 0) / 4294967296;
    };
}

function _buildCircuit(W, H) {
    const oc     = document.createElement('canvas');
    oc.width     = W;
    oc.height    = H;
    const c      = oc.getContext('2d');
    const rng    = _mkCircuitRng(0xC0FFEE42);

    const CELL   = 20;
    const COLS   = Math.ceil(W / CELL) + 2;
    const ROWS   = Math.ceil(H / CELL) + 2;

    const TW     = 1.3;
    const PAD_R  = 3.0;
    const VIA_R  = 1.6;
    const VIA_RG = 2.9;

    const PALETTE = ['#0f8', '#0df', '#0fa', '#3fc', '#0cf', '#2fd', '#1ee'];
    const pick    = () => PALETTE[Math.floor(rng() * PALETTE.length)];

    c.lineCap  = 'square';
    c.lineJoin = 'miter';

    function drawPad(x, y, col, r) {
        r = r || PAD_R;
        c.fillStyle   = col;
        c.strokeStyle = col;
        c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
        c.lineWidth = 0.65;
        c.beginPath(); c.arc(x, y, r + 2.6, 0, Math.PI * 2); c.stroke();
    }

    function drawVia(x, y, col) {
        c.fillStyle   = col;
        c.strokeStyle = col;
        c.lineWidth   = 0.65;
        c.beginPath(); c.arc(x, y, VIA_R,  0, Math.PI * 2); c.fill();
        c.beginPath(); c.arc(x, y, VIA_RG, 0, Math.PI * 2); c.stroke();
    }

    for (let row = 0; row < ROWS; row++) {
        const passCount = rng() > 0.45 ? 2 : 1;
        for (let pass = 0; pass < passCount; pass++) {
            if (rng() > 0.65) continue;
            const col  = pick();
            const y    = row * CELL + Math.round((rng() - 0.5) * CELL * 0.42);
            const c0   = Math.floor(rng() * COLS * 0.45);
            const c1   = c0 + 3 + Math.floor(rng() * (COLS - c0 - 3) * 0.80);
            const x0   = c0 * CELL;
            const x1   = Math.min(c1, COLS - 1) * CELL;
            c.strokeStyle = col;
            c.lineWidth   = TW;
            c.beginPath();
            c.moveTo(x0, y);
            const mode = rng();
            if (mode > 0.68) {
                const segW = CELL * (1 + Math.floor(rng() * 2));
                const amp  = CELL * (0.38 + rng() * 0.42);
                const sign = rng() > 0.5 ? 1 : -1;
                const legs = 3 + Math.floor(rng() * 7);
                const leadIn = x0 + (x1 - x0) * (0.05 + rng() * 0.15);
                c.lineTo(leadIn, y);
                for (let leg = 0; leg < legs; leg++) {
                    const dir = leg % 2 === 0 ? sign : -sign;
                    const lx  = leadIn + leg * segW;
                    c.lineTo(lx,        y);
                    c.lineTo(lx,        y + amp * dir);
                    c.lineTo(lx + segW, y + amp * dir);
                    c.lineTo(lx + segW, y);
                }
                c.lineTo(x1, y);
            } else if (mode > 0.38) {
                const mid  = x0 + (x1 - x0) * (0.28 + rng() * 0.44);
                const yOff = CELL * (rng() > 0.5 ? 1 : -1) * (0.5 + Math.floor(rng() * 2));
                const jog  = CELL * (0.4 + rng() * 0.8);
                c.lineTo(mid, y);
                c.lineTo(mid, y + yOff);
                c.lineTo(mid + jog, y + yOff);
                c.lineTo(mid + jog, y);
                c.lineTo(x1, y);
            } else {
                c.lineTo(x1, y);
            }
            c.stroke();
            drawPad(x0, y, col);
            drawPad(x1, y, col);
            if (rng() > 0.48) drawVia(x0 + (x1 - x0) * (0.22 + rng() * 0.56), y, col);
            if ((x1 - x0) > CELL * 6 && rng() > 0.55) drawVia(x0 + (x1 - x0) * (0.55 + rng() * 0.25), y, col);
        }
    }

    for (let col = 0; col < COLS; col++) {
        const passCount = rng() > 0.50 ? 2 : 1;
        for (let pass = 0; pass < passCount; pass++) {
            if (rng() > 0.58) continue;
            const colour = pick();
            const x      = col * CELL + Math.round((rng() - 0.5) * CELL * 0.42);
            const r0     = Math.floor(rng() * ROWS * 0.50);
            const r1     = r0 + 2 + Math.floor(rng() * (ROWS - r0 - 2) * 0.65);
            const y0     = r0 * CELL;
            const y1     = Math.min(r1, ROWS - 1) * CELL;
            c.strokeStyle = colour;
            c.lineWidth   = TW;
            c.beginPath();
            c.moveTo(x, y0);
            c.lineTo(x, y1);
            c.stroke();
            drawPad(x, y0, colour);
            drawPad(x, y1, colour);
            if ((y1 - y0) > CELL * 4 && rng() > 0.50) drawVia(x, y0 + (y1 - y0) * (0.3 + rng() * 0.4), colour);
        }
    }

    const numICs = Math.floor((COLS * ROWS) * 0.008);
    for (let i = 0; i < numICs; i++) {
        const icCol = pick();
        const cx    = (1 + Math.floor(rng() * (COLS - 3))) * CELL;
        const cy    = (1 + Math.floor(rng() * (ROWS - 3))) * CELL;
        const icW   = CELL * (2 + Math.floor(rng() * 3));
        const icH   = CELL * (1 + Math.floor(rng() * 2));
        const L     = cx - icW / 2, T = cy - icH / 2;
        c.strokeStyle = icCol;
        c.lineWidth   = 0.85;
        c.strokeRect(L, T, icW, icH);
        c.beginPath();
        c.arc(cx, T, icH * 0.14, Math.PI, 0);
        c.stroke();
        c.fillStyle = icCol;
        const pH = Math.max(2, Math.floor(icW / CELL));
        for (let p = 0; p <= pH; p++) {
            const px = L + (p / pH) * icW;
            c.beginPath(); c.arc(px, T,        1.4, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(px, T + icH,  1.4, 0, Math.PI * 2); c.fill();
        }
        const pV = Math.max(2, Math.floor(icH / CELL));
        for (let p = 0; p <= pV; p++) {
            const py = T + (p / pV) * icH;
            c.beginPath(); c.arc(L,       py, 1.4, 0, Math.PI * 2); c.fill();
            c.beginPath(); c.arc(L + icW, py, 1.4, 0, Math.PI * 2); c.fill();
        }
    }

    const numClusters = Math.floor(COLS * 0.38);
    for (let i = 0; i < numClusters; i++) {
        const clCol = pick();
        const cx    = rng() * W;
        const cy    = rng() * H;
        const arms  = 4 + Math.floor(rng() * 8);
        const rad   = CELL * (1.1 + rng() * 1.9);
        c.strokeStyle = clCol;
        c.fillStyle   = clCol;
        c.lineWidth   = TW;
        for (let a = 0; a < arms; a++) {
            const ang = (a / arms) * Math.PI * 2 + rng() * 0.45;
            const nx  = cx + Math.cos(ang) * rad * (0.45 + rng() * 0.55);
            const ny  = cy + Math.sin(ang) * rad * (0.45 + rng() * 0.55);
            c.beginPath();
            c.moveTo(cx, cy);
            c.lineTo(nx, cy);
            c.lineTo(nx, ny);
            c.stroke();
            c.beginPath(); c.arc(nx, ny, VIA_R, 0, Math.PI * 2); c.fill();
        }
        drawPad(cx, cy, clCol);
    }

    const numMeanders = Math.floor(COLS * 0.22);
    for (let i = 0; i < numMeanders; i++) {
        const mCol  = pick();
        const mx    = rng() * (W - CELL * 6);
        const my    = rng() * (H - CELL * 4);
        const loops = 3 + Math.floor(rng() * 5);
        const mW    = CELL * (0.8 + rng() * 0.6);
        const mH    = CELL * (0.6 + rng() * 0.5);
        const horiz = rng() > 0.5;
        c.strokeStyle = mCol;
        c.lineWidth   = TW * 0.85;
        c.beginPath();
        if (horiz) {
            c.moveTo(mx, my);
            for (let l = 0; l < loops; l++) {
                const dir = l % 2 === 0 ? 1 : -1;
                c.lineTo(mx + l * mW,       my);
                c.lineTo(mx + l * mW,       my + mH * dir);
                c.lineTo(mx + (l + 1) * mW, my + mH * dir);
                c.lineTo(mx + (l + 1) * mW, my);
            }
        } else {
            c.moveTo(mx, my);
            for (let l = 0; l < loops; l++) {
                const dir = l % 2 === 0 ? 1 : -1;
                c.lineTo(mx,            my + l * mH);
                c.lineTo(mx + mW * dir, my + l * mH);
                c.lineTo(mx + mW * dir, my + (l + 1) * mH);
                c.lineTo(mx,            my + (l + 1) * mH);
            }
        }
        c.stroke();
    }

    return oc;
}

// ─────────────────────────────────────────────────────────
//  CAPTURABLE NODE DRAWING
//  Call from floor tile draw pass when tile.nodeType is set.
// ─────────────────────────────────────────────────────────
function drawCapturableNode(tile, px, py) {
    const captured = tile.captured;
    const progress = tile.captureProgress || 0;
    const cx = px, cy = py + TILE_H;

    if (tile.nodeType === 'capacitor_node') {
        // Glowing orange cylindrical capacitor cap — cyan when captured
        const col = captured ? '#00ccff' : '#ff8800';
        const darkCol = captured ? '#003355' : '#221100';
        ctx.save();
        ctx.shadowColor = col;
        ctx.shadowBlur = captured ? 18 : 12;

        // Body cylinder
        ctx.fillStyle = darkCol;
        ctx.fillRect(cx - 7, cy - 28, 14, 20);

        // Lead stripes
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.4;
        ctx.fillRect(cx - 7, cy - 24, 14, 3);
        ctx.fillRect(cx - 7, cy - 18, 14, 3);
        ctx.globalAlpha = 1;

        // Top cap (ellipse)
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 28, 8, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Bottom ring
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 8, 8, 3.5, 0, 0, Math.PI * 2);
        ctx.stroke();

        // Glow pulse ring
        const _pulse = 0.5 + 0.5 * Math.sin(frame * 0.1 + tile.x * 0.7);
        ctx.globalAlpha = 0.2 + _pulse * 0.25;
        ctx.strokeStyle = col;
        ctx.lineWidth = 2 + _pulse * 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 8, 14 + _pulse * 4, 6 + _pulse * 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Capture progress bar
        if (!captured && progress > 0) {
            ctx.fillStyle = '#000'; ctx.fillRect(cx - 12, cy - 40, 24, 4);
            ctx.fillStyle = '#0df'; ctx.fillRect(cx - 12, cy - 40, Math.round(24 * (progress / 100)), 4);
        }
        // "CAPTURED" label
        if (captured) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
            ctx.fillStyle = '#00ccff';
            ctx.fillText('◈ NODE', cx, cy - 42);
        }

        ctx.shadowBlur = 0;
        ctx.restore();

    } else if (tile.nodeType === 'signal_tower') {
        // Tall antenna with pulsing ring — red (enemy) or cyan (captured)
        const col = captured ? '#00ccff' : '#cc2222';
        const _pulse = 0.5 + 0.5 * Math.sin(frame * 0.07 + tile.x * 0.5);
        ctx.save();
        ctx.shadowColor = col;
        ctx.shadowBlur = 10 + _pulse * 8;

        // Base platform
        ctx.fillStyle = captured ? '#002233' : '#1a0000';
        ctx.beginPath();
        ctx.ellipse(cx, cy - 4, 12, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tower pole
        ctx.strokeStyle = captured ? '#336677' : '#441111';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy - 55); ctx.stroke();

        // Diagonal antenna arms
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5;
        [[-14, -20], [-9, -35], [9, -35], [14, -20]].forEach(([dx, dy]) => {
            ctx.beginPath();
            ctx.moveTo(cx, cy + dy * 0.5 - 30);
            ctx.lineTo(cx + dx, cy + dy - 10);
            ctx.stroke();
        });

        // Beacon tip
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.7 + _pulse * 0.3;
        ctx.beginPath(); ctx.arc(cx, cy - 55, 4, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

        // Pulsing ground ring
        ctx.globalAlpha = 0.25 + _pulse * 0.35;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.5 + _pulse * 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy - 4, 20 + _pulse * 10, 8 + _pulse * 4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Capture progress bar
        if (!captured && progress > 0) {
            ctx.fillStyle = '#000'; ctx.fillRect(cx - 12, cy - 68, 24, 4);
            ctx.fillStyle = '#0df'; ctx.fillRect(cx - 12, cy - 68, Math.round(24 * (progress / 100)), 4);
        }
        // "CAPTURED" label
        if (captured) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
            ctx.fillStyle = '#00ccff';
            ctx.fillText('◈ TOWER', cx, cy - 72);
        }

        ctx.shadowBlur = 0;
        ctx.restore();

    } else if (tile.nodeType === 'wall_panel') {
        // Wall-mounted control terminal.
        // Decoy status is hidden until activated.
        const activated = tile.panelActivated;
        const flicker = tile.panelFlicker || 0;
        const _blink = Math.sin(frame * 0.12 + flicker);
        const ledCol = activated ? '#444' : (_blink > 0.6 ? '#00ff88' : '#00cc66');
        const screenCol = activated ? '#111' : '#001a0a';
        const rimCol = activated ? '#333' : '#0f8';

        ctx.save();
        ctx.shadowColor = activated ? 'transparent' : '#00ff88';
        ctx.shadowBlur = activated ? 0 : 8 + _blink * 5;

        // Panel body (flat-panel against back wall)
        ctx.fillStyle = activated ? '#1a1a1a' : '#0a1a10';
        ctx.fillRect(cx - 10, cy - 32, 20, 18);

        // Rim highlight
        ctx.strokeStyle = rimCol;
        ctx.lineWidth = 1;
        ctx.strokeRect(cx - 10, cy - 32, 20, 18);

        // Screen area
        ctx.fillStyle = screenCol;
        ctx.fillRect(cx - 8, cy - 30, 16, 10);

        if (!activated) {
            // Scrolling scan-line effect on screen
            const lineY = cy - 30 + ((frame * 0.6 + flicker * 5) % 10);
            ctx.globalAlpha = 0.35;
            ctx.fillStyle = '#00ff88';
            ctx.fillRect(cx - 8, lineY, 16, 1);
            ctx.globalAlpha = 1;

            // Blinking LED indicator (top-right corner of panel)
            ctx.fillStyle = ledCol;
            ctx.beginPath();
            ctx.arc(cx + 7, cy - 29, 2, 0, Math.PI * 2);
            ctx.fill();

            // Proximity hint — glow ring when player is within 2 tiles
            const pDist = Math.hypot(player.x - tile.x, player.y - tile.y);
            const siphonProg = tile.siphonProgress || 0;
            if (pDist < 2.0) {
                const hint = 0.4 + 0.4 * Math.sin(frame * 0.2);
                ctx.globalAlpha = hint;
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(cx, cy - 23, 14, 6, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
                // "PANEL" label or siphon progress bar
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                if (siphonProg > 0) {
                    // Progress bar while siphoning
                    const barW = 20, barH = 3;
                    const fill = Math.min(1, siphonProg / 150) * barW;
                    ctx.fillStyle = '#111';
                    ctx.fillRect(cx - barW / 2, cy - 41, barW, barH);
                    ctx.fillStyle = '#00ff88';
                    ctx.fillRect(cx - barW / 2, cy - 41, fill, barH);
                    ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
                    ctx.fillStyle = '#00ff88';
                    ctx.fillText('SIPHON', cx, cy - 44);
                } else {
                    ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
                    ctx.fillStyle = '#00ff88';
                    ctx.fillText('PANEL', cx, cy - 38);
                }
            }
        } else {
            // Activated — dim "DONE" marker
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.font = '7px monospace'; ctx.textAlign = 'center';
            ctx.fillStyle = '#334433';
            ctx.fillText('USED', cx, cy - 38);
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }
}

function drawCircuitLayer() {
    if (!_circuitOffscreen || _circuitSize.w !== canvas.width || _circuitSize.h !== canvas.height) {
        _circuitOffscreen = _buildCircuit(canvas.width, canvas.height);
        _circuitSize.w    = canvas.width;
        _circuitSize.h    = canvas.height;
    }
    ctx.save();
    ctx.globalAlpha = 0.058;
    ctx.drawImage(_circuitOffscreen, 0, 0);
    ctx.restore();
}
