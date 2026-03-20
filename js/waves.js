// ─────────────────────────────────────────────────────────
//  WAVE / PHASE MANAGEMENT  (Intruder Alert system)
// ─────────────────────────────────────────────────────────

// ── TRIGGER ALARM — called when a decoy panel is activated ──
// type: "proximity" | "zone" | "facility"
// sx, sy: world-space source of the triggered panel
function triggerAlarm(type, sx, sy) {
    alertActive = true;
    alertTimer  = ALERT_DURATION;
    alertType   = type;
    alertSource = { x: sx, y: sy };

    // If not already in night/alert phase, initialise kill quota
    if (gameState.phase !== "night") {
        gameState.phase = "night";
        nightKillCount = 0;
        nightEnemiesTarget    = enemiesThisWave();
        nightPredatorsRemaining = predatorsThisWave();
    }

    // Announce alarm type
    const labels = { proximity:"PROXIMITY ALARM", zone:"ZONE ALARM", facility:"FACILITY BREACH" };
    const label  = labels[type] || "INTRUDER ALERT";
    floatingTexts.push({ x:canvas.width/2, y:canvas.height/2-80,
        text:"⚠ " + label + " ⚠", color:"#ff2200", life:180, vy:-0.25, size:16 });

    // Make affected predators hostile immediately
    const srcZone = getZoneIndex(Math.floor(sx));
    actors.forEach(a => {
        if (!(a instanceof Predator) || a.dead || a.team === "green") return;
        const inRange =
            type === "facility"  ? true :
            type === "zone"      ? getZoneIndex(Math.floor(a.x)) === srcZone :
            /* proximity */        Math.hypot(a.x - sx, a.y - sy) < 6;
        if (inRange) { a.state = "hunt"; a.provoked = true; }
    });

    waveUI.textContent = "⚠ " + label + " — Kill " + nightEnemiesTarget;
}

// ── CLEAR ALARM — called when alert timer expires ──
function clearAlarm() {
    alertActive = false;
    alertType   = null;
    alertSource = null;
    // Predators that haven't been provoked by a direct hit revert to grazing
    actors.forEach(a => {
        if (!(a instanceof Predator) || a.dead || a.team === "green") return;
        if (!a.lastAttacker) { a.provoked = false; a.state = "wander"; }
    });
    if (gameState.phase === "night" && nightKillCount < nightEnemiesTarget) {
        gameState.phase = "day";
        waveUI.textContent = "Wave " + gameState.nightNumber + " — clear panels for shards";
    }
}

function checkWaveClear() {
    if (gameState.phase !== "night") return;
    if (nightKillCount >= nightEnemiesTarget) {
        gameState.phase = "waveComplete";
        gameState.totalWavesSurvived++;
        showWaveClear();
    }
}

function showWaveClear() {
    gameState.running=false;
    crystalMenuOpen=false;
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
    if (typeof switchShopTab === "function") switchShopTab("Supply");
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
    ["shopGridSupply","shopGridPylons","shopGridArmaments"].forEach(id => {
        const el = document.getElementById(id); if (el) el.innerHTML = "";
    });
    overlay.classList.add("active");
}

function buildShopGrid() {
    _fillShopPane("shopGridSupply",    SHOP_ITEMS,        false);
    _fillShopPane("shopGridPylons",    PYLON_SHOP_ITEMS,  false);
    _fillShopPane("shopGridArmaments", ARMAMENT_ITEMS,    true);
}

