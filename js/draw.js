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
// THE STATUS BAR, in the game's layout style (docs/UI-STYLE.md): a slanted slab, dark, with a hi-vis outline and a segment of colour for the health. Whose it is reads from the
// outline: teal for yours (ally === true), red for an enemy's (false), steel for a structure's (no flag). An enemy's fill runs hot (orange, yellow, red); yours stays in teals; a structure's ramps teal, yellow, red.
function drawHealthBar(x, y, width, height, health, maxHealth, drawCtx=ctx, ally) {
    if (typeof health!=="number"||typeof maxHealth!=="number"||maxHealth<=0) return;
    const pct=Math.max(0,Math.min(1,health/maxHealth)), sk=Math.max(2,Math.min(5,Math.round(height*0.8))), run=width-sk;
    const col = ally === false ? (pct>0.6?"#ff8a3c":pct>0.3?"#ffe733":"#ff3a2a")
              : ally === true  ? (pct>0.6?"#19e6c1":pct>0.3?"#13b89a":"#0e8a74")   // colour means WHOSE: yours stays teal at every health, length is the health
                               : (pct>0.6?"#19e6c1":pct>0.3?"#ffe733":"#ff4a1c");
    const edge = ally === true ? "#19e6c1" : ally === false ? "#ff4a1c" : "#8aa0c8";
    // (few canvas operations: the dark slab and its outline are one path; the fill is a second, left open for fill() to close)
    const slab = (f) => { drawCtx.beginPath(); drawCtx.moveTo(x+sk, y); drawCtx.lineTo(x+sk+run*f, y); drawCtx.lineTo(x+run*f, y+height); drawCtx.lineTo(x, y+height); };
    drawCtx.fillStyle="#05070f"; drawCtx.strokeStyle=edge; drawCtx.lineWidth=1.2; slab(1); drawCtx.closePath(); drawCtx.fill(); drawCtx.stroke();
    if (pct>0) { drawCtx.fillStyle=col; slab(pct); drawCtx.fill(); }
}

// THE ORDER RING (the long press), in the game's layout style (docs/UI-STYLE.md): ASKED: "whenever I long hold press on something, it needs to be in that new style menu so that I can see it." The choices are big slanted
// slabs with big italic type, spread out round the press point; the logic is unchanged (RADIAL_RADIUS and the drag angle still decide the choice), only where and how the choices are drawn moved.
function _radialK() { return Math.max(0.62, Math.min(1, (typeof canvas !== "undefined" ? canvas.width : 900) / 900)); }
// How far the slabs reach from the press point, so the ring can be kept on screen (input.js handleLongHold).
function radialMargins() { const k = _radialK(); return { x: 118 * k + 100 * k, top: 78 * k + 36 * k, bottom: 78 * k + 80 * k }; }
function _radialColour(label) {
    if (/^(INFO)/.test(label)) return "#8fe3ff";
    if (/^(ATTACK|STOW)/.test(label)) return "#ff4a1c";
    if (/^(RE-ROLL)/.test(label)) return "#a64dff";
    return "#19e6c1";
}
function drawRadialButton(x, y, label, active) {
    if (typeof uiButton === "function" && typeof uiFont === "function") {
        const k = _radialK(), R = typeof RADIAL_RADIUS === "number" ? RADIAL_RADIUS : 60;
        const cx = commandX + (x - commandX) / R * 118 * k, cy = commandY + (y - commandY) / R * 78 * k;
        const size = Math.round(22 * k), h = 52 * k; ctx.save(); ctx.font = uiFont(size); const w = Math.max(132 * k, Math.min(canvas.width * 0.46, ctx.measureText(label).width + 44 * k)); ctx.restore();
        uiButton({ x: cx - w / 2, y: cy - h / 2, w, h }, label, _radialColour(label), !!active, size);
        return;
    }
    ctx.fillStyle=active?"#0f8":"#055";
    ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=active?"#fff":"#0f8";
    ctx.font="12px monospace"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    ctx.shadowColor="#000"; ctx.shadowBlur=0;
    ctx.fillText(label,x,y-14);
    ctx.shadowBlur=0;
}

