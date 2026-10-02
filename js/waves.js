// ─────────────────────────────────────────────────────────
//  WAVE / PHASE MANAGEMENT  (Intruder Alert system)
// ─────────────────────────────────────────────────────────

// ── TRIGGER ALARM — called when a decoy panel is activated ──
// type: "proximity" | "zone" | "facility"
// sx, sy: world-space source of the triggered panel
// ── THE OBJECTIVE LINE ───────────────────────────────────
// The one line at the top of the screen. It used to read "Best Zone: 3", which
// reports what you have already done and says nothing about what to do next —
// and it was written out in six places, each slightly different.
//
// A zone is CONQUERED by clearing the wave its alarm came from, which is what
// moves highestZoneCleared. So the next objective is simply the zone after it,
// and the line names it and says how to start it: you pick the fight by hacking
// a nest there.
function nextZoneToTake() {
    return (gameState.highestZoneCleared || 0) + 1;
}

// What tripped the alarm, in the player's words. Written out twice — once for
// the floating announcement, once for the canvas — with two different key sets,
// so an unrecognised type read "INTRUDER ALERT" in one place and "FACILITY
// BREACH" in the other. One list.
const ALARM_LABELS = {
    proximity: "PROXIMITY ALARM",
    zone:      "ZONE ALARM",
    facility:  "FACILITY BREACH",
};
function alarmLabel(type) {
    return ALARM_LABELS[type] || "INTRUDER ALERT";
}

function objectiveText(suffix) {
    // Under alarm the objective IS the alarm — the zone that raised it and the
    // quota that ends it. Nothing else is worth saying while that is running.
    //
    // ...but NOT once the wave is complete. alertActive is still set at the
    // moment a zone is taken, so this branch won and the line went on reading
    // "TAKING ZONE 1 — Kill 5/5" at exactly the moment the player had finished
    // taking zone 1. The phase is what says the fight is over.
    const _fighting = typeof gameState !== "undefined" && gameState.phase !== "waveComplete";
    if (_fighting && typeof alertActive !== "undefined" && alertActive) {
        const z = (alertZone !== null && alertZone !== undefined)
            ? alertZone
            : (alertSource ? getZoneIndex(Math.floor(alertSource.x)) : nextZoneToTake());
        // What tripped the alarm used to be painted on the canvas and was lost
        // when that copy went; it belongs on the one line that is left.
        return "\u26a0 " + alarmLabel(alertType) + " \u2014 TAKING ZONE " + z
             + " \u2014 Kill " + nightKillCount + "/" + nightEnemiesTarget;
    }
    const cleared = gameState.highestZoneCleared || 0;
    const head = cleared > 0 ? ("ZONE " + cleared + " TAKEN") : "HOME SECURE";
    let line = head + "  \u2192  NEXT: ZONE " + nextZoneToTake();
    if (suffix) line += " \u2014 " + suffix;
    else        line += " \u2014 hack a nest there";
    return line;
}

// Push it to the banner. Called wherever the objective can have changed, which
// includes the moment a zone is taken — the old code only refreshed it on the
// next wave, so the line still named the zone you had just finished.
function updateObjectiveUI(suffix) {
    if (typeof waveUI === "undefined" || !waveUI) return;
    waveUI.textContent = objectiveText(suffix);
    // The banner carries the alarm itself now, so it has to LOOK like an alarm.
    // The canvas used to paint a second, flashing copy of this sentence at a
    // hardcoded x=230, which landed underneath this box and made both
    // unreadable. One line, one place, and the urgency lives in a class.
    const _fighting = typeof gameState !== "undefined" && gameState.phase !== "waveComplete";
    const _alarm = _fighting && typeof alertActive !== "undefined" && alertActive;
    if (waveUI.classList) waveUI.classList.toggle("alarm", !!_alarm);
}

