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
// TWO STAGES. First WHAT the pylon is — an ATTACK turret, a WAVE pylon, a
// CONNECTOR or a GENERATOR — and then, only for attack or wave, its ELEMENT.
// The same picker serves BUILD (a new pylon), UPGRADE (an existing one) and
// CONVERT (an element pylon switching between attack and wave; no element step).
// One layout function feeds both the drawing and the tap handling.
const _EP_W = 310, _EP_HEADER_H = 58, _EP_FOOT_H = 40;
const PYLON_KINDS = [
    { id: "attack",     label: "ATTACK TURRET",    note: "shoots what comes near",       color: "#ff7755" },
    { id: "support",    label: "SUPPORT PYLON",    note: "helps allies nearby", color: "#7fffb0" },
    { id: "disruption", label: "DISRUPTION PYLON", note: "hits enemies nearby", color: "#c08cff" },
    { id: "connector", label: "CONNECTOR",     note: "long-range power relay",      color: CONNECTOR_COLOR },
    { id: "generator", label: "SHIELD GEN",    note: "powers pylons, shields squad", color: GENERATOR_COLOR },
];
function _epItems() {
    if (elementPickerStage === "element") {
        // A support or disruption pylon is that role BECAUSE of its element,
        // so the element step lists only the elements that do that job.
        const els = (elementPickerKind === "support" || elementPickerKind === "disruption")
            ? ELEMENTS.filter(e => waveRole(e.id) === elementPickerKind) : ELEMENTS;
        return els.map(e => ({ kind: "element", el: e }));
    }
    // CONVERT keeps the element, so it offers the turret and the one wave role
    // that element has.
    const t = elementPickerTarget;
    const kinds = elementPickerMode === "convert"
        ? PYLON_KINDS.filter(k => k.id === "attack" || (t && k.id === waveRole(t.attackModeElement)))
        : PYLON_KINDS;
    return kinds.map(k => ({ kind: "type", k }));
}
function _epLayout() {
    const items = _epItems();
    const cols = elementPickerStage === "element" ? 3 : 2, rowH = elementPickerStage === "element" ? 44 : 56;
    const rows = Math.ceil(items.length / cols);
    const pw = _EP_W, ph = _EP_HEADER_H + rows * rowH + _EP_FOOT_H;
    const px = Math.round((canvas.width - pw) / 2), py = Math.round((canvas.height - ph) / 2);
    const cw = Math.floor(pw / cols);
    const cells = items.map((it, i) => ({ it, x: px + (i % cols) * cw, y: py + _EP_HEADER_H + Math.floor(i / cols) * rowH, w: cw, h: rowH }));
    const fy = py + _EP_HEADER_H + rows * rowH + 6;
    const hasBack = elementPickerStage === "element";
    const back = hasBack ? { x: px + 10, y: fy, w: (pw - 30) / 2, h: _EP_FOOT_H - 14 } : null;
    const cancel = hasBack ? { x: px + 20 + (pw - 30) / 2, y: fy, w: (pw - 30) / 2, h: _EP_FOOT_H - 14 }
                           : { x: px + 10, y: fy, w: pw - 20, h: _EP_FOOT_H - 14 };
    return { px, py, pw, ph, cells, back, cancel };
}
// Is this first-stage choice available? Relays need a nest in reach; CONVERT
// cannot "convert" a pylon into what it already is.
function _epKindState(k) {
    const t = elementPickerTarget;
    if ((k.id === "connector" || k.id === "generator") && !canPlaceGenerator(t).ok) return { ok: false, why: "NEEDS A NEST" };
    if (elementPickerMode === "convert" && t && ((k.id === "attack" && t.attackMode) || (isWaveKind(k.id) && t.waveMode)))
        return { ok: false, why: "CURRENT" };
    return { ok: true, why: null };
}