// A caption under the ring (what it is for), in the layout style's caption type.
function _radialCaption(text, col) { const k = _radialK(), y = commandY + 78 * k + 58 * k; if (typeof uiCaptionFit === "function") uiCaptionFit(text, commandX, y, col, "center", Math.round(16 * k), canvas.width * 0.8); else { ctx.fillStyle = col; ctx.font = "10px monospace"; ctx.textAlign = "center"; ctx.fillText(text, commandX, commandY + RADIAL_RADIUS + 18); } }
function drawRadialMenu() {
    if (!commandMode) return;
    selectedRadialAction=null;
    const dist=Math.hypot(dragDX,dragDY), angle=Math.atan2(dragDY,dragDX);
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    if (typeof uiFont === "function") {
        // the press point: a soft teal ring and a dot, where the finger is; the choices are the slabs round it
        ctx.strokeStyle = "rgba(25,230,193,.55)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(commandX, commandY, 22, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = "rgba(25,230,193,.18)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(commandX, commandY, RADIAL_RADIUS * 0.9, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#19e6c1"; ctx.beginPath(); ctx.arc(commandX, commandY, 4, 0, Math.PI * 2); ctx.fill();
    } else {
    ctx.strokeStyle="#0f8"; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(commandX,commandY,RADIAL_RADIUS,0,Math.PI*2); ctx.stroke();
    }

    // ── ENEMY TARGET — combat menu instead of the position one ──
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
        { const _h = typeof weaponHud === "function" ? weaponHud() : null; _radialCaption(_h ? _h.short : "AMMO " + playerAmmo, _h ? (_h.dry ? "#ff7766" : "#ffb070") : (playerAmmo > 0 ? "#ffb070" : "#ff7766")); }
        ctx.restore();
        return;
    }

    // ── YOUR FOLLOWER OR CLONE — its card in the roster (its INFO tab is on the card) ──
    // A follower can also be RE-ROLLED; a clone is summoned, not recruited, so
    // canRerollFollower refuses it and the left slot stays empty.
    if (commandFollowerTarget && !commandFollowerTarget.dead) {
        const f = commandFollowerTarget;
        const fRight = dist>RADIAL_RADIUS*0.25&&angle>-Math.PI/4&&angle<Math.PI/4;
        drawRadialButton(commandX+RADIAL_RADIUS, commandY, "ROSTER CARD", fRight);
        if (fRight) selectedRadialAction = "roster_card";
        if (typeof canRerollFollower === "function" && canRerollFollower(f)) {
            const fLeft = dist>RADIAL_RADIUS*0.25&&Math.abs(angle)>Math.PI*3/4;
            drawRadialButton(commandX-RADIAL_RADIUS, commandY, "RE-ROLL", fLeft);
            if (fLeft) selectedRadialAction = "reroll_follower";
        }
        _radialCaption(f.isClone ? (f.speciesName || "").toUpperCase() + " CLONE" : (f.element||"?").toUpperCase(), "#7dffb5");
        ctx.restore();
        return;
    }

    // ── THE GROUND: DOWN = POSITION, RIGHT = INFO ──
    // (The hit test in input.js mirrors these two.) Nothing is drawn at the
    // top or on the left, so nothing is picked there.
    {
        const dHov=dist>RADIAL_RADIUS*0.25&&angle>Math.PI/4&&angle<3*Math.PI/4;
        drawRadialButton(commandX, commandY+RADIAL_RADIUS, "POSITION", dHov);
        if (dHov) selectedRadialAction="position";
    }
    {
        const rHov=dist>RADIAL_RADIUS*0.25&&angle>-Math.PI/4&&angle<Math.PI/4;
        drawRadialButton(commandX+RADIAL_RADIUS, commandY, "INFO", rHov);
        if (rHov) selectedRadialAction="info";
    }

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

function _drawPredator(actor, px, py, drawCtx) {
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
    // EVERY SPECIES has its own body now, built on the ground and projected
    // (js/bugs3d.js; the beetle's is js/beetle3d.js) — synthetic ones wear
    // the body they were modded from.
    const _style = typeof bugBodyStyle === "function" ? bugBodyStyle(actor) : null;
    if (_style) {
        const _top = drawBug3D(actor, px, py, drawCtx, _style);
        // Its bars just over its body.
        _drawPredatorBars(actor, px, py + Math.max(0, 69 - _top) - (actor.leapLift || 0), drawCtx);
        return;
    }
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
        // All the legs of a pass are ONE path and one stroke (same colour and
        // width): they were a stroke each, six or eight per predator per frame.
        if (legData && legData.count===6) {
            drawCtx.strokeStyle="#111"; drawCtx.lineWidth=2;
            drawCtx.beginPath();
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
            drawCtx.stroke();
        } else if (legData && legData.count===8) {
            drawCtx.strokeStyle="#111"; drawCtx.lineWidth=1.2;
            drawCtx.beginPath();
            const positions=[-1.2,-0.4,0.4,1.2];
            positions.forEach((pos,index)=>{
                const long=-pos*(dim.width*0.22);
                const hx=thoraxCX+dirX*long, hy=thoraxCY+dirY*long;
                if (farOnly ? _legDepth <= 0 : _legDepth > 0)
                    _drawInsectLeg(drawCtx,hx,hy, 1,(index+1)%2===0?0:Math.PI,pos,actor,legData,dirX,dirY,perpX,perpY);
                if (farOnly ? _legDepth >= 0 : _legDepth < 0)
                    _drawInsectLeg(drawCtx,hx,hy,-1,(index)%2===0?0:Math.PI,pos,actor,legData,dirX,dirY,perpX,perpY);
            });
            drawCtx.stroke();
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
            // Central spine and the two side edge lines: one path, one stroke.
            drawCtx.beginPath();
            drawCtx.moveTo(0, -seg.length * 0.3);
            drawCtx.lineTo(0,  seg.length * 0.3);
            for (let s = -1; s <= 1; s += 2) {
                drawCtx.moveTo(seg.width * 0.31 * s, -seg.length * 0.25);
                drawCtx.lineTo(seg.width * 0.31 * s,  seg.length * 0.25);
            }
            drawCtx.stroke();
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
            // Both blades in one stroke, both tips in one fill (they were six
            // separate paths; the segments stay separate sub-paths, so the
            // round caps look exactly as before).
            const _tips = [];
            drawCtx.beginPath();
            for (let side = -1; side <= 1; side += 2) {
                const ch = side === -1 ? chL : chR;
                const bx = faceX + sideX * side * 3.2, by = faceY + sideY * side * 3.2;
                // Two-segment angular blade: sweeps outward then snaps inward
                const a1 = ha + side * (-0.9 + ch * 0.6);
                const ex = bx + Math.cos(a1) * mLen * 0.52, ey = by + Math.sin(a1) * mLen * 0.52;
                const a2 = a1 - side * 0.55;
                const tx = ex + Math.cos(a2) * mLen * 0.55, ty = ey + Math.sin(a2) * mLen * 0.55;
                drawCtx.moveTo(bx,by); drawCtx.lineTo(ex,ey);
                drawCtx.moveTo(ex,ey); drawCtx.lineTo(tx,ty);
                _tips.push(tx, ty);
            }
            drawCtx.stroke();
            drawCtx.fillStyle = "#333";
            drawCtx.beginPath();
            for (let i = 0; i < _tips.length; i += 2) { drawCtx.moveTo(_tips[i] + 1.8, _tips[i + 1]); drawCtx.arc(_tips[i], _tips[i + 1], 1.8, 0, Math.PI*2); }
            drawCtx.fill();

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
            const _dots = [];
            drawCtx.beginPath();
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
                drawCtx.moveTo(bx,by); drawCtx.quadraticCurveTo(midX,midY,upTX,upTY);
                drawCtx.moveTo(midX,midY); drawCtx.lineTo(loTX,loTY);
                _dots.push(upTX, upTY, 1.8, loTX, loTY, 1.4);
            });
            drawCtx.stroke();
            drawCtx.fillStyle = "#444";
            drawCtx.beginPath();
            for (let i = 0; i < _dots.length; i += 3) { drawCtx.moveTo(_dots[i] + _dots[i + 2], _dots[i + 1]); drawCtx.arc(_dots[i], _dots[i + 1], _dots[i + 2], 0, Math.PI*2); }
            drawCtx.fill();

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
                const _tips = [], _tr = mandData.thickness * 0.6;
                drawCtx.beginPath();
                for (let side = -1; side <= 1; side += 2) {
                    const ch = side === -1 ? chL : chR;
                    const bx = faceX + sideX * side * 3.5, by = faceY + sideY * side * 3.5;
                    const a1 = ha + side * (-0.6) + ch;
                    const ex = bx + Math.cos(a1) * mLen * 0.55, ey = by + Math.sin(a1) * mLen * 0.55;
                    const a2 = a1 - side * 0.45;
                    const tx = ex + Math.cos(a2) * mLen * 0.5, ty = ey + Math.sin(a2) * mLen * 0.5;
                    drawCtx.moveTo(bx,by); drawCtx.lineTo(ex,ey);
                    drawCtx.moveTo(ex,ey); drawCtx.lineTo(tx,ty);
                    _tips.push(tx, ty);
                }
                drawCtx.stroke();
                drawCtx.fillStyle = "#333";
                drawCtx.beginPath();
                for (let i = 0; i < _tips.length; i += 2) { drawCtx.moveTo(_tips[i] + _tr, _tips[i + 1]); drawCtx.arc(_tips[i], _tips[i + 1], _tr, 0, Math.PI*2); }
                drawCtx.fill();
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
        const _fangTips = [];
        drawCtx.beginPath();
        [-1,1].forEach(side => {
            const ox = sideX*3.5*side, oy = sideY*3.5*side;
            // Base segment downward
            const mid1X = baseX+ox+fwdX*chelData.length*0.45;
            const mid1Y = baseY+oy+fwdY*chelData.length*0.45;
            // Fang curves inward — chelicerae hook
            const tipX = mid1X + fwdX*chelData.length*0.5 - sideX*side*chelData.fangCurve*6;
            const tipY = mid1Y + fwdY*chelData.length*0.5 - sideY*side*chelData.fangCurve*6;
            drawCtx.moveTo(baseX+ox, baseY+oy);
            drawCtx.quadraticCurveTo(mid1X, mid1Y, tipX, tipY);
            _fangTips.push(tipX, tipY);
        });
        drawCtx.stroke();
        // Fang tip dots
        drawCtx.fillStyle = "#444";
        drawCtx.beginPath();
        for (let i = 0; i < _fangTips.length; i += 2) { drawCtx.moveTo(_fangTips[i] + chelData.thickness*0.7, _fangTips[i + 1]); drawCtx.arc(_fangTips[i], _fangTips[i + 1], chelData.thickness*0.7, 0, Math.PI*2); }
        drawCtx.fill();
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
        const _bulbs = [];
        drawCtx.beginPath();
        [-1,1].forEach(side => {
            const ox=sideX*6*side, oy=sideY*6*side;
            // Two segments — elbow out then tip bulb
            const j1x=baseX+ox+fwdX*pedData.length*0.5;
            const j1y=baseY+oy+fwdY*pedData.length*0.5;
            const tipX=j1x+fwdX*pedData.length*0.4+sideX*side*2;
            const tipY=j1y+fwdY*pedData.length*0.4+sideY*side*2;
            drawCtx.moveTo(baseX+ox,baseY+oy); drawCtx.lineTo(j1x,j1y);
            drawCtx.moveTo(j1x,j1y); drawCtx.lineTo(tipX,tipY);
            _bulbs.push(tipX, tipY);
        });
        drawCtx.stroke();
        // Bulb tips
        drawCtx.fillStyle="#444";
        drawCtx.beginPath();
        for (let i = 0; i < _bulbs.length; i += 2) { drawCtx.moveTo(_bulbs[i] + pedData.thickness*1.2, _bulbs[i + 1]); drawCtx.arc(_bulbs[i], _bulbs[i + 1], pedData.thickness*1.2, 0, Math.PI*2); }
        drawCtx.fill();
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
    _drawPredatorBars(actor, px, py, drawCtx);
}
// Its health bar, level tag, ability charge, ally bracket and shield bar —
// shared by every body (the beetle's is js/beetle3d.js).
function _drawPredatorBars(actor, px, py, drawCtx) {
    const _isAllyPred = actor.team === "green" || actor.isClone;
    drawHealthBar(px-18, py-85, 36, 6, actor.health, actor.maxHealth, drawCtx, _isAllyPred);
    // Its level, kind and what it is doing, over the bar (js/levels.js).
    if (typeof drawUnitTag === "function") drawUnitTag(actor, px, py - 96, drawCtx);
    drawAbilityCharge(actor, px, py, drawCtx);
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

    // Added to the pass's path; _drawLegsPass strokes them all at once.
    drawCtx.moveTo(hx, hy); drawCtx.lineTo(crestX, crestY); drawCtx.lineTo(footX, footY);
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
    const _sawSt    = (actor.isFollower && !actor.ghostphageLife) ? (actor.base || actor.stats || {}) : null;
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
// (VSPR_OX, VSPR_OY) is the ground point.
//
// Drawn at 1x. It was 2x "for crisp edges", but the game canvas is one pixel
// per CSS pixel, so the extra detail was thrown away when stamped — and each
// sprite cost 113 KB. In a big fight the attack lunge and stat shapes made
// enough different looks that the cache sat at its cap (~97 MB) and built
// about one new canvas EVERY frame: on an iPad, a texture upload per frame
// and a lot of memory, whatever the GRAPHICS setting.
const VSPR_W = 84, VSPR_H = 84, VSPR_OX = 42, VSPR_OY = 66, VSPR_SCALE = 1;
const VIRUS_POSES = 12;            // walk-cycle steps cached per look
const VIRUS_SPRITE_CAP = 1200;     // sprites kept before the least recently used are dropped
const VIRUS_BUBBLE_CROWD = 24;     // more followers on screen than this: no bubbles
let _virusSprites = new Map(), _virusesOnScreen = 0, _virusesCounting = 0, _virusCountFrame = -1;
// Only the ordinary look is cached; anything unusual is drawn live.
function _virusSpriteOk(actor) {
    return !actor.ghostphageLife && !(actor.smokeForm > 0);
}
function _virusSprite(actor, flash, er, eg, eb, wc) {
    const st = actor.isFollower ? (actor.base || actor.stats || {}) : null;
    // Shape buckets: the saw teeth and knee claws grow with stats in steps
    // too small to see, so they are rounded to a visible step.
    // Whole steps (they were half steps: twice the looks for no visible change).
    const saw  = st ? Math.round(Math.max(0, ((st.attack || 10) - 10) * 0.35)) : 0;
    const claw = st ? Math.round(Math.max(0, (Math.max(st.specialAttack || 0, st.accuracy || 0) - 10) * 0.45)) : 0;
    const TAU = Math.PI * 2;
    let pose = Math.floor((((wc % TAU) + TAU) % TAU) / TAU * VIRUS_POSES) % VIRUS_POSES;
    // The attack lunge in five steps (-4, -2, 0, 2, 4), not nine.
    const snap = actor.state === "attack" ? Math.round(Math.sin(actor.attackAnim || 0) * 2) * 2 : 0;
    // A hit flash or a lunge lasts a few frames: four walk poses are plenty for
    // them, which keeps a fight's looks inside the cache.
    if (flash || snap) pose -= pose % 3;
    const key = er + "," + eg + "," + eb + "|" + (flash ? 1 : 0) + "|" + saw + "|" + claw + "|" + pose + "|" + snap + "|" + (actor.isFollower ? 1 : 0) + "|" + (actor.element || "");
    let cv = _virusSprites.get(key);
    if (cv !== undefined) {
        // Least recently used goes first: a hit moves to the back of the line.
        _virusSprites.delete(key); _virusSprites.set(key, cv);
        return cv;
    }
    cv = null;
    const c = typeof document !== "undefined" && document.createElement ? document.createElement("canvas") : null;
    const g = c && c.getContext ? c.getContext("2d") : null;
    if (g && typeof g.drawImage === "function" && typeof g.scale === "function") {
        c.width = VSPR_W * VSPR_SCALE; c.height = VSPR_H * VSPR_SCALE; if (VSPR_SCALE !== 1) g.scale(VSPR_SCALE, VSPR_SCALE);
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
    // No save/restore (it ran for every shielded unit, every frame): the one
    // piece of state it changes, the alpha, is put back by hand.
    const ga = drawCtx.globalAlpha;
    drawCtx.globalAlpha = ga * (hit ? 0.9 : 0.45); drawCtx.strokeStyle = hit ? "#ffffff" : "#9fdcff"; drawCtx.lineWidth = hit ? 2 : 1.2;
    drawCtx.beginPath(); drawCtx.ellipse(px, py - 32, 17, 22, 0, 0, Math.PI * 2); drawCtx.stroke();
    drawCtx.globalAlpha = ga;
    const k = Math.min(1, actor.shieldAmount / max);
    if (k < 1) { drawCtx.fillStyle = "#000"; drawCtx.fillRect(px - 14, py - 70, 28, 3); }
    drawCtx.fillStyle = "#3af"; drawCtx.fillRect(px - 14, py - 70, Math.round(28 * k), 3);
}

function _drawVirus(actor, px, py, drawCtx) {
    // How many were drawn last frame — the crowd test for the bubbles.
    if (_virusCountFrame !== frame) { _virusesOnScreen = _virusesCounting; _virusesCounting = 0; _virusCountFrame = frame; }
    _virusesCounting++;
    const _bare = actor.fpSpot || (typeof attractOn === "function" && attractOn());   // (the website's background: a searcher wears no bar and no name, js/attract.js; nor does an egg waiting on a follower spot, js/followerspots.js, which has a label of its own)
    if (!_bare) drawHealthBar(px-14, py-76, 28, 6, actor.health, actor.maxHealth, drawCtx, actor.team === "green");
    // Its level, kind and what it is doing, over the bar and the ultimate bar (js/levels.js).
    if (!_bare && typeof drawUnitTag === "function") drawUnitTag(actor, px, py - 87, drawCtx);
    _drawFollowerShield(actor, px, py, drawCtx);

    // ── ULTIMATE CHARGE BAR ───────────────────────────────
    if (actor.isFollower && typeof actor.ultimateCharge === "number") {
        const _uc = Math.max(0, Math.min(100, actor.ultimateCharge));
        const _ucFull = _uc >= 100;
        const _elDef = ELEMENTS.find(e => e.id === actor.element);
        const _elCol = _elDef ? _elDef.color : "#aaa";
        // A thin slanted slab, gold when it is full (the same style as the health bar under it)
        const _ux = px - 14, _uy = py - 82, _uw = 28, _uh = 3, _us = 2, _slab = f => { drawCtx.beginPath(); drawCtx.moveTo(_ux + _us, _uy); drawCtx.lineTo(_ux + _us + (_uw - _us) * f, _uy); drawCtx.lineTo(_ux + (_uw - _us) * f, _uy + _uh); drawCtx.lineTo(_ux, _uy + _uh); };
        drawCtx.fillStyle = _ucFull ? "#4a3f00" : "#05070f"; _slab(1); drawCtx.fill();
        if (_uc > 0) { drawCtx.fillStyle = _ucFull ? (0.5 + 0.5 * Math.sin((frame || 0) * 0.18) > 0.5 ? "#ffffff" : "#ffe733") : _elCol; _slab(_uc / 100); drawCtx.fill(); }
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
    // EVOLVED (js/evolution.js): the machine it molted into, not the egg.
    if (typeof drawEvolvedFollower === "function" && drawEvolvedFollower(actor, px, py, drawCtx)) {}
    else if (_figOpts === null && typeof drawHdEgg === "function" && drawHdEgg(actor, px, py, drawCtx, flash)) {}   // the 3D egg (js/hdsprites.js)
    else if (_figOpts) _drawVirusFigure(drawCtx, px, py, actor, flash, er, eg, eb, wc, _figOpts);
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
    if (actor.evolved && typeof drawEvolvedOverlay === "function") drawEvolvedOverlay(actor, px, py, drawCtx);

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
    if (typeof drawHdPlayer === "function" && drawHdPlayer(p)) return;   // the 3D cube (js/hdsprites.js), once its sheet has arrived
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

// ── CACHED LABELS ────────────────────────────────────────
// Text is one of the slowest things a canvas draws, and a label written every
// frame pays for a font switch every frame. The words almost never change, so
// each (text, font, colour) is rendered once to a small offscreen canvas and
// stamped with drawImage after that.
const _labelCache = new Map();
// The game's slab style for a name plate: a dark slanted slab with a colour bar at its left, the text in `color`. (js/levels.js drawUnitTag)
const UNIT_FONT = 'italic 900 9px "DejaVu Sans","Segoe UI",system-ui,sans-serif';
let _plateCache = new Map();
// The role emblems on a follower's plate (drawn in a 10x10 box at the origin): BRAWLER crossed blades, MAGE a spark, TECHNICIAN a gear.
function _drawRoleEmblem(g, role, color) {
    g.save(); g.fillStyle = color; g.strokeStyle = color; g.lineCap = "round";
    if (role === "sniper") {   // MAGE: a four-point spark with a bright core
        g.beginPath(); g.moveTo(5, 0); g.quadraticCurveTo(5.6, 4.4, 10, 5); g.quadraticCurveTo(5.6, 5.6, 5, 10); g.quadraticCurveTo(4.4, 5.6, 0, 5); g.quadraticCurveTo(4.4, 4.4, 5, 0); g.closePath(); g.fill();
    } else if (role === "camper") {   // TECHNICIAN: a gear
        g.lineWidth = 2; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.beginPath(); g.moveTo(5 + Math.cos(a) * 2.6, 5 + Math.sin(a) * 2.6); g.lineTo(5 + Math.cos(a) * 4.8, 5 + Math.sin(a) * 4.8); g.stroke(); }
        g.beginPath(); g.arc(5, 5, 3.3, 0, Math.PI * 2); g.fill(); g.globalCompositeOperation = "destination-out"; g.beginPath(); g.arc(5, 5, 1.4, 0, Math.PI * 2); g.fill();
    } else {   // BRAWLER: crossed blades
        g.lineWidth = 1.8; g.beginPath(); g.moveTo(1, 1); g.lineTo(9, 9); g.moveTo(9, 1); g.lineTo(1, 9); g.stroke();
        g.lineWidth = 1.4; g.beginPath(); g.moveTo(1, 4); g.lineTo(4, 1); g.moveTo(9, 4); g.lineTo(6, 1); g.stroke();
    }
    g.restore();
}
function cachedPlate(text, color, chip, role) {
    if (chip) role = null;
    const key = (chip ? "c|" : "p|") + color + "|" + (role || "") + "|" + text;
    let e = _plateCache.get(key);
    if (!e) {
        const cv = typeof document !== "undefined" && document.createElement ? document.createElement("canvas") : null, g = cv && cv.getContext ? cv.getContext("2d") : null;
        if (!g || typeof g.measureText !== "function") return null;
        g.font = UNIT_FONT; const tw = Math.ceil((g.measureText(text) || { width: text.length * 5.4 }).width), h = chip ? 12 : 13, w = tw + (chip ? 12 : 14) + (role ? 12 : 0), sk = 3;
        cv.width = (w + 2) * 2; cv.height = (h + 2) * 2; g.scale(2, 2); g.translate(1, 1);
        g.beginPath(); g.moveTo(sk, 0); g.lineTo(w, 0); g.lineTo(w - sk, h); g.lineTo(0, h); g.closePath();
        // QUIET: a dark slab with a hairline edge and a thin colour bar; the chip is the same dark slab with its colour on the edge and in the text
        g.fillStyle = chip ? "rgba(5,7,15,0.78)" : "rgba(5,7,15,0.82)"; g.fill(); g.lineWidth = 1; g.strokeStyle = color; g.globalAlpha = chip ? 0.7 : 0.28; g.stroke(); g.globalAlpha = 1;
        if (!chip) { g.fillStyle = color; g.fillRect(sk + 0.5, 1, 1.5, h - 2); }
        g.font = UNIT_FONT; g.textAlign = "center"; g.textBaseline = "middle"; g.fillStyle = chip ? color : "#cfdde0"; g.fillText(text, w / 2 + (chip ? 0 : 1.5) + (role ? 6 : 0), h / 2 + 0.5);
        if (role) { g.save(); g.translate(sk + 5, (h - 10) / 2); _drawRoleEmblem(g, role, color); g.restore(); }
        e = { cv, w: w + 2, h: h + 2 };
        if (_plateCache.size > 400) _plateCache.clear();
        _plateCache.set(key, e);
    }
    return e;
}
// Draw a plate (or chip) centred at x with its BOTTOM edge at y.
function drawPlate(text, color, x, y, chip, role) {
    const e = cachedPlate(text, color, chip, role); if (!e) return false;
    ctx.drawImage(e.cv, x - e.w / 2, y - e.h, e.w, e.h); return true;
}
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

