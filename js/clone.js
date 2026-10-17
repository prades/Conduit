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
            if (ex >= tx && ex <= tx + cl.sortW) { crystalCloneSort = CSORTS[i].id; _crystalScrollY = 0; return true; }
        }
    }
    const sa = window._cloneScrollArrows;
    if (sa) {
        if (ex>=sa.upX&&ex<=sa.upX+sa.upW&&ey>=sa.upY&&ey<=sa.upY+sa.upH) { _crystalScrollY=Math.max(0,_crystalScrollY-sa.rowH); return true; }
        if (ex>=sa.dnX&&ex<=sa.dnX+sa.dnW&&ey>=sa.dnY&&ey<=sa.dnY+sa.dnH) { _crystalScrollY+=sa.rowH; return true; }
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
let _crystalModPhase = 0;                   // color-cycle frame counter
let _crystalScrollY  = 0;                   // clone list scroll offset (px)

// Tab definitions
const CTABS = [
    { id:"modulation", label:"MODULATION", color:"#aaddff" },
    { id:"info",       label:"INFO",       color:"#ffcc44" },
    { id:"recruit",    label:"RECRUIT",    color:"#0f8"    },
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
        ctx.fillStyle = on ? el.color : "#0c1224";
        ctx.globalAlpha = on ? 0.55 + pulse * 0.45 : 1;
        ctx.fillRect(sx, y, cell, cell);
        ctx.globalAlpha = 1;
        if (on) { ctx.strokeStyle = el.color; ctx.globalAlpha = 0.25; ctx.lineWidth = 7; ctx.strokeRect(sx, y, cell, cell); ctx.globalAlpha = 1; }
        ctx.strokeStyle = on ? "#ffffff" : el.color + "88";
        ctx.lineWidth = on ? 3 : 2;
        ctx.strokeRect(sx + 0.5, y + 0.5, cell - 1, cell - 1);
        if (showLabels) {
            ctx.fillStyle = on ? el.color : "#6a7aa0";
            ctx.font = uiMono(Math.max(11, Math.min(14, Math.round(cell * 0.28))));
            ctx.textAlign = "center"; ctx.textBaseline = "top";
            ctx.fillText(el.label.slice(0, 3).toUpperCase(), sx + cell / 2, y + cell + 5);
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

    const bx = _panelBox();
    const { PX, PY, PW, tabH, closeW, contentY, contentH } = bx;
    const tabAreaW = PW - closeW;
    const tabW = Math.floor(tabAreaW / CTABS.length);

    // Advance modulation blink
    const scheme = _getModScheme();
    const blinkRate = Math.max(5, 34 - scheme.size * 5);
    _crystalModPhase++;
    const cycleIdx = Math.floor(_crystalModPhase / blinkRate) % Math.max(1, scheme.colors.length);
    const cycleColor = scheme.colors[cycleIdx] || "#888";

    ctx.save(); ctx.setTransform(1,0,0,1,0,0);
    uiBackdrop(0.78);
    const cur = CTABS.find(t => t.id === crystalMenuTab) || CTABS[0];
    uiPanel(PX, PY, PW, tabH + contentH, cur.color);

    // ── Tab bar ───────────────────────────────────────────
    CTABS.forEach((tab, i) => uiButton({ x: PX + i*tabW + 4, y: PY + 8, w: tabW - 6, h: tabH - 14 }, tab.label, tab.color, crystalMenuTab === tab.id, 15));
    // Close button
    const cx2 = PX + tabAreaW;
    uiButton({ x: cx2 + 4, y: PY + 8, w: closeW - 10, h: tabH - 14 }, "\u2715", UI_RED, false, 22);

    // ── Content area ──────────────────────────────────────
    ctx.save();
    ctx.beginPath(); ctx.rect(PX+1, contentY+1, PW-2, contentH-2); ctx.clip();

    switch(crystalMenuTab) {
        case "modulation": _drawModTab(PX, contentY, PW, contentH, scheme, cycleColor); break;
        case "info":       _drawInfoTab(PX, contentY, PW, contentH); break;
        case "recruit":    _drawRecruitTab(PX, contentY, PW, contentH); break;
    }
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

    const listY = hdrY + hdrH + 2;
    const listH = PH - (listY - PY);
    const opts  = _sortedCloneOptions(getCloneOptions(), crystalCloneSort);
    const rowH  = 92;

    if (opts.length === 0) {
        const msg = capAtMax ? `Clone cap reached (${MAX_CLONES}/${MAX_CLONES})` : crystalCloneSort==="specials" ? "No clones with special attacks" : "No DNA splices available";
        uiText(msg, PX + PW / 2, listY + listH / 2, 22, "#6a7aa0", "center", false);
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
        const bw = 132, bh = 48, bx = PX + PW - 24 - bw, by2 = rowY + (rowH - bh) / 2;
        const btnVisible = by2 >= listY && by2 + bh <= listY + listH;
        const sd = SPECIES[opt.speciesName];
        const cl = SPECIES[opt.speciesName]?.[opt.className];

        uiSlab(PX + 12, rowY + 4, PW - 24, rowH - 8, opt.ready ? sd.color : "#2c3656", false, opt.ready ? "#13203a" : "#0c1224");
        ctx.fillStyle = sd.color; ctx.fillRect(PX + 16, rowY + 12, 6, rowH - 24);
        const nameMax = bx - (PX + 40) - 10;
        uiTextFit(opt.speciesName.toUpperCase()+" "+opt.className.toUpperCase(), PX + 40, rowY + 24, 24, opt.ready ? "#fff" : "#6a7aa0", "left", nameMax);

        if (cl) {
            const parts=[`PWR ${cl.power||"?"}`, `HP ${cl.health||"?"}`];
            if (cl.abdomenAttack||(cl.rangeDamage&&cl.rangeDamage>0)) {
                if (opt.speciesName === "spider")  parts.push("\u25c8 WEB SHOT");
                else if (opt.speciesName === "mantis") parts.push("\u25c8 AMBUSH");
                else if (opt.speciesName === "moth")   parts.push("\u25c8 DUST");
                else parts.push("\u25c8 SPECIAL");
            }
            uiCaption(parts.join("   "), PX + 40, rowY + 46, "#8aa0c8", "left", 14);
        }

        const prog = Math.min(1, opt.have/opt.needed), barW = Math.min(170, nameMax - 90);
        ctx.fillStyle = "#05070f"; ctx.fillRect(PX + 40, rowY + 61, barW, 10);
        ctx.fillStyle = opt.ready ? UI_TEAL : sd.color; ctx.fillRect(PX + 40, rowY + 61, barW * prog, 10);
        ctx.strokeStyle = opt.ready ? UI_TEAL : "#2c3656"; ctx.lineWidth = 1.5; ctx.strokeRect(PX + 40, rowY + 61, barW, 10);
        uiCaption(`${opt.have}/${opt.needed}`, PX + 40 + barW + 10, rowY + 66, "#8aa0c8", "left", 14);
        uiCaption(`${opt.shardCost}\u2726`, bx + bw / 2, rowY + rowH - 9, shardCount >= opt.shardCost ? UI_GOLD : "#8a6a44", "center", 14);

        if (opt.ready) {
            uiButton({ x: bx, y: by2, w: bw, h: bh - 8 }, "CLONE", UI_TEAL, true, 22);
            if (btnVisible) { opt._bx=bx; opt._by=by2; opt._bw=bw; opt._bh=bh - 8; }
        } else {
            // WHY NOT. A blocked row used to render dim with no button and no
            // reason, so a player with four clones already out saw three
            // affordable prices and nothing to press — "even though I have the
            // money, I'm unable to buy the clone". The blocker goes where the
            // button would have been.
            uiButton({ x: bx, y: by2, w: bw, h: bh - 8 }, cloneBlockedLabel(opt), UI_RED, false, 13, null, true);
            // Tappable, so the tap can EXPLAIN. Kept separate from _bx, which
            // means "this can be bought".
            if (btnVisible) { opt._nbx=bx; opt._nby=by2; opt._nbw=bw; opt._nbh=bh - 8; }
        }
    });
    ctx.restore();

    // Scroll arrows
    if (maxScroll > 0) {
        const arrW=64, arrH=34;
        const up = { x: PX + PW / 2 - arrW - 6, y: listY + listH - arrH - 6, w: arrW, h: arrH }, dn = { x: PX + PW / 2 + 6, y: listY + listH - arrH - 6, w: arrW, h: arrH };
        uiButton(up, "\u25b2", UI_TEAL, false, 18, null, _crystalScrollY <= 0);
        uiButton(dn, "\u25bc", UI_TEAL, false, 18, null, _crystalScrollY >= maxScroll);
        window._cloneScrollArrows={
            upX:up.x, upY:up.y, upW:up.w, upH:up.h,
            dnX:dn.x, dnY:dn.y, dnW:dn.w, dnH:dn.h,
            rowH
        };
    } else { window._cloneScrollArrows=null; }

    window._cloneTabOpts = opts;
    window._cloneTabBounds = { sortY:PY, sortH, sortW, listY, listH, rowH };
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
function _drawModTab(PX, PY, PW, PH, scheme, cycleColor) {
    // Looking at the control IS the decision. The prompt used to be clearable
    // only by toggling a swatch, so a player happy with their mix had no way to
    // dismiss it that did not also change the mix.
    modulationDirty = false;
    const MID = PX + PW / 2;
    const INSET = 20;
    const INNER = PW - INSET * 2;
    // A short panel (a phone on its side) shrinks the buttons and the type, not the control.
    const k = Math.max(0.62, Math.min(1, PH / 520));

    // The swatch row is the control, so it decides its own size: as big as the
    // panel allows, never wider than it. Six elements on a phone fit because
    // the cell shrinks, not because the row is allowed to overflow.
    const n = normaliseModulationMask().length;
    const gap = n > 6 ? 6 : 10;
    const cell = n > 0
        ? Math.max(16, Math.min(Math.round(60 * k), Math.floor((INNER - (n - 1) * gap) / n)))
        : 0;
    const rowW = n > 0 ? n * cell + (n - 1) * gap : 0;
    const labH = Math.round(30 * k), btnH = Math.round(44 * k);

    // The crystal, cycling through the colours that are actually in the mix.
    // This IS the readout — there is no separate label for what it is showing.
    //
    // It takes whatever height is left once everything that has to be readable
    // has had its share, and stands down entirely when there is not enough. In
    // landscape on a phone the panel is short, and a crystal sized off the
    // panel height pushed the ACTIVATE button and the footer off the bottom:
    // the one decoration on the screen was crowding out the only control.
    const fixedH = labH + 22                            // mix label + caption
                 + cell + 26                            // the swatch row + labels
                 + 40                                   // the two help lines
                 + (pendingElements.length > 0
                        ? 30 + _modChoices().length * (btnH + 8) + 12
                        : 26)                           // activate list, or NEXT
                 + 24;                                  // the modulator footer
    const crystR = Math.max(0, Math.min(78, Math.floor((PH - fixedH - 46) / 2)));
    const crystY = PY + 22 + crystR;
    if (crystR >= 22) _draw2DCrystal(MID, crystY, crystR, cycleColor);

    let y = (crystR >= 22 ? crystY + crystR + 14 : PY + 10);

    // What the mix is, said once.
    uiTextFit(scheme.label.toUpperCase(), MID, y + labH / 2, Math.round(30 * k), cycleColor, "center", INNER);
    y += labH + 6;
    uiCaption("NEW FOLLOWERS COME OUT AS", MID, y + 6, "#8aa0c8", "center", 14);
    y += 22;

    // ── The control ───────────────────────────────────────
    window._modSwatchRects = drawModulationSwatches(
        Math.round(MID - rowW / 2), y, cell, gap, true);
    // The swatches carry a label UNDER them, so the next line clears the
    // label rather than the squares.
    y += cell + 26;

    uiCaptionFit("Tap an element to add it to the mix or drop it.", MID, y + 2, "#6a7aa0", "center", 13, INNER);
    uiCaptionFit("Followers take it at the Crystal, and again on respawn.", MID, y + 20, "#6a7aa0", "center", 13, INNER);
    y += 40;

    // ── PENDING ELEMENTS — earned in the tunnel, activated here ───────────
    // This is why the player walks back. An element earned by clearing a wave
    // does nothing until it is brought online here.
    window._modActivateRects = [];
    if (pendingElements.length > 0) {
        // An unlock is earned; WHICH element it is is the player's pick. Every element still locked is offered.
        const choices = _modChoices();
        uiText(pendingElements.length > 1 ? pendingElements.length + " UNLOCKS EARNED — CHOOSE" : "UNLOCK EARNED — CHOOSE AN ELEMENT", MID, y + 6, Math.round(20 * k), UI_GOLD, "center");
        y += 30;
        const bw = Math.min(360, INNER);
        choices.forEach((id, i) => {
            const el = ELEMENTS.find(e => e.id === id);
            const col = el ? el.color : "#888";
            const bx = Math.round(MID - bw / 2), by = y + i * (btnH + 8), bh = btnH;
            const pulse = 0.5 + 0.5 * Math.sin(_crystalModPhase * 0.09 + i);
            uiSlab(bx, by, bw, bh, col, false, "#13203a");
            ctx.globalAlpha = 0.12 + pulse * 0.2; ctx.fillStyle = col; uiSlabPath(bx, by, bw, bh); ctx.fill(); ctx.globalAlpha = 1;
            uiTextFit("\u25c8 UNLOCK " + (el ? el.label : id.toUpperCase()), bx + bw / 2, by + bh / 2 + 1, Math.round(22 * k), "#fff", "center", bw - 24);
            window._modActivateRects.push({ id, bx, by, bw, bh });
        });
        y += choices.length * (btnH + 8) + 12;
    } else {
        const next = nextWaveUnlock();
        uiCaptionFit(next
            ? "NEXT UNLOCK: YOUR PICK \u2014 CLEAR A WAVE"
            : "ALL ELEMENTS ONLINE \u00b7 " + lifetimeKills + " kills", MID, y + 6, "#8aa0c8", "center", 14, INNER);
        y += 26;
    }

    // A boss modulator overrides the mix for the followers it touches, so it
    // belongs on this screen — one line, at the foot, out of the way.
    uiCaptionFit(ownedModulators.length === 0 ? "MODULATORS: none \u2014 defeat a boss to unlock"
        : "MODULATORS: " + ownedModulators.map(mod => ((ELEMENTS.find(e => e.id === mod.element) || {}).label || mod.element).toUpperCase()).join(" \u00b7 "),
        MID, y + 6, "#6a7aa0", "center", 13, INNER);
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
        {col:UI_TEAL,    text:"BUILD ("+PYLON_BUILD_COST+" shards) — place on any floor tile"},
        {col:UI_GOLD,    text:"UPGRADE — merge a follower into the pylon"},
        {col:"#a9b8ff",  text:"WAVE/ATTACK — toggle pylon firing mode"},
        {col:"#ff9a6a",  text:"RECON — send squad to reconstruct a pylon"},
        {col:"#cc88ff",  text:"Crystal slowly refills all follower ultimates"},
        {col:"#5ffbe0",  text:"Deeper zone pylons = faster charge rate"},
        {col:"#ff7a6a",  text:"Nest pod link grants bonus charge"},
    ];
    const rowH = Math.max(24, Math.min(40, Math.floor((PH - 120) / (ultimates.length + pylons.length + 2))));
    let y = PY + 8;
    uiText("ULTIMATES", PX + 28, y + 14, 24, UI_GOLD, "left");
    uiCaption("double-tap a follower when fully charged", PX + PW - 22, y + 14, "#8aa0c8", "right", 13);
    y += 36;
    ultimates.forEach((r) => {
        const el=ELEMENTS.find(e=>e.id===r.el);
        const col=el?el.color:"#fff";
        ctx.fillStyle = col; ctx.fillRect(PX + 18, y + 4, 5, rowH - 8);
        uiText(r.name.toUpperCase(), PX + 34, y + rowH / 2, Math.min(18, rowH * 0.55), col, "left", false);
        uiCaption(r.desc, PX + Math.min(210, PW * 0.34), y + rowH / 2, "#9fb0d0", "left", 13);
        y += rowH;
    });
    y += 8;
    uiText("PYLON GUIDE", PX + 28, y + 14, 24, "#ffaa44", "left");
    y += 36;
    pylons.forEach((r) => {
        uiCaption("\u25b8 " + r.text, PX + 24, y + rowH / 2 - 4, r.col, "left", 14);
        y += rowH - 6;
    });
}

// ── Tab: Recruit ──────────────────────────────────────────
function _drawRecruitTab(PX, PY, PW, PH) {
    const canAfford = shardCount >= 30;
    uiText("RECRUIT FOLLOWER", PX + PW / 2, PY + 40, 32, UI_TEAL, "center");
    uiCaption("Spawns a follower of a random unlocked element", PX + PW / 2, PY + 78, "#8aa0c8", "center", 14);
    uiText("SHARDS  " + shardCount + " / 30", PX + PW / 2, PY + 118, 26, canAfford ? UI_GOLD : UI_RED, "center");

    // Button
    const btnY = PY + 152, btnH = 70;
    window._recruitBtnBounds = { x: PX + 28, y: btnY, w: PW - 56, h: btnH };
    uiButton(window._recruitBtnBounds, "SPAWN FOLLOWER \u2014 30 SHARDS", UI_TEAL, canAfford, 26, null, !canAfford);
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

    return true;
}
