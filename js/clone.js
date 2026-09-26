// ─────────────────────────────────────────────────────────
//  CLONE SYSTEM
// ─────────────────────────────────────────────────────────
let cloneMenuOpen = false;

function openCloneMenu() {
    cloneMenuOpen = true;
    drawCloneMenu();
}

const MAX_CLONES = 4; // summon cap — no more than 4 clones active at once

function getCloneOptions() {
    const options = [];
    const liveClones = actors.filter(a => a.isClone && !a.dead).length;
    Object.keys(SPECIES).forEach(speciesName => {
        ["scout","striker","tank"].forEach(className => {
            const key = speciesName + "_" + className;
            const inv = getDNA(); const have = inv[key] || 0;
            const needed = CLONE_COSTS[speciesName].splicesNeeded;
            // Shards, not followers. The old sum also counted tankExtra TWICE
            // — once folded into baseCost and again on the next line — so a
            // tank quietly cost double what the table said.
            const shardCost = cloneShardCost(speciesName, className);
            options.push({
                key, speciesName, className,
                have, needed,
                shardCost,
                ready: have >= needed && shardCount >= shardCost && liveClones < MAX_CLONES
            });
        });
    });
    // Only show species we have at least 1 splice for
    return options.filter(o => o.have > 0);
}

// Why a row cannot be bought, in the order the player can do something about
// it. Short enough for the button-sized box; cloneBlockedReason() is the long
// form for the floating text.
function cloneBlockedReason(option) {
    if (!option) return null;
    const live = actors.filter(a => a.isClone && !a.dead).length;
    if (live >= MAX_CLONES)
        return "CLONE CAP " + live + "/" + MAX_CLONES + " — DISMISS ONE FIRST";
    if (option.have < option.needed)
        return "NEED " + (option.needed - option.have) + " MORE " +
               option.speciesName.toUpperCase() + " DNA";
    if (shardCount < option.shardCost)
        return "NEED " + (option.shardCost - shardCount) + " MORE SHARDS";
    return null;
}

function cloneBlockedLabel(option) {
    const live = actors.filter(a => a.isClone && !a.dead).length;
    if (live >= MAX_CLONES)                  return "CAP " + live + "/" + MAX_CLONES;
    if (option.have < option.needed)         return "DNA " + option.have + "/" + option.needed;
    if (shardCount < option.shardCost)       return "NEED " + option.shardCost + "✦";
    return "—";
}

// Free a slot. Clones persist across waves — waves.js rebuilds cloneArmy at the
// start of each one — so four of them stayed out for the rest of the game and
// the cap sat permanently full with no way to clear it. There was no dismiss
// anywhere in the game.
function dismissOldestClone() {
    const live = actors.filter(a => a.isClone && !a.dead);
    if (live.length === 0) return false;
    const c = live[0];   // actors order is summon order
    c.dead = true;
    c.dismissed = true;
    floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80,
        text: (c.speciesName || "CLONE").toUpperCase() + " DISMISSED",
        color: "#88aacc", life: 100, vy: -0.2 });
    return true;
}

function executeClone(option) {
    if (!option.ready) {
        const why = cloneBlockedReason(option);
        if (why) {
            floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80,
                text: why, color: "#f44", life: 110, vy: -0.22, size: 12 });
        }
        return;
    }
    if (actors.filter(a => a.isClone && !a.dead).length >= MAX_CLONES) return;

    // Re-checked here rather than trusting option.ready, which was computed
    // whenever the menu was last built — shards can have been spent since.
    const cost = cloneShardCost(option.speciesName, option.className);
    if (shardCount < cost) {
        floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80,
            text: "NEED " + cost + " SHARDS TO CLONE", color: "#f44", life: 100, vy: -0.2 });
        return;
    }

    // Splices and shards. NO followers — cloning used to kill up to five of
    // them at the Crystal, which is why nobody used it.
    deductDNA(option.key, option.needed);
    shardCount -= cost;
    if (typeof saveShards === "function") saveShards();

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
    clone.state       = "hunt";
    clone.wanderTimer = 0;
    clone.team        = "green";
    clone.isClone     = true;
    clone.power       = Math.round(clone.power * 3);   // clones hit hard
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

        // Shard cost — greyed when you cannot afford it, so the number itself
        // says why the CLONE button is missing.
        ctx.fillStyle = shardCount >= opt.shardCost ? "#ffee44" : "#775533";
        ctx.fillText(opt.shardCost + " shards", panelX + 120, rowY + 42);

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
    // Synthetic species — delegate visual body to the base template they were modded from
    if (SYNTHETIC_SPECIES && SYNTHETIC_SPECIES[speciesName]) {
        applySpeciesBody(predator, SYNTHETIC_SPECIES[speciesName].bodyStyle);
        return;
    }

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
        predator.appendages.chelicerae.length  = 7;
        predator.appendages.chelicerae.fangCurve = 0.5;
        predator.appendages.chelicerae.thickness = 1.5;
        predator.appendages.pedipalps.enabled = true;
        predator.appendages.pedipalps.length  = 6;
        predator.appendages.spinnerets.enabled = true;
        predator.appendages.eyes.count = 8;
        predator.appendages.eyes.size  = 1.0;
        predator.appendages.eyes.glow  = 0.2;
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
        predator.appendages.legs.crouchRise  = 10;
    } else if (speciesName === "beetle") {
        predator.armorPlated = true;
        predator.reflectDamage = true;  // reflects incoming damage 1:1 back to attacker
        predator.segmentCornerRadius = 12;
        predator.body.head.size    = 0.5;
        predator.body.thorax.size  = 1.1;
        predator.body.abdomen.size = 1.3;
        predator.body.abdomen.segments = 1;
        predator.body.abdomen.taper = 0.95;
        predator.appendages.wings.enabled = false;
        predator.appendages.mandibles.length = 4;
        predator.appendages.legs.crouchRise  = 10;
    } else if (speciesName === "scorpion") {
        predator.hasStinger  = true;
        predator.body.abdomen.segments = 3;
        predator.body.abdomen.taper = 0.75;
        predator.appendages.wings.enabled = false;
        predator.appendages.mandibles.length = 7;
        predator.appendages.mandibles.spread = 0.6;
        predator.appendages.legs.crouchRise  = 10;
    } else if (speciesName === "mantis") {
        predator.isMantis = true;
        predator.segmentCornerRadius = 3;
        predator.body.head.size             = 0.38;
        predator.body.thorax.size           = 0.90;
        predator.body.thorax.yOffset        = -16;  // raised prothorax
        predator.body.abdomen.size          = 0.60;
        predator.body.abdomen.segments      = 1;
        predator.body.abdomen.taper         = 0.90;
        predator.body.abdomen.absoluteAngle = Math.PI * 0.38;
        predator.segmentSpacing             = 5;
        predator.appendages.antennae.enabled  = true;
        predator.appendages.antennae.length   = 12;
        predator.appendages.mandibles.enabled = true;
        predator.appendages.mandibles.length  = 8;
        predator.appendages.mandibles.spread  = 0.5;
        predator.appendages.wings.enabled     = false;
        predator.appendages.legs.coxa         = 7;
        predator.appendages.legs.femur        = 15;
        predator.appendages.legs.tibia        = 22;
    } else if (speciesName === "moth") {
        predator.isMoth = true;
        predator.segmentCornerRadius = 6;
        predator.body.head.size             = 0.30;
        predator.body.thorax.size           = 1.00;
        predator.body.thorax.yOffset        = -22;   // raised high — vertical stance
        predator.body.abdomen.size          = 0.65;
        predator.body.abdomen.segments      = 2;
        predator.body.abdomen.taper         = 0.80;
        predator.body.abdomen.absoluteAngle = -Math.PI * 0.5; // abdomen hangs straight down
        predator.segmentSpacing             = 4;
        predator.heightBoost                = 1.5;
        predator.appendages.antennae.enabled  = true;
        predator.appendages.antennae.length   = 14;
        predator.appendages.mandibles.enabled = false;
        predator.appendages.wings.enabled     = false; // wings drawn manually in draw.js
        predator.appendages.legs.coxa         = 5;
        predator.appendages.legs.femur        = 8;
        predator.appendages.legs.tibia        = 10;
        predator.joints.wingRoot.vertical     = -6;
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
        source: actor, onHit,
        element: actor.element || null,
        frame: 0
    });
}

