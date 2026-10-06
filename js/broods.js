// ─────────────────────────────────────────────────────────
//  PREDATOR PROGRESSION — what each zone's predators are FOR
// ─────────────────────────────────────────────────────────
// "I want there to be progression when it comes to the predators and their
// abilities." Each hostile zone teaches one idea, and adds it to the last:
//
//   ZONE 1  ANTS       just attackers. They walk up and bite: no special, no
//                      leap, no hauling, no pylon hunting. This is where the
//                      player learns the bugs are hostile.
//   ZONE 2  BEETLES    a third less bite and three times the health of an ant
//                      (SPECIES.beetle), and they are the HAULERS: a beetle
//                      carries charged mass to its wall nest, and every
//                      NEST_SPAWN_COST paid in hatches a predator of the
//                      LESSER tier (an ant) — see infest.js.
//   ZONE 3  NYMPHS     swarms. Most of what comes out is nymphs, fast and weak,
//                      and they come out in packs of NYMPH_SWARM_SIZE.
//   ZONE 4  THE GRUB   a larva with a huge pool of health and no bite. It eats —
//                      charged mass on the floor, wrecked pylons and pylons the
//                      enemy took from you, the bodies of dead predators — and when it has eaten
//                      GRUB_EVOLVE_COST it becomes the BROOD TYRANT, a giant
//                      boss that GUARDS its zone: it stays there, makes the
//                      predators around it hit harder, and hatches nymphs.
//
// Kill the grub before it evolves and there is no tyrant. Kill the tyrant and,
// while the zone's nest still stands, a new grub hatches after a long wait.
// ─────────────────────────────────────────────────────────

const ZONE_ROLES = { 1: "attackers", 2: "haulers", 3: "swarm", 4: "grub" };
const GRUB_ZONE           = 4;
const NYMPH_SWARM_ZONE    = 3;
const NYMPH_SWARM_SIZE    = 3;      // a nymph in the swarm zone arrives with two more
const NYMPH_SWARM_SHARE   = 0.65;   // and this share of that zone's spawns are nymphs
const GRUB_EVOLVE_COST    = 120;    // evolutionary material to become the tyrant
const GRUB_RESPAWN_FRAMES = 3600;   // a minute after the last grub or tyrant is gone
const GRUB_EAT_WRECK      = 20;     // material from a pylon wreck, chewed away
const GRUB_EAT_PYLON      = 15;     // ...from an enemy pylon it chews into a wreck
const GRUB_CHEW_FRAMES    = 120;    // two seconds to eat a wreck
const GRUB_CORPSE_LIFE    = 1800;   // a body lies for 30s before it is gone
const BROOD_SPAWN_FRAMES  = 900;    // the tyrant hatches nymphs every 15s
const BROOD_SPAWN_COUNT   = 2;
const BROOD_MAX_NYMPHS    = 6;
const BROOD_AURA_RANGE    = 4;      // tiles
const BROOD_AURA_MULT     = 1.3;    // damage from predators near the tyrant

// The grub's own statistics: a larva. Enormous health, no bite, very slow.
const GRUB_DEF = { width: 30, height: 14, moveSpeed: 0.007, health: 1500, power: 0,
                   color: "#e9dcb0", dnaDrops: 2, shardDrop: 30, reactionSpeed: 30 };

let grubCorpses  = [];     // { x, y, value, life }
let _grubTimer   = 0;      // frames until the next grub may hatch

function zoneRoleOf(z) { return ZONE_ROLES[z] || null; }

// The tier below a species — what a beetle's hauled mass hatches.
function lesserSpecies(sp) {
    const order = ["ant", "beetle", "scorpion", "mantis", "moth", "spider"];
    const i = order.indexOf(sp);
    return i > 0 ? order[i - 1] : "ant";
}

