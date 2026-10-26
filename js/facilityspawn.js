// ─────────────────────────────────────────────────────────
//  THE ARENA'S CREATURES (docs/TUTORIAL.md, "The arena's creatures")
// ─────────────────────────────────────────────────────────
// The arena is where the facility's wild things are. A few are there when the game opens, and every so often another comes out of the dark at a different spot, so it is never empty and never full:
//   - one at a time, FP_SPAWN.every frames apart, up to FP_SPAWN.cap alive at once;
//   - at a random spot on the arena floor that is out of sight and out of reach of the player and not on top of another creature;
//   - always the kind there are fewest of, so they are all different: ants, beetles, spiders, scorpions, mantises and moths (js/species.js), each in a class of its own;
//   - they WANDER: pottering about the arena from spot to spot (never out of it), and only hunt when provoked or when an alarm is up.
// Each is made by spawnCreature (js/clone.js); js/predator.js asks facilityWanderTarget for its next spot.
// A creature that dies drops SCRAP METAL where it fell (js/drops.js calls facilityScrapDrop): a case that lies there for a minute, which the Armory's terminal turns into ammunition (js/weapons.js).
const FP_SPAWN = {
    room: "arena", every: 1200, first: 480, start: 4, cap: 7, minFromPlayer: 11, spacing: 4,
    species: ["ant", "beetle", "spider", "scorpion", "mantis", "moth"], classes: { scout: 3, worker: 3, striker: 2, tank: 1 }, levels: [2, 4],
    wander: [3, 9],
    scrap: { chance: 0.75, byClass: { scout: 1, worker: 1, striker: 2, tank: 3 }, life: 3600 },
};

function _fsArenaCells() {
    if (!_fp) return [];
    if (!_fp.spawnCells) { _fp.spawnCells = []; for (const [k, c] of _fp.cellsP) { const r = facilityRoomAt(c[0], c[1], _fp.F); if (r && r.id === FP_SPAWN.room) _fp.spawnCells.push(c); } }
    return _fp.spawnCells;
}
function facilityCreatures() { return actors.filter(a => a && a.fpCreature && !a.dead); }
// a class of the species, by the weights (never a nymph or a boss)
function _fsPickClass(sp) {
    const def = SPECIES[sp]; if (!def) return null;
    const have = Object.keys(FP_SPAWN.classes).filter(c => def[c] && def[c].width); if (!have.length) return null;
    let t = 0; for (const c of have) t += FP_SPAWN.classes[c]; let r = Math.random() * t; for (const c of have) { r -= FP_SPAWN.classes[c]; if (r <= 0) return c; }
    return have[0];
}
// the kind there are fewest of (a random one of those, so it is not always the same order)
function _fsPickSpecies(alive) {
    const n = {}; for (const s of FP_SPAWN.species) n[s] = 0; for (const a of alive) if (n[a.speciesName] !== undefined) n[a.speciesName]++;
    const least = Math.min(...FP_SPAWN.species.map(s => n[s])), pool = FP_SPAWN.species.filter(s => n[s] === least);
    return pool[Math.floor(Math.random() * pool.length)];
}
// a spot on the arena floor: far enough from the player, out of the player's sight, and away from the other creatures; the farthest of a few tries if none is perfect
function facilitySpawnSpot() {
    const cells = _fsArenaCells(); if (!cells.length) return null;
    const others = facilityCreatures(); let best = null, bs = -1;
    for (let i = 0; i < 30; i++) {
        const c = cells[Math.floor(Math.random() * cells.length)], dp = Math.hypot(c[0] - player.visualX, c[1] - player.visualY);
        let dn = 99; for (const o of others) dn = Math.min(dn, Math.hypot(c[0] - o.x, c[1] - o.y));
        const seen = typeof _fpLos === "function" && _fpLos(player.visualX, player.visualY, c[0], c[1]);
        const score = Math.min(dp, FP_SPAWN.minFromPlayer) * 2 + Math.min(dn, FP_SPAWN.spacing) * 2 + (seen ? 0 : 6);
        if (dp >= FP_SPAWN.minFromPlayer && dn >= FP_SPAWN.spacing && !seen) return c;
        if (score > bs) { bs = score; best = c; }
    }
    return best;
}
// one creature: of a species there are fewest of, at a spot, wandering
function facilitySpawnCreature(species, spot) {
    if (typeof spawnCreature !== "function") return null;
    const alive = facilityCreatures(); species = species || _fsPickSpecies(alive); spot = spot || facilitySpawnSpot(); if (!spot) return null;
    const cls = _fsPickClass(species); if (!cls) return null;
    const level = FP_SPAWN.levels[0] + Math.floor(Math.random() * (FP_SPAWN.levels[1] - FP_SPAWN.levels[0] + 1));
    let p = null; try { p = spawnCreature({ species, className: cls, x: spot[0], y: spot[1], level, state: "wander" }); } catch (e) { return null; }
    if (!p) return null;
    p.wanderTarget = null; p.wanderTimer = Math.random() * 60; p.fpCreature = true; p.homeRoom = FP_SPAWN.room;
    return p;
}
// when the game opens: a handful, each a different kind
function facilitySpawnInitial() {
    _fp.spawnAt = (typeof frame !== "undefined" ? frame : 0) + FP_SPAWN.first;
    for (let i = 0; i < FP_SPAWN.start; i++) facilitySpawnCreature();
}
// each frame (from facilityTutorialTick): the next one when it is time and there is room
function facilitySpawnTick() {
    if (!_fp || !_fp.cellsP) return;
    const f = typeof frame !== "undefined" ? frame : 0;
    if (_fp.spawnAt === undefined) _fp.spawnAt = f + FP_SPAWN.first;
    // the scrap cases left on the floor go after a while
    if (f % 60 === 0 && _fp.items) _fp.items = _fp.items.filter(i => !(i.fp === "pickup" && i.temp && (i.taken || f > i.expires)));
    if (f < _fp.spawnAt) return;
    _fp.spawnAt = f + FP_SPAWN.every;
    if (facilityCreatures().length < FP_SPAWN.cap) facilitySpawnCreature();
}

