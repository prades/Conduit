// ─────────────────────────────────────────────────────────
//  INFESTATION — what predators do when nobody is fighting them
//
//  Two jobs, both only while undisturbed (no alarm, not provoked, not fighting):
//
//   - A HUNTER (about one predator in four — pred.huntsPylons) walks to your
//     nearest pylon and works it over to its side. A taken pylon is lost until
//     you RECLAIM it; nothing grows on the floor around it any more.
//   - ANY predator picks up charged mass lying on the floor and carries it to
//     its zone's wall nest. Every NEST_SPAWN_COST paid in hatches another
//     predator there.
//
//  REPORTED: "the nests on the ground that the enemy predators create — get rid
//  of those, they are so confusing. Let them grab the charged particles and
//  carry them to the nest on the walls, and another predator spawns." The floor
//  nests, the cocoons spun over taken pylons and their toxin puddles were all
//  removed with this change; the wall nests are the only nests.
// ─────────────────────────────────────────────────────────

// "Undisturbed" is the whole precondition, so it is one function rather than a
// condition repeated at each call site.
//   - an alarm is a fight, so nobody wanders off to garden
//   - a predator that has been hit is provoked and wants the thing that hit it
//   - hunting and attacking already own the frame
function predatorUndisturbed(pred) {
    if (!pred || pred.dead || pred.isClone || pred.team === "green") return false;
    if (typeof alertActive !== "undefined" && alertActive) return false;
    if (pred.provoked) return false;
    if (pred.state === "attack" || pred.state === "hunt" || pred.state === "crawl_in") return false;
    if (pred.currentTarget && !pred.currentTarget.dead) return false;
    return true;
}

// ── Tuning ────────────────────────────────────────────────
const INFEST_SEEK_RANGE    = 14;    // how far a predator will walk to find a pylon
const INFEST_REACH         = 0.95;  // close enough to start working on it
// Per frame in contact. Was 0.0022 — 7.5 seconds — which let a dozen
// predators strip a network inside a minute with no time to notice. At 25
// seconds a conversion is something you can see starting and interrupt, and
// INFEST_DECAY below is six times faster, so interrupting genuinely saves it.
const INFEST_RATE          = 0.00067;// per frame in contact — about 25s to convert
const INFEST_DECAY         = 0.004; // per frame once nobody is working on it
const INFEST_RESCAN_FRAMES = 45;    // how often a predator looks for a new target

// "Nests are occurring too often." The rate above was not the problem — the
// SYNCHRONISATION was. Every predator gardened at the same flat rate, and they
// all started on the same frame, because the thing that stops them gardening
// stops for everybody at once: alertActive is global, so the frame an alarm
// clears is the frame every wanderer in every zone takes up gardening again.
// Identical start, identical rate, identical finish. Measured at wave 8: four
// nests grew inside 142 frames and five inside ten seconds, after twenty-five
// seconds of nothing at all. That reads as the map sprouting nests.
//
// So a predator settles back into gardening at its own pace after any
// disturbance, and works at its own speed once it does. The pace range is
// centred on 1.0, so the documented 25-second conversion is still the average.
const INFEST_SETTLE_MIN    = 240;   // 4s before the calmest goes back to work
const INFEST_SETTLE_MAX    = 1080;  // and up to 18s for the most rattled
const INFEST_PACE_MIN      = 0.8;   // its own rate, so two never finish together
const INFEST_PACE_MAX      = 1.2;

// How long a predator waits before gardening again, and how fast it works.
// Rolled on disturbance and at spawn. NOT rolled lazily on first use: a
// predator with no history at all gardens immediately, which is what a
// hand-placed one in a test means and what a lone wanderer should do.
function rollInfestSettle(pred) {
    if (!pred) return;
    pred._infestSettle = INFEST_SETTLE_MIN
        + Math.floor(Math.random() * (INFEST_SETTLE_MAX - INFEST_SETTLE_MIN));
    pred._infestPace = INFEST_PACE_MIN + Math.random() * (INFEST_PACE_MAX - INFEST_PACE_MIN);
}

