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

// ── BUILDING A CLONE ─────────────────────────────────────
// THE one place a clone is made. There were three — the summon, the respawn
// and the between-waves restore — and only the summon applied the 3x power
// multiplier, so a clone that died once came back an ordinary predator for the
// rest of the game. Every rule about what a clone IS lives here.
function makeClone(speciesName, className, x, y, state, lv) {
    const speciesDef = (typeof SPECIES !== "undefined" && SPECIES[speciesName]) ||
                       (typeof SYNTHETIC_SPECIES !== "undefined" ? SYNTHETIC_SPECIES[speciesName] : null);
    if (!speciesDef) return null;
    const classDef = typeof getClassDef === "function"
        ? getClassDef(speciesDef, className)
        : speciesDef[className];
    if (!classDef) return null;

    const def = {
        width:     classDef.width,
        height:    classDef.height,
        moveSpeed: classDef.moveSpeed,
        // Tripled on the way in, so health AND maxHealth carry it — the
        // constructor sets both from def.health, and a clone patched after
        // construction would show a full bar at a third of the length.
        health:    classDef.health * CLONE_HEALTH_MULT,
        power:     classDef.power,
        color:     speciesDef.color
    };

    const clone = new Predator(className, def, x, y);
    clone.state       = state || "wander";
    clone.wanderTimer = 0;
    clone.team        = "green";
    clone.isClone     = true;
    clone.power       = Math.round(clone.power * CLONE_POWER_MULT);
    clone.speciesName = speciesName;
    clone.className   = className;
    // ITS LEVEL (js/levels.js). A new clone comes out at the level of what it
    // will fight — the frontier's predators — and then grows by its own kills;
    // a clone that respawns, or comes back from a save, keeps its own (lv).
    if (typeof setPredatorLevel === "function") {
        const L = lv && Number.isFinite(lv.level) ? lv.level
                : (typeof predatorLevelFor === "function" && typeof nextZoneToTake === "function" ? predatorLevelFor(nextZoneToTake(), undefined, false) : 5);
        setPredatorLevel(clone, L, true);
        clone.xp = lv && Number.isFinite(lv.xp) ? Math.max(xpForLevel(clone.level), lv.xp) : xpForLevel(clone.level);
    } else if (typeof rampLevel === "function" && typeof nextZoneToTake === "function") {
        const z = nextZoneToTake(), r = rampLevel(z);
        const deep = typeof deepZoneScale === "function" ? deepZoneScale(z) : { hp: 1, power: 1 };
        const kH = (1 + RAMP_HP * r) * deep.hp, kP = (1 + RAMP_POWER * r) * deep.power;
        clone.maxHealth = Math.round(clone.maxHealth * kH); clone.health = clone.maxHealth;
        clone.power = Math.round(clone.power * kP);
    }
    if (typeof applySpeciesBody === "function") applySpeciesBody(clone, speciesName);
    actors.push(clone);
    return clone;
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

    // Spawn clone at crystal. "hunt", because one you just paid for should go
    // and do something rather than wander off.
    const clone = makeClone(option.speciesName, option.className, crystal.x, crystal.y, "hunt");
    if (!clone) return;
    const speciesDef = SPECIES[option.speciesName];

    // Floating text
    floatingTexts.push({
        x: canvas.width/2, y: canvas.height/2,
        text: option.speciesName.toUpperCase() + " " + option.className.toUpperCase() + " CLONED",
        color: speciesDef.color,
        life: 120, vy: -0.5
    });

    // The bay STAYS OPEN. "It should allow me to make as many as I want by
    // clicking the options before closing out of the menu" — it used to shut
    // after one. The floating text above is drawn under the bay's backdrop, so
    // the bay says it itself, in its title bar (drawCloneMenu).
    _cloneBayFlash = { text: "\u2713 " + option.speciesName.toUpperCase() + " " + option.className.toUpperCase() + " CLONED", color: speciesDef.color, until: (frame || 0) + 90 };
}
let _cloneBayFlash = null;

// ── THE CLONE BAY ────────────────────────────────────────
// "Make the clone menu only appear on the HUD — the button to go to the clone
// menu should be on the HUD, and look like a little rotating 3D DNA icon."
// It used to be a tab inside the Crystal panel (and a second, simpler copy
// here). Now it is one panel, opened ONLY from the DNA button on the HUD
// (drawClonesBlob), showing the full clone bay: sort, scroll, cap, DISMISS.
// One box for both panels (the Crystal and the Clone Bay): the tab bar on top, the content under it, between the HUD plates and the dock.
function _panelBox() {
    const PW = Math.min(660, canvas.width - 12);
    const PX = Math.round((canvas.width - PW) / 2);
    const PY = uiTopSafe(), tabH = 58, closeW = 64;
    const contentY = PY + tabH;
    const contentH = Math.max(120, Math.min(uiBottomSafe() - contentY, 600));
    return { PX, PY, PW, tabH, closeW, contentY, contentH };
}
function _cloneBayGeometry() {
    const g = _panelBox();
    return { PX: g.PX, PY: g.PY, PW: g.PW, barH: g.tabH, closeW: g.closeW, closeX: g.PX + g.PW - g.closeW, contentY: g.contentY, contentH: g.contentH };
}
function drawCloneMenu() {
    if (!cloneMenuOpen) return;
    const g = _cloneBayGeometry();
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    uiBackdrop(0.78);
    uiPanel(g.PX, g.PY, g.PW, g.barH + g.contentH, UI_TEAL);
    // Title bar: the last summon, for a moment, in place of the title (the bay stays open).
    const _fl = _cloneBayFlash && (frame || 0) < _cloneBayFlash.until ? _cloneBayFlash : null;
    const title = _fl ? _fl.text + "  \u00b7  " + actors.filter(a => a.isClone && !a.dead).length + "/" + MAX_CLONES : "CLONE BAY";
    uiTextFit(title, g.PX + 28, g.PY + g.barH / 2 + 2, 30, _fl ? _fl.color : UI_TEAL, "left", g.PW - g.closeW - 50);
    uiButton({ x: g.closeX, y: g.PY + 8, w: g.closeW - 10, h: g.barH - 16 }, "\u2715", UI_RED, false, 24);
    ctx.save();
    ctx.beginPath(); ctx.rect(g.PX + 1, g.contentY + 1, g.PW - 2, g.contentH - 2); ctx.clip();
    _drawClonesTab(g.PX, g.contentY, g.PW, g.contentH);
    ctx.restore();
    ctx.restore();
    window._cloneMenuBounds = g;
}

