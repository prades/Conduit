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
// REPORTED: "fire should do little damage to the jellies, electric is good
// against them." Every hit on a machine is scaled by its element here
// (applyDamage calls machineElementMult); anything not listed lands as normal.
const MACHINE_ELEMENT_MULT = { fire: 0.25, electric: 2 };
const MACHINE_ELEMENT_SAY  = 45;    // frames between RESIST / SHOCKED callouts on one machine
const MACHINE_DRAW_SCALE = 1.7;    // drawn big: it is a structure, not one more bug
const RAID_COLOR    = "#5ff0ff";    // stolen shards, siphon beams
const MACHINE_RED   = "#ff3b30";   // its body colour in the predator record; the look is GOO below

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
                                    tgt, GOO.spit, m.power, 4, null);
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

function machineElementMult(m, el) {
    const k = (el && MACHINE_ELEMENT_MULT[el]) || 1;
    if (k !== 1 && m && (m._elSaidAt === undefined || frame - m._elSaidAt >= MACHINE_ELEMENT_SAY)) {
        m._elSaidAt = frame;
        _raidText(m.x, m.y, k < 1 ? "FIRE RESISTED" : "SHOCKED \u00d7" + k, k < 1 ? "#ffb070" : "#ffee33", 11);
    }
    return k;
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
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: p.x, y: p.y, color: GOO.spit, radius: 0.9, life: 26 });
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
// REPORTED: "the predator machinery should look like goo. It should look like
// octopuses and other gooey instances that look 3D and have that little glint
// of reflective sheen." So a machine is living slime, not gunmetal: a glossy
// mantle shaded from a lit top-left down to a dark underside, tapering
// tentacles with a wet highlight along their top edge, and a white specular
// glint. Filled shapes, no glow (the effects rules).
// Then: "I don't want the blob machinery tech to have eyes or any nozzles
// coming out of their head ... it needs to look alien." From a lineup of eight
// of each, the Sentry is the AMOEBOID and the Strider the BELL WALKER.
// OIL SLICK (picked from a lineup of eight colour schemes): near-black goo
// with a rainbow sheen — lilac, teal, violet — sliding over its lit side.
const GOO = { dark: "#07060f", base: "#2b3466", light: "#e9c8ff", rim: "#020208",
              flash: "#8a96d0", spit: "#c779ff", organ: "#7fe6d8", label: "#d6a8ff",
              stops: [[0, "#f6e2ff"], [0.18, "#86e8da"], [0.34, "#b86bff"], [0.55, "#2b3466"], [1, "#07060f"]] };
function _gooRgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
// The sheen's stops, made see-through for the bell (by band: lit, middle, dark).
function _gooStops(g, flash, alphas) {
    for (const [t, col0] of GOO.stops) {
        const col = flash && t === 0.55 ? GOO.flash : col0;
        g.addColorStop(t, alphas ? _gooRgba(col, alphas[t <= 0.2 ? 0 : t < 0.9 ? 1 : 2]) : col);
    }
    return g;
}

// A world direction as a screen direction (the iso squash).
function _isoDir(a) { const dx = Math.cos(a), dy = Math.sin(a); const sx = dx - dy, sy = (dx + dy) / 2, l = Math.hypot(sx, sy) || 1; return [sx / l, sy / l]; }