// A cocoon encapsulates a small square around the pylon it holds — it starts
// as a 2x2 and swells to 3x3. It is a structure, not a creeping patch: the
// first version crept tile by tile up to fourteen tiles across a 3.2 radius,
// which read as a carpet of mould rather than something spun over the pylon.
// ── Finding something to infest ───────────────────────────
// Green pylons first and foremost — that is the point. A dormant grey pylon is
// still yours, so it counts; a generator counts too.
//
// Only HUNTERS look (pred.huntsPylons, about one predator in four); everything
// else leaves your pylons alone. A pylon that is on and hurting a predator is
// dealt with by the bash in Predator.update (pylonAggro), not by this search.
function nearestGreenPylonFor(pred) {
    if (!pred || !pred.huntsPylons || pred.isTutorialFoe) return null;
    let best = null, bestD = INFEST_SEEK_RANGE;
    for (const t of world) {
        if (!t.pillar || t.destroyed || t.health <= 0) continue;
        if (t.pillarTeam !== "green") continue;
        const d = Math.hypot(t.x - pred.x, t.y - pred.y);
        if (d < bestD) { bestD = d; best = t; }
    }
    return best;
}

function _infestTargetStillGood(pred, t) {
    if (!t || !t.pillar || t.destroyed || t.health <= 0) return false;
    if (t.pillarTeam !== "green") return false;
    return Math.hypot(t.x - pred.x, t.y - pred.y) <= INFEST_SEEK_RANGE + 4;
}

// ── FETCHING MASS FOR THE WALL NEST ───────────────────────
// "Have them search for the particles whenever they're not doing anything. If
// they find some, they collect it and bring it over, just like the followers
// bring the shards to the crystal." A predator walks to the nearest lump, picks
// it up and carries it to its zone's wall nest. Nothing about the lump has to
// be done to it first — it is their own kind of matter, so the electric
// worker's neutralising step is something only the player's side pays.
//
// The lump is CONSUMED on pickup and the predator carries its VALUE. Carrying
// it as a hauled lump the way a follower does would have let a predator launder
// a charged one: the follower code turns a dropped carried lump into a NEUTRAL
// one, which skips the neutralise step entirely. A number cannot be laundered.
const NEST_FETCH_RANGE = 14;    // how far it will go for a lump

function _nearestLumpFor(pred) {
    if (typeof chargedMass === "undefined") return null;
    let best = null, bestD = NEST_FETCH_RANGE;
    for (const m of chargedMass) {
        if (m.carrier) continue;
        const d = Math.hypot(m.x - pred.x, m.y - pred.y);
        if (d < bestD) { bestD = d; best = m; }
    }
    return best;
}

function _predatorWalk(pred, tx, ty, speed) {
    const dx = tx - pred.x, dy = ty - pred.y, d = Math.hypot(dx, dy);
    if (d > 0.0001) {
        pred.x += (dx / d) * pred.moveSpeed * speed;
        pred.y += (dy / d) * pred.moveSpeed * speed;
        if (typeof faceToward === "function") faceToward(pred, tx, ty, 0.12);
        pred.walkCycle += pred.moveSpeed * 40;
        pred.lastX = pred.x; pred.lastY = pred.y;
    }
    return d;
}

// Put whatever it is carrying back on the ground. Called when it is pulled into
// a fight and when it dies, so a predator cannot take a lump out of play by
// being killed with it in its arms.
function predatorDropNestMass(pred) {
    if (!pred || !(pred.nestMass > 0)) { if (pred) { pred._nestSite = null; pred._nestTarget = null; } return 0; }
    const site = pred._nestSite;
    if (site) site.incoming = Math.max(0, site.incoming - pred.nestMass);
    const v = pred.nestMass;
    pred.nestMass = 0; pred._nestSite = null; pred._nestTarget = null;
    if (typeof spawnChargedMass === "function") spawnChargedMass(pred.x, pred.y, v);
    return v;
}