// The kill tally shows two different ways: inside the alarm line while the
// alarm runs, and as a suffix once the alarm has expired but the quota has not.
// Both callers — the alarm timer and the kill counter itself — need the same
// choice made, so it is made once.
function updateKillProgressUI() {
    if (typeof alertActive !== "undefined" && alertActive) { updateObjectiveUI(); return; }
    if (typeof gameState !== "undefined" && gameState.phase === "night"
        && nightKillCount < nightEnemiesTarget) {
        updateObjectiveUI("Kill " + nightKillCount + "/" + nightEnemiesTarget);
        return;
    }
    updateObjectiveUI();
}

function triggerAlarm(type, sx, sy) {
    alertActive = true;
    alertTimer  = ALERT_DURATION;
    alertType   = type;
    alertSource = { x: sx, y: sy };
    alertZone   = getZoneIndex(Math.floor(sx));

    // Each alarm increases the wave number (escalating difficulty)
    gameState.nightNumber++;
    saveGameState();

    // If not already in night/alert phase, initialise kill quota
    if (gameState.phase !== "night") {
        gameState.phase = "night";
        nightKillCount = 0;
        nightEnemiesTarget    = enemiesThisWave();
        nightPredatorsRemaining = predatorsThisWave();
    }

    // Announce alarm type
    const label = alarmLabel(type);
    const _floatZone = getZoneIndex(Math.floor(sx));
    floatingTexts.push({ x:canvas.width/2, y:canvas.height/2-80,
        text:"⚠ ZONE " + _floatZone + " " + label + " ⚠", color:"#ff2200", life:180, vy:-0.25, size:16 });

    // Make affected predators hostile immediately
    // Predators from zones HIGHER than the alarm zone are never turned hostile — they remain wanderers.
    const srcZone = getZoneIndex(Math.floor(sx));
    actors.forEach(a => {
        if (!(a instanceof Predator) || a.dead || a.team === "green") return;
        const predZone = getZoneIndex(Math.floor(a.x));
        // Higher-zone predators are never aggroed by an alarm — they are ambient wanderers only
        if (predZone > srcZone) {
            a.state = "wander"; a.isWanderer = true;
            return;
        }
        const inRange =
            type === "facility"  ? true :
            type === "zone"      ? predZone === srcZone :
            /* proximity */        Math.hypot(a.x - sx, a.y - sy) < 6;
        if (inRange) {
            a.state = "hunt"; a.provoked = true;
            // Predators outside the alarm zone (but not higher) can still be aggroed but don't count toward kills
            // Always reset isWanderer here — a predator may carry a stale true from a previous wave
            a.isWanderer = (predZone !== srcZone);
        }
    });

    const _alarmZone = getZoneIndex(Math.floor(sx));
    waveUI.textContent = "⚠ ZONE " + _alarmZone + " " + label + " [Wave " + gameState.nightNumber + "] — Kill " + nightKillCount + "/" + nightEnemiesTarget;
}

// ── RESET PANELS — deactivate all panels, diminish shard rewards, reshuffle decoy ──
// Called after every alarm/wave-clear so the player can re-farm the same zones.
function resetPanels() {
    const allPanels = world.filter(t => t.nodeType === 'wall_panel');
    if (allPanels.length === 0) return;

    allPanels.forEach(t => {
        if (t.panelActivated) {
            // Track how many times this panel has been fully activated
            t.panelTimesActivated = (t.panelTimesActivated || 0) + 1;
            // Diminishing shard returns: halved each time, floor at 1
            t.shardReward = Math.max(1, Math.floor((t.shardReward || 10) * 0.5));
        }
        t.panelActivated  = false;
        t.siphonProgress  = 0;
        t.isDecoy         = false;
    });

    // Assign one new random decoy
    allPanels[Math.floor(Math.random() * allPanels.length)].isDecoy = true;

    // Force the world-cache to rebuild so _wallPanelCache picks up the reset panels
    _cacheAge = -999;
}