// Called once for every predator a zone spawns, after its ability is set.
function applyZoneRole(pred, z) {
    const role = zoneRoleOf(z);
    pred.zoneRole = role;
    if (role === "attackers") {
        // Plain attackers: no special of any kind, no hauling, no hunting.
        pred.abilityKey = null; pred.abilityDef = null;
        pred.huntsPylons = false;
        pred.plainAttacker = true;
    }
    if (role === "haulers" && pred.speciesName === "beetle") pred.hauler = true;
}

// Zone 3 sends its nymphs in packs: the zone spawner calls this after spawning
// one, and it adds the rest of the pack beside it (capped by the map's ceiling).
function maybeSwarm(pred, z) {
    if (z !== NYMPH_SWARM_ZONE || pred.className !== "nymph" || pred._swarmChild) return;
    for (let i = 1; i < NYMPH_SWARM_SIZE; i++) {
        if (typeof predatorBudgetFull === "function" && predatorBudgetFull()) break;
        const p = spawnPredatorForZone(z, { className: "nymph", swarmChild: true });
        if (!p) break;
        p.x = pred.x + (Math.random() - 0.5) * 1.2;
        p.y = Math.max(0, Math.min(3, pred.y + (Math.random() - 0.5) * 1.2));
    }
}

function _zoneSpan(z) { return [z * ZONE_LENGTH, (z + 1) * ZONE_LENGTH - 1]; }
function _liveGrubOrBrood() {
    return actors.find(a => !a.dead && (a.isGrub || a.isBrood)) || null;
}
// Is the grub's zone a live, hostile zone that exists on the map?
function _grubZoneOpen() {
    // Zone 4 only becomes a hostile zone once the night count reaches it — the
    // same rule the zone spawner uses (hostileZoneCount in game.js).
    if (typeof gameState !== "undefined" && (gameState.nightNumber || 1) < GRUB_ZONE) return false;
    const mouths = typeof zoneSpawnPoints === "function" ? zoneSpawnPoints(GRUB_ZONE) : null;
    if (mouths && mouths.length === 0) return false;
    if (typeof zoneIsNeutralised === "function" && zoneIsNeutralised(GRUB_ZONE)) return false;
    return world.some(t => Math.floor(t.x / ZONE_LENGTH) === GRUB_ZONE);
}

// ── HATCHING THE GRUB ────────────────────────────────────
function spawnGrub() {
    if (typeof Predator === "undefined") return null;
    const mouths = typeof zoneSpawnPoints === "function" ? zoneSpawnPoints(GRUB_ZONE) : null;
    const from = mouths && mouths.length ? mouths[0] : null;
    const x = from ? from.x : GRUB_ZONE * ZONE_LENGTH + Math.floor(ZONE_LENGTH / 2);
    const g = new Predator("grub", Object.assign({}, GRUB_DEF), x, from ? Math.max(0, from.y) : 2);
    g.speciesName = "grub"; g.className = "grub";
    g.isGrub = true; g.evo = 0; g.homeZone = GRUB_ZONE;
    g.dnaDrops = GRUB_DEF.dnaDrops; g.shardDrop = GRUB_DEF.shardDrop;
    g.huntsPylons = false; g.abilityKey = null; g.abilityDef = null;
    g.state = "wander"; g.baseMoveSpeed = g.moveSpeed;
    actors.push(g);
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 100, text: "A GRUB HAS HATCHED IN ZONE " + GRUB_ZONE,
                         color: "#e9dcb0", life: 180, vy: -0.15, size: 13 });
    return g;
}

// Once a frame from the game loop: keep one grub (or its tyrant) in zone 4.
function broodSpawnTick() {
    if (!_grubZoneOpen()) return;
    if (_liveGrubOrBrood()) { _grubTimer = GRUB_RESPAWN_FRAMES; return; }
    if (_grubTimer > 0) { _grubTimer--; return; }
    if (typeof predatorBudgetFull === "function" && predatorBudgetFull()) return;
    spawnGrub();
    _grubTimer = GRUB_RESPAWN_FRAMES;
}

