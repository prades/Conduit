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

const RECLAIM_CREW_MAX = 4;

function _reclaimRefusal(text) {
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
                         text, color: "#f44", life: 100, vy: -0.2 });
}

// Who can be sent to take a pylon back.
//
// This used to be `followerByElement[player.selectedElement]` and nothing else,
// which made RECLAIM depend on the element TAB the player happened to have
// open. For the first round that is invisible — you start on fire and your
// first recruits are fire. After that the Crystal's modulation hands out
// something else, so the squad is ICE while the tab still says FIRE, the pool
// comes back empty, and RECLAIM silently does nothing for the rest of the game.
//
// So: the selected element first, because that is what the player is looking
// at, and then anyone who is free. _sendMergeFollower already worked this way.
function reclaimCrew() {
    // A standing POSITION order counts as available. It is not a task — it
    // never finishes on its own — so `!a.job` benched a positioned follower
    // from reclaiming permanently, the same way it used to bench one from
    // taking a work duty.
    const free = a => a && !a.dead && (!a.job || a.job.type === "move");
    const pref = (followerByElement[player.selectedElement] || []).filter(free);
    const pool = pref.length ? pref : followers.filter(free);
    return pool.slice(0, RECLAIM_CREW_MAX);
}

function issueReconstruct(pylon) {
    if (!pylon || !pylon.pillar || pylon.destroyed) return;
    // Reclaiming is for pylons the predators took. A green one is already yours.
    if (pylon.pillarTeam !== "red") return;

    // A reclaim whose crew was wiped out left `reconstructing` set with the
    // progress frozen, and the early return below then refused every retry —
    // one interrupted attempt and that pylon could never be reclaimed again,
    // with no message to say why. Losing the crew is the ordinary way a reclaim
    // ends, so this was reachable in the first fight of the first round.
    if (pylon.reconstructing && Array.isArray(pylon.workers)) {
        const live = pylon.workers.filter(a => a && !a.dead
                        && a.job && a.job.type === "reconstruct" && a.job.target === pylon);
        if (live.length === 0) {
            pylon.reconstructing = false;
            pylon.workers = [];
        } else {
            pylon.workers = live;       // still under way — prune and fall through
        }
    }
    // Still set means genuinely in progress: a live crew above, or a CORE
    // worker rebuilding it (which sets the flag without ever filling `workers`).
    // Either way it must not be restarted, or every press would reset the
    // progress to zero and it could never finish.
    if (pylon.reconstructing) return;

    if (!followers || followers.filter(a => !a.dead).length === 0) {
        _reclaimRefusal("NEED FOLLOWERS TO RECLAIM");
        return;
    }
    const pool = reclaimCrew();
    if (pool.length === 0) {
        // Never silent. This is the state the report was about.
        _reclaimRefusal("NO FOLLOWER FREE TO RECLAIM");
        return;
    }
    pylon.reconstructing = true;
    pylon.reconstructProgress = 0;
    pylon.workers = pool;
    pool.forEach(a => {
        if (typeof releaseStandingPost === "function") releaseStandingPost(a);
        a.job = { type: "reconstruct", target: pylon };
    });
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

function _executeBuild(el, t) {
    if (el && el.id === GENERATOR_ID && !canPlaceGenerator(t).ok) { refuseGenerator(); return; }
    if (!t || shardCount < PYLON_BUILD_COST) {
        floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"NEED "+PYLON_BUILD_COST+" SHARDS",color:"#f44",life:90,vy:-0.2});
        return;
    }
    shardCount -= PYLON_BUILD_COST; saveShards();
    const _baseHP = 80;

    t.pillar=true; t.pillarTeam="green"; t.pillarCol="#0f8"; t.maxHealth=_baseHP;
    t.pylonStyle=PYLON_STYLE;
    t.upgraded=false; t.destroyed=false;
    t.attackMode=false; t.waveMode=false;
    t.attackModeElement=null; t.attackModeColor=null;
    t.reconstructing=false; t.workers=[];
    if (buildMode) {
        const builderPool=[...getCommandPool().filter(a=>!a.dead&&(!a.job||a.job.type!=="attack")),...followers.filter(a=>!a.dead&&(!a.job||a.job.type!=="attack"))]
            .filter((a,i,arr)=>arr.indexOf(a)===i).slice(0,4);
        if (builderPool.length === 0) {
            // No available followers — abort and refund
            shardCount += PYLON_BUILD_COST; saveShards();
            t.pillar=false; t.constructing=false;
            floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"NO FOLLOWERS AVAILABLE TO BUILD",color:"#f44",life:90,vy:-0.2});
            return;
        }
        t.constructing=true; t.constructProgress=0; t.health=0;
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