function handleCloneMenuTap(ex, ey) {
    if (!cloneMenuOpen) return false;
    const g = window._cloneMenuBounds;
    if (!g) return false;
    if (ex >= g.closeX && ex <= g.closeX + g.closeW && ey >= g.PY && ey <= g.PY + g.barH) {
        cloneMenuOpen = false; return true;
    }
    if (ex < g.PX || ex > g.PX + g.PW || ey < g.PY || ey > g.contentY + g.contentH) {
        cloneMenuOpen = false; return true;
    }
    _clonesTabTap(ex, ey, g.PX);
    return true;
}

// The clone bay's buttons: sort tabs, scroll arrows, DISMISS, and a row's
// CLONE (or, on a blocked row, the explanation).
function _clonesTabTap(ex, ey, PX) {
    const cl = window._cloneTabBounds;
    if (!cl) return true;
    if (ey >= cl.sortY && ey <= cl.sortY + cl.sortH) {
        for (let i = 0; i < CSORTS.length; i++) {
            const tx = PX + i * cl.sortW;
            if (ex >= tx && ex <= tx + cl.sortW) { crystalCloneSort = CSORTS[i].id; _crystalScrollX = 0; return true; }
        }
    }
    const sa = window._cloneScrollArrows;
    if (sa) {
        if (ex>=sa.upX&&ex<=sa.upX+sa.upW&&ey>=sa.upY&&ey<=sa.upY+sa.upH) { _crystalScrollX=Math.max(0,_crystalScrollX-sa.rowH); return true; }
        if (ex>=sa.dnX&&ex<=sa.dnX+sa.dnW&&ey>=sa.dnY&&ey<=sa.dnY+sa.dnH) { _crystalScrollX+=sa.rowH; return true; }
    }
    // INFO on a card: that clone type's attacks, job and numbers.
    for (const opt of (window._cloneTabOpts || [])) {
        if (typeof opt._ix !== "number") continue;
        if (ex >= opt._ix && ex <= opt._ix + opt._iw && ey >= opt._iy && ey <= opt._iy + opt._ih) { if (typeof unitInfoOpenType === "function") unitInfoOpenType(opt.speciesName, opt.className); return true; }
    }
    // DISMISS — frees a slot. Checked before the rows so it is never
    // swallowed by one.
    const db = window._cloneDismissBtn;
    if (db && ex >= db.x && ex <= db.x + db.w && ey >= db.y && ey <= db.y + db.h) { dismissOldestClone(); return true; }
    for (const opt of (window._cloneTabOpts || [])) {
        if (!opt.ready || !opt._bx) continue;
        if (ex>=opt._bx&&ex<=opt._bx+opt._bw&&ey>=opt._by&&ey<=opt._by+opt._bh) {
            executeClone(opt); return true;   // and the bay stays open for the next
        }
    }
    // A BLOCKED row explains itself rather than swallowing the tap in silence.
    for (const opt of (window._cloneTabOpts || [])) {
        if (opt.ready || !opt._nbx) continue;
        if (ex>=opt._nbx&&ex<=opt._nbx+opt._nbw&&ey>=opt._nby&&ey<=opt._nby+opt._nbh) {
            executeClone(opt);   // refuses, and says why
            return true;
        }
    }
    return true;
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

// Where a zone's predators come out: the NEST IN ITS BACK WALL, and nothing
// else. A nest counts while it still has health, so killing it is what shuts
// the zone's mouth.
//
// There used to be a second one — a vortex in the floor at zone x-offset 3,
// open until captured. "I want the portals on the wall to be the nests. I don't
// want the holes on the ground or the floor any more", so the floor vortex is
// gone and the wall is the only way in.
//
// Returns an empty list when a zone HAS a nest and it is dead. A zone with no
// nest at all returns null instead, so the caller can tell "nothing left to
// shut" from "nothing was ever there" — the second still spawns from the zone
// centre, as it always did.
// While the spawn loop runs (render sets _spawnMouths to { built: false }),
// the first call answers EVERY zone in the same pass and the rest read it: the
// loop asks once per zone per frame, and each ask was a scan of the world.
let _spawnMouths = null;
function zoneSpawnPoints(zoneIndex) {
    const all = typeof _spawnMouths !== 'undefined' ? _spawnMouths : null;
    if (all && all.built) return all.map.has(zoneIndex) ? all.map.get(zoneIndex) : null;
    const map = all ? new Map() : null;
    let any = false;
    const open = [];
    for (const t of world) {
        // The home portal is not a mouth. It never produced anything — the
        // spawn loop starts at zone 1 — but it answered as one here, so
        // anything that ever counted from zero would have poured predators out
        // of the player's own doorway.
        if (t.nest && !(typeof isHomePortal === 'function' && isHomePortal(t))) {
            if (map) { let l = map.get(t.nestZone); if (!l) { l = []; map.set(t.nestZone, l); } if (t.nestHealth > 0) l.push(t); }
            if (t.nestZone === zoneIndex) { any = true; if (t.nestHealth > 0) open.push(t); }
        }
    }
    if (map) { all.map = map; all.built = true; }
    return any ? open : null;
}

function spawnPredatorForZone(zoneIndex, opts) {
    opts = opts || {};
    // THE WAVE LADDER (js/broods.js): the wave decides what comes out, in every
    // zone — nymphs first, then ants, beetles and up. (A Swarm Tide night's
    // nymphs are in the pick too.) A pair partner copies its first.
    const _pick = opts.species ? { species: opts.species, className: opts.className, rare: false }
                : ladderPick(gameState.nightNumber, zoneIndex);
    const speciesName = _pick.species;
    const className   = opts.className || _pick.className;
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

    // Out of the zone's wall nest while it is alive. With none, the zone centre,
    // as before.
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
    // THE DEEP ZONES (13+): tougher, harder-hitting, bigger and richer with
    // every zone, without end (deepZoneScale in config.js). After the body
    // shaping, which would otherwise reset the size.
    if (typeof applyZoneDifficulty === "function") applyZoneDifficulty(predator, zoneIndex);

    // Capture the final speed after every mutation, so slows scale from the
    // real base rather than from whatever the AI last parked moveSpeed at.
    predator.baseMoveSpeed = predator.moveSpeed;
    // SWARM TIDE: more of them, half the health.
    if (typeof siegeIs === "function" && siegeIs("swarm")) {
        predator.maxHealth = Math.max(1, Math.round(predator.maxHealth * SIEGE_SWARM_HP));
        predator.health = Math.min(predator.health, predator.maxHealth);
    }
    // Resolve the charge-up special now that species and class are both known.
    initAbility(predator);
    // What its species does (js/broods.js): ants plain attackers, beetles haulers.
    if (typeof applyLadderRole === "function") applyLadderRole(predator);
    // HUNTER'S MOON (a siege night): every one of them is after your pylons —
    // set after the zone role, which decides hunting for ordinary nights.
    if (typeof siegeIs === "function" && siegeIs("hunt")) predator.huntsPylons = true;
    if (opts.swarmChild) predator._swarmChild = true;
    // Its own gardening pace, so a batch of spawns does not later finish
    // converting a batch of pylons on the same frame. Read at call time —
    // infest.js loads after this file.
    if (typeof rollInfestSettle === "function") rollInfestSettle(predator);

    actors.push(predator);
    if (!zonePredators[zoneIndex]) zonePredators[zoneIndex] = [];
    zonePredators[zoneIndex].push(predator);
    // The new tier comes as a PAIR (LADDER_RARE_PAIR): the rest of it beside it.
    if (_pick.rare && !opts.pairChild) {
        for (let i = 1; i < LADDER_RARE_PAIR; i++) {
            if (typeof predatorBudgetFull === "function" && predatorBudgetFull()) break;
            const q = spawnPredatorForZone(zoneIndex, { species: speciesName, className, pairChild: true });
            if (!q) break;
            q.x = predator.x + (Math.random() - 0.5) * 1.2;
            q.y = Math.max(0, Math.min(3, predator.y + (Math.random() - 0.5) * 1.2));
        }
    }
    return predator;
}

// ─────────────────────────────────────────────────────────
//  GYRATING CLONE BLOB BUTTON  (top-right)
// ─────────────────────────────────────────────────────────
const _BLOB = { x:0, y:0, r:26 };   // the DNA button's hit area (input.js)

// THE DNA BUTTON — a small double helix turning in 3D, top right of the HUD.
// Two strands are the same sine wave half a turn apart; whichever is in front
// (depth > 0) is drawn bigger and brighter, so it reads as turning rather than
// as two wiggling lines. The rungs join each pair. A badge counts the clones
// you could summon right now.
function drawClonesBlob() {
    const bx = canvas.width - 38, by = 72;
    _BLOB.x = bx; _BLOB.y = by;
    const t = (frame || 0) * 0.05;
    const H = 40, N = 12, R = 10;
    const top = by - H / 2;
    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    // Backing disc, so it reads as a button.
    ctx.fillStyle = cloneMenuOpen ? "rgba(0,60,45,0.85)" : "rgba(0,18,14,0.75)";
    ctx.strokeStyle = "rgba(0,255,170,0.55)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(bx, by, _BLOB.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const pts = [];
    for (let i = 0; i < N; i++) {
        const a = t + i * 0.62, y = top + (i + 0.5) * (H / N);
        pts.push({ y, a: { x: bx + Math.sin(a) * R, z: Math.cos(a) },
                      b: { x: bx + Math.sin(a + Math.PI) * R, z: Math.cos(a + Math.PI) } });
    }
    // Rungs first (behind the beads), shaded by how far round they are.
    for (const p of pts) {
        ctx.strokeStyle = `rgba(120,255,210,${0.18 + 0.25 * Math.abs(Math.sin(t + p.y))})`;
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(p.a.x, p.y); ctx.lineTo(p.b.x, p.y); ctx.stroke();
    }
    // Back beads, then front beads, so depth sorts itself.
    for (const pass of [false, true]) {
        for (const p of pts) {
            for (const [s, col] of [[p.a, "#1aff88"], [p.b, "#33ddff"]]) {
                if ((s.z > 0) !== pass) continue;
                const k = (s.z + 1) / 2;           // 0 at the back, 1 at the front
                ctx.globalAlpha = 0.35 + 0.65 * k;
                ctx.fillStyle = col;
                // A faint halo instead of a blur: twelve blurred beads a frame,
                // forever, on a HUD button.
                if (pass) { const ga = ctx.globalAlpha; ctx.globalAlpha = ga * 0.25;
                    ctx.beginPath(); ctx.arc(s.x, p.y, (1.4 + 1.6 * k) * 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = ga; }
                ctx.beginPath(); ctx.arc(s.x, p.y, 1.4 + 1.6 * k, 0, Math.PI * 2); ctx.fill();
            }
        }
    }
    ctx.globalAlpha = 1; ctx.shadowBlur =0;
    ctx.fillStyle = "#aef5dc"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("CLONES", bx, by + _BLOB.r + 3);
    // How many you could summon right now.
    // Recounted twice a second, not every frame: it reads the DNA store.
    if (_BLOB.ready === undefined || (frame || 0) % 30 === 0)
        _BLOB.ready = typeof getCloneOptions === "function" ? getCloneOptions().filter(o => o.ready).length : 0;
    const ready = _BLOB.ready;
    if (ready > 0) {
        ctx.fillStyle = "#0f8"; ctx.beginPath(); ctx.arc(bx + _BLOB.r - 4, by - _BLOB.r + 4, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#000"; ctx.font = "bold 9px monospace"; ctx.textBaseline = "middle";
        ctx.fillText(String(ready), bx + _BLOB.r - 4, by - _BLOB.r + 4.5);
    }
    ctx.restore();
}

// ─────────────────────────────────────────────────────────
//  CRYSTAL INTERFACE  —  Tab Panel System
// ─────────────────────────────────────────────────────────

// ── State ─────────────────────────────────────────────────
const _CRYSBTN  = { x: 0, y: 0, r: 22 };  // canvas button hit area
let _crystalScrollX  = 0;                   // the clone card strip's slide offset (px)

// Tab definitions
// The Crystal is one page now: the ELEMENT MIX. (It had a guide tab beside it, a list of the ultimates and the pylon rules that nobody needed there: the INFO tab on every unit has the real numbers.)
const CTABS = [
    { id:"modulation", label:"ELEMENT MIX", color:"#8fe3ff" },
];
const CSORTS = [
    { id:"species",  label:"SPECIES"  },
    { id:"combat",   label:"COMBAT"   },
    { id:"defense",  label:"DEFENSE"  },
    { id:"hp",       label:"HP"       },
    { id:"specials", label:"SPECIALS" },
];

// THE QUICK RECRUIT. "I would really like a button near the roster, so if the roster is looking slim the user can create a recruit rapidly." It
// costs RECRUIT_COST shards and a follower comes out at the Crystal as the element the player picks (the picker the + RECRUIT button opens), or
// as a draw from the current mix (the ELEMENT MIX tab). It is offered in the
// ROSTER only (the Command Center's roster tab and the phone roster): "that needs to be the only way", so the Crystal menu and the dock have none.
const RECRUIT_COST = 30;
// `element`: the one the player picked (js/recruitcrystal.js recruitDo); none = a draw from the current mix.
function recruitFollower(element) {
    if (shardCount < RECRUIT_COST) { floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: "NEED " + RECRUIT_COST + " SHARDS", color: "#f44", life: 90, vy: -0.2 }); return false; }
    shardCount -= RECRUIT_COST; saveShards();
    const pool = recruitElementPool();
    spawnFollowerAtCrystal(element && unlockedElements.has(element) ? element : pool[Math.floor(Math.random() * pool.length)] || "fire");
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: "FOLLOWER RECRUITED!", color: "#0f8", life: 100, vy: -0.2 });
    return true;
}

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
// One card per element: a gem, its name and where it stands. A lit card is in the mix (tap to drop it); an unlocked dark one is out of the mix (tap to add
// it); a locked one is an empty slot, or - once an unlock is earned - an UNLOCK button. Returns { swatches: [the toggles], picks: [the unlocks] }.
function drawModulationCards(x, y, w, h, cols, gap, hot) {
    // The look (reported: "I don't like the rest of the look of the menu either"): dark slabs, not solid blocks of colour. Each carries its element's icon, its name in white, a stripe and a
    // tick in its colour when it is in the mix; one that is out of the mix is a dim outline; one not unlocked yet is dimmer still. Nothing pulses.
    const order = ELEMENTS.slice();
    const rows = Math.ceil(order.length / cols);
    const cw = Math.floor((w - (cols - 1) * gap) / cols), ch = Math.max(30, Math.min(84, Math.floor((h - (rows - 1) * gap) / rows)));
    const swatches = [], picks = [], choices = pendingElements.length > 0 ? _modChoices() : [];
    order.forEach((el, i) => {
        const cx = x + (i % cols) * (cw + gap), cy = y + Math.floor(i / cols) * (ch + gap);
        const unlocked = unlockedElements.has(el.id), on = unlocked && modulationIncludes(el.id), pick = !unlocked && choices.indexOf(el.id) >= 0;
        const col = pick ? UI_GOLD : on ? el.color : unlocked ? "#4a5678" : "#2a3350";
        uiSlab(cx, cy, cw, ch, col, false, on ? "#18213f" : "#0e1428", !unlocked && !pick);
        if (on || pick) { ctx.save(); ctx.globalAlpha = pick ? 0.14 : 0.2; ctx.fillStyle = pick ? UI_GOLD : el.color; uiSlabPath(cx, cy, cw, ch); ctx.fill(); ctx.restore(); }
        if (on) { ctx.fillStyle = el.color; ctx.fillRect(cx + 4, cy + Math.round(ch * 0.2), 4, Math.round(ch * 0.6)); }
        // the icon (js/icons.js); a plain diamond until it has loaded
        const ir = Math.min(15, ch * 0.3), ix = cx + 18 + Math.min(14, ch * 0.3), iy = cy + ch / 2, icol = unlocked || pick ? el.color : "#3a4666";
        if (!(typeof drawIcon === "function" && drawIcon(ctx, typeof ELEMENT_ICON !== "undefined" ? (ELEMENT_ICON[el.id] || el.id) : el.id, icol, ix, iy, Math.round(ir * 1.7)))) {
            ctx.fillStyle = icol; ctx.beginPath(); ctx.moveTo(ix, iy - ir); ctx.lineTo(ix + ir * 0.8, iy); ctx.lineTo(ix, iy + ir); ctx.lineTo(ix - ir * 0.8, iy); ctx.closePath(); ctx.fill();
        }
        const tx = ix + ir + 10, tw = cx + cw - tx - 30, ink = on ? "#fff" : unlocked ? "#9fb0d4" : pick ? "#fff" : "#56648a";
        const name = el.label.toUpperCase();
        if (ch >= 54) {
            uiTextFit(name, tx, cy + ch * 0.4, Math.min(24, ch * 0.4), ink, "left", tw);
            uiCaptionFit(pick ? "\u25c8 TAP TO UNLOCK" : !unlocked ? "LOCKED" : on ? "IN THE MIX" : "OUT OF THE MIX", tx, cy + ch * 0.76, pick ? UI_GOLD : on ? el.color : "#6a7aa0", "left", 13, tw);
        } else {
            uiTextFit(name + (pick ? "  \u25c8 UNLOCK" : !unlocked ? "  \u00b7 LOCKED" : on ? "" : "  \u00b7 OFF"), tx, cy + ch / 2 + 1, Math.min(20, ch * 0.45), ink, "left", tw);
        }
        // the tick: in the mix
        if (on) { const kx = cx + cw - 22, ky = cy + ch / 2; ctx.save(); ctx.strokeStyle = el.color; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(kx - 6, ky); ctx.lineTo(kx - 1, ky + 5); ctx.lineTo(kx + 7, ky - 6); ctx.stroke(); ctx.restore(); }
        if (unlocked) swatches.push({ id: el.id, x: cx, y: cy, w: cw, h: ch });
        else if (pick) picks.push({ id: el.id, bx: cx, by: cy, bw: cw, bh: ch });
    });
    return { swatches, picks };
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

// ── Modulation lives in the Crystal ───────────────────────
// There used to be a second copy of the swatch row floating at the
// bottom-right of the HUD. Two controls for one setting is two places to read
// a mix from and two places to keep in step, and the floating one was a 112px
// strip of 16px swatches wedged between the radial buttons and the TUTORIAL
// button — the hardest place on the screen to hit. The Crystal's MODULATION
// tab is the one control now; the Crystal button is how you reach it.

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

// ── The mix, as a gem (the ELEMENT MIX page) ─────────────
// REPORTED: "change the way the shard looks in the crystal menu, I don't like how it's flashy, and I don't like the rest of the look of the menu either." It used to be a crystal that blinked
// through the colours of the mix. Now it holds still: a cut gem seen from above, one wedge for each element (an outer bevel and an inner facet, lit from the top left). A wedge is in its
// element's colour when that element is in the mix, a dim ghost of it when it is out, and dark when it is not unlocked yet, so the gem IS the mix at a glance. Nothing in it moves.
function _mixShade(hex, k) {
    const n = parseInt(String(hex).slice(1), 16), t = k < 0 ? 0 : 255, a = Math.abs(k);
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => Math.round(v + (t - v) * a));
    return "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
}
function _drawMixGem(cx, cy, R) {
    const n = ELEMENTS.length, r = R * 0.46, TAU = Math.PI * 2;
    const pt = (rad, k) => { const a = (-90 - 180 / n + k * 360 / n) * Math.PI / 180; return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)]; };
    const glow = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R * 1.4); glow.addColorStop(0, "rgba(160,200,255,0.16)"); glow.addColorStop(1, "rgba(160,200,255,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, cy, R * 1.4, 0, TAU); ctx.fill();
    ELEMENTS.forEach((el, i) => {
        const unlocked = unlockedElements.has(el.id), on = unlocked && modulationIncludes(el.id);
        const o0 = pt(R, i), o1 = pt(R, i + 1), i0 = pt(r, i), i1 = pt(r, i + 1), mid = (-90 + i * 360 / n) * Math.PI / 180, lit = Math.cos(mid - (-135 * Math.PI / 180));
        let outer, inner, edge;
        if (on) { outer = _mixShade(el.color, 0.14 + 0.2 * lit); inner = _mixShade(el.color, -0.05 - 0.18 * (1 - lit) / 2); edge = "rgba(255,255,255,0.6)"; }
        else if (unlocked) { outer = _mixShade(el.color, -0.72); inner = _mixShade(el.color, -0.8); edge = "rgba(255,255,255,0.16)"; }
        else { outer = "#151b30"; inner = "#10152a"; edge = "rgba(255,255,255,0.08)"; }
        ctx.fillStyle = outer; ctx.beginPath(); ctx.moveTo(o0[0], o0[1]); ctx.lineTo(o1[0], o1[1]); ctx.lineTo(i1[0], i1[1]); ctx.lineTo(i0[0], i0[1]); ctx.closePath(); ctx.fill();
        ctx.fillStyle = inner; ctx.beginPath(); ctx.moveTo(i0[0], i0[1]); ctx.lineTo(i1[0], i1[1]); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = edge; ctx.lineWidth = 1.2; ctx.lineJoin = "round"; ctx.beginPath(); ctx.moveTo(o0[0], o0[1]); ctx.lineTo(o1[0], o1[1]); ctx.lineTo(i1[0], i1[1]); ctx.lineTo(cx, cy); ctx.lineTo(i0[0], i0[1]); ctx.closePath(); ctx.stroke();
    });
}