// ── CLEAR ALARM — called when alert timer expires ──
function clearAlarm() {
    alertActive = false;
    alertType   = null;
    alertSource = null;
    alertZone   = null;
    // Predators that haven't been provoked by a direct hit revert to grazing
    actors.forEach(a => {
        if (!(a instanceof Predator) || a.dead || a.team === "green") return;
        a.isWanderer = false; // reset — next alarm will re-evaluate per zone
        a.provoked = false; a.lastAttacker = null; a.state = "wander";
    });

    // Reactivate all panels so the player can replay the same zones
    resetPanels();

    // Keep phase as "night" so kills can still complete the wave after alarm
    // expires — the alarm has expired but the quota has not, which is still the
    // same fight and still wants the tally.
    updateKillProgressUI();
}

// ── BETWEEN-WAVE WORLD RESTORE ──
// Extracted from nextWave so it can be tested on its own: nextWave's body runs
// inside a setTimeout surrounded by heavy DOM and localStorage work.
//
// Surviving green pylons heal and earn a seasoned stack. Nests are the
// important case: a nest the player finished off STAYS dead, because
// destroying one permanently shuts down that zone's spawns and that is the
// entire reward for the effort — healing it back erased the progress. A merely
// damaged nest still recovers, so a half-finished job gains nothing.
function restoreWorldBetweenWaves() {
    world.forEach(obj => {
        if (obj.pillar && !obj.destroyed && obj.pillarTeam === "green" && obj.health > 0) {
            obj.health = obj.maxHealth;
            obj.pendingDestroy = false;
            obj.seasoned = Math.min(3, (obj.seasoned || 0) + 1);
        }
        if (obj.nest && obj.nestHealth > 0) obj.nestHealth = obj.nestMaxHealth || 200;
    });
}

function checkWaveClear() {
    if (gameState.phase !== "night") return;
    if (nightKillCount >= nightEnemiesTarget) {
        gameState.phase = "waveComplete";
        gameState.totalWavesSurvived++;
        // Record highest zone cleared
        if (alertSource) {
            const clearedZone = getZoneIndex(Math.floor(alertSource.x));
            if (clearedZone > gameState.highestZoneCleared) {
                gameState.highestZoneCleared = clearedZone;
                saveGameState();
            }
            // Refreshed HERE, the moment the zone is taken. It used to wait
            // for the next wave to start, so the banner went on naming the
            // zone the player had just finished.
            updateObjectiveUI();
        }
        // The wave's reward: the next element, earned but not yet online. Before
        // showWaveClear, so the overlay can read what was just earned.
        noteWaveClearedForProgression();
        // Reset panels immediately on wave clear — player re-enters day with fresh panels
        resetPanels();
        showWaveClear();
    }
}

function showWaveClear() {
    gameState.running=false;
    crystalMenuOpen=false;
    const overlay=document.getElementById("overlay");
    const _clearedZone = alertSource ? getZoneIndex(Math.floor(alertSource.x)) : 0;
    document.getElementById("ovr-title").textContent="ZONE " + _clearedZone + " CLEARED";
    document.getElementById("ovr-title").style.color="#0f8";
    document.getElementById("ovr-sub").textContent="The tunnel goes deeper.";
    document.getElementById("ovr-shards").textContent=shardCount;
    document.getElementById("ovr-conv").textContent=dayStats.redConverted;
    document.getElementById("ovr-waves").textContent=gameState.highestZoneCleared;
    document.getElementById("ovr-btn").textContent="NEXT WAVE";
    document.getElementById("ovr-btn").onclick=nextWave;
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
    document.getElementById("ovr-waves").textContent=gameState.highestZoneCleared;
    document.getElementById("ovr-btn").textContent="RESTART";
    document.getElementById("ovr-btn").onclick=restartGame;
    ["shopGridSupply","shopGridPylons","shopGridArmaments","shopGridBuilds"].forEach(id => {
        const el = document.getElementById(id); if (el) el.innerHTML = "";
    });
    overlay.classList.add("active");
}