function _executeBuildInstant(el, t) {
    if (el && el.id === GENERATOR_ID && !canPlaceGenerator(t).ok) { refuseGenerator(); return; }
    if (!t || shardCount < PYLON_BUILD_COST) {
        floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"NEED "+PYLON_BUILD_COST+" SHARDS",color:"#f44",life:90,vy:-0.2});
        return;
    }
    shardCount -= PYLON_BUILD_COST; saveShards();
    const _iHP = 80;

    t.pillar=true; t.pillarTeam="green"; t.pillarCol=el.color; t.maxHealth=_iHP;
    t.pylonStyle=PYLON_STYLE;
    t.upgraded=false; t.destroyed=false;
    t.reconstructing=false; t.workers=[];
    t.constructing=false; t.constructProgress=1; t.health=t.maxHealth;
    // Auto-activate with the chosen element (no follower merge needed)
    if (isPylonTypeUnlocked(el.id)) {
        t.attackMode=true; t.waveMode=false;
        t.attackModeElement=el.id; t.attackModeColor=el.color;
        t.attackPower=15; t.attackRange=2.5;
        t.chosenElement=el.id; t.chosenColor=el.color;
        t.isGenerator=(el.id===GENERATOR_ID);
    }
    floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"PYLON BUILT — "+el.label.toUpperCase(),color:el.color,life:100,vy:-0.2});
}

// Can this pylon be upgraded at all? Only one you own.
//
// The upgrade path set attackMode, attackModeElement and attackModeColor and
// never touched pillarTeam, and the attack-pylon and wave-pylon passes do not
// filter by team — so upgrading an enemy pylon turned it into a working turret
// of yours that still counted as theirs. It made a converted pylon yours again
// without the RECLAIM it is supposed to cost, which is the whole counter to the
// infestation.
function canUpgradePylon(pylon) {
    return !!(pylon && pylon.pillar && !pylon.destroyed && pylon.pillarTeam === "green");
}

function refuseEnemyUpgrade() {
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80,
                         text: "RECLAIM IT FIRST — NOT YOURS TO UPGRADE",
                         color: "#f44", life: 110, vy: -0.22, size: 12 });
}

