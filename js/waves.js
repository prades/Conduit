// ─────────────────────────────────────────────────────────
//  WAVE / PHASE MANAGEMENT
// ─────────────────────────────────────────────────────────
let dayTimer = 0;           // frames elapsed since day started
const DAY_MIN_FRAMES = 1800; // minimum 30 seconds of day (at 60fps)

function startNight() {
    gameState.phase="night";
    dayTimer=0;
    nightKillCount=0;
    nightEnemiesTarget=enemiesThisWave();
    nightPredatorsRemaining=predatorsThisWave();
    zonePredators={};
    zoneRespawnTimers={};
    waveUI.textContent="Night "+gameState.nightNumber+" — Kill "+nightEnemiesTarget;
}

function checkWaveClear() {
    if (gameState.phase!=="night") return;
    // Night ends when kill target is reached
    if (nightKillCount >= nightEnemiesTarget) {
        gameState.phase="waveComplete";
        gameState.totalWavesSurvived++;
        showWaveClear();
    }
}

function showWaveClear() {
    const overlay=document.getElementById("overlay");
    document.getElementById("ovr-title").textContent="WAVE "+gameState.nightNumber+" CLEARED";
    document.getElementById("ovr-title").style.color="#0f8";
    document.getElementById("ovr-sub").textContent="Opening Supply Cache…";
    document.getElementById("ovr-shards").textContent=shardCount;
    document.getElementById("ovr-conv").textContent=dayStats.redConverted;
    document.getElementById("ovr-waves").textContent=gameState.totalWavesSurvived;
    document.getElementById("ovr-btn").textContent="NEXT WAVE";
    document.getElementById("ovr-btn").onclick=nextWave;
    buildShopGrid();
    overlay.classList.add("active");
}

function showGameOver() {
    gameState.phase="gameOver";
    gameState.running=false;
    const overlay=document.getElementById("overlay");
    document.getElementById("ovr-title").textContent="CRYSTAL DESTROYED";
    document.getElementById("ovr-title").style.color="#f22";
    document.getElementById("ovr-sub").textContent="The network has collapsed.";
    document.getElementById("ovr-shards").textContent=shardCount;
    document.getElementById("ovr-conv").textContent=dayStats.redConverted;
    document.getElementById("ovr-waves").textContent=gameState.totalWavesSurvived;
    document.getElementById("ovr-btn").textContent="RESTART";
    document.getElementById("ovr-btn").onclick=restartGame;
    document.getElementById("shopGrid").innerHTML="";
    overlay.classList.add("active");
}

function buildShopGrid() {
    const grid=document.getElementById("shopGrid");
    grid.innerHTML="";
    SHOP_ITEMS.forEach(item=>{
        if (item.element&&unlockedElements.has(item.element)) return; // already unlocked
        const div=document.createElement("div");
        div.className="shop-item"+(boughtItems.has(item.id)?" bought":"");
        div.innerHTML=`<div>${item.label}</div><div class="cost">${item.cost} shards</div>`;
        div.onclick=()=>{
            if (shardCount<item.cost||boughtItems.has(item.id)) return;
            shardCount-=item.cost;
            saveShards();
            item.apply();
            boughtItems.add(item.id);
            div.classList.add("bought");
            document.getElementById("ovr-shards").textContent=shardCount;
            shardUI.textContent="Shards: "+shardCount;
    // Zone indicator
    const _zoneEl = document.getElementById("zoneInfo");
    if (_zoneEl) {
        const _pz = getZoneIndex(Math.floor(player.x));
        _zoneEl.textContent = _pz === 0 ? "Zone: Home" : "Zone: " + _pz;
    }
    // Update DNA HUD
    const _dna = getDNA();
    const dnaEntries = Object.entries(_dna).filter(([k,v])=>v>0);
    const dnaEl = document.getElementById("dnaHud");
    if (dnaEl) {
        dnaEl.textContent = dnaEntries.length === 0
            ? "DNA: none"
            : "DNA: " + dnaEntries.map(([k,v])=>k.replace("_"," ")+"x"+v).join(" | ");
    }
        };
        grid.appendChild(div);
    });
}

function spawnFollowerFromSave(entry) {
    const personality = entry.personality || PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)];
    const stats = entry.stats || applyPersonality(personality);
    const role  = entry.role  || assignRole(stats);
    const npc = {
        type:"virus", element:entry.element||"fire",
        x:crystal.x+(Math.random()-0.5)*2,
        y:crystal.y+(Math.random()-0.5)*2,
        team:"green",
        health:stats.hp, maxHealth:stats.hp,
        moveSpeed: NPC_TYPES["virus"].moveSpeed + ((stats.speed||10)-10)*0.001,
        power: stats.attack||5,
        stats, personality, role,
        currentResonance:0, currentWill:stats.will||20,
        walkCycle:0, moveCooldown:0, stance:"follow", isFollower:true, isHealing:false,
        hitFlash:0, dead:false,
        combatTrait:entry.combatTrait, naturalTrait:entry.naturalTrait, perk:entry.perk
    };
    actors.push(npc); followers.push(npc);
    if(!followerByElement[npc.element]) followerByElement[npc.element]=[];
    followerByElement[npc.element].push(npc);
}