// One frame of it. Returns true when it has claimed the frame.
// THE WALL NEST IS FED. "They will grab the charged particles on the ground and
// carry them to the nest on the walls, and if they retrieve a certain amount
// another predator will spawn." A predator with nothing better to do picks up
// the nearest lump of charged mass, walks it to its zone's live wall nest and
// pays it in. Every NEST_SPAWN_COST paid in hatches one more predator of the
// carrier's kind at that nest. Mass only drops from dead predators, so this is
// the enemy recycling its dead — and hauling it away first is how you deny it.
const NEST_SPAWN_COST = 20;   // mass paid into a wall nest per predator it hatches
function _wallNestFor(pred) {
    const list = (typeof _nestCache !== "undefined" && _nestCache.length) ? _nestCache : world;
    let best = null, bestD = NEST_FETCH_RANGE * 2;
    for (const t of list) {
        if (!t.nest || t._infestNest || !(t.nestHealth > 0)) continue;
        if (typeof isHomePortal === "function" && isHomePortal(t)) continue;
        const d = Math.hypot(t.x - pred.x, t.y - pred.y);
        if (d < bestD) { bestD = d; best = t; }
    }
    return best;
}
function _spawnPredatorAt(species, className, x, y) {
    if (typeof Predator === "undefined" || typeof SPECIES === "undefined") return null;
    const speciesDef = SPECIES[species] ||
                       (typeof SYNTHETIC_SPECIES !== "undefined" ? SYNTHETIC_SPECIES[species] : null);
    if (!speciesDef) return null;
    const classDef = typeof getClassDef === "function" ? getClassDef(speciesDef, className) : speciesDef[className];
    if (!classDef) return null;
    const def = {
        width: classDef.width, height: classDef.height,
        moveSpeed: classDef.moveSpeed, health: classDef.health, power: classDef.power,
        color: speciesDef.color,
        reactionSpeed: classDef.reactionSpeed ?? 15,
        abdomenAttack: classDef.abdomenAttack ?? false,
        rangeDamage: classDef.rangeDamage ?? 0,
        abdomenCooldown: classDef.abdomenCooldown ?? 90,
    };
    const p = new Predator(className, def, x, y);
    p.speciesName = species; p.className = className;
    p.dnaDrops = classDef.dnaDrops; p.shardDrop = classDef.shardDrop;
    p.state = "wander"; p.entryDelay = 0;
    if (typeof applySpeciesBody === "function") applySpeciesBody(p, species);
    // Its zone's depth (tougher and bigger past zone 12), like every predator.
    if (typeof applyDeepZone === "function" && typeof getZoneIndex === "function") applyDeepZone(p, getZoneIndex(Math.floor(x)));
    p.baseMoveSpeed = p.moveSpeed;
    if (typeof initAbility === "function") initAbility(p);
    actors.push(p);
    return p;
}
// Pay mass into a wall nest; hatch one predator per NEST_SPAWN_COST. If the map
// is already at its predator ceiling the stock waits rather than being lost.
function payIntoWallNest(nest, amount, pred) {
    nest.massStock = (nest.massStock || 0) + amount;
    let hatched = 0;
    while (nest.massStock >= NEST_SPAWN_COST) {
        if (typeof predatorBudgetFull === "function" && predatorBudgetFull()) break;
        // What hatches is the LESSER tier: a beetle's haul makes ants.
        const sp = typeof lesserSpecies === "function" ? lesserSpecies(pred ? pred.speciesName || "ant" : "ant") : "ant";
        const p = _spawnPredatorAt(sp, "scout", nest.x, Math.max(0, nest.y + 1));
        if (!p) break;
        p.fromNestMass = true;
        nest.massStock -= NEST_SPAWN_COST;
        hatched++;
        elementEffects.push({ type: "impact", x: nest.x, y: nest.y + 1, color: "#ff5533", radius: 0.6, life: 26 });
        floatingTexts.push({ x: nest.x, y: nest.y, color: "#ff5533", life: 110, vy: -0.14, size: 12,
                             text: "A PREDATOR HATCHED" });
    }
    if (!hatched) floatingTexts.push({ x: nest.x, y: nest.y, color: "#ff9966", life: 80, vy: -0.14, size: 11,
                                       text: "NEST " + Math.floor(nest.massStock) + "/" + NEST_SPAWN_COST });
    return hatched;
}
function nestFetchTick(pred) {
    // Only the HAULERS carry: zone 2's beetles (js/broods.js).
    if (pred.isTutorialFoe || !pred.hauler) return false;
    // Carrying: take it to the wall nest.
    if (pred.nestMass > 0) {
        const nest = pred._nestTarget;
        if (!nest || !nest.nest || !(nest.nestHealth > 0)) { predatorDropNestMass(pred); return false; }
        // The nest is in the wall: it is reached from the floor row in front.
        const d = _predatorWalk(pred, nest.x, Math.max(0, nest.y + 1), 0.7);   // heavier than an empty walk
        if (d > INFEST_REACH) return true;
        const v = pred.nestMass;
        pred.nestMass = 0; pred._nestTarget = null;
        payIntoWallNest(nest, v, pred);
        return true;
    }
    // Empty-handed: a live wall nest to feed, and a lump to feed it with.
    const nest = _wallNestFor(pred);
    if (!nest) return false;
    const lump = _nearestLumpFor(pred);
    if (!lump) return false;
    const d = _predatorWalk(pred, lump.x, lump.y, 0.9);
    if (d > 0.7) return true;
    const at = chargedMass.indexOf(lump);
    if (at < 0 || lump.carrier) return true;      // someone else got there first
    chargedMass.splice(at, 1);
    pred.nestMass = lump.value;
    pred._nestTarget = nest;
    return true;
}

