// ─────────────────────────────────────────────────────────
//  RAIDS — shard thieves, and the machines they pay for
//
//  REPORTED: "whenever there's nothing going on, the enemies will spawn from
//  the three nests that haven't been conquered, and they'll migrate down and
//  start sucking on the nests ... they'll take a shard from the nests and
//  they'll rob you of your shards, and they can take it to their nests to
//  multiply and create new forms of machinery that is hostile and needs to be
//  taken out."
//
//   - QUIET: daytime, no alarm, and you hold at least one nest. Every
//     RAID_INTERVAL_MIN..MAX of quiet, each of the (up to) three live enemy
//     nests nearest your held nests sends out one THIEF.
//   - A thief walks to your nearest held nest, SIPHONS it for a few seconds
//     (a beam from the nest's mouth to it), and takes RAID_TAKE shards out of
//     your count. Hit it before then and it fights like any predator.
//   - Carrying, it runs for home and does not stop to fight. Kill it on the
//     way and every shard comes back. Let it in and its nest banks them.
//   - A nest with MACHINE_COST banked BUILDS A MACHINE in front of itself:
//       SENTRY  — a stationary gun that shoots your squad (the first one)
//       STRIDER — a four-legged walker that marches onto your nearest held
//                 nest and drains it a shard at a time until it is destroyed
//     Each assembles for a few seconds first (and can be killed doing it).
//     With both standing, more stolen shards HATCH predators instead.
//   - Destroying a machine salvages shards back.
// ─────────────────────────────────────────────────────────

// ── Tuning ────────────────────────────────────────────────
const RAID_INTERVAL_MIN    = 2400;  // 40s of quiet between raids …
const RAID_INTERVAL_MAX    = 3600;  // … up to 60s
const RAID_SOURCES         = 3;     // the nearest live enemy nests each send one
const RAID_MAX_LIVE        = 3;     // thieves out at once
const RAID_STAGGER         = 90;    // frames between thieves of one raid leaving
const RAID_SIPHON_FRAMES   = 240;   // 4s on your nest before it has the shards
const RAID_TAKE            = 4;     // shards one thief takes …
const RAID_TAKE_PER_ZONES  = 3;     // … +1 for every this many zones deep its nest is
const RAID_REACH           = 0.9;
const RAID_FLEE_SPEED      = 1.15;  // carrying, it runs
const MACHINE_COST         = 15;    // banked shards per machine
const MACHINE_HATCH_COST   = 10;    // banked shards per predator once both machines stand
const MACHINE_ASSEMBLE     = 480;   // 8s to assemble; it can be killed doing it
const MACHINE_DEFS = {
    sentry:  { label: "SENTRY",  health: 180, power: 8,  moveSpeed: 0,     range: 5, every: 70, salvage: 8,  width: 30, height: 20 },
    strider: { label: "STRIDER", health: 300, power: 10, moveSpeed: 0.012, range: 4, every: 90, salvage: 12, width: 30, height: 20,
               drainEvery: 150 },   // one shard out of your count per 2.5s on your nest
};
const MACHINE_DRAW_SCALE = 1.7;    // drawn big: it is a structure, not one more bug
const RAID_COLOR    = "#5ff0ff";    // stolen shards, siphon beams
const MACHINE_RED   = "#ff3b30";

let _raidTimer   = RAID_INTERVAL_MIN;
let _raidPending = [];              // { nest, at } thieves still to leave this raid