function drawElementPicker() {
    if (!elementPickerOpen) return;
    const L = _epLayout();
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    ctx.fillStyle = "rgba(4,16,10,0.97)"; ctx.strokeStyle = "#0f8"; ctx.lineWidth = 2;
    _epRoundRect(L.px, L.py, L.pw, L.ph, 10); ctx.fill(); ctx.stroke();
    // Title and sub-label
    const kindLabel = (PYLON_KINDS.find(k => k.id === elementPickerKind) || {}).label || "";
    const verb = elementPickerMode === "upgrade" ? "UPGRADE" : elementPickerMode === "convert" ? "CONVERT" : "BUILD";
    const title = elementPickerStage === "element" ? verb + " " + kindLabel + " — ELEMENT"
                : elementPickerMode === "convert" ? "CONVERT — WHAT SHOULD IT DO?"
                : verb + " — WHAT KIND OF PYLON?";
    ctx.fillStyle = "#0ff"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
    ctx.fillText(title, L.px + L.pw / 2, L.py + 22);
    const t = elementPickerTarget;
    const sub = elementPickerMode === "build" ? "Cost: " + PYLON_BUILD_COST + " shards"
              : elementPickerMode === "convert" ? "Keeps its element — free"
              : (t && (t.attackMode || t.waveMode) ? "Change — free" : "Requires a follower sacrifice");
    ctx.fillStyle = "#ff0"; ctx.font = "10px monospace"; ctx.fillText(sub, L.px + L.pw / 2, L.py + 42);
    for (const c of L.cells) {
        let color, label, note = null, ok = true, why = null;
        if (c.it.kind === "type") { const st = _epKindState(c.it.k); ok = st.ok; why = st.why; color = c.it.k.color; label = c.it.k.label; note = c.it.k.note; }
        else { color = c.it.el.color; label = c.it.el.label.toUpperCase(); ok = isPylonTypeUnlocked(c.it.el.id); }
        ctx.globalAlpha = ok ? 1 : 0.35;
        ctx.fillStyle = "rgba(10,26,16,0.9)"; ctx.strokeStyle = color; ctx.lineWidth = 1;
        _epRoundRect(c.x + 4, c.y + 4, c.w - 8, c.h - 8, 6); ctx.fill(); ctx.stroke();
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(c.x + 18, c.y + c.h / 2, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#fff"; ctx.font = c.it.kind === "type" ? "bold 10px monospace" : "10px monospace"; ctx.textAlign = "left";
        ctx.fillText(label, c.x + 30, c.y + c.h / 2 + (note || why ? -3 : 4));
        if (why || note) { ctx.fillStyle = why ? "#f88" : "#8fb8a8"; ctx.font = "8px monospace"; ctx.fillText(why || note, c.x + 30, c.y + c.h / 2 + 10); }
        ctx.globalAlpha = 1;
    }
    for (const [b, txt, col] of [[L.back, "← BACK", "#8fd"], [L.cancel, "CANCEL", "#666"]]) {
        if (!b) continue;
        ctx.fillStyle = "rgba(10,15,10,0.9)"; ctx.strokeStyle = "#444"; ctx.lineWidth = 1;
        _epRoundRect(b.x, b.y, b.w, b.h, 4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = col; ctx.font = "11px monospace"; ctx.textAlign = "center"; ctx.fillText(txt, b.x + b.w / 2, b.y + b.h / 2 + 4);
    }
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
    const L = _epLayout();
    const inside = (r) => r && tx >= r.x && tx <= r.x + r.w && ty >= r.y && ty <= r.y + r.h;
    if (tx < L.px || tx > L.px + L.pw || ty < L.py || ty > L.py + L.ph) { closeElementPicker(); return true; }
    if (inside(L.cancel)) { closeElementPicker(); return true; }
    if (inside(L.back)) { elementPickerStage = "type"; elementPickerKind = null; return true; }
    const cell = L.cells.find(c => inside(c));
    if (!cell) return true;
    const mode = elementPickerMode, target = elementPickerTarget;
    if (cell.it.kind === "type") {
        const k = cell.it.k, st = _epKindState(k);
        if (!st.ok) {
            if (st.why === "NEEDS A NEST") refuseGenerator(PYLON_PICKER_TYPES.find(e => e.id === (k.id === "connector" ? CONNECTOR_ID : GENERATOR_ID)));
            return true;
        }
        if (mode === "convert") {
            // Same element, the other mode.
            closeElementPicker();
            if (target) {
                _applyPylonKind(target, k.id);
                if (typeof _cacheAge !== "undefined") _cacheAge = -9999;
                floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"PYLON → "+k.label,color:k.color,life:90,vy:-0.2});
            }
            return true;
        }
        if (k.id === "connector" || k.id === "generator") {
            const el = PYLON_PICKER_TYPES.find(e => e.id === (k.id === "connector" ? CONNECTOR_ID : GENERATOR_ID));
            closeElementPicker();
            if (mode === "build") { pylonConfirmOpen = true; pylonConfirmEl = el; pylonConfirmTarget = target; pylonConfirmKind = null; }
            else _executeUpgrade(el, target, null);
            return true;
        }
        elementPickerKind = k.id; elementPickerStage = "element";
        return true;
    }
    const el = cell.it.el;
    if (!isPylonTypeUnlocked(el.id)) return true;
    const kind = elementPickerKind;
    closeElementPicker();
    if (mode === "build") { pylonConfirmOpen = true; pylonConfirmEl = el; pylonConfirmTarget = target; pylonConfirmKind = kind; }
    else _executeUpgrade(el, target, kind);
    return true;
}