// ── Main panel drawing ────────────────────────────────────
function drawCrystalPanel() {
    if (!crystalMenuOpen) return;

    const bx = _panelBox();
    const { PX, PY, PW, tabH, closeW, contentY, contentH } = bx;
    const tabAreaW = PW - closeW, tabW = tabAreaW;
    const scheme = _getModScheme();

    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    uiBackdrop(0.78);
    uiPanel(PX, PY, PW, tabH + contentH, CTABS[0].color);

    // ── Title bar: the name, and close ────────────────────
    uiTextFit(CTABS[0].label, PX + 28, PY + tabH / 2 + 2, 30, "#fff", "left", tabAreaW - 40);
    const cx2 = PX + tabAreaW;
    uiButton({ x: cx2 + 4, y: PY + 8, w: closeW - 10, h: tabH - 14 }, "\u2715", UI_RED, false, 22);

    // ── Content area ──────────────────────────────────────
    ctx.save();
    ctx.beginPath(); ctx.rect(PX+1, contentY+1, PW-2, contentH-2); ctx.clip();
    _drawModTab(PX, contentY, PW, contentH, scheme);
    ctx.restore();
    ctx.restore();

    window._cpBounds = { PX, PY, PW, tabH, contentY, contentH, tabW, tabAreaW, closeX:cx2, closeW };
}