// ── When it may happen ────────────────────────────────────
function _heldNests() {
    const list = (typeof _nestCache !== "undefined" && _nestCache.length) ? _nestCache : world.filter(t => t.nest);
    return list.filter(t => t.nest && raidZoneOf(t) >= 1 && !(typeof isHomePortal === "function" && isHomePortal(t)) && nestIsPowerSource(t));
}
function _liveEnemyNests() {
    const list = (typeof _nestCache !== "undefined" && _nestCache.length) ? _nestCache : world.filter(t => t.nest);
    // Zone 1 onward: nothing behind the home portal ever spawns (the zone spawner starts at 1).
    return list.filter(t => t.nest && t.nestHealth > 0 && raidZoneOf(t) >= 1 && !(typeof isHomePortal === "function" && isHomePortal(t)));
}
function raidQuiet() {
    if (typeof gameState === "undefined" || !gameState.running || gameState.phase !== "day") return false;
    if (typeof alertActive !== "undefined" && alertActive) return false;
    if (typeof tutorialMode !== "undefined" && tutorialMode) return false;
    return _heldNests().length > 0;
}
// The floor in front of a wall nest's mouth. The vortex is drawn on the wall
// face a tile along from the nest tile (drawNestWallVortex), so that is where
// a thief stands to drink from it.
function raidMouth(n) { return { x: n.x + 0.8, y: Math.max(0, n.y + 1) }; }
function raidZoneOf(t) { return typeof getZoneIndex === "function" ? getZoneIndex(Math.floor(t.x)) : Math.floor(t.x / ZONE_LENGTH); }

// The three live enemy nests nearest anything you hold — the ones on your doorstep.
function raidSourceNests() {
    const held = _heldNests();
    if (!held.length) return [];
    const dist = n => Math.min(...held.map(h => Math.abs(h.x - n.x)));
    return _liveEnemyNests().sort((a, b) => dist(a) - dist(b)).slice(0, RAID_SOURCES);
}
function raidThieves() { return actors.filter(a => a.raider && !a.dead); }
function nestMachines(nest) { return actors.filter(a => a.isMachine && !a.dead && a._home === nest); }

// ── The thief ─────────────────────────────────────────────
function spawnThief(nest) {
    if (typeof _spawnPredatorAt !== "function" || typeof getZoneSpecies !== "function") return null;
    const z = raidZoneOf(nest);
    const p = _spawnPredatorAt(getZoneSpecies(z, gameState.nightNumber || 1), "scout", nest.x, Math.max(0, nest.y + 1));
    if (!p) return null;
    p.raider = true; p._raidHome = nest; p.stolen = 0; p._raidProgress = 0;
    p.huntsPylons = false; p.hauler = false; p.isWanderer = true;
    p._raidTake = RAID_TAKE + Math.floor(z / RAID_TAKE_PER_ZONES);
    return p;
}
function _raidTargetFor(p) {
    const t = p._raidTarget;
    if (t && nestIsPowerSource(t) && !isHomePortal(t)) return t;
    let best = null, bd = Infinity;
    for (const n of _heldNests()) { const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = n; } }
    p._raidTarget = best;
    p._raidProgress = 0;
    return best;
}
function _raidHomeFor(p) {
    if (p._raidHome && p._raidHome.nestHealth > 0) return p._raidHome;
    let best = null, bd = Infinity;
    for (const n of _liveEnemyNests()) { const d = Math.hypot(n.x - p.x, n.y - p.y); if (d < bd) { bd = d; best = n; } }
    p._raidHome = best;
    return best;
}
// Walked into its nest: it is gone, and nothing about that is a kill.
function _raidVanish(p) {
    p.dead = true; p.deathProcessed = true; p.progressCounted = true; p.killCounted = true;
    p._enteredNest = true; p.stolen = 0; p._raidSiphoning = null;
}
function _raidText(wx, wy, text, color, size) {
    if (typeof floatingTexts === "undefined" || typeof canvas === "undefined") return;
    const sx = (wx - player.visualX - (wy - player.visualY)) * TILE_W + canvas.width / 2;
    const sy = (wx - player.visualX + (wy - player.visualY)) * TILE_H + canvas.height / 2;
    floatingTexts.push({ x: sx, y: sy - 50, text, color, life: 110, vy: -0.4, size: size || 12 });
}
function _raidBanner(text) {
    if (typeof floatingTexts === "undefined" || typeof canvas === "undefined") return;
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height * 0.28, text, color: RAID_COLOR, life: 150, vy: 0, size: 13 });
}