// ─────────────────────────────────────────────────────────
//  INFO PANEL  (canvas-drawn)
// ─────────────────────────────────────────────────────────
const _IP_W = 280, _IP_ROW_H = 20, _IP_PAD = 14;
// Body text is 9px monospace, so roughly 5.4px per character. Wrapping to a
// character budget is exact for a fixed-width font rather than a guess.
const _IP_TEXT_CHARS = Math.floor((_IP_W - 24) / 5.4);

// The info panel has three pages: the target readout it has always had, the
// codex index, and one element's detail page.
function _infoRows() {
    if (infoPanelPage === 'codex')  return codexIndexRows(_IP_TEXT_CHARS);
    if (infoPanelPage === 'rules')  return codexRulesRows(_IP_TEXT_CHARS);
    if (infoPanelPage === 'generator') return codexGeneratorRows(_IP_TEXT_CHARS);
    if (infoPanelPage === 'infest')    return codexInfestRows(_IP_TEXT_CHARS);
    if (infoPanelPage === 'combos')    return codexComboRows(_IP_TEXT_CHARS);
    if (infoPanelPage)              return codexElementRows(infoPanelPage, _IP_TEXT_CHARS);
    return _buildInfoRows(infoPanelTarget);
}
// null means "no nav button" — a full-width CLOSE instead.
function _infoNavLabel() {
    if (infoPanelPage && infoPanelPage !== 'codex') return "\u2039 BACK";
    if (infoPanelPage === 'codex') return infoPanelTarget ? "\u2039 BACK" : null;
    return "PYLON CODEX";
}

function _infoTitle() {
    if (infoPanelPage === 'rules') return "PYLON RULES";
    if (infoPanelPage === 'generator') return "SHIELD GENERATOR";
    if (infoPanelPage === 'infest')    return "INFESTATION";
    if (infoPanelPage === 'combos')    return "ELEMENT COMBOS";
    if (infoPanelPage)             return "PYLON CODEX";
    return _buildInfoTitle(infoPanelTarget);
}

