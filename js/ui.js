// ─────────────────────────────────────────────────────────
//  FOLLOWER ELEMENT / UNITS UI  (two-tab panel)
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
    const tabW=w/2;
    [["ELEM","elements"],["UNITS","units"]].forEach(([label,id],i)=>{
        const active=uiTab===id;
        ctx.fillStyle=active?"rgba(0,255,136,0.18)":"rgba(0,0,0,0.65)";
        ctx.fillRect(x+i*tabW,py0,tabW,th);
        ctx.strokeStyle=active?"#0f8":"#333"; ctx.lineWidth=active?2:1;
        ctx.strokeRect(x+i*tabW,py0,tabW,th);
        ctx.fillStyle=active?"#0f8":"#555"; ctx.font="11px monospace"; ctx.textAlign="center";
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
    } else {
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

    // Tab row
    if (y<py0+_UI_TAB_H) {
        uiTab=(x<_UI_X+_UI_W/2)?"elements":"units";
        return true;
    }

    if (uiTab==="elements") {
        const index=Math.floor((y-py0-_UI_TAB_H)/_UI_ROW_H);
        const element=ELEMENTS[index];
        if (!element||!unlockedElements.has(element.id)) return false;
        player.selectedElement=element.id; selectedRole=null; return true;
    } else {
        const unitRH=Math.floor(_UI_CONTENT_H/3);
        const roleIndex=Math.floor((y-py0-_UI_TAB_H)/unitRH);
        const roles=["brawler","sniper","camper"];
        if (roleIndex>=0&&roleIndex<3) {
            selectedRole=(selectedRole===roles[roleIndex])?null:roles[roleIndex];
            return true;
        }
    }
    return false;
}
