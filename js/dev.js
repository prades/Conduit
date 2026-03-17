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
            sliderContainer.appendChild(cs("Tilt (Y)",-25,25,1,previewPredator.body.thorax.yOffset||0,v=>previewPredator.body.thorax.yOffset=v));
            break;
        case"abdomen":
            sliderContainer.appendChild(cs("Size",0.3,2.0,0.05,previewPredator.body.abdomen.size,v=>previewPredator.body.abdomen.size=v));
            sliderContainer.appendChild(cs("Segments",1,8,1,previewPredator.body.abdomen.segments,v=>previewPredator.body.abdomen.segments=v));
            sliderContainer.appendChild(cs("Taper",0.5,1.0,0.05,previewPredator.body.abdomen.taper,v=>previewPredator.body.abdomen.taper=v));
            sliderContainer.appendChild(cs("Y Offset",-25,25,1,previewPredator.body.abdomen.yOffset||0,v=>previewPredator.body.abdomen.yOffset=v));
            sliderContainer.appendChild(cs("Angle Offset",-1.6,1.6,0.05,
                previewPredator.body.abdomen.absoluteAngle !== undefined ? previewPredator.body.abdomen.absoluteAngle : (previewPredator.body.abdomen.angleOffset||0),
                v => { if (previewPredator.body.abdomen.absoluteAngle !== undefined) previewPredator.body.abdomen.absoluteAngle=v; else previewPredator.body.abdomen.angleOffset=v; }));
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
        case"mandibles":
            sliderContainer.appendChild(cs("Enabled",0,1,1,previewPredator.appendages.mandibles.enabled?1:0,v=>{previewPredator.appendages.mandibles.enabled=v>0.5;}));
            sliderContainer.appendChild(cs("Length",2,24,0.5,previewPredator.appendages.mandibles.length,v=>previewPredator.appendages.mandibles.length=v));
            sliderContainer.appendChild(cs("Spread",0.1,1.8,0.05,previewPredator.appendages.mandibles.spread,v=>previewPredator.appendages.mandibles.spread=v));
            sliderContainer.appendChild(cs("Thickness",1,7,0.5,previewPredator.appendages.mandibles.thickness,v=>previewPredator.appendages.mandibles.thickness=v));
            break;
        case"eyes":
            sliderContainer.appendChild(cs("Count(2=insect 8=spider)",2,8,6,previewPredator.appendages.eyes.count,v=>previewPredator.appendages.eyes.count=Math.round(v)));
            sliderContainer.appendChild(cs("Size",1,7,0.25,previewPredator.appendages.eyes.size,v=>previewPredator.appendages.eyes.size=v));
            sliderContainer.appendChild(cs("Glow",0,1,0.05,previewPredator.appendages.eyes.glow,v=>previewPredator.appendages.eyes.glow=v));
            sliderContainer.appendChild(cs("Leg Count(6=insect 8=spider)",6,8,2,previewPredator.appendages.legs.count,v=>previewPredator.appendages.legs.count=Math.round(v)));
            sliderContainer.appendChild(cs("Leg Spread",4,18,1,previewPredator.appendages.legs.spread,v=>previewPredator.appendages.legs.spread=v));
            break;
    }
}

// ── 4 iso view angles (SE=front, NE=right, NW=back, SW=left) ──
const _VIEW_ANGLES = [
    { angle: Math.PI*0.25,  label: "FRONT" },   // SE
    { angle: -Math.PI*0.25, label: "RIGHT" },    // NE
    { angle: -Math.PI*0.75, label: "BACK"  },    // NW
    { angle: Math.PI*0.75,  label: "LEFT"  },    // SW
];
let _previewViewLabel = null;  // DOM element for view label
let _attackBtn        = null;  // DOM element for attack-preview toggle

function _setPreviewAngle(angle) {
    if (!previewPredator) return;
    previewPredator.dirX = Math.cos(angle);
    previewPredator.dirY = Math.sin(angle);
    previewPredator.headAngle = angle;
    previewPredator.facing   = angle;
    if (_previewViewLabel) {
        // find nearest named view
        let best = _VIEW_ANGLES[0], bestDiff = Infinity;
        _VIEW_ANGLES.forEach(v => {
            const diff = Math.abs(((angle - v.angle) % (Math.PI*2) + Math.PI*3) % (Math.PI*2) - Math.PI);
            if (diff < bestDiff) { bestDiff = diff; best = v; }
        });
        _previewViewLabel.textContent = "◀ drag to rotate  |  " + best.label + " ▶";
    }
}