// ── Tab: Clone Bay ────────────────────────────────────────
function _drawClonesTab(PX, PY, PW, PH) {
    const sortH = 44, sortW = Math.floor(PW / CSORTS.length);
    CSORTS.forEach((s, i) => uiButton({ x: PX + i * sortW + 4, y: PY + 2, w: sortW - 6, h: sortH - 6 }, s.label, UI_TEAL, crystalCloneSort === s.id, 15));

    // Clone cap indicator
    const liveClones = actors.filter(a => a.isClone && !a.dead).length;
    const capAtMax = liveClones >= MAX_CLONES;
    const hdrY = PY + sortH + 4, hdrH = 40;
    uiText("CLONES " + liveClones + "/" + MAX_CLONES, PX + 22, hdrY + hdrH / 2, 22, capAtMax ? UI_RED : "#fff", "left", false);
    // DISMISS — the only way to free a slot. Clones persist across waves, so
    // without this the cap filled once and stayed full for the rest of the
    // game, which is what made the whole menu look broken.
    if (liveClones > 0) {
        const dw = 140, dh = 34, dx = PX + PW - 22 - dw, dy = hdrY + (hdrH - dh) / 2;
        uiButton({ x: dx, y: dy, w: dw, h: dh }, "DISMISS", capAtMax ? UI_RED : "#6a7aa0", capAtMax, 16);
        window._cloneDismissBtn = { x: dx, y: dy, w: dw, h: dh };
    } else { window._cloneDismissBtn = null; }

    const listY = hdrY + hdrH + 2, listX = PX + 8, listW = PW - 16;
    const listH = PH - (listY - PY);
    const opts  = _sortedCloneOptions(getCloneOptions(), crystalCloneSort);

    if (opts.length === 0) {
        const msg = capAtMax ? `Clone cap reached (${MAX_CLONES}/${MAX_CLONES})` : crystalCloneSort==="specials" ? "No clones with special attacks" : "No DNA splices available";
        uiText(msg, PX + PW / 2, listY + listH / 2, 22, "#6a7aa0", "center", false);
        window._cloneTabOpts = []; window._cloneScrollArrows = null;
        window._cloneTabBounds = { sortY:PY, sortH, sortW, listY, listH, listX, listW, rowH: 0 };
        return;
    }

    // THE CARD STRIP: one player card per clone type, slid sideways (drag, wheel, the arrows).
    const cardW = Math.max(150, Math.min(196, Math.round(PW * 0.29))), gap = 12, step = cardW + gap;
    const cardH = Math.max(210, Math.min(330, listH - 34)), cardY = listY + 4;
    const total = opts.length * step - gap + 8;
    const maxScroll = Math.max(0, total - listW);
    _crystalScrollX = Math.max(0, Math.min(_crystalScrollX, maxScroll));

    ctx.save(); ctx.beginPath(); ctx.rect(listX, listY, listW, listH); ctx.clip();
    opts.forEach((opt, i) => {
        const cx = listX + 4 + i * step - _crystalScrollX;
        if (cx + cardW < listX || cx > listX + listW) return;
        _drawCloneCard(opt, cx, cardY, cardW, cardH, listX, listW, listY, listH);
    });
    ctx.restore();

    // The arrows, and where you are in the strip.
    if (maxScroll > 0) {
        const aw = 46, ah = 70, ay = cardY + cardH / 2 - ah / 2;
        const lf = { x: listX + 2, y: ay, w: aw, h: ah }, rt = { x: listX + listW - aw - 2, y: ay, w: aw, h: ah };
        uiButton(lf, "\u25c0", UI_TEAL, false, 22, null, _crystalScrollX <= 0);
        uiButton(rt, "\u25b6", UI_TEAL, false, 22, null, _crystalScrollX >= maxScroll);
        window._cloneScrollArrows = { upX: lf.x, upY: lf.y, upW: lf.w, upH: lf.h, dnX: rt.x, dnY: rt.y, dnW: rt.w, dnH: rt.h, rowH: step, step };
        const dots = Math.min(opts.length, 12), dw = 14, dg = 6, dx0 = PX + PW / 2 - (dots * (dw + dg) - dg) / 2, pos = maxScroll ? _crystalScrollX / maxScroll : 0;
        for (let i = 0; i < dots; i++) { const on = Math.abs(i / Math.max(1, dots - 1) - pos) < 0.5 / Math.max(1, dots - 1) + 0.001; ctx.fillStyle = on ? UI_TEAL : "#26304f"; ctx.fillRect(dx0 + i * (dw + dg), listY + listH - 12, dw, 5); }
        if (PW > 480) uiCaption("SLIDE FOR MORE \u00b7 " + opts.length + " OPTIONS", PX + PW - 22, listY + listH - 8, "#6a7aa0", "right", 11);
    } else { window._cloneScrollArrows = null; }

    window._cloneTabOpts = opts;
    window._cloneTabBounds = { sortY:PY, sortH, sortW, listY, listH, listX, listW, rowH: step, cardW };
}

