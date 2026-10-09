// ─────────────────────────────────────────────────────────
//  DRAWING HELPERS
// ─────────────────────────────────────────────────────────
// `ally` switches the bar to a GREEN ramp instead of the green/yellow/red one.
//
// On the ordinary ramp the colour means HEALTH, which is the same information
// the length already carries — and it means a clone at half health is yellow,
// exactly like the enemy next to it. On the ally ramp the colour means WHOSE
// IT IS and the length still means health, so a clone reads as yours across
// the room at any health.
function drawHealthBar(x, y, width, height, health, maxHealth, drawCtx=ctx, ally=false) {
    if (typeof health!=="number"||typeof maxHealth!=="number"||maxHealth<=0) return;
    const pct=Math.max(0,Math.min(1,health/maxHealth));
    const col = ally ? (pct>0.6?"#22ff88":pct>0.3?"#18c46a":"#0f7a44")
                     : (pct>0.6?"#0f8":pct>0.3?"#ff0":"#f22");
    drawCtx.fillStyle="#000"; drawCtx.fillRect(x,y,width,height);
    drawCtx.fillStyle=col;    drawCtx.fillRect(x+1,y+1,(width-2)*pct,height-2);
    if (ally) {
        // A thin green outline, so the bar itself is the marker rather than
        // relying on the bracket drawn separately around it.
        drawCtx.strokeStyle="#22ff88"; drawCtx.lineWidth=1;
        drawCtx.strokeRect(x+0.5,y+0.5,width-1,height-1);
    }
}

function drawRadialButton(x, y, label, active) {
    ctx.fillStyle=active?"#0f8":"#055";
    ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=active?"#fff":"#0f8";
    ctx.font="12px monospace"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    ctx.shadowColor="#000"; ctx.shadowBlur=0;
    ctx.fillText(label,x,y-14);
    ctx.shadowBlur=0;
}