// ── The predator's frame ──────────────────────────────────
// Returns true when it has claimed the frame, the same contract abilityTick and
// workerTick use.
function infestTick(pred) {
    if (!predatorUndisturbed(pred)) {
        // Dropping the target on the way out means a predator pulled into a
        // fight does not silently resume gardening the instant it is over.
        pred.infestTarget = null;
        // A fight takes the lump out of its arms. It lands where it stands, and
        // is the player's to haul again.
        predatorDropNestMass(pred);
        // And it now has to settle before it goes back to work. This is the
        // line that breaks the burst: an alarm ends for every predator on the
        // same frame, so without it they all resume together.
        rollInfestSettle(pred);
        return false;
    }
    if (pred._infestSettle > 0) { pred._infestSettle--; return false; }
    // Mass for a nest comes before gardening: a site that is waiting on it is
    // the thing gardening produced, and the point of it.
    if (nestFetchTick(pred)) return true;
    // Cached, because the scan walks the whole world. A cached null is a real
    // answer — there may simply be no pylon of yours left standing nearby.
    const fresh = pred._infestScanFrame !== undefined &&
                  frame - pred._infestScanFrame < INFEST_RESCAN_FRAMES;
    if (!fresh || !_infestTargetStillGood(pred, pred.infestTarget)) {
        pred._infestScanFrame = frame;
        pred.infestTarget = nearestGreenPylonFor(pred);
    }
    const t = pred.infestTarget;
    if (!t) return false;   // nothing to do — fall through to ordinary wandering

    const dx = t.x - pred.x, dy = t.y - pred.y;
    // NOT `|| 1`. That guard was there to avoid dividing by zero, but zero is
    // falsy, so a predator standing exactly on the pylon got dist = 1, which is
    // past INFEST_REACH — it took the walk branch, moved nowhere (dx/dist is 0)
    // and never converted. A deadlock at distance zero. The division only
    // happens inside the branch below, which needs dist > INFEST_REACH, so it
    // cannot divide by zero anyway.
    const dist = Math.hypot(dx, dy);
    if (dist > INFEST_REACH) {
        pred.x += (dx / dist) * pred.moveSpeed * 0.8;   // an unhurried walk
        pred.y += (dy / dist) * pred.moveSpeed * 0.8;
        if (typeof faceToward === "function") faceToward(pred, t.x, t.y, 0.12);
        pred.walkCycle += pred.moveSpeed * 40;
        pred.lastX = pred.x; pred.lastY = pred.y;
        return true;
    }

    // In contact — work on it.
    if (typeof faceToward === "function") faceToward(pred, t.x, t.y, 0.2);
    t.converting = true;
    t.convertProgress = (t.convertProgress || 0) + INFEST_RATE * (pred._infestPace || 1);
    t._convertFrame = frame;
    if (t.convertProgress >= 1) convertPylonToRed(t, pred);
    return true;
}