// One frame of a thief. Returns true when it owns the frame.
function raidUnitTick(p) {
    // CARRYING: it runs for home and fights nothing on the way.
    if (p.stolen > 0) {
        p._raidSiphoning = null;
        const home = _raidHomeFor(p);
        if (!home) { raidRecover(p); return false; }   // nowhere left to take it
        const hm = raidMouth(home), d = _predatorWalk(p, hm.x, hm.y, RAID_FLEE_SPEED);
        if (d > RAID_REACH) return true;
        raidBank(home, p.stolen, p);
        _raidVanish(p);
        return true;
    }
    // Before it has anything it is an ordinary predator in a fight.
    if (typeof predatorUndisturbed === "function" && !predatorUndisturbed(p)) { p._raidSiphoning = null; return false; }
    const t = _raidTargetFor(p);
    if (!t) {
        // Nothing of yours left to rob: back into its nest.
        const home = _raidHomeFor(p);
        if (!home) { p.raider = false; return false; }
        const hm = raidMouth(home);
        if (_predatorWalk(p, hm.x, hm.y, 0.9) <= RAID_REACH) _raidVanish(p);
        return true;
    }
    const tm = raidMouth(t), d = _predatorWalk(p, tm.x, tm.y, 0.9);
    if (d > RAID_REACH) { p._raidSiphoning = null; return true; }
    // SIPHONING
    if (!p._raidSiphoning) _raidBanner("⚠ A THIEF IS DRAINING YOUR ZONE " + raidZoneOf(t) + " NEST");
    p._raidSiphoning = t;
    if (typeof faceToward === "function") faceToward(p, t.x, t.y, 0.2);
    p._raidProgress = (p._raidProgress || 0) + 1;
    if (p._raidProgress < RAID_SIPHON_FRAMES) return true;
    const take = Math.min(p._raidTake || RAID_TAKE, Math.max(0, Math.floor(shardCount)));
    shardCount -= take;
    if (typeof saveShards === "function") saveShards();
    p.stolen = take; p._raidSiphoning = null; p._raidProgress = 0;
    _raidText(t.x, t.y + 1, take > 0 ? "−" + take + " ◆ STOLEN" : "NOTHING TO STEAL", "#ff7a6a", 13);
    if (take === 0) { p.stolen = 0; p._raidTarget = null; p.raider = false; }   // empty-handed, it just wanders
    return true;
}

// Killed (or stranded) holding your shards: every one comes back.
function raidRecover(p) {
    if (!p || !(p.stolen > 0)) return 0;
    const n = p.stolen;
    shardCount += n; p.stolen = 0;
    if (typeof saveShards === "function") saveShards();
    _raidText(p.x, p.y, "RECOVERED +" + n + " ◆", RAID_COLOR, 13);
    return n;
}

// ── The nest banks it, and builds ─────────────────────────
function raidBank(nest, n, from) {
    if (!nest || !(n > 0)) return;
    nest.stolenStock = (nest.stolenStock || 0) + n;
    _raidText(nest.x, nest.y + 1, "+" + n + " ◆ TO THE NEST", "#ff9966", 11);
    raidNestBuild(nest);
}
function raidNestBuild(nest) {
    if (!nest || !(nest.nestHealth > 0)) return;
    while ((nest.stolenStock || 0) >= MACHINE_COST) {
        const have = nestMachines(nest);
        const kind = !have.some(m => m.machineKind === "sentry") ? "sentry"
                   : !have.some(m => m.machineKind === "strider") ? "strider" : null;
        if (!kind) break;
        nest.stolenStock -= MACHINE_COST;
        spawnMachine(kind, nest);
        _raidBanner("⚠ THE ZONE " + raidZoneOf(nest) + " NEST IS BUILDING A " + MACHINE_DEFS[kind].label);
    }
    // Both machines standing: the rest MULTIPLIES — it hatches predators.
    while ((nest.stolenStock || 0) >= MACHINE_HATCH_COST && nestMachines(nest).length >= 2) {
        if (typeof predatorBudgetFull === "function" && predatorBudgetFull()) break;
        const p = _spawnPredatorAt(getZoneSpecies(raidZoneOf(nest), gameState.nightNumber || 1), "scout", nest.x, Math.max(0, nest.y + 1));
        if (!p) break;
        nest.stolenStock -= MACHINE_HATCH_COST;
        _raidText(nest.x, nest.y + 1, "A PREDATOR HATCHED", "#ff5533", 12);
    }
}