function nextWave() {
    gameState.nightNumber++;
    boughtItems.clear();
    dayStats.redSpawned=0; dayStats.redConverted=0;
    spawnHazardsForDay();

    // ── Collect every follower in the army right now ──
    // alive followers + still-walking-to-crystal + queued-for-respawn
    const armyNow = [
        ...followers.filter(a=>!a.dead&&!a.sacrificed&&a.isFollower&&a.personality),
        ...actors.filter(a=>a.team==="green"&&a.returningToCrystal&&!a.dead&&!a.sacrificed&&a.personality),
        ...respawnQueue.filter(e=>!e.isClone&&!e.sacrificed&&e.personality)
    ];
    const cloneArmy = [
        ...actors.filter(a=>a.isClone&&a.team==="green"&&!a.dead&&!a.sacrificed),
        ...respawnQueue.filter(e=>e.isClone)
    ];

    // Save full follower roster to localStorage
    const rosterToSave = armyNow.map(a=>({
        element:     a.element     || "fire",
        personality: a.personality,
        combatTrait: a.combatTrait,
        naturalTrait:a.naturalTrait,
        perk:        a.perk,
        stats:       a.stats,
        role:        a.role
    }));
    try { localStorage.setItem("tubecrawler_followers", JSON.stringify(rosterToSave)); } catch(e) {}

    // Save gameState
    saveGameState();

    // ── Restore surviving green pylons to full health ──
    world.forEach(obj=>{
        if (obj.pillar && !obj.destroyed && obj.pillarTeam==="green" && obj.health>0) {
            obj.health = obj.maxHealth;
            obj.pendingDestroy = false;
        }
    });

    // ── Wipe everything, start clean ──
    actors=[]; followers=[]; respawnQueue=[]; pendingPillarDestruction=[];
    ELEMENTS.forEach(el=>{ followerByElement[el.id]=[]; });
    activePredator=null; predatorRespawnTimer=0;
    zonePredators={}; zoneRespawnTimers={};

    // ── Restore saved followers at crystal ──
    const saved = loadFollowers();
    saved.forEach(entry => spawnFollowerFromSave(entry));

    // ── Restore clones at crystal ──
    cloneArmy.forEach(a => {
        if (a instanceof Predator) {
            a.x = crystal.x + (Math.random()-0.5)*2;
            a.y = crystal.y + (Math.random()-0.5)*2;
            a.job = null; a.state = "wander";
            actors.push(a);
        } else {
            // was queued clone entry
            const speciesDef = SPECIES[a.speciesName];
            if (!speciesDef) return;
            const classDef = speciesDef[a.className];
            const def = { width:classDef.width, height:classDef.height, moveSpeed:classDef.moveSpeed, health:classDef.health, power:classDef.power, color:speciesDef.color };
            const clone = new Predator(a.className, def, crystal.x+(Math.random()-0.5)*2, crystal.y+(Math.random()-0.5)*2);
            clone.state="wander"; clone.team="green"; clone.isClone=true;
            clone.speciesName=a.speciesName; clone.className=a.className;
            applySpeciesBody(clone, a.speciesName);
            actors.push(clone);
        }
    });

    // ── Spawn neutral recruits in zones — gray, convertible ──
    const hostileZones = Math.min(activeDayZones - 1, 5);
    for (let z = 1; z <= hostileZones; z++) {
        const count = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < count; i++) {
            const spawnX = z * ZONE_LENGTH + 2 + Math.floor(Math.random() * (ZONE_LENGTH - 4));
            const spawnY = 2 + Math.floor(Math.random() * 2);
            actors.push({
                type:"virus", element:null, x:spawnX, y:spawnY,
                team:"red", isNeutralRecruit:true,
                health:15, maxHealth:15, moveSpeed:0.018, power:2,
                stats:null, personality:null, role:null,
                currentResonance:0, currentWill:0,
                walkCycle:0, moveCooldown:0,
                stance:"wander", isFollower:false, isHealing:false,
                hitFlash:0, spawnProtection:120, dead:false, convertFlash:0
            });
        }
    }
    // expand world
    // Zone cap at 5 — after that species rank up instead
    if (activeDayZones < 5) {
        activeDayZones++;
        for (let i=lastGenX+1;i<=lastGenX+ZONE_LENGTH;i++) generateSegment(i);
    }
    document.getElementById("overlay").classList.remove("active");
    gameState.running=true;
    startNight();
}

function restartGame() {
    // Full reset
    world=[];actors=[];followers=[];
    ELEMENTS.forEach(el=>{ followerByElement[el.id]=[]; });
    projectiles=[];fragments=[];smoke=[];shards=[];elementEffects=[];floatingTexts=[];followerProjectiles=[];clearDNA();
    pendingPillarDestruction=[];respawnQueue=[];
    frame=0;shake=0;lastGenX=0;shardCount=0;clearShards();clearUnlocks();clearFollowers();clearGameState();
    try { localStorage.removeItem('tubecrawler_followers'); } catch(e) {}
    unlockedElements=new Set(["fire","electric"]);
    latchedPillar=null;activePredator=null;predatorRespawnTimer=0;zonePredators={};zoneRespawnTimers={};
    _cacheAge=-999; _pillarCache=[]; _wPylons=[]; _aPylons=[]; _uPylons=[];
    activeDayZones=3;exploredZones=new Set();
    boughtItems.clear();
    crystal={ x:0,y:2,health:300,maxHealth:300,radius:0.8 };
    player={ x:2,y:1,visualX:2,visualY:1,targetX:2,targetY:1,
             rotY:Math.PI*0.75, baseRot:Math.PI*0.75, angryTimer:0,
             selectedElement:"fire", siphonHold:0 };
    gameState={ phase:"day", nightNumber:1, totalWavesSurvived:0, running:true };
    dayStats={ redSpawned:0, redConverted:0 };
    nightKillCount=0; nightEnemiesTarget=0; nightPredatorsRemaining=0;
    for (let i=-6;i<0;i++) generateSegment(i);
    for (let i=0;i<20;i++) generateSegment(i);
    // No free spawns — player earns followers and encounters predators naturally
    spawnHazardsForDay();
    document.getElementById("overlay").classList.remove("active");
    requestAnimationFrame(render);
}