// The creature on a card: the board's own drawing (drawNPC) of a clone of that species and class, walking on the spot. One actor per card, kept.
let _cloneCardActors = {};
function _cloneCardActor(opt) {
    let a = _cloneCardActors[opt.key];
    if (!a) {
        const S = SPECIES[opt.speciesName], def = (typeof getClassDef === "function" ? getClassDef(S, opt.className) : S[opt.className]) || S.scout;
        a = new Predator(opt.className, Object.assign({}, def, { color: S.color }), 0, 0);
        a.team = "green"; a.isClone = true; a.speciesName = opt.speciesName; a.className = opt.className; a.dirX = 1; a.dirY = 0.35; a.hitFlash = 0; a.maxHealth = 0;   // (no health bar over a picture)
        _cloneCardActors[opt.key] = a;
    }
    a.walkCycle = (frame || 0) * 0.15; a.dead = false;
    return a;
}

// The creature, in `g` at (cx, cy) at scale sc: the board's own drawing, without the bars, level tag and ally bracket that go over a creature there.
function drawCloneArt(g, opt, cx, cy, sc) {
    g.save(); g.translate(cx, cy); g.scale(sc, sc);
    const _k = [_drawPredatorBars, drawHealthBar, typeof drawUnitTag === "function" ? drawUnitTag : null];
    _drawPredatorBars = () => {}; drawHealthBar = () => {}; if (_k[2]) drawUnitTag = () => {};
    try { drawNPC(_cloneCardActor(opt), 0, 0, g); } catch (e) { /* a picture must never take the menu down */ }
    finally { _drawPredatorBars = _k[0]; drawHealthBar = _k[1]; if (_k[2]) drawUnitTag = _k[2]; }
    g.restore();
}

