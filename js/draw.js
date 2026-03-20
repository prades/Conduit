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

    // ── DOWN = POSITION — hidden in build mode ─────────────
    if (!buildMode) {
        const dHov=dist>RADIAL_RADIUS*0.25&&angle>Math.PI/4&&angle<3*Math.PI/4;
        drawRadialButton(commandX, commandY+RADIAL_RADIUS, "POSITION", dHov);
        if (dHov) selectedRadialAction="position";
    }

    // ── RIGHT = INFO (normal) / TRAP (build mode on empty tile) ──
    if (!isPylonTarget && !buildMode) {
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
    const isRedTeam = (actor.team !== "green" && !actor.isClone);
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
            drawCtx.strokeStyle=isRedTeam?"#331111":"#111"; drawCtx.lineWidth=2;
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
            drawCtx.strokeStyle=isRedTeam?"#550011":"#1a1a1a"; drawCtx.lineWidth=1.2;
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
            const armCol = isRedTeam ? "#441111" : "#1a3322";
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

    // Draw segments front-to-back then abdomen on top: thorax→head→abdomen
    for (let i=0;i<segments.length;i++) {
        const seg=segments[i];
        drawCtx.save(); drawCtx.translate(seg.cx,seg.cy); drawCtx.rotate(seg.rotation);
        // Red team: black body
        const baseCol = isRedTeam ? "#111" : actor.color;
        drawCtx.fillStyle = baseCol;
        const cr = actor.segmentCornerRadius !== undefined ? actor.segmentCornerRadius : 6;
        // Spider abdomen — draw as a protruding globe (ellipse) instead of roundRect
        const isAbdomen = i >= 2; // segments 0=thorax, 1=head, 2+=abdomen
        if (actor.body.abdomen.round && isAbdomen) {
            const rx = seg.width * 0.52;
            const ry = seg.length * 0.58;
            drawCtx.beginPath();
            drawCtx.ellipse(0, 0, rx, ry, 0, 0, Math.PI*2);
            drawCtx.fill();
            // Specular highlight — top-left dome shine
            const shimCol = isRedTeam ? "rgba(200,40,60,0.3)" : "rgba(180,180,220,0.3)";
            drawCtx.fillStyle = shimCol;
            drawCtx.beginPath();
            drawCtx.ellipse(-rx*0.22, -ry*0.22, rx*0.35, ry*0.3, -0.4, 0, Math.PI*2);
            drawCtx.fill();
        } else {
            drawCtx.beginPath(); drawCtx.roundRect(-seg.width*0.5,-seg.length*0.5,seg.width,seg.length,cr); drawCtx.fill();
        }
        // Red team accent stripe on each segment
        if (isRedTeam) {
            drawCtx.fillStyle = "#cc1111";
            const sw = seg.width*0.25, sh = seg.length*0.18;
            // Center stripe
            drawCtx.fillRect(-sw*0.5, -seg.length*0.25, sw, sh);
            // Two side dots
            drawCtx.beginPath(); drawCtx.arc(-seg.width*0.28, 0, seg.width*0.07, 0, Math.PI*2); drawCtx.fill();
            drawCtx.beginPath(); drawCtx.arc( seg.width*0.28, 0, seg.width*0.07, 0, Math.PI*2); drawCtx.fill();
        }
        drawCtx.restore();
    }
    _drawLegsPass(false); // near legs drawn over body
    // Stinger tail for scorpions
    if (isRedTeam && actor.hasStinger && segments.length > 2) {
        const tail = segments[segments.length-1];
        const tailAngle = angle + Math.PI + Math.sin(frame*0.05)*0.3;
        const stingLen = 14;
        const sx = tail.cx - dirX*tail.length*0.5;
        const sy = tail.cy - dirY*tail.length*0.5;
        drawCtx.save();
        drawCtx.strokeStyle="#cc1111"; drawCtx.lineWidth=3; drawCtx.lineCap="round";
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

    // Mandibles — fixed diagonal inward V-shape, each side gyrates independently like chomping incisors
    const mandData=actor.appendages.mandibles;
    if (mandData&&mandData.enabled) {
        const headSeg=segments[1];
        const ha=actor.headAngle;
        const fwdX=Math.cos(ha), fwdY=Math.sin(ha);
        const sideX=-fwdY, sideY=fwdX;
        const baseX=headSeg.cx+fwdX*5, baseY=headSeg.cy+fwdY*5;

        // Each mandible gyrates on its own phase — offset by PI so they alternate
        const chompSpeed = actor.state==="attack" ? 0.35 : 0.10;
        const leftGyrate  = Math.sin((actor.walkCycle||0) * chompSpeed) * 0.4;
        const rightGyrate = Math.sin((actor.walkCycle||0) * chompSpeed + Math.PI) * 0.4;

        const mandCol = isRedTeam ? "#550000" : "#1a1a1a";
        drawCtx.save();
        drawCtx.strokeStyle = mandCol;
        drawCtx.lineWidth = mandData.thickness;
        drawCtx.lineCap = "round";

        [-1, 1].forEach((side, si) => {
            const gyrate = side === -1 ? leftGyrate : rightGyrate;
            // Base attachment — spread outward from head center
            const bx = baseX + sideX * side * 3.5;
            const by = baseY + sideY * side * 3.5;

            // Fixed diagonal inward angle — points toward center-forward like a V
            // Base angle: 35° inward from forward axis, then gyrate on top
            const diagAngle = ha + side * (-0.6) + gyrate;
            const tipX = bx + Math.cos(diagAngle) * mandData.length;
            const tipY = by + Math.sin(diagAngle) * mandData.length;

            // Elbow joint — mandible has two segments for incisor look
            const elbowX = bx + Math.cos(diagAngle) * mandData.length * 0.55;
            const elbowY = by + Math.sin(diagAngle) * mandData.length * 0.55;
            // Second segment angles further inward
            const seg2Angle = diagAngle - side * 0.45;
            const tip2X = elbowX + Math.cos(seg2Angle) * mandData.length * 0.5;
            const tip2Y = elbowY + Math.sin(seg2Angle) * mandData.length * 0.5;

            drawCtx.beginPath();
            drawCtx.moveTo(bx, by);
            drawCtx.lineTo(elbowX, elbowY);
            drawCtx.stroke();
            drawCtx.beginPath();
            drawCtx.moveTo(elbowX, elbowY);
            drawCtx.lineTo(tip2X, tip2Y);
            drawCtx.stroke();

            // Sharp tip dot
            drawCtx.fillStyle = mandCol;
            drawCtx.beginPath();
            drawCtx.arc(tip2X, tip2Y, mandData.thickness * 0.6, 0, Math.PI*2);
            drawCtx.fill();
        });

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
        const fangCol = isRedTeam ? "#880011" : "#1a0a00";
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
            drawCtx.fillStyle = isRedTeam ? "#cc1122" : "#333";
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
        drawCtx.strokeStyle=isRedTeam?"#550011":"#333"; drawCtx.lineWidth=pedData.thickness; drawCtx.lineCap="round";
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
            drawCtx.fillStyle=isRedTeam?"#330011":"#444";
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
        drawCtx.fillStyle = isRedTeam ? "#330011" : "#2a2a2a";
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
                    if (eyeGlow > 0) { drawCtx.shadowColor=isRedTeam?"#ff2244":"#ffffff"; drawCtx.shadowBlur=eyeSize*eyeGlow*3; }
                    drawCtx.fillStyle = isRedTeam ? "#ff2244" : "#eeeeff";
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
            const shellBaseColor = isRedTeam ? "#1a0000" : "#1a1a2e";
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
            const ridgeColor = isRedTeam ? "#330000" : "#2a2a4a";
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
            const shineCol = isRedTeam ? "rgba(180,30,30,0.35)" : "rgba(100,120,200,0.35)";
            drawCtx.strokeStyle = shineCol;
            drawCtx.lineWidth = 3;
            drawCtx.lineCap = "round";
            drawCtx.beginPath();
            drawCtx.moveTo(shineX, shineY);
            drawCtx.lineTo(shine2X, shine2Y);
            drawCtx.stroke();
        });

        // Center seam line
        drawCtx.strokeStyle = isRedTeam ? "#440000" : "#0a0a1a";
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
    drawHealthBar(px-18, py-85, 36, 5, actor.health, actor.maxHealth, drawCtx);
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
        if (t===3&&latchedPillar&&latchedPillar.health>0) {
            const tx=(latchedPillar.x-player.visualX-(latchedPillar.y-player.visualY))*TILE_W+canvas.width/2;
            const ty=(latchedPillar.x-player.visualX+(latchedPillar.y-player.visualY))*TILE_H+canvas.height/2-85;
            ctx.save(); ctx.setTransform(1,0,0,1,0,0);
            ctx.beginPath(); ctx.moveTo(p.x+sock.x,p.y+bob-45+sock.y); ctx.quadraticCurveTo(p.x+sock.x,p.y+bob+5,tx,ty);
            ctx.strokeStyle="#050505"; ctx.lineWidth=7; ctx.stroke();
            ctx.strokeStyle="#0f8"; ctx.lineWidth=2; ctx.setLineDash([4,12]); ctx.lineDashOffset=-frame*3; ctx.stroke();
            ctx.restore();
        } else {
            ctx.beginPath(); ctx.moveTo(sock.x,sock.y);
            for (let i=0;i<50;i+=10) ctx.lineTo(sock.x+Math.sin(frame*0.06+t)*5, sock.y+i);
            ctx.stroke();
        }
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