function _executeUpgrade(el, pylon) {
    if (!pylon || !pylon.pillar || pylon.destroyed) return;
    if (!canUpgradePylon(pylon)) { refuseEnemyUpgrade(); return; }
    // Converting a pylon you already own into a generator is still creating
    // one, so it is held to the same placement rule.
    if (el && el.id === GENERATOR_ID && !canPlaceGenerator(pylon).ok) { refuseGenerator(); return; }
    if (pylon.attackMode || pylon.waveMode) {
        // Already upgraded — just swap element directly.
        // isGenerator is set or cleared here, so converting a generator to an
        // element (or back) leaves no stale flag behind.
        pylon.attackModeElement = el.id;
        pylon.attackModeColor   = el.color;
        pylon.isGenerator       = (el.id === GENERATOR_ID);
        if (pylon.isGenerator) {
            // A generator has no elemental zone, so it holds no wave network.
            pylon.waveMode = false; pylon.attackMode = true;
        }
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
    infoPanelPage   = null;      // always open on the target readout
}

// Opens the codex with no target — reachable from Settings, so the rules are
// readable without having to stand next to something first.
function openPylonCodex() {
    infoPanelTarget   = null;
    infoPanelOpen     = true;
    infoPanelPage     = 'codex';
    settingsPanelOpen = false;
}

function closeInfoPanel() {
    infoPanelOpen   = false;
    infoPanelTarget = null;
    infoPanelPage   = null;
}

// ── COMMAND EXECUTION ─────────────────────────────────────
function executeCommand() {
    commandMode=false; commandPendingTap=false;
    if (!selectedRadialAction) return;
    if (selectedRadialAction==="noop") { selectedRadialAction=null; return; }
    const isNestCmd = selectedRadialAction==="destroy_nest"||selectedRadialAction==="connect_nest"||selectedRadialAction==="attack_nest";
    if (!commandTarget && !isNestCmd) { commandMode=false; selectedRadialAction=null; return; }
    if (!commandTarget && commandNestTarget) commandTarget=commandNestTarget;

    switch(selectedRadialAction) {
        // ── TOP: BUILD / UPGRADE ──────────────────────────
        case "build_upgrade": {
            const pylon = commandTarget;
            // A constructing pylon with no health is stuck (builder died or none assigned) — reset it so the player can rebuild
            if (pylon && pylon.pillar && pylon.constructing && pylon.health === 0) {
                pylon.pillar=false; pylon.constructing=false; pylon.constructProgress=0;
            }
            if (pylon && pylon.pillar && !pylon.destroyed) {
                // Refused before the picker opens, so the player is not asked
                // to choose an element for something that cannot take one.
                if (!canUpgradePylon(pylon)) { refuseEnemyUpgrade(); break; }
                openElementPicker("upgrade", pylon);
            } else if (commandTarget) {
                if (shardCount >= PYLON_BUILD_COST) {
                    openElementPicker("build", commandTarget);
                } else {
                    floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"NEED "+PYLON_BUILD_COST+" SHARDS TO BUILD",color:"#f44",life:90,vy:-0.2});
                }
            }
            break;
        }
        // ── DOWN: POSITION ────────────────────────────────
        case "position": {
            if (commandTarget) issueMoveCommand(commandTarget);
            break;
        }
        // ── DOWN (capturable tile): CAPTURE ───────────────
        case "capture": {
            const capTile = commandTarget;
            if (!capTile || !capTile.capturable || capTile.captured) break;
            // Assign up to 4 idle followers to capture this node
            const pool = getCommandPool().filter(a => !a.dead && !a.job).slice(0, 4);
            if (pool.length === 0) {
                floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80,
                    text: "NO FOLLOWERS AVAILABLE", color: "#f44", life: 90, vy: -0.2 });
                break;
            }
            pool.forEach(a => { a.job = { type: "capture_node", target: capTile }; });
            floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80,
                text: "CAPTURING NODE…", color: "#0df", life: 90, vy: -0.2 });
            break;
        }
        // ── RIGHT: INFO ───────────────────────────────────
        case "info": {
            openInfoPanel(commandTarget);
            break;
        }
        // ── ARM / STOW ───────────────────────────────────
        case "attack_mode": {
            setPlayerAttackMode(true);
            // Fire straight away at whatever was long-pressed, so arming is one
            // gesture rather than two.
            if (commandEnemyTarget && !commandEnemyTarget.dead) firePlayerShot(commandEnemyTarget);
            break;
        }
        case "stow_weapon": {
            setPlayerAttackMode(false);
            break;
        }
        // ── FIGHTER / WORKER ─────────────────────────────
        case "toggle_duty": {
            if (commandFollowerTarget && !commandFollowerTarget.dead) {
                toggleFollowerDuty(commandFollowerTarget);
            }
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
        // ── PLACE TRAP ───────────────────────────────────
        case "place_trap": {
            if (commandTarget) openTrapPicker(commandTarget);
            break;
        }
        // ── LEGACY NEST COMMANDS ──────────────────────────
        case "connect_nest": {
            if (commandNestTarget && commandNestTarget.nestHealth <= 0) {
                nestConnectMode  = true;
                nestConnectMisses = 0;
                pendingConnectNest = commandNestTarget;
                floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,
                    text:"TAP A GENERATOR PYLON TO LINK",color:"#00ffcc",life:180,vy:-0.15});
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
            issueReconstruct(commandTarget);
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
