// ─────────────────────────────────────────────────────────
//  INFESTATION — what predators do when nobody is fighting them
//
//  Left undisturbed, a predator does not just wander. It walks to the nearest
//  pylon you hold, chews it over to its own side, and then seeds the ground
//  around it: a nest, and a cocoon spun over the pylon. Both are small silk
//  sacs — they hatch more of the same species, and the cocoon's footprint
//  swells to a small square, taking any pylon that ends up inside it, so a
//  neglected stretch of the map turns into a nursery.
//
//  The counter is the pylon itself. Reclaim it and everything anchored to it
//  dies with it — see clearInfestationAt(), called from the reconstruction
//  completion in game.js. Without that the mechanic would be a one-way ratchet.
// ─────────────────────────────────────────────────────────

// "Undisturbed" is the whole precondition, so it is one function rather than a
// condition repeated at each call site.
//   - an alarm is a fight, so nobody wanders off to garden
//   - a predator that has been hit is provoked and wants the thing that hit it
//   - hunting and attacking already own the frame
function predatorUndisturbed(pred) {
    if (!pred || pred.dead || pred.isClone || pred.team === "green") return false;
    // A predator that HATCHED from a cocoon never gardens. This is the loop
    // that ran away: a predator converts a pylon, the pylon gets a cocoon, the
    // cocoon hatches predators, and those convert more pylons. Measured at
    // wave 8 after one minute of neglect, 34 of 42 predators on the map had
    // come out of cocoons rather than out of the zones. Cutting this one edge
    // takes the gardening population from the whole swarm back to what the
    // zones themselves spawn.
    if (pred.fromCocoon) return false;
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
const COCOON_SPAN_MIN      = 2;     // starts as a 2x2 block
const COCOON_SPAN_MAX      = 3;     // swells to 3x3 and stops
const COCOON_SWELL_FRAMES  = 420;   // 7s before it widens
const COCOON_SPAWN_FRAMES  = 900;   // one hatch every 15s while it has room
const COCOON_SPAWN_CAP     = 3;     // live spawns a single cocoon will keep out
// And a LIFETIME total. A cocoon used to refill its three live spawns for
// ever, so an unattended site was an endless tap; now it goes inert after this
// many and stops being a reason to hurry.
const COCOON_HATCH_LIMIT   = 4;

// The toxin is NOT automatic. It is the enhancement a cocoon inherits from
// whatever spun it, and only the venomous species carry it — spiders (spinneret
// venom) and scorpions (stinger). Anything else spins a plain cocoon.
const COCOON_TOXIN_SPECIES   = ["spider", "scorpion"];
const COCOON_PUDDLE_INTERVAL = 45;   // frames between bites, as the acid hazard
const COCOON_PUDDLE_DAMAGE   = 3;
const COCOON_PUDDLE_COLOUR   = "#7fdd44";

// What a species' cocoon adds, if anything. One table, so a new enhancement
// later is an entry here rather than a branch somewhere in the growth code.
function cocoonEnhancement(species) {
    return COCOON_TOXIN_SPECIES.includes(species) ? "toxic" : null;
}

let cocoons = [];   // { tiles:[[x,y]], anchors:[tile], species, className, ... }

// ── Finding something to infest ───────────────────────────
// Green pylons first and foremost — that is the point. A dormant grey pylon is
// still yours, so it counts; a generator counts too.
function nearestGreenPylonFor(pred) {
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

// ── The predator's frame ──────────────────────────────────
// Returns true when it has claimed the frame, the same contract abilityTick and
// workerTick use.
function infestTick(pred) {
    if (!predatorUndisturbed(pred)) {
        // Dropping the target on the way out means a predator pulled into a
        // fight does not silently resume gardening the instant it is over.
        pred.infestTarget = null;
        // And it now has to settle before it goes back to work. This is the
        // line that breaks the burst: an alarm ends for every predator on the
        // same frame, so without it they all resume together.
        rollInfestSettle(pred);
        return false;
    }
    if (pred._infestSettle > 0) { pred._infestSettle--; return false; }
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
    t.pillarTeam = "red";
    t.pillarCol  = "#ff3344";
    t.converting = false;
    t.convertProgress = 0;
    // It stops working for you: no turret, no wave zone, no generator duty.
    t.attackMode = false; t.waveMode = false;
    t.attackModeElement = null; t.attackModeColor = null;
    t.isGenerator = false;
    t.upgraded = false;
    // Any nest link through it is severed, both ways.
    if (t.nestConnection) { t.nestConnection.connectedPylon = null; t.nestConnection = null; }
    for (const obj of world) if (obj.connectedPylon === t) obj.connectedPylon = null;

    floatingTexts.push({ x: t.x, y: t.y - 1.2, text: "PYLON LOST", color: "#ff4444",
                         life: 140, vy: -0.22, size: 12 });
    if (typeof shake !== "undefined") shake = Math.max(shake, 5);

    seedNestNear(t, pred);
    seedCocoon(t, pred);
}

// ── The nest ──────────────────────────────────────────────
// One nest per converted pylon, on a clear floor tile beside it. Nests are
// normally one per zone at its centre; these are extra, so they carry the same
// zone index for the spawn bookkeeping but do not displace the original.

// A world-wide floor on how fast nests ARRIVE, which is a different thing from
// how many EXIST. The per-zone cap below already bounds the total, and it was
// being honoured — the five nests measured at wave 8 were in five different
// zones. They still all showed up within ten seconds of each other, because
// nothing paced them. So however many pylons fall at once, a nest grows at most
// once every this often, anywhere on the map. The pylon is still lost and a
// cocoon is still spun; you just do not get a fresh vortex every time.
const NEST_GROW_COOLDOWN = 2700;    // 45s between grown nests, world-wide
let _lastNestGrowFrame = -NEST_GROW_COOLDOWN;   // so the first one is never delayed

function seedNestNear(t, pred) {
    // Already a nest in reach? Then this pylon joins that one's territory.
    for (const obj of world) {
        if (obj.nest && obj.nestHealth > 0 && Math.hypot(obj.x - t.x, obj.y - t.y) < 4) return null;
    }
    // Paced, not just capped.
    const now = typeof frame === "number" ? frame : 0;
    if (now - _lastNestGrowFrame < NEST_GROW_COOLDOWN) return null;
    // And at most ONE grown nest per zone, on top of whatever the zone was
    // generated with. The four-tile guard above only stops them touching:
    // measured at wave 8, zones 1, 2 and 4 each ended up with two, spread far
    // enough apart to satisfy it. A zone is the unit the player thinks in, so
    // it is the unit the cap uses.
    const zone = typeof getZoneIndex === "function" ? getZoneIndex(Math.floor(t.x)) : -1;
    for (const obj of world) {
        if (!obj._infestNest || !obj.nest || obj.nestHealth <= 0) continue;
        const oz = typeof getZoneIndex === "function" ? getZoneIndex(Math.floor(obj.x)) : -2;
        if (oz === zone) return null;
    }
    // Ordered by where the tile lands on screen. Depth here is x+y: a bigger
    // sum draws lower and in front. The first choice used to be (x, y-1),
    // which is a SMALLER sum — so the nest appeared a row above the pylon it
    // belongs to. Below and in front first now, beside second, and above only
    // if there is genuinely nowhere else.
    const spots = [
        [t.x + 1, t.y + 1],                      // +2: clearly in front
        [t.x,     t.y + 1], [t.x + 1, t.y],      // +1: below-left, below-right
        [t.x - 1, t.y + 1], [t.x + 1, t.y - 1],  //  0: beside, same row
        [t.x - 1, t.y],     [t.x,     t.y - 1],  // -1: last resort, above
    ];
    for (const [sx, sy] of spots) {
        const tile = typeof getTile === "function" ? getTile(sx, sy) : null;
        if (!tile || tile.type !== "floor") continue;
        if (tile.pillar || tile.nest || tile.nodeType) continue;
        tile.nest = true;
        tile.nestMaxHealth = tile.nestMaxHealth || 200;
        tile.nestHealth = tile.nestMaxHealth;
        tile.nestZone = typeof getZoneIndex === "function" ? getZoneIndex(Math.floor(tile.x)) : -1;
        tile.nestPulse = 0;
        tile._infestNest = true;    // marks it as grown, not generated
        // Stamped here rather than on entry, so a conversion that finds nowhere
        // to put a nest does not spend the cooldown on nothing.
        _lastNestGrowFrame = now;
        floatingTexts.push({ x: tile.x, y: tile.y - 1, text: "NEST GROWN", color: "#ff7744",
                             life: 120, vy: -0.2 });
        // Hand it to the patch so reclaiming can take it away. Looking for it
        // in the patch's tile list does not work — the nest sits beside the
        // pylon and the cocoon may never creep onto that tile.
        const m = cocoonForAnchor(t);
        if (m) m.nest = tile;
        else   t._pendingNest = tile;
        return tile;
    }
    return null;
}

// ── The cocoon ─────────────────────────────────────────────
function cocoonAt(x, y) {
    for (const m of cocoons) {
        for (const [mx, my] of m.tiles) if (mx === x && my === y) return m;
    }
    return null;
}

function seedCocoon(t, pred) {
    const existing = cocoonForAnchor(t);
    if (existing) return existing;
    const species = (pred && pred.speciesName) || "ant";
    const m = {
        x: t.x, y: t.y,
        span: COCOON_SPAN_MIN,
        tiles: [],
        puddles: [],          // the toxic tile, if this species carries one
        anchors: [t],
        species,
        className: (pred && pred.className) || "scout",
        colour: (pred && pred.color) || "#aa55ff",
        enhancement: cocoonEnhancement(species),
        swellTimer: COCOON_SWELL_FRAMES,
        spawnTimer: COCOON_SPAWN_FRAMES,
        hatchesLeft: COCOON_HATCH_LIMIT,
        spawned: [],
        nest: t._pendingNest || null,
        pulse: Math.random() * Math.PI * 2,
    };
    t._pendingNest = null;
    cocoons.push(m);
    m.tiles = _cocoonFootprint(m, m.span);
    _applyEnhancement(m);
    return m;
}

// A toxic cocoon seeps onto ONE tile beside the pylon it holds, rather than
// welling up all over the footprint.
function _applyEnhancement(m) {
    if (m.enhancement !== "toxic") { m.puddles = []; return; }
    if (m.puddles.length > 0) return;
    const beside = m.tiles.filter(([tx, ty]) => !(tx === m.x && ty === m.y));
    if (beside.length === 0) return;
    m.puddles = [beside[Math.floor(Math.random() * beside.length)]];
}

// The square footprint of a cocoon: `span` tiles on a side, offset so the
// anchor pylon sits inside it. Only real floor counts, so a cocoon against a
// wall is simply smaller rather than hanging off the edge of the deck.
function _cocoonFootprint(m, span) {
    const x0 = m.x - Math.floor((span - 1) / 2);
    const y0 = m.y - Math.floor((span - 1) / 2);
    const out = [];
    for (let dx = 0; dx < span; dx++) {
        for (let dy = 0; dy < span; dy++) {
            const tx = x0 + dx, ty = y0 + dy;
            const tile = typeof getTile === "function" ? getTile(tx, ty) : null;
            if (!tile || tile.type !== "floor") continue;
            if (tx === m.x && ty === m.y) { out.push([tx, ty]); continue; }
            const other = cocoonAt(tx, ty);
            if (other && other !== m) continue;   // another cocoon already has it
            out.push([tx, ty]);
        }
    }
    return out;
}

function cocoonForAnchor(t) {
    return cocoons.find(m => m.anchors.includes(t)) || null;
}

// A cocoon does not creep — it swells once, from a 2x2 to a 3x3, and stops.
// Widening can bring another of your pylons inside the shell, which is how one
// cocoon ends up holding more than one.
function _swellCocoon(m) {
    if (m.span >= COCOON_SPAN_MAX) return;
    m.span++;
    m.tiles = _cocoonFootprint(m, m.span);
    _applyEnhancement(m);
    for (const t of world) {
        if (!t.pillar || t.destroyed || t.health <= 0) continue;
        if (t.pillarTeam !== "green") continue;
        if (m.anchors.includes(t)) continue;
        if (!m.tiles.some(([tx, ty]) => tx === t.x && ty === t.y)) continue;
        // Claimed BEFORE converting: convertPylonToRed seeds a cocoon, and
        // seedCocoon only recognises an existing one by its anchors.
        m.anchors.push(t);
        convertPylonToRed(t, { speciesName: m.species, className: m.className, color: m.colour });
    }
}

// Hatch one of the species that spun this cocoon.
function _hatchFromCocoon(m) {
    // Spent cocoons are inert. The live cap below limits how many are out at
    // once; this limits how many a single site ever produces.
    if (!(m.hatchesLeft > 0)) return;
    m.spawned = m.spawned.filter(p => p && !p.dead);
    if (m.spawned.length >= COCOON_SPAWN_CAP) return;
    // And the MAP's ceiling, not just this cocoon's. Capping the zone spawner
    // alone left this path free to run past it — measured at 27 alive against
    // a cap of 24. The hatch is not spent, only deferred: hatchesLeft is
    // untouched, so the cocoon still owes what it owed once there is room.
    if (typeof predatorBudgetFull === "function" && predatorBudgetFull()) return;
    if (typeof Predator === "undefined" || typeof SPECIES === "undefined") return;
    const speciesDef = SPECIES[m.species] ||
                       (typeof SYNTHETIC_SPECIES !== "undefined" ? SYNTHETIC_SPECIES[m.species] : null);
    if (!speciesDef) return;
    const classDef = typeof getClassDef === "function"
        ? getClassDef(speciesDef, m.className)
        : speciesDef[m.className];
    if (!classDef) return;

    const [sx, sy] = m.tiles[Math.floor(Math.random() * m.tiles.length)];
    const def = {
        width: classDef.width, height: classDef.height,
        moveSpeed: classDef.moveSpeed, health: classDef.health, power: classDef.power,
        color: speciesDef.color,
        reactionSpeed: classDef.reactionSpeed ?? 15,
        abdomenAttack: classDef.abdomenAttack ?? false,
        rangeDamage: classDef.rangeDamage ?? 0,
        abdomenCooldown: classDef.abdomenCooldown ?? 90,
    };
    const p = new Predator(m.className, def, sx, sy);
    p.speciesName = m.species; p.className = m.className;
    p.dnaDrops = classDef.dnaDrops; p.shardDrop = classDef.shardDrop;
    p.state = "wander";
    p.entryDelay = 0;
    p.fromCocoon = true;
    if (typeof applySpeciesBody === "function") applySpeciesBody(p, m.species);
    p.baseMoveSpeed = p.moveSpeed;
    if (typeof initAbility === "function") initAbility(p);
    actors.push(p);
    m.spawned.push(p);
    m.hatchesLeft--;
    elementEffects.push({ type: "impact", x: sx, y: sy, color: m.colour, radius: 0.5, life: 22 });
}

// Who a puddle bites. Followers and the neutral recruits you have not picked up
// yet, and nothing else: predators are Predator instances (which covers your
// clones too), and the player is not in actors[] at all.
//
// FIRE is the exception. Burning this stuff back is its job (see scourStep), so
// the toxin is no trouble to it — which is what makes a fire follower the right
// one to send rather than merely an available one.
function puddleAffects(a) {
    if (!a || a.dead) return false;
    if (typeof Predator !== "undefined" && a instanceof Predator) return false;
    if (a.isFollower && a.element === SCOUR_ELEMENT) return false;
    // NOT recruits, any more. This used to name them outright, and it was the
    // single largest source of damage to a recruit walking in — every hit
    // measured on a recruit over a minute of a busy wave 8 came from here. A
    // recruit cannot fight, cannot be ordered and has no element yet, so a
    // toxin patch on its route was a coin toss it had no part in.
    return !!a.isFollower;
}

function _puddleTick() {
    if (frame % COCOON_PUDDLE_INTERVAL !== 0) return;
    for (const m of cocoons) {
        for (const [px, py] of m.puddles) {
            for (const a of actors) {
                if (!puddleAffects(a)) continue;
                if (Math.abs(a.x - px) >= 0.8 || Math.abs(a.y - py) >= 0.8) continue;
                applyDamage(a, COCOON_PUDDLE_DAMAGE, null, "toxic");
                floatingTexts.push({ x: a.x, y: a.y, text: "TOXIC",
                                     color: COCOON_PUDDLE_COLOUR, life: 28, vy: -0.05 });
            }
        }
    }
}

// ── SCOURING — what a FIRE worker burns back ───────────────
//
// The infestation used to be a one-way ratchet with exactly one counter:
// reclaim the pylon and everything anchored to it dies. That is still the way
// to get the pylon back, but it left the growth itself untouchable — a toxin
// patch sat there biting your squad and there was nothing to do about it short
// of a reconstruction.
//
// So FIRE gets a work job. A fire follower on worker duty walks to the nearest
// piece of growth and burns it off. Deliberately unhurried: the slowest of the
// three takes fifteen seconds, which is one hatch cycle, so a single scourer
// roughly holds a cocoon even and two of them gain ground. It cleans the mess;
// it does not take the pylon back. Those stay separate jobs.
const SCOUR_ELEMENT       = "fire";
const SCOUR_PUDDLE_FRAMES = 150;    // 2.5s — the quickest, being what hurts you now
const SCOUR_COCOON_FRAMES = 900;    // 15s, matching COCOON_SPAWN_FRAMES
// A nest used to take 1500 frames — twenty-five seconds, the longest chore on
// the list, longer even than the cocoon. That was the wrong way round. A grown
// nest is surface growth on a floor tile and it is the thing actively minting
// predators, so it is what you most want a fire crew to be good at; the cocoon
// is wrapped around a pylon and stays the long job. At 600 frames one worker
// clears a nest in ten seconds and two do it in five, which is the crew being
// worth having.
const SCOUR_NEST_FRAMES   = 600;    // 10s for a full-health grown nest
const SCOUR_COLOUR        = "#ff7722";

// Ranked by how much harm the thing is doing right now rather than by distance:
// a toxin patch is eating the squad, a grown nest is minting predators, a
// cocoon is doing both but more slowly. Distance only breaks a tie within a
// rank, so a worker never walks past a puddle to get to a cocoon.
const SCOUR_RANK = { puddle: 0, nest: 1, cocoon: 2 };

function nearestScourChore(x, y, maxDist) {
    const reach = maxDist === undefined ? INFEST_SEEK_RANGE : maxDist;
    let best = null, bestRank = 99, bestD = Infinity;
    const consider = (kind, tx, ty, extra) => {
        const rank = SCOUR_RANK[kind];
        if (rank > bestRank) return;
        const d = Math.hypot(tx - x, ty - y);
        if (d > reach) return;
        if (rank === bestRank && d >= bestD) return;
        bestRank = rank; bestD = d;
        best = Object.assign({ kind, x: tx, y: ty }, extra);
    };
    for (const m of cocoons) {
        for (const [px, py] of (m.puddles || [])) consider("puddle", px, py, { cocoon: m });
        consider("cocoon", m.x, m.y, { cocoon: m });
    }
    // Only the nests an infestation GREW. A zone nest is a fight, not a chore,
    // and sending the work crew to chew on one would quietly replace the
    // destroy_nest order the player gives by hand.
    if (typeof world !== "undefined") {
        for (const t of world) {
            if (!t._infestNest || !t.nest || t.nestHealth <= 0) continue;
            consider("nest", t.x, t.y, { tile: t });
        }
    }
    return best;
}

// A cached chore has to be re-validated: another worker may have finished it,
// or the player may have reclaimed the pylon out from under it.
function scourChoreStillGood(c) {
    if (!c) return false;
    if (c.kind === "puddle") return !!(c.cocoon && cocoons.includes(c.cocoon) && c.cocoon.puddles.length > 0);
    if (c.kind === "cocoon") return !!(c.cocoon && cocoons.includes(c.cocoon));
    if (c.kind === "nest")   return !!(c.tile && c.tile.nest && c.tile.nestHealth > 0 && c.tile._infestNest);
    return false;
}

// Put a grown nest out. Shared with clearInfestationAt so a nest cannot be
// half-killed by one path and left drawable by the other.
function _killGrownNest(tile) {
    if (!tile || !tile._infestNest) return false;
    tile.nest = false;
    tile.nestHealth = 0;
    tile._infestNest = false;
    return true;
}

// One frame of burning, from one worker. Progress is kept on the thing being
// burnt rather than on the worker, so two scourers on the same chore add up and
// a worker that dies partway does not take the progress with it.
// Returns true on the frame the chore is finished.
function scourStep(chore) {
    if (!scourChoreStillGood(chore)) return false;

    if (chore.kind === "puddle") {
        const m = chore.cocoon;
        m.puddleBurn = (m.puddleBurn || 0) + 1 / SCOUR_PUDDLE_FRAMES;
        if (m.puddleBurn < 1) return false;
        m.puddles = [];
        m.puddleBurn = 0;
        // The enhancement goes with it, or the next swell calls
        // _applyEnhancement and seeps a fresh patch straight back out.
        m.enhancement = null;
        floatingTexts.push({ x: chore.x, y: chore.y - 0.6, text: "TOXIN BURNED OFF",
                             color: SCOUR_COLOUR, life: 70, vy: -0.12 });
        return true;
    }

    if (chore.kind === "nest") {
        const t = chore.tile;
        const per = (t.nestMaxHealth || 200) / SCOUR_NEST_FRAMES;
        t.nestHealth = Math.max(0, t.nestHealth - per);
        if (t.nestHealth > 0) return false;
        _killGrownNest(t);
        if (typeof saveNests === "function") saveNests();
        floatingTexts.push({ x: chore.x, y: chore.y - 1, text: "NEST BURNED OUT",
                             color: SCOUR_COLOUR, life: 90, vy: -0.16 });
        return true;
    }

    // The cocoon. Burning the shell open stops it hatching, but the pylon it
    // encapsulates stays red — scouring is not a substitute for reclaiming.
    const m = chore.cocoon;
    m.shellBurn = (m.shellBurn || 0) + 1 / SCOUR_COCOON_FRAMES;
    if (m.shellBurn < 1) return false;
    const at = cocoons.indexOf(m);
    if (at >= 0) cocoons.splice(at, 1);
    floatingTexts.push({ x: chore.x, y: chore.y - 1, text: "COCOON BURNED OPEN",
                         color: SCOUR_COLOUR, life: 100, vy: -0.18 });
    if (typeof shake !== "undefined") shake = Math.max(shake, 3);
    return true;
}

// A patch only lives while it still holds a pylon. Reclaim them all and it dies.
function _cocoonStillHeld(m) {
    m.anchors = m.anchors.filter(t => t && t.pillar && t.pillarTeam === "red" && !t.destroyed);
    return m.anchors.length > 0;
}

function updateInfestation() {
    decayConversions();
    _puddleTick();
    for (let i = cocoons.length - 1; i >= 0; i--) {
        const m = cocoons[i];
        if (!_cocoonStillHeld(m)) { cocoons.splice(i, 1); continue; }
        if (m.span < COCOON_SPAN_MAX && --m.swellTimer <= 0) {
            m.swellTimer = COCOON_SWELL_FRAMES; _swellCocoon(m);
        }
        if (--m.spawnTimer <= 0) { m.spawnTimer = COCOON_SPAWN_FRAMES; _hatchFromCocoon(m); }
    }
}

// Called when the player takes a pylon back. Everything anchored only to that
// pylon goes with it — that is the counter to the whole mechanic.
function clearInfestationAt(t) {
    if (!t) return;
    t.converting = false; t.convertProgress = 0;
    for (let i = cocoons.length - 1; i >= 0; i--) {
        const m = cocoons[i];
        const at = m.anchors.indexOf(t);
        if (at >= 0) m.anchors.splice(at, 1);
        if (m.anchors.length === 0) {
            // Take the grown nest with it, so reclaiming really does clear the
            // ground rather than leaving a spawner behind.
            _killGrownNest(m.nest);
            cocoons.splice(i, 1);
        }
    }
    // A nest whose cocoon is already gone — burned open by a fire worker. It is
    // found by looking beside the pylon rather than by a stored reference, so it
    // still works after a refresh, and it is only taken if no surviving cocoon
    // still claims it (a patch holding two pylons must keep its nest when only
    // one of them is reclaimed).
    const orphan = _grownNestBeside(t);
    if (orphan && !cocoons.some(m => m.nest === orphan)) _killGrownNest(orphan);
}

// The grown nest belonging to a pylon: one of the tiles seedNestNear would have
// put it on.
function _grownNestBeside(t) {
    if (!t || typeof getTile !== "function") return null;
    for (const [dx, dy] of [[1,1],[0,1],[1,0],[-1,1],[1,-1],[-1,0],[0,-1]]) {
        const tile = getTile(t.x + dx, t.y + dy);
        if (tile && tile._infestNest && tile.nest) return tile;
    }
    return null;
}

// ── Persistence ───────────────────────────────────────────
function serialiseCocoons() {
    return cocoons.map(m => ({
        x: m.x, y: m.y, tiles: m.tiles.map(([a, b]) => [a, b]),
        puddles: (m.puddles || []).map(([a, b]) => [a, b]),
        anchors: m.anchors.map(t => [t.x, t.y]),
        species: m.species, className: m.className, colour: m.colour,
        span: m.span, enhancement: m.enhancement,
        swellTimer: m.swellTimer, spawnTimer: m.spawnTimer,
        hatchesLeft: m.hatchesLeft,
        // Scour progress, so a refresh does not undo a worker's shift.
        shellBurn: m.shellBurn || 0, puddleBurn: m.puddleBurn || 0,
        nest: m.nest ? [m.nest.x, m.nest.y] : null,
    }));
}

function restoreCocoons(data) {
    cocoons.length = 0;
    if (!Array.isArray(data)) return;
    for (const d of data) {
        if (!d) continue;
        const anchors = [];
        for (const a of (d.anchors || [])) {
            const tile = typeof getTile === "function" ? getTile(a[0], a[1]) : null;
            if (tile && tile.pillar) anchors.push(tile);
        }
        if (anchors.length === 0) continue;   // nothing holds it up any more
        cocoons.push({
            x: d.x, y: d.y,
            tiles: [],       // recomputed from the span below
            puddles: [],
            anchors,
            species: d.species || "ant", className: d.className || "scout",
            colour: d.colour || "#aa55ff",
            span: d.span || COCOON_SPAN_MIN,
            enhancement: d.enhancement !== undefined ? d.enhancement : cocoonEnhancement(d.species || "ant"),
            swellTimer: d.swellTimer || COCOON_SWELL_FRAMES,
            spawnTimer: d.spawnTimer || COCOON_SPAWN_FRAMES,
            // A save written before cocoons burned out carries no count. It
            // gets a fresh allowance rather than an unlimited one.
            hatchesLeft: Number.isFinite(d.hatchesLeft)
                ? Math.max(0, Math.min(COCOON_HATCH_LIMIT, d.hatchesLeft))
                : COCOON_HATCH_LIMIT,
            shellBurn: Number.isFinite(d.shellBurn) ? Math.min(1, Math.max(0, d.shellBurn)) : 0,
            puddleBurn: Number.isFinite(d.puddleBurn) ? Math.min(1, Math.max(0, d.puddleBurn)) : 0,
            spawned: [],
            nest: (d.nest && typeof getTile === "function") ? getTile(d.nest[0], d.nest[1]) : null,
            pulse: Math.random() * Math.PI * 2,
        });
        // Footprint and toxin come from the span, not from whatever was saved:
        // a session written before the cocoon rework holds a creeping-era
        // patch of up to fourteen scattered tiles, and restoring that verbatim
        // brought the old carpet back.
        const m = cocoons[cocoons.length - 1];
        m.tiles = _cocoonFootprint(m, m.span);
        const savedToxin = (Array.isArray(d.puddles) ? d.puddles : [])
            .filter(t => Array.isArray(t) && t.length === 2)
            .filter(([a, b]) => m.tiles.some(([tx, ty]) => tx === a && ty === b));
        m.puddles = savedToxin.slice(0, 1);
        _applyEnhancement(m);
    }
}

// ── Drawing ───────────────────────────────────────────────
// Organic blotches on the floor in the species' own colour, so which thing is
// breeding there is readable at a glance.
// The cocoon, and the same shell for the nests an infestation grows.
//
// These are computer bugs on a circuit board, so the cocoon is not spun silk —
// it is an encapsulated component. A faceted hexagonal prism sitting on the
// deck like a surface-mount package, with right-angle traces across its lid,
// solder pads, and stub pins soldered out to the board. Drawn with straight
// lines only: no beziers, no arcs, nothing round. Three earlier passes went
// wrong by being organic (a mould carpet, then a smooth dome, then a tapered
// sac) and one by being monumental (a stepped pyramid big enough to hide a
// creature behind).
//
// Small and low on purpose: about half a tile across and fifteen pixels tall,
// well under a predator sprite's ~44px, so one standing behind it is visible.
const COCOON_SAC_W = 17;    // half-width in pixels at span 2
const COCOON_SAC_H = 15;    // total height in pixels at span 2

// The lid outline, as offsets from the package centre. An elongated hexagon:
// pointed at the two ends, flat along the long edges.
const _COCOON_LID = [
    [-1.00,  0.00], [-0.46, -0.52], [0.46, -0.52],
    [ 1.00,  0.00], [ 0.46,  0.44], [-0.46, 0.44],
];

function _cocoonPath(sx, cy, w, h, dy) {
    ctx.beginPath();
    for (let i = 0; i < _COCOON_LID.length; i++) {
        const [ox, oy] = _COCOON_LID[i];
        const x = sx + ox * w, y = cy + oy * h + (dy || 0);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
}

function _drawCocoonSac(sx, sy, w, h, colour, breathe, pins) {
    const thick = Math.max(3, h * 0.34);     // how far the package stands proud
    const cy = sy - thick;                    // lid height above the deck

    // Ground shadow — a flattened diamond, not an ellipse. Nothing round.
    ctx.globalAlpha = 0.34;
    ctx.fillStyle = "#07060a";
    ctx.beginPath();
    ctx.moveTo(sx - w, sy); ctx.lineTo(sx, sy - h * 0.20);
    ctx.lineTo(sx + w, sy); ctx.lineTo(sx, sy + h * 0.20);
    ctx.closePath(); ctx.fill();

    // ── Body sides: the lid outline dropped by `thick` ──
    ctx.globalAlpha = 0.92;
    for (let i = 0; i < _COCOON_LID.length; i++) {
        const [ax, ay] = _COCOON_LID[i];
        const [bx, by] = _COCOON_LID[(i + 1) % _COCOON_LID.length];
        // Only the near faces are visible: those whose edge runs along the
        // lower half of the outline.
        if (ay + by > -0.2) {
            ctx.fillStyle = (ax + bx) > 0 ? "#0d1016" : "#151a24";
            ctx.beginPath();
            ctx.moveTo(sx + ax * w, cy + ay * h);
            ctx.lineTo(sx + bx * w, cy + by * h);
            ctx.lineTo(sx + bx * w, cy + by * h + thick);
            ctx.lineTo(sx + ax * w, cy + ay * h + thick);
            ctx.closePath(); ctx.fill();
        }
    }

    // ── Lid ──
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#1c2430";
    _cocoonPath(sx, cy, w, h, 0); ctx.fill();
    // Species wash, so which bug encapsulated itself here is readable
    ctx.globalAlpha = 0.26 + breathe * 0.07;
    ctx.fillStyle = colour;
    _cocoonPath(sx, cy, w, h, 0); ctx.fill();
    // Chamfer: a bright edge along the lid outline
    ctx.globalAlpha = 0.34 + breathe * 0.10;
    ctx.strokeStyle = typeof SENTINEL_ACCENT !== "undefined" ? SENTINEL_ACCENT : "#7fb8dc";
    ctx.lineWidth = 1;
    _cocoonPath(sx, cy, w, h, 0); ctx.stroke();

    // ── Traces across the lid — right angles, like board routing ──
    ctx.globalAlpha = 0.40 + breathe * 0.14;
    ctx.strokeStyle = colour;
    ctx.lineJoin = "miter"; ctx.lineCap = "butt";
    const runs = [
        [[-0.62, -0.10], [-0.20, -0.10], [-0.20,  0.16], [ 0.30,  0.16]],
        [[-0.30, -0.30], [ 0.14, -0.30], [ 0.14, -0.06], [ 0.62, -0.06]],
        [[ 0.00,  0.30], [ 0.40,  0.30]],
    ];
    for (const run of runs) {
        ctx.beginPath();
        run.forEach(([ox, oy], i) => {
            const x = sx + ox * w, y = cy + oy * h;
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }
    // Solder pads at the ends of the runs
    ctx.globalAlpha = 0.5 + breathe * 0.2;
    ctx.fillStyle = typeof SENTINEL_ACCENT !== "undefined" ? SENTINEL_ACCENT : "#7fb8dc";
    for (const run of runs) {
        for (const [ox, oy] of [run[0], run[run.length - 1]]) {
            ctx.fillRect(sx + ox * w - 1.2, cy + oy * h - 1.2, 2.4, 2.4);
        }
    }
    // Dead-centre die marker
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = typeof SENTINEL_SLIT !== "undefined" ? SENTINEL_SLIT : "#050508";
    ctx.fillRect(sx - w * 0.14, cy - h * 0.10, w * 0.28, h * 0.20);

    // ── Pins, soldered out to the board ──
    ctx.globalAlpha = 0.42 + breathe * 0.12;
    ctx.strokeStyle = typeof SENTINEL_ACCENT !== "undefined" ? SENTINEL_ACCENT : "#7fb8dc";
    const n = pins || 3;
    for (let i = 0; i < n; i++) {
        const t = (i + 1) / (n + 1);
        const oy = (t - 0.5) * 0.7;
        for (const side of [-1, 1]) {
            const x0 = sx + side * w * 0.88, y0 = cy + oy * h;
            const x1 = x0 + side * (4 + i * 2);
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y0);            // out
            ctx.lineTo(x1, sy);            // then straight down to the deck
            ctx.stroke();
        }
    }
    ctx.globalAlpha = 1;
}

function _infestToScreen(wx, wy) {
    return [
        (wx - player.visualX - (wy - player.visualY)) * TILE_W + canvas.width  / 2,
        (wx - player.visualX + (wy - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H,
    ];
}

// A nest an infestation grew stands on open floor, so it gets a dome of its
// own rather than the zone nests' wall honeycomb, which would be projected
// onto a wall that is not behind it.
// Called from the depth-sorted tile pass in game.js, at the point that tile is
// drawn. As a flat overlay these painted over every pylon on the board — a nest
// on a tile BEHIND a pylon still landed on top of it, which is what made them
// look like they were floating above the pylons instead of sitting under them.
function drawGrownNestForTile(t, px, py) {
    if (!t || !t._infestNest || !t.nest || t.nestHealth <= 0) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    {
        const sx = px, sy = py + TILE_H;   // tile centre, as the pylons anchor
        t.nestPulse = (t.nestPulse || 0) + 1;
        const breathe = 0.5 + 0.5 * Math.sin(t.nestPulse * 0.03);
        const hr = Math.max(0.2, t.nestHealth / (t.nestMaxHealth || 200));
        // Smaller than a cocoon, and it slumps as it is damaged.
        const nh = COCOON_SAC_H * (0.7 + hr * 0.4);
        _drawCocoonSac(sx, sy, COCOON_SAC_W * 0.78, nh, "#ff7744", breathe, 2);
        // The hatch it opens from — a cracked die window, cut as an angular
        // slot rather than a soft hole. Nothing round anywhere on these.
        const hx = sx + COCOON_SAC_W * 0.18, hy = sy - nh * 0.62;
        const hw = COCOON_SAC_W * 0.22, hh = nh * 0.26;
        ctx.globalAlpha = 0.78 + breathe * 0.15;
        ctx.fillStyle = "#120806";
        ctx.beginPath();
        ctx.moveTo(hx - hw, hy);
        ctx.lineTo(hx - hw * 0.2, hy - hh);
        ctx.lineTo(hx + hw,       hy - hh * 0.3);
        ctx.lineTo(hx + hw * 0.3, hy + hh);
        ctx.closePath(); ctx.fill();
        // A split running out of it
        ctx.globalAlpha = 0.5 + breathe * 0.2;
        ctx.strokeStyle = "#120806"; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx + hw, hy - hh * 0.3);
        ctx.lineTo(hx + hw * 1.9, hy + hh * 0.4);
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (typeof drawHealthBar === "function") {
            drawHealthBar(sx - 20, sy - nh - 12, 40, 4, t.nestHealth, t.nestMaxHealth || 200);
        }
    }
    ctx.restore();
}

// One cocoon, positioned by its caller. The shell is anchored on the pylon it
// encapsulates rather than on the footprint's centroid: an even 2x2 puts the
// pylon at a corner, and centring on the centroid made the cocoon look spun
// beside the pylon instead of over it.
function _drawOneCocoon(m, sx, sy) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
        m.pulse += 0.012;
        const breathe = 0.5 + 0.5 * Math.sin(m.pulse);
        if (m.tiles.length === 0) { ctx.restore(); return; }

        const span = Math.max(1, m.span);
        const rw = TILE_W * span * 0.52;
        const rh = TILE_H * span * 0.52;

        // ── The sac ──
        // Barely grows with the span: the footprint is a mechanical extent, not
        // a thing to fill in. Making the drawing scale with it is what produced
        // a structure big enough to hide creatures behind.
        const sacW = COCOON_SAC_W + (span - COCOON_SPAN_MIN) * 3;
        const sacH = COCOON_SAC_H + (span - COCOON_SPAN_MIN) * 2;
        // A spent cocoon goes grey and stops breathing. Leaving it looking
        // identical to a live one would make "this site is finished"
        // unreadable, which is most of the value of it burning out.
        const spent = !(m.hatchesLeft > 0);
        _drawCocoonSac(sx, sy, sacW, sacH, spent ? "#4a4a52" : m.colour,
                       spent ? 0 : breathe, 3);

        // Hairline anchor threads out to the footprint's tiles, so the extent
        // is legible without painting anything on the floor.
        ctx.globalAlpha = 0.10 + breathe * 0.04;
        ctx.strokeStyle = m.colour; ctx.lineWidth = 1;
        for (const [tx, ty] of m.tiles) {
            if (tx === m.x && ty === m.y) continue;
            const [ex, ey] = _infestToScreen(tx, ty);
            ctx.beginPath();
            ctx.moveTo(sx, sy - sacH * 0.4);
            ctx.lineTo(ex, ey);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // ── The toxin, if this species carries one ──
        // An etched patch, not a puddle: hard-edged like acid eaten into the
        // board's solder mask. Angular for the same reason as everything else
        // here — nothing round on a circuit board.
        for (const [px, py] of (m.puddles || [])) {
            const [tx, ty] = _infestToScreen(px, py);
            if (tx < -90 || tx > canvas.width + 90) continue;
            const wob = 0.5 + 0.5 * Math.sin(m.pulse * 1.3 + px * 1.3 + py * 0.7);
            const ew = TILE_W * 0.30, eh = TILE_H * 0.30;
            // An irregular octagon, seeded off the tile so each patch differs.
            const seed = (px * 73856093) ^ (py * 19349663);
            const etch = () => {
                ctx.beginPath();
                for (let i = 0; i < 8; i++) {
                    const a = (i / 8) * Math.PI * 2;
                    const j = 0.74 + (((seed >> (i * 3)) & 7) / 7) * 0.34;
                    const x = tx + Math.cos(a) * ew * j;
                    const y = ty + Math.sin(a) * eh * j;
                    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
                }
                ctx.closePath();
            };
            ctx.globalAlpha = 0.24 + wob * 0.08;
            ctx.fillStyle = COCOON_PUDDLE_COLOUR;
            etch(); ctx.fill();
            ctx.globalAlpha = 0.30 + wob * 0.10;
            ctx.strokeStyle = "#4c7a2e"; ctx.lineWidth = 1;
            etch(); ctx.stroke();
            // Two right-angle runs of corrosion creeping off it
            ctx.globalAlpha = 0.18 + wob * 0.08;
            ctx.beginPath();
            ctx.moveTo(tx - ew, ty); ctx.lineTo(tx - ew * 1.7, ty);
            ctx.lineTo(tx - ew * 1.7, ty - eh * 0.6);
            ctx.moveTo(tx + ew, ty); ctx.lineTo(tx + ew * 1.6, ty);
            ctx.lineTo(tx + ew * 1.6, ty + eh * 0.6);
            ctx.stroke();
        }
        ctx.globalAlpha = 1;
    ctx.restore();
}

// The cocoon whose anchor is this tile. Drawn from the same per-tile pass and
// BEFORE the pylon body, so the pylon rises out of the package rather than the
// package being pasted over it.
function drawCocoonForTile(t, px, py) {
    if (cocoons.length === 0 || !t) return;
    for (const m of cocoons) {
        if (m.x !== t.x || m.y !== t.y) continue;
        _drawOneCocoon(m, px, py + TILE_H);
    }
}



// The bar shown over a pylon being chewed on, so a conversion in progress is
// something the player can see and interrupt rather than discover afterwards.
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
