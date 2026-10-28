// ─────────────────────────────────────────────────────────
//  CLONE SYSTEM
// ─────────────────────────────────────────────────────────
let cloneMenuOpen = false;

// ── DNA: the splices a kill drops (js/drops.js), what a clone costs besides crystals. Kept in memory, and in the facility's save (js/facilitysave.js). ──
let dnaInventory = {};
function getDNA() { return dnaInventory; }
function addDNA(key, amount) { dnaInventory[key] = (dnaInventory[key] || 0) + amount; }
function deductDNA(key, amount) { dnaInventory[key] = Math.max(0, (dnaInventory[key] || 0) - amount); }
function clearDNA() { dnaInventory = {}; }
function dnaApply(obj) { dnaInventory = {}; for (const k of Object.keys(obj || {})) { const n = Number(obj[k]); if (Number.isFinite(n) && n > 0) dnaInventory[k] = Math.round(n); } }

function openCloneMenu() {
    cloneMenuOpen = true;
    drawCloneMenu();
}

const MAX_CLONES = 4; // summon cap when every class may clone (CLASS_RULES.clone with no skill); the Mutator's is the rule's `max`

// ── WHO GROWS CLONES, AND HOW MANY ───────────────────────
// CLASS_RULES.clone (js/classes.js): the class with the rule's skill (the Mutator) grows clones, `max` at once (one), and they are PRIMARY clones (js/mutator.js: they do not come back by themselves).
// With no skill in the rule every class may clone, up to MAX_CLONES, and they come back at the Crystal.
function cloneRule() { return typeof CLASS_RULES !== "undefined" && CLASS_RULES.clone ? CLASS_RULES.clone : null; }
function cloneCap() { const r = cloneRule(); return r && r.skill && r.max > 0 ? r.max : MAX_CLONES; }
function cloneLiveCount() { return actors.filter(a => a && a.isClone && !a.dead).length; }
// the classes that may clone, by name ("MUTATOR"), or null when every class may
function cloneWho() {
    const r = cloneRule(); if (!r || !r.skill || typeof CLASSES === "undefined") return null;
    return (typeof CLASS_ORDER !== "undefined" ? CLASS_ORDER : Object.keys(CLASSES)).filter(id => (CLASSES[id].skills || []).includes(r.skill)).map(id => CLASSES[id].name).join(" / ") || null;
}
// { ok, primary } or { ok: false, why, short }
function cloneAllowed() {
    const r = cloneRule(); if (!r || !r.skill) return { ok: true, primary: false };
    const cls = typeof playerClass === "function" ? playerClass() : null, who = cloneWho() || "CLASS";
    if (!cls) return { ok: false, why: "CLASSES COME AFTER THE TUTORIAL — A " + who + " GROWS CLONES", short: who + " ONLY" };
    if (!(cls.skills || []).includes(r.skill)) return { ok: false, why: "ONLY A " + who + " GROWS CLONES", short: who + " ONLY" };
    return { ok: true, primary: !!r.primary };
}

function getCloneOptions() {
    const options = [];
    const liveClones = cloneLiveCount(), cap = cloneCap(), allowed = cloneAllowed().ok;
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
                ready: allowed && have >= needed && shardCount >= shardCost && liveClones < cap
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
    const al = cloneAllowed(); if (!al.ok) return al.why;
    const live = cloneLiveCount(), cap = cloneCap();
    if (live >= cap)
        return cap === 1 ? "ONE CLONE AT A TIME — DISMISS YOURS FIRST" : "CLONE CAP " + live + "/" + cap + " — DISMISS ONE FIRST";
    if (option.have < option.needed)
        return "NEED " + (option.needed - option.have) + " MORE " +
               option.speciesName.toUpperCase() + " DNA";
    if (shardCount < option.shardCost)
        return "NEED " + (option.shardCost - shardCount) + " MORE SHARDS";
    return null;
}