function initPreview() {
    previewCanvas=document.createElement("canvas");
    const vs=Math.min(window.innerWidth*0.88,420);
    previewCanvas.style.width=vs+"px"; previewCanvas.style.height=vs+"px";
    previewCanvas.width=vs; previewCanvas.height=vs;
    Object.assign(previewCanvas.style,{position:"fixed",left:"50%",top:"40%",transform:"translate(-50%,-50%)",
        background:"#0d2b14",border:"2px solid #0f8",borderRadius:"12px",zIndex:"9999",
        boxShadow:"0 0 30px rgba(0,255,136,0.5)",display:"none",touchAction:"none"});
    document.body.appendChild(previewCanvas);

    // ── Drag-to-orient on preview canvas ──
    let _dragActive = false, _dragLastX = 0, _dragLastY = 0;
    let _currentAngle = Math.PI * 0.25; // start at FRONT

    previewCanvas.addEventListener('pointerdown', e => {
        _dragActive = true;
        _dragLastX = e.clientX; _dragLastY = e.clientY;
        previewCanvas.setPointerCapture(e.pointerId);
        e.stopPropagation();
    });
    previewCanvas.addEventListener('pointermove', e => {
        if (!_dragActive || !previewPredator) return;
        const dx = e.clientX - _dragLastX;
        const dy = e.clientY - _dragLastY;
        // Map horizontal drag → yaw (rotation around vertical axis in iso)
        // and vertical drag → pitch (front/back flip)
        _currentAngle += dx * 0.025 + dy * 0.015;
        _dragLastX = e.clientX; _dragLastY = e.clientY;
        // Snap to nearest of 4 iso angles when close
        let snapBest = null, snapDiff = Infinity;
        _VIEW_ANGLES.forEach(v => {
            const diff = Math.abs((((_currentAngle - v.angle) % (Math.PI*2)) + Math.PI*3) % (Math.PI*2) - Math.PI);
            if (diff < 0.35 && diff < snapDiff) { snapDiff = diff; snapBest = v.angle; }
        });
        _setPreviewAngle(snapBest !== null ? snapBest : _currentAngle);
        e.stopPropagation();
    });
    previewCanvas.addEventListener('pointerup', () => { _dragActive = false; });
    previewCanvas.addEventListener('pointercancel', () => { _dragActive = false; });

    // ── View label under canvas ──
    _previewViewLabel = document.createElement("div");
    Object.assign(_previewViewLabel.style, {
        position:"fixed", left:"50%", top:"calc(40% + "+(vs*0.5+8)+"px)",
        transform:"translateX(-50%)",
        color:"#0f8", fontFamily:"monospace", fontSize:"11px",
        background:"rgba(0,0,0,0.7)", padding:"3px 10px", borderRadius:"4px",
        zIndex:"9999", display:"none", pointerEvents:"none"
    });
    _previewViewLabel.textContent = "◀ drag to rotate  |  FRONT ▶";
    document.body.appendChild(_previewViewLabel);

    const panel=document.createElement("div");
    panel.id="forgePanel";
    Object.assign(panel.style,{position:"fixed",bottom:"20px",left:"50%",transform:"translateX(-50%)",
        width:"320px",background:"#0e1418",border:"2px solid #0f8",borderRadius:"10px",padding:"12px",
        fontFamily:"monospace",color:"#0f8",zIndex:"9999",display:"none",maxHeight:"55vh",overflowY:"auto"});
    document.body.appendChild(panel);

    const select=document.createElement("select");
    ["Head","Thorax","Abdomen","Legs","Wings","Mandibles","Eyes"].forEach(l=>{
        const o=document.createElement("option"); o.value=l.toLowerCase(); o.textContent=l; select.appendChild(o);
    });
    select.onchange=()=>buildSliders(select.value);
    select.style.cssText="width:100%;margin-bottom:6px;";
    panel.appendChild(select);

    // ── Attack-animation toggle button ──
    _attackBtn = document.createElement("button");
    _attackBtn.textContent = "[ ATTACK ]";
    _attackBtn.style.cssText = "width:100%;margin-bottom:10px;padding:4px;background:rgba(0,0,0,0.7);border:1px solid #0a8;color:#0a8;font-family:monospace;font-size:11px;border-radius:4px;cursor:pointer;letter-spacing:1px;";
    _attackBtn.onpointerdown = e => e.stopPropagation();
    _attackBtn.onclick = () => {
        if (!previewPredator) return;
        previewPredator._attackPreview = !previewPredator._attackPreview;
        const on = previewPredator._attackPreview;
        _attackBtn.style.background  = on ? "rgba(0,255,136,0.18)" : "rgba(0,0,0,0.7)";
        _attackBtn.style.color       = on ? "#0f8" : "#0a8";
        _attackBtn.style.borderColor = on ? "#0f8" : "#0a8";
        if (!on) { previewPredator.state = "wander"; previewPredator.attackAnim = 0; }
    };
    panel.appendChild(_attackBtn);

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

    // ── SPECIES PRESETS ──
    const presetSep=document.createElement("div");
    presetSep.style.cssText="border-top:1px solid #0a4a2a;margin:10px 0 8px;padding-top:8px;font-size:10px;letter-spacing:2px;color:#0a8;";
    presetSep.textContent="── LOAD PRESET ──";
    panel.appendChild(presetSep);
    const presetRow=document.createElement("div");
    presetRow.style.cssText="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;";
    ["ant","beetle","scorpion","spider","mantis"].forEach(name=>{
        const btn=document.createElement("button");
        btn.textContent=name.toUpperCase();
        btn.style.cssText="flex:1;min-width:56px;padding:4px 2px;background:#0a1a10;border:1px solid #0a8;color:#0a8;font-family:monospace;font-size:10px;border-radius:3px;cursor:pointer;letter-spacing:1px;";
        btn.onpointerdown=e=>e.stopPropagation();
        btn.onclick=()=>{
            if (!previewPredator) return;
            // Reset body to defaults then apply the species
            previewPredator.body.head.size=0.45; previewPredator.body.thorax.size=0.9; previewPredator.body.thorax.yOffset=0;
            previewPredator.body.abdomen.size=0.75; previewPredator.body.abdomen.segments=1; previewPredator.body.abdomen.taper=0.9; previewPredator.body.abdomen.angleOffset=0; previewPredator.body.abdomen.yOffset=0;
            previewPredator.body.abdomen.round=false; previewPredator.isSpider=false; previewPredator.isMantis=false;
            previewPredator.hasStinger=false; previewPredator.armorPlated=false;
            previewPredator.appendages.antennae.enabled=false; previewPredator.appendages.wings.enabled=true;
            previewPredator.appendages.mandibles.enabled=true; previewPredator.appendages.mandibles.length=5; previewPredator.appendages.mandibles.spread=0.9;
            previewPredator.appendages.legs.count=6; previewPredator.appendages.legs.coxa=6; previewPredator.appendages.legs.femur=10; previewPredator.appendages.legs.tibia=14;
            previewPredator.segmentCornerRadius=6; previewPredator.segmentSpacing=10; previewPredator.heightBoost=1;
            previewPredator.speciesName=name;
            previewPredator.className="scout";
            applySpeciesBody(previewPredator, name);
            buildSliders(select.value); // refresh sliders to show new values
        };
        presetRow.appendChild(btn);
    });
    panel.appendChild(presetRow);

    // ── CREATE PREDATOR section ──
    const sep=document.createElement("div");
    sep.style.cssText="border-top:1px solid #0a4a2a;margin:12px 0 10px;padding-top:10px;font-size:11px;letter-spacing:2px;color:#0a8";
    sep.textContent="── CREATE PREDATOR ──";
    panel.appendChild(sep);

    // Name input
    const nameRow=document.createElement("div"); nameRow.style.marginBottom="8px";
    const nameLbl=document.createElement("div"); nameLbl.textContent="NAME"; nameLbl.style.cssText="font-size:10px;color:#0a8;margin-bottom:3px;";
    const nameInput=document.createElement("input");
    nameInput.type="text"; nameInput.placeholder="e.g. Stalker";
    nameInput.style.cssText="width:100%;box-sizing:border-box;background:#0a1a10;border:1px solid #0f8;color:#0f8;font-family:monospace;font-size:12px;padding:5px 7px;border-radius:4px;";
    nameRow.appendChild(nameLbl); nameRow.appendChild(nameInput);
    panel.appendChild(nameRow);

    // Team toggle
    const teamRow=document.createElement("div"); teamRow.style.cssText="display:flex;gap:8px;margin-bottom:10px;";
    const teamLbl=document.createElement("div"); teamLbl.textContent="TEAM"; teamLbl.style.cssText="font-size:10px;color:#0a8;margin-bottom:0;line-height:28px;min-width:40px;";
    let _selectedTeam="ally";
    const btnAlly=document.createElement("button");
    btnAlly.textContent="ALLY";
    btnAlly.style.cssText="flex:1;background:rgba(0,255,136,0.18);border:2px solid #0f8;color:#0f8;font-family:monospace;font-size:11px;padding:5px;border-radius:4px;cursor:pointer;";
    const btnEnemy=document.createElement("button");
    btnEnemy.textContent="ENEMY";
    btnEnemy.style.cssText="flex:1;background:#0e1418;border:1px solid #444;color:#555;font-family:monospace;font-size:11px;padding:5px;border-radius:4px;cursor:pointer;";
    const setTeam=(t)=>{
        _selectedTeam=t;
        btnAlly.style.background  = t==="ally"  ? "rgba(0,255,136,0.18)" : "#0e1418";
        btnAlly.style.borderColor = t==="ally"  ? "#0f8" : "#444";
        btnAlly.style.color       = t==="ally"  ? "#0f8" : "#555";
        btnAlly.style.borderWidth = t==="ally"  ? "2px"  : "1px";
        btnEnemy.style.background  = t==="enemy" ? "rgba(204,17,17,0.18)" : "#0e1418";
        btnEnemy.style.borderColor = t==="enemy" ? "#c11" : "#444";
        btnEnemy.style.color       = t==="enemy" ? "#f55" : "#555";
        btnEnemy.style.borderWidth = t==="enemy" ? "2px"  : "1px";
        // Recolor preview to show team color
        if (previewPredator) previewPredator.color = t==="ally" ? "#00ff88" : "#cc1111";
    };
    btnAlly.onclick  = ()=>setTeam("ally");
    btnEnemy.onclick = ()=>setTeam("enemy");
    teamRow.appendChild(teamLbl); teamRow.appendChild(btnAlly); teamRow.appendChild(btnEnemy);
    panel.appendChild(teamRow);

    // Cost note
    const costNote=document.createElement("div");
    costNote.style.cssText="font-size:10px;color:#ff0;margin-bottom:8px;text-align:center;";
    costNote.textContent="Cost: 100 shards";
    panel.appendChild(costNote);

    // Spawn button
    const spawnBtn=document.createElement("button");
    spawnBtn.textContent="SPAWN INTO WORLD";
    spawnBtn.style.cssText="width:100%;padding:8px;background:#0a1f14;border:2px solid #0f8;color:#0f8;font-family:monospace;font-size:12px;letter-spacing:1px;border-radius:5px;cursor:pointer;";
    spawnBtn.onpointerdown=e=>e.stopPropagation();
    spawnBtn.onclick=()=>{
        const name=(nameInput.value||"").trim()||"CUSTOM";
        if (typeof shardCount!=="undefined" && shardCount<100) {
            spawnBtn.textContent="NEED 100 SHARDS";
            spawnBtn.style.color="#f44";
            setTimeout(()=>{ spawnBtn.textContent="SPAWN INTO WORLD"; spawnBtn.style.color="#0f8"; },1500);
            return;
        }
        _spawnDesignedPredator(name.toUpperCase(), _selectedTeam);
        spawnBtn.textContent="SPAWNED: "+name.toUpperCase()+" ✓";
        setTimeout(()=>{ spawnBtn.textContent="SPAWN INTO WORLD"; },1800);
    };
    panel.appendChild(spawnBtn);

    previewCtx=previewCanvas.getContext("2d");
    previewPredator=new Predator("scout",PREDATOR_TYPES["scout"],0,0);
    previewPredator.state="wander";
    _setPreviewAngle(Math.PI * 0.25); // start facing FRONT
}

