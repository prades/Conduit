// ─────────────────────────────────────────────────────────
//  INFESTATION — what predators do when nobody is fighting them
//
//  Left undisturbed, a predator does not just wander. It walks to the nearest
//  pylon you hold, chews it over to its own side, and then seeds the ground
//  around it: a nest, and a mould that creeps outward and hatches more of the
//  same species. A mould that reaches a second pylon spreads onto that one too,
//  so a neglected stretch of the map turns into a nursery.
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
    if (typeof alertActive !== "undefined" && alertActive) return false;
    if (pred.provoked) return false;
    if (pred.state === "attack" || pred.state === "hunt" || pred.state === "crawl_in") return false;
    if (pred.currentTarget && !pred.currentTarget.dead) return false;
    return true;
}

// ── Tuning ────────────────────────────────────────────────
const INFEST_SEEK_RANGE    = 14;    // how far a predator will walk to find a pylon
const INFEST_REACH         = 0.95;  // close enough to start working on it
const INFEST_RATE          = 0.0022;// per frame in contact — about 7.5s to convert
const INFEST_DECAY         = 0.004; // per frame once nobody is working on it
const INFEST_RESCAN_FRAMES = 45;    // how often a predator looks for a new target

const MOULD_MAX_TILES      = 14;    // a patch stops creeping at this size
const MOULD_GROW_FRAMES    = 150;   // one new tile every this many frames
const MOULD_RADIUS         = 3.2;   // how far from its anchor it can reach
const MOULD_SPAWN_FRAMES   = 900;   // one hatch every 15s while it has room
const MOULD_SPAWN_CAP      = 3;     // live spawns a single patch will keep out
const MOULD_ABSORB_RANGE   = 1.4;   // a pylon this close to mould gets taken too

let moulds = [];   // { tiles:[[x,y]], anchors:[tile], species, className, ... }

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
        return false;
    }
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
    const dist = Math.hypot(dx, dy) || 1;
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
    t.convertProgress = (t.convertProgress || 0) + INFEST_RATE;
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
    seedMould(t, pred);
}

// ── The nest ──────────────────────────────────────────────
// One nest per converted pylon, on a clear floor tile beside it. Nests are
// normally one per zone at its centre; these are extra, so they carry the same
// zone index for the spawn bookkeeping but do not displace the original.
function seedNestNear(t, pred) {
    // Already a nest in reach? Then this pylon joins that one's territory.
    for (const obj of world) {
        if (obj.nest && obj.nestHealth > 0 && Math.hypot(obj.x - t.x, obj.y - t.y) < 4) return null;
    }
    const spots = [[t.x, t.y - 1], [t.x + 1, t.y], [t.x - 1, t.y], [t.x, t.y + 1],
                   [t.x + 1, t.y - 1], [t.x - 1, t.y - 1]];
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
        floatingTexts.push({ x: tile.x, y: tile.y - 1, text: "NEST GROWN", color: "#ff7744",
                             life: 120, vy: -0.2 });
        // Hand it to the patch so reclaiming can take it away. Looking for it
        // in the patch's tile list does not work — the nest sits beside the
        // pylon and the mould may never creep onto that tile.
        const m = mouldForAnchor(t);
        if (m) m.nest = tile;
        else   t._pendingNest = tile;
        return tile;
    }
    return null;
}

// ── The mould ─────────────────────────────────────────────
function mouldAt(x, y) {
    for (const m of moulds) {
        for (const [mx, my] of m.tiles) if (mx === x && my === y) return m;
    }
    return null;
}

function seedMould(t, pred) {
    const existing = mouldForAnchor(t);
    if (existing) return existing;
    const m = {
        x: t.x, y: t.y,
        tiles: [[t.x, t.y]],
        anchors: [t],
        species: (pred && pred.speciesName) || "ant",
        className: (pred && pred.className) || "scout",
        colour: (pred && pred.color) || "#aa55ff",
        growTimer: MOULD_GROW_FRAMES,
        spawnTimer: MOULD_SPAWN_FRAMES,
        spawned: [],
        nest: t._pendingNest || null,
        pulse: Math.random() * Math.PI * 2,
    };
    t._pendingNest = null;
    moulds.push(m);
    return m;
}

