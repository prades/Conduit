// ─────────────────────────────────────────────────────────
//  FOLLOWER ELEMENT / UNITS / CLONES UI  (three-tab panel)
// ─────────────────────────────────────────────────────────
const _UI_X=20, _UI_W=180, _UI_TAB_H=22, _UI_ROW_H=28;
// Total height constant — panel always same size regardless of tab
const _UI_CONTENT_H = ELEMENTS.length * _UI_ROW_H; // 168px
const _UI_TOTAL_H   = _UI_TAB_H + _UI_CONTENT_H;

function _panelY() { return canvas.height - 20 - _UI_TOTAL_H; }

function drawFollowerElementUI() {
    const x=_UI_X, w=_UI_W, th=_UI_TAB_H, rh=_UI_ROW_H;
    const py0=_panelY(), cy0=py0+th;

    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    ctx.textBaseline="middle";

    // ── TAB ROW ──────────────────────────────────────────
    const tabW=Math.floor(w/3);
    [["ELEM","elements"],["UNITS","units"],["CLONES","clones"]].forEach(([label,id],i)=>{
        const active=uiTab===id;
        const hasClones = id==="clones" && actors.some(a=>a.isClone&&!a.dead);
        ctx.fillStyle=active?"rgba(0,255,136,0.18)":"rgba(0,0,0,0.65)";
        ctx.fillRect(x+i*tabW,py0,tabW,th);
        ctx.strokeStyle=active?"#0f8":(hasClones?"#0a6":"#333"); ctx.lineWidth=active?2:1;
        ctx.strokeRect(x+i*tabW,py0,tabW,th);
        ctx.fillStyle=active?"#0f8":(hasClones?"#0a6":"#555"); ctx.font="11px monospace"; ctx.textAlign="center";
        ctx.fillText(label,x+i*tabW+tabW/2,py0+th/2);
    });

    // ── CONTENT ───────────────────────────────────────────
    if (uiTab==="elements") {
        ctx.font="13px monospace";
        ELEMENTS.forEach((el,i)=>{
            const yy=cy0+i*rh, unlocked=unlockedElements.has(el.id), selected=player.selectedElement===el.id;
            const count=followerByElement[el.id]?.length||0;
            ctx.fillStyle=selected?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.65)";
            ctx.fillRect(x,yy,w,rh);
            ctx.strokeStyle=unlocked?el.color:"#333"; ctx.lineWidth=selected?2:1;
            ctx.strokeRect(x,yy,w,rh);
            ctx.fillStyle=unlocked?el.color:"#222"; ctx.fillRect(x+6,yy+6,14,rh-12);
            ctx.fillStyle=unlocked?"#fff":"#555"; ctx.textAlign="left";
            ctx.fillText(el.label,x+28,yy+rh/2);
            if (unlocked) {
                const pool=followerByElement[el.id]||[];
                const brawlers=pool.filter(a=>a.role==="brawler").length;
                const snipers =pool.filter(a=>a.role==="sniper").length;
                const campers =pool.filter(a=>a.role==="camper").length;
                ctx.textAlign="right"; ctx.fillText(count,x+w-10,yy+rh/2);
                ctx.font="9px monospace"; ctx.textAlign="left";
                ctx.fillStyle="#f88"; ctx.fillText("B:"+brawlers,x+28,yy+rh-6);
                ctx.fillStyle="#88f"; ctx.fillText("S:"+snipers, x+58,yy+rh-6);
                ctx.fillStyle="#8f8"; ctx.fillText("C:"+campers, x+88,yy+rh-6);
                ctx.font="13px monospace";
            }
        });
    } else if (uiTab==="units") {
        // ── UNITS TAB — Brawlers / Snipers / Campers ──────
        const roles=[
            {id:"brawler",label:"BRAWLERS",color:"#f88",badge:"B"},
            {id:"sniper", label:"SNIPERS", color:"#88f",badge:"S"},
            {id:"camper", label:"CAMPERS", color:"#8f8",badge:"C"},
        ];
        const unitRH=Math.floor(_UI_CONTENT_H/3);

        roles.forEach((r,i)=>{
            const yy=cy0+i*unitRH;
            const pool=followers.filter(a=>!a.dead&&a.role===r.id);
            const count=pool.length;
            const active=selectedRole===r.id;

            // Background + border
            ctx.fillStyle=active?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.65)";
            ctx.fillRect(x,yy,w,unitRH);
            ctx.strokeStyle=active?r.color:"#444"; ctx.lineWidth=active?2:1;
            ctx.strokeRect(x,yy,w,unitRH);

            // Color badge
            ctx.fillStyle=r.color; ctx.fillRect(x+5,yy+6,15,unitRH-12);
            ctx.fillStyle="#000"; ctx.font="bold 10px monospace"; ctx.textAlign="center";
            ctx.fillText(r.badge,x+5+7.5,yy+unitRH/2);

            // Role name + count
            ctx.fillStyle=active?"#fff":"#aaa"; ctx.font="11px monospace"; ctx.textAlign="left";
            ctx.fillText(r.label,x+27,yy+unitRH/2-5);
            ctx.fillStyle=r.color; ctx.font="bold 13px monospace"; ctx.textAlign="right";
            ctx.fillText(count,x+w-8,yy+unitRH/2-5);

            // Element color dots for each follower (up to 22)
            const dotY=yy+unitRH-11;
            pool.slice(0,22).forEach((f,di)=>{
                const el=ELEMENTS.find(e=>e.id===f.element);
                ctx.fillStyle=el?el.color:"#888";
                ctx.globalAlpha=f.job?0.4:0.9;
                ctx.beginPath(); ctx.arc(x+27+di*7,dotY,2.8,0,Math.PI*2); ctx.fill();
                ctx.globalAlpha=1;
            });

            // "TAP TO SELECT" hint when empty
            if (count===0) {
                ctx.fillStyle="#444"; ctx.font="9px monospace"; ctx.textAlign="left";
                ctx.fillText("none",x+27,dotY);
            }
        });
    } else {
        // ── CLONES TAB — list active insect clones ────────
        const clones=actors.filter(a=>a.isClone&&!a.dead);
        if (clones.length===0) {
            ctx.fillStyle="#444"; ctx.font="10px monospace"; ctx.textAlign="center";
            ctx.fillText("No clones active",x+w/2,cy0+_UI_CONTENT_H/2);
        } else {
            const cloneRH=Math.floor(_UI_CONTENT_H/Math.min(clones.length,6));
            clones.slice(0,6).forEach((c,i)=>{
                const yy=cy0+i*cloneRH;
                ctx.fillStyle="rgba(0,0,0,0.65)";
                ctx.fillRect(x,yy,w,cloneRH);
                ctx.strokeStyle="#0f8"; ctx.lineWidth=1;
                ctx.strokeRect(x,yy,w,cloneRH);
                // Species label
                ctx.fillStyle="#0f8"; ctx.font="10px monospace"; ctx.textAlign="left";
                const label=((c.speciesName||"clone").toUpperCase()+" ["+(c.className||"").toUpperCase()+"]");
                ctx.fillText(label,x+6,yy+cloneRH/2-4);
                // Health bar
                const barX=x+6, barY=yy+cloneRH/2+4, barW=w-12, barH=4;
                ctx.fillStyle="#222"; ctx.fillRect(barX,barY,barW,barH);
                const hp=Math.max(0,c.health/c.maxHealth);
                ctx.fillStyle=hp>0.5?"#0f8":hp>0.25?"#ff0":"#f22";
                ctx.fillRect(barX,barY,barW*hp,barH);
            });
            // "COMMANDING CLONES" indicator when this tab is active
            ctx.fillStyle="rgba(0,255,136,0.12)";
            ctx.fillRect(x,cy0,w,_UI_CONTENT_H);
            ctx.fillStyle="#0f8"; ctx.font="bold 9px monospace"; ctx.textAlign="center";
            ctx.fillText("▶ COMMANDS TARGET CLONES ◀",x+w/2,cy0+_UI_CONTENT_H-8);
        }
    }

    ctx.restore();
}

