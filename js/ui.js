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