function cloneBlockedLabel(option) {
    const al = cloneAllowed(); if (!al.ok) return al.short;
    const live = cloneLiveCount(), cap = cloneCap();
    if (live >= cap)                         return "CAP " + live + "/" + cap;
    if (option.have < option.needed)         return "DNA " + option.have + "/" + option.needed;
    if (shardCount < option.shardCost)       return "NEED " + option.shardCost + "✦";
    return "—";
}

// Free a slot: the oldest clone is dismissed (the cap would otherwise sit full for the rest of the game, with no way to clear it).
function dismissOldestClone() {
    const live = actors.filter(a => a.isClone && !a.dead);
    if (live.length === 0) return false;
    const c = live[0];   // actors order is summon order
    c.dead = true;
    c.dismissed = true;   // (it does not come back: js/game.js queues no return for a dismissed clone, and a primary one leaves no body)
    if (c.primary && typeof mutatorReleased === "function") mutatorReleased(c);   // the Mutator's: a share of what it cost comes back (js/mutator.js)
    floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80,
        text: (c.speciesName || "CLONE").toUpperCase() + (c.primary ? " CLONE RELEASED" : " DISMISSED"),
        color: "#88aacc", life: 100, vy: -0.2 });
    return true;
}

// ── BUILDING A CLONE ─────────────────────────────────────
// THE one place a clone is made: the summon, a respawn and a reload all come through it, so every rule about what a clone IS lives here. It is its species' class numbers
// times CLONE_HEALTH_MULT and CLONE_POWER_MULT (js/config.js), on your side, with its species' body, at the level of what it will fight unless it comes back with its own.
function makeClone(speciesName, className, x, y, state, lv) {
    const speciesDef = typeof SPECIES !== "undefined" ? SPECIES[speciesName] : null;
    if (!speciesDef) return null;
    const classDef = typeof getClassDef === "function"
        ? getClassDef(speciesDef, className)
        : speciesDef[className];
    if (!classDef) return null;

    const def = {
        width:     classDef.width,
        height:    classDef.height,
        moveSpeed: classDef.moveSpeed,
        // Multiplied on the way in, so health AND maxHealth carry it — the
        // constructor sets both from def.health, and a clone patched after
        // construction would show a full bar at a quarter of the length.
        health:    classDef.health * CLONE_HEALTH_MULT,
        power:     classDef.power,
        color:     speciesDef.color,
        // Its species' shot from the rear (a striker's or tank's), as strong as its bite is (CLONE_POWER_MULT): the brief, "Clones should use the established designs and characteristics of their
        // corresponding enemy species". A clone was built without it, so a scorpion striker clone never stung.
        reactionSpeed:   classDef.reactionSpeed ?? 15,
        abdomenAttack:   classDef.abdomenAttack ?? false,
        rangeDamage:     (classDef.rangeDamage || 0) * CLONE_POWER_MULT,
        abdomenCooldown: classDef.abdomenCooldown ?? 90
    };

    const clone = new Predator(className, def, x, y);
    clone.state       = state || "wander";
    clone.wanderTimer = 0;
    clone.team        = "green";
    clone.isClone     = true;
    clone.power       = Math.round(clone.power * CLONE_POWER_MULT);
    clone.speciesName = speciesName;
    clone.className   = className;
    // ITS LEVEL (js/levels.js). A new clone comes out at the level of the arena's creatures (creatureLevel) and then grows by its own kills;
    // a clone that respawns, or comes back from a save, keeps its own (lv).
    if (typeof setPredatorLevel === "function") {
        const L = lv && Number.isFinite(lv.level) ? lv.level : (typeof creatureLevel === "function" ? creatureLevel() : LEVEL_START);
        setPredatorLevel(clone, L, true);
        clone.xp = lv && Number.isFinite(lv.xp) ? Math.max(xpForLevel(clone.level), lv.xp) : xpForLevel(clone.level);
    }
    if (typeof applySpeciesBody === "function") applySpeciesBody(clone, speciesName);
    if (typeof initAbility === "function") initAbility(clone);   // its species' charge-up special (js/abilities.js), now that species and class are both known
    actors.push(clone);
    return clone;
}