// ── WHAT THE GRUB EATS ───────────────────────────────────
// A predator that dies in the grub's zone leaves a body for it.
function noteCorpse(pred) {
    if (!pred || pred.isGrub || pred.isBrood || pred.isClone) return;
    const [x0, x1] = _zoneSpan(GRUB_ZONE);
    if (pred.x < x0 - 1 || pred.x > x1 + 1) return;
    grubCorpses.push({ x: pred.x, y: pred.y, value: Math.max(3, pred.shardDrop || 5), life: GRUB_CORPSE_LIFE });
    if (grubCorpses.length > 20) grubCorpses.shift();
}

function _grubFood(g) {
    const [x0, x1] = _zoneSpan(GRUB_ZONE);
    const inZone = o => o.x >= x0 - 1 && o.x <= x1 + 1;
    let best = null, bestD = Infinity;
    const consider = (kind, o, x, y) => {
        const d = Math.hypot(x - g.x, y - g.y);
        if (d < bestD) { bestD = d; best = { kind, o, x, y }; }
    };
    if (typeof chargedMass !== "undefined")
        for (const m of chargedMass) if (!m.carrier && inZone(m)) consider("mass", m, m.x, m.y);
    for (const c of grubCorpses) if (inZone(c)) consider("corpse", c, c.x, c.y);
    for (const t of world) {
        if (!t.pillar || !inZone(t)) continue;
        if (t.destroyed) consider("wreck", t, t.x, t.y);
        // Only a pylon that was taken FROM you — never the enemy's own.
        else if (t.pillarTeam === "red" && t.takenFromPlayer && t.health > 0) consider("pylon", t, t.x, t.y);
    }
    return best;
}

function _grubGain(g, n) {
    g.evo = (g.evo || 0) + n;
    floatingTexts.push({ x: g.x, y: g.y - 1, text: "+" + Math.round(n) + " EVOLUTION", color: "#e9dcb0", life: 60, vy: -0.08 });
    if (g.evo >= GRUB_EVOLVE_COST) evolveGrub(g);
}

function grubTick(g) {
    if (g.dead || g._evolved) return;
    for (let i = grubCorpses.length - 1; i >= 0; i--) if (--grubCorpses[i].life <= 0) grubCorpses.splice(i, 1);
    if (!g._food || (frame || 0) % 30 === 0) g._food = _grubFood(g);
    const f = g._food;
    const [x0, x1] = _zoneSpan(GRUB_ZONE);
    if (!f) {
        // Nothing to eat: a slow crawl about the middle of its zone.
        const tx = (x0 + x1) / 2 + Math.sin((frame || 0) * 0.004) * 4, ty = 2;
        const dx = tx - g.x, dy = ty - g.y, d = Math.hypot(dx, dy);
        if (d > 0.3) { g.x += dx / d * g.moveSpeed * 0.5; g.y += dy / d * g.moveSpeed * 0.5; g.dirX = dx / d; g.dirY = dy / d; }
        g.walkCycle = (g.walkCycle || 0) + g.moveSpeed * 20;
        return;
    }
    const dx = f.x - g.x, dy = f.y - g.y, d = Math.hypot(dx, dy);
    if (d > 0.8) {
        g.x += dx / d * g.moveSpeed; g.y += dy / d * g.moveSpeed;
        g.dirX = dx / d; g.dirY = dy / d;
        g.walkCycle = (g.walkCycle || 0) + g.moveSpeed * 40;
        g._chew = 0;
        return;
    }
    g._chewing = true;
    if (f.kind === "mass") {
        const at = chargedMass.indexOf(f.o);
        if (at >= 0 && !f.o.carrier) { chargedMass.splice(at, 1); _grubGain(g, Math.max(1, f.o.value || 1)); }
        g._food = null;
    } else if (f.kind === "corpse") {
        const at = grubCorpses.indexOf(f.o);
        if (at >= 0) { grubCorpses.splice(at, 1); _grubGain(g, f.o.value); }
        g._food = null;
    } else if (f.kind === "pylon") {
        // An enemy pylon is chewed down to a wreck, then eaten as one.
        f.o.health = Math.max(0, f.o.health - 1);
        if (f.o.health <= 0) { f.o.destroyed = true; _grubGain(g, GRUB_EAT_PYLON); g._food = null; }
    } else if (f.kind === "wreck") {
        g._chew = (g._chew || 0) + 1;
        if (g._chew >= GRUB_CHEW_FRAMES) {
            g._chew = 0;
            f.o.pillar = false; f.o.destroyed = false; f.o.pillarTeam = null;
            if (typeof _cacheAge !== "undefined") _cacheAge = -9999;
            _grubGain(g, GRUB_EAT_WRECK);
            g._food = null;
        }
    }
}

