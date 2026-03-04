// ─────────────────────────────────────────────────────────
//  FOLLOWER ELEMENT UI
// ─────────────────────────────────────────────────────────
function drawFollowerElementUI() {
    const x=20, rowH=28, width=180;
    const totalH=ELEMENTS.length*rowH;
    const y=canvas.height-20-totalH;
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    ctx.font="13px monospace"; ctx.textBaseline="middle";
    ELEMENTS.forEach((el,i)=>{
        const yy=y+i*rowH;
        const unlocked=unlockedElements.has(el.id);
        const selected=player.selectedElement===el.id;
        const count=followerByElement[el.id]?.length||0;
        ctx.fillStyle=selected?"rgba(255,255,255,0.12)":"rgba(0,0,0,0.65)";
        ctx.fillRect(x,yy,width,rowH);
        ctx.strokeStyle=unlocked?el.color:"#333"; ctx.lineWidth=selected?2:1;
        ctx.strokeRect(x,yy,width,rowH);
        ctx.fillStyle=unlocked?el.color:"#222"; ctx.fillRect(x+6,yy+6,14,rowH-12);
        ctx.fillStyle=unlocked?"#fff":"#555"; ctx.textAlign="left";
        ctx.fillText(el.label,x+28,yy+rowH/2);
        if (unlocked) {
            // role breakdown for this element
            const pool = followerByElement[el.id] || [];
            const brawlers = pool.filter(a=>a.role==="brawler").length;
            const snipers  = pool.filter(a=>a.role==="sniper").length;
            const campers  = pool.filter(a=>a.role==="camper").length;

            // count on right
            ctx.textAlign="right";
            ctx.fillText(count, x+width-10, yy+rowH/2);

            // tiny role icons below label  B/S/C
            ctx.font="9px monospace";
            ctx.fillStyle="#f88"; ctx.textAlign="left";
            ctx.fillText("B:"+brawlers, x+28, yy+rowH-6);
            ctx.fillStyle="#88f";
            ctx.fillText("S:"+snipers, x+58, yy+rowH-6);
            ctx.fillStyle="#8f8";
            ctx.fillText("C:"+campers, x+88, yy+rowH-6);
            ctx.font="13px monospace";
        }
    });
    ctx.restore();
}

function handleFollowerUIClick(x, y) {
    const baseX=20, rowH=28, width=180;
    const totalH=ELEMENTS.length*rowH, baseY=canvas.height-20-totalH;
    if (x<baseX||x>baseX+width||y<baseY||y>baseY+totalH) return false;
    const index=Math.floor((y-baseY)/rowH);
    const element=ELEMENTS[index];
    if (!element||!unlockedElements.has(element.id)) return false;
    player.selectedElement=element.id; return true;
}