// ── A CLONE FIGHTS AS THE CREATURE IT IS ─────────────────
// ASKED (the brief): "Clones should use the established designs and characteristics of their corresponding enemy species." A clone is run by the followers' AI (js/npc.js: it follows you, holds, comes, is
// sent at a creature by the enemy card), and that AI struck with a follower's plain swing: no element and no stats made every hit 1.25 (js/combat.js followerAttack), whatever the clone's power. An ant scout
// clone (power 72) took 600 frames to bring an ant scout down to two thirds while the ant bit it for 18 a time (measured: docs/MUTATOR.md). Now it fights the way its species does:
//   cloneFight   it closes to its reach and BITES in the creature's two beats (js/predator.js _biteTick: it rears back under the telegraph, js/combat.js, then the bite lands for its power), facing what it
//                bites. A creature roots itself to rear back; a clone keeps after a target that walks on while it rears (the creatures it goes for are often walking to the Crystal: rooted, it missed every
//                bite at one), so only a target faster than the clone gets out of its reach in the wind-up and is missed.
//   cloneTick    each step before the AI: its charge-up special (js/abilities.js: an ant striker's MANDIBLE FRENZY, a beetle's CARAPACE SLAM, a scout's LEAP away when it is hurt) and a striker's or tank's
//                abdomen shot (js/predator.js _abdomenTick). While it is told to RETREAT it starts neither (a special already under way finishes).
function cloneReach(c) { return (c && c.biteReach) || COMBAT.bite.reach; }
function cloneFight(c, foe) {
    if (!c || !foe || foe.dead) return;
    const d = Math.hypot(foe.x - c.x, foe.y - c.y);
    if (c.attackWindup > 0 || d <= cloneReach(c) * 0.9) {   // in reach, or already rearing back
        c.state = "attack"; faceToward(c, foe.x, foe.y, 0.3);
        if (c.attackWindup > 0 && d > cloneReach(c) * 0.8) _moveToward(c, foe.x, foe.y);   // (it keeps after a target that walks on while it rears back)
        c._biteTick(foe);
        return;
    }
    c.state = "hunt";   // closing in: the legs walk (js/bugs3d.js draws a still body in "attack")
    if (c.attackCooldown > 0) c.attackCooldown--;   // (its rest runs down on the way)
    if (c.attackAnim > 0) { c.attackAnim += 0.18; if (c.attackAnim >= Math.PI) c.attackAnim = 0; } else if (c.attackAnim < 0) c.attackAnim = 0;
    _moveToward(c, foe.x, foe.y);
    faceToward(c, foe.x, foe.y, 0.15);
}
// Nothing to fight: it puts its jaws away and walks (the bite it was rearing for is let go).
function cloneCalm(c) {
    if (!c) return;
    if (c.state === "attack") c.state = "hunt";
    c.attackWindup = 0; c.biteTarget = null;
    if (c.attackAnim > 0) { c.attackAnim += 0.18; if (c.attackAnim >= Math.PI) c.attackAnim = 0; } else if (c.attackAnim < 0) c.attackAnim = 0;
    if (c.attackCooldown > 0) c.attackCooldown--;
}
// true when its special has the step (it is rooted while it winds up, in the air in a leap, charging in a slam): the AI is skipped
function cloneTick(c) {
    if (!c || c.dead) return false;
    const f = typeof frame !== "undefined" ? frame : 0, retreating = c.retreatUntil > f;
    if (typeof clonePounceTick === "function" && clonePounceTick(c)) return true;   // the POUNCE upgrade's jumping attack (js/mutator.js)
    if (typeof abilityTick === "function" && !(retreating && (c.abilityPhase === "charging" || c.abilityPhase === "ready")) && abilityTick(c)) return true;
    if (c.abdomenAttack && !retreating && !(c.attackWindup > 0) && typeof c._abdomenTick === "function") {
        const foe = c._nearestEnemy && !c._nearestEnemy.dead ? c._nearestEnemy : c.lastAttacker && !c.lastAttacker.dead && c.lastAttacker.team === "red" ? c.lastAttacker : null;
        if (foe && Math.hypot(foe.x - c.x, foe.y - c.y) < 6) c._abdomenTick();
    }
    return false;
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
    const _al = cloneAllowed(); if (!_al.ok || cloneLiveCount() >= cloneCap()) return;

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

    // Spawn clone at crystal. "hunt", because one you just paid for should go
    // and do something rather than wander off.
    const clone = makeClone(option.speciesName, option.className, crystal.x, crystal.y, "hunt");
    if (!clone) return;
    if (_al.primary && typeof mutatorCloneMade === "function") mutatorCloneMade(clone, option);   // the Mutator's one clone (js/mutator.js)
    const speciesDef = SPECIES[option.speciesName];

    // Floating text (the Mutator's: its one clone, which follows it)
    floatingTexts.push({
        x: canvas.width/2, y: canvas.height/2,
        text: clone.primary ? "YOUR CLONE: " + option.speciesName.toUpperCase() + " " + option.className.toUpperCase() + " · IT FOLLOWS YOU" : option.speciesName.toUpperCase() + " " + option.className.toUpperCase() + " CLONED",
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
    const title = _fl ? _fl.text + "  \u00b7  " + cloneLiveCount() + "/" + cloneCap() : "CLONE BAY";
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
    if (cl.upgrades) { if (typeof cloneUpgradeTap === "function") cloneUpgradeTap(ex, ey); return true; }   // the Mutator's clone is out: its upgrades (js/mutator.js)
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

// ─────────────────────────────────────────────────────────
//  MAKING A CREATURE
// ─────────────────────────────────────────────────────────
// THE one place a hostile creature is made: the arena's spawner (js/facilityspawn.js) and the tutorial's assault (js/tutorial.js) both come through it, saying what they want.
//   opts.species, opts.className   what it is (js/species.js SPECIES; a species or class the table does not have makes nothing)
//   opts.x, opts.y                  where (tiles); the Crystal's tile when none is given (the callers move it afterwards)
//   opts.level                      its level (js/levels.js setPredatorLevel); the arena's (creatureLevel) when none is given
//   opts.state                      "wander" or "hunt"; by default it hunts while an alarm is up and wanders otherwise
// It is its class's numbers, its species' body (applySpeciesBody), its charge-up special (js/abilities.js initAbility), and it is worth its class's crystals and DNA
// when it dies (js/drops.js onPredatorDeath: a kill pays on the spot).
function spawnCreature(opts) {
    opts = opts || {};
    const speciesName = opts.species, className = opts.className || "scout";
    const speciesDef  = typeof SPECIES !== "undefined" ? SPECIES[speciesName] : null;
    if (!speciesDef || !(speciesDef[className] || className === "worker")) return null;   // (a worker block is derived from the scout's when a species has none: getClassDef)
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
    const x = Number.isFinite(opts.x) ? opts.x : crystal.x, y = Number.isFinite(opts.y) ? opts.y : crystal.y;
    const predator = new Predator(className, def, x, y);
    predator.state        = opts.state || (alertActive ? "hunt" : "wander");
    predator.speciesName  = speciesName;
    predator.className    = className;
    predator.dnaDrops     = classDef.dnaDrops;
    predator.shardDrop    = classDef.shardDrop;
    applySpeciesBody(predator, speciesName);   // its species' body (after this, which sets its size)
    if (typeof setPredatorLevel === "function") setPredatorLevel(predator, Number.isFinite(opts.level) ? opts.level : (typeof creatureLevel === "function" ? creatureLevel() : LEVEL_START), true);
    // Its final speed, so slows scale from the real base rather than from whatever the AI last parked moveSpeed at.
    predator.baseMoveSpeed = predator.moveSpeed;
    initAbility(predator);   // the charge-up special, now that species and class are both known
    actors.push(predator);
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
let _crystalScrollX  = 0;                   // the clone card strip's slide offset (px)

const CSORTS = [
    { id:"species",  label:"SPECIES"  },
    { id:"combat",   label:"COMBAT"   },
    { id:"defense",  label:"DEFENSE"  },
    { id:"hp",       label:"HP"       },
    { id:"specials", label:"SPECIALS" },
];

// THE QUICK RECRUIT. "I would really like a button near the roster, so if the roster is looking slim the user can create a recruit rapidly." It costs RECRUIT_COST shards and a follower comes out at the
// Crystal as it was found: a BRAWLER, a MAGE or a TECHNICIAN (FOLLOWER_TYPES, js/species.js: an even draw of the three) made of one of the elements brought online (an even draw, modulationPick below). The player does
// not choose either, and cannot change them afterwards ("they have their class already and you just have to evolve them to make them better": js/evolution.js); the toast says what came out.
// It is offered in the ROSTER only (the Command Center's roster tab and the phone roster): "that needs to be the only way", so the Crystal menu and the dock have none.
const RECRUIT_COST = 30;
// The type of a recruit that is not asked for one: an even draw of the three.
function recruitDrawType() { return FOLLOWER_TYPE_ORDER[Math.floor(Math.random() * FOLLOWER_TYPE_ORDER.length)]; }
// `type`, `element`: for a test or a scripted recruit; none is a draw.
function recruitFollower(type, element) {
    if (shardCount < RECRUIT_COST) { floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: "NEED " + RECRUIT_COST + " SHARDS", color: "#f44", life: 90, vy: -0.2 }); return false; }
    shardCount -= RECRUIT_COST;
    const t = FOLLOWER_TYPES[type] ? type : recruitDrawType(), e = element && unlockedElements.has(element) ? element : modulationPick() || "fire";
    spawnFollowerAtCrystal(e, t);
    const def = ELEMENTS.find(x => x.id === e);
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: roleLabel(t) + " \u00b7 " + (def ? def.label.toUpperCase() : String(e).toUpperCase()) + " RECRUITED!", color: FOLLOWER_TYPES[t].colour, life: 120, vy: -0.2 });
    return true;
}
// The + RECRUIT button: recruit, and bring the roster up to date.
function recruitDo() {
    const ok = recruitFollower();
    if (typeof ccRender === "function") ccRender();
    if (typeof radialRender === "function") radialRender();
    return ok;
}