// ── The machines ──────────────────────────────────────────
function spawnMachine(kind, nest, at) {
    if (typeof Predator === "undefined") return null;
    const D = MACHINE_DEFS[kind];
    // Either side of the nest's mouth, a step out from the wall.
    const slot = kind === "sentry" ? -1.6 : 1.6, mouth = nest ? raidMouth(nest) : { x: 0, y: 0 };
    const x = at ? at.x : mouth.x + slot, y = at ? at.y : 0.9;
    const m = new Predator("machine", { width: D.width, height: D.height, moveSpeed: D.moveSpeed, health: D.health,
                                        power: D.power, color: MACHINE_RED, reactionSpeed: 10 }, x, y);
    m.isMachine = true; m.machineKind = kind; m._home = nest;
    m.speciesName = "machine"; m.className = kind;
    m.huntsPylons = false; m.hauler = false; m.state = "wander"; m.entryDelay = 0;
    m.dnaDrops = 0; m.shardDrop = 0;
    m._anchorX = x; m._anchorY = y;
    m._assemble = MACHINE_ASSEMBLE; m._fireAt = 0; m._aim = Math.PI * 0.75;
    if (typeof applyZoneDifficulty === "function" && nest) applyZoneDifficulty(m, raidZoneOf(nest));
    m.huntsPylons = false;
    m.baseMoveSpeed = m.moveSpeed;
    // Assembling: it starts at a third of its armour and builds to full.
    m.health = Math.round(m.maxHealth * 0.35);
    actors.push(m);
    return m;
}
function _machineTarget(m, range) {
    let best = null, bd = range;
    for (const a of actors) {
        if (a.dead || a.team !== "green" || (a.spawnProtection || 0) > 0) continue;
        const d = Math.hypot(a.x - m.x, a.y - m.y);
        if (d < bd) { bd = d; best = a; }
    }
    return best;
}
function machineTick(m) {
    const D = MACHINE_DEFS[m.machineKind] || MACHINE_DEFS.sentry;
    if (m.hitFlash > 0) m.hitFlash--;
    if (m.machineKind === "sentry") { m.x = m._anchorX; m.y = m._anchorY; }   // bolted down: nothing knocks it about
    if (m._assemble > 0) {
        m._assemble--;
        m.health = Math.min(m.maxHealth, m.health + m.maxHealth * 0.65 / MACHINE_ASSEMBLE);
        return;
    }
    // THE GUN — both kinds shoot the nearest of your units in range.
    const tgt = _machineTarget(m, D.range);
    if (tgt) {
        const want = Math.atan2(tgt.y - m.y, tgt.x - m.x);
        let diff = want - m._aim; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
        m._aim += diff * 0.2;
        if (frame >= m._fireAt && Math.abs(diff) < 0.4 && typeof spawnFollowerProjectile === "function") {
            m._fireAt = frame + D.every; m._recoil = 8;
            spawnFollowerProjectile({ x: m.x + Math.cos(m._aim) * 0.4, y: m.y + Math.sin(m._aim) * 0.4, stats: { specialAttack: m.power } },
                                    tgt, MACHINE_RED, m.power, 4, null);
            if (followerProjectiles.length) followerProjectiles[followerProjectiles.length - 1].targetsGreen = true;
        }
    }
    if (m._recoil > 0) m._recoil--;
    if (m.machineKind !== "strider") return;
    // THE STRIDER walks onto your nearest held nest and drains it.
    const held = _heldNests();
    let t = m._raidTarget;
    if (!t || !nestIsPowerSource(t)) {
        t = null; let bd = Infinity;
        for (const n of held) { const d = Math.hypot(n.x - m.x, n.y - m.y); if (d < bd) { bd = d; t = n; } }
        m._raidTarget = t;
    }
    if (!t) { m._raidSiphoning = null; return; }
    const tm = raidMouth(t), d = _predatorWalk(m, tm.x, tm.y, 1);
    if (d > RAID_REACH) { m._raidSiphoning = null; return; }
    if (!m._raidSiphoning) _raidBanner("⚠ A STRIDER IS DRAINING YOUR ZONE " + raidZoneOf(t) + " NEST");
    m._raidSiphoning = t;
    m._drain = (m._drain || 0) + 1;
    if (m._drain >= D.drainEvery) {
        m._drain = 0;
        if (shardCount >= 1) {
            shardCount -= 1; m.drained = (m.drained || 0) + 1;
            if (typeof saveShards === "function") saveShards();
            _raidText(t.x, t.y + 1, "−1 ◆", "#ff7a6a", 11);
            // Straight back to the nest that built it, toward the next machine.
            if (m._home && m._home.nestHealth > 0) { m._home.stolenStock = (m._home.stolenStock || 0) + 1; raidNestBuild(m._home); }
        }
    }
}

