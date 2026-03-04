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
    const pool=(followerByElement[player.selectedElement]||[]).filter(a=>!a.job).slice(0,3);
    pool.forEach(a => { a.job={ type:"elementJob", target:tile, executed:false, timer:0 }; });
}

function issueMoveCommand(tile) {
    const pool=followerByElement[player.selectedElement]||[];
    pool.forEach(a => { a.job={ type:"move", target:tile }; a.stance="hold"; });
}

function issueReconstruct(pylon) {
    if (!pylon||!followers||followers.length===0) return;
    if (!pylon.reconstructing) { pylon.reconstructing=false; pylon.reconstructProgress=0; pylon.workers=[]; }
    if (pylon.reconstructing) return;
    const pool=(followerByElement[player.selectedElement]||[]).filter(a=>!a.job).slice(0,3);
    if (pool.length===0) return;
    pylon.reconstructing=true; pylon.reconstructProgress=0; pylon.workers=pool;
    pool.forEach(a => { a.job={ type:"reconstruct", target:pylon }; });
}

function executeCommand() {
    if (!selectedRadialAction) { commandMode=false; return; }
    if (!commandMode) return;
    if (!commandTarget) { commandMode=false; selectedRadialAction=null; return; }
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
            const pool=(followerByElement[player.selectedElement]||[]).filter(a=>!a.job).slice(0,5);
            pool.forEach(a => { a.job={ type:"attack", target:enemy }; });
            break;
        }
        case "move":  issueMoveCommand(commandTarget); break;
        case "build":
            if (shardCount>=10&&commandTarget&&!commandTarget.pillar) {
                shardCount-=10;
                commandTarget.pillar=true; commandTarget.pillarTeam="green";
                commandTarget.pillarCol="#0f8"; commandTarget.health=20;
                commandTarget.maxHealth=20; commandTarget.upgraded=false;
                commandTarget.destroyed=false;
            }
            break;
    }
    commandMode=false; commandTarget=null;
}