// ── MID-GAME SHOP — accessible during day when alarm is inactive ──
function openMidGameShop() {
    if (alertActive || gameState.phase === "night" || gameState.phase === "waveComplete" || gameState.phase === "gameOver") return;
    gameState.running = false;
    crystalMenuOpen = false;
    const overlay = document.getElementById("overlay");
    document.getElementById("ovr-title").textContent = "SUPPLY CACHE";
    document.getElementById("ovr-title").style.color = "#4bc8ff";
    document.getElementById("ovr-sub").textContent = "Browse upgrades — game paused";
    document.getElementById("ovr-shards").textContent = shardCount;
    document.getElementById("ovr-conv").textContent = dayStats.redConverted;
    document.getElementById("ovr-waves").textContent = gameState.highestZoneCleared;
    document.getElementById("ovr-btn").textContent = "CLOSE";
    document.getElementById("ovr-btn").onclick = closeMidGameShop;
    overlay.classList.add("active");
}

function closeMidGameShop() {
    document.getElementById("overlay").classList.remove("active");
    gameState.running = true;
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
        health:(stats.hp||10),
        maxHealth:(stats.hp||10),
        moveSpeed: NPC_TYPES["virus"].moveSpeed + ((stats.speed||10)-10)*0.001,
        power: (stats.attack||5),
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

// Every menu, gesture and dangling target reference that must not survive
// a change of scene. nextWave() and restartGame() both need this; keeping
// one copy is the only way they stay in step — restartGame missed several
// of these, so a reset carried stale charged mass and pointers to actors
// from the world it had just thrown away.
function resetTransientState() {
    campMenuOpen      = false;
    cloneMenuOpen     = false;
    crystalMenuOpen   = false;
    trapPickerOpen    = false; trapPickerTarget = null;
    pylonConfirmOpen  = false; pylonConfirmEl   = null; pylonConfirmTarget = null;
    elementPickerOpen = false; elementPickerTarget = null;
    infoPanelOpen     = false; infoPanelTarget = null; infoPanelPage = null;
    commandMode       = false; commandPendingTap = false;
    commandTarget     = null; selectedRadialAction = null;
    nestConnectMode   = false; pendingConnectNest = null; nestConnectMisses = 0;
    playerAttackMode  = false; commandEnemyTarget = null; commandFollowerTarget = null;
    // Charged mass STAYS on the floor between waves. It used to be wiped here,
    // so every lump you had not hauled home yet — the whole point of the
    // electric/flux chain — vanished the moment the round turned over, and the
    // kills that made it were simply lost.
    //
    // Only the CARRYING is reset: followers[] is rebuilt from the save, so a
    // carrier mid-haul stops existing and its lump would be stranded in the
    // CARRIED state with a reference to nobody. Dropped where it stood, it is
    // picked up again by the next flux worker.
    dropCarriedMass();
    // Cocoon and half-finished conversions do not survive a change of scene.
    cocoons.length = 0;
    world.forEach(t => { if (t.converting) { t.converting = false; t.convertProgress = 0; } });
    buildMode         = false;
    const _bBtn = document.getElementById("btnBuild");
    if (_bBtn) { _bBtn.textContent="BUILD: OFF"; _bBtn.classList.remove("active"); }
    holdLineX         = null;
    isPressing        = false; longHoldFired = false; touchMoved = false; gesturePoints = [];
    shake             = 0;
}

function nextWave() {
    gameState.nightNumber++;
    dayStats.redSpawned=0; dayStats.redConverted=0;

    resetTransientState();

    // ── Snapshot army before wiping — done synchronously while data is live ──
    const armyNow = [
        ...followers.filter(a=>!a.dead&&!a.sacrificed&&a.isFollower&&a.personality),
        ...actors.filter(a=>a.team==="green"&&a.returningToCrystal&&!a.dead&&!a.sacrificed&&a.personality),
        ...respawnQueue.filter(e=>!e.isClone&&!e.sacrificed&&e.personality)
    ];
    const cloneArmy = [
        ...actors.filter(a=>a.isClone&&a.team==="green"&&!a.dead&&!a.sacrificed),
        ...respawnQueue.filter(e=>e.isClone)
    ];
    const rosterToSave = armyNow.map(a=>({
        element:     a.element     || "fire",
        personality: a.personality,
        combatTrait: a.combatTrait,
        naturalTrait:a.naturalTrait,
        perk:        a.perk,
        stats:       a.stats,
        role:        a.role
    }));

    // ── Close overlay immediately so the browser can repaint ──
    document.getElementById("overlay").classList.remove("active");
    updateObjectiveUI("loading…");

    // ── Defer all heavy world work so the browser gets a frame to breathe ──
    setTimeout(() => {
        // ── Clear leftover game objects from previous wave ──
        projectiles=[]; fragments=[]; smoke=[]; followerProjectiles=[];
        elementEffects=[]; floatingTexts=[]; groundItems=[]; traps=[];
        if (typeof activeFireEruption !== "undefined") activeFireEruption = null;
        if (typeof activeEmpEffect    !== "undefined") activeEmpEffect    = null;
        shards=[];

        // ── Reset player health ──
        health = 100;

        spawnHazardsForDay();

        // Save follower roster + game state
        try { localStorage.setItem("tubecrawler_followers", JSON.stringify(rosterToSave)); } catch(e) {}
        saveGameState();

        restoreWorldBetweenWaves();
        savePylons();
        saveNests();

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
                // makeClone, like the summon and the respawn. Built by hand
                // here, this block also left off the power multiplier, so a
                // clone that merely SURVIVED a wave came back weaker than the
                // one you paid for.
                makeClone(a.speciesName, a.className,
                          crystal.x + (Math.random()-0.5)*2,
                          crystal.y + (Math.random()-0.5)*2);
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
        // expand world — zone cap at 5
        if (activeDayZones < 5) {
            activeDayZones++;
            const baseX = lastGenX;
            for (let i = 1; i <= ZONE_LENGTH; i++) generateSegment(baseX + i);
        }

        // ── CAPTURED NODE BENEFITS ──
        capturedNodes.forEach(n => {
            if (n.type === 'capacitor_node') {
                shardCount += 5;
                floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 60,
                    text: '+5 SHARDS (Capacitor Node)', color: '#ff8800', life: 120, vy: -0.2 });
            }
        });
        if (capturedNodes.some(n => n.type === 'capacitor_node')) saveShards();

        capturedNodes.forEach(n => {
            if (n.type === 'memory_bank') {
                const nestTile = world.find(t => t.nest && Math.hypot(t.x - n.x, t.y - n.y) < 2);
                if (nestTile) nestTile.playerControlled = true;
            }
        });

        applyPowerConduit();
        applyRepairStation();

        // Reset alert state
        alertActive = false; alertTimer = 0; alertType = null; alertSource = null; alertZone = null;
        nightKillCount = 0;
        nightEnemiesTarget    = enemiesThisWave();
        nightPredatorsRemaining = predatorsThisWave();

        gameState.phase   = "day";
        gameState.running = true;
        updateObjectiveUI();
    }, 0);
}