// Called by onPredatorDeath before its drops. True: nothing else drops.
function raidOnDeath(p) {
    if (p.raider) raidRecover(p);
    if (!p.isMachine) return false;
    const D = MACHINE_DEFS[p.machineKind] || MACHINE_DEFS.sentry;
    const n = D.salvage + Math.floor(raidZoneOf(p) / RAID_TAKE_PER_ZONES);
    shardCount += n;
    if (typeof saveShards === "function") saveShards();
    _raidText(p.x, p.y, D.label + " DESTROYED · SALVAGE +" + n + " ◆", RAID_COLOR, 13);
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: p.x, y: p.y, color: MACHINE_RED, radius: 0.9, life: 26 });
    if (typeof shake !== "undefined") shake = Math.max(shake, 4);
    return true;
}

// ── Once a frame from the game loop ───────────────────────
function raidTick() {
    // A conquered nest's bank is gone with it.
    if (frame % 60 === 0) for (const n of world) if (n.nest && n.stolenStock && !(n.nestHealth > 0)) n.stolenStock = 0;
    if (_raidPending.length) {
        _raidPending = _raidPending.filter(r => {
            if (frame < r.at) return true;
            if (raidThieves().length < RAID_MAX_LIVE && r.nest.nestHealth > 0 &&
                !(typeof predatorBudgetFull === "function" && predatorBudgetFull())) spawnThief(r.nest);
            return false;
        });
    }
    if (!raidQuiet()) return;
    if (_raidTimer > 0) { _raidTimer--; return; }
    _raidTimer = RAID_INTERVAL_MIN + Math.floor(Math.random() * (RAID_INTERVAL_MAX - RAID_INTERVAL_MIN));
    const free = RAID_MAX_LIVE - raidThieves().length;
    raidSourceNests().slice(0, Math.max(0, free)).forEach((nest, i) => _raidPending.push({ nest, at: frame + i * RAID_STAGGER }));
}

function clearRaids() { _raidTimer = RAID_INTERVAL_MIN; _raidPending = []; }