// ── THE BROOD TYRANT FIGHT (docs/ROADMAP-top5.md §5) ─────
// Three phases by health:
//   I   BROODMOTHER  100–66%  hatches nymphs
//   II  BURROW        66–33%  also dives underground every TYRANT_BURROW_EVERY
//                             and erupts under your nearest pylon
//   III ENRAGED       < 33%   faster, attacks twice as often, hatches faster
// Its CARAPACE takes TYRANT_CARAPACE of every hit — unless a disruption pylon is
// AWAKE within TYRANT_EXPOSE_RANGE of it, which cracks it open: then it takes
// TYRANT_EXPOSED. Killing it drops the TYRANT HEART, kept for good: every
// pylon link reaches TYRANT_HEART_RANGE further.
const TYRANT_PHASE2 = 0.66, TYRANT_PHASE3 = 0.33;
const TYRANT_BROOD_FRAMES   = { 1: 900, 2: 720, 3: 480 };
const TYRANT_BURROW_EVERY   = 900;    // 15 s
const TYRANT_BURROW_FRAMES  = 180;    // 3 s underground
const TYRANT_BURROW_SPEED   = 0.08;   // tiles a frame while burrowed
const TYRANT_ERUPT_PYLON    = 120;    // damage to the pylon it comes up under
const TYRANT_ERUPT_UNITS    = 30;     // to everything of yours within the radius
const TYRANT_ERUPT_RADIUS   = 1.5;
const TYRANT_ENRAGE_SPEED   = 1.4;
const TYRANT_ENRAGE_COOLDOWN = 22;    // its melee cooldown, roughly half the usual
const TYRANT_CARAPACE       = 0.5;
const TYRANT_EXPOSED        = 1.5;
const TYRANT_EXPOSE_RANGE   = 3;
const TYRANT_HEART_RANGE    = 1;      // tiles added to every pylon link
const TYRANT_HEART_KEY      = "conduit_tyrant_heart";
let tyrantHeart = false;
try { tyrantHeart = typeof localStorage !== "undefined" && localStorage.getItem(TYRANT_HEART_KEY) === "1"; } catch (e) {}

function tyrantPhase(b) {
    const f = b.maxHealth > 0 ? b.health / b.maxHealth : 1;
    return f > TYRANT_PHASE2 ? 1 : f > TYRANT_PHASE3 ? 2 : 3;
}
// Is a disruption pylon awake close enough to crack it open?
function tyrantExposed(b) {
    if (typeof _wPylons === "undefined") return false;
    const r2 = TYRANT_EXPOSE_RANGE * TYRANT_EXPOSE_RANGE;
    for (const p of _wPylons) {
        if (p.waveAwake === false || typeof waveRole !== "function" || waveRole(p.attackModeElement) !== "disruption") continue;
        const dx = p.x - b.x, dy = p.y - b.y;
        if (dx * dx + dy * dy <= r2) return true;
    }
    return false;
}
// What a hit on it is multiplied by (read in applyDamage).
function tyrantDamageMult(b) { return b && b.isBrood ? (b._exposed ? TYRANT_EXPOSED : TYRANT_CARAPACE) : 1; }