function drawInfoPanel() {
    if (!infoPanelOpen) return;
    const rows = _infoRows();
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
    const titleObj = _infoTitle();
    ctx.fillStyle = "#0ff"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
    ctx.fillText(titleObj, px + pw/2, py + 20);

    // Divider
    ctx.strokeStyle = "#0a4"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px+10, py+30); ctx.lineTo(px+pw-10, py+30); ctx.stroke();

    // Rows — three kinds: a divider (null), a {h}eading or {t}ext line, and the
    // original [label, value, colour] pair.
    const ryBase = py + 30 + _IP_ROW_H/2 + 2;
    rows.forEach((r, i) => {
        const ry = ryBase + i * _IP_ROW_H;
        if (r === null) {
            ctx.strokeStyle = "#0a3"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(px+10, ry); ctx.lineTo(px+pw-10, ry); ctx.stroke();
            return;
        }
        ctx.textBaseline = "middle";
        if (!Array.isArray(r)) {
            if (r.h !== undefined) {
                ctx.fillStyle = r.c || "#0ff"; ctx.font = "bold 10px monospace"; ctx.textAlign = "left";
                ctx.fillText(r.h, px + 12, ry);
            } else {
                ctx.fillStyle = r.c || "#9bb"; ctx.font = "9px monospace"; ctx.textAlign = "left";
                ctx.fillText(r.t, px + 12, ry);
            }
            return;
        }
        ctx.fillStyle = "#0a8"; ctx.font = "10px monospace"; ctx.textAlign = "left";
        ctx.fillText(r[0], px + 12, ry);
        // Value — may contain color annotation
        ctx.fillStyle = r[2] || "#aad"; ctx.textAlign = "right";
        ctx.fillText(r[1], px + pw - 12, ry);
        // A row carrying a nav payload gets a tap affordance.
        if (r[3] && (r[3].codexElement || r[3].codexPage)) {
            ctx.fillStyle = "#0a8"; ctx.font = "9px monospace"; ctx.textAlign = "right";
            ctx.fillText("›", px + pw - 4, ry);
        }
    });

    // Buttons. A nav button only appears when there is somewhere to go back to:
    // opened from Settings there is no target, so "back" would land on an empty
    // NO TARGET readout.
    const closeY = py + ph - 34;
    const navLabel = _infoNavLabel();
    const halfW   = Math.floor((pw - 24) / 2);
    if (navLabel) {
        ctx.fillStyle = "rgba(10,26,16,0.9)";
        ctx.strokeStyle = "#0a8"; ctx.lineWidth = 2;
        _epRoundRect(px + 10, closeY, halfW, 28, 4);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#0c9"; ctx.font = "10px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(navLabel, px + 10 + halfW/2, closeY + 14);
    }
    const closeX = navLabel ? px + pw - 10 - halfW : px + 10;
    const closeW = navLabel ? halfW : pw - 20;
    ctx.fillStyle = "rgba(10,26,16,0.9)";
    ctx.strokeStyle = "#0f8"; ctx.lineWidth = 2;
    _epRoundRect(closeX, closeY, closeW, 28, 4);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#0f8"; ctx.font = "11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("CLOSE", closeX + closeW/2, closeY + 14);

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
        const _PYLON_STYLE_NAMES={sentinel:"Sentinel"};
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
        const mode = targetTile.attackMode?"ATTACK":targetTile.waveMode?(waveRoleLabel(targetTile.attackModeElement)+(targetTile.waveAwake===false?" (STANDBY)":"")):"DORMANT";
        const team = targetTile.pillarTeam==="green"?"ALLY":"ENEMY";
        const teamCol = targetTile.pillarTeam==="green"?"#0f8":"#f44";
        const _PSTYLE_NAMES={sentinel:"Sentinel"};
        const _styleName=(_PSTYLE_NAMES[targetTile.pylonStyle]||"Unknown").toUpperCase();
        const rows = [
            ["DESIGN",  _styleName,                        "#88f"],
            ["TEAM",    team,                              teamCol],
            ["ELEMENT", el ? el.label.toUpperCase():"NONE", el?el.color:"#555"],
            ["MODE",    mode,                              "#ff0"],
            ["HP",      Math.ceil(targetTile.health)+" / "+targetTile.maxHealth, "#0f8"],
            ["STATUS",  targetTile.constructing?"BUILDING":targetTile.reconstructing?"REPAIRING":"ACTIVE", "#aad"],
        ];
        // Why it is lit or dark, in a sentence.
        if (typeof pylonPowerState === "function") {
            const ps = pylonPowerState(targetTile);
            rows.push(["POWER", ps.text, ps.colour]);
        }
        // What this pylon's element actually does, inline. Listing ELEMENT: FIRE
        // and leaving it there answered nothing.
        if (el && typeof codexPylonRows === "function") {
            const tier = (typeof networkStrength !== "undefined" && networkStrength[el.id]) || 0;
            rows.push(...codexPylonRows(el.id, _IP_TEXT_CHARS, tier));
        } else if (typeof codexDormantPylonRows === "function") {
            rows.push(...codexDormantPylonRows(_IP_TEXT_CHARS));
        }
        return rows;
    }
    return [["STATUS","No unit or pylon nearby","#555"]];
}

