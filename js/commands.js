// ─────────────────────────────────────────────────────────
//  COMMAND / RADIAL SYSTEM
// ─────────────────────────────────────────────────────────
function performElementJob(actor, tile) {
    switch(actor.element) {
        case "fire":    spawnFireWall(tile.x, tile.y); break;
        case "ping":    disruptEnemiesAt(tile.x, tile.y); break;
        case "psychic": frenzyEnemiesAt(tile.x, tile.y); break;
    }
}

function issueJobCommand(tile) {
    const pool=getCommandPool().filter(a=>!a.job).slice(0,4);
    pool.forEach(a => { a.job={ type:"elementJob", target:tile, executed:false, timer:0 }; });
}

function issueMoveCommand(tile) {
    getCommandPool().forEach(a => { a.job={ type:"move", target:tile }; a.stance="hold"; });
}

function issueReconstruct(pylon) {
    if (!pylon||!followers||followers.length===0) return;
    if (!pylon.reconstructing) { pylon.reconstructing=false; pylon.reconstructProgress=0; pylon.workers=[]; }
    if (pylon.reconstructing) return;
    const pool=(followerByElement[player.selectedElement]||[]).filter(a=>!a.job).slice(0,4);
    if (pool.length===0) return;
    pylon.reconstructing=true; pylon.reconstructProgress=0; pylon.workers=pool;
    pool.forEach(a => { a.job={ type:"reconstruct", target:pylon }; });
}

// ── ELEMENT PICKER ────────────────────────────────────────
function openElementPicker(mode, target) {
    elementPickerMode   = mode;
    elementPickerTarget = target;
    elementPickerOpen   = true;
}

function closeElementPicker() {
    elementPickerOpen   = false;
    elementPickerMode   = null;
    elementPickerTarget = null;
}

function _executeBuild(el) {
    if (!_epTarget || shardCount < 10) {
        floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"NEED 10 SHARDS",color:"#f44",life:90,vy:-0.2});
        return;
    }
    const t = _epTarget;
    shardCount -= 10; saveShards();
    t.pillar=true; t.pillarTeam="green"; t.pillarCol="#0f8"; t.maxHealth=20;
    t.upgraded=false; t.destroyed=false;
    t.attackMode=false; t.waveMode=false;
    t.attackModeElement=null; t.attackModeColor=null;
    t.reconstructing=false; t.workers=[];
    if (buildMode) {
        t.constructing=true; t.constructProgress=0; t.health=0;
        const builderPool=[...getCommandPool().filter(a=>!a.dead&&!a.job),...followers.filter(a=>!a.dead&&!a.job)]
            .filter((a,i,arr)=>arr.indexOf(a)===i).slice(0,4);
        builderPool.forEach(builder=>{
            const speedMult=[1,0.6,0.45,0.35][Math.min(builderPool.length-1,3)];
            const baseBuildTime=(builder.element==="core")?60:1800;
            builder.job={type:"build_pylon",target:t,buildTime:Math.max(30,Math.round(baseBuildTime*speedMult))};
        });
        // Store element to apply once built
        t.chosenElement = el.id; t.chosenColor = el.color;
    } else {
        t.health=20; t.constructing=false; t.constructProgress=1;
        // Immediately apply element — find a follower to merge
        _sendMergeFollower(t, el);
    }
    floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"PYLON BUILT — "+el.label.toUpperCase(),color:"#0f8",life:100,vy:-0.2});
}

function _executeUpgrade(el) {
    const pylon = _epTarget;
    if (!pylon || !pylon.pillar || pylon.destroyed) return;
    if (pylon.attackMode || pylon.waveMode) {
        // Already upgraded — just swap element directly
        pylon.attackModeElement = el.id;
        pylon.attackModeColor   = el.color;
        floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"PYLON → "+el.label.toUpperCase(),color:el.color,life:100,vy:-0.2});
    } else {
        // Not yet upgraded — send a follower to merge; store chosen element
        pylon.chosenElement = el.id;
        pylon.chosenColor   = el.color;
        _sendMergeFollower(pylon, el);
        floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"UPGRADING WITH "+el.label.toUpperCase(),color:el.color,life:100,vy:-0.2});
    }
}

function _sendMergeFollower(pylon, el) {
    // Prefer a follower of the chosen element (camper first), then any idle follower
    let best = null;
    const elPool = (followerByElement[el.id]||[]).filter(a=>!a.dead&&!a.job);
    best = elPool.find(a=>a.role==="camper") || elPool[0] || null;
    if (!best) {
        let bd = Infinity;
        followers.forEach(f=>{ if(!f.dead&&!f.job){const d=Math.hypot(f.x-pylon.x,f.y-pylon.y);if(d<bd){bd=d;best=f;}} });
    }
    if (best) {
        best.job = { type:"merge_pylon", target:pylon };
        pylon.pendingUpgrade  = true;
        pylon.upgradeFollower = best;
    }
}

