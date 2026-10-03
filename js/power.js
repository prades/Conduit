// ─────────────────────────────────────────────────────────
//  THE POWER GRID  —  nests are batteries, pylons spend them
// ─────────────────────────────────────────────────────────
// "It's like a life energy level — you need power from the nest to charge the
// equipment on the pylon, and it's a finite amount you can draw from each nest.
// In attack mode it fires a limited amount of energy per shot; in wave mode it
// drains at a constant proportion until it is disconnected from the generator
// or put back on attack mode."
//
// So this is not a rate budget. Each nest holds a POOL with a level you can
// watch go down, and the two abilities take from it in different shapes:
//
//   ATTACK  pays per SHOT. Idle costs nothing. The energy goes into the round,
//           so what the pylon spends is what it hits with.
//   WAVE    pays per FRAME, for as long as it is on, near a fight or not.
//
// The chain a pylon draws along is: pylon → the generator in reach of it → the
// nest linked to that generator. A generator with no nest linked falls back to
// the home portal's own reserve, which is what a new game runs on.
//
// Pools regenerate slowly. "Finite" here means a reserve you can empty and have
// to nurse, not one you can destroy for good — without regen a five-zone map
// would eventually be flat with nothing left to run.

// ── THE POOLS ────────────────────────────────────────────
// How much a nest can hold. Deeper nests are bigger batteries, so pushing
// forward is still what grows the grid.
function nestEnergyMax(t) {
    if (!t || !t.nest) return 0;
    if (typeof isHomePortal === "function" && isHomePortal(t)) return NEST_ENERGY_HOME;
    const zone = Number.isFinite(t.nestZone) ? t.nestZone : 0;
    return NEST_ENERGY_BASE * (1 + NEST_ENERGY_ZONE * Math.max(0, zone));
}

// Is this nest on your side of the fight at all? The home portal always is.
// Everything else has to be TAKEN — its zone cleared, so it has stopped
// spawning — before there is anything of yours to draw out of it.
function nestIsPowerSource(t) {
    if (!t || !t.nest) return false;
    if (typeof isHomePortal === "function" && isHomePortal(t)) return true;
    return !(t.nestHealth > 0);
}

// A nest that has never been touched starts full. Done lazily rather than at
// generation, so a save written before any of this existed comes back with full
// batteries instead of empty ones.
function nestEnergy(t) {
    if (!nestIsPowerSource(t)) return 0;
    if (!Number.isFinite(t.nestEnergy)) t.nestEnergy = nestEnergyMax(t);
    return t.nestEnergy;
}

// Every live pool creeps back up. Called once a frame.
function nestEnergyTick() {
    const nests = (typeof _nestCache !== "undefined" && _nestCache.length)
        ? _nestCache : world.filter(t => t.nest);
    for (const t of nests) {
        if (!nestIsPowerSource(t)) continue;
        const cap = nestEnergyMax(t);
        if (!Number.isFinite(t.nestEnergy)) { t.nestEnergy = cap; continue; }
        if (t.nestEnergy < cap) t.nestEnergy = Math.min(cap, t.nestEnergy + NEST_ENERGY_REGEN);
    }
}

// ── THE CHAIN ────────────────────────────────────────────
// The generator carrying power to this pylon, or null. The grid reaches exactly
// as far as a generator's link does — the same range the healing aura and the
// network links already use, rather than a new one to learn.
function generatorFeeding(t) {
    if (!t || typeof _genPylons === "undefined") return null;
    const r = getPylonRange();
    let best = null, bestD = r * r;
    for (const gen of _genPylons) {
        if (gen === t) continue;
        const dx = gen.x - t.x, dy = gen.y - t.y;
        const d2 = dx * dx + dy * dy;
        if (d2 <= bestD) { bestD = d2; best = gen; }
    }
    return best;
}

// The home portal — the nest labelled CRYSTAL. Looked up in the nest cache when
// there is one: this is asked per generator per frame by the wiring.
function homePortalTile() {
    const list = (typeof _nestCache !== "undefined" && _nestCache.length) ? _nestCache : world;
    for (const t of list) if (typeof isHomePortal === "function" && isHomePortal(t)) return t;
    return null;
}

// The nest a generator draws out of: the one LINKED to it, or — only if it
// stands near home — the home portal's own reserve.
//
// REPORTED: "the power level from the crystal should not shoot across the map.
// From the crystal it should only hit the generators that are nearby it."
//
// The fallback used to be unconditional, so a generator on the far side of the
// map with nothing linked to it drew on the home reserve, and the wiring drew a
// beam from the Crystal all the way out to it. The fallback is what keeps a new
// game running — the first generator you build works before you have taken
// anything — and that generator is built beside home, so it keeps working. A
// generator out in a zone has to be wired to a nest of its own.
function generatorSource(gen) {
    if (!gen || !isGeneratorPylon(gen)) return null;
    const linked = gen.nestConnection;
    if (linked && nestIsPowerSource(linked)) return linked;
    const home = homePortalTile();
    if (home && Math.hypot(home.x - gen.x, home.y - gen.y) <= HOME_POWER_REACH) return home;
    return null;
}

// Can this nest be CONNECTED to a generator? A taken nest, or the home portal —
// anything that is a power source — as long as it is not already wired to a
// live generator. The home portal is never "taken", so asking whether its health
// had run out is what kept CONNECT off it.
function nestCanConnect(n) {
    if (!n || !nestIsPowerSource(n)) return false;
    return !(n.connectedPylon && !n.connectedPylon.destroyed);
}

// The pool this pylon spends out of, or null if nothing reaches it.
function pylonSource(t) {
    const gen = generatorFeeding(t);
    return gen ? generatorSource(gen) : null;
}