// Where it comes up: your nearest pylon inside its zone, else your nearest unit
// there, else a random spot in the zone.
function _tyrantBurrowTarget(b) {
    const [x0, x1] = _zoneSpan(GRUB_ZONE);
    const inZone = o => o.x >= x0 && o.x <= x1;
    let best = null, bd = Infinity;
    for (const t of (typeof _pillarCache !== "undefined" ? _pillarCache : [])) {
        if (t.pillarTeam !== "green" || t.destroyed || !inZone(t)) continue;
        const d = Math.hypot(t.x - b.x, t.y - b.y); if (d < bd) { bd = d; best = { x: t.x, y: t.y, pylon: t }; }
    }
    if (best) return best;
    for (const a of actors) {
        if (a.dead || a.team !== "green" || !inZone(a)) continue;
        const d = Math.hypot(a.x - b.x, a.y - b.y); if (d < bd) { bd = d; best = { x: a.x, y: a.y }; }
    }
    return best || { x: x0 + Math.random() * (x1 - x0), y: Math.random() * 3 };
}
function _tyrantErupt(b) {
    b.untargetable = false; b._burrow = null; b._burrowCd = TYRANT_BURROW_EVERY;
    const t = b._burrowTarget; b._burrowTarget = null;
    if (t && t.pylon && !t.pylon.destroyed && Math.hypot(t.pylon.x - b.x, t.pylon.y - b.y) < 1.2) {
        t.pylon.health = Math.max(0, (t.pylon.health || 0) - TYRANT_ERUPT_PYLON);
        if (t.pylon.health <= 0) t.pylon.pendingDestroy = true;
    }
    for (const a of actors) {
        if (a.dead || a.team !== "green") continue;
        const dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
        if (d > TYRANT_ERUPT_RADIUS) continue;
        applyDamage(a, TYRANT_ERUPT_UNITS, b);
        if (d > 0.01) { a.kbVX = dx / d * 0.15; a.kbVY = dy / d * 0.15; }
    }
    if (typeof shake !== "undefined") shake = Math.max(shake, 14);
    for (let i = 0; i < 10; i++) elementEffects.push({ type: "impact", x: b.x + (Math.random() - 0.5), y: b.y + (Math.random() - 0.5), color: "#8a6a3a", radius: 0.6, life: 30, element: "core" });
    floatingTexts.push({ x: b.x, y: b.y - 1.5, text: "ERUPTS!", color: "#c0f040", life: 60, vy: -0.06 });
}
function onTyrantDeath(b) {
    const first = !tyrantHeart;
    tyrantHeart = true;
    try { localStorage.setItem(TYRANT_HEART_KEY, "1"); } catch (e) {}
    if (typeof _cacheAge !== "undefined") _cacheAge = -9999;
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 120,
        text: first ? "\u2665 TYRANT HEART \u2014 every pylon link reaches +" + TYRANT_HEART_RANGE + " tile" : "THE BROOD TYRANT FALLS",
        color: "#c0f040", life: 260, vy: -0.12, size: 15 });
}

