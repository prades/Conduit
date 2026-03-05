// ─────────────────────────────────────────────────────────
//  CLONE SYSTEM
// ─────────────────────────────────────────────────────────
let cloneMenuOpen = false;

function openCloneMenu() {
    cloneMenuOpen = true;
    drawCloneMenu();
}

function getCloneOptions() {
    const options = [];
    Object.keys(SPECIES).forEach(speciesName => {
        ["scout","striker","tank"].forEach(className => {
            const key = speciesName + "_" + className;
            const inv = getDNA(); const have = inv[key] || 0;
            const needed = CLONE_COSTS[speciesName].splicesNeeded;
            const baseCost = CLONE_COSTS[speciesName].base + (className==="tank" ? CLONE_COSTS[speciesName].tankExtra : 0);
            let followerCost = baseCost;
            if (className === "tank")  followerCost += CLONE_COSTS[speciesName].tankExtra;
            if (className === "boss")  followerCost += CLONE_COSTS[speciesName].bossExtra;
            if (className === "nymph") followerCost = Math.max(1, baseCost - 1);
            options.push({
                key, speciesName, className,
                have, needed,
                followerCost,
                ready: have >= needed && followers.length >= followerCost
            });
        });
    });
    // Only show species we have at least 1 splice for
    return options.filter(o => o.have > 0);
}

function executeClone(option) {
    if (!option.ready) return;

    // Deduct splices
    deductDNA(option.key, option.needed);

    // Sacrifice nearest followers
    const toSacrifice = followers
        .filter(a => !a.dead)
        .sort((a,b) => {
            const da = Math.hypot(a.x-crystal.x, a.y-crystal.y);
            const db = Math.hypot(b.x-crystal.x, b.y-crystal.y);
            return da - db;
        })
        .slice(0, option.followerCost);

    toSacrifice.forEach(a => { a.dead = true; a.sacrificed = true; });

    // Spawn clone at crystal
    const speciesDef = SPECIES[option.speciesName];
    const classDef   = speciesDef[option.className];
    const def = {
        width:     classDef.width,
        height:    classDef.height,
        moveSpeed: classDef.moveSpeed,
        health:    classDef.health,
        power:     classDef.power,
        color:     speciesDef.color
    };

    const clone = new Predator(option.className, def, crystal.x, crystal.y);
    clone.state       = "wander";
    clone.wanderTimer = 0;
    clone.team        = "green";
    clone.isClone     = true;
    clone.speciesName = option.speciesName;
    clone.className   = option.className;
    applySpeciesBody(clone, option.speciesName);
    actors.push(clone);

    // Floating text
    floatingTexts.push({
        x: canvas.width/2, y: canvas.height/2,
        text: option.speciesName.toUpperCase() + " " + option.className.toUpperCase() + " CLONED",
        color: speciesDef.color,
        life: 120, vy: -0.5
    });

    cloneMenuOpen = false;
}

