// ─────────────────────────────────────────────────────────
//  DEV PREVIEW SYSTEM
// ─────────────────────────────────────────────────────────
function buildSliders(section) {
    sliderContainer.innerHTML="";
    if(!previewPredator)return;
    const cs=(label,min,max,step,val,fn)=>{
        const w=document.createElement("div"); w.style.marginBottom="8px";
        const txt=document.createElement("div"); txt.textContent=label+": "+val; txt.style.fontSize="12px";
        const inp=document.createElement("input"); inp.type="range"; inp.min=min; inp.max=max; inp.step=step; inp.value=val; inp.style.width="100%";
        inp.oninput=function(){ txt.textContent=label+": "+inp.value; fn(parseFloat(inp.value)); };
        w.appendChild(txt); w.appendChild(inp); return w;
    };
    switch(section){
        case"head":
            sliderContainer.appendChild(cs("Size",0.2,1.5,0.05,previewPredator.body.head.size,v=>previewPredator.body.head.size=v));
            sliderContainer.appendChild(cs("Base Width",10,80,1,previewPredator.dimensions.width,v=>previewPredator.dimensions.width=v));
            sliderContainer.appendChild(cs("Base Height",6,50,1,previewPredator.dimensions.height,v=>previewPredator.dimensions.height=v));
            break;
        case"thorax":
            sliderContainer.appendChild(cs("Size",0.4,2.0,0.05,previewPredator.body.thorax.size,v=>previewPredator.body.thorax.size=v));
            break;
        case"abdomen":
            sliderContainer.appendChild(cs("Size",0.3,2.0,0.05,previewPredator.body.abdomen.size,v=>previewPredator.body.abdomen.size=v));
            sliderContainer.appendChild(cs("Segments",1,8,1,previewPredator.body.abdomen.segments,v=>previewPredator.body.abdomen.segments=v));
            sliderContainer.appendChild(cs("Taper",0.5,1.0,0.05,previewPredator.body.abdomen.taper,v=>previewPredator.body.abdomen.taper=v));
            break;
        case"legs":
            sliderContainer.appendChild(cs("Coxa",2,20,1,previewPredator.appendages.legs.coxa,v=>previewPredator.appendages.legs.coxa=v));
            sliderContainer.appendChild(cs("Femur",2,25,1,previewPredator.appendages.legs.femur,v=>previewPredator.appendages.legs.femur=v));
            sliderContainer.appendChild(cs("Tibia",2,30,1,previewPredator.appendages.legs.tibia,v=>previewPredator.appendages.legs.tibia=v));
            sliderContainer.appendChild(cs("Swing",0.05,1.0,0.05,previewPredator.appendages.legs.swingSpeed,v=>previewPredator.appendages.legs.swingSpeed=v));
            break;
        case"wings":
            sliderContainer.appendChild(cs("Length",4,40,1,previewPredator.appendages.wings.length,v=>previewPredator.appendages.wings.length=v));
            sliderContainer.appendChild(cs("Width",2,30,1,previewPredator.appendages.wings.width,v=>previewPredator.appendages.wings.width=v));
            sliderContainer.appendChild(cs("Flare",0,20,1,previewPredator.appendages.wings.angleOffset,v=>previewPredator.appendages.wings.angleOffset=v));
            break;
        case"visual":
            sliderContainer.appendChild(cs("Top Light",0,1,0.05,previewPredator.visual.topLight,v=>previewPredator.visual.topLight=v));
            sliderContainer.appendChild(cs("Wing Alpha",0.05,1,0.05,previewPredator.visual.wingAlpha,v=>previewPredator.visual.wingAlpha=v));
            break;
        case"sockets":
            sliderContainer.appendChild(cs("Leg Root Fwd",-40,40,1,previewPredator.joints.legRoot.forward,v=>previewPredator.joints.legRoot.forward=v));
            sliderContainer.appendChild(cs("Leg Root V",-40,40,1,previewPredator.joints.legRoot.vertical,v=>previewPredator.joints.legRoot.vertical=v));
            sliderContainer.appendChild(cs("Wing Root Fwd",-40,40,1,previewPredator.joints.wingRoot.forward,v=>previewPredator.joints.wingRoot.forward=v));
            sliderContainer.appendChild(cs("Wing Root V",-40,40,1,previewPredator.joints.wingRoot.vertical,v=>previewPredator.joints.wingRoot.vertical=v));
            break;
    }
}