// ── THE BROOD TYRANT ─────────────────────────────────────
function evolveGrub(g) {
    if (g._evolved) return null;
    g._evolved = true;
    const at = actors.indexOf(g);
    if (at >= 0) actors.splice(at, 1);           // it becomes the tyrant; nothing drops
    const S = SPECIES.mantis, B = S.boss;
    const def = { width: Math.round(B.width * 2.2), height: Math.round(B.height * 2.2), moveSpeed: B.moveSpeed * 0.9,
                  health: B.health * 3, power: Math.round(B.power * 0.8), color: "#c0f040",
                  reactionSpeed: B.reactionSpeed, abdomenAttack: B.abdomenAttack, rangeDamage: B.rangeDamage,
                  abdomenCooldown: B.abdomenCooldown };
    const b = new Predator("boss", def, g.x, g.y);
    b.speciesName = "mantis"; b.className = "boss";
    b.isBrood = true; b.homeZone = GRUB_ZONE; b.broodName = "BROOD TYRANT";
    b.dnaDrops = B.dnaDrops * 2; b.shardDrop = B.shardDrop * 3;
    b.huntsPylons = false; b.state = "wander";
    if (typeof applySpeciesBody === "function") applySpeciesBody(b, "mantis");
    b.baseMoveSpeed = b.moveSpeed;
    if (typeof initAbility === "function") initAbility(b);
    b._broodTimer = BROOD_SPAWN_FRAMES; b._brood = [];
    b._phase = 1; b._burrowCd = TYRANT_BURROW_EVERY;
    actors.push(b);
    if (typeof shake !== "undefined") shake = Math.max(shake, 10);
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 100, text: "THE GRUB HAS BECOME THE BROOD TYRANT",
                         color: "#c0f040", life: 240, vy: -0.12, size: 15 });
    return b;
}

// Runs at the top of the tyrant's own update, before its ordinary combat AI.
// Returns true while it is underground: that frame is the burrow's, not the AI's.
function broodTick(b) {
    if (b.dead) return false;
    // ── THE PHASES ──
    const ph = tyrantPhase(b);
    if (ph !== (b._phase || 1)) {
        b._phase = ph;
        const name = ph === 2 ? "BURROWS" : "IS ENRAGED";
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 120, text: "\u2620 THE BROOD TYRANT " + name, color: ph === 3 ? "#ff4040" : "#c0f040", life: 180, vy: -0.12, size: 15 });
        if (ph === 3) { b.baseMoveSpeed = (b.baseMoveSpeed || b.moveSpeed) * TYRANT_ENRAGE_SPEED; b.moveSpeed *= TYRANT_ENRAGE_SPEED; }
        if (typeof shake !== "undefined") shake = Math.max(shake, 10);
    }
    // The carapace: cracked while a disruption pylon is awake beside it.
    b._exposed = tyrantExposed(b);
    if (ph === 3 && b.attackCooldown > TYRANT_ENRAGE_COOLDOWN) b.attackCooldown = TYRANT_ENRAGE_COOLDOWN;
    // ── BURROW (phases II and III) ──
    if (b._burrow) {
        const t = b._burrowTarget;
        if (t) { const dx = t.x - b.x, dy = t.y - b.y, d = Math.hypot(dx, dy);
                 if (d > TYRANT_BURROW_SPEED) { b.x += dx / d * TYRANT_BURROW_SPEED; b.y += dy / d * TYRANT_BURROW_SPEED; } else { b.x = t.x; b.y = t.y; } }
        if (--b._burrow <= 0) _tyrantErupt(b);
        return true;
    }
    if (ph >= 2 && --b._burrowCd <= 0) {
        b._burrow = TYRANT_BURROW_FRAMES; b.untargetable = true;
        b._burrowTarget = _tyrantBurrowTarget(b);
        b.currentTarget = null; b.state = "wander";
        floatingTexts.push({ x: b.x, y: b.y - 1.5, text: "BURROWS!", color: "#c0f040", life: 60, vy: -0.06 });
        return true;
    }
    // It GUARDS its zone: never more than a step outside it.
    const [x0, x1] = _zoneSpan(GRUB_ZONE);
    if (b.x < x0) b.x += Math.min(x0 - b.x, b.moveSpeed * 2);
    if (b.x > x1) b.x -= Math.min(b.x - x1, b.moveSpeed * 2);
    // Predators near it hit harder (read in applyDamage).
    for (const a of actors) {
        if (a === b || a.dead || !(a instanceof Predator) || a.team === "green" || a.isClone) continue;
        if (Math.hypot(a.x - b.x, a.y - b.y) <= BROOD_AURA_RANGE) a.broodBuffUntil = (frame || 0) + 10;
    }
    // And it hatches nymphs.
    b._brood = (b._brood || []).filter(p => p && !p.dead);
    if (--b._broodTimer <= 0) {
        b._broodTimer = TYRANT_BROOD_FRAMES[b._phase || 1] || BROOD_SPAWN_FRAMES;
        for (let i = 0; i < BROOD_SPAWN_COUNT && b._brood.length < BROOD_MAX_NYMPHS; i++) {
            if (typeof predatorBudgetFull === "function" && predatorBudgetFull()) break;
            const p = typeof _spawnPredatorAt === "function"
                ? _spawnPredatorAt("scorpion", "nymph", b.x + (Math.random() - 0.5) * 2, Math.max(0, Math.min(3, b.y + (Math.random() - 0.5) * 2)))
                : null;
            if (p) { p.homeZone = GRUB_ZONE; b._brood.push(p); }
        }
    }
    return false;
}