function _handleInfoPanelTap(tx, ty) {
    if (!infoPanelOpen) return false;
    const rows = _infoRows();
    const contentH = rows.length * _IP_ROW_H;
    const ph = _IP_PAD*2 + 28 + contentH + 38;
    const pw = _IP_W;
    const px = Math.round((canvas.width  - pw) / 2);
    const py = Math.round((canvas.height - ph) / 2);
    if (tx < px || tx > px+pw || ty < py || ty > py+ph) {
        closeInfoPanel();
        return true;
    }
    const closeY = py + ph - 34;
    if (ty >= closeY) {
        const halfW = Math.floor((pw - 24) / 2);
        if (_infoNavLabel() && tx <= px + 10 + halfW) {
            // Nav: into the codex, or back out of an element page.
            if (infoPanelPage && infoPanelPage !== 'codex') infoPanelPage = 'codex';
            else if (infoPanelPage === 'codex')             infoPanelPage = null;
            else                                            infoPanelPage = 'codex';
        } else {
            closeInfoPanel();
        }
        return true;
    }
    // A codex index row opens that element's page.
    const ryBase = py + 30 + _IP_ROW_H/2 + 2;
    const idx = Math.round((ty - ryBase) / _IP_ROW_H);
    const row = rows[idx];
    if (Array.isArray(row) && row[3]) {
        if (row[3].codexElement) infoPanelPage = row[3].codexElement;
        else if (row[3].codexPage) infoPanelPage = row[3].codexPage;
    }
    return true;
}


// ─────────────────────────────────────────────────────────
//  PYLON BUILD CONFIRMATION DIALOG
// ─────────────────────────────────────────────────────────
const _PC_W = 280, _PC_H = 180;

function drawPylonConfirm() {
    if (!pylonConfirmOpen || !pylonConfirmEl) return;
    const el = pylonConfirmEl;
    const canAfford = shardCount >= PYLON_BUILD_COST;
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
    ctx.shadowColor = el.color; ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(px + 36, py + 62, 8, 0, Math.PI*2); ctx.fill();
    ctx.shadowBlur =0;
    ctx.fillStyle = "#fff"; ctx.font = "13px monospace"; ctx.textAlign = "left";
    const _kl = isRelayId(el.id) ? "" : (isWaveKind(pylonConfirmKind) ? " " + waveRoleLabel(el.id) + " PYLON" : " TURRET");
    ctx.fillText(el.label.toUpperCase() + _kl, px + 52, py + 62);

    // Cost row
    ctx.fillStyle = canAfford ? "#ff0" : "#f44"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText("Cost: "+PYLON_BUILD_COST+" shards  (have: "+shardCount+")", px + pw/2, py + 92);

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
        if (shardCount >= PYLON_BUILD_COST) {
            const el = pylonConfirmEl, t = pylonConfirmTarget, kind = pylonConfirmKind;
            pylonConfirmOpen = false; pylonConfirmEl = null; pylonConfirmTarget = null; pylonConfirmKind = null;
            _executeBuildInstant(el, t, kind);
        } else {
            floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"NEED "+PYLON_BUILD_COST+" SHARDS",color:"#f44",life:90,vy:-0.2});
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
    if (pylonConfirmOpen)  return _handlePylonConfirmTap(tx, ty);
    if (elementPickerOpen) return _handleElementPickerTap(tx, ty);
    if (infoPanelOpen)     return _handleInfoPanelTap(tx, ty);
    if (settingsPanelOpen) return _handleSettingsPanelTap(tx, ty);
    return false;
}