// ─────────────────────────────────────────────────────────
//  ELEMENT PICKER  (canvas-drawn)
// ─────────────────────────────────────────────────────────
const _EP_W = 310, _EP_ROW_H = 44, _EP_COLS = 3;
const _EP_ROWS = Math.ceil(ELEMENTS.length / _EP_COLS);
const _EP_GRID_H = _EP_ROWS * _EP_ROW_H;
const _EP_HEADER_H = 64, _EP_CANCEL_H = 38;
const _EP_TOTAL_H = _EP_HEADER_H + _EP_GRID_H + _EP_CANCEL_H;

function drawElementPicker() {
    if (!elementPickerOpen) return;
    const pw = _EP_W, ph = _EP_TOTAL_H;
    const px = Math.round((canvas.width  - pw) / 2);
    const py = Math.round((canvas.height - ph) / 2);

    ctx.save(); ctx.setTransform(1,0,0,1,0,0);

    // Background + border
    ctx.fillStyle   = "rgba(4,16,10,0.97)";
    ctx.strokeStyle = "#0f8";
    ctx.lineWidth   = 2;
    _epRoundRect(px, py, pw, ph, 10);
    ctx.fill(); ctx.stroke();

    // Title
    ctx.fillStyle = "#0ff"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
    const titleText = elementPickerMode === "upgrade" ? "UPGRADE PYLON — SELECT ELEMENT" : "BUILD PYLON — SELECT ELEMENT";
    ctx.fillText(titleText, px + pw/2, py + 22);

    // Sub-label
    ctx.fillStyle = "#ff0"; ctx.font = "10px monospace";
    const subText = elementPickerMode === "build" ? "Cost: 10 shards" :
        (elementPickerTarget && (elementPickerTarget.attackMode || elementPickerTarget.waveMode) ? "Element change — free" : "Requires a follower sacrifice");
    ctx.fillText(subText, px + pw/2, py + 44);

    // Element grid
    const cellW = Math.floor(pw / _EP_COLS);
    ELEMENTS.forEach((el, i) => {
        const col = i % _EP_COLS, row = Math.floor(i / _EP_COLS);
        const cx = px + col * cellW, cy = py + _EP_HEADER_H + row * _EP_ROW_H;
        const unlocked = unlockedElements.has(el.id);
        const alpha = unlocked ? 1.0 : 0.35;

        ctx.globalAlpha = alpha;
        // Cell background
        ctx.fillStyle = "rgba(10,26,16,0.9)";
        ctx.strokeStyle = el.color; ctx.lineWidth = 1;
        _epRoundRect(cx + 4, cy + 4, cellW - 8, _EP_ROW_H - 8, 6);
        ctx.fill(); ctx.stroke();

        // Color dot
        ctx.fillStyle = el.color;
        ctx.shadowColor = el.color; ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(cx + 20, cy + _EP_ROW_H/2, 7, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;

        // Label
        ctx.fillStyle = "#fff"; ctx.font = "10px monospace"; ctx.textAlign = "left";
        ctx.fillText(el.label.toUpperCase(), cx + 33, cy + _EP_ROW_H/2 + 1);
        ctx.globalAlpha = 1;
    });

    // Cancel button
    const cancelY = py + _EP_HEADER_H + _EP_GRID_H + 6;
    ctx.fillStyle = "rgba(10,15,10,0.9)";
    ctx.strokeStyle = "#444"; ctx.lineWidth = 1;
    _epRoundRect(px + 10, cancelY, pw - 20, _EP_CANCEL_H - 12, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#555"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText("CANCEL", px + pw/2, cancelY + (_EP_CANCEL_H - 12)/2 + 1);

    ctx.restore();
}

function _epRoundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
    ctx.arcTo(x+w, y, x+w, y+r, r); ctx.lineTo(x+w, y+h-r);
    ctx.arcTo(x+w, y+h, x+w-r, y+h, r); ctx.lineTo(x+r, y+h);
    ctx.arcTo(x, y+h, x, y+h-r, r); ctx.lineTo(x, y+r);
    ctx.arcTo(x, y, x+r, y, r);
    ctx.closePath();
}

function _handleElementPickerTap(tx, ty) {
    if (!elementPickerOpen) return false;
    const pw = _EP_W, ph = _EP_TOTAL_H;
    const px = Math.round((canvas.width  - pw) / 2);
    const py = Math.round((canvas.height - ph) / 2);
    if (tx < px || tx > px+pw || ty < py || ty > py+ph) {
        // Tap outside = cancel
        elementPickerOpen = false; elementPickerMode = null; elementPickerTarget = null;
        return true;
    }
    const cellW = Math.floor(pw / _EP_COLS);
    const gridY0 = py + _EP_HEADER_H, gridY1 = gridY0 + _EP_GRID_H;
    if (ty >= gridY0 && ty < gridY1) {
        const col = Math.floor((tx - px) / cellW);
        const row = Math.floor((ty - gridY0) / _EP_ROW_H);
        const idx  = row * _EP_COLS + col;
        const el   = ELEMENTS[idx];
        if (el && unlockedElements.has(el.id)) {
            const mode = elementPickerMode, target = elementPickerTarget;
            elementPickerOpen = false; elementPickerMode = null; elementPickerTarget = null;
            if (mode === "build")   _executeBuild(el, target);
            else if (mode === "upgrade") _executeUpgrade(el, target);
        }
        return true;
    }
    // Cancel button zone
    const cancelY = py + _EP_HEADER_H + _EP_GRID_H + 6;
    if (ty >= cancelY && ty < cancelY + _EP_CANCEL_H - 12) {
        elementPickerOpen = false; elementPickerMode = null; elementPickerTarget = null;
        return true;
    }
    return true; // absorb all taps while open
}

// ─────────────────────────────────────────────────────────
//  INFO PANEL  (canvas-drawn)
// ─────────────────────────────────────────────────────────
const _IP_W = 280, _IP_ROW_H = 20, _IP_PAD = 14;

function drawInfoPanel() {
    if (!infoPanelOpen) return;
    const rows = _buildInfoRows(infoPanelTarget);
    const contentH = rows.length * _IP_ROW_H;
    const ph = _IP_PAD*2 + 28 + contentH + 38; // title + content + close btn
    const pw = _IP_W;
    const px = Math.round((canvas.width  - pw) / 2);
    const py = Math.round((canvas.height - ph) / 2);

    ctx.save(); ctx.setTransform(1,0,0,1,0,0);

    // Background + border
    ctx.fillStyle   = "rgba(6,13,8,0.97)";
    ctx.strokeStyle = "#0f8"; ctx.lineWidth = 2;
    _epRoundRect(px, py, pw, ph, 10);
    ctx.fill(); ctx.stroke();

    // Title
    const titleObj = _buildInfoTitle(infoPanelTarget);
    ctx.fillStyle = "#0ff"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
    ctx.fillText(titleObj, px + pw/2, py + 20);

    // Divider
    ctx.strokeStyle = "#0a4"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px+10, py+30); ctx.lineTo(px+pw-10, py+30); ctx.stroke();

    // Rows
    const ryBase = py + 30 + _IP_ROW_H/2 + 2;
    rows.forEach((r, i) => {
        const ry = ryBase + i * _IP_ROW_H;
        if (r === null) {
            ctx.strokeStyle = "#0a3"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(px+10, ry); ctx.lineTo(px+pw-10, ry); ctx.stroke();
            return;
        }
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#0a8"; ctx.font = "10px monospace"; ctx.textAlign = "left";
        ctx.fillText(r[0], px + 12, ry);
        // Value — may contain color annotation
        ctx.fillStyle = r[2] || "#aad"; ctx.textAlign = "right";
        ctx.fillText(r[1], px + pw - 12, ry);
    });

    // Close button
    const closeY = py + ph - 34;
    ctx.fillStyle = "rgba(10,26,16,0.9)";
    ctx.strokeStyle = "#0f8"; ctx.lineWidth = 2;
    _epRoundRect(px + 10, closeY, pw - 20, 28, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#0f8"; ctx.font = "11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("CLOSE", px + pw/2, closeY + 14);

    ctx.restore();
}

function _buildInfoTitle(targetTile) {
    if (!targetTile) return "NO TARGET";
    let subject = null;
    const candidates = [...followers, ...actors.filter(a=>a.isClone)]
        .filter(a=>!a.dead && Math.hypot(a.x - targetTile.x, a.y - targetTile.y) < 3);
    subject = candidates[0] || null;
    if (subject) return (subject.role||"UNIT").toUpperCase() + " — " + (subject.speciesName||subject.type||"UNIT").toUpperCase();
    if (targetTile.pillar && !targetTile.destroyed) return "PYLON";
    return "NO TARGET";
}

function _buildInfoRows(targetTile) {
    if (!targetTile) return [["STATUS","No target nearby","#555"]];
    let subject = null;
    const candidates = [...followers, ...actors.filter(a=>a.isClone)]
        .filter(a=>!a.dead && Math.hypot(a.x - targetTile.x, a.y - targetTile.y) < 3);
    subject = candidates[0] || null;

    if (subject) {
        const el = ELEMENTS.find(e=>e.id===subject.element);
        const elColor = el ? el.color : "#0f8";
        const rows = [
            ["ELEMENT",    (el ? el.label : subject.element||"?").toUpperCase(), elColor],
            ["PERSONALITY",(subject.personality||"—").toUpperCase(), "#aad"],
            ["HP",         Math.ceil(subject.health)+" / "+subject.maxHealth, "#0f8"],
            ["POWER",      (subject.power||0).toFixed(1), "#ff0"],
            ["SPEED",      ((subject.moveSpeed||0)*1000).toFixed(1)+"‰", "#aad"],
        ];
        if (subject.stats) {
            rows.push(["WILL",  (subject.stats.will||0).toFixed(0), "#aad"]);
            rows.push(["ATK",   (subject.stats.attack||0).toFixed(0), "#f88"]);
        }
        rows.push(null); // separator
        const ctName = subject.combatTrait  ? (COMBAT_TRAITS[subject.combatTrait]?.name  || subject.combatTrait)  : "—";
        const ntName = subject.naturalTrait ? (NATURAL_TRAITS[subject.naturalTrait]?.name || subject.naturalTrait) : "—";
        const pkName = subject.perk         ? (PERKS[subject.perk]?.name                 || subject.perk)         : "—";
        rows.push(["COMBAT",  ctName, "#f88"]);
        rows.push(["NATURAL", ntName, "#8f8"]);
        rows.push(["PERK",    pkName, "#88f"]);
        return rows;
    }

    if (targetTile.pillar && !targetTile.destroyed) {
        const el = ELEMENTS.find(e=>e.id===targetTile.attackModeElement);
        const mode = targetTile.attackMode?"ATTACK":targetTile.waveMode?"WAVE":"DORMANT";
        const team = targetTile.pillarTeam==="green"?"ALLY":"ENEMY";
        const teamCol = targetTile.pillarTeam==="green"?"#0f8":"#f44";
        return [
            ["TEAM",    team,                              teamCol],
            ["ELEMENT", el ? el.label.toUpperCase():"NONE", el?el.color:"#555"],
            ["MODE",    mode,                              "#ff0"],
            ["HP",      Math.ceil(targetTile.health)+" / "+targetTile.maxHealth, "#0f8"],
            ["STATUS",  targetTile.constructing?"BUILDING":targetTile.reconstructing?"REPAIRING":"ACTIVE", "#aad"],
        ];
    }
    return [["STATUS","No unit or pylon nearby","#555"]];
}

function _handleInfoPanelTap(tx, ty) {
    if (!infoPanelOpen) return false;
    const rows = _buildInfoRows(infoPanelTarget);
    const contentH = rows.length * _IP_ROW_H;
    const ph = _IP_PAD*2 + 28 + contentH + 38;
    const pw = _IP_W;
    const px = Math.round((canvas.width  - pw) / 2);
    const py = Math.round((canvas.height - ph) / 2);
    if (tx < px || tx > px+pw || ty < py || ty > py+ph) {
        infoPanelOpen = false; infoPanelTarget = null;
        return true;
    }
    const closeY = py + ph - 34;
    if (ty >= closeY) { infoPanelOpen = false; infoPanelTarget = null; }
    return true;
}

// Central overlay tap dispatcher — call from pointerup handler
function handleOverlayPanelTap(tx, ty) {
    if (elementPickerOpen) return _handleElementPickerTap(tx, ty);
    if (infoPanelOpen)     return _handleInfoPanelTap(tx, ty);
    return false;
}

// ─────────────────────────────────────────────────────────
//  HOLD LINE (world-space boundary line drawn on canvas)
// ─────────────────────────────────────────────────────────
function drawHoldLine() {
    if (holdLineX===null) return;
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    const yMin=player.visualY-10, yMax=player.visualY+10;
    const sx1=(holdLineX-player.visualX-(yMin-player.visualY))*TILE_W+canvas.width/2;
    const sy1=(holdLineX-player.visualX+(yMin-player.visualY))*TILE_H+canvas.height/2;
    const sx2=(holdLineX-player.visualX-(yMax-player.visualY))*TILE_W+canvas.width/2;
    const sy2=(holdLineX-player.visualX+(yMax-player.visualY))*TILE_H+canvas.height/2;
    const pulse=0.5+0.5*Math.sin(frame*0.08);
    ctx.strokeStyle=`rgba(255,200,0,${0.45+pulse*0.35})`; ctx.lineWidth=2;
    ctx.setLineDash([8,5]); ctx.shadowColor="#ff0"; ctx.shadowBlur=10;
    ctx.beginPath(); ctx.moveTo(sx1,sy1); ctx.lineTo(sx2,sy2); ctx.stroke();
    ctx.setLineDash([]); ctx.shadowBlur=0;
    const midX=(sx1+sx2)/2, midY=(sy1+sy2)/2;
    ctx.fillStyle="#ff0"; ctx.font="bold 10px monospace"; ctx.textAlign="center";
    ctx.fillText("HOLD",midX,midY-12);
    ctx.restore();
}

// ─────────────────────────────────────────────────────────
//  GESTURE TRAIL FEEDBACK
// ─────────────────────────────────────────────────────────
function drawGestureFeedback() {
    if (!isPressing||gesturePoints.length<3) return;
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    ctx.strokeStyle="rgba(255,255,100,0.55)"; ctx.lineWidth=2;
    ctx.setLineDash([5,4]); ctx.lineJoin="round";
    ctx.beginPath();
    gesturePoints.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
    ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
}

// ─────────────────────────────────────────────────────────
//  CLICK HANDLER
// ─────────────────────────────────────────────────────────
function handleFollowerUIClick(x,y) {
    const py0=_panelY();
    if (x<_UI_X||x>_UI_X+_UI_W||y<py0||y>py0+_UI_TOTAL_H) return false;

    // Tab row — three tabs each 1/3 width
    if (y<py0+_UI_TAB_H) {
        const tabW=Math.floor(_UI_W/3);
        const ti=Math.floor((x-_UI_X)/tabW);
        uiTab=["elements","units","clones"][Math.min(ti,2)]||"elements";
        return true;
    }

    if (uiTab==="elements") {
        const index=Math.floor((y-py0-_UI_TAB_H)/_UI_ROW_H);
        const element=ELEMENTS[index];
        if (!element||!unlockedElements.has(element.id)) return false;
        player.selectedElement=element.id; selectedRole=null; return true;
    } else if (uiTab==="units") {
        const unitRH=Math.floor(_UI_CONTENT_H/3);
        const roleIndex=Math.floor((y-py0-_UI_TAB_H)/unitRH);
        const roles=["brawler","sniper","camper"];
        if (roleIndex>=0&&roleIndex<3) {
            selectedRole=(selectedRole===roles[roleIndex])?null:roles[roleIndex];
            return true;
        }
    } else if (uiTab==="clones") {
        // Clicking in clones tab selects/deselects clones for commanding — handled via getCommandPool
        return true;
    }
    return false;
}