// One player card: the creature on a speed-line wash in its colour, its class tag, its name, its numbers, the splices it needs and the CLONE button.
// The button's bounds are recorded only when the whole button is inside the visible strip (a half-hidden one must not be pressable).
function _drawCloneCard(opt, x, y, w, h, listX, listW, listY, listH) {
    const sd = SPECIES[opt.speciesName], cl = SPECIES[opt.speciesName]?.[opt.className];
    const col = opt.ready ? sd.color : "#3a4666";
    uiSlab(x, y, w, h, col, false, "#0f1730", !opt.ready && false);
    // the art window
    const artH = Math.round(h * 0.46), ax = x + 8, ay = y + 8, aw = w - 16;
    ctx.save(); ctx.beginPath(); ctx.rect(ax, ay, aw, artH); ctx.clip();
    const g = ctx.createRadialGradient(ax + aw / 2, ay + artH * 0.6, 4, ax + aw / 2, ay + artH * 0.6, aw * 0.75);
    g.addColorStop(0, sd.color + "55"); g.addColorStop(1, "#05070f"); ctx.fillStyle = g; ctx.fillRect(ax, ay, aw, artH);
    ctx.strokeStyle = sd.color + "22"; ctx.lineWidth = 2;
    for (let k = -2; k < 8; k++) { ctx.beginPath(); ctx.moveTo(ax + k * 30, ay + artH); ctx.lineTo(ax + k * 30 + 70, ay); ctx.stroke(); }
    if (!opt.ready) ctx.globalAlpha = 0.55;
    drawCloneArt(ctx, opt, ax + aw / 2, ay + artH * 0.7, Math.min(2.4, aw / 62));
    ctx.restore();
    // the class tag, a slab top-left
    const tag = opt.className.toUpperCase();
    ctx.save(); ctx.font = uiFont(14); const tw = ctx.measureText(tag).width + 20; ctx.restore();
    uiSlab(ax + 4, ay + 4, tw, 24, sd.color, true);
    uiText(tag, ax + 4 + tw / 2, ay + 17, 14, UI_INK, "center", false);
    // the INFO tab, top-right of the art: this clone's attacks, job and numbers (js/unitinfo.js)
    const iw = 62, ih = 26, ix = ax + aw - iw - 4, iy = ay + 4;
    uiButton({ x: ix, y: iy, w: iw, h: ih }, "INFO", UI_ICE, false, 14);
    if (ix >= listX && ix + iw <= listX + listW && iy >= listY && iy + ih <= listY + listH) { opt._ix = ix; opt._iy = iy; opt._iw = iw; opt._ih = ih; }
    // name and numbers
    uiTextFit(opt.speciesName.toUpperCase(), x + 14, y + artH + 30, 24, opt.ready ? "#fff" : "#8a93a8", "left", w - 28);
    if (cl) {
        const parts = [`PWR ${cl.power || "?"}`, `HP ${cl.health || "?"}`];
        if (cl.abdomenAttack || (cl.rangeDamage && cl.rangeDamage > 0)) parts.push(opt.speciesName === "spider" ? "WEB" : opt.speciesName === "mantis" ? "AMBUSH" : opt.speciesName === "moth" ? "DUST" : "SPECIAL");
        uiCaptionFit(parts.join("  "), x + 14, y + artH + 54, "#9fb0d0", "left", 13, w - 28);
    }
    // the splices
    const prog = Math.min(1, opt.have / opt.needed), bx0 = x + 14, bw0 = w - 28, by0 = y + artH + 68;
    ctx.fillStyle = "#05070f"; ctx.fillRect(bx0, by0, bw0, 10); ctx.fillStyle = opt.ready ? UI_TEAL : sd.color; ctx.fillRect(bx0, by0, bw0 * prog, 10);
    ctx.strokeStyle = opt.ready ? UI_TEAL : "#2c3656"; ctx.lineWidth = 1.5; ctx.strokeRect(bx0, by0, bw0, 10);
    uiCaption(`${opt.have}/${opt.needed} SPLICES`, bx0, by0 + 24, "#8aa0c8", "left", 11);
    uiCaption(`${opt.shardCost}\u2726`, bx0 + bw0, by0 + 24, shardCount >= opt.shardCost ? UI_GOLD : "#8a6a44", "right", 13);
    // the button
    const bh = 44, bx = x + 10, by = y + h - bh - 10, bw = w - 20, vis = bx >= listX && bx + bw <= listX + listW && by >= listY && by + bh <= listY + listH;
    if (opt.ready) { uiButton({ x: bx, y: by, w: bw, h: bh }, "CLONE", UI_TEAL, true, 22); if (vis) { opt._bx = bx; opt._by = by; opt._bw = bw; opt._bh = bh; } }
    else {
        // WHY NOT. A blocked card keeps the reason where the button would be, and a tap on it explains.
        uiButton({ x: bx, y: by, w: bw, h: bh }, cloneBlockedLabel(opt), UI_RED, false, 13, null, true);
        if (vis) { opt._nbx = bx; opt._nby = by; opt._nbw = bw; opt._nbh = bh; }
    }
}