// ─────────────────────────────────────────────────────────
//  SETTINGS PANEL  (canvas-drawn)
// ─────────────────────────────────────────────────────────
const _SP_W = 260, _SP_H = 214;
// Row geometry shared by the draw and tap handlers so they cannot drift apart.
const _SP_CODEX_Y = 82,  _SP_CODEX_H = 30;
const _SP_RESET_Y = 122, _SP_RESET_H = 36;
const _SP_CLOSE_Y = 168, _SP_CLOSE_H = 30;

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
        // ── PYLON CODEX button — the rules reference ──
        const codexY = py + _SP_CODEX_Y;
        ctx.fillStyle = "rgba(6,22,18,0.9)";
        ctx.strokeStyle = "#0a8"; ctx.lineWidth = 1.5;
        _epRoundRect(px + 20, codexY, pw - 40, _SP_CODEX_H, 6);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#0c9"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("PYLON CODEX", px + pw/2, codexY + _SP_CODEX_H/2);

        // ── RESET GAME button ──
        const btnY = py + _SP_RESET_Y;
        ctx.fillStyle = "rgba(30,8,8,0.9)";
        ctx.strokeStyle = "#622"; ctx.lineWidth = 1.5;
        _epRoundRect(px + 20, btnY, pw - 40, _SP_RESET_H, 6);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#c44"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("RESET GAME", px + pw/2, btnY + 15);
        ctx.fillStyle = "#633"; ctx.font = "9px monospace";
        ctx.fillText("clears all progress", px + pw/2, btnY + 28);

        // ── CLOSE button ──
        const closeY = py + _SP_CLOSE_Y;
        ctx.fillStyle = "rgba(10,20,14,0.9)";
        ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
        _epRoundRect(px + 20, closeY, pw - 40, 30, 6);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#555"; ctx.font = "11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("CLOSE", px + pw/2, closeY + _SP_CLOSE_H/2);
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
        const codexY = py + _SP_CODEX_Y;
        const btnY   = py + _SP_RESET_Y;
        const closeY = py + _SP_CLOSE_Y;
        if (ty >= codexY && ty < codexY + _SP_CODEX_H) {
            openPylonCodex();
            return true;
        }
        if (ty >= btnY && ty < btnY + _SP_RESET_H) {
            settingsResetConfirm = true;
            return true;
        }
        if (ty >= closeY && ty < closeY + _SP_CLOSE_H) {
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
    ctx.setLineDash([8,5]); ctx.shadowColor="#ff0"; ctx.shadowBlur=0;
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
// ─────────────────────────────────────────────────────────
//  GROUP DUTY SWITCH  —  long press a row in the follower index
// ─────────────────────────────────────────────────────────
// REPORTED: "when you long press on the little index at the bottom left of all
// your followers, you can switch them to working or fighting by the selected
// group — campers, brawlers, snipers, or individual element types."
//
// Duty was a per-follower order: long press the unit itself, pick TO WORK. With
// a dozen followers that is a dozen long presses, and the index already groups
// them exactly the way the player thinks about them. So the index rows are the
// handle: one press, one group, one instruction.
const _DUTY_W = 132, _DUTY_H = 86, _DUTY_BTN_H = 22;   // two button rows: duty, then RE-ROLL ALL

// Who is in a group. One place, so the count on the menu and the followers it
// actually switches can never be two different sets.
function dutyGroupMembers(group) {
    if (!group || typeof followers === "undefined") return [];
    if (group.kind === "element") return followers.filter(a => !a.dead && a.element === group.id);
    if (group.kind === "role")    return followers.filter(a => !a.dead && a.role === group.id);
    return [];
}

// Put a whole group on work, or back on the line.
//
// Eligibility is filtered HERE rather than left to setFollowerDuty: that
// refuses one follower at a time with its own floating text, so sending ten
// ineligible followers to work would stack ten identical refusals on the
// screen. One group, one answer.
// RE-ROLL THE WHOLE GROUP. "Whenever you click on or long press on a follower
// element type, you can re-roll them as a group." Every member that can be
// re-rolled (not a clone, not already walking home) goes back to the Crystal
// to be made again — the same startFollowerReroll the single-follower ring uses.
function rerollGroup(group) {
    const members = dutyGroupMembers(group).filter(a => canRerollFollower(a));
    if (members.length === 0) {
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
            text: "NO " + group.label + " TO RE-ROLL", color: "#f88", life: 100, vy: -0.22, size: 12 });
        return 0;
    }
    members.forEach(a => startFollowerReroll(a, true));
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
        text: "RE-ROLLING " + members.length + " " + group.label + " AT THE CRYSTAL", color: "#0df", life: 110, vy: -0.25, size: 12 });
    return members.length;
}

function applyDutyToGroup(group, duty) {
    const members = dutyGroupMembers(group);
    if (members.length === 0) {
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
            text: "NO " + group.label + " TO ORDER", color: "#f88", life: 100, vy: -0.22, size: 12 });
        return 0;
    }
    const able = duty === "worker"
        ? members.filter(a => typeof canWorkMass === "function" && canWorkMass(a))
        : members;
    let moved = 0;
    for (const a of able) {
        if (a.duty === duty) continue;
        if (setFollowerDuty(a, duty, true)) moved++;
    }
    const verb = duty === "worker" ? "TO WORK" : "TO THE LINE";
    if (able.length === 0) {
        // The whole group is ineligible — say why once, naming the elements
        // that can, rather than refusing silently.
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
            text: "ONLY " + workerElementsLabel() + " CAN WORK",
            color: "#f88", life: 120, vy: -0.25, size: 12 });
        return 0;
    }
    const skipped = members.length - able.length;
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
        text: moved + " " + group.label + " " + verb
              + (skipped > 0 ? "  (" + skipped + " CANNOT WORK)" : ""),
        color: group.colour || "#0f8", life: 110, vy: -0.25, size: 12 });
    return moved;
}