// ── INFO PANEL ────────────────────────────────────────────
function openInfoPanel(targetTile) {
    infoPanelTarget = targetTile;
    infoPanelOpen   = true;
}

function closeInfoPanel() {
    infoPanelOpen   = false;
    infoPanelTarget = null;
}

// ── COMMAND EXECUTION ─────────────────────────────────────
function executeCommand() {
    if (!selectedRadialAction) { commandMode=false; return; }
    if (!commandMode) return;
    const isNestCmd = selectedRadialAction==="destroy_nest"||selectedRadialAction==="connect_nest"||selectedRadialAction==="attack_nest";
    if (!commandTarget && !isNestCmd) { commandMode=false; selectedRadialAction=null; return; }
    if (!commandTarget && commandNestTarget) commandTarget=commandNestTarget;

    switch(selectedRadialAction) {
        // ── TOP: BUILD / UPGRADE ──────────────────────────
        case "build_upgrade": {
            const pylon = commandTarget;
            if (pylon && pylon.pillar && !pylon.destroyed) {
                openElementPicker("upgrade", pylon);
            } else if (commandTarget) {
                if (shardCount >= 10) {
                    openElementPicker("build", commandTarget);
                } else {
                    floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"NEED 10 SHARDS TO BUILD",color:"#f44",life:90,vy:-0.2});
                }
            }
            break;
        }
        // ── DOWN: POSITION ────────────────────────────────
        case "position": {
            if (commandTarget) issueMoveCommand(commandTarget);
            break;
        }
        // ── RIGHT: INFO ───────────────────────────────────
        case "info": {
            openInfoPanel(commandTarget);
            break;
        }
        // ── LEFT: SWITCH (role / pylon mode) ─────────────
        case "switch_context": {
            const pylon = commandTarget;
            if (pylon && pylon.pillar && !pylon.destroyed && (pylon.attackMode || pylon.waveMode)) {
                // Toggle attack ↔ wave
                if (pylon.attackMode) { pylon.attackMode=false; pylon.waveMode=true; }
                else                  { pylon.waveMode=false;   pylon.attackMode=true; }
                floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,
                    text:"PYLON → "+(pylon.attackMode?"ATTACK":"WAVE")+" MODE",color:"#0f8",life:90,vy:-0.2});
            } else {
                // Cycle follower roles in command pool
                const roles=["brawler","sniper","camper"];
                const pool=getCommandPool().filter(a=>!a.dead);
                pool.forEach(f=>{ const i=roles.indexOf(f.role); f.role=roles[(i+1)%roles.length]; });
                if (pool.length>0)
                    floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,
                        text:"→ "+pool[0].role.toUpperCase(),color:"#0f8",life:90,vy:-0.2});
            }
            break;
        }
        // ── LEGACY NEST COMMANDS ──────────────────────────
        case "connect_nest": {
            if (commandNestTarget && commandNestTarget.nestHealth <= 0) {
                nestConnectMode  = true;
                pendingConnectNest = commandNestTarget;
                floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,
                    text:"TAP AN UPGRADED PYLON TO LINK",color:"#00ffcc",life:180,vy:-0.15});
            }
            break;
        }
        case "destroy_nest": {
            if (commandNestTarget && commandNestTarget.nestHealth > 0) {
                const pool=getCommandPool().filter(a=>!a.job).slice(0,5);
                pool.forEach(a => { a.job={ type:"destroy_nest", target:commandNestTarget }; });
            }
            break;
        }
        // ── REMAINING LEGACY CASES (attack, reconstruct, etc.) ──
        case "job":       issueJobCommand(commandTarget); break;
        case "reconstruct":
            if (commandTarget.pillar&&!commandTarget.destroyed) issueReconstruct(commandTarget);
            break;
        case "attack": {
            let enemy=getEnemyAtTile(commandTarget);
            if (!enemy) {
                let bd=2;
                actors.forEach(a=>{
                    if (a instanceof Predator&&!a.dead){
                        const dx=a.x-commandTarget.x,dy=a.y-commandTarget.y,d=Math.sqrt(dx*dx+dy*dy);
                        if(d<bd){bd=d;enemy=a;}
                    }
                });
            }
            if (!enemy) break;
            getCommandPool().filter(a=>!a.job).slice(0,5).forEach(a=>{a.job={type:"attack",target:enemy};});
            break;
        }
        case "move":   issueMoveCommand(commandTarget); break;
        case "attack_nest": {
            if (commandNestTarget) {
                getCommandPool().filter(a=>!a.job).slice(0,5).forEach(a=>{a.job={type:"move",target:commandNestTarget};a.stance="hold";});
            }
            break;
        }
    }
    commandMode=false; commandTarget=null; commandNestTarget=null;
}
