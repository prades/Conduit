// ─────────────────────────────────────────────────────────
//  FOLLOWER ELEMENT / UNITS / CLONES UI  (three-tab panel)
// ─────────────────────────────────────────────────────────
const _UI_X=20, _UI_W=180, _UI_TAB_H=22, _UI_ROW_H=28;
// Total height constant — panel always same size regardless of tab
const _UI_CONTENT_H = ELEMENTS.length * _UI_ROW_H; // 168px
const _UI_TOTAL_H   = _UI_TAB_H + _UI_CONTENT_H;

function _panelY() {
    const contentH = followerPoolMinimized ? 0 : _UI_CONTENT_H;
    return canvas.height - 20 - _UI_TAB_H - contentH - (SAFE_BOTTOM || 0);
}

const _UI_MINIMIZE_BTN_W = 22;

function drawFollowerElementUI() {
    const x=_UI_X, w=_UI_W, th=_UI_TAB_H, rh=_UI_ROW_H;
    const py0=_panelY(), cy0=py0+th;

    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    ctx.textBaseline="middle";

    // ── TAB ROW ──────────────────────────────────────────
    // Leave room for minimize button on the right of the tab row
    const tabAreaW = w - _UI_MINIMIZE_BTN_W;
    const tabW=Math.floor(tabAreaW/3);
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

    // ── MINIMIZE / EXPAND BUTTON ──────────────────────────
    const btnX = x + tabAreaW;
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(btnX, py0, _UI_MINIMIZE_BTN_W, th);
    ctx.strokeStyle = "#444"; ctx.lineWidth = 1;
    ctx.strokeRect(btnX, py0, _UI_MINIMIZE_BTN_W, th);
    ctx.fillStyle = "#888"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center";
    ctx.fillText(followerPoolMinimized ? "▲" : "▼", btnX + _UI_MINIMIZE_BTN_W/2, py0 + th/2);

    // ── CONTENT ───────────────────────────────────────────
    if (followerPoolMinimized) { ctx.restore(); return; }
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
    const subText = elementPickerMode === "build" ? "Cost: 40 shards" :
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
            if (mode === "build") {
                // Show confirmation dialog before building
                pylonConfirmOpen = true; pylonConfirmEl = el; pylonConfirmTarget = target;
            } else if (mode === "upgrade") {
                _executeUpgrade(el, target);
            }
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
    if (targetTile.pillar && !targetTile.destroyed) {
        const _PYLON_STYLE_NAMES={sentinel:"Sentinel",spire:"Spire",monolith:"Monolith",antenna:"Antenna",shrine:"Shrine",conduit:"Conduit"};
        const _sName=_PYLON_STYLE_NAMES[targetTile.pylonStyle]||"Pylon";
        return _sName.toUpperCase()+" PYLON";
    }
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
        const _PSTYLE_NAMES={sentinel:"Sentinel",spire:"Spire",monolith:"Monolith",antenna:"Antenna",shrine:"Shrine",conduit:"Conduit"};
        const _styleName=(_PSTYLE_NAMES[targetTile.pylonStyle]||"Unknown").toUpperCase();
        return [
            ["DESIGN",  _styleName,                        "#88f"],
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

// ─────────────────────────────────────────────────────────
//  PYLON BUILD CONFIRMATION DIALOG
// ─────────────────────────────────────────────────────────
const _PC_W = 280, _PC_H = 180;

function drawPylonConfirm() {
    if (!pylonConfirmOpen || !pylonConfirmEl) return;
    const el = pylonConfirmEl;
    const canAfford = shardCount >= 40;
    const pw = _PC_W, ph = _PC_H;
    const px = Math.round((canvas.width  - pw) / 2);
    const py = Math.round((canvas.height - ph) / 2);

    ctx.save(); ctx.setTransform(1,0,0,1,0,0);

    // Background + border
    ctx.fillStyle   = "rgba(4,16,10,0.97)";
    ctx.strokeStyle = "#0f8"; ctx.lineWidth = 2;
    _epRoundRect(px, py, pw, ph, 10);
    ctx.fill(); ctx.stroke();

    // Title
    ctx.fillStyle = "#0ff"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("BUILD PYLON?", px + pw/2, py + 22);

    // Divider
    ctx.strokeStyle = "#0a4"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px+10, py+36); ctx.lineTo(px+pw-10, py+36); ctx.stroke();

    // Element row
    ctx.fillStyle = el.color;
    ctx.shadowColor = el.color; ctx.shadowBlur = 6;
    ctx.beginPath(); ctx.arc(px + 36, py + 62, 8, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff"; ctx.font = "13px monospace"; ctx.textAlign = "left";
    ctx.fillText(el.label.toUpperCase(), px + 52, py + 62);

    // Cost row
    ctx.fillStyle = canAfford ? "#ff0" : "#f44"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText("Cost: 40 shards  (have: "+shardCount+")", px + pw/2, py + 92);

    // SUBMIT button
    const submitY = py + 112;
    ctx.fillStyle = canAfford ? "rgba(0,60,20,0.95)" : "rgba(20,20,20,0.9)";
    ctx.strokeStyle = canAfford ? "#0f8" : "#444"; ctx.lineWidth = 2;
    _epRoundRect(px + 14, submitY, pw - 28, 28, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = canAfford ? "#0f8" : "#555"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
    ctx.fillText("SUBMIT", px + pw/2, submitY + 14);

    // CANCEL button
    const cancelY = py + 146;
    ctx.fillStyle = "rgba(10,10,10,0.9)";
    ctx.strokeStyle = "#444"; ctx.lineWidth = 1;
    _epRoundRect(px + 14, cancelY, pw - 28, 24, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#666"; ctx.font = "11px monospace";
    ctx.fillText("CANCEL", px + pw/2, cancelY + 12);

    ctx.restore();
}

function _handlePylonConfirmTap(tx, ty) {
    if (!pylonConfirmOpen) return false;
    const pw = _PC_W, ph = _PC_H;
    const px = Math.round((canvas.width  - pw) / 2);
    const py = Math.round((canvas.height - ph) / 2);

    // Tap outside → cancel
    if (tx < px || tx > px+pw || ty < py || ty > py+ph) {
        pylonConfirmOpen = false; pylonConfirmEl = null; pylonConfirmTarget = null;
        return true;
    }

    const submitY = py + 112, cancelY = py + 146;

    if (ty >= submitY && ty < submitY + 28) {
        if (shardCount >= 40) {
            const el = pylonConfirmEl, t = pylonConfirmTarget;
            pylonConfirmOpen = false; pylonConfirmEl = null; pylonConfirmTarget = null;
            _executeBuildInstant(el, t);
        } else {
            floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"NEED 40 SHARDS",color:"#f44",life:90,vy:-0.2});
        }
        return true;
    }
    if (ty >= cancelY && ty < cancelY + 24) {
        pylonConfirmOpen = false; pylonConfirmEl = null; pylonConfirmTarget = null;
        return true;
    }
    return true; // absorb all taps while open
}

// Central overlay tap dispatcher — call from pointerup handler
function handleOverlayPanelTap(tx, ty) {
    if (hackPanelOpen)     return handleHackPanelTap(tx, ty);
    if (pylonConfirmOpen)  return _handlePylonConfirmTap(tx, ty);
    if (elementPickerOpen) return _handleElementPickerTap(tx, ty);
    if (infoPanelOpen)     return _handleInfoPanelTap(tx, ty);
    if (settingsPanelOpen) return _handleSettingsPanelTap(tx, ty);
    return false;
}

// ─────────────────────────────────────────────────────────
//  SETTINGS PANEL  (canvas-drawn)
// ─────────────────────────────────────────────────────────
const _SP_W = 260, _SP_H = 200;

function drawSettingsPanel() {
    if (!settingsPanelOpen) return;
    const pw = _SP_W, ph = _SP_H;
    const px = Math.round((canvas.width  - pw) / 2);
    const py = Math.round((canvas.height - ph) / 2);

    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Backdrop blur overlay
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Panel background + border
    ctx.fillStyle   = "rgba(4,14,10,0.97)";
    ctx.strokeStyle = "#555"; ctx.lineWidth = 2;
    _epRoundRect(px, py, pw, ph, 10);
    ctx.fill(); ctx.stroke();

    // Gear icon row
    ctx.fillStyle = "#888"; ctx.font = "18px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("⚙", px + pw/2, py + 28);

    // Title
    ctx.fillStyle = "#aaa"; ctx.font = "bold 12px monospace";
    ctx.fillText("SETTINGS", px + pw/2, py + 52);

    // Divider
    ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px + 16, py + 66); ctx.lineTo(px + pw - 16, py + 66); ctx.stroke();

    if (!settingsResetConfirm) {
        // ── RESET GAME button ──
        const btnY = py + 82;
        ctx.fillStyle = "rgba(30,8,8,0.9)";
        ctx.strokeStyle = "#622"; ctx.lineWidth = 1.5;
        _epRoundRect(px + 20, btnY, pw - 40, 36, 6);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#c44"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("RESET GAME", px + pw/2, btnY + 18);
        ctx.fillStyle = "#633"; ctx.font = "9px monospace";
        ctx.fillText("clears all progress", px + pw/2, btnY + 30);

        // ── CLOSE button ──
        const closeY = py + 148;
        ctx.fillStyle = "rgba(10,20,14,0.9)";
        ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
        _epRoundRect(px + 20, closeY, pw - 40, 30, 6);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#555"; ctx.font = "11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("CLOSE", px + pw/2, closeY + 15);
    } else {
        // ── CONFIRMATION step ──
        ctx.fillStyle = "#f44"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("RESET ALL PROGRESS?", px + pw/2, py + 86);
        ctx.fillStyle = "#744"; ctx.font = "9px monospace";
        ctx.fillText("This cannot be undone.", px + pw/2, py + 102);

        // YES button
        const yesY = py + 116;
        ctx.fillStyle = "rgba(50,0,0,0.95)";
        ctx.strokeStyle = "#f44"; ctx.lineWidth = 2;
        _epRoundRect(px + 20, yesY, pw - 40, 30, 6);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#f44"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("YES — RESET", px + pw/2, yesY + 15);

        // CANCEL button
        const cancelY = py + 154;
        ctx.fillStyle = "rgba(10,20,14,0.9)";
        ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
        _epRoundRect(px + 20, cancelY, pw - 40, 28, 6);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#555"; ctx.font = "11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("CANCEL", px + pw/2, cancelY + 14);
    }

    ctx.restore();
}

function _handleSettingsPanelTap(tx, ty) {
    if (!settingsPanelOpen) return false;
    const pw = _SP_W, ph = _SP_H;
    const px = Math.round((canvas.width  - pw) / 2);
    const py = Math.round((canvas.height - ph) / 2);

    // Tap outside = close
    if (tx < px || tx > px + pw || ty < py || ty > py + ph) {
        settingsPanelOpen = false; settingsResetConfirm = false;
        return true;
    }

    if (!settingsResetConfirm) {
        const btnY  = py + 82;
        const closeY = py + 148;
        if (ty >= btnY && ty < btnY + 36) {
            settingsResetConfirm = true;
            return true;
        }
        if (ty >= closeY && ty < closeY + 30) {
            settingsPanelOpen = false; settingsResetConfirm = false;
            return true;
        }
    } else {
        const yesY    = py + 116;
        const cancelY = py + 154;
        if (ty >= yesY && ty < yesY + 30) {
            settingsPanelOpen = false; settingsResetConfirm = false;
            restartGame();
            return true;
        }
        if (ty >= cancelY && ty < cancelY + 28) {
            settingsResetConfirm = false;
            return true;
        }
    }
    return true; // absorb all taps while open
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
    const panelH = followerPoolMinimized ? _UI_TAB_H : _UI_TOTAL_H;
    if (x<_UI_X||x>_UI_X+_UI_W||y<py0||y>py0+panelH) return false;

    // Tab row — three tabs + minimize button
    if (y<py0+_UI_TAB_H) {
        const tabAreaW = _UI_W - _UI_MINIMIZE_BTN_W;
        // Minimize/expand button on the right
        if (x >= _UI_X + tabAreaW) {
            followerPoolMinimized = !followerPoolMinimized;
            return true;
        }
        const tabW=Math.floor(tabAreaW/3);
        const ti=Math.floor((x-_UI_X)/tabW);
        uiTab=["elements","units","clones"][Math.min(ti,2)]||"elements";
        // Expand if minimized when a tab is tapped
        if (followerPoolMinimized) followerPoolMinimized = false;
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

// ─────────────────────────────────────────────────────────
//  HACK PANEL  — math-based terminal bypass minigame
//  Player taps a wall panel while close → matrix appears.
//  Correct answer → shards collected.
//  Wrong  answer  → alarm triggered.
// ─────────────────────────────────────────────────────────
let hackPanelOpen      = false;
let hackPanelTile      = null;
let hackPanelMatrix    = [];              // 2-D array [row][col]
let hackPanelHighlight = { type: 'row', index: 0 };
let hackPanelSeries    = [];              // null = the missing slot
let hackPanelAnswers   = [];             // 4 numeric choices
let hackPanelCorrect   = 0;              // index of the correct answer
let hackPanelQuestion  = '';

const _HP_ROWS = 3, _HP_COLS = 4;
const _HP_W = 284, _HP_H = 340;
const _HP_ANS_W = 104, _HP_ANS_H = 38, _HP_ANS_GAP = 10;

function _generateHackChallenge() {
    // Build a fresh random matrix
    hackPanelMatrix = [];
    for (let r = 0; r < _HP_ROWS; r++) {
        hackPanelMatrix[r] = [];
        for (let c = 0; c < _HP_COLS; c++) {
            hackPanelMatrix[r][c] = Math.floor(Math.random() * 9) + 1;
        }
    }

    const useRow = Math.random() < 0.5;
    let answer;

    if (useRow) {
        const ri = Math.floor(Math.random() * _HP_ROWS);
        hackPanelHighlight = { type: 'row', index: ri };
        const sums = hackPanelMatrix.map(row => row.reduce((a, b) => a + b, 0));
        hackPanelSeries   = sums.map((s, i) => (i === ri ? null : s));
        answer = sums[ri];
        hackPanelQuestion = 'FIND THE MISSING ROW SUM';
    } else {
        const ci = Math.floor(Math.random() * _HP_COLS);
        hackPanelHighlight = { type: 'col', index: ci };
        const sums = [];
        for (let c = 0; c < _HP_COLS; c++) {
            sums.push(hackPanelMatrix.reduce((a, row) => a + row[c], 0));
        }
        hackPanelSeries   = sums.map((s, i) => (i === ci ? null : s));
        answer = sums[ci];
        hackPanelQuestion = 'FIND THE MISSING COLUMN SUM';
    }

    // Generate 3 distinct wrong answers close to the correct value
    const pool = new Set([answer]);
    let attempts = 0;
    while (pool.size < 4 && attempts < 60) {
        attempts++;
        const delta = Math.floor(Math.random() * 12) - 6;
        if (delta !== 0) pool.add(Math.max(1, answer + delta));
    }
    hackPanelAnswers = [...pool].sort(() => Math.random() - 0.5);
    hackPanelCorrect = hackPanelAnswers.indexOf(answer);
}

function openHackPanel(tile) {
    hackPanelTile = tile;
    _generateHackChallenge();
    hackPanelOpen = true;
}

function closeHackPanel() {
    hackPanelOpen = false;
    hackPanelTile = null;
}

function _hackPanelOrigin() {
    return {
        px: Math.round((canvas.width  - _HP_W) / 2),
        py: Math.round((canvas.height - _HP_H) / 2)
    };
}

// Returns screen rects for the 4 answer buttons (2 × 2 grid)
function _hackAnswerRects() {
    const { px, py } = _hackPanelOrigin();
    const totalW  = 2 * _HP_ANS_W + _HP_ANS_GAP;
    const startX  = px + (_HP_W - totalW) / 2;
    const row0Y   = py + _HP_H - 98;
    const rects   = [];
    for (let i = 0; i < 4; i++) {
        const col = i % 2, row = Math.floor(i / 2);
        rects.push({
            x: startX + col * (_HP_ANS_W + _HP_ANS_GAP),
            y: row0Y + row * (_HP_ANS_H + _HP_ANS_GAP),
            w: _HP_ANS_W,
            h: _HP_ANS_H
        });
    }
    return rects;
}

function drawHackPanel() {
    if (!hackPanelOpen) return;
    const { px, py } = _hackPanelOrigin();
    const pw = _HP_W, ph = _HP_H;

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Dim backdrop
    ctx.fillStyle = 'rgba(0,0,0,0.68)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Panel body
    ctx.fillStyle   = 'rgba(2,12,8,0.97)';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth   = 1.5;
    _epRoundRect(px, py, pw, ph, 10);
    ctx.fill();
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Inner glow border
    ctx.strokeStyle = 'rgba(0,255,136,0.18)'; ctx.lineWidth = 6;
    _epRoundRect(px + 1, py + 1, pw - 2, ph - 2, 10);
    ctx.stroke();

    // Title bar
    ctx.font = 'bold 10px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#00ff88';
    ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 8;
    ctx.fillText('◈  NEURAL BYPASS  ◈', px + pw / 2, py + 20);
    ctx.shadowBlur = 0;

    // Divider
    ctx.strokeStyle = '#0a3018'; ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 14, py + 33); ctx.lineTo(px + pw - 14, py + 33);
    ctx.stroke();

    // Question line
    ctx.font = 'bold 8px monospace'; ctx.fillStyle = '#44ee88'; ctx.textAlign = 'center';
    ctx.fillText(hackPanelQuestion, px + pw / 2, py + 46);

    // ── MATRIX GRID ──
    const CELL_W = 30, CELL_H = 24;
    const gridW  = _HP_COLS * CELL_W;
    const gridH  = _HP_ROWS * CELL_H;
    const gridX  = px + Math.round((pw - gridW) / 2);
    const gridY  = py + 58;

    for (let r = 0; r < _HP_ROWS; r++) {
        for (let c = 0; c < _HP_COLS; c++) {
            const cx = gridX + c * CELL_W;
            const cy = gridY + r * CELL_H;
            const isHL = (hackPanelHighlight.type === 'row' && r === hackPanelHighlight.index)
                      || (hackPanelHighlight.type === 'col' && c === hackPanelHighlight.index);

            ctx.fillStyle   = isHL ? 'rgba(0,255,136,0.13)' : 'rgba(0,18,8,0.85)';
            ctx.fillRect(cx + 1, cy + 1, CELL_W - 2, CELL_H - 2);
            ctx.strokeStyle = isHL ? '#00ff88' : '#0b3018';
            ctx.lineWidth   = isHL ? 1.2 : 0.7;
            ctx.strokeRect(cx + 0.5, cy + 0.5, CELL_W - 1, CELL_H - 1);

            ctx.font          = (isHL ? 'bold ' : '') + '11px monospace';
            ctx.textAlign     = 'center'; ctx.textBaseline = 'middle';
            ctx.fillStyle     = isHL ? '#00ffaa' : '#3d9960';
            if (isHL) { ctx.shadowColor = '#00ff88'; ctx.shadowBlur = 6; }
            ctx.fillText(hackPanelMatrix[r][c], cx + CELL_W / 2, cy + CELL_H / 2);
            ctx.shadowBlur = 0;
        }
    }

    // ── SEQUENCE ROW ──
    const seqY   = gridY + gridH + 22;
    const sLen   = hackPanelSeries.length;
    const BOX_W  = 30, BOX_H = 22, BOX_GAP = 6;
    const totalSW = sLen * (BOX_W + BOX_GAP) - BOX_GAP;
    const sStartX = px + Math.round((pw - totalSW) / 2);

    ctx.font = '7px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2d6644';
    ctx.fillText('SEQUENCE', px + pw / 2, seqY - 13);

    for (let i = 0; i < sLen; i++) {
        const bx      = sStartX + i * (BOX_W + BOX_GAP);
        const isMissing = hackPanelSeries[i] === null;
        ctx.fillStyle   = isMissing ? 'rgba(0,255,136,0.15)' : 'rgba(0,20,10,0.9)';
        ctx.strokeStyle = isMissing ? '#00ff88' : '#0c3520';
        ctx.lineWidth   = isMissing ? 1.5 : 0.8;
        ctx.fillRect(bx, seqY - BOX_H / 2, BOX_W, BOX_H);
        ctx.strokeRect(bx + 0.5, seqY - BOX_H / 2 + 0.5, BOX_W - 1, BOX_H - 1);

        ctx.font          = (isMissing ? 'bold ' : '') + '10px monospace';
        ctx.textAlign     = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle     = isMissing ? '#00ffcc' : '#3d9960';
        if (isMissing) { ctx.shadowColor = '#00ffcc'; ctx.shadowBlur = 6; }
        ctx.fillText(isMissing ? '?' : hackPanelSeries[i], bx + BOX_W / 2, seqY);
        ctx.shadowBlur = 0;
    }

    // Prompt arrow
    ctx.font = '7px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#1d4430';
    ctx.fillText('▼  SELECT ANSWER  ▼', px + pw / 2, seqY + BOX_H / 2 + 14);

    // ── ANSWER BUTTONS ──
    const rects = _hackAnswerRects();
    rects.forEach((r, i) => {
        ctx.fillStyle   = 'rgba(0,28,14,0.95)';
        ctx.strokeStyle = '#00cc55'; ctx.lineWidth = 1;
        _epRoundRect(r.x, r.y, r.w, r.h, 6);
        ctx.fill(); ctx.stroke();

        ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff44'; ctx.shadowBlur = 4;
        ctx.fillText(hackPanelAnswers[i], r.x + r.w / 2, r.y + r.h / 2);
        ctx.shadowBlur = 0;
    });

    // Abort hint
    ctx.font = '7px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#2a4030';
    ctx.fillText('[ TAP OUTSIDE TO ABORT ]', px + pw / 2, py + ph - 10);

    ctx.restore();
}

function handleHackPanelTap(tx, ty) {
    if (!hackPanelOpen) return false;
    const { px, py } = _hackPanelOrigin();

    // Tap outside the panel = abort (no penalty)
    if (tx < px || tx > px + _HP_W || ty < py || ty > py + _HP_H) {
        closeHackPanel();
        return true;
    }

    // Check answer buttons
    const rects = _hackAnswerRects();
    for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (tx >= r.x && tx <= r.x + r.w && ty >= r.y && ty <= r.y + r.h) {
            const tile = hackPanelTile;
            closeHackPanel();
            tile.panelActivated = true;
            // Remove from siphon cache so it's not processed again
            const ci = _wallPanelCache ? _wallPanelCache.indexOf(tile) : -1;
            if (ci !== -1) _wallPanelCache.splice(ci, 1);

            if (i === hackPanelCorrect) {
                const reward = tile.shardReward || 15;
                shardCount += reward;
                saveShards();
                shardUI.textContent = 'Shards: ' + shardCount;
                floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 60,
                    text: '+' + reward + ' SHARDS  ◈  BYPASS OK', color: '#00ff88', life: 150, vy: -0.25 });
            } else {
                triggerAlarm(tile.alarmType || 'proximity', tile.x, tile.y);
                floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 60,
                    text: '⚠  WRONG CODE — ALARM TRIGGERED', color: '#ff2200', life: 160, vy: -0.22 });
            }
            return true;
        }
    }

    return true; // absorb other taps within panel
}