function drawCloneMenu() {
    if (!cloneMenuOpen) return;

    const options = getCloneOptions();
    const panelW  = 300;
    const rowH    = 52;
    const panelH  = options.length * rowH + 60;
    const panelX  = canvas.width/2  - panelW/2;
    const panelY  = canvas.height/2 - panelH/2;

    ctx.save();
    ctx.setTransform(1,0,0,1,0,0);

    // Background
    ctx.fillStyle   = "rgba(0,0,0,0.88)";
    ctx.strokeStyle = "#0f8";
    ctx.lineWidth   = 2;
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    // Title
    ctx.fillStyle  = "#0f8";
    ctx.font       = "bold 14px monospace";
    ctx.textAlign  = "center";
    ctx.fillText("CRYSTAL CLONE BAY", canvas.width/2, panelY + 24);

    if (options.length === 0) {
        ctx.fillStyle = "#666";
        ctx.font = "12px monospace";
        ctx.fillText("No DNA splices collected yet", canvas.width/2, panelY + 50);
    }

    options.forEach((opt, i) => {
        const rowY = panelY + 44 + i * rowH;
        const ready = opt.ready;
        const speciesDef = SPECIES[opt.speciesName];

        // Row background
        ctx.fillStyle = ready ? "rgba(0,255,136,0.08)" : "rgba(255,255,255,0.03)";
        ctx.fillRect(panelX + 8, rowY, panelW - 16, rowH - 4);

        // Species color dot
        ctx.fillStyle = speciesDef.color;
        ctx.beginPath();
        ctx.arc(panelX + 22, rowY + rowH/2 - 4, 6, 0, Math.PI*2);
        ctx.fill();

        // Name
        ctx.fillStyle = ready ? "#fff" : "#888";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "left";
        ctx.fillText(
            opt.speciesName.toUpperCase() + " " + opt.className.toUpperCase(),
            panelX + 34, rowY + 16
        );

        // Progress bar
        const barW = 120;
        const prog = Math.min(1, opt.have / opt.needed);
        ctx.fillStyle = "#111";
        ctx.fillRect(panelX + 34, rowY + 22, barW, 7);
        ctx.fillStyle = ready ? "#0f8" : speciesDef.color;
        ctx.fillRect(panelX + 34, rowY + 22, barW * prog, 7);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.strokeRect(panelX + 34, rowY + 22, barW, 7);

        // Splice count
        ctx.fillStyle = "#aaa";
        ctx.font = "10px monospace";
        ctx.fillText(opt.have + "/" + opt.needed + " splices", panelX + 34, rowY + 42);

        // Follower cost
        ctx.fillStyle = "#ff0";
        ctx.fillText(opt.followerCost + " followers", panelX + 120, rowY + 42);

        // Clone button
        if (ready) {
            ctx.fillStyle   = "#0f8";
            ctx.strokeStyle = "#0f8";
            ctx.lineWidth   = 1;
            ctx.fillRect(panelX + panelW - 70, rowY + 10, 58, 26);
            ctx.fillStyle  = "#000";
            ctx.font       = "bold 11px monospace";
            ctx.textAlign  = "center";
            ctx.fillText("CLONE", panelX + panelW - 41, rowY + 27);

            // Store hit area for tap detection
            opt._btnX = panelX + panelW - 70;
            opt._btnY = rowY + 10;
            opt._btnW = 58;
            opt._btnH = 26;
        }
    });

    // Close hint
    ctx.fillStyle = "#555";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("tap outside to close", canvas.width/2, panelY + panelH - 8);

    ctx.restore();

    // Store for tap detection
    window._cloneMenuOptions = options;
    window._cloneMenuBounds  = { x:panelX, y:panelY, w:panelW, h:panelH };
}

function handleCloneMenuTap(ex, ey) {
    if (!cloneMenuOpen) return false;
    const b = window._cloneMenuBounds;
    if (!b) return false;

    // Outside panel — close
    if (ex < b.x || ex > b.x+b.w || ey < b.y || ey > b.y+b.h) {
        cloneMenuOpen = false;
        return true;
    }

    // Check clone buttons
    const opts = window._cloneMenuOptions || [];
    for (const opt of opts) {
        if (!opt.ready || !opt._btnX) continue;
        if (ex >= opt._btnX && ex <= opt._btnX+opt._btnW &&
            ey >= opt._btnY && ey <= opt._btnY+opt._btnH) {
            executeClone(opt);
            return true;
        }
    }

    return true; // consumed
}