function initPreview() {
    previewCanvas=document.createElement("canvas");
    const vs=Math.min(window.innerWidth*0.8,300);
    previewCanvas.style.width=vs+"px"; previewCanvas.style.height=vs+"px";
    previewCanvas.width=vs; previewCanvas.height=vs;
    Object.assign(previewCanvas.style,{position:"fixed",left:"50%",top:"50%",transform:"translate(-50%,-50%)",
        background:"#111",border:"2px solid #0f8",borderRadius:"12px",zIndex:"9999",
        boxShadow:"0 0 25px rgba(0,255,136,0.4)",display:"none"});
    document.body.appendChild(previewCanvas);

    const panel=document.createElement("div");
    panel.id="forgePanel";
    Object.assign(panel.style,{position:"fixed",bottom:"20px",left:"50%",transform:"translateX(-50%)",
        width:"320px",background:"#0e1418",border:"2px solid #0f8",borderRadius:"10px",padding:"12px",
        fontFamily:"monospace",color:"#0f8",zIndex:"9999",display:"none"});
    document.body.appendChild(panel);

    const select=document.createElement("select");
    ["Head","Thorax","Abdomen","Legs","Wings","Sockets","Visual"].forEach(l=>{
        const o=document.createElement("option"); o.value=l.toLowerCase(); o.textContent=l; select.appendChild(o);
    });
    select.onchange=()=>buildSliders(select.value);
    select.style.cssText="width:100%;margin-bottom:10px;";
    panel.appendChild(select);

    // DEV Toggle button
    const devBtn=document.createElement("button");
    devBtn.textContent="DEV";
    Object.assign(devBtn.style,{position:"fixed",right:"15px",top:"15px",zIndex:"9999",
        background:"#111",color:"#0f8",border:"1px solid #0f8",padding:"6px 10px",fontFamily:"monospace",cursor:"pointer"});
    devBtn.onclick=toggleDevPreview;
    document.body.appendChild(devBtn);

    sliderContainer=document.createElement("div");
    panel.appendChild(sliderContainer);
    buildSliders("head");

    previewCtx=previewCanvas.getContext("2d");
    previewPredator=new Predator("scout",PREDATOR_TYPES["scout"],0,0);
    previewPredator.state="wander";
    const pl=0.7,pyDir=0.4,len=Math.hypot(pl,pyDir);
    previewPredator.dirX=pl/len; previewPredator.dirY=pyDir/len;
    previewPredator.headAngle=Math.atan2(previewPredator.dirY,previewPredator.dirX);
}

function updatePreview() {
    if(!devMode||!previewPredator||!previewCtx)return;
    previewCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height);
    previewPredator.walkCycle+=0.2;
    const px=previewCanvas.width*0.5, py=previewCanvas.height*0.55;
    // grid
    previewCtx.strokeStyle="rgba(255,255,255,0.05)"; previewCtx.lineWidth=1;
    for(let i=0;i<previewCanvas.width;i+=20){previewCtx.beginPath();previewCtx.moveTo(i,0);previewCtx.lineTo(i,previewCanvas.height);previewCtx.stroke();}
    for(let j=0;j<previewCanvas.height;j+=20){previewCtx.beginPath();previewCtx.moveTo(0,j);previewCtx.lineTo(previewCanvas.width,j);previewCtx.stroke();}
    previewCtx.save();
    previewCtx.translate(px,py); previewCtx.scale(1.2,1.1); previewCtx.translate(-px,-py);
    drawNPC(previewPredator,px,py,previewCtx);
    previewCtx.restore();
}

function toggleDevPreview() {
    devMode=!devMode;
    if(!previewCanvas)return;
    previewCanvas.style.display=devMode?"block":"none";
    const panel=document.getElementById("forgePanel");
    if(panel) panel.style.display=devMode?"block":"none";
}

function rebuildPresetDropdown() {
    const select=document.querySelector("#forgePanel select:nth-child(2)");
    if(!select)return;
    select.innerHTML="";
    const base=document.createElement("option"); base.value=""; base.textContent="Base Scout"; select.appendChild(base);
    Object.keys(PREDATOR_PRESETS).forEach(k=>{ const o=document.createElement("option"); o.value=k; o.textContent=k; select.appendChild(o); });
}