// Where a zone's predators come out: its wall nest, and its floor VORTEX.
//
// Both, not one — "predators should spawn out of it or the wall nest". A nest
// counts while it still has health; a vortex counts while it is still open,
// which is to say not yet captured. Capturing it is what seals it, so the
// capture mechanic that was already on the tile is now also the way to shut a
// spawner down.
//
// Returns an empty list when a zone HAS spawners and every one of them is
// closed. A zone with no spawners at all returns null instead, so the caller
// can tell "nothing left to shut" from "nothing was ever there" — the second
// still spawns from the zone centre, as it always did.
function zoneSpawnPoints(zoneIndex) {
    let any = false;
    const open = [];
    for (const t of world) {
        // The home portal is not a mouth. It never produced anything — the
        // spawn loop starts at zone 1 — but it answered as one here, so
        // anything that ever counted from zero would have poured predators out
        // of the player's own doorway.
        if (t.nest && t.nestZone === zoneIndex
            && !(typeof isHomePortal === 'function' && isHomePortal(t))) {
            any = true;
            if (t.nestHealth > 0) open.push(t);
        } else if (t.nodeType === 'capacitor_node' &&
                   typeof getZoneIndex === 'function' && getZoneIndex(Math.floor(t.x)) === zoneIndex) {
            any = true;
            if (!t.captured) open.push(t);
        }
    }
    return any ? open : null;
}

function spawnPredatorForZone(zoneIndex) {
    const speciesName = getZoneSpecies(zoneIndex, gameState.nightNumber);
    const className   = getZoneClass(zoneIndex);
    // Natural species live in SPECIES; synthetic deep-zone constructs live in SYNTHETIC_SPECIES
    const speciesDef  = SPECIES[speciesName] || SYNTHETIC_SPECIES[speciesName];
    const classDef    = getClassDef(speciesDef, className);

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

    // Elite randomization: later zones spawn increasingly powerful mutant variants
    const _eliteInstMuts = maybeApplyEliteDef(def, zoneIndex);

    // Out of whichever mouth this zone still has open — the wall nest or the
    // floor vortex. With both open it is a coin toss, so a zone with two feels
    // like two. With neither, the zone centre, as before.
    const mouths = zoneSpawnPoints(zoneIndex);
    const from   = (mouths && mouths.length)
        ? mouths[Math.floor(Math.random() * mouths.length)]
        : null;
    const spawnX = from ? from.x : zoneIndex * ZONE_LENGTH + Math.floor(ZONE_LENGTH / 2);
    const spawnY = from ? from.y : 2;

    const predator = new Predator(className, def, spawnX, spawnY);
    const isAlarmZone = alertActive && (alertType === "facility" || zoneIndex === alertZone);
    // Predators from zones higher than the alarm zone are always wanderers — they don't aggro on alarm
    const isHigherZone = alertActive && alertZone !== null && zoneIndex > alertZone;
    predator.state        = (isAlarmZone && !isHigherZone) ? "hunt" : "wander";
    predator.isWanderer   = alertActive && (!isAlarmZone || isHigherZone);
    predator.speciesName  = speciesName;
    predator.className    = className;
    predator.dnaDrops     = classDef.dnaDrops;
    predator.shardDrop    = classDef.shardDrop;
    predator.homeZone     = zoneIndex;
    // Apply species-specific body shaping
    applySpeciesBody(predator, speciesName);
    // Finalize elite mutations (must run after applySpeciesBody)
    if (_eliteInstMuts !== null) applyEliteInstance(predator, _eliteInstMuts, def);

    // Capture the final speed after every mutation, so slows scale from the
    // real base rather than from whatever the AI last parked moveSpeed at.
    predator.baseMoveSpeed = predator.moveSpeed;
    // Resolve the charge-up special now that species and class are both known.
    initAbility(predator);
    // Its own gardening pace, so a batch of spawns does not later finish
    // converting a batch of pylons on the same frame. Read at call time —
    // infest.js loads after this file.
    if (typeof rollInfestSettle === "function") rollInfestSettle(predator);

    actors.push(predator);
    if (!zonePredators[zoneIndex]) zonePredators[zoneIndex] = [];
    zonePredators[zoneIndex].push(predator);
    return predator;
}

// ─────────────────────────────────────────────────────────
//  GYRATING CLONE BLOB BUTTON  (top-right)
// ─────────────────────────────────────────────────────────
const _BLOB = { x:0, y:0, r:26 };