function _spawnDesignedPredator(name, team) {
    if (typeof shardCount!=="undefined") {
        shardCount=Math.max(0,shardCount-100);
        saveShards();
    }
    const isAlly = team==="ally";
    const def = {
        health: 80, moveSpeed: 0.04, power: 7,
        width:  previewPredator.dimensions.width,
        height: previewPredator.dimensions.height,
        color:  isAlly ? "#00ff88" : "#cc1111",
        reactionSpeed: 15, abdomenAttack: false,
        rangeDamage: 0, abdomenCooldown: 90
    };
    const p = new Predator("custom", def, (player ? player.x+2 : 2), (player ? player.y : 0));
    // Copy designer body
    p.body          = JSON.parse(JSON.stringify(previewPredator.body));
    p.appendages    = JSON.parse(JSON.stringify(previewPredator.appendages));
    p.joints        = JSON.parse(JSON.stringify(previewPredator.joints));
    p.visual        = JSON.parse(JSON.stringify(previewPredator.visual));
    p.dimensions    = { ...previewPredator.dimensions };
    p.segmentOrder  = [...previewPredator.segmentOrder];
    p.segmentSpacing= previewPredator.segmentSpacing;
    p.color         = isAlly ? "#00ff88" : "#cc1111";
    p.speciesName   = name.toLowerCase();
    p.className     = "custom";
    p.team          = isAlly ? "green" : "red";
    p.isClone       = false;
    p.state         = isAlly ? "wander" : "hunt";
    if (isAlly) {
        p.target = player; // ally follows/guards player area
    }
    actors.push(p);
    if (typeof floatingTexts!=="undefined") {
        floatingTexts.push({x:p.x,y:p.y-1,text:name+" CREATED!",color:isAlly?"#00ff88":"#f44",life:90,vy:-0.05});
    }
}