// ── Tab: Modulation ───────────────────────────────────────
// ONE column, measured against the panel it is drawn in.
//
// REPORTED: "the modulation tab isn't fully available — make the design
// simpler, incorporating the crystal, and remove the slider tool."
//
// It was two hand-placed columns split at 62% of the panel. The right column
// held the only control and ran straight off the edge: on a 1024 tablet the
// heading read "NEW FOLLOWERS COME OUT", the help text was cut mid-word, and
// the fifth swatch was half outside the panel. On a phone the fifth was gone
// entirely — with six elements unlocked the player could not reach the last
// one at all.
//
// The left column was the old slider's leftovers: a decorative crystal, the
// mix label, a size caption ("all elements") and a strip of colour chips that
// cycled through the mix. Three of those four say the same thing as the swatch
// row, and the mix label appeared three times on one screen.
//
// So: the crystal stays and becomes the readout — it already pulses through
// the colours actually in the mix — and everything else that merely restated
// the mix is gone. Under it, the swatch row, sized to fit rather than hoping.
function _drawModTab(PX, PY, PW, PH, scheme) {
    // Looking at the control IS the decision. The prompt used to be clearable
    // only by toggling a swatch, so a player happy with their mix had no way to
    // dismiss it that did not also change the mix.
    modulationDirty = false;
    const mixName = scheme.label.toUpperCase();   // what the mix is, said once
    const wide = PW >= 540, pad = 18, footH = 50;
    const nEl = ELEMENTS.length, cols = nEl > 6 ? 3 : 2, gap = 10;
    let gx, gy, gw, gh;
    if (wide) {
        // THE GEM on the left is the readout (a wedge for each element, lit when it is in the mix); the element cards are the control on the right.
        const leftW = Math.round(PW * 0.36), bodyH = PH - footH;
        const R = Math.max(26, Math.min(96, Math.floor(leftW * 0.34), Math.floor((bodyH - 150) / 2)));
        // the block (crystal, caption, name, pips) is centred in the column
        const blockH = R * 2 + 16 + 26 + 40 + 6, top = PY + Math.max(8, Math.round((bodyH - blockH) / 2));
        const cx = PX + leftW / 2, cy = top + R;
        _drawMixGem(cx, cy, R);
        uiCaptionFit("NEW FOLLOWERS COME OUT AS", cx, cy + R + 24, "#8aa0c8", "center", 13, leftW - 20);
        uiTextFit(mixName, cx, cy + R + 56, 34, "#fff", "center", leftW - 24);
        uiCaptionFit(ELEMENTS.filter(e => unlockedElements.has(e.id)).length + " OF " + nEl + " ELEMENTS ONLINE", cx, cy + R + 84, "#6a7aa0", "center", 12, leftW - 20);
        gx = PX + leftW + 6; gw = PW - leftW - 6 - pad; gy = PY + 50; gh = bodyH - 56;
        uiText("ELEMENTS", gx + 4, PY + 24, 22, "#fff", "left", false);
        uiCaption("tap to add or drop", PX + PW - pad, PY + 24, "#6a7aa0", "right", 13);
    } else {
        // A narrow screen: the crystal and the mix name sit in a band across the top (it stands down when the panel is short).
        const bandH = PH >= 440 ? 104 : 0;
        if (bandH) {
            _drawMixGem(PX + 62, PY + bandH / 2, 38);
            uiCaptionFit("NEW FOLLOWERS COME OUT AS", PX + 112, PY + bandH / 2 - 20, "#8aa0c8", "left", 12, PW - 124);
            uiTextFit(mixName, PX + 112, PY + bandH / 2 + 12, 32, "#fff", "left", PW - 124);
        } else {
            uiTextFit("MIX: " + mixName, PX + PW / 2, PY + 22, 24, "#fff", "center", PW - 24);
        }
        const top = bandH || 44;
        gx = PX + 10; gw = PW - 20; gy = PY + top; gh = PH - top - footH;
    }
    const res = drawModulationCards(gx, gy, gw, Math.max(60, gh), cols, gap);
    window._modSwatchRects = res.swatches;
    // PENDING ELEMENTS — earned in the tunnel, activated here. This is why the
    // player walks back: an element earned by clearing a wave does nothing
    // until it is brought online here. Which one is the player's pick, so
    // every element still locked is offered, as a card of the grid above.
    window._modActivateRects = res.picks;

    // The foot: what is coming, and what overrides the mix.
    const fy = PY + PH - footH + 14;
    const next = nextWaveUnlock();
    if (pendingElements.length > 0) uiTextFit(pendingElements.length > 1 ? pendingElements.length + " UNLOCKS EARNED — CHOOSE" : "UNLOCK EARNED — CHOOSE AN ELEMENT", PX + PW / 2, fy, 18, UI_GOLD, "center", PW - 30);
    else uiCaptionFit(next ? "NEXT UNLOCK: YOUR PICK \u2014 CLEAR A WAVE" : "ALL ELEMENTS ONLINE \u00b7 " + lifetimeKills + " kills", PX + PW / 2, fy, "#8aa0c8", "center", 14, PW - 30);
    // A boss modulator overrides the mix for the followers it touches, so it
    // belongs on this screen — one line, at the foot, out of the way.
    if (ownedModulators.length > 0) uiCaptionFit("MODULATORS: " + ownedModulators.map(mod => ((ELEMENTS.find(e => e.id === mod.element) || {}).label || mod.element).toUpperCase()).join(" \u00b7 "),
        PX + PW / 2, fy + 22, "#6a7aa0", "center", 13, PW - 30);
}

// Every element still locked, in the ladder's order: what an earned unlock can be spent on (js/wavedata.js activatePendingElement).
function _modChoices() {
    const order = typeof ELEMENT_LADDER !== "undefined" ? ELEMENT_LADDER : ELEMENTS.map(e => e.id);
    return order.filter(id => !unlockedElements.has(id) && ELEMENTS.some(e => e.id === id));
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
    // Outside panel → close
    if (ex<b.PX||ex>b.PX+b.PW||ey<b.contentY||ey>b.contentY+b.contentH) {
        crystalMenuOpen=false; return true;
    }

    return true;
}