function restartGame() {
    // Full reset
    world=[];worldTileMap=new Map();actors=[];followers=[];capturedNodes=[];signalTowers=[];
    ELEMENTS.forEach(el=>{ followerByElement[el.id]=[]; });
    projectiles=[];fragments=[];smoke=[];shards=[];elementEffects=[];floatingTexts=[];followerProjectiles=[];clearDNA();
    if (typeof activeFireEruption !== "undefined") activeFireEruption = null;
    if (typeof activeEmpEffect    !== "undefined") activeEmpEffect    = null;
    pendingPillarDestruction=[];respawnQueue=[];
    // Cleared HERE rather than in resetTransientState(), which a wave
    // transition also runs and which must now leave the floor alone.
    chargedMass.length=0;
    frame=0;shake=0;lastGenX=0;shardCount=0;clearShards();clearUnlocks();clearProgress();clearFollowers();clearGameState();clearPylons();clearNests();clearSession();clearWorldSeed();clearAmmo();clearPermUpgrades();
    try { localStorage.removeItem('tubecrawler_followers'); } catch(e) {}
    unlockedElements=new Set(STARTING_ELEMENTS);
    pendingElements=[]; lifetimeKills=0; modulationDirty=false;
    playerUltimate=0; armySurgeTimer=0; _lastUltInt=-1; _lastUltState="";
    siphonEnabled=true; siphonWisps=[]; _lastSiphonOn=null; _siphonInRange=0;
    modulationMask=new Set(STARTING_ELEMENTS);
    activePredator=null;predatorRespawnTimer=0;zonePredators={};zoneRespawnTimers={};
    _cacheAge=-999; _pillarCache=[]; _wPylons=[]; _aPylons=[]; _uPylons=[]; _wPylonPairs=[]; _pylonsWithPartner=new Set(); _capturableNodeCache=[];
    _genPylons=[]; _genLinks=[];
    ELEMENTS.forEach(e=>{ networkStrength[e.id]=0; networkIntegrity[e.id]=0; _prevNetworkTiers[e.id]=0; });
    activeDayZones=3;exploredZones=new Set();
    clearCampBuildings();
    traps=[];
    crystal={ x:0,y:2,health:300,maxHealth:300,radius:0.8 };
    // Must carry every field config.js's opening player has. attackCooldown was
    // missing, and `undefined <= 0` is false, so the fire gate in input.js
    // stayed shut — after a reset the weapon could never be used again.
    player={ x:2,y:1,visualX:2,visualY:1,targetX:2,targetY:1,
             rotY:Math.PI*0.75, baseRot:Math.PI*0.75, angryTimer:0,
             selectedElement:"fire", siphonHold:0,
             attackCooldown:0, invuln:0 };
    gameState={ phase:"day", nightNumber:1, totalWavesSurvived:0, highestZoneCleared:0, running:true };
    dayStats={ redSpawned:0, redConverted:0 };
    nightKillCount=0; nightEnemiesTarget=0; nightPredatorsRemaining=0;
    alertActive=false; alertTimer=0; alertType=null; alertSource=null; alertZone=null;
    // Menus, gestures, charged mass and every pointer into the world that was
    // just thrown away. Shared with nextWave() so the two cannot drift.
    resetTransientState();
    // clearAmmo() above only wipes storage; re-read so the reset starts on the
    // opening allowance rather than carrying the last game's rounds.
    health=100; playerAmmo=getAmmo();
    // Mint a new seed before generating anything. clearWorldSeed() above only
    // forgets the old one — without this, generateSegment would build every
    // reset from seed 0, and with nothing in storage the next refresh would
    // rebuild a different map underneath the saved camp.
    initWorldSeed();
    // The last game's surviving recruits must stop filtering this one.
    // generateSegment skips any recruit whose segment is absent from this set,
    // which is how a refresh avoids handing back a recruit already converted or
    // killed. Leaving it set meant a reset came up with an empty map.
    restoredNpcKeys = null;
    // Same span as init.js: back to CAMP_MIN_X so every base building site has
    // ground under it, and as far forward as a fresh page load lays down.
    for (let i=CAMP_MIN_X;i<0;i++) generateSegment(i);
    for (let i=0;i<80;i++) generateSegment(i);
    // No free spawns — player earns followers and encounters predators naturally
    spawnHazardsForDay();
    document.getElementById("overlay").classList.remove("active");
    updateObjectiveUI();
}