// What new followers draw their element from: every element that is online, which is all six from the start (js/facilityplay.js). There is no mix to narrow.
function recruitElementPool() {
    return ELEMENTS.filter(e => unlockedElements.has(e.id)).map(e => e.id);
}
// One element, evenly from those brought online; null when nothing is.
function modulationPick(rnd) {
    const ids = recruitElementPool();
    if (!ids.length) return null;
    return ids[Math.min(ids.length - 1, Math.floor((typeof rnd === "number" ? rnd : Math.random()) * ids.length))];
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


// ── Tab: Clone Bay ────────────────────────────────────────
function _drawClonesTab(PX, PY, PW, PH) {
    // THE MUTATOR'S CLONE IS OUT: the bay is its upgrades (js/mutator.js drawCloneUpgradePanel), not the cards it could grow
    if (typeof mutatorClone === "function" && typeof drawCloneUpgradePanel === "function") {
        const mc = mutatorClone();
        if (mc) { drawCloneUpgradePanel(PX, PY, PW, PH, mc); window._cloneTabOpts = []; window._cloneScrollArrows = null; window._cloneDismissBtn = null; window._cloneTabBounds = { sortY: -1e4, sortH: 0, sortW: 0, listY: PY, listH: 0, listX: PX, listW: 0, rowH: 0, upgrades: true }; return; }
    }
    if (typeof _mxUpBtns !== "undefined") _mxUpBtns = [];
    const sortH = 44, sortW = Math.floor(PW / CSORTS.length);
    CSORTS.forEach((s, i) => uiButton({ x: PX + i * sortW + 4, y: PY + 2, w: sortW - 6, h: sortH - 6 }, s.label, UI_TEAL, crystalCloneSort === s.id, 15));

    // Clone cap indicator (who may clone, when the player's class may not: CLASS_RULES.clone)
    const liveClones = cloneLiveCount(), cap = cloneCap(), _al = cloneAllowed();
    const capAtMax = liveClones >= cap;
    const hdrY = PY + sortH + 4, hdrH = 40;
    if (!_al.ok) uiTextFit(_al.why, PX + 22, hdrY + hdrH / 2, 18, typeof CLASSES !== "undefined" && CLASSES.mutator ? CLASSES.mutator.colour : "#c06bff", "left", PW - 44 - (liveClones > 0 ? 150 : 0));
    else uiText((cap === 1 ? "YOUR CLONE " : "CLONES ") + liveClones + "/" + cap, PX + 22, hdrY + hdrH / 2, 22, capAtMax ? UI_RED : "#fff", "left", false);
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
        const msg = capAtMax ? `Clone cap reached (${cap}/${cap})` : crystalCloneSort==="specials" ? "No clones with special attacks" : "No DNA splices available";
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

// ── GAME INDEX — CLONE SUMMONING (the ? index's clone page, kept for the clones to come) ──
// Generated from CLONE_COSTS and cloneShardCost() in js/species.js, so the table cannot drift from the prices.
function renderCloneCostIndex() {
    if (typeof document === 'undefined') return;
    const host = document.getElementById('cmCloneCosts');
    if (!host) return;
    if (typeof CLONE_COSTS === 'undefined' || typeof cloneShardCost !== 'function') return;
    const cap = typeof cloneCap === 'function' ? cloneCap() : 4, who = typeof cloneWho === 'function' ? cloneWho() : null;
    const natural = ['ant', 'beetle', 'mantis', 'scorpion', 'spider', 'moth'].filter(s => CLONE_COSTS[s]);
    const classes = ['scout', 'striker', 'tank'];   // the classes the bay offers (getCloneOptions)
    let lo = Infinity, hi = 0; for (const s of natural) for (const c of classes) { const p = cloneShardCost(s, c); lo = Math.min(lo, p); hi = Math.max(hi, p); }   // the real range of the table (cloneShardCost clamps it between CLONE_SHARD_MIN and CLONE_SHARD_MAX)
    if (!isFinite(lo)) lo = typeof CLONE_SHARD_MIN === 'number' ? CLONE_SHARD_MIN : 5;
    let rows = '<tr><th>Species</th><th>DNA needed</th>' + classes.map(c => '<th>' + c[0].toUpperCase() + c.slice(1) + '</th>').join('') + '</tr>';
    for (const s of natural) {
        const col = (typeof SPECIES !== 'undefined' && SPECIES[s] && SPECIES[s].color) || '#aaa';
        rows += '<tr><td style="color:' + col + '">' + s[0].toUpperCase() + s.slice(1) + '</td><td>' + CLONE_COSTS[s].splicesNeeded + ' splices</td>' + classes.map(c => '<td>' + cloneShardCost(s, c) + '\u25c6</td>').join('') + '</tr>';
    }
    host.innerHTML =
        '<div class="ctrl-row cm-dim" style="margin-bottom:5px">Spend <strong>DNA splices</strong> (a creature you kill drops them) and <strong>shards</strong> to summon a creature\'s species as your ally: no followers are spent, nothing else is. ' +
        (who ? 'Only a <strong>' + who + '</strong> grows clones, <span class="cm-stat">' + (cap === 1 ? 'one' : cap) + ' at a time</span>; its clone does not come back by itself (its body stays where it fell), and your clone is kept in the save.</div>'
             : 'Up to <span class="cm-stat">' + cap + ' clones</span> at once; a clone that falls comes back at the Crystal after a wait, and your clones are kept in the save.</div>') +
        '<table class="cm-clone-table">' + rows + '</table>' +
        '<div class="ctrl-row cm-dim">Prices run from <span class="cm-stat">' + lo + '\u25c6</span> for the lowest grade to <span class="cm-stat">' + hi + '\u25c6</span>.</div>';
}