// THE BOSS BAR. Top of the screen while the tyrant is alive and near: its name,
// the phase it is in, and whether its carapace is cracked.
function drawTyrantBar() {
    let b = null;
    for (const a of actors) if (a.isBrood && !a.dead) { b = a; break; }
    if (!b || Math.abs(b.x - player.x) > 16) return;
    const w = Math.min(300, canvas.width - 40), x = Math.round((canvas.width - w) / 2), y = 146;
    const f = Math.max(0, Math.min(1, b.health / b.maxHealth));
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(x - 2, y - 2, w + 4, 12);
    ctx.fillStyle = b._phase === 3 ? "#ff4040" : "#c0f040"; ctx.fillRect(x, y, Math.round(w * f), 8);
    // Phase marks at 66% and 33%.
    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(x + Math.round(w * TYRANT_PHASE2), y, 2, 8); ctx.fillRect(x + Math.round(w * TYRANT_PHASE3), y, 2, 8);
    ctx.font = "bold 9px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#c0f040";
    ctx.fillText("\u2620 BROOD TYRANT \u00b7 " + ["", "I BROODMOTHER", "II BURROW", "III ENRAGED"][b._phase || 1], x, y - 4);
    ctx.textAlign = "right";
    if (b.untargetable) { ctx.fillStyle = "#c8a36a"; ctx.fillText("UNDERGROUND", x + w, y - 4); }
    else if (b._exposed) { ctx.fillStyle = "#ffe066"; ctx.fillText("\u25bc EXPOSED", x + w, y - 4); }
    else { ctx.fillStyle = "#8a9"; ctx.fillText("CARAPACE \u00bd", x + w, y - 4); }
    ctx.restore();
}