function applySpeciesBody(predator, speciesName) {
    // Nymph — tiny, translucent, soft rounded
    if (predator.className === "nymph") {
        predator.isNymph = true;
        predator.segmentCornerRadius = 8;
        predator.body.head.size    = 0.5;
        predator.body.thorax.size  = 0.6;
        predator.body.abdomen.size = 0.5;
        predator.body.abdomen.segments = 1;
        predator.appendages.wings.enabled = false;
        predator.appendages.mandibles.length = 3;
        predator.appendages.legs.coxa  = 4;
        predator.appendages.legs.femur = 6;
        predator.appendages.legs.tibia = 8;
        return; // skip species shaping — nymphs look the same across species
    }
    // Spider species — 8 legs, chelicerae, pedipalps, spinnerets, bulbous abdomen, 8 eyes
    if (predator.speciesName === "spider") {
        predator.isSpider = true;
        // Long powerful legs
        predator.appendages.legs.count      = 8;
        predator.appendages.legs.spread     = 16;
        predator.appendages.legs.swingSpeed = 0.35;
        predator.appendages.legs.coxa       = 9;
        predator.appendages.legs.femur      = 16;
        predator.appendages.legs.tibia      = 20;
        predator.appendages.wings.enabled   = false;
        predator.appendages.mandibles.enabled = false;
        predator.appendages.antennae.enabled  = false;
        predator.appendages.chelicerae.enabled = true;
        predator.appendages.chelicerae.length  = 11;
        predator.appendages.chelicerae.fangCurve = 0.7;
        predator.appendages.chelicerae.thickness = 3;
        predator.appendages.pedipalps.enabled = true;
        predator.appendages.pedipalps.length  = 9;
        predator.appendages.spinnerets.enabled = true;
        predator.appendages.eyes.count = 8;
        predator.appendages.eyes.size  = 2.5;
        predator.appendages.eyes.glow  = 0.8;
        // Tall body — cephalothorax raised high, small compact abdomen that protrudes as a round globe
        predator.body.head.size    = 0.0;   // fused into cephalothorax
        predator.body.thorax.size  = 1.1;   // tall raised cephalothorax
        predator.body.abdomen.size = 0.85;  // smaller than thorax — compact globe
        predator.body.abdomen.segments = 1;
        predator.body.abdomen.taper = 1.0;  // no taper — stays round all the way
        predator.body.abdomen.round = true; // flag for circle draw
        predator.segmentCornerRadius = 16;
        predator.segmentSpacing = 8;        // gap between thorax and abdomen
        predator.heightBoost = 1.5;         // extra vertical lift
        return;
    }

    // Boss — massive, imposing, shield aura emitter
    if (predator.className === "boss") {
        predator.isBoss = true;
        predator.shieldAura = true;
        predator.shieldAuraRadius = 5;
        predator.shieldAuraPulse  = 0;
        predator.segmentCornerRadius = 10;
        predator.body.head.size    = 0.7;
        predator.body.thorax.size  = 1.4;
        predator.body.abdomen.size = 1.6;
        predator.body.abdomen.segments = 2;
        predator.body.abdomen.taper = 0.85;
        predator.appendages.mandibles.length = 9;
        predator.appendages.mandibles.thickness = 5;
        predator.appendages.legs.coxa  = 10;
        predator.appendages.legs.femur = 14;
        predator.appendages.legs.tibia = 18;
    }
    if (speciesName === "ant") {
        predator.segmentCornerRadius = 2;
        predator.body.head.size    = 0.35;
        predator.body.thorax.size  = 0.55;
        predator.body.abdomen.size = 0.85;
        predator.body.abdomen.segments = 2;
        predator.body.abdomen.taper = 0.8;
        predator.segmentSpacing    = 6;
        predator.appendages.antennae.enabled = true;
        predator.appendages.antennae.length  = 10;
    } else if (speciesName === "beetle") {
        predator.armorPlated = true;
        predator.segmentCornerRadius = 12;
        predator.body.head.size    = 0.5;
        predator.body.thorax.size  = 1.1;
        predator.body.abdomen.size = 1.3;
        predator.body.abdomen.segments = 1;
        predator.body.abdomen.taper = 0.95;
        predator.appendages.wings.enabled = false;
        predator.appendages.mandibles.length = 4;
    } else if (speciesName === "scorpion") {
        predator.hasStinger  = true;
        predator.body.abdomen.segments = 3;
        predator.body.abdomen.taper = 0.75;
        predator.appendages.wings.enabled = false;
        predator.appendages.mandibles.length = 7;
        predator.appendages.mandibles.spread = 0.6;
    }
}

function spawnFollowerProjectile(actor, target, color, damage, radius, onHit) {
    if (!target || target.dead) return;
    const dx = target.x - actor.x, dy = target.y - actor.y;
    const dist = Math.hypot(dx, dy) || 1;
    const speed = 0.18;
    followerProjectiles.push({
        x: actor.x, y: actor.y,
        vx: (dx/dist)*speed, vy: (dy/dist)*speed,
        color, damage, radius: radius||4,
        life: Math.ceil(dist/speed) + 10,
        source: actor, onHit
    });
}

function spawnPredatorForZone(zoneIndex) {
    const speciesName = getZoneSpecies(zoneIndex, gameState.nightNumber);
    const className   = getZoneClass(zoneIndex);
    const speciesDef  = SPECIES[speciesName];
    const classDef    = speciesDef[className];

    const def = {
        width:           classDef.width,
        height:          classDef.height,
        moveSpeed:       classDef.moveSpeed,
        health:          classDef.health,
        power:           classDef.power,
        color:           speciesDef.color,
        reactionSpeed:   classDef.reactionSpeed  ?? 15,
        abdomenAttack:   classDef.abdomenAttack  ?? false,
        rangeDamage:     classDef.rangeDamage     ?? 0,
        abdomenCooldown: classDef.abdomenCooldown ?? 90
    };

    const spawnX = zoneIndex * ZONE_LENGTH + Math.random() * ZONE_LENGTH;
    const wallY  = Math.random() > 0.5 ? -1 : 5;

    const predator = new Predator(className, def, spawnX, wallY);
    predator.state        = "crawl_in";
    predator.entryTargetY = 3;
    predator.speciesName  = speciesName;
    predator.className    = className;
    predator.dnaDrops     = classDef.dnaDrops;
    predator.shardDrop    = classDef.shardDrop;
    predator.homeZone     = zoneIndex;
    // Apply species-specific body shaping
    applySpeciesBody(predator, speciesName);

    actors.push(predator);
    zonePredators[zoneIndex] = predator;
    return predator;
}