// Take `amount` out of a pool. Returns true only if the whole amount was there,
// so a shot is either paid for in full or not fired — a half-price round that
// did half damage would be a third rule nobody asked for.
function spendNestEnergy(nest, amount) {
    if (!nest || !(amount > 0)) return false;
    if (nestEnergy(nest) < amount + POWER_MIN_RESERVE) return false;
    nest.nestEnergy -= amount;
    return true;
}

// ── WHO IS LIT ───────────────────────────────────────────
// Sets `powered` on every pylon, so the firing loop, the wave loop and the
// drawing all ask one flag rather than working the rule out again.
//
// Being powered means "there is a pool reaching me with something in it". What
// it costs to USE that is charged separately, at the moment of use: per shot
// for a turret, per frame for a wave pylon.
function recomputePower() {
    _powerPools = [];
    if (typeof _pillarCache === "undefined") return;
    for (const t of _pillarCache) {
        if (!needsPower(t)) { t.powered = true; t.powerSource = null; t.powerGen = null; continue; }
        // BOTH ends of the chain are remembered, not just the nest. The wiring
        // is drawn along pylon → generator → nest, and working the middle out
        // again at draw time would be a second copy of the routing rule.
        const gen = generatorFeeding(t);
        t.powerGen    = gen;
        t.powerSource = gen ? generatorSource(gen) : null;
        t.powered = !!t.powerSource && nestEnergy(t.powerSource) > POWER_MIN_RESERVE;
    }
    // The pools worth showing: every one something is drawing on, plus home.
    const seen = new Set();
    for (const t of _pillarCache) {
        if (t.powerSource && !seen.has(t.powerSource)) { seen.add(t.powerSource); _powerPools.push(t.powerSource); }
    }
}

// Does this pylon spend anything at all? A plain pylon still stands, still
// holds territory, still takes a healing aura, and costs nothing. A generator
// is the thing carrying the power, not a thing spending it.
function needsPower(t) {
    if (!t || !t.pillar || t.destroyed || !(t.health > 0)) return false;
    if (t.pillarTeam !== "green") return false;
    if (t.isGenerator) return false;
    return !!(t.waveMode || t.attackMode);
}

// ── SPENDING ─────────────────────────────────────────────
// A turret's round. Called where the shot is fired, so an idle turret with
// nothing in range costs nothing at all.
function payForShot(t) {
    if (!t) return false;
    const src = t.powerSource || pylonSource(t);
    if (!src) return false;
    if (!spendNestEnergy(src, POWER_SHOT_COST)) return false;
    // A SURGE down the wire. A turret's draw is a spike, not a trickle, and the
    // wiring is the only place the player can see which pylons are costing
    // them — so the round that was just paid for lights its own line.
    t.powerFlow = 1;
    if (src) src.powerFlow = 1;
    return true;
}

// How hard this pylon is pulling right now, 0..1, for the wiring to draw.
// Wave mode is pinned at full while it is on, because its draw never stops; a
// turret spikes on each round and fades, so an idle turret's line goes quiet
// and the player can see it costing nothing.
function powerFlowOf(t) {
    if (!t || !t.powered) return 0;
    if (t.waveMode) return 1;
    return Math.max(0, t.powerFlow || 0);
}

// Fade the spikes. Called once a frame with the rest of the grid.
function powerFlowTick() {
    if (typeof _pillarCache === "undefined") return;
    for (const t of _pillarCache) {
        if (t.powerFlow > 0) t.powerFlow = Math.max(0, t.powerFlow - POWER_FLOW_FADE);
        if (t.waveMode && t.powered && !t.isGenerator && t.pillarTeam === "green") {
            t.powerFlow = 1;
            if (t.powerSource) t.powerSource.powerFlow = 1;
        }
    }
    const nests = (typeof _nestCache !== "undefined") ? _nestCache : [];
    for (const n of nests) {
        if (n.powerFlow > 0) n.powerFlow = Math.max(0, n.powerFlow - POWER_FLOW_FADE);
    }
}

// Wave mode's constant draw, once a frame per wave pylon. Switching back to
// attack mode or losing the generator is what stops it — there is nothing else
// to turn off.
function waveDrainTick() {
    if (typeof _pillarCache === "undefined") return;
    for (const t of _pillarCache) {
        if (!t.waveMode || t.isGenerator || t.pillarTeam !== "green") continue;
        const src = t.powerSource || pylonSource(t);
        if (!src) { t.powered = false; continue; }
        if (!spendNestEnergy(src, POWER_WAVE_DRAIN)) {
            // The pool is flat. It stays switched on and starts again by itself
            // as the nest creeps back up, which is what makes a drained grid
            // something you nurse rather than something you have to re-set.
            t.powered = false;
        }
    }
}

// ── THE READOUT ──────────────────────────────────────────
// What the HUD says, so the panel and the rule cannot disagree.
function powerStatus() {
    const pools = (_powerPools || []).map(t => ({
        nest: t,
        zone: Number.isFinite(t.nestZone) ? t.nestZone : 0,
        home: typeof isHomePortal === "function" && isHomePortal(t),
        energy: Math.max(0, Math.round(nestEnergy(t))),
        max: nestEnergyMax(t),
    }));
    let dark = 0, drawing = 0;
    if (typeof _pillarCache !== "undefined") {
        for (const t of _pillarCache) {
            if (!needsPower(t)) continue;
            drawing++;
            if (t.powered === false) dark++;
        }
    }
    return { pools, drawing, dark, flat: pools.filter(p => p.energy <= 0).length };
}