function updatePreview() {
    if(!devMode||!previewPredator||!previewCtx)return;
    previewCtx.clearRect(0,0,previewCanvas.width,previewCanvas.height);
    previewPredator.walkCycle += 0.2;
    if (previewPredator._attackPreview) {
        previewPredator.state = "attack";
        previewPredator.attackAnim += 0.18;
        if (previewPredator.attackAnim >= Math.PI) previewPredator.attackAnim = 0;
    } else if (previewPredator.state === "attack") {
        previewPredator.state = "wander";
        previewPredator.attackAnim = 0;
    }
    const px=previewCanvas.width*0.5, py=previewCanvas.height*0.58;
    // Subtle dot-grid
    previewCtx.fillStyle="rgba(0,255,136,0.07)";
    for(let i=20;i<previewCanvas.width;i+=24) for(let j=20;j<previewCanvas.height;j+=24)
        { previewCtx.beginPath(); previewCtx.arc(i,j,1,0,Math.PI*2); previewCtx.fill(); }
    // Floor shadow line
    const floorY=py+4;
    const grad=previewCtx.createLinearGradient(px-80,floorY,px+80,floorY);
    grad.addColorStop(0,"rgba(0,255,136,0)"); grad.addColorStop(0.5,"rgba(0,255,136,0.18)"); grad.addColorStop(1,"rgba(0,255,136,0)");
    previewCtx.strokeStyle=grad; previewCtx.lineWidth=1;
    previewCtx.beginPath(); previewCtx.moveTo(px-80,floorY); previewCtx.lineTo(px+80,floorY); previewCtx.stroke();
    const zoom = 2.2;
    previewCtx.save();
    previewCtx.translate(px, py);
    previewCtx.scale(zoom, zoom);
    drawNPC(previewPredator, 0, 0, previewCtx);
    previewCtx.restore();

    // ── Angle label at top of viewer ──
    const _a = Math.atan2(previewPredator.dirY, previewPredator.dirX);
    const _deg = Math.round(_a * 180 / Math.PI);
    let _dirLabel = _VIEW_ANGLES[0].label, _bestDiff = Infinity;
    _VIEW_ANGLES.forEach(v => {
        const d = Math.abs(((_a - v.angle) % (Math.PI*2) + Math.PI*3) % (Math.PI*2) - Math.PI);
        if (d < _bestDiff) { _bestDiff = d; _dirLabel = v.label; }
    });
    previewCtx.save();
    previewCtx.setTransform(1,0,0,1,0,0);
    previewCtx.fillStyle = "rgba(0,0,0,0.6)";
    previewCtx.fillRect(previewCanvas.width*0.5 - 62, 8, 124, 20);
    previewCtx.font = "bold 11px monospace";
    previewCtx.textAlign = "center";
    previewCtx.fillStyle = "#0f8";
    previewCtx.fillText(_dirLabel + "  " + _deg + "\u00b0", previewCanvas.width*0.5, 22);
    previewCtx.restore();
}

function toggleDevPreview() {
    devMode=!devMode;
    if(!previewCanvas)return;
    previewCanvas.style.display=devMode?"block":"none";
    if (_previewViewLabel) _previewViewLabel.style.display=devMode?"block":"none";
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