function _fillShopPane(paneId, items, checkTerritory) {
    const grid = document.getElementById(paneId);
    if (!grid) return;
    grid.innerHTML = "";
    const zones = getControlledZones();
    items.forEach(item => {
        if (item.element && unlockedElements.has(item.element)) return;
        const isPermBought = item.oneTimeGame && permUpgrades.has(item.id);
        const isWaveBought = !item.oneTimeGame && boughtItems.has(item.id);
        const isBought = isPermBought || isWaveBought;
        const isLocked = !!(item.reqZones && zones < item.reqZones);
        const div = document.createElement("div");
        div.className = "shop-item" + (isBought ? " bought" : "") + (isLocked ? " locked" : "");
        div.innerHTML = `<div>${item.label}</div><div class="cost">${item.cost} shards</div>` +
            (item.desc ? `<div class="desc">${item.desc}</div>` : "") +
            (item.reqZones ? `<div class="req">Req: ${item.reqZones} zones</div>` : "");
        div.onclick = () => {
            if (shardCount < item.cost || isBought || isLocked) return;
            shardCount -= item.cost;
            saveShards();
            item.apply();
            if (item.oneTimeGame) { permUpgrades.add(item.id); savePermUpgrades(); }
            else boughtItems.add(item.id);
            div.classList.add("bought");
            document.getElementById("ovr-shards").textContent = shardCount;
            shardUI.textContent = "Shards: " + shardCount;
            const _zoneEl = document.getElementById("zoneInfo");
            if (_zoneEl) {
                const _pz = getZoneIndex(Math.floor(player.x));
                _zoneEl.textContent = _pz === 0 ? "Zone: Home" : "Zone: " + _pz;
            }
            const _dna = getDNA();
            const dnaEntries = Object.entries(_dna).filter(([k,v]) => v > 0);
            const dnaEl = document.getElementById("dnaHud");
            if (dnaEl) {
                dnaEl.textContent = dnaEntries.length === 0
                    ? "DNA: none"
                    : "DNA: " + dnaEntries.map(([k,v]) => k.replace("_"," ") + "x" + v).join(" | ");
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
        health:(stats.hp||10) + (followerPermHPBonus||0),
        maxHealth:(stats.hp||10) + (followerPermHPBonus||0),
        moveSpeed: NPC_TYPES["virus"].moveSpeed + ((stats.speed||10)-10)*0.001,
        power: (stats.attack||5) + (followerPermPowerBonus||0),
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

    // ── Restore surviving green pylons to full health + earn seasoned bonus ──
    // ── Also restore nest health so predators can respawn next wave ──
    world.forEach(obj=>{
        if (obj.pillar && !obj.destroyed && obj.pillarTeam==="green" && obj.health>0) {
            obj.health = obj.maxHealth;
            obj.pendingDestroy = false;
            // Upkeep reward: each night survived adds one seasoned level (max 3)
            obj.seasoned = Math.min(3, (obj.seasoned||0) + 1);
        }
        if (obj.nest) obj.nestHealth = obj.nestMaxHealth || 200;
    });

    savePylons();

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
            if (!classDef) return;
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
    // ── CAPTURED NODE BENEFITS ──────────────────────────────
    // Capacitor Nodes: award shards per captured node at wave end
    capturedNodes.forEach(n => {
        if (n.type === 'capacitor_node') {
            shardCount += 5;
            floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 60,
                text: '+5 SHARDS (Capacitor Node)', color: '#ff8800', life: 120, vy: -0.2 });
        }
    });
    if (capturedNodes.some(n => n.type === 'capacitor_node')) saveShards();

    // Memory Bank (hacked nest): enable forward spawn — mark captured nest zones
    capturedNodes.forEach(n => {
        if (n.type === 'memory_bank') {
            // Allow forward spawn: let players use this nest zone as a safe spawn point
            const nestTile = world.find(t => t.nest && Math.hypot(t.x - n.x, t.y - n.y) < 2);
            if (nestTile) nestTile.playerControlled = true;
        }
    });

    // Camp building effects on wave start
    applyPowerConduit();
    applyRepairStation();

    // Reset alert state
    alertActive = false; alertTimer = 0; alertType = null; alertSource = null;
    nightKillCount = 0;
    nightEnemiesTarget    = enemiesThisWave();
    nightPredatorsRemaining = predatorsThisWave();

    document.getElementById("overlay").classList.remove("active");
    gameState.phase   = "day";
    gameState.running = true;
    waveUI.textContent = "Wave " + gameState.nightNumber + " — clear panels for shards";
}

function restartGame() {
    // Full reset
    world=[];actors=[];followers=[];capturedNodes=[];signalTowers=[];
    ELEMENTS.forEach(el=>{ followerByElement[el.id]=[]; });
    projectiles=[];fragments=[];smoke=[];shards=[];elementEffects=[];floatingTexts=[];followerProjectiles=[];clearDNA();
    pendingPillarDestruction=[];respawnQueue=[];
    frame=0;shake=0;lastGenX=0;shardCount=0;clearShards();clearUnlocks();clearFollowers();clearGameState();clearPylons();clearPermUpgrades();
    permUpgrades=new Set(); pylonMaxHPBonus=0; pylonRangeBonus=0; pylonFireRateBonus=0;
    followerPermPowerBonus=0; followerPermHPBonus=0;
    try { localStorage.removeItem('tubecrawler_followers'); } catch(e) {}
    unlockedElements=new Set(["fire","electric"]);
    latchedPillar=null;activePredator=null;predatorRespawnTimer=0;zonePredators={};zoneRespawnTimers={};
    _cacheAge=-999; _pillarCache=[]; _wPylons=[]; _aPylons=[]; _uPylons=[]; _wPylonPairs=[]; _pylonsWithPartner=new Set();
    ELEMENTS.forEach(e=>{ networkStrength[e.id]=0; networkIntegrity[e.id]=0; _prevNetworkTiers[e.id]=0; });
    activeDayZones=3;exploredZones=new Set();
    boughtItems.clear();
    clearCampBuildings();
    traps=[];
    crystal={ x:0,y:2,health:300,maxHealth:300,radius:0.8 };
    player={ x:2,y:1,visualX:2,visualY:1,targetX:2,targetY:1,
             rotY:Math.PI*0.75, baseRot:Math.PI*0.75, angryTimer:0,
             selectedElement:"fire", siphonHold:0 };
    gameState={ phase:"day", nightNumber:1, totalWavesSurvived:0, running:true };
    dayStats={ redSpawned:0, redConverted:0 };
    nightKillCount=0; nightEnemiesTarget=0; nightPredatorsRemaining=0;
    alertActive=false; alertTimer=0; alertType=null; alertSource=null;
    for (let i=-6;i<0;i++) generateSegment(i);
    for (let i=0;i<20;i++) generateSegment(i);
    // No free spawns — player earns followers and encounters predators naturally
    spawnHazardsForDay();
    document.getElementById("overlay").classList.remove("active");
    waveUI.textContent = "Wave 1 — clear panels for shards";
    requestAnimationFrame(render);
}