// ── Save ──────────────────────────────────────────────────
function serialiseRaids() {
    return {
        stock: world.filter(t => t.nest && t.stolenStock > 0).map(t => ({ x: t.x, y: t.y, s: t.stolenStock })),
        machines: actors.filter(a => a.isMachine && !a.dead && a._home).map(m => ({
            k: m.machineKind, x: +m.x.toFixed(2), y: +m.y.toFixed(2), hp: Math.round(m.health), a: m._assemble || 0,
            nx: m._home.x, ny: m._home.y })),
    };
}
function restoreRaids(r) {
    if (!r || typeof getTile !== "function") return;
    if (Array.isArray(r.stock)) for (const n of r.stock) {
        const t = getTile(n.x, n.y);
        if (t && t.nest && Number.isFinite(n.s)) t.stolenStock = Math.max(0, n.s);
    }
    if (Array.isArray(r.machines)) for (const s of r.machines) {
        const nest = getTile(s.nx, s.ny);
        if (!nest || !nest.nest || !MACHINE_DEFS[s.k]) continue;
        const m = spawnMachine(s.k, nest, s.k === "sentry" ? { x: s.x, y: s.y } : null);
        if (!m) continue;
        if (s.k === "strider") { m.x = s.x; m.y = s.y; }
        m._assemble = Math.max(0, s.a | 0);
        if (Number.isFinite(s.hp)) m.health = Math.max(1, Math.min(m.maxHealth, s.hp));
    }
}

// ── Drawing ───────────────────────────────────────────────
// Lines and flat faces, gunmetal and one red eye, no glow (the effects rules).
function _isoBox(c, x, y, hw, h, top, left, right, edge) {
    const hh = hw / 2;
    c.fillStyle = left;  c.beginPath(); c.moveTo(x - hw, y - h); c.lineTo(x, y + hh - h); c.lineTo(x, y + hh); c.lineTo(x - hw, y); c.closePath(); c.fill();
    c.fillStyle = right; c.beginPath(); c.moveTo(x + hw, y - h); c.lineTo(x, y + hh - h); c.lineTo(x, y + hh); c.lineTo(x + hw, y); c.closePath(); c.fill();
    c.fillStyle = top;   c.beginPath(); c.moveTo(x, y - hh - h); c.lineTo(x + hw, y - h); c.lineTo(x, y + hh - h); c.lineTo(x - hw, y - h); c.closePath(); c.fill();
    c.strokeStyle = edge; c.lineWidth = 1;
    c.beginPath(); c.moveTo(x, y - hh - h); c.lineTo(x + hw, y - h); c.lineTo(x + hw, y); c.lineTo(x, y + hh); c.lineTo(x - hw, y); c.lineTo(x - hw, y - h); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(x - hw, y - h); c.lineTo(x, y + hh - h); c.lineTo(x + hw, y - h); c.moveTo(x, y + hh - h); c.lineTo(x, y + hh); c.stroke();
}
// A world direction as a screen direction (the iso squash).
function _isoDir(a) { const dx = Math.cos(a), dy = Math.sin(a); const sx = dx - dy, sy = (dx + dy) / 2, l = Math.hypot(sx, sy) || 1; return [sx / l, sy / l]; }