// Conversion is not a ratchet: the moment nobody is working on a pylon it
// recovers, so interrupting a predator actually saves the pylon.
function decayConversions() {
    for (const t of world) {
        if (!t.converting) continue;
        if (t._convertFrame === frame) continue;   // still being worked on
        t.convertProgress = (t.convertProgress || 0) - INFEST_DECAY;
        if (t.convertProgress <= 0) { t.convertProgress = 0; t.converting = false; }
    }
}

// ── Taking the pylon ──────────────────────────────────────
function convertPylonToRed(t, pred) {
    // Out of the firing and wave lists NOW: a taken pylon used to keep shooting
    // (as a core turret) and keep its zone until the next 60-frame rebuild.
    if (typeof _cacheAge !== "undefined") _cacheAge = -9999;
    t.pillarTeam = "red";
    t.pillarCol  = "#ff3344";
    // Remembered: the grub eats pylons that were taken from you, never the
    // enemy's own (js/broods.js).
    t.takenFromPlayer = true;
    t.converting = false;
    t.convertProgress = 0;
    // It stops working for you: no turret, no wave zone, no generator duty.
    t.attackMode = false; t.waveMode = false;
    t.attackModeElement = null; t.attackModeColor = null;
    t.isGenerator = false; t.isConnector = false;
    t.upgraded = false;
    // Any nest link through it is severed, both ways.
    if (t.nestConnection) { t.nestConnection.connectedPylon = null; t.nestConnection = null; }
    for (const obj of world) if (obj.connectedPylon === t) obj.connectedPylon = null;

    floatingTexts.push({ x: t.x, y: t.y - 1.2, text: "PYLON LOST", color: "#ff4444",
                         life: 140, vy: -0.22, size: 12 });
    if (typeof shake !== "undefined") shake = Math.max(shake, 5);

    // A taken pylon no longer grows a nest or a cocoon on the floor beside it.
    // REPORTED: "the nests on the ground that the enemy predators create — get
    // rid of those, they are so confusing." Predators grow their numbers at the
    // WALL nests instead, with the charged mass they carry there (nestFetchTick).
}

function drawPredatorNestMass(pred, px, py) {
    if (!pred || !(pred.nestMass > 0)) return;
    const bob = Math.sin((frame || 0) * 0.15) * 2;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.shadowColor = "#ffee33"; ctx.shadowBlur = 8;
    ctx.fillStyle = "#ffdd44";
    ctx.beginPath(); ctx.arc(px, py - 42 + bob, 4, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#1a1206"; ctx.font = "bold 6px monospace"; ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(pred.nestMass), px, py - 42 + bob + 0.5);
    ctx.restore();
}


function _infestToScreen(wx, wy) {
    return [
        (wx - player.visualX - (wy - player.visualY)) * TILE_W + canvas.width  / 2,
        (wx - player.visualX + (wy - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H,
    ];
}


function drawConversionBars() {
    for (const t of world) {
        if (!t.converting || !(t.convertProgress > 0)) continue;
        const sx = (t.x - player.visualX - (t.y - player.visualY)) * TILE_W + canvas.width  / 2;
        const sy = (t.x - player.visualX + (t.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H;
        if (sx < -60 || sx > canvas.width + 60) continue;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        const w = 26, h = 4, bx = sx - w / 2, by = sy - 68;
        ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);
        ctx.fillStyle = "#3a1015"; ctx.fillRect(bx, by, w, h);
        ctx.fillStyle = "#ff4455"; ctx.fillRect(bx, by, w * Math.min(1, t.convertProgress), h);
        ctx.fillStyle = "#ff8899"; ctx.font = "bold 7px monospace"; ctx.textAlign = "center";
        ctx.fillText("INFESTING", sx, by - 3);
        ctx.restore();
    }
}
