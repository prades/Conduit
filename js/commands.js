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

function executeCommand() {
    if (!selectedRadialAction) { commandMode=false; return; }
    if (!commandMode) return;
    // Nest commands don't require a floor commandTarget — allow them through
    const isNestCmd = selectedRadialAction==="destroy_nest"||selectedRadialAction==="connect_nest"||selectedRadialAction==="attack_nest";
    if (!commandTarget && !isNestCmd) { commandMode=false; selectedRadialAction=null; return; }
    // Fallback: use nest tile as commandTarget so other guards don't trip
    if (!commandTarget && commandNestTarget) commandTarget=commandNestTarget;
    switch(selectedRadialAction) {
        case "job":        issueJobCommand(commandTarget); break;
        case "reconstruct":
            if (commandTarget.pillar&&!commandTarget.destroyed) issueReconstruct(commandTarget);
            break;
        case "upgrade_pylon": {
            const pylon = commandTarget;
            if (pylon&&pylon.pillar&&!pylon.destroyed&&!pylon.attackMode&&!pylon.waveMode) {
                const el = player.selectedElement;
                // Prefer nearest camper of selected element, fallback to any nearest follower
                const pool = (followerByElement[el]||[]).filter(a=>!a.dead&&!a.job);
                let best = pool.find(a=>a.role==="camper")||pool[0]||null;
                if (!best) {
                    // fallback: any follower regardless of element
                    let bd=Infinity;
                    followers.forEach(f=>{
                        if (!f.dead&&!f.job) {
                            const d=Math.hypot(f.x-pylon.x,f.y-pylon.y);
                            if (d<bd) { bd=d; best=f; }
                        }
                    });
                }
                if (best) {
                    best.job = { type:"merge_pylon", target:pylon };
                    pylon.pendingUpgrade = true;
                    pylon.upgradeFollower = best;
                }
            }
            break;
        }
        case "set_wave_mode": {
            const pylon = commandTarget;
            if (pylon&&pylon.pillar&&!pylon.destroyed&&(pylon.attackMode||pylon.waveMode)) {
                pylon.attackMode = false;
                pylon.waveMode = true;
            }
            break;
        }
        case "set_attack_mode": {
            const pylon = commandTarget;
            if (pylon&&pylon.pillar&&!pylon.destroyed&&(pylon.attackMode||pylon.waveMode)) {
                pylon.attackMode = true;
                pylon.waveMode = false;
            }
            break;
        }
        case "attack": {
            let enemy=getEnemyAtTile(commandTarget);
            if (!enemy) {
                let bd=2;
                actors.forEach(a => {
                    if (a instanceof Predator&&!a.dead) {
                        const dx=a.x-commandTarget.x, dy=a.y-commandTarget.y, d=Math.sqrt(dx*dx+dy*dy);
                        if (d<bd) { bd=d; enemy=a; }
                    }
                });
            }
            if (!enemy) break;
            const pool=getCommandPool().filter(a=>!a.job).slice(0,5);
            pool.forEach(a => { a.job={ type:"attack", target:enemy }; });
            break;
        }
        case "connect_nest": {
            // Enter pylon-select mode: player taps a blinking pylon to link it
            if (commandNestTarget && commandNestTarget.nestHealth <= 0) {
                nestConnectMode  = true;
                pendingConnectNest = commandNestTarget;
                floatingTexts.push({ x:canvas.width/2, y:canvas.height/2-80,
                    text:"TAP AN UPGRADED PYLON TO LINK", color:"#00ffcc", life:180, vy:-0.15 });
            }
            break;
        }
        case "attack_nest": {
            // Send followers to the nest pod location
            if (commandNestTarget) {
                const pool=getCommandPool().filter(a=>!a.job).slice(0,5);
                pool.forEach(a => { a.job={ type:"move", target:commandNestTarget }; a.stance="hold"; });
            }
            break;
        }
        case "destroy_nest": {
            // Send followers to attack and destroy a live nest pod
            if (commandNestTarget && commandNestTarget.nestHealth > 0) {
                const pool=getCommandPool().filter(a=>!a.job).slice(0,5);
                pool.forEach(a => { a.job={ type:"destroy_nest", target:commandNestTarget }; });
            }
            break;
        }
        case "move":  issueMoveCommand(commandTarget); break;
        case "build":
            if (shardCount>=10&&commandTarget&&(!commandTarget.pillar||commandTarget.destroyed)) {
                shardCount-=10; saveShards();
                // Reset all pylon state (covers rebuilding on destroyed pylon tiles)
                commandTarget.pillar=true; commandTarget.pillarTeam="green";
                commandTarget.pillarCol="#0f8"; commandTarget.maxHealth=20;
                commandTarget.upgraded=false; commandTarget.destroyed=false;
                commandTarget.attackMode=false; commandTarget.waveMode=false;
                commandTarget.attackModeElement=null; commandTarget.attackModeColor=null;
                commandTarget.reconstructing=false; commandTarget.workers=[];
                if (buildMode) {
                    // Construction mode — up to 4 builders, each reduces build time
                    commandTarget.constructing=true; commandTarget.constructProgress=0;
                    commandTarget.health=0;
                    const builderPool = [
                        ...getCommandPool().filter(a=>!a.dead&&!a.job),
                        ...followers.filter(a=>!a.dead&&!a.job)
                    ].filter((a,i,arr)=>arr.indexOf(a)===i).slice(0,4);
                    builderPool.forEach(builder => {
                        // Each additional builder reduces time: 1→base, 2→×0.6, 3→×0.45, 4→×0.35
                        const speedMult = [1, 0.6, 0.45, 0.35][Math.min(builderPool.length-1,3)];
                        const baseBuildTime = (builder.element==="core") ? 60 : 1800;
                        const buildTime = Math.max(30, Math.round(baseBuildTime * speedMult));
                        builder.job={type:"build_pylon",target:commandTarget,buildTime};
                    });
                } else {
                    commandTarget.health=20;
                    commandTarget.constructing=false; commandTarget.constructProgress=1;
                }
            }
            break;
    }
    commandMode=false; commandTarget=null; commandNestTarget=null;
}