function drawMachine(m, px, py, c) {
    c = c || ctx;
    const s = MACHINE_DRAW_SCALE * Math.max(1, (m.dimensions ? m.dimensions.width : 30) / 30);
    const building = m._assemble > 0;
    const D = MACHINE_DEFS[m.machineKind] || MACHINE_DEFS.sentry;
    const flash = m.hitFlash > 0;
    const top = flash ? "#8a94a2" : "#3b4450", left = flash ? "#5a6270" : "#232830", right = flash ? "#6a7380" : "#2e353f", edge = "#5b6573";
    c.save();
    if (building) c.globalAlpha = 0.55 + 0.25 * Math.sin((frame || 0) * 0.2);
    c.fillStyle = "rgba(0,0,0,0.35)"; c.beginPath(); c.ellipse(px, py, 19 * s, 8 * s, 0, 0, Math.PI * 2); c.fill();
    const [ax, ay] = _isoDir(m._aim || 0);
    let gunX, gunY;
    if (m.machineKind === "strider") {
        // Four legs from the hull's corners to the floor, stepping in pairs.
        const hullY = py - 24 * s, wc = (m.walkCycle || 0) * 0.05;
        c.strokeStyle = "#1c2027"; c.lineWidth = 2.5 * s; c.lineCap = "round";
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([i, j], k) => {
            const lift = Math.max(0, Math.sin(wc + (k % 2) * Math.PI)) * 5 * s;
            const hx = px + i * 9 * s, hy = hullY + j * 3 * s;
            const fx = px + i * 17 * s + j * 4 * s, fy = py + j * 6 * s - lift;
            const kx = (hx + fx) / 2 + i * 6 * s, ky = Math.min(hy, fy) - 8 * s;
            c.beginPath(); c.moveTo(hx, hy); c.lineTo(kx, ky); c.lineTo(fx, fy); c.stroke();
            c.fillStyle = "#59636f"; c.fillRect(kx - 1.5 * s, ky - 1.5 * s, 3 * s, 3 * s);
        });
        _isoBox(c, px, hullY, 13 * s, 9 * s, top, left, right, edge);
        // The visor: a red slit across the front faces.
        c.strokeStyle = MACHINE_RED; c.lineWidth = 2 * s;
        c.beginPath(); c.moveTo(px - 10 * s, hullY - 5 * s); c.lineTo(px, hullY - 0 * s); c.lineTo(px + 10 * s, hullY - 5 * s); c.stroke();
        // What it has drained, in a tank on its back.
        if (m.drained > 0) { c.fillStyle = RAID_COLOR; c.beginPath(); c.moveTo(px, hullY - 22 * s); c.lineTo(px + 4 * s, hullY - 17 * s); c.lineTo(px, hullY - 12 * s); c.lineTo(px - 4 * s, hullY - 17 * s); c.closePath(); c.fill(); }
        gunX = px; gunY = hullY + 2 * s;
    } else {
        // SENTRY: a squat armoured block, a drum on top, twin barrels.
        _isoBox(c, px, py, 15 * s, 12 * s, top, left, right, edge);
        c.strokeStyle = "rgba(255,59,48,0.7)"; c.lineWidth = 1.5 * s;
        c.beginPath(); c.moveTo(px - 11 * s, py - 6 * s); c.lineTo(px - 5 * s, py - 3 * s); c.moveTo(px + 5 * s, py - 3 * s); c.lineTo(px + 11 * s, py - 6 * s); c.stroke();
        const dy = py - 14 * s;
        c.fillStyle = flash ? "#7a8390" : "#333a44"; c.fillRect(px - 8 * s, dy - 9 * s, 16 * s, 9 * s);
        c.fillStyle = flash ? "#9aa3b0" : "#444d59"; c.beginPath(); c.ellipse(px, dy - 9 * s, 8 * s, 4 * s, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = flash ? "#7a8390" : "#333a44"; c.beginPath(); c.ellipse(px, dy, 8 * s, 4 * s, 0, 0, Math.PI); c.fill();
        c.strokeStyle = edge; c.lineWidth = 1; c.beginPath(); c.ellipse(px, dy - 9 * s, 8 * s, 4 * s, 0, 0, Math.PI * 2); c.stroke();
        gunX = px; gunY = dy - 5 * s;
    }
    // Barrels, pulled back by the recoil.
    if (!building) {
        const len = (14 - (m._recoil || 0) * 0.6) * s, nx = -ay, ny = ax;
        c.strokeStyle = "#15181d"; c.lineWidth = 3 * s; c.lineCap = "butt";
        c.beginPath();
        c.moveTo(gunX + nx * 2.5 * s, gunY + ny * 2.5 * s); c.lineTo(gunX + nx * 2.5 * s + ax * len, gunY + ny * 2.5 * s + ay * len);
        c.moveTo(gunX - nx * 2.5 * s, gunY - ny * 2.5 * s); c.lineTo(gunX - nx * 2.5 * s + ax * len, gunY - ny * 2.5 * s + ay * len);
        c.stroke();
        // The eye, brighter just before it fires.
        const ready = Math.max(0, 1 - Math.max(0, (m._fireAt || 0) - (frame || 0)) / D.every);
        c.fillStyle = MACHINE_RED; c.globalAlpha *= 0.5 + 0.5 * ready;
        c.beginPath(); c.arc(gunX + ax * 4 * s, gunY + ay * 4 * s, 2.6 * s, 0, Math.PI * 2); c.fill();
    } else {
        // Scaffold: bare uprights round it while it is put together.
        c.strokeStyle = "#ff9966"; c.lineWidth = 1;
        c.beginPath();
        for (const ox of [-16, -6, 6, 16]) { c.moveTo(px + ox * s, py + 2 * s); c.lineTo(px + ox * s, py - 38 * s); }
        c.stroke();
    }
    c.restore();
    const barY = py - (m.machineKind === "strider" ? 52 : 44) * s;
    if (typeof drawHealthBar === "function") drawHealthBar(px - 18 * s, barY, 36 * s, 4, m.health, m.maxHealth, c);
    c.save();
    c.font = "bold 8px monospace"; c.textAlign = "center"; c.textBaseline = "alphabetic";
    c.fillStyle = building ? "#ff9966" : "#ff8a80";
    c.fillText(building ? "ASSEMBLING " + D.label + " " + Math.floor((1 - m._assemble / MACHINE_ASSEMBLE) * 100) + "%" : D.label, px, barY - 3);
    c.restore();
}

