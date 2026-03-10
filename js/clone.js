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
//  ROTATING CRYSTAL MENU  (tap crystal to open)
// ─────────────────────────────────────────────────────────
const CRYSTAL_FACES = [
    { label:"CLONE BAY",      sub:"Deploy combat clones",    action:"clones",      color:"#00ccaa" },
    { label:"CRYSTAL BUILD",  sub:"Passive colony upgrades", action:"builds",      color:"#bb55ff" },
    { label:"MODULATION",     sub:"Crystal element control", action:"modulation",  color:"#aaddff" },
    { label:"STATUS",         sub:"Colony overview",         action:"status",      color:"#4499ff" },
    { label:"CLOSE",          sub:"Return to game",          action:"close",       color:"#554466" },
];

function _crystalFrontIndex() {
    let best=0, bestCos=-2;
    CRYSTAL_FACES.forEach((_,i) => {
        const c = Math.cos(crystalMenuRot + i * Math.PI*2/CRYSTAL_FACES.length);
        if (c > bestCos) { bestCos=c; best=i; }
    });
    return best;
}

function drawCrystalMenu() {
    if (!crystalMenuOpen) return;
    if (!crystalMenuDrag) crystalMenuRot += 0.008;
    if (crystalMenuRot > Math.PI*2) crystalMenuRot -= Math.PI*2;

    const cx=canvas.width/2, cy=canvas.height/2;
    const N=CRYSTAL_FACES.length;

    ctx.save(); ctx.setTransform(1,0,0,1,0,0);

    // Dark overlay
    ctx.fillStyle = "rgba(2,0,8,0.88)"; ctx.fillRect(0,0,canvas.width,canvas.height);

    // Title
    ctx.fillStyle = "#cc88ff"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center";
    ctx.fillText("◈  CRYSTAL INTERFACE  ◈", cx, cy - 175);
    ctx.fillStyle = "#554477"; ctx.font = "10px monospace";
    ctx.fillText("drag to rotate  •  tap to select", cx, cy + 185);

    // Sort faces back-to-front by z (cos value)
    const order = CRYSTAL_FACES.map((f,i) => {
        const angle = crystalMenuRot + i * Math.PI*2/N;
        return { f, i, angle, cosA:Math.cos(angle), sinA:Math.sin(angle) };
    }).sort((a,b) => a.cosA - b.cosA);

    order.forEach(({ f, cosA, sinA }) => {
        const absC = Math.abs(cosA);
        if (absC < 0.04) return;
        const isFront = cosA > 0.65;
        const w = 160 * absC;        // apparent face width
        const h = isFront ? 310 : 280;
        const xOff = sinA * 220;     // face orbit offset
        const faceCX = cx + xOff;
        const alpha = 0.25 + absC * 0.75;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Gem facet shape — octagonal gem outline
        const hw=w/2, hh=h/2, cut=hh*0.22;
        ctx.beginPath();
        ctx.moveTo(faceCX,              cy-hh);
        ctx.lineTo(faceCX+hw*0.55,      cy-hh+cut);
        ctx.lineTo(faceCX+hw,           cy-hh+cut*2.2);
        ctx.lineTo(faceCX+hw,           cy+hh*0.38);
        ctx.lineTo(faceCX,              cy+hh);
        ctx.lineTo(faceCX-hw,           cy+hh*0.38);
        ctx.lineTo(faceCX-hw,           cy-hh+cut*2.2);
        ctx.lineTo(faceCX-hw*0.55,      cy-hh+cut);
        ctx.closePath();

        // Gradient fill — deep purple with face color tint
        const g = ctx.createLinearGradient(faceCX-hw, cy-hh, faceCX+hw, cy+hh);
        g.addColorStop(0, f.color+"bb");
        g.addColorStop(0.4,"rgba(60,10,90,0.9)");
        g.addColorStop(1, f.color+"44");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = isFront ? f.color : "rgba(180,80,255,0.3)";
        ctx.lineWidth = isFront ? 2.5 : 1;
        ctx.stroke();

        // Facet sheen — upper-left highlight
        const g2 = ctx.createLinearGradient(faceCX-hw*0.5, cy-hh+cut, faceCX, cy-hh*0.2);
        g2.addColorStop(0,"rgba(255,255,255,0.18)");
        g2.addColorStop(1,"rgba(255,255,255,0)");
        ctx.fillStyle=g2;
        ctx.beginPath();
        ctx.moveTo(faceCX,          cy-hh);
        ctx.lineTo(faceCX+hw*0.55,  cy-hh+cut);
        ctx.lineTo(faceCX+hw*0.2,   cy-hh*0.25);
        ctx.lineTo(faceCX-hw*0.1,   cy-hh+cut*0.8);
        ctx.closePath();
        ctx.fill();

        // Labels — only when near front
        if (absC > 0.45) {
            ctx.globalAlpha = Math.min(1, (absC-0.45)*2) * alpha;
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            ctx.fillStyle = isFront ? "#fff" : "#ccaaee";
            ctx.font = `bold ${Math.floor(15*absC)}px monospace`;
            ctx.shadowColor = f.color; ctx.shadowBlur = isFront ? 12 : 0;
            ctx.fillText(f.label, faceCX, cy - 18);
            ctx.shadowBlur=0;
            ctx.fillStyle = f.color;
            ctx.font = `${Math.floor(10*absC)}px monospace`;
            ctx.fillText(f.sub, faceCX, cy + 10);
            if (isFront) {
                // Pulsing tap ring
                const pr = 0.5 + 0.4*Math.sin((frame||0)*0.09);
                ctx.globalAlpha = 0.55 + 0.3*pr;
                ctx.strokeStyle = f.color; ctx.lineWidth=1.5;
                ctx.beginPath(); ctx.arc(faceCX, cy+62, 16+pr*4, 0, Math.PI*2); ctx.stroke();
                ctx.fillStyle=f.color; ctx.font="9px monospace";
                ctx.fillText("TAP", faceCX, cy+62);
                window._crystalFront = { action:f.action, cx:faceCX, cy };
            }
        }
        ctx.restore();
    });

    // ── CRYSTAL BUILDS sub-panel ──────────────────────────
    if (crystalMenuSub === "builds") {
        const pw=260, ph=120, px2=cx-pw/2, py2=cy+200;
        ctx.save();
        ctx.fillStyle="rgba(8,0,20,0.95)"; ctx.strokeStyle="#bb55ff"; ctx.lineWidth=2;
        ctx.fillRect(px2,py2,pw,ph); ctx.strokeRect(px2,py2,pw,ph);
        ctx.fillStyle="#cc88ff"; ctx.font="bold 11px monospace"; ctx.textAlign="center";
        ctx.fillText("CRYSTAL BUILDS",cx,py2+18);
        const builds=[{id:"ghostphage",label:"◈ Ghostphage",desc:"Ghost on last life",cost:80,color:"#aaffee"}];
        builds.forEach((b,i)=>{
            const isActive=activeCrystalBuild===b.id;
            const ry=py2+36+i*36;
            ctx.fillStyle=isActive?"rgba(170,255,238,0.12)":"rgba(0,0,0,0)";
            ctx.fillRect(px2+8,ry,pw-16,30);
            ctx.strokeStyle=isActive?b.color:"#443355"; ctx.lineWidth=1;
            ctx.strokeRect(px2+8,ry,pw-16,30);
            ctx.fillStyle=b.color; ctx.font="bold 11px monospace"; ctx.textAlign="left";
            ctx.fillText(b.label,px2+16,ry+14);
            ctx.fillStyle="#888"; ctx.font="9px monospace";
            ctx.fillText(b.desc,px2+16,ry+26);
            ctx.fillStyle="#ff0"; ctx.textAlign="right";
            ctx.fillText(isActive?"ACTIVE":b.cost+" shards",px2+pw-12,ry+20);
        });
        ctx.restore();
        window._crystalBuildsPanel={x:px2,y:py2,w:pw,h:ph,builds};
    }

    // ── STATUS sub-panel ──────────────────────────────────
    if (crystalMenuSub === "status") {
        const pw=260, ph=140, px2=cx-pw/2, py2=cy+200;
        const brawlers=followers.filter(a=>!a.dead&&a.role==="brawler").length;
        const snipers =followers.filter(a=>!a.dead&&a.role==="sniper").length;
        const campers =followers.filter(a=>!a.dead&&a.role==="camper").length;
        const ghosts  =followers.filter(a=>!a.dead&&a.ghostphageLife).length;
        ctx.save();
        ctx.fillStyle="rgba(8,0,20,0.95)"; ctx.strokeStyle="#4499ff"; ctx.lineWidth=2;
        ctx.fillRect(px2,py2,pw,ph); ctx.strokeRect(px2,py2,pw,ph);
        ctx.fillStyle="#88ccff"; ctx.font="bold 11px monospace"; ctx.textAlign="center";
        ctx.fillText("COLONY STATUS",cx,py2+18);
        const rows=[
            ["Followers",followers.filter(a=>!a.dead).length,"#0f8"],
            ["Brawlers",brawlers,"#f88"],["Snipers",snipers,"#88f"],["Campers",campers,"#8f8"],
            ["Ghosts",ghosts,"#aaffee"],["Crystal Build",activeCrystalBuild||"none","#bb55ff"],
        ];
        rows.forEach((r,i)=>{
            const ry=py2+34+i*17;
            ctx.fillStyle="#888"; ctx.font="10px monospace"; ctx.textAlign="left";
            ctx.fillText(r[0],px2+14,ry);
            ctx.fillStyle=r[2]; ctx.textAlign="right";
            ctx.fillText(r[1],px2+pw-12,ry);
        });
        ctx.restore();
    }

    // ── MODULATION sub-panel ──────────────────────────────
    if (crystalMenuSub === "modulation") {
        const rowH = 34, headerH = 30;
        const rows = ownedModulators.length;
        const ph = headerH + Math.max(1, rows) * rowH + 14;
        const pw = 280, px2 = cx - pw/2, py2 = cy + 195;
        ctx.save();
        ctx.fillStyle="rgba(4,8,24,0.97)"; ctx.strokeStyle="#aaddff"; ctx.lineWidth=2;
        ctx.fillRect(px2, py2, pw, ph); ctx.strokeRect(px2, py2, pw, ph);
        ctx.fillStyle="#aaddff"; ctx.font="bold 11px monospace"; ctx.textAlign="center";
        ctx.fillText("CRYSTAL MODULATION", cx, py2 + 18);
        if (rows === 0) {
            ctx.fillStyle="#555"; ctx.font="10px monospace";
            ctx.fillText("No modulators — kill a boss to obtain one", cx, py2 + headerH + 14);
        } else {
            ownedModulators.forEach((mod, i) => {
                const el = ELEMENTS.find(e => e.id === mod.element);
                const pair = mod.pair || MODULATOR_PAIRS[mod.element] || [mod.element];
                const col = el ? el.color : "#aaddff";
                const ry = py2 + headerH + i * rowH;
                const isActive = activeCrystalModulation && activeCrystalModulation.element === mod.element;
                ctx.fillStyle = isActive ? `${col}22` : "rgba(0,0,0,0)";
                ctx.fillRect(px2 + 6, ry, pw - 12, rowH - 4);
                ctx.strokeStyle = isActive ? col : "#334";
                ctx.lineWidth = 1; ctx.strokeRect(px2 + 6, ry, pw - 12, rowH - 4);
                ctx.fillStyle = col; ctx.font = "bold 11px monospace"; ctx.textAlign = "left";
                ctx.fillText(`◈ ${(el?.label||mod.element).toUpperCase()} MODULATOR`, px2 + 14, ry + 14);
                ctx.fillStyle = "#888"; ctx.font = "9px monospace";
                ctx.fillText(`Pair: ${pair.join(" + ")}`, px2 + 14, ry + 26);
                ctx.fillStyle = isActive ? col : "#aaddff"; ctx.textAlign = "right";
                ctx.fillText(isActive ? "ACTIVE" : "ACTIVATE", px2 + pw - 10, ry + 20);
            });
        }
        ctx.restore();
        window._crystalModPanel = { x:px2, y:py2, w:pw, rows:ownedModulators.length, rowH, headerH };
    }

    ctx.restore();
}