// Which group a long press landed on, or null. Mirrors the tap handler's row
// arithmetic, because they are picking out of the same list.
function followerIndexGroupAt(x, y) {
    const py0 = _panelY();
    if (followerPoolMinimized) return null;
    if (x < _UI_X || x > _UI_X + _UI_W) return null;
    if (y < py0 + _UI_TAB_H || y > py0 + _UI_TOTAL_H) return null;

    if (uiTab === "elements") {
        const i = Math.floor((y - py0 - _UI_TAB_H) / _UI_ROW_H);
        const el = ELEMENTS[i];
        if (!el || !unlockedElements.has(el.id)) return null;
        return { kind: "element", id: el.id, label: el.label.toUpperCase(),
                 colour: el.color, rowY: py0 + _UI_TAB_H + i * _UI_ROW_H };
    }
    if (uiTab === "units") {
        const unitRH = Math.floor(_UI_CONTENT_H / 3);
        const i = Math.floor((y - py0 - _UI_TAB_H) / unitRH);
        const roles = [
            { id: "brawler", label: "BRAWLERS", colour: "#f88" },
            { id: "sniper",  label: "SNIPERS",  colour: "#88f" },
            { id: "camper",  label: "CAMPERS",  colour: "#8f8" },
        ];
        const r = roles[i];
        if (!r) return null;
        return { kind: "role", id: r.id, label: r.label, colour: r.colour,
                 rowY: py0 + _UI_TAB_H + i * unitRH };
    }
    return null;   // the CLONES tab is not a duty group
}

// Returns true when the press was the index's, so the world radial does not
// also open underneath it.
function openFollowerDutyMenu(x, y) {
    const group = followerIndexGroupAt(x, y);
    if (!group) return false;
    // Beside the panel rather than over it, so the row you pressed stays
    // visible and it is obvious which group the menu belongs to.
    const mx = _UI_X + _UI_W + 8;
    // Kept clear of the bottom edge, where the TUTORIAL button (an HTML
    // element, so always on top of the canvas) would cover its lower row.
    const my = Math.max(4, Math.min(canvas.height - _DUTY_H - 72 - (SAFE_BOTTOM || 0), group.rowY - 6));
    followerDutyMenu = { group, x: mx, y: my, w: _DUTY_W, h: _DUTY_H };
    return true;
}

function drawFollowerDutyMenu() {
    const m = followerDutyMenu;
    if (!m) return;
    const g = m.group;
    const members = dutyGroupMembers(g);
    const working = members.filter(a => a.duty === "worker").length;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = "rgba(4,8,12,0.95)";
    ctx.strokeStyle = g.colour || "#0f8"; ctx.lineWidth = 2;
    _epRoundRect(m.x, m.y, m.w, m.h, 5); ctx.fill(); ctx.stroke();

    // Who this is, and where they are now — so the player is not guessing what
    // the buttons will change.
    ctx.fillStyle = g.colour || "#0f8";
    ctx.font = "bold 10px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillText(g.label + " \u00d7" + members.length, m.x + 8, m.y + 11);
    ctx.fillStyle = "#6a7a88"; ctx.font = "8px monospace";
    ctx.fillText(working + " working, " + (members.length - working) + " on the line",
                 m.x + 8, m.y + 23);

    const rby = m.y + m.h - _DUTY_BTN_H - 6;                 // RE-ROLL ALL row
    const bw = (m.w - 18) / 2, by = rby - _DUTY_BTN_H - 6;    // duty row above it
    [["TO WORK", m.x + 6], ["TO LINE", m.x + 12 + bw]].forEach(([label, bx], i) => {
        const on = i === 0 ? working === members.length : working === 0;
        ctx.fillStyle = on ? "rgba(0,255,136,0.16)" : "rgba(0,0,0,0.6)";
        ctx.fillRect(bx, by, bw, _DUTY_BTN_H);
        ctx.strokeStyle = i === 0 ? "#0ca" : "#0f8"; ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, bw, _DUTY_BTN_H);
        ctx.fillStyle = i === 0 ? "#0ca" : "#0f8";
        ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
        ctx.fillText(label, bx + bw / 2, by + _DUTY_BTN_H / 2);
    });
    // RE-ROLL ALL, full width. It sends the whole group home, so the first tap
    // only arms it and says so; the second does it.
    const rollable = members.filter(a => canRerollFollower(a)).length;
    const armed = !!m.confirmReroll;
    ctx.fillStyle = armed ? "rgba(0,200,255,0.22)" : "rgba(0,0,0,0.6)";
    ctx.fillRect(m.x + 6, rby, m.w - 12, _DUTY_BTN_H);
    ctx.strokeStyle = "#0df"; ctx.lineWidth = armed ? 2 : 1;
    ctx.strokeRect(m.x + 6, rby, m.w - 12, _DUTY_BTN_H);
    ctx.fillStyle = rollable ? "#0df" : "#456"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
    ctx.fillText(armed ? "TAP AGAIN: RE-ROLL \u00d7" + rollable : "\u21bb RE-ROLL ALL \u00d7" + rollable,
                 m.x + m.w / 2, rby + _DUTY_BTN_H / 2);
    ctx.restore();
    m._btn = { bw, by, rby };
}