// Over the thief: the shards it is carrying, or a THIEF tag on the way in.
function drawThiefTag(p, px, py) {
    if (!p.raider) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const bob = Math.sin((frame || 0) * 0.15) * 2, y = py - 48 + bob;
    ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (p.stolen > 0) {
        ctx.fillStyle = RAID_COLOR;
        ctx.beginPath(); ctx.moveTo(px, y - 6); ctx.lineTo(px + 5, y); ctx.lineTo(px, y + 6); ctx.lineTo(px - 5, y); ctx.closePath(); ctx.fill();
        ctx.fillText(p.stolen + " ◆", px, y - 12);
    } else {
        ctx.fillStyle = RAID_COLOR; ctx.fillText("THIEF", px, y);
    }
    ctx.restore();
}

// Siphon beams from your nest's mouth to whatever is draining it, and the
// thief's progress over the nest. Drawn screen-space after the world.
function drawRaidOverlay() {
    const W = canvas.width, H = canvas.height;
    const scr = (x, y) => [(x - player.visualX - (y - player.visualY)) * TILE_W + W / 2,
                           (x - player.visualX + (y - player.visualY)) * TILE_H + H / 2];
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const a of actors) {
        const t = a._raidSiphoning;
        if (!t || a.dead) continue;
        // From the vortex on the wall (drawNestWallVortex's centre) to the drinker.
        const [tx, ty] = scr(t.x, t.y), [ux, uy] = scr(a.x, a.y);
        const nx = tx + TILE_W, ny = ty + 30 - (typeof NEST_WALL_H === "number" ? NEST_WALL_H : 110) / 2;
        if (Math.max(nx, ux) < -40 || Math.min(nx, ux) > W + 40) continue;
        ctx.strokeStyle = RAID_COLOR; ctx.lineWidth = 2; ctx.setLineDash([6, 5]); ctx.lineDashOffset = -((frame || 0) % 11);
        ctx.beginPath(); ctx.moveTo(nx, ny); ctx.lineTo(ux, uy - (a.isMachine ? 40 * MACHINE_DRAW_SCALE : 18)); ctx.stroke();
        ctx.setLineDash([]);
        if (a.raider) {
            const f = Math.min(1, (a._raidProgress || 0) / RAID_SIPHON_FRAMES), w = 40, bx = nx - w / 2, by = ny - 58;
            ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(bx - 1, by - 1, w + 2, 6);
            ctx.fillStyle = RAID_COLOR; ctx.fillRect(bx, by, w * f, 4);
            ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.fillText("SIPHONING", nx, by - 4);
        }
    }
    ctx.restore();
}