function handleCrystalMenuTap(ex, ey) {
    if (!crystalMenuOpen) return false;

    // Handle sub-panel clicks
    if (crystalMenuSub==="builds") {
        const p=window._crystalBuildsPanel;
        if (p && ex>=p.x&&ex<=p.x+p.w&&ey>=p.y&&ey<=p.y+p.h) {
            p.builds.forEach((b,i)=>{
                const ry=p.y+36+i*36;
                if (ey>=ry&&ey<=ry+30) {
                    if (activeCrystalBuild===b.id) activeCrystalBuild=null;
                    else if (shardCount>=b.cost||true) activeCrystalBuild=b.id; // free from crystal menu (bought in shop)
                }
            });
            return true;
        }
    }

    // Handle modulation sub-panel clicks
    if (crystalMenuSub==="modulation") {
        const p=window._crystalModPanel;
        if (p && ex>=p.x&&ex<=p.x+p.w&&ey>=p.y&&ey<=p.y+p.w) {
            for (let i=0; i<p.rows; i++) {
                const ry = p.y + p.headerH + i * p.rowH;
                if (ey>=ry && ey<=ry+p.rowH-4) {
                    const mod = ownedModulators[i];
                    if (!mod) break;
                    if (activeCrystalModulation && activeCrystalModulation.element===mod.element) {
                        // Deactivate
                        activeCrystalModulation = null;
                    } else {
                        // Activate — only future inductees / respawns use the modulated pair
                        activeCrystalModulation = { element: mod.element, pair: mod.pair };
                    }
                    return true;
                }
            }
            return true;
        }
    }

    // Tap front face action
    const front=window._crystalFront;
    if (!front) return true;
    if (front.action==="close") { crystalMenuOpen=false; crystalMenuSub=null; }
    else if (front.action==="clones") { crystalMenuOpen=false; crystalMenuSub=null; cloneMenuOpen=true; }
    else if (front.action==="builds") { crystalMenuSub=(crystalMenuSub==="builds")?null:"builds"; }
    else if (front.action==="status") { crystalMenuSub=(crystalMenuSub==="status")?null:"status"; }
    else if (front.action==="modulation") { crystalMenuSub=(crystalMenuSub==="modulation")?null:"modulation"; }
    return true;
}