// ── DRAWING ──────────────────────────────────────────────
// A fat, pale, segmented larva that heaves as it crawls, with its progress to
// evolving written over it. The tyrant is drawn as a scaled-up mantis by the
// ordinary predator draw; this adds its name.
function drawGrub(g, px, py, c) {
    c = c || ctx;
    const ang = Math.atan2(g.dirY || 0, g.dirX || 1);
    const sdx = Math.cos(ang) * 0.9, sdy = Math.sin(ang) * 0.45;
    const base = py - 6, N = 7;
    c.save();
    for (let i = N - 1; i >= 0; i--) {
        const heave = Math.sin((g.walkCycle || 0) * 0.08 - i * 0.8) * 1.6;
        const r = 9 + Math.sin(i / (N - 1) * Math.PI) * 6;
        const sx = px - sdx * (i - N / 2) * 8, sy = base - sdy * (i - N / 2) * 8 - heave;
        c.fillStyle = i === 0 ? "#d8c690" : (i % 2 ? "#efe3bd" : "#e2d4a4");
        c.strokeStyle = "rgba(90,70,40,0.55)"; c.lineWidth = 1;
        c.beginPath(); c.ellipse(sx, sy, r, r * 0.72, 0, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    // Head: dark mandibles.
    const hx = px + sdx * (N / 2) * 8, hy = base + sdy * (N / 2) * 8;
    c.fillStyle = "#3a2a18";
    c.beginPath(); c.arc(hx + Math.cos(ang + 0.5) * 6, hy + Math.sin(ang + 0.5) * 3, 2.2, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(hx + Math.cos(ang - 0.5) * 6, hy + Math.sin(ang - 0.5) * 3, 2.2, 0, Math.PI * 2); c.fill();
    c.restore();
    if (typeof drawHealthBar === "function") drawHealthBar(px - 22, py - 46, 44, 5, g.health, g.maxHealth, c);
    // Evolution progress
    const f = Math.min(1, (g.evo || 0) / GRUB_EVOLVE_COST);
    c.save();
    c.fillStyle = "rgba(0,0,0,0.6)"; c.fillRect(px - 22, py - 38, 44, 4);
    c.fillStyle = "#c0f040"; c.fillRect(px - 22, py - 38, 44 * f, 4);
    c.fillStyle = "#e9dcb0"; c.font = "bold 8px monospace"; c.textAlign = "center";
    c.fillText("GRUB · EVOLVING " + Math.floor(f * 100) + "%", px, py - 52);
    c.restore();
}

function drawBroodLabel(b, px, py, c) {
    c = c || ctx;
    c.save();
    // EXPOSED: glowing cracks across it while a disruption pylon is awake beside it.
    if (b._exposed && !b.untargetable) {
        c.strokeStyle = `rgba(255,224,102,${0.6 + 0.4 * Math.sin((frame || 0) * 0.3)})`; c.lineWidth = 2;
        const cy = py - (b.dimensions ? b.dimensions.height * 2 : 60);
        c.beginPath(); c.moveTo(px - 20, cy - 10); c.lineTo(px - 6, cy); c.lineTo(px - 12, cy + 12);
        c.moveTo(px + 18, cy - 14); c.lineTo(px + 6, cy - 2); c.lineTo(px + 16, cy + 10); c.stroke();
        c.fillStyle = "#ffe066"; c.font = "bold 9px monospace"; c.textAlign = "center";
        c.fillText("\u25bc EXPOSED", px, py - 132);
    }
    // A pulsing ring on the floor under it, so the boss reads as THE boss and
    // not as one more silhouette.
    const pulse = 0.5 + 0.5 * Math.sin((frame || 0) * 0.08);
    c.strokeStyle = `rgba(192,240,64,${0.35 + pulse * 0.45})`; c.lineWidth = 3;
    c.shadowColor = "#c0f040"; c.shadowBlur = 12;
    // Under its legs: the body is drawn about two of its heights above py.
    const feetY = py - (b.dimensions ? b.dimensions.height * 1.15 : 30);
    c.beginPath(); c.ellipse(px, feetY, 46 + pulse * 6, 20 + pulse * 3, 0, 0, Math.PI * 2); c.stroke();
    c.shadowBlur = 0;
    c.fillStyle = "#c0f040"; c.font = "bold 10px monospace"; c.textAlign = "center";
    c.fillText("☠ " + (b.broodName || "BROOD TYRANT"), px, py - 120);
    c.restore();
}

// Bodies on the floor in the grub's zone — dark husks it is heading for.
function drawGrubCorpses() {
    if (!grubCorpses.length) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const k of grubCorpses) {
        const sx = (k.x - player.visualX - (k.y - player.visualY)) * TILE_W + canvas.width / 2;
        const sy = (k.x - player.visualX + (k.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H;
        if (sx < -40 || sx > canvas.width + 40 || sy < -40 || sy > canvas.height + 40) continue;
        ctx.globalAlpha = Math.min(1, k.life / 300) * 0.8;
        ctx.fillStyle = "#2a1a22";
        ctx.beginPath(); ctx.ellipse(sx, sy, 9, 4, 0.3, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#5a3a48"; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.restore();
}

function clearBroods() { grubCorpses = []; _grubTimer = 0; }