function drawClonesBlob() {
    const bx = canvas.width - 38, by = 72;
    _BLOB.x = bx; _BLOB.y = by;
    const t = (frame||0) * 0.055;
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);

    // Gyrating organic blob (8 lobes, phase-offset sin waves)
    const N = 28;
    ctx.beginPath();
    for (let i = 0; i <= N; i++) {
        const a = (i / N) * Math.PI * 2;
        const r = _BLOB.r * (1
            + 0.28*Math.sin(a*3 + t)
            + 0.14*Math.sin(a*5 + t*1.6)
            + 0.08*Math.sin(a*7 + t*2.3));
        const x = bx + Math.cos(a) * r;
        const y = by + Math.sin(a) * r * 0.7;
        i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    }
    ctx.closePath();
    const grad = ctx.createRadialGradient(bx-6,by-5,0, bx,by,_BLOB.r*1.3);
    grad.addColorStop(0, "#1aff88");
    grad.addColorStop(0.45,"#062e18");
    grad.addColorStop(1, "#000b05");
    ctx.fillStyle = grad;
    ctx.fill();
    // Pulsing rim
    ctx.strokeStyle = `rgba(0,255,136,${0.35+0.25*Math.sin(t)})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner "DNA" label
    ctx.fillStyle = `rgba(0,255,136,${0.6+0.3*Math.sin(t*1.3)})`;
    ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("DNA", bx, by);
    ctx.restore();
}

// ─────────────────────────────────────────────────────────
//  CRYSTAL INTERFACE  —  Tab Panel System
// ─────────────────────────────────────────────────────────

// ── State ─────────────────────────────────────────────────
const _CRYSBTN  = { x: 0, y: 0, r: 22 };  // canvas button hit area
let _crystalModPhase = 0;                   // color-cycle frame counter
let _crystalScrollY  = 0;                   // clone list scroll offset (px)

// Tab definitions
const CTABS = [
    { id:"clones",     label:"CLONE BAY",  color:"#00ccaa" },
    { id:"modulation", label:"MODULATION", color:"#aaddff" },
    { id:"status",     label:"STATUS",     color:"#4499ff" },
    { id:"info",       label:"INFO",       color:"#ffcc44" },
    { id:"recruit",    label:"RECRUIT",    color:"#0f8"    },
    { id:"craft",      label:"CRAFT",      color:"#ff9944" },
];
const CSORTS = [
    { id:"species",  label:"SPECIES"  },
    { id:"combat",   label:"COMBAT"   },
    { id:"defense",  label:"DEFENSE"  },
    { id:"hp",       label:"HP"       },
    { id:"specials", label:"SPECIALS" },
];

// What new recruits draw from. This is the modulation slider's actual job —
// until now _getModScheme() was only ever used to draw a label and swatches,
// so the slider was decorative and recruits took any unlocked element.
// Falls back to everything activated if the scheme somehow comes back empty,
// because a recruit with no element is worse than an unmodulated one.
function recruitElementPool() {
    const scheme = _getModScheme();
    const ids = (scheme.elements || []).map(e => e.id).filter(id => unlockedElements.has(id));
    return ids.length ? ids : [...unlockedElements];
}

// ── Modulation: which elements new followers come out as ──
//
// The mask is the single source of truth. Everything else — the label, the
// swatches, the HUD chip, recruitElementPool — reads it through here.
//
// It replaced a 0..1 slider that indexed a generated list of element
// combinations. With exactly two elements unlocked (fire and electric, the
// starting pair) a slider value in the 0.25..0.55 band skipped the TRI branch,
// which wants n >= 3, and fell into the BI branch where (s - 0.55) is negative:
// Math.floor gave -1, combos[-1] was undefined, and combo.map threw. A set of
// toggles has no such arithmetic to get wrong.
//
// The mask is kept honest on every read rather than only on write: elements
// come online mid-run, a reset relocks them, and a saved mask can name an
// element this save has not earned. An empty mask means "any", which is also
// the starting state, so a player who has never opened the control still gets a
// sensible mix.
function normaliseModulationMask() {
    // Prune only. Filling an empty mask with every unlocked element and KEEPING
    // it turned the implicit "any" into an explicit list the first time
    // anything read it — so a player who never opened the control had their mix
    // frozen to fire and electric, and every element earned afterwards was
    // silently left out. An empty mask stays empty and means "any".
    for (const id of [...modulationMask]) {
        if (!unlockedElements.has(id)) modulationMask.delete(id);
    }
    return ELEMENTS.filter(e => unlockedElements.has(e.id));
}

// What is actually in the mix: the mask, or everything when the player has
// made no choice. One place, so the scheme, the swatches and the recruit pool
// cannot disagree about what an empty mask means.
function modulationIncludes(id) {
    return modulationMask.size === 0 ? unlockedElements.has(id) : modulationMask.has(id);
}

function _getModScheme() {
    const unlocked = normaliseModulationMask();
    if (unlocked.length === 0) return { colors:["#888"], elements:[], size:0, label:"NONE" };
    const on = unlocked.filter(e => modulationIncludes(e.id));
    const size = on.length;
    // The label says what it does rather than naming a band: every recruit is
    // one element, or the mix it draws from.
    const label = size === unlocked.length ? "ALL \u00d7" + size
                : size === 1               ? on[0].label
                : on.map(e => e.label.slice(0, 3)).join("\u00b7");
    return { colors: on.map(e => e.color), elements: on, size, label };
}

// Toggling is the only way the mask changes. It refuses to switch the last
// element off: an empty mask reads as "any", so emptying it by tapping would
// silently do the opposite of what the tap looks like.
function modulationToggle(id) {
    const unlocked = normaliseModulationMask();
    if (!unlockedElements.has(id)) return false;
    // The first tap turns "any" into an explicit list before narrowing it, so
    // tapping a lit swatch drops that one element rather than inverting the
    // whole mix.
    if (modulationMask.size === 0) for (const e of unlocked) modulationMask.add(e.id);
    if (modulationMask.has(id)) {
        if (modulationMask.size <= 1) {
            floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80,
                text: "AT LEAST ONE ELEMENT", color: "#f88", life: 90, vy: -0.25, size: 11 });
            return false;
        }
        modulationMask.delete(id);
    } else {
        modulationMask.add(id);
    }
    modulationDirty = false;        // they have modulated; the prompt can rest
    if (typeof saveProgress === "function") saveProgress();
    const el = ELEMENTS.find(e => e.id === id);
    floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 96,
        text: "MODULATION \u2014 " + _getModScheme().label,
        color: el ? el.color : "#aaddff", life: 80, vy: -0.22, size: 11 });
    return true;
}

// One swatch per unlocked element: lit when it is in the mix, dark when it is
// not. Shared by the Crystal panel and the HUD chip so the two cannot disagree
// about what is on, and returns its hit rects so the caller can route taps.
function drawModulationSwatches(x, y, cell, gap, showLabels) {
    const unlocked = normaliseModulationMask();
    const rects = [];
    unlocked.forEach((el, i) => {
        const sx = x + i * (cell + gap);
        const on = modulationIncludes(el.id);
        const pulse = 0.5 + 0.5 * Math.sin((frame || 0) * 0.06 + i * 0.9);
        ctx.fillStyle = on ? el.color : "#10141c";
        ctx.globalAlpha = on ? 0.55 + pulse * 0.45 : 1;
        ctx.fillRect(sx, y, cell, cell);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = on ? "#ffffff" : el.color + "55";
        ctx.lineWidth = on ? 1.6 : 1;
        ctx.strokeRect(sx + 0.5, y + 0.5, cell - 1, cell - 1);
        if (showLabels) {
            ctx.fillStyle = on ? el.color : "#39404e";
            ctx.font = "bold 7px monospace";
            ctx.textAlign = "center"; ctx.textBaseline = "top";
            ctx.fillText(el.label.slice(0, 3).toUpperCase(), sx + cell / 2, y + cell + 3);
        }
        rects.push({ id: el.id, x: sx, y, w: cell, h: cell });
    });
    return rects;
}

function modulationSwatchesWidth(cell, gap) {
    const n = normaliseModulationMask().length;
    return n > 0 ? n * cell + (n - 1) * gap : 0;
}

// ── Sort clone options ────────────────────────────────────
function _sortedCloneOptions(opts, mode) {
    const copy = [...opts];
    if (mode === "combat")  return copy.sort((a,b) => (SPECIES[b.speciesName]?.[b.className]?.power||0) - (SPECIES[a.speciesName]?.[a.className]?.power||0));
    if (mode === "hp")      return copy.sort((a,b) => (SPECIES[b.speciesName]?.[b.className]?.health||0) - (SPECIES[a.speciesName]?.[a.className]?.health||0));
    if (mode === "defense") return copy.sort((a,b) => {
        const score = o => (SPECIES[o.speciesName]?.[o.className]?.health||0)*0.1 + (SPECIES[o.speciesName]?.armorPlated?8:0);
        return score(b)-score(a);
    });
    if (mode === "specials") return copy.filter(o => {
        const cl = SPECIES[o.speciesName]?.[o.className];
        return cl && (cl.abdomenAttack || (cl.rangeDamage && cl.rangeDamage > 0));
    });
    return copy; // "species" — natural order
}

// ── Modulation chip (bottom-right HUD) ────────────────
//
// Changing what your followers are made of used to be four taps deep: open the
// Crystal, find the MODULATION tab, drag a slider whose bands were unlabelled
// in play. It is the dial the whole follower economy turns on, so it belongs on
// the HUD where it can be read at a glance and changed with one tap.
//
// Bottom-right, stacked ABOVE the TUTORIAL button rather than beside it: that
// button is a fixed-position DOM element at bottom:20px, so sharing the row
// would collide on a narrow screen.
const _MODCHIP = { x: 0, y: 0, w: 0, h: 0, rects: [] };
const _MODCHIP_CELL = 16;
const _MODCHIP_GAP  = 4;
const _MODCHIP_TUT_CLEARANCE = 76;   // 20px inset + the button + a gap

function drawModulationChip() {
    // Hidden behind the Crystal panel, which covers the whole lower screen and
    // carries the same control on its MODULATION tab.
    if (crystalMenuOpen) { _MODCHIP.w = 0; _MODCHIP.rects = []; return; }
    const swW = modulationSwatchesWidth(_MODCHIP_CELL, _MODCHIP_GAP);
    if (swW <= 0) { _MODCHIP.w = 0; _MODCHIP.rects = []; return; }

    const padX = 8, padTop = 16, padBottom = 14;
    const w = swW + padX * 2;
    const h = padTop + _MODCHIP_CELL + padBottom;
    const x = Math.round(canvas.width - w - 20);
    const y = Math.round(canvas.height - _MODCHIP_TUT_CLEARANCE - h - (SAFE_BOTTOM || 0));
    _MODCHIP.x = x; _MODCHIP.y = y; _MODCHIP.w = w; _MODCHIP.h = h;

    const scheme = _getModScheme();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.fillStyle = "rgba(6,10,16,0.88)";
    _epRoundRect(x, y, w, h, 6); ctx.fill();

    // The wash sits under each element's OWN column rather than dividing the
    // body by the number of lit elements: bands by count put the second colour
    // under the third swatch, so with fire and toxic lit out of six the chip
    // read as half red and half green while the lit swatches were at the ends.
    const unlocked = normaliseModulationMask();
    if (unlocked.length > 0) {
        ctx.save();
        _epRoundRect(x, y, w, h, 6); ctx.clip();
        unlocked.forEach((el, i) => {
            if (!modulationIncludes(el.id)) return;
            const cx0 = x + padX + i * (_MODCHIP_CELL + _MODCHIP_GAP) - _MODCHIP_GAP / 2;
            ctx.globalAlpha = 0.20;
            ctx.fillStyle = el.color;
            ctx.fillRect(cx0, y, _MODCHIP_CELL + _MODCHIP_GAP, h);
        });
        ctx.restore();
        ctx.globalAlpha = 1;
    }

    // A prompt border while the mix is stale — a new element just came online.
    const stale = !!modulationDirty;
    const pulse = 0.5 + 0.5 * Math.sin((frame || 0) * 0.1);
    ctx.strokeStyle = stale ? `rgba(255,204,68,${0.5 + pulse * 0.5})` : "rgba(120,150,180,0.5)";
    ctx.lineWidth = stale ? 2 : 1;
    _epRoundRect(x, y, w, h, 6); ctx.stroke();

    ctx.fillStyle = stale ? "#ffcc44" : "#7f98b4";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText(stale ? "RE-MODULATE" : "MODULATION", x + w / 2, y + 4);

    _MODCHIP.rects = drawModulationSwatches(x + padX, y + padTop, _MODCHIP_CELL, _MODCHIP_GAP, false);

    ctx.fillStyle = "#93a7bd";
    ctx.font = "bold 8px monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText(scheme.label.toUpperCase(), x + w / 2, y + h - 3);
    ctx.restore();
}

// Returns true when the tap was the chip's, so the caller stops there rather
// than also issuing a world command underneath it.
function modulationChipTap(ex, ey) {
    if (crystalMenuOpen || _MODCHIP.w <= 0) return false;
    if (ex < _MODCHIP.x || ex > _MODCHIP.x + _MODCHIP.w ||
        ey < _MODCHIP.y || ey > _MODCHIP.y + _MODCHIP.h) return false;
    for (const r of _MODCHIP.rects) {
        // Generous vertically: the swatches are 16px on a touch screen.
        if (ex >= r.x - 2 && ex <= r.x + r.w + 2 && ey >= r.y - 8 && ey <= r.y + r.h + 8) {
            modulationToggle(r.id);
            return true;
        }
    }
    return true;   // a tap on the chip's body is still the chip's, not the world's
}

// ── Animated crystal HUD button (top-center) ──────────────
function drawCrystalButton() {
    const bx = Math.round(canvas.width * 0.72), by = 52;
    _CRYSBTN.x = bx; _CRYSBTN.y = by;
    const t = (frame||0) * 0.022;
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);

    // ── PROMPT ──
    // An element earned in the tunnel is useless until it is activated here,
    // and a new element makes whatever the slider was set to stale. Both are
    // easy to miss, so the button itself says so rather than relying on a
    // floating text the player may have walked away from.
    if (!crystalMenuOpen && (pendingElements.length > 0 || modulationDirty)) {
        const urgent = pendingElements.length > 0;
        const pulse = 0.5 + 0.5 * Math.sin(t * 4.2);
        const col = urgent ? "#ffcc44" : "#aaddff";
        // Ring
        ctx.strokeStyle = col; ctx.globalAlpha = 0.35 + pulse * 0.5; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(bx, by, 24 + pulse * 3, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;
        // Count badge for pending elements
        if (urgent) {
            ctx.fillStyle = col;
            ctx.beginPath(); ctx.arc(bx + 15, by - 15, 8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#1a1206"; ctx.font = "bold 11px monospace";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillText(String(pendingElements.length), bx + 15, by - 14);
        }
        // Label under the button
        ctx.fillStyle = col; ctx.globalAlpha = 0.6 + pulse * 0.4;
        ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        ctx.fillText(urgent ? "ELEMENT READY" : "RE-MODULATE", bx, by + 32);
        ctx.globalAlpha = 1;
    }

    // Outer glow when open
    if (crystalMenuOpen) {
        const pulse = 0.5 + 0.5*Math.sin(t*2.8);
        const grd = ctx.createRadialGradient(bx, by, 0, bx, by, 34);
        grd.addColorStop(0, `rgba(160,80,255,${0.28+pulse*0.18})`);
        grd.addColorStop(1, "rgba(160,80,255,0)");
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(bx, by, 34, 0, Math.PI*2); ctx.fill();
    }

    // Rotating hex gem — top crown + bottom pavilion facets
    const R=16, nF=6, girY=by-2;
    for (let i=0; i<nF; i++) {
        const a1=t+(i/nF)*Math.PI*2, a2=t+((i+1)/nF)*Math.PI*2;
        const x1=bx+Math.cos(a1)*R, y1=girY+Math.sin(a1)*R*0.38;
        const x2=bx+Math.cos(a2)*R, y2=girY+Math.sin(a2)*R*0.38;
        const br = 0.30 + 0.60*Math.abs(Math.cos(a1+t*0.45));
        const r_=Math.floor(80+br*130), g_=Math.floor(18+br*38), b_=Math.floor(155+br*95);
        ctx.fillStyle=`rgb(${r_},${g_},${b_})`;
        ctx.beginPath(); ctx.moveTo(bx,by-15); ctx.lineTo(x1,y1); ctx.lineTo(x2,y2); ctx.closePath(); ctx.fill();
        ctx.fillStyle=`rgb(${Math.floor(50+br*80)},${Math.floor(g_*0.35)},${Math.floor(110+br*80)})`;
        ctx.beginPath(); ctx.moveTo(bx,by+11); ctx.lineTo(x1,y1); ctx.lineTo(x2,y2); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = crystalMenuOpen ? "rgba(235,200,255,0.85)" : "rgba(130,55,210,0.5)";
    ctx.lineWidth=1;
    ctx.beginPath();
    for (let i=0;i<=nF;i++){const a=t+(i/nF)*Math.PI*2; i?ctx.lineTo(bx+Math.cos(a)*R,girY+Math.sin(a)*R*0.38):ctx.moveTo(bx+Math.cos(a)*R,girY+Math.sin(a)*R*0.38);}
    ctx.stroke();
    ctx.restore();
}

// ── 2D crystal visual (modulation tab) ───────────────────
function _draw2DCrystal(cx, cy, R, color) {
    let cr=150, cg=150, cb=255;
    try {
        const h=color.replace('#','');
        if (h.length>=6){cr=parseInt(h.slice(0,2),16);cg=parseInt(h.slice(2,4),16);cb=parseInt(h.slice(4,6),16);}
    } catch(e){}

    const grd = ctx.createRadialGradient(cx,cy,0,cx,cy,R*1.35);
    grd.addColorStop(0,`rgba(${cr},${cg},${cb},0.22)`);
    grd.addColorStop(1,`rgba(${cr},${cg},${cb},0)`);
    ctx.fillStyle=grd; ctx.beginPath(); ctx.arc(cx,cy,R*1.35,0,Math.PI*2); ctx.fill();

    const tableR=R*0.52, tableY=cy-R*0.18, crownH=R*0.58, pavH=R*0.62, nF=8;
    const ft=(frame||0)*0.014;
    for (let i=0;i<nF;i++){
        const a1=(i/nF)*Math.PI*2, a2=((i+1)/nF)*Math.PI*2;
        const x1=cx+Math.cos(a1)*tableR, y1=tableY+Math.sin(a1)*tableR*0.33;
        const x2=cx+Math.cos(a2)*tableR, y2=tableY+Math.sin(a2)*tableR*0.33;
        const br=0.18+0.65*Math.abs(Math.sin(a1+ft));
        ctx.fillStyle=`rgba(${Math.floor(cr*br)},${Math.floor(cg*br)},${Math.floor(cb*br)},0.92)`;
        ctx.beginPath(); ctx.moveTo(cx,cy+pavH); ctx.lineTo(x1,y1); ctx.lineTo(x2,y2); ctx.closePath(); ctx.fill();
        const brT=0.28+0.65*Math.abs(Math.cos(a1+ft));
        ctx.fillStyle=`rgba(${Math.min(255,Math.floor(cr*brT+55))},${Math.min(255,Math.floor(cg*brT+38))},${Math.min(255,Math.floor(cb*brT+42))},0.93)`;
        ctx.beginPath(); ctx.moveTo(cx,cy-crownH); ctx.lineTo(x1,y1); ctx.lineTo(x2,y2); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle=`rgba(${Math.min(255,cr+85)},${Math.min(255,cg+65)},${Math.min(255,cb+55)},0.72)`;
    ctx.beginPath();
    for(let i=0;i<=nF;i++){const a=(i/nF)*Math.PI*2;const x=cx+Math.cos(a)*tableR,y=tableY+Math.sin(a)*tableR*0.33;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle=`rgba(${Math.min(255,cr+110)},${Math.min(255,cg+90)},${Math.min(255,cb+90)},0.65)`;
    ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.moveTo(cx,cy-crownH);
    for(let i=0;i<=nF;i++){const a=(i/nF)*Math.PI*2;ctx.lineTo(cx+Math.cos(a)*tableR,tableY+Math.sin(a)*tableR*0.33);}
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx,cy+pavH);
    for(let i=0;i<=nF;i++){const a=(i/nF)*Math.PI*2;ctx.lineTo(cx+Math.cos(a)*tableR,tableY+Math.sin(a)*tableR*0.33);}
    ctx.closePath(); ctx.stroke();
}

// ── Main panel drawing ────────────────────────────────────
function drawCrystalPanel() {
    if (!crystalMenuOpen) return;

    const PW  = Math.min(430, canvas.width - 12);
    const PX  = Math.round((canvas.width - PW) / 2);
    const PY  = 110;
    const tabH = 36;
    const closeW = 34;
    const tabAreaW = PW - closeW;
    const tabW = Math.floor(tabAreaW / CTABS.length);
    const contentY = PY + tabH;
    const contentH = Math.min(canvas.height - contentY - 8, 510);

    // Advance modulation blink
    const scheme = _getModScheme();
    const blinkRate = Math.max(5, 34 - scheme.size * 5);
    _crystalModPhase++;
    const cycleIdx = Math.floor(_crystalModPhase / blinkRate) % Math.max(1, scheme.colors.length);
    const cycleColor = scheme.colors[cycleIdx] || "#888";

    ctx.save(); ctx.setTransform(1,0,0,1,0,0);

    // Semi-transparent overlay below top HUD
    ctx.fillStyle = "rgba(1,0,7,0.92)";
    ctx.fillRect(0, PY - 4, canvas.width, canvas.height - (PY - 4));

    // ── Tab bar ───────────────────────────────────────────
    CTABS.forEach((tab, i) => {
        const tx = PX + i*tabW, ty = PY;
        const act = crystalMenuTab === tab.id;
        ctx.fillStyle = act ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.45)";
        ctx.fillRect(tx, ty, tabW, tabH);
        if (act) { ctx.fillStyle=tab.color; ctx.fillRect(tx+1, ty+tabH-3, tabW-2, 3); }
        ctx.strokeStyle = act ? tab.color+"66" : "#1e1e30"; ctx.lineWidth=1;
        ctx.strokeRect(tx, ty, tabW, tabH);
        ctx.fillStyle = act ? "#fff" : "#4a5060";
        ctx.font = `bold ${Math.min(9,Math.floor(tabW/6.2))}px monospace`;
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(tab.label, tx+tabW/2, ty+tabH/2);
    });

    // Close button
    const cx2 = PX + tabAreaW;
    ctx.fillStyle="rgba(55,0,0,0.65)"; ctx.fillRect(cx2, PY, closeW, tabH);
    ctx.strokeStyle="#310"; ctx.lineWidth=1; ctx.strokeRect(cx2, PY, closeW, tabH);
    ctx.fillStyle="#f33"; ctx.font="bold 16px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("×", cx2+closeW/2, PY+tabH/2);

    // ── Content area ──────────────────────────────────────
    ctx.fillStyle="rgba(4,2,14,0.98)"; ctx.fillRect(PX, contentY, PW, contentH);
    ctx.strokeStyle="#141428"; ctx.lineWidth=1; ctx.strokeRect(PX, contentY, PW, contentH);

    ctx.save();
    ctx.beginPath(); ctx.rect(PX+1, contentY+1, PW-2, contentH-2); ctx.clip();

    switch(crystalMenuTab) {
        case "clones":     _drawClonesTab(PX, contentY, PW, contentH); break;
        case "modulation": _drawModTab(PX, contentY, PW, contentH, scheme, cycleColor); break;
        case "status":     _drawStatusTab(PX, contentY, PW, contentH); break;
        case "info":       _drawInfoTab(PX, contentY, PW, contentH); break;
        case "recruit":    _drawRecruitTab(PX, contentY, PW, contentH); break;
        case "craft":      _drawCraftTab(PX, contentY, PW, contentH); break;
    }
    ctx.restore();
    ctx.restore();

    window._cpBounds = { PX, PY, PW, tabH, contentY, contentH, tabW, tabAreaW, closeX:cx2, closeW };
}

// ── Tab: Clone Bay ────────────────────────────────────────
function _drawClonesTab(PX, PY, PW, PH) {
    const sortH = 28;
    const sortW = Math.floor(PW / CSORTS.length);
    CSORTS.forEach((s, i) => {
        const tx=PX+i*sortW, ty=PY;
        const act = crystalCloneSort === s.id;
        ctx.fillStyle = act ? "rgba(0,204,170,0.11)" : "rgba(0,0,0,0)";
        ctx.fillRect(tx, ty, sortW, sortH);
        if (act) { ctx.fillStyle="#00ccaa"; ctx.fillRect(tx+1, ty+sortH-2, sortW-2, 2); }
        ctx.strokeStyle = act ? "#00ccaa66" : "#1c1c2a"; ctx.lineWidth=1; ctx.strokeRect(tx, ty, sortW, sortH);
        ctx.fillStyle = act ? "#00ccaa" : "#3a4055";
        ctx.font=`bold ${Math.min(9,Math.floor(sortW/5.5))}px monospace`;
        ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText(s.label, tx+sortW/2, ty+sortH/2);
    });

    // Clone cap indicator
    const liveClones = actors.filter(a => a.isClone && !a.dead).length;
    const capY = PY + sortH + 4;
    const capAtMax = liveClones >= MAX_CLONES;
    ctx.fillStyle = capAtMax ? "#ff4444" : "#3a5040";
    ctx.font = "bold 9px monospace"; ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
    ctx.fillText(`CLONES: ${liveClones}/${MAX_CLONES}`, PX+PW-8, capY+10);
    // DISMISS — the only way to free a slot. Clones persist across waves, so
    // without this the cap filled once and stayed full for the rest of the
    // game, which is what made the whole menu look broken.
    if (liveClones > 0) {
        const dw=54, dh=14, dx=PX+PW-8-dw-74, dy=capY-2;
        ctx.fillStyle = capAtMax ? "#3a2030" : "#1c2028";
        ctx.fillRect(dx,dy,dw,dh);
        ctx.strokeStyle = capAtMax ? "#cc5577" : "#3a4055"; ctx.lineWidth=1;
        ctx.strokeRect(dx,dy,dw,dh);
        ctx.fillStyle = capAtMax ? "#ffaacc" : "#66708a";
        ctx.font="bold 8px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText("DISMISS", dx+dw/2, dy+dh/2);
        window._cloneDismissBtn = { x:dx, y:dy, w:dw, h:dh };
        ctx.textAlign="right"; ctx.textBaseline="alphabetic";
    } else { window._cloneDismissBtn = null; }

    const listY = PY + sortH + 18;
    const listH = PH - sortH - 18;
    const opts  = _sortedCloneOptions(getCloneOptions(), crystalCloneSort);
    const rowH  = 54;

    if (opts.length === 0) {
        ctx.fillStyle="#3a4055"; ctx.font="11px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle";
        const msg = capAtMax ? `Clone cap reached (${MAX_CLONES}/${MAX_CLONES})` : crystalCloneSort==="specials" ? "No clones with special attacks" : "No DNA splices available";
        ctx.fillText(msg, PX+PW/2, listY+listH/2);
        return;
    }

    const maxScroll = Math.max(0, opts.length*rowH - listH + 4);
    _crystalScrollY = Math.max(0, Math.min(_crystalScrollY, maxScroll));

    ctx.save(); ctx.beginPath(); ctx.rect(PX, listY, PW, listH); ctx.clip();
    opts.forEach((opt, i) => {
        const rowY = listY + i*rowH - _crystalScrollY;
        if (rowY+rowH < listY || rowY > listY+listH) return;
        // The list is CLIPPED, so a partially-visible row draws its button
        // outside the visible band — invisible, but the bounds were recorded
        // anyway. A sweep of every sort mode and scroll position found sixteen
        // buttons you could not see and could still press, buying a clone you
        // never chose. Bounds are only recorded when the button itself is
        // wholly inside the band.
        const btnTop = rowY + 10, btnBot = rowY + 34;
        const btnVisible = btnTop >= listY && btnBot <= listY + listH;
        const sd = SPECIES[opt.speciesName];
        const cl = SPECIES[opt.speciesName]?.[opt.className];

        ctx.fillStyle = opt.ready ? "rgba(0,255,136,0.05)" : "rgba(255,255,255,0.015)";
        ctx.fillRect(PX+5, rowY+2, PW-10, rowH-4);
        ctx.strokeStyle = opt.ready ? "#0f844" : "#1c1c2a"; ctx.lineWidth=opt.ready?1:0.5;
        ctx.strokeRect(PX+5, rowY+2, PW-10, rowH-4);

        ctx.fillStyle=sd.color; ctx.beginPath(); ctx.arc(PX+19, rowY+rowH/2-2, 7, 0, Math.PI*2); ctx.fill();

        ctx.fillStyle=opt.ready?"#ddeedd":"#5a6070"; ctx.font="bold 11px monospace"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
        ctx.fillText(opt.speciesName.toUpperCase()+" "+opt.className.toUpperCase(), PX+32, rowY+17);

        if (cl) {
            ctx.fillStyle="#3a4a50"; ctx.font="9px monospace";
            const parts=[`PWR:${cl.power||"?"}`, `HP:${cl.health||"?"}`];
            if (cl.abdomenAttack||(cl.rangeDamage&&cl.rangeDamage>0)) {
                if (opt.speciesName === "spider")  parts.push("◈ WEB SHOT");
                else if (opt.speciesName === "mantis") parts.push("◈ AMBUSH");
                else if (opt.speciesName === "moth")   parts.push("◈ DUST");
                else parts.push("◈ SPECIAL");
            }
            ctx.fillText(parts.join("  "), PX+32, rowY+30);
        }

        const prog = Math.min(1, opt.have/opt.needed);
        ctx.fillStyle="#0a0c10"; ctx.fillRect(PX+32, rowY+35, 120, 6);
        ctx.fillStyle=opt.ready?"#0f8":sd.color; ctx.fillRect(PX+32, rowY+35, 120*prog, 6);
        ctx.fillStyle="#3a4055"; ctx.font="9px monospace"; ctx.textBaseline="alphabetic";
        ctx.fillText(`${opt.have}/${opt.needed} splices`, PX+32, rowY+50);
        ctx.fillStyle = shardCount >= opt.shardCost ? "#ffee44" : "#775533";
        ctx.textAlign="right";
        ctx.fillText(`${opt.shardCost}✦`, PX+PW-54, rowY+50);

        if (opt.ready) {
            const bx=PX+PW-72, by2=rowY+10, bw=62, bh=24;
            ctx.fillStyle="#0f8"; ctx.fillRect(bx,by2,bw,bh);
            ctx.fillStyle="#001a0a"; ctx.font="bold 10px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle";
            ctx.fillText("CLONE", bx+bw/2, by2+bh/2);
            if (btnVisible) { opt._bx=bx; opt._by=by2; opt._bw=bw; opt._bh=bh; }
        } else {
            // WHY NOT. A blocked row used to render dim with no button and no
            // reason, so a player with four clones already out saw three
            // affordable prices and nothing to press — "even though I have the
            // money, I'm unable to buy the clone". The blocker goes where the
            // button would have been.
            const bx=PX+PW-72, by2=rowY+10, bw=62, bh=24;
            ctx.fillStyle="#2a1a1a"; ctx.fillRect(bx,by2,bw,bh);
            ctx.strokeStyle="#553344"; ctx.lineWidth=1; ctx.strokeRect(bx,by2,bw,bh);
            ctx.fillStyle="#cc7788"; ctx.font="bold 9px monospace";
            ctx.textAlign="center"; ctx.textBaseline="middle";
            ctx.fillText(cloneBlockedLabel(opt), bx+bw/2, by2+bh/2);
            // Tappable, so the tap can EXPLAIN. Kept separate from _bx, which
            // means "this can be bought".
            if (btnVisible) { opt._nbx=bx; opt._nby=by2; opt._nbw=bw; opt._nbh=bh; }
        }
    });
    ctx.restore();

    // Scroll arrows
    if (maxScroll > 0) {
        const arrW=28, arrH=20;
        // Up arrow
        ctx.fillStyle=_crystalScrollY>0?"rgba(0,255,136,0.18)":"rgba(30,30,50,0.5)";
        ctx.fillRect(PX+PW/2-arrW/2, listY+2, arrW, arrH);
        ctx.fillStyle=_crystalScrollY>0?"#0f8":"#334"; ctx.font="11px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle";
        ctx.fillText("▲", PX+PW/2, listY+12);
        // Down arrow
        ctx.fillStyle=_crystalScrollY<maxScroll?"rgba(0,255,136,0.18)":"rgba(30,30,50,0.5)";
        ctx.fillRect(PX+PW/2-arrW/2, listY+listH-arrH-2, arrW, arrH);
        ctx.fillStyle=_crystalScrollY<maxScroll?"#0f8":"#334";
        ctx.fillText("▼", PX+PW/2, listY+listH-12);
        window._cloneScrollArrows={
            upX:PX+PW/2-arrW/2, upY:listY+2, upW:arrW, upH:arrH,
            dnX:PX+PW/2-arrW/2, dnY:listY+listH-arrH-2, dnW:arrW, dnH:arrH,
            rowH
        };
    } else { window._cloneScrollArrows=null; }

    window._cloneTabOpts = opts;
    window._cloneTabBounds = { sortY:PY, sortH, sortW, listY, listH, rowH };
}

// ── Tab: Builds ───────────────────────────────────────────
// ── Tab: Modulation ───────────────────────────────────────
function _drawModTab(PX, PY, PW, PH, scheme, cycleColor) {
    const splitX = PX + Math.floor(PW*0.62);  // divides crystal area from slider

    // 2D crystal
    const crystX = PX + Math.floor(PW*0.31);
    const crystY = PY + Math.floor(PH*0.40);
    const crystR = Math.min(58, Math.floor(PH*0.29));
    _draw2DCrystal(crystX, crystY, crystR, cycleColor);

    // Scheme label
    ctx.fillStyle=cycleColor; ctx.font="bold 12px monospace"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    ctx.fillText(scheme.label, crystX, crystY+crystR+20);
    const sizeLabel = scheme.size===0?"none":scheme.size===1?"mono":scheme.size===2?"bi-color":scheme.size===3?"tri-color":"all elements";
    ctx.fillStyle="#3a4055"; ctx.font="9px monospace";
    ctx.fillText(sizeLabel, crystX, crystY+crystR+33);

    // Color swatches
    if (scheme.colors.length > 0) {
        const sw = Math.min(26, Math.floor((splitX-PX-20) / scheme.colors.length) - 4);
        scheme.colors.forEach((col, i) => {
            const sx = PX+10 + i*(sw+4);
            const sy = crystY+crystR+40;
            const _ci = Math.floor(_crystalModPhase / Math.max(5,34-scheme.size*5)) % scheme.colors.length;
            const isHot2 = i === _ci;
            ctx.fillStyle = isHot2 ? col : col+"44";
            ctx.fillRect(sx, sy, sw, 8);
            if (isHot2) { ctx.strokeStyle=col; ctx.lineWidth=1.5; ctx.strokeRect(sx-1,sy-1,sw+2,10); }
        });
    }

    // ── PENDING ELEMENTS — earned by kills, activated here ──────────────
    // This is the whole point of coming back to the Crystal: an element you
    // earned in the tunnel does nothing until you bring it online here.
    window._modActivateRects = [];
    let pendY = crystY + crystR + 58;
    if (pendingElements.length > 0) {
        ctx.fillStyle = "#ffcc44"; ctx.font = "bold 9px monospace";
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        ctx.fillText("EARNED — TAP TO ACTIVATE:", PX + 10, pendY);
        pendY += 6;
        pendingElements.forEach((id, i) => {
            const el = ELEMENTS.find(e => e.id === id);
            const col = el ? el.color : "#888";
            const bx = PX + 10, by = pendY + i * 20, bw = Math.min(150, splitX - PX - 20), bh = 17;
            const pulse = 0.5 + 0.5 * Math.sin(_crystalModPhase * 0.09 + i);
            ctx.fillStyle = col + "22"; ctx.fillRect(bx, by, bw, bh);
            ctx.strokeStyle = col; ctx.globalAlpha = 0.5 + pulse * 0.5; ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, bw, bh); ctx.globalAlpha = 1;
            ctx.fillStyle = col; ctx.font = "bold 10px monospace";
            ctx.fillText("◈ ACTIVATE " + (el ? el.label : id.toUpperCase()), bx + 6, by + 12);
            window._modActivateRects.push({ id, bx, by, bw, bh });
        });
        pendY += pendingElements.length * 20 + 6;
    } else {
        const next = nextWaveUnlock();
        ctx.fillStyle = "#2a3040"; ctx.font = "9px monospace";
        ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
        if (next) {
            const el = ELEMENTS.find(e => e.id === next.element);
            ctx.fillText("NEXT: " + (el ? el.label : next.element.toUpperCase()) +
                         " — CLEAR A WAVE", PX + 10, pendY);
        } else {
            ctx.fillText("ALL ELEMENTS ONLINE · " + lifetimeKills + " kills", PX + 10, pendY);
        }
        pendY += 14;
    }

    // Owned modulators list (bottom of left area)
    const modListY = Math.min(Math.max(pendY + 6, crystY+crystR+60), PY+PH-50);
    ctx.fillStyle="#2a3040"; ctx.font="9px monospace"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    ctx.fillText("OWNED MODULATORS:", PX+10, modListY);
    if (ownedModulators.length === 0) {
        ctx.fillStyle="#2e3545"; ctx.fillText("none — defeat a boss to unlock", PX+10, modListY+13);
    } else {
        ownedModulators.forEach((mod, i) => {
            const el=ELEMENTS.find(e=>e.id===mod.element);
            ctx.fillStyle=el?el.color:"#888";
            ctx.fillText(`◈ ${(el?.label||mod.element).toUpperCase()}`, PX+10+i*80, modListY+13);
        });
    }

    // ── The control ───────────────────────────────────
    // The same swatch row as the HUD chip, so there is one mechanism and the
    // two cannot disagree. It replaced a vertical slider with four unlabelled
    // bands (ALL / TRI / BI / MONO) that indexed a generated combination list;
    // that indexing is what crashed on two unlocked elements.
    const modX = splitX + 16;
    const modY = PY + 40;
    const cell = 26, gap = 8;
    ctx.fillStyle = "#aaddff"; ctx.font = "bold 11px monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("NEW FOLLOWERS COME OUT AS:", modX, modY - 12);

    window._modSwatchRects = drawModulationSwatches(modX, modY, cell, gap, true);

    ctx.fillStyle = "#49556a"; ctx.font = "9px monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText("Tap an element to add or drop it from the mix.", modX, modY + cell + 26);
    ctx.fillText("They take it at the Crystal \u2014 on recruitment, and again", modX, modY + cell + 39);
    ctx.fillText("every time one respawns.", modX, modY + cell + 52);

    const sch = _getModScheme();
    ctx.fillStyle = cycleColor; ctx.font = "bold 12px monospace";
    ctx.fillText(sch.label.toUpperCase(), modX, modY + cell + 74);
}

// ── Tab: Status ───────────────────────────────────────────
function _drawStatusTab(PX, PY, PW, PH) {
    const brawlers=followers.filter(a=>!a.dead&&a.role==="brawler").length;
    const snipers =followers.filter(a=>!a.dead&&a.role==="sniper").length;
    const campers =followers.filter(a=>!a.dead&&a.role==="camper").length;
    const ghosts  =followers.filter(a=>!a.dead&&a.ghostphageLife).length;
    ctx.fillStyle="#4499ff"; ctx.font="bold 12px monospace"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    ctx.fillText("COLONY STATUS", PX+PW/2, PY+22);
    const rows=[
        ["Total Followers", followers.filter(a=>!a.dead).length, "#0f8"],
        ["Brawlers",  brawlers, "#f88"],
        ["Snipers",   snipers,  "#88aaff"],
        ["Campers",   campers,  "#88ff88"],
        ["Ghosts",    ghosts,   "#aaffee"],
        ["Wave",      gameState.nightNumber, "#aaaaaa"],
        ["Zone Depth",activeDayZones-1, "#ffcc44"],
    ];
    rows.forEach((r, i) => {
        const ry=PY+36+i*22;
        ctx.fillStyle=i%2===0?"rgba(20,20,35,0.5)":"rgba(0,0,0,0)";
        ctx.fillRect(PX+8, ry-13, PW-16, 20);
        ctx.fillStyle="#445060"; ctx.font="10px monospace"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
        ctx.fillText(r[0], PX+16, ry);
        ctx.fillStyle=r[2]; ctx.textAlign="right";
        ctx.fillText(r[1], PX+PW-14, ry);
    });
    // Element breakdown
    const elY = PY+46+rows.length*22;
    ctx.fillStyle="#2e3a45"; ctx.font="9px monospace"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    ctx.fillText("ELEMENTS:", PX+14, elY);
    let ex3=PX+80;
    ELEMENTS.filter(e=>unlockedElements.has(e.id)).forEach(el=>{
        const cnt=(followerByElement[el.id]||[]).filter(a=>!a.dead).length;
        ctx.fillStyle=el.color; ctx.fillText(`${el.label.slice(0,3)}:${cnt}`, ex3, elY);
        ex3+=50;
    });
}

// ── Tab: Info ─────────────────────────────────────────────
function _drawInfoTab(PX, PY, PW, PH) {
    const ultimates=[
        {el:"fire",    name:"Nova Flare",   desc:"Ring of fire · burns all in 5 tiles"},
        {el:"electric",name:"Overload",     desc:"Chain stun · 2s paralysis in 6 tiles"},
        {el:"ice",     name:"Deep Freeze",  desc:"Force-freeze · huge 8-tile radius"},
        {el:"flux",    name:"Dim. Rift",    desc:"Pull+push+disorient in 5 tiles"},
        {el:"core",    name:"Bulwark",      desc:"Shield ALL followers + knockback ring"},
        {el:"toxic",   name:"Plague Bloom", desc:"4 toxic clouds on random enemies"},
    ];
    const pylons=[
        {col:"#0f8",    text:"BUILD ("+PYLON_BUILD_COST+" shards) — place on any floor tile"},
        {col:"#ffcc44", text:"UPGRADE — merge a follower into the pylon"},
        {col:"#88aaff", text:"WAVE/ATTACK — toggle pylon firing mode"},
        {col:"#ff8844", text:"RECON — send squad to reconstruct a pylon"},
        {col:"#cc66ff", text:"Crystal slowly refills all follower ultimates"},
        {col:"#00ffcc", text:"Deeper zone pylons = faster charge rate"},
        {col:"#ff4444", text:"Nest pod link grants bonus charge"},
    ];
    ctx.fillStyle="#ffcc44"; ctx.font="bold 11px monospace"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    ctx.fillText("ULTIMATES — double-tap follower when fully charged", PX+PW/2, PY+17);
    ultimates.forEach((r,i)=>{
        const ry=PY+28+i*18;
        if (i%2===0){ctx.fillStyle="rgba(20,18,8,0.5)"; ctx.fillRect(PX+6,ry-11,PW-12,18);}
        const el=ELEMENTS.find(e=>e.id===r.el);
        const col=el?el.color:"#fff";
        ctx.fillStyle=col; ctx.font="bold 9px monospace"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
        ctx.fillText(r.name, PX+10, ry);
        ctx.fillStyle="#7a8090"; ctx.font="9px monospace";
        ctx.fillText(r.desc, PX+100, ry);
    });
    const sep=PY+28+ultimates.length*18+8;
    ctx.strokeStyle="#2d2200"; ctx.lineWidth=1;
    ctx.beginPath(); ctx.moveTo(PX+8,sep); ctx.lineTo(PX+PW-8,sep); ctx.stroke();
    ctx.fillStyle="#ffaa44"; ctx.font="bold 10px monospace"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    ctx.fillText("PYLON GUIDE", PX+PW/2, sep+14);
    pylons.forEach((r,i)=>{
        const ry=sep+22+i*15;
        ctx.fillStyle=r.col; ctx.font="9px monospace"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
        ctx.fillText("▸ "+r.text, PX+10, ry);
    });
}

// ── Tab: Recruit ──────────────────────────────────────────
function _drawRecruitTab(PX, PY, PW, PH) {
    const canAfford = shardCount >= 30;
    ctx.textBaseline = "middle";

    // Header
    ctx.fillStyle = "#0f8"; ctx.font = "bold 12px monospace"; ctx.textAlign = "center";
    ctx.fillText("RECRUIT FOLLOWER", PX + PW/2, PY + 22);

    ctx.fillStyle = "#777"; ctx.font = "10px monospace";
    ctx.fillText("Spawns a follower of a random unlocked element", PX + PW/2, PY + 44);

    // Shard display
    ctx.fillStyle = canAfford ? "#ff0" : "#f44"; ctx.font = "11px monospace";
    ctx.fillText("Shards: " + shardCount + " / 30 needed", PX + PW/2, PY + 68);

    // Button
    const btnY = PY + 88, btnH = 36;
    window._recruitBtnBounds = { x: PX + 20, y: btnY, w: PW - 40, h: btnH };
    ctx.fillStyle = canAfford ? "rgba(0,60,20,0.95)" : "rgba(20,20,20,0.9)";
    ctx.strokeStyle = canAfford ? "#0f8" : "#444"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(PX + 20, btnY, PW - 40, btnH, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = canAfford ? "#0f8" : "#555"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
    ctx.fillText("SPAWN FOLLOWER — 30 SHARDS", PX + PW/2, btnY + btnH/2);
}

// ── Panel input handler ───────────────────────────────────
function handleCrystalPanelInput(ex, ey, isDown) {
    if (!crystalMenuOpen) return false;
    const b = window._cpBounds;
    if (!b) return crystalMenuOpen;

    // Activating a pending element — checked before the slider, so a tap on an
    // ACTIVATE button is never swallowed as a slider drag.
    if (crystalMenuTab==="modulation") {
        for (const r of (window._modActivateRects||[])) {
            if (ex>=r.bx && ex<=r.bx+r.bw && ey>=r.by && ey<=r.by+r.bh) {
                activatePendingElement(r.id);
                return true;
            }
        }
    }

    // Modulation swatches. Tapped on RELEASE, not on press: a toggle that
    // fires on press repeats for every move event while the finger is down.
    if (crystalMenuTab==="modulation" && !isDown) {
        for (const r of (window._modSwatchRects||[])) {
            if (ex>=r.x-4 && ex<=r.x+r.w+4 && ey>=r.y-4 && ey<=r.y+r.h+10) {
                modulationToggle(r.id);
                return true;
            }
        }
    }
    if (!isDown) { return crystalMenuOpen; }

    // Close button
    if (ex>=b.closeX && ex<=b.closeX+b.closeW && ey>=b.PY && ey<=b.PY+b.tabH) {
        crystalMenuOpen=false; return true;
    }
    // Tab bar
    for (let i=0;i<CTABS.length;i++) {
        const tx=b.PX+i*b.tabW;
        if (ex>=tx && ex<=tx+b.tabW && ey>=b.PY && ey<=b.PY+b.tabH) {
            crystalMenuTab=CTABS[i].id; _crystalScrollY=0; return true;
        }
    }
    // Outside panel → close
    if (ex<b.PX||ex>b.PX+b.PW||ey<b.contentY||ey>b.contentY+b.contentH) {
        crystalMenuOpen=false; return true;
    }

    // ── Tab-specific taps ─────────────────────────────────
    if (crystalMenuTab==="clones") {
        const cl=window._cloneTabBounds;
        if (!cl) return true;
        // Sort sub-tabs
        if (ey>=cl.sortY && ey<=cl.sortY+cl.sortH) {
            for (let i=0;i<CSORTS.length;i++) {
                const tx=b.PX+i*cl.sortW;
                if (ex>=tx&&ex<=tx+cl.sortW) { crystalCloneSort=CSORTS[i].id; _crystalScrollY=0; return true; }
            }
        }
        // Scroll arrows
        const sa=window._cloneScrollArrows;
        if (sa) {
            if (ex>=sa.upX&&ex<=sa.upX+sa.upW&&ey>=sa.upY&&ey<=sa.upY+sa.upH) { _crystalScrollY=Math.max(0,_crystalScrollY-sa.rowH); return true; }
            if (ex>=sa.dnX&&ex<=sa.dnX+sa.dnW&&ey>=sa.dnY&&ey<=sa.dnY+sa.dnH) { _crystalScrollY+=sa.rowH; return true; }
        }
        // DISMISS — frees a slot. Checked before the rows so it is never
        // swallowed by one.
        const db = window._cloneDismissBtn;
        if (db && ex>=db.x && ex<=db.x+db.w && ey>=db.y && ey<=db.y+db.h) {
            dismissOldestClone();
            return true;
        }
        // Clone buttons
        for (const opt of (window._cloneTabOpts||[])) {
            if (!opt.ready||!opt._bx) continue;
            if (ex>=opt._bx&&ex<=opt._bx+opt._bw&&ey>=opt._by&&ey<=opt._by+opt._bh) {
                executeClone(opt); crystalMenuOpen=false; return true;
            }
        }
        // A BLOCKED row explains itself rather than swallowing the tap in
        // silence, which is what made the menu look broken.
        for (const opt of (window._cloneTabOpts||[])) {
            if (opt.ready||!opt._nbx) continue;
            if (ex>=opt._nbx&&ex<=opt._nbx+opt._nbw&&ey>=opt._nby&&ey<=opt._nby+opt._nbh) {
                executeClone(opt);   // refuses, and says why
                return true;
            }
        }
    }

    if (crystalMenuTab==="recruit" && isDown) {
        const rb = window._recruitBtnBounds;
        if (rb && ex>=rb.x && ex<=rb.x+rb.w && ey>=rb.y && ey<=rb.y+rb.h) {
            if (shardCount >= 30) {
                shardCount -= 30; saveShards();
                const pool = [...unlockedElements];
                const el = pool[Math.floor(Math.random()*pool.length)] || "fire";
                spawnFollowerAtCrystal(el);
                floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"FOLLOWER RECRUITED!",color:"#0f8",life:100,vy:-0.2});
            } else {
                floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"NEED 30 SHARDS",color:"#f44",life:90,vy:-0.2});
            }
            return true;
        }
    }

    if (crystalMenuTab==="craft" && isDown) {
        const cb = window._craftBtnBounds;
        if (cb) {
            if (cb.craft && ex>=cb.craft.x && ex<=cb.craft.x+cb.craft.w && ey>=cb.craft.y && ey<=cb.craft.y+cb.craft.h) {
                if (shardCount >= HEALTH_PAD_CRAFT_COST) {
                    shardCount -= HEALTH_PAD_CRAFT_COST; saveShards();
                    healthPads.push({ charges: HEALTH_PAD_MAX_CHARGES });
                    floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"HEALTH PAD CRAFTED",color:"#ff9944",life:100,vy:-0.2});
                } else {
                    floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:`NEED ${HEALTH_PAD_CRAFT_COST} SHARDS`,color:"#f44",life:90,vy:-0.2});
                }
                return true;
            }
            if (cb.use && ex>=cb.use.x && ex<=cb.use.x+cb.use.w && ey>=cb.use.y && ey<=cb.use.y+cb.use.h) {
                if (healthPads.length > 0 && health < 100) {
                    const pad = healthPads[0];
                    health = Math.min(100, health + HEALTH_PAD_HEAL);
                    pad.charges--;
                    if (pad.charges <= 0) healthPads.shift();
                    floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:`+${HEALTH_PAD_HEAL} HP`,color:"#ff9944",life:100,vy:-0.2});
                } else if (health >= 100) {
                    floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"HP IS FULL",color:"#888",life:60,vy:-0.2});
                } else {
                    floatingTexts.push({x:canvas.width/2,y:canvas.height/2-80,text:"NO HEALTH PADS",color:"#f44",life:90,vy:-0.2});
                }
                return true;
            }
        }
    }

    return true;
}

// ── Tab: Craft ─────────────────────────────────────────────
function _drawCraftTab(PX, PY, PW, PH) {
    const pad  = 14;
    let   cy   = PY + pad;
    const col  = "#ff9944";

    ctx.font = "bold 12px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";

    // ── Section: Health Pad ───────────────────────────────
    ctx.fillStyle = col;
    ctx.fillText("◈  HEALTH PAD", PX + pad, cy + 14);
    cy += 24;

    // Recipe info box
    ctx.fillStyle = "rgba(255,153,68,0.07)";
    ctx.fillRect(PX+pad, cy, PW-pad*2, 54);
    ctx.strokeStyle = "rgba(255,153,68,0.25)"; ctx.lineWidth = 1;
    ctx.strokeRect(PX+pad, cy, PW-pad*2, 54);

    ctx.fillStyle = "#ccc"; ctx.font = "11px monospace";
    ctx.fillText(`Recipe:  ${HEALTH_PAD_CRAFT_COST} Shards`, PX + pad + 8, cy + 16);
    ctx.fillText(`Output:  1 pad  (${HEALTH_PAD_MAX_CHARGES} charges)`, PX + pad + 8, cy + 32);
    ctx.fillText(`Effect:  +${HEALTH_PAD_HEAL} HP per charge`, PX + pad + 8, cy + 48);
    cy += 62;

    // Inventory display
    ctx.fillStyle = "#aaa"; ctx.font = "11px monospace";
    const totalCharges = healthPads.reduce((s,p) => s+p.charges, 0);
    ctx.fillText(`Inventory: ${healthPads.length} pad${healthPads.length!==1?"s":""} — ${totalCharges} charge${totalCharges!==1?"s":""} remaining`, PX+pad, cy+13);
    cy += 22;

    // Individual pad charge bars
    if (healthPads.length > 0) {
        const barW = Math.floor((PW - pad*2 - (healthPads.length-1)*4) / Math.min(healthPads.length, 8));
        healthPads.slice(0, 8).forEach((p, i) => {
            const bx = PX + pad + i * (barW + 4);
            const by = cy + 2;
            const bh = 16;
            const fill = p.charges / HEALTH_PAD_MAX_CHARGES;
            ctx.fillStyle = "rgba(255,153,68,0.15)";
            ctx.fillRect(bx, by, barW, bh);
            ctx.fillStyle = fill > 0.66 ? "#ff9944" : fill > 0.33 ? "#ffcc44" : "#ff4444";
            ctx.fillRect(bx, by, Math.round(barW * fill), bh);
            ctx.strokeStyle = "rgba(255,153,68,0.4)"; ctx.lineWidth = 1;
            ctx.strokeRect(bx, by, barW, bh);
            ctx.fillStyle = "#fff"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
            ctx.fillText(p.charges, bx + barW/2, by + bh - 3);
            ctx.textAlign = "left";
        });
        if (healthPads.length > 8) {
            ctx.fillStyle="#888"; ctx.font="10px monospace"; ctx.textAlign="center";
            ctx.fillText(`+${healthPads.length-8} more`, PX+PW/2, cy+28);
            ctx.textAlign="left";
        }
        cy += 28;
    }
    cy += 14;

    // ── Buttons ───────────────────────────────────────────
    const btnH = 36, btnW = Math.floor((PW - pad*2 - 8) / 2);
    const canCraft = shardCount >= HEALTH_PAD_CRAFT_COST;
    const canUse   = healthPads.length > 0 && health < 100;

    // CRAFT button
    const craftX = PX + pad, craftY = cy;
    ctx.fillStyle = canCraft ? "rgba(255,153,68,0.22)" : "rgba(60,40,20,0.5)";
    ctx.fillRect(craftX, craftY, btnW, btnH);
    ctx.strokeStyle = canCraft ? col : "#442200"; ctx.lineWidth = canCraft ? 2 : 1;
    ctx.strokeRect(craftX, craftY, btnW, btnH);
    ctx.fillStyle = canCraft ? col : "#664422";
    ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(`CRAFT  (${HEALTH_PAD_CRAFT_COST}◈)`, craftX + btnW/2, craftY + btnH/2);

    // USE button
    const useX = PX + pad + btnW + 8, useY = cy;
    ctx.fillStyle = canUse ? "rgba(68,255,136,0.15)" : "rgba(20,40,20,0.5)";
    ctx.fillRect(useX, useY, btnW, btnH);
    ctx.strokeStyle = canUse ? "#0f8" : "#133"; ctx.lineWidth = canUse ? 2 : 1;
    ctx.strokeRect(useX, useY, btnW, btnH);
    ctx.fillStyle = canUse ? "#0f8" : "#2a5530";
    ctx.fillText("USE PAD", useX + btnW/2, useY + btnH/2);

    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";

    window._craftBtnBounds = {
        craft: { x:craftX, y:craftY, w:btnW, h:btnH },
        use:   { x:useX,   y:useY,   w:btnW, h:btnH }
    };
}