// where a creature in the facility wanders to next: a spot of its home room in sight of it, 3 to 9 tiles off (or, shut in by props with none in sight, one it can walk to by the route; the nearest floor of the room when it is not in it)
function facilityWanderTarget(a) {
    const home = a.homeRoom || FP_SPAWN.room, cells = _fp ? _fsArenaCells() : []; if (!cells.length || home !== FP_SPAWN.room) return { x: a.x, y: a.y };
    for (let i = 0; i < 24; i++) {
        const c = cells[Math.floor(Math.random() * cells.length)], d = Math.hypot(c[0] - a.x, c[1] - a.y);
        if (d < FP_SPAWN.wander[0] || d > FP_SPAWN.wander[1]) continue; if (typeof _fpLos === "function" && !_fpLos(a.x, a.y, c[0], c[1])) continue;
        return { x: c[0], y: c[1] };
    }
    // none in sight (a pocket between the props): a spot of the arena a little further off that it can walk to by the route (predator.js walks a wander target by facilitySteer)
    { const cm = typeof _fpComps === "function" ? _fpComps() : null, here = _fpNearestCell(a.x, a.y), hk = here ? here[0] + "," + here[1] : null;
      for (let i = 0; i < 200 && cm && hk; i++) { const c = cells[Math.floor(Math.random() * cells.length)], d = Math.hypot(c[0] - a.x, c[1] - a.y); if (d < FP_SPAWN.wander[0] || d > FP_SPAWN.wander[1] + 6) continue; if (cm.get(c[0] + "," + c[1]) !== cm.get(hk)) continue; return { x: c[0], y: c[1] }; } }
    // none at all: the nearest spot it can see, else it stays where it is
    let best = null, bd = 1e9; for (const c of cells) { const d = Math.hypot(c[0] - a.x, c[1] - a.y); if (d > 1 && d < bd && (typeof _fpLos !== "function" || _fpLos(a.x, a.y, c[0], c[1]))) { bd = d; best = c; } }
    return best ? { x: best[0], y: best[1] } : { x: a.x, y: a.y };
}

// SCRAP METAL: what a creature leaves (js/drops.js onPredatorDeath)
function facilityScrapDrop(p) {
    if (typeof facilityPlay === "undefined" || !facilityPlay || !_fp || !_fp.items || !p || p.team === "green" || p.isClone) return null;
    const S = FP_SPAWN.scrap, n = S.byClass[p.className] || 1; if (Math.random() > S.chance) return null;
    const room = facilityRoomAt(p.x, p.y, _fp.F); if (!room) return null;
    const f = typeof frame !== "undefined" ? frame : 0, it = _fpPickupItem({ id: "drop_" + (_fp.dropN = (_fp.dropN || 0) + 1), room: room.id, at: [p.x, p.y], items: [["scrap_metal", n]] });
    it.temp = true; it.expires = f + S.life; it.arrive = f; _fp.items.push(it); return it;
}