function mouldForAnchor(t) {
    return moulds.find(m => m.anchors.includes(t)) || null;
}

// A patch creeps one tile at a time onto clear floor within its radius.
function _growMould(m) {
    if (m.tiles.length >= MOULD_MAX_TILES) return;
    const candidates = [];
    for (const [tx, ty] of m.tiles) {
        for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
            const nx = tx + dx, ny = ty + dy;
            if (Math.hypot(nx - m.x, ny - m.y) > MOULD_RADIUS) continue;
            if (mouldAt(nx, ny)) continue;
            const tile = typeof getTile === "function" ? getTile(nx, ny) : null;
            if (!tile || tile.type !== "floor") continue;
            candidates.push([nx, ny]);
        }
    }
    if (candidates.length === 0) return;
    // If one of your pylons is in reach, the patch grows toward it. Purely
    // random creep meant absorbing a neighbour was down to the dice and often
    // never happened before the patch hit its size cap.
    let reach = null, reachD = Infinity;
    for (const t of world) {
        if (!t.pillar || t.destroyed || t.health <= 0) continue;
        if (t.pillarTeam !== "green") continue;
        if (m.anchors.includes(t)) continue;
        const d = Math.hypot(t.x - m.x, t.y - m.y);
        if (d <= MOULD_RADIUS + MOULD_ABSORB_RANGE && d < reachD) { reachD = d; reach = t; }
    }
    if (reach) {
        candidates.sort((a, b) =>
            Math.hypot(a[0] - reach.x, a[1] - reach.y) - Math.hypot(b[0] - reach.x, b[1] - reach.y));
    }
    const [gx, gy] = reach ? candidates[0]
                           : candidates[Math.floor(Math.random() * candidates.length)];
    m.tiles.push([gx, gy]);

    // Reaching another of your pylons takes that one too — this is how one
    // patch ends up spanning several.
    for (const t of world) {
        if (!t.pillar || t.destroyed || t.health <= 0) continue;
        if (t.pillarTeam !== "green") continue;
        if (m.anchors.includes(t)) continue;
        if (Math.hypot(t.x - gx, t.y - gy) > MOULD_ABSORB_RANGE) continue;
        // Claim it BEFORE converting. convertPylonToRed seeds a mould, and
        // seedMould only recognises an existing patch by its anchors — claiming
        // it afterwards left the pylon anchoring two separate patches.
        m.anchors.push(t);
        convertPylonToRed(t, { speciesName: m.species, className: m.className, color: m.colour });
    }
}

// Hatch one of the species that grew this patch.
function _hatchFromMould(m) {
    m.spawned = m.spawned.filter(p => p && !p.dead);
    if (m.spawned.length >= MOULD_SPAWN_CAP) return;
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
    p.fromMould = true;
    if (typeof applySpeciesBody === "function") applySpeciesBody(p, m.species);
    p.baseMoveSpeed = p.moveSpeed;
    if (typeof initAbility === "function") initAbility(p);
    actors.push(p);
    m.spawned.push(p);
    elementEffects.push({ type: "impact", x: sx, y: sy, color: m.colour, radius: 0.5, life: 22 });
}

// A patch only lives while it still holds a pylon. Reclaim them all and it dies.
function _mouldStillHeld(m) {
    m.anchors = m.anchors.filter(t => t && t.pillar && t.pillarTeam === "red" && !t.destroyed);
    return m.anchors.length > 0;
}

function updateInfestation() {
    decayConversions();
    for (let i = moulds.length - 1; i >= 0; i--) {
        const m = moulds[i];
        if (!_mouldStillHeld(m)) { moulds.splice(i, 1); continue; }
        if (--m.growTimer <= 0)  { m.growTimer = MOULD_GROW_FRAMES;  _growMould(m); }
        if (--m.spawnTimer <= 0) { m.spawnTimer = MOULD_SPAWN_FRAMES; _hatchFromMould(m); }
    }
}

