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
    } else if (speciesName === "mantis") {
        predator.isMantis = true;
        predator.segmentCornerRadius = 3;
        predator.body.head.size             = 0.38;
        predator.body.thorax.size           = 0.90;
        predator.body.thorax.yOffset        = -16;  // raised prothorax
        predator.body.abdomen.size          = 0.60;
        predator.body.abdomen.segments      = 1;
        predator.body.abdomen.taper         = 0.90;
        predator.body.abdomen.absoluteAngle  =  Math.PI / 2; // abdomen always points screen-upward (foreshortens when facing away)
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

    // Spawn at the zone's nest if it's alive, otherwise fall back to zone centre
    const nest   = world.find(t => t.nest && t.nestZone === zoneIndex && t.nestHealth > 0);
    const spawnX = nest ? nest.x : zoneIndex * ZONE_LENGTH + Math.floor(ZONE_LENGTH / 2);
    const spawnY = nest ? nest.y : 2;

    const predator = new Predator(className, def, spawnX, spawnY);
    predator.state        = "hunt"; // emerges from nest directly into hunt
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
let _crystalSliderDrag = false;             // true while dragging mod slider

// Tab definitions
const CTABS = [
    { id:"clones",     label:"CLONE BAY",  color:"#00ccaa" },
    { id:"builds",     label:"BUILDS",     color:"#bb55ff" },
    { id:"modulation", label:"MODULATION", color:"#aaddff" },
    { id:"status",     label:"STATUS",     color:"#4499ff" },
    { id:"info",       label:"INFO",       color:"#ffcc44" },
];
const CSORTS = [
    { id:"species",  label:"SPECIES"  },
    { id:"combat",   label:"COMBAT"   },
    { id:"defense",  label:"DEFENSE"  },
    { id:"hp",       label:"HP"       },
    { id:"specials", label:"SPECIALS" },
];

// ── Modulation scheme from slider ─────────────────────────
function _getModScheme() {
    const unlocked = ELEMENTS.filter(e => unlockedElements.has(e.id));
    const n = unlocked.length;
    if (n === 0) return { colors:["#888"], elements:[], size:0, label:"NONE" };
    const s = Math.max(0, Math.min(1, crystalModSlider));
    // Slider zones: 0–0.25=ALL, 0.25–0.55=TRI, 0.55–0.80=BI, 0.80–1.0=MONO
    if (s < 0.25 || n <= 1) {
        return { colors:unlocked.map(e=>e.color), elements:unlocked, size:n, label:"ALL ×"+n };
    }
    if (s < 0.55 && n >= 3) {
        const combos = [];
        for (let a=0;a<n;a++) for (let b=a+1;b<n;b++) for (let c=b+1;c<n;c++)
            combos.push([unlocked[a],unlocked[b],unlocked[c]]);
        const idx = Math.min(Math.floor(((s-0.25)/0.30)*combos.length), combos.length-1);
        const combo = combos[idx];
        return { colors:combo.map(e=>e.color), elements:combo, size:3,
                 label:combo.map(e=>e.label.slice(0,3)).join("·") };
    }
    if (s < 0.80 && n >= 2) {
        const combos = [];
        for (let a=0;a<n;a++) for (let b=a+1;b<n;b++) combos.push([unlocked[a],unlocked[b]]);
        const idx = Math.min(Math.floor(((s-0.55)/0.25)*combos.length), combos.length-1);
        const combo = combos[idx];
        return { colors:combo.map(e=>e.color), elements:combo, size:2,
                 label:combo.map(e=>e.label.slice(0,3)).join("·") };
    }
    const idx = Math.min(Math.floor(((s-0.80)/0.20)*n), n-1);
    const el = unlocked[Math.max(0,idx)];
    return { colors:[el.color], elements:[el], size:1, label:el.label };
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

// ── Animated crystal HUD button (top-center) ──────────────
function drawCrystalButton() {
    const bx = Math.round(canvas.width * 0.72), by = 52;
    _CRYSBTN.x = bx; _CRYSBTN.y = by;
    const t = (frame||0) * 0.022;
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);

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
        case "builds":     _drawBuildsTab(PX, contentY, PW, contentH); break;
        case "modulation": _drawModTab(PX, contentY, PW, contentH, scheme, cycleColor); break;
        case "status":     _drawStatusTab(PX, contentY, PW, contentH); break;
        case "info":       _drawInfoTab(PX, contentY, PW, contentH); break;
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

    const listY = PY + sortH;
    const listH = PH - sortH;
    const opts  = _sortedCloneOptions(getCloneOptions(), crystalCloneSort);
    const rowH  = 54;

    if (opts.length === 0) {
        ctx.fillStyle="#3a4055"; ctx.font="11px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle";
        const msg = crystalCloneSort==="specials" ? "No clones with special attacks" : "No DNA splices available";
        ctx.fillText(msg, PX+PW/2, listY+listH/2);
        return;
    }

    const maxScroll = Math.max(0, opts.length*rowH - listH + 4);
    _crystalScrollY = Math.max(0, Math.min(_crystalScrollY, maxScroll));

    ctx.save(); ctx.beginPath(); ctx.rect(PX, listY, PW, listH); ctx.clip();
    opts.forEach((opt, i) => {
        const rowY = listY + i*rowH - _crystalScrollY;
        if (rowY+rowH < listY || rowY > listY+listH) return;
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
            if (cl.abdomenAttack||(cl.rangeDamage&&cl.rangeDamage>0)) parts.push("◈ SPECIAL");
            ctx.fillText(parts.join("  "), PX+32, rowY+30);
        }

        const prog = Math.min(1, opt.have/opt.needed);
        ctx.fillStyle="#0a0c10"; ctx.fillRect(PX+32, rowY+35, 120, 6);
        ctx.fillStyle=opt.ready?"#0f8":sd.color; ctx.fillRect(PX+32, rowY+35, 120*prog, 6);
        ctx.fillStyle="#3a4055"; ctx.font="9px monospace"; ctx.textBaseline="alphabetic";
        ctx.fillText(`${opt.have}/${opt.needed} splices`, PX+32, rowY+50);
        ctx.fillStyle="#ffee44"; ctx.textAlign="right";
        ctx.fillText(`${opt.followerCost}✦`, PX+PW-54, rowY+50);

        if (opt.ready) {
            const bx=PX+PW-72, by2=rowY+10, bw=62, bh=24;
            ctx.fillStyle="#0f8"; ctx.fillRect(bx,by2,bw,bh);
            ctx.fillStyle="#001a0a"; ctx.font="bold 10px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle";
            ctx.fillText("CLONE", bx+bw/2, by2+bh/2);
            opt._bx=bx; opt._by=by2; opt._bw=bw; opt._bh=bh;
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
function _drawBuildsTab(PX, PY, PW, PH) {
    ctx.fillStyle="#cc88ff"; ctx.font="bold 12px monospace"; ctx.textAlign="center"; ctx.textBaseline="alphabetic";
    ctx.fillText("CRYSTAL UPGRADES", PX+PW/2, PY+22);
    const builds=[{id:"ghostphage",label:"◈ Ghostphage",desc:"Become a ghost on last life",cost:80,color:"#aaffee"}];
    builds.forEach((b, i) => {
        const act = activeCrystalBuild===b.id;
        const ry=PY+36+i*44;
        ctx.fillStyle=act?`${b.color}14`:"rgba(0,0,0,0)";
        ctx.fillRect(PX+10,ry,PW-20,38);
        ctx.strokeStyle=act?b.color:"#252538"; ctx.lineWidth=1; ctx.strokeRect(PX+10,ry,PW-20,38);
        ctx.fillStyle=b.color; ctx.font="bold 11px monospace"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
        ctx.fillText(b.label, PX+18, ry+15);
        ctx.fillStyle="#4a5060"; ctx.font="9px monospace";
        ctx.fillText(b.desc, PX+18, ry+28);
        ctx.fillStyle=act?"#0f8":"#ffee44"; ctx.textAlign="right";
        ctx.fillText(act?"● ACTIVE":`${b.cost} shards`, PX+PW-14, ry+22);
        b._bx=PX+10; b._by=ry; b._bw=PW-20; b._bh=38;
    });
    window._buildsTabBuilds = builds;
}

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

    // Owned modulators list (bottom of left area)
    const modListY = Math.min(crystY+crystR+60, PY+PH-50);
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

    // ── Vertical slider ──────────────────────────────────
    const slX   = splitX + Math.floor((PW - (splitX-PX)) * 0.45);
    const slT   = PY + 14;
    const slB   = PY + PH - 14;
    const slH   = slB - slT;
    const slW   = 8;

    // Track
    ctx.fillStyle="#08060f"; ctx.fillRect(slX-slW/2, slT, slW, slH);
    ctx.strokeStyle="#1e1e35"; ctx.lineWidth=1; ctx.strokeRect(slX-slW/2, slT, slW, slH);

    // Zone bands (color the track)
    const zones=[
        {lo:0,   hi:0.25, col:"#ffcc44", label:"ALL"},
        {lo:0.25,hi:0.55, col:"#88ffcc", label:"TRI"},
        {lo:0.55,hi:0.80, col:"#aaddff", label:"BI"},
        {lo:0.80,hi:1.0,  col:"#ff88ff", label:"MONO"},
    ];
    zones.forEach(z => {
        const yTop = slT + (1-z.hi)*slH;
        const yBot = slT + (1-z.lo)*slH;
        ctx.fillStyle=z.col+"22"; ctx.fillRect(slX-slW/2, yTop, slW, yBot-yTop);
        const midY=(yTop+yBot)/2;
        ctx.strokeStyle=z.col+"44"; ctx.lineWidth=1; ctx.setLineDash([2,4]);
        ctx.beginPath(); ctx.moveTo(slX-20,midY); ctx.lineTo(slX-slW/2,midY); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle=z.col; ctx.font="8px monospace"; ctx.textAlign="right"; ctx.textBaseline="middle";
        ctx.fillText(z.label, slX-13, midY);
    });

    // Handle
    const handleY = slT + (1-crystalModSlider)*slH;
    ctx.fillStyle=cycleColor;
    ctx.beginPath(); ctx.arc(slX, handleY, 10, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle="#fff"; ctx.lineWidth=1.5; ctx.stroke();

    window._crystalSliderTrack = { x:slX, t:slT, b:slB, h:slH };
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
        ["Crystal Build", activeCrystalBuild||"none", "#bb55ff"],
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
        {col:"#0f8",    text:"BUILD (10 shards) — place on any floor tile"},
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

// ── Panel input handler ───────────────────────────────────
function handleCrystalPanelInput(ex, ey, isDown) {
    if (!crystalMenuOpen) return false;
    const b = window._cpBounds;
    if (!b) return crystalMenuOpen;

    // Modulation slider drag (check first — works on move too)
    const st = window._crystalSliderTrack;
    if (crystalMenuTab==="modulation" && st) {
        if (_crystalSliderDrag || (isDown && Math.abs(ex-st.x)<20 && ey>=st.t-14 && ey<=st.b+14)) {
            if (isDown) {
                _crystalSliderDrag = true;
                crystalModSlider = 1 - Math.max(0, Math.min(1, (ey-st.t)/st.h));
            } else {
                _crystalSliderDrag = false;
            }
            return true;
        }
    }
    if (!isDown) { _crystalSliderDrag=false; return crystalMenuOpen; }

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
        // Clone buttons
        for (const opt of (window._cloneTabOpts||[])) {
            if (!opt.ready||!opt._bx) continue;
            if (ex>=opt._bx&&ex<=opt._bx+opt._bw&&ey>=opt._by&&ey<=opt._by+opt._bh) {
                executeClone(opt); crystalMenuOpen=false; return true;
            }
        }
    }

    if (crystalMenuTab==="builds") {
        for (const b2 of (window._buildsTabBuilds||[])) {
            if (!b2._bx) continue;
            if (ex>=b2._bx&&ex<=b2._bx+b2._bw&&ey>=b2._by&&ey<=b2._by+b2._bh) {
                activeCrystalBuild=(activeCrystalBuild===b2.id)?null:b2.id; return true;
            }
        }
    }

    return true;
}