// Returns true when the tap was the menu's. Anything else closes it, which is
// how every other panel in the game behaves.
function handleFollowerDutyMenuTap(x, y) {
    const m = followerDutyMenu;
    if (!m) return false;
    const b = m._btn;
    if (b && y >= b.by && y <= b.by + _DUTY_BTN_H) {
        if (x >= m.x + 6 && x <= m.x + 6 + b.bw) {
            applyDutyToGroup(m.group, "worker"); followerDutyMenu = null; return true;
        }
        if (x >= m.x + 12 + b.bw && x <= m.x + 12 + b.bw * 2) {
            applyDutyToGroup(m.group, "fighter"); followerDutyMenu = null; return true;
        }
    }
    if (b && y >= b.rby && y <= b.rby + _DUTY_BTN_H && x >= m.x + 6 && x <= m.x + m.w - 6) {
        if (!m.confirmReroll) { m.confirmReroll = true; return true; }   // arm, stay open
        rerollGroup(m.group); followerDutyMenu = null; return true;
    }
    const inside = x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h;
    followerDutyMenu = null;
    return inside;   // a tap on the menu's own body is still the menu's
}

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
//  AMMO / ARMED CHIP
// ─────────────────────────────────────────────────────────
// Always shows the round count. While armed it turns hot and becomes a tap
// target that stows the weapon, so there is a way out that does not require
// finding an enemy to long-press again.
function drawAmmoChip() {
    const w = 128, h = 26;
    // Centred, but never overlapping the follower panel on the left — on a
    // phone-width screen a centred chip lands right on top of it.
    const x = Math.round(Math.max(canvas.width / 2 - w / 2, _UI_X + _UI_W + 12));
    const y = Math.round(canvas.height - 40 - (SAFE_BOTTOM || 0));
    _ATKCHIP.x = x; _ATKCHIP.y = y; _ATKCHIP.w = w; _ATKCHIP.h = h;

    const armed = playerAttackMode;
    const dry   = playerAmmo <= 0;
    const pulse = 0.65 + 0.35 * Math.sin((frame || 0) * 0.09);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle   = armed ? `rgba(40,16,6,${0.88})` : "rgba(8,14,12,0.72)";
    ctx.strokeStyle = armed ? (dry ? "#f55" : `rgba(255,140,60,${0.55 + pulse * 0.45})`)
                            : "rgba(90,110,100,0.55)";
    ctx.lineWidth = armed ? 2 : 1;
    _epRoundRect(x, y, w, h, 6);
    ctx.fill(); ctx.stroke();

    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "bold 10px monospace";
    ctx.fillStyle = armed ? (dry ? "#f66" : "#ffb070") : "rgba(140,160,150,0.8)";
    ctx.fillText(armed ? (dry ? "NO AMMO — TAP TO STOW" : "ARMED  ◆ " + playerAmmo)
                       : "AMMO  ◆ " + playerAmmo,
                 x + w / 2, y + h / 2);
    ctx.restore();
}