// A tentacle: a quadratic curve from (x0,y0) through control (cx,cy) to
// (x1,y1), filled as a ribbon that tapers from w0 to w1, then a thin wet
// highlight along one side so it reads as round.
function _gooTentacle(c, x0, y0, cx, cy, x1, y1, w0, w1, fill, shine) {
    const N = 10, L = [], R = [];
    for (let i = 0; i <= N; i++) {
        const t = i / N, u = 1 - t;
        const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
        const dx = 2 * u * (cx - x0) + 2 * t * (x1 - cx), dy = 2 * u * (cy - y0) + 2 * t * (y1 - cy);
        const l = Math.hypot(dx, dy) || 1, w = (w0 + (w1 - w0) * t) / 2;
        L.push([x - dy / l * w, y + dx / l * w]); R.push([x + dy / l * w, y - dx / l * w]);
    }
    c.fillStyle = fill;
    c.beginPath(); c.moveTo(L[0][0], L[0][1]);
    for (const q of L) c.lineTo(q[0], q[1]);
    for (let i = R.length - 1; i >= 0; i--) c.lineTo(R[i][0], R[i][1]);
    c.closePath(); c.fill();
    c.strokeStyle = shine; c.lineWidth = Math.max(0.8, w0 * 0.22); c.lineCap = "round";
    c.beginPath(); c.moveTo(R[1][0], R[1][1]);
    for (let i = 2; i < R.length - 2; i++) c.lineTo(R[i][0], R[i][1]);
    c.stroke();
}
// The glossy body: a radial gradient lit from the top-left.
function _gooFill(c, cx, cy, r, flash) {
    const g = c.createRadialGradient(cx - r * 0.35, cy - r * 0.45, r * 0.08, cx, cy, r * 1.15);
    return _gooStops(g, flash);
}
// The sheen: a white streak and a pin-point, top-left of the dome.
function _gooGlint(c, cx, cy, r) {
    c.save();
    c.fillStyle = "rgba(255,255,255,0.85)";
    c.beginPath(); c.ellipse(cx - r * 0.38, cy - r * 0.42, r * 0.26, r * 0.12, -0.6, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(cx - r * 0.05, cy - r * 0.62, r * 0.06, 0, Math.PI * 2); c.fill();
    c.strokeStyle = "rgba(255,255,255,0.22)"; c.lineWidth = Math.max(1, r * 0.08);
    c.beginPath(); c.ellipse(cx, cy, r * 0.82, r * 0.82, 0, Math.PI * 1.05, Math.PI * 1.45); c.stroke();
    c.restore();
}

function drawMachine(m, px, py, c) {
    c = c || ctx;
    const s = MACHINE_DRAW_SCALE * Math.max(1, (m.dimensions ? m.dimensions.width : 30) / 30);
    const D = MACHINE_DEFS[m.machineKind] || MACHINE_DEFS.sentry;
    const building = m._assemble > 0, grow = building ? 1 - m._assemble / MACHINE_ASSEMBLE : 1;
    const flash = m.hitFlash > 0, f = frame || 0, seed = (m._anchorX || 0) * 7.1;
    const fill = flash ? GOO.flash : GOO.base, shine = _gooRgba(GOO.light, 0.75);
    const [ax, ay] = _isoDir(m._aim || 0);
    c.save();
    // A wet puddle under the rooted one — the goo it is made of; a shadow
    // under the walker (a puddle while it is still growing).
    if (m.machineKind === "strider" && !building) {
        c.fillStyle = "rgba(0,0,0,0.38)"; c.beginPath(); c.ellipse(px, py, 20 * s, 8 * s, 0, 0, Math.PI * 2); c.fill();
    } else {
        c.fillStyle = _gooRgba(GOO.dark, 0.6);
        c.beginPath(); c.ellipse(px, py, (20 + 3 * Math.sin(f * 0.05 + seed)) * s, 8.5 * s, 0, 0, Math.PI * 2); c.fill();
        c.fillStyle = _gooRgba(GOO.light, 0.22);
        c.beginPath(); c.ellipse(px - 7 * s, py - 2 * s, 5 * s, 1.4 * s, -0.15, 0, Math.PI * 2); c.fill();
    }
    // Assembling: it heaves up out of the puddle.
    if (building) {
        c.translate(px, py); c.scale(0.55 + 0.45 * grow, 0.25 + 0.75 * grow); c.translate(-px, -py);
        c.strokeStyle = _gooRgba(GOO.light, 0.7); c.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
            const t = ((f * 0.02 + i / 3) % 1), bx = px + (i - 1) * 8 * s;
            c.beginPath(); c.arc(bx, py - t * 40 * s, (1.5 + 1.5 * (1 - t)) * s, 0, Math.PI * 2); c.stroke();
        }
    }
    const wob = 1 + 0.05 * Math.sin(f * 0.09 + seed);
    if (m.machineKind === "strider") {
        // THE BELL WALKER (picked from the lineup, W2): a see-through bell
        // drifting on long ribbon tentacles that reach down to the floor and
        // step, its ring organs and the shards it has drained showing through.
        // No eyes, nothing on top. It shoots from under the bell.
        const walk = (m.walkCycle || 0) * 3.3 + f * 0.4;   // it sways even standing still
        const step = k => Math.max(0, Math.sin(walk * 0.09 + k * Math.PI * 2 / 3));
        const by = py - 46 * s + Math.sin(walk * 0.09) * 3 * s, R = 17 * s;
        for (let k = 0; k < 7; k++) {
            const a = (k / 7) * Math.PI * 2, sway = Math.sin(walk * 0.09 + k) * 5 * s;
            const fx = px + Math.cos(a) * 14 * s + sway, fy = py + Math.sin(a) * 6 * s - step(k) * 4 * s;
            _gooTentacle(c, px + Math.cos(a) * R * 0.75, by + 4 * s + Math.sin(a) * 3 * s, px + Math.cos(a) * 20 * s - sway, by + 24 * s, fx, fy,
                         3.2 * s, 0.6 * s, _gooRgba(flash ? GOO.flash : GOO.base, 0.85), _gooRgba(GOO.light, 0.55));
        }
        // Inside: four ring organs, and what it has drained.
        c.strokeStyle = _gooRgba(GOO.organ, 0.75); c.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const a = i / 4 * Math.PI * 2 + f * 0.01;
            c.beginPath(); c.ellipse(px + Math.cos(a) * 6 * s, by - 6 * s + Math.sin(a) * 3 * s, 3.5 * s, 2.2 * s, a, 0, Math.PI * 2); c.stroke();
        }
        if (m.drained > 0) {
            const dy = by - 7 * s, r = 3 * s;
            c.globalAlpha *= 0.8; c.fillStyle = RAID_COLOR;
            c.beginPath(); c.moveTo(px, dy - r * 1.2); c.lineTo(px + r, dy); c.lineTo(px, dy + r * 1.2); c.lineTo(px - r, dy); c.closePath(); c.fill();
            c.globalAlpha /= 0.8;
        }
        // The bell, with its scalloped hem.
        const g = c.createRadialGradient(px - R * 0.3, by - R * 0.6, R * 0.1, px, by - R * 0.2, R * 1.2);
        _gooStops(g, flash, flash ? [0.8, 0.6, 0.85] : [0.6, 0.42, 0.85]);
        c.fillStyle = g; c.beginPath(); c.ellipse(px, by, R, R * 0.95 * wob, 0, Math.PI, Math.PI * 2);
        for (let i = 0; i <= 10; i++) { const t = 1 - i / 10; c.lineTo(px + (t * 2 - 1) * R, by + (i % 2 ? 4 : 1.5) * s); }
        c.closePath(); c.fill();
        c.strokeStyle = _gooRgba(GOO.light, 0.6); c.lineWidth = 1.1; c.stroke();
        _gooGlint(c, px, by - 8 * s, R * 0.9);
    } else {
        // THE AMOEBOID SENTRY (picked from the lineup, W7): no legs, no eyes —
        // a fused mass of glossy bubbles rooted in its puddle, always shifting.
        // To fire it throws a pseudopod out toward you, spits from its tip at
        // full reach, and hauls it back in.
        const ready = building ? 0 : Math.max(0, 1 - Math.max(0, (m._fireAt || 0) - f) / D.every);
        const reach = Math.max(ready * ready * 16, ((m._recoil || 0) / 8) * 18) * s;
        const B = [[0, -12, 13], [-9, -6, 9], [9, -8, 9.5], [-3, -22, 8], [6, -18, 7], [-12, -15, 5.5]];
        // A lobe trailing on the far side, and the pseudopod reaching out.
        _gooTentacle(c, px - ax * 8 * s, py - 8 * s - ay * 3 * s, px - ax * 16 * s, py - 6 * s - ay * 6 * s + Math.sin(f * 0.05 + seed) * 2 * s,
                     px - ax * 22 * s, py - 1 * s - ay * 8 * s, 7 * s, 2 * s, fill, shine);
        const sx = px + ax * 8 * s, sy = py - 10 * s + ay * 4 * s, tx = sx + ax * reach, ty = sy + ay * reach;
        if (reach > 1) {
            _gooTentacle(c, sx, sy, (sx + tx) / 2 - ay * 3 * s, (sy + ty) / 2 + ax * 2 * s, tx, ty, 10 * s, 5 * s, fill, shine);
        }
        const order = B.map((b, i) => i).sort((i, j) => B[i][1] - B[j][1]);
        for (const i of order) {
            const [ox, oy, r0] = B[i], ph = f * 0.06 + i * 1.9 + seed;
            const r = r0 * s * (1 + 0.07 * Math.sin(ph)), x = px + (ox + Math.sin(ph * 0.7) * 1.2) * s, y = py + (oy + Math.cos(ph * 0.6) * 0.8) * s;
            c.fillStyle = _gooFill(c, x, y, r, flash);
            c.beginPath(); c.ellipse(x, y, r * wob, r * 0.9 / wob, 0, 0, Math.PI * 2); c.fill();
            c.strokeStyle = GOO.rim; c.lineWidth = 1; c.stroke();
            _gooGlint(c, x, y, r * 0.95);
        }
        // The tip of the pseudopod swells as it is about to spit.
        if (reach > 1) {
            const tr = (4 + 2.5 * ready) * s;
            c.fillStyle = _gooFill(c, tx, ty, tr, flash);
            c.beginPath(); c.ellipse(tx, ty, tr, tr * 0.85, 0, 0, Math.PI * 2); c.fill();
            c.strokeStyle = GOO.rim; c.lineWidth = 1; c.stroke();
            _gooGlint(c, tx, ty, tr, 0.8);
        }
    }
    c.restore();
    const barY = py - (m.machineKind === "strider" ? 68 : 42) * s;
    if (typeof drawHealthBar === "function") drawHealthBar(px - 18 * s, barY, 36 * s, 4, m.health, m.maxHealth, c);
    c.save();
    c.font = "bold 8px monospace"; c.textAlign = "center"; c.textBaseline = "alphabetic";
    c.fillStyle = building ? "#ff9966" : GOO.label;
    c.fillText(building ? "GROWING " + D.label + " " + Math.floor(grow * 100) + "%" : D.label, px, barY - 3);
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