// Called when the player takes a pylon back. Everything anchored only to that
// pylon goes with it — that is the counter to the whole mechanic.
function clearInfestationAt(t) {
    if (!t) return;
    t.converting = false; t.convertProgress = 0;
    for (let i = moulds.length - 1; i >= 0; i--) {
        const m = moulds[i];
        const at = m.anchors.indexOf(t);
        if (at >= 0) m.anchors.splice(at, 1);
        if (m.anchors.length === 0) {
            // Take the grown nest with it, so reclaiming really does clear the
            // ground rather than leaving a spawner behind.
            if (m.nest && m.nest._infestNest) {
                m.nest.nest = false; m.nest.nestHealth = 0; m.nest._infestNest = false;
            }
            moulds.splice(i, 1);
        }
    }
}

// ── Persistence ───────────────────────────────────────────
function serialiseMoulds() {
    return moulds.map(m => ({
        x: m.x, y: m.y, tiles: m.tiles.map(([a, b]) => [a, b]),
        anchors: m.anchors.map(t => [t.x, t.y]),
        species: m.species, className: m.className, colour: m.colour,
        growTimer: m.growTimer, spawnTimer: m.spawnTimer,
        nest: m.nest ? [m.nest.x, m.nest.y] : null,
    }));
}

function restoreMoulds(data) {
    moulds.length = 0;
    if (!Array.isArray(data)) return;
    for (const d of data) {
        if (!d || !Array.isArray(d.tiles)) continue;
        const anchors = [];
        for (const a of (d.anchors || [])) {
            const tile = typeof getTile === "function" ? getTile(a[0], a[1]) : null;
            if (tile && tile.pillar) anchors.push(tile);
        }
        if (anchors.length === 0) continue;   // nothing holds it up any more
        moulds.push({
            x: d.x, y: d.y,
            tiles: d.tiles.filter(t => Array.isArray(t) && t.length === 2).map(([a, b]) => [a, b]),
            anchors,
            species: d.species || "ant", className: d.className || "scout",
            colour: d.colour || "#aa55ff",
            growTimer: d.growTimer || MOULD_GROW_FRAMES,
            spawnTimer: d.spawnTimer || MOULD_SPAWN_FRAMES,
            spawned: [],
            nest: (d.nest && typeof getTile === "function") ? getTile(d.nest[0], d.nest[1]) : null,
            pulse: Math.random() * Math.PI * 2,
        });
    }
}

// ── Drawing ───────────────────────────────────────────────
// Organic blotches on the floor in the species' own colour, so which thing is
// breeding there is readable at a glance.
function drawMoulds() {
    if (moulds.length === 0) return;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const m of moulds) {
        m.pulse += 0.02;
        const breathe = 0.5 + 0.5 * Math.sin(m.pulse);
        for (const [tx, ty] of m.tiles) {
            const sx = (tx - player.visualX - (ty - player.visualY)) * TILE_W + canvas.width  / 2;
            const sy = (tx - player.visualX + (ty - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H;
            if (sx < -90 || sx > canvas.width + 90 || sy < -90 || sy > canvas.height + 90) continue;
            // Three overlapping lobes, offset deterministically per tile so the
            // patch looks grown rather than tiled.
            const seed = (tx * 73856093) ^ (ty * 19349663);
            for (let i = 0; i < 3; i++) {
                const a = ((seed >> (i * 5)) & 15) / 15;
                const ox = (a - 0.5) * TILE_W * 0.5;
                const oy = (((seed >> (i * 7 + 3)) & 15) / 15 - 0.5) * TILE_H * 0.5;
                const r  = TILE_W * (0.30 + a * 0.16);
                ctx.fillStyle = m.colour;
                ctx.globalAlpha = 0.16 + breathe * 0.07;
                ctx.beginPath();
                ctx.ellipse(sx + ox, sy + oy, r, r * (TILE_H / TILE_W), 0, 0, Math.PI * 2);
                ctx.fill();
            }
            // Spore specks
            ctx.globalAlpha = 0.35 + breathe * 0.25;
            ctx.fillStyle = m.colour;
            for (let i = 0; i < 2; i++) {
                const a = ((seed >> (i * 11 + 1)) & 31) / 31;
                ctx.beginPath();
                ctx.arc(sx + (a - 0.5) * TILE_W * 0.6,
                        sy + (((seed >> (i * 13)) & 31) / 31 - 0.5) * TILE_H * 0.6,
                        1.2, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.globalAlpha = 1;
    }
    ctx.restore();
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