function drawRadialMenu() {
    if (!commandMode) return;
    selectedRadialAction=null;
    const dist=Math.hypot(dragDX,dragDY), angle=Math.atan2(dragDY,dragDX);
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    ctx.strokeStyle="#0f8"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(commandX,commandY,RADIAL_RADIUS,0,Math.PI*2); ctx.stroke();

    // ── ENEMY TARGET — combat menu instead of the build/position one ──
    // This is the only way to arm the weapon, so firing can never be triggered
    // by an ordinary tap.
    if (commandEnemyTarget && !commandEnemyTarget.dead) {
        const eUp = dist>RADIAL_RADIUS*0.25&&angle<-Math.PI/4&&angle>-3*Math.PI/4;
        drawRadialButton(commandX, commandY-RADIAL_RADIUS,
                         playerAttackMode ? "STOW" : "ATTACK", eUp);
        if (eUp) selectedRadialAction = playerAttackMode ? "stow_weapon" : "attack_mode";
        const eRight = dist>RADIAL_RADIUS*0.25&&angle>-Math.PI/4&&angle<Math.PI/4;
        drawRadialButton(commandX+RADIAL_RADIUS, commandY, "INFO", eRight);
        if (eRight) selectedRadialAction = "info";
        // Ammo readout under the ring, so the cost of arming is visible here.
        ctx.fillStyle = playerAmmo > 0 ? "#fa6" : "#f55";
        ctx.font = "10px monospace"; ctx.textAlign = "center";
        ctx.fillText("AMMO " + playerAmmo, commandX, commandY + RADIAL_RADIUS + 18);
        ctx.restore();
        return;
    }

    // ── OWN FOLLOWER — duty assignment ──
    // Fighters hold the line; workers run the charged-mass chain. Only ELECTRIC
    // and CORE can work, so the button says so rather than silently refusing.
    if (commandFollowerTarget && !commandFollowerTarget.dead) {
        const f = commandFollowerTarget;
        const eligible = typeof canWorkMass === "function" && canWorkMass(f);
        const isWorker = f.duty === "worker";
        const fUp = dist>RADIAL_RADIUS*0.25&&angle<-Math.PI/4&&angle>-3*Math.PI/4;
        // A frozen block says THAW rather than TO LINE. It is the same
        // instruction — coming off the crew melts it — but "TO LINE" on a
        // block reads as an order it cannot follow.
        drawRadialButton(commandX, commandY-RADIAL_RADIUS,
                         !eligible ? "FIGHTER"
                                   : (f.iceBlock ? "THAW" : (isWorker ? "TO LINE" : "TO WORK")), fUp);
        if (fUp && eligible) selectedRadialAction = "toggle_duty";
        const fRight = dist>RADIAL_RADIUS*0.25&&angle>-Math.PI/4&&angle<Math.PI/4;
        drawRadialButton(commandX+RADIAL_RADIUS, commandY, "INFO", fRight);
        if (fRight) selectedRadialAction = "info";
        if (typeof canRerollFollower === "function" && canRerollFollower(f)) {
            const fLeft = dist>RADIAL_RADIUS*0.25&&Math.abs(angle)>Math.PI*3/4;
            drawRadialButton(commandX-RADIAL_RADIUS, commandY, "RE-ROLL", fLeft);
            if (fLeft) selectedRadialAction = "reroll_follower";
        }
        ctx.fillStyle = isWorker ? "#0ca" : "#0f8";
        ctx.font = "10px monospace"; ctx.textAlign = "center";
        const jobLabel = (typeof workerJobLabel === "function" && workerJobLabel(f.element)) || "NO JOB";
        ctx.fillText((f.element||"?").toUpperCase() + " \u00b7 " +
                     (f.iceBlock ? "FROZEN BLOCK"
                                 : (isWorker ? "WORKER: " + jobLabel : "FIGHTER")),
                     commandX, commandY + RADIAL_RADIUS + 18);
        ctx.restore();
        return;
    }

    const isPylonTarget   = commandTarget&&commandTarget.pillar&&!commandTarget.destroyed&&commandTarget.health>0;

    // ── TOP = UPGRADE (pylon) / BUILD (empty tile) — only when buildMode ON ──
    const showTopBtn = buildMode;
    const tHov = showTopBtn && dist>RADIAL_RADIUS*0.25&&angle<-Math.PI/4&&angle>-3*Math.PI/4;
    if (showTopBtn) {
        // An enemy pylon is not yours to upgrade — the left button offers
        // RECLAIM instead, and that is the only way back. Saying "NOT YOURS"
        // rather than drawing UPGRADE means the option is never presented as
        // available in the first place.
        const canUp = !isPylonTarget
                      || (typeof canUpgradePylon === "function" && canUpgradePylon(commandTarget));
        drawRadialButton(commandX, commandY-RADIAL_RADIUS,
                         !canUp ? "NOT YOURS" : (isPylonTarget?"UPGRADE":"BUILD"), tHov);
        if (tHov && canUp) selectedRadialAction="build_upgrade";
    }

    // ── TOP (build mode OFF) = OVERCHARGE on a nest you hold ──
    // The slot BUILD/UPGRADE uses in build mode; on a power source outside it
    // the top of the ring spends 40% of the grid on an 8 s surge
    // (overchargeNest in power.js). Says why when it cannot.
    if (!buildMode && !isPylonTarget && commandNestTarget && typeof nestIsPowerSource === "function" && nestIsPowerSource(commandNestTarget)) {
        const ocHov = dist>RADIAL_RADIUS*0.25&&angle<-Math.PI/4&&angle>-3*Math.PI/4;
        const why = overchargeBlocker(commandNestTarget);
        drawRadialButton(commandX, commandY-RADIAL_RADIUS, why ? why : "\u26a1 OVERCHARGE", ocHov && !why);
        if (ocHov) selectedRadialAction = "overcharge";
    }

    // ── DOWN (build mode) = DESTROY one of your own pylons, for shards back ──
    if (buildMode && isPylonTarget && typeof canDemolishPylon === "function" && canDemolishPylon(commandTarget)) {
        const xHov = dist>RADIAL_RADIUS*0.25&&angle>Math.PI/4&&angle<3*Math.PI/4;
        drawRadialButton(commandX, commandY+RADIAL_RADIUS, "DESTROY +" + DEMOLISH_REFUND + "\u25c6", xHov);
        if (xHov) selectedRadialAction = "demolish";
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

    // ── RIGHT = INFO ──
    // In build mode on an empty tile this used to be TRAP. Placeable traps are
    // gone, and the hit test in input.js mirrors this: one label, both modes.
    {
        const rHov=dist>RADIAL_RADIUS*0.25&&angle>-Math.PI/4&&angle<Math.PI/4;
        drawRadialButton(commandX+RADIAL_RADIUS, commandY, "INFO", rHov);
        if (rHov) selectedRadialAction="info";
    }

    // ── LEFT = SWITCH / RECLAIM / CIRCUIT (context) ───────
    const lHov=dist>RADIAL_RADIUS*0.25&&Math.abs(angle)>Math.PI*3/4;
    let leftLabel="SWITCH", leftAction="switch_context";
    const isPylonSwitchable = isPylonTarget && (commandTarget.attackMode || commandTarget.waveMode);
    // An enemy pylon takes priority: RECLAIM is the only answer to a converted
    // one, and it is what kills the cocoon anchored to it.
    const isEnemyPylon = commandTarget && commandTarget.pillar && !commandTarget.destroyed
                         && commandTarget.health > 0 && commandTarget.pillarTeam === "red";
    const isMyConnector = isPylonTarget && isSwitchableRelay(commandTarget) && commandTarget.pillarTeam === "green";
    if (isEnemyPylon) { leftLabel="RECLAIM"; leftAction="reconstruct"; }
    // A connector has no attack/wave mode to switch — its left button is the
    // circuit, and says what pressing it will DO.
    else if (isMyConnector) {
        // A generator is turned on and off; a connector has a circuit to open and close.
        const _gen = isGeneratorPylon(commandTarget), _off = commandTarget.circuitOn === false;
        leftLabel = _gen ? (_off ? "TURN ON" : "TURN OFF") : (_off ? "CLOSE CIRCUIT" : "OPEN CIRCUIT");
        leftAction = "toggle_circuit";
    }
    // A live nest has no order: you HACK it by standing in front of it. A nest
    // you hold links itself to nearby relays (autoLinkRelays). Out of build
    // mode its left button TELEPORTS you to your front nest (or home from the
    // front one — teleportToNest in commands.js); in build mode it switches
    // the nest's power off and on (toggleNestPower in power.js).
    else if (!isPylonTarget && commandNestTarget && nestIsPowerSource(commandNestTarget)) {
        if (buildMode) { leftLabel = commandNestTarget.powerOff ? "NEST ON" : "NEST OFF"; leftAction = "toggle_nest"; }
        else {
            leftLabel = teleportLabel(commandNestTarget);
            leftAction = teleportDestination(commandNestTarget) ? "teleport" : null;
        }
    }
    // Your own attack turret or wave pylon: CONVERT opens a picker offering
    // the other kind (commands.js convert_pylon). The element is kept.
    else if (isPylonSwitchable && commandTarget.pillarTeam === "green" && !isRelayPylon(commandTarget)) {
        leftLabel = "CONVERT"; leftAction = "convert_pylon";
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
    if (actor.iceBlock) {
        _drawIceBlock(actor, px, py, drawCtx);
    } else if (actor instanceof Predator) {
        _drawPredator(actor, px, py, drawCtx);
        // BLIND (STEAM / CRYO-ARC combos): a grey haze swirling over its head.
        if (actor.blinded > 0) {
            const t = (frame || 0) * 0.15;
            drawCtx.save(); drawCtx.globalAlpha = 0.55; drawCtx.strokeStyle = "#cfd6dd"; drawCtx.lineWidth = 1.5;
            for (let i = 0; i < 3; i++) {
                drawCtx.beginPath();
                drawCtx.arc(px + Math.cos(t + i * 2.1) * 6, py - 48 + Math.sin(t + i * 2.1) * 2, 3.5, 0, Math.PI * 1.4);
                drawCtx.stroke();
            }
            drawCtx.restore();
        }
    } else {
        _drawVirus(actor, px, py, drawCtx);
    }
}

// A follower that has set itself. Drawn as an isometric cube sitting on the
// tile rather than as a unit, because that is what it now is — the shape has
// to say "you cannot walk here" at a glance.
//
// The top face is the tile diamond; the two side faces drop from its left and
// right corners. While it is still forming, the whole thing rises out of the
// floor, so freezing reads as the block growing rather than popping in.
function _drawIceBlock(actor, px, py, drawCtx) {
    const form = 1 - Math.max(0, Math.min(1, (actor.iceFormFrames || 0) / ICE_FORM_FRAMES));
    const hw = TILE_W * 0.5, hh = TILE_H * 0.5;
    // A CUBE, not a column. One tile edge measures sqrt(hw² + hh²) ≈ 33.5px on
    // screen, so a vertical edge of about TILE_H * 1.15 gives equal edges and
    // the block reads as one tile in every direction. The first attempt used
    // TILE_H * 1.9 and rendered a pillar — obvious the moment it was drawn next
    // to its own tile outline, and not before.
    const H  = TILE_H * ICE_BLOCK_H_MULT * (0.18 + 0.82 * form);   // block height, screen px
    // The tile's visual centre sits a tile-height below the projected point.
    const cy = py + TILE_H;
    const topY = cy - H;

    drawCtx.save();
    // ── Side faces ──
    // Left face is darker than right, so the cube reads as lit from one side.
    drawCtx.beginPath();
    drawCtx.moveTo(px - hw, cy);
    drawCtx.lineTo(px,      cy + hh);
    drawCtx.lineTo(px,      cy + hh - H);
    drawCtx.lineTo(px - hw, cy - H);
    drawCtx.closePath();
    drawCtx.fillStyle = "rgba(60,120,165,0.88)";
    drawCtx.fill();

    drawCtx.beginPath();
    drawCtx.moveTo(px + hw, cy);
    drawCtx.lineTo(px,      cy + hh);
    drawCtx.lineTo(px,      cy + hh - H);
    drawCtx.lineTo(px + hw, cy - H);
    drawCtx.closePath();
    drawCtx.fillStyle = "rgba(95,165,205,0.88)";
    drawCtx.fill();

    // ── Top face ──
    drawCtx.beginPath();
    drawCtx.moveTo(px,      topY - hh);
    drawCtx.lineTo(px + hw, topY);
    drawCtx.lineTo(px,      topY + hh);
    drawCtx.lineTo(px - hw, topY);
    drawCtx.closePath();
    drawCtx.fillStyle = "rgba(190,235,255,0.92)";
    drawCtx.fill();
    drawCtx.strokeStyle = ICE_COLOUR;
    drawCtx.lineWidth = 1.4;
    drawCtx.stroke();

    // ── Fracture lines ──
    // Seeded off the block's tile so a given block's cracks never crawl.
    const seed = (actor.iceBlockX || 0) * 31 + (actor.iceBlockY || 0) * 7;
    drawCtx.strokeStyle = "rgba(235,250,255,0.5)";
    drawCtx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        const t = ((seed + i * 41) % 17) / 17;
        const x0 = px - hw * 0.6 + hw * 1.2 * t;
        drawCtx.beginPath();
        drawCtx.moveTo(x0, cy + hh * 0.3 - H * 0.1);
        drawCtx.lineTo(x0 + (i % 2 ? 5 : -5), cy - H * 0.75);
        drawCtx.stroke();
    }
    drawCtx.restore();
}

function _drawPredator(actor, px, py, drawCtx) {
    if (actor.isGrub && typeof drawGrub === "function") { drawGrub(actor, px, py, drawCtx); return; }
    if (actor.isMachine && typeof drawMachine === "function") { drawMachine(actor, px, py, drawCtx); return; }
    // UNDERGROUND (the tyrant's burrow): only a moving mound of dirt shows.
    if (actor.untargetable && actor._burrow) {
        const w = 26 + Math.sin((frame || 0) * 0.4) * 3;
        drawCtx.save(); drawCtx.fillStyle = "#5a4326";
        drawCtx.beginPath(); drawCtx.ellipse(px, py + TILE_H * 0.2, w, w * 0.4, 0, Math.PI, 0); drawCtx.fill();
        drawCtx.fillStyle = "#7a5c36";
        for (let i = 0; i < 4; i++) { drawCtx.beginPath(); drawCtx.arc(px + Math.cos(frame * 0.2 + i * 1.6) * w * 0.8, py + TILE_H * 0.2 - 6 - Math.abs(Math.sin(frame * 0.2 + i)) * 8, 2.5, 0, Math.PI * 2); drawCtx.fill(); }
        drawCtx.restore();
        return;
    }
    if (actor.isBrood && typeof drawBroodLabel === "function") drawBroodLabel(actor, px, py, drawCtx);
    const dim=actor.dimensions;
    // leapLift is screen-space height during a scout's arc jump, so the whole
    // creature — body and legs — rises off the floor together.
    let bodyBaseY=py-(dim.height*2) - (actor.heightBoost ? dim.height*(actor.heightBoost-1) : 0) - (actor.leapLift || 0);
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

    // ── Moth wings — compound rounded-triangular, drawn behind body ──────────
    if (actor.isMoth && segments[0]) {
        const th  = segments[0];
        const wc  = actor.walkCycle || 0;
        // Flap: wing tips oscillate up/down on screen
        const flapLift = Math.sin(wc * 0.12) * dim.height * 0.60;
        const spread   = dim.width  * 1.70;  // lateral reach from body
        const chord    = dim.height * 1.60;  // fore-aft wing depth (tall enough for full moth wing)
        drawCtx.save();
        [-1, 1].forEach(side => {
            // ForEwing tip — outer tip of the larger upper wing triangle
            const fwX = th.cx + perpX * side * spread;
            const fwY = th.cy + perpY * side * spread - flapLift;
            // HindWing tip — slightly inward and aft, smaller lower triangle
            const hwX = th.cx + perpX * side * spread * 0.62 - dirX * chord * 0.90;
            const hwY = th.cy + perpY * side * spread * 0.62 - dirY * chord * 0.90 - flapLift * 0.52;
            // Shared trailing attachment point along the body rear
            const trX = th.cx - dirX * chord * 1.10;
            const trY = th.cy - dirY * chord * 1.10;

            // ── ForEwing (larger rounded triangle) ──────────────────────────
            drawCtx.fillStyle = "rgba(20, 14, 6, 0.90)";
            drawCtx.beginPath();
            drawCtx.moveTo(th.cx, th.cy);
            // Leading edge: gently bowed curve toward tip
            drawCtx.quadraticCurveTo(
                th.cx + perpX * side * spread * 0.52 + dirX * dim.width * 0.22,
                th.cy + perpY * side * spread * 0.52 + dirY * dim.width * 0.22 - flapLift * 0.52,
                fwX, fwY
            );
            // Trailing edge: sweep back from tip to the trailing root
            drawCtx.quadraticCurveTo(
                fwX - dirX * chord * 0.80,
                fwY - dirY * chord * 0.80,
                trX, trY
            );
            drawCtx.closePath();
            drawCtx.fill();

            // ── HindWing (smaller rounded triangle, overlaps foreWing base) ─
            drawCtx.fillStyle = "rgba(14, 9, 4, 0.82)";
            drawCtx.beginPath();
            drawCtx.moveTo(th.cx, th.cy);
            // Leading edge toward hindwing tip
            drawCtx.quadraticCurveTo(
                th.cx + perpX * side * spread * 0.38 - dirX * chord * 0.38,
                th.cy + perpY * side * spread * 0.38 - dirY * chord * 0.38 - flapLift * 0.32,
                hwX, hwY
            );
            // Trailing edge back to trailing root
            drawCtx.quadraticCurveTo(
                hwX - dirX * chord * 0.48,
                hwY - dirY * chord * 0.48,
                trX, trY
            );
            drawCtx.closePath();
            drawCtx.fill();

            // Wing vein accents
            drawCtx.strokeStyle = "rgba(48, 34, 14, 0.42)";
            drawCtx.lineWidth = 0.70;
            drawCtx.beginPath();
            drawCtx.moveTo(th.cx, th.cy);  drawCtx.lineTo(fwX, fwY);
            drawCtx.moveTo(trX, trY);       drawCtx.lineTo(hwX, hwY);
            drawCtx.stroke();
        });
        drawCtx.restore();
    }

    // Nymph: draw translucent
    if (actor.isNymph) drawCtx.globalAlpha = 0.38;
    // Elite glow ring — pulsing colored outline for randomized mutant predators
    if (actor.isElite && !actor.isNymph) {
        const eliteR = actor.dimensions.width * 0.85;
        const pulse  = 0.5 + 0.5 * Math.sin((actor.animationPhase||0) + (frame||0) * 0.07);
        drawCtx.save();
        drawCtx.globalAlpha = 0.18 + pulse * 0.20;
        drawCtx.strokeStyle = actor.color || "#ff8800";
        drawCtx.lineWidth   = 2.5;
        drawCtx.beginPath();
        drawCtx.ellipse(px, bodyBaseY, eliteR * 0.9, eliteR * 0.55, 0, 0, Math.PI*2);
        drawCtx.stroke();
        drawCtx.globalAlpha = 1;
        drawCtx.restore();
    }
    // Boss / shielded aura ring
    if ((actor.isBoss || actor.shieldAura) && (actor.team !== "green" || actor.isClone)) {
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
            } else if (sp === "moth") {
                // Moth: round compact head
                const r = Math.min(hw, ht) * 0.90;
                drawCtx.beginPath();
                drawCtx.arc(hw * 0.25, 0, r, 0, Math.PI * 2);
                drawCtx.fill();
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
                    if (eyeGlow > 0) { drawCtx.shadowColor=_isAllyEye?"#00ee88":"#aaaacc"; drawCtx.shadowBlur=0; }
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
    drawHealthBar(px-18, py-85, 36, 5, actor.health, actor.maxHealth, drawCtx, _isAllyPred);
    drawAbilityCharge(actor, px, py, drawCtx);
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

// ── THE FOLLOWER FIGURE ──────────────────────────────────
// Legs and glass body, drawn at (px, py). Lifted out of _drawVirus so the same
// code can draw straight to the screen or once into a sprite (_virusSprite).
// REPORTED: "we need a major optimization update for when there are a lot of
// followers" — each one was ~60 canvas paths a frame, redrawn from scratch.
function _drawVirusFigure(drawCtx, px, py, actor, flash, er, eg, eb, wc, opts) {
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
    const crystalPulse = opts.crystalAlpha !== undefined ? opts.crystalAlpha : 0.85 + 0.15 * Math.sin((frame||0) * 0.12 + (actor.x||0));
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

    if (opts.bubbles) _drawVirusBubbles(drawCtx, px, actor, er, eg, eb, flash, DOME_CY, DOME_R, glassBot, glassH);

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

    drawCtx.restore(); // end glass body save
}

function _drawVirusBubbles(drawCtx, px, actor, er, eg, eb, flash, DOME_CY, DOME_R, glassBot, glassH) {
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
    // No clip: the bubbles sway 1.5px and sit 3px inside the walls, and a
    // clip per follower per frame was the most expensive call in the figure.
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
}

// The sprite. Sized to hold the legs at full stride and the dome; anchored so
// (VSPR_OX, VSPR_OY) is the ground point. Drawn at 2x for crisp edges.
const VSPR_W = 84, VSPR_H = 84, VSPR_OX = 42, VSPR_OY = 66;
const VIRUS_POSES = 12;            // walk-cycle steps cached per look
const VIRUS_SPRITE_CAP = 900;      // sprites kept before the oldest are dropped
const VIRUS_BUBBLE_CROWD = 24;     // more followers on screen than this: no bubbles
let _virusSprites = new Map(), _virusesOnScreen = 0, _virusesCounting = 0, _virusCountFrame = -1;
// Only the ordinary look is cached; anything unusual is drawn live.
function _virusSpriteOk(actor) {
    return !actor.ghostphageLife && !(actor.smokeForm > 0);
}
function _virusSprite(actor, flash, er, eg, eb, wc) {
    const st = actor.isFollower ? (actor.stats || {}) : null;
    // Shape buckets: the saw teeth and knee claws grow with stats in steps
    // too small to see, so they are rounded to a visible step.
    const saw  = st ? Math.round(Math.max(0, ((st.attack || 10) - 10) * 0.35) * 2) / 2 : 0;
    const claw = st ? Math.round(Math.max(0, (Math.max(st.specialAttack || 0, st.accuracy || 0) - 10) * 0.45) * 2) / 2 : 0;
    const TAU = Math.PI * 2;
    const pose = Math.floor((((wc % TAU) + TAU) % TAU) / TAU * VIRUS_POSES) % VIRUS_POSES;
    const snap = actor.state === "attack" ? Math.round(Math.sin(actor.attackAnim || 0) * 4) : 0;
    const key = er + "," + eg + "," + eb + "|" + (flash ? 1 : 0) + "|" + saw + "|" + claw + "|" + pose + "|" + snap + "|" + (actor.isFollower ? 1 : 0) + "|" + (actor.element || "");
    let cv = _virusSprites.get(key);
    if (cv !== undefined) return cv;
    cv = null;
    const c = typeof document !== "undefined" && document.createElement ? document.createElement("canvas") : null;
    const g = c && c.getContext ? c.getContext("2d") : null;
    if (g && typeof g.drawImage === "function" && typeof g.scale === "function") {
        c.width = VSPR_W * 2; c.height = VSPR_H * 2; g.scale(2, 2);
        // A stand-in carrying exactly what the figure reads, at the bucketed values.
        const k = 1 / 0.35, kc = 1 / 0.45;
        const proxy = { isFollower: actor.isFollower, element: actor.element, x: 0, y: 0,
                        state: snap ? "attack" : "idle", attackAnim: snap ? Math.asin(Math.max(-1, Math.min(1, snap / 4))) : 0,
                        stats: st ? { attack: 10 + saw * k, specialAttack: 10 + claw * kc, accuracy: 0 } : undefined };
        _drawVirusFigure(g, VSPR_OX, VSPR_OY, proxy, flash, er, eg, eb, (pose + 0.5) / VIRUS_POSES * TAU, { bubbles: false, crystalAlpha: 0.93 });
        cv = c;
    }
    if (_virusSprites.size >= VIRUS_SPRITE_CAP) _virusSprites.delete(_virusSprites.keys().next().value);
    _virusSprites.set(key, cv);
    return cv;
}

// A shielded follower: a thin pale bubble round it, brighter for a moment when
// it is hit, and a blue bar under its health bar. Lines, not a disc.
function _drawFollowerShield(actor, px, py, drawCtx) {
    if (!(actor.shielded && actor.shieldAmount > 0)) return;
    const max = Math.max(actor._shieldMax || 0, actor.shieldAmount);
    const hit = actor._shieldHitAt !== undefined && (frame - actor._shieldHitAt) < 10;
    drawCtx.save();
    drawCtx.globalAlpha = hit ? 0.9 : 0.45; drawCtx.strokeStyle = hit ? "#ffffff" : "#9fdcff"; drawCtx.lineWidth = hit ? 2 : 1.2;
    drawCtx.beginPath(); drawCtx.ellipse(px, py - 32, 17, 22, 0, 0, Math.PI * 2); drawCtx.stroke();
    drawCtx.globalAlpha = 1;
    drawCtx.fillStyle = "#000"; drawCtx.fillRect(px - 14, py - 70, 28, 3);
    drawCtx.fillStyle = "#3af"; drawCtx.fillRect(px - 14, py - 70, Math.round(28 * Math.min(1, actor.shieldAmount / max)), 3);
    drawCtx.restore();
}

function _drawVirus(actor, px, py, drawCtx) {
    // How many were drawn last frame — the crowd test for the bubbles.
    if (_virusCountFrame !== frame) { _virusesOnScreen = _virusesCounting; _virusesCounting = 0; _virusCountFrame = frame; }
    _virusesCounting++;
    drawHealthBar(px-14, py-75, 28, 4, actor.health, actor.maxHealth, drawCtx);
    _drawFollowerShield(actor, px, py, drawCtx);

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
        drawCtx.shadowColor = "#aaffff"; drawCtx.shadowBlur = 0;
        drawCtx.strokeStyle = "#ddeeff"; drawCtx.lineWidth = 1.2;
        drawCtx.strokeRect(px-5, bodyY2+5, 10, 18);
        // Head diamond — white outline
        drawCtx.beginPath();
        drawCtx.moveTo(px, bodyY2-8); drawCtx.lineTo(px+10, bodyY2+2);
        drawCtx.lineTo(px, bodyY2+12); drawCtx.lineTo(px-10, bodyY2+2); drawCtx.closePath();
        drawCtx.strokeStyle = "#ffffff"; drawCtx.lineWidth = 1.5;
        drawCtx.stroke();
        drawCtx.shadowBlur =0;
        drawCtx.restore();
        drawHealthBar(px-14, py-75, 28, 4, actor.health, actor.maxHealth, drawCtx);
        return;
    }

    const wc = actor.walkCycle || 0;

    // ── TOXIC SMOKE FORM — make follower body transparent ────────────────────
    const _hasSmokeForm = actor.smokeForm > 0;
    if (_hasSmokeForm) {
        drawCtx.save();
        drawCtx.globalAlpha = 0.14 + 0.07 * Math.sin((frame||0) * 0.38);
    }

    const _figOpts = _virusSpriteOk(actor) ? null : { bubbles: true };
    if (_figOpts) _drawVirusFigure(drawCtx, px, py, actor, flash, er, eg, eb, wc, _figOpts);
    else {
        // THE CACHED FIGURE. Legs and glass body come off a sprite keyed by
        // element, stat-driven shape and a 12-step walk pose; only the
        // bubbles are drawn live, and not at all in a crowd.
        const spr = _virusSprite(actor, flash, er, eg, eb, wc);
        if (spr) {
            drawCtx.drawImage(spr, px - VSPR_OX, py - VSPR_OY, VSPR_W, VSPR_H);
            if (_virusesOnScreen <= VIRUS_BUBBLE_CROWD)
                _drawVirusBubbles(drawCtx, px, actor, er, eg, eb, flash, py - 28 - 2 - 17, 10, py - 28, (py - 28) - (py - 28 - 2 - 17));
        } else _drawVirusFigure(drawCtx, px, py, actor, flash, er, eg, eb, wc, { bubbles: true });
    }
    // Outside the figure: the attack effects below are placed on its body.
    const DOME_R = 10, BASE_Y = py - 28, DOME_CY = BASE_Y - 2 - 17, glassBot = BASE_Y;

    // ── TOXIC TRANSPARENCY WRAPPER — end ─────────────────────────────────────
    if (_hasSmokeForm) drawCtx.restore();

    // ─────────────────────────────────────────────────────────────────────────
    //  PHYSICAL ATTACK VISUAL EFFECTS  (drawn at full alpha, on top of body)
    // ─────────────────────────────────────────────────────────────────────────
    // No shadowBlur in these: a gaussian blur per attacking follower per
    // frame was the cost that grew with the size of the squad. Their gradients
    // and strokes carry the glow on their own.
    const _attBodyY = (DOME_CY + glassBot) * 0.5; // vertical centre of entire glass body

    // ── FLUX — OPAQUE ELEMENT-COLOR AURA ────────────────────────────────────
    if (actor.fluxAura > 0) {
        const _fa  = Math.min(1, actor.fluxAura / 10) * 0.88;
        const _aR  = DOME_R * 2.6;
        drawCtx.save();
        drawCtx.globalAlpha = _fa;
        const _fxGrad = drawCtx.createRadialGradient(px, _attBodyY, 2, px, _attBodyY, _aR);
        _fxGrad.addColorStop(0,    `rgba(${er},${eg},${eb},0.95)`);
        _fxGrad.addColorStop(0.40, `rgba(${er},${eg},${eb},0.65)`);
        _fxGrad.addColorStop(1,    `rgba(${er},${eg},${eb},0)`);
        drawCtx.fillStyle  = _fxGrad;
        drawCtx.beginPath();
        drawCtx.ellipse(px, _attBodyY, _aR, _aR * 1.3, 0, 0, Math.PI * 2);
        drawCtx.fill();
        drawCtx.restore();
    }

    // ── FIRE — 3 ORBITING FIREBALLS ─────────────────────────────────────────
    if (actor.fireOrbitTimer > 0) {
        const _foAlpha = Math.min(1, actor.fireOrbitTimer / 8);
        const _orbitR  = 22;
        const _oAngle  = (frame||0) * 0.09;
        drawCtx.save();
        for (let _i = 0; _i < 3; _i++) {
            const _a  = _oAngle + _i * (Math.PI * 2 / 3);
            const _fx = px          + Math.cos(_a)        * _orbitR;
            const _fy = _attBodyY   + Math.sin(_a)        * _orbitR * 0.5;
            const _fr = 4.5 + Math.sin((frame||0) * 0.22 + _i * 2.1) * 1.2;
            drawCtx.globalAlpha = _foAlpha;
            const _fbG = drawCtx.createRadialGradient(_fx, _fy, 0, _fx, _fy, _fr);
            _fbG.addColorStop(0,   "#ffffff");
            _fbG.addColorStop(0.3, "#ffdd00");
            _fbG.addColorStop(1,   "#ff2200");
            drawCtx.fillStyle = _fbG;
            drawCtx.beginPath(); drawCtx.arc(_fx, _fy, _fr, 0, Math.PI * 2); drawCtx.fill();
        }
        drawCtx.restore();
    }

    // ── ELECTRIC — SPARK RING + CHAIN ARC LIGHTNING ─────────────────────────
    if (actor.sparkSurround > 0) {
        const _sAlpha = Math.min(1, actor.sparkSurround / 5);
        drawCtx.save();
        // Radial zigzag sparks
        const _NS = 10;
        drawCtx.lineWidth = 1.5;
        for (let _si = 0; _si < _NS; _si++) {
            const _baseA = (_si / _NS) * Math.PI * 2 + (frame||0) * 0.08;
            const _jig   = Math.sin((frame||0) * 0.25 + _si * 1.3) * 0.35;
            const _r0 = 13;
            const _r1 = 20 + Math.abs(Math.sin((frame||0) * 0.18 + _si)) * 6;
            const _midA  = _baseA + _jig;
            const _sx0   = px          + Math.cos(_baseA) * _r0;
            const _sy0   = _attBodyY   + Math.sin(_baseA) * _r0 * 0.56;
            const _smx   = px          + Math.cos(_midA)  * (_r0 + _r1) * 0.5;
            const _smy   = _attBodyY   + Math.sin(_midA)  * (_r0 + _r1) * 0.5 * 0.56;
            const _sx1   = px          + Math.cos(_baseA) * _r1;
            const _sy1   = _attBodyY   + Math.sin(_baseA) * _r1 * 0.56;
            drawCtx.globalAlpha  = _sAlpha;
            drawCtx.strokeStyle  = _si % 2 === 0 ? "#ffee33" : "#ffffff";
            drawCtx.beginPath(); drawCtx.moveTo(_sx0,_sy0); drawCtx.lineTo(_smx,_smy); drawCtx.lineTo(_sx1,_sy1); drawCtx.stroke();
        }
        // Arc lightning beams to each chain target
        if (actor._electricChainTargets) {
            drawCtx.strokeStyle = "#aaffff"; drawCtx.lineWidth = 1.2;
            actor._electricChainTargets.forEach(t => {
                if (!t || t.dead) return;
                const _tx = (t.x - player.visualX - (t.y - player.visualY)) * TILE_W + canvas.width  / 2;
                const _ty = (t.x - player.visualX + (t.y - player.visualY)) * TILE_H + canvas.height / 2 - 30;
                drawCtx.globalAlpha = _sAlpha * 0.85;
                drawCtx.beginPath(); drawCtx.moveTo(px, _attBodyY);
                const _arcSegs = 5;
                for (let _s = 1; _s < _arcSegs; _s++) {
                    const _t2 = _s / _arcSegs;
                    const _jx = (Math.random() - 0.5) * 14;
                    const _jy = (Math.random() - 0.5) * 14;
                    drawCtx.lineTo(px + (_tx - px) * _t2 + _jx, _attBodyY + (_ty - _attBodyY) * _t2 + _jy);
                }
                drawCtx.lineTo(_tx, _ty); drawCtx.stroke();
            });
        }
        drawCtx.restore();
    }

    // ── ICE — GIANT ICICLES PROJECTING TOWARD TARGET ────────────────────────
    if (actor.icicleAttack && actor.icicleAttack.timer > 0) {
        const _it       = actor.icicleAttack;
        const _tpx      = (_it.tx - player.visualX - (_it.ty - player.visualY)) * TILE_W + canvas.width  / 2;
        const _tpy      = (_it.tx - player.visualX + (_it.ty - player.visualY)) * TILE_H + canvas.height / 2 - 30;
        const _ddx      = _tpx - px, _ddy = _tpy - _attBodyY;
        const _dMag     = Math.hypot(_ddx, _ddy) || 1;
        const _ux       = _ddx / _dMag, _uy = _ddy / _dMag;
        const _iProg    = 1 - _it.timer / 28;
        const _iAlpha   = Math.min(1, _it.timer / 6);
        drawCtx.save();
        drawCtx.globalAlpha = _iAlpha;
        for (let _ii = 0; _ii < 3; _ii++) {
            const _sp = (_ii - 1) * 0.28;
            const _ca = Math.cos(_sp), _sa = Math.sin(_sp);
            const _dxS = _ux * _ca - _uy * _sa;
            const _dyS = _ux * _sa + _uy * _ca;
            const _ilen  = 24 + _ii * 4 + _iProg * 14;
            const _iBase = 12 + _iProg * 16;
            const _ix0   = px          + _dxS * _iBase;
            const _iy0   = _attBodyY   + _dyS * _iBase;
            const _ix1   = px          + _dxS * (_iBase + _ilen);
            const _iy1   = _attBodyY   + _dyS * (_iBase + _ilen);
            const _pw    = 4.5 - _ii * 0.5;
            const _pxV   = -_dyS * _pw, _pyV = _dxS * _pw;
            // Icicle body
            drawCtx.beginPath();
            drawCtx.moveTo(_ix1, _iy1);
            drawCtx.lineTo(_ix0 + _pxV, _iy0 + _pyV);
            drawCtx.lineTo(_ix0 - _pxV, _iy0 - _pyV);
            drawCtx.closePath();
            drawCtx.fillStyle   = "#d6f0ff";
            drawCtx.fill();
            drawCtx.strokeStyle = "#99ddff"; drawCtx.lineWidth = 1;
            drawCtx.stroke();
            // Specular highlight along icicle
            drawCtx.strokeStyle = "rgba(255,255,255,0.6)"; drawCtx.lineWidth = 0.8;
            drawCtx.beginPath();
            drawCtx.moveTo(_ix0 + _pxV * 0.35, _iy0 + _pyV * 0.35);
            drawCtx.lineTo(_ix1 - _dxS * 3,    _iy1 - _dyS * 3);
            drawCtx.stroke();
        }
        drawCtx.restore();
    }

    // ── CORE — PULSATING RINGS EMANATING FROM THE CRYSTAL ───────────────────
    if (actor.corePulse > 0) {
        const _cpAlpha = Math.min(1, actor.corePulse / 10) * 0.75;
        drawCtx.save();
        drawCtx.strokeStyle = "#00ccaa";
        for (let _ri = 0; _ri < 3; _ri++) {
            const _phase = ((frame||0) * 0.16 + _ri * (Math.PI * 0.67)) % (Math.PI * 2);
            const _prog  = _phase / (Math.PI * 2);
            const _rR    = DOME_R * (0.65 + _prog * 2.2);
            drawCtx.lineWidth   = 2.5 - _prog * 1.8;
            drawCtx.globalAlpha = _cpAlpha * (1 - _prog) * 0.95;
            drawCtx.beginPath();
            drawCtx.arc(px, _attBodyY, _rR, 0, Math.PI * 2);
            drawCtx.stroke();
        }
        drawCtx.restore();
    }
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
// ─────────────────────────────────────────────────────────
//  THE VORTEX SWIRL
// ─────────────────────────────────────────────────────────
// Drawn as CIRCLES in whatever plane the caller has set up with a transform.
// There are two vortices in the game and they differ only by that plane:
//
//   the floor node  lies flat, squashed to TILE_H/TILE_W
//   the wall nest   stands in the wall face, which is a SHEAR — its two basis
//                   vectors are not perpendicular, so a circle on it does not
//                   map to an axis-aligned ellipse with a rotation and cannot
//                   be expressed with ctx.ellipse's rotation argument at all.
//                   It needs a real matrix.
//
// One swirl, two transforms. Writing the wall one separately would have been
// two implementations of the same thing, free to drift apart.
function drawVortexSwirl(r, colour, spin, glow, alpha) {
    const a = alpha === undefined ? 1 : alpha;
    // The throat: a hole, darkest at the centre.
    const g = ctx.createRadialGradient(0, 0, 1, 0, 0, r);
    g.addColorStop(0, 'rgba(8,3,0,0.95)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

    // Three partial rings turning at their own rates. The gap in each is what
    // makes it read as drawn inward rather than as concentric circles.
    ctx.shadowColor = colour;
    ctx.shadowBlur  = 0;
    ctx.strokeStyle = colour;
    for (let i = 0; i < 3; i++) {
        const rr = r * (1 - i * 0.28);
        const a0 = spin * (1 + i * 0.9) + i * 2.1;
        ctx.globalAlpha = (0.75 - i * 0.13) * a;
        ctx.lineWidth = 2 - i * 0.4;
        ctx.beginPath();
        ctx.arc(0, 0, rr, a0, a0 + Math.PI * 1.35);
        ctx.stroke();
    }

    // Four short spokes being pulled in, angled with the spin.
    ctx.globalAlpha = 0.35 * a;
    ctx.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
        const ang = spin * 0.6 + k * Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
        ctx.lineTo(Math.cos(ang) * r * 0.45, Math.sin(ang) * r * 0.45);
        ctx.stroke();
    }
    ctx.shadowBlur =0;
    ctx.globalAlpha = 1;
}

// The wall face's basis, per the projection: one tile along the wall moves
// (TILE_W, TILE_H) on screen, and up the wall is straight up. Normalised so a
// radius is a radius.
const WALL_AXIS_LEN = Math.hypot(TILE_W, TILE_H);
const WALL_UX = TILE_W / WALL_AXIS_LEN, WALL_UY = TILE_H / WALL_AXIS_LEN;

// The wall nest's vortex, in the WALL plane.
//
// Called from both nest states in render's sorted pass — live and collapsed —
// so the wall-face geometry is derived once here rather than recomputed at each
// site. `px, py` is the nest tile's screen anchor, at (obj.x, -1); the face it
// stands in spans four tiles from (obj.x-1, -2).
const NEST_WALL_H = 110;
function drawNestWallVortex(px, py, r, colour, spin, glow, alpha) {
    const sW1x = px, sW1y = py - 60, numT = 4;
    const blx = sW1x - TILE_W,            bly = sW1y + TILE_H;
    const brx = sW1x + (numT - 1) * TILE_W, bry = sW1y + (numT + 1) * TILE_H;
    const cx = (blx + brx) / 2, cy = (bly + bry) / 2 - NEST_WALL_H * 0.5;
    ctx.save();
    ctx.transform(WALL_UX, WALL_UY, 0, -1, cx, cy);
    drawVortexSwirl(r, colour, spin, glow, alpha);
    ctx.restore();
}

// ── THE HOME PORTAL ──────────────────────────────────────
// Zone 0's nest, which was never a nest: it spawns nothing, raises no alarm,
// and sits in the one place the player is safe while looking exactly like the
// six hives that are trying to kill them. It is the way back into the Crystal.
//
// Drawn in the same sheared wall plane as the wall-nest vortex — one tile
// along the wall moves (TILE_W, TILE_H) on screen while up the wall is (0,-1),
// and those are not perpendicular, so it needs the transform rather than a
// rotation. Green, steady and open, against the hives' orange churn.
const PORTAL_R = 30;
const PORTAL_COLOUR = "#2bff9b";

// ── CACHED LABELS ────────────────────────────────────────
// Text is one of the slowest things a canvas draws, and every pylon wrote its
// two labels every frame with a font switch between them. The words almost
// never change, so each (text, font, colour) is rendered once to a small
// offscreen canvas and stamped with drawImage after that.
const _labelCache = new Map();
function cachedText(text, font, color, x, y) {
    if (!text) return;
    const key = font + "|" + color + "|" + text;
    let e = _labelCache.get(key);
    if (!e) {
        const cv = typeof document !== "undefined" && document.createElement ? document.createElement("canvas") : null;
        const g = cv && cv.getContext ? cv.getContext("2d") : null;
        if (!g || typeof g.measureText !== "function") {          // no offscreen canvas: draw it directly
            ctx.font = font; ctx.fillStyle = color; ctx.textAlign = "center"; ctx.fillText(text, x, y); return;
        }
        g.font = font;
        const m = g.measureText(text), px = parseInt((font.match(/(\d+)px/) || [0, 10])[1], 10);
        const w = Math.ceil((m && m.width) || text.length * px * 0.6) + 4, h = px + 6;
        cv.width = w * 2; cv.height = h * 2;
        g.scale(2, 2); g.font = font; g.fillStyle = color; g.textAlign = "left"; g.textBaseline = "alphabetic";
        g.fillText(text, 2, h - 4);
        e = { cv, w, h };
        if (_labelCache.size > 400) _labelCache.clear();
        _labelCache.set(key, e);
    }
    ctx.drawImage(e.cv, x - e.w / 2, y - (e.h - 4), e.w, e.h);
}

// ── THE SENTINEL TOWER, PRE-RENDERED ─────────────────────
// Every turret, generator, connector and plain pylon stands on this tower: ~20
// fills that never change between frames. Rendered once per palette (active,
// upgraded, dormant) to an offscreen sprite and stamped after that.
const _towerSprites = new Map();
const TOWER_SPR_W = 30, TOWER_SPR_H = 64, TOWER_SPR_OX = 11, TOWER_SPR_OY = 58;
function _drawTowerBody(c, px, base, sFront, sRight, sTop, _isActive, slit) {
                    const sD=6; // iso depth
                    // Main tower right face
                    c.fillStyle=sRight; c.beginPath();
                    c.moveTo(px+8,base); c.lineTo(px+8+sD,base+sD/2);
                    c.lineTo(px+8+sD,base-35+sD/2); c.lineTo(px+8,base-35); c.closePath(); c.fill();
                    // Main tower front face
                    c.fillStyle=sFront; c.fillRect(px-8,base-35,16,35);
                    // Main tower top face
                    c.fillStyle=sTop; c.beginPath();
                    c.moveTo(px-8,base-35); c.lineTo(px+8,base-35);
                    c.lineTo(px+8+sD,base-35+sD/2); c.lineTo(px-8+sD,base-35+sD/2); c.closePath(); c.fill();
                    // Upper parapet right face
                    c.fillStyle=sRight; c.beginPath();
                    c.moveTo(px+6,base-35); c.lineTo(px+6+sD,base-35+sD/2);
                    c.lineTo(px+6+sD,base-48+sD/2); c.lineTo(px+6,base-48); c.closePath(); c.fill();
                    // Upper parapet front face
                    c.fillStyle=sFront; c.fillRect(px-6,base-48,12,13);
                    // Upper parapet top face
                    c.fillStyle=sTop; c.beginPath();
                    c.moveTo(px-6,base-48); c.lineTo(px+6,base-48);
                    c.lineTo(px+6+sD,base-48+sD/2); c.lineTo(px-6+sD,base-48+sD/2); c.closePath(); c.fill();
                    // Battlements (2 merlons)
                    const _merls=[{x:px-3.5,w:3.5},{x:px+3.5,w:3.5}];
                    for (const m of _merls) {
                        c.fillStyle=sRight; c.beginPath();
                        c.moveTo(m.x+m.w,base-48); c.lineTo(m.x+m.w+sD*0.5,base-48+sD*0.25);
                        c.lineTo(m.x+m.w+sD*0.5,base-52+sD*0.25); c.lineTo(m.x+m.w,base-52); c.closePath(); c.fill();
                        c.fillStyle=_isActive?"#2a3040":"#303540";
                        c.fillRect(m.x-m.w,base-52,m.w*2,4);
                        c.fillStyle=sTop; c.beginPath();
                        c.moveTo(m.x-m.w,base-52); c.lineTo(m.x+m.w,base-52);
                        c.lineTo(m.x+m.w+sD*0.5,base-52+sD*0.25); c.lineTo(m.x-m.w+sD*0.5,base-52+sD*0.25); c.closePath(); c.fill();
                    }
                    // Arrow slit
                    c.fillStyle=slit; c.fillRect(px-1.5,base-43,3,10); c.fillRect(px-4,base-40,8,3);
}
function drawSentinelTower(px, base, sFront, sRight, sTop, isActive, slit) {
    const key = sFront + "|" + sRight + "|" + sTop + "|" + (isActive ? 1 : 0);
    let spr = _towerSprites.get(key);
    if (spr === undefined) {
        spr = null;
        const cv = typeof document !== "undefined" && document.createElement ? document.createElement("canvas") : null;
        const g = cv && cv.getContext ? cv.getContext("2d") : null;
        if (g && typeof g.scale === "function") {
            cv.width = TOWER_SPR_W * 2; cv.height = TOWER_SPR_H * 2; g.scale(2, 2);
            _drawTowerBody(g, TOWER_SPR_OX, TOWER_SPR_OY, sFront, sRight, sTop, isActive, slit);
            spr = cv;
        }
        _towerSprites.set(key, spr);
    }
    if (spr) ctx.drawImage(spr, px - TOWER_SPR_OX, base - TOWER_SPR_OY, TOWER_SPR_W, TOWER_SPR_H);
    else _drawTowerBody(ctx, px, base, sFront, sRight, sTop, isActive, slit);
}

// ── THE WAVE MONOLITH (design 8, "Barcode Tablet") ───────
// A broad, short slab in flat Mandark-cartoon style: near-black faces, a thin
// purple edge, a bold black outline, on a squat plinth. Its only colour is a
// row of element-coloured stripes of different widths down the front and one
// down the side, with a bright scan line sweeping up them — the wave. The
// network tier makes the sweep faster and the stripes brighter. Dark (no
// power): grey stripes, no sweep. Chosen from design/monoliths.html.
const WAVE_MONO_FACE = "#1b1624", WAVE_MONO_SIDE = "#0f0c15", WAVE_MONO_TOP = "#2a2236", WAVE_MONO_EDGE = "#5a3a86";
// Fewer, more distinct bars than the design sheet: at game size the sheet's
// nine bars ran together into one block.
const WAVE_MONO_BARS = [[0.2, 1.5], [0.4, 2.3], [0.61, 1.3], [0.8, 2.1]];
function _monoSlab(cx, by, hw, hd, h, c) {
    c = c || ctx;
    const L = [cx - hw, by], F = [cx, by + hd], R = [cx + hw, by];
    const Lt = [cx - hw, by - h], Ft = [cx, by + hd - h], Rt = [cx + hw, by - h], Bt = [cx, by - hd - h];
    const poly = (pts, fill) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fillStyle = fill; c.fill(); };
    poly([L, F, Ft, Lt], WAVE_MONO_FACE); poly([F, R, Rt, Ft], WAVE_MONO_SIDE); poly([Lt, Ft, Rt, Bt], WAVE_MONO_TOP);
    c.strokeStyle = WAVE_MONO_EDGE; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(F[0], F[1] - 1.5); c.lineTo(Ft[0], Ft[1] + 1.5); c.stroke();
    c.strokeStyle = "#000"; c.lineWidth = 2; c.lineJoin = "round";
    c.beginPath(); c.moveTo(L[0], L[1]); c.lineTo(F[0], F[1]); c.lineTo(R[0], R[1]); c.lineTo(Rt[0], Rt[1]); c.lineTo(Bt[0], Bt[1]); c.lineTo(Lt[0], Lt[1]); c.closePath(); c.stroke();
    c.lineWidth = 1; c.beginPath(); c.moveTo(F[0], F[1]); c.lineTo(Ft[0], Ft[1]); c.lineTo(Lt[0], Lt[1]); c.moveTo(Ft[0], Ft[1]); c.lineTo(Rt[0], Rt[1]); c.stroke();
    return { L, F, R, Lt, Ft, Rt };
}
function _monoLeft(f, u, v) {
    const bx = f.L[0] + (f.F[0] - f.L[0]) * u, by = f.L[1] + (f.F[1] - f.L[1]) * u;
    const tx = f.Lt[0] + (f.Ft[0] - f.Lt[0]) * u, ty = f.Lt[1] + (f.Ft[1] - f.Lt[1]) * u;
    return [bx + (tx - bx) * v, by + (ty - by) * v];
}
function _monoRight(f, u, v) {
    const bx = f.F[0] + (f.R[0] - f.F[0]) * u, by = f.F[1] + (f.R[1] - f.F[1]) * u;
    const tx = f.Ft[0] + (f.Rt[0] - f.Ft[0]) * u, ty = f.Ft[1] + (f.Rt[1] - f.Ft[1]) * u;
    return [bx + (tx - bx) * v, by + (ty - by) * v];
}
// The body never changes between frames, so it is rendered once per
// (colour, dark, tier) to an offscreen canvas and stamped; only the scan line
// is drawn live. It used to be ~30 fills and strokes per wave pylon per frame.
const _monoSprites = new Map();
const MONO_SPR_W = 40, MONO_SPR_H = 72, MONO_SPR_OX = 20, MONO_SPR_OY = 62;   // origin = (px, base)
function _drawMonoBody(px, base, col, dark, tier, c) {
    c = c || ctx;
    _monoSlab(px, base, 15, 7.5, 4, c);                    // plinth
    const f = _monoSlab(px, base - 4, 13, 6.5, 40, c);     // the tablet
    c.lineCap = "butt";
    c.strokeStyle = col; c.globalAlpha = dark ? 0.9 : 0.85 + 0.05 * (tier || 0);
    for (const [u, w] of WAVE_MONO_BARS) {
        const [x0, y0] = _monoLeft(f, u, 0.08), [x1, y1] = _monoLeft(f, u, 0.92);
        c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
    }
    { const [x0, y0] = _monoRight(f, 0.5, 0.08), [x1, y1] = _monoRight(f, 0.5, 0.92);
      c.lineWidth = 1.8; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
    c.globalAlpha = 1;
    return f;
}
function _monoSprite(col, dark, tier) {
    const key = col + "|" + (dark ? 1 : 0) + "|" + (tier || 0);
    let e = _monoSprites.get(key);
    if (e !== undefined) return e;
    e = null;
    const cv = typeof document !== "undefined" && document.createElement ? document.createElement("canvas") : null;
    const g = cv && cv.getContext ? cv.getContext("2d") : null;
    if (g && typeof g.drawImage === "function" && typeof g.scale === "function") {
        cv.width = MONO_SPR_W * 2; cv.height = MONO_SPR_H * 2;
        g.scale(2, 2);
        _drawMonoBody(MONO_SPR_OX, MONO_SPR_OY, col, dark, tier, g);   // the body, into the sprite
        e = cv;
    }
    _monoSprites.set(key, e);
    return e;
}
// THE BATTERY (isBatteryPylon, config.js): a squat boxy cell of dark metal.
// Each of its two front faces carries a window of four stacked charge cells
// in its element's colour — one lit per network tier it is part of, plus one
// for itself — and two terminals sit on top, the element-coloured one live.
function drawBatteryPylon(px, base, colour, tier, pulse, dark) {
    const hw = 13, hh = 6.5, H = 36, by = base - 2;
    const col = dark ? "#5c6370" : colour;
    ctx.save();
    // Body.
    ctx.fillStyle = "#151b26";
    ctx.beginPath(); ctx.moveTo(px - hw, by - H); ctx.lineTo(px, by + hh - H); ctx.lineTo(px, by + hh); ctx.lineTo(px - hw, by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#1e2533";
    ctx.beginPath(); ctx.moveTo(px + hw, by - H); ctx.lineTo(px, by + hh - H); ctx.lineTo(px, by + hh); ctx.lineTo(px + hw, by); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#2a3242";
    ctx.beginPath(); ctx.moveTo(px, by - hh - H); ctx.lineTo(px + hw, by - H); ctx.lineTo(px, by + hh - H); ctx.lineTo(px - hw, by - H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#4f5b74"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px - hw, by - H); ctx.lineTo(px, by + hh - H); ctx.lineTo(px + hw, by - H); ctx.moveTo(px, by + hh - H); ctx.lineTo(px, by + hh); ctx.stroke();
    // A band of its colour round the shoulder.
    ctx.strokeStyle = col; ctx.globalAlpha = 0.75; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(px - hw, by - H + 5); ctx.lineTo(px, by + hh - H + 5); ctx.lineTo(px + hw, by - H + 5); ctx.stroke();
    ctx.globalAlpha = 1;
    // Charge cells on both front faces: four, bottom up; lit = tier + 1.
    const lit = dark ? 0 : Math.min(4, (tier || 0) + 1);
    for (const side of [-1, 1]) {
        for (let k = 0; k < 4; k++) {
            const y0 = by - 7 - k * 6.5;
            const x0 = px + side * 4, x1 = px + side * 10;
            const sk = (x) => Math.abs(x - px) * 0.5;   // the face rises away from the front edge
            const on = k < lit;
            ctx.fillStyle = on ? col : "#0b0f16";
            ctx.globalAlpha = on ? (k === lit - 1 ? 0.7 + 0.3 * pulse : 0.95) : 1;
            ctx.beginPath();
            ctx.moveTo(x0, y0 - sk(x0)); ctx.lineTo(x1, y0 - sk(x1)); ctx.lineTo(x1, y0 - 4.5 - sk(x1)); ctx.lineTo(x0, y0 - 4.5 - sk(x0)); ctx.closePath(); ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
    // Terminals: the live one in its colour, the other bare metal.
    const term = (dx, top) => {
        const x = px + dx, y = by - H - 1;
        ctx.fillStyle = "#121720"; ctx.fillRect(x - 3, y - 5, 6, 5);
        ctx.fillStyle = top; ctx.beginPath(); ctx.ellipse(x, y - 5, 3, 1.5, 0, 0, Math.PI * 2); ctx.fill();
    };
    term(-5, "#6b7487"); term(5, col);
    ctx.restore();
}

// `ghost` (0..1) fades the whole tablet: the see-through pylons round a
// black hole (js/formations.js).
function drawWaveMonolith(px, base, colour, dark, tier, asleep, ghost) {
    const g = ghost == null ? 1 : ghost;
    const col = dark ? "#5c6370" : colour;
    const t = (frame || 0) / 60;
    ctx.save();
    ctx.globalAlpha = g;
    // On standby the stripes are dimmed and the scan line is still.
    if (asleep) ctx.globalAlpha = 0.55 * g;
    const spr = _monoSprite(col, dark, tier);
    let f;
    if (spr) {
        ctx.drawImage(spr, px - MONO_SPR_OX, base - MONO_SPR_OY, MONO_SPR_W, MONO_SPR_H);
        // The tablet's faces, for placing the scan line — same numbers as the body.
        const hw = 13, hd = 6.5, h = 40, by = base - 4;
        f = { L: [px - hw, by], F: [px, by + hd], R: [px + hw, by], Lt: [px - hw, by - h], Ft: [px, by + hd - h], Rt: [px + hw, by - h] };
    } else {
        f = _drawMonoBody(px, base, col, dark, tier);
    }
    if (!dark && !asleep) {
        // The scan line sweeping up the front: the wave. Faster at higher tiers.
        const k = (t * (0.6 + 0.25 * (tier || 0))) % 1;
        const [ax, ay] = _monoLeft(f, 0.06, 0.08 + k * 0.84), [bx, by] = _monoLeft(f, 0.94, 0.08 + k * 0.84);
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
        ctx.strokeStyle = col; ctx.globalAlpha = 0.35 * g; ctx.lineWidth = 3.5; ctx.stroke();
        ctx.strokeStyle = "#ffffff"; ctx.globalAlpha = 0.8 * g; ctx.lineWidth = 1.2; ctx.stroke();
    }
    ctx.restore();
}

// THE WAKE-UP BLINK. A support or disruption pylon that has just sensed a unit
// flashes three times and throws a ring along the floor, so you can see the
// moment it starts working. `since` is frames since it woke.
function drawWaveWakeBlink(px, base, colour, since) {
    // One floor ring popping out to 1.6 tiles and fading over the blink
    // (Conduit effects plan) — no white flash, no glow disc.
    const k = since / WAVE_WAKE_BLINK;
    const r = TILE_W * (0.35 + 0.45 * k);
    ctx.save();
    ctx.globalAlpha = 0.6 * (1 - k); ctx.strokeStyle = colour; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(px, base - 2, r, r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
}

// ── THE SHIELD GENERATOR ─────────────────────────────────
// "A little bit thicker of a pylon ... a giant light coloured orb." A squat,
// wide steel block (half as wide again as a tower) holding a big pale orb in a
// ring. Switched off, the orb goes grey and still. No blur (effects plan).
function drawShieldGenerator(px, base, on, pulse) {
    const hw = 15, hd = 7.5, h = 34, by = base - 4;
    const L = [px - hw, by], F = [px, by + hd], R = [px + hw, by];
    ctx.save();
    const face = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.fill(); };
    face([L, F, [F[0], F[1] - h], [L[0], L[1] - h]], "#2a3442");
    face([F, R, [R[0], R[1] - h], [F[0], F[1] - h]], "#1b232e");
    face([[L[0], L[1] - h], [F[0], F[1] - h], [R[0], R[1] - h], [px, by - hd - h]], "#3a4656");
    // Two pale bands round the body.
    ctx.strokeStyle = on ? "rgba(223,243,255,0.55)" : "rgba(120,130,140,0.4)"; ctx.lineWidth = 1.5;
    for (const k of [0.35, 0.7]) { ctx.beginPath(); ctx.moveTo(L[0], L[1] - h * k); ctx.lineTo(F[0], F[1] - h * k); ctx.lineTo(R[0], R[1] - h * k); ctx.stroke(); }
    // The cradle, then the orb.
    const oy = by - h - 14, r = 11;
    ctx.strokeStyle = "#4a5768"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(px, oy + 6, 13, 5, 0, 0, Math.PI); ctx.stroke();
    if (on) {
        ctx.globalAlpha = 0.18 + 0.1 * pulse; ctx.fillStyle = SHIELD_GEN_COLOR;
        ctx.beginPath(); ctx.arc(px, oy, r * 1.7, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.95; ctx.fillStyle = SHIELD_GEN_COLOR;
        ctx.beginPath(); ctx.arc(px, oy, r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.9; ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(px - 3.5, oy - 3.5, 3.5, 0, Math.PI * 2); ctx.fill();
        // A slow ring of hex sparks round it.
        ctx.globalAlpha = 0.7; ctx.strokeStyle = "#9fdcff"; ctx.lineWidth = 1;
        const t = (frame || 0) * 0.03;
        for (let i = 0; i < 6; i++) { const a = t + i * Math.PI / 3; ctx.beginPath(); ctx.arc(px + Math.cos(a) * (r + 6), oy + Math.sin(a) * (r + 6) * 0.45, 1.6, 0, Math.PI * 2); ctx.stroke(); }
    } else {
        ctx.globalAlpha = 0.9; ctx.fillStyle = "#6b7480";
        ctx.beginPath(); ctx.arc(px, oy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

// ── THE PYLON TURRET ─────────────────────────────────────
// "Whenever the pylon is in turret mode it has a little self-aiming turret on top
// that will lock onto the enemy targets." Pure presentation: firing is still the
// attack pass in game.js. The gun turns smoothly toward the nearest hostile it
// can see (inside attackRange x TURRET_TRACK_RANGE_MULT), flashes when a bolt
// leaves (the bolt itself is drawTurretShots in game.js), and sweeps slowly when there is nothing to aim at. A pylon with
// no power droops: grey, still, and aimed at nothing.
function turretTarget(obj) {
    // Rescanned a few times a second, not every frame: the actors list is long
    // and the pylons on screen are not few.
    if (obj._tScan === undefined || frame - obj._tScan >= 6 || (obj._tTarget && obj._tTarget.dead)) {
        obj._tScan = frame;
        let best = null, bd2 = Math.pow((obj.attackRange || TURRET_RANGE) * TURRET_TRACK_RANGE_MULT, 2);
        for (const a of actors) {
            if (!a || a.dead || !isHostileTarget(a)) continue;
            const dx = a.x - obj.x, dy = a.y - obj.y, d2 = dx * dx + dy * dy;
            if (d2 < bd2) { bd2 = d2; best = a; }
        }
        obj._tTarget = best;
    }
    return obj._tTarget;
}

function drawPylonTurret(obj, px, topY, colour, dark) {
    const target = dark ? null : turretTarget(obj);
    const cx = px, cy = topY - 5;     // the gun's pivot, just above the merlons
    // Aim: the screen direction of the world vector to the target.
    let want = obj._tAng === undefined ? -Math.PI / 4 : obj._tAng;
    if (target) {
        const dx = target.x - obj.x, dy = target.y - obj.y;
        want = Math.atan2((dx + dy) * TILE_H, (dx - dy) * TILE_W);
    } else if (!dark) {
        want = (obj._tAng === undefined ? -Math.PI / 4 : obj._tAng) + 0.02;   // idle sweep
    }
    if (obj._tAng === undefined) obj._tAng = want;
    if (target || dark) {
        let d = want - obj._tAng;
        while (d >  Math.PI) d -= Math.PI * 2;
        while (d < -Math.PI) d += Math.PI * 2;
        obj._tAng += d * (dark ? 0.02 : 0.22);
    } else {
        obj._tAng = want;
    }
    const ang = obj._tAng;
    // ── THE RUNE BALLISTA (design B) ──────────────────────
    // A small stone pivot block, two stone prongs laid along the aim, and a
    // glowing glyph-bolt held between them in the element's colour. Minimal,
    // runic, stone. The prongs follow the aim in screen space; the depth axis
    // is squashed (uy * 0.55) so they read as lying in the ground plane.
    const ux = Math.cos(ang), uy = Math.sin(ang);   // already a screen-space angle
    const stoneTop = dark ? "#3a3f48" : "#3a4352", stoneSide = dark ? "#2a2e35" : "#232a35", stoneDark = dark ? "#1e2228" : "#161b23";
    ctx.save();
    // Pivot block: a squat isometric stone.
    const pw = 8, pd = 4, ph = 5, pyb = cy + 4;
    ctx.fillStyle = stoneSide; ctx.beginPath(); ctx.moveTo(cx - pw, pyb); ctx.lineTo(cx, pyb + pd); ctx.lineTo(cx, pyb + pd - ph); ctx.lineTo(cx - pw, pyb - ph); ctx.closePath(); ctx.fill();
    ctx.fillStyle = stoneDark; ctx.beginPath(); ctx.moveTo(cx, pyb + pd); ctx.lineTo(cx + pw, pyb); ctx.lineTo(cx + pw, pyb - ph); ctx.lineTo(cx, pyb + pd - ph); ctx.closePath(); ctx.fill();
    ctx.fillStyle = stoneTop; ctx.beginPath(); ctx.moveTo(cx - pw, pyb - ph); ctx.lineTo(cx, pyb + pd - ph); ctx.lineTo(cx + pw, pyb - ph); ctx.lineTo(cx, pyb - pd - ph); ctx.closePath(); ctx.fill();
    // The two prongs, either side of the aim.
    const len = 17, bx = cx + ux * len, by = cy + uy * len;
    ctx.lineCap = "round";
    for (const sgn of [-1, 1]) {
        const ox = -uy * 5.5 * sgn, oy = ux * 2.8 * sgn;
        ctx.strokeStyle = stoneTop; ctx.lineWidth = 4.5;
        ctx.beginPath(); ctx.moveTo(cx + ox, cy + oy); ctx.lineTo(cx + ox + ux * len, cy + oy + uy * len); ctx.stroke();
        ctx.strokeStyle = stoneDark; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(cx + ox, cy + oy + 1); ctx.lineTo(cx + ox + ux * len, cy + oy + uy * len + 1); ctx.stroke();
    }
    // The bolt: a lit glyph-shaft between the prongs.
    ctx.beginPath(); ctx.moveTo(cx - ux * 4, cy - uy * 4); ctx.lineTo(bx - ux * 1, by - uy * 1);
    if (!dark) { ctx.strokeStyle = colour; ctx.globalAlpha = target ? 0.35 : 0.2; ctx.lineWidth = 6; ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.strokeStyle = dark ? "#59606b" : colour; ctx.lineWidth = 2.4; ctx.stroke();
    // A rune notch on the pivot.
    if (!dark) {
        ctx.strokeStyle = colour; ctx.lineWidth = 1; ctx.globalAlpha = 0.85;
        ctx.beginPath(); ctx.moveTo(cx - 2, pyb - 1); ctx.lineTo(cx, pyb - 3.5); ctx.lineTo(cx + 2, pyb - 1); ctx.stroke();
        ctx.globalAlpha = 1;
    }
    if (!dark) {
        // The bolt's head, brighter while it has something to aim at. No
        // reticle or lock line: "I don't like how they lock on with that
        // stupid little reticule thing" — the gun turning is the tell.
        ctx.fillStyle = colour; ctx.globalAlpha = target ? 1 : 0.6;
        ctx.beginPath(); ctx.arc(bx, by, 1.8, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
        // Muzzle flash on the frame a shot was paid for.
        if (obj._lastShotFrame !== undefined && frame - obj._lastShotFrame < 6) {
            const k = 1 - (frame - obj._lastShotFrame) / 6;
            ctx.fillStyle = "rgba(255,240,200," + (0.9 * k) + ")";
            ctx.shadowColor = colour; ctx.shadowBlur = 0;
            ctx.beginPath(); ctx.arc(bx + ux * 3, by + uy * 3, 3 + 3 * k, 0, Math.PI * 2); ctx.fill();
        }
    }
    ctx.restore();
}

// ── THE POWER GAUGE ──────────────────────────────────────
// "A percentage level on top of the nest, with a progress bar — in this case a
// depletion bar." A battery you draw from drains, so the bar EMPTIES from the
// right as the level falls, with the percentage over it, and turns red and
// blinks as it runs out. Drawn for every nest that is a power source: the home
// portal and each zone you have neutralised.
const NEST_GAUGE_W = 84, NEST_GAUGE_H = 7;
function drawNestGauge(nest, cx, topY, colour) {
    const cap = nestEnergyMax(nest);
    if (!(cap > 0)) return;
    const f = Math.max(0, Math.min(1, nestEnergy(nest) / cap));
    const pct = Math.round(f * 100);
    const low = f < 0.2;
    const blink = low && f > 0 ? (0.55 + 0.45 * Math.sin((frame || 0) * 0.25)) : 1;
    const x = Math.round(cx - NEST_GAUGE_W / 2), y = Math.round(topY - NEST_GAUGE_H - 2);
    const col = low ? "#ff5522" : colour;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(x - 1, y - 1, NEST_GAUGE_W + 2, NEST_GAUGE_H + 2);
    ctx.globalAlpha = blink;
    ctx.fillStyle = col;
    ctx.fillRect(x, y, Math.round(NEST_GAUGE_W * f), NEST_GAUGE_H);
    ctx.globalAlpha = 1;
    // Quarter ticks, so how much has gone can be read off the bar.
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    for (let i = 1; i < 4; i++) ctx.fillRect(x + Math.round(NEST_GAUGE_W * i / 4), y, 1, NEST_GAUGE_H);
    ctx.strokeStyle = col; ctx.lineWidth = 1;
    ctx.strokeRect(x - 0.5, y - 0.5, NEST_GAUGE_W + 1, NEST_GAUGE_H + 1);
    ctx.font = "bold 10px monospace"; ctx.textAlign = "center";
    ctx.fillStyle = col; ctx.globalAlpha = blink;
    ctx.fillText(f <= 0 ? "EMPTY" : pct + "%", cx, y - 4);
    // OVERCHARGE: surging — a bright bar and the seconds left; recharging — a
    // thin line under the bar filling back up.
    if (typeof overchargeActive === "function") {
        if (overchargeActive(nest)) {
            const left = Math.ceil(((nest._grid || nest)._ocUntil - frame) / 60);
            ctx.globalAlpha = 0.5 + 0.5 * Math.sin((frame || 0) * 0.4);
            ctx.strokeStyle = "#fff27a"; ctx.lineWidth = 2;
            ctx.strokeRect(x - 2.5, y - 2.5, NEST_GAUGE_W + 5, NEST_GAUGE_H + 5);
            ctx.globalAlpha = 1; ctx.fillStyle = "#fff27a"; ctx.font = "bold 8px monospace";
            ctx.fillText("\u26a1 OVERCHARGE " + left + "s", cx, y + NEST_GAUGE_H + 9);
        } else {
            const cd = overchargeCooldownLeft(nest);
            if (cd > 0) {
                ctx.globalAlpha = 1; ctx.fillStyle = "rgba(255,242,122,0.7)";
                ctx.fillRect(x, y + NEST_GAUGE_H + 2, Math.round(NEST_GAUGE_W * (1 - cd / OVERCHARGE_COOLDOWN)), 1);
            }
        }
    }
    // Switched off: the level is held, and says so.
    if (nest.powerOff) {
        ctx.globalAlpha = 1; ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(x - 1, y - 1, NEST_GAUGE_W + 2, NEST_GAUGE_H + 2);
        ctx.fillStyle = "#ffb347"; ctx.font = "bold 8px monospace";
        ctx.fillText("OFF \u2014 HELD", cx, y + NEST_GAUGE_H + 9);
    }
    ctx.restore();
}

function drawHomePortal(px, py) {
    const sW1x = px, sW1y = py - 60, numT = 4;
    const blx = sW1x - TILE_W,              bly = sW1y + TILE_H;
    const brx = sW1x + (numT - 1) * TILE_W, bry = sW1y + (numT + 1) * TILE_H;
    const cx = (blx + brx) / 2, cy = (bly + bry) / 2 - NEST_WALL_H * 0.5;
    const t = (frame || 0);
    const breathe = 0.5 + 0.5 * Math.sin(t * 0.035);

    ctx.save();
    ctx.transform(WALL_UX, WALL_UY, 0, -1, cx, cy);

    // ── The opening: a dark green well that is deeper at the centre ──
    const well = ctx.createRadialGradient(0, 0, 2, 0, 0, PORTAL_R);
    well.addColorStop(0,    "rgba(4,26,16,0.96)");
    well.addColorStop(0.55, "rgba(10,70,44,0.85)");
    well.addColorStop(1,    "rgba(20,120,74,0.30)");
    ctx.fillStyle = well;
    ctx.beginPath(); ctx.ellipse(0, 0, PORTAL_R, PORTAL_R, 0, 0, Math.PI * 2); ctx.fill();

    // ── Slow inward drift, so it reads as a way THROUGH rather than a light ──
    ctx.strokeStyle = PORTAL_COLOUR;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
        const k = ((t * 0.004 + i / 3) % 1);
        const r = PORTAL_R * (1 - k);
        ctx.globalAlpha = 0.55 * k;
        ctx.beginPath(); ctx.ellipse(0, 0, r, r, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // ── The ring ──
    ctx.strokeStyle = PORTAL_COLOUR;
    ctx.lineWidth = 2.4 + breathe * 0.8;
    ctx.shadowColor = PORTAL_COLOUR;
    ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.ellipse(0, 0, PORTAL_R, PORTAL_R, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur =0;

    // ── Four anchors on the ring, turning slowly ──
    ctx.fillStyle = "#d8ffe8";
    for (let i = 0; i < 4; i++) {
        const a = t * 0.012 + i * Math.PI / 2;
        ctx.beginPath();
        ctx.ellipse(Math.cos(a) * PORTAL_R, Math.sin(a) * PORTAL_R, 2.4, 2.4, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    // ── Label, in screen space so it is never sheared ──
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "center";
    ctx.fillStyle = PORTAL_COLOUR;
    ctx.globalAlpha = 0.65 + breathe * 0.35;
    ctx.fillText("\u25c8 CRYSTAL", cx, cy + PORTAL_R + 16);
    ctx.restore();
    // The reserve, over the top of the wall face like every other nest's.
    drawNestGauge(homePortalTile() || { nest: true, x: -99, y: -1 }, cx, bly - NEST_WALL_H, PORTAL_COLOUR);
}

function drawCapturableNode(tile, px, py) {
    const captured = tile.captured;
    const progress = tile.captureProgress || 0;
    const cx = px, cy = py + TILE_H;

    // The CAPACITOR NODE was drawn here: a vortex in the floor plane, orange
    // and turning while open, cyan and still once captured. There is no such
    // tile any more — a zone's only mouth is the nest in its back wall — so the
    // signal tower is the first case now.
    if (tile.nodeType === 'signal_tower') {
        // Tall antenna with pulsing ring — red (enemy) or cyan (captured)
        const col = captured ? '#00ccff' : '#cc2222';
        const _pulse = 0.5 + 0.5 * Math.sin(frame * 0.07 + tile.x * 0.5);
        ctx.save();
        ctx.shadowColor = col;
        ctx.shadowBlur = 0;

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

        ctx.shadowBlur =0;
        ctx.restore();

    } else if (tile.nodeType === 'wall_panel') {
        // Wall-mounted control terminal.
        // Decoy status is hidden until activated.
        const activated = tile.panelActivated;
        const flicker = tile.panelFlicker || 0;
        const _blink = Math.sin(frame * 0.12 + flicker);
        // A panel in a zone you have taken is BLUE, like that zone's nest: it
        // cannot raise an alarm and it pays less, and the player needs to be
        // able to see which it is before walking up to it rather than after.
        const _taken = typeof zoneIsNeutralised === 'function'
                       && zoneIsNeutralised(zoneOfTile(tile));
        const liveLed = _taken ? NEST_COLOUR_CONTROLLED : (_blink > 0.6 ? '#00ff88' : '#00cc66');
        const ledCol = activated ? '#444' : liveLed;
        const screenCol = activated ? '#111' : (_taken ? '#071326' : '#001a0a');
        const rimCol = activated ? '#333' : (_taken ? NEST_COLOUR_CONTROLLED : '#0f8');

        ctx.save();
        ctx.shadowColor = activated ? 'transparent' : (_taken ? NEST_COLOUR_CONTROLLED : '#00ff88');
        ctx.shadowBlur = 0;

        // Panel body (flat-panel against back wall)
        ctx.fillStyle = activated ? '#1a1a1a' : (_taken ? '#0a1222' : '#0a1a10');
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
            if (pDist < 2.0) {
                const hint = 0.4 + 0.4 * Math.sin(frame * 0.2);
                ctx.globalAlpha = hint;
                ctx.strokeStyle = '#00ff88';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(cx, cy - 23, 14, 6, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
                // "PANEL" label
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
                ctx.fillStyle = '#00ff88';
                ctx.fillText('PANEL', cx, cy - 38);
            }
        } else {
            // Activated — dim "DONE" marker
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.font = '7px monospace'; ctx.textAlign = 'center';
            ctx.fillStyle = '#334433';
            ctx.fillText('USED', cx, cy - 38);
        }

        ctx.shadowBlur =0;
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
